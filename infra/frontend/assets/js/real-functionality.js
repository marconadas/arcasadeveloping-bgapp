/**
 * BGAPP - Sistema de Funcionalidades Reais
 * Implementa funcionalidades reais para filtros, animações e dados oceanográficos
 * Versão: 2.0.0 - Funcional
 */

console.log('🚀 BGAPP Real Functionality - Sistema Funcional Carregado');

// Estado global da aplicação (expandido)
window.appRealState = {
  // Estados de dados
  currentData: {
    sst: null,
    salinity: null,
    chlorophyll: null,
    currents: null,
    wind: null
  },
  
  // Camadas ativas no mapa
  activeLayers: new Map(),
  
  // Estado da animação
  animation: {
    isPlaying: false,
    currentTimeIndex: 0,
    timeRange: [],
    intervalId: null,
    speed: 1000 // ms entre frames
  },
  
  // Filtros ativos
  filters: {
    dateMin: null,
    dateMax: null,
    activeVariables: new Set()
  },
  
  // Cache de dados
  dataCache: new Map(),
  
  // Configurações da API
  apiBase: location.hostname === 'localhost' ? 'http://localhost:5080' : '/api'
};

/**
 * SISTEMA DE DADOS REAIS
 */
class RealDataManager {
  constructor() {
    this.loadingStates = new Map();
  }

  /**
   * Buscar dados escalares (SST, Salinidade, Clorofila)
   */
  async fetchScalarData(variable, time = null) {
    const cacheKey = `scalar_${variable}_${time || 'current'}`;
    
    // Verificar cache primeiro
    if (window.appRealState.dataCache.has(cacheKey)) {
      const cached = window.appRealState.dataCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutos
        console.log(`📦 Cache hit para ${variable}`);
        return cached.data;
      }
    }

    try {
      this.setLoadingState(variable, true);
      
      const params = new URLSearchParams({
        var: variable
      });
      
      if (time) {
        params.append('time', time);
      }

      const response = await fetch(`${window.appRealState.apiBase}/metocean/scalar?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Armazenar no cache
      window.appRealState.dataCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      console.log(`✅ Dados ${variable} carregados:`, data.features?.length || 0, 'pontos');
      return data;

    } catch (error) {
      console.error(`❌ Erro ao carregar dados ${variable}:`, error);
      this.showErrorNotification(`Erro ao carregar ${variable}`, error.message);
      throw error;
    } finally {
      this.setLoadingState(variable, false);
    }
  }

  /**
   * Buscar dados vetoriais (Correntes, Vento)
   */
  async fetchVelocityData(variable, time = null, resolution = 0.5) {
    const cacheKey = `velocity_${variable}_${time || 'current'}_${resolution}`;
    
    // Verificar cache
    if (window.appRealState.dataCache.has(cacheKey)) {
      const cached = window.appRealState.dataCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutos
        console.log(`📦 Cache hit para ${variable}`);
        return cached.data;
      }
    }

    try {
      this.setLoadingState(variable, true);
      
      const params = new URLSearchParams({
        var: variable,
        resolution: resolution.toString()
      });
      
      if (time) {
        params.append('time', time);
      }

      const response = await fetch(`${window.appRealState.apiBase}/metocean/velocity?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(15000) // 15s timeout para dados vetoriais
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache
      window.appRealState.dataCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      console.log(`✅ Dados ${variable} carregados:`, data.data?.length || 0, 'vetores');
      return data;

    } catch (error) {
      console.error(`❌ Erro ao carregar dados ${variable}:`, error);
      this.showErrorNotification(`Erro ao carregar ${variable}`, error.message);
      throw error;
    } finally {
      this.setLoadingState(variable, false);
    }
  }

  /**
   * Gerar série temporal para animação
   */
  generateTimeRange(startDate, endDate, intervalHours = 6) {
    const times = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const current = new Date(start);
    while (current <= end) {
      times.push(current.toISOString());
      current.setHours(current.getHours() + intervalHours);
    }
    
    console.log(`📅 Série temporal gerada: ${times.length} timestamps`);
    return times;
  }

  /**
   * Estados de loading
   */
  setLoadingState(variable, isLoading) {
    this.loadingStates.set(variable, isLoading);
    this.updateLoadingUI(variable, isLoading);
  }

  updateLoadingUI(variable, isLoading) {
    const button = document.getElementById(`btn-${variable}`);
    if (button) {
      if (isLoading) {
        button.style.opacity = '0.6';
        button.style.cursor = 'wait';
        const icon = button.querySelector('span[aria-hidden="true"]');
        if (icon) {
          icon.textContent = '⏳';
        }
      } else {
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        // Restaurar ícone original baseado na variável
        const icon = button.querySelector('span[aria-hidden="true"]');
        if (icon) {
          const icons = {
            'sst': '🌡️',
            'salinity': '🧂', 
            'chlorophyll': '🌿',
            'currents': '🌊',
            'wind': '💨'
          };
          icon.textContent = icons[variable] || '📊';
        }
      }
    }
  }

  /**
   * Notificação de erro
   */
  showErrorNotification(title, message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      right: 24px;
      background: linear-gradient(135deg, rgba(255, 59, 48, 0.95), rgba(255, 149, 0, 0.95));
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      z-index: 2000;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      max-width: 350px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    notification.innerHTML = `
      <div style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
        ❌ ${title}
      </div>
      <div style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
        ${message}
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animação de entrada
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remover
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Permitir fechar clicando
    notification.addEventListener('click', () => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    });
    
    notification.style.cursor = 'pointer';
  }
}

/**
 * SISTEMA DE VISUALIZAÇÃO DE DADOS
 */
class DataVisualization {
  constructor(map) {
    this.map = map;
    this.layerGroups = new Map();
  }

  /**
   * Visualizar dados escalares como heatmap
   */
  displayScalarData(variable, data) {
    console.log(`🎨 Visualizando dados escalares: ${variable}`);
    
    // Remover camada anterior se existir
    this.removeLayer(variable);
    
    if (!data.features || data.features.length === 0) {
      console.warn(`⚠️ Nenhum dado para visualizar: ${variable}`);
      return;
    }

    // Criar grupo de camadas
    const layerGroup = L.layerGroup();
    
    // Configurações por variável
    const configs = {
      sst: {
        colorScale: this.createColorScale(['#000080', '#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000']),
        unit: '°C',
        minValue: 18,
        maxValue: 32
      },
      salinity: {
        colorScale: this.createColorScale(['#E6F3FF', '#CCE7FF', '#99D6FF', '#66C2FF', '#3399FF', '#0066CC']),
        unit: 'PSU',
        minValue: 34,
        maxValue: 36
      },
      chlorophyll: {
        colorScale: this.createColorScale(['#FFFFCC', '#C7E9B4', '#7FCDBB', '#41B6C4', '#2C7FB8', '#253494']),
        unit: 'mg/m³',
        minValue: 0.1,
        maxValue: 10
      }
    };
    
    const config = configs[variable] || configs.sst;
    
    // Adicionar pontos
    data.features.forEach(feature => {
      const coords = feature.geometry.coordinates;
      const value = feature.properties.value;
      
      const color = this.getColorForValue(value, config.minValue, config.maxValue, config.colorScale);
      
      const circle = L.circleMarker([coords[1], coords[0]], {
        radius: 8,
        fillColor: color,
        color: '#ffffff',
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.7,
        pane: 'markerPane',
        zIndex: 1000
      });
      
      // Popup com informações
      circle.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px;">
            ${this.getVariableName(variable)}
          </h3>
          <div style="font-size: 13px; line-height: 1.4;">
            <strong>Valor:</strong> ${value.toFixed(2)} ${config.unit}<br>
            <strong>Local:</strong> ${feature.properties.location || 'Oceano'}<br>
            <strong>Coordenadas:</strong> ${coords[1].toFixed(2)}°, ${coords[0].toFixed(2)}°<br>
            <strong>Timestamp:</strong> ${new Date(feature.properties.time).toLocaleString('pt-BR')}
          </div>
        </div>
      `);
      
      layerGroup.addLayer(circle);
    });
    
    // Adicionar ao mapa
    layerGroup.addTo(this.map);
    this.layerGroups.set(variable, layerGroup);
    
    // Criar legenda
    this.createLegend(variable, config);
    
    console.log(`✅ ${variable} visualizado com ${data.features.length} pontos`);
  }

  /**
   * Visualizar dados vetoriais como setas
   */
  displayVelocityData(variable, data) {
    console.log(`🎨 Visualizando dados vetoriais: ${variable}`);
    
    // Remover camada anterior
    this.removeLayer(variable);
    
    if (!data.data || data.data.length === 0) {
      console.warn(`⚠️ Nenhum dado vetorial para visualizar: ${variable}`);
      return;
    }

    const layerGroup = L.layerGroup();
    
    // Configurações por variável
    const configs = {
      currents: {
        color: '#0066cc',
        scaleFactor: 50000, // Escala para correntes
        unit: 'm/s',
        name: 'Correntes Marítimas'
      },
      wind: {
        color: '#ff6600',
        scaleFactor: 30000, // Escala para vento
        unit: 'm/s', 
        name: 'Vento'
      }
    };
    
    const config = configs[variable] || configs.currents;
    
    // Adicionar vetores
    data.data.forEach(point => {
      const { lat, lon, u, v } = point;
      
      // Calcular magnitude e direção
      const magnitude = Math.sqrt(u * u + v * v);
      const direction = Math.atan2(v, u) * 180 / Math.PI;
      
      if (magnitude < 0.01) return; // Pular vetores muito pequenos
      
      // Calcular ponto final da seta
      const scale = config.scaleFactor;
      const endLat = lat + (v * scale);
      const endLon = lon + (u * scale);
      
      // Criar linha (seta)
      const arrow = L.polyline(
        [[lat, lon], [endLat, endLon]], 
        {
          color: config.color,
          weight: Math.max(1, magnitude * 3),
          opacity: 0.8
        }
      );
      
      // Adicionar cabeça da seta
      const arrowHead = L.circleMarker([endLat, endLon], {
        radius: Math.max(2, magnitude * 4),
        fillColor: config.color,
        color: config.color,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        pane: 'markerPane',
        zIndex: 1000
      });
      
      // Popup com informações
      const popup = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px;">
            ${config.name}
          </h3>
          <div style="font-size: 13px; line-height: 1.4;">
            <strong>Magnitude:</strong> ${magnitude.toFixed(3)} ${config.unit}<br>
            <strong>Direção:</strong> ${direction.toFixed(1)}°<br>
            <strong>Componentes:</strong><br>
            &nbsp;&nbsp;U: ${u.toFixed(3)} ${config.unit}<br>
            &nbsp;&nbsp;V: ${v.toFixed(3)} ${config.unit}<br>
            <strong>Coordenadas:</strong> ${lat.toFixed(2)}°, ${lon.toFixed(2)}°
          </div>
        </div>
      `;
      
      arrow.bindPopup(popup);
      arrowHead.bindPopup(popup);
      
      layerGroup.addLayer(arrow);
      layerGroup.addLayer(arrowHead);
    });
    
    // Adicionar ao mapa
    layerGroup.addTo(this.map);
    this.layerGroups.set(variable, layerGroup);
    
    console.log(`✅ ${variable} visualizado com ${data.data.length} vetores`);
  }

  /**
   * Remover camada do mapa
   */
  removeLayer(variable) {
    if (this.layerGroups.has(variable)) {
      const layer = this.layerGroups.get(variable);
      this.map.removeLayer(layer);
      this.layerGroups.delete(variable);
      console.log(`🗑️ Camada ${variable} removida`);
    }
  }

  /**
   * Limpar todas as camadas
   */
  clearAllLayers() {
    console.log('🗑️ Limpando todas as camadas de dados');
    
    this.layerGroups.forEach((layer, variable) => {
      this.map.removeLayer(layer);
    });
    
    this.layerGroups.clear();
    
    // Remover legendas
    const legends = document.querySelectorAll('.data-legend');
    legends.forEach(legend => legend.remove());
  }

  /**
   * Utilitários para cores e legendas
   */
  createColorScale(colors) {
    return colors;
  }

  getColorForValue(value, minValue, maxValue, colorScale) {
    const normalized = Math.max(0, Math.min(1, (value - minValue) / (maxValue - minValue)));
    const index = Math.floor(normalized * (colorScale.length - 1));
    return colorScale[index];
  }

  getVariableName(variable) {
    const names = {
      sst: 'Temperatura da Superfície do Mar',
      salinity: 'Salinidade',
      chlorophyll: 'Clorofila-a',
      currents: 'Correntes Marítimas',
      wind: 'Vento'
    };
    return names[variable] || variable;
  }

  createLegend(variable, config) {
    // Remover legenda anterior
    const existingLegend = document.querySelector(`.data-legend[data-variable="${variable}"]`);
    if (existingLegend) {
      existingLegend.remove();
    }

    const legend = document.createElement('div');
    legend.className = 'data-legend';
    legend.setAttribute('data-variable', variable);
    legend.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 12px;
      color: #333;
      z-index: 1000;
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      min-width: 150px;
    `;
    
    legend.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">
        ${this.getVariableName(variable)}
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="font-size: 11px;">
          ${config.minValue} ${config.unit}
        </div>
        <div style="flex: 1; height: 8px; background: linear-gradient(to right, ${config.colorScale.join(', ')}); border-radius: 4px;"></div>
        <div style="font-size: 11px;">
          ${config.maxValue} ${config.unit}
        </div>
      </div>
    `;
    
    document.body.appendChild(legend);
  }
}

/**
 * SISTEMA DE ANIMAÇÃO TEMPORAL
 */
class TemporalAnimation {
  constructor(dataManager, visualization) {
    this.dataManager = dataManager;
    this.visualization = visualization;
    this.isInitialized = false;
  }

  /**
   * Inicializar animação com série temporal
   */
  async initialize(startDate, endDate, variables) {
    console.log('🎬 Inicializando sistema de animação temporal');
    
    try {
      // Gerar série temporal
      window.appRealState.animation.timeRange = this.dataManager.generateTimeRange(startDate, endDate, 6);
      window.appRealState.animation.currentTimeIndex = 0;
      
      // Pré-carregar alguns dados
      const preloadTimes = window.appRealState.animation.timeRange.slice(0, 3); // Primeiros 3 timestamps
      
      for (const variable of variables) {
        console.log(`📦 Pré-carregando dados ${variable}...`);
        
        for (const time of preloadTimes) {
          try {
            if (['sst', 'salinity', 'chlorophyll'].includes(variable)) {
              await this.dataManager.fetchScalarData(variable, time);
            } else if (['currents', 'wind'].includes(variable)) {
              await this.dataManager.fetchVelocityData(variable, time);
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao pré-carregar ${variable} em ${time}:`, error.message);
          }
        }
      }
      
      this.isInitialized = true;
      console.log('✅ Sistema de animação inicializado');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar animação:', error);
      throw error;
    }
  }

  /**
   * Iniciar animação
   */
  async start(variables) {
    if (!this.isInitialized) {
      console.warn('⚠️ Sistema de animação não inicializado');
      return;
    }

    if (window.appRealState.animation.isPlaying) {
      console.log('⏸️ Pausando animação');
      this.pause();
      return;
    }

    console.log('▶️ Iniciando animação temporal');
    window.appRealState.animation.isPlaying = true;

    // Atualizar UI do botão
    this.updateAnimationButton(true);

    // Criar controles de animação
    this.createAnimationControls();

    // Loop de animação
    window.appRealState.animation.intervalId = setInterval(async () => {
      await this.nextFrame(variables);
    }, window.appRealState.animation.speed);
  }

  /**
   * Pausar animação
   */
  pause() {
    console.log('⏸️ Pausando animação');
    
    window.appRealState.animation.isPlaying = false;
    
    if (window.appRealState.animation.intervalId) {
      clearInterval(window.appRealState.animation.intervalId);
      window.appRealState.animation.intervalId = null;
    }

    this.updateAnimationButton(false);
  }

  /**
   * Próximo frame da animação
   */
  async nextFrame(variables) {
    const timeRange = window.appRealState.animation.timeRange;
    const currentIndex = window.appRealState.animation.currentTimeIndex;
    
    if (currentIndex >= timeRange.length) {
      console.log('🔄 Animação completa, reiniciando');
      window.appRealState.animation.currentTimeIndex = 0;
      return;
    }

    const currentTime = timeRange[currentIndex];
    console.log(`🎬 Frame ${currentIndex + 1}/${timeRange.length}: ${currentTime}`);

    // Atualizar controles
    this.updateAnimationControls(currentIndex, timeRange.length, currentTime);

    // Carregar e exibir dados para o timestamp atual
    for (const variable of variables) {
      try {
        let data;
        if (['sst', 'salinity', 'chlorophyll'].includes(variable)) {
          data = await this.dataManager.fetchScalarData(variable, currentTime);
          this.visualization.displayScalarData(variable, data);
        } else if (['currents', 'wind'].includes(variable)) {
          data = await this.dataManager.fetchVelocityData(variable, currentTime);
          this.visualization.displayVelocityData(variable, data);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao carregar frame ${variable}:`, error.message);
      }
    }

    // Avançar para próximo frame
    window.appRealState.animation.currentTimeIndex++;
  }

  /**
   * Atualizar botão de animação
   */
  updateAnimationButton(isPlaying) {
    const button = document.getElementById('btn-animate');
    const icon = document.getElementById('animate-icon');
    const text = document.getElementById('animate-text');
    
    if (button && icon && text) {
      if (isPlaying) {
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
        icon.textContent = '⏸️';
        text.textContent = 'Pausar';
      } else {
        button.classList.remove('active');
        button.setAttribute('aria-pressed', 'false');
        icon.textContent = '▶️';
        text.textContent = 'Animar';
      }
    }
  }

  /**
   * Criar controles de animação
   */
  createAnimationControls() {
    // Remover controles existentes
    const existingControls = document.getElementById('animation-controls');
    if (existingControls) {
      existingControls.remove();
    }

    const controls = document.createElement('div');
    controls.id = 'animation-controls';
    controls.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-size: 14px;
      z-index: 2000;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
      text-align: center;
      min-width: 300px;
    `;
    
    controls.innerHTML = `
      <div style="margin-bottom: 12px; font-weight: 600;">
        🎬 Animação Temporal
      </div>
      <div id="animation-progress" style="margin-bottom: 8px; font-size: 12px;">
        Frame 1 / ${window.appRealState.animation.timeRange.length}
      </div>
      <div id="animation-time" style="margin-bottom: 12px; font-size: 11px; opacity: 0.8;">
        ${window.appRealState.animation.timeRange[0] || 'Carregando...'}
      </div>
      <div style="display: flex; gap: 8px; justify-content: center;">
        <button id="animation-slower" style="background: #333; color: white; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 11px;">
          🐌 Lento
        </button>
        <button id="animation-faster" style="background: #333; color: white; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 11px;">
          🚀 Rápido
        </button>
        <button id="animation-close" style="background: #ff3b30; color: white; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 11px;">
          ✕ Fechar
        </button>
      </div>
    `;
    
    document.body.appendChild(controls);

    // Event listeners para os controles
    document.getElementById('animation-slower')?.addEventListener('click', () => {
      window.appRealState.animation.speed = Math.min(3000, window.appRealState.animation.speed * 1.5);
      console.log(`🐌 Velocidade: ${window.appRealState.animation.speed}ms`);
    });

    document.getElementById('animation-faster')?.addEventListener('click', () => {
      window.appRealState.animation.speed = Math.max(200, window.appRealState.animation.speed * 0.7);
      console.log(`🚀 Velocidade: ${window.appRealState.animation.speed}ms`);
    });

    document.getElementById('animation-close')?.addEventListener('click', () => {
      this.pause();
      controls.remove();
    });
  }

  /**
   * Atualizar controles durante animação
   */
  updateAnimationControls(currentIndex, totalFrames, currentTime) {
    const progressElement = document.getElementById('animation-progress');
    const timeElement = document.getElementById('animation-time');
    
    if (progressElement) {
      progressElement.textContent = `Frame ${currentIndex + 1} / ${totalFrames}`;
    }
    
    if (timeElement) {
      const date = new Date(currentTime);
      timeElement.textContent = date.toLocaleString('pt-BR');
    }
  }
}

/**
 * INICIALIZAÇÃO DO SISTEMA FUNCIONAL
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 Inicializando Sistema de Funcionalidades Reais...');
  
  // Aguardar o mapa estar disponível
  const waitForMap = setInterval(() => {
    if (window.map && typeof window.map.getCenter === 'function') {
      clearInterval(waitForMap);
      initializeRealFunctionality();
    }
  }, 500);
  
  setTimeout(() => {
    clearInterval(waitForMap);
    console.warn('⚠️ Timeout aguardando mapa - inicializando sem mapa');
    initializeRealFunctionality();
  }, 10000);
});

function initializeRealFunctionality() {
  console.log('🚀 Inicializando funcionalidades reais...');
  
  // Instanciar managers
  const dataManager = new RealDataManager();
  const visualization = window.map ? new DataVisualization(window.map) : null;
  const animation = visualization ? new TemporalAnimation(dataManager, visualization) : null;
  
  // Tornar globalmente acessível
  window.realFunctionality = {
    dataManager,
    visualization,
    animation
  };

  // Conectar eventos dos botões
  connectButtonEvents(dataManager, visualization, animation);
  
  console.log('✅ Sistema de funcionalidades reais inicializado!');
}

function connectButtonEvents(dataManager, visualization, animation) {
  console.log('🔗 Conectando eventos dos botões...');

  // Filtro de data
  const applyButton = document.getElementById('apply');
  const dateMinInput = document.getElementById('dateMin');
  
  if (applyButton && dateMinInput) {
    applyButton.addEventListener('click', async () => {
      const selectedDate = dateMinInput.value;
      if (!selectedDate) {
        alert('⚠️ Por favor, selecione uma data');
        return;
      }
      
      console.log(`📅 Aplicando filtro de data: ${selectedDate}`);
      
      // Atualizar estado
      window.appRealState.filters.dateMin = selectedDate;
      
      // Recarregar dados ativos com nova data
      const activeVariables = Array.from(window.appRealState.filters.activeVariables);
      for (const variable of activeVariables) {
        await loadVariableData(variable, selectedDate, dataManager, visualization);
      }
      
      showSuccessNotification('Filtro Aplicado', `Dados atualizados para ${new Date(selectedDate).toLocaleDateString('pt-BR')}`);
    });
  }

  // Botões de variáveis oceanográficas
  const variableButtons = [
    { id: 'btn-sst', variable: 'sst' },
    { id: 'btn-salinity', variable: 'salinity' }, 
    { id: 'btn-chlorophyll', variable: 'chlorophyll' }
  ];

  variableButtons.forEach(({ id, variable }) => {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener('click', async () => {
        const isActive = button.classList.contains('active');
        
        if (isActive) {
          // Desativar
          button.classList.remove('active');
          button.setAttribute('aria-pressed', 'false');
          window.appRealState.filters.activeVariables.delete(variable);
          
          if (visualization) {
            visualization.removeLayer(variable);
          }
          
          console.log(`❌ ${variable} desativado`);
        } else {
          // Ativar
          button.classList.add('active');
          button.setAttribute('aria-pressed', 'true');
          window.appRealState.filters.activeVariables.add(variable);
          
          // Carregar dados
          await loadVariableData(variable, window.appRealState.filters.dateMin, dataManager, visualization);
          
          console.log(`✅ ${variable} ativado`);
        }
      });
    }
  });

  // Botões de campos vetoriais
  const vectorButtons = [
    { id: 'btn-currents', variable: 'currents' },
    { id: 'btn-wind', variable: 'wind' }
  ];

  vectorButtons.forEach(({ id, variable }) => {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener('click', async () => {
        const isActive = button.classList.contains('active');
        
        if (isActive) {
          // Desativar
          button.classList.remove('active');
          button.setAttribute('aria-pressed', 'false');
          window.appRealState.filters.activeVariables.delete(variable);
          
          if (visualization) {
            visualization.removeLayer(variable);
          }
          
          console.log(`❌ ${variable} desativado`);
        } else {
          // Ativar
          button.classList.add('active');
          button.setAttribute('aria-pressed', 'true');
          window.appRealState.filters.activeVariables.add(variable);
          
          // Carregar dados vetoriais
          await loadVectorData(variable, window.appRealState.filters.dateMin, dataManager, visualization);
          
          console.log(`✅ ${variable} ativado`);
        }
      });
    }
  });

  // Botão limpar
  const clearButton = document.getElementById('btn-clear');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      console.log('🗑️ Limpando todas as camadas');
      
      // Desativar todos os botões
      document.querySelectorAll('.btn.active').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      
      // Limpar estado
      window.appRealState.filters.activeVariables.clear();
      
      // Limpar visualização
      if (visualization) {
        visualization.clearAllLayers();
      }
      
      // Parar animação se estiver rodando
      if (animation && window.appRealState.animation.isPlaying) {
        animation.pause();
      }
      
      showSuccessNotification('Camadas Limpas', 'Todas as camadas foram removidas do mapa');
    });
  }

  // Botão de animação
  const animateButton = document.getElementById('btn-animate');
  if (animateButton && animation) {
    animateButton.addEventListener('click', async () => {
      const activeVariables = Array.from(window.appRealState.filters.activeVariables);
      
      if (activeVariables.length === 0) {
        alert('⚠️ Selecione pelo menos uma variável para animar');
        return;
      }

      if (!window.appRealState.animation.isPlaying) {
        // Inicializar animação
        const startDate = window.appRealState.filters.dateMin || '2024-06-01';
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7); // 7 dias de animação
        
        try {
          await animation.initialize(startDate, endDate.toISOString().split('T')[0], activeVariables);
          await animation.start(activeVariables);
        } catch (error) {
          console.error('❌ Erro ao iniciar animação:', error);
          alert('❌ Erro ao iniciar animação. Verifique o console para detalhes.');
        }
      } else {
        // Pausar animação
        animation.pause();
      }
    });
  }
}

// Funções auxiliares para carregar dados
async function loadVariableData(variable, date, dataManager, visualization) {
  if (!dataManager || !visualization) return;
  
  try {
    const data = await dataManager.fetchScalarData(variable, date);
    visualization.displayScalarData(variable, data);
    window.appRealState.currentData[variable] = data;
  } catch (error) {
    console.error(`❌ Erro ao carregar ${variable}:`, error);
  }
}

async function loadVectorData(variable, date, dataManager, visualization) {
  if (!dataManager || !visualization) return;
  
  try {
    const data = await dataManager.fetchVelocityData(variable, date);
    visualization.displayVelocityData(variable, data);
    window.appRealState.currentData[variable] = data;
  } catch (error) {
    console.error(`❌ Erro ao carregar ${variable}:`, error);
  }
}

// Notificação de sucesso
function showSuccessNotification(title, message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    right: 24px;
    background: linear-gradient(135deg, rgba(52, 199, 89, 0.95), rgba(48, 176, 199, 0.95));
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    z-index: 2000;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    max-width: 350px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  notification.innerHTML = `
    <div style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
      ✅ ${title}
    </div>
    <div style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
      ${message}
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Animação de entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Auto-remover
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
  
  // Permitir fechar clicando
  notification.addEventListener('click', () => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  });
  
  notification.style.cursor = 'pointer';
}

console.log('✅ BGAPP Real Functionality - Sistema Completo Carregado');
