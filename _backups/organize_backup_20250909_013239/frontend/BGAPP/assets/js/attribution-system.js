/**
 * Advanced Attribution System for BGAPP
 * Sistema robusto de atribuição conforme padrões EOX::Maps
 * Gerenciamento centralizado de créditos e licenças
 */

class AttributionSystem {
    constructor() {
        this.attributions = new Map();
        this.activeAttributions = new Set();
        this.controlElement = null;
        this.isExpanded = false;
        
        this.initializeStandardAttributions();
    }

    /**
     * Inicializa atribuições padrão baseadas no EOX::Maps
     */
    initializeStandardAttributions() {
        // EOX Maps
        this.addAttribution('eox-base', {
            text: '© EOX IT Services GmbH',
            url: 'https://maps.eox.at',
            license: 'Custom',
            description: 'EOX Maps services and rendering'
        });

        // Sentinel-2
        this.addAttribution('sentinel2', {
            text: '© European Union, Copernicus Sentinel-2',
            url: 'https://sentinel.esa.int/web/sentinel/missions/sentinel-2',
            license: 'Open',
            description: 'Sentinel-2 cloudless imagery by EOX (Contains modified Copernicus Sentinel data)'
        });

        // OpenStreetMap
        this.addAttribution('osm', {
            text: '© OpenStreetMap contributors',
            url: 'https://www.openstreetmap.org/copyright',
            license: 'ODbL',
            description: 'OpenStreetMap data and rendering'
        });

        // GEBCO
        this.addAttribution('gebco', {
            text: '© GEBCO Bathymetric Compilation Group 2023',
            url: 'https://www.gebco.net',
            license: 'Open',
            description: 'Global bathymetric data from GEBCO'
        });

        // NASA Earth Observatory
        this.addAttribution('nasa-blue-marble', {
            text: '© NASA Earth Observatory - Blue Marble',
            url: 'https://earthobservatory.nasa.gov/features/BlueMarble',
            license: 'Public Domain',
            description: 'Blue Marble global imagery'
        });

        this.addAttribution('nasa-black-marble', {
            text: '© NASA Earth Observatory - Black Marble',
            url: 'https://earthobservatory.nasa.gov/features/NightLights',
            license: 'Public Domain',
            description: 'Black Marble nighttime imagery'
        });

        // Terrain Data
        this.addAttribution('srtm', {
            text: '© NASA SRTM',
            url: 'https://www2.jpl.nasa.gov/srtm/',
            license: 'Public Domain',
            description: 'Shuttle Radar Topography Mission elevation data'
        });

        this.addAttribution('eudem', {
            text: '© European Union, Copernicus EUDEM',
            url: 'https://land.copernicus.eu/imagery-in-situ/eu-dem',
            license: 'Open',
            description: 'European Digital Elevation Model'
        });

        this.addAttribution('aster-gdem', {
            text: '© METI & NASA ASTER GDEM',
            url: 'https://asterweb.jpl.nasa.gov/gdem.asp',
            license: 'Open',
            description: 'Advanced Spaceborne Thermal Emission and Reflection Radiometer Global Digital Elevation Model'
        });

        // Natural Earth
        this.addAttribution('natural-earth', {
            text: '© Natural Earth',
            url: 'https://www.naturalearthdata.com',
            license: 'Public Domain',
            description: 'Natural Earth vector and raster map data'
        });

        // BGAPP
        this.addAttribution('bgapp', {
            text: '© BGAPP Angola - Blue Growth Application',
            url: '#',
            license: 'Proprietary',
            description: 'Blue Growth Application for Angola marine resources'
        });

        console.log('✅ Sistema de atribuição inicializado com', this.attributions.size, 'fontes');
    }

    /**
     * Adiciona nova atribuição
     */
    addAttribution(id, attribution) {
        this.attributions.set(id, {
            id,
            text: attribution.text,
            url: attribution.url || '#',
            license: attribution.license || 'Unknown',
            description: attribution.description || '',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Ativa uma atribuição
     */
    activateAttribution(id) {
        if (this.attributions.has(id)) {
            this.activeAttributions.add(id);
            this.updateControl();
            console.log(`✅ Atribuição ativada: ${id}`);
        }
    }

    /**
     * Desativa uma atribuição
     */
    deactivateAttribution(id) {
        this.activeAttributions.delete(id);
        this.updateControl();
        console.log(`❌ Atribuição desativada: ${id}`);
    }

    /**
     * Cria controle de atribuição avançado
     */
    createAttributionControl(map) {
        const control = L.control({ position: 'bottomleft' });
        
        control.onAdd = function() {
            const div = L.DomUtil.create('div', 'advanced-attribution-control');
            this.controlElement = div;
            
            div.innerHTML = this.generateControlHTML();
            
            // Previne propagação de eventos
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            
            return div;
        }.bind(this);
        
        control.addTo(map);
        this.setupControlEvents();
        
        return control;
    }

    /**
     * Gera HTML do controle
     */
    generateControlHTML() {
        const activeAttrs = Array.from(this.activeAttributions)
            .map(id => this.attributions.get(id))
            .filter(attr => attr);

        const compactText = activeAttrs
            .map(attr => attr.text)
            .join(' | ');

        return `
            <div class="attribution-compact" ${!this.isExpanded ? 'style="display: block"' : 'style="display: none"'}>
                <button class="attribution-toggle" onclick="window.attributionSystem?.toggleExpanded()">
                    ℹ️
                </button>
                <span class="attribution-text">${compactText}</span>
            </div>
            <div class="attribution-expanded" ${this.isExpanded ? 'style="display: block"' : 'style="display: none"'}>
                <div class="attribution-header">
                    <h4>📄 Atribuições e Licenças</h4>
                    <button class="attribution-close" onclick="window.attributionSystem?.toggleExpanded()">×</button>
                </div>
                <div class="attribution-content">
                    ${this.generateExpandedContent()}
                </div>
                <div class="attribution-footer">
                    <button class="attribution-export-btn" onclick="window.attributionSystem?.exportAttributions()">
                        📤 Exportar Créditos
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Gera conteúdo expandido das atribuições
     */
    generateExpandedContent() {
        const activeAttrs = Array.from(this.activeAttributions)
            .map(id => this.attributions.get(id))
            .filter(attr => attr);

        if (activeAttrs.length === 0) {
            return '<p class="no-attributions">Nenhuma atribuição ativa</p>';
        }

        return activeAttrs.map(attr => `
            <div class="attribution-item">
                <div class="attribution-main">
                    <span class="attribution-source">
                        ${attr.url !== '#' ? `<a href="${attr.url}" target="_blank">${attr.text}</a>` : attr.text}
                    </span>
                    <span class="attribution-license license-${attr.license.toLowerCase().replace(/\s+/g, '-')}">
                        ${attr.license}
                    </span>
                </div>
                ${attr.description ? `<div class="attribution-description">${attr.description}</div>` : ''}
            </div>
        `).join('');
    }

    /**
     * Alterna estado expandido
     */
    toggleExpanded() {
        this.isExpanded = !this.isExpanded;
        this.updateControl();
    }

    /**
     * Atualiza controle visual
     */
    updateControl() {
        if (this.controlElement) {
            this.controlElement.innerHTML = this.generateControlHTML();
        }
    }

    /**
     * Configura eventos do controle
     */
    setupControlEvents() {
        // Adicionar estilos CSS
        this.injectAttributionStyles();
        
        // Tornar sistema disponível globalmente
        window.attributionSystem = this;
    }

    /**
     * Injeta estilos CSS para o sistema de atribuição
     */
    injectAttributionStyles() {
        if (document.getElementById('attribution-system-styles')) return;
        
        const styles = `
            <style id="attribution-system-styles">
            .advanced-attribution-control {
                font-family: 'Segoe UI', system-ui, sans-serif;
                max-width: 600px;
            }

            .attribution-compact {
                background: rgba(255, 255, 255, 0.9);
                padding: 4px 8px;
                border-radius: 4px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 6px;
                backdrop-filter: blur(5px);
            }

            .attribution-toggle {
                background: none;
                border: none;
                font-size: 12px;
                cursor: pointer;
                padding: 2px;
                border-radius: 2px;
                transition: background 0.2s;
            }

            .attribution-toggle:hover {
                background: rgba(0,0,0,0.1);
            }

            .attribution-text {
                font-size: 10px;
                color: #333;
                line-height: 1.2;
                max-width: 400px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .attribution-expanded {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                backdrop-filter: blur(10px);
                max-height: 400px;
                overflow: hidden;
            }

            .attribution-header {
                background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
                color: white;
                padding: 10px 12px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .attribution-header h4 {
                margin: 0;
                font-size: 12px;
                font-weight: 600;
            }

            .attribution-close {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
                padding: 2px 6px;
                border-radius: 3px;
                transition: background 0.2s;
            }

            .attribution-close:hover {
                background: rgba(255,255,255,0.2);
            }

            .attribution-content {
                padding: 12px;
                max-height: 280px;
                overflow-y: auto;
            }

            .attribution-item {
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e1e8ed;
            }

            .attribution-item:last-child {
                margin-bottom: 0;
                border-bottom: none;
            }

            .attribution-main {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
            }

            .attribution-source {
                font-size: 11px;
                font-weight: 500;
            }

            .attribution-source a {
                color: #2980b9;
                text-decoration: none;
            }

            .attribution-source a:hover {
                text-decoration: underline;
            }

            .attribution-license {
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .license-open {
                background: #d4edda;
                color: #155724;
            }

            .license-public-domain {
                background: #cce5ff;
                color: #004085;
            }

            .license-odbl {
                background: #fff3cd;
                color: #856404;
            }

            .license-custom {
                background: #f8d7da;
                color: #721c24;
            }

            .license-proprietary {
                background: #e2e3e5;
                color: #383d41;
            }

            .attribution-description {
                font-size: 10px;
                color: #6c757d;
                line-height: 1.3;
                margin-left: 8px;
            }

            .attribution-footer {
                padding: 8px 12px;
                border-top: 1px solid #e1e8ed;
                background: #f8f9fa;
                border-radius: 0 0 8px 8px;
            }

            .attribution-export-btn {
                width: 100%;
                padding: 6px 12px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s;
            }

            .attribution-export-btn:hover {
                background: #5a6268;
            }

            .no-attributions {
                text-align: center;
                color: #6c757d;
                font-size: 11px;
                font-style: italic;
                padding: 20px;
            }

            @media (max-width: 768px) {
                .advanced-attribution-control {
                    max-width: 300px;
                }
                
                .attribution-text {
                    max-width: 200px;
                }
                
                .attribution-main {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Exporta atribuições ativas
     */
    exportAttributions() {
        const activeAttrs = Array.from(this.activeAttributions)
            .map(id => this.attributions.get(id))
            .filter(attr => attr);

        const exportData = {
            title: 'BGAPP - Atribuições e Licenças',
            timestamp: new Date().toISOString(),
            totalSources: activeAttrs.length,
            attributions: activeAttrs,
            licensesSummary: this.getLicensesSummary(activeAttrs),
            usage: 'Este arquivo contém todas as atribuições e licenças dos dados utilizados no BGAPP.'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bgapp_attributions_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('📤 Atribuições exportadas:', exportData);
    }

    /**
     * Gera resumo de licenças
     */
    getLicensesSummary(attributions) {
        const licenses = {};
        attributions.forEach(attr => {
            licenses[attr.license] = (licenses[attr.license] || 0) + 1;
        });
        return licenses;
    }

    /**
     * Configura atribuições automáticas baseadas nas camadas ativas
     */
    setupAutoAttributions(eoxManager) {
        // Mapear camadas para atribuições
        const layerAttributionMap = {
            'terrain-light': ['eox-base', 'osm', 'natural-earth'],
            'sentinel2-2024': ['sentinel2', 'eox-base'],
            'sentinel2-2023': ['sentinel2', 'eox-base'],
            'osm': ['osm'],
            'blue-marble': ['nasa-blue-marble', 'eox-base'],
            'black-marble': ['nasa-black-marble', 'eox-base'],
            'terrain': ['srtm', 'eudem', 'eox-base'],
            'bathymetry': ['gebco', 'eox-base']
        };

        // Ativar atribuição BGAPP sempre
        this.activateAttribution('bgapp');

        // Monitorar mudanças de camadas (simulado)
        const originalSetBackground = eoxManager.setBackgroundLayer.bind(eoxManager);
        eoxManager.setBackgroundLayer = (map, layerKey) => {
            const result = originalSetBackground(map, layerKey);
            
            if (result && layerAttributionMap[layerKey]) {
                // Limpar atribuições anteriores (exceto BGAPP)
                this.activeAttributions.forEach(id => {
                    if (id !== 'bgapp') {
                        this.deactivateAttribution(id);
                    }
                });
                
                // Ativar novas atribuições
                layerAttributionMap[layerKey].forEach(attrId => {
                    this.activateAttribution(attrId);
                });
            }
            
            return result;
        };

        console.log('✅ Sistema de atribuições automáticas configurado');
    }
}

// Exporta para uso global
window.AttributionSystem = AttributionSystem;

console.log('✅ Sistema de Atribuição carregado e pronto para uso');
