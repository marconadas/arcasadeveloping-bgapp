#!/usr/bin/env python3
"""
Teste dos endpoints de infraestruturas pesqueiras
Verifica se todos os dados estão sendo servidos corretamente
"""

import requests
import json
from datetime import datetime

def test_endpoint(url, expected_name):
    """Testar um endpoint específico"""
    try:
        print(f"\n🔍 Testando: {expected_name}")
        print(f"   URL: {url}")
        
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"   ❌ Erro HTTP {response.status_code}")
            return False
        
        data = response.json()
        
        if 'features' not in data:
            print(f"   ❌ Resposta não contém 'features'")
            return False
        
        features_count = len(data['features'])
        number_returned = data.get('numberReturned', features_count)
        
        print(f"   ✅ Status: OK")
        print(f"   📊 Features retornadas: {number_returned}")
        print(f"   📊 Features no array: {features_count}")
        
        if features_count > 0:
            first_feature = data['features'][0]
            props = first_feature.get('properties', {})
            name = props.get('name', 'N/A')
            category = props.get('category', 'N/A')
            zone = props.get('zone', 'N/A')
            
            print(f"   📍 Primeira feature: {name}")
            print(f"   🏷️  Categoria: {category}")
            print(f"   🗺️  Zona: {zone}")
        
        return True
        
    except requests.RequestException as e:
        print(f"   ❌ Erro de conexão: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"   ❌ Erro JSON: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        return False

def main():
    """Função principal"""
    print("🎣 TESTE DOS ENDPOINTS DE INFRAESTRUTURAS PESQUEIRAS")
    print("=" * 60)
    
    # Endpoints para testar
    endpoints = [
        {
            'url': 'http://localhost:5080/collections/fishing_ports/items?f=json&limit=1000',
            'name': 'Portos Pesqueiros',
            'expected_count': 8
        },
        {
            'url': 'http://localhost:5080/collections/fishing_villages/items?f=json&limit=1000',
            'name': 'Vilas Pescatórias',
            'expected_count': 10
        },
        {
            'url': 'http://localhost:5080/collections/fishing_infrastructure/items?f=json&limit=1000',
            'name': 'Infraestruturas Complementares',
            'expected_count': 4
        },
        {
            'url': 'http://localhost:5080/collections/fishing_all_infrastructure/items?f=json&limit=1000',
            'name': 'Todas as Infraestruturas (Consolidado)',
            'expected_count': 22
        }
    ]
    
    total_tests = len(endpoints)
    passed_tests = 0
    total_features = 0
    
    for endpoint in endpoints:
        success = test_endpoint(endpoint['url'], endpoint['name'])
        if success:
            passed_tests += 1
            
            # Contar features reais
            try:
                response = requests.get(endpoint['url'], timeout=10)
                data = response.json()
                features_count = len(data.get('features', []))
                total_features += features_count
                
                expected = endpoint['expected_count']
                if features_count == expected:
                    print(f"   ✅ Contagem correta: {features_count}/{expected}")
                else:
                    print(f"   ⚠️  Contagem diferente: {features_count}/{expected}")
                    
            except Exception as e:
                print(f"   ❌ Erro ao contar features: {e}")
    
    print("\n" + "=" * 60)
    print("📋 RESUMO DOS TESTES")
    print(f"✅ Testes passaram: {passed_tests}/{total_tests}")
    print(f"📊 Total de features encontradas: {total_features}")
    print(f"⏰ Testado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if passed_tests == total_tests:
        print("🎉 TODOS OS ENDPOINTS ESTÃO FUNCIONANDO!")
    else:
        print("⚠️  ALGUNS ENDPOINTS APRESENTAM PROBLEMAS")
    
    # Teste adicional - verificar se a interface está acessível
    print("\n🌐 TESTE DA INTERFACE WEB")
    try:
        response = requests.get('http://localhost:8085/qgis_fisheries.html', timeout=5)
        if response.status_code == 200:
            print("✅ Interface QGIS acessível em: http://localhost:8085/qgis_fisheries.html")
        else:
            print(f"❌ Interface retornou status: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao acessar interface: {e}")
    
    # Teste do painel administrativo
    try:
        response = requests.get('http://localhost:8085/admin.html', timeout=5)
        if response.status_code == 200:
            print("✅ Painel admin acessível em: http://localhost:8085/admin.html")
        else:
            print(f"❌ Painel admin retornou status: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao acessar painel admin: {e}")

if __name__ == "__main__":
    main()
