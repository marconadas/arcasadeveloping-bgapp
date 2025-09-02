#!/bin/bash

# 📊 BGAPP System Monitor
# Monitorização contínua com dashboard em tempo real

echo "📊 BGAPP SYSTEM MONITOR"
echo "======================"
echo ""

# Função para mostrar status colorido
show_service_status() {
    local name="$1"
    local url="$2"
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo "  ✅ $name: ONLINE"
        return 0
    else
        echo "  ❌ $name: OFFLINE"
        return 1
    fi
}

# Função para mostrar dashboard
show_dashboard() {
    clear
    echo "🖥️  BGAPP DASHBOARD - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=================================================="
    echo ""
    
    # Contadores
    local online=0
    local total=6
    
    echo "🌐 SERVIÇOS HTTP:"
    show_service_status "Frontend Principal" "http://localhost:8085" && ((online++))
    show_service_status "Admin Panel" "http://localhost:8085/admin.html" && ((online++))
    show_service_status "Admin API" "http://localhost:8000/admin-api/services/status" && ((online++))
    show_service_status "PyGeoAPI" "http://localhost:5080/collections" && ((online++))
    show_service_status "MinIO" "http://localhost:9000/minio/health/live" && ((online++))
    show_service_status "STAC API" "http://localhost:8081/health" && ((online++))
    
    echo ""
    echo "📊 RESUMO: $online/$total serviços online ($(( online * 100 / total ))%)"
    
    # Status dos containers
    echo ""
    echo "🐳 CONTAINERS DOCKER:"
    docker compose -f infra/docker-compose.yml ps --format "  {{.Name}}: {{.Status}}" 2>/dev/null | head -8
    
    # Processos Python
    echo ""
    echo "🐍 PROCESSOS PYTHON:"
    if pgrep -f admin_api_simple.py > /dev/null; then
        echo "  ✅ Admin API Simple: RODANDO (PID: $(pgrep -f admin_api_simple.py))"
    else
        echo "  ❌ Admin API Simple: PARADO"
    fi
    
    if pgrep -f auto_recovery.py > /dev/null; then
        echo "  ✅ Auto Recovery: RODANDO (PID: $(pgrep -f auto_recovery.py))"
    else
        echo "  ❌ Auto Recovery: PARADO"
    fi
    
    # URLs de acesso
    echo ""
    echo "🔗 URLS DE ACESSO:"
    echo "  📊 Frontend: http://localhost:8085"
    echo "  ⚙️  Admin Panel: http://localhost:8085/admin.html"
    echo "  🔧 Admin API: http://localhost:8000"
    echo ""
    echo "📋 PRESSIONE Ctrl+C PARA PARAR MONITORIZAÇÃO"
    echo "=================================================="
}

# Loop principal de monitorização
while true; do
    show_dashboard
    sleep 30
done
