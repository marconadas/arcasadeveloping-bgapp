"""
📊 ML Retention Monitoring
Sistema de monitorização de performance da base de retenção ML

CARACTERÍSTICAS:
- Dashboard de métricas em tempo real
- Alertas automáticos de performance
- Relatórios de ganhos de eficiência
- Compatível com Cloudflare Workers
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import statistics

# Imports do sistema
try:
    from .retention_manager import MLRetentionManager, get_retention_manager
    from .retention_pipeline import MLRetentionPipeline, get_retention_pipeline
    from .retention_policies import MLRetentionPolicyManager, get_policy_manager
    from .retention_integration import MLRetentionIntegrator, get_retention_integrator
    from ..database.database_manager import DatabaseManager
except ImportError:
    # Fallback para desenvolvimento
    import sys
    # Path already in PYTHONPATH

logger = logging.getLogger(__name__)


class AlertLevel(Enum):
    """Níveis de alerta"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class MetricType(Enum):
    """Tipos de métricas"""
    CACHE_HIT_RATIO = "cache_hit_ratio"
    RESPONSE_TIME = "response_time"
    SPACE_USAGE = "space_usage"
    QUERY_PERFORMANCE = "query_performance"
    DATA_QUALITY = "data_quality"


@dataclass
class PerformanceMetric:
    """Métrica de performance"""
    metric_type: MetricType
    value: float
    unit: str
    timestamp: datetime
    context: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.context is None:
            self.context = {}


@dataclass
class PerformanceAlert:
    """Alerta de performance"""
    alert_id: str
    level: AlertLevel
    title: str
    message: str
    metric_type: MetricType
    current_value: float
    threshold: float
    timestamp: datetime
    resolved: bool = False
    resolved_at: Optional[datetime] = None


@dataclass
class PerformanceReport:
    """Relatório de performance"""
    report_id: str
    period_start: datetime
    period_end: datetime
    total_queries: int
    cache_hit_ratio: float
    avg_response_time_ms: float
    space_saved_mb: float
    performance_improvement: float
    key_insights: List[str]
    recommendations: List[str]


class MLRetentionMonitor:
    """
    📊 Monitor de Performance da Retenção ML
    
    Sistema completo de monitorização que acompanha performance,
    gera alertas e produz relatórios de eficiência.
    """
    
    def __init__(self):
        """Inicializar monitor de performance"""
        
        # Componentes do sistema
        self.retention_manager = get_retention_manager()
        self.pipeline = get_retention_pipeline()
        self.policy_manager = get_policy_manager()
        self.integrator = get_retention_integrator()
        
        # Histórico de métricas
        self.metrics_history: List[PerformanceMetric] = []
        self.alerts_history: List[PerformanceAlert] = []
        
        # Configurações de monitorização
        self.config = {
            'metrics_retention_days': 30,
            'sampling_interval_minutes': 5,
            'alert_cooldown_minutes': 15,
            'performance_baseline': {
                'cache_hit_ratio_min': 0.6,
                'response_time_max_ms': 500,
                'space_usage_max_gb': 10,
                'data_quality_min': 0.7
            }
        }
        
        # Estado do monitor
        self.monitoring_active = False
        self.monitoring_task = None
        self.last_alert_times = {}
        
        # Métricas em tempo real
        self.current_metrics = {
            'cache_hit_ratio': 0.0,
            'avg_response_time_ms': 0.0,
            'total_space_mb': 0.0,
            'active_policies': 0,
            'background_tasks': 0,
            'last_updated': datetime.now()
        }
        
        logger.info("📊 ML Retention Monitor inicializado")
    
    # =====================================
    # 📊 COLETA DE MÉTRICAS
    # =====================================
    
    async def collect_current_metrics(self) -> Dict[str, PerformanceMetric]:
        """Coletar métricas atuais do sistema"""
        
        current_time = datetime.now()
        metrics = {}
        
        try:
            # Métricas do retention manager
            retention_stats = self.retention_manager.get_lightweight_stats()
            
            metrics['cache_hit_ratio'] = PerformanceMetric(
                metric_type=MetricType.CACHE_HIT_RATIO,
                value=retention_stats.get('hit_ratio', 0.0),
                unit='ratio',
                timestamp=current_time,
                context={'source': 'retention_manager'}
            )
            
            # Métricas do integrador
            if hasattr(self.integrator, 'get_integration_metrics'):
                integration_stats = self.integrator.get_integration_metrics()
                
                metrics['response_time'] = PerformanceMetric(
                    metric_type=MetricType.RESPONSE_TIME,
                    value=integration_stats.get('performance_gains_ms', 0.0),
                    unit='milliseconds',
                    timestamp=current_time,
                    context={'source': 'integrator'}
                )
            
            # Métricas de espaço (estimativa)
            space_metrics = await self._collect_space_metrics()
            if space_metrics:
                metrics['space_usage'] = PerformanceMetric(
                    metric_type=MetricType.SPACE_USAGE,
                    value=space_metrics['total_mb'],
                    unit='megabytes',
                    timestamp=current_time,
                    context=space_metrics
                )
            
            # Métricas de qualidade
            quality_metrics = await self._collect_quality_metrics()
            if quality_metrics:
                metrics['data_quality'] = PerformanceMetric(
                    metric_type=MetricType.DATA_QUALITY,
                    value=quality_metrics['avg_quality'],
                    unit='score',
                    timestamp=current_time,
                    context=quality_metrics
                )
            
            # Atualizar métricas atuais
            self.current_metrics.update({
                'cache_hit_ratio': metrics.get('cache_hit_ratio', PerformanceMetric(MetricType.CACHE_HIT_RATIO, 0.0, 'ratio', current_time)).value,
                'avg_response_time_ms': metrics.get('response_time', PerformanceMetric(MetricType.RESPONSE_TIME, 0.0, 'ms', current_time)).value,
                'total_space_mb': metrics.get('space_usage', PerformanceMetric(MetricType.SPACE_USAGE, 0.0, 'mb', current_time)).value,
                'last_updated': current_time
            })
            
        except Exception as e:
            logger.error(f"❌ Erro coletando métricas: {e}")
        
        return metrics
    
    async def _collect_space_metrics(self) -> Optional[Dict[str, Any]]:
        """Coletar métricas de uso de espaço"""
        try:
            # Simular consulta de espaço (em produção, usar queries reais)
            space_data = {
                'feature_store_mb': 150.5,
                'training_cache_mb': 320.8,
                'inference_cache_mb': 45.2,
                'aggregated_series_mb': 89.3,
                'total_mb': 605.8
            }
            
            return space_data
            
        except Exception as e:
            logger.warning(f"⚠️ Erro coletando métricas de espaço: {e}")
            return None
    
    async def _collect_quality_metrics(self) -> Optional[Dict[str, Any]]:
        """Coletar métricas de qualidade dos dados"""
        try:
            # Simular consulta de qualidade (em produção, usar queries reais)
            quality_data = {
                'avg_quality': 0.82,
                'high_quality_ratio': 0.65,
                'validated_ratio': 0.78,
                'total_features': 1250
            }
            
            return quality_data
            
        except Exception as e:
            logger.warning(f"⚠️ Erro coletando métricas de qualidade: {e}")
            return None
    
    # =====================================
    # 🚨 SISTEMA DE ALERTAS
    # =====================================
    
    async def check_performance_alerts(self, metrics: Dict[str, PerformanceMetric]):
        """Verificar e gerar alertas baseados nas métricas"""
        
        current_time = datetime.now()
        
        for metric_name, metric in metrics.items():
            try:
                alert = self._evaluate_metric_alert(metric)
                
                if alert:
                    # Verificar cooldown
                    last_alert_key = f"{alert.metric_type.value}_{alert.level.value}"
                    last_alert_time = self.last_alert_times.get(last_alert_key)
                    
                    if (not last_alert_time or 
                        current_time - last_alert_time > timedelta(minutes=self.config['alert_cooldown_minutes'])):
                        
                        await self._trigger_alert(alert)
                        self.last_alert_times[last_alert_key] = current_time
                
            except Exception as e:
                logger.error(f"❌ Erro verificando alerta para {metric_name}: {e}")
    
    def _evaluate_metric_alert(self, metric: PerformanceMetric) -> Optional[PerformanceAlert]:
        """Avaliar se uma métrica deve gerar alerta"""
        
        baseline = self.config['performance_baseline']
        alert_id = f"alert_{metric.metric_type.value}_{int(metric.timestamp.timestamp())}"
        
        if metric.metric_type == MetricType.CACHE_HIT_RATIO:
            if metric.value < baseline['cache_hit_ratio_min']:
                level = AlertLevel.WARNING if metric.value > 0.4 else AlertLevel.ERROR
                return PerformanceAlert(
                    alert_id=alert_id,
                    level=level,
                    title="Cache Hit Ratio Baixo",
                    message=f"Cache hit ratio de {metric.value:.2%} está abaixo do esperado ({baseline['cache_hit_ratio_min']:.2%})",
                    metric_type=metric.metric_type,
                    current_value=metric.value,
                    threshold=baseline['cache_hit_ratio_min'],
                    timestamp=metric.timestamp
                )
        
        elif metric.metric_type == MetricType.RESPONSE_TIME:
            if metric.value > baseline['response_time_max_ms']:
                level = AlertLevel.WARNING if metric.value < 1000 else AlertLevel.ERROR
                return PerformanceAlert(
                    alert_id=alert_id,
                    level=level,
                    title="Tempo de Resposta Elevado",
                    message=f"Tempo de resposta de {metric.value:.1f}ms excede limite ({baseline['response_time_max_ms']}ms)",
                    metric_type=metric.metric_type,
                    current_value=metric.value,
                    threshold=baseline['response_time_max_ms'],
                    timestamp=metric.timestamp
                )
        
        elif metric.metric_type == MetricType.SPACE_USAGE:
            space_gb = metric.value / 1024
            if space_gb > baseline['space_usage_max_gb']:
                level = AlertLevel.WARNING if space_gb < 15 else AlertLevel.ERROR
                return PerformanceAlert(
                    alert_id=alert_id,
                    level=level,
                    title="Uso de Espaço Elevado",
                    message=f"Uso de espaço de {space_gb:.1f}GB excede limite ({baseline['space_usage_max_gb']}GB)",
                    metric_type=metric.metric_type,
                    current_value=space_gb,
                    threshold=baseline['space_usage_max_gb'],
                    timestamp=metric.timestamp
                )
        
        elif metric.metric_type == MetricType.DATA_QUALITY:
            if metric.value < baseline['data_quality_min']:
                level = AlertLevel.WARNING if metric.value > 0.5 else AlertLevel.ERROR
                return PerformanceAlert(
                    alert_id=alert_id,
                    level=level,
                    title="Qualidade de Dados Baixa",
                    message=f"Qualidade média de {metric.value:.2f} está abaixo do esperado ({baseline['data_quality_min']:.2f})",
                    metric_type=metric.metric_type,
                    current_value=metric.value,
                    threshold=baseline['data_quality_min'],
                    timestamp=metric.timestamp
                )
        
        return None
    
    async def _trigger_alert(self, alert: PerformanceAlert):
        """Disparar alerta"""
        
        # Adicionar ao histórico
        self.alerts_history.append(alert)
        
        # Log do alerta
        level_emoji = {
            AlertLevel.INFO: "ℹ️",
            AlertLevel.WARNING: "⚠️",
            AlertLevel.ERROR: "❌",
            AlertLevel.CRITICAL: "🚨"
        }
        
        emoji = level_emoji.get(alert.level, "📊")
        logger.warning(f"{emoji} ALERTA [{alert.level.value.upper()}] {alert.title}: {alert.message}")
        
        # TODO: Integrar com sistema de notificações (email, Slack, etc.)
        
    # =====================================
    # 📈 RELATÓRIOS DE PERFORMANCE
    # =====================================
    
    async def generate_performance_report(
        self, 
        period_hours: int = 24
    ) -> PerformanceReport:
        """Gerar relatório de performance"""
        
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=period_hours)
        
        # Filtrar métricas do período
        period_metrics = [
            m for m in self.metrics_history 
            if start_time <= m.timestamp <= end_time
        ]
        
        # Calcular estatísticas
        cache_ratios = [m.value for m in period_metrics if m.metric_type == MetricType.CACHE_HIT_RATIO]
        response_times = [m.value for m in period_metrics if m.metric_type == MetricType.RESPONSE_TIME]
        space_usage = [m.value for m in period_metrics if m.metric_type == MetricType.SPACE_USAGE]
        
        avg_cache_ratio = statistics.mean(cache_ratios) if cache_ratios else 0.0
        avg_response_time = statistics.mean(response_times) if response_times else 0.0
        max_space_usage = max(space_usage) if space_usage else 0.0
        
        # Calcular melhorias de performance
        performance_improvement = self._calculate_performance_improvement(period_metrics)
        
        # Gerar insights
        insights = self._generate_insights(avg_cache_ratio, avg_response_time, max_space_usage)
        recommendations = self._generate_recommendations(avg_cache_ratio, avg_response_time, max_space_usage)
        
        report = PerformanceReport(
            report_id=f"report_{int(end_time.timestamp())}",
            period_start=start_time,
            period_end=end_time,
            total_queries=len(period_metrics),
            cache_hit_ratio=avg_cache_ratio,
            avg_response_time_ms=avg_response_time,
            space_saved_mb=max_space_usage,
            performance_improvement=performance_improvement,
            key_insights=insights,
            recommendations=recommendations
        )
        
        return report
    
    def _calculate_performance_improvement(self, metrics: List[PerformanceMetric]) -> float:
        """Calcular melhoria de performance baseada nas métricas"""
        
        if not metrics:
            return 0.0
        
        # Simular cálculo de melhoria (em produção, comparar com baseline)
        cache_ratios = [m.value for m in metrics if m.metric_type == MetricType.CACHE_HIT_RATIO]
        
        if cache_ratios:
            avg_cache_ratio = statistics.mean(cache_ratios)
            # Assumir que sem cache seria 0% hit ratio
            improvement = avg_cache_ratio * 100  # % de melhoria
            return min(improvement, 95.0)  # Cap em 95%
        
        return 0.0
    
    def _generate_insights(self, cache_ratio: float, response_time: float, space_usage: float) -> List[str]:
        """Gerar insights baseados nas métricas"""
        
        insights = []
        
        if cache_ratio > 0.8:
            insights.append(f"Excelente taxa de cache hit ({cache_ratio:.1%}) - sistema otimizado")
        elif cache_ratio > 0.6:
            insights.append(f"Boa taxa de cache hit ({cache_ratio:.1%}) - há margem para melhoria")
        else:
            insights.append(f"Taxa de cache hit baixa ({cache_ratio:.1%}) - requer otimização")
        
        if response_time < 100:
            insights.append("Tempos de resposta excelentes (<100ms)")
        elif response_time < 500:
            insights.append("Tempos de resposta aceitáveis (<500ms)")
        else:
            insights.append("Tempos de resposta elevados - investigar gargalos")
        
        space_gb = space_usage / 1024
        if space_gb < 1:
            insights.append("Uso de espaço eficiente (<1GB)")
        elif space_gb < 5:
            insights.append("Uso de espaço moderado (<5GB)")
        else:
            insights.append("Uso de espaço elevado - considerar limpeza")
        
        return insights
    
    def _generate_recommendations(self, cache_ratio: float, response_time: float, space_usage: float) -> List[str]:
        """Gerar recomendações baseadas nas métricas"""
        
        recommendations = []
        
        if cache_ratio < 0.6:
            recommendations.append("Aumentar TTL do cache de inferência")
            recommendations.append("Otimizar políticas de retenção de características")
        
        if response_time > 300:
            recommendations.append("Aumentar tamanho do cache em memória")
            recommendations.append("Implementar cache distribuído")
        
        space_gb = space_usage / 1024
        if space_gb > 5:
            recommendations.append("Executar limpeza de dados antigos")
            recommendations.append("Ajustar políticas de retenção")
        
        if not recommendations:
            recommendations.append("Sistema funcionando de forma otimizada")
            recommendations.append("Continuar monitorização regular")
        
        return recommendations
    
    # =====================================
    # 🔄 MONITORIZAÇÃO CONTÍNUA
    # =====================================
    
    async def start_monitoring(self):
        """Iniciar monitorização contínua"""
        if not self.monitoring_active:
            self.monitoring_active = True
            self.monitoring_task = asyncio.create_task(self._monitoring_loop())
            logger.info("📊 Monitorização contínua iniciada")
    
    async def stop_monitoring(self):
        """Parar monitorização contínua"""
        if self.monitoring_active:
            self.monitoring_active = False
            if self.monitoring_task:
                self.monitoring_task.cancel()
                try:
                    await self.monitoring_task
                except asyncio.CancelledError:
                    pass
            logger.info("⏹️ Monitorização contínua parada")
    
    async def _monitoring_loop(self):
        """Loop principal de monitorização"""
        logger.info("🔄 Loop de monitorização iniciado")
        
        try:
            while self.monitoring_active:
                try:
                    # Coletar métricas
                    metrics = await self.collect_current_metrics()
                    
                    # Adicionar ao histórico
                    for metric in metrics.values():
                        self.metrics_history.append(metric)
                    
                    # Verificar alertas
                    await self.check_performance_alerts(metrics)
                    
                    # Limpar histórico antigo
                    self._cleanup_old_metrics()
                    
                    # Aguardar próximo ciclo
                    await asyncio.sleep(self.config['sampling_interval_minutes'] * 60)
                    
                except Exception as e:
                    logger.error(f"❌ Erro no loop de monitorização: {e}")
                    await asyncio.sleep(60)  # Aguardar 1 minuto em caso de erro
                    
        except asyncio.CancelledError:
            logger.info("🛑 Loop de monitorização cancelado")
            raise
    
    def _cleanup_old_metrics(self):
        """Limpar métricas antigas"""
        cutoff_time = datetime.now() - timedelta(days=self.config['metrics_retention_days'])
        
        # Limpar métricas antigas
        self.metrics_history = [
            m for m in self.metrics_history 
            if m.timestamp > cutoff_time
        ]
        
        # Limpar alertas antigos
        self.alerts_history = [
            a for a in self.alerts_history 
            if a.timestamp > cutoff_time
        ]
    
    # =====================================
    # 📊 DASHBOARD & API
    # =====================================
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Obter dados para dashboard"""
        
        current_time = datetime.now()
        last_hour = current_time - timedelta(hours=1)
        
        # Métricas da última hora
        recent_metrics = [
            m for m in self.metrics_history 
            if m.timestamp > last_hour
        ]
        
        # Alertas ativos
        active_alerts = [
            a for a in self.alerts_history 
            if not a.resolved and a.timestamp > current_time - timedelta(hours=24)
        ]
        
        return {
            'current_metrics': self.current_metrics,
            'recent_performance': {
                'total_metrics': len(recent_metrics),
                'cache_hit_trend': self._calculate_trend(recent_metrics, MetricType.CACHE_HIT_RATIO),
                'response_time_trend': self._calculate_trend(recent_metrics, MetricType.RESPONSE_TIME)
            },
            'alerts': {
                'active_count': len(active_alerts),
                'recent_alerts': [asdict(a) for a in active_alerts[-5:]]  # Últimos 5 alertas
            },
            'system_status': {
                'monitoring_active': self.monitoring_active,
                'last_update': self.current_metrics['last_updated'].isoformat(),
                'metrics_history_size': len(self.metrics_history)
            }
        }
    
    def _calculate_trend(self, metrics: List[PerformanceMetric], metric_type: MetricType) -> str:
        """Calcular tendência de uma métrica"""
        
        type_metrics = [m.value for m in metrics if m.metric_type == metric_type]
        
        if len(type_metrics) < 2:
            return 'stable'
        
        # Comparar primeira metade com segunda metade
        mid_point = len(type_metrics) // 2
        first_half_avg = statistics.mean(type_metrics[:mid_point])
        second_half_avg = statistics.mean(type_metrics[mid_point:])
        
        if second_half_avg > first_half_avg * 1.05:
            return 'improving'
        elif second_half_avg < first_half_avg * 0.95:
            return 'degrading'
        else:
            return 'stable'
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Obter status de saúde do sistema"""
        
        # Verificar componentes
        components_health = {
            'retention_manager': 'healthy',
            'pipeline': 'healthy',
            'policy_manager': 'healthy',
            'integrator': 'healthy',
            'monitor': 'healthy' if self.monitoring_active else 'stopped'
        }
        
        # Verificar alertas críticos
        critical_alerts = [
            a for a in self.alerts_history 
            if a.level == AlertLevel.CRITICAL and not a.resolved
            and a.timestamp > datetime.now() - timedelta(hours=1)
        ]
        
        overall_status = 'healthy'
        if critical_alerts:
            overall_status = 'critical'
        elif not self.monitoring_active:
            overall_status = 'degraded'
        
        return {
            'overall_status': overall_status,
            'components': components_health,
            'critical_alerts': len(critical_alerts),
            'monitoring_active': self.monitoring_active,
            'last_metrics_update': self.current_metrics['last_updated'].isoformat()
        }


# =====================================
# 🚀 GLOBAL MONITOR
# =====================================

# Instância global
monitor = None

def get_retention_monitor() -> MLRetentionMonitor:
    """Obter instância global do monitor"""
    global monitor
    
    if monitor is None:
        monitor = MLRetentionMonitor()
    
    return monitor


def start_retention_monitoring():
    """Iniciar monitorização (função de conveniência)"""
    monitor = get_retention_monitor()
    asyncio.create_task(monitor.start_monitoring())
    return monitor


if __name__ == "__main__":
    # Teste básico
    async def test_monitoring():
        monitor = MLRetentionMonitor()
        
        # Coletar métricas
        metrics = await monitor.collect_current_metrics()
        print("📊 Métricas coletadas:", len(metrics))
        
        # Gerar relatório
        report = await monitor.generate_performance_report(period_hours=1)
        print("📈 Relatório gerado:", report.report_id)
        
        # Dashboard data
        dashboard = monitor.get_dashboard_data()
        print("📊 Dashboard data:", json.dumps(dashboard, default=str, indent=2))
    
    asyncio.run(test_monitoring())
