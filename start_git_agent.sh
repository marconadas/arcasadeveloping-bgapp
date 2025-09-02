#!/bin/bash

# Script para iniciar e manter o agente Git em segundo plano
# Criado para o projeto BGAPP

echo "🔧 Iniciando agente Git em segundo plano..."

# Verificar se o agente SSH já está em execução
if ! pgrep -x "ssh-agent" > /dev/null; then
    echo "🚀 Iniciando novo agente SSH..."
    eval "$(ssh-agent -s)"
else
    echo "✅ Agente SSH já está em execução"
fi

# Verificar se a chave já está carregada
if ! ssh-add -l | grep -q "id_ed25519"; then
    echo "🔑 Adicionando chave SSH ao agente..."
    ssh-add ~/.ssh/id_ed25519
else
    echo "✅ Chave SSH já está carregada no agente"
fi

# Verificar status do agente
echo "📊 Status do agente SSH:"
ssh-add -l

echo ""
echo "🎯 Agente Git configurado e em execução!"
echo "📋 Para adicionar a chave pública ao GitHub, copie o conteúdo abaixo:"
echo "----------------------------------------"
cat ~/.ssh/id_ed25519.pub
echo "----------------------------------------"
echo ""
echo "💡 Acesse https://github.com/settings/keys para adicionar a chave"
echo "🔄 O agente continuará em execução em segundo plano"

# Manter o agente ativo (opcional - descomente se necessário)
# while true; do
#     if ! pgrep -x "ssh-agent" > /dev/null; then
#         echo "⚠️  Agente SSH parou, reiniciando..."
#         eval "$(ssh-agent -s)"
#         ssh-add ~/.ssh/id_ed25519
#     fi
#     sleep 300  # Verificar a cada 5 minutos
# done
