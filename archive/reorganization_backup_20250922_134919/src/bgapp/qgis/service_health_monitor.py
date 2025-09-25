"""
Service Health Monitoring System for QGIS Integration
Sistema de monitorização contínua da saúde dos serviços QGIS
"""

import json
import time
import asyncio
import aiohttp
import psutil
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import queue

logger = logging.getLogger(__name__)


class ServiceStatus(Enum):
    """Status dos serviços"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class HealthCheckType(Enum):
    """Tipos de verificação de saúde"""
    HTTP_ENDPOINT = "http_endpoint"
    DATABASE_QUERY = "database_query"
    FILE_SYSTEM = "file_system"
    MEMORY_USAGE = "memory_usage"
    CPU_USAGE = "cpu_usage"
    DISK_SPACE = "disk_space"
    PROCESS_STATUS = "process_status"


@dataclass
class HealthMetric:
    """Métrica de saúde individual"""
    name: str
    value: float
    unit: str
    threshold_warning: float
    threshold_critical: float
    status: ServiceStatus
    timestamp: datetime
    metadata: Dict[str, Any] = None


@dataclass
class ServiceHealthCheck:
    """Configuração de verificação de saúde de um serviço"""
    service_name: str
    check_type: HealthCheckType
    endpoint_url: Optional[str] = None
    check_interval_seconds: int = 60
    timeout_seconds: int = 10
    expected_response: Optional[str] = None
    thresholds: Dict[str, float] = None
    enabled: bool = True


@dataclass
class ServiceHealthReport:
    """Relatório de saúde de um serviço"""
    service_name: str
    overall_status: ServiceStatus
    last_check: datetime
    response_time_ms: float
    metrics: List[HealthMetric]
    errors: List[str]
    uptime_percentage: float
    metadata: Dict[str, Any] = None


class ServiceHealthMonitor:
    """
    Monitor de saúde dos serviços QGIS e infraestrutura BGAPP
    Monitorização contínua, alertas e relatórios de saúde
    """
    
    def __init__(self):
        # Configurações de monitorização
        self.monitoring_enabled = True
        self.check_interval = 30  # segundos
        self.history_retention_days = 7
        
        # Fila de eventos de saúde
        self.health_events_queue = queue.Queue()
        
        # Histórico de métricas
        self.metrics_history = {}
        
        # Callbacks para alertas
        self.alert_callbacks: List[Callable] = []
        
        # Thread de monitorização
        self.monitoring_thread = None
        self.stop_monitoring = threading.Event()
        
        # Configurações dos serviços BGAPP
        self.service_configs = {
            'admin_api': ServiceHealthCheck(
                service_name='admin_api',
                check_type=HealthCheckType.HTTP_ENDPOINT,
                endpoint_url='http://localhost:8000/health',
                check_interval_seconds=30,
                timeout_seconds=5,
                thresholds={'response_time_ms': 1000, 'cpu_usage': 80, 'memory_usage': 85}
            ),
            'stac_api': ServiceHealthCheck(
                service_name='stac_api',
                check_type=HealthCheckType.HTTP_ENDPOINT,
                endpoint_url='http://localhost:8081/',
                check_interval_seconds=60,
                timeout_seconds=10,
                thresholds={'response_time_ms': 2000}
            ),
            'pygeoapi': ServiceHealthCheck(
                service_name='pygeoapi',
                check_type=HealthCheckType.HTTP_ENDPOINT,
                endpoint_url='http://localhost:5080/',
                check_interval_seconds=60,
                timeout_seconds=10,
                thresholds={'response_time_ms': 3000}
            ),
            'postgis': ServiceHealthCheck(
                service_name='postgis',
                check_type=HealthCheckType.DATABASE_QUERY,
                check_interval_seconds=120,
                timeout_seconds=15,
                thresholds={'response_time_ms': 5000, 'connections': 80}
            ),
            'minio': ServiceHealthCheck(
                service_name='minio',
                check_type=HealthCheckType.HTTP_ENDPOINT,
                endpoint_url='http://localhost:9000/minio/health/live',
                check_interval_seconds=60,
                timeout_seconds=10,
                thresholds={'response_time_ms': 2000}
            ),
            'redis': ServiceHealthCheck(
                service_name='redis',
                check_type=HealthCheckType.PROCESS_STATUS,
                check_interval_seconds=60,
                thresholds={'memory_usage_mb': 256, 'cpu_usage': 50}
            ),
            'system_resources': ServiceHealthCheck(
                service_name='system_resources',
                check_type=HealthCheckType.MEMORY_USAGE,
                check_interval_seconds=30,
                thresholds={
                    'memory_usage_percent': 85,
                    'cpu_usage_percent': 80,
                    'disk_usage_percent': 90
                }
            )
        }
        
        # Métricas QGIS específicas
        self.qgis_metrics = {
            'temporal_visualization_performance': {
                'description': 'Performance da visualização temporal',
                'unit': 'ms',
                'warning_threshold': 5000,
                'critical_threshold': 10000
            },
            'spatial_analysis_memory': {
                'description': 'Uso de memória em análises espaciais',
                'unit': 'MB',
                'warning_threshold': 1024,
                'critical_threshold': 2048
            },
            'biomass_calculation_accuracy': {
                'description': 'Precisão dos cálculos de biomassa',
                'unit': 'percentage',
                'warning_threshold': 85,
                'critical_threshold': 75
            },
            'migration_overlay_latency': {
                'description': 'Latência da sobreposição de migração',
                'unit': 'ms',
                'warning_threshold': 3000,
                'critical_threshold': 6000
            },
            'mcda_processing_time': {
                'description': 'Tempo de processamento MCDA',
                'unit': 'seconds',
                'warning_threshold': 60,
                'critical_threshold': 120
            }
        }
    
    def start_monitoring(self) -> bool:
        """Iniciar monitorização contínua"""
        try:
            if self.monitoring_thread and self.monitoring_thread.is_alive():
                logger.warning("Monitorização já está ativa")
                return False
            
            self.stop_monitoring.clear()
            self.monitoring_thread = threading.Thread(
                target=self._monitoring_loop,
                daemon=True
            )
            self.monitoring_thread.start()
            
            logger.info("Monitorização de saúde iniciada")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao iniciar monitorização: {e}")
            return False
    
    def stop_monitoring_services(self) -> bool:
        """Parar monitorização"""
        try:
            self.stop_monitoring.set()
            
            if self.monitoring_thread:
                self.monitoring_thread.join(timeout=5)
            
            logger.info("Monitorização de saúde parada")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao parar monitorização: {e}")
            return False
    
    def _monitoring_loop(self):
        """Loop principal de monitorização"""
        logger.info("Loop de monitorização iniciado")
        
        while not self.stop_monitoring.is_set():
            try:
                # Verificar saúde de todos os serviços
                for service_name, config in self.service_configs.items():
                    if not config.enabled:
                        continue
                    
                    try:
                        health_report = self._check_service_health(config)
                        self._process_health_report(health_report)
                        
                    except Exception as e:
                        logger.error(f"Erro na verificação de {service_name}: {e}")
                        continue
                
                # Verificar métricas QGIS específicas
                self._check_qgis_metrics()
                
                # Limpar histórico antigo
                self._cleanup_old_metrics()
                
                # Aguardar próximo ciclo
                self.stop_monitoring.wait(self.check_interval)
                
            except Exception as e:
                logger.error(f"Erro no loop de monitorização: {e}")
                self.stop_monitoring.wait(10)  # Aguardar 10s antes de tentar novamente
    
    def _check_service_health(self, config: ServiceHealthCheck) -> ServiceHealthReport:
        """Verificar saúde de um serviço específico"""
        start_time = time.time()
        metrics = []
        errors = []
        overall_status = ServiceStatus.UNKNOWN
        
        try:
            if config.check_type == HealthCheckType.HTTP_ENDPOINT:
                status, response_time, error = self._check_http_endpoint(config)
                
                if error:
                    errors.append(error)
                    overall_status = ServiceStatus.UNHEALTHY
                else:
                    # Verificar thresholds de tempo de resposta
                    threshold = config.thresholds.get('response_time_ms', 5000)
                    if response_time > threshold:
                        overall_status = ServiceStatus.DEGRADED
                    else:
                        overall_status = ServiceStatus.HEALTHY
                
                metrics.append(HealthMetric(
                    name='response_time',
                    value=response_time,
                    unit='ms',
                    threshold_warning=threshold * 0.8,
                    threshold_critical=threshold,
                    status=ServiceStatus.HEALTHY if response_time < threshold else ServiceStatus.DEGRADED,
                    timestamp=datetime.now()
                ))
            
            elif config.check_type == HealthCheckType.DATABASE_QUERY:
                status, query_time, error = self._check_database_health(config)
                
                if error:
                    errors.append(error)
                    overall_status = ServiceStatus.UNHEALTHY
                else:
                    threshold = config.thresholds.get('response_time_ms', 10000)
                    overall_status = ServiceStatus.HEALTHY if query_time < threshold else ServiceStatus.DEGRADED
                
                metrics.append(HealthMetric(
                    name='query_time',
                    value=query_time,
                    unit='ms',
                    threshold_warning=threshold * 0.8,
                    threshold_critical=threshold,
                    status=ServiceStatus.HEALTHY if query_time < threshold else ServiceStatus.DEGRADED,
                    timestamp=datetime.now()
                ))
            
            elif config.check_type == HealthCheckType.MEMORY_USAGE:
                system_metrics = self._check_system_resources()
                metrics.extend(system_metrics)
                
                # Determinar status geral baseado nas métricas
                critical_metrics = [m for m in system_metrics if m.status == ServiceStatus.UNHEALTHY]
                degraded_metrics = [m for m in system_metrics if m.status == ServiceStatus.DEGRADED]
                
                if critical_metrics:
                    overall_status = ServiceStatus.UNHEALTHY
                elif degraded_metrics:
                    overall_status = ServiceStatus.DEGRADED
                else:
                    overall_status = ServiceStatus.HEALTHY
            
            elif config.check_type == HealthCheckType.PROCESS_STATUS:
                process_metrics, process_errors = self._check_process_status(config)
                metrics.extend(process_metrics)
                errors.extend(process_errors)
                
                if process_errors:
                    overall_status = ServiceStatus.UNHEALTHY
                else:
                    overall_status = ServiceStatus.HEALTHY
            
            # Calcular uptime (simplificado)
            uptime_percentage = self._calculate_uptime(config.service_name)
            
        except Exception as e:
            errors.append(f"Erro na verificação: {str(e)}")
            overall_status = ServiceStatus.UNHEALTHY
            uptime_percentage = 0.0
        
        response_time_ms = (time.time() - start_time) * 1000
        
        return ServiceHealthReport(
            service_name=config.service_name,
            overall_status=overall_status,
            last_check=datetime.now(),
            response_time_ms=response_time_ms,
            metrics=metrics,
            errors=errors,
            uptime_percentage=uptime_percentage,
            metadata={'check_type': config.check_type.value}
        )
    
    def _check_http_endpoint(self, config: ServiceHealthCheck) -> tuple:
        """Verificar endpoint HTTP"""
        try:
            import requests
            
            start_time = time.time()
            response = requests.get(
                config.endpoint_url,
                timeout=config.timeout_seconds
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                return True, response_time, None
            else:
                return False, response_time, f"HTTP {response.status_code}"
                
        except requests.exceptions.Timeout:
            return False, config.timeout_seconds * 1000, "Timeout"
        except requests.exceptions.ConnectionError:
            return False, 0, "Connection refused"
        except Exception as e:
            return False, 0, str(e)
    
    def _check_database_health(self, config: ServiceHealthCheck) -> tuple:
        """Verificar saúde da base de dados"""
        try:
            import psycopg2
            
            start_time = time.time()
            
            # Tentar conexão simples
            conn = psycopg2.connect(
                host='localhost',
                port=5432,
                database='geo',
                user='postgres',
                password='postgres',
                connect_timeout=config.timeout_seconds
            )
            
            # Executar query simples
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            conn.close()
            
            query_time = (time.time() - start_time) * 1000
            return True, query_time, None
            
        except Exception as e:
            return False, 0, str(e)
    
    def _check_system_resources(self) -> List[HealthMetric]:
        """Verificar recursos do sistema"""
        metrics = []
        
        try:
            # Uso de memória
            memory = psutil.virtual_memory()
            memory_metric = HealthMetric(
                name='memory_usage',
                value=memory.percent,
                unit='percent',
                threshold_warning=80.0,
                threshold_critical=90.0,
                status=self._determine_status(memory.percent, 80.0, 90.0),
                timestamp=datetime.now(),
                metadata={'available_gb': memory.available / (1024**3)}
            )
            metrics.append(memory_metric)
            
            # Uso de CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_metric = HealthMetric(
                name='cpu_usage',
                value=cpu_percent,
                unit='percent',
                threshold_warning=75.0,
                threshold_critical=90.0,
                status=self._determine_status(cpu_percent, 75.0, 90.0),
                timestamp=datetime.now(),
                metadata={'cpu_count': psutil.cpu_count()}
            )
            metrics.append(cpu_metric)
            
            # Uso de disco
            disk = psutil.disk_usage('/')
            disk_metric = HealthMetric(
                name='disk_usage',
                value=disk.percent,
                unit='percent',
                threshold_warning=80.0,
                threshold_critical=95.0,
                status=self._determine_status(disk.percent, 80.0, 95.0),
                timestamp=datetime.now(),
                metadata={'free_gb': disk.free / (1024**3)}
            )
            metrics.append(disk_metric)
            
        except Exception as e:
            logger.error(f"Erro ao verificar recursos do sistema: {e}")
        
        return metrics
    
    def _check_process_status(self, config: ServiceHealthCheck) -> tuple:
        """Verificar status de processo"""
        metrics = []
        errors = []
        
        try:
            # Procurar processo Redis
            redis_processes = []
            for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'cpu_percent']):
                try:
                    if 'redis' in proc.info['name'].lower():
                        redis_processes.append(proc)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            if not redis_processes:
                errors.append("Processo Redis não encontrado")
            else:
                # Métricas do processo Redis
                for proc in redis_processes:
                    try:
                        memory_mb = proc.info['memory_info'].rss / (1024 * 1024)
                        cpu_percent = proc.info['cpu_percent'] or 0
                        
                        memory_threshold = config.thresholds.get('memory_usage_mb', 512)
                        cpu_threshold = config.thresholds.get('cpu_usage', 80)
                        
                        metrics.append(HealthMetric(
                            name='redis_memory',
                            value=memory_mb,
                            unit='MB',
                            threshold_warning=memory_threshold * 0.8,
                            threshold_critical=memory_threshold,
                            status=self._determine_status(memory_mb, memory_threshold * 0.8, memory_threshold),
                            timestamp=datetime.now(),
                            metadata={'pid': proc.info['pid']}
                        ))
                        
                        metrics.append(HealthMetric(
                            name='redis_cpu',
                            value=cpu_percent,
                            unit='percent',
                            threshold_warning=cpu_threshold * 0.8,
                            threshold_critical=cpu_threshold,
                            status=self._determine_status(cpu_percent, cpu_threshold * 0.8, cpu_threshold),
                            timestamp=datetime.now(),
                            metadata={'pid': proc.info['pid']}
                        ))
                        
                    except Exception as e:
                        errors.append(f"Erro ao obter métricas do Redis: {e}")
            
        except Exception as e:
            errors.append(f"Erro na verificação de processo: {e}")
        
        return metrics, errors
    
    def _check_qgis_metrics(self):
        """Verificar métricas específicas das funcionalidades QGIS"""
        try:
            # Simular verificação de performance das funcionalidades QGIS
            # Em produção, estas métricas viriam das próprias funções
            
            for metric_name, metric_config in self.qgis_metrics.items():
                # Simular valor da métrica
                if 'performance' in metric_name or 'latency' in metric_name or 'time' in metric_name:
                    # Métricas de tempo - simular valores realistas
                    base_value = metric_config['warning_threshold'] * 0.6
                    simulated_value = base_value + (base_value * 0.3 * (time.time() % 10) / 10)
                elif 'memory' in metric_name:
                    # Métricas de memória
                    base_value = metric_config['warning_threshold'] * 0.7
                    simulated_value = base_value + (base_value * 0.2 * (time.time() % 8) / 8)
                elif 'accuracy' in metric_name:
                    # Métricas de precisão (inversa - maior é melhor)
                    simulated_value = 90 + (5 * (time.time() % 6) / 6)
                else:
                    simulated_value = metric_config['warning_threshold'] * 0.5
                
                # Determinar status
                if 'accuracy' in metric_name:
                    # Para precisão, menor valor é pior
                    status = self._determine_status_inverse(
                        simulated_value, 
                        metric_config['warning_threshold'],
                        metric_config['critical_threshold']
                    )
                else:
                    status = self._determine_status(
                        simulated_value,
                        metric_config['warning_threshold'],
                        metric_config['critical_threshold']
                    )
                
                metric = HealthMetric(
                    name=metric_name,
                    value=simulated_value,
                    unit=metric_config['unit'],
                    threshold_warning=metric_config['warning_threshold'],
                    threshold_critical=metric_config['critical_threshold'],
                    status=status,
                    timestamp=datetime.now(),
                    metadata={'category': 'qgis_functionality'}
                )
                
                # Armazenar no histórico
                if metric_name not in self.metrics_history:
                    self.metrics_history[metric_name] = []
                
                self.metrics_history[metric_name].append(metric)
                
                # Manter apenas últimos 1000 pontos
                if len(self.metrics_history[metric_name]) > 1000:
                    self.metrics_history[metric_name] = self.metrics_history[metric_name][-1000:]
                
                # Gerar alerta se necessário
                if status in [ServiceStatus.DEGRADED, ServiceStatus.UNHEALTHY]:
                    self._trigger_alert(metric_name, metric, status)
                    
        except Exception as e:
            logger.error(f"Erro na verificação de métricas QGIS: {e}")
    
    def _determine_status(self, value: float, warning_threshold: float, critical_threshold: float) -> ServiceStatus:
        """Determinar status baseado nos thresholds"""
        if value >= critical_threshold:
            return ServiceStatus.UNHEALTHY
        elif value >= warning_threshold:
            return ServiceStatus.DEGRADED
        else:
            return ServiceStatus.HEALTHY
    
    def _determine_status_inverse(self, value: float, warning_threshold: float, critical_threshold: float) -> ServiceStatus:
        """Determinar status inverso (para métricas onde menor é pior)"""
        if value <= critical_threshold:
            return ServiceStatus.UNHEALTHY
        elif value <= warning_threshold:
            return ServiceStatus.DEGRADED
        else:
            return ServiceStatus.HEALTHY
    
    def _calculate_uptime(self, service_name: str) -> float:
        """Calcular uptime do serviço (simplificado)"""
        # Em produção, calcular baseado no histórico real
        # Por agora, simular uptime baseado no tempo
        base_uptime = 95.0 + (4.0 * (hash(service_name) % 100) / 100)
        return min(99.99, base_uptime)
    
    def _process_health_report(self, report: ServiceHealthReport):
        """Processar relatório de saúde"""
        # Armazenar no histórico
        service_name = report.service_name
        if service_name not in self.metrics_history:
            self.metrics_history[service_name] = []
        
        # Converter relatório para entrada do histórico
        history_entry = {
            'timestamp': report.last_check,
            'status': report.overall_status,
            'response_time_ms': report.response_time_ms,
            'uptime_percentage': report.uptime_percentage,
            'metrics': [asdict(m) for m in report.metrics],
            'errors': report.errors
        }
        
        self.metrics_history[service_name].append(history_entry)
        
        # Manter apenas últimos 1000 pontos
        if len(self.metrics_history[service_name]) > 1000:
            self.metrics_history[service_name] = self.metrics_history[service_name][-1000:]
        
        # Gerar alertas se necessário
        if report.overall_status in [ServiceStatus.DEGRADED, ServiceStatus.UNHEALTHY]:
            self._trigger_service_alert(report)
        
        # Adicionar à fila de eventos
        try:
            self.health_events_queue.put_nowait({
                'type': 'health_report',
                'service': service_name,
                'status': report.overall_status.value,
                'timestamp': report.last_check.isoformat(),
                'data': asdict(report)
            })
        except queue.Full:
            logger.warning("Fila de eventos de saúde cheia")
    
    def _trigger_alert(self, metric_name: str, metric: HealthMetric, status: ServiceStatus):
        """Disparar alerta para métrica"""
        alert_data = {
            'type': 'metric_alert',
            'metric_name': metric_name,
            'value': metric.value,
            'unit': metric.unit,
            'status': status.value,
            'threshold_warning': metric.threshold_warning,
            'threshold_critical': metric.threshold_critical,
            'timestamp': metric.timestamp.isoformat()
        }
        
        # Chamar callbacks de alerta
        for callback in self.alert_callbacks:
            try:
                callback(alert_data)
            except Exception as e:
                logger.error(f"Erro no callback de alerta: {e}")
        
        logger.warning(f"Alerta de métrica: {metric_name} = {metric.value} {metric.unit} (Status: {status.value})")
    
    def _trigger_service_alert(self, report: ServiceHealthReport):
        """Disparar alerta para serviço"""
        alert_data = {
            'type': 'service_alert',
            'service_name': report.service_name,
            'status': report.overall_status.value,
            'response_time_ms': report.response_time_ms,
            'uptime_percentage': report.uptime_percentage,
            'errors': report.errors,
            'timestamp': report.last_check.isoformat()
        }
        
        # Chamar callbacks de alerta
        for callback in self.alert_callbacks:
            try:
                callback(alert_data)
            except Exception as e:
                logger.error(f"Erro no callback de alerta: {e}")
        
        logger.warning(f"Alerta de serviço: {report.service_name} está {report.overall_status.value}")
    
    def _cleanup_old_metrics(self):
        """Limpar métricas antigas"""
        cutoff_date = datetime.now() - timedelta(days=self.history_retention_days)
        
        for service_name in list(self.metrics_history.keys()):
            if service_name in self.metrics_history:
                # Filtrar entradas antigas
                self.metrics_history[service_name] = [
                    entry for entry in self.metrics_history[service_name]
                    if entry.get('timestamp', datetime.now()) > cutoff_date
                ]
                
                # Remover serviços sem dados
                if not self.metrics_history[service_name]:
                    del self.metrics_history[service_name]
    
    def get_current_health_status(self) -> Dict[str, Any]:
        """Obter status atual de saúde de todos os serviços"""
        current_status = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': ServiceStatus.HEALTHY.value,
            'services': {},
            'qgis_metrics': {},
            'system_summary': {}
        }
        
        unhealthy_services = 0
        degraded_services = 0
        total_services = 0
        
        # Status dos serviços
        for service_name in self.service_configs.keys():
            if service_name in self.metrics_history and self.metrics_history[service_name]:
                latest_entry = self.metrics_history[service_name][-1]
                service_status = latest_entry.get('status', ServiceStatus.UNKNOWN.value)
                
                current_status['services'][service_name] = {
                    'status': service_status,
                    'last_check': latest_entry.get('timestamp', datetime.now()).isoformat() if isinstance(latest_entry.get('timestamp'), datetime) else latest_entry.get('timestamp'),
                    'response_time_ms': latest_entry.get('response_time_ms', 0),
                    'uptime_percentage': latest_entry.get('uptime_percentage', 0),
                    'errors': latest_entry.get('errors', [])
                }
                
                if service_status == ServiceStatus.UNHEALTHY.value:
                    unhealthy_services += 1
                elif service_status == ServiceStatus.DEGRADED.value:
                    degraded_services += 1
                
                total_services += 1
            else:
                current_status['services'][service_name] = {
                    'status': ServiceStatus.UNKNOWN.value,
                    'last_check': None,
                    'response_time_ms': 0,
                    'uptime_percentage': 0,
                    'errors': ['No data available']
                }
        
        # Status das métricas QGIS
        for metric_name in self.qgis_metrics.keys():
            if metric_name in self.metrics_history and self.metrics_history[metric_name]:
                latest_metric = self.metrics_history[metric_name][-1]
                current_status['qgis_metrics'][metric_name] = {
                    'value': latest_metric.value,
                    'unit': latest_metric.unit,
                    'status': latest_metric.status.value,
                    'last_check': latest_metric.timestamp.isoformat()
                }
        
        # Determinar status geral
        if unhealthy_services > 0:
            current_status['overall_status'] = ServiceStatus.UNHEALTHY.value
        elif degraded_services > 0:
            current_status['overall_status'] = ServiceStatus.DEGRADED.value
        else:
            current_status['overall_status'] = ServiceStatus.HEALTHY.value
        
        # Resumo do sistema
        current_status['system_summary'] = {
            'total_services': total_services,
            'healthy_services': total_services - unhealthy_services - degraded_services,
            'degraded_services': degraded_services,
            'unhealthy_services': unhealthy_services,
            'monitoring_active': self.monitoring_enabled and (self.monitoring_thread and self.monitoring_thread.is_alive())
        }
        
        return current_status
    
    def get_metrics_history(self, 
                           service_name: str,
                           hours_back: int = 24) -> Dict[str, Any]:
        """Obter histórico de métricas de um serviço"""
        if service_name not in self.metrics_history:
            return {'error': f'Service {service_name} not found'}
        
        cutoff_time = datetime.now() - timedelta(hours=hours_back)
        
        # Filtrar dados pelo período
        filtered_history = []
        for entry in self.metrics_history[service_name]:
            entry_time = entry.get('timestamp')
            if isinstance(entry_time, str):
                entry_time = datetime.fromisoformat(entry_time.replace('Z', '+00:00'))
            
            if entry_time and entry_time > cutoff_time:
                filtered_history.append(entry)
        
        return {
            'service_name': service_name,
            'period_hours': hours_back,
            'data_points': len(filtered_history),
            'history': filtered_history
        }
    
    def add_alert_callback(self, callback: Callable):
        """Adicionar callback para alertas"""
        self.alert_callbacks.append(callback)
    
    def remove_alert_callback(self, callback: Callable):
        """Remover callback de alertas"""
        if callback in self.alert_callbacks:
            self.alert_callbacks.remove(callback)
    
    def export_health_report(self, output_path: str, format: str = 'json') -> bool:
        """Exportar relatório de saúde"""
        try:
            current_status = self.get_current_health_status()
            
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            if format == 'json':
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(current_status, f, indent=2, ensure_ascii=False, default=str)
            
            logger.info(f"Relatório de saúde exportado para: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao exportar relatório de saúde: {e}")
            return False


# Instância global do monitor
health_monitor = ServiceHealthMonitor()


def start_health_monitoring() -> bool:
    """Iniciar monitorização de saúde global"""
    return health_monitor.start_monitoring()


def stop_health_monitoring() -> bool:
    """Parar monitorização de saúde global"""
    return health_monitor.stop_monitoring_services()


def get_health_status() -> Dict[str, Any]:
    """Obter status atual de saúde"""
    return health_monitor.get_current_health_status()


def setup_alert_logging():
    """Configurar logging de alertas"""
    def log_alert(alert_data):
        alert_type = alert_data.get('type', 'unknown')
        if alert_type == 'service_alert':
            service = alert_data.get('service_name', 'unknown')
            status = alert_data.get('status', 'unknown')
            logger.warning(f"ALERTA SERVIÇO: {service} está {status}")
        elif alert_type == 'metric_alert':
            metric = alert_data.get('metric_name', 'unknown')
            value = alert_data.get('value', 0)
            unit = alert_data.get('unit', '')
            status = alert_data.get('status', 'unknown')
            logger.warning(f"ALERTA MÉTRICA: {metric} = {value} {unit} ({status})")
    
    health_monitor.add_alert_callback(log_alert)
