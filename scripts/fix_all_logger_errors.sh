#!/bin/bash

echo "🔧 Corrigindo TODOS os erros de tipo do logger..."

cd /workspace/admin-dashboard

# Corrigir todos os casos onde error/err/apiError é passado como segundo parâmetro
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i -E '
  s/logger\.(error|warn|info|debug)\(([^,]+),\s*error\)/logger.\1(\2, { error: String(error) })/g;
  s/logger\.(error|warn|info|debug)\(([^,]+),\s*err\)/logger.\1(\2, { error: String(err) })/g;
  s/logger\.(error|warn|info|debug)\(([^,]+),\s*apiError\)/logger.\1(\2, { error: String(apiError) })/g;
  s/logger\.(error|warn|info|debug)\(([^,]+),\s*error as Error\)/logger.\1(\2, err as Error)/g;
  s/logger\.(error|warn|info|debug)\(([^,]+),\s*err as Error\)/logger.\1(\2, err as Error)/g;
' {} \;

echo "✅ Correções aplicadas!"