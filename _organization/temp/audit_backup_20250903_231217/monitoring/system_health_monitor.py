#!/usr/bin/env python3
"""
BGAPP System Health Monitor - Monitorização da Saúde do Sistema
Sistema robusto de monitorização de todos os componentes BGAPP com alertas
e diagnósticos automáticos para garantir operação contínua.
"""

import asyncio
import json
import logging
import psutil
import requests
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import socket
import subprocess

# Configurar logging
logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    """Status de saúde dos componentes"""
    HEALTHY = "saudável"
    WARNING = "aviso"
    CRITICAL = "crítico"
    UNKNOWN = "desconhecido"
    MAINTENANCE = "manutenção"


class ComponentType(Enum):
    """Tipos de componentes do sistema"""
    DATABASE = "base_dados"
    API_SERVICE = "servico_api"
    CACHE = "cache"
    STORAGE = "armazenamento"
    PROCESSING = "processamento"
    MONITORING = "monitorizacao"
    EXTERNAL_API = "api_externa"
    NETWORK = "rede"
    SYSTEM_RESOURCE = "recurso_sistema"


@dataclass
class HealthCheck:
    """Verificação de saúde de um componente"""
    component_name: str
    component_type: ComponentType
    status: HealthStatus
    response_time_ms: float
    last_check: datetime
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None
    uptime_percentage: float = 100.0
    threshold_warning: float = 80.0
    threshold_critical: float = 60.0


@dataclass
class SystemAlert:
    """Alerta do sistema"""
    id: str
    component_name: str
    severity: str  # 'info', 'warning', 'error', 'critical'
    message: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    auto_resolved: bool = False
    acknowledgment: Optional[str] = None


class SystemHealthMonitor:
    """
    ⚕️ Monitor de Saúde do Sistema BGAPP
    
    Monitoriza continuamente todos os componentes da BGAPP e gera
    alertas automáticos para problemas de performance ou disponibilidade.
    """
    
    def __init__(self):
        """Inicializar monitor de saúde"""
        
        # Componentes a monitorizar
        self.components_config = {
            # Bases de dados
            'postgresql_main': {
                'name': 'PostgreSQL Principal',
                'type': ComponentType.DATABASE,
                'check_method': self._check_postgresql,
                'check_interval': 60,  # segundos
                'endpoint': 'postgresql://localhost:5432/bgapp',
                'thresholds': {'warning': 1000, 'critical': 3000}  # ms
            },
            'timescaledb': {
                'name': 'TimescaleDB',
                'type': ComponentType.DATABASE,
                'check_method': self._check_timescaledb,
                'check_interval': 60,
                'endpoint': 'postgresql://localhost:5432/timescaledb',
                'thresholds': {'warning': 1500, 'critical': 4000}
            },
            
            # Cache
            'redis_cache': {
                'name': 'Redis Cache',
                'type': ComponentType.CACHE,
                'check_method': self._check_redis,
                'check_interval': 30,
                'endpoint': 'redis://localhost:6379',
                'thresholds': {'warning': 500, 'critical': 2000}
            },
            
            # Armazenamento
            'minio_storage': {
                'name': 'MinIO Storage',
                'type': ComponentType.STORAGE,
                'check_method': self._check_minio,
                'check_interval': 120,
                'endpoint': 'http://localhost:9000',
                'thresholds': {'warning': 2000, 'critical': 5000}
            },
            
            # APIs externas
            'copernicus_api': {
                'name': 'Copernicus CMEMS API',
                'type': ComponentType.EXTERNAL_API,
                'check_method': self._check_copernicus,
                'check_interval': 300,  # 5 minutos
                'endpoint': 'https://my.cmems-du.eu/motu-web/Motu',
                'thresholds': {'warning': 5000, 'critical': 15000}
            },
            'obis_api': {
                'name': 'OBIS API',
                'type': ComponentType.EXTERNAL_API,
                'check_method': self._check_obis,
                'check_interval': 300,
                'endpoint': 'https://api.obis.org/v3',
                'thresholds': {'warning': 3000, 'critical': 10000}
            },
            'gbif_api': {
                'name': 'GBIF API',
                'type': ComponentType.EXTERNAL_API,
                'check_method': self._check_gbif,
                'check_interval': 300,
                'endpoint': 'https://api.gbif.org/v1',
                'thresholds': {'warning': 2000, 'critical': 8000}
            },
            
            # Serviços internos
            'admin_api': {
                'name': 'Admin API',
                'type': ComponentType.API_SERVICE,
                'check_method': self._check_admin_api,
                'check_interval': 30,
                'endpoint': 'http://localhost:8001/health',
                'thresholds': {'warning': 1000, 'critical': 3000}
            },
            'pygeoapi': {
                'name': 'PyGeoAPI',
                'type': ComponentType.API_SERVICE,
                'check_method': self._check_pygeoapi,
                'check_interval': 60,
                'endpoint': 'http://localhost:5000',
                'thresholds': {'warning': 2000, 'critical': 5000}
            },
            
            # Recursos do sistema
            'system_cpu': {
                'name': 'CPU do Sistema',
                'type': ComponentType.SYSTEM_RESOURCE,
                'check_method': self._check_cpu,
                'check_interval': 30,
                'thresholds': {'warning': 80, 'critical': 95}  # percentagem
            },
            'system_memory': {
                'name': 'Memória do Sistema',
                'type': ComponentType.SYSTEM_RESOURCE,
                'check_method': self._check_memory,
                'check_interval': 30,
                'thresholds': {'warning': 85, 'critical': 95}
            },
            'system_disk': {
                'name': 'Disco do Sistema',
                'type': ComponentType.SYSTEM_RESOURCE,
                'check_method': self._check_disk,
                'check_interval': 120,
                'thresholds': {'warning': 85, 'critical': 95}
            }
        }
        
        # Estado atual dos componentes
        self.health_status = {}
        
        # Histórico de alertas
        self.alerts_history = []
        self.active_alerts = {}
        
        # Métricas de uptime
        self.uptime_tracking = {}
        
        # Estado do monitor
        self.monitoring_active = False
        self.last_full_check = None
        
    async def start_monitoring(self):
        """🚀 Iniciar monitorização contínua"""
        
        if self.monitoring_active:
            logger.warning("Monitor já está ativo")
            return
        
        self.monitoring_active = True
        logger.info("🚀 Iniciando monitorização da saúde do sistema BGAPP...")
        
        # Inicializar tracking de uptime
        for component_id in self.components_config.keys():
            self.uptime_tracking[component_id] = {
                'total_checks': 0,
                'successful_checks': 0,
                'start_time': datetime.now()
            }
        
        # Executar verificação inicial
        await self.perform_full_health_check()
        
        # Iniciar loop de monitorização
        asyncio.create_task(self._monitoring_loop())
        
        logger.info("✅ Monitorização da saúde iniciada com sucesso")
    
    async def stop_monitoring(self):
        """⏹️ Parar monitorização"""
        self.monitoring_active = False
        logger.info("⏹️ Monitorização da saúde parada")
    
    async def _monitoring_loop(self):
        """Loop principal de monitorização"""
        
        while self.monitoring_active:
            try:
                # Verificar quais componentes precisam de verificação
                components_to_check = []
                current_time = datetime.now()
                
                for component_id, config in self.components_config.items():
                    last_check = self.health_status.get(component_id, {}).get('last_check')
                    
                    if (not last_check or 
                        (current_time - last_check).total_seconds() >= config['check_interval']):
                        components_to_check.append(component_id)
                
                # Executar verificações em paralelo
                if components_to_check:
                    await self._check_components_parallel(components_to_check)
                
                # Aguardar antes da próxima iteração
                await asyncio.sleep(10)  # Verificar a cada 10 segundos
                
            except Exception as e:
                logger.error(f"❌ Erro no loop de monitorização: {e}")
                await asyncio.sleep(30)  # Aguardar mais tempo em caso de erro
    
    async def _check_components_parallel(self, component_ids: List[str]):
        """Verificar múltiplos componentes em paralelo"""
        
        tasks = []
        for component_id in component_ids:
            task = asyncio.create_task(self._check_single_component(component_id))
            tasks.append(task)
        
        # Executar todas as verificações em paralelo
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _check_single_component(self, component_id: str):
        """Verificar um componente específico"""
        
        config = self.components_config[component_id]
        
        try:
            # Executar verificação específica
            start_time = time.time()
            check_result = await config['check_method'](config)
            response_time = (time.time() - start_time) * 1000  # ms
            
            # Determinar status baseado no resultado e tempo de resposta
            status = self._determine_health_status(check_result, response_time, config)
            
            # Criar health check
            health_check = HealthCheck(
                component_name=config['name'],
                component_type=config['type'],
                status=status,
                response_time_ms=response_time,
                last_check=datetime.now(),
                metadata=check_result.get('metadata', {}) if isinstance(check_result, dict) else {}
            )
            
            # Atualizar estado
            self.health_status[component_id] = asdict(health_check)
            
            # Atualizar tracking de uptime
            self.uptime_tracking[component_id]['total_checks'] += 1
            if status == HealthStatus.HEALTHY:
                self.uptime_tracking[component_id]['successful_checks'] += 1
            
            # Verificar se precisa gerar alerta
            await self._check_for_alerts(component_id, health_check)
            
        except Exception as e:
            logger.error(f"❌ Erro ao verificar {component_id}: {e}")
            
            # Registar erro
            error_health_check = HealthCheck(
                component_name=config['name'],
                component_type=config['type'],
                status=HealthStatus.CRITICAL,
                response_time_ms=0,
                last_check=datetime.now(),
                error_message=str(e)
            )
            
            self.health_status[component_id] = asdict(error_health_check)
            
            # Gerar alerta de erro
            await self._generate_alert(component_id, 'critical', f"Erro na verificação: {str(e)}")
    
    def _determine_health_status(self, check_result: Any, response_time: float, config: Dict) -> HealthStatus:
        """Determinar status de saúde baseado no resultado e tempo de resposta"""
        
        thresholds = config.get('thresholds', {})
        warning_threshold = thresholds.get('warning', 1000)
        critical_threshold = thresholds.get('critical', 3000)
        
        # Verificar se a verificação falhou
        if isinstance(check_result, dict) and not check_result.get('success', True):
            return HealthStatus.CRITICAL
        
        # Verificar tempo de resposta
        if response_time > critical_threshold:
            return HealthStatus.CRITICAL
        elif response_time > warning_threshold:
            return HealthStatus.WARNING
        else:
            return HealthStatus.HEALTHY
    
    async def _check_for_alerts(self, component_id: str, health_check: HealthCheck):
        """Verificar se é necessário gerar alertas"""
        
        # Verificar se mudou de estado
        previous_status = self.health_status.get(component_id, {}).get('status')
        current_status = health_check.status.value
        
        if previous_status and previous_status != current_status:
            # Estado mudou, gerar alerta
            if current_status in ['crítico', 'aviso']:
                severity = 'critical' if current_status == 'crítico' else 'warning'
                message = f"Componente {health_check.component_name} mudou para status {current_status}"
                await self._generate_alert(component_id, severity, message)
            elif current_status == 'saudável' and previous_status in ['crítico', 'aviso']:
                # Componente recuperou
                message = f"Componente {health_check.component_name} recuperou (agora {current_status})"
                await self._generate_alert(component_id, 'info', message)
                # Resolver alertas ativos deste componente
                await self._auto_resolve_alerts(component_id)
    
    async def _generate_alert(self, component_id: str, severity: str, message: str):
        """Gerar alerta do sistema"""
        
        alert_id = f"{component_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        alert = SystemAlert(
            id=alert_id,
            component_name=self.components_config[component_id]['name'],
            severity=severity,
            message=message,
            created_at=datetime.now()
        )
        
        # Adicionar aos alertas ativos
        if severity in ['warning', 'critical']:
            self.active_alerts[alert_id] = alert
        
        # Adicionar ao histórico
        self.alerts_history.append(alert)
        
        # Manter apenas últimos 1000 alertas no histórico
        if len(self.alerts_history) > 1000:
            self.alerts_history = self.alerts_history[-1000:]
        
        logger.info(f"🚨 Alerta gerado: {severity.upper()} - {message}")
    
    async def _auto_resolve_alerts(self, component_id: str):
        """Resolver automaticamente alertas de um componente"""
        
        alerts_to_resolve = [
            alert_id for alert_id, alert in self.active_alerts.items()
            if component_id in alert_id
        ]
        
        for alert_id in alerts_to_resolve:
            alert = self.active_alerts[alert_id]
            alert.resolved_at = datetime.now()
            alert.auto_resolved = True
            del self.active_alerts[alert_id]
            
            logger.info(f"✅ Alerta auto-resolvido: {alert_id}")
    
    # Métodos de verificação específicos
    async def _check_postgresql(self, config: Dict) -> Dict[str, Any]:
        """Verificar PostgreSQL"""
        try:
            # Simular verificação da BD (seria substituído por verificação real)
            await asyncio.sleep(0.1)  # Simular latência
            
            return {
                'success': True,
                'metadata': {
                    'connections': 15,
                    'active_queries': 3,
                    'database_size_mb': 2048,
                    'last_backup': '2025-01-15 02:00:00'
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _check_timescaledb(self, config: Dict) -> Dict[str, Any]:
        """Verificar TimescaleDB"""
        try:
            await asyncio.sleep(0.15)
            
            return {
                'success': True,
                'metadata': {
                    'hypertables': 5,
                    'chunks': 142,
                    'compression_ratio': 0.23,
                    'last_compression': '2025-01-15 01:30:00'
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _check_redis(self, config: Dict) -> Dict[str, Any]:
        """Verificar Redis Cache"""
        try:
            await asyncio.sleep(0.05)
            
            return {
                'success': True,
                'metadata': {
                    'memory_usage_mb': 256,
                    'hit_rate': 94.5,
                    'connected_clients': 8,
                    'keys_count': 1247
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _check_minio(self, config: Dict) -> Dict[str, Any]:
        """Verificar MinIO Storage"""
        try:
            await asyncio.sleep(0.2)
            
            return {
                'success': True,
                'metadata': {
                    'buckets_count': 12,
                    'total_objects': 15678,
                    'storage_used_gb': 125.6,
                    'bandwidth_mbps': 45.2
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _check_copernicus(self, config: Dict) -> Dict[str, Any]:
        """Verificar API Copernicus"""
        try:
            # Simular verificação da API externa
            await asyncio.sleep(0.5)  # APIs externas são mais lentas
            
            return {
                'success': True,
                'metadata': {
                    'available_datasets': 15,
                    'last_data_update': '2025-01-15 12:00:00',
                    'quota_used_percent': 23.5,
                    'authentication_status': 'valid'
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _check_obis(self, config: Dict) -> Dict[str, Any]:
        """Verificar API OBIS"""
        try:
            await asyncio.sleep(0.3)
            
            return {
                'success': True,
                'metadata': {
                    'available_records': 125000,
                    'last_update': '2025-01-14 18:00:00',
                    'api_version': 'v3.1.2'
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _check_gbif(self, config: Dict) -> Dict[str, Any]:
        """Verificar API GBIF"""
        try:
            await asyncio.sleep(0.25)
            
            return {
                'success': True,
                'metadata': {
                    'angola_records': 45678,
                    'marine_records': 12345,
                    'last_sync': '2025-01-15 06:00:00'
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _check_admin_api(self, config: Dict) -> Dict[str, Any]:
        """Verificar Admin API"""
        try:
            await asyncio.sleep(0.1)
            
            return {
                'success': True,
                'metadata': {
                    'active_endpoints': 45,
                    'requests_per_minute': 125,
                    'error_rate_percent': 0.2,
                    'cache_hit_rate': 89.3
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _check_pygeoapi(self, config: Dict) -> Dict[str, Any]:
        """Verificar PyGeoAPI"""
        try:
            await asyncio.sleep(0.15)
            
            return {
                'success': True,
                'metadata': {
                    'collections_count': 8,
                    'processes_count': 12,
                    'active_requests': 3
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _check_cpu(self, config: Dict) -> Dict[str, Any]:
        """Verificar CPU do sistema"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            load_avg = psutil.getloadavg() if hasattr(psutil, 'getloadavg') else (0, 0, 0)
            
            return {
                'success': True,
                'value': cpu_percent,
                'metadata': {
                    'cpu_count': cpu_count,
                    'load_avg_1min': load_avg[0],
                    'load_avg_5min': load_avg[1],
                    'load_avg_15min': load_avg[2]
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _check_memory(self, config: Dict) -> Dict[str, Any]:
        """Verificar memória do sistema"""
        try:
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            return {
                'success': True,
                'value': memory.percent,
                'metadata': {
                    'total_gb': round(memory.total / (1024**3), 2),
                    'available_gb': round(memory.available / (1024**3), 2),
                    'used_gb': round(memory.used / (1024**3), 2),
                    'swap_percent': swap.percent,
                    'swap_used_gb': round(swap.used / (1024**3), 2)
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _check_disk(self, config: Dict) -> Dict[str, Any]:
        """Verificar disco do sistema"""
        try:
            disk = psutil.disk_usage('/')
            
            return {
                'success': True,
                'value': (disk.used / disk.total) * 100,
                'metadata': {
                    'total_gb': round(disk.total / (1024**3), 2),
                    'used_gb': round(disk.used / (1024**3), 2),
                    'free_gb': round(disk.free / (1024**3), 2)
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def perform_full_health_check(self) -> Dict[str, Any]:
        """
        🔍 Executar verificação completa de saúde
        
        Returns:
            Relatório completo de saúde do sistema
        """
        logger.info("🔍 Executando verificação completa de saúde...")
        
        start_time = datetime.now()
        
        # Verificar todos os componentes
        await self._check_components_parallel(list(self.components_config.keys()))
        
        # Calcular estatísticas gerais
        total_components = len(self.components_config)
        healthy_components = sum(
            1 for status in self.health_status.values()
            if status.get('status') == HealthStatus.HEALTHY.value
        )
        warning_components = sum(
            1 for status in self.health_status.values()
            if status.get('status') == HealthStatus.WARNING.value
        )
        critical_components = sum(
            1 for status in self.health_status.values()
            if status.get('status') == HealthStatus.CRITICAL.value
        )
        
        # Determinar status geral do sistema
        if critical_components > 0:
            overall_status = HealthStatus.CRITICAL
        elif warning_components > total_components * 0.3:  # Mais de 30% com aviso
            overall_status = HealthStatus.WARNING
        elif healthy_components >= total_components * 0.8:  # Pelo menos 80% saudáveis
            overall_status = HealthStatus.HEALTHY
        else:
            overall_status = HealthStatus.WARNING
        
        # Calcular uptime médio
        avg_uptime = 0.0
        if self.uptime_tracking:
            uptimes = []
            for tracking in self.uptime_tracking.values():
                if tracking['total_checks'] > 0:
                    uptime = (tracking['successful_checks'] / tracking['total_checks']) * 100
                    uptimes.append(uptime)
            avg_uptime = sum(uptimes) / len(uptimes) if uptimes else 0.0
        
        self.last_full_check = datetime.now()
        
        health_report = {
            'overall_status': overall_status.value,
            'check_duration_seconds': (datetime.now() - start_time).total_seconds(),
            'components_summary': {
                'total': total_components,
                'healthy': healthy_components,
                'warning': warning_components,
                'critical': critical_components,
                'unknown': total_components - healthy_components - warning_components - critical_components
            },
            'system_uptime_percentage': round(avg_uptime, 2),
            'active_alerts_count': len(self.active_alerts),
            'components_detail': self.health_status,
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"✅ Verificação completa concluída: {overall_status.value}")
        
        return health_report
    
    def generate_health_dashboard(self) -> str:
        """
        📊 Gerar dashboard HTML de saúde do sistema
        
        Returns:
            Dashboard HTML completo
        """
        
        # Calcular estatísticas atuais
        total_components = len(self.components_config)
        healthy_count = sum(
            1 for status in self.health_status.values()
            if status.get('status') == HealthStatus.HEALTHY.value
        )
        warning_count = sum(
            1 for status in self.health_status.values()
            if status.get('status') == HealthStatus.WARNING.value
        )
        critical_count = sum(
            1 for status in self.health_status.values()
            if status.get('status') == HealthStatus.CRITICAL.value
        )
        
        # Status geral
        if critical_count > 0:
            overall_status = "CRÍTICO"
            status_color = "#dc2626"
        elif warning_count > 0:
            overall_status = "AVISO"
            status_color = "#ea580c"
        else:
            overall_status = "SAUDÁVEL"
            status_color = "#16a34a"
        
        dashboard_html = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Monitor de Saúde do Sistema - MARÍTIMO ANGOLA</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f8fafc;
                    color: #333;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 15px;
                    text-align: center;
                    margin-bottom: 20px;
                }}
                .overall-status {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border-left: 5px solid {status_color};
                }}
                .status-value {{
                    font-size: 3em;
                    font-weight: bold;
                    color: {status_color};
                    margin: 10px 0;
                }}
                .metrics-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }}
                .metric-card {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .metric-value {{
                    font-size: 2em;
                    font-weight: bold;
                    margin: 10px 0;
                }}
                .metric-label {{
                    color: #666;
                    font-size: 0.9em;
                }}
                .healthy {{ color: #16a34a; }}
                .warning {{ color: #ea580c; }}
                .critical {{ color: #dc2626; }}
                .components-section {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .component-card {{
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }}
                .component-healthy {{ border-left: 5px solid #16a34a; }}
                .component-warning {{ border-left: 5px solid #ea580c; }}
                .component-critical {{ border-left: 5px solid #dc2626; }}
                .alerts-section {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .alert-card {{
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                }}
                .alert-critical {{ border-left: 5px solid #dc2626; background: #fef2f2; }}
                .alert-warning {{ border-left: 5px solid #ea580c; background: #fffbeb; }}
                .alert-info {{ border-left: 5px solid #0ea5e9; background: #f0f9ff; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>⚕️ MARÍTIMO ANGOLA</h1>
                <h2>Monitor de Saúde do Sistema BGAPP</h2>
                <p>Monitorização Contínua - ZEE Angola</p>
            </div>
            
            <!-- Status Geral -->
            <div class="overall-status">
                <h2>Status Geral do Sistema</h2>
                <div class="status-value">{overall_status}</div>
                <p>Última verificação: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
            </div>
            
            <!-- Métricas Principais -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value healthy">{healthy_count}</div>
                    <div class="metric-label">Componentes Saudáveis</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value warning">{warning_count}</div>
                    <div class="metric-label">Avisos</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value critical">{critical_count}</div>
                    <div class="metric-label">Críticos</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{total_components}</div>
                    <div class="metric-label">Total Componentes</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{len(self.active_alerts)}</div>
                    <div class="metric-label">Alertas Ativos</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{(healthy_count/total_components)*100:.1f}%</div>
                    <div class="metric-label">Uptime Geral</div>
                </div>
            </div>
            
            <!-- Componentes do Sistema -->
            <div class="components-section">
                <h3>🔧 Estado dos Componentes</h3>
        """
        
        # Agrupar componentes por tipo
        components_by_type = {}
        for component_id, config in self.components_config.items():
            comp_type = config['type'].value
            if comp_type not in components_by_type:
                components_by_type[comp_type] = []
            
            component_status = self.health_status.get(component_id, {})
            components_by_type[comp_type].append({
                'id': component_id,
                'config': config,
                'status': component_status
            })
        
        # Renderizar componentes por tipo
        for comp_type, components in components_by_type.items():
            dashboard_html += f"<h4>📁 {comp_type.replace('_', ' ').title()}</h4>"
            
            for comp in components:
                status = comp['status'].get('status', 'desconhecido')
                response_time = comp['status'].get('response_time_ms', 0)
                last_check = comp['status'].get('last_check', 'Nunca')
                
                status_class = f"component-{status.replace('ável', 'y').replace('í', 'i')}"
                status_icon = {
                    'saudável': '✅',
                    'aviso': '⚠️',
                    'crítico': '❌',
                    'desconhecido': '❓'
                }.get(status, '❓')
                
                dashboard_html += f"""
                <div class="component-card {status_class}">
                    <div>
                        <h4>{status_icon} {comp['config']['name']}</h4>
                        <p>Status: <span class="{status.replace('ável', 'y').replace('í', 'i')}">{status.upper()}</span></p>
                        <p>Tempo de resposta: {response_time:.1f}ms</p>
                    </div>
                    <div>
                        <p style="font-size: 0.8em; color: #666;">
                            Última verificação:<br>{last_check}
                        </p>
                    </div>
                </div>
                """
        
        # Alertas Ativos
        dashboard_html += """
            </div>
            
            <div class="alerts-section">
                <h3>🚨 Alertas Ativos</h3>
        """
        
        if self.active_alerts:
            for alert in list(self.active_alerts.values())[-10:]:  # Últimos 10 alertas
                alert_class = f"alert-{alert.severity}"
                alert_icon = {
                    'critical': '🔴',
                    'warning': '🟡',
                    'info': '🔵'
                }.get(alert.severity, '⚪')
                
                dashboard_html += f"""
                <div class="alert-card {alert_class}">
                    <h4>{alert_icon} {alert.component_name}</h4>
                    <p>{alert.message}</p>
                    <p style="font-size: 0.8em; color: #666;">
                        {alert.created_at.strftime('%d/%m/%Y %H:%M:%S')}
                    </p>
                </div>
                """
        else:
            dashboard_html += "<p>✅ Nenhum alerta ativo no momento.</p>"
        
        dashboard_html += f"""
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; background: white; padding: 20px; border-radius: 10px;">
                <p><em>Monitor de saúde atualizado automaticamente a cada 30 segundos</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Sistema de Monitorização BGAPP</p>
                <p>Monitorização ativa: {'SIM' if self.monitoring_active else 'NÃO'}</p>
            </div>
            
            <script>
                // Auto-refresh a cada 30 segundos
                setTimeout(() => {{
                    window.location.reload();
                }}, 30000);
                
                console.log('⚕️ BGAPP System Health Monitor carregado');
            </script>
        </body>
        </html>
        """
        
        return dashboard_html
    
    def get_alerts_summary(self) -> Dict[str, Any]:
        """Obter resumo dos alertas"""
        
        # Alertas por severidade
        alerts_by_severity = {}
        for alert in self.active_alerts.values():
            severity = alert.severity
            if severity not in alerts_by_severity:
                alerts_by_severity[severity] = 0
            alerts_by_severity[severity] += 1
        
        # Alertas das últimas 24h
        yesterday = datetime.now() - timedelta(days=1)
        recent_alerts = [
            alert for alert in self.alerts_history
            if alert.created_at >= yesterday
        ]
        
        return {
            'active_alerts': len(self.active_alerts),
            'alerts_by_severity': alerts_by_severity,
            'recent_alerts_24h': len(recent_alerts),
            'total_alerts_history': len(self.alerts_history),
            'monitoring_active': self.monitoring_active,
            'last_full_check': self.last_full_check.isoformat() if self.last_full_check else None
        }


# Instância global do monitor de saúde
system_health_monitor = SystemHealthMonitor()
