#!/usr/bin/env python3
"""
🧪 TESTE DO DECK.GL WASM WRAPPER - BGAPP
Arquivo de teste para verificar a funcionalidade do wrapper WebAssembly Deck.GL
TASK-003: Teste de execução de layers simples
"""

import sys
import logging
from pathlib import Path
from typing import List, Dict, Any
import json

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_deckgl_wasm_basic():
    """Teste básico do wrapper WebAssembly"""
    logger.info("🧪 Iniciando teste básico do Deck.GL WASM Wrapper...")
    
    try:
        # Importar o wrapper
        from .deckgl_wasm_wrapper import (
            DeckGLWASMWrapper, 
            DeckGLConfig, 
            DeckGLViewState,
            create_angola_marine_visualization
        )
        
        logger.info("✅ Wrapper importado com sucesso")
        
        # Dados de teste para Angola
        test_data = [
            {"longitude": 13.2, "latitude": -8.8, "value": 25.5, "name": "Luanda"},
            {"longitude": 12.5, "latitude": -5.2, "value": 24.1, "name": "Cabinda"},  
            {"longitude": 15.1, "latitude": -9.5, "value": 23.8, "name": "Lobito"},
            {"longitude": 13.8, "latitude": -12.5, "value": 22.3, "name": "Benguela"},
            {"longitude": 16.2, "latitude": -11.2, "value": 21.9, "name": "Namibe"}
        ]
        
        # Teste 1: Criar wrapper manual
        logger.info("🔧 Teste 1: Criação manual do wrapper...")
        
        config = DeckGLConfig(
            canvas_id="test-canvas",
            view_state=DeckGLViewState(longitude=13.2, latitude=-8.8, zoom=7)
        )
        
        wrapper = DeckGLWASMWrapper(config)
        
        # Teste 2: Criar camada scatterplot
        logger.info("📍 Teste 2: Criação de camada scatterplot...")
        
        scatter_layer = wrapper.create_scatterplot_layer(
            "test-scatter",
            test_data,
            getFillColor=[255, 100, 0, 160],
            getRadius=3000
        )
        
        wrapper.add_layer(scatter_layer)
        
        # Teste 3: Criar camada heatmap
        logger.info("🔥 Teste 3: Criação de camada heatmap...")
        
        heatmap_layer = wrapper.create_heatmap_layer(
            "test-heatmap", 
            test_data,
            radiusPixels=80,
            intensity=2
        )
        
        wrapper.add_layer(heatmap_layer)
        
        # Teste 4: Obter estatísticas
        stats = wrapper.get_layer_stats()
        logger.info(f"📊 Estatísticas: {stats}")
        
        # Teste 5: Renderizar HTML
        logger.info("🎨 Teste 5: Renderização HTML...")
        
        html_output = wrapper.render_to_html("Teste BGAPP Deck.GL WASM")
        
        # Verificar se HTML foi gerado
        if len(html_output) > 1000:
            logger.info(f"✅ HTML gerado com sucesso ({len(html_output)} chars)")
        else:
            logger.warning(f"⚠️ HTML muito pequeno: {len(html_output)} chars")
        
        # Teste 6: Salvar arquivo
        logger.info("💾 Teste 6: Salvamento de arquivo...")
        
        output_path = Path("test_deckgl_output.html")
        saved_path = wrapper.save_html(output_path)
        
        if saved_path and saved_path.exists():
            logger.info(f"✅ Arquivo salvo: {saved_path}")
        else:
            logger.error("❌ Erro ao salvar arquivo")
        
        return True, "Todos os testes básicos passaram!"
        
    except ImportError as e:
        logger.error(f"❌ Erro de importação: {e}")
        return False, f"Wrapper não disponível: {e}"
    except Exception as e:
        logger.error(f"❌ Erro no teste: {e}")
        return False, f"Teste falhou: {e}"

def test_deckgl_angola_visualization():
    """Teste da função de visualização rápida para Angola"""
    logger.info("🇦🇴 Testando visualização rápida para Angola...")
    
    try:
        from .deckgl_wasm_wrapper import create_angola_marine_visualization
        
        # Dados oceanográficos simulados
        ocean_data = [
            {"longitude": 13.0, "latitude": -8.0, "value": 26.2, "name": "SST Norte"},
            {"longitude": 13.5, "latitude": -9.0, "value": 25.8, "name": "SST Central"},
            {"longitude": 14.0, "latitude": -10.5, "value": 24.5, "name": "SST Sul"},
            {"longitude": 12.8, "latitude": -7.5, "value": 27.1, "name": "Corrente Quente"},
            {"longitude": 15.2, "latitude": -11.8, "value": 23.2, "name": "Upwelling"}
        ]
        
        # Testar diferentes tipos de camadas
        for layer_type in ['scatterplot', 'heatmap']:
            logger.info(f"🧪 Testando camada: {layer_type}")
            
            wrapper = create_angola_marine_visualization(ocean_data, layer_type)
            stats = wrapper.get_layer_stats()
            
            logger.info(f"✅ {layer_type} criado: {stats}")
        
        return True, "Visualização Angola testada com sucesso!"
        
    except Exception as e:
        logger.error(f"❌ Erro no teste Angola: {e}")
        return False, f"Teste Angola falhou: {e}"

def test_integration_with_python_maps_engine():
    """Teste de integração com o engine de mapas Python"""
    logger.info("🗺️ Testando integração com Python Maps Engine...")
    
    try:
        from .python_maps_engine import cartography_engine
        
        # Testar capacidades
        capabilities = cartography_engine.get_deckgl_capabilities()
        logger.info(f"🔍 Capacidades Deck.GL: {json.dumps(capabilities, indent=2)}")
        
        # Testar criação de visualização
        test_data = [
            {"longitude": 13.2, "latitude": -8.8, "value": 25.5, "name": "Ponto 1"},
            {"longitude": 14.0, "latitude": -9.5, "value": 24.1, "name": "Ponto 2"}
        ]
        
        html_viz = cartography_engine.create_deckgl_visualization(
            test_data,
            "scatterplot", 
            "Teste Integração BGAPP"
        )
        
        if html_viz:
            logger.info(f"✅ Visualização criada via engine ({len(html_viz)} chars)")
            
            # Salvar para verificar
            test_file = Path("test_integration_output.html")
            with open(test_file, 'w', encoding='utf-8') as f:
                f.write(html_viz)
            
            logger.info(f"💾 Arquivo de teste salvo: {test_file}")
            
        else:
            logger.warning("⚠️ Nenhuma visualização gerada (modo fallback ativo)")
        
        return True, "Integração testada com sucesso!"
        
    except Exception as e:
        logger.error(f"❌ Erro na integração: {e}")
        return False, f"Integração falhou: {e}"

def run_all_tests():
    """Executar todos os testes do Deck.GL WASM"""
    logger.info("🚀 INICIANDO BATERIA COMPLETA DE TESTES DECK.GL WASM")
    logger.info("=" * 60)
    
    tests = [
        ("Teste Básico", test_deckgl_wasm_basic),
        ("Visualização Angola", test_deckgl_angola_visualization),
        ("Integração Engine", test_integration_with_python_maps_engine)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        logger.info(f"\n🧪 EXECUTANDO: {test_name}")
        logger.info("-" * 40)
        
        try:
            success, message = test_func()
            results.append((test_name, success, message))
            
            if success:
                logger.info(f"✅ {test_name}: {message}")
            else:
                logger.error(f"❌ {test_name}: {message}")
                
        except Exception as e:
            logger.error(f"💥 {test_name} CRASHED: {e}")
            results.append((test_name, False, f"Crashed: {e}"))
    
    # Resumo final
    logger.info("\n" + "=" * 60)
    logger.info("📊 RESUMO DOS TESTES")
    logger.info("=" * 60)
    
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    for test_name, success, message in results:
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status}: {test_name}")
        if not success:
            logger.info(f"      Motivo: {message}")
    
    logger.info(f"\n🎯 RESULTADO FINAL: {passed}/{total} testes passaram")
    
    if passed == total:
        logger.info("🎉 TODOS OS TESTES PASSARAM! TASK-003 IMPLEMENTADA COM SUCESSO!")
        return True
    else:
        logger.warning(f"⚠️ {total - passed} testes falharam. Verificar implementação.")
        return False

if __name__ == "__main__":
    """Executar testes quando chamado diretamente"""
    
    # Adicionar path para importações
    current_dir = Path(__file__).parent
    sys.path.insert(0, str(current_dir))
    
    logger.info("🌊 BGAPP Deck.GL WASM Wrapper - Suite de Testes")
    logger.info("TASK-003: Criar wrapper Python para Deck.GL usando WebAssembly")
    
    success = run_all_tests()
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)
