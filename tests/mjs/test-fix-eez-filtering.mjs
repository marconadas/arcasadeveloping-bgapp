#!/usr/bin/env node

/**
 * Test to identify why layers aren't showing despite having data
 */

console.log('🔍 Testing why layers are not visible...\n');

// First, verify data is actually being fetched
async function verifyDataFlow() {
  console.log('📊 Step 1: Verify APIs are returning data');

  const endpoints = [
    { name: 'Ocean Color', url: 'http://localhost:3002/api/environmental/ocean-color?limit=5&bbox=-18.02,8.9,-5.55,13.35' },
    { name: 'Salinity', url: 'http://localhost:3002/api/environmental/salinity?limit=5&bbox=-18.02,8.9,-5.55,13.35' }
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint.url);
    const data = await response.json();

    console.log(`${endpoint.name}:`, {
      count: data.data?.length || 0,
      firstPoint: data.data?.[0] ? {
        lat: data.data[0].latitude,
        lon: data.data[0].longitude,
        value: data.data[0].chlorophyll_a || data.data[0].salinity
      } : null
    });
  }
}

// Check if EEZ boundary might be the issue
async function checkEEZBoundary() {
  console.log('\n📍 Step 2: Check if angola_eez.json is causing filtering issues');

  try {
    // Load the EEZ boundary file
    const response = await fetch('http://localhost:3002/angola_eez.json');
    const eezData = await response.json();

    console.log('EEZ file loaded:', {
      type: eezData.type,
      features: eezData.features?.length || 'not a feature collection',
      geometry: eezData.features?.[0]?.geometry?.type || eezData.geometry?.type
    });

    // Check if it's a valid GeoJSON
    if (eezData.features && eezData.features[0]) {
      const feature = eezData.features[0];
      const coords = feature.geometry.coordinates[0];

      // Find the bounding box
      let minLat = Infinity, maxLat = -Infinity;
      let minLon = Infinity, maxLon = -Infinity;

      coords.forEach(coord => {
        if (Array.isArray(coord[0])) {
          // Multi-polygon
          coord.forEach(c => {
            minLon = Math.min(minLon, c[0]);
            maxLon = Math.max(maxLon, c[0]);
            minLat = Math.min(minLat, c[1]);
            maxLat = Math.max(maxLat, c[1]);
          });
        } else {
          minLon = Math.min(minLon, coord[0]);
          maxLon = Math.max(maxLon, coord[0]);
          minLat = Math.min(minLat, coord[1]);
          maxLat = Math.max(maxLat, coord[1]);
        }
      });

      console.log('EEZ Bounding Box from file:', {
        minLat: minLat.toFixed(2),
        maxLat: maxLat.toFixed(2),
        minLon: minLon.toFixed(2),
        maxLon: maxLon.toFixed(2)
      });

      console.log('Expected Angola EEZ:', {
        minLat: -18.02,
        maxLat: -5.55,
        minLon: 8.9,
        maxLon: 13.35
      });

      // Check if they match
      const matches = Math.abs(minLat - (-18.02)) < 1 &&
                     Math.abs(maxLat - (-5.55)) < 1 &&
                     Math.abs(minLon - 8.9) < 1 &&
                     Math.abs(maxLon - 13.35) < 1;

      if (!matches) {
        console.log('⚠️ WARNING: EEZ boundary file might have incorrect coordinates!');
        console.log('This could cause all points to be filtered out.');
      } else {
        console.log('✅ EEZ boundary file coordinates look correct');
      }
    }
  } catch (error) {
    console.error('❌ Failed to load EEZ file:', error.message);
    console.log('This might be why EEZ filtering is not working!');
  }
}

// Check the actual React component behavior
async function simulateReactFlow() {
  console.log('\n🔄 Step 3: Simulate React component data flow');

  // Fetch ocean color data
  const response = await fetch('http://localhost:3002/api/environmental/ocean-color?limit=3&bbox=-18.02,8.9,-5.55,13.35');
  const result = await response.json();

  if (result.data && result.data.length > 0) {
    // Simulate the transformation in RealTimeMap.tsx
    console.log('Input oceanColorData:', result.data.length, 'points');

    const chlorophyllData = result.data.map(point => ({
      lat: point.latitude,
      lng: point.longitude,
      value: point.chlorophyll_a,
      chlorophyll: point.chlorophyll_a,
      timestamp: point.timestamp,
      quality: point.quality_flag && point.quality_flag > 0.8 ? 'high' :
               point.quality_flag && point.quality_flag > 0.5 ? 'medium' : 'low'
    }));

    console.log('Transformed chlorophyllData:', chlorophyllData.length, 'points');
    console.log('Sample transformed point:', chlorophyllData[0]);

    // Check what ChlorophyllCircleLayer would see
    console.log('\nWhat ChlorophyllCircleLayer receives:', {
      data: chlorophyllData,
      visible: true,
      opacity: 0.8,
      eezBoundary: '(loaded from /angola_eez.json)'
    });

    // Simulate EEZ filtering
    console.log('\n⚠️ If EEZ filtering removes all points, the layer won\'t render!');
    console.log('The component logs: "No data points after filtering! Check EEZ boundary or data coordinates"');
  }
}

// Suggest the fix
function suggestFix() {
  console.log('\n🔧 SUGGESTED FIX:\n');
  console.log('The issue appears to be with EEZ boundary filtering in ChlorophyllCircleLayer.');
  console.log('\nOption 1: Temporarily disable EEZ filtering to confirm it\'s the issue:');
  console.log('  In ChlorophyllCircleLayer.tsx, comment out lines 81-93 (EEZ filtering)');
  console.log('\nOption 2: Fix the EEZ boundary check:');
  console.log('  1. Verify angola_eez.json has correct coordinates');
  console.log('  2. Check if turf.booleanPointInPolygon is working correctly');
  console.log('  3. Log the actual EEZ boundary being used');
  console.log('\nOption 3: Pass null for eezBoundary to disable filtering:');
  console.log('  In RealTimeMap.tsx line 308, change eezBoundary={eezBoundary} to eezBoundary={null}');

  console.log('\n📝 The fact that ML Predictions and Temperature work suggests:');
  console.log('  - Data is flowing correctly from APIs');
  console.log('  - The issue is specific to Chlorophyll and Salinity layer rendering');
  console.log('  - Most likely the EEZ boundary filter is removing all points');
}

// Run all tests
async function runTests() {
  try {
    await verifyDataFlow();
    await checkEEZBoundary();
    await simulateReactFlow();
    suggestFix();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();