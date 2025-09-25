/**
 * BGAPP Admin Panel - Mobile Menu Module
 * Handles mobile menu functionality extracted from inline JavaScript
 */

class AdminMobileMenu {
    constructor() {
        this.mobileMenuBtn = null;
        this.sidebar = null;
        this.overlay = null;
        this.isOpen = false;
        this.initialized = false;
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            // Use setTimeout to ensure all other scripts have loaded
            setTimeout(() => this.setupElements(), 0);
        }
    }

    setupElements() {
        this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
        this.sidebar = document.getElementById('sidebar');
        this.overlay = document.getElementById('mobile-overlay');
        
        if (this.mobileMenuBtn && this.sidebar && this.overlay) {
            this.bindEvents();
            this.initialized = true;
            console.log('✅ AdminMobileMenu: Elementos encontrados e eventos configurados');
        } else {
            console.warn('⚠️ AdminMobileMenu: Alguns elementos não foram encontrados', {
                mobileMenuBtn: !!this.mobileMenuBtn,
                sidebar: !!this.sidebar,
                overlay: !!this.overlay
            });
        }
    }

    bindEvents() {
        // Mobile menu toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Overlay click to close
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeMobileMenu());
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

        // Close menu on window resize if desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMobileMenu();
            }
        });
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
        
        // Update ARIA attributes for accessibility
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.setAttribute('aria-expanded', 'true');
        }
    }

    closeMobileMenu() {
        if (!this.sidebar || !this.overlay) return;
        
        this.sidebar.classList.remove('open');
        this.overlay.classList.remove('show');
        document.body.style.overflow = '';
        this.isOpen = false;
        
        // Update ARIA attributes for accessibility
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.setAttribute('aria-expanded', 'false');
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
        
        // Reset body overflow
        document.body.style.overflow = '';
    }
}

// Initialize and export immediately
let adminMobileMenu;

// Ensure proper initialization
function initializeAdminMobileMenu() {
    if (!adminMobileMenu) {
        adminMobileMenu = new AdminMobileMenu();
        console.log('✅ AdminMobileMenu inicializado com sucesso');
    }
    return adminMobileMenu;
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = AdminMobileMenu;
} else if (typeof window !== 'undefined') {
    // Browser environment
    window.AdminMobileMenu = AdminMobileMenu;
    
    // Initialize when DOM is ready or immediately if already ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.adminMobileMenu = initializeAdminMobileMenu();
        });
    } else {
        window.adminMobileMenu = initializeAdminMobileMenu();
    }
}
