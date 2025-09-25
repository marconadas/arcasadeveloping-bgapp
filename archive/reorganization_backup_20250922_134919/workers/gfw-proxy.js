/**
 * GFW Proxy Worker - Handles GFW API calls with real data only
 * This worker acts as a proxy to handle CORS and SSL/TLS issues
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Enhanced CORS headers for better browser compatibility
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With, X-Client-Version, X-Client-Platform, X-Request-ID',
      'Access-Control-Allow-Credentials': 'false',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
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

      // Get token from environment early
      const token = env.GFW_API_TOKEN;
      console.log('Debug: Token available:', !!token, 'Length:', token?.length || 0);

      // If no token, return error instead of mock data
      if (!token) {
        console.log('No GFW token available');
        return new Response(JSON.stringify({
          error: 'GFW API token not configured',
          message: 'Real vessel data requires valid GFW API token'
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Determine the correct API version based on endpoint
      let apiVersion = 'v3';
      if (gfwPath.startsWith('4wings/') || gfwPath.includes('4wings')) {
        apiVersion = 'v2';
      }

      // Handle 4wings report endpoint specially
      if (gfwPath.startsWith('4wings/report/ais-vessel-presence')) {
        // For 4wings reports, we need to transform the request
        const reportPath = '4wings/report';
        const newUrl = `https://gateway.api.globalfishingwatch.org/v2/${reportPath}?${url.searchParams.toString()}`;
        console.log('4wings report request:', newUrl);

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(newUrl, {
            method: request.method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'BGAPP-Proxy/1.0'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          const data = await response.text();
          console.log('4wings report response status:', response.status);
          console.log('4wings report response preview:', data.substring(0, 200));

          return new Response(data, {
            status: response.status,
            headers: {
              ...corsHeaders,
              'Content-Type': response.headers.get('Content-Type') || 'application/json',
              'X-Proxy-Status': 'success',
              'X-GFW-API-Version': 'v2'
            }
          });
        } catch (e) {
          console.error('4wings report failed:', e.message);
          return new Response(JSON.stringify({
            error: 'Failed to get 4wings report',
            message: e.message
          }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // For vessels endpoint, redirect to vessels/search with proper parameters
      if (gfwPath === 'vessels') {
        // For the vessels endpoint, use vessels/search instead with proper parameters
        const searchPath = 'vessels/search';

        if (!url.searchParams.has('datasets')) {
          url.searchParams.set('datasets', 'public-global-vessels:v3.0');
        }
        if (!url.searchParams.has('where') && !url.searchParams.has('query')) {
          // Search vessels by Angola flag
          url.searchParams.set('where', 'flag = "AO"');
        }
        if (!url.searchParams.has('limit')) {
          url.searchParams.set('limit', '50');
        }

        // Update the path to use vessels/search
        const newUrl = `https://gateway.api.globalfishingwatch.org/${apiVersion}/${searchPath}${url.search}`;
        console.log('Redirecting vessels to search:', newUrl);

        // Update gfwUrl for this specific case
        const gfwUrl = newUrl;

        // Make the request directly here for vessels endpoint
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(gfwUrl, {
            method: request.method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'BGAPP-Proxy/1.0'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          const data = await response.text();
          console.log('Vessels search response status:', response.status);
          console.log('Vessels search response preview:', data.substring(0, 200));

          return new Response(data, {
            status: response.status,
            headers: {
              ...corsHeaders,
              'Content-Type': response.headers.get('Content-Type') || 'application/json',
              'X-Proxy-Status': 'success',
              'X-GFW-API-Version': apiVersion
            }
          });
        } catch (e) {
          console.error('Vessels search failed:', e.message);
          return new Response(JSON.stringify({
            error: 'Failed to search vessels',
            message: e.message
          }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Update the search parameters in the URL
      const updatedSearch = url.search;
      const gfwUrl = `https://gateway.api.globalfishingwatch.org/${apiVersion}/${gfwPath}${updatedSearch}`;

      console.log('GFW API call:', gfwUrl);

      // Try multiple approaches to connect
      let response = null;
      let lastError = null;

      // Approach 1: Direct HTTPS with specific options
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

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
        console.log('GFW API response status:', response.status);
        console.log('GFW API response preview:', data.substring(0, 200));

        return new Response(data, {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': response.headers.get('Content-Type') || 'application/json',
            'X-Proxy-Status': 'success',
            'X-GFW-API-Version': apiVersion
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
      console.error('Proxy error:', error);
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