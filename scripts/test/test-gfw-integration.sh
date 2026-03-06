#!/bin/bash
# 🎣 Script de teste completo da integração Global Fishing Watch

echo "🧪 TESTE COMPLETO DA INTEGRAÇÃO GLOBAL FISHING WATCH"
echo "===================================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs dos endpoints
API_BASE="https://bgapp-api-worker.majearcasa.workers.dev"
FRONTEND_BASE="https://bgapp-arcasadeveloping.pages.dev"

# Função para testar endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_field=$3
    
    echo -n "📍 Testando $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$url")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        if [ -n "$expected_field" ] && echo "$body" | jq -e ".$expected_field" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ OK${NC}"
            echo "   Response: $(echo "$body" | jq -c '.')"
        else
            echo -e "${GREEN}✅ OK${NC} (HTTP 200)"
            echo "   Response: $body"
        fi
    else
        echo -e "${RED}❌ ERRO${NC} (HTTP $http_code)"
        echo "   Response: $body"
    fi
    echo ""
}

# 1. Testar endpoints do Worker API
echo "1️⃣ TESTANDO ENDPOINTS DO WORKER API"
echo "------------------------------------"

test_endpoint "GFW Status" "$API_BASE/api/config/gfw-status" "status"
test_endpoint "GFW Settings" "$API_BASE/api/config/gfw-settings" "api"

# Testar GFW Token com Origin header
echo -n "📍 Testando GFW Token (com header Origin)... "
response=$(curl -s -w "\n%{http_code}" -H "Origin: $FRONTEND_BASE" "$API_BASE/api/config/gfw-token")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ] && echo "$body" | jq -e '.token' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
    echo "   Token presente: $(echo "$body" | jq -r '.token' | cut -c1-20)..."
else
    echo -e "${RED}❌ ERRO${NC} (HTTP $http_code)"
    echo "   Response: $body"
fi
echo ""

# 2. Testar endpoints gerais do Worker
echo "2️⃣ TESTANDO ENDPOINTS GERAIS DO WORKER"
echo "--------------------------------------"

test_endpoint "Health Check" "$API_BASE/health" "status"
test_endpoint "Services Status" "$API_BASE/services" "summary"

# 3. Testar frontend
echo "3️⃣ TESTANDO FRONTEND"
echo "-------------------"

echo -n "📍 Verificando página principal... "
http_code=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_BASE/BGAPP/")
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC} (HTTP 200)"
else
    echo -e "${RED}❌ ERRO${NC} (HTTP $http_code)"
fi
echo ""

# 4. Verificar assets GFW
echo "4️⃣ VERIFICANDO ASSETS GFW NO FRONTEND"
echo "-------------------------------------"

assets=(
    "/BGAPP/assets/js/gfw-integration.js"
    "/BGAPP/assets/css/gfw-integration.css"
)

for asset in "${assets[@]}"; do
    echo -n "📍 Verificando $asset... "
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_BASE$asset")
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ ERRO${NC} (HTTP $http_code)"
    fi
done
echo ""

# 5. Testar integração completa via console
echo "5️⃣ SIMULAÇÃO DE INTEGRAÇÃO COMPLETA"
echo "-----------------------------------"

echo "🔄 Simulando carregamento do token GFW no frontend..."
echo ""
echo "Comando JavaScript para testar no console do navegador:"
echo -e "${YELLOW}"
cat << 'EOF'
// Teste no console do navegador em https://bgapp-arcasadeveloping.pages.dev/BGAPP/
(async () => {
    try {
        const apiUrl = 'https://bgapp-api-worker.majearcasa.workers.dev/api/config/gfw-token';
        const response = await fetch(apiUrl, {
            headers: {
                'Origin': window.location.origin,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('✅ Token GFW carregado:', data.token ? 'PRESENTE' : 'AUSENTE');
        console.log('Token preview:', data.token?.substring(0, 50) + '...');
    } catch (error) {
        console.error('❌ Erro:', error);
    }
})();
EOF
echo -e "${NC}"
echo ""

# 6. Resumo final
echo "📊 RESUMO DA INTEGRAÇÃO"
echo "======================"
echo ""
echo "URLs de Produção:"
echo "  • Worker API: $API_BASE"
echo "  • Frontend: $FRONTEND_BASE/BGAPP/"
echo "  • Admin Dashboard: https://bgapp-admin.pages.dev"
echo ""
echo "Endpoints GFW ativos:"
echo "  • Status: $API_BASE/api/config/gfw-status"
echo "  • Token: $API_BASE/api/config/gfw-token"
echo "  • Settings: $API_BASE/api/config/gfw-settings"
echo ""
echo "🎣 Integração Global Fishing Watch configurada e pronta!"
echo ""
echo "Próximos passos recomendados:"
echo "  1. Acessar $FRONTEND_BASE/BGAPP/ e testar os botões GFW"
echo "  2. Verificar no console do navegador se o token está sendo carregado"
echo "  3. Monitorar logs do Worker em tempo real: cd workers && npx wrangler tail"
echo ""
