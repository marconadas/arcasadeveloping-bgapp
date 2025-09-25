#!/bin/bash

# BGAPP Admin Dashboard - Script de Deploy para Produção
# Deploy otimizado para Cloudflare Pages

set -e

echo "🚀 BGAPP Admin Dashboard - Deploy para Produção"
echo "================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado. Execute este script no diretório admin-dashboard${NC}"
    exit 1
fi

# 1. Limpar builds anteriores
echo -e "${YELLOW}🧹 Limpando builds anteriores...${NC}"
rm -rf .next out dist

# 2. Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
npm ci --production=false

# 3. Verificar tipos TypeScript
echo -e "${YELLOW}🔍 Verificando tipos TypeScript...${NC}"
npm run type-check || {
    echo -e "${RED}❌ Erro nos tipos TypeScript. Corrija antes de fazer deploy.${NC}"
    exit 1
}

# 4. Build otimizado para produção
echo -e "${YELLOW}🔨 Criando build de produção...${NC}"
NODE_ENV=production npm run build

# 5. Exportar para arquivos estáticos (se usando Next.js static export)
echo -e "${YELLOW}📤 Exportando arquivos estáticos...${NC}"
npx next export || echo "Export não configurado, usando build padrão"

# 6. Otimizações pós-build
echo -e "${YELLOW}⚡ Aplicando otimizações...${NC}"

# Comprimir imagens (se tiver imagemin instalado)
if command -v imagemin &> /dev/null; then
    echo "  - Comprimindo imagens..."
    find out -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -exec imagemin {} \; 2>/dev/null || true
fi

# 7. Criar arquivo de configuração do Cloudflare Pages
echo -e "${YELLOW}📝 Criando configuração do Cloudflare Pages...${NC}"
cat > _headers << EOF
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.woff2
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: no-cache
EOF

# 8. Criar redirects se necessário
cat > _redirects << EOF
# Redirects para SPA
/*    /index.html   200
EOF

# 9. Verificar tamanho do bundle
echo -e "${YELLOW}📊 Análise do bundle:${NC}"
if [ -d "out" ]; then
    BUNDLE_SIZE=$(du -sh out | cut -f1)
    echo "  Tamanho total: $BUNDLE_SIZE"
    
    # Verificar se o bundle não está muito grande
    SIZE_MB=$(du -sm out | cut -f1)
    if [ $SIZE_MB -gt 50 ]; then
        echo -e "${YELLOW}⚠️  Aviso: Bundle maior que 50MB. Considere otimizações.${NC}"
    fi
fi

# 10. Deploy para Cloudflare Pages
echo -e "${YELLOW}☁️  Fazendo deploy para Cloudflare Pages...${NC}"

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando Wrangler...${NC}"
    npm install -g wrangler
fi

# Diretório de deploy (out ou .next/static)
DEPLOY_DIR="out"
if [ ! -d "$DEPLOY_DIR" ]; then
    DEPLOY_DIR=".next/static"
fi

if [ ! -d "$DEPLOY_DIR" ]; then
    echo -e "${RED}❌ Erro: Diretório de deploy não encontrado${NC}"
    exit 1
fi

# Deploy usando wrangler
echo -e "${GREEN}🚀 Iniciando deploy...${NC}"
wrangler pages deploy $DEPLOY_DIR \
    --project-name=bgapp-admin \
    --branch=main \
    --commit-dirty=true

# 11. Verificar deploy
echo -e "${YELLOW}✅ Verificando deploy...${NC}"
sleep 5

# URL do projeto
PROJECT_URL="https://bgapp-admin.pages.dev"

# Testar se o site está acessível
if curl -s -o /dev/null -w "%{http_code}" $PROJECT_URL | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
    echo -e "${GREEN}🌐 Site disponível em: $PROJECT_URL${NC}"
    
    # Abrir no navegador (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open $PROJECT_URL
    fi
else
    echo -e "${YELLOW}⚠️  Site pode estar demorando para propagar. Verifique em alguns minutos.${NC}"
fi

# 12. Limpar arquivos temporários
echo -e "${YELLOW}🧹 Limpando arquivos temporários...${NC}"
rm -f _headers _redirects

echo ""
echo -e "${GREEN}🎉 Deploy finalizado!${NC}"
echo "================================================"
echo "URLs de Produção:"
echo "  - Dashboard: https://bgapp-admin.pages.dev"
echo "  - API: https://bgapp-api.majearcasa.workers.dev"
echo ""
echo "Próximos passos:"
echo "  1. Verificar o site em produção"
echo "  2. Testar funcionalidades críticas"
echo "  3. Monitorar logs e métricas"
echo "  4. Configurar alertas de erro"
echo ""
