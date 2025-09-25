/**
 * BGAPP Admin Panel - Testing Module
 * Testa se todos os módulos estão carregados corretamente
 */

class AdminTester {
    constructor() {
        this.tests = [];
        this.results = {};
    }

    // Adicionar um teste
    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    // Executar todos os testes
    async runAllTests() {
        console.log('🧪 Iniciando testes do Admin Panel...');
        
        for (const test of this.tests) {
            try {
                const result = await test.testFunction();
                this.results[test.name] = { success: true, result };
                console.log(`✅ ${test.name}: PASSOU`);
            } catch (error) {
                this.results[test.name] = { success: false, error: error.message };
                console.error(`❌ ${test.name}: FALHOU - ${error.message}`);
            }
        }
        
        return this.results;
    }

    // Teste específico do AdminMobileMenu
    testAdminMobileMenu() {
        return new Promise((resolve, reject) => {
            // Verificar se a classe existe
            if (typeof window.AdminMobileMenu === 'undefined') {
                reject(new Error('Classe AdminMobileMenu não encontrada'));
                return;
            }

            // Verificar se a instância existe
            if (typeof window.adminMobileMenu === 'undefined') {
                // Tentar criar instância
                try {
                    window.adminMobileMenu = new window.AdminMobileMenu();
                } catch (e) {
                    reject(new Error('Não foi possível criar instância: ' + e.message));
                    return;
                }
            }

            // Verificar métodos públicos
            const requiredMethods = ['isMenuOpen', 'destroy'];
            for (const method of requiredMethods) {
                if (typeof window.adminMobileMenu[method] !== 'function') {
                    reject(new Error(`Método ${method} não encontrado`));
                    return;
                }
            }

            // Verificar elementos DOM
            const requiredElements = ['mobile-menu-btn', 'sidebar', 'mobile-overlay'];
            for (const elementId of requiredElements) {
                if (!document.getElementById(elementId)) {
                    reject(new Error(`Elemento ${elementId} não encontrado no DOM`));
                    return;
                }
            }

            resolve({
                class: 'AdminMobileMenu carregada',
                instance: 'adminMobileMenu inicializada',
                methods: requiredMethods.join(', '),
                elements: requiredElements.join(', '),
                isOpen: window.adminMobileMenu.isMenuOpen()
            });
        });
    }

    // Teste do FontAwesome Fallback
    testFontAwesomeFallback() {
        return new Promise((resolve, reject) => {
            if (typeof window.FontAwesomeFallback === 'undefined') {
                reject(new Error('FontAwesomeFallback não encontrado'));
                return;
            }

            if (typeof window.fontAwesomeFallback === 'undefined') {
                reject(new Error('Instância fontAwesomeFallback não encontrada'));
                return;
            }

            resolve({
                class: 'FontAwesomeFallback carregada',
                instance: 'fontAwesomeFallback inicializada',
                fallbackActive: window.fontAwesomeFallback.isFallbackActive()
            });
        });
    }

    // Teste dos arquivos CSS
    testCSSFiles() {
        return new Promise((resolve) => {
            const cssFiles = [
                'admin.css',
                'components.css', 
                'admin-inline.css',
                'fontawesome-fallback.css'
            ];

            const loadedFiles = [];
            const stylesheets = Array.from(document.styleSheets);
            
            for (const css of cssFiles) {
                const found = stylesheets.some(sheet => 
                    sheet.href && sheet.href.includes(css)
                );
                if (found) {
                    loadedFiles.push(css);
                }
            }

            resolve({
                expected: cssFiles.length,
                loaded: loadedFiles.length,
                files: loadedFiles.join(', ')
            });
        });
    }

    // Executar teste rápido
    quickTest() {
        const results = {
            AdminMobileMenu: {
                class: typeof window.AdminMobileMenu !== 'undefined',
                instance: typeof window.adminMobileMenu !== 'undefined'
            },
            FontAwesomeFallback: {
                class: typeof window.FontAwesomeFallback !== 'undefined',
                instance: typeof window.fontAwesomeFallback !== 'undefined'
            },
            DOM: {
                mobileMenuBtn: !!document.getElementById('mobile-menu-btn'),
                sidebar: !!document.getElementById('sidebar'),
                overlay: !!document.getElementById('mobile-overlay')
            }
        };

        console.table(results);
        return results;
    }
}

// Inicializar tester
const adminTester = new AdminTester();

// Adicionar testes
adminTester.addTest('AdminMobileMenu', () => adminTester.testAdminMobileMenu());
adminTester.addTest('FontAwesomeFallback', () => adminTester.testFontAwesomeFallback());
adminTester.addTest('CSS Files', () => adminTester.testCSSFiles());

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.AdminTester = AdminTester;
    window.adminTester = adminTester;
    
    // Executar teste rápido após carregamento
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('🔍 Teste rápido do Admin Panel:');
            adminTester.quickTest();
        }, 500);
    });
}

// Função helper para executar no console
window.testAdmin = () => {
    return adminTester.runAllTests();
};
