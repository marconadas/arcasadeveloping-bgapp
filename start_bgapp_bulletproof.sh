#!/bin/bash

# 🛡️ BGAPP Bulletproof Startup Script
# Sistema à prova de falhas para inicialização completa do BGAPP
# Garante que todos os serviços estejam online e funcionando

set -euo pipefail

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configurações
MAX_RETRIES=5
HEALTH_CHECK_INTERVAL=10
STARTUP_TIMEOUT=300

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

success() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

# Verificar pré-requisitos
check_prerequisites() {
    log "🔍 Verificando pré-requisitos..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        error "Docker não encontrado! Instale o Docker primeiro."
        exit 1
    fi
    
    # Verificar se Docker está rodando
    if ! docker info > /dev/null 2>&1; then
        error "Docker não está rodando! Inicie o Docker Desktop."
        exit 1
    fi
    
    # Verificar docker-compose
    if ! docker compose version &> /dev/null; then
        error "docker compose não encontrado!"
        exit 1
    fi
    
    # Verificar Python
    if ! command -v python3 &> /dev/null; then
        error "Python3 não encontrado!"
        exit 1
    fi
    
    success "✅ Todos os pré-requisitos atendidos"
}

# Parar serviços existentes
stop_existing_services() {
    log "🧹 Parando serviços existentes..."
    
    # Parar containers Docker
    docker compose -f infra/docker-compose.yml down --remove-orphans 2>/dev/null || true
    
    # Parar processos Python
    pkill -f "python.*http.server" 2>/dev/null || true
    pkill -f "admin_api_simple.py" 2>/dev/null || true
    pkill -f "uvicorn" 2>/dev/null || true
    
    # Aguardar limpeza
    sleep 3
    
    success "✅ Serviços existentes parados"
}

# Verificar saúde de um serviço
check_service_health() {
    local service_name="$1"
    local url="$2"
    local max_attempts="$3"
    
    for ((i=1; i<=max_attempts; i++)); do
        if curl -f -s "$url" > /dev/null 2>&1; then
            return 0
        fi
        
        if [ $i -lt $max_attempts ]; then
            info "Tentativa $i/$max_attempts para $service_name falhou, tentando novamente..."
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    return 1
}

# Verificar PostgreSQL
check_postgres_health() {
    local max_attempts="$1"
    
    for ((i=1; i<=max_attempts; i++)); do
        if docker compose -f infra/docker-compose.yml exec -T postgis pg_isready -U postgres > /dev/null 2>&1; then
            return 0
        fi
        
        if [ $i -lt $max_attempts ]; then
            info "Tentativa $i/$max_attempts para PostgreSQL falhou, tentando novamente..."
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    return 1
}

# Iniciar serviços Docker
start_docker_services() {
    log "🐳 Iniciando serviços Docker..."
    
    # Iniciar serviços básicos primeiro
    info "Iniciando serviços base..."
    docker compose -f infra/docker-compose.yml up -d postgis redis minio
    
    # Aguardar serviços base ficarem prontos
    info "⏳ Aguardando serviços base..."
    
    # Verificar PostgreSQL
    if check_postgres_health $MAX_RETRIES; then
        success "✅ PostgreSQL online"
    else
        error "❌ PostgreSQL falhou ao iniciar"
        return 1
    fi
    
    # Verificar Redis
    if check_service_health "Redis" "http://localhost:6379" $MAX_RETRIES; then
        success "✅ Redis online"
    else
        warn "⚠️ Redis pode não estar totalmente pronto"
    fi
    
    # Verificar MinIO
    if check_service_health "MinIO" "http://localhost:9000/minio/health/live" $MAX_RETRIES; then
        success "✅ MinIO online"
    else
        warn "⚠️ MinIO pode não estar totalmente pronto"
    fi
    
    # Iniciar serviços de aplicação
    info "Iniciando serviços de aplicação..."
    docker compose -f infra/docker-compose.yml up -d stac pygeoapi stac-browser keycloak
    
    # Aguardar serviços de aplicação
    sleep 15
    
    # Verificar PyGeoAPI
    if check_service_health "PyGeoAPI" "http://localhost:5080/collections" $MAX_RETRIES; then
        success "✅ PyGeoAPI online"
    else
        error "❌ PyGeoAPI falhou ao iniciar"
        return 1
    fi
    
    # Iniciar frontend
    info "Iniciando frontend..."
    docker compose -f infra/docker-compose.yml up -d frontend
    
    # Aguardar frontend
    sleep 10
    
    # Verificar frontend
    if check_service_health "Frontend" "http://localhost:8085" $MAX_RETRIES; then
        success "✅ Frontend online"
    else
        error "❌ Frontend falhou ao iniciar"
        return 1
    fi
    
    success "✅ Serviços Docker iniciados com sucesso"
    return 0
}

# Iniciar Admin API
start_admin_api() {
    log "🔧 Iniciando Admin API..."
    
    # Parar qualquer instância existente
    pkill -f "admin_api_simple.py" 2>/dev/null || true
    sleep 2
    
    # Iniciar nova instância
    nohup python3 admin_api_simple.py > logs/admin_api.log 2>&1 &
    local admin_pid=$!
    
    # Aguardar inicialização
    sleep 5
    
    # Verificar se está funcionando
    if check_service_health "Admin API" "http://localhost:8000/admin-api/services/status" $MAX_RETRIES; then
        success "✅ Admin API online (PID: $admin_pid)"
        echo $admin_pid > logs/admin_api.pid
        return 0
    else
        error "❌ Admin API falhou ao iniciar"
        return 1
    fi
}

# Executar testes de saúde completos
run_health_tests() {
    log "🏥 Executando testes de saúde completos..."
    
    local services=(
        "Frontend:http://localhost:8085"
        "Admin API:http://localhost:8000/admin-api/services/status"
        "PyGeoAPI:http://localhost:5080/collections"
        "MinIO:http://localhost:9000/minio/health/live"
    )
    
    local failed_services=()
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r name url <<< "$service_info"
        
        if check_service_health "$name" "$url" 3; then
            success "✅ $name: OK"
        else
            error "❌ $name: FALHOU"
            failed_services+=("$name")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        success "🎉 Todos os serviços passaram nos testes de saúde!"
        return 0
    else
        error "❌ Serviços com falha: ${failed_services[*]}"
        return 1
    fi
}

# Iniciar monitor de saúde
start_health_monitor() {
    log "🔍 Iniciando monitor de saúde..."
    
    # Instalar dependências se necessário
    if ! python3 -c "import aiohttp, docker, psutil" 2>/dev/null; then
        warn "Instalando dependências do monitor..."
        pip3 install aiohttp docker psutil 2>/dev/null || true
    fi
    
    # Iniciar monitor em background
    nohup python3 scripts/health_monitor.py > logs/health_monitor.log 2>&1 &
    local monitor_pid=$!
    echo $monitor_pid > logs/health_monitor.pid
    
    success "✅ Monitor de saúde iniciado (PID: $monitor_pid)"
}

# Mostrar informações finais
show_final_info() {
    echo ""
    echo "🎉 BGAPP INICIADO COM SUCESSO!"
    echo "==============================="
    echo ""
    echo "🔗 URLS DE ACESSO:"
    echo "   📊 Frontend Principal: http://localhost:8085"
    echo "   ⚙️  Admin Panel: http://localhost:8085/admin.html"
    echo "   🗄️  Admin API: http://localhost:8000"
    echo "   🌍 PyGeoAPI: http://localhost:5080"
    echo "   💾 MinIO Console: http://localhost:9001 (minio/minio123)"
    echo "   🔍 STAC Browser: http://localhost:8082"
    echo "   🔐 Keycloak: http://localhost:8083 (admin/admin)"
    echo ""
    echo "📊 STATUS DOS SERVIÇOS:"
    echo "   ✅ Sistema de monitorização ativo"
    echo "   ✅ Recuperação automática habilitada"
    echo "   ✅ Logs detalhados em logs/"
    echo ""
    echo "📋 COMANDOS ÚTEIS:"
    echo "   • Ver status: curl http://localhost:8000/admin-api/services/status"
    echo "   • Ver logs: docker compose -f infra/docker-compose.yml logs -f [serviço]"
    echo "   • Parar tudo: docker compose -f infra/docker-compose.yml down"
    echo ""
    echo "🔍 MONITORIZAÇÃO:"
    echo "   • Logs do monitor: tail -f logs/health_monitor.log"
    echo "   • Relatórios: cat reports/health_report.json"
    echo ""
    echo "🛑 Para parar completamente: Ctrl+C ou ./stop_bgapp.sh"
    echo "==============================="
}

# Função principal
main() {
    echo "🛡️ BGAPP BULLETPROOF STARTUP"
    echo "============================"
    echo ""
    
    # Criar diretórios necessários
    mkdir -p logs reports
    
    # Executar passos
    check_prerequisites || exit 1
    stop_existing_services || exit 1
    
    if start_docker_services; then
        info "Docker services started successfully"
    else
        error "Failed to start Docker services"
        exit 1
    fi
    
    if start_admin_api; then
        info "Admin API started successfully"
    else
        error "Failed to start Admin API"
        exit 1
    fi
    
    # Aguardar estabilização
    info "⏳ Aguardando estabilização do sistema..."
    sleep 15
    
    if run_health_tests; then
        info "Health tests passed"
    else
        warn "Some health tests failed, but continuing..."
    fi
    
    start_health_monitor
    show_final_info
    
    # Manter script rodando
    info "👀 Sistema iniciado. Pressione Ctrl+C para parar..."
    
    # Trap para limpeza
    trap 'echo ""; log "🛑 Parando sistema..."; docker compose -f infra/docker-compose.yml down; pkill -f health_monitor.py; pkill -f admin_api_simple.py; exit 0' INT TERM
    
    # Loop infinito
    while true; do
        sleep 30
        
        # Verificar se serviços críticos ainda estão rodando
        if ! curl -f -s http://localhost:8085 > /dev/null 2>&1; then
            warn "Frontend offline, tentando recuperar..."
            docker compose -f infra/docker-compose.yml restart frontend
        fi
        
        if ! curl -f -s http://localhost:8000/admin-api/services/status > /dev/null 2>&1; then
            warn "Admin API offline, tentando recuperar..."
            pkill -f admin_api_simple.py 2>/dev/null || true
            sleep 2
            nohup python3 admin_api_simple.py > logs/admin_api.log 2>&1 &
        fi
    done
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
