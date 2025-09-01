#!/usr/bin/env python3
"""
Otimizar linhas de costa separadas para uso web
"""

import json
import math
from pathlib import Path

def douglas_peucker(points, tolerance):
    """Algoritmo Douglas-Peucker para simplificação"""
    if len(points) <= 2:
        return points
    
    max_distance = 0
    max_index = 0
    
    start = points[0]
    end = points[-1]
    
    for i in range(1, len(points) - 1):
        distance = point_to_line_distance(points[i], start, end)
        if distance > max_distance:
            max_distance = distance
            max_index = i
    
    if max_distance > tolerance:
        left_points = douglas_peucker(points[:max_index + 1], tolerance)
        right_points = douglas_peucker(points[max_index:], tolerance)
        return left_points[:-1] + right_points
    else:
        return [start, end]

def point_to_line_distance(point, line_start, line_end):
    """Calcular distância perpendicular de ponto para linha"""
    x0, y0 = point
    x1, y1 = line_start
    x2, y2 = line_end
    
    numerator = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
    denominator = math.sqrt((y2 - y1)**2 + (x2 - x1)**2)
    
    return numerator / denominator if denominator != 0 else 0

def optimize_coastline(input_file, output_file, target_points, territory_name):
    """Otimizar linha de costa individual"""
    print(f"🔧 Otimizando {territory_name}...")
    
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    coords = data['features'][0]['geometry']['coordinates']
    original_count = len(coords)
    
    # Aplicar Douglas-Peucker
    tolerance = 0.001
    simplified = coords
    
    while len(simplified) > target_points and tolerance < 0.1:
        simplified = douglas_peucker(coords, tolerance)
        tolerance *= 1.2
    
    print(f"📊 {territory_name}: {original_count} → {len(simplified)} pontos")
    
    # Criar GeoJSON otimizado
    optimized = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {
                **data['features'][0]['properties'],
                "original_points": original_count,
                "optimized_points": len(simplified),
                "tolerance": tolerance
            },
            "geometry": {
                "type": "LineString",
                "coordinates": simplified
            }
        }]
    }
    
    with open(output_file, 'w') as f:
        json.dump(optimized, f, indent=2)
    
    return simplified

def main():
    """Função principal"""
    
    # Otimizar Cabinda (enclave menor, menos pontos)
    cabinda_coords = optimize_coastline(
        "../qgis_data/cabinda_coastline_separated.geojson",
        "../qgis_data/cabinda_coastline_web.geojson", 
        30,  # 30 pontos para Cabinda
        "Cabinda"
    )
    
    # Otimizar Angola Continental (território maior, mais pontos)
    angola_coords = optimize_coastline(
        "../qgis_data/angola_mainland_coastline_separated.geojson",
        "../qgis_data/angola_mainland_web.geojson",
        80,  # 80 pontos para Angola Continental
        "Angola Continental"
    )
    
    # Criar coordenadas Leaflet
    cabinda_leaflet = [[coord[1], coord[0]] for coord in cabinda_coords]
    angola_leaflet = [[coord[1], coord[0]] for coord in angola_coords]
    
    # Criar código JavaScript final
    js_final = f"""
// === LINHAS DE COSTA CORRIGIDAS - SEM COSTA DA RDC ===

// CABINDA (Enclave Norte) - {len(cabinda_coords)} pontos otimizados
const cabindaCoastline = {json.dumps(cabinda_leaflet, indent=2)};

// ANGOLA CONTINENTAL (Território Principal) - {len(angola_coords)} pontos otimizados
const angolaMainlandCoastline = {json.dumps(angola_leaflet, indent=2)};

// === ZEE SEPARADAS ===

// ZEE de Cabinda (enclave)
const cabindaZEE = [
  ...cabindaCoastline,
  // Limite oceânico Cabinda (200 milhas náuticas)
  {json.dumps([[coord[0], coord[1] - 3.3] for coord in reversed(cabinda_leaflet)], indent=2)[1:-1]},
  cabindaCoastline[0]  // Fechar polígono
];

// ZEE de Angola Continental  
const angolaMainlandZEE = [
  ...angolaMainlandCoastline,
  // Limite oceânico Angola Continental (200 milhas náuticas)
  {json.dumps([[coord[0], coord[1] - 3.3] for coord in reversed(angola_leaflet)], indent=2)[1:-1]},
  angolaMainlandCoastline[0]  // Fechar polígono
];

console.log('✅ Linhas de costa separadas carregadas');
console.log('⚠️ Não inclui costa da RDC entre Cabinda e Angola');
"""
    
    # Salvar código JavaScript
    js_file = Path("../qgis_data/corrected_coastlines_web.js")
    with open(js_file, 'w') as f:
        f.write(js_final)
    
    print(f"\n✅ Otimização completa!")
    print(f"📁 Código JavaScript: {js_file}")
    print(f"📊 Cabinda: {len(cabinda_coords)} pontos")
    print(f"📊 Angola: {len(angola_coords)} pontos")
    print(f"🎯 Total: {len(cabinda_coords) + len(angola_coords)} pontos (vs 12.961 originais)")

if __name__ == "__main__":
    main()
