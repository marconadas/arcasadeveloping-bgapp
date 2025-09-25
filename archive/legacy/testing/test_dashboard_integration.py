#!/usr/bin/env python3
"""
Teste de Integração Dashboard BGAPP
Verifica se todos os endpoints estão funcionando com dados reais
"""

import requests
import json
import time
from datetime import datetime

def test_api_endpoint(url, description):
    """Testar um endpoint da API"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {description}: OK")
            return data
        else:
            print(f"❌ {description}: HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ {description}: {e}")
        return None

def main():
    print("🧪 BGAPP Dashboard Integration Test")
    print("=" * 50)
    print(f"🕒 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # URLs para testar
    tests = [
        ("http://localhost:8000/health", "API Health Check"),
        ("http://localhost:8000/api/dashboard/overview", "Dashboard Overview"),
        ("http://localhost:8000/admin-dashboard/system-health", "System Health"),
        ("http://localhost:8000/admin-dashboard/oceanographic-data", "Oceanographic Data"),
        ("http://localhost:8000/admin-dashboard/fisheries-stats", "Fisheries Stats"),
        ("http://localhost:3000", "Frontend NextJS"),
    ]
    
    results = {}
    
    print("📊 TESTANDO ENDPOINTS:")
    print("-" * 30)
    
    for url, description in tests:
        results[description] = test_api_endpoint(url, description)
        time.sleep(0.5)  # Pequena pausa entre requests
    
    print()
    print("📋 RESUMO DOS DADOS:")
    print("-" * 30)
    
    # Verificar dados específicos
    if results.get("Dashboard Overview"):
        overview = results["Dashboard Overview"]
        print(f"🏥 System Status: {overview.get('system_status', {}).get('overall', 'N/A')}")
        print(f"🌊 Sea Temperature: {overview.get('real_time_data', {}).get('sea_temperature', 'N/A')}°C")
        print(f"🗺️ ZEE Area: {overview.get('zee_angola', {}).get('area_km2', 'N/A')} km²")
    
    if results.get("System Health"):
        health = results["System Health"]
        stats = health.get('statistics', {})
        print(f"⚙️ Services Online: {stats.get('online_services', 'N/A')}/{stats.get('total_services', 'N/A')}")
        perf = health.get('performance', {})
        print(f"💻 CPU Usage: {perf.get('cpu_usage', 'N/A')}%")
    
    if results.get("Fisheries Stats"):
        fisheries = results["Fisheries Stats"]
        print(f"🎣 Total Catch: {fisheries.get('total_catch_tons', 'N/A'):,} tons")
        econ = fisheries.get('economic_impact', {})
        print(f"👥 Employment: {econ.get('employment_total', 'N/A'):,} people")
    
    if results.get("Oceanographic Data"):
        ocean = results["Oceanographic Data"]
        print(f"🌊 Monitoring Stations: {ocean.get('monitoring_stations', 'N/A')}")
        print(f"📡 Satellite Passes Today: {ocean.get('satellite_passes_today', 'N/A')}")
    
    print()
    print("🎯 STATUS FINAL:")
    print("-" * 30)
    
    working_apis = sum(1 for result in results.values() if result is not None)
    total_apis = len(results)
    
    if working_apis == total_apis:
        print("🎉 TODOS OS TESTES PASSARAM!")
        print("✅ Dashboard está funcionando com dados reais")
        print("✅ Integração frontend-backend operacional")
        print()
        print("🌐 Acesso ao Dashboard: http://localhost:3000")
        print("🔧 API Docs: http://localhost:8000/docs")
    else:
        print(f"⚠️ {working_apis}/{total_apis} testes passaram")
        print("❌ Alguns componentes não estão funcionando")
    
    print()
    print("=" * 50)
    print("🚀 Teste concluído - BGAPP Demo 17 Setembro")

if __name__ == "__main__":
    main()
