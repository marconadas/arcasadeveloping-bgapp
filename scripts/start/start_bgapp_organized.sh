#!/bin/bash

echo "🚀 BGAPP - Sistema de Inicialização Organizado"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    print_error "Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

print_success "Docker está rodando ✓"

# Limpar containers antigos
print_status "Limpando containers antigos..."
docker container prune -f > /dev/null 2>&1

# Mapa de Portas e Serviços
echo ""
echo "📋 MAPA DE PORTAS E SERVIÇOS:"
echo "=============================="
echo "🌐 Frontend (Nginx):     http://localhost:8085"
echo "🔧 Admin Dashboard:      http://localhost:3000"  
echo "🚀 Admin API:            http://localhost:8000"
echo "🗄️  PostgreSQL:          localhost:5432"
echo "💾 MinIO:                http://localhost:9000 (Console: 9001)"
echo "🔄 Redis:                localhost:6379"
echo "📡 STAC API:             http://localhost:8081"
echo "🗺️  PyGeoAPI:            http://localhost:5080"
echo "📚 STAC Browser:         http://localhost:8082"
echo "🔐 Keycloak:             http://localhost:8083"
echo "🌸 Flower (Celery):      http://localhost:5555"
echo ""

# Passo 1: Iniciar infraestrutura base
print_status "Passo 1: Iniciando infraestrutura base..."
cd infra

# Verificar se existe arquivo .env
if [ ! -f ../.env ]; then
    print_warning "Arquivo .env não encontrado. Criando arquivo básico..."
    cat > ../.env << 'EOF'
POSTGRES_PASSWORD=postgres
MINIO_ACCESS_KEY=bgapp_admin
MINIO_SECRET_KEY=minio123
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
EOF
fi

# Iniciar serviços base primeiro (PostgreSQL, Redis, MinIO)
print_status "Iniciando serviços de dados (PostgreSQL, Redis, MinIO)..."
docker compose up -d postgis redis minio

# Aguardar serviços base ficarem prontos
print_status "Aguardando serviços base ficarem prontos..."
sleep 15

# Verificar saúde dos serviços base
print_status "Verificando saúde dos serviços base..."
for i in {1..30}; do
    if docker compose ps | grep -E "(postgis|redis|minio)" | grep -q "healthy\|Up"; then
        print_success "Serviços base prontos ✓"
        break
    fi
    if [ $i -eq 30 ]; then
        print_warning "Alguns serviços base podem não estar completamente prontos"
    fi
    sleep 2
done

# Passo 2: Iniciar serviços de aplicação
print_status "Passo 2: Iniciando serviços de aplicação..."
docker compose up -d admin-api stac pygeoapi keycloak

# Aguardar serviços de aplicação
sleep 10

# Passo 3: Iniciar serviços de interface
print_status "Passo 3: Iniciando serviços de interface..."
docker compose up -d stac-browser frontend

# Passo 4: Iniciar processamento assíncrono
print_status "Passo 4: Iniciando processamento assíncrono..."
docker compose up -d celery-worker celery-beat flower

print_success "Infraestrutura principal iniciada ✓"

# Passo 5: Iniciar Admin Dashboard (Next.js)
print_status "Passo 5: Iniciando Admin Dashboard..."
cd ../admin-dashboard

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    print_status "Instalando dependências do Admin Dashboard..."
    npm install
fi

# Construir e iniciar admin dashboard
print_status "Construindo Admin Dashboard..."
npm run build

print_status "Iniciando Admin Dashboard em modo desenvolvimento..."
npm run dev > ../logs/admin-dashboard.log 2>&1 &
ADMIN_PID=$!

# Aguardar um pouco para o dashboard iniciar
sleep 5

# Verificar se o processo está rodando
if kill -0 $ADMIN_PID 2>/dev/null; then
    print_success "Admin Dashboard iniciado (PID: $ADMIN_PID) ✓"
    echo $ADMIN_PID > ../logs/admin-dashboard.pid
else
    print_error "Falha ao iniciar Admin Dashboard"
fi

cd ..

# Status final
echo ""
print_status "Verificando status final dos serviços..."
echo ""

# Verificar containers Docker
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(infra|bgapp)"

echo ""
print_success "🎉 BGAPP iniciada com sucesso!"
echo ""
echo "📱 ACESSO AOS SERVIÇOS:"
echo "======================="
echo "🌐 Frontend Principal:   http://localhost:8085"
echo "🔧 Admin Dashboard:      http://localhost:3000"
echo "🚀 API Admin:            http://localhost:8000/docs"
echo "💾 MinIO Console:        http://localhost:9001"
echo "🔐 Keycloak Admin:       http://localhost:8083"
echo "🌸 Flower (Celery):      http://localhost:5555"
echo ""
echo "📋 Para parar todos os serviços:"
echo "================================="
echo "bash stop_bgapp_organized.sh"
echo ""
