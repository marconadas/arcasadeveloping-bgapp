/**
 * 🎨 UNREAL ENGINE UI COMPONENTS - BGAPP
 * Advanced UI components inspired by Unreal Engine's interface system
 * 
 * Features:
 * - Blueprint-style node editor
 * - Cinematic transitions
 * - Advanced tooltips
 * - Context menus
 * - Drag & drop system
 * - Viewport controls
 * - Scientific data widgets
 * - Real-time notifications
 */

class UnrealUIComponents {
    constructor() {
        this.components = new Map();
        this.activeTooltip = null;
        this.dragData = null;
        this.contextMenu = null;
        
        this.init();
    }
    
    init() {
        console.log('🎨 Inicializando Unreal UI Components...');
        
        this.setupGlobalStyles();
        this.setupEventListeners();
        this.createNotificationSystem();
        this.createTooltipSystem();
        this.createContextMenuSystem();
        
        console.log('✅ Unreal UI Components inicializados');
    }
    
    setupGlobalStyles() {
        // Inject global styles for components
        const style = document.createElement('style');
        style.textContent = `
            .unreal-component {
                font-family: var(--font-ui, 'Inter', sans-serif);
                box-sizing: border-box;
            }
            
            .unreal-fade-in {
                animation: unrealFadeIn 0.3s ease-out forwards;
            }
            
            .unreal-fade-out {
                animation: unrealFadeOut 0.2s ease-in forwards;
            }
            
            @keyframes unrealFadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes unrealFadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.hideTooltip();
                this.hideContextMenu();
            }
        });
        
        // Hide context menu on click outside
        document.addEventListener('click', (e) => {
            if (this.contextMenu && !this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });
    }
    
    // Notification System
    createNotificationSystem() {
        const container = document.createElement('div');
        container.id = 'unreal-notifications';
        container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        
        this.notificationContainer = container;
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `unreal-notification unreal-notification-${type}`;
        notification.style.cssText = `
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid ${this.getNotificationColor(type)};
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 12px;
            color: white;
            font-size: 14px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            pointer-events: auto;
            cursor: pointer;
            transition: all 0.3s ease;
            max-width: 350px;
            word-wrap: break-word;
        `;
        
        const icon = this.getNotificationIcon(type);
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="color: ${this.getNotificationColor(type)}; font-size: 16px;">${icon}</span>
                <span>${message}</span>
                <button style="
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    font-size: 18px;
                    margin-left: auto;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        notification.classList.add('unreal-fade-in');
        this.notificationContainer.appendChild(notification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.classList.add('unreal-fade-out');
                    setTimeout(() => notification.remove(), 200);
                }
            }, duration);
        }
        
        return notification;
    }
    
    getNotificationColor(type) {
        const colors = {
            info: '#00d4ff',
            success: '#00ff88',
            warning: '#ff8800',
            error: '#ff4444'
        };
        return colors[type] || colors.info;
    }
    
    getNotificationIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }
    
    // Tooltip System
    createTooltipSystem() {
        const tooltip = document.createElement('div');
        tooltip.id = 'unreal-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 212, 255, 0.5);
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 12px;
            color: white;
            z-index: 10001;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            max-width: 250px;
            word-wrap: break-word;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(tooltip);
        
        this.tooltip = tooltip;
        
        // Setup tooltip listeners
        document.addEventListener('mouseover', (e) => {
            const element = e.target.closest('[data-tooltip]');
            if (element) {
                this.showTooltip(element.dataset.tooltip, e);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            const element = e.target.closest('[data-tooltip]');
            if (element) {
                this.hideTooltip();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.activeTooltip) {
                this.updateTooltipPosition(e);
            }
        });
    }
    
    showTooltip(text, event) {
        if (!text) return;
        
        this.tooltip.textContent = text;
        this.tooltip.style.opacity = '1';
        this.activeTooltip = true;
        
        this.updateTooltipPosition(event);
    }
    
    updateTooltipPosition(event) {
        const tooltip = this.tooltip;
        const rect = tooltip.getBoundingClientRect();
        
        let x = event.clientX + 10;
        let y = event.clientY - rect.height - 10;
        
        // Keep tooltip in viewport
        if (x + rect.width > window.innerWidth) {
            x = event.clientX - rect.width - 10;
        }
        if (y < 0) {
            y = event.clientY + 10;
        }
        
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }
    
    hideTooltip() {
        this.tooltip.style.opacity = '0';
        this.activeTooltip = false;
    }
    
    // Context Menu System
    createContextMenuSystem() {
        document.addEventListener('contextmenu', (e) => {
            const element = e.target.closest('[data-context-menu]');
            if (element) {
                e.preventDefault();
                this.showContextMenu(element.dataset.contextMenu, e);
            }
        });
    }
    
    showContextMenu(menuId, event) {
        this.hideContextMenu();
        
        const menuData = this.getContextMenuData(menuId);
        if (!menuData) return;
        
        const menu = document.createElement('div');
        menu.className = 'unreal-context-menu';
        menu.style.cssText = `
            position: fixed;
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 6px;
            padding: 8px 0;
            z-index: 10002;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            min-width: 150px;
        `;
        
        menuData.items.forEach(item => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.style.cssText = `
                    height: 1px;
                    background: rgba(255, 255, 255, 0.1);
                    margin: 4px 0;
                `;
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.style.cssText = `
                    padding: 8px 16px;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;
                
                menuItem.innerHTML = `
                    ${item.icon ? `<span>${item.icon}</span>` : ''}
                    <span>${item.label}</span>
                    ${item.shortcut ? `<span style="margin-left: auto; color: rgba(255, 255, 255, 0.6); font-size: 12px;">${item.shortcut}</span>` : ''}
                `;
                
                menuItem.addEventListener('mouseenter', () => {
                    menuItem.style.backgroundColor = 'rgba(0, 212, 255, 0.2)';
                });
                
                menuItem.addEventListener('mouseleave', () => {
                    menuItem.style.backgroundColor = 'transparent';
                });
                
                menuItem.addEventListener('click', () => {
                    if (item.action) {
                        item.action();
                    }
                    this.hideContextMenu();
                });
                
                menu.appendChild(menuItem);
            }
        });
        
        // Position menu
        let x = event.clientX;
        let y = event.clientY;
        
        document.body.appendChild(menu);
        
        const rect = menu.getBoundingClientRect();
        
        // Keep menu in viewport
        if (x + rect.width > window.innerWidth) {
            x = window.innerWidth - rect.width - 10;
        }
        if (y + rect.height > window.innerHeight) {
            y = window.innerHeight - rect.height - 10;
        }
        
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.add('unreal-fade-in');
        
        this.contextMenu = menu;
    }
    
    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.classList.add('unreal-fade-out');
            setTimeout(() => {
                if (this.contextMenu && this.contextMenu.parentElement) {
                    this.contextMenu.remove();
                }
                this.contextMenu = null;
            }, 200);
        }
    }
    
    getContextMenuData(menuId) {
        const menus = {
            'data-point': {
                items: [
                    { icon: '📊', label: 'Ver Detalhes', action: () => console.log('Ver detalhes') },
                    { icon: '📈', label: 'Criar Gráfico', action: () => console.log('Criar gráfico') },
                    { separator: true },
                    { icon: '💾', label: 'Exportar Dados', action: () => console.log('Exportar') },
                    { icon: '🔗', label: 'Copiar Link', shortcut: 'Ctrl+C', action: () => console.log('Copiar') }
                ]
            },
            'ocean-view': {
                items: [
                    { icon: '🎯', label: 'Focar Aqui', action: () => console.log('Focar') },
                    { icon: '📸', label: 'Screenshot', shortcut: 'F12', action: () => console.log('Screenshot') },
                    { separator: true },
                    { icon: '⚙️', label: 'Configurações', action: () => console.log('Configurações') },
                    { icon: '🔄', label: 'Reset Câmera', shortcut: 'R', action: () => console.log('Reset') }
                ]
            }
        };
        
        return menus[menuId];
    }
    
    // Modal System
    createModal(title, content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'unreal-modal-backdrop';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10003;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'unreal-modal-content';
        modalContent.style.cssText = `
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 12px;
            padding: 0;
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;
        
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 20px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;
        
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        titleElement.style.cssText = `
            color: white;
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        `;
        
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s ease;
        `;
        
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.backgroundColor = 'rgba(255, 68, 68, 0.2)';
            closeButton.style.color = '#ff4444';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.backgroundColor = 'transparent';
            closeButton.style.color = 'rgba(255, 255, 255, 0.6)';
        });
        
        closeButton.addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        const body = document.createElement('div');
        body.style.cssText = `
            padding: 24px;
            color: white;
            overflow-y: auto;
            max-height: calc(90vh - 100px);
        `;
        
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.appendChild(content);
        }
        
        header.appendChild(titleElement);
        header.appendChild(closeButton);
        modalContent.appendChild(header);
        modalContent.appendChild(body);
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
        
        // Animate in
        setTimeout(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        }, 10);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        // Close on Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        return modal;
    }
    
    closeModal(modal) {
        modal.style.opacity = '0';
        modal.querySelector('.unreal-modal-content').style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 300);
    }
    
    closeAllModals() {
        const modals = document.querySelectorAll('.unreal-modal-backdrop');
        modals.forEach(modal => this.closeModal(modal));
    }
    
    // Progress Bar Component
    createProgressBar(container, options = {}) {
        const progressBar = document.createElement('div');
        progressBar.className = 'unreal-progress-bar';
        progressBar.style.cssText = `
            width: 100%;
            height: ${options.height || 6}px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
            position: relative;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.className = 'unreal-progress-fill';
        progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #00d4ff, #00ffaa);
            width: 0%;
            transition: width 0.3s ease;
            border-radius: 3px;
            box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        `;
        
        progressBar.appendChild(progressFill);
        
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        container.appendChild(progressBar);
        
        return {
            setProgress: (percent) => {
                progressFill.style.width = Math.max(0, Math.min(100, percent)) + '%';
            },
            remove: () => {
                progressBar.remove();
            }
        };
    }
    
    // Loading Spinner Component
    createLoadingSpinner(container, options = {}) {
        const spinner = document.createElement('div');
        spinner.className = 'unreal-loading-spinner';
        spinner.style.cssText = `
            width: ${options.size || 40}px;
            height: ${options.size || 40}px;
            position: relative;
            margin: ${options.margin || '20px auto'};
        `;
        
        spinner.innerHTML = `
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 3px solid transparent;
                border-top: 3px solid #00d4ff;
                border-radius: 50%;
                animation: unrealSpin 1s linear infinite;
            "></div>
            <div style="
                position: absolute;
                top: 6px;
                left: 6px;
                width: calc(100% - 12px);
                height: calc(100% - 12px);
                border: 2px solid transparent;
                border-bottom: 2px solid #00ffaa;
                border-radius: 50%;
                animation: unrealSpin 0.7s linear infinite reverse;
            "></div>
        `;
        
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        container.appendChild(spinner);
        
        return {
            remove: () => {
                spinner.remove();
            }
        };
    }
    
    // Button Component
    createButton(text, options = {}) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'unreal-button';
        button.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%);
            border: 1px solid #00d4ff;
            border-radius: 6px;
            color: white;
            padding: ${options.padding || '12px 24px'};
            font-family: inherit;
            font-size: ${options.fontSize || '14px'};
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        `;
        
        // Hover effect
        button.addEventListener('mouseenter', () => {
            button.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.4) 0%, rgba(0, 212, 255, 0.2) 100%)';
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 5px 15px rgba(0, 212, 255, 0.4)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)';
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });
        
        // Click effect
        button.addEventListener('mousedown', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 5px rgba(0, 212, 255, 0.2)';
        });
        
        // Click action
        if (options.onClick) {
            button.addEventListener('click', options.onClick);
        }
        
        return button;
    }
    
    // Scientific Data Widget
    createDataWidget(title, value, unit, options = {}) {
        const widget = document.createElement('div');
        widget.className = 'unreal-data-widget';
        widget.style.cssText = `
            background: rgba(0, 212, 255, 0.1);
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 8px;
            padding: 16px;
            margin: 8px 0;
            transition: all 0.2s ease;
            cursor: pointer;
        `;
        
        widget.innerHTML = `
            <div style="color: rgba(255, 255, 255, 0.7); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                ${title}
            </div>
            <div style="display: flex; align-items: baseline; gap: 8px;">
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700; color: #00ffaa; text-shadow: 0 0 10px #00ffaa;">
                    ${value}
                </span>
                <span style="font-size: 14px; color: rgba(255, 255, 255, 0.6);">
                    ${unit}
                </span>
            </div>
            ${options.trend ? `
                <div style="margin-top: 8px; font-size: 12px; color: ${options.trend > 0 ? '#00ff88' : '#ff4444'};">
                    ${options.trend > 0 ? '↗' : '↘'} ${Math.abs(options.trend)}%
                </div>
            ` : ''}
        `;
        
        widget.addEventListener('mouseenter', () => {
            widget.style.background = 'rgba(0, 212, 255, 0.2)';
            widget.style.transform = 'scale(1.02)';
        });
        
        widget.addEventListener('mouseleave', () => {
            widget.style.background = 'rgba(0, 212, 255, 0.1)';
            widget.style.transform = 'scale(1)';
        });
        
        return widget;
    }
}

// Initialize UI Components
window.unrealUI = new UnrealUIComponents();

// Utility functions for easy access
window.showNotification = (message, type, duration) => {
    return window.unrealUI.showNotification(message, type, duration);
};

window.createModal = (title, content, options) => {
    return window.unrealUI.createModal(title, content, options);
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnrealUIComponents;
}
