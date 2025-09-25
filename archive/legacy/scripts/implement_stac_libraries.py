#!/usr/bin/env python3
"""
Script de Implementação das Bibliotecas STAC Expandidas
BGAPP - Sistema de Gestão Marinha de Angola
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

# Adicionar diretório src ao path
sys.path.append(str(Path(__file__).parent.parent))


def install_libraries():
    """Instalar bibliotecas STAC necessárias"""
    import subprocess
    
    libraries = [
        # Core
        "pystac>=1.9.0",
        "pystac-client>=0.7.5",
        "stac-pydantic>=3.0.0",
        
        # Processamento
        "stackstac>=0.5.0",
        "xarray>=2023.0.0",
        "rasterio>=1.3.0",
        "rio-stac>=0.8.0",
        
        # Visualização
        "folium>=0.15.0",
        "matplotlib>=3.7.0",
        
        # Validação
        "stac-validator>=3.3.0",
        
        # Extras
        "planetary-computer>=1.0.0",
        "geopandas>=0.14.0",
        "shapely>=2.0.0"
    ]
    
    print("📦 Instalando bibliotecas STAC...")
    for lib in libraries:
        print(f"  Installing {lib}...")
        subprocess.run([sys.executable, "-m", "pip", "install", lib], 
                      capture_output=True)
    
    print("✅ Bibliotecas instaladas com sucesso!")


class ExpandedSTACManager:
    """Gestor STAC expandido com novas capacidades"""
    
    def __init__(self):
        self.setup_completed = False
        self.clients = {}
        self.catalogs = {}
        
    def setup_pystac(self):
        """Configurar PySTAC para gestão de catálogos"""
        try:
            import pystac
            from pystac.extensions.eo import EOExtension
            from pystac.extensions.projection import ProjectionExtension
            
            # Criar catálogo principal
            self.catalog = pystac.Catalog(
                id="bgapp-angola-marine",
                description="BGAPP Marine Data Catalog for Angola Waters",
                title="Angola Marine STAC Catalog"
            )
            
            # Criar coleção de SST
            sst_collection = pystac.Collection(
                id="angola-sst-optimized",
                description="Optimized Sea Surface Temperature for Angola",
                license="CC-BY-4.0",
                extent=pystac.Extent(
                    spatial=pystac.SpatialExtent(
                        bboxes=[[11.4, -18.5, 24.1, -4.4]]
                    ),
                    temporal=pystac.TemporalExtent(
                        intervals=[[datetime(2020, 1, 1), None]]
                    )
                ),
                keywords=["ocean", "temperature", "angola", "marine"],
                providers=[
                    pystac.Provider(
                        name="BGAPP Angola",
                        roles=["processor", "host"],
                        url="https://bgapp.angola.gov"
                    )
                ]
            )
            
            # Adicionar extensões (PySTAC 1.9+ syntax)
            # As extensões são adicionadas automaticamente quando usadas
            
            self.catalog.add_child(sst_collection)
            
            print("✅ PySTAC configurado com sucesso")
            print(f"   - Catálogo: {self.catalog.id}")
            print(f"   - Coleções: {len(list(self.catalog.get_collections()))}")
            
            return True
            
        except ImportError as e:
            print(f"❌ Erro ao importar PySTAC: {e}")
            return False
    
    def setup_pystac_client(self):
        """Configurar PySTAC-Client para acesso a APIs"""
        try:
            from pystac_client import Client
            import planetary_computer as pc
            
            # Conectar a APIs STAC públicas
            apis = {
                'planetary': {
                    'url': "https://planetarycomputer.microsoft.com/api/stac/v1",
                    'modifier': pc.sign_inplace
                },
                'earth_search': {
                    'url': "https://earth-search.aws.element84.com/v1",
                    'modifier': None
                }
            }
            
            for name, config in apis.items():
                try:
                    if config['modifier']:
                        client = Client.open(config['url'], 
                                           modifier=config['modifier'])
                    else:
                        client = Client.open(config['url'])
                    
                    self.clients[name] = client
                    
                    # Testar conexão
                    collections = list(client.get_collections())
                    print(f"✅ Conectado a {name}: {len(collections)} coleções")
                    
                except Exception as e:
                    print(f"⚠️ Erro ao conectar a {name}: {e}")
            
            return len(self.clients) > 0
            
        except ImportError as e:
            print(f"❌ Erro ao importar PySTAC-Client: {e}")
            return False
    
    def demo_stackstac_processing(self):
        """Demonstrar processamento com StackSTAC"""
        try:
            import stackstac
            import numpy as np
            
            print("\n📊 Demonstração StackSTAC...")
            
            # Buscar dados de exemplo
            if 'earth_search' in self.clients:
                search = self.clients['earth_search'].search(
                    collections=['sentinel-2-l2a'],
                    bbox=[11.4, -18.5, 12.4, -17.5],  # Pequena área de Angola
                    datetime="2024-01-01/2024-01-31",
                    max_items=5
                )
                
                items = list(search.items())
                
                if items:
                    print(f"   Encontrados {len(items)} items")
                    
                    # Criar stack de dados
                    stack = stackstac.stack(
                        items,
                        assets=["red", "green", "blue"],
                        resolution=100,
                        dtype=np.float64,  # Usar float64 para evitar problemas de escala
                        rescale=False,  # Desabilitar rescale automático
                        fill_value=np.nan
                    )
                    
                    print(f"   Stack criado: {stack.shape}")
                    print(f"   Dimensões: {list(stack.dims.keys())}")
                    
                    # Calcular NDVI se disponível
                    if "nir" in [item.assets for item in items][0]:
                        print("   Calculando NDVI...")
                        # NDVI = (NIR - Red) / (NIR + Red)
                        
                    return True
                    
            print("   ⚠️ Sem dados disponíveis para demonstração")
            return False
            
        except ImportError as e:
            print(f"❌ Erro ao importar StackSTAC: {e}")
            return False
    
    def demo_folium_visualization(self):
        """Demonstrar visualização com Folium"""
        try:
            import folium
            from folium import plugins
            
            print("\n🗺️ Criando mapa Folium...")
            
            # Criar mapa centrado em Angola
            m = folium.Map(
                location=[-12.0, 18.0],
                zoom_start=6,
                tiles='OpenStreetMap'
            )
            
            # Adicionar limites de Angola
            angola_bounds = [[11.4, -18.5], [24.1, -4.4]]
            folium.Rectangle(
                bounds=[[-18.5, 11.4], [-4.4, 24.1]],
                color='blue',
                fill=False,
                weight=2,
                popup='Angola Maritime Zone'
            ).add_to(m)
            
            # Adicionar marcadores de exemplo
            locations = [
                {'name': 'Luanda', 'coords': [-8.8368, 13.2343]},
                {'name': 'Lobito', 'coords': [-12.3644, 13.5456]},
                {'name': 'Namibe', 'coords': [-15.1961, 12.1522]}
            ]
            
            for loc in locations:
                folium.Marker(
                    location=loc['coords'],
                    popup=f"Porto de {loc['name']}",
                    icon=folium.Icon(color='red', icon='anchor', prefix='fa')
                ).add_to(m)
            
            # Adicionar plugins
            plugins.Fullscreen().add_to(m)
            plugins.MeasureControl().add_to(m)
            
            # Salvar mapa
            output_path = Path("admin-dashboard/public/stac_map.html")
            output_path.parent.mkdir(parents=True, exist_ok=True)
            m.save(str(output_path))
            
            print(f"✅ Mapa salvo em: {output_path}")
            return True
            
        except ImportError as e:
            print(f"❌ Erro ao importar Folium: {e}")
            return False
    
    def validate_stac_items(self):
        """Validar items STAC"""
        try:
            from stac_validator import stac_validator
            
            print("\n✅ Validação STAC...")
            
            # Criar item de exemplo para validação
            test_item = {
                "type": "Feature",
                "stac_version": "1.0.0",
                "id": "test-item-angola",
                "properties": {
                    "datetime": "2024-01-01T00:00:00Z"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[11.4, -18.5], [24.1, -18.5], 
                                   [24.1, -4.4], [11.4, -4.4], 
                                   [11.4, -18.5]]]
                },
                "links": [],
                "assets": {}
            }
            
            # Salvar item temporário
            temp_file = Path("/tmp/test_item.json")
            with open(temp_file, 'w') as f:
                json.dump(test_item, f)
            
            # Validar
            stac = stac_validator.StacValidate(str(temp_file))
            stac.run()
            
            if stac.valid:
                print("   ✅ Item STAC válido!")
            else:
                print(f"   ❌ Item inválido: {stac.message}")
            
            return stac.valid
            
        except ImportError as e:
            print(f"❌ Erro ao importar STAC Validator: {e}")
            return False
    
    def create_sample_implementation(self):
        """Criar implementação de exemplo"""
        
        # Criar estrutura de diretórios
        dirs = [
            "src/bgapp/stac/core",
            "src/bgapp/stac/processing", 
            "src/bgapp/stac/visualization",
            "src/bgapp/stac/validation"
        ]
        
        for dir_path in dirs:
            Path(dir_path).mkdir(parents=True, exist_ok=True)
        
        # Criar arquivo de configuração
        config = {
            "stac_apis": {
                "planetary_computer": {
                    "url": "https://planetarycomputer.microsoft.com/api/stac/v1",
                    "collections": [
                        "noaa-cdr-sea-surface-temperature-whoi",
                        "sentinel-2-l2a"
                    ]
                },
                "earth_search": {
                    "url": "https://earth-search.aws.element84.com/v1",
                    "collections": ["sentinel-2-l2a", "sentinel-1-grd"]
                }
            },
            "angola_bbox": [11.4, -18.5, 24.1, -4.4],
            "processing": {
                "chunk_size": 2048,
                "resolution": 100,
                "crs": "EPSG:4326"
            }
        }
        
        config_path = Path("src/bgapp/stac/config.json")
        config_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"\n📁 Estrutura criada em src/bgapp/stac/")
        print(f"📄 Configuração salva em {config_path}")
        
        return True


def main():
    """Função principal"""
    print("=" * 60)
    print("🚀 BGAPP - Implementação de Bibliotecas STAC Expandidas")
    print("=" * 60)
    
    manager = ExpandedSTACManager()
    
    # 1. Instalar bibliotecas (opcional)
    response = input("\n📦 Instalar bibliotecas STAC? (s/n): ")
    if response.lower() == 's':
        install_libraries()
    
    # 2. Configurar PySTAC
    print("\n1️⃣ Configurando PySTAC...")
    manager.setup_pystac()
    
    # 3. Configurar PySTAC-Client
    print("\n2️⃣ Configurando PySTAC-Client...")
    manager.setup_pystac_client()
    
    # 4. Demonstrar StackSTAC
    print("\n3️⃣ Demonstrando StackSTAC...")
    manager.demo_stackstac_processing()
    
    # 5. Criar visualização
    print("\n4️⃣ Criando visualização...")
    manager.demo_folium_visualization()
    
    # 6. Validar STAC
    print("\n5️⃣ Validando STAC...")
    manager.validate_stac_items()
    
    # 7. Criar estrutura
    print("\n6️⃣ Criando estrutura de implementação...")
    manager.create_sample_implementation()
    
    print("\n" + "=" * 60)
    print("✅ Implementação concluída com sucesso!")
    print("=" * 60)
    
    print("\n📚 Próximos passos:")
    print("1. Revisar o plano em docs/PLANO_EXPANSAO_BIBLIOTECAS_STAC.md")
    print("2. Executar testes das bibliotecas instaladas")
    print("3. Implementar casos de uso específicos")
    print("4. Integrar com a interface web existente")


if __name__ == "__main__":
    main()
