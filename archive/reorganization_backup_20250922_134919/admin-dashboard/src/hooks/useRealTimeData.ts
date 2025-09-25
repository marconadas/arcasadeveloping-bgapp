/**
 * Hook para dados em tempo real via WebSocket
 * Gerencia subscrições e atualizações automáticas
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import WebSocketClient, { WSEventHandler, getMainWebSocket } from '@/services/websocket/WSClient';
import { toast } from 'sonner';

export interface RealTimeDataOptions {
  channel: string;
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  fallbackData?: any;
  autoReconnect?: boolean;
  showNotifications?: boolean;
}

export interface RealTimeDataResult<T> {
  data: T | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  reconnect: () => Promise<void>;
  disconnect: () => void;
  send: (data: any) => void;
}

/**
 * Hook para subscrever a dados em tempo real
 */
export function useRealTimeData<T = any>(
  options: RealTimeDataOptions
): RealTimeDataResult<T> {
  const {
    channel,
    enabled = true,
    onConnect,
    onDisconnect,
    onError,
    fallbackData = null,
    autoReconnect = true,
    showNotifications = false
  } = options;

  const [data, setData] = useState<T | null>(fallbackData);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const wsRef = useRef<WebSocketClient | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Conectar ao WebSocket
  const connect = useCallback(async () => {
    if (!enabled || wsRef.current?.isConnected()) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Obter ou criar conexão WebSocket
      if (!wsRef.current) {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://bgapp-ws.majearcasa.workers.dev';
        wsRef.current = getMainWebSocket({
          url: wsUrl,
          reconnect: autoReconnect,
          debug: process.env.NODE_ENV === 'development'
        });
      }

      // Conectar se não estiver conectado
      if (!wsRef.current.isConnected()) {
        await wsRef.current.connect();
      }

      // Subscrever ao canal
      const handler: WSEventHandler<T> = (newData) => {
        setData(newData);
        setLastUpdate(new Date());
        
        if (showNotifications) {
          toast.info(`Atualização em ${channel}`, {
            description: 'Novos dados recebidos'
          });
        }
      };

      unsubscribeRef.current = wsRef.current.subscribe<T>(channel, handler);
      
      setIsConnected(true);
      onConnect?.();
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Falha na conexão WebSocket');
      setError(error);
      onError?.(error);
      
      if (showNotifications) {
        toast.error('Erro na conexão em tempo real', {
          description: error.message
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [enabled, channel, autoReconnect, onConnect, onError, showNotifications]);

  // Desconectar
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    onDisconnect?.();
  }, [onDisconnect]);

  // Reconectar
  const reconnect = useCallback(async () => {
    disconnect();
    await connect();
  }, [connect, disconnect]);

  // Enviar mensagem
  const send = useCallback((messageData: any) => {
    if (wsRef.current?.isConnected()) {
      wsRef.current.send({
        type: 'message',
        channel,
        data: messageData
      });
    } else {
      console.warn('WebSocket não conectado. Mensagem não enviada.');
    }
  }, [channel]);

  // Setup inicial e cleanup
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, connect]);

  // Monitorar eventos de conexão
  useEffect(() => {
    if (!wsRef.current) return;

    const handleConnected = () => {
      setIsConnected(true);
      setError(null);
      
      if (showNotifications) {
        toast.success('Conectado ao servidor em tempo real');
      }
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      
      if (showNotifications) {
        toast.warning('Desconectado do servidor em tempo real');
      }
    };

    const handleError = (err: any) => {
      const error = err instanceof Error ? err : new Error('Erro no WebSocket');
      setError(error);
      
      if (showNotifications) {
        toast.error('Erro na conexão', {
          description: error.message
        });
      }
    };

    wsRef.current.on('connected', handleConnected);
    wsRef.current.on('disconnected', handleDisconnected);
    wsRef.current.on('error', handleError);

    return () => {
      if (wsRef.current) {
        wsRef.current.off('connected', handleConnected);
        wsRef.current.off('disconnected', handleDisconnected);
        wsRef.current.off('error', handleError);
      }
    };
  }, [showNotifications]);

  return {
    data,
    isConnected,
    isConnecting,
    error,
    lastUpdate,
    reconnect,
    disconnect,
    send
  };
}

/**
 * Hook para múltiplos canais em tempo real
 */
export function useMultiChannelRealTime<T extends Record<string, any>>(
  channels: string[],
  options?: Omit<RealTimeDataOptions, 'channel'>
): Record<string, RealTimeDataResult<any>> {
  const results: Record<string, RealTimeDataResult<any>> = {};
  
  channels.forEach(channel => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[channel] = useRealTimeData({
      ...options,
      channel
    });
  });
  
  return results;
}

/**
 * Hook para métricas em tempo real
 */
export function useRealTimeMetrics() {
  return useRealTimeData<{
    cpu: number;
    memory: number;
    requests: number;
    errors: number;
    latency: number;
  }>({
    channel: 'metrics',
    fallbackData: {
      cpu: 0,
      memory: 0,
      requests: 0,
      errors: 0,
      latency: 0
    },
    showNotifications: false
  });
}

/**
 * Hook para alertas em tempo real
 */
export function useRealTimeAlerts() {
  const result = useRealTimeData<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    timestamp: string;
  }>({
    channel: 'alerts',
    showNotifications: true
  });

  // Processar alertas automaticamente
  useEffect(() => {
    if (result.data) {
      const { type, title, message } = result.data;
      
      switch (type) {
        case 'info':
          toast.info(title, { description: message });
          break;
        case 'warning':
          toast.warning(title, { description: message });
          break;
        case 'error':
        case 'critical':
          toast.error(title, { description: message });
          break;
      }
    }
  }, [result.data]);

  return result;
}

/**
 * Hook para dados oceanográficos em tempo real
 */
export function useRealTimeOceanData() {
  return useRealTimeData<{
    temperature: number;
    salinity: number;
    ph: number;
    oxygen: number;
    depth: number;
    current_speed: number;
    current_direction: number;
    wave_height: number;
    coordinates: {
      lat: number;
      lng: number;
    };
  }>({
    channel: 'ocean-data',
    fallbackData: {
      temperature: 0,
      salinity: 0,
      ph: 0,
      oxygen: 0,
      depth: 0,
      current_speed: 0,
      current_direction: 0,
      wave_height: 0,
      coordinates: { lat: 0, lng: 0 }
    }
  });
}

/**
 * Hook para biodiversidade em tempo real
 */
export function useRealTimeBiodiversity() {
  return useRealTimeData<{
    species_detected: Array<{
      id: string;
      name: string;
      count: number;
      confidence: number;
      location: { lat: number; lng: number };
      timestamp: string;
    }>;
    total_species: number;
    diversity_index: number;
    threat_level: 'low' | 'medium' | 'high';
  }>({
    channel: 'biodiversity',
    showNotifications: true
  });
}

export default useRealTimeData;
