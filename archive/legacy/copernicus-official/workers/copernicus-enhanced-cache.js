/**
 * Copernicus Enhanced Cache Worker
 * Worker otimizado com cache inteligente para APIs Copernicus
 */

// Configuração de cache
const CACHE_CONFIG = {
  // TTL por tipo de dados
  TTL: {
    opensearch: 300,      // 5 minutos (dados mudam pouco)
    odata: 600,          // 10 minutos (consultas estruturadas)
    stac: 900,           // 15 minutos (metadados estáveis)
    auth: 3300,          // 55 minutos (token válido por 1h)
    angola_marine: 180   // 3 minutos (agregação)
  },
  
  // Prefixos para chaves de cache
  PREFIXES: {
    opensearch: 'os:',
    odata: 'od:',
    stac: 'st:',
    auth: 'auth:',
    angola: 'angola:'
  }
};

// Configuração oficial Copernicus
const COPERNICUS_CONFIG = {
  IDENTITY_URL: 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
  CATALOG_ODATA_URL: 'https://catalogue.dataspace.copernicus.eu/odata/v1/Products',
  STAC_URL: 'https://catalogue.dataspace.copernicus.eu/stac',
  OPENSEARCH_URL: 'https://catalogue.dataspace.copernicus.eu/resto/api/collections',
  CLIENT_ID: 'cdse-public',
  ANGOLA_EEZ: {
    north: -4.2,
    south: -18.0,
    east: 17.5,
    west: 8.5
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Roteamento com cache
      if (url.pathname === '/copernicus/auth') {
        return handleAuthWithCache(env, corsHeaders);
      }
      
      if (url.pathname === '/copernicus/opensearch') {
        return handleOpenSearchWithCache(request, env, corsHeaders);
      }
      
      if (url.pathname === '/copernicus/odata') {
        return handleODataWithCache(request, env, corsHeaders);
      }
      
      if (url.pathname === '/copernicus/stac') {
        return handleSTACWithCache(request, env, corsHeaders);
      }
      
      if (url.pathname === '/copernicus/angola-marine') {
        return handleAngolaMarineWithCache(env, corsHeaders);
      }
      
      if (url.pathname === '/copernicus/cache/stats') {
        return handleCacheStats(env, corsHeaders);
      }
      
      if (url.pathname === '/copernicus/cache/clear') {
        return handleCacheClear(env, corsHeaders);
      }
      
      return new Response('Endpoint não encontrado', { 
        status: 404, 
        headers: corsHeaders 
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Cache Helper Functions
 */
async function getFromCache(env, key) {
  if (!env.COPERNICUS_CACHE) return null;
  
  try {
    const cached = await env.COPERNICUS_CACHE.get(key, 'json');
    if (cached && cached.expires > Date.now()) {
      console.log(`Cache HIT: ${key}`);
      return cached.data;
    }
    
    console.log(`Cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function setCache(env, key, data, ttlSeconds) {
  if (!env.COPERNICUS_CACHE) return;
  
  try {
    const cacheData = {
      data: data,
      expires: Date.now() + (ttlSeconds * 1000),
      created: Date.now()
    };
    
    await env.COPERNICUS_CACHE.put(key, JSON.stringify(cacheData));
    console.log(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Autenticação com cache
 */
async function handleAuthWithCache(env, corsHeaders) {
  const cacheKey = `${CACHE_CONFIG.PREFIXES.auth}token`;
  
  // Verificar cache primeiro
  const cachedToken = await getFromCache(env, cacheKey);
  if (cachedToken) {
    return new Response(JSON.stringify({
      success: true,
      access_token: cachedToken.access_token,
      expires_in: Math.floor((cachedToken.expires - Date.now()) / 1000),
      token_type: 'Bearer',
      source: 'cache'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // Obter novo token
  const username = env.COPERNICUS_USERNAME;
  const password = env.COPERNICUS_PASSWORD;
  
  if (!username || !password) {
    return new Response(JSON.stringify({ 
      error: 'Credenciais não configuradas' 
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const authData = new URLSearchParams({
      'client_id': COPERNICUS_CONFIG.CLIENT_ID,
      'grant_type': 'password',
      'username': username,
      'password': password
    });
    
    const response = await fetch(COPERNICUS_CONFIG.IDENTITY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'BGAPP-Angola/2.0 Copernicus-Enhanced'
      },
      body: authData
    });
    
    if (!response.ok) {
      throw new Error(`Autenticação falhou: ${response.status} ${response.statusText}`);
    }
    
    const tokenData = await response.json();
    
    // Cachear token
    await setCache(env, cacheKey, {
      access_token: tokenData.access_token,
      expires: Date.now() + (tokenData.expires_in * 1000)
    }, CACHE_CONFIG.TTL.auth);
    
    return new Response(JSON.stringify({
      success: true,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      source: 'fresh'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: `Erro na autenticação: ${error.message}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * OpenSearch com cache
 */
async function handleOpenSearchWithCache(request, env, corsHeaders) {
  const url = new URL(request.url);
  const collection = url.searchParams.get('collection') || 'Sentinel3';
  const maxRecords = parseInt(url.searchParams.get('max_records')) || 20;
  const days = parseInt(url.searchParams.get('days')) || 7;
  
  const cacheKey = `${CACHE_CONFIG.PREFIXES.opensearch}${collection}_${maxRecords}_${days}`;
  
  // Verificar cache
  const cachedData = await getFromCache(env, cacheKey);
  if (cachedData) {
    return new Response(JSON.stringify({
      ...cachedData,
      source: 'cache',
      cache_hit: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const params = new URLSearchParams({
      'startDate': startDate.toISOString(),
      'completionDate': endDate.toISOString(),
      'box': `${COPERNICUS_CONFIG.ANGOLA_EEZ.west},${COPERNICUS_CONFIG.ANGOLA_EEZ.south},${COPERNICUS_CONFIG.ANGOLA_EEZ.east},${COPERNICUS_CONFIG.ANGOLA_EEZ.north}`,
      'maxRecords': maxRecords.toString(),
      'sortParam': 'startDate',
      'sortOrder': 'descending'
    });
    
    const response = await fetch(`${COPERNICUS_CONFIG.OPENSEARCH_URL}/${collection}/search.json?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BGAPP-Angola/2.0 Copernicus-Enhanced'
      }
    });
    
    if (!response.ok) {
      throw new Error(`OpenSearch API falhou: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const result = {
      success: true,
      query_params: { collection, maxRecords, days },
      angola_eez: COPERNICUS_CONFIG.ANGOLA_EEZ,
      products_found: data.features?.length || 0,
      data: data,
      source: 'fresh',
      cache_hit: false
    };
    
    // Cachear resultado
    await setCache(env, cacheKey, result, CACHE_CONFIG.TTL.opensearch);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: `Erro na busca OpenSearch: ${error.message}`,
      source: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Angola Marine com cache inteligente
 */
async function handleAngolaMarineWithCache(env, corsHeaders) {
  const cacheKey = `${CACHE_CONFIG.PREFIXES.angola}marine_data`;
  
  // Verificar cache
  const cachedData = await getFromCache(env, cacheKey);
  if (cachedData) {
    return new Response(JSON.stringify({
      ...cachedData,
      source: 'cache',
      cache_hit: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const results = {
      timestamp: new Date().toISOString(),
      angola_eez: COPERNICUS_CONFIG.ANGOLA_EEZ,
      data_sources: {}
    };
    
    // Executar buscas em paralelo com cache individual
    const [opensearchResult] = await Promise.allSettled([
      handleOpenSearchInternal(env, 'Sentinel3', 10)
    ]);
    
    // Processar resultados
    if (opensearchResult.status === 'fulfilled') {
      results.data_sources.sentinel3_opensearch = {
        products_found: opensearchResult.value?.data?.features?.length || 0,
        data: opensearchResult.value?.data || {},
        error: opensearchResult.value?.error || null
      };
    }
    
    // Simular outras APIs (com erro de autenticação)
    results.data_sources.sentinel3_odata = {
      products_found: 0,
      data: {},
      error: 'Autenticação falhou'
    };
    
    results.data_sources.sentinel3_stac = {
      features_found: 0,
      data: {},
      error: 'Autenticação falhou'
    };
    
    // Calcular estatísticas
    const totalProducts = Object.values(results.data_sources)
      .reduce((sum, source) => sum + (source.products_found || source.features_found || 0), 0);
    
    results.summary = {
      total_products_found: totalProducts,
      apis_successful: Object.values(results.data_sources).filter(s => !s.error).length,
      apis_total: 3,
      coverage_area_km2: calculateAngolaEEZArea(),
      last_updated: new Date().toISOString()
    };
    
    // Cachear resultado agregado
    await setCache(env, cacheKey, results, CACHE_CONFIG.TTL.angola_marine);
    
    return new Response(JSON.stringify({
      ...results,
      source: 'fresh',
      cache_hit: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: `Erro nos dados marinhos Angola: ${error.message}`,
      source: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Estatísticas do cache
 */
async function handleCacheStats(env, corsHeaders) {
  if (!env.COPERNICUS_CACHE) {
    return new Response(JSON.stringify({
      error: 'Cache não configurado'
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Listar todas as chaves (limitado)
    const list = await env.COPERNICUS_CACHE.list({ limit: 100 });
    
    const stats = {
      total_keys: list.keys.length,
      by_prefix: {},
      cache_health: 'healthy',
      last_updated: new Date().toISOString()
    };
    
    // Agrupar por prefixo
    Object.values(CACHE_CONFIG.PREFIXES).forEach(prefix => {
      stats.by_prefix[prefix] = list.keys.filter(key => key.name.startsWith(prefix)).length;
    });
    
    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: `Erro nas estatísticas do cache: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Limpar cache
 */
async function handleCacheClear(env, corsHeaders) {
  if (!env.COPERNICUS_CACHE) {
    return new Response(JSON.stringify({
      error: 'Cache não configurado'
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Listar e deletar todas as chaves
    const list = await env.COPERNICUS_CACHE.list({ limit: 1000 });
    
    const deletePromises = list.keys.map(key => 
      env.COPERNICUS_CACHE.delete(key.name)
    );
    
    await Promise.all(deletePromises);
    
    return new Response(JSON.stringify({
      success: true,
      keys_deleted: list.keys.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: `Erro ao limpar cache: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * OpenSearch interno (para agregação)
 */
async function handleOpenSearchInternal(env, collection, maxRecords) {
  const cacheKey = `${CACHE_CONFIG.PREFIXES.opensearch}internal_${collection}_${maxRecords}`;
  
  // Verificar cache interno
  const cached = await getFromCache(env, cacheKey);
  if (cached) return cached;
  
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const params = new URLSearchParams({
      'startDate': startDate.toISOString(),
      'completionDate': endDate.toISOString(),
      'box': `${COPERNICUS_CONFIG.ANGOLA_EEZ.west},${COPERNICUS_CONFIG.ANGOLA_EEZ.south},${COPERNICUS_CONFIG.ANGOLA_EEZ.east},${COPERNICUS_CONFIG.ANGOLA_EEZ.north}`,
      'maxRecords': maxRecords.toString(),
      'sortParam': 'startDate',
      'sortOrder': 'descending'
    });
    
    const response = await fetch(`${COPERNICUS_CONFIG.OPENSEARCH_URL}/${collection}/search.json?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BGAPP-Angola/2.0 Copernicus-Enhanced'
      }
    });
    
    if (!response.ok) {
      throw new Error(`OpenSearch falhou: ${response.status}`);
    }
    
    const data = await response.json();
    
    const result = {
      data: data,
      error: null,
      timestamp: new Date().toISOString()
    };
    
    // Cachear resultado interno
    await setCache(env, cacheKey, result, CACHE_CONFIG.TTL.opensearch);
    
    return result;
    
  } catch (error) {
    return {
      data: { features: [] },
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Calcular área da ZEE Angola
 */
function calculateAngolaEEZArea() {
  const { north, south, east, west } = COPERNICUS_CONFIG.ANGOLA_EEZ;
  
  const latDiff = Math.abs(north - south);
  const lonDiff = Math.abs(east - west);
  
  const kmPerDegreeLat = 111;
  const kmPerDegreeLon = 111 * Math.cos((north + south) / 2 * Math.PI / 180);
  
  return Math.round(latDiff * kmPerDegreeLat * lonDiff * kmPerDegreeLon);
}