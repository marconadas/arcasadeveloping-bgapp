// Fix CORS Issue - Remove problematic headers
// Patch para corrigir problema CORS com bgapp-api-worker

console.log('🔧 Aplicando patch CORS...');

// Override fetch to remove problematic headers
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    if (url.includes('bgapp-api-worker.majearcasa.workers.dev')) {
        console.log('🔧 CORS Fix: Removendo headers problemáticos para', url);
        
        if (options.headers) {
            // Remove headers que causam CORS errors
            const cleanHeaders = {};
            for (const [key, value] of Object.entries(options.headers)) {
                if (!key.toLowerCase().includes('x-retry-attempt') && 
                    !key.toLowerCase().includes('x-request-id')) {
                    cleanHeaders[key] = value;
                }
            }
            options.headers = cleanHeaders;
        }
    }
    
    return originalFetch.call(this, url, options);
};

console.log('✅ CORS patch aplicado com sucesso!');
