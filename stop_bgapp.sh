#!/bin/bash

# 🛑 BGAPP Stop Script
# Para todos os serviços BGAPP de forma limpa e segura

set -euo pipefail

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

echo "🛑 BGAPP STOP SCRIPT"
echo "==================="
echo ""

# Parar watchdog e monitor
log "🐕 Parando watchdog e monitor de saúde..."
if [ -f "logs/health_monitor.pid" ]; then
    pid=$(cat logs/health_monitor.pid)
    kill $pid 2>/dev/null || true
    rm -f logs/health_monitor.pid
    log "✅ Health monitor parado (PID: $pid)"
fi

if [ -f "logs/watchdog.pid" ]; then
    pid=$(cat logs/watchdog.pid)
    kill $pid 2>/dev/null || true
    rm -f logs/watchdog.pid
    log "✅ Watchdog parado (PID: $pid)"
fi

# Parar processos Python
log "🐍 Parando processos Python..."
pkill -f "health_monitor.py" 2>/dev/null || true
pkill -f "service_watchdog.py" 2>/dev/null || true
pkill -f "admin_api_simple.py" 2>/dev/null || true
pkill -f "python.*http.server" 2>/dev/null || true

if [ -f "logs/admin_api.pid" ]; then
    pid=$(cat logs/admin_api.pid)
    kill $pid 2>/dev/null || true
    rm -f logs/admin_api.pid
    log "✅ Admin API parado (PID: $pid)"
fi

# Parar containers Docker
log "🐳 Parando containers Docker..."
if docker compose version &> /dev/null; then
    docker compose -f infra/docker-compose.yml down --remove-orphans 2>/dev/null || true
    log "✅ Containers Docker parados"
else
    warn "docker compose não encontrado, tentando parar containers manualmente..."
    docker stop $(docker ps -q --filter "name=infra-") 2>/dev/null || true
fi

# Limpar arquivos temporários
log "🧹 Limpando arquivos temporários..."
rm -f logs/*.pid 2>/dev/null || true

# Verificar se ainda há processos rodando
log "🔍 Verificando processos restantes..."
remaining_processes=$(ps aux | grep -E "(admin_api|health_monitor|watchdog)" | grep -v grep | wc -l)

if [ $remaining_processes -gt 0 ]; then
    warn "⚠️ Ainda existem $remaining_processes processos relacionados ao BGAPP"
    ps aux | grep -E "(admin_api|health_monitor|watchdog)" | grep -v grep || true
else
    log "✅ Todos os processos BGAPP foram parados"
fi

# Verificar portas
log "🔌 Verificando portas..."
occupied_ports=$(netstat -an 2>/dev/null | grep LISTEN | grep -E "(8085|8000|5080)" | wc -l)

if [ $occupied_ports -gt 0 ]; then
    warn "⚠️ Algumas portas ainda estão ocupadas:"
    netstat -an 2>/dev/null | grep LISTEN | grep -E "(8085|8000|5080)" || true
else
    log "✅ Todas as portas BGAPP foram liberadas"
fi

echo ""
echo "🎉 BGAPP PARADO COM SUCESSO!"
echo "============================"
echo ""
echo "📋 RESUMO:"
echo "   ✅ Watchdog e monitor parados"
echo "   ✅ Processos Python terminados"
echo "   ✅ Containers Docker parados"
echo "   ✅ Arquivos temporários limpos"
echo ""
echo "📁 LOGS PRESERVADOS:"
echo "   • logs/admin_api.log"
echo "   • logs/health_monitor.log"
echo "   • logs/watchdog.log"
echo "   • reports/health_report.json"
echo ""
echo "🚀 Para reiniciar: ./start_bgapp_bulletproof.sh"
echo "============================"
