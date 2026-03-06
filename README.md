# 🌊 Neptune(ANG) - Plataforma Científica Oceanográfica de Angola

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

O **Neptune(ANG)** é uma plataforma científica de última geração desenvolvida especificamente para análise oceanográfica e monitorização da biodiversidade marinha na Zona Económica Exclusiva de Angola.

### 🌟 **Características Principais**
- **43 interfaces científicas** integradas
- **5 modelos de Machine Learning** em produção
- **30+ espécies marinhas catalogadas** com taxonomia completa (WoRMS)
- **Visualizações 3D** avançadas (deck.gl, Unreal Engine)
- **Dados em tempo real** via Copernicus Marine Service e NASA EarthData
- **Análise geoespacial** com QGIS integrado
- **Dashboard administrativo** completo
- **Catálogo de biodiversidade** integrado com WoRMS API

### 🆕 **Novidades - Outubro 2025**
- ✅ **Integração WoRMS API**: 30 espécies marinhas da ZEE angolana
- ✅ **Cache de Taxonomia**: Sistema de cache para performance otimizada
- ✅ **6 Tabelas D1**: Estrutura completa de biodiversidade marinha
- ✅ **4 Workers Cloudflare**: APIs especializadas para dados marinhos
- 🔄 **ML Enhancement**: Species-aware detection em desenvolvimento
- 🔄 **Animações Meteorologia**: Visualizações temporais de dados oceanográficos

---

## 🏗️ **Arquitetura Técnica**

### 🌐 **Frontend**
- **Next.js 14** - Admin Dashboard
- **React 18** - Componentes reutilizáveis
- **TypeScript** - Tipagem forte
- **Tailwind CSS** - Design system
- **deck.gl** - Visualizações WebGL

### ⚙️ **Backend**
- **Cloudflare Workers** - 15+ APIs serverless em produção ✅
- **Cloudflare D1** - Database SQLite serverless (60+ tabelas)
- **Cloudflare KV** - Cache distribuído (24h TTL)
- **Python FastAPI** - Desenvolvimento local (não produção)
- **WoRMS API** - Taxonomia marinha autorizada
- **NASA EarthData** - Dados de satélite oceanográficos
- **Global Fishing Watch** - Monitorização de embarcações

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
python -m src.neptune_ang.api.ml_endpoints
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
- **WoRMS (World Register of Marine Species)** - 30 espécies catalogadas
- **Copernicus Marine Service** - SST, salinidade, ocean color em tempo real
- **NASA EarthData** - Dados de satélite (MODIS, VIIRS)
- **Global Fishing Watch** - Atividade pesqueira e embarcações
- **GBIF/OBIS** - Ocorrências de espécies
- **GEBCO** - Batimetria de alta resolução
- **Dados locais** - Investigação angolana

### 🔬 **Interfaces Científicas**
- **43 ferramentas** integradas
- **QGIS** para análise geoespacial
- **STAC** para dados espaciais
- **APIs REST** para integração

---

## 🗺️ **Roadmap Técnico 2025-2026**

### 🤖 **ML Predictions Enhancement**

#### Phase 1: Species-Aware Detection (Nov 2025)
- ✅ Database Integration (WoRMS schema, 30 espécies)
- 🔄 ML Model Enhancement (species identification)
- 📋 Training Data Preparation (500+ observações)
- 📋 Model Deployment (TensorFlow.js em Workers)
- **Target**: >75% accuracy top-1, >85% accuracy top-3

#### Phase 2: Bycatch Prediction (Dez 2025)
- Conservation status integration (IUCN Red List)
- Real-time alerts para espécies ameaçadas
- Spatial risk modeling
- **Target**: >80% bycatch prediction accuracy

#### Phase 3: Ecosystem Modeling (Q1 2026)
- Biomass prediction por zona
- Predator-prey relationship modeling
- Climate impact analysis
- **Target**: R² >0.75 para biomass predictions

### 🌦️ **Animações de Meteorologia**

#### Phase 1: Time-Series Visualization (Nov 2025)
- Backend APIs para dados históricos (6h/daily intervals)
- TimeSeriesPlayer.tsx component (Play/Pause/Speed controls)
- 120 frames SST, 30 frames Chlorophyll, 120 frames Salinity
- **Target**: 30 FPS desktop, 60 FPS mobile

#### Phase 2: Weather Forecast Animation (Dez 2025)
- Open-Meteo API integration
- Wind vectors animation (WebGL particles)
- Wave height overlay (0-6m heatmap)
- Precipitation forecast
- **Target**: >80% forecast accuracy (7 dias)

#### Phase 3: Interactive Analysis Tools (Q1 2026)
- Anomaly detection (eventos extremos)
- Multi-variable correlation analysis
- Seasonal pattern recognition
- **Target**: >85% anomaly detection precision

### 🎯 **Apresentação Governo Angola (Dezembro 2025)**
- ✅ Real-time marine monitoring demo
- ✅ Species detection via ML
- ✅ Weather animations (7 dias)
- ✅ Conservation dashboard
- **Confidence Level**: 85% → Target 90%

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

*Última atualização: Outubro 2025*
*Versão: 2.1.0 - WoRMS Integration*
*Status: Produção*

---

## 📦 **Cloudflare Workers em Produção**

| **Worker** | **URL** | **Função** |
|------------|---------|------------|
| API Worker | [bgapp-api-worker.majearcasa.workers.dev](https://bgapp-api-worker.majearcasa.workers.dev) | API principal (25+ endpoints) |
| WoRMS Proxy | [worms-api-proxy.majearcasa.workers.dev](https://worms-api-proxy.majearcasa.workers.dev) | Proxy WoRMS API |
| WoRMS Populator | [worms-species-populator.majearcasa.workers.dev](https://worms-species-populator.majearcasa.workers.dev) | População de espécies |
| Taxonomy Cache | [populate-taxonomy-cache.majearcasa.workers.dev](https://populate-taxonomy-cache.majearcasa.workers.dev) | Cache de taxonomia |
| NASA Proxy | [nasa-earthdata-proxy.majearcasa.workers.dev](https://nasa-earthdata-proxy.majearcasa.workers.dev) | Dados NASA EarthData |
| GFW Proxy | [gfw-proxy.majearcasa.workers.dev](https://gfw-proxy.majearcasa.workers.dev) | Global Fishing Watch |

---

## 🗄️ **Base de Dados D1 (Cloudflare)**

### Tabelas de Biodiversidade (WoRMS Integration)
- **marine_species**: 30 espécies prioritárias da ZEE angolana
- **species_taxonomy_cache**: 30 registos com taxonomia completa
- **angola_priority_species**: Níveis de prioridade (1-5)
- **species_occurrences**: Ocorrências geoespaciais
- **species_relationships**: Relações ecológicas
- **species_data_quality**: Métricas de qualidade

### Tabelas Oceanográficas
- **sst_data**: Sea Surface Temperature (NASA + Copernicus)
- **ocean_color_data**: Chlorophyll-a (NASA MODIS)
- **salinity_data**: Salinidade superficial (Copernicus)
- **vessel_lights_data**: Detecção de embarcações (NASA VIIRS)

### Tabelas de Análise
- **ml_predictions**: Predições de modelos ML (2000+ registos)
- **vessel_data**: Tracking AIS de embarcações
- **fishing_events**: Eventos de pesca detectados
- **eez_boundaries**: Limites da ZEE angolana (Continental + Cabinda)
