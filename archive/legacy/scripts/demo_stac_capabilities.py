#!/usr/bin/env python3
"""
Demonstração das Capacidades STAC Expandidas
BGAPP - Sistema de Gestão Marinha de Angola
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

# Adicionar src ao path
sys.path.append(str(Path(__file__).parent.parent))

from src.bgapp.stac.enhanced_manager import get_enhanced_manager


def demo_capabilities():
    """Demonstrar todas as capacidades STAC implementadas"""
    
    print("=" * 70)
    print("🚀 BGAPP - Demonstração das Capacidades STAC Expandidas")
    print("=" * 70)
    
    # Inicializar gestor
    print("\n1️⃣ Inicializando Gestor STAC Aprimorado...")
    manager = get_enhanced_manager()
    print("✅ Gestor inicializado com sucesso")
    
    # Obter resumo das coleções
    print("\n2️⃣ Obtendo resumo das coleções disponíveis...")
    summary = manager.get_collections_summary()
    
    print(f"\n📊 Resumo das Coleções:")
    print(f"   Catálogo Local: {summary['local_catalog']['collections']} coleções")
    
    for api_name, api_info in summary['remote_apis'].items():
        if 'error' not in api_info:
            print(f"\n   {api_name}:")
            print(f"      Total: {api_info['total_collections']} coleções")
            print(f"      Oceânicas: {api_info['ocean_collections']} coleções")
            print(f"      Exemplos: {', '.join(api_info['collections'][:3])}")
    
    # Buscar dados SST
    print("\n3️⃣ Buscando dados de temperatura da superfície do mar...")
    
    # Últimos 30 dias
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    date_range = f"{start_date.isoformat()}/{end_date.isoformat()}"
    
    sst_items = manager.search_sst_data(date_range=date_range)
    
    if sst_items:
        print(f"✅ Encontrados {len(sst_items)} items de SST")
        for item in sst_items[:3]:
            print(f"   - {item.id}: {item.datetime}")
    else:
        print("⚠️ Nenhum dado SST encontrado para o período")
    
    # Buscar dados Sentinel
    print("\n4️⃣ Buscando dados Sentinel-2...")
    
    sentinel_items = manager.search_sentinel_data(
        date_range=date_range,
        cloud_cover=20  # Máximo 20% de nuvens
    )
    
    if sentinel_items:
        print(f"✅ Encontrados {len(sentinel_items)} items Sentinel-2")
        for item in sentinel_items[:3]:
            print(f"   - {item.id}")
    else:
        print("⚠️ Nenhum dado Sentinel encontrado")
    
    # Criar mapa interativo
    print("\n5️⃣ Criando mapa interativo...")
    
    # Combinar todos os items
    all_items = sst_items[:5] + sentinel_items[:5]
    
    if all_items:
        mapa = manager.create_interactive_map(
            items=all_items,
            show_ports=True
        )
        
        # Salvar mapa
        output_dir = Path("admin-dashboard/public")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        map_file = output_dir / "demo_stac_map.html"
        mapa.save(str(map_file))
        
        print(f"✅ Mapa salvo em: {map_file}")
        print(f"   Visualize em: http://localhost:3000/demo_stac_map.html")
    
    # Validar item
    print("\n6️⃣ Validando items STAC...")
    
    if sst_items:
        item_to_validate = sst_items[0]
        is_valid = manager.validate_item(item_to_validate)
        
        if is_valid:
            print(f"✅ Item {item_to_validate.id} é válido")
        else:
            print(f"❌ Item {item_to_validate.id} é inválido")
    
    # Processar com xarray
    print("\n7️⃣ Processamento com Xarray...")
    
    if sentinel_items:
        try:
            dataset = manager.process_with_xarray(
                items=sentinel_items[:3],
                bands=["red", "green", "blue"]
            )
            
            if dataset:
                print(f"✅ Dataset criado com sucesso")
                print(f"   Dimensões: {dict(dataset.dims)}")
                print(f"   Variáveis: {list(dataset.data_vars)}")
            else:
                print("⚠️ Não foi possível criar dataset")
                
        except Exception as e:
            print(f"⚠️ Erro no processamento: {e}")
    
    # Salvar catálogo local
    print("\n8️⃣ Salvando catálogo local...")
    
    catalog_dir = Path("data/stac_catalog")
    manager.save_catalog(catalog_dir)
    
    # Estatísticas finais
    print("\n" + "=" * 70)
    print("📊 ESTATÍSTICAS FINAIS")
    print("=" * 70)
    
    total_items = len(sst_items) + len(sentinel_items)
    
    print(f"\n✅ Total de items encontrados: {total_items}")
    print(f"   - SST: {len(sst_items)} items")
    print(f"   - Sentinel: {len(sentinel_items)} items")
    
    print(f"\n🌐 APIs STAC conectadas: {len(manager.clients)}")
    for client_name in manager.clients:
        print(f"   - {client_name}")
    
    print(f"\n📁 Coleções locais: {len(manager.collections)}")
    for col_name in manager.collections:
        print(f"   - {col_name}")
    
    print("\n" + "=" * 70)
    print("✅ Demonstração concluída com sucesso!")
    print("=" * 70)
    
    print("\n📚 Recursos criados:")
    print("1. Mapa interativo: admin-dashboard/public/demo_stac_map.html")
    print("2. Catálogo STAC: data/stac_catalog/")
    print("3. Configuração: config/stac/stac_config.json")
    
    print("\n🎯 Próximos passos:")
    print("1. Visualizar o mapa em http://localhost:3000/demo_stac_map.html")
    print("2. Explorar os exemplos em src/bgapp/stac/examples/")
    print("3. Integrar com a interface web existente")
    print("4. Configurar pipeline de processamento automático")


if __name__ == "__main__":
    demo_capabilities()
