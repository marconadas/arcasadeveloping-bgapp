/**
 * FontAwesome Fallback Detection
 * Detecta se o FontAwesome carregou corretamente e aplica fallbacks se necessário
 */

class FontAwesomeFallback {
    constructor() {
        this.testElement = null;
        this.fallbackApplied = false;
        
        this.init();
    }

    init() {
        // Aguardar o DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.checkFontAwesome());
        } else {
            this.checkFontAwesome();
        }
    }

    checkFontAwesome() {
        // Criar elemento de teste invisível
        this.testElement = document.createElement('span');
        this.testElement.className = 'fontawesome-test';
        this.testElement.style.position = 'absolute';
        this.testElement.style.left = '-9999px';
        this.testElement.style.visibility = 'hidden';
        document.body.appendChild(this.testElement);

        // Aguardar um momento para as fontes carregarem
        setTimeout(() => {
            this.performTest();
        }, 100);

        // Teste adicional após mais tempo
        setTimeout(() => {
            if (!this.fallbackApplied) {
                this.performTest();
            }
        }, 1000);
    }

    performTest() {
        if (!this.testElement) return;

        const computedStyle = window.getComputedStyle(this.testElement);
        const fontFamily = computedStyle.getPropertyValue('font-family');
        
        // Se FontAwesome não carregou, aplicar fallback
        if (!fontFamily.includes('Font Awesome')) {
            this.applyFallback();
        } else {
            console.log('✅ FontAwesome carregado com sucesso');
        }
    }

    applyFallback() {
        if (this.fallbackApplied) return;
        
        console.warn('⚠️ FontAwesome não carregou, aplicando fallbacks...');
        
        // Adicionar classe ao body para ativar fallbacks CSS
        document.body.classList.add('no-fontawesome');
        
        // Carregar CSS de fallback se não estiver carregado
        this.loadFallbackCSS();
        
        this.fallbackApplied = true;
    }

    loadFallbackCSS() {
        // Verificar se o CSS de fallback já foi carregado
        const existingLink = document.querySelector('link[href*="fontawesome-fallback.css"]');
        if (existingLink) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/fontawesome-fallback.css';
        link.onload = () => {
            console.log('✅ FontAwesome fallback CSS carregado');
        };
        link.onerror = () => {
            console.error('❌ Erro ao carregar FontAwesome fallback CSS');
        };
        
        document.head.appendChild(link);
    }

    cleanup() {
        if (this.testElement && this.testElement.parentNode) {
            this.testElement.parentNode.removeChild(this.testElement);
            this.testElement = null;
        }
    }

    // Método público para forçar aplicação do fallback
    forceFallback() {
        this.applyFallback();
    }

    // Método público para verificar se fallback foi aplicado
    isFallbackActive() {
        return this.fallbackApplied;
    }
}

// Inicializar automaticamente
const fontAwesomeFallback = new FontAwesomeFallback();

// Expor globalmente para uso opcional
if (typeof window !== 'undefined') {
    window.FontAwesomeFallback = FontAwesomeFallback;
    window.fontAwesomeFallback = fontAwesomeFallback;
}

// Limpar após 5 segundos para economizar memória
setTimeout(() => {
    fontAwesomeFallback.cleanup();
}, 5000);
