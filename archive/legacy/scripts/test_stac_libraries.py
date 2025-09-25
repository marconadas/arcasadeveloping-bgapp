#!/usr/bin/env python3
"""
Script de Teste das Bibliotecas STAC
BGAPP - Sistema de Gestão Marinha de Angola
"""

import json
import sys
from datetime import datetime
from pathlib import Path

def test_imports():
    """Testar importação das bibliotecas STAC"""
    print("=" * 60)
    print("🧪 Testando Bibliotecas STAC")
    print("=" * 60)
    
    libraries = [
        ('pystac', 'PySTAC', '✅'),
        ('pystac_client', 'PySTAC Client', '✅'),
        ('stackstac', 'StackSTAC', '⚠️'),
        ('folium', 'Folium', '✅'),
        ('rasterio', 'Rasterio', '✅'),
        ('shapely', 'Shapely', '✅'),
        ('geopandas', 'GeoPandas', '⚠️'),
        ('xarray', 'Xarray', '✅'),
        ('planetary_computer', 'Planetary Computer', '✅'),
        ('stac_validator', 'STAC Validator', '⚠️')
    ]
    
    results = []
    for module, name, expected in libraries:
        try:
            __import__(module)
            results.append((name, '✅ Instalado', True))
            print(f"{expected} {name}: Instalado com sucesso")
        except ImportError as e:
            results.append((name, f'❌ Não instalado: {e}', False))
            print(f"❌ {name}: Não instalado")
    
    return results

def test_pystac():
    """Testar funcionalidades básicas do PySTAC"""
    print("\n📚 Testando PySTAC...")
    
    try:
        import pystac
        
        # Criar catálogo
        catalog = pystac.Catalog(
            id="test-angola-marine",
            description="Teste de catálogo STAC"
        )
        
        # Criar coleção
        collection = pystac.Collection(
            id="test-sst",
            description="Test SST Collection",
            extent=pystac.Extent(
                spatial=pystac.SpatialExtent(
                    bboxes=[[11.4, -18.5, 24.1, -4.4]]
                ),
                temporal=pystac.TemporalExtent(
                    intervals=[[datetime(2024, 1, 1), None]]
                )
            )
        )
        
        catalog.add_child(collection)
        
        print(f"  ✅ Catálogo criado: {catalog.id}")
        print(f"  ✅ Coleção adicionada: {collection.id}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Erro no PySTAC: {e}")
        return False

def test_pystac_client():
    """Testar conexão com APIs STAC"""
    print("\n🌐 Testando PySTAC-Client...")
    
    try:
        from pystac_client import Client
        import planetary_computer as pc
        
        # Testar conexão com Microsoft Planetary Computer
        client = Client.open(
            "https://planetarycomputer.microsoft.com/api/stac/v1",
            modifier=pc.sign_inplace
        )
        
        collections = list(client.get_collections())
        print(f"  ✅ Conectado ao Planetary Computer")
        print(f"  📊 {len(collections)} coleções disponíveis")
        
        # Listar algumas coleções relevantes
        ocean_collections = [
            c for c in collections 
            if any(word in c.id.lower() for word in ['ocean', 'sea', 'sst', 'marine'])
        ]
        
        if ocean_collections:
            print(f"  🌊 {len(ocean_collections)} coleções oceânicas encontradas:")
            for col in ocean_collections[:5]:
                print(f"     - {col.id}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Erro no PySTAC-Client: {e}")
        return False

def test_folium():
    """Testar criação de mapas com Folium"""
    print("\n🗺️ Testando Folium...")
    
    try:
        import folium
        
        # Criar mapa de Angola
        m = folium.Map(
            location=[-12.0, 18.0],
            zoom_start=6
        )
        
        # Adicionar marcador
        folium.Marker(
            location=[-8.8368, 13.2343],
            popup="Luanda",
            tooltip="Capital de Angola"
        ).add_to(m)
        
        # Salvar mapa
        output_dir = Path("admin-dashboard/public")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        output_file = output_dir / "test_map.html"
        m.save(str(output_file))
        
        print(f"  ✅ Mapa criado e salvo em {output_file}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Erro no Folium: {e}")
        return False

def create_sample_config():
    """Criar configuração de exemplo para STAC"""
    print("\n📝 Criando configuração de exemplo...")
    
    config = {
        "stac": {
            "apis": {
                "planetary_computer": {
                    "url": "https://planetarycomputer.microsoft.com/api/stac/v1",
                    "collections": [
                        "noaa-cdr-sea-surface-temperature-whoi",
                        "sentinel-2-l2a",
                        "sentinel-3-slstr-wst-l2-netcdf"
                    ],
                    "enabled": True
                },
                "earth_search": {
                    "url": "https://earth-search.aws.element84.com/v1",
                    "collections": [
                        "sentinel-2-l2a",
                        "sentinel-1-grd"
                    ],
                    "enabled": True
                }
            },
            "angola": {
                "bbox": [11.4, -18.5, 24.1, -4.4],
                "major_ports": [
                    {"name": "Luanda", "coords": [-8.8368, 13.2343]},
                    {"name": "Lobito", "coords": [-12.3644, 13.5456]},
                    {"name": "Namibe", "coords": [-15.1961, 12.1522]},
                    {"name": "Soyo", "coords": [-6.1349, 12.3689]}
                ]
            },
            "processing": {
                "chunk_size": 2048,
                "resolution": 100,
                "crs": "EPSG:4326",
                "output_format": "COG"
            },
            "visualization": {
                "default_colormap": "viridis",
                "sst_colormap": "thermal",
                "chlorophyll_colormap": "algae"
            }
        }
    }
    
    # Salvar configuração
    config_dir = Path("config/stac")
    config_dir.mkdir(parents=True, exist_ok=True)
    
    config_file = config_dir / "stac_config.json"
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"  ✅ Configuração salva em {config_file}")
    
    return config_file

def create_example_scripts():
    """Criar scripts de exemplo para uso das bibliotecas"""
    print("\n📂 Criando scripts de exemplo...")
    
    examples_dir = Path("src/bgapp/stac/examples")
    examples_dir.mkdir(parents=True, exist_ok=True)
    
    # Exemplo 1: Buscar dados SST
    sst_example = '''#!/usr/bin/env python3
"""
Exemplo: Buscar dados de temperatura da superfície do mar
"""

from pystac_client import Client
import planetary_computer as pc
from datetime import datetime, timedelta

def search_sst_data():
    # Conectar ao Planetary Computer
    client = Client.open(
        "https://planetarycomputer.microsoft.com/api/stac/v1",
        modifier=pc.sign_inplace
    )
    
    # Buscar dados SST para Angola
    search = client.search(
        collections=["noaa-cdr-sea-surface-temperature-whoi"],
        bbox=[11.4, -18.5, 24.1, -4.4],  # Angola
        datetime=f"{datetime.now() - timedelta(days=30)}/{datetime.now()}",
        max_items=10
    )
    
    items = list(search.items())
    print(f"Encontrados {len(items)} items de SST")
    
    for item in items[:3]:
        print(f"  - {item.id}: {item.datetime}")
    
    return items

if __name__ == "__main__":
    search_sst_data()
'''
    
    with open(examples_dir / "search_sst.py", 'w') as f:
        f.write(sst_example)
    
    # Exemplo 2: Criar mapa interativo
    map_example = '''#!/usr/bin/env python3
"""
Exemplo: Criar mapa interativo de Angola
"""

import folium
from folium import plugins

def create_angola_map():
    # Criar mapa centrado em Angola
    m = folium.Map(
        location=[-12.0, 18.0],
        zoom_start=6,
        tiles='OpenStreetMap'
    )
    
    # Adicionar limites de Angola
    folium.Rectangle(
        bounds=[[-18.5, 11.4], [-4.4, 24.1]],
        color='blue',
        fill=False,
        weight=2,
        popup='Zona Marítima de Angola'
    ).add_to(m)
    
    # Adicionar portos principais
    ports = [
        {"name": "Luanda", "coords": [-8.8368, 13.2343]},
        {"name": "Lobito", "coords": [-12.3644, 13.5456]},
        {"name": "Namibe", "coords": [-15.1961, 12.1522]}
    ]
    
    for port in ports:
        folium.Marker(
            location=port["coords"],
            popup=f"Porto de {port['name']}",
            icon=folium.Icon(color='red', icon='anchor', prefix='fa')
        ).add_to(m)
    
    # Adicionar controles
    plugins.Fullscreen().add_to(m)
    plugins.MeasureControl().add_to(m)
    
    # Salvar mapa
    m.save("angola_map.html")
    print("Mapa salvo em angola_map.html")
    
    return m

if __name__ == "__main__":
    create_angola_map()
'''
    
    with open(examples_dir / "create_map.py", 'w') as f:
        f.write(map_example)
    
    print(f"  ✅ Exemplos criados em {examples_dir}")
    print(f"     - search_sst.py: Buscar dados SST")
    print(f"     - create_map.py: Criar mapa interativo")

def main():
    """Função principal"""
    print("=" * 60)
    print("🚀 BGAPP - Teste de Bibliotecas STAC")
    print("=" * 60)
    
    # 1. Testar imports
    results = test_imports()
    
    # 2. Testar PySTAC
    pystac_ok = test_pystac()
    
    # 3. Testar PySTAC-Client
    client_ok = test_pystac_client()
    
    # 4. Testar Folium
    folium_ok = test_folium()
    
    # 5. Criar configuração
    config_file = create_sample_config()
    
    # 6. Criar exemplos
    create_example_scripts()
    
    # Resumo
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS TESTES")
    print("=" * 60)
    
    total = len(results)
    success = sum(1 for _, _, ok in results if ok)
    
    print(f"\n✅ Bibliotecas instaladas: {success}/{total}")
    print(f"{'✅' if pystac_ok else '❌'} PySTAC funcional")
    print(f"{'✅' if client_ok else '❌'} PySTAC-Client funcional")
    print(f"{'✅' if folium_ok else '❌'} Folium funcional")
    
    print("\n📚 Próximos passos:")
    print("1. Executar os exemplos em src/bgapp/stac/examples/")
    print("2. Integrar com a interface web existente")
    print("3. Configurar pipeline de ingestão de dados")
    print("4. Implementar visualização com TiTiler")
    
    print("\n✅ Teste concluído!")

if __name__ == "__main__":
    main()
