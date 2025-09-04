"""
NASA Earthdata Connector
Conector moderno para dados da NASA via Earthdata APIs
"""

import argparse
import json
import logging
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class NASAEarthdataConnector:
    """Conector para NASA Earthdata APIs"""
    
    def __init__(self, username: str = None, password: str = None):
        # URLs da NASA Earthdata
        self.base_urls = {
            'cmr': 'https://cmr.earthdata.nasa.gov/search',
            'urs': 'https://urs.earthdata.nasa.gov',
            'giovanni': 'https://giovanni.gsfc.nasa.gov/giovanni/daac-bin',
            'opendap': 'https://opendap.earthdata.nasa.gov',
            'worldview': 'https://worldview.earthdata.nasa.gov/api/v1'
        }
        
        # Credenciais (podem ser definidas via variáveis de ambiente)
        self.username = username or os.getenv('NASA_USERNAME')
        self.password = password or os.getenv('NASA_PASSWORD')
        
        self.session = self._get_session()
        
        # Área de interesse para Angola
        self.angola_bbox = {
            'west': 11.4,
            'south': -18.5,
            'east': 24.1,
            'north': -4.4
        }
        
        # Datasets relevantes para oceanografia e ambiente
        self.datasets = {
            'modis_aqua_sst': {
                'concept_id': 'C1996881146-POCLOUD',
                'short_name': 'MODIS_AQUA_L3_SST_THERMAL_DAILY_4KM_DAYTIME_V2019.0',
                'description': 'MODIS Aqua Sea Surface Temperature'
            },
            'modis_terra_chlor': {
                'concept_id': 'C1996881657-OB_DAAC',
                'short_name': 'MODIS_TERRA_L3_CHL_DAILY_4KM',
                'description': 'MODIS Terra Chlorophyll-a'
            },
            'viirs_sst': {
                'concept_id': 'C2036882413-POCLOUD',
                'short_name': 'VIIRS_NPP_L3_SST_THERMAL_DAILY_4KM_DAYTIME_V2019.0',
                'description': 'VIIRS Sea Surface Temperature'
            },
            'gpm_precipitation': {
                'concept_id': 'C1598621093-GES_DISC',
                'short_name': 'GPM_3IMERGHH',
                'description': 'GPM IMERG Precipitation'
            },
            'srtm_elevation': {
                'concept_id': 'C1000000240-LPDAAC_ECS',
                'short_name': 'SRTMGL1',
                'description': 'SRTM Digital Elevation Model'
            },
            'landsat8_oli': {
                'concept_id': 'C1251101656-USGS_LTA',
                'short_name': 'LANDSAT_8_C1',
                'description': 'Landsat 8 OLI/TIRS Collection 1'
            }
        }
        
    def _get_session(self) -> requests.Session:
        """Configurar sessão HTTP com retry e autenticação"""
        session = requests.Session()
        
        retry_strategy = Retry(
            total=3,
            status_forcelist=[429, 500, 502, 503, 504],
            method_whitelist=["HEAD", "GET", "POST", "OPTIONS"],
            backoff_factor=1
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        session.headers.update({
            'User-Agent': 'BGAPP-Angola/1.0 NASA-Earthdata-Client',
            'Accept': 'application/json'
        })
        
        return session
    
    def authenticate(self) -> bool:
        """Autenticar com NASA URS (User Registration System)"""
        if not self.username or not self.password:
            logger.warning("⚠️ Credenciais NASA não fornecidas - usando modo demo")
            return False
        
        try:
            # Configurar autenticação básica
            self.session.auth = (self.username, self.password)
            
            # Testar autenticação
            test_url = f"{self.base_urls['urs']}/profile"
            response = self.session.get(test_url, timeout=10)
            
            if response.status_code == 200:
                logger.info("✅ Autenticação NASA bem-sucedida")
                return True
            else:
                logger.warning(f"⚠️ Falha na autenticação NASA: {response.status_code}")
                return False
                
        except Exception as e:
            logger.warning(f"⚠️ Erro na autenticação NASA: {e}")
            return False
    
    def search_collections(self, keywords: List[str] = None,
                         temporal_range: str = None) -> List[Dict[str, Any]]:
        """Buscar coleções no CMR (Common Metadata Repository)"""
        try:
            url = f"{self.base_urls['cmr']}/collections.json"
            
            params = {
                'page_size': 50,
                'spatial_keyword': 'Angola',
            }
            
            if keywords:
                params['keyword'] = ','.join(keywords)
            if temporal_range:
                params['temporal'] = temporal_range
            
            logger.info(f"🔍 Buscando coleções NASA: {params}")
            
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            collections = []
            
            for item in data.get('feed', {}).get('entry', []):
                collection = {
                    'concept_id': item.get('id'),
                    'title': item.get('title'),
                    'summary': item.get('summary', 'Sem descrição'),
                    'data_center': item.get('data_center'),
                    'short_name': item.get('short_name'),
                    'version_id': item.get('version_id'),
                    'time_start': item.get('time_start'),
                    'time_end': item.get('time_end'),
                    'dataset_id': item.get('dataset_id'),
                    'links': [link.get('href') for link in item.get('links', []) if link.get('href')]
                }
                collections.append(collection)
            
            logger.info(f"✅ Encontradas {len(collections)} coleções")
            return collections
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar coleções: {e}")
            return []
    
    def search_granules_angola(self, dataset_id: str,
                              start_date: str = None,
                              end_date: str = None,
                              limit: int = 100) -> List[Dict[str, Any]]:
        """Buscar granules (arquivos de dados) para Angola"""
        try:
            if dataset_id not in self.datasets:
                logger.warning(f"⚠️ Dataset desconhecido: {dataset_id}")
                return []
            
            dataset_info = self.datasets[dataset_id]
            url = f"{self.base_urls['cmr']}/granules.json"
            
            # Definir período padrão se não fornecido
            if not start_date:
                start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            if not end_date:
                end_date = datetime.now().strftime('%Y-%m-%d')
            
            params = {
                'concept_id': dataset_info['concept_id'],
                'page_size': limit,
                'bounding_box': f"{self.angola_bbox['west']},{self.angola_bbox['south']},{self.angola_bbox['east']},{self.angola_bbox['north']}",
                'temporal': f"{start_date}T00:00:00Z,{end_date}T23:59:59Z"
            }
            
            logger.info(f"🔍 Buscando granules para {dataset_id}")
            logger.info(f"📅 Período: {start_date} até {end_date}")
            
            response = self.session.get(url, params=params, timeout=60)
            response.raise_for_status()
            
            data = response.json()
            granules = []
            
            for item in data.get('feed', {}).get('entry', []):
                granule = {
                    'concept_id': item.get('id'),
                    'title': item.get('title'),
                    'dataset_id': dataset_id,
                    'dataset_name': dataset_info['description'],
                    'time_start': item.get('time_start'),
                    'time_end': item.get('time_end'),
                    'day_night_flag': item.get('day_night_flag'),
                    'cloud_cover': item.get('cloud_cover'),
                    'data_center': item.get('data_center'),
                    'online_access_urls': [],
                    'download_urls': [],
                    'browse_urls': [],
                    'metadata_urls': []
                }
                
                # Processar links
                for link in item.get('links', []):
                    href = link.get('href', '')
                    rel = link.get('rel', '')
                    
                    if 'browse' in rel or 'browse' in href.lower():
                        granule['browse_urls'].append(href)
                    elif 'metadata' in rel or 'metadata' in href.lower():
                        granule['metadata_urls'].append(href)
                    elif any(ext in href.lower() for ext in ['.hdf', '.nc', '.h5', '.tif']):
                        granule['download_urls'].append(href)
                    else:
                        granule['online_access_urls'].append(href)
                
                granules.append(granule)
            
            logger.info(f"✅ Encontrados {len(granules)} granules para Angola")
            return granules
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar granules: {e}")
            return []
    
    def get_worldview_imagery_urls(self, date: str = None,
                                  layers: List[str] = None) -> Dict[str, Any]:
        """Obter URLs de imagens do NASA Worldview para Angola"""
        try:
            if not date:
                date = datetime.now().strftime('%Y-%m-%d')
            
            if not layers:
                layers = [
                    'MODIS_Aqua_CorrectedReflectance_TrueColor',
                    'MODIS_Terra_CorrectedReflectance_TrueColor',
                    'VIIRS_SNPP_CorrectedReflectance_TrueColor'
                ]
            
            imagery_urls = {}
            
            for layer in layers:
                # Construir URL do tile do Worldview
                tile_url = (
                    f"{self.base_urls['worldview']}/snapshots"
                    f"?REQUEST=GetSnapshot"
                    f"&TIME={date}"
                    f"&BBOX={self.angola_bbox['west']},{self.angola_bbox['south']},{self.angola_bbox['east']},{self.angola_bbox['north']}"
                    f"&CRS=EPSG:4326"
                    f"&LAYERS={layer}"
                    f"&FORMAT=image/png"
                    f"&WIDTH=1024"
                    f"&HEIGHT=1024"
                )
                
                imagery_urls[layer] = {
                    'url': tile_url,
                    'date': date,
                    'bbox': self.angola_bbox,
                    'format': 'PNG',
                    'size': '1024x1024'
                }
            
            logger.info(f"🖼️ URLs de imagem geradas para {len(layers)} layers")
            return {
                'date': date,
                'bbox': self.angola_bbox,
                'imagery': imagery_urls,
                'total_layers': len(layers)
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao gerar URLs de imagem: {e}")
            return {}
    
    def get_opendap_urls(self, dataset_id: str) -> List[str]:
        """Obter URLs OPeNDAP para acesso direto aos dados"""
        try:
            if dataset_id not in self.datasets:
                return []
            
            dataset_info = self.datasets[dataset_id]
            
            # URLs OPeNDAP simuladas (em implementação real, buscar via CMR)
            opendap_urls = [
                f"{self.base_urls['opendap']}/{dataset_info['short_name']}/data.nc4",
                f"https://thredds.jpl.nasa.gov/thredds/dodsC/{dataset_info['short_name']}"
            ]
            
            logger.info(f"🔗 URLs OPeNDAP para {dataset_id}: {len(opendap_urls)} encontradas")
            return opendap_urls
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter URLs OPeNDAP: {e}")
            return []
    
    def generate_download_script(self, granules: List[Dict[str, Any]], 
                               output_path: Path = None) -> Path:
        """Gerar script de download para os granules"""
        if not output_path:
            output_path = Path(f"nasa_download_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sh")
        
        script_lines = [
            "#!/bin/bash",
            "# NASA Earthdata Download Script",
            "# Gerado automaticamente pelo BGAPP",
            f"# Data: {datetime.now().isoformat()}",
            "",
            "# Configurar credenciais NASA",
            "# export NASA_USERNAME='seu_usuario'",
            "# export NASA_PASSWORD='sua_senha'",
            "",
            "# Criar diretório de download",
            "mkdir -p nasa_data",
            "cd nasa_data",
            ""
        ]
        
        for i, granule in enumerate(granules[:20]):  # Limitar a 20 para evitar scripts muito grandes
            if granule.get('download_urls'):
                for j, url in enumerate(granule['download_urls'][:2]):  # Máximo 2 URLs por granule
                    filename = f"{granule['dataset_id']}_{i}_{j}.data"
                    script_lines.extend([
                        f"# {granule['title']}",
                        f"echo 'Downloading {filename}...'",
                        f"curl -u $NASA_USERNAME:$NASA_PASSWORD -L '{url}' -o '{filename}'",
                        ""
                    ])
        
        script_lines.extend([
            "echo 'Download concluído!'",
            "ls -la *.data"
        ])
        
        with open(output_path, 'w') as f:
            f.write('\n'.join(script_lines))
        
        # Tornar executável
        output_path.chmod(0o755)
        
        logger.info(f"📜 Script de download criado: {output_path}")
        return output_path


def main(argv: Optional[List[str]] = None) -> None:
    """Função principal para testar o conector NASA Earthdata"""
    parser = argparse.ArgumentParser(description="NASA Earthdata Connector para Angola")
    parser.add_argument("--dataset", default="modis_aqua_sst",
                       choices=list(NASAEarthdataConnector({}).datasets.keys()))
    parser.add_argument("--start-date", default=None)
    parser.add_argument("--end-date", default=None)
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--generate-script", action='store_true')
    parser.add_argument("--worldview", action='store_true')
    parser.add_argument("--output", type=Path, default=Path("nasa_results.json"))
    
    args = parser.parse_args(argv)
    
    # Configurar logging
    logging.basicConfig(level=logging.INFO, 
                       format='%(asctime)s - %(levelname)s - %(message)s')
    
    # Inicializar conector
    connector = NASAEarthdataConnector()
    
    # Tentar autenticar
    authenticated = connector.authenticate()
    
    results = {
        'authenticated': authenticated,
        'dataset': args.dataset,
        'search_params': {
            'start_date': args.start_date,
            'end_date': args.end_date,
            'limit': args.limit,
            'bbox': connector.angola_bbox
        },
        'timestamp': datetime.now().isoformat()
    }
    
    # Buscar granules
    granules = connector.search_granules_angola(
        args.dataset,
        args.start_date,
        args.end_date,
        args.limit
    )
    
    results['granules_found'] = len(granules)
    results['granules'] = granules
    
    # Obter URLs OPeNDAP
    opendap_urls = connector.get_opendap_urls(args.dataset)
    results['opendap_urls'] = opendap_urls
    
    # Gerar URLs do Worldview se solicitado
    if args.worldview:
        worldview_data = connector.get_worldview_imagery_urls()
        results['worldview'] = worldview_data
    
    # Gerar script de download se solicitado
    if args.generate_script and granules:
        script_path = connector.generate_download_script(granules)
        results['download_script'] = str(script_path)
    
    # Salvar resultados
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    logger.info(f"✅ Resultados salvos em: {args.output}")
    logger.info(f"📊 Resumo: {len(granules)} granules encontrados")
    
    if not authenticated:
        logger.info("💡 Para acesso completo, configure: NASA_USERNAME e NASA_PASSWORD")


if __name__ == "__main__":
    main()
