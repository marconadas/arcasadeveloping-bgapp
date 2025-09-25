#!/bin/bash

# Script para configurar credenciais Copernicus em produção
# Resolve o erro "No authentication token"

set -e

echo "🔐 Configuração de Credenciais Copernicus para Produção"
echo "====================================================="
echo ""
echo "Este script irá configurar as credenciais nos workers para"
echo "resolver o erro 'No authentication token' no dashboard."
echo ""

# Verificar se wrangler está disponível
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI não encontrado"
    echo "Instale com: npm install -g wrangler"
    exit 1
fi

# Verificar se está logado
echo "🔍 Verificando login no Cloudflare..."
if ! wrangler whoami &>/dev/null; then
    echo "❌ Não está logado no Cloudflare"
    echo "Execute: wrangler login"
    exit 1
fi

echo "✅ Logado no Cloudflare"
echo ""

# Solicitar credenciais
echo "📋 Configure suas credenciais do Copernicus Data Space Ecosystem:"
echo "   (Registre-se em: https://dataspace.copernicus.eu/)"
echo ""

read -p "📧 Username (email): " copernicus_username
if [ -z "$copernicus_username" ]; then
    echo "❌ Username é obrigatório"
    exit 1
fi

read -s -p "🔒 Password: " copernicus_password
echo ""
if [ -z "$copernicus_password" ]; then
    echo "❌ Password é obrigatório"
    exit 1
fi

echo ""
echo "🔧 Configurando credenciais nos workers..."

# Configurar no worker copernicus-official
echo "1️⃣ Configurando bgapp-copernicus-official..."
echo "$copernicus_username" | wrangler secret put COPERNICUS_USERNAME --name bgapp-copernicus-official
echo "$copernicus_password" | wrangler secret put COPERNICUS_PASSWORD --name bgapp-copernicus-official

# Configurar no worker api-worker-dev  
echo "2️⃣ Configurando bgapp-api-worker-dev..."
echo "$copernicus_username" | wrangler secret put COPERNICUS_USERNAME --name bgapp-api-worker-dev --env development
echo "$copernicus_password" | wrangler secret put COPERNICUS_PASSWORD --name bgapp-api-worker-dev --env development

echo ""
echo "✅ Credenciais configuradas com sucesso!"
echo ""

# Testar autenticação
echo "🧪 Testando autenticação..."
echo "Aguarde alguns segundos para as credenciais propagarem..."
sleep 10

echo ""
echo "Testando worker copernicus-official:"
curl -s "https://bgapp-copernicus-official.majearcasa.workers.dev/copernicus/angola-marine" | head -200
echo ""
echo ""

echo "Testando API worker:"
curl -s "https://bgapp-api-worker-dev.majearcasa.workers.dev/copernicus/angola-marine" | head -200
echo ""
echo ""

echo "🎉 CONFIGURAÇÃO COMPLETA!"
echo ""
echo "📋 Resultado esperado no dashboard:"
echo "• OData API: ONLINE (em vez de ERRO)"
echo "• STAC API: ONLINE (em vez de ERRO)"
echo "• OpenSearch API: ONLINE (já funcionava)"
echo "• Status: ONLINE (em vez de PARTIAL)"
echo ""
echo "🔄 Para ver as mudanças:"
echo "1. Aguarde 1-2 minutos para propagação"
echo "2. Recarregue: https://bgapp-admin.pages.dev/"
echo "3. Vá em Copernicus Integration"
echo "4. Deve mostrar tudo ONLINE!"
echo ""
echo "✨ Credenciais configuradas - sistema pronto para uso completo!"
