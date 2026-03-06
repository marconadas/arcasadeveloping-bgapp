#!/bin/bash

# Script para corrigir configuração do Cloudflare MCP
# Autor: Assistant
# Data: 2025

set -e

echo "🔧 Corrigindo configuração do Cloudflare MCP"
echo "============================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="/Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp"
cd "$PROJECT_DIR"

# Verificar se o Node.js está instalado
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado${NC}"
    echo "Por favor, instale o Node.js primeiro: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js encontrado: $(node --version)${NC}"

# Verificar se NPM está instalado
echo "📦 Verificando NPM..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ NPM não está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ NPM encontrado: $(npm --version)${NC}"

# Instalar o servidor MCP do Cloudflare
echo ""
echo "📥 Instalando @cloudflare/mcp-server-cloudflare..."
npm install -D @cloudflare/mcp-server-cloudflare 2>/dev/null || {
    echo -e "${YELLOW}⚠️ Usando fallback para instalação global${NC}"
    npm install -g @cloudflare/mcp-server-cloudflare
}

# Fazer backup do .mcp.json atual
echo ""
echo "💾 Fazendo backup do .mcp.json..."
if [ -f ".mcp.json" ]; then
    cp .mcp.json .mcp.json.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Backup criado${NC}"
fi

# Ler o token do .env.mcp
if [ -f ".env.mcp" ]; then
    source .env.mcp
    echo -e "${GREEN}✅ Token carregado do .env.mcp${NC}"
else
    echo -e "${YELLOW}⚠️ Arquivo .env.mcp não encontrado${NC}"
    CLOUDFLARE_API_TOKEN="F31omHgQku19VAG52njqV9T5TZ2CEeMFjfnlPeEZ"
fi

# Criar novo .mcp.json com configuração correta
echo ""
echo "📝 Atualizando .mcp.json..."
cat > .mcp.json.tmp <<'EOF'
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem"],
      "env": {}
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_ZP7f4t30KXxV9fWUj4oUO77085VZv2gYKU7L"
      }
    },
    "cloudflare": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@cloudflare/mcp-server-cloudflare@latest"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "F31omHgQku19VAG52njqV9T5TZ2CEeMFjfnlPeEZ",
        "CLOUDFLARE_ACCOUNT_ID": "b4824e9393a0448cbc14367facb73053"
      }
    },
    "browsermcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["@browsermcp/mcp@latest"],
      "env": {}
    },
    "firecrawl": {
      "type": "stdio",
      "command": "npx",
      "args": ["firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-3c7338d240e54066a1d57b317c1afa0b"
      }
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {}
    },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-memory"],
      "env": {}
    },
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-sequential-thinking"],
      "env": {}
    },
    "puppeteer": {
      "type": "stdio",
      "command": "npx",
      "args": ["puppeteer-mcp-server"],
      "env": {}
    },
    "gis-dataconversion": {
      "type": "stdio",
      "command": "npx",
      "args": ["gis-dataconversion-mcp"],
      "env": {}
    },
    "openstreetmap": {
      "type": "stdio",
      "command": "uvx",
      "args": ["osm-mcp-server"],
      "env": {}
    }
  }
}
EOF

mv .mcp.json.tmp .mcp.json
echo -e "${GREEN}✅ Arquivo .mcp.json atualizado${NC}"

# Testar o token da API
echo ""
echo "🧪 Testando token da API do Cloudflare..."
RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
     -H "Content-Type: application/json")

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Token válido e funcionando!${NC}"
    
    # Extrair informações do token
    if command -v jq &> /dev/null; then
        echo "$RESPONSE" | jq -r '.result | "   Status: \(.status)\n   ID: \(.id)"'
    fi
else
    echo -e "${RED}❌ Token inválido ou expirado${NC}"
    echo "Por favor, gere um novo token em: https://dash.cloudflare.com/profile/api-tokens"
fi

# Listar Workers existentes
echo ""
echo "📋 Listando seus Workers do Cloudflare..."
WORKERS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/b4824e9393a0448cbc14367facb73053/workers/scripts" \
     -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
     -H "Content-Type: application/json")

if echo "$WORKERS" | grep -q '"success":true'; then
    if command -v jq &> /dev/null; then
        echo "$WORKERS" | jq -r '.result[] | "   - \(.id)"' 2>/dev/null || echo "   Nenhum Worker encontrado"
    else
        echo -e "${YELLOW}   Instale 'jq' para ver detalhes dos Workers${NC}"
    fi
else
    echo -e "${YELLOW}   Não foi possível listar Workers${NC}"
fi

# Instruções finais
echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📌 Próximos passos:"
echo "1. Reinicie o Claude Desktop:"
echo "   ${YELLOW}killall Claude && open -a Claude${NC}"
echo ""
echo "2. Ou se preferir, feche e abra o Claude manualmente"
echo ""
echo "3. O MCP do Cloudflare deve aparecer conectado"
echo ""
echo "💡 Dica: Para testar se está funcionando, pergunte ao Claude:"
echo "   'Liste meus Workers do Cloudflare usando o MCP'"
echo ""
echo "📚 Documentação:"
echo "   - Cloudflare MCP: https://developers.cloudflare.com/mcp/"
echo "   - API Tokens: https://dash.cloudflare.com/profile/api-tokens"
