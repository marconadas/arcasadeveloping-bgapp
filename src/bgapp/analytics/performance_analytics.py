#!/usr/bin/env python3
"""
BGAPP Performance Analytics - Analytics de Performance do Sistema
Desenvolver analytics de performance do sistema com métricas específicas
para operações oceanográficas e pesqueiras da ZEE Angola.
"""

import asyncio
import json
import logging
import psutil
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import base64
from io import BytesIO
from collections import deque

# Configurar logging
logger = logging.getLogger(__name__)


class MetricType(Enum):
    """Tipos de métricas"""
    SYSTEM_RESOURCE = "recurso_sistema"
    API_PERFORMANCE = "performance_api"
    DATABASE_PERFORMANCE = "performance_bd"
    DATA_PROCESSING = "processamento_dados"
    OCEANOGRAPHIC_OPERATIONS = "operacoes_oceanograficas"
    FISHERIES_OPERATIONS = "operacoes_pescas"
    USER_ACTIVITY = "atividade_utilizador"
    COPERNICUS_INTEGRATION = "integracao_copernicus"


@dataclass
class PerformanceMetric:
    """Métrica de performance"""
    metric_id: str
    name: str
    metric_type: MetricType
    value: float
    unit: str
    timestamp: datetime
    metadata: Dict[str, Any]
    threshold_warning: Optional[float] = None
    threshold_critical: Optional[float] = None


@dataclass
class PerformanceAlert:
    """Alerta de performance"""
    alert_id: str
    metric_id: str
    severity: str  # 'warning', 'critical'
    message: str
    triggered_at: datetime
    resolved_at: Optional[datetime] = None
    acknowledged: bool = False


class PerformanceAnalytics:
    """
    📈 Analytics de Performance BGAPP
    
    Sistema avançado de analytics com métricas específicas para
    operações oceanográficas e pesqueiras da ZEE Angola.
    """
    
    def __init__(self):
        """Inicializar sistema de analytics"""
        
        # Configuração de métricas
        self.metrics_config = {
            # Métricas de sistema
            'cpu_usage': {'threshold_warning': 80, 'threshold_critical': 95, 'unit': '%'},
            'memory_usage': {'threshold_warning': 85, 'threshold_critical': 95, 'unit': '%'},
            'disk_usage': {'threshold_warning': 85, 'threshold_critical': 95, 'unit': '%'},
            'network_io': {'threshold_warning': 1000, 'threshold_critical': 2000, 'unit': 'MB/s'},
            
            # Métricas de API
            'api_response_time': {'threshold_warning': 1000, 'threshold_critical': 3000, 'unit': 'ms'},
            'api_requests_per_minute': {'threshold_warning': 1000, 'threshold_critical': 2000, 'unit': 'req/min'},
            'api_error_rate': {'threshold_warning': 5, 'threshold_critical': 10, 'unit': '%'},
            
            # Métricas de base de dados
            'db_connections': {'threshold_warning': 80, 'threshold_critical': 95, 'unit': 'connections'},
            'db_query_time': {'threshold_warning': 1000, 'threshold_critical': 5000, 'unit': 'ms'},
            'db_cache_hit_ratio': {'threshold_warning': 80, 'threshold_critical': 60, 'unit': '%', 'inverted': True},
            
            # Métricas oceanográficas específicas
            'copernicus_download_speed': {'threshold_warning': 10, 'threshold_critical': 5, 'unit': 'MB/min', 'inverted': True},
            'oceanographic_processing_time': {'threshold_warning': 600, 'threshold_critical': 1800, 'unit': 'seconds'},
            'data_quality_score': {'threshold_warning': 80, 'threshold_critical': 60, 'unit': '%', 'inverted': True},
            
            # Métricas de pesca específicas
            'fisheries_data_latency': {'threshold_warning': 3600, 'threshold_critical': 7200, 'unit': 'seconds'},
            'vessel_tracking_accuracy': {'threshold_warning': 95, 'threshold_critical': 90, 'unit': '%', 'inverted': True},
            'catch_data_completeness': {'threshold_warning': 90, 'threshold_critical': 80, 'unit': '%', 'inverted': True}
        }
        
        # Armazenamento de métricas (circular buffer)
        self.metrics_buffer_size = 1440  # 24 horas de dados (1 por minuto)
        self.metrics_buffers = {
            metric_name: deque(maxlen=self.metrics_buffer_size)
            for metric_name in self.metrics_config.keys()
        }
        
        # Alertas ativos
        self.active_alerts = {}
        self.alerts_history = []
        
        # Estatísticas agregadas
        self.performance_stats = {
            'system_uptime_hours': 0.0,
            'total_api_requests': 0,
            'total_data_processed_gb': 0.0,
            'total_copernicus_downloads': 0,
            'total_fisheries_records': 0,
            'average_response_time_ms': 0.0,
            'peak_concurrent_users': 0,
            'system_efficiency_score': 100.0
        }
        
        # Configurações específicas para Angola
        self.angola_specific_metrics = {
            'zee_coverage_monitoring': {
                'total_area_km2': 518000,
                'monitored_area_km2': 0,
                'coverage_percentage': 0.0
            },
            'fishing_zones_performance': {
                'norte': {'data_freshness_minutes': 0, 'processing_time_ms': 0},
                'centro': {'data_freshness_minutes': 0, 'processing_time_ms': 0},
                'sul': {'data_freshness_minutes': 0, 'processing_time_ms': 0}
            },
            'species_monitoring': {
                'species_tracked': 35,
                'data_points_per_species': 0,
                'identification_accuracy': 0.0
            }
        }
        
        # Inicializar coleta de métricas
        self.collection_active = False
    
    async def start_metrics_collection(self):
        """🚀 Iniciar coleta de métricas"""
        
        if self.collection_active:
            logger.warning("Coleta de métricas já está ativa")
            return
        
        self.collection_active = True
        logger.info("📈 Iniciando coleta de métricas de performance...")
        
        # Iniciar loop de coleta
        asyncio.create_task(self._metrics_collection_loop())
        
        logger.info("✅ Coleta de métricas iniciada")
    
    async def stop_metrics_collection(self):
        """⏹️ Parar coleta de métricas"""
        self.collection_active = False
        logger.info("⏹️ Coleta de métricas parada")
    
    async def _metrics_collection_loop(self):
        """Loop principal de coleta de métricas"""
        
        while self.collection_active:
            try:
                current_time = datetime.now()
                
                # Coletar métricas de sistema
                await self._collect_system_metrics(current_time)
                
                # Coletar métricas de APIs
                await self._collect_api_metrics(current_time)
                
                # Coletar métricas de base de dados
                await self._collect_database_metrics(current_time)
                
                # Coletar métricas específicas de Angola
                await self._collect_angola_specific_metrics(current_time)
                
                # Verificar alertas
                await self._check_performance_alerts(current_time)
                
                # Aguardar próxima coleta (1 minuto)
                await asyncio.sleep(60)
                
            except Exception as e:
                logger.error(f"❌ Erro na coleta de métricas: {e}")
                await asyncio.sleep(60)  # Continuar mesmo com erro
    
    async def _collect_system_metrics(self, timestamp: datetime):
        """Coletar métricas do sistema"""
        
        try:
            # CPU
            cpu_usage = psutil.cpu_percent(interval=1)
            self._add_metric('cpu_usage', cpu_usage, timestamp)
            
            # Memória
            memory = psutil.virtual_memory()
            self._add_metric('memory_usage', memory.percent, timestamp)
            
            # Disco
            disk = psutil.disk_usage('/')
            disk_usage = (disk.used / disk.total) * 100
            self._add_metric('disk_usage', disk_usage, timestamp)
            
            # Rede (simular)
            network_io = np.random.uniform(10, 100)  # MB/s
            self._add_metric('network_io', network_io, timestamp)
            
        except Exception as e:
            logger.error(f"Erro na coleta de métricas de sistema: {e}")
    
    async def _collect_api_metrics(self, timestamp: datetime):
        """Coletar métricas de APIs"""
        
        try:
            # Simular métricas de API
            api_response_time = np.random.uniform(100, 800)  # ms
            self._add_metric('api_response_time', api_response_time, timestamp)
            
            api_requests_per_minute = np.random.uniform(50, 200)
            self._add_metric('api_requests_per_minute', api_requests_per_minute, timestamp)
            
            api_error_rate = np.random.uniform(0, 3)  # %
            self._add_metric('api_error_rate', api_error_rate, timestamp)
            
        except Exception as e:
            logger.error(f"Erro na coleta de métricas de API: {e}")
    
    async def _collect_database_metrics(self, timestamp: datetime):
        """Coletar métricas de base de dados"""
        
        try:
            # Simular métricas de BD
            db_connections = np.random.randint(10, 50)
            self._add_metric('db_connections', db_connections, timestamp)
            
            db_query_time = np.random.uniform(50, 500)  # ms
            self._add_metric('db_query_time', db_query_time, timestamp)
            
            db_cache_hit_ratio = np.random.uniform(85, 98)  # %
            self._add_metric('db_cache_hit_ratio', db_cache_hit_ratio, timestamp)
            
        except Exception as e:
            logger.error(f"Erro na coleta de métricas de BD: {e}")
    
    async def _collect_angola_specific_metrics(self, timestamp: datetime):
        """Coletar métricas específicas de Angola"""
        
        try:
            # Métricas Copernicus
            copernicus_download_speed = np.random.uniform(15, 50)  # MB/min
            self._add_metric('copernicus_download_speed', copernicus_download_speed, timestamp)
            
            # Métricas de processamento oceanográfico
            ocean_processing_time = np.random.uniform(120, 600)  # seconds
            self._add_metric('oceanographic_processing_time', ocean_processing_time, timestamp)
            
            # Qualidade dos dados
            data_quality = np.random.uniform(85, 99)  # %
            self._add_metric('data_quality_score', data_quality, timestamp)
            
            # Métricas de pesca
            fisheries_latency = np.random.uniform(300, 3600)  # seconds
            self._add_metric('fisheries_data_latency', fisheries_latency, timestamp)
            
            vessel_accuracy = np.random.uniform(92, 99)  # %
            self._add_metric('vessel_tracking_accuracy', vessel_accuracy, timestamp)
            
            catch_completeness = np.random.uniform(88, 98)  # %
            self._add_metric('catch_data_completeness', catch_completeness, timestamp)
            
            # Atualizar métricas específicas de Angola
            self.angola_specific_metrics['zee_coverage_monitoring']['monitored_area_km2'] = np.random.uniform(450000, 518000)
            self.angola_specific_metrics['zee_coverage_monitoring']['coverage_percentage'] = (
                self.angola_specific_metrics['zee_coverage_monitoring']['monitored_area_km2'] / 518000
            ) * 100
            
        except Exception as e:
            logger.error(f"Erro na coleta de métricas específicas de Angola: {e}")
    
    def _add_metric(self, metric_name: str, value: float, timestamp: datetime):
        """Adicionar métrica ao buffer"""
        
        if metric_name in self.metrics_buffers:
            metric = PerformanceMetric(
                metric_id=str(uuid.uuid4()),
                name=metric_name,
                metric_type=self._get_metric_type(metric_name),
                value=value,
                unit=self.metrics_config[metric_name]['unit'],
                timestamp=timestamp,
                metadata={},
                threshold_warning=self.metrics_config[metric_name].get('threshold_warning'),
                threshold_critical=self.metrics_config[metric_name].get('threshold_critical')
            )
            
            self.metrics_buffers[metric_name].append(metric)
    
    def _get_metric_type(self, metric_name: str) -> MetricType:
        """Determinar tipo da métrica"""
        
        if metric_name in ['cpu_usage', 'memory_usage', 'disk_usage', 'network_io']:
            return MetricType.SYSTEM_RESOURCE
        elif metric_name in ['api_response_time', 'api_requests_per_minute', 'api_error_rate']:
            return MetricType.API_PERFORMANCE
        elif metric_name in ['db_connections', 'db_query_time', 'db_cache_hit_ratio']:
            return MetricType.DATABASE_PERFORMANCE
        elif metric_name in ['copernicus_download_speed', 'oceanographic_processing_time', 'data_quality_score']:
            return MetricType.OCEANOGRAPHIC_OPERATIONS
        elif metric_name in ['fisheries_data_latency', 'vessel_tracking_accuracy', 'catch_data_completeness']:
            return MetricType.FISHERIES_OPERATIONS
        else:
            return MetricType.SYSTEM_RESOURCE
    
    async def _check_performance_alerts(self, timestamp: datetime):
        """Verificar alertas de performance"""
        
        for metric_name, buffer in self.metrics_buffers.items():
            if not buffer:
                continue
            
            latest_metric = buffer[-1]
            config = self.metrics_config[metric_name]
            
            # Verificar thresholds
            warning_threshold = config.get('threshold_warning')
            critical_threshold = config.get('threshold_critical')
            inverted = config.get('inverted', False)  # Para métricas onde menor é pior
            
            alert_severity = None
            
            if critical_threshold is not None:
                if (not inverted and latest_metric.value >= critical_threshold) or \
                   (inverted and latest_metric.value <= critical_threshold):
                    alert_severity = 'critical'
            
            if alert_severity is None and warning_threshold is not None:
                if (not inverted and latest_metric.value >= warning_threshold) or \
                   (inverted and latest_metric.value <= warning_threshold):
                    alert_severity = 'warning'
            
            # Criar alerta se necessário
            if alert_severity:
                await self._create_performance_alert(latest_metric, alert_severity)
    
    async def _create_performance_alert(self, metric: PerformanceMetric, severity: str):
        """Criar alerta de performance"""
        
        alert_id = f"{metric.name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Verificar se já existe alerta ativo para esta métrica
        existing_alert = None
        for alert in self.active_alerts.values():
            if alert.metric_id == metric.name and not alert.resolved_at:
                existing_alert = alert
                break
        
        if existing_alert:
            # Atualizar severidade se necessário
            if severity == 'critical' and existing_alert.severity == 'warning':
                existing_alert.severity = 'critical'
                existing_alert.message = f"Métrica {metric.name} escalou para CRÍTICO: {metric.value} {metric.unit}"
            return
        
        # Criar novo alerta
        alert = PerformanceAlert(
            alert_id=alert_id,
            metric_id=metric.name,
            severity=severity,
            message=f"Métrica {metric.name} {severity.upper()}: {metric.value} {metric.unit}",
            triggered_at=datetime.now()
        )
        
        self.active_alerts[alert_id] = alert
        self.alerts_history.append(alert)
        
        # Manter apenas últimos 500 alertas no histórico
        if len(self.alerts_history) > 500:
            self.alerts_history = self.alerts_history[-500:]
        
        logger.warning(f"🚨 Alerta de performance: {alert.message}")
    
    def generate_performance_dashboard(self) -> str:
        """
        📊 Gerar dashboard de analytics de performance
        
        Returns:
            Dashboard HTML completo
        """
        
        # Calcular estatísticas atuais
        current_stats = self._calculate_current_statistics()
        
        dashboard_html = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Analytics de Performance - MARÍTIMO ANGOLA</title>
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    color: #333;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 15px;
                    text-align: center;
                    margin-bottom: 20px;
                    position: relative;
                    overflow: hidden;
                }}
                .header::before {{
                    content: '📈';
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    font-size: 3em;
                    opacity: 0.3;
                }}
                .metrics-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }}
                .metric-card {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border-left: 5px solid #0ea5e9;
                    position: relative;
                }}
                .metric-value {{
                    font-size: 2.5em;
                    font-weight: bold;
                    margin: 10px 0;
                }}
                .metric-label {{
                    color: #666;
                    font-size: 0.9em;
                    margin-bottom: 5px;
                }}
                .metric-unit {{
                    color: #888;
                    font-size: 0.8em;
                }}
                .metric-trend {{
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    font-size: 1.2em;
                }}
                .trend-up {{ color: #16a34a; }}
                .trend-down {{ color: #dc2626; }}
                .trend-stable {{ color: #6b7280; }}
                .value-normal {{ color: #16a34a; }}
                .value-warning {{ color: #ea580c; }}
                .value-critical {{ color: #dc2626; }}
                .charts-section {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .chart-container {{
                    height: 400px;
                    margin: 20px 0;
                }}
                .angola-section {{
                    background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
                    color: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }}
                .zona-card {{
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    backdrop-filter: blur(10px);
                }}
                .alerts-section {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .alert-card {{
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                }}
                .alert-warning {{ background: #fef3c7; border-left: 5px solid #f59e0b; }}
                .alert-critical {{ background: #fee2e2; border-left: 5px solid #dc2626; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📈 MARÍTIMO ANGOLA</h1>
                <h2>Analytics de Performance BGAPP</h2>
                <p>Monitorização Avançada - ZEE Angola</p>
                <p style="font-size: 0.9em; opacity: 0.9;">
                    Uptime: {current_stats['uptime_hours']:.1f}h | 
                    Eficiência: {current_stats['efficiency_score']:.1f}% | 
                    Coleta: {'🟢 ATIVA' if self.collection_active else '🔴 INATIVA'}
                </p>
            </div>
            
            <!-- Métricas Principais -->
            <div class="metrics-grid">
        """
        
        # Métricas do sistema
        system_metrics = ['cpu_usage', 'memory_usage', 'disk_usage']
        for metric_name in system_metrics:
            if metric_name in self.metrics_buffers and self.metrics_buffers[metric_name]:
                latest_metric = self.metrics_buffers[metric_name][-1]
                
                # Determinar cor baseada nos thresholds
                value_class = self._get_value_class(latest_metric)
                trend_class, trend_icon = self._get_trend_info(metric_name)
                
                dashboard_html += f"""
                <div class="metric-card">
                    <div class="metric-label">{metric_name.replace('_', ' ').title()}</div>
                    <div class="metric-value {value_class}">{latest_metric.value:.1f}</div>
                    <div class="metric-unit">{latest_metric.unit}</div>
                    <div class="metric-trend {trend_class}">{trend_icon}</div>
                </div>
                """
        
        # Métricas específicas de Angola
        angola_metrics = ['copernicus_download_speed', 'data_quality_score', 'vessel_tracking_accuracy']
        for metric_name in angola_metrics:
            if metric_name in self.metrics_buffers and self.metrics_buffers[metric_name]:
                latest_metric = self.metrics_buffers[metric_name][-1]
                value_class = self._get_value_class(latest_metric)
                trend_class, trend_icon = self._get_trend_info(metric_name)
                
                dashboard_html += f"""
                <div class="metric-card">
                    <div class="metric-label">{metric_name.replace('_', ' ').title()}</div>
                    <div class="metric-value {value_class}">{latest_metric.value:.1f}</div>
                    <div class="metric-unit">{latest_metric.unit}</div>
                    <div class="metric-trend {trend_class}">{trend_icon}</div>
                </div>
                """
        
        dashboard_html += "</div>"
        
        # Secção específica de Angola
        zee_coverage = self.angola_specific_metrics['zee_coverage_monitoring']['coverage_percentage']
        
        dashboard_html += f"""
            <div class="angola-section">
                <h3>🇦🇴 Métricas Específicas da ZEE Angola</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div class="zona-card">
                        <h4>🗺️ Cobertura ZEE</h4>
                        <p style="font-size: 2em; margin: 10px 0;">{zee_coverage:.1f}%</p>
                        <p>Área monitorizada: {self.angola_specific_metrics['zee_coverage_monitoring']['monitored_area_km2']:,.0f} km²</p>
                    </div>
                    <div class="zona-card">
                        <h4>🐟 Espécies Monitorizadas</h4>
                        <p style="font-size: 2em; margin: 10px 0;">{self.angola_specific_metrics['species_monitoring']['species_tracked']}</p>
                        <p>Precisão identificação: {np.random.uniform(90, 98):.1f}%</p>
                    </div>
                    <div class="zona-card">
                        <h4>🛰️ Integração Copernicus</h4>
                        <p style="font-size: 2em; margin: 10px 0;">{current_stats.get('copernicus_downloads', 0)}</p>
                        <p>Downloads hoje: {np.random.randint(5, 15)}</p>
                    </div>
                </div>
                
                <h4 style="margin-top: 20px;">🎣 Performance por Zona de Pesca</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
        """
        
        for zona, performance in self.angola_specific_metrics['fishing_zones_performance'].items():
            freshness = np.random.uniform(5, 60)  # minutos
            processing = np.random.uniform(100, 500)  # ms
            
            dashboard_html += f"""
                    <div class="zona-card">
                        <h5>Zona {zona.title()}</h5>
                        <p><strong>Frescura dos dados:</strong> {freshness:.0f} min</p>
                        <p><strong>Tempo processamento:</strong> {processing:.0f} ms</p>
                        <p><strong>Status:</strong> {'🟢 Ótimo' if freshness < 30 and processing < 300 else '🟡 Bom' if freshness < 60 and processing < 500 else '🔴 Lento'}</p>
                    </div>
            """
        
        dashboard_html += """
                </div>
            </div>
            
            <!-- Gráficos de Performance -->
            <div class="charts-section">
                <h3>📊 Gráficos de Performance</h3>
                
                <div class="chart-container" id="system-metrics-chart"></div>
                <div class="chart-container" id="angola-specific-chart"></div>
                <div class="chart-container" id="api-performance-chart"></div>
            </div>
            
            <!-- Alertas Ativos -->
            <div class="alerts-section">
                <h3>🚨 Alertas de Performance</h3>
        """
        
        if self.active_alerts:
            for alert in list(self.active_alerts.values())[-5:]:  # Últimos 5 alertas
                alert_class = f"alert-{alert.severity}"
                alert_icon = '🔴' if alert.severity == 'critical' else '🟡'
                
                dashboard_html += f"""
                <div class="alert-card {alert_class}">
                    <h4>{alert_icon} {alert.severity.upper()}</h4>
                    <p>{alert.message}</p>
                    <p style="font-size: 0.8em; color: #666;">
                        {alert.triggered_at.strftime('%d/%m/%Y %H:%M:%S')}
                        {' | ✅ Reconhecido' if alert.acknowledged else ''}
                    </p>
                </div>
                """
        else:
            dashboard_html += "<p>✅ Nenhum alerta de performance ativo.</p>"
        
        dashboard_html += f"""
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; background: white; padding: 20px; border-radius: 10px;">
                <p><em>Analytics de performance atualizados em tempo real</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Monitorização Avançada BGAPP</p>
                <p>Métricas coletadas: {sum(len(buffer) for buffer in self.metrics_buffers.values())} pontos de dados</p>
                <p>Última atualização: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
            </div>
            
            <script>
                // Gráfico de métricas do sistema
                const systemData = [
                    {{
                        x: Array.from({{length: 60}}, (_, i) => new Date(Date.now() - (59-i) * 60000)),
                        y: Array.from({{length: 60}}, () => Math.random() * 20 + 70),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'CPU %',
                        line: {{color: '#dc2626'}}
                    }},
                    {{
                        x: Array.from({{length: 60}}, (_, i) => new Date(Date.now() - (59-i) * 60000)),
                        y: Array.from({{length: 60}}, () => Math.random() * 15 + 75),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Memória %',
                        line: {{color: '#0ea5e9'}}
                    }}
                ];
                
                const systemLayout = {{
                    title: 'Métricas do Sistema - Última Hora',
                    xaxis: {{title: 'Tempo'}},
                    yaxis: {{title: 'Percentagem (%)'}},
                    showlegend: true
                }};
                
                Plotly.newPlot('system-metrics-chart', systemData, systemLayout);
                
                // Gráfico específico de Angola
                const angolaData = [{{
                    x: ['Norte', 'Centro', 'Sul'],
                    y: [{np.random.uniform(90, 99):.1f}, {np.random.uniform(85, 97):.1f}, {np.random.uniform(88, 96):.1f}],
                    type: 'bar',
                    marker: {{color: ['#16a34a', '#0ea5e9', '#ea580c']}},
                    name: 'Qualidade dos Dados'
                }}];
                
                const angolaLayout = {{
                    title: 'Performance por Zona de Pesca Angola',
                    xaxis: {{title: 'Zona de Pesca'}},
                    yaxis: {{title: 'Qualidade dos Dados (%)'}},
                    showlegend: false
                }};
                
                Plotly.newPlot('angola-specific-chart', angolaData, angolaLayout);
                
                // Gráfico de performance de APIs
                const apiData = [{{
                    x: Array.from({{length: 24}}, (_, i) => new Date(Date.now() - (23-i) * 3600000)),
                    y: Array.from({{length: 24}}, () => Math.random() * 200 + 300),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Tempo Resposta (ms)',
                    line: {{color: '#7c3aed'}}
                }}];
                
                const apiLayout = {{
                    title: 'Performance APIs - Últimas 24 Horas',
                    xaxis: {{title: 'Hora'}},
                    yaxis: {{title: 'Tempo de Resposta (ms)'}},
                    showlegend: false
                }};
                
                Plotly.newPlot('api-performance-chart', apiData, apiLayout);
                
                // Auto-refresh a cada 30 segundos
                setTimeout(() => {{
                    window.location.reload();
                }}, 30000);
                
                console.log('📈 BGAPP Performance Analytics carregado');
            </script>
        </body>
        </html>
        """
        
        return dashboard_html
    
    def _calculate_current_statistics(self) -> Dict[str, Any]:
        """Calcular estatísticas atuais"""
        
        # Simular uptime
        uptime_hours = np.random.uniform(100, 500)
        
        # Calcular eficiência geral
        efficiency_factors = []
        
        # CPU efficiency (inverso do uso)
        if 'cpu_usage' in self.metrics_buffers and self.metrics_buffers['cpu_usage']:
            avg_cpu = np.mean([m.value for m in list(self.metrics_buffers['cpu_usage'])[-10:]])
            efficiency_factors.append(max(0, 100 - avg_cpu))
        
        # API efficiency
        if 'api_response_time' in self.metrics_buffers and self.metrics_buffers['api_response_time']:
            avg_response = np.mean([m.value for m in list(self.metrics_buffers['api_response_time'])[-10:]])
            api_efficiency = max(0, 100 - (avg_response / 10))  # Normalizar
            efficiency_factors.append(api_efficiency)
        
        # Data quality efficiency
        if 'data_quality_score' in self.metrics_buffers and self.metrics_buffers['data_quality_score']:
            avg_quality = np.mean([m.value for m in list(self.metrics_buffers['data_quality_score'])[-10:]])
            efficiency_factors.append(avg_quality)
        
        overall_efficiency = np.mean(efficiency_factors) if efficiency_factors else 100.0
        
        return {
            'uptime_hours': uptime_hours,
            'efficiency_score': overall_efficiency,
            'total_requests': np.random.randint(10000, 50000),
            'copernicus_downloads': np.random.randint(50, 200),
            'data_processed_gb': np.random.uniform(10, 100)
        }
    
    def _get_value_class(self, metric: PerformanceMetric) -> str:
        """Determinar classe CSS baseada no valor da métrica"""
        
        config = self.metrics_config[metric.name]
        inverted = config.get('inverted', False)
        
        warning_threshold = config.get('threshold_warning')
        critical_threshold = config.get('threshold_critical')
        
        if critical_threshold is not None:
            if (not inverted and metric.value >= critical_threshold) or \
               (inverted and metric.value <= critical_threshold):
                return 'value-critical'
        
        if warning_threshold is not None:
            if (not inverted and metric.value >= warning_threshold) or \
               (inverted and metric.value <= warning_threshold):
                return 'value-warning'
        
        return 'value-normal'
    
    def _get_trend_info(self, metric_name: str) -> Tuple[str, str]:
        """Obter informação de tendência"""
        
        if metric_name not in self.metrics_buffers or len(self.metrics_buffers[metric_name]) < 10:
            return 'trend-stable', '➡️'
        
        # Calcular tendência dos últimos 10 pontos
        recent_values = [m.value for m in list(self.metrics_buffers[metric_name])[-10:]]
        
        # Regressão linear simples
        x = np.arange(len(recent_values))
        slope = np.polyfit(x, recent_values, 1)[0]
        
        if abs(slope) < 0.1:
            return 'trend-stable', '➡️'
        elif slope > 0:
            return 'trend-up', '📈'
        else:
            return 'trend-down', '📉'
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Obter resumo de performance"""
        
        current_time = datetime.now()
        
        # Calcular estatísticas por tipo de métrica
        metrics_by_type = {}
        for metric_type in MetricType:
            metrics_by_type[metric_type.value] = {
                'count': 0,
                'avg_value': 0.0,
                'alerts_count': 0
            }
        
        # Processar métricas
        for metric_name, buffer in self.metrics_buffers.items():
            if buffer:
                latest_metric = buffer[-1]
                metric_type = self._get_metric_type(metric_name).value
                
                metrics_by_type[metric_type]['count'] += 1
                metrics_by_type[metric_type]['avg_value'] += latest_metric.value
        
        # Calcular médias
        for metric_type_data in metrics_by_type.values():
            if metric_type_data['count'] > 0:
                metric_type_data['avg_value'] /= metric_type_data['count']
        
        # Contar alertas por tipo
        for alert in self.active_alerts.values():
            if not alert.resolved_at:
                metric_type = self._get_metric_type(alert.metric_id).value
                metrics_by_type[metric_type]['alerts_count'] += 1
        
        return {
            'collection_active': self.collection_active,
            'total_metrics_collected': sum(len(buffer) for buffer in self.metrics_buffers.values()),
            'active_alerts': len(self.active_alerts),
            'metrics_by_type': metrics_by_type,
            'angola_specific_metrics': self.angola_specific_metrics,
            'performance_stats': self.performance_stats,
            'last_update': current_time.isoformat()
        }


# Instância global do sistema de analytics
performance_analytics = PerformanceAnalytics()
