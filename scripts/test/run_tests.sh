#!/bin/bash
"""
Script de Execução de Testes BGAPP
Testes de integração automáticos para todas as funcionalidades
"""

set -e

echo "🧪 BGAPP - Execução de Testes de Integração"
echo "==========================================="

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se o sistema está rodando
echo "🔍 Verificando se o sistema BGAPP está ativo..."

if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Sistema BGAPP ativo${NC}"
else
    echo -e "${RED}❌ Sistema BGAPP não está rodando!${NC}"
    echo "Execute primeiro: ./start_bgapp_enhanced.sh"
    exit 1
fi

# Instalar dependências de teste se necessário
echo "📦 Instalando dependências de teste..."
pip install pytest httpx > /dev/null 2>&1

# Executar testes
echo "🚀 Executando testes de integração..."
echo ""

cd tests
python test_integration.py

TEST_RESULT=$?

echo ""
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo -e "${GREEN}✅ Sistema pronto para produção${NC}"
else
    echo -e "${YELLOW}⚠️ Alguns testes falharam${NC}"
    echo -e "${YELLOW}📋 Verifique os logs acima para detalhes${NC}"
fi

echo ""
echo "📊 Relatório completo gerado acima"
echo "🔗 Dashboards disponíveis:"
echo "   • Principal: http://localhost:8085"
echo "   • Científico: http://localhost:8085/dashboard_cientifico.html"
echo "   • Mobile PWA: http://localhost:8085/mobile_pwa.html"
echo "   • API Docs: http://localhost:8000/docs"

exit $TEST_RESULT
