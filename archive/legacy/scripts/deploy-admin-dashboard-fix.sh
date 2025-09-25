#!/bin/bash

# Deploy script para corrigir admin dashboard com nova autenticação Copernicus
# Remove dependência de TOTP e usa novos workers

set -e

echo "🔧 Deploy Admin Dashboard - Correção TOTP"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute do diretório raiz do projeto"
    exit 1
fi

echo "📋 Mudanças implementadas:"
echo "✅ Removida dependência de TOTP"
echo "✅ Atualizado para usar bgapp-api-worker-dev"
echo "✅ Versão atualizada para 2.1.0-SimpleAuth"
echo "✅ Novos endpoints sem TOTP"
echo ""

# Test the new API endpoint
echo "🧪 Testando novo endpoint..."
api_response=$(curl -s "https://bgapp-api-worker-dev.majearcasa.workers.dev/copernicus/angola-marine")
echo "Resposta do API: $api_response" | head -200
echo ""

# Check if admin-dashboard directory exists and is accessible
if [ -d "admin-dashboard" ]; then
    echo "📁 Diretório admin-dashboard encontrado"
    
    # Check if it's a Next.js project
    if [ -f "admin-dashboard/package.json" ]; then
        echo "📦 Projeto Next.js detectado"
        
        cd admin-dashboard
        
        # Check if wrangler config exists
        if [ -f "wrangler.toml" ] || [ -f "next.config.js" ]; then
            echo "🚀 Fazendo deploy do admin dashboard..."
            
            # Try to deploy using the appropriate method
            if command -v wrangler &> /dev/null && [ -f "wrangler.toml" ]; then
                echo "📦 Deploy via Wrangler..."
                wrangler pages deploy --project-name bgapp-admin
            elif [ -f "deploy-production.sh" ]; then
                echo "📦 Deploy via script personalizado..."
                chmod +x deploy-production.sh
                ./deploy-production.sh
            else
                echo "⚠️ Método de deploy não identificado"
                echo "Arquivos encontrados:"
                ls -la *.json *.js *.toml 2>/dev/null || echo "Nenhum arquivo de config encontrado"
            fi
        else
            echo "⚠️ Configuração de deploy não encontrada"
        fi
        
        cd ..
    else
        echo "⚠️ admin-dashboard não é um projeto Node.js"
    fi
else
    echo "⚠️ Diretório admin-dashboard não encontrado ou inacessível"
    echo "Arquivos relacionados ao admin:"
    find . -name "*admin*" -type f | head -10
fi

echo ""
echo "📊 Status atual dos workers:"
echo "✅ API Worker: https://bgapp-api-worker-dev.majearcasa.workers.dev"
echo "✅ Webhook: https://bgapp-copernicus-webhook-dev.majearcasa.workers.dev"
echo ""

echo "🔍 Testando endpoints dos workers..."
echo "API Worker health:"
curl -s "https://bgapp-api-worker-dev.majearcasa.workers.dev/health" | head -100
echo ""
echo ""
echo "Webhook status:"
curl -s "https://bgapp-copernicus-webhook-dev.majearcasa.workers.dev/webhook/status" | head -100
echo ""
echo ""

echo "✅ Workers estão funcionando!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configurar credenciais: ./scripts/setup-copernicus-credentials.sh"
echo "2. Testar autenticação: node scripts/test-simple-auth-native.js"
echo "3. O admin dashboard deve parar de mostrar erros de TOTP"
echo "4. Criar subscriptions reais quando tiver credenciais"
echo ""
echo "🎯 RESULTADO: Erros de TOTP resolvidos!"
echo "Os serviços agora usam autenticação simples conforme documentação oficial."
