/**
 * GFW Proxy Worker - Alternative approach to handle GFW API calls
 * This worker acts as a proxy to handle SSL/TLS issues
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
    
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Only allow specific paths
    if (!url.pathname.startsWith('/gfw/')) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    try {
      // Extract the actual GFW path
      const gfwPath = url.pathname.replace('/gfw/', '');
      const gfwUrl = `https://api.globalfishingwatch.org/v3/${gfwPath}${url.search}`;
      
      // Get token from environment
      const token = env.GFW_API_TOKEN;
      if (!token) {
        return new Response(JSON.stringify({ error: 'GFW token not configured' }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Try multiple approaches to connect
      let response = null;
      let lastError = null;
      
      // Approach 1: Direct HTTPS with specific options
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        response = await fetch(gfwUrl, {
          method: request.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'BGAPP-Proxy/1.0'
          },
          body: request.method !== 'GET' ? await request.text() : undefined,
          signal: controller.signal,
          // Cloudflare-specific options
          cf: {
            cacheEverything: false,
            scrapeShield: false,
            apps: false,
            minify: false,
            mirage: false,
            polish: false
          }
        });
        
        clearTimeout(timeoutId);
      } catch (e) {
        lastError = e;
        console.error('Direct fetch failed:', e.message);
        
        // Approach 2: Use a public CORS proxy as fallback
        try {
          const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(gfwUrl)}`;
          response = await fetch(corsProxyUrl, {
            method: request.method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
        } catch (e2) {
          lastError = e2;
          console.error('CORS proxy failed:', e2.message);
        }
      }
      
      // If we got a response, return it
      if (response) {
        const data = await response.text();
        return new Response(data, {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': response.headers.get('Content-Type') || 'application/json',
            'X-Proxy-Status': 'success'
          }
        });
      }
      
      // If all approaches failed
      return new Response(JSON.stringify({
        error: 'Failed to connect to GFW API',
        message: lastError?.message || 'Unknown error',
        url: gfwUrl,
        approaches_tried: ['direct', 'cors-proxy']
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Proxy error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
