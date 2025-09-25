#!/usr/bin/env python3
"""
Script para gerar arquivo .env com credenciais seguras
Implementação das correções de segurança do SANITY_CHECK_E_PLANO.md
"""

import secrets
import os
from pathlib import Path

def generate_secure_env():
    """Gera arquivo .env com credenciais fortes"""
    
    # Gerar credenciais seguras
    jwt_secret = secrets.token_urlsafe(64)
    postgres_password = secrets.token_urlsafe(16)
    minio_secret = secrets.token_urlsafe(16)
    keycloak_password = secrets.token_urlsafe(12)
    
    env_content = f"""# BGAPP - Configuração de Ambiente Segura
# Gerado automaticamente com credenciais fortes

# =============================================================================
# AMBIENTE E DEBUG
# =============================================================================
ENVIRONMENT=development
DEBUG=true
APP_NAME=BGAPP
APP_VERSION=1.1.0

# =============================================================================
# SEGURANÇA JWT - CREDENCIAIS FORTES GERADAS
# =============================================================================
JWT_SECRET_KEY={jwt_secret}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# =============================================================================
# CORS E RATE LIMITING - CONFIGURAÇÃO SEGURA
# =============================================================================
# URLs permitidas (separadas por vírgula) - apenas localhost
ALLOWED_ORIGINS=http://localhost:8085,http://localhost:3000,http://127.0.0.1:8085
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
ALLOWED_HEADERS=Authorization,Content-Type,Accept

# Rate Limiting - Ativado e restritivo
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600

# =============================================================================
# BASE DE DADOS POSTGRESQL - CREDENCIAIS SEGURAS
# =============================================================================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=geo
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD={postgres_password}

# Connection Pool
POSTGRES_POOL_SIZE=10
POSTGRES_MAX_OVERFLOW=20

# =============================================================================
# MINIO - CREDENCIAIS SEGURAS
# =============================================================================
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=bgapp_admin
MINIO_SECRET_KEY={minio_secret}
MINIO_BUCKET=biomassa
MINIO_STAC_BUCKET=stac-assets

# =============================================================================
# KEYCLOAK - CREDENCIAIS SEGURAS
# =============================================================================
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD={keycloak_password}

# =============================================================================
# SERVIÇOS EXTERNOS - COPERNICUS
# =============================================================================
# Credenciais do Copernicus Marine Service (configurar conforme necessário)
COPERNICUS_USERNAME=your-copernicus-username
COPERNICUS_PASSWORD=your-copernicus-password

# =============================================================================
# STAC E PYGEOAPI
# =============================================================================
STAC_API_URL=http://localhost:8081
PYGEOAPI_URL=http://localhost:5080

# =============================================================================
# CONFIGURAÇÕES DE ACESSO REMOTO - DESABILITADO POR PADRÃO
# =============================================================================
# NGROK_AUTHTOKEN=  # Deixar vazio para desabilitar acesso remoto
# REMOTE_ACCESS_USER=admin
# REMOTE_ACCESS_PASSWORD=  # Deixar vazio para desabilitar
"""
    
    # Escrever arquivo .env no diretório raiz
    env_path = Path("../.env")
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print("✅ Arquivo .env criado com credenciais seguras!")
    print("📋 Credenciais geradas:")
    print(f"   - PostgreSQL: postgres / {postgres_password}")
    print(f"   - MinIO: bgapp_admin / {minio_secret}")
    print(f"   - Keycloak: admin / {keycloak_password}")
    print(f"   - JWT Secret: {jwt_secret[:20]}...")
    print("")
    print("⚠️  IMPORTANTE: Guarde estas credenciais em local seguro!")
    print("🔒 O arquivo .env não deve ser commitado no git")
    
    return {
        'postgres_password': postgres_password,
        'minio_secret': minio_secret,
        'keycloak_password': keycloak_password,
        'jwt_secret': jwt_secret
    }

if __name__ == "__main__":
    credentials = generate_secure_env()
