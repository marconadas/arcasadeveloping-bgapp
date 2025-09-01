/**
 * Sentinel-2 Cloudless Integration for BGAPP
 * Sistema de integração com dados Sentinel-2 cloudless (2016-2024)
 * Baseado nas funcionalidades do EOX::Maps
 */

class Sentinel2Integration {
    constructor() {
        this.baseUrl = 'https://tiles.maps.eox.at/wms';
        this.availableYears = ['2016', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
        this.currentYear = '2024';
        this.attribution = '© Sentinel-2 cloudless by EOX IT Services GmbH (Contains modified Copernicus Sentinel data)';
        
        this.initializeYearSelector();
    }

    /**
     * Cria seletor de anos para Sentinel-2
     */
    initializeYearSelector() {
        const selectorHTML = `
            <div id="sentinel2-year-selector" class="sentinel2-control">
                <div class="sentinel2-header">
                    <h4>🛰️ Sentinel-2 Cloudless</h4>
                    <div class="sentinel2-info">
                        <span class="info-icon" title="Dados satelitais quase sem nuvens da ESA Copernicus">ℹ️</span>
                    </div>
                </div>
                <div class="sentinel2-years">
                    ${this.availableYears.map(year => `
                        <button class="year-btn ${year === this.currentYear ? 'active' : ''}" 
                                data-year="${year}">${year}</button>
                    `).join('')}
                </div>
                <div class="sentinel2-stats">
                    <div class="stat-item">
                        <span class="stat-label">Cobertura:</span>
                        <span class="stat-value">Global</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Resolução:</span>
                        <span class="stat-value">10m</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Nuvens:</span>
                        <span class="stat-value">&lt; 5%</span>
                    </div>
                </div>
            </div>
        `;

        // Adiciona CSS se não existir
        if (!document.getElementById('sentinel2-styles')) {
            this.injectStyles();
        }

        return selectorHTML;
    }

    /**
     * Injeta estilos CSS para o seletor Sentinel-2
     */
    injectStyles() {
        const styles = `
            <style id="sentinel2-styles">
            .sentinel2-control {
                position: absolute;
                top: 120px;
                right: 10px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 16px;
                min-width: 220px;
                backdrop-filter: blur(10px);
                font-family: 'Segoe UI', system-ui, sans-serif;
                z-index: 1000;
            }

            .sentinel2-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e1e8ed;
            }

            .sentinel2-header h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
                color: #2c3e50;
            }

            .info-icon {
                cursor: help;
                font-size: 14px;
                color: #3498db;
            }

            .sentinel2-years {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px;
                margin-bottom: 12px;
            }

            .year-btn {
                padding: 6px 8px;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                background: white;
                color: #495057;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
            }

            .year-btn:hover {
                border-color: #3498db;
                background: #f8f9fa;
                transform: translateY(-1px);
            }

            .year-btn.active {
                background: #3498db;
                color: white;
                border-color: #3498db;
                box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
            }

            .sentinel2-stats {
                border-top: 1px solid #e1e8ed;
                padding-top: 8px;
            }

            .stat-item {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                margin-bottom: 4px;
            }

            .stat-item:last-child {
                margin-bottom: 0;
            }

            .stat-label {
                color: #6c757d;
                font-weight: 500;
            }

            .stat-value {
                color: #2c3e50;
                font-weight: 600;
            }

            @media (max-width: 768px) {
                .sentinel2-control {
                    top: 60px;
                    right: 5px;
                    min-width: 180px;
                    padding: 12px;
                }
                
                .sentinel2-years {
                    grid-template-columns: repeat(3, 1fr);
                }
                
                .year-btn {
                    padding: 8px 6px;
                    font-size: 10px;
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Cria camada Sentinel-2 para um ano específico
     */
    createSentinel2Layer(year = this.currentYear) {
        if (!this.availableYears.includes(year)) {
            console.warn(`❌ Ano não disponível para Sentinel-2: ${year}`);
            return null;
        }

        const layer = L.tileLayer.wms(this.baseUrl, {
            layers: `s2cloudless-${year}`,
            format: 'image/jpeg',
            transparent: false,
            attribution: this.attribution,
            maxZoom: 14,
            tileSize: 256
        });

        console.log(`✅ Camada Sentinel-2 ${year} criada`);
        return layer;
    }

    /**
     * Adiciona controle Sentinel-2 ao mapa
     */
    addToMap(map, eoxManager) {
        // Criar controle customizado
        const control = L.control({ position: 'topright' });
        
        control.onAdd = function() {
            const div = L.DomUtil.create('div');
            div.innerHTML = this.initializeYearSelector();
            
            // Previne propagação de eventos
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            
            return div;
        }.bind(this);
        
        control.addTo(map);
        
        // Adicionar event listeners
        this.setupYearSelectorEvents(map, eoxManager);
        
        return control;
    }

    /**
     * Configura eventos do seletor de anos
     */
    setupYearSelectorEvents(map, eoxManager) {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('year-btn')) {
                const year = e.target.dataset.year;
                
                // Atualizar ano atual
                this.currentYear = year;
                
                // Atualizar visual dos botões
                document.querySelectorAll('.year-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Atualizar camada no EOX Manager
                this.updateSentinel2Layer(map, eoxManager, year);
                
                console.log(`✅ Sentinel-2 alterado para ano: ${year}`);
            }
        });
    }

    /**
     * Atualiza camada Sentinel-2 no EOX Manager
     */
    updateSentinel2Layer(map, eoxManager, year) {
        // Criar nova camada Sentinel-2
        const newLayer = this.createSentinel2Layer(year);
        
        if (newLayer) {
            // Adicionar ao EOX Manager como camada customizada
            const layerKey = `sentinel2-${year}`;
            eoxManager.backgroundLayers[layerKey] = newLayer;
            
            // Aplicar a nova camada
            eoxManager.setBackgroundLayer(map, layerKey);
            
            // Atualizar estatísticas se necessário
            this.updateStats(year);
        }
    }

    /**
     * Atualiza estatísticas exibidas
     */
    updateStats(year) {
        const stats = this.getSentinel2Stats(year);
        
        // Atualizar elementos se existirem
        const elements = document.querySelectorAll('.stat-value');
        if (elements.length >= 3) {
            elements[0].textContent = stats.coverage;
            elements[1].textContent = stats.resolution;
            elements[2].textContent = stats.cloudCover;
        }
    }

    /**
     * Retorna estatísticas para um ano específico
     */
    getSentinel2Stats(year) {
        const stats = {
            '2016': { coverage: 'Global', resolution: '10m', cloudCover: '< 8%' },
            '2018': { coverage: 'Global', resolution: '10m', cloudCover: '< 6%' },
            '2019': { coverage: 'Global', resolution: '10m', cloudCover: '< 5%' },
            '2020': { coverage: 'Global', resolution: '10m', cloudCover: '< 4%' },
            '2021': { coverage: 'Global', resolution: '10m', cloudCover: '< 4%' },
            '2022': { coverage: 'Global', resolution: '10m', cloudCover: '< 3%' },
            '2023': { coverage: 'Global', resolution: '10m', cloudCover: '< 3%' },
            '2024': { coverage: 'Global', resolution: '10m', cloudCover: '< 2%' }
        };

        return stats[year] || { coverage: 'Global', resolution: '10m', cloudCover: '< 5%' };
    }

    /**
     * Cria comparador temporal entre anos
     */
    createTemporalComparator(map) {
        const comparator = {
            leftYear: '2020',
            rightYear: '2024',
            isActive: false,
            
            enable: function() {
                if (this.isActive) return;
                
                // Dividir mapa ao meio
                const mapContainer = map.getContainer();
                const leftPane = L.DomUtil.create('div', 'temporal-left-pane', mapContainer);
                const rightPane = L.DomUtil.create('div', 'temporal-right-pane', mapContainer);
                
                leftPane.style.cssText = 'position: absolute; top: 0; left: 0; width: 50%; height: 100%; z-index: 1000; clip: rect(0, 50vw, 100vh, 0);';
                rightPane.style.cssText = 'position: absolute; top: 0; right: 0; width: 50%; height: 100%; z-index: 1000; clip: rect(0, 100vw, 100vh, 50vw);';
                
                this.isActive = true;
                console.log('✅ Comparador temporal ativado');
            },
            
            disable: function() {
                if (!this.isActive) return;
                
                const leftPane = document.querySelector('.temporal-left-pane');
                const rightPane = document.querySelector('.temporal-right-pane');
                
                if (leftPane) leftPane.remove();
                if (rightPane) rightPane.remove();
                
                this.isActive = false;
                console.log('✅ Comparador temporal desativado');
            }
        };
        
        return comparator;
    }

    /**
     * Exporta dados de uma região específica
     */
    exportRegion(map, bounds, year = this.currentYear) {
        const exportData = {
            year: year,
            bounds: bounds,
            layer: `s2cloudless-${year}`,
            timestamp: new Date().toISOString(),
            attribution: this.attribution,
            downloadUrl: `${this.baseUrl}?service=WMS&request=GetMap&layers=s2cloudless-${year}&bbox=${bounds.toBBoxString()}&width=1024&height=1024&format=image/jpeg`
        };

        console.log('📤 Dados de exportação Sentinel-2:', exportData);
        return exportData;
    }

    /**
     * Obtém informações detalhadas sobre uma coordenada
     */
    async getPixelInfo(lat, lon, year = this.currentYear) {
        try {
            const response = await fetch(`${this.baseUrl}?service=WMS&request=GetFeatureInfo&query_layers=s2cloudless-${year}&x=256&y=256&width=512&height=512&info_format=application/json&bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&srs=EPSG:4326`);
            
            if (response.ok) {
                const data = await response.json();
                return {
                    year: year,
                    coordinates: [lat, lon],
                    data: data,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            console.warn('❌ Erro ao obter informações do pixel:', error);
        }
        
        return null;
    }
}

// Exporta para uso global
window.Sentinel2Integration = Sentinel2Integration;

console.log('✅ Sentinel-2 Integration carregado e pronto para uso');
