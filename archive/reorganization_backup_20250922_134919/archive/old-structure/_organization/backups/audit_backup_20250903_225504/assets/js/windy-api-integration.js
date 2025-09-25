/**
 * BGAPP Windy.com API Integration
 * Integração profissional com a API do Windy.com para dados meteorológicos
 * 
 * @author BGAPP Development Team
 * @version 1.0.0
 * @date 2025-01-09
 */

"use strict";

/**
 * Cliente para integração com Windy.com API
 */
class BGAPPWindyAPIClient {
    constructor(options = {}) {
        this.options = {
            // Configurações da API
            apiKey: options.apiKey || 'demo-key', // Substituir por chave real
            baseUrl: 'https://api.windy.com/api',
            timeout: options.timeout || 10000,
            
            // Configurações de cache
            cacheTimeout: options.cacheTimeout || 300000, // 5 minutos
            maxCacheSize: options.maxCacheSize || 100,
            
            // Configurações de dados
            defaultModel: options.defaultModel || 'gfs',
            defaultLevel: options.defaultLevel || 'surface',
            resolution: options.resolution || 0.25, // graus
            
            ...options
        };
        
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.lastRequestTime = 0;
        this.rateLimitDelay = 1000; // 1 segundo entre requests
        
        console.log("BGAPP Windy API Client - Inicializado", this.options);
    }

    /**
     * Obter dados de vento para uma área específica
     */
    async getWindData(bounds, options = {}) {
        const params = {
            model: options.model || this.options.defaultModel,
            level: options.level || this.options.defaultLevel,
            key: options.key || 'wind',
            ...bounds,
            ...options
        };
        
        const cacheKey = this._generateCacheKey('wind', params);
        
        // Verificar cache
        const cachedData = this._getFromCache(cacheKey);
        if (cachedData) {
            console.log("BGAPP Windy API - Dados obtidos do cache");
            return cachedData;
        }
        
        try {
            console.log("BGAPP Windy API - Buscando dados de vento...", params);
            
            const data = await this._makeRequest('/point-forecast/v2', params);
            
            // Processar dados
            const processedData = this._processWindData(data);
            
            // Armazenar no cache
            this._storeInCache(cacheKey, processedData);
            
            return processedData;
            
        } catch (error) {
            console.error("BGAPP Windy API - Erro ao obter dados de vento:", error);
            
            // Retornar dados simulados em caso de erro
            return this._generateFallbackWindData(bounds);
        }
    }

    /**
     * Obter dados de ondas
     */
    async getWaveData(bounds, options = {}) {
        const params = {
            model: 'gfs-waves',
            key: 'waves',
            ...bounds,
            ...options
        };
        
        const cacheKey = this._generateCacheKey('waves', params);
        
        const cachedData = this._getFromCache(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        
        try {
            console.log("BGAPP Windy API - Buscando dados de ondas...", params);
            
            const data = await this._makeRequest('/point-forecast/v2', params);
            const processedData = this._processWaveData(data);
            
            this._storeInCache(cacheKey, processedData);
            return processedData;
            
        } catch (error) {
            console.error("BGAPP Windy API - Erro ao obter dados de ondas:", error);
            return this._generateFallbackWaveData(bounds);
        }
    }

    /**
     * Obter dados de temperatura da superfície do mar
     */
    async getSeaTempData(bounds, options = {}) {
        const params = {
            model: 'gfs',
            key: 'sst', // Sea Surface Temperature
            ...bounds,
            ...options
        };
        
        const cacheKey = this._generateCacheKey('sst', params);
        
        const cachedData = this._getFromCache(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        
        try {
            console.log("BGAPP Windy API - Buscando temperatura do mar...", params);
            
            const data = await this._makeRequest('/point-forecast/v2', params);
            const processedData = this._processSeaTempData(data);
            
            this._storeInCache(cacheKey, processedData);
            return processedData;
            
        } catch (error) {
            console.error("BGAPP Windy API - Erro ao obter temperatura do mar:", error);
            return this._generateFallbackSeaTempData(bounds);
        }
    }

    /**
     * Obter dados de correntes oceânicas
     */
    async getCurrentsData(bounds, options = {}) {
        const params = {
            model: 'currents',
            key: 'currents',
            ...bounds,
            ...options
        };
        
        const cacheKey = this._generateCacheKey('currents', params);
        
        const cachedData = this._getFromCache(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        
        try {
            console.log("BGAPP Windy API - Buscando dados de correntes...", params);
            
            const data = await this._makeRequest('/point-forecast/v2', params);
            const processedData = this._processCurrentsData(data);
            
            this._storeInCache(cacheKey, processedData);
            return processedData;
            
        } catch (error) {
            console.error("BGAPP Windy API - Erro ao obter correntes:", error);
            return this._generateFallbackCurrentsData(bounds);
        }
    }

    /**
     * Fazer requisição HTTP para a API
     */
    async _makeRequest(endpoint, params) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await this._sleep(this.rateLimitDelay - timeSinceLastRequest);
        }
        this.lastRequestTime = Date.now();
        
        const requestKey = JSON.stringify({ endpoint, params });
        
        // Verificar se já há uma requisição pendente
        if (this.pendingRequests.has(requestKey)) {
            return this.pendingRequests.get(requestKey);
        }
        
        const requestPromise = this._executeRequest(endpoint, params);
        this.pendingRequests.set(requestKey, requestPromise);
        
        try {
            const result = await requestPromise;
            return result;
        } finally {
            this.pendingRequests.delete(requestKey);
        }
    }

    /**
     * Executar requisição HTTP
     */
    async _executeRequest(endpoint, params) {
        const url = new URL(endpoint, this.options.baseUrl);
        
        // Adicionar parâmetros à URL
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });
        
        // Adicionar API key
        url.searchParams.append('key', this.options.apiKey);
        
        console.log("BGAPP Windy API - Fazendo requisição:", url.toString());
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
        
        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'BGAPP/1.0'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Requisição expirou');
            }
            
            throw error;
        }
    }

    /**
     * Processar dados de vento
     */
    _processWindData(data) {
        if (!data || !data.data) {
            throw new Error('Dados de vento inválidos');
        }
        
        const processed = {
            timestamp: Date.now(),
            model: data.model || 'unknown',
            data: []
        };
        
        // Processar cada ponto de dados
        if (Array.isArray(data.data)) {
            processed.data = data.data.map(point => ({
                latitude: point.lat,
                longitude: point.lon,
                u: point['wind_u-10m'] || 0,
                v: point['wind_v-10m'] || 0,
                speed: Math.sqrt(
                    Math.pow(point['wind_u-10m'] || 0, 2) + 
                    Math.pow(point['wind_v-10m'] || 0, 2)
                ),
                direction: Math.atan2(
                    point['wind_v-10m'] || 0, 
                    point['wind_u-10m'] || 0
                ) * 180 / Math.PI,
                gust: point['gust-10m'] || null
            }));
        }
        
        console.log(`BGAPP Windy API - Processados ${processed.data.length} pontos de vento`);
        return processed;
    }

    /**
     * Processar dados de ondas
     */
    _processWaveData(data) {
        const processed = {
            timestamp: Date.now(),
            model: data.model || 'unknown',
            data: []
        };
        
        if (Array.isArray(data.data)) {
            processed.data = data.data.map(point => ({
                latitude: point.lat,
                longitude: point.lon,
                height: point.waves || 0,
                period: point.period || 0,
                direction: point.direction || 0
            }));
        }
        
        return processed;
    }

    /**
     * Processar dados de temperatura do mar
     */
    _processSeaTempData(data) {
        const processed = {
            timestamp: Date.now(),
            model: data.model || 'unknown',
            data: []
        };
        
        if (Array.isArray(data.data)) {
            processed.data = data.data.map(point => ({
                latitude: point.lat,
                longitude: point.lon,
                temperature: point.sst || 0
            }));
        }
        
        return processed;
    }

    /**
     * Processar dados de correntes
     */
    _processCurrentsData(data) {
        const processed = {
            timestamp: Date.now(),
            model: data.model || 'unknown',
            data: []
        };
        
        if (Array.isArray(data.data)) {
            processed.data = data.data.map(point => ({
                latitude: point.lat,
                longitude: point.lon,
                u: point.current_u || 0,
                v: point.current_v || 0,
                speed: Math.sqrt(
                    Math.pow(point.current_u || 0, 2) + 
                    Math.pow(point.current_v || 0, 2)
                )
            }));
        }
        
        return processed;
    }

    /**
     * Gerar dados de fallback para vento
     */
    _generateFallbackWindData(bounds) {
        console.log("BGAPP Windy API - Gerando dados de vento simulados");
        
        const data = [];
        const gridSize = 0.5; // Resolução em graus
        
        for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
            for (let lng = bounds.west; lng <= bounds.east; lng += gridSize) {
                const u = (Math.random() - 0.5) * 20;
                const v = (Math.random() - 0.5) * 20;
                
                data.push({
                    latitude: lat,
                    longitude: lng,
                    u: u,
                    v: v,
                    speed: Math.sqrt(u * u + v * v),
                    direction: Math.atan2(v, u) * 180 / Math.PI
                });
            }
        }
        
        return {
            timestamp: Date.now(),
            model: 'fallback',
            data: data
        };
    }

    /**
     * Gerar dados de fallback para ondas
     */
    _generateFallbackWaveData(bounds) {
        const data = [];
        const gridSize = 0.5;
        
        for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
            for (let lng = bounds.west; lng <= bounds.east; lng += gridSize) {
                data.push({
                    latitude: lat,
                    longitude: lng,
                    height: Math.random() * 3,
                    period: 5 + Math.random() * 10,
                    direction: Math.random() * 360
                });
            }
        }
        
        return {
            timestamp: Date.now(),
            model: 'fallback',
            data: data
        };
    }

    /**
     * Gerar dados de fallback para temperatura
     */
    _generateFallbackSeaTempData(bounds) {
        const data = [];
        const gridSize = 0.5;
        const baseTemp = 25; // Temperatura base para Angola
        
        for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
            for (let lng = bounds.west; lng <= bounds.east; lng += gridSize) {
                data.push({
                    latitude: lat,
                    longitude: lng,
                    temperature: baseTemp + (Math.random() - 0.5) * 10
                });
            }
        }
        
        return {
            timestamp: Date.now(),
            model: 'fallback',
            data: data
        };
    }

    /**
     * Gerar dados de fallback para correntes
     */
    _generateFallbackCurrentsData(bounds) {
        const data = [];
        const gridSize = 0.5;
        
        for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
            for (let lng = bounds.west; lng <= bounds.east; lng += gridSize) {
                const u = (Math.random() - 0.5) * 2;
                const v = (Math.random() - 0.5) * 2;
                
                data.push({
                    latitude: lat,
                    longitude: lng,
                    u: u,
                    v: v,
                    speed: Math.sqrt(u * u + v * v)
                });
            }
        }
        
        return {
            timestamp: Date.now(),
            model: 'fallback',
            data: data
        };
    }

    /**
     * Gerenciar cache
     */
    _generateCacheKey(type, params) {
        return `${type}_${JSON.stringify(params)}`;
    }

    _getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > this.options.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    _storeInCache(key, data) {
        // Limpar cache se estiver muito grande
        if (this.cache.size >= this.options.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            timestamp: Date.now(),
            data: data
        });
    }

    /**
     * Utilitários
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Limpar cache
     */
    clearCache() {
        this.cache.clear();
        console.log("BGAPP Windy API - Cache limpo");
    }

    /**
     * Obter estatísticas do cache
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.options.maxCacheSize,
            timeout: this.options.cacheTimeout
        };
    }

    /**
     * Definir nova API key
     */
    setApiKey(apiKey) {
        this.options.apiKey = apiKey;
        console.log("BGAPP Windy API - API key atualizada");
    }
}

/**
 * Integrador de dados meteorológicos para BGAPP
 */
class BGAPPWeatherDataIntegrator {
    constructor(windyClient, options = {}) {
        this.windyClient = windyClient;
        this.options = {
            updateInterval: options.updateInterval || 600000, // 10 minutos
            autoUpdate: options.autoUpdate !== false,
            ...options
        };
        
        this.updateTimer = null;
        this.lastUpdate = 0;
        this.callbacks = new Map();
        
        console.log("BGAPP Weather Data Integrator - Inicializado");
    }

    /**
     * Iniciar atualizações automáticas
     */
    start(bounds) {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        if (this.options.autoUpdate) {
            this.updateTimer = setInterval(() => {
                this._updateAllData(bounds);
            }, this.options.updateInterval);
        }
        
        // Primeira atualização imediata
        this._updateAllData(bounds);
        
        console.log("BGAPP Weather Data Integrator - Iniciado");
    }

    /**
     * Parar atualizações
     */
    stop() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
        
        console.log("BGAPP Weather Data Integrator - Parado");
    }

    /**
     * Registrar callback para tipo de dados
     */
    onDataUpdate(dataType, callback) {
        if (!this.callbacks.has(dataType)) {
            this.callbacks.set(dataType, []);
        }
        this.callbacks.get(dataType).push(callback);
    }

    /**
     * Atualizar todos os dados
     */
    async _updateAllData(bounds) {
        try {
            console.log("BGAPP Weather Data Integrator - Atualizando todos os dados...");
            
            const promises = [
                this.windyClient.getWindData(bounds),
                this.windyClient.getWaveData(bounds),
                this.windyClient.getSeaTempData(bounds),
                this.windyClient.getCurrentsData(bounds)
            ];
            
            const [windData, waveData, tempData, currentsData] = await Promise.allSettled(promises);
            
            // Notificar callbacks
            if (windData.status === 'fulfilled') {
                this._notifyCallbacks('wind', windData.value);
            }
            if (waveData.status === 'fulfilled') {
                this._notifyCallbacks('waves', waveData.value);
            }
            if (tempData.status === 'fulfilled') {
                this._notifyCallbacks('temperature', tempData.value);
            }
            if (currentsData.status === 'fulfilled') {
                this._notifyCallbacks('currents', currentsData.value);
            }
            
            this.lastUpdate = Date.now();
            console.log("BGAPP Weather Data Integrator - Atualização completa");
            
        } catch (error) {
            console.error("BGAPP Weather Data Integrator - Erro na atualização:", error);
        }
    }

    /**
     * Notificar callbacks
     */
    _notifyCallbacks(dataType, data) {
        const callbacks = this.callbacks.get(dataType);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro no callback ${dataType}:`, error);
                }
            });
        }
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.BGAPPWindyAPIClient = BGAPPWindyAPIClient;
    window.BGAPPWeatherDataIntegrator = BGAPPWeatherDataIntegrator;
}

// Export para Node.js (testes)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BGAPPWindyAPIClient,
        BGAPPWeatherDataIntegrator
    };
}

// Export para ambiente global (testes)
if (typeof global !== 'undefined') {
    global.BGAPPWindyAPIClient = BGAPPWindyAPIClient;
    global.BGAPPWeatherDataIntegrator = BGAPPWeatherDataIntegrator;
}

console.log("BGAPP Windy API Integration - Módulo carregado");
