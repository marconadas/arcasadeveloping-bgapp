#!/usr/bin/env python3
"""
Script para iniciar o scheduler BGAPP
"""

import asyncio
import sys
import signal
from pathlib import Path

# Adicionar src ao path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.bgapp.scheduler import scheduler

def signal_handler(signum, frame):
    """Handler para sinais de sistema"""
    print(f"\nRecebido sinal {signum}, parando scheduler...")
    scheduler.stop_scheduler()
    sys.exit(0)

async def main():
    """Função principal"""
    # Registrar handlers para sinais
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("🚀 Iniciando BGAPP Scheduler...")
    print("📋 Configuração carregada de: configs/admin.yaml")
    print("📊 Logs salvos em: logs/scheduler.log")
    print("⏹️  Para parar: Ctrl+C ou SIGTERM")
    print("-" * 50)
    
    try:
        await scheduler.run_scheduler_loop()
    except KeyboardInterrupt:
        print("\n⏹️  Scheduler interrompido pelo usuário")
    except Exception as e:
        print(f"❌ Erro no scheduler: {e}")
    finally:
        scheduler.stop_scheduler()
        print("✅ Scheduler parado")

if __name__ == "__main__":
    # Criar diretório de logs
    Path("logs").mkdir(exist_ok=True)
    
    # Executar
    asyncio.run(main())
