"""
STAC (SpatioTemporal Asset Catalog) Connector
Moderno conector para catálogos STAC de dados de satélite e geoespaciais
"""

import argparse
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import requests
from pystac_client import Client
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class STACConnector:
    """Conector moderno para catálogos STAC"""
    
    def __init__(self, catalog_url: str = None):
        # URLs de catálogos STAC públicos
        self.catalogs = {
            'microsoft_pc': 'https://planetarycomputer.microsoft.com/api/stac/v1',
            'earth_search': 'https://earth-search.aws.element84.com/v1',
            'usgs': 'https://landsatlook.usgs.gov/stac-server',
            'copernicus': 'https://stac.marine.copernicus.eu',
            'sentinel_hub': 'https://services.sentinel-hub.com/api/v1/catalog'
        }
        
        self.catalog_url = catalog_url or self.catalogs['microsoft_pc']
        self.session = self._get_session()
        
        # Área de interesse para Angola
        self.angola_bbox = [11.4, -18.5, 24.1, -4.4]  # [west, south, east, north]
        
    def _get_session(self) -> requests.Session:
        """Configurar sessão HTTP com retry automático"""
        session = requests.Session()
        
        retry_strategy = Retry(
            total=3,
            status_forcelist=[429, 500, 502, 503, 504],
            method_whitelist=["HEAD", "GET", "OPTIONS"],
            backoff_factor=1
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        session.headers.update({
            'User-Agent': 'BGAPP-Angola/1.0 STAC-Client'
        })
        
        return session
    
    def connect_catalog(self, catalog_name: str = None) -> Optional[Client]:
        """Conectar a um catálogo STAC"""
        try:
            if catalog_name and catalog_name in self.catalogs:
                catalog_url = self.catalogs[catalog_name]
            else:
                catalog_url = self.catalog_url
                
            logger.info(f"🔗 Conectando ao catálogo STAC: {catalog_url}")
            
            # Usar pystac-client para conexão
            client = Client.open(catalog_url)
            
            logger.info(f"✅ Conectado com sucesso ao catálogo: {client.title}")
            return client
            
        except Exception as e:
            logger.error(f"❌ Erro ao conectar ao catálogo STAC: {e}")
            return None
    
    def search_collections(self, client: Client, 
                         collection_types: List[str] = None) -> List[Dict[str, Any]]:
        """Buscar coleções disponíveis no catálogo"""
        try:
            collections = []
            
            # Filtros por tipo de coleção
            if not collection_types:
                collection_types = ['sentinel-2', 'landsat', 'modis', 'copernicus']
            
            for collection in client.get_collections():
                # Verificar se é relevante para os tipos solicitados
                collection_id = collection.id.lower()
                is_relevant = any(col_type in collection_id for col_type in collection_types)
                
                if is_relevant:
                    collections.append({
                        'id': collection.id,
                        'title': collection.title or collection.id,
                        'description': collection.description or 'Sem descrição',
                        'license': getattr(collection, 'license', 'Não especificada'),
                        'extent': self._format_extent(collection.extent),
                        'keywords': getattr(collection, 'keywords', []),
                        'providers': [p.name for p in getattr(collection, 'providers', [])]
                    })
            
            logger.info(f"📊 Encontradas {len(collections)} coleções relevantes")
            return collections
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar coleções: {e}")
            return []
    
    def search_items_angola(self, client: Client, 
                          collection_id: str,
                          start_date: str = None,
                          end_date: str = None,
                          max_items: int = 100) -> List[Dict[str, Any]]:
        """Buscar itens STAC para a região de Angola"""
        try:
            # Definir período de busca
            if not start_date:
                start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            if not end_date:
                end_date = datetime.now().strftime('%Y-%m-%d')
            
            logger.info(f"🔍 Buscando itens em {collection_id} para Angola")
            logger.info(f"📅 Período: {start_date} até {end_date}")
            
            # Realizar busca
            search = client.search(
                collections=[collection_id],
                bbox=self.angola_bbox,
                datetime=f"{start_date}/{end_date}",
                limit=max_items
            )
            
            items = []
            for item in search.items():
                items.append({
                    'id': item.id,
                    'collection': item.collection_id,
                    'datetime': item.datetime.isoformat() if item.datetime else None,
                    'geometry': item.geometry,
                    'bbox': item.bbox,
                    'assets': list(item.assets.keys()),
                    'cloud_cover': item.properties.get('eo:cloud_cover', 'N/A'),
                    'platform': item.properties.get('platform', 'N/A'),
                    'instrument': item.properties.get('instruments', ['N/A']),
                    'links': [{'rel': link.rel, 'href': link.href} for link in item.links]
                })
            
            logger.info(f"✅ Encontrados {len(items)} itens para Angola")
            return items
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar itens: {e}")
            return []
    
    def _format_extent(self, extent) -> Dict[str, Any]:
        """Formatar extent do STAC para formato legível"""
        try:
            return {
                'spatial': {
                    'bbox': extent.spatial.bboxes[0] if extent.spatial.bboxes else None
                },
                'temporal': {
                    'interval': extent.temporal.intervals[0] if extent.temporal.intervals else None
                }
            }
        except:
            return {'spatial': None, 'temporal': None}
    
    def get_download_urls(self, items: List[Dict[str, Any]], 
                         asset_types: List[str] = None) -> List[Dict[str, Any]]:
        """Extrair URLs de download dos assets"""
        if not asset_types:
            asset_types = ['data', 'thumbnail', 'overview']
        
        download_info = []
        
        for item in items:
            item_downloads = {
                'item_id': item['id'],
                'collection': item['collection'],
                'datetime': item['datetime'],
                'downloads': {}
            }
            
            # Simular assets (em implementação real, usar item.assets)
            for asset_type in asset_types:
                if asset_type in item.get('assets', []):
                    item_downloads['downloads'][asset_type] = {
                        'href': f"https://example.com/{item['id']}/{asset_type}",
                        'type': 'application/octet-stream',
                        'size': 'N/A'
                    }
            
            download_info.append(item_downloads)
        
        return download_info


def main(argv: Optional[List[str]] = None) -> None:
    """Função principal para testar o conector STAC"""
    parser = argparse.ArgumentParser(description="STAC Connector para Angola")
    parser.add_argument("--catalog", default="microsoft_pc", 
                       choices=['microsoft_pc', 'earth_search', 'usgs', 'copernicus'])
    parser.add_argument("--collection", default="sentinel-2-l2a")
    parser.add_argument("--start-date", default=None)
    parser.add_argument("--end-date", default=None)
    parser.add_argument("--max-items", type=int, default=10)
    parser.add_argument("--output", type=Path, default=Path("stac_results.json"))
    
    args = parser.parse_args(argv)
    
    # Configurar logging
    logging.basicConfig(level=logging.INFO, 
                       format='%(asctime)s - %(levelname)s - %(message)s')
    
    # Inicializar conector
    connector = STACConnector()
    
    # Conectar ao catálogo
    client = connector.connect_catalog(args.catalog)
    if not client:
        logger.error("❌ Falha ao conectar ao catálogo")
        return
    
    # Buscar coleções
    collections = connector.search_collections(client)
    logger.info(f"📋 Coleções disponíveis: {[c['id'] for c in collections[:5]]}")
    
    # Buscar itens para Angola
    items = connector.search_items_angola(
        client, 
        args.collection,
        args.start_date,
        args.end_date,
        args.max_items
    )
    
    # Obter URLs de download
    downloads = connector.get_download_urls(items)
    
    # Salvar resultados
    results = {
        'catalog': args.catalog,
        'collection': args.collection,
        'search_params': {
            'bbox': connector.angola_bbox,
            'start_date': args.start_date,
            'end_date': args.end_date,
            'max_items': args.max_items
        },
        'collections_found': len(collections),
        'items_found': len(items),
        'collections': collections[:3],  # Primeiras 3 coleções
        'items': items,
        'downloads': downloads,
        'timestamp': datetime.now().isoformat()
    }
    
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    logger.info(f"✅ Resultados salvos em: {args.output}")
    logger.info(f"📊 Resumo: {len(collections)} coleções, {len(items)} itens encontrados")


if __name__ == "__main__":
    main()
