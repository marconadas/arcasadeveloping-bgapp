/**
 * Copernicus Performance Monitor
 * Sistema de monitoramento de performance para APIs Copernicus
 */

class CopernicusPerformanceMonitor {
  constructor(workerUrl = 'https://bgapp-copernicus-official.majearcasa.workers.dev') {
    this.workerUrl = workerUrl;
    this.metrics = {
      requests: [],
      averageResponseTime: 0,
      successRate: 0,
      cacheHitRate: 0,
      lastCheck: null
    };
    
    this.thresholds = {
      responseTime: 5000,    // 5 segundos
      successRate: 95,       // 95%
      cacheHitRate: 70       // 70%
    };
    
    this.isMonitoring = false;
  }
  
  /**
   * Iniciar monitoramento contínuo
   */
  startMonitoring(intervalMinutes = 5) {
    if (this.isMonitoring) {
      console.log('⚠️ Monitoramento já está ativo');
      return;
    }
    
    this.isMonitoring = true;
    console.log(`🚀 Iniciando monitoramento Copernicus (${intervalMinutes} min)`);
    
    // Verificação inicial
    this.runHealthCheck();
    
    // Verificações periódicas
    this.monitoringInterval = setInterval(() => {
      this.runHealthCheck();
    }, intervalMinutes * 60 * 1000);
    
    return this;
  }
  
  /**
   * Executar verificação de saúde
   */
  async runHealthCheck() {
    console.log('🔍 Executando health check Copernicus...');
    
    const checks = [
      { name: 'OpenSearch Sentinel-3', url: '/copernicus/opensearch?collection=Sentinel3&max_records=3' },
      { name: 'Angola Marine Data', url: '/copernicus/angola-marine' }
    ];
    
    const results = [];
    
    for (const check of checks) {
      const result = await this.performCheck(check);
      results.push(result);
    }
    
    // Calcular métricas
    this.updateMetrics(results);
    
    return results;
  }
  
  /**
   * Executar verificação individual
   */
  async performCheck(check) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.workerUrl}${check.url}`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const data = await response.json();
      
      return {
        name: check.name,
        status: response.ok ? 'success' : 'error',
        responseTime: responseTime,
        statusCode: response.status,
        timestamp: new Date().toISOString(),
        cacheHit: data.cache_hit || false
      };
      
    } catch (error) {
      return {
        name: check.name,
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Obter relatório de performance
   */
  getPerformanceReport() {
    return {
      summary: {
        averageResponseTime: Math.round(this.metrics.averageResponseTime),
        successRate: this.metrics.successRate.toFixed(1),
        cacheHitRate: this.metrics.cacheHitRate.toFixed(1),
        totalRequests: this.metrics.requests.length,
        lastCheck: this.metrics.lastCheck
      },
      thresholds: this.thresholds,
      isMonitoring: this.isMonitoring
    };
  }
  
  /**
   * Atualizar métricas
   */
  updateMetrics(results) {
    this.metrics.requests.push(...results);
    
    if (this.metrics.requests.length > 100) {
      this.metrics.requests = this.metrics.requests.slice(-100);
    }
    
    const recent = this.metrics.requests.slice(-20);
    
    this.metrics.averageResponseTime = recent.reduce((sum, req) => sum + req.responseTime, 0) / recent.length;
    this.metrics.successRate = (recent.filter(req => req.status === 'success').length / recent.length) * 100;
    this.metrics.cacheHitRate = (recent.filter(req => req.cacheHit).length / recent.length) * 100;
    this.metrics.lastCheck = new Date().toISOString();
  }
}

// Export para uso global
if (typeof window !== 'undefined') {
  window.CopernicusPerformanceMonitor = CopernicusPerformanceMonitor;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CopernicusPerformanceMonitor;
}