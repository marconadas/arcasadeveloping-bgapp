#!/bin/bash
# Configure GFW API Token for Cloudflare Worker

echo "🎣 Configuring Global Fishing Watch API Token"
echo "==========================================="

# GFW API Token
export GFW_API_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJCR0FQUCIsInVzZXJJZCI6NTA0NzEsImFwcGxpY2F0aW9uTmFtZSI6IkJHQVBQIiwiaWQiOjMyNzMsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTc1Nzk2MTc5MCwiZXhwIjoyMDczMzIxNzkwLCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.exNtfPb4WFo3qp-qmCUBQUXDch5Q70Xxp4EB672VZU-YnaxlXuVXTS7mTLC798yzYmnaTPdI-UfvTl5jNNMiyP591jXUy7eYH2pZc_c4SZQIeyiMlmDuLgf30CCEcpEy3yVdVv2NJBd985U8yYfH2SWoinZxUCFhi64OuDA7GF2eq8Y5t2Pf-QzNVqA4lLxebrn8meN2gptRVKpMAL9ovLfYuJfCICkiGhboGBI4gvPnkjPpZs3J3Fpar_sDmXODiaP6Ojx5scdN8gtcexYX4TO8WjeuRt_Zv_kGXbBMyitmHzspQDPsNcVmhhZQBGH5P3E2cViKGqCPNoed8Gotr0QBrna11EI21pKuW9cixNneTLRlDY0tB-4LkTSqfmAP41KCuCKrLfOUsBO5etfv-G-y-XVhOgyrFjxrKCDh2MMIv4AkNXYi66e8_eclii8r2g8rE3gVhQn_865PwboyPqT34qBYDIxwP0SPsmrRQ6oq6Z1kVFRfDZMrqR_luQlV"

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

