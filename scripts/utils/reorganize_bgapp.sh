#!/bin/bash
# 🎯 BGAPP Directory Reorganization Script
# Version: 1.0.0
# Date: 2024-09-22
# Description: Safe and incremental reorganization of BGAPP structure

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="_backups/reorganization_backup_${TIMESTAMP}"
LOG_FILE="reorganization_${TIMESTAMP}.log"

# Function to log messages
log() {
    echo -e "${2}$1${NC}" | tee -a "$LOG_FILE"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to create backup
create_backup() {
    log "📦 Creating complete backup..." "$BLUE"

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # List of critical directories to backup
    dirs_to_backup=(
        "src"
        "admin-dashboard/src"
        "realtime-angola-nextjs/src"
        "infra/frontend"
        "workers"
        "package.json"
        "admin-dashboard/package.json"
        "realtime-angola-nextjs/package.json"
    )

    # Create backup
    for dir in "${dirs_to_backup[@]}"; do
        if [ -e "$dir" ]; then
            log "  Backing up: $dir" "$YELLOW"
            cp -R "$dir" "$BACKUP_DIR/" 2>/dev/null || true
        fi
    done

    log "✅ Backup created at: $BACKUP_DIR" "$GREEN"
}

# Phase 1: Consolidate Python Code
phase1_python_consolidation() {
    log "\n🐍 PHASE 1: Python Code Consolidation" "$BLUE"

    # Create shared directory structure
    log "Creating shared directory structure..." "$YELLOW"
    mkdir -p src/shared/{types,utils,constants}

    # Create __init__.py files
    touch src/shared/__init__.py
    touch src/shared/types/__init__.py
    touch src/shared/utils/__init__.py
    touch src/shared/constants/__init__.py

    # Create scripts directory for deployment/maintenance
    mkdir -p src/scripts

    log "✅ Python structure consolidated" "$GREEN"
}

# Phase 2: Reorganize Frontends
phase2_frontend_reorganization() {
    log "\n🎨 PHASE 2: Frontend Reorganization" "$BLUE"

    # Create apps directory structure
    log "Creating apps directory structure..." "$YELLOW"
    mkdir -p apps

    # Move infra/frontend to apps/frontend
    if [ -d "infra/frontend" ]; then
        log "  Moving infra/frontend → apps/frontend" "$YELLOW"
        cp -R infra/frontend apps/
        log "  ✓ Frontend moved" "$GREEN"
    fi

    # Create symlinks for backward compatibility
    log "  Creating compatibility symlinks..." "$YELLOW"
    ln -sf ../../apps/frontend infra/frontend-link

    log "✅ Frontend structure reorganized" "$GREEN"
}

# Phase 3: Unify Workers
phase3_workers_unification() {
    log "\n⚙️ PHASE 3: Workers Unification" "$BLUE"

    # Create infrastructure directory
    log "Creating infrastructure directory..." "$YELLOW"
    mkdir -p infrastructure/{workers/{api,proxy,webhook,monitoring},configs,deploy}

    # Organize workers by type
    log "  Organizing workers by category..." "$YELLOW"

    # API Workers
    cp workers/api-worker.js infrastructure/workers/api/ 2>/dev/null || true
    cp workers/admin-api-worker.js infrastructure/workers/api/ 2>/dev/null || true
    cp workers/admin-api-public-worker.js infrastructure/workers/api/ 2>/dev/null || true

    # Proxy Workers
    cp workers/gfw-proxy.js infrastructure/workers/proxy/ 2>/dev/null || true
    cp workers/bgapp-services-proxy-worker.js infrastructure/workers/proxy/ 2>/dev/null || true

    # Webhook Workers
    cp workers/copernicus-webhook.js infrastructure/workers/webhook/ 2>/dev/null || true
    cp workers/gfw-webhook.js infrastructure/workers/webhook/ 2>/dev/null || true

    # Monitoring Workers
    cp workers/mcp-monitoring-worker.js infrastructure/workers/monitoring/ 2>/dev/null || true
    cp workers/monitoring-worker.js infrastructure/workers/monitoring/ 2>/dev/null || true

    # Move configs
    cp workers/wrangler*.toml infrastructure/configs/ 2>/dev/null || true

    log "✅ Workers unified in infrastructure/" "$GREEN"
}

# Phase 4: Archive old backups
phase4_archive_cleanup() {
    log "\n🗄️ PHASE 4: Archive Cleanup" "$BLUE"

    # Create archive directory
    log "Creating archive directory..." "$YELLOW"
    mkdir -p archive/{backups,temp,old-structure}

    # Move old backups
    if [ -d "_organization" ]; then
        log "  Archiving _organization..." "$YELLOW"
        mv _organization archive/old-structure/
    fi

    # Move old _backups (except current)
    if [ -d "_backups" ]; then
        log "  Archiving old backups..." "$YELLOW"
        find _backups -maxdepth 1 -type d -not -name "reorganization_backup_*" -exec mv {} archive/backups/ \; 2>/dev/null || true
    fi

    log "✅ Old files archived" "$GREEN"
}

# Update imports script
update_python_imports() {
    log "\n🔄 Updating Python imports..." "$BLUE"

    # Create import updater script
    cat > src/scripts/update_imports.py << 'EOF'
#!/usr/bin/env python3
"""Update Python imports to use absolute paths"""
import os
import re
import sys
from pathlib import Path

def update_file_imports(filepath):
    """Update imports in a single Python file"""
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace relative imports with absolute
    patterns = [
        (r"sys\.path\.append\('\.\.\/\.\.\/'\)", "# Path already in PYTHONPATH"),
        (r"sys\.path\.append\('\.\.\/\.\.'\)", "# Path already in PYTHONPATH"),
        (r"from \.\. import", "from src.bgapp import"),
        (r"from \.\.\. import", "from src import"),
    ]

    modified = False
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            modified = True
            content = new_content

    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    """Main function"""
    python_files = Path('src').glob('**/*.py')
    updated_count = 0

    for filepath in python_files:
        if update_file_imports(filepath):
            print(f"Updated: {filepath}")
            updated_count += 1

    print(f"\n✅ Updated {updated_count} files")

if __name__ == "__main__":
    main()
EOF

    chmod +x src/scripts/update_imports.py
    log "✅ Import updater script created" "$GREEN"
}

# Create new project structure documentation
create_structure_docs() {
    log "\n📝 Creating structure documentation..." "$BLUE"

    cat > PROJECT_STRUCTURE.md << 'EOF'
# 🏗️ BGAPP Project Structure

## Directory Organization (After Reorganization)

```
bgapp/
├── apps/                     # All frontend applications
│   ├── frontend/            # Main static frontend (from infra/frontend)
│   ├── admin-dashboard/     # Next.js admin dashboard
│   ├── realtime-angola/     # Next.js realtime monitoring
│   └── minpermar/          # Vue.js MinPerMar app
│
├── src/                     # Python source code
│   ├── bgapp/              # Core BGAPP modules
│   │   ├── api/           # FastAPI endpoints
│   │   ├── ml/            # Machine Learning models
│   │   ├── security/      # Security & authentication
│   │   └── ...
│   ├── shared/             # Shared code
│   │   ├── types/         # Type definitions
│   │   ├── utils/         # Utility functions
│   │   └── constants/     # Constants
│   └── scripts/            # Deployment & maintenance scripts
│
├── infrastructure/          # Infrastructure code
│   ├── workers/            # Cloudflare Workers
│   │   ├── api/           # API workers
│   │   ├── proxy/         # Proxy workers
│   │   ├── webhook/       # Webhook workers
│   │   └── monitoring/    # Monitoring workers
│   ├── configs/            # Configuration files
│   └── deploy/             # Deployment scripts
│
├── archive/                 # Archived files
│   ├── backups/           # Old backups
│   ├── temp/              # Temporary files
│   └── old-structure/     # Previous organization attempts
│
├── docs/                    # Documentation
├── tests/                   # Test files
└── .github/                # GitHub configuration
```

## Import Conventions

### Python
```python
# Use absolute imports
from src.bgapp.api import endpoints
from src.shared.utils import helpers
```

### JavaScript/TypeScript
```javascript
// Frontend apps
import { Component } from '@/components'
import { api } from '@/lib/api'
```

## Environment Variables
All environment configurations are centralized in:
- `.env` - Development
- `.env.production` - Production
- `wrangler.toml` - Cloudflare Workers

## Deployment
- Frontend: `npm run deploy` from each app directory
- Workers: `wrangler deploy` from infrastructure/workers/
- Python: Docker or direct deployment

## December 2024 Presentation Ready ✅
EOF

    log "✅ Documentation created" "$GREEN"
}

# Main execution
main() {
    log "🚀 Starting BGAPP Directory Reorganization" "$GREEN"
    log "================================================" "$GREEN"

    # Check if running from project root
    if [ ! -f "package.json" ]; then
        log "❌ Error: Must run from project root directory" "$RED"
        exit 1
    fi

    # Create backup first
    create_backup

    # Execute phases
    phase1_python_consolidation
    phase2_frontend_reorganization
    phase3_workers_unification
    phase4_archive_cleanup

    # Update imports
    update_python_imports

    # Create documentation
    create_structure_docs

    log "\n================================================" "$GREEN"
    log "✨ REORGANIZATION COMPLETED SUCCESSFULLY!" "$GREEN"
    log "================================================" "$GREEN"

    log "\n📋 Next Steps:" "$BLUE"
    log "  1. Review changes in $BACKUP_DIR" "$YELLOW"
    log "  2. Run: python src/scripts/update_imports.py" "$YELLOW"
    log "  3. Test all functionality" "$YELLOW"
    log "  4. Commit changes when satisfied" "$YELLOW"
    log "  5. Update CI/CD pipelines if needed" "$YELLOW"

    log "\n💡 Rollback Command:" "$BLUE"
    log "  cp -R $BACKUP_DIR/* ." "$YELLOW"

    log "\nLog file: $LOG_FILE" "$BLUE"
}

# Run main function
main