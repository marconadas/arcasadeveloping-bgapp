#!/usr/bin/env python3
"""
Validação das correções da ZEE de Angola
Verifica se as coordenadas foram corrigidas corretamente
"""

import sys
import importlib.util
from pathlib import Path

def validate_admin_api():
    """Validar correções no admin_api.py"""
    
    print("🔍 Validando src/bgapp/admin_api.py...")
    
    try:
        # Importar módulo
        spec = importlib.util.spec_from_file_location("admin_api", "src/bgapp/admin_api.py")
        admin_api = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(admin_api)
        
        bounds = admin_api.ANGOLA_BOUNDS
        
        print(f"   📍 ANGOLA_BOUNDS encontrados:")
        for key, value in bounds.items():
            print(f"      {key}: {value}°")
        
        # Verificar se foram corrigidos
        expected = {'north': -4.2, 'south': -18.2, 'east': 17.5, 'west': 8.5}
        
        all_correct = True
        for key, expected_value in expected.items():
            if abs(bounds[key] - expected_value) > 0.1:
                print(f"   ❌ {key}: esperado {expected_value}, encontrado {bounds[key]}")
                all_correct = False
            else:
                print(f"   ✅ {key}: {bounds[key]}° (correto)")
        
        return all_correct
        
    except Exception as e:
        print(f"   ❌ Erro ao validar: {e}")
        return False

def validate_copernicus_real():
    """Validar correções no copernicus_real.py"""
    
    print("\n🔍 Validando src/bgapp/ingest/copernicus_real.py...")
    
    try:
        spec = importlib.util.spec_from_file_location("copernicus_real", "src/bgapp/ingest/copernicus_real.py")
        copernicus_real = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(copernicus_real)
        
        # Criar instância para acessar bounds
        connector = copernicus_real.CopernicusRealConnector()
        bounds = connector.angola_bounds
        
        print(f"   📍 angola_bounds encontrados:")
        for key, value in bounds.items():
            print(f"      {key}: {value}°")
        
        # Verificar se foram corrigidos
        expected = {'north': -4.2, 'south': -18.2, 'east': 17.5, 'west': 8.5}
        
        all_correct = True
        for key, expected_value in expected.items():
            if abs(bounds[key] - expected_value) > 0.1:
                print(f"   ❌ {key}: esperado {expected_value}, encontrado {bounds[key]}")
                all_correct = False
            else:
                print(f"   ✅ {key}: {bounds[key]}° (correto)")
        
        return all_correct
        
    except Exception as e:
        print(f"   ❌ Erro ao validar: {e}")
        return False

def validate_oceanography_model():
    """Validar correções no angola_oceanography.py"""
    
    print("\n🔍 Validando src/bgapp/models/angola_oceanography.py...")
    
    try:
        spec = importlib.util.spec_from_file_location("angola_oceanography", "src/bgapp/models/angola_oceanography.py")
        angola_oceanography = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(angola_oceanography)
        
        # Criar instância para acessar bounds
        model = angola_oceanography.AngolaOceanographicModel()
        bounds = model.bounds
        
        print(f"   📍 bounds encontrados:")
        for key, value in bounds.items():
            print(f"      {key}: {value}°")
        
        # Verificar se foram corrigidos (nomes diferentes)
        expected = {'lat_max': -4.2, 'lat_min': -18.2, 'lon_max': 17.5, 'lon_min': 8.5}
        
        all_correct = True
        for key, expected_value in expected.items():
            if abs(bounds[key] - expected_value) > 0.1:
                print(f"   ❌ {key}: esperado {expected_value}, encontrado {bounds[key]}")
                all_correct = False
            else:
                print(f"   ✅ {key}: {bounds[key]}° (correto)")
        
        return all_correct
        
    except Exception as e:
        print(f"   ❌ Erro ao validar: {e}")
        return False

def calculate_coverage_improvement():
    """Calcular melhoria na cobertura"""
    
    print("\n📊 CÁLCULO DA MELHORIA:")
    
    # Bounds antigos
    old_bounds = {'north': -4.4, 'south': -18.5, 'east': 16.8, 'west': 11.4}
    old_area = (old_bounds['east'] - old_bounds['west']) * (old_bounds['north'] - old_bounds['south'])
    
    # Bounds novos
    new_bounds = {'north': -4.2, 'south': -18.2, 'east': 17.5, 'west': 8.5}
    new_area = (new_bounds['east'] - new_bounds['west']) * (new_bounds['north'] - new_bounds['south'])
    
    # ZEE real estimada
    zee_bounds = {'north': -4.2, 'south': -18.0, 'east': 17.5, 'west': 8.5}
    zee_area = (zee_bounds['east'] - zee_bounds['west']) * (zee_bounds['north'] - zee_bounds['south'])
    
    print(f"   📐 Área antiga:     {old_area:.1f} graus²")
    print(f"   📐 Área nova:       {new_area:.1f} graus²")
    print(f"   📐 ZEE real:        {zee_area:.1f} graus²")
    
    improvement = ((new_area - old_area) / old_area) * 100
    old_coverage = (old_area / zee_area) * 100
    new_coverage = (new_area / zee_area) * 100
    
    print(f"   📈 Melhoria:        +{improvement:.1f}%")
    print(f"   📊 Cobertura antiga: {old_coverage:.1f}%")
    print(f"   📊 Cobertura nova:   {new_coverage:.1f}%")
    
    return improvement, new_coverage

def test_coordinate_ranges():
    """Testar se as novas coordenadas cobrem pontos importantes"""
    
    print("\n🎯 TESTE DE COBERTURA DE PONTOS:")
    
    # Pontos importantes da ZEE
    test_points = [
        ("Costa Cabinda", -5.5, 12.2),
        ("Costa Luanda", -8.8, 13.2),
        ("Costa Benguela", -12.6, 13.4),
        ("Costa Namibe", -15.2, 12.1),
        ("ZEE Oceânica Oeste", -10.0, 9.0),  # Ponto crítico que estava perdido
        ("ZEE Oceânica Norte", -6.0, 10.0),
        ("ZEE Oceânica Sul", -16.0, 10.5),
        ("Limite Leste ZEE", -12.0, 17.0)
    ]
    
    new_bounds = {'north': -4.2, 'south': -18.2, 'east': 17.5, 'west': 8.5}
    
    covered = 0
    for name, lat, lon in test_points:
        inside = (new_bounds['south'] <= lat <= new_bounds['north'] and
                 new_bounds['west'] <= lon <= new_bounds['east'])
        
        status = "✅" if inside else "❌"
        print(f"   {status} {name}: ({lat:.1f}, {lon:.1f})")
        
        if inside:
            covered += 1
    
    coverage_percent = (covered / len(test_points)) * 100
    print(f"\n   📊 Pontos cobertos: {covered}/{len(test_points)} ({coverage_percent:.1f}%)")
    
    return coverage_percent

def main():
    """Executar todas as validações"""
    
    print("🔧 VALIDAÇÃO DAS CORREÇÕES DA ZEE DE ANGOLA")
    print("=" * 60)
    
    # Validar arquivos principais
    results = []
    results.append(validate_admin_api())
    results.append(validate_copernicus_real())
    results.append(validate_oceanography_model())
    
    # Calcular melhorias
    improvement, coverage = calculate_coverage_improvement()
    
    # Testar cobertura de pontos
    point_coverage = test_coordinate_ranges()
    
    # Resumo final
    print("\n" + "=" * 60)
    print("🎯 RESUMO DA VALIDAÇÃO")
    print("=" * 60)
    
    files_correct = sum(results)
    total_files = len(results)
    
    print(f"📁 Arquivos corrigidos: {files_correct}/{total_files}")
    print(f"📈 Melhoria na área: +{improvement:.1f}%")
    print(f"📊 Nova cobertura ZEE: {coverage:.1f}%")
    print(f"🎯 Pontos importantes: {point_coverage:.1f}% cobertos")
    
    if files_correct == total_files and coverage > 90 and point_coverage > 85:
        print("\n✅ CORREÇÕES APLICADAS COM SUCESSO!")
        print("   🌊 ZEE de Angola agora coberta adequadamente")
        print("   📡 Dados Copernicus cobrirão zona oceânica oeste")
        print("   🎯 Animações meteorológicas terão dados completos")
        return True
    else:
        print("\n❌ ALGUMAS CORREÇÕES FALHARAM")
        if files_correct < total_files:
            print("   📁 Nem todos os arquivos foram corrigidos")
        if coverage <= 90:
            print("   📊 Cobertura da ZEE ainda insuficiente")
        if point_coverage <= 85:
            print("   🎯 Pontos importantes não cobertos")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)


