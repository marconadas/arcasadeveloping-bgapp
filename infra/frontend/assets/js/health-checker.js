/**
 * BGAPP Health Checker - Diagnóstico Completo da Aplicação
 * Identifica problemas de conectividade, APIs e serviços
 */

class BGAPPHealthChecker {
    constructor() {
        this.results = {};
        this.services = [
            { name: 'Admin API', url: 'http://localhost:8085/admin-api/health', critical: true },
            { name: 'Admin API Collections', url: 'http://localhost:8085/admin-api/collections', critical: true },
            { name: 'Admin API Services', url: 'http://localhost:8085/admin-api/services/status', critical: true },
            { name: 'PyGeoAPI', url: 'http://localhost:5080/', critical: false },
            { name: 'PyGeoAPI Collections', url: 'http://localhost:5080/collections', critical: false },
            { name: 'PostGIS', url: 'http://localhost:5432', critical: true, type: 'tcp' },
            { name: 'MinIO', url: 'http://localhost:9000', critical: false },
            { name: 'STAC', url: 'http://localhost:8081', critical: false },
            { name: 'Frontend', url: 'http://localhost:8085', critical: true }
        ];
        
        this.pluginTests = [
            'api-resilience.js',
            'api-plugin-manager.js', 
            'api-adapter.js'
        ];
        
        console.log('🏥 BGAPP Health Checker inicializado');
    }

    /**
     * Executar health check completo
     */
    async runFullHealthCheck() {
        console.log('🔍 Iniciando health check completo...');
        
        const startTime = Date.now();
        this.results = {
            timestamp: new Date().toISOString(),
            services: {},
            plugins: {},
            system: {},
            summary: {}
        };

        // 1. Testar conectividade básica
        await this.testBasicConnectivity();
        
        // 2. Testar serviços individuais
        await this.testServices();
        
        // 3. Testar sistema de plugins
        await this.testPluginSystem();
        
        // 4. Testar funcionalidades do sistema
        await this.testSystemFeatures();
        
        // 5. Gerar resumo
        this.generateSummary();
        
        const duration = Date.now() - startTime;
        console.log(`✅ Health check completo em ${duration}ms`);
        
        // Exibir resultados
        this.displayResults();
        
        return this.results;
    }

    /**
     * Testar conectividade básica
     */
    async testBasicConnectivity() {
        console.log('🌐 Testando conectividade básica...');
        
        const tests = [
            { name: 'Internet', test: () => navigator.onLine },
            { name: 'LocalStorage', test: () => typeof(Storage) !== "undefined" },
            { name: 'ServiceWorker', test: () => 'serviceWorker' in navigator },
            { name: 'Fetch API', test: () => typeof fetch !== 'undefined' },
            { name: 'WebSocket', test: () => typeof WebSocket !== 'undefined' }
        ];

        this.results.system.connectivity = {};
        
        for (const test of tests) {
            try {
                const result = test.test();
                this.results.system.connectivity[test.name] = {
                    status: result ? 'ok' : 'fail',
                    available: result
                };
            } catch (error) {
                this.results.system.connectivity[test.name] = {
                    status: 'error',
                    error: error.message
                };
            }
        }
    }

    /**
     * Testar serviços individuais
     */
    async testServices() {
        console.log('🔧 Testando serviços...');
        
        const promises = this.services.map(service => this.testSingleService(service));
        await Promise.allSettled(promises);
    }

    /**
     * Testar um serviço específico
     */
    async testSingleService(service) {
        const startTime = Date.now();
        
        try {
            console.log(`🔍 Testando ${service.name}...`);
            
            if (service.type === 'tcp') {
                // Para serviços TCP (como PostGIS), apenas verificar se porta está aberta
                this.results.services[service.name] = {
                    status: 'unknown',
                    message: 'TCP service - cannot test directly from browser',
                    critical: service.critical
                };
                return;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(service.url, {
                method: 'GET',
                signal: controller.signal,
                mode: 'cors',
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            this.results.services[service.name] = {
                status: response.ok ? 'healthy' : 'unhealthy',
                httpStatus: response.status,
                responseTime: responseTime,
                url: service.url,
                critical: service.critical,
                headers: this.getResponseHeaders(response)
            };

            if (response.ok) {
                console.log(`✅ ${service.name}: OK (${responseTime}ms)`);
            } else {
                console.warn(`⚠️ ${service.name}: HTTP ${response.status} (${responseTime}ms)`);
            }

        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            this.results.services[service.name] = {
                status: 'error',
                error: error.message,
                responseTime: responseTime,
                url: service.url,
                critical: service.critical
            };

            console.error(`❌ ${service.name}: ${error.message} (${responseTime}ms)`);
        }
    }

    /**
     * Testar sistema de plugins
     */
    async testPluginSystem() {
        console.log('🔌 Testando sistema de plugins...');
        
        // Testar se scripts foram carregados
        for (const plugin of this.pluginTests) {
            this.results.plugins[plugin] = this.testPluginScript(plugin);
        }

        // Testar instâncias globais
        const globalTests = [
            { name: 'apiResilienceManager', instance: window.apiResilienceManager },
            { name: 'apiPluginManager', instance: window.apiPluginManager },
            { name: 'bgappAPIAdapter', instance: window.bgappAPIAdapter }
        ];

        for (const test of globalTests) {
            this.results.plugins[`global_${test.name}`] = {
                status: test.instance ? 'loaded' : 'missing',
                available: !!test.instance,
                type: test.instance ? typeof test.instance : 'undefined'
            };
        }

        // Testar funcionalidade dos plugins
        await this.testPluginFunctionality();
    }

    /**
     * Testar se script de plugin foi carregado
     */
    testPluginScript(scriptName) {
        const scripts = document.querySelectorAll('script[src*="' + scriptName + '"]');
        
        if (scripts.length === 0) {
            return {
                status: 'not_found',
                loaded: false,
                message: 'Script tag não encontrado'
            };
        }

        const script = scripts[0];
        return {
            status: 'found',
            loaded: true,
            src: script.src,
            async: script.async,
            defer: script.defer
        };
    }

    /**
     * Testar funcionalidade dos plugins
     */
    async testPluginFunctionality() {
        console.log('⚙️ Testando funcionalidade dos plugins...');

        // Testar API Resilience Manager
        if (window.apiResilienceManager) {
            try {
                const stats = window.apiResilienceManager.getStats();
                this.results.plugins.resilience_functionality = {
                    status: 'working',
                    stats: stats,
                    initialized: window.apiResilienceManager.isInitialized
                };
            } catch (error) {
                this.results.plugins.resilience_functionality = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Testar Plugin Manager
        if (window.apiPluginManager) {
            try {
                const pluginStatus = window.apiPluginManager.getPluginsStatus();
                this.results.plugins.manager_functionality = {
                    status: 'working',
                    pluginCount: Object.keys(pluginStatus).length,
                    plugins: pluginStatus,
                    initialized: window.apiPluginManager.isInitialized
                };
            } catch (error) {
                this.results.plugins.manager_functionality = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Testar API Adapter
        if (window.bgappAPIAdapter) {
            try {
                const compatibility = window.bgappAPIAdapter.checkCompatibility();
                this.results.plugins.adapter_functionality = {
                    status: compatibility.compatible ? 'working' : 'incompatible',
                    compatibility: compatibility,
                    initialized: window.bgappAPIAdapter.initialized
                };
            } catch (error) {
                this.results.plugins.adapter_functionality = {
                    status: 'error',
                    error: error.message
                };
            }
        }
    }

    /**
     * Testar funcionalidades do sistema
     */
    async testSystemFeatures() {
        console.log('🔧 Testando funcionalidades do sistema...');

        // Testar API original
        this.results.system.originalAPI = {
            status: window.API ? 'available' : 'missing',
            type: window.API ? typeof window.API : 'undefined',
            methods: window.API ? Object.keys(window.API) : []
        };

        // Testar Service Worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                this.results.system.serviceWorker = {
                    status: registration ? 'registered' : 'not_registered',
                    scope: registration ? registration.scope : null,
                    active: registration && registration.active ? true : false
                };
            } catch (error) {
                this.results.system.serviceWorker = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Testar Cache Storage
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                this.results.system.cacheStorage = {
                    status: 'available',
                    caches: cacheNames,
                    count: cacheNames.length
                };
            } catch (error) {
                this.results.system.cacheStorage = {
                    status: 'error',
                    error: error.message
                };
            }
        }
    }

    /**
     * Gerar resumo dos resultados
     */
    generateSummary() {
        const summary = {
            total: 0,
            healthy: 0,
            unhealthy: 0,
            errors: 0,
            critical_issues: 0,
            warnings: 0
        };

        // Contar serviços
        for (const [name, result] of Object.entries(this.results.services)) {
            summary.total++;
            
            if (result.status === 'healthy') {
                summary.healthy++;
            } else if (result.status === 'unhealthy') {
                summary.unhealthy++;
                if (result.critical) summary.critical_issues++;
            } else if (result.status === 'error') {
                summary.errors++;
                if (result.critical) summary.critical_issues++;
            }
        }

        // Contar plugins
        for (const [name, result] of Object.entries(this.results.plugins)) {
            if (result.status === 'error' || result.status === 'missing') {
                summary.warnings++;
            }
        }

        // Determinar status geral
        if (summary.critical_issues > 0) {
            summary.overall = 'critical';
        } else if (summary.errors > 0 || summary.unhealthy > 0) {
            summary.overall = 'degraded';
        } else if (summary.warnings > 0) {
            summary.overall = 'warning';
        } else {
            summary.overall = 'healthy';
        }

        this.results.summary = summary;
    }

    /**
     * Exibir resultados no console
     */
    displayResults() {
        console.log('\n🏥 =============== HEALTH CHECK RESULTS ===============');
        
        // Status geral
        const statusEmoji = {
            'healthy': '✅',
            'warning': '⚠️',
            'degraded': '🟡',
            'critical': '🔴'
        };

        console.log(`\n${statusEmoji[this.results.summary.overall]} STATUS GERAL: ${this.results.summary.overall.toUpperCase()}`);
        console.log(`📊 Serviços: ${this.results.summary.healthy}/${this.results.summary.total} saudáveis`);
        
        if (this.results.summary.critical_issues > 0) {
            console.log(`🔴 CRÍTICO: ${this.results.summary.critical_issues} problemas críticos encontrados!`);
        }

        // Serviços com problemas
        console.log('\n🔧 SERVIÇOS COM PROBLEMAS:');
        for (const [name, result] of Object.entries(this.results.services)) {
            if (result.status !== 'healthy') {
                const emoji = result.critical ? '🔴' : '⚠️';
                console.log(`${emoji} ${name}: ${result.status} - ${result.error || result.httpStatus}`);
                console.log(`   URL: ${result.url}`);
                if (result.critical) {
                    console.log('   ❗ SERVIÇO CRÍTICO - REQUER ATENÇÃO IMEDIATA');
                }
            }
        }

        // Plugins com problemas
        console.log('\n🔌 PLUGINS COM PROBLEMAS:');
        for (const [name, result] of Object.entries(this.results.plugins)) {
            if (result.status === 'error' || result.status === 'missing' || result.status === 'not_found') {
                console.log(`⚠️ ${name}: ${result.status} - ${result.error || result.message || 'N/A'}`);
            }
        }

        // Recomendações
        this.generateRecommendations();
        
        console.log('\n=============== END HEALTH CHECK ===============\n');
        
        // Salvar resultados globalmente para debug
        window.healthCheckResults = this.results;
        console.log('💾 Resultados salvos em window.healthCheckResults');
    }

    /**
     * Gerar recomendações baseadas nos resultados
     */
    generateRecommendations() {
        console.log('\n💡 RECOMENDAÇÕES:');
        
        const recommendations = [];

        // Verificar serviços críticos offline
        for (const [name, result] of Object.entries(this.results.services)) {
            if (result.critical && result.status !== 'healthy') {
                if (name.includes('Admin API')) {
                    recommendations.push('🔴 CRÍTICO: Iniciar admin-api: python admin_api_simple.py');
                } else if (name.includes('Frontend')) {
                    recommendations.push('🔴 CRÍTICO: Verificar servidor frontend na porta 8085');
                } else if (name.includes('PostGIS')) {
                    recommendations.push('🔴 CRÍTICO: Iniciar PostgreSQL/PostGIS: docker-compose up postgis');
                }
            }
        }

        // Verificar PyGeoAPI
        if (this.results.services['PyGeoAPI'] && this.results.services['PyGeoAPI'].status !== 'healthy') {
            recommendations.push('⚠️ Iniciar PyGeoAPI: docker-compose up pygeoapi');
        }

        // Verificar plugins
        if (this.results.plugins.manager_functionality && this.results.plugins.manager_functionality.status !== 'working') {
            recommendations.push('🔧 Recarregar página para inicializar plugins');
        }

        // Verificar endpoints 404
        const has404 = Object.values(this.results.services).some(s => s.httpStatus === 404);
        if (has404) {
            recommendations.push('🔧 Verificar se admin_api_simple.py está executando com endpoints corretos');
        }

        if (recommendations.length === 0) {
            console.log('✅ Nenhuma ação necessária - sistema funcionando corretamente');
        } else {
            recommendations.forEach(rec => console.log(rec));
        }
    }

    /**
     * Obter headers da resposta
     */
    getResponseHeaders(response) {
        const headers = {};
        for (const [key, value] of response.headers.entries()) {
            headers[key] = value;
        }
        return headers;
    }

    /**
     * Executar diagnóstico rápido
     */
    async quickDiagnostic() {
        console.log('⚡ Diagnóstico rápido...');
        
        const criticalServices = this.services.filter(s => s.critical);
        const promises = criticalServices.map(service => this.testSingleService(service));
        
        await Promise.allSettled(promises);
        
        const criticalDown = Object.entries(this.results.services)
            .filter(([name, result]) => result.critical && result.status !== 'healthy');
        
        if (criticalDown.length > 0) {
            console.log('🔴 SERVIÇOS CRÍTICOS OFFLINE:');
            criticalDown.forEach(([name, result]) => {
                console.log(`❌ ${name}: ${result.error || result.httpStatus}`);
            });
        } else {
            console.log('✅ Todos os serviços críticos estão funcionando');
        }
        
        return criticalDown;
    }
}

// Instância global
window.bgappHealthChecker = new BGAPPHealthChecker();

// Função de conveniência
window.healthCheck = () => window.bgappHealthChecker.runFullHealthCheck();
window.quickCheck = () => window.bgappHealthChecker.quickDiagnostic();

// Auto-executar health check após carregamento (desabilitado para MinPerMar)
setTimeout(() => {
    // Verificar se estamos no contexto MinPerMar
    const isMinPerMar = window.location.pathname.includes('/minpermar') || 
                        window.location.pathname.includes('minpermar-site');
    
    if (isMinPerMar) {
        console.log('🏥 Health check desabilitado no MinPerMar');
        return;
    }
    
    console.log('🏥 Executando health check automático...');
    window.bgappHealthChecker.runFullHealthCheck();
}, 2000);

console.log('🏥 BGAPP Health Checker carregado! Use healthCheck() ou quickCheck()');
