/**
 * BGAPP Wind Integration System
 * Sistema principal de integração da animação de vento com o BGAPP
 * Conecta todos os componentes e fornece API unificada
 */

"use strict";

class BGAPPWindSystem {
    constructor(map, options = {}) {
        if (!map) {
            throw new Error("BGAPP Wind System - Mapa Leaflet é obrigatório");
        }

        this.map = map;
        this.options = {
            // Configurações gerais
            enabled: options.enabled !== false,
            autoStart: options.autoStart !== false,
            
            // Configurações de dados
            dataSource: options.dataSource || 'gfs',
            updateInterval: options.updateInterval || 3600000, // 1 hora
            preloadData: options.preloadData !== false,
            
            // Configurações visuais
            particleCount: options.particleCount || 'auto', // auto, low, medium, high
            colorScheme: options.colorScheme || 'default',
            opacity: options.opacity || 0.8,
            lineWidth: options.lineWidth || 1,
            
            // Configurações temporais
            timeRange: options.timeRange || 24, // horas
            playSpeed: options.playSpeed || 1000, // ms
            autoPlay: options.autoPlay || false,
            
            // Configurações de área
            bounds: options.bounds || {
                north: -4.0,
                south: -18.5,
                west: 8.0,
                east: 25.0
            },
            
            // Controles UI
            showControls: options.showControls !== false,
            showVelocityInfo: options.showVelocityInfo !== false,
            showPlayer: options.showPlayer !== false,
            compactControls: options.compactControls || false,
            
            // Callbacks
            onReady: options.onReady || null,
            onDataUpdate: options.onDataUpdate || null,
            onError: options.onError || null,
            onPerformanceIssue: options.onPerformanceIssue || null,
        };

        // Componentes do sistema
        this.dataLoader = null;
        this.timeDimension = null;
        this.particlesLayer = null;
        this.playerControl = null;
        this.velocityControl = null;
        this.configPanel = null;
        
        // Estado do sistema
        this.isInitialized = false;
        this.isActive = false;
        this.currentData = null;
        this.performanceMetrics = {
            fps: 0,
            memoryUsage: 0,
            loadTime: 0,
            renderTime: 0
        };
        
        // Inicializar sistema
        this._initialize();
        
        console.log("BGAPP Wind System - Inicializando sistema completo...", this.options);
    }

    /**
     * Inicializar todos os componentes
     */
    async _initialize() {
        try {
            // 1. Inicializar carregador de dados
            await this._initializeDataLoader();
            
            // 2. Inicializar dimensão temporal
            await this._initializeTimeDimension();
            
            // 3. Inicializar camada de partículas
            await this._initializeParticlesLayer();
            
            // 4. Inicializar controles UI
            await this._initializeControls();
            
            // 5. Configurar eventos e integrações
            await this._setupIntegrations();
            
            // 6. Pré-carregar dados se necessário
            if (this.options.preloadData) {
                await this._preloadInitialData();
            }
            
            this.isInitialized = true;
            
            if (this.options.autoStart && this.options.enabled) {
                await this.start();
            }
            
            if (this.options.onReady) {
                this.options.onReady(this);
            }
            
            console.log("BGAPP Wind System - Sistema inicializado com sucesso! 🌪️");
            
        } catch (error) {
            console.error("BGAPP Wind System - Erro na inicialização:", error);
            this._handleError(error);
        }
    }

    /**
     * Inicializar carregador de dados
     */
    async _initializeDataLoader() {
        console.log("BGAPP Wind System - Inicializando carregador de dados");
        
        this.dataLoader = new BGAPPWindDataLoader({
            bounds: this.options.bounds,
            cacheEnabled: true,
            cacheExpiration: this.options.updateInterval,
            updateInterval: this.options.updateInterval,
            onDataLoaded: (data, config) => {
                this._onDataLoaded(data, config);
            },
            onError: (error, config) => {
                this._handleDataError(error, config);
            },
            onProgress: (progress) => {
                this._onLoadProgress(progress);
            }
        });
    }

    /**
     * Inicializar dimensão temporal
     */
    async _initializeTimeDimension() {
        console.log("BGAPP Wind System - Inicializando dimensão temporal");
        
        const now = new Date();
        const startTime = new Date(now.getTime() - this.options.timeRange * 3600000);
        
        this.timeDimension = new BGAPPTimeDimension({
            startTime: startTime,
            endTime: now,
            currentTime: now,
            step: 3600000, // 1 hora
            speed: this.options.playSpeed,
            autoPlay: this.options.autoPlay,
            onTimeChange: (time, index) => {
                this._onTimeChange(time, index);
            },
            onPlay: () => {
                console.log("BGAPP Wind System - Reprodução iniciada");
            },
            onPause: () => {
                console.log("BGAPP Wind System - Reprodução pausada");
            }
        });
    }

    /**
     * Inicializar camada de partículas
     */
    async _initializeParticlesLayer() {
        console.log("BGAPP Wind System - Inicializando camada de partículas");
        
        // Determinar configurações de partículas baseadas na performance
        const particleConfig = this._getParticleConfiguration();
        
        this.particlesLayer = L.particlesLayer({
            displayValues: this.options.showVelocityInfo,
            displayOptions: {
                velocityType: "Vento",
                position: "bottomleft",
                emptyString: "Dados de vento indisponíveis",
            },
            maxVelocity: 20, // m/s
            minVelocity: 0,
            opacity: this.options.opacity,
            lineWidth: this.options.lineWidth,
            particleMultiplier: particleConfig.multiplier,
            particleAge: particleConfig.age,
            frameRate: particleConfig.frameRate,
            colorScale: this._getColorScale(),
            zIndex: 200,
            // Otimizações baseadas na documentação Leaflet
            preferCanvas: true, // Usar Canvas para melhor performance
            pane: 'overlayPane' // Usar pane específico
        });
        
        // Adicionar ao mapa se habilitado
        if (this.options.enabled) {
            this.particlesLayer.addTo(this.map);
        }
    }

    /**
     * Inicializar controles UI
     */
    async _initializeControls() {
        console.log("BGAPP Wind System - Inicializando controles UI");
        
        // Player de animação
        if (this.options.showPlayer && this.timeDimension) {
            this.playerControl = L.control.windPlayer({
                position: 'bottomright',
                timeDimension: this.timeDimension,
                compact: this.options.compactControls,
                showProgress: true,
                showTimeDisplay: true,
                showSpeedControl: true,
            });
            
            if (this.options.showControls) {
                this.playerControl.addTo(this.map);
            }
        }
        
        // Painel de configuração
        if (this.options.showControls) {
            this.configPanel = this._createConfigPanel();
        }
    }

    /**
     * Configurar integrações entre componentes
     */
    async _setupIntegrations() {
        console.log("BGAPP Wind System - Configurando integrações");
        
        // Integrar eventos do mapa
        this.map.on('zoomend moveend', () => {
            this._onMapChange();
        });
        
        // Integrar com sistema de performance
        this._setupPerformanceMonitoring();
        
        // Integrar com sistema de cache
        this._setupCacheManagement();
    }

    /**
     * Pré-carregar dados iniciais
     */
    async _preloadInitialData() {
        console.log("BGAPP Wind System - Pré-carregando dados iniciais");
        
        try {
            const bounds = this._getCurrentBounds();
            const result = await this.dataLoader.preloadData(bounds, 6);
            
            console.log(`BGAPP Wind System - Pré-carregamento concluído: ${result.successful}/${result.total} sucessos`);
            
        } catch (error) {
            console.warn("BGAPP Wind System - Falha no pré-carregamento:", error);
        }
    }

    /**
     * Iniciar sistema de animação
     */
    async start() {
        if (!this.isInitialized) {
            console.warn("BGAPP Wind System - Sistema não inicializado ainda");
            return false;
        }
        
        if (this.isActive) {
            console.log("BGAPP Wind System - Sistema já ativo");
            return true;
        }
        
        console.log("BGAPP Wind System - Iniciando animação de vento");
        
        try {
            // Carregar dados atuais
            await this._loadCurrentData();
            
            // Ativar camada de partículas
            if (!this.map.hasLayer(this.particlesLayer)) {
                this.particlesLayer.addTo(this.map);
            }
            
            this.isActive = true;
            
            console.log("BGAPP Wind System - Animação iniciada com sucesso");
            return true;
            
        } catch (error) {
            console.error("BGAPP Wind System - Erro ao iniciar:", error);
            this._handleError(error);
            return false;
        }
    }

    /**
     * Parar sistema de animação
     */
    stop() {
        if (!this.isActive) {
            console.log("BGAPP Wind System - Sistema já inativo");
            return;
        }
        
        console.log("BGAPP Wind System - Parando animação de vento");
        
        // Parar reprodução temporal
        if (this.timeDimension) {
            this.timeDimension.pause();
        }
        
        // Remover camada de partículas
        if (this.particlesLayer && this.map.hasLayer(this.particlesLayer)) {
            this.map.removeLayer(this.particlesLayer);
        }
        
        this.isActive = false;
        
        console.log("BGAPP Wind System - Animação parada");
    }

    /**
     * Alternar estado do sistema
     */
    toggle() {
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
    }

    /**
     * Carregar dados para tempo atual
     */
    async _loadCurrentData() {
        const currentTime = this.timeDimension ? this.timeDimension.getCurrentTime() : new Date();
        const bounds = this._getCurrentBounds();
        
        console.log("BGAPP Wind System - Carregando dados para:", currentTime);
        
        try {
            const data = await this.dataLoader.loadWindData({
                time: currentTime,
                bounds: bounds,
                source: this.options.dataSource
            });
            
            this.currentData = data;
            
            // Atualizar camada de partículas
            if (this.particlesLayer) {
                this.particlesLayer.setData(data.components);
            }
            
            return data;
            
        } catch (error) {
            console.error("BGAPP Wind System - Erro ao carregar dados:", error);
            throw error;
        }
    }

    /**
     * Obter bounds atuais do mapa
     */
    _getCurrentBounds() {
        const mapBounds = this.map.getBounds();
        return {
            north: mapBounds.getNorth(),
            south: mapBounds.getSouth(),
            west: mapBounds.getWest(),
            east: mapBounds.getEast()
        };
    }

    /**
     * Obter configuração de partículas baseada na performance
     */
    _getParticleConfiguration() {
        const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
        const isLowEnd = navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2;
        
        let config = {
            multiplier: 1 / 300,
            age: 90,
            frameRate: 15
        };
        
        if (this.options.particleCount !== 'auto') {
            switch (this.options.particleCount) {
                case 'low':
                    config.multiplier = 1 / 500;
                    config.frameRate = 10;
                    break;
                case 'medium':
                    config.multiplier = 1 / 350;
                    config.frameRate = 12;
                    break;
                case 'high':
                    config.multiplier = 1 / 200;
                    config.frameRate = 20;
                    break;
            }
        } else {
            // Configuração automática baseada no dispositivo
            if (isMobile || isLowEnd) {
                config.multiplier = 1 / 500;
                config.frameRate = 10;
                config.age = 60;
            }
        }
        
        console.log("BGAPP Wind System - Configuração de partículas:", config);
        return config;
    }

    /**
     * Obter escala de cores
     */
    _getColorScale() {
        const schemes = {
            default: [
                "rgb(36,104,180)",
                "rgb(60,157,194)",
                "rgb(128,205,193)",
                "rgb(151,218,168)",
                "rgb(198,231,181)",
                "rgb(238,247,217)",
                "rgb(255,238,159)",
                "rgb(252,217,125)",
                "rgb(255,182,100)",
                "rgb(252,150,75)",
                "rgb(250,112,52)",
                "rgb(245,64,32)",
                "rgb(237,45,28)",
                "rgb(220,24,32)",
                "rgb(180,0,35)",
            ],
            ocean: [
                "rgb(8,48,107)",
                "rgb(33,113,181)",
                "rgb(66,146,198)",
                "rgb(107,174,214)",
                "rgb(158,202,225)",
                "rgb(198,219,239)",
                "rgb(222,235,247)",
                "rgb(247,251,255)",
                "rgb(255,247,236)",
                "rgb(254,227,145)",
                "rgb(254,196,79)",
                "rgb(254,153,41)",
                "rgb(236,112,20)",
                "rgb(204,76,2)",
                "rgb(140,45,4)",
            ]
        };
        
        return schemes[this.options.colorScheme] || schemes.default;
    }

    /**
     * Criar painel de configuração
     */
    _createConfigPanel() {
        const panel = L.control({ position: 'topright' });
        
        panel.onAdd = (map) => {
            const container = L.DomUtil.create('div', 'bgapp-wind-config-panel');
            container.style.background = 'rgba(0, 0, 0, 0.8)';
            container.style.borderRadius = '8px';
            container.style.padding = '15px';
            container.style.color = '#fff';
            container.style.fontFamily = 'Arial, sans-serif';
            container.style.fontSize = '12px';
            container.style.minWidth = '200px';
            container.style.maxHeight = '400px';
            container.style.overflowY = 'auto';
            
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);
            
            // Header
            const header = L.DomUtil.create('div', 'config-header', container);
            header.innerHTML = '<strong>🌪️ Controle de Vento</strong>';
            header.style.marginBottom = '15px';
            header.style.borderBottom = '1px solid rgba(255,255,255,0.3)';
            header.style.paddingBottom = '8px';
            
            // Toggle principal
            this._createToggleControl('Ativar Animação', this.isActive, (enabled) => {
                if (enabled) {
                    this.start();
                } else {
                    this.stop();
                }
            }, container);
            
            // Controle de opacidade
            this._createSliderControl('Opacidade', this.options.opacity, 0, 1, 0.1, (value) => {
                this.options.opacity = value;
                if (this.particlesLayer) {
                    this.particlesLayer.setOpacity(value);
                }
            }, container);
            
            // Controle de densidade de partículas
            this._createSelectControl('Densidade', this.options.particleCount, [
                { value: 'low', label: 'Baixa' },
                { value: 'medium', label: 'Média' },
                { value: 'high', label: 'Alta' },
                { value: 'auto', label: 'Automática' }
            ], (value) => {
                this.options.particleCount = value;
                this._updateParticleConfiguration();
            }, container);
            
            // Controle de esquema de cores
            this._createSelectControl('Cores', this.options.colorScheme, [
                { value: 'default', label: 'Padrão' },
                { value: 'ocean', label: 'Oceano' }
            ], (value) => {
                this.options.colorScheme = value;
                this._updateColorScheme();
            }, container);
            
            // Informações de performance
            const perfInfo = L.DomUtil.create('div', 'perf-info', container);
            perfInfo.style.marginTop = '15px';
            perfInfo.style.fontSize = '10px';
            perfInfo.style.opacity = '0.7';
            perfInfo.innerHTML = 'Performance: Carregando...';
            
            // Atualizar informações de performance periodicamente
            setInterval(() => {
                const stats = this.dataLoader ? this.dataLoader.getCacheStats() : {};
                perfInfo.innerHTML = `
                    Performance:<br>
                    Cache: ${stats.totalEntries || 0} entradas<br>
                    Memória: ${stats.memoryUsage || 0} MB<br>
                    FPS: ${this.performanceMetrics.fps || 0}
                `;
            }, 5000);
            
            return container;
        };
        
        panel.addTo(this.map);
        return panel;
    }

    /**
     * Criar controle toggle
     */
    _createToggleControl(label, initialValue, onChange, container) {
        const controlDiv = L.DomUtil.create('div', 'control-item', container);
        controlDiv.style.marginBottom = '10px';
        controlDiv.style.display = 'flex';
        controlDiv.style.justifyContent = 'space-between';
        controlDiv.style.alignItems = 'center';
        
        const labelSpan = L.DomUtil.create('span', 'control-label', controlDiv);
        labelSpan.innerHTML = label;
        
        const toggle = L.DomUtil.create('input', 'control-toggle', controlDiv);
        toggle.type = 'checkbox';
        toggle.checked = initialValue;
        toggle.style.cursor = 'pointer';
        
        L.DomEvent.on(toggle, 'change', (e) => {
            onChange(e.target.checked);
        });
        
        return toggle;
    }

    /**
     * Criar controle slider
     */
    _createSliderControl(label, initialValue, min, max, step, onChange, container) {
        const controlDiv = L.DomUtil.create('div', 'control-item', container);
        controlDiv.style.marginBottom = '10px';
        
        const labelDiv = L.DomUtil.create('div', 'control-label', controlDiv);
        labelDiv.innerHTML = label;
        labelDiv.style.marginBottom = '5px';
        
        const sliderContainer = L.DomUtil.create('div', 'slider-container', controlDiv);
        sliderContainer.style.display = 'flex';
        sliderContainer.style.alignItems = 'center';
        sliderContainer.style.gap = '8px';
        
        const slider = L.DomUtil.create('input', 'control-slider', sliderContainer);
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = initialValue;
        slider.style.flex = '1';
        slider.style.cursor = 'pointer';
        
        const valueDisplay = L.DomUtil.create('span', 'value-display', sliderContainer);
        valueDisplay.innerHTML = initialValue;
        valueDisplay.style.minWidth = '30px';
        valueDisplay.style.fontSize = '10px';
        
        L.DomEvent.on(slider, 'input', (e) => {
            const value = parseFloat(e.target.value);
            valueDisplay.innerHTML = value.toFixed(step < 1 ? 1 : 0);
            onChange(value);
        });
        
        return slider;
    }

    /**
     * Criar controle select
     */
    _createSelectControl(label, initialValue, options, onChange, container) {
        const controlDiv = L.DomUtil.create('div', 'control-item', container);
        controlDiv.style.marginBottom = '10px';
        
        const labelDiv = L.DomUtil.create('div', 'control-label', controlDiv);
        labelDiv.innerHTML = label;
        labelDiv.style.marginBottom = '5px';
        
        const select = L.DomUtil.create('select', 'control-select', controlDiv);
        select.style.width = '100%';
        select.style.padding = '4px';
        select.style.borderRadius = '4px';
        select.style.border = '1px solid rgba(255,255,255,0.3)';
        select.style.background = 'rgba(255,255,255,0.1)';
        select.style.color = '#fff';
        select.style.cursor = 'pointer';
        
        options.forEach(option => {
            const optionElement = L.DomUtil.create('option', '', select);
            optionElement.value = option.value;
            optionElement.innerHTML = option.label;
            optionElement.style.background = '#333';
            optionElement.style.color = '#fff';
            
            if (option.value === initialValue) {
                optionElement.selected = true;
            }
        });
        
        L.DomEvent.on(select, 'change', (e) => {
            onChange(e.target.value);
        });
        
        return select;
    }

    /**
     * Atualizar configuração de partículas
     */
    _updateParticleConfiguration() {
        if (!this.particlesLayer) return;
        
        const config = this._getParticleConfiguration();
        this.particlesLayer.setOptions({
            particleMultiplier: config.multiplier,
            particleAge: config.age,
            frameRate: config.frameRate
        });
        
        console.log("BGAPP Wind System - Configuração de partículas atualizada");
    }

    /**
     * Atualizar esquema de cores
     */
    _updateColorScheme() {
        if (!this.particlesLayer) return;
        
        const colorScale = this._getColorScale();
        this.particlesLayer.setOptions({
            colorScale: colorScale
        });
        
        console.log("BGAPP Wind System - Esquema de cores atualizado");
    }

    /**
     * Configurar monitoramento de performance
     */
    _setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = Date.now();
        
        const updateMetrics = () => {
            const now = Date.now();
            const elapsed = now - lastTime;
            
            if (elapsed >= 1000) {
                this.performanceMetrics.fps = Math.round((frameCount * 1000) / elapsed);
                frameCount = 0;
                lastTime = now;
                
                // Verificar problemas de performance
                if (this.performanceMetrics.fps < 10) {
                    this._handlePerformanceIssue('low_fps');
                }
            }
            
            frameCount++;
            requestAnimationFrame(updateMetrics);
        };
        
        updateMetrics();
    }

    /**
     * Configurar gerenciamento de cache
     */
    _setupCacheManagement() {
        // Limpar cache automaticamente quando necessário
        setInterval(() => {
            if (this.dataLoader) {
                const stats = this.dataLoader.getCacheStats();
                if (stats.memoryUsage > 50) { // MB
                    console.log("BGAPP Wind System - Limpando cache por uso excessivo de memória");
                    this.dataLoader.clearCache();
                }
            }
        }, 300000); // 5 minutos
    }

    // ===== EVENT HANDLERS =====

    /**
     * Handler para mudança de tempo
     */
    async _onTimeChange(time, index) {
        console.log("BGAPP Wind System - Mudança de tempo:", time);
        
        try {
            await this._loadCurrentData();
            
            if (this.options.onDataUpdate) {
                this.options.onDataUpdate(this.currentData, time);
            }
            
        } catch (error) {
            console.error("BGAPP Wind System - Erro na mudança de tempo:", error);
        }
    }

    /**
     * Handler para mudança do mapa
     */
    _onMapChange() {
        // Reagir a mudanças de zoom/posição do mapa
        if (this.isActive && this.currentData) {
            // Recarregar dados se necessário
            const bounds = this._getCurrentBounds();
            // Implementar lógica de recarregamento inteligente
        }
    }

    /**
     * Handler para dados carregados
     */
    _onDataLoaded(data, config) {
        console.log("BGAPP Wind System - Dados carregados:", config);
        
        if (this.options.onDataUpdate) {
            this.options.onDataUpdate(data, config.time);
        }
    }

    /**
     * Handler para progresso de carregamento
     */
    _onLoadProgress(progress) {
        console.log(`BGAPP Wind System - Progresso: ${progress.percentage.toFixed(1)}%`);
    }

    /**
     * Handler para erros de dados
     */
    _handleDataError(error, config) {
        console.error("BGAPP Wind System - Erro de dados:", error, config);
        this._handleError(error);
    }

    /**
     * Handler para problemas de performance
     */
    _handlePerformanceIssue(issue) {
        console.warn("BGAPP Wind System - Problema de performance:", issue);
        
        switch (issue) {
            case 'low_fps':
                // Reduzir qualidade automaticamente
                if (this.options.particleCount !== 'low') {
                    console.log("BGAPP Wind System - Reduzindo densidade de partículas por performance");
                    this.options.particleCount = 'low';
                    this._updateParticleConfiguration();
                }
                break;
        }
        
        if (this.options.onPerformanceIssue) {
            this.options.onPerformanceIssue(issue, this.performanceMetrics);
        }
    }

    /**
     * Handler geral de erros
     */
    _handleError(error) {
        console.error("BGAPP Wind System - Erro:", error);
        
        if (this.options.onError) {
            this.options.onError(error);
        }
        
        // Implementar recuperação automática se possível
        if (this.isActive && !this.currentData) {
            console.log("BGAPP Wind System - Tentando recuperação automática");
            setTimeout(() => {
                this._loadCurrentData().catch(e => {
                    console.error("BGAPP Wind System - Falha na recuperação:", e);
                });
            }, 5000);
        }
    }

    // ===== API PÚBLICA =====

    /**
     * Obter status do sistema
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            active: this.isActive,
            currentTime: this.timeDimension ? this.timeDimension.getCurrentTime() : null,
            dataSource: this.options.dataSource,
            performance: this.performanceMetrics,
            cache: this.dataLoader ? this.dataLoader.getCacheStats() : null,
            options: this.options
        };
    }

    /**
     * Atualizar opções
     */
    updateOptions(newOptions) {
        Object.assign(this.options, newOptions);
        
        // Aplicar mudanças relevantes
        if (newOptions.opacity && this.particlesLayer) {
            this.particlesLayer.setOpacity(newOptions.opacity);
        }
        
        if (newOptions.particleCount) {
            this._updateParticleConfiguration();
        }
        
        if (newOptions.colorScheme) {
            this._updateColorScheme();
        }
        
        console.log("BGAPP Wind System - Opções atualizadas:", newOptions);
    }

    /**
     * Recarregar dados
     */
    async reload() {
        console.log("BGAPP Wind System - Recarregando dados");
        
        try {
            if (this.dataLoader) {
                this.dataLoader.clearCache();
            }
            
            await this._loadCurrentData();
            
            console.log("BGAPP Wind System - Dados recarregados com sucesso");
            return true;
            
        } catch (error) {
            console.error("BGAPP Wind System - Erro ao recarregar:", error);
            return false;
        }
    }

    /**
     * Destruir sistema
     */
    destroy() {
        console.log("BGAPP Wind System - Destruindo sistema");
        
        this.stop();
        
        if (this.timeDimension) {
            this.timeDimension.destroy();
        }
        
        if (this.particlesLayer && this.map.hasLayer(this.particlesLayer)) {
            this.map.removeLayer(this.particlesLayer);
        }
        
        if (this.playerControl && this.map.hasLayer(this.playerControl)) {
            this.map.removeControl(this.playerControl);
        }
        
        if (this.configPanel && this.map.hasLayer(this.configPanel)) {
            this.map.removeControl(this.configPanel);
        }
        
        if (this.dataLoader) {
            this.dataLoader.clearCache();
        }
        
        // Limpar referências
        this.dataLoader = null;
        this.timeDimension = null;
        this.particlesLayer = null;
        this.playerControl = null;
        this.configPanel = null;
        this.currentData = null;
        
        console.log("BGAPP Wind System - Sistema destruído");
    }
}

// Exportar classe principal
window.BGAPPWindSystem = BGAPPWindSystem;

console.log("BGAPP Wind Integration System - Carregado com sucesso! 🌪️⚡");
