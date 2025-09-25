import { MarineData, VesselData, APIResponse } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://bgapp-frontend.pages.dev';

export class RealtimeAPI {
  private static instance: RealtimeAPI;

  public static getInstance(): RealtimeAPI {
    if (!RealtimeAPI.instance) {
      RealtimeAPI.instance = new RealtimeAPI();
    }
    return RealtimeAPI.instance;
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }

  // Copernicus Marine Data
  async getCopernicusData(): Promise<MarineData> {
    try {
      const data = await this.fetchWithRetry<any>(
        `${BASE_URL}/api/copernicus/marine-data`
      );

      return {
        temperature: data.temperature || 25.5,
        chlorophyll: data.chlorophyll || 0.8,
        salinity: data.salinity || 35.2,
        timestamp: new Date(data.timestamp || Date.now()),
        source: 'copernicus',
        quality: this.assessDataQuality(data)
      };
    } catch (error) {
      console.error('Error fetching Copernicus data:', error);
      return this.getMockMarineData();
    }
  }

  // Global Fishing Watch Data
  async getGFWVessels(bounds?: { north: number; south: number; east: number; west: number }): Promise<VesselData[]> {
    try {
      const queryParams = bounds
        ? `?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}`
        : '';

      const response = await this.fetchWithRetry<APIResponse<{ vessels: any[] }>>(
        `${BASE_URL}/api/gfw/vessel-presence${queryParams}`
      );

      return response.data.vessels.map(vessel => ({
        id: vessel.id || vessel.mmsi,
        name: vessel.name || `Vessel ${vessel.mmsi}`,
        mmsi: vessel.mmsi,
        latitude: vessel.lat || vessel.latitude,
        longitude: vessel.lon || vessel.longitude,
        speed: vessel.speed || 0,
        course: vessel.course || 0,
        timestamp: new Date(vessel.timestamp || Date.now()),
        type: vessel.shipAndGearType || vessel.type || 'Unknown',
        flag: vessel.flag || 'Unknown'
      }));
    } catch (error) {
      console.error('Error fetching GFW vessel data:', error);
      return this.getMockVesselData();
    }
  }

  // BGAPP Enhanced API
  async getBGAPPData(): Promise<{ marine: MarineData; vessels: VesselData[] }> {
    try {
      const response = await this.fetchWithRetry<APIResponse<any>>(
        `${BASE_URL}/api/realtime/data`
      );

      const marine: MarineData = {
        temperature: response.data.temperature || 26.0,
        chlorophyll: response.data.chlorophyll || 0.9,
        salinity: response.data.salinity || 35.5,
        timestamp: new Date(response.data.timestamp || Date.now()),
        source: 'bgapp',
        quality: this.assessDataQuality(response.data)
      };

      const vessels: VesselData[] = (response.data.vessels || []).map((vessel: any) => ({
        id: vessel.id,
        name: vessel.name,
        mmsi: vessel.mmsi,
        latitude: vessel.latitude,
        longitude: vessel.longitude,
        speed: vessel.speed,
        course: vessel.course,
        timestamp: new Date(vessel.timestamp),
        type: vessel.type,
        flag: vessel.flag
      }));

      return { marine, vessels };
    } catch (error) {
      console.error('Error fetching BGAPP data:', error);
      return {
        marine: this.getMockMarineData(),
        vessels: this.getMockVesselData()
      };
    }
  }

  // Health Check
  async checkAPIHealth(): Promise<{ [key: string]: boolean }> {
    const endpoints = [
      { name: 'copernicus', url: `${BASE_URL}/api/copernicus/health` },
      { name: 'gfw', url: `${BASE_URL}/api/gfw/health` },
      { name: 'bgapp', url: `${BASE_URL}/api/health` }
    ];

    const results: { [key: string]: boolean } = {};

    await Promise.allSettled(
      endpoints.map(async endpoint => {
        try {
          const response = await fetch(endpoint.url, { method: 'HEAD' });
          results[endpoint.name] = response.ok;
        } catch {
          results[endpoint.name] = false;
        }
      })
    );

    return results;
  }

  private assessDataQuality(data: any): 'high' | 'medium' | 'low' {
    if (!data) return 'low';

    const hasAllFields = data.temperature && data.chlorophyll && data.salinity;
    const isRecent = data.timestamp && (Date.now() - new Date(data.timestamp).getTime()) < 3600000; // 1 hora

    if (hasAllFields && isRecent) return 'high';
    if (hasAllFields || isRecent) return 'medium';
    return 'low';
  }

  private getMockMarineData(): MarineData {
    return {
      temperature: 25.8,
      chlorophyll: 0.75,
      salinity: 35.1,
      timestamp: new Date(),
      source: 'bgapp',
      quality: 'medium'
    };
  }

  private getMockVesselData(): VesselData[] {
    return [
      {
        id: 'mock-1',
        name: 'Luanda Express',
        mmsi: '123456789',
        latitude: -8.8137,
        longitude: 13.2894,
        speed: 12.5,
        course: 45,
        timestamp: new Date(),
        type: 'Cargo',
        flag: 'AO'
      },
      {
        id: 'mock-2',
        name: 'Benguela Star',
        mmsi: '987654321',
        latitude: -12.5744,
        longitude: 13.4035,
        speed: 8.2,
        course: 180,
        timestamp: new Date(),
        type: 'Fishing',
        flag: 'AO'
      }
    ];
  }
}