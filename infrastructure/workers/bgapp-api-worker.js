/**
 * Neptune(ANG) API Worker - Oceanographic Data Service
 * Serves real oceanographic data from D1 database for realtime-angola application
 * Replaces synthetic data with actual NASA, Copernicus, and ML prediction data
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers - standard pattern from gfw-proxy.js
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
      'Access-Control-Allow-Credentials': 'false',
      'Access-Control-Max-Age': '86400'
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: env.BGAPP_DATA ? 'connected' : 'unavailable'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Main oceanographic data endpoint
    if (url.pathname === '/api/oceanographic' && request.method === 'GET') {
      try {
        const params = url.searchParams;
        const dataType = params.get('type') || 'all';
        const source = params.get('source') || 'all';
        const limit = Math.min(parseInt(params.get('limit') || '1000'), 5000);

        // Angola EEZ boundaries from copernicus-webhook.js pattern
        const bounds = {
          minLat: parseFloat(params.get('minLat') || '-18.02'),
          maxLat: parseFloat(params.get('maxLat') || '-5.55'),
          minLon: parseFloat(params.get('minLon') || '8.9'),
          maxLon: parseFloat(params.get('maxLon') || '13.35')
        };

        const result = {
          sst: [],
          ocean_color: [],
          salinity: [],
          vessel_lights: [],
          ml_predictions: [],
          metadata: {
            source: 'bgapp-d1-database',
            timestamp: new Date().toISOString(),
            bounds: bounds,
            filters: { dataType, source, limit }
          }
        };

        // Query SST data with quality filtering
        if (dataType === 'all' || dataType === 'sst') {
          // Try cache first
          const cacheKey = `sst:${source}:${bounds.minLat},${bounds.maxLat},${bounds.minLon},${bounds.maxLon}:${limit}`;
          const cached = await env.BGAPP_KV?.get(cacheKey, { type: 'json' });
          
          if (cached && (Date.now() - cached.timestamp) < 3600000) { // 1 hour cache
            result.sst = cached.data;
          } else {
            const sstQuery = `
              SELECT
                latitude, longitude, temperature,
                data_source, timestamp, quality_flag
              FROM sst_data
              WHERE latitude BETWEEN ? AND ?
                AND longitude BETWEEN ? AND ?
                AND temperature BETWEEN 15 AND 32
                ${source !== 'all' ? 'AND data_source = ?' : ''}
              ORDER BY timestamp DESC
              LIMIT ?
            `;

            const sstParams = source !== 'all'
              ? [bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon, source, limit]
              : [bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon, limit];

            const sstResults = await env.BGAPP_DATA.prepare(sstQuery)
              .bind(...sstParams)
              .all();

            result.sst = sstResults.results || [];
            
            // Cache the results
            if (env.BGAPP_KV && result.sst.length > 0) {
              await env.BGAPP_KV.put(cacheKey, JSON.stringify({
                data: result.sst,
                timestamp: Date.now()
              }), { expirationTtl: 3600 }); // 1 hour TTL
            }
          }
        }

        // Query Ocean Color data with quality filtering
        if (dataType === 'all' || dataType === 'ocean_color') {
          // Try cache first
          const cacheKey = `ocean_color:${source}:${bounds.minLat},${bounds.maxLat},${bounds.minLon},${bounds.maxLon}:${limit}`;
          const cached = await env.BGAPP_KV?.get(cacheKey, { type: 'json' });
          
          if (cached && (Date.now() - cached.timestamp) < 3600000) { // 1 hour cache
            result.ocean_color = cached.data;
          } else {
            const oceanColorQuery = `
              SELECT
                latitude, longitude, chlorophyll_a,
                data_source, timestamp, quality_flag
              FROM ocean_color_data
              WHERE latitude BETWEEN ? AND ?
                AND longitude BETWEEN ? AND ?
                AND chlorophyll_a BETWEEN 0.01 AND 100
                ${source !== 'all' ? 'AND data_source = ?' : ''}
              ORDER BY timestamp DESC
              LIMIT ?
            `;

            const oceanColorParams = source !== 'all'
              ? [bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon, source, limit]
              : [bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon, limit];

            const oceanColorResults = await env.BGAPP_DATA.prepare(oceanColorQuery)
              .bind(...oceanColorParams)
              .all();

            result.ocean_color = oceanColorResults.results || [];
            
            // Cache the results
            if (env.BGAPP_KV && result.ocean_color.length > 0) {
              await env.BGAPP_KV.put(cacheKey, JSON.stringify({
                data: result.ocean_color,
                timestamp: Date.now()
              }), { expirationTtl: 3600 });
            }
          }
        }

        // Query Salinity data with quality filtering
        if (dataType === 'all' || dataType === 'salinity') {
          // Try cache first
          const cacheKey = `salinity:${source}:${bounds.minLat},${bounds.maxLat},${bounds.minLon},${bounds.maxLon}:${limit}`;
          const cached = await env.BGAPP_KV?.get(cacheKey, { type: 'json' });

          if (cached && (Date.now() - cached.timestamp) < 3600000) { // 1 hour cache
            result.salinity = cached.data;
          } else {
            // Angola EEZ boundary filtering using actual geometry from eez_boundaries table
            // Angola has TWO EEZ polygons: Continental + Cabinda
            // CONTINENTAL: lat -17.29 to -5.36, lon 8.30 to 13.84 (from D1 geometry)
            // CABINDA: lat ~-5.8 to -4.3, lon ~12.0 to 13.5 (exclave in north)
            // Combined bounding box: lat -17.29 to -4.3, lon 8.30 to 13.84
            const salinityQuery = `
              SELECT
                latitude, longitude, salinity,
                data_source, timestamp, quality_flag, depth
              FROM salinity_data
              WHERE latitude >= ? AND latitude <= ?
                AND longitude >= ? AND longitude <= ?
                AND salinity BETWEEN 30 AND 37
                AND latitude >= -17.29 AND latitude <= -4.3
                AND longitude >= 8.30 AND longitude <= 13.84
                ${source !== 'all' ? 'AND data_source = ?' : ''}
              ORDER BY timestamp DESC
              LIMIT ?
            `;

            const salinityParams = source !== 'all'
              ? [bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon, source, limit]
              : [bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon, limit];

            const salinityResults = await env.BGAPP_DATA.prepare(salinityQuery)
              .bind(...salinityParams)
              .all();

            result.salinity = salinityResults.results || [];

            // Cache the results
            if (env.BGAPP_KV && result.salinity.length > 0) {
              await env.BGAPP_KV.put(cacheKey, JSON.stringify({
                data: result.salinity,
                timestamp: Date.now()
              }), { expirationTtl: 3600 });
            }
          }
        }

        // Query Vessel Lights data
        if (dataType === 'all' || dataType === 'vessel_lights') {
          const vesselLightsQuery = `
            SELECT
              latitude, longitude, radiance,
              timestamp, quality_flag
            FROM vessel_lights_data
            WHERE latitude BETWEEN ? AND ?
              AND longitude BETWEEN ? AND ?
            ORDER BY timestamp DESC
            LIMIT ?
          `;

          const vesselLightsResults = await env.BGAPP_DATA.prepare(vesselLightsQuery)
            .bind(bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon, limit)
            .all();

          result.vessel_lights = vesselLightsResults.results || [];
        }

        // Query ML Predictions with optional filters
        if (dataType === 'all' || dataType === 'ml_predictions') {
          const minConfidence = parseFloat(params.get('minConfidence')) || 0;
          const predictionTypes = params.get('prediction_type');

          let mlQuery = `
            SELECT
              latitude, longitude, prediction_type,
              confidence, model_name, prediction_value,
              metadata, timestamp
            FROM ml_predictions
            WHERE latitude BETWEEN ? AND ?
              AND longitude BETWEEN ? AND ?
              AND confidence >= ?
          `;

          const mlParams = [bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon, minConfidence];

          // Filter by prediction types if specified (comma-separated list)
          if (predictionTypes) {
            const types = predictionTypes.split(',').map(t => t.trim());
            const placeholders = types.map(() => '?').join(',');
            mlQuery += ` AND prediction_type IN (${placeholders})`;
            mlParams.push(...types);
          }

          mlQuery += ' ORDER BY timestamp DESC LIMIT ?';
          mlParams.push(limit);

          const mlResults = await env.BGAPP_DATA.prepare(mlQuery)
            .bind(...mlParams)
            .all();

          result.ml_predictions = mlResults.results || [];
        }

        // Add statistics to metadata
        result.metadata.counts = {
          sst: result.sst.length,
          ocean_color: result.ocean_color.length,
          salinity: result.salinity.length,
          vessel_lights: result.vessel_lights.length,
          ml_predictions: result.ml_predictions.length,
          total: result.sst.length + result.ocean_color.length + result.salinity.length +
                 result.vessel_lights.length + result.ml_predictions.length
        };

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Error fetching oceanographic data:', error);
        return new Response(JSON.stringify({
          error: 'Failed to fetch oceanographic data',
          message: error.message,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ML Predictions endpoint
    if (url.pathname === '/api/ml/predictions' && request.method === 'GET') {
      try {
        const lat = parseFloat(url.searchParams.get('lat') || '-12.5');
        const lon = parseFloat(url.searchParams.get('lon') || '13.0');
        const radius = parseFloat(url.searchParams.get('radius') || '0.5');
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const predictionType = url.searchParams.get('type');
        const minConfidence = parseFloat(url.searchParams.get('minConfidence')) || 0;

        // Calculate bounds from center point and radius
        const minLat = lat - radius;
        const maxLat = lat + radius;
        const minLon = lon - radius;
        const maxLon = lon + radius;

        let query = `
          SELECT
            latitude as lat,
            longitude as lon,
            prediction_type,
            confidence,
            model_name,
            prediction_value,
            metadata,
            timestamp
          FROM ml_predictions
          WHERE latitude BETWEEN ? AND ?
            AND longitude BETWEEN ? AND ?
            AND confidence >= ?
        `;

        const params = [minLat, maxLat, minLon, maxLon, minConfidence];

        if (predictionType) {
          query += ' AND prediction_type = ?';
          params.push(predictionType);
        }

        query += ' ORDER BY confidence DESC LIMIT ?';
        params.push(limit);

        const result = await env.BGAPP_DATA.prepare(query).bind(...params).all();

        return new Response(JSON.stringify({
          success: true,
          data: result.results || [],
          count: result.results?.length || 0,
          bounds: { minLat, maxLat, minLon, maxLon }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('ML predictions error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to fetch ML predictions',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Weather Current endpoint
    if (url.pathname === '/api/weather/current' && request.method === 'GET') {
      try {
        const lat = parseFloat(url.searchParams.get('lat') || '-12.5');
        const lon = parseFloat(url.searchParams.get('lon') || '13.0');

        // Check KV cache first
        const cacheKey = `weather:current:${lat.toFixed(2)}_${lon.toFixed(2)}`;
        if (env.BGAPP_KV) {
          const cached = await env.BGAPP_KV.get(cacheKey, { type: 'json' });
          if (cached && (Date.now() - cached.timestamp) < 21600000) { // 6 hour cache
            return new Response(JSON.stringify({
              ...cached,
              cached: true,
              cache_age_minutes: Math.floor((Date.now() - cached.timestamp) / 60000)
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
            });
          }
        }

        // Query from D1 database
        const query = `
          SELECT
            latitude, longitude, temperature, apparent_temperature,
            relative_humidity, precipitation, rain,
            wind_speed_10m, wind_direction_10m, wind_gusts_10m,
            cloud_cover, pressure_msl, visibility,
            timestamp, data_source, quality_flag
          FROM weather_data
          WHERE latitude BETWEEN ? AND ?
            AND longitude BETWEEN ? AND ?
          ORDER BY timestamp DESC
          LIMIT 1
        `;

        const result = await env.BGAPP_DATA.prepare(query)
          .bind(lat - 0.1, lat + 0.1, lon - 0.1, lon + 0.1)
          .all();

        const weatherData = result.results?.[0] || null;

        if (weatherData && env.BGAPP_KV) {
          await env.BGAPP_KV.put(cacheKey, JSON.stringify({
            ...weatherData,
            timestamp: Date.now()
          }), { expirationTtl: 21600 });
        }

        return new Response(JSON.stringify({
          success: true,
          data: weatherData,
          cached: false
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
        });

      } catch (error) {
        console.error('Weather current error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to fetch current weather',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Weather Forecast endpoint
    if (url.pathname === '/api/weather/forecast' && request.method === 'GET') {
      try {
        const lat = parseFloat(url.searchParams.get('lat') || '-12.5');
        const lon = parseFloat(url.searchParams.get('lon') || '13.0');
        const days = parseInt(url.searchParams.get('days') || '7');

        // Check KV cache first
        const cacheKey = `weather:forecast:${lat.toFixed(2)}_${lon.toFixed(2)}_${days}`;
        if (env.BGAPP_KV) {
          const cached = await env.BGAPP_KV.get(cacheKey, { type: 'json' });
          if (cached && (Date.now() - cached.timestamp) < 86400000) { // 24 hour cache
            return new Response(JSON.stringify({
              ...cached,
              cached: true,
              cache_age_hours: Math.floor((Date.now() - cached.timestamp) / 3600000)
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
            });
          }
        }

        // Query from D1 database
        const query = `
          SELECT
            latitude, longitude, forecast_date, forecast_hour,
            temperature, temperature_max, temperature_min,
            precipitation_sum, precipitation_probability,
            wind_speed_max, wind_speed, wind_direction,
            cloud_cover, relative_humidity,
            data_source, created_at
          FROM weather_forecast
          WHERE latitude BETWEEN ? AND ?
            AND longitude BETWEEN ? AND ?
            AND forecast_date >= date('now')
            AND forecast_date <= date('now', '+' || ? || ' days')
          ORDER BY forecast_date, forecast_hour
        `;

        const result = await env.BGAPP_DATA.prepare(query)
          .bind(lat - 0.1, lat + 0.1, lon - 0.1, lon + 0.1, days)
          .all();

        const forecastData = result.results || [];

        if (forecastData.length > 0 && env.BGAPP_KV) {
          await env.BGAPP_KV.put(cacheKey, JSON.stringify({
            data: forecastData,
            timestamp: Date.now()
          }), { expirationTtl: 86400 });
        }

        return new Response(JSON.stringify({
          success: true,
          data: forecastData,
          count: forecastData.length,
          cached: false
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
        });

      } catch (error) {
        console.error('Weather forecast error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to fetch weather forecast',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Weather Grid endpoint
    if (url.pathname === '/api/weather/grid' && request.method === 'GET') {
      try {
        const params = url.searchParams;
        const minLat = parseFloat(params.get('minLat') || '-18.02');
        const maxLat = parseFloat(params.get('maxLat') || '-5.55');
        const minLon = parseFloat(params.get('minLon') || '8.9');
        const maxLon = parseFloat(params.get('maxLon') || '13.35');

        // Check KV cache first
        const cacheKey = `weather:grid:${minLat}_${maxLat}_${minLon}_${maxLon}`;
        if (env.BGAPP_KV) {
          const cached = await env.BGAPP_KV.get(cacheKey, { type: 'json' });
          if (cached && (Date.now() - cached.timestamp) < 43200000) { // 12 hour cache
            return new Response(JSON.stringify({
              ...cached,
              cached: true,
              cache_age_hours: Math.floor((Date.now() - cached.timestamp) / 3600000)
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
            });
          }
        }

        // Query from D1 database
        const query = `
          SELECT
            grid_id, center_lat, center_lon,
            avg_temperature, max_temperature, min_temperature,
            avg_wind_speed, max_wind_speed, dominant_wind_direction,
            total_precipitation, avg_cloud_cover, avg_pressure,
            data_points, quality_avg, last_update
          FROM weather_grid_summary
          WHERE center_lat BETWEEN ? AND ?
            AND center_lon BETWEEN ? AND ?
            AND last_update > datetime('now', '-12 hours')
          ORDER BY center_lat, center_lon
        `;

        const result = await env.BGAPP_DATA.prepare(query)
          .bind(minLat, maxLat, minLon, maxLon)
          .all();

        const gridData = result.results || [];

        if (gridData.length > 0 && env.BGAPP_KV) {
          await env.BGAPP_KV.put(cacheKey, JSON.stringify({
            data: gridData,
            timestamp: Date.now()
          }), { expirationTtl: 43200 });
        }

        return new Response(JSON.stringify({
          success: true,
          data: gridData,
          count: gridData.length,
          bounds: { minLat, maxLat, minLon, maxLon },
          cached: false
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
        });

      } catch (error) {
        console.error('Weather grid error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to fetch weather grid',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Species catalog endpoints - WoRMS integration
    if (url.pathname === '/api/species/search' && request.method === 'GET') {
      try {
        const query = url.searchParams.get('q') || '';
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

        if (!query || query.length < 2) {
          return new Response(JSON.stringify({
            error: 'Query parameter "q" required (min 2 characters)'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const searchQuery = `
          SELECT
            aphia_id, scientific_name, authority,
            common_name_pt, common_name_en,
            family, genus, species,
            is_marine, status, taxonomic_status,
            angola_eez_relevance, worms_url
          FROM marine_species
          WHERE scientific_name LIKE ?
            OR common_name_pt LIKE ?
            OR common_name_en LIKE ?
            OR family LIKE ?
          ORDER BY angola_eez_relevance DESC, scientific_name
          LIMIT ?
        `;

        const searchPattern = `%${query}%`;
        const results = await env.BGAPP_DATA.prepare(searchQuery)
          .bind(searchPattern, searchPattern, searchPattern, searchPattern, limit)
          .all();

        return new Response(JSON.stringify({
          success: true,
          query: query,
          total: results.results?.length || 0,
          species: results.results || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Species search error:', error);
        return new Response(JSON.stringify({
          error: 'Species search failed',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get species by AphiaID
    if (url.pathname.startsWith('/api/species/') && url.pathname !== '/api/species/search' && url.pathname !== '/api/species/commercial' && !url.pathname.includes('/priority/')) {
      try {
        const aphiaId = url.pathname.split('/api/species/')[1];

        const query = `
          SELECT
            aphia_id, scientific_name, authority,
            kingdom, phylum, class, order_name, family, genus, species,
            common_name_pt, common_name_en, vernacular_names,
            is_marine, is_brackish, is_freshwater, is_terrestrial,
            status, taxonomic_status,
            angola_eez_relevance, conservation_status,
            worms_url, lsid, citation,
            data_source, last_updated
          FROM marine_species
          WHERE aphia_id = ?
        `;

        const result = await env.BGAPP_DATA.prepare(query)
          .bind(parseInt(aphiaId))
          .first();

        if (!result) {
          return new Response(JSON.stringify({
            error: 'Species not found',
            aphia_id: aphiaId
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          species: result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Species by ID error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to fetch species',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get commercial species
    if (url.pathname === '/api/species/commercial' && request.method === 'GET') {
      try {
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

        const query = `
          SELECT
            aphia_id, scientific_name,
            common_name_pt, common_name_en,
            family, angola_eez_relevance
          FROM commercial_species
          ORDER BY angola_eez_relevance DESC, scientific_name
          LIMIT ?
        `;

        const results = await env.BGAPP_DATA.prepare(query)
          .bind(limit)
          .all();

        return new Response(JSON.stringify({
          success: true,
          total: results.results?.length || 0,
          species: results.results || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Commercial species error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to fetch commercial species',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get priority species statistics
    if (url.pathname === '/api/species/priority/stats' && request.method === 'GET') {
      try {
        const statsQuery = `
          SELECT
            priority_level,
            COUNT(*) as total,
            SUM(CASE WHEN populated = 1 THEN 1 ELSE 0 END) as populated
          FROM angola_priority_species
          GROUP BY priority_level
          ORDER BY priority_level
        `;

        const results = await env.BGAPP_DATA.prepare(statsQuery).all();

        return new Response(JSON.stringify({
          success: true,
          by_priority_level: results.results || [],
          total_priority: results.results?.reduce((sum, r) => sum + r.total, 0) || 0,
          total_populated: results.results?.reduce((sum, r) => sum + r.populated, 0) || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Priority stats error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to fetch priority statistics',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Version endpoint
    if (url.pathname === '/api/version') {
      return new Response(JSON.stringify({
        version: '1.0.0',
        name: 'bgapp-api-worker',
        description: 'Oceanographic data service for BGAPP realtime Angola',
        endpoints: [
          '/health',
          '/api/oceanographic',
          '/api/ml/predictions',
          '/api/weather/current',
          '/api/weather/forecast',
          '/api/weather/grid',
          '/api/species/search',
          '/api/species/{aphia_id}',
          '/api/species/commercial',
          '/api/species/priority/stats',
          '/api/version'
        ],
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({
      error: 'Not Found',
      available_endpoints: [
        '/health',
        '/api/oceanographic',
        '/api/ml/predictions',
        '/api/weather/current',
        '/api/weather/forecast',
        '/api/weather/grid',
        '/api/species/search',
        '/api/species/{aphia_id}',
        '/api/species/commercial',
        '/api/species/priority/stats',
        '/api/version'
      ]
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
