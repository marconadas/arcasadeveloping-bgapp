/**
 * EOX Maps Integration for BGAPP
 * Sistema de camadas de fundo inspirado no EOX::Maps
 * Integração de Sentinel-2 cloudless, terreno, e outras camadas base
 */

class EOXLayersManager {
    constructor() {
        this.currentBackgroundLayer = null;
        this.currentOverlayLayer = null;
        this.backgroundLayers = {};
        this.overlayLayers = {};
        this.attribution = '© EOX IT Services GmbH, OpenStreetMap contributors';
        this.failedLayers = new Set(); // Track de layers que falharam
        this.fallbackActivated = false; // Flag para evitar múltiplos fallbacks
        
        this.initializeLayers();
    }

    /**
     * Cria layer com fallback automático para lidar com erros WMS
     */
    createLayerWithFallback(primaryUrl, fallbackUrl, options = {}) {
        const layerId = 'layer_' + Math.random().toString(36).substr(2, 9);
        
        // Criar layer primário
        const primaryLayer = L.tileLayer(primaryUrl, {
            ...options,
            errorTileUrl: options.errorTileUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        });

        // Configurar fallback automático
        primaryLayer.on('tileerror', (e) => {
            if (!this.failedLayers.has(layerId)) {
                console.warn(`🔄 EOX WMS falhou, ativando fallback para: ${fallbackUrl}`);
                this.failedLayers.add(layerId);
                
                // Criar layer de fallback
                const fallbackLayer = L.tileLayer(fallbackUrl, {
                    ...options,
                    attribution: (options.attribution || '') + ' (Fallback: OpenStreetMap contributors)'
                });
                
                // Substituir layer no mapa se estiver ativo
                if (e.target._map) {
                    e.target._map.removeLayer(e.target);
                    fallbackLayer.addTo(e.target._map);
                    
                    // Atualizar referência se for layer atual
                    if (this.currentBackgroundLayer === e.target) {
                        this.currentBackgroundLayer = fallbackLayer;
                    }
                }
            }
        });

        // Log detalhado para debug
        primaryLayer.on('tileload', () => {
            console.log(`✅ Tile EOX carregada com sucesso: ${primaryUrl.substring(0, 50)}...`);
        });

        primaryLayer.on('tileloadstart', () => {
            console.log(`🔄 Iniciando carregamento tile EOX: ${primaryUrl.substring(0, 50)}...`);
        });

        return primaryLayer;
    }

    /**
     * Cria layer WMS com fallback específico para serviços WMS
     */
    createWMSLayerWithFallback(wmsUrl, wmsOptions, fallbackUrl, fallbackOptions = {}) {
        const layerId = 'wms_' + Math.random().toString(36).substr(2, 9);
        let errorCount = 0;
        const maxErrors = 3; // Máximo de erros antes de ativar fallback
        
        console.log(`🔧 Criando layer WMS: ${wmsOptions.layers} com fallback para ${fallbackUrl}`);
        
        try {
            // Criar layer WMS primário com configurações otimizadas para EOX
            const wmsLayer = L.tileLayer.wms(wmsUrl, {
                ...wmsOptions,
                // Configurações específicas para resolver erro 400 Bad Request
                version: wmsOptions.version || '1.3.0', // Versão WMS padrão EOX
                format: wmsOptions.format || 'image/png', // Formato padrão
                transparent: wmsOptions.transparent !== false, // Default true
                crs: L.CRS.EPSG3857, // Sistema de coordenadas
                // Rate limiting - configurações para reduzir carga no servidor EOX
                maxNativeZoom: wmsOptions.maxZoom || 16,
                updateWhenZooming: false, // Reduzir requests durante zoom
                keepBuffer: 1, // Buffer reduzido para menos requests
                // Error handling
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                attribution: fallbackOptions.attribution || this.attribution,
                // Timeout para requests individuais
                timeout: 10000 // 10 segundos timeout
            });

            // Configurar fallback específico para WMS com detecção de rate limiting
            wmsLayer.on('tileerror', (e) => {
                errorCount++;
                const tile = e.tile;
                const url = tile.src || 'unknown';
                
                // Detectar tipo de erro baseado na URL de resposta ou status
                let errorType = 'unknown';
                let shouldFallbackImmediately = false;
                
                if (url.includes('400') || e.error?.status === 400) {
                    errorType = '400 Bad Request';
                    shouldFallbackImmediately = true; // 400 indica problema de configuração
                } else if (url.includes('429') || e.error?.status === 429) {
                    errorType = '429 Rate Limited';
                    shouldFallbackImmediately = true; // Rate limiting
                } else if (url.includes('503') || e.error?.status === 503) {
                    errorType = '503 Service Unavailable';
                    shouldFallbackImmediately = true; // Serviço sobrecarregado
                } else if (url.includes('tiles.maps.eox.at')) {
                    errorType = 'EOX Service Error';
                }
                
                console.warn(`⚠️ WMS Error ${errorCount}/${maxErrors} [${errorType}] para ${wmsOptions.layers}:`, {
                    url: url.substring(0, 100) + '...',
                    error: e.error
                });
                
                // Ativar fallback imediatamente para erros críticos ou após múltiplos erros
                // Só ativar fallback se tiver uma URL de fallback definida
                if (fallbackUrl && (shouldFallbackImmediately || errorCount >= maxErrors) && !this.failedLayers.has(layerId)) {
                    console.error(`❌ WMS ${wmsOptions.layers} - ${errorType} - Ativando fallback para: ${fallbackUrl}`);
                    this.failedLayers.add(layerId);
                    
                    // Criar layer de fallback
                    const fallbackLayer = L.tileLayer(fallbackUrl, {
                        ...fallbackOptions,
                        attribution: (fallbackOptions.attribution || '') + ` (Fallback: ${errorType})`
                    });
                    
                    // Substituir layer no mapa se estiver ativo
                    if (e.target._map) {
                        console.log(`🔄 Substituindo layer WMS por fallback no mapa`);
                        e.target._map.removeLayer(e.target);
                        fallbackLayer.addTo(e.target._map);
                        
                        // Atualizar referência se for layer atual
                        if (this.currentBackgroundLayer === e.target) {
                            this.currentBackgroundLayer = fallbackLayer;
                            console.log(`✅ Referência de background layer atualizada para fallback`);
                        }
                        
                        // Mostrar notificação específica do erro
                        this.showEOXErrorNotification(wmsOptions.layers, errorType);
                    }
                } else if (!fallbackUrl && shouldFallbackImmediately) {
                    // Para overlays sem fallback, apenas remover o layer com erro
                    console.warn(`⚠️ WMS ${wmsOptions.layers} - ${errorType} - Removendo layer (sem fallback)`);
                    if (e.target._map) {
                        e.target._map.removeLayer(e.target);
                    }
                }
            });

            // Log detalhado para debug WMS
            wmsLayer.on('tileload', () => {
                console.log(`✅ WMS tile carregada: ${wmsOptions.layers}`);
            });

            wmsLayer.on('tileloadstart', () => {
                console.log(`🔄 Carregando WMS tile: ${wmsOptions.layers}`);
            });

            // Timeout para ativar fallback se WMS não responder
            setTimeout(() => {
                if (errorCount >= 2 && !this.failedLayers.has(layerId)) {
                    console.warn(`⏰ Timeout WMS ${wmsOptions.layers}, ${fallbackUrl ? 'forçando fallback' : 'removendo layer'}`);
                    this.failedLayers.add(layerId);
                    
                    // Se o layer ainda estiver no mapa, substituir ou remover
                    if (wmsLayer._map) {
                        if (fallbackUrl) {
                            const fallbackLayer = L.tileLayer(fallbackUrl, {
                                ...fallbackOptions,
                                attribution: (fallbackOptions.attribution || '') + ' (Fallback: Timeout)'
                            });
                            
                            wmsLayer._map.removeLayer(wmsLayer);
                            fallbackLayer.addTo(wmsLayer._map);
                            
                            if (this.currentBackgroundLayer === wmsLayer) {
                                this.currentBackgroundLayer = fallbackLayer;
                            }
                        } else {
                            // Para overlays sem fallback, apenas remover
                            wmsLayer._map.removeLayer(wmsLayer);
                        }
                    }
                }
            }, 5000); // 5 segundos timeout

            // Aplicar opacidade se especificada nas opções de fallback
            if (fallbackOptions.opacity !== undefined) {
                wmsLayer.setOpacity(fallbackOptions.opacity);
                console.log(`🎨 Opacidade aplicada ao layer WMS ${wmsOptions.layers}: ${fallbackOptions.opacity}`);
            }

            return wmsLayer;

        } catch (error) {
            console.error(`❌ Erro ao criar layer WMS ${wmsOptions.layers}:`, error);
            
            // Retorna fallback imediatamente em caso de erro na criação
            if (fallbackUrl) {
                return L.tileLayer(fallbackUrl, {
                    ...fallbackOptions,
                    attribution: (fallbackOptions.attribution || '') + ' (WMS Creation Error)'
                });
            } else {
                // Para overlays sem fallback, retornar layer vazio
                return L.tileLayer('', { opacity: 0 });
            }
        }
    }

    /**
     * Inicializa todas as camadas disponíveis
     */
    initializeLayers() {
        // === BACKGROUND LAYERS ===
        
        // Terrain Light - Usando camada correta para EPSG:3857
        this.backgroundLayers['terrain-light'] = this.createWMSLayerWithFallback(
            'https://tiles.maps.eox.at/wms',
            {
                layers: 'terrain-light_3857', // Nome correto verificado no GetCapabilities
                format: 'image/jpeg',
                transparent: false,
                version: '1.3.0',
                crs: L.CRS.EPSG3857
            },
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: this.attribution + ', Terrain Data © OpenStreetMap contributors',
                maxZoom: 16
            }
        );

        // Sentinel-2 Cloudless 2024 - Nome correto verificado
        this.backgroundLayers['sentinel2-2024'] = this.createWMSLayerWithFallback(
            'https://tiles.maps.eox.at/wms',
            {
                layers: 's2cloudless-2024_3857', // Nome correto verificado no GetCapabilities
                format: 'image/jpeg',
                transparent: false,
                version: '1.3.0',
                crs: L.CRS.EPSG3857
            },
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: this.attribution + ', Sentinel-2 © European Union, Copernicus',
                maxZoom: 14
            }
        );

        // Sentinel-2 Cloudless 2023 - Nome correto verificado
        this.backgroundLayers['sentinel2-2023'] = this.createWMSLayerWithFallback(
            'https://tiles.maps.eox.at/wms',
            {
                layers: 's2cloudless-2023_3857', // Nome correto verificado no GetCapabilities
                format: 'image/jpeg',
                transparent: false,
                version: '1.3.0',
                crs: L.CRS.EPSG3857
            },
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: this.attribution + ', Sentinel-2 © European Union, Copernicus',
                maxZoom: 14
            }
        );

        // OpenStreetMap
        this.backgroundLayers['osm'] = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });

        // CartoDB Positron (alternativa clara)
        this.backgroundLayers['cartodb-positron'] = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CartoDB',
            maxZoom: 19,
            subdomains: 'abcd'
        });

        // CartoDB Dark Matter (alternativa escura)
        this.backgroundLayers['cartodb-dark'] = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CartoDB',
            maxZoom: 19,
            subdomains: 'abcd'
        });

        // Stamen Terrain (alternativa de terreno)
        this.backgroundLayers['stamen-terrain'] = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
            maxZoom: 18,
            subdomains: 'abcd'
        });

        // ESRI World Imagery (alternativa de satélite)
        this.backgroundLayers['esri-satellite'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 18
        });

        // Blue Marble - NASA (nome correto verificado)
        this.backgroundLayers['blue-marble'] = this.createWMSLayerWithFallback(
            'https://tiles.maps.eox.at/wms',
            {
                layers: 'bluemarble_3857', // Nome correto verificado no GetCapabilities
                format: 'image/jpeg',
                transparent: false,
                version: '1.3.0',
                crs: L.CRS.EPSG3857
            },
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: this.attribution + ', Blue Marble © NASA',
                maxZoom: 8
            }
        );

        // Black Marble - NASA (nome correto verificado)
        this.backgroundLayers['black-marble'] = this.createWMSLayerWithFallback(
            'https://tiles.maps.eox.at/wms',
            {
                layers: 'blackmarble_3857', // Nome correto verificado no GetCapabilities
                format: 'image/jpeg',
                transparent: false,
                version: '1.3.0',
                crs: L.CRS.EPSG3857
            },
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: this.attribution + ', Black Marble © NASA Earth Observatory',
                maxZoom: 8
            }
        );

        // Terrain com dados de elevação (nome correto verificado)
        this.backgroundLayers['terrain'] = this.createWMSLayerWithFallback(
            'https://tiles.maps.eox.at/wms',
            {
                layers: 'terrain_3857', // Nome correto verificado no GetCapabilities
                format: 'image/jpeg',
                transparent: false,
                version: '1.3.0',
                crs: L.CRS.EPSG3857
            },
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: this.attribution + ', SRTM © NASA, EUDEM © European Union',
                maxZoom: 16
            }
        );

        // Batimetria usando terrain_3857 (que inclui dados GEBCO)
        this.backgroundLayers['bathymetry'] = this.createWMSLayerWithFallback(
            'https://tiles.maps.eox.at/wms',
            {
                layers: 'terrain_3857', // Nome correto - inclui dados GEBCO
                format: 'image/jpeg',
                transparent: false,
                version: '1.3.0',
                crs: L.CRS.EPSG3857
            },
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: this.attribution + ', Bathymetry © GEBCO via EOX Terrain',
                maxZoom: 12
            }
        );

        // === OVERLAY LAYERS ===
        
        // Overlay escuro para terrenos claros (usando camada correta para EPSG:3857)
        this.overlayLayers['overlay-dark'] = this.createWMSLayerWithFallback(
            'https://tiles.maps.eox.at/wms',
            {
                layers: 'overlay_3857', // Camada específica para EPSG:3857
                format: 'image/png',
                transparent: true,
                version: '1.3.0',
                crs: L.CRS.EPSG3857
            },
            null, // Overlay não precisa de fallback
            {
                attribution: this.attribution,
                maxZoom: 16,
                opacity: 0.8 // Opacidade aplicada corretamente no layer
            }
        );

        // Coastline overlay - Muito útil para áreas costeiras como Angola
        this.overlayLayers['coastline'] = this.createWMSLayerWithFallback(
            'https://tiles.maps.eox.at/wms',
            {
                layers: 'coastline_3857', // Linha de costa específica para EPSG:3857
                format: 'image/png',
                transparent: true,
                version: '1.3.0',
                crs: L.CRS.EPSG3857
            },
            null, // Overlay não precisa de fallback
            {
                attribution: this.attribution,
                maxZoom: 19, // Coastline pode ter mais zoom
                opacity: 0.9 // Mais visível para coastline
            }
        );

        // Overlay claro para fundos escuros (usando camada correta para EPSG:3857)
        this.overlayLayers['overlay-light'] = this.createWMSLayerWithFallback(
            'https://tiles.maps.eox.at/wms',
            {
                layers: 'overlay_bright_3857', // Camada específica para EPSG:3857
                format: 'image/png',
                transparent: true,
                version: '1.3.0',
                crs: L.CRS.EPSG3857
            },
            null, // Overlay não precisa de fallback
            {
                attribution: this.attribution,
                maxZoom: 16,
                opacity: 0.9 // Opacidade aplicada corretamente no layer
            }
        );

        console.log('✅ EOX Layers inicializadas:', Object.keys(this.backgroundLayers).length, 'backgrounds,', Object.keys(this.overlayLayers).length, 'overlays');
    }

    /**
     * Aplica uma camada de fundo ao mapa
     */
    setBackgroundLayer(map, layerKey) {
        // Remove camada atual se existir
        if (this.currentBackgroundLayer) {
            map.removeLayer(this.currentBackgroundLayer);
        }

        // Adiciona nova camada
        if (this.backgroundLayers[layerKey]) {
            this.currentBackgroundLayer = this.backgroundLayers[layerKey];
            this.currentBackgroundLayer.addTo(map);
            
            // Auto-seleciona overlay adequado
            this.autoSelectOverlay(map, layerKey);
            
            console.log(`✅ Background layer alterada para: ${layerKey}`);
            return true;
        } else {
            console.warn(`❌ Background layer não encontrada: ${layerKey}`);
            return false;
        }
    }

    /**
     * Seleciona automaticamente o overlay adequado baseado no background
     */
    autoSelectOverlay(map, backgroundKey) {
        // Remove overlay atual
        if (this.currentOverlayLayer) {
            map.removeLayer(this.currentOverlayLayer);
            this.currentOverlayLayer = null;
        }

        // Seleciona overlay baseado no background
        let overlayKey = null;
        
        if (['blue-marble', 'black-marble', 'bathymetry'].includes(backgroundKey)) {
            overlayKey = 'overlay-light'; // Overlay claro para fundos escuros
        } else if (['terrain-light', 'sentinel2-2024', 'sentinel2-2023', 'osm', 'terrain'].includes(backgroundKey)) {
            overlayKey = 'overlay-dark'; // Overlay escuro para fundos claros
        }

        if (overlayKey && this.overlayLayers[overlayKey]) {
            this.currentOverlayLayer = this.overlayLayers[overlayKey];
            this.currentOverlayLayer.addTo(map);
            console.log(`✅ Auto-overlay aplicado: ${overlayKey}`);
        }
    }

    /**
     * Cria controle de camadas EOX personalizado
     */
    createLayerControl(map) {
        const control = L.control({ position: 'topright' });
        
        control.onAdd = function() {
            const div = L.DomUtil.create('div', 'eox-layer-control');
            div.innerHTML = `
                <div class="eox-control-header">
                    <h4>🌍 EOX Layers</h4>
                    <button class="eox-toggle-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
                </div>
                <div class="eox-control-content">
                    <div class="eox-section">
                        <h5>Background Layers</h5>
                        <div class="eox-layer-grid">
                            ${Object.keys(this.backgroundLayers).map(key => `
                                <button class="eox-layer-btn" data-layer="${key}" data-type="background">
                                    ${this.getLayerDisplayName(key)}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="eox-section">
                        <h5>Overlays</h5>
                        <div class="eox-overlay-controls">
                            <button class="eox-overlay-btn" data-overlay="overlay-dark">Overlay Escuro</button>
                            <button class="eox-overlay-btn" data-overlay="overlay-light">Overlay Claro</button>
                            <button class="eox-overlay-btn" data-overlay="coastline">🏖️ Coastline</button>
                            <button class="eox-overlay-btn" data-overlay="none">Sem Overlay</button>
                        </div>
                        <div style="margin-top: 8px; font-size: 10px;">
                            <label>Opacidade: <span id="overlay-opacity-value">80%</span></label>
                            <input type="range" id="overlay-opacity-slider" min="0" max="100" value="80" 
                                   style="width: 100%; margin-top: 4px;">
                        </div>
                    </div>
                </div>
            `;
            
            // Previne propagação de eventos do mapa
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            
            return div;
        }.bind(this);
        
        control.addTo(map);
        
        // Adiciona event listeners
        this.setupControlEvents(map);
        
        return control;
    }

    /**
     * Configura eventos do controle de camadas
     */
    setupControlEvents(map) {
        // Background layer buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('eox-layer-btn')) {
                const layerKey = e.target.dataset.layer;
                this.setBackgroundLayer(map, layerKey);
                
                // Atualiza visual dos botões
                document.querySelectorAll('.eox-layer-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });

        // Overlay buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('eox-overlay-btn')) {
                const overlayKey = e.target.dataset.overlay;
                
                if (overlayKey === 'none') {
                    this.removeOverlay(map);
                } else {
                    this.setOverlayLayer(map, overlayKey);
                }
                
                // Atualiza visual dos botões
                document.querySelectorAll('.eox-overlay-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });

        // Controle de opacidade do overlay
        document.addEventListener('input', (e) => {
            if (e.target.id === 'overlay-opacity-slider') {
                const opacity = e.target.value / 100;
                const valueSpan = document.getElementById('overlay-opacity-value');
                if (valueSpan) {
                    valueSpan.textContent = `${e.target.value}%`;
                }
                
                // Aplicar opacidade ao overlay atual
                if (this.currentOverlayLayer && map.hasLayer(this.currentOverlayLayer)) {
                    this.currentOverlayLayer.setOpacity(opacity);
                    console.log(`🎨 Opacidade do overlay alterada para ${e.target.value}%`);
                }
            }
        });
    }

    /**
     * Define camada de overlay manualmente
     */
    setOverlayLayer(map, overlayKey) {
        if (this.currentOverlayLayer) {
            map.removeLayer(this.currentOverlayLayer);
        }

        if (this.overlayLayers[overlayKey]) {
            this.currentOverlayLayer = this.overlayLayers[overlayKey];
            this.currentOverlayLayer.addTo(map);
            
            // Aplicar opacidade do slider se existir
            const opacitySlider = document.getElementById('overlay-opacity-slider');
            if (opacitySlider) {
                const opacity = opacitySlider.value / 100;
                this.currentOverlayLayer.setOpacity(opacity);
                console.log(`✅ Overlay aplicado: ${overlayKey} com opacidade ${opacitySlider.value}%`);
            } else {
                console.log(`✅ Overlay manual aplicado: ${overlayKey}`);
            }
        }
    }

    /**
     * Remove overlay atual
     */
    removeOverlay(map) {
        if (this.currentOverlayLayer) {
            map.removeLayer(this.currentOverlayLayer);
            this.currentOverlayLayer = null;
            console.log('✅ Overlay removido');
        }
    }

    /**
     * Retorna nome de exibição da camada
     */
    getLayerDisplayName(key) {
        const names = {
            'terrain-light': '🏔️ Terrain Light',
            'sentinel2-2024': '🛰️ Sentinel-2 2024',
            'sentinel2-2023': '🛰️ Sentinel-2 2023',
            'osm': '🗺️ OpenStreetMap',
            'cartodb-positron': '🌐 CartoDB Light',
            'cartodb-dark': '🌑 CartoDB Dark',
            'stamen-terrain': '⛰️ Stamen Terrain',
            'esri-satellite': '🛰️ ESRI Satellite',
            'blue-marble': '🌍 Blue Marble',
            'black-marble': '🌌 Black Marble',
            'terrain': '⛰️ Terrain',
            'bathymetry': '🌊 Bathymetry'
        };
        return names[key] || key;
    }

    /**
     * Inicializa com camada padrão
     */
    initializeDefault(map, defaultLayer = 'terrain-light') {
        console.log(`🔧 Inicializando layer padrão: ${defaultLayer}`);
        
        // Tentar layer padrão primeiro
        const success = this.setBackgroundLayer(map, defaultLayer);
        
        if (!success) {
            console.warn(`❌ Layer ${defaultLayer} não encontrado, usando OSM`);
            this.setBackgroundLayer(map, 'osm');
            defaultLayer = 'osm';
        }
        
        // Configurar fallback automático para layers WMS que podem falhar
        const wmsLayers = ['terrain-light', 'sentinel2-2024', 'sentinel2-2023', 'blue-marble', 'black-marble', 'bathymetry', 'terrain'];
        
        if (wmsLayers.includes(defaultLayer)) {
            // Configurar detecção de erro mais robusta
            this.setupLayerErrorDetection(map, defaultLayer);
            
            // Verificar carregamento após timeout
            setTimeout(() => {
                this.checkLayerLoading(map, defaultLayer);
            }, 4000); // Aguardar 4 segundos para tiles carregarem
        }
        
        // Marca botão como ativo
        setTimeout(() => {
            const btn = document.querySelector(`[data-layer="${defaultLayer}"]`);
            if (btn) btn.classList.add('active');
        }, 100);
        
        return success;
    }

    /**
     * Configura detecção de erro para layers WMS
     */
    setupLayerErrorDetection(map, layerKey) {
        if (this.currentBackgroundLayer && this.currentBackgroundLayer.on) {
            this.currentBackgroundLayer.on('tileerror', (e) => {
                console.warn(`⚠️ Erro no tile do layer ${layerKey}:`, e);
                this.failedLayers.add(layerKey);
                
                // Se muitos erros, ativar fallback
                if (!this.fallbackActivated) {
                    this.activateFallback(map);
                }
            });

            this.currentBackgroundLayer.on('tileload', (e) => {
                console.log(`✅ Tile carregado com sucesso para ${layerKey}`);
            });
        }
    }

    /**
     * Verifica se o layer foi carregado corretamente
     */
    checkLayerLoading(map, layerKey) {
        const mapContainer = map.getContainer();
        const tiles = mapContainer.querySelectorAll('.leaflet-tile');
        const visibleTiles = Array.from(tiles).filter(tile => 
            tile.style.opacity !== '0' && 
            !tile.src.includes('data:image') &&
            !tile.src.includes('blank.png') &&
            tile.complete &&
            tile.naturalWidth > 0
        );
        
        // Verificar também se há tiles sendo carregados
        const loadingTiles = Array.from(tiles).filter(tile => !tile.complete);
        
        console.log(`🔍 Verificando ${layerKey}: ${visibleTiles.length} visíveis, ${loadingTiles.length} carregando, ${this.failedLayers.has(layerKey) ? 'COM ERROS' : 'sem erros'}`);
        
        // Condições mais rigorosas para ativar fallback
        if (visibleTiles.length === 0 && loadingTiles.length === 0) {
            console.warn(`🔄 ${layerKey}: Nenhum tile visível ou carregando - ATIVANDO FALLBACK`);
            this.activateFallback(map);
        } else if (this.failedLayers.has(layerKey) && visibleTiles.length < 2) {
            console.warn(`🔄 ${layerKey}: Muitos erros detectados - ATIVANDO FALLBACK`);
            this.activateFallback(map);
        } else if (visibleTiles.length > 0) {
            console.log(`✅ ${layerKey}: ${visibleTiles.length} tiles carregados com sucesso`);
        } else if (loadingTiles.length > 0) {
            console.log(`⏳ ${layerKey}: ${loadingTiles.length} tiles ainda carregando...`);
            // Dar mais tempo para carregar
            setTimeout(() => this.checkLayerLoading(map, layerKey), 2000);
        }
    }

    /**
     * Ativa fallback para OpenStreetMap
     */
    activateFallback(map) {
        if (this.fallbackActivated) return;
        
        this.fallbackActivated = true;
        console.log('🚨 Ativando fallback para OpenStreetMap');
        
        this.setBackgroundLayer(map, 'osm');
        
        // Atualizar botão ativo
        document.querySelectorAll('.eox-layer-btn').forEach(btn => btn.classList.remove('active'));
        const osmBtn = document.querySelector('[data-layer="osm"]');
        if (osmBtn) {
            osmBtn.classList.add('active');
            osmBtn.style.backgroundColor = '#28a745'; // Verde para indicar fallback ativo
        }
        
        // Mostrar notificação se disponível
        if (typeof showNotification === 'function') {
            showNotification('Usando OpenStreetMap devido a problemas com outros layers', 'warning');
        }
    }

    /**
     * Adiciona suporte a projeções customizadas
     */
    addCustomProjection(name, crs, tileLayer) {
        this.backgroundLayers[name] = tileLayer;
        console.log(`✅ Projeção customizada adicionada: ${name}`);
    }

    /**
     * Configura rate limiting para evitar sobrecarga
     */
    setupRateLimiting() {
        const originalFetch = window.fetch;
        const requestQueue = [];
        const maxConcurrent = 6;
        let activeRequests = 0;

        window.fetch = function(...args) {
            return new Promise((resolve, reject) => {
                const executeRequest = () => {
                    activeRequests++;
                    originalFetch.apply(this, args)
                        .then(resolve)
                        .catch(reject)
                        .finally(() => {
                            activeRequests--;
                            if (requestQueue.length > 0) {
                                const nextRequest = requestQueue.shift();
                                nextRequest();
                            }
                        });
                };

                if (activeRequests < maxConcurrent) {
                    executeRequest();
                } else {
                    requestQueue.push(executeRequest);
                }
            });
        };

        console.log('✅ Rate limiting configurado (max:', maxConcurrent, 'concurrent)');
    }

    /**
     * Exporta configuração atual das camadas
     */
    exportConfiguration() {
        return {
            backgroundLayer: this.currentBackgroundLayer ? this.getCurrentLayerKey('background') : null,
            overlayLayer: this.currentOverlayLayer ? this.getCurrentLayerKey('overlay') : null,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Importa configuração de camadas
     */
    importConfiguration(map, config) {
        if (config.backgroundLayer) {
            this.setBackgroundLayer(map, config.backgroundLayer);
        }
        if (config.overlayLayer) {
            this.setOverlayLayer(map, config.overlayLayer);
        }
        console.log('✅ Configuração importada:', config);
    }

    /**
     * Obtém chave da camada atual
     */
    getCurrentLayerKey(type) {
        const layers = type === 'background' ? this.backgroundLayers : this.overlayLayers;
        const currentLayer = type === 'background' ? this.currentBackgroundLayer : this.currentOverlayLayer;
        
        for (const [key, layer] of Object.entries(layers)) {
            if (layer === currentLayer) return key;
        }
        return null;
    }
}

// Estilos CSS para o controle
const eoxStyleSheet = `
<style id="eox-layers-styles">
.eox-layer-control {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 0;
    min-width: 280px;
    backdrop-filter: blur(10px);
    font-family: 'Segoe UI', system-ui, sans-serif;
    transition: all 0.3s ease;
}

.eox-layer-control.collapsed .eox-control-content {
    display: none;
}

.eox-control-header {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 8px 8px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.eox-control-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
}

.eox-toggle-btn {
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 3px;
    transition: background 0.2s;
}

.eox-toggle-btn:hover {
    background: rgba(255,255,255,0.2);
}

.eox-control-content {
    padding: 16px;
}

.eox-section {
    margin-bottom: 16px;
}

.eox-section:last-child {
    margin-bottom: 0;
}

.eox-section h5 {
    margin: 0 0 8px 0;
    font-size: 12px;
    font-weight: 600;
    color: #34495e;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.eox-layer-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
}

.eox-layer-btn, .eox-overlay-btn {
    padding: 8px 12px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background: white;
    color: #495057;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
}

.eox-layer-btn:hover, .eox-overlay-btn:hover {
    border-color: #1e3c72;
    background: #f8f9fa;
    transform: translateY(-1px);
}

.eox-layer-btn.active, .eox-overlay-btn.active {
    background: #1e3c72;
    color: white;
    border-color: #1e3c72;
}

.eox-overlay-controls {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.eox-overlay-btn {
    font-size: 10px;
}

@media (max-width: 768px) {
    .eox-layer-control {
        min-width: 240px;
    }
    
    .eox-layer-grid {
        grid-template-columns: 1fr;
    }
    
    .eox-control-header h4 {
        font-size: 12px;
    }
}
</style>
`;

// Injeta estilos no documento
if (!document.getElementById('eox-layers-styles')) {
    document.head.insertAdjacentHTML('beforeend', eoxStyleSheet);
}

// Exporta para uso global
window.EOXLayersManager = EOXLayersManager;

console.log('✅ EOX Layers Manager carregado e pronto para uso');

// Adicionar método de notificação de erro EOX ao prototype
EOXLayersManager.prototype.showEOXErrorNotification = function(layerName, errorType) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, rgba(255, 149, 0, 0.95), rgba(255, 59, 48, 0.95));
        color: white;
        padding: 14px 18px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        z-index: 1500;
        max-width: 320px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        border-left: 4px solid rgba(255, 255, 255, 0.4);
        backdrop-filter: blur(10px);
    `;
    
    // Mensagens específicas por tipo de erro
    const errorMessages = {
        '400 Bad Request': {
            title: '🚫 Configuração WMS Inválida',
            message: 'Parâmetros da requisição rejeitados pelo servidor'
        },
        '429 Rate Limited': {
            title: '⏰ Rate Limiting EOX',
            message: 'Muitas requisições - servidor limitando acesso'
        },
        '503 Service Unavailable': {
            title: '🔧 EOX Sobrecarregado', 
            message: 'Serviço temporariamente indisponível'
        },
        'EOX Service Error': {
            title: '⚠️ Erro EOX Maps',
            message: 'Falha no serviço de mapas'
        }
    };
    
    const error = errorMessages[errorType] || {
        title: '❌ Erro Desconhecido',
        message: 'Problema não identificado'
    };
    
    notification.innerHTML = `
        <div style="margin-bottom: 6px; font-size: 14px;">
            ${error.title}
        </div>
        <div style="font-size: 12px; line-height: 1.3; margin-bottom: 8px; opacity: 0.95;">
            <strong>${layerName}</strong>: ${error.message}
        </div>
        <div style="font-size: 11px; opacity: 0.8; padding: 4px 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            ✅ Usando OpenStreetMap como alternativa
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-fechar após 6 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 6000);
    
    // Permitir fechar clicando
    notification.addEventListener('click', () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    notification.style.cursor = 'pointer';
};
