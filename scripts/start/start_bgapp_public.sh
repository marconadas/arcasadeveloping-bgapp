#!/bin/bash

# Script para disponibilizar BGAPP via ngrok
# ⚠️ ATENÇÃO: Este script expõe a aplicação publicamente na internet
# 🔒 Use apenas em ambiente de desenvolvimento e com cuidado

# Verificar se o acesso remoto está explicitamente habilitado
if [ "$ENABLE_REMOTE_ACCESS" != "true" ]; then
    echo "❌ ACESSO REMOTO DESABILITADO POR SEGURANÇA"
    echo "============================================"
    echo "🔒 Este script expõe a aplicação publicamente na internet."
    echo "⚠️  Para habilitar, defina: ENABLE_REMOTE_ACCESS=true"
    echo ""
    echo "💡 Para uso local seguro, use:"
    echo "   ./start_bgapp_enhanced.sh  # Apenas localhost"
    echo ""
    exit 1
fi

echo "⚠️  BGAPP - Exposição remota HABILITADA"
echo "============================================"
echo "🔓 A aplicação será acessível publicamente!"
echo "🔒 Certifique-se que está em ambiente de desenvolvimento"

# Verificar se estamos no diretório correto
if [ ! -f "infra/frontend/index.html" ]; then
    echo "❌ Erro: Execute este script a partir do diretório raiz do projeto BGAPP"
    echo "💡 Certifique-se que o arquivo infra/frontend/index.html existe"
    exit 1
fi

# Verificar se ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok não está instalado"
    echo "💡 Instale o ngrok:"
    echo "   - macOS: brew install ngrok/ngrok/ngrok"
    echo "   - Windows/Linux: @https://ngrok.com/download"
    echo "   - Ou baixe de: https://ngrok.com/download"
    exit 1
fi

echo "✅ ngrok encontrado"

# Definir porta
PORT=8080

# Parar processos existentes
echo "🧹 Limpando processos anteriores..."
pkill -f "python.*http.server.*$PORT" 2>/dev/null || true
pkill -f "ngrok.*http.*$PORT" 2>/dev/null || true

# Iniciar servidor HTTP personalizado em background (do diretório raiz)
echo "🌐 Iniciando servidor web personalizado na porta $PORT..."
echo "🎯 Página principal forçada: index.html"
python3 server_index.py $PORT > /dev/null 2>&1 &
SERVER_PID=$!

# Aguardar servidor iniciar
sleep 3

# Verificar se servidor está funcionando
if curl -s http://localhost:$PORT > /dev/null; then
    echo "✅ Servidor web iniciado com sucesso"
else
    echo "❌ Erro ao iniciar servidor web"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Iniciar ngrok em background
echo "🚀 Iniciando túnel ngrok..."
ngrok http $PORT --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Aguardar ngrok inicializar
echo "⏳ Aguardando túnel ngrok ficar pronto..."
sleep 5

# Função para obter URL do ngrok
get_ngrok_url() {
    if command -v curl &> /dev/null; then
        URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if data.get('tunnels'):
        print(data['tunnels'][0]['public_url'])
    else:
        print('')
except:
    print('')
" 2>/dev/null)
        echo "$URL"
    else
        echo ""
    fi
}

# Obter URL pública
PUBLIC_URL=$(get_ngrok_url)

# Mostrar informações
echo ""
echo "🎉 BGAPP DISPONÍVEL REMOTAMENTE!"
echo "================================"

if [ -n "$PUBLIC_URL" ] && [ "$PUBLIC_URL" != "" ]; then
    echo "🔗 URL pública: $PUBLIC_URL"
    echo "📱 Acesso à aplicação: $PUBLIC_URL"
else
    echo "🔗 Verifique a URL em: http://localhost:4040"
    echo "   (Dashboard do ngrok)"
fi

echo "💻 Acesso local: http://localhost:$PORT"
echo "🔧 Dashboard ngrok: http://localhost:4040"
echo ""
echo "📋 Funcionalidades disponíveis:"
echo "   ✅ Mapa meteorológico interativo de Angola"
echo "   ✅ Dados oceanográficos (SST, Salinidade, Clorofila)"
echo "   ✅ Campos vetoriais (Correntes, Vento)"
echo "   ✅ Controles de animação temporal"
echo "   ✅ ZEE de Angola e Cabinda"
echo "   ✅ Painel administrativo (⚙️ no canto superior direito)"
echo ""
echo "🔐 Acesso administrativo:"
echo "   - Clicar no ⚙️ no painel"
echo "   - Credenciais: Consulte a documentação de segurança"
echo ""
echo "🌍 A aplicação está agora acessível globalmente!"
echo "   Partilhe a URL pública com qualquer pessoa"
echo ""
echo "🛑 Para parar: Ctrl+C"
echo "================================"

# Função para limpeza ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $SERVER_PID 2>/dev/null || true
    kill $NGROK_PID 2>/dev/null || true
    pkill -f "python.*http.server.*$PORT" 2>/dev/null || true
    pkill -f "ngrok.*http.*$PORT" 2>/dev/null || true
    echo "✅ Serviços parados!"
    exit 0
}

# Capturar sinais para limpeza
trap cleanup SIGINT SIGTERM

# Manter script rodando
echo "👀 Monitorando serviços... (Ctrl+C para parar)"
while true; do
    sleep 5
    
    # Verificar se servidor ainda está rodando
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "⚠️ Servidor web parou inesperadamente"
        break
    fi
    
    # Verificar se ngrok ainda está rodando
    if ! kill -0 $NGROK_PID 2>/dev/null; then
        echo "⚠️ Túnel ngrok parou inesperadamente"
        break
    fi
    
    # Mostrar URL periodicamente (a cada 30 segundos)
    if [ $((SECONDS % 30)) -eq 0 ]; then
        CURRENT_URL=$(get_ngrok_url)
        if [ -n "$CURRENT_URL" ] && [ "$CURRENT_URL" != "" ]; then
            echo "🔗 URL atual: $CURRENT_URL"
        fi
    fi
done

# Se chegou aqui, algum serviço parou
cleanup
