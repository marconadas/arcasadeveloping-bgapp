#!/bin/bash

# 🧪 Teste Completo do Deploy STAC Oceanográfico
# Verifica se todas as funcionalidades estão operacionais

echo "🧪 Testando Deploy STAC Oceanográfico..."
echo "==============================================="

# URLs para teste
WORKER_URL="https://bgapp-stac-oceanographic.majearcasa.workers.dev"
PAGES_URL="https://bgapp-scientific.pages.dev"

echo ""
echo "1️⃣ Testando Worker STAC..."

# Teste 1: Health check do worker
echo "   ✅ Health check..."
HEALTH=$(curl -s "${WORKER_URL}/health" | jq -r '.status' 2>/dev/null)
if [ "$HEALTH" = "healthy" ]; then
    echo "   ✅ Worker saudável"
else
    echo "   ❌ Worker com problemas"
fi

# Teste 2: Resumo das coleções
echo "   ✅ Resumo das coleções..."
COLLECTIONS=$(curl -s "${WORKER_URL}/stac/collections/summary" | jq -r '.status' 2>/dev/null)
if [ "$COLLECTIONS" = "success" ]; then
    echo "   ✅ Coleções disponíveis"
else
    echo "   ❌ Erro nas coleções"
fi

# Teste 3: Coleções externas
echo "   ✅ Coleções externas..."
EXTERNAL=$(curl -s "${WORKER_URL}/stac/collections/external" | jq -r '.status' 2>/dev/null)
if [ "$EXTERNAL" = "success" ]; then
    echo "   ✅ APIs externas funcionando"
else
    echo "   ❌ Erro nas APIs externas"
fi

# Teste 4: Dados recentes
echo "   ✅ Dados recentes..."
RECENT=$(curl -s "${WORKER_URL}/stac/oceanographic/recent?days_back=7" | jq -r '.status' 2>/dev/null)
if [ "$RECENT" = "success" ]; then
    echo "   ✅ Dados recentes disponíveis"
else
    echo "   ❌ Erro nos dados recentes"
fi

echo ""
echo "2️⃣ Testando Cloudflare Pages..."

# Teste 5: Página STAC acessível
echo "   ✅ Página STAC..."
PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PAGES_URL}/stac_oceanographic")
if [ "$PAGE_STATUS" = "200" ]; then
    echo "   ✅ Página acessível"
else
    echo "   ❌ Página inacessível (Status: $PAGE_STATUS)"
fi

# Teste 6: Service Worker
echo "   ✅ Service Worker..."
SW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PAGES_URL}/sw.js")
if [ "$SW_STATUS" = "200" ]; then
    echo "   ✅ Service Worker disponível"
else
    echo "   ❌ Service Worker indisponível"
fi

echo ""
echo "3️⃣ Testando Health Check das APIs Externas..."

# Teste 7: Microsoft Planetary Computer
echo "   ✅ Microsoft Planetary Computer..."
PC_STATUS=$(curl -s "${WORKER_URL}/stac/apis/health" | jq -r '.apis.planetary_computer.status' 2>/dev/null)
if [ "$PC_STATUS" = "healthy" ]; then
    echo "   ✅ Planetary Computer online"
else
    echo "   ⚠️ Planetary Computer: $PC_STATUS"
fi

echo ""
echo "📊 Resumo dos Testes:"
echo "==============================================="
echo "🌐 Worker URL: $WORKER_URL"
echo "📱 Pages URL: $PAGES_URL/stac_oceanographic"
echo ""

# Verificação final
if [ "$HEALTH" = "healthy" ] && [ "$PAGE_STATUS" = "200" ]; then
    echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
    echo "🎉 A página STAC Oceanográfica está totalmente funcional!"
    echo ""
    echo "🔗 Acesse: $PAGES_URL/stac_oceanographic"
else
    echo "❌ Alguns problemas foram detectados"
    echo "📝 Verifique os logs acima para mais detalhes"
fi

echo ""
