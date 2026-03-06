#!/usr/bin/env node

/**
 * Test script to verify layer toggle functionality
 * This script tests the API endpoints to ensure data is being fetched correctly
 */

const http = require('http');

const testEndpoints = [
  {
    name: 'SST (Temperature)',
    url: 'http://localhost:3002/api/environmental/sst?limit=10&bbox=-18.02,8.9,-5.55,13.35',
    expectedField: 'temperature'
  },
  {
    name: 'Ocean Color (Chlorophyll)',
    url: 'http://localhost:3002/api/environmental/ocean-color?limit=10&bbox=-18.02,8.9,-5.55,13.35',
    expectedField: 'chlorophyll_a'
  },
  {
    name: 'Salinity',
    url: 'http://localhost:3002/api/environmental/salinity?limit=10&bbox=-18.02,8.9,-5.55,13.35',
    expectedField: 'salinity'
  },
  {
    name: 'ML Predictions',
    url: 'http://localhost:3002/api/ml/predictions?limit=10',
    expectedField: 'prediction_type'
  },
  {
    name: 'Vessel Lights',
    url: 'http://localhost:3002/api/nasa/vessel-lights?limit=10&bbox=-18.02,8.9,-5.55,13.35',
    expectedField: 'radiance'
  }
];

function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    console.log(`\nTesting ${endpoint.name}...`);

    http.get(endpoint.url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);

          if (res.statusCode === 200) {
            console.log(`✅ ${endpoint.name}: SUCCESS`);

            // Check if data exists
            if (json.data && Array.isArray(json.data)) {
              console.log(`   - Received ${json.data.length} data points`);

              // Check if expected field exists in first data point
              if (json.data.length > 0 && json.data[0][endpoint.expectedField] !== undefined) {
                console.log(`   - Data structure verified (${endpoint.expectedField} field exists)`);
              } else if (json.data.length > 0) {
                console.log(`   - Warning: Expected field '${endpoint.expectedField}' not found`);
                console.log(`   - Available fields: ${Object.keys(json.data[0]).join(', ')}`);
              }
            } else {
              console.log(`   - No data array in response`);
            }

            resolve(true);
          } else {
            console.log(`❌ ${endpoint.name}: HTTP ${res.statusCode}`);
            console.log(`   - Error: ${json.error || json.message || 'Unknown error'}`);
            resolve(false);
          }
        } catch (e) {
          console.log(`❌ ${endpoint.name}: Failed to parse response`);
          console.log(`   - Error: ${e.message}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ ${endpoint.name}: Connection failed`);
      console.log(`   - Error: ${err.message}`);
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('BGAPP Realtime Angola - Layer API Endpoint Test');
  console.log('='.repeat(60));
  console.log(`Testing server at http://localhost:3002`);
  console.log(`Time: ${new Date().toISOString()}`);

  let successCount = 0;
  let failCount = 0;

  for (const endpoint of testEndpoints) {
    const success = await testEndpoint(endpoint);
    if (success) successCount++;
    else failCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}/${testEndpoints.length}`);
  console.log(`❌ Failed: ${failCount}/${testEndpoints.length}`);

  if (successCount === testEndpoints.length) {
    console.log('\n🎉 All API endpoints are working correctly!');
    console.log('The data layers should be receiving data properly.');
    console.log('\nNOTE: To fully test the toggle functionality, you should:');
    console.log('1. Open http://localhost:3002 in a browser');
    console.log('2. Open Developer Console (F12)');
    console.log('3. Click the layer checkboxes in the Layers Panel');
    console.log('4. Watch for console logs showing layer state changes');
  } else {
    console.log('\n⚠️ Some endpoints are not responding correctly.');
    console.log('This may affect layer visibility on the map.');
  }
}

// Run the tests
runTests().catch(console.error);