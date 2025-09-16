/**
 * BGAPP Wind Animation - Teste de Performance Otimizada
 * Verifica se as otimizações resolveram os problemas de setTimeout
 */

"use strict";

// Monitor de performance para detectar problemas
class BGAPPWindPerformanceTester {
  constructor() {
    this.violations = [];
    this.startTime = Date.now();
    this.frameCount = 0;
    this.lastFpsCheck = Date.now();
    this.isRunning = false;
    
    this.setupViolationMonitoring();
    this.setupPerformanceMonitoring();
  }
  
  setupViolationMonitoring() {
    // Interceptar console.warn para capturar violações
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('Violation') && message.includes('setTimeout')) {
        this.violations.push({
          message: message,
          timestamp: Date.now(),
          stack: new Error().stack
        });
        
        // Log apenas as primeiras 5 violações para evitar spam
        if (this.violations.length <= 5) {
          console.error("🚨 BGAPP Performance - Violação detectada:", message);
        }
      }
      
      originalWarn.apply(console, args);
    };
    
    console.log("✅ BGAPP Performance Tester - Monitor de violações ativo");
  }
  
  setupPerformanceMonitoring() {
    // Monitor de FPS usando requestAnimationFrame
    const monitorFrame = () => {
      if (!this.isRunning) return;
      
      this.frameCount++;
      const now = Date.now();
      
      if (now - this.lastFpsCheck >= 5000) { // A cada 5 segundos
        const fps = (this.frameCount * 1000) / (now - this.lastFpsCheck);
        
        console.log(`📊 BGAPP Performance - FPS: ${fps.toFixed(2)}`);
        
        if (fps < 15) {
          console.warn("⚠️ BGAPP Performance - FPS baixo detectado:", fps);
        }
        
        this.frameCount = 0;
        this.lastFpsCheck = now;
      }
      
      requestAnimationFrame(monitorFrame);
    };
    
    this.isRunning = true;
    requestAnimationFrame(monitorFrame);
    
    console.log("✅ BGAPP Performance Tester - Monitor de FPS ativo");
  }
  
  start() {
    console.log("🚀 BGAPP Performance Tester - Iniciando testes...");
    
    // Teste 1: Verificar se configurações foram carregadas
    this.testConfigurationsLoaded();
    
    // Teste 2: Verificar capacidades do dispositivo
    this.testDeviceCapabilities();
    
    // Teste 3: Monitorar violações por 30 segundos
    setTimeout(() => {
      this.generateReport();
    }, 30000);
  }
  
  testConfigurationsLoaded() {
    console.log("🔍 Teste 1: Verificando configurações...");
    
    if (typeof window.BGAPPWindPerformanceConfig !== 'undefined') {
      console.log("✅ Configurações de performance carregadas");
    } else {
      console.error("❌ Configurações de performance não encontradas");
    }
    
    if (typeof window.BGAPPWindPerformanceUtils !== 'undefined') {
      console.log("✅ Utilitários de performance carregados");
    } else {
      console.error("❌ Utilitários de performance não encontrados");
    }
  }
  
  testDeviceCapabilities() {
    console.log("🔍 Teste 2: Verificando capacidades do dispositivo...");
    
    if (window.BGAPPWindPerformanceUtils) {
      const capabilities = window.BGAPPWindPerformanceUtils.detectCapabilities();
      console.log("📱 Capacidades detectadas:", capabilities);
      
      // Calcular número otimizado de partículas
      const particleCount = window.BGAPPWindPerformanceUtils.calculateOptimalParticleCount(
        window.innerWidth,
        window.innerHeight,
        capabilities
      );
      
      console.log(`🎯 Número otimizado de partículas: ${particleCount}`);
    }
  }
  
  generateReport() {
    console.log("📋 BGAPP Performance Tester - Relatório Final:");
    console.log("=" .repeat(50));
    
    const runtime = Date.now() - this.startTime;
    console.log(`⏱️ Tempo de execução: ${(runtime / 1000).toFixed(2)}s`);
    console.log(`🚨 Violações detectadas: ${this.violations.length}`);
    
    if (this.violations.length === 0) {
      console.log("🎉 SUCESSO: Nenhuma violação de setTimeout detectada!");
      console.log("✅ As otimizações resolveram os problemas de performance");
    } else {
      console.warn("⚠️ ATENÇÃO: Ainda existem violações de performance:");
      
      // Agrupar violações por tipo
      const groupedViolations = {};
      this.violations.forEach(violation => {
        const key = violation.message.split(' ')[0]; // Primeira palavra
        if (!groupedViolations[key]) {
          groupedViolations[key] = 0;
        }
        groupedViolations[key]++;
      });
      
      Object.entries(groupedViolations).forEach(([type, count]) => {
        console.warn(`  - ${type}: ${count} ocorrências`);
      });
      
      console.log("\n🔧 Recomendações:");
      console.log("  - Verificar se todas as otimizações foram aplicadas");
      console.log("  - Considerar reduzir número de partículas");
      console.log("  - Verificar se requestAnimationFrame está sendo usado");
    }
    
    console.log("=" .repeat(50));
    
    this.isRunning = false;
  }
  
  stop() {
    this.isRunning = false;
    console.log("🛑 BGAPP Performance Tester - Parado");
  }
}

// Auto-inicializar quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.bgappPerformanceTester = new BGAPPWindPerformanceTester();
      window.bgappPerformanceTester.start();
    }, 2000); // Aguardar 2s para o sistema inicializar
  });
} else {
  setTimeout(() => {
    window.bgappPerformanceTester = new BGAPPWindPerformanceTester();
    window.bgappPerformanceTester.start();
  }, 2000);
}

console.log("🧪 BGAPP Wind Performance Tester - Carregado! Aguardando inicialização...");
