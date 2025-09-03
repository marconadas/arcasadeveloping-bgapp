/**
 * 🛰️ BGAPP STAC API Worker - SpatioTemporal Asset Catalog
 * Worker para catálogo de dados oceanográficos
 */

const STAC_CATALOG = {
  stac_version: "1.0.0",
  type: "Catalog",
  id: "bgapp-zee-angola",
  title: "BGAPP - Catálogo ZEE Angola",
  description: "Catálogo de dados oceanográficos da Zona Econômica Exclusiva de Angola",
  links: [
    {
      rel: "root",
      href: "https://bgapp-stac-worker.majearcasa.workers.dev/",
      type: "application/json",
      title: "BGAPP STAC Catalog"
    },
    {
      rel: "collections",
      href: "https://bgapp-stac-worker.majearcasa.workers.dev/collections",
      type: "application/json",
      title: "Collections"
    }
  ]
};

const STAC_COLLECTIONS = [
  {
    stac_version: "1.0.0",
    type: "Collection",
    id: "zee_angola_sst",
    title: "ZEE Angola - Temperatura da Superfície do Mar",
    description: "Dados de temperatura da superfície do mar da Zona Econômica Exclusiva de Angola",
    extent: {
      spatial: {
        bbox: [[-18.0, -17.5, 12.0, -4.5]]
      },
      temporal: {
        interval: [["2020-01-01T00:00:00Z", null]]
      }
    },
    license: "proprietary",
    providers: [
      {
        name: "BGAPP Marine Angola",
        roles: ["producer", "processor"],
        url: "https://bgapp-admin.pages.dev"
      }
    ],
    summaries: {
      "eo:bands": [
        {
          name: "sst",
          description: "Sea Surface Temperature",
          center_wavelength: 11.0,
          full_width_half_max: 1.0
        }
      ]
    }
  },
  {
    stac_version: "1.0.0",
    type: "Collection",
    id: "zee_angola_chlorophyll",
    title: "ZEE Angola - Clorofila-a",
    description: "Concentrações de clorofila-a na costa angolana",
    extent: {
      spatial: {
        bbox: [[-18.0, -17.5, 12.0, -4.5]]
      },
      temporal: {
        interval: [["2020-01-01T00:00:00Z", null]]
      }
    },
    license: "proprietary",
    providers: [
      {
        name: "BGAPP Marine Angola",
        roles: ["producer", "processor"],
        url: "https://bgapp-admin.pages.dev"
      }
    ]
  },
  {
    stac_version: "1.0.0",
    type: "Collection",
    id: "zee_angola_biodiversity",
    title: "ZEE Angola - Biodiversidade Marinha",
    description: "Dados de biodiversidade e espécies marinhas de Angola",
    extent: {
      spatial: {
        bbox: [[-18.0, -17.5, 12.0, -4.5]]
      },
      temporal: {
        interval: [["2020-01-01T00:00:00Z", null]]
      }
    },
    license: "proprietary",
    providers: [
      {
        name: "BGAPP Marine Angola",
        roles: ["producer", "processor"],
        url: "https://bgapp-admin.pages.dev"
      }
    ]
  }
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // Root catalog
      if (path === '/' || path === '/catalog') {
        return new Response(JSON.stringify(STAC_CATALOG), { headers: CORS_HEADERS });
      }

      // Collections endpoint
      if (path === '/collections') {
        return new Response(JSON.stringify({
          collections: STAC_COLLECTIONS,
          links: [
            {
              rel: "root",
              href: "https://bgapp-stac-worker.majearcasa.workers.dev/",
              type: "application/json"
            }
          ]
        }), { headers: CORS_HEADERS });
      }

      // Individual collection
      const collectionMatch = path.match(/^\/collections\/(.+)$/);
      if (collectionMatch) {
        const collectionId = collectionMatch[1];
        const collection = STAC_COLLECTIONS.find(c => c.id === collectionId);
        
        if (collection) {
          return new Response(JSON.stringify(collection), { headers: CORS_HEADERS });
        } else {
          return new Response(JSON.stringify({
            error: 'Collection not found',
            available_collections: STAC_COLLECTIONS.map(c => c.id)
          }), { status: 404, headers: CORS_HEADERS });
        }
      }

      // Health check
      if (path === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          service: 'BGAPP STAC API Worker',
          version: '1.0.0',
          collections_count: STAC_COLLECTIONS.length,
          timestamp: new Date().toISOString()
        }), { headers: CORS_HEADERS });
      }

      // 404 for other paths
      return new Response(JSON.stringify({
        error: 'Endpoint not found',
        available_endpoints: ['/', '/collections', '/collections/{id}', '/health']
      }), { status: 404, headers: CORS_HEADERS });

    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }), { status: 500, headers: CORS_HEADERS });
    }
  }
};
