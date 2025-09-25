#!/bin/bash

# Script de Sanity Check para ngrok
echo "🔍 NGROK SANITY CHECK"
echo "===================="

# 1. Verificar versão do ngrok
echo "📦 Versão do ngrok:"
ngrok version
echo ""

# 2. Verificar se há processos rodando
echo "🔄 Processos ngrok ativos:"
ps aux | grep ngrok | grep -v grep || echo "Nenhum processo ngrok ativo"
echo ""

# 3. Verificar portas em uso
echo "🔌 Portas relevantes em uso:"
echo "Porta 4040 (ngrok API):"
lsof -i :4040 || echo "Porta 4040 livre"
echo "Porta 8080:"
lsof -i :8080 || echo "Porta 8080 livre"
echo "Porta 8090:"
lsof -i :8090 || echo "Porta 8090 livre"
echo ""

# 4. Limpar processos órfãos
echo "🧹 Limpando processos órfãos..."
pkill -f ngrok 2>/dev/null || true
pkill -f "python.*http.server" 2>/dev/null || true
sleep 2

# 5. Iniciar servidor HTTP
echo "🚀 Iniciando servidor HTTP na porta 8080..."
cd infra/frontend
python3 -m http.server 8080 > /dev/null 2>&1 &
SERVER_PID=$!
cd - > /dev/null

# Aguardar servidor inicializar
sleep 3

# 6. Testar servidor local
echo "🌐 Testando servidor local..."
if curl -s http://localhost:8080/admin.html | head -1 | grep -q "DOCTYPE"; then
    echo "✅ Servidor local funcionando!"
else
    echo "❌ Servidor local com problema"
    exit 1
fi

# 7. Iniciar ngrok com configurações específicas
echo "🔗 Iniciando ngrok..."
ngrok http 8080 --web-addr=localhost:4040 > /dev/null 2>&1 &
NGROK_PID=$!

# Aguardar ngrok inicializar
echo "⏳ Aguardando ngrok inicializar (10 segundos)..."
sleep 10

# 8. Verificar se a API do ngrok está respondendo
echo "🔍 Testando API do ngrok..."
for i in {1..5}; do
    if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
        echo "✅ API do ngrok respondendo!"
        break
    else
        echo "⏳ Tentativa $i/5 - Aguardando API..."
        sleep 2
    fi
done

# 9. Obter informações dos túneis
echo ""
echo "📊 Informações dos túneis:"
if command -v jq &> /dev/null; then
    TUNNELS=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null)
    if [ ! -z "$TUNNELS" ] && [ "$TUNNELS" != "null" ]; then
        echo "$TUNNELS" | jq -r '.tunnels[] | "🌐 " + .public_url + " -> " + .config.addr'
        
        # Extrair URL principal
        PUBLIC_URL=$(echo "$TUNNELS" | jq -r '.tunnels[0].public_url // empty')
        if [ ! -z "$PUBLIC_URL" ]; then
            echo ""
            echo "🎯 DEPLOY CONCLUÍDO COM SUCESSO!"
            echo "================================"
            echo "🖥️  Local: http://localhost:8080/admin.html"
            echo "🌐 Público: $PUBLIC_URL/admin.html"
            echo "📱 Mobile: $PUBLIC_URL/admin.html"
            echo "🔧 Dashboard: http://localhost:4040"
            echo ""
            echo "✅ Página admin responsiva disponível!"
        fi
    else
        echo "⚠️  Nenhum túnel ativo encontrado"
    fi
else
    # Sem jq, usar método alternativo
    RESPONSE=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null)
    if [ ! -z "$RESPONSE" ]; then
        echo "✅ API respondendo, mas jq não disponível para parsing"
        echo "🔗 Acesse http://localhost:4040 para ver os túneis"
    else
        echo "❌ API não está respondendo"
    fi
fi

# 10. Informações finais
echo ""
echo "🔧 INFORMAÇÕES DE DEBUG:"
echo "Server PID: $SERVER_PID"
echo "ngrok PID: $NGROK_PID"
echo ""
echo "Para parar os serviços:"
echo "kill $SERVER_PID $NGROK_PID"
echo "ou"
echo "pkill -f ngrok && pkill -f 'python.*http.server'"
echo ""
echo "🎉 Deploy finalizado!"
