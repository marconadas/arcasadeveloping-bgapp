#!/bin/bash

# 🌊 Deploy do BGAPP STAC Oceanographic Worker
# Script para deploy do worker no Cloudflare

echo "🚀 Iniciando deploy do BGAPP STAC Oceanographic Worker..."

# Verificar se está no diretório correto
if [ ! -f "workers/stac-oceanographic-worker.js" ]; then
    echo "❌ Erro: Arquivo worker não encontrado. Execute o script do diretório raiz do projeto."
    exit 1
fi

# Navegar para o diretório dos workers
cd workers

echo "📦 Fazendo deploy do worker..."
wrangler deploy stac-oceanographic-worker.js --config wrangler-stac-oceanographic.toml

if [ $? -eq 0 ]; then
    echo "✅ Worker deployado com sucesso!"
    echo "🌐 URL: https://bgapp-stac-oceanographic.majearcasa.workers.dev"
    echo ""
    echo "🧪 Testando endpoints..."
    
    # Testar health check
    echo "Testando /health..."
    curl -s "https://bgapp-stac-oceanographic.majearcasa.workers.dev/health" | jq .
    
    echo ""
    echo "Testando /stac/collections/summary..."
    curl -s "https://bgapp-stac-oceanographic.majearcasa.workers.dev/stac/collections/summary" | jq .
    
    echo ""
    echo "✅ Deploy concluído com sucesso!"
else
    echo "❌ Erro durante o deploy"
    exit 1
fi

cd ..
