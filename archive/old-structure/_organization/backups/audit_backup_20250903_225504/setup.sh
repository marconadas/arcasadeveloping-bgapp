#!/bin/bash

# BGAPP Admin Dashboard - Setup Script
# Este script configura o ambiente de desenvolvimento

set -e

echo "🚀 BGAPP Admin Dashboard - Setup"
echo "================================="

# Check Node.js version
echo "📋 Verificando pré-requisitos..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor instale Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js versão 18+ necessária. Versão atual: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Por favor execute este script no diretório admin-dashboard"
    exit 1
fi

# Install dependencies
echo "📦 Instalando dependências..."
if command -v yarn &> /dev/null; then
    echo "📦 Usando Yarn..."
    yarn install
else
    echo "📦 Usando npm..."
    npm install
fi

# Setup environment file
echo "⚙️ Configurando variáveis de ambiente..."
if [ ! -f ".env.local" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env.local
        echo "✅ Arquivo .env.local criado a partir do env.example"
        echo "📝 Por favor edite .env.local com suas configurações"
    else
        echo "⚠️ Arquivo env.example não encontrado"
    fi
else
    echo "✅ Arquivo .env.local já existe"
fi

# Create necessary directories
echo "📁 Criando diretórios necessários..."
mkdir -p public/icons
mkdir -p public/images
mkdir -p src/store
mkdir -p src/hooks

# Copy static assets if they exist
echo "📋 Copiando assets estáticos..."
if [ -f "../logo.png" ]; then
    cp ../logo.png public/logo.png
    echo "✅ Logo copiado"
fi

if [ -f "../favicon.ico" ]; then
    cp ../favicon.ico public/favicon.ico
    echo "✅ Favicon copiado"
fi

if [ -f "../favicon-16x16.png" ]; then
    cp ../favicon-16x16.png public/favicon-16x16.png
    echo "✅ Favicon 16x16 copiado"
fi

if [ -f "../favicon-32x32.png" ]; then
    cp ../favicon-32x32.png public/favicon-32x32.png
    echo "✅ Favicon 32x32 copiado"
fi

if [ -f "../apple-touch-icon.png" ]; then
    cp ../apple-touch-icon.png public/apple-touch-icon.png
    echo "✅ Apple touch icon copiado"
fi

# Check if APIs are running
echo "🔍 Verificando APIs BGAPP..."
check_api() {
    local url=$1
    local name=$2
    
    if curl -s --max-time 5 "$url/health" > /dev/null 2>&1; then
        echo "✅ $name ($url)"
        return 0
    else
        echo "❌ $name ($url) - não acessível"
        return 1
    fi
}

API_ERRORS=0

# Check Admin API
if ! check_api "http://localhost:8085" "Admin API"; then
    API_ERRORS=$((API_ERRORS + 1))
fi

# Check ML API
if ! check_api "http://localhost:8000" "ML API"; then
    API_ERRORS=$((API_ERRORS + 1))
fi

# Check pygeoapi
if ! check_api "http://localhost:5080" "pygeoapi"; then
    API_ERRORS=$((API_ERRORS + 1))
fi

if [ $API_ERRORS -gt 0 ]; then
    echo "⚠️ $API_ERRORS API(s) não estão acessíveis"
    echo "💡 Certifique-se de que os serviços BGAPP estão rodando"
    echo "💡 Execute: cd .. && ./start_bgapp_enhanced.sh"
fi

# Type check
echo "🔍 Verificando tipos TypeScript..."
if command -v yarn &> /dev/null; then
    yarn type-check
else
    npm run type-check
fi

echo ""
echo "🎉 Setup concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite .env.local com suas configurações de API"
echo "2. Certifique-se de que os serviços BGAPP estão rodando"
echo "3. Execute 'npm run dev' para iniciar o dashboard"
echo ""
echo "🌐 URLs importantes:"
echo "- Dashboard: http://localhost:3001"
echo "- Admin API: http://localhost:8085"
echo "- ML API: http://localhost:8000"
echo "- pygeoapi: http://localhost:5080"
echo ""
echo "📚 Documentação completa no README.md"
echo ""

# Ask if user wants to start development server
read -p "🚀 Deseja iniciar o servidor de desenvolvimento agora? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Iniciando servidor de desenvolvimento..."
    if command -v yarn &> /dev/null; then
        yarn dev
    else
        npm run dev
    fi
fi
