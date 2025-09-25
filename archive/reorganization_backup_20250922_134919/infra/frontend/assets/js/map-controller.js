/**
 * BGAPP Map Controller - Sistema Principal de Controle do Mapa
 * Versão: 2.0 - Janeiro 2025
 * Responsável por: Inicialização, estado global e coordenação de componentes
 */

class BGAPPMapController {
  constructor() {
    this.apiBase = location.hostname === 'localhost' ? 'http://localhost:5080' : '/api';
    this.map = null;
    this.components = {};
    this.appState = {
      occLayer: null,
      velocityLayer: null,
      wmsLayers: {},
      activeLayers: new Set(),
      isAnimating: false,
      currentVariable: null,
      dateFilter: null
    };
    
    this.init();
  }

  /**
   * Inicialização principal do sistema
   */
  async init() {
    try {
      await this.initializeMap();
      await this.initializeComponents();
      this.setupEventListeners();
      this.setupKeyboardNavigation();
      this.announceSystemReady();
      
      console.log('✅ BGAPP Map Controller inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro na inicialização do Map Controller:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Configurar mapa Leaflet com TimeDimension
   */
  async initializeMap() {
    this.map = L.map('map', {
      center: [-12.5, 13.5],
      zoom: 6,
      timeDimension: true,
      timeDimensionControl: true,
      timeDimensionControlOptions: {
        position: 'bottomleft',
        autoPlay: false,
        loopButton: true,
        playButton: true,
        timeSliderDragUpdate: true,
        speedSlider: false
      },
      // Acessibilidade
      keyboard: true,
      keyboardPanDelta: 80
    });

    // Configurar eventos de acessibilidade do mapa
    this.map.on('focus', () => {
      this.updateAriaLive('Mapa focado. Use as setas do teclado para navegar.');
    });

    this.map.on('zoomend', () => {
      const zoom = this.map.getZoom();
      this.updateAriaLive(`Zoom alterado para nível ${zoom}`);
    });

    this.map.on('moveend', () => {
      const center = this.map.getCenter();
      this.updateAriaLive(`Mapa movido para coordenadas ${center.lat.toFixed(2)}, ${center.lng.toFixed(2)}`);
    });
  }

  /**
   * Inicializar todos os componentes do sistema
   */
  async initializeComponents() {
    const componentInitializers = [
      { name: 'eoxManager', class: 'EOXLayersManager' },
      { name: 'sentinel2', class: 'Sentinel2Integration' },
      { name: 'gebco', class: 'GEBCOBathymetry' },
      { name: 'attributionSystem', class: 'AttributionSystem' },
      { name: 'copernicusIntegration', class: 'CopernicusIntegration' },
      { name: 'projectionManager', class: 'ProjectionManager' },
      { name: 'offlineCapability', class: 'OfflineMapCapability' },
      { name: 'threeDVisualization', class: 'ThreeDVisualization' },
      { name: 'gfwIntegration', class: 'GFWIntegration' } // Global Fishing Watch Integration
    ];

    for (const { name, class: ComponentClassName } of componentInitializers) {
      try {
        if (window[ComponentClassName]) {
          this.components[name] = new window[ComponentClassName]();
          await this.initializeComponent(name);
          console.log(`✅ Componente ${name} inicializado`);
        } else {
          console.warn(`⚠️ Classe ${ComponentClassName} não encontrada`);
        }
      } catch (error) {
        console.warn(`⚠️ Falha ao inicializar ${name}:`, error);
      }
    }

    // Inicializar ZEE Angola
    this.initializeZEE();
  }

  /**
   * Inicializar componente específico
   */
  async initializeComponent(componentName) {
    const component = this.components[componentName];
    
    try {
      switch (componentName) {
        case 'eoxManager':
          if (component.setupRateLimiting) component.setupRateLimiting();
          if (component.createLayerControl) component.createLayerControl(this.map);
          if (component.initializeDefault) component.initializeDefault(this.map, 'terrain-light');
          break;
          
        case 'sentinel2':
          if (component.addToMap) component.addToMap(this.map, this.components.eoxManager);
          break;
          
        case 'gebco':
          if (component.createBathymetryControl) component.createBathymetryControl(this.map);
          if (component.enableDepthPopup) component.enableDepthPopup(this.map);
          break;
          
        case 'attributionSystem':
          if (component.createAttributionControl) component.createAttributionControl(this.map);
          if (component.setupAutoAttributions) component.setupAutoAttributions(this.components.eoxManager);
          break;
          
        case 'copernicusIntegration':
          if (component.addToMap) component.addToMap(this.map);
          break;
          
        case 'projectionManager':
          if (component.createProjectionControl) component.createProjectionControl(this.map);
          break;
          
        case 'offlineCapability':
          if (component.createOfflineControl) component.createOfflineControl(this.map);
          break;
          
        case 'threeDVisualization':
          if (component.create3DControl) component.create3DControl(this.map);
          break;
          
        case 'gfwIntegration':
          if (component.initialize) await component.initialize(this.map);
          break;
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao configurar ${componentName}:`, error);
    }
  }

  /**
   * Configurar ZEE Angola
   */
  initializeZEE() {
    // ZEE Angola Continental
    if (typeof angolaZEEOfficial !== 'undefined') {
      const angolaLayer = L.polygon(angolaZEEOfficial, {
              color: '#0066cc',
      weight: 2,
      fillOpacity: 0.08,
      fillColor: '#0080ff',
      opacity: 0.6,
      pane: 'overlayPane',
      zIndex: 1
    }).addTo(this.map);

      angolaLayer.bindPopup('🌊 ZEE Angola - OFICIAL<br>📏 495.866 km² (Marine Regions)');
      angolaLayer.on('popupopen', () => {
        this.updateAriaLive('Popup da ZEE Angola aberto');
      });
      
      console.log('✅ ZEE Angola oficial adicionada');
    }

    // ZEE Cabinda
    if (typeof cabindaZEEOfficial !== 'undefined') {
      const cabindaLayer = L.polygon(cabindaZEEOfficial, {
        color: '#9b59b6',
        weight: 2,
        fillOpacity: 0.08,
        fillColor: '#9b59b6',
        opacity: 0.6,
        pane: 'overlayPane',
        zIndex: 1
      }).addTo(this.map);

      cabindaLayer.bindPopup('🏛️ ZEE Cabinda - OFICIAL<br>📍 Marine Regions');
      cabindaLayer.on('popupopen', () => {
        this.updateAriaLive('Popup da ZEE Cabinda aberto');
      });
      
      console.log('✅ ZEE Cabinda adicionada');
    }
  }

  /**
   * Configurar event listeners dos controles
   */
  setupEventListeners() {
    // Filtro de data
    const applyBtn = document.getElementById('apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.handleDateFilter();
      });
    }

    // Variáveis oceanográficas
    const sstBtn = document.getElementById('btn-sst');
    if (sstBtn) {
      sstBtn.addEventListener('click', () => {
        this.handleVariableToggle('sst', 'Temperatura da Superfície do Mar');
      });
    }

    const salinityBtn = document.getElementById('btn-salinity');
    if (salinityBtn) {
      salinityBtn.addEventListener('click', () => {
        this.handleVariableToggle('salinity', 'Salinidade');
      });
    }

    const chlorophyllBtn = document.getElementById('btn-chlorophyll');
    if (chlorophyllBtn) {
      chlorophyllBtn.addEventListener('click', () => {
        this.handleVariableToggle('chlorophyll', 'Clorofila');
      });
    }

    // Campos vetoriais
    const currentsBtn = document.getElementById('btn-currents');
    if (currentsBtn) {
      currentsBtn.addEventListener('click', () => {
        this.handleVariableToggle('currents', 'Correntes Marítimas');
      });
    }

    const windBtn = document.getElementById('btn-wind');
    if (windBtn) {
      windBtn.addEventListener('click', () => {
        this.handleVariableToggle('wind', 'Vento');
      });
    }

    // Controles
    const clearBtn = document.getElementById('btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.handleClearAll();
      });
    }

    const animateBtn = document.getElementById('btn-animate');
    if (animateBtn) {
      animateBtn.addEventListener('click', () => {
        this.handleAnimationToggle();
      });
    }

    // Eventos de teclado para acessibilidade
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  /**
   * Configurar navegação por teclado
   */
  setupKeyboardNavigation() {
    const focusableElements = document.querySelectorAll(
      'button, input, [tabindex="0"], [role="button"]'
    );

    focusableElements.forEach(element => {
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          element.click();
        }
      });
    });
  }

  /**
   * Manipular filtro de data
   */
  handleDateFilter() {
    const dateInput = document.getElementById('dateMin');
    if (!dateInput) return;

    const date = new Date(dateInput.value);
    
    if (isNaN(date.getTime())) {
      this.updateAriaLive('Data inválida selecionada');
      return;
    }

    this.appState.dateFilter = date;
    this.updateAriaLive(`Filtro de data aplicado: ${date.toLocaleDateString('pt-BR')}`);
    
    // Aplicar filtro aos componentes
    Object.values(this.components).forEach(component => {
      if (component.applyDateFilter) {
        component.applyDateFilter(date);
      }
    });
  }

  /**
   * Manipular toggle de variáveis
   */
  handleVariableToggle(variable, displayName) {
    const button = document.getElementById(`btn-${variable}`);
    if (!button) return;

    const isActive = button.classList.contains('active');

    if (isActive) {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
      this.appState.activeLayers.delete(variable);
      this.updateAriaLive(`${displayName} desativado`);
      
      // Remover camada
      if (this.appState.wmsLayers[variable]) {
        this.map.removeLayer(this.appState.wmsLayers[variable]);
        delete this.appState.wmsLayers[variable];
      }
    } else {
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      this.appState.activeLayers.add(variable);
      this.appState.currentVariable = variable;
      this.updateAriaLive(`${displayName} ativado`);
      
      // Adicionar camada
      this.loadVariableLayer(variable);
    }

    this.updateLegend();
  }

  /**
   * Carregar camada de variável
   */
  async loadVariableLayer(variable) {
    try {
      // Implementar carregamento específico para cada variável
      const layerConfig = this.getVariableConfig(variable);
      const layer = await this.createWMSLayer(layerConfig);
      
      this.appState.wmsLayers[variable] = layer;
      layer.addTo(this.map);
      
      console.log(`✅ Camada ${variable} carregada`);
    } catch (error) {
      console.error(`❌ Erro ao carregar ${variable}:`, error);
      this.updateAriaLive(`Erro ao carregar ${variable}`);
    }
  }

  /**
   * Obter configuração da variável
   */
  getVariableConfig(variable) {
    const configs = {
      sst: {
        url: `${this.apiBase}/wms/sst`,
        layers: 'sea_surface_temperature',
        format: 'image/png',
        transparent: true,
        colorscale: 'viridis'
      },
      salinity: {
        url: `${this.apiBase}/wms/salinity`,
        layers: 'sea_water_salinity',
        format: 'image/png',
        transparent: true,
        colorscale: 'plasma'
      },
      chlorophyll: {
        url: `${this.apiBase}/wms/chlorophyll`,
        layers: 'chlorophyll_concentration',
        format: 'image/png',
        transparent: true,
        colorscale: 'cividis'
      },
      currents: {
        url: `${this.apiBase}/wms/currents`,
        layers: 'sea_water_velocity',
        format: 'image/png',
        transparent: true,
        style: 'vector'
      },
      wind: {
        url: `${this.apiBase}/wms/wind`,
        layers: 'wind_velocity',
        format: 'image/png',
        transparent: true,
        style: 'vector'
      }
    };

    return configs[variable] || {};
  }

  /**
   * Criar camada WMS
   */
  async createWMSLayer(config) {
    return L.tileLayer.wms(config.url, {
      layers: config.layers,
      format: config.format,
      transparent: config.transparent,
      attribution: 'BGAPP - Dados Copernicus',
      time: this.appState.dateFilter?.toISOString() || new Date().toISOString()
    });
  }

  /**
   * Limpar todas as camadas
   */
  handleClearAll() {
    // Remover todas as camadas WMS
    Object.values(this.appState.wmsLayers).forEach(layer => {
      this.map.removeLayer(layer);
    });

    // Resetar estado
    this.appState.wmsLayers = {};
    this.appState.activeLayers.clear();
    this.appState.currentVariable = null;
    this.appState.isAnimating = false;

    // Resetar botões
    document.querySelectorAll('.btn.active').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });

    // Esconder legenda
    const legend = document.getElementById('legend');
    if (legend) {
      legend.classList.remove('show');
    }

    this.updateAriaLive('Todas as camadas foram removidas do mapa');
    console.log('✅ Todas as camadas foram limpas');
  }

  /**
   * Toggle de animação
   */
  handleAnimationToggle() {
    const button = document.getElementById('btn-animate');
    const icon = document.getElementById('animate-icon');
    const text = document.getElementById('animate-text');

    if (!button) return;

    this.appState.isAnimating = !this.appState.isAnimating;

    if (this.appState.isAnimating) {
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      if (icon) icon.textContent = '⏸️';
      if (text) text.textContent = 'Pausar';
      this.updateAriaLive('Animação iniciada');
      
      // Iniciar animação TimeDimension
      if (this.map.timeDimension) {
        this.map.timeDimension.setCurrentTime(this.map.timeDimension.getAvailableTimes()[0]);
        this.map.timeDimension.play();
      }
    } else {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
      if (icon) icon.textContent = '▶️';
      if (text) text.textContent = 'Animar';
      this.updateAriaLive('Animação pausada');
      
      // Parar animação
      if (this.map.timeDimension) {
        this.map.timeDimension.pause();
      }
    }
  }

  /**
   * Manipular atalhos de teclado
   */
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + teclas
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'l':
          event.preventDefault();
          const clearBtn = document.getElementById('btn-clear');
          if (clearBtn) clearBtn.click();
          break;
        case ' ':
          event.preventDefault();
          const animateBtn = document.getElementById('btn-animate');
          if (animateBtn) animateBtn.click();
          break;
        case '1':
          event.preventDefault();
          const sstBtn = document.getElementById('btn-sst');
          if (sstBtn) sstBtn.click();
          break;
        case '2':
          event.preventDefault();
          const salinityBtn = document.getElementById('btn-salinity');
          if (salinityBtn) salinityBtn.click();
          break;
        case '3':
          event.preventDefault();
          const chlorophyllBtn = document.getElementById('btn-chlorophyll');
          if (chlorophyllBtn) chlorophyllBtn.click();
          break;
      }
    }

    // Tecla ESC para fechar popups
    if (event.key === 'Escape') {
      this.map.closePopup();
      this.updateAriaLive('Popups fechados');
    }
  }

  /**
   * Atualizar legenda
   */
  updateLegend() {
    const legend = document.getElementById('legend');
    const content = document.getElementById('legend-content');

    if (!legend || !content) return;

    if (this.appState.activeLayers.size === 0) {
      legend.classList.remove('show');
      return;
    }

    let legendHTML = '';
    this.appState.activeLayers.forEach(variable => {
      const config = this.getVariableConfig(variable);
      legendHTML += this.generateLegendItem(variable, config);
    });

    content.innerHTML = legendHTML;
    legend.classList.add('show');
    
    this.updateAriaLive('Legenda atualizada');
  }

  /**
   * Gerar item da legenda
   */
  generateLegendItem(variable, config) {
    const colors = {
      sst: ['#000080', '#0066cc', '#00ccff', '#ffff00', '#ff6600', '#ff0000'],
      salinity: ['#440154', '#482878', '#3e4989', '#31688e', '#26828e', '#1f9e89'],
      chlorophyll: ['#000080', '#0066cc', '#00cc66', '#cccc00', '#cc6600', '#cc0000'],
      currents: ['#ffffff', '#cccccc'],
      wind: ['#ffffff', '#cccccc']
    };

    const units = {
      sst: '°C',
      salinity: 'PSU',
      chlorophyll: 'mg/m³',
      currents: 'm/s',
      wind: 'm/s'
    };

    const names = {
      sst: 'Temperatura',
      salinity: 'Salinidade',
      chlorophyll: 'Clorofila',
      currents: 'Correntes',
      wind: 'Vento'
    };

    let html = `<div class="legend-item">
      <strong>${names[variable] || variable}</strong>`;

    if (colors[variable]) {
      html += '<div class="legend-scale">';
      colors[variable].forEach((color, index) => {
        html += `<span style="background-color: ${color}; display: inline-block; width: 20px; height: 12px; margin-right: 2px;" aria-hidden="true"></span>`;
      });
      html += `</div><small>Unidade: ${units[variable] || 'N/A'}</small>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Atualizar ARIA live region
   */
  updateAriaLive(message) {
    const statusElement = document.getElementById('system-status');
    if (statusElement) {
      statusElement.textContent = message;
      
      // Restaurar status após 3 segundos
      setTimeout(() => {
        statusElement.textContent = 'Sistema Online';
      }, 3000);
    }
  }

  /**
   * Anunciar que o sistema está pronto
   */
  announceSystemReady() {
    this.updateAriaLive('Sistema BGAPP carregado e pronto para uso');
    
    // Atualizar indicador visual
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
      statusIndicator.className = 'status-indicator status-online';
    }
    
    // Inicializar metocean após tudo estar pronto
    setTimeout(() => {
      if (typeof window.initializeMetoceanApp === 'function') {
        console.log('🚀 Inicializando Metocean App após mapa estar pronto...');
        window.initializeMetoceanApp();
      } else {
        console.warn('⚠️ initializeMetoceanApp não encontrada - metocean.js não carregado ainda');
      }
    }, 500);
  }

  /**
   * Manipular erro de inicialização
   */
  handleInitializationError(error) {
    console.error('Erro crítico na inicialização:', error);
    
    // Atualizar status visual
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
      statusIndicator.className = 'status-indicator status-error';
    }

    this.updateAriaLive('Erro no carregamento do sistema. Verifique a conexão.');

    // Mostrar mensagem de erro para o usuário
    const errorMessage = document.createElement('div');
    errorMessage.innerHTML = `
      <div style="
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000; text-align: center; max-width: 400px;
      ">
        <h3 style="color: #e74c3c; margin-top: 0;">❌ Erro de Inicialização</h3>
        <p>Ocorreu um erro ao carregar o sistema BGAPP.</p>
        <p><small>Detalhes: ${error.message}</small></p>
        <button onclick="location.reload()" style="
          padding: 8px 16px; background: #3498db; color: white; border: none; 
          border-radius: 4px; cursor: pointer; margin-top: 10px;
        ">
          Recarregar Página
        </button>
      </div>
    `;
    
    document.body.appendChild(errorMessage);
  }

  /**
   * Obter estado atual da aplicação
   */
  getState() {
    return { ...this.appState };
  }

  /**
   * Definir estado da aplicação
   */
  setState(newState) {
    this.appState = { ...this.appState, ...newState };
  }
}

// Exportar para uso global
window.BGAPPMapController = BGAPPMapController;

// Auto-inicialização quando script for carregado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.bgappController = new BGAPPMapController();
  });
} else {
  window.bgappController = new BGAPPMapController();
}
