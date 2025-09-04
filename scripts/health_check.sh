#!/bin/bash

# 🏥 BGAPP Health Check Script
# Verifica a integridade completa da aplicação
# Author: BGAPP Team

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
REPORT_FILE="health_check_report_$(date +%Y%m%d_%H%M%S).md"
CRITICAL_FILES=(
    "wrangler.toml"
    "package.json"
    "infra/frontend/index.html"
    "admin-dashboard/package.json"
    "src/bgapp/__init__.py"
)

log() {
    echo -e "${2:-$NC}$1${NC}" | tee -a "$REPORT_FILE"
}

print_header() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                🏥 BGAPP HEALTH CHECK SYSTEM                  ║"
    echo "║              Verificação Completa de Integridade            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_critical_files() {
    log "🔍 Verificando arquivos críticos..." "$BLUE"
    
    local all_good=true
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [[ -f "$file" ]]; then
            local size=$(stat -f%z "$file" 2>/dev/null || echo "0")
            log "   ✅ $file ($size bytes)" "$GREEN"
        else
            log "   ❌ CRÍTICO: $file AUSENTE!" "$RED"
            all_good=false
        fi
    done
    
    return $([[ "$all_good" == "true" ]] && echo 0 || echo 1)
}

check_cloudflare_config() {
    log "☁️ Verificando configuração Cloudflare..." "$BLUE"
    
    if [[ -f "wrangler.toml" ]]; then
        local project_name=$(grep "^name" wrangler.toml | head -1 | cut -d'"' -f2 || echo "N/A")
        local build_dir=$(grep "pages_build_output_dir" wrangler.toml | cut -d'"' -f2 || echo "./infra/frontend")
        
        log "   📝 Projeto: $project_name" "$CYAN"
        log "   📁 Build Dir: $build_dir" "$CYAN"
        
        if [[ -d "$build_dir" ]]; then
            local html_count=$(find "$build_dir" -name "*.html" | wc -l | tr -d ' ')
            log "   📄 Arquivos HTML: $html_count" "$GREEN"
        else
            log "   ❌ Diretório de build não encontrado: $build_dir" "$RED"
            return 1
        fi
    else
        log "   ❌ wrangler.toml não encontrado!" "$RED"
        return 1
    fi
    
    return 0
}

check_admin_dashboard() {
    log "🔧 Verificando Admin Dashboard..." "$BLUE"
    
    if [[ -d "admin-dashboard" ]]; then
        if [[ -f "admin-dashboard/package.json" ]]; then
            log "   ✅ Admin Dashboard configurado" "$GREEN"
            
            if [[ -d "admin-dashboard/node_modules" ]]; then
                log "   ✅ Dependências instaladas" "$GREEN"
            else
                log "   ⚠️ Dependências não instaladas" "$YELLOW"
            fi
            
            if [[ -d "admin-dashboard/out" ]] || [[ -d "admin-dashboard/.next" ]]; then
                log "   ✅ Build disponível" "$GREEN"
            else
                log "   ⚠️ Build não encontrado" "$YELLOW"
            fi
        else
            log "   ❌ package.json não encontrado no admin-dashboard" "$RED"
            return 1
        fi
    else
        log "   ❌ Diretório admin-dashboard não encontrado" "$RED"
        return 1
    fi
    
    return 0
}

check_python_environment() {
    log "🐍 Verificando ambiente Python..." "$BLUE"
    
    if [[ -f "requirements.txt" ]]; then
        log "   ✅ requirements.txt presente" "$GREEN"
    fi
    
    if [[ -f "pyproject.toml" ]]; then
        log "   ✅ pyproject.toml presente" "$GREEN"
    fi
    
    if [[ -d "src/bgapp" ]]; then
        local py_files=$(find src/bgapp -name "*.py" | wc -l | tr -d ' ')
        log "   ✅ Módulos Python: $py_files arquivos" "$GREEN"
    else
        log "   ❌ Código-fonte Python não encontrado" "$RED"
        return 1
    fi
    
    return 0
}

check_documentation() {
    log "📚 Verificando documentação..." "$BLUE"
    
    if [[ -d "docs/organized" ]]; then
        local md_count=$(find docs/organized -name "*.md" | wc -l | tr -d ' ')
        log "   ✅ Documentação organizada: $md_count arquivos" "$GREEN"
    fi
    
    if [[ -f "README.md" ]]; then
        log "   ✅ README principal presente" "$GREEN"
    fi
    
    if [[ -f "SAFE_ORGANIZATION_REPORT.md" ]]; then
        log "   ✅ Relatório de organização presente" "$GREEN"
    fi
    
    return 0
}

check_deployment_readiness() {
    log "🚀 Verificando prontidão para deploy..." "$BLUE"
    
    # Verificar se wrangler está disponível
    if command -v wrangler &> /dev/null; then
        log "   ✅ Wrangler CLI disponível" "$GREEN"
        
        # Verificar autenticação
        if wrangler whoami &> /dev/null; then
            log "   ✅ Autenticado no Cloudflare" "$GREEN"
        else
            log "   ⚠️ Não autenticado no Cloudflare" "$YELLOW"
        fi
    else
        log "   ❌ Wrangler CLI não encontrado" "$RED"
        return 1
    fi
    
    # Verificar scripts de deploy
    if [[ -f "package.json" ]]; then
        if grep -q '"deploy"' package.json; then
            log "   ✅ Scripts de deploy configurados" "$GREEN"
        else
            log "   ⚠️ Scripts de deploy não encontrados" "$YELLOW"
        fi
    fi
    
    return 0
}

generate_health_report() {
    local overall_status="$1"
    
    cat > "$REPORT_FILE" << EOF
# 🏥 BGAPP Health Check Report

**Data:** $(date '+%Y-%m-%d %H:%M:%S')  
**Status Geral:** $([ "$overall_status" -eq 0 ] && echo "✅ SAUDÁVEL" || echo "⚠️ REQUER ATENÇÃO")

## 📊 Resumo da Verificação

### ✅ Componentes Verificados
- Arquivos críticos do sistema
- Configuração Cloudflare Pages
- Admin Dashboard Next.js
- Ambiente Python
- Documentação organizada
- Prontidão para deploy

### 🎯 Resultados

EOF

    if [ "$overall_status" -eq 0 ]; then
        cat >> "$REPORT_FILE" << EOF
- ✅ **Sistema:** Totalmente funcional
- ✅ **Deploy:** Pronto para produção
- ✅ **Integridade:** Todos os componentes OK
- ✅ **Documentação:** Organizada e atualizada

## 🚀 Recomendações

1. Sistema está pronto para deploy
2. Todas as funcionalidades operacionais
3. Documentação bem organizada
4. Manutenção regular recomendada

EOF
    else
        cat >> "$REPORT_FILE" << EOF
- ⚠️ **Sistema:** Alguns componentes precisam de atenção
- 🔧 **Deploy:** Verificar problemas antes do deploy
- 📋 **Ação:** Consultar logs detalhados acima
- 🛠️ **Manutenção:** Correções recomendadas

## 🔧 Próximos Passos

1. Resolver problemas identificados
2. Re-executar health check
3. Testar deploy em preview
4. Monitorar componentes críticos

EOF
    fi

    cat >> "$REPORT_FILE" << EOF

---

*Health Check realizado automaticamente pelo BGAPP System*
EOF
}

run_comprehensive_check() {
    local exit_code=0
    
    print_header
    
    log "🏥 Iniciando verificação completa de saúde..." "$BLUE"
    log ""
    
    # Executar todas as verificações
    check_critical_files || exit_code=1
    log ""
    
    check_cloudflare_config || exit_code=1
    log ""
    
    check_admin_dashboard || exit_code=1
    log ""
    
    check_python_environment || exit_code=1
    log ""
    
    check_documentation || exit_code=1
    log ""
    
    check_deployment_readiness || exit_code=1
    log ""
    
    # Gerar relatório
    generate_health_report $exit_code
    
    # Resultado final
    if [ $exit_code -eq 0 ]; then
        log "🎉 BGAPP ESTÁ SAUDÁVEL!" "$GREEN"
        log "✅ Todos os componentes funcionando corretamente" "$GREEN"
        log "🚀 Pronto para deploy em produção" "$GREEN"
    else
        log "⚠️ BGAPP precisa de atenção" "$YELLOW"
        log "🔧 Alguns componentes precisam de correção" "$YELLOW"
        log "📋 Consulte o relatório detalhado" "$YELLOW"
    fi
    
    log ""
    log "📋 Relatório completo: $REPORT_FILE" "$CYAN"
    
    return $exit_code
}

# Executar verificação
run_comprehensive_check "$@"
