#!/usr/bin/env python3
"""
Processar ZEE oficial de Angola do Marine Regions
Extrair coordenadas de alta qualidade para uso no realtime_angola.html
"""

import json
import math
from datetime import datetime

def process_official_zee():
    """Processar arquivo oficial da ZEE"""
    
    print("🇦🇴 PROCESSANDO ZEE OFICIAL DE ANGOLA")
    print("=" * 50)
    
    # Carregar dados oficiais
    with open('configs/zee_angola_official.geojson', 'r') as f:
        zee_data = json.load(f)
    
    print(f"✅ Arquivo carregado: {len(zee_data['features'])} features")
    
    # Extrair geometria principal
    main_feature = zee_data['features'][0]
    geometry = main_feature['geometry']
    
    print(f"📊 Tipo de geometria: {geometry['type']}")
    print(f"📊 Área oficial: {main_feature['properties']['area_km2']:,} km²")
    
    if geometry['type'] == 'MultiPolygon':
        # Processar cada polígono
        polygons = geometry['coordinates']
        print(f"📊 Número de polígonos: {len(polygons)}")
        
        # Encontrar o polígono principal (maior área)
        main_polygon = None
        cabinda_polygon = None
        max_area = 0
        
        for i, polygon in enumerate(polygons):
            # Calcular área aproximada
            coords = polygon[0]  # Exterior ring
            area = calculate_polygon_area(coords)
            
            print(f"   Polígono {i+1}: {len(coords)} pontos, área ~{area:.0f} km²")
            
            if area > max_area:
                max_area = area
                main_polygon = coords
            
            # Verificar se é Cabinda (polígono menor na região norte)
            if area < 100000:  # Menor que 100.000 km²
                center_lat = sum(coord[1] for coord in coords) / len(coords)
                center_lon = sum(coord[0] for coord in coords) / len(coords)
                
                # Se está na região de Cabinda (norte, próximo de -5°)
                if center_lat > -6 and center_lat < -4:
                    cabinda_polygon = coords
                    print(f"   🏛️ Cabinda encontrado: Polígono {i+1} (centro: {center_lat:.2f}, {center_lon:.2f})")
        
        return {
            'main_polygon': main_polygon,
            'cabinda_polygon': cabinda_polygon,
            'all_polygons': polygons,
            'metadata': main_feature['properties']
        }
    
    else:
        # Polígono simples
        coords = geometry['coordinates'][0]
        return {
            'main_polygon': coords,
            'cabinda_polygon': None,
            'all_polygons': [geometry['coordinates']],
            'metadata': main_feature['properties']
        }

def calculate_polygon_area(coords):
    """Calcular área de polígono usando fórmula de Shoelace"""
    n = len(coords)
    area = 0.0
    
    for i in range(n):
        j = (i + 1) % n
        area += coords[i][0] * coords[j][1]
        area -= coords[j][0] * coords[i][1]
    
    area = abs(area) / 2.0
    # Converter de graus² para km²
    return area * (111 * 111)

def optimize_coordinates(coords, target_points=100):
    """Otimizar coordenadas usando Douglas-Peucker"""
    
    def distance_point_to_line(point, line_start, line_end):
        x0, y0 = point
        x1, y1 = line_start
        x2, y2 = line_end
        
        if x1 == x2 and y1 == y2:
            return math.sqrt((x0 - x1)**2 + (y0 - y1)**2)
        
        A = y2 - y1
        B = x1 - x2
        C = x2*y1 - x1*y2
        
        return abs(A*x0 + B*y0 + C) / math.sqrt(A*A + B*B)
    
    def douglas_peucker(coords, epsilon):
        if len(coords) < 3:
            return coords
        
        max_dist = 0
        max_index = 0
        
        for i in range(1, len(coords) - 1):
            dist = distance_point_to_line(coords[i], coords[0], coords[-1])
            if dist > max_dist:
                max_dist = dist
                max_index = i
        
        if max_dist > epsilon:
            left_result = douglas_peucker(coords[:max_index+1], epsilon)
            right_result = douglas_peucker(coords[max_index:], epsilon)
            return left_result[:-1] + right_result
        else:
            return [coords[0], coords[-1]]
    
    # Ajustar epsilon para obter aproximadamente target_points
    epsilon = 0.01  # Começar com 0.01 graus
    optimized = douglas_peucker(coords, epsilon)
    
    # Ajustar epsilon se necessário
    iterations = 0
    while len(optimized) > target_points * 1.5 and iterations < 10:
        epsilon *= 1.5
        optimized = douglas_peucker(coords, epsilon)
        iterations += 1
    
    while len(optimized) < target_points * 0.5 and epsilon > 0.001 and iterations < 10:
        epsilon *= 0.7
        optimized = douglas_peucker(coords, epsilon)
        iterations += 1
    
    print(f"🎯 Otimização: {len(coords)} → {len(optimized)} pontos (epsilon: {epsilon:.4f})")
    return optimized

def generate_javascript_arrays(main_polygon, cabinda_polygon):
    """Gerar arrays JavaScript para uso no HTML"""
    
    # Otimizar coordenadas
    main_optimized = optimize_coordinates(main_polygon, 80)
    
    # Converter para formato [lat, lon]
    main_coords_js = []
    for coord in main_optimized:
        lon, lat = coord[0], coord[1]
        main_coords_js.append(f"[{lat:.6f}, {lon:.6f}]")
    
    main_coords_str = ',\n  '.join(main_coords_js)
    
    js_content = f"""
// === ANGOLA ZEE OFICIAL - MARINE REGIONS ===
// Fonte: Marine Regions (WFS eez_v11)
// Qualidade: OFICIAL/MÁXIMA
// Área: 495.866 km² (dados oficiais)
// Gerado: {datetime.now().isoformat()}

const angolaZEEOfficial = [
  {main_coords_str}
];
"""
    
    # Se Cabinda foi encontrado, adicionar separadamente
    if cabinda_polygon:
        cabinda_optimized = optimize_coordinates(cabinda_polygon, 50)
        cabinda_coords_js = []
        for coord in cabinda_optimized:
            lon, lat = coord[0], coord[1]
            cabinda_coords_js.append(f"[{lat:.6f}, {lon:.6f}]")
        
        cabinda_coords_str = ',\n  '.join(cabinda_coords_js)
        
        js_content += f"""
const cabindaZEEOfficial = [
  {cabinda_coords_str}
];
"""
    
    js_content += f"""
// Metadata oficial
const angolaZEEMetadata = {{
  source: "Marine Regions eez_v11",
  quality: "official",
  area_km2: 495866,
  mrgid: 8478,
  mainPolygonPoints: {len(main_optimized)},
  cabindaPolygonPoints: {len(cabinda_optimized) if cabinda_polygon else 0},
  generatedAt: "{datetime.now().isoformat()}"
}};

console.log("🌊 ZEE Oficial de Angola carregada:", angolaZEEMetadata);
"""
    
    return js_content

def main():
    """Função principal"""
    print("🌊 PROCESSADOR DE ZEE OFICIAL DE ANGOLA")
    print("=" * 55)
    
    # Processar dados oficiais
    zee_data = process_official_zee()
    
    # Gerar JavaScript
    print("\n🔄 Gerando arrays JavaScript...")
    js_content = generate_javascript_arrays(
        zee_data['main_polygon'], 
        zee_data['cabinda_polygon']
    )
    
    # Salvar arquivo JavaScript
    js_file = "infra/frontend/assets/js/zee_angola_official.js"
    with open(js_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"💾 JavaScript salvo: {js_file}")
    
    # Salvar GeoJSON processado
    processed_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [zee_data['main_polygon']]
                },
                "properties": {
                    **zee_data['metadata'],
                    "processed": True,
                    "optimized": True,
                    "source": "Marine Regions eez_v11",
                    "processed_at": datetime.now().isoformat()
                }
            }
        ]
    }
    
    if zee_data['cabinda_polygon']:
        processed_geojson['features'].append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon", 
                "coordinates": [zee_data['cabinda_polygon']]
            },
            "properties": {
                "name": "Cabinda EEZ",
                "enclave": True,
                "part_of": "Angola",
                "source": "Marine Regions eez_v11",
                "processed_at": datetime.now().isoformat()
            }
        })
    
    processed_file = "configs/zee_angola_processed.geojson"
    with open(processed_file, 'w', encoding='utf-8') as f:
        json.dump(processed_geojson, f, ensure_ascii=False, indent=2)
    
    print(f"💾 GeoJSON processado: {processed_file}")
    
    # Relatório final
    print("\n" + "=" * 55)
    print("📋 RELATÓRIO FINAL")
    print(f"✅ ZEE principal: {len(zee_data['main_polygon'])} pontos originais")
    print(f"✅ Cabinda: {'Encontrado' if zee_data['cabinda_polygon'] else 'Não encontrado'}")
    print(f"✅ Área oficial: {zee_data['metadata']['area_km2']:,} km²")
    print(f"✅ Fonte: Marine Regions (OFICIAL)")
    print(f"✅ Qualidade: MÁXIMA")
    
    print(f"\n🎯 PRÓXIMO PASSO:")
    print(f"   Atualizar realtime_angola.html para usar zee_angola_official.js")

if __name__ == "__main__":
    main()
