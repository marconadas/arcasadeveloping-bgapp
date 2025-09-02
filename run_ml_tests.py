#!/usr/bin/env python3
"""
Script Completo de Teste do Sistema de ML
Inicia a aplicação automaticamente se necessário e executa todos os testes
"""

import os
import sys
import subprocess
import time
import signal
import requests
from pathlib import Path
from test_ml_system import MLSystemTester

class MLTestRunner:
    """Runner completo para testes de ML"""
    
    def __init__(self):
        self.app_process = None
        self.app_started_by_us = False
    
    def check_app_running(self):
        """Verifica se a aplicação já está rodando"""
        urls_to_try = [
            "http://localhost:8000",
            "http://127.0.0.1:8000"
        ]
        
        for url in urls_to_try:
            try:
                response = requests.get(f"{url}/health", timeout=5)
                if response.status_code == 200:
                    print(f"✅ Aplicação já está rodando em: {url}")
                    return True
            except:
                continue
        
        return False
    
    def setup_environment(self):
        """Configura ambiente para testes"""
        env_vars = {
            'PYTHONPATH': str(Path(__file__).parent / 'src'),
            'POSTGRES_HOST': 'localhost',
            'POSTGRES_PORT': '5432',
            'POSTGRES_DB': 'geo',
            'POSTGRES_USER': 'postgres',
            'POSTGRES_PASSWORD': 'postgres',
            'ENABLE_SECURITY': 'false',
            'ENABLE_RATE_LIMITING': 'false',
            'LOG_LEVEL': 'WARNING'  # Reduzir logs para testes
        }
        
        for key, value in env_vars.items():
            os.environ[key] = value
    
    def start_app_for_tests(self):
        """Inicia a aplicação para testes"""
        print("🚀 Iniciando aplicação BGAPP para testes...")
        
        # Verificar se arquivo existe
        if not Path("src/bgapp/admin_api.py").exists():
            print("❌ Erro: src/bgapp/admin_api.py não encontrado")
            print("💡 Execute este script a partir do diretório raiz do BGAPP")
            return False
        
        # Configurar ambiente
        self.setup_environment()
        
        # Comando para iniciar
        cmd = [
            sys.executable, "-m", "uvicorn",
            "src.bgapp.admin_api:app",
            "--host", "127.0.0.1",
            "--port", "8000",
            "--log-level", "warning"  # Reduzir logs
        ]
        
        try:
            print("⏳ Iniciando servidor...")
            
            # Redirecionar output para reduzir ruído
            with open(os.devnull, 'w') as devnull:
                self.app_process = subprocess.Popen(
                    cmd,
                    stdout=devnull,
                    stderr=subprocess.PIPE,
                    cwd=Path(__file__).parent
                )
            
            # Aguardar aplicação iniciar
            print("⏳ Aguardando aplicação ficar pronta...")
            
            for i in range(30):  # Tentar por 30 segundos
                try:
                    response = requests.get("http://localhost:8000/health", timeout=2)
                    if response.status_code == 200:
                        print("✅ Aplicação iniciada com sucesso!")
                        self.app_started_by_us = True
                        return True
                except:
                    time.sleep(1)
                    
                # Verificar se processo ainda está rodando
                if self.app_process.poll() is not None:
                    print("❌ Aplicação parou inesperadamente")
                    stderr_output = self.app_process.stderr.read().decode()
                    if stderr_output:
                        print(f"Erro: {stderr_output}")
                    return False
            
            print("❌ Timeout aguardando aplicação iniciar")
            return False
            
        except Exception as e:
            print(f"❌ Erro iniciando aplicação: {e}")
            return False
    
    def stop_app(self):
        """Para a aplicação se foi iniciada por nós"""
        if self.app_process and self.app_started_by_us:
            print("🛑 Parando aplicação...")
            try:
                self.app_process.terminate()
                self.app_process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.app_process.kill()
                self.app_process.wait()
            print("✅ Aplicação parada")
    
    def run_tests(self):
        """Executa todos os testes"""
        print("🌊 BGAPP - Sistema de Testes de Machine Learning")
        print("=" * 60)
        
        # 1. Verificar se app já está rodando
        if not self.check_app_running():
            print("📡 Aplicação não está rodando. Iniciando automaticamente...")
            
            if not self.start_app_for_tests():
                print("❌ Não foi possível iniciar a aplicação")
                print("\n📋 Soluções alternativas:")
                print("   🐳 Docker: ./start_bgapp_local.sh")
                print("   📦 Docker Compose: cd infra && docker compose up -d")
                return False
        
        print()
        
        # 2. Executar testes
        try:
            tester = MLSystemTester()
            results = tester.run_all_tests()
            
            # Verificar se houve erro
            if isinstance(results, dict) and "error" in results:
                print(f"❌ Erro nos testes: {results['error']}")
                return False
            
            # Calcular sucesso
            if isinstance(results, dict):
                passed = sum(1 for v in results.values() if v is True)
                total = len(results)
                success_rate = (passed / total) * 100 if total > 0 else 0
                
                print("\n" + "=" * 60)
                print(f"📊 RESULTADO FINAL: {passed}/{total} testes passaram ({success_rate:.1f}%)")
                
                if success_rate >= 80:
                    print("🎉 SUCESSO! Sistema de ML funcionando corretamente!")
                    return True
                else:
                    print("⚠️ Alguns testes falharam. Verificar configuração.")
                    return False
            
            return False
            
        except Exception as e:
            print(f"❌ Erro executando testes: {e}")
            return False
        
        finally:
            # 3. Limpar recursos
            self.stop_app()
    
    def signal_handler(self, sig, frame):
        """Handler para Ctrl+C"""
        print("\n🛑 Interrompido pelo usuário")
        self.stop_app()
        sys.exit(0)

def main():
    """Função principal"""
    runner = MLTestRunner()
    
    # Configurar handler para Ctrl+C
    signal.signal(signal.SIGINT, runner.signal_handler)
    
    try:
        success = runner.run_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return 1
    finally:
        runner.stop_app()

if __name__ == "__main__":
    sys.exit(main())
