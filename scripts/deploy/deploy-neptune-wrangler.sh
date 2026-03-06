#!/bin/bash

echo "🌊 NEPTUNE - Deploy via Wrangler"
echo "================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Remover variável de ambiente conflitante
unset CLOUDFLARE_API_TOKEN
unset CLOUDFLARE_API_KEY
unset CLOUDFLARE_EMAIL

echo -e "${BLUE}📋 Configuração do Deploy:${NC}"
echo "• Projeto: bgapp-frontend"
echo "• Diretório: ./apps/frontend"
echo "• Branch: main"
echo ""

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler não encontrado!${NC}"
    echo "Instale com: npm install -g wrangler"
    exit 1
fi

echo -e "${BLUE}🔐 Verificando autenticação...${NC}"
wrangler whoami

# Fazer o deploy
echo -e "\n${BLUE}🚀 Iniciando deploy manual...${NC}"
echo "Executando: wrangler pages deploy ./apps/frontend --project-name bgapp-frontend --branch main"
echo ""

# Deploy com output detalhado
wrangler pages deploy ./apps/frontend \
    --project-name bgapp-frontend \
    --branch main \
    --commit-dirty=true

# Verificar se o deploy foi bem sucedido
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Deploy realizado com sucesso!${NC}"
    echo ""
    echo "🌊 Neptune foi enviado para:"
    echo "   → https://bgapp-frontend.pages.dev/BGAPP/"
    echo ""
    echo "⏱️  O deploy deve estar disponível em 1-2 minutos"
else
    echo -e "\n${RED}❌ Erro no deploy!${NC}"
    echo ""
    echo "🔧 Possíveis soluções:"
    echo "1. Execute: wrangler logout && wrangler login"
    echo "2. Verifique as permissões no Cloudflare Dashboard"
    echo "3. Tente criar um novo API Token com permissões de Pages"
fi

