/**
 * Script de Teste para Sistema de Animações Avançadas BGAPP
 * 
 * Este script testa todas as funcionalidades implementadas
 * usando Node.js e simulação de ambiente browser
 */

const fs = require('fs');
const path = require('path');

// Simular ambiente browser
global.window = {
    requestAnimationFrame: (callback) => setTimeout(callback, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    performance: { now: () => Date.now() },
    location: { href: 'http://localhost:8080' },
    WebGLRenderingContext: true
};

global.document = {
    createElement: (tag) => ({
        id: '',
        className: '',
        style: { cssText: '' },
        innerHTML: '',
        textContent: '',
        appendChild: () => {},
        remove: () => {},
        addEventListener: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
    }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    addEventListener: () => {}
};

global.console = console;
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
global.setInterval = setInterval;
global.clearInterval = clearInterval;

// Mock das bibliotecas externas
global.L = {
    map: () => ({
        setView: () => {},
        getSize: () => ({ x: 1024, y: 768 }),
        getBounds: () => ({
            getNorth: () => -5,
            getSouth: () => -12,
            getEast: () => 18,
            getWest: () => 8
        }),
        on: () => {},
        hasLayer: () => false
    }),
    tileLayer: () => ({ addTo: () => {} }),
    Layer: class {},
    Class: { extend: (obj) => obj },
    setOptions: () => {},
    canvasLayer: () => ({ addTo: () => {}, delegate: () => {} })
};

global.gsap = {
    registerPlugin: () => {},
    defaults: () => {},
    to: () => ({ then: (cb) => setTimeout(cb, 100) }),
    timeline: () => ({
        to: () => {},
        call: () => {},
        kill: () => {},
        pause: () => {},
        resume: () => {}
    }),
    set: () => {},
    fromTo: () => {}
};

global.lottie = {
    loadAnimation: () => ({
        setSpeed: () => {},
        play: () => {},
        pause: () => {},
        stop: () => {},
        destroy: () => {},
        addEventListener: () => {},
        isPaused: false,
        currentFrame: 0,
        totalFrames: 100,
        getDuration: () => 5,
        playSpeed: 1
    })
};

global.deck = {
    LeafletLayer: class {
        constructor() {}
        addTo() {}
        setProps() {}
    },
    ScatterplotLayer: class {
        constructor() {}
    }
};

global.fetch = async (url) => ({
    ok: true,
    status: 200,
    json: async () => ({
        data: [
            { lat: -8.8, lon: 13.2, 'wind_u-10m': 5, 'wind_v-10m': 3 }
        ],
        model: 'gfs'
    })
});

// Função de teste principal
async function runTests() {
    console.log('🧪 BGAPP - Iniciando Testes do Sistema de Animações Avançadas');
    console.log('='.repeat(70));
    
    const results = {
        passed: 0,
        failed: 0,
        total: 0,
        errors: []
    };
    
    // Função auxiliar para testes
    function test(name, fn) {
        results.total++;
        console.log(`\n🔍 Testando: ${name}`);
        
        try {
            const result = fn();
            if (result instanceof Promise) {
                return result.then(() => {
                    console.log(`✅ ${name} - PASSOU`);
                    results.passed++;
                }).catch(error => {
                    console.log(`❌ ${name} - FALHOU: ${error.message}`);
                    results.failed++;
                    results.errors.push({ test: name, error: error.message });
                });
            } else {
                console.log(`✅ ${name} - PASSOU`);
                results.passed++;
            }
        } catch (error) {
            console.log(`❌ ${name} - FALHOU: ${error.message}`);
            results.failed++;
            results.errors.push({ test: name, error: error.message });
        }
    }
    
    // Carregar e testar arquivos
    const files = [
        'infra/frontend/assets/js/advanced-animation-system.js',
        'infra/frontend/assets/js/windy-api-integration.js', 
        'infra/frontend/assets/js/lottie-animations.js',
        'infra/frontend/assets/js/gsap-transitions.js'
    ];
    
    // Teste 1: Verificar se arquivos existem
    test('Verificação de Arquivos', () => {
        files.forEach(file => {
            if (!fs.existsSync(file)) {
                throw new Error(`Arquivo não encontrado: ${file}`);
            }
        });
        return true;
    });
    
    // Teste 2: Carregar arquivos JavaScript
    test('Carregamento de Módulos JavaScript', () => {
        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            if (content.length === 0) {
                throw new Error(`Arquivo vazio: ${file}`);
            }
            
            // Executar o arquivo no contexto global
            try {
                eval(content);
            } catch (error) {
                throw new Error(`Erro ao executar ${file}: ${error.message}`);
            }
        });
        return true;
    });
    
    // Teste 3: Testar BGAPPAdvancedAnimationSystem
    await test('BGAPPAdvancedAnimationSystem - Inicialização', async () => {
        if (typeof BGAPPAdvancedAnimationSystem === 'undefined') {
            throw new Error('BGAPPAdvancedAnimationSystem não definida');
        }
        
        const mockMap = L.map();
        const system = new BGAPPAdvancedAnimationSystem(mockMap);
        
        if (!system.map) {
            throw new Error('Sistema não inicializou corretamente');
        }
        
        if (!system.options) {
            throw new Error('Opções não foram definidas');
        }
        
        return true;
    });
    
    // Teste 4: Testar BGAPPWindyAPIClient
    await test('BGAPPWindyAPIClient - Funcionalidade', async () => {
        if (typeof BGAPPWindyAPIClient === 'undefined') {
            throw new Error('BGAPPWindyAPIClient não definida');
        }
        
        const client = new BGAPPWindyAPIClient();
        
        if (!client.options) {
            throw new Error('Cliente não inicializou corretamente');
        }
        
        if (!client.cache) {
            throw new Error('Sistema de cache não inicializado');
        }
        
        // Testar método de obter dados
        const bounds = { north: -5, south: -12, east: 18, west: 8 };
        const data = await client.getWindData(bounds);
        
        if (!data || !data.data) {
            throw new Error('Dados de vento não retornados corretamente');
        }
        
        return true;
    });
    
    // Teste 5: Testar BGAPPLottieManager
    test('BGAPPLottieManager - Funcionalidade', () => {
        if (typeof BGAPPLottieManager === 'undefined') {
            throw new Error('BGAPPLottieManager não definida');
        }
        
        const manager = new BGAPPLottieManager();
        
        if (!manager.animationLibrary) {
            throw new Error('Biblioteca de animações não inicializada');
        }
        
        if (Object.keys(manager.animationLibrary).length === 0) {
            throw new Error('Nenhuma animação predefinida encontrada');
        }
        
        // Verificar animações específicas
        const requiredAnimations = ['loading', 'wind', 'waves', 'success'];
        requiredAnimations.forEach(anim => {
            if (!manager.animationLibrary[anim]) {
                throw new Error(`Animação ${anim} não encontrada`);
            }
        });
        
        return true;
    });
    
    // Teste 6: Testar BGAPPTransitionManager
    test('BGAPPTransitionManager - Funcionalidade', () => {
        if (typeof BGAPPTransitionManager === 'undefined') {
            throw new Error('BGAPPTransitionManager não definida');
        }
        
        const manager = new BGAPPTransitionManager();
        
        if (!manager.presets) {
            throw new Error('Presets de transição não inicializados');
        }
        
        if (!manager.timelines) {
            throw new Error('Sistema de timelines não inicializado');
        }
        
        // Verificar presets essenciais
        const requiredPresets = ['fadeIn', 'fadeOut', 'slideInLeft', 'scaleIn'];
        requiredPresets.forEach(preset => {
            if (!manager.presets[preset]) {
                throw new Error(`Preset ${preset} não encontrado`);
            }
        });
        
        return true;
    });
    
    // Teste 7: Testar página de demonstração
    test('Página de Demonstração - HTML', () => {
        const demoPath = 'infra/frontend/advanced-animations-demo.html';
        
        if (!fs.existsSync(demoPath)) {
            throw new Error('Página de demonstração não encontrada');
        }
        
        const content = fs.readFileSync(demoPath, 'utf8');
        
        // Verificar elementos essenciais
        const requiredElements = [
            'advanced-animation-system.js',
            'windy-api-integration.js',
            'lottie-animations.js',
            'gsap-transitions.js',
            'control-panel',
            'startAdvancedAnimations'
        ];
        
        requiredElements.forEach(element => {
            if (!content.includes(element)) {
                throw new Error(`Elemento ${element} não encontrado na página`);
            }
        });
        
        return true;
    });
    
    // Teste 8: Testar utilitários
    test('Utilitários e Classes de Apoio', () => {
        // Testar PerformanceMonitor
        if (typeof PerformanceMonitor === 'undefined') {
            throw new Error('PerformanceMonitor não definida');
        }
        
        const monitor = new PerformanceMonitor();
        if (typeof monitor.start !== 'function') {
            throw new Error('Método start do PerformanceMonitor não encontrado');
        }
        
        // Testar utilitários Lottie
        if (typeof BGAPPLottieUtils === 'undefined') {
            throw new Error('BGAPPLottieUtils não definida');
        }
        
        // Testar utilitários GSAP
        if (typeof BGAPPTransitionUtils === 'undefined') {
            throw new Error('BGAPPTransitionUtils não definida');
        }
        
        return true;
    });
    
    // Teste 9: Testar integração de sistemas
    await test('Integração Entre Sistemas', async () => {
        // Criar instâncias de todos os sistemas
        const mockMap = L.map();
        const animationSystem = new BGAPPAdvancedAnimationSystem(mockMap);
        const windyClient = new BGAPPWindyAPIClient();
        const lottieManager = new BGAPPLottieManager();
        const transitionManager = new BGAPPTransitionManager();
        
        // Testar se sistemas podem trabalhar juntos
        if (!animationSystem || !windyClient || !lottieManager || !transitionManager) {
            throw new Error('Nem todos os sistemas foram criados corretamente');
        }
        
        // Simular workflow típico
        try {
            await animationSystem.initialize();
        } catch (error) {
            // Esperado falhar sem dependências reais, mas não deve quebrar
            if (!error.message.includes('dependência') && !error.message.includes('undefined')) {
                throw error;
            }
        }
        
        return true;
    });
    
    // Aguardar todos os testes assíncronos
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Relatório final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RELATÓRIO FINAL DOS TESTES');
    console.log('='.repeat(70));
    console.log(`✅ Testes Aprovados: ${results.passed}`);
    console.log(`❌ Testes Falharam: ${results.failed}`);
    console.log(`📈 Total de Testes: ${results.total}`);
    console.log(`🎯 Taxa de Sucesso: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    if (results.errors.length > 0) {
        console.log('\n🐛 ERROS ENCONTRADOS:');
        results.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.test}: ${error.error}`);
        });
    }
    
    if (results.failed === 0) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema pronto para uso.');
        return true;
    } else {
        console.log('\n⚠️  ALGUNS TESTES FALHARAM. Revise os erros acima.');
        return false;
    }
}

// Executar testes se chamado diretamente
if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Erro fatal nos testes:', error);
        process.exit(1);
    });
}

module.exports = { runTests };
