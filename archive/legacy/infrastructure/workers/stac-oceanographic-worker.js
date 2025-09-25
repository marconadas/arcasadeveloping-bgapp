/**
 * 🌊 BGAPP STAC Oceanographic API Worker
 * Worker especializado para coleções STAC oceanográficas
 * Integra com APIs STAC públicas e fornece dados para Angola
 */

// APIs STAC públicas para dados oceanográficos
const EXTERNAL_STAC_APIS = {
  planetary_computer: 'https://planetarycomputer.microsoft.com/api/stac/v1',
  earth_search: 'https://earth-search.aws.element84.com/v1',
  usgs_landsat: 'https://landsatlook.usgs.gov/stac-server'
};

// Coleções prioritárias para Angola
const PRIORITY_COLLECTIONS = [
  {
    id: 'noaa-cdr-sea-surface-temperature-whoi',
    title: 'NOAA SST WHOI',
    description: 'Temperatura da superfície do mar - dados NOAA',
    api_url: EXTERNAL_STAC_APIS.planetary_computer,
    relevance_score: 5,
    keywords: ['sst', 'temperature', 'ocean', 'angola']
  },
  {
    id: 'sentinel-3-slstr-wst-l2-netcdf',
    title: 'Sentinel-3 SST',
    description: 'Temperatura da superfície do mar Sentinel-3',
    api_url: EXTERNAL_STAC_APIS.planetary_computer,
    relevance_score: 5,
    keywords: ['sentinel-3', 'sst', 'temperature']
  },
  {
    id: 'sentinel-2-l2a',
    title: 'Sentinel-2 L2A',
    description: 'Imagens ópticas Sentinel-2 Level 2A',
    api_url: EXTERNAL_STAC_APIS.planetary_computer,
    relevance_score: 4,
    keywords: ['sentinel-2', 'optical', 'coastal']
  },
  {
    id: 'sentinel-1-grd',
    title: 'Sentinel-1 GRD',
    description: 'Dados radar Sentinel-1 Ground Range Detected',
    api_url: EXTERNAL_STAC_APIS.planetary_computer,
    relevance_score: 4,
    keywords: ['sentinel-1', 'radar', 'ocean']
  }
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

async function checkAPIHealth(apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const startTime = Date.now();
    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      response_time_ms: responseTime,
      description: data.title || data.description || 'STAC API'
    };
  } catch (error) {
    return {
      status: 'error',
      response_time_ms: null,
      description: `Erro: ${error.message}`
    };
  }
}

async function searchExternalSTAC(collectionId, bbox, datetime, limit = 10) {
  const collection = PRIORITY_COLLECTIONS.find(c => c.id === collectionId);
  if (!collection) {
    throw new Error(`Coleção ${collectionId} não encontrada`);
  }
  
  const searchUrl = `${collection.api_url}/search`;
  const searchBody = {
    collections: [collectionId],
    limit: parseInt(limit),
    ...(bbox && { bbox: bbox.split(',').map(Number) }),
    ...(datetime && { datetime })
  };
  
  try {
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(searchBody)
    });
    
    if (!response.ok) {
      throw new Error(`API retornou ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      items: data.features || [],
      total: data.numberMatched || data.features?.length || 0
    };
  } catch (error) {
    throw new Error(`Erro ao buscar em ${collection.api_url}: ${error.message}`);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }
    
    try {
      // Health check das APIs STAC
      if (path === '/stac/apis/health') {
        const healthChecks = {};
        
        for (const [name, apiUrl] of Object.entries(EXTERNAL_STAC_APIS)) {
          healthChecks[name] = await checkAPIHealth(apiUrl);
        }
        
        const totalApis = Object.keys(healthChecks).length;
        const healthyApis = Object.values(healthChecks).filter(h => h.status === 'healthy').length;
        
        return jsonResponse({
          status: 'success',
          apis: healthChecks,
          summary: {
            total_apis: totalApis,
            healthy_apis: healthyApis,
            health_percentage: Math.round((healthyApis / totalApis) * 100)
          }
        });
      }
      
      // Resumo das coleções
      if (path === '/stac/collections/summary') {
        return jsonResponse({
          status: 'success',
          summary: {
            external_apis: Object.keys(EXTERNAL_STAC_APIS).length,
            priority_collections: PRIORITY_COLLECTIONS.length,
            data_types_available: ['sea_surface_temperature', 'optical_imagery', 'radar_data', 'chlorophyll']
          }
        });
      }
      
      // Coleções externas prioritárias
      if (path === '/stac/collections/external') {
        return jsonResponse({
          status: 'success',
          collections: PRIORITY_COLLECTIONS
        });
      }
      
      // Busca em coleção específica
      const searchMatch = path.match(/^\/stac\/search\/(.+)$/);
      if (searchMatch) {
        const collectionId = searchMatch[1];
        const bbox = url.searchParams.get('bbox');
        const datetime = url.searchParams.get('datetime_range');
        const limit = url.searchParams.get('limit') || 10;
        
        try {
          const results = await searchExternalSTAC(collectionId, bbox, datetime, limit);
          return jsonResponse({
            status: 'success',
            ...results
          });
        } catch (error) {
          return jsonResponse({
            status: 'error',
            message: error.message
          }, 500);
        }
      }
      
      // Dados oceanográficos recentes
      if (path === '/stac/oceanographic/recent') {
        const daysBack = parseInt(url.searchParams.get('days_back') || 7);
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        
        // Simular dados recentes (em produção, buscaria das APIs externas)
        const mockRecentData = {
          sea_surface_temperature: [
            {
              id: `sst_${Date.now()}_1`,
              collection: 'noaa-cdr-sea-surface-temperature-whoi',
              datetime: new Date(Date.now() - Math.random() * daysBack * 24 * 60 * 60 * 1000).toISOString(),
              assets: ['sst', 'quality']
            },
            {
              id: `sst_${Date.now()}_2`,
              collection: 'sentinel-3-slstr-wst-l2-netcdf',
              datetime: new Date(Date.now() - Math.random() * daysBack * 24 * 60 * 60 * 1000).toISOString(),
              assets: ['sst', 'flags']
            }
          ]
        };
        
        return jsonResponse({
          status: 'success',
          data: mockRecentData,
          summary: {
            total_items: mockRecentData.sea_surface_temperature.length,
            days_back: daysBack,
            date_range: `${startDate.toISOString().split('T')[0]} / ${endDate.toISOString().split('T')[0]}`
          }
        });
      }
      
      // Info de coleção específica
      const collectionMatch = path.match(/^\/stac\/collections\/(.+)\/info$/);
      if (collectionMatch) {
        const collectionId = collectionMatch[1];
        const collection = PRIORITY_COLLECTIONS.find(c => c.id === collectionId);
        
        if (collection) {
          return jsonResponse({
            status: 'success',
            collection
          });
        } else {
          return jsonResponse({
            status: 'error',
            message: 'Coleção não encontrada',
            available_collections: PRIORITY_COLLECTIONS.map(c => c.id)
          }, 404);
        }
      }
      
      // Health check geral
      if (path === '/health') {
        return jsonResponse({
          status: 'healthy',
          service: 'BGAPP STAC Oceanographic Worker',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          collections_available: PRIORITY_COLLECTIONS.length
        });
      }
      
      // 404 para outros endpoints
      return jsonResponse({
        error: 'Endpoint não encontrado',
        available_endpoints: [
          '/stac/apis/health',
          '/stac/collections/summary',
          '/stac/collections/external',
          '/stac/search/{collection_id}',
          '/stac/oceanographic/recent',
          '/stac/collections/{id}/info',
          '/health'
        ]
      }, 404);
      
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({
        error: error.message,
        timestamp: new Date().toISOString()
      }, 500);
    }
  }
};
