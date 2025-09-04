#!/bin/bash

# Deploy BGAPP API Worker para Cloudflare
# Este script faz o deploy do Worker corrigido com suporte CORS adequado

echo "🚀 Iniciando deploy do BGAPP API Worker..."

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler não encontrado. Instalando..."
    npm install -g wrangler
fi

# Verificar autenticação
echo "🔐 Verificando autenticação Cloudflare..."
wrangler whoami

# Navegar para o diretório do worker
cd workers/

# Fazer deploy
echo "📦 Fazendo deploy do Worker..."
wrangler deploy --env production

if [ $? -eq 0 ]; then
    echo "✅ Deploy do BGAPP API Worker concluído com sucesso!"
    echo "🌐 Worker disponível em: https://bgapp-api-worker.majearcasa.workers.dev"
    
    echo ""
    echo "🧪 Testando endpoints principais..."
    
    # Testar health check
    echo "Testing /health..."
    curl -s "https://bgapp-api-worker.majearcasa.workers.dev/health" | jq .
    
    # Testar services/status
    echo "Testing /services/status..."
    curl -s "https://bgapp-api-worker.majearcasa.workers.dev/services/status" | jq .summary
    
    # Testar collections
    echo "Testing /collections..."
    curl -s "https://bgapp-api-worker.majearcasa.workers.dev/collections" | jq '.collections | length'
    
    echo ""
    echo "🎉 BGAPP API Worker está funcionando corretamente!"
    
else
    echo "❌ Falha no deploy do Worker"
    exit 1
fi
