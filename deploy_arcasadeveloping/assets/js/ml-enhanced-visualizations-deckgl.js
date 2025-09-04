/**
 * BGAPP ML Enhanced Visualizations - deck.gl Compatible
 * Visualizações avançadas compatíveis com deck.gl
 * Versão: 2.0.0 - deck.gl Native
 */

class MLEnhancedVisualizationsDeckGL {
  constructor(map, mlService) {
    this.map = map;
    this.mlService = mlService;
    this.layers = new Map();
    this.isDeckGL = map && map.setProps;
    
    console.log('🎨 MLEnhancedVisualizationsDeckGL inicializado para deck.gl');
  }

  /**
   * Cria heatmap de biodiversidade usando deck.gl
   */
  async createBiodiversityHeatmap() {
    try {
      console.log('🔥 Criando heatmap de biodiversidade com deck.gl...');
      
      // Remove existing layer
      this.removeDeckGLLayer('biodiversity-heatmap');
      
      // Generate data
      const heatmapData = this.generateBiodiversityData();
      
      // Create deck.gl HeatmapLayer
      const heatmapLayer = new deck.HeatmapLayer({
        id: 'biodiversity-heatmap',
        data: heatmapData,
        getPosition: d => [d.longitude, d.latitude],
        getWeight: d => d.intensity,
        radiusPixels: 80,
        opacity: 0.8,
        colorRange: [
          [0, 0, 255, 50],      // Blue - Low
          [0, 255, 255, 100],   // Cyan
          [0, 255, 0, 150],     // Green
          [255, 255, 0, 200],   // Yellow
          [255, 165, 0, 230],   // Orange
          [255, 0, 0, 255]      // Red - High
        ]
      });
      
      this.addDeckGLLayer(heatmapLayer);
      this.layers.set('biodiversity-heatmap', heatmapLayer);
      
      console.log(`✅ Heatmap de biodiversidade criado: ${heatmapData.length} pontos`);
      
    } catch (error) {
      console.error('❌ Erro criando heatmap:', error);
    }
  }

  /**
   * Cria clusters de espécies usando deck.gl
   */
  async createSpeciesClusters() {
    try {
      console.log('🐠 Criando clusters de espécies com deck.gl...');
      
      // Remove existing layer
      this.removeDeckGLLayer('species-clusters');
      
      // Generate species data
      const speciesData = this.generateSpeciesData();
      
      // Create deck.gl ScatterplotLayer for species
      const speciesLayer = new deck.ScatterplotLayer({
        id: 'species-clusters',
        data: speciesData,
        pickable: true,
        opacity: 0.9,
        stroked: true,
        filled: true,
        radiusScale: 100,
        radiusMinPixels: 8,
        radiusMaxPixels: 30,
        getPosition: d => [d.longitude, d.latitude],
        getRadius: d => 5 + (d.abundance * 15),
        getFillColor: d => this.getSpeciesColor(d.species),
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2
      });
      
      this.addDeckGLLayer(speciesLayer);
      this.layers.set('species-clusters', speciesLayer);
      
      console.log(`✅ Clusters de espécies criados: ${speciesData.length} espécies`);
      
    } catch (error) {
      console.error('❌ Erro criando clusters:', error);
    }
  }

  /**
   * Cria rotas de migração usando deck.gl
   */
  async createMigrationPaths() {
    try {
      console.log('🐋 Criando rotas de migração com deck.gl...');
      
      // Remove existing layer
      this.removeDeckGLLayer('migration-paths');
      
      // Generate migration data
      const migrationData = this.generateMigrationData();
      
      // Create deck.gl LineLayer for migration paths
      const migrationLayer = new deck.LineLayer({
        id: 'migration-paths',
        data: migrationData,
        pickable: true,
        getSourcePosition: d => d.start,
        getTargetPosition: d => d.end,
        getColor: d => [0, 150, 255, 200], // Blue migration routes
        getWidth: d => d.importance * 5,
        widthMinPixels: 3,
        widthMaxPixels: 12
      });
      
      this.addDeckGLLayer(migrationLayer);
      this.layers.set('migration-paths', migrationLayer);
      
      console.log(`✅ Rotas de migração criadas: ${migrationData.length} rotas`);
      
    } catch (error) {
      console.error('❌ Erro criando rotas:', error);
    }
  }

  /**
   * Cria zonas de risco usando deck.gl
   */
  async createRiskZones() {
    try {
      console.log('⚠️ Criando zonas de risco com deck.gl...');
      
      // Remove existing layer
      this.removeDeckGLLayer('risk-zones');
      
      // Generate risk zones data
      const riskData = this.generateRiskZonesData();
      
      // Create deck.gl SolidPolygonLayer for risk zones
      const riskLayer = new deck.SolidPolygonLayer({
        id: 'risk-zones',
        data: riskData,
        pickable: true,
        filled: true,
        stroked: true,
        getFillColor: d => this.getRiskColor(d.riskLevel),
        getLineColor: [255, 0, 0, 255],
        lineWidthMinPixels: 2,
        opacity: 0.6
      });
      
      this.addDeckGLLayer(riskLayer);
      this.layers.set('risk-zones', riskLayer);
      
      console.log(`✅ Zonas de risco criadas: ${riskData.length} zonas`);
      
    } catch (error) {
      console.error('❌ Erro criando zonas de risco:', error);
    }
  }

  /**
   * Cria todas as visualizações
   */
  async createAllVisualizations() {
    console.log('🎨 Criando todas as visualizações ML com deck.gl...');
    
    try {
      await Promise.all([
        this.createBiodiversityHeatmap(),
        this.createSpeciesClusters(),
        this.createMigrationPaths(),
        this.createRiskZones()
      ]);
      
      console.log('✅ Todas as visualizações deck.gl criadas!');
    } catch (error) {
      console.error('❌ Erro criando visualizações:', error);
    }
  }

  /**
   * Remove todas as layers
   */
  clearAllLayers() {
    console.log('🧹 Removendo todas as layers deck.gl...');
    
    for (const [layerId, layer] of this.layers) {
      this.removeDeckGLLayer(layerId);
    }
    
    this.layers.clear();
    console.log('✅ Todas as layers removidas');
  }

  // === DECK.GL HELPER METHODS ===

  addDeckGLLayer(layer) {
    if (!this.map || !this.map.setProps) {
      console.error('❌ Map não suporta setProps (não é deck.gl)');
      return;
    }
    
    const currentLayers = this.map.props.layers || [];
    const newLayers = [...currentLayers, layer];
    
    this.map.setProps({
      layers: newLayers
    });
    
    console.log(`✅ Layer adicionada: ${layer.id}`);
  }

  removeDeckGLLayer(layerId) {
    if (!this.map || !this.map.setProps) return;
    
    const currentLayers = this.map.props.layers || [];
    const filteredLayers = currentLayers.filter(layer => layer.id !== layerId);
    
    this.map.setProps({
      layers: filteredLayers
    });
    
    console.log(`🗑️ Layer removida: ${layerId}`);
  }

  // === DATA GENERATORS ===

  generateBiodiversityData() {
    const data = [];
    
    // High biodiversity zones (upwelling areas)
    const zones = [
      {center: [12.0, -15.5], radius: 1.5, intensity: 0.9}, // Namibe upwelling
      {center: [13.0, -12.8], radius: 1.2, intensity: 0.8}, // Benguela upwelling
      {center: [11.5, -9.0], radius: 2.0, intensity: 0.6},  // Central coast
      {center: [10.5, -7.0], radius: 1.8, intensity: 0.5},  // North central
      {center: [9.0, -10.0], radius: 2.5, intensity: 0.3},  // Deep water
      {center: [8.5, -14.0], radius: 2.0, intensity: 0.2}   // Far offshore
    ];
    
    zones.forEach((zone, zoneIndex) => {
      const pointsInZone = Math.floor(10 + zone.intensity * 20);
      
      for (let i = 0; i < pointsInZone; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * zone.radius;
        
        data.push({
          longitude: zone.center[0] + Math.cos(angle) * distance,
          latitude: zone.center[1] + Math.sin(angle) * distance,
          intensity: zone.intensity + (Math.random() - 0.5) * 0.2,
          type: 'biodiversity',
          zone: zoneIndex
        });
      }
    });
    
    return data;
  }

  generateSpeciesData() {
    const species = ['Sardinha', 'Cavala', 'Atum', 'Anchoveta', 'Carapau', 'Pescada', 'Cherne'];
    const data = [];
    
    species.forEach((specie, index) => {
      // Generate multiple points for each species
      const count = 3 + Math.floor(Math.random() * 5);
      
      for (let i = 0; i < count; i++) {
        data.push({
          longitude: 8 + Math.random() * 6,
          latitude: -18 + Math.random() * 12,
          species: specie,
          abundance: Math.random(),
          confidence: 0.6 + Math.random() * 0.4,
          type: 'species'
        });
      }
    });
    
    return data;
  }

  generateMigrationData() {
    const routes = [
      // Whale migration routes
      {
        start: [8.5, -6.0],
        end: [10.5, -16.0],
        species: 'Baleia Jubarte',
        importance: 0.9
      },
      {
        start: [9.0, -8.0],
        end: [11.0, -14.0],
        species: 'Baleia Azul',
        importance: 0.7
      },
      // Fish migration routes
      {
        start: [12.0, -7.0],
        end: [9.5, -15.0],
        species: 'Sardinha',
        importance: 0.8
      },
      {
        start: [11.5, -10.0],
        end: [8.5, -12.0],
        species: 'Atum',
        importance: 0.6
      }
    ];
    
    return routes;
  }

  generateRiskZonesData() {
    return [
      {
        polygon: [
          [10.0, -7.5], [11.5, -7.5], [11.5, -9.0], [10.0, -9.0], [10.0, -7.5]
        ],
        riskLevel: 'high',
        type: 'pollution'
      },
      {
        polygon: [
          [9.0, -13.0], [10.5, -13.0], [10.5, -15.0], [9.0, -15.0], [9.0, -13.0]
        ],
        riskLevel: 'medium',
        type: 'overfishing'
      },
      {
        polygon: [
          [8.0, -11.0], [9.0, -11.0], [9.0, -12.5], [8.0, -12.5], [8.0, -11.0]
        ],
        riskLevel: 'low',
        type: 'shipping'
      }
    ];
  }

  // === COLOR HELPERS ===

  getSpeciesColor(species) {
    const colors = {
      'Sardinha': [255, 99, 132, 200],
      'Cavala': [54, 162, 235, 200],
      'Atum': [255, 205, 86, 200],
      'Anchoveta': [75, 192, 192, 200],
      'Carapau': [153, 102, 255, 200],
      'Pescada': [255, 159, 64, 200],
      'Cherne': [199, 199, 199, 200]
    };
    
    return colors[species] || [128, 128, 128, 200];
  }

  getRiskColor(riskLevel) {
    const colors = {
      'high': [255, 0, 0, 150],     // Red
      'medium': [255, 165, 0, 120], // Orange  
      'low': [255, 255, 0, 100]     // Yellow
    };
    
    return colors[riskLevel] || [128, 128, 128, 100];
  }
}

// Make globally available
window.MLEnhancedVisualizationsDeckGL = MLEnhancedVisualizationsDeckGL;
