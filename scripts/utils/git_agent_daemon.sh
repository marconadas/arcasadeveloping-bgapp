#!/bin/bash

# Daemon para manter o agente Git em segundo plano
# Este script mantém o agente SSH ativo permanentemente

LOGFILE="$HOME/.ssh/git_agent.log"
PIDFILE="$HOME/.ssh/git_agent.pid"

# Função para log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOGFILE"
}

# Função para iniciar o agente
start_agent() {
    log "Iniciando agente SSH..."
    eval "$(ssh-agent -s)" > /dev/null 2>&1
    ssh-add ~/.ssh/id_ed25519 > /dev/null 2>&1
    log "Agente SSH iniciado e chave adicionada"
}

# Função para verificar se o agente está ativo
check_agent() {
    if ! pgrep -x "ssh-agent" > /dev/null; then
        return 1
    fi
    
    if ! ssh-add -l > /dev/null 2>&1; then
        return 1
    fi
    
    return 0
}

# Função principal do daemon
run_daemon() {
    log "Daemon do agente Git iniciado (PID: $$)"
    echo $$ > "$PIDFILE"
    
    while true; do
        if ! check_agent; then
            log "Agente SSH não está ativo, reiniciando..."
            start_agent
        fi
        
        # Verificar a cada 60 segundos
        sleep 60
    done
}

# Função para parar o daemon
stop_daemon() {
    if [ -f "$PIDFILE" ]; then
        PID=$(cat "$PIDFILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            rm -f "$PIDFILE"
            log "Daemon parado (PID: $PID)"
            echo "✅ Daemon do agente Git parado"
        else
            rm -f "$PIDFILE"
            echo "⚠️  Daemon não estava em execução"
        fi
    else
        echo "⚠️  Arquivo PID não encontrado"
    fi
}

# Função para status
status_daemon() {
    if [ -f "$PIDFILE" ]; then
        PID=$(cat "$PIDFILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "✅ Daemon está em execução (PID: $PID)"
            if check_agent; then
                echo "✅ Agente SSH está ativo"
                ssh-add -l
            else
                echo "⚠️  Agente SSH não está ativo"
            fi
        else
            echo "❌ Daemon não está em execução"
            rm -f "$PIDFILE"
        fi
    else
        echo "❌ Daemon não está em execução"
    fi
}

# Processar argumentos
case "$1" in
    start)
        if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
            echo "⚠️  Daemon já está em execução"
            exit 1
        fi
        echo "🚀 Iniciando daemon do agente Git em segundo plano..."
        nohup "$0" daemon > /dev/null 2>&1 &
        sleep 2
        status_daemon
        ;;
    stop)
        stop_daemon
        ;;
    restart)
        stop_daemon
        sleep 2
        "$0" start
        ;;
    status)
        status_daemon
        ;;
    daemon)
        run_daemon
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status}"
        echo ""
        echo "Comandos:"
        echo "  start   - Inicia o daemon em segundo plano"
        echo "  stop    - Para o daemon"
        echo "  restart - Reinicia o daemon"
        echo "  status  - Verifica o status do daemon"
        exit 1
        ;;
esac
