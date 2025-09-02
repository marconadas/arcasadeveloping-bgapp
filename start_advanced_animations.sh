#!/bin/bash

# BGAPP Advanced Animation System Startup Script
# Sistema de inicialização para as novas funcionalidades de animação

echo "🚀 BGAPP - Sistema Avançado de Animações"
echo "========================================"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do BGAPP"
    exit 1
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências npm..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências"
        exit 1
    fi
fi

# Verificar se o Python está disponível
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale o Python3 para continuar."
    exit 1
fi

# Verificar dependências Python
echo "🐍 Verificando dependências Python..."
python3 -c "import flask, requests" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Instalando dependências Python..."
    pip3 install flask requests python-dotenv
fi

# Criar diretório de logs se não existir
mkdir -p logs

# Função para iniciar o backend
start_backend() {
    echo "🔧 Iniciando backend BGAPP..."
    
    # Verificar se o arquivo de configuração existe
    if [ ! -f "src/bgapp/core/config.py" ]; then
        echo "⚠️  Arquivo de configuração não encontrado, usando configuração padrão"
    fi
    
    # Iniciar o backend em background
    python3 -m src.bgapp.main > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend iniciado (PID: $BACKEND_PID)"
    
    # Aguardar backend inicializar
    echo "⏳ Aguardando backend inicializar..."
    sleep 5
    
    # Verificar se backend está rodando
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend iniciado com sucesso"
    else
        echo "⚠️  Backend pode não estar totalmente inicializado"
    fi
}

# Função para iniciar servidor web simples
start_webserver() {
    echo "🌐 Iniciando servidor web para demonstração..."
    
    # Navegar para o diretório frontend
    cd infra/frontend
    
    # Iniciar servidor Python simples
    python3 -m http.server 8080 > ../../logs/webserver.log 2>&1 &
    WEBSERVER_PID=$!
    echo "Servidor web iniciado (PID: $WEBSERVER_PID)"
    
    cd ../..
}

# Função para abrir o navegador
open_browser() {
    echo "🌍 Abrindo demonstração no navegador..."
    
    # Aguardar servidor inicializar
    sleep 2
    
    # Tentar abrir no navegador padrão
    if command -v open &> /dev/null; then
        # macOS
        open "http://localhost:8080/advanced-animations-demo.html"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "http://localhost:8080/advanced-animations-demo.html"
    elif command -v start &> /dev/null; then
        # Windows
        start "http://localhost:8080/advanced-animations-demo.html"
    else
        echo "📱 Abra manualmente: http://localhost:8080/advanced-animations-demo.html"
    fi
}

# Função para mostrar informações de uso
show_usage() {
    echo ""
    echo "📋 INFORMAÇÕES DE USO:"
    echo "====================="
    echo ""
    echo "🌐 Demonstração: http://localhost:8080/advanced-animations-demo.html"
    echo "🔧 API Backend:   http://localhost:8000"
    echo "📊 Health Check:  http://localhost:8000/health"
    echo ""
    echo "🎮 CONTROLES DA DEMONSTRAÇÃO:"
    echo "• Espaço - Pausar/Iniciar animações"
    echo "• R - Reset da visualização"
    echo "• N - Mostrar notificação"
    echo ""
    echo "📁 LOGS:"
    echo "• Backend: logs/backend.log"
    echo "• Servidor Web: logs/webserver.log"
    echo ""
    echo "🛑 Para parar os serviços: Ctrl+C ou execute ./stop_advanced_animations.sh"
    echo ""
}

# Função para criar script de parada
create_stop_script() {
    cat > stop_advanced_animations.sh << 'EOF'
#!/bin/bash

echo "🛑 Parando BGAPP Advanced Animation System..."

# Matar processos por porta
kill_by_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        kill $pid
        echo "Processo na porta $port parado (PID: $pid)"
    fi
}

# Parar backend (porta 8000)
kill_by_port 8000

# Parar servidor web (porta 8080)
kill_by_port 8080

# Matar processos Python relacionados ao BGAPP
pkill -f "bgapp"
pkill -f "http.server 8080"

echo "✅ Todos os serviços foram parados"
EOF

    chmod +x stop_advanced_animations.sh
}

# Função para verificar portas
check_ports() {
    echo "🔍 Verificando portas..."
    
    if lsof -i:8000 > /dev/null 2>&1; then
        echo "⚠️  Porta 8000 já está em uso"
        echo "   Execute: lsof -i:8000 para ver o processo"
        echo "   Ou execute: ./stop_advanced_animations.sh"
    fi
    
    if lsof -i:8080 > /dev/null 2>&1; then
        echo "⚠️  Porta 8080 já está em uso"
        echo "   Execute: lsof -i:8080 para ver o processo"
        echo "   Ou execute: ./stop_advanced_animations.sh"
    fi
}

# Menu principal
show_menu() {
    echo ""
    echo "Escolha uma opção:"
    echo "1. Iniciar tudo (Backend + Frontend + Abrir navegador)"
    echo "2. Apenas Frontend (Demonstração)"
    echo "3. Apenas Backend"
    echo "4. Verificar status dos serviços"
    echo "5. Mostrar informações de uso"
    echo "6. Sair"
    echo ""
    read -p "Digite sua escolha (1-6): " choice
}

# Função principal
main() {
    # Verificar portas em uso
    check_ports
    
    # Criar script de parada
    create_stop_script
    
    # Mostrar menu
    while true; do
        show_menu
        
        case $choice in
            1)
                echo ""
                echo "🚀 Iniciando sistema completo..."
                start_backend
                start_webserver
                show_usage
                open_browser
                echo ""
                echo "✅ Sistema iniciado com sucesso!"
                echo "   Pressione Ctrl+C para parar os serviços"
                
                # Aguardar interrupção
                trap 'echo ""; echo "🛑 Parando serviços..."; ./stop_advanced_animations.sh; exit 0' INT
                while true; do sleep 1; done
                ;;
            2)
                echo ""
                echo "🌐 Iniciando apenas demonstração frontend..."
                start_webserver
                show_usage
                open_browser
                echo ""
                echo "✅ Demonstração iniciada!"
                echo "   Pressione Ctrl+C para parar"
                
                trap 'echo ""; echo "🛑 Parando servidor web..."; kill_by_port 8080; exit 0' INT
                while true; do sleep 1; done
                ;;
            3)
                echo ""
                echo "🔧 Iniciando apenas backend..."
                start_backend
                show_usage
                echo ""
                echo "✅ Backend iniciado!"
                echo "   Pressione Ctrl+C para parar"
                
                trap 'echo ""; echo "🛑 Parando backend..."; kill_by_port 8000; exit 0' INT
                while true; do sleep 1; done
                ;;
            4)
                echo ""
                echo "📊 Status dos serviços:"
                echo "======================"
                
                if curl -s http://localhost:8000/health > /dev/null 2>&1; then
                    echo "✅ Backend: Rodando (http://localhost:8000)"
                else
                    echo "❌ Backend: Parado"
                fi
                
                if curl -s http://localhost:8080 > /dev/null 2>&1; then
                    echo "✅ Frontend: Rodando (http://localhost:8080)"
                else
                    echo "❌ Frontend: Parado"
                fi
                ;;
            5)
                show_usage
                ;;
            6)
                echo "👋 Até logo!"
                exit 0
                ;;
            *)
                echo "❌ Opção inválida. Tente novamente."
                ;;
        esac
        
        if [ "$choice" != "4" ] && [ "$choice" != "5" ]; then
            break
        fi
    done
}

# Executar função principal
main
