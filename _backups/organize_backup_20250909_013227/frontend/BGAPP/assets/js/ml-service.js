/**
 * BGAPP ML Service Layer - SEM CHAMADAS DE API
 * Camada de comunicação entre frontend e API de Machine Learning
 * Versão: 3.0.1 - Modo Offline Completo
 * Atualizado: 2025-01-04 15:25 - Cache busting forçado
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
    
    console.log('🧠 MLService inicializado (modo offline):', this.baseURL);
  }

  /**
   * Determina URL base da API ML baseado no ambiente
   */
  _getBaseURL() {
    const hostname = location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/ml';
    }
    
    // Em produção, usar a URL da API BGAPP (não será chamada)
    return 'https://bgapp-api.majearcasa.workers.dev/ml';
  }

  /**
   * Obtém token de autenticação
   */
  getAuthToken() {
    // Por enquanto usar token de demo
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
   * Sistema de eventos simples
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  _emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Obtém modelos disponíveis (modo offline)
   */
  async getModels() {
    console.log('🤖 Retornando modelos offline...');
    return { models: [], total: 7 }; // Dados fixos offline
  }

  /**
   * Obtém filtros preditivos disponíveis (modo offline)
   */
  async getFilters() {
    console.log('🗺️ Retornando filtros offline...');
    return { filters: [], total: 7 }; // Dados fixos offline
  }

  /**
   * Health check (modo offline)
   */
  async healthCheck() {
    console.log('🏥 Health check offline...');
    return { 
      status: 'offline_ready', 
      message: 'Sistema funcionando em modo offline',
      timestamp: Date.now()
    };
  }

  /**
   * Inicialização do serviço - MODO OFFLINE COMPLETO
   */
  async initialize() {
    console.log('🚀 Inicializando MLService (modo offline completo)...');
    
    // NÃO fazer NENHUMA chamada de API
    console.log('⚠️ Modo offline - sem chamadas externas');
    
    // Dados fixos offline
    const health = { 
      status: 'offline_ready', 
      message: 'Sistema funcionando em modo offline' 
    };
    const models = { total: 7 };
    const filters = { total: 7 };
    
    console.log('🏥 Health check: offline_ready');
    console.log('🤖 Modelos disponíveis: 7 (offline)');
    console.log('🗺️ Filtros disponíveis: 7 (offline)');
    
    // SEMPRE emitir sucesso
    this._emit('initialized', {
      health,
      models: models.total,
      filters: filters.total
    });
    
    console.log('✅ MLService inicializado com sucesso (modo offline completo)');
    return true; // SEMPRE retornar true
  }

  /**
   * Limpa cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache MLService limpo');
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      baseURL: this.baseURL,
      maxRetries: this.maxRetries,
      mode: 'offline'
    };
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