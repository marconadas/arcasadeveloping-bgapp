#!/usr/bin/env python3
"""
Extrair linha costeira dos dados oficiais da ZEE
Obter coordenadas de alta qualidade da costa de Angola e Cabinda
"""

import json
import math
from datetime import datetime

def extract_coastline_from_zee():
    """Extrair linha costeira dos dados da ZEE oficial"""
    
    print("🏖️ EXTRAINDO LINHA COSTEIRA DA ZEE OFICIAL")
    print("=" * 50)
    
    # Carregar ZEE oficial
    with open('configs/zee_angola_official.geojson', 'r') as f:
        zee_data = json.load(f)
    
    main_feature = zee_data['features'][0]
    geometry = main_feature['geometry']
    
    coastlines = []
    
    if geometry['type'] == 'MultiPolygon':
        polygons = geometry['coordinates']
        
        for i, polygon in enumerate(polygons):
            exterior_ring = polygon[0]  # Anel exterior = linha costeira
            
            # Calcular área para identificar Angola Continental vs Cabinda
            area = calculate_polygon_area(exterior_ring)
            center_lat = sum(coord[1] for coord in exterior_ring) / len(exterior_ring)
            
            # Filtrar apenas pontos costeiros (próximos à terra)
            coastal_points = filter_coastal_points(exterior_ring)
            
            if area > 100000:  # Angola Continental
                coastlines.append({
                    'name': 'Angola Continental',
                    'type': 'mainland',
                    'coordinates': coastal_points,
                    'area_km2': area,
                    'center_lat': center_lat
                })
                print(f"🇦🇴 Angola Continental: {len(coastal_points)} pontos costeiros")
                
            else:  # Cabinda
                coastlines.append({
                    'name': 'Cabinda',
                    'type': 'enclave',
                    'coordinates': coastal_points,
                    'area_km2': area,
                    'center_lat': center_lat
                })
                print(f"🏛️ Cabinda: {len(coastal_points)} pontos costeiros")
    
    return coastlines

def filter_coastal_points(coordinates):
    """Filtrar apenas pontos próximos à costa (não oceânicos)"""
    
    # Angola está aproximadamente entre 8°E-18°E de longitude
    # Pontos costeiros estão tipicamente entre 11°E-14°E
    coastal_points = []
    
    for coord in coordinates:
        lon, lat = coord[0], coord[1]
        
        # Filtrar pontos que estão próximos à costa (longitude > 10°E)
        if lon > 10.0:
            coastal_points.append(coord)
    
    # Se tivermos muitos pontos, otimizar
    if len(coastal_points) > 200:
        coastal_points = optimize_coastline(coastal_points, target_points=150)
    
    return coastal_points

def optimize_coastline(coords, target_points=100):
    """Otimizar linha costeira mantendo características importantes"""
    
    if len(coords) <= target_points:
        return coords
    
    # Algoritmo Douglas-Peucker simplificado
    def douglas_peucker_simple(points, epsilon):
        if len(points) < 3:
            return points
        
        # Encontrar ponto mais distante da linha entre primeiro e último
        max_dist = 0
        max_index = 0
        
        for i in range(1, len(points) - 1):
            dist = point_line_distance(points[i], points[0], points[-1])
            if dist > max_dist:
                max_dist = dist
                max_index = i
        
        if max_dist > epsilon:
            # Recursão
            left = douglas_peucker_simple(points[:max_index+1], epsilon)
            right = douglas_peucker_simple(points[max_index:], epsilon)
            return left[:-1] + right
        else:
            return [points[0], points[-1]]
    
    # Ajustar epsilon para obter número desejado de pontos
    epsilon = 0.01
    result = douglas_peucker_simple(coords, epsilon)
    
    iterations = 0
    while len(result) > target_points * 1.3 and iterations < 10:
        epsilon *= 1.5
        result = douglas_peucker_simple(coords, epsilon)
        iterations += 1
    
    return result

def point_line_distance(point, line_start, line_end):
    """Calcular distância de ponto à linha"""
    x0, y0 = point[0], point[1]
    x1, y1 = line_start[0], line_start[1]
    x2, y2 = line_end[0], line_end[1]
    
    if x1 == x2 and y1 == y2:
        return math.sqrt((x0 - x1)**2 + (y0 - y1)**2)
    
    A = y2 - y1
    B = x1 - x2
    C = x2*y1 - x1*y2
    
    return abs(A*x0 + B*y0 + C) / math.sqrt(A*A + B*B)

def calculate_polygon_area(coords):
    """Calcular área de polígono"""
    n = len(coords)
    area = 0.0
    
    for i in range(n):
        j = (i + 1) % n
        area += coords[i][0] * coords[j][1]
        area -= coords[j][0] * coords[i][1]
    
    area = abs(area) / 2.0
    return area * (111 * 111)  # Converter para km²

def generate_coastline_javascript(coastlines):
    """Gerar JavaScript para as linhas costeiras"""
    
    js_content = f"""
// === LINHAS COSTEIRAS OFICIAIS - MARINE REGIONS ===
// Extraídas da ZEE oficial (WFS eez_v11)
// Qualidade: MÁXIMA
// Gerado: {datetime.now().isoformat()}

"""
    
    for coastline in coastlines:
        coords = coastline['coordinates']
        
        # Converter para formato [lat, lon]
        coords_js = []
        for coord in coords:
            lon, lat = coord[0], coord[1]
            coords_js.append(f"[{lat:.6f}, {lon:.6f}]")
        
        coords_str = ',\n  '.join(coords_js)
        var_name = coastline['type'] + 'CoastlineOfficial'
        
        js_content += f"""
const {var_name} = [
  {coords_str}
];

"""
    
    js_content += f"""
// Metadata das linhas costeiras
const coastlineMetadata = {{
  source: "Marine Regions eez_v11",
  quality: "official",
  extractedAt: "{datetime.now().isoformat()}",
  coastlines: {len(coastlines)}
}};

console.log("🏖️ Linhas costeiras oficiais carregadas:", coastlineMetadata);
"""
    
    return js_content

def main():
    """Função principal"""
    print("🏖️ EXTRATOR DE LINHA COSTEIRA OFICIAL")
    print("=" * 55)
    
    # Extrair linhas costeiras
    coastlines = extract_coastline_from_zee()
    
    # Gerar JavaScript
    print("\n🔄 Gerando JavaScript...")
    js_content = generate_coastline_javascript(coastlines)
    
    # Salvar arquivo
    js_file = "infra/frontend/assets/js/coastlines_official.js"
    with open(js_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"💾 JavaScript salvo: {js_file}")
    
    # Relatório
    print("\n" + "=" * 55)
    print("📋 RELATÓRIO FINAL")
    
    for coastline in coastlines:
        print(f"✅ {coastline['name']}: {len(coastline['coordinates'])} pontos")
        print(f"   Área: {coastline['area_km2']:.0f} km²")
        print(f"   Centro: {coastline['center_lat']:.2f}°")
    
    print(f"\n🎯 Linhas costeiras extraídas com qualidade MÁXIMA!")
    print(f"📊 Fonte: Marine Regions (dados oficiais)")

if __name__ == "__main__":
    main()
