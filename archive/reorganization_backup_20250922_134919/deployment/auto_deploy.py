#!/usr/bin/env python3
"""
Script de Auto-Deploy para BGAPP Admin
Monitora mudanças nos arquivos e reinicia serviços automaticamente
"""

import os
import sys
import time
import subprocess
import signal
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class AdminReloadHandler(FileSystemEventHandler):
    def __init__(self, admin_port=8080):
        self.admin_port = admin_port
        self.server_process = None
        self.ngrok_process = None
        self.start_services()
    
    def start_services(self):
        """Inicia o servidor admin e ngrok"""
        print("🚀 Iniciando serviços...")
        
        # Para processos existentes
        self.stop_services()
        
        # Inicia servidor HTTP simples para servir arquivos estáticos
        admin_path = Path(__file__).parent / "infra" / "frontend"
        
        print(f"📁 Servindo arquivos de: {admin_path}")
        self.server_process = subprocess.Popen([
            sys.executable, "-m", "http.server", str(self.admin_port)
        ], cwd=admin_path, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Aguarda um pouco para o servidor iniciar
        time.sleep(2)
        
        # Inicia ngrok
        print(f"🌐 Iniciando ngrok na porta {self.admin_port}...")
        self.ngrok_process = subprocess.Popen([
            "ngrok", "http", str(self.admin_port), 
            "--log=stdout"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Aguarda e mostra a URL do ngrok
        time.sleep(3)
        self.show_ngrok_url()
    
    def stop_services(self):
        """Para os serviços em execução"""
        if self.server_process:
            self.server_process.terminate()
            self.server_process = None
        
        if self.ngrok_process:
            self.ngrok_process.terminate()
            self.ngrok_process = None
        
        # Mata processos ngrok órfãos
        try:
            subprocess.run(["pkill", "-f", "ngrok"], check=False)
        except:
            pass
    
    def show_ngrok_url(self):
        """Mostra a URL do ngrok"""
        try:
            # Tenta obter a URL via API do ngrok
            import requests
            import json
            
            time.sleep(2)  # Aguarda ngrok inicializar
            response = requests.get("http://localhost:4040/api/tunnels")
            
            if response.status_code == 200:
                tunnels = response.json()["tunnels"]
                if tunnels:
                    public_url = tunnels[0]["public_url"]
                    print(f"\n✅ BGAPP Admin disponível em: {public_url}")
                    print(f"📱 URL Mobile-Friendly: {public_url}/admin.html")
                    print("=" * 60)
                    return
        except:
            pass
        
        print("\n⚠️  ngrok iniciado, mas URL não detectada automaticamente")
        print("🔍 Verifique manualmente em: http://localhost:4040")
    
    def on_modified(self, event):
        """Callback quando arquivos são modificados"""
        if event.is_directory:
            return
        
        # Só recarrega para arquivos relevantes
        relevant_extensions = ['.html', '.css', '.js', '.py']
        if any(event.src_path.endswith(ext) for ext in relevant_extensions):
            print(f"\n🔄 Arquivo modificado: {event.src_path}")
            print("⏳ Reiniciando serviços...")
            self.start_services()

def main():
    """Função principal"""
    print("🎯 BGAPP Auto-Deploy iniciado")
    print("👀 Monitorando mudanças em arquivos...")
    print("🛑 Pressione Ctrl+C para parar")
    
    # Configuração
    admin_port = 8080
    watch_paths = [
        Path(__file__).parent / "infra" / "frontend",
        Path(__file__).parent / "src" / "bgapp" / "admin_api.py"
    ]
    
    # Handler de eventos
    event_handler = AdminReloadHandler(admin_port)
    
    # Observer para monitorar arquivos
    observer = Observer()
    
    for path in watch_paths:
        if path.exists():
            observer.schedule(event_handler, str(path), recursive=True)
            print(f"📂 Monitorando: {path}")
    
    observer.start()
    
    def signal_handler(sig, frame):
        print("\n🛑 Parando serviços...")
        event_handler.stop_services()
        observer.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    # Verifica dependências
    try:
        import watchdog
        import requests
    except ImportError:
        print("📦 Instalando dependências...")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            "watchdog", "requests"
        ])
        import watchdog
        import requests
    
    main()
