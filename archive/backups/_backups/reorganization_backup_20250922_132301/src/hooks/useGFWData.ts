import { useState, useEffect, useCallback } from 'react';
import GFWApiService, {
  GFWStats,
  GFWAlert,
  GFWVessel,
  GFWVesselResponse
} from '@/lib/api-gfw';

export interface UseGFWDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
  vesselTypes?: string[];
  confidenceLevel?: number;
}

export interface UseGFWDataReturn {
  // Data
  stats: GFWStats | null;
  alerts: GFWAlert[];
  vessels: GFWVessel[];

  // Loading states
  loading: boolean;
  refreshing: boolean;

  // Error handling
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  clearError: () => void;

  // Cache management
  clearCache: () => void;
  getCacheStats: () => { size: number; entries: string[] };
}

export function useGFWData(options: UseGFWDataOptions = {}): UseGFWDataReturn {
  const {
    autoRefresh = true,
    refreshInterval = 5, // 5 minutes
    vesselTypes = ['fishing', 'carrier', 'support'],
    confidenceLevel = 3
  } = options;

  // State
  const [stats, setStats] = useState<GFWStats | null>(null);
  const [alerts, setAlerts] = useState<GFWAlert[]>([]);
  const [vessels, setVessels] = useState<GFWVessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh function
  const refresh = useCallback(async () => {
    try {
      // Set appropriate loading state
      if (stats === null) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      console.log('[useGFWData] Starting data refresh...');

      // Fetch all data in parallel for better performance
      const [statsData, alertsData, vesselsResponse] = await Promise.all([
        GFWApiService.getStats(),
        GFWApiService.getAlerts(),
        GFWApiService.getVessels({ limit: 100 })
      ]);

      // Filter vessels by type if specified
      let filteredVessels = vesselsResponse.entries;
      if (vesselTypes.length > 0) {
        filteredVessels = vesselsResponse.entries.filter(vessel =>
          vesselTypes.includes(vessel.vesselType)
        );
      }

      // Filter alerts by confidence level
      let filteredAlerts = alertsData;
      if (confidenceLevel > 1) {
        // Higher confidence = fewer alerts (filter out low severity)
        if (confidenceLevel >= 3) {
          filteredAlerts = alertsData.filter(alert => alert.severity !== 'low');
        }
        if (confidenceLevel >= 4) {
          filteredAlerts = alertsData.filter(alert => alert.severity === 'high');
        }
      }

      // Update state
      setStats(statsData);
      setAlerts(filteredAlerts);
      setVessels(filteredVessels);

      console.log('[useGFWData] Data refresh completed successfully', {
        stats: statsData,
        alertsCount: filteredAlerts.length,
        vesselsCount: filteredVessels.length
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados GFW';
      console.error('[useGFWData] Error during refresh:', err);
      setError(errorMessage);

      // If this is the first load and we got an error, set empty data
      if (stats === null) {
        setStats({
          totalVessels: 0,
          activeAlerts: 0,
          protectedAreaViolations: 0,
          lastUpdate: new Date().toISOString(),
          dataUsage: { current: 0, limit: 1000 }
        });
        setAlerts([]);
        setVessels([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [stats, vesselTypes, confidenceLevel]);

  // Auto-refresh effect
  useEffect(() => {
    // Initial load
    refresh();

    // Set up auto-refresh if enabled
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        console.log(`[useGFWData] Auto-refresh triggered (every ${refreshInterval} minutes)`);
        refresh();
      }, refreshInterval * 60 * 1000);

      return () => {
        console.log('[useGFWData] Cleaning up auto-refresh interval');
        clearInterval(interval);
      };
    }
  }, [autoRefresh, refreshInterval, refresh]);

  // Cache management functions
  const clearCache = useCallback(() => {
    GFWApiService.clearCache();
    console.log('[useGFWData] Cache cleared by user request');
  }, []);

  const getCacheStats = useCallback(() => {
    return GFWApiService.getCacheStats();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[useGFWData] Hook unmounting, cleaning up...');
    };
  }, []);

  return {
    // Data
    stats,
    alerts,
    vessels,

    // Loading states
    loading,
    refreshing,

    // Error handling
    error,

    // Actions
    refresh,
    clearError,

    // Cache management
    clearCache,
    getCacheStats
  };
}

export default useGFWData;