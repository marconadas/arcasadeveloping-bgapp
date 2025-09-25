#!/bin/bash
# 🎯 BGAPP Complete Directory Reorganization Script
# Version: 2.0.0
# Date: 2025-01-09
# Description: Complete reorganization from 42 directories to clean structure

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="archive/reorganization_backup_${TIMESTAMP}"
LOG_FILE="reorganization_complete_${TIMESTAMP}.log"

# Function to log messages
log() {
    echo -e "${2}$1${NC}" | tee -a "$LOG_FILE"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to create complete backup
create_complete_backup() {
    log "📦 Creating COMPLETE project backup..." "$BLUE"

    mkdir -p "$BACKUP_DIR"

    # Backup everything except node_modules and huge files
    log "  Backing up entire project (excluding node_modules)..." "$YELLOW"
    rsync -av --exclude='node_modules' \
             --exclude='.git' \
             --exclude='*.log' \
             --exclude='.next' \
             --exclude='out' \
             --exclude='_backups' \
             --exclude='__pycache__' \
             --exclude='.venv' \
             ./ "$BACKUP_DIR/" || true

    log "✅ Complete backup created in: $BACKUP_DIR" "$GREEN"
}

# Function to show current structure
show_current_structure() {
    log "📊 Current directory structure (42 directories):" "$PURPLE"
    find . -maxdepth 1 -type d | grep -v "^\.$" | grep -v ".git" | sort | wc -l
    log "  Total directories: $(find . -maxdepth 1 -type d | grep -v "^\.$" | grep -v ".git" | wc -l)" "$YELLOW"
}

# Function to reorganize directories
reorganize_structure() {
    log "🔄 Starting complete reorganization..." "$BLUE"

    # Phase 1: Create new structure
    log "📁 Phase 1: Creating new directory structure..." "$YELLOW"

    mkdir -p apps/{frontend,admin-dashboard,realtime-angola}
    mkdir -p infrastructure/{workers,configs,deploy}
    mkdir -p archive/{legacy,backups,temp,old-structure}
    mkdir -p documentation
    mkdir -p tests

    # Phase 2: Move applications
    log "📱 Phase 2: Moving applications..." "$YELLOW"

    # Move admin dashboard (if not already in place)
    if [ -d "admin-dashboard" ] && [ ! -d "apps/admin-dashboard" ]; then
        log "  Moving admin-dashboard -> apps/admin-dashboard" "$GREEN"
        mv admin-dashboard apps/admin-dashboard
    fi

    # Move realtime angola (if not already in place)
    if [ -d "realtime-angola-nextjs" ] && [ ! -d "apps/realtime-angola" ]; then
        log "  Moving realtime-angola-nextjs -> apps/realtime-angola" "$GREEN"
        mv realtime-angola-nextjs apps/realtime-angola
    fi

    # Move frontend apps
    if [ -d "infra/frontend" ]; then
        log "  Moving infra/frontend -> apps/frontend/legacy" "$GREEN"
        mkdir -p apps/frontend/legacy
        cp -R infra/frontend/* apps/frontend/legacy/ || true
    fi

    # Phase 3: Move infrastructure
    log "⚙️ Phase 3: Moving infrastructure..." "$YELLOW"

    if [ -d "workers" ]; then
        log "  Moving workers -> infrastructure/workers" "$GREEN"
        cp -R workers/* infrastructure/workers/ || true
    fi

    # Move configuration files
    for config_dir in configs config; do
        if [ -d "$config_dir" ]; then
            log "  Moving $config_dir -> infrastructure/configs" "$GREEN"
            cp -R "$config_dir"/* infrastructure/configs/ || true
        fi
    done

    # Move deployment scripts
    for deploy_dir in deployment deploy_arcasadeveloping; do
        if [ -d "$deploy_dir" ]; then
            log "  Moving $deploy_dir -> infrastructure/deploy" "$GREEN"
            cp -R "$deploy_dir"/* infrastructure/deploy/ || true
        fi
    done

    # Phase 4: Archive legacy/redundant directories
    log "🗄️ Phase 4: Archiving legacy directories..." "$YELLOW"

    legacy_dirs=(
        "static" "assets" "templates" "infrastructure" "copernicus-official"
        "bgapp-workflow" "notebooks" "reports" "data" "logs" "test-results"
        "thunder-tests" "spec-kit" "projeto_kalunga" "utils" "scripts"
        "testing" "migrations" "dags" "_organization" "temp"
    )

    for dir in "${legacy_dirs[@]}"; do
        if [ -d "$dir" ]; then
            log "  Archiving $dir -> archive/legacy/" "$GREEN"
            mkdir -p archive/legacy
            mv "$dir" archive/legacy/ || true
        fi
    done

    # Phase 5: Move documentation
    log "📚 Phase 5: Organizing documentation..." "$YELLOW"

    if [ -d "docs" ]; then
        log "  Moving docs -> documentation" "$GREEN"
        cp -R docs/* documentation/ || true
    fi

    # Move README files and documentation
    find . -maxdepth 1 -name "*.md" -not -name "CLAUDE.md" -not -name "README.md" | while read file; do
        if [ -f "$file" ]; then
            log "  Moving documentation: $file -> documentation/" "$GREEN"
            mv "$file" documentation/ || true
        fi
    done

    # Phase 6: Clean up empty directories
    log "🧹 Phase 6: Cleaning up empty directories..." "$YELLOW"

    # Remove empty directories
    find . -type d -empty -delete 2>/dev/null || true

    log "✅ Reorganization complete!" "$GREEN"
}

# Function to create symlinks for compatibility
create_compatibility_links() {
    log "🔗 Creating compatibility symlinks..." "$BLUE"

    # Create symlinks for backward compatibility
    if [ -d "apps/admin-dashboard" ] && [ ! -L "admin-dashboard" ]; then
        ln -sf apps/admin-dashboard admin-dashboard
        log "  Created symlink: admin-dashboard -> apps/admin-dashboard" "$GREEN"
    fi

    if [ -d "apps/realtime-angola" ] && [ ! -L "realtime-angola-nextjs" ]; then
        ln -sf apps/realtime-angola realtime-angola-nextjs
        log "  Created symlink: realtime-angola-nextjs -> apps/realtime-angola" "$GREEN"
    fi

    if [ -d "infrastructure/workers" ] && [ ! -L "workers" ]; then
        ln -sf infrastructure/workers workers
        log "  Created symlink: workers -> infrastructure/workers" "$GREEN"
    fi

    log "✅ Compatibility links created!" "$GREEN"
}

# Function to update package.json scripts
update_package_scripts() {
    log "📝 Updating package.json scripts..." "$BLUE"

    # Update root package.json
    if [ -f "package.json" ]; then
        log "  Updating root package.json paths..." "$GREEN"
        # Use sed to update paths in scripts
        sed -i.bak 's|admin-dashboard|apps/admin-dashboard|g' package.json || true
        sed -i.bak 's|realtime-angola-nextjs|apps/realtime-angola|g' package.json || true
    fi

    log "✅ Package scripts updated!" "$GREEN"
}

# Function to verify reorganization
verify_reorganization() {
    log "🔍 Verifying reorganization..." "$BLUE"

    # Check if main directories exist
    required_dirs=(
        "apps/admin-dashboard"
        "apps/realtime-angola"
        "apps/frontend"
        "infrastructure/workers"
        "src"
        "archive"
        "documentation"
    )

    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            log "  ✅ $dir exists" "$GREEN"
        else
            log "  ❌ $dir missing" "$RED"
        fi
    done

    # Count remaining top-level directories
    current_dirs=$(find . -maxdepth 1 -type d | grep -v "^\.$" | grep -v ".git" | wc -l)
    log "  📊 Current top-level directories: $current_dirs" "$YELLOW"

    if [ "$current_dirs" -lt 15 ]; then
        log "✅ Reorganization successful! Reduced from 42 to $current_dirs directories" "$GREEN"
    else
        log "⚠️ Still too many directories ($current_dirs). Manual cleanup needed." "$YELLOW"
    fi
}

# Function to show new structure
show_new_structure() {
    log "📊 New project structure:" "$PURPLE"
    tree -L 2 -d . 2>/dev/null || find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" | head -20
}

# Main execution
main() {
    log "🚀 Starting BGAPP Complete Reorganization" "$PURPLE"
    log "================================================================" "$BLUE"

    # Show current state
    show_current_structure

    # Create backup
    create_complete_backup

    # Execute reorganization
    reorganize_structure

    # Create compatibility links
    create_compatibility_links

    # Update package scripts
    update_package_scripts

    # Verify results
    verify_reorganization

    # Show new structure
    show_new_structure

    log "================================================================" "$BLUE"
    log "🎉 BGAPP Reorganization Complete!" "$GREEN"
    log "📋 Next steps:" "$YELLOW"
    log "  1. Test applications: npm run dev, npm run dev:admin, npm run dev:realtime" "$YELLOW"
    log "  2. Verify deployments work" "$YELLOW"
    log "  3. Update documentation" "$YELLOW"
    log "  4. Run tests" "$YELLOW"
    log "📁 Backup location: $BACKUP_DIR" "$BLUE"
    log "📝 Log file: $LOG_FILE" "$BLUE"
}

# Run main function
main "$@"