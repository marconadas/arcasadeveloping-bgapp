#!/usr/bin/env python3
"""
Gerador de Documentação OpenAPI/Swagger para APIs QGIS
Cria documentação abrangente e interativa para todos os endpoints
"""

import json
import yaml
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime
import logging
from dataclasses import dataclass, asdict
from enum import Enum
import inspect
import re

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ParameterType(Enum):
    """Tipos de parâmetros"""
    STRING = "string"
    INTEGER = "integer" 
    NUMBER = "number"
    BOOLEAN = "boolean"
    ARRAY = "array"
    OBJECT = "object"

class HTTPMethod(Enum):
    """Métodos HTTP"""
    GET = "get"
    POST = "post"
    PUT = "put"
    DELETE = "delete"
    PATCH = "patch"

@dataclass
class Parameter:
    """Parâmetro de API"""
    name: str
    param_type: ParameterType
    description: str
    required: bool = True
    example: Any = None
    enum_values: Optional[List[str]] = None
    minimum: Optional[float] = None
    maximum: Optional[float] = None
    format: Optional[str] = None

@dataclass
class Response:
    """Resposta de API"""
    status_code: int
    description: str
    example: Optional[Dict[str, Any]] = None
    schema: Optional[Dict[str, Any]] = None

@dataclass
class Endpoint:
    """Endpoint de API"""
    path: str
    method: HTTPMethod
    summary: str
    description: str
    tags: List[str]
    parameters: List[Parameter]
    responses: List[Response]
    security_required: bool = False
    deprecated: bool = False

class SwaggerGenerator:
    """Gerador de documentação Swagger/OpenAPI"""
    
    def __init__(self):
        self.openapi_version = "3.0.3"
        self.api_version = "2.0.0"
        self.endpoints: List[Endpoint] = []
        
        # Informações da API
        self.api_info = {
            "title": "BGAPP QGIS APIs",
            "description": self._get_api_description(),
            "version": self.api_version,
            "contact": {
                "name": "BGAPP Team",
                "email": "support@bgapp.com",
                "url": "https://bgapp.com"
            },
            "license": {
                "name": "MIT",
                "url": "https://opensource.org/licenses/MIT"
            }
        }
        
        # Configurar endpoints
        self._setup_endpoints()
    
    def _get_api_description(self) -> str:
        """Retorna descrição da API"""
        return """
# BGAPP QGIS APIs

APIs completas para análises geoespaciais e ambientais de Angola.

## Funcionalidades Principais

- **Análises Espaciais**: Hotspots, conectividade, zonas buffer
- **Análises Temporais**: Séries temporais, animações, estatísticas
- **Cálculos de Biomassa**: Terrestre e marinha
- **Análises de Migração**: Rastreamento de espécies
- **Relatórios Automáticos**: Geração de PDFs e exportações
- **Análise Multicritério (MCDA)**: Zonas sustentáveis
- **Exportação de Mapas**: Mapas interativos e estáticos
- **Monitorização**: Saúde do sistema e métricas
- **Validação de Dados**: Qualidade automática

## Autenticação

A maioria dos endpoints requer autenticação via Bearer Token.

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.bgapp.com/qgis/endpoint
```

## Rate Limiting

- **Limite**: 1000 requisições por hora por usuário
- **Burst**: 100 requisições por minuto

## Suporte

- **Documentação**: https://docs.bgapp.com
- **Status**: https://status.bgapp.com
- **Suporte**: support@bgapp.com
        """.strip()
    
    def _setup_endpoints(self):
        """Configura todos os endpoints QGIS"""
        
        # Status e Health
        self._add_status_endpoints()
        
        # Análises Espaciais
        self._add_spatial_endpoints()
        
        # Análises Temporais
        self._add_temporal_endpoints()
        
        # Biomassa
        self._add_biomass_endpoints()
        
        # Migração
        self._add_migration_endpoints()
        
        # Relatórios
        self._add_reports_endpoints()
        
        # MCDA
        self._add_mcda_endpoints()
        
        # QGIS2Web
        self._add_qgis2web_endpoints()
        
        # Validação de Dados
        self._add_validation_endpoints()
        
        # Autenticação
        self._add_auth_endpoints()
    
    def _add_status_endpoints(self):
        """Adiciona endpoints de status"""
        
        # Status geral
        self.endpoints.append(Endpoint(
            path="/qgis/status",
            method=HTTPMethod.GET,
            summary="Status do Sistema QGIS",
            description="Retorna o status geral dos serviços QGIS e informações do sistema",
            tags=["Status"],
            parameters=[],
            responses=[
                Response(
                    status_code=200,
                    description="Status obtido com sucesso",
                    example={
                        "success": True,
                        "status": "operational",
                        "version": "2.0.0",
                        "uptime": 99.8,
                        "services": {
                            "qgis_server": "healthy",
                            "database": "healthy",
                            "cache": "healthy"
                        },
                        "timestamp": "2024-12-01T10:00:00Z"
                    }
                )
            ]
        ))
        
        # Health check
        self.endpoints.append(Endpoint(
            path="/qgis/health/status",
            method=HTTPMethod.GET,
            summary="Health Check Detalhado",
            description="Retorna métricas detalhadas de saúde do sistema",
            tags=["Health"],
            parameters=[],
            responses=[
                Response(
                    status_code=200,
                    description="Métricas de saúde",
                    example={
                        "success": True,
                        "overall_health": "healthy",
                        "metrics": {
                            "cpu_usage": 42.5,
                            "memory_usage": 68.2,
                            "disk_usage": 35.1,
                            "response_time": 245
                        },
                        "services_status": {
                            "postgresql": "healthy",
                            "redis": "healthy",
                            "qgis_server": "healthy"
                        }
                    }
                )
            ],
            security_required=True
        ))
    
    def _add_spatial_endpoints(self):
        """Adiciona endpoints de análise espacial"""
        
        # Hotspots
        self.endpoints.append(Endpoint(
            path="/qgis/spatial/hotspots",
            method=HTTPMethod.POST,
            summary="Análise de Hotspots",
            description="Identifica áreas de alta concentração (hotspots) baseado em dados pontuais",
            tags=["Análise Espacial"],
            parameters=[
                Parameter(
                    name="point_data",
                    param_type=ParameterType.ARRAY,
                    description="Array de pontos com coordenadas e valores",
                    example=[
                        {"coordinates": [13.2317, -8.8383], "biomass": 150.5},
                        {"coordinates": [13.4049, -12.5756], "biomass": 200.3}
                    ]
                ),
                Parameter(
                    name="analysis_field",
                    param_type=ParameterType.STRING,
                    description="Campo a ser analisado para identificar hotspots",
                    example="biomass"
                ),
                Parameter(
                    name="method",
                    param_type=ParameterType.STRING,
                    description="Método de análise",
                    required=False,
                    enum_values=["kernel_density", "grid_analysis", "cluster"],
                    example="kernel_density"
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Hotspots identificados com sucesso",
                    example={
                        "success": True,
                        "hotspots": [
                            {
                                "coordinates": [13.2317, -8.8383],
                                "intensity": 0.85,
                                "rank": 1
                            }
                        ],
                        "method": "kernel_density",
                        "total_hotspots": 5
                    }
                )
            ],
            security_required=True
        ))
        
        # Conectividade
        self.endpoints.append(Endpoint(
            path="/qgis/spatial/connectivity-analysis",
            method=HTTPMethod.POST,
            summary="Análise de Conectividade",
            description="Analisa a conectividade entre habitats considerando mobilidade das espécies",
            tags=["Análise Espacial"],
            parameters=[
                Parameter(
                    name="habitats",
                    param_type=ParameterType.ARRAY,
                    description="Array de habitats com coordenadas e tipos",
                    example=[
                        {"type": "Point", "coordinates": [13.2317, -8.8383], "habitat_type": "coral_reef"},
                        {"type": "Point", "coordinates": [13.4049, -12.5756], "habitat_type": "seagrass"}
                    ]
                ),
                Parameter(
                    name="species_mobility",
                    param_type=ParameterType.NUMBER,
                    description="Mobilidade da espécie em quilômetros",
                    minimum=0,
                    maximum=1000,
                    example=50.0
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Análise de conectividade concluída",
                    example={
                        "success": True,
                        "connectivity_matrix": [[1.0, 0.8], [0.8, 1.0]],
                        "connected_pairs": 1,
                        "isolated_habitats": 0
                    }
                )
            ],
            security_required=True
        ))
        
        # Zonas Buffer
        self.endpoints.append(Endpoint(
            path="/qgis/spatial/buffer-zones",
            method=HTTPMethod.POST,
            summary="Criação de Zonas Buffer",
            description="Cria zonas buffer ao redor de geometrias especificadas",
            tags=["Análise Espacial"],
            parameters=[
                Parameter(
                    name="geometries",
                    param_type=ParameterType.ARRAY,
                    description="Array de geometrias para criar buffer",
                    example=[
                        {"type": "Point", "coordinates": [13.2317, -8.8383]},
                        {"type": "Point", "coordinates": [13.4049, -12.5756]}
                    ]
                ),
                Parameter(
                    name="buffer_distance",
                    param_type=ParameterType.NUMBER,
                    description="Distância do buffer em metros",
                    minimum=1,
                    maximum=100000,
                    example=5000
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Zonas buffer criadas com sucesso",
                    example={
                        "success": True,
                        "buffer_zones": [
                            {"type": "Polygon", "coordinates": [[[...]]]},
                            {"type": "Polygon", "coordinates": [[[...]]]}
                        ],
                        "total_area": 78.5
                    }
                )
            ],
            security_required=True
        ))
    
    def _add_temporal_endpoints(self):
        """Adiciona endpoints de análise temporal"""
        
        # Configuração de slider temporal
        self.endpoints.append(Endpoint(
            path="/qgis/temporal/slider-config",
            method=HTTPMethod.POST,
            summary="Configurar Slider Temporal",
            description="Configura slider temporal para visualização de dados ao longo do tempo",
            tags=["Análise Temporal"],
            parameters=[
                Parameter(
                    name="variable",
                    param_type=ParameterType.STRING,
                    description="Variável a ser visualizada temporalmente",
                    enum_values=["chlorophyll_a", "sea_surface_temperature", "fish_biomass"],
                    example="chlorophyll_a"
                ),
                Parameter(
                    name="start_date",
                    param_type=ParameterType.STRING,
                    description="Data de início (YYYY-MM-DD)",
                    format="date",
                    example="2024-01-01"
                ),
                Parameter(
                    name="end_date",
                    param_type=ParameterType.STRING,
                    description="Data de fim (YYYY-MM-DD)",
                    format="date",
                    example="2024-12-31"
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Slider configurado com sucesso",
                    example={
                        "success": True,
                        "config": {
                            "variable": "chlorophyll_a",
                            "time_steps": 365,
                            "min_value": 0.1,
                            "max_value": 2.5
                        }
                    }
                )
            ],
            security_required=True
        ))
        
        # Estatísticas temporais
        self.endpoints.append(Endpoint(
            path="/qgis/temporal/statistics/{variable}",
            method=HTTPMethod.GET,
            summary="Estatísticas Temporais",
            description="Calcula estatísticas temporais para uma variável específica",
            tags=["Análise Temporal"],
            parameters=[
                Parameter(
                    name="variable",
                    param_type=ParameterType.STRING,
                    description="Variável para calcular estatísticas",
                    example="chlorophyll_a"
                ),
                Parameter(
                    name="start_date",
                    param_type=ParameterType.STRING,
                    description="Data de início",
                    required=False,
                    example="2024-01-01"
                ),
                Parameter(
                    name="end_date",
                    param_type=ParameterType.STRING,
                    description="Data de fim",
                    required=False,
                    example="2024-12-31"
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Estatísticas calculadas com sucesso",
                    example={
                        "success": True,
                        "statistics": {
                            "mean": 0.85,
                            "median": 0.78,
                            "std": 0.32,
                            "min": 0.12,
                            "max": 2.45,
                            "trend": "increasing"
                        }
                    }
                )
            ]
        ))
    
    def _add_biomass_endpoints(self):
        """Adiciona endpoints de cálculo de biomassa"""
        
        # Biomassa terrestre
        self.endpoints.append(Endpoint(
            path="/qgis/biomass/terrestrial",
            method=HTTPMethod.POST,
            summary="Cálculo de Biomassa Terrestre",
            description="Calcula biomassa terrestre para uma região específica",
            tags=["Biomassa"],
            parameters=[
                Parameter(
                    name="region_bounds",
                    param_type=ParameterType.OBJECT,
                    description="Limites da região de análise",
                    example={
                        "north": -5.0,
                        "south": -18.0,
                        "east": 24.0,
                        "west": 11.0
                    }
                ),
                Parameter(
                    name="vegetation_type",
                    param_type=ParameterType.STRING,
                    description="Tipo de vegetação",
                    enum_values=["forest", "savanna", "mixed"],
                    required=False,
                    example="mixed"
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Biomassa terrestre calculada",
                    example={
                        "success": True,
                        "total_biomass": 2500000.0,
                        "mean_density": 4.83,
                        "area_km2": 518000,
                        "unit": "Mg"
                    }
                )
            ],
            security_required=True
        ))
        
        # Biomassa marinha
        self.endpoints.append(Endpoint(
            path="/qgis/biomass/marine-phytoplankton",
            method=HTTPMethod.POST,
            summary="Cálculo de Biomassa Marinha",
            description="Calcula biomassa de fitoplâncton marinho",
            tags=["Biomassa"],
            parameters=[
                Parameter(
                    name="region_bounds",
                    param_type=ParameterType.OBJECT,
                    description="Limites da região marinha",
                    required=False,
                    example={
                        "north": -5.0,
                        "south": -18.0,
                        "east": 24.0,
                        "west": 11.0
                    }
                ),
                Parameter(
                    name="depth_range",
                    param_type=ParameterType.ARRAY,
                    description="Faixa de profundidade [min, max] em metros",
                    required=False,
                    example=[0, 50]
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Biomassa marinha calculada",
                    example={
                        "success": True,
                        "total_biomass": 1800000.0,
                        "primary_productivity": 2.45,
                        "area_km2": 350000,
                        "unit": "Mg"
                    }
                )
            ],
            security_required=True
        ))
    
    def _add_migration_endpoints(self):
        """Adiciona endpoints de análise de migração"""
        
        # Carregar trajetórias
        self.endpoints.append(Endpoint(
            path="/qgis/migration/load-trajectories",
            method=HTTPMethod.POST,
            summary="Carregar Trajetórias de Migração",
            description="Carrega e processa trajetórias de migração animal",
            tags=["Migração"],
            parameters=[
                Parameter(
                    name="species",
                    param_type=ParameterType.STRING,
                    description="Espécie a ser analisada",
                    example="tuna"
                ),
                Parameter(
                    name="start_date",
                    param_type=ParameterType.STRING,
                    description="Data de início",
                    format="date",
                    example="2024-01-01"
                ),
                Parameter(
                    name="end_date",
                    param_type=ParameterType.STRING,
                    description="Data de fim",
                    format="date",
                    example="2024-06-30"
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Trajetórias carregadas com sucesso",
                    example={
                        "success": True,
                        "trajectories_count": 15,
                        "total_points": 4580,
                        "species": "tuna",
                        "time_span_days": 180
                    }
                )
            ],
            security_required=True
        ))
    
    def _add_reports_endpoints(self):
        """Adiciona endpoints de relatórios"""
        
        # Gerar relatório
        self.endpoints.append(Endpoint(
            path="/qgis/reports/generate",
            method=HTTPMethod.POST,
            summary="Gerar Relatório Personalizado",
            description="Gera relatório PDF personalizado com análises QGIS",
            tags=["Relatórios"],
            parameters=[
                Parameter(
                    name="report_type",
                    param_type=ParameterType.STRING,
                    description="Tipo de relatório",
                    enum_values=["biomass_assessment", "fishing_analysis", "migration_study"],
                    example="biomass_assessment"
                ),
                Parameter(
                    name="output_filename",
                    param_type=ParameterType.STRING,
                    description="Nome do arquivo de saída",
                    example="relatorio_biomassa_2024.pdf"
                ),
                Parameter(
                    name="include_maps",
                    param_type=ParameterType.BOOLEAN,
                    description="Incluir mapas no relatório",
                    required=False,
                    example=True
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Relatório gerado com sucesso",
                    example={
                        "success": True,
                        "filename": "relatorio_biomassa_2024.pdf",
                        "file_size": 2048576,
                        "download_url": "/downloads/relatorio_biomassa_2024.pdf"
                    }
                )
            ],
            security_required=True
        ))
        
        # Relatório mensal
        self.endpoints.append(Endpoint(
            path="/qgis/reports/monthly/{year}/{month}",
            method=HTTPMethod.GET,
            summary="Relatório Mensal Automático",
            description="Obtém relatório mensal automático gerado pelo sistema",
            tags=["Relatórios"],
            parameters=[
                Parameter(
                    name="year",
                    param_type=ParameterType.INTEGER,
                    description="Ano do relatório",
                    minimum=2020,
                    maximum=2030,
                    example=2024
                ),
                Parameter(
                    name="month",
                    param_type=ParameterType.INTEGER,
                    description="Mês do relatório",
                    minimum=1,
                    maximum=12,
                    example=11
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Relatório mensal obtido",
                    example={
                        "success": True,
                        "report": {
                            "period": "2024-11",
                            "filename": "relatorio_mensal_2024_11.pdf",
                            "generated_at": "2024-12-01T08:00:00Z",
                            "download_url": "/downloads/relatorio_mensal_2024_11.pdf"
                        }
                    }
                )
            ],
            security_required=True
        ))
    
    def _add_mcda_endpoints(self):
        """Adiciona endpoints de análise multicritério"""
        
        # Áreas marinhas protegidas
        self.endpoints.append(Endpoint(
            path="/qgis/mcda/marine-protected-areas",
            method=HTTPMethod.POST,
            summary="Análise MCDA para Áreas Marinhas Protegidas",
            description="Identifica áreas prioritárias para conservação marinha usando análise multicritério",
            tags=["MCDA"],
            parameters=[
                Parameter(
                    name="criteria_weights",
                    param_type=ParameterType.OBJECT,
                    description="Pesos dos critérios de análise",
                    required=False,
                    example={
                        "biodiversity": 0.35,
                        "vulnerability": 0.25,
                        "connectivity": 0.20,
                        "socioeconomic": 0.20
                    }
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Áreas prioritárias identificadas",
                    example={
                        "success": True,
                        "priority_areas": [
                            {
                                "id": "amp_001",
                                "score": 0.85,
                                "area_km2": 1250.5,
                                "coordinates": [[[...]]]
                            }
                        ],
                        "total_recommended_area": 5420.8
                    }
                )
            ],
            security_required=True
        ))
        
        # Zonas de pesca sustentável
        self.endpoints.append(Endpoint(
            path="/qgis/mcda/sustainable-fishing-zones",
            method=HTTPMethod.POST,
            summary="Análise MCDA para Pesca Sustentável",
            description="Identifica zonas ótimas para pesca sustentável",
            tags=["MCDA"],
            parameters=[
                Parameter(
                    name="criteria_weights",
                    param_type=ParameterType.OBJECT,
                    description="Pesos dos critérios",
                    required=False,
                    example={
                        "fish_abundance": 0.40,
                        "accessibility": 0.25,
                        "environmental_impact": 0.20,
                        "economic_viability": 0.15
                    }
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Zonas sustentáveis identificadas",
                    example={
                        "success": True,
                        "sustainable_zones": [
                            {
                                "id": "zone_001",
                                "suitability_score": 0.78,
                                "estimated_yield": 1500,
                                "coordinates": [[[...]]]
                            }
                        ]
                    }
                )
            ],
            security_required=True
        ))
    
    def _add_qgis2web_endpoints(self):
        """Adiciona endpoints de exportação qgis2web"""
        
        # Exportar mapa interativo
        self.endpoints.append(Endpoint(
            path="/qgis2web/export-map",
            method=HTTPMethod.POST,
            summary="Exportar Mapa Interativo",
            description="Exporta mapa interativo usando tecnologia qgis2web",
            tags=["Exportação"],
            parameters=[
                Parameter(
                    name="map_type",
                    param_type=ParameterType.STRING,
                    description="Tipo de mapa a exportar",
                    enum_values=["comprehensive", "fishing", "migration", "environmental"],
                    example="comprehensive"
                ),
                Parameter(
                    name="filename",
                    param_type=ParameterType.STRING,
                    description="Nome do arquivo de saída",
                    required=False,
                    example="mapa_angola_completo.html"
                ),
                Parameter(
                    name="include_temporal",
                    param_type=ParameterType.BOOLEAN,
                    description="Incluir controles temporais",
                    required=False,
                    example=True
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Mapa exportado com sucesso",
                    example={
                        "success": True,
                        "file_name": "mapa_angola_completo.html",
                        "file_size": 5242880,
                        "url": "/static/interactive_maps/mapa_angola_completo.html"
                    }
                )
            ],
            security_required=True
        ))
        
        # Listar mapas
        self.endpoints.append(Endpoint(
            path="/qgis2web/maps",
            method=HTTPMethod.GET,
            summary="Listar Mapas Interativos",
            description="Lista todos os mapas interativos disponíveis",
            tags=["Exportação"],
            parameters=[],
            responses=[
                Response(
                    status_code=200,
                    description="Lista de mapas obtida",
                    example={
                        "success": True,
                        "maps": [
                            {
                                "name": "mapa_angola_completo.html",
                                "size": 5242880,
                                "created": "2024-12-01T10:00:00Z",
                                "url": "/static/interactive_maps/mapa_angola_completo.html"
                            }
                        ],
                        "total": 1
                    }
                )
            ]
        ))
    
    def _add_validation_endpoints(self):
        """Adiciona endpoints de validação de dados"""
        
        # Validar dados
        self.endpoints.append(Endpoint(
            path="/qgis/validation/validate-data",
            method=HTTPMethod.POST,
            summary="Validar Qualidade dos Dados",
            description="Executa validação automática da qualidade dos dados de entrada",
            tags=["Validação"],
            parameters=[
                Parameter(
                    name="data_type",
                    param_type=ParameterType.STRING,
                    description="Tipo de dados a validar",
                    enum_values=["fishing", "environmental", "migration", "generic"],
                    example="environmental"
                ),
                Parameter(
                    name="validation_level",
                    param_type=ParameterType.STRING,
                    description="Nível de validação",
                    enum_values=["basic", "standard", "comprehensive", "strict"],
                    required=False,
                    example="standard"
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Validação concluída",
                    example={
                        "success": True,
                        "overall_score": 85.5,
                        "total_rules": 25,
                        "passed": 20,
                        "warnings": 3,
                        "failed": 2,
                        "errors": 0
                    }
                )
            ],
            security_required=True
        ))
    
    def _add_auth_endpoints(self):
        """Adiciona endpoints de autenticação"""
        
        # Login
        self.endpoints.append(Endpoint(
            path="/auth/login",
            method=HTTPMethod.POST,
            summary="Login de Usuário",
            description="Autentica usuário e retorna tokens de acesso",
            tags=["Autenticação"],
            parameters=[
                Parameter(
                    name="username",
                    param_type=ParameterType.STRING,
                    description="Nome de usuário",
                    example="admin"
                ),
                Parameter(
                    name="password",
                    param_type=ParameterType.STRING,
                    description="Senha do usuário",
                    example="admin123"
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Login realizado com sucesso",
                    example={
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "token_type": "bearer",
                        "expires_in": 1800,
                        "user": {
                            "id": "admin_001",
                            "username": "admin",
                            "role": "admin"
                        }
                    }
                ),
                Response(
                    status_code=401,
                    description="Credenciais inválidas",
                    example={
                        "detail": "Credenciais inválidas"
                    }
                )
            ]
        ))
        
        # Refresh token
        self.endpoints.append(Endpoint(
            path="/auth/refresh",
            method=HTTPMethod.POST,
            summary="Renovar Token",
            description="Renova token de acesso usando refresh token",
            tags=["Autenticação"],
            parameters=[
                Parameter(
                    name="refresh_token",
                    param_type=ParameterType.STRING,
                    description="Token de refresh",
                    example="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
                )
            ],
            responses=[
                Response(
                    status_code=200,
                    description="Token renovado com sucesso",
                    example={
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "token_type": "bearer",
                        "expires_in": 1800
                    }
                )
            ]
        ))
    
    def generate_openapi_spec(self) -> Dict[str, Any]:
        """Gera especificação OpenAPI completa"""
        
        # Estrutura base
        spec = {
            "openapi": self.openapi_version,
            "info": self.api_info,
            "servers": [
                {
                    "url": "http://localhost:8000",
                    "description": "Servidor de desenvolvimento"
                },
                {
                    "url": "https://api.bgapp.com",
                    "description": "Servidor de produção"
                }
            ],
            "paths": {},
            "components": {
                "schemas": self._generate_schemas(),
                "securitySchemes": {
                    "BearerAuth": {
                        "type": "http",
                        "scheme": "bearer",
                        "bearerFormat": "JWT"
                    }
                }
            },
            "tags": self._generate_tags()
        }
        
        # Adicionar endpoints
        for endpoint in self.endpoints:
            path = endpoint.path
            
            # Converter parâmetros de path
            path_params = re.findall(r'\{([^}]+)\}', path)
            
            if path not in spec["paths"]:
                spec["paths"][path] = {}
            
            # Configurar operação
            operation = {
                "summary": endpoint.summary,
                "description": endpoint.description,
                "tags": endpoint.tags,
                "parameters": self._convert_parameters(endpoint.parameters, path_params),
                "responses": self._convert_responses(endpoint.responses)
            }
            
            # Adicionar segurança se necessário
            if endpoint.security_required:
                operation["security"] = [{"BearerAuth": []}]
            
            # Adicionar request body para POST/PUT
            if endpoint.method in [HTTPMethod.POST, HTTPMethod.PUT]:
                request_body = self._generate_request_body(endpoint.parameters)
                if request_body:
                    operation["requestBody"] = request_body
                    # Remover parâmetros que estão no body
                    operation["parameters"] = [
                        p for p in operation["parameters"] 
                        if p.get("in") == "path" or p.get("in") == "query"
                    ]
            
            # Marcar como deprecated se necessário
            if endpoint.deprecated:
                operation["deprecated"] = True
            
            spec["paths"][path][endpoint.method.value] = operation
        
        return spec
    
    def _generate_schemas(self) -> Dict[str, Any]:
        """Gera schemas de componentes"""
        
        return {
            "Error": {
                "type": "object",
                "properties": {
                    "detail": {
                        "type": "string",
                        "description": "Mensagem de erro"
                    },
                    "error_code": {
                        "type": "string",
                        "description": "Código do erro"
                    }
                }
            },
            "SuccessResponse": {
                "type": "object",
                "properties": {
                    "success": {
                        "type": "boolean",
                        "example": True
                    },
                    "message": {
                        "type": "string",
                        "description": "Mensagem de sucesso"
                    },
                    "timestamp": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Timestamp da resposta"
                    }
                }
            },
            "Coordinates": {
                "type": "array",
                "items": {
                    "type": "number"
                },
                "minItems": 2,
                "maxItems": 2,
                "description": "Coordenadas [longitude, latitude]"
            },
            "GeoJSONPoint": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["Point"]
                    },
                    "coordinates": {
                        "$ref": "#/components/schemas/Coordinates"
                    }
                }
            },
            "ValidationResult": {
                "type": "object",
                "properties": {
                    "rule_name": {
                        "type": "string"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["passed", "warning", "failed", "error"]
                    },
                    "message": {
                        "type": "string"
                    },
                    "score": {
                        "type": "number",
                        "minimum": 0,
                        "maximum": 100
                    }
                }
            }
        }
    
    def _generate_tags(self) -> List[Dict[str, Any]]:
        """Gera tags para organização"""
        
        return [
            {
                "name": "Status",
                "description": "Endpoints de status e informações do sistema"
            },
            {
                "name": "Health",
                "description": "Monitorização de saúde e métricas do sistema"
            },
            {
                "name": "Análise Espacial",
                "description": "Análises geoespaciais (hotspots, conectividade, buffers)"
            },
            {
                "name": "Análise Temporal",
                "description": "Análises de séries temporais e visualizações"
            },
            {
                "name": "Biomassa",
                "description": "Cálculos de biomassa terrestre e marinha"
            },
            {
                "name": "Migração",
                "description": "Análises de migração animal e rastreamento"
            },
            {
                "name": "Relatórios",
                "description": "Geração de relatórios automáticos e personalizados"
            },
            {
                "name": "MCDA",
                "description": "Análise multicritério para tomada de decisão"
            },
            {
                "name": "Exportação",
                "description": "Exportação de mapas e dados"
            },
            {
                "name": "Validação",
                "description": "Validação automática da qualidade dos dados"
            },
            {
                "name": "Autenticação",
                "description": "Login, logout e gerenciamento de tokens"
            }
        ]
    
    def _convert_parameters(self, parameters: List[Parameter], path_params: List[str]) -> List[Dict[str, Any]]:
        """Converte parâmetros para formato OpenAPI"""
        
        openapi_params = []
        
        for param in parameters:
            # Determinar localização do parâmetro
            if param.name in path_params:
                param_in = "path"
            else:
                param_in = "query"
            
            openapi_param = {
                "name": param.name,
                "in": param_in,
                "required": param.required,
                "description": param.description,
                "schema": {
                    "type": param.param_type.value
                }
            }
            
            # Adicionar propriedades específicas
            if param.example is not None:
                openapi_param["example"] = param.example
            
            if param.enum_values:
                openapi_param["schema"]["enum"] = param.enum_values
            
            if param.minimum is not None:
                openapi_param["schema"]["minimum"] = param.minimum
            
            if param.maximum is not None:
                openapi_param["schema"]["maximum"] = param.maximum
            
            if param.format:
                openapi_param["schema"]["format"] = param.format
            
            if param.param_type == ParameterType.ARRAY:
                openapi_param["schema"]["items"] = {"type": "string"}
            
            openapi_params.append(openapi_param)
        
        return openapi_params
    
    def _convert_responses(self, responses: List[Response]) -> Dict[str, Any]:
        """Converte respostas para formato OpenAPI"""
        
        openapi_responses = {}
        
        for response in responses:
            response_obj = {
                "description": response.description
            }
            
            if response.example:
                response_obj["content"] = {
                    "application/json": {
                        "example": response.example
                    }
                }
            
            if response.schema:
                if "content" not in response_obj:
                    response_obj["content"] = {"application/json": {}}
                response_obj["content"]["application/json"]["schema"] = response.schema
            
            openapi_responses[str(response.status_code)] = response_obj
        
        return openapi_responses
    
    def _generate_request_body(self, parameters: List[Parameter]) -> Optional[Dict[str, Any]]:
        """Gera request body para operações POST/PUT"""
        
        body_params = [p for p in parameters if p.name not in ["start_date", "end_date"]]
        
        if not body_params:
            return None
        
        properties = {}
        required = []
        
        for param in body_params:
            prop = {
                "type": param.param_type.value,
                "description": param.description
            }
            
            if param.example is not None:
                prop["example"] = param.example
            
            if param.enum_values:
                prop["enum"] = param.enum_values
            
            if param.param_type == ParameterType.ARRAY:
                prop["items"] = {"type": "object"}
            
            properties[param.name] = prop
            
            if param.required:
                required.append(param.name)
        
        schema = {
            "type": "object",
            "properties": properties
        }
        
        if required:
            schema["required"] = required
        
        return {
            "required": True,
            "content": {
                "application/json": {
                    "schema": schema
                }
            }
        }
    
    def export_to_file(self, output_path: str, format: str = "json"):
        """Exporta especificação para arquivo"""
        
        spec = self.generate_openapi_spec()
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        if format.lower() == "json":
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(spec, f, indent=2, ensure_ascii=False)
        
        elif format.lower() == "yaml":
            with open(output_file, 'w', encoding='utf-8') as f:
                yaml.dump(spec, f, default_flow_style=False, allow_unicode=True)
        
        else:
            raise ValueError(f"Formato não suportado: {format}")
        
        logger.info(f"✅ Documentação OpenAPI exportada: {output_file}")
        return str(output_file)
    
    def generate_html_docs(self, output_path: str = "docs/api_documentation.html"):
        """Gera documentação HTML usando Swagger UI"""
        
        spec = self.generate_openapi_spec()
        spec_json = json.dumps(spec, indent=2)
        
        html_template = f"""
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BGAPP QGIS APIs - Documentação</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
        html {{
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }}
        *, *:before, *:after {{
            box-sizing: inherit;
        }}
        body {{
            margin:0;
            background: #fafafa;
        }}
        .swagger-ui .topbar {{
            background-color: #2E8B57;
        }}
        .swagger-ui .topbar .download-url-wrapper .select-label {{
            color: white;
        }}
        .swagger-ui .topbar .download-url-wrapper input[type=text] {{
            border: 2px solid #40E0D0;
        }}
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {{
            const ui = SwaggerUIBundle({{
                url: 'data:application/json;base64,' + btoa(unescape(encodeURIComponent('{spec_json}'))),
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                tryItOutEnabled: true,
                filter: true,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                onComplete: function() {{
                    console.log('Swagger UI carregado');
                }},
                onFailure: function(data) {{
                    console.error('Erro ao carregar Swagger UI:', data);
                }}
            }});
        }};
    </script>
</body>
</html>
        """
        
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_template)
        
        logger.info(f"✅ Documentação HTML gerada: {output_file}")
        return str(output_file)

# Exemplo de uso
def main():
    """Exemplo de uso do gerador de documentação"""
    
    print("📚 Gerando documentação OpenAPI para APIs QGIS...")
    
    # Criar gerador
    generator = SwaggerGenerator()
    
    # Exportar especificação JSON
    json_path = generator.export_to_file("docs/openapi.json", "json")
    print(f"✅ Especificação JSON: {json_path}")
    
    # Exportar especificação YAML
    yaml_path = generator.export_to_file("docs/openapi.yaml", "yaml")
    print(f"✅ Especificação YAML: {yaml_path}")
    
    # Gerar documentação HTML
    html_path = generator.generate_html_docs("docs/api_documentation.html")
    print(f"✅ Documentação HTML: {html_path}")
    
    # Estatísticas
    spec = generator.generate_openapi_spec()
    total_endpoints = len(generator.endpoints)
    total_paths = len(spec["paths"])
    
    print(f"\n📊 ESTATÍSTICAS DA DOCUMENTAÇÃO:")
    print(f"Total de endpoints: {total_endpoints}")
    print(f"Total de paths: {total_paths}")
    print(f"Tags: {len(spec['tags'])}")
    print(f"Schemas: {len(spec['components']['schemas'])}")
    
    print(f"\n🎉 Documentação OpenAPI gerada com sucesso!")
    print(f"Acesse: file://{Path(html_path).absolute()}")

if __name__ == "__main__":
    main()
