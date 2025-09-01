from __future__ import annotations

import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

from .external_stac import ExternalSTACClient, external_stac_client


class STACManager:
    def __init__(self, stac_url: str = "http://localhost:8081"):
        self.base_url = stac_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "BGAPP/0.1 stac-client"})

    def create_collection(self, collection_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update STAC collection."""
        url = f"{self.base_url}/collections"
        collection = {
            "type": "Collection",
            "id": collection_id,
            "stac_version": "1.0.0",
            "title": metadata.get("title", collection_id),
            "description": metadata.get("description", ""),
            "keywords": metadata.get("keywords", []),
            "license": metadata.get("license", "proprietary"),
            "extent": metadata.get("extent", {
                "spatial": {"bbox": [[-180, -90, 180, 90]]},
                "temporal": {"interval": [[None, None]]}
            }),
            "links": [],
        }
        
        try:
            resp = self.session.post(url, json=collection, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            print(f"Failed to create collection {collection_id}: {e}")
            return {}

    def create_item(self, collection_id: str, item_id: str, geometry: Dict[str, Any], 
                   properties: Dict[str, Any], assets: Dict[str, Any]) -> Dict[str, Any]:
        """Create STAC item in collection."""
        url = f"{self.base_url}/collections/{collection_id}/items"
        item = {
            "type": "Feature",
            "stac_version": "1.0.0",
            "id": item_id,
            "geometry": geometry,
            "bbox": self._geometry_to_bbox(geometry),
            "properties": {
                "datetime": properties.get("datetime", datetime.utcnow().isoformat() + "Z"),
                **properties
            },
            "assets": assets,
            "links": [],
        }
        
        try:
            resp = self.session.post(url, json=item, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            print(f"Failed to create item {item_id}: {e}")
            return {}

    def _geometry_to_bbox(self, geometry: Dict[str, Any]) -> List[float]:
        """Extract bbox from geometry."""
        if geometry.get("type") == "Polygon":
            coords = geometry["coordinates"][0]
            xs = [c[0] for c in coords]
            ys = [c[1] for c in coords]
            return [min(xs), min(ys), max(xs), max(ys)]
        return [-180, -90, 180, 90]
    
    async def get_external_collections(self) -> List[Dict[str, Any]]:
        """Buscar coleções das APIs STAC externas."""
        try:
            collections = await external_stac_client.get_priority_collections()
            return [
                {
                    "id": col.id,
                    "title": col.title,
                    "description": col.description,
                    "license": col.license,
                    "extent": col.extent,
                    "keywords": col.keywords,
                    "relevance_score": col.relevance_score,
                    "api_url": col.api_url,
                    "source": "external"
                }
                for col in collections
            ]
        except Exception as e:
            print(f"Erro ao buscar coleções externas: {e}")
            return []
    
    async def search_external_items(
        self, 
        collection_id: str, 
        bbox: Optional[List[float]] = None,
        datetime_range: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Buscar itens de coleções externas."""
        try:
            items = await external_stac_client.search_items(
                collection_id=collection_id,
                bbox=bbox,
                datetime_range=datetime_range,
                limit=limit
            )
            return [
                {
                    "id": item.id,
                    "collection": item.collection,
                    "geometry": item.geometry,
                    "properties": item.properties,
                    "assets": item.assets,
                    "bbox": item.bbox,
                    "datetime": item.datetime,
                    "source": "external"
                }
                for item in items
            ]
        except Exception as e:
            print(f"Erro ao buscar itens externos: {e}")
            return []
    
    async def get_recent_oceanographic_data(self, days_back: int = 7) -> Dict[str, Any]:
        """Buscar dados oceanográficos recentes para Angola."""
        try:
            sst_items = await external_stac_client.get_recent_sst_data(days_back)
            
            return {
                "sea_surface_temperature": [
                    {
                        "id": item.id,
                        "collection": item.collection,
                        "datetime": item.datetime,
                        "assets": list(item.assets.keys()),
                        "bbox": item.bbox
                    }
                    for item in sst_items
                ],
                "summary": {
                    "total_items": len(sst_items),
                    "date_range": f"Last {days_back} days",
                    "collections_used": list(set(item.collection for item in sst_items))
                }
            }
        except Exception as e:
            print(f"Erro ao buscar dados oceanográficos: {e}")
            return {"error": str(e)}
    
    async def health_check_external_apis(self) -> Dict[str, Any]:
        """Verificar saúde das APIs STAC externas."""
        return await external_stac_client.health_check()
    
    def get_collections_summary(self) -> Dict[str, Any]:
        """Resumo completo das coleções disponíveis (locais + externas)."""
        external_summary = external_stac_client.get_collection_summary()
        
        return {
            "local_collections": 2,  # angola-marine-data, angola-terrestrial-data
            "external_apis": external_summary["total_apis"],
            "priority_collections": external_summary["priority_collections"],
            "data_types_available": external_summary["data_types"],
            "coverage": external_summary["coverage_area"],
            "apis": external_summary["apis"]
        }
