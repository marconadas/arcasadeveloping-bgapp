export default {
    async fetch(request, env, ctx) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        return new Response(JSON.stringify({
            title: "BGAPP PyGeoAPI",
            description: "Geospatial API for BGAPP marine data processing",
            version: "1.0.0",
            links: [
                {
                    href: "https://bgapp-geoapi.majearcasa.workers.dev/",
                    rel: "self",
                    type: "application/json",
                    title: "This document"
                }
            ],
            api: {
                title: "BGAPP GeoAPI",
                version: "1.0.0"
            }
        }), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
        });
    },
};
