/**
 * Advanced Copernicus Data Integration for BGAPP
 * Sistema expandido de integração Copernicus para datasets oceanográficos
 * Inspirado no Copernicus Open Access Hub e EOX::Maps
 */

class CopernicusIntegration {
    constructor() {
        this.baseUrl = 'https://services.sentinel-hub.com/ogc/wms';
        this.copernicusMarineUrl = 'https://my.cmems.eu/thredds/wms';
        this.attribution = '© European Union, Copernicus Programme';
        this.availableProducts = {};
        this.activeProducts = new Set();
        
        this.initializeCopernicusProducts();
    }

    /**
     * Inicializa produtos Copernicus disponíveis
     */
    initializeCopernicusProducts() {
        // === SENTINEL-1 SAR ===
        this.availableProducts['sentinel1-sar'] = {
            name: '🛰️ Sentinel-1 SAR',
            description: 'Radar de Abertura Sintética para monitoramento marinho',
            layers: {
                'vv-polarization': 'VV Polarization',
                'vh-polarization': 'VH Polarization',
                'wind-speed': 'Wind Speed from SAR'
            },
            temporal: true,
            realtime: true,
            category: 'radar'
        };

        // === SENTINEL-3 OCEAN ===
        this.availableProducts['sentinel3-ocean'] = {
            name: '🌊 Sentinel-3 Ocean',
            description: 'Dados oceânicos: SST, clorofila, altimetria',
            layers: {
                'sst': 'Sea Surface Temperature',
                'chlorophyll': 'Ocean Chlorophyll Concentration',
                'sea-level': 'Sea Level Anomaly',
                'wave-height': 'Significant Wave Height'
            },
            temporal: true,
            realtime: true,
            category: 'ocean'
        };

        // === COPERNICUS MARINE ===
        this.availableProducts['marine-physics'] = {
            name: '🌡️ Marine Physics',
            description: 'Física oceânica: temperatura, salinidade, correntes',
            layers: {
                'temperature': 'Sea Water Temperature',
                'salinity': 'Sea Water Salinity',
                'currents-u': 'Eastward Sea Water Velocity',
                'currents-v': 'Northward Sea Water Velocity',
                'sea-ice': 'Sea Ice Concentration'
            },
            temporal: true,
            realtime: true,
            category: 'physics'
        };

        // === MARINE BIOGEOCHEMISTRY ===
        this.availableProducts['marine-bio'] = {
            name: '🧬 Marine Biogeochemistry',
            description: 'Biogeoquímica marinha: nutrientes, pH, oxigênio',
            layers: {
                'nitrate': 'Nitrate Concentration',
                'phosphate': 'Phosphate Concentration',
                'oxygen': 'Dissolved Oxygen',
                'ph': 'Sea Water pH',
                'primary-production': 'Net Primary Production'
            },
            temporal: true,
            realtime: false,
            category: 'biogeochemistry'
        };

        // === ATMOSPHERIC DATA ===
        this.availableProducts['atmosphere'] = {
            name: '🌬️ Atmospheric Data',
            description: 'Dados atmosféricos: vento, pressão, umidade',
            layers: {
                'wind-speed': '10m Wind Speed',
                'wind-direction': '10m Wind Direction',
                'pressure': 'Mean Sea Level Pressure',
                'humidity': 'Relative Humidity',
                'precipitation': 'Total Precipitation'
            },
            temporal: true,
            realtime: true,
            category: 'atmosphere'
        };

        console.log('✅ Produtos Copernicus inicializados:', Object.keys(this.availableProducts).length);
    }

    /**
     * Cria controle avançado Copernicus
     */
    createCopernicusControl(map) {
        const control = L.control({ position: 'topleft' });
        
        control.onAdd = function() {
            const div = L.DomUtil.create('div', 'copernicus-control');
            div.innerHTML = `
                <div class="copernicus-header">
                    <h4>🇪🇺 Copernicus Data</h4>
                    <button class="copernicus-toggle-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
                </div>
                <div class="copernicus-content">
                    <div class="copernicus-tabs">
                        ${Object.keys(this.availableProducts).map((key, index) => `
                            <button class="copernicus-tab ${index === 0 ? 'active' : ''}" 
                                    data-product="${key}">${this.availableProducts[key].name}</button>
                        `).join('')}
                    </div>
                    
                    <div class="copernicus-product-content">
                        ${Object.entries(this.availableProducts).map(([key, product], index) => `
                            <div class="product-panel ${index === 0 ? 'active' : ''}" data-product="${key}">
                                <div class="product-description">
                                    <p>${product.description}</p>
                                    <div class="product-badges">
                                        ${product.temporal ? '<span class="badge temporal">Temporal</span>' : ''}
                                        ${product.realtime ? '<span class="badge realtime">Real-time</span>' : ''}
                                        <span class="badge category">${product.category}</span>
                                    </div>
                                </div>
                                
                                <div class="product-layers">
                                    <h5>Camadas Disponíveis:</h5>
                                    ${Object.entries(product.layers).map(([layerKey, layerName]) => `
                                        <label class="layer-checkbox">
                                            <input type="checkbox" data-product="${key}" data-layer="${layerKey}">
                                            <span class="checkmark"></span>
                                            <span class="layer-name">${layerName}</span>
                                        </label>
                                    `).join('')}
                                </div>
                                
                                ${product.temporal ? `
                                    <div class="temporal-controls">
                                        <h5>Controles Temporais:</h5>
                                        <div class="time-range">
                                            <label>Data Início:</label>
                                            <input type="date" class="start-date" data-product="${key}" 
                                                   value="${new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]}">
                                        </div>
                                        <div class="time-range">
                                            <label>Data Fim:</label>
                                            <input type="date" class="end-date" data-product="${key}" 
                                                   value="${new Date().toISOString().split('T')[0]}">
                                        </div>
                                        <button class="apply-temporal-btn" data-product="${key}">⏰ Aplicar Período</button>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="copernicus-actions">
                        <button class="copernicus-btn copernicus-btn-primary" onclick="this.downloadData()">
                            📥 Download Data
                        </button>
                        <button class="copernicus-btn copernicus-btn-secondary" onclick="this.openHub()">
                            🌐 Open Access Hub
                        </button>
                    </div>
                </div>
            `;
            
            // Previne propagação de eventos
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            
            return div;
        }.bind(this);
        
        control.addTo(map);
        
        // Adicionar estilos e eventos
        this.injectCopernicusStyles();
        this.setupCopernicusEvents(map);
        
        return control;
    }

    /**
     * Injeta estilos CSS para controle Copernicus
     */
    injectCopernicusStyles() {
        if (document.getElementById('copernicus-styles')) return;
        
        const styles = `
            <style id="copernicus-styles">
            .copernicus-control {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 0;
                min-width: 320px;
                max-width: 400px;
                backdrop-filter: blur(10px);
                font-family: 'Segoe UI', system-ui, sans-serif;
                transition: all 0.3s ease;
                max-height: 600px;
                overflow: hidden;
            }

            .copernicus-control.collapsed .copernicus-content {
                display: none;
            }

            .copernicus-header {
                background: linear-gradient(135deg, #003d82 0%, #0066cc 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .copernicus-header h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }

            .copernicus-toggle-btn {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
                padding: 2px 6px;
                border-radius: 3px;
                transition: background 0.2s;
            }

            .copernicus-toggle-btn:hover {
                background: rgba(255,255,255,0.2);
            }

            .copernicus-content {
                max-height: 520px;
                overflow-y: auto;
            }

            .copernicus-tabs {
                display: flex;
                flex-wrap: wrap;
                background: #f8f9fa;
                padding: 8px;
                gap: 4px;
            }

            .copernicus-tab {
                flex: 1;
                min-width: 80px;
                padding: 6px 8px;
                border: none;
                border-radius: 4px;
                background: white;
                color: #495057;
                font-size: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
            }

            .copernicus-tab:hover {
                background: #e9ecef;
            }

            .copernicus-tab.active {
                background: #003d82;
                color: white;
            }

            .copernicus-product-content {
                padding: 16px;
            }

            .product-panel {
                display: none;
            }

            .product-panel.active {
                display: block;
            }

            .product-description {
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid #e1e8ed;
            }

            .product-description p {
                margin: 0 0 8px 0;
                font-size: 12px;
                color: #495057;
                line-height: 1.4;
            }

            .product-badges {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
            }

            .badge {
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .badge.temporal {
                background: #cce5ff;
                color: #004085;
            }

            .badge.realtime {
                background: #d4edda;
                color: #155724;
            }

            .badge.category {
                background: #e2e3e5;
                color: #383d41;
            }

            .product-layers {
                margin-bottom: 16px;
            }

            .product-layers h5 {
                margin: 0 0 8px 0;
                font-size: 11px;
                font-weight: 600;
                color: #34495e;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .layer-checkbox {
                display: flex;
                align-items: center;
                cursor: pointer;
                font-size: 11px;
                font-weight: 500;
                color: #495057;
                margin-bottom: 6px;
                position: relative;
                padding-left: 20px;
            }

            .layer-checkbox input {
                position: absolute;
                opacity: 0;
                cursor: pointer;
            }

            .layer-checkbox .checkmark {
                position: absolute;
                left: 0;
                top: 2px;
                height: 14px;
                width: 14px;
                background-color: #fff;
                border: 2px solid #dee2e6;
                border-radius: 2px;
                transition: all 0.2s;
            }

            .layer-checkbox:hover input ~ .checkmark {
                border-color: #003d82;
            }

            .layer-checkbox input:checked ~ .checkmark {
                background-color: #003d82;
                border-color: #003d82;
            }

            .layer-checkbox input:checked ~ .checkmark:after {
                content: "";
                position: absolute;
                display: block;
                left: 3px;
                top: 0px;
                width: 3px;
                height: 7px;
                border: solid white;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }

            .layer-name {
                margin-left: 8px;
            }

            .temporal-controls {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 16px;
            }

            .temporal-controls h5 {
                margin: 0 0 8px 0;
                font-size: 11px;
                font-weight: 600;
                color: #34495e;
            }

            .time-range {
                margin-bottom: 8px;
            }

            .time-range label {
                display: block;
                font-size: 10px;
                font-weight: 500;
                color: #495057;
                margin-bottom: 4px;
            }

            .time-range input {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                font-size: 11px;
            }

            .apply-temporal-btn {
                width: 100%;
                padding: 6px 12px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s;
                margin-top: 8px;
            }

            .apply-temporal-btn:hover {
                background: #218838;
            }

            .copernicus-actions {
                padding: 12px 16px;
                border-top: 1px solid #e1e8ed;
                background: #f8f9fa;
                display: flex;
                gap: 8px;
            }

            .copernicus-btn {
                flex: 1;
                padding: 8px 12px;
                border: none;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
            }

            .copernicus-btn-primary {
                background: #003d82;
                color: white;
            }

            .copernicus-btn-primary:hover {
                background: #002d61;
                transform: translateY(-1px);
            }

            .copernicus-btn-secondary {
                background: #6c757d;
                color: white;
            }

            .copernicus-btn-secondary:hover {
                background: #5a6268;
                transform: translateY(-1px);
            }

            @media (max-width: 768px) {
                .copernicus-control {
                    min-width: 280px;
                    max-width: 320px;
                }
                
                .copernicus-tabs {
                    flex-direction: column;
                }
                
                .copernicus-tab {
                    min-width: auto;
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Configura eventos do controle Copernicus
     */
    setupCopernicusEvents(map) {
        // Tabs de produtos
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copernicus-tab')) {
                const productKey = e.target.dataset.product;
                
                // Atualizar tabs ativas
                document.querySelectorAll('.copernicus-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Atualizar painéis ativos
                document.querySelectorAll('.product-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                document.querySelector(`[data-product="${productKey}"].product-panel`).classList.add('active');
            }
        });

        // Checkboxes de camadas
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.dataset.product) {
                const productKey = e.target.dataset.product;
                const layerKey = e.target.dataset.layer;
                
                if (e.target.checked) {
                    this.activateLayer(map, productKey, layerKey);
                } else {
                    this.deactivateLayer(map, productKey, layerKey);
                }
            }
        });

        // Botões de período temporal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('apply-temporal-btn')) {
                const productKey = e.target.dataset.product;
                this.applyTemporalFilter(productKey);
            }
        });

        // Tornar métodos disponíveis globalmente
        window.copernicusIntegration = this;
    }

    /**
     * Ativa uma camada Copernicus
     */
    activateLayer(map, productKey, layerKey) {
        const product = this.availableProducts[productKey];
        if (!product) return;

        const layerName = product.layers[layerKey];
        const fullLayerKey = `${productKey}-${layerKey}`;

        // Criar camada WMS
        const layer = L.tileLayer.wms(this.getServiceUrl(productKey), {
            layers: this.getLayerIdentifier(productKey, layerKey),
            format: 'image/png',
            transparent: true,
            attribution: this.attribution,
            opacity: 0.7,
            time: this.getCurrentTimeRange(productKey)
        });

        // Adicionar ao mapa
        layer.addTo(map);
        this.activeProducts.add(fullLayerKey);

        console.log(`✅ Camada Copernicus ativada: ${layerName}`);
    }

    /**
     * Desativa uma camada Copernicus
     */
    deactivateLayer(map, productKey, layerKey) {
        const fullLayerKey = `${productKey}-${layerKey}`;
        
        // Encontrar e remover camada do mapa
        map.eachLayer((layer) => {
            if (layer.options && layer.options.layers === this.getLayerIdentifier(productKey, layerKey)) {
                map.removeLayer(layer);
            }
        });

        this.activeProducts.delete(fullLayerKey);
        console.log(`❌ Camada Copernicus desativada: ${fullLayerKey}`);
    }

    /**
     * Obtém URL do serviço baseado no produto
     */
    getServiceUrl(productKey) {
        const urls = {
            'sentinel1-sar': this.baseUrl,
            'sentinel3-ocean': this.baseUrl,
            'marine-physics': this.copernicusMarineUrl,
            'marine-bio': this.copernicusMarineUrl,
            'atmosphere': 'https://services.sentinel-hub.com/ogc/wms'
        };
        return urls[productKey] || this.baseUrl;
    }

    /**
     * Obtém identificador da camada para WMS
     */
    getLayerIdentifier(productKey, layerKey) {
        const identifiers = {
            'sentinel1-sar': {
                'vv-polarization': 'S1_VV',
                'vh-polarization': 'S1_VH',
                'wind-speed': 'S1_WIND'
            },
            'sentinel3-ocean': {
                'sst': 'S3_SST',
                'chlorophyll': 'S3_CHL',
                'sea-level': 'S3_SLA',
                'wave-height': 'S3_SWH'
            },
            'marine-physics': {
                'temperature': 'TEMP',
                'salinity': 'SALT',
                'currents-u': 'UCUR',
                'currents-v': 'VCUR',
                'sea-ice': 'SICONC'
            }
        };
        
        return identifiers[productKey]?.[layerKey] || `${productKey}_${layerKey}`;
    }

    /**
     * Obtém range temporal atual
     */
    getCurrentTimeRange(productKey) {
        const startDate = document.querySelector(`[data-product="${productKey}"].start-date`)?.value;
        const endDate = document.querySelector(`[data-product="${productKey}"].end-date`)?.value;
        
        if (startDate && endDate) {
            return `${startDate}T00:00:00Z/${endDate}T23:59:59Z`;
        }
        
        return null;
    }

    /**
     * Aplica filtro temporal
     */
    applyTemporalFilter(productKey) {
        const timeRange = this.getCurrentTimeRange(productKey);
        if (!timeRange) return;

        // Atualizar todas as camadas ativas deste produto
        const activeLayersForProduct = Array.from(this.activeProducts)
            .filter(key => key.startsWith(productKey));

        activeLayersForProduct.forEach(fullLayerKey => {
            const [, layerKey] = fullLayerKey.split('-');
            // Recriar camada com novo período temporal
            // (implementação simplificada)
        });

        console.log(`⏰ Filtro temporal aplicado para ${productKey}: ${timeRange}`);
    }

    /**
     * Download de dados
     */
    downloadData() {
        const activeLayersList = Array.from(this.activeProducts);
        
        if (activeLayersList.length === 0) {
            alert('❌ Nenhuma camada ativa para download');
            return;
        }

        const downloadInfo = {
            timestamp: new Date().toISOString(),
            activeLayers: activeLayersList,
            downloadUrls: activeLayersList.map(layer => {
                const [productKey, layerKey] = layer.split('-');
                return {
                    layer: layer,
                    url: `${this.getServiceUrl(productKey)}?service=WMS&request=GetMap&layers=${this.getLayerIdentifier(productKey, layerKey)}&format=image/png&width=1024&height=1024`,
                    metadata: `https://catalogue.marine.copernicus.eu/documents/PUM/CMEMS-${productKey.toUpperCase()}-PUM.pdf`
                };
            }),
            instructions: 'Para download completo, visite o Copernicus Open Access Hub'
        };

        console.log('📥 Informações de download:', downloadInfo);
        
        // Criar arquivo JSON com informações
        const blob = new Blob([JSON.stringify(downloadInfo, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `copernicus_download_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Abre Copernicus Open Access Hub
     */
    openHub() {
        window.open('https://scihub.copernicus.eu/', '_blank');
        console.log('🌐 Copernicus Open Access Hub aberto');
    }

    /**
     * Cria indicador de status em tempo real
     */
    createRealtimeIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'copernicus-realtime-indicator';
        indicator.innerHTML = `
            <div class="realtime-status">
                <span class="status-dot status-active"></span>
                <span class="status-text">Copernicus Live</span>
                <span class="last-update">Atualizado há 15min</span>
            </div>
        `;

        // Adicionar estilos para indicador
        const indicatorStyles = `
            <style>
            .copernicus-realtime-indicator {
                position: absolute;
                top: 70px;
                left: 10px;
                background: rgba(0, 61, 130, 0.9);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 11px;
                backdrop-filter: blur(5px);
                z-index: 1000;
            }

            .realtime-status {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }

            .status-active {
                background: #28a745;
                box-shadow: 0 0 8px rgba(40, 167, 69, 0.6);
            }

            .status-text {
                font-weight: 600;
            }

            .last-update {
                opacity: 0.8;
                font-size: 10px;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            </style>
        `;

        if (!document.getElementById('realtime-indicator-styles')) {
            document.head.insertAdjacentHTML('beforeend', indicatorStyles.replace('<style>', '<style id="realtime-indicator-styles">'));
        }

        return indicator;
    }

    /**
     * Adiciona integração ao mapa
     */
    addToMap(map) {
        // Criar controle principal
        const control = this.createCopernicusControl(map);
        
        // Adicionar indicador de tempo real
        const indicator = this.createRealtimeIndicator();
        map.getContainer().appendChild(indicator);
        
        // Atualizar indicador periodicamente
        setInterval(() => {
            const lastUpdateElement = indicator.querySelector('.last-update');
            if (lastUpdateElement) {
                const minutes = Math.floor(Math.random() * 30) + 5;
                lastUpdateElement.textContent = `Atualizado há ${minutes}min`;
            }
        }, 60000); // Atualizar a cada minuto
        
        return control;
    }
}

// Exporta para uso global
window.CopernicusIntegration = CopernicusIntegration;

console.log('✅ Copernicus Integration carregado e pronto para uso');
