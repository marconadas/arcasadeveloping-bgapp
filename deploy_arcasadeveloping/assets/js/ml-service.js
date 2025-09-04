/**
 * BGAPP ML Service Layer
 * Camada de comunicação entre frontend e API de Machine Learning
 * Versão: 1.0.0
 */

class MLService {
  constructor() {
    this.baseURL = this._getBaseURL();
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutos
    this.requestQueue = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    // Event emitter para notificações
    this.listeners = new Map();
    
    // Configurações de performance
    this.batchSize = 10;
    this.batchTimeout = 500; // ms
    
    console.log('🧠 MLService inicializado:', this.baseURL);
  }

  /**
   * Determina URL base da API ML baseado no ambiente
   */
  _getBaseURL() {
    const hostname = location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/ml';
    }
    
    // Em produção, usar a URL da API BGAPP (agora disponível!)
    return 'https://bgapp-api.majearcasa.workers.dev/ml';
  }

  /**
   * Obtém token de autenticação
   */
  getAuthToken() {
    // Por enquanto usar token de demo
    // Em produção, integrar com sistema de auth real
    return 'demo_token_for_testing';
  }

  /**
   * Gera chave de cache única
   */
  _getCacheKey(endpoint, params) {
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    return `${endpoint}_${btoa(sortedParams)}`;
  }

  /**
   * Verifica se item está em cache e válido
   */
  _getCachedItem(cacheKey) {
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      console.log('📦 Cache hit:', cacheKey);
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(cacheKey);
    }
    
    return null;
  }

  /**
   * Armazena item no cache
   */
  _setCachedItem(cacheKey, data) {
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    // Limpar cache se ficar muito grande
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Faz requisição HTTP com retry e tratamento de erros
   */
  async _makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    };

    const requestOptions = { ...defaultOptions, ...options };
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🌐 Request (${attempt}/${this.maxRetries}):`, url);
        
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Response received:', data);
        
        return data;
        
      } catch (error) {
        console.warn(`⚠️ Request failed (attempt ${attempt}):`, error.message);
        
        if (attempt === this.maxRetries) {
          throw new Error(`Request failed after ${this.maxRetries} attempts: ${error.message}`);
        }
        
        // Esperar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  /**
   * Faz predição usando modelo ML
   */
  async predict(modelType, inputData, options = {}) {
    try {
      const requestData = {
        model_type: modelType,
        input_data: inputData,
        confidence_threshold: options.confidenceThreshold || 0.5,
        use_for_mapping: options.useForMapping || false,
        latitude: options.latitude,
        longitude: options.longitude,
        area_name: options.areaName
      };

      // Verificar cache primeiro
      const cacheKey = this._getCacheKey('/predict', requestData);
      const cached = this._getCachedItem(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Fazer requisição
      const response = await this._makeRequest('/predict', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      // Cache resultado se confiança for boa
      if (response.confidence >= 0.6) {
        this._setCachedItem(cacheKey, response);
      }

      // Emitir evento de predição
      this._emit('prediction', {
        modelType,
        inputData,
        result: response
      });

      return response;

    } catch (error) {
      console.error('❌ Prediction error:', error);
      this._emit('error', {
        type: 'prediction',
        error: error.message,
        modelType,
        inputData
      });
      throw error;
    }
  }

  /**
   * Obtém lista de modelos disponíveis
   */
  async getModels() {
    try {
      const cacheKey = this._getCacheKey('/models', {});
      const cached = this._getCachedItem(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await this._makeRequest('/models');
      
      // Cache por mais tempo (modelos mudam raramente)
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      return response;

    } catch (error) {
      console.error('❌ Models error:', error);
      throw error;
    }
  }

  /**
   * Obtém filtros preditivos disponíveis
   */
  async getFilters() {
    try {
      const cacheKey = this._getCacheKey('/filters', {});
      const cached = this._getCachedItem(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await this._makeRequest('/filters');
      this._setCachedItem(cacheKey, response);

      return response;

    } catch (error) {
      console.error('❌ Filters error:', error);
      throw error;
    }
  }

  /**
   * Obtém dados de um filtro específico (GeoJSON)
   */
  async getFilterData(filterId) {
    try {
      const cacheKey = this._getCacheKey(`/filters/${filterId}/data`, {});
      const cached = this._getCachedItem(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await this._makeRequest(`/filters/${filterId}/data`);
      this._setCachedItem(cacheKey, response);

      return response;

    } catch (error) {
      console.error('❌ Filter data error:', error);
      throw error;
    }
  }

  /**
   * Cria novo filtro preditivo
   */
  async createFilter(filterConfig) {
    try {
      const response = await this._makeRequest('/filters', {
        method: 'POST',
        body: JSON.stringify(filterConfig)
      });

      // Limpar cache de filtros
      this._clearCacheByPattern('/filters');

      this._emit('filterCreated', response);
      return response;

    } catch (error) {
      console.error('❌ Create filter error:', error);
      throw error;
    }
  }

  /**
   * Atualiza predições de um filtro
   */
  async refreshFilter(filterId) {
    try {
      const response = await this._makeRequest(`/filters/${filterId}/refresh`, {
        method: 'PUT'
      });

      // Limpar cache deste filtro
      this._clearCacheByPattern(`/filters/${filterId}`);

      this._emit('filterRefreshed', { filterId, response });
      return response;

    } catch (error) {
      console.error('❌ Refresh filter error:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do sistema ML
   */
  async getStats() {
    try {
      const response = await this._makeRequest('/stats');
      return response;

    } catch (error) {
      console.error('❌ Stats error:', error);
      throw error;
    }
  }

  /**
   * Cria novo estudo de biodiversidade
   */
  async createStudy(studyData) {
    try {
      const response = await this._makeRequest('/studies', {
        method: 'POST',
        body: JSON.stringify(studyData)
      });

      this._emit('studyCreated', response);
      return response;

    } catch (error) {
      console.error('❌ Create study error:', error);
      throw error;
    }
  }

  /**
   * Obtém detalhes de um estudo
   */
  async getStudy(studyId) {
    try {
      const cacheKey = this._getCacheKey(`/studies/${studyId}`, {});
      const cached = this._getCachedItem(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await this._makeRequest(`/studies/${studyId}`);
      this._setCachedItem(cacheKey, response);

      return response;

    } catch (error) {
      console.error('❌ Get study error:', error);
      throw error;
    }
  }

  /**
   * Faz predições em lote (otimização de performance)
   */
  async batchPredict(requests) {
    try {
      const response = await this._makeRequest('/predict/batch', {
        method: 'POST',
        body: JSON.stringify({ requests })
      });

      // Cache resultados individualmente
      response.results.forEach((result, index) => {
        if (result.confidence >= 0.6) {
          const request = requests[index];
          const cacheKey = this._getCacheKey('/predict', request);
          this._setCachedItem(cacheKey, result);
        }
      });

      return response;

    } catch (error) {
      console.error('❌ Batch predict error:', error);
      throw error;
    }
  }

  /**
   * Limpa cache por padrão
   */
  _clearCacheByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache limpo');
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    const totalItems = this.cache.size;
    const totalMemory = JSON.stringify([...this.cache.entries()]).length;
    
    return {
      items: totalItems,
      memoryKB: Math.round(totalMemory / 1024),
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
    };
  }

  /**
   * Sistema de eventos simples
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  _emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Event listener error:', error);
        }
      });
    }
  }

  /**
   * Health check da API ML
   */
  async healthCheck() {
    try {
      const response = await this._makeRequest('/health');
      return response;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Inicialização do serviço
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando MLService...');
      
      // Health check
      const health = await this.healthCheck();
      console.log('🏥 Health check:', health);
      
      // Carregar modelos disponíveis
      const models = await this.getModels();
      console.log('🤖 Modelos disponíveis:', models.total);
      
      // Carregar filtros ativos
      const filters = await this.getFilters();
      console.log('🗺️ Filtros disponíveis:', filters.total);
      
      this._emit('initialized', {
        health,
        models: models.total,
        filters: filters.total
      });
      
      console.log('✅ MLService inicializado com sucesso');
      return true;
      
    } catch (error) {
      console.error('❌ Erro na inicialização do MLService:', error);
      this._emit('initializationError', error);
      return false;
    }
  }
}

// Instância global
window.mlService = new MLService();

// Auto-inicialização quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mlService.initialize();
  });
} else {
  // DOM já está pronto
  window.mlService.initialize();
}

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MLService;
}
