/**
 * 🛡️ BGAPP Services Proxy Worker
 * Worker proxy para serviços externos que não existem ainda
 * Simula respostas para manter o dashboard funcionando
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Version, X-Client-Platform, X-Request-ID',
  'Content-Type': 'application/json'
};

// 🎭 Mock data para serviços externos
const MOCK_RESPONSES = {
  // Keycloak Admin
  'bgapp-auth.pages.dev': {
    '/admin/realms': {
      status: 'success',
      realms: [
        { id: 'bgapp', name: 'BGAPP Marine Angola', enabled: true, users: 12 }
      ]
    }
  },
  
  // Flower Monitor
  'bgapp-monitor.pages.dev': {
    '/api/workers': {
      status: 'success',
      workers: {
        active: 3,
        available: 3,
        busy: 0,
        total_tasks: 145
      }
    },
    '/api/tasks': {
      status: 'success',
      tasks: {
        active: 0,
        completed: 145,
        failed: 2,
        retried: 1
      }
    }
  },
  
  // MinIO Storage
  'bgapp-storage.pages.dev': {
    '/minio/admin/v3/list-buckets': {
      status: 'success',
      buckets: [
        { name: 'bgapp-data', creation_date: '2024-01-01T00:00:00Z' },
        { name: 'bgapp-backups', creation_date: '2024-01-01T00:00:00Z' },
        { name: 'bgapp-cache', creation_date: '2024-01-01T00:00:00Z' }
      ]
    }
  },
  
  // PyGeoAPI
  'bgapp-pygeoapi.pages.dev': {
    '/collections': {
      collections: [
        {
          id: 'zee_angola',
          title: 'ZEE Angola',
          description: 'Zona Econômica Exclusiva de Angola',
          links: []
        },
        {
          id: 'marine_data',
          title: 'Dados Marinhos',
          description: 'Dados oceanográficos de Angola',
          links: []
        }
      ]
    }
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const pathname = url.pathname;
    
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }
    
    try {
      // Detectar qual serviço está sendo chamado baseado no hostname
      let targetService = null;
      
      if (hostname.includes('bgapp-auth') || url.searchParams.get('service') === 'auth') {
        targetService = 'bgapp-auth.pages.dev';
      } else if (hostname.includes('bgapp-monitor') || url.searchParams.get('service') === 'monitor') {
        targetService = 'bgapp-monitor.pages.dev';
      } else if (hostname.includes('bgapp-storage') || url.searchParams.get('service') === 'storage') {
        targetService = 'bgapp-storage.pages.dev';
      } else if (hostname.includes('bgapp-pygeoapi') || url.searchParams.get('service') === 'pygeoapi') {
        targetService = 'bgapp-pygeoapi.pages.dev';
      }
      
      // Se não conseguiu detectar pelo hostname, tenta detectar pela URL
      if (!targetService) {
        if (pathname.includes('/admin/realms')) {
          targetService = 'bgapp-auth.pages.dev';
        } else if (pathname.includes('/api/workers') || pathname.includes('/api/tasks')) {
          targetService = 'bgapp-monitor.pages.dev';
        } else if (pathname.includes('/minio/')) {
          targetService = 'bgapp-storage.pages.dev';
        } else if (pathname.includes('/collections')) {
          targetService = 'bgapp-pygeoapi.pages.dev';
        }
      }
      
      // Buscar resposta mock
      if (targetService && MOCK_RESPONSES[targetService] && MOCK_RESPONSES[targetService][pathname]) {
        return new Response(JSON.stringify(MOCK_RESPONSES[targetService][pathname]), {
          headers: CORS_HEADERS
        });
      }
      
      // Health check específico por serviço
      if (pathname === '/health' || pathname === '/') {
        let serviceName = 'Unknown Service';
        if (targetService) {
          if (targetService.includes('auth')) serviceName = 'BGAPP Auth Service';
          else if (targetService.includes('monitor')) serviceName = 'BGAPP Monitor Service';
          else if (targetService.includes('storage')) serviceName = 'BGAPP Storage Service';
          else if (targetService.includes('pygeoapi')) serviceName = 'BGAPP PyGeoAPI Service';
        }
        
        return new Response(JSON.stringify({
          status: 'healthy',
          service: serviceName,
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          proxy: true
        }), { headers: CORS_HEADERS });
      }
      
      // Default response para endpoints não mapeados
      return new Response(JSON.stringify({
        status: 'success',
        message: 'Service proxy active',
        service: targetService || 'unknown',
        path: pathname,
        timestamp: new Date().toISOString(),
        proxy: true
      }), { headers: CORS_HEADERS });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        service: 'bgapp-services-proxy',
        timestamp: new Date().toISOString()
      }), { status: 500, headers: CORS_HEADERS });
    }
  }
};
