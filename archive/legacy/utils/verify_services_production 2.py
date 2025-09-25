#!/usr/bin/env python3
"""
Script de Verificação de Serviços BGAPP para Produção
Testa serviços com configurações adequadas para ambiente de produção
"""

import asyncio
import aiohttp
import ssl
import json
import time
from datetime import datetime
from pathlib import Path

class ProductionServiceVerifier:
    def __init__(self):
        # Configuração SSL mais permissiva para testes
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE
        
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
            "Leaflet CDN": [
                "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
                "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            ],
            "Cloudflare": [
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"
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
                
                # Configurar timeout e headers adequados
                timeout = aiohttp.ClientTimeout(total=15)
                headers = {
                    'User-Agent': 'BGAPP/1.0 Service Verifier',
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive'
                }
                
                async with session.get(
                    url, 
                    timeout=timeout, 
                    ssl=self.ssl_context,
                    headers=headers,
                    allow_redirects=True
                ) as response:
                    end_time = time.time()
                    response_time = round((end_time - start_time) * 1000, 2)
                    
                    # Ler conteúdo para verificar se é válido
                    content = await response.read()
                    content_length = len(content)
                    
                    # Verificar se é uma resposta válida
                    is_valid = self.validate_response(url, response, content)
                    
                    result = {
                        "url": url,
                        "status": response.status,
                        "response_time_ms": response_time,
                        "success": 200 <= response.status < 400 and is_valid,
                        "content_length": content_length,
                        "content_type": response.headers.get('Content-Type', 'unknown'),
                        "valid_content": is_valid
                    }
                    
                    if result["success"]:
                        print(f"  ✅ {self.truncate_url(url)} - {response.status} ({response_time}ms) - {content_length} bytes")
                    else:
                        print(f"  ❌ {self.truncate_url(url)} - {response.status} ({response_time}ms) - Invalid content")
                    
                    service_results.append(result)
                    
            except asyncio.TimeoutError:
                print(f"  ⏱️ {self.truncate_url(url)} - TIMEOUT (>15s)")
                service_results.append({
                    "url": url,
                    "status": "TIMEOUT",
                    "response_time_ms": 15000,
                    "success": False,
                    "error": "Timeout after 15 seconds"
                })
            except Exception as e:
                error_msg = str(e)
                if "SSL" in error_msg:
                    error_type = "SSL_ERROR"
                elif "DNS" in error_msg or "resolve" in error_msg.lower():
                    error_type = "DNS_ERROR"
                else:
                    error_type = "CONNECTION_ERROR"
                
                print(f"  ❌ {self.truncate_url(url)} - {error_type}")
                service_results.append({
                    "url": url,
                    "status": error_type,
                    "response_time_ms": 0,
                    "success": False,
                    "error": error_msg
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
    
    def validate_response(self, url, response, content):
        """Validar se a resposta é válida para o tipo de serviço"""
        if response.status != 200:
            return False
            
        content_type = response.headers.get('Content-Type', '').lower()
        
        # Validações específicas por tipo de conteúdo
        if url.endswith('.png'):
            return content_type.startswith('image/') and len(content) > 100
        elif url.endswith('.css'):
            return 'text/css' in content_type and len(content) > 50
        elif url.endswith('.js'):
            return 'javascript' in content_type and len(content) > 100
        elif 'wms' in url.lower():
            return 'xml' in content_type and b'WMS_Capabilities' in content
        else:
            return len(content) > 0
    
    def truncate_url(self, url, max_length=60):
        """Truncar URL para display"""
        if len(url) <= max_length:
            return url
        return url[:max_length-3] + "..."
    
    async def run_all_tests(self):
        """Executar todos os testes de serviço"""
        print("🔍 BGAPP - Verificação de Serviços para Produção")
        print("=" * 55)
        print(f"📅 Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🌐 Domínio Alvo: arcasadeveloping.org")
        print()
        
        # Configurar sessão HTTP com configurações de produção
        connector = aiohttp.TCPConnector(
            ssl=self.ssl_context,
            limit=10,
            limit_per_host=5,
            keepalive_timeout=30
        )
        
        timeout = aiohttp.ClientTimeout(total=20)
        
        async with aiohttp.ClientSession(
            connector=connector,
            timeout=timeout
        ) as session:
            tasks = []
            for service_name, urls in self.services.items():
                task = self.test_service(session, service_name, urls)
                tasks.append(task)
            
            await asyncio.gather(*tasks, return_exceptions=True)
        
        self.generate_production_report()
    
    def generate_production_report(self):
        """Gerar relatório de produção"""
        print("\n📊 RELATÓRIO DE PRODUÇÃO")
        print("=" * 55)
        
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
            if result['avg_response_time_ms'] > 0:
                print(f"   Tempo Médio: {result['avg_response_time_ms']:.1f}ms")
            print()
        
        # Análise de deploy
        print("🚀 ANÁLISE PARA DEPLOY:")
        
        if operational_services == total_services:
            print("🎉 EXCELENTE: Todos os serviços operacionais!")
            print("✅ Deploy recomendado - sistema totalmente funcional")
        elif operational_services >= total_services * 0.8:
            print("✅ BOM: Maioria dos serviços operacionais")
            print("🔄 Deploy pode prosseguir com monitoramento ativo")
        elif operational_services >= total_services * 0.5:
            print("⚠️ CUIDADO: Apenas metade dos serviços funcionais")
            print("🔍 Recomenda-se investigação antes do deploy")
        else:
            print("❌ CRÍTICO: Muitos serviços indisponíveis")
            print("🛑 Deploy NÃO recomendado até resolução dos problemas")
        
        print()
        print("💡 IMPACTO NO BGAPP:")
        
        # Análise de impacto específica
        if self.results.get("OpenStreetMap", {}).get("status") == "OPERATIONAL":
            print("✅ Mapas base funcionarão normalmente")
        else:
            print("⚠️ Mapas base podem ter problemas - usar fallbacks")
            
        if self.results.get("EOX Maps", {}).get("status") == "OPERATIONAL":
            print("✅ Dados batimétricos disponíveis")
        else:
            print("⚠️ Dados batimétricos indisponíveis - usar alternativas")
            
        if self.results.get("Leaflet CDN", {}).get("status") == "OPERATIONAL":
            print("✅ Biblioteca de mapas carregará normalmente")
        else:
            print("⚠️ Usar CDN alternativo ou versão local do Leaflet")
        
        # Salvar relatório
        self.save_production_report()
    
    def save_production_report(self):
        """Salvar relatório de produção"""
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "target_domain": "arcasadeveloping.org",
            "services": self.results,
            "summary": {
                "total_services": len(self.services),
                "operational": sum(1 for r in self.results.values() if r["status"] == "OPERATIONAL"),
                "degraded": sum(1 for r in self.results.values() if r["status"] == "DEGRADED"),
                "down": sum(1 for r in self.results.values() if r["status"] == "DOWN")
            },
            "deployment_recommendation": self.get_deployment_recommendation()
        }
        
        # Salvar no diretório de deploy também
        deploy_dir = Path("deploy_arcasadeveloping")
        if deploy_dir.exists():
            report_path = deploy_dir / "service_status_report.json"
        else:
            report_path = Path("service_status_report.json")
            
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Relatório salvo em: {report_path}")
    
    def get_deployment_recommendation(self):
        """Obter recomendação de deployment"""
        total_services = len(self.services)
        operational_services = sum(1 for result in self.results.values() if result["status"] == "OPERATIONAL")
        
        if operational_services == total_services:
            return "RECOMMENDED - All services operational"
        elif operational_services >= total_services * 0.8:
            return "PROCEED_WITH_MONITORING - Most services operational"
        elif operational_services >= total_services * 0.5:
            return "INVESTIGATE_FIRST - Half services operational"
        else:
            return "NOT_RECOMMENDED - Too many services down"

async def main():
    """Função principal"""
    verifier = ProductionServiceVerifier()
    await verifier.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
