export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        // Proxy to the actual API (you'll need to deploy this separately)
        const apiUrl = 'https://bgapp-api-backend.majearcasa.workers.dev';
        
        try {
            const response = await fetch(apiUrl + url.pathname + url.search, {
                method: request.method,
                headers: request.headers,
                body: request.body,
            });
            
            const data = await response.text();
            
            return new Response(data, {
                status: response.status,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
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
                    'Content-Type': 'application/json',
                },
            });
        }
    },
};
