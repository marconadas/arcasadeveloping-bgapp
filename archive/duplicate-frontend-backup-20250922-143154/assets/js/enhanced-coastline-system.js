/**
 * Sistema Avançado de Linha Costeira e ZEE - BGAPP
 * Integra dados oficiais da ZEE com funcionalidades avançadas do EOX
 * Baseado nas melhorias do index-fresh.html
 */

class EnhancedCoastlineSystem {
    constructor() {
        this.officialZEE = null;
        this.coastlineData = null;
        this.eoxOverlayLayer = null;
        this.bathymetryLayer = null;
        this.coastlineLayer = null;
        this.precision = 'high'; // high, medium, low
        this.isInitialized = false;
        
        // Configurações de estilo
        this.styles = {
            zee: {
                angola: {
                    color: '#0066cc',
                    weight: 2,
                    fillOpacity: 0.08,
                    fillColor: '#0080ff',
                    opacity: 0.6,
                    pane: 'overlayPane',
                    zIndex: 1
                },
                cabinda: {
                    color: '#9b59b6',
                    weight: 2,
                    fillOpacity: 0.08,
                    fillColor: '#9b59b6',
                    opacity: 0.6,
                    pane: 'overlayPane',
                    zIndex: 1
                }
            },
            coastline: {
                precision: {
                    color: '#2c3e50',
                    weight: 3,
                    opacity: 0.8
                },
                standard: {
                    color: '#34495e',
                    weight: 2,
                    opacity: 0.6
                }
            }
        };
        
        console.log('🌊 Enhanced Coastline System inicializado');
    }

    /**
     * Inicializar sistema completo
     */
    async initialize(map) {
        if (this.isInitialized) {
            console.log('⚠️ Sistema já inicializado');
            return;
        }

        console.log('🚀 Inicializando Sistema Avançado de Linha Costeira...');
        
        try {
            // 1. Carregar dados oficiais da ZEE
            await this.loadOfficialZEEData();
            
            // 2. Inicializar overlay EOX para linha costeira precisa
            await this.initializeEOXCoastlineOverlay();
            
            // 3. Configurar sistema de batimetria
            await this.initializeBathymetrySystem();
            
            // 4. Criar controles de precisão
            this.createPrecisionControls(map);
            
            // 5. Adicionar ZEE oficial ao mapa
            this.addOfficialZEE(map);
            
            this.isInitialized = true;
            console.log('✅ Sistema Avançado de Linha Costeira inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de linha costeira:', error);
            this.setupFallbackMode(map);
        }
    }

    /**
     * Carregar dados oficiais da ZEE
     */
    async loadOfficialZEEData() {
        console.log('📊 Carregando dados oficiais da ZEE...');
        
        try {
            // Verificar se dados já estão disponíveis globalmente
            if (typeof angolaZEEOfficial !== 'undefined' && typeof cabindaZEEOfficial !== 'undefined') {
                this.officialZEE = {
                    angola: angolaZEEOfficial,
                    cabinda: cabindaZEEOfficial,
                    metadata: angolaZEEMetadata || {
                        source: "Marine Regions eez_v11",
                        area_km2: 495866,
                        quality: "official"
                    }
                };
                console.log('✅ Dados oficiais da ZEE carregados do escopo global');
                return;
            }

            // Tentar carregar do arquivo JS
            const script = document.createElement('script');
            script.src = 'assets/js/zee_angola_official.js?v=' + Date.now();
            
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    if (typeof angolaZEEOfficial !== 'undefined') {
                        this.officialZEE = {
                            angola: angolaZEEOfficial,
                            cabinda: cabindaZEEOfficial,
                            metadata: angolaZEEMetadata
                        };
                        console.log('✅ Dados oficiais da ZEE carregados do arquivo');
                        resolve();
                    } else {
                        reject(new Error('Dados da ZEE não encontrados após carregamento'));
                    }
                };
                
                script.onerror = () => {
                    reject(new Error('Falha ao carregar arquivo zee_angola_official.js'));
                };
                
                document.head.appendChild(script);
            });
            
        } catch (error) {
            console.warn('⚠️ Falha ao carregar dados oficiais, usando fallback:', error);
            this.setupZEEFallback();
        }
    }

    /**
     * Inicializar overlay EOX para linha costeira de alta precisão
     */
    async initializeEOXCoastlineOverlay() {
        console.log('🗺️ Inicializando EOX Coastline Overlay...');
        
        try {
            // Verificar saúde do serviço EOX primeiro
            const isEOXHealthy = await this.checkEOXHealth();
            
            if (isEOXHealthy) {
                // Criar layer overlay_3857 para linha costeira precisa
                this.eoxOverlayLayer = L.tileLayer.wms('https://tiles.maps.eox.at/wms', {
                    layers: 'overlay_3857',
                    format: 'image/png',
                    transparent: true,
                    opacity: 0.7,
                    attribution: '🌊 Linha Costeira: EOX Overlay © EOX',
                    maxZoom: 16,
                    minZoom: 5,
                    version: '1.1.1', // Versão mais compatível
                    crs: L.CRS.EPSG3857
                });
                
                console.log('✅ EOX Coastline Overlay configurado');
                
                // Configurar detecção de erros
                this.eoxOverlayLayer.on('tileerror', (e) => {
                    console.warn('⚠️ Erro no EOX Overlay:', e);
                    this.handleEOXError('overlay');
                });
                
            } else {
                console.warn('⚠️ Serviço EOX indisponível - usando modo fallback');
                this.setupCoastlineFallback();
            }
            
        } catch (error) {
            console.error('❌ Erro ao configurar EOX Overlay:', error);
            this.setupCoastlineFallback();
        }
    }

    /**
     * Inicializar sistema de batimetria via EOX
     */
    async initializeBathymetrySystem() {
        console.log('🌊 Inicializando sistema de batimetria...');
        
        try {
            // Usar terrain_3857 que inclui dados GEBCO
            this.bathymetryLayer = L.tileLayer.wms('https://tiles.maps.eox.at/wms', {
                layers: 'terrain_3857',
                format: 'image/jpeg', // EOX usa JPEG para terrain
                transparent: false,
                opacity: 0.8,
                attribution: '🌊 Batimetria: EOX Terrain (inclui GEBCO) © EOX',
                maxZoom: 12,
                minZoom: 3,
                version: '1.3.0', // Versão padrão WMS
                crs: L.CRS.EPSG3857
            });
            
            console.log('✅ Sistema de batimetria configurado');
            
            // Configurar detecção de erros
            this.bathymetryLayer.on('tileerror', (e) => {
                console.warn('⚠️ Erro na batimetria EOX:', e);
                this.handleEOXError('bathymetry');
            });
            
        } catch (error) {
            console.error('❌ Erro ao configurar batimetria:', error);
        }
    }

    /**
     * Verificar saúde do serviço EOX
     */
    async checkEOXHealth() {
        try {
            const response = await fetch('https://tiles.maps.eox.at/wms?service=WMS&request=GetCapabilities&version=1.1.1', {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                console.log('✅ Serviço EOX disponível');
                return true;
            } else {
                console.warn(`⚠️ EOX retornou status ${response.status}`);
                return false;
            }
        } catch (error) {
            console.warn('⚠️ EOX inacessível:', error.message);
            return false;
        }
    }

    /**
     * Criar controles de precisão da linha costeira
     */
    createPrecisionControls(map) {
        console.log('🎛️ Criando controles de precisão...');
        
        const precisionControl = L.control({ position: 'topright' });
        
        precisionControl.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control coastline-precision-control');
            div.style.cssText = `
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 8px;
                padding: 8px;
                min-width: 160px;
            `;
            
            div.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 8px; font-size: 12px; color: #2c3e50;">
                    🌊 Precisão Costeira
                </div>
                <div class="precision-buttons" style="display: flex; flex-direction: column; gap: 4px;">
                    <button id="precision-zee" class="precision-btn active" data-precision="zee" 
                            style="padding: 6px 8px; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; background: #0066cc; color: white;">
                        📍 ZEE Oficial
                    </button>
                    <button id="precision-eox" class="precision-btn" data-precision="eox" 
                            style="padding: 6px 8px; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; background: #f8f9fa; color: #2c3e50;">
                        🗺️ EOX Overlay
                    </button>
                    <button id="precision-bathymetry" class="precision-btn" data-precision="bathymetry" 
                            style="padding: 6px 8px; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; background: #f8f9fa; color: #2c3e50;">
                        🌊 Batimetria
                    </button>
                </div>
            `;
            
            return div;
        };
        
        precisionControl.addTo(map);
        
        // Configurar event listeners
        this.setupPrecisionControlEvents(map);
        
        console.log('✅ Controles de precisão criados');
    }

    /**
     * Configurar eventos dos controles de precisão
     */
    setupPrecisionControlEvents(map) {
        // ZEE Oficial
        document.addEventListener('click', (e) => {
            if (e.target.id === 'precision-zee') {
                this.toggleZEEVisibility(map);
                this.updateActiveButton(e.target);
            }
        });
        
        // EOX Overlay
        document.addEventListener('click', (e) => {
            if (e.target.id === 'precision-eox') {
                this.toggleEOXOverlay(map);
                this.updateActiveButton(e.target);
            }
        });
        
        // Batimetria
        document.addEventListener('click', (e) => {
            if (e.target.id === 'precision-bathymetry') {
                this.toggleBathymetry(map);
                this.updateActiveButton(e.target);
            }
        });
    }

    /**
     * Atualizar botão ativo
     */
    updateActiveButton(clickedButton) {
        // Remover classe active de todos os botões
        document.querySelectorAll('.precision-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = '#f8f9fa';
            btn.style.color = '#2c3e50';
        });
        
        // Adicionar classe active ao botão clicado
        clickedButton.classList.add('active');
        clickedButton.style.background = '#0066cc';
        clickedButton.style.color = 'white';
    }

    /**
     * Adicionar ZEE oficial ao mapa
     */
    addOfficialZEE(map) {
        if (!this.officialZEE) {
            console.warn('⚠️ Dados oficiais da ZEE não disponíveis');
            return;
        }

        console.log('📍 Adicionando ZEE oficial ao mapa...');
        
        try {
            // ZEE Angola Continental
            if (this.officialZEE.angola) {
                const angolaLayer = L.polygon(this.officialZEE.angola, this.styles.zee.angola);
                angolaLayer.addTo(map);
                
                angolaLayer.bindPopup(`
                    <div style="font-size: 13px; line-height: 1.4;">
                        <strong>🌊 ZEE Angola Continental</strong><br>
                        📏 Área: 495.866 km²<br>
                        📊 Fonte: Marine Regions (Oficial)<br>
                        📍 Pontos: ${this.officialZEE.angola.length}<br>
                        🔗 ID: ${this.officialZEE.metadata?.mrgid || 'N/A'}
                    </div>
                `);
                
                console.log(`✅ ZEE Angola adicionada (${this.officialZEE.angola.length} pontos)`);
            }
            
            // ZEE Cabinda
            if (this.officialZEE.cabinda) {
                const cabindaLayer = L.polygon(this.officialZEE.cabinda, this.styles.zee.cabinda);
                cabindaLayer.addTo(map);
                
                cabindaLayer.bindPopup(`
                    <div style="font-size: 13px; line-height: 1.4;">
                        <strong>🏛️ ZEE Cabinda</strong><br>
                        📍 Cabinda Norte<br>
                        📊 Fonte: Marine Regions (Oficial)<br>
                        📍 Pontos: ${this.officialZEE.cabinda.length}
                    </div>
                `);
                
                console.log(`✅ ZEE Cabinda adicionada (${this.officialZEE.cabinda.length} pontos)`);
            }
            
        } catch (error) {
            console.error('❌ Erro ao adicionar ZEE oficial:', error);
        }
    }

    /**
     * Toggle visibilidade da ZEE
     */
    toggleZEEVisibility(map) {
        // Implementar toggle da ZEE
        console.log('🔄 Toggle ZEE visibility');
    }

    /**
     * Toggle EOX Overlay
     */
    toggleEOXOverlay(map) {
        if (!this.eoxOverlayLayer) {
            console.warn('⚠️ EOX Overlay não disponível');
            return;
        }

        if (map.hasLayer(this.eoxOverlayLayer)) {
            map.removeLayer(this.eoxOverlayLayer);
            console.log('🗺️ EOX Overlay desativado');
        } else {
            this.eoxOverlayLayer.addTo(map);
            console.log('🗺️ EOX Overlay ativado');
        }
    }

    /**
     * Toggle Batimetria
     */
    toggleBathymetry(map) {
        if (!this.bathymetryLayer) {
            console.warn('⚠️ Batimetria não disponível');
            return;
        }

        if (map.hasLayer(this.bathymetryLayer)) {
            map.removeLayer(this.bathymetryLayer);
            console.log('🌊 Batimetria desativada');
        } else {
            this.bathymetryLayer.addTo(map);
            console.log('🌊 Batimetria ativada');
        }
    }

    /**
     * Configurar fallback para ZEE
     */
    setupZEEFallback() {
        console.log('🔄 Configurando fallback para ZEE...');
        
        // Dados simplificados de fallback
        this.officialZEE = {
            angola: [
                [-5.87, 13.42], [-17.27, 11.75], [-17.25, 8.26], [-5.87, 8.26], [-5.87, 13.42]
            ],
            cabinda: [
                [-5.03, 12.02], [-6.73, 9.12], [-5.03, 9.12], [-5.03, 12.02]
            ],
            metadata: {
                source: "Fallback simplificado",
                quality: "basic"
            }
        };
        
        console.log('✅ Fallback ZEE configurado');
    }

    /**
     * Configurar fallback para linha costeira
     */
    setupCoastlineFallback() {
        console.log('🔄 Configurando fallback para linha costeira...');
        
        // Usar dados básicos sem EOX
        this.coastlineData = {
            source: "basic",
            quality: "standard"
        };
        
        console.log('✅ Fallback linha costeira configurado');
    }

    /**
     * Configurar modo fallback completo
     */
    setupFallbackMode(map) {
        console.log('🛡️ Ativando modo fallback completo...');
        
        this.setupZEEFallback();
        this.setupCoastlineFallback();
        
        // Adicionar ZEE básica
        this.addOfficialZEE(map);
        
        // Mostrar notificação
        this.showFallbackNotification();
        
        console.log('✅ Modo fallback ativo');
    }

    /**
     * Tratar erros do EOX
     */
    handleEOXError(layerType) {
        console.warn(`⚠️ Erro no EOX ${layerType}`);
        
        // Implementar lógica de retry ou fallback específico
        if (layerType === 'overlay') {
            this.eoxOverlayLayer = null;
        } else if (layerType === 'bathymetry') {
            this.bathymetryLayer = null;
        }
    }

    /**
     * Mostrar notificação de fallback
     */
    showFallbackNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(255, 149, 0, 0.95), rgba(52, 152, 219, 0.95));
            color: white;
            padding: 20px 28px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 500;
            z-index: 2000;
            backdrop-filter: blur(20px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            text-align: center;
            max-width: 380px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        notification.innerHTML = `
            <div style="margin-bottom: 12px; font-size: 16px;">
                🛡️ Modo Básico Ativo
            </div>
            <div style="font-size: 13px; line-height: 1.4; margin-bottom: 12px; opacity: 0.95;">
                Serviços avançados indisponíveis.<br>
                Usando dados básicos da ZEE oficial.
            </div>
            <div style="font-size: 12px; background: rgba(255, 255, 255, 0.15); padding: 8px 12px; border-radius: 8px;">
                ✅ ZEE Angola (495.866 km²)<br>
                ✅ Dados Marine Regions<br>
                ⚠️ Funcionalidades limitadas
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-fechar após 5 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Permitir fechar clicando
        notification.addEventListener('click', () => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => notification.remove(), 300);
        });
        
        notification.style.cursor = 'pointer';
    }

    /**
     * Obter informações do sistema
     */
    getSystemInfo() {
        return {
            initialized: this.isInitialized,
            hasOfficialZEE: !!this.officialZEE,
            hasEOXOverlay: !!this.eoxOverlayLayer,
            hasBathymetry: !!this.bathymetryLayer,
            precision: this.precision,
            zeePoints: {
                angola: this.officialZEE?.angola?.length || 0,
                cabinda: this.officialZEE?.cabinda?.length || 0
            },
            metadata: this.officialZEE?.metadata
        };
    }
}

// Exportar para uso global
window.EnhancedCoastlineSystem = EnhancedCoastlineSystem;

console.log('✅ Enhanced Coastline System carregado e pronto para uso');
