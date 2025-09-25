"""
Dashboard de Monitorização de Segurança para BGAPP
Sistema em tempo real para monitorizar todos os aspectos de segurança
"""

import json
import time
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
import threading
from collections import defaultdict, deque
import psutil
import os

class SecurityStatus(Enum):
    """Status de segurança"""
    SECURE = "secure"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"

class AlertLevel(Enum):
    """Níveis de alerta"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

@dataclass
class SecurityMetric:
    """Métrica de segurança"""
    name: str
    value: Any
    status: SecurityStatus
    timestamp: str
    description: str
    threshold: Optional[float] = None
    unit: Optional[str] = None

@dataclass
class SecurityAlert:
    """Alerta de segurança"""
    alert_id: str
    level: AlertLevel
    title: str
    description: str
    timestamp: str
    source: str
    resolved: bool = False
    details: Dict[str, Any] = None

class SecurityDashboard:
    """Dashboard principal de monitorização de segurança"""
    
    def __init__(self):
        self.start_time = datetime.now(timezone.utc)
        self.metrics_history = defaultdict(lambda: deque(maxlen=100))
        self.active_alerts = []
        self.resolved_alerts = deque(maxlen=1000)
        
        # Contadores
        self.counters = {
            'total_requests': 0,
            'failed_logins': 0,
            'security_violations': 0,
            'csrf_blocks': 0,
            'cors_violations': 0,
            'rate_limit_hits': 0
        }
        
        # Lock para thread safety
        self._lock = threading.Lock()
        
        # Configurações de thresholds
        self.thresholds = {
            'failed_login_rate': 10,  # por minuto
            'error_rate': 5,  # por minuto
            'response_time': 2000,  # ms
            'memory_usage': 80,  # %
            'disk_usage': 90,  # %
            'cpu_usage': 80  # %
        }
    
    def collect_system_metrics(self) -> List[SecurityMetric]:
        """Coletar métricas do sistema"""
        metrics = []
        timestamp = datetime.now(timezone.utc).isoformat()
        
        try:
            # Métricas de CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_status = SecurityStatus.CRITICAL if cpu_percent > self.thresholds['cpu_usage'] else \
                        SecurityStatus.WARNING if cpu_percent > 60 else SecurityStatus.SECURE
            
            metrics.append(SecurityMetric(
                name="cpu_usage",
                value=cpu_percent,
                status=cpu_status,
                timestamp=timestamp,
                description="Uso de CPU do sistema",
                threshold=self.thresholds['cpu_usage'],
                unit="%"
            ))
            
            # Métricas de memória
            memory = psutil.virtual_memory()
            memory_status = SecurityStatus.CRITICAL if memory.percent > self.thresholds['memory_usage'] else \
                           SecurityStatus.WARNING if memory.percent > 60 else SecurityStatus.SECURE
            
            metrics.append(SecurityMetric(
                name="memory_usage",
                value=memory.percent,
                status=memory_status,
                timestamp=timestamp,
                description="Uso de memória do sistema",
                threshold=self.thresholds['memory_usage'],
                unit="%"
            ))
            
            # Métricas de disco
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            disk_status = SecurityStatus.CRITICAL if disk_percent > self.thresholds['disk_usage'] else \
                         SecurityStatus.WARNING if disk_percent > 70 else SecurityStatus.SECURE
            
            metrics.append(SecurityMetric(
                name="disk_usage",
                value=disk_percent,
                status=disk_status,
                timestamp=timestamp,
                description="Uso de disco do sistema",
                threshold=self.thresholds['disk_usage'],
                unit="%"
            ))
            
        except Exception as e:
            metrics.append(SecurityMetric(
                name="system_metrics_error",
                value=str(e),
                status=SecurityStatus.CRITICAL,
                timestamp=timestamp,
                description="Erro ao coletar métricas do sistema"
            ))
        
        return metrics
    
    def collect_security_metrics(self) -> List[SecurityMetric]:
        """Coletar métricas específicas de segurança"""
        metrics = []
        timestamp = datetime.now(timezone.utc).isoformat()
        
        try:
            # Verificar arquivos de segurança
            security_files = {
                ".encryption_key": "Chave de encriptação",
                "secure_credentials.enc": "Credenciais encriptadas",
                ".env": "Variáveis de ambiente"
            }
            
            files_secure = 0
            files_total = len(security_files)
            
            for file_path, description in security_files.items():
                path = Path(file_path)
                if path.exists():
                    stat = path.stat()
                    permissions = oct(stat.st_mode)[-3:]
                    
                    if permissions in ['600', '400']:
                        files_secure += 1
            
            file_security_percent = (files_secure / files_total) * 100
            file_status = SecurityStatus.SECURE if file_security_percent == 100 else \
                         SecurityStatus.WARNING if file_security_percent >= 80 else SecurityStatus.CRITICAL
            
            metrics.append(SecurityMetric(
                name="file_permissions",
                value=file_security_percent,
                status=file_status,
                timestamp=timestamp,
                description=f"Arquivos com permissões seguras ({files_secure}/{files_total})",
                threshold=100,
                unit="%"
            ))
            
            # Verificar logs de auditoria
            audit_log_path = Path("logs/audit.log")
            if audit_log_path.exists():
                log_size = audit_log_path.stat().st_size
                log_age = time.time() - audit_log_path.stat().st_mtime
                
                log_status = SecurityStatus.SECURE if log_age < 3600 else \
                            SecurityStatus.WARNING if log_age < 86400 else SecurityStatus.CRITICAL
                
                metrics.append(SecurityMetric(
                    name="audit_log_health",
                    value=log_size,
                    status=log_status,
                    timestamp=timestamp,
                    description=f"Log de auditoria ativo (idade: {log_age/3600:.1f}h)",
                    unit="bytes"
                ))
            else:
                metrics.append(SecurityMetric(
                    name="audit_log_health",
                    value=0,
                    status=SecurityStatus.WARNING,
                    timestamp=timestamp,
                    description="Log de auditoria não encontrado"
                ))
            
            # Métricas de credenciais
            credentials_path = Path("secure_credentials.enc")
            if credentials_path.exists():
                cred_age = time.time() - credentials_path.stat().st_mtime
                cred_status = SecurityStatus.SECURE if cred_age < 86400 * 90 else SecurityStatus.WARNING
                
                metrics.append(SecurityMetric(
                    name="credentials_age",
                    value=cred_age / 86400,  # dias
                    status=cred_status,
                    timestamp=timestamp,
                    description="Idade das credenciais",
                    threshold=90,
                    unit="dias"
                ))
            
            # Contadores de segurança
            for counter_name, count in self.counters.items():
                counter_status = SecurityStatus.SECURE
                threshold = None
                
                if 'failed' in counter_name or 'violation' in counter_name:
                    threshold = 10
                    counter_status = SecurityStatus.CRITICAL if count > 50 else \
                                   SecurityStatus.WARNING if count > 10 else SecurityStatus.SECURE
                
                metrics.append(SecurityMetric(
                    name=counter_name,
                    value=count,
                    status=counter_status,
                    timestamp=timestamp,
                    description=f"Contador: {counter_name.replace('_', ' ').title()}",
                    threshold=threshold
                ))
            
        except Exception as e:
            metrics.append(SecurityMetric(
                name="security_metrics_error",
                value=str(e),
                status=SecurityStatus.CRITICAL,
                timestamp=timestamp,
                description="Erro ao coletar métricas de segurança"
            ))
        
        return metrics
    
    def update_metrics(self):
        """Atualizar todas as métricas"""
        with self._lock:
            # Coletar métricas
            system_metrics = self.collect_system_metrics()
            security_metrics = self.collect_security_metrics()
            
            all_metrics = system_metrics + security_metrics
            
            # Armazenar no histórico
            for metric in all_metrics:
                self.metrics_history[metric.name].append({
                    'value': metric.value,
                    'status': metric.status.value,
                    'timestamp': metric.timestamp
                })
            
            # Verificar se devemos gerar alertas
            self._check_for_alerts(all_metrics)
            
            return all_metrics
    
    def _check_for_alerts(self, metrics: List[SecurityMetric]):
        """Verificar se métricas geram alertas"""
        for metric in metrics:
            if metric.status == SecurityStatus.CRITICAL:
                self._create_alert(
                    level=AlertLevel.CRITICAL,
                    title=f"Métrica crítica: {metric.name}",
                    description=f"{metric.description}: {metric.value}",
                    source="system_monitor"
                )
            elif metric.status == SecurityStatus.WARNING:
                # Verificar se já existe alerta similar recente
                recent_alerts = [a for a in self.active_alerts 
                               if a.source == "system_monitor" and metric.name in a.title 
                               and (datetime.now(timezone.utc) - datetime.fromisoformat(a.timestamp)).seconds < 300]
                
                if not recent_alerts:
                    self._create_alert(
                        level=AlertLevel.WARNING,
                        title=f"Métrica em aviso: {metric.name}",
                        description=f"{metric.description}: {metric.value}",
                        source="system_monitor"
                    )
    
    def _create_alert(self, level: AlertLevel, title: str, description: str, source: str, details: Dict = None):
        """Criar novo alerta"""
        alert = SecurityAlert(
            alert_id=f"alert_{int(time.time())}_{len(self.active_alerts)}",
            level=level,
            title=title,
            description=description,
            timestamp=datetime.now(timezone.utc).isoformat(),
            source=source,
            details=details or {}
        )
        
        self.active_alerts.append(alert)
        
        # Limitar número de alertas ativos
        if len(self.active_alerts) > 100:
            oldest = self.active_alerts.pop(0)
            oldest.resolved = True
            self.resolved_alerts.append(oldest)
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Obter dados completos do dashboard"""
        with self._lock:
            # Métricas atuais
            current_metrics = self.update_metrics()
            
            # Calcular score geral
            overall_score = self._calculate_overall_score(current_metrics)
            
            # Estatísticas de alertas
            alert_stats = {
                'total_active': len(self.active_alerts),
                'critical': len([a for a in self.active_alerts if a.level == AlertLevel.CRITICAL]),
                'warning': len([a for a in self.active_alerts if a.level == AlertLevel.WARNING]),
                'info': len([a for a in self.active_alerts if a.level == AlertLevel.INFO])
            }
            
            # Uptime
            uptime = datetime.now(timezone.utc) - self.start_time
            
            return {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'uptime_seconds': uptime.total_seconds(),
                'overall_score': overall_score,
                'metrics': [asdict(metric) for metric in current_metrics],
                'alerts': {
                    'active': [asdict(alert) for alert in self.active_alerts[-10:]],  # Últimos 10
                    'stats': alert_stats
                },
                'counters': self.counters.copy(),
                'system_info': {
                    'python_version': f"{psutil.version_info}",
                    'platform': os.name,
                    'hostname': os.uname().nodename if hasattr(os, 'uname') else 'unknown'
                }
            }
    
    def _calculate_overall_score(self, metrics: List[SecurityMetric]) -> float:
        """Calcular score geral de segurança"""
        if not metrics:
            return 0.0
        
        # Pesos por categoria
        category_weights = {
            'cpu_usage': 1.0,
            'memory_usage': 1.0,
            'disk_usage': 1.0,
            'file_permissions': 3.0,  # Mais importante
            'audit_log_health': 2.0,
            'credentials_age': 2.0,
            'failed_logins': 3.0,  # Crítico
            'security_violations': 4.0  # Muito crítico
        }
        
        total_weight = 0
        weighted_score = 0
        
        for metric in metrics:
            weight = category_weights.get(metric.name, 1.0)
            total_weight += weight
            
            # Converter status para score
            if metric.status == SecurityStatus.SECURE:
                score = 10.0
            elif metric.status == SecurityStatus.WARNING:
                score = 6.0
            elif metric.status == SecurityStatus.CRITICAL:
                score = 2.0
            else:
                score = 5.0  # UNKNOWN
            
            weighted_score += score * weight
        
        if total_weight == 0:
            return 0.0
        
        return weighted_score / total_weight
    
    def increment_counter(self, counter_name: str, amount: int = 1):
        """Incrementar contador de segurança"""
        with self._lock:
            if counter_name in self.counters:
                self.counters[counter_name] += amount
    
    def record_security_event(self, event_type: str, severity: str, details: Dict[str, Any] = None):
        """Registrar evento de segurança"""
        with self._lock:
            # Incrementar contador apropriado
            if 'login' in event_type and 'fail' in event_type:
                self.increment_counter('failed_logins')
            elif 'security' in event_type:
                self.increment_counter('security_violations')
            elif 'csrf' in event_type:
                self.increment_counter('csrf_blocks')
            elif 'cors' in event_type:
                self.increment_counter('cors_violations')
            elif 'rate_limit' in event_type:
                self.increment_counter('rate_limit_hits')
            
            # Criar alerta se necessário
            if severity in ['error', 'critical']:
                self._create_alert(
                    level=AlertLevel.CRITICAL if severity == 'critical' else AlertLevel.WARNING,
                    title=f"Evento de segurança: {event_type}",
                    description=f"Evento detectado: {event_type}",
                    source="security_monitor",
                    details=details
                )
    
    def get_security_summary(self) -> Dict[str, Any]:
        """Obter resumo de segurança"""
        dashboard_data = self.get_dashboard_data()
        
        # Contar métricas por status
        metrics_by_status = defaultdict(int)
        for metric in dashboard_data['metrics']:
            metrics_by_status[metric['status']] += 1
        
        # Calcular tendência (últimos 10 minutos)
        recent_threshold = datetime.now(timezone.utc) - timedelta(minutes=10)
        recent_violations = sum(1 for alert in self.active_alerts 
                              if datetime.fromisoformat(alert.timestamp) > recent_threshold)
        
        return {
            'overall_score': dashboard_data['overall_score'],
            'status': self._get_overall_status(dashboard_data['overall_score']),
            'metrics_summary': dict(metrics_by_status),
            'active_alerts': dashboard_data['alerts']['stats']['total_active'],
            'critical_alerts': dashboard_data['alerts']['stats']['critical'],
            'recent_violations': recent_violations,
            'uptime_hours': dashboard_data['uptime_seconds'] / 3600,
            'last_updated': dashboard_data['timestamp']
        }
    
    def _get_overall_status(self, score: float) -> str:
        """Determinar status geral baseado no score"""
        if score >= 9.0:
            return "excellent"
        elif score >= 7.0:
            return "good"
        elif score >= 5.0:
            return "warning"
        else:
            return "critical"
    
    def resolve_alert(self, alert_id: str) -> bool:
        """Resolver alerta"""
        with self._lock:
            for i, alert in enumerate(self.active_alerts):
                if alert.alert_id == alert_id:
                    alert.resolved = True
                    resolved_alert = self.active_alerts.pop(i)
                    self.resolved_alerts.append(resolved_alert)
                    return True
            return False
    
    def export_metrics(self, hours: int = 24) -> Dict[str, Any]:
        """Exportar métricas históricas"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        exported_metrics = {}
        
        with self._lock:
            for metric_name, history in self.metrics_history.items():
                exported_metrics[metric_name] = [
                    entry for entry in history
                    if datetime.fromisoformat(entry['timestamp']) > cutoff_time
                ]
        
        return {
            'export_timestamp': datetime.now(timezone.utc).isoformat(),
            'period_hours': hours,
            'metrics': exported_metrics,
            'summary': self.get_security_summary()
        }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Obter status de saúde do sistema de segurança"""
        try:
            dashboard_data = self.get_dashboard_data()
            score = dashboard_data['overall_score']
            
            # Verificar componentes críticos
            critical_components = {
                'credentials_system': Path("secure_credentials.enc").exists(),
                'encryption_key': Path(".encryption_key").exists(),
                'audit_logging': Path("logs").exists(),
                'security_config': Path("src/bgapp/core/secure_config.py").exists()
            }
            
            components_healthy = sum(critical_components.values())
            total_components = len(critical_components)
            
            health_percentage = (components_healthy / total_components) * 100
            
            return {
                'overall_health': health_percentage,
                'security_score': score,
                'status': self._get_overall_status(score),
                'components': critical_components,
                'active_alerts': len(self.active_alerts),
                'uptime_hours': (datetime.now(timezone.utc) - self.start_time).total_seconds() / 3600,
                'last_check': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            return {
                'overall_health': 0,
                'security_score': 0,
                'status': 'error',
                'error': str(e),
                'last_check': datetime.now(timezone.utc).isoformat()
            }

# Instância global
_security_dashboard = None
_dashboard_lock = threading.Lock()

def get_security_dashboard() -> SecurityDashboard:
    """Obter instância global do dashboard"""
    global _security_dashboard
    
    if _security_dashboard is None:
        with _dashboard_lock:
            if _security_dashboard is None:
                _security_dashboard = SecurityDashboard()
    
    return _security_dashboard

# Funções convenientes
def record_security_event(event_type: str, severity: str = "info", details: Dict[str, Any] = None):
    """Registrar evento de segurança no dashboard"""
    dashboard = get_security_dashboard()
    dashboard.record_security_event(event_type, severity, details)

def get_security_health() -> Dict[str, Any]:
    """Obter status de saúde da segurança"""
    dashboard = get_security_dashboard()
    return dashboard.get_health_status()

def get_security_summary() -> Dict[str, Any]:
    """Obter resumo de segurança"""
    dashboard = get_security_dashboard()
    return dashboard.get_security_summary()

if __name__ == "__main__":
    # Teste do dashboard
    print("📊 Teste do Dashboard de Segurança")
    print("=" * 50)
    
    dashboard = SecurityDashboard()
    
    # Simular alguns eventos
    print("\n📝 Simulando eventos de segurança...")
    dashboard.record_security_event("login_failed", "warning", {"ip": "192.168.1.100"})
    dashboard.record_security_event("csrf_blocked", "error", {"endpoint": "/api/admin"})
    dashboard.record_security_event("data_access", "info", {"resource": "/api/users"})
    
    # Obter dados do dashboard
    print("\n📊 Coletando métricas...")
    dashboard_data = dashboard.get_dashboard_data()
    
    print(f"✅ Score geral: {dashboard_data['overall_score']:.1f}/10")
    print(f"📈 Métricas coletadas: {len(dashboard_data['metrics'])}")
    print(f"🚨 Alertas ativos: {len(dashboard_data['alerts']['active'])}")
    print(f"⏱️ Uptime: {dashboard_data['uptime_seconds']:.1f}s")
    
    # Mostrar algumas métricas
    print("\n📋 Métricas principais:")
    for metric in dashboard_data['metrics'][:5]:
        status_emoji = {
            'secure': '✅',
            'warning': '⚠️',
            'critical': '🚨',
            'unknown': '❓'
        }
        emoji = status_emoji.get(metric['status'], '❓')
        print(f"   {emoji} {metric['name']}: {metric['value']} {metric.get('unit', '')}")
    
    # Health status
    print("\n🏥 Status de saúde:")
    health = dashboard.get_health_status()
    print(f"   Saúde geral: {health['overall_health']:.1f}%")
    print(f"   Score: {health['security_score']:.1f}/10")
    print(f"   Status: {health['status']}")
    
    print("\n✅ Teste do dashboard concluído!")
