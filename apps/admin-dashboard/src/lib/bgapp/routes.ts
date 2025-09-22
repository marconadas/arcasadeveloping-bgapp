import {
  CpuChipIcon,
  MapIcon,
  CircleStackIcon,
  BeakerIcon,
  GlobeAltIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
  EyeIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  ServerIcon,
  FolderIcon,
  CogIcon,
  BellIcon,
  CircleStackIcon as DatabaseIcon
} from '@heroicons/react/24/outline';

/**
 * 🚀 BGAPP Routes System - Silicon Valley Grade A+
 * Sistema completo de roteamento para todas as funcionalidades BGAPP
 */

export interface BGAPPRoute {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  category: 'core' | 'ml' | 'qgis' | 'data' | 'scientific' | 'monitoring';
  description: string;
  badge?: string;
  isNew?: boolean;
  children?: BGAPPRoute[];
  requiresAuth?: boolean;
  component?: string;
  iframeUrl?: string;
}

export const bgappRoutes: BGAPPRoute[] = [
  // CORE SYSTEM
  {
    id: 'dashboard',
    label: 'Dashboard Principal',
    icon: ChartBarIcon,
    category: 'core',
    description: 'Visão geral do sistema BGAPP',
    component: 'DashboardOverview'
  },

  {
    id: 'services-integration',
    label: '🔗 Integração Completa Serviços',
    icon: ServerIcon,
    category: 'core',
    description: 'Conexão nativa com todos os 13 serviços',
    badge: 'SILICON VALLEY',
    isNew: true,
    component: 'ServicesIntegrationComplete'
  },

  // ENHANCED OCEAN SYSTEM
  {
    id: 'enhanced-ocean-system',
    label: '🌊 Enhanced Ocean System',
    icon: GlobeAltIcon,
    category: 'scientific',
    description: 'Sistema de renderização oceânica avançado com shaders Unreal Engine',
    badge: 'NOVO',
    isNew: true,
    component: 'EnhancedOceanSystem',
    iframeUrl: '/bgapp-enhanced-ocean-system.html'
  },

  // MACHINE LEARNING SYSTEM
  {
    id: 'ml-system',
    label: '🧠 Sistema Machine Learning',
    icon: CpuChipIcon,
    category: 'ml',
    description: 'Sistema completo de ML com 5 modelos avançados',
    badge: 'AI',
    isNew: true,
    children: [
      {
        id: 'ml-dashboard',
        label: 'ML Dashboard',
        icon: ChartBarIcon,
        category: 'ml',
        description: 'Visão geral dos modelos ML e performance',
        component: 'MLSystemDashboard'
      },
      {
        id: 'predictive-filters',
        label: 'Filtros Preditivos',
        icon: BeakerIcon,
        category: 'ml',
        description: '7 tipos de filtros preditivos com IA',
        badge: 'AI',
        isNew: true,
        component: 'PredictiveFiltersManager'
      },
      {
        id: 'models-manager',
        label: 'Gestor Modelos ML',
        icon: CpuChipIcon,
        category: 'ml',
        description: 'Gestão e treino dos 5 modelos ML',
        component: 'MLModelsManager'
      },
      {
        id: 'auto-ingestion',
        label: 'Auto-Ingestão ML',
        icon: CloudArrowUpIcon,
        category: 'ml',
        description: 'Pipeline automático de treino de modelos',
        component: 'MLAutoIngestion'
      },
      {
        id: 'ml-retention-system',
        label: '🧠 Base de Retenção ML',
        icon: CircleStackIcon,
        category: 'ml',
        description: 'Sistema de cache e otimização de performance ML',
        badge: 'PERFORMANCE',
        isNew: true,
        component: 'MLRetentionDashboard'
      }
    ]
  },

  // QGIS ADVANCED SYSTEM
  {
    id: 'qgis-advanced',
    label: '🗺️ QGIS Sistema Avançado',
    icon: MapIcon,
    category: 'qgis',
    description: 'Ferramentas QGIS avançadas com 25+ endpoints',
    badge: 'NOVO',
    isNew: true,
    children: [
      {
        id: 'spatial-analysis',
        label: 'Análise Espacial',
        icon: MapIcon,
        category: 'qgis',
        description: 'Buffer zones, conectividade, hotspots, corredores',
        component: 'QGISSpatialAnalysis'
      },
      {
        id: 'temporal-visualization',
        label: 'Visualização Temporal',
        icon: ChartBarIcon,
        category: 'qgis',
        description: 'Slider temporal, animações, migração animal',
        component: 'QGISTemporalVisualization'
      },
      {
        id: 'biomass-calculator',
        label: 'Calculadora de Biomassa',
        icon: BeakerIcon,
        category: 'qgis',
        description: 'Biomassa terrestre e marinha com modelos científicos',
        component: 'QGISBiomassCalculator'
      },
      {
        id: 'mcda-analysis',
        label: 'Análise MCDA/AHP',
        icon: ShieldCheckIcon,
        category: 'qgis',
        description: 'Análise multicritério para ordenamento espacial',
        component: 'QGISMCDAAnalysis'
      },
      {
        id: 'migration-overlay',
        label: 'Migração vs Pesca',
        icon: EyeIcon,
        category: 'qgis',
        description: 'Sobreposição de rotas migratórias e zonas de pesca',
        component: 'QGISMigrationOverlay'
      },
      {
        id: 'sustainable-zones',
        label: 'Zonas Sustentáveis',
        icon: ShieldCheckIcon,
        category: 'qgis',
        description: 'Análise de sustentabilidade e conservação',
        component: 'QGISSustainableZones'
      }
    ]
  },

  // DATA PROCESSING SYSTEM
  {
    id: 'data-processing',
    label: '📊 Processamento de Dados',
    icon: CircleStackIcon,
    category: 'data',
    description: 'Gestão de 13+ conectores e processamento',
    badge: 'NOVO',
    isNew: true,
    children: [
      {
        id: 'connectors-manager',
        label: 'Gestão Conectores',
        icon: CloudArrowUpIcon,
        category: 'data',
        description: '13+ conectores internacionais e regionais',
        component: 'DataConnectorsManager'
      },
      {
        id: 'processing-monitor',
        label: 'Monitor Processamento',
        icon: CpuChipIcon,
        category: 'data',
        description: 'Monitor de jobs assíncronos e filas Celery',
        component: 'ProcessingMonitorDashboard'
      },
      {
        id: 'quality-control',
        label: 'Controle Qualidade',
        icon: ShieldCheckIcon,
        category: 'data',
        description: 'Validação automática e detecção de outliers',
        component: 'DataQualityControl'
      },
      {
        id: 'workflows-manager',
        label: 'Gestor Workflows',
        icon: WrenchScrewdriverIcon,
        category: 'data',
        description: 'Workflows científicos automáticos',
        component: 'WorkflowsManager'
      }
    ]
  },

  // SCIENTIFIC INTERFACES HUB
  {
    id: 'scientific-hub',
    label: '🔬 Hub Científico',
    icon: BeakerIcon,
    category: 'scientific',
    description: 'Portal unificado para 41 interfaces científicas especializadas',
    badge: 'HUB',
    isNew: true,
    children: [
      {
        id: 'dashboard-cientifico',
        label: 'Dashboard Científico',
        icon: ChartBarIcon,
        category: 'scientific',
        description: 'Interface científica principal para dados oceanográficos',
        iframeUrl: 'https://bgapp-frontend.pages.dev/dashboard_cientifico.html',
        component: 'ScientificDashboard'
      },
      {
        id: 'realtime-angola',
        label: 'Realtime Angola',
        icon: EyeIcon,
        category: 'scientific',
        description: 'Dados oceanográficos em tempo real da costa angolana',
        iframeUrl: 'https://bgapp-frontend.pages.dev/realtime_angola.html',
        component: 'RealtimeAngola'
      },
      {
        id: 'ml-demo-deckgl-final',
        label: 'ML Demo deck.gl WebGL2',
        icon: ChartBarIcon,
        category: 'scientific',
        description: 'Demo avançado de Machine Learning com deck.gl WebGL2 e visualizações Unreal Engine',
        iframeUrl: 'https://bgapp-frontend.pages.dev/ml-demo-deckgl-final',
        component: 'MLDemoDecKGLFinal',
        badge: 'WebGL2',
        isNew: true
      },
      {
        id: 'qgis-tools',
        label: 'Ferramentas QGIS',
        icon: MapIcon,
        category: 'scientific',
        description: 'Interface QGIS para análise espacial avançada',
        children: [
          {
            id: 'qgis-dashboard',
            label: 'QGIS Dashboard',
            icon: MapIcon,
            category: 'scientific',
            description: 'Dashboard QGIS principal',
            iframeUrl: 'https://bgapp-frontend.pages.dev/qgis_dashboard.html'
          },
          {
            id: 'qgis-fisheries',
            label: 'QGIS Pescas',
            icon: MapIcon,
            category: 'scientific',
            description: 'Sistema QGIS para gestão pesqueira',
            iframeUrl: 'https://bgapp-frontend.pages.dev/qgis_fisheries.html'
          }
        ]
      },
      {
        id: 'weather-animations',
        label: 'Animações Meteorológicas',
        icon: BoltIcon,
        category: 'scientific',
        description: 'Animações avançadas de vento e correntes',
        iframeUrl: 'https://bgapp-frontend.pages.dev/bgapp-wind-animation-demo.html',
        component: 'WeatherAnimations'
      },
      {
        id: 'collaboration',
        label: 'Colaboração Científica',
        icon: GlobeAltIcon,
        category: 'scientific',
        description: 'Plataforma de colaboração para investigadores',
        iframeUrl: 'https://bgapp-frontend.pages.dev/collaboration.html',
        component: 'ScientificCollaboration'
      },
      {
        id: 'stac-oceanographic',
        label: 'STAC Oceanográfico',
        icon: CloudArrowUpIcon,
        category: 'scientific',
        description: 'Catálogo STAC para dados marinhos',
        iframeUrl: 'https://bgapp-frontend.pages.dev/stac.html',
        component: 'STACOceanographic'
      },
      {
        id: 'stac-enhanced',
        label: 'STAC Avançado',
        icon: DatabaseIcon,
        category: 'scientific',
        description: 'Interface STAC com bibliotecas expandidas - PySTAC, StackSTAC, Folium',
        component: 'EnhancedSTACInterface',
        badge: 'NOVO',
        isNew: true,
        features: ['PySTAC Client', 'StackSTAC', 'Folium Maps', 'Temporal Analysis', 'Multi-Catalog Search']
      },
      {
        id: 'mobile-interfaces',
        label: 'Interfaces Mobile',
        icon: DevicePhoneMobileIcon,
        category: 'scientific',
        description: 'Aplicações móveis e PWA',
        children: [
          {
            id: 'mobile-pwa',
            label: 'Mobile PWA Avançado',
            icon: DevicePhoneMobileIcon,
            category: 'scientific',
            description: 'Aplicação web progressiva otimizada',
            iframeUrl: 'https://bgapp-frontend.pages.dev/mobile_pwa.html'
          },
          {
            id: 'mobile-basic',
            label: 'Interface Mobile Básica',
            icon: DevicePhoneMobileIcon,
            category: 'scientific',
            description: 'Interface mobile simplificada',
            iframeUrl: 'https://bgapp-frontend.pages.dev/mobile.html'
          }
        ]
      }
    ]
  },

  // SYSTEM MONITORING
  {
    id: 'system-monitoring',
    label: '📈 Monitorização Sistema',
    icon: ChartBarIcon,
    category: 'monitoring',
    description: 'Monitorização completa do ecossistema',
    badge: 'NOVO',
    isNew: true,
    children: [
      {
        id: 'health-monitor',
        label: 'Monitor de Saúde',
        icon: ShieldCheckIcon,
        category: 'monitoring',
        description: 'Status de todos os 13 serviços',
        component: 'SystemHealthMonitor'
      },
      {
        id: 'performance-analytics',
        label: 'Analytics Performance',
        icon: ChartBarIcon,
        category: 'monitoring',
        description: 'Métricas de performance e uso',
        component: 'PerformanceAnalytics'
      },
      {
        id: 'alerts-center',
        label: 'Central de Alertas',
        icon: BellIcon,
        category: 'monitoring',
        description: 'Sistema de alertas e notificações',
        component: 'AlertsCenter'
      }
    ]
  }
];

/**
 * Função para encontrar rota por ID
 */
export function findRouteById(routes: BGAPPRoute[], id: string): BGAPPRoute | null {
  for (const route of routes) {
    if (route.id === id) {
      return route;
    }
    if (route.children) {
      const found = findRouteById(route.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Função para obter todas as rotas (flatten)
 */
export function getAllRoutes(routes: BGAPPRoute[] = bgappRoutes): BGAPPRoute[] {
  const allRoutes: BGAPPRoute[] = [];
  
  function collectRoutes(routeList: BGAPPRoute[]) {
    routeList.forEach(route => {
      allRoutes.push(route);
      if (route.children) {
        collectRoutes(route.children);
      }
    });
  }
  
  collectRoutes(routes);
  return allRoutes;
}

/**
 * Função para obter rotas por categoria
 */
export function getRoutesByCategory(category: string): BGAPPRoute[] {
  return getAllRoutes().filter(route => route.category === category);
}

/**
 * Função para buscar rotas
 */
export function searchRoutes(query: string): BGAPPRoute[] {
  const allRoutes = getAllRoutes();
  const lowercaseQuery = query.toLowerCase();
  
  return allRoutes.filter(route => 
    route.label.toLowerCase().includes(lowercaseQuery) ||
    route.description.toLowerCase().includes(lowercaseQuery) ||
    route.id.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Função para obter breadcrumbs
 */
export function getBreadcrumbs(routeId: string): BGAPPRoute[] {
  const breadcrumbs: BGAPPRoute[] = [];
  
  function findPath(routes: BGAPPRoute[], targetId: string, path: BGAPPRoute[]): boolean {
    for (const route of routes) {
      const currentPath = [...path, route];
      
      if (route.id === targetId) {
        breadcrumbs.push(...currentPath);
        return true;
      }
      
      if (route.children && findPath(route.children, targetId, currentPath)) {
        return true;
      }
    }
    return false;
  }
  
  findPath(bgappRoutes, routeId, []);
  return breadcrumbs;
}

/**
 * Configuração de navegação para sidebar
 */
export const navigationConfig = {
  routes: bgappRoutes,
  defaultRoute: 'dashboard',
  collapsibleSections: ['ml-system', 'qgis-advanced', 'data-processing', 'scientific-hub', 'system-monitoring'],
  pinnedRoutes: ['dashboard', 'bgapp-integration', 'services-integration'],
  recentRoutes: [] as string[],
  favoriteRoutes: [] as string[]
};

import { getServiceUrl } from '../environment-urls';

/**
 * URLs das interfaces HTML existentes
 */
export const htmlInterfaces = {
  // Core Interfaces
  admin: `${getServiceUrl('frontend')}/admin.html`,
  dashboard_cientifico: `${getServiceUrl('frontend')}/dashboard_cientifico.html`,
  realtime_angola: `${getServiceUrl('frontend')}/realtime_angola.html`,
  
  // QGIS Interfaces
  qgis_dashboard: `${getServiceUrl('frontend')}/qgis_dashboard.html`,
  qgis_fisheries: `${getServiceUrl('frontend')}/qgis_fisheries.html`,
  
  // Specialized Tools
  wind_animations: `${getServiceUrl('frontend')}/bgapp-wind-animation-demo.html`,
  collaboration: `${getServiceUrl('frontend')}/collaboration.html`,
  stac: `${getServiceUrl('frontend')}/stac.html`,
  
  // Mobile Interfaces
  mobile_pwa: `${getServiceUrl('frontend')}/mobile_pwa.html`,
  mobile_basic: `${getServiceUrl('frontend')}/mobile.html`,
  
  // Analysis Tools
  advanced_analysis: `${getServiceUrl('frontend')}/dashboard.html`,
  health_dashboard: `${getServiceUrl('frontend')}/health_dashboard.html`,
  
  // Demo and Enhanced
  bgapp_enhanced: `${getServiceUrl('frontend')}/bgapp-enhanced-demo.html`,
  ml_demo: `${getServiceUrl('frontend')}/ml-demo.html`,
  
  // MINPERMAR
  minpermar: `${getServiceUrl('frontend')}/minpermar/dist/index.html`,
  
  // External Services
  stac_browser: getServiceUrl('stacBrowser'),
  flower_monitor: getServiceUrl('flower'),
  minio_console: getServiceUrl('minio'),
  keycloak_admin: getServiceUrl('keycloak'),
  admin_api_docs: `${getServiceUrl('adminApi')}/docs`
};

export default {
  bgappRoutes,
  findRouteById,
  getAllRoutes,
  getRoutesByCategory,
  searchRoutes,
  getBreadcrumbs,
  navigationConfig,
  htmlInterfaces
};
