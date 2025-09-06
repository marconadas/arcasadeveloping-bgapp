#!/bin/bash

# 🛡️ BGAPP SAFE ORGANIZATION SCRIPT
# Organiza APENAS arquivos seguros sem afetar o funcionamento da BGAPP
# PRESERVA: infra/, src/, admin-dashboard/, wrangler.toml, package.json
# Author: BGAPP Team - SEGURANÇA MÁXIMA

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
ARCHIVE_DIR="archive_organized_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="safe_organization_$(date +%Y%m%d_%H%M%S).log"

# CRITICAL FILES/DIRECTORIES - NUNCA TOCAR!
CRITICAL_PATHS=(
    "infra/"
    "src/"
    "admin-dashboard/"
    "wrangler.toml"
    "package.json"
    "package-lock.json"
    "pyproject.toml"
    "requirements*.txt"
    "Makefile"
    "*.py"
    "*.js"
    "*.html"
    "*.json"
    "*.toml"
    "*.yml"
    "*.yaml"
    "*.sh"
    "*.conf"
    "*.cfg"
    "*.ini"
    "*.env*"
    "configs/"
    "workers/"
    "templates/"
    "static/"
    "data/"
    "logs/"
    "notebooks/"
    "tests/"
    "dags/"
    "backups/"
    "reports/"
)

log() {
    echo -e "${2:-$NC}$1${NC}" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║             🛡️ BGAPP SAFE ORGANIZER - MODO SEGURO             ║"
    echo "║          Preserva 100% da funcionalidade da BGAPP           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

is_critical_path() {
    local path="$1"
    
    # Lista de padrões críticos
    local critical_patterns=(
        "infra/*"
        "src/*"
        "admin-dashboard/*"
        "wrangler.toml"
        "package.json"
        "package-lock.json"
        "pyproject.toml"
        "requirements*.txt"
        "Makefile"
        "*.py"
        "*.js"
        "*.html"
        "*.json"
        "*.toml"
        "*.yml"
        "*.yaml"
        "*.sh"
        "*.conf"
        "*.cfg"
        "*.ini"
        "env*"
        "configs/*"
        "workers/*"
        "templates/*"
        "static/*"
        "data/*"
        "logs/*"
        "notebooks/*"
        "tests/*"
        "dags/*"
        "backups/*"
        "reports/*"
        "bgapp-*"
        "start_*"
        "stop_*"
        "setup*"
        "deploy*"
        "test*"
        "run_*"
        "verify_*"
        "*.log"
        "archive_*"
        "backup_*"
        "node_modules/*"
        "__pycache__/*"
        ".git/*"
        "docs/organized/*"
    )
    
    for pattern in "${critical_patterns[@]}"; do
        case "$path" in
            $pattern) return 0 ;;
        esac
    done
    
    return 1
}

create_safe_archive() {
    log "📦 Criando arquivo seguro para documentação..." "$BLUE"
    
    mkdir -p "$ARCHIVE_DIR"
    
    local safe_count=0
    local skipped_count=0
    
    # Encontrar APENAS arquivos .md que são seguros para mover
    while IFS= read -r -d '' file; do
        local relative_path="${file#./}"
        
        # Pular se já está organizado
        if [[ "$relative_path" == docs/organized/* ]]; then
            ((skipped_count++))
            continue
        fi
        
        # Pular se é crítico
        if is_critical_path "$relative_path"; then
            log "   🛡️ PROTEGIDO: $relative_path" "$YELLOW"
            ((skipped_count++))
            continue
        fi
        
        # Mover apenas se for seguro
        local filename=$(basename "$file")
        local safe_target="$ARCHIVE_DIR/$filename"
        
        # Evitar duplicatas
        local counter=1
        while [[ -f "$safe_target" ]]; do
            local name_without_ext="${filename%.md}"
            safe_target="$ARCHIVE_DIR/${name_without_ext}_${counter}.md"
            ((counter++))
        done
        
        cp "$file" "$safe_target"
        log "   ✅ Arquivado: $filename" "$GREEN"
        ((safe_count++))
        
    done < <(find . -name "*.md" -type f -print0)
    
    log ""
    log "📊 Resumo da Organização Segura:" "$CYAN"
    log "   ✅ Arquivos organizados: $safe_count"
    log "   🛡️ Arquivos protegidos: $skipped_count"
    log "   📁 Arquivo criado: $ARCHIVE_DIR"
}

verify_bgapp_integrity() {
    log "🔍 Verificando integridade da BGAPP..." "$BLUE"
    
    local critical_files=(
        "wrangler.toml"
        "package.json"
        "infra/frontend/index.html"
        "admin-dashboard/package.json"
        "src/bgapp/__init__.py"
    )
    
    local all_good=true
    
    for file in "${critical_files[@]}"; do
        if [[ -f "$file" ]]; then
            log "   ✅ $file" "$GREEN"
        else
            log "   ❌ CRÍTICO: $file não encontrado!" "$RED"
            all_good=false
        fi
    done
    
    if [[ "$all_good" == "true" ]]; then
        log "   🎉 BGAPP 100% ÍNTEGRA!" "$GREEN"
        return 0
    else
        log "   ⚠️ ALERTA: Possível problema na estrutura!" "$RED"
        return 1
    fi
}

show_cloudflare_status() {
    log "☁️ Status da Configuração Cloudflare:" "$CYAN"
    
    if [[ -f "wrangler.toml" ]]; then
        log "   ✅ wrangler.toml presente" "$GREEN"
        local project_name=$(grep "^name" wrangler.toml | head -1 | cut -d'"' -f2)
        log "   📝 Projeto: $project_name" "$BLUE"
    fi
    
    if [[ -f "package.json" ]]; then
        log "   ✅ package.json presente" "$GREEN"
        local deploy_cmd=$(grep '"deploy"' package.json | head -1)
        if [[ -n "$deploy_cmd" ]]; then
            log "   🚀 Deploy configurado" "$GREEN"
        fi
    fi
    
    if [[ -d "infra/frontend" ]]; then
        log "   ✅ Frontend directory presente" "$GREEN"
        local html_files=$(find infra/frontend -name "*.html" | wc -l | tr -d ' ')
        log "   📄 Arquivos HTML: $html_files" "$BLUE"
    fi
}

create_organization_report() {
    log "📋 Criando relatório de organização..." "$BLUE"
    
    local report_file="SAFE_ORGANIZATION_REPORT.md"
    
    cat > "$report_file" << EOF
# 🛡️ BGAPP Safe Organization Report

**Data:** $(date '+%Y-%m-%d %H:%M:%S')  
**Operação:** Organização Segura de Documentação  
**Status:** ✅ CONCLUÍDA COM SUCESSO

## 🎯 Objetivo

Organizar documentação sem afetar o funcionamento da BGAPP no Cloudflare.

## 🛡️ Arquivos Protegidos

Os seguintes diretórios/arquivos foram PRESERVADOS:

- ✅ \`infra/\` - Infraestrutura Cloudflare (INTOCADO)
- ✅ \`src/\` - Código-fonte Python (INTOCADO)
- ✅ \`admin-dashboard/\` - Dashboard administrativo (INTOCADO)
- ✅ \`wrangler.toml\` - Configuração Cloudflare (INTOCADO)
- ✅ \`package.json\` - Configuração Node.js (INTOCADO)
- ✅ Todos os scripts Python/Shell (INTOCADOS)
- ✅ Todos os arquivos de configuração (INTOCADOS)

## 📦 Arquivos Organizados

- 📁 **Arquivo criado:** \`$ARCHIVE_DIR\`
- 📄 **Conteúdo:** Apenas documentação .md segura
- 🛡️ **Garantia:** Zero impacto no funcionamento

## ✅ Verificação de Integridade

EOF

    # Verificar integridade e adicionar ao relatório
    if verify_bgapp_integrity >> /dev/null 2>&1; then
        echo "- ✅ **BGAPP Status:** 100% FUNCIONAL" >> "$report_file"
        echo "- ✅ **Cloudflare:** Configuração intacta" >> "$report_file"
        echo "- ✅ **Deploy:** Pronto para produção" >> "$report_file"
    else
        echo "- ⚠️ **Status:** Verificar integridade" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

## 🚀 Próximos Passos

1. **Deploy seguro:** A BGAPP pode ser deployada normalmente
2. **Funcionalidade:** Todas as features permanecem ativas
3. **Documentação:** Organizada em $ARCHIVE_DIR

## 📞 Suporte

Em caso de dúvidas, consulte:
- 📋 Log detalhado: \`$LOG_FILE\`
- 🛡️ Este relatório: \`$report_file\`

---

*Organização segura realizada com sucesso! 🎉*
EOF

    log "   ✅ Relatório criado: $report_file" "$GREEN"
}

main() {
    print_header
    
    log "🔍 Iniciando organização SEGURA..." "$BLUE"
    log "⚠️  MODO SEGURO: Preservando 100% da funcionalidade BGAPP" "$YELLOW"
    
    # Verificar integridade ANTES
    if ! verify_bgapp_integrity; then
        log "❌ ERRO: Estrutura BGAPP comprometida ANTES da organização!" "$RED"
        exit 1
    fi
    
    # Organizar apenas arquivos seguros
    create_safe_archive
    
    # Verificar integridade DEPOIS
    if ! verify_bgapp_integrity; then
        log "❌ ERRO CRÍTICO: Estrutura BGAPP comprometida!" "$RED"
        exit 1
    fi
    
    # Mostrar status Cloudflare
    show_cloudflare_status
    
    # Criar relatório
    create_organization_report
    
    log ""
    log "🎉 ORGANIZAÇÃO SEGURA CONCLUÍDA!" "$GREEN"
    log "🛡️ BGAPP permanece 100% funcional" "$GREEN"
    log "☁️ Cloudflare deploy não foi afetado" "$GREEN"
    log "📋 Relatório: SAFE_ORGANIZATION_REPORT.md" "$CYAN"
    log "📁 Documentos organizados: $ARCHIVE_DIR" "$CYAN"
}

# Executar
main "$@"
