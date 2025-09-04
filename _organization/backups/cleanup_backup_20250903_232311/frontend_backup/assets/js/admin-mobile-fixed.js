/**
 * BGAPP Admin Panel - Mobile Menu Module (FIXED VERSION)
 * Handles mobile menu functionality extracted from inline JavaScript
 */

(function(global) {
    'use strict';

    class AdminMobileMenu {
        constructor() {
            this.mobileMenuBtn = null;
            this.sidebar = null;
            this.overlay = null;
            this.isOpen = false;
            this.initialized = false;
            
            // Bind methods to preserve context
            this.toggleMobileMenu = this.toggleMobileMenu.bind(this);
            this.openMobileMenu = this.openMobileMenu.bind(this);
            this.closeMobileMenu = this.closeMobileMenu.bind(this);
            this.handleEscapeKey = this.handleEscapeKey.bind(this);
            this.handleResize = this.handleResize.bind(this);
            
            console.log('🔧 AdminMobileMenu: Construtor chamado');
            this.init();
        }

        init() {
            console.log('🔧 AdminMobileMenu: Inicializando...');
            
            // Multiple strategies to ensure DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('🔧 AdminMobileMenu: DOM carregado via DOMContentLoaded');
                    this.setupElements();
                });
            } else if (document.readyState === 'interactive') {
                // DOM is ready but resources may still be loading
                setTimeout(() => {
                    console.log('🔧 AdminMobileMenu: DOM carregado via timeout (interactive)');
                    this.setupElements();
                }, 0);
            } else {
                // DOM and resources are fully loaded
                console.log('🔧 AdminMobileMenu: DOM já carregado (complete)');
                this.setupElements();
            }
        }

        setupElements() {
            console.log('🔧 AdminMobileMenu: Procurando elementos DOM...');
            
            this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
            this.sidebar = document.getElementById('sidebar');
            this.overlay = document.getElementById('mobile-overlay');
            
            console.log('🔧 AdminMobileMenu: Elementos encontrados:', {
                mobileMenuBtn: !!this.mobileMenuBtn,
                sidebar: !!this.sidebar,
                overlay: !!this.overlay
            });
            
            if (this.mobileMenuBtn && this.sidebar && this.overlay) {
                this.bindEvents();
                this.initialized = true;
                console.log('✅ AdminMobileMenu: Inicializado com sucesso!');
            } else {
                console.warn('⚠️ AdminMobileMenu: Alguns elementos não foram encontrados');
                // Retry after a short delay
                setTimeout(() => {
                    if (!this.initialized) {
                        console.log('🔧 AdminMobileMenu: Tentativa de retry...');
                        this.setupElements();
                    }
                }, 1000);
            }
        }

        bindEvents() {
            console.log('🔧 AdminMobileMenu: Configurando eventos...');
            
            // Mobile menu toggle
            if (this.mobileMenuBtn) {
                this.mobileMenuBtn.addEventListener('click', this.toggleMobileMenu);
                this.mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }

            // Overlay click to close
            if (this.overlay) {
                this.overlay.addEventListener('click', this.closeMobileMenu);
            }

            // Close menu when clicking nav links on mobile
            const navLinks = document.querySelectorAll('.nav-link[data-section]');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        this.closeMobileMenu();
                    }
                });
            });

            // Window resize handler
            window.addEventListener('resize', this.handleResize);

            // Escape key handler
            document.addEventListener('keydown', this.handleEscapeKey);
            
            console.log('✅ AdminMobileMenu: Eventos configurados');
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
            
            console.log('📱 Menu mobile aberto');
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
            
            console.log('📱 Menu mobile fechado');
        }

        handleEscapeKey(e) {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMobileMenu();
            }
        }

        handleResize() {
            if (window.innerWidth > 768 && this.isOpen) {
                this.closeMobileMenu();
            }
        }

        // Public API
        isMenuOpen() {
            return this.isOpen;
        }

        isInitialized() {
            return this.initialized;
        }

        destroy() {
            // Remove event listeners and clean up
            if (this.mobileMenuBtn) {
                this.mobileMenuBtn.removeEventListener('click', this.toggleMobileMenu);
            }
            
            if (this.overlay) {
                this.overlay.removeEventListener('click', this.closeMobileMenu);
            }
            
            window.removeEventListener('resize', this.handleResize);
            document.removeEventListener('keydown', this.handleEscapeKey);
            
            // Reset body overflow
            document.body.style.overflow = '';
            
            console.log('🗑️ AdminMobileMenu: Destruído');
        }

        // Static method to check if environment is ready
        static checkEnvironment() {
            const checks = {
                window: typeof window !== 'undefined',
                document: typeof document !== 'undefined',
                domReady: document.readyState !== 'loading',
                elements: {
                    mobileMenuBtn: !!document.getElementById('mobile-menu-btn'),
                    sidebar: !!document.getElementById('sidebar'),
                    overlay: !!document.getElementById('mobile-overlay')
                }
            };
            
            console.table(checks);
            return checks;
        }
    }

    // Initialize immediately and export
    let adminMobileMenuInstance;

    function initializeAdminMobileMenu() {
        if (!adminMobileMenuInstance) {
            console.log('🚀 Inicializando AdminMobileMenu...');
            adminMobileMenuInstance = new AdminMobileMenu();
        }
        return adminMobileMenuInstance;
    }

    // Export to global scope
    if (typeof global !== 'undefined') {
        // Make class available globally
        global.AdminMobileMenu = AdminMobileMenu;
        
        // Initialize instance
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                global.adminMobileMenu = initializeAdminMobileMenu();
            });
        } else {
            global.adminMobileMenu = initializeAdminMobileMenu();
        }
        
        // Debug helper
        global.debugAdminMobile = function() {
            console.log('🔍 AdminMobileMenu Debug Info:');
            console.log('- Class available:', typeof global.AdminMobileMenu);
            console.log('- Instance available:', typeof global.adminMobileMenu);
            if (global.adminMobileMenu) {
                console.log('- Initialized:', global.adminMobileMenu.isInitialized());
                console.log('- Menu open:', global.adminMobileMenu.isMenuOpen());
            }
            AdminMobileMenu.checkEnvironment();
        };
        
        console.log('✅ AdminMobileMenu: Exportado para window');
    }

})(typeof window !== 'undefined' ? window : this);
