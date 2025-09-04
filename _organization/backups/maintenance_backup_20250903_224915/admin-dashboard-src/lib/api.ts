import axios, { AxiosResponse, AxiosError } from 'axios';
import type { 
  ApiResponse, 
  PaginatedResponse,
  ServiceStatus,
  SystemMetrics,
  Connector,
  IngestJob,
  MLModel,
  BackupInfo,
  Alert,
  CacheStats,
  AsyncTask,
  DatabaseTable,
  STACCollection,
  APIEndpoint,
  User,
  AuditEvent,
  BiodiversityStudy,
  MaxEntModel,
  CoastalAnalysis,
  MaritimeBoundary,
  DashboardStats
} from '@/types';

import { ENV, getApiUrl, getExternalServiceUrl } from '@/config/environment';

// API Configuration - Silicon Valley Style com auto-detecção de ambiente
const API_BASE_URL = ENV.apiUrl;
const ML_API_URL = ENV.apiUrl; // Same as Admin API
const STAC_API_URL = getExternalServiceUrl('stacBrowser');
const PYGEOAPI_URL = ENV.isDevelopment ? 'http://localhost:5080' : 'https://bgapp-pygeoapi.majearcasa.workers.dev';
const MINIO_API_URL = ENV.isDevelopment ? 'http://localhost:9001' : 'https://bgapp-storage.majearcasa.workers.dev';
const FLOWER_API_URL = ENV.isDevelopment ? 'http://localhost:5555' : 'https://bgapp-monitor.majearcasa.workers.dev';
const KEYCLOAK_URL = ENV.isDevelopment ? 'http://localhost:8083' : 'https://bgapp-auth.majearcasa.workers.dev';

// Create axios instances for all services
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const mlApi = axios.create({
  baseURL: ML_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const stacApi = axios.create({
  baseURL: STAC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const pygeoapiApi = axios.create({
  baseURL: PYGEOAPI_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const minioApi = axios.create({
  baseURL: MINIO_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const flowerApi = axios.create({
  baseURL: FLOWER_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const keycloakApi = axios.create({
  baseURL: KEYCLOAK_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptors
adminApi.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

mlApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptors - DEFINIR FUNÇÕES PRIMEIRO
const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.success) {
    return response.data.data as T;
  }
  throw new Error(response.data.message || 'API request failed');
};

const handleApiError = (error: AxiosError): never => {
  if (error.response?.status === 401) {
    // Handle unauthorized - redirect to login
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  }
  
  const message = (error.response?.data as any)?.message || error.message || 'Unknown error';
  throw new Error(message);
};

// Add interceptors for all new API clients
[stacApi, pygeoapiApi, minioApi, flowerApi, keycloakApi].forEach(apiClient => {
  apiClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    (response) => response,
    handleApiError
  );
});

adminApi.interceptors.response.use(
  (response) => response,
  handleApiError
);

mlApi.interceptors.response.use(
  (response) => response,
  handleApiError
);

// API Functions

// Dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await adminApi.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return handleApiResponse(response);
};

// Services
export const getServices = async (): Promise<ServiceStatus[]> => {
  const response = await adminApi.get<ApiResponse<ServiceStatus[]>>('/services');
  return handleApiResponse(response);
};

export const startService = async (serviceName: string): Promise<void> => {
  const response = await adminApi.post<ApiResponse>(`/services/${serviceName}/start`);
  handleApiResponse(response);
};

export const stopService = async (serviceName: string): Promise<void> => {
  const response = await adminApi.post<ApiResponse>(`/services/${serviceName}/stop`);
  handleApiResponse(response);
};

export const restartService = async (serviceName: string): Promise<void> => {
  const response = await adminApi.post<ApiResponse>(`/services/${serviceName}/restart`);
  handleApiResponse(response);
};

// System Metrics
export const getSystemMetrics = async (): Promise<SystemMetrics> => {
  const response = await adminApi.get<ApiResponse<SystemMetrics>>('/metrics');
  return handleApiResponse(response);
};

export const getMetricsHistory = async (hours: number = 24): Promise<SystemMetrics[]> => {
  const response = await adminApi.get<ApiResponse<SystemMetrics[]>>(`/metrics/history?hours=${hours}`);
  return handleApiResponse(response);
};

// Connectors
export const getConnectors = async (): Promise<Connector[]> => {
  const response = await adminApi.get<ApiResponse<Connector[]>>('/connectors');
  return handleApiResponse(response);
};

export const runConnector = async (connectorId: string, config?: Record<string, any>): Promise<IngestJob> => {
  const response = await adminApi.post<ApiResponse<IngestJob>>(`/connectors/${connectorId}/run`, config);
  return handleApiResponse(response);
};

export const getConnectorJobs = async (limit: number = 50): Promise<IngestJob[]> => {
  const response = await adminApi.get<ApiResponse<IngestJob[]>>(`/ingest/jobs?limit=${limit}`);
  return handleApiResponse(response);
};

// Machine Learning
export const getMLModels = async (): Promise<MLModel[]> => {
  const response = await mlApi.get<ApiResponse<MLModel[]>>('/ml/models');
  return handleApiResponse(response);
};

export const trainModel = async (modelType: string): Promise<void> => {
  const response = await mlApi.post<ApiResponse>(`/ml/train/${modelType}`);
  handleApiResponse(response);
};

export const getMLStats = async (): Promise<any> => {
  const response = await mlApi.get<ApiResponse>('/ml/stats');
  return handleApiResponse(response);
};

export const makePrediction = async (modelId: string, features: Record<string, any>): Promise<any> => {
  const response = await mlApi.post<ApiResponse>('/ml/predict', { modelId, features });
  return handleApiResponse(response);
};

// Biodiversity Studies
export const getBiodiversityStudies = async (page: number = 1, pageSize: number = 50): Promise<PaginatedResponse<BiodiversityStudy>> => {
  const response = await mlApi.get<ApiResponse<PaginatedResponse<BiodiversityStudy>>>(`/biodiversity-studies?page=${page}&pageSize=${pageSize}`);
  return handleApiResponse(response);
};

export const getBiodiversityStats = async (): Promise<any> => {
  const response = await mlApi.get<ApiResponse>('/biodiversity-studies/stats');
  return handleApiResponse(response);
};

// MaxEnt Models
export const getMaxEntModels = async (): Promise<MaxEntModel[]> => {
  const response = await mlApi.get<ApiResponse<MaxEntModel[]>>('/maxent/models');
  return handleApiResponse(response);
};

export const runMaxEntModel = async (speciesId: string): Promise<void> => {
  const response = await mlApi.post<ApiResponse>('/maxent/run', { speciesId });
  handleApiResponse(response);
};

// Database
export const getDatabaseTables = async (schema: string = 'public'): Promise<DatabaseTable[]> => {
  const response = await adminApi.get<ApiResponse<DatabaseTable[]>>(`/database/tables/${schema}`);
  return handleApiResponse(response);
};

export const executeQuery = async (query: string): Promise<any[]> => {
  const response = await adminApi.post<ApiResponse<any[]>>('/database/query', { query });
  return handleApiResponse(response);
};

// STAC Collections - INTEGRAÇÃO NATIVA
export const getSTACCollections = async (): Promise<STACCollection[]> => {
  try {
    // Tentar STAC API direta primeiro
    const response = await stacApi.get<any>('/collections');
    
    // Converter formato STAC para formato esperado
    if (response.data && response.data.collections) {
      return response.data.collections.map((collection: any) => ({
        id: collection.id,
        title: collection.title || collection.id,
        description: collection.description || '',
        extent: collection.extent,
        keywords: collection.keywords || [],
        providers: collection.providers || [],
        license: collection.license || '',
        itemCount: collection.summaries?.['eo:count'] || 0,
        lastUpdated: new Date().toISOString()
      }));
    }
    
    // Fallback para Admin API se STAC falhar
    const fallbackResponse = await adminApi.get<ApiResponse<STACCollection[]>>('/stac/collections');
    return handleApiResponse(fallbackResponse);
  } catch (error) {
    console.warn('STAC API failed, using Admin API fallback:', error);
    const response = await adminApi.get<ApiResponse<STACCollection[]>>('/stac/collections');
    return handleApiResponse(response);
  }
};

export const getSTACCollection = async (collectionId: string): Promise<any> => {
  try {
    const response = await stacApi.get<any>(`/collections/${collectionId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch STAC collection ${collectionId}: ${error}`);
  }
};

export const getSTACItems = async (collectionId: string, limit: number = 10): Promise<any> => {
  try {
    const response = await stacApi.get<any>(`/collections/${collectionId}/items?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch STAC items for ${collectionId}: ${error}`);
  }
};

// pygeoapi Integration - OGC API Features
export const getPygeoapiCollections = async (): Promise<any[]> => {
  try {
    const response = await pygeoapiApi.get<any>('/collections');
    return response.data.collections || [];
  } catch (error) {
    console.warn('pygeoapi failed:', error);
    throw new Error(`Failed to fetch pygeoapi collections: ${error}`);
  }
};

export const getPygeoapiCollection = async (collectionId: string): Promise<any> => {
  try {
    const response = await pygeoapiApi.get<any>(`/collections/${collectionId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch pygeoapi collection ${collectionId}: ${error}`);
  }
};

export const getPygeoapiFeatures = async (collectionId: string, limit: number = 100): Promise<any> => {
  try {
    const response = await pygeoapiApi.get<any>(`/collections/${collectionId}/items?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch features for ${collectionId}: ${error}`);
  }
};

export const getPygeoapiProcesses = async (): Promise<any[]> => {
  try {
    const response = await pygeoapiApi.get<any>('/processes');
    return response.data.processes || [];
  } catch (error) {
    console.warn('pygeoapi processes failed:', error);
    return [];
  }
};

// MinIO Storage - INTEGRAÇÃO DIRETA
export const getMinIOBuckets = async (): Promise<any[]> => {
  try {
    // Tentar acesso direto ao MinIO primeiro
    const response = await minioApi.get<any>('/minio/admin/v3/list-buckets');
    return response.data.buckets || [];
  } catch (error) {
    console.warn('MinIO direct access failed, using Admin API:', error);
    // Fallback para Admin API
    const response = await adminApi.get<ApiResponse<any[]>>('/storage/buckets');
    return handleApiResponse(response);
  }
};

export const getMinIOBucketInfo = async (bucketName: string): Promise<any> => {
  try {
    const response = await adminApi.get<ApiResponse<any>>(`/storage/buckets/${bucketName}/info`);
    return handleApiResponse(response);
  } catch (error) {
    throw new Error(`Failed to get bucket info for ${bucketName}: ${error}`);
  }
};

export const getMinIOBucketObjects = async (bucketName: string, prefix?: string): Promise<any[]> => {
  try {
    const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    const response = await adminApi.get<ApiResponse<any[]>>(`/storage/buckets/${bucketName}/objects${params}`);
    return handleApiResponse(response);
  } catch (error) {
    throw new Error(`Failed to list objects in bucket ${bucketName}: ${error}`);
  }
};

export const getStorageStats = async (): Promise<any> => {
  const response = await adminApi.get<ApiResponse>('/storage/stats');
  return handleApiResponse(response);
};

// Cache
export const getCacheStats = async (): Promise<CacheStats> => {
  const response = await adminApi.get<ApiResponse<CacheStats>>('/cache/stats');
  return handleApiResponse(response);
};

export const clearCache = async (): Promise<void> => {
  const response = await adminApi.post<ApiResponse>('/cache/clear');
  handleApiResponse(response);
};

export const warmUpCache = async (): Promise<void> => {
  const response = await adminApi.post<ApiResponse>('/cache/warmup');
  handleApiResponse(response);
};

// Celery/Flower Integration - INTEGRAÇÃO NATIVA
export const getAsyncTasks = async (): Promise<AsyncTask[]> => {
  try {
    // Tentar Flower API primeiro
    const response = await flowerApi.get<any>('/api/tasks');
    
    // Converter formato Flower para formato esperado
    const tasks = Object.entries(response.data || {}).map(([taskId, task]: [string, any]) => ({
      id: taskId,
      name: task.name || 'Unknown Task',
      status: task.state?.toLowerCase() || 'pending',
      startTime: task.timestamp ? new Date(task.timestamp * 1000).toISOString() : new Date().toISOString(),
      endTime: task.received ? new Date(task.received * 1000).toISOString() : undefined,
      result: task.result,
      error: task.traceback,
      worker: task.worker,
      queue: task.routing_key || 'default',
      progress: task.progress || 0
    }));
    
    return tasks;
  } catch (error) {
    console.warn('Flower API failed, using Admin API:', error);
    // Fallback para Admin API
    const response = await adminApi.get<ApiResponse<AsyncTask[]>>('/async/tasks');
    return handleApiResponse(response);
  }
};

export const getFlowerWorkers = async (): Promise<any[]> => {
  try {
    const response = await flowerApi.get<any>('/api/workers');
    return Object.entries(response.data || {}).map(([name, worker]: [string, any]) => ({
      name,
      status: worker.status || 'offline',
      active: worker.active || 0,
      processed: worker.processed || 0,
      loadavg: worker.loadavg || [],
      lastHeartbeat: worker.timestamp ? new Date(worker.timestamp * 1000).toISOString() : null
    }));
  } catch (error) {
    console.warn('Failed to fetch Flower workers:', error);
    return [];
  }
};

export const getFlowerTaskTypes = async (): Promise<any[]> => {
  try {
    const response = await flowerApi.get<any>('/api/task/types');
    return Object.entries(response.data || {}).map(([name, stats]: [string, any]) => ({
      name,
      total: stats.total || 0,
      success: stats.success || 0,
      failure: stats.failure || 0,
      retry: stats.retry || 0
    }));
  } catch (error) {
    console.warn('Failed to fetch task types:', error);
    return [];
  }
};

// Alerts
export const getAlerts = async (): Promise<Alert[]> => {
  const response = await adminApi.get<ApiResponse<Alert[]>>('/alerts');
  return handleApiResponse(response);
};

export const acknowledgeAlert = async (alertId: string): Promise<void> => {
  const response = await adminApi.post<ApiResponse>(`/alerts/${alertId}/acknowledge`);
  handleApiResponse(response);
};

// Backup
export const getBackups = async (): Promise<BackupInfo[]> => {
  const response = await adminApi.get<ApiResponse<BackupInfo[]>>('/backup');
  return handleApiResponse(response);
};

export const createBackup = async (type: 'full' | 'database' | 'files'): Promise<BackupInfo> => {
  const response = await adminApi.post<ApiResponse<BackupInfo>>('/backup/create', { type });
  return handleApiResponse(response);
};

// Users
export const getUsers = async (): Promise<User[]> => {
  const response = await adminApi.get<ApiResponse<User[]>>('/users');
  return handleApiResponse(response);
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  const response = await adminApi.post<ApiResponse<User>>('/users', userData);
  return handleApiResponse(response);
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  const response = await adminApi.put<ApiResponse<User>>(`/users/${userId}`, userData);
  return handleApiResponse(response);
};

export const deleteUser = async (userId: string): Promise<void> => {
  const response = await adminApi.delete<ApiResponse>(`/users/${userId}`);
  handleApiResponse(response);
};

// API Endpoints
export const getAPIEndpoints = async (): Promise<APIEndpoint[]> => {
  const response = await adminApi.get<ApiResponse<APIEndpoint[]>>('/api/endpoints');
  return handleApiResponse(response);
};

// Audit
export const getAuditEvents = async (page: number = 1, pageSize: number = 50): Promise<PaginatedResponse<AuditEvent>> => {
  const response = await adminApi.get<ApiResponse<PaginatedResponse<AuditEvent>>>(`/audit/events?page=${page}&pageSize=${pageSize}`);
  return handleApiResponse(response);
};

export const exportAuditData = async (hours: number = 24): Promise<Blob> => {
  const response = await adminApi.get(`/audit/export?hours=${hours}`, {
    responseType: 'blob'
  });
  return response.data;
};

// Coastal Analysis
export const getCoastalAnalysis = async (): Promise<CoastalAnalysis[]> => {
  const response = await adminApi.get<ApiResponse<CoastalAnalysis[]>>('/coastal/analysis');
  return handleApiResponse(response);
};

export const runCoastalAnalysis = async (region: string): Promise<CoastalAnalysis> => {
  const response = await adminApi.post<ApiResponse<CoastalAnalysis>>('/coastal/analyze', { region });
  return handleApiResponse(response);
};

// Maritime Boundaries
export const getMaritimeBoundaries = async (): Promise<MaritimeBoundary[]> => {
  const response = await adminApi.get<ApiResponse<MaritimeBoundary[]>>('/boundaries');
  return handleApiResponse(response);
};

export const processBoundaries = async (): Promise<void> => {
  const response = await adminApi.post<ApiResponse>('/boundaries/process');
  handleApiResponse(response);
};

// Reports
export const getReports = async (): Promise<any[]> => {
  const response = await adminApi.get<ApiResponse<any[]>>('/reports');
  return handleApiResponse(response);
};

export const generateReport = async (type: string, config: Record<string, any>): Promise<any> => {
  const response = await adminApi.post<ApiResponse>('/reports/generate', { type, config });
  return handleApiResponse(response);
};

// Health Check
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  const response = await adminApi.get<ApiResponse<{ status: string; timestamp: string }>>('/health');
  return handleApiResponse(response);
};

// Configuration
export const getSystemConfig = async (): Promise<Record<string, any>> => {
  const response = await adminApi.get<ApiResponse<Record<string, any>>>('/config');
  return handleApiResponse(response);
};

export const updateSystemConfig = async (config: Record<string, any>): Promise<void> => {
  const response = await adminApi.put<ApiResponse>('/config', config);
  handleApiResponse(response);
};

// Logs
export const getLogs = async (level?: string, limit: number = 100): Promise<any[]> => {
  const params = new URLSearchParams();
  if (level) params.append('level', level);
  params.append('limit', limit.toString());
  
  const response = await adminApi.get<ApiResponse<any[]>>(`/logs?${params}`);
  return handleApiResponse(response);
};

export const clearLogs = async (): Promise<void> => {
  const response = await adminApi.delete<ApiResponse>('/logs');
  handleApiResponse(response);
};

// Keycloak Integration - INTEGRAÇÃO NATIVA
export const getKeycloakRealms = async (): Promise<any[]> => {
  try {
    const response = await keycloakApi.get<any>('/admin/realms');
    return response.data || [];
  } catch (error) {
    console.warn('Keycloak API failed:', error);
    return [];
  }
};

export const getKeycloakUsers = async (realm: string = 'bgapp'): Promise<any[]> => {
  try {
    const response = await keycloakApi.get<any>(`/admin/realms/${realm}/users`);
    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch Keycloak users:', error);
    return [];
  }
};

export const getKeycloakClients = async (realm: string = 'bgapp'): Promise<any[]> => {
  try {
    const response = await keycloakApi.get<any>(`/admin/realms/${realm}/clients`);
    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch Keycloak clients:', error);
    return [];
  }
};

export const getKeycloakSessions = async (realm: string = 'bgapp'): Promise<any[]> => {
  try {
    const response = await keycloakApi.get<any>(`/admin/realms/${realm}/sessions`);
    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch Keycloak sessions:', error);
    return [];
  }
};

// =============================================================================
// MAPS API - SISTEMA COMPLETO DE GESTÃO DE MAPAS
// =============================================================================

export const getMaps = async (): Promise<ApiResponse<BGAPPMap[]>> => {
  try {
    const response: AxiosResponse<ApiResponse<BGAPPMap[]>> = await adminApi.get('/api/maps');
    return response.data;
  } catch (error) {
    logger.error('Erro ao obter mapas:', error);
    throw error;
  }
};

export const getMapById = async (mapId: string): Promise<ApiResponse<BGAPPMap>> => {
  try {
    const response: AxiosResponse<ApiResponse<BGAPPMap>> = await adminApi.get(`/api/maps/${mapId}`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao obter mapa ${mapId}:`, error);
    throw error;
  }
};

export const createMap = async (mapData: any): Promise<ApiResponse<BGAPPMap>> => {
  try {
    const response: AxiosResponse<ApiResponse<BGAPPMap>> = await adminApi.post('/api/maps', mapData);
    return response.data;
  } catch (error) {
    logger.error('Erro ao criar mapa:', error);
    throw error;
  }
};

export const updateMap = async (mapId: string, updates: any): Promise<ApiResponse<BGAPPMap>> => {
  try {
    const response: AxiosResponse<ApiResponse<BGAPPMap>> = await adminApi.put(`/api/maps/${mapId}`, updates);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao atualizar mapa ${mapId}:`, error);
    throw error;
  }
};

export const deleteMap = async (mapId: string): Promise<ApiResponse<any>> => {
  try {
    const response: AxiosResponse<ApiResponse<any>> = await adminApi.delete(`/api/maps/${mapId}`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao deletar mapa ${mapId}:`, error);
    throw error;
  }
};

export const getMapStats = async (): Promise<ApiResponse<any>> => {
  try {
    const response: AxiosResponse<ApiResponse<any>> = await adminApi.get('/api/maps/stats');
    return response.data;
  } catch (error) {
    logger.error('Erro ao obter estatísticas de mapas:', error);
    throw error;
  }
};

export const getMapTemplates = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response: AxiosResponse<ApiResponse<any[]>> = await adminApi.get('/api/maps/templates');
    return response.data;
  } catch (error) {
    logger.error('Erro ao obter templates de mapas:', error);
    throw error;
  }
};

export const getMapCategories = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response: AxiosResponse<ApiResponse<any[]>> = await adminApi.get('/api/maps/tools/categories');
    return response.data;
  } catch (error) {
    logger.error('Erro ao obter categorias de mapas:', error);
    throw error;
  }
};

export const getBaseLayers = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response: AxiosResponse<ApiResponse<any[]>> = await adminApi.get('/api/maps/tools/base-layers');
    return response.data;
  } catch (error) {
    logger.error('Erro ao obter camadas base:', error);
    throw error;
  }
};

export const validateMapConfig = async (config: any): Promise<ApiResponse<any>> => {
  try {
    const response: AxiosResponse<ApiResponse<any>> = await adminApi.post('/api/maps/tools/validate', config);
    return response.data;
  } catch (error) {
    logger.error('Erro ao validar configuração de mapa:', error);
    throw error;
  }
};

export const suggestLayers = async (category: string): Promise<ApiResponse<any[]>> => {
  try {
    const response: AxiosResponse<ApiResponse<any[]>> = await adminApi.get(`/api/maps/tools/suggest-layers/${category}`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao sugerir camadas para categoria ${category}:`, error);
    throw error;
  }
};

export const optimizeMapConfig = async (config: any): Promise<ApiResponse<any>> => {
  try {
    const response: AxiosResponse<ApiResponse<any>> = await adminApi.post('/api/maps/tools/optimize', config);
    return response.data;
  } catch (error) {
    logger.error('Erro ao otimizar configuração de mapa:', error);
    throw error;
  }
};

// Export API object for easier importing
export const api = {
  // Dashboard
  getDashboardStats,
  
  // Services
  getServices,
  startService,
  stopService,
  restartService,
  
  // Metrics
  getSystemMetrics,
  getMetricsHistory,
  
  // Connectors
  getConnectors,
  runConnector,
  getConnectorJobs,
  
  // Machine Learning
  getMLModels,
  trainModel,
  getMLStats,
  makePrediction,
  
  // Biodiversity
  getBiodiversityStudies,
  getBiodiversityStats,
  
  // MaxEnt
  getMaxEntModels,
  runMaxEntModel,
  
  // Database
  getDatabaseTables,
  executeQuery,
  
  // STAC - INTEGRAÇÃO COMPLETA
  getSTACCollections,
  getSTACCollection,
  getSTACItems,
  
  // pygeoapi - INTEGRAÇÃO COMPLETA
  getPygeoapiCollections,
  getPygeoapiCollection,
  getPygeoapiFeatures,
  getPygeoapiProcesses,
  
  // Storage - INTEGRAÇÃO COMPLETA
  getMinIOBuckets,
  getMinIOBucketInfo,
  getMinIOBucketObjects,
  getStorageStats,
  
  // Cache
  getCacheStats,
  clearCache,
  warmUpCache,
  
  // Async Tasks - INTEGRAÇÃO COMPLETA
  getAsyncTasks,
  getFlowerWorkers,
  getFlowerTaskTypes,
  
  // Alerts
  getAlerts,
  acknowledgeAlert,
  
  // Backup
  getBackups,
  createBackup,
  
  // Users
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  
  // API
  getAPIEndpoints,
  
  // Audit
  getAuditEvents,
  exportAuditData,
  
  // Coastal
  getCoastalAnalysis,
  runCoastalAnalysis,
  
  // Boundaries
  getMaritimeBoundaries,
  processBoundaries,
  
  // Reports
  getReports,
  generateReport,
  
  // System
  healthCheck,
  getSystemConfig,
  updateSystemConfig,
  
  // Logs
  getLogs,
  clearLogs,
  
  // Keycloak - INTEGRAÇÃO COMPLETA
  getKeycloakRealms,
  getKeycloakUsers,
  getKeycloakClients,
  getKeycloakSessions,
  
  // Maps - SISTEMA COMPLETO DE MAPAS
  getMaps,
  getMapById,
  createMap,
  updateMap,
  deleteMap,
  getMapStats,
  getMapTemplates,
  getMapCategories,
  getBaseLayers,
  validateMapConfig,
  suggestLayers,
  optimizeMapConfig,
};

export default api;
