/**
 * Open-Meteo Weather Proxy Worker for BGAPP
 *
 * Fetches weather data from Open-Meteo API (FREE, no auth required!)
 * Implements caching and fallback strategies for reliability
 * Stores data in D1 for offline capability
 *
 * API Documentation: https://open-meteo.com/en/docs
 */

const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';

// Angola EEZ boundaries - Two separate polygons (Continental + Cabinda)
const ANGOLA_BOUNDS = {
  // Continental Angola EEZ
  continental: {
    minLat: -18.02,
    maxLat: -5.55,
    minLon: 8.3,
    maxLon: 13.84
  },
  // Cabinda EEZ (exclave in the north)
  cabinda: {
    minLat: -5.8,
    maxLat: -4.3,
    minLon: 12.0,
    maxLon: 13.5
  },
  // Overall bounds for bbox queries
  minLat: -18.02,
  maxLat: -4.3,
  minLon: 8.3,
  maxLon: 13.84,
  // Center point for default queries (Continental Angola)
  centerLat: -12.5,
  centerLon: 13.0
};

// Cache TTLs
const CACHE_TTL = {
  current: 6 * 3600,      // 6 hours for current weather
  forecast: 24 * 3600,    // 24 hours for forecast
  grid: 12 * 3600         // 12 hours for grid data
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'open-meteo-proxy',
        timestamp: new Date().toISOString(),
        database: env.BGAPP_DATA ? 'connected' : 'unavailable'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Current weather endpoint
    if (url.pathname === '/weather/current') {
      return handleCurrentWeather(request, env, corsHeaders);
    }

    // Forecast endpoint
    if (url.pathname === '/weather/forecast') {
      return handleForecast(request, env, corsHeaders);
    }

    // Grid weather endpoint (for map overlays)
    if (url.pathname === '/weather/grid') {
      return handleWeatherGrid(request, env, corsHeaders);
    }

    // Marine weather endpoint (wind + waves focused)
    if (url.pathname === '/weather/marine') {
      return handleMarineWeather(request, env, corsHeaders);
    }

    // 404
    return new Response(JSON.stringify({
      error: 'Not Found',
      available_endpoints: [
        '/health',
        '/weather/current',
        '/weather/forecast',
        '/weather/grid',
        '/weather/marine'
      ]
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Handle current weather request
 */
async function handleCurrentWeather(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get('lat') || ANGOLA_BOUNDS.centerLat);
    const lon = parseFloat(url.searchParams.get('lon') || ANGOLA_BOUNDS.centerLon);

    // Validate coordinates are within Angola EEZ
    if (!isWithinAngolaBounds(lat, lon)) {
      return new Response(JSON.stringify({
        error: 'Coordinates outside Angola EEZ',
        bounds: ANGOLA_BOUNDS
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check KV cache first
    const cacheKey = `weather:current:${lat.toFixed(2)}_${lon.toFixed(2)}`;
    if (env.BGAPP_KV) {
      const cached = await env.BGAPP_KV.get(cacheKey, { type: 'json' });
      if (cached) {
        console.log('[OpenMeteo] Cache HIT:', cacheKey);
        return new Response(JSON.stringify({
          ...cached,
          cached: true,
          cache_age_minutes: Math.floor((Date.now() - cached.timestamp) / 60000)
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          }
        });
      }
    }

    console.log('[OpenMeteo] Cache MISS, fetching from API:', cacheKey);

    // Fetch from Open-Meteo API
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation',
        'rain',
        'cloud_cover',
        'pressure_msl',
        'surface_pressure',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m'
      ].join(','),
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm'
    });

    const apiUrl = `${OPEN_METEO_API}?${params}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error('[OpenMeteo] API error:', response.status);
      // Try fallback from D1 database
      return await fallbackToDatabase(env, lat, lon, corsHeaders, 'current');
    }

    const data = await response.json();

    // Transform Open-Meteo response to our format
    const weatherData = {
      latitude: lat,
      longitude: lon,
      temperature: data.current.temperature_2m,
      apparent_temperature: data.current.apparent_temperature,
      relative_humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      rain: data.current.rain,
      wind_speed_10m: data.current.wind_speed_10m,
      wind_direction_10m: data.current.wind_direction_10m,
      wind_gusts_10m: data.current.wind_gusts_10m,
      cloud_cover: data.current.cloud_cover,
      pressure_msl: data.current.pressure_msl,
      surface_pressure: data.current.surface_pressure,
      timestamp: Date.now(),
      data_source: 'open-meteo',
      api_time: data.current.time
    };

    // Store in KV cache
    if (env.BGAPP_KV) {
      await env.BGAPP_KV.put(cacheKey, JSON.stringify(weatherData), {
        expirationTtl: CACHE_TTL.current
      });
    }

    // Store in D1 database for fallback
    if (env.BGAPP_DATA) {
      try {
        await env.BGAPP_DATA.prepare(`
          INSERT INTO weather_data (
            latitude, longitude, temperature, apparent_temperature,
            relative_humidity, precipitation, rain,
            wind_speed_10m, wind_direction_10m, wind_gusts_10m,
            cloud_cover, pressure_msl, surface_pressure,
            data_source, quality_flag
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          lat, lon,
          weatherData.temperature,
          weatherData.apparent_temperature,
          weatherData.relative_humidity,
          weatherData.precipitation,
          weatherData.rain,
          weatherData.wind_speed_10m,
          weatherData.wind_direction_10m,
          weatherData.wind_gusts_10m,
          weatherData.cloud_cover,
          weatherData.pressure_msl,
          weatherData.surface_pressure,
          'open-meteo',
          2 // High quality
        ).run();
      } catch (dbError) {
        console.error('[OpenMeteo] D1 insert error:', dbError);
        // Don't fail the request if DB insert fails
      }
    }

    return new Response(JSON.stringify(weatherData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'MISS'
      }
    });

  } catch (error) {
    console.error('[OpenMeteo] Current weather error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch current weather',
      message: error.message,
      fallback: 'Using synthetic data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle forecast request (up to 7 days)
 */
async function handleForecast(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get('lat') || ANGOLA_BOUNDS.centerLat);
    const lon = parseFloat(url.searchParams.get('lon') || ANGOLA_BOUNDS.centerLon);
    const days = Math.min(parseInt(url.searchParams.get('days') || '7'), 7);

    if (!isWithinAngolaBounds(lat, lon)) {
      return new Response(JSON.stringify({
        error: 'Coordinates outside Angola EEZ'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check cache
    const cacheKey = `weather:forecast:${lat.toFixed(2)}_${lon.toFixed(2)}_${days}d`;
    if (env.BGAPP_KV) {
      const cached = await env.BGAPP_KV.get(cacheKey, { type: 'json' });
      if (cached) {
        return new Response(JSON.stringify({ ...cached, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
        });
      }
    }

    // Fetch from Open-Meteo API
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'precipitation_probability_max',
        'wind_speed_10m_max',
        'wind_direction_10m_dominant'
      ].join(','),
      forecast_days: days.toString(),
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm'
    });

    const apiUrl = `${OPEN_METEO_API}?${params}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return await fallbackToDatabase(env, lat, lon, corsHeaders, 'forecast');
    }

    const data = await response.json();

    // Transform to our format
    const forecast = {
      latitude: lat,
      longitude: lon,
      days: data.daily.time.map((date, i) => ({
        date: date,
        temperature_max: data.daily.temperature_2m_max[i],
        temperature_min: data.daily.temperature_2m_min[i],
        precipitation_sum: data.daily.precipitation_sum[i],
        precipitation_probability: data.daily.precipitation_probability_max[i],
        wind_speed_max: data.daily.wind_speed_10m_max[i],
        wind_direction: data.daily.wind_direction_10m_dominant[i]
      })),
      timestamp: Date.now(),
      data_source: 'open-meteo'
    };

    // Cache it
    if (env.BGAPP_KV) {
      await env.BGAPP_KV.put(cacheKey, JSON.stringify(forecast), {
        expirationTtl: CACHE_TTL.forecast
      });
    }

    // Store in D1
    if (env.BGAPP_DATA) {
      for (const day of forecast.days) {
        try {
          await env.BGAPP_DATA.prepare(`
            INSERT INTO weather_forecast (
              latitude, longitude, forecast_date, forecast_time,
              temperature_max, temperature_min,
              precipitation_sum, precipitation_probability,
              wind_speed_max, wind_direction,
              data_source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            lat, lon, day.date, day.date,
            day.temperature_max, day.temperature_min,
            day.precipitation_sum, day.precipitation_probability,
            day.wind_speed_max, day.wind_direction,
            'open-meteo'
          ).run();
        } catch (dbError) {
          console.error('[OpenMeteo] Forecast D1 insert error:', dbError);
        }
      }
    }

    return new Response(JSON.stringify(forecast), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });

  } catch (error) {
    console.error('[OpenMeteo] Forecast error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch forecast',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle weather grid request (for map visualization)
 */
async function handleWeatherGrid(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const bbox = url.searchParams.get('bbox') || `${ANGOLA_BOUNDS.minLat},${ANGOLA_BOUNDS.minLon},${ANGOLA_BOUNDS.maxLat},${ANGOLA_BOUNDS.maxLon}`;
    const resolution = parseFloat(url.searchParams.get('resolution') || '0.5'); // degrees

    const [minLat, minLon, maxLat, maxLon] = bbox.split(',').map(parseFloat);

    // Generate grid points
    const gridPoints = [];
    for (let lat = minLat; lat <= maxLat; lat += resolution) {
      for (let lon = minLon; lon <= maxLon; lon += resolution) {
        if (isWithinAngolaBounds(lat, lon)) {
          gridPoints.push({ lat, lon });
        }
      }
    }

    console.log(`[OpenMeteo] Grid request: ${gridPoints.length} points`);

    // Check cache for grid summary
    const cacheKey = `weather:grid:${bbox}:${resolution}`;
    if (env.BGAPP_KV) {
      const cached = await env.BGAPP_KV.get(cacheKey, { type: 'json' });
      if (cached) {
        return new Response(JSON.stringify({ ...cached, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
        });
      }
    }

    // Fetch weather for center point (to avoid rate limiting)
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    const params = new URLSearchParams({
      latitude: centerLat.toString(),
      longitude: centerLon.toString(),
      current: 'temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh'
    });

    const response = await fetch(`${OPEN_METEO_API}?${params}`);
    const data = await response.json();

    // Create grid data (simplified - all points get same weather for now)
    const gridData = {
      bbox: { minLat, minLon, maxLat, maxLon },
      resolution,
      points: gridPoints.map(point => ({
        ...point,
        temperature: data.current.temperature_2m,
        wind_speed: data.current.wind_speed_10m,
        wind_direction: data.current.wind_direction_10m,
        precipitation: data.current.precipitation,
        cloud_cover: data.current.cloud_cover
      })),
      timestamp: Date.now(),
      data_source: 'open-meteo'
    };

    // Cache it
    if (env.BGAPP_KV) {
      await env.BGAPP_KV.put(cacheKey, JSON.stringify(gridData), {
        expirationTtl: CACHE_TTL.grid
      });
    }

    return new Response(JSON.stringify(gridData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });

  } catch (error) {
    console.error('[OpenMeteo] Grid error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch grid data',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle marine weather request (focused on wind and waves)
 */
async function handleMarineWeather(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get('lat') || ANGOLA_BOUNDS.centerLat);
    const lon = parseFloat(url.searchParams.get('lon') || ANGOLA_BOUNDS.centerLon);

    if (!isWithinAngolaBounds(lat, lon)) {
      return new Response(JSON.stringify({
        error: 'Coordinates outside Angola EEZ'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch multi-level wind data (important for marine operations)
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: [
        'temperature_2m',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'wind_speed_80m',
        'wind_direction_80m',
        'wind_speed_120m',
        'wind_direction_120m',
        'precipitation',
        'cloud_cover',
        'visibility'
      ].join(','),
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh'
    });

    const response = await fetch(`${OPEN_METEO_API}?${params}`);
    const data = await response.json();

    const marineData = {
      latitude: lat,
      longitude: lon,
      surface: {
        temperature: data.current.temperature_2m,
        wind_speed: data.current.wind_speed_10m,
        wind_direction: data.current.wind_direction_10m,
        wind_gusts: data.current.wind_gusts_10m
      },
      upper_levels: {
        wind_80m: {
          speed: data.current.wind_speed_80m,
          direction: data.current.wind_direction_80m
        },
        wind_120m: {
          speed: data.current.wind_speed_120m,
          direction: data.current.wind_direction_120m
        }
      },
      conditions: {
        precipitation: data.current.precipitation,
        cloud_cover: data.current.cloud_cover,
        visibility: data.current.visibility
      },
      timestamp: Date.now(),
      data_source: 'open-meteo'
    };

    return new Response(JSON.stringify(marineData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[OpenMeteo] Marine weather error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch marine weather',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Fallback to D1 database when API fails
 */
async function fallbackToDatabase(env, lat, lon, corsHeaders, dataType) {
  if (!env.BGAPP_DATA) {
    return new Response(JSON.stringify({
      error: 'API unavailable and no database fallback'
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    if (dataType === 'current') {
      const result = await env.BGAPP_DATA.prepare(`
        SELECT * FROM weather_data
        WHERE latitude BETWEEN ? AND ?
          AND longitude BETWEEN ? AND ?
        ORDER BY timestamp DESC
        LIMIT 1
      `).bind(lat - 0.1, lat + 0.1, lon - 0.1, lon + 0.1).first();

      if (result) {
        return new Response(JSON.stringify({
          ...result,
          fallback: true,
          fallback_source: 'database'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Fallback': 'D1' }
        });
      }
    } else if (dataType === 'forecast') {
      const results = await env.BGAPP_DATA.prepare(`
        SELECT * FROM weather_forecast
        WHERE latitude BETWEEN ? AND ?
          AND longitude BETWEEN ? AND ?
          AND forecast_date >= date('now')
        ORDER BY forecast_date
        LIMIT 7
      `).bind(lat - 0.1, lat + 0.1, lon - 0.1, lon + 0.1).all();

      if (results.results && results.results.length > 0) {
        return new Response(JSON.stringify({
          forecast: results.results,
          fallback: true,
          fallback_source: 'database'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Fallback': 'D1' }
        });
      }
    }
  } catch (dbError) {
    console.error('[OpenMeteo] Database fallback error:', dbError);
  }

  // Last resort: synthetic data
  return new Response(JSON.stringify({
    error: 'All data sources failed',
    fallback: generateSyntheticWeather(lat, lon)
  }), {
    status: 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Fallback': 'Synthetic' }
  });
}

/**
 * Generate synthetic weather data based on Angola climate patterns
 */
function generateSyntheticWeather(lat, lon) {
  // Angola climate: tropical, warm temperatures, rainy season Nov-Apr
  const month = new Date().getMonth();
  const isRainySeason = month >= 10 || month <= 3;

  return {
    latitude: lat,
    longitude: lon,
    temperature: 24 + Math.random() * 6, // 24-30°C
    apparent_temperature: 26 + Math.random() * 6,
    relative_humidity: isRainySeason ? 70 + Math.random() * 20 : 50 + Math.random() * 20,
    precipitation: isRainySeason ? Math.random() * 10 : 0,
    rain: isRainySeason ? Math.random() * 8 : 0,
    wind_speed_10m: 10 + Math.random() * 15, // 10-25 km/h typical
    wind_direction_10m: Math.floor(Math.random() * 360),
    wind_gusts_10m: 15 + Math.random() * 20,
    cloud_cover: isRainySeason ? 60 + Math.random() * 30 : 30 + Math.random() * 40,
    pressure_msl: 1010 + Math.random() * 10,
    surface_pressure: 1008 + Math.random() * 10,
    timestamp: Date.now(),
    data_source: 'synthetic',
    synthetic: true
  };
}

/**
 * Check if coordinates are within Angola EEZ bounds
 * Angola EEZ has TWO separate polygons: Continental Angola and Cabinda (exclave)
 */
function isWithinAngolaBounds(lat, lon) {
  // Check Continental Angola EEZ
  const inContinental =
    lat >= ANGOLA_BOUNDS.continental.minLat &&
    lat <= ANGOLA_BOUNDS.continental.maxLat &&
    lon >= ANGOLA_BOUNDS.continental.minLon &&
    lon <= ANGOLA_BOUNDS.continental.maxLon;

  // Check Cabinda EEZ (exclave in the north)
  const inCabinda =
    lat >= ANGOLA_BOUNDS.cabinda.minLat &&
    lat <= ANGOLA_BOUNDS.cabinda.maxLat &&
    lon >= ANGOLA_BOUNDS.cabinda.minLon &&
    lon <= ANGOLA_BOUNDS.cabinda.maxLon;

  return inContinental || inCabinda;
}
