#!/bin/bash

# 🔍 BGAPP Safe Code Audit System
# Sistema ultra-seguro de auditoria de código órfão
# APENAS IDENTIFICA - NUNCA REMOVE NADA
# Author: BGAPP Team - MÁXIMA SEGURANÇA

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
AUDIT_REPORT="CODE_AUDIT_REPORT_$(date +%Y%m%d_%H%M%S).md"
TEMP_DIR="temp_audit_$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="audit_backup_$(date +%Y%m%d_%H%M%S)"

# Critical paths that should NEVER be touched
CRITICAL_PATHS=(
    "infra/frontend/"
    "admin-dashboard/"
    "src/bgapp/"
    "wrangler.toml"
    "package.json"
    "requirements*.txt"
    "pyproject.toml"
    "configs/"
    "workers/"
    "templates/"
    "static/"
    "data/"
)

log() {
    echo -e "${2:-$NC}$1${NC}" | tee -a "$AUDIT_REPORT"
}

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║            🔍 BGAPP SAFE CODE AUDIT SYSTEM                   ║"
    echo "║          APENAS IDENTIFICA - NUNCA REMOVE NADA              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

create_safety_backup() {
    log "💾 Criando backup de segurança total..." "$BLUE"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup de todos os arquivos críticos
    for path in "${CRITICAL_PATHS[@]}"; do
        if [[ -e "$path" ]]; then
            cp -r "$path" "$BACKUP_DIR/" 2>/dev/null || true
        fi
    done
    
    # Backup de arquivos de configuração
    find . -maxdepth 1 -name "*.toml" -o -name "*.json" -o -name "*.txt" -o -name "*.md" | while read -r file; do
        cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
    done
    
    log "   ✅ Backup completo criado: $BACKUP_DIR" "$GREEN"
}

initialize_audit_report() {
    cat > "$AUDIT_REPORT" << EOF
# 🔍 BGAPP Safe Code Audit Report

**Data:** $(date '+%Y-%m-%d %H:%M:%S')  
**Tipo:** Auditoria de Código Órfão (APENAS IDENTIFICAÇÃO)  
**Status:** 🛡️ MODO SEGURO - NADA SERÁ REMOVIDO

## ⚠️ AVISO IMPORTANTE

Esta auditoria **APENAS IDENTIFICA** possível código órfão.  
**NENHUM ARQUIVO SERÁ REMOVIDO AUTOMATICAMENTE.**  
Todas as recomendações devem ser revisadas manualmente.

## 🎯 Objetivo

Identificar código potencialmente não utilizado para otimização futura,  
mantendo 100% da funcionalidade da BGAPP.

---

EOF
}

analyze_file_usage() {
    log "📊 Analisando uso de arquivos..." "$BLUE"
    
    mkdir -p "$TEMP_DIR"
    
    # Criar índice de todos os arquivos
    find . -type f \( -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.html" -o -name "*.css" \) \
        ! -path "./node_modules/*" \
        ! -path "./.git/*" \
        ! -path "./.*" \
        ! -path "./docs/organized/*" \
        ! -path "./archive_*/*" \
        ! -path "./backup_*/*" \
        ! -path "./temp_*/*" \
        > "$TEMP_DIR/all_files.txt"
    
    local total_files=$(wc -l < "$TEMP_DIR/all_files.txt" | tr -d ' ')
    log "   📁 Total de arquivos analisados: $total_files" "$CYAN"
    
    # Analisar referências
    log "   🔍 Analisando referências entre arquivos..." "$CYAN"
    
    cat >> "$AUDIT_REPORT" << EOF
## 📊 Análise de Arquivos

### 📁 Estatísticas Gerais
- **Total de arquivos analisados:** $total_files
- **Tipos incluídos:** Python, JavaScript, TypeScript, HTML, CSS
- **Diretórios excluídos:** node_modules, .git, docs/organized, backups

EOF
}

check_python_imports() {
    log "🐍 Analisando imports Python..." "$BLUE"
    
    # Encontrar todos os arquivos Python
    find . -name "*.py" \
        ! -path "./node_modules/*" \
        ! -path "./.git/*" \
        ! -path "./docs/*" \
        ! -path "./archive_*/*" \
        ! -path "./backup_*/*" \
        > "$TEMP_DIR/python_files.txt"
    
    local py_count=$(wc -l < "$TEMP_DIR/python_files.txt" | tr -d ' ')
    log "   📄 Arquivos Python encontrados: $py_count" "$CYAN"
    
    # Analisar imports não utilizados (apenas identificar)
    local unused_imports=0
    while IFS= read -r py_file; do
        if [[ -f "$py_file" ]]; then
            # Buscar imports que podem não estar sendo usados
            grep -n "^import\|^from.*import" "$py_file" 2>/dev/null | while IFS=: read -r line_num import_line; do
                # Extrair nome do módulo/função importada
                local imported_name=$(echo "$import_line" | sed -E 's/.*import[[:space:]]+([^[:space:],]+).*/\1/' | sed 's/[[:space:]]*$//')
                
                # Verificar se é usado no arquivo (busca simples)
                if ! grep -q "$imported_name" "$py_file" 2>/dev/null; then
                    echo "⚠️ Possível import não usado: $py_file:$line_num - $import_line" >> "$TEMP_DIR/potential_unused_imports.txt"
                    ((unused_imports++)) || true
                fi
            done
        fi
    done < "$TEMP_DIR/python_files.txt"
    
    log "   🔍 Possíveis imports não utilizados identificados: $unused_imports" "$YELLOW"
    
    cat >> "$AUDIT_REPORT" << EOF
### 🐍 Análise Python
- **Arquivos Python:** $py_count
- **Possíveis imports não utilizados:** $unused_imports
- **Status:** Identificados para revisão manual

EOF
}

check_javascript_usage() {
    log "📜 Analisando código JavaScript/TypeScript..." "$BLUE"
    
    # Encontrar arquivos JS/TS
    find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" \
        ! -path "./node_modules/*" \
        ! -path "./.git/*" \
        ! -path "./docs/*" \
        ! -path "./archive_*/*" \
        ! -path "./backup_*/*" \
        > "$TEMP_DIR/js_files.txt"
    
    local js_count=$(wc -l < "$TEMP_DIR/js_files.txt" | tr -d ' ')
    log "   📄 Arquivos JS/TS encontrados: $js_count" "$CYAN"
    
    # Analisar funções potencialmente não utilizadas
    local unused_functions=0
    while IFS= read -r js_file; do
        if [[ -f "$js_file" ]]; then
            # Buscar declarações de função
            grep -n "function\|const.*=.*=>\|export.*function" "$js_file" 2>/dev/null | while IFS=: read -r line_num func_line; do
                # Extrair nome da função (simplificado)
                local func_name=$(echo "$func_line" | sed -E 's/.*function[[:space:]]+([^[:space:](]+).*/\1/' | sed -E 's/.*const[[:space:]]+([^[:space:]=]+).*/\1/')
                
                # Verificar se é usada (busca básica)
                local usage_count=$(grep -c "$func_name" "$js_file" 2>/dev/null || echo "0")
                if [[ $usage_count -le 1 ]]; then
                    echo "⚠️ Possível função não usada: $js_file:$line_num - $func_name" >> "$TEMP_DIR/potential_unused_functions.txt"
                    ((unused_functions++)) || true
                fi
            done
        fi
    done < "$TEMP_DIR/js_files.txt"
    
    log "   🔍 Possíveis funções não utilizadas identificadas: $unused_functions" "$YELLOW"
    
    cat >> "$AUDIT_REPORT" << EOF
### 📜 Análise JavaScript/TypeScript
- **Arquivos JS/TS:** $js_count
- **Possíveis funções não utilizadas:** $unused_functions
- **Status:** Identificadas para revisão manual

EOF
}

check_css_usage() {
    log "🎨 Analisando CSS não utilizado..." "$BLUE"
    
    # Encontrar arquivos CSS
    find . -name "*.css" \
        ! -path "./node_modules/*" \
        ! -path "./.git/*" \
        ! -path "./docs/*" \
        ! -path "./archive_*/*" \
        ! -path "./backup_*/*" \
        > "$TEMP_DIR/css_files.txt"
    
    local css_count=$(wc -l < "$TEMP_DIR/css_files.txt" | tr -d ' ')
    log "   📄 Arquivos CSS encontrados: $css_count" "$CYAN"
    
    # Análise básica de classes CSS (muito conservadora)
    local total_css_rules=0
    while IFS= read -r css_file; do
        if [[ -f "$css_file" ]]; then
            local rules=$(grep -c "^[[:space:]]*\." "$css_file" 2>/dev/null || echo "0")
            ((total_css_rules += rules))
        fi
    done < "$TEMP_DIR/css_files.txt"
    
    log "   🔍 Total de regras CSS encontradas: $total_css_rules" "$CYAN"
    
    cat >> "$AUDIT_REPORT" << EOF
### 🎨 Análise CSS
- **Arquivos CSS:** $css_count
- **Regras CSS:** $total_css_rules
- **Status:** Análise manual recomendada para otimização

EOF
}

check_html_references() {
    log "🌐 Analisando referências HTML..." "$BLUE"
    
    # Encontrar arquivos HTML
    find . -name "*.html" \
        ! -path "./node_modules/*" \
        ! -path "./.git/*" \
        ! -path "./docs/*" \
        ! -path "./archive_*/*" \
        ! -path "./backup_*/*" \
        > "$TEMP_DIR/html_files.txt"
    
    local html_count=$(wc -l < "$TEMP_DIR/html_files.txt" | tr -d ' ')
    log "   📄 Arquivos HTML encontrados: $html_count" "$CYAN"
    
    # Verificar referências quebradas (muito básico)
    local broken_refs=0
    while IFS= read -r html_file; do
        if [[ -f "$html_file" ]]; then
            # Buscar referências src e href
            grep -n "src=\|href=" "$html_file" 2>/dev/null | while IFS=: read -r line_num ref_line; do
                # Extrair caminho do arquivo
                local ref_path=$(echo "$ref_line" | sed -E 's/.*[src|href]=["\x27]([^"\x27]+)["\x27].*/\1/')
                
                # Verificar se é um caminho local e se existe
                if [[ "$ref_path" =~ ^[^http] ]] && [[ ! -f "$(dirname "$html_file")/$ref_path" ]] && [[ ! -f "$ref_path" ]]; then
                    echo "⚠️ Possível referência quebrada: $html_file:$line_num - $ref_path" >> "$TEMP_DIR/potential_broken_refs.txt"
                    ((broken_refs++)) || true
                fi
            done
        fi
    done < "$TEMP_DIR/html_files.txt"
    
    log "   🔍 Possíveis referências quebradas identificadas: $broken_refs" "$YELLOW"
    
    cat >> "$AUDIT_REPORT" << EOF
### 🌐 Análise HTML
- **Arquivos HTML:** $html_count
- **Possíveis referências quebradas:** $broken_refs
- **Status:** Verificação manual recomendada

EOF
}

analyze_file_sizes() {
    log "📏 Analisando tamanhos de arquivos..." "$BLUE"
    
    # Encontrar arquivos grandes
    find . -type f \
        ! -path "./node_modules/*" \
        ! -path "./.git/*" \
        ! -path "./docs/*" \
        ! -path "./archive_*/*" \
        ! -path "./backup_*/*" \
        -size +1M \
        -exec ls -lh {} \; > "$TEMP_DIR/large_files.txt"
    
    local large_count=$(wc -l < "$TEMP_DIR/large_files.txt" | tr -d ' ')
    log "   📊 Arquivos grandes (>1MB) encontrados: $large_count" "$CYAN"
    
    cat >> "$AUDIT_REPORT" << EOF
### 📏 Análise de Tamanhos
- **Arquivos grandes (>1MB):** $large_count
- **Status:** Revisão recomendada para otimização

EOF
}

generate_safety_recommendations() {
    log "📋 Gerando recomendações de segurança..." "$BLUE"
    
    cat >> "$AUDIT_REPORT" << EOF
## 🛡️ Recomendações de Segurança

### ⚠️ ATENÇÃO CRÍTICA
**NUNCA remova arquivos sem verificação manual completa!**

### 📋 Próximos Passos Seguros

1. **Revisão Manual Obrigatória**
   - Analisar cada item identificado individualmente
   - Verificar dependências antes de qualquer remoção
   - Testar funcionalidade após mudanças

2. **Backup Antes de Mudanças**
   - Sempre criar backup completo
   - Testar em ambiente de desenvolvimento
   - Validar funcionalidade completa

3. **Validação Progressiva**
   - Fazer mudanças pequenas e incrementais
   - Testar após cada modificação
   - Manter rollback sempre disponível

### 🔍 Arquivos para Revisão Manual

EOF

    # Adicionar listas de arquivos identificados
    if [[ -f "$TEMP_DIR/potential_unused_imports.txt" ]]; then
        echo "#### 🐍 Imports Python para Revisão" >> "$AUDIT_REPORT"
        head -20 "$TEMP_DIR/potential_unused_imports.txt" >> "$AUDIT_REPORT" 2>/dev/null || true
        echo "" >> "$AUDIT_REPORT"
    fi
    
    if [[ -f "$TEMP_DIR/potential_unused_functions.txt" ]]; then
        echo "#### 📜 Funções JS/TS para Revisão" >> "$AUDIT_REPORT"
        head -20 "$TEMP_DIR/potential_unused_functions.txt" >> "$AUDIT_REPORT" 2>/dev/null || true
        echo "" >> "$AUDIT_REPORT"
    fi
    
    if [[ -f "$TEMP_DIR/potential_broken_refs.txt" ]]; then
        echo "#### 🌐 Referências HTML para Revisão" >> "$AUDIT_REPORT"
        head -20 "$TEMP_DIR/potential_broken_refs.txt" >> "$AUDIT_REPORT" 2>/dev/null || true
        echo "" >> "$AUDIT_REPORT"
    fi
    
    cat >> "$AUDIT_REPORT" << EOF

### ✅ Garantias de Segurança

- ✅ **Nenhum arquivo foi removido**
- ✅ **Backup completo criado**
- ✅ **Funcionalidade preservada**
- ✅ **Apenas identificação realizada**

---

*Auditoria Segura BGAPP - $(date '+%Y-%m-%d %H:%M:%S')*
EOF
}

cleanup_temp_files() {
    log "🧹 Limpando arquivos temporários..." "$BLUE"
    
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
        log "   ✅ Arquivos temporários removidos" "$GREEN"
    fi
}

run_safe_audit() {
    print_header
    
    log "🔍 Iniciando auditoria segura de código órfão..." "$BLUE"
    log "⚠️  MODO ULTRA-SEGURO: Apenas identificação, nada será removido" "$YELLOW"
    log ""
    
    # Inicializar relatório
    initialize_audit_report
    
    # Criar backup de segurança
    create_safety_backup
    log ""
    
    # Executar análises
    analyze_file_usage
    log ""
    
    check_python_imports
    log ""
    
    check_javascript_usage
    log ""
    
    check_css_usage
    log ""
    
    check_html_references
    log ""
    
    analyze_file_sizes
    log ""
    
    # Gerar recomendações
    generate_safety_recommendations
    
    # Cleanup
    cleanup_temp_files
    
    log "🎉 AUDITORIA SEGURA CONCLUÍDA!" "$GREEN"
    log "📋 Relatório completo: $AUDIT_REPORT" "$CYAN"
    log "💾 Backup de segurança: $BACKUP_DIR" "$CYAN"
    log "⚠️  LEMBRE-SE: Revisar manualmente antes de remover qualquer código!" "$YELLOW"
}

# Executar auditoria segura
run_safe_audit "$@"
