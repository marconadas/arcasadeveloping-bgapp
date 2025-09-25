#!/usr/bin/env python3
"""
Teste da API meteorológica
Verifica se os endpoints de dados meteorológicos estão funcionando
"""

import requests
import json
from datetime import datetime
import sys

def test_velocity_endpoint(base_url="http://localhost:5080"):
    """Testar endpoint de velocidade"""
    
    print("🌊 Testando endpoint de correntes...")
    
    # Testar correntes
    try:
        response = requests.get(f"{base_url}/metocean/velocity?var=currents&resolution=1.0")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Correntes: {len(data['data'])} pontos carregados")
            print(f"   Range U: {data['uMin']:.3f} a {data['uMax']:.3f} m/s")
            print(f"   Range V: {data['vMin']:.3f} a {data['vMax']:.3f} m/s")
        else:
            print(f"❌ Erro correntes: HTTP {response.status_code}")
            print(f"   {response.text}")
    except Exception as e:
        print(f"❌ Erro correntes: {e}")
    
    print("\n💨 Testando endpoint de vento...")
    
    # Testar vento
    try:
        response = requests.get(f"{base_url}/metocean/velocity?var=wind&resolution=1.0")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Vento: {len(data['data'])} pontos carregados")
            print(f"   Range U: {data['uMin']:.3f} a {data['uMax']:.3f} m/s")
            print(f"   Range V: {data['vMin']:.3f} a {data['vMax']:.3f} m/s")
        else:
            print(f"❌ Erro vento: HTTP {response.status_code}")
            print(f"   {response.text}")
    except Exception as e:
        print(f"❌ Erro vento: {e}")

def test_scalar_endpoint(base_url="http://localhost:5080"):
    """Testar endpoint de dados escalares"""
    
    variables = ["sst", "salinity", "chlorophyll"]
    
    for var in variables:
        print(f"\n🌡️ Testando {var.upper()}...")
        
        try:
            response = requests.get(f"{base_url}/metocean/scalar?var={var}")
            if response.status_code == 200:
                data = response.json()
                features = data['features']
                print(f"✅ {var.upper()}: {len(features)} pontos carregados")
                
                # Mostrar alguns valores
                for feature in features[:3]:
                    props = feature['properties']
                    location = props['location']
                    value = props[var]
                    print(f"   {location}: {value}")
            else:
                print(f"❌ Erro {var}: HTTP {response.status_code}")
                print(f"   {response.text}")
        except Exception as e:
            print(f"❌ Erro {var}: {e}")

def test_status_endpoint(base_url="http://localhost:5080"):
    """Testar endpoint de status"""
    
    print("\n📊 Testando status dos serviços...")
    
    try:
        response = requests.get(f"{base_url}/metocean/status")
        if response.status_code == 200:
            data = response.json()
            print("✅ Status obtido:")
            print(f"   Timestamp: {data['timestamp']}")
            print(f"   Serviços: {data['services']}")
            print(f"   Área de cobertura: {data['coverage_area']['name']}")
        else:
            print(f"❌ Erro status: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ Erro status: {e}")

def test_frontend_integration():
    """Testar se frontend pode carregar a página"""
    
    print("\n🌐 Testando integração frontend...")
    
    try:
        response = requests.get("http://localhost:8085/index.html")
        if response.status_code == 200:
            content = response.text
            
            # Verificar se contém as dependências necessárias
            checks = [
                ("leaflet-timedimension", "leaflet-timedimension" in content),
                ("leaflet-velocity", "leaflet-velocity" in content),
                ("metocean.js", "metocean.js" in content),
                ("Botão correntes", 'btn-currents' in content),
                ("Botão vento", 'btn-wind' in content)
            ]
            
            print("✅ Frontend carregado. Verificações:")
            for name, check in checks:
                status = "✅" if check else "❌"
                print(f"   {status} {name}")
                
        else:
            print(f"❌ Erro frontend: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ Erro frontend: {e}")

def main():
    """Executar todos os testes"""
    
    print("🚀 BGAPP - Teste da API Meteorológica")
    print("=" * 50)
    
    # Determinar URL base baseado no ambiente
    base_url = "http://localhost:5080"
    
    # Verificar se a API está rodando
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code != 200:
            print(f"⚠️ API não está respondendo em {base_url}")
            print("   Certifique-se de que o servidor está rodando")
            return
    except:
        print(f"⚠️ Não foi possível conectar a {base_url}")
        print("   Certifique-se de que o servidor está rodando")
        return
    
    print(f"✅ API conectada em {base_url}")
    
    # Executar testes
    test_velocity_endpoint(base_url)
    test_scalar_endpoint(base_url)
    test_status_endpoint(base_url)
    test_frontend_integration()
    
    print("\n" + "=" * 50)
    print("✅ Testes concluídos!")
    print("\n📋 Próximos passos:")
    print("   1. Acesse http://localhost:8085/index.html")
    print("   2. Clique nos botões 'Correntes' e 'Vento'")
    print("   3. Verifique se as animações aparecem")
    print("   4. Use o controle de tempo na parte inferior")

if __name__ == "__main__":
    main()
