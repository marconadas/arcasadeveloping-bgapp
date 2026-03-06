#!/bin/bash

# BGAPP Custom Domain Setup Script
# Configure custom domains and SSL certificates for professional client access
# MareDatum Consultoria e Gestão de Projectos Unipessoal LDA

set -e

echo "🌐 BGAPP Custom Domain Setup - MareDatum Consultoria"
echo "===================================================="
echo "Setting up custom domains for professional client access..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if wrangler is installed and user is logged in
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

if ! wrangler whoami &> /dev/null; then
    print_error "Not logged in to Cloudflare. Please run:"
    echo "wrangler login"
    exit 1
fi

print_status "Starting custom domain configuration..."

# Function to setup custom domain for a worker
setup_worker_domain() {
    local worker_name=$1
    local domain=$2
    local subdomain=$3
    
    print_status "Setting up custom domain for $worker_name..."
    
    # Create custom domain configuration
    cat > "workers/${worker_name}-domain-config.json" << EOF
{
    "name": "$worker_name",
    "routes": [
        {
            "pattern": "$subdomain.$domain/*",
            "custom_domain": true
        }
    ],
    "custom_domains": [
        {
            "domain": "$subdomain.$domain",
            "zone_id": "YOUR_ZONE_ID_HERE"
        }
    ]
}
EOF

    print_success "Domain configuration created for $subdomain.$domain"
}

# Function to setup custom domain for Pages
setup_pages_domain() {
    local project_name=$1
    local domain=$2
    local subdomain=$3
    
    print_status "Setting up custom domain for Pages project: $project_name..."
    
    # Note: This requires manual setup in Cloudflare dashboard
    # or using Cloudflare API with proper authentication
    print_warning "Manual setup required for Pages custom domain:"
    echo "1. Go to Cloudflare Dashboard > Pages > $project_name"
    echo "2. Go to Custom domains tab"
    echo "3. Add custom domain: $subdomain.$domain"
    echo "4. Update DNS records as instructed"
    echo ""
}

# Main domain configuration
MAIN_DOMAIN="maredatum.pt"
BGAPP_DOMAIN="bgapp.maredatum.pt"

print_status "Configuring domains for BGAPP services..."

# 1. Setup main BGAPP domain
print_status "Setting up main BGAPP domain: $BGAPP_DOMAIN"

# 2. Setup subdomains for each service
setup_worker_domain "bgapp-api" "$MAIN_DOMAIN" "api"
setup_worker_domain "bgapp-stac" "$MAIN_DOMAIN" "stac"
setup_worker_domain "bgapp-geoapi" "$MAIN_DOMAIN" "geoapi"
setup_worker_domain "bgapp-browser" "$MAIN_DOMAIN" "browser"
setup_worker_domain "bgapp-auth" "$MAIN_DOMAIN" "auth"
setup_worker_domain "bgapp-monitor" "$MAIN_DOMAIN" "monitor"
setup_worker_domain "bgapp-workflow" "$MAIN_DOMAIN" "workflow"

# 3. Setup Pages domains
setup_pages_domain "bgapp-frontend" "$MAIN_DOMAIN" "app"
setup_pages_domain "bgapp-admin" "$MAIN_DOMAIN" "admin"

# 4. Create DNS configuration file
print_status "Creating DNS configuration file..."

cat > "dns-config.md" << EOF
# BGAPP DNS Configuration

## Required DNS Records for $MAIN_DOMAIN

Add the following DNS records to your domain registrar or DNS provider:

### A Records (if using Cloudflare)
\`\`\`
app.$MAIN_DOMAIN        -> CNAME bgapp-frontend.pages.dev
admin.$MAIN_DOMAIN      -> CNAME bgapp-admin.pages.dev
\`\`\`

### CNAME Records for Workers
\`\`\`
api.$MAIN_DOMAIN        -> CNAME bgapp-api.majearcasa.workers.dev
stac.$MAIN_DOMAIN       -> CNAME bgapp-stac.majearcasa.workers.dev
geoapi.$MAIN_DOMAIN     -> CNAME bgapp-geoapi.majearcasa.workers.dev
browser.$MAIN_DOMAIN    -> CNAME bgapp-browser.majearcasa.workers.dev
auth.$MAIN_DOMAIN       -> CNAME bgapp-auth.majearcasa.workers.dev
monitor.$MAIN_DOMAIN    -> CNAME bgapp-monitor.majearcasa.workers.dev
workflow.$MAIN_DOMAIN   -> CNAME bgapp-workflow.majearcasa.workers.dev
\`\`\`

### Alternative: Single Domain Setup
If you prefer a single domain with paths:

\`\`\`
$BGAPP_DOMAIN           -> CNAME bgapp-frontend.pages.dev
\`\`\`

Then configure path-based routing in your main application.

## SSL Certificates
Cloudflare automatically provides SSL certificates for all custom domains.
No additional SSL configuration is required.

## Verification
After DNS propagation (usually 5-15 minutes), test the domains:

- https://app.$MAIN_DOMAIN (Frontend)
- https://admin.$MAIN_DOMAIN (Admin Dashboard)
- https://api.$MAIN_DOMAIN (API)
- https://stac.$MAIN_DOMAIN (STAC API)
- https://workflow.$MAIN_DOMAIN/client-info (Client Information)

## Client Access URLs
Once configured, provide these URLs to clients:

- **Main Application**: https://app.$MAIN_DOMAIN
- **Admin Dashboard**: https://admin.$MAIN_DOMAIN
- **API Documentation**: https://api.$MAIN_DOMAIN/docs
- **Geospatial API**: https://stac.$MAIN_DOMAIN
- **System Status**: https://workflow.$MAIN_DOMAIN/services
EOF

print_success "DNS configuration file created: dns-config.md"

# 5. Create SSL verification script
print_status "Creating SSL verification script..."

cat > "verify-ssl.sh" << 'EOF'
#!/bin/bash

# SSL Verification Script for BGAPP
echo "🔒 Verifying SSL certificates for BGAPP services..."

DOMAINS=(
    "app.maredatum.pt"
    "admin.maredatum.pt"
    "api.maredatum.pt"
    "stac.maredatum.pt"
    "geoapi.maredatum.pt"
    "browser.maredatum.pt"
    "auth.maredatum.pt"
    "monitor.maredatum.pt"
    "workflow.maredatum.pt"
)

for domain in "${DOMAINS[@]}"; do
    echo "Checking $domain..."
    if curl -s -I "https://$domain" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
        echo "✅ $domain - SSL OK"
    else
        echo "❌ $domain - SSL Issue or Domain Not Ready"
    fi
done
EOF

chmod +x verify-ssl.sh
print_success "SSL verification script created: verify-ssl.sh"

# 6. Create client documentation
print_status "Creating client documentation..."

cat > "CLIENT_ACCESS_GUIDE.md" << EOF
# BGAPP Client Access Guide

## MareDatum Consultoria e Gestão de Projectos Unipessoal LDA

### 🌐 Production URLs (Custom Domain)

Once DNS is configured, clients can access BGAPP at:

- **Main Application**: https://app.maredatum.pt
- **Admin Dashboard**: https://admin.maredatum.pt
- **API Documentation**: https://api.maredatum.pt/docs
- **Geospatial API**: https://stac.maredatum.pt
- **System Status**: https://workflow.maredatum.pt/services

### 🔧 Development URLs (Cloudflare Workers)

For development and testing:

- **Main Application**: https://bgapp-frontend.pages.dev
- **Admin Dashboard**: https://bgapp-admin.pages.dev
- **API Documentation**: https://bgapp-api.majearcasa.workers.dev/docs
- **Geospatial API**: https://bgapp-stac.majearcasa.workers.dev
- **System Status**: https://bgapp-workflow.majearcasa.workers.dev/services

### 📊 System Information

- **Company**: MareDatum Consultoria e Gestão de Projectos Unipessoal LDA
- **System**: BGAPP - Sistema de Gestão Geoespacial
- **Version**: 1.0.0
- **Status**: Online and Operational
- **Support**: info@maredatum.pt

### 🔐 Authentication

BGAPP uses enterprise-grade authentication via Keycloak:
- **Auth Service**: https://auth.maredatum.pt
- **Protocol**: OAuth2/OIDC
- **Security**: Enterprise-grade with role-based access control

### 📈 Monitoring

Real-time system monitoring available at:
- **Status Page**: https://workflow.maredatum.pt/services
- **Health Checks**: Automatic monitoring of all services
- **Uptime**: 99.9% SLA

### 🆘 Support

For technical support or questions:
- **Email**: info@maredatum.pt
- **Website**: https://maredatum.pt
- **Response Time**: 24/7 support available

### 📋 API Endpoints

#### Main API
- **Base URL**: https://api.maredatum.pt
- **Documentation**: https://api.maredatum.pt/docs
- **Authentication**: Bearer token required

#### STAC API (Geospatial)
- **Base URL**: https://stac.maredatum.pt
- **Format**: JSON
- **Standards**: STAC 1.0.0 compliant

#### PyGeoAPI
- **Base URL**: https://geoapi.maredatum.pt
- **Purpose**: Advanced geospatial processing

### 🔄 Updates

BGAPP is continuously updated with new features and improvements.
All updates are deployed automatically with zero downtime.

### 📞 Contact

**MareDatum Consultoria e Gestão de Projectos Unipessoal LDA**
- Email: info@maredatum.pt
- Website: https://maredatum.pt
- Specialized in: Marine data management and geospatial analysis
EOF

print_success "Client access guide created: CLIENT_ACCESS_GUIDE.md"

# 7. Create deployment status checker
print_status "Creating deployment status checker..."

cat > "check-deployment-status.sh" << 'EOF'
#!/bin/bash

echo "🔍 BGAPP Deployment Status Check"
echo "================================"

# Check Cloudflare Workers
echo "Checking Cloudflare Workers..."
wrangler list

echo ""
echo "Checking Cloudflare Pages..."
wrangler pages project list

echo ""
echo "Testing service endpoints..."

SERVICES=(
    "https://bgapp-frontend.pages.dev"
    "https://bgapp-admin.pages.dev"
    "https://bgapp-api.majearcasa.workers.dev"
    "https://bgapp-stac.majearcasa.workers.dev"
    "https://bgapp-geoapi.majearcasa.workers.dev"
    "https://bgapp-browser.majearcasa.workers.dev"
    "https://bgapp-auth.majearcasa.workers.dev"
    "https://bgapp-monitor.majearcasa.workers.dev"
    "https://bgapp-workflow.majearcasa.workers.dev"
)

for service in "${SERVICES[@]}"; do
    echo -n "Testing $service... "
    if curl -s -I "$service" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
done

echo ""
echo "🎉 Deployment status check complete!"
EOF

chmod +x check-deployment-status.sh
print_success "Deployment status checker created: check-deployment-status.sh"

# Final summary
echo ""
echo "🌐 Custom Domain Setup Complete!"
echo "==============================="
echo ""
print_success "Configuration files created:"
echo ""
echo "📋 dns-config.md              - DNS configuration instructions"
echo "🔒 verify-ssl.sh              - SSL certificate verification"
echo "📖 CLIENT_ACCESS_GUIDE.md     - Client access documentation"
echo "🔍 check-deployment-status.sh - Deployment status checker"
echo ""
print_warning "Next steps:"
echo "1. Configure DNS records as specified in dns-config.md"
echo "2. Wait for DNS propagation (5-15 minutes)"
echo "3. Run ./verify-ssl.sh to verify SSL certificates"
echo "4. Test all endpoints with clients"
echo "5. Share CLIENT_ACCESS_GUIDE.md with clients"
echo ""
print_success "BGAPP custom domain setup ready! 🚀"
echo ""
