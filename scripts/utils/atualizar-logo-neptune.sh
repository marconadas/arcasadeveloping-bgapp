#!/bin/bash

# Script para atualizar logo Neptune e fazer redeploy
# MareDatum - Neptune Team

echo "🎨 Atualizando Logo Neptune..."
echo "================================"

# Verificar se logo.png existe
if [ ! -f "logo.png" ]; then
    echo "❌ ERRO: logo.png não encontrado no diretório atual!"
    echo ""
    echo "Por favor, salve a imagem do logo Neptune como 'logo.png' neste diretório:"
    echo "$(pwd)"
    echo ""
    echo "Depois execute este script novamente."
    exit 1
fi

echo "✅ Logo encontrado: logo.png"

# Fazer backup do logo antigo
if [ -f "apps/frontend/BGAPP/logo.png" ]; then
    BACKUP_NAME="apps/frontend/BGAPP/logo-backup-$(date +%Y%m%d-%H%M%S).png"
    cp apps/frontend/BGAPP/logo.png "$BACKUP_NAME"
    echo "📦 Backup criado: $BACKUP_NAME"
fi

# Copiar novo logo
echo "📋 Copiando novo logo Neptune..."
cp logo.png apps/frontend/BGAPP/logo.png

echo "✅ Logo atualizado com sucesso!"
echo ""

# Perguntar se quer fazer deploy
read -p "🚀 Fazer deploy agora? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[SsYy]$ ]]; then
    echo ""
    echo "🌊 Iniciando deployment do Neptune com novo logo..."
    ./deploy-neptune.sh
else
    echo ""
    echo "✅ Logo atualizado localmente."
    echo "Para fazer deploy depois, execute:"
    echo "./deploy-neptune.sh"
fi




