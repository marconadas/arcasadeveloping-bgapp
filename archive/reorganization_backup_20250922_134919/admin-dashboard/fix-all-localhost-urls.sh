#!/bin/bash

# 🚀 FIX ALL LOCALHOST URLs - SILICON VALLEY STYLE
# Script para substituir TODAS as URLs localhost automaticamente

echo "🚀 FIXING ALL LOCALHOST URLs - SILICON VALLEY STYLE"
echo "===================================================="

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Backup antes de começar
log_info "Criando backup de segurança..."
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)

# URLs de substituição baseadas no ambiente de produção
FRONTEND_URL="https://e1a322f9.bgapp-arcasadeveloping.pages.dev"
API_URL="https://bgapp-api-worker.majearcasa.workers.dev"

log_info "Substituindo URLs localhost em todos os arquivos..."

# 1. Substituir localhost:8085 (Frontend)
log_info "1. Corrigindo URLs do frontend (localhost:8085)..."
find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" | xargs sed -i '' "s|http://localhost:8085|${FRONTEND_URL}|g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" | xargs sed -i '' "s|localhost:8085|${FRONTEND_URL#https://}|g"

# 2. Substituir localhost:8000 (API)
log_info "2. Corrigindo URLs da API (localhost:8000)..."
find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" | xargs sed -i '' "s|http://localhost:8000|${API_URL}|g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" | xargs sed -i '' "s|localhost:8000|${API_URL#https://}|g"

# 3. Substituir outras URLs localhost
log_info "3. Corrigindo outras URLs localhost..."
find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" | xargs sed -i '' "s|http://localhost:5080|https://bgapp-pygeoapi.pages.dev|g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" | xargs sed -i '' "s|http://localhost:8082|https://bgapp-stac.pages.dev|g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" | xargs sed -i '' "s|http://localhost:5555|https://bgapp-monitor.pages.dev|g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" | xargs sed -i '' "s|http://localhost:9001|https://bgapp-storage.pages.dev|g"

# 4. Verificar resultados
log_info "4. Verificando resultados..."
REMAINING_LOCALHOST=$(grep -r "localhost" src/ | wc -l | tr -d ' ')

if [ "$REMAINING_LOCALHOST" -eq "0" ]; then
    log_success "🎉 TODAS as URLs localhost foram corrigidas!"
else
    log_warning "$REMAINING_LOCALHOST URLs localhost ainda encontradas:"
    grep -r "localhost" src/ | head -10
fi

# 5. Estatísticas
log_info "5. Estatísticas de correção..."
echo "📊 Arquivos processados:"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" | wc -l | xargs echo "   - TypeScript/JavaScript:"
echo "🔄 URLs substituídas:"
echo "   - Frontend: localhost:8085 → ${FRONTEND_URL}"
echo "   - API: localhost:8000 → ${API_URL}"
echo "   - Outros serviços: localhost:* → bgapp-*.pages.dev"

log_success "🚀 Correção Silicon Valley concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. npm run build"
echo "2. npm run deploy"
echo "3. Testar em: https://bgapp-admin.pages.dev"
echo ""
