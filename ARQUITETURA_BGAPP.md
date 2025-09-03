## Arquitetura técnica da BGAPP (resumo)

A BGAPP foi concebida com apoio de IA para acelerar decisões e visualização técnico‑científica no domínio marítimo. A solução é modular, combina frontend moderno, serviços Python, conectores a dados geoespaciais e uma camada de edge em Cloudflare para desempenho e segurança.

### Componentes principais

- **Frontend (Admin Dashboard)**: interface React/Next.js em `admin-dashboard/` (TypeScript), com componentes de gestão, mapas EOX/Leaflet, animações de vento WebGL e módulos nativos da BGAPP (p.ex. filtros preditivos). Consome APIs internas e serviços externos. Inclui páginas de diagnóstico/QA e integrações com service worker quando aplicável.

- **Frontend estático de teste/diagnóstico**: arquivos `test_*.html` e utilitários em raiz para validar hidratação, CORS, dashboards, integração de serviços e performance do mapa.

- **Backend Python (APIs e serviços)**: serviços de administração e utilidades expostos por scripts como `admin_api_complete.py`, `admin_api_simple.py` e `server_index.py`. Há conectores especializados (STAC, Copernicus, EOX, GEBCO), utilitários de segurança/observabilidade e agendadores (`start_scheduler.py`). Configurações em `configs/`, templates em `templates/`, estáticos em `static/` e logs em `logs/`/`*.log`.

- **Camada Edge/Workers (Cloudflare)**: `bgapp-cors-proxy.js` e `wrangler.toml` implementam proxy seguro, políticas de CORS, cache e aceleração na borda. Auxilia integração com terceiros, diminui latência e protege o backend. Deploy orientado por `DEPLOY_CLOUDFLARE_INSTRUCTIONS.md` e scripts `deploy_*`/`setup_*`.

- **Conectores e dados externos**: suporte a catálogos STAC (`requirements-stac.txt`), serviços Copernicus (`copernicus_config.json`, `realtime_copernicus_angola.json`), camadas EOX e batimetria GEBCO. Módulos dedicados tratam autenticação, paginação, normalização e cache de respostas.

- **Armazenamento/Cache**: integração com MinIO/S3 quando necessário (p.ex. `MINIO_STORAGE_FIX_REPORT.md`) e suporte a cache Redis quando disponível (`fix_redis_cache.py`).

- **Qualidade, segurança e testes**: suíte mista com `tests/` e arquivos `test_*.py`/`test_*.html`/`test_*.js` para cobrir APIs, UI, CORS, hidratação e integrações. Guias e relatórios de auditoria/segurança (`AUDITORIA_*`, `RELATORIO_*`, `GUIA_*`) acompanham correções e decisões.

### Fluxo de dados (alto nível)

```mermaid
graph LR
  U[Utilizador/Browser] --> CF[Cloudflare Pages/Edge]
  CF --> W[Worker bgapp-cors-proxy.js]
  W --> B[APIs Python (admin_api_* / server_index.py)]
  B --> C[Conectores (STAC/Copernicus/EOX/GEBCO)]
  B --> S[Armazenamento/Cache (MinIO/Redis)]
  CF -->|Assets estáticos| FE[Admin Dashboard]
  B -->|JSON/GeoJSON| FE
```

### Segurança

- **CORS na borda**: políticas aplicadas no Worker para isolar origens e mitigar erros de pré‑flight.
- **Proteções de aplicação**: validação de entrada, testes de SQL Injection e CSRF (`test_sql_injection_final.py`, `test_csrf_standalone.py`).
- **Gestão de segredos**: configuração via `.env`/`env.example` e artefatos cifrados (`secure_credentials.enc`).
- **Rate limiting e contenção**: mecanismos documentados no painel/admin para resiliência sob carga.

### Deploy e operação

- **Cloudflare Pages + Workers** para servir o frontend e executar a camada de edge. Scripts `deploy_*`, `setup_*` e guias `DEPLOY_*.md` automatizam o processo.
- **Execução local**: scripts `start_bgapp_*`, `watch_and_reload.sh` e `run_tests.sh` simplificam desenvolvimento e QA. Dependências: `package.json` (frontend) e `requirements*.txt` (Python).
- **Observabilidade**: logs (`api.log`, `frontend_debug.log`) e páginas de diagnóstico (`debug_frontend_api.html`, `test_frontend_api_debug.html`).

### Padrões e decisões

- **Modularidade**: separação clara entre UI, serviços Python e edge, para escalar e trocar componentes sem impacto sistêmico.
- **APIs orientadas a dados geoespaciais**: respostas em JSON/GeoJSON, normalizadas para camadas de mapa e análises.
- **Performance**: cache seletivo no Worker/backend, uso de tiles/backgrounds EOX, otimizações de hidratação e renderização em mapas/partículas de vento.

### Como começar (resumo)

1. Instalar dependências do frontend: `npm install` na raiz (ou dentro de `admin-dashboard/`, conforme fluxo definido).
2. Instalar dependências do backend: `pip install -r requirements.txt` (e, conforme necessário, `requirements-stac.txt`/`requirements-connectors.txt`).
3. Executar localmente: um dos scripts `start_bgapp_local.sh`/`start_bgapp_enhanced.sh` para subir frontend, APIs e proxies de desenvolvimento.
4. Validar: abrir páginas `test_*` e rodar `run_tests.sh` para garantir CORS, hidratação e integridade das integrações.

—
Este resumo foca a visão sistêmica e técnica. Os relatórios `RELATORIO_*`/`AUDITORIA_*` registram histórico de correções, escolhas de design e lições aprendidas que orientaram a arquitetura atual.


