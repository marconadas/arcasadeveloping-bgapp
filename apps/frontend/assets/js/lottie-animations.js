/**
 * BGAPP Lottie Animation System
 * Sistema de animações Lottie para ícones e indicadores visuais
 * 
 * @author BGAPP Development Team
 * @version 1.0.0
 * @date 2025-01-09
 */

"use strict";

/**
 * Gerenciador de animações Lottie para BGAPP
 */
class BGAPPLottieManager {
    constructor(options = {}) {
        this.options = {
            // Configurações gerais
            autoplay: options.autoplay !== false,
            loop: options.loop !== false,
            speed: options.speed || 1,
            
            // Configurações de performance
            renderer: options.renderer || 'svg', // svg, canvas, html
            quality: options.quality || 'high', // low, medium, high
            
            // Configurações de cache
            preloadAnimations: options.preloadAnimations !== false,
            cacheAnimations: options.cacheAnimations !== false,
            
            ...options
        };
        
        this.animations = new Map();
        this.preloadedAnimations = new Map();
        this.activeAnimations = new Set();
        
        // Biblioteca de animações predefinidas
        this.animationLibrary = {
            loading: {
                name: 'loading-ocean',
                description: 'Animação de carregamento com tema oceânico',
                data: this._generateLoadingAnimation(),
                loop: true,
                autoplay: true
            },
            wind: {
                name: 'wind-particles',
                description: 'Partículas de vento animadas',
                data: this._generateWindAnimation(),
                loop: true,
                autoplay: true
            },
            waves: {
                name: 'ocean-waves',
                description: 'Ondas do oceano animadas',
                data: this._generateWavesAnimation(),
                loop: true,
                autoplay: true
            },
            fish: {
                name: 'fish-swimming',
                description: 'Peixes nadando',
                data: this._generateFishAnimation(),
                loop: true,
                autoplay: true
            },
            boat: {
                name: 'boat-sailing',
                description: 'Barco navegando',
                data: this._generateBoatAnimation(),
                loop: true,
                autoplay: true
            },
            compass: {
                name: 'compass-spinning',
                description: 'Bússola girando',
                data: this._generateCompassAnimation(),
                loop: false,
                autoplay: false
            },
            alert: {
                name: 'weather-alert',
                description: 'Alerta meteorológico',
                data: this._generateAlertAnimation(),
                loop: true,
                autoplay: true
            },
            success: {
                name: 'success-checkmark',
                description: 'Marca de sucesso',
                data: this._generateSuccessAnimation(),
                loop: false,
                autoplay: true
            }
        };
        
        console.log("BGAPP Lottie Manager - Inicializado com", Object.keys(this.animationLibrary).length, "animações");
        
        this._initialize();
    }

    /**
     * Inicializar o sistema
     */
    async _initialize() {
        try {
            // Verificar se lottie-web está disponível
            if (typeof lottie === 'undefined') {
                console.warn("BGAPP Lottie - lottie-web não encontrado, carregando via CDN...");
                await this._loadLottieLibrary();
            }
            
            // Pré-carregar animações se habilitado
            if (this.options.preloadAnimations) {
                await this._preloadAnimations();
            }
            
            console.log("BGAPP Lottie Manager - Inicialização completa");
            
        } catch (error) {
            console.error("BGAPP Lottie Manager - Erro na inicialização:", error);
        }
    }

    /**
     * Carregar biblioteca Lottie via CDN
     */
    async _loadLottieLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Pré-carregar animações
     */
    async _preloadAnimations() {
        console.log("BGAPP Lottie - Pré-carregando animações...");
        
        const preloadPromises = Object.entries(this.animationLibrary).map(async ([key, config]) => {
            try {
                this.preloadedAnimations.set(key, config.data);
                console.log(`BGAPP Lottie - Animação ${key} pré-carregada`);
            } catch (error) {
                console.warn(`BGAPP Lottie - Erro ao pré-carregar ${key}:`, error);
            }
        });
        
        await Promise.allSettled(preloadPromises);
        console.log(`BGAPP Lottie - ${this.preloadedAnimations.size} animações pré-carregadas`);
    }

    /**
     * Criar animação em um container
     */
    createAnimation(containerId, animationType, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`BGAPP Lottie - Container ${containerId} não encontrado`);
            return null;
        }

        const config = this.animationLibrary[animationType];
        if (!config) {
            console.error(`BGAPP Lottie - Tipo de animação ${animationType} não encontrado`);
            return null;
        }

        const animationOptions = {
            container: container,
            renderer: options.renderer || this.options.renderer,
            loop: options.loop !== undefined ? options.loop : config.loop,
            autoplay: options.autoplay !== undefined ? options.autoplay : config.autoplay,
            animationData: this.preloadedAnimations.get(animationType) || config.data,
            ...options
        };

        try {
            const animation = lottie.loadAnimation(animationOptions);
            
            // Configurar velocidade se especificada
            if (options.speed || this.options.speed !== 1) {
                animation.setSpeed(options.speed || this.options.speed);
            }
            
            // Armazenar referência
            const animationId = `${containerId}_${animationType}_${Date.now()}`;
            this.animations.set(animationId, {
                animation: animation,
                container: container,
                type: animationType,
                config: config,
                options: animationOptions
            });
            
            this.activeAnimations.add(animationId);
            
            // Setup de eventos
            this._setupAnimationEvents(animationId, animation);
            
            console.log(`BGAPP Lottie - Animação ${animationType} criada no container ${containerId}`);
            return animationId;
            
        } catch (error) {
            console.error(`BGAPP Lottie - Erro ao criar animação ${animationType}:`, error);
            return null;
        }
    }

    /**
     * Criar animação flutuante
     */
    createFloatingAnimation(animationType, position = {}, options = {}) {
        const containerId = `bgapp-lottie-floating-${Date.now()}`;
        
        // Criar container flutuante
        const container = document.createElement('div');
        container.id = containerId;
        container.className = 'bgapp-lottie-floating';
        
        // Posicionamento
        const defaultPosition = {
            top: '20px',
            right: '20px',
            width: '60px',
            height: '60px'
        };
        
        const finalPosition = { ...defaultPosition, ...position };
        
        container.style.cssText = `
            position: fixed;
            top: ${finalPosition.top};
            right: ${finalPosition.right};
            width: ${finalPosition.width};
            height: ${finalPosition.height};
            z-index: 1001;
            pointer-events: ${options.interactive ? 'auto' : 'none'};
            opacity: ${options.opacity || 1};
        `;
        
        document.body.appendChild(container);
        
        // Criar animação
        const animationId = this.createAnimation(containerId, animationType, options);
        
        if (animationId) {
            // Adicionar método para remover
            const animationData = this.animations.get(animationId);
            animationData.isFloating = true;
            animationData.remove = () => {
                container.remove();
                this.removeAnimation(animationId);
            };
            
            // Auto-remover após tempo especificado
            if (options.autoRemove && options.duration) {
                setTimeout(() => {
                    animationData.remove();
                }, options.duration);
            }
        }
        
        return animationId;
    }

    /**
     * Configurar eventos da animação
     */
    _setupAnimationEvents(animationId, animation) {
        animation.addEventListener('complete', () => {
            console.log(`BGAPP Lottie - Animação ${animationId} completada`);
            this._onAnimationComplete(animationId);
        });
        
        animation.addEventListener('loopComplete', () => {
            console.log(`BGAPP Lottie - Loop da animação ${animationId} completado`);
        });
        
        animation.addEventListener('error', (error) => {
            console.error(`BGAPP Lottie - Erro na animação ${animationId}:`, error);
        });
    }

    /**
     * Callback quando animação é completada
     */
    _onAnimationComplete(animationId) {
        const animationData = this.animations.get(animationId);
        if (animationData && !animationData.config.loop) {
            // Se não é loop, remover da lista de ativas
            this.activeAnimations.delete(animationId);
        }
    }

    /**
     * Controlar animação
     */
    playAnimation(animationId) {
        const animationData = this.animations.get(animationId);
        if (animationData) {
            animationData.animation.play();
            this.activeAnimations.add(animationId);
            console.log(`BGAPP Lottie - Animação ${animationId} iniciada`);
        }
    }

    pauseAnimation(animationId) {
        const animationData = this.animations.get(animationId);
        if (animationData) {
            animationData.animation.pause();
            console.log(`BGAPP Lottie - Animação ${animationId} pausada`);
        }
    }

    stopAnimation(animationId) {
        const animationData = this.animations.get(animationId);
        if (animationData) {
            animationData.animation.stop();
            this.activeAnimations.delete(animationId);
            console.log(`BGAPP Lottie - Animação ${animationId} parada`);
        }
    }

    /**
     * Remover animação
     */
    removeAnimation(animationId) {
        const animationData = this.animations.get(animationId);
        if (animationData) {
            animationData.animation.destroy();
            this.animations.delete(animationId);
            this.activeAnimations.delete(animationId);
            
            if (animationData.isFloating) {
                animationData.container.remove();
            }
            
            console.log(`BGAPP Lottie - Animação ${animationId} removida`);
        }
    }

    /**
     * Definir velocidade da animação
     */
    setAnimationSpeed(animationId, speed) {
        const animationData = this.animations.get(animationId);
        if (animationData) {
            animationData.animation.setSpeed(speed);
            console.log(`BGAPP Lottie - Velocidade da animação ${animationId} definida para ${speed}x`);
        }
    }

    /**
     * Ir para frame específico
     */
    goToFrame(animationId, frame) {
        const animationData = this.animations.get(animationId);
        if (animationData) {
            animationData.animation.goToAndStop(frame, true);
            console.log(`BGAPP Lottie - Animação ${animationId} foi para frame ${frame}`);
        }
    }

    /**
     * Obter informações da animação
     */
    getAnimationInfo(animationId) {
        const animationData = this.animations.get(animationId);
        if (!animationData) return null;
        
        return {
            id: animationId,
            type: animationData.type,
            isPlaying: animationData.animation.isPaused === false,
            currentFrame: animationData.animation.currentFrame,
            totalFrames: animationData.animation.totalFrames,
            duration: animationData.animation.getDuration(),
            speed: animationData.animation.playSpeed
        };
    }

    /**
     * Listar animações ativas
     */
    getActiveAnimations() {
        return Array.from(this.activeAnimations).map(id => this.getAnimationInfo(id));
    }

    /**
     * Pausar todas as animações
     */
    pauseAll() {
        this.activeAnimations.forEach(id => this.pauseAnimation(id));
        console.log("BGAPP Lottie - Todas as animações pausadas");
    }

    /**
     * Retomar todas as animações
     */
    resumeAll() {
        this.activeAnimations.forEach(id => this.playAnimation(id));
        console.log("BGAPP Lottie - Todas as animações retomadas");
    }

    /**
     * Remover todas as animações
     */
    removeAll() {
        const animationIds = Array.from(this.animations.keys());
        animationIds.forEach(id => this.removeAnimation(id));
        console.log("BGAPP Lottie - Todas as animações removidas");
    }

    /**
     * Gerar animação de carregamento
     */
    _generateLoadingAnimation() {
        return {
            v: "5.7.4",
            fr: 30,
            ip: 0,
            op: 60,
            w: 100,
            h: 100,
            nm: "Loading Ocean",
            layers: [
                {
                    ty: 4,
                    nm: "Circle",
                    ks: {
                        r: {
                            a: 1,
                            k: [
                                {t: 0, s: [0]},
                                {t: 60, s: [360]}
                            ]
                        },
                        p: {a: 0, k: [50, 50]},
                        s: {a: 0, k: [100, 100]}
                    },
                    shapes: [
                        {
                            ty: "el",
                            p: {a: 0, k: [0, 0]},
                            s: {a: 0, k: [40, 40]}
                        },
                        {
                            ty: "st",
                            c: {a: 0, k: [0.2, 0.6, 1, 1]},
                            w: {a: 0, k: 3}
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Gerar animação de vento
     */
    _generateWindAnimation() {
        return {
            v: "5.7.4",
            fr: 24,
            ip: 0,
            op: 48,
            w: 100,
            h: 100,
            nm: "Wind Particles",
            layers: [
                {
                    ty: 4,
                    nm: "Particle1",
                    ks: {
                        p: {
                            a: 1,
                            k: [
                                {t: 0, s: [10, 50]},
                                {t: 48, s: [90, 30]}
                            ]
                        },
                        o: {
                            a: 1,
                            k: [
                                {t: 0, s: [0]},
                                {t: 12, s: [100]},
                                {t: 36, s: [100]},
                                {t: 48, s: [0]}
                            ]
                        }
                    },
                    shapes: [
                        {
                            ty: "el",
                            p: {a: 0, k: [0, 0]},
                            s: {a: 0, k: [4, 4]}
                        },
                        {
                            ty: "fl",
                            c: {a: 0, k: [1, 1, 1, 1]}
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Gerar animação de ondas
     */
    _generateWavesAnimation() {
        return {
            v: "5.7.4",
            fr: 25,
            ip: 0,
            op: 75,
            w: 100,
            h: 50,
            nm: "Ocean Waves",
            layers: [
                {
                    ty: 4,
                    nm: "Wave",
                    ks: {
                        p: {
                            a: 1,
                            k: [
                                {t: 0, s: [0, 25]},
                                {t: 75, s: [100, 25]}
                            ]
                        }
                    },
                    shapes: [
                        {
                            ty: "sh",
                            ks: {
                                a: 1,
                                k: [
                                    {
                                        t: 0,
                                        s: [{
                                            v: [[0,0], [25,-10], [50,0], [75,10], [100,0]],
                                            c: false
                                        }]
                                    }
                                ]
                            }
                        },
                        {
                            ty: "st",
                            c: {a: 0, k: [0, 0.7, 1, 1]},
                            w: {a: 0, k: 2}
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Gerar outras animações (simplificadas)
     */
    _generateFishAnimation() {
        return this._generateSimpleAnimation("Fish Swimming", [0.2, 0.8, 1, 1]);
    }

    _generateBoatAnimation() {
        return this._generateSimpleAnimation("Boat Sailing", [0.6, 0.4, 0.2, 1]);
    }

    _generateCompassAnimation() {
        return this._generateSimpleAnimation("Compass", [0.8, 0.2, 0.2, 1]);
    }

    _generateAlertAnimation() {
        return this._generateSimpleAnimation("Alert", [1, 0.5, 0, 1]);
    }

    _generateSuccessAnimation() {
        return this._generateSimpleAnimation("Success", [0, 0.8, 0.2, 1]);
    }

    /**
     * Gerar animação simples genérica
     */
    _generateSimpleAnimation(name, color) {
        return {
            v: "5.7.4",
            fr: 30,
            ip: 0,
            op: 90,
            w: 100,
            h: 100,
            nm: name,
            layers: [
                {
                    ty: 4,
                    nm: "Shape",
                    ks: {
                        s: {
                            a: 1,
                            k: [
                                {t: 0, s: [80, 80]},
                                {t: 45, s: [120, 120]},
                                {t: 90, s: [80, 80]}
                            ]
                        },
                        p: {a: 0, k: [50, 50]}
                    },
                    shapes: [
                        {
                            ty: "el",
                            p: {a: 0, k: [0, 0]},
                            s: {a: 0, k: [30, 30]}
                        },
                        {
                            ty: "fl",
                            c: {a: 0, k: color}
                        }
                    ]
                }
            ]
        };
    }
}

/**
 * Utilitários para animações Lottie específicas do BGAPP
 */
class BGAPPLottieUtils {
    static createLoadingIndicator(containerId, options = {}) {
        const manager = new BGAPPLottieManager();
        return manager.createAnimation(containerId, 'loading', {
            loop: true,
            autoplay: true,
            ...options
        });
    }

    static createFloatingWindIndicator(options = {}) {
        const manager = new BGAPPLottieManager();
        return manager.createFloatingAnimation('wind', {
            top: '80px',
            right: '20px',
            width: '40px',
            height: '40px'
        }, {
            loop: true,
            autoplay: true,
            ...options
        });
    }

    static createSuccessNotification(duration = 3000) {
        const manager = new BGAPPLottieManager();
        return manager.createFloatingAnimation('success', {
            top: '20px',
            right: '20px',
            width: '50px',
            height: '50px'
        }, {
            loop: false,
            autoplay: true,
            autoRemove: true,
            duration: duration
        });
    }

    static createWeatherAlert() {
        const manager = new BGAPPLottieManager();
        return manager.createFloatingAnimation('alert', {
            top: '20px',
            left: '20px',
            width: '60px',
            height: '60px'
        }, {
            loop: true,
            autoplay: true,
            interactive: true
        });
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.BGAPPLottieManager = BGAPPLottieManager;
    window.BGAPPLottieUtils = BGAPPLottieUtils;
}

// Export para Node.js (testes)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BGAPPLottieManager,
        BGAPPLottieUtils
    };
}

// Export para ambiente global (testes)
if (typeof global !== 'undefined') {
    global.BGAPPLottieManager = BGAPPLottieManager;
    global.BGAPPLottieUtils = BGAPPLottieUtils;
}

console.log("BGAPP Lottie Animation System - Módulo carregado");
