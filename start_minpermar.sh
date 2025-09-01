#!/bin/bash

# Script para iniciar o site MINPERMAR
# Este script instala dependências e inicia o servidor de desenvolvimento

echo "🐟 Iniciando Site MINPERMAR - Ministério das Pescas e Recursos Marinhos de Angola"
echo "=================================================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor instale Node.js primeiro."
    echo "   Visite: https://nodejs.org/"
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor instale npm primeiro."
    exit 1
fi

# Navegar para o diretório do projeto MINPERMAR
cd "$(dirname "$0")/infra/frontend/minpermar"

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado. Verifique se está no diretório correto."
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

# Verificar se a instalação foi bem-sucedida
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências."
    exit 1
fi

echo "✅ Dependências instaladas com sucesso!"
echo ""
echo "🚀 Iniciando servidor de desenvolvimento..."
echo "   URL: http://localhost:3001"
echo "   Para parar o servidor: Ctrl+C"
echo ""
echo "🔗 Acesso através do BGAPP Admin:"
echo "   1. Abra http://localhost:8001/admin.html"
echo "   2. Clique em 'Site MINPERMAR' no menu lateral"
echo ""

# Iniciar o servidor de desenvolvimento
npm run dev

echo ""
echo "👋 Obrigado por usar o Site MINPERMAR!"
