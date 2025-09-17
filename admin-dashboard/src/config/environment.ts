/**
 * 🌐 BGAPP Environment Configuration - Silicon Valley Style Enhanced
 * Configuração centralizada de URLs e ambientes com compatibilidade
 * 
 * MELHORIAS v2.1.0:
 * ✅ URLs padronizadas com fallback
 * ✅ Compatibilidade mantida
 * ✅ Detecção automática de ambiente
 * ✅ Fallbacks para todas as páginas BGAPP
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
  // Novos campos para compatibilidade
  fallbackUrls: {
    apiUrl: string[];
    stacBrowser: string[];
    pygeoapi: string[];
  };
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
  };
}

// 🎯 Detectar ambiente automaticamente
const getEnvironment = (): EnvironmentConfig => {
  // Melhor detecção de ambiente
  let isDevelopment = false;
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    isDevelopment = hostname === 'localhost' || 
                   hostname === '127.0.0.1' || 
                   hostname.startsWith('192.168.') ||
                   hostname.includes('.local');
  } else {
    isDevelopment = process.env.NODE_ENV === 'development';
  }
  
  const isProduction = !isDevelopment;

  if (isDevelopment) {
    // 🔧 Ambiente de desenvolvimento local com fallbacks
    return {
      isDevelopment: true,
      isProduction: false,
      baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      apiUrl: 'https://bgapp-copernicus-official.majearcasa.workers.dev',
      frontendUrl: 'https://bgapp-frontend.pages.dev',
      scientificInterfacesUrl: 'https://bgapp-frontend.pages.dev',
      externalServices: {
        stacBrowser: 'https://bgapp-stac.majearcasa.workers.dev',
        flowerMonitor: 'https://bgapp-monitor.majearcasa.workers.dev',
        minioConsole: 'https://bgapp-storage.majearcasa.workers.dev',
        pygeoapi: 'https://bgapp-pygeoapi.majearcasa.workers.dev'
      },
      // URLs de fallback para garantir funcionamento
      fallbackUrls: {
        apiUrl: [
          'https://bgapp-copernicus-official.majearcasa.workers.dev',
          'https://bgapp-admin.majearcasa.workers.dev',
          'http://localhost:8000'
        ],
        stacBrowser: [
          'https://bgapp-stac.majearcasa.workers.dev',
          'https://bgapp-stac-worker.majearcasa.workers.dev',
          'http://localhost:8081'
        ],
        pygeoapi: [
          'https://bgapp-pygeoapi.majearcasa.workers.dev',
          'https://bgapp-geo.majearcasa.workers.dev',
          'http://localhost:5080'
        ]
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000
      }
    };
  } else {
    // 🚀 Ambiente de produção Cloudflare com fallbacks
    return {
      isDevelopment: false,
      isProduction: true,
      baseUrl: 'https://bgapp-admin.pages.dev',
      apiUrl: 'https://bgapp-copernicus-official.majearcasa.workers.dev',
      frontendUrl: 'https://bgapp-frontend.pages.dev',
      scientificInterfacesUrl: 'https://bgapp-frontend.pages.dev',
      externalServices: {
        stacBrowser: 'https://bgapp-stac.majearcasa.workers.dev',
        flowerMonitor: 'https://bgapp-monitor.majearcasa.workers.dev',
        minioConsole: 'https://bgapp-storage.majearcasa.workers.dev',
        pygeoapi: 'https://bgapp-pygeoapi.majearcasa.workers.dev'
      },
      // URLs de fallback para produção
      fallbackUrls: {
        apiUrl: [
          'https://bgapp-copernicus-official.majearcasa.workers.dev',
          'https://bgapp-admin.majearcasa.workers.dev',
          'https://bgapp-api.majearcasa.workers.dev'
        ],
        stacBrowser: [
          'https://bgapp-stac.majearcasa.workers.dev',
          'https://bgapp-stac-worker.majearcasa.workers.dev',
          'https://bgapp-stac-ocean.majearcasa.workers.dev'
        ],
        pygeoapi: [
          'https://bgapp-pygeoapi.majearcasa.workers.dev',
          'https://bgapp-geo.majearcasa.workers.dev',
          'https://bgapp-geoapi.majearcasa.workers.dev'
        ]
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000
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

// 🔄 Sistema de Retry com Fallback para garantir funcionamento
export const fetchWithFallback = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const urls = ENV.fallbackUrls.apiUrl.map(baseUrl => 
    `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
  );
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    
    for (let retry = 0; retry <= ENV.retryConfig.maxRetries; retry++) {
      try {
        console.log(`🔄 Tentativa ${retry + 1}/${ENV.retryConfig.maxRetries + 1} para ${url}`);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'X-BGAPP-Source': 'admin-dashboard',
            'X-BGAPP-Fallback-Attempt': `${i + 1}`,
            'X-BGAPP-Retry-Attempt': `${retry + 1}`,
            ...options.headers
          }
        });
        
        if (response.ok) {
          console.log(`✅ Sucesso com ${url}`);
          return response;
        }
        
        if (response.status >= 400 && response.status < 500) {
          // Erro do cliente, não retry
          throw new Error(`Client error: ${response.status} ${response.statusText}`);
        }
        
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Erro em ${url} (tentativa ${retry + 1}):`, error);
        
        // Esperar antes do próximo retry (exceto na última tentativa)
        if (retry < ENV.retryConfig.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, ENV.retryConfig.retryDelay));
        }
      }
    }
  }
  
  // Se chegou aqui, todas as URLs falharam
  throw new Error(`All API endpoints failed. Last error: ${lastError?.message}`);
};

// 🚫 MOCK DATA REMOVIDO - APENAS DADOS REAIS!
export const getMockApiResponse = (endpoint: string): any => {
  // MOCK DATA FOI ELIMINADO DESTA FASE
  console.warn('⚠️ Mock data foi eliminado - usando apenas dados reais');
  return { 
    success: false, 
    error: 'Mock data eliminado - apenas dados reais disponíveis',
    endpoint: endpoint,
    real_data_required: true
  };
};

// 🔧 Debug info (apenas em desenvolvimento)
if (ENV.isDevelopment && typeof window !== 'undefined') {
  console.log('🌐 BGAPP Environment Config:', ENV);
  console.log('🔧 Backend URL:', ENV.apiUrl);
  console.log('✅ Copernicus Endpoint:', `${ENV.apiUrl}/admin-dashboard/copernicus-advanced/real-time-data`);
}
