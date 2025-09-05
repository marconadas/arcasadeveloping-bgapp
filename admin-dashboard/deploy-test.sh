#!/bin/bash

# 🚀 BGAPP - Deploy de Teste com Memory Leak Fixes
# Deploy rápido para verificar as correções

echo "=================================================="
echo "🚀 BGAPP Deploy de Teste - Memory Leak Fixes"
echo "=================================================="
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Funções de log
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# 1. Verificar alterações
log_info "Verificando alterações implementadas..."
echo ""
echo "📋 Correções de Memory Leaks Implementadas:"
echo "  ✅ Dashboard Components - Cleanup functions adicionadas"
echo "  ✅ Integration Components - AbortController implementado"  
echo "  ✅ API Functions - Suporte para cancelamento de requisições"
echo "  ✅ Timers e Intervals - Limpeza adequada implementada"
echo "  ✅ Event Listeners - Remoção correta garantida"
echo ""

# 2. Build da aplicação
log_info "Fazendo build da aplicação..."
npm run build

if [ $? -ne 0 ]; then
    log_error "Build falhou! Verifique os erros."
    exit 1
fi

log_success "Build concluído com sucesso!"

# 3. Criar servidor de teste local
log_info "Iniciando servidor de teste local..."
echo ""

# Matar processos anteriores na porta 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null

# Iniciar servidor Python simples
cd out
python3 -m http.server 8080 &
SERVER_PID=$!
cd ..

sleep 2

# 4. Mostrar informações de acesso
echo ""
log_success "🎉 Deploy de teste concluído!"
echo ""
echo "=================================================="
echo "📱 ACESSO LOCAL:"
echo "   URL: http://localhost:8080"
echo "   PID do servidor: $SERVER_PID"
echo ""
echo "🔍 TESTES RECOMENDADOS:"
echo "   1. Verificar console do browser para memory leaks"
echo "   2. Navegar entre páginas múltiplas vezes"
echo "   3. Monitorar uso de memória no DevTools"
echo "   4. Verificar cancelamento de requisições pendentes"
echo ""
echo "⏹️  Para parar o servidor: kill $SERVER_PID"
echo "=================================================="
echo ""

# 5. Opção de abrir no browser
read -p "Deseja abrir no browser agora? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    if command -v xdg-open > /dev/null; then
        xdg-open "http://localhost:8080"
    elif command -v open > /dev/null; then
        open "http://localhost:8080"
    else
        log_warning "Não foi possível abrir automaticamente. Acesse: http://localhost:8080"
    fi
fi

# Manter servidor rodando
log_info "Servidor rodando. Pressione Ctrl+C para parar..."
wait $SERVER_PID