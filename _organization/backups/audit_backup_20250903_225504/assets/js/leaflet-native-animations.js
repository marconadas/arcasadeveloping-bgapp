/**
 * BGAPP Leaflet Native Animation System
 * Sistema de animações nativo usando Canvas e SVG do Leaflet
 * Baseado na documentação oficial: https://leafletjs.com/reference.html
 * 
 * @author BGAPP Development Team
 * @version 1.0.0
 * @date 2025-01-09
 */

"use strict";

/**
 * Sistema de animações nativo do Leaflet para BGAPP
 * Usa Canvas renderer e SVG para máxima compatibilidade
 */
class BGAPPLeafletNativeAnimations {
    constructor(map, options = {}) {
        this.map = map;
        this.options = {
            // Configurações de performance
            preferCanvas: true, // Usar Canvas renderer para melhor performance
            particleCount: options.particleCount || 2000,
            animationSpeed: options.animationSpeed || 1.0,
            frameRate: options.frameRate || 30,
            
            // Configurações visuais
            particleSize: options.particleSize || 2,
            particleOpacity: options.particleOpacity || 0.8,
            trailLength: options.trailLength || 50,
            colorScheme: options.colorScheme || 'ocean',
            
            // Configurações de dados
            updateInterval: options.updateInterval || 100,
            maxAge: options.maxAge || 100,
            
            ...options
        };
        
        this.isActive = false;
        this.animationFrame = null;
        this.particles = [];
        this.canvas = null;
        this.context = null;
        this.bounds = null;
        
        // Layers do Leaflet
        this.canvasLayer = null;
        this.markerLayer = null;
        this.svgLayer = null;
        
        console.log("BGAPP Leaflet Native Animations - Inicializado", this.options);
        this._initialize();
    }

    /**
     * Inicializar sistema nativo
     */
    _initialize() {
        try {
            // Configurar mapa para usar Canvas renderer
            this.map.options.preferCanvas = this.options.preferCanvas;
            
            // Criar Canvas Layer personalizada
            this._createCanvasLayer();
            
            // Criar layer de marcadores animados
            this._createMarkerLayer();
            
            // Criar layer SVG para elementos vetoriais
            this._createSVGLayer();
            
            // Setup de eventos
            this._setupEventListeners();
            
            console.log("BGAPP Leaflet Native Animations - Inicialização completa");
            
        } catch (error) {
            console.error("BGAPP Leaflet Native Animations - Erro na inicialização:", error);
        }
    }

    /**
     * Criar Canvas Layer personalizada usando API nativa do Leaflet
     */
    _createCanvasLayer() {
        // Criar Canvas Layer baseado na documentação do Leaflet
        this.canvasLayer = L.Class.extend({
            initialize: function(options) {
                L.setOptions(this, options);
            },

            onAdd: function(map) {
                this._map = map;
                this._canvas = L.DomUtil.create('canvas', 'leaflet-layer');
                this._context = this._canvas.getContext('2d');
                
                // Configurar canvas
                const size = map.getSize();
                this._canvas.width = size.x;
                this._canvas.height = size.y;
                
                // Adicionar ao mapa
                map.getPanes().overlayPane.appendChild(this._canvas);
                
                // Setup de eventos
                map.on('viewreset', this._reset, this);
                map.on('zoom', this._reset, this);
                map.on('move', this._reset, this);
                
                this._reset();
            },

            onRemove: function(map) {
                L.DomUtil.remove(this._canvas);
                map.off('viewreset', this._reset, this);
                map.off('zoom', this._reset, this);
                map.off('move', this._reset, this);
            },

            _reset: function() {
                const topLeft = this._map.containerPointToLayerPoint([0, 0]);
                L.DomUtil.setPosition(this._canvas, topLeft);
                
                const size = this._map.getSize();
                this._canvas.width = size.x;
                this._canvas.height = size.y;
                
                this._redraw();
            },

            _redraw: function() {
                if (this.options.onDraw) {
                    this.options.onDraw(this._context, this._canvas, this._map);
                }
            },

            getCanvas: function() {
                return this._canvas;
            },

            getContext: function() {
                return this._context;
            }
        });

        // Instanciar canvas layer
        this.canvas = new this.canvasLayer({
            onDraw: this._drawParticles.bind(this)
        });

        console.log("BGAPP Leaflet Native - Canvas Layer criada");
    }

    /**
     * Criar layer de marcadores animados
     */
    _createMarkerLayer() {
        this.markerLayer = L.layerGroup();
        
        // Criar ícones animados personalizados
        this.animatedIcons = {
            wind: this._createAnimatedWindIcon(),
            wave: this._createAnimatedWaveIcon(),
            current: this._createAnimatedCurrentIcon(),
            station: this._createAnimatedStationIcon()
        };
        
        console.log("BGAPP Leaflet Native - Marker Layer criada");
    }

    /**
     * Criar layer SVG para elementos vetoriais
     */
    _createSVGLayer() {
        this.svgLayer = L.layerGroup();
        console.log("BGAPP Leaflet Native - SVG Layer criada");
    }

    /**
     * Criar ícone de vento animado usando SVG
     */
    _createAnimatedWindIcon() {
        const svgIcon = L.divIcon({
            className: 'bgapp-wind-icon',
            html: `
                <svg width="24" height="24" viewBox="0 0 24 24" class="wind-animation">
                    <style>
                        .wind-animation {
                            animation: windSpin 2s linear infinite;
                        }
                        @keyframes windSpin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        .wind-lines {
                            stroke: #4fc3f7;
                            stroke-width: 2;
                            fill: none;
                            animation: windFlow 1.5s ease-in-out infinite;
                        }
                        @keyframes windFlow {
                            0%, 100% { opacity: 0.3; stroke-dashoffset: 0; }
                            50% { opacity: 1; stroke-dashoffset: 10; }
                        }
                    </style>
                    <g class="wind-lines">
                        <path d="M4 12 Q12 8 20 12" stroke-dasharray="5,5"/>
                        <path d="M4 8 Q12 4 20 8" stroke-dasharray="3,3"/>
                        <path d="M4 16 Q12 12 20 16" stroke-dasharray="4,4"/>
                    </g>
                </svg>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        return svgIcon;
    }

    /**
     * Criar ícone de onda animado
     */
    _createAnimatedWaveIcon() {
        const svgIcon = L.divIcon({
            className: 'bgapp-wave-icon',
            html: `
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <style>
                        .wave-animation {
                            animation: waveMotion 2s ease-in-out infinite;
                        }
                        @keyframes waveMotion {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-3px); }
                        }
                        .wave-path {
                            stroke: #00bcd4;
                            stroke-width: 2;
                            fill: none;
                        }
                    </style>
                    <g class="wave-animation">
                        <path class="wave-path" d="M2 12 Q6 8 10 12 T18 12 T22 12"/>
                        <path class="wave-path" d="M2 16 Q6 12 10 16 T18 16 T22 16" opacity="0.7"/>
                    </g>
                </svg>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        return svgIcon;
    }

    /**
     * Criar ícone de corrente animado
     */
    _createAnimatedCurrentIcon() {
        const svgIcon = L.divIcon({
            className: 'bgapp-current-icon',
            html: `
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <style>
                        .current-animation {
                            animation: currentFlow 3s linear infinite;
                        }
                        @keyframes currentFlow {
                            0% { stroke-dashoffset: 0; }
                            100% { stroke-dashoffset: 20; }
                        }
                        .current-arrow {
                            stroke: #ff5722;
                            stroke-width: 2;
                            fill: none;
                            stroke-dasharray: 5,5;
                        }
                    </style>
                    <g class="current-animation">
                        <path class="current-arrow" d="M4 12 L20 12"/>
                        <path class="current-arrow" d="M16 8 L20 12 L16 16"/>
                    </g>
                </svg>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        return svgIcon;
    }

    /**
     * Criar ícone de estação animado
     */
    _createAnimatedStationIcon() {
        const svgIcon = L.divIcon({
            className: 'bgapp-station-icon',
            html: `
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <style>
                        .station-pulse {
                            animation: stationPulse 2s ease-in-out infinite;
                        }
                        @keyframes stationPulse {
                            0%, 100% { opacity: 1; transform: scale(1); }
                            50% { opacity: 0.7; transform: scale(1.2); }
                        }
                        .station-circle {
                            fill: #4caf50;
                            stroke: #2e7d32;
                            stroke-width: 2;
                        }
                    </style>
                    <circle class="station-circle station-pulse" cx="12" cy="12" r="8"/>
                    <circle fill="white" cx="12" cy="12" r="3"/>
                </svg>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        return svgIcon;
    }

    /**
     * Desenhar partículas no canvas
     */
    _drawParticles(context, canvas, map) {
        if (!this.isActive || !this.particles.length) return;
        
        // Limpar canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Configurar estilo
        context.globalAlpha = this.options.particleOpacity;
        context.lineWidth = this.options.particleSize;
        
        // Desenhar cada partícula
        this.particles.forEach(particle => {
            if (particle.age > this.options.maxAge) {
                this._resetParticle(particle);
            }
            
            // Converter coordenadas geográficas para pixels
            const point = map.latLngToContainerPoint([particle.lat, particle.lng]);
            const nextPoint = map.latLngToContainerPoint([
                particle.lat + particle.vLat * this.options.animationSpeed,
                particle.lng + particle.vLng * this.options.animationSpeed
            ]);
            
            // Obter cor baseada na velocidade
            const color = this._getParticleColor(particle.speed);
            context.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
            
            // Desenhar linha da partícula
            context.beginPath();
            context.moveTo(point.x, point.y);
            context.lineTo(nextPoint.x, nextPoint.y);
            context.stroke();
            
            // Atualizar posição da partícula
            particle.lat += particle.vLat * this.options.animationSpeed;
            particle.lng += particle.vLng * this.options.animationSpeed;
            particle.age++;
        });
    }

    /**
     * Inicializar partículas
     */
    _initializeParticles(windData) {
        this.particles = [];
        this.bounds = this.map.getBounds();
        
        for (let i = 0; i < this.options.particleCount; i++) {
            this.particles.push(this._createParticle(windData));
        }
        
        console.log(`BGAPP Leaflet Native - ${this.particles.length} partículas criadas`);
    }

    /**
     * Criar uma partícula
     */
    _createParticle(windData) {
        const bounds = this.bounds;
        const lat = bounds.getSouth() + (bounds.getNorth() - bounds.getSouth()) * Math.random();
        const lng = bounds.getWest() + (bounds.getEast() - bounds.getWest()) * Math.random();
        
        // Obter dados de vento para esta posição (simulado)
        const windSpeed = this._getWindAtPosition(lat, lng, windData);
        
        return {
            lat: lat,
            lng: lng,
            vLat: windSpeed.vLat,
            vLng: windSpeed.vLng,
            speed: windSpeed.speed,
            age: Math.random() * this.options.maxAge
        };
    }

    /**
     * Resetar partícula
     */
    _resetParticle(particle) {
        const bounds = this.bounds;
        particle.lat = bounds.getSouth() + (bounds.getNorth() - bounds.getSouth()) * Math.random();
        particle.lng = bounds.getWest() + (bounds.getEast() - bounds.getWest()) * Math.random();
        particle.age = 0;
        
        // Recalcular velocidade
        const windSpeed = this._getWindAtPosition(particle.lat, particle.lng);
        particle.vLat = windSpeed.vLat;
        particle.vLng = windSpeed.vLng;
        particle.speed = windSpeed.speed;
    }

    /**
     * Obter vento em uma posição (simulado)
     */
    _getWindAtPosition(lat, lng, windData = null) {
        // Se não há dados reais, simular baseado na posição
        const baseSpeed = 0.001;
        const variation = 0.0005;
        
        const vLat = (Math.sin(lng * 0.1) + Math.cos(lat * 0.1)) * baseSpeed + 
                     (Math.random() - 0.5) * variation;
        const vLng = (Math.cos(lng * 0.1) + Math.sin(lat * 0.1)) * baseSpeed + 
                     (Math.random() - 0.5) * variation;
        
        const speed = Math.sqrt(vLat * vLat + vLng * vLng) * 1000; // Converter para m/s
        
        return { vLat, vLng, speed };
    }

    /**
     * Obter cor da partícula baseada na velocidade
     */
    _getParticleColor(speed) {
        const colorSchemes = {
            ocean: [
                [0, 100, 200, 180],     // Azul escuro - baixa velocidade
                [0, 150, 255, 200],     // Azul médio
                [50, 200, 255, 220],    // Azul claro
                [100, 255, 255, 240]    // Azul muito claro - alta velocidade
            ],
            wind: [
                [0, 150, 0, 180],       // Verde - baixa velocidade
                [150, 200, 0, 200],     // Amarelo-verde
                [255, 200, 0, 220],     // Amarelo
                [255, 100, 0, 240]      // Laranja - alta velocidade
            ]
        };

        const colors = colorSchemes[this.options.colorScheme] || colorSchemes.ocean;
        const normalizedSpeed = Math.min(speed / 10, 1); // Normalizar para 0-1
        const colorIndex = Math.floor(normalizedSpeed * (colors.length - 1));
        
        return colors[colorIndex] || colors[0];
    }

    /**
     * Adicionar marcadores animados para estações meteorológicas
     */
    addWeatherStations(stations) {
        stations.forEach(station => {
            const marker = L.marker([station.lat, station.lng], {
                icon: this.animatedIcons.station,
                pane: 'markerPane',
                zIndexOffset: 1000
            }).bindPopup(`
                <div style="text-align: center;">
                    <strong>${station.name}</strong><br>
                    <small>Estação Meteorológica</small><br>
                    Vento: ${station.windSpeed || 'N/A'} m/s<br>
                    Direção: ${station.windDirection || 'N/A'}°
                </div>
            `);
            
            this.markerLayer.addLayer(marker);
        });
        
        console.log(`BGAPP Leaflet Native - ${stations.length} estações adicionadas`);
    }

    /**
     * Adicionar indicadores de vento animados
     */
    addWindIndicators(windData) {
        windData.forEach(point => {
            // Criar seta de vento usando SVG
            const windArrow = this._createWindArrow(point);
            this.svgLayer.addLayer(windArrow);
        });
        
        console.log(`BGAPP Leaflet Native - ${windData.length} indicadores de vento adicionados`);
    }

    /**
     * Criar seta de vento animada
     */
    _createWindArrow(windPoint) {
        const rotation = Math.atan2(windPoint.v, windPoint.u) * 180 / Math.PI;
        const speed = Math.sqrt(windPoint.u * windPoint.u + windPoint.v * windPoint.v);
        const color = speed > 5 ? '#ff5722' : speed > 2 ? '#ff9800' : '#4caf50';
        
        const windIcon = L.divIcon({
            className: 'bgapp-wind-arrow',
            html: `
                <div style="transform: rotate(${rotation}deg); animation: windPulse 2s ease-in-out infinite;">
                    <svg width="20" height="20" viewBox="0 0 20 20">
                        <path d="M10 2 L18 10 L14 10 L14 18 L6 18 L6 10 L2 10 Z" 
                              fill="${color}" opacity="0.8"/>
                    </svg>
                </div>
                <style>
                    @keyframes windPulse {
                        0%, 100% { transform: scale(1) rotate(${rotation}deg); }
                        50% { transform: scale(1.2) rotate(${rotation}deg); }
                    }
                </style>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        return L.marker([windPoint.latitude, windPoint.longitude], {
            icon: windIcon,
            pane: 'markerPane',
            zIndexOffset: 1000
        }).bindTooltip(`Vento: ${speed.toFixed(1)} m/s`);
    }

    /**
     * Iniciar animações
     */
    async start(windData = null) {
        try {
            console.log("BGAPP Leaflet Native - Iniciando animações...");
            
            // Adicionar layers ao mapa
            if (!this.map.hasLayer(this.canvasLayer)) {
                this.map.addLayer(this.canvas);
            }
            if (!this.map.hasLayer(this.markerLayer)) {
                this.map.addLayer(this.markerLayer);
            }
            if (!this.map.hasLayer(this.svgLayer)) {
                this.map.addLayer(this.svgLayer);
            }
            
            // Inicializar partículas
            this._initializeParticles(windData);
            
            // Iniciar loop de animação
            this.isActive = true;
            this._startAnimationLoop();
            
            // Adicionar estações de exemplo
            this._addExampleStations();
            
            console.log("BGAPP Leaflet Native - Animações iniciadas com sucesso");
            return true;
            
        } catch (error) {
            console.error("BGAPP Leaflet Native - Erro ao iniciar:", error);
            return false;
        }
    }

    /**
     * Parar animações
     */
    stop() {
        this.isActive = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Remover layers
        if (this.map.hasLayer(this.canvas)) {
            this.map.removeLayer(this.canvas);
        }
        if (this.map.hasLayer(this.markerLayer)) {
            this.map.removeLayer(this.markerLayer);
        }
        if (this.map.hasLayer(this.svgLayer)) {
            this.map.removeLayer(this.svgLayer);
        }
        
        console.log("BGAPP Leaflet Native - Animações paradas");
    }

    /**
     * Loop de animação principal
     */
    _startAnimationLoop() {
        const animate = () => {
            if (!this.isActive) return;
            
            // Redesenhar canvas
            if (this.canvas && this.canvas._context) {
                this.canvas._redraw();
            }
            
            // Continuar animação
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }

    /**
     * Adicionar estações de exemplo
     */
    _addExampleStations() {
        const exampleStations = [
            {
                name: "Luanda",
                lat: -8.8368,
                lng: 13.2343,
                windSpeed: 12.5,
                windDirection: 225
            },
            {
                name: "Cabinda",
                lat: -5.5500,
                lng: 12.2000,
                windSpeed: 8.3,
                windDirection: 180
            },
            {
                name: "Benguela",
                lat: -12.5763,
                lng: 13.4055,
                windSpeed: 15.2,
                windDirection: 270
            }
        ];
        
        this.addWeatherStations(exampleStations);
    }

    /**
     * Atualizar dados de vento
     */
    updateWindData(windData) {
        if (!windData || !windData.data) return;
        
        console.log("BGAPP Leaflet Native - Atualizando dados de vento");
        
        // Limpar indicadores antigos
        this.svgLayer.clearLayers();
        
        // Adicionar novos indicadores
        this.addWindIndicators(windData.data);
        
        // Atualizar partículas
        this.particles.forEach(particle => {
            const windSpeed = this._getWindAtPosition(particle.lat, particle.lng, windData);
            particle.vLat = windSpeed.vLat;
            particle.vLng = windSpeed.vLng;
            particle.speed = windSpeed.speed;
        });
    }

    /**
     * Setup de event listeners
     */
    _setupEventListeners() {
        // Eventos do mapa
        this.map.on('zoomend', () => {
            if (this.isActive) {
                this.bounds = this.map.getBounds();
                console.log("BGAPP Leaflet Native - Zoom alterado, atualizando bounds");
            }
        });
        
        this.map.on('moveend', () => {
            if (this.isActive) {
                this.bounds = this.map.getBounds();
                console.log("BGAPP Leaflet Native - Mapa movido, atualizando bounds");
            }
        });
        
        console.log("BGAPP Leaflet Native - Event listeners configurados");
    }

    /**
     * Obter estatísticas
     */
    getStats() {
        return {
            isActive: this.isActive,
            particleCount: this.particles.length,
            markerCount: this.markerLayer.getLayers().length,
            svgLayerCount: this.svgLayer.getLayers().length,
            frameRate: this.options.frameRate,
            bounds: this.bounds
        };
    }
}

/**
 * Extensão para animações temporais usando Leaflet nativo
 */
class BGAPPLeafletTimeAnimation {
    constructor(map, options = {}) {
        this.map = map;
        this.options = {
            timeStep: options.timeStep || 3600000, // 1 hora em ms
            totalDuration: options.totalDuration || 86400000, // 24 horas
            playbackSpeed: options.playbackSpeed || 1000, // 1 segundo = 1 hora
            ...options
        };
        
        this.currentTime = Date.now();
        this.isPlaying = false;
        this.timeInterval = null;
        this.dataCache = new Map();
        
        console.log("BGAPP Leaflet Time Animation - Inicializado");
    }

    /**
     * Iniciar reprodução temporal
     */
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.timeInterval = setInterval(() => {
            this.currentTime += this.options.timeStep;
            this._updateForTime(this.currentTime);
        }, this.options.playbackSpeed);
        
        console.log("BGAPP Leaflet Time Animation - Reprodução iniciada");
    }

    /**
     * Pausar reprodução temporal
     */
    pause() {
        this.isPlaying = false;
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
        
        console.log("BGAPP Leaflet Time Animation - Reprodução pausada");
    }

    /**
     * Ir para tempo específico
     */
    seekToTime(timestamp) {
        this.currentTime = timestamp;
        this._updateForTime(this.currentTime);
        
        console.log(`BGAPP Leaflet Time Animation - Buscando tempo: ${new Date(timestamp)}`);
    }

    /**
     * Atualizar visualização para tempo específico
     */
    _updateForTime(timestamp) {
        // Simular dados temporais
        const timeData = this._generateTimeData(timestamp);
        
        // Disparar evento para outros sistemas
        this.map.fire('timeupdate', {
            timestamp: timestamp,
            data: timeData
        });
    }

    /**
     * Gerar dados temporais simulados
     */
    _generateTimeData(timestamp) {
        const hour = new Date(timestamp).getHours();
        const windIntensity = 0.5 + 0.3 * Math.sin((hour / 24) * Math.PI * 2);
        
        return {
            timestamp: timestamp,
            windIntensity: windIntensity,
            waveHeight: windIntensity * 2,
            currentStrength: windIntensity * 0.5
        };
    }
}

/**
 * Utilitários para animações Leaflet
 */
class BGAPPLeafletAnimationUtils {
    /**
     * Animar marcador ao longo de uma rota
     */
    static animateMarkerAlongRoute(marker, route, options = {}) {
        const duration = options.duration || 5000;
        const steps = route.length;
        const stepDuration = duration / steps;
        let currentStep = 0;
        
        const animate = () => {
            if (currentStep >= steps) {
                if (options.onComplete) options.onComplete();
                return;
            }
            
            const point = route[currentStep];
            marker.setLatLng([point.lat, point.lng]);
            
            if (options.onStep) {
                options.onStep(currentStep, point);
            }
            
            currentStep++;
            setTimeout(animate, stepDuration);
        };
        
        animate();
    }

    /**
     * Animar zoom suave para bounds
     */
    static animateZoomToBounds(map, bounds, options = {}) {
        const duration = options.duration || 2000;
        const steps = 30;
        const stepDuration = duration / steps;
        
        const startZoom = map.getZoom();
        const startCenter = map.getCenter();
        const endZoom = map.getBoundsZoom(bounds);
        const endCenter = bounds.getCenter();
        
        let step = 0;
        
        const animate = () => {
            if (step >= steps) {
                map.fitBounds(bounds);
                if (options.onComplete) options.onComplete();
                return;
            }
            
            const progress = step / steps;
            const currentZoom = startZoom + (endZoom - startZoom) * progress;
            const currentLat = startCenter.lat + (endCenter.lat - startCenter.lat) * progress;
            const currentLng = startCenter.lng + (endCenter.lng - startCenter.lng) * progress;
            
            map.setView([currentLat, currentLng], currentZoom);
            
            step++;
            setTimeout(animate, stepDuration);
        };
        
        animate();
    }

    /**
     * Criar efeito de ondulação (ripple) em um ponto
     */
    static createRippleEffect(map, latlng, options = {}) {
        const maxRadius = options.maxRadius || 50;
        const duration = options.duration || 2000;
        const color = options.color || '#4fc3f7';
        
        const circle = L.circle(latlng, {
            radius: 0,
            fillColor: color,
            fillOpacity: 0.3,
            stroke: true,
            color: color,
            weight: 2,
            opacity: 0.8
        }).addTo(map);
        
        // Animar expansão
        let currentRadius = 0;
        const steps = 60;
        const stepDuration = duration / steps;
        const radiusStep = maxRadius / steps;
        
        const animate = () => {
            if (currentRadius >= maxRadius) {
                map.removeLayer(circle);
                if (options.onComplete) options.onComplete();
                return;
            }
            
            currentRadius += radiusStep;
            const opacity = 1 - (currentRadius / maxRadius);
            
            circle.setRadius(currentRadius);
            circle.setStyle({
                fillOpacity: opacity * 0.3,
                opacity: opacity * 0.8
            });
            
            setTimeout(animate, stepDuration);
        };
        
        animate();
        return circle;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.BGAPPLeafletNativeAnimations = BGAPPLeafletNativeAnimations;
    window.BGAPPLeafletTimeAnimation = BGAPPLeafletTimeAnimation;
    window.BGAPPLeafletAnimationUtils = BGAPPLeafletAnimationUtils;
}

// Export para Node.js (testes)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BGAPPLeafletNativeAnimations,
        BGAPPLeafletTimeAnimation,
        BGAPPLeafletAnimationUtils
    };
}

console.log("BGAPP Leaflet Native Animation System - Módulo carregado");
