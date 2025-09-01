#!/usr/bin/env python3
"""
Obter linha de costa detalhada de Angola usando Overpass API
Extrai dados natural=coastline do OpenStreetMap com alta resolução
"""

import requests
import json
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DetailedCoastlineExtractor:
    """Extrator de linha de costa detalhada usando Overpass API"""
    
    def __init__(self):
        self.overpass_url = "http://overpass-api.de/api/interpreter"
        
        # Bounding box de Angola (expandido para incluir águas territoriais)
        self.angola_bbox = {
            'south': -18.5,
            'west': 11.5,
            'north': -4.0,
            'east': 14.0
        }
    
    def build_overpass_query(self):
        """Construir query Overpass para linha de costa de Angola"""
        bbox = f"{self.angola_bbox['south']},{self.angola_bbox['west']},{self.angola_bbox['north']},{self.angola_bbox['east']}"
        
        query = f"""
        [out:json][timeout:60];
        (
          way["natural"="coastline"]({bbox});
          relation["natural"="coastline"]({bbox});
        );
        out geom;
        """
        
        return query
    
    def fetch_coastline_data(self):
        """Obter dados da linha de costa via Overpass API"""
        logger.info("🌊 Obtendo dados detalhados da linha de costa via Overpass API...")
        
        query = self.build_overpass_query()
        
        try:
            response = requests.post(
                self.overpass_url,
                data=query,
                timeout=120
            )
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"✅ Obtidos {len(data.get('elements', []))} elementos da linha de costa")
            
            return data
            
        except requests.exceptions.Timeout:
            logger.error("❌ Timeout na Overpass API")
            return None
        except Exception as e:
            logger.error(f"❌ Erro ao obter dados Overpass: {e}")
            return None
    
    def convert_to_geojson(self, overpass_data):
        """Converter dados Overpass para GeoJSON"""
        logger.info("🔄 Convertendo para GeoJSON...")
        
        if not overpass_data or 'elements' not in overpass_data:
            logger.error("❌ Dados Overpass inválidos")
            return None
        
        features = []
        
        for element in overpass_data['elements']:
            if element['type'] == 'way' and 'geometry' in element:
                # Extrair coordenadas do way
                coordinates = []
                for node in element['geometry']:
                    coordinates.append([node['lon'], node['lat']])
                
                if len(coordinates) > 1:
                    feature = {
                        "type": "Feature",
                        "properties": {
                            "name": f"Angola Coastline Segment {element['id']}",
                            "source": "OSM Overpass API",
                            "osm_id": element['id'],
                            "natural": "coastline",
                            "points": len(coordinates)
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": coordinates
                        }
                    }
                    features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        logger.info(f"✅ Convertidos {len(features)} segmentos para GeoJSON")
        return geojson
    
    def merge_coastline_segments(self, geojson_data):
        """Unir segmentos da linha de costa numa linha contínua"""
        logger.info("🔗 Unindo segmentos da linha de costa...")
        
        if not geojson_data or not geojson_data.get('features'):
            return None
        
        all_coordinates = []
        
        # Extrair todas as coordenadas de todos os segmentos
        for feature in geojson_data['features']:
            coords = feature['geometry']['coordinates']
            all_coordinates.extend(coords)
        
        # Remover duplicados próximos
        unique_coords = []
        tolerance = 0.001  # ~100m
        
        for coord in all_coordinates:
            is_duplicate = False
            for existing in unique_coords:
                if (abs(coord[0] - existing[0]) < tolerance and 
                    abs(coord[1] - existing[1]) < tolerance):
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_coords.append(coord)
        
        # Ordenar por latitude (norte para sul)
        unique_coords.sort(key=lambda x: x[1], reverse=True)
        
        merged_geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {
                    "name": "Angola Coastline Detailed",
                    "source": "OSM Overpass API (merged)",
                    "total_points": len(unique_coords),
                    "precision": "high",
                    "extraction_date": "2025-01-31"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": unique_coords
                }
            }]
        }
        
        logger.info(f"✅ Linha de costa unificada com {len(unique_coords)} pontos")
        return merged_geojson
    
    def save_coastline_data(self, geojson_data, output_path):
        """Salvar dados da linha de costa"""
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(geojson_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Linha de costa salva em: {output_file}")
        return str(output_file)
    
    def process_angola_coastline(self):
        """Processar linha de costa completa de Angola"""
        logger.info("🚀 Iniciando extração detalhada da linha de costa de Angola...")
        
        # 1. Obter dados via Overpass API
        overpass_data = self.fetch_coastline_data()
        if not overpass_data:
            logger.error("❌ Falha ao obter dados Overpass")
            return None
        
        # 2. Converter para GeoJSON
        geojson_data = self.convert_to_geojson(overpass_data)
        if not geojson_data:
            logger.error("❌ Falha na conversão para GeoJSON")
            return None
        
        # 3. Salvar segmentos individuais
        segments_file = self.save_coastline_data(
            geojson_data, 
            "../qgis_data/angola_coastline_segments.geojson"
        )
        
        # 4. Unir segmentos
        merged_data = self.merge_coastline_segments(geojson_data)
        if merged_data:
            merged_file = self.save_coastline_data(
                merged_data,
                "../qgis_data/angola_coastline_detailed.geojson"
            )
        
        logger.info("🎉 Processamento completo!")
        
        return {
            'segments_file': segments_file,
            'merged_file': merged_file if merged_data else None,
            'total_segments': len(geojson_data['features']),
            'total_points': len(merged_data['features'][0]['geometry']['coordinates']) if merged_data else 0
        }

def main():
    """Função principal"""
    extractor = DetailedCoastlineExtractor()
    
    try:
        results = extractor.process_angola_coastline()
        
        if results:
            print("\n🎯 Extração completa!")
            print(f"📁 Segmentos: {results['segments_file']}")
            print(f"📁 Linha unificada: {results['merged_file']}")
            print(f"📊 Total segmentos: {results['total_segments']}")
            print(f"📊 Total pontos: {results['total_points']}")
            print("\n📋 Próximos passos:")
            print("1. Abrir arquivos no QGIS para validação")
            print("2. Comparar com imagens de satélite")
            print("3. Atualizar aplicação web com dados detalhados")
        else:
            print("❌ Falha na extração. Verificar conectividade e tentar novamente.")
            
    except Exception as e:
        logger.error(f"❌ Erro geral: {e}")

if __name__ == "__main__":
    main()
