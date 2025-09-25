/**
 * BGAPP API Client - Silicon Valley Grade
 * Cliente HTTP otimizado com retry, cache e fallback
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Configuração de ambientes
const API_ENDPOINTS = {
  production: 'https://bgapp-api.majearcasa.workers.dev',
  staging: 'https://bgapp-staging.majearcasa.workers.dev',
  development: 'http://localhost:8787'
};

// Configuração de timeouts
const TIMEOUTS = {
  default: 10000,
  upload: 30000,
  download: 20000,
  realtime: 5000
};

// Configuração de retry
const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  initialDelay: 1000,
  maxDelay: 10000
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    version: string;
    cached?: boolean;
  };
}

export interface RequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  useCache?: boolean;
  cacheTime?: number;
  retryAttempts?: number;
  priority?: 'high' | 'normal' | 'low';
}

class BGAPPApiClient {
  private client: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }>;
  private pendingRequests: Map<string, Promise<any>>;
  private requestQueue: Array<() => Promise<any>>;
  private isOffline: boolean = false;

  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.requestQueue = [];
    
    // Detectar ambiente
    const environment = process.env.NEXT_PUBLIC_ENV || 'production';
    const baseURL = API_ENDPOINTS[environment as keyof typeof API_ENDPOINTS];

    // Criar instância do axios
    this.client = axios.create({
      baseURL,
      timeout: TIMEOUTS.default,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '2.0.0',
        'X-Client-Platform': 'web'
      }
    });

    // Configurar interceptors
    this.setupInterceptors();
    
    // Monitorar status de conexão
    this.monitorConnection();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Adicionar token se disponível
        const token = this.getAuthToken();
        if (token && !config.headers['skipAuth']) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Adicionar request ID para tracking
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        // Log em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${response.config.url}`, response.data);
        }

        // Adicionar ao cache se configurado
        if (response.config.headers['useCache']) {
          this.addToCache(response.config.url!, response.data);
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Retry logic
        if (!originalRequest._retry && originalRequest.retryAttempts > 0) {
          originalRequest._retry = true;
          originalRequest.retryAttempts--;
          
          // Exponential backoff
          const delay = Math.min(
            RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, 
              RETRY_CONFIG.maxAttempts - originalRequest.retryAttempts),
            RETRY_CONFIG.maxDelay
          );

          await this.sleep(delay);
          
          return this.client(originalRequest);
        }

        // Handle 401 - Token expirado
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            const token = this.getAuthToken();
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Redirecionar para login
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // Log erro
        console.error(`❌ API Error: ${error.config?.url}`, error.response?.data || error.message);
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request com cache inteligente
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey('GET', url, options.params);
    
    // Verificar cache
    if (options.useCache !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { success: true, data: cached, metadata: { 
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          cached: true 
        }};
      }
    }

    // Deduplicar requests pendentes
    const pendingKey = `GET:${url}`;
    if (this.pendingRequests.has(pendingKey)) {
      return this.pendingRequests.get(pendingKey);
    }

    const request = this.makeRequest<T>('GET', url, options);
    this.pendingRequests.set(pendingKey, request);

    try {
      const result = await request;
      this.pendingRequests.delete(pendingKey);
      
      // Adicionar ao cache
      if (options.useCache !== false) {
        this.addToCache(cacheKey, result.data, options.cacheTime);
      }
      
      return result;
    } catch (error) {
      this.pendingRequests.delete(pendingKey);
      throw error;
    }
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('POST', url, { ...options, data });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PUT', url, { ...options, data });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('DELETE', url, options);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PATCH', url, { ...options, data });
  }

  /**
   * Request genérico com tratamento de erro
   */
  private async makeRequest<T>(
    method: string,
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Se offline, tentar cache ou queue
      if (this.isOffline) {
        return this.handleOfflineRequest(method, url, options);
      }

      // Configurar retry
      const config: AxiosRequestConfig = {
        ...options,
        method,
        url,
        retryAttempts: options.retryAttempts ?? RETRY_CONFIG.maxAttempts,
        headers: {
          ...options.headers,
          useCache: options.useCache,
          skipAuth: options.skipAuth
        }
      };

      const response = await this.client.request<T>(config);
      
      return {
        success: true,
        data: response.data,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          cached: false
        }
      };
    } catch (error: any) {
      // Tentar fallback do cache em caso de erro
      if (options.useCache !== false && method === 'GET') {
        const cacheKey = this.getCacheKey(method, url, options.params);
        const cached = this.getFromCache(cacheKey, true); // Force stale cache
        
        if (cached) {
          console.warn(`Using stale cache for ${url} due to error`);
          return {
            success: true,
            data: cached,
            metadata: {
              timestamp: new Date().toISOString(),
              version: '2.0.0',
              cached: true
            }
          };
        }
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Unknown error occurred',
        metadata: {
          timestamp: new Date().toISOString(),
          version: '2.0.0'
        }
      };
    }
  }

  /**
   * Gerenciamento de cache
   */
  private getCacheKey(method: string, url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramString}`;
  }

  private getFromCache(key: string, allowStale: boolean = false): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    const maxAge = allowStale ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000; // 24h if stale, 5min normal

    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private addToCache(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Limpar cache antigo
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Gerenciamento offline
   */
  private async handleOfflineRequest<T>(
    method: string,
    url: string,
    options: RequestOptions
  ): Promise<ApiResponse<T>> {
    // Para GET, tentar cache
    if (method === 'GET') {
      const cacheKey = this.getCacheKey(method, url, options.params);
      const cached = this.getFromCache(cacheKey, true);
      
      if (cached) {
        return {
          success: true,
          data: cached,
          metadata: {
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            cached: true
          }
        };
      }
    }

    // Para outras operações, adicionar à queue
    return new Promise((resolve) => {
      this.requestQueue.push(async () => {
        const result = await this.makeRequest<T>(method, url, options);
        resolve(result);
      });
    });
  }

  private monitorConnection(): void {
    // Verificar se está no browser antes de usar window
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOffline = false;
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.isOffline = true;
      });
    }
  }

  private async processQueue(): Promise<void> {
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Error processing queued request:', error);
        }
      }
    }
  }

  /**
   * Autenticação
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bgapp_token');
    }
    return null;
  }

  private async refreshToken(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot refresh token on server side');
    }
    
    const refreshToken = localStorage.getItem('bgapp_refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await this.post('/auth/refresh', { refreshToken });
    
    if (response.success && response.data) {
      localStorage.setItem('bgapp_token', response.data.accessToken);
      localStorage.setItem('bgapp_refresh_token', response.data.refreshToken);
    } else {
      throw new Error('Failed to refresh token');
    }
  }

  private handleAuthError(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bgapp_token');
      localStorage.removeItem('bgapp_refresh_token');
      window.location.href = '/login';
    }
  }

  /**
   * Utilities
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
const apiClient = new BGAPPApiClient();

export default apiClient;

// Export types
export type { BGAPPApiClient };
