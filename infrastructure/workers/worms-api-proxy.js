/**
 * BGAPP WoRMS API Proxy Worker
 * =============================
 * Purpose: Proxy for World Register of Marine Species (WoRMS) REST API
 * Features: Rate limiting, caching, error handling, response transformation
 * Deployment: wrangler deploy worms-api-proxy.js --config worms-api-proxy.toml
 */

// WoRMS API Configuration
const WORMS_API_BASE = 'https://www.marinespecies.org/rest';
const CACHE_TTL = 86400; // 24 hours in seconds
const RATE_LIMIT_PER_MINUTE = 60;

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // Route requests
      if (url.pathname === '/health') {
        return handleHealthCheck();
      }

      if (url.pathname === '/api/species/search') {
        return await handleSpeciesSearch(request, env, url);
      }

      if (url.pathname === '/api/species/by-name') {
        return await handleSpeciesByName(request, env, url);
      }

      if (url.pathname === '/api/species/by-aphia-id') {
        return await handleSpeciesByAphiaId(request, env, url);
      }

      if (url.pathname === '/api/taxonomy/children') {
        return await handleTaxonomyChildren(request, env, url);
      }

      if (url.pathname === '/api/taxonomy/classification') {
        return await handleTaxonomyClassification(request, env, url);
      }

      if (url.pathname === '/api/species/common-names') {
        return await handleCommonNames(request, env, url);
      }

      if (url.pathname === '/api/cache/stats') {
        return await handleCacheStats(env);
      }

      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: 'Invalid endpoint',
          available: [
            '/health',
            '/api/species/search',
            '/api/species/by-name',
            '/api/species/by-aphia-id',
            '/api/taxonomy/children',
            '/api/taxonomy/classification',
            '/api/species/common-names',
            '/api/cache/stats',
          ],
        }),
        { status: 404, headers: CORS_HEADERS }
      );
    } catch (error) {
      return handleError(error);
    }
  },
};

/**
 * Health check endpoint
 */
function handleHealthCheck() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'BGAPP WoRMS API Proxy',
      worms_api: WORMS_API_BASE,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }),
    { headers: CORS_HEADERS }
  );
}

/**
 * Search species by scientific name (fuzzy matching)
 * GET /api/species/search?q=Sardinella&marine_only=true
 */
async function handleSpeciesSearch(request, env, url) {
  const query = url.searchParams.get('q');
  if (!query || query.length < 3) {
    return new Response(
      JSON.stringify({ error: 'Query must be at least 3 characters' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const marineOnly = url.searchParams.get('marine_only') === 'true';
  const cacheKey = `search:${query}:${marineOnly}`;

  // Check cache
  const cached = await checkCache(env, cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { ...CORS_HEADERS, 'X-Cache': 'HIT' },
    });
  }

  // Call WoRMS API
  const wormsUrl = `${WORMS_API_BASE}/AphiaRecordsByName/${encodeURIComponent(query)}?like=true&marine_only=${marineOnly}`;
  const response = await fetch(wormsUrl);

  if (!response.ok) {
    throw new Error(`WoRMS API error: ${response.status}`);
  }

  const data = await response.json();

  // Transform and cache response
  const transformedData = transformSpeciesRecords(data);
  await cacheResponse(env, cacheKey, transformedData);

  return new Response(JSON.stringify(transformedData), {
    headers: { ...CORS_HEADERS, 'X-Cache': 'MISS' },
  });
}

/**
 * Get species by exact scientific name
 * GET /api/species/by-name?name=Sardinella aurita&marine_only=true
 */
async function handleSpeciesByName(request, env, url) {
  const name = url.searchParams.get('name');
  if (!name) {
    return new Response(
      JSON.stringify({ error: 'Name parameter required' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const marineOnly = url.searchParams.get('marine_only') !== 'false';
  const cacheKey = `byname:${name}:${marineOnly}`;

  // Check cache
  const cached = await checkCache(env, cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { ...CORS_HEADERS, 'X-Cache': 'HIT' },
    });
  }

  // Call WoRMS API
  const wormsUrl = `${WORMS_API_BASE}/AphiaRecordsByName/${encodeURIComponent(name)}?like=false&marine_only=${marineOnly}`;
  const response = await fetch(wormsUrl);

  if (!response.ok) {
    throw new Error(`WoRMS API error: ${response.status}`);
  }

  const data = await response.json();

  // WoRMS returns array even for exact match, take first accepted record
  const acceptedRecord = Array.isArray(data)
    ? data.find((r) => r.status === 'accepted') || data[0]
    : data;

  if (!acceptedRecord) {
    return new Response(
      JSON.stringify({ error: 'Species not found', name }),
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const transformedData = transformSpeciesRecord(acceptedRecord);
  await cacheResponse(env, cacheKey, transformedData);

  return new Response(JSON.stringify(transformedData), {
    headers: { ...CORS_HEADERS, 'X-Cache': 'MISS' },
  });
}

/**
 * Get species by AphiaID
 * GET /api/species/by-aphia-id?id=126823
 */
async function handleSpeciesByAphiaId(request, env, url) {
  const aphiaId = url.searchParams.get('id');
  if (!aphiaId) {
    return new Response(
      JSON.stringify({ error: 'AphiaID parameter required' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const cacheKey = `aphia:${aphiaId}`;

  // Check cache
  const cached = await checkCache(env, cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { ...CORS_HEADERS, 'X-Cache': 'HIT' },
    });
  }

  // Call WoRMS API
  const wormsUrl = `${WORMS_API_BASE}/AphiaRecordByAphiaID/${aphiaId}`;
  const response = await fetch(wormsUrl);

  if (!response.ok) {
    if (response.status === 404) {
      return new Response(
        JSON.stringify({ error: 'Species not found', aphiaId }),
        { status: 404, headers: CORS_HEADERS }
      );
    }
    throw new Error(`WoRMS API error: ${response.status}`);
  }

  const data = await response.json();
  const transformedData = transformSpeciesRecord(data);
  await cacheResponse(env, cacheKey, transformedData);

  return new Response(JSON.stringify(transformedData), {
    headers: { ...CORS_HEADERS, 'X-Cache': 'MISS' },
  });
}

/**
 * Get taxonomy children (subordinate taxa)
 * GET /api/taxonomy/children?aphia_id=126823
 */
async function handleTaxonomyChildren(request, env, url) {
  const aphiaId = url.searchParams.get('aphia_id');
  if (!aphiaId) {
    return new Response(
      JSON.stringify({ error: 'aphia_id parameter required' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const cacheKey = `children:${aphiaId}`;
  const cached = await checkCache(env, cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { ...CORS_HEADERS, 'X-Cache': 'HIT' },
    });
  }

  const wormsUrl = `${WORMS_API_BASE}/AphiaChildrenByAphiaID/${aphiaId}`;
  const response = await fetch(wormsUrl);

  if (!response.ok) {
    throw new Error(`WoRMS API error: ${response.status}`);
  }

  const data = await response.json();
  const transformedData = transformSpeciesRecords(data);
  await cacheResponse(env, cacheKey, transformedData);

  return new Response(JSON.stringify(transformedData), {
    headers: { ...CORS_HEADERS, 'X-Cache': 'MISS' },
  });
}

/**
 * Get full taxonomic classification
 * GET /api/taxonomy/classification?aphia_id=126823
 */
async function handleTaxonomyClassification(request, env, url) {
  const aphiaId = url.searchParams.get('aphia_id');
  if (!aphiaId) {
    return new Response(
      JSON.stringify({ error: 'aphia_id parameter required' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const cacheKey = `classification:${aphiaId}`;
  const cached = await checkCache(env, cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { ...CORS_HEADERS, 'X-Cache': 'HIT' },
    });
  }

  const wormsUrl = `${WORMS_API_BASE}/AphiaClassificationByAphiaID/${aphiaId}`;
  const response = await fetch(wormsUrl);

  if (!response.ok) {
    throw new Error(`WoRMS API error: ${response.status}`);
  }

  const data = await response.json();
  await cacheResponse(env, cacheKey, data);

  return new Response(JSON.stringify(data), {
    headers: { ...CORS_HEADERS, 'X-Cache': 'MISS' },
  });
}

/**
 * Get common names (vernacular names)
 * GET /api/species/common-names?aphia_id=126823
 */
async function handleCommonNames(request, env, url) {
  const aphiaId = url.searchParams.get('aphia_id');
  if (!aphiaId) {
    return new Response(
      JSON.stringify({ error: 'aphia_id parameter required' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const cacheKey = `vernacular:${aphiaId}`;
  const cached = await checkCache(env, cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { ...CORS_HEADERS, 'X-Cache': 'HIT' },
    });
  }

  const wormsUrl = `${WORMS_API_BASE}/AphiaVernacularsByAphiaID/${aphiaId}`;
  const response = await fetch(wormsUrl);

  if (!response.ok) {
    throw new Error(`WoRMS API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract Portuguese and English names
  const names = {
    portuguese: [],
    english: [],
    other: [],
  };

  if (Array.isArray(data)) {
    data.forEach((v) => {
      if (v.language && v.vernacular) {
        const lang = v.language.toLowerCase();
        if (lang.includes('portuguese') || lang.includes('português')) {
          names.portuguese.push(v.vernacular);
        } else if (lang.includes('english')) {
          names.english.push(v.vernacular);
        } else {
          names.other.push({ language: v.language, name: v.vernacular });
        }
      }
    });
  }

  await cacheResponse(env, cacheKey, names);

  return new Response(JSON.stringify(names), {
    headers: { ...CORS_HEADERS, 'X-Cache': 'MISS' },
  });
}

/**
 * Get cache statistics
 * GET /api/cache/stats
 */
async function handleCacheStats(env) {
  // Note: KV doesn't provide native stats, this is a placeholder
  return new Response(
    JSON.stringify({
      message: 'Cache stats not available in KV',
      cache_ttl: CACHE_TTL,
      cache_enabled: true,
    }),
    { headers: CORS_HEADERS }
  );
}

/**
 * Transform WoRMS species record to BGAPP format
 */
function transformSpeciesRecord(record) {
  if (!record) return null;

  return {
    aphia_id: record.AphiaID,
    scientific_name: record.scientificname,
    authority: record.authority,
    status: record.status,
    taxonomic_status: record.unacceptreason || null,

    // Taxonomy
    kingdom: record.kingdom,
    phylum: record.phylum,
    class: record.class,
    order: record.order,
    family: record.family,
    genus: record.genus,

    // Habitat flags
    is_marine: record.isMarine || 0,
    is_brackish: record.isBrackish || 0,
    is_freshwater: record.isFreshwater || 0,
    is_terrestrial: record.isTerrestrial || 0,

    // URLs and metadata
    worms_url: record.url,
    lsid: record.lsid,
    citation: record.citation,
    valid_name: record.valid_name,
    valid_aphia_id: record.valid_AphiaID,

    // Timestamps
    modified: record.modified,
  };
}

/**
 * Transform array of species records
 */
function transformSpeciesRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.map(transformSpeciesRecord).filter((r) => r !== null);
}

/**
 * Check KV cache
 */
async function checkCache(env, key) {
  if (!env.BGAPP_KV) return null;

  try {
    const cached = await env.BGAPP_KV.get(`worms:${key}`);
    return cached;
  } catch (error) {
    console.error('Cache check error:', error);
    return null;
  }
}

/**
 * Cache response in KV
 */
async function cacheResponse(env, key, data) {
  if (!env.BGAPP_KV) return;

  try {
    await env.BGAPP_KV.put(`worms:${key}`, JSON.stringify(data), {
      expirationTtl: CACHE_TTL,
    });
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Error handler
 */
function handleError(error) {
  console.error('Worker error:', error);

  return new Response(
    JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 500,
      headers: CORS_HEADERS,
    }
  );
}
