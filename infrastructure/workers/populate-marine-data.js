/**
 * Marine Data Populator Worker
 * Generates and populates marine environmental data for Angola EEZ
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
        console.log('🌊 Starting marine data population...');

        // First, check if table exists and current count
        try {
          const checkTable = await env.DB.prepare('SELECT COUNT(*) as count FROM marine_data').first();
          console.log('Current marine_data count:', checkTable.count);
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

        // Data types for marine environmental data
        const dataTypes = [
          'temperature',
          'salinity',
          'chlorophyll_a',
          'dissolved_oxygen',
          'ph_level',
          'turbidity',
          'wave_height',
          'current_speed'
        ];

        // Data sources
        const dataSources = [
          'copernicus',
          'nasa_modis',
          'noaa',
          'sentinel_3'
        ];

        const marineData = [];
        const baseDate = new Date();
        const gridSize = 0.25; // 0.25 degree grid for higher resolution

        // Generate marine data for last 7 days with 6-hour intervals
        for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
          for (let hour = 0; hour < 24; hour += 6) { // Every 6 hours
            const dataDate = new Date(baseDate);
            dataDate.setDate(dataDate.getDate() - daysAgo);
            dataDate.setHours(hour, 0, 0, 0);

            // Generate data points across the grid
            for (let lat = angolaEEZ.south; lat <= angolaEEZ.north; lat += gridSize) {
              for (let lon = angolaEEZ.west; lon <= angolaEEZ.east; lon += gridSize) {
                // Create bbox string (format: "min_lon,min_lat,max_lon,max_lat")
                const location_bbox = `${lon},${lat},${lon + gridSize},${lat + gridSize}`;

                // Select random data type and source
                const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)];
                const dataSource = dataSources[Math.floor(Math.random() * dataSources.length)];

                // Generate realistic data values based on type
                let dataValue;
                switch(dataType) {
                  case 'temperature':
                    dataValue = 20 + Math.random() * 10; // 20-30°C
                    break;
                  case 'salinity':
                    dataValue = 34 + Math.random() * 2; // 34-36 PSU
                    break;
                  case 'chlorophyll_a':
                    dataValue = Math.random() * 10; // 0-10 mg/m³
                    break;
                  case 'dissolved_oxygen':
                    dataValue = 5 + Math.random() * 3; // 5-8 mg/L
                    break;
                  case 'ph_level':
                    dataValue = 7.8 + Math.random() * 0.4; // 7.8-8.2
                    break;
                  case 'turbidity':
                    dataValue = Math.random() * 20; // 0-20 NTU
                    break;
                  case 'wave_height':
                    dataValue = 0.5 + Math.random() * 3; // 0.5-3.5 meters
                    break;
                  case 'current_speed':
                    dataValue = Math.random() * 2; // 0-2 m/s
                    break;
                }

                // Distance from shore affects some parameters
                const distance_from_shore = Math.abs(lon - 12) * 111 * Math.cos(lat * Math.PI / 180);

                // Metadata
                const metadata = {
                  unit: getUnit(dataType),
                  depth_m: Math.floor(Math.random() * 200), // 0-200m depth
                  quality_flag: Math.random() > 0.1 ? 'good' : 'suspect',
                  sensor_id: `SENSOR_${Math.floor(Math.random() * 100)}`,
                  distance_from_shore_km: Math.round(distance_from_shore),
                  grid_resolution: gridSize,
                  processing_level: 'L2'
                };

                // Set expiration (data expires after 30 days)
                const expiresAt = new Date(dataDate);
                expiresAt.setDate(expiresAt.getDate() + 30);

                marineData.push({
                  location_bbox: location_bbox,
                  timestamp: dataDate.toISOString(),
                  data_source: dataSource,
                  data_type: dataType,
                  data_value: dataValue,
                  metadata: JSON.stringify(metadata),
                  expires_at: expiresAt.toISOString()
                });

                // Limit total records to avoid overwhelming the database
                if (marineData.length >= 2000) {
                  break;
                }
              }
              if (marineData.length >= 2000) {
                break;
              }
            }
            if (marineData.length >= 2000) {
              break;
            }
          }
          if (marineData.length >= 2000) {
            break;
          }
        }

        console.log(`Generated ${marineData.length} marine data points to insert`);

        // Batch insert data
        const batchSize = 100;
        let totalInserted = 0;
        let failedBatches = 0;

        for (let i = 0; i < marineData.length; i += batchSize) {
          const batch = marineData.slice(i, i + batchSize);
          const statements = batch.map(d =>
            env.DB.prepare(`
              INSERT INTO marine_data (
                location_bbox, timestamp, data_source, data_type,
                data_value, metadata, expires_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
              d.location_bbox, d.timestamp, d.data_source, d.data_type,
              d.data_value, d.metadata, d.expires_at
            )
          );

          try {
            const result = await env.DB.batch(statements);
            totalInserted += batch.length;
            console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${totalInserted}/${marineData.length}`);
          } catch (error) {
            console.error(`Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
            failedBatches++;
          }
        }

        return new Response(JSON.stringify({
          success: totalInserted > 0,
          message: totalInserted > 0 ? 'Marine data populated successfully' : 'Failed to insert data',
          total_records: totalInserted,
          total_generated: marineData.length,
          failed_batches: failedBatches,
          days_covered: 7,
          data_types: dataTypes.length,
          grid_resolution: gridSize
        }), {
          status: totalInserted > 0 ? 200 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Error populating marine data:', error);
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Marine Data Populator - POST /populate to start', {
      headers: corsHeaders
    });
  }
};

// Helper function to get unit for data type
function getUnit(dataType) {
  const units = {
    'temperature': '°C',
    'salinity': 'PSU',
    'chlorophyll_a': 'mg/m³',
    'dissolved_oxygen': 'mg/L',
    'ph_level': 'pH',
    'turbidity': 'NTU',
    'wave_height': 'm',
    'current_speed': 'm/s'
  };
  return units[dataType] || 'unit';
}