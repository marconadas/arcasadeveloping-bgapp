/**
 * 🌐 DECK.GL INTEGRATION - BGAPP Scientific Dashboard
 * Advanced geospatial visualization using deck.gl WebGL2 framework
 * 
 * Features:
 * - High-performance large-scale data visualization
 * - Interactive event handling (picking, highlighting, filtering)
 * - Cartographic projections and basemap integration
 * - Custom layers for oceanographic data
 * - WebGL2/WebGPU powered rendering
 * - Integration with existing BGAPP systems
 */

class DeckGLIntegration {
    constructor() {
        this.deck = null;
        this.layers = [];
        this.viewState = {
            longitude: 13.2, // Angola center
            latitude: -8.8,
            zoom: 6,
            pitch: 0,
            bearing: 0
        };
        
        this.oceanographicData = [];
        this.speciesData = [];
        this.temperatureData = [];
        
        this.isInitialized = false;
        this.container = null;
        
        this.init();
    }
    
    async init() {
        console.log('🌐 Inicializando deck.gl Integration...');
        
        try {
            await this.loadDeckGL();
            this.setupContainer();
            this.initializeDeck();
            this.createLayers();
            this.setupEventHandlers();
            this.loadSampleData();
            
            this.isInitialized = true;
            console.log('✅ deck.gl Integration inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização do deck.gl:', error);
        }
    }
    
    async loadDeckGL() {
        // Load deck.gl from CDN
        const scripts = [
            'https://unpkg.com/deck.gl@latest/dist.min.js',
            'https://unpkg.com/@loaders.gl/core@latest/dist/dist.min.js',
            'https://unpkg.com/@loaders.gl/csv@latest/dist/dist.min.js'
        ];
        
        for (const script of scripts) {
            await this.loadScript(script);
        }
        
        // Wait for deck global to be available
        return new Promise((resolve) => {
            const checkDeck = () => {
                if (typeof deck !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkDeck, 100);
                }
            };
            checkDeck();
        });
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    setupContainer() {
        // Find or create container for deck.gl
        this.container = document.getElementById('deckgl-container');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'deckgl-container';
            this.container.style.cssText = `
                position: relative;
                width: 100%;
                height: 600px;
                border-radius: 12px;
                overflow: hidden;
                background: #001122;
                margin: 20px 0;
                border: 2px solid #00d4ff;
                box-shadow: 0 8px 32px rgba(0, 212, 255, 0.3);
            `;
            
            // Add to existing visualization area or create new section
            const targetContainer = document.querySelector('.visualization-section') || 
                                  document.querySelector('.container-fluid') ||
                                  document.body;
            
            targetContainer.appendChild(this.container);
        }
    }
    
    initializeDeck() {
        if (typeof deck === 'undefined') {
            console.error('deck.gl não está disponível');
            return;
        }
        
        this.deck = new deck.DeckGL({
            container: this.container,
            initialViewState: this.viewState,
            controller: true,
            layers: this.layers,
            onViewStateChange: ({viewState}) => {
                this.viewState = viewState;
                // Remove updateLayers call to prevent error
            },
            onClick: (info) => this.handleClick(info),
            onHover: (info) => this.handleHover(info),
            getTooltip: ({object}) => this.getTooltip(object)
        });
    }
    
    createLayers() {
        this.layers = [
            // Base ocean layer
            this.createOceanLayer(),
            // Oceanographic data points
            this.createOceanographicLayer(),
            // Species distribution
            this.createSpeciesLayer(),
            // Temperature heatmap
            this.createTemperatureLayer(),
            // Current vectors
            this.createCurrentsLayer()
        ];
        
        if (this.deck) {
            this.deck.setProps({layers: this.layers});
        }
    }
    
    createOceanLayer() {
        return new deck.TileLayer({
            id: 'ocean-base',
            data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            minZoom: 0,
            maxZoom: 19,
            tileSize: 256,
            renderSubLayers: props => {
                const {
                    bbox: {west, south, east, north}
                } = props.tile;
                
                return new deck.BitmapLayer(props, {
                    data: null,
                    image: props.data,
                    bounds: [west, south, east, north]
                });
            }
        });
    }
    
    createOceanographicLayer() {
        return new deck.ScatterplotLayer({
            id: 'oceanographic-data',
            data: this.oceanographicData,
            pickable: true,
            opacity: 0.8,
            stroked: true,
            filled: true,
            radiusScale: 100,
            radiusMinPixels: 3,
            radiusMaxPixels: 30,
            lineWidthMinPixels: 1,
            getPosition: d => [d.longitude, d.latitude],
            getRadius: d => d.depth * 0.1,
            getFillColor: d => this.getColorForParameter(d.parameter, d.value),
            getLineColor: [255, 255, 255, 100]
        });
    }
    
    createSpeciesLayer() {
        return new deck.ScatterplotLayer({
            id: 'species-distribution',
            data: this.speciesData,
            pickable: true,
            opacity: 0.8,
            stroked: true,
            filled: true,
            radiusScale: 100,
            radiusMinPixels: 3,
            radiusMaxPixels: 25,
            lineWidthMinPixels: 1,
            getPosition: d => [d.longitude, d.latitude],
            getRadius: d => d.abundance * 2,
            getFillColor: d => this.getColorForSpecies(d.species),
            getLineColor: [255, 255, 255, 100]
        });
    }
    
    getColorForSpecies(species) {
        const colors = {
            fish: [0, 170, 255, 200],
            whale: [0, 102, 204, 220],
            dolphin: [0, 153, 255, 210],
            turtle: [0, 204, 102, 190],
            coral: [255, 102, 0, 230]
        };
        return colors[species] || [128, 128, 128, 180];
    }
    
    createTemperatureLayer() {
        return new deck.HeatmapLayer({
            id: 'temperature-heatmap',
            data: this.temperatureData,
            getPosition: d => [d.longitude, d.latitude],
            getWeight: d => d.temperature,
            radiusPixels: 100,
            opacity: 0.6,
            colorRange: [
                [0, 0, 255, 25],      // Cold - Blue
                [0, 255, 255, 85],    // Cool - Cyan
                [0, 255, 0, 127],     // Moderate - Green
                [255, 255, 0, 170],   // Warm - Yellow
                [255, 0, 0, 255]      // Hot - Red
            ]
        });
    }
    
    createCurrentsLayer() {
        return new deck.LineLayer({
            id: 'ocean-currents',
            data: this.generateCurrentsData(),
            pickable: true,
            getSourcePosition: d => [d.startLon, d.startLat],
            getTargetPosition: d => [d.endLon, d.endLat],
            getColor: d => [0, 255, 255, 200],
            getWidth: d => d.strength * 2,
            widthMinPixels: 1,
            widthMaxPixels: 10
        });
    }
    
    getColorForParameter(parameter, value) {
        const normalizedValue = Math.min(Math.max(value, 0), 1);
        
        const colorMaps = {
            temperature: [
                [0, 0, 255],      // Cold
                [0, 255, 255],    // Cool
                [0, 255, 0],      // Moderate
                [255, 255, 0],    // Warm
                [255, 0, 0]       // Hot
            ],
            salinity: [
                [255, 0, 255],    // Low salinity
                [0, 0, 255],      // Medium
                [0, 255, 0],      // Normal
                [255, 255, 0],    // High
                [255, 0, 0]       // Very high
            ],
            oxygen: [
                [255, 0, 0],      // Low oxygen
                [255, 255, 0],    // Medium
                [0, 255, 0],      // Good
                [0, 255, 255],    // High
                [0, 0, 255]       // Very high
            ],
            ph: [
                [255, 0, 0],      // Acidic
                [255, 255, 0],    // Slightly acidic
                [0, 255, 0],      // Neutral
                [0, 255, 255],    // Slightly basic
                [0, 0, 255]       // Basic
            ]
        };
        
        const colors = colorMaps[parameter] || colorMaps.temperature;
        const index = Math.floor(normalizedValue * (colors.length - 1));
        const color = colors[index] || [128, 128, 128];
        
        return [...color, 200];
    }
    
    createSpeciesAtlas() {
        // Create a simple canvas-based icon atlas for species
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Draw different species icons
        const icons = ['fish', 'whale', 'dolphin', 'turtle', 'coral'];
        const iconSize = 24;
        
        icons.forEach((species, index) => {
            const x = (index % 4) * 32;
            const y = Math.floor(index / 4) * 32;
            
            ctx.fillStyle = this.getSpeciesColor(species);
            ctx.beginPath();
            ctx.arc(x + 16, y + 16, 12, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add species-specific shape
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(species[0].toUpperCase(), x + 16, y + 20);
        });
        
        return canvas.toDataURL();
    }
    
    getSpeciesIconMapping() {
        return {
            fish: {x: 0, y: 0, width: 32, height: 32},
            whale: {x: 32, y: 0, width: 32, height: 32},
            dolphin: {x: 64, y: 0, width: 32, height: 32},
            turtle: {x: 96, y: 0, width: 32, height: 32},
            coral: {x: 0, y: 32, width: 32, height: 32}
        };
    }
    
    getSpeciesColor(species) {
        const colors = {
            fish: '#00aaff',
            whale: '#0066cc',
            dolphin: '#0099ff',
            turtle: '#00cc66',
            coral: '#ff6600'
        };
        return colors[species] || '#888888';
    }
    
    generateCurrentsData() {
        const currents = [];
        
        // Generate sample ocean currents around Angola
        for (let i = 0; i < 20; i++) {
            const startLon = 7 + Math.random() * 7;   // 7°E a 14°E - Oceano Atlântico Angola
            const startLat = -18 + Math.random() * 12; // -18°S a -6°S - Costa angolana
            
            const direction = Math.random() * 2 * Math.PI;
            const distance = 0.5 + Math.random() * 2;
            
            currents.push({
                startLon,
                startLat,
                endLon: startLon + Math.cos(direction) * distance,
                endLat: startLat + Math.sin(direction) * distance,
                strength: 1 + Math.random() * 4,
                speed: 0.5 + Math.random() * 2
            });
        }
        
        return currents;
    }
    
    loadSampleData() {
        // Generate sample oceanographic data
        this.oceanographicData = this.generateOceanographicData();
        this.speciesData = this.generateSpeciesData();
        this.temperatureData = this.generateTemperatureData();
        
        // Update layers with new data
        this.createLayers();
    }
    
    generateOceanographicData() {
        const data = [];
        const parameters = ['temperature', 'salinity', 'oxygen', 'ph'];
        
        for (let i = 0; i < 200; i++) {
            data.push({
                id: i,
                longitude: 8 + Math.random() * 6,   // 8°E a 14°E - Oceano Atlântico Angola
                latitude: -18 + Math.random() * 12, // -18°S a -6°S - Costa angolana
                depth: Math.random() * 200,
                parameter: parameters[Math.floor(Math.random() * parameters.length)],
                value: Math.random(),
                timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            });
        }
        
        return data;
    }
    
    generateSpeciesData() {
        const data = [];
        const species = ['fish', 'whale', 'dolphin', 'turtle', 'coral'];
        
        for (let i = 0; i < 100; i++) {
            data.push({
                id: i,
                longitude: 10 + Math.random() * 8,
                latitude: -18 + Math.random() * 20,
                species: species[Math.floor(Math.random() * species.length)],
                abundance: 1 + Math.random() * 10,
                confidence: 0.5 + Math.random() * 0.5
            });
        }
        
        return data;
    }
    
    generateTemperatureData() {
        const data = [];
        
        for (let i = 0; i < 300; i++) {
            data.push({
                longitude: 6 + Math.random() * 8,   // 6°E a 14°E - Oceano Atlântico Angola
                latitude: -18 + Math.random() * 12, // -18°S a -6°S - Costa angolana
                temperature: 18 + Math.random() * 12  // 18-30°C range
            });
        }
        
        return data;
    }
    
    setupEventHandlers() {
        // Setup keyboard shortcuts for deck.gl
        document.addEventListener('keydown', (event) => {
            if (!this.isInitialized) return;
            
            switch(event.key.toLowerCase()) {
                case 'd':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.toggleDeckGL();
                    }
                    break;
                case 'r':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.resetView();
                    }
                    break;
            }
        });
        
        // Setup performance monitoring
        if (window.performanceOptimizer) {
            window.addEventListener('performanceUpdate', (event) => {
                const metrics = event.detail;
                this.adjustDeckGLQuality(metrics);
            });
        }
    }
    
    handleClick(info) {
        if (info.object) {
            console.log('🎯 Objeto clicado:', info.object);
            
            // Show detailed info
            this.showObjectInfo(info.object, info.layer.id);
            
            // Dispatch custom event
            const event = new CustomEvent('deckglObjectClick', {
                detail: {object: info.object, layer: info.layer.id}
            });
            window.dispatchEvent(event);
        }
    }
    
    handleHover(info) {
        if (info.object) {
            // Update cursor
            this.container.style.cursor = 'pointer';
        } else {
            this.container.style.cursor = 'default';
        }
    }
    
    getTooltip(object) {
        if (!object) return null;
        
        const tooltips = {
            'oceanographic-data': `
                <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
                    <strong>Dados Oceanográficos</strong><br/>
                    Parâmetro: ${object.parameter}<br/>
                    Valor: ${object.value.toFixed(3)}<br/>
                    Profundidade: ${object.depth.toFixed(1)}m<br/>
                    Posição: ${object.latitude.toFixed(3)}, ${object.longitude.toFixed(3)}
                </div>
            `,
            'species-distribution': `
                <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
                    <strong>Distribuição de Espécies</strong><br/>
                    Espécie: ${object.species}<br/>
                    Abundância: ${object.abundance.toFixed(1)}<br/>
                    Confiança: ${(object.confidence * 100).toFixed(1)}%
                </div>
            `,
            'temperature-heatmap': `
                <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
                    <strong>Temperatura</strong><br/>
                    ${object.temperature.toFixed(1)}°C
                </div>
            `,
            'ocean-currents': `
                <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
                    <strong>Corrente Oceânica</strong><br/>
                    Força: ${object.strength.toFixed(1)}<br/>
                    Velocidade: ${object.speed.toFixed(1)} m/s
                </div>
            `
        };
        
        return {html: tooltips[object.layerId] || 'Informação não disponível'};
    }
    
    showObjectInfo(object, layerId) {
        if (window.createModal) {
            const content = this.generateObjectInfoContent(object, layerId);
            window.createModal('Informações Detalhadas', content);
        }
    }
    
    generateObjectInfoContent(object, layerId) {
        const info = {
            'oceanographic-data': `
                <div style="font-family: 'JetBrains Mono', monospace;">
                    <h4 style="color: #00d4ff; margin-bottom: 20px;">📊 Dados Oceanográficos</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <strong>ID:</strong> ${object.id}<br/>
                            <strong>Parâmetro:</strong> ${object.parameter}<br/>
                            <strong>Valor:</strong> ${object.value.toFixed(4)}<br/>
                            <strong>Profundidade:</strong> ${object.depth.toFixed(1)}m
                        </div>
                        <div>
                            <strong>Latitude:</strong> ${object.latitude.toFixed(6)}<br/>
                            <strong>Longitude:</strong> ${object.longitude.toFixed(6)}<br/>
                            <strong>Timestamp:</strong> ${object.timestamp.toLocaleString()}
                        </div>
                    </div>
                </div>
            `,
            'species-distribution': `
                <div style="font-family: 'JetBrains Mono', monospace;">
                    <h4 style="color: #00ff88; margin-bottom: 20px;">🐠 Distribuição de Espécies</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <strong>Espécie:</strong> ${object.species}<br/>
                            <strong>Abundância:</strong> ${object.abundance.toFixed(2)}<br/>
                            <strong>Confiança:</strong> ${(object.confidence * 100).toFixed(1)}%
                        </div>
                        <div>
                            <strong>Latitude:</strong> ${object.latitude.toFixed(6)}<br/>
                            <strong>Longitude:</strong> ${object.longitude.toFixed(6)}
                        </div>
                    </div>
                </div>
            `
        };
        
        return info[layerId] || '<p>Informações detalhadas não disponíveis.</p>';
    }
    
    adjustDeckGLQuality(metrics) {
        if (metrics.fps < 30) {
            // Reduce layer complexity
            this.layers.forEach(layer => {
                if (layer.id === 'temperature-heatmap') {
                    layer.props.radiusPixels = Math.max(layer.props.radiusPixels * 0.8, 20);
                }
                if (layer.id === 'oceanographic-data') {
                    layer.props.radiusMaxPixels = Math.max(layer.props.radiusMaxPixels * 0.8, 10);
                }
            });
            
            this.deck.setProps({layers: this.layers});
        }
    }
    
    toggleDeckGL() {
        if (this.container.style.display === 'none') {
            this.container.style.display = 'block';
            console.log('🌐 deck.gl ativado');
        } else {
            this.container.style.display = 'none';
            console.log('🌐 deck.gl desativado');
        }
    }
    
    resetView() {
        this.viewState = {
            longitude: 13.2,
            latitude: -8.8,
            zoom: 6,
            pitch: 0,
            bearing: 0
        };
        
        if (this.deck) {
            this.deck.setProps({initialViewState: this.viewState});
        }
        
        console.log('🎯 Vista resetada para Angola');
    }
    
    // API methods for external integration
    addCustomLayer(layer) {
        this.layers.push(layer);
        if (this.deck) {
            this.deck.setProps({layers: this.layers});
        }
    }
    
    removeLayer(layerId) {
        this.layers = this.layers.filter(layer => layer.id !== layerId);
        if (this.deck) {
            this.deck.setProps({layers: this.layers});
        }
    }
    
    updateLayerData(layerId, newData) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.props.data = newData;
            this.deck.setProps({layers: this.layers});
        }
    }
    
    exportView() {
        if (this.deck) {
            return {
                viewState: this.viewState,
                layers: this.layers.map(l => ({id: l.id, type: l.constructor.name}))
            };
        }
        return null;
    }
}

// Initialize deck.gl integration
document.addEventListener('DOMContentLoaded', () => {
    // Wait for other systems to load
    setTimeout(() => {
        window.deckGLIntegration = new DeckGLIntegration();
    }, 2000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeckGLIntegration;
}
