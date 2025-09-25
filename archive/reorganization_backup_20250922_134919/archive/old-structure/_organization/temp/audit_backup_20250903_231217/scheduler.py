#!/usr/bin/env python3
"""
Sistema de Agendamento para Conectores BGAPP
Executa conectores automaticamente baseado na configuração
"""

import asyncio
import logging
import subprocess
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import yaml
import json
from croniter import croniter
import psutil

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/scheduler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class BGAPPScheduler:
    """Scheduler para executar conectores automaticamente"""
    
    def __init__(self, config_path: str = "configs/admin.yaml"):
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.running_jobs: Dict[str, subprocess.Popen] = {}
        self.job_history: List[Dict[str, Any]] = []
        self.is_running = False
        
    def _load_config(self) -> Dict[str, Any]:
        """Carregar configuração do scheduler"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            logger.info(f"Configuração carregada de {self.config_path}")
            return config
        except Exception as e:
            logger.error(f"Erro ao carregar configuração: {e}")
            return {"connectors": {}}
    
    def get_next_run_time(self, cron_expression: str) -> datetime:
        """Calcular próxima execução baseada na expressão cron"""
        try:
            cron = croniter(cron_expression, datetime.now())
            return cron.get_next(datetime)
        except Exception as e:
            logger.error(f"Erro ao processar cron '{cron_expression}': {e}")
            return datetime.now() + timedelta(hours=1)  # Fallback: 1 hora
    
    def is_connector_enabled(self, connector_name: str) -> bool:
        """Verificar se conector está habilitado"""
        connector_config = self.config.get("connectors", {}).get(connector_name, {})
        return connector_config.get("enabled", False)
    
    def get_connector_schedule(self, connector_name: str) -> Optional[str]:
        """Obter expressão cron do conector"""
        connector_config = self.config.get("connectors", {}).get(connector_name, {})
        return connector_config.get("schedule")
    
    def get_connector_timeout(self, connector_name: str) -> int:
        """Obter timeout do conector em segundos"""
        connector_config = self.config.get("connectors", {}).get(connector_name, {})
        return connector_config.get("timeout", 300)  # 5 minutos por padrão
    
    async def execute_connector(self, connector_name: str) -> Dict[str, Any]:
        """Executar um conector específico"""
        if connector_name in self.running_jobs:
            logger.warning(f"Conector {connector_name} já está em execução")
            return {"status": "already_running", "connector": connector_name}
        
        # Mapear conectores para módulos
        connector_modules = {
            "obis": "src.bgapp.ingest.obis",
            "cmems": "src.bgapp.ingest.cmems_chla", 
            "modis": "src.bgapp.ingest.modis_ndvi",
            "erddap": "src.bgapp.ingest.erddap_sst",
            "fisheries": "src.bgapp.ingest.fisheries_angola",
            "copernicus_real": "src.bgapp.ingest.copernicus_real",
            "cdse_sentinel": "src.bgapp.ingest.cdse_sentinel",
            "cds_era5": "src.bgapp.ingest.cds_era5",
            "angola_sources": "src.bgapp.ingest.angola_sources"
        }
        
        module = connector_modules.get(connector_name)
        if not module:
            logger.error(f"Módulo não encontrado para conector: {connector_name}")
            return {"status": "error", "message": "Módulo não encontrado"}
        
        start_time = datetime.now()
        job_info = {
            "id": f"{connector_name}_{int(time.time())}",
            "connector": connector_name,
            "status": "running",
            "start_time": start_time,
            "module": module,
            "pid": None
        }
        
        try:
            logger.info(f"Iniciando conector {connector_name}")
            
            # Executar o módulo
            cmd = ["python", "-m", module]
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=Path(__file__).parent.parent.parent
            )
            
            job_info["pid"] = process.pid
            self.running_jobs[connector_name] = process
            
            # Aguardar conclusão com timeout
            timeout = self.get_connector_timeout(connector_name)
            try:
                stdout, stderr = process.communicate(timeout=timeout)
                return_code = process.returncode
                
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                
                job_info.update({
                    "status": "completed" if return_code == 0 else "failed",
                    "end_time": end_time,
                    "duration": duration,
                    "return_code": return_code,
                    "stdout": stdout,
                    "stderr": stderr
                })
                
                if return_code == 0:
                    logger.info(f"Conector {connector_name} concluído com sucesso em {duration:.1f}s")
                else:
                    logger.error(f"Conector {connector_name} falhou com código {return_code}")
                    logger.error(f"Stderr: {stderr}")
                
            except subprocess.TimeoutExpired:
                logger.warning(f"Conector {connector_name} excedeu timeout de {timeout}s")
                process.kill()
                process.communicate()
                
                job_info.update({
                    "status": "timeout",
                    "end_time": datetime.now(),
                    "duration": timeout,
                    "return_code": -1,
                    "error": f"Timeout após {timeout}s"
                })
            
        except Exception as e:
            logger.error(f"Erro ao executar conector {connector_name}: {e}")
            job_info.update({
                "status": "error",
                "end_time": datetime.now(),
                "error": str(e)
            })
        
        finally:
            # Remover da lista de jobs em execução
            if connector_name in self.running_jobs:
                del self.running_jobs[connector_name]
            
            # Adicionar ao histórico
            self.job_history.append(job_info)
            
            # Manter apenas os últimos 100 jobs
            if len(self.job_history) > 100:
                self.job_history = self.job_history[-100:]
        
        return job_info
    
    def get_system_status(self) -> Dict[str, Any]:
        """Obter status do sistema"""
        return {
            "scheduler_running": self.is_running,
            "running_jobs": len(self.running_jobs),
            "active_connectors": list(self.running_jobs.keys()),
            "total_jobs_history": len(self.job_history),
            "system_load": psutil.cpu_percent(interval=1),
            "memory_usage": psutil.virtual_memory().percent,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_job_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Obter histórico de jobs"""
        return self.job_history[-limit:]
    
    async def run_scheduler_loop(self):
        """Loop principal do scheduler"""
        logger.info("Iniciando scheduler BGAPP")
        self.is_running = True
        
        # Calcular próximas execuções
        next_runs = {}
        for connector_name, config in self.config.get("connectors", {}).items():
            if config.get("enabled", False) and config.get("schedule"):
                next_runs[connector_name] = self.get_next_run_time(config["schedule"])
                logger.info(f"Agendado {connector_name} para {next_runs[connector_name]}")
        
        while self.is_running:
            try:
                current_time = datetime.now()
                
                # Verificar se algum conector deve ser executado
                for connector_name in list(next_runs.keys()):
                    if current_time >= next_runs[connector_name]:
                        logger.info(f"Executando conector agendado: {connector_name}")
                        
                        # Executar conector em background
                        asyncio.create_task(self.execute_connector(connector_name))
                        
                        # Calcular próxima execução
                        schedule = self.get_connector_schedule(connector_name)
                        if schedule:
                            next_runs[connector_name] = self.get_next_run_time(schedule)
                            logger.info(f"Próxima execução de {connector_name}: {next_runs[connector_name]}")
                
                # Aguardar 30 segundos antes da próxima verificação
                await asyncio.sleep(30)
                
            except Exception as e:
                logger.error(f"Erro no loop do scheduler: {e}")
                await asyncio.sleep(60)  # Aguardar mais tempo em caso de erro
        
        logger.info("Scheduler BGAPP parado")
    
    def stop_scheduler(self):
        """Parar o scheduler"""
        logger.info("Parando scheduler...")
        self.is_running = False
        
        # Terminar jobs em execução
        for connector_name, process in self.running_jobs.items():
            logger.info(f"Terminando job {connector_name} (PID: {process.pid})")
            try:
                process.terminate()
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
            except Exception as e:
                logger.error(f"Erro ao terminar job {connector_name}: {e}")
        
        self.running_jobs.clear()

# Instância global do scheduler
scheduler = BGAPPScheduler()

async def main():
    """Função principal para executar o scheduler"""
    try:
        await scheduler.run_scheduler_loop()
    except KeyboardInterrupt:
        logger.info("Recebido sinal de interrupção")
    finally:
        scheduler.stop_scheduler()

if __name__ == "__main__":
    # Criar diretório de logs se não existir
    Path("logs").mkdir(exist_ok=True)
    
    # Executar scheduler
    asyncio.run(main())
