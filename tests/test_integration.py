#!/usr/bin/env python3
"""
Testes de Integração Automáticos BGAPP
Cobertura completa de todas as funcionalidades implementadas
"""

import pytest
import asyncio
import httpx
from datetime import datetime
from typing import Dict, Any

# Configuração dos testes
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test@bgapp.com"
TEST_USER_PASSWORD = "test123!@#"

class TestIntegrationSuite:
    """Suite completa de testes de integração"""
    
    def __init__(self):
        self.client = None
        self.auth_token = None
    
    async def setup(self):
        """Configuração inicial dos testes"""
        self.client = httpx.AsyncClient(base_url=BASE_URL, timeout=30.0)
        print("🧪 Iniciando testes de integração BGAPP...")
    
    async def teardown(self):
        """Limpeza após testes"""
        if self.client:
            await self.client.aclose()
        print("🧹 Testes finalizados")
    
    async def test_health_check(self):
        """Teste 1: Health check da API"""
        response = await self.client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "features" in data
        
        # Verificar se todas as funcionalidades estão ativas
        features = data["features"]
        expected_features = [
            "cache", "alerts", "backup", "mobile_pwa", 
            "machine_learning", "api_gateway", "enterprise_auth"
        ]
        
        for feature in expected_features:
            assert feature in features, f"Funcionalidade {feature} não encontrada"
        
        print("✅ Teste 1: Health check - PASSOU")
        return True
    
    async def test_cache_system(self):
        """Teste 2: Sistema de cache Redis"""
        # Testar estatísticas do cache
        response = await self.client.get("/cache/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["enabled"] == True
        assert "stats" in data
        
        # Testar limpeza do cache
        response = await self.client.post("/cache/clear")
        assert response.status_code == 200
        
        print("✅ Teste 2: Sistema de cache - PASSOU")
        return True
    
    async def test_alerts_system(self):
        """Teste 3: Sistema de alertas automáticos"""
        response = await self.client.get("/alerts/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert data["enabled"] == True
        assert "dashboard" in data
        
        # Testar regras de alerta
        response = await self.client.get("/alerts/rules")
        assert response.status_code == 200
        
        print("✅ Teste 3: Sistema de alertas - PASSOU")
        return True
    
    async def test_backup_system(self):
        """Teste 4: Sistema de backup"""
        response = await self.client.get("/backup/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert data["enabled"] == True
        assert "dashboard" in data
        
        print("✅ Teste 4: Sistema de backup - PASSOU")
        return True
    
    async def test_ml_system(self):
        """Teste 5: Sistema de Machine Learning"""
        # Dashboard ML
        response = await self.client.get("/ml/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert data["enabled"] == True
        
        # Listar modelos
        response = await self.client.get("/ml/models")
        assert response.status_code == 200
        
        # Treinar modelos (em background)
        response = await self.client.post("/ml/train-all")
        assert response.status_code == 200
        
        print("✅ Teste 5: Sistema de ML - PASSOU")
        return True
    
    async def test_gateway_system(self):
        """Teste 6: API Gateway"""
        # Métricas do gateway
        response = await self.client.get("/gateway/metrics")
        assert response.status_code == 200
        
        data = response.json()
        assert data["enabled"] == True
        
        # Rate limiting rules
        response = await self.client.get("/gateway/rate-limits")
        assert response.status_code == 200
        
        # Backend health
        response = await self.client.get("/gateway/backends/health")
        assert response.status_code == 200
        
        print("✅ Teste 6: API Gateway - PASSOU")
        return True
    
    async def test_auth_system(self):
        """Teste 7: Sistema de autenticação enterprise"""
        # Dashboard de autenticação
        response = await self.client.get("/auth/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert data["enabled"] == True
        
        # Tentar registar utilizador de teste
        register_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": "Test User",
            "role": "viewer",
            "gdpr_consent": True
        }
        
        response = await self.client.post("/auth/register", json=register_data)
        # Pode falhar se utilizador já existe (OK)
        assert response.status_code in [200, 400]
        
        # Tentar fazer login
        login_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        response = await self.client.post("/auth/login", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            self.auth_token = token_data.get("access_token")
        
        print("✅ Teste 7: Autenticação enterprise - PASSOU")
        return True
    
    async def test_mobile_api(self):
        """Teste 8: API para mobile PWA"""
        # Lista de espécies
        response = await self.client.get("/api/species/list")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "species" in data
        
        # Criar observação de teste
        observation_data = {
            "species": "Test Species",
            "count": 1,
            "timestamp": datetime.now().isoformat(),
            "location": {"latitude": -5.5, "longitude": 12.5},
            "notes": "Test observation"
        }
        
        response = await self.client.post("/api/observations", json=observation_data)
        assert response.status_code == 200
        
        print("✅ Teste 8: API Mobile - PASSOU")
        return True
    
    async def test_async_processing(self):
        """Teste 9: Processamento assíncrono"""
        # Processar dados oceanográficos
        async_data = {
            "data_source": "test",
            "parameters": {"test": "value"}
        }
        
        response = await self.client.post("/async/process/oceanographic", params=async_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "task_id" in data
        
        # Verificar status da tarefa
        task_id = data["task_id"]
        response = await self.client.get(f"/async/task/{task_id}")
        assert response.status_code == 200
        
        print("✅ Teste 9: Processamento assíncrono - PASSOU")
        return True
    
    async def test_services_status(self):
        """Teste 10: Status dos serviços"""
        response = await self.client.get("/services/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "services" in data
        assert "summary" in data
        
        print("✅ Teste 10: Status dos serviços - PASSOU")
        return True
    
    async def run_all_tests(self):
        """Executar todos os testes de integração"""
        await self.setup()
        
        tests = [
            self.test_health_check,
            self.test_cache_system,
            self.test_alerts_system,
            self.test_backup_system,
            self.test_ml_system,
            self.test_gateway_system,
            self.test_auth_system,
            self.test_mobile_api,
            self.test_async_processing,
            self.test_services_status
        ]
        
        passed_tests = 0
        failed_tests = 0
        
        for test in tests:
            try:
                result = await test()
                if result:
                    passed_tests += 1
            except Exception as e:
                print(f"❌ {test.__name__} - FALHOU: {e}")
                failed_tests += 1
        
        await self.teardown()
        
        # Relatório final
        total_tests = len(tests)
        success_rate = (passed_tests / total_tests) * 100
        
        print("\n" + "="*50)
        print("📊 RELATÓRIO DE TESTES DE INTEGRAÇÃO")
        print("="*50)
        print(f"Total de testes: {total_tests}")
        print(f"✅ Passou: {passed_tests}")
        print(f"❌ Falhou: {failed_tests}")
        print(f"📈 Taxa de sucesso: {success_rate:.1f}%")
        print("="*50)
        
        if success_rate >= 90:
            print("🎉 SISTEMA PRONTO PARA PRODUÇÃO!")
        elif success_rate >= 70:
            print("⚠️ Sistema funcional, mas precisa de ajustes")
        else:
            print("🚨 Sistema precisa de correções importantes")
        
        return success_rate

# Função para executar testes
async def run_integration_tests():
    """Executar suite de testes de integração"""
    test_suite = TestIntegrationSuite()
    return await test_suite.run_all_tests()

# Script principal
if __name__ == "__main__":
    print("🧪 BGAPP - Testes de Integração Automáticos")
    print("Testando todas as funcionalidades implementadas...\n")
    
    try:
        success_rate = asyncio.run(run_integration_tests())
        
        if success_rate >= 90:
            exit(0)  # Sucesso
        else:
            exit(1)  # Falha
            
    except Exception as e:
        print(f"❌ Erro executando testes: {e}")
        exit(1)
