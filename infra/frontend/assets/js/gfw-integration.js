/**
 * 🎣 Global Fishing Watch API Integration
 * Integração com a API do Global Fishing Watch para monitorização de atividades pesqueiras
 * @version 1.0.0
 * @author BGAPP Team
 */

class GFWIntegration {
  constructor() {
    // Configuração da API
    this.config = {
      baseUrl: 'https://api.globalfishingwatch.org/v3',
      tilesUrl: 'https://tiles.globalfishingwatch.org',
      token: null, // Será carregado de forma segura
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Estado da integração
    this.map = null;
    this.layers = new Map();
    this.activeLayers = new Set();
    this.vesselCache = new Map();
    this.tileCache = new Map();
    
    // Filtros ativos
    this.filters = {
      timeRange: {
        start: this.getDefaultStartDate(),
        end: new Date().toISOString().split('T')[0]
      },
      vesselTypes: ['fishing'],
      flags: [],
      gearTypes: [],
      confidenceLevel: 3
    };

    // Configurações de visualização
    this.visualization = {
      style: 'activity', // activity, heatmap, tracks, events
      opacity: 0.7,
      colorScale: 'viridis',
      animate: false
    };

    // Sistema de alertas
    this.alerts = {
      enabled: true,
      checkInterval: 5 * 60 * 1000, // 5 minutos
      types: ['protected_area', 'illegal_fishing', 'encounters']
    };

    this.initialized = false;
  }

  /**
   * Inicializar integração com o mapa
   */
  async initialize(leafletMap) {
    console.log('🎣 Inicializando Global Fishing Watch Integration...');
    
    try {
      this.map = leafletMap;
      
      // Carregar token de forma segura
      await this.loadApiToken();
      
      // Criar camadas base
      this.createBaseLayers();
      
      // Configurar eventos do mapa
      this.setupMapEvents();
      
      // Iniciar monitorização
      if (this.alerts.enabled) {
        this.startAlertMonitoring();
      }
      
      this.initialized = true;
      console.log('✅ GFW Integration inicializada com sucesso');
      
      // Carregar dados iniciais
      await this.loadInitialData();
      
    } catch (error) {
      console.error('❌ Erro ao inicializar GFW Integration:', error);
      throw error;
    }
  }

  /**
   * Carregar token da API de forma segura
   */
  async loadApiToken() {
    try {
      // Em produção, carregar do worker API configurado
      const apiUrl = window.location.hostname.includes('localhost') 
        ? '/api/config/gfw-token'
        : 'https://bgapp-api-worker.majearcasa.workers.dev/api/config/gfw-token';
        
      const response = await fetch(apiUrl, {
        headers: {
          'Origin': window.location.origin,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.config.token = data.token;
      this.config.headers['Authorization'] = `Bearer ${this.config.token}`;
      console.log('✅ GFW API token carregado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar token GFW:', error);
      // Fallback para token hardcoded apenas em desenvolvimento
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.warn('⚠️ Usando token fallback (desenvolvimento apenas)');
        this.config.token = '***REMOVED***';
        this.config.headers['Authorization'] = `Bearer ${this.config.token}`;
      } else {
        throw new Error('Não foi possível carregar o token GFW em produção');
      }
    }
  }

  /**
   * Criar camadas base para visualização
   */
  createBaseLayers() {
    // Camada de atividade pesqueira
    const activityLayer = L.layerGroup();
    this.layers.set('activity', activityLayer);
    
    // Camada de heatmap
    const heatmapLayer = L.layerGroup();
    this.layers.set('heatmap', heatmapLayer);
    
    // Camada de rotas de embarcações
    const tracksLayer = L.layerGroup();
    this.layers.set('tracks', tracksLayer);
    
    // Camada de eventos
    const eventsLayer = L.layerGroup();
    this.layers.set('events', eventsLayer);
    
    // Camada de alertas
    const alertsLayer = L.layerGroup();
    this.layers.set('alerts', alertsLayer);
  }

  /**
   * Configurar eventos do mapa
   */
  setupMapEvents() {
    // Atualizar dados ao mover o mapa
    this.map.on('moveend', () => {
      if (this.activeLayers.size > 0) {
        this.updateVisibleData();
      }
    });
    
    // Atualizar ao mudar zoom
    this.map.on('zoomend', () => {
      this.adjustVisualization();
    });
  }

  /**
   * Carregar dados iniciais
   */
  async loadInitialData() {
    const bounds = this.map.getBounds();
    await this.loadVesselActivity(bounds);
  }

  /**
   * Carregar atividade de embarcações
   */
  async loadVesselActivity(bounds) {
    try {
      console.log('🚢 Carregando atividade de embarcações...');
      
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      const params = new URLSearchParams({
        'dataset': 'public-global-fishing-activity:v20231026',
        'start-date': this.filters.timeRange.start,
        'end-date': this.filters.timeRange.end,
        'vessel-groups': this.filters.vesselTypes.join(','),
        'bbox': bbox,
        'format': 'geojson'
      });
      
      const response = await fetch(`${this.config.baseUrl}/4wings/aggregate?${params}`, {
        headers: this.config.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.renderActivityData(data);
      
    } catch (error) {
      console.error('❌ Erro ao carregar atividade:', error);
    }
  }

  /**
   * Renderizar dados de atividade no mapa
   */
  renderActivityData(data) {
    const activityLayer = this.layers.get('activity');
    activityLayer.clearLayers();
    
    if (data.features) {
      data.features.forEach(feature => {
        const coords = feature.geometry.coordinates;
        const props = feature.properties;
        
        // Criar marcador customizado
        const marker = L.circleMarker([coords[1], coords[0]], {
          radius: this.getRadiusByActivity(props.hours),
          fillColor: this.getColorByIntensity(props.hours),
          color: '#ffffff',
          weight: 1,
          opacity: 0.8,
          fillOpacity: this.visualization.opacity
        });
        
        // Adicionar popup com informações
        marker.bindPopup(this.createActivityPopup(props));
        
        activityLayer.addLayer(marker);
      });
    }
    
    // Adicionar ao mapa se estiver ativa
    if (this.activeLayers.has('activity')) {
      activityLayer.addTo(this.map);
    }
  }

  /**
   * Criar popup de atividade
   */
  createActivityPopup(properties) {
    return `
      <div class="gfw-popup">
        <h4>🎣 Atividade de Pesca</h4>
        <p><strong>Horas de pesca:</strong> ${properties.hours || 0}h</p>
        <p><strong>Embarcações:</strong> ${properties.vessel_count || 0}</p>
        <p><strong>Confiança:</strong> ${this.getConfidenceStars(properties.confidence)}</p>
        <p><strong>Período:</strong> ${this.filters.timeRange.start} a ${this.filters.timeRange.end}</p>
      </div>
    `;
  }

  /**
   * Carregar heatmap de densidade
   */
  async loadHeatmap() {
    try {
      console.log('🔥 Carregando heatmap de densidade...');
      
      const bounds = this.map.getBounds();
      const zoom = this.map.getZoom();
      
      // Calcular tiles necessários
      const tiles = this.getTilesForBounds(bounds, zoom);
      
      for (const tile of tiles) {
        await this.loadHeatmapTile(tile);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar heatmap:', error);
    }
  }

  /**
   * Carregar tile individual do heatmap
   */
  async loadHeatmapTile(tile) {
    const cacheKey = `${tile.z}/${tile.x}/${tile.y}`;
    
    // Verificar cache
    if (this.tileCache.has(cacheKey)) {
      return this.tileCache.get(cacheKey);
    }
    
    try {
      const url = `${this.config.tilesUrl}/4wings/tile/heatmap/${tile.z}/${tile.x}/${tile.y}`;
      const params = new URLSearchParams({
        'dataset': 'public-global-fishing-activity:v20231026',
        'start-date': this.filters.timeRange.start,
        'end-date': this.filters.timeRange.end
      });
      
      const response = await fetch(`${url}?${params}`, {
        headers: this.config.headers
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        // Adicionar tile ao mapa
        const tileBounds = this.getTileBounds(tile);
        const imageOverlay = L.imageOverlay(imageUrl, tileBounds, {
          opacity: this.visualization.opacity
        });
        
        this.layers.get('heatmap').addLayer(imageOverlay);
        this.tileCache.set(cacheKey, imageOverlay);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar tile:', error);
    }
  }

  /**
   * Rastrear embarcação específica
   */
  async trackVessel(vesselId) {
    try {
      console.log(`🚢 Rastreando embarcação ${vesselId}...`);
      
      // Obter informações da embarcação
      const vesselInfo = await this.getVesselInfo(vesselId);
      
      // Obter trajetória
      const track = await this.getVesselTrack(vesselId);
      
      // Renderizar no mapa
      this.renderVesselTrack(vesselInfo, track);
      
    } catch (error) {
      console.error('❌ Erro ao rastrear embarcação:', error);
    }
  }

  /**
   * Obter informações da embarcação
   */
  async getVesselInfo(vesselId) {
    const response = await fetch(`${this.config.baseUrl}/vessels/${vesselId}`, {
      headers: this.config.headers
    });
    
    if (!response.ok) {
      throw new Error(`Vessel not found: ${vesselId}`);
    }
    
    return response.json();
  }

  /**
   * Obter trajetória da embarcação
   */
  async getVesselTrack(vesselId) {
    const params = new URLSearchParams({
      'vessel-id': vesselId,
      'start-date': this.filters.timeRange.start,
      'end-date': this.filters.timeRange.end,
      'format': 'geojson'
    });
    
    const response = await fetch(`${this.config.baseUrl}/tracks?${params}`, {
      headers: this.config.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get vessel track: ${vesselId}`);
    }
    
    return response.json();
  }

  /**
   * Renderizar trajetória da embarcação
   */
  renderVesselTrack(vesselInfo, trackData) {
    const tracksLayer = this.layers.get('tracks');
    
    // Criar polyline da trajetória
    if (trackData.features && trackData.features.length > 0) {
      const coordinates = trackData.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
      
      const trackLine = L.polyline(coordinates, {
        color: this.getVesselColor(vesselInfo.type),
        weight: 3,
        opacity: 0.8,
        smoothFactor: 1
      });
      
      // Adicionar marcador para posição atual
      const lastPosition = coordinates[coordinates.length - 1];
      const vesselMarker = L.marker(lastPosition, {
        icon: this.createVesselIcon(vesselInfo)
      });
      
      vesselMarker.bindPopup(this.createVesselPopup(vesselInfo));
      
      tracksLayer.addLayer(trackLine);
      tracksLayer.addLayer(vesselMarker);
      
      // Animar se configurado
      if (this.visualization.animate) {
        this.animateVessel(vesselMarker, coordinates);
      }
    }
  }

  /**
   * Detectar pesca ilegal em áreas protegidas
   */
  async detectIllegalFishing(protectedAreaPolygon) {
    try {
      console.log('🚨 Verificando atividade em área protegida...');
      
      // Converter polígono para WKT
      const wkt = this.polygonToWKT(protectedAreaPolygon);
      
      const params = new URLSearchParams({
        'geometry': wkt,
        'start-date': this.filters.timeRange.start,
        'end-date': this.filters.timeRange.end,
        'dataset': 'public-global-fishing-activity:v20231026'
      });
      
      const response = await fetch(`${this.config.baseUrl}/events/fishing?${params}`, {
        headers: this.config.headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to check illegal fishing');
      }
      
      const data = await response.json();
      
      if (data.total > 0) {
        this.createAlert('illegal_fishing', data);
        return data.events;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Erro ao detectar pesca ilegal:', error);
      return [];
    }
  }

  /**
   * Sistema de monitorização de alertas
   */
  startAlertMonitoring() {
    console.log('🚨 Iniciando monitorização de alertas...');
    
    // Verificar alertas periodicamente
    this.alertInterval = setInterval(() => {
      this.checkAlerts();
    }, this.alerts.checkInterval);
    
    // Verificação inicial
    this.checkAlerts();
  }

  /**
   * Verificar todos os alertas
   */
  async checkAlerts() {
    if (!this.alerts.enabled) return;
    
    for (const alertType of this.alerts.types) {
      switch (alertType) {
        case 'protected_area':
          await this.checkProtectedAreas();
          break;
        case 'illegal_fishing':
          await this.checkIllegalFishingPatterns();
          break;
        case 'encounters':
          await this.checkVesselEncounters();
          break;
      }
    }
  }

  /**
   * Verificar áreas protegidas
   */
  async checkProtectedAreas() {
    // Áreas protegidas de Angola
    const protectedAreas = [
      { name: 'Parque Nacional da Iona', polygon: this.getIonaPolygon() },
      { name: 'Reserva do Kwanza', polygon: this.getKwanzaPolygon() }
    ];
    
    for (const area of protectedAreas) {
      const violations = await this.detectIllegalFishing(area.polygon);
      if (violations.length > 0) {
        console.warn(`⚠️ ${violations.length} violações detectadas em ${area.name}`);
      }
    }
  }

  /**
   * Criar alerta visual no mapa
   */
  createAlert(type, data) {
    const alertsLayer = this.layers.get('alerts');
    
    const alertIcon = L.divIcon({
      className: 'gfw-alert-icon',
      html: `<div class="gfw-alert ${type}">⚠️</div>`,
      iconSize: [30, 30]
    });
    
    if (data.location) {
      const marker = L.marker([data.location.lat, data.location.lon], {
        icon: alertIcon
      });
      
      marker.bindPopup(this.createAlertPopup(type, data));
      alertsLayer.addLayer(marker);
    }
    
    // Notificar interface
    this.notifyAlert(type, data);
  }

  /**
   * Alternar camada
   */
  toggleLayer(layerName) {
    const layer = this.layers.get(layerName);
    if (!layer) return;
    
    if (this.activeLayers.has(layerName)) {
      this.map.removeLayer(layer);
      this.activeLayers.delete(layerName);
    } else {
      layer.addTo(this.map);
      this.activeLayers.add(layerName);
      
      // Carregar dados se necessário
      this.loadLayerData(layerName);
    }
  }

  /**
   * Carregar dados da camada
   */
  async loadLayerData(layerName) {
    switch (layerName) {
      case 'activity':
        await this.loadVesselActivity(this.map.getBounds());
        break;
      case 'heatmap':
        await this.loadHeatmap();
        break;
      case 'events':
        await this.loadFishingEvents();
        break;
    }
  }

  /**
   * Atualizar filtros
   */
  updateFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    
    // Recarregar dados ativos
    for (const layerName of this.activeLayers) {
      this.loadLayerData(layerName);
    }
  }

  /**
   * Métodos auxiliares
   */
  
  getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }
  
  getRadiusByActivity(hours) {
    return Math.min(Math.max(hours / 10, 5), 20);
  }
  
  getColorByIntensity(hours) {
    if (hours > 100) return '#ff0000';
    if (hours > 50) return '#ff7f00';
    if (hours > 20) return '#ffff00';
    if (hours > 10) return '#00ff00';
    return '#0000ff';
  }
  
  getConfidenceStars(confidence) {
    return '⭐'.repeat(Math.min(confidence || 0, 5));
  }
  
  getVesselColor(type) {
    const colors = {
      fishing: '#3498db',
      carrier: '#e74c3c',
      support: '#f39c12',
      passenger: '#9b59b6',
      cargo: '#1abc9c'
    };
    return colors[type] || '#95a5a6';
  }
  
  createVesselIcon(vesselInfo) {
    return L.divIcon({
      className: 'gfw-vessel-icon',
      html: `<div class="vessel-marker ${vesselInfo.type}">🚢</div>`,
      iconSize: [20, 20]
    });
  }
  
  createVesselPopup(vesselInfo) {
    return `
      <div class="gfw-vessel-popup">
        <h4>🚢 ${vesselInfo.name || 'Unknown Vessel'}</h4>
        <p><strong>MMSI:</strong> ${vesselInfo.mmsi || 'N/A'}</p>
        <p><strong>Bandeira:</strong> ${vesselInfo.flag || 'Unknown'}</p>
        <p><strong>Tipo:</strong> ${vesselInfo.type || 'Unknown'}</p>
        <p><strong>Comprimento:</strong> ${vesselInfo.length || 'N/A'}m</p>
        <button onclick="gfwIntegration.trackVessel('${vesselInfo.id}')">
          Rastrear Embarcação
        </button>
      </div>
    `;
  }
  
  createAlertPopup(type, data) {
    const titles = {
      illegal_fishing: '🚨 Possível Pesca Ilegal',
      protected_area: '⚠️ Atividade em Área Protegida',
      encounters: '🚢 Encontro de Embarcações'
    };
    
    return `
      <div class="gfw-alert-popup">
        <h4>${titles[type]}</h4>
        <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Embarcações:</strong> ${data.vessel_count || 1}</p>
        <p><strong>Duração:</strong> ${data.duration || 'N/A'}</p>
        <button onclick="gfwIntegration.investigateAlert('${type}', '${data.id}')">
          Investigar
        </button>
      </div>
    `;
  }
  
  getTilesForBounds(bounds, zoom) {
    const tiles = [];
    const tileSize = 256;
    
    const minTile = this.latLngToTile(bounds.getSouthWest().lat, bounds.getSouthWest().lng, zoom);
    const maxTile = this.latLngToTile(bounds.getNorthEast().lat, bounds.getNorthEast().lng, zoom);
    
    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }
    
    return tiles;
  }
  
  latLngToTile(lat, lng, zoom) {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  }
  
  getTileBounds(tile) {
    const n = Math.pow(2, tile.z);
    const lon1 = tile.x / n * 360 - 180;
    const lat1 = Math.atan(Math.sinh(Math.PI * (1 - 2 * tile.y / n))) * 180 / Math.PI;
    const lon2 = (tile.x + 1) / n * 360 - 180;
    const lat2 = Math.atan(Math.sinh(Math.PI * (1 - 2 * (tile.y + 1) / n))) * 180 / Math.PI;
    
    return [[lat2, lon1], [lat1, lon2]];
  }
  
  polygonToWKT(polygon) {
    const coords = polygon.map(p => `${p[0]} ${p[1]}`).join(', ');
    return `POLYGON((${coords}))`;
  }
  
  getIonaPolygon() {
    return [
      [15.736, -16.154],
      [15.736, -17.382],
      [13.269, -17.382],
      [13.269, -16.154],
      [15.736, -16.154]
    ];
  }
  
  getKwanzaPolygon() {
    return [
      [13.366, -9.297],
      [13.366, -9.866],
      [12.814, -9.866],
      [12.814, -9.297],
      [13.366, -9.297]
    ];
  }
  
  notifyAlert(type, data) {
    // Disparar evento customizado
    const event = new CustomEvent('gfw-alert', {
      detail: { type, data, timestamp: new Date() }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Limpar recursos
   */
  destroy() {
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
    }
    
    // Remover todas as camadas
    for (const [name, layer] of this.layers) {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    }
    
    // Limpar caches
    this.vesselCache.clear();
    this.tileCache.clear();
  }
}

// Tornar disponível globalmente
window.GFWIntegration = GFWIntegration;
