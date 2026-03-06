#!/bin/bash
# Update existing GFW secret in Cloudflare Worker

echo "🔄 Updating GFW API Token Secret"
echo "================================"

# GFW API Token
GFW_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJCR0FQUCIsInVzZXJJZCI6NTA0NzEsImFwcGxpY2F0aW9uTmFtZSI6IkJHQVBQIiwiaWQiOjMyNzMsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTc1Nzk2MTc5MCwiZXhwIjoyMDczMzIxNzkwLCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.exNtfPb4WFo3qp-qmCUBQUXDch5Q70Xxp4EB672VZU-YnaxlXuVXTS7mTLC798yzYmnaTPdI-UfvTl5jNNMiyP591jXUy7eYH2pZc_c4SZQIeyiMlmDuLgf30CCEcpEy3yVdVv2NJBd985U8yYfH2SWoinZxUCFhi64OuDA7GF2eq8Y5t2Pf-QzNVqA4lLxebrn8meN2gptRVKpMAL9ovLfYuJfCICkiGhboGBI4gvPnkjPpZs3J3Fpar_sDmXODiaP6Ojx5scdN8gtcexYX4TO8WjeuRt_Zv_kGXbBMyitmHzspQDPsNcVmhhZQBGH5P3E2cViKGqCPNoed8Gotr0QBrna11EI21pKuW9cixNneTLRlDY0tB-4LkTSqfmAP41KCuCKrLfOUsBO5etfv-G-y-XVhOgyrFjxrKCDh2MMIv4AkNXYi66e8_eclii8r2g8rE3gVhQn_865PwboyPqT34qBYDIxwP0SPsmrRQ6oq6Z1kVFRfDZMrqR_luQlV"

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
