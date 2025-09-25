"""
Configuração segura para BGAPP
Centraliza todas as configurações e credenciais usando variáveis de ambiente
"""

import os
from typing import List, Optional
from pydantic import validator, Field
from pydantic_settings import BaseSettings
from pathlib import Path

class SecuritySettings(BaseSettings):
    """Configurações de segurança"""
    
    # JWT Settings
    jwt_secret_key: str = "change-this-secret-key-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # CORS Settings
    allowed_origins: List[str] = ["http://localhost:8085", "http://localhost:3000"]
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE"]
    allowed_headers: List[str] = ["Authorization", "Content-Type", "Accept"]
    
    # Rate Limiting
    rate_limit_enabled: bool = Field(default=False, env="RATE_LIMIT_ENABLED")  # Desabilitado para desenvolvimento
    rate_limit_requests: int = Field(default=1000, env="RATE_LIMIT_REQUESTS")  # Mais permissivo
    rate_limit_window: int = Field(default=300, env="RATE_LIMIT_WINDOW")  # 5 minutos
    
    model_config = {"extra": "allow"}
    
    @validator('jwt_secret_key')
    def validate_secret_key(cls, v):
        if v == "change-this-secret-key-in-production":
            if os.getenv("ENVIRONMENT") == "production":
                raise ValueError("JWT secret key must be changed in production")
        return v

class DatabaseSettings(BaseSettings):
    """Configurações da base de dados"""
    
    # PostgreSQL
    postgres_host: str = Field(default="localhost", env="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, env="POSTGRES_PORT")
    postgres_database: str = Field(default="geo", env="POSTGRES_DB")
    postgres_username: str = Field(default="postgres", env="POSTGRES_USER")
    postgres_password: str = Field(default="postgres", env="POSTGRES_PASSWORD")
    postgres_pool_size: int = 10
    postgres_max_overflow: int = 20
    
    model_config = {"extra": "allow"}
    
    # Connection string
    @property
    def postgres_url(self) -> str:
        return f"postgresql://{self.postgres_username}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_database}"

class ExternalServicesSettings(BaseSettings):
    """Configurações de serviços externos"""
    
    # Copernicus Marine
    copernicus_username: str = ""
    copernicus_password: str = ""
    
    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minio"
    minio_secret_key: str = "minio123"
    minio_secure: bool = False
    
    # NGROK
    ngrok_authtoken: str = ""
    
    # External APIs
    obis_api_url: str = "https://api.obis.org"
    gbif_api_url: str = "https://api.gbif.org/v1"
    erddap_api_url: str = "https://coastwatch.pfeg.noaa.gov/erddap"
    
    model_config = {"extra": "allow"}
    
    @validator('copernicus_username')
    def validate_copernicus_credentials(cls, v, values):
        if not v and os.getenv("ENVIRONMENT") == "production":
            raise ValueError("Copernicus credentials required in production")
        return v

class APISettings(BaseSettings):
    """Configurações das APIs"""
    
    # API URLs
    admin_api_host: str = "0.0.0.0"
    admin_api_port: int = 8000
    
    metocean_api_host: str = "0.0.0.0"
    metocean_api_port: int = 5080
    
    pygeoapi_host: str = "0.0.0.0"
    pygeoapi_port: int = 5080
    
    # Frontend
    frontend_host: str = "0.0.0.0"
    frontend_port: int = 8085
    
    # API Limits
    max_page_size: int = 1000
    default_page_size: int = 100
    max_query_complexity: int = 10
    
    model_config = {"extra": "allow"}

class LoggingSettings(BaseSettings):
    """Configurações de logging"""
    
    log_level: str = "INFO"
    log_format: str = "json"
    log_file: Optional[str] = None
    log_rotation: str = "1 day"
    log_retention: str = "30 days"
    
    # Structured logging
    enable_request_logging: bool = True
    enable_performance_logging: bool = True
    enable_security_logging: bool = True
    
    model_config = {"extra": "allow"}

class AppSettings(BaseSettings):
    """Configurações principais da aplicação"""
    
    # Environment
    environment: str = "development"
    debug: bool = True
    app_name: str = "BGAPP"
    app_version: str = "1.0.0"
    
    # Timezone
    timezone: str = "UTC"
    
    # File paths
    data_dir: Path = Path("data")
    config_dir: Path = Path("configs")
    logs_dir: Path = Path("logs")
    
    # Nested settings
    security: SecuritySettings = SecuritySettings()
    database: DatabaseSettings = DatabaseSettings()
    external_services: ExternalServicesSettings = ExternalServicesSettings()
    api: APISettings = APISettings()
    logging: LoggingSettings = LoggingSettings()
    
    model_config = {
        "env_file": ".env",
        "env_nested_delimiter": "__",
        "case_sensitive": False,
        "extra": "allow"  # Permitir campos extras para compatibilidade
    }

# Instância global das configurações
settings = AppSettings()

def get_settings() -> AppSettings:
    """Obter configurações da aplicação"""
    return settings

def validate_production_settings():
    """Validar configurações para produção"""
    if settings.environment == "production":
        issues = []
        
        # Verificar JWT secret
        if settings.security.jwt_secret_key == "change-this-secret-key-in-production":
            issues.append("JWT secret key must be changed in production")
        
        # Verificar credenciais da base de dados
        if settings.database.postgres_password == "postgres":
            issues.append("Default PostgreSQL password should be changed in production")
        
        # Verificar credenciais MinIO
        if settings.external_services.minio_secret_key == "minio123":
            issues.append("Default MinIO credentials should be changed in production")
        
        # Verificar CORS
        if "*" in settings.security.allowed_origins:
            issues.append("CORS should not allow all origins in production")
        
        # Verificar debug mode
        if settings.debug:
            issues.append("Debug mode should be disabled in production")
        
        if issues:
            raise ValueError(f"Production configuration issues: {'; '.join(issues)}")

def create_directories():
    """Criar diretórios necessários"""
    for directory in [settings.data_dir, settings.config_dir, settings.logs_dir]:
        directory.mkdir(parents=True, exist_ok=True)

# Inicialização
if __name__ == "__main__":
    # Validar configurações
    try:
        validate_production_settings()
        print("✅ Configurações validadas com sucesso")
    except ValueError as e:
        print(f"⚠️ Avisos de configuração: {e}")
    
    # Criar diretórios
    create_directories()
    print("✅ Diretórios criados")
    
    # Mostrar configurações (sem credenciais)
    print(f"🚀 Ambiente: {settings.environment}")
    print(f"📊 API Admin: http://{settings.api.admin_api_host}:{settings.api.admin_api_port}")
    print(f"🌊 API Metocean: http://{settings.api.metocean_api_host}:{settings.api.metocean_api_port}")
    print(f"🌐 Frontend: http://{settings.api.frontend_host}:{settings.api.frontend_port}")
