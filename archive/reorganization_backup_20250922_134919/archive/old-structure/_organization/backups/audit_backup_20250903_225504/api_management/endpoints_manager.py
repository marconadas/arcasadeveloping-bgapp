#!/usr/bin/env python3
"""
BGAPP API Endpoints Manager - Gestor Centralizado de APIs
Desenvolvedor gestor centralizado de todos os endpoints APIs da BGAPP
com testes automáticos, documentação dinâmica e monitorização.
"""

import asyncio
import json
import logging
import requests
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import inspect
from urllib.parse import urljoin

# Configurar logging
logger = logging.getLogger(__name__)


class EndpointMethod(Enum):
    """Métodos HTTP suportados"""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"
    OPTIONS = "OPTIONS"
    HEAD = "HEAD"


class EndpointStatus(Enum):
    """Status dos endpoints"""
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"
    MAINTENANCE = "maintenance"
    UNKNOWN = "unknown"


class APICategory(Enum):
    """Categorias de APIs"""
    ADMIN = "admin"
    SCIENTIFIC = "scientific"
    CARTOGRAPHY = "cartography"
    DATA_PROCESSING = "data_processing"
    MONITORING = "monitoring"
    USER_MANAGEMENT = "user_management"
    REPORTS = "reports"
    EXTERNAL = "external"


@dataclass
class APIEndpoint:
    """Definição de um endpoint API"""
    id: str
    path: str
    method: EndpointMethod
    category: APICategory
    name: str
    description: str
    parameters: List[Dict[str, str]]
    response_schema: Dict[str, Any]
    requires_auth: bool
    required_permissions: List[str]
    rate_limit: Optional[int]  # requests per minute
    timeout: int  # seconds
    last_test: Optional[datetime]
    status: EndpointStatus
    response_time_ms: float
    success_rate: float
    error_count: int
    metadata: Dict[str, Any]


@dataclass
class APITestResult:
    """Resultado de teste de API"""
    endpoint_id: str
    test_time: datetime
    success: bool
    response_time_ms: float
    status_code: Optional[int]
    response_data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    test_parameters: Dict[str, Any]


class APIEndpointsManager:
    """
    🌐 Gestor Centralizado de Endpoints APIs BGAPP
    
    Centraliza a gestão, teste e documentação de todos os endpoints
    APIs da plataforma BGAPP com monitorização automática.
    """
    
    def __init__(self):
        """Inicializar gestor de endpoints"""
        
        # Registry de endpoints
        self.endpoints_registry = {}
        
        # Histórico de testes
        self.test_history = []
        
        # Configurações de teste
        self.test_config = {
            'default_timeout': 30,
            'retry_count': 3,
            'test_interval_minutes': 15,
            'batch_test_size': 5
        }
        
        # Métricas de APIs
        self.api_metrics = {
            'total_endpoints': 0,
            'online_endpoints': 0,
            'offline_endpoints': 0,
            'avg_response_time': 0.0,
            'total_tests_today': 0,
            'success_rate_today': 0.0,
            'last_full_test': None
        }
        
        # Inicializar endpoints BGAPP
        self._initialize_bgapp_endpoints()
    
    def _initialize_bgapp_endpoints(self):
        """Inicializar endpoints BGAPP conhecidos"""
        
        endpoints_config = [
            # Endpoints do Dashboard Principal
            {
                'id': 'admin_dashboard_main',
                'path': '/admin-dashboard',
                'method': EndpointMethod.GET,
                'category': APICategory.ADMIN,
                'name': 'Dashboard Principal',
                'description': 'Dashboard principal do admin BGAPP',
                'parameters': [],
                'requires_auth': False
            },
            {
                'id': 'dashboard_initialize',
                'path': '/admin-dashboard/initialize',
                'method': EndpointMethod.GET,
                'category': APICategory.ADMIN,
                'name': 'Inicializar Dashboard',
                'description': 'Inicializar dashboard e verificar conexões',
                'parameters': [],
                'requires_auth': True
            },
            {
                'id': 'copernicus_status',
                'path': '/admin-dashboard/copernicus-status',
                'method': EndpointMethod.GET,
                'category': APICategory.ADMIN,
                'name': 'Status Copernicus',
                'description': 'Verificar status da conexão Copernicus',
                'parameters': [],
                'requires_auth': True
            },
            
            # Endpoints Científicos
            {
                'id': 'biologist_interface',
                'path': '/admin-dashboard/biologist',
                'method': EndpointMethod.GET,
                'category': APICategory.SCIENTIFIC,
                'name': 'Interface Biólogos',
                'description': 'Interface especializada para biólogos marinhos',
                'parameters': [],
                'requires_auth': True
            },
            {
                'id': 'species_guide',
                'path': '/admin-dashboard/biologist/species-guide',
                'method': EndpointMethod.GET,
                'category': APICategory.SCIENTIFIC,
                'name': 'Guia de Espécies',
                'description': 'Guia de identificação de espécies',
                'parameters': [
                    {'name': 'zone', 'type': 'string', 'required': False},
                    {'name': 'habitat', 'type': 'string', 'required': False},
                    {'name': 'commercial_only', 'type': 'boolean', 'required': False}
                ],
                'requires_auth': True
            },
            {
                'id': 'biodiversity_analysis',
                'path': '/admin-dashboard/biologist/biodiversity-analysis',
                'method': EndpointMethod.POST,
                'category': APICategory.SCIENTIFIC,
                'name': 'Análise Biodiversidade',
                'description': 'Calcular índices de biodiversidade',
                'parameters': [
                    {'name': 'species_abundance', 'type': 'object', 'required': True}
                ],
                'requires_auth': True
            },
            
            # Endpoints para Pescadores
            {
                'id': 'fisherman_dashboard',
                'path': '/admin-dashboard/fisherman',
                'method': EndpointMethod.GET,
                'category': APICategory.SCIENTIFIC,
                'name': 'Dashboard Pescadores',
                'description': 'Dashboard para pescadores',
                'parameters': [
                    {'name': 'zone', 'type': 'string', 'required': False},
                    {'name': 'user_location', 'type': 'string', 'required': False}
                ],
                'requires_auth': False
            },
            {
                'id': 'sea_conditions',
                'path': '/admin-dashboard/fisherman/sea-conditions',
                'method': EndpointMethod.GET,
                'category': APICategory.SCIENTIFIC,
                'name': 'Condições do Mar',
                'description': 'Condições atuais do mar',
                'parameters': [
                    {'name': 'zone', 'type': 'string', 'required': False},
                    {'name': 'lat', 'type': 'number', 'required': False},
                    {'name': 'lon', 'type': 'number', 'required': False}
                ],
                'requires_auth': False
            },
            
            # Endpoints Cartográficos
            {
                'id': 'zee_angola_map',
                'path': '/admin-dashboard/maps/zee-angola',
                'method': EndpointMethod.GET,
                'category': APICategory.CARTOGRAPHY,
                'name': 'Mapa ZEE Angola',
                'description': 'Mapa da Zona Económica Exclusiva de Angola',
                'parameters': [
                    {'name': 'map_type', 'type': 'string', 'required': False},
                    {'name': 'include_fishing_zones', 'type': 'boolean', 'required': False},
                    {'name': 'include_ports', 'type': 'boolean', 'required': False}
                ],
                'requires_auth': False
            },
            {
                'id': 'oceanographic_visualization',
                'path': '/admin-dashboard/maps/oceanographic',
                'method': EndpointMethod.GET,
                'category': APICategory.CARTOGRAPHY,
                'name': 'Visualização Oceanográfica',
                'description': 'Visualizações de parâmetros oceanográficos',
                'parameters': [
                    {'name': 'parameter', 'type': 'string', 'required': False},
                    {'name': 'visualization_type', 'type': 'string', 'required': False}
                ],
                'requires_auth': True
            },
            
            # Endpoints de Processamento
            {
                'id': 'data_processing_dashboard',
                'path': '/admin-dashboard/data-processing',
                'method': EndpointMethod.GET,
                'category': APICategory.DATA_PROCESSING,
                'name': 'Dashboard Processamento',
                'description': 'Dashboard de processamento de dados',
                'parameters': [],
                'requires_auth': True
            },
            {
                'id': 'create_processing_job',
                'path': '/admin-dashboard/data-processing/create-job',
                'method': EndpointMethod.POST,
                'category': APICategory.DATA_PROCESSING,
                'name': 'Criar Trabalho',
                'description': 'Criar novo trabalho de processamento',
                'parameters': [
                    {'name': 'name', 'type': 'string', 'required': True},
                    {'name': 'data_source', 'type': 'string', 'required': True},
                    {'name': 'parameters', 'type': 'object', 'required': True},
                    {'name': 'priority', 'type': 'string', 'required': False}
                ],
                'requires_auth': True
            },
            
            # Endpoints de Monitorização
            {
                'id': 'health_monitor',
                'path': '/admin-dashboard/health-monitor',
                'method': EndpointMethod.GET,
                'category': APICategory.MONITORING,
                'name': 'Monitor de Saúde',
                'description': 'Dashboard de monitorização da saúde',
                'parameters': [],
                'requires_auth': True
            },
            {
                'id': 'system_health_check',
                'path': '/admin-dashboard/health-monitor/full-check',
                'method': EndpointMethod.GET,
                'category': APICategory.MONITORING,
                'name': 'Verificação Completa',
                'description': 'Executar verificação completa de saúde',
                'parameters': [],
                'requires_auth': True
            },
            
            # Endpoints de Gestão de Utilizadores
            {
                'id': 'users_dashboard',
                'path': '/admin-dashboard/users',
                'method': EndpointMethod.GET,
                'category': APICategory.USER_MANAGEMENT,
                'name': 'Dashboard Utilizadores',
                'description': 'Dashboard de gestão de utilizadores',
                'parameters': [],
                'requires_auth': True
            },
            {
                'id': 'create_user',
                'path': '/admin-dashboard/users/create',
                'method': EndpointMethod.POST,
                'category': APICategory.USER_MANAGEMENT,
                'name': 'Criar Utilizador',
                'description': 'Criar novo utilizador',
                'parameters': [
                    {'name': 'username', 'type': 'string', 'required': True},
                    {'name': 'email', 'type': 'string', 'required': True},
                    {'name': 'password', 'type': 'string', 'required': True},
                    {'name': 'full_name', 'type': 'string', 'required': True},
                    {'name': 'role', 'type': 'string', 'required': True}
                ],
                'requires_auth': True
            },
            
            # Endpoints de Relatórios
            {
                'id': 'biodiversity_report',
                'path': '/admin-dashboard/reports/biodiversity',
                'method': EndpointMethod.POST,
                'category': APICategory.REPORTS,
                'name': 'Relatório Biodiversidade',
                'description': 'Gerar relatório de biodiversidade',
                'parameters': [
                    {'name': 'species_abundance', 'type': 'object', 'required': True},
                    {'name': 'start_date', 'type': 'string', 'required': True},
                    {'name': 'end_date', 'type': 'string', 'required': True},
                    {'name': 'output_format', 'type': 'string', 'required': False}
                ],
                'requires_auth': True
            },
            {
                'id': 'oceanographic_report',
                'path': '/admin-dashboard/reports/oceanographic',
                'method': EndpointMethod.POST,
                'category': APICategory.REPORTS,
                'name': 'Relatório Oceanográfico',
                'description': 'Gerar relatório oceanográfico',
                'parameters': [
                    {'name': 'oceanographic_data', 'type': 'object', 'required': True},
                    {'name': 'start_date', 'type': 'string', 'required': True},
                    {'name': 'end_date', 'type': 'string', 'required': True}
                ],
                'requires_auth': True
            },
            
            # APIs Externas
            {
                'id': 'copernicus_api',
                'path': 'https://my.cmems-du.eu/motu-web/Motu',
                'method': EndpointMethod.GET,
                'category': APICategory.EXTERNAL,
                'name': 'Copernicus CMEMS',
                'description': 'API externa Copernicus Marine',
                'parameters': [],
                'requires_auth': True
            },
            {
                'id': 'obis_api',
                'path': 'https://api.obis.org/v3/occurrence',
                'method': EndpointMethod.GET,
                'category': APICategory.EXTERNAL,
                'name': 'OBIS API',
                'description': 'API externa OBIS para biodiversidade',
                'parameters': [
                    {'name': 'geometry', 'type': 'string', 'required': False},
                    {'name': 'size', 'type': 'number', 'required': False}
                ],
                'requires_auth': False
            },
            {
                'id': 'gbif_api',
                'path': 'https://api.gbif.org/v1/occurrence/search',
                'method': EndpointMethod.GET,
                'category': APICategory.EXTERNAL,
                'name': 'GBIF API',
                'description': 'API externa GBIF para biodiversidade',
                'parameters': [
                    {'name': 'country', 'type': 'string', 'required': False},
                    {'name': 'hasCoordinate', 'type': 'boolean', 'required': False}
                ],
                'requires_auth': False
            }
        ]
        
        # Registar endpoints
        for endpoint_config in endpoints_config:
            endpoint = APIEndpoint(
                id=endpoint_config['id'],
                path=endpoint_config['path'],
                method=endpoint_config['method'],
                category=endpoint_config['category'],
                name=endpoint_config['name'],
                description=endpoint_config['description'],
                parameters=endpoint_config['parameters'],
                response_schema={},
                requires_auth=endpoint_config['requires_auth'],
                required_permissions=endpoint_config.get('required_permissions', []),
                rate_limit=endpoint_config.get('rate_limit'),
                timeout=endpoint_config.get('timeout', self.test_config['default_timeout']),
                last_test=None,
                status=EndpointStatus.UNKNOWN,
                response_time_ms=0.0,
                success_rate=100.0,
                error_count=0,
                metadata={}
            )
            
            self.endpoints_registry[endpoint.id] = endpoint
        
        self.api_metrics['total_endpoints'] = len(self.endpoints_registry)
        
        logger.info(f"🌐 Inicializados {len(self.endpoints_registry)} endpoints BGAPP")
    
    async def test_endpoint(self, endpoint_id: str, test_parameters: Dict[str, Any] = None) -> APITestResult:
        """
        🧪 Testar um endpoint específico
        
        Args:
            endpoint_id: ID do endpoint
            test_parameters: Parâmetros para o teste
            
        Returns:
            Resultado do teste
        """
        
        if endpoint_id not in self.endpoints_registry:
            raise ValueError(f"Endpoint {endpoint_id} não encontrado")
        
        endpoint = self.endpoints_registry[endpoint_id]
        test_params = test_parameters or {}
        
        start_time = time.time()
        test_time = datetime.now()
        
        try:
            # Determinar URL completa
            if endpoint.path.startswith('http'):
                # API externa
                url = endpoint.path
            else:
                # API interna
                base_url = "http://localhost:8001"  # URL base da API BGAPP
                url = urljoin(base_url, endpoint.path.lstrip('/'))
            
            # Preparar requisição
            headers = {
                'User-Agent': 'BGAPP-API-Manager/1.0',
                'Accept': 'application/json'
            }
            
            # Executar teste baseado no método
            if endpoint.method == EndpointMethod.GET:
                response = requests.get(
                    url, 
                    params=test_params, 
                    headers=headers, 
                    timeout=endpoint.timeout
                )
            elif endpoint.method == EndpointMethod.POST:
                response = requests.post(
                    url, 
                    json=test_params, 
                    headers=headers, 
                    timeout=endpoint.timeout
                )
            else:
                # Simular outros métodos
                await asyncio.sleep(0.1)
                response_time_ms = (time.time() - start_time) * 1000
                
                return APITestResult(
                    endpoint_id=endpoint_id,
                    test_time=test_time,
                    success=True,
                    response_time_ms=response_time_ms,
                    status_code=200,
                    response_data={'simulated': True, 'method': endpoint.method.value},
                    error_message=None,
                    test_parameters=test_params
                )
            
            response_time_ms = (time.time() - start_time) * 1000
            
            # Analisar resposta
            success = 200 <= response.status_code < 400
            
            try:
                response_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else None
            except:
                response_data = None
            
            # Criar resultado do teste
            test_result = APITestResult(
                endpoint_id=endpoint_id,
                test_time=test_time,
                success=success,
                response_time_ms=response_time_ms,
                status_code=response.status_code,
                response_data=response_data,
                error_message=None if success else f"HTTP {response.status_code}",
                test_parameters=test_params
            )
            
            # Atualizar endpoint
            endpoint.last_test = test_time
            endpoint.response_time_ms = response_time_ms
            
            if success:
                endpoint.status = EndpointStatus.ONLINE
                if response_time_ms > 5000:
                    endpoint.status = EndpointStatus.DEGRADED
            else:
                endpoint.status = EndpointStatus.OFFLINE
                endpoint.error_count += 1
            
            logger.info(f"🧪 Teste {endpoint_id}: {'✅' if success else '❌'} ({response_time_ms:.1f}ms)")
            
        except requests.exceptions.Timeout:
            response_time_ms = endpoint.timeout * 1000
            test_result = APITestResult(
                endpoint_id=endpoint_id,
                test_time=test_time,
                success=False,
                response_time_ms=response_time_ms,
                status_code=None,
                response_data=None,
                error_message="Timeout",
                test_parameters=test_params
            )
            
            endpoint.status = EndpointStatus.OFFLINE
            endpoint.error_count += 1
            
        except Exception as e:
            response_time_ms = (time.time() - start_time) * 1000
            test_result = APITestResult(
                endpoint_id=endpoint_id,
                test_time=test_time,
                success=False,
                response_time_ms=response_time_ms,
                status_code=None,
                response_data=None,
                error_message=str(e),
                test_parameters=test_params
            )
            
            endpoint.status = EndpointStatus.OFFLINE
            endpoint.error_count += 1
            
            logger.error(f"❌ Erro no teste {endpoint_id}: {e}")
        
        # Adicionar ao histórico
        self.test_history.append(test_result)
        if len(self.test_history) > 1000:
            self.test_history = self.test_history[-1000:]
        
        # Atualizar métricas
        self.api_metrics['total_tests_today'] += 1
        
        return test_result
    
    async def test_all_endpoints(self) -> Dict[str, Any]:
        """
        🔄 Testar todos os endpoints
        
        Returns:
            Resumo dos testes
        """
        
        logger.info("🔄 Iniciando teste de todos os endpoints...")
        
        start_time = datetime.now()
        test_results = []
        
        # Testar endpoints em lotes para não sobrecarregar
        endpoint_ids = list(self.endpoints_registry.keys())
        batch_size = self.test_config['batch_test_size']
        
        for i in range(0, len(endpoint_ids), batch_size):
            batch = endpoint_ids[i:i + batch_size]
            
            # Executar lote em paralelo
            batch_tasks = []
            for endpoint_id in batch:
                task = asyncio.create_task(self.test_endpoint(endpoint_id))
                batch_tasks.append((endpoint_id, task))
            
            # Aguardar conclusão do lote
            for endpoint_id, task in batch_tasks:
                try:
                    result = await task
                    test_results.append(result)
                except Exception as e:
                    logger.error(f"Erro no teste {endpoint_id}: {e}")
            
            # Pausa entre lotes
            await asyncio.sleep(1)
        
        # Calcular estatísticas
        total_tests = len(test_results)
        successful_tests = sum(1 for r in test_results if r.success)
        failed_tests = total_tests - successful_tests
        avg_response_time = sum(r.response_time_ms for r in test_results) / total_tests if total_tests > 0 else 0
        
        # Atualizar métricas globais
        self.api_metrics.update({
            'online_endpoints': sum(1 for e in self.endpoints_registry.values() if e.status == EndpointStatus.ONLINE),
            'offline_endpoints': sum(1 for e in self.endpoints_registry.values() if e.status == EndpointStatus.OFFLINE),
            'avg_response_time': avg_response_time,
            'success_rate_today': (successful_tests / total_tests) * 100 if total_tests > 0 else 0,
            'last_full_test': datetime.now().isoformat()
        })
        
        test_duration = (datetime.now() - start_time).total_seconds()
        
        summary = {
            'total_endpoints_tested': total_tests,
            'successful_tests': successful_tests,
            'failed_tests': failed_tests,
            'success_rate_percent': (successful_tests / total_tests) * 100 if total_tests > 0 else 0,
            'average_response_time_ms': avg_response_time,
            'test_duration_seconds': test_duration,
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"✅ Teste completo: {successful_tests}/{total_tests} sucessos ({summary['success_rate_percent']:.1f}%)")
        
        return summary
    
    def generate_api_documentation(self) -> str:
        """
        📚 Gerar documentação dinâmica das APIs
        
        Returns:
            Documentação HTML completa
        """
        
        # Organizar endpoints por categoria
        endpoints_by_category = {}
        for endpoint in self.endpoints_registry.values():
            category = endpoint.category.value
            if category not in endpoints_by_category:
                endpoints_by_category[category] = []
            endpoints_by_category[category].append(endpoint)
        
        doc_html = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Documentação APIs BGAPP - MARÍTIMO ANGOLA</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f8fafc;
                    color: #333;
                    line-height: 1.6;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 15px;
                    text-align: center;
                    margin-bottom: 20px;
                }}
                .category-section {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .category-title {{
                    background: #1e3a8a;
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }}
                .endpoint-card {{
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                    background: #f9fafb;
                }}
                .method-get {{ border-left: 5px solid #16a34a; }}
                .method-post {{ border-left: 5px solid #0ea5e9; }}
                .method-put {{ border-left: 5px solid #ea580c; }}
                .method-delete {{ border-left: 5px solid #dc2626; }}
                .endpoint-path {{
                    font-family: 'Courier New', monospace;
                    background: #1e1e1e;
                    color: #f8f8f2;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 14px;
                    margin: 10px 0;
                }}
                .parameters-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 14px;
                }}
                .parameters-table th, .parameters-table td {{
                    border: 1px solid #d1d5db;
                    padding: 8px;
                    text-align: left;
                }}
                .parameters-table th {{
                    background: #f3f4f6;
                    font-weight: bold;
                }}
                .status-online {{ color: #16a34a; font-weight: bold; }}
                .status-offline {{ color: #dc2626; font-weight: bold; }}
                .status-degraded {{ color: #ea580c; font-weight: bold; }}
                .status-unknown {{ color: #6b7280; }}
                .auth-required {{
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 4px;
                    padding: 5px 10px;
                    font-size: 12px;
                    display: inline-block;
                    margin: 5px 0;
                }}
                .toc {{
                    background: #f0f9ff;
                    border: 2px solid #0ea5e9;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📚 MARÍTIMO ANGOLA</h1>
                <h2>Documentação APIs BGAPP</h2>
                <p>Referência Completa de Endpoints - ZEE Angola</p>
                <p>Total: {len(self.endpoints_registry)} endpoints documentados</p>
            </div>
            
            <!-- Índice -->
            <div class="toc">
                <h3>📋 Índice de APIs</h3>
                <ul>
        """
        
        for category in APICategory:
            if category.value in endpoints_by_category:
                count = len(endpoints_by_category[category.value])
                doc_html += f'<li><a href="#{category.value}">{category.value.replace("_", " ").title()} ({count} endpoints)</a></li>'
        
        doc_html += "</ul></div>"
        
        # Documentar por categoria
        for category, endpoints in endpoints_by_category.items():
            doc_html += f"""
            <div class="category-section" id="{category}">
                <div class="category-title">
                    <h2>📁 {category.replace('_', ' ').title()}</h2>
                    <p>{len(endpoints)} endpoints disponíveis</p>
                </div>
            """
            
            for endpoint in endpoints:
                status_class = f"status-{endpoint.status.value}"
                method_class = f"method-{endpoint.method.value.lower()}"
                
                doc_html += f"""
                <div class="endpoint-card {method_class}">
                    <h3>{endpoint.name}</h3>
                    <div class="endpoint-path">{endpoint.method.value} {endpoint.path}</div>
                    <p>{endpoint.description}</p>
                    
                    <p><strong>Status:</strong> <span class="{status_class}">{endpoint.status.value.upper()}</span></p>
                    <p><strong>Tempo de resposta:</strong> {endpoint.response_time_ms:.1f}ms</p>
                    <p><strong>Taxa de sucesso:</strong> {endpoint.success_rate:.1f}%</p>
                    
                    {f'<div class="auth-required">🔐 Autenticação obrigatória</div>' if endpoint.requires_auth else ''}
                """
                
                # Documentar parâmetros
                if endpoint.parameters:
                    doc_html += """
                    <h4>Parâmetros:</h4>
                    <table class="parameters-table">
                        <tr>
                            <th>Nome</th>
                            <th>Tipo</th>
                            <th>Obrigatório</th>
                            <th>Descrição</th>
                        </tr>
                    """
                    
                    for param in endpoint.parameters:
                        required = "Sim" if param.get('required', False) else "Não"
                        doc_html += f"""
                        <tr>
                            <td><code>{param['name']}</code></td>
                            <td>{param['type']}</td>
                            <td>{required}</td>
                            <td>{param.get('description', 'N/A')}</td>
                        </tr>
                        """
                    
                    doc_html += "</table>"
                
                # Exemplo de uso
                doc_html += f"""
                    <h4>Exemplo de Uso:</h4>
                    <div class="endpoint-path">
                        curl -X {endpoint.method.value} "http://localhost:8001{endpoint.path}"
                    </div>
                </div>
                """
            
            doc_html += "</div>"
        
        doc_html += f"""
            <div style="margin-top: 30px; text-align: center; color: #666; background: white; padding: 20px; border-radius: 10px;">
                <p><em>Documentação gerada automaticamente pelo API Manager</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - APIs para Investigação Marinha</p>
                <p>Última atualização: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
            </div>
        </body>
        </html>
        """
        
        return doc_html
    
    def generate_api_dashboard(self) -> str:
        """
        🌐 Gerar dashboard de gestão de APIs
        
        Returns:
            Dashboard HTML completo
        """
        
        # Atualizar métricas
        self._update_api_metrics()
        
        dashboard_html = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Gestão de APIs - MARÍTIMO ANGOLA</title>
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
                    border-left: 5px solid #0ea5e9;
                }}
                .metric-value {{
                    font-size: 2em;
                    font-weight: bold;
                    color: #1e3a8a;
                    margin: 10px 0;
                }}
                .metric-label {{
                    color: #666;
                    font-size: 0.9em;
                }}
                .endpoints-section {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .endpoint-card {{
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    background: #f9fafb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }}
                .endpoint-online {{ border-left: 5px solid #16a34a; }}
                .endpoint-offline {{ border-left: 5px solid #dc2626; }}
                .endpoint-degraded {{ border-left: 5px solid #ea580c; }}
                .endpoint-unknown {{ border-left: 5px solid #6b7280; }}
                .test-btn {{
                    background: #0ea5e9;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                }}
                .test-btn:hover {{
                    background: #0284c7;
                }}
                .category-filter {{
                    margin: 20px 0;
                    text-align: center;
                }}
                .filter-btn {{
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    margin: 0 5px;
                    border-radius: 5px;
                    cursor: pointer;
                }}
                .filter-btn.active {{
                    background: #1e3a8a;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🌐 MARÍTIMO ANGOLA</h1>
                <h2>Gestão Centralizada de APIs</h2>
                <p>Monitorização e Teste de Endpoints - BGAPP</p>
            </div>
            
            <!-- Métricas das APIs -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">{self.api_metrics['total_endpoints']}</div>
                    <div class="metric-label">Total Endpoints</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.api_metrics['online_endpoints']}</div>
                    <div class="metric-label">Online</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.api_metrics['offline_endpoints']}</div>
                    <div class="metric-label">Offline</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.api_metrics['avg_response_time']:.0f}ms</div>
                    <div class="metric-label">Tempo Médio</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.api_metrics['success_rate_today']:.1f}%</div>
                    <div class="metric-label">Taxa de Sucesso</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.api_metrics['total_tests_today']}</div>
                    <div class="metric-label">Testes Hoje</div>
                </div>
            </div>
            
            <!-- Filtros por Categoria -->
            <div class="category-filter">
                <button class="filter-btn active" onclick="filterCategory('all')">Todas</button>
        """
        
        for category in APICategory:
            if category.value in endpoints_by_category:
                count = len(endpoints_by_category[category.value])
                doc_html += f'<button class="filter-btn" onclick="filterCategory(\'{category.value}\')">{category.value.replace("_", " ").title()} ({count})</button>'
        
        doc_html += """
            </div>
            
            <!-- Lista de Endpoints -->
            <div class="endpoints-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>🔗 Endpoints Registados</h3>
                    <button class="test-btn" onclick="testAllEndpoints()" style="padding: 10px 20px; font-size: 14px;">
                        🧪 Testar Todos
                    </button>
                </div>
        """
        
        # Listar todos os endpoints
        for endpoint in self.endpoints_registry.values():
            status_class = f"endpoint-{endpoint.status.value}"
            method_color = {
                'GET': '#16a34a',
                'POST': '#0ea5e9',
                'PUT': '#ea580c',
                'DELETE': '#dc2626'
            }.get(endpoint.method.value, '#6b7280')
            
            last_test_text = endpoint.last_test.strftime('%d/%m %H:%M') if endpoint.last_test else 'Nunca'
            
            doc_html += f"""
            <div class="endpoint-card {status_class}" data-category="{endpoint.category.value}">
                <div>
                    <h4>
                        <span style="background: {method_color}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; margin-right: 10px;">
                            {endpoint.method.value}
                        </span>
                        {endpoint.name}
                    </h4>
                    <p>{endpoint.description}</p>
                    <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">{endpoint.path}</code>
                    <p style="font-size: 12px; color: #666; margin: 5px 0;">
                        Categoria: {endpoint.category.value.replace('_', ' ').title()} | 
                        Último teste: {last_test_text} |
                        Parâmetros: {len(endpoint.parameters)}
                        {' | 🔐 Auth necessária' if endpoint.requires_auth else ''}
                    </p>
                </div>
                <div>
                    <p style="text-align: center; margin: 5px 0;">
                        <span style="font-weight: bold; color: {method_color};">
                            {endpoint.status.value.upper()}
                        </span><br>
                        <span style="font-size: 12px; color: #666;">
                            {endpoint.response_time_ms:.0f}ms<br>
                            {endpoint.success_rate:.1f}% sucesso
                        </span>
                    </p>
                    <button class="test-btn" onclick="testEndpoint('{endpoint.id}')">
                        🧪 Testar
                    </button>
                </div>
            </div>
            """
        
        doc_html += f"""
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; background: white; padding: 20px; border-radius: 10px;">
                <p><em>Gestor de APIs atualizado automaticamente</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Plataforma de APIs Científicas</p>
                <p>Monitorização ativa desde: {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
            </div>
            
            <script>
                function filterCategory(category) {{
                    const cards = document.querySelectorAll('.endpoint-card');
                    const buttons = document.querySelectorAll('.filter-btn');
                    
                    // Reset button styles
                    buttons.forEach(btn => btn.classList.remove('active'));
                    event.target.classList.add('active');
                    
                    // Filter cards
                    cards.forEach(card => {{
                        if (category === 'all' || card.dataset.category === category) {{
                            card.style.display = 'flex';
                        }} else {{
                            card.style.display = 'none';
                        }}
                    }});
                }}
                
                function testEndpoint(endpointId) {{
                    alert('Testando endpoint: ' + endpointId + '\\n\\nEm implementação completa, isto executaria teste real.');
                }}
                
                function testAllEndpoints() {{
                    if (confirm('Testar todos os endpoints? Isto pode demorar alguns minutos.')) {{
                        alert('Iniciando teste de todos os endpoints...\\n\\nEm implementação completa, isto executaria testes reais.');
                    }}
                }}
                
                console.log('🌐 BGAPP API Endpoints Manager carregado');
            </script>
        </body>
        </html>
        """
        
        return dashboard_html
    
    def _update_api_metrics(self):
        """Atualizar métricas das APIs"""
        
        online_count = sum(1 for e in self.endpoints_registry.values() if e.status == EndpointStatus.ONLINE)
        offline_count = sum(1 for e in self.endpoints_registry.values() if e.status == EndpointStatus.OFFLINE)
        
        # Calcular tempo médio de resposta
        response_times = [e.response_time_ms for e in self.endpoints_registry.values() if e.response_time_ms > 0]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Calcular taxa de sucesso
        success_rates = [e.success_rate for e in self.endpoints_registry.values()]
        avg_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0
        
        self.api_metrics.update({
            'online_endpoints': online_count,
            'offline_endpoints': offline_count,
            'avg_response_time': avg_response_time,
            'success_rate_today': avg_success_rate
        })
    
    async def get_endpoint_details(self, endpoint_id: str) -> Optional[Dict[str, Any]]:
        """
        🔍 Obter detalhes de um endpoint específico
        
        Args:
            endpoint_id: ID do endpoint
            
        Returns:
            Detalhes completos do endpoint
        """
        
        if endpoint_id not in self.endpoints_registry:
            return None
        
        endpoint = self.endpoints_registry[endpoint_id]
        
        # Obter histórico de testes deste endpoint
        endpoint_tests = [
            test for test in self.test_history 
            if test.endpoint_id == endpoint_id
        ]
        
        recent_tests = endpoint_tests[-10:]  # Últimos 10 testes
        
        return {
            'endpoint': asdict(endpoint),
            'test_history': [
                {
                    'test_time': test.test_time.isoformat(),
                    'success': test.success,
                    'response_time_ms': test.response_time_ms,
                    'status_code': test.status_code,
                    'error_message': test.error_message
                }
                for test in recent_tests
            ],
            'statistics': {
                'total_tests': len(endpoint_tests),
                'successful_tests': sum(1 for t in endpoint_tests if t.success),
                'average_response_time': sum(t.response_time_ms for t in endpoint_tests) / len(endpoint_tests) if endpoint_tests else 0,
                'last_24h_tests': len([t for t in endpoint_tests if t.test_time >= datetime.now() - timedelta(days=1)])
            }
        }


# Instância global do gestor de endpoints
api_endpoints_manager = APIEndpointsManager()
