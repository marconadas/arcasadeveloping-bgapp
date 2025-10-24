/**
 * ML Predictions Populator Worker
 * Generates and populates ML predictions for marine analysis in Angola EEZ
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
        console.log('🤖 Starting ML predictions population...');

        // First, check if table exists and is empty
        try {
          const checkTable = await env.DB.prepare('SELECT COUNT(*) as count FROM ml_predictions').first();
          console.log('Current ml_predictions count:', checkTable.count);
        } catch (error) {
          console.error('Error checking table:', error);
        }

        // Angola EEZ bounds
        const angolaEEZ = {
          north: -4.376,
          south: -18.042,
          east: 13.377,
          west: 11.679
        };

        // Different model types and prediction types
        const models = [
          { name: 'marine-biodiversity-cnn', type: 'species_distribution' },
          { name: 'vessel-detection-yolo', type: 'vessel_detection' },
          { name: 'pollution-risk-lstm', type: 'pollution_risk' },
          { name: 'fish-stock-prophet', type: 'fish_stock' },
          { name: 'coral-health-rf', type: 'coral_health' }
        ];

        const predictions = [];
        const gridSize = 0.5; // 0.5 degree grid

        // Generate predictions across the EEZ
        for (let model of models) {
          for (let lat = angolaEEZ.south; lat <= angolaEEZ.north; lat += gridSize) {
            for (let lon = angolaEEZ.west; lon <= angolaEEZ.east; lon += gridSize) {
              // Generate realistic prediction based on model type
              let prediction_value, confidence;

              switch(model.type) {
                case 'species_distribution':
                  prediction_value = Math.random() * 100; // Species count
                  confidence = 0.75 + Math.random() * 0.2;
                  break;
                case 'vessel_detection':
                  prediction_value = Math.random() > 0.7 ? 1 : 0; // Binary detection
                  confidence = 0.8 + Math.random() * 0.15;
                  break;
                case 'pollution_risk':
                  prediction_value = Math.random() * 10; // Risk score 0-10
                  confidence = 0.7 + Math.random() * 0.25;
                  break;
                case 'fish_stock':
                  prediction_value = 50 + Math.random() * 50; // Percentage
                  confidence = 0.65 + Math.random() * 0.3;
                  break;
                case 'coral_health':
                  prediction_value = Math.random() * 100; // Health index
                  confidence = 0.8 + Math.random() * 0.15;
                  break;
              }

              const metadata = {
                grid_resolution: gridSize,
                eez_region: lat < -16 ? 'south' : lat > -8 ? 'north' : 'central',
                depth_zone: Math.abs(lon - 12) > 1 ? 'deep' : 'coastal',
                model_version: '1.0.0',
                input_features: ['sst', 'chlorophyll', 'salinity', 'depth']
              };

              predictions.push({
                model_name: model.name,
                model_version: '1.0.0',
                prediction_type: model.type,
                latitude: lat,
                longitude: lon,
                prediction_value: prediction_value,
                confidence: confidence,
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                input_features: JSON.stringify(['sst', 'chlorophyll', 'salinity', 'depth']),
                metadata: JSON.stringify(metadata)
              });
            }
          }
        }

        console.log(`Generated ${predictions.length} predictions to insert`);

        // Batch insert predictions
        const batchSize = 100;
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
            const result = await env.DB.batch(statements);
            totalInserted += batch.length;
            console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${totalInserted}/${predictions.length}`);
          } catch (error) {
            console.error(`Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
            failedBatches++;

            // Try inserting one by one to identify problematic records
            if (batch.length <= 10) {
              for (let j = 0; j < batch.length; j++) {
                try {
                  const p = batch[j];
                  await env.DB.prepare(`
                    INSERT INTO ml_predictions (
                      model_name, prediction_type, latitude, longitude,
                      prediction_value, confidence, timestamp, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                  `).bind(
                    p.model_name, p.prediction_type, p.latitude, p.longitude,
                    p.prediction_value, p.confidence, p.timestamp, p.metadata
                  ).run();
                  totalInserted++;
                  console.log(`Single insert successful for record ${j}`);
                } catch (singleError) {
                  console.error(`Single insert failed for record ${j}:`, singleError.message);
                  console.error('Failed record:', JSON.stringify(batch[j]));
                }
              }
            }
          }
        }

        return new Response(JSON.stringify({
          success: totalInserted > 0,
          message: totalInserted > 0 ? 'ML predictions populated successfully' : 'Failed to insert predictions',
          total_predictions: totalInserted,
          total_generated: predictions.length,
          failed_batches: failedBatches,
          models_used: models.length,
          grid_size: gridSize
        }), {
          status: totalInserted > 0 ? 200 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Error populating ML predictions:', error);
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('ML Predictions Populator - POST /populate to start', {
      headers: corsHeaders
    });
  }
};