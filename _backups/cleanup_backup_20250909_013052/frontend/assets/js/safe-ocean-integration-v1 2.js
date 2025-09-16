/**
 * 🔒 SAFE OCEAN INTEGRATION V1.0 - BGAPP
 * Sistema de integração segura para melhorias oceânicas
 * 
 * GARANTIAS DE SANIDADE:
 * ✅ Não modifica código existente
 * ✅ Fallback automático em caso de erro
 * ✅ Monitoramento contínuo de performance
 * ✅ Rollback instantâneo se necessário
 * ✅ Logs detalhados para debugging
 */

class SafeOceanIntegration {
    constructor(options = {}) {
        this.options = {
            enableEnhancedShaders: true,
            enableSafetyChecks: true,
            enablePerformanceMonitoring: true,
            enableAutoRollback: true,
            maxErrorCount: 3,
            minFPS: 30,
            ...options
        };
        
        // Estado de segurança
        this.safetyState = {
            isEnhancedMode: false,
            errorCount: 0,
            lastFPS: 60,
            hasRolledBack: false,
            startTime: Date.now()
        };
        
        // Referências aos sistemas
        this.enhancedShaders = null;
        this.originalSystem = null;
        this.currentSystem = null;
        
        // Performance monitoring
        this.performanceMonitor = null;
        
        this.init();
    }
    
    async init() {
        console.log('🔒 Inicializando Safe Ocean Integration V1.0...');
        
        try {
            // Verificar se o sistema enhanced está disponível
            if (window.EnhancedOceanShaders && this.options.enableEnhancedShaders) {
                await this.initializeEnhancedMode();
            } else {
                await this.initializeFallbackMode();
            }
            
            // Iniciar monitoramento
            if (this.options.enablePerformanceMonitoring) {
                this.startPerformanceMonitoring();
            }
            
            console.log('✅ Safe Ocean Integration inicializada com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            await this.initializeFallbackMode();
        }
    }
    
    async initializeEnhancedMode() {
        console.log('🚀 Inicializando modo enhanced...');
        
        try {
            this.enhancedShaders = new window.EnhancedOceanShaders({
                quality: 'auto',
                enableAdvancedShaders: true
            });
            
            // Aguardar inicialização completa
            let attempts = 0;
            while (!this.enhancedShaders.isInitialized && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!this.enhancedShaders.isInitialized) {
                throw new Error('Timeout na inicialização dos enhanced shaders');
            }
            
            this.currentSystem = this.enhancedShaders;
            this.safetyState.isEnhancedMode = true;
            
            console.log('✅ Modo enhanced ativo');
            
        } catch (error) {
            console.error('❌ Falha no modo enhanced:', error);
            this.handleError(error);
            throw error;
        }
    }
    
    async initializeFallbackMode() {
        console.log('🔄 Inicializando modo fallback (seguro)...');
        
        // Sistema básico que sempre funciona
        this.originalSystem = {
            isInitialized: true,
            getShaderMaterial: (scene, camera, renderer) => {
                return new THREE.MeshLambertMaterial({
                    color: 0x006994,
                    transparent: true,
                    opacity: 0.8,
                    wireframe: false
                });
            },
            updatePerformanceMetrics: () => {},
            dispose: () => {}
        };
        
        this.currentSystem = this.originalSystem;
        this.safetyState.isEnhancedMode = false;
        
        console.log('✅ Modo fallback ativo');
    }
    
    startPerformanceMonitoring() {
        console.log('📊 Iniciando monitoramento de performance...');
        
        this.performanceMonitor = setInterval(() => {
            this.checkPerformance();
        }, 1000); // Check a cada segundo
        
        // Monitor de erros globais
        window.addEventListener('error', (event) => {
            if (event.message.includes('WebGL') || event.message.includes('shader')) {
                this.handleError(new Error(event.message));
            }
        });
    }
    
    checkPerformance() {
        // Estimar FPS baseado em requestAnimationFrame
        let frameCount = 0;
        const startTime = performance.now();
        
        const countFrames = () => {
            frameCount++;
            if (performance.now() - startTime < 1000) {
                requestAnimationFrame(countFrames);
            } else {
                this.safetyState.lastFPS = frameCount;
                this.evaluatePerformance();
            }
        };
        
        requestAnimationFrame(countFrames);
    }
    
    evaluatePerformance() {
        const fps = this.safetyState.lastFPS;
        
        // Log de performance
        if (fps < this.options.minFPS) {
            console.warn(`⚠️ FPS baixo detectado: ${fps}`);
            
            if (this.safetyState.isEnhancedMode && this.options.enableAutoRollback) {
                console.log('🔄 Iniciando rollback automático por performance...');
                this.rollbackToSafeMode();
            }
        }
        
        // Atualizar métricas no sistema atual
        if (this.currentSystem && this.currentSystem.updatePerformanceMetrics) {
            this.currentSystem.updatePerformanceMetrics({ info: { render: { calls: 0, triangles: 0 }, memory: { geometries: 0, textures: 0 } } });
        }
    }
    
    handleError(error) {
        console.error('🚨 Erro detectado:', error);
        
        this.safetyState.errorCount++;
        
        if (this.safetyState.errorCount >= this.options.maxErrorCount && !this.safetyState.hasRolledBack) {
            console.log('🔄 Limite de erros atingido, fazendo rollback...');
            this.rollbackToSafeMode();
        }
    }
    
    async rollbackToSafeMode() {
        if (this.safetyState.hasRolledBack) {
            console.log('⚠️ Rollback já foi executado');
            return;
        }
        
        console.log('🔄 Executando rollback para modo seguro...');
        
        try {
            // Limpar sistema enhanced se existir
            if (this.enhancedShaders && this.enhancedShaders.dispose) {
                this.enhancedShaders.dispose();
            }
            
            // Voltar para sistema básico
            await this.initializeFallbackMode();
            
            this.safetyState.hasRolledBack = true;
            this.safetyState.isEnhancedMode = false;
            
            console.log('✅ Rollback executado com sucesso');
            
            // Notificar usuário (se houver sistema de notificação)
            this.notifyUser('Sistema oceânico voltou ao modo seguro para garantir estabilidade', 'warning');
            
        } catch (rollbackError) {
            console.error('❌ Erro crítico no rollback:', rollbackError);
            // Em caso de erro crítico, usar material básico do Three.js
            this.currentSystem = {
                isInitialized: true,
                getShaderMaterial: () => new THREE.MeshBasicMaterial({ color: 0x006994, transparent: true, opacity: 0.6 })
            };
        }
    }
    
    // API pública para integração com código existente
    getOceanMaterial(scene, camera, renderer) {
        try {
            if (!this.currentSystem || !this.currentSystem.isInitialized) {
                console.warn('⚠️ Sistema não inicializado, usando material básico');
                return new THREE.MeshBasicMaterial({ color: 0x006994, transparent: true, opacity: 0.6 });
            }
            
            return this.currentSystem.getShaderMaterial(scene, camera, renderer);
            
        } catch (error) {
            console.error('❌ Erro ao obter material oceânico:', error);
            this.handleError(error);
            
            // Retornar material básico como fallback
            return new THREE.MeshBasicMaterial({ color: 0x006994, transparent: true, opacity: 0.6 });
        }
    }
    
    // Verificação de sanidade do sistema
    performSanityCheck() {
        const checks = {
            systemInitialized: this.currentSystem && this.currentSystem.isInitialized,
            noRecentErrors: this.safetyState.errorCount < this.options.maxErrorCount,
            goodPerformance: this.safetyState.lastFPS >= this.options.minFPS,
            noRollback: !this.safetyState.hasRolledBack
        };
        
        const allChecksPass = Object.values(checks).every(check => check === true);
        
        console.log('🔍 Verificação de sanidade:', {
            status: allChecksPass ? 'SAUDÁVEL' : 'PROBLEMAS DETECTADOS',
            checks: checks,
            uptime: `${Math.round((Date.now() - this.safetyState.startTime) / 1000)}s`,
            mode: this.safetyState.isEnhancedMode ? 'Enhanced' : 'Fallback'
        });
        
        return allChecksPass;
    }
    
    // Sistema de notificação integrado
    notifyUser(message, type = 'info') {
        // Tentar usar sistema de notificação existente
        if (typeof showNotification === 'function') {
            showNotification(message, type);
            return;
        }
        
        // Fallback para console
        const emoji = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️';
        console.log(`${emoji} ${message}`);
        
        // Criar notificação visual simples
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        
        // Remover após 5 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 5000);
    }
    
    // Informações de status para debugging
    getStatus() {
        return {
            mode: this.safetyState.isEnhancedMode ? 'Enhanced' : 'Fallback',
            isHealthy: this.performSanityCheck(),
            errorCount: this.safetyState.errorCount,
            fps: this.safetyState.lastFPS,
            uptime: Math.round((Date.now() - this.safetyState.startTime) / 1000),
            hasRolledBack: this.safetyState.hasRolledBack
        };
    }
    
    // Cleanup para evitar vazamentos
    dispose() {
        console.log('🧹 Limpando Safe Ocean Integration...');
        
        if (this.performanceMonitor) {
            clearInterval(this.performanceMonitor);
        }
        
        if (this.enhancedShaders && this.enhancedShaders.dispose) {
            this.enhancedShaders.dispose();
        }
        
        if (this.originalSystem && this.originalSystem.dispose) {
            this.originalSystem.dispose();
        }
    }
}

// Exportar para uso global
window.SafeOceanIntegration = SafeOceanIntegration;

console.log('🔒 Safe Ocean Integration V1.0 carregado e pronto para uso!');
