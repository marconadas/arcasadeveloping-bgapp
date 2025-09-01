#!/usr/bin/env python3
"""
Teste final da qualidade da linha costeira de Cabinda
Validar se as correções foram aplicadas corretamente
"""

import json
import math
from datetime import datetime

def test_cabinda_quality():
    """Testar qualidade final da linha costeira de Cabinda"""
    
    print("🎯 TESTE FINAL - CABINDA QUALIDADE MÁXIMA")
    print("=" * 55)
    
    # Carregar dados de alta qualidade
    try:
        with open('configs/cabinda_coastline_high_quality.geojson', 'r') as f:
            coastline_data = json.load(f)
        
        coords = coastline_data['features'][0]['geometry']['coordinates']
        # Converter de [lon, lat] para [lat, lon]
        coords = [[lat, lon] for lon, lat in coords]
        
        print(f"✅ Dados carregados: {len(coords)} pontos")
        
    except FileNotFoundError:
        print("❌ Arquivo de alta qualidade não encontrado")
        return
    
    # Análise geográfica
    lats = [coord[0] for coord in coords]
    lons = [coord[1] for coord in coords]
    
    lat_min, lat_max = min(lats), max(lats)
    lon_min, lon_max = min(lons), max(lons)
    
    print(f"\n📊 ANÁLISE GEOGRÁFICA:")
    print(f"   Latitude:    {lat_min:.4f}° a {lat_max:.4f}°")
    print(f"   Longitude:   {lon_min:.4f}° a {lon_max:.4f}°")
    print(f"   Extensão:    {abs(lat_max-lat_min):.4f}° lat x {abs(lon_max-lon_min):.4f}° lon")
    
    # Calcular área usando fórmula de Shoelace
    def calculate_area(coordinates):
        n = len(coordinates)
        area = 0.0
        for i in range(n):
            j = (i + 1) % n
            area += coordinates[i][0] * coordinates[j][1]
            area -= coordinates[j][0] * coordinates[i][1]
        area = abs(area) / 2.0
        return area * (111 * 111)  # Converter para km²
    
    area_km2 = calculate_area(coords)
    print(f"   Área:        {area_km2:.0f} km²")
    
    # Pontos de referência geográfica
    referencias = {
        'pointe_noire': [-4.7974, 11.8639],
        'cabinda_city': [-5.5500, 12.2000],
        'soyo': [-6.1364, 12.3689]
    }
    
    print(f"\n🏙️ DISTÂNCIAS A CIDADES DE REFERÊNCIA:")
    for cidade, ref_coord in referencias.items():
        # Encontrar ponto mais próximo na costa
        min_dist = float('inf')
        for coord in coords:
            dist = math.sqrt((coord[0] - ref_coord[0])**2 + (coord[1] - ref_coord[1])**2) * 111
            min_dist = min(min_dist, dist)
        
        print(f"   {cidade.replace('_', ' ').title()}: {min_dist:.1f} km")
    
    # Validações técnicas
    validations = []
    
    # 1. Tamanho do enclave
    if 6000 <= area_km2 <= 8000:
        validations.append(f"✅ Área realista: {area_km2:.0f} km² (real: ~7.270 km²)")
    else:
        validations.append(f"⚠️ Área: {area_km2:.0f} km² (real: ~7.270 km²)")
    
    # 2. Posição geográfica
    if -6.0 <= lat_min <= -4.0 and 10.0 <= lon_min <= 13.0:
        validations.append("✅ Posição geográfica correta")
    else:
        validations.append("❌ Posição geográfica incorreta")
    
    # 3. Extensão do enclave
    lat_extent = abs(lat_max - lat_min)
    lon_extent = abs(lon_max - lon_min)
    
    if 1.0 <= lat_extent <= 2.0 and 1.5 <= lon_extent <= 3.0:
        validations.append(f"✅ Extensão adequada: {lat_extent:.2f}° x {lon_extent:.2f}°")
    else:
        validations.append(f"⚠️ Extensão: {lat_extent:.2f}° x {lon_extent:.2f}°")
    
    # 4. Densidade de pontos
    if len(coords) >= 50:
        validations.append(f"✅ Alta densidade: {len(coords)} pontos")
    else:
        validations.append(f"⚠️ Baixa densidade: {len(coords)} pontos")
    
    # 5. Fronteiras com RDC
    norte_ok = lat_max <= -4.35  # Não deve passar muito ao norte
    sul_ok = lat_min >= -5.85    # Não deve passar muito ao sul
    
    if norte_ok and sul_ok:
        validations.append("✅ Fronteiras com RDC respeitadas")
    else:
        validations.append("⚠️ Fronteiras com RDC podem estar incorretas")
    
    print(f"\n✅ VALIDAÇÕES FINAIS:")
    for validation in validations:
        print(f"   {validation}")
    
    # Comparação com área real
    real_area = 7270
    accuracy = 100 - abs(area_km2 - real_area) / real_area * 100
    
    print(f"\n📏 PRECISÃO:")
    print(f"   Área real:      {real_area:,} km²")
    print(f"   Área calculada: {area_km2:.0f} km²")
    print(f"   Precisão:       {accuracy:.1f}%")
    
    # Status final
    failed = len([v for v in validations if '❌' in v])
    warnings = len([v for v in validations if '⚠️' in v])
    
    if failed == 0 and warnings <= 1:
        status = "EXCELENTE"
        emoji = "🎉"
    elif failed == 0:
        status = "BOM"
        emoji = "✅"
    else:
        status = "PRECISA MELHORIAS"
        emoji = "⚠️"
    
    print(f"\n{emoji} RESULTADO FINAL: {status}")
    
    if status == "EXCELENTE":
        print("🏛️ Cabinda está representado com qualidade máxima!")
        print("✅ Fronteiras corretas, área precisa, enclave respeitado")
    
    return {
        'status': status,
        'area_km2': area_km2,
        'accuracy': accuracy,
        'points': len(coords),
        'validations': validations
    }

def main():
    """Função principal"""
    result = test_cabinda_quality()
    
    # Salvar relatório
    with open('logs/cabinda_quality_final_test.json', 'w', encoding='utf-8') as f:
        json.dump({
            **result,
            'timestamp': datetime.now().isoformat(),
            'test_type': 'final_quality_validation'
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 Relatório salvo: logs/cabinda_quality_final_test.json")

if __name__ == "__main__":
    main()
