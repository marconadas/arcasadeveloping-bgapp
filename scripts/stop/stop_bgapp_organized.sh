#!/bin/bash

echo "🛑 BGAPP - Sistema de Parada Organizado"
echo "========================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Parar Admin Dashboard (Next.js)
print_status "Parando Admin Dashboard..."
if [ -f logs/admin-dashboard.pid ]; then
    PID=$(cat logs/admin-dashboard.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        print_success "Admin Dashboard parado (PID: $PID) ✓"
    else
        print_warning "Admin Dashboard já estava parado"
    fi
    rm -f logs/admin-dashboard.pid
else
    # Tentar encontrar processo Node.js do Next.js
    NEXT_PID=$(pgrep -f "next-server" | head -1)
    if [ ! -z "$NEXT_PID" ]; then
        kill $NEXT_PID
        print_success "Admin Dashboard parado (PID: $NEXT_PID) ✓"
    fi
fi

# Parar containers Docker da infraestrutura
print_status "Parando containers da infraestrutura..."
cd infra
docker compose down

# Parar container do admin dashboard se existir
print_status "Parando container do admin dashboard..."
cd ../admin-dashboard
docker compose down 2>/dev/null || true

cd ..

# Limpar containers órfãos
print_status "Limpando containers órfãos..."
docker container prune -f > /dev/null 2>&1

print_success "🎉 Todos os serviços BGAPP foram parados!"
echo ""
echo "Para reiniciar: bash start_bgapp_organized.sh"
echo ""
