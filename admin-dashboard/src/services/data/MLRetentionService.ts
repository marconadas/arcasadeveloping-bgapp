/**
 * ML Retention Data Service
 * Serviço para gerenciar dados de retenção ML - substituindo mock data
 */

import apiClient, { ApiResponse } from '../api/client';

// Interfaces de dados
export interface RetainedDataRecord {
  id: string;
  table_name: string;
  data_type: string;
  created_at: string;
  last_accessed: string;
  access_count: number;
  size_mb: number;
  quality_score: number;
  retention_days: number;
  status: 'active' | 'archived' | 'expired';
  metadata: {
    source_study_id: string;
    latitude: number;
    longitude: number;
    features_count: number;
    model_type: string;
  };
}

export interface RetentionPolicy {
  policy_id: string;
  name: string;
  table_name: string;
  retention_days: number;
  enabled: boolean;
  next_execution: string | null;
  conditions?: {
    min_quality_score?: number;
    max_age_days?: number;
    min_access_count?: number;
  };
}

export interface RetentionMetrics {
  total_records: number;
  active_records: number;
  archived_records: number;
  expired_records: number;
  total_size_gb: number;
  avg_quality_score: number;
  cache_hit_ratio: number;
  avg_response_time_ms: number;
  last_cleanup: string;
  next_cleanup: string;
}

export interface RetentionHealth {
  status: 'healthy' | 'degraded' | 'critical';
  checks: {
    database: boolean;
    storage: boolean;
    processing: boolean;
    cache: boolean;
  };
  issues: string[];
  last_check: string;
}

export interface CacheStats {
  total_entries: number;
  cache_size_mb: number;
  hit_ratio: number;
  miss_ratio: number;
  eviction_count: number;
  avg_entry_age_hours: number;
}

export interface PerformanceHistory {
  timestamp: string;
  cache_hit_ratio: number;
  response_time_ms: number;
  space_usage_gb: number;
  active_queries: number;
  error_rate: number;
}

class MLRetentionService {
  private baseUrl = '/api/ml/retention';

  /**
   * Buscar registros de dados retidos com filtros e paginação
   */
  async getRetainedData(params?: {
    table?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    records: RetainedDataRecord[];
    total: number;
    page: number;
    pageSize: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/data`, {
      params,
      useCache: true,
      cacheTime: 60000 // Cache por 1 minuto
    });
  }

  /**
   * Buscar métricas de retenção
   */
  async getMetrics(): Promise<ApiResponse<RetentionMetrics>> {
    return apiClient.get(`${this.baseUrl}/metrics`, {
      useCache: true,
      cacheTime: 30000 // Cache por 30 segundos
    });
  }

  /**
   * Buscar status de saúde do sistema de retenção
   */
  async getHealth(): Promise<ApiResponse<RetentionHealth>> {
    return apiClient.get(`${this.baseUrl}/health`, {
      useCache: false, // Sempre buscar dados frescos
      priority: 'high'
    });
  }

  /**
   * Buscar estatísticas de cache
   */
  async getCacheStats(): Promise<ApiResponse<CacheStats>> {
    return apiClient.get(`${this.baseUrl}/cache/stats`, {
      useCache: true,
      cacheTime: 15000 // Cache por 15 segundos
    });
  }

  /**
   * Buscar políticas de retenção
   */
  async getPolicies(): Promise<ApiResponse<RetentionPolicy[]>> {
    return apiClient.get(`${this.baseUrl}/policies`, {
      useCache: true,
      cacheTime: 300000 // Cache por 5 minutos
    });
  }

  /**
   * Criar nova política de retenção
   */
  async createPolicy(policy: Omit<RetentionPolicy, 'policy_id'>): Promise<ApiResponse<RetentionPolicy>> {
    return apiClient.post(`${this.baseUrl}/policies`, policy);
  }

  /**
   * Atualizar política existente
   */
  async updatePolicy(policyId: string, updates: Partial<RetentionPolicy>): Promise<ApiResponse<RetentionPolicy>> {
    return apiClient.patch(`${this.baseUrl}/policies/${policyId}`, updates);
  }

  /**
   * Deletar política
   */
  async deletePolicy(policyId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/policies/${policyId}`);
  }

  /**
   * Executar limpeza manual
   */
  async executeCleanup(params?: {
    table?: string;
    dryRun?: boolean;
    force?: boolean;
  }): Promise<ApiResponse<{
    deleted_count: number;
    freed_space_mb: number;
    duration_ms: number;
    errors?: string[];
  }>> {
    return apiClient.post(`${this.baseUrl}/cleanup`, params);
  }

  /**
   * Buscar histórico de performance
   */
  async getPerformanceHistory(params?: {
    startDate?: string;
    endDate?: string;
    interval?: 'hour' | 'day' | 'week';
    limit?: number;
  }): Promise<ApiResponse<PerformanceHistory[]>> {
    return apiClient.get(`${this.baseUrl}/performance/history`, {
      params,
      useCache: true,
      cacheTime: 60000
    });
  }

  /**
   * Buscar detalhes de um registro específico
   */
  async getRecordDetails(recordId: string): Promise<ApiResponse<RetainedDataRecord & {
    access_history: Array<{
      timestamp: string;
      user_id: string;
      action: string;
    }>;
    related_models: string[];
    dependencies: string[];
  }>> {
    return apiClient.get(`${this.baseUrl}/data/${recordId}`, {
      useCache: true,
      cacheTime: 120000 // Cache por 2 minutos
    });
  }

  /**
   * Arquivar registros
   */
  async archiveRecords(recordIds: string[]): Promise<ApiResponse<{
    archived_count: number;
    failed_ids: string[];
  }>> {
    return apiClient.post(`${this.baseUrl}/archive`, { record_ids: recordIds });
  }

  /**
   * Restaurar registros arquivados
   */
  async restoreRecords(recordIds: string[]): Promise<ApiResponse<{
    restored_count: number;
    failed_ids: string[];
  }>> {
    return apiClient.post(`${this.baseUrl}/restore`, { record_ids: recordIds });
  }

  /**
   * Exportar dados de retenção
   */
  async exportData(params: {
    format: 'csv' | 'json' | 'excel';
    filters?: any;
  }): Promise<ApiResponse<{
    download_url: string;
    expires_at: string;
  }>> {
    return apiClient.post(`${this.baseUrl}/export`, params);
  }

  /**
   * Buscar estatísticas por tipo de dados
   */
  async getDataTypeStats(): Promise<ApiResponse<Array<{
    data_type: string;
    count: number;
    total_size_mb: number;
    avg_quality: number;
    avg_age_days: number;
  }>>> {
    return apiClient.get(`${this.baseUrl}/stats/by-type`, {
      useCache: true,
      cacheTime: 120000
    });
  }

  /**
   * Buscar previsão de crescimento de dados
   */
  async getGrowthForecast(days: number = 30): Promise<ApiResponse<{
    current_size_gb: number;
    projected_size_gb: number;
    growth_rate_percent: number;
    recommendations: string[];
  }>> {
    return apiClient.get(`${this.baseUrl}/forecast`, {
      params: { days },
      useCache: true,
      cacheTime: 3600000 // Cache por 1 hora
    });
  }

  /**
   * Configurar alertas de retenção
   */
  async configureAlerts(config: {
    max_size_gb?: number;
    min_quality_score?: number;
    max_age_days?: number;
    email_notifications?: boolean;
  }): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseUrl}/alerts/config`, config);
  }

  /**
   * Buscar alertas ativos
   */
  async getActiveAlerts(): Promise<ApiResponse<Array<{
    alert_id: string;
    type: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    created_at: string;
    acknowledged: boolean;
  }>>> {
    return apiClient.get(`${this.baseUrl}/alerts`, {
      useCache: false
    });
  }

  /**
   * Reconhecer alerta
   */
  async acknowledgeAlert(alertId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseUrl}/alerts/${alertId}/acknowledge`);
  }

  /**
   * Otimizar tabela de retenção
   */
  async optimizeTable(tableName: string): Promise<ApiResponse<{
    optimized: boolean;
    space_saved_mb: number;
    duration_ms: number;
  }>> {
    return apiClient.post(`${this.baseUrl}/optimize`, { table_name: tableName });
  }

  /**
   * Validar integridade dos dados
   */
  async validateDataIntegrity(): Promise<ApiResponse<{
    valid: boolean;
    issues: Array<{
      table: string;
      issue_type: string;
      severity: string;
      description: string;
    }>;
    checked_records: number;
  }>> {
    return apiClient.post(`${this.baseUrl}/validate`);
  }
}

// Singleton instance
const mlRetentionService = new MLRetentionService();

export default mlRetentionService;
