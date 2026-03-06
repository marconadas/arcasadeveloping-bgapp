#!/bin/bash

echo "🌊 NEPTUNE - Forçando Deploy com Cache Clear"
echo "==========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar se estamos no diretório correto
if [ ! -d "apps/frontend/BGAPP" ]; then
    echo -e "${YELLOW}⚠️  Diretório BGAPP não encontrado${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Status atual dos arquivos:${NC}"
echo "✅ index.html → Neptune"
echo "✅ index-bgapp-original.html → Backup BGAPP"
echo "✅ index-neptune.html → Original Neptune"

# Adicionar ao git
echo -e "\n${BLUE}📦 Preparando commit forçado...${NC}"
git add apps/frontend/BGAPP/index.html

# Commit com timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "force(neptune): Forçar atualização do Neptune no /BGAPP/ - $TIMESTAMP

- Adicionado comentário de versão
- Forçar novo build no Cloudflare Pages
- Cache clear necessário"

# Push para o repositório
echo -e "\n${BLUE}🚀 Enviando para o repositório...${NC}"
git push origin main --force-with-lease

echo -e "\n${GREEN}✅ Deploy forçado concluído!${NC}"
echo ""
echo "🌊 Próximos passos:"
echo ""
echo "1. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)"
echo "2. Aguarde 3-5 minutos para o Cloudflare processar"
echo "3. Se ainda não funcionar, tente em modo anônimo/privado"
echo ""
echo "URLs para testar:"
echo "   → https://bgapp-frontend.pages.dev/BGAPP/"
echo "   → https://bgapp-frontend.pages.dev/BGAPP/index.html"
echo ""
echo "⚡ Dica: Use o DevTools (F12) > Network > Disable cache"
echo ""
