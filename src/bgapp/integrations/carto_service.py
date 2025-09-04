"""
🗺️ CARTO Integration Service for BGAPP
Integração completa entre CARTO API e BGAPP Marine Angola
"""

import asyncio
import aiohttp
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from urllib.parse import urlencode
import json

from ..core.database import get_database
from ..core.redis_client import get_redis
from ..core.config import get_settings

logger = logging.getLogger(__name__)

@dataclass
class CARTOConfig:
    """Configuração do CARTO"""
    base_url: str
    username: str
    api_key: str
    timeout: int = 30

class CARTOIntegrationService:
    """Serviço de integração com CARTO API"""
    
    def __init__(self, config: CARTOConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self.redis = get_redis()
        self.db = get_database()
        
    async def __aenter__(self):
        """Context manager para sessão HTTP"""
        timeout = aiohttp.ClientTimeout(total=self.config.timeout)
        self.session = aiohttp.ClientSession(
            timeout=timeout,
            headers={
                'User-Agent': 'BGAPP-Marine-Angola/2.0',
                'Accept': 'application/json'
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Fechar sessão HTTP"""
        if self.session:
            await self.session.close()
    
    def _build_url(self, endpoint: str, params: Dict[str, Any] = None) -> str:
        """Construir URL da API CARTO"""
        base = f"{self.config.base_url}/{endpoint.lstrip('/')}"
        
        if params:
            params['api_key'] = self.config.api_key
            query_string = urlencode(params)
            return f"{base}?{query_string}"
        
        return f"{base}?api_key={self.config.api_key}"
    
    async def execute_sql(self, query: str, format: str = 'json') -> Dict[str, Any]:
        """Executar query SQL na API CARTO"""
        try:
            url = self._build_url('api/v2/sql', {
                'q': query,
                'format': format
            })
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"CARTO SQL executado: {len(data.get('rows', []))} registros")
                    return data
                else:
                    error_text = await response.text()
                    logger.error(f"Erro CARTO SQL: {response.status} - {error_text}")
                    raise Exception(f"CARTO API error: {response.status}")
                    
        except Exception as e:
            logger.error(f"Erro ao executar SQL CARTO: {e}")
            raise
    
    async def get_tables(self) -> List[Dict[str, Any]]:
        """Listar todas as tabelas disponíveis"""
        query = """
        SELECT schemaname, tablename, tableowner, 
               pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
        """
        
        try:
            result = await self.execute_sql(query)
            return result.get('rows', [])
        except Exception as e:
            logger.error(f"Erro ao listar tabelas CARTO: {e}")
            return []
    
    async def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """Obter informações detalhadas de uma tabela"""
        query = f"""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
        """
        
        try:
            columns_result = await self.execute_sql(query)
            
            # Contar registros
            count_query = f"SELECT COUNT(*) as total FROM {table_name}"
            count_result = await self.execute_sql(count_query)
            
            return {
                'table_name': table_name,
                'columns': columns_result.get('rows', []),
                'total_records': count_result.get('rows', [{}])[0].get('total', 0)
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter info da tabela {table_name}: {e}")
            return {}
    
    async def get_marine_data(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Obter dados marinhos do CARTO"""
        query = f"""
        SELECT 
            cartodb_id,
            ST_AsGeoJSON(the_geom) as geometry,
            species_name,
            scientific_name,
            conservation_status,
            depth,
            temperature,
            salinity,
            location,
            date_observed,
            created_at,
            updated_at
        FROM marine_biodiversity 
        WHERE the_geom IS NOT NULL 
        ORDER BY updated_at DESC 
        LIMIT {limit}
        """
        
        try:
            result = await self.execute_sql(query)
            marine_data = result.get('rows', [])
            
            # Processar geometria
            for record in marine_data:
                if record.get('geometry'):
                    try:
                        record['geometry'] = json.loads(record['geometry'])
                    except:
                        record['geometry'] = None
            
            logger.info(f"Obtidos {len(marine_data)} registros marinhos do CARTO")
            return marine_data
            
        except Exception as e:
            logger.error(f"Erro ao obter dados marinhos: {e}")
            return []
    
    async def sync_to_bgapp(self, table_name: str = 'marine_biodiversity') -> Dict[str, Any]:
        """Sincronizar dados CARTO para BGAPP"""
        try:
            logger.info(f"Iniciando sincronização CARTO → BGAPP para tabela: {table_name}")
            
            # Obter dados do CARTO
            marine_data = await self.get_marine_data()
            
            if not marine_data:
                return {
                    'success': False,
                    'message': 'Nenhum dado encontrado no CARTO',
                    'synced_records': 0
                }
            
            # Inserir/atualizar no BGAPP
            synced_count = 0
            
            async with self.db.acquire() as conn:
                for record in marine_data:
                    try:
                        # Preparar dados para BGAPP
                        bgapp_record = {
                            'carto_id': record.get('cartodb_id'),
                            'species_name': record.get('species_name'),
                            'scientific_name': record.get('scientific_name'),
                            'conservation_status': record.get('conservation_status'),
                            'depth': record.get('depth'),
                            'temperature': record.get('temperature'),
                            'salinity': record.get('salinity'),
                            'location': record.get('location'),
                            'geometry': record.get('geometry'),
                            'date_observed': record.get('date_observed'),
                            'source': 'carto',
                            'last_sync': datetime.utcnow()
                        }
                        
                        # Upsert no BGAPP
                        await conn.execute("""
                            INSERT INTO marine_species_data 
                            (carto_id, species_name, scientific_name, conservation_status, 
                             depth, temperature, salinity, location, geometry, 
                             date_observed, source, last_sync, created_at)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                            ON CONFLICT (carto_id) 
                            DO UPDATE SET
                                species_name = EXCLUDED.species_name,
                                scientific_name = EXCLUDED.scientific_name,
                                conservation_status = EXCLUDED.conservation_status,
                                depth = EXCLUDED.depth,
                                temperature = EXCLUDED.temperature,
                                salinity = EXCLUDED.salinity,
                                location = EXCLUDED.location,
                                geometry = EXCLUDED.geometry,
                                date_observed = EXCLUDED.date_observed,
                                last_sync = EXCLUDED.last_sync,
                                updated_at = NOW()
                        """, 
                            bgapp_record['carto_id'],
                            bgapp_record['species_name'],
                            bgapp_record['scientific_name'],
                            bgapp_record['conservation_status'],
                            bgapp_record['depth'],
                            bgapp_record['temperature'],
                            bgapp_record['salinity'],
                            bgapp_record['location'],
                            json.dumps(bgapp_record['geometry']) if bgapp_record['geometry'] else None,
                            bgapp_record['date_observed'],
                            bgapp_record['source'],
                            bgapp_record['last_sync'],
                            datetime.utcnow()
                        )
                        
                        synced_count += 1
                        
                    except Exception as e:
                        logger.error(f"Erro ao sincronizar registro {record.get('cartodb_id')}: {e}")
                        continue
            
            # Atualizar cache
            await self.redis.setex(
                'carto:last_sync', 
                3600,  # 1 hora
                json.dumps({
                    'timestamp': datetime.utcnow().isoformat(),
                    'synced_records': synced_count,
                    'table': table_name
                })
            )
            
            logger.info(f"Sincronização concluída: {synced_count} registros")
            
            return {
                'success': True,
                'message': f'Sincronização concluída com sucesso',
                'synced_records': synced_count,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro na sincronização CARTO → BGAPP: {e}")
            return {
                'success': False,
                'message': f'Erro na sincronização: {str(e)}',
                'synced_records': 0
            }
    
    async def get_spatial_analysis(self, region: str = 'angola') -> Dict[str, Any]:
        """Análise espacial dos dados CARTO"""
        query = f"""
        SELECT 
            COUNT(*) as total_species,
            COUNT(DISTINCT species_name) as unique_species,
            AVG(depth) as avg_depth,
            AVG(temperature) as avg_temperature,
            AVG(salinity) as avg_salinity,
            ST_AsGeoJSON(ST_ConvexHull(ST_Collect(the_geom))) as coverage_area
        FROM marine_biodiversity 
        WHERE location ILIKE '%{region}%'
        AND the_geom IS NOT NULL
        """
        
        try:
            result = await self.execute_sql(query)
            analysis = result.get('rows', [{}])[0]
            
            # Processar área de cobertura
            if analysis.get('coverage_area'):
                try:
                    analysis['coverage_area'] = json.loads(analysis['coverage_area'])
                except:
                    analysis['coverage_area'] = None
            
            return analysis
            
        except Exception as e:
            logger.error(f"Erro na análise espacial: {e}")
            return {}
    
    async def create_map_integration(self, map_config: Dict[str, Any]) -> Dict[str, Any]:
        """Criar integração de mapa CARTO com BGAPP"""
        try:
            # Criar mapa no sistema BGAPP
            map_data = {
                'name': map_config.get('name', 'CARTO Integration Map'),
                'description': map_config.get('description', 'Map integrated with CARTO data'),
                'category': 'carto-integration',
                'source': 'carto',
                'config': {
                    'carto_table': map_config.get('table_name', 'marine_biodiversity'),
                    'carto_query': map_config.get('query'),
                    'visualization_type': map_config.get('viz_type', 'points'),
                    'style': map_config.get('style', {}),
                    'center': map_config.get('center', [-12.5, 18.5]),
                    'zoom': map_config.get('zoom', 6)
                },
                'created_at': datetime.utcnow(),
                'source_integration': {
                    'type': 'carto',
                    'username': self.config.username,
                    'table': map_config.get('table_name')
                }
            }
            
            # Salvar no BGAPP
            async with self.db.acquire() as conn:
                map_id = await conn.fetchval("""
                    INSERT INTO maps 
                    (name, description, category, source, config, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                """, 
                    map_data['name'],
                    map_data['description'], 
                    map_data['category'],
                    map_data['source'],
                    json.dumps(map_data['config']),
                    map_data['created_at']
                )
            
            logger.info(f"Mapa CARTO integrado criado: {map_id}")
            
            return {
                'success': True,
                'map_id': map_id,
                'message': 'Mapa CARTO integrado com sucesso'
            }
            
        except Exception as e:
            logger.error(f"Erro ao criar integração de mapa: {e}")
            return {
                'success': False,
                'message': f'Erro: {str(e)}'
            }

# Instância global do serviço
_carto_service: Optional[CARTOIntegrationService] = None

async def get_carto_service() -> CARTOIntegrationService:
    """Obter instância do serviço CARTO"""
    global _carto_service
    
    if not _carto_service:
        settings = get_settings()
        config = CARTOConfig(
            base_url=settings.carto_base_url,
            username=settings.carto_username,
            api_key=settings.carto_api_key
        )
        _carto_service = CARTOIntegrationService(config)
    
    return _carto_service

