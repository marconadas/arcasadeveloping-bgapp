/**
 * BGAPP - Ubiquiti Navigation System
 * Sistema de navegação unificado inspirado na Ubiquiti
 * Versão: 1.0.0 - Janeiro 2025
 */

class UbiquitiNavigation {
  constructor(options = {}) {
    this.options = {
      // Configurações padrão
      breakpoint: 768,
      animationDuration: 250,
      autoHide: true,
      autoHideDelay: 5000,
      keyboardNavigation: true,
      touchSupport: true,
      ...options
    };
    
    this.state = {
      isOpen: false,
      isMobile: window.innerWidth < this.options.breakpoint,
      currentSection: null,
      autoHideTimer: null
    };
    
    this.init();
  }
  
  init() {
    this.createNavigationStructure();
    this.bindEvents();
    this.setupKeyboardNavigation();
    this.setupTouchSupport();
    this.updateResponsiveState();
    this.initializeTheme();
    
    console.log('✅ Ubiquiti Navigation System initialized');
  }
  
  createNavigationStructure() {
    // Criar estrutura de navegação se não existir
    if (!document.querySelector('.ubq-nav')) {
      this.createDefaultNavigation();
    }
    
    this.nav = document.querySelector('.ubq-nav');
    this.navToggle = document.querySelector('.ubq-nav-toggle');
    this.navOverlay = document.querySelector('.ubq-nav-overlay');
    this.navItems = document.querySelectorAll('.ubq-nav-item');
    
    // Adicionar classes necessárias
    this.nav.classList.add('ubq-nav-initialized');
  }
  
  createDefaultNavigation() {
    const navHTML = `
      <!-- Navigation Toggle Button -->
      <button class="ubq-nav-toggle ubq-btn ubq-btn-ghost" aria-label="Toggle navigation">
        <svg class="ubq-nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      
      <!-- Navigation Overlay -->
      <div class="ubq-nav-overlay" aria-hidden="true"></div>
      
      <!-- Main Navigation -->
      <nav class="ubq-nav" role="navigation" aria-label="Main navigation">
        <div class="ubq-nav-header">
          <div class="ubq-nav-brand">
            <img src="/static/logo.png" alt="BGAPP Logo" class="ubq-nav-logo">
            <span class="ubq-nav-title">BGAPP</span>
          </div>
          <button class="ubq-nav-close ubq-btn ubq-btn-ghost" aria-label="Close navigation">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="ubq-nav-body">
          <ul class="ubq-nav-menu" role="menubar">
            <li class="ubq-nav-item" role="none">
              <a href="#dashboard" class="ubq-nav-link active" role="menuitem" data-section="dashboard">
                <svg class="ubq-nav-link-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="9"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <span>Dashboard</span>
              </a>
            </li>
            
            <li class="ubq-nav-item" role="none">
              <a href="#scientific" class="ubq-nav-link" role="menuitem" data-section="scientific">
                <svg class="ubq-nav-link-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11a3 3 0 1 1 6 0a3 3 0 0 1-6 0z"></path>
                  <path d="M17.657 16.657l13.153 13.153a2.5 2.5 0 1 1-3.536 3.536l-13.153-13.153a2.5 2.5 0 0 1 0-3.536z"></path>
                </svg>
                <span>Científico</span>
              </a>
            </li>
            
            <li class="ubq-nav-item" role="none">
              <a href="#maps" class="ubq-nav-link" role="menuitem" data-section="maps">
                <svg class="ubq-nav-link-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
                <span>Mapas</span>
              </a>
            </li>
            
            <li class="ubq-nav-item" role="none">
              <a href="#services" class="ubq-nav-link" role="menuitem" data-section="services">
                <svg class="ubq-nav-link-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <span>Serviços</span>
              </a>
            </li>
          </ul>
        </div>
        
        <div class="ubq-nav-footer">
          <div class="ubq-nav-status">
            <div class="ubq-status-indicator ubq-status-online"></div>
            <span class="ubq-text-sm ubq-text-secondary">Sistema Online</span>
          </div>
        </div>
      </nav>
    `;
    
    // Inserir no início do body
    document.body.insertAdjacentHTML('afterbegin', navHTML);
  }
  
  bindEvents() {
    // Toggle navigation
    if (this.navToggle) {
      this.navToggle.addEventListener('click', () => this.toggle());
    }
    
    // Close button
    const closeBtn = document.querySelector('.ubq-nav-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    // Overlay click
    if (this.navOverlay) {
      this.navOverlay.addEventListener('click', () => this.close());
    }
    
    // Navigation links
    this.navItems.forEach(item => {
      const link = item.querySelector('.ubq-nav-link');
      if (link) {
        link.addEventListener('click', (e) => this.handleNavClick(e, link));
      }
    });
    
    // Window resize
    window.addEventListener('resize', () => this.handleResize());
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.isOpen) {
        this.close();
      }
    });
  }
  
  setupKeyboardNavigation() {
    if (!this.options.keyboardNavigation) return;
    
    this.navItems.forEach((item, index) => {
      const link = item.querySelector('.ubq-nav-link');
      if (link) {
        link.addEventListener('keydown', (e) => {
          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault();
              this.focusNextItem(index);
              break;
            case 'ArrowUp':
              e.preventDefault();
              this.focusPrevItem(index);
              break;
            case 'Home':
              e.preventDefault();
              this.focusFirstItem();
              break;
            case 'End':
              e.preventDefault();
              this.focusLastItem();
              break;
          }
        });
      }
    });
  }
  
  setupTouchSupport() {
    if (!this.options.touchSupport) return;
    
    let startX = 0;
    let startY = 0;
    
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      if (!this.state.isMobile) return;
      
      const deltaX = e.touches[0].clientX - startX;
      const deltaY = e.touches[0].clientY - startY;
      
      // Swipe right to open (from left edge)
      if (deltaX > 50 && Math.abs(deltaY) < 100 && startX < 50 && !this.state.isOpen) {
        this.open();
      }
      
      // Swipe left to close
      if (deltaX < -50 && Math.abs(deltaY) < 100 && this.state.isOpen) {
        this.close();
      }
    }, { passive: true });
  }
  
  handleNavClick(e, link) {
    e.preventDefault();
    
    const section = link.dataset.section;
    if (section) {
      this.setActiveSection(section);
      
      // Emit custom event
      this.emit('navigate', { section, link });
      
      // Close on mobile
      if (this.state.isMobile) {
        this.close();
      }
    }
  }
  
  setActiveSection(section) {
    // Remove active from all links
    this.navItems.forEach(item => {
      const link = item.querySelector('.ubq-nav-link');
      if (link) {
        link.classList.remove('active');
      }
    });
    
    // Add active to current section
    const activeLink = document.querySelector(`[data-section="${section}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
    
    this.state.currentSection = section;
  }
  
  toggle() {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  open() {
    this.state.isOpen = true;
    document.body.classList.add('ubq-nav-open');
    this.nav.classList.add('ubq-nav-visible');
    this.navOverlay.classList.add('ubq-nav-overlay-visible');
    
    // Focus management
    const firstLink = this.nav.querySelector('.ubq-nav-link');
    if (firstLink) {
      firstLink.focus();
    }
    
    // Auto-hide timer
    this.startAutoHideTimer();
    
    this.emit('open');
  }
  
  close() {
    this.state.isOpen = false;
    document.body.classList.remove('ubq-nav-open');
    this.nav.classList.remove('ubq-nav-visible');
    this.navOverlay.classList.remove('ubq-nav-overlay-visible');
    
    // Clear auto-hide timer
    this.clearAutoHideTimer();
    
    this.emit('close');
  }
  
  startAutoHideTimer() {
    if (!this.options.autoHide || !this.state.isMobile) return;
    
    this.clearAutoHideTimer();
    this.state.autoHideTimer = setTimeout(() => {
      this.close();
    }, this.options.autoHideDelay);
  }
  
  clearAutoHideTimer() {
    if (this.state.autoHideTimer) {
      clearTimeout(this.state.autoHideTimer);
      this.state.autoHideTimer = null;
    }
  }
  
  handleResize() {
    const wasMobile = this.state.isMobile;
    this.updateResponsiveState();
    
    // Close navigation when switching from mobile to desktop
    if (wasMobile && !this.state.isMobile && this.state.isOpen) {
      this.close();
    }
  }
  
  updateResponsiveState() {
    this.state.isMobile = window.innerWidth < this.options.breakpoint;
    
    if (this.state.isMobile) {
      document.body.classList.add('ubq-nav-mobile');
    } else {
      document.body.classList.remove('ubq-nav-mobile');
    }
  }
  
  // Keyboard navigation helpers
  focusNextItem(currentIndex) {
    const nextIndex = (currentIndex + 1) % this.navItems.length;
    const nextLink = this.navItems[nextIndex].querySelector('.ubq-nav-link');
    if (nextLink) nextLink.focus();
  }
  
  focusPrevItem(currentIndex) {
    const prevIndex = currentIndex === 0 ? this.navItems.length - 1 : currentIndex - 1;
    const prevLink = this.navItems[prevIndex].querySelector('.ubq-nav-link');
    if (prevLink) prevLink.focus();
  }
  
  focusFirstItem() {
    const firstLink = this.navItems[0]?.querySelector('.ubq-nav-link');
    if (firstLink) firstLink.focus();
  }
  
  focusLastItem() {
    const lastLink = this.navItems[this.navItems.length - 1]?.querySelector('.ubq-nav-link');
    if (lastLink) lastLink.focus();
  }
  
  // Event emitter
  emit(eventName, data = {}) {
    const event = new CustomEvent(`ubq-nav:${eventName}`, {
      detail: { ...data, navigation: this }
    });
    document.dispatchEvent(event);
  }
  
  // Public API
  getCurrentSection() {
    return this.state.currentSection;
  }
  
  navigateTo(section) {
    this.setActiveSection(section);
    this.emit('navigate', { section });
  }
  
  // Theme management
  setTheme(theme) {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('ubq-theme-light', 'ubq-theme-dark');
    
    if (theme === 'light') {
      body.classList.add('ubq-theme-light');
      localStorage.setItem('ubq-theme', 'light');
    } else if (theme === 'dark') {
      body.classList.add('ubq-theme-dark');
      localStorage.setItem('ubq-theme', 'dark');
    } else {
      // Auto theme based on system preference
      localStorage.removeItem('ubq-theme');
    }
    
    this.emit('theme-changed', { theme });
  }
  
  getTheme() {
    const stored = localStorage.getItem('ubq-theme');
    if (stored) return stored;
    
    // Detect system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  toggleTheme() {
    const current = this.getTheme();
    const newTheme = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  }
  
  initializeTheme() {
    const stored = localStorage.getItem('ubq-theme');
    if (stored) {
      this.setTheme(stored);
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('ubq-theme')) {
        // Only auto-switch if user hasn't set a preference
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
  
  destroy() {
    // Remove event listeners
    // Clean up timers
    this.clearAutoHideTimer();
    
    // Remove classes
    document.body.classList.remove('ubq-nav-open', 'ubq-nav-mobile', 'ubq-theme-light', 'ubq-theme-dark');
    
    console.log('🗑️ Ubiquiti Navigation System destroyed');
  }
}

// CSS Styles for Navigation
const navigationStyles = `
<style>
/* ===== UBIQUITI NAVIGATION STYLES ===== */

.ubq-nav-toggle {
  position: fixed;
  top: var(--ubq-space-4);
  left: var(--ubq-space-4);
  z-index: var(--ubq-z-fixed);
  width: 48px;
  height: 48px;
  border-radius: var(--ubq-radius-lg);
  background: var(--ubq-bg-elevated);
  border: 1px solid var(--ubq-border-primary);
  box-shadow: var(--ubq-shadow-md);
  backdrop-filter: blur(10px);
}

.ubq-nav-toggle:hover {
  background: var(--ubq-bg-secondary);
  transform: scale(1.05);
}

.ubq-nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--ubq-z-modal-backdrop);
  opacity: 0;
  visibility: hidden;
  transition: all var(--ubq-transition-base);
}

.ubq-nav-overlay-visible {
  opacity: 1;
  visibility: visible;
}

.ubq-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 320px;
  height: 100vh;
  background: var(--ubq-bg-elevated);
  border-right: 1px solid var(--ubq-border-primary);
  box-shadow: var(--ubq-shadow-xl);
  z-index: var(--ubq-z-modal);
  transform: translateX(-100%);
  transition: transform var(--ubq-transition-base);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ubq-nav-visible {
  transform: translateX(0);
}

.ubq-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ubq-space-6);
  border-bottom: 1px solid var(--ubq-border-primary);
  background: var(--ubq-bg-secondary);
}

.ubq-nav-brand {
  display: flex;
  align-items: center;
  gap: var(--ubq-space-3);
}

.ubq-nav-logo {
  width: 32px;
  height: 32px;
  border-radius: var(--ubq-radius-md);
  object-fit: contain;
}

.ubq-nav-title {
  font-size: var(--ubq-text-lg);
  font-weight: 600;
  color: var(--ubq-text-primary);
}

.ubq-nav-close {
  width: 40px;
  height: 40px;
  padding: 0;
}

.ubq-nav-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--ubq-space-4) 0;
}

.ubq-nav-menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ubq-nav-item {
  margin: 0;
}

.ubq-nav-link {
  display: flex;
  align-items: center;
  gap: var(--ubq-space-3);
  padding: var(--ubq-space-4) var(--ubq-space-6);
  color: var(--ubq-text-secondary);
  text-decoration: none;
  transition: all var(--ubq-transition-fast);
  border-left: 3px solid transparent;
  font-weight: 500;
  min-height: 52px; /* Touch-friendly */
}

.ubq-nav-link:hover {
  background: var(--ubq-bg-secondary);
  color: var(--ubq-text-primary);
  border-left-color: var(--ubq-blue-200);
}

.ubq-nav-link.active {
  background: var(--ubq-blue-50);
  color: var(--ubq-blue-600);
  border-left-color: var(--ubq-blue-600);
}

.ubq-nav-link:focus {
  outline: 2px solid var(--ubq-blue-500);
  outline-offset: -2px;
}

.ubq-nav-link-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.ubq-nav-footer {
  padding: var(--ubq-space-6);
  border-top: 1px solid var(--ubq-border-primary);
  background: var(--ubq-bg-secondary);
}

.ubq-nav-status {
  display: flex;
  align-items: center;
  gap: var(--ubq-space-2);
}

.ubq-status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ubq-gray-400);
}

.ubq-status-online {
  background: var(--ubq-success);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

/* Mobile styles */
.ubq-nav-mobile .ubq-nav {
  width: 100%;
  max-width: 320px;
}

.ubq-nav-mobile .ubq-nav-toggle {
  display: block;
}

/* Desktop styles */
@media (min-width: 768px) {
  .ubq-nav-toggle {
    display: none;
  }
  
  .ubq-nav {
    position: relative;
    transform: none;
    width: 280px;
    height: auto;
    box-shadow: none;
    border-right: 1px solid var(--ubq-border-primary);
  }
  
  .ubq-nav-overlay {
    display: none;
  }
  
  .ubq-nav-close {
    display: none;
  }
}

/* Prevent body scroll when navigation is open */
.ubq-nav-open {
  overflow: hidden;
}

/* Dark theme adjustments */
@media (prefers-color-scheme: dark) {
  .ubq-nav-link.active {
    background: rgba(59, 130, 246, 0.1);
    color: var(--ubq-blue-400);
    border-left-color: var(--ubq-blue-400);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .ubq-nav,
  .ubq-nav-overlay,
  .ubq-nav-link {
    transition: none;
  }
}
</style>
`;

// Inject styles
if (!document.querySelector('#ubq-nav-styles')) {
  document.head.insertAdjacentHTML('beforeend', navigationStyles.replace('<style>', '<style id="ubq-nav-styles">'));
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.ubqNavigation) {
      window.ubqNavigation = new UbiquitiNavigation();
    }
  });
} else {
  if (!window.ubqNavigation) {
    window.ubqNavigation = new UbiquitiNavigation();
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UbiquitiNavigation;
}

if (typeof define === 'function' && define.amd) {
  define(() => UbiquitiNavigation);
}
