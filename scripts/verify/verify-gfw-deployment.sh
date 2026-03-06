#!/bin/bash
# Quick verification script for GFW deployment

echo "🎣 Verifying GFW Integration Deployment"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

WORKER_URL="https://bgapp-api-worker.majearcasa.workers.dev"

echo "1️⃣ Checking GFW Configuration Status"
echo "------------------------------------"
echo -n "API Status: "
STATUS=$(curl -s $WORKER_URL/api/config/gfw-status | jq -r '.status' 2>/dev/null || echo "error")
if [ "$STATUS" = "active" ]; then
    echo -e "${GREEN}✅ Active${NC}"
else
    echo -e "${RED}❌ Not Active${NC}"
fi

echo -n "Token Configured: "
TOKEN_STATUS=$(curl -s $WORKER_URL/api/config/gfw-status | jq -r '.token_configured' 2>/dev/null || echo "false")
if [ "$TOKEN_STATUS" = "true" ]; then
    echo -e "${GREEN}✅ Yes${NC}"
else
    echo -e "${RED}❌ No${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Token not configured! Run ./deploy-gfw-complete.sh to configure${NC}"
fi

echo ""
echo "2️⃣ Testing API Endpoints"
echo "-----------------------"

# Test realtime data
echo -n "Copernicus Data: "
TEMP=$(curl -s $WORKER_URL/api/realtime/data | jq -r '.temperature' 2>/dev/null)
if [ ! -z "$TEMP" ] && [ "$TEMP" != "null" ]; then
    echo -e "${GREEN}✅ Working (Temp: ${TEMP}°C)${NC}"
else
    echo -e "${RED}❌ Not Working${NC}"
fi

# Test vessel presence
echo -n "Vessel Presence: "
VESSELS=$(curl -s $WORKER_URL/api/gfw/vessel-presence | jq -r '.vessel_count' 2>/dev/null)
ERROR=$(curl -s $WORKER_URL/api/gfw/vessel-presence | jq -r '.error' 2>/dev/null)

if [ ! -z "$ERROR" ] && [ "$ERROR" != "null" ]; then
    echo -e "${RED}❌ Error: $ERROR${NC}"
elif [ ! -z "$VESSELS" ] && [ "$VESSELS" != "null" ]; then
    echo -e "${GREEN}✅ Working (${VESSELS} vessels)${NC}"
else
    echo -e "${RED}❌ Not Working${NC}"
fi

echo ""
echo "3️⃣ Frontend Integration Check"
echo "-----------------------------"
echo "Visit: https://bgapp-frontend.pages.dev/realtime_angola.html"
echo ""
echo "Look for:"
echo "  • 🌡️ Temperature, salinity, chlorophyll values"
echo "  • 🚢 Vessel count in 'Embarcações Ativas' card"
echo "  • 🗺️ Map with vessel activity layer (click 🚢 button)"
echo ""

# Summary
echo "📊 Summary"
echo "----------"
if [ "$TOKEN_STATUS" = "true" ] && [ ! -z "$VESSELS" ] && [ "$VESSELS" != "null" ]; then
    echo -e "${GREEN}✅ GFW Integration is fully operational!${NC}"
    echo ""
    echo "Vessel data from last 24 hours:"
    curl -s $WORKER_URL/api/gfw/vessel-presence | jq '.'
else
    echo -e "${YELLOW}⚠️  GFW Integration needs configuration${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: ./deploy-gfw-complete.sh"
    echo "2. Or manually configure token in Cloudflare dashboard"
    echo "3. See GFW_DEPLOYMENT_GUIDE.md for details"
fi
