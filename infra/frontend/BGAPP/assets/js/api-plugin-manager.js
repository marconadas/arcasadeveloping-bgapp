/**
 * BGAPP API Plugin Manager - Arquitetura Plug-and-Play
 * Sistema modular para APIs com qualidade enterprise
 * 
 * OBJETIVOS:
 * - APIs funcionem em modo plug-and-play
 * - Manter alta qualidade da aplicação
 * - Facilitar adição/remoção de conectores
 * - Isolamento de falhas por conector
 * - Configuração dinâmica
 */

class APIPluginManager {
    constructor() {
        this.plugins = new Map();
        this.registry = new Map();
        this.middleware = [];
        this.config = {
            autoDiscovery: true,
            healthCheckInterval: 30000,
            pluginTimeout: 10000,
            maxRetries: 3,
            circuitBreakerThreshold: 5
        };
        
        // Plugin lifecycle hooks
        this.hooks = {
            beforeLoad: [],
            afterLoad: [],
            beforeUnload: [],
            afterUnload: [],
            onError: [],
            onHealthCheck: []
        };
        
        this.isInitialized = false;
        this.healthMonitor = null;
        
        console.log('🔌 API Plugin Manager inicializado');
    }

    /**
     * Inicializar o sistema de plugins
     */
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🚀 Inicializando API Plugin Manager...');
        
        // Carregar configuração de plugins
        await this.loadPluginConfiguration();
        
        // Auto-descobrir plugins disponíveis
        if (this.config.autoDiscovery) {
            await this.discoverPlugins();
        }
        
        // Carregar plugins ativos
        await this.loadActivePlugins();
        
        // Iniciar monitoramento de saúde
        this.startHealthMonitoring();
        
        this.isInitialized = true;
        console.log('✅ API Plugin Manager ativo');
        
        // Emitir evento de inicialização
        this.emit('manager:initialized', { pluginCount: this.plugins.size });
    }

    /**
     * Registrar um novo plugin
     */
    registerPlugin(pluginDefinition) {
        try {
            // Validar definição do plugin
            this.validatePluginDefinition(pluginDefinition);
            
            const plugin = new APIPlugin(pluginDefinition, this);
            this.registry.set(pluginDefinition.id, plugin);
            
            console.log(`📦 Plugin registrado: ${pluginDefinition.name} (${pluginDefinition.id})`);
            
            // Auto-carregar se configurado
            if (pluginDefinition.autoLoad) {
                this.loadPlugin(pluginDefinition.id);
            }
            
            return plugin;
            
        } catch (error) {
            console.error(`❌ Erro ao registrar plugin ${pluginDefinition.id}:`, error);
            this.handlePluginError(pluginDefinition.id, error);
            throw error;
        }
    }

    /**
     * Carregar um plugin específico
     */
    async loadPlugin(pluginId) {
        try {
            const plugin = this.registry.get(pluginId);
            if (!plugin) {
                throw new Error(`Plugin ${pluginId} não encontrado no registry`);
            }
            
            if (this.plugins.has(pluginId)) {
                console.warn(`⚠️ Plugin ${pluginId} já está carregado`);
                return this.plugins.get(pluginId);
            }
            
            // Executar hooks beforeLoad
            await this.executeHooks('beforeLoad', { pluginId, plugin });
            
            // Carregar plugin
            await plugin.load();
            
            // Adicionar aos plugins ativos
            this.plugins.set(pluginId, plugin);
            
            // Executar hooks afterLoad
            await this.executeHooks('afterLoad', { pluginId, plugin });
            
            console.log(`✅ Plugin carregado: ${plugin.definition.name}`);
            
            // Emitir evento
            this.emit('plugin:loaded', { pluginId, plugin });
            
            return plugin;
            
        } catch (error) {
            console.error(`❌ Erro ao carregar plugin ${pluginId}:`, error);
            this.handlePluginError(pluginId, error);
            throw error;
        }
    }

    /**
     * Descarregar um plugin
     */
    async unloadPlugin(pluginId) {
        try {
            const plugin = this.plugins.get(pluginId);
            if (!plugin) {
                console.warn(`⚠️ Plugin ${pluginId} não está carregado`);
                return;
            }
            
            // Executar hooks beforeUnload
            await this.executeHooks('beforeUnload', { pluginId, plugin });
            
            // Descarregar plugin
            await plugin.unload();
            
            // Remover dos plugins ativos
            this.plugins.delete(pluginId);
            
            // Executar hooks afterUnload
            await this.executeHooks('afterUnload', { pluginId, plugin });
            
            console.log(`🗑️ Plugin descarregado: ${plugin.definition.name}`);
            
            // Emitir evento
            this.emit('plugin:unloaded', { pluginId, plugin });
            
        } catch (error) {
            console.error(`❌ Erro ao descarregar plugin ${pluginId}:`, error);
            this.handlePluginError(pluginId, error);
        }
    }

    /**
     * Fazer chamada de API através de um plugin
     */
    async callAPI(pluginId, endpoint, options = {}) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} não está carregado`);
        }
        
        if (!plugin.isHealthy()) {
            throw new Error(`Plugin ${pluginId} não está saudável`);
        }
        
        // Aplicar middleware
        const processedOptions = await this.applyMiddleware(pluginId, endpoint, options);
        
        try {
            // Fazer chamada através do plugin
            const result = await plugin.call(endpoint, processedOptions);
            
            // Registrar sucesso
            plugin.recordSuccess();
            
            return result;
            
        } catch (error) {
            // Registrar falha
            plugin.recordFailure(error);
            
            // Tentar fallback se configurado
            if (plugin.definition.fallback) {
                console.log(`🔄 Tentando fallback para ${pluginId}...`);
                return this.callAPI(plugin.definition.fallback, endpoint, options);
            }
            
            throw error;
        }
    }

    /**
     * Adicionar middleware
     */
    use(middlewareFunction) {
        if (typeof middlewareFunction !== 'function') {
            throw new Error('Middleware deve ser uma função');
        }
        
        this.middleware.push(middlewareFunction);
        console.log(`🔧 Middleware adicionado (total: ${this.middleware.length})`);
    }

    /**
     * Adicionar hook para lifecycle
     */
    addHook(hookName, hookFunction) {
        if (!this.hooks[hookName]) {
            this.hooks[hookName] = [];
        }
        
        this.hooks[hookName].push(hookFunction);
        console.log(`🪝 Hook adicionado: ${hookName}`);
    }

    /**
     * Obter status de todos os plugins
     */
    getPluginsStatus() {
        const status = {};
        
        for (const [pluginId, plugin] of this.plugins) {
            status[pluginId] = {
                name: plugin.definition.name,
                type: plugin.definition.type,
                status: plugin.getStatus(),
                health: plugin.getHealthMetrics(),
                loaded: plugin.isLoaded(),
                enabled: plugin.isEnabled()
            };
        }
        
        return status;
    }

    /**
     * Recarregar configuração de plugins
     */
    async reloadConfiguration() {
        console.log('🔄 Recarregando configuração de plugins...');
        
        // Salvar estado atual
        const currentPlugins = Array.from(this.plugins.keys());
        
        // Recarregar configuração
        await this.loadPluginConfiguration();
        
        // Re-descobrir plugins
        await this.discoverPlugins();
        
        // Recarregar plugins que estavam ativos
        for (const pluginId of currentPlugins) {
            if (this.registry.has(pluginId)) {
                await this.loadPlugin(pluginId);
            }
        }
        
        console.log('✅ Configuração recarregada');
    }

    // ==================== MÉTODOS PRIVADOS ====================

    /**
     * Carregar configuração de plugins
     */
    async loadPluginConfiguration() {
        try {
            // Tentar carregar de várias fontes
            const sources = [
                '/admin-api/plugins/configuration',
                '/api/plugins/config',
                '/assets/config/plugins.json'
            ];
            
            for (const source of sources) {
                try {
                    const response = await fetch(source);
                    if (response.ok) {
                        const config = await response.json();
                        this.mergeConfiguration(config);
                        console.log(`📋 Configuração carregada de: ${source}`);
                        return;
                    }
                } catch (error) {
                    console.debug(`Fonte de configuração não disponível: ${source}`);
                }
            }
            
            // Fallback para configuração padrão
            this.loadDefaultConfiguration();
            
        } catch (error) {
            console.error('❌ Erro ao carregar configuração:', error);
            this.loadDefaultConfiguration();
        }
    }

    /**
     * Auto-descobrir plugins disponíveis
     */
    async discoverPlugins() {
        console.log('🔍 Descobrindo plugins disponíveis...');
        
        try {
            // Descobrir através da API
            const response = await fetch('/admin-api/connectors');
            if (response.ok) {
                const connectors = await response.json();
                
                for (const connector of connectors) {
                    if (!this.registry.has(connector.id)) {
                        this.registerPluginFromConnector(connector);
                    }
                }
            }
        } catch (error) {
            console.debug('Auto-descoberta via API falhou, usando configuração estática');
        }
        
        // Descobrir plugins estáticos conhecidos
        this.discoverStaticPlugins();
    }

    /**
     * Carregar plugins ativos
     */
    async loadActivePlugins() {
        console.log('📦 Carregando plugins ativos...');
        
        const promises = [];
        for (const [pluginId, plugin] of this.registry) {
            if (plugin.definition.autoLoad) {
                promises.push(this.loadPlugin(pluginId));
            }
        }
        
        // Carregar em paralelo mas com controle de erros
        const results = await Promise.allSettled(promises);
        
        let loaded = 0, failed = 0;
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                loaded++;
            } else {
                failed++;
                console.error(`❌ Falha ao carregar plugin:`, result.reason);
            }
        });
        
        console.log(`📊 Plugins carregados: ${loaded}, Falhas: ${failed}`);
    }

    /**
     * Iniciar monitoramento de saúde
     */
    startHealthMonitoring() {
        if (this.healthMonitor) {
            clearInterval(this.healthMonitor);
        }
        
        this.healthMonitor = setInterval(async () => {
            await this.performHealthChecks();
        }, this.config.healthCheckInterval);
        
        console.log(`🏥 Monitoramento de saúde ativo (${this.config.healthCheckInterval/1000}s)`);
    }

    /**
     * Realizar health checks
     */
    async performHealthChecks() {
        const promises = [];
        
        for (const [pluginId, plugin] of this.plugins) {
            promises.push(
                plugin.healthCheck().catch(error => {
                    console.warn(`⚠️ Health check falhou para ${pluginId}:`, error);
                    return { pluginId, healthy: false, error };
                })
            );
        }
        
        const results = await Promise.allSettled(promises);
        
        // Executar hooks de health check
        await this.executeHooks('onHealthCheck', { results });
    }

    /**
     * Validar definição de plugin
     */
    validatePluginDefinition(definition) {
        const required = ['id', 'name', 'version', 'type'];
        
        for (const field of required) {
            if (!definition[field]) {
                throw new Error(`Campo obrigatório ausente: ${field}`);
            }
        }
        
        if (this.registry.has(definition.id)) {
            throw new Error(`Plugin com ID ${definition.id} já existe`);
        }
    }

    /**
     * Aplicar middleware à requisição
     */
    async applyMiddleware(pluginId, endpoint, options) {
        let processedOptions = { ...options };
        
        for (const middleware of this.middleware) {
            try {
                processedOptions = await middleware(pluginId, endpoint, processedOptions) || processedOptions;
            } catch (error) {
                console.error('❌ Erro no middleware:', error);
            }
        }
        
        return processedOptions;
    }

    /**
     * Executar hooks
     */
    async executeHooks(hookName, context) {
        const hooks = this.hooks[hookName] || [];
        
        for (const hook of hooks) {
            try {
                await hook(context);
            } catch (error) {
                console.error(`❌ Erro no hook ${hookName}:`, error);
            }
        }
    }

    /**
     * Tratar erro de plugin
     */
    handlePluginError(pluginId, error) {
        this.executeHooks('onError', { pluginId, error });
        
        // Log estruturado para debugging
        console.error('🚨 Plugin Error:', {
            pluginId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registrar plugin a partir de conector
     */
    registerPluginFromConnector(connector) {
        const pluginDefinition = {
            id: connector.id,
            name: connector.name,
            version: '1.0.0',
            type: connector.type,
            description: connector.description,
            module: connector.module,
            autoLoad: connector.enabled,
            endpoints: this.getConnectorEndpoints(connector),
            healthCheck: `/admin-api/connectors/${connector.id}/health`,
            fallback: this.getConnectorFallback(connector)
        };
        
        this.registry.set(connector.id, new APIPlugin(pluginDefinition, this));
        console.log(`🔌 Plugin auto-registrado: ${connector.name}`);
    }

    /**
     * Descobrir plugins estáticos
     */
    discoverStaticPlugins() {
        // Plugins fundamentais sempre disponíveis
        const staticPlugins = [
            {
                id: 'admin-api',
                name: 'Admin API',
                version: '1.0.0',
                type: 'core',
                description: 'API administrativa principal',
                autoLoad: true,
                baseUrl: '/admin-api',
                endpoints: ['services/status', 'connectors', 'collections']
            },
            {
                id: 'pygeoapi',
                name: 'PyGeoAPI',
                version: '1.0.0', 
                type: 'geospatial',
                description: 'OGC API Features',
                autoLoad: true,
                baseUrl: 'http://localhost:5080',
                fallback: 'admin-api',
                endpoints: ['collections', 'conformance', 'openapi']
            }
        ];
        
        for (const pluginDef of staticPlugins) {
            if (!this.registry.has(pluginDef.id)) {
                this.registry.set(pluginDef.id, new APIPlugin(pluginDef, this));
            }
        }
    }

    /**
     * Carregar configuração padrão
     */
    loadDefaultConfiguration() {
        this.config = {
            ...this.config,
            autoDiscovery: true,
            healthCheckInterval: 30000,
            pluginTimeout: 10000,
            maxRetries: 3,
            circuitBreakerThreshold: 5
        };
        
        console.log('📋 Configuração padrão carregada');
    }

    /**
     * Obter endpoints do conector
     */
    getConnectorEndpoints(connector) {
        // Mapear tipos para endpoints comuns
        const endpointMap = {
            'Biodiversidade': ['occurrences', 'species'],
            'Oceanografia': ['data', 'metadata'],
            'Satélite': ['imagery', 'products'],
            'Pesca': ['statistics', 'catches'],
            'Tempo Real': ['current', 'forecast'],
            'Clima': ['historical', 'analysis']
        };
        
        return endpointMap[connector.type] || ['data'];
    }

    /**
     * Obter fallback do conector
     */
    getConnectorFallback(connector) {
        // Fallbacks por tipo
        const fallbackMap = {
            'Biodiversidade': 'admin-api',
            'Oceanografia': 'admin-api',
            'Satélite': 'admin-api'
        };
        
        return fallbackMap[connector.type] || 'admin-api';
    }

    /**
     * Mesclar configuração
     */
    mergeConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Emitir evento
     */
    emit(eventName, data) {
        const event = new CustomEvent(`apimanager:${eventName}`, { detail: data });
        window.dispatchEvent(event);
    }

    /**
     * Limpar recursos
     */
    cleanup() {
        if (this.healthMonitor) {
            clearInterval(this.healthMonitor);
        }
        
        // Descarregar todos os plugins
        for (const pluginId of this.plugins.keys()) {
            this.unloadPlugin(pluginId);
        }
        
        console.log('🧹 API Plugin Manager limpo');
    }
}

/**
 * Classe para representar um plugin individual
 */
class APIPlugin {
    constructor(definition, manager) {
        this.definition = definition;
        this.manager = manager;
        this.loaded = false;
        this.enabled = true;
        this.metrics = {
            requests: 0,
            successes: 0,
            failures: 0,
            lastSuccess: null,
            lastFailure: null,
            avgResponseTime: 0
        };
        this.circuitBreaker = {
            open: false,
            failures: 0,
            lastFailure: null,
            nextRetry: null
        };
    }

    /**
     * Carregar plugin
     */
    async load() {
        if (this.loaded) return;
        
        console.log(`📦 Carregando plugin: ${this.definition.name}`);
        
        // Validar conectividade
        await this.validateConnectivity();
        
        this.loaded = true;
        this.enabled = true;
        
        console.log(`✅ Plugin carregado: ${this.definition.name}`);
    }

    /**
     * Descarregar plugin
     */
    async unload() {
        if (!this.loaded) return;
        
        console.log(`🗑️ Descarregando plugin: ${this.definition.name}`);
        
        this.loaded = false;
        this.enabled = false;
        
        console.log(`✅ Plugin descarregado: ${this.definition.name}`);
    }

    /**
     * Fazer chamada de API
     */
    async call(endpoint, options = {}) {
        if (!this.loaded || !this.enabled) {
            throw new Error(`Plugin ${this.definition.id} não está disponível`);
        }
        
        if (this.circuitBreaker.open) {
            if (Date.now() < this.circuitBreaker.nextRetry) {
                throw new Error(`Circuit breaker aberto para ${this.definition.id}`);
            } else {
                // Tentar resetar circuit breaker
                this.circuitBreaker.open = false;
                this.circuitBreaker.failures = 0;
            }
        }
        
        const startTime = Date.now();
        
        try {
            const url = this.buildUrl(endpoint);
            const response = await this.makeRequest(url, options);
            
            const responseTime = Date.now() - startTime;
            this.updateMetrics(true, responseTime);
            
            return response;
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateMetrics(false, responseTime);
            
            // Atualizar circuit breaker
            this.circuitBreaker.failures++;
            this.circuitBreaker.lastFailure = Date.now();
            
            if (this.circuitBreaker.failures >= this.manager.config.circuitBreakerThreshold) {
                this.circuitBreaker.open = true;
                this.circuitBreaker.nextRetry = Date.now() + (30 * 1000); // 30s
                console.warn(`⚠️ Circuit breaker aberto para ${this.definition.id}`);
            }
            
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        if (!this.loaded) return { healthy: false, reason: 'not loaded' };
        
        try {
            const healthUrl = this.definition.healthCheck || this.buildUrl('');
            const startTime = Date.now();
            
            const response = await fetch(healthUrl, {
                method: 'GET',
                timeout: 5000
            });
            
            const responseTime = Date.now() - startTime;
            const healthy = response.ok;
            
            return {
                healthy,
                responseTime,
                status: response.status,
                timestamp: Date.now()
            };
            
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    // ==================== MÉTODOS AUXILIARES ====================

    buildUrl(endpoint) {
        const baseUrl = this.definition.baseUrl || '';
        return endpoint ? `${baseUrl}/${endpoint}` : baseUrl;
    }

    async makeRequest(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(), 
            this.manager.config.pluginTimeout
        );
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    async validateConnectivity() {
        // Tentar health check básico
        try {
            await this.healthCheck();
        } catch (error) {
            console.warn(`⚠️ Conectividade limitada para ${this.definition.name}:`, error.message);
        }
    }

    updateMetrics(success, responseTime) {
        this.metrics.requests++;
        
        if (success) {
            this.metrics.successes++;
            this.metrics.lastSuccess = Date.now();
            this.circuitBreaker.failures = 0; // Reset failures on success
        } else {
            this.metrics.failures++;
            this.metrics.lastFailure = Date.now();
        }
        
        // Atualizar tempo médio de resposta
        const totalTime = this.metrics.avgResponseTime * (this.metrics.requests - 1) + responseTime;
        this.metrics.avgResponseTime = totalTime / this.metrics.requests;
    }

    // ==================== GETTERS ====================

    isLoaded() { return this.loaded; }
    isEnabled() { return this.enabled; }
    
    isHealthy() {
        return this.loaded && this.enabled && !this.circuitBreaker.open;
    }
    
    getStatus() {
        if (!this.loaded) return 'unloaded';
        if (!this.enabled) return 'disabled';
        if (this.circuitBreaker.open) return 'circuit_open';
        return 'active';
    }
    
    getHealthMetrics() {
        return {
            ...this.metrics,
            circuitBreaker: this.circuitBreaker
        };
    }

    recordSuccess() {
        this.updateMetrics(true, 0);
    }

    recordFailure(error) {
        this.updateMetrics(false, 0);
    }
}

// Instância global
window.apiPluginManager = new APIPluginManager();

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.apiPluginManager.initialize();
    });
} else {
    window.apiPluginManager.initialize();
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIPluginManager, APIPlugin };
}

console.log('🔌 API Plugin Manager carregado!');
