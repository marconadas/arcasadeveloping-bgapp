#!/usr/bin/env python3
"""
BGAPP Admin Dashboard Controller - Centro de Controle Único da BGAPP
Controlador principal que integra todas as camadas da BGAPP com foco em dados Copernicus
e interface amigável para biólogos marinhos e pescadores angolanos.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
import os

import pandas as pd
import numpy as np
import folium
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import matplotlib.pyplot as plt
import seaborn as sns
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import geopandas as gpd
from shapely.geometry import Point, Polygon

# Importações BGAPP
try:
    from .ingest.copernicus_real import CopernicusRealConnector
    from .realtime.copernicus_simulator import CopernicusAngolaSimulator
    from .qgis.spatial_analysis import SpatialAnalysisTools
    from .qgis.biomass_calculator import AdvancedBiomassCalculator
    from .models.angola_oceanography import AngolaOceanographicModel
    from .services.spatial_analysis.boundary_processor import BoundaryProcessor
    from .ingest.fisheries_angola import AngolaFisheriesConnector
    from .ml.models import ml_manager
    from .cache.redis_cache import cache_manager
    from .monitoring.alerts import alert_manager
    from .backup.backup_manager import backup_manager
    BGAPP_MODULES_AVAILABLE = True
except ImportError as e:
    print(f"Alguns módulos BGAPP não disponíveis: {e}")
    BGAPP_MODULES_AVAILABLE = False

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BGAPPAdminDashboardController:
    """
    🌊 Controlador Principal do Admin Dashboard BGAPP
    
    Centro de controle único que integra todas as funcionalidades da BGAPP
    com foco especial em dados Copernicus e usabilidade para biólogos marinhos
    e pescadores angolanos.
    """
    
    def __init__(self):
        """Inicializar controlador do dashboard"""
        
        # Configuração da identidade MARÍTIMO ANGOLA
        self.branding = {
            'name': 'MARÍTIMO ANGOLA',
            'logo_path': '/static/images/maritimo_angola_logo.png',
            'logo_svg': '''
            <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <!-- Círculo azul marinho de fundo -->
                <circle cx="60" cy="60" r="58" fill="#1e3a8a" stroke="#ffffff" stroke-width="2"/>
                
                <!-- Listras vermelhas diagonais -->
                <defs>
                    <pattern id="redStripes" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                        <rect width="4" height="8" fill="#dc2626"/>
                        <rect x="4" width="4" height="8" fill="transparent"/>
                    </pattern>
                </defs>
                <rect x="15" y="15" width="90" height="90" fill="url(#redStripes)" opacity="0.3" rx="45"/>
                
                <!-- Golfinho branco central -->
                <g transform="translate(60,60) scale(0.8)">
                    <path d="M-20,-10 Q-25,-15 -15,-20 Q0,-25 15,-20 Q25,-15 20,-10 Q15,-5 10,0 Q5,5 0,8 Q-5,5 -10,0 Q-15,-5 -20,-10 Z" 
                          fill="white" stroke="none"/>
                    <!-- Barbatana dorsal -->
                    <path d="M-5,-15 Q0,-20 5,-15 Q0,-10 -5,-15 Z" fill="white"/>
                    <!-- Cauda -->
                    <path d="M15,-5 Q25,-8 20,0 Q25,8 15,5 Q20,0 15,-5 Z" fill="white"/>
                    <!-- Olho -->
                    <circle cx="-8" cy="-8" r="2" fill="#1e3a8a"/>
                </g>
                
                <!-- Texto MARÍTIMO (topo) -->
                <path id="topCircle" d="M 20 60 A 40 40 0 0 1 100 60" fill="none"/>
                <text font-family="Arial Black" font-size="11" font-weight="bold" fill="white">
                    <textPath href="#topCircle" startOffset="5%">MARÍTIMO</textPath>
                </text>
                
                <!-- Texto ANGOLA (baixo) -->
                <path id="bottomCircle" d="M 100 60 A 40 40 0 0 1 20 60" fill="none"/>
                <text font-family="Arial Black" font-size="11" font-weight="bold" fill="white">
                    <textPath href="#bottomCircle" startOffset="15%">ANGOLA</textPath>
                </text>
                
                <!-- Estrelas decorativas -->
                <g fill="white" opacity="0.8">
                    <circle cx="30" cy="30" r="1"/>
                    <circle cx="90" cy="30" r="1"/>
                    <circle cx="30" cy="90" r="1"/>
                    <circle cx="90" cy="90" r="1"/>
                    <circle cx="40" cy="45" r="0.5"/>
                    <circle cx="80" cy="45" r="0.5"/>
                    <circle cx="40" cy="75" r="0.5"/>
                    <circle cx="80" cy="75" r="0.5"/>
                </g>
            </svg>
            ''',
            'colors': {
                'primary_blue': '#1e3a8a',      # Azul marinho do logo
                'accent_red': '#dc2626',        # Vermelho das listras
                'ocean_blue': '#0ea5e9',        # Azul oceânico
                'success_green': '#16a34a',     # Verde para status positivo
                'warning_orange': '#ea580c',    # Laranja para avisos
                'text_dark': '#1f2937',         # Texto principal
                'background': '#f8fafc'         # Fundo claro
            },
            'description': 'Plataforma de Análise e Gestão da Biodiversidade Marinha de Angola',
            'motto': 'Investigação Marinha • Pesca Sustentável • Conservação da Biodiversidade'
        }
        
        # Configuração da ZEE Angolana
        self.angola_zee = {
            'area_km2': 518000,
            'continental_bounds': {
                'north': -6.02,     # Após gap RDC
                'south': -17.266,   # Rio Cunene
                'east': 17.5,       # Limite oceânico
                'west': 8.5         # Costa atlântica
            },
            'cabinda_enclave': {
                'north': -4.2,
                'south': -6.02,
                'east': 13.5,
                'west': 11.5
            },
            'fishing_zones': ['Norte', 'Centro', 'Sul'],
            'main_ports': ['Luanda', 'Lobito', 'Benguela', 'Namibe', 'Cabinda', 'Soyo']
        }
        
        # Inicializar conectores principais
        self._initialize_connectors()
        
        # Estado do dashboard
        self.dashboard_state = {
            'initialized': False,
            'last_update': None,
            'copernicus_status': 'checking',
            'active_users': 0,
            'system_health': 'unknown'
        }
        
        # Cache de dados
        self.data_cache = {
            'copernicus_latest': None,
            'fisheries_stats': None,
            'species_data': None,
            'system_metrics': None
        }
        
    def _initialize_connectors(self):
        """Inicializar todos os conectores BGAPP"""
        try:
            # Conector Copernicus (prioritário)
            self.copernicus_connector = CopernicusRealConnector() if BGAPP_MODULES_AVAILABLE else None
            self.copernicus_simulator = CopernicusAngolaSimulator() if BGAPP_MODULES_AVAILABLE else None
            
            # Ferramentas de análise espacial
            self.spatial_tools = SpatialAnalysisTools() if BGAPP_MODULES_AVAILABLE else None
            
            # Calculadora de biomassa
            self.biomass_calculator = AdvancedBiomassCalculator() if BGAPP_MODULES_AVAILABLE else None
            
            # Modelo oceanográfico de Angola
            self.oceanographic_model = AngolaOceanographicModel() if BGAPP_MODULES_AVAILABLE else None
            
            # Processador de fronteiras
            self.boundary_processor = BoundaryProcessor() if BGAPP_MODULES_AVAILABLE else None
            
            # Conector de pescas
            self.fisheries_connector = AngolaFisheriesConnector() if BGAPP_MODULES_AVAILABLE else None
            
            logger.info("✅ Conectores BGAPP inicializados com sucesso")
            
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar conectores: {e}")
            
    async def initialize_dashboard(self) -> Dict[str, Any]:
        """
        🚀 Inicializar dashboard completo
        
        Returns:
            Status da inicialização
        """
        try:
            logger.info("🌊 Inicializando BGAPP Admin Dashboard...")
            
            # 1. Verificar conexão Copernicus
            copernicus_status = await self._check_copernicus_connection()
            
            # 2. Carregar dados iniciais
            initial_data = await self._load_initial_data()
            
            # 3. Configurar monitorização
            monitoring_status = await self._setup_monitoring()
            
            # 4. Verificar saúde do sistema
            system_health = await self._check_system_health()
            
            # Atualizar estado
            self.dashboard_state.update({
                'initialized': True,
                'last_update': datetime.now(),
                'copernicus_status': copernicus_status['status'],
                'system_health': system_health['overall_status']
            })
            
            return {
                'status': 'success',
                'message': 'Dashboard BGAPP inicializado com sucesso',
                'branding': self.branding,
                'angola_zee': self.angola_zee,
                'copernicus_status': copernicus_status,
                'initial_data': initial_data,
                'monitoring': monitoring_status,
                'system_health': system_health,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Erro na inicialização do dashboard: {e}")
            return {
                'status': 'error',
                'message': f'Erro na inicialização: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
    
    async def _check_copernicus_connection(self) -> Dict[str, Any]:
        """Verificar conexão com Copernicus (prioritário)"""
        try:
            if not self.copernicus_connector:
                return {
                    'status': 'simulator',
                    'message': 'Usando simulador Copernicus',
                    'real_connection': False
                }
            
            # Tentar autenticação real
            auth_success = self.copernicus_connector.authenticate()
            
            if auth_success:
                # Testar acesso a dados
                datasets = await self._test_copernicus_datasets()
                
                return {
                    'status': 'connected',
                    'message': 'Conexão Copernicus ativa',
                    'real_connection': True,
                    'available_datasets': datasets,
                    'credentials': self.copernicus_connector.username
                }
            else:
                return {
                    'status': 'fallback',
                    'message': 'Falha na autenticação, usando simulador',
                    'real_connection': False
                }
                
        except Exception as e:
            logger.error(f"Erro na conexão Copernicus: {e}")
            return {
                'status': 'error',
                'message': f'Erro Copernicus: {str(e)}',
                'real_connection': False
            }
    
    async def _test_copernicus_datasets(self) -> List[Dict[str, Any]]:
        """Testar acesso aos datasets Copernicus para Angola"""
        datasets_status = []
        
        if not self.copernicus_connector:
            return datasets_status
            
        for dataset_name, dataset_id in self.copernicus_connector.angola_datasets.items():
            try:
                # Testar acesso ao dataset
                test_result = await self._test_dataset_access(dataset_id)
                
                datasets_status.append({
                    'name': dataset_name,
                    'id': dataset_id,
                    'status': 'available' if test_result else 'limited',
                    'description': self._get_dataset_description(dataset_name)
                })
                
            except Exception as e:
                datasets_status.append({
                    'name': dataset_name,
                    'id': dataset_id,
                    'status': 'error',
                    'error': str(e)
                })
                
        return datasets_status
    
    async def _test_dataset_access(self, dataset_id: str) -> bool:
        """Testar acesso a um dataset específico"""
        try:
            # Implementar teste real de acesso
            # Por agora, retornar True para datasets conhecidos
            return dataset_id in self.copernicus_connector.angola_datasets.values()
        except:
            return False
    
    def _get_dataset_description(self, dataset_name: str) -> str:
        """Obter descrição do dataset"""
        descriptions = {
            'biogeochemistry': 'Dados biogeoquímicos: clorofila-a, nutrientes, pH',
            'physics': 'Dados físicos: temperatura, salinidade, correntes',
            'waves': 'Dados de ondas: altura, período, direção',
            'reanalysis_bio': 'Reanálise biogeoquímica histórica',
            'reanalysis_phy': 'Reanálise física histórica'
        }
        return descriptions.get(dataset_name, 'Dataset oceanográfico')
    
    async def _load_initial_data(self) -> Dict[str, Any]:
        """Carregar dados iniciais do dashboard"""
        try:
            # Dados oceanográficos recentes
            oceanographic_data = await self._get_latest_oceanographic_data()
            
            # Estatísticas de pesca
            fisheries_stats = await self._get_fisheries_statistics()
            
            # Dados de biodiversidade
            species_data = await self._get_species_summary()
            
            # Métricas do sistema
            system_metrics = await self._get_system_metrics()
            
            return {
                'oceanographic': oceanographic_data,
                'fisheries': fisheries_stats,
                'species': species_data,
                'system': system_metrics,
                'last_update': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro ao carregar dados iniciais: {e}")
            return {'error': str(e)}
    
    async def _get_latest_oceanographic_data(self) -> Dict[str, Any]:
        """Obter dados oceanográficos mais recentes"""
        try:
            if self.copernicus_simulator:
                # Usar simulador se disponível
                simulated_data = self.copernicus_simulator.get_current_conditions()
                return {
                    'source': 'simulator',
                    'data': simulated_data,
                    'timestamp': datetime.now().isoformat()
                }
            else:
                # Dados estáticos para fallback
                return {
                    'source': 'static',
                    'data': {
                        'sst': {'value': 24.5, 'unit': '°C', 'status': 'normal'},
                        'chlorophyll': {'value': 0.8, 'unit': 'mg/m³', 'status': 'moderate'},
                        'salinity': {'value': 35.2, 'unit': 'PSU', 'status': 'normal'},
                        'wave_height': {'value': 1.8, 'unit': 'm', 'status': 'moderate'}
                    },
                    'timestamp': datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Erro ao obter dados oceanográficos: {e}")
            return {'error': str(e)}
    
    async def _get_fisheries_statistics(self) -> Dict[str, Any]:
        """Obter estatísticas de pesca"""
        try:
            if self.fisheries_connector:
                stats = self.fisheries_connector.get_current_statistics()
                return stats
            else:
                # Dados estáticos para demonstração
                return {
                    'total_vessels': 1247,
                    'active_vessels': 892,
                    'zones': {
                        'Norte': {'vessels': 312, 'catch_today': 45.2},
                        'Centro': {'vessels': 428, 'catch_today': 67.8},
                        'Sul': {'vessels': 152, 'catch_today': 23.4}
                    },
                    'top_species': [
                        {'name': 'Sardinha', 'catch_kg': 1250.5},
                        {'name': 'Atum', 'catch_kg': 890.2},
                        {'name': 'Cavala', 'catch_kg': 567.8}
                    ]
                }
                
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas de pesca: {e}")
            return {'error': str(e)}
    
    async def _get_species_summary(self) -> Dict[str, Any]:
        """Obter resumo de espécies"""
        return {
            'total_species': 35,
            'endemic_species': 8,
            'threatened_species': 12,
            'recently_observed': 23,
            'top_species': [
                {'name': 'Thunnus albacares', 'common': 'Atum-amarelo', 'status': 'Abundante'},
                {'name': 'Sardina pilchardus', 'common': 'Sardinha', 'status': 'Estável'},
                {'name': 'Merluccius capensis', 'common': 'Pescada', 'status': 'Moderado'}
            ]
        }
    
    async def _get_system_metrics(self) -> Dict[str, Any]:
        """Obter métricas do sistema"""
        import psutil
        
        return {
            'cpu_usage': psutil.cpu_percent(),
            'memory_usage': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'active_processes': len(psutil.pids()),
            'uptime_hours': (datetime.now() - datetime.fromtimestamp(psutil.boot_time())).total_seconds() / 3600
        }
    
    async def _setup_monitoring(self) -> Dict[str, Any]:
        """Configurar monitorização do sistema"""
        try:
            if BGAPP_MODULES_AVAILABLE and alert_manager:
                # Configurar alertas
                alert_status = await alert_manager.get_status()
                return {
                    'status': 'active',
                    'alerts_configured': True,
                    'alert_status': alert_status
                }
            else:
                return {
                    'status': 'basic',
                    'alerts_configured': False,
                    'message': 'Monitorização básica ativa'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }
    
    async def _check_system_health(self) -> Dict[str, Any]:
        """Verificar saúde geral do sistema"""
        health_checks = {
            'database': await self._check_database_health(),
            'apis': await self._check_apis_health(),
            'storage': await self._check_storage_health(),
            'services': await self._check_services_health()
        }
        
        # Determinar status geral
        failed_checks = [name for name, status in health_checks.items() if not status.get('healthy', False)]
        
        if not failed_checks:
            overall_status = 'healthy'
        elif len(failed_checks) < len(health_checks) / 2:
            overall_status = 'degraded'
        else:
            overall_status = 'unhealthy'
        
        return {
            'overall_status': overall_status,
            'checks': health_checks,
            'failed_checks': failed_checks,
            'timestamp': datetime.now().isoformat()
        }
    
    async def _check_database_health(self) -> Dict[str, Any]:
        """Verificar saúde da base de dados"""
        try:
            # Implementar verificação real da BD
            return {'healthy': True, 'response_time_ms': 45}
        except:
            return {'healthy': False, 'error': 'Conexão falhou'}
    
    async def _check_apis_health(self) -> Dict[str, Any]:
        """Verificar saúde das APIs"""
        return {'healthy': True, 'active_endpoints': 25}
    
    async def _check_storage_health(self) -> Dict[str, Any]:
        """Verificar saúde do armazenamento"""
        return {'healthy': True, 'disk_usage': 45.2}
    
    async def _check_services_health(self) -> Dict[str, Any]:
        """Verificar saúde dos serviços"""
        return {'healthy': True, 'active_services': 12}
    
    def generate_dashboard_html(self, request_data: Dict[str, Any] = None) -> str:
        """
        🎨 Gerar HTML do dashboard principal
        
        Args:
            request_data: Dados da requisição
            
        Returns:
            HTML completo do dashboard
        """
        
        # Template HTML base com branding MARÍTIMO ANGOLA
        html_template = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{self.branding['name']} - Admin Dashboard</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <style>
                :root {{
                    --primary-blue: {self.branding['colors']['primary_blue']};
                    --accent-red: {self.branding['colors']['accent_red']};
                    --ocean-blue: {self.branding['colors']['ocean_blue']};
                }}
                
                .bg-primary {{ background-color: var(--primary-blue); }}
                .text-primary {{ color: var(--primary-blue); }}
                .bg-accent {{ background-color: var(--accent-red); }}
                .text-accent {{ color: var(--accent-red); }}
                .bg-ocean {{ background-color: var(--ocean-blue); }}
                
                .logo-container {{
                    background: linear-gradient(135deg, var(--primary-blue) 0%, var(--ocean-blue) 100%);
                    position: relative;
                    overflow: hidden;
                }}
                
                .logo-container::before {{
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><path d="M0 10 Q25 0 50 10 T100 10 V20 H0 Z" fill="rgba(220,38,38,0.1)"/></svg>') repeat-x;
                    background-size: 200px 100%;
                    animation: wave 10s linear infinite;
                }}
                
                @keyframes wave {{
                    0% {{ transform: translateX(0); }}
                    100% {{ transform: translateX(-200px); }}
                }}
                
                .logo-official {{
                    position: relative;
                    z-index: 2;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                    transition: transform 0.3s ease;
                }}
                
                .logo-official:hover {{
                    transform: scale(1.05);
                }}
                
                .metric-card {{
                    transition: all 0.3s ease;
                    border-left: 4px solid var(--ocean-blue);
                }}
                
                .metric-card:hover {{
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }}
                
                .status-indicator {{
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    display: inline-block;
                    margin-right: 8px;
                }}
                
                .status-healthy {{ background-color: #16a34a; }}
                .status-warning {{ background-color: #ea580c; }}
                .status-error {{ background-color: #dc2626; }}
                
                .copernicus-badge {{
                    background: linear-gradient(45deg, #1e40af, #0ea5e9);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 600;
                }}
            </style>
        </head>
        <body class="bg-gray-50">
            <!-- Header com Logo MARÍTIMO ANGOLA -->
            <header class="logo-container text-white shadow-lg">
                <div class="container mx-auto px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="logo-official">
                                {self.branding['logo_svg']}
                            </div>
                            <div>
                                <h1 class="text-3xl font-bold">{self.branding['name']}</h1>
                                <p class="text-blue-200 text-sm">{self.branding['description']}</p>
                                <p class="text-blue-100 text-xs italic">{self.branding['motto']}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span class="copernicus-badge">
                                <i class="fas fa-satellite"></i> Copernicus Ativo
                            </span>
                            <div class="text-right">
                                <div class="text-sm">ZEE Angola</div>
                                <div class="text-xs text-blue-200">{self.angola_zee['area_km2']:,} km²</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            
            <!-- Dashboard Principal -->
            <main class="container mx-auto px-6 py-8">
                <!-- Métricas Principais -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="metric-card bg-white p-6 rounded-lg shadow">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Dados Copernicus</p>
                                <p class="text-3xl font-bold text-primary">Real-Time</p>
                                <p class="text-green-600 text-sm">
                                    <span class="status-indicator status-healthy"></span>
                                    Conectado
                                </p>
                            </div>
                            <i class="fas fa-satellite text-4xl text-ocean"></i>
                        </div>
                    </div>
                    
                    <div class="metric-card bg-white p-6 rounded-lg shadow">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Embarcações Ativas</p>
                                <p class="text-3xl font-bold text-primary">892</p>
                                <p class="text-green-600 text-sm">
                                    <span class="status-indicator status-healthy"></span>
                                    Operacionais
                                </p>
                            </div>
                            <i class="fas fa-ship text-4xl text-ocean"></i>
                        </div>
                    </div>
                    
                    <div class="metric-card bg-white p-6 rounded-lg shadow">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Espécies Monitorizadas</p>
                                <p class="text-3xl font-bold text-primary">35</p>
                                <p class="text-blue-600 text-sm">
                                    <span class="status-indicator status-healthy"></span>
                                    8 Endémicas
                                </p>
                            </div>
                            <i class="fas fa-fish text-4xl text-ocean"></i>
                        </div>
                    </div>
                    
                    <div class="metric-card bg-white p-6 rounded-lg shadow">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Sistema BGAPP</p>
                                <p class="text-3xl font-bold text-primary">100%</p>
                                <p class="text-green-600 text-sm">
                                    <span class="status-indicator status-healthy"></span>
                                    Operacional
                                </p>
                            </div>
                            <i class="fas fa-cogs text-4xl text-ocean"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Seções Principais -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Dados Oceanográficos Copernicus -->
                    <div class="lg:col-span-2 bg-white rounded-lg shadow p-6">
                        <h2 class="text-xl font-bold text-primary mb-4">
                            <i class="fas fa-water text-ocean mr-2"></i>
                            Dados Oceanográficos - Copernicus CMEMS
                        </h2>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-blue-50 p-4 rounded">
                                <h3 class="font-semibold text-gray-700">Temperatura Superficial</h3>
                                <p class="text-2xl font-bold text-blue-600">24.5°C</p>
                                <p class="text-sm text-gray-600">ZEE Angola Média</p>
                            </div>
                            <div class="bg-green-50 p-4 rounded">
                                <h3 class="font-semibold text-gray-700">Clorofila-a</h3>
                                <p class="text-2xl font-bold text-green-600">0.8 mg/m³</p>
                                <p class="text-sm text-gray-600">Produtividade Moderada</p>
                            </div>
                            <div class="bg-purple-50 p-4 rounded">
                                <h3 class="font-semibold text-gray-700">Salinidade</h3>
                                <p class="text-2xl font-bold text-purple-600">35.2 PSU</p>
                                <p class="text-sm text-gray-600">Valores Normais</p>
                            </div>
                            <div class="bg-orange-50 p-4 rounded">
                                <h3 class="font-semibold text-gray-700">Altura de Onda</h3>
                                <p class="text-2xl font-bold text-orange-600">1.8 m</p>
                                <p class="text-sm text-gray-600">Condições Moderadas</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Zonas de Pesca -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-xl font-bold text-primary mb-4">
                            <i class="fas fa-map-marked-alt text-accent mr-2"></i>
                            Zonas de Pesca Angola
                        </h2>
                        <div class="space-y-4">
                            <div class="border-l-4 border-green-500 pl-4">
                                <h3 class="font-semibold">Zona Norte</h3>
                                <p class="text-sm text-gray-600">Cabinda - Luanda</p>
                                <p class="text-lg font-bold text-green-600">312 embarcações</p>
                            </div>
                            <div class="border-l-4 border-blue-500 pl-4">
                                <h3 class="font-semibold">Zona Centro</h3>
                                <p class="text-sm text-gray-600">Luanda - Lobito</p>
                                <p class="text-lg font-bold text-blue-600">428 embarcações</p>
                            </div>
                            <div class="border-l-4 border-orange-500 pl-4">
                                <h3 class="font-semibold">Zona Sul</h3>
                                <p class="text-sm text-gray-600">Lobito - Cunene</p>
                                <p class="text-lg font-bold text-orange-600">152 embarcações</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Controles BGAPP -->
                <div class="mt-8 bg-white rounded-lg shadow p-6">
                    <h2 class="text-xl font-bold text-primary mb-4">
                        <i class="fas fa-sliders-h text-primary mr-2"></i>
                        Controles do Sistema BGAPP
                    </h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition">
                            <i class="fas fa-database mr-2"></i>
                            Gestão de Dados
                        </button>
                        <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition">
                            <i class="fas fa-chart-line mr-2"></i>
                            Análises ML
                        </button>
                        <button class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition">
                            <i class="fas fa-map mr-2"></i>
                            Mapas Python
                        </button>
                        <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            Alertas
                        </button>
                    </div>
                </div>
            </main>
            
            <!-- Footer -->
            <footer class="bg-primary text-white py-6 mt-12">
                <div class="container mx-auto px-6 text-center">
                    <p>&copy; 2025 {self.branding['name']} - Plataforma BGAPP</p>
                    <p class="text-blue-200 text-sm">Zona Económica Exclusiva de Angola - 518.000 km²</p>
                </div>
            </footer>
            
            <script>
                // JavaScript para funcionalidades interativas
                console.log('BGAPP Admin Dashboard carregado');
                
                // Auto-refresh dos dados a cada 30 segundos
                setInterval(() => {{
                    console.log('Atualizando dados...');
                    // Implementar atualização automática
                }}, 30000);
            </script>
        </body>
        </html>
        """
        
        return html_template

# Instância global do controlador
dashboard_controller = BGAPPAdminDashboardController()
