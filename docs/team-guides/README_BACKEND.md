# 🔧 Backend & Data Engineering - BGAPP Marine Angola

**Branch**: `feature/backend-data-engineering`  
**Responsável**: Backend/Data Engineer  
**Supervisor**: Marcos Santos (Tech Lead)

## 🎯 Responsabilidades

### 🚀 **Core Backend**
- **Cloudflare Workers** - APIs serverless
- **Python FastAPI** - Endpoints REST  
- **PostgreSQL + PostGIS** - Base de dados geoespacial
- **Redis Cache** - Sistema de cache distribuído
- **Performance** - Latência <1s garantida

### 📊 **Data Engineering**
- **Pipelines de dados** oceanográficos
- **Integração Copernicus** Marine Service
- **Processamento STAC** Collections
- **ETL** para dados científicos
- **Qualidade de dados** >98%

---

## 🛠️ **Arquivos Principais**

### 🌐 **Cloudflare Workers**
```
workers/admin-api-worker.js     ← API principal (25+ endpoints)
workers/pygeoapi-worker.js      ← GeoAPI integration
workers/stac-browser-worker.js  ← STAC browser
workers/monitoring-worker.js    ← Health monitoring
```

### 🐍 **Python APIs**
```
src/bgapp/api/ml_endpoints.py   ← Endpoints ML
src/bgapp/api/carto_integration.py ← CARTO integration
src/bgapp/cache/redis_cache.py  ← Cache management
infra/stac/simple_stac_api.py   ← STAC API
```

### 📊 **Data Processing**
```
src/bgapp/integrations/         ← External APIs
src/bgapp/ml/retention_*.py     ← ML data retention
dags/                          ← Airflow DAGs (se necessário)
```

---

## 🚀 **Setup de Desenvolvimento**

### 1️⃣ **Configuração Inicial**
```bash
git checkout feature/backend-data-engineering
git pull origin develop

# Instalar dependências Python
pip install -r requirements.txt
pip install -r requirements-admin.txt

# Configurar environment
cp env.example .env
# [editar .env com credenciais]
```

### 2️⃣ **Cloudflare Workers**
```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Autenticar Cloudflare
wrangler auth login

# Testar worker localmente
cd workers/
wrangler dev admin-api-worker.js --port 8000
```

### 3️⃣ **Base de Dados**
```bash
# PostgreSQL + PostGIS (via Docker)
docker-compose up -d postgres redis

# Verificar conexão
python -c "from src.bgapp.cache.redis_cache import test_connection; test_connection()"
```

---

## 📋 **Tarefas Prioritárias**

### 🔥 **Sprint Atual**
- [ ] **Otimizar performance** APIs (<500ms)
- [ ] **Implementar rate limiting** inteligente
- [ ] **Melhorar cache** Redis (>90% hit rate)
- [ ] **Adicionar logging** estruturado
- [ ] **Testes unitários** para workers

### 🎯 **Próximas Sprints**
- [ ] **Novos endpoints** ML avançados
- [ ] **Pipeline** Copernicus automatizado
- [ ] **Backup automático** de dados
- [ ] **Monitoring** avançado
- [ ] **Integração** com APIs externas

---

## 🧪 **Como Testar**

### ⚡ **Workers Cloudflare**
```bash
# Testar admin-api-worker
curl https://bgapp-admin-api-worker.majearcasa.workers.dev/health

# Testar endpoints ML
curl https://bgapp-admin-api-worker.majearcasa.workers.dev/ml/models

# Testar STAC API
curl https://bgapp-stac-worker.majearcasa.workers.dev/collections
```

### 🐍 **APIs Python**
```bash
# Iniciar API local
python -m src.bgapp.api.ml_endpoints

# Testar endpoints
curl http://localhost:8000/ml/health
curl http://localhost:8000/api/services/status
```

### 📊 **Performance Testing**
```bash
# Testar latência
python test_ml_retention_performance.py

# Testar cache
python -m src.bgapp.cache.redis_cache
```

---

## 📊 **Métricas de Performance**

### 🎯 **Targets**
- **Latência API**: <500ms (target: <200ms)
- **Cache hit rate**: >85% (target: >90%)
- **Uptime**: >99.5% (target: 99.9%)
- **Throughput**: >1000 req/min
- **Error rate**: <0.5%

### 📈 **Monitorização**
- **Cloudflare Analytics** - Métricas em tempo real
- **Worker logs** - Debugging avançado
- **Redis monitoring** - Performance cache
- **PostgreSQL stats** - Performance DB

---

## 🔒 **Segurança**

### 🛡️ **CORS & Headers**
```javascript
// Configuração segura no worker
const ALLOWED_ORIGINS = [
  'https://bgapp-frontend.pages.dev',
  'https://bgapp-admin.pages.dev',
  // ... outros domínios autorizados
];
```

### 🔐 **Autenticação**
- **JWT tokens** para APIs sensíveis
- **Rate limiting** por IP/origem
- **CORS** restritivo
- **Headers de segurança** completos

---

## 📞 **Contacto & Suporte**

### 👨‍💻 **Tech Lead**
- **Marcos Santos** - marcos@maredatum.com
- **Review obrigatório** para todas as PRs
- **Disponível** para dúvidas técnicas

### 📚 **Documentação**
- **API Docs**: `/docs/organized/admin/`
- **Architecture**: `/docs/organized/architecture/`
- **Security**: `/docs/organized/security/`

### 🆘 **Emergências**
- **Hotfix branch**: `hotfix/production-fixes`
- **Deploy urgente**: Contactar Tech Lead
- **Rollback**: Cloudflare Pages permite rollback instant

---

## ✅ **Definition of Done**

### 📝 **Para cada feature:**
- [ ] **Código** implementado e testado
- [ ] **Testes unitários** >90% coverage
- [ ] **Performance** dentro dos targets
- [ ] **Documentação** atualizada
- [ ] **Security review** aprovado
- [ ] **PR aprovado** pelo Tech Lead

### 🚀 **Para deploy:**
- [ ] **Build** bem-sucedido
- [ ] **Testes** de integração passam
- [ ] **Performance** verificada
- [ ] **Rollback plan** definido
- [ ] **Monitoring** configurado

---

**Bem-vindo à equipa backend BGAPP! Vamos construir a melhor plataforma oceanográfica de Angola! 🌊🔧**
