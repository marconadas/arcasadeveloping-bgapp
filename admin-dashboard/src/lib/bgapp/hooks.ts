import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

/**
 * 🚀 BGAPP React Hooks - Silicon Valley Grade A+
 * Sistema de hooks inteligente com fallbacks automáticos
 */

interface BGAPPHookOptions<T> {
  fallbackData?: T;
  refreshInterval?: number;
  staleTime?: number;
  cacheTime?: number;
  retryAttempts?: number;
  enableOffline?: boolean;
}

interface BGAPPHookResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
  isStale: boolean;
  refetch: () => void;
  lastUpdated?: Date;
}

/**
 * Hook principal para dados BGAPP com fallbacks inteligentes
 */
export function useBGAPPData<T>(
  queryKey: string | string[],
  queryFn: () => Promise<T>,
  options: BGAPPHookOptions<T> = {}
): BGAPPHookResult<T> {
  const {
    fallbackData,
    refreshInterval = 30000,
    staleTime = 5 * 60 * 1000, // 5 minutos
    cacheTime = 10 * 60 * 1000, // 10 minutos
    retryAttempts = 3,
    enableOffline = true
  } = options;

  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>();

  const queryResult = useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      try {
        const result = await queryFn();
        setIsUsingFallback(false);
        setLastUpdated(new Date());
        
        // Cache no localStorage se offline habilitado
        if (enableOffline) {
          const cacheKey = Array.isArray(queryKey) ? queryKey.join('-') : queryKey;
          localStorage.setItem(`bgapp-cache-${cacheKey}`, JSON.stringify({
            data: result,
            timestamp: Date.now()
          }));
        }
        
        return result;
      } catch (error) {
        console.warn(`BGAPP API failed for ${queryKey}, attempting fallback:`, error);
        
        // Tentar cache local primeiro
        if (enableOffline) {
          const cacheKey = Array.isArray(queryKey) ? queryKey.join('-') : queryKey;
          const cached = localStorage.getItem(`bgapp-cache-${cacheKey}`);
          
          if (cached) {
            try {
              const { data, timestamp } = JSON.parse(cached);
              const age = Date.now() - timestamp;
              
              // Usar cache se for menos de 1 hora
              if (age < 60 * 60 * 1000) {
                console.log(`Using cached data for ${queryKey}`);
                setIsUsingFallback(true);
                return data;
              }
            } catch (parseError) {
              console.warn('Failed to parse cached data:', parseError);
            }
          }
        }
        
        // Usar fallback data se disponível
        if (fallbackData) {
          console.log(`Using fallback data for ${queryKey}`);
          setIsUsingFallback(true);
          return fallbackData;
        }
        
        throw error;
      }
    },
    staleTime,
    gcTime: cacheTime,
    retry: retryAttempts,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false
  });

  const refetch = useCallback(() => {
    queryResult.refetch();
  }, [queryResult]);

  return {
    data: queryResult.data || null,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    isUsingFallback,
    isStale: queryResult.isStale,
    refetch,
    lastUpdated
  };
}

/**
 * Hook para dados ML com fallbacks específicos
 */
export function useMLData<T>(
  endpoint: string,
  queryFn: () => Promise<T>,
  fallbackData?: T
) {
  return useBGAPPData(
    ['ml', endpoint],
    queryFn,
    {
      fallbackData,
      refreshInterval: 60000, // 1 minuto para ML
      staleTime: 2 * 60 * 1000, // 2 minutos
      enableOffline: true
    }
  );
}

/**
 * Hook para dados QGIS com cache otimizado
 */
export function useQGISData<T>(
  analysisType: string,
  queryFn: () => Promise<T>,
  fallbackData?: T
) {
  return useBGAPPData(
    ['qgis', analysisType],
    queryFn,
    {
      fallbackData,
      refreshInterval: 5 * 60 * 1000, // 5 minutos para QGIS
      staleTime: 10 * 60 * 1000, // 10 minutos
      cacheTime: 30 * 60 * 1000, // 30 minutos
      enableOffline: true
    }
  );
}

/**
 * Hook para conectores de dados
 */
export function useDataConnectors<T>(
  queryFn: () => Promise<T>,
  fallbackData?: T
) {
  return useBGAPPData(
    ['data', 'connectors'],
    queryFn,
    {
      fallbackData,
      refreshInterval: 2 * 60 * 1000, // 2 minutos
      staleTime: 60 * 1000, // 1 minuto
      enableOffline: true
    }
  );
}

/**
 * Hook para interfaces científicas
 */
export function useScientificInterfaces<T>(
  queryFn: () => Promise<T>,
  fallbackData?: T
) {
  return useBGAPPData(
    ['scientific', 'interfaces'],
    queryFn,
    {
      fallbackData,
      refreshInterval: 10 * 60 * 1000, // 10 minutos
      staleTime: 5 * 60 * 1000, // 5 minutos
      enableOffline: true
    }
  );
}

/**
 * Hook para status de serviços com refresh rápido
 */
export function useServicesStatus<T>(
  queryFn: () => Promise<T>,
  fallbackData?: T
) {
  return useBGAPPData(
    ['services', 'status'],
    queryFn,
    {
      fallbackData,
      refreshInterval: 15000, // 15 segundos
      staleTime: 30000, // 30 segundos
      enableOffline: false // Status deve ser sempre atual
    }
  );
}

/**
 * Hook personalizado para auto-refresh inteligente
 */
export function useAutoRefresh(
  callback: () => void,
  interval: number = 30000,
  dependencies: any[] = []
) {
  const [isActive, setIsActive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>();

  useEffect(() => {
    if (!isActive) return;

    const intervalId = setInterval(() => {
      callback();
      setLastRefresh(new Date());
    }, interval);

    return () => clearInterval(intervalId);
  }, [callback, interval, isActive, ...dependencies]);

  const toggle = useCallback(() => {
    setIsActive(prev => !prev);
  }, []);

  const forceRefresh = useCallback(() => {
    callback();
    setLastRefresh(new Date());
  }, [callback]);

  return {
    isActive,
    lastRefresh,
    toggle,
    forceRefresh
  };
}

/**
 * Hook para gestão de estado offline
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook para notificações de sistema
 */
export function useBGAPPNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
  }>>([]);

  const addNotification = useCallback((
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string
  ) => {
    const notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      isRead: false
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Manter apenas 50
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    clearAll
  };
}

export default {
  useBGAPPData,
  useMLData,
  useQGISData,
  useDataConnectors,
  useScientificInterfaces,
  useServicesStatus,
  useAutoRefresh,
  useOfflineStatus,
  useBGAPPNotifications
};
