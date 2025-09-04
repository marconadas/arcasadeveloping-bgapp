#!/usr/bin/env python3
"""
Script para iniciar a aplicação BGAPP para testes
Inicia apenas a API sem Docker para testes rápidos
"""

import os
import sys
import subprocess
import signal
import time
from pathlib import Path

def setup_environment():
    """Configura variáveis de ambiente necessárias"""
    env_vars = {
        'PYTHONPATH': str(Path(__file__).parent / 'src'),
        'POSTGRES_HOST': 'localhost',
        'POSTGRES_PORT': '5432',
        'POSTGRES_DB': 'geo',
        'POSTGRES_USER': 'postgres',
        'POSTGRES_PASSWORD': 'postgres',
        'MINIO_ENDPOINT': 'localhost:9000',
        'MINIO_ACCESS_KEY': 'bgapp_admin',
        'MINIO_SECRET_KEY': 'minio123',
        'REDIS_HOST': 'localhost',
        'REDIS_PORT': '6379',
        'ENABLE_SECURITY': 'false',  # Desabilitar segurança para testes
        'ENABLE_RATE_LIMITING': 'false',  # Desabilitar rate limiting
        'LOG_LEVEL': 'INFO'
    }
    
    for key, value in env_vars.items():
        os.environ[key] = value
    
    print("✅ Variáveis de ambiente configuradas")

def check_dependencies():
    """Verifica se as dependências estão disponíveis"""
    print("🔍 Verificando dependências...")
    
    try:
        import uvicorn
        import fastapi
        import pydantic
        print("✅ FastAPI e Uvicorn disponíveis")
    except ImportError as e:
        print(f"❌ Dependências faltando: {e}")
        print("💡 Instale com: pip install fastapi uvicorn pydantic")
        return False
    
    return True

def start_application():
    """Inicia a aplicação"""
    print("🚀 Iniciando aplicação BGAPP...")
    
    # Configurar ambiente
    setup_environment()
    
    # Verificar dependências
    if not check_dependencies():
        return None
    
    # Comando para iniciar
    cmd = [
        sys.executable, "-m", "uvicorn",
        "src.bgapp.admin_api:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload",
        "--log-level", "info"
    ]
    
    try:
        print(f"📡 Executando: {' '.join(cmd)}")
        print("🌐 Aplicação estará disponível em: http://localhost:8000")
        print("📚 Documentação da API: http://localhost:8000/docs")
        print("🧠 API de ML: http://localhost:8000/ml")
        print("🛑 Para parar: Ctrl+C")
        print("=" * 60)
        
        # Iniciar processo
        process = subprocess.Popen(cmd, cwd=Path(__file__).parent)
        
        # Aguardar um pouco para a aplicação iniciar
        time.sleep(3)
        
        # Verificar se está rodando
        if process.poll() is None:
            print("✅ Aplicação iniciada com sucesso!")
            print("⏳ Aguardando requisições...")
        else:
            print("❌ Erro ao iniciar aplicação")
            return None
        
        return process
        
    except KeyboardInterrupt:
        print("\n🛑 Aplicação interrompida pelo usuário")
        if process:
            process.terminate()
        return None
    except Exception as e:
        print(f"❌ Erro ao iniciar aplicação: {e}")
        return None

def signal_handler(sig, frame):
    """Handler para Ctrl+C"""
    print("\n🛑 Parando aplicação...")
    sys.exit(0)

def main():
    """Função principal"""
    print("🌊 BGAPP - Iniciador para Testes")
    print("================================")
    
    # Configurar handler para Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)
    
    # Verificar se estamos no diretório correto
    if not Path("src/bgapp/admin_api.py").exists():
        print("❌ Erro: Execute este script a partir do diretório raiz do BGAPP")
        print("💡 Certifique-se que o arquivo src/bgapp/admin_api.py existe")
        return 1
    
    # Iniciar aplicação
    process = start_application()
    
    if not process:
        return 1
    
    try:
        # Manter rodando
        process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Parando aplicação...")
        process.terminate()
        process.wait()
    
    print("✅ Aplicação parada")
    return 0

if __name__ == "__main__":
    sys.exit(main())
