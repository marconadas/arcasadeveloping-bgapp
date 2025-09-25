#!/usr/bin/env python3
"""
Gerador de Dados de Infraestruturas Pesqueiras de Angola
Cria dados geoespaciais para portos pesqueiros e vilas pescatórias
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Any, Tuple


class AngolaFisheriesInfrastructureGenerator:
    """Gerador de dados de infraestruturas pesqueiras angolanas"""
    
    def __init__(self):
        # Portos pesqueiros principais de Angola
        self.fishing_ports = {
            # ZONA NORTE (Cabinda - Luanda)
            'cabinda': {
                'name': 'Porto de Cabinda',
                'coordinates': [12.1848, -5.5550],
                'zone': 'zona_norte',
                'type': 'major_port',
                'capacity_boats': 150,
                'infrastructure': ['cold_storage', 'fuel_station', 'repair_yard', 'market'],
                'main_species': ['Thunnus albacares', 'Katsuwonus pelamis'],
                'fleet_types': ['industrial', 'artisanal'],
                'population': 8500,
                'facilities': {
                    'docking_capacity': 45,
                    'cold_storage_tons': 500,
                    'ice_production_daily': 15,
                    'fuel_tanks_liters': 50000,
                    'market_area_m2': 2500
                }
            },
            'soyo': {
                'name': 'Porto de Soyo',
                'coordinates': [12.3689, -6.1364],
                'zone': 'zona_norte', 
                'type': 'regional_port',
                'capacity_boats': 85,
                'infrastructure': ['cold_storage', 'fuel_station', 'market'],
                'main_species': ['Sardinella aurita', 'Thunnus albacares'],
                'fleet_types': ['semi_industrial', 'artisanal'],
                'population': 4200,
                'facilities': {
                    'docking_capacity': 25,
                    'cold_storage_tons': 200,
                    'ice_production_daily': 8,
                    'fuel_tanks_liters': 20000,
                    'market_area_m2': 1200
                }
            },
            'luanda': {
                'name': 'Porto de Luanda (Pesqueiro)',
                'coordinates': [13.2343, -8.8115],
                'zone': 'zona_norte',
                'type': 'major_port',
                'capacity_boats': 200,
                'infrastructure': ['cold_storage', 'fuel_station', 'repair_yard', 'market', 'processing_plant'],
                'main_species': ['Sardina pilchardus', 'Engraulis encrasicolus'],
                'fleet_types': ['industrial', 'semi_industrial', 'artisanal'],
                'population': 12000,
                'facilities': {
                    'docking_capacity': 60,
                    'cold_storage_tons': 800,
                    'ice_production_daily': 25,
                    'fuel_tanks_liters': 75000,
                    'market_area_m2': 4000,
                    'processing_capacity_daily': 50
                }
            },
            
            # ZONA CENTRO (Luanda - Lobito)
            'ambriz': {
                'name': 'Porto de Ambriz',
                'coordinates': [13.1167, -7.8500],
                'zone': 'zona_centro',
                'type': 'local_port',
                'capacity_boats': 45,
                'infrastructure': ['fuel_station', 'market'],
                'main_species': ['Sardina pilchardus', 'Scomber japonicus'],
                'fleet_types': ['artisanal'],
                'population': 2100,
                'facilities': {
                    'docking_capacity': 15,
                    'fuel_tanks_liters': 8000,
                    'market_area_m2': 600
                }
            },
            'lobito': {
                'name': 'Porto de Lobito (Pesqueiro)',
                'coordinates': [13.5500, -12.3500],
                'zone': 'zona_centro',
                'type': 'major_port',
                'capacity_boats': 180,
                'infrastructure': ['cold_storage', 'fuel_station', 'repair_yard', 'market', 'processing_plant'],
                'main_species': ['Sardina pilchardus', 'Engraulis encrasicolus', 'Scomber japonicus'],
                'fleet_types': ['industrial', 'semi_industrial', 'artisanal'],
                'population': 9500,
                'facilities': {
                    'docking_capacity': 55,
                    'cold_storage_tons': 600,
                    'ice_production_daily': 20,
                    'fuel_tanks_liters': 60000,
                    'market_area_m2': 3200,
                    'processing_capacity_daily': 40
                }
            },
            
            # ZONA SUL (Lobito - Cunene)
            'benguela': {
                'name': 'Porto de Benguela',
                'coordinates': [13.4058, -12.5763],
                'zone': 'zona_sul',
                'type': 'major_port',
                'capacity_boats': 160,
                'infrastructure': ['cold_storage', 'fuel_station', 'repair_yard', 'market'],
                'main_species': ['Merluccius capensis', 'Trachurus capensis'],
                'fleet_types': ['industrial', 'semi_industrial'],
                'population': 7800,
                'facilities': {
                    'docking_capacity': 50,
                    'cold_storage_tons': 550,
                    'ice_production_daily': 18,
                    'fuel_tanks_liters': 55000,
                    'market_area_m2': 2800
                }
            },
            'namibe': {
                'name': 'Porto de Namibe',
                'coordinates': [12.1528, -15.1944],
                'zone': 'zona_sul',
                'type': 'regional_port',
                'capacity_boats': 95,
                'infrastructure': ['cold_storage', 'fuel_station', 'market'],
                'main_species': ['Merluccius capensis', 'Dentex angolensis'],
                'fleet_types': ['industrial', 'semi_industrial'],
                'population': 5200,
                'facilities': {
                    'docking_capacity': 30,
                    'cold_storage_tons': 300,
                    'ice_production_daily': 12,
                    'fuel_tanks_liters': 35000,
                    'market_area_m2': 1800
                }
            },
            'tombwa': {
                'name': 'Porto de Tombwa',
                'coordinates': [11.9167, -15.7833],
                'zone': 'zona_sul',
                'type': 'regional_port',
                'capacity_boats': 75,
                'infrastructure': ['cold_storage', 'fuel_station', 'market'],
                'main_species': ['Merluccius capensis', 'Dentex angolensis'],
                'fleet_types': ['industrial', 'semi_industrial'],
                'population': 3800,
                'facilities': {
                    'docking_capacity': 25,
                    'cold_storage_tons': 250,
                    'ice_production_daily': 10,
                    'fuel_tanks_liters': 25000,
                    'market_area_m2': 1400
                }
            }
        }
        
        # Vilas pescatórias (comunidades costeiras menores)
        self.fishing_villages = {
            # ZONA NORTE
            'landana': {
                'name': 'Vila de Landana',
                'coordinates': [12.1167, -5.2500],
                'zone': 'zona_norte',
                'population': 1200,
                'main_activity': 'pesca_artisanal',
                'boats': 35,
                'infrastructure': ['market', 'boat_repair'],
                'access_road': True,
                'electricity': True,
                'water_supply': True,
                'school': True,
                'health_center': False
            },
            'cacongo': {
                'name': 'Vila de Cacongo',
                'coordinates': [12.2833, -5.5333],
                'zone': 'zona_norte',
                'population': 850,
                'main_activity': 'pesca_artisanal',
                'boats': 28,
                'infrastructure': ['market'],
                'access_road': True,
                'electricity': False,
                'water_supply': True,
                'school': True,
                'health_center': False
            },
            'mussulo': {
                'name': 'Vila do Mussulo',
                'coordinates': [13.2167, -8.9333],
                'zone': 'zona_norte',
                'population': 2100,
                'main_activity': 'pesca_artisanal',
                'boats': 65,
                'infrastructure': ['market', 'fuel_station'],
                'access_road': True,
                'electricity': True,
                'water_supply': True,
                'school': True,
                'health_center': True
            },
            
            # ZONA CENTRO
            'cabo_ledo': {
                'name': 'Vila do Cabo Ledo',
                'coordinates': [13.3000, -9.5500],
                'zone': 'zona_centro',
                'population': 950,
                'main_activity': 'pesca_artisanal',
                'boats': 32,
                'infrastructure': ['market'],
                'access_road': True,
                'electricity': False,
                'water_supply': True,
                'school': True,
                'health_center': False
            },
            'porto_amboim': {
                'name': 'Vila de Porto Amboim',
                'coordinates': [13.7667, -10.7167],
                'zone': 'zona_centro',
                'population': 3200,
                'main_activity': 'pesca_semi_industrial',
                'boats': 85,
                'infrastructure': ['market', 'fuel_station', 'cold_storage'],
                'access_road': True,
                'electricity': True,
                'water_supply': True,
                'school': True,
                'health_center': True
            },
            'sumbe': {
                'name': 'Vila do Sumbe',
                'coordinates': [13.8417, -11.2056],
                'zone': 'zona_centro',
                'population': 1800,
                'main_activity': 'pesca_artisanal',
                'boats': 52,
                'infrastructure': ['market', 'boat_repair'],
                'access_road': True,
                'electricity': True,
                'water_supply': True,
                'school': True,
                'health_center': False
            },
            
            # ZONA SUL
            'baia_azul': {
                'name': 'Vila da Baía Azul',
                'coordinates': [13.2500, -12.8000],
                'zone': 'zona_sul',
                'population': 1100,
                'main_activity': 'pesca_artisanal',
                'boats': 38,
                'infrastructure': ['market'],
                'access_road': True,
                'electricity': False,
                'water_supply': True,
                'school': True,
                'health_center': False
            },
            'baia_farta': {
                'name': 'Vila da Baía Farta',
                'coordinates': [13.3167, -12.5667],
                'zone': 'zona_sul',
                'population': 2500,
                'main_activity': 'pesca_semi_industrial',
                'boats': 72,
                'infrastructure': ['market', 'fuel_station', 'cold_storage'],
                'access_road': True,
                'electricity': True,
                'water_supply': True,
                'school': True,
                'health_center': True
            },
            'lucira': {
                'name': 'Vila de Lucira',
                'coordinates': [12.5333, -13.8500],
                'zone': 'zona_sul',
                'population': 1600,
                'main_activity': 'pesca_artisanal',
                'boats': 45,
                'infrastructure': ['market', 'boat_repair'],
                'access_road': True,
                'electricity': False,
                'water_supply': True,
                'school': True,
                'health_center': False
            },
            'bentiaba': {
                'name': 'Vila de Bentiaba',
                'coordinates': [12.0167, -15.3833],
                'zone': 'zona_sul',
                'population': 800,
                'main_activity': 'pesca_artisanal',
                'boats': 25,
                'infrastructure': ['market'],
                'access_road': False,
                'electricity': False,
                'water_supply': False,
                'school': False,
                'health_center': False
            }
        }
        
        # Infraestruturas complementares
        self.complementary_infrastructure = {
            'processing_plants': [
                {
                    'name': 'Fábrica de Conservas de Luanda',
                    'coordinates': [13.2500, -8.8200],
                    'zone': 'zona_norte',
                    'type': 'canning_factory',
                    'capacity_daily_tons': 25,
                    'products': ['canned_sardines', 'canned_tuna'],
                    'employees': 180
                },
                {
                    'name': 'Fábrica de Farinha de Peixe - Lobito',
                    'coordinates': [13.5600, -12.3600],
                    'zone': 'zona_centro',
                    'type': 'fishmeal_plant',
                    'capacity_daily_tons': 40,
                    'products': ['fishmeal', 'fish_oil'],
                    'employees': 85
                }
            ],
            'shipyards': [
                {
                    'name': 'Estaleiro Naval de Luanda',
                    'coordinates': [13.2400, -8.8050],
                    'zone': 'zona_norte',
                    'type': 'shipyard',
                    'capacity_boats': 15,
                    'services': ['construction', 'major_repair', 'maintenance'],
                    'employees': 120
                },
                {
                    'name': 'Estaleiro de Benguela',
                    'coordinates': [13.4100, -12.5800],
                    'zone': 'zona_sul',
                    'type': 'repair_yard',
                    'capacity_boats': 8,
                    'services': ['repair', 'maintenance'],
                    'employees': 45
                }
            ],
            'markets': [
                {
                    'name': 'Mercado do Peixe de Luanda',
                    'coordinates': [13.2320, -8.8130],
                    'zone': 'zona_norte',
                    'type': 'wholesale_market',
                    'area_m2': 5000,
                    'vendors': 150,
                    'daily_volume_tons': 80
                },
                {
                    'name': 'Mercado do Peixe de Lobito',
                    'coordinates': [13.5480, -12.3520],
                    'zone': 'zona_centro',
                    'type': 'wholesale_market',
                    'area_m2': 3500,
                    'vendors': 95,
                    'daily_volume_tons': 45
                }
            ]
        }
    
    def generate_ports_geojson(self) -> Dict[str, Any]:
        """Gerar GeoJSON para portos pesqueiros"""
        features = []
        
        for port_id, port_data in self.fishing_ports.items():
            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': port_data['coordinates']
                },
                'properties': {
                    'id': port_id,
                    'name': port_data['name'],
                    'zone': port_data['zone'],
                    'type': port_data['type'],
                    'capacity_boats': port_data['capacity_boats'],
                    'infrastructure': port_data['infrastructure'],
                    'main_species': port_data['main_species'],
                    'fleet_types': port_data['fleet_types'],
                    'population': port_data['population'],
                    'facilities': port_data['facilities'],
                    'category': 'fishing_port',
                    'importance': self._calculate_port_importance(port_data),
                    'last_updated': datetime.now().isoformat()
                }
            }
            features.append(feature)
        
        return {
            'type': 'FeatureCollection',
            'features': features,
            'metadata': {
                'title': 'Portos Pesqueiros de Angola',
                'description': 'Infraestruturas portuárias dedicadas à atividade pesqueira',
                'source': 'BGAPP Angola Fisheries Infrastructure Generator',
                'total_ports': len(features),
                'zones': ['zona_norte', 'zona_centro', 'zona_sul'],
                'generation_date': datetime.now().isoformat(),
                'coordinate_system': 'EPSG:4326'
            }
        }
    
    def generate_villages_geojson(self) -> Dict[str, Any]:
        """Gerar GeoJSON para vilas pescatórias"""
        features = []
        
        for village_id, village_data in self.fishing_villages.items():
            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': village_data['coordinates']
                },
                'properties': {
                    'id': village_id,
                    'name': village_data['name'],
                    'zone': village_data['zone'],
                    'population': village_data['population'],
                    'main_activity': village_data['main_activity'],
                    'boats': village_data['boats'],
                    'infrastructure': village_data['infrastructure'],
                    'access_road': village_data['access_road'],
                    'electricity': village_data['electricity'],
                    'water_supply': village_data['water_supply'],
                    'school': village_data['school'],
                    'health_center': village_data['health_center'],
                    'category': 'fishing_village',
                    'development_index': self._calculate_development_index(village_data),
                    'last_updated': datetime.now().isoformat()
                }
            }
            features.append(feature)
        
        return {
            'type': 'FeatureCollection',
            'features': features,
            'metadata': {
                'title': 'Vilas Pescatórias de Angola',
                'description': 'Comunidades costeiras dedicadas à atividade pesqueira',
                'source': 'BGAPP Angola Fisheries Infrastructure Generator',
                'total_villages': len(features),
                'zones': ['zona_norte', 'zona_centro', 'zona_sul'],
                'generation_date': datetime.now().isoformat(),
                'coordinate_system': 'EPSG:4326'
            }
        }
    
    def generate_infrastructure_geojson(self) -> Dict[str, Any]:
        """Gerar GeoJSON para infraestruturas complementares"""
        features = []
        
        # Fábricas de processamento
        for plant in self.complementary_infrastructure['processing_plants']:
            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': plant['coordinates']
                },
                'properties': {
                    **plant,
                    'category': 'processing_plant',
                    'last_updated': datetime.now().isoformat()
                }
            }
            features.append(feature)
        
        # Estaleiros
        for shipyard in self.complementary_infrastructure['shipyards']:
            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': shipyard['coordinates']
                },
                'properties': {
                    **shipyard,
                    'category': 'shipyard',
                    'last_updated': datetime.now().isoformat()
                }
            }
            features.append(feature)
        
        # Mercados
        for market in self.complementary_infrastructure['markets']:
            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': market['coordinates']
                },
                'properties': {
                    **market,
                    'category': 'fish_market',
                    'last_updated': datetime.now().isoformat()
                }
            }
            features.append(feature)
        
        return {
            'type': 'FeatureCollection',
            'features': features,
            'metadata': {
                'title': 'Infraestruturas Pesqueiras Complementares de Angola',
                'description': 'Fábricas, estaleiros e mercados de apoio à atividade pesqueira',
                'source': 'BGAPP Angola Fisheries Infrastructure Generator',
                'total_facilities': len(features),
                'categories': ['processing_plant', 'shipyard', 'fish_market'],
                'generation_date': datetime.now().isoformat(),
                'coordinate_system': 'EPSG:4326'
            }
        }
    
    def _calculate_port_importance(self, port_data: Dict) -> str:
        """Calcular importância do porto baseado em critérios"""
        score = 0
        
        # Capacidade de embarcações
        if port_data['capacity_boats'] >= 150:
            score += 3
        elif port_data['capacity_boats'] >= 100:
            score += 2
        else:
            score += 1
        
        # Infraestruturas disponíveis
        infrastructure_score = len(port_data['infrastructure'])
        score += min(infrastructure_score, 3)
        
        # Tipos de frota
        if 'industrial' in port_data['fleet_types']:
            score += 2
        if 'semi_industrial' in port_data['fleet_types']:
            score += 1
        
        # População
        if port_data['population'] >= 10000:
            score += 2
        elif port_data['population'] >= 5000:
            score += 1
        
        if score >= 8:
            return 'very_high'
        elif score >= 6:
            return 'high'
        elif score >= 4:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_development_index(self, village_data: Dict) -> float:
        """Calcular índice de desenvolvimento da vila (0-1)"""
        score = 0
        max_score = 6
        
        # Infraestruturas básicas
        if village_data['access_road']:
            score += 1
        if village_data['electricity']:
            score += 1
        if village_data['water_supply']:
            score += 1
        if village_data['school']:
            score += 1
        if village_data['health_center']:
            score += 1
        
        # Infraestruturas pesqueiras
        if len(village_data['infrastructure']) >= 2:
            score += 1
        
        return round(score / max_score, 2)
    
    def save_all_geojson_files(self, output_dir: str):
        """Salvar todos os arquivos GeoJSON"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Portos pesqueiros
        ports_geojson = self.generate_ports_geojson()
        ports_file = os.path.join(output_dir, 'fishing_ports_angola.geojson')
        with open(ports_file, 'w', encoding='utf-8') as f:
            json.dump(ports_geojson, f, ensure_ascii=False, indent=2)
        
        # Vilas pescatórias
        villages_geojson = self.generate_villages_geojson()
        villages_file = os.path.join(output_dir, 'fishing_villages_angola.geojson')
        with open(villages_file, 'w', encoding='utf-8') as f:
            json.dump(villages_geojson, f, ensure_ascii=False, indent=2)
        
        # Infraestruturas complementares
        infrastructure_geojson = self.generate_infrastructure_geojson()
        infrastructure_file = os.path.join(output_dir, 'fishing_infrastructure_angola.geojson')
        with open(infrastructure_file, 'w', encoding='utf-8') as f:
            json.dump(infrastructure_geojson, f, ensure_ascii=False, indent=2)
        
        # Arquivo consolidado
        consolidated_features = (
            ports_geojson['features'] + 
            villages_geojson['features'] + 
            infrastructure_geojson['features']
        )
        
        consolidated_geojson = {
            'type': 'FeatureCollection',
            'features': consolidated_features,
            'metadata': {
                'title': 'Infraestruturas Pesqueiras Consolidadas de Angola',
                'description': 'Conjunto completo de infraestruturas pesqueiras angolanas',
                'source': 'BGAPP Angola Fisheries Infrastructure Generator',
                'total_features': len(consolidated_features),
                'categories': ['fishing_port', 'fishing_village', 'processing_plant', 'shipyard', 'fish_market'],
                'zones': ['zona_norte', 'zona_centro', 'zona_sul'],
                'generation_date': datetime.now().isoformat(),
                'coordinate_system': 'EPSG:4326'
            }
        }
        
        consolidated_file = os.path.join(output_dir, 'fishing_all_infrastructure_angola.geojson')
        with open(consolidated_file, 'w', encoding='utf-8') as f:
            json.dump(consolidated_geojson, f, ensure_ascii=False, indent=2)
        
        return {
            'ports_file': ports_file,
            'villages_file': villages_file,
            'infrastructure_file': infrastructure_file,
            'consolidated_file': consolidated_file,
            'total_features': len(consolidated_features)
        }


def main():
    """Função principal"""
    print("🎣 Gerando dados de infraestruturas pesqueiras de Angola...")
    
    generator = AngolaFisheriesInfrastructureGenerator()
    
    # Diretórios de saída
    output_dirs = [
        '/Users/marcossantos/Library/CloudStorage/OneDrive-MareDatumConsultoriaeGestãodeProjectosUnipessoalLDA/Code/BGAPP/infra/pygeoapi/localdata',
        '/Users/marcossantos/Library/CloudStorage/OneDrive-MareDatumConsultoriaeGestãodeProjectosUnipessoalLDA/Code/BGAPP/configs'
    ]
    
    for output_dir in output_dirs:
        print(f"\n📁 Salvando em: {output_dir}")
        result = generator.save_all_geojson_files(output_dir)
        
        print(f"✅ Portos pesqueiros: {os.path.basename(result['ports_file'])}")
        print(f"✅ Vilas pescatórias: {os.path.basename(result['villages_file'])}")
        print(f"✅ Infraestruturas: {os.path.basename(result['infrastructure_file'])}")
        print(f"✅ Consolidado: {os.path.basename(result['consolidated_file'])}")
        print(f"📊 Total de features: {result['total_features']}")
    
    print(f"\n🌊 Dados gerados com sucesso!")
    print("🗺️  Zonas cobertas: Norte (Cabinda-Luanda), Centro (Luanda-Lobito), Sul (Lobito-Cunene)")
    print("🎯 Categorias: Portos, Vilas, Fábricas, Estaleiros, Mercados")


if __name__ == "__main__":
    main()
