#!/usr/bin/env python3
"""
Quick Start para Demo - 17 de Setembro
Inicia apenas os componentes essenciais rapidamente
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def log_info(msg):
    print(f"🔧 {msg}")

def log_success(msg):
    print(f"✅ {msg}")

def log_error(msg):
    print(f"❌ {msg}")

def run_command(cmd, background=False):
    """Executar comando"""
    try:
        if background:
            return subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        log_error(f"Erro executando comando: {e}")
        return False

def main():
    print("🚀 BGAPP Quick Start - Demo 17 de Setembro")
    print("=" * 50)
    
    # 1. Configurar ambiente
    log_info("Configurando ambiente...")
    os.environ.update({
        "PYTHONPATH": str(Path.cwd() / "src"),
        "POSTGRES_HOST": "localhost",
        "POSTGRES_PORT": "5432", 
        "POSTGRES_DB": "geo",
        "POSTGRES_USER": "postgres",
        "POSTGRES_PASSWORD": "postgres",
        "REDIS_HOST": "localhost",
        "REDIS_PORT": "6379",
        "MINIO_ENDPOINT": "localhost:9000",
        "MINIO_ACCESS_KEY": "bgapp_admin",
        "MINIO_SECRET_KEY": "minio123"
    })
    
    # 2. Parar processos conflitantes
    log_info("Parando processos conflitantes...")
    run_command("pkill -f 'python.*admin_api' || true")
    run_command("pkill -f 'npm.*dev' || true")
    
    # 3. Verificar se Docker está rodando os serviços básicos
    log_info("Verificando serviços Docker...")
    success, output, _ = run_command("docker ps")
    if "postgis" in output and "redis" in output:
        log_success("Serviços Docker básicos rodando!")
    else:
        log_info("Iniciando serviços Docker básicos...")
        run_command("cd infra && docker compose up -d postgis redis minio")
        time.sleep(10)
    
    # 4. Criar diretórios necessários
    log_info("Criando diretórios necessários...")
    os.makedirs("logs", exist_ok=True)
    os.makedirs("backups", exist_ok=True)
    
    # 5. Iniciar API simplificada
    log_info("Iniciando API backend...")
    api_process = run_command("python3 admin_api_simple.py > logs/api_simple.log 2>&1", background=True)
    time.sleep(5)
    
    # 6. Verificar se API está funcionando
    success, _, _ = run_command("curl -s http://localhost:8000/health")
    if success:
        log_success("API Backend funcionando!")
    else:
        log_error("API Backend falhou - tentando admin_api_complete.py")
        run_command("python3 admin_api_complete.py > logs/api_complete.log 2>&1", background=True)
        time.sleep(5)
    
    # 7. Iniciar Frontend
    log_info("Iniciando Frontend...")
    os.chdir("admin-dashboard")
    
    # Verificar se node_modules existe
    if not Path("node_modules").exists():
        log_info("Instalando dependências npm...")
        run_command("npm install")
    
    frontend_process = run_command("npm run dev > ../logs/frontend.log 2>&1", background=True)
    time.sleep(10)
    
    # 8. Verificar se frontend está funcionando
    success, _, _ = run_command("curl -s http://localhost:3000")
    if success:
        log_success("Frontend funcionando!")
    else:
        log_error("Frontend falhou")
    
    os.chdir("..")
    
    # 9. Status final
    print("\n" + "=" * 50)
    print("📊 STATUS DOS SERVIÇOS:")
    print("=" * 50)
    
    services = [
        ("Admin API", "http://localhost:8000/health"),
        ("Frontend Dashboard", "http://localhost:3000"),
        ("MinIO Storage", "http://localhost:9001"),
        ("PostgreSQL", "localhost:5432"),
        ("Redis Cache", "localhost:6379")
    ]
    
    for name, url in services:
        if url.startswith("http"):
            success, _, _ = run_command(f"curl -s {url}")
            status = "✅ FUNCIONANDO" if success else "❌ FALHOU"
        else:
            # Para serviços não-HTTP, verificar se porta está aberta
            port = url.split(":")[1]
            success, _, _ = run_command(f"nc -z localhost {port}")
            status = "✅ FUNCIONANDO" if success else "❌ FALHOU"
        
        print(f"{name:20} {status:15} {url}")
    
    print("\n" + "=" * 50)
    print("🎯 ACESSO RÁPIDO - DEMO 17 SETEMBRO:")
    print("=" * 50)
    print("🌐 Dashboard Admin: http://localhost:3000")
    print("🔧 API Docs: http://localhost:8000/docs")
    print("📁 Storage: http://localhost:9001")
    print("=" * 50)
    print("🚀 Sistema pronto para apresentação!")
    print("=" * 50)

if __name__ == "__main__":
    main()
