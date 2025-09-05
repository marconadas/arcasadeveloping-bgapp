/**
 * CORS Configuration - Silicon Valley Grade Security
 * Implementa whitelist dinâmica com fallback seguro
 * Inspirado em práticas do Cloudflare Workers e Netflix Edge
 */

// Domínios permitidos por ambiente
const ALLOWED_ORIGINS = {
    production: [
        'https://bgapp-admin.pages.dev',
        'https://bgapp.majearcasa.com',
        'https://admin.bgapp.majearcasa.com',
        'https://api.bgapp.majearcasa.com',
        'https://majearcasa.com',
        'https://www.majearcasa.com'
    ],
    staging: [
        'https://bgapp-staging.pages.dev',
        'https://staging.bgapp.majearcasa.com',
        'http://localhost:3000',
        'http://localhost:8085'
    ],
    development: [
        'http://localhost:3000',
        'http://localhost:8085',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8085',
        'http://127.0.0.1:5173'
    ]
};

// Headers permitidos
const ALLOWED_HEADERS = [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Correlation-ID',
    'X-API-Key',
    'Accept',
    'Origin',
    'User-Agent',
    'DNT',
    'Cache-Control',
    'X-Requested-With',
    'If-Modified-Since',
    'Range'
];

// Métodos permitidos
const ALLOWED_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
    'HEAD'
];

/**
 * Classe para gerenciar CORS com segurança
 */
class CORSManager {
    constructor(env = 'production') {
        this.environment = env;
        this.allowedOrigins = new Set(ALLOWED_ORIGINS[env] || ALLOWED_ORIGINS.production);
        this.cache = new Map(); // Cache de origens validadas
    }

    /**
     * Verifica se origem é permitida
     */
    isOriginAllowed(origin) {
        if (!origin) return false;
        
        // Check cache first (performance)
        if (this.cache.has(origin)) {
            return this.cache.get(origin);
        }
        
        // Exact match
        if (this.allowedOrigins.has(origin)) {
            this.cache.set(origin, true);
            return true;
        }
        
        // Pattern matching para subdomínios
        const allowed = Array.from(this.allowedOrigins).some(allowedOrigin => {
            // Suporte para wildcard subdomínios
            if (allowedOrigin.startsWith('*.')) {
                const domain = allowedOrigin.substring(2);
                const isMatch = origin.endsWith(domain) || origin === `https://${domain}` || origin === `http://${domain}`;
                if (isMatch) {
                    this.cache.set(origin, true);
                    return true;
                }
            }
            return false;
        });
        
        this.cache.set(origin, allowed);
        return allowed;
    }

    /**
     * Gera headers CORS apropriados
     */
    getCORSHeaders(request) {
        const origin = request.headers.get('Origin');
        const headers = {};
        
        // Se origem é permitida, usa ela. Senão, não inclui header (mais seguro que *)
        if (origin && this.isOriginAllowed(origin)) {
            headers['Access-Control-Allow-Origin'] = origin;
            headers['Access-Control-Allow-Credentials'] = 'true';
        } else if (this.environment === 'development') {
            // Em dev, pode ser mais permissivo mas com warning
            console.warn(`⚠️ Origem não autorizada em dev: ${origin}`);
            headers['Access-Control-Allow-Origin'] = origin || 'http://localhost:3000';
        }
        // Em produção, se origem não é permitida, NÃO inclui o header
        
        // Outros headers CORS
        headers['Access-Control-Allow-Methods'] = ALLOWED_METHODS.join(', ');
        headers['Access-Control-Allow-Headers'] = ALLOWED_HEADERS.join(', ');
        headers['Access-Control-Max-Age'] = '86400'; // 24 horas
        headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range';
        
        // Security headers adicionais
        headers['X-Content-Type-Options'] = 'nosniff';
        headers['X-Frame-Options'] = 'DENY';
        headers['X-XSS-Protection'] = '1; mode=block';
        headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
        
        // Content Security Policy
        if (this.environment === 'production') {
            headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
        }
        
        return headers;
    }

    /**
     * Handle preflight OPTIONS request
     */
    handlePreflight(request) {
        const headers = this.getCORSHeaders(request);
        
        return new Response(null, {
            status: 204,
            headers
        });
    }

    /**
     * Adiciona headers CORS a uma resposta existente
     */
    addCORSHeaders(response, request) {
        const corsHeaders = this.getCORSHeaders(request);
        const newHeaders = new Headers(response.headers);
        
        for (const [key, value] of Object.entries(corsHeaders)) {
            newHeaders.set(key, value);
        }
        
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    }

    /**
     * Middleware para aplicar CORS
     */
    async middleware(request, handler) {
        // Handle preflight
        if (request.method === 'OPTIONS') {
            return this.handlePreflight(request);
        }
        
        // Process request
        const response = await handler(request);
        
        // Add CORS headers to response
        return this.addCORSHeaders(response, request);
    }

    /**
     * Valida e registra tentativas de acesso
     */
    logAccess(request) {
        const origin = request.headers.get('Origin');
        const allowed = this.isOriginAllowed(origin);
        
        // Em produção, log de segurança para origens não permitidas
        if (!allowed && this.environment === 'production') {
            console.error(`🚨 CORS Security Alert: Blocked origin ${origin} at ${new Date().toISOString()}`);
            // Aqui poderia integrar com sistema de alertas (Sentry, Datadog, etc)
        }
        
        return {
            origin,
            allowed,
            timestamp: Date.now(),
            method: request.method,
            path: new URL(request.url).pathname
        };
    }

    /**
     * Adiciona nova origem dinamicamente (útil para configuração runtime)
     */
    addOrigin(origin) {
        if (!origin || typeof origin !== 'string') {
            throw new Error('Invalid origin');
        }
        
        // Validação de URL
        try {
            new URL(origin);
            this.allowedOrigins.add(origin);
            this.cache.clear(); // Limpa cache ao adicionar nova origem
            return true;
        } catch (e) {
            console.error(`Invalid origin format: ${origin}`);
            return false;
        }
    }

    /**
     * Remove origem
     */
    removeOrigin(origin) {
        const removed = this.allowedOrigins.delete(origin);
        if (removed) {
            this.cache.clear();
        }
        return removed;
    }

    /**
     * Lista origens permitidas (para debug/admin)
     */
    getAllowedOrigins() {
        return Array.from(this.allowedOrigins);
    }
}

/**
 * Factory function para criar instância baseada no ambiente
 */
export function createCORSManager(env) {
    // Detecta ambiente baseado em variáveis ou URL
    const environment = env?.ENVIRONMENT || 
                       (typeof process !== 'undefined' ? process.env.NODE_ENV : null) ||
                       'production';
    
    return new CORSManager(environment);
}

/**
 * Helper para uso direto em workers
 */
export function getCORSHeaders(request, env) {
    const manager = createCORSManager(env);
    return manager.getCORSHeaders(request);
}

/**
 * Helper para preflight
 */
export function handleCORSPreflight(request, env) {
    const manager = createCORSManager(env);
    return manager.handlePreflight(request);
}

// Export default para compatibilidade
export default {
    CORSManager,
    createCORSManager,
    getCORSHeaders,
    handleCORSPreflight,
    ALLOWED_ORIGINS,
    ALLOWED_HEADERS,
    ALLOWED_METHODS
};