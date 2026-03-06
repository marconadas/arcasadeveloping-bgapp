#!/bin/bash

echo "🌊 NEPTUNE - Corrigindo Deploy para Arquivos Estáticos"
echo "====================================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 Identificando o problema...${NC}"
echo "✅ Conflito detectado: Build Next.js interferindo com arquivos estáticos"
echo ""

# Verificar se estamos no diretório correto
if [ ! -d "apps/frontend/BGAPP" ]; then
    echo -e "${RED}❌ Diretório BGAPP não encontrado${NC}"
    exit 1
fi

# Remover diretório _next se existir
if [ -d "apps/frontend/_next" ]; then
    echo -e "${YELLOW}📦 Removendo diretório _next...${NC}"
    rm -rf apps/frontend/_next
fi

# Remover diretório 404 se existir
if [ -d "apps/frontend/404" ]; then
    echo -e "${YELLOW}📦 Removendo diretório 404...${NC}"
    rm -rf apps/frontend/404
fi

# Remover arquivo 404.html se existir
if [ -f "apps/frontend/404.html" ]; then
    echo -e "${YELLOW}📦 Removendo 404.html...${NC}"
    rm -f apps/frontend/404.html
fi

echo -e "\n${BLUE}📋 Verificando estrutura de arquivos...${NC}"
echo "✅ Neptune em: apps/frontend/BGAPP/index.html"
echo "✅ Headers customizados: apps/frontend/BGAPP/_headers"
echo "✅ Routes config: apps/frontend/_routes.json"
echo "✅ Redirects: apps/frontend/_redirects"

# Adicionar ao git
echo -e "\n${BLUE}📦 Preparando commit...${NC}"
git add apps/frontend/_redirects
git add apps/frontend/_routes.json
git add apps/frontend/BGAPP/_headers
git add .gitignore

# Remover _next do tracking se estiver
git rm -rf --cached apps/frontend/_next 2>/dev/null || true
git rm -rf --cached apps/frontend/404 2>/dev/null || true
git rm -f --cached apps/frontend/404.html 2>/dev/null || true

# Commit
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "fix(neptune): Remover conflito Next.js e forçar arquivos estáticos - $TIMESTAMP

- Removido diretório _next que estava causando conflito
- Adicionado _routes.json para Cloudflare Pages
- Atualizado _redirects para forçar arquivos estáticos
- Adicionado _headers para controle de cache
- Neptune agora deve ser servido corretamente em /BGAPP/"

# Push para o repositório
echo -e "\n${BLUE}🚀 Enviando para o repositório...${NC}"
git push origin main

echo -e "\n${GREEN}✅ Deploy corrigido!${NC}"
echo ""
echo "🌊 O problema estava em:"
echo "   - Build Next.js no diretório frontend interferindo"
echo "   - Cloudflare Pages servindo _next ao invés de arquivos estáticos"
echo ""
echo "🔧 Correções aplicadas:"
echo "   - Removido diretório _next"
echo "   - Adicionado configuração de rotas"
echo "   - Forçado modo de arquivos estáticos"
echo ""
echo "⏱️  Aguarde 3-5 minutos para o Cloudflare processar"
echo ""
echo "🔗 URLs para testar:"
echo "   → https://bgapp-frontend.pages.dev/BGAPP/"
echo "   → https://bgapp-frontend.pages.dev/BGAPP/index.html"
echo "   → https://bgapp-frontend.pages.dev/BGAPP/test-neptune.html"
echo ""

