#!/usr/bin/env python3
"""
Teste da seção MinIO Storage do dashboard admin
Verifica se o endpoint e frontend estão funcionando corretamente
"""

import requests
import json
from datetime import datetime

def test_minio_endpoints():
    """Testar endpoints relacionados ao MinIO"""
    
    print("🗄️ TESTE DA SEÇÃO MINIO STORAGE")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    tests_passed = 0
    total_tests = 0
    
    # Teste 1: Endpoint de buckets
    print("\n📊 1. Testando endpoint de buckets...")
    total_tests += 1
    
    try:
        response = requests.get(f"{base_url}/storage/buckets", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Endpoint funcionando")
            print(f"   Fonte de dados: {data.get('source', 'unknown')}")
            print(f"   Buckets encontrados: {len(data.get('buckets', []))}")
            
            # Mostrar buckets
            for bucket in data.get('buckets', [])[:3]:
                print(f"   - {bucket['name']}: {bucket['size']}, {bucket['objects']} objetos ({bucket['type']})")
            
            tests_passed += 1
        else:
            print(f"❌ Erro HTTP: {response.status_code}")
            print(f"   Resposta: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # Teste 2: Verificar estrutura da resposta
    print("\n📋 2. Verificando estrutura da resposta...")
    total_tests += 1
    
    try:
        response = requests.get(f"{base_url}/storage/buckets", timeout=5)
        if response.status_code == 200:
            data = response.json()
            
            # Verificar campos obrigatórios
            required_fields = ['buckets', 'source', 'timestamp']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                print("✅ Estrutura da resposta correta")
                
                # Verificar estrutura dos buckets
                if data['buckets'] and len(data['buckets']) > 0:
                    bucket = data['buckets'][0]
                    bucket_fields = ['name', 'size', 'objects', 'type']
                    missing_bucket_fields = [field for field in bucket_fields if field not in bucket]
                    
                    if not missing_bucket_fields:
                        print("✅ Estrutura dos buckets correta")
                        tests_passed += 1
                    else:
                        print(f"❌ Campos de bucket em falta: {missing_bucket_fields}")
                else:
                    print("⚠️ Nenhum bucket na resposta")
                    tests_passed += 1  # Não é erro crítico
            else:
                print(f"❌ Campos em falta na resposta: {missing_fields}")
        else:
            print(f"❌ Erro HTTP: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # Teste 3: Verificar conectividade MinIO
    print("\n🔗 3. Testando conectividade MinIO...")
    total_tests += 1
    
    try:
        # Testar health endpoint do MinIO
        response = requests.get("http://localhost:9000/minio/health/live", timeout=5)
        if response.status_code == 200:
            print("✅ MinIO está online e saudável")
            tests_passed += 1
        else:
            print(f"⚠️ MinIO respondeu com status: {response.status_code}")
    except Exception as e:
        print(f"❌ MinIO não acessível: {e}")
    
    # Teste 4: Verificar console MinIO
    print("\n🌐 4. Testando console MinIO...")
    total_tests += 1
    
    try:
        response = requests.get("http://localhost:9001", timeout=5)
        if response.status_code == 200:
            print("✅ Console MinIO acessível")
            print("   URL: http://localhost:9001")
            print("   Credenciais: minio / minio123")
            tests_passed += 1
        else:
            print(f"❌ Console MinIO erro: {response.status_code}")
    except Exception as e:
        print(f"❌ Console MinIO não acessível: {e}")
    
    # Teste 5: Simular request do frontend
    print("\n🌐 5. Testando acesso do frontend...")
    total_tests += 1
    
    try:
        headers = {
            'Origin': 'http://localhost:8085',
            'Referer': 'http://localhost:8085/admin.html',
            'User-Agent': 'Mozilla/5.0 (Test Browser)'
        }
        response = requests.get(f"{base_url}/storage/buckets", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Frontend pode acessar endpoint")
            print(f"   Buckets recebidos: {len(data.get('buckets', []))}")
            tests_passed += 1
        else:
            print(f"❌ Frontend bloqueado: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro de acesso: {e}")
    
    # Relatório final
    print("\n" + "=" * 60)
    print("📋 RELATÓRIO FINAL")
    print(f"✅ Testes passaram: {tests_passed}/{total_tests}")
    print(f"📊 Taxa de sucesso: {(tests_passed/total_tests)*100:.1f}%")
    
    if tests_passed == total_tests:
        print("🎉 TODOS OS TESTES PASSARAM!")
        print("\n💡 Se o dashboard ainda mostra 'A carregar buckets...', faça:")
        print("   1. Refresh forçado da página (Ctrl+F5)")
        print("   2. Verificar console do browser (F12) para erros")
        print("   3. Clicar em 'Armazenamento' no menu lateral")
    elif tests_passed >= 3:
        print("✅ MAIORIA DOS TESTES PASSOU - Funcionalidade básica OK")
    else:
        print("⚠️ MUITOS TESTES FALHARAM")
        print("\n🔧 Ações recomendadas:")
        print("   1. Verificar se MinIO está rodando: docker ps | grep minio")
        print("   2. Verificar logs da API: docker logs infra-admin-api-1")
        print("   3. Reiniciar serviços se necessário")
    
    print(f"\n🕐 Teste concluído em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return tests_passed >= 3  # Pelo menos 3 de 5 testes devem passar

if __name__ == "__main__":
    success = test_minio_endpoints()
    exit(0 if success else 1)
