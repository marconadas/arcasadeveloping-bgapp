/**
 * API Client para BGAPP Admin API COMPLETO
 * Integração NextJS com admin_api_complete.py
 * 🚀 Mister Silicon Valley Edition
 */

import axios, { AxiosResponse, AxiosError } from 'axios';

// API Configuration - Apontar para nosso admin_api_complete.py
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('bgapp_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      // Handle unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bgapp_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// =============================================================================
// TYPES
// =============================================================================

export interface DashboardOverview {
  system_status: {
    overall: string;
    uptime: string;
    last_update: string;
  };
  zee_angola: {
    area_km2: number;
    monitoring_stations: number;
    species_recorded: number;
    fishing_zones: number;
  };
  real_time_data: {
    sea_temperature: number;
    chlorophyll: number;
    wave_height: number;
    current_speed: number;
  };
  services: {
    copernicus: string;
    data_processing: string;
    monitoring: string;
    apis: string;
  };
  alerts: {
    active: number;
    resolved_today: number;
    total_this_week: number;
  };
  performance: {
    api_response_time: number;
    data_freshness: number;
    success_rate: number;
  };
}

export interface SystemHealth {
  overall_status: string;
  health_percentage: number;
  uptime: string;
  components: Record<string, any>;
  performance: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: string;
    api_response_time?: number;
  };
  statistics: {
    total_services: number;
    online_services: number;
    offline_services: number;
    total_endpoints: number;
    active_connections: number;
  };
  alerts: any[];
  last_check: string;
  timestamp: string;
}

export interface OceanographicData {
  region: string;
  area_km2: number;
  coordinates: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  current_conditions: Record<string, any>;
  data_sources: string[];
  monitoring_stations: number;
  satellite_passes_today: number;
}

export interface FisheriesStats {
  region: string;
  year: number;
  total_catch_tons: number;
  main_species: Array<{
    name: string;
    catch_tons: number;
    percentage: number;
    trend: string;
  }>;
  fishing_zones: Record<string, any>;
  sustainability_metrics: {
    overall_index: number;
    overfishing_risk: string;
    stock_status: string;
    conservation_measures: number;
  };
  economic_impact: {
    gdp_contribution_percent: number;
    employment_total: number;
    export_value_usd: number;
  };
}

export interface SpeciesSummary {
  region: string;
  total_species_recorded: number;
  categories: Record<string, { count: number; percentage: number }>;
  conservation_status: Record<string, number>;
  endemic_species: {
    total: number;
    fish: number;
    invertebrates: number;
    protection_status: string;
  };
  commercial_species: {
    total: number;
    high_value: number;
    medium_value: number;
    subsistence: number;
  };
  research_status: {
    last_comprehensive_survey: string;
    ongoing_studies: number;
    data_quality: string;
    coverage_percentage: number;
  };
  threats: Record<string, string>;
}

export interface CopernicusRealTimeData {
  status: string;
  data_source: string;
  region: string;
  real_time_data: {
    timestamp: string;
    parameters: Record<string, any>;
    coverage: {
      spatial: Record<string, number>;
      temporal: Record<string, string>;
    };
  };
  metadata: {
    satellites: string[];
    models: string[];
    processing_level: string;
    update_frequency: string;
    data_latency: string;
  };
  quality_flags: {
    overall_quality: string;
    data_completeness: number;
    spatial_coverage: number;
    temporal_consistency: string;
  };
}

export interface MapData {
  map_type: string;
  title: string;
  boundaries?: any;
  layers?: any[];
  center?: number[];
  zoom?: number;
  current_data?: Record<string, any>;
  species_layers?: any[];
  monitoring_points?: any[];
  biodiversity_hotspots?: any[];
  legend?: any;
}

export interface Connector {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  performance_score: number;
  data_quality: string;
}

export interface FisheriesChartData {
  monthly_catch: Array<{
    month: string;
    catch: number;
    species: string;
  }>;
  species_distribution: Array<{
    species: string;
    percentage: number;
    value: number;
  }>;
  regional_performance: Record<string, {
    catch: number;
    vessels: number;
    efficiency: number;
  }>;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

// Dashboard
export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const response = await api.get<DashboardOverview>('/api/dashboard/overview');
  return response.data;
};

// System Health
export const getSystemHealth = async (): Promise<SystemHealth> => {
  const response = await api.get<SystemHealth>('/admin-dashboard/system-health');
  return response.data;
};

// Initialize Dashboard
export const initializeDashboard = async (): Promise<any> => {
  const response = await api.get('/admin-dashboard/initialize');
  return response.data;
};

// Copernicus
export const getCopernicusStatus = async (): Promise<any> => {
  const response = await api.get('/admin-dashboard/copernicus-status');
  return response.data;
};

export const getCopernicusRealTimeData = async (): Promise<CopernicusRealTimeData> => {
  const response = await api.get<CopernicusRealTimeData>('/admin-dashboard/copernicus-advanced/real-time-data');
  return response.data;
};

export const getCopernicusStatusSummary = async (): Promise<any> => {
  const response = await api.get('/admin-dashboard/copernicus-advanced/status-summary');
  return response.data;
};

export const getCopernicusRequestStatus = async (requestId: string): Promise<any> => {
  const response = await api.get(`/admin-dashboard/copernicus-advanced/request/${requestId}/status`);
  return response.data;
};

// Oceanographic Data
export const getOceanographicData = async (): Promise<OceanographicData> => {
  const response = await api.get<OceanographicData>('/admin-dashboard/oceanographic-data');
  return response.data;
};

// Fisheries
export const getFisheriesStats = async (): Promise<FisheriesStats> => {
  const response = await api.get<FisheriesStats>('/admin-dashboard/fisheries-stats');
  return response.data;
};

export const getFisheriesReport = async (): Promise<any> => {
  const response = await api.get('/admin-dashboard/reports/fisheries');
  return response.data;
};

export const getFisheriesChartData = async (): Promise<FisheriesChartData> => {
  const response = await api.get<FisheriesChartData>('/api/dashboard/charts/fisheries');
  return response.data;
};

// Species & Biodiversity
export const getSpeciesSummary = async (): Promise<SpeciesSummary> => {
  const response = await api.get<SpeciesSummary>('/admin-dashboard/species-summary');
  return response.data;
};

// ZEE Angola
export const getZeeAngolaInfo = async (): Promise<any> => {
  const response = await api.get('/admin-dashboard/zee-angola-info');
  return response.data;
};

// Maps
export const getZeeAngolaMap = async (): Promise<MapData> => {
  const response = await api.get<MapData>('/admin-dashboard/maps/zee-angola');
  return response.data;
};

export const getOceanographicMap = async (): Promise<MapData> => {
  const response = await api.get<MapData>('/admin-dashboard/maps/oceanographic');
  return response.data;
};

export const getSpeciesDistributionMap = async (): Promise<MapData> => {
  const response = await api.get<MapData>('/admin-dashboard/maps/species-distribution');
  return response.data;
};

// Connectors
export const getConnectors = async (): Promise<{ connectors: Connector[]; total: number; summary: any }> => {
  const response = await api.get('/connectors');
  return response.data;
};

export const runConnector = async (connectorId: string): Promise<any> => {
  const response = await api.post(`/connectors/${connectorId}/run`);
  return response.data;
};

// Processing Pipelines
export const getProcessingPipelines = async (): Promise<any[]> => {
  const response = await api.get('/processing/pipelines');
  return response.data;
};

// Services Status
export const getServices = async (): Promise<any[]> => {
  const response = await api.get('/services');
  return response.data;
};

export const getServicesStatus = async (): Promise<any> => {
  const response = await api.get('/services/status');
  return response.data;
};

export const restartService = async (serviceName: string): Promise<any> => {
  const response = await api.post(`/services/${serviceName}/restart`);
  return response.data;
};

// Health Check
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  const response = await api.get('/health');
  return response.data;
};

// =============================================================================
// EXPORT API OBJECT
// =============================================================================

export const bgappApi = {
  // Dashboard
  getDashboardOverview,
  initializeDashboard,
  
  // System
  getSystemHealth,
  healthCheck,
  
  // Copernicus
  getCopernicusStatus,
  getCopernicusRealTimeData,
  getCopernicusStatusSummary,
  getCopernicusRequestStatus,
  
  // Oceanographic
  getOceanographicData,
  
  // Fisheries
  getFisheriesStats,
  getFisheriesReport,
  getFisheriesChartData,
  
  // Species
  getSpeciesSummary,
  
  // ZEE Angola
  getZeeAngolaInfo,
  
  // Maps
  getZeeAngolaMap,
  getOceanographicMap,
  getSpeciesDistributionMap,
  
  // Connectors
  getConnectors,
  runConnector,
  
  // Processing
  getProcessingPipelines,
  
  // Services
  getServices,
  getServicesStatus,
  restartService,
};

export default bgappApi;
