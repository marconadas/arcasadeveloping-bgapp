#!/usr/bin/env python3
"""
Teste da seção de bases de dados do dashboard admin
Verifica se todos os endpoints estão funcionando corretamente
"""

import requests
import json
from datetime import datetime

def test_database_endpoints():
    """Testar todos os endpoints relacionados à base de dados"""
    
    print("🧪 TESTE DA SEÇÃO DE BASES DE DADOS")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    tests_passed = 0
    total_tests = 0
    
    # Teste 1: Endpoint público de tabelas
    print("\n📊 1. Testando endpoint público de tabelas...")
    total_tests += 1
    
    try:
        response = requests.get(f"{base_url}/database/tables/public", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Endpoint funcionando")
            print(f"   Total de tabelas: {data['summary']['total_tables']}")
            print(f"   Schemas: {', '.join(data['summary']['schemas'])}")
            print(f"   Tabelas mostradas: {len(data['tables'])}")
            tests_passed += 1
        else:
            print(f"❌ Erro HTTP: {response.status_code}")
            print(f"   Resposta: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # Teste 2: Endpoint de teste
    print("\n🔧 2. Testando endpoint de teste...")
    total_tests += 1
    
    try:
        response = requests.get(f"{base_url}/database/test", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Endpoint de teste funcionando")
            print(f"   Mensagem: {data['message']}")
            tests_passed += 1
        else:
            print(f"❌ Erro HTTP: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # Teste 3: Verificar CORS
    print("\n🌐 3. Testando CORS para frontend...")
    total_tests += 1
    
    try:
        headers = {
            'Origin': 'http://localhost:8085',
            'Access-Control-Request-Method': 'GET'
        }
        response = requests.options(f"{base_url}/database/tables/public", headers=headers, timeout=5)
        
        if response.status_code in [200, 204]:
            print("✅ CORS configurado corretamente")
            tests_passed += 1
        else:
            print(f"⚠️ CORS pode ter problemas: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro CORS: {e}")
    
    # Teste 4: Verificar se frontend consegue acessar
    print("\n🌐 4. Testando acesso do frontend...")
    total_tests += 1
    
    try:
        # Simular request do frontend
        headers = {
            'Origin': 'http://localhost:8085',
            'Referer': 'http://localhost:8085/admin.html',
            'User-Agent': 'Mozilla/5.0 (Test Browser)'
        }
        response = requests.get(f"{base_url}/database/tables/public", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Frontend pode acessar endpoint")
            print(f"   Dados recebidos: {len(data.get('tables', []))} tabelas")
            tests_passed += 1
        else:
            print(f"❌ Frontend bloqueado: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro de acesso: {e}")
    
    # Teste 5: Verificar estrutura da resposta
    print("\n📋 5. Verificando estrutura da resposta...")
    total_tests += 1
    
    try:
        response = requests.get(f"{base_url}/database/tables/public", timeout=5)
        if response.status_code == 200:
            data = response.json()
            
            # Verificar campos obrigatórios
            required_fields = ['tables', 'summary', 'timestamp']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                print("✅ Estrutura da resposta correta")
                
                # Verificar estrutura das tabelas
                if data['tables'] and len(data['tables']) > 0:
                    table = data['tables'][0]
                    table_fields = ['schema', 'name', 'full_name']
                    missing_table_fields = [field for field in table_fields if field not in table]
                    
                    if not missing_table_fields:
                        print("✅ Estrutura das tabelas correta")
                        tests_passed += 1
                    else:
                        print(f"❌ Campos de tabela em falta: {missing_table_fields}")
                else:
                    print("⚠️ Nenhuma tabela na resposta")
                    tests_passed += 1  # Não é erro crítico
            else:
                print(f"❌ Campos em falta na resposta: {missing_fields}")
        else:
            print(f"❌ Erro HTTP: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # Relatório final
    print("\n" + "=" * 60)
    print("📋 RELATÓRIO FINAL")
    print(f"✅ Testes passaram: {tests_passed}/{total_tests}")
    print(f"📊 Taxa de sucesso: {(tests_passed/total_tests)*100:.1f}%")
    
    if tests_passed == total_tests:
        print("🎉 TODOS OS TESTES PASSARAM!")
        print("\n💡 Se o dashboard ainda mostra 'A carregar...', verifique:")
        print("   1. Console do browser (F12) para erros JavaScript")
        print("   2. Rede do browser para requests falhados")
        print("   3. Refresh da página (Ctrl+F5)")
    else:
        print("⚠️ ALGUNS TESTES FALHARAM")
        print("\n🔧 Ações recomendadas:")
        print("   1. Verificar logs da API: docker logs infra-admin-api-1")
        print("   2. Verificar conectividade de rede")
        print("   3. Reiniciar serviços se necessário")
    
    print(f"\n🕐 Teste concluído em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return tests_passed == total_tests

if __name__ == "__main__":
    success = test_database_endpoints()
    exit(0 if success else 1)
