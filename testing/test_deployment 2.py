#!/usr/bin/env python3
"""
Script de Teste do Deployment BGAPP
Testa se o deployment está funcionando corretamente
"""

import requests
import time
from pathlib import Path
from datetime import datetime

class DeploymentTester:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.test_results = []
        
    def log(self, message, level="INFO"):
        """Log com timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        prefix = {
            "INFO": "ℹ️",
            "SUCCESS": "✅",
            "WARNING": "⚠️",
            "ERROR": "❌"
        }.get(level, "ℹ️")
        print(f"{prefix} [{timestamp}] {message}")
    
    def test_main_page(self):
        """Testar se a página principal carrega"""
        self.log("Testando página principal (index.html)...")
        
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            
            if response.status_code == 200:
                content = response.text
                
                # Verificações específicas
                checks = [
                    ("Título correto", "BGAPP - Mapa Meteorológico Interativo" in content),
                    ("Meta viewport", 'name="viewport"' in content),
                    ("Leaflet CSS", "leaflet@1.9.4/dist/leaflet.css" in content),
                    ("Mapa container", 'id="map"' in content),
                    ("Toolbar", 'id="toolbar"' in content),
                    ("Scripts carregados", "zee_angola_official.js" in content),
                    ("PWA manifest", "manifest.json" in content),
                    ("Service Worker", "sw.js" in content)
                ]
                
                passed_checks = sum(1 for _, check in checks if check)
                
                self.log(f"Página principal: {response.status_code} - {len(content)} bytes")
                self.log(f"Verificações: {passed_checks}/{len(checks)} aprovadas")
                
                for check_name, passed in checks:
                    status = "✅" if passed else "❌"
                    self.log(f"  {status} {check_name}", "SUCCESS" if passed else "WARNING")
                
                self.test_results.append({
                    "test": "main_page",
                    "success": response.status_code == 200 and passed_checks >= len(checks) * 0.8,
                    "details": f"{passed_checks}/{len(checks)} checks passed"
                })
                
                return response.status_code == 200 and passed_checks >= len(checks) * 0.8
                
            else:
                self.log(f"Página principal falhou: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Erro ao testar página principal: {str(e)}", "ERROR")
            return False
    
    def test_static_assets(self):
        """Testar se os assets estáticos carregam"""
        self.log("Testando assets estáticos...")
        
        assets_to_test = [
            "/assets/css/map-styles.css",
            "/assets/js/eox-layers.js",
            "/assets/js/zee_angola_official.js",
            "/manifest.json",
            "/favicon.ico",
            "/apple-touch-icon.png"
        ]
        
        successful_assets = 0
        
        for asset in assets_to_test:
            try:
                response = requests.get(f"{self.base_url}{asset}", timeout=5)
                
                if response.status_code == 200:
                    self.log(f"  ✅ {asset} - {len(response.content)} bytes")
                    successful_assets += 1
                else:
                    self.log(f"  ❌ {asset} - {response.status_code}")
                    
            except Exception as e:
                self.log(f"  ❌ {asset} - ERROR: {str(e)}")
        
        success_rate = successful_assets / len(assets_to_test)
        self.log(f"Assets: {successful_assets}/{len(assets_to_test)} carregaram ({success_rate*100:.1f}%)")
        
        self.test_results.append({
            "test": "static_assets",
            "success": success_rate >= 0.8,
            "details": f"{successful_assets}/{len(assets_to_test)} assets loaded"
        })
        
        return success_rate >= 0.8
    
    def test_pwa_features(self):
        """Testar funcionalidades PWA"""
        self.log("Testando funcionalidades PWA...")
        
        pwa_tests = []
        
        # Testar manifest.json
        try:
            response = requests.get(f"{self.base_url}/manifest.json", timeout=5)
            if response.status_code == 200:
                manifest = response.json()
                has_required_fields = all(field in manifest for field in ['name', 'icons', 'start_url'])
                pwa_tests.append(("Manifest válido", has_required_fields))
                if has_required_fields:
                    self.log(f"  ✅ Manifest: {manifest.get('name', 'N/A')}")
            else:
                pwa_tests.append(("Manifest válido", False))
        except:
            pwa_tests.append(("Manifest válido", False))
        
        # Testar Service Worker
        try:
            response = requests.get(f"{self.base_url}/sw.js", timeout=5)
            pwa_tests.append(("Service Worker", response.status_code == 200))
            if response.status_code == 200:
                self.log(f"  ✅ Service Worker - {len(response.content)} bytes")
        except:
            pwa_tests.append(("Service Worker", False))
        
        # Testar ícones
        icon_tests = [
            "/favicon.ico",
            "/apple-touch-icon.png",
            "/assets/img/icon-192.png"
        ]
        
        successful_icons = 0
        for icon in icon_tests:
            try:
                response = requests.get(f"{self.base_url}{icon}", timeout=5)
                if response.status_code == 200:
                    successful_icons += 1
            except:
                pass
        
        pwa_tests.append(("Ícones disponíveis", successful_icons >= 2))
        
        passed_pwa = sum(1 for _, passed in pwa_tests if passed)
        
        for test_name, passed in pwa_tests:
            status = "✅" if passed else "❌"
            self.log(f"  {status} {test_name}")
        
        self.test_results.append({
            "test": "pwa_features",
            "success": passed_pwa >= len(pwa_tests) * 0.7,
            "details": f"{passed_pwa}/{len(pwa_tests)} PWA features working"
        })
        
        return passed_pwa >= len(pwa_tests) * 0.7
    
    def test_security_headers(self):
        """Testar headers de segurança"""
        self.log("Testando headers de segurança...")
        
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            headers = response.headers
            
            security_checks = [
                ("Content-Type", "text/html" in headers.get('Content-Type', '')),
                ("Server info hidden", 'Server' not in headers or 'nginx' not in headers.get('Server', '').lower()),
                ("No cache for HTML", 'no-cache' in headers.get('Cache-Control', '') or 'max-age=0' in headers.get('Cache-Control', '')),
            ]
            
            passed_security = sum(1 for _, passed in security_checks if passed)
            
            for check_name, passed in security_checks:
                status = "✅" if passed else "⚠️"
                self.log(f"  {status} {check_name}")
            
            self.test_results.append({
                "test": "security_headers",
                "success": passed_security >= len(security_checks) * 0.5,
                "details": f"{passed_security}/{len(security_checks)} security checks passed"
            })
            
            return passed_security >= len(security_checks) * 0.5
            
        except Exception as e:
            self.log(f"Erro ao testar headers: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Executar todos os testes"""
        self.log("🧪 Iniciando testes do deployment", "INFO")
        self.log(f"🌐 URL de teste: {self.base_url}")
        print()
        
        # Aguardar um pouco para o servidor estar pronto
        time.sleep(2)
        
        tests = [
            ("Página Principal", self.test_main_page),
            ("Assets Estáticos", self.test_static_assets),
            ("Funcionalidades PWA", self.test_pwa_features),
            ("Headers de Segurança", self.test_security_headers)
        ]
        
        successful_tests = 0
        
        for test_name, test_func in tests:
            self.log(f"🔍 {test_name}...")
            try:
                success = test_func()
                if success:
                    successful_tests += 1
                    self.log(f"✅ {test_name} - PASSOU", "SUCCESS")
                else:
                    self.log(f"❌ {test_name} - FALHOU", "ERROR")
            except Exception as e:
                self.log(f"❌ {test_name} - ERRO: {str(e)}", "ERROR")
            print()
        
        # Relatório final
        self.generate_final_report(successful_tests, len(tests))
    
    def generate_final_report(self, successful_tests, total_tests):
        """Gerar relatório final"""
        print("=" * 60)
        self.log("📊 RELATÓRIO FINAL DO TESTE", "INFO")
        print("=" * 60)
        
        success_rate = successful_tests / total_tests * 100
        
        self.log(f"Testes aprovados: {successful_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if success_rate >= 90:
            self.log("🎉 EXCELENTE: Deployment totalmente funcional!", "SUCCESS")
            recommendation = "DEPLOY RECOMENDADO"
        elif success_rate >= 75:
            self.log("✅ BOM: Deployment funcional com pequenos problemas", "SUCCESS")
            recommendation = "DEPLOY APROVADO"
        elif success_rate >= 50:
            self.log("⚠️ ACEITÁVEL: Deployment funcional mas com problemas", "WARNING")
            recommendation = "DEPLOY COM MONITORAMENTO"
        else:
            self.log("❌ PROBLEMÁTICO: Muitos testes falharam", "ERROR")
            recommendation = "DEPLOY NÃO RECOMENDADO"
        
        print()
        self.log(f"🚀 RECOMENDAÇÃO: {recommendation}")
        
        if successful_tests < total_tests:
            self.log("💡 PRÓXIMOS PASSOS:")
            self.log("  1. Revisar logs de erro acima")
            self.log("  2. Corrigir problemas identificados")
            self.log("  3. Re-executar testes")
        
        print()
        self.log("🌐 Para deploy em arcasadeveloping.org:")
        self.log("  1. Execute: cd deploy_arcasadeveloping")
        self.log("  2. Configure credenciais no upload_to_server.sh")
        self.log("  3. Execute: ./upload_to_server.sh")
        self.log("  4. Acesse: https://arcasadeveloping.org")

def main():
    """Função principal"""
    tester = DeploymentTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
