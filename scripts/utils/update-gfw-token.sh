#!/bin/bash
# Update GFW API Token for Cloudflare Worker

echo "🎣 Updating Global Fishing Watch API Token"
echo "=========================================="

# GFW API Token
export GFW_API_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJCR0FQUCIsInVzZXJJZCI6NTA0NzEsImFwcGxpY2F0aW9uTmFtZSI6IkJHQVBQIiwiaWQiOjMyNzMsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTc1Nzk2MTc5MCwiZXhwIjoyMDczMzIxNzkwLCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.exNtfPb4WFo3qp-qmCUBQUXDch5Q70Xxp4EB672VZU-YnaxlXuVXTS7mTLC798yzYmnaTPdI-UfvTl5jNNMiyP591jXUy7eYH2pZc_c4SZQIeyiMlmDuLgf30CCEcpEy3yVdVv2NJBd985U8yYfH2SWoinZxUCFhi64OuDA7GF2eq8Y5t2Pf-QzNVqA4lLxebrn8meN2gptRVKpMAL9ovLfYuJfCICkiGhboGBI4gvPnkjPpZs3J3Fpar_sDmXODiaP6Ojx5scdN8gtcexYX4TO8WjeuRt_Zv_kGXbBMyitmHzspQDPsNcVmhhZQBGH5P3E2cViKGqCPNoed8Gotr0QBrna11EI21pKuW9cixNneTLRlDY0tB-4LkTSqfmAP41KCuCKrLfOUsBO5etfv-G-y-XVhOgyrFjxrKCDh2MMIv4AkNXYi66e8_eclii8r2g8rE3gVhQn_865PwboyPqT34qBYDIxwP0SPsmrRQ6oq6Z1kVFRfDZMrqR_luQlV"

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

