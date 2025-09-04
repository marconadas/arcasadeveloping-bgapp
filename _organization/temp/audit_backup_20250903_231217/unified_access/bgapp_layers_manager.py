#!/usr/bin/env python3
"""
BGAPP Unified Layers Manager - Acesso Unificado a Todas as Camadas BGAPP
Gestor centralizado que integra todas as camadas da BGAPP: ingest, process, 
models, qgis, services, apis através do admin-dashboard.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
import importlib
import inspect
from dataclasses import dataclass, asdict
from enum import Enum

# Configurar logging
logger = logging.getLogger(__name__)


class LayerType(Enum):
    """Tipos de camadas BGAPP"""
    INGEST = "ingest"
    PROCESS = "process"
    MODELS = "models"
    QGIS = "qgis"
    SERVICES = "services"
    API = "api"
    CACHE = "cache"
    MONITORING = "monitoring"
    BACKUP = "backup"


class LayerStatus(Enum):
    """Status das camadas"""
    AVAILABLE = "disponível"
    LOADING = "carregando"
    ERROR = "erro"
    DISABLED = "desabilitado"
    MAINTENANCE = "manutenção"


@dataclass
class BGAPPLayer:
    """Representação de uma camada BGAPP"""
    name: str
    type: LayerType
    module_path: str
    description: str
    status: LayerStatus
    version: str
    dependencies: List[str]
    endpoints: List[str]
    last_check: datetime
    error_message: Optional[str] = None
    instance: Optional[Any] = None
    metadata: Dict[str, Any] = None


class BGAPPLayersManager:
    """
    🔧 Gestor Unificado das Camadas BGAPP
    
    Centraliza o acesso a todas as funcionalidades da BGAPP através
    do admin-dashboard, fornecendo uma interface única para:
    - Ingestão de dados
    - Processamento
    - Modelos ML
    - Análises QGIS
    - Serviços
    - APIs
    """
    
    def __init__(self):
        """Inicializar gestor de camadas"""
        
        # Registro de todas as camadas BGAPP
        self.layers_registry = {}
        
        # Cache de instâncias
        self.instances_cache = {}
        
        # Configuração das camadas
        self.layers_config = {
            # Camada de Ingestão
            'copernicus_connector': BGAPPLayer(
                name="Copernicus Connector",
                type=LayerType.INGEST,
                module_path="src.bgapp.ingest.copernicus_real",
                description="Conector real para dados Copernicus CMEMS",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["requests", "pandas"],
                endpoints=["/ingest/copernicus/status", "/ingest/copernicus/data"],
                last_check=datetime.now()
            ),
            'cmems_connector': BGAPPLayer(
                name="CMEMS Connector",
                type=LayerType.INGEST,
                module_path="src.bgapp.ingest.cmems_chla",
                description="Conector para dados CMEMS Clorofila-a",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["netCDF4", "xarray"],
                endpoints=["/ingest/cmems/chlorophyll"],
                last_check=datetime.now()
            ),
            'obis_connector': BGAPPLayer(
                name="OBIS Connector",
                type=LayerType.INGEST,
                module_path="src.bgapp.ingest.obis",
                description="Conector para dados OBIS de biodiversidade",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["requests", "pandas"],
                endpoints=["/ingest/obis/species", "/ingest/obis/occurrences"],
                last_check=datetime.now()
            ),
            'fisheries_connector': BGAPPLayer(
                name="Angola Fisheries Connector",
                type=LayerType.INGEST,
                module_path="src.bgapp.ingest.fisheries_angola",
                description="Conector para dados pesqueiros angolanos",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["pandas", "numpy"],
                endpoints=["/ingest/fisheries/zones", "/ingest/fisheries/statistics"],
                last_check=datetime.now()
            ),
            
            # Camada de Processamento
            'raster_processor': BGAPPLayer(
                name="Raster Processor",
                type=LayerType.PROCESS,
                module_path="src.bgapp.process.raster",
                description="Processamento de dados raster oceanográficos",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["rasterio", "xarray", "numpy"],
                endpoints=["/process/raster/analyze", "/process/raster/transform"],
                last_check=datetime.now()
            ),
            'timeseries_processor': BGAPPLayer(
                name="Timeseries Processor",
                type=LayerType.PROCESS,
                module_path="src.bgapp.process.timeseries",
                description="Processamento de séries temporais",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["pandas", "scipy", "statsmodels"],
                endpoints=["/process/timeseries/analyze", "/process/timeseries/forecast"],
                last_check=datetime.now()
            ),
            'metrics_calculator': BGAPPLayer(
                name="Metrics Calculator",
                type=LayerType.PROCESS,
                module_path="src.bgapp.process.metrics",
                description="Cálculo de métricas oceanográficas e biológicas",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["numpy", "scipy"],
                endpoints=["/process/metrics/biodiversity", "/process/metrics/oceanographic"],
                last_check=datetime.now()
            ),
            
            # Camada de Modelos ML
            'ml_manager': BGAPPLayer(
                name="ML Models Manager",
                type=LayerType.MODELS,
                module_path="src.bgapp.ml.models",
                description="Gestor de modelos de Machine Learning",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["scikit-learn", "tensorflow", "joblib"],
                endpoints=["/models/list", "/models/train", "/models/predict"],
                last_check=datetime.now()
            ),
            'species_distribution_model': BGAPPLayer(
                name="Species Distribution Model",
                type=LayerType.MODELS,
                module_path="src.bgapp.ml.species_distribution",
                description="Modelos de distribuição de espécies",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["scikit-learn", "geopandas"],
                endpoints=["/models/species/distribution", "/models/species/habitat"],
                last_check=datetime.now()
            ),
            'oceanographic_model': BGAPPLayer(
                name="Angola Oceanographic Model",
                type=LayerType.MODELS,
                module_path="src.bgapp.models.angola_oceanography",
                description="Modelo oceanográfico específico de Angola",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["numpy", "scipy"],
                endpoints=["/models/oceanographic/angola", "/models/oceanographic/currents"],
                last_check=datetime.now()
            ),
            
            # Camada QGIS
            'spatial_analysis': BGAPPLayer(
                name="Spatial Analysis Tools",
                type=LayerType.QGIS,
                module_path="src.bgapp.qgis.spatial_analysis",
                description="Ferramentas de análise espacial",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["geopandas", "shapely", "pyproj"],
                endpoints=["/qgis/spatial/buffer", "/qgis/spatial/overlay"],
                last_check=datetime.now()
            ),
            'biomass_calculator': BGAPPLayer(
                name="Biomass Calculator",
                type=LayerType.QGIS,
                module_path="src.bgapp.qgis.biomass_calculator",
                description="Calculadora avançada de biomassa",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["numpy", "xarray"],
                endpoints=["/qgis/biomass/calculate", "/qgis/biomass/temporal"],
                last_check=datetime.now()
            ),
            'temporal_visualization': BGAPPLayer(
                name="Temporal Visualization",
                type=LayerType.QGIS,
                module_path="src.bgapp.qgis.temporal_visualization",
                description="Visualização temporal com sliders",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["matplotlib", "plotly"],
                endpoints=["/qgis/temporal/slider", "/qgis/temporal/animation"],
                last_check=datetime.now()
            ),
            
            # Camada de Serviços
            'boundary_processor': BGAPPLayer(
                name="Boundary Processor",
                type=LayerType.SERVICES,
                module_path="src.bgapp.services.spatial_analysis.boundary_processor",
                description="Processador de fronteiras marítimas",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["geopandas", "shapely"],
                endpoints=["/services/boundaries/angola", "/services/boundaries/zee"],
                last_check=datetime.now()
            ),
            'coastal_analysis': BGAPPLayer(
                name="Coastal Analysis Service",
                type=LayerType.SERVICES,
                module_path="src.bgapp.services.coastal_analysis",
                description="Serviço de análise costeira",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["geopandas", "rasterio"],
                endpoints=["/services/coastal/erosion", "/services/coastal/habitat"],
                last_check=datetime.now()
            ),
            
            # Camada de Cache
            'redis_cache': BGAPPLayer(
                name="Redis Cache Manager",
                type=LayerType.CACHE,
                module_path="src.bgapp.cache.redis_cache",
                description="Gestor de cache Redis",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["redis", "aioredis"],
                endpoints=["/cache/status", "/cache/clear", "/cache/stats"],
                last_check=datetime.now()
            ),
            
            # Camada de Monitorização
            'alerts_manager': BGAPPLayer(
                name="Alerts Manager",
                type=LayerType.MONITORING,
                module_path="src.bgapp.monitoring.alerts",
                description="Gestor de alertas e monitorização",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["asyncio", "aiosmtplib"],
                endpoints=["/monitoring/alerts", "/monitoring/health", "/monitoring/metrics"],
                last_check=datetime.now()
            ),
            
            # Camada de Backup
            'backup_manager': BGAPPLayer(
                name="Backup Manager",
                type=LayerType.BACKUP,
                module_path="src.bgapp.backup.backup_manager",
                description="Gestor de backup e restauro",
                status=LayerStatus.AVAILABLE,
                version="1.0.0",
                dependencies=["boto3", "psycopg2"],
                endpoints=["/backup/create", "/backup/restore", "/backup/status"],
                last_check=datetime.now()
            )
        }
        
        # Inicializar registry
        self._initialize_layers_registry()
        
    def _initialize_layers_registry(self):
        """Inicializar registry de camadas"""
        for layer_id, layer in self.layers_config.items():
            self.layers_registry[layer_id] = layer
            logger.info(f"Registada camada: {layer.name} ({layer.type.value})")
    
    async def discover_layers(self) -> Dict[str, List[BGAPPLayer]]:
        """
        🔍 Descobrir todas as camadas BGAPP disponíveis
        
        Returns:
            Dicionário com camadas organizadas por tipo
        """
        logger.info("🔍 Descobrindo camadas BGAPP...")
        
        discovered_layers = {layer_type.value: [] for layer_type in LayerType}
        
        for layer_id, layer in self.layers_registry.items():
            # Verificar disponibilidade da camada
            layer_status = await self._check_layer_availability(layer)
            layer.status = layer_status
            layer.last_check = datetime.now()
            
            discovered_layers[layer.type.value].append(layer)
        
        logger.info(f"✅ Descobertas {len(self.layers_registry)} camadas BGAPP")
        return discovered_layers
    
    async def _check_layer_availability(self, layer: BGAPPLayer) -> LayerStatus:
        """Verificar disponibilidade de uma camada"""
        try:
            # Tentar importar o módulo
            module = importlib.import_module(layer.module_path)
            
            # Verificar se tem as funções/classes esperadas
            if hasattr(module, 'main') or hasattr(module, '__all__') or len(dir(module)) > 10:
                return LayerStatus.AVAILABLE
            else:
                return LayerStatus.ERROR
                
        except ImportError as e:
            layer.error_message = f"Erro de importação: {str(e)}"
            return LayerStatus.ERROR
        except Exception as e:
            layer.error_message = f"Erro geral: {str(e)}"
            return LayerStatus.ERROR
    
    async def get_layer_instance(self, layer_id: str) -> Optional[Any]:
        """
        🔧 Obter instância de uma camada
        
        Args:
            layer_id: ID da camada
            
        Returns:
            Instância da camada ou None se não disponível
        """
        if layer_id not in self.layers_registry:
            logger.error(f"Camada '{layer_id}' não encontrada no registry")
            return None
        
        # Verificar cache
        if layer_id in self.instances_cache:
            return self.instances_cache[layer_id]
        
        layer = self.layers_registry[layer_id]
        
        try:
            # Importar módulo
            module = importlib.import_module(layer.module_path)
            
            # Tentar encontrar classe principal ou função main
            instance = None
            
            # Procurar por classes principais
            for name, obj in inspect.getmembers(module, inspect.isclass):
                if name.lower().replace('_', '') in layer.name.lower().replace(' ', '').replace('_', ''):
                    try:
                        instance = obj()
                        break
                    except:
                        continue
            
            # Se não encontrou classe, procurar função main
            if instance is None and hasattr(module, 'main'):
                instance = module.main
            
            # Se ainda não encontrou, usar o próprio módulo
            if instance is None:
                instance = module
            
            # Cachear instância
            if instance:
                self.instances_cache[layer_id] = instance
                layer.instance = instance
                logger.info(f"✅ Instância criada para {layer.name}")
            
            return instance
            
        except Exception as e:
            logger.error(f"❌ Erro ao criar instância de {layer.name}: {e}")
            layer.error_message = str(e)
            layer.status = LayerStatus.ERROR
            return None
    
    async def execute_layer_function(self, 
                                   layer_id: str, 
                                   function_name: str, 
                                   *args, 
                                   **kwargs) -> Dict[str, Any]:
        """
        ⚡ Executar função de uma camada
        
        Args:
            layer_id: ID da camada
            function_name: Nome da função
            *args: Argumentos posicionais
            **kwargs: Argumentos nomeados
            
        Returns:
            Resultado da execução
        """
        instance = await self.get_layer_instance(layer_id)
        
        if not instance:
            return {
                'status': 'error',
                'message': f'Camada {layer_id} não disponível',
                'timestamp': datetime.now().isoformat()
            }
        
        try:
            # Verificar se a função existe
            if not hasattr(instance, function_name):
                return {
                    'status': 'error',
                    'message': f'Função {function_name} não encontrada em {layer_id}',
                    'timestamp': datetime.now().isoformat()
                }
            
            func = getattr(instance, function_name)
            
            # Executar função
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            return {
                'status': 'success',
                'result': result,
                'layer_id': layer_id,
                'function': function_name,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao executar {function_name} em {layer_id}: {e}")
            return {
                'status': 'error',
                'message': str(e),
                'layer_id': layer_id,
                'function': function_name,
                'timestamp': datetime.now().isoformat()
            }
    
    async def get_layer_status_summary(self) -> Dict[str, Any]:
        """
        📊 Obter resumo do status de todas as camadas
        
        Returns:
            Resumo do status das camadas
        """
        await self.discover_layers()  # Atualizar status
        
        status_summary = {
            'total_layers': len(self.layers_registry),
            'by_status': {},
            'by_type': {},
            'last_update': datetime.now().isoformat(),
            'health_score': 0
        }
        
        # Contar por status
        for layer in self.layers_registry.values():
            status = layer.status.value
            if status not in status_summary['by_status']:
                status_summary['by_status'][status] = 0
            status_summary['by_status'][status] += 1
            
            # Contar por tipo
            layer_type = layer.type.value
            if layer_type not in status_summary['by_type']:
                status_summary['by_type'][layer_type] = {'total': 0, 'available': 0}
            status_summary['by_type'][layer_type]['total'] += 1
            if layer.status == LayerStatus.AVAILABLE:
                status_summary['by_type'][layer_type]['available'] += 1
        
        # Calcular score de saúde
        available_layers = status_summary['by_status'].get('disponível', 0)
        health_score = (available_layers / status_summary['total_layers']) * 100
        status_summary['health_score'] = round(health_score, 1)
        
        return status_summary
    
    async def get_available_endpoints(self) -> List[Dict[str, Any]]:
        """
        🌐 Obter lista de endpoints disponíveis
        
        Returns:
            Lista de endpoints organizados por camada
        """
        endpoints_list = []
        
        for layer_id, layer in self.layers_registry.items():
            if layer.status == LayerStatus.AVAILABLE:
                for endpoint in layer.endpoints:
                    endpoints_list.append({
                        'endpoint': endpoint,
                        'layer_id': layer_id,
                        'layer_name': layer.name,
                        'layer_type': layer.type.value,
                        'description': layer.description,
                        'method': 'GET'  # Por defeito, seria melhorado com metadados reais
                    })
        
        return sorted(endpoints_list, key=lambda x: x['endpoint'])
    
    async def execute_unified_workflow(self, 
                                     workflow_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        🔄 Executar workflow unificado através de múltiplas camadas
        
        Args:
            workflow_config: Configuração do workflow
            
        Returns:
            Resultado do workflow
        """
        workflow_id = workflow_config.get('id', f"workflow_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        steps = workflow_config.get('steps', [])
        
        logger.info(f"🔄 Executando workflow unificado: {workflow_id}")
        
        workflow_result = {
            'workflow_id': workflow_id,
            'status': 'running',
            'steps_results': [],
            'start_time': datetime.now().isoformat(),
            'end_time': None,
            'total_steps': len(steps),
            'completed_steps': 0
        }
        
        try:
            for i, step in enumerate(steps):
                step_result = {
                    'step_number': i + 1,
                    'layer_id': step.get('layer_id'),
                    'function': step.get('function'),
                    'status': 'running',
                    'start_time': datetime.now().isoformat()
                }
                
                try:
                    # Executar passo
                    result = await self.execute_layer_function(
                        step['layer_id'],
                        step['function'],
                        *step.get('args', []),
                        **step.get('kwargs', {})
                    )
                    
                    step_result['status'] = result['status']
                    step_result['result'] = result.get('result')
                    step_result['end_time'] = datetime.now().isoformat()
                    
                    if result['status'] == 'success':
                        workflow_result['completed_steps'] += 1
                    else:
                        step_result['error'] = result.get('message')
                        
                except Exception as e:
                    step_result['status'] = 'error'
                    step_result['error'] = str(e)
                    step_result['end_time'] = datetime.now().isoformat()
                
                workflow_result['steps_results'].append(step_result)
                
                # Se passo falhou e workflow é crítico, parar
                if (step_result['status'] == 'error' and 
                    workflow_config.get('stop_on_error', True)):
                    break
            
            # Determinar status final
            if workflow_result['completed_steps'] == workflow_result['total_steps']:
                workflow_result['status'] = 'completed'
            elif workflow_result['completed_steps'] > 0:
                workflow_result['status'] = 'partial'
            else:
                workflow_result['status'] = 'failed'
            
            workflow_result['end_time'] = datetime.now().isoformat()
            
            logger.info(f"✅ Workflow {workflow_id} concluído: {workflow_result['status']}")
            
        except Exception as e:
            workflow_result['status'] = 'error'
            workflow_result['error'] = str(e)
            workflow_result['end_time'] = datetime.now().isoformat()
            logger.error(f"❌ Erro no workflow {workflow_id}: {e}")
        
        return workflow_result
    
    def generate_layers_documentation(self) -> str:
        """
        📚 Gerar documentação das camadas
        
        Returns:
            Documentação HTML das camadas BGAPP
        """
        
        html_doc = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <title>Documentação das Camadas BGAPP - MARÍTIMO ANGOLA</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    line-height: 1.6;
                    background: #f8fafc;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }}
                .layer-section {{
                    background: white;
                    border-radius: 10px;
                    margin: 20px 0;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .layer-type {{
                    background: #1e3a8a;
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .layer-card {{
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                    background: #f9fafb;
                }}
                .status-available {{ color: #16a34a; font-weight: bold; }}
                .status-error {{ color: #dc2626; font-weight: bold; }}
                .status-loading {{ color: #ea580c; font-weight: bold; }}
                .endpoints-list {{
                    background: #f0f9ff;
                    border-left: 4px solid #0ea5e9;
                    padding: 10px;
                    margin: 10px 0;
                }}
                .dependencies {{
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 10px;
                    margin: 10px 0;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔧 MARÍTIMO ANGOLA</h1>
                <h2>Documentação das Camadas BGAPP</h2>
                <p>Acesso Unificado a Todas as Funcionalidades</p>
                <p>Total: {len(self.layers_registry)} camadas registadas</p>
            </div>
        """
        
        # Organizar por tipo
        layers_by_type = {}
        for layer in self.layers_registry.values():
            layer_type = layer.type.value
            if layer_type not in layers_by_type:
                layers_by_type[layer_type] = []
            layers_by_type[layer_type].append(layer)
        
        # Gerar documentação por tipo
        for layer_type, layers in layers_by_type.items():
            html_doc += f"""
            <div class="layer-type">
                <h2>📁 {layer_type.upper()}</h2>
                <p>{len(layers)} camadas disponíveis</p>
            </div>
            """
            
            for layer in layers:
                status_class = f"status-{layer.status.value.replace(' ', '-')}"
                
                html_doc += f"""
                <div class="layer-card">
                    <h3>{layer.name}</h3>
                    <p><strong>Status:</strong> <span class="{status_class}">{layer.status.value.upper()}</span></p>
                    <p><strong>Versão:</strong> {layer.version}</p>
                    <p><strong>Descrição:</strong> {layer.description}</p>
                    <p><strong>Módulo:</strong> <code>{layer.module_path}</code></p>
                    <p><strong>Última verificação:</strong> {layer.last_check.strftime('%d/%m/%Y %H:%M')}</p>
                    
                    <div class="endpoints-list">
                        <h4>🌐 Endpoints:</h4>
                        <ul>
                """
                
                for endpoint in layer.endpoints:
                    html_doc += f"<li><code>{endpoint}</code></li>"
                
                html_doc += f"""
                        </ul>
                    </div>
                    
                    <div class="dependencies">
                        <h4>📦 Dependências:</h4>
                        <p>{', '.join(layer.dependencies)}</p>
                    </div>
                """
                
                if layer.error_message:
                    html_doc += f"""
                    <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 10px; margin: 10px 0;">
                        <h4>❌ Erro:</h4>
                        <p>{layer.error_message}</p>
                    </div>
                    """
                
                html_doc += "</div>"
        
        html_doc += """
            <div style="margin-top: 30px; text-align: center; color: #666; background: white; padding: 20px; border-radius: 10px;">
                <p><em>Documentação gerada automaticamente pelo BGAPP Layers Manager</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Sistema Unificado de Gestão</p>
            </div>
        </body>
        </html>
        """
        
        return html_doc


# Instância global do gestor de camadas
bgapp_layers_manager = BGAPPLayersManager()
