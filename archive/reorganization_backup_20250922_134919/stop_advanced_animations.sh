#!/bin/bash

echo "🛑 Parando BGAPP Advanced Animation System..."

# Matar processos por porta
kill_by_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        kill $pid
        echo "Processo na porta $port parado (PID: $pid)"
    fi
}

# Parar backend (porta 8000)
kill_by_port 8000

# Parar servidor web (porta 8080)
kill_by_port 8080

# Matar processos Python relacionados ao BGAPP
pkill -f "bgapp"
pkill -f "http.server 8080"

echo "✅ Todos os serviços foram parados"
