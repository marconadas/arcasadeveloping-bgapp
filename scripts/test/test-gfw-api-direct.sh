#!/bin/bash
# Test GFW API directly to debug the issue

echo "🧪 Testing GFW API Directly"
echo "=========================="

# Get the token from worker status
echo "1️⃣ Getting token from worker..."
TOKEN=$(curl -s https://bgapp-api-worker.majearcasa.workers.dev/api/config/gfw-token \
  -H "Origin: https://bgapp-frontend.pages.dev" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token from worker"
  exit 1
fi

echo "✅ Token retrieved (length: ${#TOKEN})"
echo ""

# Test different API endpoints
echo "2️⃣ Testing GFW API endpoints..."
echo "--------------------------------"

# Test 1: Basic health check
echo -n "API Health: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.globalfishingwatch.org/v3/)
echo "HTTP $STATUS"

# Test 2: Simple vessels endpoint
echo -n "Vessels endpoint: "
VESSELS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  https://api.globalfishingwatch.org/v3/vessels)
echo "HTTP $VESSELS_STATUS"

# Test 3: 4wings with corrected parameters
echo ""
echo "3️⃣ Testing 4wings aggregate with different formats..."
echo "----------------------------------------------------"

# Format 1: Without spaces in bbox
echo "Test 1 - bbox without spaces:"
curl -s -X GET "https://api.globalfishingwatch.org/v3/4wings/aggregate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  -G \
  --data-urlencode "dataset=public-global-fishing-activity:v20231026" \
  --data-urlencode "start-date=$(date -v-1d +%Y-%m-%d)" \
  --data-urlencode "end-date=$(date +%Y-%m-%d)" \
  --data-urlencode "bbox=-12,-18,17.5,-4.2" \
  --data-urlencode "format=json" \
  -w "\nHTTP Status: %{http_code}\n" | tail -n 20

echo ""
echo "Test 2 - bbox with spaces:"
curl -s -X GET "https://api.globalfishingwatch.org/v3/4wings/aggregate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  -G \
  --data-urlencode "dataset=public-global-fishing-activity:v20231026" \
  --data-urlencode "start-date=$(date -v-1d +%Y-%m-%d)" \
  --data-urlencode "end-date=$(date +%Y-%m-%d)" \
  --data-urlencode "bbox=-12, -18, 17.5, -4.2" \
  --data-urlencode "format=json" \
  -w "\nHTTP Status: %{http_code}\n" | tail -n 20

echo ""
echo "4️⃣ Testing simpler query (smaller area)..."
echo "-----------------------------------------"
curl -s -X GET "https://api.globalfishingwatch.org/v3/4wings/aggregate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  -G \
  --data-urlencode "dataset=public-global-fishing-activity:v20231026" \
  --data-urlencode "start-date=$(date -v-1d +%Y-%m-%d)" \
  --data-urlencode "end-date=$(date +%Y-%m-%d)" \
  --data-urlencode "bbox=11.6,-13.0,12.0,-12.5" \
  --data-urlencode "format=json" | jq '.' || echo "Failed to parse JSON"
