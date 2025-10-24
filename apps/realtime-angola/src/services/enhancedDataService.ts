/**
 * Enhanced Data Service for Realtime Angola
 *
 * Connects to the enhanced BGAPP API endpoints with proper data fetching
 * for all oceanographic data types from the D1 database.
 */

// Use relative URLs for local API routes to avoid CORS issues
// For external APIs, we proxy through Next.js API routes
const API_BASE = '';  // Empty for relative URLs
const WORKER_API_BASE = 'https://bgapp-api-worker.majearcasa.workers.dev';
const OPEN_METEO_PROXY_BASE = 'https://open-meteo-proxy.majearcasa.workers.dev';

// Enhanced data interfaces matching the D1 schema
export interface EnhancedSSTData {
  latitude: number;
  longitude: number;
  temperature: number;
  timestamp: string;
  data_source: string;
  quality_flag?: number;
  metadata?: any;
}

export interface EnhancedOceanColorData {
  latitude: number;
  longitude: number;
  chlorophyll_a: number;
  turbidity?: number;
  kd_490?: number;
  pic?: number;
  poc?: number;
  timestamp: string;
  data_source: string;
  quality_flag?: number;
  metadata?: any;
}

export interface EnhancedSalinityData {
  latitude: number;
  longitude: number;
  salinity: number;
  depth?: number;
  timestamp: string;
  data_source: string;
  quality_flag?: number;
  metadata?: any;
}

export interface VesselLightsData {
  latitude: number;
  longitude: number;
  radiance: number;
  timestamp: string;
  data_source: string;
  confidence?: number;
  metadata?: any;
}

export interface MLPrediction {
  latitude: number;
  longitude: number;
  prediction_type: string;
  prediction_value: any;
  confidence: number;
  model_name: string;
  timestamp: string;
  metadata?: any;
}

export interface VesselPresence {
  vessel_id: string;
  latitude: number;
  longitude: number;
  vessel_type?: string;
  flag_state?: string;
  speed?: number;
  course?: number;
  timestamp: string;
  confidence?: number;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  temperature: number;
  apparent_temperature?: number;
  relative_humidity?: number;
  precipitation?: number;
  rain?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
  wind_gusts_10m?: number;
  wind_speed_80m?: number;
  wind_direction_80m?: number;
  wind_speed_120m?: number;
  wind_direction_120m?: number;
  wind_speed_180m?: number;
  wind_direction_180m?: number;
  cloud_cover?: number;
  pressure_msl?: number;
  visibility?: number;
  timestamp: string;
  data_source: string;
  quality_flag?: number;
  cached?: boolean;
  cache_age_minutes?: number;
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  forecast_date: string;
  forecast_hour: number;
  temperature: number;
  temperature_max?: number;
  temperature_min?: number;
  precipitation_sum?: number;
  precipitation_probability?: number;
  wind_speed_max?: number;
  wind_speed?: number;
  wind_direction?: number;
  cloud_cover?: number;
  relative_humidity?: number;
  data_source: string;
  created_at: string;
}

export interface WeatherGrid {
  grid_id: string;
  center_lat: number;
  center_lon: number;
  avg_temperature: number;
  max_temperature?: number;
  min_temperature?: number;
  avg_wind_speed?: number;
  max_wind_speed?: number;
  dominant_wind_direction?: number;
  total_precipitation?: number;
  avg_cloud_cover?: number;
  avg_pressure?: number;
  data_points: number;
  quality_avg?: number;
  last_update: string;
}

// Fetch functions for each data type

/**
 * Fetch Sea Surface Temperature data
 */
export async function fetchSSTData(
  bbox?: string,
  limit: number = 1000
): Promise<EnhancedSSTData[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(bbox && { bbox })
    });

    const response = await fetch(`${API_BASE}/api/environmental/sst?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: {
        revalidate: 300, // Cache for 5 minutes
        tags: ['sst-data']
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch SST data: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching SST data:', error);
    return [];
  }
}

/**
 * Fetch Ocean Color (Chlorophyll) data
 */
export async function fetchOceanColorData(
  bbox?: string,
  limit: number = 1000
): Promise<EnhancedOceanColorData[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(bbox && { bbox })
    });

    const response = await fetch(`${API_BASE}/api/environmental/ocean-color?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: {
        revalidate: 300,
        tags: ['ocean-color-data']
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ocean color data: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching ocean color data:', error);
    return [];
  }
}

/**
 * Fetch Salinity data
 */
export async function fetchSalinityData(
  bbox?: string,
  limit: number = 1000
): Promise<EnhancedSalinityData[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(bbox && { bbox })
    });

    const response = await fetch(`${API_BASE}/api/environmental/salinity?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: {
        revalidate: 300,
        tags: ['salinity-data']
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch salinity data: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching salinity data:', error);
    return [];
  }
}

/**
 * Fetch Vessel Lights data from NASA VIIRS
 */
export async function fetchVesselLightsData(
  bbox?: string,
  limit: number = 500
): Promise<VesselLightsData[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(bbox && { bbox })
    });

    const response = await fetch(`${API_BASE}/api/nasa/vessel-lights?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: {
        revalidate: 600, // Cache for 10 minutes
        tags: ['vessel-lights-data']
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vessel lights data: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result.vessels || [];
  } catch (error) {
    console.error('Error fetching vessel lights data:', error);
    return [];
  }
}

/**
 * Fetch ML Predictions
 */
export async function fetchMLPredictions(
  predictionType?: string,
  limit: number = 1000
): Promise<MLPrediction[]> {
  try {
    // Angola EEZ bounds
    const angolaEEZ = {
      minLat: -18.02,
      maxLat: -5.55,
      minLon: 8.9,
      maxLon: 13.35
    };

    const params = new URLSearchParams({
      limit: limit.toString(),
      minLat: angolaEEZ.minLat.toString(),
      maxLat: angolaEEZ.maxLat.toString(),
      minLon: angolaEEZ.minLon.toString(),
      maxLon: angolaEEZ.maxLon.toString(),
      ...(predictionType && { type: predictionType })
    });

    const response = await fetch(`${API_BASE}/api/realtime/ml-predictions?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ML predictions: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result.predictions || [];
  } catch (error) {
    console.error('Error fetching ML predictions:', error);
    return [];
  }
}

/**
 * Fetch Vessel Presence data from GFW
 */
export async function fetchVesselPresence(
  bbox?: string,
  limit: number = 500
): Promise<VesselPresence[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(bbox && { bbox })
    });

    const response = await fetch(`${API_BASE}/api/vessels/presence?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: {
        revalidate: 300,
        tags: ['vessel-presence']
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vessel presence: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result.vessels || [];
  } catch (error) {
    console.error('Error fetching vessel presence:', error);
    return [];
  }
}

/**
 * Fetch Current Weather data
 */
export async function fetchCurrentWeather(
  lat?: number,
  lon?: number
): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams({
      lat: (lat || -12.5).toString(),
      lon: (lon || 13.0).toString()
    });

    // Call open-meteo-proxy directly for real-time weather data
    const response = await fetch(`${OPEN_METEO_PROXY_BASE}/weather/current?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: {
        revalidate: 1800, // Cache for 30 minutes (weather updates every 6 hours)
        tags: ['weather-current']
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch current weather: ${response.status}`);
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching current weather:', error);
    return null;
  }
}

/**
 * Fetch Weather Forecast data
 */
export async function fetchWeatherForecast(
  lat?: number,
  lon?: number,
  days: number = 7
): Promise<WeatherForecast[]> {
  try {
    const params = new URLSearchParams({
      lat: (lat || -12.5).toString(),
      lon: (lon || 13.0).toString(),
      days: days.toString()
    });

    // Call open-meteo-proxy directly for real-time forecast data
    const response = await fetch(`${OPEN_METEO_PROXY_BASE}/weather/forecast?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: {
        revalidate: 3600, // Cache for 1 hour (forecast updates every 24 hours)
        tags: ['weather-forecast']
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weather forecast: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return [];
  }
}

/**
 * Fetch Weather Grid data for map visualization
 */
export async function fetchWeatherGrid(
  bbox?: string
): Promise<WeatherGrid[]> {
  try {
    // Default to Angola EEZ if no bbox provided
    const bounds = bbox ? bbox.split(',').map(parseFloat) : [-18.02, 8.9, -5.55, 13.35];
    const [minLat, minLon, maxLat, maxLon] = bounds;

    const params = new URLSearchParams({
      minLat: minLat.toString(),
      maxLat: maxLat.toString(),
      minLon: minLon.toString(),
      maxLon: maxLon.toString()
    });

    // Call open-meteo-proxy directly for real-time weather grid data
    const response = await fetch(`${OPEN_METEO_PROXY_BASE}/weather/grid?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: {
        revalidate: 1800, // Cache for 30 minutes (grid updates every 12 hours)
        tags: ['weather-grid']
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weather grid: ${response.status}`);
    }

    const result = await response.json();

    // Transform open-meteo-proxy response to WeatherGrid format
    if (result.points && Array.isArray(result.points)) {
      return result.points.map((point: any) => ({
        grid_id: `${point.lat}_${point.lon}`,
        center_lat: point.lat,
        center_lon: point.lon,
        avg_temperature: point.temperature,
        avg_wind_speed: point.wind_speed,
        dominant_wind_direction: point.wind_direction,
        total_precipitation: point.precipitation,
        avg_cloud_cover: point.cloud_cover,
        avg_pressure: point.pressure,
        data_points: 1,
        last_update: new Date().toISOString()
      }));
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching weather grid:', error);
    return [];
  }
}

/**
 * Fetch all oceanographic data in a single request
 */
export async function fetchAllOceanographicData(bbox?: string) {
  const angolaEEZ = bbox || '-18.02,8.9,-5.55,13.35';

  try {
    // Fetch all data types in parallel
    const [sst, oceanColor, salinity, vesselLights, mlPredictions, vesselPresence, weatherGrid] = await Promise.all([
      fetchSSTData(angolaEEZ, 2000),
      fetchOceanColorData(angolaEEZ, 2000),
      fetchSalinityData(angolaEEZ, 1000),
      fetchVesselLightsData(angolaEEZ, 500),
      fetchMLPredictions(undefined, 500),
      fetchVesselPresence(angolaEEZ, 500),
      fetchWeatherGrid(angolaEEZ)
    ]);

    return {
      sst,
      oceanColor,
      salinity,
      vesselLights,
      mlPredictions,
      vesselPresence,
      weatherGrid,
      metadata: {
        timestamp: new Date().toISOString(),
        bounds: angolaEEZ,
        counts: {
          sst: sst.length,
          oceanColor: oceanColor.length,
          salinity: salinity.length,
          vesselLights: vesselLights.length,
          mlPredictions: mlPredictions.length,
          vesselPresence: vesselPresence.length,
          weatherGrid: weatherGrid.length
        }
      }
    };
  } catch (error) {
    console.error('Error fetching all oceanographic data:', error);
    throw error;
  }
}

/**
 * Transform data for visualization layers
 */
export function transformForVisualization(data: any[], dataType: string) {
  switch (dataType) {
    case 'sst':
      return data.map(d => ({
        lat: d.latitude,
        lon: d.longitude,
        value: d.temperature,
        timestamp: d.timestamp,
        source: d.data_source
      }));

    case 'oceanColor':
      return data.map(d => ({
        lat: d.latitude,
        lon: d.longitude,
        value: d.chlorophyll_a,
        turbidity: d.turbidity,
        timestamp: d.timestamp,
        source: d.data_source
      }));

    case 'salinity':
      return data.map(d => ({
        lat: d.latitude,
        lon: d.longitude,
        value: d.salinity,
        depth: d.depth,
        timestamp: d.timestamp,
        source: d.data_source
      }));

    case 'vesselLights':
      return data.map(d => ({
        lat: d.latitude,
        lon: d.longitude,
        intensity: d.radiance,
        confidence: d.confidence,
        timestamp: d.timestamp
      }));

    case 'mlPredictions':
      return data.map(d => ({
        lat: d.latitude,
        lon: d.longitude,
        type: d.prediction_type,
        value: d.prediction_value,
        confidence: d.confidence,
        model: d.model_name,
        timestamp: d.timestamp
      }));

    case 'weather':
    case 'weatherGrid':
      return data.map(d => ({
        lat: d.center_lat || d.latitude,
        lon: d.center_lon || d.longitude,
        temperature: d.avg_temperature || d.temperature,
        windSpeed: d.avg_wind_speed || d.wind_speed_10m,
        windDirection: d.dominant_wind_direction || d.wind_direction_10m,
        precipitation: d.total_precipitation || d.precipitation,
        cloudCover: d.avg_cloud_cover || d.cloud_cover,
        pressure: d.avg_pressure || d.pressure_msl,
        humidity: d.relative_humidity,
        dataPoints: d.data_points,
        quality: d.quality_avg || d.quality_flag,
        lastUpdate: d.last_update || d.timestamp,
        source: d.data_source
      }));

    case 'weatherForecast':
      return data.map(d => ({
        lat: d.latitude,
        lon: d.longitude,
        date: d.forecast_date,
        hour: d.forecast_hour,
        temperature: d.temperature,
        tempMax: d.temperature_max,
        tempMin: d.temperature_min,
        precipitation: d.precipitation_sum,
        precipProb: d.precipitation_probability,
        windSpeed: d.wind_speed_max || d.wind_speed,
        windDirection: d.wind_direction,
        cloudCover: d.cloud_cover,
        humidity: d.relative_humidity
      }));

    default:
      return data;
  }
}

/**
 * Calculate statistics for a dataset
 */
export function calculateDataStatistics(data: any[], valueField: string = 'value') {
  if (!data || data.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      stdDev: 0,
      count: 0
    };
  }

  const values = data.map(d => d[valueField]).filter(v => v !== null && v !== undefined);

  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      stdDev: 0,
      count: 0
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    min,
    max,
    mean,
    stdDev,
    count: values.length
  };
}