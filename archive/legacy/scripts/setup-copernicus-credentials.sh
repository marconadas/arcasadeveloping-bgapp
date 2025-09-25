#!/bin/bash

# Script para configurar credenciais do Copernicus
# Remove dependência de TOTP e configura apenas username/password

set -e

echo "🔐 Configuração de Credenciais Copernicus"
echo "========================================="
echo ""
echo "Este script irá configurar as credenciais para a nova autenticação"
echo "sem TOTP, seguindo a documentação oficial do Copernicus."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    touch .env
fi

# Function to add or update env variable
update_env_var() {
    local var_name=$1
    local var_value=$2
    
    if grep -q "^${var_name}=" .env; then
        # Update existing
        sed -i.bak "s/^${var_name}=.*/${var_name}=${var_value}/" .env
        echo "✅ Atualizado: ${var_name}"
    else
        # Add new
        echo "${var_name}=${var_value}" >> .env
        echo "✅ Adicionado: ${var_name}"
    fi
}

# Get Copernicus credentials
echo "📋 Por favor, forneça suas credenciais do Copernicus Data Space Ecosystem:"
echo "   (Registre-se em: https://dataspace.copernicus.eu/)"
echo ""

read -p "Username (email): " copernicus_username
if [ -z "$copernicus_username" ]; then
    echo "❌ Username é obrigatório"
    exit 1
fi

read -s -p "Password: " copernicus_password
echo ""
if [ -z "$copernicus_password" ]; then
    echo "❌ Password é obrigatório"
    exit 1
fi

echo ""
echo "🔧 Configurando credenciais..."

# Update .env file
update_env_var "COPERNICUS_USERNAME" "$copernicus_username"
update_env_var "COPERNICUS_PASSWORD" "$copernicus_password"

# Remove old TOTP variables if they exist
if grep -q "COPERNICUS_TOTP" .env; then
    echo "🗑️ Removendo variáveis TOTP antigas..."
    sed -i.bak '/^COPERNICUS_TOTP/d' .env
    echo "✅ Variáveis TOTP removidas"
fi

# Add webhook credentials
echo ""
echo "🌐 Configurando credenciais do webhook..."
webhook_user="bgapp-webhook-$(date +%s)"
webhook_pass=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

update_env_var "WEBHOOK_AUTH_USERNAME" "$webhook_user"
update_env_var "WEBHOOK_AUTH_PASSWORD" "$webhook_pass"

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Resumo das credenciais configuradas:"
echo "  - COPERNICUS_USERNAME: $copernicus_username"
echo "  - COPERNICUS_PASSWORD: ***hidden***"
echo "  - WEBHOOK_AUTH_USERNAME: $webhook_user"
echo "  - WEBHOOK_AUTH_PASSWORD: ***hidden***"
echo ""
echo "🧪 Para testar a autenticação, execute:"
echo "  node scripts/test-simple-auth.js"
echo ""
echo "🚀 Para fazer o deploy, execute:"
echo "  ./scripts/deploy-copernicus-migration.sh"
echo ""

# Test if node is available
if command -v node &> /dev/null; then
    echo ""
    read -p "Testar autenticação agora? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🧪 Testando autenticação..."
        if [ -f "scripts/test-simple-auth.js" ]; then
            # Load .env for the test
            export $(cat .env | grep -v '^#' | xargs)
            node scripts/test-simple-auth.js
        else
            echo "❌ Script de teste não encontrado"
        fi
    fi
else
    echo "⚠️ Node.js não encontrado. Instale Node.js para executar os testes."
fi

echo ""
echo "✨ Setup completo!"
