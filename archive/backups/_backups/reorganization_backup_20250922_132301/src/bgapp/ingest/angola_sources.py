"""
Conector para fontes de dados angolanas
Integração com instituições nacionais de investigação marinha
"""

import argparse
import json
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class AngolaDataConnector:
    """Conector para fontes de dados marinhos angolanas"""
    
    def __init__(self):
        self.session = self._get_session()
        
        # URLs das instituições angolanas (configuráveis)
        self.sources = {
            'inip': {
                'name': 'Instituto Nacional de Investigação Pesqueira',
                'base_url': 'https://api.inip.gov.ao/v1',  # URL hipotética
                'description': 'Dados de pesca e recursos marinhos'
            },
            'uan_marine': {
                'name': 'Universidade Agostinho Neto - Dept. Ciências Marinhas',
                'base_url': 'https://marine.uan.ao/api',  # URL hipotética
                'description': 'Investigação académica marinha'
            },
            'minagrip': {
                'name': 'Ministério da Agricultura e Pescas',
                'base_url': 'https://data.minagrip.gov.ao/api',  # URL hipotética
                'description': 'Estatísticas pesqueiras nacionais'
            },
            'ina': {
                'name': 'Instituto Nacional de Aquacultura',
                'base_url': 'https://api.ina.gov.ao/v1',  # URL hipotética
                'description': 'Dados de aquacultura e maricultura'
            }
        }
    
    def _get_session(self) -> requests.Session:
        """Configurar sessão HTTP com retry automático"""
        session = requests.Session()
        retries = Retry(
            total=3,
            backoff_factor=1.0,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"],
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retries)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        session.headers.update({
            "User-Agent": "BGAPP-Angola/1.0 marine-research",
            "Accept": "application/json"
        })
        return session
    
    def fetch_fisheries_data(
        self,
        source: str = 'inip',
        species: Optional[List[str]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        zone: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Buscar dados pesqueiros de instituições angolanas
        
        Args:
            source: Fonte de dados ('inip', 'minagrip', etc.)
            species: Lista de espécies de interesse
            start_date: Data inicial (ISO format)
            end_date: Data final (ISO format)
            zone: Zona de pesca (norte, centro, sul)
        """
        if source not in self.sources:
            raise ValueError(f"Fonte desconhecida: {source}")
        
        base_url = self.sources[source]['base_url']
        
        # Construir parâmetros da consulta
        params = {}
        if species:
            params['species'] = ','.join(species)
        if start_date:
            params['start_date'] = start_date
        if end_date:
            params['end_date'] = end_date
        if zone:
            params['zone'] = zone
        
        # URLs específicas por fonte
        endpoints = {
            'inip': f"{base_url}/fisheries/catches",
            'minagrip': f"{base_url}/statistics/landings",
            'uan_marine': f"{base_url}/research/biodiversity",
            'ina': f"{base_url}/aquaculture/production"
        }
        
        url = endpoints.get(source, f"{base_url}/data")
        
        try:
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Normalizar formato dos dados
            return self._normalize_data(data, source)
            
        except requests.RequestException as e:
            print(f"Erro ao conectar com {self.sources[source]['name']}: {e}")
            return []
        except Exception as e:
            print(f"Erro no processamento de dados de {source}: {e}")
            return []
    
    def _normalize_data(self, data: Dict[str, Any], source: str) -> List[Dict[str, Any]]:
        """Normalizar dados de diferentes fontes para formato padrão"""
        
        normalized = []
        records = data.get('data', data.get('records', []))
        
        for record in records:
            # Formato padrão BGAPP
            normalized_record = {
                'source': source,
                'source_name': self.sources[source]['name'],
                'record_id': record.get('id', ''),
                'scientific_name': record.get('species', record.get('scientificName', '')),
                'common_name_pt': record.get('nome_comum', record.get('commonName', '')),
                'latitude': float(record.get('lat', record.get('latitude', 0))),
                'longitude': float(record.get('lon', record.get('longitude', 0))),
                'date': record.get('date', record.get('data', '')),
                'depth': record.get('depth', record.get('profundidade')),
                'temperature': record.get('temperature', record.get('temperatura')),
                'salinity': record.get('salinity', record.get('salinidade')),
                'catch_kg': record.get('catch_weight', record.get('captura_kg')),
                'effort_hours': record.get('effort', record.get('esforco_horas')),
                'vessel_type': record.get('vessel_type', record.get('tipo_embarcacao')),
                'fishing_zone': record.get('zone', record.get('zona_pesca')),
                'data_quality': record.get('quality', 'medium'),
                'collector': record.get('collector', record.get('coletor')),
                'institution': self.sources[source]['name'],
                'metadata': {
                    'original_record': record,
                    'ingestion_date': datetime.utcnow().isoformat(),
                    'data_source': source
                }
            }
            
            # Remover campos vazios
            normalized_record = {k: v for k, v in normalized_record.items() 
                                if v is not None and v != ''}
            
            normalized.append(normalized_record)
        
        return normalized
    
    def fetch_oceanographic_data(
        self,
        parameters: List[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        bbox: Optional[List[float]] = None
    ) -> List[Dict[str, Any]]:
        """
        Buscar dados oceanográficos regionais específicos de Angola
        
        Args:
            parameters: Parâmetros oceanográficos (temp, sal, chl, currents)
            start_date: Data inicial
            end_date: Data final
            bbox: Bounding box [min_lon, min_lat, max_lon, max_lat]
        """
        
        # Dados regionais específicos do Atlântico Sul / Angola
        regional_data = {
            'benguela_current': {
                'description': 'Sistema de Corrente de Benguela',
                'temperature_range': [12, 25],  # °C
                'upwelling_zones': [
                    {'lat': -15.5, 'lon': 12.0, 'intensity': 'high'},
                    {'lat': -16.8, 'lon': 11.8, 'intensity': 'medium'},
                    {'lat': -8.8, 'lon': 13.2, 'intensity': 'low'}
                ]
            },
            'angola_current': {
                'description': 'Corrente Quente de Angola',
                'temperature_range': [24, 28],  # °C
                'seasonal_variation': 'high'
            },
            'coastal_productivity': {
                'description': 'Produtividade primária costeira',
                'chl_a_range': [0.5, 15.0],  # mg/m³
                'peak_season': ['Jun', 'Jul', 'Aug', 'Sep']
            }
        }
        
        # Simular dados oceanográficos (em implementação real, conectaria a APIs)
        mock_data = []
        
        if not parameters:
            parameters = ['temperature', 'salinity', 'chlorophyll']
        
        # Gerar dados de exemplo para a costa angolana
        import random
        from datetime import datetime, timedelta
        
        if not start_date:
            start_date = '2024-01-01'
        if not end_date:
            end_date = '2024-12-31'
        
        # Bbox padrão: ZEE completa de Angola (CORRIGIDO!)
        if not bbox:
            bbox = [8.5, -18.2, 17.5, -4.2]  # west, south, east, north
        
        # Gerar pontos de dados sintéticos
        for i in range(100):  # 100 pontos de exemplo
            lat = random.uniform(bbox[1], bbox[3])
            lon = random.uniform(bbox[0], bbox[2])
            
            # Determinar zona (norte vs sul para diferentes características)
            is_northern = lat > -12.0
            
            record = {
                'latitude': round(lat, 4),
                'longitude': round(lon, 4),
                'date': start_date,
                'source': 'angola_oceanographic',
                'data_quality': 'high'
            }
            
            if 'temperature' in parameters:
                # Norte: mais quente (Corrente de Angola)
                # Sul: mais frio (Corrente de Benguela)
                base_temp = 26 if is_northern else 18
                record['temperature'] = round(base_temp + random.uniform(-3, 3), 2)
            
            if 'salinity' in parameters:
                record['salinity'] = round(35.0 + random.uniform(-1, 1), 2)
            
            if 'chlorophyll' in parameters:
                # Maior produtividade no sul (upwelling)
                base_chl = 2.0 if is_northern else 8.0
                record['chlorophyll_a'] = round(base_chl + random.uniform(0, 5), 2)
            
            mock_data.append(record)
        
        return mock_data
    
    def get_species_checklist(self, group: str = 'all') -> List[Dict[str, Any]]:
        """
        Obter checklist de espécies marinhas angolanas
        
        Args:
            group: Grupo taxonômico ('fish', 'mammals', 'birds', 'reptiles', 'all')
        """
        
        # Checklist baseado na literatura científica sobre fauna marinha angolana
        species_data = {
            'fish': [
                {
                    'scientific_name': 'Dentex angolensis',
                    'common_name_pt': 'Dentão-angolano',
                    'common_name_local': 'Cachucho',
                    'status': 'endemic',
                    'habitat': 'demersal',
                    'depth_range': [50, 300],
                    'commercial_importance': 'high'
                },
                {
                    'scientific_name': 'Merluccius capensis',
                    'common_name_pt': 'Pescada-do-cabo',
                    'common_name_local': 'Pescada',
                    'status': 'native',
                    'habitat': 'demersal',
                    'depth_range': [100, 800],
                    'commercial_importance': 'very_high'
                },
                {
                    'scientific_name': 'Thunnus albacares',
                    'common_name_pt': 'Atum-amarelo',
                    'common_name_local': 'Albacora',
                    'status': 'migratory',
                    'habitat': 'pelagic',
                    'depth_range': [0, 250],
                    'commercial_importance': 'very_high'
                }
            ],
            'mammals': [
                {
                    'scientific_name': 'Tursiops truncatus',
                    'common_name_pt': 'Golfinho-roaz',
                    'common_name_local': 'Boto',
                    'status': 'resident',
                    'habitat': 'coastal',
                    'conservation_status': 'LC'
                },
                {
                    'scientific_name': 'Megaptera novaeangliae',
                    'common_name_pt': 'Baleia-jubarte',
                    'common_name_local': 'Baleia-cantora',
                    'status': 'migratory',
                    'habitat': 'pelagic',
                    'conservation_status': 'LC',
                    'migration_season': ['Jun', 'Jul', 'Aug', 'Sep']
                }
            ],
            'birds': [
                {
                    'scientific_name': 'Pelecanus onocrotalus',
                    'common_name_pt': 'Pelicano-branco',
                    'common_name_local': 'Pelicano',
                    'status': 'resident',
                    'habitat': 'coastal',
                    'nesting_sites': ['Baía de Luanda', 'Namibe']
                }
            ],
            'reptiles': [
                {
                    'scientific_name': 'Caretta caretta',
                    'common_name_pt': 'Tartaruga-cabeçuda',
                    'common_name_local': 'Tartaruga-grande',
                    'status': 'migratory',
                    'habitat': 'pelagic',
                    'conservation_status': 'VU',
                    'nesting_beaches': ['Cabo Ledo', 'Namibe', 'Tombwa']
                }
            ]
        }
        
        if group == 'all':
            all_species = []
            for group_data in species_data.values():
                all_species.extend(group_data)
            return all_species
        
        return species_data.get(group, [])


def main(argv: Optional[List[str]] = None) -> None:
    """Interface de linha de comando"""
    parser = argparse.ArgumentParser(
        description="Conector para fontes de dados marinhos angolanas"
    )
    parser.add_argument(
        "--source", 
        choices=['inip', 'uan_marine', 'minagrip', 'ina'], 
        default='inip',
        help="Fonte de dados"
    )
    parser.add_argument("--species", nargs='+', help="Espécies de interesse")
    parser.add_argument("--start", help="Data inicial (YYYY-MM-DD)")
    parser.add_argument("--end", help="Data final (YYYY-MM-DD)")
    parser.add_argument("--zone", choices=['norte', 'centro', 'sul'], help="Zona de pesca")
    parser.add_argument(
        "--type", 
        choices=['fisheries', 'oceanographic', 'checklist'], 
        default='fisheries',
        help="Tipo de dados"
    )
    parser.add_argument(
        "--out", 
        default=f"angola_data_{datetime.utcnow().strftime('%Y%m%d')}.json",
        help="Arquivo de saída"
    )
    
    args = parser.parse_args(argv)
    
    connector = AngolaDataConnector()
    
    if args.type == 'fisheries':
        data = connector.fetch_fisheries_data(
            source=args.source,
            species=args.species,
            start_date=args.start,
            end_date=args.end,
            zone=args.zone
        )
    elif args.type == 'oceanographic':
        data = connector.fetch_oceanographic_data(
            start_date=args.start,
            end_date=args.end
        )
    elif args.type == 'checklist':
        data = connector.get_species_checklist()
    else:
        data = []
    
    # Salvar dados
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Salvos {len(data)} registos em {args.out}")
    print(f"📊 Fonte: {connector.sources.get(args.source, {}).get('name', args.source)}")


if __name__ == "__main__":
    main(sys.argv[1:])
