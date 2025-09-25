"""
Configuração segura de CORS para BGAPP
Implementa whitelist dinâmica baseada no ambiente
"""

import os
from typing import List, Dict
from enum import Enum
from ..core.logging_config import get_logger

logger = get_logger(__name__)

class Environment(Enum):
    """Ambientes suportados"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class CORSConfig:
    """Configuração segura de CORS"""
    
    def __init__(self):
        self.environment = Environment(os.getenv("ENVIRONMENT", "development"))
        logger.info(f"Configurando CORS para ambiente: {self.environment.value}")
    
    def get_allowed_origins(self) -> List[str]:
        """Obter origens permitidas baseadas no ambiente"""
        
        if self.environment == Environment.DEVELOPMENT:
            return [
                "http://localhost:8085",
                "http://localhost:3000",
                "http://127.0.0.1:8085",
                "http://127.0.0.1:3000",
                # Adicionar ngrok URLs se necessário para desenvolvimento
                *self._get_ngrok_urls()
            ]
        
        elif self.environment == Environment.STAGING:
            return [
                "https://staging.bgapp.ao",
                "https://test.bgapp.ao",
                # Adicionar URLs de staging específicas
            ]
        
        elif self.environment == Environment.PRODUCTION:
            return [
                "https://bgapp.ao",
                "https://www.bgapp.ao",
                "https://arcasadeveloping.org",
                # Apenas URLs de produção verificadas
            ]
        
        # Fallback seguro
        return ["http://localhost:8085"]
    
    def _get_ngrok_urls(self) -> List[str]:
        """Obter URLs ngrok para desenvolvimento"""
        ngrok_urls = []
        
        # Verificar variáveis de ambiente para URLs ngrok
        if ngrok_url := os.getenv("NGROK_URL"):
            ngrok_urls.append(ngrok_url)
            logger.info(f"Adicionada URL ngrok: {ngrok_url}")
        
        return ngrok_urls
    
    def get_allowed_methods(self) -> List[str]:
        """Obter métodos HTTP permitidos"""
        return ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    
    def get_allowed_headers(self) -> List[str]:
        """Obter headers permitidos"""
        return [
            "Authorization",
            "Content-Type", 
            "Accept",
            "X-Requested-With",
            "X-Request-ID",
            "X-API-Key"
        ]
    
    def get_exposed_headers(self) -> List[str]:
        """Obter headers expostos ao cliente"""
        return [
            "X-Request-ID",
            "X-Rate-Limit-Remaining",
            "X-Rate-Limit-Reset"
        ]
    
    def allow_credentials(self) -> bool:
        """Permitir credenciais (cookies, authorization headers)"""
        # Apenas permitir em desenvolvimento e produção com HTTPS
        if self.environment == Environment.DEVELOPMENT:
            return True
        elif self.environment == Environment.PRODUCTION:
            return True  # Com HTTPS obrigatório
        return False
    
    def get_max_age(self) -> int:
        """Tempo de cache para preflight requests (segundos)"""
        if self.environment == Environment.DEVELOPMENT:
            return 300  # 5 minutos para desenvolvimento
        else:
            return 3600  # 1 hora para produção
    
    def get_cors_config(self) -> Dict:
        """Obter configuração completa de CORS"""
        config = {
            "allow_origins": self.get_allowed_origins(),
            "allow_methods": self.get_allowed_methods(),
            "allow_headers": self.get_allowed_headers(),
            "expose_headers": self.get_exposed_headers(),
            "allow_credentials": self.allow_credentials(),
            "max_age": self.get_max_age()
        }
        
        logger.security_event(
            "cors_config_loaded",
            environment=self.environment.value,
            origins_count=len(config["allow_origins"]),
            allow_credentials=config["allow_credentials"]
        )
        
        return config
    
    def is_origin_allowed(self, origin: str) -> bool:
        """Verificar se uma origem é permitida"""
        allowed_origins = self.get_allowed_origins()
        
        # Verificação exata
        if origin in allowed_origins:
            return True
        
        # Em desenvolvimento, permitir localhost com qualquer porta
        if self.environment == Environment.DEVELOPMENT:
            if origin.startswith(("http://localhost:", "http://127.0.0.1:")):
                return True
        
        logger.security_event(
            "cors_origin_blocked",
            origin=origin,
            environment=self.environment.value
        )
        
        return False
    
    def validate_request(self, origin: str, method: str) -> Dict[str, bool]:
        """Validar request CORS completa"""
        return {
            "origin_allowed": self.is_origin_allowed(origin),
            "method_allowed": method in self.get_allowed_methods(),
            "valid": self.is_origin_allowed(origin) and method in self.get_allowed_methods()
        }

# Instância global
cors_config = CORSConfig()

def get_cors_config() -> CORSConfig:
    """Obter instância da configuração CORS"""
    return cors_config

def get_cors_middleware_config() -> Dict:
    """Obter configuração para middleware CORS do FastAPI"""
    return cors_config.get_cors_config()

if __name__ == "__main__":
    # Teste da configuração
    config = CORSConfig()
    cors_settings = config.get_cors_config()
    
    print("🌐 Configuração CORS:")
    print(f"Ambiente: {config.environment.value}")
    print(f"Origens permitidas: {cors_settings['allow_origins']}")
    print(f"Métodos permitidos: {cors_settings['allow_methods']}")
    print(f"Credenciais permitidas: {cors_settings['allow_credentials']}")
    
    # Testar validação
    test_origins = [
        "http://localhost:8085",
        "https://malicious.com",
        "http://localhost:3000"
    ]
    
    print("\n🔍 Teste de validação:")
    for origin in test_origins:
        valid = config.is_origin_allowed(origin)
        print(f"  {origin}: {'✅ Permitido' if valid else '❌ Bloqueado'}")
