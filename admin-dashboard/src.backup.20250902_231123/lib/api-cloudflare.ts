/**
 * 🚀 BGAPP API Cloudflare - Sistema Híbrido Silicon Valley
 * API que funciona tanto com Workers quanto com fallback local
 */

import axios, { AxiosResponse } from 'axios';
import { ENV, getMockApiResponse } from '@/config/environment';

// 🔧 Configuração de timeout reduzido para fallback rápido
const API_TIMEOUT = 3000; // 3 segundos

// 🎯 Cliente API principal
const apiClient = axios.create({
  baseURL: ENV.apiUrl,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 🛡️ Interceptor para fallback automático
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    console.warn('🔄 API Error, using fallback:', error.message);
    return Promise.resolve({ data: null, status: 503 });
  }
);

// 🎯 Funções da API com fallback inteligente
export const bgappApiCloudflare = {
  // 📊 Dashboard Overview
  async getDashboardOverview() {
    try {
      const response = await apiClient.get('/api/dashboard/overview');
      if (response.data && response.status === 200) {
        return response.data;
      }
    } catch (error) {
      console.log('🔄 Using mock data for dashboard overview');
    }
    
    return getMockApiResponse('/api/dashboard/overview');
  },

  // 🏥 System Health
  async getSystemHealth() {
    try {
      const response = await apiClient.get('/admin-dashboard/system-health');
      if (response.data && response.status === 200) {
        return response.data;
      }
    } catch (error) {
      console.log('🔄 Using mock data for system health');
    }
    
    return getMockApiResponse('/admin-dashboard/system-health');
  },

  // 🌊 Oceanographic Data
  async getOceanographicData() {
    try {
      const response = await apiClient.get('/admin-dashboard/oceanographic-data');
      if (response.data && response.status === 200) {
        return response.data;
      }
    } catch (error) {
      console.log('🔄 Using mock data for oceanographic data');
    }
    
    return getMockApiResponse('/admin-dashboard/oceanographic-data');
  },

  // 🐟 Fisheries Stats
  async getFisheriesStats() {
    try {
      const response = await apiClient.get('/admin-dashboard/fisheries-stats');
      if (response.data && response.status === 200) {
        return response.data;
      }
    } catch (error) {
      console.log('🔄 Using mock data for fisheries stats');
    }
    
    return getMockApiResponse('/admin-dashboard/fisheries-stats');
  },

  // 🛰️ Copernicus Real Time Data
  async getCopernicusRealTimeData() {
    try {
      const response = await apiClient.get('/admin-dashboard/copernicus-advanced/real-time-data');
      if (response.data && response.status === 200) {
        return response.data;
      }
    } catch (error) {
      console.log('🔄 Using mock data for copernicus data');
    }
    
    return getMockApiResponse('/admin-dashboard/copernicus-advanced/real-time-data');
  },

  // 🔬 Scientific Interfaces
  async getScientificInterfaces() {
    const mockInterfaces = [
      {
        id: 'dashboard-cientifico',
        name: 'Dashboard Científico Angola',
        description: 'Interface científica principal para dados oceanográficos',
        url: '/dashboard_cientifico.html',
        category: 'analysis',
        isActive: true,
        lastAccessed: new Date().toISOString()
      },
      {
        id: 'realtime-angola',
        name: 'Tempo Real Angola',
        description: 'Dados oceanográficos em tempo real da costa angolana',
        url: '/realtime_angola.html',
        category: 'monitoring',
        isActive: true,
        lastAccessed: new Date().toISOString()
      },
      {
        id: 'qgis-dashboard',
        name: 'Dashboard QGIS',
        description: 'Interface QGIS integrada para análise espacial',
        url: '/qgis_dashboard.html',
        category: 'spatial',
        isActive: true,
        lastAccessed: new Date().toISOString()
      },
      {
        id: 'collaboration',
        name: 'Colaboração Científica',
        description: 'Plataforma de colaboração para investigadores',
        url: '/collaboration.html',
        category: 'analysis',
        isActive: true,
        lastAccessed: new Date().toISOString()
      },
      {
        id: 'stac-ocean',
        name: 'STAC Oceanográfico',
        description: 'Catálogo de dados marinhos e oceanográficos',
        url: '/stac_oceanographic.html',
        category: 'spatial',
        isActive: true,
        lastAccessed: new Date().toISOString()
      },
      {
        id: 'mobile-pwa',
        name: 'Mobile PWA',
        description: 'Aplicação progressiva para dispositivos móveis',
        url: '/mobile_pwa.html',
        category: 'mobile',
        isActive: true,
        lastAccessed: new Date().toISOString()
      }
    ];

    return { success: true, data: mockInterfaces };
  }
};

// 🔧 Debug info
if (ENV.isDevelopment && typeof window !== 'undefined') {
  console.log('🌐 BGAPP API Cloudflare initialized with:', ENV.apiUrl);
}
