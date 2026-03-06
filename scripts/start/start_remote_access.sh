#!/bin/bash
# Script para iniciar acesso remoto ao BGAPP

echo "🚀 BGAPP - Configurando Acesso Remoto"
echo "=================================="

# Verificar se os serviços estão a correr
echo "🔍 Verificando serviços..."
if curl -s http://localhost:8085/admin.html > /dev/null; then
    echo "✅ Painel administrativo acessível localmente"
else
    echo "❌ Painel não está acessível. A inicializar serviços..."
    docker compose -f infra/docker-compose.yml up -d postgis minio stac pygeoapi stac-browser frontend admin-api
    echo "⏳ Aguardando serviços ficarem prontos..."
    sleep 15
fi

echo ""
echo "🌐 Iniciando túnel ngrok..."
echo "⚠️  IMPORTANTE: O ngrok vai pedir para criar conta (grátis)"
echo "   1. Vai abrir o browser automaticamente"
echo "   2. Cria conta ou faz login"
echo "   3. Copia o authtoken"
echo "   4. Cola quando pedido"
echo ""

# Iniciar ngrok com autenticação
ngrok http 8085 --auth="admin:bgapp123" --log=stdout &
NGROK_PID=$!

echo "⏳ Aguardando túnel ficar pronto..."
sleep 10

# Tentar obter URL do túnel
echo "🔗 A obter URL do túnel..."
TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if data['tunnels']:
        print(data['tunnels'][0]['public_url'])
    else:
        print('No tunnels found')
except:
    print('Error getting tunnel URL')
" 2>/dev/null)

echo ""
echo "🎉 ACESSO REMOTO ATIVO!"
echo "======================"

if [[ $TUNNEL_URL != *"Error"* ]] && [[ $TUNNEL_URL != "No tunnels found" ]] && [[ -n $TUNNEL_URL ]]; then
    echo "🔗 URL para partilhar com o teu pai:"
    echo "   $TUNNEL_URL/admin.html"
else
    echo "🔗 Verifica o URL manualmente em:"
    echo "   http://localhost:4040"
    echo "   Depois adiciona /admin.html ao final"
fi

echo ""
echo "🔑 Credenciais para o teu pai:"
echo "   Utilizador: admin"
echo "   Password: bgapp123"
echo ""
echo "📋 Instruções para o teu pai:"
echo "   1. Abrir o URL partilhado"
echo "   2. Inserir credenciais quando pedido"
echo "   3. Aceder ao painel administrativo completo"
echo ""
echo "🔒 Funcionalidades de segurança ativas:"
echo "   ✅ Autenticação HTTP Basic obrigatória"
echo "   ✅ Túnel encriptado HTTPS"
echo "   ✅ URL temporário (não público permanente)"
echo "   ✅ Acesso apenas com credenciais"
echo ""
echo "🛑 Para parar o túnel:"
echo "   Ctrl+C ou kill $NGROK_PID"
echo ""
echo "⏳ Túnel ativo... (Ctrl+C para parar)"

# Aguardar sinal para parar
trap "kill $NGROK_PID 2>/dev/null; echo ''; echo '🛑 Túnel parado'" EXIT

wait $NGROK_PID
