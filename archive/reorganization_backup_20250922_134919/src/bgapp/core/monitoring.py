#!/usr/bin/env python3
"""
Sistema de monitorização proativo para BGAPP
Detecta problemas antes que afetem os utilizadores
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
import psutil
from pydantic import BaseModel

from .error_handler import error_handler, ErrorSeverity
from .database_pool import db_pool


class AlertLevel(Enum):
    """Níveis de alerta"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class MetricType(Enum):
    """Tipos de métricas"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    RATE = "rate"


@dataclass
class Alert:
    """Representação de um alerta"""
    id: str
    title: str
    message: str
    level: AlertLevel
    timestamp: datetime
    metric: str
    value: float
    threshold: float
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    actions_taken: List[str] = field(default_factory=list)


@dataclass
class Metric:
    """Representação de uma métrica"""
    name: str
    value: float
    type: MetricType
    timestamp: datetime
    labels: Dict[str, str] = field(default_factory=dict)
    description: str = ""


@dataclass
class Threshold:
    """Limite para alertas"""
    metric: str
    warning_threshold: Optional[float] = None
    error_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    comparison: str = "greater_than"  # greater_than, less_than, equal
    window_seconds: int = 60
    consecutive_violations: int = 3


class MonitoringSystem:
    """Sistema de monitorização proativo"""
    
    def __init__(self):
        self.metrics: Dict[str, List[Metric]] = {}
        self.alerts: List[Alert] = []
        self.thresholds: Dict[str, Threshold] = {}
        self.alert_handlers: Dict[AlertLevel, List[Callable]] = {
            AlertLevel.INFO: [],
            AlertLevel.WARNING: [],
            AlertLevel.ERROR: [],
            AlertLevel.CRITICAL: []
        }
        self.monitoring_task: Optional[asyncio.Task] = None
        self.is_running = False
        self.logger = logging.getLogger(__name__)
        
        # Configurar thresholds padrão
        self._setup_default_thresholds()
    
    def _setup_default_thresholds(self):
        """Configurar thresholds padrão"""
        self.thresholds.update({
            "cpu_percent": Threshold(
                metric="cpu_percent",
                warning_threshold=70.0,
                error_threshold=85.0,
                critical_threshold=95.0,
                consecutive_violations=3
            ),
            "memory_percent": Threshold(
                metric="memory_percent",
                warning_threshold=75.0,
                error_threshold=90.0,
                critical_threshold=98.0,
                consecutive_violations=3
            ),
            "disk_percent": Threshold(
                metric="disk_percent",
                warning_threshold=80.0,
                error_threshold=90.0,
                critical_threshold=95.0,
                consecutive_violations=2
            ),
            "database_connections": Threshold(
                metric="database_connections",
                warning_threshold=15.0,
                error_threshold=18.0,
                critical_threshold=20.0,
                consecutive_violations=2
            ),
            "error_rate": Threshold(
                metric="error_rate",
                warning_threshold=5.0,  # 5% de erros
                error_threshold=10.0,   # 10% de erros
                critical_threshold=25.0, # 25% de erros
                consecutive_violations=3
            ),
            "response_time": Threshold(
                metric="response_time",
                warning_threshold=2.0,   # 2 segundos
                error_threshold=5.0,     # 5 segundos
                critical_threshold=10.0, # 10 segundos
                consecutive_violations=3
            )
        })
    
    def add_metric(self, name: str, value: float, metric_type: MetricType = MetricType.GAUGE, 
                   labels: Dict[str, str] = None, description: str = ""):
        """Adicionar métrica"""
        metric = Metric(
            name=name,
            value=value,
            type=metric_type,
            timestamp=datetime.now(),
            labels=labels or {},
            description=description
        )
        
        if name not in self.metrics:
            self.metrics[name] = []
        
        self.metrics[name].append(metric)
        
        # Manter apenas últimas 1000 métricas por tipo
        if len(self.metrics[name]) > 1000:
            self.metrics[name] = self.metrics[name][-1000:]
        
        # Verificar thresholds
        self._check_thresholds(name, value)
    
    def _check_thresholds(self, metric_name: str, value: float):
        """Verificar se métrica violou thresholds"""
        threshold = self.thresholds.get(metric_name)
        if not threshold:
            return
        
        # Obter valores recentes para verificar violações consecutivas
        recent_metrics = self.get_recent_metrics(
            metric_name, 
            seconds=threshold.window_seconds
        )
        
        if len(recent_metrics) < threshold.consecutive_violations:
            return
        
        # Verificar se todas as métricas recentes violaram o threshold
        recent_values = [m.value for m in recent_metrics[-threshold.consecutive_violations:]]
        
        violation_level = self._get_violation_level(threshold, value)
        if not violation_level:
            return
        
        # Verificar se todas as violações são do mesmo nível ou superior
        all_violations = all(
            self._get_violation_level(threshold, v) and 
            self._get_violation_level(threshold, v).value >= violation_level.value
            for v in recent_values
        )
        
        if all_violations:
            self._create_alert(metric_name, value, threshold, violation_level)
    
    def _get_violation_level(self, threshold: Threshold, value: float) -> Optional[AlertLevel]:
        """Determinar nível de violação"""
        if threshold.comparison == "greater_than":
            if threshold.critical_threshold and value >= threshold.critical_threshold:
                return AlertLevel.CRITICAL
            elif threshold.error_threshold and value >= threshold.error_threshold:
                return AlertLevel.ERROR
            elif threshold.warning_threshold and value >= threshold.warning_threshold:
                return AlertLevel.WARNING
        elif threshold.comparison == "less_than":
            if threshold.critical_threshold and value <= threshold.critical_threshold:
                return AlertLevel.CRITICAL
            elif threshold.error_threshold and value <= threshold.error_threshold:
                return AlertLevel.ERROR
            elif threshold.warning_threshold and value <= threshold.warning_threshold:
                return AlertLevel.WARNING
        
        return None
    
    def _create_alert(self, metric_name: str, value: float, threshold: Threshold, level: AlertLevel):
        """Criar alerta"""
        # Verificar se já existe alerta similar ativo
        existing_alert = next(
            (a for a in self.alerts 
             if a.metric == metric_name and not a.resolved and a.level == level),
            None
        )
        
        if existing_alert:
            return  # Não criar alerta duplicado
        
        alert_id = f"{metric_name}_{level.value}_{int(time.time())}"
        
        alert = Alert(
            id=alert_id,
            title=f"{metric_name.replace('_', ' ').title()} {level.value.upper()}",
            message=self._generate_alert_message(metric_name, value, threshold, level),
            level=level,
            timestamp=datetime.now(),
            metric=metric_name,
            value=value,
            threshold=self._get_threshold_value(threshold, level)
        )
        
        self.alerts.append(alert)
        
        # Executar handlers de alerta
        self._execute_alert_handlers(alert)
        
        self.logger.warning(f"Alert created: {alert.title} - {alert.message}")
    
    def _generate_alert_message(self, metric: str, value: float, threshold: Threshold, level: AlertLevel) -> str:
        """Gerar mensagem de alerta"""
        threshold_value = self._get_threshold_value(threshold, level)
        
        messages = {
            "cpu_percent": f"CPU usage is {value:.1f}% (threshold: {threshold_value:.1f}%)",
            "memory_percent": f"Memory usage is {value:.1f}% (threshold: {threshold_value:.1f}%)",
            "disk_percent": f"Disk usage is {value:.1f}% (threshold: {threshold_value:.1f}%)",
            "database_connections": f"Database connections: {value:.0f} (threshold: {threshold_value:.0f})",
            "error_rate": f"Error rate is {value:.1f}% (threshold: {threshold_value:.1f}%)",
            "response_time": f"Response time is {value:.2f}s (threshold: {threshold_value:.2f}s)"
        }
        
        return messages.get(metric, f"{metric} is {value} (threshold: {threshold_value})")
    
    def _get_threshold_value(self, threshold: Threshold, level: AlertLevel) -> float:
        """Obter valor do threshold para o nível"""
        if level == AlertLevel.CRITICAL:
            return threshold.critical_threshold
        elif level == AlertLevel.ERROR:
            return threshold.error_threshold
        elif level == AlertLevel.WARNING:
            return threshold.warning_threshold
        return 0.0
    
    def _execute_alert_handlers(self, alert: Alert):
        """Executar handlers de alerta"""
        handlers = self.alert_handlers.get(alert.level, [])
        for handler in handlers:
            try:
                asyncio.create_task(handler(alert))
            except Exception as e:
                self.logger.error(f"Error executing alert handler: {e}")
    
    def add_alert_handler(self, level: AlertLevel, handler: Callable):
        """Adicionar handler de alerta"""
        self.alert_handlers[level].append(handler)
    
    def get_recent_metrics(self, name: str, seconds: int = 300) -> List[Metric]:
        """Obter métricas recentes"""
        if name not in self.metrics:
            return []
        
        cutoff_time = datetime.now() - timedelta(seconds=seconds)
        return [
            m for m in self.metrics[name]
            if m.timestamp >= cutoff_time
        ]
    
    def get_metric_stats(self, name: str, seconds: int = 300) -> Dict[str, float]:
        """Obter estatísticas de uma métrica"""
        recent_metrics = self.get_recent_metrics(name, seconds)
        
        if not recent_metrics:
            return {}
        
        values = [m.value for m in recent_metrics]
        
        return {
            "current": values[-1] if values else 0,
            "average": sum(values) / len(values),
            "min": min(values),
            "max": max(values),
            "count": len(values)
        }
    
    async def collect_system_metrics(self):
        """Coletar métricas do sistema"""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            self.add_metric("cpu_percent", cpu_percent, MetricType.GAUGE)
            
            # Memória
            memory = psutil.virtual_memory()
            self.add_metric("memory_percent", memory.percent, MetricType.GAUGE)
            self.add_metric("memory_available", memory.available, MetricType.GAUGE)
            
            # Disco
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            self.add_metric("disk_percent", disk_percent, MetricType.GAUGE)
            self.add_metric("disk_free", disk.free, MetricType.GAUGE)
            
            # Database
            if hasattr(db_pool, 'pool') and db_pool.pool:
                db_stats = db_pool.get_stats()
                self.add_metric("database_connections", db_stats.get('size', 0), MetricType.GAUGE)
                self.add_metric("database_idle_connections", db_stats.get('idle_connections', 0), MetricType.GAUGE)
            
            # Error rate
            error_stats = error_handler.get_error_statistics()
            if error_stats.get('recent_errors', 0) > 0:
                total_requests = error_stats.get('recent_errors', 0) + 100  # Estimativa
                error_rate = (error_stats.get('recent_errors', 0) / total_requests) * 100
                self.add_metric("error_rate", error_rate, MetricType.GAUGE)
            
        except Exception as e:
            self.logger.error(f"Error collecting system metrics: {e}")
    
    async def start_monitoring(self):
        """Iniciar monitorização"""
        if self.is_running:
            return
        
        self.is_running = True
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        self.logger.info("Monitoring system started")
    
    async def stop_monitoring(self):
        """Parar monitorização"""
        self.is_running = False
        
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
        
        self.logger.info("Monitoring system stopped")
    
    async def _monitoring_loop(self):
        """Loop principal de monitorização"""
        while self.is_running:
            try:
                await self.collect_system_metrics()
                await asyncio.sleep(30)  # Coletar métricas a cada 30 segundos
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(60)  # Aguardar mais tempo em caso de erro
    
    def resolve_alert(self, alert_id: str, action: str = "Manual resolution"):
        """Resolver alerta"""
        alert = next((a for a in self.alerts if a.id == alert_id), None)
        if alert and not alert.resolved:
            alert.resolved = True
            alert.resolved_at = datetime.now()
            alert.actions_taken.append(action)
            self.logger.info(f"Alert resolved: {alert.title}")
    
    def get_active_alerts(self) -> List[Alert]:
        """Obter alertas ativos"""
        return [a for a in self.alerts if not a.resolved]
    
    def get_alert_summary(self) -> Dict[str, Any]:
        """Obter resumo de alertas"""
        active_alerts = self.get_active_alerts()
        
        by_level = {}
        for level in AlertLevel:
            by_level[level.value] = len([a for a in active_alerts if a.level == level])
        
        return {
            "total_active": len(active_alerts),
            "by_level": by_level,
            "recent_alerts": len([
                a for a in self.alerts 
                if (datetime.now() - a.timestamp).total_seconds() < 3600
            ])
        }
    
    def get_system_health_score(self) -> float:
        """Calcular score de saúde do sistema (0-100)"""
        active_alerts = self.get_active_alerts()
        
        if not active_alerts:
            return 100.0
        
        # Penalizar baseado no nível dos alertas
        penalty = 0
        for alert in active_alerts:
            if alert.level == AlertLevel.CRITICAL:
                penalty += 30
            elif alert.level == AlertLevel.ERROR:
                penalty += 15
            elif alert.level == AlertLevel.WARNING:
                penalty += 5
            else:
                penalty += 1
        
        score = max(0, 100 - penalty)
        return score


# Instância global do sistema de monitorização
monitoring_system = MonitoringSystem()


async def start_monitoring():
    """Iniciar sistema de monitorização"""
    await monitoring_system.start_monitoring()


async def stop_monitoring():
    """Parar sistema de monitorização"""
    await monitoring_system.stop_monitoring()


def get_monitoring_stats():
    """Obter estatísticas de monitorização"""
    return {
        "health_score": monitoring_system.get_system_health_score(),
        "alerts": monitoring_system.get_alert_summary(),
        "metrics_count": len(monitoring_system.metrics),
        "is_running": monitoring_system.is_running
    }
