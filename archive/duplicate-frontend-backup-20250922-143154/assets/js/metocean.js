/**
 * BGAPP Meteorológico - Funções de Animação Meteorológica e Oceanográfica
 * Sistema para visualização de dados de vento, correntes, SST, salinidade e clorofila
 */

// === FUNÇÕES DE CARREGAMENTO DE DADOS ===
async function loadAOI() {
  try {
    const url = `${apiBase}/collections/aoi/items?f=json`;
    const r = await fetch(url);
    const gj = await r.json();
    const layer = L.geoJSON(gj, {
      style: {color: '#0077ff', weight: 2, fillOpacity: 0.05}
    }).addTo(map);
    try { map.fitBounds(layer.getBounds()); } catch (e) {}
  } catch (error) {
    console.warn('Erro ao carregar AOI, usando bounds padrão para Angola');
    map.setView([-12.5, 13.5], 6);
  }
}

function parseDate(propDate) {
  if (!propDate) return null;
  try { return new Date(String(propDate)); } catch { return null; }
}

async function loadOccurrences(dateMinStr) {
  try {
    const url = `${apiBase}/collections/occurrences/items?limit=10000&f=json`;
    const r = await fetch(url);
    const gj = await r.json();
    const dateMin = dateMinStr ? new Date(dateMinStr) : null;
    const features = (gj.features || []).filter(f => {
      const d = parseDate(f.properties?.date || f.properties?.eventDate);
      return !dateMin || (d && d >= dateMin);
    });
    const filtered = { type: 'FeatureCollection', features };
    if (appState.occLayer) { map.removeLayer(appState.occLayer); }
    appState.occLayer = L.geoJSON(filtered, {
      pointToLayer: (f, latlng) => L.circleMarker(latlng, {
        radius: 4, 
        color: '#e74c3c',
        pane: 'markerPane',
        zIndex: 1000
      })
    }).addTo(map);
  } catch (error) {
    console.warn('Erro ao carregar ocorrências:', error);
  }
}

// === FUNÇÕES DE CAMADAS METEOROLÓGICAS ===
async function loadVelocityLayer(type = 'currents') {
  setStatus('loading');
  try {
    const currentTime = new Date().toISOString();
    const url = `${apiBase}/metocean/velocity?var=${type}&time=${encodeURIComponent(currentTime)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Remover camada anterior
    if (appState.velocityLayer) {
      map.removeLayer(appState.velocityLayer);
    }
    
    // Configuração baseada no tipo
    const config = {
      currents: {
        velocityScale: 0.01,
        maxVelocity: 2.0,
        colorScale: ['#3288bd', '#66c2a5', '#abdda4', '#e6f598', '#fee08b', '#fdae61', '#f46d43', '#d53e4f'],
        displayOptions: { velocityType: 'Correntes Marinhas', displayEmptyString: 'Sem dados' }
      },
      wind: {
        velocityScale: 0.005,
        maxVelocity: 15.0,
        colorScale: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#fee090', '#fdae61', '#f46d43', '#d73027'],
        displayOptions: { velocityType: 'Vento', displayEmptyString: 'Sem dados' }
      }
    };
    
    const settings = config[type] || config.currents;
    
    appState.velocityLayer = L.velocityLayer({
      displayValues: true,
      data: data,
      ...settings
    }).addTo(map);
    
    appState.activeLayers.add(type);
    updateLegend(type, data);
    setStatus('online');
    
    console.log(`✅ Camada ${type} carregada com ${data.data?.length || 0} pontos`);
    
  } catch (error) {
    console.error(`Erro ao carregar camada ${type}:`, error);
    setStatus('error');
    
    // Fallback com dados simulados
    loadSimulatedVelocity(type);
  }
}

function loadSimulatedVelocity(type = 'currents') {
  console.log(`🔄 Carregando dados simulados para ${type}`);
  
  // Gerar dados simulados para área de Angola
  const bounds = {
    north: -4.2, south: -18.2, east: 17.5, west: 8.5  // Corrigido para ZEE real!
  };
  
  const data = [];
  const step = 0.5; // Resolução em graus
  
  for (let lat = bounds.south; lat <= bounds.north; lat += step) {
    for (let lon = bounds.west; lon <= bounds.east; lon += step) {
      let u, v;
      
      if (type === 'currents') {
        // Simular Corrente de Benguela (sul-norte na costa)
        const distanceFromCoast = Math.abs(lon - 13.0);
        const benguelaStrength = Math.max(0, 1.5 - distanceFromCoast * 0.3);
        u = benguelaStrength * 0.1 + Math.random() * 0.1 - 0.05;
        v = benguelaStrength * 0.8 + Math.random() * 0.2 - 0.1;
      } else {
        // Simular ventos alísios (predominantemente leste-oeste)
        u = -3.0 + Math.random() * 2.0 - 1.0;
        v = 1.0 + Math.random() * 1.0 - 0.5;
      }
      
      data.push({ lat, lon, u, v });
    }
  }
  
  const simulatedData = {
    uMin: Math.min(...data.map(d => d.u)),
    uMax: Math.max(...data.map(d => d.u)),
    vMin: Math.min(...data.map(d => d.v)),
    vMax: Math.max(...data.map(d => d.v)),
    data: data
  };
  
  if (appState.velocityLayer) {
    map.removeLayer(appState.velocityLayer);
  }
  
  appState.velocityLayer = L.velocityLayer({
    displayValues: true,
    data: simulatedData,
    velocityScale: type === 'currents' ? 0.01 : 0.005,
    maxVelocity: type === 'currents' ? 2.0 : 15.0,
    displayOptions: {
      velocityType: type === 'currents' ? 'Correntes (Simulado)' : 'Vento (Simulado)',
      displayEmptyString: 'Sem dados'
    }
  }).addTo(map);
  
  appState.activeLayers.add(type);
  updateLegend(type, simulatedData, true);
  setStatus('online');
}

function loadWMSLayer(variable) {
  setStatus('loading');
  
  try {
    // URLs WMS para diferentes variáveis (exemplo - ajustar conforme serviços disponíveis)
    const wmsConfigs = {
      sst: {
        url: 'https://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024',
        layers: 'thetao',
        styles: 'boxfill/rainbow',
        format: 'image/png',
        transparent: true,
        colorscalerange: '15,30',
        abovemaxcolor: 'extend',
        belowmincolor: 'extend'
      },
      salinity: {
        url: 'https://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024',
        layers: 'so',
        styles: 'boxfill/rainbow',
        format: 'image/png',
        transparent: true,
        colorscalerange: '34,36',
        abovemaxcolor: 'extend',
        belowmincolor: 'extend'
      },
      chlorophyll: {
        url: 'https://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-bgc-001-028',
        layers: 'chl',
        styles: 'boxfill/rainbow',
        format: 'image/png',
        transparent: true,
        colorscalerange: '0.01,10',
        abovemaxcolor: 'extend',
        belowmincolor: 'extend',
        logscale: true
      }
    };
    
    const config = wmsConfigs[variable];
    if (!config) {
      throw new Error(`Configuração não encontrada para ${variable}`);
    }
    
    // Remover camada anterior se existir
    if (appState.wmsLayers[variable]) {
      map.removeLayer(appState.wmsLayers[variable]);
    }
    
    // Criar camada WMS com TimeDimension
    const wmsLayer = L.tileLayer.wms(config.url, {
      layers: config.layers,
      format: config.format,
      transparent: config.transparent,
      styles: config.styles,
      colorscalerange: config.colorscalerange,
      abovemaxcolor: config.abovemaxcolor,
      belowmincolor: config.belowmincolor,
      logscale: config.logscale,
      version: '1.3.0',
      crs: L.CRS.EPSG4326,
      attribution: 'Copernicus Marine Service'
    });
    
    // Aplicar TimeDimension
    appState.wmsLayers[variable] = L.timeDimension.layer.wms(wmsLayer, {
      updateTimeDimension: true,
      requestTimeFromCapabilities: true,
      cache: 20
    }).addTo(map);
    
    appState.activeLayers.add(variable);
    updateLegend(variable);
    setStatus('online');
    
    console.log(`✅ Camada WMS ${variable} carregada`);
    
  } catch (error) {
    console.error(`Erro ao carregar WMS ${variable}:`, error);
    setStatus('error');
    
    // Fallback com camada simulada
    loadSimulatedRasterLayer(variable);
  }
}

function loadSimulatedRasterLayer(variable) {
  console.log(`🔄 Carregando camada simulada para ${variable}`);
  
  // Para demonstração, criar uma camada colorida simples
  const bounds = [[-18.2, 8.5], [-4.2, 17.5]]; // Angola bounds (ZEE corrigida)
  
  const colors = {
    sst: '#ff4444',
    salinity: '#4444ff', 
    chlorophyll: '#44ff44'
  };
  
  const overlay = L.rectangle(bounds, {
    color: colors[variable] || '#888888',
    weight: 1,
    fillOpacity: 0.3,
    fillColor: colors[variable] || '#888888'
  }).addTo(map);
  
  overlay.bindPopup(`<strong>${variable.toUpperCase()} (Simulado)</strong><br>Dados demonstrativos para Angola`);
  
  appState.wmsLayers[variable] = overlay;
  appState.activeLayers.add(variable);
  updateLegend(variable, null, true);
  setStatus('online');
}

// === FUNÇÕES DE UI ===
function updateLegend(layerType, data = null, isSimulated = false) {
  const legend = document.getElementById('legend');
  const content = document.getElementById('legend-content');
  
  const legends = {
    currents: `
      <div><strong>🌊 Correntes Marinhas${isSimulated ? ' (Simulado)' : ''}</strong></div>
      <div style="margin-top: 4px;">
        <div style="display: flex; align-items: center; margin: 2px 0;">
          <div style="width: 12px; height: 2px; background: #3288bd; margin-right: 6px;"></div>
          <span>Lenta (&lt; 0.5 m/s)</span>
        </div>
        <div style="display: flex; align-items: center; margin: 2px 0;">
          <div style="width: 12px; height: 2px; background: #fdae61; margin-right: 6px;"></div>
          <span>Moderada (0.5-1.0 m/s)</span>
        </div>
        <div style="display: flex; align-items: center; margin: 2px 0;">
          <div style="width: 12px; height: 2px; background: #d53e4f; margin-right: 6px;"></div>
          <span>Rápida (&gt; 1.0 m/s)</span>
        </div>
      </div>
    `,
    wind: `
      <div><strong>💨 Vento${isSimulated ? ' (Simulado)' : ''}</strong></div>
      <div style="margin-top: 4px;">
        <div style="display: flex; align-items: center; margin: 2px 0;">
          <div style="width: 12px; height: 2px; background: #313695; margin-right: 6px;"></div>
          <span>Fraco (&lt; 5 m/s)</span>
        </div>
        <div style="display: flex; align-items: center; margin: 2px 0;">
          <div style="width: 12px; height: 2px; background: #fdae61; margin-right: 6px;"></div>
          <span>Moderado (5-10 m/s)</span>
        </div>
        <div style="display: flex; align-items: center; margin: 2px 0;">
          <div style="width: 12px; height: 2px; background: #d73027; margin-right: 6px;"></div>
          <span>Forte (&gt; 10 m/s)</span>
        </div>
      </div>
    `,
    sst: `
      <div><strong>🌡️ Temperatura Superficial${isSimulated ? ' (Simulado)' : ''}</strong></div>
      <div style="margin-top: 4px;">
        <div style="background: linear-gradient(to right, #0000ff, #00ffff, #ffff00, #ff0000); height: 8px; margin: 4px 0;"></div>
        <div style="font-size: 10px; display: flex; justify-content: space-between;">
          <span>15°C</span><span>30°C</span>
        </div>
      </div>
    `,
    salinity: `
      <div><strong>🧂 Salinidade${isSimulated ? ' (Simulado)' : ''}</strong></div>
      <div style="margin-top: 4px;">
        <div style="background: linear-gradient(to right, #0000ff, #ffffff, #ff0000); height: 8px; margin: 4px 0;"></div>
        <div style="font-size: 10px; display: flex; justify-content: space-between;">
          <span>34 PSU</span><span>36 PSU</span>
        </div>
      </div>
    `,
    chlorophyll: `
      <div><strong>🌱 Clorofila-a${isSimulated ? ' (Simulado)' : ''}</strong></div>
      <div style="margin-top: 4px;">
        <div style="background: linear-gradient(to right, #000080, #008000, #ffff00, #ff0000); height: 8px; margin: 4px 0;"></div>
        <div style="font-size: 10px; display: flex; justify-content: space-between;">
          <span>0.01</span><span>10 mg/m³</span>
        </div>
      </div>
    `
  };
  
  content.innerHTML = legends[layerType] || '<div>Camada ativa</div>';
  legend.classList.add('show');
}

function setStatus(status) {
  const indicator = document.querySelector('.status-indicator');
  if (indicator) {
    indicator.className = `status-indicator status-${status}`;
  }
}

function clearAllLayers() {
  // Remover camadas meteorológicas
  if (appState.velocityLayer) {
    map.removeLayer(appState.velocityLayer);
    appState.velocityLayer = null;
  }
  
  Object.values(appState.wmsLayers).forEach(layer => {
    if (layer) map.removeLayer(layer);
  });
  appState.wmsLayers = {};
  
  // Limpar estado
  appState.activeLayers.clear();
  appState.isAnimating = false;
  
  // Ocultar legenda
  document.getElementById('legend').classList.remove('show');
  
  // Resetar botões
  document.querySelectorAll('.btn').forEach(btn => {
    btn.classList.remove('active');
    btn.disabled = false;
  });
  
  setStatus('online');
  console.log('🧹 Todas as camadas foram removidas');
}

function toggleAnimation() {
  const btn = document.getElementById('btn-animate');
  
  if (appState.isAnimating) {
    // Parar animação
    if (map.timeDimensionControl) {
      map.timeDimensionControl.stop();
    }
    btn.innerHTML = '▶️ Animar';
    btn.style.background = '#9b59b6';
    appState.isAnimating = false;
  } else {
    // Iniciar animação
    if (map.timeDimensionControl && appState.activeLayers.size > 0) {
      map.timeDimensionControl.play();
      btn.innerHTML = '⏸️ Parar';
      btn.style.background = '#e74c3c';
      appState.isAnimating = true;
    } else {
      alert('Carregue pelo menos uma camada meteorológica antes de animar!');
    }
  }
}

// === EVENT LISTENERS ===
function initializeEventListeners() {
  console.log('🔧 Inicializando event listeners...');
  
  // Verificar se os elementos existem antes de adicionar event listeners
  const applyBtn = document.getElementById('apply');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const dateInput = document.getElementById('dateMin');
      if (dateInput) {
        const d = dateInput.value;
        loadOccurrences(d);
      }
    });
    console.log('✅ Event listener para botão Apply adicionado');
  } else {
    console.warn('⚠️ Botão Apply não encontrado');
  }

  // Botões de camadas oceanográficas
  const sstBtn = document.getElementById('btn-sst');
  if (sstBtn) {
    sstBtn.addEventListener('click', (e) => {
      e.target.classList.toggle('active');
      if (e.target.classList.contains('active')) {
        loadWMSLayer('sst');
      } else {
        if (appState.wmsLayers.sst) {
          map.removeLayer(appState.wmsLayers.sst);
          delete appState.wmsLayers.sst;
          appState.activeLayers.delete('sst');
        }
      }
    });
    console.log('✅ Event listener para SST adicionado');
  } else {
    console.warn('⚠️ Botão SST não encontrado');
  }

  const salinityBtn = document.getElementById('btn-salinity');
  if (salinityBtn) {
    salinityBtn.addEventListener('click', (e) => {
      e.target.classList.toggle('active');
      if (e.target.classList.contains('active')) {
        loadWMSLayer('salinity');
      } else {
        if (appState.wmsLayers.salinity) {
          map.removeLayer(appState.wmsLayers.salinity);
          delete appState.wmsLayers.salinity;
          appState.activeLayers.delete('salinity');
        }
      }
    });
    console.log('✅ Event listener para Salinidade adicionado');
  } else {
    console.warn('⚠️ Botão Salinidade não encontrado');
  }

  const chlorophyllBtn = document.getElementById('btn-chlorophyll');
  if (chlorophyllBtn) {
    chlorophyllBtn.addEventListener('click', (e) => {
      e.target.classList.toggle('active');
      if (e.target.classList.contains('active')) {
        loadWMSLayer('chlorophyll');
      } else {
        if (appState.wmsLayers.chlorophyll) {
          map.removeLayer(appState.wmsLayers.chlorophyll);
          delete appState.wmsLayers.chlorophyll;
          appState.activeLayers.delete('chlorophyll');
        }
      }
    });
    console.log('✅ Event listener para Clorofila adicionado');
  } else {
    console.warn('⚠️ Botão Clorofila não encontrado');
  }

  // Botões de campos vetoriais
  const currentsBtn = document.getElementById('btn-currents');
  if (currentsBtn) {
    currentsBtn.addEventListener('click', (e) => {
      e.target.classList.toggle('active');
      if (e.target.classList.contains('active')) {
        loadVelocityLayer('currents');
      } else {
        if (appState.velocityLayer) {
          map.removeLayer(appState.velocityLayer);
          appState.velocityLayer = null;
          appState.activeLayers.delete('currents');
        }
      }
    });
    console.log('✅ Event listener para Correntes adicionado');
  } else {
    console.warn('⚠️ Botão Correntes não encontrado');
  }

  const windBtn = document.getElementById('btn-wind');
  if (windBtn) {
    windBtn.addEventListener('click', (e) => {
      e.target.classList.toggle('active');
      if (e.target.classList.contains('active')) {
        loadVelocityLayer('wind');
      } else {
        if (appState.velocityLayer) {
          map.removeLayer(appState.velocityLayer);
          appState.velocityLayer = null;
          appState.activeLayers.delete('wind');
        }
      }
    });
    console.log('✅ Event listener para Vento adicionado');
  } else {
    console.warn('⚠️ Botão Vento não encontrado');
  }

  // Botões de controle
  const clearBtn = document.getElementById('btn-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllLayers);
    console.log('✅ Event listener para Limpar adicionado');
  } else {
    console.warn('⚠️ Botão Limpar não encontrado');
  }
  
  const animateBtn = document.getElementById('btn-animate');
  if (animateBtn) {
    animateBtn.addEventListener('click', toggleAnimation);
    console.log('✅ Event listener para Animar adicionado');
  } else {
    console.warn('⚠️ Botão Animar não encontrado');
  }
  
  console.log('🎯 Event listeners inicializados com segurança');
}

// === INICIALIZAÇÃO ===
function initializeMetoceanApp() {
  console.log('🚀 Inicializando BGAPP Meteorológico...');
  
  // Aguardar que o mapa seja criado pelo map-controller
  function waitForMapAndInitialize() {
    if (typeof window.bgappController !== 'undefined' && window.bgappController.map) {
      console.log('✅ Mapa encontrado, inicializando event listeners...');
      
      // Usar o mapa global do controller
      if (typeof map === 'undefined') {
        window.map = window.bgappController.map;
      }
      
      initializeEventListeners();
      loadAOI();
      
      const dateInput = document.getElementById('dateMin');
      if (dateInput && dateInput.value) {
        loadOccurrences(dateInput.value);
      }
    } else {
      console.log('⏳ Aguardando mapa ser criado...');
      setTimeout(waitForMapAndInitialize, 100);
    }
  }
  
  // Aguardar carregamento do DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForMapAndInitialize);
  } else {
    waitForMapAndInitialize();
  }
}

// ===== VERSÃO 2.0 - INICIALIZAÇÃO CONTROLADA =====
// NÃO inicializar automaticamente - será chamado pelo map-controller
// Exportar função para inicialização controlada
if (typeof window !== 'undefined') {
  window.initializeMetoceanApp = initializeMetoceanApp;
  console.log('📦 Metocean.js v2.0 carregado - aguardando inicialização controlada pelo map-controller');
  console.log('🔄 Esta versão NÃO executa automaticamente para evitar timing errors');
}
