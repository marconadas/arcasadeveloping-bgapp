/**
 * Sistema Robusto de Tratamento de Erros - BGAPP
 * Baseado nas funcionalidades avançadas do index-fresh.html
 * Implementa fallback automático, monitoramento proativo e diagnósticos
 */

class RobustErrorHandler {
    constructor() {
        this.errorStats = {
            eox: { count: 0, lastError: null, blocked: false },
            gebco: { count: 0, lastError: null, blocked: false },
            stamen: { count: 0, lastError: null, blocked: false },
            esri: { count: 0, lastError: null, blocked: false }
        };
        
        this.rateLimits = {
            eox: { maxRequests: 40, windowMs: 10000, count: 0, lastReset: Date.now() },
            gebco: { maxRequests: 20, windowMs: 10000, count: 0, lastReset: Date.now() },
            stamen: { maxRequests: 25, windowMs: 10000, count: 0, lastReset: Date.now() },
            esri: { maxRequests: 50, windowMs: 10000, count: 0, lastReset: Date.now() }
        };
        
        this.fallbackChain = [
            { name: 'EOX', available: true },
            { name: 'OpenStreetMap', available: true },
            { name: 'CartoDB', available: true },
            { name: 'ESRI', available: true }
        ];
        
        this.tileCache = new Map();
        this.maxCacheSize = 200;
        this.isInitialized = false;
        
        console.log('🛡️ Robust Error Handler inicializado');
    }

    /**
     * Inicializar sistema de tratamento de erros
     */
    initialize() {
        if (this.isInitialized) {
            console.log('⚠️ Error Handler já inicializado');
            return;
        }

        console.log('🚀 Inicializando Sistema Robusto de Tratamento de Erros...');
        
        // 1. Configurar interceptação de fetch
        this.setupFetchInterception();
        
        // 2. Configurar tratamento global de erros
        this.setupGlobalErrorHandling();
        
        // 3. Inicializar monitoramento proativo
        this.setupProactiveMonitoring();
        
        // 4. Configurar sistema de cache inteligente
        this.setupIntelligentCache();
        
        this.isInitialized = true;
        console.log('✅ Sistema Robusto de Tratamento de Erros inicializado');
    }

    /**
     * Configurar interceptação de fetch para monitoramento e rate limiting
     */
    setupFetchInterception() {
        console.log('🔧 Configurando interceptação de fetch...');
        
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = function(...args) {
            const url = args[0];
            
            if (typeof url === 'string') {
                const serviceType = self.identifyService(url);
                
                if (serviceType) {
                    // Verificar rate limit
                    if (self.isRateLimited(serviceType)) {
                        console.warn(`⚠️ Rate limit atingido para ${serviceType.toUpperCase()}`);
                        return Promise.reject(new Error(`Rate limit exceeded for ${serviceType}`));
                    }
                    
                    // Verificar cache primeiro
                    const cachedResponse = self.getCachedResponse(url);
                    if (cachedResponse) {
                        console.log(`🎯 Cache hit para ${serviceType}: ${url.substring(0, 80)}...`);
                        return Promise.resolve(cachedResponse);
                    }
                    
                    // Aplicar correções automáticas para URLs problemáticas
                    const correctedUrl = self.applyCorrections(url, serviceType);
                    if (correctedUrl !== url) {
                        args[0] = correctedUrl;
                        console.log(`🔧 URL corrigida para ${serviceType}`);
                    }
                    
                    // Incrementar contador
                    self.incrementRequestCount(serviceType);
                    
                    // Configurar timeout
                    const timeoutMs = self.getTimeoutForService(serviceType);
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
                    
                    args[1] = { ...(args[1] || {}), signal: controller.signal };
                    
                    return originalFetch.apply(this, args)
                        .then(response => {
                            clearTimeout(timeoutId);
                            return self.handleResponse(response, url, serviceType);
                        })
                        .catch(error => {
                            clearTimeout(timeoutId);
                            return self.handleFetchError(error, url, serviceType);
                        });
                }
            }
            
            return originalFetch.apply(this, args);
        };
        
        console.log('✅ Interceptação de fetch configurada');
    }

    /**
     * Identificar tipo de serviço pela URL
     */
    identifyService(url) {
        if (url.includes('tiles.maps.eox.at')) return 'eox';
        if (url.includes('gebco.net')) return 'gebco';
        if (url.includes('stamen-tiles') || url.includes('tile.stamen.com') || url.includes('tiles.stadiamaps.com')) return 'stamen';
        if (url.includes('arcgisonline.com')) return 'esri';
        return null;
    }

    /**
     * Verificar se serviço está sob rate limiting
     */
    isRateLimited(serviceType) {
        const now = Date.now();
        const limits = this.rateLimits[serviceType];
        
        if (!limits) return false;
        
        // Reset contador se janela de tempo passou
        if (now - limits.lastReset > limits.windowMs) {
            limits.count = 0;
            limits.lastReset = now;
            this.errorStats[serviceType].blocked = false;
        }
        
        return limits.count >= limits.maxRequests;
    }

    /**
     * Incrementar contador de requisições
     */
    incrementRequestCount(serviceType) {
        const limits = this.rateLimits[serviceType];
        if (limits) {
            limits.count++;
        }
    }

    /**
     * Obter resposta do cache
     */
    getCachedResponse(url) {
        if (!url.includes('GetMap')) return null;
        
        const cachedData = this.tileCache.get(url);
        if (!cachedData) return null;
        
        const cacheAge = Date.now() - cachedData.timestamp;
        const maxAge = cachedData.priority === 'high' ? 3600000 : 1800000; // 1h para batimetria, 30min para outros
        
        if (cacheAge < maxAge) {
            return cachedData.response.clone();
        } else {
            this.tileCache.delete(url);
            return null;
        }
    }

    /**
     * Aplicar correções automáticas para URLs problemáticas
     */
    applyCorrections(url, serviceType) {
        if (serviceType === 'eox') {
            // Correções específicas para EOX
            let correctedUrl = url;
            
            // Corrigir camada terrain-light para terrain_3857
            if (url.includes('terrain-light')) {
                correctedUrl = correctedUrl.replace('terrain-light', 'terrain_3857');
                console.log('🔧 Correção: terrain-light → terrain_3857');
            }
            
            // Corrigir versão WMS problemática
            if (url.includes('version=1.3.0')) {
                correctedUrl = correctedUrl.replace('version=1.3.0', 'version=1.1.1');
                console.log('🔧 Correção: version 1.3.0 → 1.1.1');
            }
            
            // Permitir camada bathymetry usando terrain_3857 (que inclui dados GEBCO)
            if (url.includes('bathymetry') && serviceType === 'eox') {
                console.log('🌊 Bathymetry layer usando terrain_3857 (inclui GEBCO)');
            }
            
            return correctedUrl;
        }
        
        return url;
    }

    /**
     * Obter timeout apropriado para o serviço
     */
    getTimeoutForService(serviceType) {
        const timeouts = {
            eox: 5000,
            gebco: 8000,
            stamen: 6000,
            esri: 7000
        };
        
        return timeouts[serviceType] || 5000;
    }

    /**
     * Tratar resposta HTTP
     */
    handleResponse(response, url, serviceType) {
        if (response.ok) {
            // Cachear resposta se for tile de imagem
            if (url.includes('GetMap')) {
                this.cacheResponse(url, response, serviceType);
            }
            return response;
        } else {
            // Analisar tipo de erro
            this.analyzeHTTPError(response.status, url, serviceType);
            return response;
        }
    }

    /**
     * Tratar erro de fetch
     */
    handleFetchError(error, url, serviceType) {
        this.errorStats[serviceType].count++;
        this.errorStats[serviceType].lastError = error.message;
        
        if (error.name === 'AbortError') {
            console.warn(`⏱️ Timeout para ${serviceType}: ${url.substring(0, 80)}...`);
        } else if (error.message.includes('CORS')) {
            console.warn(`🚫 CORS bloqueado para ${serviceType}`);
        } else {
            console.warn(`❌ Erro em requisição ${serviceType}: ${error.message}`);
        }
        
        // Verificar se deve ativar fallback automático
        this.checkAutoFallback(serviceType);
        
        throw error;
    }

    /**
     * Analisar erro HTTP específico
     */
    analyzeHTTPError(status, url, serviceType) {
        console.warn(`❌ HTTP ${status} para ${serviceType}: ${url.substring(0, 100)}...`);
        
        switch (status) {
            case 400:
                console.error(`🔍 Bad Request para ${serviceType} - URL pode estar mal formada`);
                if (serviceType === 'eox') {
                    this.diagnoseEOXError(url);
                }
                break;
                
            case 404:
                console.warn(`📭 404 para ${serviceType} - camada pode estar indisponível`);
                break;
                
            case 429:
                console.error(`⏰ Rate limit atingido para ${serviceType}`);
                this.errorStats[serviceType].blocked = true;
                break;
                
            case 503:
                console.error(`🔧 Service Unavailable para ${serviceType}`);
                this.handleServiceUnavailable(serviceType);
                break;
        }
        
        this.errorStats[serviceType].count++;
    }

    /**
     * Cachear resposta
     */
    cacheResponse(url, response, serviceType) {
        // Gerenciar tamanho do cache
        if (this.tileCache.size >= this.maxCacheSize) {
            this.cleanCache();
        }
        
        const priority = (url.includes('terrain') || url.includes('bathymetry')) ? 'high' : 'normal';
        
        this.tileCache.set(url, {
            response: response.clone(),
            timestamp: Date.now(),
            serviceType: serviceType,
            priority: priority
        });
    }

    /**
     * Limpar cache inteligentemente
     */
    cleanCache() {
        const toRemove = [];
        let removedCount = 0;
        const targetRemoval = Math.floor(this.maxCacheSize * 0.2);
        
        // Remover tiles não-prioritárias primeiro
        for (const [url, data] of this.tileCache.entries()) {
            if (data.priority !== 'high' && removedCount < targetRemoval) {
                toRemove.push(url);
                removedCount++;
            }
        }
        
        // Se não encontrou suficientes, remover as mais antigas
        if (removedCount < targetRemoval) {
            const entries = Array.from(this.tileCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const oldEntries = entries.slice(0, targetRemoval - removedCount);
            toRemove.push(...oldEntries.map(([url]) => url));
        }
        
        toRemove.forEach(url => this.tileCache.delete(url));
        console.log(`🧹 Cache limpo: ${toRemove.length} tiles removidas`);
    }

    /**
     * Verificar se deve ativar fallback automático
     */
    checkAutoFallback(serviceType) {
        const errorCount = this.errorStats[serviceType].count;
        const threshold = serviceType === 'eox' ? 5 : 10;
        
        if (errorCount > threshold && !this.errorStats[serviceType].blocked) {
            console.error(`❌ Muitos erros ${serviceType.toUpperCase()} - Ativando fallback automático`);
            this.activateServiceFallback(serviceType);
        }
    }

    /**
     * Ativar fallback para serviço específico
     */
    activateServiceFallback(serviceType) {
        this.errorStats[serviceType].blocked = true;
        
        // Desabilitar botões relacionados ao serviço
        this.disableServiceButtons(serviceType);
        
        // Ativar próximo serviço na cadeia de fallback
        this.activateNextInFallbackChain(serviceType);
        
        // Mostrar notificação
        this.showServiceFallbackNotification(serviceType);
    }

    /**
     * Desabilitar botões relacionados ao serviço
     */
    disableServiceButtons(serviceType) {
        let selector = '';
        
        switch (serviceType) {
            case 'eox':
                selector = '[data-layer*="terrain"], [data-layer*="sentinel"], [data-layer*="black-marble"], [data-layer*="blue-marble"]';
                break;
            case 'stamen':
                selector = '[data-layer*="stamen"]';
                break;
        }
        
        if (selector) {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(btn => {
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                }
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.filter = 'grayscale(100%)';
                btn.title = `🚫 Serviço ${serviceType.toUpperCase()} indisponível`;
            });
        }
    }

    /**
     * Ativar próximo serviço na cadeia de fallback
     */
    activateNextInFallbackChain(failedService) {
        // Encontrar próximo serviço disponível
        const fallbackOrder = ['osm', 'cartodb', 'esri'];
        
        for (const service of fallbackOrder) {
            const btn = document.querySelector(`[data-layer="${service}"]`);
            if (btn && !btn.disabled) {
                btn.click();
                console.log(`🔄 Fallback automático: ${failedService} → ${service}`);
                break;
            }
        }
    }

    /**
     * Tratar serviço indisponível (503)
     */
    handleServiceUnavailable(serviceType) {
        if (serviceType === 'stamen') {
            // Stamen tem problemas conhecidos com 503
            setTimeout(() => {
                console.log(`🔄 Tentando reabilitar ${serviceType} após 5 minutos...`);
                this.errorStats[serviceType].count = 0;
                this.errorStats[serviceType].blocked = false;
            }, 300000); // 5 minutos
        }
    }

    /**
     * Diagnosticar erro específico do EOX
     */
    diagnoseEOXError(url) {
        console.group('🔧 Diagnóstico EOX 400 Error');
        
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);
            
            console.log('📋 Parâmetros da requisição:');
            for (const [key, value] of params.entries()) {
                console.log(`  ${key}: ${value}`);
            }
            
            const layers = params.get('layers');
            const version = params.get('version');
            const bbox = params.get('bbox');
            
            console.log('🔍 Problemas detectados:');
            
            if (layers && layers.includes('terrain-light')) {
                console.warn('  ⚠️ Camada "terrain-light" incorreta - usar "terrain_3857"');
            }
            
            if (version === '1.3.0') {
                console.warn('  ⚠️ Versão 1.3.0 pode ser incompatível - usar "1.1.1"');
            }
            
            if (bbox) {
                const bboxValues = bbox.split(',').map(Number);
                if (bboxValues.some(val => Math.abs(val) > 20037508)) {
                    console.warn('  ⚠️ Bbox fora dos limites EPSG:3857');
                }
            }
            
        } catch (error) {
            console.error('❌ Erro no diagnóstico:', error);
        }
        
        console.groupEnd();
    }

    /**
     * Configurar tratamento global de erros
     */
    setupGlobalErrorHandling() {
        // Erros JavaScript não tratados
        window.addEventListener('error', (event) => {
            if (this.isMapRelatedError(event)) {
                console.log('🛡️ Erro de mapa interceptado - aplicação continua funcionando');
                event.preventDefault();
                return false;
            }
        });
        
        // Promises rejeitadas não tratadas
        window.addEventListener('unhandledrejection', (event) => {
            if (this.isNetworkRelatedError(event.reason)) {
                console.log('🛡️ Erro de rede interceptado - aplicação continua funcionando');
                event.preventDefault();
            }
        });
        
        console.log('✅ Tratamento global de erros configurado');
    }

    /**
     * Verificar se é erro relacionado ao mapa
     */
    isMapRelatedError(event) {
        return event.message && (
            event.message.includes('invalidateSize') ||
            event.message.includes('EOX') ||
            event.message.includes('GEBCO') ||
            event.message.includes('WMS')
        );
    }

    /**
     * Verificar se é erro relacionado à rede
     */
    isNetworkRelatedError(reason) {
        return reason && (
            reason.message?.includes('fetch') ||
            reason.message?.includes('CORS') ||
            reason.message?.includes('404') ||
            reason.message?.includes('Rate limit')
        );
    }

    /**
     * Configurar monitoramento proativo
     */
    setupProactiveMonitoring() {
        // Verificar saúde dos serviços a cada 2 minutos
        setInterval(() => {
            this.performHealthCheck();
        }, 120000);
        
        console.log('✅ Monitoramento proativo configurado');
    }

    /**
     * Realizar verificação de saúde
     */
    async performHealthCheck() {
        console.log('🔍 Executando verificação de saúde dos serviços...');
        
        const services = ['eox', 'stamen'];
        const results = {};
        
        for (const service of services) {
            if (!this.errorStats[service].blocked) {
                results[service] = await this.testServiceHealth(service);
            }
        }
        
        // Atualizar status na interface
        this.updateHealthStatus(results);
    }

    /**
     * Testar saúde de um serviço específico
     */
    async testServiceHealth(serviceType) {
        const testUrls = {
            eox: 'https://tiles.maps.eox.at/wms?service=WMS&request=GetCapabilities&version=1.1.1',
            stamen: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/1/0/0.png'
        };
        
        try {
            const response = await fetch(testUrls[serviceType], {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Atualizar status de saúde na interface
     */
    updateHealthStatus(results) {
        const systemStatus = document.getElementById('system-status');
        if (systemStatus) {
            const healthyServices = Object.values(results).filter(Boolean).length;
            const totalServices = Object.keys(results).length;
            
            if (healthyServices === totalServices) {
                systemStatus.textContent = 'Sistema Online - Todos os Serviços OK';
                systemStatus.style.color = '#27ae60';
            } else if (healthyServices > 0) {
                systemStatus.textContent = `Sistema Online - ${healthyServices}/${totalServices} Serviços OK`;
                systemStatus.style.color = '#f39c12';
            } else {
                systemStatus.textContent = 'Sistema Degradado - Usando Fallbacks';
                systemStatus.style.color = '#e74c3c';
            }
        }
    }

    /**
     * Configurar cache inteligente
     */
    setupIntelligentCache() {
        // O cache já está configurado nos métodos acima
        console.log('✅ Sistema de cache inteligente configurado');
    }

    /**
     * Mostrar notificação de fallback de serviço
     */
    showServiceFallbackNotification(serviceType) {
        const serviceNames = {
            eox: 'EOX Maps',
            gebco: 'GEBCO Bathymetry',
            stamen: 'Stamen Tiles',
            esri: 'ESRI Services'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            right: 24px;
            background: linear-gradient(135deg, rgba(255, 149, 0, 0.95), rgba(255, 59, 48, 0.95));
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 500;
            z-index: 2000;
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            max-width: 320px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        notification.innerHTML = `
            <div style="margin-bottom: 8px; font-size: 14px;">
                🛡️ Fallback Automático
            </div>
            <div style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
                <strong>${serviceNames[serviceType]}</strong> instável detectado.<br>
                Ativando serviços alternativos automaticamente.
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    /**
     * Obter estatísticas do sistema
     */
    getStats() {
        return {
            errorStats: { ...this.errorStats },
            rateLimits: { ...this.rateLimits },
            cacheSize: this.tileCache.size,
            fallbackChain: [...this.fallbackChain]
        };
    }
}

// Exportar para uso global
window.RobustErrorHandler = RobustErrorHandler;

console.log('✅ Robust Error Handler carregado e pronto para uso');
