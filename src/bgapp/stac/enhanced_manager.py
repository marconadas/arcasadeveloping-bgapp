"""
Gestor STAC Aprimorado com Bibliotecas Expandidas
BGAPP - Sistema de Gestão Marinha de Angola
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import folium
import pystac
import xarray as xr
from pystac_client import Client
from shapely.geometry import box, shape

try:
    import planetary_computer as pc
    PC_AVAILABLE = True
except ImportError:
    PC_AVAILABLE = False


class EnhancedSTACManager:
    """Gestor STAC com capacidades expandidas"""
    
    def __init__(self, config_path: Optional[Path] = None):
        """
        Inicializar gestor STAC aprimorado
        
        Args:
            config_path: Caminho para arquivo de configuração
        """
        self.config = self._load_config(config_path)
        self.clients = {}
        self.catalog = None
        self.collections = {}
        self._setup_clients()
        self._setup_catalog()
    
    def _load_config(self, config_path: Optional[Path] = None) -> Dict:
        """Carregar configuração"""
        if config_path and config_path.exists():
            with open(config_path) as f:
                return json.load(f)
        
        # Configuração padrão
        return {
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
                        "collections": ["sentinel-2-l2a", "sentinel-1-grd"],
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
                }
            }
        }
    
    def _setup_clients(self):
        """Configurar clientes STAC"""
        for name, api_config in self.config["stac"]["apis"].items():
            if not api_config.get("enabled", True):
                continue
                
            try:
                if name == "planetary_computer" and PC_AVAILABLE:
                    self.clients[name] = Client.open(
                        api_config["url"],
                        modifier=pc.sign_inplace
                    )
                else:
                    self.clients[name] = Client.open(api_config["url"])
                
                print(f"✅ Cliente STAC '{name}' configurado")
                
            except Exception as e:
                print(f"❌ Erro ao configurar cliente '{name}': {e}")
    
    def _setup_catalog(self):
        """Configurar catálogo PySTAC local"""
        self.catalog = pystac.Catalog(
            id="bgapp-angola-marine",
            description="BGAPP Marine Data Catalog for Angola",
            title="Angola Marine STAC Catalog"
        )
        
        # Criar coleções principais
        self._create_sst_collection()
        self._create_sentinel_collection()
    
    def _create_sst_collection(self):
        """Criar coleção SST"""
        bbox = self.config["stac"]["angola"]["bbox"]
        
        sst_collection = pystac.Collection(
            id="angola-sst-optimized",
            description="Sea Surface Temperature data for Angola waters",
            license="CC-BY-4.0",
            extent=pystac.Extent(
                spatial=pystac.SpatialExtent(bboxes=[bbox]),
                temporal=pystac.TemporalExtent(
                    intervals=[[datetime(2020, 1, 1), None]]
                )
            ),
            keywords=["ocean", "temperature", "angola", "sst", "marine"],
            providers=[
                pystac.Provider(
                    name="BGAPP Angola",
                    roles=["processor", "host"],
                    url="https://bgapp.angola.gov"
                )
            ]
        )
        
        self.catalog.add_child(sst_collection)
        self.collections["sst"] = sst_collection
    
    def _create_sentinel_collection(self):
        """Criar coleção Sentinel"""
        bbox = self.config["stac"]["angola"]["bbox"]
        
        sentinel_collection = pystac.Collection(
            id="angola-sentinel-marine",
            description="Sentinel satellite data for Angola marine monitoring",
            license="CC-BY-4.0",
            extent=pystac.Extent(
                spatial=pystac.SpatialExtent(bboxes=[bbox]),
                temporal=pystac.TemporalExtent(
                    intervals=[[datetime(2017, 1, 1), None]]
                )
            ),
            keywords=["sentinel", "satellite", "angola", "marine", "coastal"],
            providers=[
                pystac.Provider(
                    name="ESA",
                    roles=["producer"],
                    url="https://www.esa.int/"
                ),
                pystac.Provider(
                    name="BGAPP Angola",
                    roles=["processor", "host"],
                    url="https://bgapp.angola.gov"
                )
            ]
        )
        
        self.catalog.add_child(sentinel_collection)
        self.collections["sentinel"] = sentinel_collection
    
    def search_ocean_data(
        self,
        collections: List[str],
        date_range: Optional[str] = None,
        bbox: Optional[List[float]] = None,
        max_items: int = 10
    ) -> List[pystac.Item]:
        """
        Buscar dados oceânicos
        
        Args:
            collections: Lista de coleções para buscar
            date_range: Intervalo de datas (ISO format)
            bbox: Bounding box [west, south, east, north]
            max_items: Número máximo de items
            
        Returns:
            Lista de items STAC
        """
        if bbox is None:
            bbox = self.config["stac"]["angola"]["bbox"]
        
        if date_range is None:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            date_range = f"{start_date.isoformat()}/{end_date.isoformat()}"
        
        all_items = []
        
        for client_name, client in self.clients.items():
            try:
                # Verificar quais coleções estão disponíveis
                available = [c.id for c in client.get_collections()]
                search_collections = [c for c in collections if c in available]
                
                if not search_collections:
                    continue
                
                search = client.search(
                    collections=search_collections,
                    bbox=bbox,
                    datetime=date_range,
                    max_items=max_items
                )
                
                items = list(search.items())
                all_items.extend(items)
                
                print(f"  📊 {client_name}: {len(items)} items encontrados")
                
            except Exception as e:
                print(f"  ❌ Erro ao buscar em {client_name}: {e}")
        
        return all_items
    
    def search_sst_data(
        self,
        date_range: Optional[str] = None,
        bbox: Optional[List[float]] = None
    ) -> List[pystac.Item]:
        """
        Buscar dados de temperatura da superfície do mar
        
        Args:
            date_range: Intervalo de datas
            bbox: Bounding box
            
        Returns:
            Lista de items SST
        """
        sst_collections = [
            "noaa-cdr-sea-surface-temperature-whoi",
            "noaa-cdr-sea-surface-temperature-optimum-interpolation",
            "sentinel-3-slstr-wst-l2-netcdf"
        ]
        
        return self.search_ocean_data(
            collections=sst_collections,
            date_range=date_range,
            bbox=bbox
        )
    
    def search_sentinel_data(
        self,
        date_range: Optional[str] = None,
        bbox: Optional[List[float]] = None,
        cloud_cover: Optional[int] = 20
    ) -> List[pystac.Item]:
        """
        Buscar dados Sentinel
        
        Args:
            date_range: Intervalo de datas
            bbox: Bounding box
            cloud_cover: Cobertura máxima de nuvens (%)
            
        Returns:
            Lista de items Sentinel
        """
        if bbox is None:
            bbox = self.config["stac"]["angola"]["bbox"]
        
        items = []
        
        for client_name, client in self.clients.items():
            try:
                search = client.search(
                    collections=["sentinel-2-l2a"],
                    bbox=bbox,
                    datetime=date_range,
                    query={"eo:cloud_cover": {"lt": cloud_cover}} if cloud_cover else None,
                    max_items=10
                )
                
                items.extend(list(search.items()))
                
            except Exception:
                pass
        
        return items
    
    def create_interactive_map(
        self,
        items: Optional[List[pystac.Item]] = None,
        show_ports: bool = True
    ) -> folium.Map:
        """
        Criar mapa interativo com dados STAC
        
        Args:
            items: Items STAC para visualizar
            show_ports: Mostrar portos principais
            
        Returns:
            Mapa Folium
        """
        # Criar mapa base
        center = [-12.0, 18.0]  # Centro de Angola
        m = folium.Map(
            location=center,
            zoom_start=6,
            tiles='OpenStreetMap'
        )
        
        # Adicionar limites de Angola
        bbox = self.config["stac"]["angola"]["bbox"]
        folium.Rectangle(
            bounds=[[bbox[1], bbox[0]], [bbox[3], bbox[2]]],
            color='blue',
            fill=False,
            weight=2,
            popup='Zona Econômica Exclusiva de Angola',
            tooltip='ZEE Angola'
        ).add_to(m)
        
        # Adicionar portos se solicitado
        if show_ports:
            for port in self.config["stac"]["angola"]["major_ports"]:
                folium.Marker(
                    location=port["coords"],
                    popup=f"Porto de {port['name']}",
                    tooltip=port["name"],
                    icon=folium.Icon(color='red', icon='anchor', prefix='fa')
                ).add_to(m)
        
        # Adicionar items STAC se fornecidos
        if items:
            for item in items:
                # Adicionar footprint do item
                if item.geometry:
                    folium.GeoJson(
                        item.geometry,
                        name=item.id,
                        style_function=lambda x: {
                            'fillColor': 'green',
                            'color': 'green',
                            'weight': 1,
                            'fillOpacity': 0.1
                        },
                        tooltip=folium.Tooltip(f"""
                            <b>{item.id}</b><br>
                            Collection: {item.collection_id}<br>
                            Date: {item.datetime}
                        """)
                    ).add_to(m)
        
        # Adicionar controles
        folium.LayerControl().add_to(m)
        
        # Adicionar plugins
        from folium import plugins
        plugins.Fullscreen().add_to(m)
        plugins.MeasureControl().add_to(m)
        plugins.MousePosition().add_to(m)
        
        return m
    
    def process_with_xarray(
        self,
        items: List[pystac.Item],
        bands: Optional[List[str]] = None
    ) -> Optional[xr.Dataset]:
        """
        Processar items STAC com xarray
        
        Args:
            items: Items STAC para processar
            bands: Bandas para extrair
            
        Returns:
            Dataset xarray ou None
        """
        try:
            import stackstac
            
            if not items:
                return None
            
            # Criar stack de dados
            stack = stackstac.stack(
                items,
                assets=bands,
                resolution=100,
                bounds_latlon=self.config["stac"]["angola"]["bbox"],
                dtype="float64",
                rescale=False
            )
            
            # Converter para dataset
            ds = stack.to_dataset(dim="band")
            
            return ds
            
        except ImportError:
            print("❌ StackSTAC não disponível")
            return None
        except Exception as e:
            print(f"❌ Erro ao processar com xarray: {e}")
            return None
    
    def validate_item(self, item: Union[pystac.Item, Dict]) -> bool:
        """
        Validar item STAC
        
        Args:
            item: Item STAC ou dicionário
            
        Returns:
            True se válido
        """
        try:
            from stac_validator import stac_validator
            
            # Converter para JSON se necessário
            if isinstance(item, pystac.Item):
                item_dict = item.to_dict()
            else:
                item_dict = item
            
            # Salvar temporariamente
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json') as f:
                json.dump(item_dict, f)
                f.flush()
                
                # Validar
                stac = stac_validator.StacValidate(f.name)
                stac.run()
                
                return stac.valid
                
        except ImportError:
            print("⚠️ STAC Validator não disponível")
            return True
        except Exception as e:
            print(f"❌ Erro na validação: {e}")
            return False
    
    def get_collections_summary(self) -> Dict[str, Any]:
        """
        Obter resumo das coleções disponíveis
        
        Returns:
            Resumo das coleções
        """
        summary = {
            "local_catalog": {
                "id": self.catalog.id,
                "collections": len(list(self.catalog.get_collections())),
                "items": len(list(self.catalog.get_items(recursive=True)))
            },
            "remote_apis": {}
        }
        
        for name, client in self.clients.items():
            try:
                collections = list(client.get_collections())
                
                # Filtrar coleções relevantes
                ocean_keywords = ['ocean', 'sea', 'marine', 'sst', 'chlorophyll', 'sentinel']
                relevant = [
                    c for c in collections
                    if any(k in c.id.lower() for k in ocean_keywords)
                ]
                
                summary["remote_apis"][name] = {
                    "url": self.config["stac"]["apis"][name]["url"],
                    "total_collections": len(collections),
                    "ocean_collections": len(relevant),
                    "collections": [c.id for c in relevant[:10]]
                }
                
            except Exception as e:
                summary["remote_apis"][name] = {
                    "error": str(e)
                }
        
        return summary
    
    def save_catalog(self, output_dir: Path):
        """
        Salvar catálogo local
        
        Args:
            output_dir: Diretório de saída
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Normalizar e salvar
        self.catalog.normalize_hrefs(str(output_dir))
        self.catalog.save(catalog_type=pystac.CatalogType.SELF_CONTAINED)
        
        print(f"✅ Catálogo salvo em {output_dir}")


# Instância singleton
enhanced_stac_manager = None


def get_enhanced_manager(config_path: Optional[Path] = None) -> EnhancedSTACManager:
    """
    Obter instância do gestor STAC aprimorado
    
    Args:
        config_path: Caminho para configuração
        
    Returns:
        Instância do gestor
    """
    global enhanced_stac_manager
    
    if enhanced_stac_manager is None:
        enhanced_stac_manager = EnhancedSTACManager(config_path)
    
    return enhanced_stac_manager
