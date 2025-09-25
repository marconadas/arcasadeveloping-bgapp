#!/usr/bin/env python3
"""
Script para testar todos os endpoints da admin API
Verifica se estão respondendo corretamente e identifica problemas
"""

import requests
import json
import time
from datetime import datetime

class AdminEndpointTester:
    def __init__(self):
        self.base_url = "http://localhost:8085/admin-api"
        self.direct_url = "http://localhost:8000"
        self.results = []
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_endpoint(self, path, expected_status=200, method="GET", description=""):
        """Testar um endpoint específico"""
        url = f"{self.base_url}{path}"
        
        try:
            if method == "GET":
                response = requests.get(url, timeout=10)
            elif method == "POST":
                response = requests.post(url, timeout=10)
            
            success = response.status_code == expected_status
            
            result = {
                "path": path,
                "url": url,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "description": description,
                "response_time": response.elapsed.total_seconds(),
                "content_type": response.headers.get("content-type", ""),
                "error": None
            }
            
            if success:
                self.log(f"✅ {path} - {response.status_code} ({response.elapsed.total_seconds():.3f}s)")
                
                # Verificar se é JSON válido
                if "application/json" in response.headers.get("content-type", ""):
                    try:
                        data = response.json()
                        result["json_valid"] = True
                        result["data_keys"] = list(data.keys()) if isinstance(data, dict) else []
                    except:
                        result["json_valid"] = False
                        self.log(f"⚠️  {path} - JSON inválido", "WARNING")
            else:
                self.log(f"❌ {path} - Esperado {expected_status}, recebido {response.status_code}")
                result["error"] = response.text[:200] if response.text else "No response content"
                
        except requests.RequestException as e:
            result = {
                "path": path,
                "url": url,
                "method": method,
                "expected_status": expected_status,
                "actual_status": None,
                "success": False,
                "description": description,
                "response_time": None,
                "error": str(e)
            }
            self.log(f"❌ {path} - Erro de conexão: {e}")
        
        self.results.append(result)
        return result
    
    def run_tests(self):
        """Executar todos os testes"""
        self.log("🧪 Iniciando testes dos endpoints da Admin API...")
        
        # Endpoints principais
        endpoints = [
            ("/health", 200, "GET", "Health check básico"),
            ("/health/detailed", 200, "GET", "Health check detalhado"),
            ("/metrics", 200, "GET", "Métricas do sistema"),
            ("/services/status", 200, "GET", "Status dos serviços"),
            ("/processing/pipelines", 200, "GET", "Pipelines de processamento"),
            ("/connectors", 200, "GET", "Lista de conectores"),
            ("/database/tables/public", 200, "GET", "Tabelas públicas do database"),
            ("/storage/buckets/test", 200, "GET", "Teste de buckets MinIO"),
            ("/monitoring/stats", 200, "GET", "Estatísticas de monitorização"),
            ("/monitoring/alerts", 200, "GET", "Alertas ativos"),
        ]
        
        for path, status, method, desc in endpoints:
            self.test_endpoint(path, status, method, desc)
            time.sleep(0.1)  # Evitar sobrecarga
        
        # Testar endpoints que podem não existir
        optional_endpoints = [
            ("/jobs", 200, "GET", "Jobs do scheduler (opcional)"),
            ("/models", 200, "GET", "Modelos ML (opcional)"),
            ("/reports", 200, "GET", "Relatórios (opcional)"),
        ]
        
        for path, status, method, desc in optional_endpoints:
            result = self.test_endpoint(path, status, method, desc)
            if not result["success"]:
                self.log(f"ℹ️  {path} - Endpoint opcional não disponível")
    
    def test_direct_api(self):
        """Testar API diretamente (sem proxy)"""
        self.log("\n🔗 Testando API diretamente (porta 8000)...")
        
        try:
            response = requests.get(f"{self.direct_url}/health", timeout=5)
            if response.status_code == 200:
                self.log("✅ API direta funcionando")
                return True
            else:
                self.log(f"❌ API direta retornando {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ API direta não acessível: {e}")
            return False
    
    def test_frontend_connectivity(self):
        """Testar conectividade do frontend"""
        self.log("\n🌐 Testando frontend...")
        
        try:
            response = requests.get("http://localhost:8085/admin.html", timeout=5)
            if response.status_code == 200:
                self.log("✅ Frontend acessível")
                return True
            else:
                self.log(f"❌ Frontend retornando {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Frontend não acessível: {e}")
            return False
    
    def generate_report(self):
        """Gerar relatório final"""
        successful = [r for r in self.results if r["success"]]
        failed = [r for r in self.results if not r["success"]]
        
        self.log("\n" + "="*60)
        self.log("📊 RELATÓRIO DE TESTES")
        self.log("="*60)
        
        self.log(f"✅ Sucessos: {len(successful)}/{len(self.results)}")
        self.log(f"❌ Falhas: {len(failed)}/{len(self.results)}")
        
        if failed:
            self.log("\n❌ ENDPOINTS COM PROBLEMAS:")
            for result in failed:
                self.log(f"   • {result['path']} - {result.get('error', 'Status incorreto')}")
        
        if successful:
            self.log("\n✅ ENDPOINTS FUNCIONANDO:")
            for result in successful:
                time_str = f" ({result['response_time']:.3f}s)" if result['response_time'] else ""
                self.log(f"   • {result['path']}{time_str}")
        
        # Performance stats
        response_times = [r['response_time'] for r in successful if r['response_time']]
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            max_time = max(response_times)
            self.log(f"\n⚡ PERFORMANCE:")
            self.log(f"   • Tempo médio: {avg_time:.3f}s")
            self.log(f"   • Tempo máximo: {max_time:.3f}s")
        
        return len(failed) == 0
    
    def save_results(self, filename="admin_endpoints_test.json"):
        """Salvar resultados em JSON"""
        with open(filename, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "total_tests": len(self.results),
                "successful": len([r for r in self.results if r["success"]]),
                "failed": len([r for r in self.results if not r["success"]]),
                "results": self.results
            }, f, indent=2)
        
        self.log(f"💾 Resultados salvos em {filename}")


def main():
    tester = AdminEndpointTester()
    
    # Testar conectividade básica
    frontend_ok = tester.test_frontend_connectivity()
    direct_api_ok = tester.test_direct_api()
    
    if not frontend_ok or not direct_api_ok:
        print("\n❌ Problemas de conectividade básica detectados!")
        print("Execute: python scripts/fix_503_errors.py")
        return 1
    
    # Executar testes dos endpoints
    tester.run_tests()
    
    # Gerar relatório
    all_ok = tester.generate_report()
    
    # Salvar resultados
    tester.save_results()
    
    if all_ok:
        print("\n🎉 Todos os testes passaram! Admin API funcionando corretamente.")
        return 0
    else:
        print("\n⚠️  Alguns endpoints falharam. Verifique os logs acima.")
        return 1


if __name__ == "__main__":
    exit(main())
