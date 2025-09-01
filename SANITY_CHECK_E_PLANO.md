## Sanity check e plano de melhorias — BGAPP

**Data:** 2025-09-01  
**Escopo:** Frontend PWA, Admin API (FastAPI), Metocean API, STAC simples, pygeoapi, serviços Docker (PostGIS, MinIO, Redis, Celery, Keycloak), scripts de arranque.

### Visão geral
- **Arquitetura:** frontend estático com PWA e service workers; servidor simples para `index.html`; múltiplos serviços Docker (PostGIS, MinIO, FastAPI Admin API, Celery, Redis, Keycloak, pygeoapi, STAC).
- **Qualidade:** documentação ampla; scripts de arranque/testes; separação clara por domínios (metocean, admin, STAC, gateway, QGIS).
- **Riscos:** CORS permissivo, credenciais default em dev, exposição via ngrok, healthchecks desativados, servidor estático single-thread.

### Pontos fortes
- **Arquitetura modular:** `FastAPI` (Admin/Metocean), STAC simples, `pygeoapi`, `Celery/Redis`, `PostGIS`, `MinIO`.
- **PWA e offline:** `sw.js` e SW específico de vento; estratégias de cache e fallback de rede.
- **Documentação:** guias/relatórios de implementação, auditoria e segurança.
- **Config centralizada:** `BaseSettings` com `.env` e `secure_config`.
- **Dev UX:** `docker-compose`, scripts de arranque, OAuth2 Proxy para pygeoapi, Keycloak integrado.
- **Observabilidade prevista:** módulos de logging/monitorização (design) e health básicos.
- **Frontend rico:** `index.html`, `dashboard_cientifico.html`, `admin.html`, `mobile_pwa.html` e assets organizados.

### Pontos a melhorar (principais riscos)
- **CORS permissivo:** origens `*`, métodos e headers `*` em desenvolvimento. Recomenda-se restringir por ambiente.
- **Credenciais padrão:** `postgres/postgres`, `minio/minio123`, Keycloak admin default. Trocar em `.env` e compose.
- **Exposição remota via ngrok:** script público imprime credenciais e expõe a app. Desativar por padrão; uso apenas local.
- **Segurança desativada em debug:** rate limiting, auth enterprise/gateway temporariamente desabilitados.
- **Servidor estático single-thread:** limita concorrência; preferir `nginx` local ou servidor threading para dev.
- **Healthchecks desativados:** reativar para `pygeoapi`, `stac`, `minio` com períodos adequados.
- **Pins de versão:** evitar `latest` e pin de libs/imagens para reduzir drift.
- **Service workers:** revisar listas de exclusão e versões para evitar cache indevido de APIs/conteúdo dinâmico.
- **Fallback permissivo de settings:** evitar defaults amplos quando `secure_config` falhar.

### Plano de ação (priorizado)

#### Urgente (1–2 semanas)
- [ ] **Trancar CORS por ambiente**: remover `*`; whitelist de origens locais em dev e domínios explícitos em prod; limitar métodos/headers necessários.
- [ ] **Ativar autenticação e rate limiting**: garantir `JWT_SECRET_KEY` forte; ativar middleware de auth e gateway de rate limit no Admin API.
- [ ] **Rotacionar credenciais default**: Postgres/MinIO/Keycloak com segredos fortes via `.env`; nunca imprimir em logs.
- [ ] **Desativar exposição remota**: desabilitar `start_bgapp_public.sh` por padrão ou proteger com `ENV=dev`; manter execução apenas local no terminal.
- [ ] **Healthchecks**: reativar healthchecks dos serviços (`pygeoapi`, `stac`, `minio`) com `start_period` e `retries` adequados.
- [ ] **Servidor de estáticos**: usar `nginx` local (já presente no compose) como padrão; em dev, considerar servidor threading.

#### Importante (2–4 semanas)
- [ ] **Observabilidade**: logging estruturado (JSON), correlação de requests; métricas (latência/contagem) por endpoint; dashboards mínimos.
- [ ] **Health/readiness**: endpoints liveness/readiness adicionais no Admin API e Metocean.
- [ ] **Configuração**: validar `.env` em startup; falha hard quando variáveis críticas ausentes; remover `FallbackSettings` permissivos.
- [ ] **Pin de versões**: imagens Docker e libs Python/JS; automatizar updates (renovate/dependabot).
- [ ] **CI**: pipeline com `run_tests.sh`, linters e security scans; build/preview do frontend (Vite) e validação PWA.

#### Desejável (1–2 meses)
- [ ] **Performance**: cache por endpoint crítico (Redis), compressão e ETags; otimizar tiles/animações; ajustar estratégias de cache dos SW.
- [ ] **Segurança avançada**: hardening `nginx`, headers de segurança e CSP estrita; evitar cache de endpoints autenticados; MFA e roles completas.
- [ ] **DX**: script único `start_bgapp_local.sh` (foreground) que sobe apenas serviços locais, sem exposição externa; perfis `dev/local/ci/prod` documentados.

### Notas de implementação
- Priorizar alterações que reduzam superfície de ataque (CORS/credenciais) sem bloquear o fluxo de desenvolvimento local.
- Garantir rollback simples (feature flags por ambiente) e documentação clara das mudanças.


