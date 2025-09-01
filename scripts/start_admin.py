#!/usr/bin/env python3
"""
Script para iniciar o painel administrativo BGAPP
"""

import subprocess
import sys
import time
import webbrowser
from pathlib import Path

def main():
    """Inicia todos os serviços necessários para o painel administrativo"""
    
    print("🚀 BGAPP - Iniciando Painel Administrativo")
    print("=" * 50)
    
    # Verificar se estamos no diretório correto
    if not Path("infra/docker-compose.yml").exists():
        print("❌ Erro: Execute este script a partir do diretório raiz do projeto")
        sys.exit(1)
    
    try:
        # Parar serviços existentes
        print("🛑 Parando serviços existentes...")
        subprocess.run([
            "docker", "compose", "-f", "infra/docker-compose.yml", "down"
        ], check=False)
        
        # Construir e iniciar serviços
        print("🔨 Construindo e iniciando serviços...")
        result = subprocess.run([
            "docker", "compose", "-f", "infra/docker-compose.yml", 
            "up", "-d", "--build"
        ], check=True)
        
        if result.returncode == 0:
            print("✅ Serviços iniciados com sucesso!")
            print()
            print("📋 URLs dos Serviços:")
            print("=" * 30)
            print("⚙️  Painel Administrativo: http://localhost:8085/admin.html")
            print("🖥️  Dashboard Científico:  http://localhost:8085/dashboard.html")
            print("🗺️  Mapa Interativo:       http://localhost:8085/")
            print("📱 Interface Mobile:      http://localhost:8085/mobile.html")
            print()
            print("🔧 APIs e Serviços:")
            print("=" * 20)
            print("🔌 Admin API:             http://localhost:8000")
            print("🗄️  PostGIS:              localhost:5432")
            print("💾 MinIO:                 http://localhost:9000")
            print("📦 STAC FastAPI:          http://localhost:8081")
            print("🌐 pygeoapi:              http://localhost:5080")
            print("🔍 STAC Browser:          http://localhost:8082")
            print("🔐 Keycloak:              http://localhost:8083")
            print()
            
            # Aguardar serviços ficarem prontos
            print("⏳ Aguardando serviços ficarem prontos...")
            time.sleep(10)
            
            # Verificar se os serviços estão funcionando
            print("🔍 Verificando estado dos serviços...")
            services_ok = check_services()
            
            if services_ok:
                print("✅ Todos os serviços estão funcionando!")
                print()
                print("🎉 Painel administrativo pronto!")
                print("   Acesse: http://localhost:8085/admin.html")
                
                # Abrir browser automaticamente
                try:
                    webbrowser.open("http://localhost:8085/admin.html")
                except:
                    pass
                    
            else:
                print("⚠️  Alguns serviços podem não estar totalmente prontos.")
                print("   Aguarde alguns minutos e verifique novamente.")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao iniciar serviços: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Operação cancelada pelo utilizador")
        sys.exit(1)

def check_services():
    """Verifica se os principais serviços estão funcionando"""
    import requests
    
    services = {
        "Admin API": "http://localhost:8000/health",
        "Frontend": "http://localhost:8085/",
        "STAC FastAPI": "http://localhost:8081/",
        "pygeoapi": "http://localhost:5080/",
        "MinIO": "http://localhost:9000/minio/health/live"
    }
    
    all_ok = True
    for name, url in services.items():
        try:
            response = requests.get(url, timeout=5)
            if response.status_code < 500:
                print(f"  ✅ {name}: OK")
            else:
                print(f"  ⚠️  {name}: Resposta {response.status_code}")
                all_ok = False
        except Exception as e:
            print(f"  ❌ {name}: {str(e)}")
            all_ok = False
    
    return all_ok

if __name__ == "__main__":
    main()
