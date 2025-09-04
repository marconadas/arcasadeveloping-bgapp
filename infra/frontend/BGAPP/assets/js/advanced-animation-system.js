/**
 * BGAPP Advanced Animation System
 * Sistema avançado de animações para mapas usando deck.gl, GSAP e Lottie
 * 
 * @author BGAPP Development Team
 * @version 2.0.0
 * @date 2025-01-09
 */

"use strict";

/**
 * Sistema avançado de animações para BGAPP
 */
class BGAPPAdvancedAnimationSystem {
    constructor(map, options = {}) {
        this.map = map;
        this.options = {
            // Configurações de performance
            particleCount: options.particleCount || 5000,
            animationSpeed: options.animationSpeed || 1.0,
            fadeOpacity: options.fadeOpacity || 0.97,
            
            // Configurações visuais
            colorScheme: options.colorScheme || 'ocean',
            particleSize: options.particleSize || 2,
            trailLength: options.trailLength || 90,
            
            // Configurações de dados
            dataUpdateInterval: options.dataUpdateInterval || 300000, // 5 minutos
            cacheTimeout: options.cacheTimeout || 3600000, // 1 hora
            
            ...options
        };
        
        this.isInitialized = false;
        this.isActive = false;
        this.animationFrame = null;
        this.dataCache = new Map();
        this.performanceMonitor = new PerformanceMonitor();
        
        // Layers e componentes
        this.deckLayer = null;
        this.particleLayer = null;
        this.timelineController = null;
        this.lottieAnimations = new Map();
        
        console.log("BGAPP Advanced Animation System - Inicializado", this.options);
    }

    /**
     * Inicializar o sistema
     */
    async initialize() {
        try {
            console.log("BGAPP Advanced Animation System - Iniciando inicialização...");
            
            // Verificar dependências
            await this._checkDependencies();
            
            // Inicializar deck.gl
            await this._initializeDeckGL();
            
            // Inicializar GSAP
            this._initializeGSAP();
            
            // Inicializar Lottie
            this._initializeLottie();
            
            // Inicializar timeline controller
            this._initializeTimelineController();
            
            // Setup de eventos
            this._setupEventListeners();
            
            this.isInitialized = true;
            console.log("BGAPP Advanced Animation System - Inicialização completa");
            
            return true;
            
        } catch (error) {
            console.error("BGAPP Advanced Animation System - Erro na inicialização:", error);
            return false;
        }
    }

    /**
     * Verificar se todas as dependências estão disponíveis
     */
    async _checkDependencies() {
        console.log("BGAPP Advanced Animation System - Verificando dependências...");
        console.log("DeckGL global:", typeof DeckGL);
        console.log("window.deck:", typeof window.deck);
        console.log("window.deck?.DeckGL:", window.deck?.DeckGL);
        
        // Verificar deck.gl
        if (typeof DeckGL !== 'undefined' || (window.deck && window.deck.DeckGL)) {
            console.log("BGAPP Advanced Animation System - ✅ deck.gl disponível");
            this.deckAvailable = true;
        } else {
            console.warn("BGAPP Advanced Animation System - ⚠️ deck.gl não encontrado, usando fallback");
            this.deckAvailable = false;
        }
        
        // Verificar GSAP
        if (window.gsap) {
            console.log("BGAPP Advanced Animation System - ✅ GSAP disponível");
        } else {
            console.warn("BGAPP Advanced Animation System - ⚠️ GSAP não encontrado");
        }
        
        // Verificar Lottie
        if (window.lottie) {
            console.log("BGAPP Advanced Animation System - ✅ Lottie disponível");
        } else {
            console.warn("BGAPP Advanced Animation System - ⚠️ Lottie não encontrado");
        }
        
        console.log("BGAPP Advanced Animation System - Verificação de dependências completa");
        console.log("deckAvailable:", this.deckAvailable);
    }

    /**
     * Inicializar deck.gl
     */
    async _initializeDeckGL() {
        if (!this.deckAvailable) {
            console.warn("BGAPP Advanced Animation System - Deck.gl não disponível, pulando inicialização");
            return;
        }
        
        try {
            // Verificar se deck.gl está disponível globalmente
            if (typeof DeckGL !== 'undefined') {
                // Usar DeckGL diretamente
                this.deckLayer = new DeckGL({
                    container: this.map.getContainer(),
                    mapStyle: null,
                    layers: [],
                    getTooltip: this._getDeckTooltip.bind(this)
                });
                console.log("BGAPP Advanced Animation System - Deck.gl inicializado com DeckGL");
            } else if (window.deck && window.deck.DeckGL) {
                // Usar deck namespace
                this.deckLayer = new deck.DeckGL({
                    container: this.map.getContainer(),
                    mapStyle: null,
                    layers: [],
                    getTooltip: this._getDeckTooltip.bind(this)
                });
                console.log("BGAPP Advanced Animation System - Deck.gl inicializado com deck.DeckGL");
            } else {
                console.warn("BGAPP Advanced Animation System - Deck.gl não encontrado, usando fallback");
                this.deckAvailable = false;
                return;
            }
            
        } catch (error) {
            console.error("BGAPP Advanced Animation System - Erro ao inicializar deck.gl:", error);
            this.deckAvailable = false;
            console.warn("BGAPP Advanced Animation System - Continuando sem deck.gl");
        }
    }

    /**
     * Inicializar GSAP
     */
    _initializeGSAP() {
        // Registrar plugins GSAP
        if (window.gsap) {
            gsap.registerPlugin(gsap.plugins?.ScrollTrigger);
            
            // Configurar defaults
            gsap.defaults({
                duration: 1,
                ease: "power2.out"
            });
            
            console.log("BGAPP Advanced Animation System - GSAP inicializado");
        }
    }

    /**
     * Inicializar Lottie
     */
    _initializeLottie() {
        // Carregar animações Lottie predefinidas
        this._loadLottieAnimations();
        console.log("BGAPP Advanced Animation System - Lottie inicializado");
    }

    /**
     * Carregar animações Lottie
     */
    async _loadLottieAnimations() {
        const animations = {
            loading: '/assets/animations/loading-ocean.json',
            wind: '/assets/animations/wind-particles.json',
            waves: '/assets/animations/ocean-waves.json',
            fish: '/assets/animations/fish-swimming.json'
        };

        for (const [name, path] of Object.entries(animations)) {
            try {
                // Verificar se arquivo existe (simulado)
                this.lottieAnimations.set(name, {
                    path: path,
                    loaded: false,
                    element: null
                });
            } catch (error) {
                console.warn(`Animação Lottie ${name} não encontrada:`, path);
            }
        }
    }

    /**
     * Inicializar controller de timeline
     */
    _initializeTimelineController() {
        this.timelineController = new TimelineController({
            container: this._createTimelineContainer(),
            onTimeChange: this._onTimelineChange.bind(this),
            onPlayStateChange: this._onPlayStateChange.bind(this)
        });
        
        console.log("BGAPP Advanced Animation System - Timeline controller inicializado");
    }

    /**
     * Criar container para timeline
     */
    _createTimelineContainer() {
        let container = document.getElementById('bgapp-timeline-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bgapp-timeline-container';
            container.className = 'bgapp-timeline-container';
            container.innerHTML = `
                <div class="timeline-controls">
                    <button class="timeline-btn" id="timeline-play">▶️</button>
                    <button class="timeline-btn" id="timeline-pause">⏸️</button>
                    <button class="timeline-btn" id="timeline-stop">⏹️</button>
                    <input type="range" id="timeline-slider" min="0" max="100" value="0">
                    <span id="timeline-time">00:00</span>
                </div>
            `;
            
            // Adicionar estilos
            const style = document.createElement('style');
            style.textContent = `
                .bgapp-timeline-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 10px;
                    border-radius: 8px;
                    z-index: 1000;
                    font-family: 'Segoe UI', sans-serif;
                }
                .timeline-controls {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .timeline-btn {
                    background: transparent;
                    border: 1px solid #333;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .timeline-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                #timeline-slider {
                    width: 200px;
                }
                #timeline-time {
                    font-size: 12px;
                    min-width: 40px;
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Criar camada de partículas avançada com deck.gl
     */
    createAdvancedParticleLayer(data, options = {}) {
        if (!this.deckAvailable) {
            console.warn("BGAPP Advanced Animation System - Deck.gl não disponível, retornando null");
            return null;
        }
        
        const layerOptions = {
            id: 'bgapp-particle-layer',
            data: data,
            getPosition: d => [d.longitude, d.latitude],
            getFillColor: d => this._getParticleColor(d.speed),
            getRadius: options.particleSize || this.options.particleSize,
            opacity: options.opacity || 0.8,
            ...options
        };

        try {
            // Usar a API correta baseada no que está disponível
            let LayerClass;
            if (typeof DeckGL !== 'undefined' && DeckGL.ScatterplotLayer) {
                LayerClass = DeckGL.ScatterplotLayer;
            } else if (window.deck && window.deck.ScatterplotLayer) {
                LayerClass = deck.ScatterplotLayer;
            } else {
                console.warn("BGAPP Advanced Animation System - ScatterplotLayer não encontrada");
                return null;
            }
            
            const particleLayer = new LayerClass(layerOptions);
            return particleLayer;
        } catch (error) {
            console.error("BGAPP Advanced Animation System - Erro ao criar layer:", error);
            return null;
        }
    }

    /**
     * Obter cor da partícula baseada na velocidade
     */
    _getParticleColor(speed) {
        const colorSchemes = {
            ocean: [
                [0, 50, 100, 180],      // Azul escuro para baixa velocidade
                [0, 100, 200, 200],     // Azul médio
                [50, 150, 255, 220],    // Azul claro
                [100, 200, 255, 240],   // Azul muito claro para alta velocidade
            ],
            wind: [
                [0, 100, 0, 180],       // Verde para baixa velocidade
                [100, 200, 0, 200],     // Amarelo-verde
                [255, 200, 0, 220],     // Amarelo
                [255, 100, 0, 240],     // Laranja para alta velocidade
            ]
        };

        const colors = colorSchemes[this.options.colorScheme] || colorSchemes.ocean;
        const normalizedSpeed = Math.min(speed / 15, 1); // Normalizar para 0-1
        const colorIndex = Math.floor(normalizedSpeed * (colors.length - 1));
        
        return colors[colorIndex] || colors[0];
    }

    /**
     * Animar transição entre datasets
     */
    animateDataTransition(fromData, toData, duration = 2000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Interpolação suave entre datasets
                const interpolatedData = this._interpolateData(fromData, toData, progress);
                
                // Atualizar layer
                this._updateParticleLayer(interpolatedData);
                
                if (progress < 1) {
                    this.animationFrame = requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    }

    /**
     * Interpolar entre dois datasets
     */
    _interpolateData(fromData, toData, progress) {
        if (!fromData || !toData) return toData || fromData;
        
        return toData.map((toPoint, index) => {
            const fromPoint = fromData[index];
            if (!fromPoint) return toPoint;
            
            return {
                ...toPoint,
                u: this._lerp(fromPoint.u, toPoint.u, progress),
                v: this._lerp(fromPoint.v, toPoint.v, progress),
                speed: this._lerp(fromPoint.speed, toPoint.speed, progress)
            };
        });
    }

    /**
     * Interpolação linear
     */
    _lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Atualizar camada de partículas
     */
    _updateParticleLayer(data) {
        if (this.deckLayer && this.deckAvailable) {
            const updatedLayer = this.createAdvancedParticleLayer(data);
            if (updatedLayer) {
                try {
                    this.deckLayer.setProps({
                        layers: [updatedLayer]
                    });
                    this.particleLayer = updatedLayer;
                    console.log("BGAPP Advanced Animation System - Layer atualizada");
                } catch (error) {
                    console.error("BGAPP Advanced Animation System - Erro ao atualizar layer:", error);
                }
            }
        }
    }

    /**
     * Setup de event listeners
     */
    _setupEventListeners() {
        // Timeline events
        const container = document.getElementById('bgapp-timeline-container');
        if (container) {
            const playBtn = container.querySelector('#timeline-play');
            const pauseBtn = container.querySelector('#timeline-pause');
            const stopBtn = container.querySelector('#timeline-stop');
            const slider = container.querySelector('#timeline-slider');
            
            playBtn?.addEventListener('click', () => this.play());
            pauseBtn?.addEventListener('click', () => this.pause());
            stopBtn?.addEventListener('click', () => this.stop());
            slider?.addEventListener('input', (e) => this.seekTo(e.target.value));
        }

        // Map events
        this.map.on('zoomend', () => this._onMapZoom());
        this.map.on('moveend', () => this._onMapMove());
        
        console.log("BGAPP Advanced Animation System - Event listeners configurados");
    }

    /**
     * Iniciar animação
     */
    async start() {
        if (!this.isInitialized) {
            console.warn("BGAPP Advanced Animation System - Sistema não inicializado ainda");
            return false;
        }
        
        if (this.isActive) {
            console.log("BGAPP Advanced Animation System - Sistema já ativo");
            return true;
        }
        
        try {
            console.log("BGAPP Advanced Animation System - Iniciando animações...");
            
            // Carregar dados iniciais
            const data = await this._loadAnimationData();
            
            // Se deck.gl estiver disponível, usar camadas avançadas
            if (this.deckAvailable && this.deckLayer) {
                // Criar camada de partículas
                this.particleLayer = this.createAdvancedParticleLayer(data);
                
                // Adicionar ao deck.gl
                this.deckLayer.setProps({
                    layers: [this.particleLayer]
                });
                
                console.log("BGAPP Advanced Animation System - Usando deck.gl para animações");
            } else {
                console.log("BGAPP Advanced Animation System - Usando animações básicas (sem deck.gl)");
            }
            
            // Mostrar timeline
            this._showTimeline();
            
            // Iniciar animação Lottie de loading
            this._showLottieAnimation('loading', false);
            
            this.isActive = true;
            this.performanceMonitor.start();
            
            console.log("BGAPP Advanced Animation System - Animações iniciadas com sucesso");
            return true;
            
        } catch (error) {
            console.error("BGAPP Advanced Animation System - Erro ao iniciar:", error);
            return false;
        }
    }

    /**
     * Parar animação
     */
    stop() {
        if (!this.isActive) return;
        
        console.log("BGAPP Advanced Animation System - Parando animações...");
        
        // Parar animações
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Limpar layers
        if (this.deckLayer) {
            this.deckLayer.setProps({ layers: [] });
        }
        
        // Esconder timeline
        this._hideTimeline();
        
        // Parar performance monitor
        this.performanceMonitor.stop();
        
        this.isActive = false;
        console.log("BGAPP Advanced Animation System - Animações paradas");
    }

    /**
     * Pausar animação
     */
    pause() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        console.log("BGAPP Advanced Animation System - Animação pausada");
    }

    /**
     * Continuar animação
     */
    play() {
        if (!this.isActive) {
            this.start();
        } else {
            // Retomar animação
            console.log("BGAPP Advanced Animation System - Animação retomada");
        }
    }

    /**
     * Buscar posição específica na timeline
     */
    seekTo(position) {
        console.log(`BGAPP Advanced Animation System - Buscando posição: ${position}%`);
        // Implementar busca temporal
    }

    /**
     * Mostrar animação Lottie
     */
    _showLottieAnimation(name, loop = true) {
        const animation = this.lottieAnimations.get(name);
        if (!animation) return;

        const element = document.createElement('lottie-player');
        element.setAttribute('src', animation.path);
        element.setAttribute('background', 'transparent');
        element.setAttribute('speed', '1');
        if (loop) element.setAttribute('loop', '');
        element.setAttribute('controls', '');
        element.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            z-index: 1001;
        `;

        document.body.appendChild(element);
        animation.element = element;
        
        // Auto-remover após tempo (se não for loop)
        if (!loop) {
            setTimeout(() => {
                element.remove();
                animation.element = null;
            }, 3000);
        }
    }

    /**
     * Mostrar timeline
     */
    _showTimeline() {
        const container = document.getElementById('bgapp-timeline-container');
        if (container) {
            gsap.to(container, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: "power2.out"
            });
        }
    }

    /**
     * Esconder timeline
     */
    _hideTimeline() {
        const container = document.getElementById('bgapp-timeline-container');
        if (container) {
            gsap.to(container, {
                opacity: 0,
                y: 20,
                duration: 0.3,
                ease: "power2.in"
            });
        }
    }

    /**
     * Carregar dados de animação
     */
    async _loadAnimationData() {
        // Simular carregamento de dados
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockData = this._generateMockData();
                resolve(mockData);
            }, 1000);
        });
    }

    /**
     * Gerar dados mock para demonstração
     */
    _generateMockData() {
        const data = [];
        const bounds = this.map.getBounds();
        const north = bounds.getNorth();
        const south = bounds.getSouth();
        const east = bounds.getEast();
        const west = bounds.getWest();
        
        for (let i = 0; i < this.options.particleCount / 10; i++) {
            const lat = south + (north - south) * Math.random();
            const lng = west + (east - west) * Math.random();
            const u = (Math.random() - 0.5) * 10;
            const v = (Math.random() - 0.5) * 10;
            const speed = Math.sqrt(u * u + v * v);
            
            data.push({
                latitude: lat,
                longitude: lng,
                u: u,
                v: v,
                speed: speed
            });
        }
        
        return data;
    }

    // Event handlers
    _onTimelineChange(time) {
        console.log(`Timeline mudou para: ${time}`);
    }

    _onPlayStateChange(isPlaying) {
        console.log(`Estado de reprodução: ${isPlaying ? 'reproduzindo' : 'parado'}`);
    }

    _onMapZoom() {
        if (this.isActive) {
            console.log("BGAPP Advanced Animation System - Zoom do mapa alterado");
            // Ajustar densidade de partículas baseado no zoom
        }
    }

    _onMapMove() {
        if (this.isActive) {
            console.log("BGAPP Advanced Animation System - Mapa movido");
            // Recarregar dados se necessário
        }
    }

    _getDeckTooltip({object}) {
        if (!object) return null;
        
        return {
            html: `
                <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
                    <strong>Dados Meteorológicos</strong><br/>
                    Velocidade: ${object.speed?.toFixed(2)} m/s<br/>
                    Direção: ${Math.atan2(object.v, object.u) * 180 / Math.PI}°
                </div>
            `,
            style: {
                backgroundColor: 'rgba(0, 0, 0, 0)',
                fontSize: '12px'
            }
        };
    }
}

/**
 * Controller de Timeline
 */
class TimelineController {
    constructor(options) {
        this.container = options.container;
        this.onTimeChange = options.onTimeChange;
        this.onPlayStateChange = options.onPlayStateChange;
        this.currentTime = 0;
        this.duration = 100;
        this.isPlaying = false;
    }
}

/**
 * Monitor de Performance
 */
class PerformanceMonitor {
    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = 0;
        this.isActive = false;
    }

    start() {
        this.isActive = true;
        this.lastTime = performance.now();
        this._monitor();
    }

    stop() {
        this.isActive = false;
    }

    _monitor() {
        if (!this.isActive) return;
        
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            console.log(`BGAPP Performance: ${this.fps} FPS`);
        }
        
        requestAnimationFrame(() => this._monitor());
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.BGAPPAdvancedAnimationSystem = BGAPPAdvancedAnimationSystem;
    window.TimelineController = TimelineController;
    window.PerformanceMonitor = PerformanceMonitor;
}

// Export para Node.js (testes)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BGAPPAdvancedAnimationSystem,
        TimelineController,
        PerformanceMonitor
    };
}

// Export para ambiente global (testes)
if (typeof global !== 'undefined') {
    global.BGAPPAdvancedAnimationSystem = BGAPPAdvancedAnimationSystem;
    global.TimelineController = TimelineController;
    global.PerformanceMonitor = PerformanceMonitor;
}

console.log("BGAPP Advanced Animation System - Módulo carregado");
