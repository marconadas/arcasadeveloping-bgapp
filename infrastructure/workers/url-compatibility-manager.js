/**
 * 🔗 BGAPP URL Compatibility Manager
 * Sistema para manter compatibilidade enquanto padroniza URLs
 * 
 * ESTRATÉGIA:
 * ✅ Manter URLs antigas funcionando (redirect 301)
 * ✅ Introduzir URLs novas padronizadas
 * ✅ Logging de uso para migração gradual
 * ✅ Zero downtime na transição
 */

// Mapeamento de URLs antigas → novas (padronizadas)
const URL_MAPPING = {
  // Admin API Workers
  'bgapp-admin-api-worker.majearcasa.workers.dev': 'bgapp-admin.majearcasa.workers.dev',
  
  // STAC Workers  
  'bgapp-stac-worker.majearcasa.workers.dev': 'bgapp-stac.majearcasa.workers.dev',
  'bgapp-stac-oceanographic.majearcasa.workers.dev': 'bgapp-stac-ocean.majearcasa.workers.dev',
  
  // PyGeoAPI
  'bgapp-pygeoapi-worker.majearcasa.workers.dev': 'bgapp-geo.majearcasa.workers.dev',
  'bgapp-geoapi.majearcasa.workers.dev': 'bgapp-geo.majearcasa.workers.dev',
  
  // Outros serviços
  'bgapp-api-worker.majearcasa.workers.dev': 'bgapp-api.majearcasa.workers.dev',
  'bgapp-services-proxy.majearcasa.workers.dev': 'bgapp-proxy.majearcasa.workers.dev'
};

// URLs que devem continuar funcionando (não redirecionar)
const KEEP_WORKING = [
  'bgapp-auth.majearcasa.workers.dev',      // Já padronizado
  'bgapp-monitor.majearcasa.workers.dev',   // Já padronizado  
  'bgapp-storage.majearcasa.workers.dev',   // Já padronizado
  'bgapp-workflow.majearcasa.workers.dev'   // Já padronizado
];

/**
 * Sistema de redirecionamento compatível
 */
class URLCompatibilityManager {
  constructor() {
    this.usage_stats = new Map();
  }
  
  /**
   * Verifica se URL precisa ser redirecionada
   */
  shouldRedirect(hostname) {
    return URL_MAPPING.hasOwnProperty(hostname);
  }
  
  /**
   * Obtém URL nova padronizada
   */
  getNewURL(oldHostname, path = '', search = '') {
    const newHostname = URL_MAPPING[oldHostname];
    if (!newHostname) return null;
    
    return `https://${newHostname}${path}${search}`;
  }
  
  /**
   * Registra uso de URL antiga para estatísticas
   */
  trackOldURLUsage(hostname, path, origin) {
    const key = `${hostname}${path}`;
    if (!this.usage_stats.has(key)) {
      this.usage_stats.set(key, {
        hostname,
        path,
        count: 0,
        origins: new Set(),
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString()
      });
    }
    
    const stats = this.usage_stats.get(key);
    stats.count++;
    stats.origins.add(origin);
    stats.last_seen = new Date().toISOString();
    
    // Log para monitoramento
    console.log(JSON.stringify({
      type: 'url_compatibility_usage',
      old_url: hostname,
      new_url: URL_MAPPING[hostname],
      path,
      origin,
      usage_count: stats.count,
      timestamp: new Date().toISOString()
    }));
  }
  
  /**
   * Cria resposta de redirecionamento
   */
  createRedirectResponse(newURL, oldURL) {
    return new Response(null, {
      status: 301,
      headers: {
        'Location': newURL,
        'X-BGAPP-Redirect': 'url-standardization',
        'X-BGAPP-Old-URL': oldURL,
        'X-BGAPP-New-URL': newURL,
        'Cache-Control': 'public, max-age=31536000', // 1 ano
        'Vary': 'Accept-Encoding'
      }
    });
  }
  
  /**
   * Obtém estatísticas de uso
   */
  getUsageStats() {
    const stats = [];
    for (const [key, data] of this.usage_stats) {
      stats.push({
        ...data,
        origins: Array.from(data.origins)
      });
    }
    return stats;
  }
}

/**
 * Middleware de compatibilidade para aplicar nos workers
 */
async function handleURLCompatibility(request, originalHandler) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  const path = url.pathname;
  const search = url.search;
  const origin = request.headers.get('Origin') || 'unknown';
  
  const manager = new URLCompatibilityManager();
  
  // Verificar se precisa redirecionar
  if (manager.shouldRedirect(hostname)) {
    // Registrar uso da URL antiga
    manager.trackOldURLUsage(hostname, path, origin);
    
    // Criar URL nova
    const newURL = manager.getNewURL(hostname, path, search);
    
    // Retornar redirecionamento
    return manager.createRedirectResponse(newURL, request.url);
  }
  
  // URL já está padronizada ou deve continuar funcionando
  return originalHandler(request);
}

/**
 * Configuração de DNS/Routes para Cloudflare
 * (Para aplicar no wrangler.toml)
 */
const ROUTE_CONFIGURATIONS = {
  // Rotas antigas (manter funcionando com redirect)
  old_routes: [
    { pattern: "bgapp-admin-api-worker.majearcasa.workers.dev/*", action: "redirect" },
    { pattern: "bgapp-stac-worker.majearcasa.workers.dev/*", action: "redirect" },
    { pattern: "bgapp-pygeoapi-worker.majearcasa.workers.dev/*", action: "redirect" }
  ],
  
  // Rotas novas (padronizadas)
  new_routes: [
    { pattern: "bgapp-admin.majearcasa.workers.dev/*", worker: "admin-api-worker" },
    { pattern: "bgapp-stac.majearcasa.workers.dev/*", worker: "stac-api-worker" },
    { pattern: "bgapp-geo.majearcasa.workers.dev/*", worker: "pygeoapi-worker" }
  ]
};

/**
 * Gerador de configuração wrangler.toml
 */
function generateWranglerConfig() {
  let config = `# 🔗 BGAPP URL Compatibility Configuration
# Gerado automaticamente - não editar manualmente

`;

  // Adicionar rotas novas
  ROUTE_CONFIGURATIONS.new_routes.forEach(route => {
    config += `[[routes]]
pattern = "${route.pattern}"
custom_domain = true
# Worker: ${route.worker}

`;
  });

  return config;
}

/**
 * Sistema de monitoramento de migração
 */
class MigrationMonitor {
  constructor() {
    this.metrics = {
      old_url_usage: 0,
      new_url_usage: 0,
      redirects_served: 0,
      migration_percentage: 0
    };
  }
  
  recordOldURLUsage() {
    this.metrics.old_url_usage++;
    this.updateMigrationPercentage();
  }
  
  recordNewURLUsage() {
    this.metrics.new_url_usage++;
    this.updateMigrationPercentage();
  }
  
  recordRedirect() {
    this.metrics.redirects_served++;
  }
  
  updateMigrationPercentage() {
    const total = this.metrics.old_url_usage + this.metrics.new_url_usage;
    if (total > 0) {
      this.metrics.migration_percentage = Math.round(
        (this.metrics.new_url_usage / total) * 100
      );
    }
  }
  
  getReport() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      status: this.metrics.migration_percentage > 80 ? 'ready_to_complete' : 'in_progress'
    };
  }
}

// Exportar para uso nos workers
export { 
  URLCompatibilityManager,
  handleURLCompatibility,
  URL_MAPPING,
  ROUTE_CONFIGURATIONS,
  generateWranglerConfig,
  MigrationMonitor
};
