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
            realm: "bgapp",
            public_key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
            token_service: "https://bgapp-auth.majearcasa.workers.dev/auth/realms/bgapp/protocol/openid-connect",
            account_service: "https://bgapp-auth.majearcasa.workers.dev/auth/realms/bgapp/account",
            tokens_not_before: 0,
            "verify-token-audience": true,
            use-resource-role-mappings: true,
            "confidential-port": 0,
            policy_enforcer: {}
        }), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
        });
    },
};
