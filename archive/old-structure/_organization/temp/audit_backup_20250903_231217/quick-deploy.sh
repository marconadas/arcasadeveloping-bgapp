#!/bin/bash

# 🚀 BGAPP - Quick Deploy Script Silicon Valley Style
# Testa mudanças rapidamente no Cloudflare

echo "🚀 BGAPP Quick Deploy - Silicon Valley Style"
echo "============================================="

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Build rápido
log_info "Building aplicação..."
npm run build

if [ $? -ne 0 ]; then
    log_error "Build falhou! Verifique os erros acima."
    exit 1
fi

log_success "Build concluído!"

# 2. Deploy para Cloudflare
log_info "Fazendo deploy para Cloudflare..."
npx wrangler pages deploy out --project-name bgapp-admin --commit-dirty=true

if [ $? -ne 0 ]; then
    log_error "Deploy falhou!"
    exit 1
fi

# 3. Abrir no browser
log_success "Deploy concluído!"
log_info "Abrindo aplicação no browser..."

# Detectar OS e abrir URL
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "https://bgapp-admin.pages.dev"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "https://bgapp-admin.pages.dev"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    start "https://bgapp-admin.pages.dev"
fi

log_success "🎉 Deploy Silicon Valley concluído!"
echo ""
echo "📱 URL: https://bgapp-admin.pages.dev"
echo "⏱️  Tempo típico: 30-60 segundos"
echo ""
