# Plano de Organização BGAPP - SEM ALTERAR FUNCIONALIDADE

## Situação Atual
- ✅ Frontend funcional em `infra/frontend/` 
- ✅ Cloudflare configurado corretamente (`wrangler.toml` → `./infra/frontend`)
- ❌ Diretório raiz desorganizado com muitos arquivos soltos

## Plano de Organização (SEM QUEBRAR NADA!)

### 1. MANTER INTACTOS (NÃO MOVER):
```
infra/                    # Frontend principal - NÃO TOCAR!
workers/                  # Workers Cloudflare - NÃO TOCAR!
wrangler.toml            # Config Cloudflare - NÃO TOCAR!
wrangler-pages.toml      # Config Pages - NÃO TOCAR!
package.json             # Dependências - NÃO TOCAR!
node_modules/            # Módulos Node - NÃO TOCAR!
```

### 2. ORGANIZAR POR CATEGORIAS:

#### A. Scripts de Deployment → `deployment/`
- `deploy_*.py`
- `deploy_*.sh` 
- `auto_deploy.py`
- `setup_*.py`
- `DEPLOY_REPORT_*.md`

#### B. Arquivos de Teste → `testing/`
- `test_*.py`
- `test_*.html`
- `test_*.js`
- `test-*.html`

#### C. Configurações → `config/`
- `*.env`
- `*.json` (configs)
- `cloudflare-*.json`
- `copernicus_*.json`

#### D. Logs e Relatórios → `reports/`
- `*.log`
- `health_check_report_*.md`
- `*_REPORT*.md`

#### E. Utilitários → `utils/`
- `create_*.py`
- `fix_*.py`
- `update_*.py`
- `verify_*.py`

#### F. Documentação de Correções → `docs/fixes/`
- `CORRECAO_*.md`
- `CORRECOES_*.md`

### 3. MANTER NO RAIZ (ESSENCIAIS):
- `README.md` (se existir)
- `LICENSE`
- `COPYRIGHT.md`
- `requirements*.txt`
- `pyproject.toml`
- `Makefile`

## Execução Segura:
1. Criar diretórios de organização
2. Mover arquivos SEM tocar em `infra/` e `workers/`
3. Testar funcionalidade
4. Deploy usando wrangler (sem alterações)
