"""
Sistema de gestão de secrets para BGAPP
Implementa armazenamento seguro e rotação automática de secrets
"""

import os
import json
import base64
import secrets
from pathlib import Path
from typing import Dict, Optional, Any, List
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import hashlib

from ..core.logging_config import get_logger

logger = get_logger(__name__)

class SecretsManager:
    """Gestor de secrets seguro"""
    
    def __init__(self, secrets_file: str = ".secrets.enc"):
        self.secrets_file = Path(secrets_file)
        self.master_key_file = Path(".master.key")
        self._master_key = self._get_or_create_master_key()
        self._cipher_suite = Fernet(self._master_key)
        
        # Secrets obrigatórios para a aplicação
        self.required_secrets = {
            'JWT_SECRET_KEY': 'Chave secreta para tokens JWT',
            'DATABASE_PASSWORD': 'Password da base de dados',
            'REDIS_PASSWORD': 'Password do Redis',
            'ENCRYPTION_KEY': 'Chave de encriptação geral',
            'API_SECRET_KEY': 'Chave secreta da API',
        }
        
        # Secrets opcionais
        self.optional_secrets = {
            'SMTP_PASSWORD': 'Password do servidor SMTP',
            'EXTERNAL_API_KEY': 'Chave de APIs externas',
            'BACKUP_ENCRYPTION_KEY': 'Chave para encriptar backups',
            'WEBHOOK_SECRET': 'Secret para validar webhooks',
        }
        
    def _get_or_create_master_key(self) -> bytes:
        """Obter ou criar chave mestre"""
        if self.master_key_file.exists():
            try:
                with open(self.master_key_file, "rb") as f:
                    content = f.read()
                    # Tentar carregar como JSON primeiro
                    try:
                        key_data = json.loads(content.decode())
                        return base64.b64decode(key_data['key'])
                    except (json.JSONDecodeError, KeyError):
                        # Se não for JSON, assumir que é chave direta
                        return content
            except Exception as e:
                logger.warning(f"Erro ao carregar chave mestre: {e}. Regenerando...")
                # Remove arquivo corrompido e regenera
                self.master_key_file.unlink(missing_ok=True)
        
        # Se chegou aqui, precisa gerar nova chave
        # Gerar chave mestre a partir de password + salt
        password = os.getenv("BGAPP_MASTER_PASSWORD")
        if not password:
            # Em desenvolvimento, usar password padrão (deve ser alterada em produção)
            password = "bgapp-master-key-change-in-production"
            logger.warning("Usando password mestre padrão - ALTERE EM PRODUÇÃO!")
        
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        
        # Guardar chave com salt
        key_data = {
            'key': base64.b64encode(key).decode(),
            'salt': base64.b64encode(salt).decode(),
            'created_at': datetime.utcnow().isoformat()
        }
        
        with open(self.master_key_file, "wb") as f:
            f.write(json.dumps(key_data).encode())
        
        os.chmod(self.master_key_file, 0o600)  # Apenas owner
        
        logger.security_event("master_key_created", file=str(self.master_key_file))
        return key
    
    def generate_secret(self, length: int = 64) -> str:
        """Gerar secret criptograficamente seguro"""
        return secrets.token_urlsafe(length)
    
    def generate_api_key(self, prefix: str = "bgapp") -> str:
        """Gerar chave de API com formato específico"""
        timestamp = int(datetime.utcnow().timestamp())
        random_part = secrets.token_urlsafe(32)
        return f"{prefix}_{timestamp}_{random_part}"
    
    def encrypt_secret(self, secret: str) -> str:
        """Encriptar secret"""
        return self._cipher_suite.encrypt(secret.encode()).decode()
    
    def decrypt_secret(self, encrypted_secret: str) -> str:
        """Desencriptar secret"""
        return self._cipher_suite.decrypt(encrypted_secret.encode()).decode()
    
    def store_secret(self, name: str, value: str, description: str = "") -> bool:
        """Armazenar secret encriptado"""
        try:
            secrets_data = self.load_secrets() or {}
            
            secrets_data[name] = {
                'value': self.encrypt_secret(value),
                'description': description,
                'created_at': datetime.utcnow().isoformat(),
                'last_rotated': datetime.utcnow().isoformat(),
                'rotation_count': secrets_data.get(name, {}).get('rotation_count', 0) + 1
            }
            
            self.save_secrets(secrets_data)
            
            logger.security_event(
                "secret_stored",
                secret_name=name,
                description=description
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao armazenar secret {name}: {e}")
            return False
    
    def get_secret(self, name: str) -> Optional[str]:
        """Obter secret desencriptado"""
        try:
            secrets_data = self.load_secrets()
            if not secrets_data or name not in secrets_data:
                # Tentar obter de variáveis de ambiente como fallback
                env_value = os.getenv(name)
                if env_value:
                    logger.info(f"Secret {name} obtido de variável de ambiente")
                    return env_value
                return None
            
            encrypted_value = secrets_data[name]['value']
            return self.decrypt_secret(encrypted_value)
            
        except Exception as e:
            logger.error(f"Erro ao obter secret {name}: {e}")
            return None
    
    def rotate_secret(self, name: str) -> Optional[str]:
        """Rotar secret (gerar novo valor)"""
        try:
            secrets_data = self.load_secrets()
            if not secrets_data or name not in secrets_data:
                return None
            
            # Gerar novo valor
            new_value = self.generate_secret()
            
            # Atualizar dados
            secrets_data[name]['value'] = self.encrypt_secret(new_value)
            secrets_data[name]['last_rotated'] = datetime.utcnow().isoformat()
            secrets_data[name]['rotation_count'] = secrets_data[name].get('rotation_count', 0) + 1
            
            self.save_secrets(secrets_data)
            
            logger.security_event(
                "secret_rotated",
                secret_name=name,
                rotation_count=secrets_data[name]['rotation_count']
            )
            
            return new_value
            
        except Exception as e:
            logger.error(f"Erro ao rotar secret {name}: {e}")
            return None
    
    def load_secrets(self) -> Optional[Dict]:
        """Carregar secrets do ficheiro"""
        try:
            if not self.secrets_file.exists():
                return None
                
            with open(self.secrets_file, "rb") as f:
                encrypted_data = f.read()
            
            decrypted_data = self._cipher_suite.decrypt(encrypted_data)
            return json.loads(decrypted_data.decode())
            
        except Exception as e:
            logger.error(f"Erro ao carregar secrets: {e}")
            return None
    
    def save_secrets(self, secrets_data: Dict) -> bool:
        """Guardar secrets no ficheiro"""
        try:
            # Serializar e encriptar
            json_data = json.dumps(secrets_data, indent=2)
            encrypted_data = self._cipher_suite.encrypt(json_data.encode())
            
            # Guardar com permissões restritas
            with open(self.secrets_file, "wb") as f:
                f.write(encrypted_data)
            
            os.chmod(self.secrets_file, 0o600)
            
            logger.info(f"Secrets guardados: {len(secrets_data)} entries")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao guardar secrets: {e}")
            return False
    
    def initialize_default_secrets(self) -> Dict[str, str]:
        """Inicializar secrets padrão"""
        generated_secrets = {}
        
        # Gerar secrets obrigatórios
        for name, description in self.required_secrets.items():
            secret_value = self.generate_secret()
            self.store_secret(name, secret_value, description)
            generated_secrets[name] = secret_value
        
        logger.security_event(
            "default_secrets_initialized",
            secrets_count=len(generated_secrets)
        )
        
        return generated_secrets
    
    def check_secrets_health(self) -> Dict[str, Any]:
        """Verificar saúde dos secrets"""
        secrets_data = self.load_secrets() or {}
        
        health_report = {
            'total_secrets': len(secrets_data),
            'missing_required': [],
            'old_secrets': [],
            'health_score': 0,
            'recommendations': []
        }
        
        # Verificar secrets obrigatórios
        for required_secret in self.required_secrets:
            if required_secret not in secrets_data:
                health_report['missing_required'].append(required_secret)
        
        # Verificar secrets antigos (não rotados há mais de 90 dias)
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        
        for name, data in secrets_data.items():
            last_rotated_str = data.get('last_rotated', data.get('created_at'))
            if last_rotated_str:
                last_rotated = datetime.fromisoformat(last_rotated_str)
                if last_rotated < ninety_days_ago:
                    health_report['old_secrets'].append(name)
        
        # Calcular score de saúde
        total_required = len(self.required_secrets)
        missing_count = len(health_report['missing_required'])
        old_count = len(health_report['old_secrets'])
        
        health_score = max(0, 100 - (missing_count * 30) - (old_count * 10))
        health_report['health_score'] = health_score
        
        # Recomendações
        if missing_count > 0:
            health_report['recommendations'].append("Gerar secrets obrigatórios em falta")
        if old_count > 0:
            health_report['recommendations'].append("Rotar secrets antigos")
        
        return health_report
    
    def export_env_template(self) -> str:
        """Exportar template de variáveis de ambiente"""
        secrets_data = self.load_secrets() or {}
        
        template_lines = [
            "# BGAPP Environment Variables Template",
            "# Copy this file to .env and fill in the values",
            "# DO NOT commit this file with real values!",
            "",
            "# === REQUIRED SECRETS ===",
        ]
        
        for name, description in self.required_secrets.items():
            template_lines.append(f"# {description}")
            if name in secrets_data:
                template_lines.append(f"{name}=<GENERATED_SECRET>")
            else:
                template_lines.append(f"{name}=<PLEASE_GENERATE>")
            template_lines.append("")
        
        template_lines.extend([
            "# === OPTIONAL SECRETS ===",
        ])
        
        for name, description in self.optional_secrets.items():
            template_lines.append(f"# {description}")
            template_lines.append(f"# {name}=")
            template_lines.append("")
        
        return "\n".join(template_lines)

# Instância global
secrets_manager = SecretsManager()

def get_secrets_manager() -> SecretsManager:
    """Obter instância do gestor de secrets"""
    return secrets_manager

def get_secret(name: str, default: Optional[str] = None) -> Optional[str]:
    """Obter secret de forma conveniente"""
    return secrets_manager.get_secret(name) or default

if __name__ == "__main__":
    # Teste do gestor de secrets
    manager = SecretsManager()
    
    print("🔐 Teste do Gestor de Secrets")
    print("=" * 50)
    
    # Inicializar secrets padrão
    print("\n🔄 Inicializando secrets padrão...")
    generated = manager.initialize_default_secrets()
    
    print(f"✅ {len(generated)} secrets gerados")
    
    # Verificar saúde
    print("\n🏥 Verificando saúde dos secrets...")
    health = manager.check_secrets_health()
    print(f"Score de saúde: {health['health_score']}/100")
    
    # Testar rotação
    print("\n🔄 Testando rotação de secret...")
    old_jwt = manager.get_secret('JWT_SECRET_KEY')
    new_jwt = manager.rotate_secret('JWT_SECRET_KEY')
    print(f"JWT rotado: {old_jwt[:10]}... -> {new_jwt[:10]}...")
    
    # Exportar template
    print("\n📋 Exportando template .env...")
    template = manager.export_env_template()
    with open('.env.template', 'w') as f:
        f.write(template)
    print("Template guardado em .env.template")
    
    print("\n✅ Teste concluído!")
