/**
 * BGAPP API Adapter - Integração Plug-and-Play com Admin.js
 * Mantém compatibilidade com código existente enquanto adiciona funcionalidades plug-and-play
 */

class BGAPPAPIAdapter {
    constructor() {
        this.pluginManager = window.apiPluginManager;
        this.resilienceManager = window.apiResilienceManager;
        this.initialized = false;
        
        // Cache para compatibilidade
        this.legacyCache = new Map();
        
        console.log('🔌 BGAPP API Adapter inicializado');
    }

    /**
     * Inicializar adaptador
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('🚀 Inicializando API Adapter...');
        
        // Aguardar inicialização dos managers
        if (this.pluginManager && !this.pluginManager.isInitialized) {
            await this.pluginManager.initialize();
        }
        
        if (this.resilienceManager && !this.resilienceManager.isInitialized) {
            await this.resilienceManager.initialize();
        }
        
        // Interceptar e melhorar o API.fetch existente
        this.enhanceExistingAPI();
        
        // Registrar middleware para qualidade
        this.registerQualityMiddleware();
        
        this.initialized = true;
        console.log('✅ API Adapter ativo');
    }

    /**
     * Melhorar API existente do admin.js
     */
    enhanceExistingAPI() {
        // Salvar referência original
        const originalAPI = window.API;
        if (!originalAPI) {
            console.warn('⚠️ API original não encontrada');
            return;
        }

        // Criar wrapper melhorado
        const enhancedAPI = {
            ...originalAPI,
            
            // Override do fetch com funcionalidades plug-and-play
            fetch: async (url, options = {}) => {
                return this.enhancedFetch(url, options, originalAPI.fetch.bind(originalAPI));
            },
            
            // Novos métodos plug-and-play
            callPlugin: (pluginId, endpoint, options = {}) => {
                return this.callPlugin(pluginId, endpoint, options);
            },
            
            getPluginStatus: (pluginId = null) => {
                return this.getPluginStatus(pluginId);
            },
            
            reloadPlugins: () => {
                return this.reloadPlugins();
            },
            
            // Manter compatibilidade total
            _original: originalAPI
        };

        // Substituir API global mantendo compatibilidade
        window.API = enhancedAPI;
        
        console.log('🔧 API existente melhorada com funcionalidades plug-and-play');
    }

    /**
     * Fetch melhorado com funcionalidades plug-and-play
     */
    async enhancedFetch(url, options = {}, originalFetch) {
        try {
            // Detectar se é uma chamada que pode usar plugin
            const pluginInfo = this.detectPluginFromURL(url);
            
            if (pluginInfo && this.pluginManager) {
                console.log(`🔌 Usando plugin ${pluginInfo.pluginId} para ${url}`);
                
                try {
                    // Tentar via plugin manager
                    const result = await this.pluginManager.callAPI(
                        pluginInfo.pluginId, 
                        pluginInfo.endpoint, 
                        options
                    );
                    
                    // Converter para formato esperado pelo admin.js
                    return this.normalizeResponse(result);
                    
                } catch (pluginError) {
                    console.warn(`⚠️ Plugin ${pluginInfo.pluginId} falhou, usando fallback:`, pluginError.message);
                    
                    // Fallback para API original com resiliência
                    return this.fallbackFetch(url, options, originalFetch);
                }
            }
            
            // Para URLs não-plugin, usar API original com resiliência
            return this.fallbackFetch(url, options, originalFetch);
            
        } catch (error) {
            console.error('❌ Erro no enhanced fetch:', error);
            
            // Último recurso: API original
            return originalFetch(url, options);
        }
    }

    /**
     * Fallback com resiliência
     */
    async fallbackFetch(url, options, originalFetch) {
        if (this.resilienceManager) {
            // Usar sistema de resiliência se disponível
            return fetch(url, options); // Interceptado pelo resilience manager
        }
        
        // Fallback final para API original
        return originalFetch(url, options);
    }

    /**
     * Detectar plugin a partir da URL
     */
    detectPluginFromURL(url) {
        const urlStr = typeof url === 'string' ? url : url.toString();
        
        // Mapear URLs para plugins
        const urlPluginMap = [
            { pattern: /localhost:5080|pygeoapi/, pluginId: 'pygeoapi', endpoint: this.extractEndpoint(urlStr, 'pygeoapi') },
            { pattern: /admin-api\/connectors/, pluginId: 'admin-api', endpoint: 'connectors' },
            { pattern: /admin-api\/collections/, pluginId: 'admin-api', endpoint: 'collections' },
            { pattern: /admin-api\/services/, pluginId: 'admin-api', endpoint: 'services' },
            { pattern: /obis\.org/, pluginId: 'obis', endpoint: this.extractEndpoint(urlStr, 'obis') },
            { pattern: /cmems-du\.eu/, pluginId: 'cmems', endpoint: this.extractEndpoint(urlStr, 'cmems') },
            { pattern: /dataspace\.copernicus/, pluginId: 'cdse_sentinel', endpoint: this.extractEndpoint(urlStr, 'cdse_sentinel') }
        ];
        
        for (const mapping of urlPluginMap) {
            if (mapping.pattern.test(urlStr)) {
                return {
                    pluginId: mapping.pluginId,
                    endpoint: mapping.endpoint
                };
            }
        }
        
        return null;
    }

    /**
     * Extrair endpoint da URL
     */
    extractEndpoint(url, pluginType) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            
            // Mapear caminhos para endpoints por tipo de plugin
            const endpointMaps = {
                'pygeoapi': {
                    '/collections': 'collections',
                    '/conformance': 'conformance',
                    '/openapi': 'openapi'
                },
                'obis': {
                    '/occurrence': 'occurrences',
                    '/taxon': 'species'
                },
                'cmems': {
                    '/productdownload': 'data'
                }
            };
            
            const map = endpointMaps[pluginType] || {};
            
            for (const [pathPattern, endpoint] of Object.entries(map)) {
                if (path.includes(pathPattern)) {
                    return endpoint;
                }
            }
            
            // Default endpoint
            return 'data';
            
        } catch (error) {
            return 'data';
        }
    }

    /**
     * Normalizar resposta para compatibilidade
     */
    normalizeResponse(data) {
        // Garantir que a resposta tem o formato esperado pelo admin.js
        if (typeof data === 'object' && data !== null) {
            return data;
        }
        
        // Wrapper para dados primitivos
        return { data: data };
    }

    /**
     * Chamar plugin diretamente
     */
    async callPlugin(pluginId, endpoint, options = {}) {
        if (!this.pluginManager) {
            throw new Error('Plugin Manager não disponível');
        }
        
        try {
            const result = await this.pluginManager.callAPI(pluginId, endpoint, options);
            return this.normalizeResponse(result);
            
        } catch (error) {
            console.error(`❌ Erro ao chamar plugin ${pluginId}:`, error);
            
            // Tentar cache se disponível
            const cacheKey = `${pluginId}_${endpoint}`;
            const cached = this.legacyCache.get(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < 300000) { // 5 min
                console.log(`📦 Usando cache para ${pluginId}/${endpoint}`);
                return cached.data;
            }
            
            throw error;
        }
    }

    /**
     * Obter status de plugins
     */
    getPluginStatus(pluginId = null) {
        if (!this.pluginManager) {
            return { error: 'Plugin Manager não disponível' };
        }
        
        const status = this.pluginManager.getPluginsStatus();
        
        if (pluginId) {
            return status[pluginId] || { error: 'Plugin não encontrado' };
        }
        
        return status;
    }

    /**
     * Recarregar plugins
     */
    async reloadPlugins() {
        if (!this.pluginManager) {
            throw new Error('Plugin Manager não disponível');
        }
        
        console.log('🔄 Recarregando plugins...');
        
        try {
            await this.pluginManager.reloadConfiguration();
            
            // Limpar cache legado
            this.legacyCache.clear();
            
            console.log('✅ Plugins recarregados com sucesso');
            
            return { success: true, message: 'Plugins recarregados' };
            
        } catch (error) {
            console.error('❌ Erro ao recarregar plugins:', error);
            throw error;
        }
    }

    /**
     * Registrar middleware para qualidade
     */
    registerQualityMiddleware() {
        if (!this.pluginManager) return;
        
        // Middleware de cache
        this.pluginManager.use(async (pluginId, endpoint, options) => {
            const cacheKey = `${pluginId}_${endpoint}_${JSON.stringify(options)}`;
            
            // Verificar cache
            const cached = this.legacyCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 60000) { // 1 min
                options._fromCache = true;
                return options;
            }
            
            return options;
        });
        
        // Middleware de logging
        this.pluginManager.use(async (pluginId, endpoint, options) => {
            console.log(`📊 API Call: ${pluginId}/${endpoint}`, {
                timestamp: new Date().toISOString(),
                options: Object.keys(options)
            });
            
            return options;
        });
        
        // Middleware de métricas
        this.pluginManager.use(async (pluginId, endpoint, options) => {
            const startTime = Date.now();
            
            // Adicionar callback para métricas
            const originalCallback = options.onComplete;
            options.onComplete = (result, error) => {
                const duration = Date.now() - startTime;
                
                // Registrar métricas
                this.recordMetrics(pluginId, endpoint, duration, !error);
                
                // Chamar callback original se existir
                if (originalCallback) {
                    originalCallback(result, error);
                }
            };
            
            return options;
        });
        
        console.log('🔧 Middleware de qualidade registrado');
    }

    /**
     * Registrar métricas
     */
    recordMetrics(pluginId, endpoint, duration, success) {
        // Métricas simples para monitoramento
        const metricsKey = `metrics_${pluginId}`;
        let metrics = this.legacyCache.get(metricsKey) || {
            calls: 0,
            successes: 0,
            failures: 0,
            totalDuration: 0,
            avgDuration: 0
        };
        
        metrics.calls++;
        metrics.totalDuration += duration;
        metrics.avgDuration = metrics.totalDuration / metrics.calls;
        
        if (success) {
            metrics.successes++;
        } else {
            metrics.failures++;
        }
        
        this.legacyCache.set(metricsKey, {
            ...metrics,
            timestamp: Date.now()
        });
    }

    /**
     * Obter métricas
     */
    getMetrics(pluginId = null) {
        if (pluginId) {
            const metricsKey = `metrics_${pluginId}`;
            return this.legacyCache.get(metricsKey) || null;
        }
        
        // Todas as métricas
        const allMetrics = {};
        for (const [key, value] of this.legacyCache) {
            if (key.startsWith('metrics_')) {
                const pluginId = key.replace('metrics_', '');
                allMetrics[pluginId] = value;
            }
        }
        
        return allMetrics;
    }

    /**
     * Verificar compatibilidade
     */
    checkCompatibility() {
        const checks = {
            adminJS: !!window.API,
            pluginManager: !!this.pluginManager,
            resilienceManager: !!this.resilienceManager,
            fetch: !!window.fetch
        };
        
        const compatible = Object.values(checks).every(check => check);
        
        return {
            compatible,
            checks,
            version: '1.0.0'
        };
    }

    /**
     * Limpar recursos
     */
    cleanup() {
        this.legacyCache.clear();
        
        // Restaurar API original se necessário
        if (window.API && window.API._original) {
            window.API = window.API._original;
        }
        
        console.log('🧹 API Adapter limpo');
    }
}

// Instância global
window.bgappAPIAdapter = new BGAPPAPIAdapter();

// Auto-inicializar quando tudo estiver pronto
function initializeAdapter() {
    if (window.apiPluginManager && window.apiResilienceManager) {
        window.bgappAPIAdapter.initialize();
    } else {
        // Tentar novamente em 1 segundo
        setTimeout(initializeAdapter, 1000);
    }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdapter);
} else {
    initializeAdapter();
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGAPPAPIAdapter;
}

console.log('🔌 BGAPP API Adapter carregado!');
