/**
 * Teste de Funcionalidade do Browser
 * Testa a página de demonstração usando simulação de browser
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Função para simular teste de browser
function testBrowserFunctionality() {
    console.log('🌐 BGAPP - Testando Funcionalidade do Browser');
    console.log('='.repeat(50));
    
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
            fn();
            console.log(`✅ ${name} - PASSOU`);
            results.passed++;
        } catch (error) {
            console.log(`❌ ${name} - FALHOU: ${error.message}`);
            results.failed++;
            results.errors.push({ test: name, error: error.message });
        }
    }
    
    // Teste 1: Verificar se a página HTML é válida
    test('Validação HTML da Página de Demonstração', () => {
        const htmlPath = 'infra/frontend/advanced-animations-demo.html';
        const content = fs.readFileSync(htmlPath, 'utf8');
        
        // Verificar estrutura HTML básica
        if (!content.includes('<!DOCTYPE html>')) {
            throw new Error('DOCTYPE não encontrado');
        }
        
        if (!content.includes('<html')) {
            throw new Error('Tag HTML não encontrada');
        }
        
        if (!content.includes('<head>')) {
            throw new Error('Tag HEAD não encontrada');
        }
        
        if (!content.includes('<body>')) {
            throw new Error('Tag BODY não encontrada');
        }
        
        // Verificar meta tags importantes
        if (!content.includes('charset="UTF-8"')) {
            throw new Error('Charset UTF-8 não definido');
        }
        
        if (!content.includes('viewport')) {
            throw new Error('Meta viewport não encontrada');
        }
    });
    
    // Teste 2: Verificar dependências JavaScript
    test('Dependências JavaScript na Página', () => {
        const htmlPath = 'infra/frontend/advanced-animations-demo.html';
        const content = fs.readFileSync(htmlPath, 'utf8');
        
        const requiredScripts = [
            'leaflet.js',
            'gsap.min.js',
            'lottie.min.js',
            'advanced-animation-system.js',
            'windy-api-integration.js',
            'lottie-animations.js',
            'gsap-transitions.js'
        ];
        
        requiredScripts.forEach(script => {
            if (!content.includes(script)) {
                throw new Error(`Script ${script} não encontrado na página`);
            }
        });
    });
    
    // Teste 3: Verificar CSS e estilos
    test('Estilos CSS da Página', () => {
        const htmlPath = 'infra/frontend/advanced-animations-demo.html';
        const content = fs.readFileSync(htmlPath, 'utf8');
        
        // Verificar se há estilos definidos
        if (!content.includes('<style>')) {
            throw new Error('Nenhum estilo CSS encontrado');
        }
        
        // Verificar classes CSS importantes
        const requiredClasses = [
            'control-panel',
            'stats-panel',
            'demo-info',
            'loading-overlay',
            'btn'
        ];
        
        requiredClasses.forEach(className => {
            if (!content.includes(className)) {
                throw new Error(`Classe CSS ${className} não encontrada`);
            }
        });
    });
    
    // Teste 4: Verificar funções JavaScript na página
    test('Funções JavaScript da Página', () => {
        const htmlPath = 'infra/frontend/advanced-animations-demo.html';
        const content = fs.readFileSync(htmlPath, 'utf8');
        
        const requiredFunctions = [
            'startAdvancedAnimations',
            'loadWindyData',
            'showLoadingAnimation',
            'animatePanel',
            'updateAnimationSpeed',
            'triggerRandomAnimation'
        ];
        
        requiredFunctions.forEach(func => {
            if (!content.includes(func)) {
                throw new Error(`Função ${func} não encontrada na página`);
            }
        });
    });
    
    // Teste 5: Verificar elementos de controle
    test('Elementos de Controle da Interface', () => {
        const htmlPath = 'infra/frontend/advanced-animations-demo.html';
        const content = fs.readFileSync(htmlPath, 'utf8');
        
        const requiredElements = [
            'control-panel',
            'stats-panel',
            'floating-animations',
            'loadingOverlay',
            'animationSpeed',
            'particleDensity'
        ];
        
        requiredElements.forEach(element => {
            if (!content.includes(element)) {
                throw new Error(`Elemento ${element} não encontrado na página`);
            }
        });
    });
    
    // Teste 6: Verificar acessibilidade da página via HTTP
    test('Acessibilidade HTTP da Página', () => {
        try {
            const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/advanced-animations-demo.html', 
                { encoding: 'utf8', timeout: 5000 });
            
            if (response.trim() !== '200') {
                throw new Error(`Página não acessível. Status HTTP: ${response.trim()}`);
            }
        } catch (error) {
            if (error.message.includes('timeout')) {
                throw new Error('Timeout ao acessar página');
            }
            throw new Error(`Erro ao acessar página: ${error.message}`);
        }
    });
    
    // Teste 7: Verificar tamanho e performance da página
    test('Performance e Tamanho da Página', () => {
        const htmlPath = 'infra/frontend/advanced-animations-demo.html';
        const stats = fs.statSync(htmlPath);
        
        // Verificar se página não é muito grande (máximo 100KB)
        const maxSize = 100 * 1024; // 100KB
        if (stats.size > maxSize) {
            throw new Error(`Página muito grande: ${Math.round(stats.size / 1024)}KB (máximo: ${Math.round(maxSize / 1024)}KB)`);
        }
        
        console.log(`   Tamanho da página: ${Math.round(stats.size / 1024)}KB`);
    });
    
    // Teste 8: Verificar se todos os assets existem
    test('Existência de Assets JavaScript', () => {
        const requiredAssets = [
            'infra/frontend/assets/js/advanced-animation-system.js',
            'infra/frontend/assets/js/windy-api-integration.js',
            'infra/frontend/assets/js/lottie-animations.js',
            'infra/frontend/assets/js/gsap-transitions.js'
        ];
        
        requiredAssets.forEach(asset => {
            if (!fs.existsSync(asset)) {
                throw new Error(`Asset ${asset} não encontrado`);
            }
            
            const stats = fs.statSync(asset);
            if (stats.size === 0) {
                throw new Error(`Asset ${asset} está vazio`);
            }
        });
    });
    
    // Teste 9: Verificar estrutura de diretórios
    test('Estrutura de Diretórios', () => {
        const requiredDirs = [
            'infra/frontend',
            'infra/frontend/assets',
            'infra/frontend/assets/js'
        ];
        
        requiredDirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                throw new Error(`Diretório ${dir} não encontrado`);
            }
            
            const stats = fs.statSync(dir);
            if (!stats.isDirectory()) {
                throw new Error(`${dir} não é um diretório`);
            }
        });
    });
    
    // Teste 10: Verificar responsividade (CSS)
    test('Responsividade CSS', () => {
        const htmlPath = 'infra/frontend/advanced-animations-demo.html';
        const content = fs.readFileSync(htmlPath, 'utf8');
        
        // Verificar se há media queries para responsividade
        if (!content.includes('@media')) {
            throw new Error('Nenhuma media query encontrada para responsividade');
        }
        
        // Verificar breakpoints comuns
        const commonBreakpoints = ['768px', 'mobile', 'tablet', 'max-width'];
        const hasBreakpoint = commonBreakpoints.some(bp => content.includes(bp));
        
        if (!hasBreakpoint) {
            throw new Error('Nenhum breakpoint comum encontrado');
        }
    });
    
    // Relatório final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO FINAL - TESTE DE BROWSER');
    console.log('='.repeat(50));
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
        console.log('\n🎉 TODOS OS TESTES DE BROWSER PASSARAM!');
        console.log('🌐 Página pronta para uso em produção.');
        return true;
    } else {
        console.log('\n⚠️  ALGUNS TESTES FALHARAM. Revise os erros acima.');
        return false;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const success = testBrowserFunctionality();
    process.exit(success ? 0 : 1);
}

module.exports = { testBrowserFunctionality };
