#!/bin/bash

echo "🚀 Iniciando BGAPP Admin Dashboard - Modo Baixo Uso de Recursos"
echo "================================================================"

# Configurar variáveis de ambiente para otimização de memória
export NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=128"
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=development

# Usar configuração minimalista
cp next.config.minimal.js next.config.js

# Limpar cache
echo "🧹 Limpando cache..."
rm -rf .next/
rm -rf node_modules/.cache/

echo "⚡ Iniciando servidor na porta 3002 com configurações otimizadas..."
echo "   URL: http://localhost:3002"
echo "   Para parar: Ctrl+C"
echo ""

# Iniciar com prioridade baixa para não sobrecarregar o sistema
nice -n 10 npm run dev:3002
