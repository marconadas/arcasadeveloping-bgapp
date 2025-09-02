#!/usr/bin/env python3
"""
🏥 Sistema de Monitorização de Saúde dos Serviços BGAPP
Sistema robusto para monitorizar e recuperar automaticamente serviços offline
"""

import asyncio
import json
import logging
import subprocess
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import aiohttp
import psutil
import docker
from dataclasses import dataclass, asdict

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/health_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ServiceConfig:
    """Configuração de um serviço"""
    name: str
    port: int
    url: str
    health_endpoint: str
    docker_service: Optional[str] = None
    process_name: Optional[str] = None
    critical: bool = True
    timeout: int = 10
    max_retries: int = 3
    restart_command: Optional[str] = None

@dataclass
class ServiceStatus:
    """Status de um serviço"""
    name: str
    status: str
    response_time: float
    last_check: datetime
    error_message: Optional[str] = None
    uptime_percentage: float = 100.0
    consecutive_failures: int = 0

class HealthMonitor:
    """Monitor de saúde dos serviços BGAPP"""
    
    def __init__(self):
        self.services = self._load_service_configs()
        self.status_history: Dict[str, List[ServiceStatus]] = {}
        self.alerts_sent: Dict[str, datetime] = {}
        self.docker_client = None
        self.running = False
        
        # Inicializar cliente Docker
        try:
            self.docker_client = docker.from_env()
            logger.info("✅ Cliente Docker inicializado")
        except Exception as e:
            logger.warning(f"⚠️ Docker não disponível: {e}")
    
    def _load_service_configs(self) -> Dict[str, ServiceConfig]:
        """Carregar configurações dos serviços"""
        return {
            'frontend': ServiceConfig(
                name='Frontend',
                port=8085,
                url='http://localhost:8085',
                health_endpoint='/',
                docker_service='infra-frontend-1',
                critical=True
            ),
            'admin_api': ServiceConfig(
                name='Admin API',
                port=8000,
                url='http://localhost:8000',
                health_endpoint='/admin-api/services/status',
                process_name='admin_api_simple.py',
                restart_command='python3 admin_api_simple.py',
                critical=True
            ),
            'pygeoapi': ServiceConfig(
                name='PyGeoAPI',
                port=5080,
                url='http://localhost:5080',
                health_endpoint='/collections',
                docker_service='infra-pygeoapi-1',
                critical=True
            ),
            'postgis': ServiceConfig(
                name='PostGIS',
                port=5432,
                url='localhost:5432',
                health_endpoint='',
                docker_service='infra-postgis-1',
                critical=True
            ),
            'minio': ServiceConfig(
                name='MinIO',
                port=9000,
                url='http://localhost:9000',
                health_endpoint='/minio/health/live',
                docker_service='infra-minio-1',
                critical=False
            ),
            'stac': ServiceConfig(
                name='STAC API',
                port=8081,
                url='http://localhost:8081',
                health_endpoint='/health',
                docker_service='infra-stac-1',
                critical=False
            ),
            'keycloak': ServiceConfig(
                name='Keycloak',
                port=8083,
                url='http://localhost:8083',
                health_endpoint='/health',
                docker_service='infra-keycloak-1',
                critical=False
            )
        }
    
    async def check_service_health(self, service: ServiceConfig) -> ServiceStatus:
        """Verificar saúde de um serviço"""
        start_time = time.time()
        
        try:
            # Para PostgreSQL, verificar diferente
            if service.name == 'PostGIS':
                return await self._check_postgres_health(service, start_time)
            
            # Para outros serviços HTTP
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=service.timeout)) as session:
                async with session.get(service.url + service.health_endpoint) as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 200:
                        return ServiceStatus(
                            name=service.name,
                            status='online',
                            response_time=response_time,
                            last_check=datetime.now()
                        )
                    else:
                        return ServiceStatus(
                            name=service.name,
                            status='degraded',
                            response_time=response_time,
                            last_check=datetime.now(),
                            error_message=f'HTTP {response.status}'
                        )
        
        except Exception as e:
            response_time = time.time() - start_time
            return ServiceStatus(
                name=service.name,
                status='offline',
                response_time=response_time,
                last_check=datetime.now(),
                error_message=str(e)
            )
    
    async def _check_postgres_health(self, service: ServiceConfig, start_time: float) -> ServiceStatus:
        """Verificar saúde do PostgreSQL"""
        try:
            if self.docker_client:
                container = self.docker_client.containers.get(service.docker_service)
                if container.status == 'running':
                    # Executar pg_isready dentro do container
                    result = container.exec_run("pg_isready -U postgres")
                    response_time = time.time() - start_time
                    
                    if result.exit_code == 0:
                        return ServiceStatus(
                            name=service.name,
                            status='online',
                            response_time=response_time,
                            last_check=datetime.now()
                        )
                    else:
                        return ServiceStatus(
                            name=service.name,
                            status='offline',
                            response_time=response_time,
                            last_check=datetime.now(),
                            error_message=result.output.decode()
                        )
                else:
                    return ServiceStatus(
                        name=service.name,
                        status='offline',
                        response_time=time.time() - start_time,
                        last_check=datetime.now(),
                        error_message=f'Container status: {container.status}'
                    )
        except Exception as e:
            return ServiceStatus(
                name=service.name,
                status='offline',
                response_time=time.time() - start_time,
                last_check=datetime.now(),
                error_message=str(e)
            )
    
    async def restart_service(self, service: ServiceConfig) -> bool:
        """Reiniciar um serviço"""
        logger.warning(f"🔄 Tentando reiniciar {service.name}...")
        
        try:
            # Reiniciar container Docker
            if service.docker_service and self.docker_client:
                try:
                    container = self.docker_client.containers.get(service.docker_service)
                    container.restart()
                    logger.info(f"✅ Container {service.docker_service} reiniciado")
                    return True
                except Exception as e:
                    logger.error(f"❌ Erro ao reiniciar container {service.docker_service}: {e}")
            
            # Reiniciar processo Python
            if service.process_name and service.restart_command:
                try:
                    # Parar processo existente
                    subprocess.run(['pkill', '-f', service.process_name], check=False)
                    await asyncio.sleep(2)
                    
                    # Iniciar novo processo
                    subprocess.Popen(service.restart_command.split(), 
                                   stdout=subprocess.DEVNULL, 
                                   stderr=subprocess.DEVNULL)
                    logger.info(f"✅ Processo {service.process_name} reiniciado")
                    return True
                except Exception as e:
                    logger.error(f"❌ Erro ao reiniciar processo {service.process_name}: {e}")
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Erro geral ao reiniciar {service.name}: {e}")
            return False
    
    async def monitor_services(self):
        """Monitorizar todos os serviços continuamente"""
        logger.info("🚀 Iniciando monitorização de serviços...")
        self.running = True
        
        while self.running:
            try:
                # Verificar todos os serviços
                tasks = [self.check_service_health(service) for service in self.services.values()]
                results = await asyncio.gather(*tasks)
                
                # Processar resultados
                critical_failures = []
                for status in results:
                    service = self.services[status.name.lower().replace(' ', '_').replace('api', 'api')]
                    
                    # Atualizar histórico
                    if status.name not in self.status_history:
                        self.status_history[status.name] = []
                    self.status_history[status.name].append(status)
                    
                    # Manter apenas últimas 100 entradas
                    if len(self.status_history[status.name]) > 100:
                        self.status_history[status.name] = self.status_history[status.name][-100:]
                    
                    # Verificar se precisa reiniciar
                    if status.status == 'offline' and service.critical:
                        critical_failures.append((service, status))
                        
                        # Calcular falhas consecutivas
                        recent_statuses = self.status_history[status.name][-5:]
                        consecutive_failures = sum(1 for s in recent_statuses if s.status == 'offline')
                        
                        # Reiniciar se muitas falhas consecutivas
                        if consecutive_failures >= 3:
                            await self.restart_service(service)
                            await asyncio.sleep(10)  # Aguardar reinicialização
                
                # Log do status geral
                online_count = sum(1 for s in results if s.status == 'online')
                total_count = len(results)
                logger.info(f"📊 Status: {online_count}/{total_count} serviços online")
                
                # Salvar relatório
                await self.save_health_report(results)
                
                # Aguardar próxima verificação
                await asyncio.sleep(30)  # Verificar a cada 30 segundos
                
            except Exception as e:
                logger.error(f"❌ Erro na monitorização: {e}")
                await asyncio.sleep(10)
    
    async def save_health_report(self, statuses: List[ServiceStatus]):
        """Salvar relatório de saúde"""
        try:
            report = {
                'timestamp': datetime.now().isoformat(),
                'services': [asdict(status) for status in statuses],
                'summary': {
                    'total': len(statuses),
                    'online': sum(1 for s in statuses if s.status == 'online'),
                    'offline': sum(1 for s in statuses if s.status == 'offline'),
                    'degraded': sum(1 for s in statuses if s.status == 'degraded')
                }
            }
            
            # Criar diretório se não existir
            Path('reports').mkdir(exist_ok=True)
            
            # Salvar relatório
            with open('reports/health_report.json', 'w') as f:
                json.dump(report, f, indent=2, default=str)
                
        except Exception as e:
            logger.error(f"❌ Erro ao salvar relatório: {e}")
    
    def stop_monitoring(self):
        """Parar monitorização"""
        logger.info("🛑 Parando monitorização...")
        self.running = False

async def main():
    """Função principal"""
    monitor = HealthMonitor()
    
    try:
        await monitor.monitor_services()
    except KeyboardInterrupt:
        logger.info("🛑 Interrompido pelo usuário")
    finally:
        monitor.stop_monitoring()

if __name__ == "__main__":
    # Criar diretórios necessários
    Path('logs').mkdir(exist_ok=True)
    Path('reports').mkdir(exist_ok=True)
    
    # Executar monitor
    asyncio.run(main())
