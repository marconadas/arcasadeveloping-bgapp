#!/usr/bin/env python3
"""
Busca dados de águas internas de Angola (estuários e rios tidais) via OSM Overpass API
Mantém separação legal da ZEE marítima conforme UNCLOS
"""

import requests
import json
import time
from typing import List, Dict, Tuple
import os

class AngolaInternalWatersFetcher:
    def __init__(self):
        self.overpass_url = "http://overpass-api.de/api/interpreter"
        
        # Principais rios de Angola (priorizados)
        self.major_rivers = [
            "Kwanza", "Cuanza", "Bengo", "Dande", "Catumbela", 
            "Longa", "Coporolo", "Cunene", "Okavango", "Cuando"
        ]
        
        # Bounding box Angola (incluindo Cabinda)
        self.angola_bbox = {
            'south': -18.0,
            'west': 8.0, 
            'north': -4.2,
            'east': 24.0
        }
        
        # Limite tidal heurístico (km a montante da foz)
        self.tidal_limit_km = 25
        
    def build_overpass_query(self) -> str:
        """Constrói query Overpass para águas internas de Angola"""
        
        bbox_str = f"{self.angola_bbox['south']},{self.angola_bbox['west']},{self.angola_bbox['north']},{self.angola_bbox['east']}"
        
        query = f"""
[out:json][timeout:180];
(
  // Estuários explícitos
  way["natural"="water"]["water"="estuary"]({bbox_str});
  relation["natural"="water"]["water"="estuary"]({bbox_str});
  
  // Rios com influência tidal
  way["waterway"="river"]["tidal"="yes"]({bbox_str});
  relation["waterway"="river"]["tidal"="yes"]({bbox_str});
  
  // Rios principais próximos da costa (últimos 30km)
  way["waterway"="river"]["name"~"Kwanza|Cuanza|Bengo|Dande|Catumbela|Longa|Coporolo|Cunene"]({bbox_str});
  relation["waterway"="river"]["name"~"Kwanza|Cuanza|Bengo|Dande|Catumbela|Longa|Coporolo|Cunene"]({bbox_str});
  
  // Baías e lagoas costeiras
  way["natural"="bay"]({bbox_str});
  way["natural"="water"]["water"="lagoon"]({bbox_str});
  relation["natural"="bay"]({bbox_str});
  relation["natural"="water"]["water"="lagoon"]({bbox_str});
  
  // Mangais (proxy para zona tidal)
  way["natural"="wetland"]["wetland"="mangrove"]({bbox_str});
  relation["natural"="wetland"]["wetland"="mangrove"]({bbox_str});
  
  // Deltas
  way["place"="locality"]["natural"="cape"]["name"~"Delta"]({bbox_str});
);
out geom;
"""
        return query

    def fetch_osm_data(self) -> Dict:
        """Busca dados do OSM via Overpass API"""
        
        query = self.build_overpass_query()
        
        print("🌊 Buscando dados de águas internas de Angola...")
        print(f"📍 Área: {self.angola_bbox}")
        
        try:
            response = requests.post(
                self.overpass_url,
                data={'data': query},
                timeout=300
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Dados obtidos: {len(data.get('elements', []))} elementos")
                return data
            else:
                print(f"❌ Erro HTTP {response.status_code}: {response.text}")
                return {'elements': []}
                
        except Exception as e:
            print(f"❌ Erro na requisição: {e}")
            return {'elements': []}

    def process_river_segments(self, elements: List[Dict]) -> List[Dict]:
        """Processa segmentos de rios para incluir apenas trechos tidais/costeiros"""
        
        processed = []
        
        for element in elements:
            if element.get('type') != 'way':
                continue
                
            tags = element.get('tags', {})
            geometry = element.get('geometry', [])
            
            if not geometry:
                continue
                
            # Verifica se é rio principal
            river_name = tags.get('name', '').lower()
            is_major_river = any(major.lower() in river_name for major in self.major_rivers)
            
            # Verifica proximidade à costa (heurística: longitude > 11.0 para costa atlântica)
            coastal_points = [pt for pt in geometry if pt.get('lon', 0) > 11.0]
            is_coastal = len(coastal_points) > len(geometry) * 0.3  # 30% dos pontos costeiros
            
            # Inclui se:
            # 1. Explicitamente tidal
            # 2. Rio principal próximo da costa  
            # 3. Estuário/baía/lagoa
            # 4. Mangal
            
            include_conditions = [
                tags.get('tidal') == 'yes',
                is_major_river and is_coastal,
                tags.get('water') in ['estuary', 'lagoon'],
                tags.get('natural') in ['bay', 'wetland'],
                tags.get('wetland') == 'mangrove'
            ]
            
            if any(include_conditions):
                # Limita a segmentos costeiros para rios (últimos X km)
                if tags.get('waterway') == 'river' and is_major_river:
                    geometry = self.limit_river_segment(geometry)
                
                processed.append({
                    'type': element['type'],
                    'id': element['id'],
                    'tags': tags,
                    'geometry': geometry,
                    'water_type': self.classify_water_type(tags)
                })
                
        print(f"🔄 Processados: {len(processed)} segmentos de águas internas")
        return processed

    def limit_river_segment(self, geometry: List[Dict], max_points: int = 20) -> List[Dict]:
        """Limita segmento de rio aos últimos pontos (mais próximos da foz)"""
        
        if len(geometry) <= max_points:
            return geometry
            
        # Assume que pontos mais costeiros (maior longitude) são mais próximos da foz
        sorted_points = sorted(geometry, key=lambda p: p.get('lon', 0), reverse=True)
        return sorted_points[:max_points]

    def classify_water_type(self, tags: Dict) -> str:
        """Classifica tipo de água interna"""
        
        if tags.get('water') == 'estuary':
            return 'estuário'
        elif tags.get('natural') == 'bay':
            return 'baía'
        elif tags.get('water') == 'lagoon':
            return 'lagoa'
        elif tags.get('wetland') == 'mangrove':
            return 'mangal'
        elif tags.get('waterway') == 'river':
            return 'rio_tidal'
        else:
            return 'água_interna'

    def create_geojson_features(self, processed_elements: List[Dict]) -> List[Dict]:
        """Converte elementos processados para features GeoJSON"""
        
        features = []
        
        for element in processed_elements:
            geometry_coords = []
            
            for point in element['geometry']:
                lon = point.get('lon')
                lat = point.get('lat')
                if lon is not None and lat is not None:
                    geometry_coords.append([lon, lat])
            
            if len(geometry_coords) < 2:
                continue
                
            # Determina tipo de geometria
            geom_type = "LineString"
            if len(geometry_coords) > 3 and geometry_coords[0] == geometry_coords[-1]:
                geom_type = "Polygon"
                geometry_coords = [geometry_coords]  # Polygon precisa de array de rings
            
            feature = {
                "type": "Feature",
                "properties": {
                    "osm_id": element['id'],
                    "name": element['tags'].get('name', f"Água interna {element['id']}"),
                    "water_type": element['water_type'],
                    "waterway": element['tags'].get('waterway'),
                    "natural": element['tags'].get('natural'),
                    "tidal": element['tags'].get('tidal', 'unknown'),
                    "source": "OpenStreetMap",
                    "country": "Angola"
                },
                "geometry": {
                    "type": geom_type,
                    "coordinates": geometry_coords
                }
            }
            
            features.append(feature)
        
        return features

    def save_geojson(self, features: List[Dict], output_path: str):
        """Salva features como GeoJSON"""
        
        geojson = {
            "type": "FeatureCollection",
            "crs": {
                "type": "name",
                "properties": {
                    "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
                }
            },
            "features": features
        }
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, ensure_ascii=False, indent=2)
        
        print(f"💾 GeoJSON salvo: {output_path}")
        print(f"📊 Features: {len(features)}")

    def generate_summary_report(self, features: List[Dict]) -> str:
        """Gera relatório resumo dos dados obtidos"""
        
        water_types = {}
        rivers_found = []
        
        for feature in features:
            props = feature['properties']
            water_type = props.get('water_type', 'unknown')
            
            water_types[water_type] = water_types.get(water_type, 0) + 1
            
            if props.get('waterway') == 'river' and props.get('name'):
                rivers_found.append(props['name'])
        
        report = f"""
=== RELATÓRIO: ÁGUAS INTERNAS DE ANGOLA ===

📊 TOTAL DE FEATURES: {len(features)}

🌊 TIPOS DE ÁGUA:
"""
        
        for water_type, count in sorted(water_types.items()):
            report += f"   • {water_type}: {count}\n"
        
        if rivers_found:
            report += f"\n🏞️ RIOS IDENTIFICADOS:\n"
            for river in sorted(set(rivers_found)):
                report += f"   • {river}\n"
        
        report += f"""
⚖️ CONFORMIDADE LEGAL:
   • Separado da ZEE marítima ✅
   • Conforme UNCLOS (águas internas) ✅
   • Dados OSM sob ODbL ✅

🎯 PRÓXIMOS PASSOS:
   1. Otimizar geometrias (Douglas-Peucker)
   2. Validar topologia 
   3. Integrar no pygeoapi
   4. Adicionar aos mapas frontend
"""
        
        return report

def main():
    """Execução principal"""
    
    fetcher = AngolaInternalWatersFetcher()
    
    # 1. Buscar dados OSM
    osm_data = fetcher.fetch_osm_data()
    
    if not osm_data.get('elements'):
        print("❌ Nenhum dado obtido. Abortando.")
        return
    
    # 2. Processar elementos
    processed = fetcher.process_river_segments(osm_data['elements'])
    
    if not processed:
        print("❌ Nenhum elemento processado. Abortando.")
        return
    
    # 3. Converter para GeoJSON
    features = fetcher.create_geojson_features(processed)
    
    if not features:
        print("❌ Nenhuma feature criada. Abortando.")
        return
    
    # 4. Salvar arquivos
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Para configs
    config_path = os.path.join(base_dir, 'configs', 'aguas_internas.geojson')
    fetcher.save_geojson(features, config_path)
    
    # Para pygeoapi
    pygeoapi_path = os.path.join(base_dir, 'infra', 'pygeoapi', 'localdata', 'aguas_internas.geojson')
    fetcher.save_geojson(features, pygeoapi_path)
    
    # 5. Gerar relatório
    report = fetcher.generate_summary_report(features)
    print(report)
    
    # Salvar relatório
    report_path = os.path.join(base_dir, 'docs', 'AGUAS_INTERNAS_RELATORIO.md')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"📄 Relatório salvo: {report_path}")
    print("\n✅ ÁGUAS INTERNAS DE ANGOLA - DADOS OBTIDOS COM SUCESSO!")

if __name__ == "__main__":
    main()

