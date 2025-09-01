#!/usr/bin/env python3
"""
Teste rápido para verificar se o acesso remoto está funcionando
"""

import requests
import subprocess
import time
from pathlib import Path

def test_local_access():
    """Testa acesso local"""
    print("🔍 Testando acesso local...")
    
    try:
        response = requests.get("http://localhost:8085/admin.html", timeout=5)
        if response.status_code == 200:
            print("✅ Painel administrativo acessível localmente")
            return True
        else:
            print(f"⚠️  Resposta HTTP: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao aceder localmente: {e}")
        return False

def check_ngrok_status():
    """Verifica se ngrok está a correr"""
    print("🔍 Verificando túnel ngrok...")
    
    try:
        response = requests.get("http://localhost:4040/api/tunnels", timeout=5)
        if response.status_code == 200:
            data = response.json()
            tunnels = data.get("tunnels", [])
            
            if tunnels:
                tunnel = tunnels[0]
                public_url = tunnel["public_url"]
                print(f"✅ Túnel ngrok ativo: {public_url}")
                return public_url
            else:
                print("⚠️  ngrok a correr mas sem túneis ativos")
                return None
        else:
            print("❌ ngrok não está a responder")
            return None
    except requests.exceptions.RequestException:
        print("❌ ngrok não está a correr")
        return None

def test_remote_access(public_url):
    """Testa acesso remoto via ngrok"""
    if not public_url:
        return False
    
    print(f"🌐 Testando acesso remoto via {public_url}...")
    
    try:
        # Testar sem autenticação (deve falhar)
        response = requests.get(f"{public_url}/admin.html", timeout=10)
        if response.status_code == 401:
            print("✅ Autenticação a funcionar (401 Unauthorized)")
            
            # Testar com autenticação
            auth_response = requests.get(
                f"{public_url}/admin.html", 
                auth=("admin", "bgapp123"), 
                timeout=10
            )
            if auth_response.status_code == 200:
                print("✅ Acesso remoto com autenticação funcional")
                return True
            else:
                print(f"⚠️  Resposta com auth: {auth_response.status_code}")
                return False
        else:
            print(f"⚠️  Resposta sem auth: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro no acesso remoto: {e}")
        return False

def main():
    """Teste completo"""
    print("🧪 BGAPP - Teste de Acesso Remoto")
    print("=" * 40)
    
    if not Path("infra/docker-compose.yml").exists():
        print("❌ Execute a partir do diretório raiz do projeto")
        return
    
    # 1. Testar acesso local
    if not test_local_access():
        print("\n❌ FALHA: Painel não está acessível localmente")
        print("💡 Solução: Executar 'python scripts/start_admin.py'")
        return
    
    # 2. Verificar ngrok
    public_url = check_ngrok_status()
    
    if not public_url:
        print("\n⚠️  ngrok não está ativo")
        print("💡 Para ativar acesso remoto:")
        print("   python scripts/setup_ngrok_tunnel.py")
        return
    
    # 3. Testar acesso remoto
    if test_remote_access(public_url):
        print("\n🎉 SUCESSO! Acesso remoto funcional")
        print("=" * 40)
        print(f"🔗 URL para partilhar: {public_url}/admin.html")
        print("🔑 Credenciais: admin / bgapp123")
        print("")
        print("📱 Instruções para o teu pai:")
        print("1. Abrir o URL")
        print("2. Inserir credenciais quando pedido")
        print("3. Aceder ao painel administrativo")
        print("")
        print("🔒 Segurança ativa:")
        print("   ✅ Túnel encriptado")
        print("   ✅ Autenticação HTTP Basic")
        print("   ✅ URL temporário (não público permanente)")
    else:
        print("\n❌ FALHA: Acesso remoto não funcional")
        print("💡 Verifica configuração do ngrok")

if __name__ == "__main__":
    main()
