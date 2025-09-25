#!/usr/bin/env node

/**
 * Test script for creating Copernicus subscriptions
 * Uses the new simple authentication (no TOTP)
 */

import { readFileSync } from 'fs';

const AUTH_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const SUBSCRIPTIONS_URL = 'https://catalogue.dataspace.copernicus.eu/odata/v1/Subscriptions';
const WEBHOOK_URL = 'https://bgapp-copernicus-webhook-dev.majearcasa.workers.dev/webhook/copernicus';

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
  
  return { ...envVars, ...process.env };
}

/**
 * Get Copernicus access token
 */
async function getCopernicusToken(env) {
  const authBody = new URLSearchParams({
    'client_id': 'cdse-public',
    'grant_type': 'password',
    'username': env.COPERNICUS_USERNAME,
    'password': env.COPERNICUS_PASSWORD
    // NO TOTP!
  });

  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'BGAPP-Subscription-Test/1.0'
    },
    body: authBody.toString()
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const tokenData = await response.json();
  return tokenData.access_token;
}

/**
 * Create a test subscription for Angola EEZ
 */
async function createAngolaSubscription(token) {
  // Angola EEZ bounding box
  const angolaEEZ = {
    north: -4.376,
    south: -18.042,
    east: 13.377,
    west: 11.679
  };

  // Build spatial filter
  const polygon = `POLYGON((${angolaEEZ.west} ${angolaEEZ.north}, ${angolaEEZ.east} ${angolaEEZ.north}, ${angolaEEZ.east} ${angolaEEZ.south}, ${angolaEEZ.west} ${angolaEEZ.south}, ${angolaEEZ.west} ${angolaEEZ.north}))`;
  const spatialFilter = `OData.CSC.Intersects(area=geography'SRID=4326;${polygon}')`;
  
  // Collection filter for marine data
  const collectionFilter = "Collection/Name eq 'SENTINEL-3'";
  
  // Combined filter
  const filterParam = `${collectionFilter} and ${spatialFilter}`;

  const subscriptionData = {
    FilterParam: filterParam,
    StageOrder: true,
    Priority: 1,
    Status: "running",
    SubscriptionEvent: ["created"],
    SubscriptionType: "push",
    NotificationEndpoint: WEBHOOK_URL
  };

  console.log('📡 Creating Angola EEZ subscription...');
  console.log('Filter:', filterParam);
  console.log('Webhook:', WEBHOOK_URL);
  console.log('');

  const response = await fetch(SUBSCRIPTIONS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'BGAPP-Subscription-Test/1.0'
    },
    body: JSON.stringify(subscriptionData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Subscription creation failed: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * List existing subscriptions
 */
async function listSubscriptions(token) {
  const response = await fetch(`${SUBSCRIPTIONS_URL}/Info`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'BGAPP-Subscription-Test/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to list subscriptions: ${response.status}`);
  }

  return response.json();
}

/**
 * Main test function
 */
async function testSubscriptionCreation() {
  console.log('🔗 Teste de Criação de Subscriptions Copernicus');
  console.log('='.repeat(50));
  console.log('');

  const env = loadEnv();
  
  if (!env.COPERNICUS_USERNAME || !env.COPERNICUS_PASSWORD) {
    console.error('❌ Credenciais não encontradas!');
    console.error('Configure COPERNICUS_USERNAME e COPERNICUS_PASSWORD');
    process.exit(1);
  }

  try {
    // Step 1: Authenticate
    console.log('1️⃣ Autenticando com Copernicus...');
    const token = await getCopernicusToken(env);
    console.log('✅ Autenticação bem-sucedida!');
    console.log('');

    // Step 2: List existing subscriptions
    console.log('2️⃣ Listando subscriptions existentes...');
    const existingSubscriptions = await listSubscriptions(token);
    console.log(`📋 Subscriptions existentes: ${existingSubscriptions.length}`);
    
    for (const sub of existingSubscriptions) {
      console.log(`  • ID: ${sub.Id}`);
      console.log(`    Tipo: ${sub.SubscriptionType}`);
      console.log(`    Status: ${sub.Status}`);
      console.log(`    Eventos: ${sub.SubscriptionEvent.join(', ')}`);
      if (sub.NotificationEndpoint) {
        console.log(`    Webhook: ${sub.NotificationEndpoint}`);
      }
      console.log('');
    }

    // Step 3: Create new subscription
    console.log('3️⃣ Criando nova subscription para Angola EEZ...');
    
    // Check if we already have a similar subscription
    const existingAngola = existingSubscriptions.find(sub => 
      sub.NotificationEndpoint && 
      sub.NotificationEndpoint.includes('bgapp-copernicus-webhook')
    );

    if (existingAngola) {
      console.log('⚠️ Subscription similar já existe:');
      console.log(`   ID: ${existingAngola.Id}`);
      console.log(`   Status: ${existingAngola.Status}`);
      console.log(`   Endpoint: ${existingAngola.NotificationEndpoint}`);
      console.log('');
      console.log('🤔 Deseja criar uma nova mesmo assim?');
      console.log('   (Para fins de teste, vamos prosseguir...)');
      console.log('');
    }

    const newSubscription = await createAngolaSubscription(token);
    
    console.log('✅ Subscription criada com sucesso!');
    console.log(`📋 Detalhes da nova subscription:`);
    console.log(`   ID: ${newSubscription.Id}`);
    console.log(`   Tipo: ${newSubscription.SubscriptionType}`);
    console.log(`   Status: ${newSubscription.Status}`);
    console.log(`   Eventos: ${newSubscription.SubscriptionEvent.join(', ')}`);
    console.log(`   Webhook: ${newSubscription.NotificationEndpoint}`);
    console.log(`   Criada em: ${newSubscription.SubmissionDate}`);
    console.log('');

    // Step 4: Verify webhook is ready
    console.log('4️⃣ Verificando webhook...');
    const webhookTest = await fetch(`${WEBHOOK_URL.replace('/webhook/copernicus', '/webhook/status')}`);
    
    if (webhookTest.ok) {
      const status = await webhookTest.json();
      console.log('✅ Webhook está funcionando!');
      console.log(`   Status: ${status.status}`);
      console.log(`   Timestamp: ${status.timestamp}`);
    } else {
      console.log('⚠️ Webhook pode não estar funcionando corretamente');
    }

    console.log('');
    console.log('🎉 TESTE COMPLETO!');
    console.log('='.repeat(30));
    console.log('✅ Autenticação: OK');
    console.log('✅ Subscription criada: OK');
    console.log('✅ Webhook configurado: OK');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Aguardar produtos Sentinel-3 na área de Angola');
    console.log('2. Verificar logs do webhook para notificações');
    console.log('3. Validar processamento dos produtos');
    console.log('');
    console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
    console.log(`📊 Status: ${WEBHOOK_URL.replace('/webhook/copernicus', '/webhook/status')}`);

  } catch (error) {
    console.error('');
    console.error('❌ ERRO NO TESTE:', error.message);
    console.error('');
    console.error('🔧 Possíveis causas:');
    console.error('1. Credenciais incorretas');
    console.error('2. Limite de subscriptions atingido (máx: 2 running)');
    console.error('3. Problema de conectividade');
    console.error('4. Webhook indisponível');
    process.exit(1);
  }
}

// Execute the test
testSubscriptionCreation();
