#!/bin/bash

# 🌊 NEPTUNE Deployment Script
# Deploy Neptune Platform to Cloudflare Pages
# MareDatum Consultoria e Gestão de Projectos Unipessoal LDA

set -e

echo "🌊 NEPTUNE Deployment - MareDatum Consultoria"
echo "=============================================="
echo "Deploying Neptune to Cloudflare Pages..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
print_status "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    print_error "Not logged in to Cloudflare. Please run:"
    echo "wrangler login"
    exit 1
fi

print_success "Authenticated with Cloudflare"

# Prepare deployment directory
print_status "Preparing Neptune deployment..."

DEPLOY_DIR="apps/frontend/BGAPP"
TEMP_DEPLOY_DIR="/tmp/neptune-deploy-$(date +%s)"

# Check if source directory exists
if [ ! -d "$DEPLOY_DIR" ]; then
    print_error "Source directory '$DEPLOY_DIR' not found"
    exit 1
fi

# Create temporary deployment directory
mkdir -p "$TEMP_DEPLOY_DIR"

# Copy Neptune files
print_status "Copying Neptune files..."
cp -r "$DEPLOY_DIR"/* "$TEMP_DEPLOY_DIR/"

# Check if Neptune HTML exists
if [ ! -f "$TEMP_DEPLOY_DIR/index-neptune.html" ]; then
    print_error "Neptune HTML file not found!"
    exit 1
fi

# Rename index-neptune.html to index.html for deployment
print_status "Setting up Neptune as main page..."
mv "$TEMP_DEPLOY_DIR/index-neptune.html" "$TEMP_DEPLOY_DIR/index.html"

# Keep the original BGAPP as backup
if [ -f "$DEPLOY_DIR/index.html" ]; then
    cp "$DEPLOY_DIR/index.html" "$TEMP_DEPLOY_DIR/bgapp-original.html"
    print_success "Original BGAPP backed up as bgapp-original.html"
fi

# Create _redirects file for clean URLs
print_status "Creating redirects configuration..."
cat > "$TEMP_DEPLOY_DIR/_redirects" << 'EOF'
# Neptune Redirects
/                        /index.html                200
/neptune                 /index.html                200
/bgapp                   /bgapp-original.html       200

# Admin redirects
/admin                   /admin.html                200
/dashboard               /admin.html                200

# Assets
/assets/*                /assets/:splat             200
/static/*                /static/:splat             200

# API redirects (if needed)
/api/*                   https://bgapp-admin-api-worker.majearcasa.workers.dev/:splat  200
EOF

# Create _headers file for security and caching
print_status "Creating headers configuration..."
cat > "$TEMP_DEPLOY_DIR/_headers" << 'EOF'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/static/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable
EOF

# Create assets directory if it doesn't exist
mkdir -p "$TEMP_DEPLOY_DIR/assets"

# Show deployment summary
echo ""
echo -e "${CYAN}📦 Deployment Package Summary:${NC}"
echo "================================"
ls -lh "$TEMP_DEPLOY_DIR" | tail -n +2
echo ""

# Deploy to Cloudflare Pages
print_status "Deploying Neptune to Cloudflare Pages..."
echo ""

# Remove API token to use OAuth
unset CLOUDFLARE_API_TOKEN

PROJECT_NAME="bgapp-frontend"

# Deploy with wrangler (with dirty flag to ignore git warnings)
if wrangler pages deploy "$TEMP_DEPLOY_DIR" --project-name "$PROJECT_NAME" --branch main --commit-dirty=true; then
    print_success "Neptune deployed successfully!"
    
    echo ""
    echo "🎉 Neptune Deployment Complete!"
    echo "=============================="
    echo ""
    echo -e "${CYAN}🌐 Neptune URL:${NC}        https://$PROJECT_NAME.pages.dev"
    echo -e "${CYAN}🔐 Admin Dashboard:${NC}    https://$PROJECT_NAME.pages.dev/admin"
    echo -e "${CYAN}📜 Original BGAPP:${NC}     https://$PROJECT_NAME.pages.dev/bgapp"
    echo ""
    
    # Check if custom domain is configured
    print_status "Checking for custom domain configuration..."
    if wrangler pages project list | grep -q "$PROJECT_NAME"; then
        echo -e "${CYAN}📍 Custom Domains:${NC}"
        wrangler pages deployment list --project-name "$PROJECT_NAME" | head -5
    fi
    
    echo ""
    print_success "Neptune is live! 🌊"
    echo ""
    echo "Next steps:"
    echo "1. 🌐 Visit https://$PROJECT_NAME.pages.dev to see Neptune"
    echo "2. 🎵 Add audio file to assets/audio/neptune-ambient.mp3"
    echo "3. 🔧 Configure custom domain (optional)"
    echo "4. 📊 Monitor analytics in Cloudflare dashboard"
    echo ""
else
    print_error "Deployment failed!"
    print_status "Cleaning up temporary files..."
    rm -rf "$TEMP_DEPLOY_DIR"
    exit 1
fi

# Cleanup
print_status "Cleaning up temporary files..."
rm -rf "$TEMP_DEPLOY_DIR"

print_success "Deployment complete! 🚀"
echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}  Neptune - Análise Oceanográfica${NC}"
echo -e "${CYAN}  Desenvolvido por MareDatum${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

