import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/environmental/weather
 * 
 * Fetches weather data from D1 database (populated by OpenMeteo worker)
 * 
 * Query Parameters:
 * - lat: Latitude (optional, defaults to Angola center)
 * - lon: Longitude (optional, defaults to Angola center)
 * - hours: Hours of historical data to fetch (default: 24)
 * - type: 'current' | 'forecast' | 'grid' (default: 'current')
 * - limit: Maximum number of records (default: 100)
 * 
 * Returns:
 * - For 'current': Latest weather data point
 * - For 'forecast': Forecast data for specified location
 * - For 'grid': Grid-based weather data for Angola EEZ
 */

// Angola EEZ boundaries
const ANGOLA_BOUNDS = {
  minLat: -18.02,
  maxLat: -4.3,
  minLon: 8.3,
  maxLon: 13.84,
  centerLat: -12.5,
  centerLon: 13.0
};

// Cloudflare Workers endpoint for OpenMeteo proxy
const WEATHER_WORKER_URL = process.env.NEXT_PUBLIC_OPEN_METEO_WORKER_URL || 
  'https://open-meteo-proxy.majearcasa.workers.dev';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const lat = parseFloat(searchParams.get('lat') || ANGOLA_BOUNDS.centerLat.toString());
    const lon = parseFloat(searchParams.get('lon') || ANGOLA_BOUNDS.centerLon.toString());
    const hours = parseInt(searchParams.get('hours') || '24');
    const type = searchParams.get('type') || 'current';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Validate coordinates are within Angola EEZ
    if (lat < ANGOLA_BOUNDS.minLat || lat > ANGOLA_BOUNDS.maxLat ||
        lon < ANGOLA_BOUNDS.minLon || lon > ANGOLA_BOUNDS.maxLon) {
      return NextResponse.json({
        error: 'Coordinates outside Angola EEZ',
        bounds: ANGOLA_BOUNDS
      }, { status: 400 });
    }

    // Route request based on type
    switch (type) {
      case 'current':
        return await handleCurrentWeather(lat, lon);
      
      case 'forecast':
        const days = parseInt(searchParams.get('days') || '7');
        return await handleForecast(lat, lon, days);
      
      case 'grid':
        return await handleWeatherGrid(limit);
      
      case 'history':
        return await handleWeatherHistory(lat, lon, hours, limit);
      
      default:
        return NextResponse.json({
          error: 'Invalid type parameter',
          validTypes: ['current', 'forecast', 'grid', 'history']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('[Weather API] Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch weather data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Fetch current weather from OpenMeteo worker
 */
async function handleCurrentWeather(lat: number, lon: number) {
  try {
    const response = await fetch(
      `${WEATHER_WORKER_URL}/current?lat=${lat}&lon=${lon}`,
      {
        headers: {
          'Accept': 'application/json'
        },
        // Cache for 6 hours (worker caches it anyway)
        next: { revalidate: 21600 }
      }
    );

    if (!response.ok) {
      throw new Error(`Worker responded with status ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data,
      source: 'open-meteo-worker',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Weather API] Current weather error:', error);
    throw error;
  }
}

/**
 * Fetch weather forecast from OpenMeteo worker
 */
async function handleForecast(lat: number, lon: number, days: number) {
  try {
    const response = await fetch(
      `${WEATHER_WORKER_URL}/forecast?lat=${lat}&lon=${lon}&days=${days}`,
      {
        headers: {
          'Accept': 'application/json'
        },
        // Cache for 24 hours
        next: { revalidate: 86400 }
      }
    );

    if (!response.ok) {
      throw new Error(`Worker responded with status ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data,
      source: 'open-meteo-worker',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Weather API] Forecast error:', error);
    throw error;
  }
}

/**
 * Fetch weather grid from OpenMeteo worker
 */
async function handleWeatherGrid(limit: number) {
  try {
    const response = await fetch(
      `${WEATHER_WORKER_URL}/grid?limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json'
        },
        // Cache for 12 hours
        next: { revalidate: 43200 }
      }
    );

    if (!response.ok) {
      throw new Error(`Worker responded with status ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data.grid || [],
      metadata: {
        count: data.grid?.length || 0,
        coverage: data.coverage || 'angola-eez',
        resolution: data.resolution || '0.5deg'
      },
      source: 'open-meteo-worker',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Weather API] Grid error:', error);
    throw error;
  }
}

/**
 * Fetch historical weather data from D1 database
 * This provides time-series data for animations
 */
async function handleWeatherHistory(
  lat: number, 
  lon: number, 
  hours: number, 
  limit: number
) {
  try {
    // Call worker endpoint that queries D1
    const response = await fetch(
      `${WEATHER_WORKER_URL}/history?lat=${lat}&lon=${lon}&hours=${hours}&limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json'
        },
        // Cache for 1 hour
        next: { revalidate: 3600 }
      }
    );

    if (!response.ok) {
      throw new Error(`Worker responded with status ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data.history || [],
      metadata: {
        count: data.history?.length || 0,
        timeRange: {
          start: data.startTime,
          end: data.endTime
        },
        location: { lat, lon }
      },
      source: 'd1-database',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Weather API] History error:', error);
    
    // Fallback to synthetic historical data if D1 query fails
    return NextResponse.json({
      success: true,
      data: generateSyntheticHistory(lat, lon, hours),
      metadata: {
        count: hours,
        timeRange: {
          start: new Date(Date.now() - hours * 3600000).toISOString(),
          end: new Date().toISOString()
        },
        location: { lat, lon },
        synthetic: true
      },
      source: 'synthetic-fallback',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Generate synthetic historical weather data for animation testing
 */
function generateSyntheticHistory(lat: number, lon: number, hours: number) {
  const history = [];
  const now = Date.now();
  
  for (let i = 0; i < hours; i++) {
    const timestamp = new Date(now - (hours - i) * 3600000);
    const hourOfDay = timestamp.getHours();
    
    // Simulate temperature variation throughout the day
    const baseTemp = 25;
    const tempVariation = 3 * Math.sin((hourOfDay - 6) * Math.PI / 12);
    
    // Simulate wind variation
    const baseWindSpeed = 15;
    const windVariation = 5 * Math.sin(i * Math.PI / 6);
    
    history.push({
      latitude: lat,
      longitude: lon,
      temperature: baseTemp + tempVariation + (Math.random() - 0.5),
      wind_speed_10m: Math.max(0, baseWindSpeed + windVariation + (Math.random() - 0.5) * 3),
      wind_direction_10m: (180 + i * 5 + Math.random() * 20) % 360,
      precipitation: Math.random() < 0.1 ? Math.random() * 5 : 0,
      cloud_cover: 30 + Math.random() * 40,
      relative_humidity: 60 + Math.random() * 20,
      pressure_msl: 1013 + (Math.random() - 0.5) * 5,
      timestamp: timestamp.toISOString()
    });
  }
  
  return history;
}

