#!/usr/bin/env python3
"""
Script de Verificação de Serviços BGAPP
Testa todos os serviços externos necessários para o funcionamento
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from pathlib import Path

class ServiceVerifier:
    def __init__(self):
        self.services = {
            "OpenStreetMap": [
                "https://a.tile.openstreetmap.org/0/0/0.png",
                "https://b.tile.openstreetmap.org/0/0/0.png",
                "https://c.tile.openstreetmap.org/0/0/0.png"
            ],
            "CartoDB": [
                "https://a.basemaps.cartocdn.com/light_all/0/0/0.png",
                "https://b.basemaps.cartocdn.com/dark_all/0/0/0.png"
            ],
            "ESRI": [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/0/0/0"
            ],
            "EOX Maps": [
                "https://tiles.maps.eox.at/wms?service=WMS&request=GetCapabilities&version=1.3.0"
            ],
            "GEBCO": [
                "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?service=WMS&request=GetCapabilities"
            ],
            "Leaflet CDN": [
                "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
                "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            ]
        }
        
        self.results = {}
        
    async def test_service(self, session, service_name, urls):
        """Testar um serviço específico"""
        print(f"🔍 Testando {service_name}...")
        
        service_results = []
        
        for url in urls:
            try:
                start_time = time.time()
                async with session.get(url, timeout=10) as response:
                    end_time = time.time()
                    response_time = round((end_time - start_time) * 1000, 2)
                    
                    result = {
                        "url": url,
                        "status": response.status,
                        "response_time_ms": response_time,
                        "success": 200 <= response.status < 400,
                        "content_length": len(await response.read()) if response.status == 200 else 0
                    }
                    
                    if result["success"]:
                        print(f"  ✅ {url} - {response.status} ({response_time}ms)")
                    else:
                        print(f"  ❌ {url} - {response.status} ({response_time}ms)")
                    
                    service_results.append(result)
                    
            except asyncio.TimeoutError:
                print(f"  ⏱️ {url} - TIMEOUT (>10s)")
                service_results.append({
                    "url": url,
                    "status": "TIMEOUT",
                    "response_time_ms": 10000,
                    "success": False,
                    "error": "Timeout after 10 seconds"
                })
            except Exception as e:
                print(f"  ❌ {url} - ERROR: {str(e)}")
                service_results.append({
                    "url": url,
                    "status": "ERROR",
                    "response_time_ms": 0,
                    "success": False,
                    "error": str(e)
                })
        
        # Calcular estatísticas do serviço
        successful = [r for r in service_results if r["success"]]
        success_rate = len(successful) / len(service_results) * 100
        avg_response_time = sum(r["response_time_ms"] for r in successful) / len(successful) if successful else 0
        
        self.results[service_name] = {
            "tests": service_results,
            "success_rate": success_rate,
            "avg_response_time_ms": round(avg_response_time, 2),
            "status": "OPERATIONAL" if success_rate >= 80 else "DEGRADED" if success_rate >= 50 else "DOWN"
        }
        
        status_emoji = "✅" if success_rate >= 80 else "⚠️" if success_rate >= 50 else "❌"
        print(f"  {status_emoji} {service_name}: {success_rate:.1f}% success rate")
    
    async def run_all_tests(self):
        """Executar todos os testes de serviço"""
        print("🔍 BGAPP - Verificação de Serviços Externos")
        print("=" * 50)
        print(f"📅 Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for service_name, urls in self.services.items():
                task = self.test_service(session, service_name, urls)
                tasks.append(task)
            
            await asyncio.gather(*tasks)
        
        self.generate_report()
    
    def generate_report(self):
        """Gerar relatório final"""
        print("\n📊 RELATÓRIO FINAL")
        print("=" * 50)
        
        total_services = len(self.services)
        operational_services = sum(1 for result in self.results.values() if result["status"] == "OPERATIONAL")
        degraded_services = sum(1 for result in self.results.values() if result["status"] == "DEGRADED")
        down_services = sum(1 for result in self.results.values() if result["status"] == "DOWN")
        
        print(f"📈 Serviços Operacionais: {operational_services}/{total_services}")
        print(f"⚠️ Serviços Degradados: {degraded_services}/{total_services}")
        print(f"❌ Serviços Indisponíveis: {down_services}/{total_services}")
        print()
        
        # Detalhes por serviço
        for service_name, result in self.results.items():
            status_emoji = "✅" if result["status"] == "OPERATIONAL" else "⚠️" if result["status"] == "DEGRADED" else "❌"
            print(f"{status_emoji} {service_name}")
            print(f"   Status: {result['status']}")
            print(f"   Taxa de Sucesso: {result['success_rate']:.1f}%")
            print(f"   Tempo Médio: {result['avg_response_time_ms']:.1f}ms")
            print()
        
        # Recomendações
        print("💡 RECOMENDAÇÕES:")
        
        if operational_services == total_services:
            print("🎉 Todos os serviços estão operacionais! Deploy pode prosseguir.")
        elif operational_services >= total_services * 0.8:
            print("✅ Maioria dos serviços operacionais. Deploy recomendado com monitoramento.")
        else:
            print("⚠️ Muitos serviços com problemas. Considere aguardar antes do deploy.")
        
        if down_services > 0:
            print("🔧 Serviços indisponíveis podem afetar funcionalidades específicas.")
        
        if degraded_services > 0:
            print("📈 Serviços degradados podem ter performance reduzida.")
        
        # Salvar relatório em JSON
        self.save_report()
    
    def save_report(self):
        """Salvar relatório em arquivo JSON"""
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "services": self.results,
            "summary": {
                "total_services": len(self.services),
                "operational": sum(1 for r in self.results.values() if r["status"] == "OPERATIONAL"),
                "degraded": sum(1 for r in self.results.values() if r["status"] == "DEGRADED"),
                "down": sum(1 for r in self.results.values() if r["status"] == "DOWN")
            }
        }
        
        report_path = Path("service_verification_report.json")
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Relatório salvo em: {report_path}")

async def main():
    """Função principal"""
    verifier = ServiceVerifier()
    await verifier.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
