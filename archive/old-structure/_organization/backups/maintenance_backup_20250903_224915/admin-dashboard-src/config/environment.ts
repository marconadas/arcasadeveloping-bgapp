/**
 * 🌐 BGAPP Environment Configuration - Silicon Valley Style
 * Configuração centralizada de URLs e ambientes
 */

export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  baseUrl: string;
  apiUrl: string;
  frontendUrl: string;
  scientificInterfacesUrl: string;
  externalServices: {
    stacBrowser: string;
    flowerMonitor: string;
    minioConsole: string;
    pygeoapi: string;
  };
}

// 🎯 Detectar ambiente automaticamente
const getEnvironment = (): EnvironmentConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  
  const isProduction = !isDevelopment;

  if (isDevelopment) {
    // 🔧 Ambiente de desenvolvimento local
    return {
      isDevelopment: true,
      isProduction: false,
      baseUrl: 'http://localhost:3000',
      apiUrl: 'https://bgapp-api-worker.majearcasa.workers.dev',
      frontendUrl: 'https://bgapp-frontend.pages.dev',
      scientificInterfacesUrl: 'https://bgapp-frontend.pages.dev',
      externalServices: {
        stacBrowser: 'https://bgapp-frontend.pages.dev/stac_oceanographic',
        flowerMonitor: 'https://bgapp-monitor.majearcasa.workers.dev',
        minioConsole: 'https://bgapp-storage.majearcasa.workers.dev',
        pygeoapi: 'https://bgapp-pygeoapi.majearcasa.workers.dev'
      }
    };
  } else {
    // 🚀 Ambiente de produção Cloudflare
    return {
      isDevelopment: false,
      isProduction: true,
      baseUrl: 'https://bgapp-admin.pages.dev',
      apiUrl: 'https://bgapp-admin-api.majearcasa.workers.dev',
      frontendUrl: 'https://bgapp-frontend.pages.dev',
      scientificInterfacesUrl: 'https://bgapp-frontend.pages.dev',
      externalServices: {
        stacBrowser: 'https://bgapp-frontend.pages.dev/stac_oceanographic',
        flowerMonitor: 'https://bgapp-monitor.majearcasa.workers.dev',
        minioConsole: 'https://bgapp-storage.majearcasa.workers.dev',
        pygeoapi: 'https://bgapp-pygeoapi.majearcasa.workers.dev'
      }
    };
  }
};

export const ENV = getEnvironment();

// 🎯 Helper functions para URLs
export const getScientificInterfaceUrl = (path: string): string => {
  return `${ENV.scientificInterfacesUrl}${path.startsWith('/') ? path : '/' + path}`;
};

export const getExternalServiceUrl = (service: keyof typeof ENV.externalServices): string => {
  return ENV.externalServices[service];
};

export const getApiUrl = (endpoint: string): string => {
  return `${ENV.apiUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

// 🔧 Mock data para quando APIs não estão disponíveis
export const getMockApiResponse = (endpoint: string): any => {
  const mockData = {
    '/api/dashboard/overview': {
      success: true,
      data: {
        servicesOnline: 7,
        totalServices: 7,
        healthPercentage: 100,
        uptime: '99.9%',
        lastUpdate: new Date().toISOString()
      }
    },
    '/admin-dashboard/system-health': {
      success: true,
      data: {
        status: 'healthy',
        services: ['frontend', 'api-worker', 'kv-storage', 'cache-engine'],
        uptime: '99.9%'
      }
    },
    '/admin-dashboard/oceanographic-data': {
      success: true,
      data: {
        temperature: 24.5,
        salinity: 35.2,
        currentSpeed: 0.8,
        lastUpdate: new Date().toISOString()
      }
    },
    '/admin-dashboard/fisheries-stats': {
      success: true,
      data: {
        activeFisheries: 45,
        totalCatch: 12500,
        sustainability: 'good',
        lastUpdate: new Date().toISOString()
      }
    },
    '/admin-dashboard/copernicus-advanced/real-time-data': {
      success: true,
      data: {
        sst: 25.3,
        chlorophyll: 0.8,
        waves: 1.2,
        lastUpdate: new Date().toISOString()
      }
    }
  };
  
  return mockData[endpoint] || { success: false, error: 'Endpoint not found' };
};

// 🔧 Debug info (apenas em desenvolvimento)
if (ENV.isDevelopment && typeof window !== 'undefined') {
  console.log('🌐 BGAPP Environment Config:', ENV);
}
