#!/bin/bash

###############################################################################
# Deploy Script: D1 Integration for Realtime Angola
# Este script automatiza o deploy completo da integração D1
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored messages
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "========================================================================="
echo "    D1 Integration Deployment for Realtime Angola"
echo "========================================================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "wrangler CLI not found. Please install it first:"
    echo "  npm install -g wrangler"
    exit 1
fi

print_success "wrangler CLI found"

# Navigate to workers directory
cd infrastructure/workers

# Step 1: Apply Enhanced Schema
print_step "Step 1/6: Applying Enhanced Schema to D1..."
echo "This will add quality columns and indexes to your D1 database."
read -p "Apply schema? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler d1 execute bgapp-data --file=schema-enhanced.sql || {
        print_warning "Schema application had some errors (this is OK if columns already exist)"
    }
    print_success "Schema applied"
else
    print_warning "Schema application skipped"
fi

# Step 2: Deploy Diagnostic Worker
print_step "Step 2/6: Deploying Diagnostic Worker..."
wrangler deploy --config diagnose-d1-data.toml
print_success "Diagnostic worker deployed"

# Step 3: Deploy NASA Populator
print_step "Step 3/6: Deploying NASA Data Populator (Enhanced)..."
wrangler deploy --config nasa-data-populator.toml
print_success "NASA populator deployed"

# Step 4: Deploy Copernicus Populator
print_step "Step 4/6: Deploying Copernicus Data Populator..."

# Check if secrets are set
read -p "Have you set COPERNICUS_USERNAME and COPERNICUS_PASSWORD secrets? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "You'll need to set Copernicus secrets later:"
    echo "  wrangler secret put COPERNICUS_USERNAME --config copernicus-data-populator.toml"
    echo "  wrangler secret put COPERNICUS_PASSWORD --config copernicus-data-populator.toml"
fi

wrangler deploy --config copernicus-data-populator.toml
print_success "Copernicus populator deployed"

# Step 5: Deploy bgapp-api-worker
print_step "Step 5/6: Deploying bgapp-api-worker (Optimized)..."
wrangler deploy --config bgapp-api-worker.toml
print_success "bgapp-api-worker deployed"

# Step 6: Run Diagnostic
print_step "Step 6/6: Running Diagnostic..."
echo "Checking current state of D1 database..."
curl -s https://diagnose-d1-data.majearcasa.workers.dev/diagnose | jq '.summary'
print_success "Diagnostic complete"

echo ""
echo "========================================================================="
echo "  Deployment Complete!"
echo "========================================================================="
echo ""

# Check if data needs to be populated
echo "Checking if data population is needed..."
COUNT=$(curl -s https://diagnose-d1-data.majearcasa.workers.dev/diagnose | jq '.summary.total_records')

if [ "$COUNT" -eq 0 ] || [ "$COUNT" -lt 1000 ]; then
    print_warning "Database has $COUNT records. Population recommended!"
    echo ""
    echo "To populate with high-quality data, run:"
    echo ""
    echo "  ${GREEN}# Populate NASA data (2000+ SST, 2000+ Ocean Color, 1500+ Salinity)${NC}"
    echo "  curl -X POST https://nasa-data-populator.majearcasa.workers.dev/populate \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"dataTypes\": \"all\"}'"
    echo ""
    echo "  ${GREEN}# Populate Copernicus data (complementary 1500+ points)${NC}"
    echo "  curl -X POST https://copernicus-data-populator.majearcasa.workers.dev/populate \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"dataTypes\": \"all\"}'"
    echo ""
    echo "Or use the population script:"
    echo "  ./populate-initial-data.sh"
    echo ""
else
    print_success "Database has $COUNT records. Looks good!"
fi

# Show useful commands
echo ""
echo "========================================================================="
echo "  Useful Commands"
echo "========================================================================="
echo ""
echo "Check population status:"
echo "  curl https://nasa-data-populator.majearcasa.workers.dev/status | jq"
echo ""
echo "Test API worker:"
echo "  curl 'https://bgapp-api-worker.majearcasa.workers.dev/api/oceanographic?type=sst&limit=5' | jq"
echo ""
echo "Run diagnostic again:"
echo "  curl https://diagnose-d1-data.majearcasa.workers.dev/diagnose | jq"
echo ""
echo "Clear old data (>48h):"
echo "  curl -X POST https://nasa-data-populator.majearcasa.workers.dev/clear-old"
echo ""
echo "For detailed instructions, see: REALTIME-ANGOLA-D1-INTEGRATION-SUMMARY.md"
echo ""

