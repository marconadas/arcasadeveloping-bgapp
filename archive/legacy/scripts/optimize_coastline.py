#!/usr/bin/env python3
"""
Otimizar linha de costa detalhada para uso web
Simplifica mantendo precisão geográfica adequada
"""

import json
import math
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CoastlineOptimizer:
    """Otimizador de linha de costa para aplicações web"""
    
    def __init__(self, tolerance=0.001):
        self.tolerance = tolerance  # ~100m de tolerância
    
    def douglas_peucker(self, points, tolerance):
        """Algoritmo Douglas-Peucker para simplificação de linha"""
        if len(points) <= 2:
            return points
        
        # Encontrar ponto mais distante da linha entre primeiro e último
        max_distance = 0
        max_index = 0
        
        start = points[0]
        end = points[-1]
        
        for i in range(1, len(points) - 1):
            distance = self.point_to_line_distance(points[i], start, end)
            if distance > max_distance:
                max_distance = distance
                max_index = i
        
        # Se distância máxima > tolerância, dividir recursivamente
        if max_distance > tolerance:
            left_points = self.douglas_peucker(points[:max_index + 1], tolerance)
            right_points = self.douglas_peucker(points[max_index:], tolerance)
            
            return left_points[:-1] + right_points
        else:
            return [start, end]
    
    def point_to_line_distance(self, point, line_start, line_end):
        """Calcular distância perpendicular de ponto para linha"""
        x0, y0 = point
        x1, y1 = line_start  
        x2, y2 = line_end
        
        # Fórmula da distância ponto-linha
        numerator = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
        denominator = math.sqrt((y2 - y1)**2 + (x2 - x1)**2)
        
        return numerator / denominator if denominator != 0 else 0
    
    def optimize_for_web(self, input_file, output_file, target_points=200):
        """Otimizar linha de costa para uso web"""
        logger.info(f"🔧 Otimizando linha de costa para {target_points} pontos...")
        
        # Carregar dados detalhados
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        original_coords = data['features'][0]['geometry']['coordinates']
        original_count = len(original_coords)
        
        logger.info(f"📊 Pontos originais: {original_count}")
        
        # Aplicar Douglas-Peucker iterativamente até atingir target
        tolerance = self.tolerance
        simplified_coords = original_coords
        
        while len(simplified_coords) > target_points and tolerance < 0.1:
            simplified_coords = self.douglas_peucker(original_coords, tolerance)
            tolerance *= 1.5  # Aumentar tolerância gradualmente
            
        logger.info(f"📉 Pontos otimizados: {len(simplified_coords)} (tolerância: {tolerance:.4f})")
        
        # Criar GeoJSON otimizado
        optimized_data = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {
                    "name": "Angola Coastline Optimized",
                    "source": "OSM Overpass API + Douglas-Peucker",
                    "original_points": original_count,
                    "optimized_points": len(simplified_coords),
                    "tolerance": tolerance,
                    "precision": "web-optimized",
                    "optimization_date": "2025-01-31"
                },
                "geometry": {
                    "type": "LineString", 
                    "coordinates": simplified_coords
                }
            }]
        }
        
        # Salvar arquivo otimizado
        with open(output_file, 'w') as f:
            json.dump(optimized_data, f, indent=2)
        
        logger.info(f"✅ Linha de costa otimizada salva: {output_file}")
        
        return {
            'original_points': original_count,
            'optimized_points': len(simplified_coords),
            'reduction_ratio': len(simplified_coords) / original_count,
            'tolerance_used': tolerance,
            'output_file': str(output_file)
        }
    
    def create_web_ready_coordinates(self, geojson_file):
        """Criar coordenadas prontas para JavaScript"""
        with open(geojson_file, 'r') as f:
            data = json.load(f)
        
        coords = data['features'][0]['geometry']['coordinates']
        
        # Converter para formato Leaflet [lat, lon]
        leaflet_coords = [[coord[1], coord[0]] for coord in coords]
        
        # Criar código JavaScript
        js_code = f"""
// === LINHA DE COSTA REAL DE ANGOLA - {len(coords)} pontos ===
// Extraída do OSM via Overpass API e otimizada com Douglas-Peucker
const angolaDetailedCoastline = {json.dumps(leaflet_coords, indent=2)};

console.log('📍 Linha de costa carregada:', angolaDetailedCoastline.length, 'pontos');
"""
        
        # Salvar código JavaScript
        js_file = Path("../qgis_data/angola_coastline_web.js")
        with open(js_file, 'w') as f:
            f.write(js_code)
        
        logger.info(f"📝 Código JavaScript criado: {js_file}")
        
        return leaflet_coords

def main():
    """Função principal"""
    optimizer = CoastlineOptimizer(tolerance=0.002)  # ~200m tolerância
    
    input_file = "../qgis_data/angola_coastline_detailed.geojson"
    output_file = "../qgis_data/angola_coastline_web_optimized.geojson"
    
    if not Path(input_file).exists():
        logger.error(f"❌ Arquivo não encontrado: {input_file}")
        return
    
    # Otimizar para web
    results = optimizer.optimize_for_web(input_file, output_file, target_points=300)
    
    print(f"\n🎯 Otimização completa!")
    print(f"📊 Pontos originais: {results['original_points']:,}")
    print(f"📊 Pontos otimizados: {results['optimized_points']}")
    print(f"📈 Redução: {(1-results['reduction_ratio'])*100:.1f}%")
    print(f"📏 Tolerância: {results['tolerance_used']:.4f}° (~{results['tolerance_used']*111:.0f}m)")
    
    # Criar coordenadas para web
    optimizer.create_web_ready_coordinates(output_file)
    
    print("\n✅ Linha de costa otimizada e pronta para web!")

if __name__ == "__main__":
    main()
