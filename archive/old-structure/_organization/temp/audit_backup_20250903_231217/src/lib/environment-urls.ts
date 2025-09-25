/**
 * 🌍 ENVIRONMENT URLS - Sistema Inteligente Batman & Robin
 * Gerenciamento automático de URLs baseado no ambiente
 */

export interface EnvironmentUrls {
  frontend: string;
  keycloak: string;
  minio: string;
  flower: string;
  stacBrowser: string;
  pygeoapi: string;
  adminApi: string;
  stacApi: string;
  workflow: string;
}

/**
 * 🔍 Detectar se está em ambiente local
 */
const isLocalEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

/**
 * 🎯 URLs por ambiente
 */
const ENVIRONMENT_URLS: Record<'development' | 'production', EnvironmentUrls> = {
  development: {
    frontend: 'http://localhost:8085',
    keycloak: 'http://localhost:8083',
    minio: 'http://localhost:9001',
    flower: 'http://localhost:5555',
    stacBrowser: 'http://localhost:8082',
    pygeoapi: 'http://localhost:5080',
    adminApi: 'http://localhost:8000',
    stacApi: 'http://localhost:8081',
    workflow: 'http://localhost:8787'
  },
  production: {
    frontend: 'https://bgapp-frontend.pages.dev',
    keycloak: 'https://bgapp-auth.majearcasa.workers.dev',
    minio: 'https://bgapp-storage.majearcasa.workers.dev',
    flower: 'https://bgapp-monitor.majearcasa.workers.dev',
    stacBrowser: 'https://bgapp-browser.majearcasa.workers.dev',
    pygeoapi: 'https://bgapp-geoapi.majearcasa.workers.dev',
    adminApi: 'https://bgapp-api.majearcasa.workers.dev',
    stacApi: 'https://bgapp-stac.majearcasa.workers.dev',
    workflow: 'https://bgapp-workflow.majearcasa.workers.dev'
  }
};

/**
 * 🚀 Obter URL do serviço baseado no ambiente
 */
export const getServiceUrl = (service: keyof EnvironmentUrls): string => {
  const environment = isLocalEnvironment() ? 'development' : 'production';
  return ENVIRONMENT_URLS[environment][service];
};

/**
 * 🎪 Abrir URL em nova aba com detecção automática de ambiente
 */
export const openServiceUrl = (service: keyof EnvironmentUrls): void => {
  const url = getServiceUrl(service);
  window.open(url, '_blank');
};

/**
 * 🔗 Obter URL completa para iframe
 */
export const getIframeUrl = (page: string): string => {
  const baseUrl = getServiceUrl('frontend');
  return `${baseUrl}/${page}`;
};

/**
 * 📊 Informações do ambiente atual
 */
export const getEnvironmentInfo = () => {
  const isLocal = isLocalEnvironment();
  return {
    environment: isLocal ? 'development' : 'production',
    isLocal,
    urls: ENVIRONMENT_URLS[isLocal ? 'development' : 'production']
  };
};

/**
 * 🧪 Utilitários para testes
 */
export const EnvironmentUtils = {
  isLocalEnvironment,
  getServiceUrl,
  openServiceUrl,
  getIframeUrl,
  getEnvironmentInfo
};

export default EnvironmentUtils;
