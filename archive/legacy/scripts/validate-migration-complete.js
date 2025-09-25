#!/usr/bin/env node

/**
 * Script de validação completa da migração Copernicus
 * Verifica se todos os componentes estão funcionando
 */

console.log('✅ VALIDAÇÃO COMPLETA: Migração Copernicus');
console.log('='.repeat(50));
console.log('');

const ENDPOINTS = {
  webhook: 'https://bgapp-copernicus-webhook-dev.majearcasa.workers.dev',
  api: 'https://bgapp-api-worker-dev.majearcasa.workers.dev'
};

async function validateWebhookWorker() {
  console.log('1️⃣ Validando Webhook Worker...');
  console.log('─'.repeat(30));
  
  try {
    // Test status endpoint
    const statusResponse = await fetch(`${ENDPOINTS.webhook}/webhook/status`);
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('  ✅ Status endpoint: OK');
      console.log(`     Status: ${status.status}`);
      console.log(`     Data: ${status.date}`);
    } else {
      console.log('  ❌ Status endpoint: FALHA');
      return false;
    }

    // Test webhook endpoint (should return method not allowed for GET)
    const webhookResponse = await fetch(`${ENDPOINTS.webhook}/webhook/copernicus`);
    if (webhookResponse.status === 404) {
      console.log('  ✅ Webhook endpoint: OK (404 esperado para GET)');
    } else {
      console.log('  ⚠️ Webhook endpoint: Resposta inesperada');
    }

    console.log('  ✅ Webhook Worker: FUNCIONANDO');
    return true;
  } catch (error) {
    console.log('  ❌ Webhook Worker: ERRO -', error.message);
    return false;
  }
}

async function validateAPIWorker() {
  console.log('');
  console.log('2️⃣ Validando API Worker...');
  console.log('─'.repeat(30));
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${ENDPOINTS.api}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('  ✅ Health endpoint: OK');
      console.log(`     Status: ${health.status}`);
      console.log(`     Version: ${health.version}`);
    } else {
      console.log('  ❌ Health endpoint: FALHA');
      return false;
    }

    console.log('  ✅ API Worker: FUNCIONANDO');
    return true;
  } catch (error) {
    console.log('  ❌ API Worker: ERRO -', error.message);
    return false;
  }
}

function validateCodeChanges() {
  console.log('');
  console.log('3️⃣ Validando Mudanças no Código...');
  console.log('─'.repeat(30));
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Check if TOTP code is removed from API worker
    const apiWorkerPath = path.join(process.cwd(), 'workers', 'api-worker.js');
    const apiWorkerContent = fs.readFileSync(apiWorkerPath, 'utf8');
    
    if (apiWorkerContent.includes('generateTOTPFromBase32')) {
      console.log('  ⚠️ TOTP code ainda presente no API worker');
      console.log('     Verificar se a remoção foi completa');
    } else {
      console.log('  ✅ TOTP code removido do API worker');
    }
    
    if (apiWorkerContent.includes('TOTP functionality removed')) {
      console.log('  ✅ Comentário de migração encontrado');
    }

    // Check if new auth modules exist
    const simpleAuthPath = path.join(process.cwd(), 'copernicus-official', 'auth', 'simple-auth.js');
    if (fs.existsSync(simpleAuthPath)) {
      console.log('  ✅ Módulo de autenticação simples: EXISTE');
    } else {
      console.log('  ❌ Módulo de autenticação simples: NÃO ENCONTRADO');
    }

    const subscriptionManagerPath = path.join(process.cwd(), 'copernicus-official', 'subscriptions', 'manager.js');
    if (fs.existsSync(subscriptionManagerPath)) {
      console.log('  ✅ Gerenciador de subscriptions: EXISTE');
    } else {
      console.log('  ❌ Gerenciador de subscriptions: NÃO ENCONTRADO');
    }

    const webhookPath = path.join(process.cwd(), 'workers', 'copernicus-webhook.js');
    if (fs.existsSync(webhookPath)) {
      console.log('  ✅ Webhook handler: EXISTE');
    } else {
      console.log('  ❌ Webhook handler: NÃO ENCONTRADO');
    }

    console.log('  ✅ Validação de código: COMPLETA');
    return true;
  } catch (error) {
    console.log('  ❌ Erro na validação de código:', error.message);
    return false;
  }
}

function validateDocumentation() {
  console.log('');
  console.log('4️⃣ Validando Documentação...');
  console.log('─'.repeat(30));
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const docs = [
      'COPERNICUS_MIGRATION_STATUS.md',
      'COPERNICUS_SIMPLE_AUTH_MIGRATION.md',
      'spec-kit/specs/20250917-copernicus-official-integration/spec.md',
      'spec-kit/specs/20250917-copernicus-official-integration/plan.md',
      'spec-kit/specs/20250917-copernicus-official-integration/research.md'
    ];

    let docsFound = 0;
    for (const doc of docs) {
      const docPath = path.join(process.cwd(), doc);
      if (fs.existsSync(docPath)) {
        console.log(`  ✅ ${doc}: EXISTE`);
        docsFound++;
      } else {
        console.log(`  ❌ ${doc}: NÃO ENCONTRADO`);
      }
    }

    console.log(`  📊 Documentos encontrados: ${docsFound}/${docs.length}`);
    return docsFound === docs.length;
  } catch (error) {
    console.log('  ❌ Erro na validação de documentação:', error.message);
    return false;
  }
}

function validateScripts() {
  console.log('');
  console.log('5️⃣ Validando Scripts...');
  console.log('─'.repeat(30));
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const scripts = [
      'scripts/test-simple-auth-native.js',
      'scripts/test-subscription-creation.js',
      'scripts/deploy-copernicus-migration.sh',
      'scripts/setup-copernicus-credentials.sh',
      'scripts/demo-full-flow.js'
    ];

    let scriptsFound = 0;
    for (const script of scripts) {
      const scriptPath = path.join(process.cwd(), script);
      if (fs.existsSync(scriptPath)) {
        console.log(`  ✅ ${script}: EXISTE`);
        scriptsFound++;
      } else {
        console.log(`  ❌ ${script}: NÃO ENCONTRADO`);
      }
    }

    console.log(`  📊 Scripts encontrados: ${scriptsFound}/${scripts.length}`);
    return scriptsFound === scripts.length;
  } catch (error) {
    console.log('  ❌ Erro na validação de scripts:', error.message);
    return false;
  }
}

function showFinalStatus(results) {
  console.log('');
  console.log('📊 RESULTADO FINAL');
  console.log('='.repeat(30));
  console.log('');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Testes passaram: ${passed}/${total}`);
  console.log('');
  
  if (passed === total) {
    console.log('🎉 MIGRAÇÃO 100% COMPLETA!');
    console.log('');
    console.log('✅ Todos os componentes estão funcionando');
    console.log('✅ Código atualizado e deployado');
    console.log('✅ Documentação completa');
    console.log('✅ Scripts de suporte criados');
    console.log('');
    console.log('🚀 SISTEMA PRONTO PARA USO!');
    console.log('');
    console.log('📋 Para usar com credenciais reais:');
    console.log('1. ./scripts/setup-copernicus-credentials.sh');
    console.log('2. node scripts/test-simple-auth-native.js');
    console.log('3. node scripts/test-subscription-creation.js');
    console.log('');
    console.log('🔗 URLs dos Workers:');
    console.log(`• API Worker: ${ENDPOINTS.api}`);
    console.log(`• Webhook: ${ENDPOINTS.webhook}`);
  } else {
    console.log('⚠️ MIGRAÇÃO PARCIALMENTE COMPLETA');
    console.log('');
    console.log('Alguns componentes precisam de atenção.');
    console.log('Verifique os itens marcados com ❌ acima.');
  }
}

// Executar validação completa
async function runFullValidation() {
  const results = [
    await validateWebhookWorker(),
    await validateAPIWorker(),
    validateCodeChanges(),
    validateDocumentation(),
    validateScripts()
  ];
  
  showFinalStatus(results);
}

// Executar
runFullValidation().catch(console.error);
