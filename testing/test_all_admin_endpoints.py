#!/usr/bin/env python3
"""
Teste Completo de Todos os Endpoints do Admin API
Verifica se todos os endpoints implementados estão funcionando
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class AdminAPITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.admin_api = f"{base_url}/admin-api"
        self.session = requests.Session()
        self.results = []
        
    def test_endpoint(self, endpoint: str, method: str = "GET", 
                     data: Dict = None, expected_fields: List[str] = None) -> Dict[str, Any]:
        """Testar um endpoint específico"""
        full_url = f"{self.admin_api}{endpoint}"
        
        try:
            start_time = time.time()
            
            if method == "GET":
                response = self.session.get(full_url, timeout=10)
            elif method == "POST":
                response = self.session.post(full_url, json=data or {}, timeout=10)
            else:
                response = self.session.request(method, full_url, json=data or {}, timeout=10)
            
            response_time = round((time.time() - start_time) * 1000, 2)  # ms
            
            result = {
                "endpoint": endpoint,
                "method": method,
                "status_code": response.status_code,
                "response_time_ms": response_time,
                "success": response.status_code == 200,
                "timestamp": datetime.now().isoformat()
            }
            
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    result["has_data"] = bool(response_data)
                    result["data_keys"] = list(response_data.keys()) if isinstance(response_data, dict) else []
                    
                    # Verificar campos esperados
                    if expected_fields and isinstance(response_data, dict):
                        missing_fields = [field for field in expected_fields if field not in response_data]
                        result["missing_fields"] = missing_fields
                        result["fields_complete"] = len(missing_fields) == 0
                    
                    # Algumas estatísticas úteis
                    if isinstance(response_data, dict):
                        if "total" in response_data:
                            result["total_items"] = response_data["total"]
                        if "enabled" in response_data:
                            result["service_enabled"] = response_data["enabled"]
                    
                except json.JSONDecodeError:
                    result["json_valid"] = False
                    result["response_text"] = response.text[:100]
            else:
                result["error"] = response.text[:200]
            
            return result
            
        except Exception as e:
            return {
                "endpoint": endpoint,
                "method": method,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def run_complete_test(self) -> Dict[str, Any]:
        """Executar teste completo de todos os endpoints"""
        print("🚀 Iniciando teste completo dos endpoints Admin API...")
        print(f"🔗 Base URL: {self.admin_api}")
        print()
        
        # Lista de todos os endpoints para testar
        endpoints_to_test = [
            # Básicos
            {"endpoint": "/health", "expected_fields": ["status", "timestamp"]},
            {"endpoint": "/services/status", "expected_fields": ["services", "summary"]},
            {"endpoint": "/services", "expected_fields": []},
            {"endpoint": "/collections", "expected_fields": ["collections"]},
            {"endpoint": "/connectors", "expected_fields": []},
            
            # Ingestão
            {"endpoint": "/ingest/jobs", "expected_fields": ["jobs", "total", "summary"]},
            {"endpoint": "/ingest/schedule", "expected_fields": ["schedule", "total_days"]},
            
            # Performance
            {"endpoint": "/performance/metrics", "expected_fields": ["performance_summary"]},
            {"endpoint": "/performance/connectors", "expected_fields": ["connectors", "total_connectors"]},
            {"endpoint": "/performance/dashboard", "expected_fields": ["connectors", "summary"]},
            
            # Relatórios
            {"endpoint": "/reports", "expected_fields": ["reports", "total"]},
            
            # Storage
            {"endpoint": "/storage/buckets", "expected_fields": ["buckets", "total"]},
            
            # Base de dados
            {"endpoint": "/database/tables/public", "expected_fields": ["tables", "total"]},
            
            # API Gateway
            {"endpoint": "/gateway/metrics", "expected_fields": ["enabled", "requests_per_minute"]},
            {"endpoint": "/gateway/rate-limits", "expected_fields": ["enabled", "global_limit"]},
            {"endpoint": "/gateway/backends/health", "expected_fields": ["enabled", "backends"]},
            
            # Alertas
            {"endpoint": "/alerts/dashboard", "expected_fields": ["enabled", "active_alerts"]},
            {"endpoint": "/alerts/rules", "expected_fields": ["enabled", "rules"]},
            
            # Backup
            {"endpoint": "/backup/dashboard", "expected_fields": ["enabled", "last_backup"]},
            
            # Autenticação
            {"endpoint": "/auth/dashboard", "expected_fields": ["enabled", "active_sessions"]},
            
            # ML
            {"endpoint": "/models", "expected_fields": ["models", "total"]},
            {"endpoint": "/ml/dashboard", "expected_fields": ["enabled", "models_active"]},
            
            # Async
            {"endpoint": "/async/tasks", "expected_fields": ["active_tasks", "total"]},
            
            # Cache
            {"endpoint": "/cache/stats", "expected_fields": ["enabled", "hit_rate"]},
            
            # Processamento
            {"endpoint": "/processing/pipelines", "expected_fields": []}
        ]
        
        # Executar testes
        successful_tests = 0
        failed_tests = 0
        
        for test_config in endpoints_to_test:
            endpoint = test_config["endpoint"]
            expected_fields = test_config.get("expected_fields", [])
            
            print(f"🔍 Testando: {endpoint}")
            result = self.test_endpoint(endpoint, expected_fields=expected_fields)
            
            if result["success"]:
                status_emoji = "✅"
                successful_tests += 1
                
                # Verificar campos esperados
                if expected_fields and result.get("fields_complete"):
                    print(f"  {status_emoji} {endpoint} - {result['response_time_ms']}ms - Todos os campos presentes")
                elif expected_fields and not result.get("fields_complete", True):
                    print(f"  ⚠️ {endpoint} - {result['response_time_ms']}ms - Campos em falta: {result.get('missing_fields', [])}")
                else:
                    print(f"  {status_emoji} {endpoint} - {result['response_time_ms']}ms")
                    
            else:
                status_emoji = "❌"
                failed_tests += 1
                error_msg = result.get("error", "Unknown error")[:50]
                print(f"  {status_emoji} {endpoint} - ERRO: {error_msg}")
            
            self.results.append(result)
        
        # Resumo final
        total_tests = len(endpoints_to_test)
        success_rate = (successful_tests / total_tests) * 100
        
        print()
        print("📊 RESUMO DO TESTE:")
        print(f"  Total de endpoints testados: {total_tests}")
        print(f"  ✅ Sucessos: {successful_tests}")
        print(f"  ❌ Falhas: {failed_tests}")
        print(f"  📈 Taxa de sucesso: {success_rate:.1f}%")
        
        # Tempo médio de resposta
        response_times = [r["response_time_ms"] for r in self.results if r.get("response_time_ms")]
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            print(f"  ⏱️ Tempo médio de resposta: {avg_time:.1f}ms")
        
        return {
            "summary": {
                "total_tests": total_tests,
                "successful": successful_tests,
                "failed": failed_tests,
                "success_rate": success_rate,
                "avg_response_time": avg_time if response_times else 0
            },
            "results": self.results,
            "timestamp": datetime.now().isoformat()
        }
    
    def export_results(self, filename: str = None) -> str:
        """Exportar resultados para arquivo JSON"""
        if not filename:
            filename = f"admin_api_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        test_summary = self.run_complete_test()
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(test_summary, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Resultados exportados para: {filename}")
        return filename


if __name__ == "__main__":
    # Executar teste completo
    tester = AdminAPITester()
    
    print("🔧 BGAPP Admin API - Teste Completo de Endpoints")
    print("=" * 60)
    print()
    
    # Verificar se API está rodando
    try:
        health_response = requests.get(f"{tester.base_url}/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ API administrativa está rodando")
        else:
            print(f"⚠️ API respondeu com status: {health_response.status_code}")
    except Exception as e:
        print(f"❌ API não está acessível: {e}")
        exit(1)
    
    print()
    
    # Executar teste completo
    results = tester.run_complete_test()
    
    # Exportar resultados
    tester.export_results()
    
    print()
    print("🎯 TESTE CONCLUÍDO!")
    
    if results["summary"]["success_rate"] >= 95:
        print("🏆 EXCELENTE: Todos os endpoints funcionando perfeitamente!")
    elif results["summary"]["success_rate"] >= 80:
        print("✅ BOM: A maioria dos endpoints está funcionando")
    else:
        print("⚠️ ATENÇÃO: Vários endpoints precisam de correção")
