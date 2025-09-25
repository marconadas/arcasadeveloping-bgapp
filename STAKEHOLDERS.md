# 📊 STAKEHOLDERS & RESPONSABILIDADES - BGAPP MAREDATUM

> **Documento de Governança Técnica**
> Projeto: BGAPP - Biodiversity and Geographic Analysis Platform
> Organização: MareDatum Consultoria e Gestão de Projectos Unipessoal LDA
> Missão Crítica: Apresentação Dezembro 2025 ao Governo de Angola

---

## 🏢 **ESTRUTURA ORGANIZACIONAL MAREDATUM**

### **Direção Executiva**
```
┌─────────────────────────────────────────────────────────┐
│                  DIREÇÃO EXECUTIVA                      │
├─────────────────────────────────────────────────────────┤
│ 👨‍💼 Sr. Paulo Fernandes - Diretor Geral                │
│    • Decisões estratégicas                             │
│    • Apresentação ao cliente                           │
│    • Aprovação final de features                       │
│                                                         │
│ 🔧 Eng. Leite - Co-Diretor                            │
│    • Mesmas permissões do Diretor Geral               │
│    • Supervisão técnica estratégica                    │
│    • Backup para decisões executivas                   │
└─────────────────────────────────────────────────────────┘
```

### **Equipe Técnica**
```
┌─────────────────────────────────────────────────────────┐
│                  DESENVOLVIMENTO                        │
├─────────────────────────────────────────────────────────┤
│ 🚀 Marcos Santos (marconadas) - Technical Lead         │
│    • Arquitetura técnica geral                        │
│    • Machine Learning e AI                            │
│    • Performance e otimização                         │
│    • DevOps e deploy                                  │
│                                                         │
│ 💻 Ludmilson Francisco (luddera) - Software Engineer   │
│    • Desenvolvimento de features                       │
│    • APIs e integrações                               │
│    • Admin Dashboard                                   │
│    • Testes e debugging                               │
└─────────────────────────────────────────────────────────┘
```

### **Comunicação**
```
┌─────────────────────────────────────────────────────────┐
│                   COMUNICAÇÃO                           │
├─────────────────────────────────────────────────────────┤
│ 📢 Luis Santos - Responsável pela Comunicação          │
│    • Documentação para cliente                        │
│    • Preparação de apresentações                      │
│    • Coordenação com stakeholders                     │
│    • Material de marketing técnico                    │
└─────────────────────────────────────────────────────────┘
```

---

## 👥 **RESPONSABILIDADES POR DOMÍNIO**

### 1️⃣ **FRONTEND PRINCIPAL** (`apps/frontend/`)

| Papel | Responsável | Backup |
|-------|-------------|--------|
| **Lead** | 🚀 Marcos Santos | 💻 Ludmilson Francisco |
| **Tech Stack** | HTML5, CSS3, JS, deck.gl, Three.js, Mapbox GL | |
| **URL Produção** | https://bgapp-frontend.pages.dev | |
| **Porto Dev** | localhost:8080 | |

**Responsabilidades**:
- ✅ Interface pública científica
- ✅ Visualizações 3D marinhas (deck.gl, Three.js)
- ✅ Integração com Workers APIs
- ✅ Performance e otimização WebGL
- ✅ Experiência do usuário final (cientistas, pesquisadores)

---

### 2️⃣ **ADMIN DASHBOARD** (`apps/admin-dashboard/`)

| Papel | Responsável | Backup |
|-------|-------------|--------|
| **Lead** | 💻 Ludmilson Francisco | 🚀 Marcos Santos |
| **Tech Stack** | Next.js 14, TypeScript, Radix UI, Tailwind CSS | |
| **URL Produção** | https://bgapp-admin.pages.dev | |
| **Porto Dev** | localhost:3000 | |

**Responsabilidades**:
- ✅ Dashboard administrativo Next.js
- ✅ Componentes UI (Radix UI, Tailwind)
- ✅ Integração Copernicus Marine Service
- ✅ Gestão de usuários e permissões
- ✅ Monitoramento de sistema

---

### 3️⃣ **REALTIME ANGOLA** (`apps/realtime-angola/`)

| Papel | Responsável | Backup |
|-------|-------------|--------|
| **Lead** | 🚀 Marcos Santos | 💻 Ludmilson Francisco |
| **Tech Stack** | Next.js, deck.gl, React, TypeScript, TensorFlow.js | |
| **URL Produção** | https://bgapp-realtime.pages.dev | |
| **Porto Dev** | localhost:3000 | |

**Responsabilidades**:
- ✅ Monitoramento em tempo real da ZEE Angola
- ✅ Visualizações temperatura e clorofila
- ✅ Tracking de embarcações (GFW)
- ✅ Análise preditiva com ML
- ✅ Interface para autoridades marítimas

---

### 4️⃣ **WORKERS & APIs** (`infrastructure/workers/`)

| Papel | Responsável | Backup |
|-------|-------------|--------|
| **Lead** | 💻 Ludmilson Francisco | 🚀 Marcos Santos |
| **Tech Stack** | Cloudflare Workers, JavaScript, D1, KV | |
| **URL Principal** | https://bgapp-api-worker.majearcasa.workers.dev | |
| **URL Admin** | https://bgapp-admin-api-worker.majearcasa.workers.dev | |

**Workers Principais**:
- ✅ `api-worker.js` - API REST principal
- ✅ `admin-api-worker.js` - API administrativa
- ✅ `gfw-proxy.js` - Global Fishing Watch integration
- ✅ `stac-api-worker.js` - Spatial Temporal Asset Catalog

**Responsabilidades**:
- ✅ APIs serverless de produção
- ✅ Integrações externas (GFW, Copernicus, EOX)
- ✅ Cache inteligente (KV store)
- ✅ Segurança e rate limiting
- ✅ Observabilidade e logs

---

### 5️⃣ **DADOS & MACHINE LEARNING** (`src/bgapp/ml/`)

| Papel | Responsável | Support |
|-------|-------------|---------|
| **Lead** | 🚀 Marcos Santos | 💻 Ludmilson Francisco |
| **Tech Stack** | Python, TensorFlow, scikit-learn, XGBoost, FastAPI | |
| **Porto Dev** | localhost:8000 | |

**Modelos de ML (>95% precisão)**:
- 🐟 `biodiversity_predictor` - Previsão de biodiversidade
- 🌡️ `temperature_forecaster` - Forecast de temperatura oceânica
- 🦑 `species_classifier` - Classificação automática de espécies
- 📊 `abundance_estimator` - Estimativa de abundância populacional
- 🏞️ `habitat_suitability` - Adequação de habitat marinho

**Responsabilidades**:
- ✅ Pipeline de dados oceanográficos
- ✅ Modelos preditivos em produção
- ✅ Análise geoespacial avançada
- ✅ Integração Python/JavaScript
- ✅ Validação científica dos resultados

---

## 📋 **MATRIZ RACI COMPLETA**

| **Domínio** | **Responsible** | **Accountable** | **Consulted** | **Informed** |
|-------------|-----------------|-----------------|---------------|--------------|
| **Frontend** | Marcos Santos | Paulo/Leite | Ludmilson | Luis Santos |
| **Admin Dashboard** | Ludmilson Francisco | Paulo/Leite | Marcos | Luis Santos |
| **Realtime Angola** | Marcos Santos | Paulo/Leite | Ludmilson | Luis Santos |
| **Workers/APIs** | Ludmilson Francisco | Paulo/Leite | Marcos | Luis Santos |
| **ML & Data Science** | Marcos Santos | Paulo/Leite | Ludmilson | Luis Santos |
| **DevOps & Deploy** | Marcos Santos | Paulo/Leite | Ludmilson | Luis Santos |
| **Comunicação** | Luis Santos | Paulo/Leite | Marcos/Ludmilson | Todos |
| **Decisões Estratégicas** | Paulo/Leite | Paulo/Leite | Marcos | Todos |

**Legenda**:
- **R** (Responsible): Quem executa o trabalho
- **A** (Accountable): Quem aprova e é responsável pelo resultado
- **C** (Consulted): Quem deve ser consultado
- **I** (Informed): Quem deve ser informado

---

## 🔐 **NÍVEIS DE PERMISSÃO**

### **🔴 Nível 1 - Acesso Executivo Total**
**👨‍💼 Sr. Paulo Fernandes & 🔧 Eng. Leite**

**Permissões**:
- ✅ Deploy para produção (todos os ambientes)
- ✅ Gestão de secrets e chaves de API
- ✅ Configurações de billing e infraestrutura
- ✅ Criação/remoção de repositórios
- ✅ Gestão de permissões da organização
- ✅ Decisões de arquitetura estratégica

**Ambientes**: Production, Staging, Development, Admin

---

### **🟠 Nível 2 - Acesso Técnico Completo**
**🚀 Marcos Santos (marconadas) - Technical Lead**

**Permissões**:
- ✅ Acesso a todos os repositórios
- ✅ Deploy para staging e produção (com aprovação)
- ✅ Code review obrigatório
- ✅ Merge para branch main
- ✅ Configuração de CI/CD
- ✅ Gestão de infraestrutura técnica

**Ambientes**: Staging, Development, Local

---

### **🟡 Nível 3 - Acesso Desenvolvimento**
**💻 Ludmilson Francisco (luddera) - Software Engineer**

**Permissões**:
- ✅ Acesso aos repositórios de desenvolvimento
- ✅ Criação de branches e pull requests
- ✅ Deploy para ambiente de staging
- ✅ Code review de peers
- ✅ Testes e debugging

**Ambientes**: Staging, Development, Local

---

### **🟢 Nível 4 - Acesso Comunicação**
**📢 Luis Santos - Comunicação**

**Permissões**:
- ✅ Documentação e wiki
- ✅ Issues e project management
- ✅ Release notes e changelogs
- ✅ Comunicação com stakeholders
- ✅ Material de apresentação

**Ambientes**: Documentation, Project Management

---

## 📱 **CANAIS DE COMUNICAÇÃO**

### **💬 Comunicação Técnica Diária**
| Canal | Uso | Participantes | SLA |
|-------|-----|---------------|-----|
| **GitHub Issues** | Bugs, features, tasks | Todos tech | 24h |
| **Pull Requests** | Code review | Marcos/Ludmilson | 4h |
| **Slack Tech** | Discussões rápidas | Tech team | 1h |
| **Telegram** | Informal/urgente | Todos | 30min |

### **📋 Comunicação de Gestão**
| Canal | Uso | Participantes | Frequência |
|-------|-----|---------------|------------|
| **Email Formal** | Decisões oficiais | Paulo/Leite + team | Conforme necessário |
| **Meetings Semanais** | Status updates | Toda equipe | Sextas 16h |
| **Reports Mensais** | Progresso geral | Gestão + stakeholders | 1º dia do mês |
| **WhatsApp Grupo** | Coordenação geral | Todos | Diário |

### **🚨 Comunicação de Emergência**
```
Problema Crítico (Produção Down)
    ↓
WhatsApp: Marcos/Ludmilson (imediato)
    ↓
Telefonema: Paulo/Leite (5 min)
    ↓
Slack All Hands: Todos (10 min)
    ↓
Email: Cliente/Stakeholders (30 min)
```

---

## 🎯 **RESPONSABILIDADES PARA DEZEMBRO 2025**

### **🎪 APRESENTAÇÃO AO GOVERNO DE ANGOLA**

#### **👨‍💼 Sr. Paulo Fernandes & 🔧 Eng. Leite**
**Foco: Estratégico & Cliente**
- 🎤 Apresentação executiva ao governo
- 📊 Validação de requisitos com stakeholders
- 💼 Negociação de contratos e próximas fases
- 🤝 Gestão de relacionamento institucional
- ✅ Aprovação final de todas as entregas

#### **🚀 Marcos Santos (Technical Lead)**
**Foco: Arquitetura & Performance**
- ⚡ Performance sub-2 segundos (garantido)
- 🧠 Modelos ML com >95% precisão
- 🔧 Arquitetura escalável demonstrável
- 🚀 Deploy sem falhas (99.9% uptime)
- 📈 Métricas de performance em tempo real

#### **💻 Ludmilson Francisco (Software Engineer)**
**Foco: Features & Estabilidade**
- 🎨 Interface polida e profissional
- 🔌 Integrações estáveis (Copernicus, GFW)
- 🐛 Zero bugs críticos
- 📱 Responsividade mobile perfeita
- 🔒 Segurança e logs completos

#### **📢 Luis Santos (Comunicação)**
**Foco: Apresentação & Documentação**
- 📋 Material de apresentação profissional
- 📖 Documentação técnica completa
- 🎬 Demos preparados e testados
- 📊 Case studies e métricas de sucesso
- 🗣️ Script de apresentação otimizado

---

## 🏃‍♂️ **ROTAÇÃO DE RESPONSABILIDADES**

### **🔄 Sistema de Backup Cross-Training**

| **Domínio** | **Primary** | **Secondary** | **Knowledge Transfer** |
|-------------|-------------|---------------|------------------------|
| Frontend | Marcos | Ludmilson | Pair programming semanal |
| Admin Dashboard | Ludmilson | Marcos | Code review cruzado |
| Realtime Angola | Marcos | Ludmilson | Documentação compartilhada |
| Workers/APIs | Ludmilson | Marcos | Deploy conjunto mensal |
| ML/Data Science | Marcos | Ludmilson | Sessões técnicas quinzenais |

### **📚 Plano de Knowledge Sharing**
- **Documentação Obrigatória**: Todo código deve ter README.md
- **Code Reviews Cruzados**: Ninguém faz merge do próprio código
- **Sessões Técnicas**: Quinzenais para compartilhar conhecimento
- **Pair Programming**: Semanal em áreas críticas
- **Disaster Recovery**: Ambos devem conseguir fazer deploy

---

## 📊 **SLAs POR DOMÍNIO**

| **Domínio** | **Uptime** | **Response Time** | **Bug Fix** | **Feature Delivery** |
|-------------|------------|-------------------|-------------|----------------------|
| **Frontend** | 99.9% | < 2s | < 24h | Sprint (2 weeks) |
| **Admin Dashboard** | 99.5% | < 3s | < 48h | Sprint (2 weeks) |
| **Realtime Angola** | 99.9% | < 1s | < 12h | Sprint (2 weeks) |
| **Workers/APIs** | 99.99% | < 500ms | < 2h | Sprint (2 weeks) |
| **ML Models** | 99% | < 5s | < 72h | Month |

---

## 🚨 **ESCALATION PROCEDURES**

### **Nível 1: Problema Técnico Normal**
```
Issue GitHub → Responsável Principal → Code Review → Deploy
Timeline: 1-3 dias
```

### **Nível 2: Bug Crítico**
```
WhatsApp Tech Team → Hotfix Branch → Fast Review → Emergency Deploy → Notificar Gestão
Timeline: 1-4 horas
```

### **Nível 3: Sistema Down**
```
Call Imediato Tech Lead → All Hands → War Room → Fix → Post-Mortem
Timeline: < 30 minutos
```

### **Nível 4: Crisis Cliente**
```
Paulo/Leite Notificados → Client Call → Action Plan → Technical Resolution → Follow-up
Timeline: < 15 minutos
```

---

## 📈 **KPIs POR RESPONSÁVEL**

### **🚀 Marcos Santos (Technical Lead)**
- **Performance**: < 2s load time
- **Uptime**: > 99.9%
- **ML Accuracy**: > 95%
- **Code Quality**: 0 critical bugs
- **Deploy Success**: > 98%

### **💻 Ludmilson Francisco (Software Engineer)**
- **Feature Delivery**: 100% on time
- **API Reliability**: < 1% error rate
- **Code Coverage**: > 80%
- **Bug Resolution**: < 24h average
- **Integration Success**: > 99%

### **📢 Luis Santos (Comunicação)**
- **Documentation**: 100% coverage
- **Stakeholder Satisfaction**: > 90%
- **Presentation Quality**: Client approval
- **Communication Response**: < 2h
- **Material Delivery**: 100% on time

### **👨‍💼 Paulo Fernandes & 🔧 Eng. Leite**
- **Project Success**: Client approval
- **Budget Compliance**: Within limits
- **Timeline Adherence**: December delivery
- **Stakeholder Management**: Positive feedback
- **Strategic Decisions**: Impact measured

---

## 🎯 **ROADMAP DEZEMBRO 2025**

### **📅 Novembro 2025 - Final Sprint**
- **Semana 1**: Testing intensivo e bug fixes
- **Semana 2**: Performance tuning e otimização
- **Semana 3**: Preparação de apresentação e demos
- **Semana 4**: Rehearsal completo e contingência

### **📅 Dezembro 2025 - Apresentação**
- **Dia 1-5**: Setup e testes finais
- **Dia 6-10**: Apresentação ao governo
- **Dia 11-15**: Feedback e ajustes
- **Dia 16-31**: Documentação final e handover

---

## 📞 **CONTATOS DE EMERGÊNCIA**

| **Nome** | **Papel** | **Telefone** | **Email** | **Disponibilidade** |
|----------|-----------|-------------|-----------|---------------------|
| Paulo Fernandes | Dir. Geral | [CONFIDENCIAL] | paulo@maredatum.com | 24/7 |
| Eng. Leite | Co-Diretor | [CONFIDENCIAL] | leite@maredatum.com | 24/7 |
| Marcos Santos | Tech Lead | [CONFIDENCIAL] | marcos@maredatum.com | 24/7 |
| Ludmilson Francisco | Software Eng | [CONFIDENCIAL] | ludmilson@maredatum.com | 9h-22h |
| Luis Santos | Comunicação | [CONFIDENCIAL] | luis@maredatum.com | 8h-18h |

---

## 📝 **DOCUMENTO VIVO**

> **Nota**: Este documento deve ser atualizado mensalmente ou sempre que houver mudanças organizacionais.
> **Última Atualização**: Setembro 2025
> **Próxima Revisão**: Outubro 2025
> **Responsável pela Manutenção**: Luis Santos (Comunicação)

---

**🌊 MareDatum - Transformando Ciência em Soluções Marinhas**