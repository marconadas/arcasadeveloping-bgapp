"""
Pangeo/Intake Connector
Conector moderno para dados oceanográficos via ecossistema Pangeo
"""

import argparse
import json
import logging
import warnings
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Suprimir warnings de dependências opcionais
warnings.filterwarnings('ignore', category=UserWarning)

logger = logging.getLogger(__name__)


class PangeoIntakeConnector:
    """Conector para catálogos Pangeo/Intake de dados oceanográficos"""
    
    def __init__(self):
        self.session = self._get_session()
        
        # Catálogos Pangeo conhecidos
        self.catalogs = {
            'pangeo_forge': 'https://raw.githubusercontent.com/pangeo-forge/pangeo-forge-recipes/main/catalog.yaml',
            'cmip6': 'https://storage.googleapis.com/cmip6/pangeo-cmip6.json',
            'esgf': 'https://raw.githubusercontent.com/ESGF/esgf-compute-api/master/catalog.yaml',
            'ocean_models': 'https://raw.githubusercontent.com/pangeo-data/pangeo-datastore/master/intake-catalogs/ocean.yaml',
            'climate_models': 'https://raw.githubusercontent.com/pangeo-data/pangeo-datastore/master/intake-catalogs/climate.yaml'
        }
        
        # Área de interesse para Angola
        self.angola_region = {
            'lat_min': -18.5,
            'lat_max': -4.4,
            'lon_min': 11.4,
            'lon_max': 24.1
        }
        
        # Datasets relevantes para oceanografia
        self.ocean_datasets = {
            'sst_avhrr': {
                'name': 'AVHRR Sea Surface Temperature',
                'description': 'Daily SST from AVHRR satellites',
                'variables': ['sst', 'sst_anomaly'],
                'temporal_resolution': 'daily',
                'spatial_resolution': '4km'
            },
            'ssh_altimetry': {
                'name': 'Altimetry Sea Surface Height',
                'description': 'Sea surface height from satellite altimetry',
                'variables': ['ssh', 'ssh_anomaly', 'geostrophic_velocity'],
                'temporal_resolution': 'daily',
                'spatial_resolution': '25km'
            },
            'chlorophyll_modis': {
                'name': 'MODIS Ocean Color Chlorophyll',
                'description': 'Chlorophyll-a concentration from MODIS',
                'variables': ['chlor_a', 'Kd_490', 'pic', 'poc'],
                'temporal_resolution': 'daily',
                'spatial_resolution': '4km'
            },
            'ocean_currents_oscar': {
                'name': 'OSCAR Ocean Currents',
                'description': 'Ocean surface currents from OSCAR',
                'variables': ['u', 'v', 'speed', 'direction'],
                'temporal_resolution': '5-day',
                'spatial_resolution': '1/3 degree'
            },
            'wind_ccmp': {
                'name': 'CCMP Wind Vectors',
                'description': 'Ocean surface wind vectors',
                'variables': ['u_wind', 'v_wind', 'wind_speed', 'wind_direction'],
                'temporal_resolution': '6-hourly',
                'spatial_resolution': '25km'
            }
        }
        
    def _get_session(self) -> requests.Session:
        """Configurar sessão HTTP"""
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
            'User-Agent': 'BGAPP-Angola/1.0 Pangeo-Client',
            'Accept': 'application/json, text/yaml'
        })
        
        return session
    
    def discover_catalogs(self) -> Dict[str, Any]:
        """Descobrir catálogos Pangeo disponíveis"""
        catalog_info = {}
        
        for catalog_name, catalog_url in self.catalogs.items():
            try:
                logger.info(f"🔍 Verificando catálogo: {catalog_name}")
                
                response = self.session.head(catalog_url, timeout=10)
                
                catalog_info[catalog_name] = {
                    'url': catalog_url,
                    'status': response.status_code,
                    'available': response.status_code == 200,
                    'content_type': response.headers.get('content-type', 'unknown'),
                    'last_modified': response.headers.get('last-modified'),
                    'size': response.headers.get('content-length')
                }
                
                if response.status_code == 200:
                    logger.info(f"✅ {catalog_name}: Disponível")
                else:
                    logger.warning(f"⚠️ {catalog_name}: Status {response.status_code}")
                    
            except Exception as e:
                logger.warning(f"❌ {catalog_name}: Erro - {e}")
                catalog_info[catalog_name] = {
                    'url': catalog_url,
                    'status': 'error',
                    'available': False,
                    'error': str(e)
                }
        
        available_count = sum(1 for info in catalog_info.values() if info.get('available'))
        logger.info(f"📊 Catálogos disponíveis: {available_count}/{len(self.catalogs)}")
        
        return catalog_info
    
    def load_catalog_metadata(self, catalog_name: str) -> Optional[Dict[str, Any]]:
        """Carregar metadados de um catálogo específico"""
        try:
            if catalog_name not in self.catalogs:
                logger.error(f"❌ Catálogo desconhecido: {catalog_name}")
                return None
            
            catalog_url = self.catalogs[catalog_name]
            logger.info(f"📥 Carregando catálogo: {catalog_name}")
            
            response = self.session.get(catalog_url, timeout=30)
            response.raise_for_status()
            
            # Tentar determinar o formato
            content_type = response.headers.get('content-type', '').lower()
            
            if 'json' in content_type or catalog_url.endswith('.json'):
                try:
                    catalog_data = response.json()
                except json.JSONDecodeError:
                    catalog_data = {'raw_content': response.text}
            else:
                # Assumir YAML ou texto simples
                catalog_data = {'raw_content': response.text}
            
            # Processar e extrair informações relevantes
            processed_catalog = self._process_catalog_content(catalog_data, catalog_name)
            
            logger.info(f"✅ Catálogo {catalog_name} carregado com sucesso")
            return processed_catalog
            
        except Exception as e:
            logger.error(f"❌ Erro ao carregar catálogo {catalog_name}: {e}")
            return None
    
    def _process_catalog_content(self, catalog_data: Dict[str, Any], 
                               catalog_name: str) -> Dict[str, Any]:
        """Processar conteúdo do catálogo e extrair informações relevantes"""
        processed = {
            'catalog_name': catalog_name,
            'loaded_at': datetime.now().isoformat(),
            'datasets': [],
            'total_entries': 0,
            'ocean_related': 0,
            'angola_relevant': 0
        }
        
        # Palavras-chave para identificar datasets oceânicos
        ocean_keywords = [
            'ocean', 'sea', 'marine', 'sst', 'ssh', 'chlorophyll', 'altimetry',
            'current', 'wave', 'wind', 'salinity', 'temperature', 'modis',
            'avhrr', 'viirs', 'oscar', 'ccmp', 'aqua', 'terra'
        ]
        
        # Processar diferentes estruturas de catálogo
        if isinstance(catalog_data, dict):
            # Estrutura JSON típica
            if 'sources' in catalog_data:
                sources = catalog_data['sources']
            elif 'datasets' in catalog_data:
                sources = catalog_data['datasets']
            elif 'entries' in catalog_data:
                sources = catalog_data['entries']
            else:
                sources = catalog_data
            
            if isinstance(sources, dict):
                for dataset_id, dataset_info in sources.items():
                    processed_dataset = self._process_dataset_entry(
                        dataset_id, dataset_info, ocean_keywords
                    )
                    if processed_dataset:
                        processed['datasets'].append(processed_dataset)
                        processed['total_entries'] += 1
                        
                        if processed_dataset.get('is_ocean_related'):
                            processed['ocean_related'] += 1
                        if processed_dataset.get('is_angola_relevant'):
                            processed['angola_relevant'] += 1
        
        return processed
    
    def _process_dataset_entry(self, dataset_id: str, dataset_info: Any,
                             ocean_keywords: List[str]) -> Optional[Dict[str, Any]]:
        """Processar uma entrada individual de dataset"""
        try:
            if not isinstance(dataset_info, dict):
                return None
            
            # Extrair informações básicas
            name = dataset_info.get('name', dataset_id)
            description = dataset_info.get('description', '')
            
            # Verificar se é relacionado ao oceano
            text_to_check = f"{dataset_id} {name} {description}".lower()
            is_ocean_related = any(keyword in text_to_check for keyword in ocean_keywords)
            
            # Verificar relevância para Angola (baseado em coordenadas ou menção)
            is_angola_relevant = False
            if 'angola' in text_to_check or 'africa' in text_to_check:
                is_angola_relevant = True
            
            # Tentar extrair informações de coordenadas
            spatial_info = self._extract_spatial_info(dataset_info)
            if spatial_info and self._check_angola_overlap(spatial_info):
                is_angola_relevant = True
            
            processed_dataset = {
                'id': dataset_id,
                'name': name,
                'description': description,
                'is_ocean_related': is_ocean_related,
                'is_angola_relevant': is_angola_relevant,
                'spatial_info': spatial_info,
                'variables': dataset_info.get('variables', []),
                'source_type': dataset_info.get('driver', 'unknown'),
                'parameters': dataset_info.get('parameters', {}),
                'metadata': dataset_info.get('metadata', {})
            }
            
            return processed_dataset
            
        except Exception as e:
            logger.warning(f"⚠️ Erro ao processar dataset {dataset_id}: {e}")
            return None
    
    def _extract_spatial_info(self, dataset_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extrair informações espaciais do dataset"""
        spatial_info = {}
        
        # Procurar por diferentes formas de especificar coordenadas
        for key in ['bbox', 'bounds', 'spatial', 'coordinates', 'extent']:
            if key in dataset_info:
                spatial_info[key] = dataset_info[key]
        
        # Procurar em parâmetros
        params = dataset_info.get('parameters', {})
        for param_name, param_info in params.items():
            if any(coord in param_name.lower() for coord in ['lat', 'lon', 'x', 'y']):
                if isinstance(param_info, dict) and 'default' in param_info:
                    spatial_info[param_name] = param_info['default']
        
        return spatial_info if spatial_info else None
    
    def _check_angola_overlap(self, spatial_info: Dict[str, Any]) -> bool:
        """Verificar se há sobreposição com a região de Angola"""
        try:
            # Procurar por bbox ou bounds
            for key in ['bbox', 'bounds']:
                if key in spatial_info:
                    bbox = spatial_info[key]
                    if isinstance(bbox, (list, tuple)) and len(bbox) >= 4:
                        # Assumir formato [lon_min, lat_min, lon_max, lat_max]
                        lon_min, lat_min, lon_max, lat_max = bbox[:4]
                        
                        # Verificar sobreposição com Angola
                        if (lon_max >= self.angola_region['lon_min'] and 
                            lon_min <= self.angola_region['lon_max'] and
                            lat_max >= self.angola_region['lat_min'] and
                            lat_min <= self.angola_region['lat_max']):
                            return True
            
            return False
            
        except Exception:
            return False
    
    def search_angola_datasets(self, catalog_names: List[str] = None) -> Dict[str, Any]:
        """Buscar datasets relevantes para Angola em múltiplos catálogos"""
        if not catalog_names:
            catalog_names = list(self.catalogs.keys())
        
        results = {
            'search_region': self.angola_region,
            'catalogs_searched': len(catalog_names),
            'catalogs': {},
            'summary': {
                'total_datasets': 0,
                'ocean_datasets': 0,
                'angola_relevant': 0
            },
            'relevant_datasets': [],
            'timestamp': datetime.now().isoformat()
        }
        
        for catalog_name in catalog_names:
            logger.info(f"🔍 Buscando em: {catalog_name}")
            
            catalog_data = self.load_catalog_metadata(catalog_name)
            if catalog_data:
                results['catalogs'][catalog_name] = catalog_data
                
                # Adicionar ao resumo
                results['summary']['total_datasets'] += catalog_data['total_entries']
                results['summary']['ocean_datasets'] += catalog_data['ocean_related']
                results['summary']['angola_relevant'] += catalog_data['angola_relevant']
                
                # Coletar datasets relevantes
                for dataset in catalog_data['datasets']:
                    if dataset.get('is_angola_relevant') or dataset.get('is_ocean_related'):
                        dataset['catalog'] = catalog_name
                        results['relevant_datasets'].append(dataset)
        
        # Ordenar por relevância
        results['relevant_datasets'].sort(
            key=lambda x: (x.get('is_angola_relevant', False), x.get('is_ocean_related', False)),
            reverse=True
        )
        
        logger.info(f"✅ Busca concluída: {results['summary']['angola_relevant']} datasets relevantes para Angola")
        return results
    
    def generate_intake_catalog(self, datasets: List[Dict[str, Any]], 
                              output_path: Path = None) -> Path:
        """Gerar catálogo Intake personalizado para Angola"""
        if not output_path:
            output_path = Path(f"angola_ocean_catalog_{datetime.now().strftime('%Y%m%d')}.yaml")
        
        # Estrutura do catálogo Intake
        catalog_structure = {
            'metadata': {
                'version': 1,
                'name': 'Angola Ocean Data Catalog',
                'description': 'Curated oceanographic datasets for Angola region',
                'created': datetime.now().isoformat(),
                'region': self.angola_region,
                'contact': 'BGAPP Angola Project'
            },
            'sources': {}
        }
        
        # Adicionar datasets relevantes
        for dataset in datasets:
            if dataset.get('is_angola_relevant') or dataset.get('is_ocean_related'):
                source_id = f"{dataset['catalog']}_{dataset['id']}"
                
                catalog_structure['sources'][source_id] = {
                    'description': dataset.get('description', 'No description'),
                    'driver': dataset.get('source_type', 'unknown'),
                    'parameters': dataset.get('parameters', {}),
                    'metadata': {
                        'original_catalog': dataset.get('catalog'),
                        'original_id': dataset.get('id'),
                        'variables': dataset.get('variables', []),
                        'is_ocean_related': dataset.get('is_ocean_related', False),
                        'is_angola_relevant': dataset.get('is_angola_relevant', False),
                        'spatial_info': dataset.get('spatial_info', {})
                    }
                }
        
        # Salvar como YAML
        try:
            import yaml
            with open(output_path, 'w') as f:
                yaml.dump(catalog_structure, f, default_flow_style=False, indent=2)
        except ImportError:
            # Fallback para JSON se YAML não estiver disponível
            output_path = output_path.with_suffix('.json')
            with open(output_path, 'w') as f:
                json.dump(catalog_structure, f, indent=2)
        
        logger.info(f"📋 Catálogo personalizado criado: {output_path}")
        return output_path


def main(argv: Optional[List[str]] = None) -> None:
    """Função principal para testar o conector Pangeo/Intake"""
    parser = argparse.ArgumentParser(description="Pangeo/Intake Connector para Angola")
    parser.add_argument("--catalogs", nargs='+', 
                       choices=list(PangeoIntakeConnector().catalogs.keys()),
                       default=None)
    parser.add_argument("--discover-only", action='store_true')
    parser.add_argument("--generate-catalog", action='store_true')
    parser.add_argument("--output", type=Path, default=Path("pangeo_results.json"))
    
    args = parser.parse_args(argv)
    
    # Configurar logging
    logging.basicConfig(level=logging.INFO, 
                       format='%(asctime)s - %(levelname)s - %(message)s')
    
    # Inicializar conector
    connector = PangeoIntakeConnector()
    
    if args.discover_only:
        # Apenas descobrir catálogos disponíveis
        catalog_info = connector.discover_catalogs()
        results = {
            'mode': 'discovery',
            'catalogs': catalog_info,
            'timestamp': datetime.now().isoformat()
        }
    else:
        # Buscar datasets relevantes para Angola
        results = connector.search_angola_datasets(args.catalogs)
        
        # Gerar catálogo personalizado se solicitado
        if args.generate_catalog and results['relevant_datasets']:
            catalog_path = connector.generate_intake_catalog(results['relevant_datasets'])
            results['generated_catalog'] = str(catalog_path)
    
    # Salvar resultados
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    logger.info(f"✅ Resultados salvos em: {args.output}")
    
    if not args.discover_only:
        summary = results['summary']
        logger.info(f"📊 Resumo: {summary['angola_relevant']} datasets relevantes para Angola")
        logger.info(f"🌊 {summary['ocean_datasets']} datasets oceânicos de {summary['total_datasets']} totais")


if __name__ == "__main__":
    main()
