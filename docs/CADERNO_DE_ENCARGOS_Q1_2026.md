# 📋 CADERNO DE ENCARGOS
## Neptune(ANG) - Plataforma Científica Oceanográfica de Angola

**Documento:** Caderno de Encargos - Q1 2026  
**Horizonte Temporal:** 12 Semanas (Janeiro - Março 2026)  
**Versão:** 1.0  
**Data:** 6 Janeiro 2026  
**Classificação:** Interno - Stakeholders & Parceiros Técnicos

---

## 📊 SUMÁRIO EXECUTIVO

### Contexto do Projeto

O **Neptune(ANG)** é uma plataforma científica para análise oceanográfica e monitorização da biodiversidade marinha na Zona Económica Exclusiva (ZEE) de Angola. A aplicação encontra-se num estado pós-MVP funcional, após apresentação ao Governo de Angola em Dezembro 2025.

### Realidade Operacional

| Parâmetro | Situação |
|-----------|----------|
| **Equipa de Desenvolvimento** | 1 pessoa (Full-Stack Engineer) |
| **Estado Atual** | MVP+ funcional em produção |
| **Infraestrutura** | Cloudflare (Pages, Workers, D1, KV) |
| **Nível de Confiança** | 85% das funcionalidades core estáveis |
| **Budget de Desenvolvimento** | Limitado - recursos próprios |

### Objetivo deste Documento

Definir um **scope fechado, realista e executável** para consolidação e evolução da plataforma nos próximos 3 meses, adaptado às restrições de recursos e focado em entrega pragmática de valor.

---

## 1. ANÁLISE CRÍTICA DO ESTADO ATUAL

### 1.1 Stack Tecnológica

#### Frontend
| Componente | Tecnologia | Estado |
|------------|------------|--------|
| Admin Dashboard | Next.js 14, TypeScript, Radix UI, Tailwind | ✅ Produção |
| Neptune(ANG) Realtime | Next.js, deck.gl 9.1.14, TensorFlow.js | ✅ Produção |
| Frontend Principal | HTML5, JavaScript, Three.js, Mapbox GL | ✅ Produção |

#### Backend
| Componente | Tecnologia | Estado |
|------------|------------|--------|
| APIs Serverless | Cloudflare Workers (15+ workers) | ✅ Produção |
| Base de Dados | Cloudflare D1 (SQLite, 60+ tabelas) | ✅ Produção |
| Cache | Cloudflare KV (24h TTL) | ✅ Produção |
| ML Local Dev | Python FastAPI, TensorFlow, scikit-learn | ⚠️ Dev only |

#### Integrações Externas
| Serviço | Função | Estado |
|---------|--------|--------|
| NASA EarthData | Dados satélite (SST, Ocean Color) | ✅ Ativo |
| Global Fishing Watch | Tracking embarcações | ✅ Ativo |
| Copernicus Marine | Dados oceanográficos real-time | ✅ Ativo |
| WoRMS API | Taxonomia marinha | ✅ Ativo |

### 1.2 Funcionalidades Existentes

#### Implementadas e Estáveis (85%)
- ✅ Visualização de dados oceanográficos em tempo real
- ✅ Tracking de embarcações AIS/GFW
- ✅ 30 espécies marinhas catalogadas (WoRMS)
- ✅ Dashboard administrativo completo
- ✅ 5 modelos ML em produção (>95% precisão)
- ✅ Cache inteligente KV
- ✅ Sistema de autenticação

#### Implementadas com Melhorias Necessárias (10%)
- ⚠️ Performance Admin Dashboard (2.3s → target <2s)
- ⚠️ Performance Neptune(ANG) (2.1s → target <2s)
- ⚠️ Animações time-series (parcialmente implementado)
- ⚠️ Predições ML species-aware (placeholder)

#### Pendentes / Incompletas (5%)
- ❌ Training do modelo ML TensorFlow.js
- ❌ Historical data population (30 dias)
- ❌ Conservation dashboard completo
- ❌ Export PDF/Excel funcional
- ❌ Modo offline (IndexedDB)

### 1.3 Métricas Atuais vs Targets

| Métrica | Target | Atual | Gap |
|---------|--------|-------|-----|
| Uptime | >99.9% | 99.95% | ✅ Atingido |
| API Latência | <500ms | 200ms | ✅ Atingido |
| ML Precisão | >95% | 95.2% | ✅ Atingido |
| Cache Hit Rate | >90% | 92% | ✅ Atingido |
| Admin Load Time | <2.0s | 2.3s | ❌ -0.3s |
| Neptune Load Time | <2.0s | 2.1s | ⚠️ -0.1s |
| Core Web Vitals | >90 | 94 | ✅ Atingido |

### 1.4 Dívida Técnica Identificada

| Categoria | Severidade | Descrição |
|-----------|------------|-----------|
| TypeScript Errors | Média | Erros ignorados temporariamente para deploy urgente |
| ESLint Warnings | Baixa | Warnings suprimidos em ambos os apps Next.js |
| Test Coverage | Alta | Cobertura de testes <30% |
| Documentação API | Média | OpenAPI spec desatualizado |
| Bundle Size | Média | Admin 891MB dev, Neptune 1.3GB dev |

### 1.5 Riscos Herdados

| Risco | Probabilidade | Impacto | Estado |
|-------|---------------|---------|--------|
| Rate limits APIs externas | Média | Alto | Mitigado (cache KV) |
| Dependência single-dev | Alta | Crítico | **Não mitigado** |
| Worker size limits (1MB) | Baixa | Médio | Monitorizado |
| D1 limits (25K rows/query) | Média | Médio | Mitigado (pagination) |

---

## 2. OBJETIVOS DO PROJETO (Q1 2026)

### 2.1 Objetivo Principal

**Consolidar a plataforma Neptune(ANG) para operação sustentável**, focando em:
1. Estabilização de funcionalidades existentes
2. Eliminação de dívida técnica crítica
3. Completar features parcialmente implementadas
4. Preparar base para evolução futura

### 2.2 Objetivos Específicos

| ID | Objetivo | Métrica de Sucesso | Prioridade |
|----|----------|-------------------|------------|
| O1 | Atingir performance target (<2s) em todos os apps | Load time medido | MUST |
| O2 | Completar sistema de animações time-series | 30 FPS desktop | SHOULD |
| O3 | Implementar modo offline básico | IndexedDB funcional | COULD |
| O4 | Reduzir dívida técnica em 50% | TypeScript errors resolvidos | MUST |
| O5 | Aumentar test coverage para 50% | Jest/Playwright reports | SHOULD |
| O6 | Completar conservation dashboard | PDF export funcional | COULD |

### 2.3 Não-Objetivos (Explicitamente Excluídos)

- ❌ Novas funcionalidades major não listadas
- ❌ Refactoring de arquitectura
- ❌ Migração de infraestrutura
- ❌ Expansão para outras regiões geográficas
- ❌ Desenvolvimento mobile nativo
- ❌ Integração de novas APIs externas

---

## 3. ÂMBITO (SCOPE)

### 3.1 In Scope

#### 3.1.1 Performance & Estabilização
- [ ] Optimização bundle size Admin Dashboard
- [ ] Optimização bundle size Neptune(ANG)
- [ ] Code splitting e lazy loading
- [ ] Image optimization (next/image, WebP)
- [ ] Critical CSS inline

#### 3.1.2 Dívida Técnica
- [ ] Resolução de TypeScript errors (apps/admin-dashboard)
- [ ] Resolução de TypeScript errors (apps/realtime-angola)
- [ ] Cleanup de ESLint warnings críticos
- [ ] Atualização de dependências com vulnerabilidades
- [ ] Remoção de código morto/duplicado

#### 3.1.3 Features Pendentes
- [ ] TimeSeriesPlayer integration completa
- [ ] ML Species Predictor com modelo treinado
- [ ] Conservation dashboard básico
- [ ] Historical data population (30 dias)
- [ ] Export básico (CSV, JSON)

#### 3.1.4 Testing & Quality
- [ ] Playwright E2E tests para critical paths
- [ ] Unit tests para Workers principais
- [ ] Smoke tests automatizados
- [ ] Documentação de API atualizada

#### 3.1.5 DevOps & Monitoring
- [ ] Health check dashboard
- [ ] Error tracking (Sentry ou similar gratuito)
- [ ] Backup automático D1
- [ ] Deploy scripts robustos

### 3.2 Out of Scope

| Item | Razão da Exclusão |
|------|-------------------|
| Novas integrações API | Fora do horizonte temporal |
| App mobile | Recursos insuficientes |
| Multi-tenancy | Complexidade excessiva |
| Internacionalização | Baixa prioridade |
| Streamlit/JupyterLab | Adiado para Q2 |
| PWA completo | Apenas modo offline básico |
| Real-time WebSocket | Polling é suficiente |
| ML model retraining | Usar modelo existente |

### 3.3 Fronteiras de Integração

```
┌─────────────────────────────────────────────────────┐
│                    IN SCOPE                          │
│  ┌───────────────┐  ┌───────────────┐               │
│  │ Admin Dashboard│  │ Neptune(ANG)  │               │
│  │   (Next.js)   │  │   (Next.js)   │               │
│  └───────┬───────┘  └───────┬───────┘               │
│          │                  │                        │
│          └────────┬─────────┘                        │
│                   ▼                                  │
│  ┌─────────────────────────────────────┐            │
│  │     Cloudflare Workers (APIs)       │            │
│  └─────────────────┬───────────────────┘            │
│                    │                                 │
│  ┌─────────────────┼───────────────────┐            │
│  │ D1 Database     │     KV Cache     │            │
│  └─────────────────┴───────────────────┘            │
└─────────────────────────────────────────────────────┘
                     │
                     ▼ OUT OF SCOPE
┌─────────────────────────────────────────────────────┐
│  External APIs (NASA, GFW, Copernicus, WoRMS)       │
│  → Manter integrações existentes, sem novas         │
└─────────────────────────────────────────────────────┘
```

---

## 4. ROADMAP DE 12 SEMANAS

### 4.1 Visão Geral

```
Semana:  1   2   3   4   5   6   7   8   9  10  11  12
         ├───────────┼───────────┼───────────┼────────┤
         │  FASE 1   │  FASE 2   │  FASE 3   │ FASE 4 │
         │ Estabil.  │ Features  │  Quality  │ Polish │
         └───────────┴───────────┴───────────┴────────┘
```

### 4.2 FASE 1: Estabilização & Performance (Semanas 1-3)

**Objetivo:** Atingir targets de performance e resolver dívida técnica crítica

#### Semana 1: Performance Audit & Quick Wins
| Dia | Tarefa | Entregável |
|-----|--------|------------|
| 1-2 | Lighthouse audit completo | Report baseline |
| 3 | Bundle analysis (webpack-bundle-analyzer) | Report de bundles |
| 4-5 | Implementar code splitting crítico | Lazy loading routes |

**Milestone S1:** Baseline de performance documentado

#### Semana 2: Bundle Optimization
| Dia | Tarefa | Entregável |
|-----|--------|------------|
| 1-2 | Tree shaking e dead code elimination | Bundle reduzido 20% |
| 3 | Image optimization (WebP, lazy load) | Assets otimizados |
| 4-5 | Critical CSS inline | CSS crítico separado |

**Milestone S2:** Admin Dashboard <2.1s load time

#### Semana 3: TypeScript & Debt Cleanup
| Dia | Tarefa | Entregável |
|-----|--------|------------|
| 1-2 | Resolver TS errors Admin Dashboard | 0 errors |
| 3-4 | Resolver TS errors Neptune(ANG) | 0 errors |
| 5 | Dependency updates (security) | package.json atualizado |

**Milestone S3:** Zero TypeScript errors, Neptune(ANG) <2s

### 4.3 FASE 2: Completar Features (Semanas 4-6)

**Objetivo:** Finalizar funcionalidades parcialmente implementadas

#### Semana 4: Time-Series Animations
| Dia | Tarefa | Entregável |
|-----|--------|------------|
| 1 | Deploy SQL migrations pendentes | Tabelas atualizadas |
| 2 | Deploy workers (ml-species-predictor, timeseries-api) | Workers live |
| 3-4 | Integrar TimeSeriesPlayer no app | Player funcional |
| 5 | Testar playback 30 FPS | Demo recording |

**Milestone S4:** Animações time-series funcionais

#### Semana 5: Historical Data & ML Integration
| Dia | Tarefa | Entregável |
|-----|--------|------------|
| 1-2 | Historical data population script | 30 dias de dados |
| 3-4 | Integrar ML predictions no UI | Species panel |
| 5 | Testar predictions end-to-end | Validation report |

**Milestone S5:** ML predictions visíveis no mapa

#### Semana 6: Conservation Dashboard
| Dia | Tarefa | Entregável |
|-----|--------|------------|
| 1-2 | Species catalog component | Lista 30 espécies |
| 3 | Conservation status display | IUCN badges |
| 4-5 | Basic export (CSV/JSON) | Export funcional |

**Milestone S6:** Conservation dashboard MVP

### 4.4 FASE 3: Quality & Testing (Semanas 7-9)

**Objetivo:** Aumentar test coverage e documentar APIs

#### Semana 7: E2E Testing Setup
| Dia | Tarefa | Entregável |
|-----|--------|------------|
| 1 | Configurar Playwright CI | GitHub Actions |
| 2-3 | Escrever E2E tests critical paths | 10 test cases |
| 4-5 | Smoke tests para Workers | 5 smoke tests |

**Milestone S7:** CI/CD com testes automatizados

#### Semana 8: Unit Tests & Coverage
| Dia | Tarefa | Entregável |
|-----|--------|------------|
| 1-2 | Unit tests Workers principais | 50% coverage workers |
| 3-4 | Unit tests componentes React | 30% coverage React |
| 5 | Coverage report consolidado | Jest report |

**Milestone S8:** 50% test coverage global

#### Semana 9: Documentation & API Specs
| Dia | Tarefa | Entregável |
|-----|--------|------------|
| 1-2 | Atualizar OpenAPI spec | openapi.yaml |
| 3 | API documentation (endpoints) | Markdown docs |
| 4-5 | Developer onboarding guide | CONTRIBUTING.md |

**Milestone S9:** Documentação técnica completa

### 4.5 FASE 4: Polish & Handoff (Semanas 10-12)

**Objetivo:** Finalizar, polir e preparar para manutenção contínua

#### Semana 10: Offline Mode & Resilience
| Dia | Tarefa | Entregável |
|-----|--------|------------|
| 1-2 | IndexedDB cache básico | Offline read |
| 3-4 | Service worker registration | SW funcional |
| 5 | Fallback UI para offline | UI informativo |

**Milestone S10:** Modo offline básico

#### Semana 11: Monitoring & Observability
| Dia | Tarefa | Entregável |
|-----|--------|------------|
| 1-2 | Health check endpoint melhorado | /health detalhado |
| 3 | Cloudflare Analytics setup | Dashboard métricas |
| 4-5 | Error tracking (Sentry free tier) | Errors tracked |

**Milestone S11:** Monitoring operacional

#### Semana 12: Final Polish & Release
| Dia | Tarefa | Entregável |
|-----|--------|------------|
| 1-2 | Bug fixes finais | Issues resolvidos |
| 3 | Performance final check | Lighthouse >90 |
| 4 | Release notes | CHANGELOG.md |
| 5 | Deploy final & tag release | v2.2.0 |

**Milestone S12:** Release v2.2.0

---

## 5. PRIORIZAÇÃO (MoSCoW)

### 5.1 MUST HAVE (Obrigatório)

| ID | Requisito | Semana | Esforço |
|----|-----------|--------|---------|
| M1 | Performance <2s todos os apps | 1-3 | Alto |
| M2 | Zero TypeScript errors | 3 | Médio |
| M3 | Dependency security updates | 3 | Baixo |
| M4 | TimeSeriesPlayer integrado | 4 | Médio |
| M5 | E2E tests critical paths | 7 | Médio |
| M6 | Health check melhorado | 11 | Baixo |

### 5.2 SHOULD HAVE (Importante)

| ID | Requisito | Semana | Esforço |
|----|-----------|--------|---------|
| S1 | Historical data 30 dias | 5 | Médio |
| S2 | ML predictions no UI | 5 | Médio |
| S3 | Conservation dashboard MVP | 6 | Médio |
| S4 | 50% test coverage | 7-8 | Alto |
| S5 | OpenAPI spec atualizado | 9 | Médio |
| S6 | Error tracking | 11 | Baixo |

### 5.3 COULD HAVE (Desejável)

| ID | Requisito | Semana | Esforço |
|----|-----------|--------|---------|
| C1 | Export CSV/JSON | 6 | Baixo |
| C2 | Offline mode básico | 10 | Médio |
| C3 | Developer onboarding guide | 9 | Baixo |
| C4 | Cloudflare Analytics | 11 | Baixo |

### 5.4 WON'T HAVE (Explicitamente Excluído)

| ID | Requisito | Razão |
|----|-----------|-------|
| W1 | Export PDF | Complexidade vs valor |
| W2 | PWA completo | Fora do scope |
| W3 | Real-time WebSocket | Polling suficiente |
| W4 | Multi-language | Baixa prioridade |
| W5 | Mobile app | Recursos insuficientes |

---

## 6. DEPENDÊNCIAS TÉCNICAS

### 6.1 Dependências Internas

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPENDENCY GRAPH                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Performance Opt]                                           │
│         │                                                    │
│         ▼                                                    │
│  [TS Error Fix] ──────► [E2E Tests]                         │
│         │                    │                               │
│         ▼                    ▼                               │
│  [TimeSeriesPlayer] ──► [Integration Tests]                  │
│         │                    │                               │
│         ▼                    ▼                               │
│  [Historical Data] ──► [ML Predictions UI]                   │
│         │                    │                               │
│         ▼                    ▼                               │
│  [Conservation Dashboard] ◄──┘                               │
│         │                                                    │
│         ▼                                                    │
│  [Export CSV/JSON]                                           │
│         │                                                    │
│         ▼                                                    │
│  [Offline Mode] ──► [Monitoring] ──► [Release v2.2.0]       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Dependências Externas

| Dependência | Tipo | Risco | Mitigação |
|-------------|------|-------|-----------|
| Cloudflare Workers | Infraestrutura | Baixo | Vendor lock-in aceitável |
| NASA EarthData API | Dados | Médio | Cache 24h, fallback synthetic |
| Global Fishing Watch | Dados | Médio | Cache 24h, rate limit handling |
| Copernicus Marine | Dados | Médio | Cache 24h, auth token rotation |
| WoRMS API | Dados | Baixo | Cache permanente (taxonomia estável) |

### 6.3 Dependências de Skills

| Skill | Necessário | Disponível | Gap |
|-------|------------|------------|-----|
| Next.js/React | Alto | ✅ Sim | - |
| TypeScript | Alto | ✅ Sim | - |
| Cloudflare Workers | Alto | ✅ Sim | - |
| deck.gl/WebGL | Médio | ✅ Sim | - |
| TensorFlow.js | Médio | ⚠️ Parcial | ML training |
| Playwright | Médio | ⚠️ Parcial | Setup inicial |

---

## 7. RISCOS E MITIGAÇÃO

### 7.1 Matriz de Riscos

| ID | Risco | Prob. | Impacto | Score | Mitigação |
|----|-------|-------|---------|-------|-----------|
| R1 | Single-dev ausência | Alta | Crítico | 🔴 | Documentação, código limpo |
| R2 | Rate limits APIs externas | Média | Alto | 🟠 | Cache agressivo, fallbacks |
| R3 | Scope creep | Média | Médio | 🟡 | Scope fixo, change control |
| R4 | Performance não atingida | Baixa | Alto | 🟡 | Quick wins primeiro |
| R5 | Breaking changes deps | Baixa | Médio | 🟢 | Lock versions, test antes |
| R6 | D1 database limits | Baixa | Médio | 🟢 | Pagination, indexing |

### 7.2 Planos de Contingência

#### R1: Single-dev ausência (Alta probabilidade)
```
Trigger: Dev indisponível >3 dias
Acção:
  1. Deploy automático está configurado
  2. Documentação permite handoff
  3. Escalar para Paulo/Leite para decisão
  4. Contratar freelancer se >1 semana
```

#### R2: Rate limits APIs (Média probabilidade)
```
Trigger: 429 errors >10/hora
Acção:
  1. Ativar synthetic data fallback
  2. Aumentar cache TTL temporariamente
  3. Implementar exponential backoff
  4. Contactar provider se persistir
```

#### R3: Scope creep (Média probabilidade)
```
Trigger: Request fora do scope
Acção:
  1. Documentar request
  2. Avaliar impacto no timeline
  3. Requerer aprovação formal
  4. Adicionar a backlog Q2 se rejeitado
```

### 7.3 Risk Monitoring

| Indicador | Threshold | Frequência Check |
|-----------|-----------|------------------|
| Build failures | >2 consecutivos | Por commit |
| API error rate | >5% | Diário |
| Load time regression | >0.5s | Semanal |
| Test failures | >10% | Por PR |
| Dependency vulnerabilities | Any critical | Semanal |

---

## 8. CRITÉRIOS DE ACEITAÇÃO

### 8.1 Critérios por Milestone

#### Phase 1: Estabilização (Semanas 1-3)
| Critério | Métrica | Target |
|----------|---------|--------|
| Admin Dashboard load time | Lighthouse | <2.0s |
| Neptune(ANG) load time | Lighthouse | <2.0s |
| TypeScript errors | tsc --noEmit | 0 |
| Security vulnerabilities | npm audit | 0 critical |
| Bundle size reduction | webpack analysis | >20% |

#### Phase 2: Features (Semanas 4-6)
| Critério | Métrica | Target |
|----------|---------|--------|
| TimeSeriesPlayer | Manual test | Play/pause funcional |
| Animation FPS | Performance monitor | ≥30 FPS |
| Historical data | D1 query | 30 dias SST, Salinity |
| Species catalog | Visual check | 30 espécies listadas |
| ML predictions | API response | Prediction com confidence |

#### Phase 3: Quality (Semanas 7-9)
| Critério | Métrica | Target |
|----------|---------|--------|
| E2E tests passing | Playwright | 100% |
| Test coverage | Jest | ≥50% |
| API documentation | OpenAPI validation | Valid spec |
| CI pipeline | GitHub Actions | Green on main |

#### Phase 4: Polish (Semanas 10-12)
| Critério | Métrica | Target |
|----------|---------|--------|
| Offline mode | Manual test | Read works offline |
| Error tracking | Sentry dashboard | Errors visible |
| Lighthouse score | All categories | ≥90 |
| Release tag | Git | v2.2.0 deployed |

### 8.2 Definition of Done (DoD)

Uma tarefa está **DONE** quando:

- [ ] Código implementado e funcional
- [ ] Sem erros TypeScript/ESLint
- [ ] Testado localmente
- [ ] Code review self-check
- [ ] Deployed to staging/production
- [ ] Documentação atualizada (se aplicável)
- [ ] Ticket/issue fechado

### 8.3 Definition of Ready (DoR)

Uma tarefa está **READY** quando:

- [ ] Requisitos claros e específicos
- [ ] Critérios de aceitação definidos
- [ ] Dependências identificadas e resolvidas
- [ ] Estimativa de esforço feita
- [ ] Não há blockers conhecidos

---

## 9. PREMISSAS E RESTRIÇÕES

### 9.1 Premissas

| ID | Premissa | Impacto se Falsa |
|----|----------|------------------|
| P1 | Infraestrutura Cloudflare estável | Alto - requer replanning |
| P2 | APIs externas disponíveis | Médio - usar fallbacks |
| P3 | Acesso contínuo a credenciais | Alto - blocker total |
| P4 | Requisitos não mudam significativamente | Médio - scope creep |
| P5 | Developer disponível 40h/semana | Alto - timeline extends |

### 9.2 Restrições

| ID | Restrição | Tipo |
|----|-----------|------|
| C1 | Single developer | Recursos |
| C2 | 12 semanas timeline | Tempo |
| C3 | Zero budget adicional | Financeiro |
| C4 | Manter stack existente | Técnico |
| C5 | Sem breaking changes na API | Técnico |
| C6 | Português como língua principal | Negócio |

### 9.3 Assumptions Log

```
Data: 06/01/2026
Log de Premissas Validadas:
[✓] Cloudflare account ativo (majearcasa)
[✓] Todos os secrets configurados
[✓] D1 database com dados
[✓] GitHub repo acessível
[✓] Wrangler CLI funcional
[✓] Node.js 18+ instalado
[✓] Acesso à internet estável
```

---

## 10. GOVERNANCE & COMUNICAÇÃO

### 10.1 Estrutura de Decisão

```
┌─────────────────────────────────────────────────┐
│            DECISÕES ESTRATÉGICAS                │
│  (Scope changes, budget, timeline major)        │
│           Paulo Fernandes / Eng. Leite          │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│            DECISÕES TÉCNICAS                    │
│  (Arquitectura, tools, implementation)          │
│              Marcos Santos                       │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│            EXECUÇÃO                              │
│  (Code, deploy, test)                           │
│              Marcos Santos                       │
└─────────────────────────────────────────────────┘
```

### 10.2 Checkpoints

| Semana | Checkpoint | Participantes | Output |
|--------|------------|---------------|--------|
| 3 | Phase 1 Review | Marcos | Status report |
| 6 | Phase 2 Review | Marcos, Paulo | Demo + report |
| 9 | Phase 3 Review | Marcos | Quality report |
| 12 | Final Review | Marcos, Paulo, Leite | Release sign-off |

### 10.3 Reporting

| Report | Frequência | Audiência | Formato |
|--------|------------|-----------|---------|
| Daily log | Diário | Self | Git commits |
| Weekly summary | Semanal | Paulo | Email/Slack |
| Milestone report | Por fase | Stakeholders | Markdown doc |
| Final report | End of Q1 | All | Presentation |

---

## 11. ENTREGÁVEIS

### 11.1 Lista de Entregáveis

| ID | Entregável | Semana | Tipo |
|----|------------|--------|------|
| E1 | Performance baseline report | 1 | Documento |
| E2 | Admin Dashboard otimizado | 2 | Código |
| E3 | Neptune(ANG) otimizado | 3 | Código |
| E4 | TimeSeriesPlayer integrado | 4 | Feature |
| E5 | Historical data populated | 5 | Dados |
| E6 | Conservation Dashboard MVP | 6 | Feature |
| E7 | E2E test suite | 7 | Testes |
| E8 | API documentation | 9 | Documento |
| E9 | Offline mode | 10 | Feature |
| E10 | Monitoring dashboard | 11 | Infraestrutura |
| E11 | Release v2.2.0 | 12 | Release |
| E12 | Final report | 12 | Documento |

### 11.2 Acceptance Sign-off

```
SIGN-OFF TEMPLATE

Entregável: [ID - Nome]
Data: [DD/MM/YYYY]
Versão: [X.X.X]

Critérios de Aceitação:
[ ] Critério 1: [PASS/FAIL]
[ ] Critério 2: [PASS/FAIL]
[ ] Critério 3: [PASS/FAIL]

Comentários:
_________________________________

Aprovado por: ___________________
Data: __________________________
```

---

## 12. ANEXOS

### Anexo A: Comandos de Referência

```bash
# Development
npm run dev:admin          # Admin Dashboard
npm run dev:realtime       # Neptune(ANG)
npm run dev                # Frontend principal

# Deploy
npm run deploy:all         # Deploy everything
wrangler deploy            # Deploy workers

# Database
wrangler d1 execute bgapp-data --remote --command "SELECT 1;"
wrangler d1 backup create bgapp-data

# Testing
npm run lint
npx playwright test
npm run test

# Monitoring
wrangler tail api-worker --format=pretty
bash .claude/monitor-apis.sh
```

### Anexo B: URLs de Produção

| Serviço | URL |
|---------|-----|
| Admin Dashboard | https://bgapp-admin.pages.dev |
| Neptune(ANG) | https://bgapp-realtime.pages.dev |
| Frontend | https://bgapp-frontend.pages.dev |
| API Worker | https://bgapp-api-worker.majearcasa.workers.dev |

### Anexo C: Contacts

| Papel | Nome | Email |
|-------|------|-------|
| Tech Lead | Marcos Santos | marcos@maredatum.com |
| Director | Paulo Fernandes | paulo@maredatum.com |
| Co-Director | Eng. Leite | leite@maredatum.com |

---

## 13. HISTÓRICO DE VERSÕES

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | 06/01/2026 | Marcos Santos | Versão inicial |

---

## 14. APROVAÇÕES

| Papel | Nome | Data | Assinatura |
|-------|------|------|------------|
| Tech Lead | Marcos Santos | ___/___/2026 | _____________ |
| Director | Paulo Fernandes | ___/___/2026 | _____________ |
| Co-Director | Eng. Leite | ___/___/2026 | _____________ |

---

**Documento preparado por:** Marcos Santos  
**Data:** 6 de Janeiro de 2026  
**Classificação:** Interno  

---

*Este documento é propriedade de MareDatum Consultoria e Gestão de Projectos Unipessoal LDA*

