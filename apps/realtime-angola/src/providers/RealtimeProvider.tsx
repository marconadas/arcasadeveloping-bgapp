'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
      const response = await fetch(API_ENDPOINTS.copernicus);
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
      const response = await fetch(API_ENDPOINTS.vessels);
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
      const response = await fetch(`${API_ENDPOINTS.realtime}?layer=chloropleth`);
      if (!response.ok) throw new Error('Failed to fetch chloropleth data');

      const data = await response.json();
      return data.chloropleth || [];
    } catch (error) {
      console.error('Error fetching chloropleth data:', error);
      return [];
    }
  }, []);

  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Angola EEZ bounding box
      const angolaEEZ = '-18.02,8.9,-5.55,13.35';

      // Fetch all data types in parallel
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

      // Update all state
      setState(prev => ({
        ...prev,
        marineData,
        vessels,
        chloroplethData,
        isLoading: false,
        lastUpdate: new Date()
      }));

      // Update enhanced data state
      setSstData(sst);
      setOceanColorData(oceanColor);
      setSalinityData(salinity);
      setVesselLightsData(vesselLights);
      setMlPredictions(mlPreds);

      // Update weather data state
      setWeatherGrid(weather);
      setCurrentWeather(currentWeatherData);

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, [fetchMarineData, fetchVesselData, fetchChloroplethData]);

  const toggleLayer = useCallback((layerId: string) => {
    setActiveLayers(prev => {
      const isActive = prev.includes(layerId);
      const newLayers = isActive
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId];
      return newLayers;
    });
  }, []);

  // Auto-refresh dos dados
  useEffect(() => {
    refreshData();

    const marineInterval = setInterval(fetchMarineData, REFRESH_INTERVALS.marine);
    const vesselInterval = setInterval(fetchVesselData, REFRESH_INTERVALS.vessels);

    return () => {
      clearInterval(marineInterval);
      clearInterval(vesselInterval);
    };
  }, [refreshData, fetchMarineData, fetchVesselData]);

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