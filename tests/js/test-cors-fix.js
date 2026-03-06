#!/usr/bin/env node

/**
 * 🧪 CORS Fix Test Script
 * Tests the x-client-version header CORS fix
 */

const https = require('https');
const http = require('http');

// Test endpoints
const TEST_ENDPOINTS = [
  'https://bgapp-api.majearcasa.workers.dev/api/ml/retention/policies',
  'https://bgapp-api.majearcasa.workers.dev/api/ml/retention/performance/history?interval=hour&limit=24',
  'https://bgapp-admin-api-worker.majearcasa.workers.dev/api/ml/retention/policies'
];

// Headers to test
const TEST_HEADERS = {
  'Content-Type': 'application/json',
  'X-Client-Version': '2.0.0',
  'X-Client-Platform': 'web',
  'X-Request-ID': 'test-' + Date.now(),
  'Origin': 'https://bgapp-admin.pages.dev'
};

async function testCORS(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    console.log(`\n🧪 Testing CORS for: ${url}`);
    
    // First, test OPTIONS preflight request
    const optionsReq = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'OPTIONS',
      headers: {
        'Origin': TEST_HEADERS.Origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-Client-Version, X-Client-Platform, X-Request-ID, Content-Type'
      }
    }, (res) => {
      console.log(`   OPTIONS Status: ${res.statusCode}`);
      console.log(`   CORS Allow-Origin: ${res.headers['access-control-allow-origin']}`);
      console.log(`   CORS Allow-Headers: ${res.headers['access-control-allow-headers']}`);
      
      const allowedHeaders = res.headers['access-control-allow-headers'] || '';
      const hasClientVersion = allowedHeaders.toLowerCase().includes('x-client-version');
      const hasClientPlatform = allowedHeaders.toLowerCase().includes('x-client-platform');
      const hasRequestId = allowedHeaders.toLowerCase().includes('x-request-id');
      
      console.log(`   ✅ X-Client-Version allowed: ${hasClientVersion}`);
      console.log(`   ✅ X-Client-Platform allowed: ${hasClientPlatform}`);
      console.log(`   ✅ X-Request-ID allowed: ${hasRequestId}`);
      
      if (hasClientVersion && hasClientPlatform && hasRequestId) {
        console.log(`   🎉 CORS Fix SUCCESS for ${url}`);
        resolve({ url, success: true, status: res.statusCode });
      } else {
        console.log(`   ❌ CORS Fix FAILED for ${url}`);
        resolve({ url, success: false, status: res.statusCode, missing: {
          clientVersion: !hasClientVersion,
          clientPlatform: !hasClientPlatform,
          requestId: !hasRequestId
        }});
      }
    });
    
    optionsReq.on('error', (err) => {
      console.log(`   ❌ Error testing ${url}: ${err.message}`);
      resolve({ url, success: false, error: err.message });
    });
    
    optionsReq.end();
  });
}

async function testActualRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    console.log(`\n🚀 Testing actual GET request for: ${url}`);
    
    const getReq = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: TEST_HEADERS
    }, (res) => {
      console.log(`   GET Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`   🎉 Request SUCCESS for ${url}`);
          try {
            const parsed = JSON.parse(data);
            console.log(`   📊 Response keys: ${Object.keys(parsed).join(', ')}`);
          } catch (e) {
            console.log(`   📊 Response length: ${data.length} chars`);
          }
          resolve({ url, success: true, status: res.statusCode });
        } else {
          console.log(`   ❌ Request FAILED for ${url}`);
          console.log(`   📄 Response: ${data.substring(0, 200)}...`);
          resolve({ url, success: false, status: res.statusCode, response: data });
        }
      });
    });
    
    getReq.on('error', (err) => {
      console.log(`   ❌ Error with GET request ${url}: ${err.message}`);
      resolve({ url, success: false, error: err.message });
    });
    
    getReq.end();
  });
}

async function runTests() {
  console.log('🧪 BGAPP CORS Fix Test Suite');
  console.log('=============================');
  
  const corsResults = [];
  const requestResults = [];
  
  // Test CORS preflight
  console.log('\n📋 Phase 1: Testing CORS Preflight (OPTIONS)');
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testCORS(endpoint);
    corsResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between requests
  }
  
  // Test actual requests
  console.log('\n📋 Phase 2: Testing Actual Requests (GET)');
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testActualRequest(endpoint);
    requestResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between requests
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  
  const corsSuccess = corsResults.filter(r => r.success).length;
  const requestSuccess = requestResults.filter(r => r.success).length;
  
  console.log(`CORS Tests: ${corsSuccess}/${corsResults.length} passed`);
  console.log(`Request Tests: ${requestSuccess}/${requestResults.length} passed`);
  
  if (corsSuccess === corsResults.length && requestSuccess === requestResults.length) {
    console.log('\n🎉 ALL TESTS PASSED! CORS fix is working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Check the logs above for details.');
    
    // Show failed tests
    const failedCors = corsResults.filter(r => !r.success);
    const failedRequests = requestResults.filter(r => !r.success);
    
    if (failedCors.length > 0) {
      console.log('\n❌ Failed CORS tests:');
      failedCors.forEach(r => console.log(`   - ${r.url}: ${r.error || 'Headers not allowed'}`));
    }
    
    if (failedRequests.length > 0) {
      console.log('\n❌ Failed request tests:');
      failedRequests.forEach(r => console.log(`   - ${r.url}: ${r.error || `Status ${r.status}`}`));
    }
    
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);