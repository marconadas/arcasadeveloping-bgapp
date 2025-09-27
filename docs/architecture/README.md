# 🏗️ BGAPP Architecture Documentation

## 📋 Overview

Esta documentação contém os diagramas arquiteturais C4 completos para a plataforma BGAPP (Biodiversity and Geographic Analysis Platform), criados especificamente para a **apresentação de December 2025** ao Governo de Angola.

## 🎯 Objetivo dos Diagramas

Os diagramas C4 foram criados para:
- **Apresentação Técnica**: Demonstrar a arquitetura robusta ao Governo Angola
- **Documentação Estratégica**: Servir como base para decisões técnicas
- **Comunicação Stakeholders**: Facilitar discussões entre equipas técnicas e executivas
- **Onboarding**: Acelerar integração de novos desenvolvedores

## 📁 Diagramas Disponíveis

### 1. 🌍 [C4 Context Diagram](./c4-context.puml)
**Visão de Alto Nível do Sistema**

Mostra a plataforma BGAPP no contexto do ecossistema marinho de Angola:
- **Utilizadores**: Governo Angola, Cientistas, Administradores, Público
- **Sistema Central**: BGAPP Platform
- **Sistemas Externos**: Copernicus, Global Fishing Watch, EOX STAC, GEBCO

### 2. 🏗️ [C4 Container Diagram](./c4-container.puml)
**Arquitetura Técnica Detalhada**

Detalha os containers técnicos da plataforma:
- **Frontend Apps**: Static Frontend, Admin Dashboard, Realtime Angola
- **Backend Workers**: API Worker, GFW Proxy, Copernicus Worker, STAC Worker
- **Data Stores**: Cloudflare D1 Database, KV Cache

### 3. 💼 [C4 Admin Components](./c4-admin-components.puml)
**Componentes do Dashboard Administrativo**

Componentes internos do Admin Dashboard (Next.js 14):
- **Autenticação**: Sistema de autenticação e RBAC
- **UI Framework**: Radix UI, Tailwind CSS, Framer Motion
- **Visualizações**: Chart.js, Recharts, Leaflet
- **Gestão de Dados**: API Client, State Management, Cache

### 4. 🌊 [C4 Realtime Components](./c4-realtime-components.puml)
**Componentes da Aplicação Realtime Angola**

Componentes especializados para monitorização em tempo real:
- **Visualização**: deck.gl Engine, Layer Manager, WebGL Optimization
- **Machine Learning**: TensorFlow.js, Vessel Classifier, Anomaly Detector
- **Análise Geoespacial**: Turf.js, Clustering Service, Heatmap Generator
- **Tempo Real**: Data Stream Processor, WebSocket Integration

### 5. 🌊 [Data Flow Diagram](./data-flow.md)
**Fluxos de Dados em Tempo Real**

Diagramas Mermaid embeddable mostrando:
- Pipeline de dados oceanográficos
- Fluxo de autenticação e segurança
- Sincronização de dados em tempo real
- Pipeline de Machine Learning
- Arquitetura de deployment CDN

## 🛠️ Como Visualizar os Diagramas

### PlantUML (Recomendado)

#### Opção 1: Visual Studio Code
1. Instalar extensão **PlantUML**
2. Abrir ficheiros `.puml`
3. Usar `Alt+D` para preview

#### Opção 2: Online
1. Aceder a [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
2. Copiar conteúdo dos ficheiros `.puml`
3. Gerar diagrama online

#### Opção 3: CLI Local
```bash
# Instalar PlantUML
brew install plantuml

# Gerar PNG
plantuml docs/architecture/c4-context.puml

# Gerar SVG (recomendado para presentations)
plantuml -tsvg docs/architecture/*.puml
```

### Mermaid

#### GitHub/Notion
Os diagramas Mermaid em `data-flow.md` são renderizados automaticamente em:
- GitHub (preview nativo)
- Notion (através de blocos de código Mermaid)
- GitLab, Azure DevOps

#### Mermaid Live Editor
1. Aceder a [Mermaid Live Editor](https://mermaid.live/)
2. Copiar código Mermaid de `data-flow.md`
3. Exportar como PNG/SVG

## 📊 Tecnologias Representadas

### Frontend Stack
- **deck.gl 9.1.14**: Visualizações WebGL avançadas
- **Next.js 14**: Framework React com App Router
- **React 18**: Biblioteca UI principal
- **TypeScript 5.x**: Desenvolvimento type-safe
- **Radix UI**: Sistema de componentes acessíveis
- **Tailwind CSS**: Framework CSS utility-first

### Backend Stack
- **Cloudflare Workers**: Serverless edge computing
- **Cloudflare D1**: SQLite database distribuída
- **Cloudflare KV**: Cache distribuído global
- **Cloudflare Pages**: Hosting estático com CDN

### Data Integration
- **Copernicus Marine Service**: Dados oceanográficos
- **Global Fishing Watch**: Rastreamento embarcações
- **EOX STAC API**: Catálogo geoespacial
- **GEBCO**: Dados de batimetria

### Machine Learning
- **TensorFlow.js 4.22.0**: ML no browser
- **Python + FastAPI**: Development e training
- **scikit-learn**: Algoritmos clássicos

## 📈 Performance Targets (December 2025)

| Métrica | Target | Status Atual |
|---------|--------|--------------|
| **Frontend Load** | < 2.0s | 1.8s ✅ |
| **Admin Dashboard** | < 2.0s | 2.3s 🔄 |
| **Realtime Angola** | < 2.0s | 2.1s 🔄 |
| **API Response** | < 100ms | 95ms ✅ |
| **WebSocket Latency** | < 50ms | 45ms ✅ |
| **Map Interactions** | < 100ms | 85ms ✅ |

## 🎯 December 2025 Mission Context

Estes diagramas servem especificamente para:

### 🏛️ **Apresentação Governo Angola**
- Demonstrar capacidades técnicas da plataforma
- Evidenciar robustez da arquitetura Cloudflare
- Mostrar integração com sistemas internacionais
- Destacar capacidades de monitorização da ZEE Angola

### 📊 **Comunicação Executiva**
- Visões técnicas adequadas para stakeholders executivos
- Foco em benefícios estratégicos da arquitetura
- Evidência de preparação para escala nacional
- Demonstração de conformidade com standards internacionais

### 🔧 **Documentação Técnica**
- Base para discussões de implementação
- Guia para futuras extensões da plataforma
- Referência para integração com sistemas governamentais
- Documentação para auditoria técnica

## 📱 Responsive Design

Todos os diagramas foram criados considerando:
- **Desktop**: Resolução full HD para apresentações
- **Tablet**: Visualização em dispositivos móveis durante demos
- **Mobile**: Acesso rápido durante reuniões

## 🔄 Atualizações

| Data | Versão | Alterações |
|------|--------|------------|
| 2025-09-27 | 1.0 | Criação inicial dos diagramas C4 |
| - | - | *Futuras atualizações baseadas em feedback* |

## 📞 Contactos

**Responsável Técnico**: Marcos Santos (Technical Lead)
**Email**: marcos.santos@maredatum.pt
**Organização**: MareDatum Consultoria e Gestão de Projectos Unipessoal LDA

---

## 🌊 MareDatum - Transformando Ciência em Soluções Marinhas

*Documentação criada para a missão December 2025 - Apresentação ao Governo de Angola*