/**
 * Advanced Projection Manager for BGAPP
 * Sistema de suporte a projeções customizadas inspirado no EOX::Maps
 * Integração com Proj4js para transformações de coordenadas
 */

class ProjectionManager {
    constructor() {
        this.availableProjections = new Map();
        this.currentProjection = 'EPSG:4326'; // WGS84 padrão
        this.customProjections = new Map();
        
        this.initializeStandardProjections();
        this.loadProj4Library();
    }

    /**
     * Carrega biblioteca Proj4js dinamicamente
     */
    async loadProj4Library() {
        if (window.proj4) {
            console.log('✅ Proj4js já carregado');
            this.setupProjections();
            return;
        }

        try {
            // Carregar Proj4js
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.9.0/proj4.min.js';
            script.onload = () => {
                console.log('✅ Proj4js carregado com sucesso');
                this.setupProjections();
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('❌ Erro ao carregar Proj4js:', error);
        }
    }

    /**
     * Inicializa projeções padrão
     */
    initializeStandardProjections() {
        // === PROJEÇÕES GLOBAIS ===
        this.availableProjections.set('EPSG:4326', {
            name: '🌍 WGS84 Geographic',
            description: 'Sistema de coordenadas geográficas mundial (lat/lon)',
            type: 'geographic',
            unit: 'degrees',
            extent: [-180, -90, 180, 90],
            suitable_for: ['global', 'web_mapping'],
            proj4_def: '+proj=longlat +datum=WGS84 +no_defs'
        });

        this.availableProjections.set('EPSG:3857', {
            name: '🗺️ Web Mercator',
            description: 'Projeção Mercator para mapas web (Google, OSM)',
            type: 'projected',
            unit: 'meters',
            extent: [-20037508.34, -20048966.1, 20037508.34, 20048966.1],
            suitable_for: ['web_mapping', 'global'],
            proj4_def: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs'
        });

        // === PROJEÇÕES AFRICANAS ===
        this.availableProjections.set('EPSG:32733', {
            name: '🌍 UTM Zone 33S (Angola)',
            description: 'Universal Transverse Mercator Zona 33 Sul - Ideal para Angola',
            type: 'projected',
            unit: 'meters',
            extent: [12, -80, 18, 0],
            suitable_for: ['angola', 'southern_africa', 'precise_mapping'],
            proj4_def: '+proj=utm +zone=33 +south +datum=WGS84 +units=m +no_defs'
        });

        this.availableProjections.set('EPSG:32732', {
            name: '🌍 UTM Zone 32S',
            description: 'Universal Transverse Mercator Zona 32 Sul',
            type: 'projected',
            unit: 'meters',
            extent: [6, -80, 12, 0],
            suitable_for: ['west_africa', 'precise_mapping'],
            proj4_def: '+proj=utm +zone=32 +south +datum=WGS84 +units=m +no_defs'
        });

        // === PROJEÇÕES MARINHAS ===
        this.availableProjections.set('EPSG:3395', {
            name: '🌊 World Mercator',
            description: 'Projeção Mercator mundial para dados marinhos',
            type: 'projected',
            unit: 'meters',
            extent: [-20037508.34, -15496570.74, 20037508.34, 18764656.23],
            suitable_for: ['marine', 'oceanographic', 'global'],
            proj4_def: '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
        });

        // === PROJEÇÕES POLARES ===
        this.availableProjections.set('EPSG:3031', {
            name: '❄️ Antarctic Polar Stereographic',
            description: 'Projeção estereográfica polar antártica',
            type: 'projected',
            unit: 'meters',
            extent: [-4194304, -4194304, 4194304, 4194304],
            suitable_for: ['antarctic', 'polar', 'scientific'],
            proj4_def: '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
        });

        console.log('✅ Projeções padrão inicializadas:', this.availableProjections.size);
    }

    /**
     * Configura projeções no Proj4js
     */
    setupProjections() {
        if (!window.proj4) return;

        this.availableProjections.forEach((proj, epsg) => {
            try {
                window.proj4.defs(epsg, proj.proj4_def);
                console.log(`✅ Projeção registrada: ${epsg}`);
            } catch (error) {
                console.warn(`❌ Erro ao registrar projeção ${epsg}:`, error);
            }
        });
    }

    /**
     * Cria controle de projeções
     */
    createProjectionControl(map) {
        const control = L.control({ position: 'bottomright' });
        
        control.onAdd = function() {
            const div = L.DomUtil.create('div', 'projection-control');
            div.innerHTML = `
                <div class="projection-header">
                    <h4>📐 Projeções</h4>
                    <button class="projection-toggle-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
                </div>
                <div class="projection-content">
                    <div class="current-projection">
                        <label>Projeção Atual:</label>
                        <div class="current-proj-display">
                            <span class="proj-code">${this.currentProjection}</span>
                            <span class="proj-name">${this.availableProjections.get(this.currentProjection)?.name || 'Unknown'}</span>
                        </div>
                    </div>
                    
                    <div class="projection-categories">
                        ${this.generateProjectionCategories()}
                    </div>
                    
                    <div class="projection-tools">
                        <button class="proj-tool-btn" onclick="window.projectionManager?.showCoordinateConverter()">
                            🔄 Converter Coordenadas
                        </button>
                        <button class="proj-tool-btn" onclick="window.projectionManager?.addCustomProjection()">
                            ➕ Adicionar Personalizada
                        </button>
                    </div>
                    
                    <div class="projection-info">
                        <div class="info-item">
                            <span class="info-label">Unidade:</span>
                            <span class="info-value">${this.availableProjections.get(this.currentProjection)?.unit || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Tipo:</span>
                            <span class="info-value">${this.availableProjections.get(this.currentProjection)?.type || 'N/A'}</span>
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
        
        // Adicionar estilos e eventos
        this.injectProjectionStyles();
        this.setupProjectionEvents(map);
        
        return control;
    }

    /**
     * Gera categorias de projeções
     */
    generateProjectionCategories() {
        const categories = {
            'global': '🌍 Globais',
            'africa': '🌍 África',
            'marine': '🌊 Marinhas',
            'polar': '❄️ Polares',
            'custom': '⚙️ Personalizadas'
        };

        let html = '';
        
        Object.entries(categories).forEach(([category, title]) => {
            const projections = this.getProjectionsByCategory(category);
            if (projections.length > 0) {
                html += `
                    <div class="proj-category">
                        <h5>${title}</h5>
                        <div class="proj-list">
                            ${projections.map(([epsg, proj]) => `
                                <div class="proj-item ${this.currentProjection === epsg ? 'active' : ''}" 
                                     data-epsg="${epsg}">
                                    <div class="proj-main">
                                        <span class="proj-code">${epsg}</span>
                                        <span class="proj-name">${proj.name}</span>
                                    </div>
                                    <div class="proj-desc">${proj.description}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        return html;
    }

    /**
     * Obtém projeções por categoria
     */
    getProjectionsByCategory(category) {
        const categoryMap = {
            'global': ['EPSG:4326', 'EPSG:3857', 'EPSG:3395'],
            'africa': ['EPSG:32733', 'EPSG:32732'],
            'marine': ['EPSG:3395'],
            'polar': ['EPSG:3031'],
            'custom': Array.from(this.customProjections.keys())
        };

        const epsgCodes = categoryMap[category] || [];
        return epsgCodes
            .map(epsg => [epsg, this.availableProjections.get(epsg) || this.customProjections.get(epsg)])
            .filter(([, proj]) => proj);
    }

    /**
     * Injeta estilos CSS
     */
    injectProjectionStyles() {
        if (document.getElementById('projection-styles')) return;
        
        const styles = `
            <style id="projection-styles">
            .projection-control {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 0;
                min-width: 300px;
                max-width: 350px;
                backdrop-filter: blur(10px);
                font-family: 'Segoe UI', system-ui, sans-serif;
                transition: all 0.3s ease;
                max-height: 500px;
                overflow: hidden;
            }

            .projection-control.collapsed .projection-content {
                display: none;
            }

            .projection-header {
                background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .projection-header h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }

            .projection-toggle-btn {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
                padding: 2px 6px;
                border-radius: 3px;
                transition: background 0.2s;
            }

            .projection-toggle-btn:hover {
                background: rgba(255,255,255,0.2);
            }

            .projection-content {
                padding: 16px;
                max-height: 420px;
                overflow-y: auto;
            }

            .current-projection {
                margin-bottom: 16px;
                padding: 12px;
                background: #f8f9fa;
                border-radius: 6px;
                border-left: 4px solid #6c5ce7;
            }

            .current-projection label {
                display: block;
                font-size: 11px;
                font-weight: 600;
                color: #495057;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .current-proj-display {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .proj-code {
                background: #6c5ce7;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 600;
                font-family: monospace;
            }

            .proj-name {
                font-size: 12px;
                font-weight: 500;
                color: #2d3436;
            }

            .proj-category {
                margin-bottom: 16px;
            }

            .proj-category h5 {
                margin: 0 0 8px 0;
                font-size: 11px;
                font-weight: 600;
                color: #34495e;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding-bottom: 4px;
                border-bottom: 1px solid #e1e8ed;
            }

            .proj-item {
                padding: 8px 10px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-bottom: 4px;
                border: 1px solid transparent;
            }

            .proj-item:hover {
                background: #f1f3f4;
                border-color: #6c5ce7;
            }

            .proj-item.active {
                background: rgba(108, 92, 231, 0.1);
                border-color: #6c5ce7;
            }

            .proj-main {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 2px;
            }

            .proj-item .proj-code {
                font-size: 9px;
                padding: 1px 4px;
            }

            .proj-item .proj-name {
                font-size: 11px;
                font-weight: 500;
            }

            .proj-desc {
                font-size: 10px;
                color: #6c757d;
                line-height: 1.3;
                margin-left: 20px;
            }

            .projection-tools {
                margin: 16px 0;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .proj-tool-btn {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                background: white;
                color: #495057;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
            }

            .proj-tool-btn:hover {
                border-color: #6c5ce7;
                background: #f8f9fa;
                color: #6c5ce7;
            }

            .projection-info {
                border-top: 1px solid #e1e8ed;
                padding-top: 12px;
                margin-top: 12px;
            }

            .info-item {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                margin-bottom: 4px;
            }

            .info-label {
                color: #6c757d;
                font-weight: 500;
            }

            .info-value {
                color: #2c3e50;
                font-weight: 600;
            }

            @media (max-width: 768px) {
                .projection-control {
                    min-width: 250px;
                    max-width: 280px;
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Configura eventos do controle
     */
    setupProjectionEvents(map) {
        // Seleção de projeções
        document.addEventListener('click', (e) => {
            if (e.target.closest('.proj-item')) {
                const projItem = e.target.closest('.proj-item');
                const epsg = projItem.dataset.epsg;
                this.changeProjection(map, epsg);
            }
        });

        // Tornar disponível globalmente
        window.projectionManager = this;
    }

    /**
     * Muda projeção do mapa
     */
    changeProjection(map, newEpsg) {
        if (!window.proj4) {
            console.warn('❌ Proj4js não está disponível');
            return;
        }

        const projection = this.availableProjections.get(newEpsg) || this.customProjections.get(newEpsg);
        if (!projection) {
            console.warn(`❌ Projeção não encontrada: ${newEpsg}`);
            return;
        }

        try {
            // Salvar estado atual
            const currentCenter = map.getCenter();
            const currentZoom = map.getZoom();

            // Transformar coordenadas se necessário
            let newCenter = currentCenter;
            if (this.currentProjection !== newEpsg) {
                const transformed = window.proj4(this.currentProjection, newEpsg, [currentCenter.lng, currentCenter.lat]);
                newCenter = L.latLng(transformed[1], transformed[0]);
            }

            // Atualizar projeção atual
            this.currentProjection = newEpsg;

            // Atualizar interface
            this.updateProjectionDisplay();

            console.log(`✅ Projeção alterada para: ${newEpsg}`);
            console.log(`📍 Centro transformado:`, newCenter);

        } catch (error) {
            console.error('❌ Erro ao alterar projeção:', error);
        }
    }

    /**
     * Atualiza display da projeção atual
     */
    updateProjectionDisplay() {
        const currentDisplay = document.querySelector('.current-proj-display');
        if (currentDisplay) {
            const projection = this.availableProjections.get(this.currentProjection) || this.customProjections.get(this.currentProjection);
            currentDisplay.innerHTML = `
                <span class="proj-code">${this.currentProjection}</span>
                <span class="proj-name">${projection?.name || 'Unknown'}</span>
            `;
        }

        // Atualizar informações
        const infoItems = document.querySelectorAll('.info-value');
        if (infoItems.length >= 2) {
            const projection = this.availableProjections.get(this.currentProjection) || this.customProjections.get(this.currentProjection);
            infoItems[0].textContent = projection?.unit || 'N/A';
            infoItems[1].textContent = projection?.type || 'N/A';
        }

        // Atualizar itens ativos
        document.querySelectorAll('.proj-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.epsg === this.currentProjection) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Mostra conversor de coordenadas
     */
    showCoordinateConverter() {
        const converterHTML = `
            <div id="coordinate-converter" class="coordinate-converter">
                <div class="converter-header">
                    <h4>🔄 Conversor de Coordenadas</h4>
                    <button onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="converter-content">
                    <div class="converter-section">
                        <label>Projeção Origem:</label>
                        <select id="source-projection">
                            ${Array.from(this.availableProjections.entries()).map(([epsg, proj]) => `
                                <option value="${epsg}" ${epsg === this.currentProjection ? 'selected' : ''}>${epsg} - ${proj.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="converter-section">
                        <label>Coordenadas Origem:</label>
                        <div class="coord-inputs">
                            <input type="number" id="source-x" placeholder="X / Longitude" step="any">
                            <input type="number" id="source-y" placeholder="Y / Latitude" step="any">
                        </div>
                    </div>
                    
                    <div class="converter-section">
                        <label>Projeção Destino:</label>
                        <select id="target-projection">
                            ${Array.from(this.availableProjections.entries()).map(([epsg, proj]) => `
                                <option value="${epsg}">${epsg} - ${proj.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="converter-section">
                        <label>Coordenadas Convertidas:</label>
                        <div class="coord-outputs">
                            <input type="text" id="target-x" readonly>
                            <input type="text" id="target-y" readonly>
                        </div>
                    </div>
                    
                    <button onclick="window.projectionManager?.convertCoordinates()" class="convert-btn">
                        🔄 Converter
                    </button>
                </div>
            </div>
        `;

        // Remover conversor existente
        const existing = document.getElementById('coordinate-converter');
        if (existing) existing.remove();

        // Adicionar novo conversor
        document.body.insertAdjacentHTML('beforeend', converterHTML);

        // Adicionar estilos se necessário
        this.injectConverterStyles();
    }

    /**
     * Converte coordenadas
     */
    convertCoordinates() {
        if (!window.proj4) return;

        const sourceProj = document.getElementById('source-projection').value;
        const targetProj = document.getElementById('target-projection').value;
        const sourceX = parseFloat(document.getElementById('source-x').value);
        const sourceY = parseFloat(document.getElementById('source-y').value);

        if (isNaN(sourceX) || isNaN(sourceY)) {
            alert('❌ Por favor, insira coordenadas válidas');
            return;
        }

        try {
            const result = window.proj4(sourceProj, targetProj, [sourceX, sourceY]);
            
            document.getElementById('target-x').value = result[0].toFixed(6);
            document.getElementById('target-y').value = result[1].toFixed(6);

            console.log(`✅ Conversão: ${sourceProj} → ${targetProj}`, [sourceX, sourceY], '→', result);
        } catch (error) {
            console.error('❌ Erro na conversão:', error);
            alert('❌ Erro na conversão de coordenadas');
        }
    }

    /**
     * Adiciona projeção personalizada
     */
    addCustomProjection() {
        const projectionHTML = `
            <div id="custom-projection-dialog" class="custom-projection-dialog">
                <div class="dialog-header">
                    <h4>➕ Adicionar Projeção Personalizada</h4>
                    <button onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="dialog-content">
                    <div class="form-group">
                        <label>Código EPSG:</label>
                        <input type="text" id="custom-epsg" placeholder="Ex: EPSG:4326">
                    </div>
                    
                    <div class="form-group">
                        <label>Nome:</label>
                        <input type="text" id="custom-name" placeholder="Ex: WGS84 Geographic">
                    </div>
                    
                    <div class="form-group">
                        <label>Descrição:</label>
                        <textarea id="custom-description" placeholder="Descrição da projeção..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Definição Proj4:</label>
                        <textarea id="custom-proj4" placeholder="+proj=longlat +datum=WGS84 +no_defs"></textarea>
                    </div>
                    
                    <button onclick="window.projectionManager?.saveCustomProjection()" class="save-btn">
                        💾 Salvar Projeção
                    </button>
                </div>
            </div>
        `;

        // Remover dialog existente
        const existing = document.getElementById('custom-projection-dialog');
        if (existing) existing.remove();

        // Adicionar novo dialog
        document.body.insertAdjacentHTML('beforeend', projectionHTML);

        // Adicionar estilos se necessário
        this.injectDialogStyles();
    }

    /**
     * Salva projeção personalizada
     */
    saveCustomProjection() {
        const epsg = document.getElementById('custom-epsg').value.trim();
        const name = document.getElementById('custom-name').value.trim();
        const description = document.getElementById('custom-description').value.trim();
        const proj4Def = document.getElementById('custom-proj4').value.trim();

        if (!epsg || !name || !proj4Def) {
            alert('❌ Por favor, preencha todos os campos obrigatórios');
            return;
        }

        try {
            // Testar definição Proj4
            window.proj4.defs(epsg, proj4Def);

            // Adicionar à lista de projeções customizadas
            this.customProjections.set(epsg, {
                name: `⚙️ ${name}`,
                description: description || 'Projeção personalizada',
                type: 'custom',
                unit: 'unknown',
                proj4_def: proj4Def,
                custom: true
            });

            console.log(`✅ Projeção personalizada adicionada: ${epsg}`);
            
            // Fechar dialog
            document.getElementById('custom-projection-dialog').remove();
            
            // Atualizar controle (recriar)
            // Isso seria implementado recarregando o controle

        } catch (error) {
            console.error('❌ Erro ao salvar projeção:', error);
            alert('❌ Definição Proj4 inválida');
        }
    }

    /**
     * Injeta estilos para conversor
     */
    injectConverterStyles() {
        if (document.getElementById('converter-styles')) return;
        
        const styles = `
            <style id="converter-styles">
            .coordinate-converter, .custom-projection-dialog {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                z-index: 10000;
                min-width: 400px;
                max-width: 500px;
            }

            .converter-header, .dialog-header {
                background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .converter-header h4, .dialog-header h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }

            .converter-header button, .dialog-header button {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 2px 6px;
                border-radius: 3px;
            }

            .converter-content, .dialog-content {
                padding: 20px;
            }

            .converter-section, .form-group {
                margin-bottom: 16px;
            }

            .converter-section label, .form-group label {
                display: block;
                font-size: 12px;
                font-weight: 600;
                color: #495057;
                margin-bottom: 6px;
            }

            .converter-section select, .form-group input, .form-group textarea {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                font-size: 12px;
            }

            .coord-inputs, .coord-outputs {
                display: flex;
                gap: 8px;
            }

            .coord-inputs input, .coord-outputs input {
                flex: 1;
            }

            .convert-btn, .save-btn {
                width: 100%;
                padding: 10px 16px;
                background: #6c5ce7;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            }

            .convert-btn:hover, .save-btn:hover {
                background: #5b4cdb;
            }

            .form-group textarea {
                min-height: 60px;
                resize: vertical;
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Injeta estilos para dialogs
     */
    injectDialogStyles() {
        this.injectConverterStyles(); // Reutiliza os mesmos estilos
    }

    /**
     * Obtém informações da projeção atual
     */
    getCurrentProjectionInfo() {
        return {
            epsg: this.currentProjection,
            projection: this.availableProjections.get(this.currentProjection) || this.customProjections.get(this.currentProjection),
            isCustom: this.customProjections.has(this.currentProjection)
        };
    }
}

// Exporta para uso global
window.ProjectionManager = ProjectionManager;

console.log('✅ Projection Manager carregado e pronto para uso');
