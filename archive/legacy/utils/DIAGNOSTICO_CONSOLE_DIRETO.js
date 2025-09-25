/**
 * DIAGNÓSTICO DIRETO NO CONSOLE - BGAPP
 * Cole este código no console do browser para diagnóstico imediato
 */

// Função de diagnóstico imediato
async function diagnosticoBGAPP() {
    console.log('🔍 INICIANDO DIAGNÓSTICO BGAPP...\n');
    
    const results = {
        timestamp: new Date().toISOString(),
        services: {},
        scripts: {},
        globals: {},
        summary: {}
    };
    
    // 1. Testar serviços críticos
    const services = [
        { name: 'Admin API Health', url: 'http://localhost:8000/admin-api/health' },
        { name: 'Admin API Collections', url: 'http://localhost:8000/admin-api/collections' },
        { name: 'Admin API Services', url: 'http://localhost:8000/admin-api/services/status' },
        { name: 'Admin API Connectors', url: 'http://localhost:8000/admin-api/connectors' },
        { name: 'PyGeoAPI', url: 'http://localhost:5080/collections' },
        { name: 'Frontend', url: 'http://localhost:8085' }
    ];
    
    console.log('🔧 TESTANDO SERVIÇOS...');
    
    for (const service of services) {
        const startTime = Date.now();
        try {
            const response = await fetch(service.url, { 
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            const responseTime = Date.now() - startTime;
            const status = response.ok ? '✅' : '❌';
            
            results.services[service.name] = {
                status: response.ok ? 'OK' : 'FAIL',
                httpStatus: response.status,
                responseTime: responseTime
            };
            
            console.log(`${status} ${service.name}: HTTP ${response.status} (${responseTime}ms)`);
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            results.services[service.name] = {
                status: 'ERROR',
                error: error.message,
                responseTime: responseTime
            };
            
            console.log(`❌ ${service.name}: ${error.message} (${responseTime}ms)`);
        }
    }
    
    // 2. Verificar scripts carregados
    console.log('\n📦 VERIFICANDO SCRIPTS...');
    
    const scripts = [
        'api-resilience.js',
        'api-plugin-manager.js', 
        'api-adapter.js',
        'health-checker.js'
    ];
    
    for (const script of scripts) {
        const scriptTag = document.querySelector(`script[src*="${script}"]`);
        const status = scriptTag ? '✅' : '❌';
        
        results.scripts[script] = {
            loaded: !!scriptTag,
            src: scriptTag ? scriptTag.src : null
        };
        
        console.log(`${status} ${script}: ${scriptTag ? 'Carregado' : 'NÃO ENCONTRADO'}`);
    }
    
    // 3. Verificar variáveis globais
    console.log('\n🌐 VERIFICANDO VARIÁVEIS GLOBAIS...');
    
    const globals = [
        { name: 'API', desc: 'Admin API original' },
        { name: 'apiResilienceManager', desc: 'Sistema de Resiliência' },
        { name: 'apiPluginManager', desc: 'Gerenciador de Plugins' },
        { name: 'bgappAPIAdapter', desc: 'Adaptador de API' },
        { name: 'bgappHealthChecker', desc: 'Health Checker' }
    ];
    
    for (const global of globals) {
        const exists = !!window[global.name];
        const status = exists ? '✅' : '❌';
        const type = exists ? typeof window[global.name] : 'undefined';
        
        results.globals[global.name] = {
            exists: exists,
            type: type,
            initialized: exists && window[global.name].initialized !== false
        };
        
        console.log(`${status} ${global.name} (${global.desc}): ${type}`);
        
        if (exists && window[global.name].initialized === false) {
            console.log(`   ⚠️ Existe mas não foi inicializado`);
        }
    }
    
    // 4. Testar funcionalidades
    console.log('\n⚙️ TESTANDO FUNCIONALIDADES...');
    
    // Testar API original
    if (window.API) {
        try {
            const methods = Object.keys(window.API);
            console.log(`✅ API original: ${methods.length} métodos disponíveis`);
            console.log(`   Métodos: ${methods.slice(0, 5).join(', ')}${methods.length > 5 ? '...' : ''}`);
        } catch (error) {
            console.log(`❌ API original: Erro ao inspecionar - ${error.message}`);
        }
    }
    
    // Testar Plugin Manager
    if (window.apiPluginManager) {
        try {
            const pluginStatus = window.apiPluginManager.getPluginsStatus();
            const pluginCount = Object.keys(pluginStatus).length;
            console.log(`✅ Plugin Manager: ${pluginCount} plugins registrados`);
            
            if (pluginCount > 0) {
                console.log('   Plugins:', Object.keys(pluginStatus).join(', '));
            }
        } catch (error) {
            console.log(`❌ Plugin Manager: Erro - ${error.message}`);
        }
    }
    
    // 5. Gerar resumo
    const serviceResults = Object.values(results.services);
    const okServices = serviceResults.filter(s => s.status === 'OK').length;
    const totalServices = serviceResults.length;
    
    const scriptResults = Object.values(results.scripts);
    const loadedScripts = scriptResults.filter(s => s.loaded).length;
    const totalScripts = scriptResults.length;
    
    const globalResults = Object.values(results.globals);
    const availableGlobals = globalResults.filter(g => g.exists).length;
    const totalGlobals = globalResults.length;
    
    results.summary = {
        services: `${okServices}/${totalServices}`,
        scripts: `${loadedScripts}/${totalScripts}`,
        globals: `${availableGlobals}/${totalGlobals}`,
        overall: okServices === totalServices && loadedScripts === totalScripts ? 'HEALTHY' : 'DEGRADED'
    };
    
    console.log('\n📊 RESUMO:');
    console.log(`   Serviços: ${results.summary.services} funcionando`);
    console.log(`   Scripts: ${results.summary.scripts} carregados`);
    console.log(`   Globais: ${results.summary.globals} disponíveis`);
    console.log(`   Status Geral: ${results.summary.overall}`);
    
    // 6. Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    
    if (results.services['Admin API Health']?.status !== 'OK') {
        console.log('🔴 CRÍTICO: Iniciar admin_api_simple.py');
        console.log('   Comando: python admin_api_simple.py');
    }
    
    if (results.services['PyGeoAPI']?.status !== 'OK') {
        console.log('⚠️ Opcional: Iniciar PyGeoAPI');
        console.log('   Comando: docker-compose up pygeoapi');
    }
    
    if (results.scripts['health-checker.js']?.loaded === false) {
        console.log('🔧 Recarregar página para carregar health-checker.js');
    }
    
    if (results.globals['apiPluginManager']?.exists === false) {
        console.log('🔧 Sistema de plugins não carregado - verificar console por erros');
    }
    
    // Salvar resultados globalmente
    window.diagnosticoResults = results;
    console.log('\n💾 Resultados salvos em window.diagnosticoResults');
    
    console.log('\n🎉 DIAGNÓSTICO COMPLETO!');
    return results;
}

// Função para testar um endpoint específico
async function testarEndpoint(url) {
    console.log(`🔍 Testando: ${url}`);
    
    try {
        const startTime = Date.now();
        const response = await fetch(url);
        const responseTime = Date.now() - startTime;
        
        console.log(`${response.ok ? '✅' : '❌'} HTTP ${response.status} (${responseTime}ms)`);
        
        if (response.ok) {
            try {
                const data = await response.json();
                console.log('📄 Resposta:', data);
            } catch (e) {
                console.log('📄 Resposta: (não é JSON)');
            }
        }
        
        return response;
        
    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
        return null;
    }
}

// Função para forçar inicialização dos plugins
function forcarInicializacaoPlugins() {
    console.log('🔄 Forçando inicialização dos plugins...');
    
    if (window.apiResilienceManager) {
        window.apiResilienceManager.initialize();
        console.log('✅ API Resilience Manager inicializado');
    }
    
    if (window.apiPluginManager) {
        window.apiPluginManager.initialize();
        console.log('✅ API Plugin Manager inicializado');
    }
    
    if (window.bgappAPIAdapter) {
        window.bgappAPIAdapter.initialize();
        console.log('✅ BGAPP API Adapter inicializado');
    }
    
    console.log('🎉 Inicialização forçada completa!');
}

// Função para criar health checker se não existir
function criarHealthChecker() {
    if (window.healthCheck) {
        console.log('✅ healthCheck() já existe');
        return;
    }
    
    console.log('🔧 Criando healthCheck() temporário...');
    
    window.healthCheck = diagnosticoBGAPP;
    window.quickCheck = () => {
        console.log('⚡ Diagnóstico rápido...');
        return diagnosticoBGAPP();
    };
    window.testarEndpoint = testarEndpoint;
    window.forcarPlugins = forcarInicializacaoPlugins;
    
    console.log('✅ Funções de diagnóstico criadas:');
    console.log('   - healthCheck()');
    console.log('   - quickCheck()');
    console.log('   - testarEndpoint(url)');
    console.log('   - forcarPlugins()');
}

// Auto-executar
console.log('🏥 BGAPP Diagnóstico Console carregado!');
console.log('📋 Funções disponíveis:');
console.log('   - diagnosticoBGAPP() - Diagnóstico completo');
console.log('   - testarEndpoint(url) - Testar endpoint específico');
console.log('   - forcarInicializacaoPlugins() - Forçar init plugins');
console.log('   - criarHealthChecker() - Criar funções se não existirem');

// Criar health checker se não existir
criarHealthChecker();

// Executar diagnóstico automático
setTimeout(() => {
    console.log('\n🚀 EXECUTANDO DIAGNÓSTICO AUTOMÁTICO...');
    diagnosticoBGAPP();
}, 1000);
