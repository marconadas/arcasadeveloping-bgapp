// BGAPP CORS Proxy Worker
// Resolve todos os problemas CORS para bgapp-api-worker

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    try {
      // Extract path from request
      const url = new URL(request.url);
      const targetPath = url.pathname.replace('/proxy', '');
      
      // Build target URL
      const targetUrl = `https://bgapp-api-worker.majearcasa.workers.dev${targetPath}${url.search}`;
      
      // Clean headers - remove problematic ones
      const cleanHeaders = {};
      for (const [key, value] of request.headers.entries()) {
        if (!key.toLowerCase().includes('x-retry-attempt') && 
            !key.toLowerCase().includes('x-request-id') &&
            !key.toLowerCase().startsWith('cf-') &&
            key.toLowerCase() !== 'host') {
          cleanHeaders[key] = value;
        }
      }

      // Forward request
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: cleanHeaders,
        body: request.method !== 'GET' ? request.body : null
      });

      // Create response with CORS headers
      const corsResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });

      return corsResponse;

    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Proxy Error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
