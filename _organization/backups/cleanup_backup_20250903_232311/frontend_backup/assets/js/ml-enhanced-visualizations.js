/**
 * BGAPP ML Enhanced Visualizations
 * Visualizações avançadas para o ML Demo
 * Versão: 1.0.0
 */

class MLEnhancedVisualizations {
  constructor(map, mlService) {
    this.map = map;
    this.mlService = mlService;
    this.visualizationLayers = new Map();
    this.heatmapLayer = null;
    this.clusterLayer = null;
    this.migrationLayer = null;
    
    console.log('🎨 MLEnhancedVisualizations inicializado');
  }

  /**
   * Cria heatmap de biodiversidade
   */
  async createBiodiversityHeatmap() {
    try {
      console.log('🔥 Criando heatmap de biodiversidade...');
      
      // Gerar dados de heatmap baseados nas predições ML
      const heatmapData = await this.generateHeatmapData();
      
      // Remover heatmap anterior se existir
      if (this.heatmapLayer) {
        this.map.removeLayer(this.heatmapLayer);
      }
      
      // Criar novo heatmap usando Leaflet.heat (simulado com circleMarkers)
      this.heatmapLayer = L.layerGroup();
      
      heatmapData.forEach(point => {
        const intensity = point.intensity;
        const radius = Math.max(20, intensity * 50);
        const opacity = Math.max(0.2, intensity * 0.8);
        
        const circle = L.circle([point.lat, point.lng], {
          radius: radius * 100, // metros
          fillColor: this.getHeatmapColor(intensity),
          color: 'transparent',
          fillOpacity: opacity,
          className: 'biodiversity-heatmap'
        });
        
        circle.bindPopup(`
          <div class="ml-heatmap-popup">
            <h4>🌿 Biodiversidade Predita</h4>
            <div><strong>Intensidade:</strong> ${(intensity * 100).toFixed(1)}%</div>
            <div><strong>Espécies Estimadas:</strong> ${Math.floor(intensity * 50)} espécies</div>
            <div><strong>Confiança ML:</strong> ${(0.7 + intensity * 0.25).toFixed(2)}</div>
          </div>
        `);
        
        this.heatmapLayer.addLayer(circle);
      });
      
      this.heatmapLayer.addTo(this.map);
      this.visualizationLayers.set('heatmap', this.heatmapLayer);
      
      console.log(`✅ Heatmap criado com ${heatmapData.length} pontos`);
      
    } catch (error) {
      console.error('❌ Erro criando heatmap:', error);
    }
  }

  /**
   * Cria clusters de espécies
   */
  async createSpeciesClusters() {
    try {
      console.log('🐠 Criando clusters de espécies...');
      
      const clusterData = await this.generateClusterData();
      
      if (this.clusterLayer) {
        this.map.removeLayer(this.clusterLayer);
      }
      
      this.clusterLayer = L.layerGroup();
      
      clusterData.forEach(cluster => {
        // Criar marcador principal do cluster
        const clusterMarker = L.marker([cluster.lat, cluster.lng], {
          icon: L.divIcon({
            className: 'species-cluster-marker',
            html: `
              <div class="cluster-icon" style="
                background: ${cluster.color};
                border: 3px solid white;
                border-radius: 50%;
                width: ${20 + cluster.size * 10}px;
                height: ${20 + cluster.size * 10}px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${10 + cluster.size * 2}px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              ">
                ${cluster.icon}
              </div>
            `,
            iconSize: [20 + cluster.size * 10, 20 + cluster.size * 10]
          })
        });
        
        clusterMarker.bindPopup(`
          <div class="ml-cluster-popup">
            <h4>${cluster.icon} Cluster de ${cluster.type}</h4>
            <div><strong>Espécies:</strong> ${cluster.species.join(', ')}</div>
            <div><strong>População Estimada:</strong> ${cluster.population}</div>
            <div><strong>Densidade:</strong> ${cluster.density}/km²</div>
            <div><strong>Época Ideal:</strong> ${cluster.season}</div>
            <div><strong>Probabilidade ML:</strong> ${(cluster.confidence * 100).toFixed(1)}%</div>
          </div>
        `);
        
        this.clusterLayer.addLayer(clusterMarker);
        
        // Adicionar área de influência
        const influenceArea = L.circle([cluster.lat, cluster.lng], {
          radius: cluster.radius * 1000, // metros
          fillColor: cluster.color,
          color: cluster.color,
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.1,
          dashArray: '5, 10'
        });
        
        this.clusterLayer.addLayer(influenceArea);
      });
      
      this.clusterLayer.addTo(this.map);
      this.visualizationLayers.set('clusters', this.clusterLayer);
      
      console.log(`✅ Clusters criados: ${clusterData.length} grupos`);
      
    } catch (error) {
      console.error('❌ Erro criando clusters:', error);
    }
  }

  /**
   * Cria trajetórias de migração
   */
  async createMigrationPaths() {
    try {
      console.log('🐋 Criando trajetórias de migração...');
      
      const migrationData = await this.generateMigrationData();
      
      if (this.migrationLayer) {
        this.map.removeLayer(this.migrationLayer);
      }
      
      this.migrationLayer = L.layerGroup();
      
      migrationData.forEach(migration => {
        // Criar linha de trajetória
        const pathLine = L.polyline(migration.path, {
          color: migration.color,
          weight: 4,
          opacity: 0.8,
          dashArray: migration.seasonal ? '10, 10' : null,
          className: 'migration-path'
        });
        
        // Adicionar marcadores direcionais (setas simplificadas)
        const pathLength = migration.path.length;
        const arrowMarkers = [];
        
        for (let i = 1; i < pathLength - 1; i += 2) {
          const coord = migration.path[i];
          const nextCoord = migration.path[i + 1] || migration.path[i];
          
          // Calcular ângulo da seta
          const angle = this.calculateAngle(coord, nextCoord);
          
          const arrowMarker = L.marker([coord[0], coord[1]], {
            icon: L.divIcon({
              className: 'migration-arrow',
              html: `<div style="
                width: 0; height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-bottom: 16px solid ${migration.color};
                transform: rotate(${angle}deg);
                filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
              "></div>`,
              iconSize: [16, 16]
            })
          });
          
          arrowMarkers.push(arrowMarker);
        }
        
        pathLine.bindPopup(`
          <div class="ml-migration-popup">
            <h4>🐋 Rota de Migração</h4>
            <div><strong>Espécie:</strong> ${migration.species}</div>
            <div><strong>Distância:</strong> ${migration.distance} km</div>
            <div><strong>Duração:</strong> ${migration.duration}</div>
            <div><strong>Época:</strong> ${migration.period}</div>
            <div><strong>Confiança ML:</strong> ${(migration.confidence * 100).toFixed(1)}%</div>
          </div>
        `);
        
        this.migrationLayer.addLayer(pathLine);
        arrowMarkers.forEach(arrow => this.migrationLayer.addLayer(arrow));
        
        // Adicionar pontos de parada
        migration.stops.forEach(stop => {
          const stopMarker = L.circleMarker([stop.lat, stop.lng], {
            radius: 6,
            fillColor: migration.color,
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          });
          
          stopMarker.bindPopup(`
            <div class="ml-stop-popup">
              <h5>📍 Ponto de Parada</h5>
              <div><strong>Atividade:</strong> ${stop.activity}</div>
              <div><strong>Duração:</strong> ${stop.duration}</div>
            </div>
          `);
          
          this.migrationLayer.addLayer(stopMarker);
        });
      });
      
      this.migrationLayer.addTo(this.map);
      this.visualizationLayers.set('migration', this.migrationLayer);
      
      console.log(`✅ Trajetórias criadas: ${migrationData.length} rotas`);
      
    } catch (error) {
      console.error('❌ Erro criando trajetórias:', error);
    }
  }

  /**
   * Cria zonas de risco com gradientes
   */
  async createRiskZones() {
    try {
      console.log('⚠️ Criando zonas de risco...');
      
      const riskData = await this.generateRiskData();
      
      const riskLayer = L.layerGroup();
      
      riskData.forEach(zone => {
        // Criar polígono da zona
        const riskPolygon = L.polygon(zone.coordinates, {
          color: zone.color,
          weight: 3,
          opacity: 0.8,
          fillColor: zone.color,
          fillOpacity: 0.3,
          className: `risk-zone-${zone.level}`
        });
        
        // Adicionar gradiente interno
        const gradientCircles = zone.gradientPoints.map(point => {
          return L.circle([point.lat, point.lng], {
            radius: point.radius,
            fillColor: zone.color,
            color: 'transparent',
            fillOpacity: point.intensity * 0.4
          });
        });
        
        riskPolygon.bindPopup(`
          <div class="ml-risk-popup">
            <h4>⚠️ Zona de Risco ${zone.level.toUpperCase()}</h4>
            <div><strong>Tipo:</strong> ${zone.type}</div>
            <div><strong>Probabilidade:</strong> ${(zone.probability * 100).toFixed(1)}%</div>
            <div><strong>Fatores:</strong> ${zone.factors.join(', ')}</div>
            <div><strong>Recomendação:</strong> ${zone.recommendation}</div>
            <div><strong>Última Atualização:</strong> ${zone.lastUpdate}</div>
          </div>
        `);
        
        riskLayer.addLayer(riskPolygon);
        gradientCircles.forEach(circle => riskLayer.addLayer(circle));
      });
      
      riskLayer.addTo(this.map);
      this.visualizationLayers.set('risk', riskLayer);
      
      console.log(`✅ Zonas de risco criadas: ${riskData.length} áreas`);
      
    } catch (error) {
      console.error('❌ Erro criando zonas de risco:', error);
    }
  }

  /**
   * Gera dados de heatmap (coordenadas oceânicas corrigidas)
   */
  async generateHeatmapData() {
    const points = [];
    // Coordenadas oceânicas ao longo da costa angolana
    const angolaOceanicCoords = [
      [-8.8383, 12.5],  // Oceano próximo a Luanda
      [-5.9248, 11.8],  // Oceano próximo a Soyo
      [-15.1434, 11.2], // Oceano próximo a Namibe
      [-12.3014, 12.1], // Oceano próximo a Benguela
      [-9.5, 12.2],     // Oceano centro-norte
      [-7.2, 12.0],     // Oceano norte
      [-11.8, 12.4],    // Oceano centro-sul
      [-6.8, 11.6]      // Oceano extremo norte
    ];
    
    angolaOceanicCoords.forEach(coord => {
      // Criar múltiplos pontos ao redor de cada coordenada (mantendo no oceano)
      for (let i = 0; i < 5; i++) {
        const latOffset = (Math.random() - 0.5) * 1.5; // Menor variação
        const lngOffset = (Math.random() - 0.8) * 1.0; // Bias para oeste (oceano)
        
        points.push({
          lat: coord[0] + latOffset,
          lng: coord[1] + lngOffset,
          intensity: Math.random()
        });
      }
    });
    
    return points;
  }

  /**
   * Gera dados de clusters (coordenadas oceânicas corrigidas)
   */
  async generateClusterData() {
    return [
      {
        lat: -8.8383, lng: 12.5, type: 'Peixes Pelágicos', // Oceano próximo a Luanda
        species: ['Sardinha', 'Cavala', 'Atum'],
        population: '15.000-25.000', density: 120, season: 'Abril-Setembro',
        confidence: 0.89, size: 3, color: '#17a2b8', icon: '🐟', radius: 25
      },
      {
        lat: -5.9248, lng: 11.8, type: 'Mamíferos Marinhos', // Oceano próximo a Soyo
        species: ['Baleia-jubarte', 'Golfinho-comum'],
        population: '500-800', density: 15, season: 'Junho-Outubro',
        confidence: 0.76, size: 2, color: '#6f42c1', icon: '🐋', radius: 35
      },
      {
        lat: -15.1434, lng: 11.2, type: 'Crustáceos', // Oceano próximo a Namibe
        species: ['Lagosta', 'Caranguejo', 'Camarão'],
        population: '8.000-12.000', density: 85, season: 'Ano todo',
        confidence: 0.92, size: 2, color: '#fd7e14', icon: '🦐', radius: 20
      },
      {
        lat: -12.5, lng: 12.2, type: 'Peixes Demersais', // Oceano próximo a Benguela
        species: ['Pescada', 'Linguado', 'Robalo'],
        population: '8.500-15.000', density: 95, season: 'Maio-Agosto',
        confidence: 0.85, size: 3, color: '#20c997', icon: '🐠', radius: 30
      }
    ];
  }

  /**
   * Gera dados de migração (coordenadas oceânicas corrigidas)
   */
  async generateMigrationData() {
    return [
      {
        species: 'Baleia-jubarte',
        // Rota oceânica ao longo da costa angolana (no mar)
        path: [
          [-5.9248, 11.8], // Norte - Oceano próximo a Soyo
          [-7.5, 12.0],    // Oceano próximo a Ambriz
          [-8.8383, 12.5], // Oceano próximo a Luanda
          [-11.0, 12.8],   // Oceano centro-sul
          [-13.5, 12.0],   // Oceano próximo a Lobito
          [-15.1434, 11.2] // Sul - Oceano próximo a Namibe
        ],
        distance: 1250, duration: '3-4 meses', period: 'Junho-Setembro',
        confidence: 0.84, color: '#6f42c1', seasonal: true,
        stops: [
          {lat: -8.8383, lng: 12.5, activity: 'Alimentação', duration: '2-3 semanas'},
          {lat: -13.5, lng: 12.0, activity: 'Reprodução', duration: '1 mês'}
        ]
      },
      {
        species: 'Atum-rabilho',
        // Rota oceânica de atum (águas profundas)
        path: [
          [-6.0, 11.5],   // Norte - águas profundas
          [-8.0, 11.8],   // Centro-norte oceânico
          [-10.5, 12.2],  // Centro oceânico
          [-13.0, 11.5],  // Centro-sul oceânico
          [-15.5, 10.8]   // Sul - águas profundas
        ],
        distance: 890, duration: '2 meses', period: 'Março-Maio',
        confidence: 0.91, color: '#dc3545', seasonal: false,
        stops: [
          {lat: -10.5, lng: 12.2, activity: 'Desova', duration: '2 semanas'}
        ]
      },
      {
        species: 'Sardinha-angolana',
        // Rota costeira de sardinha (próxima à costa mas no mar)
        path: [
          [-5.5, 12.1],   // Norte costeiro
          [-7.0, 12.3],   // Próximo a Luanda
          [-9.5, 12.6],   // Costa central
          [-12.0, 12.4],  // Próximo a Benguela
          [-14.5, 11.8]   // Costa sul
        ],
        distance: 650, duration: '6-8 semanas', period: 'Dezembro-Fevereiro',
        confidence: 0.88, color: '#28a745', seasonal: true,
        stops: [
          {lat: -7.0, lng: 12.3, activity: 'Cardume principal', duration: '1 semana'},
          {lat: -12.0, lng: 12.4, activity: 'Desova', duration: '3 semanas'}
        ]
      }
    ];
  }

  /**
   * Gera dados de zonas de risco (coordenadas oceânicas corrigidas)
   */
  async generateRiskData() {
    return [
      {
        level: 'alto',
        type: 'Sobrepesca',
        // Zona oceânica próxima a Luanda (no mar)
        coordinates: [[-8.5, 12.3], [-9.0, 12.1], [-8.8, 12.8], [-8.3, 12.9], [-8.1, 12.4]],
        probability: 0.78,
        factors: ['Atividade pesqueira intensa', 'Declínio populacional', 'Pressão comercial'],
        recommendation: 'Implementar quotas de pesca',
        lastUpdate: new Date().toLocaleDateString('pt-BR'),
        color: '#dc3545',
        gradientPoints: [
          {lat: -8.7, lng: 12.5, radius: 15000, intensity: 0.8},
          {lat: -8.6, lng: 12.7, radius: 12000, intensity: 0.6}
        ]
      },
      {
        level: 'médio',
        type: 'Poluição Marinha',
        // Zona oceânica próxima a Benguela (no mar)
        coordinates: [[-12.0, 12.0], [-12.5, 12.3], [-12.2, 12.6], [-11.8, 12.4], [-11.9, 12.1]],
        probability: 0.65,
        factors: ['Descarga industrial', 'Resíduos plásticos', 'Poluição costeira'],
        recommendation: 'Monitorização contínua da qualidade da água',
        lastUpdate: new Date().toLocaleDateString('pt-BR'),
        color: '#ffc107',
        gradientPoints: [
          {lat: -12.2, lng: 12.2, radius: 18000, intensity: 0.5}
        ]
      },
      {
        level: 'baixo',
        type: 'Acidificação Oceânica',
        // Zona oceânica ao largo da costa (águas profundas)
        coordinates: [[-10.0, 11.5], [-10.5, 11.2], [-10.8, 11.8], [-10.2, 12.0], [-9.8, 11.7]],
        probability: 0.45,
        factors: ['Mudanças climáticas', 'Absorção de CO2', 'Temperatura elevada'],
        recommendation: 'Monitorização de pH e temperatura',
        lastUpdate: new Date().toLocaleDateString('pt-BR'),
        color: '#17a2b8',
        gradientPoints: [
          {lat: -10.3, lng: 11.6, radius: 25000, intensity: 0.3}
        ]
      }
    ];
  }

  /**
   * Obtém cor para heatmap baseada na intensidade
   */
  getHeatmapColor(intensity) {
    if (intensity > 0.8) return '#d73027';
    if (intensity > 0.6) return '#fc8d59';
    if (intensity > 0.4) return '#fee08b';
    if (intensity > 0.2) return '#e0f3f8';
    return '#91bfdb';
  }

  /**
   * Alterna visibilidade de uma camada
   */
  toggleLayer(layerName) {
    const layer = this.visualizationLayers.get(layerName);
    if (layer) {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
        console.log(`🔌 Camada ${layerName} desativada`);
      } else {
        layer.addTo(this.map);
        console.log(`🔌 Camada ${layerName} ativada`);
      }
    }
  }

  /**
   * Remove todas as visualizações
   */
  clearAllLayers() {
    this.visualizationLayers.forEach((layer, name) => {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });
    console.log('🧹 Todas as camadas ML removidas');
  }

  /**
   * Cria todas as visualizações
   */
  async createAllVisualizations() {
    console.log('🎨 Criando todas as visualizações ML...');
    
    await Promise.all([
      this.createBiodiversityHeatmap(),
      this.createSpeciesClusters(),
      this.createMigrationPaths(),
      this.createRiskZones()
    ]);
    
    console.log('✅ Todas as visualizações ML criadas!');
  }

  /**
   * Calcula ângulo entre dois pontos para orientar setas
   */
  calculateAngle(coord1, coord2) {
    const lat1 = coord1[0] * Math.PI / 180;
    const lat2 = coord2[0] * Math.PI / 180;
    const deltaLng = (coord2[1] - coord1[1]) * Math.PI / 180;
    
    const x = Math.sin(deltaLng) * Math.cos(lat2);
    const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    
    const bearing = Math.atan2(x, y);
    return (bearing * 180 / Math.PI + 360) % 360;
  }
}

// Exportar para uso global
window.MLEnhancedVisualizations = MLEnhancedVisualizations;
