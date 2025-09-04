#!/bin/bash

# 🛡️ BGAPP STAC API Monitor - Auto-Recovery System
# Monitora e reinicia automaticamente o STAC API se necessário

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/stac_api.pid"
LOG_FILE="$PROJECT_ROOT/stac_monitor.log"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Verificar se STAC API está respondendo
check_stac_health() {
    if curl -s --max-time 5 http://localhost:8081/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Iniciar STAC API
start_stac() {
    log "🚀 Iniciando STAC API..."
    cd "$PROJECT_ROOT/infra/stac"
    nohup python simple_stac_api.py > "$PROJECT_ROOT/stac_api.log" 2>&1 &
    PID=$!
    echo $PID > "$PID_FILE"
    log "✅ STAC API iniciado (PID: $PID)"
}

# Parar STAC API
stop_stac() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            log "🛑 STAC API parado (PID: $PID)"
        fi
        rm -f "$PID_FILE"
    fi
}

# Função principal de monitoramento
monitor_stac() {
    log "🔍 Iniciando monitoramento do STAC API..."
    
    while true; do
        if check_stac_health; then
            log "✅ STAC API saudável"
        else
            log "❌ STAC API não está respondendo - reiniciando..."
            
            # Parar processo atual se existir
            stop_stac
            
            # Aguardar um pouco
            sleep 2
            
            # Reiniciar
            start_stac
            
            # Aguardar inicialização
            sleep 5
            
            # Verificar se voltou
            if check_stac_health; then
                log "✅ STAC API recuperado com sucesso!"
            else
                log "❌ Falha na recuperação do STAC API"
            fi
        fi
        
        # Aguardar 30 segundos antes da próxima verificação
        sleep 30
    done
}

case "${1:-monitor}" in
    start)
        log "🚀 Modo: Iniciar STAC API"
        start_stac
        ;;
        
    stop)
        log "🛑 Modo: Parar STAC API"
        stop_stac
        ;;
        
    restart)
        log "🔄 Modo: Reiniciar STAC API"
        stop_stac
        sleep 2
        start_stac
        ;;
        
    monitor)
        log "🛡️ Modo: Monitor contínuo"
        monitor_stac
        ;;
        
    status)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if kill -0 "$PID" 2>/dev/null; then
                if check_stac_health; then
                    echo "✅ STAC API saudável (PID: $PID)"
                else
                    echo "⚠️ STAC API rodando mas não responde (PID: $PID)"
                fi
            else
                echo "❌ STAC API não está rodando"
                rm -f "$PID_FILE"
            fi
        else
            echo "❌ STAC API não está rodando"
        fi
        ;;
        
    *)
        echo "Uso: $0 {start|stop|restart|monitor|status}"
        echo ""
        echo "Comandos:"
        echo "  start   - Inicia o STAC API"
        echo "  stop    - Para o STAC API"
        echo "  restart - Reinicia o STAC API"
        echo "  monitor - Monitor contínuo com auto-recovery"
        echo "  status  - Mostra status atual"
        exit 1
        ;;
esac
