# 🔧 BGAPP Credentials Setup Guide

## 📋 Process de Configuração de Credenciais

Guia passo-a-passo para configurar todas as credenciais necessárias do projeto BGAPP.

---

## 🚀 **QUICK START - Novo Colaborador**

### Pré-requisitos
```bash
# 1. Node.js 18+ e npm
node --version  # >= 18.0.0
npm --version   # >= 9.0.0

# 2. Wrangler CLI
npm install -g wrangler
wrangler --version

# 3. Git configurado
git config user.name
git config user.email
```

### Setup Inicial (5 minutos)
```bash
# 1. Clone do repositório
git clone https://github.com/MARE-DATUM/arcasadeveloping-bgapp.git
cd arcasadeveloping-bgapp

# 2. Install dependencies
npm install
cd apps/admin-dashboard && npm install
cd ../realtime-angola && npm install
cd ../..

# 3. Configurar credenciais básicas (ver seções abaixo)
```

---

## 🔐 **CONFIGURAÇÃO POR DOMÍNIO**

### 🎨 **1. FRONTEND** (Responsável: Marcos Santos)

#### Setup Local
```bash
# Frontend não requer .env específico para desenvolvimento básico
# As configurações ficam no wrangler.toml (root)
npm run dev  # Porta 8080
```

#### Setup Produção
```bash
# 1. Configurar wrangler (se necessário)
wrangler login

# 2. Deploy
npm run deploy
```

### 🔧 **2. WORKERS API** (Responsável: Marcos Santos)

#### Setup Local
```bash
cd infrastructure/workers

# 1. Criar arquivo .env.production
cp /dev/null .env.production

# 2. Configurar variáveis
cat >> .env.production << EOF
GFW_API_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJCR0FQUCIsInVzZXJJZCI6NTA0NzEsImFwcGxpY2F0aW9uTmFtZSI6IkJHQVBQIiwiaWQiOjMyNzMsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTc1Nzk2MTc5MCwiZXhwIjoyMDczMzIxNzkwLCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.exNtfPb4WFo3qp-qmCUBQUXDch5Q70Xxp4EB672VZU-YnaxlXuVXTS7mTLC798yzYmnaTPdI-UfvTl5jNNMiyP591jXUy7eYH2pZc_c4SZQIeyiMlmDuLgf30CCEcpEy3yVdVv2NJBd985U8yYfH2SWoinZxUCFhi64OuDA7GF2eq8Y5t2Pf-QzNVqA4lLxebrn8meN2gptRVKpMAL9ovLfYuJfCICkiGhboGBI4gvPnkjPpZs3J3Fpar_sDmXODiaP6Ojx5scdN8gtcexYX4TO8WjeuRt_Zv_kGXbBMyitmHzspQDPsNcVmhhZQBGH5P3E2cViKGqCPNoed8Gotr0QBrna11EI21pKuW9cixNneTLRlDY0tB-4LkTSqfmAP41KCuCKrLfOUsBO5etfv-G-y-XVhOgyrFjxrKCDh2MMIv4AkNXYi66e8_eclii8r2g8rE3gVhQn_865PwboyPqT34qBYDIxwP0SPsmrRQ6oq6Z1kVFRfDZMrqR_luQlV
ADMIN_ACCESS_KEY=bgapp-admin-1758038846-57490e5d46c0e985998c0c45db0eb5b5
EOF

# 3. Configurar secrets na Cloudflare
wrangler secret put GFW_API_TOKEN
wrangler secret put ADMIN_ACCESS_KEY
wrangler secret put COPERNICUS_USERNAME
wrangler secret put COPERNICUS_PASSWORD

# 4. Test local
wrangler dev

# 5. Deploy produção
wrangler deploy
```

#### Copernicus Credentials (Solicitar acesso)
```bash
# Obter credenciais em: https://marine.copernicus.eu/
# Após criar conta:
wrangler secret put COPERNICUS_USERNAME
# Input: [SEU_USERNAME_COPERNICUS]

wrangler secret put COPERNICUS_PASSWORD
# Input: [SUA_PASSWORD_COPERNICUS]
```

### 📊 **3. ADMIN DASHBOARD** (Responsável: Ludmilson Francisco)

#### Setup Local
```bash
cd apps/admin-dashboard

# 1. Criar .env file
cat >> .env << EOF
# API Endpoints
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

# 2. Test local
npm run dev  # Porta 3000

# 3. Build and deploy
npm run build
npm run deploy
```

#### Setup Produção
```bash
# 1. Gerar novos secrets para produção
openssl rand -hex 32  # Para JWT_SECRET
openssl rand -hex 32  # Para NEXTAUTH_SECRET

# 2. Atualizar .env com URLs de produção
# ADMIN_API_URL=https://bgapp-api-worker.majearcasa.workers.dev
# NEXTAUTH_URL=https://bgapp-admin.pages.dev
```

### ⚡ **4. REALTIME ANGOLA** (Responsável: Ludmilson Francisco)

#### Setup Local
```bash
cd apps/realtime-angola

# 1. Criar .env.local
cat >> .env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_BASE=http://localhost:3000

# Map Configuration (solicitar token Mapbox)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFyY29uYWRhcyIsImEiOiJjbGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Copernicus
NEXT_PUBLIC_COPERNICUS_API=http://localhost:8000/api/copernicus

# Development
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
EOF

# 2. Test local
npm run dev  # Porta 3000

# 3. Build and deploy
npm run build
npm run deploy
```

#### Mapbox Token (Solicitar acesso)
```bash
# 1. Criar conta em: https://www.mapbox.com/
# 2. Obter Access Token
# 3. Configurar em .env.local:
# NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiW1VTRVJOQU1FXSIsImEiOiJbVE9LRU5dIn0.[SIGNATURE]
```

### 🐍 **5. PYTHON SERVICES** (Shared)

#### Setup Local
```bash
# 1. Criar .env no root
cat >> .env << EOF
# Master Encryption Key
MASTER_KEY=d2zEHgwbT_rBs7W_An1aEeUcm1yWzJQHIDjTWne2iuU=

# Database Configuration
POSTGRES_URL=postgresql://postgres:postgres2024@localhost:5432/geo
REDIS_URL=redis://localhost:6379

# External APIs
GFW_API_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJCR0FQUCIsInVzZXJJZCI6NTA0NzEsImFwcGxpY2F0aW9uTmFtZSI6IkJHQVBQIiwiaWQiOjMyNzMsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTc1Nzk2MTc5MCwiZXhwIjoyMDczMzIxNzkwLCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.exNtfPb4WFo3qp-qmCUBQUXDch5Q70Xxp4EB672VZU-YnaxlXuVXTS7mTLC798yzYmnaTPdI-UfvTl5jNNMiyP591jXUy7eYH2pZc_c4SZQIeyiMlmDuLgf30CCEcpEy3yVdVv2NJBd985U8yYfH2SWoinZxUCFhi64OuDA7GF2eq8Y5t2Pf-QzNVqA4lLxebrn8meN2gptRVKpMAL9ovLfYuJfCICkiGhboGBI4gvPnkjPpZs3J3Fpar_sDmXODiaP6Ojx5scdN8gtcexYX4TO8WjeuRt_Zv_kGXbBMyitmHzspQDPsNcVmhhZQBGH5P3E2cViKGqCPNoed8Gotr0QBrna11EI21pKuW9cixNneTLRlDY0tB-4LkTSqfmAP41KCuCKrLfOUsBO5etfv-G-y-XVhOgyrFjxrKCDh2MMIv4AkNXYi66e8_eclii8r2g8rE3gVhQn_865PwboyPqT34qBYDIxwP0SPsmrRQ6oq6Z1kVFRfDZMrqR_luQlV

# Machine Learning
ML_API_PORT=8000
ML_MODEL_PATH=./models/
EOF

# 2. Install Python dependencies
pip install -r requirements.txt
pip install -r requirements-admin.txt
pip install -r requirements-stac.txt

# 3. Test ML API
python -m src.bgapp.api.ml_endpoints  # Porta 8000
```

---

## ☁️ **CLOUDFLARE AUTOMATION**

### MCP Setup
```bash
# 1. Configurar .env.mcp
cat >> .env.mcp << EOF
CLOUDFLARE_API_TOKEN=F31omHgQku19VAG52njqV9T5TZ2CEeMFjfnlPeEZ
CLOUDFLARE_ACCOUNT_ID=b4824e9393a0448cbc14367facb73053
EOF

# 2. Test MCP connection
CLOUDFLARE_API_TOKEN=F31omHgQku19VAG52njqV9T5TZ2CEeMFjfnlPeEZ CLOUDFLARE_ACCOUNT_ID=b4824e9393a0448cbc14367facb73053 npx -y @cloudflare/mcp-server-cloudflare@latest run
```

---

## 🔍 **VERIFICAÇÃO E TESTES**

### 1. Health Check Completo
```bash
# API Worker
curl https://bgapp-api-worker.majearcasa.workers.dev/health

# Admin Dashboard
curl https://bgapp-admin.pages.dev/

# Realtime Angola
curl https://bgapp-realtime.pages.dev/

# Frontend
curl https://bgapp-frontend.pages.dev/
```

### 2. Test Local Development
```bash
# Terminal 1: API Worker local
cd infrastructure/workers && wrangler dev

# Terminal 2: Admin Dashboard
cd apps/admin-dashboard && npm run dev

# Terminal 3: Realtime Angola
cd apps/realtime-angola && npm run dev

# Terminal 4: Main Frontend
npm run dev

# Terminal 5: Python ML Services
python -m src.bgapp.api.ml_endpoints
```

### 3. Integration Tests
```bash
# 1. Test GFW API
curl "https://bgapp-api-worker.majearcasa.workers.dev/api/gfw/vessels"

# 2. Test Copernicus API
curl "https://bgapp-api-worker.majearcasa.workers.dev/api/copernicus/angola-marine"

# 3. Test Admin Authentication
curl -H "Authorization: Bearer [JWT_TOKEN]" "https://bgapp-admin.pages.dev/api/admin/status"
```

---

## 🚨 **TROUBLESHOOTING**

### Problemas Comuns

#### 1. **Wrangler Authentication**
```bash
# Se auth falhar:
wrangler logout
wrangler login
wrangler whoami
```

#### 2. **Secrets não carregam**
```bash
# Listar secrets existentes
wrangler secret list

# Re-configurar secret específico
wrangler secret delete GFW_API_TOKEN
wrangler secret put GFW_API_TOKEN
```

#### 3. **Next.js Build Errors**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

#### 4. **Database Connection**
```bash
# Test D1 database
wrangler d1 execute bgapp-data --command "SELECT 1"

# Test PostgreSQL local
psql -d postgresql://postgres:postgres2024@localhost:5432/geo -c "SELECT 1"
```

#### 5. **API CORS Issues**
```bash
# Verificar ALLOWED_ORIGINS em wrangler.toml
# Deve incluir todos os domínios necessários:
# - https://bgapp-frontend.pages.dev
# - https://bgapp-admin.pages.dev
# - https://bgapp-realtime.pages.dev
```

---

## 👥 **RESPONSABILIDADES DA EQUIPE**

### 🚀 **Marcos Santos (marconadas) - Technical Lead**
- [x] Infrastructure Workers configuration
- [x] Frontend deployment and optimization
- [x] Cloudflare Workers secrets management
- [x] Production monitoring and performance

### 💻 **Ludmilson Francisco (luddera) - Software Engineer**
- [ ] Admin Dashboard .env configuration
- [ ] Realtime Angola environment setup
- [ ] Next.js applications optimization
- [ ] Database connections and queries

### 📢 **Luis Santos - Communications**
- [ ] Documentation coordination
- [ ] Team communication about environment changes
- [ ] Client demonstration environment preparation

### 🏢 **Paulo Fernandes & Eng. Leite - Leadership**
- [ ] Production environment approval
- [ ] Security credentials oversight
- [ ] December 2025 presentation coordination

---

## 📚 **SCRIPTS DE AUTOMAÇÃO**

### Setup Completo (Novo Colaborador)
```bash
#!/bin/bash
# setup-bgapp-env.sh

echo "🌊 BGAPP Environment Setup Started..."

# 1. Verificar dependências
command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }
command -v wrangler >/dev/null 2>&1 || { echo "Installing Wrangler..."; npm install -g wrangler; }

# 2. Install project dependencies
npm install
cd apps/admin-dashboard && npm install && cd ..
cd apps/realtime-angola && npm install && cd ..

# 3. Configurar templates básicos
echo "Creating environment templates..."
touch .env apps/admin-dashboard/.env apps/realtime-angola/.env.local infrastructure/workers/.env.production

echo "✅ BGAPP Environment Setup Complete!"
echo "📋 Next steps:"
echo "   1. Configure secrets in infrastructure/workers/.env.production"
echo "   2. Set up Cloudflare secrets: wrangler secret put GFW_API_TOKEN"
echo "   3. Configure database connections in apps/admin-dashboard/.env"
echo "   4. Test with: npm run dev"
```

### Deployment Automático
```bash
#!/bin/bash
# deploy-all.sh

echo "🚀 Deploying BGAPP Complete Platform..."

# Deploy order: Workers → Frontend → Admin → Realtime
cd infrastructure/workers && wrangler deploy && cd ../..
npm run deploy
npm run deploy:admin
npm run deploy:realtime

echo "✅ Full deployment complete!"
```

---

## 🎯 **CHECKLIST DECEMBER 2025 READY**

### ✅ **Credentials Configured**
- [ ] GFW API Token válido e testado
- [ ] Copernicus credentials ativas
- [ ] Cloudflare secrets configurados
- [ ] Database connections testadas
- [ ] Mapbox token configurado

### ✅ **Environments Working**
- [ ] Development local funcionando
- [ ] Production deployments ativos
- [ ] API integrations testadas
- [ ] Health checks passando

### ✅ **Team Ready**
- [ ] Cada membro tem acesso às suas credenciais
- [ ] Documentação compartilhada
- [ ] Troubleshooting guide disponível
- [ ] Emergency procedures definidos

### ✅ **Performance Optimized**
- [ ] Load times < 2 segundos
- [ ] API responses < 500ms
- [ ] Real-time data streaming
- [ ] Mobile responsive

---

**🌊 Pronto para demonstrar as capacidades de monitoramento marinho de Angola em December 2025!**

*MareDatum Consultoria e Gestão de Projectos Unipessoal LDA*