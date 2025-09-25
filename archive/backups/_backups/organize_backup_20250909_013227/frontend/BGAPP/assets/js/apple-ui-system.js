/**
 * Sistema de UI Apple Design - BGAPP
 * Baseado no design system do index-fresh.html
 * Implementa painel flutuante, controles modernizados e atalhos de teclado
 */

class AppleUISystem {
    constructor() {
        this.panelCollapsed = false;
        this.keyboardShortcuts = new Map();
        this.activeButtons = new Set();
        this.isInitialized = false;
        
        // Configurações de estilo
        this.cssVariables = {
            '--apple-blue': '#007AFF',
            '--apple-green': '#34C759',
            '--apple-orange': '#FF9500',
            '--apple-red': '#FF3B30',
            '--apple-teal': '#5AC8FA',
            '--surface-elevated': 'rgba(255, 255, 255, 0.95)',
            '--border': 'rgba(0, 0, 0, 0.1)',
            '--shadow-elevated': '0 8px 30px rgba(0, 0, 0, 0.12)',
            '--transition-smooth': '0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            '--radius-lg': '16px',
            '--spacing-lg': '24px',
            '--spacing-md': '16px'
        };
        
        console.log('🎨 Apple UI System inicializado');
    }

    /**
     * Inicializar sistema de UI
     */
    initialize(map) {
        if (this.isInitialized) {
            console.log('⚠️ Apple UI System já inicializado');
            return;
        }

        console.log('🚀 Inicializando Apple UI System...');
        
        try {
            // 1. Aplicar variáveis CSS
            this.applyCSSVariables();
            
            // 2. Criar painel flutuante
            this.createFloatingPanel();
            
            // 3. Modernizar controles existentes
            this.modernizeControls();
            
            // 4. Configurar atalhos de teclado
            this.setupKeyboardShortcuts();
            
            // 5. Configurar eventos de painel
            this.setupPanelEvents(map);
            
            // 6. Adicionar animações suaves
            this.setupSmoothAnimations();
            
            this.isInitialized = true;
            console.log('✅ Apple UI System inicializado com sucesso');
            
            // Mostrar dica de atalhos
            setTimeout(() => this.showKeyboardHint(), 2000);
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Apple UI System:', error);
        }
    }

    /**
     * Aplicar variáveis CSS do sistema Apple
     */
    applyCSSVariables() {
        console.log('🎨 Aplicando variáveis CSS do sistema Apple...');
        
        // Criar elemento style para variáveis CSS
        const styleElement = document.createElement('style');
        styleElement.id = 'apple-ui-variables';
        
        let cssContent = ':root {\n';
        for (const [variable, value] of Object.entries(this.cssVariables)) {
            cssContent += `  ${variable}: ${value};\n`;
        }
        cssContent += '}\n\n';
        
        // Adicionar estilos para modo escuro
        cssContent += `
        @media (prefers-color-scheme: dark) {
            :root {
                --surface-elevated: rgba(44, 44, 46, 0.95);
                --border: rgba(255, 255, 255, 0.1);
            }
        }
        
        /* Estilos base do sistema Apple */
        html, body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        
        .apple-button {
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 36px;
            position: relative;
            overflow: hidden;
            margin: 2px;
            backdrop-filter: blur(10px);
        }
        
        .apple-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .apple-button:active {
            transform: scale(0.95);
        }
        
        .apple-button.ocean {
            background: var(--apple-teal);
            color: white;
        }
        
        .apple-button.meteo {
            background: var(--apple-orange);
            color: white;
        }
        
        .apple-button.control {
            background: #f2f2f7;
            color: #000;
        }
        
        .apple-button.animate {
            background: #af52de;
            color: white;
        }
        
        .apple-button.active {
            background: var(--apple-green) !important;
            color: white;
            box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
        }
        
        .floating-panel {
            position: fixed !important;
            top: var(--spacing-lg) !important;
            left: var(--spacing-lg) !important;
            width: 320px;
            max-height: calc(100vh - 48px);
            background: var(--surface-elevated);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-elevated);
            border: 1px solid var(--border);
            z-index: 1000;
            transform: translateX(0);
            transition: transform var(--transition-smooth), opacity var(--transition-smooth);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .floating-panel.collapsed {
            transform: translateX(-280px);
            opacity: 0.9;
        }
        
        .panel-header {
            padding: var(--spacing-md);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(255, 255, 255, 0.8);
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .panel-toggle {
            width: 32px;
            height: 32px;
            border: none;
            background: #f2f2f7;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #666;
        }
        
        .panel-toggle:hover {
            background: #e5e5ea;
            transform: scale(1.05);
        }
        
        .toolbar-section {
            margin-bottom: var(--spacing-md);
            padding: 0 var(--spacing-md);
        }
        
        .toolbar-section h2 {
            font-size: 13px;
            font-weight: 600;
            color: #8e8e93;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        
        .btn-group {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .floating-toggle {
            position: fixed;
            top: var(--spacing-lg);
            left: var(--spacing-lg);
            width: 48px;
            height: 48px;
            border: none;
            background: var(--surface-elevated);
            backdrop-filter: blur(20px);
            border-radius: 50%;
            box-shadow: var(--shadow-elevated);
            border: 1px solid var(--border);
            cursor: pointer;
            z-index: 1001;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            transition: all 0.2s ease;
        }
        
        .floating-toggle:hover {
            transform: scale(1.05);
        }
        
        .floating-toggle.show {
            display: flex;
        }
        
        /* Responsivo */
        @media (max-width: 768px) {
            .floating-panel {
                width: calc(100vw - 32px);
                left: 16px;
                right: 16px;
                top: 16px;
                max-height: 60vh;
            }
            
            .floating-panel.collapsed {
                transform: translateY(-100%);
            }
            
            .floating-toggle {
                top: 16px;
                left: 16px;
            }
        }
        `;
        
        styleElement.textContent = cssContent;
        document.head.appendChild(styleElement);
        
        console.log('✅ Variáveis CSS aplicadas');
    }

    /**
     * Criar painel flutuante modernizado
     */
    createFloatingPanel() {
        console.log('🏗️ Criando painel flutuante...');
        
        // Verificar se já existe um painel
        let existingPanel = document.getElementById('toolbar');
        if (!existingPanel) {
            // Criar novo painel se não existir
            existingPanel = document.createElement('nav');
            existingPanel.id = 'toolbar';
            existingPanel.setAttribute('role', 'navigation');
            existingPanel.setAttribute('aria-label', 'Controles do Mapa Meteorológico');
            document.body.appendChild(existingPanel);
        }
        
        // Aplicar classes do sistema Apple
        existingPanel.className = 'floating-panel';
        
        // Criar ou atualizar conteúdo do painel
        if (!existingPanel.innerHTML.trim()) {
            existingPanel.innerHTML = this.createPanelContent();
        } else {
            // Modernizar painel existente
            this.modernizeExistingPanel(existingPanel);
        }
        
        // Criar botão flutuante para quando painel está recolhido
        this.createFloatingToggleButton();
        
        console.log('✅ Painel flutuante criado');
    }

    /**
     * Criar conteúdo do painel
     */
    createPanelContent() {
        return `
            <header class="panel-header">
                <h1 id="app-title" style="font-size: 18px; font-weight: 600; margin: 0;">
                    🌊 BGAPP - Meteorologia Marinha
                </h1>
                <button class="panel-toggle" id="panel-toggle" aria-label="Recolher painel">
                    <span>←</span>
                </button>
            </header>

            <section class="toolbar-section" aria-labelledby="filters-heading">
                <h2 id="filters-heading">Filtros Temporais</h2>
                <label for="dateMin" style="font-size: 12px; color: #666;">
                    Data mínima:
                    <input type="date" 
                           id="dateMin" 
                           value="${new Date().toISOString().split('T')[0]}"
                           style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; background: rgba(255, 255, 255, 0.8); font-size: 14px; margin: 8px 0;">
                </label>
                <button id="apply" class="apple-button control" style="width: 100%; margin-top: 4px;">
                    <span aria-hidden="true">🔍</span>
                    Aplicar Filtro
                </button>
            </section>

            <section class="toolbar-section" aria-labelledby="ocean-heading">
                <h2 id="ocean-heading">🌡️ Variáveis Oceanográficas</h2>
                <div class="btn-group">
                    <button id="btn-sst" class="apple-button ocean" aria-label="Temperatura da Superfície do Mar">
                        <span aria-hidden="true">🌡️</span>
                        SST
                    </button>
                    <button id="btn-salinity" class="apple-button ocean" aria-label="Salinidade da Água do Mar">
                        <span aria-hidden="true">🧂</span>
                        Salinidade
                    </button>
                    <button id="btn-chlorophyll" class="apple-button ocean" aria-label="Concentração de Clorofila">
                        <span aria-hidden="true">🌿</span>
                        Clorofila
                    </button>
                </div>
            </section>

            <section class="toolbar-section" aria-labelledby="vector-heading">
                <h2 id="vector-heading">💨 Campos Vetoriais</h2>
                <div class="btn-group">
                    <button id="btn-currents" class="apple-button meteo" aria-label="Correntes Marítimas">
                        <span aria-hidden="true">🌊</span>
                        Correntes
                    </button>
                    <button id="btn-wind" class="apple-button meteo" aria-label="Velocidade e Direção do Vento">
                        <span aria-hidden="true">💨</span>
                        Vento
                    </button>
                </div>
            </section>

            <section class="toolbar-section" aria-labelledby="controls-heading">
                <h2 id="controls-heading">⚙️ Controles</h2>
                <div class="btn-group">
                    <button id="btn-clear" class="apple-button control" aria-label="Limpar Todas as Camadas do Mapa">
                        <span aria-hidden="true">🗑️</span>
                        Limpar
                    </button>
                    <button id="btn-animate" class="apple-button animate" aria-label="Iniciar Animação Temporal">
                        <span aria-hidden="true" id="animate-icon">▶️</span>
                        <span id="animate-text">Animar</span>
                    </button>
                </div>
            </section>

            <footer style="padding: var(--spacing-md); border-top: 1px solid var(--border); background: rgba(255, 255, 255, 0.8); margin-top: auto; font-size: 11px; color: #7f8c8d;">
                <div role="status" aria-live="polite">
                    <span class="status-indicator" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #27ae60; margin-right: 8px;"></span>
                    <span id="system-status">Sistema Online</span>
                </div>
            </footer>
        `;
    }

    /**
     * Modernizar painel existente
     */
    modernizeExistingPanel(panel) {
        console.log('🔄 Modernizando painel existente...');
        
        // Atualizar classes dos botões existentes
        const buttons = panel.querySelectorAll('button');
        buttons.forEach(btn => {
            if (!btn.classList.contains('panel-toggle')) {
                btn.classList.add('apple-button');
                
                // Aplicar classes específicas baseadas no ID
                if (btn.id.includes('sst') || btn.id.includes('salinity') || btn.id.includes('chlorophyll')) {
                    btn.classList.add('ocean');
                } else if (btn.id.includes('currents') || btn.id.includes('wind')) {
                    btn.classList.add('meteo');
                } else if (btn.id.includes('animate')) {
                    btn.classList.add('animate');
                } else {
                    btn.classList.add('control');
                }
            }
        });
        
        // Modernizar seções
        const sections = panel.querySelectorAll('section, .toolbar-section');
        sections.forEach(section => {
            section.classList.add('toolbar-section');
        });
        
        console.log('✅ Painel existente modernizado');
    }

    /**
     * Criar botão flutuante de toggle
     */
    createFloatingToggleButton() {
        let floatingToggle = document.getElementById('floating-toggle');
        
        if (!floatingToggle) {
            floatingToggle = document.createElement('button');
            floatingToggle.id = 'floating-toggle';
            floatingToggle.className = 'floating-toggle';
            floatingToggle.setAttribute('aria-label', 'Mostrar painel de controles');
            floatingToggle.innerHTML = '⚙️';
            document.body.appendChild(floatingToggle);
        }
        
        floatingToggle.className = 'floating-toggle';
    }

    /**
     * Modernizar controles existentes
     */
    modernizeControls() {
        console.log('🎨 Modernizando controles...');
        
        // Modernizar inputs
        const inputs = document.querySelectorAll('input[type="date"], input[type="text"], select');
        inputs.forEach(input => {
            input.style.cssText = `
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.8);
                font-size: 14px;
                margin-bottom: 8px;
                transition: all 0.2s ease;
            `;
            
            // Efeito focus
            input.addEventListener('focus', () => {
                input.style.borderColor = 'var(--apple-blue)';
                input.style.boxShadow = '0 0 0 3px rgba(0, 122, 255, 0.2)';
            });
            
            input.addEventListener('blur', () => {
                input.style.borderColor = 'var(--border)';
                input.style.boxShadow = 'none';
            });
        });
        
        console.log('✅ Controles modernizados');
    }

    /**
     * Configurar atalhos de teclado
     */
    setupKeyboardShortcuts() {
        console.log('⌨️ Configurando atalhos de teclado...');
        
        // Mapear atalhos
        this.keyboardShortcuts.set(' ', () => this.togglePanel()); // Espaço
        this.keyboardShortcuts.set('h', () => this.showHelp()); // H
        this.keyboardShortcuts.set('Escape', () => this.handleEscape()); // Escape
        this.keyboardShortcuts.set('1', () => this.triggerButton('btn-sst')); // 1
        this.keyboardShortcuts.set('2', () => this.triggerButton('btn-salinity')); // 2
        this.keyboardShortcuts.set('3', () => this.triggerButton('btn-chlorophyll')); // 3
        this.keyboardShortcuts.set('4', () => this.triggerButton('btn-currents')); // 4
        this.keyboardShortcuts.set('5', () => this.triggerButton('btn-wind')); // 5
        this.keyboardShortcuts.set('c', () => this.triggerButton('btn-clear')); // C
        this.keyboardShortcuts.set('a', () => this.triggerButton('btn-animate')); // A
        
        // Event listener global
        document.addEventListener('keydown', (e) => {
            // Não ativar se estiver digitando em um input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            const key = e.key.toLowerCase();
            const handler = this.keyboardShortcuts.get(key === ' ' ? ' ' : key);
            
            if (handler) {
                e.preventDefault();
                handler();
            }
        });
        
        console.log('✅ Atalhos de teclado configurados');
    }

    /**
     * Configurar eventos do painel
     */
    setupPanelEvents(map) {
        console.log('🎛️ Configurando eventos do painel...');
        
        // Toggle do painel
        const panelToggle = document.getElementById('panel-toggle');
        const floatingToggle = document.getElementById('floating-toggle');
        
        if (panelToggle) {
            panelToggle.addEventListener('click', () => this.togglePanel(map));
        }
        
        if (floatingToggle) {
            floatingToggle.addEventListener('click', () => this.togglePanel(map));
        }
        
        // Configurar eventos dos botões
        this.setupButtonEvents();
        
        console.log('✅ Eventos do painel configurados');
    }

    /**
     * Configurar eventos dos botões
     */
    setupButtonEvents() {
        const buttonConfigs = [
            { id: 'btn-sst', name: 'SST', icon: '🌡️' },
            { id: 'btn-salinity', name: 'Salinidade', icon: '🧂' },
            { id: 'btn-chlorophyll', name: 'Clorofila', icon: '🌿' },
            { id: 'btn-currents', name: 'Correntes', icon: '🌊' },
            { id: 'btn-wind', name: 'Vento', icon: '💨' },
            { id: 'btn-clear', name: 'Limpar', icon: '🗑️' },
            { id: 'btn-animate', name: 'Animar', icon: '▶️' }
        ];
        
        buttonConfigs.forEach(config => {
            const button = document.getElementById(config.id);
            if (button) {
                button.addEventListener('click', (e) => {
                    this.handleButtonClick(e, config);
                });
            }
        });
    }

    /**
     * Tratar clique em botão
     */
    handleButtonClick(event, config) {
        const button = event.target;
        
        if (config.id === 'btn-clear') {
            // Limpar todos os botões ativos
            this.clearAllActiveButtons();
            console.log(`${config.icon} ${config.name} - Todas as camadas limpas`);
        } else if (config.id === 'btn-animate') {
            // Toggle animação
            this.toggleAnimation(button);
        } else {
            // Toggle botão normal
            this.toggleButton(button, config);
        }
        
        // Efeito visual de clique
        this.addClickEffect(button);
    }

    /**
     * Toggle botão
     */
    toggleButton(button, config) {
        const isActive = button.classList.contains('active');
        
        if (isActive) {
            button.classList.remove('active');
            this.activeButtons.delete(config.id);
            button.setAttribute('aria-pressed', 'false');
            console.log(`${config.icon} ${config.name} desativado`);
        } else {
            button.classList.add('active');
            this.activeButtons.add(config.id);
            button.setAttribute('aria-pressed', 'true');
            console.log(`${config.icon} ${config.name} ativado`);
        }
    }

    /**
     * Toggle animação
     */
    toggleAnimation(button) {
        const isActive = button.classList.contains('active');
        const icon = document.getElementById('animate-icon');
        const text = document.getElementById('animate-text');
        
        if (isActive) {
            button.classList.remove('active');
            if (icon) icon.textContent = '▶️';
            if (text) text.textContent = 'Animar';
            button.setAttribute('aria-pressed', 'false');
            console.log('⏸️ Animação pausada');
        } else {
            button.classList.add('active');
            if (icon) icon.textContent = '⏸️';
            if (text) text.textContent = 'Pausar';
            button.setAttribute('aria-pressed', 'true');
            console.log('▶️ Animação iniciada');
        }
    }

    /**
     * Limpar todos os botões ativos
     */
    clearAllActiveButtons() {
        document.querySelectorAll('.apple-button.active').forEach(btn => {
            if (!btn.id.includes('clear')) {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
        
        // Reset ícone de animação
        const animateIcon = document.getElementById('animate-icon');
        const animateText = document.getElementById('animate-text');
        if (animateIcon) animateIcon.textContent = '▶️';
        if (animateText) animateText.textContent = 'Animar';
        
        this.activeButtons.clear();
    }

    /**
     * Adicionar efeito visual de clique
     */
    addClickEffect(button) {
        // Criar elemento de ripple
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            background-color: rgba(255, 255, 255, 0.7);
            pointer-events: none;
        `;
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = rect.width / 2 - size / 2;
        const y = rect.height / 2 - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        button.style.position = 'relative';
        button.appendChild(ripple);
        
        // Remover ripple após animação
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
        
        // Adicionar animação CSS se não existir
        if (!document.getElementById('ripple-animation')) {
            const style = document.createElement('style');
            style.id = 'ripple-animation';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Toggle painel
     */
    togglePanel(map) {
        const toolbar = document.getElementById('toolbar');
        const floatingToggle = document.getElementById('floating-toggle');
        const panelToggle = document.getElementById('panel-toggle');
        
        if (!toolbar) return;
        
        this.panelCollapsed = !this.panelCollapsed;
        
        if (this.panelCollapsed) {
            toolbar.classList.add('collapsed');
            if (floatingToggle) floatingToggle.classList.add('show');
            if (panelToggle) {
                panelToggle.innerHTML = '<span>→</span>';
                panelToggle.setAttribute('aria-label', 'Expandir painel');
            }
            console.log('📱 Painel recolhido - mapa em tela cheia');
        } else {
            toolbar.classList.remove('collapsed');
            if (floatingToggle) floatingToggle.classList.remove('show');
            if (panelToggle) {
                panelToggle.innerHTML = '<span>←</span>';
                panelToggle.setAttribute('aria-label', 'Recolher painel');
            }
            console.log('📱 Painel expandido');
        }
        
        // Invalidar tamanho do mapa após animação
        if (map) {
            setTimeout(() => {
                if (typeof map.invalidateSize === 'function') {
                    map.invalidateSize();
                    console.log('✅ Tamanho do mapa invalidado');
                }
            }, 300);
        }
    }

    /**
     * Configurar animações suaves
     */
    setupSmoothAnimations() {
        // As animações já estão definidas no CSS
        console.log('✅ Animações suaves configuradas');
    }

    /**
     * Trigger botão por ID
     */
    triggerButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button && !button.disabled) {
            button.click();
        }
    }

    /**
     * Tratar tecla Escape
     */
    handleEscape() {
        if (!this.panelCollapsed) {
            this.togglePanel();
        }
    }

    /**
     * Mostrar ajuda de atalhos
     */
    showHelp() {
        const helpModal = document.createElement('div');
        helpModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const helpContent = document.createElement('div');
        helpContent.style.cssText = `
            background: var(--surface-elevated);
            backdrop-filter: blur(20px);
            border-radius: var(--radius-lg);
            padding: 32px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: var(--shadow-elevated);
            border: 1px solid var(--border);
        `;
        
        helpContent.innerHTML = `
            <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: var(--apple-blue);">
                🎹 Atalhos de Teclado BGAPP
            </h2>
            
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 16px; font-weight: 600; color: #2c3e50; margin-bottom: 12px;">📱 Painel</h3>
                <div style="font-size: 14px; line-height: 1.6; color: #666;">
                    <div><kbd style="background: #f2f2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Espaço</kbd> - Recolher/Expandir painel</div>
                    <div><kbd style="background: #f2f2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Esc</kbd> - Fechar painel</div>
                    <div><kbd style="background: #f2f2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">H</kbd> - Mostrar esta ajuda</div>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 16px; font-weight: 600; color: #2c3e50; margin-bottom: 12px;">🌊 Variáveis</h3>
                <div style="font-size: 14px; line-height: 1.6; color: #666;">
                    <div><kbd style="background: #f2f2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">1</kbd> - SST (Temperatura)</div>
                    <div><kbd style="background: #f2f2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">2</kbd> - Salinidade</div>
                    <div><kbd style="background: #f2f2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">3</kbd> - Clorofila</div>
                    <div><kbd style="background: #f2f2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">4</kbd> - Correntes</div>
                    <div><kbd style="background: #f2f2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">5</kbd> - Vento</div>
                    <div><kbd style="background: #f2f2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">C</kbd> - Limpar tudo</div>
                    <div><kbd style="background: #f2f2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">A</kbd> - Animar</div>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 16px; font-weight: 600; color: #2c3e50; margin-bottom: 12px;">🖱️ Mapa</h3>
                <div style="font-size: 14px; line-height: 1.6; color: #666;">
                    <div>Arrastar - Navegar</div>
                    <div>Scroll - Zoom</div>
                    <div>Clique - Informações</div>
                </div>
            </div>
            
            <button id="close-help" class="apple-button control" style="width: 100%; justify-content: center;">
                Fechar
            </button>
        `;
        
        helpModal.appendChild(helpContent);
        document.body.appendChild(helpModal);
        
        // Fechar ao clicar no botão ou fora do modal
        const closeHelp = () => {
            helpModal.style.opacity = '0';
            setTimeout(() => helpModal.remove(), 200);
        };
        
        document.getElementById('close-help').addEventListener('click', closeHelp);
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) closeHelp();
        });
        
        // Fechar com Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeHelp();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Mostrar dica de atalhos
     */
    showKeyboardHint() {
        const hint = document.createElement('div');
        hint.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 24px;
            background: var(--surface-elevated);
            backdrop-filter: blur(20px);
            border-radius: 12px;
            padding: 12px 16px;
            font-size: 12px;
            color: #666;
            z-index: 1000;
            border: 1px solid var(--border);
            animation: fadeInOut 4s ease-in-out;
            box-shadow: var(--shadow-elevated);
        `;
        
        hint.textContent = 'Pressione H para atalhos ou Espaço para recolher painel';
        document.body.appendChild(hint);
        
        // Adicionar animação se não existir
        if (!document.getElementById('fade-animation')) {
            const style = document.createElement('style');
            style.id = 'fade-animation';
            style.textContent = `
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0; transform: translateY(10px); }
                    20%, 80% { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            if (hint.parentNode) {
                hint.remove();
            }
        }, 4000);
    }

    /**
     * Obter estado do sistema
     */
    getState() {
        return {
            panelCollapsed: this.panelCollapsed,
            activeButtons: Array.from(this.activeButtons),
            isInitialized: this.isInitialized
        };
    }
}

// Exportar para uso global
window.AppleUISystem = AppleUISystem;

console.log('✅ Apple UI System carregado e pronto para uso');
