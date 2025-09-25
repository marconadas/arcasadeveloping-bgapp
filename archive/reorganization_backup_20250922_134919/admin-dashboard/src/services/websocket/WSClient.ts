/**
 * WebSocket Client para dados em tempo real
 * Gerencia conexões WebSocket com reconexão automática
 */

import { EventEmitter } from 'events';

export interface WSConfig {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

export interface WSMessage<T = any> {
  type: string;
  channel?: string;
  data: T;
  timestamp: string;
  id?: string;
}

export type WSEventHandler<T = any> = (data: T) => void;

class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WSConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private messageQueue: WSMessage[] = [];
  private subscriptions = new Map<string, Set<WSEventHandler>>();
  private connectionPromise: Promise<void> | null = null;

  constructor(config: WSConfig) {
    super();
    
    this.config = {
      url: config.url,
      protocols: config.protocols || [],
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval ?? 5000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      debug: config.debug ?? false
    };
  }

  /**
   * Conectar ao servidor WebSocket
   */
  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.isIntentionallyClosed = false;
        
        // Criar conexão WebSocket
        this.ws = new WebSocket(this.config.url, this.config.protocols);
        
        // Event handlers
        this.ws.onopen = () => {
          this.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.emit('connected');
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          this.log('WebSocket error:', error);
          this.emit('error', error);
        };

        this.ws.onclose = (event) => {
          this.log(`WebSocket closed: ${event.code} - ${event.reason}`);
          this.stopHeartbeat();
          this.emit('disconnected', event);
          
          if (!this.isIntentionallyClosed && this.config.reconnect) {
            this.scheduleReconnect();
          }
        };

      } catch (error) {
        this.log('Failed to create WebSocket:', error);
        reject(error);
      } finally {
        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  /**
   * Desconectar do servidor
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    
    this.emit('disconnected', { code: 1000, reason: 'Client disconnecting' });
  }

  /**
   * Enviar mensagem
   */
  send<T = any>(message: WSMessage<T>): void {
    const msg = {
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
      id: message.id || this.generateId()
    };

    if (this.isConnected()) {
      try {
        this.ws!.send(JSON.stringify(msg));
        this.log('Message sent:', msg);
      } catch (error) {
        this.log('Failed to send message:', error);
        this.messageQueue.push(msg);
      }
    } else {
      this.log('WebSocket not connected, queueing message');
      this.messageQueue.push(msg);
    }
  }

  /**
   * Subscrever a um canal
   */
  subscribe<T = any>(channel: string, handler: WSEventHandler<T>): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      
      // Enviar mensagem de subscrição ao servidor
      this.send({
        type: 'subscribe',
        channel,
        data: {}
      });
    }
    
    this.subscriptions.get(channel)!.add(handler);
    
    // Retornar função de unsubscribe
    return () => {
      this.unsubscribe(channel, handler);
    };
  }

  /**
   * Cancelar subscrição
   */
  unsubscribe<T = any>(channel: string, handler: WSEventHandler<T>): void {
    const handlers = this.subscriptions.get(channel);
    
    if (handlers) {
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
        
        // Enviar mensagem de unsubscribe ao servidor
        this.send({
          type: 'unsubscribe',
          channel,
          data: {}
        });
      }
    }
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Obter estado da conexão
   */
  getState(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Processar mensagem recebida
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WSMessage;
      this.log('Message received:', message);
      
      // Emitir evento global
      this.emit('message', message);
      
      // Emitir para canal específico
      if (message.channel) {
        const handlers = this.subscriptions.get(message.channel);
        
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(message.data);
            } catch (error) {
              console.error(`Error in channel handler for ${message.channel}:`, error);
            }
          });
        }
      }
      
      // Processar tipos especiais de mensagem
      switch (message.type) {
        case 'pong':
          this.handlePong();
          break;
        case 'error':
          this.emit('server-error', message.data);
          break;
        case 'notification':
          this.emit('notification', message.data);
          break;
      }
      
    } catch (error) {
      this.log('Failed to parse message:', error);
      this.emit('parse-error', { error, data: event.data });
    }
  }

  /**
   * Reconexão automática
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnection attempts reached');
      this.emit('max-reconnect-attempts');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
    
    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Heartbeat para manter conexão viva
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'ping',
          data: { timestamp: Date.now() }
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handlePong(): void {
    this.emit('pong');
  }

  /**
   * Enviar mensagens enfileiradas
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * Gerar ID único
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log debug
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args);
    }
  }
}

// Singleton para conexão principal
let mainConnection: WebSocketClient | null = null;

/**
 * Obter conexão WebSocket principal
 */
export function getMainWebSocket(config?: WSConfig): WebSocketClient {
  if (!mainConnection && config) {
    mainConnection = new WebSocketClient(config);
  }
  
  if (!mainConnection) {
    throw new Error('WebSocket not initialized. Please provide config.');
  }
  
  return mainConnection;
}

/**
 * Criar nova conexão WebSocket
 */
export function createWebSocket(config: WSConfig): WebSocketClient {
  return new WebSocketClient(config);
}

export default WebSocketClient;
