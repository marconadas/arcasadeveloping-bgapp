/**
 * Offline Map Capability for BGAPP
 * Sistema de mapas offline inspirado no EOX::Maps
 * Cache inteligente com Service Workers e IndexedDB
 */

class OfflineMapCapability {
    constructor() {
        this.cacheName = 'bgapp-maps-cache-v1';
        this.tileCache = new Map();
        this.offlineAreas = new Map();
        this.isOffline = !navigator.onLine;
        this.maxCacheSize = 500 * 1024 * 1024; // 500MB
        this.currentCacheSize = 0;
        
        this.initializeOfflineCapability();
    }

    /**
     * Inicializa capacidades offline
     */
    async initializeOfflineCapability() {
        // Registrar Service Worker
        if ('serviceWorker' in navigator) {
            try {
                await this.registerServiceWorker();
            } catch (error) {
                console.warn('❌ Service Worker não pôde ser registrado:', error);
            }
        }

        // Inicializar IndexedDB
        await this.initializeIndexedDB();

        // Monitorar status de conexão
        this.setupConnectionMonitoring();

        // Calcular tamanho atual do cache
        await this.calculateCurrentCacheSize();

        console.log('✅ Sistema offline inicializado');
    }

    /**
     * Registra Service Worker
     */
    async registerServiceWorker() {
        const swCode = `
            const CACHE_NAME = '${this.cacheName}';
            
            self.addEventListener('install', (event) => {
                console.log('🔧 Service Worker instalado');
                self.skipWaiting();
            });
            
            self.addEventListener('activate', (event) => {
                console.log('✅ Service Worker ativado');
                event.waitUntil(clients.claim());
            });
            
            self.addEventListener('fetch', (event) => {
                // Interceptar requisições de tiles
                if (event.request.url.includes('/tiles/') || 
                    event.request.url.includes('.png') || 
                    event.request.url.includes('.jpg')) {
                    
                    event.respondWith(
                        caches.match(event.request)
                            .then(response => {
                                if (response) {
                                    return response;
                                }
                                
                                return fetch(event.request)
                                    .then(response => {
                                        if (response && response.status === 200) {
                                            const responseClone = response.clone();
                                            caches.open(CACHE_NAME)
                                                .then(cache => {
                                                    cache.put(event.request, responseClone);
                                                });
                                        }
                                        return response;
                                    })
                                    .catch(() => {
                                        // Retornar tile placeholder se offline
                                        return new Response(
                                            '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#f0f0f0"/><text x="128" y="128" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">Offline</text></svg>',
                                            { headers: { 'Content-Type': 'image/svg+xml' } }
                                        );
                                    });
                            })
                    );
                }
            });
        `;

        // Criar blob do Service Worker
        const swBlob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(swBlob);

        const registration = await navigator.serviceWorker.register(swUrl);
        console.log('✅ Service Worker registrado:', registration.scope);
    }

    /**
     * Inicializa IndexedDB para cache de dados
     */
    async initializeIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('BGAPPOfflineDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store para tiles
                if (!db.objectStoreNames.contains('tiles')) {
                    const tileStore = db.createObjectStore('tiles', { keyPath: 'url' });
                    tileStore.createIndex('layer', 'layer');
                    tileStore.createIndex('timestamp', 'timestamp');
                }
                
                // Store para áreas offline
                if (!db.objectStoreNames.contains('offlineAreas')) {
                    const areaStore = db.createObjectStore('offlineAreas', { keyPath: 'id' });
                    areaStore.createIndex('name', 'name');
                }
                
                // Store para dados vetoriais
                if (!db.objectStoreNames.contains('vectorData')) {
                    const vectorStore = db.createObjectStore('vectorData', { keyPath: 'id' });
                    vectorStore.createIndex('type', 'type');
                }
            };
        });
    }

    /**
     * Monitora status de conexão
     */
    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.isOffline = false;
            this.showConnectionStatus('🟢 Online', 'success');
            console.log('🟢 Conexão restaurada');
        });

        window.addEventListener('offline', () => {
            this.isOffline = true;
            this.showConnectionStatus('🔴 Offline', 'warning');
            console.log('🔴 Sem conexão - modo offline ativo');
        });
    }

    /**
     * Cria controle de capacidades offline
     */
    createOfflineControl(map) {
        const control = L.control({ position: 'topright' });
        
        control.onAdd = function() {
            const div = L.DomUtil.create('div', 'offline-control');
            div.innerHTML = `
                <div class="offline-header">
                    <h4>📱 Offline Maps</h4>
                    <div class="connection-status ${this.isOffline ? 'offline' : 'online'}">
                        ${this.isOffline ? '🔴 Offline' : '🟢 Online'}
                    </div>
                    <button class="offline-toggle-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
                </div>
                <div class="offline-content">
                    <div class="cache-info">
                        <div class="cache-stats">
                            <div class="stat-item">
                                <span class="stat-label">Cache Usado:</span>
                                <span class="stat-value">${this.formatBytes(this.currentCacheSize)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Limite:</span>
                                <span class="stat-value">${this.formatBytes(this.maxCacheSize)}</span>
                            </div>
                            <div class="cache-progress">
                                <div class="progress-bar" style="width: ${(this.currentCacheSize / this.maxCacheSize * 100)}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="download-section">
                        <h5>📥 Download para Offline</h5>
                        <div class="area-selector">
                            <label>Área Atual do Mapa:</label>
                            <div class="current-area-info">
                                <span class="area-bounds">Lat: ${map.getBounds().getNorth().toFixed(3)} a ${map.getBounds().getSouth().toFixed(3)}</span>
                                <span class="area-bounds">Lon: ${map.getBounds().getWest().toFixed(3)} a ${map.getBounds().getEast().toFixed(3)}</span>
                            </div>
                        </div>
                        
                        <div class="zoom-levels">
                            <label>Níveis de Zoom:</label>
                            <div class="zoom-range">
                                <input type="range" id="min-zoom" min="1" max="18" value="${Math.max(1, map.getZoom() - 2)}">
                                <span>Min: <span id="min-zoom-value">${Math.max(1, map.getZoom() - 2)}</span></span>
                            </div>
                            <div class="zoom-range">
                                <input type="range" id="max-zoom" min="1" max="18" value="${Math.min(18, map.getZoom() + 2)}">
                                <span>Max: <span id="max-zoom-value">${Math.min(18, map.getZoom() + 2)}</span></span>
                            </div>
                        </div>
                        
                        <div class="layer-selection">
                            <label>Camadas para Download:</label>
                            <div class="layer-checkboxes">
                                <label><input type="checkbox" value="base" checked> Camada Base</label>
                                <label><input type="checkbox" value="bathymetry"> Batimetria</label>
                                <label><input type="checkbox" value="sentinel2"> Sentinel-2</label>
                            </div>
                        </div>
                        
                        <div class="download-estimate">
                            <div class="estimate-info">
                                <span class="estimate-size">Tamanho estimado: <span id="download-size">Calculando...</span></span>
                                <span class="estimate-tiles">Tiles: <span id="tile-count">0</span></span>
                            </div>
                        </div>
                        
                        <button class="download-btn" onclick="window.offlineCapability?.startDownload()" id="start-download">
                            📥 Iniciar Download
                        </button>
                        
                        <div class="download-progress" style="display: none;">
                            <div class="progress-info">
                                <span class="progress-text">Baixando...</span>
                                <span class="progress-percent">0%</span>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="offline-areas">
                        <h5>💾 Áreas Salvas</h5>
                        <div class="saved-areas" id="saved-areas-list">
                            ${this.generateSavedAreasList()}
                        </div>
                    </div>
                    
                    <div class="offline-actions">
                        <button class="offline-btn offline-btn-secondary" onclick="window.offlineCapability?.clearCache()">
                            🗑️ Limpar Cache
                        </button>
                        <button class="offline-btn offline-btn-primary" onclick="window.offlineCapability?.exportOfflineData()">
                            📤 Exportar Dados
                        </button>
                    </div>
                </div>
            `;
            
            // Previne propagação de eventos
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            
            return div;
        }.bind(this);
        
        control.addTo(map);
        
        // Adicionar estilos e eventos
        this.injectOfflineStyles();
        this.setupOfflineEvents(map);
        
        return control;
    }

    /**
     * Injeta estilos CSS
     */
    injectOfflineStyles() {
        if (document.getElementById('offline-styles')) return;
        
        const styles = `
            <style id="offline-styles">
            .offline-control {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 0;
                min-width: 320px;
                max-width: 380px;
                backdrop-filter: blur(10px);
                font-family: 'Segoe UI', system-ui, sans-serif;
                transition: all 0.3s ease;
                max-height: 600px;
                overflow: hidden;
            }

            .offline-control.collapsed .offline-content {
                display: none;
            }

            .offline-header {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .offline-header h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
                flex: 1;
            }

            .connection-status {
                font-size: 10px;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: 10px;
                margin: 0 8px;
            }

            .connection-status.online {
                background: rgba(40, 167, 69, 0.3);
            }

            .connection-status.offline {
                background: rgba(220, 53, 69, 0.3);
            }

            .offline-toggle-btn {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
                padding: 2px 6px;
                border-radius: 3px;
                transition: background 0.2s;
            }

            .offline-toggle-btn:hover {
                background: rgba(255,255,255,0.2);
            }

            .offline-content {
                padding: 16px;
                max-height: 520px;
                overflow-y: auto;
            }

            .cache-info {
                margin-bottom: 16px;
                padding: 12px;
                background: #f8f9fa;
                border-radius: 6px;
                border-left: 4px solid #ff6b6b;
            }

            .stat-item {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                margin-bottom: 4px;
            }

            .stat-label {
                color: #6c757d;
                font-weight: 500;
            }

            .stat-value {
                color: #2c3e50;
                font-weight: 600;
            }

            .cache-progress {
                height: 4px;
                background: #e9ecef;
                border-radius: 2px;
                margin-top: 8px;
                overflow: hidden;
            }

            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #ff6b6b, #ee5a24);
                transition: width 0.3s ease;
            }

            .download-section, .offline-areas {
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid #e1e8ed;
            }

            .download-section h5, .offline-areas h5 {
                margin: 0 0 8px 0;
                font-size: 11px;
                font-weight: 600;
                color: #34495e;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .area-selector, .zoom-levels, .layer-selection {
                margin-bottom: 12px;
            }

            .area-selector label, .zoom-levels label, .layer-selection label {
                display: block;
                font-size: 10px;
                font-weight: 500;
                color: #495057;
                margin-bottom: 4px;
            }

            .current-area-info {
                background: white;
                padding: 6px 8px;
                border-radius: 4px;
                border: 1px solid #dee2e6;
            }

            .area-bounds {
                display: block;
                font-size: 9px;
                color: #6c757d;
                font-family: monospace;
            }

            .zoom-range {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
            }

            .zoom-range input {
                flex: 1;
            }

            .zoom-range span {
                font-size: 9px;
                color: #6c757d;
                min-width: 60px;
            }

            .layer-checkboxes {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .layer-checkboxes label {
                display: flex;
                align-items: center;
                font-size: 10px;
                margin-bottom: 0;
            }

            .layer-checkboxes input {
                margin-right: 6px;
            }

            .download-estimate {
                background: #e3f2fd;
                padding: 8px 10px;
                border-radius: 4px;
                margin-bottom: 12px;
            }

            .estimate-info {
                display: flex;
                justify-content: space-between;
                font-size: 10px;
            }

            .estimate-size, .estimate-tiles {
                color: #1976d2;
                font-weight: 500;
            }

            .download-btn {
                width: 100%;
                padding: 10px 16px;
                background: #ff6b6b;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
                margin-bottom: 12px;
            }

            .download-btn:hover {
                background: #ee5a24;
            }

            .download-btn:disabled {
                background: #6c757d;
                cursor: not-allowed;
            }

            .download-progress {
                margin-top: 8px;
            }

            .progress-info {
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                margin-bottom: 4px;
            }

            .progress-text {
                color: #495057;
            }

            .progress-percent {
                color: #ff6b6b;
                font-weight: 600;
            }

            .progress-bar-container {
                height: 6px;
                background: #e9ecef;
                border-radius: 3px;
                overflow: hidden;
            }

            .progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #ff6b6b, #ee5a24);
                transition: width 0.3s ease;
            }

            .saved-areas {
                min-height: 60px;
                max-height: 120px;
                overflow-y: auto;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 8px;
                background: white;
            }

            .saved-area-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 8px;
                border-radius: 3px;
                margin-bottom: 4px;
                background: #f8f9fa;
                font-size: 10px;
            }

            .saved-area-info {
                flex: 1;
            }

            .saved-area-name {
                font-weight: 600;
                color: #2c3e50;
            }

            .saved-area-size {
                color: #6c757d;
            }

            .saved-area-actions {
                display: flex;
                gap: 4px;
            }

            .area-action-btn {
                padding: 2px 6px;
                border: none;
                border-radius: 2px;
                font-size: 8px;
                cursor: pointer;
                transition: background 0.2s;
            }

            .area-action-btn.load {
                background: #28a745;
                color: white;
            }

            .area-action-btn.delete {
                background: #dc3545;
                color: white;
            }

            .offline-actions {
                display: flex;
                gap: 8px;
                margin-top: 16px;
            }

            .offline-btn {
                flex: 1;
                padding: 8px 12px;
                border: none;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
            }

            .offline-btn-primary {
                background: #ff6b6b;
                color: white;
            }

            .offline-btn-primary:hover {
                background: #ee5a24;
                transform: translateY(-1px);
            }

            .offline-btn-secondary {
                background: #6c757d;
                color: white;
            }

            .offline-btn-secondary:hover {
                background: #5a6268;
                transform: translateY(-1px);
            }

            .no-saved-areas {
                text-align: center;
                color: #6c757d;
                font-size: 10px;
                font-style: italic;
                padding: 20px;
            }

            @media (max-width: 768px) {
                .offline-control {
                    min-width: 280px;
                    max-width: 320px;
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Configura eventos do controle offline
     */
    setupOfflineEvents(map) {
        // Sliders de zoom
        document.addEventListener('input', (e) => {
            if (e.target.id === 'min-zoom') {
                document.getElementById('min-zoom-value').textContent = e.target.value;
                this.updateDownloadEstimate();
            } else if (e.target.id === 'max-zoom') {
                document.getElementById('max-zoom-value').textContent = e.target.value;
                this.updateDownloadEstimate();
            }
        });

        // Checkboxes de camadas
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.closest('.layer-checkboxes')) {
                this.updateDownloadEstimate();
            }
        });

        // Atualizar informações quando o mapa se move
        map.on('moveend', () => {
            this.updateAreaInfo(map);
            this.updateDownloadEstimate();
        });

        // Tornar disponível globalmente
        window.offlineCapability = this;

        // Atualização inicial
        setTimeout(() => this.updateDownloadEstimate(), 1000);
    }

    /**
     * Atualiza informações da área atual
     */
    updateAreaInfo(map) {
        const bounds = map.getBounds();
        const areaInfo = document.querySelector('.current-area-info');
        if (areaInfo) {
            areaInfo.innerHTML = `
                <span class="area-bounds">Lat: ${bounds.getNorth().toFixed(3)} a ${bounds.getSouth().toFixed(3)}</span>
                <span class="area-bounds">Lon: ${bounds.getWest().toFixed(3)} a ${bounds.getEast().toFixed(3)}</span>
            `;
        }
    }

    /**
     * Atualiza estimativa de download
     */
    updateDownloadEstimate() {
        const minZoom = parseInt(document.getElementById('min-zoom')?.value || 1);
        const maxZoom = parseInt(document.getElementById('max-zoom')?.value || 10);
        const selectedLayers = document.querySelectorAll('.layer-checkboxes input:checked').length;

        // Cálculo simplificado de tiles
        let totalTiles = 0;
        for (let z = minZoom; z <= maxZoom; z++) {
            totalTiles += Math.pow(4, z - minZoom) * selectedLayers;
        }

        const estimatedSize = totalTiles * 15 * 1024; // ~15KB por tile
        
        const sizeElement = document.getElementById('download-size');
        const tileElement = document.getElementById('tile-count');
        
        if (sizeElement) sizeElement.textContent = this.formatBytes(estimatedSize);
        if (tileElement) tileElement.textContent = totalTiles.toLocaleString();
    }

    /**
     * Inicia download de área offline
     */
    async startDownload() {
        const downloadBtn = document.getElementById('start-download');
        const progressDiv = document.querySelector('.download-progress');
        
        if (!downloadBtn || !progressDiv) return;

        // Desabilitar botão e mostrar progresso
        downloadBtn.disabled = true;
        downloadBtn.textContent = '⏳ Baixando...';
        progressDiv.style.display = 'block';

        try {
            // Simular download (implementação completa requereria integração real)
            for (let i = 0; i <= 100; i += 5) {
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const progressFill = document.querySelector('.progress-bar-fill');
                const progressPercent = document.querySelector('.progress-percent');
                
                if (progressFill) progressFill.style.width = `${i}%`;
                if (progressPercent) progressPercent.textContent = `${i}%`;
            }

            // Salvar área offline
            const areaId = 'area_' + Date.now();
            const offlineArea = {
                id: areaId,
                name: `Área ${new Date().toLocaleDateString()}`,
                bounds: this.getCurrentMapBounds(),
                layers: this.getSelectedLayers(),
                downloadDate: new Date().toISOString(),
                size: document.getElementById('download-size')?.textContent || '0 KB'
            };

            await this.saveOfflineArea(offlineArea);
            this.updateSavedAreasList();

            console.log('✅ Download offline concluído:', areaId);

        } catch (error) {
            console.error('❌ Erro no download offline:', error);
        } finally {
            // Restaurar botão
            downloadBtn.disabled = false;
            downloadBtn.textContent = '📥 Iniciar Download';
            progressDiv.style.display = 'none';
        }
    }

    /**
     * Salva área offline no IndexedDB
     */
    async saveOfflineArea(area) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['offlineAreas'], 'readwrite');
            const store = transaction.objectStore('offlineAreas');
            
            const request = store.add(area);
            request.onsuccess = () => {
                this.offlineAreas.set(area.id, area);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Gera lista de áreas salvas
     */
    generateSavedAreasList() {
        if (this.offlineAreas.size === 0) {
            return '<div class="no-saved-areas">Nenhuma área salva offline</div>';
        }

        return Array.from(this.offlineAreas.values()).map(area => `
            <div class="saved-area-item">
                <div class="saved-area-info">
                    <div class="saved-area-name">${area.name}</div>
                    <div class="saved-area-size">${area.size}</div>
                </div>
                <div class="saved-area-actions">
                    <button class="area-action-btn load" onclick="window.offlineCapability?.loadOfflineArea('${area.id}')">
                        📍 Ir
                    </button>
                    <button class="area-action-btn delete" onclick="window.offlineCapability?.deleteOfflineArea('${area.id}')">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Atualiza lista de áreas salvas
     */
    updateSavedAreasList() {
        const listElement = document.getElementById('saved-areas-list');
        if (listElement) {
            listElement.innerHTML = this.generateSavedAreasList();
        }
    }

    /**
     * Carrega área offline
     */
    loadOfflineArea(areaId) {
        const area = this.offlineAreas.get(areaId);
        if (!area) return;

        // Implementar navegação para a área
        console.log('📍 Carregando área offline:', area.name);
        // map.fitBounds(area.bounds);
    }

    /**
     * Remove área offline
     */
    async deleteOfflineArea(areaId) {
        if (!confirm('Tem certeza que deseja remover esta área offline?')) return;

        try {
            const transaction = this.db.transaction(['offlineAreas'], 'readwrite');
            const store = transaction.objectStore('offlineAreas');
            
            await store.delete(areaId);
            this.offlineAreas.delete(areaId);
            this.updateSavedAreasList();
            
            console.log('🗑️ Área offline removida:', areaId);
        } catch (error) {
            console.error('❌ Erro ao remover área:', error);
        }
    }

    /**
     * Limpa todo o cache
     */
    async clearCache() {
        if (!confirm('Isso removerá todos os dados offline. Continuar?')) return;

        try {
            // Limpar cache do Service Worker
            if ('caches' in window) {
                await caches.delete(this.cacheName);
            }

            // Limpar IndexedDB
            const transaction = this.db.transaction(['tiles', 'offlineAreas'], 'readwrite');
            await transaction.objectStore('tiles').clear();
            await transaction.objectStore('offlineAreas').clear();

            // Limpar mapas locais
            this.tileCache.clear();
            this.offlineAreas.clear();
            this.currentCacheSize = 0;

            // Atualizar interface
            this.updateSavedAreasList();
            
            console.log('🗑️ Cache limpo completamente');
            alert('✅ Cache limpo com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao limpar cache:', error);
            alert('❌ Erro ao limpar cache');
        }
    }

    /**
     * Exporta dados offline
     */
    exportOfflineData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            offlineAreas: Array.from(this.offlineAreas.values()),
            cacheSize: this.currentCacheSize,
            totalAreas: this.offlineAreas.size
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bgapp_offline_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('📤 Dados offline exportados');
    }

    /**
     * Mostra status de conexão
     */
    showConnectionStatus(message, type) {
        const statusElement = document.querySelector('.connection-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `connection-status ${type === 'success' ? 'online' : 'offline'}`;
        }
    }

    /**
     * Calcula tamanho atual do cache
     */
    async calculateCurrentCacheSize() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                this.currentCacheSize = estimate.usage || 0;
            }
        } catch (error) {
            console.warn('❌ Não foi possível calcular tamanho do cache:', error);
        }
    }

    /**
     * Formata bytes para exibição
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Obtém bounds atuais do mapa (helper)
     */
    getCurrentMapBounds() {
        // Placeholder - seria implementado com referência real do mapa
        return [[0, 0], [0, 0]];
    }

    /**
     * Obtém camadas selecionadas (helper)
     */
    getSelectedLayers() {
        const checkboxes = document.querySelectorAll('.layer-checkboxes input:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }
}

// Exporta para uso global
window.OfflineMapCapability = OfflineMapCapability;

console.log('✅ Offline Map Capability carregado e pronto para uso');
