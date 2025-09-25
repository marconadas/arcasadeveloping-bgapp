/**
 * GEBCO Bathymetry Integration for BGAPP
 * Sistema de dados batimétricos GEBCO para visualização oceânica detalhada
 * Inspirado no EOX::Maps e VirES for Swarm
 */

class GEBCOBathymetry {
    constructor() {
        this.gebcoBaseUrl = 'https://tiles.maps.eox.at/wms';
        this.gebcoWmsUrl = 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv';
        this.attribution = '© GEBCO Bathymetric Compilation Group 2023, EOX IT Services GmbH';
        this.currentDepthRange = { min: -11000, max: 0 };
        this.colorPalettes = {
            'blue-depth': ['#000080', '#0000FF', '#4169E1', '#87CEEB', '#E0F6FF'],
            'terrain': ['#0D47A1', '#1976D2', '#2196F3', '#64B5F6', '#BBDEFB'],
            'scientific': ['#1A237E', '#303F9F', '#3F51B5', '#7986CB', '#C5CAE9']
        };
        this.currentPalette = 'blue-depth';
        
        this.initializeBathymetryLayers();
    }

    /**
     * Inicializa camadas batimétrica disponíveis
     */
    initializeBathymetryLayers() {
        this.layers = {
            'gebco-bathymetry': {
                layer: L.tileLayer.wms(this.gebcoBaseUrl, {
                    layers: 'bathymetry',
                    format: 'image/png',
                    transparent: true,
                    attribution: this.attribution,
                    maxZoom: 12,
                    opacity: 0.8
                }),
                name: '🌊 GEBCO Bathymetry',
                description: 'Dados batimétricos globais GEBCO 2023'
            },
            
            'gebco-hillshade': {
                layer: L.tileLayer.wms(this.gebcoWmsUrl, {
                    layers: 'GEBCO_LATEST_SUB_ICE_TOPO',
                    format: 'image/png',
                    transparent: true,
                    attribution: this.attribution,
                    maxZoom: 14,
                    opacity: 0.6,
                    styles: 'hillshade'
                }),
                name: '⛰️ Bathymetry Hillshade',
                description: 'Relevo submarino com sombreamento'
            },
            
            'depth-contours': {
                layer: L.tileLayer.wms(this.gebcoWmsUrl, {
                    layers: 'GEBCO_LATEST_SUB_ICE_TOPO',
                    format: 'image/png',
                    transparent: true,
                    attribution: this.attribution,
                    maxZoom: 16,
                    opacity: 0.7,
                    styles: 'contours'
                }),
                name: '📏 Depth Contours',
                description: 'Curvas batimétricas detalhadas'
            }
        };

        console.log('✅ Camadas GEBCO inicializadas:', Object.keys(this.layers).length);
    }

    /**
     * Cria controle de batimetria
     */
    createBathymetryControl(map) {
        const control = L.control({ position: 'bottomright' });
        
        control.onAdd = function() {
            const div = L.DomUtil.create('div', 'gebco-bathymetry-control');
            div.innerHTML = `
                <div class="gebco-header">
                    <h4>🌊 Bathymetry GEBCO</h4>
                    <button class="gebco-toggle-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
                </div>
                <div class="gebco-content">
                    <div class="gebco-section">
                        <h5>Camadas Disponíveis</h5>
                        <div class="gebco-layers">
                            ${Object.entries(this.layers).map(([key, layer]) => `
                                <div class="gebco-layer-item">
                                    <label class="gebco-checkbox">
                                        <input type="checkbox" data-layer="${key}">
                                        <span class="checkmark"></span>
                                        ${layer.name}
                                    </label>
                                    <div class="gebco-layer-desc">${layer.description}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="gebco-section">
                        <h5>Configurações</h5>
                        <div class="gebco-controls">
                            <div class="control-group">
                                <label>Paleta de Cores:</label>
                                <select class="gebco-palette-select">
                                    ${Object.keys(this.colorPalettes).map(palette => `
                                        <option value="${palette}" ${palette === this.currentPalette ? 'selected' : ''}>
                                            ${this.getPaletteName(palette)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="control-group">
                                <label>Opacidade:</label>
                                <input type="range" class="gebco-opacity-slider" min="0" max="100" value="80">
                                <span class="opacity-value">80%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="gebco-section">
                        <h5>Legenda de Profundidade</h5>
                        <div class="depth-legend">
                            ${this.createDepthLegend()}
                        </div>
                    </div>
                    
                    <div class="gebco-section">
                        <div class="gebco-actions">
                            <button class="gebco-btn gebco-btn-primary" onclick="this.enable3DView()">🔮 Vista 3D</button>
                            <button class="gebco-btn gebco-btn-secondary" onclick="this.exportBathymetry()">📤 Exportar</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Previne propagação de eventos
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            
            return div;
        }.bind(this);
        
        control.addTo(map);
        
        // Adicionar estilos CSS
        this.injectBathymetryStyles();
        
        // Configurar eventos
        this.setupBathymetryEvents(map);
        
        return control;
    }

    /**
     * Injeta estilos CSS para controle de batimetria
     */
    injectBathymetryStyles() {
        if (document.getElementById('gebco-bathymetry-styles')) return;
        
        const styles = `
            <style id="gebco-bathymetry-styles">
            .gebco-bathymetry-control {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 0;
                min-width: 280px;
                max-width: 320px;
                backdrop-filter: blur(10px);
                font-family: 'Segoe UI', system-ui, sans-serif;
                transition: all 0.3s ease;
            }

            .gebco-bathymetry-control.collapsed .gebco-content {
                display: none;
            }

            .gebco-header {
                background: linear-gradient(135deg, #0D47A1 0%, #1976D2 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .gebco-header h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }

            .gebco-toggle-btn {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
                padding: 2px 6px;
                border-radius: 3px;
                transition: background 0.2s;
            }

            .gebco-toggle-btn:hover {
                background: rgba(255,255,255,0.2);
            }

            .gebco-content {
                padding: 16px;
                max-height: 400px;
                overflow-y: auto;
            }

            .gebco-section {
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid #e1e8ed;
            }

            .gebco-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }

            .gebco-section h5 {
                margin: 0 0 8px 0;
                font-size: 12px;
                font-weight: 600;
                color: #34495e;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .gebco-layer-item {
                margin-bottom: 8px;
            }

            .gebco-checkbox {
                display: flex;
                align-items: flex-start;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                color: #495057;
                position: relative;
                padding-left: 24px;
            }

            .gebco-checkbox input {
                position: absolute;
                opacity: 0;
                cursor: pointer;
            }

            .checkmark {
                position: absolute;
                left: 0;
                top: 2px;
                height: 16px;
                width: 16px;
                background-color: #fff;
                border: 2px solid #dee2e6;
                border-radius: 3px;
                transition: all 0.2s;
            }

            .gebco-checkbox:hover input ~ .checkmark {
                border-color: #0D47A1;
            }

            .gebco-checkbox input:checked ~ .checkmark {
                background-color: #0D47A1;
                border-color: #0D47A1;
            }

            .gebco-checkbox input:checked ~ .checkmark:after {
                content: "";
                position: absolute;
                display: block;
                left: 4px;
                top: 1px;
                width: 4px;
                height: 8px;
                border: solid white;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }

            .gebco-layer-desc {
                font-size: 10px;
                color: #6c757d;
                margin-top: 2px;
                margin-left: 24px;
            }

            .control-group {
                margin-bottom: 12px;
            }

            .control-group label {
                display: block;
                font-size: 11px;
                font-weight: 500;
                color: #495057;
                margin-bottom: 4px;
            }

            .gebco-palette-select {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                font-size: 11px;
                background: white;
            }

            .gebco-opacity-slider {
                width: calc(100% - 50px);
                margin-right: 8px;
            }

            .opacity-value {
                font-size: 10px;
                font-weight: 600;
                color: #0D47A1;
                min-width: 35px;
            }

            .depth-legend {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .depth-item {
                display: flex;
                align-items: center;
                font-size: 10px;
                gap: 8px;
            }

            .depth-color {
                width: 16px;
                height: 12px;
                border-radius: 2px;
                border: 1px solid #dee2e6;
            }

            .gebco-actions {
                display: flex;
                gap: 8px;
            }

            .gebco-btn {
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

            .gebco-btn-primary {
                background: #0D47A1;
                color: white;
            }

            .gebco-btn-primary:hover {
                background: #1565C0;
                transform: translateY(-1px);
            }

            .gebco-btn-secondary {
                background: #6c757d;
                color: white;
            }

            .gebco-btn-secondary:hover {
                background: #5a6268;
                transform: translateY(-1px);
            }

            @media (max-width: 768px) {
                .gebco-bathymetry-control {
                    min-width: 240px;
                    max-width: 280px;
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Configura eventos do controle de batimetria
     */
    setupBathymetryEvents(map) {
        // Checkbox de camadas
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.dataset.layer) {
                const layerKey = e.target.dataset.layer;
                const layer = this.layers[layerKey];
                
                if (e.target.checked) {
                    layer.layer.addTo(map);
                    console.log(`✅ Camada GEBCO ativada: ${layerKey}`);
                } else {
                    map.removeLayer(layer.layer);
                    console.log(`❌ Camada GEBCO desativada: ${layerKey}`);
                }
            }
        });

        // Slider de opacidade
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('gebco-opacity-slider')) {
                const opacity = e.target.value / 100;
                const valueSpan = e.target.parentElement.querySelector('.opacity-value');
                valueSpan.textContent = `${e.target.value}%`;
                
                // Aplicar opacidade a todas as camadas ativas
                Object.values(this.layers).forEach(layer => {
                    if (map.hasLayer(layer.layer)) {
                        layer.layer.setOpacity(opacity);
                    }
                });
            }
        });

        // Seletor de paleta
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('gebco-palette-select')) {
                this.currentPalette = e.target.value;
                this.updateDepthLegend();
                console.log(`🎨 Paleta alterada para: ${this.currentPalette}`);
            }
        });
    }

    /**
     * Cria legenda de profundidade
     */
    createDepthLegend() {
        const depths = [
            { range: '0 a -200m', color: this.colorPalettes[this.currentPalette][4], label: 'Plataforma Continental' },
            { range: '-200 a -1000m', color: this.colorPalettes[this.currentPalette][3], label: 'Talude Continental' },
            { range: '-1000 a -3000m', color: this.colorPalettes[this.currentPalette][2], label: 'Elevação Continental' },
            { range: '-3000 a -6000m', color: this.colorPalettes[this.currentPalette][1], label: 'Planície Abissal' },
            { range: '> -6000m', color: this.colorPalettes[this.currentPalette][0], label: 'Fossa Oceânica' }
        ];

        return depths.map(depth => `
            <div class="depth-item">
                <div class="depth-color" style="background-color: ${depth.color}"></div>
                <span class="depth-range">${depth.range}</span>
                <span class="depth-label">${depth.label}</span>
            </div>
        `).join('');
    }

    /**
     * Atualiza legenda de profundidade
     */
    updateDepthLegend() {
        const legendElement = document.querySelector('.depth-legend');
        if (legendElement) {
            legendElement.innerHTML = this.createDepthLegend();
        }
    }

    /**
     * Retorna nome da paleta
     */
    getPaletteName(palette) {
        const names = {
            'blue-depth': 'Azul Oceânico',
            'terrain': 'Terreno',
            'scientific': 'Científica'
        };
        return names[palette] || palette;
    }

    /**
     * Habilita vista 3D (integração futura)
     */
    enable3DView() {
        console.log('🔮 Vista 3D será implementada na próxima versão');
        // Placeholder para integração com Three.js ou similar
        alert('🔮 Vista 3D em desenvolvimento!\n\nEsta funcionalidade permitirá visualização 3D dos dados batimétricos GEBCO inspirada no VirES for Swarm.');
    }

    /**
     * Exporta dados batimétricos da região visível
     */
    exportBathymetry() {
        const map = this.getCurrentMap();
        if (!map) return;

        const bounds = map.getBounds();
        const exportData = {
            type: 'GEBCO_Bathymetry_Export',
            bounds: bounds,
            layers: Object.keys(this.layers).filter(key => 
                map.hasLayer(this.layers[key].layer)
            ),
            palette: this.currentPalette,
            timestamp: new Date().toISOString(),
            downloadUrl: `${this.gebcoWmsUrl}?service=WMS&request=GetMap&layers=GEBCO_LATEST_SUB_ICE_TOPO&bbox=${bounds.toBBoxString()}&width=1024&height=1024&format=image/png`
        };

        console.log('📤 Exportando dados batimétricos:', exportData);
        
        // Simular download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gebco_bathymetry_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Obtém referência do mapa atual (helper)
     */
    getCurrentMap() {
        // Assumindo que existe uma variável global 'map'
        return window.map || null;
    }

    /**
     * Obtém informações de profundidade para uma coordenada
     */
    async getDepthInfo(lat, lon) {
        try {
            const response = await fetch(`${this.gebcoWmsUrl}?service=WMS&request=GetFeatureInfo&query_layers=GEBCO_LATEST_SUB_ICE_TOPO&x=256&y=256&width=512&height=512&info_format=application/json&bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&srs=EPSG:4326`);
            
            if (response.ok) {
                const data = await response.json();
                return {
                    coordinates: [lat, lon],
                    depth: data.features?.[0]?.properties?.value || null,
                    source: 'GEBCO 2023',
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            console.warn('❌ Erro ao obter informações de profundidade:', error);
        }
        
        return null;
    }

    /**
     * Adiciona popup de informações de profundidade ao mapa
     */
    enableDepthPopup(map) {
        map.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            const depthInfo = await this.getDepthInfo(lat, lng);
            
            if (depthInfo && depthInfo.depth !== null) {
                const depth = Math.round(depthInfo.depth);
                const depthText = depth >= 0 ? `+${depth}m (elevação)` : `${depth}m (profundidade)`;
                
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent(`
                        <div style="text-align: center; min-width: 150px;">
                            <h4 style="margin: 0 0 8px 0; color: #0D47A1;">🌊 GEBCO Bathymetry</h4>
                            <div style="font-size: 18px; font-weight: bold; color: ${depth >= 0 ? '#28a745' : '#0D47A1'};">
                                ${depthText}
                            </div>
                            <div style="font-size: 11px; color: #6c757d; margin-top: 4px;">
                                Lat: ${lat.toFixed(4)}°<br>
                                Lon: ${lng.toFixed(4)}°<br>
                                Fonte: GEBCO 2023
                            </div>
                        </div>
                    `)
                    .openOn(map);
            }
        });
        
        console.log('✅ Popup de profundidade ativado');
    }
}

// Exporta para uso global
window.GEBCOBathymetry = GEBCOBathymetry;

console.log('✅ GEBCO Bathymetry carregado e pronto para uso');
