#!/bin/bash
# Test script for GFW Realtime Angola Integration

echo "🎣 Testing GFW Realtime Angola Integration"
echo "=========================================="

# Test local Worker endpoints
echo -e "\n1️⃣ Testing Local Worker Endpoints"
echo "-----------------------------------"

# Test realtime data aggregation
echo -n "📊 Testing /api/realtime/data... "
curl -s -w "\n%{http_code}" http://localhost:8787/api/realtime/data | tail -n1

# Test GFW vessel presence
echo -n "🚢 Testing /api/gfw/vessel-presence... "
curl -s -w "\n%{http_code}" http://localhost:8787/api/gfw/vessel-presence | tail -n1

# Test production Worker endpoints
echo -e "\n2️⃣ Testing Production Worker Endpoints"
echo "--------------------------------------"

WORKER_URL="https://bgapp-api-worker.majearcasa.workers.dev"

echo -n "📊 Testing production /api/realtime/data... "
curl -s -w "\n%{http_code}" $WORKER_URL/api/realtime/data | tail -n1

echo -n "🚢 Testing production /api/gfw/vessel-presence... "
curl -s -w "\n%{http_code}" $WORKER_URL/api/gfw/vessel-presence | tail -n1

# Test frontend integration
echo -e "\n3️⃣ Testing Frontend Integration"
echo "--------------------------------"

echo "📱 Open browser and check:"
echo "  • http://localhost:8085/realtime_angola.html"
echo "  • https://bgapp-frontend.pages.dev/realtime_angola.html"
echo ""
echo "✅ Check for:"
echo "  1. SST, Chlorophyll, Salinity values updating from Copernicus"
echo "  2. Embarcações Ativas showing real vessel count"
echo "  3. 🚢 Embarcações button toggles GFW vessel activity layer"
echo "  4. Console logs show 'GFW Integration inicializada'"
echo ""

# Summary
echo "📋 Integration Summary:"
echo "  • Worker: /api/realtime/data aggregates Copernicus JSON"
echo "  • Worker: /api/gfw/vessel-presence queries GFW v3 4Wings API"
echo "  • Frontend: realtime_angola.html loads gfw-integration.js"
echo "  • Frontend: KPIs wired to real data sources"
echo "  • Frontend: Map layers use GFW activity data"
