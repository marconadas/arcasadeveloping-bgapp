#!/usr/bin/env python3
"""
Script de Teste do Deployment BGAPP para Subdiretório
Testa se o deployment está funcionando corretamente em /BGAPP
"""

import requests
import time
import json
from pathlib import Path
from datetime import datetime

class SubdirDeploymentTester:
    def __init__(self, base_url="http://localhost:8081", subdirectory="BGAPP"):
        self.base_url = base_url
        self.subdirectory = subdirectory
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
        """Testar se a página principal carrega no subdiretório"""
        self.log("Testando página principal (index.html) no subdiretório...")
        
        try:
            # Testar acesso direto ao arquivo
            response = requests.get(f"{self.base_url}/index.html", timeout=10)
            
            if response.status_code == 200:
                content = response.text
                
                # Verificações específicas para subdiretório
                checks = [
                    ("Título correto", "BGAPP - Mapa Meteorológico Interativo" in content),
                    ("Meta viewport", 'name="viewport"' in content),
                    ("Leaflet CSS", "leaflet@1.9.4/dist/leaflet.css" in content),
                    ("Mapa container", 'id="map"' in content),
                    ("Toolbar", 'id="toolbar"' in content),
                    ("Scripts carregados", "zee_angola_official.js" in content),
                    ("PWA manifest", f"/{self.subdirectory}/manifest.json" in content or "manifest.json" in content),
                    ("Service Worker", "sw.js" in content),
                    ("Base path configurado", f'meta name="base-path"' in content or f"/{self.subdirectory}/" in content)
                ]
                
                passed_checks = sum(1 for _, check in checks if check)
                
                self.log(f"Página principal: {response.status_code} - {len(content)} bytes")
                self.log(f"Verificações: {passed_checks}/{len(checks)} aprovadas")
                
                for check_name, passed in checks:
                    status = "✅" if passed else "❌"
                    self.log(f"  {status} {check_name}", "SUCCESS" if passed else "WARNING")
                
                self.test_results.append({
                    "test": "main_page_subdir",
                    "success": response.status_code == 200 and passed_checks >= len(checks) * 0.7,
                    "details": f"{passed_checks}/{len(checks)} checks passed"
                })
                
                return response.status_code == 200 and passed_checks >= len(checks) * 0.7
                
            else:
                self.log(f"Página principal falhou: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Erro ao testar página principal: {str(e)}", "ERROR")
            return False
    
    def test_subdir_assets(self):
        """Testar se os assets carregam corretamente"""
        self.log("Testando assets no subdiretório...")
        
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
            "test": "subdir_assets",
            "success": success_rate >= 0.8,
            "details": f"{successful_assets}/{len(assets_to_test)} assets loaded"
        })
        
        return success_rate >= 0.8
    
    def test_pwa_subdir_config(self):
        """Testar configuração PWA para subdiretório"""
        self.log("Testando configuração PWA para subdiretório...")
        
        pwa_tests = []
        
        # Testar manifest.json
        try:
            response = requests.get(f"{self.base_url}/manifest.json", timeout=5)
            if response.status_code == 200:
                manifest = response.json()
                
                # Verificar configurações específicas do subdiretório
                start_url = manifest.get('start_url', '')
                scope = manifest.get('scope', '')
                
                has_subdir_config = (
                    f"/{self.subdirectory}/" in start_url or
                    f"/{self.subdirectory}/" in scope or
                    start_url.startswith('/') or scope.startswith('/')
                )
                
                pwa_tests.append(("Manifest com config subdir", has_subdir_config))
                pwa_tests.append(("Manifest válido", all(field in manifest for field in ['name', 'icons'])))
                
                self.log(f"  ℹ️ Start URL: {start_url}")
                self.log(f"  ℹ️ Scope: {scope}")
                
            else:
                pwa_tests.append(("Manifest válido", False))
                pwa_tests.append(("Manifest com config subdir", False))
        except Exception as e:
            self.log(f"  ❌ Erro ao testar manifest: {str(e)}")
            pwa_tests.append(("Manifest válido", False))
            pwa_tests.append(("Manifest com config subdir", False))
        
        # Testar Service Worker
        try:
            response = requests.get(f"{self.base_url}/sw.js", timeout=5)
            sw_content = response.text if response.status_code == 200 else ""
            
            has_subdir_sw = (
                f"/{self.subdirectory}/" in sw_content or
                f"bgapp-{self.subdirectory.lower()}" in sw_content or
                response.status_code == 200
            )
            
            pwa_tests.append(("Service Worker", response.status_code == 200))
            pwa_tests.append(("SW configurado para subdir", has_subdir_sw))
            
            if response.status_code == 200:
                self.log(f"  ✅ Service Worker - {len(response.content)} bytes")
        except:
            pwa_tests.append(("Service Worker", False))
            pwa_tests.append(("SW configurado para subdir", False))
        
        passed_pwa = sum(1 for _, passed in pwa_tests if passed)
        
        for test_name, passed in pwa_tests:
            status = "✅" if passed else "❌"
            self.log(f"  {status} {test_name}")
        
        self.test_results.append({
            "test": "pwa_subdir_config",
            "success": passed_pwa >= len(pwa_tests) * 0.7,
            "details": f"{passed_pwa}/{len(pwa_tests)} PWA subdir features working"
        })
        
        return passed_pwa >= len(pwa_tests) * 0.7
    
    def test_cloudflare_config(self):
        """Testar configurações específicas do Cloudflare"""
        self.log("Testando configurações Cloudflare...")
        
        cf_tests = []
        
        # Testar arquivo _redirects
        try:
            response = requests.get(f"{self.base_url}/_redirects", timeout=5)
            if response.status_code == 200:
                redirects_content = response.text
                has_subdir_redirects = f"/{self.subdirectory}" in redirects_content
                cf_tests.append(("_redirects configurado", has_subdir_redirects))
                self.log(f"  ✅ _redirects - {len(response.content)} bytes")
            else:
                cf_tests.append(("_redirects configurado", False))
        except:
            cf_tests.append(("_redirects configurado", False))
        
        # Testar arquivo _headers
        try:
            response = requests.get(f"{self.base_url}/_headers", timeout=5)
            if response.status_code == 200:
                headers_content = response.text
                has_subdir_headers = f"/{self.subdirectory}" in headers_content
                cf_tests.append(("_headers configurado", has_subdir_headers))
                self.log(f"  ✅ _headers - {len(response.content)} bytes")
            else:
                cf_tests.append(("_headers configurado", False))
        except:
            cf_tests.append(("_headers configurado", False))
        
        # Testar .htaccess
        try:
            response = requests.get(f"{self.base_url}/.htaccess", timeout=5)
            if response.status_code == 200:
                htaccess_content = response.text
                has_subdir_htaccess = f"/{self.subdirectory}" in htaccess_content
                cf_tests.append((".htaccess configurado", has_subdir_htaccess))
                self.log(f"  ✅ .htaccess - {len(response.content)} bytes")
            else:
                cf_tests.append((".htaccess configurado", False))
        except:
            cf_tests.append((".htaccess configurado", False))
        
        passed_cf = sum(1 for _, passed in cf_tests if passed)
        
        for test_name, passed in cf_tests:
            status = "✅" if passed else "❌"
            self.log(f"  {status} {test_name}")
        
        self.test_results.append({
            "test": "cloudflare_config",
            "success": passed_cf >= len(cf_tests) * 0.6,
            "details": f"{passed_cf}/{len(cf_tests)} Cloudflare configs working"
        })
        
        return passed_cf >= len(cf_tests) * 0.6
    
    def run_all_tests(self):
        """Executar todos os testes"""
        self.log("🧪 Iniciando testes do deployment para subdiretório", "INFO")
        self.log(f"🌐 URL de teste: {self.base_url}")
        self.log(f"📁 Subdiretório: /{self.subdirectory}")
        print()
        
        # Aguardar um pouco para o servidor estar pronto
        time.sleep(2)
        
        tests = [
            ("Página Principal (Subdir)", self.test_main_page),
            ("Assets do Subdiretório", self.test_subdir_assets),
            ("PWA Config Subdiretório", self.test_pwa_subdir_config),
            ("Configurações Cloudflare", self.test_cloudflare_config)
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
        print("=" * 70)
        self.log("📊 RELATÓRIO FINAL - DEPLOYMENT SUBDIRETÓRIO", "INFO")
        print("=" * 70)
        
        success_rate = successful_tests / total_tests * 100
        
        self.log(f"Testes aprovados: {successful_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if success_rate >= 90:
            self.log("🎉 EXCELENTE: Deployment para subdiretório totalmente funcional!", "SUCCESS")
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
        
        print()
        self.log("🌐 Para deploy em arcasadeveloping.org/BGAPP:")
        self.log("  1. Execute: cd deploy_arcasadeveloping_BGAPP")
        self.log("  2. Configure credenciais no upload_to_server.sh")
        self.log("  3. Execute: ./upload_to_server.sh")
        self.log("  4. Acesse: https://arcasadeveloping.org/BGAPP")
        
        print()
        self.log("📋 CONFIGURAÇÕES ESPECÍFICAS DO SUBDIRETÓRIO:")
        self.log(f"  • URL completa: https://arcasadeveloping.org/{self.subdirectory}")
        self.log(f"  • Base path: /{self.subdirectory}/")
        self.log(f"  • PWA scope: /{self.subdirectory}/")
        self.log(f"  • Assets path: /{self.subdirectory}/assets/")

def main():
    """Função principal"""
    tester = SubdirDeploymentTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
