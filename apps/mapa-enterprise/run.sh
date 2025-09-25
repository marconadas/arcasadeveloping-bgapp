#!/bin/bash

# Script para executar Mapa Enterprise

echo "🌊 Iniciando Mapa Enterprise - Angola..."

# Verificar se está no diretório correto
if [ ! -f "src/app.py" ]; then
    echo "❌ Arquivos da aplicação não encontrados. Execute no diretório correto."
    exit 1
fi

# Ativar ambiente virtual se existir
if [ -d "venv" ]; then
    echo "🔧 Ativando ambiente virtual..."
    source venv/bin/activate
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Usando configurações padrão."
    echo "   Execute ./setup.sh primeiro para configurar adequadamente."
fi

# Executar aplicação
echo "🚀 Iniciando servidor..."
echo "📱 Interface web: http://localhost:8050"
echo "🛑 Para parar, pressione Ctrl+C"

python start.py --host 0.0.0.0 --port 8050 "$@"
