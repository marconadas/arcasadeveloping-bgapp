#!/bin/bash

# 🔧 BGAPP - Dev & Deploy Script
# Desenvolvimento local + deploy automático

echo "🔧 BGAPP Dev & Deploy - Silicon Valley Workflow"
echo "==============================================="

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Função para parar processos em background
cleanup() {
    log_info "Parando processos..."
    kill $DEV_PID 2>/dev/null
    exit 0
}

# Trap para cleanup
trap cleanup SIGINT SIGTERM

# 1. Iniciar dev server em background
log_info "Iniciando servidor de desenvolvimento..."
npm run dev &
DEV_PID=$!

# Aguardar servidor iniciar
sleep 3

# 2. Abrir no browser local
log_info "Abrindo desenvolvimento local..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3000"
fi

log_success "🔧 Servidor local: http://localhost:3000"
log_warning "Pressione Ctrl+C quando terminar de testar"
log_info "Depois execute: ./quick-deploy.sh para deploy"

# Aguardar input do usuário
wait $DEV_PID
