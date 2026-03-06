#!/bin/bash
# 🎣 Script para configurar variáveis de ambiente GFW no Cloudflare Worker

echo "🔧 Configurando variáveis de ambiente para Global Fishing Watch..."

# Token GFW
export GFW_API_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJCR0FQUCIsInVzZXJJZCI6NTA0NzEsImFwcGxpY2F0aW9uTmFtZSI6IkJHQVBQIiwiaWQiOjMyNzMsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTc1Nzk2MTc5MCwiZXhwIjoyMDczMzIxNzkwLCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.exNtfPb4WFo3qp-qmCUBQUXDch5Q70Xxp4EB672VZU-YnaxlXuVXTS7mTLC798yzYmnaTPdI-UfvTl5jNNMiyP591jXUy7eYH2pZc_c4SZQIeyiMlmDuLgf30CCEcpEy3yVdVv2NJBd985U8yYfH2SWoinZxUCFhi64OuDA7GF2eq8Y5t2Pf-QzNVqA4lLxebrn8meN2gptRVKpMAL9ovLfYuJfCICkiGhboGBI4gvPnkjPpZs3J3Fpar_sDmXODiaP6Ojx5scdN8gtcexYX4TO8WjeuRt_Zv_kGXbBMyitmHzspQDPsNcVmhhZQBGH5P3E2cViKGqCPNoed8Gotr0QBrna11EI21pKuW9cixNneTLRlDY0tB-4LkTSqfmAP41KCuCKrLfOUsBO5etfv-G-y-XVhOgyrFjxrKCDh2MMIv4AkNXYi66e8_eclii8r2g8rE3gVhQn_865PwboyPqT34qBYDIxwP0SPsmrRQ6oq6Z1kVFRfDZMrqR_luQlV"

# Chave de acesso administrativa (gerar uma nova para produção)
export ADMIN_ACCESS_KEY="bgapp-admin-$(date +%s)-$(openssl rand -hex 16)"

echo "📝 Variáveis configuradas:"
echo "   - GFW_API_TOKEN: [CONFIGURADO]"
echo "   - ADMIN_ACCESS_KEY: $ADMIN_ACCESS_KEY"

# Criar arquivo .env para wrangler
cat > infrastructure/workers/.env.production << EOF
GFW_API_TOKEN=$GFW_API_TOKEN
ADMIN_ACCESS_KEY=$ADMIN_ACCESS_KEY
EOF

echo ""
echo "✅ Arquivo .env.production criado em infrastructure/workers/"
echo ""
echo "📋 Próximos passos:"
echo "   1. cd workers && npx wrangler deploy --env production"
echo "   2. As variáveis serão automaticamente carregadas do .env.production"
echo ""
echo "🔐 IMPORTANTE: Guarde a ADMIN_ACCESS_KEY para uso futuro:"
echo "   $ADMIN_ACCESS_KEY"
