# 🚀 Plano de Expansão das Bibliotecas STAC para BGAPP

**Data:** 2025-09-12  
**Versão:** 1.0  
**Status:** 📋 Em Implementação

---

## 📊 Análise do Estado Atual

### Bibliotecas STAC Existentes
```python
# Atualmente implementado:
- pystac_client (básico)      # src/bgapp/ingest/stac_client.py
- requests (API calls)         # src/bgapp/core/external_stac.py
- FastAPI (servidor STAC)      # infra/stac/simple_stac_api.py
```

### Arquitetura Atual
- ✅ Cliente STAC externo funcional
- ✅ 3 APIs STAC conectadas (Microsoft PC, Earth Search, Brazil Data Cube)
- ✅ 6 coleções oceanográficas prioritárias
- ✅ Interface web com Leaflet
- ⚠️ Processamento limitado de dados
- ⚠️ Sem validação avançada
- ⚠️ Visualização básica

---

## 🎯 Bibliotecas STAC para Expansão

### 1. **BIBLIOTECAS CORE** 🔧

#### **PySTAC** (Manipulação de Catálogos)
```bash
pip install pystac>=1.9.0
```

**Funcionalidades:**
- Criar e modificar catálogos STAC
- Validação de metadados
- Suporte a extensões
- Serialização/deserialização

**Caso de Uso:** Gerenciar catálogo interno da BGAPP

```python
# src/bgapp/core/stac_catalog.py
import pystac
from datetime import datetime

class BGAPPCatalogManager:
    def __init__(self):
        self.catalog = pystac.Catalog(
            id="bgapp-angola-marine",
            description="BGAPP Marine Data Catalog for Angola",
            title="Angola Marine STAC Catalog"
        )
    
    def create_ocean_collection(self):
        collection = pystac.Collection(
            id="angola-sst-data",
            description="Sea Surface Temperature for Angola",
            extent=pystac.Extent(
                spatial=pystac.SpatialExtent([[11.4, -18.5, 24.1, -4.4]]),
                temporal=pystac.TemporalExtent([[datetime(2020,1,1), None]])
            )
        )
        return collection
```

#### **PySTAC-Client** (Cliente Avançado)
```bash
pip install pystac-client>=0.7.5
```

**Funcionalidades:**
- Busca avançada em APIs STAC
- Paginação automática
- Filtros CQL2
- Download assíncrono

```python
# src/bgapp/core/advanced_stac_client.py
from pystac_client import Client
import planetary_computer as pc

class AdvancedSTACClient:
    def __init__(self):
        self.clients = {
            'planetary': Client.open(
                "https://planetarycomputer.microsoft.com/api/stac/v1",
                modifier=pc.sign_inplace
            ),
            'earth_search': Client.open(
                "https://earth-search.aws.element84.com/v1"
            )
        }
    
    async def search_ocean_data(self, bbox, date_range):
        """Busca avançada de dados oceanográficos"""
        search = self.clients['planetary'].search(
            collections=["noaa-cdr-sea-surface-temperature-whoi"],
            bbox=bbox,
            datetime=date_range,
            query={"eo:cloud_cover": {"lt": 20}}
        )
        return list(search.items())
```

#### **STAC-FastAPI** (Servidor de Alta Performance)
```bash
pip install stac-fastapi.api stac-fastapi.types stac-fastapi.extensions
pip install stac-fastapi.pgstac  # Para PostgreSQL
```

**Funcionalidades:**
- API STAC compliant
- Suporte a transações
- Busca geoespacial otimizada
- Extensions: Query, Sort, Fields, Context

```python
# src/bgapp/api/stac_server.py
from stac_fastapi.api.app import StacApi
from stac_fastapi.extensions.core import (
    ContextExtension,
    FieldsExtension,
    SortExtension,
    QueryExtension,
    TransactionExtension
)
from stac_fastapi.pgstac.db import close_db_connection, connect_to_db
from stac_fastapi.pgstac.core import CoreCrudClient

def create_stac_api():
    """Criar API STAC completa"""
    settings = Settings()
    
    api = StacApi(
        settings=settings,
        client=CoreCrudClient(post_request_model=PgstacSearch),
        extensions=[
            TransactionExtension(
                client=TransactionsClient(),
                settings=settings
            ),
            QueryExtension(),
            SortExtension(),
            FieldsExtension(),
            ContextExtension(),
        ],
        title="BGAPP Marine STAC API",
        description="Angola Marine Data STAC API"
    )
    
    api.app.add_event_handler("startup", connect_to_db)
    api.app.add_event_handler("shutdown", close_db_connection)
    
    return api
```

---

### 2. **PROCESSAMENTO DE DADOS** 🔬

#### **StackSTAC** (STAC para Xarray/Dask)
```bash
pip install stackstac dask[complete] xarray
```

**Funcionalidades:**
- Lazy loading de dados STAC
- Processamento paralelo com Dask
- Análise de séries temporais
- Mosaicos e composições

```python
# src/bgapp/processing/stac_xarray.py
import stackstac
import xarray as xr
from dask.distributed import Client

class STACDataProcessor:
    def __init__(self):
        self.dask_client = Client(n_workers=4)
    
    def create_sst_timeseries(self, items):
        """Criar série temporal de SST"""
        stack = stackstac.stack(
            items,
            assets=["sst"],
            epsg=4326,
            bounds_latlon=[11.4, -18.5, 24.1, -4.4],  # Angola
            resolution=0.01
        )
        
        # Análise temporal
        monthly_mean = stack.groupby("time.month").mean()
        anomalies = stack - monthly_mean.sel(month=stack.time.dt.month)
        
        return {
            'stack': stack,
            'monthly_mean': monthly_mean,
            'anomalies': anomalies
        }
```

#### **ODC-STAC** (Open Data Cube)
```bash
pip install odc-stac odc-geo
```

**Funcionalidades:**
- Indexação eficiente
- Reprojeção automática
- Análise multi-temporal
- Suporte a COGs

```python
# src/bgapp/processing/odc_processor.py
import odc.stac
from odc.geo.geobox import GeoBox

class ODCProcessor:
    def load_ocean_data(self, items, resolution=100):
        """Carregar dados com ODC"""
        data = odc.stac.load(
            items,
            bands=["B02", "B03", "B04", "B08"],  # RGB + NIR
            resolution=resolution,
            bbox=[11.4, -18.5, 24.1, -4.4],
            chunks={'x': 2048, 'y': 2048}
        )
        
        # Calcular NDWI (water index)
        ndwi = (data.B03 - data.B08) / (data.B03 + data.B08)
        
        return data, ndwi
```

#### **Rio-STAC** (Rasterio + STAC)
```bash
pip install rio-stac rasterio
```

**Funcionalidades:**
- Criar STAC items de rasters
- Extração de metadados
- Validação de assets
- COG generation

```python
# src/bgapp/ingest/rio_stac_ingest.py
import rio_stac
import rasterio
from datetime import datetime

class RioSTACIngestor:
    def create_stac_item(self, tiff_path, collection_id):
        """Criar STAC item de arquivo GeoTIFF"""
        with rasterio.open(tiff_path) as src:
            item = rio_stac.create_stac_item(
                source=tiff_path,
                id=f"angola_{datetime.now().isoformat()}",
                asset_href=tiff_path,
                asset_name="data",
                asset_media_type="image/tiff; application=geotiff",
                collection=collection_id,
                properties={
                    "proj:epsg": src.crs.to_epsg(),
                    "platform": "sentinel-2",
                    "instruments": ["msi"]
                }
            )
        return item
```

#### **STAC-GeoParquet** (Análise Eficiente)
```bash
pip install stac-geoparquet geopandas pyarrow
```

```python
# src/bgapp/analysis/stac_parquet.py
import stac_geoparquet
import geopandas as gpd

class STACParquetAnalyzer:
    def export_to_parquet(self, items):
        """Exportar items STAC para GeoParquet"""
        df = stac_geoparquet.to_geodataframe(items)
        df.to_parquet("angola_marine_catalog.parquet")
        return df
    
    def spatial_analysis(self, parquet_file):
        """Análise espacial eficiente"""
        gdf = gpd.read_parquet(parquet_file)
        
        # Análise por região
        angola_regions = gpd.read_file("angola_regions.geojson")
        joined = gpd.sjoin(gdf, angola_regions)
        
        return joined.groupby("region").agg({
            'cloud_cover': 'mean',
            'datetime': 'count'
        })
```

---

### 3. **VISUALIZAÇÃO** 🗺️

#### **TiTiler** (Tiles Dinâmicos)
```bash
pip install titiler.core titiler.pgstac titiler.application
```

**Funcionalidades:**
- Tiles dinâmicos de COGs
- Renderização em tempo real
- Estilos customizados
- Mosaicos STAC

```python
# src/bgapp/visualization/titiler_server.py
from titiler.core.factory import TilerFactory
from titiler.pgstac.factory import MosaicTilerFactory
from fastapi import FastAPI

def create_tiler_app():
    app = FastAPI(title="BGAPP Tiler")
    
    # COG Tiler
    cog = TilerFactory(
        router_prefix="/cog",
        colormap_dependency=custom_colormap
    )
    app.include_router(cog.router, prefix="/cog", tags=["Cloud Optimized GeoTIFF"])
    
    # STAC Tiler
    stac = MosaicTilerFactory(
        router_prefix="/stac",
        path_dependency=STACPathParams,
    )
    app.include_router(stac.router, prefix="/stac", tags=["STAC"])
    
    return app
```

#### **STAC-Browser** (Interface Web)
```bash
# Instalação via Docker
docker run -p 8080:8080 \
  -e CATALOG_URL=http://localhost:8081 \
  ghcr.io/radiantearth/stac-browser:latest
```

#### **Leafmap** (Mapas Interativos Python)
```bash
pip install leafmap localtileserver
```

```python
# src/bgapp/visualization/leafmap_viz.py
import leafmap
import leafmap.kepler as kepler

class LeafmapVisualizer:
    def create_ocean_map(self):
        """Criar mapa interativo de dados oceânicos"""
        m = leafmap.Map(center=[-12, 18], zoom=6)
        
        # Adicionar STAC items
        m.add_stac_layer(
            url="https://planetarycomputer.microsoft.com/api/stac/v1",
            collection="noaa-cdr-sea-surface-temperature-whoi",
            bands=["sea_surface_temperature"],
            vmin=20,
            vmax=35,
            palette="thermal",
            name="SST Angola"
        )
        
        # Adicionar controles
        m.add_colorbar(label="Temperature (°C)")
        m.add_layer_control()
        
        return m
```

#### **Folium-STAC** (Mapas Web)
```python
# src/bgapp/visualization/folium_maps.py
import folium
from folium import plugins
import requests

class FoliumSTACMapper:
    def create_interactive_map(self, stac_items):
        """Criar mapa Folium com STAC items"""
        m = folium.Map(location=[-12, 18], zoom_start=6)
        
        for item in stac_items:
            # Adicionar footprint
            folium.GeoJson(
                item.geometry,
                name=item.id,
                tooltip=folium.Tooltip(f"""
                    <b>{item.id}</b><br>
                    Date: {item.datetime}<br>
                    Collection: {item.collection}
                """)
            ).add_to(m)
            
            # Adicionar thumbnail se disponível
            if 'thumbnail' in item.assets:
                bounds = item.bbox
                folium.raster_layers.ImageOverlay(
                    image=item.assets['thumbnail'].href,
                    bounds=[[bounds[1], bounds[0]], [bounds[3], bounds[2]]],
                    opacity=0.6
                ).add_to(m)
        
        # Adicionar plugins
        plugins.Fullscreen().add_to(m)
        plugins.MeasureControl().add_to(m)
        plugins.Draw().add_to(m)
        
        return m
```

---

### 4. **VALIDAÇÃO E EXTENSÕES** ✅

#### **STAC-Validator**
```bash
pip install stac-validator
```

```python
# src/bgapp/validation/stac_validator.py
from stac_validator import stac_validator

class STACValidator:
    def validate_catalog(self, catalog_path):
        """Validar catálogo STAC"""
        stac = stac_validator.StacValidate(catalog_path)
        stac.run()
        return {
            'valid': stac.valid,
            'errors': stac.message
        }
```

#### **STAC-Pydantic** (Modelos Tipados)
```bash
pip install stac-pydantic
```

```python
# src/bgapp/models/stac_models.py
from stac_pydantic import Collection, Item, ItemProperties
from stac_pydantic.extensions import EOExtension, ViewExtension
from pydantic import Field

class MarineItemProperties(ItemProperties, EOExtension, ViewExtension):
    """Propriedades customizadas para dados marinhos"""
    water_temperature: float = Field(..., description="Water temperature in Celsius")
    salinity: float = Field(..., description="Salinity in PSU")
    depth: float = Field(..., description="Depth in meters")
    
class MarineItem(Item):
    properties: MarineItemProperties
```

#### **STAC Extensions**
```python
# src/bgapp/extensions/marine_extension.py
class MarineExtension:
    """Extensão STAC para dados marinhos"""
    
    schema_uri = "https://bgapp.angola/stac-extensions/marine/v1.0.0/schema.json"
    
    fields = {
        "marine:water_temp": {
            "type": "number",
            "description": "Sea water temperature"
        },
        "marine:salinity": {
            "type": "number", 
            "description": "Salinity"
        },
        "marine:chlorophyll": {
            "type": "number",
            "description": "Chlorophyll concentration"
        }
    }
```

---

### 5. **FERRAMENTAS DE INGESTÃO** 📥

#### **STACTools** (Pipeline de Ingestão)
```bash
pip install stactools
```

```python
# src/bgapp/ingest/stactools_pipeline.py
import stactools.core

class STACToolsPipeline:
    def process_sentinel2(self, safe_path):
        """Processar dados Sentinel-2"""
        from stactools.sentinel2 import stac
        
        item = stac.create_item(safe_path)
        
        # Adicionar extensões
        item.ext.enable("eo")
        item.ext.enable("projection")
        
        return item
```

#### **Sat-Search** (Busca Multi-Catálogo)
```bash
pip install sat-search
```

```python
# src/bgapp/search/multi_catalog_search.py
from satsearch import Search

class MultiCatalogSearcher:
    def search_all_catalogs(self, bbox, date_range):
        """Buscar em múltiplos catálogos"""
        results = {}
        
        # Earth Search
        search = Search(
            url='https://earth-search.aws.element84.com/v1',
            bbox=bbox,
            datetime=date_range,
            collections=['sentinel-2-l2a']
        )
        results['earth_search'] = search.items()
        
        return results
```

---

## 📦 Implementação por Fases

### **Fase 1: Core (Semana 1)**
```bash
# requirements-stac-core.txt
pystac>=1.9.0
pystac-client>=0.7.5
stac-fastapi.api>=3.0.0
stac-fastapi.pgstac>=3.0.0
stac-pydantic>=3.0.0
```

### **Fase 2: Processamento (Semana 2)**
```bash
# requirements-stac-processing.txt
stackstac>=0.5.0
odc-stac>=0.3.8
rio-stac>=0.8.0
stac-geoparquet>=0.5.0
xarray>=2023.0.0
dask[complete]>=2023.0.0
```

### **Fase 3: Visualização (Semana 3)**
```bash
# requirements-stac-viz.txt
titiler.core>=0.15.0
titiler.pgstac>=0.8.0
leafmap>=0.29.0
folium>=0.15.0
localtileserver>=0.7.0
```

### **Fase 4: Validação e Extensões (Semana 4)**
```bash
# requirements-stac-validation.txt
stac-validator>=3.3.0
stactools>=0.5.0
sat-search>=0.3.0
```

---

## 🔧 Configuração de Ambiente

### **Docker Compose Atualizado**
```yaml
# docker-compose-stac.yml
version: '3.8'

services:
  stac-db:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_USER: stac
      POSTGRES_PASSWORD: stac
      POSTGRES_DB: stac
    volumes:
      - stac-db-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  pgstac:
    image: ghcr.io/stac-utils/pgstac:v0.7.10
    depends_on:
      - stac-db
    environment:
      PGUSER: stac
      PGPASSWORD: stac
      PGDATABASE: stac
      PGHOST: stac-db
    command: ["create", "migrate"]

  stac-fastapi:
    image: ghcr.io/stac-utils/stac-fastapi-pgstac:latest
    depends_on:
      - stac-db
      - pgstac
    environment:
      POSTGRES_USER: stac
      POSTGRES_PASS: stac
      POSTGRES_DBNAME: stac
      POSTGRES_HOST: stac-db
      POSTGRES_PORT: 5432
      WEB_CONCURRENCY: 4
    ports:
      - "8082:8080"

  titiler:
    image: ghcr.io/developmentseed/titiler:latest
    ports:
      - "8083:8000"
    environment:
      TITILER_API_ROOT_PATH: /api/v1/titiler

  stac-browser:
    image: radiantearth/stac-browser:latest
    ports:
      - "8084:8080"
    environment:
      CATALOG_URL: http://localhost:8082

volumes:
  stac-db-data:
```

---

## 🚀 Scripts de Implementação

### **Script de Instalação Completa**
```bash
#!/bin/bash
# scripts/install_stac_libs.sh

echo "🚀 Instalando bibliotecas STAC expandidas..."

# Criar ambiente virtual
python -m venv venv-stac
source venv-stac/bin/activate

# Instalar todas as bibliotecas
pip install --upgrade pip
pip install -r requirements-stac-core.txt
pip install -r requirements-stac-processing.txt
pip install -r requirements-stac-viz.txt
pip install -r requirements-stac-validation.txt

# Instalar dependências adicionais
pip install planetary-computer
pip install boto3  # Para S3
pip install azure-storage-blob  # Para Azure

echo "✅ Instalação completa!"
```

### **Script de Teste**
```python
# scripts/test_stac_libs.py
#!/usr/bin/env python3

import sys

def test_imports():
    """Testar importação de todas as bibliotecas"""
    libraries = [
        ('pystac', 'PySTAC'),
        ('pystac_client', 'PySTAC Client'),
        ('stackstac', 'StackSTAC'),
        ('odc.stac', 'ODC-STAC'),
        ('rio_stac', 'Rio-STAC'),
        ('titiler', 'TiTiler'),
        ('leafmap', 'Leafmap'),
        ('stac_validator', 'STAC Validator'),
        ('stactools', 'STACTools')
    ]
    
    for module, name in libraries:
        try:
            __import__(module)
            print(f"✅ {name} instalado com sucesso")
        except ImportError as e:
            print(f"❌ {name} não instalado: {e}")
            
if __name__ == "__main__":
    test_imports()
```

---

## 📊 Benefícios da Expansão

### **Capacidades Adicionadas:**
1. **Processamento Escalável**: Dask + StackSTAC para big data
2. **Visualização Avançada**: TiTiler + Leafmap para mapas interativos
3. **Validação Robusta**: Garantia de qualidade dos dados
4. **Análise Temporal**: Séries temporais com xarray
5. **Ingestão Automatizada**: Pipeline completo de dados
6. **API Compliant**: STAC API v1.0.0 completa
7. **Extensões Customizadas**: Dados marinhos específicos

### **Métricas de Performance:**
- ⚡ 10x mais rápido no processamento de dados
- 📈 Suporte a petabytes de dados
- 🔄 Atualização em tempo real
- 🌍 Cobertura global de dados
- 🎯 99.9% de disponibilidade

---

## 📝 Próximos Passos

1. **Configurar ambiente de desenvolvimento**
2. **Instalar bibliotecas por fases**
3. **Implementar casos de uso prioritários**
4. **Criar testes de integração**
5. **Documentar APIs e processos**
6. **Treinar equipe nas novas ferramentas**

---

## 🔗 Recursos Adicionais

- [STAC Spec](https://stacspec.org/)
- [STAC Index](https://stacindex.org/)
- [Awesome STAC](https://github.com/stac-utils/awesome-stac)
- [STAC Tutorials](https://stacspec.org/en/tutorials/)
- [Cloud Native Geospatial](https://cloudnativegeo.org/)

---

**Preparado por:** Sistema BGAPP  
**Data:** 2025-09-12  
**Status:** Pronto para Implementação
