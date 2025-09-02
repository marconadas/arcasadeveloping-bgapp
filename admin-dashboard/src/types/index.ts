// Types for BGAPP Admin Dashboard

export interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  port: number;
  url: string;
  responseTime?: number;
  lastCheck: string;
  description?: string;
  version?: string;
}

export interface SystemMetrics {
  timestamp: string;
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
  networkIn: number;
  networkOut: number;
  activeConnections: number;
  uptime: number;
}

export interface Connector {
  id: string;
  name: string;
  type: 'Biodiversidade' | 'Oceanografia' | 'Satélite' | 'Pesca' | 'Tempo Real' | 'Clima' | 'Nacional' | 'Catálogo';
  module: string;
  description: string;
  status: 'active' | 'inactive' | 'error' | 'running';
  lastRun?: string;
  nextRun?: string;
  isNew?: boolean;
  config?: Record<string, any>;
}

export interface IngestJob {
  id: string;
  connectorId: string;
  connectorName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  recordsProcessed: number;
  errors?: string[];
  progress?: number;
}

export interface MLModel {
  id: string;
  name: string;
  type: 'biodiversity_predictor' | 'temperature_forecaster' | 'species_classifier' | 'abundance_estimator' | 'habitat_suitability';
  algorithm: string;
  version: string;
  accuracy: number;
  trainingAccuracy: number;
  validationAccuracy: number;
  isDeployed: boolean;
  endpointUrl?: string;
  predictionCount: number;
  lastTrained: string;
  features: string[];
}

export interface PredictionResult {
  id: string;
  modelId: string;
  prediction: number;
  confidence: number;
  latitude: number;
  longitude: number;
  usedForMapping: boolean;
  mapLayerId?: string;
  timestamp: string;
}

export interface BackupInfo {
  id: string;
  type: 'full' | 'database' | 'files';
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  size: number;
  path: string;
  checksum?: string;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalKeys: number;
  usedMemory: number;
  maxMemory: number;
  evictedKeys: number;
  expiredKeys: number;
  avgTtl: number;
}

export interface AsyncTask {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'retry';
  queueName: string;
  priority: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  result?: any;
  error?: string;
  retries: number;
  maxRetries: number;
}

export interface DatabaseTable {
  schema: string;
  tableName: string;
  recordCount: number;
  size: string;
  lastUpdated: string;
  description?: string;
}

export interface STACCollection {
  id: string;
  title: string;
  description: string;
  extent: {
    spatial: {
      bbox: number[][];
    };
    temporal: {
      interval: string[][];
    };
  };
  itemCount: number;
  license: string;
  providers: Array<{
    name: string;
    roles: string[];
    url?: string;
  }>;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  status: 'active' | 'deprecated' | 'maintenance';
  responseTime?: number;
  requestCount: number;
  errorRate: number;
  lastAccessed?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  lastAccess?: string;
  createdAt: string;
  permissions: string[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  event: string;
  resource: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface Species {
  id: string;
  scientificName: string;
  commonName?: string;
  taxonRank: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  isEndemic: boolean;
  conservationStatus?: string;
  occurrenceCount: number;
}

export interface BiodiversityStudy {
  id: string;
  studyName: string;
  studyType: string;
  description: string;
  latitude: number;
  longitude: number;
  speciesObserved: number;
  environmentalParameters: Record<string, any>;
  dataQualityScore: number;
  validationStatus: 'pending' | 'validated' | 'rejected';
  processedForMl: boolean;
  createdAt: string;
}

export interface MaxEntModel {
  id: string;
  speciesId: string;
  speciesName: string;
  accuracy: number;
  auc: number;
  trainingRecords: number;
  testRecords: number;
  status: 'training' | 'completed' | 'failed';
  createdAt: string;
  lastPrediction?: string;
}

export interface CoastalAnalysis {
  id: string;
  region: string;
  coastlineLength: number;
  sandyCoastLength: number;
  rockyCoastLength: number;
  erosionRiskLevel: 'low' | 'medium' | 'high';
  erosionRiskLength: number;
  lastAnalysis: string;
}

export interface MaritimeBoundary {
  id: string;
  type: 'zee' | 'territorial_waters' | 'continental_shelf' | 'fishing_zones';
  name: string;
  area: number;
  perimeter: number;
  isActive: boolean;
  lastUpdated: string;
  geometry?: any; // GeoJSON geometry
}

// Dashboard specific types
export interface DashboardStats {
  servicesOnline: number;
  totalServices: number;
  apiLatency: number;
  mlAccuracy: number;
  availability: number;
  activeAlerts: number;
  asyncTasks: number;
  cacheHitRate: number;
  securityScore: number;
  maxentModels: number;
}

export interface QuickAccessLink {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  isExternal: boolean;
  isNew?: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Store types
export interface AppState {
  isLoading: boolean;
  error: string | null;
  currentSection: string;
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface ServicesState {
  services: ServiceStatus[];
  isLoading: boolean;
  lastUpdate: string | null;
}

export interface MetricsState {
  current: SystemMetrics | null;
  history: SystemMetrics[];
  isLoading: boolean;
}

// Form types
export interface ConnectorForm {
  name: string;
  type: string;
  module: string;
  description: string;
  config: Record<string, any>;
}

export interface UserForm {
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface BackupForm {
  type: 'full' | 'database' | 'files';
  schedule?: string;
  retention: number;
}

// Chart data types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

// Export all types
export type * from './index';
