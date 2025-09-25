/**
 * BGAPP Wind Animation System - Core Engine
 * Sistema de animação de vento extraído e adaptado do Portus
 * Implementação completa com todas as funcionalidades
 */

"use strict";

// ===== CANVAS LAYER OTIMIZADO =====
if (!L.DomUtil.setTransform) {
  L.DomUtil.setTransform = function(el, offset, scale) {
    var pos = offset || new L.Point(0, 0);
    el.style[L.DomUtil.TRANSFORM] =
      (L.Browser.ie3d
        ? "translate(" + pos.x + "px," + pos.y + "px)"
        : "translate3d(" + pos.x + "px," + pos.y + "px,0)") +
      (scale ? " scale(" + scale + ")" : "");
  };
}

L.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend({
  initialize: function initialize(options) {
    this._map = null;
    this._canvas = null;
    this._frame = null;
    this._delegate = null;
    L.setOptions(this, options);
  },
  
  delegate: function delegate(del) {
    this._delegate = del;
    return this;
  },
  
  needRedraw: function needRedraw() {
    if (!this._frame) {
      this._frame = L.Util.requestAnimFrame(this.drawLayer, this);
    }
    return this;
  },
  
  _onLayerDidResize: function _onLayerDidResize(resizeEvent) {
    this._canvas.width = resizeEvent.newSize.x;
    this._canvas.height = resizeEvent.newSize.y;
  },
  
  _onLayerDidMove: function _onLayerDidMove() {
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);
    this.drawLayer();
  },
  
  getEvents: function getEvents() {
    var events = {
      resize: this._onLayerDidResize,
      moveend: this._onLayerDidMove,
    };

    if (this._map.options.zoomAnimation && L.Browser.any3d) {
      events.zoomanim = this._animateZoom;
    }

    return events;
  },
  
  onAdd: function onAdd(map) {
    console.log("BGAPP Wind Canvas Layer - Inicializando...");
    this._map = map;
    this._canvas = L.DomUtil.create("canvas", "leaflet-layer bgapp-wind-canvas");
    this.tiles = {};

    var size = this._map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;
    
    // Configurações críticas do canvas
    this._canvas.style.position = 'absolute';
    this._canvas.style.top = '0px';
    this._canvas.style.left = '0px';
    this._canvas.style.zIndex = this.options.zIndex || 200;
    this._canvas.style.pointerEvents = 'none'; // Permitir cliques no mapa
    this._canvas.style.width = size.x + 'px';
    this._canvas.style.height = size.y + 'px';
    
    console.log("BGAPP Wind Canvas - Tamanho configurado:", size.x + "x" + size.y);
    
    // Otimização baseada na documentação Leaflet para melhor performance
    var animated = this._map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(
      this._canvas,
      "leaflet-zoom-" + (animated ? "animated" : "hide")
    );
    
    // Usar requestAnimationFrame para melhor sincronização
    this.options.pane.appendChild(this._canvas);
    map.on(this.getEvents(), this);
    
    var del = this._delegate || this;
    del.onLayerDidMount && del.onLayerDidMount();

    this.needRedraw();
    var self = this;
    L.Util.requestAnimFrame(function() {
      self._onLayerDidMove();
    });
  },
  
  onRemove: function onRemove(map) {
    var del = this._delegate || this;
    del.onLayerWillUnmount && del.onLayerWillUnmount();

    this.options.pane.removeChild(this._canvas);
    map.off(this.getEvents(), this);
    this._canvas = null;
  },
  
  addTo: function addTo(map) {
    map.addLayer(this, true);
    return this;
  },
  
  drawLayer: function drawLayer() {
    var size = this._map.getSize();
    var bounds = this._map.getBounds();
    var zoom = this._map.getZoom();
    var center = this._map.options.crs.project(this._map.getCenter());
    var corner = this._map.options.crs.project(
      this._map.containerPointToLatLng(this._map.getSize())
    );

    var del = this._delegate || this;
    del.onDrawLayer &&
      del.onDrawLayer({
        layer: this,
        canvas: this._canvas,
        bounds: bounds,
        size: size,
        zoom: zoom,
        center: center,
        corner: corner,
      });
    this._frame = null;
  },
  
  _animateZoom: function _animateZoom(e) {
    var scale = this._map.getZoomScale(e.zoom);
    var offset = L.Layer
      ? this._map._latLngToNewLayerPoint(
          this._map.getBounds().getNorthWest(),
          e.zoom,
          e.center
        )
      : this._map
          ._getCenterOffset(e.center)
          ._multiplyBy(-scale)
          .subtract(this._map._getMapPanePos());
    L.DomUtil.setTransform(this._canvas, offset, scale);
  },
});

L.canvasLayer = function(pane) {
  return new L.CanvasLayer(pane);
};

// ===== CONTROLE DE VELOCIDADE =====
L.Control.Velocity = L.Control.extend({
  options: {
    position: "bottomleft",
    emptyString: "Dados de vento indisponíveis",
    angleConvention: "bearingCW", // bearing/meteo + CW/CCW
    speedUnit: "m/s", // m/s, k/h, kt
    onAdd: null,
    onRemove: null,
  },
  
  onAdd: function onAdd(map) {
    this._container = L.DomUtil.create("div", "leaflet-control-velocity bgapp-wind-control");
    L.DomEvent.disableClickPropagation(this._container);
    
    // Adicionar estilos customizados
    this._container.style.background = 'rgba(0, 0, 0, 0.8)';
    this._container.style.color = '#fff';
    this._container.style.padding = '8px 12px';
    this._container.style.borderRadius = '4px';
    this._container.style.fontSize = '12px';
    this._container.style.fontFamily = 'monospace';
    this._container.style.minWidth = '200px';
    
    map.on("mousemove", this._onMouseMove, this);
    map.on("click", this._onMouseClick, this);
    map.on("mouseout", this._onMouseOut, this);
    
    // CORREÇÃO: Mostrar status de inicialização em vez de "dados indisponíveis"
    this._container.innerHTML = `
      <div><strong>🌪️ Vento BGAPP</strong></div>
      <div>Inicializando sistema...</div>
      <div style="font-size:10px;opacity:0.7;">Aguarde o carregamento</div>
    `;
    
    if (this.options.leafletVelocity && this.options.leafletVelocity.options.onAdd) {
      this.options.leafletVelocity.options.onAdd();
    }
    
    return this._container;
  },
  
  onRemove: function onRemove(map) {
    map.off("mousemove", this._onMouseMove, this);
    map.off("click", this._onMouseClick, this);
    map.off("mouseout", this._onMouseOut, this);
    
    if (this.options.leafletVelocity && this.options.leafletVelocity.options.onRemove) {
      this.options.leafletVelocity.options.onRemove();
    }
  },
  
  vectorToSpeed: function vectorToSpeed(uMs, vMs, unit) {
    var velocityAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2));

    if (unit === "k/h") {
      return this.meterSec2kilometerHour(velocityAbs);
    } else if (unit === "kt") {
      return this.meterSec2Knots(velocityAbs);
    } else {
      return velocityAbs;
    }
  },
  
  vectorToDegrees: function vectorToDegrees(uMs, vMs, angleConvention) {
    if (angleConvention.endsWith("CCW")) {
      vMs = vMs > 0 ? (vMs = -vMs) : Math.abs(vMs);
    }

    var velocityAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2));
    var velocityDir = Math.atan2(uMs / velocityAbs, vMs / velocityAbs);
    var velocityDirToDegrees = (velocityDir * 180) / Math.PI + 180;

    if (angleConvention === "bearingCW" || angleConvention === "meteoCCW") {
      velocityDirToDegrees += 180;
      if (velocityDirToDegrees >= 360) velocityDirToDegrees -= 360;
    }

    return velocityDirToDegrees;
  },
  
  meterSec2Knots: function meterSec2Knots(meters) {
    return meters / 0.514;
  },
  
  // NOVO: Método para atualizar status do controle
  updateStatus: function updateStatus(status, message) {
    if (!this._container) return;
    
    var statusIcon = "🌪️";
    var statusColor = "#fff";
    
    switch(status) {
      case 'loading':
        statusIcon = "⏳";
        message = message || "Carregando dados...";
        break;
      case 'ready':
        statusIcon = "✅";
        statusColor = "#90EE90";
        message = message || "Sistema pronto";
        break;
      case 'error':
        statusIcon = "❌";
        statusColor = "#FFB6C1";
        message = message || "Erro no sistema";
        break;
      default:
        statusIcon = "🌪️";
        message = message || "Sistema ativo";
    }
    
    this._container.innerHTML = `
      <div><strong>${statusIcon} Vento BGAPP</strong></div>
      <div style="color: ${statusColor};">${message}</div>
      <div style="font-size:10px;opacity:0.7;">Clique no mapa para dados</div>
    `;
  },
  
  meterSec2kilometerHour: function meterSec2kilometerHour(meters) {
    return meters * 3.6;
  },
  
  _onMouseMove: function _onMouseMove(e) {
    if (this.options.leafletVelocity && this.options.leafletVelocity.options.onMouseMove) {
      this.options.leafletVelocity.options.onMouseMove();
    }
  },
  
  _onMouseClick: function _onMouseClick(e) {
    var self = this;
    var pos = this.options.leafletVelocity._map.containerPointToLatLng(
      L.point(e.containerPoint.x, e.containerPoint.y)
    );

    // CORREÇÃO: Verificar se windy e interpolatePoint existem
    var gridValue = null;
    if (this.options.leafletVelocity && this.options.leafletVelocity._windy && this.options.leafletVelocity._windy.interpolatePoint) {
      try {
        gridValue = this.options.leafletVelocity._windy.interpolatePoint(pos.lng, pos.lat);
        console.log("BGAPP Velocity Control - Interpolação:", pos, "->", gridValue);
      } catch (error) {
        console.warn("BGAPP Velocity Control - Erro na interpolação:", error);
      }
    }

    var direction, speed, unit;

    if (gridValue && gridValue[0] !== null && gridValue[1] !== null && !isNaN(gridValue[0]) && !isNaN(gridValue[1])) {
      direction = parseFloat(
        self
          .vectorToDegrees(
            gridValue[0],
            gridValue[1],
            this.options.angleConvention
          )
          .toFixed(2)
      );
      speed = parseFloat(
        self
          .vectorToSpeed(gridValue[0], gridValue[1], this.options.speedUnit)
          .toFixed(2)
      );
      unit = this.options.speedUnit;

      // Atualizar display em tempo real
      this._container.innerHTML = `
        <div><strong>🌪️ Vento BGAPP</strong></div>
        <div>Velocidade: ${speed} ${unit}</div>
        <div>Direção: ${direction}°</div>
        <div>Posição: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}</div>
        <div style="font-size:10px;opacity:0.7;">Dados: Simulados</div>
      `;
    } else {
      // CORREÇÃO: Mostrar informações de debug quando não há dados
      var debugInfo = "Sem dados";
      if (this.options.leafletVelocity && this.options.leafletVelocity._windy) {
        debugInfo += " (Motor ativo)";
      } else {
        debugInfo += " (Motor inativo)";
      }
      
      this._container.innerHTML = `
        <div><strong>🌪️ Vento BGAPP</strong></div>
        <div>${debugInfo}</div>
        <div>Posição: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}</div>
        <div style="font-size:10px;opacity:0.7;">Clique para atualizar</div>
      `;
    }

    if (this.options.leafletVelocity && this.options.leafletVelocity.options.onDrawTooltip) {
      this.options.leafletVelocity.options.onDrawTooltip(
        speed,
        direction,
        unit,
        pos.lng,
        pos.lat
      );
    }
  },
  
  _onMouseOut: function(ev) {
    // CORREÇÃO: Mostrar status do sistema em vez de "dados indisponíveis"
    var systemStatus = "Sistema ativo";
    if (this.options.leafletVelocity && this.options.leafletVelocity._windy) {
      systemStatus = "Motor de vento ativo";
    } else {
      systemStatus = "Motor de vento inativo";
    }
    
    this._container.innerHTML = `
      <div><strong>🌪️ Vento BGAPP</strong></div>
      <div>${systemStatus}</div>
      <div style="font-size:10px;opacity:0.7;">Clique no mapa para ver dados</div>
    `;
    
    if (this.options.leafletVelocity && this.options.leafletVelocity.options.onLeavingMap) {
      this.options.leafletVelocity.options.onLeavingMap();
    }
  },
});

L.control.velocity = function(options) {
  return new L.Control.Velocity(options);
};

// ===== PARTICLES LAYER =====
L.ParticlesLayer = (L.Layer ? L.Layer : L.Class).extend({
  options: {
    displayValues: true,
    displayOptions: {
      velocityType: "Vento",
      position: "bottomleft",
      emptyString: "Dados de vento indisponíveis",
    },
    maxVelocity: 15, // m/s - velocidade máxima para escala
    minVelocity: 0,
    colorScale: null,
    data: null,
    particleAge: 90,
    particleMultiplier: 1 / 300,
    lineWidth: 1,
    frameRate: 15,
    opacity: 0.97,
    velocityScale: 0.005,
  },
  
  _map: null,
  _canvasLayer: null,
  _windy: null,
  _context: null,
  _timer: 0,
  _mouseControl: null,
  
  initialize: function initialize(options) {
    L.setOptions(this, options);
    console.log("BGAPP ParticlesLayer - Inicializando com opções:", this.options);
  },
  
  onAdd: function onAdd(map) {
    console.log("BGAPP ParticlesLayer - Adicionando ao mapa");
    this._paneName = this.options.paneName || "overlayPane";
    var pane = map._panes.overlayPane;

    if (map.getPane) {
      pane = map.getPane(this._paneName);
      if (!pane) {
        pane = map.createPane(this._paneName);
      }
    }

    this._canvasLayer = L.canvasLayer({
      pane: pane,
      zIndex: this.options.zIndex || 200,
    }).delegate(this);

    this._canvasLayer.addTo(map);
    this._map = map;
    
    // Adicionar eventos de performance
    this._setupPerformanceMonitoring();
  },
  
  onRemove: function onRemove(map) {
    console.log("BGAPP ParticlesLayer - Removendo do mapa");
    this._destroyWind();
  },
  
  setData: function setData(data) {
    console.log("BGAPP ParticlesLayer - Definindo dados:", data ? "dados carregados" : "sem dados");
    this.options.data = data;

    if (this._windy) {
      this._windy.setData(data);
      this._clearAndRestart();
    }

    // CORREÇÃO: Atualizar status do controle quando dados são carregados
    if (this._mouseControl && this._mouseControl.updateStatus) {
      if (data) {
        this._mouseControl.updateStatus('ready', 'Dados carregados');
      } else {
        this._mouseControl.updateStatus('loading', 'Aguardando dados...');
      }
    }

    this.fire("load");
  },
  
  setOpacity: function setOpacity(opacity) {
    if (this._canvasLayer && this._canvasLayer._canvas) {
      this._canvasLayer._canvas.style.opacity = opacity;
    }
  },
  
  setOptions: function setOptions(options) {
    console.log("BGAPP ParticlesLayer - Atualizando opções:", options);
    this.options = Object.assign(this.options, options);

    if (options.hasOwnProperty("displayOptions")) {
      this.options.displayOptions = Object.assign(
        this.options.displayOptions,
        options.displayOptions
      );
      this._initMouseHandler(true);
    }

    if (options.hasOwnProperty("data")) this.options.data = options.data;

    if (this._windy) {
      this._windy.setOptions(options);
      if (options.hasOwnProperty("data")) this._windy.setData(options.data);
      this._clearAndRestart();
    }

    this.fire("load");
  },
  
  // Método principal de desenho - OTIMIZADO
  onDrawLayer: function onDrawLayer(overlay, params) {
    var self = this;

    if (!this._windy) {
      this._initWindy(this);
      return;
    }

    if (!this.options.data) {
      console.log("BGAPP ParticlesLayer - Aguardando dados...");
      return;
    }

    // OTIMIZAÇÃO: Usar requestAnimationFrame em vez de setTimeout
    // e reduzir delay para melhor responsividade
    if (this._timer) cancelAnimationFrame(self._timer);
    if (this._animationRequest) cancelAnimationFrame(this._animationRequest);
    
    this._animationRequest = requestAnimationFrame(function() {
      // Pequeno delay apenas se necessário para evitar chamadas excessivas
      self._timer = setTimeout(function() {
        self._startWindy();
      }, 100); // Reduzido de 750ms para 100ms
    });
  },
  
  _startWindy: function _startWindy() {
    console.log("BGAPP ParticlesLayer - Iniciando animação de vento");
    let size = this._map.getSize();
    let bounds = this._map.getBounds();

    console.log("BGAPP ParticlesLayer - Tamanho do mapa:", size);
    console.log("BGAPP ParticlesLayer - Bounds do mapa:", bounds);

    // Usar bounds completos do mapa para máxima cobertura
    this._windy.start(
      [[0, 0], [size.x, size.y]], // Canvas completo
      size.x,
      size.y,
      [
        [bounds.getWest(), bounds.getSouth()],
        [bounds.getEast(), bounds.getNorth()],
      ]
    );
  },
  
  _initWindy: function _initWindy(self) {
    console.log("BGAPP ParticlesLayer - Inicializando motor Windy");
    var options = Object.assign(
      {
        canvas: self._canvasLayer._canvas,
        map: this._map,
      },
      self.options
    );
    
    this._windy = new Windy(options);
    this._context = this._canvasLayer._canvas.getContext("2d");
    this._canvasLayer._canvas.classList.add("bgapp-velocity-overlay");

    // Teste visual para verificar se canvas está funcionando
    console.log("BGAPP ParticlesLayer - Testando renderização do canvas");
    this._context.fillStyle = 'rgba(255, 0, 0, 0.5)';
    this._context.fillRect(10, 10, 100, 50);
    this._context.fillStyle = 'white';
    this._context.font = '12px Arial';
    this._context.fillText('BGAPP Wind Test', 15, 30);
    
    setTimeout(() => {
      this._context.clearRect(0, 0, this._canvasLayer._canvas.width, this._canvasLayer._canvas.height);
      this.onDrawLayer();
    }, 2000);

    this.onDrawLayer();

    // Eventos do mapa
    this._map.on("dragstart", self._windy.stop);
    this._map.on("zoomstart", self._windy.stop);
    this._map.on("moveend", () => { this._clearAndRestart(); });
    this._map.on("zoomend", () => { this._clearAndRestart(); });

    this._initMouseHandler(false);
  },
  
  _initMouseHandler: function _initMouseHandler(voidPrevious) {
    if (voidPrevious && this._mouseControl) {
      this._map.removeControl(this._mouseControl);
      this._mouseControl = false;
    }

    if (!this._mouseControl && this.options.displayValues) {
      var options = this.options.displayOptions || {};
      options["leafletVelocity"] = this;
      this._mouseControl = L.control.velocity(options).addTo(this._map);
      
      // CORREÇÃO: Atualizar status inicial do controle
      if (this._mouseControl.updateStatus) {
        if (this.options.data) {
          this._mouseControl.updateStatus('ready', 'Sistema pronto - Clique no mapa');
        } else {
          this._mouseControl.updateStatus('loading', 'Carregando dados...');
        }
      }
    }
  },
  
  _clearAndRestart: function _clearAndRestart() {
    if (this._context) {
      this._context.clearRect(0, 0, this._context.canvas.width, this._context.canvas.height);
    }
    if (this._windy) {
      // OTIMIZAÇÃO: Usar requestAnimationFrame para restart suave
      if (this._restartRequest) cancelAnimationFrame(this._restartRequest);
      this._restartRequest = requestAnimationFrame(() => { 
        this._startWindy(); 
      });
    }
  },
  
  _clearWind: function _clearWind() {
    if (this._windy) this._windy.stop();
    if (this._context) {
      this._context.clearRect(0, 0, this._context.canvas.width, this._context.canvas.height);
    }
  },
  
  _destroyWind: function _destroyWind() {
    // OTIMIZAÇÃO: Limpar todos os timers e animation frames
    if (this._timer) clearTimeout(this._timer);
    if (this._animationRequest) cancelAnimationFrame(this._animationRequest);
    if (this._restartRequest) cancelAnimationFrame(this._restartRequest);
    
    // Parar monitoramento de performance
    this._stopPerformanceMonitoring();
    
    if (this._windy) this._windy.stop();
    if (this._context) {
      this._context.clearRect(0, 0, this._context.canvas.width, this._context.canvas.height);
    }
    if (this._mouseControl) {
      this._map.removeControl(this._mouseControl);
    }
    this._mouseControl = null;
    this._windy = null;

    if (this._canvasLayer) {
      this._map.removeLayer(this._canvasLayer);
    }
  },
  
  _setupPerformanceMonitoring: function() {
    // OTIMIZAÇÃO: Monitor de performance mais eficiente
    this._performanceMetrics = {
      frameCount: 0,
      startTime: Date.now(),
      lastFpsUpdate: Date.now(),
      intervalId: null
    };
    
    // OTIMIZAÇÃO: Usar timeout recursivo em vez de setInterval para melhor controle
    const scheduleNextCheck = () => {
      this._performanceMetrics.timeoutId = setTimeout(() => {
        const now = Date.now();
        const elapsed = (now - this._performanceMetrics.lastFpsUpdate) / 1000;
        
        if (elapsed > 0 && this._performanceMetrics.frameCount > 0) {
          const fps = this._performanceMetrics.frameCount / elapsed;
          
          // Log apenas se FPS for muito baixo (potencial problema)
          if (fps < 15) {
            console.warn(`BGAPP Wind Animation - FPS baixo: ${fps.toFixed(2)}`);
          } else if (fps > 0) {
            console.log(`BGAPP Wind Animation - FPS: ${fps.toFixed(2)}`);
          }
        }
        
        this._performanceMetrics.frameCount = 0;
        this._performanceMetrics.lastFpsUpdate = now;
        
        // Reagendar próxima verificação
        scheduleNextCheck();
      }, 30000);
    };
    
    // Iniciar monitoramento
    scheduleNextCheck();
  },
  
  _stopPerformanceMonitoring: function() {
    if (this._performanceMetrics && this._performanceMetrics.timeoutId) {
      clearTimeout(this._performanceMetrics.timeoutId);
      this._performanceMetrics.timeoutId = null;
    }
  }
});

L.particlesLayer = function(options) {
  return new L.ParticlesLayer(options);
};

// ===== MOTOR WINDY PRINCIPAL =====
var Windy = function Windy(params) {
  console.log("BGAPP Windy Engine - Inicializando com parâmetros:", params);
  
  // Configurações otimizadas para BGAPP
  var MIN_VELOCITY_INTENSITY = params.minVelocity || 0;
  var MAX_VELOCITY_INTENSITY = params.maxVelocity || 15;
  var VELOCITY_SCALE = (params.velocityScale || 0.005) * (Math.pow(window.devicePixelRatio, 1 / 3) || 1);
  var MAX_PARTICLE_AGE = params.particleAge || 90;
  var PARTICLE_LINE_WIDTH = params.lineWidth || 1;
  var PARTICLE_MULTIPLIER = params.particleMultiplier || 1 / 300;
  var PARTICLE_REDUCTION = Math.pow(window.devicePixelRatio, 1 / 3) || 1.6;
  var FRAME_RATE = params.frameRate || 15;
  var FRAME_TIME = 1000 / FRAME_RATE;
  var OPACITY = params.opacity || 0.97;
  
  // Escala de cores otimizada para dados de vento marítimo
  var defaultColorScale = [
    "rgb(36,104,180)",    // Azul escuro - ventos fracos
    "rgb(60,157,194)",    // Azul médio
    "rgb(128,205,193)",   // Azul claro
    "rgb(151,218,168)",   // Verde claro
    "rgb(198,231,181)",   // Verde
    "rgb(238,247,217)",   // Verde claro
    "rgb(255,238,159)",   // Amarelo claro
    "rgb(252,217,125)",   // Amarelo
    "rgb(255,182,100)",   // Laranja claro
    "rgb(252,150,75)",    // Laranja
    "rgb(250,112,52)",    // Laranja escuro
    "rgb(245,64,32)",     // Vermelho claro
    "rgb(237,45,28)",     // Vermelho
    "rgb(220,24,32)",     // Vermelho escuro
    "rgb(180,0,35)",      // Vermelho muito escuro - ventos extremos
  ];
  
  var colorScale = params.colorScale || defaultColorScale;
  var NULL_WIND_VECTOR = [NaN, NaN, null];

  var builder;
  var grid;
  var gridData = params.data;
  var date;
  var λ0, φ0, Δλ, Δφ, ni, nj;

  // Função para definir novos dados
  var setData = function setData(data) {
    console.log("BGAPP Windy - Definindo novos dados");
    gridData = data;
  };

  // Função para atualizar opções
  var setOptions = function setOptions(options) {
    console.log("BGAPP Windy - Atualizando opções:", options);
    if (options.hasOwnProperty("minVelocity")) MIN_VELOCITY_INTENSITY = options.minVelocity;
    if (options.hasOwnProperty("maxVelocity")) MAX_VELOCITY_INTENSITY = options.maxVelocity;
    if (options.hasOwnProperty("velocityScale")) {
      VELOCITY_SCALE = (options.velocityScale || 0.005) * (Math.pow(window.devicePixelRatio, 1 / 3) || 1);
    }
    if (options.hasOwnProperty("particleAge")) MAX_PARTICLE_AGE = options.particleAge;
    if (options.hasOwnProperty("lineWidth")) PARTICLE_LINE_WIDTH = options.lineWidth;
    if (options.hasOwnProperty("particleMultiplier")) PARTICLE_MULTIPLIER = options.particleMultiplier;
    if (options.hasOwnProperty("opacity")) OPACITY = +options.opacity;
    if (options.hasOwnProperty("frameRate")) FRAME_RATE = options.frameRate;
    if (options.hasOwnProperty("colorScale")) colorScale = options.colorScale;
    FRAME_TIME = 1000 / FRAME_RATE;
  };

  // Interpolação bilinear para vetores de vento
  var bilinearInterpolateVector = function bilinearInterpolateVector(x, y, g00, g10, g01, g11) {
    var rx = 1 - x;
    var ry = 1 - y;
    var a = rx * ry, b = x * ry, c = rx * y, d = x * y;
    var u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
    var v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
    return [u, v, Math.sqrt(u * u + v * v)];
  };

  // Construtor de dados de vento
  var createWindBuilder = function createWindBuilder(uComp, vComp) {
    var uData = uComp.data, vData = vComp.data;
    return {
      header: uComp.header,
      data: function data(i) {
        return [uData[i], vData[i]];
      },
      interpolate: bilinearInterpolateVector,
    };
  };

  // Criar builder a partir dos dados
  var createBuilder = function createBuilder(data) {
    var uComp = null, vComp = null, scalar = null;
    
    data.forEach(function(record) {
      switch (record.header.parameterCategory + "," + record.header.parameterNumber) {
        case "1,2":
        case "2,2":
          uComp = record;
          break;
        case "1,3":
        case "2,3":
          vComp = record;
          break;
        default:
          scalar = record;
      }
    });
    
    return createWindBuilder(uComp, vComp);
  };

  // Construir grade de dados
  var buildGrid = function buildGrid(data, callback) {
    console.log("BGAPP Windy - Construindo grade de dados");
    
    var supported = true;
    if (data.length < 2) supported = false;
    if (!supported) {
      console.error("BGAPP Windy Error: dados devem ter pelo menos dois componentes (u,v)");
      return;
    }

    builder = createBuilder(data);
    var header = builder.header;
    
    if (header.hasOwnProperty("gridDefinitionTemplate") && header.gridDefinitionTemplate != 0) {
      supported = false;
    }

    if (!supported) {
      console.error("BGAPP Windy Error: Apenas dados com coordenadas Latitude_Longitude são suportados");
      return;
    }

    λ0 = header.lo1;
    φ0 = header.la1;
    Δλ = header.dx;
    Δφ = header.dy;
    ni = header.nx;
    nj = header.ny;

    // Processar modo de varredura
    if (header.hasOwnProperty("scanMode")) {
      var scanModeMask = header.scanMode.toString(2);
      scanModeMask = ("0" + scanModeMask).slice(-8);
      var scanModeMaskArray = scanModeMask.split("").map(Number).map(Boolean);
      
      if (scanModeMaskArray[0]) Δλ = -Δλ;
      if (scanModeMaskArray[1]) Δφ = -Δφ;
      
      for (let i = 2; i < 8; i++) {
        if (scanModeMaskArray[i]) {
          supported = false;
          break;
        }
      }
      
      if (!supported) {
        console.error("BGAPP Windy Error: Modo de varredura " + header.scanMode + " não suportado");
        return;
      }
    }

    date = new Date(header.refTime);
    date.setHours(date.getHours() + header.forecastTime);

    // Construir grade
    grid = [];
    var p = 0;
    var isContinuous = Math.floor(ni * Δλ) >= 360;

    for (var j = 0; j < nj; j++) {
      var row = [];
      for (var i = 0; i < ni; i++, p++) {
        row[i] = builder.data(p);
      }
      if (isContinuous) {
        row.push(row[0]); // Duplicar primeira coluna como última para grades envolventes
      }
      grid[j] = row;
    }

    console.log("BGAPP Windy - Grade construída com sucesso");
    callback({
      date: date,
      interpolate: interpolate,
    });
  };

  // Função de interpolação principal
  var interpolate = function interpolate(λ, φ) {
    if (!grid) return null;
    
    var i = floorMod(λ - λ0, 360) / Δλ;
    var j = (φ0 - φ) / Δφ;
    var fi = Math.floor(i), ci = fi + 1;
    var fj = Math.floor(j), cj = fj + 1;
    var row;

    if ((row = grid[fj])) {
      var g00 = row[fi];
      var g10 = row[ci];
      
      if (isValue(g00) && isValue(g10) && (row = grid[cj])) {
        var g01 = row[fi];
        var g11 = row[ci];
        
        if (isValue(g01) && isValue(g11)) {
          return builder.interpolate(i - fi, j - fj, g00, g10, g01, g11);
        }
      }
    }
    return null;
  };

  // Funções auxiliares
  var isValue = function isValue(x) {
    return x !== null && x !== undefined;
  };

  var floorMod = function floorMod(a, n) {
    return a - n * Math.floor(a / n);
  };

  var clamp = function clamp(x, range) {
    return Math.max(range[0], Math.min(x, range[1]));
  };

  var isMobile = function isMobile() {
    return /android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i.test(navigator.userAgent);
  };

  // Distorção da projeção
  var distort = function distort(projection, λ, φ, x, y, scale, wind) {
    var u = wind[0] * scale;
    var v = wind[1] * scale;
    var d = distortion(projection, λ, φ, x, y);
    wind[0] = d[0] * u + d[2] * v;
    wind[1] = d[1] * u + d[3] * v;
    return wind;
  };

  var distortion = function distortion(projection, λ, φ, x, y) {
    var τ = 2 * Math.PI;
    var H = 5;
    var hλ = λ < 0 ? H : -H;
    var hφ = φ < 0 ? H : -H;
    var pλ = project(φ, λ + hλ);
    var pφ = project(φ + hφ, λ);
    var k = Math.cos((φ / 360) * τ);
    
    return [
      (pλ[0] - x) / hλ / k,
      (pλ[1] - y) / hλ / k,
      (pφ[0] - x) / hφ,
      (pφ[1] - y) / hφ,
    ];
  };

  // Funções de projeção
  var invert = function invert(x, y, windy) {
    var latlon = params.map.containerPointToLatLng(L.point(x, y));
    return [latlon.lng, latlon.lat];
  };

  var project = function project(lat, lon, windy) {
    var xy = params.map.latLngToContainerPoint(L.latLng(lat, lon));
    return [xy.x, xy.y];
  };

  // Converter graus para radianos
  var deg2rad = function deg2rad(deg) {
    return (deg / 180) * Math.PI;
  };

  // Criar campo de partículas
  var createField = function createField(columns, bounds, callback) {
    function field(x, y) {
      var column = columns[Math.round(x)];
      return (column && column[Math.round(y)]) || NULL_WIND_VECTOR;
    }

    field.release = function() {
      columns = [];
    };

    field.randomize = function(o) {
      var x, y;
      var safetyNet = 0;
      
      do {
        x = Math.round(Math.floor(Math.random() * bounds.width) + bounds.x);
        y = Math.round(Math.floor(Math.random() * bounds.height) + bounds.y);
      } while (field(x, y)[2] === null && safetyNet++ < 30);

      o.x = x;
      o.y = y;
      return o;
    };

    callback(bounds, field);
  };

  // Construir bounds
  var buildBounds = function buildBounds(bounds, width, height) {
    var upperLeft = bounds[0];
    var lowerRight = bounds[1];
    var x = Math.max(Math.floor(upperLeft[0], 0), 0);
    var y = Math.max(Math.floor(upperLeft[1], 0), 0);
    var xMax = Math.min(Math.ceil(lowerRight[0], width), width - 1);
    var yMax = Math.min(Math.ceil(lowerRight[1], height), height - 1);
    
    return {
      x: x,
      y: y,
      xMax: xMax,
      yMax: yMax,
      width: width,
      height: height,
    };
  };

  // Interpolar campo
  var interpolateField = function interpolateField(grid, bounds, extent, callback) {
    console.log("BGAPP Windy - Interpolando campo de vento");
    
    var projection = {};
    var mapArea = (extent.south - extent.north) * (extent.west - extent.east);
    var velocityScale = VELOCITY_SCALE * Math.pow(mapArea, 0.4);
    var columns = [];
    var x = bounds.x;

    function interpolateColumn(x) {
      var column = [];
      
      for (var y = bounds.y; y <= bounds.yMax; y += 2) {
        var coord = invert(x, y);
        
        if (coord) {
          var λ = coord[0], φ = coord[1];
          
          if (isFinite(λ)) {
            var wind = grid.interpolate(λ, φ);
            
            if (wind) {
              wind = distort(projection, λ, φ, x, y, velocityScale, wind);
              column[y + 1] = column[y] = wind;
            }
          }
        }
      }
      
      columns[x + 1] = columns[x] = column;
    }

    (function batchInterpolate() {
      var start = Date.now();
      
      while (x < bounds.xMax) {
        interpolateColumn(x);
        x += 2;
        
        // Reduzir tempo de processamento contínuo para evitar violações
        if (Date.now() - start > 100) {
          L.Util.requestAnimFrame(batchInterpolate);
          return;
        }
      }
      
      createField(columns, bounds, callback);
    })();
  };

  // Variáveis de animação
  var animationLoop;

  // Função de animação principal
  var animate = function animate(bounds, field) {
    console.log("BGAPP Windy - Iniciando animação");
    
    function windIntensityColorScale(min, max) {
      colorScale.indexFor = function(m) {
        return Math.max(0, Math.min(colorScale.length - 1, 
          Math.round(((m - min) / (max - min)) * (colorScale.length - 1))));
      };
      return colorScale;
    }

    var colorStyles = windIntensityColorScale(MIN_VELOCITY_INTENSITY, MAX_VELOCITY_INTENSITY);
    var buckets = colorStyles.map(function() { return []; });
    
    var particleCount = Math.round((bounds.xMax - bounds.x) * (bounds.yMax - bounds.y) * PARTICLE_MULTIPLIER);
    
    if (isMobile()) {
      particleCount *= PARTICLE_REDUCTION;
    }

    console.log(`BGAPP Windy - Criando ${particleCount} partículas`);

    var fadeFillStyle = "rgba(0, 0, 0, " + OPACITY + ")";
    var particles = [];

    for (var i = 0; i < particleCount; i++) {
      particles.push(field.randomize({
        age: Math.floor(Math.random() * MAX_PARTICLE_AGE) + 0,
      }));
    }

    function evolve() {
      buckets.forEach(function(bucket) {
        bucket.length = 0;
      });
      
      particles.forEach(function(particle) {
        if (particle.age > MAX_PARTICLE_AGE) {
          field.randomize(particle).age = 0;
        }

        var x = particle.x;
        var y = particle.y;
        var v = field(x, y);
        var m = v[2];

        if (m === null) {
          particle.age = MAX_PARTICLE_AGE;
        } else {
          var xt = x + v[0];
          var yt = y + v[1];

          if (field(xt, yt)[2] !== null) {
            particle.xt = xt;
            particle.yt = yt;
            buckets[colorStyles.indexFor(m)].push(particle);
          } else {
            particle.x = xt;
            particle.y = yt;
          }
        }

        particle.age += 1;
      });
    }

    var g = params.canvas.getContext("2d");
    g.lineWidth = PARTICLE_LINE_WIDTH;
    g.fillStyle = fadeFillStyle;
    g.globalAlpha = 0.8; // CORREÇÃO: Aumentar opacidade de 0.6 para 0.8

    function draw() {
      // CORREÇÃO: Fade mais suave para melhor visibilidade
      var prev = g.globalCompositeOperation;
      g.globalCompositeOperation = "destination-in";
      g.fillRect(0, 0, g.canvas.width, g.canvas.height);
      g.globalCompositeOperation = prev;
      g.globalAlpha = OPACITY === 0 ? 0 : Math.max(0.7, OPACITY * 0.95); // CORREÇÃO: Opacidade mínima 0.7

      // Desenhar novas trilhas - CORREÇÃO: Melhor visibilidade
      buckets.forEach(function(bucket, i) {
        if (bucket.length > 0) {
          g.beginPath();
          g.strokeStyle = colorStyles[i];
          g.lineWidth = Math.max(1.5, PARTICLE_LINE_WIDTH); // CORREÇÃO: Mínimo 1.5px
          g.lineCap = 'round'; // CORREÇÃO: Linhas arredondadas
          g.lineJoin = 'round'; // CORREÇÃO: Junções arredondadas
          
          bucket.forEach(function(particle) {
            g.moveTo(particle.x, particle.y);
            g.lineTo(particle.xt, particle.yt);
            particle.x = particle.xt;
            particle.y = particle.yt;
          });
          
          g.stroke();
        }
      });
      
      // CORREÇÃO: Debug visual ativo para diagnosticar visibilidade
      if (Math.random() < 0.01) { // 1% das vezes para mostrar partículas
        g.fillStyle = 'rgba(255, 0, 0, 0.8)'; // Vermelho semi-transparente
        g.strokeStyle = 'rgba(255, 255, 0, 0.9)'; // Amarelo para contorno
        g.lineWidth = 2;
        
        particles.slice(0, 10).forEach(function(particle) {
          // Desenhar partícula como círculo
          g.beginPath();
          g.arc(particle.x, particle.y, 2, 0, 2 * Math.PI);
          g.fill();
          g.stroke();
        });
        
        console.log("BGAPP Windy - Debug: Partículas visíveis desenhadas");
      }
      
      // CORREÇÃO: Forçar desenho de algumas partículas sempre
      if (particles.length > 0 && Math.random() < 0.005) { // 0.5% das vezes
        g.fillStyle = 'rgba(0, 255, 255, 0.7)'; // Ciano para destacar
        const sampleParticles = particles.slice(0, 20);
        sampleParticles.forEach(function(particle) {
          g.fillRect(particle.x - 1, particle.y - 1, 3, 3);
        });
        console.log(`BGAPP Windy - Forçando visibilidade de ${sampleParticles.length} partículas`);
      }
      
      // Atualizar métricas de performance
      if (params.performanceMetrics) {
        params.performanceMetrics.frameCount++;
      }
    }

    var then = Date.now();
    var frameSkipCounter = 0;
    var maxFrameSkips = 3; // Máximo de frames para pular antes de forçar render

    (function frame() {
      animationLoop = requestAnimationFrame(frame);
      var now = Date.now();
      var delta = now - then;

      // OTIMIZAÇÃO: Frame rate adaptativo e controle de skipping
      if (delta > FRAME_TIME || frameSkipCounter >= maxFrameSkips) {
        then = now - (delta % FRAME_TIME);
        frameSkipCounter = 0;
        
        // Usar try-catch para evitar erros que bloqueiem a animação
        try {
          evolve();
          draw();
        } catch (error) {
          console.warn("BGAPP Wind - Erro na animação (recuperando):", error);
        }
      } else {
        frameSkipCounter++;
      }
    })();
  };

  // Função para iniciar a animação
  var start = function start(bounds, width, height, extent) {
    console.log("BGAPP Windy - Iniciando com bounds:", bounds, "extent:", extent);
    
    var mapBounds = {
      south: deg2rad(extent[0][1]),
      north: deg2rad(extent[1][1]),
      east: deg2rad(extent[1][0]),
      west: deg2rad(extent[0][0]),
      width: width,
      height: height,
    };
    
    stop();

    buildGrid(gridData, function(grid) {
      interpolateField(grid, buildBounds(bounds, width, height), mapBounds, function(bounds, field) {
        windy.field = field;
        animate(bounds, field);
      });
    });
  };

  // Função para parar a animação
  var stop = function stop() {
    console.log("BGAPP Windy - Parando animação");
    if (windy.field) windy.field.release();
    if (animationLoop) cancelAnimationFrame(animationLoop);
  };

  // Objeto principal retornado
  var windy = {
    params: params,
    start: start,
    stop: stop,
    createField: createField,
    interpolatePoint: interpolate,
    setData: setData,
    setOptions: setOptions,
  };
  
  return windy;
};

// Polyfill para cancelAnimationFrame
if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}

console.log("BGAPP Wind Animation Core - Sistema carregado com sucesso! 🌪️");
