#!/bin/bash

# Script de configuração para Mapa Enterprise

set -e

echo "🚀 Configurando Mapa Enterprise..."

# Verificar se Python 3 está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Instale Python 3.8+ primeiro."
    exit 1
fi

echo "✅ Python 3 encontrado"

# Verificar se pip está instalado
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 não encontrado. Instale pip primeiro."
    exit 1
fi

echo "✅ pip3 encontrado"

# Criar ambiente virtual
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
fi

echo "✅ Ambiente virtual criado"

# Ativar ambiente virtual
echo "🔧 Ativando ambiente virtual..."
source venv/bin/activate

# Instalar dependências
echo "📋 Instalando dependências..."
pip install -r requirements.txt

echo "✅ Dependências instaladas"

# Criar diretórios
echo "📁 Criando diretórios..."
mkdir -p data/models
mkdir -p data/qgis
mkdir -p logs

echo "✅ Diretórios criados"

# Configurar arquivo .env
if [ ! -f ".env" ]; then
    echo "⚙️  Configurando variáveis de ambiente..."
    cp config_example.env .env

    echo ""
    echo "📝 Edite o arquivo .env com suas credenciais:"
    echo "   - COPERNICUS_API_KEY, COPERNICUS_USERNAME, COPERNICUS_PASSWORD"
    echo "   - GFW_API_KEY, GFW_CLIENT_ID, GFW_CLIENT_SECRET"
    echo "   - SECRET_KEY e JWT_SECRET_KEY (gere chaves seguras)"
    echo ""
    echo "Depois de configurar, execute: python start.py"
else
    echo "✅ Arquivo .env já existe"
fi

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite o arquivo .env com suas credenciais"
echo "2. Execute: python start.py"
echo "3. Acesse: http://localhost:8050"
echo ""
echo "🔐 Credenciais padrão de teste:"
echo "   Usuário: admin"
echo "   Senha: admin123"
echo ""
echo "📖 Para mais informações, consulte o README.md"
