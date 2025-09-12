/**
 * Configuração de API para produção
 * Elimina completamente o uso de mock data
 */

export const API_CONFIG = {
  // URLs de produção
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://bgapp-api.majearcasa.workers.dev',
  fallbackURL: process.env.NEXT_PUBLIC_API_FALLBACK_URL || 'https://bgapp-backup.workers.dev',
  wsURL: process.env.NEXT_PUBLIC_WS_URL || 'wss://bgapp-ws.majearcasa.workers.dev',
  
  // Timeouts
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
  wsReconnectInterval: 5000,
  
  // Cache
  cacheEnabled: process.env.NEXT_PUBLIC_ENABLE_CACHE !== 'false',
  cacheTTL: parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '300000'),
  maxCacheSize: parseInt(process.env.NEXT_PUBLIC_MAX_CACHE_SIZE || '100'),
  
  // Features
  enableRealtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false',
  enableOfflineMode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE !== 'false',
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
    maxDelay: 10000
  },
  
  // Headers padrão
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': '2.0.0',
    'X-Client-Platform': 'web'
  }
};

// Endpoints específicos
export const API_ENDPOINTS = {
  // ML Retention
  ml: {
    retention: {
      data: '/api/ml/retention/data',
      metrics: '/api/ml/retention/metrics',
      health: '/api/ml/retention/health',
      policies: '/api/ml/retention/policies',
      cleanup: '/api/ml/retention/cleanup',
      archive: '/api/ml/retention/archive',
      export: '/api/ml/retention/export'
    },
    models: {
      list: '/api/ml/models',
      performance: '/api/ml/models/performance',
      predictions: '/api/ml/predictions'
    }
  },
  
  // QGIS
  qgis: {
    spatial: '/api/qgis/spatial/analysis',
    biomass: '/api/qgis/biomass/calculate',
    temporal: '/api/qgis/temporal/data',
    mcda: '/api/qgis/mcda/analysis'
  },
  
  // Dashboard
  dashboard: {
    metrics: '/api/dashboard/metrics',
    alerts: '/api/dashboard/alerts',
    status: '/api/dashboard/status'
  },
  
  // Reports
  reports: {
    list: '/api/reports',
    generate: '/api/reports/generate',
    export: '/api/reports/export'
  },
  
  // Auth
  auth: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout'
  }
};

// WebSocket channels
export const WS_CHANNELS = {
  metrics: 'metrics',
  alerts: 'alerts',
  oceanData: 'ocean-data',
  biodiversity: 'biodiversity',
  mlUpdates: 'ml-updates',
  systemStatus: 'system-status'
};

export default API_CONFIG;
