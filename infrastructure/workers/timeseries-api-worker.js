/**
 * Time-Series API Worker
 * Cloudflare Worker for serving temporal oceanographic data for animations
 *
 * Endpoints:
 * - GET /api/timeseries/frames: Get frame metadata for timeline UI
 * - GET /api/timeseries/frame/:dataType/:frameIndex: Get specific frame data
 * - GET /api/timeseries/range: Get data for time range (bulk fetch)
 * - GET /api/timeseries/forecast: Get 7-day weather forecast (Open-Meteo integration)
 *
 * @requires BGAPP_DATA (D1 Database)
 * @requires BGAPP_KV (KV Namespace for frame caching)
 */

// Angola EEZ spatial bounds
const ANGOLA_EEZ = {
  continental: {
    minLat: -17.29,
    maxLat: -5.36,
    minLon: 8.30,
    maxLon: 13.84
  },
  cabinda: {
    minLat: -5.8,
    maxLat: -4.3,
    minLon: 12.0,
    maxLon: 13.5
  }
};

// Cache TTLs
const CACHE_TTL = {
  frames_metadata: 3600,    // 1 hour
  frame_data: 7200,         // 2 hours
  forecast: 1800            // 30 minutes
};

/**
 * CORS headers
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle OPTIONS preflight
 */
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders()
  });
}

/**
 * Get frames metadata from D1 timeseries_frames_metadata table
 */
async function getFramesMetadata(env, dataType, days = 30) {
  const cacheKey = `frames_metadata_${dataType}_${days}d`;

  // Check KV cache
  const cached = await env.BGAPP_KV.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    // Query D1 for frames metadata
    const result = await env.BGAPP_DATA.prepare(`
      SELECT
        frame_index,
        frame_timestamp,
        data_points,
        min_value,
        max_value,
        avg_value,
        coverage_area_km2
      FROM timeseries_frames_metadata
      WHERE data_type = ?
        AND frame_timestamp >= datetime('now', '-' || ? || ' days')
      ORDER BY frame_index
    `).bind(dataType, days).all();

    const response = {
      dataType,
      totalFrames: result.results.length,
      timeRange: {
        start: result.results[0]?.frame_timestamp || null,
        end: result.results[result.results.length - 1]?.frame_timestamp || null
      },
      frames: result.results.map(row => ({
        frameIndex: row.frame_index,
        timestamp: row.frame_timestamp,
        dataPoints: row.data_points,
        minValue: row.min_value,
        maxValue: row.max_value,
        avgValue: row.avg_value,
        coverageAreaKm2: row.coverage_area_km2
      }))
    };

    // Cache in KV
    await env.BGAPP_KV.put(cacheKey, JSON.stringify(response), {
      expirationTtl: CACHE_TTL.frames_metadata
    });

    return response;
  } catch (error) {
    console.error('Error fetching frames metadata:', error);
    throw error;
  }
}

/**
 * Get specific frame data from D1
 */
async function getFrameData(env, dataType, frameIndex) {
  const cacheKey = `frame_data_${dataType}_${frameIndex}`;

  // Check KV cache
  const cached = await env.BGAPP_KV.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    // Get frame timestamp from metadata
    const frameMetadata = await env.BGAPP_DATA.prepare(`
      SELECT frame_timestamp
      FROM timeseries_frames_metadata
      WHERE data_type = ? AND frame_index = ?
    `).bind(dataType, frameIndex).first();

    if (!frameMetadata) {
      throw new Error(`Frame not found: ${dataType} #${frameIndex}`);
    }

    const timestamp = frameMetadata.frame_timestamp;

    // Query actual data based on data type
    let query;
    let tableName;

    switch (dataType) {
      case 'sst':
        tableName = 'sst_data';
        query = `
          SELECT
            latitude,
            longitude,
            temperature as value,
            timestamp,
            data_source
          FROM sst_data
          WHERE timestamp = ?
            AND latitude BETWEEN ? AND ?
            AND longitude BETWEEN ? AND ?
          ORDER BY latitude, longitude
        `;
        break;

      case 'ocean_color':
        tableName = 'ocean_color_data';
        query = `
          SELECT
            latitude,
            longitude,
            chlorophyll_a as value,
            timestamp,
            data_source
          FROM ocean_color_data
          WHERE timestamp = ?
            AND latitude BETWEEN ? AND ?
            AND longitude BETWEEN ? AND ?
          ORDER BY latitude, longitude
        `;
        break;

      case 'salinity':
        tableName = 'salinity_data';
        query = `
          SELECT
            latitude,
            longitude,
            salinity as value,
            timestamp,
            data_source
          FROM salinity_data
          WHERE timestamp = ?
            AND latitude BETWEEN ? AND ?
            AND longitude BETWEEN ? AND ?
          ORDER BY latitude, longitude
        `;
        break;

      default:
        throw new Error(`Invalid data type: ${dataType}`);
    }

    const result = await env.BGAPP_DATA.prepare(query)
      .bind(
        timestamp,
        ANGOLA_EEZ.continental.minLat,
        ANGOLA_EEZ.continental.maxLat,
        ANGOLA_EEZ.continental.minLon,
        ANGOLA_EEZ.continental.maxLon
      )
      .all();

    const response = {
      dataType,
      frameIndex,
      timestamp,
      totalPoints: result.results.length,
      data: result.results.map(row => ({
        lat: row.latitude,
        lon: row.longitude,
        value: row.value,
        source: row.data_source
      }))
    };

    // Cache in KV
    await env.BGAPP_KV.put(cacheKey, JSON.stringify(response), {
      expirationTtl: CACHE_TTL.frame_data
    });

    return response;
  } catch (error) {
    console.error('Error fetching frame data:', error);
    throw error;
  }
}

/**
 * Get data for time range (bulk fetch for buffering)
 */
async function getTimeRangeData(env, dataType, startFrame, endFrame) {
  try {
    const frames = [];

    // Fetch multiple frames in parallel (limited to 10 at a time to avoid overload)
    const frameIndexes = Array.from(
      { length: endFrame - startFrame + 1 },
      (_, i) => startFrame + i
    );

    // Batch fetch frames
    const batchSize = 5;
    for (let i = 0; i < frameIndexes.length; i += batchSize) {
      const batch = frameIndexes.slice(i, i + batchSize);
      const batchPromises = batch.map(frameIndex =>
        getFrameData(env, dataType, frameIndex).catch(err => ({
          error: true,
          frameIndex,
          message: err.message
        }))
      );
      const batchResults = await Promise.all(batchPromises);
      frames.push(...batchResults);
    }

    return {
      dataType,
      startFrame,
      endFrame,
      totalFrames: frames.length,
      frames
    };
  } catch (error) {
    console.error('Error fetching time range data:', error);
    throw error;
  }
}

/**
 * Get 7-day weather forecast from Open-Meteo API
 */
async function getWeatherForecast(env, latitude, longitude) {
  const cacheKey = `forecast_${latitude}_${longitude}`;

  // Check KV cache
  const cached = await env.BGAPP_KV.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    // Open-Meteo Marine Weather API
    const url = `https://marine-api.open-meteo.com/v1/marine?` +
      `latitude=${latitude}&longitude=${longitude}` +
      `&hourly=wave_height,wave_direction,wind_wave_height` +
      `&daily=wave_height_max,wind_speed_10m_max` +
      `&timezone=auto&forecast_days=7`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BGAPP-Marine-Angola/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform to our format
    const forecast = {
      location: { latitude, longitude },
      timezone: data.timezone,
      hourly: data.hourly,
      daily: data.daily,
      generatedAt: new Date().toISOString()
    };

    // Cache for 30 minutes
    await env.BGAPP_KV.put(cacheKey, JSON.stringify(forecast), {
      expirationTtl: CACHE_TTL.forecast
    });

    return forecast;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    throw error;
  }
}

/**
 * Main worker request handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Health check
    if (path === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'timeseries-api-worker',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          ...getCorsHeaders(),
          'Content-Type': 'application/json'
        }
      });
    }

    // GET /api/timeseries/frames?dataType=sst&days=30
    if (path === '/api/timeseries/frames' && request.method === 'GET') {
      try {
        const dataType = url.searchParams.get('dataType') || 'sst';
        const days = parseInt(url.searchParams.get('days') || '30');

        if (!['sst', 'ocean_color', 'salinity'].includes(dataType)) {
          return new Response(JSON.stringify({ error: 'Invalid dataType' }), {
            status: 400,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }

        const frames = await getFramesMetadata(env, dataType, days);

        return new Response(JSON.stringify(frames), {
          headers: {
            ...getCorsHeaders(),
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${CACHE_TTL.frames_metadata}`
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /api/timeseries/frame/:dataType/:frameIndex
    if (path.match(/^\/api\/timeseries\/frame\/\w+\/\d+$/) && request.method === 'GET') {
      try {
        const parts = path.split('/');
        const dataType = parts[4];
        const frameIndex = parseInt(parts[5]);

        if (!['sst', 'ocean_color', 'salinity'].includes(dataType)) {
          return new Response(JSON.stringify({ error: 'Invalid dataType' }), {
            status: 400,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }

        const frameData = await getFrameData(env, dataType, frameIndex);

        return new Response(JSON.stringify(frameData), {
          headers: {
            ...getCorsHeaders(),
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${CACHE_TTL.frame_data}`
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /api/timeseries/range?dataType=sst&startFrame=0&endFrame=10
    if (path === '/api/timeseries/range' && request.method === 'GET') {
      try {
        const dataType = url.searchParams.get('dataType') || 'sst';
        const startFrame = parseInt(url.searchParams.get('startFrame') || '0');
        const endFrame = parseInt(url.searchParams.get('endFrame') || '10');

        if (!['sst', 'ocean_color', 'salinity'].includes(dataType)) {
          return new Response(JSON.stringify({ error: 'Invalid dataType' }), {
            status: 400,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }

        const rangeData = await getTimeRangeData(env, dataType, startFrame, endFrame);

        return new Response(JSON.stringify(rangeData), {
          headers: {
            ...getCorsHeaders(),
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${CACHE_TTL.frame_data}`
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /api/timeseries/forecast?lat=-12.5&lon=13.2
    if (path === '/api/timeseries/forecast' && request.method === 'GET') {
      try {
        const latitude = parseFloat(url.searchParams.get('lat') || '-12.5');
        const longitude = parseFloat(url.searchParams.get('lon') || '13.2');

        const forecast = await getWeatherForecast(env, latitude, longitude);

        return new Response(JSON.stringify(forecast), {
          headers: {
            ...getCorsHeaders(),
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${CACHE_TTL.forecast}`
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    }

    // 404 Not Found
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
    });
  }
};
