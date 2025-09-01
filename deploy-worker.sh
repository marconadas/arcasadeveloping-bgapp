#!/bin/bash

# Deploy BGAPP API Worker
# Este script faz o deploy do Cloudflare Worker para APIs serverless

echo "🚀 Iniciando deploy do BGAPP API Worker..."

# Navegar para o diretório dos workers
cd workers

echo "📦 Fazendo deploy do Worker..."

# Deploy do worker
npx wrangler deploy api-worker.js --name bgapp-api-worker --compatibility-date 2024-01-01

echo "🔧 Configurando rotas..."

# Configurar rotas (manual via dashboard ou API)
echo "📝 Rotas a configurar manualmente no dashboard:"
echo "   - bgapp-arcasadeveloping.pages.dev/api/*"
echo "   - *.bgapp-arcasadeveloping.pages.dev/api/*"

echo "✅ Deploy do Worker concluído!"
echo "🌐 Worker disponível em: https://bgapp-api-worker.your-subdomain.workers.dev"

# Voltar ao diretório raiz
cd ..

echo "📋 Próximos passos:"
echo "1. Configurar rotas no Cloudflare Dashboard"
echo "2. Configurar KV Namespaces se necessário"
echo "3. Testar endpoints: /api/health, /api/services/status"
echo "4. Configurar Cloudflare Access se desejado"
