#!/bin/bash

# 🌊 BGAPP STAC API Startup Script
# Inicia o serviço STAC API local na porta 8081

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STAC_DIR="$PROJECT_ROOT/infra/stac"
PID_FILE="$PROJECT_ROOT/stac_api.pid"

echo "🌊 BGAPP STAC API Management"
echo "=========================="

case "${1:-start}" in
    start)
        echo "🚀 Iniciando STAC API..."
        
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if kill -0 "$PID" 2>/dev/null; then
                echo "✅ STAC API já está rodando (PID: $PID)"
                echo "🔗 URL: http://localhost:8081"
                exit 0
            else
                echo "🧹 Removendo PID file órfão"
                rm -f "$PID_FILE"
            fi
        fi
        
        echo "📂 Mudando para diretório STAC: $STAC_DIR"
        cd "$STAC_DIR"
        
        echo "🐍 Iniciando Python STAC API..."
        nohup python simple_stac_api.py > "$PROJECT_ROOT/stac_api.log" 2>&1 &
        PID=$!
        echo $PID > "$PID_FILE"
        
        echo "⏳ Aguardando inicialização..."
        sleep 3
        
        if kill -0 "$PID" 2>/dev/null; then
            echo "✅ STAC API iniciado com sucesso!"
            echo "📍 PID: $PID"
            echo "🔗 URL: http://localhost:8081"
            echo "📋 Health: http://localhost:8081/health"
            echo "📚 Collections: http://localhost:8081/collections"
            echo "📄 Log: $PROJECT_ROOT/stac_api.log"
            
            # Testar conectividade
            if curl -s http://localhost:8081/health > /dev/null; then
                echo "🎉 STAC API respondendo corretamente!"
            else
                echo "⚠️ STAC API iniciado mas não está respondendo"
            fi
        else
            echo "❌ Falha ao iniciar STAC API"
            rm -f "$PID_FILE"
            exit 1
        fi
        ;;
        
    stop)
        echo "🛑 Parando STAC API..."
        
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if kill -0 "$PID" 2>/dev/null; then
                kill "$PID"
                echo "✅ STAC API parado (PID: $PID)"
                rm -f "$PID_FILE"
            else
                echo "⚠️ STAC API não estava rodando"
                rm -f "$PID_FILE"
            fi
        else
            echo "⚠️ PID file não encontrado"
        fi
        ;;
        
    restart)
        echo "🔄 Reiniciando STAC API..."
        $0 stop
        sleep 2
        $0 start
        ;;
        
    status)
        echo "📊 Verificando status do STAC API..."
        
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if kill -0 "$PID" 2>/dev/null; then
                echo "✅ STAC API rodando (PID: $PID)"
                echo "🔗 URL: http://localhost:8081"
                
                if curl -s http://localhost:8081/health > /dev/null; then
                    echo "🎉 STAC API respondendo corretamente!"
                    curl -s http://localhost:8081/health | python -m json.tool 2>/dev/null || echo "Resposta recebida"
                else
                    echo "❌ STAC API não está respondendo"
                fi
            else
                echo "❌ STAC API não está rodando"
                rm -f "$PID_FILE"
            fi
        else
            echo "❌ STAC API não está rodando"
        fi
        ;;
        
    logs)
        echo "📄 Mostrando logs do STAC API..."
        if [ -f "$PROJECT_ROOT/stac_api.log" ]; then
            tail -f "$PROJECT_ROOT/stac_api.log"
        else
            echo "❌ Arquivo de log não encontrado"
        fi
        ;;
        
    *)
        echo "Uso: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Comandos:"
        echo "  start   - Inicia o STAC API"
        echo "  stop    - Para o STAC API" 
        echo "  restart - Reinicia o STAC API"
        echo "  status  - Mostra status do STAC API"
        echo "  logs    - Mostra logs do STAC API"
        exit 1
        ;;
esac