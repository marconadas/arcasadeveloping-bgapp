# 🔐 BGAPP Environment Configuration Template

## 📋 Complete Environment Variables Guide

Este documento lista todas as variáveis de ambiente necessárias para configurar o projeto BGAPP completo.

---

## 🏗️ **CLOUDFLARE WORKERS** (Produção Principal)

### `infrastructure/workers/.env.production`
```bash
# 🔑 API Tokens Externos
GFW_API_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9...
ADMIN_ACCESS_KEY=bgapp-admin-[TIMESTAMP]-[HASH]

# 🌊 Copernicus Marine Service (via wrangler secret put)
COPERNICUS_USERNAME=[YOUR_COPERNICUS_USERNAME]
COPERNICUS_PASSWORD=[YOUR_COPERNICUS_PASSWORD]
```

### Configuração via Wrangler Secrets
```bash
wrangler secret put GFW_API_TOKEN
wrangler secret put ADMIN_ACCESS_KEY
wrangler secret put COPERNICUS_USERNAME
wrangler secret put COPERNICUS_PASSWORD
```

### IDs dos Recursos Cloudflare
- **KV Namespace ID**: `c7969eba99d2477d897608e71ceb9f56`
- **D1 Database ID**: `46ed7435-1b25-498d-b832-7bef98061df3`
- **Database Name**: `bgapp-data`

---

## 🖥️ **ADMIN DASHBOARD** (Next.js)

### `apps/admin-dashboard/.env`
```bash
# 📊 API Endpoints
ADMIN_API_URL=http://localhost:8000
ML_API_URL=http://localhost:8000
PYGEOAPI_URL=http://localhost:5080
STAC_API_URL=http://localhost:8081
MINIO_API_URL=http://localhost:9000
FLOWER_API_URL=http://localhost:5555

# 🗄️ Storage and Database
MINIO_URL=http://localhost:9000
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://postgres:postgres2024@localhost:5432/geo

# 🔗 External Services
FLOWER_URL=http://localhost:5555
KEYCLOAK_URL=http://localhost:8083
STAC_BROWSER_URL=http://localhost:8082

# 🔒 Security
JWT_SECRET=bgapp-marine-angola-jwt-secret-2024-production-key
NEXTAUTH_SECRET=bgapp-nextauth-secret-key-2024-production
NEXTAUTH_URL=http://localhost:3001

# ⚙️ Development
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

### Produção (Admin Dashboard)
```bash
# 🌐 Production URLs
ADMIN_API_URL=https://bgapp-api-worker.majearcasa.workers.dev
ML_API_URL=https://bgapp-api-worker.majearcasa.workers.dev
NEXTAUTH_URL=https://bgapp-admin.pages.dev

# 🔒 Security (Generate new for production)
JWT_SECRET=[GENERATE_NEW_SECRET]
NEXTAUTH_SECRET=[GENERATE_NEW_SECRET]

NODE_ENV=production
```

---

## ⚡ **REALTIME ANGOLA** (Next.js)

### `apps/realtime-angola/.env.local`
```bash
# 🌐 API Configuration
NEXT_PUBLIC_API_URL=https://bgapp-api-worker.majearcasa.workers.dev
NEXT_PUBLIC_FRONTEND_BASE=https://bgapp-realtime.pages.dev

# 🗺️ Map Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=[YOUR_MAPBOX_TOKEN]
NEXT_PUBLIC_COPERNICUS_API=https://bgapp-api-worker.majearcasa.workers.dev/api/copernicus

# ⚙️ Development
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

### Produção (Realtime Angola)
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://bgapp-api-worker.majearcasa.workers.dev
NEXT_PUBLIC_FRONTEND_BASE=https://bgapp-realtime.pages.dev
```

---

## 🐍 **PYTHON SERVICES** (ML & Data Processing)

### Root Directory `.env`
```bash
# 🔐 Master Encryption Key
MASTER_KEY=d2zEHgwbT_rBs7W_An1aEeUcm1yWzJQHIDjTWne2iuU=

# 🗄️ Database Configuration
POSTGRES_URL=postgresql://postgres:postgres2024@localhost:5432/geo
REDIS_URL=redis://localhost:6379

# 🔗 External APIs
GFW_API_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9...
COPERNICUS_USERNAME=[YOUR_COPERNICUS_USERNAME]
COPERNICUS_PASSWORD=[YOUR_COPERNICUS_PASSWORD]

# 🤖 Machine Learning
ML_API_PORT=8000
ML_MODEL_PATH=./models/
```

---

## ☁️ **CLOUDFLARE MCP** (Automação)

### `.env.mcp`
```bash
# 🔑 Cloudflare API Configuration
CLOUDFLARE_API_TOKEN=F31omHgQku19VAG52njqV9T5TZ2CEeMFjfnlPeEZ
CLOUDFLARE_ACCOUNT_ID=b4824e9393a0448cbc14367facb73053
```

---

## 🛠️ **WRANGLER CONFIGURATIONS**

### 1. **Infrastructure Workers** (`infrastructure/workers/wrangler.toml`)
```toml
name = "bgapp-api-worker"
main = "api-worker.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production.vars]
NODE_ENV = "production"
API_VERSION = "1.2.0"
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "https://bgapp-arcasadeveloping.pages.dev,https://arcasadeveloping.org,https://bgapp-frontend.pages.dev"
RATE_LIMIT_REQUESTS = "1000"
RATE_LIMIT_WINDOW = "3600"
FRONTEND_BASE = "https://bgapp-frontend.pages.dev"

[[env.production.kv_namespaces]]
binding = "BGAPP_KV"
id = "c7969eba99d2477d897608e71ceb9f56"

[[env.production.d1_databases]]
binding = "BGAPP_DATA"
database_name = "bgapp-data"
database_id = "46ed7435-1b25-498d-b832-7bef98061df3"
```

### 2. **Admin Dashboard Pages** (`apps/admin-dashboard/wrangler.toml`)
```toml
name = "bgapp-admin"
compatibility_date = "2024-09-04"
pages_build_output_dir = "out"
```

### 3. **Realtime Angola Pages** (`apps/realtime-angola/wrangler.toml`)
```toml
name = "bgapp-realtime"
compatibility_date = "2024-09-04"
pages_build_output_dir = "out"

[env.production.vars]
NODE_ENV = "production"
API_VERSION = "1.2.0"
ENVIRONMENT = "production"
FRONTEND_BASE = "https://bgapp-realtime.pages.dev"
ALLOWED_ORIGINS = "https://bgapp-realtime.pages.dev,https://bgapp-frontend.pages.dev,https://arcasadeveloping.org"
```

---

## 🔗 **URLs DE PRODUÇÃO**

### Principais Deployments
- **Frontend**: https://bgapp-frontend.pages.dev/
- **Admin Dashboard**: https://bgapp-admin.pages.dev/
- **Realtime Angola**: https://bgapp-realtime.pages.dev/
- **API Worker**: https://bgapp-api-worker.majearcasa.workers.dev/

### APIs e Integrações
- **Copernicus**: https://bgapp-api-worker.majearcasa.workers.dev/api/copernicus
- **GFW Integration**: https://bgapp-api-worker.majearcasa.workers.dev/api/gfw
- **Health Check**: https://bgapp-api-worker.majearcasa.workers.dev/health

---

## 🎯 **CONFIGURAÇÃO POR DOMÍNIO**

### 🎨 **Frontend Domain** (Marcos Santos - Tech Lead)
```bash
# Arquivos necessários:
# - apps/frontend/.env.local (se necessário)
# - wrangler.toml (root) para Pages deployment

NODE_ENV=production
DOMAIN=bgapp-frontend.pages.dev
```

### 🔧 **Workers Domain** (Marcos Santos - Tech Lead)
```bash
# Arquivos necessários:
# - infrastructure/workers/.env.production
# - infrastructure/workers/wrangler.toml

GFW_API_TOKEN=[SECRET]
ADMIN_ACCESS_KEY=[SECRET]
COPERNICUS_USERNAME=[SECRET]
COPERNICUS_PASSWORD=[SECRET]
```

### 📊 **Admin Domain** (Ludmilson Francisco - Software Engineer)
```bash
# Arquivos necessários:
# - apps/admin-dashboard/.env
# - apps/admin-dashboard/wrangler.toml

JWT_SECRET=[ADMIN_SECRET]
NEXTAUTH_SECRET=[ADMIN_SECRET]
POSTGRES_URL=[DATABASE_URL]
```

### ⚡ **Realtime Domain** (Ludmilson Francisco - Software Engineer)
```bash
# Arquivos necessários:
# - apps/realtime-angola/.env.local
# - apps/realtime-angola/wrangler.toml

NEXT_PUBLIC_MAPBOX_TOKEN=[MAPBOX_TOKEN]
NEXT_PUBLIC_API_URL=https://bgapp-api-worker.majearcasa.workers.dev
```

### 🐍 **Dados/ML Domain** (Shared between team)
```bash
# Arquivos necessários:
# - .env (root)
# - requirements*.txt files

MASTER_KEY=[ENCRYPTION_KEY]
ML_API_PORT=8000
POSTGRES_URL=[DATABASE_URL]
```

---

## 🚨 **CRITICAL NOTES**

### 🔐 **Secrets Management**
- ❌ **NEVER** commit secrets to git
- ✅ Use `wrangler secret put` for production secrets
- ✅ Use `.env.local` files for local development
- ✅ Generate new secrets for production environments

### 🎯 **December 2025 Mission**
- All environment variables should optimize for **< 2 second load times**
- Ensure **real-time data integrations** are properly configured
- Configure **monitoring and alerting** for production deployments
- Set up **backup and disaster recovery** procedures

### 👥 **Team Responsibilities**
- **Marcos Santos (marconadas)**: Infrastructure Workers, Frontend deployment
- **Ludmilson Francisco (luddera)**: Admin Dashboard, Realtime Angola configurations
- **Luis Santos**: Communication coordination and documentation
- **Paulo Fernandes & Eng. Leite**: Final approval and production oversight

---

## 📚 **Related Documentation**
- [STAKEHOLDERS.md](./STAKEHOLDERS.md) - Team responsibilities and governance
- [CLAUDE.md](./CLAUDE.md) - Development guidelines and December mission
- [MARE-DATUM-MIGRATION.md](./MARE-DATUM-MIGRATION.md) - Migration guide

---

**🌊 MareDatum Consultoria e Gestão de Projectos Unipessoal LDA**
*Angola Marine Biodiversity Platform - December 2025 Presentation Ready*