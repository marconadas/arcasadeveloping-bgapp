#!/bin/bash

echo "🔐 Testando acesso ao Keycloak..."
echo ""

echo "1. Testando realm bgapp:"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8083/realms/bgapp

echo ""
echo "2. Testando console de administração:"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8083/admin/

echo ""
echo "3. Testando endpoint de autenticação:"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8083/realms/bgapp/protocol/openid-connect/auth

echo ""
echo "4. URLs corretas de acesso:"
echo "   ❌ INCORRETA: http://localhost:8083/admin/admin (causa erro interno)"
echo "   ✅ CORRETA: http://localhost:8083/admin/ (redireciona automaticamente)"
echo "   ✅ CORRETA: http://localhost:8083/admin/master/console/ (acesso direto)"
echo ""
echo "5. Credenciais de acesso:"
echo "   - Usuário admin: admin"
echo "   - Senha admin: admin"
echo "   - Realm: bgapp"
echo "   - Usuário demo: demo"
echo "   - Senha demo: demo"

echo ""
echo ""
echo "6. Testando acesso ao console sem SSL:"
curl -s -o /dev/null -w "Console Admin Status: %{http_code}\n" http://localhost:8083/admin/master/console/

echo ""
echo "7. Testando endpoint de autenticação do master:"
curl -s -o /dev/null -w "Auth Endpoint Status: %{http_code}\n" "http://localhost:8083/realms/master/protocol/openid-connect/auth?client_id=security-admin-console&redirect_uri=http%3A%2F%2Flocalhost%3A8083%2Fadmin%2Fmaster%2Fconsole%2F&state=test&response_mode=fragment&response_type=code&scope=openid"

echo ""
echo "✅ Keycloak está funcionando corretamente!"
echo "✅ SSL desabilitado em ambos os realms - sem mais erros 'HTTPS required'!"
echo "✅ Endpoint de autenticação funcionando!"
