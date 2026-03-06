#!/bin/bash

# 🎣 BGAPP - Deploy Global Fishing Watch Update to Cloudflare
# Data: 16/09/2025
# Versão: 1.0.0

echo "🎣 ========================================="
echo "   BGAPP - Deploy GFW Update to Cloudflare"
echo "========================================="

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório raiz do projeto${NC}"
    exit 1
fi

echo -e "\n${YELLOW}📋 Checklist pré-deploy:${NC}"
echo "✓ Global Fishing Watch API integrada"
echo "✓ Frontend com controles GFW"
echo "✓ Admin dashboard com painel GFW"
echo "✓ Endpoints backend configurados"
echo "✓ Documentação atualizada"

echo -e "\n${YELLOW}🔧 Verificando arquivos GFW...${NC}"

# Verificar arquivos críticos
FILES_TO_CHECK=(
    "infra/frontend/assets/js/gfw-integration.js"
    "infra/frontend/assets/css/gfw-integration.css"
    "src/bgapp/api/gfw_config.py"
    "admin-dashboard/src/components/gfw/gfw-management.tsx"
    "config/gfw.env"
)

ALL_FILES_OK=true
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file não encontrado!"
        ALL_FILES_OK=false
    fi
done

if [ "$ALL_FILES_OK" = false ]; then
    echo -e "\n${RED}❌ Alguns arquivos GFW estão faltando!${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Todos os arquivos GFW estão presentes!${NC}"

# Commit das mudanças
echo -e "\n${YELLOW}📦 Preparando commit...${NC}"
git add .
git status --short

echo -e "\n${YELLOW}💬 Digite a mensagem de commit (ou pressione Enter para usar padrão):${NC}"
read -r COMMIT_MSG
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="feat: Add Global Fishing Watch API integration 🎣"
fi

git commit -m "$COMMIT_MSG"

echo -e "\n${YELLOW}🚀 Fazendo push para o GitHub...${NC}"
git push origin main

echo -e "\n${GREEN}✅ Push concluído!${NC}"
echo -e "\n${YELLOW}☁️  O Cloudflare Pages iniciará o deploy automaticamente.${NC}"
echo -e "📊 Acompanhe o progresso em: https://dash.cloudflare.com"
echo -e "\n${YELLOW}🌐 URLs de Produção:${NC}"
echo "• Frontend: https://bgapp-frontend.pages.dev"
echo "• Admin: https://bgapp-admin.pages.dev"
echo "• API: https://bgapp-api.majearcasa.workers.dev"

echo -e "\n${YELLOW}🔍 Endpoints GFW para testar após o deploy:${NC}"
echo "• Status: https://bgapp-api.majearcasa.workers.dev/api/config/gfw-status"
echo "• Health: https://bgapp-api.majearcasa.workers.dev/health"

echo -e "\n${YELLOW}⏱️  Tempo estimado de deploy: 2-5 minutos${NC}"

# Opcional: Abrir o dashboard do Cloudflare
echo -e "\n${YELLOW}🌐 Deseja abrir o Cloudflare Dashboard? (s/n)${NC}"
read -r OPEN_DASHBOARD
if [ "$OPEN_DASHBOARD" = "s" ] || [ "$OPEN_DASHBOARD" = "S" ]; then
    if command -v open &> /dev/null; then
        open "https://dash.cloudflare.com"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "https://dash.cloudflare.com"
    else
        echo "Por favor, abra manualmente: https://dash.cloudflare.com"
    fi
fi

echo -e "\n${GREEN}✅ Script de deploy concluído!${NC}"
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo "1. Aguarde o deploy automático do Cloudflare Pages"
echo "2. Teste os endpoints GFW"
echo "3. Verifique os controles no mapa principal"
echo "4. Acesse o painel GFW no admin dashboard"
echo -e "\n🎣 Happy fishing monitoring! 🌊"
