# Enhanced Map Backgrounds & Overlays - Plano de Implementação

## 🎯 Visão Geral

### Análise Atual (Playwright)
```json
{
  "currentState": {
    "baseMap": "OpenStreetMap apenas",
    "overlays": "6+ controles sobrepostos",
    "performance": "Sem cache otimizado",
    "gisSupport": "Limitado a GeoJSON"
  },
  "issues": {
    "overlappingControls": true,
    "limitedProviders": true,
    "noGISConversion": true
  }
}
```

### Objetivo Final
Sistema avançado de mapas com múltiplos providers, overlays organizados, integração OSM completa e conversões GIS automáticas.

## 📋 Fases de Implementação

### 🚀 Fase 1: Base Maps Avançados (3-4 dias)

#### 1.1 Satellite Base Map
```javascript
// Integração Sentinel-2 via EOX
const satelliteLayer = L.tileLayer('https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg', {
  attribution: '© EOX IT Services GmbH',
  maxZoom: 14,
  id: 'satellite'
});
```

#### 1.2 Marine Base Map
```javascript
// Base map especializado para dados marinhos
const marineLayer = L.tileLayer('https://tiles.maps.eox.at/wmts/1.0.0/terrain-light_3857/default/g/{z}/{y}/{x}.jpg', {
  attribution: '© EOX Marine',
  maxZoom: 12,
  id: 'marine'
});
```

#### 1.3 Bathymetry Base Map
```javascript
// Batimetria GEBCO
const bathymetryLayer = L.tileLayer.wms('https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv', {
  layers: 'GEBCO_LATEST',
  format: 'image/png',
  transparent: true,
  id: 'bathymetry'
});
```

#### 1.4 Seletor de Base Maps
```html
<div class="base-map-selector">
  <h4>🗺️ Base Maps</h4>
  <div class="map-options">
    <label><input type="radio" name="baseMap" value="osm" checked> OpenStreetMap</label>
    <label><input type="radio" name="baseMap" value="satellite"> Satellite</label>
    <label><input type="radio" name="baseMap" value="marine"> Marine</label>
    <label><input type="radio" name="baseMap" value="bathymetry"> Bathymetry</label>
  </div>
</div>
```

### 🌊 Fase 2: Sistema de Overlays Hierárquico (4-5 dias)

#### 2.1 Estrutura Hierárquica
```javascript
const overlayStructure = {
  oceanographic: {
    name: '🌊 Oceanográficos',
    layers: {
      sst: { name: '🌡️ SST', opacity: 0.8, active: false },
      chlorophyll: { name: '🌱 Clorofila', opacity: 0.6, active: false },
      currents: { name: '🌊 Correntes', opacity: 0.7, active: false },
      upwelling: { name: '⬆️ Upwelling', opacity: 0.5, active: false }
    }
  },
  fishing: {
    name: '🎣 Pesqueiros',
    layers: {
      vessels: { name: '🚢 Embarcações', opacity: 0.9, active: false },
      effort: { name: '🔥 Esforço', opacity: 0.7, active: false },
      density: { name: '📊 Densidade', opacity: 0.6, active: false }
    }
  },
  administrative: {
    name: '🏛️ Administrativos',
    layers: {
      zee: { name: '📍 ZEE', opacity: 0.8, active: true },
      ports: { name: '⚓ Portos', opacity: 1.0, active: false },
      boundaries: { name: '🚧 Fronteiras', opacity: 0.7, active: false }
    }
  }
};
```

#### 2.2 Controle de Overlays
```html
<div class="overlay-control">
  <h4>🌊 Overlays</h4>
  <div class="overlay-categories">
    <!-- Oceanográficos -->
    <div class="category" data-category="oceanographic">
      <div class="category-header">
        <span class="toggle">▼</span>
        <span class="name">🌊 Oceanográficos</span>
      </div>
      <div class="category-layers">
        <div class="layer-item">
          <label>
            <input type="checkbox" data-layer="sst">
            <span>🌡️ SST</span>
          </label>
          <input type="range" class="opacity-slider" min="0" max="100" value="80">
        </div>
        <!-- Mais layers... -->
      </div>
    </div>
  </div>
</div>
```

#### 2.3 Sistema de Cache Inteligente
```javascript
class LayerCacheManager {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50; // MB
    this.priorities = new Map();
  }
  
  async getTile(url, priority = 1) {
    if (this.cache.has(url)) {
      this.updatePriority(url, priority);
      return this.cache.get(url);
    }
    
    const tile = await this.fetchTile(url);
    this.addToCache(url, tile, priority);
    return tile;
  }
  
  addToCache(url, tile, priority) {
    if (this.getCacheSize() > this.maxCacheSize) {
      this.evictLowPriorityTiles();
    }
    
    this.cache.set(url, tile);
    this.priorities.set(url, priority);
  }
}
```

### 🗺️ Fase 3: Integração OpenStreetMap (3-4 dias)

#### 3.1 Geocoding Service
```javascript
class OSMGeocodingService {
  constructor() {
    this.baseURL = 'https://nominatim.openstreetmap.org';
    this.cache = new Map();
  }
  
  async geocodeAddress(address) {
    const cacheKey = `geocode_${address}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const response = await fetch(`${this.baseURL}/search?format=json&q=${encodeURIComponent(address)}&countrycodes=ao&limit=5`);
    const results = await response.json();
    
    const processed = results.map(result => ({
      name: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      type: result.type,
      importance: result.importance
    }));
    
    this.cache.set(cacheKey, processed);
    return processed;
  }
  
  async reverseGeocode(lat, lon) {
    const response = await fetch(`${this.baseURL}/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`);
    const result = await response.json();
    
    return {
      address: result.display_name,
      components: result.address,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    };
  }
  
  async searchCategory(category, subcategories, bbox) {
    const query = `[amenity]=${category}`;
    const response = await fetch(`${this.baseURL}/search?format=json&q=${query}&viewbox=${bbox.join(',')}&bounded=1&limit=50`);
    return await response.json();
  }
}
```

#### 3.2 Interface de Busca
```html
<div class="osm-search">
  <h4>🔍 Buscar Locais</h4>
  <div class="search-input">
    <input type="text" id="osmSearch" placeholder="Ex: Porto de Luanda, Farol da Barra...">
    <button id="searchBtn">🔍</button>
  </div>
  <div class="search-results" id="searchResults"></div>
  
  <div class="category-search">
    <h5>Busca por Categoria</h5>
    <select id="categorySelect">
      <option value="harbour">⚓ Portos</option>
      <option value="lighthouse">🗼 Faróis</option>
      <option value="marina">🛥️ Marinas</option>
      <option value="fuel">⛽ Combustível</option>
    </select>
    <button id="categorySearchBtn">Buscar</button>
  </div>
</div>
```

### 🔄 Fase 4: Sistema de Conversão GIS (2-3 days)

#### 4.1 Conversores de Formato
```javascript
class GISConverter {
  // WKT ↔ GeoJSON
  static wktToGeoJSON(wktString) {
    // Implementação usando biblioteca Wicket ou similar
    const wicket = new Wkt.Wkt();
    wicket.read(wktString);
    return wicket.toJson();
  }
  
  static geoJSONToWKT(geojson) {
    const wicket = new Wkt.Wkt();
    wicket.fromJson(geojson);
    return wicket.write();
  }
  
  // GeoJSON ↔ KML
  static geoJSONToKML(geojson, options = {}) {
    const kml = tokml(geojson, {
      documentName: options.name || 'BGAPP Export',
      documentDescription: options.description || 'Exported from BGAPP',
      simplestyle: true
    });
    return kml;
  }
  
  static kmlToGeoJSON(kmlString) {
    const dom = new DOMParser().parseFromString(kmlString, 'text/xml');
    return toGeoJSON.kml(dom);
  }
  
  // CSV ↔ GeoJSON
  static csvToGeoJSON(csvString, latField, lonField) {
    const lines = csvString.split('\n');
    const headers = lines[0].split(',');
    const features = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const properties = {};
      
      headers.forEach((header, index) => {
        properties[header] = values[index];
      });
      
      const lat = parseFloat(properties[latField]);
      const lon = parseFloat(properties[lonField]);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          properties
        });
      }
    }
    
    return {
      type: 'FeatureCollection',
      features
    };
  }
}
```

#### 4.2 API Endpoints
```javascript
// Endpoints para conversão automática
app.post('/api/gis/convert/wkt-to-geojson', async (req, res) => {
  try {
    const { wkt } = req.body;
    const geojson = GISConverter.wktToGeoJSON(wkt);
    res.json({ success: true, data: geojson });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/gis/convert/geojson-to-kml', async (req, res) => {
  try {
    const { geojson, options } = req.body;
    const kml = GISConverter.geoJSONToKML(geojson, options);
    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.send(kml);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

## 🧪 Estratégia de Testes

### Testes Automatizados com Playwright
```javascript
// test-enhanced-maps.js
describe('Enhanced Map System', () => {
  test('Base map switching', async ({ page }) => {
    await page.goto('/realtime_angola');
    
    // Testar mudança de base map
    await page.click('[data-basemap="satellite"]');
    await page.waitForSelector('img[src*="s2cloudless"]');
    
    // Verificar se mudou
    const satelliteTiles = await page.locator('img[src*="s2cloudless"]').count();
    expect(satelliteTiles).toBeGreaterThan(0);
  });
  
  test('Overlay controls', async ({ page }) => {
    await page.goto('/realtime_angola');
    
    // Testar controle de overlay
    await page.click('[data-layer="sst"]');
    await page.waitForSelector('.leaflet-overlay-pane .sst-layer');
    
    // Testar opacidade
    await page.fill('.opacity-slider[data-layer="sst"]', '50');
    const opacity = await page.getAttribute('.sst-layer', 'style');
    expect(opacity).toContain('opacity: 0.5');
  });
  
  test('OSM geocoding', async ({ page }) => {
    await page.goto('/realtime_angola');
    
    // Testar busca
    await page.fill('#osmSearch', 'Porto de Luanda');
    await page.click('#searchBtn');
    
    await page.waitForSelector('.search-results .result-item');
    const results = await page.locator('.search-results .result-item').count();
    expect(results).toBeGreaterThan(0);
  });
});
```

### Testes de Performance
```javascript
// test-performance.js
describe('Map Performance', () => {
  test('Tile loading speed', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/realtime_angola');
    await page.waitForSelector('.leaflet-tile-loaded');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000); // < 2s
  });
  
  test('Cache effectiveness', async ({ page }) => {
    await page.goto('/realtime_angola');
    
    // Primeira carga
    const firstLoad = await page.evaluate(() => performance.now());
    await page.reload();
    
    // Segunda carga (com cache)
    const secondLoad = await page.evaluate(() => performance.now());
    
    expect(secondLoad).toBeLessThan(firstLoad * 0.7); // 30% mais rápido
  });
});
```

## 📊 Monitoramento e Métricas

### Métricas Técnicas
```javascript
class MapMetrics {
  constructor() {
    this.metrics = {
      tileLoadTime: [],
      cacheHitRate: 0,
      errorRate: 0,
      activeOverlays: new Set(),
      baseMapUsage: new Map()
    };
  }
  
  trackTileLoad(url, loadTime) {
    this.metrics.tileLoadTime.push(loadTime);
    
    // Manter apenas últimas 100 medições
    if (this.metrics.tileLoadTime.length > 100) {
      this.metrics.tileLoadTime.shift();
    }
  }
  
  trackBaseMapChange(baseMap) {
    const current = this.metrics.baseMapUsage.get(baseMap) || 0;
    this.metrics.baseMapUsage.set(baseMap, current + 1);
  }
  
  getAverageLoadTime() {
    const times = this.metrics.tileLoadTime;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
  
  generateReport() {
    return {
      avgLoadTime: this.getAverageLoadTime(),
      cacheHitRate: this.metrics.cacheHitRate,
      errorRate: this.metrics.errorRate,
      mostUsedBaseMap: [...this.metrics.baseMapUsage.entries()]
        .sort((a, b) => b[1] - a[1])[0]?.[0],
      activeOverlaysCount: this.metrics.activeOverlays.size
    };
  }
}
```

## 🚀 Deploy e Rollout

### Estratégia de Deploy
1. **Feature Flags**: Ativar gradualmente por usuário
2. **A/B Testing**: Comparar com sistema atual
3. **Rollback Plan**: Reverter rapidamente se necessário
4. **Monitoring**: Alertas para problemas de performance

### Checklist de Deploy
- [ ] Testes automatizados passando
- [ ] Performance benchmarks OK
- [ ] Cache configurado
- [ ] CDN otimizado
- [ ] Monitoring ativo
- [ ] Documentação atualizada

---

**Estimativa Total**: 12-16 dias  
**Recursos Necessários**: 1 dev frontend, 1 dev backend  
**Dependências**: APIs EOX, OSM, bibliotecas GIS  
**Riscos**: Rate limits de APIs, performance em mobile
