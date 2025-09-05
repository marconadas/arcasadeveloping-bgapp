# 🚀 BGAPP Admin Dashboard - Instruções de Deploy

## ✅ Status Atual
- **Branch:** main
- **Commit:** Correções TypeScript completas
- **Build:** ✅ Sem erros
- **TypeScript:** ✅ 0 erros (95 corrigidos)

## 📋 Pré-requisitos

1. **Node.js 18+** instalado
2. **Conta Cloudflare** (para deploy em produção)
3. **Git** configurado

## 🔧 Setup Inicial

```bash
# 1. Clonar o repositório
git clone https://github.com/marconadas/arcasadeveloping-bgapp.git
cd arcasadeveloping-bgapp/admin-dashboard

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas configurações
```

## 🏗️ Build Local

```bash
# Build de produção
npm run build

# Verificar tipos TypeScript
npm run type-check
```

## 🖥️ Teste Local

```bash
# Servidor de desenvolvimento
npm run dev
# Acesso: http://localhost:3000

# Servidor de produção
npm run build
npm run start
# Acesso: http://localhost:3000
```

## ☁️ Deploy no Cloudflare Pages

### Opção 1: Via Cloudflare Dashboard (Recomendado)

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vá para **Pages**
3. Clique em **Create a project**
4. Conecte seu GitHub: `marconadas/arcasadeveloping-bgapp`
5. Configure o build:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Root directory:** `admin-dashboard`
6. Clique em **Save and Deploy**

### Opção 2: Via Wrangler CLI

```bash
# 1. Login no Cloudflare
npx wrangler login

# 2. Deploy
cd admin-dashboard
npx wrangler pages deploy out --project-name bgapp-admin

# Ou use o script automático
./quick-deploy.sh
```

### Opção 3: GitHub Actions (CI/CD)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
    paths:
      - 'admin-dashboard/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        working-directory: ./admin-dashboard
        run: npm ci
        
      - name: Build
        working-directory: ./admin-dashboard
        run: npm run build
        
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: bgapp-admin
          directory: admin-dashboard/out
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

## 🔑 Configurar Secrets no GitHub

1. Vá para **Settings** > **Secrets** no repositório
2. Adicione:
   - `CLOUDFLARE_API_TOKEN`: [Criar token](https://dash.cloudflare.com/profile/api-tokens)
   - `CLOUDFLARE_ACCOUNT_ID`: Encontre em Cloudflare Dashboard

## 🌐 URLs de Produção

- **Principal:** https://bgapp-admin.pages.dev
- **Preview:** https://[branch].bgapp-admin.pages.dev

## 📊 Verificação Pós-Deploy

```bash
# Verificar status
curl -I https://bgapp-admin.pages.dev

# Testar APIs
curl https://bgapp-admin.pages.dev/api/health
```

## 🐛 Troubleshooting

### Erro de Build
```bash
# Limpar cache
rm -rf .next node_modules
npm install
npm run build
```

### Erro de Deploy
```bash
# Verificar login
npx wrangler whoami

# Re-autenticar
npx wrangler login
```

### TypeScript Errors
```bash
# Verificar tipos
npm run type-check

# Se houver erros
npm run lint
```

## 📝 Notas Importantes

1. **Build Output:** O Next.js exporta para a pasta `out/`
2. **Static Export:** Configurado para exportação estática
3. **APIs:** Usam Cloudflare Workers
4. **Cache:** Cloudflare CDN ativo

## 🆘 Suporte

- **GitHub Issues:** [Reportar problema](https://github.com/marconadas/arcasadeveloping-bgapp/issues)
- **Documentação:** Ver `/docs` no repositório

---

**Última atualização:** 05/09/2025
**Versão:** 2.0.0
**Status:** ✅ Pronto para Deploy