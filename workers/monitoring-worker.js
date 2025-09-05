// CORS Security Configuration
const ALLOWED_ORIGINS = [
    'https://bgapp-admin.pages.dev',
    'https://bgapp-frontend.pages.dev',
    'https://arcasadeveloping.org',
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:8080'
];

function isOriginAllowed(origin) {
    return ALLOWED_ORIGINS.includes(origin);
}

function getCORSHeaders(origin) {
    if (isOriginAllowed(origin)) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        };
    }
    return {
        'Access-Control-Allow-Origin': 'null'
    };
}

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
