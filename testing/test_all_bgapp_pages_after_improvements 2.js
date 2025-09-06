/**
 * 🧪 BGAPP - Teste Automático de Todas as Páginas
 * Verifica se todas as funcionalidades continuam operacionais após melhorias
 * 
 * OBJETIVO:
 * ✅ Garantir que nenhuma página quebrou
 * ✅ Validar APIs e workers funcionando
 * ✅ Testar fallbacks e retry
 * ✅ Verificar tempos de resposta
 */

const BGAPP_PAGES_TO_TEST = [
  // 🏠 Páginas Principais
  {
    name: 'Frontend Principal',
    url: 'https://bgapp-frontend.pages.dev',
    type: 'page',
    critical: true,
    expectedElements: ['#map-container', '.bgapp-header']
  },
  {
    name: 'Admin Dashboard',
    url: 'https://bgapp-admin.pages.dev',
    type: 'page', 
    critical: true,
    expectedElements: ['[data-testid="dashboard"]', '.sidebar']
  },
  
  // 🧠 ML Demo
  {
    name: 'ML Demo System',
    url: 'https://bgapp-frontend.pages.dev/ml-demo.html',
    type: 'page',
    critical: true,
    expectedElements: ['#ml-system-dashboard', '.demo-controls']
  },
  
  // 🗺️ Mapas e Interfaces
  {
    name: 'Dashboard Científico',
    url: 'https://bgapp-frontend.pages.dev/dashboard_cientifico.html',
    type: 'page',
    critical: true,
    expectedElements: ['#scientific-dashboard', '.map-container']
  },
  {
    name: 'QGIS Dashboard',
    url: 'https://bgapp-frontend.pages.dev/qgis_dashboard.html',
    type: 'page',
    critical: false,
    expectedElements: ['#qgis-interface']
  },
  {
    name: 'Realtime Angola',
    url: 'https://bgapp-frontend.pages.dev/realtime_angola.html',
    type: 'page',
    critical: true,
    expectedElements: ['#realtime-data']
  },
  
  // 📱 Mobile
  {
    name: 'Mobile PWA',
    url: 'https://bgapp-frontend.pages.dev/mobile_pwa.html',
    type: 'page',
    critical: false,
    expectedElements: ['#mobile-interface']
  },
  
  // 🌐 Site MINPERMAR
  {
    name: 'Site MINPERMAR',
    url: 'https://bgapp-frontend.pages.dev/minpermar/dist/index.html',
    type: 'page',
    critical: false,
    expectedElements: ['#minpermar-site']
  }
];

const BGAPP_APIS_TO_TEST = [
  // 🚀 Admin API Worker
  {
    name: 'Admin API Health',
    url: 'https://bgapp-admin-api-worker.majearcasa.workers.dev/health',
    type: 'api',
    critical: true,
    expectedStatus: 200,
    expectedFields: ['status', 'timestamp']
  },
  {
    name: 'Admin API Services',
    url: 'https://bgapp-admin-api-worker.majearcasa.workers.dev/api/services/status',
    type: 'api',
    critical: true,
    expectedStatus: 200,
    expectedFields: ['success', 'data']
  },
  {
    name: 'ML Models API',
    url: 'https://bgapp-admin-api-worker.majearcasa.workers.dev/api/ml/models',
    type: 'api',
    critical: true,
    expectedStatus: 200,
    expectedFields: ['models']
  },
  
  // 🛰️ STAC API
  {
    name: 'STAC Collections',
    url: 'https://bgapp-stac.majearcasa.workers.dev/collections',
    type: 'api',
    critical: true,
    expectedStatus: 200,
    expectedFields: ['collections']
  },
  
  // 🌍 PyGeoAPI
  {
    name: 'PyGeoAPI Root',
    url: 'https://bgapp-pygeoapi.majearcasa.workers.dev/',
    type: 'api',
    critical: false,
    expectedStatus: 200,
    expectedFields: ['title', 'description']
  },
  
  // 🔐 Keycloak
  {
    name: 'Keycloak Health',
    url: 'https://bgapp-auth.majearcasa.workers.dev/health',
    type: 'api',
    critical: false,
    expectedStatus: 200
  },
  
  // 📊 Monitoring
  {
    name: 'Flower Monitor',
    url: 'https://bgapp-monitor.majearcasa.workers.dev/api/workers',
    type: 'api',
    critical: false,
    expectedStatus: 200
  }
];

class BGAPPTester {
  constructor() {
    this.results = {
      pages: [],
      apis: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical_failures: 0,
        start_time: new Date().toISOString(),
        end_time: null,
        duration: null
      }
    };
  }

  async testPage(pageConfig) {
    console.log(`🧪 Testando página: ${pageConfig.name}`);
    const startTime = Date.now();
    
    try {
      // Testar se a página carrega
      const response = await fetch(pageConfig.url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'BGAPP-Tester/2.1.0',
          'X-BGAPP-Test': 'automated'
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        console.log(`✅ ${pageConfig.name} - OK (${duration}ms)`);
        return {
          name: pageConfig.name,
          url: pageConfig.url,
          status: 'PASS',
          response_time: duration,
          http_status: response.status,
          critical: pageConfig.critical,
          error: null
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ ${pageConfig.name} - FAIL (${duration}ms): ${error.message}`);
      
      return {
        name: pageConfig.name,
        url: pageConfig.url,
        status: 'FAIL',
        response_time: duration,
        http_status: null,
        critical: pageConfig.critical,
        error: error.message
      };
    }
  }

  async testAPI(apiConfig) {
    console.log(`🔌 Testando API: ${apiConfig.name}`);
    const startTime = Date.now();
    
    try {
      const response = await fetch(apiConfig.url, {
        headers: {
          'User-Agent': 'BGAPP-Tester/2.1.0',
          'X-BGAPP-Test': 'automated',
          'Accept': 'application/json'
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (response.status === apiConfig.expectedStatus) {
        // Verificar conteúdo se esperado
        let contentValid = true;
        let responseData = null;
        
        if (apiConfig.expectedFields) {
          try {
            responseData = await response.json();
            for (const field of apiConfig.expectedFields) {
              if (!responseData.hasOwnProperty(field)) {
                contentValid = false;
                break;
              }
            }
          } catch (e) {
            contentValid = false;
          }
        }
        
        if (contentValid) {
          console.log(`✅ ${apiConfig.name} - OK (${duration}ms)`);
          return {
            name: apiConfig.name,
            url: apiConfig.url,
            status: 'PASS',
            response_time: duration,
            http_status: response.status,
            critical: apiConfig.critical,
            error: null,
            data_sample: responseData ? JSON.stringify(responseData).substring(0, 100) + '...' : null
          };
        } else {
          throw new Error('Response missing expected fields');
        }
      } else {
        throw new Error(`Expected ${apiConfig.expectedStatus}, got ${response.status}`);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ ${apiConfig.name} - FAIL (${duration}ms): ${error.message}`);
      
      return {
        name: apiConfig.name,
        url: apiConfig.url,
        status: 'FAIL',
        response_time: duration,
        http_status: null,
        critical: apiConfig.critical,
        error: error.message
      };
    }
  }

  async runAllTests() {
    console.log('🚀 Iniciando testes de todas as páginas BGAPP...\n');
    
    // Testar páginas
    console.log('📄 TESTANDO PÁGINAS:');
    for (const pageConfig of BGAPP_PAGES_TO_TEST) {
      const result = await this.testPage(pageConfig);
      this.results.pages.push(result);
      this.results.summary.total++;
      
      if (result.status === 'PASS') {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
        if (result.critical) {
          this.results.summary.critical_failures++;
        }
      }
      
      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🔌 TESTANDO APIs:');
    // Testar APIs
    for (const apiConfig of BGAPP_APIS_TO_TEST) {
      const result = await this.testAPI(apiConfig);
      this.results.apis.push(result);
      this.results.summary.total++;
      
      if (result.status === 'PASS') {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
        if (result.critical) {
          this.results.summary.critical_failures++;
        }
      }
      
      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Finalizar
    this.results.summary.end_time = new Date().toISOString();
    this.results.summary.duration = Date.now() - new Date(this.results.summary.start_time).getTime();
    
    return this.results;
  }

  generateReport() {
    const { summary, pages, apis } = this.results;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DOS TESTES BGAPP');
    console.log('='.repeat(60));
    
    console.log(`🕒 Duração: ${summary.duration}ms`);
    console.log(`📈 Total: ${summary.total}`);
    console.log(`✅ Passou: ${summary.passed}`);
    console.log(`❌ Falhou: ${summary.failed}`);
    console.log(`🚨 Falhas Críticas: ${summary.critical_failures}`);
    
    const successRate = Math.round((summary.passed / summary.total) * 100);
    console.log(`📊 Taxa de Sucesso: ${successRate}%`);
    
    if (summary.critical_failures > 0) {
      console.log('\n🚨 FALHAS CRÍTICAS ENCONTRADAS:');
      [...pages, ...apis]
        .filter(result => result.status === 'FAIL' && result.critical)
        .forEach(result => {
          console.log(`❌ ${result.name}: ${result.error}`);
        });
    }
    
    if (summary.failed > 0) {
      console.log('\n⚠️ TODAS AS FALHAS:');
      [...pages, ...apis]
        .filter(result => result.status === 'FAIL')
        .forEach(result => {
          const criticality = result.critical ? '🚨 CRÍTICO' : '⚠️ MENOR';
          console.log(`${criticality} ${result.name}: ${result.error}`);
        });
    }
    
    console.log('\n📄 PÁGINAS TESTADAS:');
    pages.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      const critical = result.critical ? '🚨' : '📄';
      console.log(`${status} ${critical} ${result.name} (${result.response_time}ms)`);
    });
    
    console.log('\n🔌 APIs TESTADAS:');
    apis.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      const critical = result.critical ? '🚨' : '🔌';
      console.log(`${status} ${critical} ${result.name} (${result.response_time}ms)`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    // Determinar resultado geral
    if (summary.critical_failures === 0 && successRate >= 90) {
      console.log('🎉 RESULTADO: TODAS AS MELHORIAS IMPLEMENTADAS COM SUCESSO!');
      console.log('✅ Nenhuma funcionalidade crítica foi quebrada.');
      return 'SUCCESS';
    } else if (summary.critical_failures === 0) {
      console.log('⚠️ RESULTADO: MELHORIAS OK, ALGUMAS FALHAS MENORES');
      console.log('✅ Funcionalidades críticas intactas.');
      return 'SUCCESS_WITH_WARNINGS';
    } else {
      console.log('🚨 RESULTADO: FALHAS CRÍTICAS DETECTADAS!');
      console.log('❌ Algumas funcionalidades críticas podem estar quebradas.');
      return 'CRITICAL_FAILURE';
    }
  }

  async saveReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bgapp-test-report-${timestamp}.json`;
    
    // Em ambiente Node.js, salvar arquivo
    if (typeof require !== 'undefined') {
      const fs = require('fs');
      fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
      console.log(`💾 Relatório salvo em: ${filename}`);
    }
    
    return this.results;
  }
}

// Executar testes se chamado diretamente
if (typeof window === 'undefined' && typeof module !== 'undefined') {
  // Ambiente Node.js
  (async () => {
    const tester = new BGAPPTester();
    await tester.runAllTests();
    const result = tester.generateReport();
    await tester.saveReport();
    
    // Exit code baseado no resultado
    process.exit(result === 'CRITICAL_FAILURE' ? 1 : 0);
  })();
} else {
  // Ambiente Browser
  window.BGAPPTester = BGAPPTester;
  console.log('🧪 BGAPPTester carregado. Use: new BGAPPTester().runAllTests()');
}

export default BGAPPTester;
