#!/usr/bin/env python3
"""
Script de Teste do Sistema de Machine Learning para Biodiversidade
Demonstra todas as funcionalidades implementadas
"""

import asyncio
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, Any

# Configurações
BASE_URL = "http://localhost:8000"
ML_API_URL = f"{BASE_URL}/ml"

# Token de exemplo (em produção seria obtido via autenticação)
EXAMPLE_TOKEN = "example_token_for_testing"

class MLSystemTester:
    """Testador do sistema de ML"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {EXAMPLE_TOKEN}",
            "Content-Type": "application/json"
        })
        
        # Configurar timeout para evitar esperas longas
        self.session.timeout = 30
    
    def check_application_running(self):
        """Verifica se a aplicação está rodando"""
        print("🔍 Verificando se a aplicação BGAPP está rodando...")
        
        # Tentar diferentes URLs possíveis
        possible_urls = [
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "http://localhost:8085",  # Frontend
        ]
        
        for url in possible_urls:
            try:
                response = requests.get(f"{url}/health", timeout=5)
                if response.status_code == 200:
                    print(f"✅ Aplicação encontrada em: {url}")
                    # Atualizar URLs globais
                    global BASE_URL, ML_API_URL
                    BASE_URL = url
                    ML_API_URL = f"{url}/ml"
                    return True
            except:
                continue
        
        # Se não encontrou, dar instruções
        print("❌ Aplicação BGAPP não está rodando!")
        print("\n📋 Para iniciar a aplicação, execute um dos comandos:")
        print("   🐳 Docker (recomendado): ./start_bgapp_local.sh")
        print("   🐍 Python direto: python -m uvicorn src.bgapp.admin_api:app --host 0.0.0.0 --port 8000")
        print("   📦 Docker Compose: cd infra && docker compose up -d")
        print("\n⏳ Aguarde alguns segundos após iniciar e execute o teste novamente.")
        return False
    
    def test_health_check(self):
        """Testa health check da API"""
        print("🏥 Testando health check...")
        
        try:
            response = self.session.get(f"{ML_API_URL}/health")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Health check OK: {data['status']}")
                return True
            else:
                print(f"❌ Health check falhou: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro no health check: {e}")
            return False
    
    def test_database_initialization(self):
        """Testa inicialização da base de dados"""
        print("📊 Testando inicialização da BD...")
        
        try:
            response = self.session.post(
                f"{BASE_URL}/initialize-ml-database",
                params={"create_sample_data": True}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ BD inicializada: {data['message']}")
                print(f"   Schemas criados: {len(data['results'].get('schemas_created', []))}")
                return True
            else:
                print(f"❌ Erro na inicialização: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Erro na inicialização da BD: {e}")
            return False
    
    def test_create_biodiversity_study(self):
        """Testa criação de estudo de biodiversidade"""
        print("🐟 Testando criação de estudo...")
        
        study_data = {
            "study_name": "Teste Automático - Costa de Luanda",
            "study_type": "species_survey",
            "description": "Estudo de teste criado automaticamente pelo script",
            "latitude": -8.8383,
            "longitude": 13.2344,
            "depth_min": 5.0,
            "depth_max": 30.0,
            "area_coverage_km2": 2.5,
            "species_observed": [
                {
                    "species_name": "Sardinella aurita",
                    "count": 25,
                    "size_avg": 14.2,
                    "abundance": 75
                },
                {
                    "species_name": "Trachurus capensis",
                    "count": 12,
                    "size_avg": 18.5,
                    "abundance": 45
                }
            ],
            "environmental_parameters": {
                "temperature": 24.8,
                "salinity": 35.1,
                "ph": 8.0,
                "chlorophyll": 2.3
            },
            "sampling_method": "visual_census",
            "sample_size": 37,
            "data_source": "research_vessel",
            "institution": "Instituto de Teste Automático",
            "equipment_used": ["underwater_camera", "conductivity_meter", "ph_meter"],
            "notes": "Estudo criado automaticamente para demonstração do sistema"
        }
        
        try:
            response = self.session.post(f"{ML_API_URL}/studies", json=study_data)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Estudo criado: {data['study_id']}")
                print(f"   Qualidade: {data['data_quality_score']:.2f}")
                print(f"   Processado para ML: {data['processed_for_ml']}")
                return data['study_id']
            else:
                print(f"❌ Erro criando estudo: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Erro criando estudo: {e}")
            return None
    
    def test_ml_prediction(self):
        """Testa predição de ML"""
        print("🧠 Testando predição de ML...")
        
        prediction_data = {
            "model_type": "biodiversity_predictor",
            "input_data": {
                "latitude": -8.8383,
                "longitude": 13.2344,
                "depth": 20.0,
                "temperature": 24.8,
                "salinity": 35.1,
                "ph": 8.0
            },
            "latitude": -8.8383,
            "longitude": 13.2344,
            "area_name": "Costa de Luanda - Teste",
            "confidence_threshold": 0.5,
            "use_for_mapping": True
        }
        
        try:
            response = self.session.post(f"{ML_API_URL}/predict", json=prediction_data)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Predição realizada: {data['prediction_id']}")
                print(f"   Resultado: {data['prediction']}")
                print(f"   Confiança: {data['confidence']:.2f}")
                print(f"   Usado para mapeamento: {data['used_for_mapping']}")
                return data['prediction_id']
            else:
                print(f"❌ Erro na predição: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Erro na predição: {e}")
            return None
    
    def test_create_filter(self):
        """Testa criação de filtro preditivo"""
        print("🗺️ Testando criação de filtro...")
        
        filter_data = {
            "name": "Hotspots de Biodiversidade - Teste",
            "filter_type": "biodiversity_hotspots",
            "description": "Filtro de teste para identificar áreas com alta biodiversidade",
            "model_id": "biodiversity_predictor_v1",
            "min_confidence": 0.7,
            "max_age_hours": 72,
            "min_longitude": 12.0,
            "min_latitude": -10.0,
            "max_longitude": 14.0,
            "max_latitude": -8.0,
            "color_scheme": "viridis",
            "opacity": 0.8,
            "show_confidence": True
        }
        
        try:
            response = self.session.post(f"{ML_API_URL}/filters", json=filter_data)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Filtro criado: {data['filter_id']}")
                print(f"   Nome: {data['name']}")
                print(f"   Pontos: {data['total_points']}")
                return data['filter_id']
            else:
                print(f"❌ Erro criando filtro: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Erro criando filtro: {e}")
            return None
    
    def test_get_filter_data(self, filter_id: str):
        """Testa obtenção de dados do filtro"""
        print(f"📍 Testando dados do filtro {filter_id}...")
        
        try:
            response = self.session.get(f"{ML_API_URL}/filters/{filter_id}/data")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Dados do filtro obtidos:")
                print(f"   Nome: {data['name']}")
                print(f"   Tipo: {data['type']}")
                print(f"   Total de pontos: {data['total_points']}")
                print(f"   Features GeoJSON: {len(data['geojson']['features'])}")
                return True
            else:
                print(f"❌ Erro obtendo dados do filtro: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro obtendo dados do filtro: {e}")
            return False
    
    def test_system_statistics(self):
        """Testa estatísticas do sistema"""
        print("📊 Testando estatísticas do sistema...")
        
        try:
            # Estatísticas de ML
            response = self.session.get(f"{ML_API_URL}/stats")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Estatísticas de ML:")
                print(f"   Total de estudos: {data['total_studies']}")
                print(f"   Estudos processados: {data['processed_studies']}")
                print(f"   Modelos ativos: {data['active_models']}")
                print(f"   Filtros ativos: {data['active_filters']}")
                print(f"   Total de predições: {data['total_predictions']}")
                print(f"   Saúde do sistema: {data['system_health']}")
            
            # Estatísticas de estudos
            response = self.session.get(f"{BASE_URL}/biodiversity-studies/stats")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Estatísticas de estudos:")
                print(f"   Total: {data['general'].get('total_studies', 0)}")
                print(f"   Processados: {data['general'].get('processed_studies', 0)}")
                print(f"   Qualidade média: {data['general'].get('avg_quality', 0):.2f}")
                print(f"   Tipos de estudo: {data['general'].get('study_types', 0)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Erro obtendo estatísticas: {e}")
            return False
    
    def test_list_models(self):
        """Testa listagem de modelos"""
        print("🤖 Testando listagem de modelos...")
        
        try:
            response = self.session.get(f"{ML_API_URL}/models")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Modelos disponíveis: {data['total']}")
                print(f"   Modelos treinados: {data['available']}")
                
                for model in data['models'][:3]:  # Mostrar apenas os 3 primeiros
                    print(f"   - {model['name']}: {model['accuracy']:.2f}% precisão")
                
                return True
            else:
                print(f"❌ Erro listando modelos: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro listando modelos: {e}")
            return False
    
    def test_list_filters(self):
        """Testa listagem de filtros"""
        print("🔍 Testando listagem de filtros...")
        
        try:
            response = self.session.get(f"{ML_API_URL}/filters")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Filtros disponíveis: {data['total']}")
                print(f"   Filtros ativos: {data['active']}")
                
                for filter_info in data['filters'][:3]:  # Mostrar apenas os 3 primeiros
                    print(f"   - {filter_info['name']}: {filter_info['point_count']} pontos")
                
                return True
            else:
                print(f"❌ Erro listando filtros: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro listando filtros: {e}")
            return False
    
    def run_all_tests(self):
        """Executa todos os testes"""
        print("🚀 Iniciando testes do sistema de ML para biodiversidade")
        print("=" * 60)
        
        # Primeiro, verificar se a aplicação está rodando
        if not self.check_application_running():
            return {"error": "Aplicação não está rodando"}
        print()
        
        results = {}
        
        # Teste 1: Health check
        results['health_check'] = self.test_health_check()
        print()
        
        # Teste 2: Inicialização da BD
        results['database_init'] = self.test_database_initialization()
        print()
        
        # Aguardar um pouco para a BD ser inicializada
        print("⏳ Aguardando inicialização da BD...")
        import time
        time.sleep(3)
        print()
        
        # Teste 3: Criar estudo
        study_id = self.test_create_biodiversity_study()
        results['create_study'] = study_id is not None
        print()
        
        # Teste 4: Fazer predição
        prediction_id = self.test_ml_prediction()
        results['ml_prediction'] = prediction_id is not None
        print()
        
        # Teste 5: Criar filtro
        filter_id = self.test_create_filter()
        results['create_filter'] = filter_id is not None
        print()
        
        # Teste 6: Obter dados do filtro
        if filter_id:
            results['filter_data'] = self.test_get_filter_data(filter_id)
        else:
            results['filter_data'] = False
        print()
        
        # Teste 7: Listar modelos
        results['list_models'] = self.test_list_models()
        print()
        
        # Teste 8: Listar filtros
        results['list_filters'] = self.test_list_filters()
        print()
        
        # Teste 9: Estatísticas
        results['system_stats'] = self.test_system_statistics()
        print()
        
        # Resumo
        print("=" * 60)
        print("📈 RESUMO DOS TESTES")
        print("=" * 60)
        
        passed = sum(results.values())
        total = len(results)
        
        for test_name, passed_test in results.items():
            status = "✅ PASSOU" if passed_test else "❌ FALHOU"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        print(f"\nResultado final: {passed}/{total} testes passaram ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente.")
        elif passed >= total * 0.8:
            print("✅ Maioria dos testes passou. Sistema funcionando bem.")
        else:
            print("⚠️ Vários testes falharam. Verificar configuração do sistema.")
        
        return results

def main():
    """Função principal"""
    print("🌊 BGAPP - Sistema de Machine Learning para Biodiversidade Marinha")
    print("Testador Automático de Funcionalidades")
    print()
    
    tester = MLSystemTester()
    results = tester.run_all_tests()
    
    return results

if __name__ == "__main__":
    main()
