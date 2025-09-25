"""
Sistema de Monitorização de Performance em Tempo Real
Monitor avançado para conectores BGAPP com alertas e métricas
"""

import asyncio
import json
import logging
import time
import threading
from collections import deque, defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)


class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning" 
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class PerformanceAlert:
    timestamp: datetime
    level: AlertLevel
    connector_id: str
    metric: str
    value: float
    threshold: float
    message: str
    resolved: bool = False
    resolution_time: Optional[datetime] = None


@dataclass
class ConnectorMetrics:
    connector_id: str
    requests_total: int = 0
    requests_success: int = 0
    requests_failed: int = 0
    avg_response_time: float = 0.0
    min_response_time: float = float('inf')
    max_response_time: float = 0.0
    cache_hits: int = 0
    cache_misses: int = 0
    data_points_processed: int = 0
    bytes_downloaded: int = 0
    last_activity: Optional[datetime] = None
    status: str = "idle"
    
    @property
    def success_rate(self) -> float:
        if self.requests_total == 0:
            return 0.0
        return (self.requests_success / self.requests_total) * 100
    
    @property
    def cache_hit_rate(self) -> float:
        total_cache_requests = self.cache_hits + self.cache_misses
        if total_cache_requests == 0:
            return 0.0
        return (self.cache_hits / total_cache_requests) * 100
    
    @property
    def error_rate(self) -> float:
        if self.requests_total == 0:
            return 0.0
        return (self.requests_failed / self.requests_total) * 100


class PerformanceMonitor:
    """Monitor de performance em tempo real para conectores"""
    
    def __init__(self, history_size: int = 1000, alert_check_interval: int = 30):
        self.history_size = history_size
        self.alert_check_interval = alert_check_interval
        
        # Métricas por conector
        self.connector_metrics: Dict[str, ConnectorMetrics] = {}
        
        # Histórico de métricas (sliding window)
        self.metrics_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=history_size))
        
        # Sistema de alertas
        self.alerts: List[PerformanceAlert] = []
        self.alert_thresholds = {
            'response_time_warning': 2.0,      # segundos
            'response_time_critical': 5.0,     # segundos
            'error_rate_warning': 5.0,         # percentagem
            'error_rate_critical': 15.0,       # percentagem
            'cache_hit_rate_warning': 30.0,    # percentagem mínima
            'success_rate_critical': 80.0      # percentagem mínima
        }
        
        # Threading para monitorização contínua
        self.monitoring_active = False
        self.monitor_thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()
        
        # Callbacks para alertas
        self.alert_callbacks: List[Callable] = []
        
        # Estatísticas globais
        self.global_stats = {
            'total_requests': 0,
            'total_data_processed': 0,
            'total_bytes_downloaded': 0,
            'active_connectors': 0,
            'system_start_time': datetime.now()
        }
    
    def register_connector(self, connector_id: str) -> None:
        """Registrar um novo conector para monitorização"""
        with self.lock:
            if connector_id not in self.connector_metrics:
                self.connector_metrics[connector_id] = ConnectorMetrics(connector_id=connector_id)
                logger.info(f"📊 Conector registrado para monitorização: {connector_id}")
    
    def record_request(self, connector_id: str, response_time: float, 
                      success: bool = True, data_points: int = 0, 
                      bytes_downloaded: int = 0, cache_hit: bool = False) -> None:
        """Registrar uma requisição e suas métricas"""
        with self.lock:
            # Garantir que o conector está registrado
            if connector_id not in self.connector_metrics:
                self.register_connector(connector_id)
            
            metrics = self.connector_metrics[connector_id]
            
            # Atualizar métricas da requisição
            metrics.requests_total += 1
            if success:
                metrics.requests_success += 1
            else:
                metrics.requests_failed += 1
            
            # Atualizar tempos de resposta
            if response_time > 0:
                if metrics.requests_total == 1:
                    metrics.avg_response_time = response_time
                else:
                    # Média móvel
                    metrics.avg_response_time = (
                        (metrics.avg_response_time * (metrics.requests_total - 1) + response_time) 
                        / metrics.requests_total
                    )
                
                metrics.min_response_time = min(metrics.min_response_time, response_time)
                metrics.max_response_time = max(metrics.max_response_time, response_time)
            
            # Atualizar cache
            if cache_hit:
                metrics.cache_hits += 1
            else:
                metrics.cache_misses += 1
            
            # Atualizar dados processados
            metrics.data_points_processed += data_points
            metrics.bytes_downloaded += bytes_downloaded
            metrics.last_activity = datetime.now()
            metrics.status = "active"
            
            # Adicionar ao histórico
            snapshot = {
                'timestamp': datetime.now().isoformat(),
                'response_time': response_time,
                'success': success,
                'cache_hit': cache_hit,
                'data_points': data_points,
                'cumulative_requests': metrics.requests_total
            }
            self.metrics_history[connector_id].append(snapshot)
            
            # Atualizar estatísticas globais
            self.global_stats['total_requests'] += 1
            self.global_stats['total_data_processed'] += data_points
            self.global_stats['total_bytes_downloaded'] += bytes_downloaded
    
    def get_connector_metrics(self, connector_id: str) -> Optional[ConnectorMetrics]:
        """Obter métricas de um conector específico"""
        with self.lock:
            return self.connector_metrics.get(connector_id)
    
    def get_all_metrics(self) -> Dict[str, ConnectorMetrics]:
        """Obter métricas de todos os conectores"""
        with self.lock:
            return dict(self.connector_metrics)
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Obter resumo geral de performance"""
        with self.lock:
            active_connectors = sum(
                1 for metrics in self.connector_metrics.values()
                if metrics.last_activity and 
                datetime.now() - metrics.last_activity < timedelta(minutes=5)
            )
            
            self.global_stats['active_connectors'] = active_connectors
            
            # Calcular médias globais
            total_requests = sum(m.requests_total for m in self.connector_metrics.values())
            avg_response_time = 0
            if total_requests > 0:
                avg_response_time = sum(
                    m.avg_response_time * m.requests_total 
                    for m in self.connector_metrics.values()
                ) / total_requests
            
            success_rate = 0
            if total_requests > 0:
                total_success = sum(m.requests_success for m in self.connector_metrics.values())
                success_rate = (total_success / total_requests) * 100
            
            return {
                'timestamp': datetime.now().isoformat(),
                'global_stats': self.global_stats,
                'performance_summary': {
                    'total_connectors': len(self.connector_metrics),
                    'active_connectors': active_connectors,
                    'total_requests': total_requests,
                    'avg_response_time': round(avg_response_time, 3),
                    'global_success_rate': round(success_rate, 2),
                    'system_uptime': str(datetime.now() - self.global_stats['system_start_time'])
                },
                'top_performers': self._get_top_performers(),
                'alerts_summary': {
                    'total_alerts': len(self.alerts),
                    'active_alerts': len([a for a in self.alerts if not a.resolved]),
                    'critical_alerts': len([a for a in self.alerts if a.level == AlertLevel.CRITICAL and not a.resolved])
                }
            }
    
    def _get_top_performers(self) -> Dict[str, Any]:
        """Identificar conectores com melhor performance"""
        if not self.connector_metrics:
            return {}
        
        # Ordenar por diferentes métricas
        by_response_time = sorted(
            [(k, v) for k, v in self.connector_metrics.items() if v.requests_total > 0],
            key=lambda x: x[1].avg_response_time
        )
        
        by_success_rate = sorted(
            [(k, v) for k, v in self.connector_metrics.items() if v.requests_total > 0],
            key=lambda x: x[1].success_rate,
            reverse=True
        )
        
        by_cache_hit_rate = sorted(
            [(k, v) for k, v in self.connector_metrics.items() if v.cache_hits + v.cache_misses > 0],
            key=lambda x: x[1].cache_hit_rate,
            reverse=True
        )
        
        return {
            'fastest_response': by_response_time[0][0] if by_response_time else None,
            'highest_success_rate': by_success_rate[0][0] if by_success_rate else None,
            'best_cache_performance': by_cache_hit_rate[0][0] if by_cache_hit_rate else None
        }
    
    def check_alerts(self) -> List[PerformanceAlert]:
        """Verificar se há condições de alerta"""
        new_alerts = []
        
        with self.lock:
            for connector_id, metrics in self.connector_metrics.items():
                if metrics.requests_total == 0:
                    continue
                
                # Verificar tempo de resposta
                if metrics.avg_response_time > self.alert_thresholds['response_time_critical']:
                    alert = PerformanceAlert(
                        timestamp=datetime.now(),
                        level=AlertLevel.CRITICAL,
                        connector_id=connector_id,
                        metric='avg_response_time',
                        value=metrics.avg_response_time,
                        threshold=self.alert_thresholds['response_time_critical'],
                        message=f"Tempo de resposta crítico: {metrics.avg_response_time:.2f}s"
                    )
                    new_alerts.append(alert)
                    
                elif metrics.avg_response_time > self.alert_thresholds['response_time_warning']:
                    alert = PerformanceAlert(
                        timestamp=datetime.now(),
                        level=AlertLevel.WARNING,
                        connector_id=connector_id,
                        metric='avg_response_time',
                        value=metrics.avg_response_time,
                        threshold=self.alert_thresholds['response_time_warning'],
                        message=f"Tempo de resposta elevado: {metrics.avg_response_time:.2f}s"
                    )
                    new_alerts.append(alert)
                
                # Verificar taxa de erro
                error_rate = metrics.error_rate
                if error_rate > self.alert_thresholds['error_rate_critical']:
                    alert = PerformanceAlert(
                        timestamp=datetime.now(),
                        level=AlertLevel.CRITICAL,
                        connector_id=connector_id,
                        metric='error_rate',
                        value=error_rate,
                        threshold=self.alert_thresholds['error_rate_critical'],
                        message=f"Taxa de erro crítica: {error_rate:.1f}%"
                    )
                    new_alerts.append(alert)
                    
                elif error_rate > self.alert_thresholds['error_rate_warning']:
                    alert = PerformanceAlert(
                        timestamp=datetime.now(),
                        level=AlertLevel.WARNING,
                        connector_id=connector_id,
                        metric='error_rate',
                        value=error_rate,
                        threshold=self.alert_thresholds['error_rate_warning'],
                        message=f"Taxa de erro elevada: {error_rate:.1f}%"
                    )
                    new_alerts.append(alert)
                
                # Verificar taxa de sucesso
                success_rate = metrics.success_rate
                if success_rate < self.alert_thresholds['success_rate_critical']:
                    alert = PerformanceAlert(
                        timestamp=datetime.now(),
                        level=AlertLevel.CRITICAL,
                        connector_id=connector_id,
                        metric='success_rate',
                        value=success_rate,
                        threshold=self.alert_thresholds['success_rate_critical'],
                        message=f"Taxa de sucesso baixa: {success_rate:.1f}%"
                    )
                    new_alerts.append(alert)
                
                # Verificar cache hit rate (se aplicável)
                if metrics.cache_hits + metrics.cache_misses > 10:
                    cache_hit_rate = metrics.cache_hit_rate
                    if cache_hit_rate < self.alert_thresholds['cache_hit_rate_warning']:
                        alert = PerformanceAlert(
                            timestamp=datetime.now(),
                            level=AlertLevel.WARNING,
                            connector_id=connector_id,
                            metric='cache_hit_rate',
                            value=cache_hit_rate,
                            threshold=self.alert_thresholds['cache_hit_rate_warning'],
                            message=f"Cache hit rate baixo: {cache_hit_rate:.1f}%"
                        )
                        new_alerts.append(alert)
        
        # Adicionar novos alertas
        self.alerts.extend(new_alerts)
        
        # Executar callbacks de alerta
        for alert in new_alerts:
            for callback in self.alert_callbacks:
                try:
                    callback(alert)
                except Exception as e:
                    logger.error(f"❌ Erro no callback de alerta: {e}")
        
        return new_alerts
    
    def add_alert_callback(self, callback: Callable[[PerformanceAlert], None]) -> None:
        """Adicionar callback para ser executado quando alertas são gerados"""
        self.alert_callbacks.append(callback)
    
    def resolve_alert(self, alert_id: int) -> bool:
        """Marcar um alerta como resolvido"""
        if 0 <= alert_id < len(self.alerts):
            self.alerts[alert_id].resolved = True
            self.alerts[alert_id].resolution_time = datetime.now()
            return True
        return False
    
    def start_monitoring(self) -> None:
        """Iniciar monitorização contínua em thread separada"""
        if self.monitoring_active:
            logger.warning("⚠️ Monitorização já está ativa")
            return
        
        self.monitoring_active = True
        self.monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitor_thread.start()
        logger.info("🚀 Monitorização de performance iniciada")
    
    def stop_monitoring(self) -> None:
        """Parar monitorização contínua"""
        self.monitoring_active = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        logger.info("⏹️ Monitorização de performance parada")
    
    def _monitoring_loop(self) -> None:
        """Loop principal de monitorização"""
        while self.monitoring_active:
            try:
                # Verificar alertas
                new_alerts = self.check_alerts()
                if new_alerts:
                    logger.info(f"🚨 {len(new_alerts)} novos alertas gerados")
                
                # Limpar conectores inativos
                self._cleanup_inactive_connectors()
                
                # Aguardar próxima verificação
                time.sleep(self.alert_check_interval)
                
            except Exception as e:
                logger.error(f"❌ Erro no loop de monitorização: {e}")
                time.sleep(5)  # Aguardar antes de tentar novamente
    
    def _cleanup_inactive_connectors(self) -> None:
        """Marcar conectores inativos"""
        cutoff_time = datetime.now() - timedelta(minutes=10)
        
        with self.lock:
            for metrics in self.connector_metrics.values():
                if metrics.last_activity and metrics.last_activity < cutoff_time:
                    metrics.status = "idle"
    
    def export_metrics_report(self, output_path: Path = None, 
                            include_history: bool = False) -> Path:
        """Exportar relatório completo de métricas"""
        if not output_path:
            output_path = Path(f"performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        
        report_data = {
            'report_metadata': {
                'generated_at': datetime.now().isoformat(),
                'monitoring_duration': str(datetime.now() - self.global_stats['system_start_time']),
                'total_connectors': len(self.connector_metrics)
            },
            'performance_summary': self.get_performance_summary(),
            'connector_metrics': {
                k: asdict(v) for k, v in self.connector_metrics.items()
            },
            'alerts': [asdict(alert) for alert in self.alerts],
            'thresholds': self.alert_thresholds
        }
        
        # Incluir histórico se solicitado
        if include_history:
            report_data['metrics_history'] = {
                k: list(v) for k, v in self.metrics_history.items()
            }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info(f"📊 Relatório de performance exportado: {output_path}")
        return output_path
    
    def get_real_time_dashboard_data(self) -> Dict[str, Any]:
        """Obter dados para dashboard em tempo real"""
        return {
            'timestamp': datetime.now().isoformat(),
            'connectors': [
                {
                    'id': k,
                    'status': v.status,
                    'requests_total': v.requests_total,
                    'success_rate': round(v.success_rate, 1),
                    'avg_response_time': round(v.avg_response_time, 3),
                    'cache_hit_rate': round(v.cache_hit_rate, 1),
                    'last_activity': v.last_activity.isoformat() if v.last_activity else None
                }
                for k, v in self.connector_metrics.items()
            ],
            'alerts': [
                {
                    'level': alert.level.value,
                    'connector_id': alert.connector_id,
                    'message': alert.message,
                    'timestamp': alert.timestamp.isoformat(),
                    'resolved': alert.resolved
                }
                for alert in self.alerts[-10:]  # Últimos 10 alertas
            ],
            'summary': self.get_performance_summary()['performance_summary']
        }


# Instância global do monitor
performance_monitor = PerformanceMonitor()


# Funções de conveniência
def register_connector(connector_id: str) -> None:
    """Registrar conector para monitorização"""
    performance_monitor.register_connector(connector_id)


def record_request(connector_id: str, response_time: float, success: bool = True,
                  data_points: int = 0, bytes_downloaded: int = 0, cache_hit: bool = False) -> None:
    """Registrar requisição para monitorização"""
    performance_monitor.record_request(
        connector_id, response_time, success, data_points, bytes_downloaded, cache_hit
    )


def get_performance_summary() -> Dict[str, Any]:
    """Obter resumo de performance"""
    return performance_monitor.get_performance_summary()


def start_performance_monitoring() -> None:
    """Iniciar monitorização"""
    performance_monitor.start_monitoring()


def stop_performance_monitoring() -> None:
    """Parar monitorização"""
    performance_monitor.stop_monitoring()


# Callback de exemplo para alertas
def log_alert_callback(alert: PerformanceAlert) -> None:
    """Callback para logar alertas"""
    level_emoji = {
        AlertLevel.INFO: "ℹ️",
        AlertLevel.WARNING: "⚠️", 
        AlertLevel.ERROR: "❌",
        AlertLevel.CRITICAL: "🚨"
    }
    
    emoji = level_emoji.get(alert.level, "📊")
    logger.warning(f"{emoji} ALERTA {alert.level.value.upper()}: {alert.message} ({alert.connector_id})")


# Registrar callback padrão
performance_monitor.add_alert_callback(log_alert_callback)


if __name__ == "__main__":
    # Teste do sistema de monitorização
    import random
    
    # Iniciar monitorização
    start_performance_monitoring()
    
    # Simular atividade de conectores
    connectors = ['gbif', 'stac_client', 'nasa_earthdata', 'copernicus']
    
    for connector in connectors:
        register_connector(connector)
    
    # Simular requisições
    for _ in range(100):
        connector = random.choice(connectors)
        response_time = random.uniform(0.5, 3.0)
        success = random.random() > 0.1  # 90% success rate
        cache_hit = random.random() > 0.3  # 70% cache hit rate
        
        record_request(connector, response_time, success, 
                      data_points=random.randint(10, 1000),
                      bytes_downloaded=random.randint(1000, 100000),
                      cache_hit=cache_hit)
        
        time.sleep(0.1)
    
    # Mostrar resumo
    summary = get_performance_summary()
    print("📊 Resumo de Performance:")
    print(json.dumps(summary, indent=2, default=str))
    
    # Parar monitorização
    time.sleep(2)
    stop_performance_monitoring()
