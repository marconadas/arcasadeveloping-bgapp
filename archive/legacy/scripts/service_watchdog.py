#!/usr/bin/env python3
"""
🐕 BGAPP Service Watchdog
Sistema de vigilância que mantém todos os serviços funcionando 24/7
Reinicia automaticamente serviços que falham
"""

import asyncio
import json
import logging
import subprocess
import time
import signal
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import aiohttp
import docker
from dataclasses import dataclass, asdict

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/watchdog.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class WatchdogConfig:
    """Configuração do watchdog"""
    check_interval: int = 30  # segundos
    max_restart_attempts: int = 3
    restart_cooldown: int = 60  # segundos
    alert_threshold: int = 5  # falhas consecutivas
    critical_services: List[str] = None
    
    def __post_init__(self):
        if self.critical_services is None:
            self.critical_services = ['frontend', 'admin_api', 'pygeoapi']

@dataclass
class ServiceState:
    """Estado de um serviço"""
    name: str
    last_check: datetime
    consecutive_failures: int = 0
    last_restart: Optional[datetime] = None
    restart_count: int = 0
    total_downtime: float = 0.0
    first_failure: Optional[datetime] = None

class ServiceWatchdog:
    """Watchdog para monitorizar e recuperar serviços"""
    
    def __init__(self, config: WatchdogConfig = None):
        self.config = config or WatchdogConfig()
        self.services_state: Dict[str, ServiceState] = {}
        self.docker_client = None
        self.running = False
        self.stats = {
            'total_checks': 0,
            'total_restarts': 0,
            'total_alerts': 0,
            'uptime_start': datetime.now()
        }
        
        # Inicializar Docker client
        try:
            self.docker_client = docker.from_env()
            logger.info("✅ Docker client inicializado")
        except Exception as e:
            logger.warning(f"⚠️ Docker não disponível: {e}")
        
        # Configurar handlers de sinal
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handler para sinais de sistema"""
        logger.info(f"🛑 Recebido sinal {signum}, parando watchdog...")
        self.stop()
        sys.exit(0)
    
    async def check_service_health(self, service_name: str) -> bool:
        """Verificar se um serviço está saudável"""
        try:
            if service_name == 'frontend':
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                    async with session.get('http://localhost:8085') as response:
                        return response.status == 200
            
            elif service_name == 'admin_api':
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                    async with session.get('http://localhost:8000/admin-api/services/status') as response:
                        return response.status == 200
            
            elif service_name == 'pygeoapi':
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                    async with session.get('http://localhost:5080/collections') as response:
                        return response.status == 200
            
            elif service_name == 'postgis':
                if self.docker_client:
                    container = self.docker_client.containers.get('infra-postgis-1')
                    if container.status != 'running':
                        return False
                    result = container.exec_run("pg_isready -U postgres")
                    return result.exit_code == 0
                return False
            
            elif service_name == 'minio':
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                    async with session.get('http://localhost:9000/minio/health/live') as response:
                        return response.status == 200
            
            elif service_name == 'stac':
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                    async with session.get('http://localhost:8081/health') as response:
                        return response.status == 200
            
            else:
                logger.warning(f"⚠️ Serviço desconhecido: {service_name}")
                return True
                
        except Exception as e:
            logger.debug(f"🔍 Falha na verificação de {service_name}: {e}")
            return False
    
    async def restart_service(self, service_name: str) -> bool:
        """Reiniciar um serviço"""
        logger.warning(f"🔄 Reiniciando {service_name}...")
        
        try:
            if service_name == 'frontend':
                if self.docker_client:
                    container = self.docker_client.containers.get('infra-frontend-1')
                    container.restart()
                    return True
            
            elif service_name == 'admin_api':
                # Parar processo existente
                subprocess.run(['pkill', '-f', 'admin_api_simple.py'], check=False)
                await asyncio.sleep(3)
                
                # Iniciar novo processo
                process = subprocess.Popen(
                    ['python3', 'admin_api_simple.py'],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    cwd=Path.cwd()
                )
                
                # Aguardar inicialização
                await asyncio.sleep(10)
                
                # Verificar se iniciou corretamente
                return await self.check_service_health('admin_api')
            
            elif service_name in ['pygeoapi', 'postgis', 'minio', 'stac']:
                if self.docker_client:
                    container_name = f'infra-{service_name}-1'
                    container = self.docker_client.containers.get(container_name)
                    container.restart()
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Erro ao reiniciar {service_name}: {e}")
            return False
    
    async def send_alert(self, service_name: str, message: str):
        """Enviar alerta sobre problema no serviço"""
        alert = {
            'timestamp': datetime.now().isoformat(),
            'service': service_name,
            'message': message,
            'severity': 'critical' if service_name in self.config.critical_services else 'warning'
        }
        
        # Salvar alerta
        alerts_file = Path('logs/alerts.jsonl')
        with alerts_file.open('a') as f:
            f.write(json.dumps(alert) + '\n')
        
        logger.error(f"🚨 ALERTA: {service_name} - {message}")
        self.stats['total_alerts'] += 1
    
    async def monitor_service(self, service_name: str):
        """Monitorizar um serviço específico"""
        if service_name not in self.services_state:
            self.services_state[service_name] = ServiceState(
                name=service_name,
                last_check=datetime.now()
            )
        
        state = self.services_state[service_name]
        is_healthy = await self.check_service_health(service_name)
        state.last_check = datetime.now()
        self.stats['total_checks'] += 1
        
        if is_healthy:
            # Serviço saudável
            if state.consecutive_failures > 0:
                downtime = (datetime.now() - state.first_failure).total_seconds()
                state.total_downtime += downtime
                logger.info(f"✅ {service_name} recuperado após {downtime:.1f}s offline")
            
            state.consecutive_failures = 0
            state.first_failure = None
        
        else:
            # Serviço com problema
            state.consecutive_failures += 1
            
            if state.first_failure is None:
                state.first_failure = datetime.now()
            
            logger.warning(f"⚠️ {service_name} offline (falha #{state.consecutive_failures})")
            
            # Decidir se deve reiniciar
            should_restart = (
                state.consecutive_failures >= 2 and  # Pelo menos 2 falhas consecutivas
                state.restart_count < self.config.max_restart_attempts and
                (state.last_restart is None or 
                 (datetime.now() - state.last_restart).total_seconds() > self.config.restart_cooldown)
            )
            
            if should_restart:
                restart_success = await self.restart_service(service_name)
                state.last_restart = datetime.now()
                state.restart_count += 1
                self.stats['total_restarts'] += 1
                
                if restart_success:
                    logger.info(f"✅ {service_name} reiniciado com sucesso")
                else:
                    logger.error(f"❌ Falha ao reiniciar {service_name}")
            
            # Enviar alerta se muitas falhas
            if state.consecutive_failures >= self.config.alert_threshold:
                await self.send_alert(
                    service_name,
                    f"Serviço offline há {state.consecutive_failures} verificações consecutivas"
                )
    
    async def run_monitoring_cycle(self):
        """Executar um ciclo completo de monitorização"""
        services_to_monitor = [
            'frontend', 'admin_api', 'pygeoapi', 'postgis', 'minio', 'stac'
        ]
        
        tasks = [self.monitor_service(service) for service in services_to_monitor]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # Log estatísticas periodicamente
        if self.stats['total_checks'] % 100 == 0:
            uptime = (datetime.now() - self.stats['uptime_start']).total_seconds()
            logger.info(f"📊 Stats: {self.stats['total_checks']} checks, "
                       f"{self.stats['total_restarts']} restarts, "
                       f"{self.stats['total_alerts']} alerts em {uptime:.0f}s")
    
    async def run(self):
        """Executar watchdog principal"""
        logger.info("🐕 Iniciando BGAPP Service Watchdog...")
        logger.info(f"⚙️ Configuração: verificação a cada {self.config.check_interval}s")
        
        self.running = True
        
        while self.running:
            try:
                await self.run_monitoring_cycle()
                await self.save_status_report()
                await asyncio.sleep(self.config.check_interval)
                
            except Exception as e:
                logger.error(f"❌ Erro no ciclo de monitorização: {e}")
                await asyncio.sleep(10)
    
    async def save_status_report(self):
        """Salvar relatório de status"""
        try:
            report = {
                'timestamp': datetime.now().isoformat(),
                'stats': self.stats.copy(),
                'services': {name: asdict(state) for name, state in self.services_state.items()}
            }
            
            # Converter datetime para string
            for service_data in report['services'].values():
                for key, value in service_data.items():
                    if isinstance(value, datetime):
                        service_data[key] = value.isoformat()
            
            report['stats']['uptime_start'] = report['stats']['uptime_start'].isoformat()
            
            # Salvar relatório
            with open('reports/watchdog_status.json', 'w') as f:
                json.dump(report, f, indent=2, default=str)
                
        except Exception as e:
            logger.error(f"❌ Erro ao salvar relatório: {e}")
    
    def stop(self):
        """Parar watchdog"""
        logger.info("🛑 Parando watchdog...")
        self.running = False

async def main():
    """Função principal"""
    # Criar diretórios necessários
    Path('logs').mkdir(exist_ok=True)
    Path('reports').mkdir(exist_ok=True)
    
    # Configuração personalizada
    config = WatchdogConfig(
        check_interval=30,
        max_restart_attempts=5,
        restart_cooldown=120,
        alert_threshold=3
    )
    
    # Iniciar watchdog
    watchdog = ServiceWatchdog(config)
    
    try:
        await watchdog.run()
    except KeyboardInterrupt:
        logger.info("🛑 Interrompido pelo usuário")
    finally:
        watchdog.stop()

if __name__ == "__main__":
    asyncio.run(main())
