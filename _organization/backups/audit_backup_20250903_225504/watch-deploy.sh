#!/bin/bash

# 🔄 BGAPP - Watch & Auto Deploy
# Deploy automático quando arquivos mudarem

echo "🔄 BGAPP Watch & Auto Deploy - Silicon Valley Style"
echo "===================================================="

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Verificar se fswatch está instalado
if ! command -v fswatch &> /dev/null; then
    log_warning "fswatch não encontrado. Instalando..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install fswatch
    else
        log_warning "Instale fswatch manualmente: https://github.com/emcrisostomo/fswatch"
        exit 1
    fi
fi

# Função de deploy
deploy() {
    log_info "🔄 Mudança detectada! Fazendo deploy..."
    npm run build && npx wrangler pages deploy out --project-name bgapp-admin --commit-dirty=true
    if [ $? -eq 0 ]; then
        log_success "✅ Deploy concluído! https://bgapp-admin.pages.dev"
        # Notificação no macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            osascript -e 'display notification "Deploy concluído!" with title "BGAPP"'
        fi
    fi
    echo ""
}

log_info "👁️  Monitorando mudanças em src/..."
log_warning "Pressione Ctrl+C para parar"
log_success "🚀 Deploy automático ativo!"

# Monitorar mudanças na pasta src
fswatch -o src/ | while read f; do
    deploy
done
