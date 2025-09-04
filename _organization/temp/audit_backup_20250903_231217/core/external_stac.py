"""
Cliente STAC para integração com APIs externas
Implementação para acessar coleções oceanográficas de alta qualidade
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin

import aiohttp
import requests
from pydantic import BaseModel, Field

from .config import AppConfig


class STACCollection(BaseModel):
    """Modelo para coleção STAC externa"""
    id: str
    title: str
    description: str
    license: str
    extent: Dict[str, Any]
    providers: List[Dict[str, Any]]
    keywords: List[str] = Field(default_factory=list)
    api_url: str
    relevance_score: float = 0.0


class STACItem(BaseModel):
    """Modelo para item STAC"""
    id: str
    collection: str
    geometry: Dict[str, Any]
    properties: Dict[str, Any]
    assets: Dict[str, Any]
    bbox: List[float]
    datetime: str


class ExternalSTACClient:
    """Cliente para acessar APIs STAC externas"""
    
    # APIs STAC públicas identificadas no estudo
    STAC_APIS = {
        "planetary_computer": {
            "url": "https://planetarycomputer.microsoft.com/api/stac/v1",
            "description": "Microsoft Planetary Computer - 126 coleções",
            "quality": 5,
            "auth_required": False
        },
        "earth_search": {
            "url": "https://earth-search.aws.element84.com/v1",
            "description": "Element84 Earth Search - Sentinel/Landsat",
            "quality": 5,
            "auth_required": False
        },
        "brazil_data_cube": {
            "url": "https://data.inpe.br/bdc/stac/v1",
            "description": "Brazil Data Cube - América do Sul",
            "quality": 3,
            "auth_required": False
        }
    }
    
    # Coleções prioritárias para dados oceanográficos
    PRIORITY_COLLECTIONS = {
        "noaa-cdr-sea-surface-temperature-whoi": {
            "api": "planetary_computer",
            "relevance": 5.0,
            "data_type": "sea_surface_temperature",
            "temporal_coverage": "1988-present",
            "spatial_resolution": "0.25°",
            "update_frequency": "3-hourly"
        },
        "sentinel-3-slstr-wst-l2-netcdf": {
            "api": "planetary_computer",
            "relevance": 5.0,
            "data_type": "sea_surface_temperature",
            "temporal_coverage": "2017-present",
            "spatial_resolution": "1km",
            "update_frequency": "daily"
        },
        "sentinel-3-sral-wat-l2-netcdf": {
            "api": "planetary_computer",
            "relevance": 4.0,
            "data_type": "altimetry",
            "temporal_coverage": "2017-present",
            "spatial_resolution": "1km",
            "update_frequency": "daily"
        },
        "noaa-cdr-ocean-heat-content": {
            "api": "planetary_computer",
            "relevance": 4.0,
            "data_type": "ocean_heat_content",
            "temporal_coverage": "historical",
            "spatial_resolution": "variable",
            "update_frequency": "monthly"
        },
        "sentinel-2-l2a": {
            "api": "earth_search",
            "relevance": 4.5,
            "data_type": "optical_imagery",
            "temporal_coverage": "2015-present",
            "spatial_resolution": "10-60m",
            "update_frequency": "5-day revisit"
        },
        "sentinel-1-grd": {
            "api": "earth_search",
            "relevance": 4.0,
            "data_type": "radar_imagery",
            "temporal_coverage": "2014-present",
            "spatial_resolution": "10m",
            "update_frequency": "6-12 day revisit"
        }
    }
    
    # Bbox para Angola (expandido para incluir ZEE)
    ANGOLA_BBOX = [8.1559051, -18.922632, 13.794773, -4.2610419]
    
    def __init__(self, config: Optional[AppConfig] = None):
        self.config = config or AppConfig()
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "BGAPP/2.0 external-stac-client",
            "Accept": "application/json"
        })
        self._cache = {}  # Cache simples em memória
        
    async def get_collection(self, collection_id: str, api_name: str = None) -> Optional[STACCollection]:
        """Buscar informações de uma coleção específica"""
        if api_name is None:
            # Determinar API baseado nas coleções prioritárias
            collection_info = self.PRIORITY_COLLECTIONS.get(collection_id)
            if collection_info:
                api_name = collection_info["api"]
            else:
                api_name = "planetary_computer"  # Default
        
        api_config = self.STAC_APIS.get(api_name)
        if not api_config:
            return None
            
        url = f"{api_config['url']}/collections/{collection_id}"
        
        # Verificar cache
        cache_key = f"collection_{api_name}_{collection_id}"
        if cache_key in self._cache:
            cached_data, timestamp = self._cache[cache_key]
            # Cache válido por 1 hora
            if datetime.now() - timestamp < timedelta(hours=1):
                return STACCollection(**cached_data, api_url=api_config['url'])
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Calcular relevância
                        relevance = self._calculate_relevance(collection_id, data)
                        
                        collection = STACCollection(
                            id=data["id"],
                            title=data["title"],
                            description=data["description"],
                            license=data["license"],
                            extent=data["extent"],
                            providers=data.get("providers", []),
                            keywords=data.get("keywords", []),
                            api_url=api_config['url'],
                            relevance_score=relevance
                        )
                        
                        # Atualizar cache
                        self._cache[cache_key] = (data, datetime.now())
                        
                        return collection
                        
        except Exception as e:
            print(f"Erro ao buscar coleção {collection_id}: {e}")
            return None
    
    async def search_items(
        self, 
        collection_id: str, 
        bbox: Optional[List[float]] = None,
        datetime_range: Optional[str] = None,
        limit: int = 100,
        api_name: str = None
    ) -> List[STACItem]:
        """Buscar itens em uma coleção com filtros espaciais e temporais"""
        
        if api_name is None:
            collection_info = self.PRIORITY_COLLECTIONS.get(collection_id)
            if collection_info:
                api_name = collection_info["api"]
            else:
                api_name = "planetary_computer"
        
        api_config = self.STAC_APIS.get(api_name)
        if not api_config:
            return []
        
        # Usar bbox de Angola como padrão
        search_bbox = bbox or self.ANGOLA_BBOX
        
        # Construir parâmetros de busca
        params = {
            "collections": collection_id,
            "limit": limit,
            "bbox": ",".join(map(str, search_bbox))
        }
        
        if datetime_range:
            params["datetime"] = datetime_range
        
        url = f"{api_config['url']}/search"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        items = []
                        
                        if data and "features" in data:
                            for feature in data.get("features", []):
                                try:
                                    item = STACItem(
                                        id=feature["id"],
                                        collection=feature["collection"],
                                        geometry=feature["geometry"],
                                        properties=feature["properties"],
                                        assets=feature["assets"],
                                        bbox=feature.get("bbox", search_bbox),
                                        datetime=feature["properties"].get("datetime", "")
                                    )
                                    items.append(item)
                                except Exception as e:
                                    print(f"Erro ao processar item {feature.get('id', 'unknown')}: {e}")
                                    continue
                        
                        return items
                        
        except Exception as e:
            print(f"Erro ao buscar itens da coleção {collection_id}: {e}")
            return []
    
    async def get_priority_collections(self) -> List[STACCollection]:
        """Buscar todas as coleções prioritárias identificadas no estudo"""
        collections = []
        
        for collection_id, info in self.PRIORITY_COLLECTIONS.items():
            collection = await self.get_collection(collection_id, info["api"])
            if collection:
                # Adicionar informações extras do estudo
                collection.relevance_score = info["relevance"]
                collections.append(collection)
        
        # Ordenar por relevância
        collections.sort(key=lambda x: x.relevance_score, reverse=True)
        return collections
    
    async def get_recent_sst_data(self, days_back: int = 7) -> List[STACItem]:
        """Buscar dados recentes de temperatura da superfície do mar"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        datetime_range = f"{start_date.isoformat()}Z/{end_date.isoformat()}Z"
        
        # Buscar em ambas as coleções SST
        sst_collections = [
            "noaa-cdr-sea-surface-temperature-whoi",
            "sentinel-3-slstr-wst-l2-netcdf"
        ]
        
        all_items = []
        for collection_id in sst_collections:
            items = await self.search_items(
                collection_id=collection_id,
                datetime_range=datetime_range,
                limit=50
            )
            all_items.extend(items)
        
        # Ordenar por data (mais recente primeiro)
        all_items.sort(
            key=lambda x: x.properties.get("datetime", ""), 
            reverse=True
        )
        
        return all_items[:20]  # Retornar apenas os 20 mais recentes
    
    def _calculate_relevance(self, collection_id: str, collection_data: Dict) -> float:
        """Calcular score de relevância baseado nos critérios do estudo"""
        base_score = 0.0
        
        # Score base das coleções prioritárias
        if collection_id in self.PRIORITY_COLLECTIONS:
            base_score = self.PRIORITY_COLLECTIONS[collection_id]["relevance"]
        
        # Bonificações baseadas em keywords
        keywords = collection_data.get("keywords", [])
        ocean_keywords = ["ocean", "marine", "sea", "coastal", "temperature", "sst"]
        
        keyword_bonus = sum(0.1 for keyword in keywords 
                          if any(ok in keyword.lower() for ok in ocean_keywords))
        
        # Bonificação por cobertura temporal recente
        extent = collection_data.get("extent", {})
        temporal = extent.get("temporal", {})
        intervals = temporal.get("interval", [[]])
        
        temporal_bonus = 0.0
        if intervals and intervals[0]:
            end_date = intervals[0][1]
            if end_date is None or "2024" in str(end_date) or "2025" in str(end_date):
                temporal_bonus = 0.5  # Dados atuais
        
        return min(5.0, base_score + keyword_bonus + temporal_bonus)
    
    async def health_check(self) -> Dict[str, Any]:
        """Verificar saúde das APIs STAC externas"""
        health_status = {}
        
        for api_name, api_config in self.STAC_APIS.items():
            try:
                async with aiohttp.ClientSession() as session:
                    start_time = datetime.now()
                    async with session.get(api_config["url"], timeout=10) as response:
                        response_time = (datetime.now() - start_time).total_seconds()
                        
                        health_status[api_name] = {
                            "status": "healthy" if response.status == 200 else "unhealthy",
                            "response_time_ms": int(response_time * 1000),
                            "status_code": response.status,
                            "description": api_config["description"]
                        }
            except Exception as e:
                health_status[api_name] = {
                    "status": "error",
                    "error": str(e),
                    "description": api_config["description"]
                }
        
        return health_status
    
    def get_collection_summary(self) -> Dict[str, Any]:
        """Retornar resumo das coleções disponíveis"""
        return {
            "total_apis": len(self.STAC_APIS),
            "priority_collections": len(self.PRIORITY_COLLECTIONS),
            "data_types": list(set(
                info["data_type"] for info in self.PRIORITY_COLLECTIONS.values()
            )),
            "coverage_area": {
                "angola_bbox": self.ANGOLA_BBOX,
                "description": "Angola EEZ + coastal waters"
            },
            "apis": {
                name: {
                    "url": config["url"],
                    "quality": config["quality"],
                    "description": config["description"]
                }
                for name, config in self.STAC_APIS.items()
            }
        }


# Instância global para uso em toda a aplicação
external_stac_client = ExternalSTACClient()
