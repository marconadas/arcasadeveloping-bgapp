#!/bin/bash

# 🎣 Monitor GFW Deployment Progress
# Script para monitorar o progresso do deploy

echo "🎣 ========================================="
echo "   Monitorando Deploy Global Fishing Watch"
echo "========================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# URLs para testar
FRONTEND_URL="https://bgapp-frontend.pages.dev/BGAPP/"
ADMIN_URL="https://bgapp-admin.pages.dev"
API_STATUS_URL="https://bgapp-api.majearcasa.workers.dev/api/config/gfw-status"

echo -e "${YELLOW}⏱️  Monitorando deploy...${NC}"
echo "Tempo estimado: 2-5 minutos"
echo ""

# Contador
COUNTER=0
MAX_ATTEMPTS=30  # 5 minutos (10 segundos * 30)

while [ $COUNTER -lt $MAX_ATTEMPTS ]; do
    echo -ne "\r⏳ Verificando... ($(($COUNTER * 10))s de $((MAX_ATTEMPTS * 10))s)"
    
    # Testar API endpoint
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_STATUS_URL)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "\n\n${GREEN}✅ Deploy concluído com sucesso!${NC}"
        echo ""
        echo "📊 Status dos serviços:"
        
        # Verificar Frontend
        FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
        if [ "$FRONTEND_STATUS" = "200" ]; then
            echo -e "• Frontend: ${GREEN}✓ ONLINE${NC} - $FRONTEND_URL"
        else
            echo -e "• Frontend: ${YELLOW}⚠ Status: $FRONTEND_STATUS${NC}"
        fi
        
        # Verificar Admin
        ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $ADMIN_URL)
        if [ "$ADMIN_STATUS" = "200" ]; then
            echo -e "• Admin: ${GREEN}✓ ONLINE${NC} - $ADMIN_URL"
        else
            echo -e "• Admin: ${YELLOW}⚠ Status: $ADMIN_STATUS${NC}"
        fi
        
        # Verificar API GFW
        echo -e "• API GFW: ${GREEN}✓ ONLINE${NC} - $API_STATUS_URL"
        
        echo ""
        echo "🎣 Testando endpoint GFW status:"
        curl -s $API_STATUS_URL | jq .
        
        echo ""
        echo -e "${GREEN}🎉 Global Fishing Watch integration deployed successfully!${NC}"
        echo ""
        echo "📝 Próximos passos:"
        echo "1. Acesse o frontend e teste os controles GFW no painel lateral"
        echo "2. Verifique o painel GFW no admin dashboard"
        echo "3. Monitore os logs no Cloudflare Dashboard"
        
        exit 0
    fi
    
    sleep 10
    ((COUNTER++))
done

echo -e "\n\n${RED}❌ Timeout após 5 minutos${NC}"
echo ""
echo "O deploy pode ainda estar em progresso. Verifique:"
echo "1. Cloudflare Dashboard: https://dash.cloudflare.com"
echo "2. GitHub Actions (se configurado)"
echo "3. Logs do Worker para erros específicos"
echo ""
echo "💡 Dica: O endpoint pode precisar ser adicionado ao Worker manualmente."
echo "Verifique o arquivo src/bgapp/api/gfw_config.py"
