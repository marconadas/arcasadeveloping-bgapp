'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';
import { RealtimeState, MarineData, VesselData, ChloroplethData } from '@/lib/types';
import { API_ENDPOINTS, REFRESH_INTERVALS } from '@/lib/constants';
import {
  fetchSSTData,
  fetchOceanColorData,
  fetchSalinityData,
  fetchVesselLightsData,
  fetchMLPredictions,
  fetchVesselPresence,
  fetchWeatherGrid,
  fetchCurrentWeather,
  EnhancedSSTData,
  EnhancedOceanColorData,
  EnhancedSalinityData,
  VesselLightsData,
  MLPrediction,
  WeatherData,
  WeatherGrid
} from '@/services/enhancedDataService';

interface RealtimeContextType extends RealtimeState {
  refreshData: () => Promise<void>;
  toggleLayer: (layerId: string) => void;
  activeLayers: string[];
  // Enhanced data from D1 database
  sstData: EnhancedSSTData[];
  oceanColorData: EnhancedOceanColorData[];
  salinityData: EnhancedSalinityData[];
  vesselLightsData: VesselLightsData[];
  mlPredictions: MLPrediction[];
  // Weather data
  weatherGrid: WeatherGrid[];
  currentWeather: WeatherData | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_BGAPP_API_BASE || '';
const buildApiUrl = (path: string) => API_BASE ? `${API_BASE.replace(/\/$/, '')}${path}` : path;

const DEFAULT_MARINE_DATA: MarineData = {
  temperature: 25.5,
  chlorophyll: 0.8,
  salinity: 35.2,
  timestamp: new Date(),
  source: 'fallback',
  quality: 'low'
};

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [state, setState] = useState<RealtimeState>({
    marineData: null,
    vessels: [],
    chloroplethData: [],
    isLoading: true,
    error: null,
    lastUpdate: null
  });

  const [activeLayers, setActiveLayers] = useState<string[]>([
    'vessels',
    'temperature',
    'salinity',
    'ml-predictions',
    'nasa-vessel-lights',
    'boundaries'
  ]);

  // Enhanced data state
  const [sstData, setSstData] = useState<EnhancedSSTData[]>([]);
  const [oceanColorData, setOceanColorData] = useState<EnhancedOceanColorData[]>([]);
  const [salinityData, setSalinityData] = useState<EnhancedSalinityData[]>([]);
  const [vesselLightsData, setVesselLightsData] = useState<VesselLightsData[]>([]);
  const [mlPredictions, setMlPredictions] = useState<MLPrediction[]>([]);

  // Weather data state
  const [weatherGrid, setWeatherGrid] = useState<WeatherGrid[]>([]);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);

  const fetchMarineData = useCallback(async (): Promise<MarineData | null> => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.copernicus));
      if (!response.ok) throw new Error('Failed to fetch marine data');

      const data = await response.json();
      return {
        temperature: data.temperature || 25.5,
        chlorophyll: data.chlorophyll || 0.8,
        salinity: data.salinity || 35.2,
        ph: data.ph,
        dissolvedOxygen: data.dissolvedOxygen,
        turbidity: data.turbidity,
        waveHeight: data.waveHeight,
        windSpeed: data.windSpeed,
        windDirection: data.windDirection,
        currentSpeed: data.currentSpeed,
        currentDirection: data.currentDirection,
        timestamp: new Date(data.timestamp || Date.now()),
        source: data.source || 'copernicus',
        quality: data.quality || 'medium',
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Error fetching marine data:', error);
      return null;
    }
  }, []);

  const fetchVesselData = useCallback(async (): Promise<VesselData[]> => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.vessels));
      if (!response.ok) throw new Error('Failed to fetch vessel data');

      const data = await response.json();
      // Map the API response to our VesselData type
      if (data.vessels && Array.isArray(data.vessels)) {
        return data.vessels.map((vessel: any) => ({
          id: vessel.id,
          name: vessel.name,
          mmsi: vessel.mmsi,
          latitude: vessel.latitude,
          longitude: vessel.longitude,
          speed: vessel.speed,
          course: vessel.course,
          timestamp: new Date(vessel.timestamp),
          type: vessel.type,
          flag: vessel.flag,
          length: vessel.length,
          width: vessel.width,
          draught: vessel.draught,
          destination: vessel.destination,
          eta: vessel.eta ? new Date(vessel.eta) : undefined,
          status: vessel.status,
          heading: vessel.heading
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching vessel data:', error);
      // Still return empty array on error - API will provide mock data
      return [];
    }
  }, []);

  const fetchChloroplethData = useCallback(async (): Promise<ChloroplethData[]> => {
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.realtime}?layer=chloropleth`));
      if (!response.ok) throw new Error('Failed to fetch chloropleth data');

      const data = await response.json();
      return data.chloropleth || [];
    } catch (error) {
      console.error('Error fetching chloropleth data:', error);
      return [];
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    // Angola EEZ bounding box
    const angolaEEZ = '-18.02,8.9,-5.55,13.35';

    const [
      marineData,
      vessels,
      chloroplethData,
      sst,
      oceanColor,
      salinity,
      vesselLights,
      mlPreds,
      weather,
      currentWeatherData
    ] = await Promise.all([
      fetchMarineData(),
      fetchVesselData(),
      fetchChloroplethData(),
      fetchSSTData(angolaEEZ, 2000),
      fetchOceanColorData(angolaEEZ, 2000),
      fetchSalinityData(angolaEEZ, 1000),
      fetchVesselLightsData(angolaEEZ, 500),
      fetchMLPredictions(undefined, 500),
      fetchWeatherGrid(angolaEEZ),
      fetchCurrentWeather(-12.5, 13.0) // Angola center point
    ]);

    return {
      marineData: marineData ?? DEFAULT_MARINE_DATA,
      vessels: vessels ?? [],
      chloroplethData: chloroplethData ?? [],
      sst: sst ?? [],
      oceanColor: oceanColor ?? [],
      salinity: salinity ?? [],
      vesselLights: vesselLights ?? [],
      mlPredictions: mlPreds ?? [],
      weatherGrid: weather ?? [],
      currentWeather: currentWeatherData ?? null
    };
  }, [fetchMarineData, fetchVesselData, fetchChloroplethData]);

  const { data, error, isLoading, mutate } = useSWR(
    'realtime-data',
    fetchAllData,
    {
      refreshInterval: REFRESH_INTERVALS.data,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  const refreshData = useCallback(async () => {
    await mutate();
  }, [mutate]);

  useEffect(() => {
    if (isLoading) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      return;
    }

    if (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
      return;
    }

    if (data) {
      setState(prev => ({
        ...prev,
        marineData: data.marineData ?? DEFAULT_MARINE_DATA,
        vessels: data.vessels ?? [],
        chloroplethData: data.chloroplethData ?? [],
        isLoading: false,
        error: null,
        lastUpdate: new Date()
      }));

      setSstData(data.sst ?? []);
      setOceanColorData(data.oceanColor ?? []);
      setSalinityData(data.salinity ?? []);
      setVesselLightsData(data.vesselLights ?? []);
      setMlPredictions(data.mlPredictions ?? []);
      setWeatherGrid(data.weatherGrid ?? []);
      setCurrentWeather(data.currentWeather ?? null);
    }
  }, [data, error, isLoading]);

  const toggleLayer = useCallback((layerId: string) => {
    setActiveLayers(prev => {
      const isActive = prev.includes(layerId);
      const newLayers = isActive
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId];
      return newLayers;
    });
  }, []);

  const contextValue: RealtimeContextType = {
    ...state,
    refreshData,
    toggleLayer,
    activeLayers,
    sstData,
    oceanColorData,
    salinityData,
    vesselLightsData,
    mlPredictions,
    weatherGrid,
    currentWeather
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}