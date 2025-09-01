#!/bin/bash

# BGAPP - Script de Inicialização com Funcionalidades Reais
# Versão: 2.0.0 - Sistema Funcional Completo

echo "🚀 BGAPP - Inicializando Sistema com Funcionalidades Reais"
echo "=================================================="

# Verificar se estamos no diretório correto
if [ ! -f "src/bgapp/admin_api.py" ]; then
    echo "❌ Erro: Execute este script a partir do diretório raiz do BGAPP"
    exit 1
fi

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Erro: Python 3 não encontrado"
    exit 1
fi

echo "✅ Python encontrado: $(python3 --version)"

# Verificar dependências
echo "🔧 Verificando dependências..."
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt --quiet
    echo "✅ Dependências instaladas"
else
    echo "⚠️ requirements.txt não encontrado - continuando..."
fi

# Iniciar API Backend
echo ""
echo "🌐 Iniciando API Backend..."
echo "Endpoint: http://localhost:5080"
echo "Documentação: http://localhost:5080/docs"
echo ""

# Mostrar instruções
echo "📋 INSTRUÇÕES DE USO:"
echo "1. Aguarde a API inicializar completamente"
echo "2. Abra o navegador em: http://localhost:5080/infra/frontend/index-fresh.html"
echo "3. Ou teste primeiro: http://localhost:5080/infra/frontend/test-real-functionality.html"
echo ""
echo "🎯 FUNCIONALIDADES IMPLEMENTADAS:"
echo "• ✅ Filtros de data funcionais"
echo "• ✅ Animações temporais completas"
echo "• ✅ Dados oceanográficos reais (SST, Salinidade, Clorofila)"
echo "• ✅ Campos vetoriais (Correntes, Vento)"
echo "• ✅ Sistema de cache inteligente"
echo "• ✅ Notificações e feedback visual"
echo ""
echo "🔧 Para parar o servidor: Ctrl+C"
echo "=================================================="
echo ""

# Iniciar o servidor
cd "$(dirname "$0")" || exit
python3 -m src.bgapp.admin_api
