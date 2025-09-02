#!/bin/bash

# 🚀 BGAPP Complete Startup Script
# Preparação para apresentação 17 de setembro

set -e  # Parar se houver erro

echo "🚀 BGAPP - Iniciando Sistema Completo"
echo "============================================"
echo "📅 Preparação para apresentação: 17 de setembro"
echo "============================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Parar todos os processos existentes
log_info "Parando processos existentes..."
pkill -f "python.*admin_api" || true
pkill -f "npm.*dev" || true
docker compose -f infra/docker-compose.yml down -v || true

# 2. Limpar logs antigos
log_info "Limpando logs antigos..."
rm -f logs/*.log || true
rm -f *.log || true

# 3. Iniciar infraestrutura Docker
log_info "Iniciando infraestrutura Docker..."
cd infra

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    log_error "Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

# Construir e iniciar serviços essenciais primeiro
log_info "Construindo imagens Docker..."
docker compose build admin-api

log_info "Iniciando serviços de base (PostgreSQL, Redis, MinIO)..."
docker compose up -d postgis redis minio

# Aguardar serviços básicos estarem prontos
log_info "Aguardando serviços básicos..."
sleep 10

# Verificar saúde dos serviços básicos
log_info "Verificando saúde dos serviços..."
for i in {1..30}; do
    if docker compose ps | grep -q "healthy.*postgis" && \
       docker compose ps | grep -q "healthy.*redis"; then
        log_success "Serviços básicos prontos!"
        break
    fi
    echo -n "."
    sleep 2
done

# 4. Iniciar serviços de aplicação
log_info "Iniciando serviços de aplicação..."
docker compose up -d stac pygeoapi keycloak

# 5. Testar e corrigir Redis Cache
cd ..
log_info "Testando Redis Cache..."
python3 fix_redis_cache.py

# 6. Iniciar API backend
log_info "Iniciando API backend..."
export PYTHONPATH=$(pwd)/src
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=geo
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export REDIS_HOST=localhost
export REDIS_PORT=6379
export MINIO_ENDPOINT=localhost:9000
export MINIO_ACCESS_KEY=bgapp_admin
export MINIO_SECRET_KEY=minio123

# Ativar ambiente virtual se existir
if [ -d ".venv" ]; then
    log_info "Ativando ambiente virtual..."
    source .venv/bin/activate
fi

# Instalar dependências se necessário
if [ ! -f ".deps_installed" ]; then
    log_info "Instalando dependências Python..."
    pip install -r requirements.txt
    touch .deps_installed
fi

# Iniciar admin API
log_info "Iniciando Admin API (admin_api_complete.py)..."
nohup python3 admin_api_complete.py > admin_api.log 2>&1 &
API_PID=$!

# 7. Iniciar Frontend NextJS
log_info "Iniciando Frontend NextJS..."
cd admin-dashboard

# Instalar dependências npm se necessário
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependências npm..."
    npm install
fi

# Iniciar frontend
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

cd ..

# 8. Iniciar serviços Docker restantes
log_info "Iniciando serviços Docker restantes..."
cd infra
docker compose up -d celery-worker celery-beat flower frontend stac-browser

# 9. Aguardar tudo estar pronto
log_info "Aguardando todos os serviços..."
sleep 15

# 10. Verificar status de todos os serviços
log_info "Verificando status dos serviços..."
cd ..

# Verificar API
if curl -s http://localhost:8000/health > /dev/null; then
    log_success "✅ Admin API: http://localhost:8000"
else
    log_error "❌ Admin API falhou"
fi

# Verificar Frontend
if curl -s http://localhost:3000 > /dev/null; then
    log_success "✅ Frontend: http://localhost:3000"
else
    log_error "❌ Frontend falhou"
fi

# Verificar serviços Docker
echo ""
log_info "Status dos serviços Docker:"
cd infra && docker compose ps

cd ..

# 11. Salvar PIDs para fácil cleanup
echo $API_PID > .api_pid
echo $FRONTEND_PID > .frontend_pid

echo ""
echo "🎉 BGAPP Sistema Completo Iniciado!"
echo "============================================"
echo "🌐 Frontend Admin Dashboard: http://localhost:3000"
echo "🔧 Admin API: http://localhost:8000"
echo "📊 Admin API Docs: http://localhost:8000/docs"
echo "🗺️  Portal MINPERMAR: http://localhost:8085"
echo "📁 MinIO Storage: http://localhost:9001"
echo "🔑 Keycloak: http://localhost:8083"
echo "🌊 STAC Browser: http://localhost:8082"
echo "🌍 PyGeoAPI: http://localhost:5080"
echo "🌺 Flower (Celery): http://localhost:5555"
echo "============================================"
echo "📅 Sistema pronto para apresentação dia 17!"
echo "============================================"

# Monitorar logs
log_info "Monitorando logs (Ctrl+C para parar)..."
tail -f admin_api.log frontend.log
