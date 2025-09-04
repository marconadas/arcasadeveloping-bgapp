# 👥 Guia de Colaboração - Equipa BGAPP Marine Angola

## 🏗️ Estrutura da Equipa

### 👨‍💻 **Tech Lead/Full-stack (1)** - Marcos Santos
- **Branch principal**: `main` (controlo total)
- **Responsabilidades**: Arquitetura + features core
- **Acesso**: Merge para todas as branches
- **Revisão**: Todas as pull requests passam por ti

### 🔧 **Backend/Data Eng. (1)**
- **Branch**: `feature/backend-data-engineering`
- **Responsabilidades**: Pipelines, performance, segurança
- **Foco**: 
  - Workers Cloudflare
  - APIs Python (FastAPI)
  - Base de dados PostgreSQL/PostGIS
  - Cache Redis
  - Processamento de dados oceanográficos

### 🎨 **Frontend/UX (1)**
- **Branch**: `feature/frontend-ux`
- **Responsabilidades**: Dashboards, mapas, usabilidade
- **Foco**:
  - Admin Dashboard (Next.js)
  - Interfaces científicas (React)
  - Visualizações 3D (deck.gl, Unreal Engine)
  - UX/UI design e responsividade

### ⚙️ **DevOps/Sec (part-time)**
- **Branch**: `feature/devops-security`
- **Responsabilidades**: Observabilidade, backups, IaC, segurança
- **Foco**:
  - Cloudflare deployment
  - Monitorização e alertas
  - Segurança e CORS
  - Backup e disaster recovery

### 🧠 **Data Scientist (part-time)**
- **Branch**: `feature/data-science-ml`
- **Responsabilidades**: ML/validação científica
- **Foco**:
  - Modelos de Machine Learning
  - Algoritmos de biodiversidade
  - Validação científica
  - Análise de dados oceanográficos

---

## 🌳 **Estrutura de Branches**

### 🏠 **Branches Principais**
```
main (protegida) ← Tech Lead (Marcos Santos)
├── develop ← Base para desenvolvimento
├── release/v2.0.0 ← Preparação de releases
└── hotfix/production-fixes ← Correções urgentes
```

### 🚀 **Branches de Feature**
```
feature/backend-data-engineering ← Backend Dev
feature/frontend-ux ← Frontend Dev  
feature/devops-security ← DevOps Engineer
feature/data-science-ml ← Data Scientist
```

---

## 🔄 **Workflow de Desenvolvimento**

### 1️⃣ **Desenvolvimento de Features**
```bash
# Cada desenvolvedor trabalha na sua branch
git checkout feature/[sua-area]
git pull origin develop  # Sempre sincronizar com develop
# ... fazer alterações ...
git add .
git commit -m "feat: descrição da feature"
git push origin feature/[sua-area]
```

### 2️⃣ **Pull Requests**
- **Destino**: `develop` (nunca diretamente para `main`)
- **Revisor obrigatório**: Tech Lead (Marcos Santos)
- **Template**:
```markdown
## 🎯 Descrição
[Descrição da feature/correção]

## 🧪 Testes Realizados
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Teste manual da funcionalidade

## 📋 Checklist
- [ ] Código segue padrões do projeto
- [ ] Documentação atualizada
- [ ] Sem breaking changes
- [ ] Performance testada
```

### 3️⃣ **Merge para Main**
- **Apenas Tech Lead** pode fazer merge para `main`
- **Processo**: `develop` → `main` após validação completa
- **Deploy automático**: Cloudflare Pages após merge

---

## 📁 **Organização do Código por Equipa**

### 🔧 **Backend/Data Engineering**
```
src/bgapp/api/          ← APIs Python
workers/                ← Cloudflare Workers
infra/stac/            ← STAC API
src/bgapp/cache/       ← Sistema de cache
src/bgapp/integrations/ ← Integrações externas
```

### 🎨 **Frontend/UX**
```
admin-dashboard/src/components/ ← Componentes React
admin-dashboard/src/app/        ← Páginas Next.js
infra/frontend/                 ← Interfaces científicas
admin-dashboard/src/lib/        ← Utilitários frontend
```

### ⚙️ **DevOps/Security**
```
wrangler.toml          ← Configuração Cloudflare
scripts/               ← Scripts de deployment
infra/                 ← Configurações de infraestrutura
docs/organized/security/ ← Documentação de segurança
```

### 🧠 **Data Science/ML**
```
src/bgapp/ml/          ← Modelos de Machine Learning
notebooks/             ← Jupyter notebooks
data/                  ← Datasets e análises
src/bgapp/ml/retention/ ← Sistema de retenção ML
```

---

## 🎯 **Responsabilidades Específicas**

### 👨‍💻 **Tech Lead (Marcos Santos)**
- ✅ **Arquitetura geral** do sistema
- ✅ **Code reviews** obrigatórios
- ✅ **Merge para main** exclusivo
- ✅ **Resolução de conflitos** entre equipas
- ✅ **Decisões técnicas** finais
- ✅ **Coordenação** entre equipas

### 🔧 **Backend/Data Engineer**
- 🎯 **Performance** das APIs (<1s resposta)
- 🎯 **Pipelines de dados** oceanográficos
- 🎯 **Segurança** dos endpoints
- 🎯 **Otimização** de queries SQL
- 🎯 **Integração** com Copernicus/MODIS
- 🎯 **Cache** Redis inteligente

### 🎨 **Frontend/UX Developer**
- 🎯 **Interfaces responsivas** e modernas
- 🎯 **Experiência do utilizador** otimizada
- 🎯 **Visualizações 3D** performantes
- 🎯 **Dashboard** administrativo
- 🎯 **Mapas interativos** avançados
- 🎯 **Acessibilidade** WCAG 2.1

### ⚙️ **DevOps/Security Engineer**
- 🎯 **Deployment** Cloudflare otimizado
- 🎯 **Monitorização** 24/7
- 🎯 **Backup** automático
- 🎯 **Segurança** CORS e headers
- 🎯 **Observabilidade** completa
- 🎯 **Disaster recovery** planning

### 🧠 **Data Scientist**
- 🎯 **Modelos ML** com >95% precisão
- 🎯 **Validação científica** rigorosa
- 🎯 **Algoritmos** de biodiversidade
- 🎯 **Análise estatística** avançada
- 🎯 **Peer review** científico
- 🎯 **Documentação** metodológica

---

## 🛡️ **Regras de Proteção**

### 🔒 **Branch `main` (PROTEGIDA)**
- ❌ **Push direto proibido** (apenas Tech Lead)
- ✅ **Apenas via Pull Request** aprovado
- ✅ **Testes obrigatórios** antes do merge
- ✅ **Deploy automático** após merge

### 🔧 **Branch `develop`**
- ✅ **Base para todas as features**
- ✅ **Integração contínua**
- ✅ **Testes automáticos**
- ⚠️ **Revisão obrigatória** para merge

### 🚀 **Branches de Feature**
- ✅ **Liberdade total** para experimentação
- ✅ **Commits frequentes** encorajados
- ✅ **Backup automático** no GitHub
- ⚠️ **Sincronização regular** com develop

---

## 📋 **Comandos Essenciais por Equipa**

### 🔧 **Backend Developer**
```bash
# Configurar ambiente
git checkout feature/backend-data-engineering
cd workers/
wrangler dev  # Testar workers localmente

# Testar APIs
cd ../
python -m src.bgapp.api.ml_endpoints
pytest tests/backend/
```

### 🎨 **Frontend Developer**
```bash
# Configurar ambiente
git checkout feature/frontend-ux
cd admin-dashboard/
npm install
npm run dev  # Servidor desenvolvimento

# Testar build
npm run build
npm run deploy  # Deploy para Cloudflare
```

### ⚙️ **DevOps Engineer**
```bash
# Configurar ambiente
git checkout feature/devops-security
wrangler auth login  # Configurar Cloudflare

# Deploy e monitorização
./scripts/deploy_robust.sh
./scripts/health_check.sh
```

### 🧠 **Data Scientist**
```bash
# Configurar ambiente
git checkout feature/data-science-ml
pip install -r requirements.txt
jupyter lab  # Análise de dados

# Testar modelos
python -m src.bgapp.ml.models
python run_ml_tests.py
```

---

## 🎯 **Objetivos por Sprint (2 semanas)**

### 🔧 **Backend Team**
- **Sprint 1**: Otimizar performance APIs (<500ms)
- **Sprint 2**: Implementar novos endpoints ML
- **Sprint 3**: Melhorar sistema de cache
- **Sprint 4**: Integração Copernicus avançada

### 🎨 **Frontend Team**
- **Sprint 1**: Melhorar UX do admin dashboard
- **Sprint 2**: Novas visualizações 3D
- **Sprint 3**: Mobile PWA otimizado
- **Sprint 4**: Acessibilidade WCAG 2.1

### ⚙️ **DevOps Team**
- **Sprint 1**: Monitorização avançada
- **Sprint 2**: Backup automático
- **Sprint 3**: Security hardening
- **Sprint 4**: Disaster recovery

### 🧠 **Data Science Team**
- **Sprint 1**: Novos modelos biodiversidade
- **Sprint 2**: Validação científica
- **Sprint 3**: Algoritmos otimizados
- **Sprint 4**: Peer review publicação

---

## 📞 **Comunicação da Equipa**

### 📧 **Contactos**
- **Tech Lead**: marcos@maredatum.com
- **Project Owner**: Paulo Fernandes (paulo@maredatum.com)
- **Equipa geral**: team@maredatum.com

### 📅 **Reuniões**
- **Daily standup**: 9h30 (15 min)
- **Sprint planning**: Segundas (1h)
- **Sprint review**: Sextas (1h)
- **Retrospectiva**: Quinzenalmente (30 min)

### 🛠️ **Ferramentas**
- **Git**: GitHub (repositório principal)
- **Deploy**: Cloudflare Pages + Workers
- **Monitorização**: Cloudflare Analytics
- **Comunicação**: [definir ferramenta]

---

## 🚀 **Comandos de Setup Inicial**

### **Para novos membros da equipa:**

```bash
# 1. Clonar repositório
git clone https://github.com/marconadas/arcasadeveloping-bgapp.git
cd arcasadeveloping-bgapp

# 2. Configurar branch da equipa
git checkout feature/[sua-area]
git pull origin develop

# 3. Configurar ambiente
cp env.example .env
# [configurar variáveis específicas]

# 4. Instalar dependências
npm install  # Para frontend
pip install -r requirements.txt  # Para backend

# 5. Testar ambiente
npm run dev  # Frontend
python -m src.bgapp.api.ml_endpoints  # Backend
```

---

## 🎉 **Status Atual do Projeto**

### ✅ **Completamente Funcional**
- **Admin Dashboard**: https://bgapp-admin.pages.dev
- **Frontend Principal**: https://bgapp-frontend.pages.dev
- **APIs**: Cloudflare Workers ativos
- **ML Models**: 5 modelos em produção
- **Documentação**: Completa e organizada

### 🎯 **Próximos Passos**
1. **Onboarding** da equipa
2. **Configuração** de ambientes locais
3. **Primeira sprint** de desenvolvimento
4. **Estabelecer** ritmo de trabalho
5. **Definir** métricas de sucesso

---

**Bem-vindos à equipa BGAPP! Juntos vamos revolucionar a ciência marinha em Angola! 🌊🚀**

**Última atualização**: Janeiro 2025  
**Versão**: 1.0  
**Tech Lead**: Marcos Santos
