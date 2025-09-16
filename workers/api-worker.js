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
      
      // 🎣 Global Fishing Watch - Status
      if (path === '/api/config/gfw-status') {
        return jsonResponse({
          status: 'active',
          integration: 'global_fishing_watch',
          version: '1.0.0',
          token_configured: Boolean(env && env.GFW_API_TOKEN),
          features: [
            'fishing_activity',
            'heatmaps',
            'vessel_tracking',
            'alerts',
            'protected_areas'
          ],
          timestamp: new Date().toISOString()
        });
      }

      // 🎣 Global Fishing Watch - Secure Token (basic protection)
      if (path === '/api/config/gfw-token') {
        // Básica proteção: permitir apenas se origem conhecida ou header presente
        const origin = request.headers.get('Origin') || '';
        const allowedOrigins = (env && env.ALLOWED_ORIGINS) ? env.ALLOWED_ORIGINS.split(',') : [];
        const adminKeyHeader = request.headers.get('x-admin-key');

        const originAllowed = allowedOrigins.length === 0 || allowedOrigins.some(o => origin.includes(o.trim()));
        const adminKeyAllowed = adminKeyHeader && env && env.ADMIN_ACCESS_KEY && adminKeyHeader === env.ADMIN_ACCESS_KEY;

        if (!originAllowed && !adminKeyAllowed) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        return jsonResponse({
          token: env && env.GFW_API_TOKEN ? env.GFW_API_TOKEN : null,
          type: 'Bearer',
          expires: '2033-12-31'
        });
      }

      // 🎣 Global Fishing Watch - Settings
      if (path === '/api/config/gfw-settings') {
        return jsonResponse({
          api: {
            baseUrl: 'https://api.globalfishingwatch.org/v3',
            tilesUrl: 'https://tiles.globalfishingwatch.org'
          },
          datasets: {
            fishing: 'public-global-fishing-activity:v20231026',
            vessels: 'public-global-all-vessels:v20231026',
            encounters: 'public-global-encounters:v20231026',
            portVisits: 'public-global-port-visits:v20231026'
          },
          defaults: {
            zoom: 5,
            timeRange: 30,
            vesselTypes: ['fishing', 'carrier', 'support'],
            confidenceLevel: 3
          }
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
      
      // Services status (compatibilidade) + alias
      if (path === '/services/status' || path === '/api/services/status') {
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
      
      // Metrics + alias
      if (path === '/metrics' || path === '/api/metrics') {
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
      
      // Real-time data (aggregated from Copernicus JSON produced by our pipeline) + alias
      if (path === '/realtime/data' || path === '/api/realtime/data') {
        try {
          const frontendBase = (env && env.FRONTEND_BASE) || 'https://bgapp-frontend.pages.dev';
          const sourceUrl = `${frontendBase}/copernicus_authenticated_angola.json`;

          const upstream = await fetch(sourceUrl, { headers: { 'Accept': 'application/json' } });
          if (!upstream.ok) {
            return jsonResponse({
              error: 'Upstream data unavailable',
              source: sourceUrl,
              status: upstream.status
            }, 502);
          }

          const raw = await upstream.json();

          // Normalize entries from possible schemas
          let entries = [];
          if (Array.isArray(raw?.real_time_data)) {
            entries = raw.real_time_data;
          } else if (Array.isArray(raw?.locations)) {
            entries = raw.locations;
          } else if (Array.isArray(raw?.data)) {
            entries = raw.data;
          }

          const toNumbers = (arr, keyCandidates) => {
            const values = [];
            for (const item of arr) {
              for (const key of keyCandidates) {
                if (key in item && Number.isFinite(Number(item[key]))) {
                  values.push(Number(item[key]));
                  break;
                }
              }
            }
            return values;
          };

          const mean = (vals) => vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

          const sstVals = toNumbers(entries, ['sst', 'sea_surface_temperature', 'temperature']);
          const chlVals = toNumbers(entries, ['chlorophyll', 'chlorophyll_a']);
          const salVals = toNumbers(entries, ['salinity', 'so']);

          // Derive current speed if u/v components present
          const speeds = [];
          for (const item of entries) {
            const u = Number(item.current_u);
            const v = Number(item.current_v);
            if (Number.isFinite(u) && Number.isFinite(v)) {
              speeds.push(Math.sqrt(u * u + v * v));
            }
          }

          const response = {
            temperature: mean(sstVals),
            salinity: mean(salVals),
            chlorophyll: mean(chlVals),
            current_speed: mean(speeds),
            timestamp: new Date().toISOString(),
            data_points: entries.length,
            source: 'copernicus_authenticated_angola.json'
          };

          return jsonResponse(response);
        } catch (err) {
          return jsonResponse({ error: 'Aggregation error', message: err?.message || String(err) }, 500);
        }
      }
      
      // API endpoints list
      if (path === '/api/endpoints' || path === '/endpoints') {
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
            { path: '/realtime/data', method: 'GET', description: 'Dados em tempo real' },
            { path: '/api/gfw/vessel-presence', method: 'GET', description: 'Resumo de presença de embarcações (GFW v3)' }
          ]
        });
      }

      // GFW v3: Vessel Presence summary for Angola EEZ
      if (path === '/api/gfw/vessel-presence') {
        try {
          const token = env && env.GFW_API_TOKEN;
          if (!token) {
            return jsonResponse({ error: 'GFW token not configured' }, 503);
          }

          // Attempt to fetch from GFW API with various SSL/TLS configurations
          const baseUrl = 'https://api.globalfishingwatch.org/v3';
          const end = new Date();
          const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
          const fmt = (d) => d.toISOString().slice(0, 10);
          
          // Angola EEZ bbox
          const bbox = '-12,-18,17.5,-4.2';
          
          const params = new URLSearchParams({
            dataset: 'public-global-fishing-activity:v20231026',
            'start-date': fmt(start),
            'end-date': fmt(end),
            bbox,
            format: 'json'
          });

          const url = `${baseUrl}/4wings/aggregate?${params.toString()}`;
          
          // Try different fetch configurations
          let response = null;
          let fetchError = null;
          
          // Configuration 1: Try using our proxy worker if available
          const proxyUrl = env.GFW_PROXY_URL || 'https://bgapp-gfw-proxy.majearcasa.workers.dev';
          try {
            const proxyEndpoint = `${proxyUrl}/gfw/4wings/aggregate?${params.toString()}`;
            response = await fetch(proxyEndpoint, {
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            });
            console.log('Proxy fetch attempted');
          } catch (e1) {
            fetchError = e1;
            console.log('Proxy fetch failed:', e1.message);
            
            // Configuration 2: Try with different headers
            try {
              response = await fetch(url, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (compatible; Cloudflare-Worker/1.0)',
                  'X-Requested-With': 'XMLHttpRequest'
                }
              });
            } catch (e2) {
              fetchError = e2;
              console.log('Alternative fetch failed:', e2.message);
              
              // Configuration 3: Try HTTP/1.1 instead of HTTP/2
              try {
                response = await fetch(url.replace('https://', 'http://'), {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                  }
                });
              } catch (e3) {
                fetchError = e3;
                console.log('HTTP fetch failed:', e3.message);
              }
            }
          }
          
          // If we got a response, try to process it
          if (response && response.ok) {
            try {
              const data = await response.json();
              let vesselCount = 0;
              let totalHours = 0;
              const features = Array.isArray(data?.features) ? data.features : [];
              
              for (const f of features) {
                const p = f.properties || {};
                vesselCount += Number(p.vessel_count || 0);
                totalHours += Number(p.hours || 0);
              }
              
              return jsonResponse({
                vessel_count: vesselCount,
                total_hours: Math.round(totalHours * 10) / 10,
                window_hours: 24,
                updated_at: new Date().toISOString(),
                data_source: 'gfw_api',
                api_status: 'connected'
              });
            } catch (parseError) {
              console.error('Failed to parse GFW response:', parseError);
            }
          }
          
          // Try to fetch cached data from GitHub Pages
          try {
            const cacheUrl = `${env.FRONTEND_BASE || 'https://bgapp-frontend.pages.dev'}/data/gfw-angola-vessels-cache.json`;
            const cacheResponse = await fetch(cacheUrl);
            if (cacheResponse.ok) {
              const cacheData = await cacheResponse.json();
              const gfwData = cacheData.data;
              
              if (gfwData && !gfwData.error) {
                let vesselCount = 0;
                let totalHours = 0;
                const features = Array.isArray(gfwData?.features) ? gfwData.features : [];
                
                for (const f of features) {
                  const p = f.properties || {};
                  vesselCount += Number(p.vessel_count || 0);
                  totalHours += Number(p.hours || 0);
                }
                
                if (vesselCount > 0) {
                  return jsonResponse({
                    vessel_count: vesselCount,
                    total_hours: Math.round(totalHours * 10) / 10,
                    window_hours: 24,
                    updated_at: cacheData.last_updated || new Date().toISOString(),
                    data_source: 'gfw_cache',
                    cache_age_hours: Math.round((Date.now() - new Date(cacheData.last_updated).getTime()) / (1000 * 60 * 60)),
                    api_status: 'using_cache'
                  });
                }
              }
            }
          } catch (cacheError) {
            console.log('Cache fetch failed:', cacheError);
          }
          
          // If all API attempts failed and no cache, return simulated data
          const hour = new Date().getHours();
          const dayOfWeek = new Date().getDay();
          let baseCount = 25;
          
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            baseCount += 10;
          }
          
          if ((hour >= 4 && hour <= 8) || (hour >= 16 && hour <= 20)) {
            baseCount += 15;
          }
          
          const vesselCount = baseCount + Math.floor(Math.random() * 10) - 5;
          const avgHoursPerVessel = 8 + Math.random() * 4;
          const totalHours = Math.round(vesselCount * avgHoursPerVessel * 10) / 10;
          
          return jsonResponse({
            vessel_count: Math.max(10, vesselCount),
            total_hours: totalHours,
            window_hours: 24,
            updated_at: new Date().toISOString(),
            data_source: 'simulated_realistic',
            api_status: response ? `error_${response.status}` : 'connection_failed',
            error_type: fetchError ? fetchError.message : 'unknown',
            note: 'Using simulated data due to API connection issues'
          });
          
        } catch (e) {
          console.error('GFW Error:', e);
          return jsonResponse({
            vessel_count: 20,
            total_hours: 160,
            window_hours: 24,
            updated_at: new Date().toISOString(),
            data_source: 'fallback',
            error: e.message
          });
        }
      }
      
      // GFW Debug endpoint
      if (path === '/api/gfw/debug') {
        const token = env && env.GFW_API_TOKEN;
        return jsonResponse({
          token_configured: !!token,
          token_length: token ? token.length : 0,
          token_preview: token ? `${token.substring(0, 20)}...${token.substring(token.length - 20)}` : null,
          env_keys: Object.keys(env || {}),
          timestamp: new Date().toISOString()
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
