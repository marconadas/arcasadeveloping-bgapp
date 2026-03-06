#!/bin/bash

# Script para instalar ngrok rapidamente

echo "📦 BGAPP - Instalação rápida do ngrok"
echo "====================================="

# Detectar sistema operativo
OS=$(uname -s)
ARCH=$(uname -m)

echo "🔍 Sistema detectado: $OS ($ARCH)"

case "$OS" in
    "Darwin")
        # macOS
        echo "🍎 Instalando ngrok no macOS..."
        
        if command -v brew &> /dev/null; then
            echo "✅ Homebrew encontrado, instalando ngrok..."
            brew install ngrok/ngrok/ngrok
            
            if [ $? -eq 0 ]; then
                echo "✅ ngrok instalado com sucesso via Homebrew!"
            else
                echo "❌ Erro ao instalar via Homebrew"
                exit 1
            fi
        else
            echo "❌ Homebrew não encontrado"
            echo "💡 Instale o Homebrew primeiro:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            echo ""
            echo "🔗 Ou baixe ngrok manualmente de: https://ngrok.com/download"
            exit 1
        fi
        ;;
        
    "Linux")
        # Linux
        echo "🐧 Instalando ngrok no Linux..."
        
        # Detectar arquitetura
        case "$ARCH" in
            "x86_64")
                NGROK_ARCH="amd64"
                ;;
            "aarch64"|"arm64")
                NGROK_ARCH="arm64"
                ;;
            *)
                echo "❌ Arquitetura não suportada: $ARCH"
                exit 1
                ;;
        esac
        
        # Download e instalação
        NGROK_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-${NGROK_ARCH}.tgz"
        
        echo "📥 Baixando ngrok de: $NGROK_URL"
        
        # Criar diretório temporário
        TEMP_DIR=$(mktemp -d)
        cd "$TEMP_DIR"
        
        # Baixar e extrair
        curl -L "$NGROK_URL" | tar xz
        
        if [ $? -eq 0 ] && [ -f "ngrok" ]; then
            # Mover para /usr/local/bin
            sudo mv ngrok /usr/local/bin/
            sudo chmod +x /usr/local/bin/ngrok
            
            echo "✅ ngrok instalado com sucesso em /usr/local/bin/ngrok"
        else
            echo "❌ Erro ao baixar ou extrair ngrok"
            exit 1
        fi
        
        # Limpar
        cd - > /dev/null
        rm -rf "$TEMP_DIR"
        ;;
        
    *)
        echo "❌ Sistema operativo não suportado: $OS"
        echo "💡 Baixe ngrok manualmente de: https://ngrok.com/download"
        exit 1
        ;;
esac

# Verificar instalação
echo "🔍 Verificando instalação..."
if command -v ngrok &> /dev/null; then
    NGROK_VERSION=$(ngrok version)
    echo "✅ ngrok instalado com sucesso!"
    echo "📋 Versão: $NGROK_VERSION"
    echo ""
    echo "🚀 Próximos passos:"
    echo "1. Execute: ./start_bgapp_public.sh"
    echo "2. Ou configure authtoken (opcional):"
    echo "   - Vá para: https://ngrok.com/signup"
    echo "   - Crie conta grátis"
    echo "   - Obtenha seu authtoken"
    echo "   - Execute: ngrok config add-authtoken SEU_TOKEN"
    echo ""
    echo "💡 Com authtoken você terá URLs mais estáveis e recursos extras"
else
    echo "❌ ngrok não foi instalado corretamente"
    echo "💡 Tente instalar manualmente de: https://ngrok.com/download"
    exit 1
fi
