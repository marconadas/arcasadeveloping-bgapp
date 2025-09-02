#!/bin/bash

# Script para resolver problema de repositório Git aninhado
# BGAPP - Fix Nested Repository Issue

echo "🔧 Resolvendo problema de repositório Git aninhado..."
echo "=================================================="

# Verificar se estamos na raiz do repositório principal
if [ ! -d ".git" ]; then
    echo "❌ Erro: Execute este script na raiz do repositório Git principal"
    exit 1
fi

# Verificar se existe repositório aninhado
if [ ! -d "deploy_arcasadeveloping_BGAPP/.git" ]; then
    echo "✅ Não há repositório aninhado para corrigir"
    exit 0
fi

echo "🔍 Repositório aninhado encontrado em: deploy_arcasadeveloping_BGAPP/.git"

# Fazer backup do repositório aninhado (opcional)
read -p "🤔 Deseja fazer backup do repositório aninhado? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "💾 Criando backup..."
    cp -r deploy_arcasadeveloping_BGAPP deploy_arcasadeveloping_BGAPP_backup_$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup criado"
fi

# Verificar se há commits únicos no repositório aninhado
echo "🔍 Verificando commits únicos no repositório aninhado..."
cd deploy_arcasadeveloping_BGAPP

# Verificar se há mudanças não commitadas
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠️  ATENÇÃO: Há mudanças não commitadas no repositório aninhado!"
    echo "📋 Mudanças encontradas:"
    git status --porcelain
    echo ""
    read -p "🤔 Deseja continuar mesmo assim? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operação cancelada pelo usuário"
        cd ..
        exit 1
    fi
fi

cd ..

echo "🗑️  Removendo repositório Git aninhado..."
rm -rf deploy_arcasadeveloping_BGAPP/.git

echo "📊 Verificando status após remoção..."
git status --porcelain | grep deploy_arcasadeveloping_BGAPP

echo "✅ Repositório aninhado removido com sucesso!"
echo ""
echo "🎯 Próximos passos:"
echo "1. Verificar mudanças: git status"
echo "2. Adicionar ao Git: git add deploy_arcasadeveloping_BGAPP"
echo "3. Fazer commit: git commit -m '🔧 Resolver repositório aninhado'"
echo "4. Testar agente Git: ./git_agent_daemon.sh status"
echo ""

# Verificar se só há um repositório Git agora
echo "🔍 Verificação final - repositórios Git encontrados:"
find . -name ".git" -type d

if [ $(find . -name ".git" -type d | wc -l) -eq 1 ]; then
    echo "✅ Problema resolvido! Apenas um repositório Git encontrado."
    echo "🚀 O workspace agora está na raiz correta do Git"
else
    echo "⚠️  Ainda há múltiplos repositórios Git. Verificar manualmente."
fi

echo ""
echo "🎉 Script concluído!"
