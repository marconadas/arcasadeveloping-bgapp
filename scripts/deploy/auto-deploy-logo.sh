#!/bin/bash

# Script de Deploy Automático do Logo Neptune
# Monitora o arquivo logo.png e faz deploy quando detectar mudança

echo "🌊 Neptune - Auto Deploy do Logo"
echo "================================="
echo ""
echo "📋 INSTRUÇÕES:"
echo ""
echo "1. Clique com BOTÃO DIREITO na imagem do logo Neptune"
echo "2. Escolha 'Salvar Imagem Como...'"
echo "3. Salve como 'logo.png' neste diretório:"
echo "   $(pwd)"
echo ""
echo "⏳ Aguardando você salvar o logo..."
echo "   (Pressione Ctrl+C para cancelar)"
echo ""

# Registrar timestamp do arquivo atual
if [ -f "logo.png" ]; then
    ORIGINAL_TIME=$(stat -f %m logo.png 2>/dev/null || stat -c %Y logo.png 2>/dev/null)
else
    ORIGINAL_TIME=0
fi

# Monitorar mudanças no arquivo
COUNTER=0
while true; do
    if [ -f "logo.png" ]; then
        CURRENT_TIME=$(stat -f %m logo.png 2>/dev/null || stat -c %Y logo.png 2>/dev/null)
        
        if [ "$CURRENT_TIME" != "$ORIGINAL_TIME" ]; then
            echo ""
            echo "✅ Logo detectado! Iniciando deploy automático..."
            echo ""
            sleep 2
            
            # Fazer backup do logo antigo
            if [ -f "apps/frontend/BGAPP/logo.png" ]; then
                BACKUP_NAME="apps/frontend/BGAPP/logo-backup-$(date +%Y%m%d-%H%M%S).png"
                cp apps/frontend/BGAPP/logo.png "$BACKUP_NAME"
                echo "📦 Backup criado: $BACKUP_NAME"
            fi
            
            # Copiar novo logo
            echo "📋 Copiando novo logo Neptune..."
            cp logo.png apps/frontend/BGAPP/logo.png
            
            echo "✅ Logo atualizado!"
            echo ""
            
            # Deploy automático
            echo "🚀 Iniciando deploy do Neptune com novo logo..."
            echo ""
            ./deploy-neptune.sh
            
            exit 0
        fi
    fi
    
    # Mostrar indicador de progresso
    COUNTER=$((COUNTER + 1))
    if [ $((COUNTER % 3)) -eq 0 ]; then
        echo -n "."
    fi
    
    sleep 1
done




