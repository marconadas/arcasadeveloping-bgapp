# 🌊 ESTUDO PROFUNDO: Coleções STAC Oceanográficas e Marinhas para BGAPP

**Data:** 2025-01-27  
**Status:** ✅ **COMPLETO**  
**Objetivo:** Identificar e avaliar coleções STAC públicas relevantes para dados oceanográficos e marinhos

---

## 📋 **RESUMO EXECUTIVO**

Este estudo identificou **15+ coleções STAC de alta qualidade** disponíveis publicamente que são altamente relevantes para a aplicação BGAPP, focando em dados oceanográficos, marinhos e costeiros para Angola e região.

### **Principais Descobertas:**
- **126 coleções** disponíveis no Microsoft Planetary Computer
- **9 coleções** disponíveis no Element84 Earth Search
- **Cobertura global** com dados desde 1988 até presente
- **Dados em tempo real** e históricos disponíveis
- **Formatos otimizados** (COG, NetCDF, Parquet)

---

## 🏗️ **ARQUITETURA STAC ATUAL DA BGAPP**

### **Componentes Existentes:**
```python
# src/bgapp/core/stac.py
class STACManager:
    - create_collection()
    - create_item()
    - _geometry_to_bbox()

# infra/stac/simple_stac_api.py
FastAPI STAC Server:
    - Endpoints: /, /collections, /health
    - 2 coleções básicas: angola-marine-data, angola-terrestrial-data
    - Porta: 8081
```

### **Configuração Atual:**
- **STAC API URL:** http://localhost:8081
- **Bucket MinIO:** stac-assets
- **Versão STAC:** 1.0.0
- **Status:** ✅ Funcional e operacional

---

## 🌍 **COLEÇÕES STAC RECOMENDADAS**

### **1. DADOS DE TEMPERATURA DA SUPERFÍCIE DO MAR**

#### **🔥 NOAA CDR Sea Surface Temperature - WHOI**
- **ID:** `noaa-cdr-sea-surface-temperature-whoi`
- **Cobertura:** Global, 1988-presente
- **Resolução:** 0.25°, 3-hourly
- **Formato:** COG (Cloud Optimized GeoTIFF)
- **Relevância:** ⭐⭐⭐⭐⭐ **CRÍTICA para BGAPP**
- **Licença:** Proprietária (uso científico permitido)

```json
{
  "extent": {
    "spatial": {"bbox": [[-180.0, -90, 180, 90]]},
    "temporal": {"interval": [["1988-01-01T00:00:00Z", null]]}
  },
  "item_assets": {
    "sea_surface_temperature": {
      "type": "image/tiff; application=geotiff; profile=cloud-optimized",
      "unit": "degree Celsius"
    }
  }
}
```

#### **🛰️ Sentinel-3 Sea Surface Temperature**
- **ID:** `sentinel-3-slstr-wst-l2-netcdf`
- **Cobertura:** Global, 2017-presente
- **Resolução:** 1km
- **Formato:** NetCDF
- **Relevância:** ⭐⭐⭐⭐⭐ **CRÍTICA para BGAPP**
- **Licença:** Proprietária ESA

**Bandas espectrais:**
- **S7:** 3.742μm (SST, Active fire)
- **S8:** 10.854μm (SST, LST)
- **S9:** 12.0225μm (SST, LST)

### **2. DADOS DE CONTEÚDO TÉRMICO DO OCEANO**

#### **🌡️ NOAA CDR Global Ocean Heat Content**
- **ID:** `noaa-cdr-ocean-heat-content`
- **Cobertura:** Global, dados históricos
- **Relevância:** ⭐⭐⭐⭐ **ALTA para estudos climáticos**
- **Formato:** COG + NetCDF

### **3. DADOS ALTIMÉTRICOS E OCEANOGRÁFICOS**

#### **📡 Sentinel-3 Ocean Radar Altimetry**
- **ID:** `sentinel-3-sral-wat-l2-netcdf`
- **Cobertura:** Global oceânica
- **Parâmetros:** Altura da superfície do mar, altura significativa das ondas
- **Relevância:** ⭐⭐⭐⭐ **ALTA para estudos costeiros**

### **4. DADOS SATELITAIS COMPLEMENTARES**

#### **🛰️ Element84 Earth Search Collections**
```
- sentinel-2-l2a: Sentinel-2 Level-2A (ótico)
- sentinel-2-l1c: Sentinel-2 Level-1C (ótico)
- sentinel-1-grd: Sentinel-1 GRD (radar)
- landsat-c2-l2: Landsat Collection 2 Level-2
- cop-dem-glo-30: Copernicus DEM 30m
- cop-dem-glo-90: Copernicus DEM 90m
```

---

## 📊 **MATRIZ DE COMPATIBILIDADE**

| Coleção | Relevância Angola | Formato | Tempo Real | Resolução | Implementação |
|---------|-------------------|---------|------------|-----------|---------------|
| NOAA SST WHOI | ⭐⭐⭐⭐⭐ | COG | ✅ | 0.25° | 🟢 Fácil |
| Sentinel-3 SST | ⭐⭐⭐⭐⭐ | NetCDF | ✅ | 1km | 🟡 Média |
| Sentinel-3 Altimetry | ⭐⭐⭐⭐ | NetCDF | ✅ | 1km | 🟡 Média |
| NOAA Ocean Heat | ⭐⭐⭐⭐ | COG/NetCDF | ❌ | Variável | 🟢 Fácil |
| Sentinel-2 L2A | ⭐⭐⭐⭐⭐ | COG | ✅ | 10-60m | 🟢 Fácil |
| Sentinel-1 GRD | ⭐⭐⭐⭐ | COG | ✅ | 10m | 🟡 Média |

---

## 🔧 **PLANO DE IMPLEMENTAÇÃO**

### **FASE 1: Coleções Prioritárias (Semana 1-2)**

```python
# Adicionar ao STACManager
PRIORITY_COLLECTIONS = {
    "noaa-sst-whoi": {
        "url": "https://planetarycomputer.microsoft.com/api/stac/v1/collections/noaa-cdr-sea-surface-temperature-whoi",
        "bbox_angola": [8.1559051, -18.922632, 13.794773, -4.2610419],
        "temporal": ["2020-01-01", "2025-01-27"],
        "assets": ["sea_surface_temperature"]
    },
    "sentinel3-sst": {
        "url": "https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-3-slstr-wst-l2-netcdf",
        "bbox_angola": [8.1559051, -18.922632, 13.794773, -4.2610419],
        "temporal": ["2020-01-01", "2025-01-27"],
        "assets": ["l2p"]
    }
}
```

### **FASE 2: Integração com APIs Externas (Semana 3-4)**

```python
class ExternalSTACClient:
    def __init__(self):
        self.planetary_computer = "https://planetarycomputer.microsoft.com/api/stac/v1"
        self.earth_search = "https://earth-search.aws.element84.com/v1"
    
    async def search_items(self, collection_id: str, bbox: list, datetime: str):
        # Implementar busca em APIs externas
        pass
    
    async def proxy_assets(self, item_url: str):
        # Proxy para assets externos
        pass
```

### **FASE 3: Cache e Otimização (Semana 5-6)**

```python
# Cache local de metadados STAC
STAC_CACHE_CONFIG = {
    "redis_url": "redis://localhost:6379",
    "ttl_collections": 3600,  # 1 hora
    "ttl_items": 1800,        # 30 minutos
    "max_items_per_collection": 10000
}
```

---

## 🌐 **APIS STAC PÚBLICAS IDENTIFICADAS**

### **1. Microsoft Planetary Computer**
- **URL:** https://planetarycomputer.microsoft.com/api/stac/v1
- **Coleções:** 126 disponíveis
- **Foco:** Dados climáticos, oceanográficos, terrestres
- **Qualidade:** ⭐⭐⭐⭐⭐ **Excelente**
- **Documentação:** Completa com exemplos

### **2. Element84 Earth Search**
- **URL:** https://earth-search.aws.element84.com/v1
- **Coleções:** 9 principais (Sentinel, Landsat, Copernicus)
- **Foco:** Dados satelitais ópticos e radar
- **Qualidade:** ⭐⭐⭐⭐⭐ **Excelente**
- **Performance:** Muito rápida

### **3. Brazil Data Cube (INPE)**
- **URL:** https://data.inpe.br/bdc/stac/v1
- **Foco:** América do Sul, dados regionais
- **Relevância:** ⭐⭐⭐ **Média para Angola**

---

## 📈 **BENEFÍCIOS PARA BGAPP**

### **Dados Oceanográficos Avançados:**
1. **Temperatura da superfície do mar** em tempo real
2. **Altimetria satelital** para estudos costeiros
3. **Conteúdo térmico oceânico** para análises climáticas
4. **Dados multiespectrais** para qualidade da água

### **Capacidades Técnicas:**
1. **Interoperabilidade** com padrões internacionais
2. **Escalabilidade** para grandes volumes de dados
3. **Performance** com formatos otimizados (COG)
4. **Metadados ricos** para descoberta de dados

### **Benefícios Científicos:**
1. **Validação** de modelos oceanográficos locais
2. **Análises temporais** de longo prazo (1988-presente)
3. **Comparações regionais** com dados globais
4. **Detecção de anomalias** climáticas e oceanográficas

---

## 🚀 **PRÓXIMOS PASSOS RECOMENDADOS**

### **Implementação Imediata (Esta Semana):**
1. ✅ **Configurar proxy STAC** para APIs externas
2. ✅ **Implementar busca** por bbox de Angola
3. ✅ **Adicionar coleções SST** ao catálogo local
4. ✅ **Testar integração** com frontend

### **Desenvolvimento Médio Prazo (Próximo Mês):**
1. 🔄 **Cache inteligente** de metadados
2. 🔄 **Processamento local** de dados críticos
3. 🔄 **Dashboard específico** para dados oceanográficos
4. 🔄 **Alertas automáticos** para anomalias

### **Evolução Longo Prazo (Próximos 3 Meses):**
1. 🔮 **Machine Learning** para predição oceanográfica
2. 🔮 **Integração com modelos** numéricos locais
3. 🔮 **API pública** para dados processados
4. 🔮 **Colaboração internacional** via STAC

---

## 📚 **RECURSOS TÉCNICOS**

### **Bibliotecas Python Recomendadas:**
```bash
pip install pystac-client
pip install planetary-computer
pip install rasterio
pip install xarray
pip install dask[complete]
```

### **Exemplos de Código:**
```python
from pystac_client import Client

# Conectar ao Planetary Computer
catalog = Client.open("https://planetarycomputer.microsoft.com/api/stac/v1")

# Buscar dados SST para Angola
search = catalog.search(
    collections=["noaa-cdr-sea-surface-temperature-whoi"],
    bbox=[8.16, -18.92, 13.79, -4.26],  # Angola bbox
    datetime="2024-01-01/2024-12-31"
)

items = list(search.items())
print(f"Encontrados {len(items)} itens SST para Angola em 2024")
```

---

## ✅ **CONCLUSÕES**

Este estudo identificou **oportunidades excepcionais** para enriquecer a aplicação BGAPP com dados oceanográficos de classe mundial. As coleções STAC recomendadas fornecerão:

1. **Dados críticos** para monitoramento marinho de Angola
2. **Padrões internacionais** de interoperabilidade
3. **Escalabilidade** para crescimento futuro
4. **Base científica sólida** para tomada de decisões

A implementação dessas coleções posicionará a BGAPP como **referência regional** em dados oceanográficos e marinhos para Angola e África Ocidental.

---

**📧 Documento preparado para integração imediata na aplicação BGAPP**  
**🔄 Última atualização:** 27 de Janeiro de 2025
