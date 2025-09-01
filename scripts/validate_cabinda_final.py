#!/usr/bin/env python3
"""
Validação final das fronteiras corrigidas de Cabinda
Verifica se as coordenadas correspondem à geografia real
"""

import json
import math
from datetime import datetime

def calculate_area_km2(coordinates):
    """Calcular área aproximada usando fórmula de shoelace"""
    n = len(coordinates)
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += coordinates[i][0] * coordinates[j][1]
        area -= coordinates[j][0] * coordinates[i][1]
    area = abs(area) / 2.0
    
    # Converter de graus² para km² (aproximação)
    # 1 grau ≈ 111 km no equador
    area_km2 = area * (111 * 111)
    return area_km2

def validate_cabinda_final():
    """Validar as coordenadas finais corrigidas de Cabinda"""
    
    # Coordenadas corrigidas finais de Cabinda - Tamanho real ~7.270 km²
    cabinda_coastline = [
        [-4.3800, 12.3600],    # Fronteira Norte com RDC
        [-4.4200, 12.4200],    # Costa Nordeste
        [-4.4800, 12.5000],    # Costa Leste-Norte (mais extenso)
        [-4.5200, 12.5400],    # Costa Leste máxima
        [-4.5600, 12.5600],    # Costa Leste-Central
        [-4.6000, 12.5400],    # Costa Central-Leste
        [-4.6400, 12.5000],    # Costa Central
        [-4.6800, 12.4600],    # Costa Central-Sul
        [-4.7200, 12.4200],    # Costa Sul-Central
        [-4.7600, 12.3800],    # Costa Sul
        [-4.8000, 12.3400],    # Costa Sul-Sudoeste
        [-4.8400, 12.3000],    # Costa Sudoeste
        [-4.8800, 12.2600],    # Costa Oeste-Sul
        [-4.9200, 12.2200],    # Costa Oeste
        [-4.9600, 12.1800],    # Costa Oeste-Norte
        [-5.0000, 12.1400],    # Costa Noroeste
        [-5.0400, 12.1000],    # Costa Norte-Oeste
        [-5.0800, 12.0600],    # Aproximação fronteira
        [-5.1200, 12.0200],    # Fronteira interior
        [-5.1600, 11.9800],    # Fronteira Sul interior
        [-5.2000, 11.9400],    # Fronteira Sul com RDC (Rio Chiloango)
        [-5.2200, 11.9200]     # Ponto final fronteira sul
    ]
    
    # Angola Continental início
    angola_start = [-5.9200, 12.3800]
    
    print("🗺️ VALIDAÇÃO FINAL - CABINDA GEOGRAFICAMENTE CORRETO")
    print("=" * 65)
    
    # Calcular limites
    lats = [coord[0] for coord in cabinda_coastline]
    lons = [coord[1] for coord in cabinda_coastline]
    
    lat_min, lat_max = min(lats), max(lats)
    lon_min, lon_max = min(lons), max(lons)
    
    # Calcular área aproximada
    area_km2 = calculate_area_km2(cabinda_coastline)
    
    print(f"\n📍 COORDENADAS DE CABINDA:")
    print(f"   Fronteira Norte:  {cabinda_coastline[0]} (próximo Pointe-Noire)")
    print(f"   Fronteira Sul:    {cabinda_coastline[-1]} (Rio Chiloango)")
    print(f"   Total pontos:     {len(cabinda_coastline)}")
    
    print(f"\n📊 DIMENSÕES GEOGRÁFICAS:")
    print(f"   Latitude:    {lat_min:.4f}° a {lat_max:.4f}°")
    print(f"   Longitude:   {lon_min:.4f}° a {lon_max:.4f}°")
    print(f"   Extensão:    {abs(lat_max - lat_min):.4f}° lat x {abs(lon_max - lon_min):.4f}° lon")
    print(f"   Área aprox:  {area_km2:.0f} km² (real: ~7.270 km²)")
    
    # Gap com Angola Continental
    cabinda_sul_lat = cabinda_coastline[-1][0]
    angola_norte_lat = angola_start[0]
    gap_degrees = abs(angola_norte_lat - cabinda_sul_lat)
    gap_km = gap_degrees * 111
    
    print(f"\n🌊 GAP ENTRE CABINDA E ANGOLA:")
    print(f"   Cabinda Sul:      {cabinda_sul_lat:.4f}°")
    print(f"   Angola Norte:     {angola_norte_lat:.4f}°")
    print(f"   Gap:              {gap_degrees:.4f}° ({gap_km:.1f} km)")
    
    # Coordenadas de referência real
    pointe_noire_real = [-4.7974, 11.8639]  # Pointe-Noire, RDC
    cabinda_city_real = [-5.5500, 12.2000]  # Cidade de Cabinda
    
    # Distâncias para validação
    cabinda_norte = cabinda_coastline[0]
    dist_pointe_noire = math.sqrt(
        (cabinda_norte[0] - pointe_noire_real[0])**2 + 
        (cabinda_norte[1] - pointe_noire_real[1])**2
    ) * 111
    
    # Verificar se a cidade de Cabinda está dentro do polígono (aproximadamente)
    cabinda_city_inside = (
        lat_min <= cabinda_city_real[0] <= lat_max and
        lon_min <= cabinda_city_real[1] <= lon_max
    )
    
    print(f"\n🏙️ VALIDAÇÃO COM CIDADES REAIS:")
    print(f"   Distância Pointe-Noire: {dist_pointe_noire:.1f} km")
    print(f"   Cidade Cabinda dentro:  {'✅ SIM' if cabinda_city_inside else '❌ NÃO'}")
    
    # Validações finais
    validations = []
    
    # 1. Área realista
    if 5000 <= area_km2 <= 10000:
        validations.append(f"✅ Área realista: {area_km2:.0f} km² (próximo dos 7.270 km² reais)")
    else:
        validations.append(f"⚠️ Área pode estar incorreta: {area_km2:.0f} km²")
    
    # 2. Posição geográfica
    if -5.5 <= lat_min <= -4.0 and 11.8 <= lon_min <= 12.8:
        validations.append("✅ Posição geográfica correta")
    else:
        validations.append("❌ Posição geográfica incorreta")
    
    # 3. Gap com Angola
    if 50 <= gap_km <= 100:
        validations.append(f"✅ Gap adequado com Angola: {gap_km:.1f} km")
    else:
        validations.append(f"⚠️ Gap pode estar incorreto: {gap_km:.1f} km")
    
    # 4. Distância de Pointe-Noire
    if 20 <= dist_pointe_noire <= 80:
        validations.append(f"✅ Distância adequada de Pointe-Noire: {dist_pointe_noire:.1f} km")
    else:
        validations.append(f"⚠️ Distância de Pointe-Noire: {dist_pointe_noire:.1f} km")
    
    # 5. Cidade de Cabinda
    if cabinda_city_inside:
        validations.append("✅ Cidade de Cabinda está dentro do território")
    else:
        validations.append("❌ Cidade de Cabinda está fora do território")
    
    # 6. Orientação da costa
    if cabinda_coastline[0][1] > cabinda_coastline[-1][1]:
        validations.append("✅ Orientação Norte-Sul correta")
    else:
        validations.append("⚠️ Orientação pode estar incorreta")
    
    print(f"\n✅ VALIDAÇÕES FINAIS:")
    for validation in validations:
        print(f"   {validation}")
    
    # Comparação com dados reais
    print(f"\n📋 COMPARAÇÃO COM DADOS REAIS:")
    print(f"   🌍 Cabinda real: ~7.270 km²")
    print(f"   📐 Nossa estimativa: {area_km2:.0f} km²")
    print(f"   📊 Diferença: {abs(area_km2 - 7270):.0f} km² ({abs(area_km2 - 7270)/7270*100:.1f}%)")
    
    # Status final
    failed_validations = len([v for v in validations if v.startswith('❌')])
    warning_validations = len([v for v in validations if v.startswith('⚠️')])
    
    if failed_validations == 0 and warning_validations <= 1:
        status = "EXCELENTE"
        print(f"\n🎉 RESULTADO: {status}")
        print("✅ Cabinda está geograficamente correto!")
    elif failed_validations == 0:
        status = "BOM"
        print(f"\n✅ RESULTADO: {status}")
        print("👍 Cabinda está bem representado")
    else:
        status = "PRECISA AJUSTES"
        print(f"\n⚠️ RESULTADO: {status}")
        print("🔧 Algumas correções ainda necessárias")
    
    # Gerar relatório
    report = {
        "timestamp": datetime.now().isoformat(),
        "cabinda_coastline": cabinda_coastline,
        "geographic_bounds": {
            "lat_min": lat_min, "lat_max": lat_max,
            "lon_min": lon_min, "lon_max": lon_max
        },
        "area_km2": area_km2,
        "real_area_km2": 7270,
        "area_accuracy_percent": 100 - abs(area_km2 - 7270)/7270*100,
        "gap_with_angola_km": gap_km,
        "distance_to_pointe_noire_km": dist_pointe_noire,
        "validations": validations,
        "status": status
    }
    
    return report

def main():
    """Função principal"""
    report = validate_cabinda_final()
    
    # Salvar relatório
    with open('logs/cabinda_final_validation.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 Relatório salvo: logs/cabinda_final_validation.json")
    print(f"⏰ Validação executada: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
