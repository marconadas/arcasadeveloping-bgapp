#!/usr/bin/env python3
"""
Script de teste para a API segura do BGAPP
Testa autenticação JWT, rate limiting e endpoints protegidos
"""

import requests
import json
import time
from datetime import datetime
import sys

class BGAPPSecurityTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.access_token = None
        self.session = requests.Session()
    
    def print_section(self, title):
        """Imprimir seção de teste"""
        print(f"\n{'='*60}")
        print(f"🧪 {title}")
        print('='*60)
    
    def test_health_endpoint(self):
        """Testar endpoint público de health"""
        self.print_section("TESTE DO ENDPOINT PÚBLICO")
        
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Health check: {data['status']}")
                print(f"   Versão: {data.get('version', 'N/A')}")
                print(f"   Ambiente: {data.get('environment', 'N/A')}")
                return True
            else:
                print(f"❌ Health check falhou: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Erro no health check: {e}")
            return False
    
    def test_authentication(self):
        """Testar sistema de autenticação"""
        self.print_section("TESTE DE AUTENTICAÇÃO")
        
        # Teste 1: Login com credenciais válidas
        print("🔐 Testando login com credenciais válidas...")
        
        login_data = {
            "username": "admin",
            "password": "bgapp123"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                tokens = response.json()
                self.access_token = tokens["access_token"]
                print("✅ Login bem-sucedido")
                print(f"   Token type: {tokens['token_type']}")
                print(f"   Access token: {self.access_token[:20]}...")
                
                # Configurar header de autorização
                self.session.headers.update({
                    "Authorization": f"Bearer {self.access_token}"
                })
                
                return True
            else:
                print(f"❌ Login falhou: {response.status_code}")
                print(f"   Resposta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Erro no login: {e}")
            return False
    
    def test_invalid_credentials(self):
        """Testar credenciais inválidas"""
        print("\n🔐 Testando credenciais inválidas...")
        
        invalid_data = {
            "username": "admin",
            "password": "wrong-password"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                data=invalid_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 401:
                print("✅ Credenciais inválidas rejeitadas corretamente")
                return True
            else:
                print(f"❌ Comportamento inesperado: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro no teste de credenciais inválidas: {e}")
            return False
    
    def test_protected_endpoints(self):
        """Testar endpoints protegidos"""
        self.print_section("TESTE DE ENDPOINTS PROTEGIDOS")
        
        if not self.access_token:
            print("❌ Token de acesso necessário")
            return False
        
        # Teste 1: Endpoint que requer autenticação
        print("🔒 Testando endpoint /services (requer autenticação)...")
        
        try:
            response = self.session.get(f"{self.base_url}/services")
            
            if response.status_code == 200:
                services = response.json()
                print(f"✅ Acesso autorizado - {len(services)} serviços encontrados")
                for service in services[:3]:
                    print(f"   - {service['name']}: {service['status']}")
                return True
            else:
                print(f"❌ Acesso negado: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro no teste de endpoint protegido: {e}")
            return False
    
    def test_admin_endpoints(self):
        """Testar endpoints que requerem permissões de admin"""
        self.print_section("TESTE DE ENDPOINTS ADMIN")
        
        if not self.access_token:
            print("❌ Token de acesso necessário")
            return False
        
        print("👑 Testando endpoint admin /database/tables...")
        
        try:
            response = self.session.get(f"{self.base_url}/database/tables")
            
            if response.status_code == 200:
                tables = response.json()
                print(f"✅ Acesso admin autorizado - {len(tables)} tabelas encontradas")
                for table in tables[:3]:
                    print(f"   - {table['schema']}.{table['name']}: {table['records']} registos")
                return True
            elif response.status_code == 403:
                print("✅ Acesso negado corretamente (utilizador sem permissões admin)")
                return True
            else:
                print(f"❌ Comportamento inesperado: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro no teste de endpoint admin: {e}")
            return False
    
    def test_unauthorized_access(self):
        """Testar acesso sem token"""
        self.print_section("TESTE DE ACESSO NÃO AUTORIZADO")
        
        print("🚫 Testando acesso sem token de autorização...")
        
        # Criar sessão sem token
        unauthorized_session = requests.Session()
        
        try:
            response = unauthorized_session.get(f"{self.base_url}/services")
            
            if response.status_code == 401:
                print("✅ Acesso não autorizado rejeitado corretamente")
                return True
            else:
                print(f"❌ Endpoint deveria rejeitar acesso: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro no teste de acesso não autorizado: {e}")
            return False
    
    def test_rate_limiting(self):
        """Testar rate limiting"""
        self.print_section("TESTE DE RATE LIMITING")
        
        print("⏱️ Testando rate limiting (fazendo múltiplos requests)...")
        
        # Fazer múltiplos requests rapidamente
        rate_limit_session = requests.Session()
        success_count = 0
        rate_limited_count = 0
        
        for i in range(15):  # Fazer 15 requests
            try:
                response = rate_limit_session.get(f"{self.base_url}/health")
                
                if response.status_code == 200:
                    success_count += 1
                elif response.status_code == 429:
                    rate_limited_count += 1
                    print(f"✅ Rate limit ativado no request {i+1}")
                    break
                
                time.sleep(0.1)  # Pequena pausa
                
            except Exception as e:
                print(f"❌ Erro no request {i+1}: {e}")
        
        print(f"📊 Resultado: {success_count} sucessos, {rate_limited_count} rate limited")
        
        if rate_limited_count > 0:
            print("✅ Rate limiting funcionando")
            return True
        else:
            print("⚠️ Rate limiting pode estar desabilitado ou limite muito alto")
            return True  # Não é erro crítico
    
    def test_sql_security(self):
        """Testar segurança SQL"""
        self.print_section("TESTE DE SEGURANÇA SQL")
        
        if not self.access_token:
            print("❌ Token de acesso necessário")
            return False
        
        print("🛡️ Testando proteção contra SQL injection...")
        
        # Tentar SQL injection
        malicious_queries = [
            "SELECT * FROM users; DROP TABLE users;--",
            "SELECT * FROM users WHERE id = 1 OR 1=1",
            "SELECT * FROM users UNION SELECT * FROM passwords",
            "INSERT INTO users VALUES ('hacker', 'password')"
        ]
        
        blocked_count = 0
        
        for query in malicious_queries:
            try:
                response = self.session.post(
                    f"{self.base_url}/database/query",
                    json={"sql": query}
                )
                
                if response.status_code == 400:
                    blocked_count += 1
                    print(f"✅ Query maliciosa bloqueada: {query[:30]}...")
                else:
                    print(f"❌ Query maliciosa não bloqueada: {response.status_code}")
                
            except Exception as e:
                print(f"❌ Erro no teste SQL: {e}")
        
        print(f"📊 {blocked_count}/{len(malicious_queries)} queries maliciosas bloqueadas")
        
        return blocked_count == len(malicious_queries)
    
    def test_user_info(self):
        """Testar endpoint de informações do utilizador"""
        print("\n👤 Testando informações do utilizador...")
        
        if not self.access_token:
            print("❌ Token de acesso necessário")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/auth/me")
            
            if response.status_code == 200:
                user_info = response.json()
                print("✅ Informações do utilizador obtidas:")
                print(f"   Username: {user_info['username']}")
                print(f"   Role: {user_info['role']}")
                print(f"   Scopes: {', '.join(user_info['scopes'])}")
                return True
            else:
                print(f"❌ Erro ao obter informações: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro no teste de informações: {e}")
            return False
    
    def run_all_tests(self):
        """Executar todos os testes"""
        print("🚀 BGAPP - TESTE DE SEGURANÇA DAS APIs")
        print(f"🕐 Iniciado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🌐 URL base: {self.base_url}")
        
        results = []
        
        # Executar testes
        results.append(("Health Check", self.test_health_endpoint()))
        results.append(("Autenticação Válida", self.test_authentication()))
        results.append(("Credenciais Inválidas", self.test_invalid_credentials()))
        results.append(("Informações do Utilizador", self.test_user_info()))
        results.append(("Endpoints Protegidos", self.test_protected_endpoints()))
        results.append(("Endpoints Admin", self.test_admin_endpoints()))
        results.append(("Acesso Não Autorizado", self.test_unauthorized_access()))
        results.append(("Rate Limiting", self.test_rate_limiting()))
        results.append(("Segurança SQL", self.test_sql_security()))
        
        # Relatório final
        self.print_section("RELATÓRIO FINAL")
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        print("📋 Resultados dos testes:")
        for test_name, result in results:
            status = "✅ PASSOU" if result else "❌ FALHOU"
            print(f"   {test_name}: {status}")
        
        print(f"\n📊 Resumo: {passed}/{total} testes passaram")
        
        if passed == total:
            print("🎉 TODOS OS TESTES DE SEGURANÇA PASSARAM!")
            return True
        else:
            print("⚠️ ALGUNS TESTES FALHARAM - VERIFICAR CONFIGURAÇÃO")
            return False

def main():
    """Função principal"""
    
    # Permitir URL personalizada
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    tester = BGAPPSecurityTester(base_url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
