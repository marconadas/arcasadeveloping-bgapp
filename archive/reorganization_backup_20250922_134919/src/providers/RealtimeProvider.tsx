'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { RealtimeState, MarineData, VesselData, ChloroplethData } from '@/lib/types';
import { API_ENDPOINTS, REFRESH_INTERVALS } from '@/lib/constants';

interface RealtimeContextType extends RealtimeState {
  refreshData: () => Promise<void>;
  toggleLayer: (layerId: string) => void;
  activeLayers: string[];
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

  const [activeLayers, setActiveLayers] = useState<string[]>(['vessels', 'temperature']);

  const fetchMarineData = useCallback(async (): Promise<MarineData | null> => {
    try {
      const response = await fetch(API_ENDPOINTS.copernicus);
      if (!response.ok) throw new Error('Failed to fetch marine data');

      const data = await response.json();
      return {
        temperature: data.temperature || 25.5,
        chlorophyll: data.chlorophyll || 0.8,
        salinity: data.salinity || 35.2,
        timestamp: new Date(data.timestamp || Date.now()),
        source: 'copernicus',
        quality: data.quality || 'medium'
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
      return data.vessels || [];
    } catch (error) {
      console.error('Error fetching vessel data:', error);
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
      const [marineData, vessels, chloroplethData] = await Promise.all([
        fetchMarineData(),
        fetchVesselData(),
        fetchChloroplethData()
      ]);

      setState(prev => ({
        ...prev,
        marineData,
        vessels,
        chloroplethData,
        isLoading: false,
        lastUpdate: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, [fetchMarineData, fetchVesselData, fetchChloroplethData]);

  const toggleLayer = useCallback((layerId: string) => {
    setActiveLayers(prev =>
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  }, []);

  // Auto-refresh dos dados
  useEffect(() => {
    refreshData();

    const marineInterval = setInterval(fetchMarineData, REFRESH_INTERVALS.realtime);
    const vesselInterval = setInterval(fetchVesselData, REFRESH_INTERVALS.vessels);

    return () => {
      clearInterval(marineInterval);
      clearInterval(vesselInterval);
    };
  }, [refreshData, fetchMarineData, fetchVesselData]);

  // WebSocket connection para dados em tempo real
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        // Assumindo que temos um WebSocket endpoint configurado
        ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/realtime');

        ws.onopen = () => {
          console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'marine_update') {
              setState(prev => ({
                ...prev,
                marineData: data.payload,
                lastUpdate: new Date()
              }));
            } else if (data.type === 'vessel_update') {
              setState(prev => ({
                ...prev,
                vessels: data.payload,
                lastUpdate: new Date()
              }));
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected, attempting to reconnect...');
          setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    // connectWebSocket(); // Descomentado quando WebSocket estiver configurado

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const contextValue: RealtimeContextType = {
    ...state,
    refreshData,
    toggleLayer,
    activeLayers
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}