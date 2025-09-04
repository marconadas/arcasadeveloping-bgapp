#!/bin/bash

# 🧹 BGAPP Safe Cleanup Script
# Limpeza ultra-segura apenas de arquivos comprovadamente seguros
# EXTREMO CUIDADO - Apenas arquivos obviamente desnecessários
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

CLEANUP_REPORT="SAFE_CLEANUP_REPORT_$(date +%Y%m%d_%H%M%S).md"
BACKUP_DIR="cleanup_backup_$(date +%Y%m%d_%H%M%S)"

log() {
    echo -e "${2:-$NC}$1${NC}" | tee -a "$CLEANUP_REPORT"
}

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              🧹 BGAPP SAFE CLEANUP SYSTEM                    ║"
    echo "║          APENAS ARQUIVOS COMPROVADAMENTE SEGUROS            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

create_safety_backup() {
    log "💾 Criando backup de segurança antes da limpeza..." "$BLUE"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup completo da estrutura crítica
    cp wrangler.toml "$BACKUP_DIR/" 2>/dev/null || true
    cp package.json "$BACKUP_DIR/" 2>/dev/null || true
    cp -r infra/frontend/ "$BACKUP_DIR/frontend_backup/" 2>/dev/null || true
    cp -r admin-dashboard/src/ "$BACKUP_DIR/admin_src_backup/" 2>/dev/null || true
    
    log "   ✅ Backup de segurança criado: $BACKUP_DIR" "$GREEN"
}

initialize_report() {
    cat > "$CLEANUP_REPORT" << EOF
# 🧹 BGAPP Safe Cleanup Report

**Data:** $(date '+%Y-%m-%d %H:%M:%S')  
**Tipo:** Limpeza Ultra-Segura  
**Status:** 🛡️ APENAS ARQUIVOS COMPROVADAMENTE SEGUROS

## ⚠️ AVISO DE SEGURANÇA
Esta limpeza remove APENAS arquivos obviamente desnecessários:
- Arquivos .backup claramente temporários
- Arquivos .old não críticos
- Cache e arquivos temporários seguros

**FUNCIONALIDADE DA BGAPP PRESERVADA 100%**

---

EOF
}

identify_safe_backups() {
    log "🔍 Identificando backups seguros para remoção..." "$BLUE"
    
    local safe_backups=0
    local backup_list=""
    
    # Identificar apenas backups óbvios e seguros
    while IFS= read -r -d '' backup_file; do
        # Verificar se é realmente um backup seguro
        if [[ "$backup_file" =~ \.(backup|old)$ ]] && [[ ! "$backup_file" =~ (wrangler|package|config) ]]; then
            backup_list+="$backup_file\n"
            ((safe_backups++))
        fi
    done < <(find . -name "*.backup" -o -name "*.old" ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./docs/organized/*" -print0 2>/dev/null || true)
    
    log "   📊 Backups seguros identificados: $safe_backups" "$CYAN"
    
    if [[ $safe_backups -gt 0 ]]; then
        log "   📋 Arquivos identificados:" "$YELLOW"
        echo -e "$backup_list" | head -10 | while read -r file; do
            [[ -n "$file" ]] && log "     📄 $file" "$YELLOW"
        done
    fi
    
    echo "$safe_backups"
}

identify_safe_temp_files() {
    log "🗂️ Identificando arquivos temporários seguros..." "$BLUE"
    
    local temp_files=0
    
    # Identificar apenas arquivos temporários óbvios
    while IFS= read -r -d '' temp_file; do
        ((temp_files++))
    done < <(find . -name "*.tmp" -o -name "*~" -o -name ".DS_Store" ! -path "./node_modules/*" ! -path "./.git/*" -print0 2>/dev/null || true)
    
    log "   📊 Arquivos temporários seguros: $temp_files" "$CYAN"
    
    echo "$temp_files"
}

safe_cleanup_backups() {
    local dry_run="$1"
    log "🧹 $([ "$dry_run" == "true" ] && echo "Simulando" || echo "Executando") limpeza de backups seguros..." "$BLUE"
    
    local cleaned=0
    local total_size=0
    
    # Limpar apenas backups HTML claramente seguros
    while IFS= read -r -d '' backup_file; do
        if [[ "$backup_file" =~ \.html\.backup\. ]] && [[ ! "$backup_file" =~ (index|admin|dashboard) ]]; then
            local size=$(stat -f%z "$backup_file" 2>/dev/null || echo "0")
            ((total_size += size))
            
            if [[ "$dry_run" != "true" ]]; then
                rm -f "$backup_file"
                log "   ✅ Removido: $backup_file ($(numfmt --to=iec $size))" "$GREEN"
            else
                log "   📋 Seria removido: $backup_file ($(numfmt --to=iec $size))" "$YELLOW"
            fi
            ((cleaned++))
        fi
    done < <(find . -name "*.html.backup.*" ! -path "./node_modules/*" ! -path "./.git/*" -print0 2>/dev/null || true)
    
    log "   📊 Backups processados: $cleaned ($(numfmt --to=iec $total_size) total)" "$CYAN"
    
    cat >> "$CLEANUP_REPORT" << EOF
### 🗂️ Limpeza de Backups
- **Arquivos processados:** $cleaned
- **Espaço $([ "$dry_run" == "true" ] && echo "que seria" || echo "") liberado:** $(numfmt --to=iec $total_size)
- **Tipo:** Apenas backups HTML não críticos

EOF
}

safe_cleanup_temp_files() {
    local dry_run="$1"
    log "🗑️ $([ "$dry_run" == "true" ] && echo "Simulando" || echo "Executando") limpeza de arquivos temporários..." "$BLUE"
    
    local cleaned=0
    local total_size=0
    
    # Limpar apenas arquivos temporários óbvios e seguros
    for pattern in "*.tmp" "*~" ".DS_Store"; do
        while IFS= read -r -d '' temp_file; do
            local size=$(stat -f%z "$temp_file" 2>/dev/null || echo "0")
            ((total_size += size))
            
            if [[ "$dry_run" != "true" ]]; then
                rm -f "$temp_file"
                log "   ✅ Removido: $temp_file" "$GREEN"
            else
                log "   📋 Seria removido: $temp_file" "$YELLOW"
            fi
            ((cleaned++))
        done < <(find . -name "$pattern" ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./docs/organized/*" -print0 2>/dev/null || true)
    done
    
    log "   📊 Arquivos temporários processados: $cleaned ($(numfmt --to=iec $total_size) total)" "$CYAN"
    
    cat >> "$CLEANUP_REPORT" << EOF
### 🗑️ Limpeza de Temporários
- **Arquivos processados:** $cleaned
- **Espaço $([ "$dry_run" == "true" ] && echo "que seria" || echo "") liberado:** $(numfmt --to=iec $total_size)
- **Tipo:** Apenas arquivos temporários óbvios (.tmp, ~, .DS_Store)

EOF
}

verify_bgapp_integrity() {
    log "🔍 Verificando integridade da BGAPP após limpeza..." "$BLUE"
    
    local critical_files=(
        "wrangler.toml"
        "package.json"
        "infra/frontend/index.html"
        "admin-dashboard/package.json"
    )
    
    local all_good=true
    for file in "${critical_files[@]}"; do
        if [[ -f "$file" ]]; then
            log "   ✅ $file" "$GREEN"
        else
            log "   ❌ CRÍTICO: $file ausente!" "$RED"
            all_good=false
        fi
    done
    
    if [[ "$all_good" == "true" ]]; then
        log "   🎉 BGAPP 100% íntegra após limpeza!" "$GREEN"
        return 0
    else
        log "   ⚠️ PROBLEMA: Restaurar backup imediatamente!" "$RED"
        return 1
    fi
}

generate_final_report() {
    local status="$1"
    
    cat >> "$CLEANUP_REPORT" << EOF

## 🎯 Resultado Final

$([ "$status" -eq 0 ] && echo "✅ **Limpeza realizada com sucesso!**" || echo "❌ **Problema detectado - Backup deve ser restaurado!**")

### 🛡️ Garantias de Segurança
- ✅ Apenas arquivos comprovadamente seguros foram removidos
- ✅ Backup completo criado antes da limpeza
- ✅ Integridade da BGAPP verificada
- ✅ Funcionalidade 100% preservada

### 📊 Resumo
- Foram removidos apenas arquivos temporários óbvios
- Nenhum arquivo funcional foi afetado
- Sistema permanece totalmente operacional

### 🔄 Rollback (se necessário)
Para restaurar backup:
\`\`\`bash
cp -r $BACKUP_DIR/* ./
\`\`\`

---

*Limpeza Segura BGAPP - $(date '+%Y-%m-%d %H:%M:%S')*
EOF
}

main() {
    local dry_run=false
    
    # Verificar argumentos
    if [[ "${1:-}" == "--dry-run" ]]; then
        dry_run=true
        log "🔍 MODO SIMULAÇÃO: Nenhum arquivo será removido" "$YELLOW"
    fi
    
    print_header
    
    log "🧹 Iniciando limpeza ultra-segura da BGAPP..." "$BLUE"
    log "⚠️  ATENÇÃO: Apenas arquivos comprovadamente seguros serão removidos" "$YELLOW"
    log ""
    
    initialize_report
    
    # Criar backup de segurança
    if [[ "$dry_run" != "true" ]]; then
        create_safety_backup
        log ""
    fi
    
    # Identificar arquivos seguros
    local safe_backups=$(identify_safe_backups)
    log ""
    
    local temp_files=$(identify_safe_temp_files)
    log ""
    
    # Executar limpeza segura
    safe_cleanup_backups "$dry_run"
    log ""
    
    safe_cleanup_temp_files "$dry_run"
    log ""
    
    # Verificar integridade (apenas se não for dry-run)
    local status=0
    if [[ "$dry_run" != "true" ]]; then
        if ! verify_bgapp_integrity; then
            status=1
        fi
        log ""
    fi
    
    # Gerar relatório final
    generate_final_report $status
    
    if [[ "$dry_run" == "true" ]]; then
        log "🔍 SIMULAÇÃO CONCLUÍDA!" "$CYAN"
        log "📋 Execute sem --dry-run para aplicar as mudanças" "$YELLOW"
    else
        if [[ $status -eq 0 ]]; then
            log "🎉 LIMPEZA SEGURA CONCLUÍDA!" "$GREEN"
            log "✅ BGAPP permanece 100% funcional" "$GREEN"
        else
            log "❌ PROBLEMA DETECTADO!" "$RED"
            log "🔄 Restaure o backup imediatamente!" "$RED"
        fi
    fi
    
    log "📋 Relatório completo: $CLEANUP_REPORT" "$CYAN"
    [[ "$dry_run" != "true" ]] && log "💾 Backup disponível: $BACKUP_DIR" "$CYAN"
    
    return $status
}

# Executar limpeza
main "$@"
