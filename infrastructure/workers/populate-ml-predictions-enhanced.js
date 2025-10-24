/**
 * Enhanced ML Predictions Populator Worker
 * Generates realistic oceanographic ML predictions for Angola EEZ
 * Aligned with 7 AI models expected by ml-demo frontend
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/populate' && request.method === 'POST') {
      try {
        console.log('🤖 Starting enhanced ML predictions population...');

        // Angola EEZ oceanographic zones
        const oceanographicZones = {
          // Upwelling zones (high productivity)
          namibe: { lat: -15.5, lon: 12.0, radius: 1.5, productivity: 'very_high' },
          benguela: { lat: -12.8, lon: 13.0, radius: 2.0, productivity: 'very_high' },

          // Coastal zones
          luanda: { lat: -8.8, lon: 13.2, radius: 1.0, productivity: 'high' },
          lobito: { lat: -12.3, lon: 13.5, radius: 1.0, productivity: 'high' },

          // River deltas (nutrient-rich)
          congo_delta: { lat: -6.0, lon: 12.2, radius: 1.5, productivity: 'high' },
          kwanza_delta: { lat: -9.3, lon: 13.2, radius: 1.0, productivity: 'moderate' },

          // Offshore zones
          offshore_north: { lat: -7.0, lon: 11.5, radius: 2.0, productivity: 'low' },
          offshore_south: { lat: -14.0, lon: 11.0, radius: 2.5, productivity: 'moderate' }
        };

        // 7 AI models aligned with ml-demo
        const aiModels = [
          {
            name: 'biodiversity-hotspot-detector',
            type: 'biodiversityHotspots',
            baseConfidence: 0.89,
            description: 'Identifies areas of high marine biodiversity'
          },
          {
            name: 'species-presence-predictor',
            type: 'speciesPresence',
            baseConfidence: 0.91,
            description: 'Predicts presence of key marine species'
          },
          {
            name: 'habitat-suitability-analyzer',
            type: 'habitatSuitability',
            baseConfidence: 0.87,
            description: 'Analyzes habitat suitability for marine life'
          },
          {
            name: 'conservation-priority-classifier',
            type: 'conservationPriority',
            baseConfidence: 0.94,
            description: 'Classifies areas by conservation importance'
          },
          {
            name: 'fishing-zone-optimizer',
            type: 'fishingZones',
            baseConfidence: 0.85,
            description: 'Identifies optimal fishing zones'
          },
          {
            name: 'monitoring-point-selector',
            type: 'monitoringPoints',
            baseConfidence: 0.92,
            description: 'Selects key monitoring locations'
          },
          {
            name: 'risk-assessment-engine',
            type: 'riskAssessment',
            baseConfidence: 0.88,
            description: 'Assesses environmental and operational risks'
          }
        ];

        // Helper function to calculate distance between two points
        function getDistance(lat1, lon1, lat2, lon2) {
          const R = 6371; // Earth radius in km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        }

        // Helper function to get zone influence on a point
        function getZoneInfluence(lat, lon, zones) {
          let maxInfluence = 0;
          let dominantZone = null;

          for (const [zoneName, zone] of Object.entries(zones)) {
            const distance = getDistance(lat, lon, zone.lat, zone.lon);
            const influence = Math.max(0, 1 - (distance / (zone.radius * 111))); // Convert radius to km

            if (influence > maxInfluence) {
              maxInfluence = influence;
              dominantZone = { name: zoneName, ...zone, influence };
            }
          }

          return dominantZone || { name: 'open_ocean', productivity: 'low', influence: 0 };
        }

        // Generate realistic prediction values based on model type and location
        function generatePredictionValue(modelType, zoneInfo, lat, lon) {
          const productivityMultiplier = {
            'very_high': 1.0,
            'high': 0.8,
            'moderate': 0.6,
            'low': 0.3
          }[zoneInfo.productivity];

          // Add some noise based on location
          const noise = Math.sin(lat * 10) * Math.cos(lon * 10) * 0.2;

          switch(modelType) {
            case 'biodiversityHotspots':
              // Higher in upwelling zones and river deltas
              const biodiversityBase = productivityMultiplier * 80 + noise * 10;
              return Math.max(10, Math.min(100, biodiversityBase + Math.random() * 20));

            case 'speciesPresence':
              // Categorical with probability
              const speciesProb = productivityMultiplier * 0.7 + Math.random() * 0.3;
              return speciesProb;

            case 'habitatSuitability':
              // Score 0-100 based on multiple factors
              const depth = Math.abs(lon - 13) * 50; // Simplified depth model
              const temperature = 24 - Math.abs(lat + 12) * 0.5; // SST gradient
              const suitability = (productivityMultiplier * 40) + (temperature * 2) - (depth * 0.1);
              return Math.max(0, Math.min(100, suitability + noise * 15));

            case 'conservationPriority':
              // Higher near biodiversity hotspots
              const conservationScore = productivityMultiplier * 70 + zoneInfo.influence * 30;
              return Math.max(0, Math.min(100, conservationScore + Math.random() * 15));

            case 'fishingZones':
              // Optimal in moderate productivity areas
              const fishingScore = (productivityMultiplier === 0.8 ? 90 : productivityMultiplier * 60);
              return Math.max(0, Math.min(100, fishingScore + noise * 20));

            case 'monitoringPoints':
              // Strategic locations get higher scores
              const isStrategic = (Math.abs(lat % 2) < 0.5 && Math.abs(lon % 2) < 0.5);
              const monitoringScore = isStrategic ? 85 : 40;
              return Math.max(0, Math.min(100, monitoringScore + Math.random() * 15));

            case 'riskAssessment':
              // Higher risk near shipping lanes and oil platforms
              const shippingRisk = (lat > -10 && lat < -8) ? 30 : 0; // Luanda shipping
              const oilRisk = (lat > -7 && lat < -5 && lon < 12) ? 40 : 0; // Oil fields
              const environmentalRisk = (1 - productivityMultiplier) * 30;
              return Math.max(0, Math.min(100, shippingRisk + oilRisk + environmentalRisk + Math.random() * 20));

            default:
              return Math.random() * 100;
          }
        }

        // Generate confidence based on model type and data availability
        function generateConfidence(modelType, baseConfidence, zoneInfo) {
          // Higher confidence in well-studied zones
          const zoneBonus = zoneInfo.influence * 0.1;
          const variability = (Math.random() - 0.5) * 0.1;
          return Math.max(0.5, Math.min(1.0, baseConfidence + zoneBonus + variability));
        }

        const predictions = [];
        const now = Date.now();

        // Generate grid of predictions with clustering around zones
        for (const model of aiModels) {
          // Dense sampling in high-productivity zones
          for (const [zoneName, zone] of Object.entries(oceanographicZones)) {
            if (zone.productivity === 'very_high' || zone.productivity === 'high') {
              // Higher resolution in important zones
              const gridSize = 0.25;

              for (let dlat = -zone.radius; dlat <= zone.radius; dlat += gridSize) {
                for (let dlon = -zone.radius; dlon <= zone.radius; dlon += gridSize) {
                  const lat = zone.lat + dlat;
                  const lon = zone.lon + dlon;

                  // Check if point is within Angola EEZ bounds
                  if (lat < -18.042 || lat > -4.376 || lon < 11.679 || lon > 13.577) continue;

                  const zoneInfo = getZoneInfluence(lat, lon, oceanographicZones);
                  const predictionValue = generatePredictionValue(model.type, zoneInfo, lat, lon);
                  const confidence = generateConfidence(model.type, model.baseConfidence, zoneInfo);

                  // Generate metadata with oceanographic context
                  const metadata = {
                    zone: zoneInfo.name,
                    zone_productivity: zoneInfo.productivity,
                    zone_influence: zoneInfo.influence.toFixed(3),
                    depth_estimate: Math.abs(lon - 13) * 1000, // Simplified depth model
                    sst_estimate: 24 - Math.abs(lat + 12) * 0.5, // SST gradient
                    chlorophyll_estimate: zoneInfo.productivity === 'very_high' ? 2.5 + Math.random() : 0.5 + Math.random(),
                    model_version: '2.0.0',
                    algorithm: model.type === 'speciesPresence' ? 'random_forest' :
                              model.type === 'biodiversityHotspots' ? 'cnn' :
                              model.type === 'fishingZones' ? 'optimization' : 'ensemble',
                    input_features: ['sst', 'chlorophyll', 'salinity', 'depth', 'currents'],
                    prediction_unit: model.type === 'speciesPresence' ? 'probability' :
                                   model.type === 'biodiversityHotspots' ? 'species_count' :
                                   model.type === 'habitatSuitability' ? 'suitability_index' :
                                   model.type === 'conservationPriority' ? 'priority_score' :
                                   model.type === 'fishingZones' ? 'cpue_index' :
                                   model.type === 'monitoringPoints' ? 'importance_score' :
                                   model.type === 'riskAssessment' ? 'risk_level' : 'score'
                  };

                  predictions.push({
                    model_name: model.name,
                    model_version: '2.0.0',
                    prediction_type: model.type,
                    latitude: parseFloat(lat.toFixed(4)),
                    longitude: parseFloat(lon.toFixed(4)),
                    prediction_value: predictionValue,
                    confidence: confidence,
                    timestamp: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                    input_features: JSON.stringify(metadata.input_features),
                    metadata: JSON.stringify(metadata)
                  });
                }
              }
            }
          }

          // Sparse sampling for open ocean areas
          const sparseGridSize = 1.0;
          for (let lat = -18; lat <= -5; lat += sparseGridSize) {
            for (let lon = 11.7; lon <= 13.5; lon += sparseGridSize) {
              const zoneInfo = getZoneInfluence(lat, lon, oceanographicZones);

              // Skip if already covered by zone sampling
              if (zoneInfo.influence > 0.5) continue;

              const predictionValue = generatePredictionValue(model.type, zoneInfo, lat, lon);
              const confidence = generateConfidence(model.type, model.baseConfidence, zoneInfo);

              const metadata = {
                zone: 'open_ocean',
                zone_productivity: 'low',
                zone_influence: '0.000',
                depth_estimate: Math.abs(lon - 13) * 2000,
                sst_estimate: 23 - Math.abs(lat + 12) * 0.3,
                chlorophyll_estimate: 0.2 + Math.random() * 0.3,
                model_version: '2.0.0',
                algorithm: 'ensemble',
                input_features: ['sst', 'chlorophyll', 'depth'],
                prediction_unit: 'score'
              };

              predictions.push({
                model_name: model.name,
                model_version: '2.0.0',
                prediction_type: model.type,
                latitude: parseFloat(lat.toFixed(4)),
                longitude: parseFloat(lon.toFixed(4)),
                prediction_value: predictionValue,
                confidence: confidence,
                timestamp: new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                input_features: JSON.stringify(metadata.input_features),
                metadata: JSON.stringify(metadata)
              });
            }
          }
        }

        console.log(`Generated ${predictions.length} predictions to insert`);
        console.log(`Models: ${aiModels.length}, Zones: ${Object.keys(oceanographicZones).length}`);

        // Clear existing data first
        try {
          await env.DB.prepare('DELETE FROM ml_predictions').run();
          console.log('Cleared existing ml_predictions data');
        } catch (error) {
          console.error('Error clearing table:', error);
        }

        // Batch insert predictions
        const batchSize = 50;
        let totalInserted = 0;
        let failedBatches = 0;

        for (let i = 0; i < predictions.length; i += batchSize) {
          const batch = predictions.slice(i, i + batchSize);
          const statements = batch.map(p =>
            env.DB.prepare(`
              INSERT INTO ml_predictions (
                model_name, model_version, prediction_type, latitude, longitude,
                prediction_value, confidence, timestamp, input_features, metadata
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              p.model_name, p.model_version, p.prediction_type, p.latitude, p.longitude,
              p.prediction_value, p.confidence, p.timestamp, p.input_features, p.metadata
            )
          );

          try {
            await env.DB.batch(statements);
            totalInserted += batch.length;
            console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${totalInserted}/${predictions.length}`);
          } catch (error) {
            console.error(`Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
            failedBatches++;
          }
        }

        // Generate summary statistics
        const modelStats = {};
        for (const model of aiModels) {
          const modelPredictions = predictions.filter(p => p.prediction_type === model.type);
          modelStats[model.type] = {
            count: modelPredictions.length,
            avgConfidence: (modelPredictions.reduce((sum, p) => sum + p.confidence, 0) / modelPredictions.length).toFixed(3),
            avgValue: (modelPredictions.reduce((sum, p) => sum + p.prediction_value, 0) / modelPredictions.length).toFixed(2)
          };
        }

        return new Response(JSON.stringify({
          success: totalInserted > 0,
          message: totalInserted > 0 ? 'Enhanced ML predictions populated successfully' : 'Failed to insert predictions',
          total_predictions: totalInserted,
          total_generated: predictions.length,
          failed_batches: failedBatches,
          models_used: aiModels.length,
          model_types: aiModels.map(m => m.type),
          zones_defined: Object.keys(oceanographicZones).length,
          statistics: modelStats
        }), {
          status: totalInserted > 0 ? 200 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Error populating enhanced ML predictions:', error);
        return new Response(JSON.stringify({
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Enhanced ML Predictions Populator - POST /populate to start', {
      headers: corsHeaders
    });
  }
};