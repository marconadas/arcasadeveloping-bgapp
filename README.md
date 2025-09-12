# 🌊 BGAPP Marine Angola - Plataforma Científica Oceanográfica

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Pages-00ADD8?logo=cloudflare)](https://bgapp-admin.pages.dev)
[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue?logo=typescript)](https://www.typescriptlang.org/)

> **Plataforma científica avançada para análise oceanográfica e biodiversidade marinha da Zona Económica Exclusiva de Angola**

## 🚀 **Acesso Rápido**

| **Aplicação** | **URL** | **Descrição** | **Status** |
|---------------|---------|---------------|------------|
| **Admin Dashboard** | [bgapp-admin.pages.dev](https://bgapp-admin.pages.dev) | Dashboard administrativo principal | ✅ ATIVO |
| **Backend API** | [bgapp-admin-api-worker.majearcasa.workers.dev](https://bgapp-admin-api-worker.majearcasa.workers.dev) | APIs REST para dados oceanográficos | ✅ ATIVO |
| **Frontend Principal** | [bgapp-frontend.pages.dev](https://bgapp-frontend.pages.dev) | Interface científica pública | ✅ ATIVO |

### 🔧 **Endpoints Principais do Backend**
- **Health Check**: `GET /health`
- **Dados Copernicus**: `GET /admin-dashboard/copernicus-advanced/real-time-data`
- **Dashboard Overview**: `GET /api/dashboard/overview`
- **System Health**: `GET /admin-dashboard/system-health`

---

## 🎯 **Visão Geral**

O **BGAPP (Biodiversity and Geographic Analysis Platform)** é uma plataforma científica de última geração desenvolvida especificamente para análise oceanográfica e monitorização da biodiversidade marinha na Zona Económica Exclusiva de Angola.

### 🌟 **Características Principais**
- **43 interfaces científicas** integradas
- **5 modelos de Machine Learning** em produção
- **Visualizações 3D** avançadas (deck.gl, Unreal Engine)
- **Dados em tempo real** via Copernicus Marine Service
- **Análise geoespacial** com QGIS integrado
- **Dashboard administrativo** completo

---

## 🏗️ **Arquitetura Técnica**

### 🌐 **Frontend**
- **Next.js 14** - Admin Dashboard
- **React 18** - Componentes reutilizáveis
- **TypeScript** - Tipagem forte
- **Tailwind CSS** - Design system
- **deck.gl** - Visualizações WebGL

### ⚙️ **Backend**
- **Cloudflare Workers** - APIs serverless (PRINCIPAL) ✅
- **Next.js API Routes** - Endpoints integrados
- **Python FastAPI** - Desenvolvimento local (não produção)
- **PostgreSQL + PostGIS** - Base de dados geoespacial
- **Redis** - Cache distribuído

### 🤖 **Machine Learning**
- **5 modelos** em produção (>95% precisão)
- **TensorFlow** - Deep learning
- **scikit-learn** - Algoritmos clássicos
- **XGBoost** - Gradient boosting

### ☁️ **Infraestrutura**
- **Cloudflare Pages** - Hosting e CDN
- **Cloudflare Workers** - Serverless computing
- **Wrangler CLI** - Deployment automation

---

## 👥 **Equipa de Desenvolvimento**

### 👨‍💻 **Tech Lead**
- **Marcos Santos** - Arquitetura + Features core

### 🔧 **Backend/Data Engineering**
- **Branch**: `feature/backend-data-engineering`
- **Foco**: APIs, Performance, Pipelines

### 🎨 **Frontend/UX**
- **Branch**: `feature/frontend-ux`
- **Foco**: Dashboard, UI/UX, Visualizações

### ⚙️ **DevOps/Security**
- **Branch**: `feature/devops-security`
- **Foco**: Deploy, Monitoring, Security

### 🧠 **Data Science/ML**
- **Branch**: `feature/data-science-ml`
- **Foco**: ML models, Validação científica

---

## 📚 **Documentação**

### 👥 **Guias da Equipa**
- [Guia de Colaboração](docs/team-guides/TEAM_COLLABORATION_GUIDE.md)
- [Backend/Data Engineering](docs/team-guides/README_BACKEND.md)
- [Frontend/UX](docs/team-guides/README_FRONTEND.md)
- [DevOps/Security](docs/team-guides/README_DEVOPS.md)
- [Data Science/ML](docs/team-guides/README_DATASCIENCE.md)

### ⚖️ **Informações Legais**
- [Licença MIT](docs/legal/LICENSE)
- [Copyright](docs/legal/COPYRIGHT.md)
- [Créditos](docs/legal/CREDITS.md)
- [Licenciamento Comercial](docs/legal/LICENSING_INFO.md)

### 📊 **Documentação Técnica**
- [Arquitetura](docs/organized/architecture/)
- [APIs](docs/organized/admin/)
- [Features](docs/organized/features/)
- [Security](docs/organized/security/)

---

## 🚀 **Quick Start**

### 1️⃣ **Clonar Repositório**
```bash
git clone https://github.com/marconadas/arcasadeveloping-bgapp.git
cd arcasadeveloping-bgapp
```

### 2️⃣ **Configurar Ambiente**
```bash
# Instalar dependências
npm install
pip install -r requirements.txt

# Configurar variáveis
cp env.example .env
# [editar .env com credenciais]
```

### 3️⃣ **Desenvolvimento Local**
```bash
# Frontend (Admin Dashboard)
cd admin-dashboard/
npm run dev
# http://localhost:3000

# Backend (APIs)
python -m src.bgapp.api.ml_endpoints
# http://localhost:8000
```

### 4️⃣ **Deploy**
```bash
# Deploy para Cloudflare
wrangler deploy
npm run deploy
```

---

## 🌊 **Funcionalidades Principais**

### 🗺️ **Visualizações Avançadas**
- **Mapas interativos** com dados oceanográficos
- **Visualizações 3D** do fundo oceânico
- **Animações** de correntes e temperatura
- **Overlays** de biodiversidade marinha

### 🤖 **Machine Learning**
- **Predição de biodiversidade** (>95% precisão)
- **Classificação de espécies** marinhas
- **Forecasting** oceanográfico
- **Análise de adequação** de habitat

### 📊 **Dados Científicos**
- **Copernicus Marine Service** - Dados em tempo real
- **GBIF/OBIS** - Ocorrências de espécies
- **GEBCO** - Batimetria de alta resolução
- **Dados locais** - Investigação angolana

### 🔬 **Interfaces Científicas**
- **43 ferramentas** integradas
- **QGIS** para análise geoespacial
- **STAC** para dados espaciais
- **APIs REST** para integração

---

## 📊 **Métricas de Performance**

| **Métrica** | **Target** | **Atual** |
|-------------|------------|-----------|
| **Uptime** | >99.9% | ✅ 99.95% |
| **API Latência** | <500ms | ✅ 200ms |
| **ML Precisão** | >95% | ✅ 95.2% |
| **Cache Hit Rate** | >90% | ✅ 92% |
| **Core Web Vitals** | >90 | ✅ 94 |

---

## 🔧 **Tecnologias Utilizadas**

### **Frontend**
- Next.js, React, TypeScript, Tailwind CSS
- deck.gl, Three.js, D3.js, Mapbox GL
- Framer Motion, Radix UI

### **Backend**
- Cloudflare Workers, Python FastAPI
- PostgreSQL, PostGIS, Redis
- STAC API, GeoJSON

### **ML/AI**
- TensorFlow, scikit-learn, XGBoost
- pandas, numpy, geopandas
- Jupyter, scikit-bio

### **DevOps**
- Cloudflare Pages, Wrangler CLI
- GitHub Actions, Docker
- Monitoring, Security

---

## 📞 **Contacto**

### 👨‍💻 **Tech Lead**
- **Marcos Santos** - marcos@maredatum.com

### 🏢 **Organização**
- **MareDatum Consultoria e Gestão de Projectos Unipessoal LDA**
- **Director**: Paulo Fernandes - paulo@maredatum.com
- **Website**: [bgapp-admin.pages.dev](https://bgapp-admin.pages.dev)

---

## 📄 **Licenciamento**

Este projeto está licenciado sob a **Licença MIT** - ver ficheiro [LICENSE](docs/legal/LICENSE) para detalhes.

**Copyright © 2025 MareDatum Consultoria e Gestão de Projectos Unipessoal LDA**

---

## 🌟 **Agradecimentos**

- **MINPERMAR** - Ministério das Pescas de Angola
- **Copernicus Marine Service** - Dados oceanográficos
- **Comunidade científica** angolana
- **Investigadores marinhos** colaboradores

---

**Desenvolvido com ❤️ para a ciência marinha angolana** 🌊🇦🇴

---

*Última atualização: Janeiro 2025*  
*Versão: 2.0.0*  
*Status: Produção*
