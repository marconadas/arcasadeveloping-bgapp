#!/bin/bash

echo "🔍 Verificando Deploy do Neptune"
echo "================================"
echo ""

# URLs para verificar
BASE_URL="https://bgapp-frontend.pages.dev"
NEPTUNE_URL="$BASE_URL/BGAPP/"
DIRECT_URL="$BASE_URL/BGAPP/index.html"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 Verificando conteúdo servido...${NC}"
echo ""

# Função para verificar URL
check_url() {
    local url=$1
    local desc=$2
    echo -e "${YELLOW}Verificando: $desc${NC}"
    echo "URL: $url"
    
    # Buscar pelo título da página
    TITLE=$(curl -s "$url" | grep -o '<title>.*</title>' | sed 's/<[^>]*>//g')
    
    if [[ $TITLE == *"Neptune"* ]]; then
        echo -e "${GREEN}✅ Neptune detectado!${NC}"
        echo "   Título: $TITLE"
    elif [[ $TITLE == *"BGAPP"* ]]; then
        echo -e "${RED}❌ Ainda servindo BGAPP${NC}"
        echo "   Título: $TITLE"
    else
        echo -e "${YELLOW}⚠️  Título não identificado${NC}"
        echo "   Título: $TITLE"
    fi
    echo ""
}

# Verificar URLs
check_url "$NEPTUNE_URL" "URL principal do Neptune"
check_url "$DIRECT_URL" "URL direta do index.html"

# Verificar headers de cache
echo -e "${BLUE}📋 Verificando headers de cache...${NC}"
echo ""
echo "Headers da URL principal:"
curl -I -s "$NEPTUNE_URL" | grep -E "(cache-control|etag|last-modified|cf-cache-status)" || echo "Nenhum header de cache encontrado"
echo ""

# Status do deploy
echo -e "${BLUE}📋 Status do último deploy...${NC}"
echo ""
git log -1 --oneline --date=relative --pretty=format:'Commit: %h - %s (%ar)%n'
echo ""

# Instruções finais
echo -e "${BLUE}🔧 Soluções de problemas:${NC}"
echo ""
echo "1. Se ainda vê BGAPP:"
echo "   - Limpe o cache do navegador (Ctrl+Shift+R)"
echo "   - Teste em modo anônimo/privado"
echo "   - Aguarde mais 2-3 minutos"
echo ""
echo "2. Para forçar purge do cache Cloudflare:"
echo "   - Acesse: https://dash.cloudflare.com"
echo "   - Vá em: Pages > bgapp-frontend > Settings > Caching"
echo "   - Clique em 'Purge Cache'"
echo ""
echo "3. Verificar no Cloudflare Pages:"
echo "   - Dashboard: https://dash.cloudflare.com/?to=/:account/pages"
echo "   - Procure por 'bgapp-frontend'"
echo "   - Verifique o status do último deployment"
echo ""
