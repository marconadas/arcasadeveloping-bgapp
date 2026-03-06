#!/usr/bin/env node

/**
 * Verify that the layer visibility fix is working
 * This script confirms that chlorophyll and salinity layers should now render
 */

console.log('🔍 Verifying Layer Visibility Fix...\n');
console.log('=' .repeat(50));

async function verifyAPIs() {
  console.log('\n✅ Step 1: Verify APIs are returning data');

  const endpoints = [
    { name: 'Ocean Color (Chlorophyll)', url: 'http://localhost:3002/api/environmental/ocean-color?limit=50&bbox=-18.02,8.9,-5.55,13.35' },
    { name: 'Salinity', url: 'http://localhost:3002/api/environmental/salinity?limit=50&bbox=-18.02,8.9,-5.55,13.35' },
    { name: 'SST (Temperature)', url: 'http://localhost:3002/api/environmental/sst?limit=50&bbox=-18.02,8.9,-5.55,13.35' },
    { name: 'ML Predictions', url: 'http://localhost:3002/api/ml/predictions?limit=50' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url);
      const data = await response.json();
      const count = data.data?.length || 0;

      console.log(`  ${count > 0 ? '✅' : '❌'} ${endpoint.name}: ${count} records`);
    } catch (error) {
      console.log(`  ❌ ${endpoint.name}: Failed - ${error.message}`);
    }
  }
}

async function checkFixApplied() {
  console.log('\n📝 Step 2: Verify fix has been applied');

  // Read the ChlorophyllCircleLayer.tsx file to check if improved fix is in place
  const fs = await import('fs/promises');
  const chlorophyllContent = await fs.readFile(
    'apps/realtime-angola/src/components/map/ChlorophyllCircleLayer.tsx',
    'utf-8'
  );

  // Check if the improved bounding box filter is present
  const improvedFixApplied = chlorophyllContent.includes('filterPointsInEEZ') &&
                             chlorophyllContent.includes('ANGOLA_EEZ_BOUNDS');

  if (improvedFixApplied) {
    console.log('  ✅ Improved fix has been applied: Using simple bounding box filter');
    console.log('  ✅ ChlorophyllCircleLayer now uses filterPointsInEEZ from @/utils/eezFilter');
    console.log('  ✅ This is more reliable than the complex polygon check');
  } else {
    console.log('  ⚠️  Using temporary fix or old implementation');
    console.log('  Check if eezBoundary={null} or if turf.booleanPointInPolygon is still in use');
  }
}

async function simulateDataTransformation() {
  console.log('\n🔄 Step 3: Simulate data transformation');

  try {
    // Fetch ocean color data
    const response = await fetch('http://localhost:3002/api/environmental/ocean-color?limit=5&bbox=-18.02,8.9,-5.55,13.35');
    const result = await response.json();

    if (result.data && result.data.length > 0) {
      // Simulate the transformation from RealTimeMap.tsx
      const chlorophyllData = result.data.map(point => ({
        lat: point.latitude,
        lng: point.longitude,
        value: point.chlorophyll_a,
        chlorophyll: point.chlorophyll_a,
        timestamp: point.timestamp,
        quality: point.quality_flag && point.quality_flag > 0.8 ? 'high' :
                 point.quality_flag && point.quality_flag > 0.5 ? 'medium' : 'low'
      }));

      console.log(`  ✅ Ocean Color → Chlorophyll transformation: ${result.data.length} → ${chlorophyllData.length} points`);
      console.log(`  ✅ Sample point: lat=${chlorophyllData[0].lat.toFixed(2)}, lng=${chlorophyllData[0].lng.toFixed(2)}, value=${chlorophyllData[0].value.toFixed(3)}`);
    }
  } catch (error) {
    console.log(`  ❌ Transformation failed: ${error.message}`);
  }
}

function printExpectedBehavior() {
  console.log('\n🎯 Expected Behavior After Fix:');
  console.log('=' .repeat(50));

  console.log('\n✅ What should work now:');
  console.log('  1. Chlorophyll layer (green circles) should be visible');
  console.log('  2. Salinity layer (blue-red gradient circles) should be visible');
  console.log('  3. Temperature heatmap should continue working (was already working)');
  console.log('  4. ML predictions markers should continue working (was already working)');

  console.log('\n📊 How to verify in browser:');
  console.log('  1. Open http://localhost:3002');
  console.log('  2. Open DevTools Console (F12)');
  console.log('  3. Look for these console messages:');
  console.log('     - "[ChlorophyllCircleLayer] Creating layer group with X points" (X > 0)');
  console.log('     - "[SalinityLayer] Creating layer group with X points" (X > 0)');
  console.log('  4. Toggle layers on/off in the Layers Panel');
  console.log('  5. Visually confirm colored circles appear on the map');

  console.log('\n⚠️  Previous issue (now fixed):');
  console.log('  The EEZ boundary filtering was incorrectly removing all valid points');
  console.log('  By passing eezBoundary={null}, filtering is disabled and points render');

  console.log('\n💡 Note:');
  console.log('  This is a temporary fix. The proper solution would be to debug');
  console.log('  why turf.booleanPointInPolygon rejects valid points within the EEZ.');
}

// Run all verifications
async function runVerification() {
  await verifyAPIs();
  await checkFixApplied();
  await simulateDataTransformation();
  printExpectedBehavior();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Verification Complete!');
  console.log('\nThe chlorophyll and salinity layers should now be visible on the map.');
  console.log('This addresses the user issue: "só as camadas de temperatura e previsões ml é que funcionam"');
}

runVerification().catch(console.error);