/**
 * 🚀 BGAPP Admin API Worker - Cloudflare Worker
 * Substitui a Admin API Python com endpoints essenciais
 */

// 📊 Mock data para funcionamento completo
const MOCK_SERVICES_DATA = {
  services: {
    summary: {
      total: 8,
      online: 8,
      offline: 0,
      health_percentage: 100,
      last_updated: new Date().toISOString()
    },
    services: [
      { name: 'Frontend Pages', status: 'online', response_time: 45, uptime: 99.9, url: 'bgapp-admin.pages.dev' },
      { name: 'Scientific Interfaces', status: 'online', response_time: 52, uptime: 99.8, url: 'bgapp-scientific.pages.dev' },
      { name: 'Admin API Worker', status: 'online', response_time: 23, uptime: 99.9, url: 'bgapp-api-worker.majearcasa.workers.dev' },
      { name: 'STAC API Worker', status: 'online', response_time: 38, uptime: 99.7, url: 'bgapp-stac-worker.majearcasa.workers.dev' },
      { name: 'PyGeoAPI Worker', status: 'online', response_time: 67, uptime: 99.5, url: 'bgapp-pygeoapi-worker.majearcasa.workers.dev' },
      { name: 'KV Storage', status: 'online', response_time: 15, uptime: 99.9, url: 'cloudflare-kv' },
      { name: 'R2 Storage', status: 'online', response_time: 28, uptime: 99.8, url: 'cloudflare-r2' },
      { name: 'Analytics', status: 'online', response_time: 19, uptime: 99.6, url: 'cloudflare-analytics' }
    ]
  },
  
  dashboard_overview: {
    system_status: { overall: 'healthy', uptime: '99.8%', last_update: new Date().toISOString() },
    zee_angola: { area_km2: 518000, monitoring_stations: 47, species_recorded: 1247, fishing_zones: 12 },
    real_time_data: { sea_temperature: 24.8, chlorophyll: 2.3, wave_height: 1.6, current_speed: 0.7 },
    services: { copernicus: 'operational', data_processing: 'running', monitoring: 'active', apis: 'online' },
    alerts: { active: 0, resolved_today: 2, total_this_week: 8 },
    performance: { api_response_time: 42, data_freshness: 98, success_rate: 99.2 }
  },

  system_health: {
    overall_status: 'healthy',
    health_percentage: 100,
    uptime: '99.8%',
    components: {
      frontend: { status: 'healthy', response_time: 45 },
      api: { status: 'healthy', response_time: 23 },
      storage: { status: 'healthy', response_time: 28 }
    },
    performance: { 
      cpu_usage: 12.5, 
      memory_usage: 28.3, 
      disk_usage: 15.7, 
      network_io: 'optimal', 
      api_response_time: 42 
    },
    statistics: { 
      total_services: 8, 
      online_services: 8, 
      offline_services: 0, 
      total_endpoints: 25, 
      active_connections: 15 
    },
    alerts: [],
    last_check: new Date().toISOString(),
    timestamp: new Date().toISOString()
  },

  oceanographic_data: {
    temperature: 24.8,
    salinity: 35.4,
    current_speed: 0.7,
    wave_height: 1.6,
    chlorophyll: 2.3,
    ph: 8.1,
    dissolved_oxygen: 6.8,
    last_update: new Date().toISOString(),
    region: 'ZEE Angola',
    data_quality: 'excellent'
  },

  fisheries_stats: {
    active_fisheries: 47,
    total_catch_today: 15600,
    sustainability_index: 'good',
    species_diversity: 156,
    protected_areas: 12,
    fishing_vessels: 234,
    last_update: new Date().toISOString()
  }
};

// 🌐 CORS headers para integração
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // 📊 Dashboard Overview
      if (path === '/api/dashboard/overview') {
        return new Response(JSON.stringify({
          success: true,
          data: MOCK_SERVICES_DATA.dashboard_overview
        }), { headers: CORS_HEADERS });
      }

      // 🏥 System Health
      if (path === '/admin-dashboard/system-health') {
        return new Response(JSON.stringify({
          success: true,
          data: MOCK_SERVICES_DATA.system_health
        }), { headers: CORS_HEADERS });
      }

      // 🌊 Oceanographic Data
      if (path === '/admin-dashboard/oceanographic-data') {
        return new Response(JSON.stringify({
          success: true,
          data: MOCK_SERVICES_DATA.oceanographic_data
        }), { headers: CORS_HEADERS });
      }

      // 🐟 Fisheries Stats
      if (path === '/admin-dashboard/fisheries-stats') {
        return new Response(JSON.stringify({
          success: true,
          data: MOCK_SERVICES_DATA.fisheries_stats
        }), { headers: CORS_HEADERS });
      }

      // 🛰️ Copernicus Real Time
      if (path === '/admin-dashboard/copernicus-advanced/real-time-data') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            sst: 25.1,
            chlorophyll: 2.1,
            waves: 1.4,
            wind_speed: 8.2,
            last_update: new Date().toISOString()
          }
        }), { headers: CORS_HEADERS });
      }

      // 🔗 Services Status (múltiplos endpoints) - FORMATO CORRETO PARA FRONTEND
      if (path === '/api/services/status' || path === '/services/status' || path === '/services') {
        return new Response(JSON.stringify({
          success: true,
          data: MOCK_SERVICES_DATA.services.services
        }), { headers: CORS_HEADERS });
      }

      // 📊 System Metrics - FORMATO CORRETO PARA FRONTEND
      if (path === '/metrics') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            cpuPercent: 12.5,
            memoryPercent: 28.3,
            diskPercent: 15.7,
            networkStatus: 'optimal',
            responseTime: 42,
            uptime: '99.8%',
            timestamp: new Date().toISOString()
          }
        }), { headers: CORS_HEADERS });
      }

      // 🔄 Async Tasks
      if (path === '/async/tasks') {
        return new Response(JSON.stringify({
          status: 'success',
          tasks: {
            active: 0,
            completed: 15,
            failed: 0,
            queue_size: 0,
            processing_time_avg: 2.3
          }
        }), { headers: CORS_HEADERS });
      }

      // 💾 Storage Buckets
      if (path === '/storage/buckets') {
        return new Response(JSON.stringify({
          status: 'success',
          buckets: [
            { name: 'bgapp-data', size: '2.3GB', objects: 1247 },
            { name: 'bgapp-backups', size: '890MB', objects: 234 },
            { name: 'bgapp-cache', size: '156MB', objects: 89 }
          ]
        }), { headers: CORS_HEADERS });
      }

      // 📋 Reports
      if (path === '/api/reports') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            reports: [
              { id: 1, name: 'Relatório Oceanográfico', type: 'oceanographic', date: new Date().toISOString() },
              { id: 2, name: 'Análise de Biodiversidade', type: 'biodiversity', date: new Date().toISOString() }
            ]
          }
        }), { headers: CORS_HEADERS });
      }

      // 🗺️ SISTEMA DE MAPAS - ENDPOINTS COMPLETOS
      
      // Listar todos os mapas
      if (path === '/api/maps' && method === 'GET') {
        return new Response(JSON.stringify({
          success: true,
          data: [
            {
              id: 'realtime_angola',
              name: 'Realtime Angola',
              description: 'Dados oceanográficos em tempo real da costa angolana',
              url: 'https://bgapp-scientific.pages.dev/realtime_angola.html',
              icon: '🌊',
              category: 'oceanographic',
              features: ['SST', 'Correntes', 'Ventos', 'Clorofila-a', 'Batimetria'],
              status: 'active',
              last_updated: new Date().toISOString()
            },
            {
              id: 'dashboard_cientifico',
              name: 'Dashboard Científico',
              description: 'Interface científica principal para dados oceanográficos',
              url: 'https://bgapp-scientific.pages.dev/dashboard_cientifico.html',
              icon: '🔬',
              category: 'scientific',
              features: ['Análise Científica', 'Múltiplas Camadas', 'Visualizações Avançadas'],
              status: 'active',
              last_updated: new Date().toISOString()
            },
            {
              id: 'qgis_dashboard',
              name: 'QGIS Dashboard',
              description: 'Dashboard QGIS principal com análise espacial',
              url: 'https://bgapp-scientific.pages.dev/qgis_dashboard.html',
              icon: '🗺️',
              category: 'administrative',
              features: ['Análise Espacial', 'QGIS Integration', 'Geoprocessamento'],
              status: 'active',
              last_updated: new Date().toISOString()
            },
            {
              id: 'qgis_fisheries',
              name: 'QGIS Pescas',
              description: 'Sistema QGIS especializado para gestão pesqueira',
              url: 'https://bgapp-scientific.pages.dev/qgis_fisheries.html',
              icon: '🎣',
              category: 'fisheries',
              features: ['Gestão Pesqueira', 'Zonas de Pesca', 'Análise de Stocks'],
              status: 'active',
              last_updated: new Date().toISOString()
            }
          ],
          total: 4,
          timestamp: new Date().toISOString()
        }), { headers: CORS_HEADERS });
      }

      // Obter mapa específico
      if (path.startsWith('/api/maps/') && method === 'GET' && !path.includes('/tools') && !path.includes('/stats') && !path.includes('/templates')) {
        const mapId = path.split('/')[3];
        const maps = {
          'realtime_angola': {
            id: 'realtime_angola',
            name: 'Realtime Angola',
            description: 'Dados oceanográficos em tempo real da costa angolana',
            url: 'https://bgapp-scientific.pages.dev/realtime_angola.html',
            icon: '🌊',
            category: 'oceanographic',
            features: ['SST', 'Correntes', 'Ventos', 'Clorofila-a', 'Batimetria'],
            status: 'active',
            last_updated: new Date().toISOString()
          }
        };
        
        if (maps[mapId]) {
          return new Response(JSON.stringify({
            success: true,
            data: maps[mapId],
            timestamp: new Date().toISOString()
          }), { headers: CORS_HEADERS });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Mapa não encontrado',
            timestamp: new Date().toISOString()
          }), { status: 404, headers: CORS_HEADERS });
        }
      }

      // Estatísticas dos mapas
      if (path === '/api/maps/stats') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            total_maps: 4,
            active_maps: 4,
            maps_by_category: {
              oceanographic: 1,
              scientific: 1,
              administrative: 1,
              fisheries: 1
            },
            most_used_maps: [
              { id: 'realtime_angola', name: 'Realtime Angola', views: 1250 },
              { id: 'dashboard_cientifico', name: 'Dashboard Científico', views: 980 },
              { id: 'qgis_fisheries', name: 'QGIS Pescas', views: 750 }
            ],
            recent_maps: [
              { id: 'realtime_angola', name: 'Realtime Angola', created_at: new Date().toISOString() }
            ]
          },
          timestamp: new Date().toISOString()
        }), { headers: CORS_HEADERS });
      }

      // Templates de mapas
      if (path === '/api/maps/templates') {
        return new Response(JSON.stringify({
          success: true,
          data: [
            {
              id: 'oceanographic_basic',
              name: 'Mapa Oceanográfico Básico',
              description: 'Template básico para mapas oceanográficos com camadas essenciais',
              category: 'oceanographic',
              configuration: {
                center: [-12.5, 13.5],
                zoom: 6,
                baseLayers: ['osm', 'satellite'],
                defaultBaseLayer: 'satellite'
              },
              required_layers: ['zee_angola'],
              optional_layers: ['bathymetry', 'sst', 'currents']
            },
            {
              id: 'fisheries_management',
              name: 'Gestão Pesqueira',
              description: 'Template para mapas de gestão e monitoramento pesqueiro',
              category: 'fisheries',
              configuration: {
                center: [-12.5, 13.5],
                zoom: 7,
                controls: { measurement: true, drawing: true }
              },
              required_layers: ['fishing_zones', 'ports'],
              optional_layers: ['vessel_tracks', 'fish_stocks']
            }
          ],
          total: 2,
          timestamp: new Date().toISOString()
        }), { headers: CORS_HEADERS });
      }

      // Categorias de mapas
      if (path === '/api/maps/tools/categories') {
        return new Response(JSON.stringify({
          success: true,
          data: [
            {
              id: 'oceanographic',
              name: 'Oceanográfico',
              description: 'Mapas com dados oceanográficos e meteorológicos',
              icon: '🌊',
              color: '#0066cc'
            },
            {
              id: 'fisheries',
              name: 'Pescas',
              description: 'Mapas para gestão e monitoramento pesqueiro',
              icon: '🎣',
              color: '#ff6600'
            },
            {
              id: 'biodiversity',
              name: 'Biodiversidade',
              description: 'Mapas de estudos e conservação da biodiversidade',
              icon: '🐠',
              color: '#00cc66'
            },
            {
              id: 'scientific',
              name: 'Científico',
              description: 'Mapas para pesquisa e análise científica',
              icon: '🔬',
              color: '#6600cc'
            }
          ],
          total: 4,
          timestamp: new Date().toISOString()
        }), { headers: CORS_HEADERS });
      }

      // Camadas base disponíveis
      if (path === '/api/maps/tools/base-layers') {
        return new Response(JSON.stringify({
          success: true,
          data: [
            {
              id: 'osm',
              name: 'OpenStreetMap',
              description: 'Mapa colaborativo mundial',
              url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              attribution: '© OpenStreetMap contributors',
              type: 'xyz'
            },
            {
              id: 'satellite',
              name: 'Satélite',
              description: 'Imagens de satélite de alta resolução',
              url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              attribution: '© Esri',
              type: 'xyz'
            }
          ],
          total: 2,
          timestamp: new Date().toISOString()
        }), { headers: CORS_HEADERS });
      }

      // Validar configuração de mapa
      if (path === '/api/maps/tools/validate' && method === 'POST') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            valid: true,
            score: 95,
            errors: [],
            warnings: [],
            suggestions: [
              {
                code: 'OPTIMIZE_ZOOM',
                message: 'Considere ajustar o zoom para melhor visualização de Angola',
                category: 'optimization'
              }
            ]
          },
          timestamp: new Date().toISOString()
        }), { headers: CORS_HEADERS });
      }

      // Sugerir camadas por categoria
      if (path.startsWith('/api/maps/tools/suggest-layers/')) {
        const category = path.split('/')[5];
        const suggestions = {
          oceanographic: [
            { name: 'ZEE Angola', type: 'geojson', required: true },
            { name: 'Temperatura Superficial', type: 'wms', required: false },
            { name: 'Batimetria', type: 'wms', required: false }
          ],
          fisheries: [
            { name: 'Zonas de Pesca', type: 'geojson', required: true },
            { name: 'Portos Pesqueiros', type: 'geojson', required: true },
            { name: 'Embarcações', type: 'vector', required: false }
          ]
        };

        return new Response(JSON.stringify({
          success: true,
          data: suggestions[category] || [],
          category: category,
          timestamp: new Date().toISOString()
        }), { headers: CORS_HEADERS });
      }

      // Otimizar configuração
      if (path === '/api/maps/tools/optimize' && method === 'POST') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            config: {
              zoom: 6,
              opacity: 0.7
            },
            optimizations: [
              'Ajustado zoom para melhor performance',
              'Reduzida opacidade para melhor visualização'
            ]
          },
          timestamp: new Date().toISOString()
        }), { headers: CORS_HEADERS });
      }

      // Criar novo mapa
      if (path === '/api/maps' && method === 'POST') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            id: 'new_map_' + Date.now(),
            name: 'Novo Mapa',
            description: 'Mapa criado via API',
            status: 'active',
            created_at: new Date().toISOString()
          },
          message: 'Mapa criado com sucesso',
          timestamp: new Date().toISOString()
        }), { headers: CORS_HEADERS });
      }

      // 🗺️ QGIS Analyses - POST (Create new analysis) - DEVE VIR PRIMEIRO
      if (path === '/qgis/analyses' && method === 'POST') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            id: Date.now(),
            name: 'Nova Análise QGIS',
            type: 'custom-analysis',
            status: 'queued',
            created_at: new Date().toISOString(),
            estimated_completion: new Date(Date.now() + 300000).toISOString(), // 5 min
            message: 'Análise criada com sucesso e adicionada à fila de processamento'
          }
        }), { headers: CORS_HEADERS });
      }

      // 🗺️ QGIS Analyses - GET
      if (path === '/qgis/analyses' && method === 'GET') {
        return new Response(JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              name: 'Análise de Biomassa Marinha',
              type: 'biomass-calculation',
              status: 'completed',
              created_at: new Date(Date.now() - 86400000).toISOString(),
              results: { total_biomass: 2500, area_km2: 150 }
            },
            {
              id: 2,
              name: 'Análise Espacial de Pescas',
              type: 'spatial-analysis',
              status: 'running',
              created_at: new Date(Date.now() - 3600000).toISOString(),
              progress: 75
            },
            {
              id: 3,
              name: 'Visualização Temporal',
              type: 'temporal-visualization',
              status: 'completed',
              created_at: new Date(Date.now() - 7200000).toISOString(),
              results: { time_series_points: 1247 }
            }
          ]
        }), { headers: CORS_HEADERS });
      }

      // 🗺️ QGIS Spatial Analysis
      if (path === '/qgis/spatial-analysis') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            analysis_id: 'spatial_' + Date.now(),
            status: 'completed',
            results: {
              total_area: 15420.5,
              fishing_zones: 12,
              protected_areas: 3,
              overlap_percentage: 23.7,
              coordinates: [
                { lat: -8.8, lng: 13.2, value: 85 },
                { lat: -9.2, lng: 13.8, value: 92 },
                { lat: -8.5, lng: 12.9, value: 78 }
              ]
            },
            timestamp: new Date().toISOString()
          }
        }), { headers: CORS_HEADERS });
      }

      // 🗺️ QGIS Temporal Visualization
      if (path === '/qgis/temporal-visualization') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            visualization_id: 'temporal_' + Date.now(),
            time_range: {
              start: '2024-01-01',
              end: '2024-12-31'
            },
            data_points: Array.from({length: 12}, (_, i) => ({
              month: i + 1,
              biomass: Math.random() * 1000 + 500,
              temperature: Math.random() * 5 + 22,
              fishing_activity: Math.random() * 100
            })),
            trends: {
              biomass_trend: 'increasing',
              temperature_trend: 'stable',
              fishing_trend: 'decreasing'
            },
            timestamp: new Date().toISOString()
          }
        }), { headers: CORS_HEADERS });
      }

      // 🗺️ QGIS Biomass Calculation
      if (path === '/qgis/biomass-calculation') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            calculation_id: 'biomass_' + Date.now(),
            total_biomass: 3247.8,
            biomass_density: 21.6,
            area_analyzed: 150.2,
            species_distribution: [
              { species: 'Sardinha', biomass: 1200.5, percentage: 37 },
              { species: 'Cavala', biomass: 890.3, percentage: 27 },
              { species: 'Atum', biomass: 756.2, percentage: 23 },
              { species: 'Outros', biomass: 400.8, percentage: 13 }
            ],
            confidence_level: 0.87,
            timestamp: new Date().toISOString()
          }
        }), { headers: CORS_HEADERS });
      }



      // 🐟 FISHERIES DATA ENDPOINTS - SUBSTITUI localhost:5080
      
      // Portos Pesqueiros
      if (path === '/collections/fishing_ports/items') {
        return new Response(JSON.stringify({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              id: 1,
              geometry: { type: "Point", coordinates: [13.2343, -8.8384] },
              properties: {
                name: "Porto de Luanda",
                type: "Porto Principal",
                zone: "Norte",
                population: 45000,
                infrastructure: "Completa",
                capacity: "Grande"
              }
            },
            {
              type: "Feature", 
              id: 2,
              geometry: { type: "Point", coordinates: [13.5543, -9.1234] },
              properties: {
                name: "Porto do Lobito",
                type: "Porto Regional",
                zone: "Centro", 
                population: 28000,
                infrastructure: "Moderna",
                capacity: "Média"
              }
            },
            {
              type: "Feature",
              id: 3, 
              geometry: { type: "Point", coordinates: [12.1543, -5.5234] },
              properties: {
                name: "Porto de Cabinda",
                type: "Porto Principal",
                zone: "Norte",
                population: 35000,
                infrastructure: "Completa",
                capacity: "Grande"
              }
            },
            {
              type: "Feature",
              id: 4,
              geometry: { type: "Point", coordinates: [11.8543, -15.1234] },
              properties: {
                name: "Porto de Namibe",
                type: "Porto Regional", 
                zone: "Sul",
                population: 22000,
                infrastructure: "Básica",
                capacity: "Média"
              }
            }
          ]
        }), { headers: CORS_HEADERS });
      }

      // Vilas Pescatórias
      if (path === '/collections/fishing_villages/items') {
        return new Response(JSON.stringify({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              id: 1,
              geometry: { type: "Point", coordinates: [13.1543, -8.7234] },
              properties: {
                name: "Vila da Corimba",
                type: "Vila Pescatória",
                zone: "Norte",
                population: 3500,
                main_species: "Sardinha",
                boats: 45
              }
            },
            {
              type: "Feature",
              id: 2, 
              geometry: { type: "Point", coordinates: [13.4543, -9.0234] },
              properties: {
                name: "Vila do Benguela",
                type: "Vila Pescatória", 
                zone: "Centro",
                population: 4200,
                main_species: "Cavala",
                boats: 52
              }
            },
            {
              type: "Feature",
              id: 3,
              geometry: { type: "Point", coordinates: [12.0543, -5.4234] },
              properties: {
                name: "Vila de Soyo",
                type: "Vila Pescatória",
                zone: "Norte", 
                population: 2800,
                main_species: "Atum",
                boats: 38
              }
            },
            {
              type: "Feature", 
              id: 4,
              geometry: { type: "Point", coordinates: [11.7543, -15.0234] },
              properties: {
                name: "Vila do Tombua",
                type: "Vila Pescatória",
                zone: "Sul",
                population: 1900,
                main_species: "Anchova",
                boats: 25
              }
            }
          ]
        }), { headers: CORS_HEADERS });
      }

      // Infraestruturas Pesqueiras
      if (path === '/collections/fishing_infrastructure/items') {
        return new Response(JSON.stringify({
          type: "FeatureCollection", 
          features: [
            {
              type: "Feature",
              id: 1,
              geometry: { type: "Point", coordinates: [13.2543, -8.8534] },
              properties: {
                name: "Fábrica de Conservas Luanda",
                type: "Fábrica",
                zone: "Norte",
                capacity: "500 ton/dia",
                products: "Conservas, Farinha"
              }
            },
            {
              type: "Feature",
              id: 2,
              geometry: { type: "Point", coordinates: [13.5743, -9.1434] },
              properties: {
                name: "Estaleiro Naval Lobito", 
                type: "Estaleiro",
                zone: "Centro",
                capacity: "20 barcos/mês",
                services: "Reparação, Construção"
              }
            },
            {
              type: "Feature",
              id: 3,
              geometry: { type: "Point", coordinates: [13.1743, -8.7434] },
              properties: {
                name: "Mercado do Peixe Luanda",
                type: "Mercado",
                zone: "Norte", 
                daily_volume: "50 toneladas",
                species: "Variadas"
              }
            },
            {
              type: "Feature",
              id: 4,
              geometry: { type: "Point", coordinates: [11.8743, -15.1434] },
              properties: {
                name: "Centro Frigorífico Namibe",
                type: "Frigorífico",
                zone: "Sul",
                capacity: "200 ton",
                temperature: "-18°C"
              }
            }
          ]
        }), { headers: CORS_HEADERS });
      }

      // Estatísticas de Pescas
      if (path === '/fisheries/statistics') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            total_ports: 24,
            total_villages: 156,
            total_infrastructure: 89,
            active_fishermen: 12500,
            annual_catch: 485000,
            zones: {
              north: { ports: 8, villages: 52, catch: 185000 },
              center: { ports: 9, villages: 67, catch: 195000 },
              south: { ports: 7, villages: 37, catch: 105000 }
            },
            species_distribution: {
              sardinha: 35,
              cavala: 25, 
              atum: 18,
              anchova: 12,
              outros: 10
            },
            last_updated: new Date().toISOString()
          }
        }), { headers: CORS_HEADERS });
      }

      // 🏠 Health Check
      if (path === '/health' || path === '/') {
        return new Response(JSON.stringify({
          status: 'healthy',
          service: 'BGAPP Admin API Worker',
          version: '2.2.0',
          timestamp: new Date().toISOString(),
          cloudflare: true,
          endpoints: [
            '/services', '/metrics', '/qgis/analyses', '/qgis/spatial-analysis',
            '/qgis/temporal-visualization', '/qgis/biomass-calculation',
            '/collections/fishing_ports/items', '/collections/fishing_villages/items',
            '/collections/fishing_infrastructure/items', '/fisheries/statistics'
          ]
        }), { headers: CORS_HEADERS });
      }

      // 404 para outros endpoints
      return new Response(JSON.stringify({
        success: false,
        error: 'Endpoint not found',
        available_endpoints: [
          '/health',
          '/api/dashboard/overview',
          '/admin-dashboard/system-health',
          '/admin-dashboard/oceanographic-data',
          '/admin-dashboard/fisheries-stats',
          '/api/services/status',
          '/api/reports',
          '/api/maps',
          '/api/maps/stats',
          '/api/maps/templates',
          '/api/maps/tools/categories',
          '/api/maps/tools/base-layers',
          '/api/maps/tools/validate',
          '/api/maps/tools/suggest-layers/{category}',
          '/api/maps/tools/optimize'
        ]
      }), { 
        status: 404, 
        headers: CORS_HEADERS 
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }), { 
        status: 500, 
        headers: CORS_HEADERS 
      });
    }
  }
};
