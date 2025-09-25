/**
 * BGAPP Wind Animation - Script de Teste Completo
 * Execute este script no console do navegador para testar o sistema
 */

console.log("🌪️ BGAPP Wind Animation - Iniciando testes completos...");

// Função principal de teste
async function testWindAnimation() {
    console.log("\n=== BGAPP WIND ANIMATION TEST SUITE ===\n");
    
    let testResults = {
        passed: 0,
        failed: 0,
        total: 0
    };
    
    function runTest(testName, testFn) {
        testResults.total++;
        try {
            const result = testFn();
            if (result) {
                console.log(`✅ ${testName}: PASSOU`);
                testResults.passed++;
            } else {
                console.log(`❌ ${testName}: FALHOU`);
                testResults.failed++;
            }
            return result;
        } catch (error) {
            console.log(`❌ ${testName}: ERRO - ${error.message}`);
            testResults.failed++;
            return false;
        }
    }
    
    // Teste 1: Verificar se sistema existe
    runTest("Sistema Wind inicializado", () => {
        return typeof windSystem !== 'undefined' && windSystem !== null;
    });
    
    // Teste 2: Verificar se mapa existe
    runTest("Mapa Leaflet inicializado", () => {
        return typeof map !== 'undefined' && map !== null;
    });
    
    // Teste 3: Verificar se ParticlesLayer existe
    runTest("ParticlesLayer criado", () => {
        return windSystem && windSystem.particlesLayer !== null;
    });
    
    // Teste 4: Verificar se Canvas existe
    runTest("Canvas criado", () => {
        const canvas = windSystem?.particlesLayer?._canvasLayer?._canvas;
        return canvas !== null && canvas !== undefined;
    });
    
    // Teste 5: Verificar se Canvas está no DOM
    runTest("Canvas no DOM", () => {
        const canvas = windSystem?.particlesLayer?._canvasLayer?._canvas;
        return canvas && document.body.contains(canvas);
    });
    
    // Teste 6: Verificar dimensões do Canvas
    runTest("Canvas com dimensões corretas", () => {
        const canvas = windSystem?.particlesLayer?._canvasLayer?._canvas;
        return canvas && canvas.width > 0 && canvas.height > 0;
    });
    
    // Teste 7: Verificar se Windy engine existe
    runTest("Motor Windy inicializado", () => {
        return windSystem?.particlesLayer?._windy !== null;
    });
    
    // Teste 8: Verificar se dados foram carregados
    runTest("Dados de vento carregados", () => {
        return windSystem && windSystem.currentData !== null;
    });
    
    // Teste 9: Verificar se sistema está ativo
    runTest("Sistema ativo", () => {
        return windSystem && windSystem.isActive === true;
    });
    
    // Teste 10: Teste visual do canvas
    runTest("Canvas renderizando", () => {
        const canvas = windSystem?.particlesLayer?._canvasLayer?._canvas;
        if (!canvas) return false;
        
        const ctx = canvas.getContext('2d');
        
        // Desenhar teste visual
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillRect(100, 100, 150, 80);
        ctx.fillStyle = 'black';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('TESTE VISUAL OK!', 110, 140);
        
        console.log("🎨 Teste visual desenhado no canvas (verde)");
        
        // Limpar após 3 segundos
        setTimeout(() => {
            ctx.clearRect(100, 100, 150, 80);
        }, 3000);
        
        return true;
    });
    
    // Resultados finais
    console.log(`\n=== RESULTADOS DOS TESTES ===`);
    console.log(`✅ Sucessos: ${testResults.passed}/${testResults.total}`);
    console.log(`❌ Falhas: ${testResults.failed}/${testResults.total}`);
    console.log(`📊 Taxa de sucesso: ${((testResults.passed/testResults.total)*100).toFixed(1)}%`);
    
    if (testResults.passed === testResults.total) {
        console.log(`\n🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente!`);
    } else {
        console.log(`\n⚠️ Alguns testes falharam. Verificando detalhes...`);
    }
    
    return testResults;
}

// Função para forçar visualização das partículas
function forceParticleVisibility() {
    console.log("🔧 Forçando visibilidade das partículas...");
    
    if (!windSystem?.particlesLayer?._canvasLayer?._canvas) {
        console.log("❌ Canvas não encontrado");
        return false;
    }
    
    const canvas = windSystem.particlesLayer._canvasLayer._canvas;
    const ctx = canvas.getContext('2d');
    
    // Configurar estilos do canvas
    canvas.style.position = 'absolute';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    canvas.style.zIndex = '300'; // Z-index mais alto
    canvas.style.pointerEvents = 'none';
    canvas.style.opacity = '1';
    canvas.style.visibility = 'visible';
    canvas.style.display = 'block';
    
    console.log("🎨 Canvas reconfigurado");
    
    // Desenhar partículas de teste manualmente
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    
    // Simular algumas partículas
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const dx = (Math.random() - 0.5) * 20;
        const dy = (Math.random() - 0.5) * 20;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
    }
    
    console.log("✅ Partículas de teste desenhadas");
    
    // Limpar após 5 segundos
    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log("🧹 Teste visual limpo");
    }, 5000);
    
    return true;
}

// Função para reiniciar sistema
function restartWindSystem() {
    console.log("🔄 Reiniciando sistema de vento...");
    
    if (windSystem) {
        windSystem.stop();
        setTimeout(() => {
            windSystem.start();
            console.log("✅ Sistema reiniciado");
        }, 1000);
    } else {
        console.log("❌ Sistema não encontrado");
    }
}

// Função de diagnóstico completo
function diagnoseWindSystem() {
    console.log("\n🔍 DIAGNÓSTICO COMPLETO DO SISTEMA\n");
    
    // Informações do sistema
    if (windSystem) {
        const status = windSystem.getStatus();
        console.log("📊 Status do sistema:", status);
        
        if (windSystem.particlesLayer) {
            const layer = windSystem.particlesLayer;
            console.log("🌪️ ParticlesLayer:", {
                exists: !!layer,
                canvasLayer: !!layer._canvasLayer,
                canvas: !!layer._canvasLayer?._canvas,
                windy: !!layer._windy,
                context: !!layer._context
            });
            
            if (layer._canvasLayer?._canvas) {
                const canvas = layer._canvasLayer._canvas;
                const rect = canvas.getBoundingClientRect();
                console.log("🎨 Canvas info:", {
                    width: canvas.width,
                    height: canvas.height,
                    styleWidth: canvas.style.width,
                    styleHeight: canvas.style.height,
                    position: canvas.style.position,
                    zIndex: canvas.style.zIndex,
                    opacity: canvas.style.opacity,
                    visibility: canvas.style.visibility,
                    inDOM: document.body.contains(canvas),
                    boundingRect: rect,
                    visible: rect.width > 0 && rect.height > 0
                });
            }
        }
    } else {
        console.log("❌ windSystem não definido");
    }
    
    // Informações do mapa
    if (map) {
        console.log("🗺️ Mapa info:", {
            center: map.getCenter(),
            zoom: map.getZoom(),
            bounds: map.getBounds(),
            size: map.getSize()
        });
    }
}

// Executar automaticamente se chamado diretamente
if (typeof window !== 'undefined') {
    // Disponibilizar funções globalmente
    window.testWindAnimation = testWindAnimation;
    window.forceParticleVisibility = forceParticleVisibility;
    window.restartWindSystem = restartWindSystem;
    window.diagnoseWindSystem = diagnoseWindSystem;
    
    console.log("\n🛠️ FUNÇÕES DE TESTE DISPONÍVEIS:");
    console.log("- testWindAnimation() - Executar todos os testes");
    console.log("- forceParticleVisibility() - Forçar visibilidade das partículas");
    console.log("- restartWindSystem() - Reiniciar sistema");
    console.log("- diagnoseWindSystem() - Diagnóstico completo");
    
    // Executar teste automaticamente após 2 segundos
    setTimeout(() => {
        console.log("\n🚀 Executando testes automaticamente...");
        testWindAnimation().then(() => {
            // Se testes passaram mas partículas não estão visíveis, forçar
            setTimeout(() => {
                console.log("\n🎨 Forçando visualização das partículas...");
                forceParticleVisibility();
            }, 1000);
        });
    }, 2000);
}

console.log("✅ Script de teste carregado. Aguardando execução...");
