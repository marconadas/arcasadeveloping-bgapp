#!/bin/bash

# 🔍 BGAPP Quick Safe Audit
# Auditoria rápida e segura de código órfão
# APENAS IDENTIFICA - NUNCA REMOVE

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

REPORT="QUICK_AUDIT_$(date +%Y%m%d_%H%M%S).md"

log() {
    echo -e "${2:-$NC}$1${NC}" | tee -a "$REPORT"
}

print_header() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              🔍 BGAPP QUICK SAFE AUDIT                       ║"
    echo "║            APENAS IDENTIFICA - NUNCA REMOVE                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

initialize_report() {
    cat > "$REPORT" << EOF
# 🔍 BGAPP Quick Safe Audit Report

**Data:** $(date '+%Y-%m-%d %H:%M:%S')  
**Tipo:** Auditoria Rápida de Código Órfão  
**Status:** 🛡️ MODO SEGURO - APENAS IDENTIFICAÇÃO

## ⚠️ AVISO CRÍTICO
**NENHUM ARQUIVO SERÁ REMOVIDO!**  
Esta auditoria apenas identifica possível código órfão.

---

EOF
}

quick_file_analysis() {
    log "📊 Análise rápida de arquivos..." "$BLUE"
    
    # Contar tipos de arquivo
    local py_files=$(find . -name "*.py" ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./docs/*" ! -path "./archive_*/*" ! -path "./backup_*/*" | wc -l | tr -d ' ')
    local js_files=$(find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./docs/*" ! -path "./archive_*/*" ! -path "./backup_*/*" | wc -l | tr -d ' ')
    local html_files=$(find . -name "*.html" ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./docs/*" ! -path "./archive_*/*" ! -path "./backup_*/*" | wc -l | tr -d ' ')
    local css_files=$(find . -name "*.css" ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./docs/*" ! -path "./archive_*/*" ! -path "./backup_*/*" | wc -l | tr -d ' ')
    
    log "   🐍 Arquivos Python: $py_files" "$CYAN"
    log "   📜 Arquivos JS/TS: $js_files" "$CYAN"
    log "   🌐 Arquivos HTML: $html_files" "$CYAN"
    log "   🎨 Arquivos CSS: $css_files" "$CYAN"
    
    cat >> "$REPORT" << EOF
## 📊 Estatísticas de Arquivos

- **Python:** $py_files arquivos
- **JavaScript/TypeScript:** $js_files arquivos
- **HTML:** $html_files arquivos
- **CSS:** $css_files arquivos

EOF
}

check_large_files() {
    log "📏 Identificando arquivos grandes..." "$BLUE"
    
    # Arquivos maiores que 500KB
    local large_files=$(find . -type f -size +500k ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./docs/*" ! -path "./archive_*/*" ! -path "./backup_*/*" | wc -l | tr -d ' ')
    
    log "   📊 Arquivos grandes (>500KB): $large_files" "$CYAN"
    
    if [[ $large_files -gt 0 ]]; then
        log "   🔍 Listando os 5 maiores arquivos:" "$YELLOW"
        find . -type f -size +500k ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./docs/*" ! -path "./archive_*/*" ! -path "./backup_*/*" -exec ls -lh {} \; | head -5 | while read -r line; do
            log "     📄 $line" "$YELLOW"
        done
    fi
    
    cat >> "$REPORT" << EOF
## 📏 Análise de Tamanhos

- **Arquivos grandes (>500KB):** $large_files
- **Recomendação:** Revisar se podem ser otimizados

EOF
}

check_duplicate_files() {
    log "🔄 Procurando possíveis arquivos duplicados..." "$BLUE"
    
    # Buscar arquivos com nomes similares
    local potential_duplicates=0
    
    # Buscar arquivos .backup, .old, .tmp, etc.
    local backup_files=$(find . -name "*.backup*" -o -name "*.old" -o -name "*.tmp" -o -name "*~" ! -path "./node_modules/*" ! -path "./.git/*" | wc -l | tr -d ' ')
    
    log "   🗂️ Arquivos de backup/temporários: $backup_files" "$CYAN"
    
    if [[ $backup_files -gt 0 ]]; then
        log "   📋 Exemplos encontrados:" "$YELLOW"
        find . -name "*.backup*" -o -name "*.old" -o -name "*.tmp" -o -name "*~" ! -path "./node_modules/*" ! -path "./.git/*" | head -10 | while read -r file; do
            log "     📄 $file" "$YELLOW"
        done
    fi
    
    cat >> "$REPORT" << EOF
## 🔄 Análise de Duplicados

- **Arquivos de backup/temporários:** $backup_files
- **Status:** $([ $backup_files -gt 0 ] && echo "Revisar para possível limpeza" || echo "Nenhum encontrado")

EOF
}

check_unused_assets() {
    log "🖼️ Analisando assets potencialmente não utilizados..." "$BLUE"
    
    # Contar imagens
    local image_files=$(find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./docs/*" | wc -l | tr -d ' ')
    
    log "   🖼️ Arquivos de imagem: $image_files" "$CYAN"
    
    # Contar outros assets
    local other_assets=$(find . -name "*.pdf" -o -name "*.doc*" -o -name "*.zip" -o -name "*.tar*" ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./docs/*" | wc -l | tr -d ' ')
    
    log "   📎 Outros assets: $other_assets" "$CYAN"
    
    cat >> "$REPORT" << EOF
## 🖼️ Análise de Assets

- **Imagens:** $image_files arquivos
- **Outros assets:** $other_assets arquivos
- **Recomendação:** Verificar se todos são utilizados

EOF
}

check_empty_files() {
    log "📄 Procurando arquivos vazios..." "$BLUE"
    
    local empty_files=$(find . -type f -empty ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./docs/*" ! -path "./archive_*/*" ! -path "./backup_*/*" | wc -l | tr -d ' ')
    
    log "   📄 Arquivos vazios: $empty_files" "$CYAN"
    
    if [[ $empty_files -gt 0 ]]; then
        log "   📋 Arquivos vazios encontrados:" "$YELLOW"
        find . -type f -empty ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./docs/*" ! -path "./archive_*/*" ! -path "./backup_*/*" | head -10 | while read -r file; do
            log "     📄 $file" "$YELLOW"
        done
    fi
    
    cat >> "$REPORT" << EOF
## 📄 Arquivos Vazios

- **Total:** $empty_files arquivos
- **Status:** $([ $empty_files -gt 0 ] && echo "Revisar se podem ser removidos" || echo "Nenhum encontrado")

EOF
}

generate_recommendations() {
    log "📋 Gerando recomendações seguras..." "$BLUE"
    
    cat >> "$REPORT" << EOF
## 🛡️ Recomendações de Segurança

### ⚠️ REGRAS CRÍTICAS
1. **NUNCA remover sem verificação manual**
2. **SEMPRE criar backup antes de mudanças**
3. **TESTAR funcionalidade após modificações**
4. **Fazer mudanças incrementais**

### 📋 Próximos Passos Seguros

#### 🔍 Para Revisão Manual
- Arquivos de backup/temporários identificados
- Arquivos vazios encontrados
- Assets potencialmente não utilizados

#### ✅ Processo Seguro
1. **Backup completo** da aplicação
2. **Análise individual** de cada arquivo
3. **Teste em desenvolvimento** antes de produção
4. **Validação de funcionalidade** completa

### 🎯 Áreas de Otimização

#### 📏 Arquivos Grandes
- Verificar se podem ser comprimidos
- Analisar se são realmente necessários
- Considerar lazy loading para assets

#### 🔄 Duplicados
- Revisar arquivos .backup, .old, .tmp
- Verificar se são necessários
- Consolidar se possível

#### 📄 Arquivos Vazios
- Verificar se servem algum propósito
- Remover apenas após confirmação

## ✅ Garantias

- ✅ **Nenhum arquivo foi removido**
- ✅ **Funcionalidade 100% preservada**
- ✅ **Apenas identificação realizada**
- ✅ **Backup recomendado antes de mudanças**

---

*Auditoria Rápida e Segura - BGAPP $(date '+%Y-%m-%d %H:%M:%S')*
EOF
}

main() {
    print_header
    
    log "🔍 Iniciando auditoria rápida e segura..." "$BLUE"
    log ""
    
    initialize_report
    
    quick_file_analysis
    log ""
    
    check_large_files
    log ""
    
    check_duplicate_files
    log ""
    
    check_unused_assets
    log ""
    
    check_empty_files
    log ""
    
    generate_recommendations
    
    log "🎉 AUDITORIA RÁPIDA CONCLUÍDA!" "$GREEN"
    log "📋 Relatório: $REPORT" "$CYAN"
    log "⚠️  LEMBRE-SE: Revisar manualmente antes de remover qualquer arquivo!" "$YELLOW"
}

main "$@"
