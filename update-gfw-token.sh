#!/bin/bash
# Update GFW API Token for Cloudflare Worker

echo "🎣 Updating Global Fishing Watch API Token"
echo "=========================================="

# GFW API Token
export GFW_API_TOKEN="***REMOVED***"

echo "📝 Updating Cloudflare Worker secret..."
echo ""

cd workers

# Delete and recreate the secret
echo "1️⃣ Deleting existing GFW_API_TOKEN..."
wrangler secret delete GFW_API_TOKEN --env production

echo ""
echo "2️⃣ Adding new GFW_API_TOKEN..."
echo "$GFW_API_TOKEN" | wrangler secret put GFW_API_TOKEN --env production

echo ""
echo "3️⃣ Redeploying worker with updated secret..."
wrangler deploy --env production

echo ""
echo "✅ GFW Token updated and worker redeployed!"
echo ""

# Test the endpoint
echo "4️⃣ Testing GFW vessel-presence endpoint..."
echo ""
curl -s https://bgapp-api-worker.majearcasa.workers.dev/api/gfw/vessel-presence | jq '.' || echo "Failed to parse response"

echo ""
echo "🎉 Update complete!"
