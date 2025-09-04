/**
 * BGAPP GSAP Transition System
 * Sistema avançado de transições e animações usando GSAP
 * 
 * @author BGAPP Development Team
 * @version 1.0.0
 * @date 2025-01-09
 */

"use strict";

/**
 * Gerenciador de transições GSAP para BGAPP
 */
class BGAPPTransitionManager {
    constructor(options = {}) {
        this.options = {
            // Configurações gerais
            duration: options.duration || 1,
            ease: options.ease || "power2.out",
            
            // Configurações de performance
            force3D: options.force3D !== false,
            autoAlpha: options.autoAlpha !== false,
            
            // Configurações de debug
            debug: options.debug || false,
            
            ...options
        };
        
        this.timelines = new Map();
        this.activeAnimations = new Set();
        this.scrollTriggers = new Set();
        
        // Presets de animação
        this.presets = {
            fadeIn: { opacity: 1, duration: 0.8, ease: "power2.out" },
            fadeOut: { opacity: 0, duration: 0.5, ease: "power2.in" },
            slideInLeft: { x: 0, opacity: 1, duration: 1, ease: "power3.out" },
            slideInRight: { x: 0, opacity: 1, duration: 1, ease: "power3.out" },
            slideInUp: { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
            slideInDown: { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
            scaleIn: { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)" },
            scaleOut: { scale: 0, opacity: 0, duration: 0.5, ease: "back.in(1.7)" },
            bounceIn: { scale: 1, opacity: 1, duration: 1.2, ease: "bounce.out" },
            elastic: { scale: 1, rotation: 0, duration: 1.5, ease: "elastic.out(1, 0.5)" }
        };
        
        console.log("BGAPP Transition Manager - Inicializado");
        this._initialize();
    }

    /**
     * Inicializar sistema GSAP
     */
    async _initialize() {
        try {
            // Verificar se GSAP está disponível
            if (typeof gsap === 'undefined') {
                console.warn("BGAPP GSAP - GSAP não encontrado, carregando via CDN...");
                await this._loadGSAP();
            }
            
            // Registrar plugins
            this._registerPlugins();
            
            // Configurar defaults
            this._setupDefaults();
            
            // Setup de eventos
            this._setupEventListeners();
            
            console.log("BGAPP Transition Manager - Inicialização completa");
            
        } catch (error) {
            console.error("BGAPP Transition Manager - Erro na inicialização:", error);
        }
    }

    /**
     * Carregar GSAP via CDN
     */
    async _loadGSAP() {
        const scripts = [
            'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/TextPlugin.min.js'
        ];
        
        for (const src of scripts) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
    }

    /**
     * Registrar plugins GSAP
     */
    _registerPlugins() {
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
            console.log("BGAPP GSAP - ScrollTrigger registrado");
        }
        
        if (typeof TextPlugin !== 'undefined') {
            gsap.registerPlugin(TextPlugin);
            console.log("BGAPP GSAP - TextPlugin registrado");
        }
    }

    /**
     * Configurar defaults do GSAP
     */
    _setupDefaults() {
        gsap.defaults({
            duration: this.options.duration,
            ease: this.options.ease,
            force3D: this.options.force3D
        });
        
        // Configurar ScrollTrigger se disponível
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.defaults({
                toggleActions: "play none none reverse",
                scroller: "body"
            });
        }
    }

    /**
     * Setup de event listeners
     */
    _setupEventListeners() {
        // Listener para mudanças de visibilidade
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAll();
            } else {
                this.resumeAll();
            }
        });
        
        // Listener para redimensionamento
        window.addEventListener('resize', () => {
            this._refreshScrollTriggers();
        });
    }

    /**
     * Animar elemento com preset
     */
    animateWithPreset(element, presetName, customOptions = {}) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.error(`BGAPP GSAP - Preset ${presetName} não encontrado`);
            return null;
        }
        
        const options = { ...preset, ...customOptions };
        return this.animate(element, options);
    }

    /**
     * Animar elemento
     */
    animate(element, options = {}) {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) {
            console.error("BGAPP GSAP - Elemento não encontrado:", element);
            return null;
        }
        
        const animationOptions = {
            ...this.options,
            ...options
        };
        
        const animation = gsap.to(target, animationOptions);
        this.activeAnimations.add(animation);
        
        // Remover da lista quando completa
        animation.then(() => {
            this.activeAnimations.delete(animation);
        });
        
        if (this.options.debug) {
            console.log("BGAPP GSAP - Animação criada:", { element, options: animationOptions });
        }
        
        return animation;
    }

    /**
     * Animar múltiplos elementos
     */
    animateMultiple(elements, options = {}, stagger = 0.1) {
        const targets = typeof elements === 'string' ? 
            document.querySelectorAll(elements) : elements;
        
        if (!targets || targets.length === 0) {
            console.error("BGAPP GSAP - Elementos não encontrados:", elements);
            return null;
        }
        
        const animationOptions = {
            ...this.options,
            ...options,
            stagger: stagger
        };
        
        const animation = gsap.to(targets, animationOptions);
        this.activeAnimations.add(animation);
        
        animation.then(() => {
            this.activeAnimations.delete(animation);
        });
        
        return animation;
    }

    /**
     * Criar timeline
     */
    createTimeline(name, options = {}) {
        const timeline = gsap.timeline({
            ...this.options,
            ...options
        });
        
        this.timelines.set(name, timeline);
        
        if (this.options.debug) {
            console.log(`BGAPP GSAP - Timeline ${name} criada`);
        }
        
        return timeline;
    }

    /**
     * Obter timeline
     */
    getTimeline(name) {
        return this.timelines.get(name);
    }

    /**
     * Animar entrada de painel
     */
    animatePanelIn(panel, direction = 'right', options = {}) {
        const target = typeof panel === 'string' ? document.querySelector(panel) : panel;
        if (!target) return null;
        
        // Configuração inicial baseada na direção
        const initialState = {
            right: { x: '100%', opacity: 0 },
            left: { x: '-100%', opacity: 0 },
            up: { y: '-100%', opacity: 0 },
            down: { y: '100%', opacity: 0 }
        };
        
        // Definir estado inicial
        gsap.set(target, initialState[direction] || initialState.right);
        
        // Animar para posição final
        return gsap.to(target, {
            x: 0,
            y: 0,
            opacity: 1,
            duration: options.duration || 0.8,
            ease: options.ease || "power3.out",
            ...options
        });
    }

    /**
     * Animar saída de painel
     */
    animatePanelOut(panel, direction = 'right', options = {}) {
        const target = typeof panel === 'string' ? document.querySelector(panel) : panel;
        if (!target) return null;
        
        const exitState = {
            right: { x: '100%', opacity: 0 },
            left: { x: '-100%', opacity: 0 },
            up: { y: '-100%', opacity: 0 },
            down: { y: '100%', opacity: 0 }
        };
        
        return gsap.to(target, {
            ...exitState[direction] || exitState.right,
            duration: options.duration || 0.5,
            ease: options.ease || "power2.in",
            ...options
        });
    }

    /**
     * Animar transição entre mapas
     */
    animateMapTransition(oldMap, newMap, options = {}) {
        const timeline = gsap.timeline();
        
        // Fade out do mapa antigo
        timeline.to(oldMap, {
            opacity: 0,
            duration: options.fadeOutDuration || 0.5,
            ease: "power2.in"
        });
        
        // Fade in do novo mapa
        timeline.to(newMap, {
            opacity: 1,
            duration: options.fadeInDuration || 0.8,
            ease: "power2.out"
        }, "-=0.2");
        
        return timeline;
    }

    /**
     * Animar dados em tempo real
     */
    animateDataUpdate(container, newData, options = {}) {
        const timeline = gsap.timeline();
        
        // Pulse effect para indicar atualização
        timeline.to(container, {
            scale: 1.05,
            duration: 0.2,
            ease: "power2.out"
        });
        
        timeline.to(container, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
        });
        
        // Callback para atualizar dados
        if (options.onUpdate) {
            timeline.call(options.onUpdate, [newData]);
        }
        
        return timeline;
    }

    /**
     * Animar loading de dados
     */
    animateLoading(element, options = {}) {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return null;
        
        // Criar indicador de loading se não existir
        let loadingIndicator = target.querySelector('.bgapp-loading-indicator');
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'bgapp-loading-indicator';
            loadingIndicator.innerHTML = '<div class="spinner"></div>';
            loadingIndicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000;
            `;
            target.appendChild(loadingIndicator);
            
            // Adicionar CSS para spinner
            if (!document.querySelector('#bgapp-spinner-css')) {
                const style = document.createElement('style');
                style.id = 'bgapp-spinner-css';
                style.textContent = `
                    .bgapp-loading-indicator .spinner {
                        width: 30px;
                        height: 30px;
                        border: 3px solid rgba(255,255,255,0.3);
                        border-radius: 50%;
                        border-top-color: #007acc;
                        animation: spin 1s ease-in-out infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Animar entrada do loading
        gsap.fromTo(loadingIndicator, 
            { opacity: 0, scale: 0.5 },
            { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.7)" }
        );
        
        return {
            hide: () => {
                gsap.to(loadingIndicator, {
                    opacity: 0,
                    scale: 0.5,
                    duration: 0.3,
                    ease: "back.in(1.7)",
                    onComplete: () => {
                        loadingIndicator.remove();
                    }
                });
            }
        };
    }

    /**
     * Animar notificação
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `bgapp-notification bgapp-notification-${type}`;
        notification.textContent = message;
        
        // Estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this._getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        const timeline = gsap.timeline();
        
        timeline.fromTo(notification,
            { x: 300, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
        );
        
        // Auto-remover
        timeline.to(notification, {
            x: 300,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            delay: duration / 1000,
            onComplete: () => notification.remove()
        });
        
        return timeline;
    }

    /**
     * Obter cor da notificação
     */
    _getNotificationColor(type) {
        const colors = {
            info: '#007acc',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545'
        };
        return colors[type] || colors.info;
    }

    /**
     * Animar texto typewriter
     */
    typewriterText(element, text, options = {}) {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return null;
        
        return gsap.to(target, {
            duration: options.duration || 2,
            text: text,
            ease: "none",
            ...options
        });
    }

    /**
     * Animar contadores
     */
    animateCounter(element, endValue, options = {}) {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return null;
        
        const startValue = options.startValue || 0;
        const obj = { value: startValue };
        
        // Remover propriedades que podem causar problemas
        const cleanOptions = { ...options };
        delete cleanOptions.formatter;
        delete cleanOptions.startValue;
        
        return gsap.to(obj, {
            value: endValue,
            duration: cleanOptions.duration || 2,
            ease: cleanOptions.ease || "power2.out",
            onUpdate: () => {
                const formattedValue = options.formatter ? 
                    options.formatter(obj.value) : 
                    Math.round(obj.value).toLocaleString();
                target.textContent = formattedValue;
            },
            ...cleanOptions
        });
    }

    /**
     * Configurar animações de scroll
     */
    setupScrollAnimations() {
        if (typeof ScrollTrigger === 'undefined') {
            console.warn("BGAPP GSAP - ScrollTrigger não disponível");
            return;
        }
        
        // Animar elementos ao entrar na viewport
        const animateOnScroll = document.querySelectorAll('[data-animate-on-scroll]');
        
        animateOnScroll.forEach(element => {
            const animationType = element.dataset.animateOnScroll || 'fadeIn';
            const preset = this.presets[animationType];
            
            if (preset) {
                // Estado inicial
                gsap.set(element, {
                    opacity: 0,
                    y: animationType.includes('Up') ? 50 : 0,
                    x: animationType.includes('Left') ? -50 : animationType.includes('Right') ? 50 : 0,
                    scale: animationType.includes('scale') ? 0.8 : 1
                });
                
                // Animação com ScrollTrigger
                const trigger = ScrollTrigger.create({
                    trigger: element,
                    start: "top 80%",
                    animation: gsap.to(element, preset),
                    once: true
                });
                
                this.scrollTriggers.add(trigger);
            }
        });
        
        console.log(`BGAPP GSAP - ${animateOnScroll.length} animações de scroll configuradas`);
    }

    /**
     * Refresh ScrollTriggers
     */
    _refreshScrollTriggers() {
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    }

    /**
     * Pausar todas as animações
     */
    pauseAll() {
        this.activeAnimations.forEach(animation => {
            animation.pause();
        });
        
        this.timelines.forEach(timeline => {
            timeline.pause();
        });
        
        console.log("BGAPP GSAP - Todas as animações pausadas");
    }

    /**
     * Retomar todas as animações
     */
    resumeAll() {
        this.activeAnimations.forEach(animation => {
            animation.resume();
        });
        
        this.timelines.forEach(timeline => {
            timeline.resume();
        });
        
        console.log("BGAPP GSAP - Todas as animações retomadas");
    }

    /**
     * Matar todas as animações
     */
    killAll() {
        this.activeAnimations.forEach(animation => {
            animation.kill();
        });
        
        this.timelines.forEach(timeline => {
            timeline.kill();
        });
        
        this.scrollTriggers.forEach(trigger => {
            trigger.kill();
        });
        
        this.activeAnimations.clear();
        this.timelines.clear();
        this.scrollTriggers.clear();
        
        console.log("BGAPP GSAP - Todas as animações removidas");
    }

    /**
     * Obter estatísticas
     */
    getStats() {
        return {
            activeAnimations: this.activeAnimations.size,
            timelines: this.timelines.size,
            scrollTriggers: this.scrollTriggers.size,
            presets: Object.keys(this.presets).length
        };
    }
}

/**
 * Utilitários para transições específicas do BGAPP
 */
class BGAPPTransitionUtils {
    static fadeInMapLayers(layers, stagger = 0.2) {
        const manager = new BGAPPTransitionManager();
        return manager.animateMultiple(layers, {
            opacity: 1,
            duration: 1,
            ease: "power2.out"
        }, stagger);
    }

    static slideInPanel(panelId, direction = 'right') {
        const manager = new BGAPPTransitionManager();
        return manager.animatePanelIn(`#${panelId}`, direction);
    }

    static bounceInIcon(iconElement) {
        const manager = new BGAPPTransitionManager();
        return manager.animateWithPreset(iconElement, 'bounceIn');
    }

    static showSuccessMessage(message) {
        const manager = new BGAPPTransitionManager();
        return manager.showNotification(message, 'success');
    }

    static animateDataCounter(elementId, endValue, formatter) {
        const manager = new BGAPPTransitionManager();
        return manager.animateCounter(`#${elementId}`, endValue, {
            duration: 2,
            formatter: formatter
        });
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.BGAPPTransitionManager = BGAPPTransitionManager;
    window.BGAPPTransitionUtils = BGAPPTransitionUtils;
}

// Export para Node.js (testes)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BGAPPTransitionManager,
        BGAPPTransitionUtils
    };
}

// Export para ambiente global (testes)
if (typeof global !== 'undefined') {
    global.BGAPPTransitionManager = BGAPPTransitionManager;
    global.BGAPPTransitionUtils = BGAPPTransitionUtils;
}

console.log("BGAPP GSAP Transition System - Módulo carregado");
