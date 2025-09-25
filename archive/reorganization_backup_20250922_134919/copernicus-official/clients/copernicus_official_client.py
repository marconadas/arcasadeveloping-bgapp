#!/usr/bin/env python3
"""
Copernicus Official Client - Implementação correta baseada na documentação oficial
Integração completa com Copernicus Data Space Ecosystem usando APIs oficiais
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class CopernicusConfig:
    """Configuração oficial do Copernicus Data Space Ecosystem"""
    
    # URLs oficiais baseadas na documentação
    IDENTITY_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    CATALOG_ODATA_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
    STAC_URL = "https://catalogue.dataspace.copernicus.eu/stac"
    OPENSEARCH_URL = "https://catalogue.dataspace.copernicus.eu/resto/api/collections/search.json"
    DOWNLOAD_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
    
    # Configuração de autenticação oficial
    CLIENT_ID = "cdse-public"
    
    # Coleções disponíveis (baseado na documentação)
    COLLECTIONS = {
        'SENTINEL-1': 'SENTINEL-1',
        'SENTINEL-2': 'SENTINEL-2', 
        'SENTINEL-3': 'SENTINEL-3',
        'SENTINEL-5P': 'SENTINEL-5P',
        'SENTINEL-6': 'SENTINEL-6'
    }
    
    # ZEE Angola (coordenadas corretas)
    ANGOLA_EEZ = {
        'north': -4.2,
        'south': -18.0,
        'east': 17.5,
        'west': 8.5
    }


class CopernicusOfficialClient:
    """
    Cliente oficial para Copernicus Data Space Ecosystem
    Implementação baseada na documentação oficial
    """
    
    def __init__(self, username: str = None, password: str = None):
        self.config = CopernicusConfig()
        
        # Credenciais do ambiente ou parâmetros
        self.username = username or os.getenv('COPERNICUS_USERNAME')
        self.password = password or os.getenv('COPERNICUS_PASSWORD')
        
        # Sessão HTTP
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'BGAPP-Angola/2.0 Copernicus-CDSE-Client',
            'Accept': 'application/json'
        })
        
        # Token de acesso
        self.access_token = None
        self.token_expires = None
    
    def authenticate(self) -> bool:
        """
        Autenticação oficial com Copernicus Data Space Ecosystem
        Baseado na documentação: https://documentation.dataspace.copernicus.eu/APIs.html
        """
        try:
            auth_data = {
                'client_id': self.config.CLIENT_ID,
                'grant_type': 'password',
                'username': self.username,
                'password': self.password
            }
            
            logger.info(f"🔐 Autenticando com Copernicus CDSE: {self.username}")
            
            response = self.session.post(
                self.config.IDENTITY_URL,
                data=auth_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=30
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data['access_token']
                expires_in = token_data.get('expires_in', 3600)
                self.token_expires = datetime.now() + timedelta(seconds=expires_in)
                
                # Configurar header de autorização
                self.session.headers['Authorization'] = f'Bearer {self.access_token}'
                
                logger.info("✅ Autenticação CDSE bem-sucedida!")
                return True
            else:
                logger.error(f"❌ Falha na autenticação CDSE: {response.status_code}")
                logger.error(f"Resposta: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro na autenticação CDSE: {e}")
            return False
    
    def search_odata(self, collection: str = 'SENTINEL-3', 
                     start_date: datetime = None, 
                     end_date: datetime = None,
                     max_records: int = 20) -> Dict[str, Any]:
        """
        Busca usando OData API (oficial)
        Baseado na documentação: https://documentation.dataspace.copernicus.eu/APIs/OData.html
        """
        if not self.access_token:
            raise Exception("Não autenticado. Execute authenticate() primeiro.")
        
        # Datas padrão (última semana)
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=7)
        
        # Construir filtro OData conforme documentação
        filters = [
            f"Collection/Name eq '{collection}'",
            f"ContentDate/Start gt {start_date.strftime('%Y-%m-%dT%H:%M:%S.000Z')}",
            f"ContentDate/Start lt {end_date.strftime('%Y-%m-%dT%H:%M:%S.000Z')}"
        ]
        
        # Filtro geográfico para Angola (usando sintaxe correta da documentação)
        angola_polygon = f"SRID=4326;POLYGON(({self.config.ANGOLA_EEZ['west']} {self.config.ANGOLA_EEZ['south']}, {self.config.ANGOLA_EEZ['east']} {self.config.ANGOLA_EEZ['south']}, {self.config.ANGOLA_EEZ['east']} {self.config.ANGOLA_EEZ['north']}, {self.config.ANGOLA_EEZ['west']} {self.config.ANGOLA_EEZ['north']}, {self.config.ANGOLA_EEZ['west']} {self.config.ANGOLA_EEZ['south']}))"
        filters.append(f"OData.CSC.Intersects(area=geography'{angola_polygon}')")
        
        # Parâmetros OData
        params = {
            '$filter': ' and '.join(filters),
            '$orderby': 'ContentDate/Start desc',
            '$top': str(max_records),
            '$select': 'Id,Name,ContentDate,GeoFootprint,S3Path,ContentLength'
        }
        
        try:
            logger.info(f"🔍 Buscando dados OData para {collection}")
            
            response = self.session.get(
                self.config.CATALOG_ODATA_URL,
                params=params,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ Encontrados {len(data.get('value', []))} produtos")
                return data
            else:
                logger.error(f"❌ Erro na busca OData: {response.status_code}")
                logger.error(f"Resposta: {response.text}")
                return {'value': [], 'error': response.text}
                
        except Exception as e:
            logger.error(f"❌ Erro na busca OData: {e}")
            return {'value': [], 'error': str(e)}
    
    def search_stac(self, collections: List[str] = ['SENTINEL-3'],
                    start_date: datetime = None,
                    end_date: datetime = None,
                    limit: int = 50) -> Dict[str, Any]:
        """
        Busca usando STAC API (oficial)
        Baseado na documentação: https://documentation.dataspace.copernicus.eu/APIs/STAC.html
        """
        if not self.access_token:
            raise Exception("Não autenticado. Execute authenticate() primeiro.")
        
        # Datas padrão
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=7)
        
        # Corpo da requisição STAC
        search_body = {
            "collections": collections,
            "datetime": f"{start_date.isoformat()}Z/{end_date.isoformat()}Z",
            "bbox": [
                self.config.ANGOLA_EEZ['west'],
                self.config.ANGOLA_EEZ['south'],
                self.config.ANGOLA_EEZ['east'],
                self.config.ANGOLA_EEZ['north']
            ],
            "limit": limit,
            "fields": {
                "include": ["id", "type", "geometry", "bbox", "properties", "assets"],
                "exclude": []
            }
        }
        
        try:
            logger.info(f"🔍 Buscando dados STAC para {collections}")
            
            response = self.session.post(
                f"{self.config.STAC_URL}/search",
                json=search_body,
                headers={'Content-Type': 'application/json'},
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ STAC: Encontrados {len(data.get('features', []))} itens")
                return data
            else:
                logger.error(f"❌ Erro na busca STAC: {response.status_code}")
                logger.error(f"Resposta: {response.text}")
                return {'features': [], 'error': response.text}
                
        except Exception as e:
            logger.error(f"❌ Erro na busca STAC: {e}")
            return {'features': [], 'error': str(e)}
    
    def search_opensearch(self, collection: str = 'Sentinel3',
                         start_date: datetime = None,
                         end_date: datetime = None,
                         max_records: int = 20) -> Dict[str, Any]:
        """
        Busca usando OpenSearch API (oficial)  
        Baseado na documentação: https://documentation.dataspace.copernicus.eu/APIs/OpenSearch.html
        """
        # Datas padrão
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=7)
        
        # Parâmetros OpenSearch
        params = {
            'startDate': start_date.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
            'completionDate': end_date.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
            'box': f"{self.config.ANGOLA_EEZ['west']},{self.config.ANGOLA_EEZ['south']},{self.config.ANGOLA_EEZ['east']},{self.config.ANGOLA_EEZ['north']}",
            'maxRecords': str(max_records),
            'sortParam': 'startDate',
            'sortOrder': 'descending'
        }
        
        try:
            logger.info(f"🔍 Buscando dados OpenSearch para {collection}")
            
            # OpenSearch não requer autenticação para busca
            response = requests.get(
                f"{self.config.OPENSEARCH_URL.replace('/search.json', f'/{collection}/search.json')}",
                params=params,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ OpenSearch: Encontrados {len(data.get('features', []))} produtos")
                return data
            else:
                logger.error(f"❌ Erro na busca OpenSearch: {response.status_code}")
                return {'features': [], 'error': response.text}
                
        except Exception as e:
            logger.error(f"❌ Erro na busca OpenSearch: {e}")
            return {'features': [], 'error': str(e)}
    
    def download_product(self, product_id: str, output_path: str) -> bool:
        """
        Download de produto usando ID
        Baseado na documentação: https://documentation.dataspace.copernicus.eu/APIs/OData.html#product-download
        """
        if not self.access_token:
            raise Exception("Não autenticado. Execute authenticate() primeiro.")
        
        download_url = f"{self.config.DOWNLOAD_URL}({product_id})/$value"
        
        try:
            logger.info(f"📥 Baixando produto: {product_id}")
            
            response = self.session.get(
                download_url,
                stream=True,
                timeout=300
            )
            
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                
                logger.info(f"✅ Download concluído: {output_path}")
                return True
            else:
                logger.error(f"❌ Erro no download: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro no download: {e}")
            return False
    
    def get_angola_marine_data(self) -> Dict[str, Any]:
        """
        Obter dados marinhos específicos para Angola
        Combina múltiplas APIs para dados completos
        """
        if not self.authenticate():
            return {'error': 'Falha na autenticação'}
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'angola_eez': self.config.ANGOLA_EEZ,
            'data_sources': {}
        }
        
        # 1. Buscar dados Sentinel-3 (oceanográficos)
        s3_data = self.search_odata('SENTINEL-3', max_records=10)
        results['data_sources']['sentinel3_odata'] = {
            'products_found': len(s3_data.get('value', [])),
            'data': s3_data
        }
        
        # 2. Buscar via STAC para metadados ricos
        stac_data = self.search_stac(['SENTINEL-3'], limit=10)
        results['data_sources']['sentinel3_stac'] = {
            'features_found': len(stac_data.get('features', [])),
            'data': stac_data
        }
        
        # 3. Buscar via OpenSearch para compatibilidade
        opensearch_data = self.search_opensearch('Sentinel3', max_records=10)
        results['data_sources']['sentinel3_opensearch'] = {
            'products_found': len(opensearch_data.get('features', [])),
            'data': opensearch_data
        }
        
        return results


# Instância global do cliente oficial
copernicus_client = CopernicusOfficialClient()
