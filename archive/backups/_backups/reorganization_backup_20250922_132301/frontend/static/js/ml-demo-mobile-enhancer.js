/**
 * 📱 ML Demo Mobile Enhancer
 * Melhorias específicas para dispositivos móveis e tablets
 * 
 * FUNCIONALIDADES:
 * - Navegação touch-friendly
 * - Layout adaptativo
 * - Performance otimizada
 * - Gestos mobile
 */

class MLDemoMobileEnhancer {
    constructor() {
        this.isMobile = window.innerWidth <= 767;
        this.isTablet = window.innerWidth >= 768 && window.innerWidth <= 1023;
        this.isTouch = 'ontouchstart' in window;
        
        console.log('📱 ML Demo Mobile Enhancer inicializado');
        this.initialize();
    }
    
    // =====================================
    // 🚀 INICIALIZAÇÃO
    // =====================================
    
    initialize() {
        // Detectar tipo de dispositivo
        this.detectDevice();
        
        // Aplicar melhorias mobile
        if (this.isMobile) {
            this.applyMobileEnhancements();
        } else if (this.isTablet) {
            this.applyTabletEnhancements();
        }
        
        // Melhorias gerais para touch
        if (this.isTouch) {
            this.applyTouchEnhancements();
        }
        
        // Configurar responsive listeners
        this.setupResponsiveListeners();
        
        // Otimizar performance
        this.optimizePerformance();
        
        console.log(`📱 Dispositivo detectado: ${this.getDeviceType()}`);
    }
    
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const viewport = { width: window.innerWidth, height: window.innerHeight };
        
        this.deviceInfo = {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            isTouch: this.isTouch,
            isIOS: /iphone|ipad|ipod/.test(userAgent),
            isAndroid: /android/.test(userAgent),
            viewport: viewport,
            pixelRatio: window.devicePixelRatio || 1
        };
        
        // Adicionar classes CSS baseadas no dispositivo
        document.body.classList.add(`device-${this.getDeviceType()}`);
        
        if (this.deviceInfo.isIOS) document.body.classList.add('device-ios');
        if (this.deviceInfo.isAndroid) document.body.classList.add('device-android');
        if (this.isTouch) document.body.classList.add('device-touch');
    }
    
    getDeviceType() {
        if (this.isMobile) return 'mobile';
        if (this.isTablet) return 'tablet';
        return 'desktop';
    }
    
    // =====================================
    // 📱 MELHORIAS MOBILE
    // =====================================
    
    applyMobileEnhancements() {
        console.log('📱 Aplicando melhorias mobile...');
        
        // 1. Otimizar layout
        this.optimizeMobileLayout();
        
        // 2. Melhorar navegação
        this.enhanceMobileNavigation();
        
        // 3. Otimizar controles
        this.optimizeMobileControls();
        
        // 4. Melhorar insights
        this.enhanceMobileInsights();
        
        // 5. Adicionar scroll to top
        this.addScrollToTop();
    }
    
    optimizeMobileLayout() {
        // Reorganizar status cards para mobile
        const statsContainer = document.querySelector('.demo-stats');
        if (statsContainer) {
            statsContainer.style.display = 'grid';
            statsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
            statsContainer.style.gap = '0.5rem';
            statsContainer.style.padding = '0.5rem';
        }
        
        // Otimizar seções demo
        const demoSections = document.querySelectorAll('.demo-section');
        demoSections.forEach(section => {
            section.style.padding = '1rem';
            section.style.margin = '0.75rem 0';
            section.style.borderRadius = '8px';
        });
        
        // Reduzir altura do mapa para mobile
        const mapContainer = document.querySelector('#map-container, .map-container, [class*="deck"]');
        if (mapContainer) {
            mapContainer.style.height = '300px';
            mapContainer.style.maxHeight = '40vh';
            mapContainer.style.borderRadius = '8px';
            mapContainer.style.margin = '1rem 0';
        }
    }
    
    enhanceMobileNavigation() {
        // Adicionar menu hamburger se necessário
        if (!document.querySelector('.mobile-menu-toggle')) {
            const menuToggle = document.createElement('button');
            menuToggle.className = 'mobile-menu-toggle';
            menuToggle.innerHTML = '☰';
            menuToggle.onclick = () => this.toggleMobileMenu();
            
            document.body.appendChild(menuToggle);
        }
        
        // Sticky header
        const header = document.querySelector('.demo-header');
        if (header) {
            header.style.position = 'sticky';
            header.style.top = '0';
            header.style.zIndex = '100';
            header.style.backdropFilter = 'blur(15px)';
        }
    }
    
    optimizeMobileControls() {
        // Empilhar controles verticalmente
        const controlContainers = document.querySelectorAll('.demo-controls');
        controlContainers.forEach(container => {
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '0.5rem';
            container.style.padding = '1rem 0.5rem';
        });
        
        // Melhorar botões para touch
        const buttons = document.querySelectorAll('button, .btn');
        buttons.forEach(button => {
            if (!this.isMapRelated(button)) {
                button.style.minHeight = '44px';
                button.style.minWidth = '44px';
                button.style.touchAction = 'manipulation';
                button.style.fontSize = '0.875rem';
                button.style.padding = '0.75rem 1rem';
            }
        });
    }
    
    enhanceMobileInsights() {
        // Melhorar cards de insights para mobile
        const insightCards = document.querySelectorAll('.insight-card, .insights-card-enhanced');
        insightCards.forEach(card => {
            card.style.marginBottom = '0.75rem';
            card.style.padding = '0.75rem';
            card.style.borderRadius = '8px';
            card.style.fontSize = '0.875rem';
        });
        
        // Melhorar conteúdo dos insights
        const insightContents = document.querySelectorAll('#ocean-insights, #biodiversity-insights');
        insightContents.forEach(content => {
            content.style.fontSize = '0.8rem';
            content.style.lineHeight = '1.5';
            content.style.color = '#1e293b';
            content.style.fontWeight = '500';
        });
    }
    
    addScrollToTop() {
        const scrollButton = document.createElement('button');
        scrollButton.className = 'scroll-to-top';
        scrollButton.innerHTML = '↑';
        scrollButton.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
        
        document.body.appendChild(scrollButton);
        
        // Mostrar/esconder baseado no scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollButton.classList.add('visible');
            } else {
                scrollButton.classList.remove('visible');
            }
        });
    }
    
    // =====================================
    // 📱 MELHORIAS TABLET
    // =====================================
    
    applyTabletEnhancements() {
        console.log('📱 Aplicando melhorias tablet...');
        
        // Layout 3 colunas para status cards
        const statsContainer = document.querySelector('.demo-stats');
        if (statsContainer) {
            statsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
            statsContainer.style.gap = '1rem';
        }
        
        // Controles em 2 colunas
        const controlContainers = document.querySelectorAll('.demo-controls');
        controlContainers.forEach(container => {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = 'repeat(2, 1fr)';
            container.style.gap = '0.75rem';
        });
        
        // Insights lado a lado
        const insightsPanel = document.querySelector('#ai-insights-panel');
        if (insightsPanel) {
            insightsPanel.style.display = 'grid';
            insightsPanel.style.gridTemplateColumns = 'repeat(2, 1fr)';
            insightsPanel.style.gap = '1rem';
        }
        
        // Altura do mapa otimizada para tablet
        const mapContainer = document.querySelector('#map-container, .map-container');
        if (mapContainer) {
            mapContainer.style.height = '400px';
            mapContainer.style.maxHeight = '50vh';
        }
    }
    
    // =====================================
    // 👆 MELHORIAS TOUCH
    // =====================================
    
    applyTouchEnhancements() {
        console.log('👆 Aplicando melhorias touch...');
        
        // Remover hover effects em dispositivos touch
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: none) and (pointer: coarse) {
                .ml-control-button:hover,
                .ml-status-card:hover,
                .interactive-element:hover {
                    transform: none !important;
                    box-shadow: inherit !important;
                }
                
                .ml-control-button:active {
                    transform: scale(0.95) !important;
                    transition: transform 0.1s ease !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Adicionar feedback tátil
        this.addTouchFeedback();
        
        // Melhorar swipe gestures
        this.addSwipeGestures();
    }
    
    addTouchFeedback() {
        // Adicionar feedback visual para touch
        const touchElements = document.querySelectorAll('button, .btn, [role="button"]');
        
        touchElements.forEach(element => {
            if (!this.isMapRelated(element)) {
                element.addEventListener('touchstart', () => {
                    element.style.transform = 'scale(0.95)';
                    element.style.transition = 'transform 0.1s ease';
                });
                
                element.addEventListener('touchend', () => {
                    setTimeout(() => {
                        element.style.transform = 'scale(1)';
                    }, 100);
                });
            }
        });
    }
    
    addSwipeGestures() {
        // Adicionar swipe para navegação entre seções
        let startY = 0;
        let startX = 0;
        
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
        });
        
        document.addEventListener('touchend', (e) => {
            if (!startY || !startX) return;
            
            const endY = e.changedTouches[0].clientY;
            const endX = e.changedTouches[0].clientX;
            
            const deltaY = startY - endY;
            const deltaX = startX - endX;
            
            // Swipe up para scroll suave
            if (deltaY > 50 && Math.abs(deltaX) < 100) {
                this.smoothScrollToNext();
            }
            
            // Reset
            startY = 0;
            startX = 0;
        });
    }
    
    smoothScrollToNext() {
        const sections = document.querySelectorAll('.demo-section');
        const currentScroll = window.scrollY;
        
        for (let section of sections) {
            const sectionTop = section.offsetTop;
            if (sectionTop > currentScroll + 100) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                break;
            }
        }
    }
    
    // =====================================
    // 🔄 RESPONSIVE LISTENERS
    // =====================================
    
    setupResponsiveListeners() {
        // Listener para mudanças de orientação
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // Listener para resize
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        // Listener para mudança de viewport
        this.setupViewportListener();
    }
    
    handleOrientationChange() {
        console.log('📱 Orientação alterada');
        
        // Redetectar dispositivo
        this.detectDevice();
        
        // Reaplicar layout baseado na nova orientação
        if (this.isMobile) {
            this.optimizeMobileLayout();
        } else if (this.isTablet) {
            this.applyTabletEnhancements();
        }
        
        // Notificar utilizador
        this.showNotification('📱 Layout otimizado para nova orientação', 'info', 2000);
    }
    
    handleResize() {
        const newWidth = window.innerWidth;
        const wasMobile = this.isMobile;
        const wasTablet = this.isTablet;
        
        // Atualizar flags
        this.isMobile = newWidth <= 767;
        this.isTablet = newWidth >= 768 && newWidth <= 1023;
        
        // Aplicar mudanças se mudou categoria
        if (wasMobile !== this.isMobile || wasTablet !== this.isTablet) {
            console.log(`📱 Mudança de dispositivo: ${this.getDeviceType()}`);
            this.initialize();
        }
    }
    
    setupViewportListener() {
        // Detectar mudanças de viewport (útil para PWA)
        if ('visualViewport' in window) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleViewportChange();
            });
        }
    }
    
    handleViewportChange() {
        // Ajustar interface quando teclado virtual aparece/desaparece
        const viewport = window.visualViewport;
        const heightDiff = window.innerHeight - viewport.height;
        
        if (heightDiff > 150) { // Teclado provavelmente visível
            document.body.classList.add('keyboard-visible');
            this.optimizeForKeyboard();
        } else {
            document.body.classList.remove('keyboard-visible');
        }
    }
    
    optimizeForKeyboard() {
        // Reduzir altura de elementos quando teclado está visível
        const mapContainer = document.querySelector('#map-container, .map-container');
        if (mapContainer && this.isMobile) {
            mapContainer.style.height = '200px';
            mapContainer.style.maxHeight = '25vh';
        }
    }
    
    // =====================================
    // ⚡ OTIMIZAÇÕES DE PERFORMANCE
    // =====================================
    
    optimizePerformance() {
        // Reduzir animações em dispositivos lentos
        if (this.deviceInfo.pixelRatio > 2 || this.isMobile) {
            this.reduceAnimations();
        }
        
        // Lazy loading para elementos não críticos
        this.setupLazyLoading();
        
        // Otimizar imagens se existirem
        this.optimizeImages();
        
        // Preload crítico
        this.preloadCriticalResources();
    }
    
    reduceAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            .mobile-performance-mode * {
                animation-duration: 0.2s !important;
                transition-duration: 0.2s !important;
            }
            
            .ml-glow-effect::after,
            .shimmer-effect {
                animation: none !important;
            }
        `;
        document.head.appendChild(style);
        document.body.classList.add('mobile-performance-mode');
    }
    
    setupLazyLoading() {
        // Lazy loading para seções não visíveis
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('section-visible');
                        this.enhanceVisibleSection(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            document.querySelectorAll('.demo-section').forEach(section => {
                observer.observe(section);
            });
        }
    }
    
    enhanceVisibleSection(section) {
        // Melhorar seção quando fica visível
        section.style.transition = 'all 0.3s ease';
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
    }
    
    optimizeImages() {
        // Otimizar imagens para mobile
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (this.isMobile) {
                img.loading = 'lazy';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
            }
        });
    }
    
    preloadCriticalResources() {
        // Preload recursos críticos para mobile
        const criticalCSS = '/static/css/ml-demo-mobile-responsive.css';
        
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = criticalCSS;
        link.as = 'style';
        document.head.appendChild(link);
    }
    
    // =====================================
    // 🎯 UTILITIES
    // =====================================
    
    isMapRelated(element) {
        if (!element) return false;
        
        const mapKeywords = ['map', 'deck', 'leaflet', 'canvas', 'webgl'];
        const className = element.className || '';
        const id = element.id || '';
        
        return mapKeywords.some(keyword => 
            className.includes(keyword) || id.includes(keyword)
        ) || element.tagName.toLowerCase() === 'canvas';
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `mobile-notification ${type}`;
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                left: 10px;
                right: 10px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(226, 232, 240, 0.6);
                border-radius: 8px;
                padding: 1rem;
                z-index: 1000;
                text-align: center;
                font-size: 0.875rem;
                color: #1e293b;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            ">
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, duration);
    }
    
    toggleMobileMenu() {
        // Toggle do menu mobile (se implementado)
        console.log('📱 Toggle menu mobile');
    }
    
    // =====================================
    // 📊 MÉTRICAS MOBILE
    // =====================================
    
    getMobileMetrics() {
        return {
            device: this.getDeviceType(),
            viewport: this.deviceInfo.viewport,
            isTouch: this.isTouch,
            pixelRatio: this.deviceInfo.pixelRatio,
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
            performance: {
                domElements: document.querySelectorAll('*').length,
                memoryUsage: this.getMemoryUsage()
            }
        };
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            };
        }
        return null;
    }
}

// =====================================
// 🚀 AUTO-INICIALIZAÇÃO
// =====================================

// Inicializar automaticamente
function initializeMobileEnhancer() {
    if (window.mlDemoMobileEnhancer) {
        console.log('📱 Mobile enhancer já ativo');
        return;
    }
    
    window.mlDemoMobileEnhancer = new MLDemoMobileEnhancer();
    
    // Log de inicialização
    const metrics = window.mlDemoMobileEnhancer.getMobileMetrics();
    console.log('📱 Mobile Enhancer ativo:', metrics);
}

// Aguardar DOM e UI enhancer principal
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeMobileEnhancer, 1500);
    });
} else {
    setTimeout(initializeMobileEnhancer, 1500);
}

// Exportar para uso global
window.MLDemoMobileEnhancer = MLDemoMobileEnhancer;
window.initializeMobileEnhancer = initializeMobileEnhancer;

console.log('📱 ML Demo Mobile Enhancer carregado!');
