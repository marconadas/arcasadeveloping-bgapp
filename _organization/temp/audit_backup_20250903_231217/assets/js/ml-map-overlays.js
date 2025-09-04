/**
 * BGAPP ML Map Overlays
 * Sistema de overlays preditivos para o mapa principal
 * Versão: 1.0.0
 */

class MLMapOverlays {
  constructor(map, mlService) {
    this.map = map;
    this.mlService = mlService;
    this.overlays = new Map();
    this.activeFilters = new Set();
    this.controlPanel = null;
    this.isInitialized = false;
    
    // Configurações
    this.updateInterval = 60000; // 1 minuto
    this.autoRefresh = true;
    
    // Estilos padrão para diferentes tipos de filtros
    this.filterStyles = {
      'biodiversity_hotspots': {
        color: '#28a745',
        fillColor: '#28a745',
        icon: '🌿'
      },
      'species_presence': {
        color: '#17a2b8',
        fillColor: '#17a2b8', 
        icon: '🐟'
      },
      'habitat_suitability': {
        color: '#6f42c1',
        fillColor: '#6f42c1',
        icon: '🏞️'
      },
      'conservation_priority': {
        color: '#dc3545',
        fillColor: '#dc3545',
        icon: '🛡️'
      },
      'fishing_zones': {
        color: '#fd7e14',
        fillColor: '#fd7e14',
        icon: '🎣'
      },
      'monitoring_points': {
        color: '#6c757d',
        fillColor: '#6c757d',
        icon: '📍'
      },
      'risk_areas': {
        color: '#ffc107',
        fillColor: '#ffc107',
        icon: '⚠️'
      }
    };
    
    console.log('🗺️ MLMapOverlays inicializado');
  }

  /**
   * Inicializa o sistema de overlays
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando ML Map Overlays...');
      
      // Aguardar MLService estar pronto
      if (!this.mlService) {
        throw new Error('MLService não está disponível');
      }

      // Carregar filtros disponíveis
      await this.loadAvailableFilters();
      
      // Criar painel de controle
      this.createControlPanel();
      
      // Configurar auto-refresh
      if (this.autoRefresh) {
        this.startAutoRefresh();
      }
      
      // Escutar eventos do MLService
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ ML Map Overlays inicializado com sucesso');
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro inicializando ML Map Overlays:', error);
      return false;
    }
  }

  /**
   * Carrega filtros disponíveis da API
   */
  async loadAvailableFilters() {
    try {
      const response = await this.mlService.getFilters();
      const filters = response.filters || [];
      
      console.log(`📊 Carregando ${filters.length} filtros disponíveis`);
      
      for (const filter of filters) {
        if (filter.is_active) {
          await this.createFilterOverlay(filter);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro carregando filtros:', error);
      throw error;
    }
  }

  /**
   * Cria overlay para um filtro específico
   */
  async createFilterOverlay(filter) {
    try {
      console.log(`🎨 Criando overlay para filtro: ${filter.name}`);
      
      // Obter dados do filtro
      const filterData = await this.mlService.getFilterData(filter.filter_id);
      
      if (!filterData || !filterData.geojson || !filterData.geojson.features) {
        console.warn(`⚠️ Sem dados para filtro ${filter.filter_id}`);
        return null;
      }

      // Obter estilo para este tipo de filtro
      const style = this.filterStyles[filter.type] || this.filterStyles['monitoring_points'];
      
      // Criar layer GeoJSON
      const layer = L.geoJSON(filterData.geojson, {
        pointToLayer: (feature, latlng) => {
          return this.createPredictiveMarker(feature, latlng, style);
        },
        onEachFeature: (feature, layer) => {
          this.bindPredictivePopup(feature, layer, filter);
        },
        style: (feature) => {
          return this.getFeatureStyle(feature, style);
        }
      });

      // Armazenar overlay
      const overlay = {
        id: filter.filter_id,
        name: filter.name,
        type: filter.type,
        layer: layer,
        filter: filter,
        visible: false,
        pointCount: filterData.total_points || 0,
        lastUpdated: filterData.last_updated,
        style: style
      };
      
      this.overlays.set(filter.filter_id, overlay);
      
      console.log(`✅ Overlay criado: ${filter.name} (${overlay.pointCount} pontos)`);
      return overlay;
      
    } catch (error) {
      console.error(`❌ Erro criando overlay para ${filter.filter_id}:`, error);
      return null;
    }
  }

  /**
   * Cria marcador preditivo personalizado
   */
  createPredictiveMarker(feature, latlng, style) {
    const props = feature.properties;
    const confidence = props.confidence || 0;
    
    // Tamanho baseado na confiança
    const baseSize = props.marker_size || 8;
    const size = Math.max(6, Math.min(20, baseSize * (0.5 + confidence)));
    
    // Cor baseada na confiança
    const color = this.getConfidenceColor(confidence, style.color);
    
    return L.circleMarker(latlng, {
      radius: size,
      fillColor: color,
      color: '#ffffff',
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.7,
      className: 'ml-predictive-marker',
      pane: 'markerPane',
      zIndex: 1000
    });
  }

  /**
   * Vincula popup informativo ao marcador
   */
  bindPredictivePopup(feature, layer, filter) {
    const props = feature.properties;
    const confidence = (props.confidence * 100).toFixed(1);
    
    const popupContent = `
      <div class="ml-popup">
        <div class="ml-popup-header">
          <span class="ml-popup-icon">${this.filterStyles[filter.type]?.icon || '📍'}</span>
          <h4>${filter.name}</h4>
        </div>
        <div class="ml-popup-content">
          <div class="prediction-item">
            <strong>Predição:</strong> ${this.formatPrediction(props.prediction)}
          </div>
          <div class="confidence-item">
            <strong>Confiança:</strong> 
            <span class="confidence-badge confidence-${this.getConfidenceLevel(props.confidence)}">
              ${confidence}%
            </span>
          </div>
          <div class="location-item">
            <strong>Coordenadas:</strong> ${props.latitude?.toFixed(4)}, ${props.longitude?.toFixed(4)}
          </div>
          ${props.area_name ? `<div class="area-item"><strong>Área:</strong> ${props.area_name}</div>` : ''}
          ${props.predicted_at ? `<div class="time-item"><strong>Predito em:</strong> ${new Date(props.predicted_at).toLocaleString()}</div>` : ''}
        </div>
        <div class="ml-popup-actions">
          <button onclick="window.mlMapOverlays?.zoomToPoint(${props.latitude}, ${props.longitude}) || alert('Sistema ML carregando...')" class="btn-zoom">
            🔍 Zoom
          </button>
          <button onclick="window.mlMapOverlays?.showDetails('${props.point_id}') || alert('Sistema ML carregando...')" class="btn-details">
            📊 Detalhes
          </button>
        </div>
      </div>
    `;
    
    layer.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'ml-predictive-popup'
    });
  }

  /**
   * Obtém estilo para feature baseado na confiança
   */
  getFeatureStyle(feature, baseStyle) {
    const confidence = feature.properties.confidence || 0;
    
    return {
      ...baseStyle,
      fillOpacity: 0.3 + (confidence * 0.4), // 0.3 a 0.7
      weight: confidence > 0.8 ? 3 : 2
    };
  }

  /**
   * Obtém cor baseada na confiança
   */
  getConfidenceColor(confidence, baseColor) {
    if (confidence >= 0.8) return baseColor;
    if (confidence >= 0.6) return this.adjustColor(baseColor, 0.8);
    if (confidence >= 0.4) return this.adjustColor(baseColor, 0.6);
    return this.adjustColor(baseColor, 0.4);
  }

  /**
   * Ajusta cor baseado na intensidade
   */
  adjustColor(color, intensity) {
    // Implementação simples - em produção usar biblioteca de cores
    return color;
  }

  /**
   * Obtém nível de confiança para CSS classes
   */
  getConfidenceLevel(confidence) {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    if (confidence >= 0.4) return 'low';
    return 'very-low';
  }

  /**
   * Formata valor da predição para exibição
   */
  formatPrediction(prediction) {
    if (typeof prediction === 'object') {
      if (prediction.species_richness) {
        return `${prediction.species_richness} espécies`;
      }
      if (prediction.temperature) {
        return `${prediction.temperature.toFixed(1)}°C`;
      }
      return JSON.stringify(prediction);
    }
    return String(prediction);
  }

  /**
   * Cria painel de controle dos filtros ML
   */
  createControlPanel() {
    const controlDiv = document.createElement('div');
    controlDiv.className = 'ml-filters-control leaflet-control';
    controlDiv.innerHTML = this.generateControlHTML();
    
    // Adicionar eventos
    this.setupControlEvents(controlDiv);
    
    // Adicionar como controle do Leaflet
    const control = L.control({ position: 'topright' });
    control.onAdd = () => controlDiv;
    control.addTo(this.map);
    
    this.controlPanel = controlDiv;
    
    console.log('🎛️ Painel de controle criado');
  }

  /**
   * Gera HTML do painel de controle
   */
  generateControlHTML() {
    const overlaysList = Array.from(this.overlays.values());
    
    return `
      <div class="ml-control-header">
        <div class="ml-control-title">
          <span class="ml-icon">🧠</span>
          <span class="ml-title">Filtros ML</span>
          <span class="ml-count">${overlaysList.length}</span>
        </div>
        <button class="ml-toggle-btn" data-action="toggle">▼</button>
      </div>
      <div class="ml-control-content">
        <div class="ml-filters-list">
          ${overlaysList.map(overlay => `
            <div class="ml-filter-item" data-filter-id="${overlay.id}">
              <label class="ml-filter-label">
                <input type="checkbox" class="ml-filter-checkbox" data-filter-id="${overlay.id}">
                <span class="ml-filter-icon">${overlay.style.icon}</span>
                <span class="ml-filter-name">${overlay.name}</span>
                <span class="ml-filter-count">${overlay.pointCount}</span>
              </label>
              <div class="ml-filter-actions">
                <button class="ml-filter-refresh" data-filter-id="${overlay.id}" title="Atualizar">
                  🔄
                </button>
                <button class="ml-filter-info" data-filter-id="${overlay.id}" title="Informações">
                  ℹ️
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="ml-control-footer">
          <button class="ml-refresh-all" data-action="refresh-all">
            🔄 Atualizar Todos
          </button>
          <button class="ml-settings" data-action="settings">
            ⚙️ Configurações
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Configura eventos do painel de controle
   */
  setupControlEvents(controlDiv) {
    controlDiv.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const filterId = e.target.dataset.filterId;
      
      switch (action) {
        case 'toggle':
          this.toggleControlPanel();
          break;
        case 'refresh-all':
          this.refreshAllFilters();
          break;
        case 'settings':
          this.showSettings();
          break;
      }
      
      if (filterId && e.target.classList.contains('ml-filter-refresh')) {
        this.refreshFilter(filterId);
      }
      
      if (filterId && e.target.classList.contains('ml-filter-info')) {
        this.showFilterInfo(filterId);
      }
    });
    
    controlDiv.addEventListener('change', (e) => {
      if (e.target.classList.contains('ml-filter-checkbox')) {
        const filterId = e.target.dataset.filterId;
        this.toggleFilter(filterId);
      }
    });
  }

  /**
   * Alterna visibilidade do painel de controle
   */
  toggleControlPanel() {
    const content = this.controlPanel.querySelector('.ml-control-content');
    const toggle = this.controlPanel.querySelector('.ml-toggle-btn');
    
    const isVisible = content.style.display !== 'none';
    
    content.style.display = isVisible ? 'none' : 'block';
    toggle.textContent = isVisible ? '▶' : '▼';
  }

  /**
   * Alterna visibilidade de um filtro
   */
  toggleFilter(filterId) {
    const overlay = this.overlays.get(filterId);
    if (!overlay) return;
    
    if (overlay.visible) {
      this.map.removeLayer(overlay.layer);
      overlay.visible = false;
      this.activeFilters.delete(filterId);
      console.log(`👁️ Filtro ocultado: ${overlay.name}`);
    } else {
      this.map.addLayer(overlay.layer);
      overlay.visible = true;
      this.activeFilters.add(filterId);
      console.log(`👁️ Filtro exibido: ${overlay.name}`);
    }
    
    this.updateControlPanel();
  }

  /**
   * Atualiza um filtro específico
   */
  async refreshFilter(filterId) {
    try {
      const overlay = this.overlays.get(filterId);
      if (!overlay) return;
      
      console.log(`🔄 Atualizando filtro: ${overlay.name}`);
      
      // Mostrar indicador de carregamento
      this.showLoadingIndicator(filterId);
      
      // Atualizar dados via API
      await this.mlService.refreshFilter(filterId);
      
      // Recarregar dados do filtro
      const filterData = await this.mlService.getFilterData(filterId);
      
      if (filterData && filterData.geojson) {
        // Remover layer atual se visível
        if (overlay.visible) {
          this.map.removeLayer(overlay.layer);
        }
        
        // Criar novo layer
        const newLayer = L.geoJSON(filterData.geojson, {
          pointToLayer: (feature, latlng) => {
            return this.createPredictiveMarker(feature, latlng, overlay.style);
          },
          onEachFeature: (feature, layer) => {
            this.bindPredictivePopup(feature, layer, overlay.filter);
          }
        });
        
        // Atualizar overlay
        overlay.layer = newLayer;
        overlay.pointCount = filterData.total_points || 0;
        overlay.lastUpdated = new Date().toISOString();
        
        // Re-adicionar se estava visível
        if (overlay.visible) {
          this.map.addLayer(overlay.layer);
        }
        
        console.log(`✅ Filtro atualizado: ${overlay.name} (${overlay.pointCount} pontos)`);
      }
      
    } catch (error) {
      console.error(`❌ Erro atualizando filtro ${filterId}:`, error);
    } finally {
      this.hideLoadingIndicator(filterId);
      this.updateControlPanel();
    }
  }

  /**
   * Atualiza todos os filtros
   */
  async refreshAllFilters() {
    console.log('🔄 Atualizando todos os filtros...');
    
    const promises = Array.from(this.overlays.keys()).map(filterId => 
      this.refreshFilter(filterId)
    );
    
    await Promise.all(promises);
    console.log('✅ Todos os filtros atualizados');
  }

  /**
   * Mostra indicador de carregamento
   */
  showLoadingIndicator(filterId) {
    const refreshBtn = this.controlPanel.querySelector(`[data-filter-id="${filterId}"].ml-filter-refresh`);
    if (refreshBtn) {
      refreshBtn.innerHTML = '⏳';
      refreshBtn.disabled = true;
    }
  }

  /**
   * Oculta indicador de carregamento
   */
  hideLoadingIndicator(filterId) {
    const refreshBtn = this.controlPanel.querySelector(`[data-filter-id="${filterId}"].ml-filter-refresh`);
    if (refreshBtn) {
      refreshBtn.innerHTML = '🔄';
      refreshBtn.disabled = false;
    }
  }

  /**
   * Atualiza painel de controle
   */
  updateControlPanel() {
    if (!this.controlPanel) return;
    
    const activeCount = this.activeFilters.size;
    const totalCount = this.overlays.size;
    
    const countElement = this.controlPanel.querySelector('.ml-count');
    if (countElement) {
      countElement.textContent = `${activeCount}/${totalCount}`;
    }
  }

  /**
   * Mostra informações de um filtro
   */
  showFilterInfo(filterId) {
    const overlay = this.overlays.get(filterId);
    if (!overlay) return;
    
    const info = `
      Nome: ${overlay.name}
      Tipo: ${overlay.type}
      Pontos: ${overlay.pointCount}
      Última atualização: ${overlay.lastUpdated ? new Date(overlay.lastUpdated).toLocaleString() : 'N/A'}
      Confiança mínima: ${(overlay.filter.min_confidence * 100).toFixed(0)}%
    `;
    
    alert(info); // Em produção, usar modal customizado
  }

  /**
   * Mostra configurações
   */
  showSettings() {
    console.log('⚙️ Abrindo configurações...');
    
    // Criar modal de configurações
    const modal = document.createElement('div');
    modal.className = 'ml-settings-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    
    modalContent.innerHTML = `
      <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 1.5rem;">
        <h3 style="margin: 0; color: #6f42c1;">⚙️ Configurações ML</h3>
        <button onclick="this.closest('.ml-settings-modal').remove()" 
                style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999;">✕</button>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h5 style="color: #333; margin-bottom: 1rem;">🎛️ Controles Gerais</h5>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Auto-Refresh:</label>
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" ${this.autoRefresh ? 'checked' : ''} 
                   onchange="window.mlOverlays.toggleAutoRefresh(this.checked)"
                   style="margin-right: 0.5rem;">
            <span>Atualizar automaticamente a cada ${this.updateInterval/1000}s</span>
          </label>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Intervalo de Atualização:</label>
          <select onchange="window.mlOverlays.setUpdateInterval(parseInt(this.value))" 
                  style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
            <option value="30000" ${this.updateInterval === 30000 ? 'selected' : ''}>30 segundos</option>
            <option value="60000" ${this.updateInterval === 60000 ? 'selected' : ''}>1 minuto</option>
            <option value="120000" ${this.updateInterval === 120000 ? 'selected' : ''}>2 minutos</option>
            <option value="300000" ${this.updateInterval === 300000 ? 'selected' : ''}>5 minutos</option>
          </select>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Tamanho do Lote:</label>
          <input type="range" min="5" max="50" value="${this.mlService?.batchSize || 10}" 
                 onchange="window.mlOverlays.setBatchSize(parseInt(this.value)); this.nextElementSibling.textContent = this.value"
                 style="width: 100%;">
          <span style="font-size: 0.9rem; color: #666;">${this.mlService?.batchSize || 10}</span>
        </div>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h5 style="color: #333; margin-bottom: 1rem;">🎨 Estilos de Filtros</h5>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
          ${Object.keys(this.filterStyles).map(filterType => `
            <div style="padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
              <span style="color: ${this.filterStyles[filterType].color};">${this.filterStyles[filterType].icon}</span>
              <span style="margin-left: 0.5rem;">${filterType.replace('_', ' ')}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h5 style="color: #333; margin-bottom: 1rem;">📊 Estatísticas Atuais</h5>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
          <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
            <div style="font-size: 1.5rem; font-weight: 700; color: #6f42c1;">${this.overlays.size}</div>
            <div style="font-size: 0.9rem; color: #666;">Overlays Ativos</div>
          </div>
          <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
            <div style="font-size: 1.5rem; font-weight: 700; color: #28a745;">${this.activeFilters.size}</div>
            <div style="font-size: 0.9rem; color: #666;">Filtros Ativos</div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 1rem; justify-content: flex-end;">
        <button onclick="window.mlOverlays.clearAllFilters(); this.closest('.ml-settings-modal').remove();"
                style="padding: 0.75rem 1.5rem; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">
          🧹 Limpar Todos
        </button>
        <button onclick="window.mlOverlays.refreshAllFilters(); this.closest('.ml-settings-modal').remove();"
                style="padding: 0.75rem 1.5rem; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer;">
          🔄 Atualizar Todos
        </button>
        <button onclick="this.closest('.ml-settings-modal').remove()"
                style="padding: 0.75rem 1.5rem; background: #6f42c1; color: white; border: none; border-radius: 6px; cursor: pointer;">
          ✅ Fechar
        </button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Fechar modal clicando fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    console.log('✅ Modal de configurações aberto');
  }

  /**
   * Toggle auto-refresh
   */
  toggleAutoRefresh(enabled) {
    this.autoRefresh = enabled;
    if (enabled) {
      this.startAutoRefresh();
      console.log('✅ Auto-refresh ativado');
    } else {
      this.stopAutoRefresh();
      console.log('⏸️ Auto-refresh desativado');
    }
  }

  /**
   * Define intervalo de atualização
   */
  setUpdateInterval(interval) {
    this.updateInterval = interval;
    if (this.autoRefresh) {
      this.stopAutoRefresh();
      this.startAutoRefresh();
    }
    console.log(`⏱️ Intervalo atualizado para ${interval/1000}s`);
  }

  /**
   * Define tamanho do lote
   */
  setBatchSize(size) {
    if (this.mlService) {
      this.mlService.batchSize = size;
      console.log(`📦 Tamanho do lote atualizado para ${size}`);
    }
  }

  /**
   * Faz zoom para um ponto específico
   */
  zoomToPoint(lat, lng) {
    this.map.setView([lat, lng], 12);
  }

  /**
   * Mostra detalhes de um ponto
   */
  showDetails(pointId) {
    console.log('📊 Mostrando detalhes para ponto:', pointId);
    
    // Buscar dados do ponto nas camadas ativas
    let pointData = null;
    
    this.overlays.forEach((overlay, filterId) => {
      if (overlay.visible && overlay.layer) {
        overlay.layer.eachLayer(layer => {
          if (layer.feature && layer.feature.properties.point_id === pointId) {
            pointData = {
              ...layer.feature.properties,
              filterName: overlay.name,
              filterType: overlay.type
            };
          }
        });
      }
    });
    
    if (pointData) {
      // Criar modal com detalhes completos
      const modalContent = `
        <div class="ml-details-modal" style="
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: white; padding: 20px; border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 10000;
          max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #333;">📊 Detalhes da Predição ML</h3>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                    style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
          </div>
          
          <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #6f42c1;">🎯 Filtro: ${pointData.filterName}</h4>
            <div><strong>ID do Ponto:</strong> ${pointData.point_id}</div>
            <div><strong>Tipo:</strong> ${pointData.filterType}</div>
          </div>
          
          <div style="margin-bottom: 15px; padding: 10px; background: #e8f5e8; border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #28a745;">🔮 Predições ML</h4>
            <pre style="background: white; padding: 8px; border-radius: 4px; font-size: 12px; overflow-x: auto;">${JSON.stringify(pointData.prediction, null, 2)}</pre>
          </div>
          
          <div style="margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #1976d2;">📍 Localização</h4>
            <div><strong>Latitude:</strong> ${pointData.latitude?.toFixed(6)}°</div>
            <div><strong>Longitude:</strong> ${pointData.longitude?.toFixed(6)}°</div>
            <div><strong>Área:</strong> ${pointData.area_name}</div>
          </div>
          
          <div style="margin-bottom: 15px; padding: 10px; background: #fff3e0; border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #f57c00;">⚡ Métricas</h4>
            <div><strong>Confiança ML:</strong> <span style="color: ${pointData.confidence > 0.8 ? '#28a745' : pointData.confidence > 0.6 ? '#ffc107' : '#dc3545'}">${(pointData.confidence * 100).toFixed(1)}%</span></div>
            <div><strong>Tamanho do Marcador:</strong> ${pointData.marker_size}px</div>
            <div><strong>Predito em:</strong> ${new Date(pointData.predicted_at).toLocaleString('pt-BR')}</div>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="navigator.clipboard?.writeText(JSON.stringify(${JSON.stringify(pointData)}, null, 2))" 
                    style="padding: 8px 16px; background: #6f42c1; color: white; border: none; border-radius: 6px; cursor: pointer;">
              📋 Copiar Dados
            </button>
            <button onclick="window.open('https://www.google.com/maps?q=${pointData.latitude},${pointData.longitude}', '_blank')"
                    style="padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 6px; cursor: pointer;">
              🌍 Ver no Google Maps
            </button>
          </div>
        </div>
        
        <div class="ml-modal-overlay" onclick="this.nextElementSibling.remove(); this.remove();" style="
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(0,0,0,0.5); z-index: 9999;
        "></div>
      `;
      
      // Adicionar modal ao DOM
      document.body.insertAdjacentHTML('beforeend', modalContent);
      
    } else {
      alert('Detalhes não encontrados para este ponto.');
    }
  }

  /**
   * Configura listeners de eventos
   */
  setupEventListeners() {
    // Escutar eventos do MLService
    this.mlService.on('filterCreated', (data) => {
      console.log('🆕 Novo filtro criado:', data.name);
      this.loadAvailableFilters(); // Recarregar filtros
    });
    
    this.mlService.on('filterRefreshed', (data) => {
      console.log('🔄 Filtro atualizado:', data.filterId);
    });
  }

  /**
   * Inicia atualização automática
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      if (this.activeFilters.size > 0) {
        console.log('🔄 Auto-refresh dos filtros ativos...');
        this.refreshAllFilters();
      }
    }, this.updateInterval);
    
    console.log(`⏰ Auto-refresh configurado (${this.updateInterval / 1000}s)`);
  }

  /**
   * Para atualização automática
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('⏹️ Auto-refresh parado');
    }
  }

  /**
   * Limpa todos os overlays
   */
  clearAll() {
    for (const overlay of this.overlays.values()) {
      if (overlay.visible) {
        this.map.removeLayer(overlay.layer);
      }
    }
    
    this.overlays.clear();
    this.activeFilters.clear();
    
    if (this.controlPanel) {
      this.controlPanel.remove();
      this.controlPanel = null;
    }
    
    this.stopAutoRefresh();
    console.log('🧹 Todos os overlays ML limpos');
  }

  /**
   * Obtém estatísticas dos overlays
   */
  getStats() {
    const totalPoints = Array.from(this.overlays.values())
      .reduce((sum, overlay) => sum + overlay.pointCount, 0);
    
    return {
      totalFilters: this.overlays.size,
      activeFilters: this.activeFilters.size,
      totalPoints: totalPoints,
      autoRefresh: this.autoRefresh,
      updateInterval: this.updateInterval
    };
  }
}

// Instância global
window.MLMapOverlays = MLMapOverlays;

// Auto-inicialização quando mapa e MLService estiverem prontos
document.addEventListener('DOMContentLoaded', () => {
  // Aguardar mapa e MLService estarem disponíveis
  const checkAndInitialize = () => {
    if (window.map && window.mlService && window.mlService.isInitialized !== false) {
      window.mlMapOverlays = new MLMapOverlays(window.map, window.mlService);
      window.mlMapOverlays.initialize();
    } else {
      setTimeout(checkAndInitialize, 1000);
    }
  };
  
  setTimeout(checkAndInitialize, 2000); // Aguardar 2s para outros componentes
});

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MLMapOverlays;
}
