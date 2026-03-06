/**
 * 🌐 Neptune Environment Configuration - Simplified & Fixed
 * Configuração centralizada de URLs sem loops e problemas
 *
 * CORREÇÕES v2.2.0:
 * ✅ URLs simplificadas sem fallbacks complexos
 * ✅ Sem loops de retry que causam crashes
 * ✅ Detecção de ambiente simplificada
 * ✅ Configuração estável para produção
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

// 🎯 Detectar ambiente simplificado
const getEnvironment = (): EnvironmentConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development' ||
    (typeof window !== 'undefined' &&
     (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

  const isProduction = !isDevelopment;

  if (isDevelopment) {
    return {
      isDevelopment: true,
      isProduction: false,
      baseUrl: 'http://localhost:3000',
      apiUrl: 'https://bgapp-admin-api-worker.majearcasa.workers.dev',
      frontendUrl: 'https://bgapp-frontend.pages.dev',
      scientificInterfacesUrl: 'https://bgapp-frontend.pages.dev',
      externalServices: {
        stacBrowser: 'https://bgapp-stac.majearcasa.workers.dev',
        flowerMonitor: 'https://bgapp-monitor.majearcasa.workers.dev',
        minioConsole: 'https://bgapp-storage.majearcasa.workers.dev',
        pygeoapi: 'https://bgapp-pygeoapi.majearcasa.workers.dev'
      }
    };
  } else {
    return {
      isDevelopment: false,
      isProduction: true,
      baseUrl: 'https://bgapp-admin.pages.dev',
      apiUrl: 'https://bgapp-admin-api-worker.majearcasa.workers.dev',
      frontendUrl: 'https://bgapp-frontend.pages.dev',
      scientificInterfacesUrl: 'https://bgapp-frontend.pages.dev',
      externalServices: {
        stacBrowser: 'https://bgapp-stac.majearcasa.workers.dev',
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

// 🔧 Função de fetch simples sem loops problemáticos
export const fetchWithFallback = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = `${ENV.apiUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-BGAPP-Source': 'admin-dashboard',
        ...options.headers
      }
    });

    return response;
  } catch (error) {
    console.warn(`⚠️ Erro em ${url}:`, error);
    throw error;
  }
};

// 🔧 Debug info (apenas em desenvolvimento)
if (ENV.isDevelopment && typeof console !== 'undefined') {
  console.log('🌐 Neptune Environment Config:', ENV);
}
