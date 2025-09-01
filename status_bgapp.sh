#!/bin/bash

# Script para verificar o status da aplicação BGAPP

echo "📊 BGAPP - Status da Aplicação"
echo "=============================="

# Verificar se servidor está rodando
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Servidor web: ONLINE (porta 8080)"
    LOCAL_URL="http://localhost:8080"
else
    echo "❌ Servidor web: OFFLINE"
    LOCAL_URL="N/A"
fi

# Verificar se ngrok está rodando
if curl -s http://localhost:4040 > /dev/null; then
    echo "✅ ngrok: ONLINE (dashboard na porta 4040)"
    
    # Obter URL pública
    PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if data.get('tunnels'):
        print(data['tunnels'][0]['public_url'])
    else:
        print('N/A')
except:
    print('N/A')
" 2>/dev/null)
    
    if [ "$PUBLIC_URL" != "N/A" ] && [ -n "$PUBLIC_URL" ]; then
        echo "✅ Túnel público: ATIVO"
        
        # Testar URL pública
        if curl -s -o /dev/null -w "%{http_code}" "$PUBLIC_URL" | grep -q "200"; then
            echo "✅ Acesso público: FUNCIONANDO"
        else
            echo "⚠️ Acesso público: POSSÍVEL PROBLEMA"
        fi
    else
        echo "❌ Túnel público: NÃO ENCONTRADO"
        PUBLIC_URL="N/A"
    fi
else
    echo "❌ ngrok: OFFLINE"
    PUBLIC_URL="N/A"
fi

# Verificar processos
PROCESSES=$(ps aux | grep -E "(http.server.*8080|ngrok.*8080)" | grep -v grep | wc -l)
echo "📋 Processos ativos: $PROCESSES"

echo ""
echo "🔗 URLs de Acesso:"
echo "   Local: $LOCAL_URL"
echo "   Público: $PUBLIC_URL"
echo "   Dashboard: http://localhost:4040"

echo ""
echo "📱 Como usar:"
if [ "$PUBLIC_URL" != "N/A" ]; then
    echo "   1. Abra: $PUBLIC_URL"
    echo "   2. Aguarde carregamento completo"
    echo "   3. Use os controles do painel lateral"
    echo "   4. Admin: clique no ⚙️ (admin/Kianda)"
else
    echo "   ❌ Aplicação não está acessível publicamente"
    echo "   💡 Execute: ./start_bgapp_public.sh"
fi

echo ""
echo "🔧 Comandos úteis:"
echo "   Iniciar: ./start_bgapp_public.sh"
echo "   Parar: pkill -f 'http.server.*8080' && pkill -f 'ngrok.*8080'"
echo "   Status: ./status_bgapp.sh"
echo ""
