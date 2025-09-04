/**
 * BGAPP Wind Data Loader - Sistema de Carregamento de Dados Meteorológicos
 * Carregador otimizado para dados GFS/GRIB e outras fontes meteorológicas
 * Integração com cache inteligente e processamento assíncrono
 */

"use strict";

class BGAPPWindDataLoader {
    constructor(options = {}) {
        this.options = {
            // URLs de dados meteorológicos
            gfsUrl: options.gfsUrl || '/api/meteorological/gfs',
            copernicusUrl: options.copernicusUrl || '/api/meteorological/copernicus',
            localCacheUrl: options.localCacheUrl || '/api/cache/meteorological',
            
            // Configurações de cache
            cacheEnabled: options.cacheEnabled !== false,
            cacheExpiration: options.cacheExpiration || 3600000, // 1 hora
            maxCacheSize: options.maxCacheSize || 100, // MB
            
            // Configurações de dados
            resolution: options.resolution || '0.25', // graus
            timeRange: options.timeRange || 24, // horas
            updateInterval: options.updateInterval || 3600000, // 1 hora
            
            // Área geográfica (Angola e águas adjacentes)
            bounds: options.bounds || {
                north: -4.0,
                south: -18.5,
                west: 8.0,
                east: 25.0
            },
            
            // Parâmetros meteorológicos
            parameters: options.parameters || ['u', 'v', 'speed', 'direction'],
            levels: options.levels || ['10m'], // 10 metros acima do solo
            
            // Callbacks
            onDataLoaded: options.onDataLoaded || null,
            onError: options.onError || null,
            onProgress: options.onProgress || null,
        };

        this.cache = new Map();
        this.loadingPromises = new Map();
        this.lastUpdate = null;
        this.isLoading = false;
        
        // Inicializar sistema
        this._initializeLoader();
        
        console.log("BGAPP Wind Data Loader - Inicializado:", this.options);
    }

    /**
     * Inicializar o carregador de dados
     */
    _initializeLoader() {
        // Configurar atualizações automáticas
        if (this.options.updateInterval > 0) {
            setInterval(() => {
                this._checkForUpdates();
            }, this.options.updateInterval);
        }

        // Limpar cache periodicamente
        setInterval(() => {
            this._cleanCache();
        }, this.options.cacheExpiration / 2);

        // Verificar suporte a Service Worker para cache offline
        if ('serviceWorker' in navigator) {
            this._registerServiceWorker();
        }
    }

    /**
     * Carregar dados de vento para uma região e tempo específicos
     */
    async loadWindData(options = {}) {
        const config = {
            bounds: options.bounds || this.options.bounds,
            time: options.time || new Date(),
            level: options.level || '10m',
            resolution: options.resolution || this.options.resolution,
            source: options.source || 'gfs', // gfs, copernicus, local
            forceRefresh: options.forceRefresh || false
        };

        const cacheKey = this._generateCacheKey(config);
        
        console.log("BGAPP Wind Data Loader - Carregando dados:", config);

        // Verificar cache primeiro (se não forçar refresh)
        if (!config.forceRefresh && this.cache.has(cacheKey)) {
            const cachedData = this.cache.get(cacheKey);
            if (this._isCacheValid(cachedData)) {
                console.log("BGAPP Wind Data Loader - Dados encontrados no cache");
                return cachedData.data;
            }
        }

        // Verificar se já está carregando os mesmos dados
        if (this.loadingPromises.has(cacheKey)) {
            console.log("BGAPP Wind Data Loader - Aguardando carregamento em progresso");
            return await this.loadingPromises.get(cacheKey);
        }

        // Iniciar carregamento
        const loadingPromise = this._loadDataFromSource(config);
        this.loadingPromises.set(cacheKey, loadingPromise);

        try {
            const data = await loadingPromise;
            
            // Armazenar no cache
            if (this.options.cacheEnabled) {
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now(),
                    config: config
                });
            }

            this.lastUpdate = Date.now();
            
            if (this.options.onDataLoaded) {
                this.options.onDataLoaded(data, config);
            }

            console.log("BGAPP Wind Data Loader - Dados carregados com sucesso");
            return data;

        } catch (error) {
            console.error("BGAPP Wind Data Loader - Erro ao carregar dados:", error);
            
            if (this.options.onError) {
                this.options.onError(error, config);
            }

            // Tentar fallback para dados em cache (mesmo expirados)
            if (this.cache.has(cacheKey)) {
                console.log("BGAPP Wind Data Loader - Usando dados em cache como fallback");
                return this.cache.get(cacheKey).data;
            }

            throw error;
        } finally {
            this.loadingPromises.delete(cacheKey);
        }
    }

    /**
     * Carregar dados de múltiplas fontes (GFS, Copernicus, etc.)
     */
    async loadMultiSourceData(options = {}) {
        const sources = options.sources || ['gfs', 'copernicus'];
        const results = {};

        const loadPromises = sources.map(async (source) => {
            try {
                const data = await this.loadWindData({
                    ...options,
                    source: source
                });
                results[source] = {
                    success: true,
                    data: data,
                    timestamp: Date.now()
                };
            } catch (error) {
                console.error(`BGAPP Wind Data Loader - Erro na fonte ${source}:`, error);
                results[source] = {
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                };
            }
        });

        await Promise.allSettled(loadPromises);

        // Escolher a melhor fonte disponível
        const primaryData = this._selectBestDataSource(results);
        
        return {
            primary: primaryData,
            all: results,
            timestamp: Date.now()
        };
    }

    /**
     * Carregar dados históricos para animação temporal
     */
    async loadTimeSeriesData(options = {}) {
        const config = {
            startTime: options.startTime || new Date(Date.now() - 24 * 3600000), // 24h atrás
            endTime: options.endTime || new Date(),
            interval: options.interval || 3600000, // 1 hora
            ...options
        };

        const timeSteps = this._generateTimeSteps(config.startTime, config.endTime, config.interval);
        const dataPromises = timeSteps.map(time => 
            this.loadWindData({
                ...config,
                time: time
            }).catch(error => {
                console.warn(`BGAPP Wind Data Loader - Falha ao carregar dados para ${time}:`, error);
                return null;
            })
        );

        if (this.options.onProgress) {
            // Monitorar progresso
            let completed = 0;
            dataPromises.forEach(promise => {
                promise.finally(() => {
                    completed++;
                    this.options.onProgress({
                        completed: completed,
                        total: timeSteps.length,
                        percentage: (completed / timeSteps.length) * 100
                    });
                });
            });
        }

        const results = await Promise.allSettled(dataPromises);
        
        return {
            timeSteps: timeSteps,
            data: results.map((result, index) => ({
                time: timeSteps[index],
                success: result.status === 'fulfilled' && result.value !== null,
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason : null
            })),
            config: config
        };
    }

    /**
     * Carregar dados em tempo real
     */
    async loadRealtimeData(options = {}) {
        console.log("BGAPP Wind Data Loader - Carregando dados em tempo real");
        
        return await this.loadWindData({
            ...options,
            time: new Date(),
            forceRefresh: true
        });
    }

    /**
     * Pré-carregar dados para uma região
     */
    async preloadData(bounds, timeRange = 6) {
        console.log("BGAPP Wind Data Loader - Pré-carregando dados para região:", bounds);
        
        const now = new Date();
        const preloadPromises = [];

        // Carregar dados atuais e próximas horas
        for (let i = 0; i <= timeRange; i++) {
            const time = new Date(now.getTime() + i * 3600000);
            preloadPromises.push(
                this.loadWindData({
                    bounds: bounds,
                    time: time
                }).catch(error => {
                    console.warn(`BGAPP Wind Data Loader - Falha no pré-carregamento para ${time}:`, error);
                    return null;
                })
            );
        }

        const results = await Promise.allSettled(preloadPromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
        
        console.log(`BGAPP Wind Data Loader - Pré-carregamento concluído: ${successCount}/${preloadPromises.length} sucessos`);
        
        return {
            total: preloadPromises.length,
            successful: successCount,
            failed: preloadPromises.length - successCount
        };
    }

    /**
     * Carregar dados de uma fonte específica
     */
    async _loadDataFromSource(config) {
        this.isLoading = true;
        
        try {
            let url;
            let requestOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            // Determinar URL baseada na fonte
            switch (config.source) {
                case 'gfs':
                    url = this._buildGFSUrl(config);
                    break;
                case 'copernicus':
                    url = this._buildCopernicusUrl(config);
                    break;
                case 'local':
                    url = this._buildLocalUrl(config);
                    break;
                default:
                    throw new Error(`Fonte de dados desconhecida: ${config.source}`);
            }

            console.log(`BGAPP Wind Data Loader - Fazendo requisição para: ${url}`);

            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Assumir dados binários (GRIB)
                const arrayBuffer = await response.arrayBuffer();
                data = await this._parseGRIBData(arrayBuffer);
            }

            // Processar e validar dados
            const processedData = this._processWindData(data, config);
            
            return processedData;

        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Construir URL para dados GFS
     */
    _buildGFSUrl(config) {
        const params = new URLSearchParams({
            bounds: `${config.bounds.north},${config.bounds.west},${config.bounds.south},${config.bounds.east}`,
            time: config.time.toISOString(),
            level: config.level,
            resolution: config.resolution,
            parameters: this.options.parameters.join(',')
        });

        return `${this.options.gfsUrl}?${params.toString()}`;
    }

    /**
     * Construir URL para dados Copernicus
     */
    _buildCopernicusUrl(config) {
        const params = new URLSearchParams({
            bbox: `${config.bounds.west},${config.bounds.south},${config.bounds.east},${config.bounds.north}`,
            datetime: config.time.toISOString(),
            level: config.level,
            resolution: config.resolution,
            variables: this.options.parameters.join(',')
        });

        return `${this.options.copernicusUrl}?${params.toString()}`;
    }

    /**
     * Construir URL para cache local
     */
    _buildLocalUrl(config) {
        const params = new URLSearchParams({
            bounds: JSON.stringify(config.bounds),
            time: config.time.toISOString(),
            level: config.level,
            resolution: config.resolution
        });

        return `${this.options.localCacheUrl}?${params.toString()}`;
    }

    /**
     * Processar dados de vento brutos
     */
    _processWindData(rawData, config) {
        console.log("BGAPP Wind Data Loader - Processando dados de vento");

        // Verificar se os dados estão no formato esperado
        if (!rawData || !Array.isArray(rawData)) {
            throw new Error("Dados de vento em formato inválido");
        }

        // Processar cada registro de dados
        const processedData = rawData.map(record => {
            if (!record.header || !record.data) {
                throw new Error("Registro de dados incompleto");
            }

            return {
                header: {
                    ...record.header,
                    parameterCategory: record.header.parameterCategory || 2,
                    parameterNumber: record.header.parameterNumber || (record.header.parameter === 'u' ? 2 : 3),
                    refTime: record.header.refTime || config.time.toISOString(),
                    forecastTime: record.header.forecastTime || 0,
                    lo1: record.header.lo1 || config.bounds.west,
                    la1: record.header.la1 || config.bounds.north,
                    lo2: record.header.lo2 || config.bounds.east,
                    la2: record.header.la2 || config.bounds.south,
                    dx: record.header.dx || parseFloat(config.resolution),
                    dy: record.header.dy || parseFloat(config.resolution),
                    nx: record.header.nx || Math.ceil((config.bounds.east - config.bounds.west) / parseFloat(config.resolution)),
                    ny: record.header.ny || Math.ceil((config.bounds.north - config.bounds.south) / parseFloat(config.resolution)),
                    scanMode: record.header.scanMode || 0
                },
                data: new Float32Array(record.data)
            };
        });

        // Validar que temos componentes U e V
        const uComponent = processedData.find(r => 
            (r.header.parameterCategory === 2 && r.header.parameterNumber === 2) ||
            (r.header.parameter === 'u')
        );
        
        const vComponent = processedData.find(r => 
            (r.header.parameterCategory === 2 && r.header.parameterNumber === 3) ||
            (r.header.parameter === 'v')
        );

        if (!uComponent || !vComponent) {
            throw new Error("Dados de vento incompletos - componentes U ou V ausentes");
        }

        console.log("BGAPP Wind Data Loader - Dados processados com sucesso");
        
        return {
            components: processedData,
            metadata: {
                source: config.source,
                time: config.time,
                bounds: config.bounds,
                resolution: config.resolution,
                level: config.level,
                processedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Parse dados GRIB (implementação básica)
     */
    async _parseGRIBData(arrayBuffer) {
        // Esta é uma implementação simplificada
        // Em produção, usar uma biblioteca como grib2-simple ou similar
        console.log("BGAPP Wind Data Loader - Parsing dados GRIB");
        
        // Por enquanto, assumir que os dados já estão processados pelo backend
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(arrayBuffer);
        
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            throw new Error("Erro ao fazer parse dos dados GRIB: " + error.message);
        }
    }

    /**
     * Gerar chave de cache
     */
    _generateCacheKey(config) {
        const keyData = {
            source: config.source,
            bounds: config.bounds,
            time: Math.floor(config.time.getTime() / 3600000), // Arredondar para hora
            level: config.level,
            resolution: config.resolution
        };
        
        return btoa(JSON.stringify(keyData)).replace(/[/+=]/g, '');
    }

    /**
     * Verificar se dados em cache são válidos
     */
    _isCacheValid(cachedData) {
        const age = Date.now() - cachedData.timestamp;
        return age < this.options.cacheExpiration;
    }

    /**
     * Limpar cache expirado
     */
    _cleanCache() {
        const now = Date.now();
        let removedCount = 0;

        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.options.cacheExpiration) {
                this.cache.delete(key);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            console.log(`BGAPP Wind Data Loader - Cache limpo: ${removedCount} entradas removidas`);
        }
    }

    /**
     * Verificar por atualizações
     */
    async _checkForUpdates() {
        if (this.isLoading) return;

        const timeSinceLastUpdate = Date.now() - (this.lastUpdate || 0);
        if (timeSinceLastUpdate < this.options.updateInterval) return;

        console.log("BGAPP Wind Data Loader - Verificando atualizações automáticas");
        
        try {
            await this.loadRealtimeData();
        } catch (error) {
            console.error("BGAPP Wind Data Loader - Erro na atualização automática:", error);
        }
    }

    /**
     * Selecionar melhor fonte de dados
     */
    _selectBestDataSource(results) {
        // Prioridade: Copernicus > GFS > Local
        const priority = ['copernicus', 'gfs', 'local'];
        
        for (const source of priority) {
            if (results[source] && results[source].success) {
                return results[source];
            }
        }

        return null;
    }

    /**
     * Gerar passos de tempo
     */
    _generateTimeSteps(startTime, endTime, interval) {
        const steps = [];
        let current = new Date(startTime);
        
        while (current <= endTime) {
            steps.push(new Date(current));
            current = new Date(current.getTime() + interval);
        }
        
        return steps;
    }

    /**
     * Registrar Service Worker para cache offline
     */
    async _registerServiceWorker() {
        try {
            if ('serviceWorker' in navigator) {
                // Verificar se estamos no contexto MinPerMar
                const isMinPerMar = window.location.pathname.includes('/minpermar') || 
                                    window.location.pathname.includes('minpermar-site');
                
                if (isMinPerMar) {
                    console.log("BGAPP Wind Data Loader - Service Worker desabilitado no MinPerMar");
                    return;
                }
                
                await navigator.serviceWorker.register('/sw-wind-cache.js');
                console.log("BGAPP Wind Data Loader - Service Worker registrado para cache offline");
            }
        } catch (error) {
            console.error("BGAPP Wind Data Loader - Erro ao registrar Service Worker:", error);
        }
    }

    /**
     * Obter estatísticas do cache
     */
    getCacheStats() {
        const stats = {
            totalEntries: this.cache.size,
            memoryUsage: 0,
            oldestEntry: null,
            newestEntry: null,
            hitRate: 0
        };

        let oldestTime = Infinity;
        let newestTime = 0;

        for (const [key, value] of this.cache.entries()) {
            // Estimar uso de memória (aproximado)
            stats.memoryUsage += JSON.stringify(value).length;
            
            if (value.timestamp < oldestTime) {
                oldestTime = value.timestamp;
                stats.oldestEntry = new Date(value.timestamp);
            }
            
            if (value.timestamp > newestTime) {
                newestTime = value.timestamp;
                stats.newestEntry = new Date(value.timestamp);
            }
        }

        stats.memoryUsage = Math.round(stats.memoryUsage / 1024 / 1024 * 100) / 100; // MB

        return stats;
    }

    /**
     * Limpar todo o cache
     */
    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        console.log(`BGAPP Wind Data Loader - Cache completamente limpo: ${size} entradas removidas`);
    }

    /**
     * Obter informações de status
     */
    getStatus() {
        return {
            isLoading: this.isLoading,
            lastUpdate: this.lastUpdate ? new Date(this.lastUpdate) : null,
            cacheStats: this.getCacheStats(),
            loadingPromises: this.loadingPromises.size,
            options: this.options
        };
    }
}

// Instância global para uso fácil
window.BGAPPWindDataLoader = BGAPPWindDataLoader;

console.log("BGAPP Wind Data Loader - Sistema carregado com sucesso! 📊");
