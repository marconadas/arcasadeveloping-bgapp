#!/bin/bash
# Update existing GFW secret in Cloudflare Worker

echo "🔄 Updating GFW API Token Secret"
echo "================================"

# GFW API Token
GFW_TOKEN="***REMOVED***"

cd workers

echo "🗑️  Deleting existing GFW_API_TOKEN secret..."
wrangler secret delete GFW_API_TOKEN --env production -f 2>&1 | grep -v "password" || true

echo ""
echo "➕ Adding new GFW_API_TOKEN secret..."
echo "$GFW_TOKEN" | wrangler secret put GFW_API_TOKEN --env production 2>&1 | grep -v "password"

echo ""
echo "✅ Secret updated! Testing..."
echo ""

# Wait a moment for propagation
sleep 3

# Test the endpoint
WORKER_URL="https://bgapp-api-worker.majearcasa.workers.dev"
echo "🧪 Testing vessel presence endpoint..."
RESPONSE=$(curl -s $WORKER_URL/api/gfw/vessel-presence)
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "vessel_count"; then
    echo ""
    echo "✅ Success! GFW integration is now working!"
    echo ""
    echo "Vessel data:"
    echo "$RESPONSE" | jq '.'
else
    echo ""
    echo "⚠️  Still not working. You may need to:"
    echo "1. Wait a few more seconds for propagation"
    echo "2. Check the Cloudflare dashboard manually"
    echo "3. View worker logs for detailed errors"
fi
