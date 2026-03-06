#!/usr/bin/env node

/**
 * Verify map stability fixes are working
 * Tests all 4 critical issues that were fixed
 */

import fs from 'fs/promises';

console.log('🔍 Verifying Map Stability Fixes...\n');
console.log('=' .repeat(50));

// Check Fix 1: Chlorophyll layer uses bounding box filter
async function checkChlorophyllFix() {
  console.log('\n✅ Fix 1: Chlorophyll Layer Bounding Box Filter');
  console.log('-' .repeat(40));

  const chlorophyllContent = await fs.readFile(
    'apps/realtime-angola/src/components/map/ChlorophyllCircleLayer.tsx',
    'utf-8'
  );

  const checks = {
    'Imports eezFilter': chlorophyllContent.includes("import { filterPointsInEEZ, ANGOLA_EEZ_BOUNDS } from '@/utils/eezFilter'"),
    'Uses filterPointsInEEZ': chlorophyllContent.includes('filterPointsInEEZ('),
    'Console log for bounding box': chlorophyllContent.includes('Using simple bounding box filter'),
    'No turf polygon check': !chlorophyllContent.includes('turf.booleanPointInPolygon')
  };

  for (const [check, passed] of Object.entries(checks)) {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  }

  return Object.values(checks).every(v => v);
}

// Check Fix 2: Refresh intervals fixed
async function checkRefreshIntervalFix() {
  console.log('\n✅ Fix 2: Refresh Interval Configuration');
  console.log('-' .repeat(40));

  const providerContent = await fs.readFile(
    'apps/realtime-angola/src/providers/RealtimeProvider.tsx',
    'utf-8'
  );

  const checks = {
    'Uses REFRESH_INTERVALS.marine': providerContent.includes('REFRESH_INTERVALS.marine'),
    'No REFRESH_INTERVALS.realtime': !providerContent.includes('REFRESH_INTERVALS.realtime'),
    'Marine interval setup': providerContent.includes('const marineInterval = setInterval(fetchMarineData, REFRESH_INTERVALS.marine)')
  };

  for (const [check, passed] of Object.entries(checks)) {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  }

  return Object.values(checks).every(v => v);
}

// Check Fix 3: ImprovedBaseMapSelector exists and is used
async function checkBaseMapSelectorFix() {
  console.log('\n✅ Fix 3: Improved Base Map Selector');
  console.log('-' .repeat(40));

  // Check file exists
  try {
    const selectorContent = await fs.readFile(
      'apps/realtime-angola/src/components/map/ImprovedBaseMapSelector.tsx',
      'utf-8'
    );

    const selectorChecks = {
      'Has retry mechanism': selectorContent.includes('retryCount < 3'),
      'Has exponential backoff': selectorContent.includes('Math.pow(2, retryCount)'),
      'Has tileerror handler': selectorContent.includes("layer.on('tileerror'"),
      'Has loading status': selectorContent.includes('setLoadingStatus'),
      'Has error tiles tracking': selectorContent.includes('setErrorTiles')
    };

    for (const [check, passed] of Object.entries(selectorChecks)) {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    }
  } catch (error) {
    console.log('  ❌ ImprovedBaseMapSelector.tsx not found');
    return false;
  }

  // Check it's imported in RealTimeMap
  const mapContent = await fs.readFile(
    'apps/realtime-angola/src/components/map/RealTimeMap.tsx',
    'utf-8'
  );

  const importCheck = mapContent.includes("import { ImprovedBaseMapSelector } from './ImprovedBaseMapSelector'");
  console.log(`  ${importCheck ? '✅' : '❌'} Imported in RealTimeMap`);

  return importCheck;
}

// Check Fix 4: Layer persistence on map events
async function checkLayerPersistenceFix() {
  console.log('\n✅ Fix 4: Layer Persistence on Map Events');
  console.log('-' .repeat(40));

  const selectorContent = await fs.readFile(
    'apps/realtime-angola/src/components/map/ImprovedBaseMapSelector.tsx',
    'utf-8'
  );

  const checks = {
    'Has moveend handler': selectorContent.includes("map.on('moveend'"),
    'Has zoomend handler': selectorContent.includes("map.on('zoomend'"),
    'Re-adds layer if missing': selectorContent.includes('Re-adding layer after map move'),
    'Forces redraw on zoom': selectorContent.includes('layers[currentLayer].redraw()'),
    'Cleanup removes handlers': selectorContent.includes("map.off('moveend'") && selectorContent.includes("map.off('zoomend'")
  };

  for (const [check, passed] of Object.entries(checks)) {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  }

  return Object.values(checks).every(v => v);
}

// Test API endpoints
async function testAPIs() {
  console.log('\n📊 Testing API Endpoints');
  console.log('-' .repeat(40));

  const apis = [
    { name: 'Ocean Color', url: 'http://localhost:3002/api/environmental/ocean-color?limit=5' },
    { name: 'Salinity', url: 'http://localhost:3002/api/environmental/salinity?limit=5' },
    { name: 'SST', url: 'http://localhost:3002/api/environmental/sst?limit=5' },
    { name: 'ML Predictions', url: 'http://localhost:3002/api/ml/predictions?limit=5' }
  ];

  let allWorking = true;

  for (const api of apis) {
    try {
      const response = await fetch(api.url);
      const data = await response.json();
      const count = data.data?.length || 0;
      console.log(`  ✅ ${api.name}: ${count} records`);
    } catch (error) {
      console.log(`  ❌ ${api.name}: Failed`);
      allWorking = false;
    }
  }

  return allWorking;
}

// Run all checks
async function runAllChecks() {
  const results = {
    'Chlorophyll Fix': await checkChlorophyllFix(),
    'Refresh Interval Fix': await checkRefreshIntervalFix(),
    'Base Map Selector Fix': await checkBaseMapSelectorFix(),
    'Layer Persistence Fix': await checkLayerPersistenceFix(),
    'APIs Working': await testAPIs()
  };

  console.log('\n' + '=' .repeat(50));
  console.log('📈 FINAL RESULTS');
  console.log('=' .repeat(50));

  let allPassed = true;
  for (const [name, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (!passed) allPassed = false;
  }

  console.log('\n' + '=' .repeat(50));
  if (allPassed) {
    console.log('🎉 ALL FIXES VERIFIED SUCCESSFULLY!');
    console.log('\nNext Steps:');
    console.log('1. Open http://localhost:3002 in browser');
    console.log('2. Check DevTools Console for:');
    console.log('   - "[ChlorophyllCircleLayer] Using simple bounding box filter"');
    console.log('   - "[ChlorophyllCircleLayer] After bounding box filtering: X points remain"');
    console.log('3. Verify visually:');
    console.log('   - Chlorophyll layer (green circles) visible');
    console.log('   - Salinity layer (blue-red gradient) visible');
    console.log('   - Background tiles loading with retry on failure');
    console.log('   - Data persists when panning/zooming map');
  } else {
    console.log('⚠️ Some fixes need attention');
    console.log('\nTroubleshooting:');
    console.log('1. Check if dev server is running on port 3002');
    console.log('2. Review error messages above');
    console.log('3. Run: node diagnose-data-persistence.mjs for more details');
  }
  console.log('=' .repeat(50));
}

runAllChecks().catch(console.error);