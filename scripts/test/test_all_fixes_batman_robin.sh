#!/bin/bash

# 🦸‍♂️ TESTE COMPLETO: Correções Batman & Robin
# Verifica se todas as correções de URLs estão funcionando

echo "🦸‍♂️ TESTE BATMAN & ROBIN - Correções de URLs"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

success_count=0
total_tests=0

# Função para testar URL
test_url() {
    local url=$1
    local description=$2
    
    echo -n "  🧪 Testando $description... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --connect-timeout 10)
    
    if [ "$status_code" -eq 200 ] || [ "$status_code" -eq 302 ] || [ "$status_code" -eq 301 ]; then
        echo -e "${GREEN}✅ OK${NC} ($status_code)"
        ((success_count++))
    else
        echo -e "${RED}❌ FALHA${NC} ($status_code)"
    fi
    
    ((total_tests++))
}

echo ""
echo "1️⃣ Testando URLs de Produção Corrigidas..."

# URLs de produção que devem estar funcionando
test_url "https://bgapp-scientific.pages.dev" "Frontend Principal"
test_url "https://bgapp-scientific.pages.dev/stac_oceanographic" "STAC Oceanográfico"
test_url "https://bgapp-scientific.pages.dev/admin.html" "Admin Interface"
test_url "https://bgapp-scientific.pages.dev/dashboard_cientifico.html" "Dashboard Científico"
test_url "https://bgapp-scientific.pages.dev/realtime_angola.html" "Tempo Real Angola"

echo ""
echo "2️⃣ Testando Workers e APIs..."

test_url "https://bgapp-stac-oceanographic.majearcasa.workers.dev/health" "STAC Worker"
test_url "https://bgapp-admin-api.majearcasa.workers.dev/health" "Admin API Worker"

echo ""
echo "3️⃣ Testando Serviços Externos..."

test_url "https://bgapp-auth.pages.dev" "Keycloak Auth"
test_url "https://bgapp-storage.pages.dev" "MinIO Storage"
test_url "https://bgapp-monitor.pages.dev" "Flower Monitor"

echo ""
echo "4️⃣ Verificando Arquivos Corrigidos..."

# Verificar se não há mais URLs hardcoded problemáticas
echo -n "  🔍 Verificando URLs hardcoded... "

hardcoded_count=$(grep -r "e1a322f9\.bgapp-arcasadeveloping\.pages\.dev" admin-dashboard/src/ 2>/dev/null | wc -l)

if [ "$hardcoded_count" -eq 0 ]; then
    echo -e "${GREEN}✅ Nenhuma URL hardcoded encontrada${NC}"
    ((success_count++))
else
    echo -e "${YELLOW}⚠️ Ainda existem $hardcoded_count URLs hardcoded${NC}"
fi

((total_tests++))

# Verificar localhost hardcoded
echo -n "  🔍 Verificando localhost hardcoded... "

localhost_count=$(grep -r "http://localhost:808" admin-dashboard/src/components/dashboard/dashboard-content.tsx 2>/dev/null | wc -l)

if [ "$localhost_count" -eq 0 ]; then
    echo -e "${GREEN}✅ Nenhum localhost hardcoded no dashboard${NC}"
    ((success_count++))
else
    echo -e "${YELLOW}⚠️ Ainda existem $localhost_count URLs localhost${NC}"
fi

((total_tests++))

echo ""
echo "📊 RESULTADO DOS TESTES:"
echo "========================"
echo -e "✅ Sucessos: ${GREEN}$success_count${NC}/$total_tests"
echo -e "❌ Falhas: ${RED}$((total_tests - success_count))${NC}/$total_tests"

percentage=$((success_count * 100 / total_tests))
echo -e "📈 Taxa de Sucesso: ${BLUE}$percentage%${NC}"

echo ""

if [ "$percentage" -ge 80 ]; then
    echo -e "${GREEN}🎉 BATMAN & ROBIN: MISSÃO CUMPRIDA!${NC}"
    echo -e "${GREEN}🦸‍♂️ Silicon Valley App está funcionando perfeitamente!${NC}"
else
    echo -e "${YELLOW}⚠️ BATMAN & ROBIN: Missão parcialmente cumprida${NC}"
    echo -e "${YELLOW}🔧 Algumas correções ainda são necessárias${NC}"
fi

echo ""
echo "🔗 URLs Principais para Teste Manual:"
echo "======================================"
echo "🌐 Frontend: https://bgapp-scientific.pages.dev"
echo "🌊 STAC: https://bgapp-scientific.pages.dev/stac_oceanographic"
echo "⚙️ Admin: https://bgapp-scientific.pages.dev/admin.html"
echo "🔧 Worker: https://bgapp-stac-oceanographic.majearcasa.workers.dev"
echo ""
