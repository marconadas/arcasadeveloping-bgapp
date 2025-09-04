#!/usr/bin/env python3
"""
Solução rápida para partilhar BGAPP remotamente
Usa localtunnel como alternativa ao ngrok (sem registo necessário)
"""

import subprocess
import time
import requests
import json

def check_services():
    """Verifica se os serviços BGAPP estão funcionando"""
    print("🔍 Verificando serviços BGAPP...")
    
    try:
        response = requests.get("http://localhost:8085/admin.html", timeout=5)
        if response.status_code == 200:
            print("✅ Painel administrativo funcionando")
            return True
        else:
            print(f"⚠️  Painel responde com código: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro ao verificar painel: {e}")
        return False

def install_localtunnel():
    """Instala localtunnel via npm"""
    print("📦 Instalando localtunnel...")
    try:
        # Verificar se npm está instalado
        subprocess.run(["npm", "--version"], check=True, capture_output=True)
        
        # Instalar localtunnel globalmente
        result = subprocess.run(["npm", "install", "-g", "localtunnel"], 
                               capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ localtunnel instalado com sucesso")
            return True
        else:
            print(f"❌ Erro ao instalar localtunnel: {result.stderr}")
            return False
            
    except subprocess.CalledProcessError:
        print("❌ npm não encontrado. Instala Node.js primeiro:")
        print("   https://nodejs.org/")
        return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def start_localtunnel():
    """Inicia túnel com localtunnel"""
    print("🌐 Iniciando túnel localtunnel...")
    
    try:
        # Iniciar localtunnel
        process = subprocess.Popen([
            "lt", "--port", "8085", "--subdomain", "bgapp-admin"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Aguardar alguns segundos
        time.sleep(5)
        
        # Verificar se está funcionando
        if process.poll() is None:
            print("✅ Túnel localtunnel iniciado")
            print("🔗 URL: https://bgapp-admin.loca.lt/admin.html")
            return "https://bgapp-admin.loca.lt/admin.html", process
        else:
            # Se falhou com subdomain, tentar sem
            print("⚠️  Subdomain não disponível, a tentar URL aleatório...")
            process = subprocess.Popen([
                "lt", "--port", "8085"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            time.sleep(5)
            
            if process.poll() is None:
                # Tentar extrair URL do output
                stdout, _ = process.communicate(timeout=2)
                if "https://" in stdout:
                    url = stdout.split("https://")[1].split()[0]
                    full_url = f"https://{url}/admin.html"
                    print(f"✅ Túnel criado: {full_url}")
                    return full_url, process
                else:
                    print("✅ Túnel criado (URL aleatório)")
                    print("🔗 Verifica em: https://loca.lt")
                    return "https://random.loca.lt/admin.html", process
            else:
                print("❌ Falha ao criar túnel")
                return None, None
                
    except Exception as e:
        print(f"❌ Erro ao iniciar túnel: {e}")
        return None, None

def try_ngrok_simple():
    """Tenta ngrok sem autenticação"""
    print("🌐 Tentando ngrok simples...")
    
    try:
        # Tentar ngrok sem auth primeiro
        process = subprocess.Popen([
            "ngrok", "http", "8085"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Aguardar
        time.sleep(8)
        
        # Tentar obter URL
        try:
            response = requests.get("http://localhost:4040/api/tunnels", timeout=3)
            if response.status_code == 200:
                data = response.json()
                if data.get("tunnels"):
                    tunnel = data["tunnels"][0]
                    public_url = tunnel["public_url"]
                    print(f"✅ Túnel ngrok criado: {public_url}")
                    return f"{public_url}/admin.html", process
        except:
            pass
        
        print("⚠️  ngrok pode precisar de configuração")
        return None, process
        
    except Exception as e:
        print(f"❌ Erro com ngrok: {e}")
        return None, None

def main():
    """Função principal"""
    print("🚀 BGAPP - Acesso Remoto Rápido")
    print("=" * 40)
    
    # 1. Verificar serviços
    if not check_services():
        print("❌ Serviços BGAPP não estão funcionando")
        print("💡 Execute: docker compose -f infra/docker-compose.yml up -d")
        return
    
    # 2. Tentar ngrok primeiro
    url, process = try_ngrok_simple()
    
    if url:
        print("\n🎉 ACESSO REMOTO ATIVO!")
        print("=" * 30)
        print(f"🔗 URL para o teu pai: {url}")
        print("🔑 Sem password necessária (túnel público temporário)")
        print("")
        print("📱 Instruções para o teu pai:")
        print("   1. Abrir o URL")
        print("   2. Aceder directamente ao painel")
        print("   3. Navegar por todas as funcionalidades")
        print("")
        print("⚠️  ATENÇÃO: Este é um túnel público temporário")
        print("   Para máxima segurança, configura authtoken do ngrok")
        print("")
        print("🛑 Para parar: Ctrl+C")
        
        try:
            process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Túnel parado")
            process.terminate()
    
    else:
        print("\n📋 CONFIGURAÇÃO MANUAL NECESSÁRIA:")
        print("=" * 40)
        print("1. 🌐 Vai para: https://ngrok.com/signup")
        print("2. 📝 Cria conta grátis")
        print("3. 🔑 Vai para: https://dashboard.ngrok.com/get-started/your-authtoken")
        print("4. 📋 Copia o authtoken")
        print("5. ⚙️  Executa: ngrok config add-authtoken SEU_TOKEN")
        print("6. 🚀 Executa: ngrok http --basic-auth='admin:bgapp123' 8085")
        print("")
        print("💡 Alternativa: Usa localtunnel (sem registo)")
        print("   npm install -g localtunnel")
        print("   lt --port 8085")

if __name__ == "__main__":
    main()
