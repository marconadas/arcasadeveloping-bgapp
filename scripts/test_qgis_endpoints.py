#!/usr/bin/env python3
"""
Script para testar todos os endpoints QGIS implementados
Verifica funcionalidade após instalação das dependências científicas
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configurações de teste
BASE_URL = "http://localhost:8000"
TIMEOUT = 30  # segundos

class QGISEndpointTester:
    """Classe para testar todos os endpoints QGIS"""
    
    def __init__(self):
        self.results = []
        self.session = None
        
    async def __aenter__(self):
        """Context manager entry"""
        self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=TIMEOUT))
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        if self.session:
            await self.session.close()
    
    async def test_endpoint(self, method: str, endpoint: str, data: Dict = None, 
                           expected_status: int = 200) -> Dict[str, Any]:
        """Testa um endpoint específico"""
        try:
            url = f"{BASE_URL}{endpoint}"
            logger.info(f"Testando {method} {endpoint}")
            
            if method.upper() == 'GET':
                async with self.session.get(url) as response:
                    status = response.status
                    try:
                        content = await response.json()
                    except:
                        content = await response.text()
            
            elif method.upper() == 'POST':
                headers = {'Content-Type': 'application/json'}
                async with self.session.post(url, json=data, headers=headers) as response:
                    status = response.status
                    try:
                        content = await response.json()
                    except:
                        content = await response.text()
            
            success = status == expected_status
            result = {
                'endpoint': endpoint,
                'method': method,
                'status_code': status,
                'expected_status': expected_status,
                'success': success,
                'response_preview': str(content)[:200] + '...' if len(str(content)) > 200 else str(content),
                'timestamp': datetime.now().isoformat()
            }
            
            if success:
                logger.info(f"✅ {endpoint} - Status: {status}")
            else:
                logger.error(f"❌ {endpoint} - Status: {status}, Expected: {expected_status}")
                
            return result
            
        except Exception as e:
            logger.error(f"❌ {endpoint} - Erro: {str(e)}")
            return {
                'endpoint': endpoint,
                'method': method,
                'status_code': None,
                'expected_status': expected_status,
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def test_all_endpoints(self):
        """Testa todos os endpoints QGIS"""
        
        # 1. Status Geral
        await self.test_endpoint('GET', '/qgis/status')
        
        # 2. Visualização Temporal
        temporal_data = {
            "variable": "chlorophyll_a",
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "region": "angola_waters"
        }
        
        await self.test_endpoint('POST', '/qgis/temporal/slider-config', temporal_data)
        await self.test_endpoint('POST', '/qgis/temporal/multi-variable', {
            "variables": ["chlorophyll_a", "sea_surface_temperature"],
            "start_date": "2024-01-01",
            "end_date": "2024-03-31"
        })
        await self.test_endpoint('POST', '/qgis/temporal/migration-animation', {
            "species": "tuna",
            "start_date": "2024-01-01",
            "end_date": "2024-06-30"
        })
        await self.test_endpoint('GET', '/qgis/temporal/statistics/chlorophyll_a?start_date=2024-01-01&end_date=2024-12-31')
        
        # 3. Análise Espacial
        spatial_data = {
            "geometries": [
                {"type": "Point", "coordinates": [13.2317, -8.8383]},  # Luanda
                {"type": "Point", "coordinates": [13.4049, -12.5756]}  # Benguela
            ],
            "buffer_distance": 1000  # metros
        }
        
        await self.test_endpoint('POST', '/qgis/spatial/buffer-zones', spatial_data)
        
        connectivity_data = {
            "habitats": [
                {"type": "Point", "coordinates": [13.2317, -8.8383], "habitat_type": "coral_reef"},
                {"type": "Point", "coordinates": [13.4049, -12.5756], "habitat_type": "seagrass"}
            ],
            "species_mobility": 50.0  # km
        }
        
        await self.test_endpoint('POST', '/qgis/spatial/connectivity-analysis', connectivity_data)
        
        hotspots_data = {
            "point_data": [
                {"coordinates": [13.2317, -8.8383], "biomass": 150.5},
                {"coordinates": [13.4049, -12.5756], "biomass": 200.3},
                {"coordinates": [12.8086, -5.7269], "biomass": 175.8}  # Cabinda
            ],
            "analysis_field": "biomass"
        }
        
        await self.test_endpoint('POST', '/qgis/spatial/hotspots', hotspots_data)
        await self.test_endpoint('GET', '/qgis/spatial/marine-planning-demo')
        
        # 4. Calculadora de Biomassa
        biomass_terrestrial_data = {
            "region_bounds": {
                "north": -5.0,
                "south": -18.0,
                "east": 24.0,
                "west": 11.0
            },
            "vegetation_type": "mixed"
        }
        
        await self.test_endpoint('POST', '/qgis/biomass/terrestrial', biomass_terrestrial_data)
        
        biomass_marine_data = {
            "region_bounds": {
                "north": -5.0,
                "south": -18.0,
                "east": 24.0,
                "west": 11.0
            }
        }
        
        await self.test_endpoint('POST', '/qgis/biomass/marine-phytoplankton', biomass_marine_data)
        await self.test_endpoint('GET', '/qgis/biomass/angola-assessment')
        
        # 5. Migração vs Pesca
        migration_data = {
            "species": "tuna",
            "start_date": "2024-01-01",
            "end_date": "2024-06-30"
        }
        
        await self.test_endpoint('POST', '/qgis/migration/load-trajectories', migration_data)
        await self.test_endpoint('GET', '/qgis/migration/fishing-analysis')
        
        # 6. Relatórios Automáticos
        report_data = {
            "report_type": "biomass_assessment",
            "output_filename": "test_report.pdf"
        }
        
        await self.test_endpoint('POST', '/qgis/reports/generate', report_data)
        await self.test_endpoint('GET', '/qgis/reports/monthly/2024/1')
        
        # 7. MCDA Zonas Sustentáveis
        await self.test_endpoint('POST', '/qgis/mcda/marine-protected-areas', {})
        await self.test_endpoint('POST', '/qgis/mcda/sustainable-fishing-zones', {})
        
        mcda_custom_data = {
            "zone_type": "fishing",
            "criteria_weights": {
                "biodiversity": 0.3,
                "fish_abundance": 0.4,
                "accessibility": 0.2,
                "protection_status": 0.1
            }
        }
        
        await self.test_endpoint('POST', '/qgis/mcda/custom-analysis', mcda_custom_data)
        
        # 8. Monitorização de Saúde
        await self.test_endpoint('GET', '/qgis/health/status')
        await self.test_endpoint('GET', '/qgis/health/metrics/biomass_calculator')
        
        return self.results
    
    def generate_report(self):
        """Gera relatório dos testes"""
        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r.get('success', False))
        failed_tests = total_tests - successful_tests
        
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = f"""
# 🧪 RELATÓRIO DE TESTES - ENDPOINTS QGIS

## 📊 Resumo dos Resultados
- **Total de Testes**: {total_tests}
- **Sucessos**: {successful_tests} ✅
- **Falhas**: {failed_tests} ❌
- **Taxa de Sucesso**: {success_rate:.1f}%

## 📋 Detalhes dos Testes

"""
        
        for result in self.results:
            status_icon = "✅" if result.get('success', False) else "❌"
            report += f"### {status_icon} {result['method']} {result['endpoint']}\n"
            report += f"- **Status**: {result.get('status_code', 'N/A')}\n"
            report += f"- **Esperado**: {result['expected_status']}\n"
            
            if 'error' in result:
                report += f"- **Erro**: {result['error']}\n"
            else:
                report += f"- **Resposta**: {result['response_preview']}\n"
            
            report += f"- **Timestamp**: {result['timestamp']}\n\n"
        
        return report

async def main():
    """Função principal"""
    logger.info("🚀 Iniciando testes dos endpoints QGIS...")
    
    async with QGISEndpointTester() as tester:
        results = await tester.test_all_endpoints()
        tester.results = results
        
        # Gerar relatório
        report = tester.generate_report()
        
        # Salvar relatório
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"logs/qgis_endpoints_test_{timestamp}.md"
        
        with open(report_filename, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"📄 Relatório salvo em: {report_filename}")
        
        # Salvar dados JSON para análise
        json_filename = f"logs/qgis_endpoints_test_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📊 Dados JSON salvos em: {json_filename}")
        
        # Exibir resumo no console
        total = len(results)
        success = sum(1 for r in results if r.get('success', False))
        
        print(f"\n{'='*50}")
        print(f"RESUMO DOS TESTES QGIS")
        print(f"{'='*50}")
        print(f"Total: {total}")
        print(f"Sucessos: {success} ✅")
        print(f"Falhas: {total - success} ❌")
        print(f"Taxa de Sucesso: {success/total*100:.1f}%")
        print(f"{'='*50}\n")
        
        return success == total

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("⏹️ Testes interrompidos pelo usuário")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Erro fatal: {str(e)}")
        sys.exit(1)
