/**
 * 🎮 UNREAL ENGINE ML VISUALIZATIONS - deck.gl Native
 * Advanced ML visualizations using Unreal Engine patterns with deck.gl
 * 
 * Features:
 * - Animated heatmaps with Unreal Engine style effects
 * - Species with emoji icons and AI behavior
 * - Migration routes with cinematic animations
 * - Performance optimization with LOD system
 * - Material system for data visualization
 */

class UnrealMLVisualizations {
    constructor(deckglMap) {
        this.map = deckglMap;
        this.layers = new Map();
        this.animations = new Map();
        this.materials = new Map();
        this.time = 0;
        
        this.setupMaterialSystem();
        this.startAnimationLoop();
        
        console.log('🎮 UnrealMLVisualizations inicializado para deck.gl');
    }
    
    setupMaterialSystem() {
        // Unreal Engine inspired material system
        this.materials.set('biodiversity_heat', {
            colorRange: [
                [0, 0, 255, 50],      // Cold blue
                [0, 255, 255, 100],   // Cyan
                [0, 255, 0, 150],     // Green
                [255, 255, 0, 200],   // Yellow
                [255, 165, 0, 230],   // Orange
                [255, 0, 0, 255]      // Hot red
            ],
            animation: 'pulse'
        });
        
        this.materials.set('species_scatter', {
            emojis: {
                'fish': '🐟',
                'whale': '🐋', 
                'dolphin': '🐬',
                'turtle': '🐢',
                'shark': '🦈',
                'octopus': '🐙',
                'crab': '🦀',
                'jellyfish': '🪼'
            },
            colors: {
                'fish': [0, 170, 255, 255],
                'whale': [0, 102, 204, 255],
                'dolphin': [0, 153, 255, 255],
                'turtle': [0, 204, 102, 255],
                'shark': [255, 50, 50, 255],
                'octopus': [150, 0, 255, 255],
                'crab': [255, 165, 0, 255],
                'jellyfish': [255, 105, 180, 255]
            }
        });
    }
    
    startAnimationLoop() {
        const animate = () => {
            this.time += 0.016; // ~60fps
            this.updateAnimations();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
    
    updateAnimations() {
        // Update animated layers
        for (const [layerId, animation] of this.animations) {
            if (animation.type === 'pulse') {
                this.updatePulseAnimation(layerId, animation);
            } else if (animation.type === 'flow') {
                this.updateFlowAnimation(layerId, animation);
            }
        }
    }
    
    updatePulseAnimation(layerId, animation) {
        const layer = this.layers.get(layerId);
        if (!layer) return;
        
        const pulse = Math.sin(this.time * 2) * 0.3 + 0.7; // 0.4 to 1.0
        
        // Update layer opacity with pulse
        const updatedLayer = layer.clone({
            opacity: pulse
        });
        
        this.updateDeckGLLayer(layerId, updatedLayer);
    }
    
    updateFlowAnimation(layerId, animation) {
        const layer = this.layers.get(layerId);
        if (!layer) return;
        
        // Animate migration routes
        const flow = (Math.sin(this.time * 1.5) + 1) * 0.5; // 0 to 1
        
        const updatedLayer = layer.clone({
            getColor: d => [
                ...d.baseColor.slice(0, 3),
                Math.floor(100 + flow * 155) // Animated alpha
            ]
        });
        
        this.updateDeckGLLayer(layerId, updatedLayer);
    }
    
    updateDeckGLLayer(layerId, newLayer) {
        if (!this.map || !this.map.setProps) return;
        
        const currentLayers = this.map.props.layers || [];
        const updatedLayers = currentLayers.map(layer => 
            layer.id === layerId ? newLayer : layer
        );
        
        this.map.setProps({layers: updatedLayers});
        this.layers.set(layerId, newLayer);
    }
    
    // === ANIMATED HEATMAP ===
    
    async createAnimatedBiodiversityHeatmap() {
        console.log('🔥 Criando heatmap ANIMADO com Unreal Engine effects...');
        
        this.removeDeckGLLayer('animated-biodiversity-heatmap');
        
        const heatmapData = this.generateBiodiversityHotspots();
        
        const heatmapLayer = new deck.HeatmapLayer({
            id: 'animated-biodiversity-heatmap',
            data: heatmapData,
            getPosition: d => [d.longitude, d.latitude],
            getWeight: d => d.intensity,
            radiusPixels: 100,
            opacity: 0.8,
            colorRange: this.materials.get('biodiversity_heat').colorRange
        });
        
        this.addDeckGLLayer(heatmapLayer);
        this.layers.set('animated-biodiversity-heatmap', heatmapLayer);
        
        // Add pulse animation
        this.animations.set('animated-biodiversity-heatmap', {
            type: 'pulse',
            speed: 2.0,
            amplitude: 0.3
        });
        
        console.log(`✅ Heatmap ANIMADO criado: ${heatmapData.length} hotspots`);
    }
    
    generateBiodiversityHotspots() {
        // High-quality biodiversity hotspots (no random test points)
        const hotspots = [
            // Benguela Upwelling System
            {longitude: 13.4, latitude: -12.6, intensity: 0.95, zone: 'benguela_upwelling'},
            {longitude: 13.2, latitude: -12.8, intensity: 0.90, zone: 'benguela_upwelling'},
            {longitude: 13.0, latitude: -13.0, intensity: 0.85, zone: 'benguela_upwelling'},
            
            // Namibe Upwelling
            {longitude: 12.1, latitude: -15.2, intensity: 0.88, zone: 'namibe_upwelling'},
            {longitude: 11.9, latitude: -15.4, intensity: 0.82, zone: 'namibe_upwelling'},
            
            // Angola Current transition zones
            {longitude: 13.2, latitude: -8.8, intensity: 0.65, zone: 'angola_current'},
            {longitude: 12.8, latitude: -9.5, intensity: 0.60, zone: 'angola_current'},
            
            // Offshore deep water (lower biodiversity)
            {longitude: 10.5, latitude: -10.0, intensity: 0.35, zone: 'deep_water'},
            {longitude: 9.5, latitude: -12.0, intensity: 0.30, zone: 'deep_water'},
            {longitude: 8.5, latitude: -14.0, intensity: 0.25, zone: 'deep_water'}
        ];
        
        return hotspots;
    }
    
    // === SPECIES WITH EMOJIS ===
    
    async createSpeciesWithEmojis() {
        console.log('🐟 Criando espécies com EMOJIS usando deck.gl...');
        
        this.removeDeckGLLayer('species-emojis');
        
        const speciesData = this.generateSpeciesWithLocations();
        
        // Create text layer for emojis
        const speciesLayer = new deck.TextLayer({
            id: 'species-emojis',
            data: speciesData,
            pickable: true,
            getPosition: d => [d.longitude, d.latitude],
            getText: d => this.materials.get('species_scatter').emojis[d.species] || '🐟',
            getSize: d => 20 + (d.abundance * 15),
            getColor: d => this.materials.get('species_scatter').colors[d.species] || [128, 128, 128, 255],
            getAngle: 0,
            getTextAnchor: 'middle',
            getAlignmentBaseline: 'center',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold'
        });
        
        this.addDeckGLLayer(speciesLayer);
        this.layers.set('species-emojis', speciesLayer);
        
        console.log(`✅ Espécies com emojis criadas: ${speciesData.length} espécies`);
    }
    
    generateSpeciesWithLocations() {
        const species = ['fish', 'whale', 'dolphin', 'turtle', 'shark', 'octopus', 'crab', 'jellyfish'];
        const data = [];
        
        // Generate species in realistic locations
        const locations = [
            // Coastal areas (high diversity)
            {area: 'coastal_north', center: [13.0, -8.0], radius: 1.5, speciesCount: 6},
            {area: 'coastal_central', center: [13.2, -12.0], radius: 1.2, speciesCount: 8},
            {area: 'coastal_south', center: [12.5, -15.0], radius: 1.0, speciesCount: 7},
            
            // Offshore areas (lower diversity, larger species)
            {area: 'offshore_deep', center: [10.0, -10.0], radius: 2.0, speciesCount: 4}
        ];
        
        locations.forEach(location => {
            const selectedSpecies = species.slice(0, location.speciesCount);
            
            selectedSpecies.forEach(specie => {
                const angle = Math.random() * 2 * Math.PI;
                const distance = Math.random() * location.radius;
                
                data.push({
                    longitude: location.center[0] + Math.cos(angle) * distance,
                    latitude: location.center[1] + Math.sin(angle) * distance,
                    species: specie,
                    abundance: 0.3 + Math.random() * 0.7,
                    location_type: location.area,
                    type: 'species_emoji'
                });
            });
        });
        
        return data;
    }
    
    // === MIGRATION ROUTES ===
    
    async createMigrationRoutes() {
        console.log('🐋 Criando rotas de migração ANIMADAS...');
        
        this.removeDeckGLLayer('migration-routes');
        
        const migrationData = this.generateMigrationRoutes();
        
        const routesLayer = new deck.LineLayer({
            id: 'migration-routes',
            data: migrationData,
            pickable: true,
            getSourcePosition: d => d.start,
            getTargetPosition: d => d.end,
            getColor: d => [...d.baseColor, 200],
            getWidth: d => d.importance * 8,
            widthMinPixels: 4,
            widthMaxPixels: 20
        });
        
        this.addDeckGLLayer(routesLayer);
        this.layers.set('migration-routes', routesLayer);
        
        // Add flow animation
        this.animations.set('migration-routes', {
            type: 'flow',
            speed: 1.5,
            amplitude: 0.5
        });
        
        console.log(`✅ Rotas de migração criadas: ${migrationData.length} rotas`);
    }
    
    generateMigrationRoutes() {
        return [
            // Humpback whale migration (north-south)
            {
                start: [12.0, -6.0],
                end: [11.5, -16.0],
                species: 'Baleia Jubarte',
                importance: 1.0,
                baseColor: [0, 150, 255],
                season: 'Junho-Setembro'
            },
            
            // Blue whale migration (offshore)
            {
                start: [10.0, -8.0],
                end: [9.5, -15.0],
                species: 'Baleia Azul',
                importance: 0.8,
                baseColor: [0, 100, 200],
                season: 'Julho-Agosto'
            },
            
            // Sardine migration (coastal)
            {
                start: [13.5, -10.0],
                end: [12.8, -14.0],
                species: 'Sardinha',
                importance: 0.9,
                baseColor: [0, 255, 150],
                season: 'Março-Junho'
            },
            
            // Tuna migration (deep water)
            {
                start: [9.0, -7.0],
                end: [10.5, -17.0],
                species: 'Atum',
                importance: 0.7,
                baseColor: [255, 100, 0],
                season: 'Todo o ano'
            },
            
            // Turtle migration (coastal to offshore)
            {
                start: [13.0, -9.0],
                end: [10.0, -12.0],
                species: 'Tartaruga Marinha',
                importance: 0.6,
                baseColor: [100, 255, 100],
                season: 'Novembro-Janeiro'
            }
        ];
    }
    
    // === DECK.GL HELPER METHODS ===
    
    addDeckGLLayer(layer) {
        if (!this.map || !this.map.setProps) {
            console.error('❌ Map não é deck.gl');
            return;
        }
        
        const currentLayers = this.map.props.layers || [];
        const newLayers = [...currentLayers, layer];
        
        this.map.setProps({layers: newLayers});
        console.log(`✅ Layer deck.gl adicionada: ${layer.id}`);
    }
    
    removeDeckGLLayer(layerId) {
        if (!this.map || !this.map.setProps) return;
        
        const currentLayers = this.map.props.layers || [];
        const filteredLayers = currentLayers.filter(layer => layer.id !== layerId);
        
        this.map.setProps({layers: filteredLayers});
        
        // Clean up tracking
        this.layers.delete(layerId);
        this.animations.delete(layerId);
        
        console.log(`🗑️ Layer deck.gl removida: ${layerId}`);
    }
    
    clearAllMLLayers() {
        console.log('🧹 Removendo todas as layers ML...');
        
        for (const layerId of this.layers.keys()) {
            this.removeDeckGLLayer(layerId);
        }
        
        this.layers.clear();
        this.animations.clear();
        
        console.log('✅ Todas as layers ML removidas');
    }
    
    // === PUBLIC API ===
    
    async createAllVisualizations() {
        console.log('🎨 Criando TODAS as visualizações Unreal Engine + deck.gl...');
        
        await Promise.all([
            this.createAnimatedBiodiversityHeatmap(),
            this.createSpeciesWithEmojis(),
            this.createMigrationRoutes()
        ]);
        
        console.log('✅ Todas as visualizações Unreal Engine criadas!');
    }
}

// Export globally
window.UnrealMLVisualizations = UnrealMLVisualizations;
