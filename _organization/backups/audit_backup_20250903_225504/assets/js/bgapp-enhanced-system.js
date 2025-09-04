/**
 * BGAPP Enhanced System - Integrador Principal
 * Combina Enhanced Coastline System, Robust Error Handler e Apple UI System
 * Baseado nas melhorias do index-fresh.html para mapas de Angola
 */

class BGAPPEnhancedSystem {
    constructor() {
        this.components = {
            coastline: null,
            errorHandler: null,
            ui: null
        };
        
        this.map = null;
        this.isInitialized = false;
        this.initializationSteps = [];
        this.currentStep = 0;
        
        // Configurações do sistema
        this.config = {
            enableCoastline: true,
            enableErrorHandling: true,
            enableAppleUI: true,
            enableDiagnostics: true,
            enableNotifications: true,
            autoFallback: true
        };
        
        console.log('🚀 BGAPP Enhanced System inicializado');
    }

    /**
     * Inicializar sistema completo
     */
    async initialize(map) {
        if (this.isInitialized) {
            console.log('⚠️ Sistema já inicializado');
            return;
        }

        if (!map) {
            throw new Error('Mapa é obrigatório para inicialização');
        }

        this.map = map;
        console.log('🌟 Iniciando BGAPP Enhanced System...');
        
        // Definir passos de inicialização
        this.initializationSteps = [
            { name: 'Verificar Dependências', method: 'checkDependencies' },
            { name: 'Inicializar Error Handler', method: 'initializeErrorHandler' },
            { name: 'Inicializar Apple UI System', method: 'initializeAppleUI' },
            { name: 'Inicializar Enhanced Coastline', method: 'initializeCoastline' },
            { name: 'Configurar Integrações', method: 'setupIntegrations' },
            { name: 'Finalizar Sistema', method: 'finalizeSystem' }
        ];
        
        try {
            // Mostrar progresso de inicialização
            this.showInitializationProgress();
            
            // Executar passos sequencialmente
            for (const step of this.initializationSteps) {
                console.log(`📋 Passo ${this.currentStep + 1}/${this.initializationSteps.length}: ${step.name}`);
                this.updateInitializationProgress(step.name);
                
                await this[step.method]();
                this.currentStep++;
                
                // Pequena pausa para suavizar a inicialização
                await this.delay(200);
            }
            
            this.isInitialized = true;
            console.log('✅ BGAPP Enhanced System inicializado com sucesso!');
            
            // Mostrar notificação de sucesso
            this.showSuccessNotification();
            
            // Ocultar progresso após sucesso
            setTimeout(() => this.hideInitializationProgress(), 2000);
            
        } catch (error) {
            console.error('❌ Erro durante inicialização:', error);
            this.showErrorNotification(error);
            
            // Tentar modo de recuperação
            await this.enterRecoveryMode();
        }
    }

    /**
     * Verificar dependências
     */
    async checkDependencies() {
        const dependencies = [
            { name: 'Leaflet', check: () => typeof L !== 'undefined' },
            { name: 'Enhanced Coastline System', check: () => typeof EnhancedCoastlineSystem !== 'undefined' },
            { name: 'Robust Error Handler', check: () => typeof RobustErrorHandler !== 'undefined' },
            { name: 'Apple UI System', check: () => typeof AppleUISystem !== 'undefined' }
        ];
        
        const missing = [];
        
        for (const dep of dependencies) {
            if (!dep.check()) {
                missing.push(dep.name);
                console.warn(`⚠️ Dependência ausente: ${dep.name}`);
            } else {
                console.log(`✅ Dependência OK: ${dep.name}`);
            }
        }
        
        if (missing.length > 0) {
            throw new Error(`Dependências ausentes: ${missing.join(', ')}`);
        }
    }

    /**
     * Inicializar Error Handler
     */
    async initializeErrorHandler() {
        if (!this.config.enableErrorHandling) {
            console.log('⏭️ Error Handler desabilitado na configuração');
            return;
        }

        try {
            this.components.errorHandler = new RobustErrorHandler();
            this.components.errorHandler.initialize();
            console.log('✅ Robust Error Handler inicializado');
        } catch (error) {
            console.warn('⚠️ Falha ao inicializar Error Handler:', error);
            this.components.errorHandler = null;
        }
    }

    /**
     * Inicializar Apple UI System
     */
    async initializeAppleUI() {
        if (!this.config.enableAppleUI) {
            console.log('⏭️ Apple UI System desabilitado na configuração');
            return;
        }

        try {
            this.components.ui = new AppleUISystem();
            this.components.ui.initialize(this.map);
            console.log('✅ Apple UI System inicializado');
        } catch (error) {
            console.warn('⚠️ Falha ao inicializar Apple UI:', error);
            this.components.ui = null;
        }
    }

    /**
     * Inicializar Enhanced Coastline
     */
    async initializeCoastline() {
        if (!this.config.enableCoastline) {
            console.log('⏭️ Enhanced Coastline desabilitado na configuração');
            return;
        }

        try {
            this.components.coastline = new EnhancedCoastlineSystem();
            await this.components.coastline.initialize(this.map);
            console.log('✅ Enhanced Coastline System inicializado');
        } catch (error) {
            console.warn('⚠️ Falha ao inicializar Coastline System:', error);
            this.components.coastline = null;
        }
    }

    /**
     * Configurar integrações entre componentes
     */
    async setupIntegrations() {
        console.log('🔗 Configurando integrações entre componentes...');
        
        // Integrar UI com Error Handler
        if (this.components.ui && this.components.errorHandler) {
            this.integrateUIWithErrorHandler();
        }
        
        // Integrar Coastline com Error Handler
        if (this.components.coastline && this.components.errorHandler) {
            this.integrateCoastlineWithErrorHandler();
        }
        
        // Configurar comunicação entre componentes
        this.setupComponentCommunication();
        
        console.log('✅ Integrações configuradas');
    }

    /**
     * Finalizar sistema
     */
    async finalizeSystem() {
        // Configurar monitoramento de saúde global
        this.setupGlobalHealthMonitoring();
        
        // Configurar auto-save de configurações
        this.setupConfigAutoSave();
        
        // Registrar sistema globalmente
        window.BGAPPSystem = this;
        
        console.log('✅ Sistema finalizado');
    }

    /**
     * Integrar UI com Error Handler
     */
    integrateUIWithErrorHandler() {
        console.log('🔗 Integrando UI com Error Handler...');
        
        // Interceptar eventos de erro para mostrar notificações na UI
        const originalShowServiceFallback = this.components.errorHandler.showServiceFallbackNotification;
        
        this.components.errorHandler.showServiceFallbackNotification = (serviceType) => {
            // Chamar método original
            originalShowServiceFallback.call(this.components.errorHandler, serviceType);
            
            // Atualizar status na UI
            this.updateUIStatus(`Serviço ${serviceType.toUpperCase()} em fallback`);
        };
    }

    /**
     * Integrar Coastline com Error Handler
     */
    integrateCoastlineWithErrorHandler() {
        console.log('🔗 Integrando Coastline com Error Handler...');
        
        // Configurar fallback automático para EOX
        if (this.components.coastline.eoxOverlayLayer) {
            this.components.coastline.eoxOverlayLayer.on('tileerror', () => {
                console.log('🔄 Ativando fallback para linha costeira...');
                this.components.coastline.setupCoastlineFallback();
            });
        }
    }

    /**
     * Configurar comunicação entre componentes
     */
    setupComponentCommunication() {
        // Criar sistema de eventos para comunicação
        this.eventBus = {
            events: new Map(),
            
            on(event, callback) {
                if (!this.events.has(event)) {
                    this.events.set(event, []);
                }
                this.events.get(event).push(callback);
            },
            
            emit(event, data) {
                if (this.events.has(event)) {
                    this.events.get(event).forEach(callback => callback(data));
                }
            }
        };
        
        // Eventos de exemplo
        this.eventBus.on('service-error', (data) => {
            console.log('📢 Evento service-error:', data);
        });
        
        this.eventBus.on('layer-toggle', (data) => {
            console.log('📢 Evento layer-toggle:', data);
        });
        
        console.log('✅ Sistema de eventos configurado');
    }

    /**
     * Configurar monitoramento de saúde global
     */
    setupGlobalHealthMonitoring() {
        setInterval(() => {
            this.performSystemHealthCheck();
        }, 60000); // A cada minuto
        
        console.log('✅ Monitoramento de saúde global configurado');
    }

    /**
     * Realizar verificação de saúde do sistema
     */
    async performSystemHealthCheck() {
        const health = {
            coastline: this.components.coastline?.isInitialized || false,
            errorHandler: this.components.errorHandler?.isInitialized || false,
            ui: this.components.ui?.isInitialized || false,
            map: !!this.map,
            timestamp: new Date().toISOString()
        };
        
        const healthyComponents = Object.values(health).filter(Boolean).length - 1; // -1 para timestamp
        const totalComponents = Object.keys(health).length - 1;
        
        if (healthyComponents < totalComponents) {
            console.warn(`⚠️ Sistema degradado: ${healthyComponents}/${totalComponents} componentes saudáveis`);
        }
        
        // Atualizar status na UI se disponível
        if (this.components.ui) {
            this.updateUIStatus(`${healthyComponents}/${totalComponents} componentes OK`);
        }
    }

    /**
     * Configurar auto-save de configurações
     */
    setupConfigAutoSave() {
        // Salvar configurações no localStorage
        const saveConfig = () => {
            try {
                localStorage.setItem('bgapp-config', JSON.stringify(this.config));
            } catch (error) {
                console.warn('⚠️ Falha ao salvar configurações:', error);
            }
        };
        
        // Carregar configurações salvas
        try {
            const saved = localStorage.getItem('bgapp-config');
            if (saved) {
                this.config = { ...this.config, ...JSON.parse(saved) };
                console.log('✅ Configurações carregadas do localStorage');
            }
        } catch (error) {
            console.warn('⚠️ Falha ao carregar configurações:', error);
        }
        
        // Auto-save a cada mudança
        setInterval(saveConfig, 30000); // A cada 30 segundos
    }

    /**
     * Atualizar status na UI
     */
    updateUIStatus(message) {
        const statusElement = document.getElementById('system-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    /**
     * Mostrar progresso de inicialização
     */
    showInitializationProgress() {
        const progressContainer = document.createElement('div');
        progressContainer.id = 'bgapp-init-progress';
        progressContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(0, 122, 255, 0.95), rgba(52, 152, 219, 0.95));
            color: white;
            padding: 24px 32px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 500;
            z-index: 3000;
            backdrop-filter: blur(20px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            text-align: center;
            min-width: 300px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        progressContainer.innerHTML = `
            <div style="margin-bottom: 16px; font-size: 16px;">
                🌟 Inicializando BGAPP Enhanced System
            </div>
            <div id="progress-step" style="font-size: 13px; opacity: 0.9; margin-bottom: 16px;">
                Preparando sistema...
            </div>
            <div style="width: 100%; height: 4px; background: rgba(255, 255, 255, 0.3); border-radius: 2px; overflow: hidden;">
                <div id="progress-bar" style="height: 100%; background: white; width: 0%; transition: width 0.3s ease; border-radius: 2px;"></div>
            </div>
            <div style="font-size: 11px; opacity: 0.8; margin-top: 12px;">
                Sistema avançado de mapas para Angola
            </div>
        `;
        
        document.body.appendChild(progressContainer);
    }

    /**
     * Atualizar progresso de inicialização
     */
    updateInitializationProgress(stepName) {
        const stepElement = document.getElementById('progress-step');
        const progressBar = document.getElementById('progress-bar');
        
        if (stepElement) {
            stepElement.textContent = stepName;
        }
        
        if (progressBar) {
            const progress = ((this.currentStep + 1) / this.initializationSteps.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    /**
     * Ocultar progresso de inicialização
     */
    hideInitializationProgress() {
        const progressContainer = document.getElementById('bgapp-init-progress');
        if (progressContainer) {
            progressContainer.style.opacity = '0';
            progressContainer.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => progressContainer.remove(), 300);
        }
    }

    /**
     * Mostrar notificação de sucesso
     */
    showSuccessNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            right: 24px;
            background: linear-gradient(135deg, rgba(52, 199, 89, 0.95), rgba(48, 176, 199, 0.95));
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 500;
            z-index: 2000;
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            max-width: 320px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        const componentCount = Object.values(this.components).filter(Boolean).length;
        
        notification.innerHTML = `
            <div style="margin-bottom: 8px; font-size: 14px;">
                🎉 Sistema Inicializado
            </div>
            <div style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
                <strong>${componentCount} componentes</strong> carregados com sucesso!<br>
                ✅ Linha costeira precisa<br>
                ✅ Tratamento robusto de erros<br>
                ✅ Interface Apple modernizada
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    /**
     * Mostrar notificação de erro
     */
    showErrorNotification(error) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            right: 24px;
            background: linear-gradient(135deg, rgba(255, 59, 48, 0.95), rgba(255, 149, 0, 0.95));
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 500;
            z-index: 2000;
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            max-width: 320px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        notification.innerHTML = `
            <div style="margin-bottom: 8px; font-size: 14px;">
                ❌ Erro na Inicialização
            </div>
            <div style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
                <strong>Problema:</strong> ${error.message}<br>
                Ativando modo de recuperação...
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';
            setTimeout(() => notification.remove(), 300);
        }, 6000);
    }

    /**
     * Entrar em modo de recuperação
     */
    async enterRecoveryMode() {
        console.log('🛡️ Entrando em modo de recuperação...');
        
        try {
            // Tentar inicializar apenas componentes essenciais
            if (!this.components.ui && typeof AppleUISystem !== 'undefined') {
                this.components.ui = new AppleUISystem();
                this.components.ui.initialize(this.map);
                console.log('✅ UI básica recuperada');
            }
            
            // Mostrar notificação de modo de recuperação
            this.showRecoveryNotification();
            
        } catch (recoveryError) {
            console.error('❌ Falha no modo de recuperação:', recoveryError);
        }
    }

    /**
     * Mostrar notificação de modo de recuperação
     */
    showRecoveryNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(255, 149, 0, 0.95), rgba(52, 152, 219, 0.95));
            color: white;
            padding: 20px 28px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 500;
            z-index: 2000;
            backdrop-filter: blur(20px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            text-align: center;
            max-width: 380px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        notification.innerHTML = `
            <div style="margin-bottom: 12px; font-size: 16px;">
                🛡️ Modo de Recuperação
            </div>
            <div style="font-size: 13px; line-height: 1.4; margin-bottom: 12px; opacity: 0.95;">
                Sistema iniciado com funcionalidades limitadas.<br>
                Componentes básicos funcionando.
            </div>
            <div style="font-size: 12px; background: rgba(255, 255, 255, 0.15); padding: 8px 12px; border-radius: 8px;">
                ✅ Mapa básico funcionando<br>
                ✅ Interface de usuário OK<br>
                ⚠️ Recursos avançados limitados
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => notification.remove(), 300);
        }, 6000);
    }

    /**
     * Utilitário para delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obter informações do sistema
     */
    getSystemInfo() {
        return {
            initialized: this.isInitialized,
            components: {
                coastline: {
                    loaded: !!this.components.coastline,
                    initialized: this.components.coastline?.isInitialized || false,
                    info: this.components.coastline?.getSystemInfo?.() || null
                },
                errorHandler: {
                    loaded: !!this.components.errorHandler,
                    initialized: this.components.errorHandler?.isInitialized || false,
                    stats: this.components.errorHandler?.getStats?.() || null
                },
                ui: {
                    loaded: !!this.components.ui,
                    initialized: this.components.ui?.isInitialized || false,
                    state: this.components.ui?.getState?.() || null
                }
            },
            config: { ...this.config },
            initializationSteps: this.initializationSteps.length,
            currentStep: this.currentStep
        };
    }

    /**
     * Reinicializar sistema
     */
    async reinitialize() {
        console.log('🔄 Reinicializando sistema...');
        
        this.isInitialized = false;
        this.currentStep = 0;
        
        // Limpar componentes
        Object.keys(this.components).forEach(key => {
            this.components[key] = null;
        });
        
        // Reinicializar
        await this.initialize(this.map);
    }
}

// Exportar para uso global
window.BGAPPEnhancedSystem = BGAPPEnhancedSystem;

console.log('✅ BGAPP Enhanced System carregado e pronto para uso');
