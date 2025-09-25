# 🔐 BGAPP - Credenciais e Configuração do Ambiente
> **⚠️ CONFIDENCIAL - NÃO PARTILHAR OU COMMITAR PARA O GIT**


## 📋 Checklist de Configuração do Novo PC

### ✅ Credenciais Disponíveis

#### 🔑 Chave de Encriptação
```
ENCRYPTION_KEY=kFq276Ll5TcR3bsuBAVktSQ7IQlAOmcRuicrk5ZzwOU=
```

#### 🌊 Copernicus Marine Service (CMEMS) - Dados Oceanográficos
```env
COPERNICUS_USERNAME=msantos14
COPERNICUS_PASSWORD=Shoro.1995
COPERNICUSMARINE_SERVICE_USERNAME=msantos14
COPERNICUSMARINE_SERVICE_PASSWORD=Shoro.1995
```

#### 🛰️ Copernicus Data Space (CDSE) - Dados de Satélite
```env
COPERNICUS_DATASPACE_USERNAME=majearcasa@gmail.com
COPERNICUS_DATASPACE_PASSWORD=ShadowZoro!.1995
COPERNICUS_DATASPACE_ENDPOINT=https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token
COPERNICUS_DATASPACE_CLIENT_ID=cdse-public
```

#### 🗺️ CARTO API
```env
CARTO_BASE_URL=https://majearcasa.carto.com
CARTO_USERNAME=majearcasa
CARTO_API_KEY=default_public
```

#### 🔐 JWT e Segurança
```env
JWT_SECRET_KEY=bgapp-marine-angola-jwt-secret-2024-production-key
JWT_ALGORITHM=HS256
NEXTAUTH_SECRET=bgapp-nextauth-secret-key-2024-production
```

#### 💾 PostgreSQL Local
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=geo
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=postgres2024
POSTGRES_URL=postgresql://postgres:postgres2024@localhost:5432/geo
```

#### 📦 MinIO (Armazenamento)
```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
```

#### 🔗 URLs dos Serviços Copernicus
```env
# CMEMS URLs
COPERNICUS_MARINE_SERVICE_URL=https://my.cmems-du.eu/motu-web/Motu
COPERNICUS_MARINE_CATALOG_URL=https://data.marine.copernicus.eu/api/v1
COPERNICUS_MARINE_STAC_URL=https://stac.marine.copernicus.eu

# Data Space URLs
COPERNICUS_IDENTITY_URL=https://identity.dataspace.copernicus.eu
```

#### ☁️ Cloudflare (se tiver credenciais)
```env
CLOUDFLARE_ACCOUNT_ID=seu-account-id
CLOUDFLARE_API_TOKEN=seu-api-token
```

---

## 🚀 Comandos de Setup Rápido

### 1. Criar ficheiros .env
```bash
# Na raiz do projeto
cat > .env << 'EOF'
# BGAPP - Configuração de Ambiente
ENVIRONMENT=development
DEBUG=true
APP_NAME=BGAPP
APP_VERSION=1.1.0

# Segurança JWT
JWT_SECRET_KEY=bgapp-marine-angola-jwt-secret-2024-production-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=http://localhost:8085,http://localhost:3000,http://127.0.0.1:8085
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
ALLOWED_HEADERS=Authorization,Content-Type,Accept

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=geo
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=postgres2024
POSTGRES_POOL_SIZE=10
POSTGRES_MAX_OVERFLOW=20

# Copernicus Marine Service (CMEMS)
COPERNICUS_USERNAME=msantos14
COPERNICUS_PASSWORD=Shoro.1995
COPERNICUSMARINE_SERVICE_USERNAME=msantos14
COPERNICUSMARINE_SERVICE_PASSWORD=Shoro.1995

# Copernicus Data Space (CDSE)
COPERNICUS_DATASPACE_USERNAME=majearcasa@gmail.com
COPERNICUS_DATASPACE_PASSWORD=ShadowZoro!.1995

# CARTO
CARTO_BASE_URL=https://majearcasa.carto.com
CARTO_USERNAME=majearcasa
CARTO_API_KEY=default_public
CARTO_SYNC_INTERVAL=3600

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false

# APIs
ADMIN_API_HOST=0.0.0.0
ADMIN_API_PORT=8000
METOCEAN_API_HOST=0.0.0.0
METOCEAN_API_PORT=5080
PYGEOAPI_HOST=0.0.0.0
PYGEOAPI_PORT=5080
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=8085

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_FILE=logs/bgapp.log
EOF
```

### 2. Criar .env do Admin Dashboard
```bash
# No admin-dashboard
cat > admin-dashboard/.env << 'EOF'
# BGAPP Admin Dashboard
ADMIN_API_URL=http://localhost:8000
ML_API_URL=http://localhost:8000
PYGEOAPI_URL=http://localhost:5080
STAC_API_URL=http://localhost:8081
MINIO_API_URL=http://localhost:9000
FLOWER_API_URL=http://localhost:5555

# Storage and Database
MINIO_URL=http://localhost:9000
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://postgres:postgres2024@localhost:5432/geo

# External Services
FLOWER_URL=http://localhost:5555
KEYCLOAK_URL=http://localhost:8083
STAC_BROWSER_URL=http://localhost:8082

# Security
JWT_SECRET=bgapp-marine-angola-jwt-secret-2024-production-key
NEXTAUTH_SECRET=bgapp-nextauth-secret-key-2024-production
NEXTAUTH_URL=http://localhost:3001

# Development
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
EOF
```

### 3. Guardar chave de encriptação
```bash
echo "kFq276Ll5TcR3bsuBAVktSQ7IQlAOmcRuicrk5ZzwOU=" > .encryption_key
```

---

## 📦 Serviços a Instalar Localmente

### PostgreSQL com PostGIS
```bash
# macOS
brew install postgresql@14 postgis

# Iniciar serviço
brew services start postgresql@14

# Criar base de dados
createdb geo
psql geo -c "CREATE EXTENSION postgis;"
```

### Redis
```bash
# macOS
brew install redis
brew services start redis
```

### MinIO
```bash
# Download e instalação
brew install minio/stable/minio

# Iniciar servidor
minio server ~/minio-data --console-address ":9001"
```

---

## 🔒 Segurança

### Adicionar ao .gitignore (JÁ CONFIGURADO ✅)
```bash
# Já está configurado, mas para verificar:
grep -E "(\.env|\.encryption_key|SETUP_CREDENTIALS)" .gitignore
```

### Proteger ficheiros
```bash
chmod 600 .env
chmod 600 .encryption_key
chmod 600 admin-dashboard/.env
chmod 600 SETUP_CREDENTIALS.md
```

---

## 📞 Contactos de Suporte

- **Tech Lead**: Marcos Santos - marcos@maredatum.com
- **Director**: Paulo Fernandes - paulo@maredatum.com

---

## ⚠️ Notas Importantes

1. **NUNCA** commitar este ficheiro para o Git
2. Guardar cópia segura destas credenciais
3. Estas são as credenciais REAIS de produção - usar com cuidado
4. Usar gestores de passwords para armazenar
5. Configurar 2FA onde possível

### 📝 Datasets Copernicus Configurados para Angola:
- **Biogeoquímica**: GLOBAL_ANALYSISFORECAST_BGC_001_028
- **Física Oceânica**: GLOBAL_ANALYSISFORECAST_PHY_001_024
- **Ondas**: GLOBAL_ANALYSISFORECAST_WAV_001_027
- **Reanálise Bio**: GLOBAL_REANALYSIS_BIO_001_029
- **Reanálise Física**: GLOBAL_REANALYSIS_PHY_001_030

### 🌍 Área Geográfica da ZEE Angola:
- **Norte**: -4.2° (Cabinda)
- **Sul**: -18.2° (Cunene)
- **Este**: 17.5° (Limite oceânico ZEE)
- **Oeste**: 8.5° (Zona oceânica oeste)

---

**Última atualização**: Janeiro 2025
**Versão**: 2.0.0
