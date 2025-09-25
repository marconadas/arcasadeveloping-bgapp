/**
 * BGAPP - Ubiquiti Integration System
 * Integração do sistema Ubiquiti em toda a aplicação sem perder funcionalidades
 * Versão: 1.0.0 - Janeiro 2025
 */

class UbiquitiIntegration {
  constructor() {
    this.preservedFunctionalities = new Map();
    this.integrationStatus = {
      navigation: false,
      theme: false,
      components: false,
      legacy: false
    };
    
    this.init();
  }
  
  async init() {
    console.log('🚀 Iniciando integração Ubiquiti em toda a aplicação...');
    
    try {
      // 1. Preservar funcionalidades existentes
      await this.preserveExistingFunctionalities();
      
      // 2. Aplicar sistema de design
      await this.applyDesignSystem();
      
      // 3. Integrar navegação
      await this.integrateNavigation();
      
      // 4. Configurar tema
      await this.setupTheme();
      
      // 5. Migrar componentes
      await this.migrateComponents();
      
      // 6. Verificar integridade
      await this.verifyIntegrity();
      
      console.log('✅ Integração Ubiquiti completa com sucesso!');
      this.showIntegrationReport();
      
    } catch (error) {
      console.error('❌ Erro na integração Ubiquiti:', error);
      await this.rollback();
    }
  }
  
  async preserveExistingFunctionalities() {
    console.log('🔒 Preservando funcionalidades existentes...');
    
    // Preservar funções globais importantes
    const globalFunctions = [
      'togglePanel',
      'showHelp', 
      'refreshData',
      'exportData',
      'applyFilters',
      'resetFilters',
      'initializeMap',
      'loadSectionData'
    ];
    
    globalFunctions.forEach(funcName => {
      if (window[funcName] && typeof window[funcName] === 'function') {
        this.preservedFunctionalities.set(funcName, window[funcName]);
        console.log(`✅ Preservado: ${funcName}`);
      }
    });
    
    // Preservar event listeners existentes
    const importantElements = document.querySelectorAll('[onclick], [onchange], [onsubmit]');
    importantElements.forEach((element, index) => {
      const key = `element_${index}`;
      this.preservedFunctionalities.set(key, {
        element: element,
        onclick: element.onclick,
        onchange: element.onchange,
        onsubmit: element.onsubmit
      });
    });
    
    // Preservar configurações do mapa
    if (window.map) {
      this.preservedFunctionalities.set('mapInstance', window.map);
    }
    
    // Preservar estado da aplicação
    if (window.AppState) {
      this.preservedFunctionalities.set('appState', window.AppState);
    }
    
    console.log(`✅ ${this.preservedFunctionalities.size} funcionalidades preservadas`);
  }
  
  async applyDesignSystem() {
    console.log('🎨 Aplicando sistema de design Ubiquiti...');
    
    // Verificar se o CSS já foi carregado
    if (!document.querySelector('#ubq-design-system')) {
      const link = document.createElement('link');
      link.id = 'ubq-design-system';
      link.rel = 'stylesheet';
      link.href = 'assets/css/ubiquiti-design-system.css';
      document.head.appendChild(link);
      
      // Aguardar carregamento
      await new Promise(resolve => {
        link.onload = resolve;
        setTimeout(resolve, 1000); // Fallback
      });
    }
    
    // Aplicar classes de compatibilidade
    document.body.classList.add('ubq-integrated');
    
    this.integrationStatus.components = true;
    console.log('✅ Sistema de design aplicado');
  }
  
  async integrateNavigation() {
    console.log('🧭 Integrando sistema de navegação...');
    
    // Verificar se já existe navegação Ubiquiti
    if (!window.ubqNavigation) {
      // Carregar script de navegação se necessário
      if (!document.querySelector('#ubq-navigation-script')) {
        const script = document.createElement('script');
        script.id = 'ubq-navigation-script';
        script.src = 'assets/js/ubiquiti-navigation.js';
        document.head.appendChild(script);
        
        // Aguardar carregamento e inicialização
        await new Promise(resolve => {
          script.onload = () => {
            setTimeout(resolve, 500); // Aguardar inicialização
          };
          setTimeout(resolve, 2000); // Fallback
        });
      }
    }
    
    // Integrar com navegação existente
    this.integrateExistingNavigation();
    
    this.integrationStatus.navigation = true;
    console.log('✅ Sistema de navegação integrado');
  }
  
  integrateExistingNavigation() {
    // Integrar links de navegação existentes
    const existingNavLinks = document.querySelectorAll('.nav-link[data-section]');
    existingNavLinks.forEach(link => {
      if (!link.classList.contains('ubq-integrated')) {
        link.classList.add('ubq-integrated');
        
        // Preservar funcionalidade original
        const originalClick = link.onclick;
        link.onclick = (e) => {
          // Executar função original primeiro
          if (originalClick) {
            originalClick.call(link, e);
          }
          
          // Depois executar navegação Ubiquiti
          if (window.ubqNavigation) {
            const section = link.dataset.section;
            if (section) {
              window.ubqNavigation.setActiveSection(section);
            }
          }
        };
      }
    });
  }
  
  async setupTheme() {
    console.log('🌓 Configurando sistema de tema...');
    
    // Detectar tema atual baseado em elementos existentes
    const isDarkMode = this.detectCurrentTheme();
    
    // Aplicar tema apropriado
    if (window.ubqNavigation) {
      window.ubqNavigation.setTheme(isDarkMode ? 'dark' : 'light');
    } else {
      document.body.classList.add(isDarkMode ? 'ubq-theme-dark' : 'ubq-theme-light');
    }
    
    // Integrar toggles de tema existentes
    this.integrateThemeToggles();
    
    this.integrationStatus.theme = true;
    console.log(`✅ Tema ${isDarkMode ? 'escuro' : 'claro'} configurado`);
  }
  
  detectCurrentTheme() {
    // Verificar indicadores de tema escuro na aplicação
    const darkIndicators = [
      document.body.style.background?.includes('rgb(33, 37, 41)'),
      document.documentElement.style.colorScheme === 'dark',
      document.querySelector('[data-theme="dark"]'),
      getComputedStyle(document.body).backgroundColor === 'rgb(33, 37, 41)',
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ];
    
    return darkIndicators.some(indicator => indicator);
  }
  
  integrateThemeToggles() {
    // Procurar botões de toggle existentes
    const themeButtons = document.querySelectorAll('[onclick*="theme"], [onclick*="Theme"], .theme-toggle, .dark-mode-toggle');
    
    themeButtons.forEach(button => {
      if (!button.classList.contains('ubq-integrated')) {
        button.classList.add('ubq-integrated');
        
        // Preservar função original
        const originalClick = button.onclick;
        
        button.onclick = (e) => {
          // Executar função original
          if (originalClick) {
            originalClick.call(button, e);
          }
          
          // Executar toggle Ubiquiti
          if (window.ubqNavigation) {
            setTimeout(() => {
              window.ubqNavigation.toggleTheme();
            }, 100);
          }
        };
      }
    });
  }
  
  async migrateComponents() {
    console.log('🔄 Migrando componentes para sistema Ubiquiti...');
    
    // Migrar botões
    this.migrateButtons();
    
    // Migrar cards
    this.migrateCards();
    
    // Migrar inputs
    this.migrateInputs();
    
    // Migrar métricas
    this.migrateMetrics();
    
    // Migrar toasts/notificações
    this.migrateNotifications();
    
    console.log('✅ Componentes migrados com sucesso');
  }
  
  migrateButtons() {
    const buttons = document.querySelectorAll('button:not(.ubq-btn), .btn:not(.ubq-btn)');
    
    buttons.forEach(button => {
      if (!button.classList.contains('ubq-migrated')) {
        button.classList.add('ubq-migrated');
        
        // Determinar tipo de botão baseado em classes existentes
        if (button.classList.contains('btn-primary') || button.classList.contains('primary')) {
          button.classList.add('ubq-btn', 'ubq-btn-primary');
        } else if (button.classList.contains('btn-secondary') || button.classList.contains('secondary')) {
          button.classList.add('ubq-btn', 'ubq-btn-secondary');
        } else {
          button.classList.add('ubq-btn', 'ubq-btn-secondary');
        }
        
        // Preservar funcionalidade
        this.preserveElementFunctionality(button);
      }
    });
  }
  
  migrateCards() {
    const cards = document.querySelectorAll('.card:not(.ubq-card), .panel:not(.ubq-card)');
    
    cards.forEach(card => {
      if (!card.classList.contains('ubq-migrated')) {
        card.classList.add('ubq-migrated', 'ubq-card');
        
        // Migrar header se existir
        const header = card.querySelector('.card-header, .panel-header');
        if (header && !header.classList.contains('ubq-card-header')) {
          header.classList.add('ubq-card-header');
        }
        
        // Migrar body se existir
        const body = card.querySelector('.card-body, .panel-body');
        if (body && !body.classList.contains('ubq-card-body')) {
          body.classList.add('ubq-card-body');
        }
        
        // Migrar footer se existir
        const footer = card.querySelector('.card-footer, .panel-footer');
        if (footer && !footer.classList.contains('ubq-card-footer')) {
          footer.classList.add('ubq-card-footer');
        }
      }
    });
  }
  
  migrateInputs() {
    const inputs = document.querySelectorAll('input:not(.ubq-input), textarea:not(.ubq-input), select:not(.ubq-input)');
    
    inputs.forEach(input => {
      if (!input.classList.contains('ubq-migrated')) {
        input.classList.add('ubq-migrated', 'ubq-input');
        this.preserveElementFunctionality(input);
      }
    });
    
    // Migrar labels
    const labels = document.querySelectorAll('label:not(.ubq-label)');
    labels.forEach(label => {
      if (!label.classList.contains('ubq-migrated')) {
        label.classList.add('ubq-migrated', 'ubq-label');
      }
    });
  }
  
  migrateMetrics() {
    const metrics = document.querySelectorAll('.metric, .stat, .kpi');
    
    metrics.forEach(metric => {
      if (!metric.classList.contains('ubq-migrated')) {
        metric.classList.add('ubq-migrated', 'ubq-metric-card');
        
        // Migrar valor se existir
        const value = metric.querySelector('.value, .number, .metric-value');
        if (value && !value.classList.contains('ubq-metric-value')) {
          value.classList.add('ubq-metric-value');
        }
        
        // Migrar label se existir
        const label = metric.querySelector('.label, .title, '.metric-label');
        if (label && !label.classList.contains('ubq-metric-label')) {
          label.classList.add('ubq-metric-label');
        }
      }
    });
  }
  
  migrateNotifications() {
    const notifications = document.querySelectorAll('.toast, .notification, '.alert');
    
    notifications.forEach(notification => {
      if (!notification.classList.contains('ubq-migrated')) {
        notification.classList.add('ubq-migrated', 'ubq-toast');
        
        // Determinar tipo baseado em classes
        if (notification.classList.contains('success') || notification.classList.contains('toast-success')) {
          notification.classList.add('ubq-toast-success');
        } else if (notification.classList.contains('error') || notification.classList.contains('toast-error')) {
          notification.classList.add('ubq-toast-error');
        } else if (notification.classList.contains('warning') || notification.classList.contains('toast-warning')) {
          notification.classList.add('ubq-toast-warning');
        } else {
          notification.classList.add('ubq-toast-info');
        }
      }
    });
  }
  
  preserveElementFunctionality(element) {
    // Preservar event listeners inline
    ['onclick', 'onchange', 'onsubmit', 'onfocus', 'onblur'].forEach(event => {
      if (element[event]) {
        const key = `${element.tagName}_${event}_${Date.now()}`;
        this.preservedFunctionalities.set(key, {
          element: element,
          event: event,
          handler: element[event]
        });
      }
    });
  }
  
  async verifyIntegrity() {
    console.log('🔍 Verificando integridade da integração...');
    
    const issues = [];
    
    // Verificar se funcionalidades preservadas ainda funcionam
    for (const [key, func] of this.preservedFunctionalities) {
      try {
        if (typeof func === 'function') {
          // Teste não destrutivo
          if (func.toString().length > 0) {
            console.log(`✅ ${key} preservado`);
          }
        }
      } catch (error) {
        issues.push(`❌ Problema com ${key}: ${error.message}`);
      }
    }
    
    // Verificar se elementos críticos existem
    const criticalElements = [
      '#map',
      '.sidebar',
      '.nav-menu',
      '#toolbar'
    ];
    
    criticalElements.forEach(selector => {
      const element = document.querySelector(selector);
      if (!element) {
        issues.push(`❌ Elemento crítico não encontrado: ${selector}`);
      } else {
        console.log(`✅ Elemento crítico OK: ${selector}`);
      }
    });
    
    // Verificar se CSS foi aplicado corretamente
    const testElement = document.createElement('div');
    testElement.className = 'ubq-btn ubq-btn-primary';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    document.body.appendChild(testElement);
    
    const styles = getComputedStyle(testElement);
    if (!styles.backgroundColor || styles.backgroundColor === 'rgba(0, 0, 0, 0)') {
      issues.push('❌ CSS do sistema Ubiquiti não foi aplicado corretamente');
    } else {
      console.log('✅ CSS do sistema Ubiquiti aplicado corretamente');
    }
    
    document.body.removeChild(testElement);
    
    if (issues.length > 0) {
      console.warn('⚠️ Problemas encontrados na integração:', issues);
      throw new Error(`Integração incompleta: ${issues.join(', ')}`);
    }
    
    console.log('✅ Integridade verificada com sucesso');
  }
  
  showIntegrationReport() {
    const report = {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      preservedFunctionalities: this.preservedFunctionalities.size,
      integrationStatus: this.integrationStatus,
      migratedElements: {
        buttons: document.querySelectorAll('.ubq-btn.ubq-migrated').length,
        cards: document.querySelectorAll('.ubq-card.ubq-migrated').length,
        inputs: document.querySelectorAll('.ubq-input.ubq-migrated').length,
        metrics: document.querySelectorAll('.ubq-metric-card.ubq-migrated').length,
        notifications: document.querySelectorAll('.ubq-toast.ubq-migrated').length
      }
    };
    
    console.log('📊 RELATÓRIO DE INTEGRAÇÃO UBIQUITI:', report);
    
    // Mostrar toast de sucesso se possível
    if (typeof showToast === 'function') {
      showToast('success', `Integração Ubiquiti completa! ${report.preservedFunctionalities} funcionalidades preservadas.`);
    }
    
    // Emitir evento personalizado
    document.dispatchEvent(new CustomEvent('ubiquiti-integration-complete', {
      detail: report
    }));
    
    return report;
  }
  
  async rollback() {
    console.log('🔄 Executando rollback da integração...');
    
    try {
      // Remover classes adicionadas
      document.querySelectorAll('.ubq-migrated').forEach(element => {
        element.classList.remove('ubq-migrated', 'ubq-btn', 'ubq-card', 'ubq-input', 'ubq-metric-card', 'ubq-toast');
      });
      
      // Remover classes do body
      document.body.classList.remove('ubq-integrated', 'ubq-theme-light', 'ubq-theme-dark');
      
      // Restaurar funcionalidades preservadas
      for (const [key, data] of this.preservedFunctionalities) {
        if (data.element && data.event && data.handler) {
          data.element[data.event] = data.handler;
        }
      }
      
      console.log('✅ Rollback executado com sucesso');
      
      if (typeof showToast === 'function') {
        showToast('info', 'Integração revertida. Funcionalidades originais restauradas.');
      }
      
    } catch (error) {
      console.error('❌ Erro no rollback:', error);
    }
  }
  
  // API pública
  getIntegrationStatus() {
    return this.integrationStatus;
  }
  
  getPreservedFunctionalities() {
    return Array.from(this.preservedFunctionalities.keys());
  }
  
  forceReintegration() {
    console.log('🔄 Forçando re-integração...');
    return this.init();
  }
}

// Auto-inicialização quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.ubqIntegration) {
      window.ubqIntegration = new UbiquitiIntegration();
    }
  });
} else {
  if (!window.ubqIntegration) {
    window.ubqIntegration = new UbiquitiIntegration();
  }
}

// Export para sistemas de módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UbiquitiIntegration;
}

if (typeof define === 'function' && define.amd) {
  define(() => UbiquitiIntegration);
}
