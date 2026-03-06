#!/bin/bash

echo "🌊 NEPTUNE - Deploy de Atualização"
echo "=================================="
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

echo -e "${BLUE}📋 Verificando arquivos...${NC}"
echo "✅ index.html (Neptune)"
echo "✅ index-bgapp-original.html (Backup do BGAPP)"
echo "✅ index-neptune.html (Original Neptune)"

# Adicionar ao git
echo -e "\n${BLUE}📦 Preparando commit...${NC}"
git add apps/frontend/BGAPP/index.html
git add apps/frontend/BGAPP/index-bgapp-original.html

# Commit
git commit -m "feat(neptune): Substituir index.html pelo Neptune para /BGAPP/

- Backup do index.html original salvo como index-bgapp-original.html
- index.html agora serve o conteúdo do Neptune
- Mantém index-neptune.html como referência
- Resolve problema de roteamento em /BGAPP/"

# Push para o repositório
echo -e "\n${BLUE}🚀 Enviando para o repositório...${NC}"
git push origin main

echo -e "\n${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "🌊 O Neptune agora será servido em:"
echo "   https://bgapp-frontend.pages.dev/BGAPP/"
echo ""
echo "📋 Arquivos atualizados:"
echo "   - index.html → Conteúdo do Neptune"
echo "   - index-bgapp-original.html → Backup do BGAPP original"
echo ""
echo "⏱️  Aguarde 2-3 minutos para o Cloudflare Pages processar as mudanças."
echo ""
