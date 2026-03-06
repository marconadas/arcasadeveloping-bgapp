/**
 * NASA Earth Data Service for Real-time Angola Application
 * Handles data fetching and processing from NASA Earthdata APIs
 */

export interface NASADataPoint {
  lat: number;
  lon: number;
  value: number;
  timestamp?: string;
  quality?: number;
}

export interface OceanColorData extends NASADataPoint {
  chlorophyll_a: number;
  turbidity?: number;
}

export interface SSTData extends NASADataPoint {
  temperature: number;
  anomaly?: number;
  sensor?: string;
}

export interface VesselLight {
  id?: string;
  lat: number;
  lon: number;
  radiance: number;
  confidence?: number;
  vesselType?: string;
  riskLevel?: string;
  detectionTime?: string;
}

export interface NASADataResponse<T> {
  data: T[];
  metadata: {
    source: string;
    timestamp: string;
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    [key: string]: any;
  };
  visualization?: {
    type: string;
    colorScale: string;
    opacity: number;
    minValue: number;
    maxValue: number;
    unit: string;
    contourLevels?: number[];
    [key: string]: any;
  };
  oceanographic_features?: {
    upwelling?: any[];
    warmCore?: any[];
    coldCore?: any[];
    [key: string]: any;
  };
}

class NASADataService {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTimeout: number = 3600000; // 1 hour

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/nasa';
    this.cache = new Map();
  }

  /**
   * Fetch ocean color data (chlorophyll-a, turbidity)
   */
  async getOceanColorData(params: {
    startDate?: string;
    endDate?: string;
    lat?: number;
    lon?: number;
  }): Promise<NASADataResponse<OceanColorData>> {
    const cacheKey = `ocean-color-${JSON.stringify(params)}`;

    // Check cache
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.lat) queryParams.append('lat', params.lat.toString());
      if (params.lon) queryParams.append('lon', params.lon.toString());

      const response = await fetch(`${this.baseUrl}/ocean-color/?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch ocean color data: ${response.status}`);
      }

      const data = await response.json();

      // Cache the response
      this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Error fetching ocean color data:', error);
      throw error;
    }
  }

  /**
   * Fetch sea surface temperature data
   */
  async getSSTData(params: {
    startDate?: string;
    endDate?: string;
    lat?: number;
    lon?: number;
    anomaly?: boolean;
  }): Promise<NASADataResponse<SSTData>> {
    const cacheKey = `sst-${JSON.stringify(params)}`;

    // Check cache
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.lat) queryParams.append('lat', params.lat.toString());
      if (params.lon) queryParams.append('lon', params.lon.toString());
      if (params.anomaly) queryParams.append('anomaly', 'true');

      const response = await fetch(`${this.baseUrl}/sst/?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch SST data: ${response.status}`);
      }

      const data = await response.json();

      // Cache the response
      this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Error fetching SST data:', error);
      throw error;
    }
  }

  /**
   * Fetch vessel lights detection data
   */
  async getVesselLights(params: {
    date?: string;
    minRadiance?: number;
    cluster?: boolean;
  }): Promise<NASADataResponse<VesselLight>> {
    const cacheKey = `vessel-lights-${JSON.stringify(params)}`;

    // Check cache
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const queryParams = new URLSearchParams();
      if (params.date) queryParams.append('date', params.date);
      if (params.minRadiance) queryParams.append('minRadiance', params.minRadiance.toString());
      if (params.cluster) queryParams.append('cluster', 'true');

      const response = await fetch(`${this.baseUrl}/vessel-lights/?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch vessel lights data: ${response.status}`);
      }

      const data = await response.json();

      // Cache the response
      this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Error fetching vessel lights data:', error);
      throw error;
    }
  }

  /**
   * Get combined marine data for a specific location
   */
  async getLocationData(lat: number, lon: number, date?: string): Promise<{
    oceanColor?: OceanColorData;
    sst?: SSTData;
    nearbyVessels?: VesselLight[];
  }> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Fetch all data types in parallel
      const [oceanColorRes, sstRes, vesselRes] = await Promise.allSettled([
        this.getOceanColorData({ lat, lon, startDate: targetDate, endDate: targetDate }),
        this.getSSTData({ lat, lon, startDate: targetDate, endDate: targetDate }),
        this.getVesselLights({ date: targetDate })
      ]);

      const result: any = {};

      // Process ocean color data
      if (oceanColorRes.status === 'fulfilled' && oceanColorRes.value.data.length > 0) {
        // Find closest data point
        result.oceanColor = this.findClosestPoint(oceanColorRes.value.data, lat, lon);
      }

      // Process SST data
      if (sstRes.status === 'fulfilled' && sstRes.value.data.length > 0) {
        // Find closest data point
        result.sst = this.findClosestPoint(sstRes.value.data, lat, lon);
      }

      // Process vessel data
      if (vesselRes.status === 'fulfilled' && vesselRes.value.data) {
        // Find vessels within 50km radius (~0.45 degrees)
        result.nearbyVessels = vesselRes.value.data.filter((vessel: VesselLight) => {
          const distance = this.calculateDistance(lat, lon, vessel.lat, vessel.lon);
          return distance < 0.45;
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching location data:', error);
      throw error;
    }
  }

  /**
   * Process data for deck.gl visualization layers
   */
  processForDeckGL(data: NASADataResponse<any>, layerType: string) {
    switch (layerType) {
      case 'heatmap':
        return {
          data: data.data.map(point => ({
            position: [point.lon, point.lat],
            weight: point.value || point.chlorophyll_a || point.temperature || 1
          })),
          radiusPixels: 30,
          intensity: 1,
          threshold: 0.05,
          colorRange: this.getColorRange(data.visualization?.colorScale || 'viridis')
        };

      case 'contour':
        return {
          data: data.data.map(point => ({
            position: [point.lon, point.lat],
            value: point.value || point.temperature || 25
          })),
          cellSize: 1000,
          contours: data.visualization?.contourLevels || [18, 20, 22, 24, 26, 28, 30],
          zOffset: 0.005
        };

      case 'points':
        return {
          data: data.data.map(point => ({
            position: [point.lon, point.lat],
            size: point.radiance ? Math.sqrt(point.radiance) * 100 : 100,
            color: this.getPointColor(point)
          })),
          getRadius: (d: any) => d.size,
          getFillColor: (d: any) => d.color,
          radiusMinPixels: 3,
          radiusMaxPixels: 20
        };

      default:
        return { data: data.data };
    }
  }

  /**
   * Get color range for heatmap visualization
   */
  private getColorRange(scale: string) {
    const ranges: Record<string, number[][]> = {
      viridis: [
        [68, 1, 84],
        [59, 82, 139],
        [33, 145, 140],
        [94, 201, 98],
        [253, 231, 37]
      ],
      thermal: [
        [0, 0, 128],
        [0, 128, 255],
        [0, 255, 255],
        [255, 255, 0],
        [255, 128, 0],
        [255, 0, 0]
      ],
      heat: [
        [255, 255, 204],
        [255, 237, 160],
        [254, 217, 118],
        [254, 178, 76],
        [253, 141, 60],
        [252, 78, 42],
        [227, 26, 28],
        [177, 0, 38]
      ]
    };

    return ranges[scale] || ranges.viridis;
  }

  /**
   * Get point color based on vessel risk or data value
   */
  private getPointColor(point: any): number[] {
    if (point.riskLevel) {
      switch (point.riskLevel) {
        case 'high': return [255, 0, 0, 200];
        case 'medium': return [255, 165, 0, 200];
        case 'low': return [0, 255, 0, 200];
        default: return [128, 128, 128, 200];
      }
    }

    if (point.vesselType) {
      switch (point.vesselType) {
        case 'industrial_fishing': return [255, 0, 0, 200];
        case 'commercial_fishing': return [255, 128, 0, 200];
        case 'small_commercial': return [255, 255, 0, 200];
        case 'artisanal': return [0, 255, 0, 200];
        default: return [128, 128, 128, 200];
      }
    }

    return [0, 150, 255, 200];
  }

  /**
   * Find closest data point to a location
   */
  private findClosestPoint(data: any[], lat: number, lon: number): any {
    let closest = null;
    let minDistance = Infinity;

    data.forEach(point => {
      const distance = this.calculateDistance(lat, lon, point.lat, point.lon);
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    });

    return closest;
  }

  /**
   * Calculate distance between two points (simple Euclidean)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
  }

  /**
   * Get cached data
   */
  private getCached(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache data
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Clean old cache entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const nasaDataService = new NASADataService();