/**
 * BGAPP Admin Panel - Mobile Menu Module (FINAL VERSION)
 * Versão definitiva com inicialização garantida
 */

// Immediately Invoked Function Expression (IIFE) para evitar conflitos
(function() {
    'use strict';

    // Verificar se já foi carregado
    if (window.AdminMobileMenuLoaded) {
        console.log('⚠️ AdminMobileMenu já foi carregado anteriormente');
        return;
    }

    console.log('🚀 Carregando AdminMobileMenu...');

    class AdminMobileMenu {
        constructor() {
            this.mobileMenuBtn = null;
            this.sidebar = null;
            this.overlay = null;
            this.isOpen = false;
            this.initialized = false;
            this.retryCount = 0;
            this.maxRetries = 5;
            
            console.log('🔧 AdminMobileMenu: Construtor executado');
            this.init();
        }

        init() {
            this.waitForDOM().then(() => {
                this.setupElements();
            }).catch(error => {
                console.error('❌ Erro na inicialização:', error);
            });
        }

        waitForDOM() {
            return new Promise((resolve) => {
                if (document.readyState === 'complete' || 
                    (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
                    resolve();
                } else {
                    document.addEventListener('DOMContentLoaded', resolve);
                }
            });
        }

        setupElements() {
            console.log('🔍 Procurando elementos DOM...');
            
            this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
            this.sidebar = document.getElementById('sidebar');
            this.overlay = document.getElementById('mobile-overlay');
            
            const elementsFound = {
                mobileMenuBtn: !!this.mobileMenuBtn,
                sidebar: !!this.sidebar,
                overlay: !!this.overlay
            };
            
            console.log('📋 Elementos encontrados:', elementsFound);
            
            if (this.mobileMenuBtn && this.sidebar && this.overlay) {
                this.bindEvents();
                this.initialized = true;
                console.log('✅ AdminMobileMenu inicializado com sucesso!');
            } else if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`🔄 Retry ${this.retryCount}/${this.maxRetries} em 500ms...`);
                setTimeout(() => this.setupElements(), 500);
            } else {
                console.warn('⚠️ Máximo de tentativas atingido. Alguns elementos podem não estar disponíveis.');
            }
        }

        bindEvents() {
            // Mobile menu button
            this.mobileMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMobileMenu();
            });
            this.mobileMenuBtn.setAttribute('aria-expanded', 'false');

            // Overlay click
            this.overlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });

            // Nav links on mobile
            document.querySelectorAll('.nav-link[data-section]').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        this.closeMobileMenu();
                    }
                });
            });

            // Window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && this.isOpen) {
                    this.closeMobileMenu();
                }
            });

            // Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeMobileMenu();
                }
            });

            console.log('🎯 Eventos configurados');
        }

        toggleMobileMenu() {
            if (this.isOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }

        openMobileMenu() {
            if (!this.sidebar || !this.overlay) return;
            
            this.sidebar.classList.add('open');
            this.overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
            this.isOpen = true;
            
            if (this.mobileMenuBtn) {
                this.mobileMenuBtn.setAttribute('aria-expanded', 'true');
            }
            
            console.log('📱 Menu aberto');
        }

        closeMobileMenu() {
            if (!this.sidebar || !this.overlay) return;
            
            this.sidebar.classList.remove('open');
            this.overlay.classList.remove('show');
            document.body.style.overflow = '';
            this.isOpen = false;
            
            if (this.mobileMenuBtn) {
                this.mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
            
            console.log('📱 Menu fechado');
        }

        // Public API
        isMenuOpen() {
            return this.isOpen;
        }

        isInitialized() {
            return this.initialized;
        }

        getElements() {
            return {
                mobileMenuBtn: this.mobileMenuBtn,
                sidebar: this.sidebar,
                overlay: this.overlay
            };
        }

        destroy() {
            if (this.mobileMenuBtn) {
                this.mobileMenuBtn.removeEventListener('click', this.toggleMobileMenu);
            }
            
            if (this.overlay) {
                this.overlay.removeEventListener('click', this.closeMobileMenu);
            }
            
            document.body.style.overflow = '';
            console.log('🗑️ AdminMobileMenu destruído');
        }
    }

    // Função de inicialização global
    function initializeAdminMobileMenu() {
        if (!window.adminMobileMenu) {
            window.adminMobileMenu = new AdminMobileMenu();
        }
        return window.adminMobileMenu;
    }

    // Exportar para window
    window.AdminMobileMenu = AdminMobileMenu;
    window.initializeAdminMobileMenu = initializeAdminMobileMenu;
    
    // Função de debug
    window.debugAdminMobile = function() {
        console.group('🔍 AdminMobileMenu Debug');
        console.log('Class disponível:', typeof window.AdminMobileMenu);
        console.log('Instance disponível:', typeof window.adminMobileMenu);
        console.log('Document state:', document.readyState);
        console.log('Window dimensions:', window.innerWidth + 'x' + window.innerHeight);
        
        if (window.adminMobileMenu) {
            console.log('Inicializado:', window.adminMobileMenu.isInitialized());
            console.log('Menu aberto:', window.adminMobileMenu.isMenuOpen());
            console.log('Elementos:', window.adminMobileMenu.getElements());
        }
        
        // Verificar elementos DOM
        const elements = {
            'mobile-menu-btn': !!document.getElementById('mobile-menu-btn'),
            'sidebar': !!document.getElementById('sidebar'),
            'mobile-overlay': !!document.getElementById('mobile-overlay')
        };
        console.table(elements);
        console.groupEnd();
    };

    // Inicializar automaticamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAdminMobileMenu);
    } else {
        setTimeout(initializeAdminMobileMenu, 0);
    }

    // Marcar como carregado
    window.AdminMobileMenuLoaded = true;
    console.log('✅ AdminMobileMenu carregado e pronto!');

})();
