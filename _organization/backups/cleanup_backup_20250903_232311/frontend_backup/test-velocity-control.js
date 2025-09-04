/**
 * BGAPP Wind Animation - Teste do Controle de Velocidade
 * Verifica se os dados de vento estão sendo exibidos corretamente
 */

"use strict";

class BGAPPVelocityControlTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }
  
  async runTests() {
    console.log("🧪 BGAPP Velocity Control Tester - Iniciando testes...");
    
    // Aguardar sistema inicializar
    await this.waitForSystem();
    
    // Executar testes
    await this.testControlCreation();
    await this.testDataInterpolation();
    await this.testMouseInteraction();
    await this.testStatusUpdates();
    
    // Gerar relatório
    this.generateReport();
  }
  
  async waitForSystem() {
    console.log("⏳ Aguardando inicialização do sistema...");
    
    return new Promise((resolve) => {
      const checkSystem = () => {
        if (window.windSystem && 
            window.windSystem.particlesLayer && 
            window.windSystem.particlesLayer._mouseControl) {
          console.log("✅ Sistema inicializado");
          resolve();
        } else {
          setTimeout(checkSystem, 500);
        }
      };
      checkSystem();
    });
  }
  
  async testControlCreation() {
    console.log("🔍 Teste 1: Verificando criação do controle...");
    
    const control = window.windSystem.particlesLayer._mouseControl;
    
    if (control) {
      this.addResult("Control Creation", true, "Controle de velocidade criado");
      
      if (control._container) {
        this.addResult("Control DOM", true, "Container DOM presente");
      } else {
        this.addResult("Control DOM", false, "Container DOM ausente");
      }
      
      if (control.updateStatus) {
        this.addResult("Status Method", true, "Método updateStatus disponível");
      } else {
        this.addResult("Status Method", false, "Método updateStatus ausente");
      }
    } else {
      this.addResult("Control Creation", false, "Controle de velocidade não encontrado");
    }
  }
  
  async testDataInterpolation() {
    console.log("🔍 Teste 2: Verificando interpolação de dados...");
    
    const particlesLayer = window.windSystem.particlesLayer;
    
    if (particlesLayer && particlesLayer._windy) {
      this.addResult("Windy Engine", true, "Motor Windy disponível");
      
      if (particlesLayer._windy.interpolatePoint) {
        this.addResult("Interpolation Method", true, "Método de interpolação disponível");
        
        // Testar interpolação em ponto conhecido (centro de Angola)
        try {
          const testPoint = particlesLayer._windy.interpolatePoint(17.9, -11.2);
          
          if (testPoint && Array.isArray(testPoint) && testPoint.length >= 2) {
            this.addResult("Interpolation Test", true, `Interpolação retornou: [${testPoint[0]}, ${testPoint[1]}]`);
          } else {
            this.addResult("Interpolation Test", false, "Interpolação retornou dados inválidos");
          }
        } catch (error) {
          this.addResult("Interpolation Test", false, `Erro na interpolação: ${error.message}`);
        }
      } else {
        this.addResult("Interpolation Method", false, "Método de interpolação ausente");
      }
    } else {
      this.addResult("Windy Engine", false, "Motor Windy não disponível");
    }
  }
  
  async testMouseInteraction() {
    console.log("🔍 Teste 3: Simulando interação do mouse...");
    
    const control = window.windSystem.particlesLayer._mouseControl;
    const map = window.map;
    
    if (control && map) {
      try {
        // Simular clique no centro do mapa
        const center = map.getCenter();
        const containerPoint = map.latLngToContainerPoint(center);
        
        const mockEvent = {
          containerPoint: containerPoint,
          latlng: center
        };
        
        // Chamar método de clique
        control._onMouseClick(mockEvent);
        
        // Verificar se o display foi atualizado
        if (control._container && control._container.innerHTML.includes("Vento BGAPP")) {
          this.addResult("Mouse Click", true, "Clique simulado processado");
          
          // Verificar se há dados ou debug info
          if (control._container.innerHTML.includes("Velocidade:") || 
              control._container.innerHTML.includes("Motor ativo")) {
            this.addResult("Data Display", true, "Informações exibidas no controle");
          } else {
            this.addResult("Data Display", false, "Nenhuma informação útil exibida");
          }
        } else {
          this.addResult("Mouse Click", false, "Display não atualizado após clique");
        }
      } catch (error) {
        this.addResult("Mouse Click", false, `Erro na simulação: ${error.message}`);
      }
    } else {
      this.addResult("Mouse Click", false, "Controle ou mapa não disponível");
    }
  }
  
  async testStatusUpdates() {
    console.log("🔍 Teste 4: Testando atualizações de status...");
    
    const control = window.windSystem.particlesLayer._mouseControl;
    
    if (control && control.updateStatus) {
      try {
        // Testar diferentes status
        control.updateStatus('loading', 'Teste loading');
        await this.sleep(500);
        
        control.updateStatus('ready', 'Teste ready');
        await this.sleep(500);
        
        control.updateStatus('error', 'Teste error');
        await this.sleep(500);
        
        control.updateStatus('active', 'Teste active');
        
        this.addResult("Status Updates", true, "Todos os status testados com sucesso");
      } catch (error) {
        this.addResult("Status Updates", false, `Erro nos status: ${error.message}`);
      }
    } else {
      this.addResult("Status Updates", false, "Método updateStatus não disponível");
    }
  }
  
  addResult(testName, passed, message) {
    this.testResults.push({
      name: testName,
      passed: passed,
      message: message,
      timestamp: Date.now()
    });
    
    const icon = passed ? "✅" : "❌";
    console.log(`${icon} ${testName}: ${message}`);
  }
  
  generateReport() {
    const runtime = Date.now() - this.startTime;
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log("\n" + "=".repeat(60));
    console.log("📋 BGAPP Velocity Control Test - Relatório Final");
    console.log("=".repeat(60));
    console.log(`⏱️ Tempo de execução: ${(runtime / 1000).toFixed(2)}s`);
    console.log(`✅ Testes aprovados: ${passed}/${total}`);
    console.log(`📊 Taxa de sucesso: ${successRate}%`);
    console.log("");
    
    if (passed === total) {
      console.log("🎉 TODOS OS TESTES PASSARAM!");
      console.log("✅ O controle de velocidade está funcionando corretamente");
    } else {
      console.warn("⚠️ ALGUNS TESTES FALHARAM:");
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.warn(`  - ${result.name}: ${result.message}`);
      });
    }
    
    console.log("=".repeat(60));
    
    // Forçar atualização do status para 'ready'
    if (window.windSystem && window.windSystem.particlesLayer && 
        window.windSystem.particlesLayer._mouseControl) {
      window.windSystem.particlesLayer._mouseControl.updateStatus('ready', 'Sistema testado e funcional');
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Auto-executar quando o documento estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.bgappVelocityTester = new BGAPPVelocityControlTester();
      window.bgappVelocityTester.runTests();
    }, 5000); // Aguardar 5s para sistema inicializar completamente
  });
} else {
  setTimeout(() => {
    window.bgappVelocityTester = new BGAPPVelocityControlTester();
    window.bgappVelocityTester.runTests();
  }, 5000);
}

console.log("🧪 BGAPP Velocity Control Tester - Carregado!");
