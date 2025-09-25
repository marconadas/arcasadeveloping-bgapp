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

        const html = `
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BGAPP STAC Browser - MareDatum</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; }
        .info { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .endpoint { background: #f8f9fa; padding: 10px; border-left: 4px solid #007bff; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌊 BGAPP STAC Browser</h1>
        <p><strong>MareDatum Consultoria e Gestão de Projectos Unipessoal LDA</strong></p>
        
        <div class="info">
            <h3>📊 STAC Catalog Access</h3>
            <p>Access the SpatioTemporal Asset Catalog for BGAPP marine data:</p>
            <div class="endpoint">
                <strong>STAC API:</strong> <a href="https://bgapp-stac.majearcasa.workers.dev/">https://bgapp-stac.majearcasa.workers.dev/</a>
            </div>
        </div>
        
        <div class="info">
            <h3>🔗 Related Services</h3>
            <div class="endpoint">
                <strong>Main Application:</strong> <a href="https://bgapp-frontend.pages.dev/">https://bgapp-frontend.pages.dev/</a>
            </div>
            <div class="endpoint">
                <strong>Admin Dashboard:</strong> <a href="https://bgapp-admin.pages.dev/">https://bgapp-admin.pages.dev/</a>
            </div>
            <div class="endpoint">
                <strong>API Documentation:</strong> <a href="https://bgapp-api.majearcasa.workers.dev/docs">https://bgapp-api.majearcasa.workers.dev/docs</a>
            </div>
        </div>
        
        <div class="info">
            <h3>📞 Contact</h3>
            <p>For technical support or questions about BGAPP:</p>
            <p>Email: info@maredatum.pt | Website: https://maredatum.pt</p>
        </div>
    </div>
</body>
</html>`;

        return new Response(html, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/html',
            },
        });
    },
};
