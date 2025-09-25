#!/bin/bash

echo "🔧 Corrigindo configuração SSL do Keycloak..."

# Parar o Keycloak
echo "Parando Keycloak..."
docker compose -f infra/docker-compose.yml stop keycloak

# Remover dados antigos para forçar reimport
echo "Limpando dados antigos..."
docker compose -f infra/docker-compose.yml rm -f keycloak

# Criar configuração master realm
echo "Criando configuração do realm master..."
cat > infra/keycloak/master-realm.json << 'EOF'
{
  "realm": "master",
  "enabled": true,
  "sslRequired": "none",
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false
}
EOF

echo "Reiniciando Keycloak..."
docker compose -f infra/docker-compose.yml up -d keycloak

echo "Aguardando Keycloak inicializar..."
sleep 20

echo "✅ Configuração SSL corrigida!"
echo "Acesse: http://localhost:8083/admin/"
echo "Usuário: admin"
echo "Senha: admin"
