export default {
    async fetch(request, env, ctx) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

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
