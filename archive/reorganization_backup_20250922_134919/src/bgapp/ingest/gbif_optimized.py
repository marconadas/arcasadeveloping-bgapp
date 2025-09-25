"""
GBIF Connector Otimizado
Versão de alta performance com cache, processamento assíncrono e connection pooling
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from .performance_optimizer import (
    get_optimized_session, cached, timed, batch_async_requests, 
    parallel_process, get_performance_metrics
)

logger = logging.getLogger(__name__)


class GBIFOptimizedConnector:
    """Conector GBIF otimizado para alta performance"""
    
    def __init__(self):
        self.base_url = "https://api.gbif.org/v1"
        self.connector_id = "gbif_optimized"
        
        # Usar sessão otimizada com connection pooling
        self.session = get_optimized_session(self.connector_id)
        
        # Coordenadas de Angola (cached)
        self.angola_bounds = {
            'north': -4.2, 'south': -18.2, 'east': 24.1, 'west': 11.4
        }
        
        # Taxonomias pré-processadas para consultas rápidas
        self.marine_taxa_keys = {
            'fish': [2, 195],  # Animalia, Actinopterygii keys
            'marine_mammals': [2, 359],  # Animalia, Mammalia keys
            'mollusks': [2, 52],  # Animalia, Mollusca keys
            'crustaceans': [2, 1065],  # Animalia, Crustacea keys
            'corals': [2, 1267],  # Animalia, Cnidaria keys
        }
        
        # Cache de espécies para evitar consultas repetidas
        self.species_cache = {}
    
    @cached(ttl=3600)  # Cache por 1 hora
    @timed
    def get_taxon_key(self, scientific_name: str) -> Optional[int]:
        """Obter chave taxonômica com cache"""
        try:
            response = self.session.get(
                f"{self.base_url}/species/match",
                params={'name': scientific_name},
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            return data.get('usageKey') or data.get('speciesKey')
            
        except Exception as e:
            logger.warning(f"⚠️ Erro ao obter taxon key para {scientific_name}: {e}")
            return None
    
    @cached(ttl=1800)  # Cache por 30 minutos
    @timed
    def search_species_optimized(self, taxa_type: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Buscar espécies com cache e otimizações"""
        if taxa_type not in self.marine_taxa_keys:
            logger.error(f"❌ Tipo de taxa não suportado: {taxa_type}")
            return []
        
        try:
            kingdom_key, class_key = self.marine_taxa_keys[taxa_type]
            
            params = {
                'kingdomKey': kingdom_key,
                'classKey': class_key,
                'limit': limit,
                'offset': 0
            }
            
            response = self.session.get(
                f"{self.base_url}/species/search",
                params=params,
                timeout=15
            )
            response.raise_for_status()
            
            data = response.json()
            species_list = []
            
            # Processamento otimizado dos resultados
            for result in data.get('results', []):
                species_info = {
                    'key': result.get('key'),
                    'scientific_name': result.get('scientificName'),
                    'rank': result.get('rank'),
                    'status': result.get('taxonomicStatus'),
                    'kingdom': result.get('kingdom'),
                    'phylum': result.get('phylum'),
                    'class': result.get('class'),
                    'family': result.get('family'),
                    'num_occurrences': result.get('numOccurrences', 0)
                }
                species_list.append(species_info)
            
            logger.info(f"✅ {taxa_type}: {len(species_list)} espécies encontradas")
            return species_list
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar espécies {taxa_type}: {e}")
            return []
    
    @timed
    def search_occurrences_batch(self, taxon_keys: List[int], 
                                limit_per_taxon: int = 100) -> List[Dict[str, Any]]:
        """Buscar ocorrências em lote para múltiplas espécies"""
        
        def fetch_occurrences_for_taxon(taxon_key: int) -> List[Dict[str, Any]]:
            """Buscar ocorrências para uma espécie específica"""
            try:
                params = {
                    'taxonKey': taxon_key,
                    'country': 'AO',
                    'hasCoordinate': 'true',
                    'hasGeospatialIssue': 'false',
                    'limit': limit_per_taxon,
                    'decimalLatitude': f"{self.angola_bounds['south']},{self.angola_bounds['north']}",
                    'decimalLongitude': f"{self.angola_bounds['west']},{self.angola_bounds['east']}"
                }
                
                response = self.session.get(
                    f"{self.base_url}/occurrence/search",
                    params=params,
                    timeout=20
                )
                response.raise_for_status()
                
                data = response.json()
                occurrences = []
                
                for result in data.get('results', []):
                    occurrence = {
                        'gbif_id': result.get('gbifID'),
                        'taxon_key': taxon_key,
                        'scientific_name': result.get('scientificName'),
                        'family': result.get('family'),
                        'latitude': result.get('decimalLatitude'),
                        'longitude': result.get('decimalLongitude'),
                        'event_date': result.get('eventDate'),
                        'year': result.get('year'),
                        'basis_of_record': result.get('basisOfRecord'),
                        'dataset_key': result.get('datasetKey')
                    }
                    occurrences.append(occurrence)
                
                return occurrences
                
            except Exception as e:
                logger.warning(f"⚠️ Erro ao buscar ocorrências para taxon {taxon_key}: {e}")
                return []
        
        # Processamento paralelo das consultas
        all_occurrences = []
        results = parallel_process(fetch_occurrences_for_taxon, taxon_keys, max_workers=5)
        
        for result in results:
            if isinstance(result, list):
                all_occurrences.extend(result)
        
        logger.info(f"✅ Total de ocorrências encontradas: {len(all_occurrences)}")
        return all_occurrences
    
    async def search_occurrences_async(self, taxon_keys: List[int], 
                                     limit_per_taxon: int = 100) -> List[Dict[str, Any]]:
        """Buscar ocorrências de forma assíncrona"""
        
        # Preparar requisições para processamento em lote
        requests_data = []
        for taxon_key in taxon_keys:
            params = {
                'taxonKey': taxon_key,
                'country': 'AO',
                'hasCoordinate': 'true',
                'limit': limit_per_taxon
            }
            
            # Construir URL com parâmetros
            url = f"{self.base_url}/occurrence/search"
            requests_data.append({
                'method': 'GET',
                'url': url,
                'params': params,
                'timeout': 20
            })
        
        # Executar requisições assíncronas
        results = await batch_async_requests(requests_data, max_concurrent=10)
        
        # Processar resultados
        all_occurrences = []
        for i, result in enumerate(results):
            if result.get('status') == 200:
                data = result.get('data', {})
                taxon_key = taxon_keys[i]
                
                for occurrence_data in data.get('results', []):
                    occurrence = {
                        'gbif_id': occurrence_data.get('gbifID'),
                        'taxon_key': taxon_key,
                        'scientific_name': occurrence_data.get('scientificName'),
                        'family': occurrence_data.get('family'),
                        'latitude': occurrence_data.get('decimalLatitude'),
                        'longitude': occurrence_data.get('decimalLongitude'),
                        'event_date': occurrence_data.get('eventDate'),
                        'year': occurrence_data.get('year'),
                        'basis_of_record': occurrence_data.get('basisOfRecord')
                    }
                    all_occurrences.append(occurrence)
        
        logger.info(f"✅ Async: {len(all_occurrences)} ocorrências encontradas")
        return all_occurrences
    
    @cached(ttl=7200)  # Cache por 2 horas
    @timed
    def get_comprehensive_marine_data(self, taxa_types: List[str] = None, 
                                    max_species_per_type: int = 20) -> Dict[str, Any]:
        """Obter dados abrangentes de fauna marinha com otimizações"""
        if not taxa_types:
            taxa_types = ['fish', 'marine_mammals', 'mollusks']
        
        comprehensive_data = {
            'search_region': self.angola_bounds,
            'taxa_types': taxa_types,
            'species_data': {},
            'total_species': 0,
            'total_occurrences': 0,
            'performance_metrics': {},
            'timestamp': datetime.now().isoformat()
        }
        
        # Buscar espécies para cada tipo de taxa
        all_taxon_keys = []
        
        for taxa_type in taxa_types:
            logger.info(f"🔍 Processando {taxa_type}...")
            
            species_list = self.search_species_optimized(taxa_type, max_species_per_type)
            comprehensive_data['species_data'][taxa_type] = species_list
            comprehensive_data['total_species'] += len(species_list)
            
            # Coletar chaves taxonômicas para busca de ocorrências
            taxon_keys = [s['key'] for s in species_list if s.get('key')]
            all_taxon_keys.extend(taxon_keys[:10])  # Limitar para performance
        
        # Buscar ocorrências em lote
        if all_taxon_keys:
            logger.info(f"🔍 Buscando ocorrências para {len(all_taxon_keys)} espécies...")
            occurrences = self.search_occurrences_batch(all_taxon_keys, limit_per_taxon=50)
            comprehensive_data['occurrences'] = occurrences
            comprehensive_data['total_occurrences'] = len(occurrences)
        
        # Adicionar métricas de performance
        comprehensive_data['performance_metrics'] = get_performance_metrics()
        
        return comprehensive_data
    
    @timed
    def export_optimized_geojson(self, occurrences: List[Dict[str, Any]], 
                                output_path: Path = None) -> Path:
        """Exportar para GeoJSON com processamento otimizado"""
        if not output_path:
            output_path = Path(f"gbif_optimized_{datetime.now().strftime('%Y%m%d_%H%M%S')}.geojson")
        
        # Processamento otimizado usando list comprehension
        features = [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(occ['longitude']), float(occ['latitude'])]
                },
                "properties": {
                    "gbif_id": occ.get('gbif_id'),
                    "scientific_name": occ.get('scientific_name'),
                    "family": occ.get('family'),
                    "event_date": occ.get('event_date'),
                    "basis_of_record": occ.get('basis_of_record')
                }
            }
            for occ in occurrences 
            if occ.get('latitude') and occ.get('longitude')
        ]
        
        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "source": "GBIF Optimized",
                "country": "Angola",
                "total_features": len(features),
                "generated_at": datetime.now().isoformat(),
                "performance_metrics": get_performance_metrics()
            }
        }
        
        # Usar ujson se disponível para melhor performance
        try:
            import ujson
            with open(output_path, 'w', encoding='utf-8') as f:
                ujson.dump(geojson, f, indent=2, ensure_ascii=False)
        except ImportError:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(geojson, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✅ GeoJSON otimizado exportado: {output_path}")
        return output_path
    
    def get_connector_performance_report(self) -> Dict[str, Any]:
        """Obter relatório detalhado de performance"""
        metrics = get_performance_metrics()
        
        return {
            'connector_id': self.connector_id,
            'connector_type': 'GBIF Optimized',
            'performance_metrics': metrics,
            'optimizations_enabled': [
                'Connection Pooling',
                'Intelligent Caching',
                'Async Processing',
                'Parallel Execution',
                'Optimized JSON Processing'
            ],
            'cache_info': {
                'species_cache_size': len(self.species_cache),
                'session_reuse': True,
                'compression_enabled': True
            },
            'recommendations': self._get_performance_recommendations(metrics),
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_performance_recommendations(self, metrics: Dict[str, Any]) -> List[str]:
        """Gerar recomendações baseadas nas métricas"""
        recommendations = []
        
        if metrics.get('cache_hit_rate', 0) < 50:
            recommendations.append("Considerar aumentar TTL do cache para melhorar hit rate")
        
        if metrics.get('avg_response_time', 0) > 2.0:
            recommendations.append("Tempo de resposta alto - considerar otimizar consultas")
        
        if metrics.get('errors', 0) > metrics.get('requests_total', 0) * 0.05:
            recommendations.append("Taxa de erro alta - verificar conectividade e rate limits")
        
        if not recommendations:
            recommendations.append("Performance ótima - nenhuma otimização adicional necessária")
        
        return recommendations


# Função de conveniência para uso
def create_optimized_gbif_connector() -> GBIFOptimizedConnector:
    """Criar instância otimizada do conector GBIF"""
    return GBIFOptimizedConnector()


# Exemplo de uso assíncrono
async def demo_async_gbif():
    """Demonstração de uso assíncrono do conector otimizado"""
    connector = create_optimized_gbif_connector()
    
    # Buscar espécies
    fish_species = connector.search_species_optimized('fish', limit=10)
    taxon_keys = [s['key'] for s in fish_species if s.get('key')][:5]
    
    # Buscar ocorrências de forma assíncrona
    occurrences = await connector.search_occurrences_async(taxon_keys)
    
    print(f"🐠 Encontradas {len(fish_species)} espécies de peixes")
    print(f"📍 Encontradas {len(occurrences)} ocorrências")
    
    # Relatório de performance
    report = connector.get_connector_performance_report()
    print(f"📊 Performance: {report['performance_metrics']['cache_hit_rate']}% cache hit rate")
    
    return occurrences


if __name__ == "__main__":
    # Teste do conector otimizado
    connector = create_optimized_gbif_connector()
    
    # Teste síncrono
    print("🚀 Testando conector GBIF otimizado...")
    data = connector.get_comprehensive_marine_data(['fish'], max_species_per_type=5)
    print(f"📊 Resultado: {data['total_species']} espécies, {data['total_occurrences']} ocorrências")
    
    # Relatório de performance
    report = connector.get_connector_performance_report()
    print("\n📈 Relatório de Performance:")
    for key, value in report['performance_metrics'].items():
        print(f"   {key}: {value}")
    
    # Teste assíncrono
    print("\n🔄 Testando processamento assíncrono...")
    asyncio.run(demo_async_gbif())
