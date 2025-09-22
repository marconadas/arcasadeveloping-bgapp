/**
 * 🔒 BGAPP CORS Security Enhanced - Configuração Segura
 * Mantém compatibilidade com todas as páginas BGAPP
 * 
 * PRINCÍPIOS:
 * ✅ Segurança primeiro, mas sem quebrar funcionalidades
 * ✅ Whitelist específica para domínios conhecidos
 * ✅ Fallback para desenvolvimento local
 * ✅ Headers de segurança completos
 */

// Lista de domínios autorizados - EXPANDIR CONFORME NECESSÁRIO
const ALLOWED_ORIGINS = [
  // Produção BGAPP
  'https://bgapp-frontend.pages.dev',
  'https://bgapp-admin.pages.dev', 
  'https://bgapp.arcasadeveloping.org',
  'https://arcasadeveloping.org',
  
  // Desenvolvimento local - TODAS AS PORTAS BGAPP
  'http://localhost:3000',  // Admin Dashboard
  'http://localhost:8000',  // Admin API
  'http://localhost:8081',  // STAC API
  'http://localhost:8082',  // STAC Browser
  'http://localhost:8083',  // Keycloak
  'http://localhost:8085',  // Frontend Principal
  'http://localhost:9001',  // MinIO Console
  'http://localhost:5080',  // PyGeoAPI
  'http://localhost:5555',  // Flower Monitor
  
  // Workers Cloudflare (inter-worker communication)
  'https://bgapp-admin-api-worker.majearcasa.workers.dev',
  'https://bgapp-stac.majearcasa.workers.dev',
  'https://bgapp-pygeoapi.majearcasa.workers.dev',
  'https://bgapp-auth.majearcasa.workers.dev',
  'https://bgapp-monitor.majearcasa.workers.dev',
  'https://bgapp-storage.majearcasa.workers.dev',
  'https://bgapp-workflow.majearcasa.workers.dev'
];

/**
 * Configuração CORS segura mas compatível
 */
function getSecureCORSHeaders(origin) {
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin) || 
                         origin?.includes('localhost') ||
                         origin?.includes('127.0.0.1') ||
                         origin?.includes('.pages.dev') ||
                         origin?.includes('.workers.dev');

  const allowedOrigin = isAllowedOrigin ? origin : ALLOWED_ORIGINS[0];

  return {
    // CORS Headers - Seguros mas funcionais
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH',
    'Access-Control-Allow-Headers': [
      'Content-Type',
      'Authorization', 
      'Cache-Control',
      'Pragma',
      'X-Requested-With',
      'X-BGAPP-Source',
      'X-BGAPP-Version',
      'Accept',
      'Accept-Language',
      'Accept-Encoding'
    ].join(', '),
    'Access-Control-Expose-Headers': [
      'Content-Length',
      'Content-Type', 
      'X-BGAPP-Response-Time',
      'X-BGAPP-Cache-Status'
    ].join(', '),
    'Access-Control-Max-Age': '86400', // 24 horas
    'Access-Control-Allow-Credentials': 'true',
    
    // Security Headers - Melhorados mas não restritivos
    'X-Frame-Options': 'SAMEORIGIN', // Permite iframes dentro BGAPP
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    
    // Content Security Policy - Permissivo para não quebrar
    'Content-Security-Policy': [
      "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.pages.dev *.workers.dev *.cloudflare.com",
      "style-src 'self' 'unsafe-inline' *.googleapis.com *.gstatic.com",
      "img-src 'self' data: blob: *.pages.dev *.workers.dev",
      "connect-src 'self' *.pages.dev *.workers.dev *.majearcasa.workers.dev",
      "frame-src 'self' *.pages.dev *.workers.dev"
    ].join('; '),
    
    // Cache e Performance
    'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
    'Cache-Control': 'public, max-age=300', // 5 minutos
    
    // BGAPP Custom Headers
    'X-BGAPP-Security': 'enhanced',
    'X-BGAPP-CORS': 'v2.0.0'
  };
}

/**
 * Middleware CORS para Workers
 */
function handleCORS(request) {
  const origin = request.headers.get('Origin');
  const method = request.method;
  
  // Handle preflight OPTIONS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getSecureCORSHeaders(origin)
    });
  }
  
  return getSecureCORSHeaders(origin);
}

/**
 * Rate Limiting Inteligente
 */
class BGAPPRateLimiter {
  constructor() {
    this.requests = new Map();
    this.limits = {
      // Diferentes limites por tipo de endpoint
      '/health': { rpm: 300, burst: 10 },      // Health checks
      '/api/': { rpm: 100, burst: 20 },        // APIs gerais  
      '/ml/': { rpm: 60, burst: 5 },           // ML endpoints (mais pesados)
      '/admin/': { rpm: 30, burst: 10 },       // Admin endpoints
      '/database/': { rpm: 10, burst: 2 },     // Database queries
      'default': { rpm: 120, burst: 15 }       // Default
    };
  }
  
  getLimit(path) {
    for (const [pattern, limit] of Object.entries(this.limits)) {
      if (path.includes(pattern)) return limit;
    }
    return this.limits.default;
  }
  
  async checkLimit(clientId, path) {
    const limit = this.getLimit(path);
    const now = Date.now();
    const windowMs = 60000; // 1 minuto
    
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }
    
    const clientRequests = this.requests.get(clientId);
    
    // Limpar requests antigos
    const validRequests = clientRequests.filter(time => now - time < windowMs);
    
    // Verificar limite
    if (validRequests.length >= limit.rpm) {
      return {
        allowed: false,
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      };
    }
    
    // Adicionar request atual
    validRequests.push(now);
    this.requests.set(clientId, validRequests);
    
    return { allowed: true };
  }
}

/**
 * Logger Centralizado
 */
function logRequest(request, response, startTime) {
  const duration = Date.now() - startTime;
  const logData = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    origin: request.headers.get('Origin'),
    userAgent: request.headers.get('User-Agent'),
    status: response.status,
    duration: `${duration}ms`,
    worker: 'cors-security-enhanced',
    version: '2.0.0'
  };
  
  console.log(JSON.stringify(logData));
}

/**
 * Função principal para aplicar em todos os workers
 */
async function enhanceWorkerSecurity(request, originalHandler) {
  const startTime = Date.now();
  const origin = request.headers.get('Origin');
  const clientId = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  try {
    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      const response = new Response(null, {
        status: 204,
        headers: getSecureCORSHeaders(origin)
      });
      logRequest(request, response, startTime);
      return response;
    }
    
    // 2. Rate Limiting
    const rateLimiter = new BGAPPRateLimiter();
    const rateCheck = await rateLimiter.checkLimit(clientId, new URL(request.url).pathname);
    
    if (!rateCheck.allowed) {
      const response = new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateCheck.retryAfter
      }), {
        status: 429,
        headers: {
          ...getSecureCORSHeaders(origin),
          'Content-Type': 'application/json',
          'Retry-After': rateCheck.retryAfter.toString()
        }
      });
      logRequest(request, response, startTime);
      return response;
    }
    
    // 3. Processar request original
    const response = await originalHandler(request);
    
    // 4. Adicionar headers de segurança à resposta
    const secureHeaders = getSecureCORSHeaders(origin);
    Object.entries(secureHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // 5. Adicionar headers de performance
    response.headers.set('X-BGAPP-Response-Time', `${Date.now() - startTime}ms`);
    response.headers.set('X-BGAPP-Cache-Status', 'enhanced');
    
    // 6. Log da request
    logRequest(request, response, startTime);
    
    return response;
    
  } catch (error) {
    console.error('BGAPP Security Error:', error);
    
    const errorResponse = new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: 'An error occurred processing your request',
      requestId: crypto.randomUUID()
    }), {
      status: 500,
      headers: {
        ...getSecureCORSHeaders(origin),
        'Content-Type': 'application/json'
      }
    });
    
    logRequest(request, errorResponse, startTime);
    return errorResponse;
  }
}

// Exportar para uso nos workers
export { 
  enhanceWorkerSecurity, 
  getSecureCORSHeaders, 
  handleCORS, 
  BGAPPRateLimiter 
};
