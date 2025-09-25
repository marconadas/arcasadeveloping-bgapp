#!/bin/bash

# Script para iniciar o admin em modo desenvolvimento com auto-reload
# Uso: ./start_admin_dev.sh

echo "🚀 Iniciando BGAPP Admin em modo desenvolvimento..."

# Mata processos existentes
echo "🧹 Limpando processos anteriores..."
pkill -f "python.*http.server" 2>/dev/null || true
pkill -f "ngrok" 2>/dev/null || true

# Vai para o diretório do frontend
cd infra/frontend

# Inicia servidor HTTP em background
echo "📡 Iniciando servidor HTTP na porta 8080..."
python3 -m http.server 8080 &
SERVER_PID=$!

# Aguarda servidor iniciar
sleep 2

# Inicia ngrok em background
echo "🌐 Iniciando ngrok..."
ngrok http 8080 --log=stdout &
NGROK_PID=$!

# Aguarda ngrok inicializar
sleep 3

# Mostra informações
echo ""
echo "✅ Serviços iniciados!"
echo "📱 Interface Admin: http://localhost:8080/admin.html"
echo "🔗 ngrok Dashboard: http://localhost:4040"
echo ""
echo "🔄 Para ver a URL pública do ngrok:"
echo "   curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'"
echo ""
echo "🛑 Para parar os serviços: Ctrl+C ou execute:"
echo "   kill $SERVER_PID $NGROK_PID"
echo ""

# Função para cleanup ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $SERVER_PID 2>/dev/null || true
    kill $NGROK_PID 2>/dev/null || true
    pkill -f "python.*http.server" 2>/dev/null || true
    pkill -f "ngrok" 2>/dev/null || true
    echo "✅ Serviços parados!"
    exit 0
}

# Captura sinais para cleanup
trap cleanup SIGINT SIGTERM

# Mantém o script rodando
echo "👀 Monitorando... Pressione Ctrl+C para parar"
while true; do
    sleep 1
done
