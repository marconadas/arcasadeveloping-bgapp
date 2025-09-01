/**
 * BGAPP Wind Animation - Configurações de Performance Otimizadas
 * Resolve problemas de setTimeout e melhora responsividade geral
 */

"use strict";

// ===== CONFIGURAÇÕES DE PERFORMANCE =====
window.BGAPPWindPerformanceConfig = {
  
  // Configurações de frame rate
  frameRate: {
    target: 30, // FPS alvo
    maxDelta: 100, // Máximo delta time em ms
    adaptiveSkipping: true, // Ativar skip de frames adaptativos
    maxSkips: 3 // Máximo de frames consecutivos para pular
  },
  
  // Configurações de partículas
  particles: {
    // Número de partículas baseado no tamanho da tela
    counts: {
      mobile: 800,   // < 768px
      tablet: 1200,  // 768-1024px  
      desktop: 2000, // > 1024px
      auto: true     // Ajuste automático baseado na performance
    },
    
    // Performance adaptativa
    adaptive: {
      enabled: true,
      fpsThreshold: 15, // Reduzir partículas se FPS < 15
      reductionFactor: 0.8, // Reduzir 20% das partículas
      recoveryFps: 25 // Recuperar partículas se FPS > 25
    }
  },
  
  // Configurações de renderização
  rendering: {
    useOffscreenCanvas: true, // Usar OffscreenCanvas se disponível
    enableAntialiasing: false, // Desativar antialiasing para melhor performance
    compositeOperation: 'source-over', // Operação de composite otimizada
    clearMethod: 'fillRect', // Método de limpeza do canvas
    batchDrawing: true // Agrupar operações de desenho
  },
  
  // Configurações de timers
  timers: {
    useRAF: true, // Usar requestAnimationFrame sempre que possível
    fallbackTimeout: 16, // Timeout fallback (60 FPS)
    debounceDelay: 50, // Delay para debounce de eventos
    throttleInterval: 100 // Intervalo para throttling
  },
  
  // Configurações de debug
  debug: {
    enabled: false, // Desativar debug por padrão
    logInterval: 30000, // Intervalo de log de performance
    showFPS: true, // Mostrar FPS
    showParticleCount: true, // Mostrar número de partículas
    visualDebug: false // Debug visual (partículas vermelhas)
  },
  
  // Configurações de cache
  cache: {
    enabled: true,
    maxSize: 50, // Máximo de entradas no cache
    ttl: 300000, // TTL do cache em ms (5 minutos)
    preload: true // Pré-carregar dados próximos
  },
  
  // Configurações específicas para mobile
  mobile: {
    autoDetect: true,
    reducedEffects: true, // Reduzir efeitos visuais
    lowerFrameRate: 20, // Frame rate reduzido
    simplifiedShaders: true, // Shaders simplificados
    touchOptimized: true // Otimizações para touch
  }
};

// ===== UTILITÁRIOS DE PERFORMANCE =====
window.BGAPPWindPerformanceUtils = {
  
  // Detector de capacidades do dispositivo
  detectCapabilities: function() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    return {
      webgl: !!gl,
      offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      requestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
      performance: typeof performance !== 'undefined',
      devicePixelRatio: window.devicePixelRatio || 1,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isLowPowerMode: navigator.getBattery ? false : null // Detectar se possível
    };
  },
  
  // Calculador de número otimizado de partículas
  calculateOptimalParticleCount: function(width, height, capabilities) {
    const config = window.BGAPPWindPerformanceConfig;
    const area = width * height;
    const baseCount = area / 1000; // 1 partícula por 1000 pixels
    
    let multiplier = 1;
    
    if (capabilities.isMobile) {
      multiplier = 0.5;
    } else if (capabilities.webgl) {
      multiplier = 1.5;
    }
    
    if (capabilities.devicePixelRatio > 2) {
      multiplier *= 0.8; // Reduzir em telas de alta densidade
    }
    
    const count = Math.round(baseCount * multiplier);
    
    // Aplicar limites baseados na configuração
    if (capabilities.isMobile) {
      return Math.min(count, config.particles.counts.mobile);
    } else if (width < 1024) {
      return Math.min(count, config.particles.counts.tablet);
    } else {
      return Math.min(count, config.particles.counts.desktop);
    }
  },
  
  // Monitor de performance adaptativo
  createPerformanceMonitor: function(callback) {
    let frameCount = 0;
    let lastTime = performance.now();
    let fpsHistory = [];
    const maxHistory = 10;
    
    return function() {
      frameCount++;
      const now = performance.now();
      const delta = now - lastTime;
      
      if (delta >= 1000) { // A cada segundo
        const fps = (frameCount * 1000) / delta;
        fpsHistory.push(fps);
        
        if (fpsHistory.length > maxHistory) {
          fpsHistory.shift();
        }
        
        const avgFps = fpsHistory.reduce((a, b) => a + b) / fpsHistory.length;
        
        if (callback) {
          callback({
            currentFps: fps,
            averageFps: avgFps,
            frameCount: frameCount,
            timestamp: now
          });
        }
        
        frameCount = 0;
        lastTime = now;
      }
    };
  },
  
  // Throttle function otimizada
  throttle: function(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Debounce function otimizada
  debounce: function(func, delay) {
    let timeoutId;
    return function() {
      const args = arguments;
      const context = this;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(context, args), delay);
    };
  }
};

// ===== APLICAR CONFIGURAÇÕES AUTOMÁTICAS =====
(function initializePerformanceOptimizations() {
  const capabilities = window.BGAPPWindPerformanceUtils.detectCapabilities();
  const config = window.BGAPPWindPerformanceConfig;
  
  console.log("BGAPP Wind Performance - Capacidades detectadas:", capabilities);
  
  // Ajustar configurações baseado nas capacidades
  if (capabilities.isMobile) {
    config.frameRate.target = config.mobile.lowerFrameRate;
    config.rendering.enableAntialiasing = false;
    config.debug.enabled = false;
  }
  
  if (!capabilities.requestAnimationFrame) {
    config.timers.useRAF = false;
    console.warn("BGAPP Wind Performance - requestAnimationFrame não disponível, usando fallback");
  }
  
  if (!capabilities.offscreenCanvas) {
    config.rendering.useOffscreenCanvas = false;
  }
  
  console.log("BGAPP Wind Performance - Configurações aplicadas:", config);
})();

console.log("BGAPP Wind Performance Config - Sistema carregado! ⚡");
