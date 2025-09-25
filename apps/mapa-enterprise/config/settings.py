import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

class Config:
    """Configurações da aplicação"""

    # Configurações básicas
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 8050))

    # Configurações de banco de dados
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/mapa_enterprise')
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # Tokens e APIs (estes podem ser alterados)
    COPERNICUS_API_KEY = os.getenv('COPERNICUS_API_KEY')
    COPERNICUS_USERNAME = os.getenv('COPERNICUS_USERNAME')
    COPERNICUS_PASSWORD = os.getenv('COPERNICUS_PASSWORD')

    GFW_API_KEY = os.getenv('GFW_API_KEY')
    GFW_CLIENT_ID = os.getenv('GFW_CLIENT_ID')
    GFW_CLIENT_SECRET = os.getenv('GFW_CLIENT_SECRET')

    OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
    GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

    # Configurações de Machine Learning
    ML_MODELS_PATH = os.getenv('ML_MODELS_PATH', 'data/models')
    PREDICTION_INTERVAL = int(os.getenv('PREDICTION_INTERVAL', 300))  # 5 minutos

    # Configurações de autenticação
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION_HOURS = 24

    # Configurações de segurança
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    ENABLE_RATE_LIMIT = os.getenv('ENABLE_RATE_LIMIT', 'True').lower() == 'true'

    # Configurações de cache
    CACHE_TIMEOUT = int(os.getenv('CACHE_TIMEOUT', 300))  # 5 minutos

    # Configurações de logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'logs/mapa_enterprise.log')

class DevelopmentConfig(Config):
    """Configurações para desenvolvimento"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """Configurações para produção"""
    DEBUG = False
    LOG_LEVEL = 'WARNING'

class TestConfig(Config):
    """Configurações para testes"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'
    TESTING = True

# Configuração atual baseada na variável de ambiente
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'test': TestConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Retorna a configuração apropriada"""
    env = os.getenv('FLASK_ENV', 'default')
    return config.get(env, config['default'])
