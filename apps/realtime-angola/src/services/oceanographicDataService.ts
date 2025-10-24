/**
 * Oceanographic Data Service
 *
 * Integrates with bgapp-api-worker to fetch real oceanographic data
 * from Cloudflare D1 database containing NASA, Copernicus, and GFW data.
 */

const API_BASE = 'https://bgapp-api-worker.majearcasa.workers.dev';

export interface OceanographicDataRequest {
  type?: 'all' | 'sst' | 'ocean_color' | 'salinity' | 'vessel_lights' | 'ml_predictions';
  limit?: number;
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
}

export interface SSTRecord {
  latitude: number;
  longitude: number;
  temperature: number;
  data_source: string;
  quality_level: string;
  metadata: string;
  timestamp: string;
}

export interface OceanColorRecord {
  latitude: number;
  longitude: number;
  chlorophyll_a: number;
  data_source: string;
  quality_level: string;
  metadata: string;
  timestamp: string;
}

export interface SalinityRecord {
  latitude: number;
  longitude: number;
  salinity: number;
  data_source: string;
  quality_level: string;
  metadata: string;
  timestamp: string;
}

export interface VesselLightsRecord {
  latitude: number;
  longitude: number;
  radiance: number;
  data_source: string;
  quality_level: string;
  metadata: string;
  timestamp: string;
}

export interface MLPredictionRecord {
  latitude: number;
  longitude: number;
  prediction_type: string;
  confidence: number;
  model_name: string;
  prediction_value: string;
  metadata: string;
  timestamp: string;
}

export interface OceanographicDataResponse {
  sst: SSTRecord[];
  ocean_color: OceanColorRecord[];
  salinity: SalinityRecord[];
  vessel_lights: VesselLightsRecord[];
  ml_predictions: MLPredictionRecord[];
  metadata: {
    timestamp: string;
    bounds: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    };
    limit: number;
    counts: {
      sst: number;
      ocean_color: number;
      salinity: number;
      vessel_lights: number;
      ml_predictions: number;
      total: number;
    };
  };
}

/**
 * Fetch oceanographic data from bgapp-api-worker
 *
 * @param params - Request parameters for filtering data
 * @returns Promise with oceanographic data response
 * @throws Error if API request fails
 */
export async function fetchOceanographicData(
  params: OceanographicDataRequest
): Promise<OceanographicDataResponse> {
  const queryParams = new URLSearchParams({
    type: params.type || 'all',
    limit: (params.limit || 1000).toString(),
  });

  // Add optional geographic bounds if provided
  if (params.minLat !== undefined) queryParams.append('minLat', params.minLat.toString());
  if (params.maxLat !== undefined) queryParams.append('maxLat', params.maxLat.toString());
  if (params.minLon !== undefined) queryParams.append('minLon', params.minLon.toString());
  if (params.maxLon !== undefined) queryParams.append('maxLon', params.maxLon.toString());

  const url = `${API_BASE}/api/oceanographic?${queryParams}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Next.js caching configuration
      next: {
        revalidate: 3600, // Cache for 1 hour (3600 seconds)
        tags: ['oceanographic-data']
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data: OceanographicDataResponse = await response.json();
    return data;

  } catch (error) {
    console.error('Failed to fetch oceanographic data:', error);
    throw error;
  }
}

/**
 * Fetch oceanographic data with retry logic for resilience
 *
 * @param params - Request parameters
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise with oceanographic data response
 */
export async function fetchOceanographicDataWithRetry(
  params: OceanographicDataRequest,
  maxRetries: number = 3
): Promise<OceanographicDataResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchOceanographicData(params);
      return response;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Exponential backoff: wait 1s, 2s, 3s between retries
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  // This should never be reached due to throw in loop, but TypeScript requires it
  throw new Error('All retry attempts failed');
}

/**
 * Check API health status
 *
 * @returns Promise with health check response
 */
export async function checkAPIHealth(): Promise<{ status: string; database: string; timestamp: string }> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      next: { revalidate: 60 } // Cache health checks for 1 minute
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
}
