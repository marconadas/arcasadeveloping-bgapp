#!/usr/bin/env python3
"""
Script para disponibilizar a aplicação BGAPP via ngrok
Serve o index.html e toda a aplicação web via túnel público
"""

import os
import sys
import time
import subprocess
import signal
import webbrowser
from pathlib import Path
import json
import requests

class BGAPPNgrokServer:
    def __init__(self, port=8080):
        self.port = port
        self.server_process = None
        self.ngrok_process = None
        self.project_root = Path(__file__).parent
        self.frontend_dir = self.project_root / "infra" / "frontend"
        
    def check_dependencies(self):
        """Verificar se as dependências estão instaladas"""
        print("🔍 Verificando dependências...")
        
        # Verificar se o diretório frontend existe
        if not self.frontend_dir.exists():
            print(f"❌ Diretório frontend não encontrado: {self.frontend_dir}")
            return False
            
        # Verificar se index.html existe
        index_html = self.frontend_dir / "index.html"
        if not index_html.exists():
            print(f"❌ Arquivo index.html não encontrado: {index_html}")
            return False
            
        # Verificar se ngrok está instalado
        try:
            subprocess.run(["ngrok", "version"], capture_output=True, check=True)
            print("✅ ngrok está instalado")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ ngrok não está instalado")
            print("💡 Instale o ngrok:")
            print("   - macOS: brew install ngrok/ngrok/ngrok")
            print("   - Windows/Linux: https://ngrok.com/download")
            return False
            
        print("✅ Todas as dependências estão OK")
        return True
        
    def start_web_server(self):
        """Iniciar servidor web para servir a aplicação"""
        print(f"🌐 Iniciando servidor web na porta {self.port}...")
        print(f"📁 Servindo arquivos de: {self.frontend_dir}")
        
        try:
            # Mudar para o diretório frontend
            os.chdir(self.frontend_dir)
            
            # Iniciar servidor HTTP Python
            self.server_process = subprocess.Popen([
                sys.executable, "-m", "http.server", str(self.port)
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Aguardar servidor iniciar
            time.sleep(2)
            
            # Verificar se o servidor está funcionando
            try:
                response = requests.get(f"http://localhost:{self.port}", timeout=5)
                if response.status_code == 200:
                    print(f"✅ Servidor web iniciado com sucesso")
                    print(f"🔗 Acesso local: http://localhost:{self.port}")
                    return True
                else:
                    print(f"❌ Servidor retornou status {response.status_code}")
                    return False
            except requests.RequestException as e:
                print(f"❌ Erro ao verificar servidor: {e}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao iniciar servidor web: {e}")
            return False
            
    def start_ngrok(self):
        """Iniciar túnel ngrok"""
        print(f"🚀 Iniciando túnel ngrok...")
        
        try:
            # Iniciar ngrok
            self.ngrok_process = subprocess.Popen([
                "ngrok", "http", str(self.port),
                "--log=stdout"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Aguardar ngrok inicializar
            time.sleep(5)
            
            # Obter URL público
            public_url = self.get_ngrok_url()
            if public_url:
                print(f"✅ Túnel ngrok ativo!")
                print(f"🌍 URL pública: {public_url}")
                print(f"📱 Acesso à aplicação BGAPP: {public_url}")
                return public_url
            else:
                print("❌ Não foi possível obter a URL do ngrok")
                return None
                
        except Exception as e:
            print(f"❌ Erro ao iniciar ngrok: {e}")
            return None
            
    def get_ngrok_url(self):
        """Obter URL público do ngrok"""
        try:
            response = requests.get("http://localhost:4040/api/tunnels", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('tunnels'):
                    return data['tunnels'][0]['public_url']
            return None
        except Exception:
            return None
            
    def show_instructions(self, public_url):
        """Mostrar instruções para o usuário"""
        print("\n" + "="*60)
        print("🎉 BGAPP DISPONÍVEL REMOTAMENTE!")
        print("="*60)
        print(f"🔗 URL para partilhar: {public_url}")
        print(f"📱 Acesso direto à app: {public_url}")
        print(f"🔧 Dashboard ngrok: http://localhost:4040")
        print(f"💻 Acesso local: http://localhost:{self.port}")
        print("")
        print("📋 Funcionalidades disponíveis:")
        print("   ✅ Mapa meteorológico interativo")
        print("   ✅ Dados oceanográficos (SST, Salinidade, Clorofila)")
        print("   ✅ Campos vetoriais (Correntes, Vento)")
        print("   ✅ Controles de animação temporal")
        print("   ✅ Painel administrativo (⚙️ no canto superior direito)")
        print("")
        print("🔐 Acesso administrativo:")
        print("   - Clicar no ⚙️ no painel")
        print("   - Utilizador: admin")
        print("   - Password: Kianda")
        print("")
        print("🛑 Para parar: Ctrl+C neste terminal")
        print("="*60)
        
    def stop_services(self):
        """Parar todos os serviços"""
        print("\n🛑 Parando serviços...")
        
        if self.server_process:
            self.server_process.terminate()
            try:
                self.server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.server_process.kill()
            print("✅ Servidor web parado")
            
        if self.ngrok_process:
            self.ngrok_process.terminate()
            try:
                self.ngrok_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.ngrok_process.kill()
            print("✅ Túnel ngrok parado")
            
        # Limpar processos órfãos
        try:
            subprocess.run(["pkill", "-f", "python.*http.server"], capture_output=True)
            subprocess.run(["pkill", "-f", "ngrok"], capture_output=True)
        except:
            pass
            
        print("✅ Todos os serviços parados")
        
    def run(self):
        """Executar o servidor BGAPP com ngrok"""
        print("🚀 BGAPP - Iniciando aplicação com acesso remoto via ngrok")
        print("="*60)
        
        try:
            # Verificar dependências
            if not self.check_dependencies():
                return False
                
            # Iniciar servidor web
            if not self.start_web_server():
                return False
                
            # Iniciar ngrok
            public_url = self.start_ngrok()
            if not public_url:
                return False
                
            # Mostrar instruções
            self.show_instructions(public_url)
            
            # Abrir navegador local (opcional)
            try:
                webbrowser.open(f"http://localhost:{self.port}")
            except:
                pass
                
            # Manter serviços rodando
            print("\n👀 Monitorando serviços... (Ctrl+C para parar)")
            
            while True:
                time.sleep(1)
                
                # Verificar se processos ainda estão rodando
                if self.server_process and self.server_process.poll() is not None:
                    print("⚠️ Servidor web parou inesperadamente")
                    break
                    
                if self.ngrok_process and self.ngrok_process.poll() is not None:
                    print("⚠️ Túnel ngrok parou inesperadamente")
                    break
                    
        except KeyboardInterrupt:
            print("\n🛑 Interrompido pelo utilizador")
            
        except Exception as e:
            print(f"\n❌ Erro inesperado: {e}")
            
        finally:
            self.stop_services()
            return True

def signal_handler(sig, frame):
    """Manipulador de sinal para Ctrl+C"""
    print("\n🛑 Recebido sinal de interrupção...")
    sys.exit(0)

def main():
    """Função principal"""
    # Configurar manipulador de sinal
    signal.signal(signal.SIGINT, signal_handler)
    
    # Criar e executar servidor
    server = BGAPPNgrokServer(port=8080)
    success = server.run()
    
    if success:
        print("✅ BGAPP executado com sucesso")
    else:
        print("❌ Erro ao executar BGAPP")
        sys.exit(1)

if __name__ == "__main__":
    main()
