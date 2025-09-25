/**
 * BGAPP Intelligent Cache System
 * Sistema de cache inteligente para otimizar performance
 */

class IntelligentCache {
    constructor(options = {}) {
        this.version = '1.2.0';
        this.prefix = options.prefix || 'bgapp_cache_';
        this.defaultTTL = options.defaultTTL || 3600000; // 1 hora
        this.maxSize = options.maxSize || 50; // máximo de entradas
        this.debug = options.debug || false;
        
        // Estratégias de cache
        this.strategies = {
            LRU: 'least_recently_used',
            TTL: 'time_to_live',
            SMART: 'smart_prediction'
        };
        
        this.currentStrategy = this.strategies.SMART;
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            size: 0
        };
        
        // Inicializar
        this.init();
    }
    
    init() {
        this.log('🚀 Inicializando Intelligent Cache System v' + this.version);
        
        // Limpar cache expirado na inicialização
        this.cleanup();
        
        // Configurar limpeza automática
        setInterval(() => this.cleanup(), 300000); // 5 minutos
        
        // Monitorar performance
        this.startPerformanceMonitoring();
        
        this.log('✅ Cache system inicializado');
    }
    
    /**
     * Armazenar dados no cache
     */
    set(key, data, options = {}) {
        const ttl = options.ttl || this.defaultTTL;
        const priority = options.priority || 'normal';
        const tags = options.tags || [];
        
        const cacheKey = this.prefix + key;
        const cacheEntry = {
            data,
            timestamp: Date.now(),
            ttl,
            priority,
            tags,
            accessCount: 0,
            lastAccess: Date.now(),
            size: this.calculateSize(data)
        };
        
        try {
            // Verificar se precisa fazer eviction
            if (this.needsEviction()) {
                this.performEviction();
            }
            
            localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
            this.stats.size++;
            
            this.log(`📦 Cached: ${key} (TTL: ${ttl}ms, Priority: ${priority})`);
            return true;
            
        } catch (error) {
            this.log(`❌ Erro ao cachear ${key}: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Recuperar dados do cache
     */
    get(key, options = {}) {
        const cacheKey = this.prefix + key;
        const fallback = options.fallback || null;
        
        try {
            const cached = localStorage.getItem(cacheKey);
            if (!cached) {
                this.stats.misses++;
                this.log(`❌ Cache miss: ${key}`);
                return fallback;
            }
            
            const cacheEntry = JSON.parse(cached);
            
            // Verificar se expirou
            if (this.isExpired(cacheEntry)) {
                localStorage.removeItem(cacheKey);
                this.stats.misses++;
                this.stats.size--;
                this.log(`⏰ Cache expired: ${key}`);
                return fallback;
            }
            
            // Atualizar estatísticas de acesso
            cacheEntry.accessCount++;
            cacheEntry.lastAccess = Date.now();
            localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
            
            this.stats.hits++;
            this.log(`✅ Cache hit: ${key}`);
            return cacheEntry.data;
            
        } catch (error) {
            this.log(`❌ Erro ao recuperar cache ${key}: ${error.message}`);
            this.stats.misses++;
            return fallback;
        }
    }
    
    /**
     * Cache com função de fallback
     */
    async getOrSet(key, fetchFunction, options = {}) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }
        
        try {
            this.log(`🔄 Fetching fresh data for: ${key}`);
            const freshData = await fetchFunction();
            this.set(key, freshData, options);
            return freshData;
        } catch (error) {
            this.log(`❌ Erro ao buscar dados frescos para ${key}: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Invalidar cache por chave ou tags
     */
    invalidate(keyOrTag, isTag = false) {
        if (isTag) {
            return this.invalidateByTag(keyOrTag);
        }
        
        const cacheKey = this.prefix + keyOrTag;
        const removed = localStorage.removeItem(cacheKey);
        if (removed !== null) {
            this.stats.size--;
            this.log(`🗑️ Invalidated: ${keyOrTag}`);
        }
        return removed !== null;
    }
    
    /**
     * Invalidar por tag
     */
    invalidateByTag(tag) {
        let count = 0;
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                try {
                    const cacheEntry = JSON.parse(localStorage.getItem(key));
                    if (cacheEntry.tags && cacheEntry.tags.includes(tag)) {
                        localStorage.removeItem(key);
                        this.stats.size--;
                        count++;
                    }
                } catch (error) {
                    // Entrada inválida, remover
                    localStorage.removeItem(key);
                }
            }
        });
        
        this.log(`🏷️ Invalidated ${count} entries by tag: ${tag}`);
        return count;
    }
    
    /**
     * Limpeza automática
     */
    cleanup() {
        let cleaned = 0;
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                try {
                    const cacheEntry = JSON.parse(localStorage.getItem(key));
                    if (this.isExpired(cacheEntry)) {
                        localStorage.removeItem(key);
                        this.stats.size--;
                        cleaned++;
                    }
                } catch (error) {
                    // Entrada corrompida, remover
                    localStorage.removeItem(key);
                    cleaned++;
                }
            }
        });
        
        if (cleaned > 0) {
            this.log(`🧹 Cleaned ${cleaned} expired entries`);
        }
    }
    
    /**
     * Verificar se precisa de eviction
     */
    needsEviction() {
        return this.stats.size >= this.maxSize;
    }
    
    /**
     * Realizar eviction baseado na estratégia
     */
    performEviction() {
        const keys = Object.keys(localStorage);
        const cacheEntries = [];
        
        // Coletar todas as entradas do cache
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                try {
                    const cacheEntry = JSON.parse(localStorage.getItem(key));
                    cacheEntries.push({ key, ...cacheEntry });
                } catch (error) {
                    // Remover entradas corrompidas
                    localStorage.removeItem(key);
                }
            }
        });
        
        // Ordenar para eviction baseado na estratégia
        let toEvict;
        switch (this.currentStrategy) {
            case this.strategies.LRU:
                toEvict = cacheEntries.sort((a, b) => a.lastAccess - b.lastAccess);
                break;
            case this.strategies.TTL:
                toEvict = cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
                break;
            case this.strategies.SMART:
            default:
                // Smart eviction: combina LRU, prioridade e frequência
                toEvict = cacheEntries.sort((a, b) => {
                    const scoreA = this.calculateEvictionScore(a);
                    const scoreB = this.calculateEvictionScore(b);
                    return scoreA - scoreB;
                });
                break;
        }
        
        // Remover 25% das entradas mais antigas/menos usadas
        const toRemove = Math.ceil(this.maxSize * 0.25);
        for (let i = 0; i < toRemove && i < toEvict.length; i++) {
            localStorage.removeItem(toEvict[i].key);
            this.stats.evictions++;
            this.stats.size--;
        }
        
        this.log(`🚮 Evicted ${toRemove} entries using ${this.currentStrategy} strategy`);
    }
    
    /**
     * Calcular score para eviction inteligente
     */
    calculateEvictionScore(entry) {
        const age = Date.now() - entry.timestamp;
        const timeSinceAccess = Date.now() - entry.lastAccess;
        const priorityWeight = entry.priority === 'high' ? 0.3 : entry.priority === 'low' ? 1.5 : 1.0;
        const accessFrequency = entry.accessCount / (age / 3600000); // acessos por hora
        
        // Score menor = mais provável de ser removido
        return (timeSinceAccess * priorityWeight) / (accessFrequency + 1);
    }
    
    /**
     * Verificar se entrada expirou
     */
    isExpired(cacheEntry) {
        return Date.now() - cacheEntry.timestamp > cacheEntry.ttl;
    }
    
    /**
     * Calcular tamanho aproximado dos dados
     */
    calculateSize(data) {
        try {
            return JSON.stringify(data).length;
        } catch {
            return 1000; // estimativa padrão
        }
    }
    
    /**
     * Obter estatísticas do cache
     */
    getStats() {
        const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) * 100;
        return {
            ...this.stats,
            hitRate: isNaN(hitRate) ? 0 : hitRate.toFixed(2),
            strategy: this.currentStrategy,
            version: this.version
        };
    }
    
    /**
     * Monitoramento de performance
     */
    startPerformanceMonitoring() {
        // Reportar estatísticas a cada 5 minutos
        setInterval(() => {
            const stats = this.getStats();
            this.log(`📊 Cache Stats - Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Rate: ${stats.hitRate}%, Size: ${stats.size}`);
            
            // Ajustar estratégia baseado na performance
            if (stats.hitRate < 70 && this.currentStrategy !== this.strategies.SMART) {
                this.currentStrategy = this.strategies.SMART;
                this.log('🎯 Switched to SMART caching strategy');
            }
        }, 300000);
    }
    
    /**
     * Limpar todo o cache
     */
    clear() {
        const keys = Object.keys(localStorage);
        let cleared = 0;
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
                cleared++;
            }
        });
        
        this.stats = { hits: 0, misses: 0, evictions: 0, size: 0 };
        this.log(`🧹 Cleared all cache (${cleared} entries)`);
        return cleared;
    }
    
    /**
     * Logging condicional
     */
    log(message) {
        if (this.debug || window.BGAPP_DEBUG) {
            console.log(`[IntelligentCache] ${message}`);
        }
    }
}

// Instância global
window.BGAPPCache = new IntelligentCache({
    debug: true,
    defaultTTL: 1800000, // 30 minutos
    maxSize: 100
});

// Integração com o sistema existente
if (typeof ApiService !== 'undefined') {
    // Wrapper para ApiService com cache
    const originalFetch = ApiService.fetch;
    ApiService.fetch = async function(url, options = {}) {
        const cacheKey = `api_${btoa(url + JSON.stringify(options))}`;
        const cacheTTL = options.cacheTTL || 300000; // 5 minutos padrão
        
        if (options.useCache !== false) {
            return await window.BGAPPCache.getOrSet(
                cacheKey,
                () => originalFetch.call(this, url, options),
                { ttl: cacheTTL, tags: ['api'] }
            );
        }
        
        return originalFetch.call(this, url, options);
    };
}

console.log('🚀 BGAPP Intelligent Cache System loaded and ready!');
