#!/bin/bash

echo "🔧 Corrigindo SSL do realm master no Keycloak..."

# Aguardar Keycloak estar pronto
echo "Aguardando Keycloak inicializar..."
sleep 5

# Configurar credenciais administrativas
echo "Configurando credenciais administrativas..."
docker compose -f infra/docker-compose.yml exec keycloak /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin

# Verificar configuração atual
echo "Verificando configuração SSL atual do realm master..."
SSL_CONFIG=$(docker compose -f infra/docker-compose.yml exec keycloak /opt/keycloak/bin/kcadm.sh get realms/master --fields sslRequired | grep -o '"sslRequired" : "[^"]*"')
echo "Configuração atual: $SSL_CONFIG"

# Atualizar configuração SSL
echo "Desabilitando SSL required no realm master..."
docker compose -f infra/docker-compose.yml exec keycloak /opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=none

# Verificar se foi aplicado
echo "Verificando nova configuração..."
NEW_SSL_CONFIG=$(docker compose -f infra/docker-compose.yml exec keycloak /opt/keycloak/bin/kcadm.sh get realms/master --fields sslRequired | grep -o '"sslRequired" : "[^"]*"')
echo "Nova configuração: $NEW_SSL_CONFIG"

# Testar acesso
echo "Testando acesso ao console..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8083/admin/master/console/)
echo "Status do console: $STATUS"

if [ "$STATUS" = "200" ]; then
    echo "✅ SSL corrigido com sucesso!"
    echo "✅ Console de administração funcionando!"
else
    echo "❌ Ainda há problemas. Status: $STATUS"
fi

echo ""
echo "Acesse: http://localhost:8083/admin/"
echo "Usuário: admin"
echo "Senha: admin"
