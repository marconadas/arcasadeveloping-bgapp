/**
 * Copernicus Official Client - Frontend JavaScript
 * Cliente JavaScript para integração com APIs oficiais do Copernicus
 * Baseado na documentação oficial do Copernicus Data Space Ecosystem
 */

class CopernicusOfficialClient {
    constructor(workerUrl = '/api') {
        this.workerUrl = workerUrl;
        this.accessToken = null;
        this.tokenExpires = null;
        
        // Configuração oficial
        this.config = {
            collections: {
                'SENTINEL-1': 'SENTINEL-1',
                'SENTINEL-2': 'SENTINEL-2',
                'SENTINEL-3': 'SENTINEL-3',
                'SENTINEL-5P': 'SENTINEL-5P',
                'SENTINEL-6': 'SENTINEL-6'
            },
            angolaEEZ: {
                north: -4.2,
                south: -18.0,
                east: 17.5,
                west: 8.5
            }
        };
        
        // Cache de dados
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        
        console.log('🛰️ Copernicus Official Client inicializado');
    }
    
    /**
     * Autenticar com Copernicus CDSE
     */
    async authenticate() {
        try {
            console.log('🔐 Autenticando com Copernicus CDSE...');
            
            const response = await fetch(`${this.workerUrl}/copernicus/auth`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Autenticação falhou: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.accessToken = data.access_token;
                this.tokenExpires = Date.now() + (data.expires_in * 1000);
                
                console.log('✅ Autenticação CDSE bem-sucedida');
                this.showNotification('✅ Copernicus conectado', 'success');
                return true;
            } else {
                throw new Error(data.error || 'Falha na autenticação');
            }
            
        } catch (error) {
            console.error('❌ Erro na autenticação:', error);
            this.showNotification(`❌ Erro de autenticação: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * Verificar se o token ainda é válido
     */
    isTokenValid() {
        return this.accessToken && this.tokenExpires && Date.now() < this.tokenExpires;
    }
    
    /**
     * Buscar dados usando OData API
     */
    async searchOData(collection = 'SENTINEL-3', maxRecords = 20, days = 7) {
        const cacheKey = `odata_${collection}_${maxRecords}_${days}`;
        
        // Verificar cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📋 Usando dados OData do cache');
                return cached.data;
            }
        }
        
        try {
            console.log(`🔍 Buscando dados OData: ${collection}`);
            
            const params = new URLSearchParams({
                collection,
                max_records: maxRecords.toString(),
                days: days.toString()
            });
            
            const response = await fetch(`${this.workerUrl}/copernicus/odata?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`OData API falhou: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Cachear resultado
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                console.log(`✅ OData: ${data.products_found} produtos encontrados`);
                return data;
            } else {
                throw new Error(data.error || 'Erro na busca OData');
            }
            
        } catch (error) {
            console.error('❌ Erro na busca OData:', error);
            this.showNotification(`❌ Erro OData: ${error.message}`, 'error');
            return null;
        }
    }
    
    /**
     * Buscar dados usando STAC API
     */
    async searchSTAC(collections = ['SENTINEL-3'], limit = 50, days = 7) {
        const cacheKey = `stac_${collections.join(',')}_${limit}_${days}`;
        
        // Verificar cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📋 Usando dados STAC do cache');
                return cached.data;
            }
        }
        
        try {
            console.log(`🔍 Buscando dados STAC: ${collections.join(', ')}`);
            
            const params = new URLSearchParams({
                collections: collections.join(','),
                limit: limit.toString(),
                days: days.toString()
            });
            
            const response = await fetch(`${this.workerUrl}/copernicus/stac?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`STAC API falhou: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Cachear resultado
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                console.log(`✅ STAC: ${data.features_found} features encontradas`);
                return data;
            } else {
                throw new Error(data.error || 'Erro na busca STAC');
            }
            
        } catch (error) {
            console.error('❌ Erro na busca STAC:', error);
            this.showNotification(`❌ Erro STAC: ${error.message}`, 'error');
            return null;
        }
    }
    
    /**
     * Buscar dados usando OpenSearch API
     */
    async searchOpenSearch(collection = 'Sentinel3', maxRecords = 20, days = 7) {
        const cacheKey = `opensearch_${collection}_${maxRecords}_${days}`;
        
        // Verificar cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📋 Usando dados OpenSearch do cache');
                return cached.data;
            }
        }
        
        try {
            console.log(`🔍 Buscando dados OpenSearch: ${collection}`);
            
            const params = new URLSearchParams({
                collection,
                max_records: maxRecords.toString(),
                days: days.toString()
            });
            
            const response = await fetch(`${this.workerUrl}/copernicus/opensearch?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`OpenSearch API falhou: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Cachear resultado
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                console.log(`✅ OpenSearch: ${data.products_found} produtos encontrados`);
                return data;
            } else {
                throw new Error(data.error || 'Erro na busca OpenSearch');
            }
            
        } catch (error) {
            console.error('❌ Erro na busca OpenSearch:', error);
            this.showNotification(`❌ Erro OpenSearch: ${error.message}`, 'error');
            return null;
        }
    }
    
    /**
     * Obter dados marinhos completos para Angola
     */
    async getAngolaMarineData() {
        const cacheKey = 'angola_marine_complete';
        
        // Verificar cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📋 Usando dados marinhos do cache');
                return cached.data;
            }
        }
        
        try {
            console.log('🌊 Buscando dados marinhos completos para Angola...');
            
            const response = await fetch(`${this.workerUrl}/copernicus/angola-marine`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API Angola falhou: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cachear resultado
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            console.log(`✅ Dados Angola: ${data.summary?.total_products_found || 0} produtos total`);
            this.showNotification(`✅ Dados Angola atualizados: ${data.summary?.total_products_found || 0} produtos`, 'success');
            
            return data;
            
        } catch (error) {
            console.error('❌ Erro nos dados marinhos Angola:', error);
            this.showNotification(`❌ Erro dados Angola: ${error.message}`, 'error');
            return null;
        }
    }
    
    /**
     * Processar dados Sentinel-3 para visualização
     */
    processMarineDataForVisualization(data) {
        if (!data || !data.data_sources) {
            return null;
        }
        
        const processed = {
            timestamp: data.timestamp,
            angola_eez: data.angola_eez,
            summary: data.summary,
            oceanographic_data: {
                temperature: [],
                chlorophyll: [],
                salinity: [],
                currents: []
            },
            metadata: {
                total_products: 0,
                successful_apis: 0,
                data_sources: []
            }
        };
        
        // Processar dados de cada fonte
        Object.entries(data.data_sources).forEach(([source, sourceData]) => {
            if (!sourceData.error) {
                processed.metadata.successful_apis++;
                processed.metadata.data_sources.push(source);
                
                // Processar produtos/features
                const items = sourceData.data?.value || sourceData.data?.features || [];
                processed.metadata.total_products += items.length;
                
                items.forEach(item => {
                    // Extrair dados oceanográficos baseado no nome do produto
                    const name = item.Name || item.id || '';
                    
                    if (name.includes('OLCI')) {
                        // Dados de cor do oceano (clorofila)
                        processed.oceanographic_data.chlorophyll.push({
                            id: item.Id || item.id,
                            name: name,
                            date: item.ContentDate?.Start || item.properties?.datetime,
                            geometry: item.GeoFootprint || item.geometry
                        });
                    } else if (name.includes('SLSTR')) {
                        // Dados de temperatura da superfície
                        processed.oceanographic_data.temperature.push({
                            id: item.Id || item.id,
                            name: name,
                            date: item.ContentDate?.Start || item.properties?.datetime,
                            geometry: item.GeoFootprint || item.geometry
                        });
                    }
                });
            }
        });
        
        return processed;
    }
    
    /**
     * Atualizar status na interface
     */
    updateCopernicusStatus(status, message) {
        const statusElement = document.getElementById('copernicus-status');
        const statusText = document.getElementById('copernicus-status-text');
        
        if (statusElement && statusText) {
            statusElement.className = `status-indicator ${status}`;
            statusText.textContent = message;
            
            // Cores baseadas no status
            switch (status) {
                case 'online':
                    statusElement.style.backgroundColor = '#10b981'; // Verde
                    break;
                case 'warning':
                    statusElement.style.backgroundColor = '#f59e0b'; // Amarelo
                    break;
                case 'error':
                    statusElement.style.backgroundColor = '#ef4444'; // Vermelho
                    break;
                default:
                    statusElement.style.backgroundColor = '#6b7280'; // Cinza
            }
        }
        
        console.log(`📊 Status Copernicus: ${status} - ${message}`);
    }
    
    /**
     * Mostrar notificação
     */
    showNotification(message, type = 'info') {
        // Criar elemento de notificação se não existir
        let notificationContainer = document.getElementById('copernicus-notifications');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'copernicus-notifications';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(notificationContainer);
        }
        
        // Criar notificação
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        // Adicionar animação CSS
        if (!document.getElementById('copernicus-notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'copernicus-notification-styles';
            styles.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        notificationContainer.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    /**
     * Limpar cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache Copernicus limpo');
    }
    
    /**
     * Obter estatísticas do cache
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            totalMemory: JSON.stringify(Array.from(this.cache.values())).length
        };
    }
    
    /**
     * Inicialização automática
     */
    async initialize() {
        console.log('🚀 Inicializando Copernicus Official Client...');
        
        try {
            // Tentar autenticação
            const authSuccess = await this.authenticate();
            
            if (authSuccess) {
                this.updateCopernicusStatus('online', 'Copernicus CDSE Conectado');
                
                // Buscar dados iniciais
                const angolaData = await this.getAngolaMarineData();
                
                if (angolaData) {
                    console.log('✅ Inicialização completa com sucesso');
                    return angolaData;
                }
            }
            
            throw new Error('Falha na inicialização');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.updateCopernicusStatus('error', 'Erro na Conexão');
            return null;
        }
    }
}

// Instância global
window.CopernicusOfficialClient = CopernicusOfficialClient;

// Auto-inicialização quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.copernicusClient = new CopernicusOfficialClient();
    });
} else {
    window.copernicusClient = new CopernicusOfficialClient();
}

console.log('🛰️ Copernicus Official Client carregado');
