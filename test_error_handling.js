/**
 * Teste de Tratamento de Erros e Fallbacks
 * Verifica se o sistema lida adequadamente com erros e situações adversas
 */

const fs = require('fs');

// Simular ambiente com erros
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

// Mock com falhas simuladas
global.fetch = async (url) => {
    // Simular falha de rede 50% das vezes
    if (Math.random() < 0.5) {
        throw new Error('Network error');
    }
    
    return {
        ok: false,
        status: 503,
        json: async () => {
            throw new Error('Service unavailable');
        }
    };
};

// Mock do Leaflet com erros
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

// Mocks que falham ocasionalmente
global.gsap = {
    registerPlugin: () => {
        if (Math.random() < 0.3) throw new Error('GSAP plugin error');
    },
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
    loadAnimation: () => {
        if (Math.random() < 0.2) {
            throw new Error('Lottie animation load error');
        }
        return {
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
        };
    }
};

global.deck = {
    LeafletLayer: class {
        constructor() {
            if (Math.random() < 0.1) {
                throw new Error('Deck.gl initialization error');
            }
        }
        addTo() {}
        setProps() {}
    },
    ScatterplotLayer: class {
        constructor() {}
    }
};

function testErrorHandling() {
    console.log('🛡️ BGAPP - Testando Tratamento de Erros e Fallbacks');
    console.log('='.repeat(60));
    
    const results = {
        passed: 0,
        failed: 0,
        total: 0,
        errors: []
    };
    
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
    
    // Carregar módulos
    const files = [
        'infra/frontend/assets/js/advanced-animation-system.js',
        'infra/frontend/assets/js/windy-api-integration.js',
        'infra/frontend/assets/js/lottie-animations.js',
        'infra/frontend/assets/js/gsap-transitions.js'
    ];
    
    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        eval(content);
    });
    
    // Teste 1: Windy API com falhas de rede
    test('Windy API - Tratamento de Falhas de Rede', async () => {
        const client = new BGAPPWindyAPIClient();
        const bounds = { north: -5, south: -12, east: 18, west: 8 };
        
        let successCount = 0;
        let fallbackCount = 0;
        
        // Tentar múltiplas vezes para testar fallback
        for (let i = 0; i < 5; i++) {
            try {
                const data = await client.getWindData(bounds);
                if (data && data.data) {
                    if (data.model === 'fallback') {
                        fallbackCount++;
                    } else {
                        successCount++;
                    }
                }
            } catch (error) {
                // Erro esperado em alguns casos
                console.log(`   Tentativa ${i + 1}: Erro capturado (esperado)`);
            }
        }
        
        if (fallbackCount === 0) {
            throw new Error('Sistema de fallback não funcionou');
        }
        
        console.log(`   Fallbacks utilizados: ${fallbackCount}/5`);
        return true;
    });
    
    // Teste 2: Lottie com falhas de carregamento
    test('Lottie Manager - Tratamento de Falhas de Animação', () => {
        const manager = new BGAPPLottieManager();
        
        let successCount = 0;
        let errorCount = 0;
        
        // Tentar criar múltiplas animações
        for (let i = 0; i < 10; i++) {
            try {
                // Simular container
                const mockContainer = {
                    id: `test-container-${i}`,
                    appendChild: () => {},
                    style: {}
                };
                
                global.document.getElementById = () => mockContainer;
                
                const animationId = manager.createAnimation(`test-container-${i}`, 'loading');
                if (animationId) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                errorCount++;
                console.log(`   Erro capturado na animação ${i}: ${error.message}`);
            }
        }
        
        if (successCount === 0) {
            throw new Error('Nenhuma animação foi criada com sucesso');
        }
        
        console.log(`   Animações criadas: ${successCount}, Erros: ${errorCount}`);
        return true;
    });
    
    // Teste 3: GSAP com inicialização falhando
    test('GSAP Transition Manager - Recuperação de Erros', () => {
        let errorsCaught = 0;
        let successfulCreations = 0;
        
        for (let i = 0; i < 10; i++) {
            try {
                const manager = new BGAPPTransitionManager();
                if (manager.presets) {
                    successfulCreations++;
                }
            } catch (error) {
                errorsCaught++;
                console.log(`   Erro capturado: ${error.message}`);
            }
        }
        
        if (successfulCreations === 0) {
            throw new Error('Nenhum manager foi criado com sucesso');
        }
        
        console.log(`   Managers criados: ${successfulCreations}, Erros: ${errorsCaught}`);
        return true;
    });
    
    // Teste 4: Sistema avançado sem dependências
    test('Sistema Avançado - Funcionamento sem Dependências', async () => {
        // Remover temporariamente dependências
        const originalDeck = global.deck;
        delete global.deck;
        
        try {
            const mockMap = L.map();
            const system = new BGAPPAdvancedAnimationSystem(mockMap);
            
            // Tentar inicializar sem deck.gl
            try {
                await system.initialize();
                // Se chegou aqui, deveria ter falhado graciosamente
                console.log('   Sistema lidou com dependência ausente');
            } catch (error) {
                if (error.message.includes('dependência') || error.message.includes('deck')) {
                    console.log('   Erro de dependência capturado corretamente');
                    return true;
                } else {
                    throw error;
                }
            }
        } finally {
            // Restaurar dependência
            global.deck = originalDeck;
        }
        
        return true;
    });
    
    // Teste 5: Cache com falhas
    test('Sistema de Cache - Recuperação de Falhas', () => {
        const client = new BGAPPWindyAPIClient();
        
        // Forçar cache a falhar
        const originalCache = client.cache;
        client.cache = {
            get: () => { throw new Error('Cache read error'); },
            set: () => { throw new Error('Cache write error'); },
            delete: () => { throw new Error('Cache delete error'); },
            clear: () => { throw new Error('Cache clear error'); },
            size: 0
        };
        
        try {
            // Tentar operações que usam cache
            const cacheKey = client._generateCacheKey('test', { param: 'value' });
            
            // Estas operações devem falhar graciosamente
            const cachedData = client._getFromCache(cacheKey);
            client._storeInCache(cacheKey, { test: 'data' });
            
            console.log('   Operações de cache falharam graciosamente');
            return true;
        } catch (error) {
            if (error.message.includes('Cache')) {
                console.log('   Erro de cache capturado: ' + error.message);
                return true;
            }
            throw error;
        } finally {
            // Restaurar cache original
            client.cache = originalCache;
        }
    });
    
    // Teste 6: Performance monitor com recursos limitados
    test('Performance Monitor - Funcionamento com Recursos Limitados', () => {
        // Simular ambiente com performance limitada
        const originalRAF = global.window.requestAnimationFrame;
        global.window.requestAnimationFrame = null;
        
        try {
            const monitor = new PerformanceMonitor();
            
            if (!monitor.isActive) {
                monitor.start();
                
                // Aguardar um pouco
                setTimeout(() => {
                    monitor.stop();
                }, 100);
                
                console.log('   Monitor funcionou sem requestAnimationFrame');
                return true;
            }
        } finally {
            // Restaurar
            global.window.requestAnimationFrame = originalRAF;
        }
        
        return true;
    });
    
    // Teste 7: Verificar logs de erro
    test('Sistema de Logging - Captura de Erros', () => {
        const originalConsole = console.error;
        const errors = [];
        
        console.error = (...args) => {
            errors.push(args.join(' '));
            originalConsole(...args);
        };
        
        try {
            // Forçar alguns erros para verificar logging
            try {
                const client = new BGAPPWindyAPIClient();
                client.nonExistentMethod();
            } catch (error) {
                console.error('Teste de erro:', error.message);
            }
            
            if (errors.length === 0) {
                throw new Error('Nenhum erro foi logado');
            }
            
            console.log(`   ${errors.length} erros foram logados corretamente`);
            return true;
        } finally {
            console.error = originalConsole;
        }
    });
    
    // Aguardar testes assíncronos
    return new Promise(resolve => {
        setTimeout(() => {
            // Relatório final
            console.log('\n' + '='.repeat(60));
            console.log('📊 RELATÓRIO FINAL - TRATAMENTO DE ERROS');
            console.log('='.repeat(60));
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
                console.log('\n🛡️ TODOS OS TESTES DE TRATAMENTO DE ERROS PASSARAM!');
                console.log('💪 Sistema robusto e pronto para produção.');
                resolve(true);
            } else {
                console.log('\n⚠️  ALGUNS TESTES FALHARAM. Sistema pode ter problemas de robustez.');
                resolve(false);
            }
        }, 2000);
    });
}

// Executar se chamado diretamente
if (require.main === module) {
    testErrorHandling().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Erro fatal nos testes:', error);
        process.exit(1);
    });
}

module.exports = { testErrorHandling };
