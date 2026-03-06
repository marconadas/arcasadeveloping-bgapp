#!/bin/bash

# Script avançado com file watching para auto-reload
# Monitora mudanças em arquivos e recarrega automaticamente

echo "🎯 BGAPP Admin - Auto-reload com File Watching"
echo "=============================================="

# Verifica se fswatch está instalado (para macOS)
if ! command -v fswatch &> /dev/null; then
    echo "📦 Instalando fswatch para monitoramento de arquivos..."
    if command -v brew &> /dev/null; then
        brew install fswatch
    else
        echo "⚠️  Por favor instale fswatch: brew install fswatch"
        exit 1
    fi
fi

# Configurações
PORT=8080
FRONTEND_DIR="infra/frontend"
WATCH_DIRS=("$FRONTEND_DIR" "src/bgapp")

# PIDs dos processos
SERVER_PID=""
NGROK_PID=""

# Função para obter URL do ngrok
get_ngrok_url() {
    sleep 3
    if command -v curl &> /dev/null && command -v jq &> /dev/null; then
        URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)
        if [ "$URL" != "null" ] && [ ! -z "$URL" ]; then
            echo "🌐 URL Pública: $URL/admin.html"
            echo "📱 Teste mobile: $URL/admin.html"
        fi
    fi
    echo "🔗 Dashboard ngrok: http://localhost:4040"
}

# Função para iniciar serviços
start_services() {
    echo "🚀 Iniciando serviços..."
    
    # Para serviços existentes
    stop_services
    
    # Inicia servidor HTTP
    cd "$FRONTEND_DIR"
    python3 -m http.server $PORT > /dev/null 2>&1 &
    SERVER_PID=$!
    cd - > /dev/null
    
    # Inicia ngrok
    ngrok http $PORT --log=stdout > /dev/null 2>&1 &
    NGROK_PID=$!
    
    echo "✅ Servidor HTTP: http://localhost:$PORT/admin.html"
    get_ngrok_url
}

# Função para parar serviços
stop_services() {
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
    fi
    if [ ! -z "$NGROK_PID" ]; then
        kill $NGROK_PID 2>/dev/null || true
    fi
    
    # Cleanup adicional
    pkill -f "python.*http.server.*$PORT" 2>/dev/null || true
    pkill -f "ngrok.*http.*$PORT" 2>/dev/null || true
}

# Função de cleanup ao sair
cleanup() {
    echo ""
    echo "🛑 Parando todos os serviços..."
    stop_services
    echo "✅ Cleanup concluído!"
    exit 0
}

# Captura sinais
trap cleanup SIGINT SIGTERM

# Inicia serviços pela primeira vez
start_services

echo ""
echo "👀 Monitorando mudanças em:"
for dir in "${WATCH_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "   📂 $dir"
    fi
done
echo ""
echo "🔄 Arquivos monitorados: .html, .css, .js, .py"
echo "🛑 Pressione Ctrl+C para parar"
echo "=============================================="

# Monitor de arquivos com fswatch
fswatch -o \
    --include='.*\.(html|css|js|py)$' \
    --exclude='.*' \
    "${WATCH_DIRS[@]}" | while read num; do
    
    echo ""
    echo "🔄 $(date '+%H:%M:%S') - Mudanças detectadas!"
    echo "⏳ Reiniciando serviços..."
    start_services
    echo "✅ $(date '+%H:%M:%S') - Serviços atualizados!"
    echo "=============================================="
done
