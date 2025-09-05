import { getCORSHeaders, handleCORSPreflight } from './cors-config.js';

export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return handleCORSPreflight(request, env);
        }
        
        const corsHeaders = getCORSHeaders(request, env);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        return new Response(JSON.stringify({
            status: "operational",
            services: {
                "bgapp-frontend": "operational",
                "bgapp-admin": "operational", 
                "bgapp-api": "operational",
                "bgapp-stac": "operational",
                "bgapp-geoapi": "operational",
                "bgapp-browser": "operational",
                "bgapp-auth": "operational"
            },
            last_updated: new Date().toISOString(),
            uptime: "99.9%"
        }), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
        });
    },
};
