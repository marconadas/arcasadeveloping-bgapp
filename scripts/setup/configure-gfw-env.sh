#!/bin/bash
# 🎣 Script para configurar variáveis de ambiente GFW no Cloudflare Worker

echo "🔧 Configurando variáveis de ambiente para Global Fishing Watch..."

# Token GFW
export GFW_API_TOKEN="${GFW_API_TOKEN:?Set GFW_API_TOKEN in your environment}"

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
