#!/usr/bin/env python3
"""
Script para configurar túnel ngrok para acesso remoto simples e seguro
Alternativa mais fácil ao Cloudflare Tunnel
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

def check_ngrok_installed():
    """Verifica se o ngrok está instalado"""
    try:
        result = subprocess.run(["ngrok", "version"], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ ngrok encontrado: {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass
    
    print("❌ ngrok não encontrado")
    return False

def install_ngrok_instructions():
    """Mostra instruções para instalar ngrok"""
    print("\n📦 Como instalar ngrok:")
    print("=" * 30)
    print("🍎 macOS:")
    print("   brew install ngrok/ngrok/ngrok")
    print("")
    print("🐧 Linux:")
    print("   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null")
    print("   echo 'deb https://ngrok-agent.s3.amazonaws.com buster main' | sudo tee /etc/apt/sources.list.d/ngrok.list")
    print("   sudo apt update && sudo apt install ngrok")
    print("")
    print("🪟 Windows:")
    print("   Baixar de: https://ngrok.com/download")
    print("")
    print("🔑 Depois de instalar:")
    print("1. Criar conta em https://ngrok.com")
    print("2. Obter authtoken em https://dashboard.ngrok.com/get-started/your-authtoken")
    print("3. Executar: ngrok config add-authtoken SEU_TOKEN")

def setup_ngrok_config():
    """Configura ngrok"""
    print("🔧 Configurando ngrok...")
    
    # Verificar se já tem authtoken
    try:
        result = subprocess.run(["ngrok", "config", "check"], capture_output=True, text=True)
        if "valid" in result.stdout.lower():
            print("✅ ngrok já configurado")
            return True
    except:
        pass
    
    print("⚠️  ngrok não configurado")
    print("1. Vai para: https://dashboard.ngrok.com/get-started/your-authtoken")
    print("2. Copia o teu authtoken")
    print("3. Executa: ngrok config add-authtoken SEU_TOKEN")
    
    authtoken = input("Cola o teu authtoken aqui (ou Enter para pular): ").strip()
    if authtoken:
        try:
            subprocess.run(["ngrok", "config", "add-authtoken", authtoken], check=True)
            print("✅ ngrok configurado com sucesso")
            return True
        except subprocess.CalledProcessError:
            print("❌ Erro ao configurar ngrok")
            return False
    
    return False

def create_ngrok_config():
    """Cria configuração ngrok"""
    config = {
        "version": "2",
        "authtoken_from_env": True,
        "tunnels": {
            "bgapp-admin": {
                "proto": "http",
                "addr": "localhost:8085",
                "auth": "admin:bgapp123",  # HTTP Basic Auth
                "inspect": False,
                "bind_tls": True
            }
        }
    }
    
    config_path = Path.home() / ".ngrok2" / "ngrok.yml"
    config_path.parent.mkdir(exist_ok=True)
    
    with open(config_path, 'w') as f:
        import yaml
        yaml.dump(config, f)
    
    print(f"✅ Configuração ngrok criada em {config_path}")

def start_bgapp_services():
    """Inicia os serviços BGAPP"""
    print("🚀 Iniciando serviços BGAPP...")
    
    try:
        # Parar serviços existentes
        subprocess.run([
            "docker", "compose", "-f", "infra/docker-compose.yml", "down"
        ], check=False)
        
        # Iniciar serviços
        subprocess.run([
            "docker", "compose", "-f", "infra/docker-compose.yml", "up", "-d"
        ], check=True)
        
        print("✅ Serviços BGAPP iniciados")
        
        # Aguardar serviços ficarem prontos
        print("⏳ Aguardando serviços ficarem prontos...")
        time.sleep(15)
        
        # Verificar se o painel está acessível
        import requests
        try:
            response = requests.get("http://localhost:8085/admin.html", timeout=5)
            if response.status_code == 200:
                print("✅ Painel administrativo acessível")
                return True
        except:
            pass
        
        print("⚠️  Painel pode não estar totalmente pronto")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao iniciar serviços: {e}")
        return False

def start_ngrok_tunnel():
    """Inicia túnel ngrok"""
    print("🌐 Iniciando túnel ngrok...")
    
    try:
        # Iniciar ngrok em background
        process = subprocess.Popen([
            "ngrok", "http", "8085", 
            "--auth", "admin:bgapp123",
            "--log", "stdout"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Aguardar túnel ficar pronto
        time.sleep(5)
        
        # Obter URL do túnel
        try:
            result = subprocess.run([
                "curl", "-s", "http://localhost:4040/api/tunnels"
            ], capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0:
                tunnels = json.loads(result.stdout)
                if tunnels.get("tunnels"):
                    public_url = tunnels["tunnels"][0]["public_url"]
                    print(f"✅ Túnel ngrok ativo: {public_url}")
                    print(f"🔗 URL para partilhar: {public_url}/admin.html")
                    return public_url, process
        except:
            pass
        
        print("⚠️  Túnel iniciado mas URL não obtido automaticamente")
        print("   Verifica manualmente em: http://localhost:4040")
        return None, process
        
    except Exception as e:
        print(f"❌ Erro ao iniciar túnel ngrok: {e}")
        return None, None

def main():
    """Função principal"""
    print("🌐 BGAPP - Configuração de Acesso Remoto via ngrok")
    print("=" * 60)
    print("Configuração simples e segura para partilhar com o teu pai")
    print("")
    
    if not Path("infra/docker-compose.yml").exists():
        print("❌ Erro: Execute este script a partir do diretório raiz do projeto")
        sys.exit(1)
    
    # 1. Verificar ngrok
    if not check_ngrok_installed():
        install_ngrok_instructions()
        print("\n❌ Instala o ngrok primeiro e executa novamente")
        sys.exit(1)
    
    # 2. Configurar ngrok
    if not setup_ngrok_config():
        print("⚠️  Continua sem authtoken (funcionalidades limitadas)")
    
    # 3. Iniciar serviços BGAPP
    if not start_bgapp_services():
        print("❌ Falha ao iniciar serviços BGAPP")
        sys.exit(1)
    
    # 4. Iniciar túnel ngrok
    public_url, ngrok_process = start_ngrok_tunnel()
    
    print("\n" + "=" * 60)
    print("🎉 ACESSO REMOTO CONFIGURADO!")
    print("")
    
    if public_url:
        print(f"🔗 URL para partilhar com o teu pai:")
        print(f"   {public_url}/admin.html")
        print("")
        print("🔑 Credenciais:")
        print("   Utilizador: admin")
        print("   Password: bgapp123")
    else:
        print("🔗 Verifica o URL em: http://localhost:4040")
        print("   Depois adiciona /admin.html ao final")
    
    print("")
    print("🔐 Funcionalidades de segurança ativas:")
    print("   ✅ Autenticação HTTP Basic")
    print("   ✅ Túnel encriptado (ngrok)")
    print("   ✅ URL temporário (não público permanente)")
    print("   ✅ Acesso apenas com credenciais")
    print("")
    print("📱 Instruções para o teu pai:")
    print("   1. Abrir o URL partilhado")
    print("   2. Inserir credenciais quando pedido")
    print("   3. Aceder ao painel administrativo")
    print("")
    print("🛑 Para parar:")
    print("   Ctrl+C neste terminal")
    print("   ou: pkill ngrok")
    
    try:
        print("\n⏳ Túnel ativo... (Ctrl+C para parar)")
        if ngrok_process:
            ngrok_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Parando túnel...")
        if ngrok_process:
            ngrok_process.terminate()
        print("✅ Túnel parado")

if __name__ == "__main__":
    main()
