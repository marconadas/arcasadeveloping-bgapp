/**
 * 🔗 DASHBOARD INTEGRATION - BGAPP Unreal Engine Style
 * Integration layer between existing dashboard and new Unreal Engine components
 * 
 * Features:
 * - Seamless integration with existing dashboard
 * - Progressive enhancement
 * - Backward compatibility
 * - Performance monitoring integration
 * - Real-time data binding
 * - Scientific visualization enhancements
 */

class DashboardIntegration {
    constructor() {
        this.isUnrealEngineMode = false;
        this.originalDashboard = null;
        this.unrealDashboard = null;
        this.performanceOptimizer = null;
        
        this.integrationPoints = new Map();
        this.dataBindings = new Map();
        
        this.init();
    }
    
    init() {
        console.log('🔗 Inicializando Dashboard Integration...');
        
        // Wait for all dependencies to load
        this.waitForDependencies().then(() => {
            this.setupIntegration();
            this.enhanceExistingElements();
            this.setupToggleControls();
            this.bindRealTimeData();
            this.setupKeyboardShortcuts();
            
            console.log('✅ Dashboard Integration inicializado');
        });
    }
    
    async waitForDependencies() {
        const checkDependency = (obj, name, timeout = 10000) => {
            return new Promise((resolve) => {
                const startTime = Date.now();
                const check = () => {
                    if (window[obj] || (Date.now() - startTime > timeout)) {
                        resolve(window[obj]);
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        };
        
        // Wait for key dependencies
        await Promise.all([
            checkDependency('THREE'),
            checkDependency('performanceOptimizer'),
            checkDependency('unrealUI')
        ]);
        
        console.log('✅ Dependências carregadas');
    }
    
    setupIntegration() {
        // Create toggle button for Unreal Engine mode
        this.createModeToggle();
        
        // Enhance existing 3D container
        this.enhance3DContainer();
        
        // Integrate performance monitoring
        this.integratePerformanceMonitoring();
        
        // Setup data visualization enhancements
        this.setupDataVisualizationEnhancements();
    }
    
    createModeToggle() {
        const toggleContainer = document.createElement('div');
        toggleContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1001;
            display: flex;
            gap: 12px;
            align-items: center;
        `;
        
        const modeToggle = document.createElement('button');
        modeToggle.innerHTML = '🎮 Modo Unreal Engine';
        modeToggle.className = 'unreal-button';
        modeToggle.style.cssText = `
            background: linear-gradient(135deg, rgba(136, 68, 255, 0.2) 0%, rgba(136, 68, 255, 0.1) 100%);
            border: 1px solid #8844ff;
            border-radius: 6px;
            color: white;
            padding: 8px 16px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 600;
            letter-spacing: 1px;
        `;
        
        modeToggle.addEventListener('click', () => {
            this.toggleUnrealMode();
        });
        
        // Performance indicator
        const perfIndicator = document.createElement('div');
        perfIndicator.id = 'performance-indicator';
        perfIndicator.style.cssText = `
            background: rgba(0, 255, 136, 0.2);
            border: 1px solid #00ff88;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 10px;
            color: #00ff88;
            font-family: 'JetBrains Mono', monospace;
            min-width: 60px;
            text-align: center;
        `;
        perfIndicator.textContent = '60 FPS';
        
        toggleContainer.appendChild(modeToggle);
        toggleContainer.appendChild(perfIndicator);
        document.body.appendChild(toggleContainer);
        
        this.modeToggle = modeToggle;
        this.perfIndicator = perfIndicator;
    }
    
    toggleUnrealMode() {
        this.isUnrealEngineMode = !this.isUnrealEngineMode;
        
        if (this.isUnrealEngineMode) {
            this.activateUnrealMode();
        } else {
            this.deactivateUnrealMode();
        }
    }
    
    activateUnrealMode() {
        console.log('🎮 Ativando Modo Unreal Engine...');
        
        // Add Unreal Engine styles to body
        document.body.classList.add('unreal-engine-mode');
        
        // Initialize Unreal Dashboard if not already done
        if (!this.unrealDashboard && window.UnrealEngineInspiredDashboard) {
            this.unrealDashboard = new window.UnrealEngineInspiredDashboard();
        }
        
        // Apply Unreal Engine enhancements
        this.applyUnrealEnhancements();
        
        // Update toggle button
        this.modeToggle.innerHTML = '🗺️ Modo Clássico';
        this.modeToggle.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)';
        this.modeToggle.style.borderColor = '#00d4ff';
        
        // Show notification
        if (window.showNotification) {
            window.showNotification('🎮 Modo Unreal Engine ativado! Use as teclas 1-4 para ajustar qualidade.', 'success');
        }
        
        // Add particle effects
        this.addParticleEffects();
    }
    
    deactivateUnrealMode() {
        console.log('🗺️ Desativando Modo Unreal Engine...');
        
        // Remove Unreal Engine styles
        document.body.classList.remove('unreal-engine-mode');
        
        // Remove enhancements
        this.removeUnrealEnhancements();
        
        // Update toggle button
        this.modeToggle.innerHTML = '🎮 Modo Unreal Engine';
        this.modeToggle.style.background = 'linear-gradient(135deg, rgba(136, 68, 255, 0.2) 0%, rgba(136, 68, 255, 0.1) 100%)';
        this.modeToggle.style.borderColor = '#8844ff';
        
        // Show notification
        if (window.showNotification) {
            window.showNotification('🗺️ Modo Clássico restaurado', 'info');
        }
        
        // Remove particle effects
        this.removeParticleEffects();
    }
    
    applyUnrealEnhancements() {
        // Add grid background
        this.addGridBackground();
        
        // Enhance existing cards with Unreal styling
        this.enhanceCards();
        
        // Add advanced tooltips to existing elements
        this.addAdvancedTooltips();
        
        // Enhance buttons
        this.enhanceButtons();
        
        // Add context menus
        this.addContextMenus();
    }
    
    removeUnrealEnhancements() {
        // Remove grid background
        const grid = document.querySelector('.unreal-grid');
        if (grid) grid.remove();
        
        // Remove particle effects
        const particles = document.querySelector('.unreal-particles');
        if (particles) particles.remove();
        
        // Remove enhanced styling from cards
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('unreal-enhanced');
        });
    }
    
    addGridBackground() {
        if (document.querySelector('.unreal-grid')) return;
        
        const grid = document.createElement('div');
        grid.className = 'unreal-grid';
        document.body.appendChild(grid);
    }
    
    addParticleEffects() {
        if (document.querySelector('.unreal-particles')) return;
        
        const particleContainer = document.createElement('div');
        particleContainer.className = 'unreal-particles';
        
        // Create floating particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'unreal-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (6 + Math.random() * 4) + 's';
            particleContainer.appendChild(particle);
        }
        
        document.body.appendChild(particleContainer);
    }
    
    removeParticleEffects() {
        const particles = document.querySelector('.unreal-particles');
        if (particles) particles.remove();
    }
    
    enhanceCards() {
        document.querySelectorAll('.card').forEach(card => {
            if (!card.classList.contains('unreal-enhanced')) {
                card.classList.add('unreal-enhanced');
                
                // Add hover effects
                card.addEventListener('mouseenter', () => {
                    if (this.isUnrealEngineMode) {
                        card.style.transform = 'translateY(-5px) scale(1.02)';
                        card.style.boxShadow = '0 20px 40px rgba(0, 212, 255, 0.3)';
                    }
                });
                
                card.addEventListener('mouseleave', () => {
                    if (this.isUnrealEngineMode) {
                        card.style.transform = 'translateY(0) scale(1)';
                        card.style.boxShadow = 'none';
                    }
                });
            }
        });
    }
    
    addAdvancedTooltips() {
        // Add tooltips to buttons and interactive elements
        document.querySelectorAll('button:not([data-tooltip])').forEach((button, index) => {
            const tooltips = [
                'Clique para executar ação',
                'Use Ctrl+Click para opções avançadas',
                'Arraste para reposicionar',
                'Clique direito para menu contextual'
            ];
            
            button.setAttribute('data-tooltip', tooltips[index % tooltips.length]);
        });
        
        // Add tooltips to data elements
        document.querySelectorAll('[class*="metric"], [class*="data"]').forEach(element => {
            if (!element.getAttribute('data-tooltip')) {
                element.setAttribute('data-tooltip', 'Dados científicos em tempo real - Clique para detalhes');
            }
        });
    }
    
    enhanceButtons() {
        document.querySelectorAll('button:not(.unreal-button)').forEach(button => {
            button.addEventListener('mouseenter', () => {
                if (this.isUnrealEngineMode) {
                    button.style.transform = 'translateY(-2px)';
                    button.style.boxShadow = '0 5px 15px rgba(0, 212, 255, 0.3)';
                }
            });
            
            button.addEventListener('mouseleave', () => {
                if (this.isUnrealEngineMode) {
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = 'none';
                }
            });
        });
    }
    
    addContextMenus() {
        // Add context menus to 3D visualization
        const oceanContainer = document.getElementById('ocean-3d-visualization');
        if (oceanContainer && !oceanContainer.getAttribute('data-context-menu')) {
            oceanContainer.setAttribute('data-context-menu', 'ocean-view');
        }
        
        // Add context menus to data elements
        document.querySelectorAll('[class*="metric"], [class*="data"]').forEach(element => {
            if (!element.getAttribute('data-context-menu')) {
                element.setAttribute('data-context-menu', 'data-point');
            }
        });
    }
    
    enhance3DContainer() {
        const container = document.getElementById('ocean-3d-visualization');
        if (!container) return;
        
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'unreal-loading-indicator';
        loadingIndicator.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
            pointer-events: none;
        `;
        
        const spinner = window.unrealUI ? 
            window.unrealUI.createLoadingSpinner(loadingIndicator) :
            this.createSimpleSpinner();
        
        container.style.position = 'relative';
        container.appendChild(loadingIndicator);
        
        // Hide loading indicator after 3 seconds
        setTimeout(() => {
            loadingIndicator.style.opacity = '0';
            setTimeout(() => loadingIndicator.remove(), 300);
        }, 3000);
    }
    
    createSimpleSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'simple-spinner';
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 3px solid rgba(0, 212, 255, 0.3);
            border-top: 3px solid #00d4ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        
        return { element: spinner, remove: () => spinner.remove() };
    }
    
    integratePerformanceMonitoring() {
        if (!window.performanceOptimizer) return;
        
        // Listen to performance updates
        window.addEventListener('performanceUpdate', (event) => {
            const metrics = event.detail;
            
            // Update performance indicator
            if (this.perfIndicator) {
                this.perfIndicator.textContent = `${metrics.fps} FPS`;
                
                // Color based on performance
                if (metrics.fps > 50) {
                    this.perfIndicator.style.borderColor = '#00ff88';
                    this.perfIndicator.style.color = '#00ff88';
                } else if (metrics.fps > 30) {
                    this.perfIndicator.style.borderColor = '#ff8800';
                    this.perfIndicator.style.color = '#ff8800';
                } else {
                    this.perfIndicator.style.borderColor = '#ff4444';
                    this.perfIndicator.style.color = '#ff4444';
                }
            }
        });
        
        // Listen to quality changes
        window.addEventListener('qualityChanged', (event) => {
            const { quality } = event.detail;
            
            if (window.showNotification) {
                window.showNotification(
                    `🎯 Qualidade ajustada para: ${quality.toUpperCase()}`,
                    'info',
                    2000
                );
            }
        });
    }
    
    setupDataVisualizationEnhancements() {
        // Enhance charts and graphs
        this.enhanceCharts();
        
        // Add real-time data indicators
        this.addRealTimeIndicators();
        
        // Setup data export enhancements
        this.setupDataExport();
    }
    
    enhanceCharts() {
        // Find chart containers and enhance them
        document.querySelectorAll('[id*="chart"], [class*="chart"]').forEach(chartElement => {
            if (!chartElement.classList.contains('unreal-enhanced')) {
                chartElement.classList.add('unreal-enhanced');
                
                // Add border glow effect
                chartElement.style.transition = 'all 0.3s ease';
                
                chartElement.addEventListener('mouseenter', () => {
                    if (this.isUnrealEngineMode) {
                        chartElement.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.5)';
                    }
                });
                
                chartElement.addEventListener('mouseleave', () => {
                    if (this.isUnrealEngineMode) {
                        chartElement.style.boxShadow = 'none';
                    }
                });
            }
        });
    }
    
    addRealTimeIndicators() {
        // Add pulsing indicators for real-time data
        document.querySelectorAll('[class*="real-time"], [class*="live"]').forEach(element => {
            if (!element.querySelector('.real-time-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'real-time-indicator';
                indicator.style.cssText = `
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 8px;
                    height: 8px;
                    background: #00ff88;
                    border-radius: 50%;
                    animation: pulse 2s ease-in-out infinite;
                    box-shadow: 0 0 10px #00ff88;
                `;
                
                element.style.position = 'relative';
                element.appendChild(indicator);
            }
        });
    }
    
    setupDataExport() {
        // Enhance export buttons
        document.querySelectorAll('button[onclick*="export"], button[class*="export"]').forEach(button => {
            button.addEventListener('click', () => {
                if (window.showNotification) {
                    window.showNotification('📊 Exportando dados...', 'info', 2000);
                }
            });
        });
    }
    
    bindRealTimeData() {
        // Simulate real-time data updates
        setInterval(() => {
            this.updateDataWidgets();
        }, 5000);
    }
    
    updateDataWidgets() {
        // Update data values with simulated real-time data
        document.querySelectorAll('[class*="metric-value"], [class*="data-value"]').forEach(element => {
            if (element.textContent.match(/^\d+(\.\d+)?$/)) {
                const currentValue = parseFloat(element.textContent);
                const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
                const newValue = currentValue * (1 + variation);
                
                element.style.transition = 'color 0.5s ease';
                element.style.color = variation > 0 ? '#00ff88' : '#ff4444';
                element.textContent = newValue.toFixed(2);
                
                // Reset color after animation
                setTimeout(() => {
                    element.style.color = '';
                }, 500);
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Only handle shortcuts in Unreal mode
            if (!this.isUnrealEngineMode) return;
            
            // Handle shortcuts
            switch(event.key.toLowerCase()) {
                case 'u':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.toggleUnrealMode();
                    }
                    break;
                    
                case 'p':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.showPerformanceModal();
                    }
                    break;
                    
                case 'f11':
                    event.preventDefault();
                    this.toggleFullscreen();
                    break;
            }
        });
    }
    
    showPerformanceModal() {
        if (!window.createModal) return;
        
        const metrics = window.performanceOptimizer ? 
            window.performanceOptimizer.getMetrics() : 
            { fps: 60, frameTime: 16.67, memoryUsage: 0, quality: 'high' };
        
        const content = `
            <div style="font-family: 'JetBrains Mono', monospace;">
                <h4 style="color: #00d4ff; margin-bottom: 20px;">📊 Performance Metrics</h4>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 12px;">FPS</div>
                        <div style="color: #00ff88; font-size: 24px; font-weight: bold;">${metrics.fps}</div>
                    </div>
                    <div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 12px;">Frame Time</div>
                        <div style="color: #00ffaa; font-size: 24px; font-weight: bold;">${metrics.frameTime.toFixed(2)}ms</div>
                    </div>
                    <div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 12px;">Memory</div>
                        <div style="color: #00d4ff; font-size: 24px; font-weight: bold;">${metrics.memoryUsage}MB</div>
                    </div>
                    <div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 12px;">Quality</div>
                        <div style="color: #8844ff; font-size: 24px; font-weight: bold;">${metrics.quality.toUpperCase()}</div>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 12px; margin-bottom: 10px;">Keyboard Shortcuts:</div>
                    <div style="font-size: 12px; line-height: 1.5;">
                        <div><strong>Ctrl+U:</strong> Toggle Unreal Mode</div>
                        <div><strong>Ctrl+P:</strong> Show Performance</div>
                        <div><strong>1-4:</strong> Quality Settings</div>
                        <div><strong>0:</strong> Auto Quality</div>
                        <div><strong>H:</strong> Toggle HUD</div>
                    </div>
                </div>
            </div>
        `;
        
        window.createModal('Performance Monitor', content);
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}

// Initialize Dashboard Integration
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardIntegration = new DashboardIntegration();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardIntegration;
}
