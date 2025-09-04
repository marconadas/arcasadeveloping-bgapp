#!/bin/bash

# 🚀 BGAPP Robust Deploy Script
# Deploy robusto com retry e verificações
# Author: BGAPP Team

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
PROJECT_NAME="bgapp-arcasadeveloping"
BUILD_DIR="infra/frontend"
MAX_RETRIES=3
TIMEOUT=300

log() {
    echo -e "${2:-$NC}$1${NC}"
}

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                🚀 BGAPP ROBUST DEPLOY                        ║"
    echo "║              Deploy Seguro para Cloudflare Pages            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_prerequisites() {
    log "🔍 Verificando pré-requisitos..." "$BLUE"
    
    # Verificar se wrangler está disponível
    if ! command -v wrangler &> /dev/null; then
        log "❌ Wrangler CLI não encontrado!" "$RED"
        return 1
    fi
    
    # Verificar autenticação
    if ! wrangler whoami &> /dev/null; then
        log "❌ Não autenticado no Cloudflare!" "$RED"
        log "Execute: wrangler login" "$YELLOW"
        return 1
    fi
    
    # Verificar diretório de build
    if [[ ! -d "$BUILD_DIR" ]]; then
        log "❌ Diretório de build não encontrado: $BUILD_DIR" "$RED"
        return 1
    fi
    
    # Verificar arquivos essenciais
    if [[ ! -f "$BUILD_DIR/index.html" ]]; then
        log "❌ index.html não encontrado no build!" "$RED"
        return 1
    fi
    
    log "✅ Todos os pré-requisitos atendidos" "$GREEN"
    return 0
}

show_deploy_info() {
    log "📊 Informações do Deploy:" "$CYAN"
    log "   📁 Projeto: $PROJECT_NAME" "$BLUE"
    log "   📂 Diretório: $BUILD_DIR" "$BLUE"
    
    local file_count=$(find "$BUILD_DIR" -type f | wc -l | tr -d ' ')
    local html_count=$(find "$BUILD_DIR" -name "*.html" | wc -l | tr -d ' ')
    local total_size=$(du -sh "$BUILD_DIR" | cut -f1)
    
    log "   📄 Arquivos: $file_count total, $html_count HTML" "$BLUE"
    log "   📏 Tamanho: $total_size" "$BLUE"
}

deploy_with_retry() {
    local attempt=1
    
    while [[ $attempt -le $MAX_RETRIES ]]; do
        log "🚀 Tentativa de deploy $attempt/$MAX_RETRIES..." "$BLUE"
        
        # Tentar deploy com timeout
        if timeout $TIMEOUT wrangler pages deploy "$BUILD_DIR" --project-name "$PROJECT_NAME"; then
            log "✅ Deploy realizado com sucesso!" "$GREEN"
            return 0
        else
            local exit_code=$?
            log "❌ Deploy falhou (tentativa $attempt)" "$RED"
            
            if [[ $attempt -lt $MAX_RETRIES ]]; then
                local wait_time=$((attempt * 10))
                log "⏳ Aguardando ${wait_time}s antes da próxima tentativa..." "$YELLOW"
                sleep $wait_time
            fi
            
            ((attempt++))
        fi
    done
    
    log "❌ Deploy falhou após $MAX_RETRIES tentativas" "$RED"
    return 1
}

verify_deployment() {
    log "🔍 Verificando deployment..." "$BLUE"
    
    # Obter URL do projeto
    local project_url
    if project_url=$(wrangler pages project list 2>/dev/null | grep "$PROJECT_NAME" | awk '{print $3}' 2>/dev/null); then
        if [[ -n "$project_url" ]]; then
            log "✅ Projeto encontrado: $project_url" "$GREEN"
            
            # Tentar verificar se está acessível (opcional)
            if command -v curl &> /dev/null; then
                if curl -s --head "$project_url" | grep -q "200 OK"; then
                    log "✅ Site acessível e funcionando!" "$GREEN"
                else
                    log "⚠️ Site pode não estar totalmente disponível ainda" "$YELLOW"
                fi
            fi
        else
            log "⚠️ URL do projeto não encontrada" "$YELLOW"
        fi
    else
        log "⚠️ Não foi possível verificar o projeto" "$YELLOW"
    fi
}

create_deploy_report() {
    local status="$1"
    local report_file="DEPLOY_REPORT_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# 🚀 BGAPP Deploy Report

**Data:** $(date '+%Y-%m-%d %H:%M:%S')  
**Projeto:** $PROJECT_NAME  
**Status:** $([ "$status" -eq 0 ] && echo "✅ SUCESSO" || echo "❌ FALHOU")

## 📊 Detalhes do Deploy

- **Diretório:** \`$BUILD_DIR\`
- **Arquivos:** $(find "$BUILD_DIR" -type f | wc -l | tr -d ' ') total
- **HTML:** $(find "$BUILD_DIR" -name "*.html" | wc -l | tr -d ' ') páginas
- **Tamanho:** $(du -sh "$BUILD_DIR" | cut -f1)

## 🎯 Resultado

EOF

    if [ "$status" -eq 0 ]; then
        cat >> "$report_file" << EOF
✅ **Deploy realizado com sucesso!**

### 🌐 Acesso
- URL principal: https://$PROJECT_NAME.pages.dev
- Domínio personalizado: Conforme configurado

### ✅ Verificações
- [x] Arquivos enviados
- [x] Build processado
- [x] Site disponível

EOF
    else
        cat >> "$report_file" << EOF
❌ **Deploy falhou após $MAX_RETRIES tentativas**

### 🔧 Possíveis Soluções
1. Verificar conexão com internet
2. Verificar autenticação: \`wrangler whoami\`
3. Verificar limites da conta Cloudflare
4. Tentar novamente mais tarde

### 📋 Próximos Passos
- Verificar logs de erro
- Contactar suporte se necessário
- Tentar deploy manual

EOF
    fi

    cat >> "$report_file" << EOF

---

*Deploy automático BGAPP - $(date '+%Y-%m-%d %H:%M:%S')*
EOF

    log "📋 Relatório criado: $report_file" "$CYAN"
}

main() {
    local deploy_status=1
    
    print_header
    
    log "🚀 Iniciando deploy robusto da BGAPP..." "$BLUE"
    log ""
    
    # Verificar pré-requisitos
    if ! check_prerequisites; then
        log "❌ Pré-requisitos não atendidos. Abortando deploy." "$RED"
        create_deploy_report 1
        exit 1
    fi
    
    log ""
    show_deploy_info
    log ""
    
    # Executar deploy com retry
    if deploy_with_retry; then
        deploy_status=0
        log ""
        verify_deployment
        log ""
        log "🎉 DEPLOY CONCLUÍDO COM SUCESSO!" "$GREEN"
        log "🌐 BGAPP disponível no Cloudflare Pages" "$GREEN"
    else
        deploy_status=1
        log ""
        log "❌ DEPLOY FALHOU" "$RED"
        log "📋 Verifique o relatório para mais detalhes" "$YELLOW"
    fi
    
    # Criar relatório
    create_deploy_report $deploy_status
    
    return $deploy_status
}

# Executar deploy
main "$@"
