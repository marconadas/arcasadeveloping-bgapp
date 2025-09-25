#!/usr/bin/env python3
"""
Script para iniciar demo das animações meteorológicas
Inicia API backend e abre o navegador automaticamente
"""

import subprocess
import time
import webbrowser
import sys
import os
import signal
import threading
from pathlib import Path

def start_api_server():
    """Iniciar servidor da API"""
    print("🚀 Iniciando API backend (porta 5080)...")
    
    # Navegar para o diretório correto
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)
    
    # Iniciar API
    api_process = subprocess.Popen([
        sys.executable, "-m", "src.bgapp.admin_api"
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    return api_process

def start_frontend_server():
    """Iniciar servidor frontend"""
    print("🌐 Iniciando servidor frontend (porta 8085)...")
    
    project_root = Path(__file__).parent.parent
    frontend_dir = project_root / "infra" / "frontend"
    
    if not frontend_dir.exists():
        print(f"❌ Diretório frontend não encontrado: {frontend_dir}")
        return None
    
    os.chdir(frontend_dir)
    
    # Iniciar servidor HTTP
    frontend_process = subprocess.Popen([
        sys.executable, "-m", "http.server", "8085"
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    return frontend_process

def wait_for_server(url, timeout=30):
    """Aguardar servidor estar disponível"""
    import requests
    
    for i in range(timeout):
        try:
            response = requests.get(url, timeout=1)
            if response.status_code == 200:
                return True
        except:
            pass
        time.sleep(1)
        if i % 5 == 0:
            print(f"   Aguardando servidor... ({i}s)")
    
    return False

def test_endpoints():
    """Testar endpoints básicos"""
    import requests
    
    print("\n🧪 Testando endpoints...")
    
    endpoints = [
        ("http://localhost:5080/health", "API Health"),
        ("http://localhost:5080/metocean/status", "Metocean Status"),
        ("http://localhost:8085/index.html", "Frontend")
    ]
    
    for url, name in endpoints:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"   ✅ {name}: OK")
            else:
                print(f"   ⚠️ {name}: HTTP {response.status_code}")
        except Exception as e:
            print(f"   ❌ {name}: {e}")

def show_instructions():
    """Mostrar instruções de uso"""
    print("\n" + "="*60)
    print("🌊 BGAPP - Demo de Animações Meteorológicas")
    print("="*60)
    print()
    print("🎯 Como usar:")
    print("   1. O navegador abrirá automaticamente")
    print("   2. Clique em 'Correntes' para ver streamlines animadas")
    print("   3. Clique em 'Vento' para ver campos vetoriais")
    print("   4. Use 'SST', 'Salinidade', 'Clorofila' para dados escalares")
    print("   5. Use '▶️ Animar' para iniciar animação temporal")
    print()
    print("🔗 URLs:")
    print("   • Mapa: http://localhost:8085/index.html")
    print("   • API Status: http://localhost:5080/metocean/status")
    print("   • API Docs: http://localhost:5080/docs")
    print()
    print("⏹️ Para parar: Pressione Ctrl+C")
    print("="*60)

def signal_handler(sig, frame):
    """Manipular sinal de interrupção"""
    print("\n\n🛑 Parando serviços...")
    sys.exit(0)

def main():
    """Função principal"""
    
    # Configurar manipulador de sinal
    signal.signal(signal.SIGINT, signal_handler)
    
    print("🌊 BGAPP - Iniciando Demo Meteorológico")
    print("-" * 40)
    
    processes = []
    
    try:
        # Iniciar API
        api_process = start_api_server()
        processes.append(api_process)
        
        # Aguardar API estar disponível
        if wait_for_server("http://localhost:5080/health"):
            print("   ✅ API disponível")
        else:
            print("   ❌ API não respondeu a tempo")
            return
        
        # Iniciar frontend
        frontend_process = start_frontend_server()
        processes.append(frontend_process)
        
        # Aguardar frontend estar disponível
        if wait_for_server("http://localhost:8085"):
            print("   ✅ Frontend disponível")
        else:
            print("   ❌ Frontend não respondeu a tempo")
            return
        
        # Testar endpoints
        test_endpoints()
        
        # Mostrar instruções
        show_instructions()
        
        # Abrir navegador
        print("\n🌐 Abrindo navegador...")
        webbrowser.open("http://localhost:8085/index.html")
        
        # Manter serviços rodando
        print("\n⏳ Serviços rodando... (Ctrl+C para parar)")
        
        while True:
            time.sleep(1)
            
            # Verificar se processos ainda estão rodando
            for i, process in enumerate(processes):
                if process.poll() is not None:
                    print(f"⚠️ Processo {i} parou inesperadamente")
    
    except KeyboardInterrupt:
        print("\n🛑 Interrompido pelo usuário")
    
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    
    finally:
        # Parar todos os processos
        print("🧹 Limpando processos...")
        for process in processes:
            try:
                process.terminate()
                process.wait(timeout=5)
            except:
                try:
                    process.kill()
                except:
                    pass
        
        print("✅ Demo finalizado")

if __name__ == "__main__":
    main()
