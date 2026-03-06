#!/bin/bash
# Complete GFW Integration Deployment Script
# This script handles the full deployment of GFW integration

set -e  # Exit on error

echo "🎣 Global Fishing Watch Integration - Complete Deployment"
echo "========================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: wrangler CLI not found${NC}"
    echo "Please install wrangler: npm install -g wrangler"
    exit 1
fi

# GFW API Token
GFW_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJCR0FQUCIsInVzZXJJZCI6NTA0NzEsImFwcGxpY2F0aW9uTmFtZSI6IkJHQVBQIiwiaWQiOjMyNzMsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTc1Nzk2MTc5MCwiZXhwIjoyMDczMzIxNzkwLCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.exNtfPb4WFo3qp-qmCUBQUXDch5Q70Xxp4EB672VZU-YnaxlXuVXTS7mTLC798yzYmnaTPdI-UfvTl5jNNMiyP591jXUy7eYH2pZc_c4SZQIeyiMlmDuLgf30CCEcpEy3yVdVv2NJBd985U8yYfH2SWoinZxUCFhi64OuDA7GF2eq8Y5t2Pf-QzNVqA4lLxebrn8meN2gptRVKpMAL9ovLfYuJfCICkiGhboGBI4gvPnkjPpZs3J3Fpar_sDmXODiaP6Ojx5scdN8gtcexYX4TO8WjeuRt_Zv_kGXbBMyitmHzspQDPsNcVmhhZQBGH5P3E2cViKGqCPNoed8Gotr0QBrna11EI21pKuW9cixNneTLRlDY0tB-4LkTSqfmAP41KCuCKrLfOUsBO5etfv-G-y-XVhOgyrFjxrKCDh2MMIv4AkNXYi66e8_eclii8r2g8rE3gVhQn_865PwboyPqT34qBYDIxwP0SPsmrRQ6oq6Z1kVFRfDZMrqR_luQlV"

# Generate admin key
ADMIN_KEY="bgapp-admin-$(date +%s)-$(openssl rand -hex 16)"

echo "📝 Step 1: Configuring Secrets"
echo "------------------------------"

cd workers

# Configure GFW Token
echo -e "${YELLOW}Setting GFW_API_TOKEN...${NC}"
echo "$GFW_TOKEN" | wrangler secret put GFW_API_TOKEN --env production 2>&1 | grep -v "password" || true

# Configure Admin Key  
echo -e "${YELLOW}Setting ADMIN_ACCESS_KEY...${NC}"
echo "$ADMIN_KEY" | wrangler secret put ADMIN_ACCESS_KEY --env production 2>&1 | grep -v "password" || true

echo -e "${GREEN}✅ Secrets configured${NC}"
echo ""

echo "🚀 Step 2: Deploying Worker"
echo "---------------------------"

# Deploy worker
echo -e "${YELLOW}Deploying bgapp-api-worker...${NC}"
wrangler deploy --env production

echo -e "${GREEN}✅ Worker deployed${NC}"
echo ""

echo "🧪 Step 3: Testing Endpoints"
echo "----------------------------"

WORKER_URL="https://bgapp-api-worker.majearcasa.workers.dev"

# Test GFW status
echo -n "Testing GFW status... "
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" $WORKER_URL/api/config/gfw-status)
if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Failed (HTTP $STATUS_CODE)${NC}"
fi

# Test realtime data
echo -n "Testing realtime data... "
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" $WORKER_URL/api/realtime/data)
if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Failed (HTTP $STATUS_CODE)${NC}"
fi

# Test vessel presence
echo -n "Testing vessel presence... "
RESPONSE=$(curl -s $WORKER_URL/api/gfw/vessel-presence)
if echo "$RESPONSE" | grep -q "vessel_count"; then
    echo -e "${GREEN}✅ OK${NC}"
    echo "  Response: $RESPONSE"
else
    echo -e "${RED}❌ Failed${NC}"
    echo "  Response: $RESPONSE"
fi

echo ""
echo "📊 Step 4: Summary"
echo "------------------"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "🌐 Live URLs:"
echo "  • Frontend: https://bgapp-frontend.pages.dev/realtime_angola.html"
echo "  • Worker API: $WORKER_URL"
echo ""
echo "🔑 Admin Access Key (save this!):"
echo "  $ADMIN_KEY"
echo ""
echo "📝 Next Steps:"
echo "  1. Open the frontend URL to see the live dashboard"
echo "  2. Check that vessel count shows real data (not 0)"
echo "  3. Monitor worker logs in Cloudflare dashboard"
echo ""
echo "💡 Troubleshooting:"
echo "  • If vessel count is 0, check worker logs"
echo "  • If errors, verify token in Cloudflare dashboard"
echo "  • See GFW_DEPLOYMENT_GUIDE.md for details"
