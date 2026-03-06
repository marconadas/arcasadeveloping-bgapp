#!/bin/bash
# Generate GFW cache data manually

echo "🎣 Generating GFW Cache Data"
echo "==========================="

# GFW API Token
GFW_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJCR0FQUCIsInVzZXJJZCI6NTA0NzEsImFwcGxpY2F0aW9uTmFtZSI6IkJHQVBQIiwiaWQiOjMyNzMsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTc1Nzk2MTc5MCwiZXhwIjoyMDczMzIxNzkwLCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.exNtfPb4WFo3qp-qmCUBQUXDch5Q70Xxp4EB672VZU-YnaxlXuVXTS7mTLC798yzYmnaTPdI-UfvTl5jNNMiyP591jXUy7eYH2pZc_c4SZQIeyiMlmDuLgf30CCEcpEy3yVdVv2NJBd985U8yYfH2SWoinZxUCFhi64OuDA7GF2eq8Y5t2Pf-QzNVqA4lLxebrn8meN2gptRVKpMAL9ovLfYuJfCICkiGhboGBI4gvPnkjPpZs3J3Fpar_sDmXODiaP6Ojx5scdN8gtcexYX4TO8WjeuRt_Zv_kGXbBMyitmHzspQDPsNcVmhhZQBGH5P3E2cViKGqCPNoed8Gotr0QBrna11EI21pKuW9cixNneTLRlDY0tB-4LkTSqfmAP41KCuCKrLfOUsBO5etfv-G-y-XVhOgyrFjxrKCDh2MMIv4AkNXYi66e8_eclii8r2g8rE3gVhQn_865PwboyPqT34qBYDIxwP0SPsmrRQ6oq6Z1kVFRfDZMrqR_luQlV"

# Create data directory
mkdir -p infra/frontend/data

# For now, create a simulated cache file with realistic data
echo "Creating simulated cache data..."

cat > infra/frontend/data/gfw-angola-vessels-cache.json << EOF
{
  "last_updated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [12.5, -10.5]
        },
        "properties": {
          "vessel_count": 15,
          "hours": 180.5,
          "grid_id": "1"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [11.8, -11.2]
        },
        "properties": {
          "vessel_count": 12,
          "hours": 144.2,
          "grid_id": "2"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [13.2, -9.8]
        },
        "properties": {
          "vessel_count": 8,
          "hours": 96.7,
          "grid_id": "3"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [12.0, -12.5]
        },
        "properties": {
          "vessel_count": 10,
          "hours": 120.0,
          "grid_id": "4"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [14.0, -8.5]
        },
        "properties": {
          "vessel_count": 7,
          "hours": 84.3,
          "grid_id": "5"
        }
      }
    ]
  }
}
EOF

echo "✅ Cache file created at: infra/frontend/data/gfw-angola-vessels-cache.json"
echo ""
echo "📊 Summary:"
echo "  • Total vessels: 52"
echo "  • Total hours: 625.7"
echo "  • Grid cells: 5"
echo ""
echo "🚀 Next steps:"
echo "  1. Commit and push this file to deploy it"
echo "  2. The worker will automatically use this cache"
echo "  3. GitHub Action will update it every 6 hours"
