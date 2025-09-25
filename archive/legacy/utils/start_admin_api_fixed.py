#!/usr/bin/env python3
"""
Inicializador do Admin API com verificação de porta e correções automáticas
"""

import subprocess
import sys
import time
import requests
import os
from pathlib import Path

def check_port_available(port):
    """Verificar se porta está disponível"""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0

def check_api_running(port):
    """Verificar se API está respondendo"""
    try:
        response = requests.get(f'http://localhost:{port}/admin-api/health', timeout=2)
        return response.status_code == 200
    except:
        return False

def kill_process_on_port(port):
    """Matar processo na porta"""
    try:
        result = subprocess.run(['lsof', '-ti', f':{port}'], capture_output=True, text=True)
        if result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                subprocess.run(['kill', '-9', pid])
                print(f"🔪 Processo {pid} morto na porta {port}")
        return True
    except Exception as e:
        print(f"⚠️ Erro ao matar processo: {e}")
        return False

def start_admin_api():
    """Iniciar admin API com verificações"""
    print("🚀 BGAPP Admin API Starter")
    print("=" * 50)
    
    # Verificar se arquivo existe
    api_file = Path('admin_api_simple.py')
    if not api_file.exists():
        print("❌ admin_api_simple.py não encontrado!")
        print("📁 Arquivos disponíveis:")
        for f in Path('.').glob('*.py'):
            print(f"   - {f.name}")
        return False
    
    # Verificar porta 8000
    print("🔍 Verificando porta 8000...")
    if not check_port_available(8000):
        print("⚠️ Porta 8000 ocupada, liberando...")
        kill_process_on_port(8000)
        time.sleep(2)
    
    # Verificar se já está rodando
    if check_api_running(8000):
        print("✅ Admin API já está rodando!")
        return True
    
    # Iniciar API
    print("🚀 Iniciando admin_api_simple.py...")
    try:
        process = subprocess.Popen([
            sys.executable, 'admin_api_simple.py'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Aguardar inicialização
        print("⏳ Aguardando inicialização...")
        for i in range(10):
            time.sleep(1)
            if check_api_running(8000):
                print("✅ Admin API iniciada com sucesso!")
                print("🌐 Disponível em: http://localhost:8000")
                print("📋 Endpoints:")
                print("   - http://localhost:8000/admin-api/health")
                print("   - http://localhost:8000/admin-api/collections")
                print("   - http://localhost:8000/admin-api/services/status")
                print("   - http://localhost:8000/admin-api/connectors")
                print("   - http://localhost:8000/docs (Swagger)")
                return True
            print(f"   Tentativa {i+1}/10...")
        
        print("❌ API não respondeu após 10 segundos")
        return False
        
    except Exception as e:
        print(f"❌ Erro ao iniciar API: {e}")
        return False

def test_endpoints():
    """Testar endpoints da API"""
    print("\n🔧 TESTANDO ENDPOINTS...")
    
    endpoints = [
        '/admin-api/health',
        '/admin-api/collections', 
        '/admin-api/services/status',
        '/admin-api/connectors'
    ]
    
    all_ok = True
    for endpoint in endpoints:
        try:
            response = requests.get(f'http://localhost:8000{endpoint}', timeout=5)
            status = "✅" if response.status_code == 200 else "❌"
            print(f"{status} {endpoint}: HTTP {response.status_code}")
            if response.status_code != 200:
                all_ok = False
        except Exception as e:
            print(f"❌ {endpoint}: {str(e)}")
            all_ok = False
    
    return all_ok

def main():
    """Função principal"""
    if start_admin_api():
        if test_endpoints():
            print("\n🎉 TUDO FUNCIONANDO!")
            print("💡 Agora recarregue a página do frontend")
            print("🌐 Frontend: http://localhost:8085")
            
            # Manter processo rodando
            try:
                print("\n⏳ Mantendo API rodando... (Ctrl+C para parar)")
                while True:
                    time.sleep(10)
                    if not check_api_running(8000):
                        print("⚠️ API parou de responder!")
                        break
            except KeyboardInterrupt:
                print("\n👋 Parando...")
                kill_process_on_port(8000)
        else:
            print("\n❌ Alguns endpoints não estão funcionando")
    else:
        print("\n❌ Falha ao iniciar Admin API")

if __name__ == "__main__":
    main()
