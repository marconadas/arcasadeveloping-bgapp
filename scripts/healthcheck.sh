#!/bin/bash

# 🏥 BGAPP Healthcheck Script
# Verifica saúde de todos os serviços e corrige problemas automaticamente

echo "🏥 BGAPP Healthcheck - $(date)"
echo "================================"

# Função para verificar serviço HTTP
check_http_service() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    if curl -f -s "$url" | grep -q "$expected" 2>/dev/null; then
        echo "  ✅ $name: OK"
        return 0
    else
        echo "  ❌ $name: FALHOU"
        return 1
    fi
}

# Verificar serviços críticos
echo "🔍 Verificando serviços críticos..."

check_http_service "Frontend" "http://localhost:8085" "BGAPP"
check_http_service "Admin Panel" "http://localhost:8085/admin.html" "Administrativo"
check_http_service "Admin API" "http://localhost:8000/admin-api/services/status" "services"
check_http_service "PyGeoAPI" "http://localhost:5080/collections" "collections"

# Verificar containers Docker
echo ""
echo "🐳 Verificando containers..."
docker compose -f infra/docker-compose.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Reiniciar serviços problemáticos
echo ""
echo "🔧 Verificando e corrigindo problemas..."

# Se admin API não responde, reiniciar
if ! curl -f -s http://localhost:8000/admin-api/services/status > /dev/null 2>&1; then
    echo "🔄 Reiniciando Admin API..."
    pkill -f admin_api_simple.py 2>/dev/null || true
    sleep 2
    python3 admin_api_simple.py &
    echo "✅ Admin API reiniciado"
fi

# Se frontend não responde, reiniciar container
if ! curl -f -s http://localhost:8085 > /dev/null 2>&1; then
    echo "🔄 Reiniciando Frontend..."
    docker compose -f infra/docker-compose.yml restart frontend
    echo "✅ Frontend reiniciado"
fi

echo ""
echo "✅ Healthcheck completo!"
