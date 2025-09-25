"""
GBIF (Global Biodiversity Information Facility) Connector
Conector moderno para dados de biodiversidade global via API GBIF
"""

import argparse
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class GBIFConnector:
    """Conector para GBIF API v1"""
    
    def __init__(self):
        self.base_url = "https://api.gbif.org/v1"
        self.session = self._get_session()
        
        # Coordenadas de Angola
        self.angola_bounds = {
            'north': -4.2,    # Cabinda
            'south': -18.2,   # Cunene
            'east': 24.1,     # Leste
            'west': 11.4      # Oeste
        }
        
        # Taxonomias relevantes para ambiente marinho angolano
        self.marine_taxa = {
            'fish': {'kingdom': 'Animalia', 'class': 'Actinopterygii'},
            'marine_mammals': {'kingdom': 'Animalia', 'class': 'Mammalia', 'habitat': 'marine'},
            'mollusks': {'kingdom': 'Animalia', 'phylum': 'Mollusca'},
            'crustaceans': {'kingdom': 'Animalia', 'phylum': 'Arthropoda', 'class': 'Crustacea'},
            'corals': {'kingdom': 'Animalia', 'phylum': 'Cnidaria'},
            'marine_plants': {'kingdom': 'Plantae', 'habitat': 'marine'},
            'seabirds': {'kingdom': 'Animalia', 'class': 'Aves', 'habitat': 'marine'}
        }
        
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
            'User-Agent': 'BGAPP-Angola/1.0 GBIF-Client',
            'Accept': 'application/json'
        })
        
        return session
    
    def search_species(self, taxon_key: int = None, 
                      scientific_name: str = None,
                      rank: str = None) -> List[Dict[str, Any]]:
        """Buscar espécies no GBIF"""
        try:
            url = f"{self.base_url}/species/search"
            params = {
                'limit': 100,
                'offset': 0
            }
            
            if taxon_key:
                params['taxon_key'] = taxon_key
            if scientific_name:
                params['q'] = scientific_name
            if rank:
                params['rank'] = rank
                
            logger.info(f"🔍 Buscando espécies no GBIF: {params}")
            
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            species_list = []
            
            for result in data.get('results', []):
                species_info = {
                    'key': result.get('key'),
                    'scientific_name': result.get('scientificName'),
                    'canonical_name': result.get('canonicalName'),
                    'rank': result.get('rank'),
                    'status': result.get('taxonomicStatus'),
                    'kingdom': result.get('kingdom'),
                    'phylum': result.get('phylum'),
                    'class': result.get('class'),
                    'order': result.get('order'),
                    'family': result.get('family'),
                    'genus': result.get('genus'),
                    'species': result.get('species'),
                    'authorship': result.get('authorship'),
                    'num_occurrences': result.get('numOccurrences', 0)
                }
                species_list.append(species_info)
            
            logger.info(f"✅ Encontradas {len(species_list)} espécies")
            return species_list
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar espécies: {e}")
            return []
    
    def search_occurrences_angola(self, taxon_key: int = None,
                                 scientific_name: str = None,
                                 start_date: str = None,
                                 end_date: str = None,
                                 limit: int = 1000) -> List[Dict[str, Any]]:
        """Buscar ocorrências de espécies em Angola"""
        try:
            url = f"{self.base_url}/occurrence/search"
            
            params = {
                'country': 'AO',  # Código ISO para Angola
                'hasCoordinate': 'true',
                'hasGeospatialIssue': 'false',
                'limit': limit,
                'offset': 0
            }
            
            # Filtros geográficos para Angola
            params.update({
                'decimalLatitude': f"{self.angola_bounds['south']},{self.angola_bounds['north']}",
                'decimalLongitude': f"{self.angola_bounds['west']},{self.angola_bounds['east']}"
            })
            
            if taxon_key:
                params['taxonKey'] = taxon_key
            if scientific_name:
                params['scientificName'] = scientific_name
            if start_date and end_date:
                params['eventDate'] = f"{start_date},{end_date}"
            
            logger.info(f"🔍 Buscando ocorrências em Angola: {params}")
            
            response = self.session.get(url, params=params, timeout=60)
            response.raise_for_status()
            
            data = response.json()
            occurrences = []
            
            for result in data.get('results', []):
                occurrence = {
                    'gbif_id': result.get('gbifID'),
                    'key': result.get('key'),
                    'scientific_name': result.get('scientificName'),
                    'kingdom': result.get('kingdom'),
                    'phylum': result.get('phylum'),
                    'class': result.get('class'),
                    'order': result.get('order'),
                    'family': result.get('family'),
                    'genus': result.get('genus'),
                    'species': result.get('species'),
                    'latitude': result.get('decimalLatitude'),
                    'longitude': result.get('decimalLongitude'),
                    'coordinate_precision': result.get('coordinateUncertaintyInMeters'),
                    'country': result.get('country'),
                    'state_province': result.get('stateProvince'),
                    'locality': result.get('locality'),
                    'event_date': result.get('eventDate'),
                    'year': result.get('year'),
                    'month': result.get('month'),
                    'day': result.get('day'),
                    'basis_of_record': result.get('basisOfRecord'),
                    'institution_code': result.get('institutionCode'),
                    'collection_code': result.get('collectionCode'),
                    'dataset_key': result.get('datasetKey'),
                    'publisher': result.get('publishingOrgKey'),
                    'license': result.get('license'),
                    'issues': result.get('issues', []),
                    'media_type': result.get('mediaType', []),
                    'recorded_by': result.get('recordedBy'),
                    'identified_by': result.get('identifiedBy')
                }
                occurrences.append(occurrence)
            
            logger.info(f"✅ Encontradas {len(occurrences)} ocorrências em Angola")
            return occurrences
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar ocorrências: {e}")
            return []
    
    def search_marine_species_angola(self, taxa_type: str = 'fish',
                                   limit: int = 500) -> Dict[str, Any]:
        """Buscar espécies marinhas específicas em Angola"""
        try:
            if taxa_type not in self.marine_taxa:
                raise ValueError(f"Tipo de taxa não suportado: {taxa_type}")
            
            taxa_params = self.marine_taxa[taxa_type]
            logger.info(f"🐠 Buscando {taxa_type} em águas angolanas")
            
            # Primeiro, buscar as espécies
            species_url = f"{self.base_url}/species/search"
            species_params = {
                'limit': 100,
                'habitat': 'marine',
                **taxa_params
            }
            
            species_response = self.session.get(species_url, params=species_params, timeout=30)
            species_response.raise_for_status()
            species_data = species_response.json()
            
            # Depois, buscar ocorrências para algumas espécies chave
            all_occurrences = []
            species_processed = 0
            
            for species in species_data.get('results', [])[:10]:  # Limitar a 10 espécies
                if species_processed >= 5:  # Não processar mais de 5 para evitar timeout
                    break
                    
                species_key = species.get('key')
                if species_key:
                    occurrences = self.search_occurrences_angola(
                        taxon_key=species_key,
                        limit=50
                    )
                    all_occurrences.extend(occurrences)
                    species_processed += 1
            
            result = {
                'taxa_type': taxa_type,
                'search_params': taxa_params,
                'species_found': len(species_data.get('results', [])),
                'species_processed': species_processed,
                'total_occurrences': len(all_occurrences),
                'species_list': species_data.get('results', [])[:10],
                'occurrences': all_occurrences,
                'summary': self._generate_summary(all_occurrences),
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"✅ {taxa_type}: {result['species_found']} espécies, {result['total_occurrences']} ocorrências")
            return result
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar espécies marinhas: {e}")
            return {
                'taxa_type': taxa_type,
                'error': str(e),
                'species_found': 0,
                'total_occurrences': 0,
                'timestamp': datetime.now().isoformat()
            }
    
    def _generate_summary(self, occurrences: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Gerar resumo estatístico das ocorrências"""
        if not occurrences:
            return {}
        
        # Contagens por família, classe, etc.
        families = {}
        classes = {}
        years = {}
        provinces = {}
        
        for occ in occurrences:
            # Famílias
            family = occ.get('family', 'Unknown')
            families[family] = families.get(family, 0) + 1
            
            # Classes
            class_name = occ.get('class', 'Unknown')
            classes[class_name] = classes.get(class_name, 0) + 1
            
            # Anos
            year = occ.get('year')
            if year:
                years[str(year)] = years.get(str(year), 0) + 1
            
            # Províncias
            province = occ.get('state_province', 'Unknown')
            provinces[province] = provinces.get(province, 0) + 1
        
        return {
            'total_occurrences': len(occurrences),
            'unique_families': len(families),
            'unique_classes': len(classes),
            'top_families': sorted(families.items(), key=lambda x: x[1], reverse=True)[:5],
            'top_classes': sorted(classes.items(), key=lambda x: x[1], reverse=True)[:5],
            'years_range': f"{min(years.keys()) if years else 'N/A'} - {max(years.keys()) if years else 'N/A'}",
            'provinces': list(provinces.keys())
        }
    
    def export_to_geojson(self, occurrences: List[Dict[str, Any]], 
                         output_path: Path = None) -> Path:
        """Exportar ocorrências para formato GeoJSON"""
        if not output_path:
            output_path = Path(f"gbif_angola_{datetime.now().strftime('%Y%m%d_%H%M%S')}.geojson")
        
        features = []
        
        for occ in occurrences:
            if occ.get('latitude') and occ.get('longitude'):
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [float(occ['longitude']), float(occ['latitude'])]
                    },
                    "properties": {
                        "gbif_id": occ.get('gbif_id'),
                        "scientific_name": occ.get('scientific_name'),
                        "family": occ.get('family'),
                        "class": occ.get('class'),
                        "event_date": occ.get('event_date'),
                        "locality": occ.get('locality'),
                        "basis_of_record": occ.get('basis_of_record'),
                        "institution": occ.get('institution_code')
                    }
                }
                features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "source": "GBIF",
                "country": "Angola",
                "total_features": len(features),
                "generated_at": datetime.now().isoformat(),
                "bounds": self.angola_bounds
            }
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✅ GeoJSON exportado para: {output_path}")
        return output_path


def main(argv: Optional[List[str]] = None) -> None:
    """Função principal para testar o conector GBIF"""
    parser = argparse.ArgumentParser(description="GBIF Connector para Angola")
    parser.add_argument("--taxa-type", default="fish", 
                       choices=['fish', 'marine_mammals', 'mollusks', 'crustaceans', 'corals', 'marine_plants', 'seabirds'])
    parser.add_argument("--scientific-name", default=None)
    parser.add_argument("--taxon-key", type=int, default=None)
    parser.add_argument("--limit", type=int, default=500)
    parser.add_argument("--export-geojson", action='store_true')
    parser.add_argument("--output", type=Path, default=Path("gbif_results.json"))
    
    args = parser.parse_args(argv)
    
    # Configurar logging
    logging.basicConfig(level=logging.INFO, 
                       format='%(asctime)s - %(levelname)s - %(message)s')
    
    # Inicializar conector
    connector = GBIFConnector()
    
    # Buscar espécies marinhas
    results = connector.search_marine_species_angola(
        taxa_type=args.taxa_type,
        limit=args.limit
    )
    
    # Salvar resultados
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    # Exportar para GeoJSON se solicitado
    if args.export_geojson and results.get('occurrences'):
        geojson_path = connector.export_to_geojson(results['occurrences'])
        logger.info(f"📍 GeoJSON criado: {geojson_path}")
    
    logger.info(f"✅ Resultados salvos em: {args.output}")
    logger.info(f"📊 Resumo: {results.get('species_found', 0)} espécies, {results.get('total_occurrences', 0)} ocorrências")


if __name__ == "__main__":
    main()
