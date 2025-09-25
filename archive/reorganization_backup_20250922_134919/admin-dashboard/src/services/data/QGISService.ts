/**
 * QGIS Data Service
 * Serviço para dados QGIS e análises espaciais - dados reais
 */

import apiClient, { ApiResponse } from '../api/client';

// Interfaces de dados
export interface BiomassCalculationParams {
  region_id: string;
  area_km2: number;
  depth_range: {
    min: number;
    max: number;
  };
  species?: string[];
  season?: 'summer' | 'winter' | 'spring' | 'autumn';
  calculation_method: 'standard' | 'advanced' | 'machine_learning';
}

export interface BiomassResult {
  total_biomass_tons: number;
  biomass_density_kg_km2: number;
  carbon_sequestration_tons: number;
  economic_value_usd: number;
  confidence_level: number;
  breakdown_by_species: Array<{
    species: string;
    biomass_tons: number;
    percentage: number;
  }>;
  environmental_impact: {
    co2_reduction: number;
    ecosystem_health_score: number;
    biodiversity_index: number;
  };
  calculation_metadata: {
    method_used: string;
    calculation_time_ms: number;
    data_sources: string[];
    timestamp: string;
  };
}

export interface SpatialAnalysisParams {
  analysis_type: 'hotspot' | 'cluster' | 'interpolation' | 'buffer' | 'overlay';
  layer_ids: string[];
  geometry?: {
    type: string;
    coordinates: number[][];
  };
  parameters?: Record<string, any>;
}

export interface SpatialAnalysisResult {
  analysis_id: string;
  type: string;
  status: 'completed' | 'processing' | 'failed';
  result_layers: Array<{
    layer_id: string;
    layer_name: string;
    feature_count: number;
    geometry_type: string;
    attributes: string[];
  }>;
  statistics: {
    total_features: number;
    area_coverage_km2: number;
    processing_time_ms: number;
  };
  visualization_url?: string;
  download_formats: Array<{
    format: string;
    url: string;
    size_mb: number;
  }>;
}

export interface TemporalData {
  timestamp: string;
  metrics: {
    temperature: number;
    salinity: number;
    ph: number;
    dissolved_oxygen: number;
    chlorophyll: number;
    turbidity: number;
  };
  location: {
    lat: number;
    lng: number;
    depth: number;
  };
}

export interface MCDAAnalysis {
  criteria: Array<{
    name: string;
    weight: number;
    type: 'benefit' | 'cost';
  }>;
  alternatives: Array<{
    id: string;
    name: string;
    scores: Record<string, number>;
  }>;
  method: 'AHP' | 'TOPSIS' | 'VIKOR' | 'PROMETHEE';
}

export interface MCDAResult {
  ranking: Array<{
    alternative_id: string;
    alternative_name: string;
    final_score: number;
    rank: number;
  }>;
  sensitivity_analysis: {
    stable: boolean;
    critical_criteria: string[];
    confidence_interval: number;
  };
  visualization: {
    chart_url: string;
    heatmap_url: string;
  };
}

class QGISService {
  private baseUrl = '/api/qgis';

  /**
   * Calcular biomassa marinha
   */
  async calculateBiomass(params: BiomassCalculationParams): Promise<ApiResponse<BiomassResult>> {
    return apiClient.post(`${this.baseUrl}/biomass/calculate`, params, {
      timeout: 30000 // 30 segundos para cálculos complexos
    });
  }

  /**
   * Buscar histórico de cálculos de biomassa
   */
  async getBiomassHistory(params?: {
    region_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<ApiResponse<BiomassResult[]>> {
    return apiClient.get(`${this.baseUrl}/biomass/history`, {
      params,
      useCache: true,
      cacheTime: 300000 // 5 minutos
    });
  }

  /**
   * Executar análise espacial
   */
  async runSpatialAnalysis(params: SpatialAnalysisParams): Promise<ApiResponse<SpatialAnalysisResult>> {
    return apiClient.post(`${this.baseUrl}/spatial/analysis`, params, {
      timeout: 60000 // 1 minuto para análises complexas
    });
  }

  /**
   * Buscar camadas disponíveis
   */
  async getAvailableLayers(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    source: string;
    last_updated: string;
    feature_count: number;
    extent: {
      min_lat: number;
      max_lat: number;
      min_lng: number;
      max_lng: number;
    };
  }>>> {
    return apiClient.get(`${this.baseUrl}/layers`, {
      useCache: true,
      cacheTime: 600000 // 10 minutos
    });
  }

  /**
   * Buscar dados temporais
   */
  async getTemporalData(params: {
    start_date: string;
    end_date: string;
    location?: { lat: number; lng: number; radius_km: number };
    metrics?: string[];
    interval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  }): Promise<ApiResponse<TemporalData[]>> {
    return apiClient.get(`${this.baseUrl}/temporal/data`, {
      params,
      useCache: true,
      cacheTime: 180000 // 3 minutos
    });
  }

  /**
   * Executar análise MCDA/AHP
   */
  async runMCDAAnalysis(analysis: MCDAAnalysis): Promise<ApiResponse<MCDAResult>> {
    return apiClient.post(`${this.baseUrl}/mcda/analyze`, analysis, {
      timeout: 45000
    });
  }

  /**
   * Buscar templates MCDA
   */
  async getMCDATemplates(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description: string;
    criteria_count: number;
    method: string;
    use_cases: string[];
  }>>> {
    return apiClient.get(`${this.baseUrl}/mcda/templates`, {
      useCache: true,
      cacheTime: 3600000 // 1 hora
    });
  }

  /**
   * Gerar mapa de calor
   */
  async generateHeatmap(params: {
    metric: string;
    start_date?: string;
    end_date?: string;
    resolution: 'low' | 'medium' | 'high';
    color_scheme?: string;
  }): Promise<ApiResponse<{
    heatmap_url: string;
    legend_url: string;
    data_points: number;
    value_range: { min: number; max: number };
  }>> {
    return apiClient.post(`${this.baseUrl}/visualization/heatmap`, params);
  }

  /**
   * Análise de cluster espacial
   */
  async runClusterAnalysis(params: {
    layer_id: string;
    clustering_method: 'kmeans' | 'dbscan' | 'hierarchical';
    num_clusters?: number;
    distance_threshold?: number;
  }): Promise<ApiResponse<{
    clusters: Array<{
      cluster_id: number;
      feature_count: number;
      centroid: { lat: number; lng: number };
      properties: Record<string, any>;
    }>;
    silhouette_score: number;
    optimal_clusters: number;
  }>> {
    return apiClient.post(`${this.baseUrl}/spatial/cluster`, params);
  }

  /**
   * Análise de buffer
   */
  async createBuffer(params: {
    layer_id: string;
    buffer_distance_km: number;
    buffer_type: 'fixed' | 'variable';
    dissolve?: boolean;
  }): Promise<ApiResponse<{
    buffer_layer_id: string;
    area_km2: number;
    feature_count: number;
    download_url: string;
  }>> {
    return apiClient.post(`${this.baseUrl}/spatial/buffer`, params);
  }

  /**
   * Interpolação espacial
   */
  async runInterpolation(params: {
    point_layer_id: string;
    attribute: string;
    method: 'idw' | 'kriging' | 'spline' | 'natural_neighbor';
    resolution_m: number;
    extent?: {
      min_lat: number;
      max_lat: number;
      min_lng: number;
      max_lng: number;
    };
  }): Promise<ApiResponse<{
    raster_layer_id: string;
    value_range: { min: number; max: number };
    rmse: number;
    visualization_url: string;
  }>> {
    return apiClient.post(`${this.baseUrl}/spatial/interpolation`, params);
  }

  /**
   * Análise de sobreposição
   */
  async runOverlayAnalysis(params: {
    input_layers: string[];
    operation: 'intersection' | 'union' | 'difference' | 'symmetric_difference';
    attributes_to_keep?: string[];
  }): Promise<ApiResponse<{
    result_layer_id: string;
    feature_count: number;
    area_km2: number;
    attributes: string[];
  }>> {
    return apiClient.post(`${this.baseUrl}/spatial/overlay`, params);
  }

  /**
   * Estatísticas zonais
   */
  async calculateZonalStatistics(params: {
    zone_layer_id: string;
    value_layer_id: string;
    statistics: Array<'mean' | 'median' | 'min' | 'max' | 'sum' | 'std' | 'count'>;
    attribute?: string;
  }): Promise<ApiResponse<Array<{
    zone_id: string;
    zone_name: string;
    statistics: Record<string, number>;
  }>>> {
    return apiClient.post(`${this.baseUrl}/spatial/zonal-stats`, params);
  }

  /**
   * Exportar dados QGIS
   */
  async exportData(params: {
    layer_ids: string[];
    format: 'geojson' | 'shapefile' | 'kml' | 'csv' | 'gpkg';
    include_metadata?: boolean;
    coordinate_system?: string;
  }): Promise<ApiResponse<{
    download_url: string;
    file_size_mb: number;
    expires_at: string;
  }>> {
    return apiClient.post(`${this.baseUrl}/export`, params);
  }

  /**
   * Validar geometria
   */
  async validateGeometry(params: {
    layer_id: string;
    fix_errors?: boolean;
  }): Promise<ApiResponse<{
    valid: boolean;
    errors: Array<{
      feature_id: string;
      error_type: string;
      description: string;
      can_fix: boolean;
    }>;
    fixed_count?: number;
  }>> {
    return apiClient.post(`${this.baseUrl}/validate/geometry`, params);
  }
}

// Singleton instance
const qgisService = new QGISService();

export default qgisService;
