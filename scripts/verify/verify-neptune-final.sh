#!/bin/bash

echo "🔍 Verificação Final do Neptune"
echo "=============================="
echo ""

# URLs para verificar
BASE_URL="https://bgapp-frontend.pages.dev/BGAPP"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}⏱️  Aguardando 30 segundos para propagação...${NC}"
sleep 30

echo -e "\n${BLUE}📋 Testando URLs...${NC}"
echo ""

# Testar página principal
echo -e "${YELLOW}1. Testando página principal Neptune...${NC}"
RESPONSE=$(curl -s "$BASE_URL/" | grep -o '<title>.*</title>' | head -1)
if [[ $RESPONSE == *"Neptune"* ]]; then
    echo -e "${GREEN}✅ Neptune detectado!${NC}"
    echo "   $RESPONSE"
else
    echo -e "${RED}❌ Neptune não detectado${NC}"
    echo "   $RESPONSE"
fi

# Testar página de teste
echo -e "\n${YELLOW}2. Testando página de teste...${NC}"
TEST_RESPONSE=$(curl -s "$BASE_URL/test-neptune.html" | grep -o "Neptune Deploy Test")
if [[ -n $TEST_RESPONSE ]]; then
    echo -e "${GREEN}✅ Página de teste funcionando!${NC}"
else
    echo -e "${RED}❌ Página de teste não encontrada${NC}"
fi

# Testar se não há mais Next.js
echo -e "\n${YELLOW}3. Verificando ausência de Next.js...${NC}"
NEXTJS_CHECK=$(curl -s "$BASE_URL/" | grep "_next")
if [[ -z $NEXTJS_CHECK ]]; then
    echo -e "${GREEN}✅ Next.js removido com sucesso!${NC}"
else
    echo -e "${RED}❌ Ainda detectando referências Next.js${NC}"
fi

echo -e "\n${BLUE}📊 Resumo:${NC}"
echo "• URL Principal: $BASE_URL/"
echo "• Deploy ID: $(git rev-parse --short HEAD)"
echo "• Timestamp: $(date)"
echo ""

echo -e "${BLUE}🌊 Se tudo estiver verde acima, o Neptune está funcionando!${NC}"
echo ""

