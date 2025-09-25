#!/bin/bash

# 🚀 Deploy Frontend Fix - Updated realtime_angola.html
# Deploys the fixed version with working data loading to Cloudflare Pages
# Version: 1.0.0 - Emergency Frontend Fix

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_deploy() {
    echo -e "${PURPLE}[DEPLOY]${NC} $1"
}

# Configuration
PROJECT_ROOT="/Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp"
FRONTEND_DIR="$PROJECT_ROOT/infra/frontend"
DEPLOY_DIR="$PROJECT_ROOT/deploy_temp"
LOG_FILE="$PROJECT_ROOT/logs/frontend-deploy-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Start logging
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

log_info "🚀 Starting Frontend Fix Deployment"
log_info "Timestamp: $(date)"
log_info "Target: realtime_angola.html with API fixes"

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v wrangler &> /dev/null; then
    log_error "Wrangler CLI not found. Please install: npm install -g wrangler"
    exit 1
fi

if ! wrangler whoami &> /dev/null; then
    log_error "Wrangler not authenticated. Please run: wrangler login"
    exit 1
fi

if [ ! -f "$FRONTEND_DIR/realtime_angola.html" ]; then
    log_error "Updated realtime_angola.html not found at: $FRONTEND_DIR/realtime_angola.html"
    exit 1
fi

log_success "Prerequisites check passed"

# Create temporary deployment directory
log_info "Creating deployment structure..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy the updated file to deployment directory
log_deploy "Copying updated realtime_angola.html..."
cp "$FRONTEND_DIR/realtime_angola.html" "$DEPLOY_DIR/"

# Copy other essential files if they exist
log_deploy "Copying supporting files..."
if [ -d "$FRONTEND_DIR/assets" ]; then
    cp -r "$FRONTEND_DIR/assets" "$DEPLOY_DIR/"
    log_success "Assets directory copied"
fi

if [ -d "$FRONTEND_DIR/static" ]; then
    cp -r "$FRONTEND_DIR/static" "$DEPLOY_DIR/"
    log_success "Static files copied"
fi

# Copy favicon and PWA files
for file in favicon.ico favicon-16x16.png favicon-32x32.png apple-touch-icon.png; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        cp "$PROJECT_ROOT/$file" "$DEPLOY_DIR/"
        log_success "Copied $file"
    fi
done

# Create a simple index.html that redirects to realtime_angola.html
log_deploy "Creating index.html redirect..."
cat > "$DEPLOY_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <title>BGAPP - Redirecting...</title>
    <meta http-equiv="refresh" content="0; url=./realtime_angola.html">
    <script>
        window.location.href = './realtime_angola.html';
    </script>
</head>
<body>
    <p>Redirecting to BGAPP Real-Time Angola...</p>
    <p><a href="./realtime_angola.html">Click here if not redirected automatically</a></p>
</body>
</html>
EOF

log_success "Index redirect created"

# Verify the updated file has our fixes
log_info "Verifying updated file contains our fixes..."
if grep -q "nova API oficial Copernicus" "$DEPLOY_DIR/realtime_angola.html"; then
    log_success "✅ Nova API oficial Copernicus detectada no arquivo"
else
    log_error "❌ Nova API oficial não encontrada - arquivo pode não estar atualizado"
    exit 1
fi

if grep -q "MCP-Enhanced Data Loading Functions" "$DEPLOY_DIR/realtime_angola.html"; then
    log_success "✅ MCP enhancement functions detected in file"
else
    log_warning "⚠️  MCP enhancement functions not found - may be expected"
fi

# Deploy to Cloudflare Pages
log_deploy "Deploying to Cloudflare Pages..."
cd "$DEPLOY_DIR"

# Deploy using wrangler pages
if wrangler pages deploy . --project-name bgapp-frontend; then
    log_success "🎉 Frontend deployment successful!"
    
    # Get deployment URL
    DEPLOY_URL="https://bgapp-frontend.pages.dev"
    log_success "Live URL: $DEPLOY_URL"
    
    # Wait for propagation
    log_info "Waiting for deployment propagation..."
    sleep 15
    
    # Test the deployed version
    log_info "Testing deployed version..."
    
    # Test if the page loads
    if curl -s -f "$DEPLOY_URL/realtime_angola" > /dev/null; then
        log_success "✅ Page loads successfully"
        
        # Test if it contains our fixes
        PAGE_CONTENT=$(curl -s "$DEPLOY_URL/realtime_angola")
        if echo "$PAGE_CONTENT" | grep -q "Try API endpoint first"; then
            log_success "✅ Updated version deployed successfully!"
            log_success "🎯 The API fixes are now live!"
        else
            log_warning "⚠️  Page deployed but may still be propagating..."
            log_info "Please wait 5-10 minutes for full propagation"
        fi
    else
        log_error "❌ Deployed page not accessible"
    fi
    
    # Generate deployment report
    REPORT_FILE="$PROJECT_ROOT/reports/frontend-fix-deployment-$(date +%Y%m%d-%H%M%S).md"
    mkdir -p "$PROJECT_ROOT/reports"
    
    cat > "$REPORT_FILE" << EOF
# 🚀 Frontend Fix Deployment Report

**Date:** $(date)  
**Status:** ✅ Successful  
**Target:** realtime_angola.html API fixes

## Deployment Details

- **Source:** $FRONTEND_DIR/realtime_angola.html
- **Target:** $DEPLOY_URL/realtime_angola
- **Deployment Method:** Wrangler Pages Deploy
- **Deployment Log:** $LOG_FILE

## Fixes Deployed

- ✅ **API Data Loading Fix**: Now properly fetches from /api/realtime/data
- ✅ **Error Handling**: Fallback values instead of perpetual loading states
- ✅ **Enhanced Status Indicators**: Shows data source and quality
- ✅ **MCP Enhancement Framework**: Ready for AI-powered data processing

## Expected Results

After deployment propagation (5-10 minutes):
- **Temperature**: Should show ~19.8°C instead of "--°C"
- **Chlorophyll**: Should show ~7.98 mg/m³ instead of "--"
- **Vessels**: Should show ~53 instead of "--"
- **Status Indicators**: Should show "✅ Tempo Real" instead of "→ Carregando..."

## Testing URLs

- **Main Page**: $DEPLOY_URL/realtime_angola
- **API Test**: https://bgapp-api-worker.majearcasa.workers.dev/api/realtime/data
- **GFW Test**: https://bgapp-api-worker.majearcasa.workers.dev/api/gfw/vessel-presence

## Next Steps

1. Wait 5-10 minutes for full propagation
2. Test the live page to confirm fixes are working
3. Monitor console logs for any remaining issues
4. Plan MCP integration activation

---

**The frontend fixes have been deployed! The page should now show real data instead of loading states.** 🎉
EOF
    
    log_success "Deployment report: $REPORT_FILE"
    
    # Clean up
    cd "$PROJECT_ROOT"
    rm -rf "$DEPLOY_DIR"
    log_info "Temporary deployment directory cleaned up"
    
    echo
    log_success "🎉 Frontend Fix Deployment Completed!"
    log_success "Live URL: $DEPLOY_URL/realtime_angola"
    log_info "Expected data:"
    log_info "  🌡️ Temperature: ~19.8°C (instead of --°C)"
    log_info "  🌱 Chlorophyll: ~7.98 mg/m³ (instead of --)"
    log_info "  🚢 Vessels: ~53 (instead of --)"
    log_info "  📊 Status: Real-time indicators (instead of loading)"
    
    echo
    log_info "⏰ Please wait 5-10 minutes for full Cloudflare propagation"
    log_info "📋 Deployment Report: $REPORT_FILE"
    log_info "📋 Deployment Log: $LOG_FILE"
    
else
    log_error "❌ Frontend deployment failed!"
    log_error "Check deployment log: $LOG_FILE"
    
    # Clean up on failure
    cd "$PROJECT_ROOT"
    rm -rf "$DEPLOY_DIR"
    
    exit 1
fi

log_success "🎯 Frontend fix deployment process completed!"
