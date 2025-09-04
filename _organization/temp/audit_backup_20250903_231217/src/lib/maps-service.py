#!/usr/bin/env python3
"""
BGAPP Maps Service - Sistema Completo de Gestão de Mapas
Serviço especializado para criação, edição e gestão de mapas oceanográficos

🗺️ Silicon Valley Edition - Sistema Avançado de Mapas para ZEE Angola
"""

import json
import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
import logging

from fastapi import FastAPI, HTTPException, Depends, Query, Body, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import asyncio

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# MODELOS DE DADOS PARA MAPAS
# =============================================================================

class MapLayerStyle(BaseModel):
    fillColor: Optional[str] = "#3388ff"
    fillOpacity: Optional[float] = 0.2
    strokeColor: Optional[str] = "#3388ff"
    strokeWidth: Optional[int] = 3
    strokeOpacity: Optional[float] = 1.0
    iconUrl: Optional[str] = None
    iconSize: Optional[List[int]] = [25, 41]
    popupTemplate: Optional[str] = None

class MapLayer(BaseModel):
    id: str
    name: str
    type: str = Field(..., regex="^(geojson|wms|wmts|xyz|vector|raster)$")
    url: Optional[str] = None
    data: Optional[Any] = None
    style: Optional[MapLayerStyle] = None
    visible: bool = True
    opacity: float = Field(default=1.0, ge=0.0, le=1.0)
    zIndex: int = 0
    properties: Dict[str, Any] = {}

class MapControls(BaseModel):
    zoom: bool = True
    scale: bool = True
    fullscreen: bool = True
    layers: bool = True
    search: bool = False
    coordinates: bool = False
    measurement: bool = False
    drawing: bool = False
    export: bool = False

class SpatialExtent(BaseModel):
    north: float = Field(..., ge=-90, le=90)
    south: float = Field(..., ge=-90, le=90)
    east: float = Field(..., ge=-180, le=180)
    west: float = Field(..., ge=-180, le=180)

class TemporalExtent(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None

class MapMetadata(BaseModel):
    title: str
    abstract: Optional[str] = None
    keywords: List[str] = []
    author: str
    organization: Optional[str] = "BGAPP - Blue Growth Angola"
    contact: Optional[str] = None
    license: Optional[str] = "CC BY 4.0"
    version: str = "1.0.0"
    language: str = "pt"
    spatial_extent: SpatialExtent
    temporal_extent: Optional[TemporalExtent] = None

class MapConfiguration(BaseModel):
    id: str
    name: str
    description: str
    category: str = Field(..., regex="^(oceanographic|fisheries|biodiversity|coastal|administrative|scientific)$")
    center: List[float] = Field(..., min_items=2, max_items=2)
    zoom: int = Field(default=6, ge=1, le=20)
    minZoom: Optional[int] = Field(default=1, ge=1, le=20)
    maxZoom: Optional[int] = Field(default=18, ge=1, le=20)
    bounds: Optional[List[List[float]]] = None
    baseLayers: List[str] = ["osm"]
    defaultBaseLayer: str = "osm"
    overlayLayers: List[MapLayer] = []
    controls: MapControls = MapControls()
    metadata: MapMetadata
    created_at: str
    updated_at: str
    created_by: str
    status: str = Field(default="active", regex="^(active|draft|archived)$")

class BGAPPMap(BaseModel):
    id: str
    name: str
    description: str
    url: str
    icon: str = "🗺️"
    category: str
    features: List[str] = []
    iframe_config: Optional[Dict[str, str]] = None
    status: str = Field(default="active", regex="^(active|maintenance|offline)$")
    last_updated: str
    configuration: Optional[MapConfiguration] = None

class MapTemplate(BaseModel):
    id: str
    name: str
    description: str
    category: str
    preview_image: Optional[str] = None
    configuration: Dict[str, Any]
    required_layers: List[str] = []
    optional_layers: List[str] = []

class MapCreationRequest(BaseModel):
    name: str
    description: str
    category: str
    template_id: Optional[str] = None
    configuration: Dict[str, Any]
    layers: List[MapLayer] = []

class MapStats(BaseModel):
    total_maps: int
    active_maps: int
    maps_by_category: Dict[str, int]
    most_used_maps: List[Dict[str, Any]]
    recent_maps: List[Dict[str, Any]]

# =============================================================================
# SISTEMA DE GESTÃO DE MAPAS
# =============================================================================

class BGAPPMapsService:
    """Serviço principal para gestão de mapas BGAPP"""
    
    def __init__(self):
        self.maps_dir = Path("data/maps")
        self.templates_dir = Path("data/map_templates")
        self.configs_dir = Path("data/map_configs")
        
        # Criar diretórios se não existirem
        for directory in [self.maps_dir, self.templates_dir, self.configs_dir]:
            directory.mkdir(parents=True, exist_ok=True)
        
        # Inicializar mapas padrão do BGAPP
        self._initialize_default_maps()
        self._initialize_default_templates()
    
    def _initialize_default_maps(self):
        """Inicializar mapas padrão do BGAPP baseados nos existentes"""
        default_maps = {
            "realtime_angola": {
                "id": "realtime_angola",
                "name": "Realtime Angola",
                "description": "Dados oceanográficos em tempo real da costa angolana",
                "url": "http://localhost:8085/realtime_angola.html",
                "icon": "🌊",
                "category": "oceanographic",
                "features": ["SST", "Correntes", "Ventos", "Clorofila-a", "Batimetria"],
                "iframe_config": {
                    "sandbox": "allow-scripts allow-same-origin",
                    "allow": "fullscreen",
                    "loading": "lazy"
                },
                "status": "active",
                "last_updated": datetime.now().isoformat()
            },
            "dashboard_cientifico": {
                "id": "dashboard_cientifico",
                "name": "Dashboard Científico",
                "description": "Interface científica principal para dados oceanográficos",
                "url": "http://localhost:8085/dashboard_cientifico.html",
                "icon": "🔬",
                "category": "scientific",
                "features": ["Análise Científica", "Múltiplas Camadas", "Visualizações Avançadas"],
                "iframe_config": {
                    "sandbox": "allow-scripts allow-same-origin",
                    "allow": "fullscreen",
                    "loading": "lazy"
                },
                "status": "active",
                "last_updated": datetime.now().isoformat()
            },
            "qgis_dashboard": {
                "id": "qgis_dashboard",
                "name": "QGIS Dashboard",
                "description": "Dashboard QGIS principal com análise espacial",
                "url": "http://localhost:8085/qgis_dashboard.html",
                "icon": "🗺️",
                "category": "administrative",
                "features": ["Análise Espacial", "QGIS Integration", "Geoprocessamento"],
                "iframe_config": {
                    "sandbox": "allow-scripts allow-same-origin",
                    "allow": "fullscreen",
                    "loading": "lazy"
                },
                "status": "active",
                "last_updated": datetime.now().isoformat()
            },
            "qgis_fisheries": {
                "id": "qgis_fisheries",
                "name": "QGIS Pescas",
                "description": "Sistema QGIS especializado para gestão pesqueira",
                "url": "http://localhost:8085/qgis_fisheries.html",
                "icon": "🎣",
                "category": "fisheries",
                "features": ["Gestão Pesqueira", "Zonas de Pesca", "Análise de Stocks"],
                "iframe_config": {
                    "sandbox": "allow-scripts allow-same-origin",
                    "allow": "fullscreen",
                    "loading": "lazy"
                },
                "status": "active",
                "last_updated": datetime.now().isoformat()
            }
        }
        
        # Salvar mapas padrão
        for map_id, map_data in default_maps.items():
            map_file = self.maps_dir / f"{map_id}.json"
            if not map_file.exists():
                with open(map_file, 'w', encoding='utf-8') as f:
                    json.dump(map_data, f, indent=2, ensure_ascii=False)
    
    def _initialize_default_templates(self):
        """Inicializar templates padrão para criação de mapas"""
        default_templates = {
            "oceanographic_basic": {
                "id": "oceanographic_basic",
                "name": "Mapa Oceanográfico Básico",
                "description": "Template básico para mapas oceanográficos com camadas essenciais",
                "category": "oceanographic",
                "configuration": {
                    "center": [-12.5, 13.5],  # Centro de Angola
                    "zoom": 6,
                    "minZoom": 4,
                    "maxZoom": 15,
                    "bounds": [[-18.2, 8.5], [-4.2, 17.5]],  # Bounds de Angola
                    "baseLayers": ["osm", "satellite", "terrain"],
                    "defaultBaseLayer": "satellite",
                    "controls": {
                        "zoom": True,
                        "scale": True,
                        "fullscreen": True,
                        "layers": True,
                        "coordinates": True
                    }
                },
                "required_layers": ["zee_angola"],
                "optional_layers": ["bathymetry", "sst", "currents"]
            },
            "fisheries_management": {
                "id": "fisheries_management",
                "name": "Gestão Pesqueira",
                "description": "Template para mapas de gestão e monitoramento pesqueiro",
                "category": "fisheries",
                "configuration": {
                    "center": [-12.5, 13.5],
                    "zoom": 7,
                    "controls": {
                        "zoom": True,
                        "scale": True,
                        "fullscreen": True,
                        "layers": True,
                        "measurement": True,
                        "drawing": True
                    }
                },
                "required_layers": ["fishing_zones", "ports"],
                "optional_layers": ["vessel_tracks", "fish_stocks"]
            },
            "biodiversity_analysis": {
                "id": "biodiversity_analysis",
                "name": "Análise de Biodiversidade",
                "description": "Template para estudos e análises de biodiversidade marinha",
                "category": "biodiversity",
                "configuration": {
                    "center": [-12.5, 13.5],
                    "zoom": 6,
                    "controls": {
                        "zoom": True,
                        "scale": True,
                        "fullscreen": True,
                        "layers": True,
                        "search": True,
                        "export": True
                    }
                },
                "required_layers": ["protected_areas", "species_observations"],
                "optional_layers": ["habitat_suitability", "coral_reefs"]
            }
        }
        
        # Salvar templates padrão
        for template_id, template_data in default_templates.items():
            template_file = self.templates_dir / f"{template_id}.json"
            if not template_file.exists():
                with open(template_file, 'w', encoding='utf-8') as f:
                    json.dump(template_data, f, indent=2, ensure_ascii=False)
    
    async def get_all_maps(self) -> List[BGAPPMap]:
        """Obter todos os mapas disponíveis"""
        maps = []
        
        for map_file in self.maps_dir.glob("*.json"):
            try:
                with open(map_file, 'r', encoding='utf-8') as f:
                    map_data = json.load(f)
                    maps.append(BGAPPMap(**map_data))
            except Exception as e:
                logger.error(f"Erro ao carregar mapa {map_file}: {e}")
        
        return maps
    
    async def get_map_by_id(self, map_id: str) -> Optional[BGAPPMap]:
        """Obter mapa específico por ID"""
        map_file = self.maps_dir / f"{map_id}.json"
        
        if not map_file.exists():
            return None
        
        try:
            with open(map_file, 'r', encoding='utf-8') as f:
                map_data = json.load(f)
                return BGAPPMap(**map_data)
        except Exception as e:
            logger.error(f"Erro ao carregar mapa {map_id}: {e}")
            return None
    
    async def create_map(self, map_request: MapCreationRequest, created_by: str = "admin") -> BGAPPMap:
        """Criar novo mapa"""
        map_id = str(uuid.uuid4())
        current_time = datetime.now().isoformat()
        
        # Criar configuração do mapa
        metadata = MapMetadata(
            title=map_request.name,
            abstract=map_request.description,
            keywords=[map_request.category, "BGAPP", "Angola"],
            author=created_by,
            spatial_extent=SpatialExtent(
                north=-4.2, south=-18.2, east=17.5, west=8.5  # Bounds de Angola
            )
        )
        
        configuration = MapConfiguration(
            id=map_id,
            name=map_request.name,
            description=map_request.description,
            category=map_request.category,
            center=map_request.configuration.get("center", [-12.5, 13.5]),
            zoom=map_request.configuration.get("zoom", 6),
            overlayLayers=map_request.layers,
            metadata=metadata,
            created_at=current_time,
            updated_at=current_time,
            created_by=created_by
        )
        
        # Criar mapa BGAPP
        new_map = BGAPPMap(
            id=map_id,
            name=map_request.name,
            description=map_request.description,
            url=f"/maps/{map_id}",
            category=map_request.category,
            features=[layer.name for layer in map_request.layers],
            status="active",
            last_updated=current_time,
            configuration=configuration
        )
        
        # Salvar mapa
        map_file = self.maps_dir / f"{map_id}.json"
        with open(map_file, 'w', encoding='utf-8') as f:
            json.dump(new_map.dict(), f, indent=2, ensure_ascii=False)
        
        return new_map
    
    async def update_map(self, map_id: str, updates: Dict[str, Any]) -> Optional[BGAPPMap]:
        """Atualizar mapa existente"""
        current_map = await self.get_map_by_id(map_id)
        
        if not current_map:
            return None
        
        # Atualizar campos
        map_data = current_map.dict()
        map_data.update(updates)
        map_data["last_updated"] = datetime.now().isoformat()
        
        # Salvar alterações
        map_file = self.maps_dir / f"{map_id}.json"
        with open(map_file, 'w', encoding='utf-8') as f:
            json.dump(map_data, f, indent=2, ensure_ascii=False)
        
        return BGAPPMap(**map_data)
    
    async def delete_map(self, map_id: str) -> bool:
        """Deletar mapa"""
        map_file = self.maps_dir / f"{map_id}.json"
        
        if not map_file.exists():
            return False
        
        try:
            map_file.unlink()
            return True
        except Exception as e:
            logger.error(f"Erro ao deletar mapa {map_id}: {e}")
            return False
    
    async def get_map_templates(self) -> List[MapTemplate]:
        """Obter templates disponíveis"""
        templates = []
        
        for template_file in self.templates_dir.glob("*.json"):
            try:
                with open(template_file, 'r', encoding='utf-8') as f:
                    template_data = json.load(f)
                    templates.append(MapTemplate(**template_data))
            except Exception as e:
                logger.error(f"Erro ao carregar template {template_file}: {e}")
        
        return templates
    
    async def get_maps_stats(self) -> MapStats:
        """Obter estatísticas dos mapas"""
        maps = await self.get_all_maps()
        
        total_maps = len(maps)
        active_maps = len([m for m in maps if m.status == "active"])
        
        # Mapas por categoria
        maps_by_category = {}
        for map_obj in maps:
            category = map_obj.category
            maps_by_category[category] = maps_by_category.get(category, 0) + 1
        
        # Mapas mais usados (simulado)
        most_used_maps = [
            {"id": "realtime_angola", "name": "Realtime Angola", "views": 1250},
            {"id": "dashboard_cientifico", "name": "Dashboard Científico", "views": 980},
            {"id": "qgis_fisheries", "name": "QGIS Pescas", "views": 750}
        ]
        
        # Mapas recentes
        recent_maps = [
            {"id": m.id, "name": m.name, "created_at": m.last_updated}
            for m in sorted(maps, key=lambda x: x.last_updated, reverse=True)[:5]
        ]
        
        return MapStats(
            total_maps=total_maps,
            active_maps=active_maps,
            maps_by_category=maps_by_category,
            most_used_maps=most_used_maps,
            recent_maps=recent_maps
        )

# Instância global do serviço
maps_service = BGAPPMapsService()

# =============================================================================
# ENDPOINTS DA API DE MAPAS
# =============================================================================

async def get_maps_service():
    """Dependency injection para o serviço de mapas"""
    return maps_service

# Endpoints principais
async def get_all_maps_endpoint(service: BGAPPMapsService = Depends(get_maps_service)):
    """GET /api/maps - Listar todos os mapas"""
    try:
        maps = await service.get_all_maps()
        return {
            "success": True,
            "data": [map_obj.dict() for map_obj in maps],
            "total": len(maps),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erro ao obter mapas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_map_by_id_endpoint(
    map_id: str,
    service: BGAPPMapsService = Depends(get_maps_service)
):
    """GET /api/maps/{map_id} - Obter mapa específico"""
    try:
        map_obj = await service.get_map_by_id(map_id)
        
        if not map_obj:
            raise HTTPException(status_code=404, detail="Mapa não encontrado")
        
        return {
            "success": True,
            "data": map_obj.dict(),
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter mapa {map_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def create_map_endpoint(
    map_request: MapCreationRequest,
    service: BGAPPMapsService = Depends(get_maps_service)
):
    """POST /api/maps - Criar novo mapa"""
    try:
        new_map = await service.create_map(map_request)
        
        return {
            "success": True,
            "data": new_map.dict(),
            "message": f"Mapa '{new_map.name}' criado com sucesso",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erro ao criar mapa: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def update_map_endpoint(
    map_id: str,
    updates: Dict[str, Any] = Body(...),
    service: BGAPPMapsService = Depends(get_maps_service)
):
    """PUT /api/maps/{map_id} - Atualizar mapa"""
    try:
        updated_map = await service.update_map(map_id, updates)
        
        if not updated_map:
            raise HTTPException(status_code=404, detail="Mapa não encontrado")
        
        return {
            "success": True,
            "data": updated_map.dict(),
            "message": f"Mapa '{updated_map.name}' atualizado com sucesso",
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar mapa {map_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def delete_map_endpoint(
    map_id: str,
    service: BGAPPMapsService = Depends(get_maps_service)
):
    """DELETE /api/maps/{map_id} - Deletar mapa"""
    try:
        success = await service.delete_map(map_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Mapa não encontrado")
        
        return {
            "success": True,
            "message": f"Mapa {map_id} deletado com sucesso",
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar mapa {map_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_map_templates_endpoint(service: BGAPPMapsService = Depends(get_maps_service)):
    """GET /api/maps/templates - Obter templates de mapas"""
    try:
        templates = await service.get_map_templates()
        
        return {
            "success": True,
            "data": [template.dict() for template in templates],
            "total": len(templates),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erro ao obter templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_maps_stats_endpoint(service: BGAPPMapsService = Depends(get_maps_service)):
    """GET /api/maps/stats - Obter estatísticas dos mapas"""
    try:
        stats = await service.get_maps_stats()
        
        return {
            "success": True,
            "data": stats.dict(),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# FERRAMENTAS AVANÇADAS PARA CRIAÇÃO DE MAPAS
# =============================================================================

class MapCreationTools:
    """Ferramentas avançadas para criação e configuração de mapas"""
    
    @staticmethod
    async def validate_map_configuration(config: Dict[str, Any]) -> Dict[str, Any]:
        """Validar configuração de mapa"""
        validation_result = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "suggestions": []
        }
        
        # Validar centro do mapa
        if "center" in config:
            center = config["center"]
            if len(center) != 2:
                validation_result["errors"].append("Centro deve ter exatamente 2 coordenadas [lat, lng]")
                validation_result["valid"] = False
            elif not (-90 <= center[0] <= 90) or not (-180 <= center[1] <= 180):
                validation_result["errors"].append("Coordenadas do centro inválidas")
                validation_result["valid"] = False
        
        # Validar zoom
        if "zoom" in config:
            zoom = config["zoom"]
            if not (1 <= zoom <= 20):
                validation_result["errors"].append("Zoom deve estar entre 1 e 20")
                validation_result["valid"] = False
        
        # Sugestões baseadas na categoria
        category = config.get("category", "")
        if category == "oceanographic":
            validation_result["suggestions"].append("Considere adicionar camadas de SST e batimetria")
        elif category == "fisheries":
            validation_result["suggestions"].append("Inclua zonas de pesca e dados de embarcações")
        elif category == "biodiversity":
            validation_result["suggestions"].append("Adicione áreas protegidas e observações de espécies")
        
        return validation_result
    
    @staticmethod
    async def generate_map_preview(config: Dict[str, Any]) -> str:
        """Gerar preview do mapa (retorna URL ou base64)"""
        # Simulação de geração de preview
        # Em implementação real, geraria uma imagem do mapa
        preview_url = f"/api/maps/preview/{uuid.uuid4()}.png"
        return preview_url
    
    @staticmethod
    async def suggest_layers_for_category(category: str) -> List[Dict[str, Any]]:
        """Sugerir camadas baseadas na categoria do mapa"""
        layer_suggestions = {
            "oceanographic": [
                {"name": "ZEE Angola", "type": "geojson", "required": True},
                {"name": "Temperatura Superficial", "type": "wms", "required": False},
                {"name": "Batimetria", "type": "wms", "required": False},
                {"name": "Correntes Oceânicas", "type": "wms", "required": False}
            ],
            "fisheries": [
                {"name": "Zonas de Pesca", "type": "geojson", "required": True},
                {"name": "Portos Pesqueiros", "type": "geojson", "required": True},
                {"name": "Rotas de Embarcações", "type": "vector", "required": False},
                {"name": "Stocks Pesqueiros", "type": "wms", "required": False}
            ],
            "biodiversity": [
                {"name": "Áreas Protegidas", "type": "geojson", "required": True},
                {"name": "Observações de Espécies", "type": "vector", "required": False},
                {"name": "Habitats Críticos", "type": "wms", "required": False},
                {"name": "Recifes de Coral", "type": "geojson", "required": False}
            ],
            "coastal": [
                {"name": "Linha de Costa", "type": "geojson", "required": True},
                {"name": "Erosão Costeira", "type": "wms", "required": False},
                {"name": "Infraestrutura Costeira", "type": "vector", "required": False}
            ]
        }
        
        return layer_suggestions.get(category, [])
    
    @staticmethod
    async def optimize_map_performance(config: Dict[str, Any]) -> Dict[str, Any]:
        """Otimizar configuração do mapa para performance"""
        optimized_config = config.copy()
        
        # Otimizações automáticas
        optimizations_applied = []
        
        # Limitar número de camadas visíveis
        if "overlayLayers" in optimized_config:
            visible_layers = [layer for layer in optimized_config["overlayLayers"] if layer.get("visible", True)]
            if len(visible_layers) > 5:
                # Manter apenas as 5 primeiras camadas visíveis
                for i, layer in enumerate(optimized_config["overlayLayers"]):
                    if i >= 5:
                        layer["visible"] = False
                optimizations_applied.append("Limitado número de camadas visíveis para melhor performance")
        
        # Ajustar opacidade para camadas sobrepostas
        if "overlayLayers" in optimized_config:
            for layer in optimized_config["overlayLayers"]:
                if layer.get("opacity", 1.0) > 0.8:
                    layer["opacity"] = 0.7
                    optimizations_applied.append(f"Ajustada opacidade da camada {layer.get('name', 'sem nome')}")
        
        # Configurar controles otimizados
        if "controls" not in optimized_config:
            optimized_config["controls"] = {}
        
        # Desabilitar controles pesados por padrão
        heavy_controls = ["drawing", "measurement", "export"]
        for control in heavy_controls:
            if optimized_config["controls"].get(control, False):
                optimized_config["controls"][control] = False
                optimizations_applied.append(f"Desabilitado controle {control} para melhor performance")
        
        return {
            "config": optimized_config,
            "optimizations": optimizations_applied
        }

# Instância das ferramentas
map_tools = MapCreationTools()

# Endpoints das ferramentas
async def validate_map_config_endpoint(config: Dict[str, Any] = Body(...)):
    """POST /api/maps/tools/validate - Validar configuração de mapa"""
    try:
        validation = await map_tools.validate_map_configuration(config)
        
        return {
            "success": True,
            "data": validation,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erro na validação: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def suggest_layers_endpoint(category: str):
    """GET /api/maps/tools/suggest-layers/{category} - Sugerir camadas por categoria"""
    try:
        suggestions = await map_tools.suggest_layers_for_category(category)
        
        return {
            "success": True,
            "data": suggestions,
            "category": category,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erro ao sugerir camadas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def optimize_map_endpoint(config: Dict[str, Any] = Body(...)):
    """POST /api/maps/tools/optimize - Otimizar configuração de mapa"""
    try:
        optimization = await map_tools.optimize_map_performance(config)
        
        return {
            "success": True,
            "data": optimization,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erro na otimização: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# CONFIGURAÇÃO FINAL
# =============================================================================

if __name__ == "__main__":
    print("🗺️ BGAPP Maps Service - Sistema de Gestão de Mapas")
    print("✅ Serviço inicializado com sucesso!")
    print(f"📁 Diretório de mapas: {maps_service.maps_dir}")
    print(f"📋 Diretório de templates: {maps_service.templates_dir}")
