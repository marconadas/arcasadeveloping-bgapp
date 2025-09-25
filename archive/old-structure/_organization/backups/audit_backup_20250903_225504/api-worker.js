/**
 * BGAPP API Worker - Cloudflare Worker para APIs serverless
 * Fornece endpoints para o dashboard administrativo
 */

// Dados simulados para demonstração
const MOCK_DATA = {
  services: {
    summary: {
      total: 7,
      online: 7,
      offline: 0,
      health_percentage: 99,
      last_updated: new Date().toISOString()
    },
    services: [
      { name: 'Frontend', status: 'online', response_time: Math.floor(Math.random() * 50) + 20, uptime: 99.9, url: 'https://bgapp-arcasadeveloping.pages.dev' },
      { name: 'API Worker', status: 'online', response_time: Math.floor(Math.random() * 30) + 10, uptime: 99.8, url: 'cloudflare-worker' },
      { name: 'KV Storage', status: 'online', response_time: Math.floor(Math.random() * 20) + 5, uptime: 99.9, url: 'cloudflare-kv' },
      { name: 'Cache Engine', status: 'online', response_time: Math.floor(Math.random() * 15) + 3, uptime: 99.7, url: 'cloudflare-cache' },
      { name: 'Analytics', status: 'online', response_time: Math.floor(Math.random() * 40) + 25, uptime: 98.5, url: 'cloudflare-analytics' },
      { name: 'Security', status: 'online', response_time: Math.floor(Math.random() * 25) + 15, uptime: 99.2, url: 'cloudflare-security' },
      { name: 'External APIs', status: 'online', response_time: Math.floor(Math.random() * 100) + 50, uptime: 98.7, url: 'external-services' }
    ]
  },
  
  collections: [
    { id: 'zee_angola', title: 'ZEE Angola - Dados Oceanográficos', description: 'Coleção de dados da Zona Econômica Exclusiva de Angola', items: 1247 },
    { id: 'biodiversidade_marinha', title: 'Biodiversidade Marinha', description: 'Dados de biodiversidade marinha de Angola', items: 3456 },
    { id: 'biomassa_pesqueira', title: 'Biomassa Pesqueira', description: 'Estimativas de biomassa pesqueira', items: 892 },
    { id: 'correntes_marinhas', title: 'Correntes Marinhas', description: 'Dados de correntes oceânicas', items: 2134 },
    { id: 'temperatura_superficie', title: 'Temperatura da Superfície', description: 'Dados de temperatura da superfície do mar', items: 5678 },
    { id: 'salinidade_oceanica', title: 'Salinidade Oceânica', description: 'Dados de salinidade dos oceanos', items: 2341 },
    { id: 'clorofila_a', title: 'Clorofila-a', description: 'Concentrações de clorofila-a', items: 1789 }
  ],
  
  metrics: {
    requests_per_minute: Math.floor(Math.random() * 500) + 200,
    active_users: Math.floor(Math.random() * 50) + 10,
    cache_hit_rate: Math.floor(Math.random() * 20) + 80,
    avg_response_time: Math.floor(Math.random() * 100) + 50,
    error_rate: Math.random() * 2,
    uptime_percentage: 99.9,
    data_processed_gb: Math.floor(Math.random() * 100) + 50,
    api_calls_today: Math.floor(Math.random() * 10000) + 5000
  },
  
  alerts: [
    { id: 1, type: 'info', message: 'Sistema funcionando normalmente', timestamp: new Date().toISOString(), resolved: false },
    { id: 2, type: 'warning', message: 'APIs externas com latência elevada', timestamp: new Date(Date.now() - 3600000).toISOString(), resolved: false },
    { id: 3, type: 'success', message: 'Cache otimizado - performance melhorada em 25%', timestamp: new Date(Date.now() - 7200000).toISOString(), resolved: true }
  ],
  
  storage: {
    buckets: [
      { name: 'bgapp-data', size_gb: 12.5, files: 1247, last_modified: new Date().toISOString() },
      { name: 'bgapp-cache', size_gb: 3.2, files: 892, last_modified: new Date().toISOString() },
      { name: 'bgapp-backups', size_gb: 45.7, files: 234, last_modified: new Date().toISOString() }
    ],
    total_size_gb: 61.4,
    total_files: 2373
  }
};

// Funções utilitárias
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-retry-attempt, x-request-id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders()
  });
}

// Handler principal
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    
    try {
      // Health check
      if (path === '/health') {
        return jsonResponse({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: 'cloudflare-worker'
        });
      }
      
      // Services endpoint (without /status) - for admin compatibility
      if (path === '/services') {
        // Atualizar dados dinâmicos
        MOCK_DATA.services.summary.last_updated = new Date().toISOString();
        MOCK_DATA.services.services.forEach(service => {
          if (service.status === 'online') {
            service.response_time = Math.floor(Math.random() * 50) + 20;
          }
        });
        
        return jsonResponse(MOCK_DATA.services);
      }
      
      // Services status (mantido para compatibilidade)
      if (path === '/services/status') {
        // Atualizar dados dinâmicos
        MOCK_DATA.services.summary.last_updated = new Date().toISOString();
        MOCK_DATA.services.services.forEach(service => {
          if (service.status === 'online') {
            service.response_time = Math.floor(Math.random() * 50) + 20;
          }
        });
        
        return jsonResponse(MOCK_DATA.services);
      }
      
      // Collections
      if (path === '/collections') {
        return jsonResponse({ collections: MOCK_DATA.collections });
      }
      
      // Metrics
      if (path === '/metrics') {
        // Atualizar métricas dinâmicas
        MOCK_DATA.metrics.requests_per_minute = Math.floor(Math.random() * 500) + 200;
        MOCK_DATA.metrics.active_users = Math.floor(Math.random() * 50) + 10;
        MOCK_DATA.metrics.avg_response_time = Math.floor(Math.random() * 100) + 50;
        
        return jsonResponse(MOCK_DATA.metrics);
      }
      
      // Alerts
      if (path === '/alerts') {
        return jsonResponse({ alerts: MOCK_DATA.alerts });
      }
      
      // Storage
      if (path === '/storage/buckets') {
        return jsonResponse(MOCK_DATA.storage);
      }
      
      // Database simulation
      if (path === '/database/tables') {
        return jsonResponse({
          tables: [
            { name: 'species', rows: 1247, size_mb: 45.2 },
            { name: 'observations', rows: 8934, size_mb: 123.7 },
            { name: 'locations', rows: 456, size_mb: 12.3 },
            { name: 'measurements', rows: 15672, size_mb: 234.8 }
          ],
          total_size_mb: 416.0
        });
      }
      
      // Real-time data simulation
      if (path === '/realtime/data') {
        return jsonResponse({
          temperature: Math.random() * 10 + 20,
          salinity: Math.random() * 5 + 35,
          chlorophyll: Math.random() * 2 + 0.5,
          current_speed: Math.random() * 3,
          current_direction: Math.random() * 360,
          timestamp: new Date().toISOString()
        });
      }
      
      // API endpoints list
      if (path === '/api/endpoints') {
        return jsonResponse({
          endpoints: [
            { path: '/health', method: 'GET', description: 'Health check do Worker' },
            { path: '/services', method: 'GET', description: 'Status dos serviços (endpoint principal)' },
            { path: '/services/status', method: 'GET', description: 'Status dos serviços (compatibilidade)' },
            { path: '/collections', method: 'GET', description: 'Coleções STAC disponíveis' },
            { path: '/metrics', method: 'GET', description: 'Métricas do sistema' },
            { path: '/alerts', method: 'GET', description: 'Alertas do sistema' },
            { path: '/storage/buckets', method: 'GET', description: 'Informações de armazenamento' },
            { path: '/database/tables', method: 'GET', description: 'Tabelas da base de dados' },
            { path: '/realtime/data', method: 'GET', description: 'Dados em tempo real' }
          ]
        });
      }
      
      // 404 for unknown paths
      return jsonResponse({
        error: 'Endpoint não encontrado',
        path,
        available_endpoints: '/api/endpoints'
      }, 404);
      
    } catch (error) {
      return jsonResponse({
        error: 'Erro interno do servidor',
        message: error.message
      }, 500);
    }
  }
};
