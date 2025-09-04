#!/usr/bin/env node

/**
 * 🧪 TESTE DE INTEGRAÇÃO COMPLETA DOS SERVIÇOS BGAPP
 * Script para verificar a conectividade com todos os 13 serviços
 */

const axios = require('axios');

const services = [
  {
    name: 'Admin API (FastAPI)',
    url: 'http://localhost:8000/health',
    port: 8000,
    type: 'API'
  },
  {
    name: 'Frontend Principal',
    url: 'http://localhost:8085',
    port: 8085,
    type: 'Frontend'
  },
  {
    name: 'STAC API',
    url: 'http://localhost:8081',
    port: 8081,
    type: 'API'
  },
  {
    name: 'STAC Browser',
    url: 'http://localhost:8082',
    port: 8082,
    type: 'Frontend'
  },
  {
    name: 'Keycloak Auth',
    url: 'http://localhost:8083',
    port: 8083,
    type: 'Auth'
  },
  {
    name: 'pygeoapi',
    url: 'http://localhost:5080',
    port: 5080,
    type: 'API'
  },
  {
    name: 'pygeoapi Proxy',
    url: 'http://localhost:8086',
    port: 8086,
    type: 'Proxy'
  },
  {
    name: 'Flower Monitor',
    url: 'http://localhost:5555',
    port: 5555,
    type: 'Monitor'
  },
  {
    name: 'MinIO Storage',
    url: 'http://localhost:9000/minio/health/live',
    port: 9000,
    type: 'Storage'
  },
  {
    name: 'MinIO Console',
    url: 'http://localhost:9001',
    port: 9001,
    type: 'Console'
  },
  {
    name: 'PostGIS Database',
    url: 'http://localhost:5432',
    port: 5432,
    type: 'Database',
    skipHttp: true // PostgreSQL não responde HTTP
  },
  {
    name: 'Redis Cache',
    url: 'http://localhost:6379',
    port: 6379,
    type: 'Cache',
    skipHttp: true // Redis não responde HTTP
  },
  {
    name: 'Admin Dashboard',
    url: 'http://localhost:3000',
    port: 3000,
    type: 'Dashboard'
  }
];

async function testService(service) {
  if (service.skipHttp) {
    // Para serviços que não respondem HTTP, apenas verificamos se a porta está aberta
    const net = require('net');
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 3000;
      
      socket.setTimeout(timeout);
      socket.on('connect', () => {
        socket.destroy();
        resolve({
          name: service.name,
          status: 'online',
          responseTime: null,
          type: service.type,
          port: service.port,
          method: 'TCP'
        });
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          name: service.name,
          status: 'offline',
          error: 'Connection timeout',
          type: service.type,
          port: service.port,
          method: 'TCP'
        });
      });
      
      socket.on('error', (err) => {
        socket.destroy();
        resolve({
          name: service.name,
          status: 'offline',
          error: err.message,
          type: service.type,
          port: service.port,
          method: 'TCP'
        });
      });
      
      socket.connect(service.port, 'localhost');
    });
  }

  const startTime = Date.now();
  
  try {
    const response = await axios.get(service.url, {
      timeout: 5000,
      validateStatus: () => true // Aceitar qualquer status
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: service.name,
      status: response.status < 500 ? 'online' : 'error',
      responseTime: responseTime,
      statusCode: response.status,
      type: service.type,
      port: service.port,
      method: 'HTTP'
    };
    
  } catch (error) {
    return {
      name: service.name,
      status: 'offline',
      error: error.code || error.message,
      type: service.type,
      port: service.port,
      method: 'HTTP'
    };
  }
}

async function runTests() {
  console.log('🚀 INICIANDO TESTE DE INTEGRAÇÃO COMPLETA DOS SERVIÇOS BGAPP');
  console.log('=' .repeat(70));
  
  const results = [];
  
  for (const service of services) {
    process.stdout.write(`Testando ${service.name.padEnd(25)} :${service.port}... `);
    
    const result = await testService(service);
    results.push(result);
    
    const statusIcon = result.status === 'online' ? '✅' : '❌';
    const responseInfo = result.responseTime ? `(${result.responseTime}ms)` : '';
    const statusInfo = result.statusCode ? `[${result.statusCode}]` : '';
    
    console.log(`${statusIcon} ${result.status.toUpperCase()} ${responseInfo} ${statusInfo}`);
    
    if (result.error) {
      console.log(`   └─ Erro: ${result.error}`);
    }
  }
  
  console.log('=' .repeat(70));
  
  // Estatísticas
  const onlineServices = results.filter(r => r.status === 'online').length;
  const offlineServices = results.filter(r => r.status === 'offline').length;
  const errorServices = results.filter(r => r.status === 'error').length;
  const totalServices = results.length;
  
  console.log('📊 RESUMO DOS TESTES:');
  console.log(`   🟢 Online:  ${onlineServices}/${totalServices} serviços`);
  console.log(`   🔴 Offline: ${offlineServices}/${totalServices} serviços`);
  console.log(`   🟡 Erro:    ${errorServices}/${totalServices} serviços`);
  console.log(`   📈 Taxa de Sucesso: ${Math.round((onlineServices / totalServices) * 100)}%`);
  
  // Serviços por tipo
  console.log('\n📋 SERVIÇOS POR TIPO:');
  const servicesByType = results.reduce((acc, service) => {
    if (!acc[service.type]) acc[service.type] = [];
    acc[service.type].push(service);
    return acc;
  }, {});
  
  Object.entries(servicesByType).forEach(([type, services]) => {
    const online = services.filter(s => s.status === 'online').length;
    const total = services.length;
    console.log(`   ${type}: ${online}/${total} online`);
  });
  
  // Recomendações
  console.log('\n💡 RECOMENDAÇÕES:');
  
  if (offlineServices > 0) {
    console.log('   ⚠️  Serviços offline detectados. Para iniciar todos os serviços:');
    console.log('      cd /path/to/bgapp/infra && docker-compose up -d');
  }
  
  if (onlineServices === totalServices) {
    console.log('   🎉 Todos os serviços estão online! Sistema pronto para uso.');
    console.log('   🌐 Admin Dashboard: http://localhost:3001');
    console.log('   📊 Admin API Docs: http://localhost:8000/docs');
  }
  
  // Integração específica
  const criticalServices = ['Admin API (FastAPI)', 'STAC API', 'pygeoapi', 'MinIO Storage', 'Flower Monitor'];
  const criticalOnline = results.filter(r => criticalServices.includes(r.name) && r.status === 'online').length;
  
  console.log(`\n🔗 INTEGRAÇÃO COMPLETA: ${criticalOnline}/${criticalServices.length} serviços críticos online`);
  
  if (criticalOnline === criticalServices.length) {
    console.log('   ✅ Integração completa funcionando! Acesse a seção "Integração Completa Serviços"');
  } else {
    console.log('   ⚠️  Alguns serviços críticos estão offline. Verificar docker-compose.');
  }
  
  console.log('=' .repeat(70));
  
  return {
    total: totalServices,
    online: onlineServices,
    offline: offlineServices,
    error: errorServices,
    successRate: Math.round((onlineServices / totalServices) * 100),
    results: results
  };
}

if (require.main === module) {
  runTests().then(summary => {
    process.exit(summary.offline > 0 ? 1 : 0);
  }).catch(error => {
    console.error('❌ Erro durante os testes:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testService };
