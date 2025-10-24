#!/usr/bin/env node

/**
 * Test script to verify data flow for chlorophyll and salinity layers
 * Run with: node test-layer-data-flow.mjs
 */

console.log('🔍 Testing data flow for chlorophyll and salinity layers...\n');

// Test 1: Verify API endpoints are returning data
async function testAPIEndpoints() {
  console.log('📡 Test 1: API Endpoints');

  const endpoints = [
    { name: 'Ocean Color', url: 'http://localhost:3002/api/environmental/ocean-color?limit=10&bbox=-18.02,8.9,-5.55,13.35' },
    { name: 'Salinity', url: 'http://localhost:3002/api/environmental/salinity?limit=10&bbox=-18.02,8.9,-5.55,13.35' },
    { name: 'SST', url: 'http://localhost:3002/api/environmental/sst?limit=10&bbox=-18.02,8.9,-5.55,13.35' },
    { name: 'ML Predictions', url: 'http://localhost:3002/api/ml/predictions?limit=10' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url);
      const data = await response.json();

      console.log(`✅ ${endpoint.name}:`, {
        status: response.status,
        records: data.data?.length || 0,
        firstRecord: data.data?.[0] ? {
          lat: data.data[0].latitude,
          lon: data.data[0].longitude,
          value: data.data[0].chlorophyll_a || data.data[0].salinity || data.data[0].temperature || data.data[0].confidence
        } : 'No data'
      });
    } catch (error) {
      console.error(`❌ ${endpoint.name}: Failed -`, error.message);
    }
  }
  console.log('');
}

// Test 2: Verify data transformation
async function testDataTransformation() {
  console.log('🔄 Test 2: Data Transformation');

  try {
    // Fetch ocean color data
    const response = await fetch('http://localhost:3002/api/environmental/ocean-color?limit=5&bbox=-18.02,8.9,-5.55,13.35');
    const result = await response.json();
    const oceanColorData = result.data || [];

    // Simulate the transformation from RealTimeMap.tsx
    const chlorophyllData = oceanColorData.map(point => ({
      lat: point.latitude,
      lng: point.longitude,
      value: point.chlorophyll_a,
      chlorophyll: point.chlorophyll_a,
      turbidity: point.turbidity,
      timestamp: point.timestamp,
      quality: point.quality_flag && point.quality_flag > 0.8 ? 'high' :
               point.quality_flag && point.quality_flag > 0.5 ? 'medium' : 'low'
    }));

    console.log('✅ Ocean Color → Chlorophyll transformation:', {
      input: oceanColorData.length,
      output: chlorophyllData.length,
      sample: chlorophyllData[0]
    });
  } catch (error) {
    console.error('❌ Transformation failed:', error.message);
  }
  console.log('');
}

// Test 3: Check Angola EEZ boundary
async function testEEZBoundary() {
  console.log('🗺️ Test 3: Angola EEZ Boundary Check');

  const angolaEEZ = {
    minLat: -18.02,
    maxLat: -5.55,
    minLon: 8.9,
    maxLon: 13.35
  };

  console.log('Angola EEZ bounds:', angolaEEZ);

  // Test some sample points
  const testPoints = [
    { lat: -12.5, lon: 13.2, expected: true, name: 'Luanda area' },
    { lat: -10.0, lon: 12.0, expected: true, name: 'Northern coast' },
    { lat: -16.0, lon: 11.5, expected: true, name: 'Southern coast' },
    { lat: 0, lon: 0, expected: false, name: 'Equator/Prime Meridian' },
    { lat: -20.0, lon: 15.0, expected: false, name: 'South of EEZ' }
  ];

  for (const point of testPoints) {
    const inBounds = point.lat >= angolaEEZ.minLat &&
                     point.lat <= angolaEEZ.maxLat &&
                     point.lon >= angolaEEZ.minLon &&
                     point.lon <= angolaEEZ.maxLon;

    console.log(`  ${inBounds === point.expected ? '✅' : '❌'} ${point.name}: (${point.lat}, ${point.lon}) - ${inBounds ? 'Inside' : 'Outside'} EEZ`);
  }
  console.log('');
}

// Test 4: Verify data is within EEZ
async function testDataInEEZ() {
  console.log('📍 Test 4: Data Points in EEZ');

  const angolaEEZ = {
    minLat: -18.02,
    maxLat: -5.55,
    minLon: 8.9,
    maxLon: 13.35
  };

  const endpoints = [
    { name: 'Ocean Color', url: 'http://localhost:3002/api/environmental/ocean-color?limit=100&bbox=-18.02,8.9,-5.55,13.35' },
    { name: 'Salinity', url: 'http://localhost:3002/api/environmental/salinity?limit=100&bbox=-18.02,8.9,-5.55,13.35' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url);
      const result = await response.json();
      const data = result.data || [];

      const pointsInEEZ = data.filter(point =>
        point.latitude >= angolaEEZ.minLat &&
        point.latitude <= angolaEEZ.maxLat &&
        point.longitude >= angolaEEZ.minLon &&
        point.longitude <= angolaEEZ.maxLon
      );

      console.log(`${endpoint.name}:`, {
        total: data.length,
        inEEZ: pointsInEEZ.length,
        percentage: data.length > 0 ? ((pointsInEEZ.length / data.length) * 100).toFixed(1) + '%' : 'N/A',
        samplePoint: pointsInEEZ[0] ? {
          lat: pointsInEEZ[0].latitude.toFixed(2),
          lon: pointsInEEZ[0].longitude.toFixed(2)
        } : 'No points in EEZ'
      });
    } catch (error) {
      console.error(`❌ ${endpoint.name}: Failed -`, error.message);
    }
  }
  console.log('');
}

// Run all tests
async function runTests() {
  console.log('Starting tests at', new Date().toLocaleTimeString());
  console.log('='.repeat(50));
  console.log('');

  await testAPIEndpoints();
  await testDataTransformation();
  await testEEZBoundary();
  await testDataInEEZ();

  console.log('='.repeat(50));
  console.log('Tests complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Open http://localhost:3002 in browser');
  console.log('2. Open browser DevTools Console (F12)');
  console.log('3. Look for [ChlorophyllCircleLayer] and [SalinityLayer] logs');
  console.log('4. Check if "After EEZ filtering: 0 points remain" appears');
  console.log('5. If yes, the EEZ boundary filtering is removing all points');
}

runTests().catch(console.error);