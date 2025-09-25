import axios, { AxiosResponse } from 'axios';

// GFW API Types
export interface GFWVessel {
  id: string;
  vesselId: string;
  name?: string;
  flag: string;
  vesselType: 'fishing' | 'carrier' | 'support' | 'passenger';
  imo?: string;
  callsign?: string;
  firstTransmissionDate: string;
  lastTransmissionDate: string;
  geom?: {
    type: string;
    coordinates: number[];
  };
}

export interface GFWVesselResponse {
  entries: GFWVessel[];
  total: number;
  limit: number;
}

export interface GFWAlert {
  id: string;
  type: 'illegal_fishing' | 'protected_area' | 'encounters';
  severity: 'low' | 'medium' | 'high';
  location: { lat: number; lon: number };
  timestamp: string;
  vesselCount: number;
  description: string;
}

export interface GFWStats {
  totalVessels: number;
  activeAlerts: number;
  protectedAreaViolations: number;
  lastUpdate: string;
  dataUsage: {
    current: number;
    limit: number;
  };
}

export interface GFW4WingsResponse {
  data?: any;
  error?: string;
}

// GFW Proxy Configuration
const GFW_PROXY_BASE_URL = 'https://bgapp-gfw-proxy.majearcasa.workers.dev';

// Create axios instance for GFW proxy
const gfwApi = axios.create({
  baseURL: GFW_PROXY_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
gfwApi.interceptors.request.use(
  (config) => {
    console.log(`[GFW API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[GFW API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
gfwApi.interceptors.response.use(
  (response) => {
    console.log(`[GFW API] Response ${response.status}:`, response.data);
    return response;
  },
  (error) => {
    console.error('[GFW API] Response error:', error.response?.data || error.message);

    // Transform common errors
    if (error.response?.status === 403) {
      throw new Error('Insufficient permissions for this dataset. Please request additional access from Global Fishing Watch.');
    }
    if (error.response?.status === 503) {
      throw new Error('GFW API token not configured. Please check your token setup.');
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again later.');
    }

    throw error;
  }
);

// Angola-specific parameters
const ANGOLA_PARAMS = {
  datasets: 'public-global-vessels:v3.0',
  where: 'flag = "AO"',
  limit: 50,
  region: 'angola'
};

// Cache for API responses (2 minutes)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

function getCacheKey(endpoint: string, params: any): string {
  return `${endpoint}:${JSON.stringify(params)}`;
}

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[GFW API] Cache hit for ${key}`);
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });

  // Clean old cache entries
  if (cache.size > 50) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 10; i++) {
      cache.delete(entries[i][0]);
    }
  }
}

// API Functions
export class GFWApiService {

  /**
   * Get vessels in Angola waters
   */
  static async getVessels(params?: {
    limit?: number;
    where?: string;
    datasets?: string;
  }): Promise<GFWVesselResponse> {
    const mergedParams = { ...ANGOLA_PARAMS, ...params };
    const cacheKey = getCacheKey('vessels', mergedParams);

    // Check cache first
    const cached = getFromCache<GFWVesselResponse>(cacheKey);
    if (cached) return cached;

    try {
      const response: AxiosResponse<GFWVesselResponse> = await gfwApi.get('/gfw/vessels', {
        params: mergedParams
      });

      // Cache successful response
      setCache(cacheKey, response.data);

      return response.data;
    } catch (error) {
      console.error('[GFW API] Error fetching vessels:', error);

      // Return empty response on error
      return {
        entries: [],
        total: 0,
        limit: mergedParams.limit || 50
      };
    }
  }

  /**
   * Get 4wings AIS vessel presence report for Angola
   */
  static async get4WingsReport(params?: {
    region?: string;
  }): Promise<GFW4WingsResponse> {
    const mergedParams = { region: 'angola', ...params };
    const cacheKey = getCacheKey('4wings', mergedParams);

    // Check cache first
    const cached = getFromCache<GFW4WingsResponse>(cacheKey);
    if (cached) return cached;

    try {
      const response: AxiosResponse<any> = await gfwApi.get('/gfw/4wings/report/ais-vessel-presence', {
        params: mergedParams
      });

      const result = { data: response.data };

      // Cache successful response
      setCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('[GFW API] Error fetching 4wings report:', error);

      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate synthetic alerts based on vessel data and 4wings data
   * In a real implementation, this would come from GFW alerts API
   */
  static generateAlertsFromData(vessels: GFWVessel[], fourWingsData?: any): GFWAlert[] {
    const alerts: GFWAlert[] = [];
    const now = new Date();

    // Generate alerts based on vessel patterns
    vessels.forEach((vessel, index) => {
      // Simulate different types of alerts
      if (index % 7 === 0) { // Every 7th vessel gets a protected area alert
        alerts.push({
          id: `alert-${vessel.id}-protected`,
          type: 'protected_area',
          severity: 'high',
          location: {
            lat: -16.5 + Math.random() * 2,
            lon: 12.5 + Math.random() * 2
          },
          timestamp: new Date(now.getTime() - Math.random() * 86400000).toISOString(),
          vesselCount: 1,
          description: `Atividade de ${vessel.name || vessel.vesselId} detectada em área protegida`
        });
      }

      if (index % 11 === 0) { // Every 11th vessel gets an illegal fishing alert
        alerts.push({
          id: `alert-${vessel.id}-illegal`,
          type: 'illegal_fishing',
          severity: 'medium',
          location: {
            lat: -14.0 + Math.random() * 2,
            lon: 13.0 + Math.random() * 2
          },
          timestamp: new Date(now.getTime() - Math.random() * 43200000).toISOString(),
          vesselCount: 1,
          description: `Possível pesca ilegal: ${vessel.name || vessel.vesselId}`
        });
      }
    });

    // Add some general encounter alerts
    if (vessels.length > 5) {
      alerts.push({
        id: `alert-encounter-${Date.now()}`,
        type: 'encounters',
        severity: 'low',
        location: {
          lat: -12.3,
          lon: 13.8
        },
        timestamp: new Date(now.getTime() - 3600000).toISOString(),
        vesselCount: Math.min(3, Math.floor(vessels.length / 10)),
        description: 'Encontro de embarcações em alto mar detectado'
      });
    }

    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get comprehensive GFW statistics for Angola
   */
  static async getStats(): Promise<GFWStats> {
    try {
      // Fetch vessels and 4wings data in parallel
      const [vesselsResponse, fourWingsResponse] = await Promise.all([
        this.getVessels(),
        this.get4WingsReport()
      ]);

      // Generate alerts from the data
      const alerts = this.generateAlertsFromData(vesselsResponse.entries, fourWingsResponse.data);

      // Calculate statistics
      const stats: GFWStats = {
        totalVessels: vesselsResponse.total || vesselsResponse.entries.length,
        activeAlerts: alerts.length,
        protectedAreaViolations: alerts.filter(a => a.type === 'protected_area').length,
        lastUpdate: new Date().toISOString(),
        dataUsage: {
          current: 750, // This would come from GFW API usage endpoint
          limit: 1000
        }
      };

      return stats;
    } catch (error) {
      console.error('[GFW API] Error fetching stats:', error);

      // Return default stats on error
      return {
        totalVessels: 0,
        activeAlerts: 0,
        protectedAreaViolations: 0,
        lastUpdate: new Date().toISOString(),
        dataUsage: {
          current: 0,
          limit: 1000
        }
      };
    }
  }

  /**
   * Get alerts for Angola waters
   */
  static async getAlerts(): Promise<GFWAlert[]> {
    try {
      const vesselsResponse = await this.getVessels();
      const fourWingsResponse = await this.get4WingsReport();

      return this.generateAlertsFromData(vesselsResponse.entries, fourWingsResponse.data);
    } catch (error) {
      console.error('[GFW API] Error fetching alerts:', error);
      return [];
    }
  }

  /**
   * Clear API cache
   */
  static clearCache(): void {
    cache.clear();
    console.log('[GFW API] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: cache.size,
      entries: Array.from(cache.keys())
    };
  }
}

export default GFWApiService;