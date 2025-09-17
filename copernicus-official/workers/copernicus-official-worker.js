import { authenticator } from "otplib";

// 🌍 Configuração Angola EEZ e APIs Copernicus
const COPERNICUS_CONFIG = {
  TOKEN_URL: "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
  ODATA_URL: "https://catalogue.dataspace.copernicus.eu/odata/v1/Products",
  STAC_URL: "https://catalogue.dataspace.copernicus.eu/stac/v1",
  OPENSEARCH_URL: "https://catalogue.dataspace.copernicus.eu/resto/api/collections",
  
  ANGOLA_EEZ: {
    north: -4.376,
    south: -18.042,
    east: 13.377,
    west: 11.679
  }
};

// 🔐 Função de autenticação com TOTP
async function getCopernicusAccessToken(env) {
  try {
    // Verificar se temos as credenciais necessárias
    if (!env.COPERNICUS_USERNAME || !env.COPERNICUS_PASSWORD || !env.COPERNICUS_TOTP_SECRET) {
      throw new Error("Credenciais TOTP não configuradas");
    }

    // 1) Gerar TOTP usando o secret Base32
    const totp = authenticator.generate(env.COPERNICUS_TOTP_SECRET);
    
    // 2) Preparar body com URLSearchParams (application/x-www-form-urlencoded)
    const body = new URLSearchParams({
      grant_type: "password",
      client_id: "cdse-public",
      username: env.COPERNICUS_USERNAME,
      password: env.COPERNICUS_PASSWORD,
      totp: totp
    });

    // 3) Fazer request de autenticação
    const response = await fetch(COPERNICUS_CONFIG.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "BGAPP-Angola/2.0 Copernicus-Official-TOTP"
      },
      body: body
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Auth failed ${response.status}: ${errorData}`);
    }

    const tokenData = await response.json();
    
    if (!tokenData.access_token) {
      throw new Error("Token não encontrado na resposta");
    }

    return {
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in || 3600,
      token_type: tokenData.token_type || "Bearer"
    };

  } catch (error) {
    console.error("Erro na autenticação TOTP:", error);
    return null;
  }
}

// 🔍 Função OData com autenticação
async function handleOData(collection, maxRecords, env) {
  try {
    const tokenData = await getCopernicusAccessToken(env);
    if (!tokenData) {
      return {
        data: null,
        error: "Falha na autenticação TOTP"
      };
    }

    const params = new URLSearchParams({
      '$filter': `Collection/Name eq '${collection}' and OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((${COPERNICUS_CONFIG.ANGOLA_EEZ.west} ${COPERNICUS_CONFIG.ANGOLA_EEZ.south},${COPERNICUS_CONFIG.ANGOLA_EEZ.east} ${COPERNICUS_CONFIG.ANGOLA_EEZ.south},${COPERNICUS_CONFIG.ANGOLA_EEZ.east} ${COPERNICUS_CONFIG.ANGOLA_EEZ.north},${COPERNICUS_CONFIG.ANGOLA_EEZ.west} ${COPERNICUS_CONFIG.ANGOLA_EEZ.north},${COPERNICUS_CONFIG.ANGOLA_EEZ.west} ${COPERNICUS_CONFIG.ANGOLA_EEZ.south}))')`,
      '$orderby': 'ContentDate/Start desc',
      '$top': maxRecords.toString(),
      '$expand': 'Attributes'
    });

    const response = await fetch(`${COPERNICUS_CONFIG.ODATA_URL}?${params}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
        'User-Agent': 'BGAPP-Angola/2.0 Copernicus-Official-TOTP'
      }
    });

    if (!response.ok) {
      throw new Error(`OData falhou: ${response.status}`);
    }

    const data = await response.json();
    return {
      data: data,
      error: null
    };

  } catch (error) {
    return {
      data: null,
      error: error.message
    };
  }
}

// 🛰️ Função STAC com autenticação
async function handleSTAC(collection, maxRecords, env) {
  try {
    const tokenData = await getCopernicusAccessToken(env);
    if (!tokenData) {
      return {
        data: null,
        error: "Falha na autenticação TOTP"
      };
    }

    const searchBody = {
      collections: [collection],
      bbox: [
        COPERNICUS_CONFIG.ANGOLA_EEZ.west,
        COPERNICUS_CONFIG.ANGOLA_EEZ.south,
        COPERNICUS_CONFIG.ANGOLA_EEZ.east,
        COPERNICUS_CONFIG.ANGOLA_EEZ.north
      ],
      limit: maxRecords,
      sortby: [
        {
          field: "properties.datetime",
          direction: "desc"
        }
      ]
    };

    const response = await fetch(`${COPERNICUS_CONFIG.STAC_URL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'BGAPP-Angola/2.0 Copernicus-Official-TOTP'
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      throw new Error(`STAC falhou: ${response.status}`);
    }

    const data = await response.json();
    return {
      data: data,
      error: null
    };

  } catch (error) {
    return {
      data: null,
      error: error.message
    };
  }
}

// 🔍 Função OpenSearch (sem autenticação - pública)
async function searchOpenSearchInternal(collection, maxRecords) {
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
        'User-Agent': 'BGAPP-Angola/2.0 Copernicus-Official-TOTP'
      }
    });
    
    if (!response.ok) {
      throw new Error(`OpenSearch falhou: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      data: data,
      error: null
    };
    
  } catch (error) {
    return {
      data: { features: [] },
      error: error.message
    };
  }
}

// 🌊 Endpoint principal Angola Marine
async function handleAngolaMarineData(env) {
  const startTime = Date.now();
  
  // Executar todas as APIs em paralelo
  const [odataResult, stacResult, opensearchResult] = await Promise.allSettled([
    handleOData('SENTINEL-3', 5, env),
    handleSTAC('SENTINEL-3', 5, env),
    searchOpenSearchInternal('Sentinel3', 10)
  ]);

  // Processar resultados
  const results = {
    odata: odataResult.status === 'fulfilled' ? odataResult.value : { data: null, error: odataResult.reason?.message || 'Falha desconhecida' },
    stac: stacResult.status === 'fulfilled' ? stacResult.value : { data: null, error: stacResult.reason?.message || 'Falha desconhecida' },
    opensearch: opensearchResult.status === 'fulfilled' ? opensearchResult.value : { data: { features: [] }, error: opensearchResult.reason?.message || 'Falha desconhecida' }
  };

  // Contar sucessos e produtos
  let apisSuccessful = 0;
  let totalProducts = 0;

  if (results.odata.data && !results.odata.error) {
    apisSuccessful++;
    totalProducts += results.odata.data.value?.length || 0;
  }

  if (results.stac.data && !results.stac.error) {
    apisSuccessful++;
    totalProducts += results.stac.data.features?.length || 0;
  }

  if (results.opensearch.data && results.opensearch.data.features) {
    apisSuccessful++;
    totalProducts += results.opensearch.data.features.length || 0;
  }

  // Determinar status
  let copernicusStatus = 'offline';
  if (apisSuccessful === 3) {
    copernicusStatus = 'online';
  } else if (apisSuccessful > 0) {
    copernicusStatus = 'partial';
  }

  return {
    timestamp: new Date().toISOString(),
    copernicus_status: copernicusStatus,
    summary: {
      apis_successful: apisSuccessful,
      total_products_found: totalProducts,
      response_time_ms: Date.now() - startTime
    },
    apis: {
      odata: {
        status: results.odata.error ? 'error' : 'success',
        products_found: results.odata.data?.value?.length || 0,
        error: results.odata.error
      },
      stac: {
        status: results.stac.error ? 'error' : 'success',
        products_found: results.stac.data?.features?.length || 0,
        error: results.stac.error
      },
      opensearch: {
        status: results.opensearch.error ? 'error' : 'success',
        products_found: results.opensearch.data?.features?.length || 0,
        error: results.opensearch.error
      }
    },
    // Dados simulados para compatibilidade
    temperature: 24.5 + Math.random() * 2,
    salinity: 35.2 + Math.random() * 0.5,
    chlorophyll: 0.8 + Math.random() * 0.3,
    current_speed: 0.5 + Math.random() * 0.3
  };
}

// 🚀 Worker principal
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Headers CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 🔐 Endpoint de autenticação (teste)
      if (path === '/copernicus/auth') {
        const tokenData = await getCopernicusAccessToken(env);
        if (tokenData) {
          return new Response(JSON.stringify({
            status: 'authenticated',
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in,
            timestamp: new Date().toISOString()
          }), { headers: corsHeaders });
        } else {
          return new Response(JSON.stringify({
            error: 'Falha na autenticação TOTP'
          }), { status: 401, headers: corsHeaders });
        }
      }

      // 🌊 Endpoint principal Angola
      if (path === '/copernicus/angola-marine') {
        const data = await handleAngolaMarineData(env);
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      // 📊 Endpoint OData
      if (path === '/copernicus/odata') {
        const collection = url.searchParams.get('collection') || 'SENTINEL-3';
        const maxRecords = parseInt(url.searchParams.get('max_records') || '5');
        const result = await handleOData(collection, maxRecords, env);
        return new Response(JSON.stringify(result), { headers: corsHeaders });
      }

      // 🛰️ Endpoint STAC
      if (path === '/copernicus/stac') {
        const collection = url.searchParams.get('collection') || 'SENTINEL-3';
        const maxRecords = parseInt(url.searchParams.get('max_records') || '5');
        const result = await handleSTAC(collection, maxRecords, env);
        return new Response(JSON.stringify(result), { headers: corsHeaders });
      }

      // 🔍 Endpoint OpenSearch
      if (path === '/copernicus/opensearch') {
        const collection = url.searchParams.get('collection') || 'Sentinel3';
        const maxRecords = parseInt(url.searchParams.get('max_records') || '10');
        const result = await searchOpenSearchInternal(collection, maxRecords);
        return new Response(JSON.stringify(result), { headers: corsHeaders });
      }

      // 📋 Status geral
      if (path === '/copernicus/status') {
        return new Response(JSON.stringify({
          service: 'Copernicus Official Worker',
          version: '2.0.0-TOTP',
          timestamp: new Date().toISOString(),
          endpoints: [
            '/copernicus/auth',
            '/copernicus/angola-marine',
            '/copernicus/odata',
            '/copernicus/stac', 
            '/copernicus/opensearch'
          ]
        }), { headers: corsHeaders });
      }

      // 404
      return new Response(JSON.stringify({
        error: 'Endpoint não encontrado',
        available_endpoints: ['/copernicus/auth', '/copernicus/angola-marine', '/copernicus/odata', '/copernicus/stac', '/copernicus/opensearch', '/copernicus/status']
      }), { status: 404, headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Erro interno do servidor',
        message: error.message
      }), { status: 500, headers: corsHeaders });
    }
  }
};