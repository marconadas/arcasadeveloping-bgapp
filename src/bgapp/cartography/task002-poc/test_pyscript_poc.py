#!/usr/bin/env python3
"""
Script de teste para POC 2: PyScript + Deck.GL
Verifica a criação do arquivo HTML e executa sanity checks
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_pyscript_sanity_checks():
    """Executar verificações de sanidade para o POC PyScript"""
    
    logger.info("="*60)
    logger.info("🧪 TESTE POC 2: PYSCRIPT + DECK.GL")
    logger.info("="*60)
    
    checks = {
        'html_file_exists': False,
        'html_valid': False,
        'pyscript_included': False,
        'deckgl_included': False,
        'python_code_present': False,
        'sanity_functions': False,
        'file_size_ok': False,
        'errors': []
    }
    
    try:
        # Verificar se arquivo HTML existe
        html_path = Path('pyscript_deckgl_poc.html')
        checks['html_file_exists'] = html_path.exists()
        
        if checks['html_file_exists']:
            logger.info(f"✅ Arquivo HTML encontrado: {html_path}")
            
            # Ler conteúdo do arquivo
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # Verificar tamanho do arquivo
            file_size = len(html_content)
            checks['file_size_ok'] = file_size > 1000  # Deve ter pelo menos 1KB
            logger.info(f"📊 Tamanho do arquivo: {file_size} bytes")
            
            # Verificar se HTML é válido
            checks['html_valid'] = (
                '<!DOCTYPE html>' in html_content and
                '<html' in html_content and
                '</html>' in html_content
            )
            
            # Verificar inclusão do PyScript
            checks['pyscript_included'] = (
                'pyscript.net' in html_content or
                'pyscript.js' in html_content
            )
            
            # Verificar inclusão do Deck.GL
            checks['deckgl_included'] = (
                'deck.gl@' in html_content or
                'deck.DeckGL' in html_content
            )
            
            # Verificar presença de código Python
            checks['python_code_present'] = (
                '<py-script>' in html_content and
                '</py-script>' in html_content and
                'PyScriptDeckGLManager' in html_content
            )
            
            # Verificar funções de sanidade
            checks['sanity_functions'] = (
                'run_sanity_checks' in html_content and
                'addFishingLayer' in html_content and
                'addTemperatureLayer' in html_content
            )
            
            # Análise detalhada
            logger.info("\n📋 ANÁLISE DO HTML:")
            logger.info(f"  ✓ HTML válido: {checks['html_valid']}")
            logger.info(f"  ✓ PyScript incluído: {checks['pyscript_included']}")
            logger.info(f"  ✓ Deck.GL incluído: {checks['deckgl_included']}")
            logger.info(f"  ✓ Código Python presente: {checks['python_code_present']}")
            logger.info(f"  ✓ Funções de sanidade: {checks['sanity_functions']}")
            
            # Contar elementos importantes
            py_script_count = html_content.count('<py-script>')
            deck_refs = html_content.count('deck.')
            layer_types = ['ScatterplotLayer', 'HeatmapLayer']
            layers_found = [l for l in layer_types if l in html_content]
            
            logger.info(f"\n📊 ESTATÍSTICAS:")
            logger.info(f"  • Blocos PyScript: {py_script_count}")
            logger.info(f"  • Referências Deck.GL: {deck_refs}")
            logger.info(f"  • Tipos de layers: {', '.join(layers_found)}")
            
            # Verificar integração com ZEE Angola
            angola_integration = {
                'zee_coordinates': '-11.0' in html_content and '12.0' in html_content,
                'fishing_zones': 'Cabinda' in html_content or 'Benguela' in html_content,
                'ocean_data': 'temperature' in html_content.lower() or 'fishing' in html_content.lower()
            }
            
            logger.info(f"\n🌊 INTEGRAÇÃO ZEE ANGOLA:")
            logger.info(f"  ✓ Coordenadas ZEE: {angola_integration['zee_coordinates']}")
            logger.info(f"  ✓ Zonas de pesca: {angola_integration['fishing_zones']}")
            logger.info(f"  ✓ Dados oceanográficos: {angola_integration['ocean_data']}")
            
        else:
            logger.error("❌ Arquivo HTML não encontrado")
            checks['errors'].append("Arquivo HTML não existe")
            
    except Exception as e:
        logger.error(f"❌ Erro durante verificações: {e}")
        checks['errors'].append(str(e))
    
    # Resultado final
    logger.info("\n" + "="*60)
    all_checks_passed = all([
        checks['html_file_exists'],
        checks['html_valid'],
        checks['pyscript_included'],
        checks['deckgl_included'],
        checks['python_code_present'],
        checks['sanity_functions'],
        checks['file_size_ok']
    ])
    
    if all_checks_passed:
        logger.info("✅ POC PYSCRIPT PASSOU EM TODAS AS VERIFICAÇÕES")
        
        # Comparação com Pyodide
        logger.info("\n📊 COMPARAÇÃO PYODIDE vs PYSCRIPT:")
        comparison = {
            'Pyodide': {
                'Tamanho Bundle': '~50MB',
                'Performance': '⭐⭐⭐',
                'Complexidade': '⭐⭐⭐⭐',
                'Maturidade': '⭐⭐⭐⭐',
                'Score': 3.5
            },
            'PyScript': {
                'Tamanho Bundle': '~30MB',
                'Performance': '⭐⭐⭐',
                'Complexidade': '⭐⭐⭐',
                'Maturidade': '⭐⭐⭐',
                'Score': 3.0
            }
        }
        
        for tech, metrics in comparison.items():
            logger.info(f"\n  {tech}:")
            for metric, value in metrics.items():
                logger.info(f"    • {metric}: {value}")
        
        # Recomendação
        logger.info("\n💡 RECOMENDAÇÃO PRELIMINAR:")
        logger.info("  PyScript oferece sintaxe mais moderna e integração mais limpa,")
        logger.info("  mas Pyodide tem melhor suporte e estabilidade para produção.")
        
    else:
        logger.error("❌ POC PYSCRIPT FALHOU EM ALGUMAS VERIFICAÇÕES")
        failed_checks = [k for k, v in checks.items() if not v and k != 'errors']
        logger.error(f"  Verificações falhadas: {', '.join(failed_checks)}")
    
    if checks['errors']:
        logger.error(f"\n❌ ERROS ENCONTRADOS:")
        for error in checks['errors']:
            logger.error(f"  • {error}")
    
    return all_checks_passed


def create_comparison_report():
    """Criar relatório comparativo dos POCs"""
    
    report = {
        'timestamp': datetime.now().isoformat(),
        'poc_1_pyodide': {
            'status': 'completed',
            'file': 'pyodide_test.html',
            'sanity_checks': 'passed',
            'pros': [
                'Compatibilidade total com bibliotecas Python',
                'Integração direta com JavaScript',
                'Suporte WebGL através de PyOpenGL',
                'Performance otimizada para browser'
            ],
            'cons': [
                'Tamanho do bundle (50MB+)',
                'Latência de inicialização',
                'Dependências complexas'
            ]
        },
        'poc_2_pyscript': {
            'status': 'completed',
            'file': 'pyscript_deckgl_poc.html',
            'sanity_checks': 'pending',
            'pros': [
                'Sintaxe moderna Python 3.11+',
                'Integração nativa com HTML/CSS',
                'Performance melhorada vs Pyodide',
                'Desenvolvimento ativo (2025)'
            ],
            'cons': [
                'Ecosistema ainda em desenvolvimento',
                'Documentação limitada',
                'Debugging complexo'
            ]
        }
    }
    
    # Salvar relatório
    with open('poc_comparison_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    logger.info(f"\n📄 Relatório comparativo salvo: poc_comparison_report.json")
    return report


if __name__ == "__main__":
    # Executar testes
    success = run_pyscript_sanity_checks()
    
    # Criar relatório comparativo
    report = create_comparison_report()
    
    # Resultado final
    logger.info("\n" + "="*60)
    if success:
        logger.info("🎉 POC 2 (PYSCRIPT) CONCLUÍDO COM SUCESSO!")
        logger.info("📝 Próximo: POC 3 - WebAssembly (WASM)")
    else:
        logger.error("⚠️ POC 2 (PYSCRIPT) REQUER AJUSTES")
    
    exit(0 if success else 1)