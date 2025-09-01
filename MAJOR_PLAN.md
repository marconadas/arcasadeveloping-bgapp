# Plataforma Open Source para Biomassa Marítima & Agrícola e Migração de Fauna  
**Plano de Implementação (versão 2025-08-30)**

Este documento descreve uma arquitetura **100% open source** e um **plano por fases** para construir uma aplicação Python que:  
1) estima e monitoriza **biomassa marítima** e **biomassa agrícola**;  
2) analisa **migração de fauna** (marinha, terrestre e aves);  
3) suporta **ordenamento sustentável do espaço** (zoning) e **análise económica** com base em dados ambientais, biodiversidade e serviços ecossistémicos;  
4) integra **Copernicus**, **APIs OGC** e **QGIS**.

---

## 1) Objetivos e Resultados Esperados

- **O1. Observabilidade ambiental:** ingestão contínua de oceano (clorofila-a, SST, correntes, vento, nutrientes) e agro (NDVI/EVI, LAI, FAPAR).  
- **O2. Biomassa & produtividade:** derivar proxies (ex.: Chl-a → fitoplâncton; NDVI/EVI → vigor/biomassa aérea; LAI/FAPAR → produtividade).  
- **O3. Migração de fauna:** integrar telemetria GPS e ocorrências de espécies para mapear corredores e sazonalidade.  
- **O4. Ordenamento sustentável:** **MCDA** (análise multicritério), **InVEST** e **OGC APIs** para gerar mapas de adequação, risco e zonas (pesca, aquicultura, conservação, agricultura).  
- **O5. Plataforma reprodutível:** pipelines versionados, APIs abertas (OGC), front-end cartográfico (MapLibre/Leaflet), catálogos STAC e integração com **QGIS**.

**KPIs exemplo:** latência ingestão < 6 h; cobertura espacial ≥ 95% da AOI; reprodutibilidade (hash por dataset); precisão/recall de modelos de migração; % de decisões de zoning suportadas por dados.

---

## 2) Arquitetura Técnica (visão geral)

**Ingestão & Catálogo**  
- Adaptadores Python para **CDSE/STAC**, **Copernicus Marine Toolbox**, **CDS/ECMWF**, **NOAA ERDDAP**, **OBIS/GBIF/Movebank/eBird**.  
- **Catálogo STAC** (*stac-fastapi*) para indexar cenas, COGs e NetCDF/Zarr.

**Armazenamento**  
- **PostgreSQL + PostGIS** (vetores/trajectórias + índices espaciais/temporais; opcional **TimescaleDB**).  
- **Object storage** (MinIO/S3) para rasters **COG**, cubos **NetCDF**/**Zarr**.  
- Metadados STAC + JSON Schemas.

**Processamento**  
- **xarray + rioxarray + dask** para cubos (NetCDF/GRIB/Zarr).  
- **rasterio/GDAL** para I/O raster e reprojeções.  
- **Airflow** ou **Prefect** para orquestração.

**Modelação & Análises**  
- Biomassa: estatística/ML (scikit-learn/PyTorch) sobre **Chl-a** (mar) e **NDVI/EVI/LAI/FAPAR** (terra).  
- Migração: **MovingPandas**, **scikit-mobility** (trajetórias), **Parcels** (deriva Lagrangiana), integração **OBIS/GBIF/eBird/Movebank**.  
- Ordenamento: **MCDA** (AHP/pesos), **InVEST** (Habitat Risk, Coastal Vulnerability, Blue Carbon, etc.).

**Exposição & Visualização**  
- **pygeoapi** (OGC API – Features/Coverages/Processes).  
- **GeoServer** (WMS/WFS/WCS/WMTS) quando necessário.  
- Front-end: **MapLibre GL JS** / **Leaflet** / **OpenLayers**.  
- **QGIS** para QA e análises desktop (WMS/WFS/STAC).

**Segurança & Governação**  
- **Keycloak** (OIDC) opcional.  
- Controlo de licenças/direitos (eBird/Movebank/GBIF variam).  
- Observabilidade (OpenTelemetry), logs (ELK/Opensearch), *data lineage*.

---

## 3) Fases do Projeto (roadmap executável)

### Fase 0 — Descoberta & Enquadramento (1–2 semanas)
- Definir **AOI** (ex.: ZEE de Angola/Portugal) e **janela temporal**.  
- Identificar **espécies-alvo** e **setores** (pesca, aquicultura, agricultura).  
- Mapa de stakeholders, requisitos legais/licenças/ToU.  
- **Entregável:** Documento de Requisitos + Plano de Dados.

### Fase 1 — Arquitetura & DevOps (2–3 semanas)
- Repositórios (mono-repo), **poetry/uv**, `pre-commit`, `ruff/mypy`.  
- `docker-compose` com PostGIS, MinIO (S3), **stac-fastapi**, **pygeoapi**.  
- IaC (Terraform/Ansible) e ambientes (dev/stage/prod).  
- **Entregável:** Ambiente de dev + CI/CD.

### Fase 2 — Ingestão de Dados (3–5 semanas)
- Conectores:  
  - **CDSE/STAC/openEO** (Sentinel-1/2/3/5P)  
  - **Copernicus Marine Toolbox (CMEMS)**  
  - **CDS/ECMWF** (reanálises/clima)  
  - **NOAA ERDDAP** (SST, correntes, ondas)  
  - **OBIS/GBIF/Movebank/eBird** (biodiversidade/telemetria)  
- Normalização (CRS, resolução, nomes de variáveis) com `pydantic`.  
- **Entregável:** *Bronze Lake* (raw) versionado + STAC inicial.

### Fase 3 — Processamento & Feature Store (3–6 semanas)
- **Biomassa marinha:** Chl-a, NPP, gradientes frontais, upwelling.  
- **Biomassa agrícola:** NDVI/EVI, LAI/FAPAR, anomalias e sazonalidade.  
- **Trajetórias:** limpeza, *resampling*, métricas (velocidade, tortuosidade), *step-selection*.  
- **Entregável:** *Silver Lake* (features prontas) + coleções STAC.

### Fase 4 — Modelos (4–8 semanas)
- **Biomassa:** regressões/GBM/RN simples com validação **espácio-temporal**.  
- **Migração:** *utilization distributions* (KDE), corredores; **Parcels** para drift (larvas/jovens) sob correntes.  
- **Cenários** (clima/pressão humana) e análises de sensibilidade.  
- **Entregável:** *Model Zoo* com métricas.

### Fase 5 — Ordenamento & Economia (3–6 semanas)
- **MCDA/AHP:** pesos para conservação vs. produção (pesca/aquicultura/agro).  
- **InVEST:** *Habitat Risk*, *Coastal Vulnerability*, *Blue Carbon*, *Crop Production*.  
- **Outputs:** mapas de adequação + **zonas propostas** (cenários).  
- **Entregável:** **Atlas de Zonas** + relatório técnico.

### Fase 6 — APIs & Visualização (2–4 semanas)
- Publicar **OGC APIs** (pygeoapi) e **WMS/WFS/WCS** (GeoServer).  
- App web (MapLibre/Leaflet) com *time-slider*, filtros, *feature info*, *story maps*.  
- Dashboards (Panel/Bokeh) para indicadores (biomassa, esforço, risco).  
- **Entregável:** Portal web + documentação do utilizador.

### Fase 7 — Operação & Governance (contínua)
- Monitorização (latência, frescura, cobertura), *alerts*, *data quality*.  
- *Data stewardship*, versionamento, backups, DR.  
- Roadmap de novas fontes/modelos.

---

## 4) Estudo Comparativo de Soluções Open Source

| Camada | Opção | Prós | Contras | Recomendação |
|---|---|---|---|---|
| Catálogo | **stac-fastapi** | STAC nativo; rápido; plugins | Curva inicial de STAC | **Usar** |
| APIs OGC | **pygeoapi** | OGC API moderna; Python; leve | Menos tooling que GeoServer | **Usar** (principal) |
| OGC Clássico | **GeoServer** | WMS/WFS/WCS/WMTS maduros | Java; tuning de memória | **Usar** (compatibilidade) |
| DB Espacial | **PostgreSQL + PostGIS** | Padrão de mercado; robusto | Gestão de tuning | **Usar** |
| Object Storage | **MinIO** | S3 compatível; on-prem | Operação adicional | **Usar** |
| ETL | **Airflow** | Orquestração madura | Complexidade | Airflow ou Prefect |
| Cubos | **xarray/dask** | Escala; ecossistema | Requer design de chunking | **Usar** |
| Telemetria movimento | **MovingPandas** | Trajetórias em GeoPandas | Depende de stack Python/GDAL | **Usar** |
| Drift oceânico | **Parcels** | Lagrangiano dedicado | Requer campos de corrente | **Usar** |
| Serviços ecossistémicos | **InVEST** | Modelos prontos | Curvas de aprendizagem | **Usar** |
| Front-end mapas | **MapLibre GL / Leaflet** | GL vetorial / leve e simples | GL precisa tiles; Leaflet limita 3D | **Usar** |
| Desktop GIS | **QGIS** | Extensível; plugins | Gestão de proj./CRS | **Usar** |

---

## 5) Lista de APIs/Serviços (open source/gratuitos)

> Verifique termos de uso/licenças (eBird, Movebank e GBIF podem exigir chaves/autorizações específicas).

| Categoria | Serviço/API | Finalidade | Site/Docs |
|---|---|---|---|
| Satélite/Catálogo | **Copernicus Data Space Ecosystem (CDSE)** – STAC, openEO, Sentinel Hub APIs | Descoberta/Download/Processamento de Sentinel (S1/S2/S3/S5P) | https://documentation.dataspace.copernicus.eu/APIs.html |
| Oceano | **Copernicus Marine (CMEMS) / Marine Toolbox** | Clorofila-a, NPP, nutrientes, O2, correntes, gelo | https://data.marine.copernicus.eu/products • https://help.marine.copernicus.eu/ |
| Clima | **CDS API (ECMWF/C3S)** | Reanálises e indicadores climáticos | https://cds.climate.copernicus.eu/how-to-api |
| Oceanografia | **NOAA ERDDAP** (tabledap/griddap REST) | SST, ondas, correntes, boias, satélites | https://www.ncei.noaa.gov/erddap/rest.html |
| Vegetação | **MODIS VI (NDVI/EVI)** – LP DAAC/NASA | Biomassa agrícola/produtividade | https://lpdaac.usgs.gov/products/mod13q1v061/ |
| Biodiversidade marinha | **OBIS API** | Ocorrências/biogeografia marinha | https://api.obis.org/ |
| Biodiversidade global | **GBIF APIs** | Ocorrências, taxonomia, *tiles* | https://techdocs.gbif.org/en/openapi/ |
| Telemetria animal | **Movebank REST API** | Trajetórias GPS/sensores | https://github.com/movebank/movebank-api-doc |
| Aves (citizen science) | **eBird API** | Observações recentes, hotspots | https://documenter.getpostman.com/view/664302/S1ENwy59 |
| OGC moderno | **pygeoapi** | OGC API Features/Coverages/Processes | https://docs.pygeoapi.io/ |
| OGC clássico | **GeoServer** | WMS/WFS/WCS/WMTS/OGC API Features | https://geoserver.org/ |
| Catálogo | **STAC** (stac-fastapi) | Catálogo de cenas/rasters/coleções | https://github.com/stac-utils/stac-fastapi |
| Front-end | **MapLibre GL JS** | Mapas vetoriais WebGL | https://www.maplibre.org/maplibre-gl-js/docs/ |
| Front-end | **Leaflet** | Mapas raster/vetor leves | https://leafletjs.com/ |
| Front-end | **OpenLayers** | Mapas avançados e *tiling* | https://openlayers.org/ |
| Desktop GIS | **QGIS** | Análise desktop | https://qgis.org/ |
| BD espacial | **PostGIS** | Tipos/índices/funções espaciais | https://postgis.net/ |
| Cubos & Raster | **xarray / rioxarray / dask / rasterio / GDAL** | Cubos e raster | https://docs.xarray.dev/ • https://corteva.github.io/rioxarray/stable/ |
| Movimento | **MovingPandas / scikit-mobility** | Análise de movimento | https://movingpandas.org/ • https://scikit-mobility.github.io/ |
| Drift | **Parcels (OceanParcels)** | Transporte Lagrangiano | https://oceanparcels.org/ |
| Serviços Ecossistémicos | **InVEST** | Risco habitat, vulnerabilidade costeira, blue carbon | https://naturalcapitalproject.stanford.edu/software/invest |

---

## 6) Modelos & Metodologias

### 6.1 Biomassa Marítima
- **Clorofila-a** (ex.: CMEMS `GLOBAL_ANALYSISFORECAST_BGC_*`): proxy de fitoplâncton → base trófica.  
- Relações empíricas **Chl-a → NPP** e deteção de **frentes/upwelling** via gradientes.  
- Validação com **in-situ** (ex.: CMEMS `INSITU_GLO_BGC_DISCRETE_*`), quando disponível.

### 6.2 Biomassa Agrícola
- **NDVI/EVI MODIS** (16-dias, 250 m–1 km) para vigor/sazonalidade; **LAI/FAPAR** (CGLS) para produtividade.  
- Anomalias (z-scores), percentis climáticos e **drought stress** (ERA5/ERA5-Land via CDS).

### 6.3 Migração & Corredores
- Trajetórias (Movebank/eBird): limpeza, *resampling*, **step-selection**, **UDs** (KDE).  
- **MovingPandas/scikit-mobility** para métricas (velocidade, aceleração, tortuosidade).  
- **Parcels** para simular deriva (larvas/jovens) sob campos de corrente.  
- Integração **OBIS/GBIF** para envelopes ecológicos/sazonalidade.

### 6.4 Ordenamento & Economia
- **MCDA/AHP:** pesos por objetivo (conservação vs. produção) com restrições legais.  
- **InVEST:** *Habitat Risk Assessment*, *Coastal Vulnerability*, *Blue Carbon*, *Crop Production*.  
- **Saídas:** mapas de adequação e **zonas** sob cenários (atuais/futuros).

---

## 7) Esquema de Dados (simplificado)

s3://biomassa/{area}/{fonte}/{produto}/{YYYY}/{MM}/…  # COG/NetCDF/Zarr

postgresql://…  # PostGIS
schemas:
reference   (aoi, limites, habitats)
biodiversity(occurrences, tracks, taxon)
ocean       (sst, chl, currents, nutrients)
agri        (ndvi, evi, lai, fapar)
modeling    (features, predictions, scores)

stac/ (collections, items, assets)

---

## 8) Pipelines — exemplos de conectores (pseudocódigo)

```python
# CDS (ECMWF/C3S)
import cdsapi
c = cdsapi.Client()
c.retrieve(
  "reanalysis-era5-single-levels",
  {
    "variable": ["10m_u_component_of_wind","10m_v_component_of_wind"],
    "product_type": "reanalysis",
    "year": "2024", "month": "06", "day": "01",
    "time": ["00:00","06:00","12:00","18:00"],
    "area": [12, -20, -30, 20]  # N, W, S, E
  },
  "era5_wind_2024-06.nc"
)

# Copernicus Marine Toolbox
from copernicus_marine import subset
subset(
  dataset_id="GLOBAL_ANALYSISFORECAST_BGC_001_028",
  variables=["chl"],
  minimum_longitude=-20, maximum_longitude=20,
  minimum_latitude=-30, maximum_latitude=12,
  start_datetime="2024-06-01", end_datetime="2024-06-30",
  output_filename="cmems_chla.nc"
)

# NOAA ERDDAP (erddapy)
from erddapy import ERDDAP
e = ERDDAP(server="https://www.ncei.noaa.gov/erddap")
e.dataset_id = "ncdcOwTemperatures"
e.response = "csv"
e.constraints = {"time>=":"2024-06-01T00:00:00Z", "time<=":"2024-06-30T23:59:59Z"}
df = e.to_pandas()

# OBIS ocorrências
import requests
r = requests.get("https://api.obis.org/v3/occurrence?taxonid=141438&size=5000")
occ = r.json()

9) Visualização & APIs
	•	pygeoapi: publicar collections (Features/Coverages) e processes para análises sob-demanda.
	•	GeoServer: WMS/WFS/WCS quando exigida compatibilidade.
	•	MapLibre/Leaflet/OpenLayers: time slider, heatmaps, vector tiles, feature info.
	•	QGIS: ligação a WMS/WFS, STAC Browser e QGIS STAC plugin (quando aplicável).

⸻

10) Licenças, Ética & Conformidade
	•	Copernicus (CDSE/CMEMS/CDS): dados abertos e gratuitos (referenciar fonte/termos).
	•	GBIF/OBIS: licenças por dataset (CC-BY/CC0); citar DOI/origem.
	•	Movebank: muitos estudos exigem permissão; cumprir Data Use Terms.
	•	eBird: requer API key; limites/ToU; dados completos via EBD sob pedido.
	•	Privacidade & conservação: anonimizar locais sensíveis (espécies ameaçadas, ninhos).
	•	Governança: políticas de retenção, versionamento e partilha clara de metadados.

⸻

11) Entregáveis Principais
	•	Stack Docker + IaC: PostGIS, MinIO, stac-fastapi, pygeoapi, GeoServer.
	•	Conectores prontos (CDSE, CMEMS, CDS, ERDDAP, OBIS, GBIF, Movebank, eBird).
	•	Feature store (biomassa mar/agrícola; métricas de movimento).
	•	Modelos validados + cenários e mapas de adequação.
	•	Portal web interativo + documentação do utilizador.
	•	Templates QGIS (projetos, estilos, simbologia).

⸻

12) Stack Open Source (resumo)
	•	Linguagem: Python 3.11+
	•	Dados: xarray · rioxarray · rasterio · GDAL · GeoPandas
	•	Pipelines: Dask · Airflow/Prefect
	•	BD: PostgreSQL + PostGIS · (Timescale opcional)
	•	Catálogo: STAC (stac-fastapi)
	•	APIs: pygeoapi · GeoServer
	•	Mapas: MapLibre GL JS · Leaflet · OpenLayers
	•	Modelos: scikit-learn · PyTorch · MovingPandas · scikit-mobility · Parcels · InVEST
	•	Desktop: QGIS

⸻

13) Referências Oficiais (links úteis)
	•	CDSE (APIs/STAC/openEO): https://documentation.dataspace.copernicus.eu/APIs.html
	•	Copernicus Marine/Toolbox: https://data.marine.copernicus.eu/products · https://help.marine.copernicus.eu/
	•	CDS API (ECMWF/C3S): https://cds.climate.copernicus.eu/how-to-api
	•	NOAA ERDDAP (REST): https://www.ncei.noaa.gov/erddap/rest.html
	•	MODIS VI (NDVI/EVI): https://lpdaac.usgs.gov/products/mod13q1v061/
	•	OBIS API: https://api.obis.org/
	•	GBIF APIs: https://techdocs.gbif.org/en/openapi/
	•	Movebank REST API: https://github.com/movebank/movebank-api-doc
	•	eBird API: https://documenter.getpostman.com/view/664302/S1ENwy59
	•	pygeoapi (OGC API): https://docs.pygeoapi.io/
	•	GeoServer: https://geoserver.org/
	•	MapLibre GL JS: https://www.maplibre.org/maplibre-gl-js/docs/
	•	Leaflet: https://leafletjs.com/
	•	OpenLayers: https://openlayers.org/
	•	QGIS: https://qgis.org/
	•	PostGIS: https://postgis.net/
	•	xarray: https://docs.xarray.dev/ · rioxarray: https://corteva.github.io/rioxarray/stable/
	•	MovingPandas: https://movingpandas.org/ · scikit-mobility: https://scikit-mobility.github.io/
	•	Parcels: https://oceanparcels.org/
	•	InVEST: https://naturalcapitalproject.stanford.edu/software/invest

⸻

14) Estrutura de Repositório (sugestão)

repo/
  README.md
  pyproject.toml
  src/
    core/        # utils comuns (proj, CRS, bbox, AOI)
    ingest/      # conectores CDSE/CMEMS/CDS/ERDDAP/OBIS/GBIF/eBird/Movebank
    process/     # raster/cubos, features biomassa & movimento
    models/      # treino/inf, validação, métricas
    api/         # pygeoapi processes
  dags/          # Airflow (ou flows/ p/ Prefect)
  infra/
    docker-compose.yml
    geoserver/
    pygeoapi/
    stac-fastapi/
  notebooks/
  configs/
    aoi.geojson
    variables.yaml

15) Exemplo docker-compose.yml (mínimo viável)
    
version: "3.8"
services:
  postgis:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: geo
    ports: ["5432:5432"]

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio123
    ports: ["9000:9000", "9001:9001"]

  stac:
    image: ghcr.io/stac-utils/stac-fastapi:latest
    environment:
      APP_HOST: 0.0.0.0
    ports: ["8081:8081"]

  pygeoapi:
    image: geopython/pygeoapi:latest
    ports: ["5000:80"]
    volumes:
      - ./infra/pygeoapi/pygeoapi-config.yml:/pygeoapi/local.config.yml:ro

16) Próximos Passos Sugeridos
	1.	Fechar AOI/espécies-alvo e variáveis críticas (Chl-a, SST, NDVI/EVI, LAI/FAPAR, correntes).
	2.	Configurar stack docker (PostGIS + MinIO + STAC + pygeoapi) e ligar QGIS via WMS/WFS.
	3.	Implementar 3 conectores de prova:
	•	CMEMS (clorofila-a)
	•	MODIS NDVI (LP DAAC)
	•	OBIS/GBIF (ocorrências)
	4.	Construir primeiros indicadores de biomassa e mapa de adequação (MCDA) para um caso-piloto (ex.: aquicultura).
	5.	Integrar Parcels para um proof-of-concept de deriva em correntes.
	6.	Publicar OGC APIs e frontend com MapLibre (time-slider).

Licenciamento: este plano privilegia fontes e ferramentas open source; rever termos específicos de cada dataset/API antes de uso comercial ou redistribuição.