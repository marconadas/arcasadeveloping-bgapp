/**
 * Configuração de API para produção
 * Elimina completamente o uso de mock data
 */

export const API_CONFIG = {
  // URLs de produção
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://bgapp-admin-api-worker.majearcasa.workers.dev',
  fallbackURL: process.env.NEXT_PUBLIC_API_FALLBACK_URL || 'https://bgapp-api-worker.majearcasa.workers.dev',
  wsURL: process.env.NEXT_PUBLIC_WS_URL || 'wss://bgapp-ws.majearcasa.workers.dev',

  // Endpoints específicos
  apiWorkerURL: 'https://bgapp-api-worker.majearcasa.workers.dev',
  adminApiWorkerURL: 'https://bgapp-admin-api-worker.majearcasa.workers.dev',
  
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

// Endpoints específicos baseados na análise da estrutura real em produção
export const API_ENDPOINTS = {
  // Sistema de Saúde e Status
  health: {
    systemHealth: '/admin-dashboard/system-health',
    status: '/api/services/status',
    check: '/health'
  },

  // Dashboard Oceanográfico
  dashboard: {
    overview: '/api/dashboard/overview',
    oceanographicData: '/admin-dashboard/oceanographic-data',
    fisheriesStats: '/admin-dashboard/fisheries-stats',
    metrics: '/metrics',
    alerts: '/alerts'
  },

  // Global Fishing Watch (GFW)
  gfw: {
    vesselPresence: '/api/gfw/vessel-presence',
    testIntegration: '/api/gfw/test-integration',
    debug: '/api/gfw/debug'
  },

  // Copernicus
  copernicus: {
    realTimeData: '/admin-dashboard/copernicus-advanced/real-time-data'
  },

  // Armazenamento e Base de Dados
  storage: {
    buckets: '/storage/buckets',
    tables: '/database/tables'
  },

  // Dados em Tempo Real
  realtime: {
    data: '/realtime/data'
  },

  // ML e Filtros Preditivos
  ml: {
    predictiveFilters: '/ml/predictive-filters',
    activateFilter: '/ml/filters/{filterId}/activate',
    deactivateFilter: '/ml/filters/{filterId}/deactivate'
  },

  // Mapas e Ferramentas
  maps: {
    list: '/api/maps',
    stats: '/api/maps/stats',
    templates: '/api/maps/templates',
    tools: {
      categories: '/api/maps/tools/categories',
      baseLayers: '/api/maps/tools/base-layers',
      validate: '/api/maps/tools/validate',
      suggestLayers: '/api/maps/tools/suggest-layers/{category}',
      optimize: '/api/maps/tools/optimize'
    }
  },

  // Relatórios
  reports: {
    list: '/api/reports'
  },

  // Coleções STAC
  collections: '/collections'
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
