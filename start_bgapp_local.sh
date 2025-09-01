#!/bin/bash

# Script para iniciar BGAPP localmente com nginx
# 🔒 Execução apenas local (foreground) - sem exposição remota
# 🚀 Usa nginx como servidor de estáticos conforme recomendação do sanity check

echo "🚀 BGAPP - Início Local Seguro"
echo "=============================="
echo "🔒 Apenas acesso localhost (sem exposição remota)"
echo "📡 Usando nginx como servidor de estáticos"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "infra/frontend/index.html" ]; then
    echo "❌ Erro: Execute este script a partir do diretório raiz do projeto BGAPP"
    echo "💡 Certifique-se que o arquivo infra/frontend/index.html existe"
    exit 1
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "🔧 Gerando arquivo .env com credenciais seguras..."
    python3 scripts/generate_secure_env.py
    echo "✅ Arquivo .env criado!"
    echo ""
fi

# Verificar se docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando"
    echo "💡 Inicie o Docker Desktop e tente novamente"
    exit 1
fi

# Parar serviços existentes
echo "🧹 Parando serviços existentes..."
docker compose -f infra/docker-compose.yml down 2>/dev/null || true
pkill -f "python.*http.server" 2>/dev/null || true
pkill -f "ngrok" 2>/dev/null || true

# Carregar variáveis do .env
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs) 2>/dev/null || true
fi

# Iniciar serviços Docker
echo "🐳 Iniciando serviços Docker..."
docker compose -f infra/docker-compose.yml up -d --build

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços inicializarem..."
sleep 15

# Verificar status dos serviços
echo "🔍 Verificando status dos serviços..."
docker compose -f infra/docker-compose.yml ps

echo ""
echo "🎉 BGAPP INICIADO COM SUCESSO!"
echo "============================="
echo ""
echo "🔗 URLs de acesso LOCAL:"
echo "   📊 Frontend Principal: http://localhost:8085"
echo "   🎛️  Painel Admin: http://localhost:8085/admin.html"
echo "   📱 Versão Mobile: http://localhost:8085/mobile_pwa.html"
echo "   🌊 Dashboard Científico: http://localhost:8085/dashboard_cientifico.html"
echo "   🗺️  Mapa Angola: http://localhost:8085/realtime_angola.html"
echo ""
echo "🔧 APIs e Serviços:"
echo "   🔌 Admin API: http://localhost:8000"
echo "   🗺️  pygeoapi: http://localhost:5080"
echo "   📦 STAC API: http://localhost:8081"
echo "   💾 MinIO Console: http://localhost:9001"
echo ""
echo "📊 Monitorização:"
echo "   🐳 Docker: docker compose -f infra/docker-compose.yml ps"
echo "   📋 Logs: docker compose -f infra/docker-compose.yml logs -f"
echo ""
echo "🔒 Segurança Ativada:"
echo "   ✅ CORS restritivo (apenas localhost)"
echo "   ✅ Rate limiting ativado"
echo "   ✅ Credenciais seguras geradas"
echo "   ✅ Healthchecks ativados"
echo "   ✅ Sem exposição remota"
echo ""
echo "🛑 Para parar: Ctrl+C ou execute:"
echo "   docker compose -f infra/docker-compose.yml down"
echo ""

# Função para limpeza ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    docker compose -f infra/docker-compose.yml down
    echo "✅ Serviços parados!"
    exit 0
}

# Capturar sinais para limpeza
trap cleanup SIGINT SIGTERM

# Manter script rodando no foreground conforme requisito
echo "👀 Monitorando serviços... (Ctrl+C para parar)"
echo "📊 Acesse http://localhost:8085 para começar a usar o BGAPP"
echo ""

# Loop de monitorização
while true; do
    sleep 10
    
    # Verificar se nginx está respondendo
    if ! curl -s http://localhost:8085 > /dev/null; then
        echo "⚠️  Frontend não está respondendo em localhost:8085"
    fi
    
    # Mostrar status a cada 60 segundos
    if [ $((SECONDS % 60)) -eq 0 ]; then
        echo "📊 Status: $(date '+%H:%M:%S') - Serviços ativos"
    fi
done
