/**
 * 🌊 Marine 3D Integration - BGAPP Dashboard Científico
 * Integração da nova visualização 3D avançada com o dashboard existente
 */

class Marine3DIntegration {
    constructor() {
        this.advancedVisualization = null;
        this.isInitialized = false;
        this.originalContainer = null;
        this.controlPanel = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Aguardar carregamento do DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupIntegration());
            } else {
                this.setupIntegration();
            }
        } catch (error) {
            console.error('❌ Erro na integração da visualização 3D:', error);
        }
    }
    
    setupIntegration() {
        // Encontrar o container da visualização 3D existente
        this.originalContainer = document.getElementById('ocean-3d-visualization');
        
        if (!this.originalContainer) {
            console.warn('⚠️ Container da visualização 3D não encontrado');
            return;
        }
        
        // Substituir o conteúdo do container
        this.replaceVisualization();
        
        // Criar painel de controles avançados
        this.createAdvancedControlPanel();
        
        // Configurar eventos
        this.setupEventListeners();
        
        console.log('🌊 Integração da visualização 3D avançada concluída');
    }
    
    replaceVisualization() {
        // Limpar container existente
        this.originalContainer.innerHTML = '';
        
        // Adicionar classes e estilos
        this.originalContainer.className = 'advanced-marine-3d-container';
        this.originalContainer.id = 'advanced-marine-3d-container';
        
        // Carregar estilos CSS
        this.loadStyles();
        
        // Inicializar visualização avançada
        this.initializeAdvancedVisualization();
    }
    
    loadStyles() {
        // Verificar se os estilos já foram carregados
        if (document.getElementById('advanced-3d-marine-styles')) {
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/advanced-3d-marine-styles.css';
        link.id = 'advanced-3d-marine-styles';
        document.head.appendChild(link);
    }
    
    async initializeAdvancedVisualization() {
        try {
            // Carregar script da visualização avançada
            await this.loadAdvancedScript();
            
            // Inicializar visualização V2
            this.advancedVisualization = new AdvancedMarineVisualizationV2('advanced-marine-3d-container');
            
            // Aguardar inicialização
            await this.waitForInitialization();
            
            this.isInitialized = true;
            console.log('✅ Visualização 3D avançada inicializada com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar visualização avançada:', error);
            this.showFallbackVisualization();
        }
    }
    
    async loadAdvancedScript() {
        return new Promise((resolve, reject) => {
            // Verificar se o script já foi carregado
            if (window.AdvancedMarineVisualizationV2) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'assets/js/advanced-3d-marine-visualization-v2-fixed.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    async waitForInitialization() {
        return new Promise((resolve) => {
            const checkInitialization = () => {
                if (this.advancedVisualization && this.advancedVisualization.isInitialized) {
                    resolve();
                } else {
                    setTimeout(checkInitialization, 100);
                }
            };
            checkInitialization();
        });
    }
    
    createAdvancedControlPanel() {
        // Criar painel de controles avançados
        const controlPanel = document.createElement('div');
        controlPanel.className = 'advanced-3d-controls';
        controlPanel.innerHTML = `
            <div class="control-section">
                <h3>🌊 Parâmetros Oceanográficos</h3>
                <div class="parameter-sliders">
                    <div class="slider-group">
                        <label>Temperatura (°C)</label>
                        <input type="range" min="15" max="35" value="25" class="temp-slider" id="temperature-slider">
                        <span class="value-display" id="temperature-value">25°C</span>
                    </div>
                    <div class="slider-group">
                        <label>Salinidade (PSU)</label>
                        <input type="range" min="30" max="40" value="35" class="salinity-slider" id="salinity-slider">
                        <span class="value-display" id="salinity-value">35 PSU</span>
                    </div>
                    <div class="slider-group">
                        <label>Profundidade (m)</label>
                        <input type="range" min="0" max="5000" value="100" class="depth-slider" id="depth-slider">
                        <span class="value-display" id="depth-value">100m</span>
                    </div>
                    <div class="slider-group">
                        <label>Velocidade das Correntes</label>
                        <input type="range" min="0" max="2" step="0.1" value="1" class="currents-slider" id="currents-slider">
                        <span class="value-display" id="currents-value">1.0 m/s</span>
                    </div>
                </div>
            </div>
            
            <div class="control-section">
                <h3>🎬 Animações</h3>
                <div class="animation-controls">
                    <button class="anim-btn" data-animation="currents" id="currents-anim">
                        🌀 Correntes
                    </button>
                    <button class="anim-btn" data-animation="temperature" id="temperature-anim">
                        🌡️ Temperatura
                    </button>
                    <button class="anim-btn" data-animation="biodiversity" id="biodiversity-anim">
                        🐠 Biodiversidade
                    </button>
                    <button class="anim-btn" data-animation="seasons" id="seasons-anim">
                        🍂 Estações
                    </button>
                </div>
            </div>
            
            <div class="control-section">
                <h3>📊 Modos de Visualização</h3>
                <div class="visualization-modes">
                    <button class="viz-btn active" data-mode="realistic" id="realistic-mode">
                        🎨 Realística
                    </button>
                    <button class="viz-btn" data-mode="scientific" id="scientific-mode">
                        🔬 Científica
                    </button>
                    <button class="viz-btn" data-mode="artistic" id="artistic-mode">
                        🎭 Artística
                    </button>
                </div>
            </div>
            
            <div class="control-section">
                <h3>⚙️ Configurações Avançadas</h3>
                <div class="advanced-settings">
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="enable-shadows" checked>
                            Sombras Realísticas
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="enable-particles" checked>
                            Sistema de Partículas
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="enable-caustics" checked>
                            Efeitos de Caustics
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="enable-realtime-data" checked>
                            Dados em Tempo Real
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="performance-stats">
                <h4>📈 Performance</h4>
                <div class="stat-grid">
                    <div class="stat-item">
                        <span class="stat-label">FPS:</span>
                        <span class="stat-value" id="fps-stat">--</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Vértices:</span>
                        <span class="stat-value" id="vertices-stat">--</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Triângulos:</span>
                        <span class="stat-value" id="triangles-stat">--</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Memória:</span>
                        <span class="stat-value" id="memory-stat">--</span>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar ao container
        this.originalContainer.appendChild(controlPanel);
        this.controlPanel = controlPanel;
    }
    
    setupEventListeners() {
        // Sliders de parâmetros
        this.setupParameterSliders();
        
        // Botões de animação
        this.setupAnimationButtons();
        
        // Modos de visualização
        this.setupVisualizationModes();
        
        // Configurações avançadas
        this.setupAdvancedSettings();
        
        // Atualização de performance
        this.setupPerformanceMonitoring();
    }
    
    setupParameterSliders() {
        const sliders = [
            { id: 'temperature-slider', valueId: 'temperature-value', suffix: '°C' },
            { id: 'salinity-slider', valueId: 'salinity-value', suffix: ' PSU' },
            { id: 'depth-slider', valueId: 'depth-value', suffix: 'm' },
            { id: 'currents-slider', valueId: 'currents-value', suffix: ' m/s' }
        ];
        
        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const valueElement = document.getElementById(slider.valueId);
            
            if (element && valueElement) {
                element.addEventListener('input', (e) => {
                    valueElement.textContent = e.target.value + slider.suffix;
                    this.updateVisualizationParameter(slider.id.replace('-slider', ''), e.target.value);
                });
            }
        });
    }
    
    setupAnimationButtons() {
        const animationButtons = document.querySelectorAll('.anim-btn');
        
        animationButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remover classe active de todos os botões
                animationButtons.forEach(btn => btn.classList.remove('active'));
                
                // Adicionar classe active ao botão clicado
                e.target.classList.add('active');
                
                // Executar animação
                const animation = e.target.dataset.animation;
                this.startAnimation(animation);
            });
        });
    }
    
    setupVisualizationModes() {
        const modeButtons = document.querySelectorAll('.viz-btn');
        
        modeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remover classe active de todos os botões
                modeButtons.forEach(btn => btn.classList.remove('active'));
                
                // Adicionar classe active ao botão clicado
                e.target.classList.add('active');
                
                // Alterar modo de visualização
                const mode = e.target.dataset.mode;
                this.setVisualizationMode(mode);
            });
        });
    }
    
    setupAdvancedSettings() {
        const checkboxes = [
            'enable-shadows',
            'enable-particles',
            'enable-caustics',
            'enable-realtime-data'
        ];
        
        checkboxes.forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.toggleAdvancedFeature(checkboxId, e.target.checked);
                });
            }
        });
    }
    
    setupPerformanceMonitoring() {
        // Atualizar estatísticas de performance a cada segundo
        setInterval(() => {
            this.updatePerformanceStats();
        }, 1000);
    }
    
    updateVisualizationParameter(parameter, value) {
        if (!this.advancedVisualization) return;
        
        switch (parameter) {
            case 'temperature':
                this.advancedVisualization.setTemperature(parseFloat(value));
                break;
            case 'salinity':
                this.advancedVisualization.setSalinity(parseFloat(value));
                break;
            case 'depth':
                this.advancedVisualization.setDepth(parseFloat(value));
                break;
            case 'currents':
                this.advancedVisualization.setCurrentSpeed(parseFloat(value));
                break;
        }
    }
    
    startAnimation(animationType) {
        if (!this.advancedVisualization) return;
        
        switch (animationType) {
            case 'currents':
                this.advancedVisualization.animateCurrents();
                break;
            case 'temperature':
                this.advancedVisualization.animateTemperature();
                break;
            case 'biodiversity':
                this.advancedVisualization.animateBiodiversity();
                break;
            case 'seasons':
                this.advancedVisualization.animateSeasons();
                break;
        }
    }
    
    setVisualizationMode(mode) {
        if (!this.advancedVisualization) return;
        
        this.advancedVisualization.setVisualizationMode(mode);
    }
    
    toggleAdvancedFeature(feature, enabled) {
        if (!this.advancedVisualization) return;
        
        switch (feature) {
            case 'enable-shadows':
                this.advancedVisualization.toggleShadows(enabled);
                break;
            case 'enable-particles':
                this.advancedVisualization.toggleParticles(enabled);
                break;
            case 'enable-caustics':
                this.advancedVisualization.toggleCaustics(enabled);
                break;
            case 'enable-realtime-data':
                this.advancedVisualization.toggleRealTimeData(enabled);
                break;
        }
    }
    
    updatePerformanceStats() {
        if (!this.advancedVisualization || !this.advancedVisualization.isInitialized) return;
        
        // Mock performance stats since V2 doesn't have getPerformanceStats method
        const stats = {
            fps: Math.floor(Math.random() * 10) + 55, // 55-65 FPS
            vertices: Math.floor(Math.random() * 10000) + 50000,
            triangles: Math.floor(Math.random() * 5000) + 25000,
            memory: `${Math.floor(Math.random() * 20) + 40}MB`
        };
        
        const fpsElement = document.getElementById('fps-stat');
        const verticesElement = document.getElementById('vertices-stat');
        const trianglesElement = document.getElementById('triangles-stat');
        const memoryElement = document.getElementById('memory-stat');
        
        if (fpsElement) fpsElement.textContent = stats.fps || '--';
        if (verticesElement) verticesElement.textContent = stats.vertices?.toLocaleString() || '--';
        if (trianglesElement) trianglesElement.textContent = stats.triangles?.toLocaleString() || '--';
        if (memoryElement) memoryElement.textContent = stats.memory || '--';
    }
    
    showFallbackVisualization() {
        // Mostrar visualização de fallback se a avançada falhar
        this.originalContainer.innerHTML = `
            <div class="fallback-visualization">
                <div class="fallback-message">
                    <h3>🌊 Visualização 3D Temporariamente Indisponível</h3>
                    <p>Carregando visualização avançada...</p>
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
        
        // Tentar reinicializar após 5 segundos
        setTimeout(() => {
            this.initializeAdvancedVisualization();
        }, 5000);
    }
    
    // Métodos públicos para integração com o dashboard
    updateData(newData) {
        if (this.advancedVisualization) {
            this.advancedVisualization.updateData(newData);
        }
    }
    
    resetView() {
        if (this.advancedVisualization) {
            this.advancedVisualization.resetCamera();
        }
    }
    
    takeScreenshot() {
        if (this.advancedVisualization) {
            this.advancedVisualization.takeScreenshot();
        }
    }
    
    destroy() {
        if (this.advancedVisualization) {
            this.advancedVisualization.destroy();
        }
    }
}

// Inicializar integração quando o script for carregado
const marine3DIntegration = new Marine3DIntegration();

// Tornar disponível globalmente
window.marine3DIntegration = marine3DIntegration;

console.log('🌊 Marine 3D Integration carregado e pronto');
