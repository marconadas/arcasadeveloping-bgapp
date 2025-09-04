#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🧪 Script de Teste dos Novos Serviços - BGAPP
============================================

Este script testa todos os novos serviços implementados:
- MaxEnt Service (Modelação de Distribuição de Espécies)
- Boundary Processor (Processamento de Fronteiras)
- Coastal Analysis Service (Análise Costeira)
- MCDA Service (Análise Multi-Critério)

Autor: Sistema BGAPP
Data: Janeiro 2025
"""

import sys
import asyncio
from pathlib import Path
from datetime import datetime, timedelta

# Adicionar o diretório src ao path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

# Importar os novos serviços
try:
    from bgapp.services.biodiversity.maxent_service import MaxEntService
    from bgapp.services.spatial_analysis.boundary_processor import BoundaryProcessor, MaritimeBoundary
    from bgapp.services.spatial_analysis.coastal_analysis import CoastalAnalysisService
    from bgapp.services.marine_planning.mcda_service import MCDAService, PlanningObjective
    
    print("✅ Todos os módulos importados com sucesso!")
except ImportError as e:
    print(f"❌ Erro ao importar módulos: {e}")
    sys.exit(1)

async def test_maxent_service():
    """Testar o serviço MaxEnt"""
    print("\n" + "="*60)
    print("🧠 TESTE DO SERVIÇO MAXENT")
    print("="*60)
    
    try:
        # Inicializar serviço
        maxent_service = MaxEntService()
        print("✅ Serviço MaxEnt inicializado")
        
        # Testar com espécie marinha comum em Angola
        species_name = "Sardinella aurita"  # Sardinha
        print(f"🐟 Testando modelação para: {species_name}")
        
        # Treinar modelo (usando dados simulados)
        result = await maxent_service.train_maxent_model(species_name)
        
        print(f"📊 Resultados da Modelação:")
        print(f"   • AUC Score: {result.auc_score:.3f}")
        print(f"   • Precisão Treino: {result.training_accuracy:.3f}")
        print(f"   • Precisão Teste: {result.test_accuracy:.3f}")
        
        # Testar predição para Luanda
        luanda_lat, luanda_lon = -8.8383, 13.2344
        prediction = maxent_service.get_species_prediction(
            species_name, luanda_lat, luanda_lon
        )
        
        print(f"🎯 Predição para Luanda:")
        print(f"   • Probabilidade: {prediction['suitability_probability']:.3f}")
        print(f"   • Presença Prevista: {prediction['predicted_presence']}")
        print(f"   • Confiança: {prediction['confidence']}")
        
        # Exportar resultados
        export_path = maxent_service.export_results(result)
        print(f"💾 Resultados exportados: {export_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste MaxEnt: {str(e)}")
        return False

async def test_boundary_processor():
    """Testar o processador de fronteiras"""
    print("\n" + "="*60)
    print("🌍 TESTE DO PROCESSADOR DE FRONTEIRAS")
    print("="*60)
    
    try:
        # Inicializar processador
        processor = BoundaryProcessor()
        print("✅ Processador de Fronteiras inicializado")
        
        # Carregar fronteiras de Angola
        angola_gdf = processor.load_angola_boundaries()
        print(f"📍 Carregadas {len(angola_gdf)} fronteiras de Angola")
        
        # Criar objetos MaritimeBoundary
        boundaries = []
        for idx, row in angola_gdf.iterrows():
            if row['type'] == 'eez':
                validation = processor.validate_boundary_geometry(row['geometry'])
                
                boundary = MaritimeBoundary(
                    name=row['name'],
                    boundary_type='eez',
                    geometry=validation['fixed_geometry'],
                    country=row['country'],
                    area_km2=validation['area_km2'],
                    perimeter_km=validation['perimeter_km'],
                    created_at=datetime.now()
                )
                boundaries.append(boundary)
        
        print(f"🌊 Processadas {len(boundaries)} fronteiras marítimas")
        
        # Mostrar estatísticas
        for boundary in boundaries:
            print(f"   • {boundary.name}:")
            print(f"     - Área: {boundary.area_km2:,.0f} km²")
            print(f"     - Perímetro: {boundary.perimeter_km:,.0f} km")
        
        # Exportar fronteiras
        export_path = processor.export_boundaries(boundaries)
        print(f"💾 Fronteiras exportadas: {export_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste de Fronteiras: {str(e)}")
        return False

def test_coastal_analysis():
    """Testar o serviço de análise costeira"""
    print("\n" + "="*60)
    print("🌊 TESTE DO SERVIÇO DE ANÁLISE COSTEIRA")
    print("="*60)
    
    try:
        # Inicializar serviço
        coastal_service = CoastalAnalysisService()
        print("✅ Serviço de Análise Costeira inicializado")
        
        # Criar segmentos costeiros
        segments = coastal_service.create_angola_coastline_segments()
        print(f"📏 Criados {len(segments)} segmentos costeiros")
        
        # Analisar alguns segmentos
        analyzed_segments = []
        for i, segment in enumerate(segments[:5]):  # Primeiros 5 segmentos
            print(f"\n🔍 Analisando segmento {segment.id}:")
            print(f"   • Tipo: {segment.coastal_type}")
            print(f"   • Comprimento: {segment.length_km:.1f} km")
            print(f"   • Vulnerabilidade: {segment.vulnerability_score:.3f}")
            
            # Detectar mudanças
            reference_date = datetime.now() - timedelta(days=365)
            comparison_date = datetime.now()
            
            change = coastal_service.detect_coastline_changes(
                segment, reference_date, comparison_date
            )
            
            print(f"   • Mudança: {change.change_type.value} ({change.change_distance_m:.1f}m)")
            print(f"   • Confiança: {change.confidence:.3f}")
            
            # Avaliar vulnerabilidade climática
            vulnerability = coastal_service.assess_climate_vulnerability(segment)
            print(f"   • Vulnerabilidade Climática: {vulnerability.vulnerability_level.value}")
            print(f"   • Ameaças Principais: {', '.join(vulnerability.key_threats[:3])}")
            
            analyzed_segments.append(segment)
        
        # Criar rede de monitorização
        monitoring_network = coastal_service.create_monitoring_network(analyzed_segments)
        total_points = sum(len(points) for points in monitoring_network.values())
        print(f"\n📡 Rede de monitorização criada com {total_points} pontos")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste de Análise Costeira: {str(e)}")
        return False

def test_mcda_service():
    """Testar o serviço MCDA"""
    print("\n" + "="*60)
    print("🎯 TESTE DO SERVIÇO MCDA")
    print("="*60)
    
    try:
        # Inicializar serviço
        mcda_service = MCDAService()
        print("✅ Serviço MCDA inicializado")
        
        # Testar diferentes objetivos
        objectives_to_test = [
            PlanningObjective.AQUACULTURE,
            PlanningObjective.FISHING,
            PlanningObjective.CONSERVATION
        ]
        
        for objective in objectives_to_test:
            print(f"\n🎯 Testando objetivo: {objective.value}")
            
            # Criar grelha espacial (menor para teste)
            bounds = {
                'min_lat': -12.0,
                'max_lat': -8.0,
                'min_lon': 12.0,
                'max_lon': 14.0
            }
            
            alternatives = mcda_service.create_spatial_grid(bounds, resolution_km=20)
            print(f"   • Criadas {len(alternatives)} alternativas")
            
            # Preencher valores dos critérios
            alternatives = mcda_service.populate_criteria_values(alternatives, objective)
            
            # Configurar critérios AHP
            criteria = mcda_service.setup_ahp_criteria(objective)
            print(f"   • Configurados {len(criteria)} critérios")
            
            # Calcular scores AHP
            alternatives = mcda_service.calculate_ahp_scores(alternatives, criteria)
            
            # Mostrar top 5 resultados
            print(f"   🏆 Top 5 localizações:")
            for alt in alternatives[:5]:
                print(f"     {alt.rank}. Score: {alt.final_score:.3f} "
                      f"({alt.latitude:.2f}, {alt.longitude:.2f})")
            
            # Testar TOPSIS também
            alternatives_topsis = [alt for alt in alternatives]  # Cópia
            alternatives_topsis = mcda_service.perform_topsis_analysis(alternatives_topsis, criteria)
            
            print(f"   📊 TOPSIS - Top 3:")
            for alt in alternatives_topsis[:3]:
                print(f"     {alt.rank}. Score: {alt.final_score:.3f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste MCDA: {str(e)}")
        return False

def test_integration():
    """Testar integração entre serviços"""
    print("\n" + "="*60)
    print("🔗 TESTE DE INTEGRAÇÃO")
    print("="*60)
    
    try:
        print("🧪 Testando integração entre serviços...")
        
        # Cenário: Identificar área adequada para aquacultura de sardinha
        print("\n📋 Cenário: Aquacultura de Sardinha em Angola")
        
        # 1. Usar MaxEnt para identificar habitat adequado
        maxent_service = MaxEntService()
        
        # 2. Usar MCDA para encontrar localizações ótimas
        mcda_service = MCDAService()
        
        # Criar grelha para região de Luanda
        bounds = {
            'min_lat': -10.0,
            'max_lat': -8.0,
            'min_lon': 12.5,
            'max_lon': 14.0
        }
        
        alternatives = mcda_service.create_spatial_grid(bounds, resolution_km=15)
        alternatives = mcda_service.populate_criteria_values(
            alternatives, PlanningObjective.AQUACULTURE
        )
        
        criteria = mcda_service.setup_ahp_criteria(PlanningObjective.AQUACULTURE)
        alternatives = mcda_service.calculate_ahp_scores(alternatives, criteria)
        
        # 3. Usar análise costeira para avaliar vulnerabilidade da região
        coastal_service = CoastalAnalysisService()
        segments = coastal_service.create_angola_coastline_segments()
        
        # Filtrar segmentos na região de interesse
        region_segments = [s for s in segments 
                          if bounds['min_lat'] <= s.geometry.bounds[1] <= bounds['max_lat']]
        
        print(f"✅ Integração testada:")
        print(f"   • {len(alternatives)} alternativas analisadas")
        print(f"   • {len(criteria)} critérios aplicados")
        print(f"   • {len(region_segments)} segmentos costeiros na região")
        
        # Mostrar resultado integrado
        best_location = alternatives[0]
        print(f"\n🎯 Melhor localização identificada:")
        print(f"   • Coordenadas: ({best_location.latitude:.3f}, {best_location.longitude:.3f})")
        print(f"   • Score: {best_location.final_score:.3f}")
        print(f"   • Profundidade: {best_location.criteria_values.get('depth', 'N/A'):.1f}m")
        print(f"   • Temperatura: {best_location.criteria_values.get('temperature', 'N/A'):.1f}°C")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste de Integração: {str(e)}")
        return False

async def run_all_tests():
    """Executar todos os testes"""
    print("🧪 INICIANDO TESTES DOS NOVOS SERVIÇOS BGAPP")
    print("=" * 80)
    
    test_results = {
        'MaxEnt Service': await test_maxent_service(),
        'Boundary Processor': await test_boundary_processor(),
        'Coastal Analysis': test_coastal_analysis(),
        'MCDA Service': test_mcda_service(),
        'Integration': test_integration()
    }
    
    # Resumo dos resultados
    print("\n" + "="*80)
    print("📊 RESUMO DOS TESTES")
    print("="*80)
    
    passed = 0
    total = len(test_results)
    
    for service, result in test_results.items():
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{service:<20}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Resultado Final: {passed}/{total} testes passaram")
    
    if passed == total:
        print("🎉 TODOS OS SERVIÇOS FUNCIONAM CORRETAMENTE!")
        print("\n📋 Serviços implementados com sucesso:")
        print("   • 🧠 MaxEnt - Modelação de Distribuição de Espécies")
        print("   • 🌍 Boundary Processor - Processamento de Fronteiras Marítimas")
        print("   • 🌊 Coastal Analysis - Análise Avançada de Linha Costeira")
        print("   • 🎯 MCDA - Análise Multi-Critério para Planeamento")
        print("   • 🔗 Integração - Comunicação entre serviços")
    else:
        print("⚠️ Alguns testes falharam. Verifique os logs acima.")
    
    return passed == total

if __name__ == "__main__":
    # Executar testes
    success = asyncio.run(run_all_tests())
    
    if success:
        print("\n🚀 Sistema pronto para produção!")
        sys.exit(0)
    else:
        print("\n🔧 Sistema precisa de ajustes.")
        sys.exit(1)
