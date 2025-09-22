// Lista de origens autorizadas - alinhada com admin-api-worker.js
const ALLOWED_ORIGINS = [
    'https://bgapp-frontend.pages.dev',
    'https://bgapp-admin.pages.dev',
    'https://bgapp.arcasadeveloping.org',
    'https://arcasadeveloping.org',
    'https://main.bgapp-arcasadeveloping.pages.dev',
    'http://localhost:3000',
    'http://localhost:8000',
    'http://localhost:8081',
    'http://localhost:8085'
];

function getSecureCORSHeaders(origin) {
    const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
                     origin?.includes('localhost') ||
                     origin?.includes('.pages.dev') ||
                     origin?.includes('.workers.dev');

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With, X-BGAPP-Source, X-Client-Version, X-Client-Platform, X-Request-ID, usecache',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type, X-BGAPP-Response-Time',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Vary': 'Origin',
        'X-BGAPP-Security': 'enhanced-v2.1.0'
    };
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const origin = request.headers.get('Origin');
        const startTime = Date.now();

        // Obter headers CORS seguros baseados na origem
        const corsHeaders = getSecureCORSHeaders(origin);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        // Proxy to the actual API (you'll need to deploy this separately)
        const apiUrl = 'https://bgapp-api-backend.majearcasa.workers.dev';

        try {
            // Usar novo Headers object para evitar conflitos
            const proxyHeaders = new Headers(request.headers);

            const response = await fetch(apiUrl + url.pathname + url.search, {
                method: request.method,
                headers: proxyHeaders,
                body: request.body,
            });

            const data = await response.text();

            return new Response(data, {
                status: response.status,
                headers: {
                    ...corsHeaders,
                    'X-BGAPP-Response-Time': `${Date.now() - startTime}ms`
                },
            });
        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'API temporarily unavailable',
                message: 'The BGAPP API is currently being deployed. Please try again in a few minutes.',
                timestamp: new Date().toISOString()
            }), {
                status: 503,
                headers: {
                    ...corsHeaders,
                    'X-BGAPP-Response-Time': `${Date.now() - startTime}ms`
                },
            });
        }
    },
};
