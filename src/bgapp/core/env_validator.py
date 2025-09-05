"""
Environment Variables Validator - Silicon Valley Grade Security
Implementa validação rigorosa de variáveis de ambiente com fail-fast approach
"""

import os
import sys
from typing import Dict, List, Optional, Set, Any
from enum import Enum
from dataclasses import dataclass
import logging
from pathlib import Path
import re

logger = logging.getLogger(__name__)


class EnvVarLevel(Enum):
    """Níveis de criticidade das variáveis"""
    CRITICAL = "critical"  # App não inicia sem ela
    REQUIRED = "required"  # Funcionalidade core comprometida
    OPTIONAL = "optional"  # Nice to have
    DEPRECATED = "deprecated"  # Será removida


@dataclass
class EnvVarSpec:
    """Especificação de uma variável de ambiente"""
    name: str
    level: EnvVarLevel
    description: str
    default: Optional[str] = None
    validator: Optional[callable] = None
    regex_pattern: Optional[str] = None
    min_length: Optional[int] = None
    allowed_values: Optional[Set[str]] = None
    sensitive: bool = False
    example: str = ""


class EnvValidator:
    """
    Validador de variáveis de ambiente com abordagem fail-fast
    Inspirado em práticas de segurança do Netflix e Uber
    """
    
    # Padrões de validação comuns
    PATTERNS = {
        'url': r'^https?://[\w\-\.]+(:\d+)?(/.*)?$',
        'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        'port': r'^\d{1,5}$',
        'uuid': r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        'jwt': r'^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$',
        'api_key': r'^[A-Za-z0-9_\-]{32,}$',
        'boolean': r'^(true|false|1|0|yes|no)$',
        'ip': r'^(\d{1,3}\.){3}\d{1,3}$',
        'domain': r'^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'
    }
    
    # Variáveis que NUNCA devem ter valores default em produção
    NEVER_DEFAULT_IN_PROD = {
        'JWT_SECRET_KEY',
        'DATABASE_PASSWORD',
        'POSTGRES_PASSWORD',
        'MINIO_SECRET_KEY',
        'NGROK_AUTHTOKEN',
        'API_KEY',
        'SECRET_KEY',
        'PRIVATE_KEY',
        'AUTH_TOKEN'
    }
    
    # Valores que indicam configuração insegura
    INSECURE_VALUES = {
        'password', 'secret', '123456', 'admin', 'test',
        'changeme', 'default', 'example', 'demo'
    }
    
    def __init__(self, environment: str = "development"):
        self.environment = environment
        self.is_production = environment.lower() in ['production', 'prod']
        self.specs: Dict[str, EnvVarSpec] = {}
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self._setup_default_specs()
    
    def _setup_default_specs(self):
        """Define especificações padrão para BGAPP"""
        
        # Segurança Core
        self.add_spec(EnvVarSpec(
            name="JWT_SECRET_KEY",
            level=EnvVarLevel.CRITICAL,
            description="Chave secreta para JWT tokens",
            min_length=32,
            sensitive=True,
            validator=self._validate_jwt_secret,
            example="your-super-secret-jwt-key-min-32-chars"
        ))
        
        # Database
        self.add_spec(EnvVarSpec(
            name="POSTGRES_PASSWORD",
            level=EnvVarLevel.CRITICAL if self.is_production else EnvVarLevel.REQUIRED,
            description="Senha do PostgreSQL",
            min_length=12 if self.is_production else 1,
            sensitive=True,
            validator=self._validate_password_strength
        ))
        
        # Storage
        self.add_spec(EnvVarSpec(
            name="MINIO_SECRET_KEY",
            level=EnvVarLevel.REQUIRED,
            description="MinIO secret key",
            min_length=8,
            sensitive=True,
            validator=self._validate_minio_secret
        ))
        
        # Remote Access
        self.add_spec(EnvVarSpec(
            name="NGROK_AUTHTOKEN",
            level=EnvVarLevel.OPTIONAL,
            description="Token de autenticação NGROK",
            regex_pattern=r'^[a-zA-Z0-9_\-]{20,}$',
            sensitive=True
        ))
        
        # CORS
        self.add_spec(EnvVarSpec(
            name="ALLOWED_ORIGINS",
            level=EnvVarLevel.CRITICAL,
            description="Origens permitidas para CORS",
            default="http://localhost:3000" if not self.is_production else None,
            validator=self._validate_cors_origins
        ))
        
        # Rate Limiting
        self.add_spec(EnvVarSpec(
            name="RATE_LIMIT_ENABLED",
            level=EnvVarLevel.REQUIRED,
            description="Habilitar rate limiting",
            default="true" if self.is_production else "false",
            regex_pattern=self.PATTERNS['boolean']
        ))
        
        # Logging
        self.add_spec(EnvVarSpec(
            name="LOG_LEVEL",
            level=EnvVarLevel.REQUIRED,
            description="Nível de logging",
            default="INFO",
            allowed_values={"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        ))
    
    def add_spec(self, spec: EnvVarSpec):
        """Adiciona especificação de variável"""
        self.specs[spec.name] = spec
    
    def _validate_jwt_secret(self, value: str) -> bool:
        """Valida força da chave JWT"""
        if len(value) < 32:
            self.errors.append(f"JWT_SECRET_KEY deve ter no mínimo 32 caracteres (tem {len(value)})")
            return False
        
        if value in self.INSECURE_VALUES or 'change' in value.lower() or 'example' in value.lower():
            self.errors.append("JWT_SECRET_KEY contém valor inseguro ou placeholder")
            return False
        
        # Verifica entropia básica
        if len(set(value)) < 10:
            self.errors.append("JWT_SECRET_KEY tem baixa entropia (poucos caracteres únicos)")
            return False
        
        return True
    
    def _validate_password_strength(self, value: str) -> bool:
        """Valida força de senha"""
        if self.is_production:
            if len(value) < 12:
                self.errors.append(f"Password deve ter no mínimo 12 caracteres em produção")
                return False
            
            # Verifica complexidade
            has_upper = any(c.isupper() for c in value)
            has_lower = any(c.islower() for c in value)
            has_digit = any(c.isdigit() for c in value)
            has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in value)
            
            if not all([has_upper, has_lower, has_digit, has_special]):
                self.errors.append("Password deve conter maiúsculas, minúsculas, números e caracteres especiais")
                return False
        
        if value.lower() in self.INSECURE_VALUES:
            self.errors.append("Password contém valor comum/inseguro")
            return False
        
        return True
    
    def _validate_minio_secret(self, value: str) -> bool:
        """Valida secret do MinIO"""
        if value in ['minio123', 'minioadmin', 'changeme']:
            self.errors.append("MINIO_SECRET_KEY usa valor padrão inseguro")
            return False
        return len(value) >= 8
    
    def _validate_cors_origins(self, value: str) -> bool:
        """Valida configuração CORS"""
        if value == "*":
            if self.is_production:
                self.errors.append("CORS com '*' não é permitido em produção!")
                return False
            else:
                self.warnings.append("CORS com '*' detectado - OK para dev, NUNCA use em produção")
        
        origins = value.split(',')
        for origin in origins:
            origin = origin.strip()
            if origin and origin != "*":
                if not re.match(self.PATTERNS['url'], origin):
                    self.errors.append(f"Origem CORS inválida: {origin}")
                    return False
        
        return True
    
    def validate(self, raise_on_error: bool = True) -> bool:
        """
        Valida todas as variáveis de ambiente
        
        Args:
            raise_on_error: Se True, lança exceção em erro crítico
            
        Returns:
            bool: True se validação passou
        """
        self.errors.clear()
        self.warnings.clear()
        
        logger.info(f"🔍 Validando variáveis de ambiente para {self.environment}")
        
        # Verifica cada especificação
        for name, spec in self.specs.items():
            value = os.getenv(name, spec.default)
            
            # Verifica se existe
            if not value:
                if spec.level == EnvVarLevel.CRITICAL:
                    self.errors.append(f"❌ {name}: CRÍTICO - Variável não definida")
                elif spec.level == EnvVarLevel.REQUIRED:
                    self.errors.append(f"⚠️ {name}: REQUERIDO - Variável não definida")
                continue
            
            # Verifica se não deve ter default em produção
            if self.is_production and name in self.NEVER_DEFAULT_IN_PROD:
                if value == spec.default:
                    self.errors.append(f"🚨 {name}: Usando valor padrão em PRODUÇÃO!")
                    continue
            
            # Validações específicas
            if spec.min_length and len(value) < spec.min_length:
                self.errors.append(f"{name}: Valor muito curto (mín: {spec.min_length})")
            
            if spec.regex_pattern:
                if not re.match(spec.regex_pattern, value, re.IGNORECASE):
                    self.errors.append(f"{name}: Formato inválido")
            
            if spec.allowed_values and value not in spec.allowed_values:
                self.errors.append(f"{name}: Valor '{value}' não permitido")
            
            if spec.validator and not spec.validator(value):
                # Erro já adicionado pelo validator
                pass
            
            # Verifica valores inseguros
            if spec.sensitive:
                value_lower = value.lower()
                for insecure in self.INSECURE_VALUES:
                    if insecure in value_lower:
                        self.warnings.append(f"{name}: Pode conter valor inseguro")
        
        # Relatório
        self._print_report()
        
        # Decide se falha
        if self.errors:
            if raise_on_error and any('CRÍTICO' in e or '🚨' in e for e in self.errors):
                logger.critical("❌ Validação falhou com erros críticos!")
                if self.is_production:
                    sys.exit(1)
            return False
        
        return True
    
    def _print_report(self):
        """Imprime relatório de validação"""
        logger.info("\n" + "="*60)
        logger.info(f"📊 RELATÓRIO DE VALIDAÇÃO - {self.environment.upper()}")
        logger.info("="*60)
        
        if self.errors:
            logger.info("\n❌ ERROS ENCONTRADOS:")
            for error in self.errors:
                logger.error(f"  • {error}")
        
        if self.warnings:
            logger.info("\n⚠️ AVISOS:")
            for warning in self.warnings:
                logger.warning(f"  • {warning}")
        
        if not self.errors and not self.warnings:
            logger.info("\n✅ Todas as variáveis validadas com sucesso!")
        
        logger.info("="*60 + "\n")
    
    def generate_example_env(self, filepath: str = ".env.example"):
        """
        Gera arquivo .env.example com todas as variáveis documentadas
        """
        lines = [
            "# ============================================",
            "# BGAPP Environment Variables",
            f"# Generated for: {self.environment}",
            "# ============================================\n"
        ]
        
        # Agrupa por nível
        for level in EnvVarLevel:
            specs_by_level = [s for s in self.specs.values() if s.level == level]
            if not specs_by_level:
                continue
            
            lines.append(f"\n# {level.value.upper()} VARIABLES")
            lines.append("#" + "-"*40)
            
            for spec in specs_by_level:
                lines.append(f"\n# {spec.description}")
                if spec.sensitive:
                    lines.append("# ⚠️ SENSITIVE - Never commit with real values!")
                if spec.example:
                    lines.append(f"# Example: {spec.example}")
                
                if spec.default and not spec.sensitive:
                    lines.append(f"{spec.name}={spec.default}")
                else:
                    lines.append(f"{spec.name}=")
        
        with open(filepath, 'w') as f:
            f.write('\n'.join(lines))
        
        logger.info(f"✅ Generated {filepath}")


# Singleton para uso global
_validator: Optional[EnvValidator] = None


def get_validator(environment: Optional[str] = None) -> EnvValidator:
    """Obtém instância singleton do validador"""
    global _validator
    if _validator is None:
        env = environment or os.getenv('ENVIRONMENT', 'development')
        _validator = EnvValidator(env)
    return _validator


def validate_environment(raise_on_error: bool = True) -> bool:
    """
    Valida ambiente na inicialização da aplicação
    
    Usage:
        # No início de main.py ou app.py
        from bgapp.core.env_validator import validate_environment
        validate_environment()
    """
    validator = get_validator()
    return validator.validate(raise_on_error)


if __name__ == "__main__":
    # Teste/Demo
    import argparse
from bgapp.core.logger import logger
    
    parser = argparse.ArgumentParser(description="BGAPP Environment Validator")
    parser.add_argument('--env', default='development', help='Environment name')
    parser.add_argument('--generate', action='store_true', help='Generate .env.example')
    args = parser.parse_args()
    
    validator = EnvValidator(args.env)
    
    if args.generate:
        validator.generate_example_env()
    else:
        validator.validate()