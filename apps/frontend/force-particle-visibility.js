/**
 * BGAPP Wind Animation - Forçar Visibilidade das Partículas
 * Script de emergência para diagnosticar e corrigir problemas de visibilidade
 */

"use strict";

window.forceParticleVisibility = function() {
    console.log("🔧 BGAPP - Forçando visibilidade das partículas...");
    
    if (!window.windSystem || !window.windSystem.particlesLayer) {
        console.error("❌ Sistema de vento não encontrado");
        return;
    }
    
    const particlesLayer = window.windSystem.particlesLayer;
    
    // 1. Verificar canvas
    if (particlesLayer._canvasLayer && particlesLayer._canvasLayer._canvas) {
        const canvas = particlesLayer._canvasLayer._canvas;
        const ctx = canvas.getContext('2d');
        
        console.log("📐 Canvas encontrado:", {
            width: canvas.width,
            height: canvas.height,
            style: {
                width: canvas.style.width,
                height: canvas.style.height,
                opacity: canvas.style.opacity,
                zIndex: canvas.style.zIndex,
                display: canvas.style.display,
                visibility: canvas.style.visibility
            }
        });
        
        // Forçar estilos de visibilidade
        canvas.style.opacity = '1';
        canvas.style.visibility = 'visible';
        canvas.style.display = 'block';
        canvas.style.zIndex = '500'; // Z-index muito alto
        canvas.style.pointerEvents = 'none';
        
        // Desenhar teste visual imediato
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(50, 50, 100, 50);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText('TESTE PARTÍCULAS', 55, 75);
        
        // Desenhar grade de teste
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 100) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        ctx.restore();
        console.log("✅ Teste visual desenhado no canvas");
    }
    
    // 2. Verificar dados
    if (particlesLayer.options.data) {
        console.log("✅ Dados de vento disponíveis:", particlesLayer.options.data.length, "componentes");
    } else {
        console.warn("⚠️ Dados de vento não disponíveis");
    }
    
    // 3. Verificar motor windy
    if (particlesLayer._windy) {
        console.log("✅ Motor Windy ativo");
        
        // Forçar reinício da animação
        if (particlesLayer._windy.stop) {
            particlesLayer._windy.stop();
        }
        
        setTimeout(() => {
            particlesLayer._clearAndRestart();
            console.log("🔄 Animação reiniciada");
        }, 500);
        
    } else {
        console.warn("⚠️ Motor Windy não inicializado");
    }
    
    // 4. Atualizar controle de velocidade
    if (particlesLayer._mouseControl && particlesLayer._mouseControl.updateStatus) {
        particlesLayer._mouseControl.updateStatus('ready', 'Visibilidade forçada - Teste ativo');
        console.log("✅ Status do controle atualizado");
    }
    
    // 5. Forçar redraw
    if (window.map) {
        window.map.invalidateSize();
        console.log("🔄 Mapa invalidado para redraw");
    }
    
    console.log("🎉 Procedimento de visibilidade forçada concluído!");
};

// Auto-executar após 3 segundos se sistema estiver carregado
setTimeout(() => {
    if (window.windSystem && window.windSystem.particlesLayer) {
        console.log("🚀 Auto-executando forçar visibilidade...");
        window.forceParticleVisibility();
    }
}, 3000);

console.log("🔧 Script de visibilidade forçada carregado! Execute forceParticleVisibility() no console.");
