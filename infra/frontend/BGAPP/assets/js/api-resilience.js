/**
 * Sistema de Resiliência para APIs - BGAPP
 * Solução definitiva para problemas recorrentes de conectores e ingestão
 * 
 * PROBLEMA IDENTIFICADO:
 * - Quando pygeoapi (5080) falha, todo sistema de ingestão para
 * - Service Worker não tem fallback robusto para APIs
 * - Conectores não têm circuit breaker adequado
 * 
 * SOLUÇÃO:
 * - Circuit breaker por serviço
 * - Fallback automático para admin-api
 * - Cache inteligente com TTL
 * - Monitoramento proativo de saúde
 */

class APIResilienceManager {
    constructor() {
        this.services = {
            pygeoapi: {
                url: 'http://localhost:5080',
                fallbackUrl: 'http://localhost:8085/admin-api',
                status: 'unknown',
                failures: 0,
                lastCheck: 0,
                circuitOpen: false,
                endpoints: ['collections', 'openapi', 'conformance']
            },
            adminApi: {
                url: 'http://localhost:8085/admin-api',
                status: 'unknown',
                failures: 0,
                lastCheck: 0,
                circuitOpen: false,
                endpoints: ['services/status', 'connectors', 'collections']
            }
        };
        
        this.config = {
            maxFailures: 3,           // Circuit breaker threshold
            resetTimeout: 30000,      // 30s para resetar circuit breaker
            healthCheckInterval: 10000, // 10s health check
            requestTimeout: 5000,     // 5s timeout por request
            retryAttempts: 2,         // 2 tentativas por request
            cacheTimeout: 60000       // 1min cache TTL
        };
        
        this.cache = new Map();
        this.healthCheckTimer = null;
        this.isInitialized = false;
        
        console.log('🛡️ API Resilience Manager inicializado');
    }

    /**
     * Inicializar sistema de resiliência
     */
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🚀 Inicializando sistema de resiliência...');
        
        // Health check inicial
        await this.performHealthChecks();
        
        // Configurar monitoramento contínuo
        this.startHealthMonitoring();
        
        // Interceptar fetch global para adicionar resiliência
        this.interceptFetchRequests();
        
        this.isInitialized = true;
        console.log('✅ Sistema de resiliência ativo');
    }

    /**
     * Realizar health checks em todos os serviços
     */
    async performHealthChecks() {
        console.log('🏥 Executando health checks...');
        
        for (const [serviceName, service] of Object.entries(this.services)) {
            try {
                const startTime = Date.now();
                const response = await this.makeRequest(service.url, {
                    timeout: this.config.requestTimeout / 2,
                    skipResilience: true // Evitar recursão
                });
                
                const responseTime = Date.now() - startTime;
                
                if (response.ok) {
                    this.markServiceHealthy(serviceName, responseTime);
                } else {
                    this.markServiceUnhealthy(serviceName, `HTTP ${response.status}`);
                }
                
            } catch (error) {
                this.markServiceUnhealthy(serviceName, error.message);
            }
        }
    }

    /**
     * Marcar serviço como saudável
     */
    markServiceHealthy(serviceName, responseTime = 0) {
        const service = this.services[serviceName];
        service.status = 'healthy';
        service.failures = 0;
        service.circuitOpen = false;
        service.lastCheck = Date.now();
        service.responseTime = responseTime;
        
        console.log(`✅ ${serviceName} saudável (${responseTime}ms)`);
        this.updateServiceIndicator(serviceName, 'healthy');
    }

    /**
     * Marcar serviço como não saudável
     */
    markServiceUnhealthy(serviceName, error) {
        const service = this.services[serviceName];
        service.status = 'unhealthy';
        service.failures++;
        service.lastCheck = Date.now();
        service.lastError = error;
        
        // Abrir circuit breaker se muitas falhas
        if (service.failures >= this.config.maxFailures) {
            service.circuitOpen = true;
            console.warn(`⚠️ Circuit breaker ABERTO para ${serviceName} (${service.failures} falhas)`);
            
            // Agendar reset do circuit breaker
            setTimeout(() => {
                service.circuitOpen = false;
                service.failures = 0;
                console.log(`🔄 Circuit breaker RESETADO para ${serviceName}`);
            }, this.config.resetTimeout);
        }
        
        console.error(`❌ ${serviceName} não saudável: ${error}`);
        this.updateServiceIndicator(serviceName, 'unhealthy');
    }

    /**
     * Iniciar monitoramento contínuo de saúde
     */
    startHealthMonitoring() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        
        this.healthCheckTimer = setInterval(() => {
            this.performHealthChecks();
        }, this.config.healthCheckInterval);
        
        console.log(`🔄 Monitoramento ativo (${this.config.healthCheckInterval/1000}s)`);
    }

    /**
     * Interceptar requests fetch para adicionar resiliência
     */
    interceptFetchRequests() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // Se não é uma URL que precisamos interceptar, usar fetch original
            if (!this.shouldInterceptRequest(url)) {
                return originalFetch(url, options);
            }
            
            return this.resilientFetch(url, options, originalFetch);
        };
        
        console.log('🔗 Fetch interceptado para resiliência');
    }

    /**
     * Verificar se devemos interceptar a requisição
     */
    shouldInterceptRequest(url) {
        const urlStr = typeof url === 'string' ? url : url.toString();
        return urlStr.includes('localhost:5080') || 
               urlStr.includes('localhost:8085/admin-api') ||
               urlStr.includes('/collections') ||
               urlStr.includes('/connectors');
    }

    /**
     * Fetch com resiliência automática
     */
    async resilientFetch(url, options = {}, originalFetch) {
        const urlStr = typeof url === 'string' ? url : url.toString();
        
        // Verificar cache primeiro
        const cacheKey = `${urlStr}_${JSON.stringify(options)}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log(`📦 Cache hit: ${urlStr}`);
            return new Response(JSON.stringify(cached.data), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Determinar serviço primário e fallback
        let primaryService, fallbackService;
        
        if (urlStr.includes('localhost:5080')) {
            primaryService = this.services.pygeoapi;
            fallbackService = this.services.adminApi;
        } else {
            primaryService = this.services.adminApi;
            fallbackService = null;
        }

        // Tentar serviço primário
        try {
            if (!primaryService.circuitOpen) {
                const response = await this.makeRequestWithRetry(urlStr, options, originalFetch);
                
                if (response.ok) {
                    // Cache resposta bem-sucedida
                    const data = await response.clone().json();
                    this.setCache(cacheKey, data);
                    return response;
                }
            }
        } catch (error) {
            console.warn(`⚠️ Falha no serviço primário: ${error.message}`);
        }

        // Tentar fallback se disponível
        if (fallbackService && !fallbackService.circuitOpen) {
            try {
                const fallbackUrl = this.buildFallbackUrl(urlStr, fallbackService.url);
                console.log(`🔄 Tentando fallback: ${fallbackUrl}`);
                
                const response = await this.makeRequestWithRetry(fallbackUrl, options, originalFetch);
                
                if (response.ok) {
                    const data = await response.clone().json();
                    this.setCache(cacheKey, data);
                    return response;
                }
            } catch (error) {
                console.error(`❌ Fallback também falhou: ${error.message}`);
            }
        }

        // Se tudo falhar, tentar cache expirado
        const expiredCache = this.getFromCache(cacheKey, true);
        if (expiredCache) {
            console.log(`🗃️ Usando cache expirado como último recurso`);
            return new Response(JSON.stringify(expiredCache.data), {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Cache': 'stale'
                }
            });
        }

        // Último recurso: dados mock
        return this.createMockResponse(urlStr);
    }

    /**
     * Fazer requisição com retry automático
     */
    async makeRequestWithRetry(url, options, originalFetch) {
        let lastError;
        
        for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);
                
                const response = await originalFetch(url, {
                    ...options,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok || attempt === this.config.retryAttempts) {
                    return response;
                }
                
                lastError = new Error(`HTTP ${response.status}`);
                
            } catch (error) {
                lastError = error;
                
                if (attempt < this.config.retryAttempts) {
                    const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
                    console.log(`🔄 Retry ${attempt + 1}/${this.config.retryAttempts} em ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Construir URL de fallback
     */
    buildFallbackUrl(originalUrl, fallbackBaseUrl) {
        const url = new URL(originalUrl);
        const path = url.pathname;
        
        // Mapear endpoints específicos
        if (path.includes('/collections')) {
            return `${fallbackBaseUrl}/collections`;
        } else if (path.includes('/openapi')) {
            return `${fallbackBaseUrl}/openapi`;
        } else {
            return `${fallbackBaseUrl}${path}`;
        }
    }

    /**
     * Fazer requisição simples (para health checks)
     */
    async makeRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.config.requestTimeout);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                ...options
            });
            
            clearTimeout(timeoutId);
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Gerenciar cache com TTL
     */
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now(),
            ttl: this.config.cacheTimeout
        });
        
        // Limpar cache se muito grande
        if (this.cache.size > 100) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Obter do cache
     */
    getFromCache(key, allowExpired = false) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const age = Date.now() - cached.timestamp;
        if (age <= cached.ttl || allowExpired) {
            return cached;
        }
        
        this.cache.delete(key);
        return null;
    }

    /**
     * Criar resposta mock para casos extremos
     */
    createMockResponse(url) {
        let mockData;
        
        if (url.includes('/collections')) {
            mockData = {
                collections: [],
                message: "Dados temporariamente indisponíveis - modo offline"
            };
        } else if (url.includes('/connectors')) {
            mockData = {
                connectors: {},
                message: "Conectores temporariamente indisponíveis"
            };
        } else {
            mockData = {
                error: true,
                message: "Serviço temporariamente indisponível",
                offline: true
            };
        }
        
        console.log(`🔄 Resposta mock para: ${url}`);
        
        return new Response(JSON.stringify(mockData), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'X-Mock': 'true'
            }
        });
    }

    /**
     * Atualizar indicador visual do status do serviço
     */
    updateServiceIndicator(serviceName, status) {
        // Tentar encontrar indicador no DOM
        const indicator = document.querySelector(`[data-service="${serviceName}"]`);
        if (indicator) {
            indicator.className = `service-indicator ${status}`;
            indicator.title = `${serviceName}: ${status}`;
        }
        
        // Atualizar dashboard se existir
        const dashboardElement = document.querySelector('#service-status-dashboard');
        if (dashboardElement) {
            this.updateServiceDashboard();
        }
    }

    /**
     * Atualizar dashboard de status dos serviços
     */
    updateServiceDashboard() {
        const dashboard = document.querySelector('#service-status-dashboard');
        if (!dashboard) return;
        
        let html = '<h4>🏥 Status dos Serviços</h4>';
        
        for (const [serviceName, service] of Object.entries(this.services)) {
            const statusIcon = service.status === 'healthy' ? '✅' : 
                              service.status === 'unhealthy' ? '❌' : '❓';
            const circuitStatus = service.circuitOpen ? ' (Circuit Aberto)' : '';
            
            html += `
                <div class="service-status-item">
                    ${statusIcon} <strong>${serviceName}</strong>: ${service.status}${circuitStatus}
                    ${service.responseTime ? `(${service.responseTime}ms)` : ''}
                    ${service.lastError ? `<br><small>Último erro: ${service.lastError}</small>` : ''}
                </div>
            `;
        }
        
        dashboard.innerHTML = html;
    }

    /**
     * Obter estatísticas do sistema
     */
    getStats() {
        return {
            services: Object.keys(this.services).map(name => ({
                name,
                status: this.services[name].status,
                failures: this.services[name].failures,
                circuitOpen: this.services[name].circuitOpen,
                responseTime: this.services[name].responseTime
            })),
            cache: {
                size: this.cache.size,
                hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
            }
        };
    }

    /**
     * Limpar recursos
     */
    cleanup() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
        
        this.cache.clear();
        console.log('🧹 API Resilience Manager limpo');
    }
}

// Instância global
window.apiResilienceManager = new APIResilienceManager();

// Auto-inicializar quando DOM estiver pronto (desabilitado para MinPerMar)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Verificar se estamos no contexto MinPerMar
        const isMinPerMar = window.location.pathname.includes('/minpermar') || 
                            window.location.pathname.includes('minpermar-site');
        
        if (isMinPerMar) {
            console.log('🚀 API Resilience desabilitado no MinPerMar');
            return;
        }
        
        window.apiResilienceManager.initialize();
    });
} else {
    // Verificar se estamos no contexto MinPerMar
    const isMinPerMar = window.location.pathname.includes('/minpermar') || 
                        window.location.pathname.includes('minpermar-site');
    
    if (isMinPerMar) {
        console.log('🚀 API Resilience desabilitado no MinPerMar');
    } else {
        window.apiResilienceManager.initialize();
    }
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIResilienceManager;
}

console.log('🛡️ Sistema de Resiliência para APIs carregado!');
