# ⚙️ DevOps & Security - BGAPP Marine Angola

**Branch**: `feature/devops-security`  
**Responsável**: DevOps/Security Engineer (part-time)  
**Supervisor**: Marcos Santos (Tech Lead)

## 🎯 Responsabilidades

### 🚀 **DevOps & Deployment**
- **Cloudflare Pages** - Hosting e CDN
- **Cloudflare Workers** - Serverless computing
- **Wrangler CLI** - Deployment automation
- **CI/CD Pipelines** - Automated deployment
- **Infrastructure as Code** - Terraform/Pulumi

### 🔒 **Security & Monitoring**
- **CORS Security** - Cross-origin protection
- **Rate Limiting** - API protection
- **Headers Security** - XSS, CSRF protection
- **Monitoring** - 24/7 observabilidade
- **Backup Strategy** - Disaster recovery

---

## 🛠️ **Arquivos Principais**

### ⚙️ **Configuração de Deploy**
```
wrangler.toml                    ← Configuração principal Cloudflare
wrangler-pages.toml             ← Configuração Pages específica
admin-dashboard/wrangler.toml   ← Configuração admin dashboard
```

### 🔒 **Security & CORS**
```
workers/cors-security-enhanced.js ← Sistema CORS avançado
workers/monitoring-worker.js      ← Worker de monitorização
infra/frontend/_headers           ← Headers de segurança
infra/frontend/_redirects         ← Redirects seguros
```

### 📊 **Scripts de Deploy**
```
scripts/deploy_robust.sh         ← Deploy robusto
scripts/health_check.sh          ← Health checks
admin-dashboard/quick-deploy.sh  ← Deploy rápido admin
deploy-bgapp-public.sh           ← Deploy público
```

---

## 🚀 **Setup de Desenvolvimento**

### 1️⃣ **Configuração Inicial**
```bash
git checkout feature/devops-security
git pull origin develop

# Instalar Wrangler CLI
npm install -g wrangler

# Autenticar Cloudflare
wrangler auth login
```

### 2️⃣ **Configuração de Ambiente**
```bash
# Copiar configurações
cp env.example .env
cp wrangler.toml.example wrangler.toml

# Configurar secrets Cloudflare
wrangler secret put DATABASE_URL
wrangler secret put REDIS_URL
wrangler secret put API_KEY
```

### 3️⃣ **Deploy Local Testing**
```bash
# Testar workers localmente
wrangler dev workers/admin-api-worker.js --port 8000

# Testar Pages localmente
cd admin-dashboard/
npm run dev
```

---

## 📋 **Tarefas Prioritárias**

### 🔥 **Sprint Atual**
- [ ] **Monitorização avançada** (alertas automáticos)
- [ ] **Backup automático** (daily + incremental)
- [ ] **Security hardening** (headers + CORS)
- [ ] **Performance monitoring** (métricas detalhadas)
- [ ] **CI/CD pipeline** otimizado

### 🎯 **Próximas Sprints**
- [ ] **Infrastructure as Code** (Terraform)
- [ ] **Disaster recovery** plan
- [ ] **Load testing** automático
- [ ] **Security scanning** contínuo
- [ ] **Compliance** GDPR/LGPD

---

## 🔒 **Security Configuration**

### 🛡️ **Headers de Segurança**
```javascript
// _headers file
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
*/
```

### 🔐 **CORS Configuration**
```javascript
const ALLOWED_ORIGINS = [
  'https://bgapp-frontend.pages.dev',
  'https://bgapp-admin.pages.dev',
  'https://bgapp.arcasadeveloping.org'
];
```

### 🚨 **Rate Limiting**
```javascript
// No worker
const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP
  message: 'Too many requests'
};
```

---

## 📊 **Monitorização & Observabilidade**

### 📈 **Métricas Principais**
- **Uptime**: >99.9%
- **Response Time**: <200ms
- **Error Rate**: <0.1%
- **Cache Hit Rate**: >90%
- **Security Events**: 0 critical

### 🔍 **Ferramentas de Monitoring**
```bash
# Cloudflare Analytics
wrangler pages deployment list

# Worker logs
wrangler tail admin-api-worker

# Health checks
./scripts/health_check.sh

# Performance audit
./scripts/performance_audit.sh
```

---

## 🧪 **Como Testar**

### ⚡ **Deployment Testing**
```bash
# Testar deploy local
./scripts/deploy_robust.sh --dry-run

# Testar health endpoints
curl https://bgapp-admin.pages.dev/health
curl https://bgapp-admin-api-worker.majearcasa.workers.dev/health

# Testar CORS
curl -H "Origin: https://bgapp-frontend.pages.dev" \
     https://bgapp-admin-api-worker.majearcasa.workers.dev/api/services/status
```

### 🔒 **Security Testing**
```bash
# Testar rate limiting
for i in {1..100}; do curl https://bgapp-admin.pages.dev/api/test; done

# Testar headers de segurança
curl -I https://bgapp-admin.pages.dev/

# Scan de vulnerabilidades
npm audit
```

### 📊 **Performance Testing**
```bash
# Lighthouse CI
npx lighthouse https://bgapp-admin.pages.dev --output=json

# Load testing
./scripts/load_test.sh

# Bundle analysis
cd admin-dashboard/
npm run build
npx @next/bundle-analyzer
```

---

## 🚀 **Deploy Workflows**

### 🔄 **Automatic Deployment**
```yaml
# GitHub Actions (exemplo)
name: Deploy BGAPP
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 🎯 **Manual Deploy**
```bash
# Deploy admin dashboard
cd admin-dashboard/
npm run build
wrangler pages deploy out/ --project-name bgapp-admin

# Deploy workers
wrangler deploy workers/admin-api-worker.js
```

---

## 🛡️ **Backup & Recovery**

### 💾 **Backup Strategy**
- **Daily**: Backup automático de dados críticos
- **Weekly**: Backup completo do sistema
- **Monthly**: Backup de longo prazo
- **Real-time**: Replicação de dados críticos

### 🔧 **Recovery Procedures**
```bash
# Rollback deployment
wrangler pages deployment list
wrangler pages deployment activate [DEPLOYMENT_ID]

# Restore database
# [procedimentos específicos]

# Emergency contacts
# Tech Lead: marcos@maredatum.com
# Director: Paulo Fernandes
```

---

## 📊 **Infrastructure as Code**

### 🏗️ **Cloudflare Configuration**
```toml
# wrangler.toml
name = "bgapp-admin-api-worker"
main = "workers/admin-api-worker.js"
compatibility_date = "2024-01-01"

[env.production]
account_id = "your-account-id"
zone_id = "your-zone-id"

[env.production.vars]
ENVIRONMENT = "production"
```

### 🔧 **Environment Management**
```bash
# Production secrets
wrangler secret put DATABASE_URL --env production
wrangler secret put REDIS_URL --env production
wrangler secret put COPERNICUS_API_KEY --env production

# Development environment
wrangler dev --env development
```

---

## 📞 **Contacto & Escalação**

### 👨‍💻 **Tech Lead**
- **Marcos Santos** - marcos@maredatum.com
- **Disponibilidade**: 24/7 para emergências
- **Escalação**: Decisões de arquitetura

### 🚨 **Incident Response**
1. **Avaliar severidade** (Critical/High/Medium/Low)
2. **Notificar Tech Lead** se Critical/High
3. **Documentar** no incident log
4. **Implementar fix** via hotfix branch
5. **Post-mortem** após resolução

### 📚 **Documentação**
- **Security Docs**: `/docs/organized/security/`
- **Deploy Guides**: `/docs/organized/deploy/`
- **Architecture**: `/docs/organized/architecture/`

---

## ✅ **Definition of Done - DevOps**

### 📝 **Para cada deployment:**
- [ ] **Build** bem-sucedido
- [ ] **Testes** de segurança passam
- [ ] **Performance** dentro dos SLAs
- [ ] **Monitoring** configurado
- [ ] **Rollback plan** testado
- [ ] **Documentation** atualizada

### 🔒 **Para security features:**
- [ ] **Vulnerability scan** clean
- [ ] **Penetration test** aprovado
- [ ] **CORS** configurado corretamente
- [ ] **Rate limiting** funcional
- [ ] **Logging** de security events

---

## 📊 **SLAs & Targets**

### 🎯 **Service Level Agreements**
- **Uptime**: 99.9% (8.76h downtime/ano)
- **Response Time**: <200ms (95th percentile)
- **Recovery Time**: <15min para issues críticos
- **Backup Recovery**: <1h para restore completo

### 📈 **KPIs DevOps**
- **Deploy frequency**: Daily (quando necessário)
- **Lead time**: <2h (feature → production)
- **MTTR**: <15min (Mean Time To Recovery)
- **Change failure rate**: <5%

---

## 🌍 **Multi-Environment Setup**

### 🏗️ **Environments**
```
Production  → bgapp-admin.pages.dev (main branch)
Staging     → bgapp-admin-staging.pages.dev (develop branch)
Preview     → [automatic per PR] (feature branches)
Development → localhost:3000 (local development)
```

### 🔧 **Configuration Management**
```bash
# Environment-specific configs
wrangler.toml              # Base config
wrangler.production.toml   # Production overrides
wrangler.staging.toml      # Staging overrides
```

---

**Bem-vindo à equipa DevOps BGAPP! Vamos manter a plataforma sempre online e segura! 🌊⚙️**
