#!/usr/bin/env python3
"""
Script de teste para verificar a integração STAC
Testa as funcionalidades implementadas para dados oceanográficos
"""

import asyncio
import json
import sys
from pathlib import Path

# Adicionar o diretório src ao path
sys.path.append(str(Path(__file__).parent / "src"))

from src.bgapp.core.external_stac import external_stac_client, ExternalSTACClient
from src.bgapp.core.stac import STACManager


async def test_external_stac_client():
    """Testar cliente STAC externo"""
    print("🔍 Testando cliente STAC externo...")
    
    # Teste 1: Health check das APIs
    print("\n1. Verificando saúde das APIs STAC...")
    health = await external_stac_client.health_check()
    print(json.dumps(health, indent=2))
    
    # Teste 2: Buscar coleções prioritárias
    print("\n2. Buscando coleções prioritárias...")
    collections = await external_stac_client.get_priority_collections()
    print(f"Encontradas {len(collections)} coleções prioritárias:")
    for col in collections[:3]:  # Mostrar apenas as 3 primeiras
        print(f"  - {col.id}: {col.title} (relevância: {col.relevance_score})")
    
    # Teste 3: Buscar dados SST recentes
    print("\n3. Buscando dados SST recentes...")
    try:
        sst_data = await external_stac_client.get_recent_sst_data(days_back=3)
        print(f"Encontrados {len(sst_data)} itens SST recentes:")
        for item in sst_data[:2]:  # Mostrar apenas os 2 primeiros
            print(f"  - {item.id} ({item.collection}) - {item.datetime}")
    except Exception as e:
        print(f"Erro ao buscar SST: {e}")
    
    # Teste 4: Buscar itens específicos para Angola
    print("\n4. Buscando dados Sentinel-2 para Angola...")
    try:
        items = await external_stac_client.search_items(
            collection_id="sentinel-2-l2a",
            bbox=[8.16, -18.92, 13.79, -4.26],  # Angola bbox
            datetime_range="2024-01-01/2024-01-31",
            limit=5
        )
        print(f"Encontrados {len(items)} itens Sentinel-2:")
        for item in items[:2]:  # Mostrar apenas os 2 primeiros
            print(f"  - {item.id} - {item.datetime}")
            print(f"    Assets: {list(item.assets.keys())}")
    except Exception as e:
        print(f"Erro ao buscar Sentinel-2: {e}")


async def test_stac_manager():
    """Testar STAC Manager integrado"""
    print("\n🔧 Testando STAC Manager...")
    
    manager = STACManager()
    
    # Teste 1: Resumo das coleções
    print("\n1. Resumo das coleções:")
    summary = manager.get_collections_summary()
    print(json.dumps(summary, indent=2))
    
    # Teste 2: Coleções externas
    print("\n2. Coleções externas:")
    try:
        external_collections = await manager.get_external_collections()
        print(f"Total de coleções externas: {len(external_collections)}")
        for col in external_collections[:3]:
            print(f"  - {col['id']}: {col['title']} (score: {col['relevance_score']})")
    except Exception as e:
        print(f"Erro ao buscar coleções externas: {e}")
    
    # Teste 3: Dados oceanográficos recentes
    print("\n3. Dados oceanográficos recentes:")
    try:
        ocean_data = await manager.get_recent_oceanographic_data(days_back=5)
        print(f"Dados encontrados: {json.dumps(ocean_data, indent=2, default=str)}")
    except Exception as e:
        print(f"Erro ao buscar dados oceanográficos: {e}")


def test_collection_info():
    """Testar informações das coleções"""
    print("\n📊 Informações das coleções STAC...")
    
    # Mostrar resumo das coleções disponíveis
    summary = external_stac_client.get_collection_summary()
    print(json.dumps(summary, indent=2))


async def main():
    """Função principal de teste"""
    print("🌊 TESTE DE INTEGRAÇÃO STAC OCEANOGRÁFICA")
    print("=" * 50)
    
    try:
        # Testes básicos
        test_collection_info()
        
        # Testes assíncronos
        await test_external_stac_client()
        await test_stac_manager()
        
        print("\n✅ Todos os testes concluídos!")
        
    except Exception as e:
        print(f"\n❌ Erro durante os testes: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Executar testes
    asyncio.run(main())
