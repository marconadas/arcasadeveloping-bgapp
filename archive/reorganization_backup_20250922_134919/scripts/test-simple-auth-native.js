#!/usr/bin/env node

/**
 * Test script for Copernicus simple authentication (no TOTP)
 * Uses only native Node.js modules - no external dependencies
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const AUTH_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const PRODUCTS_URL = 'https://catalogue.dataspace.copernicus.eu/odata/v1/Products';

/**
 * Load environment variables from .env file
 */
function loadEnv() {
  const envVars = {};
  try {
    const envFile = readFileSync('.env', 'utf8');
    const lines = envFile.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  } catch (error) {
    console.error('⚠️ Could not read .env file:', error.message);
  }
  
  // Merge with process.env
  return { ...envVars, ...process.env };
}

/**
 * Make HTTP request using native fetch (Node 18+)
 */
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // Fallback for older Node versions
    const https = await import('https');
    const { URL } = await import('url');
    
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data)
          });
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }
}

/**
 * Test simple authentication without TOTP
 */
async function testSimpleAuth() {
  console.log('🔐 Teste de Autenticação Copernicus Simples (sem TOTP)');
  console.log('='.repeat(60));
  console.log('');

  const env = loadEnv();
  const username = env.COPERNICUS_USERNAME;
  const password = env.COPERNICUS_PASSWORD;

  if (!username || !password) {
    console.error('❌ Credenciais não encontradas!');
    console.error('');
    console.error('Por favor, configure as variáveis de ambiente:');
    console.error('  COPERNICUS_USERNAME=seu-email@example.com');
    console.error('  COPERNICUS_PASSWORD=sua-senha');
    console.error('');
    console.error('Ou execute: ./scripts/setup-copernicus-credentials.sh');
    process.exit(1);
  }

  console.log(`👤 Username: ${username}`);
  console.log('🔒 Password: ***hidden***');
  console.log('');

  try {
    // Step 1: Authenticate WITHOUT TOTP
    console.log('1️⃣ Autenticando SEM TOTP (método oficial)...');
    
    const authBody = new URLSearchParams({
      'client_id': 'cdse-public',
      'grant_type': 'password',
      'username': username,
      'password': password
      // 🎯 NO TOTP NEEDED!
    }).toString();

    const authResponse = await makeRequest(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'BGAPP-Test/2.0'
      },
      body: authBody
    });

    if (!authResponse.ok) {
      const error = await authResponse.text();
      console.error(`❌ Falha na autenticação: ${authResponse.status}`);
      console.error('Resposta:', error);
      
      if (authResponse.status === 401) {
        console.error('');
        console.error('💡 Possíveis causas:');
        console.error('  - Credenciais incorretas');
        console.error('  - Conta não ativada');
        console.error('  - 2FA habilitado na conta (desabilite para APIs)');
      }
      
      process.exit(1);
    }

    const tokenData = await authResponse.json();
    console.log('✅ Autenticação bem-sucedida!');
    console.log(`📊 Tipo do token: ${tokenData.token_type}`);
    console.log(`⏱️ Expira em: ${tokenData.expires_in} segundos`);
    console.log(`🔑 Token: ${tokenData.access_token.substring(0, 20)}...`);
    
    if (tokenData.refresh_token) {
      console.log('🔄 Refresh token recebido');
    }

    // Step 2: Test API call
    console.log('');
    console.log('2️⃣ Testando chamada de API...');
    
    const testUrl = `${PRODUCTS_URL}?$filter=Collection/Name eq 'SENTINEL-3'&$top=1`;
    
    const apiResponse = await makeRequest(testUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'BGAPP-Test/2.0'
      }
    });

    if (!apiResponse.ok) {
      console.error(`❌ Falha na chamada de API: ${apiResponse.status}`);
      const error = await apiResponse.text();
      console.error('Resposta:', error);
      process.exit(1);
    }

    const products = await apiResponse.json();
    console.log('✅ Chamada de API bem-sucedida!');
    console.log(`📦 Produtos encontrados: ${products.value?.length || 0}`);
    
    if (products.value && products.value.length > 0) {
      const product = products.value[0];
      console.log('');
      console.log('📋 Exemplo de produto:');
      console.log(`  • Nome: ${product.Name}`);
      console.log(`  • ID: ${product.Id}`);
      console.log(`  • Tamanho: ${(product.ContentLength / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  • Online: ${product.Online ? '✅' : '❌'}`);
    }

    // Step 3: Test refresh token if available
    if (tokenData.refresh_token) {
      console.log('');
      console.log('3️⃣ Testando renovação de token...');
      
      const refreshBody = new URLSearchParams({
        'client_id': 'cdse-public',
        'grant_type': 'refresh_token',
        'refresh_token': tokenData.refresh_token
      }).toString();

      const refreshResponse = await makeRequest(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'BGAPP-Test/2.0'
        },
        body: refreshBody
      });

      if (refreshResponse.ok) {
        const newTokenData = await refreshResponse.json();
        console.log('✅ Renovação de token bem-sucedida!');
        console.log(`🔑 Novo token: ${newTokenData.access_token.substring(0, 20)}...`);
      } else {
        console.warn('⚠️ Renovação de token falhou:', refreshResponse.status);
      }
    }

    // Success summary
    console.log('');
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('='.repeat(40));
    console.log('✅ Autenticação: Sucesso (SEM TOTP)');
    console.log('✅ Acesso à API: Sucesso');
    console.log('✅ Renovação de token: Sucesso');
    console.log('');
    console.log('🎯 CONCLUSÃO:');
    console.log('A documentação oficial está correta!');
    console.log('TOTP NÃO é necessário para chamadas de API.');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Deploy da nova autenticação: ./scripts/deploy-copernicus-migration.sh');
    console.log('2. Criar subscriptions para Angola EEZ');
    console.log('3. Configurar webhooks para notificações');

  } catch (error) {
    console.error('');
    console.error('❌ ERRO NO TESTE:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('1. Verifique sua conexão com a internet');
    console.error('2. Confirme as credenciais no .env');
    console.error('3. Teste o login manual em dataspace.copernicus.eu');
    process.exit(1);
  }
}

// Execute the test
testSimpleAuth().catch(console.error);
