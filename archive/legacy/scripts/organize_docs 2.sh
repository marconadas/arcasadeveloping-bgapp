#!/usr/bin/env bash

# 📚 BGAPP Documentation Organization Script
# Automatically organizes .md files into categorized folders
# Author: BGAPP Team
# Version: 2.0

set -e

# Check bash version
if [[ ${BASH_VERSION%%.*} -lt 4 ]]; then
    echo "This script requires bash 4.0 or higher"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOCS_DIR="docs/organized"
BACKUP_DIR="docs/backup_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="docs/organization_log_$(date +%Y%m%d_%H%M%S).log"

# Category mappings
declare -A CATEGORIES=(
    ["ADMIN"]="admin"
    ["ML"]="ml"
    ["QGIS"]="qgis"
    ["DEPLOY"]="deploy"
    ["DEBUG"]="debug"
    ["SECURITY"]="security"
    ["FRONTEND"]="frontend"
    ["FEATURE"]="features"
    ["RELATORIO"]="reports"
    ["GUIA"]="guides"
    ["ARQUITETURA"]="architecture"
    ["AUDITORIA"]="security"
    ["IMPLEMENTACAO"]="features"
    ["PLANO"]="features"
    ["CORRECAO"]="debug"
    ["BATMAN"]="deploy"
    ["ROBIN"]="deploy"
    ["SILICON_VALLEY"]="admin"
    ["HUB"]="frontend"
    ["INTERFACE"]="frontend"
)

# Functions
log() {
    echo -e "${2:-$NC}$1${NC}" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 📚 BGAPP DOCS ORGANIZER 2.0                  ║"
    echo "║              Automated Documentation Organization            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_usage() {
    echo -e "${YELLOW}Usage: $0 [OPTIONS]${NC}"
    echo ""
    echo "Options:"
    echo "  --help              Show this help message"
    echo "  --dry-run          Show what would be done without making changes"
    echo "  --backup           Create backup before organizing"
    echo "  --rename-existing  Rename files to follow naming convention"
    echo "  --validate-only    Only validate naming convention"
    echo "  --stats            Show documentation statistics"
    echo ""
    echo "Examples:"
    echo "  $0                 # Organize all .md files"
    echo "  $0 --dry-run       # Preview organization"
    echo "  $0 --backup        # Organize with backup"
}

create_directories() {
    log "📁 Creating directory structure..." "$BLUE"
    
    local dirs=("admin" "ml" "qgis" "deploy" "debug" "security" "frontend" "features" "reports" "guides" "architecture")
    
    mkdir -p "$DOCS_DIR"
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$DOCS_DIR/$dir"
        log "   ✓ Created $DOCS_DIR/$dir" "$GREEN"
    done
}

categorize_file() {
    local file="$1"
    local filename=$(basename "$file" .md)
    
    # Convert to uppercase for matching
    local upper_filename=$(echo "$filename" | tr '[:lower:]' '[:upper:]')
    
    # Check each category pattern
    for pattern in "${!CATEGORIES[@]}"; do
        if [[ "$upper_filename" =~ $pattern ]]; then
            echo "${CATEGORIES[$pattern]}"
            return
        fi
    done
    
    # Default category based on content analysis
    if [[ "$upper_filename" =~ (TESTE|TEST) ]]; then
        echo "debug"
    elif [[ "$upper_filename" =~ (RELATORIO|REPORT) ]]; then
        echo "reports"
    elif [[ "$upper_filename" =~ (GUIA|GUIDE|TUTORIAL) ]]; then
        echo "guides"
    else
        echo "misc"
    fi
}

validate_naming_convention() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Check naming convention
    if [[ "$filename" =~ ^[A-Z_0-9]+\.md$ ]]; then
        return 0
    else
        return 1
    fi
}

suggest_rename() {
    local file="$1"
    local filename=$(basename "$file" .md)
    
    # Basic suggestions based on content
    local category=$(categorize_file "$file")
    local upper_category=$(echo "$category" | tr '[:lower:]' '[:upper:]')
    
    # Try to extract meaningful parts
    local clean_name=$(echo "$filename" | tr '[:lower:]' '[:upper:]' | sed 's/[^A-Z0-9_]/_/g' | sed 's/__*/_/g' | sed 's/^_\|_$//g')
    
    echo "${upper_category}_${clean_name}.md"
}

organize_files() {
    local dry_run="$1"
    local files_found=0
    local files_organized=0
    local files_skipped=0
    
    log "🔍 Scanning for .md files..." "$BLUE"
    
    # Find all .md files excluding the organized directory
    while IFS= read -r -d '' file; do
        ((files_found++))
        
        local filename=$(basename "$file")
        local category=$(categorize_file "$file")
        local target_dir="$DOCS_DIR/$category"
        local target_file="$target_dir/$filename"
        
        # Skip if file is already in organized directory
        if [[ "$file" == *"$DOCS_DIR"* ]]; then
            ((files_skipped++))
            continue
        fi
        
        # Skip if target already exists
        if [[ -f "$target_file" ]]; then
            log "   ⚠️  Skipping $filename (already exists in $category)" "$YELLOW"
            ((files_skipped++))
            continue
        fi
        
        if [[ "$dry_run" == "true" ]]; then
            log "   📋 Would move: $filename → $category/" "$CYAN"
        else
            mkdir -p "$target_dir"
            mv "$file" "$target_file"
            log "   ✓ Moved: $filename → $category/" "$GREEN"
            ((files_organized++))
        fi
        
    done < <(find . -name "*.md" -type f -not -path "./$DOCS_DIR/*" -print0)
    
    log "" 
    log "📊 Summary:" "$PURPLE"
    log "   Files found: $files_found"
    log "   Files organized: $files_organized"
    log "   Files skipped: $files_skipped"
}

create_backup() {
    log "💾 Creating backup..." "$BLUE"
    
    if [[ -d "$DOCS_DIR" ]]; then
        cp -r "$DOCS_DIR" "$BACKUP_DIR"
        log "   ✓ Backup created at $BACKUP_DIR" "$GREEN"
    else
        log "   ⚠️  No existing docs directory to backup" "$YELLOW"
    fi
}

show_stats() {
    log "📈 Documentation Statistics:" "$PURPLE"
    
    if [[ ! -d "$DOCS_DIR" ]]; then
        log "   ⚠️  Organized docs directory not found" "$YELLOW"
        return
    fi
    
    local total_files=$(find "$DOCS_DIR" -name "*.md" | wc -l)
    log "   Total organized files: $total_files" "$CYAN"
    
    log "   Files by category:" "$CYAN"
    for dir in "$DOCS_DIR"/*; do
        if [[ -d "$dir" ]]; then
            local category=$(basename "$dir")
            local count=$(find "$dir" -name "*.md" | wc -l)
            log "     $category: $count files" "$GREEN"
        fi
    done
    
    log "   Naming convention compliance:" "$CYAN"
    local compliant=0
    local non_compliant=0
    
    while IFS= read -r -d '' file; do
        if validate_naming_convention "$file"; then
            ((compliant++))
        else
            ((non_compliant++))
        fi
    done < <(find "$DOCS_DIR" -name "*.md" -print0)
    
    log "     Compliant: $compliant files" "$GREEN"
    log "     Non-compliant: $non_compliant files" "$YELLOW"
}

validate_only() {
    log "✅ Validating naming convention..." "$BLUE"
    
    local compliant_files=()
    local non_compliant_files=()
    
    while IFS= read -r -d '' file; do
        if validate_naming_convention "$file"; then
            compliant_files+=("$file")
        else
            non_compliant_files+=("$file")
            local suggestion=$(suggest_rename "$file")
            log "   ❌ $(basename "$file") → Suggested: $suggestion" "$RED"
        fi
    done < <(find "$DOCS_DIR" -name "*.md" -print0 2>/dev/null || true)
    
    log ""
    log "📊 Validation Results:" "$PURPLE"
    log "   Compliant files: ${#compliant_files[@]}" "$GREEN"
    log "   Non-compliant files: ${#non_compliant_files[@]}" "$YELLOW"
    
    if [[ ${#non_compliant_files[@]} -gt 0 ]]; then
        log "   Run with --rename-existing to fix naming issues" "$CYAN"
    fi
}

rename_existing() {
    log "🔄 Renaming files to follow convention..." "$BLUE"
    
    local renamed_count=0
    
    while IFS= read -r -d '' file; do
        if ! validate_naming_convention "$file"; then
            local dir=$(dirname "$file")
            local suggestion=$(suggest_rename "$file")
            local new_path="$dir/$suggestion"
            
            if [[ ! -f "$new_path" ]]; then
                mv "$file" "$new_path"
                log "   ✓ Renamed: $(basename "$file") → $suggestion" "$GREEN"
                ((renamed_count++))
            else
                log "   ⚠️  Cannot rename $(basename "$file"): $suggestion already exists" "$YELLOW"
            fi
        fi
    done < <(find "$DOCS_DIR" -name "*.md" -print0 2>/dev/null || true)
    
    log "   Total files renamed: $renamed_count" "$CYAN"
}

create_readme_files() {
    log "📝 Creating README files for categories..." "$BLUE"
    
    local categories=("admin" "ml" "qgis" "deploy" "debug" "security" "frontend" "features" "reports" "guides" "architecture")
    
    for category in "${categories[@]}"; do
        local readme_path="$DOCS_DIR/$category/README.md"
        if [[ ! -f "$readme_path" ]]; then
            cat > "$readme_path" << EOF
# 📚 $(echo "$category" | tr '[:lower:]' '[:upper:]') - Documentation

## Overview
This directory contains documentation related to $(echo "$category" | tr '[:lower:]' '[:upper:]') functionality of BGAPP.

## Files
$(find "$DOCS_DIR/$category" -name "*.md" -not -name "README.md" -exec basename {} \; | sort | sed 's/^/- /')

## Last Updated
$(date '+%Y-%m-%d %H:%M:%S')

---
*Auto-generated by BGAPP Documentation Organizer*
EOF
            log "   ✓ Created README for $category" "$GREEN"
        fi
    done
}

# Main script execution
main() {
    local dry_run=false
    local create_backup_flag=false
    local rename_flag=false
    local validate_flag=false
    local stats_flag=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                print_usage
                exit 0
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --backup)
                create_backup_flag=true
                shift
                ;;
            --rename-existing)
                rename_flag=true
                shift
                ;;
            --validate-only)
                validate_flag=true
                shift
                ;;
            --stats)
                stats_flag=true
                shift
                ;;
            *)
                log "Unknown option: $1" "$RED"
                print_usage
                exit 1
                ;;
        esac
    done
    
    print_header
    
    # Execute based on flags
    if [[ "$stats_flag" == "true" ]]; then
        show_stats
        exit 0
    fi
    
    if [[ "$validate_flag" == "true" ]]; then
        validate_only
        exit 0
    fi
    
    if [[ "$create_backup_flag" == "true" ]]; then
        create_backup
    fi
    
    create_directories
    
    if [[ "$rename_flag" == "true" ]]; then
        rename_existing
    fi
    
    organize_files "$dry_run"
    
    if [[ "$dry_run" == "false" ]]; then
        create_readme_files
        show_stats
    fi
    
    log ""
    log "🎉 Documentation organization completed!" "$GREEN"
    log "📋 Log file: $LOG_FILE" "$CYAN"
}

# Run main function with all arguments
main "$@"
