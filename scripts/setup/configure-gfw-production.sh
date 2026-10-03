#!/bin/bash
# Configure GFW API Token for Cloudflare Worker

echo "🎣 Configuring Global Fishing Watch API Token"
echo "==========================================="

# GFW API Token
export GFW_API_TOKEN="${GFW_API_TOKEN:?Set GFW_API_TOKEN in your environment}"

# Generate admin access key
export ADMIN_ACCESS_KEY="bgapp-admin-$(date +%s)-$(openssl rand -hex 16)"

echo "📝 Setting up Cloudflare Worker secrets..."
echo ""

# Add secrets to Cloudflare Worker
cd workers

echo "1️⃣ Adding GFW_API_TOKEN..."
echo "$GFW_API_TOKEN" | wrangler secret put GFW_API_TOKEN --env production

echo ""
echo "2️⃣ Adding ADMIN_ACCESS_KEY..."
echo "$ADMIN_ACCESS_KEY" | wrangler secret put ADMIN_ACCESS_KEY --env production

echo ""
echo "✅ Secrets configured!"
echo ""
echo "📋 Summary:"
echo "  • GFW_API_TOKEN: Configured (valid until 2033)"
echo "  • ADMIN_ACCESS_KEY: $ADMIN_ACCESS_KEY"
echo ""
echo "🚀 Next steps:"
echo "  1. Deploy the worker: wrangler deploy --env production"
echo "  2. Test the endpoint: curl https://bgapp-api-worker.majearcasa.workers.dev/api/gfw/vessel-presence"
echo ""
echo "⚠️  IMPORTANT: Save the ADMIN_ACCESS_KEY in a secure location!"

