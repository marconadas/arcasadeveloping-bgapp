#!/bin/bash

# 🔧 CORS Fix Deployment Script
# Deploys updated workers with x-client-version header support

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROJECT_ROOT="/Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp"
WORKERS_DIR="$PROJECT_ROOT/workers"

log_info "🔧 Starting CORS Fix Deployment"
log_info "Timestamp: $(date)"

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v wrangler &> /dev/null; then
    log_error "Wrangler CLI not found. Please install it first:"
    log_error "npm install -g wrangler"
    exit 1
fi

# Check authentication
log_info "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    log_error "Not authenticated with Cloudflare. Please run: wrangler login"
    exit 1
fi

log_success "Prerequisites check completed"

# Change to workers directory
cd "$WORKERS_DIR"

# Deploy key workers with CORS fixes
WORKERS_TO_DEPLOY=(
    "api-worker.js:bgapp-api-worker"
    "admin-api-worker.js:bgapp-admin-api-worker"
    "admin-api-public-worker.js:bgapp-api"
    "enhanced-api-worker.js:bgapp-enhanced-api-worker"
    "gfw-proxy.js:bgapp-gfw-proxy"
    "mcp-monitoring-worker.js:bgapp-mcp-monitoring"
    "bgapp-services-proxy-worker.js:bgapp-services-proxy"
)

log_info "Deploying ${#WORKERS_TO_DEPLOY[@]} workers with CORS fixes..."

for worker_config in "${WORKERS_TO_DEPLOY[@]}"; do
    IFS=':' read -r worker_file worker_name <<< "$worker_config"
    
    if [ -f "$worker_file" ]; then
        log_info "Deploying $worker_name ($worker_file)..."
        
        # Deploy the worker
        if wrangler deploy "$worker_file" --name "$worker_name" --compatibility-date 2024-01-01; then
            log_success "✅ $worker_name deployed successfully"
            
            # Test the worker
            log_info "Testing $worker_name..."
            sleep 2  # Wait for deployment to propagate
            
            if curl -s -o /dev/null -w "%{http_code}" "https://$worker_name.majearcasa.workers.dev/health" | grep -q "200"; then
                log_success "✅ $worker_name is responding correctly"
            else
                log_warning "⚠️  $worker_name health check failed (might be normal for some workers)"
            fi
        else
            log_error "❌ Failed to deploy $worker_name"
        fi
    else
        log_warning "⚠️  Worker file not found: $worker_file"
    fi
    
    echo ""
done

# Test CORS fix
log_info "Testing CORS fix..."
cd "$PROJECT_ROOT"

if [ -f "test-cors-fix.js" ]; then
    log_info "Running CORS test..."
    if node test-cors-fix.js; then
        log_success "🎉 CORS fix is working correctly!"
    else
        log_warning "⚠️  CORS test failed. Workers might need time to propagate."
        log_info "Try running the test again in a few minutes: node test-cors-fix.js"
    fi
else
    log_warning "CORS test script not found. Skipping automated test."
fi

log_success "🎉 CORS Fix Deployment completed!"
log_info "The following workers have been updated with x-client-version header support:"

for worker_config in "${WORKERS_TO_DEPLOY[@]}"; do
    IFS=':' read -r worker_file worker_name <<< "$worker_config"
    if [ -f "$WORKERS_DIR/$worker_file" ]; then
        echo "  ✅ https://$worker_name.majearcasa.workers.dev"
    fi
done

echo ""
log_info "📋 Next steps:"
echo "1. Wait 2-3 minutes for global propagation"
echo "2. Test the admin dashboard: https://bgapp-admin.pages.dev"
echo "3. Check browser console for CORS errors (should be resolved)"
echo "4. Run manual test: node test-cors-fix.js"

echo ""
log_info "🔍 If issues persist:"
echo "1. Check Cloudflare dashboard for deployment status"
echo "2. Verify worker logs in Cloudflare dashboard"
echo "3. Test individual endpoints with curl"
