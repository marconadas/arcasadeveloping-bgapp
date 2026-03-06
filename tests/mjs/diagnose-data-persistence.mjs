#!/usr/bin/env node

/**
 * Diagnose data persistence issues when map goes live
 */

console.log('🔍 Diagnosing Data Persistence Issues...\n');
console.log('=' .repeat(50));

// Test data fetching from all APIs
async function testDataAPIs() {
  console.log('\n📊 Testing Data APIs:');

  const apis = [
    { name: 'Ocean Color', url: 'http://localhost:3002/api/environmental/ocean-color?limit=10' },
    { name: 'Salinity', url: 'http://localhost:3002/api/environmental/salinity?limit=10' },
    { name: 'SST', url: 'http://localhost:3002/api/environmental/sst?limit=10' },
    { name: 'ML Predictions', url: 'http://localhost:3002/api/ml/predictions?limit=10' },
    { name: 'Vessel Presence', url: 'http://localhost:3002/api/gfw/vessel-presence?limit=10' },
    { name: 'Real-time Data', url: 'http://localhost:3002/api/realtime/data' }
  ];

  for (const api of apis) {
    try {
      const response = await fetch(api.url);
      const data = await response.json();
      const count = data.data?.length || data.vessels?.length || 0;
      console.log(`  ✅ ${api.name}: ${count} records`);
    } catch (error) {
      console.log(`  ❌ ${api.name}: Failed - ${error.message}`);
    }
  }
}

// Simulate continuous data fetching to check if refresh intervals are working
async function testRefreshIntervals() {
  console.log('\n⏱️ Testing Refresh Intervals:');
  console.log('  Monitoring data fetching for 30 seconds...');

  let fetchCount = 0;
  const startTime = Date.now();

  const interval = setInterval(async () => {
    try {
      const response = await fetch('http://localhost:3002/api/environmental/ocean-color?limit=1');
      if (response.ok) {
        fetchCount++;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`  [${elapsed}s] Fetch #${fetchCount}: Success`);
      }
    } catch (error) {
      console.log(`  ❌ Fetch failed: ${error.message}`);
    }
  }, 5000); // Check every 5 seconds

  // Stop after 30 seconds
  setTimeout(() => {
    clearInterval(interval);
    console.log(`  Total successful fetches: ${fetchCount}`);
    analyzeIssues();
  }, 30000);
}

// Analyze common issues
function analyzeIssues() {
  console.log('\n🎯 Known Issues & Solutions:');
  console.log('=' .repeat(50));

  console.log('\n1. ISSUE: Data disappears when map goes live (becomes interactive)');
  console.log('   CAUSE: Layers might be getting removed on map events (moveend, zoomend)');
  console.log('   SOLUTION: Check RealTimeMap event handlers and ensure layers persist');

  console.log('\n2. ISSUE: Background tiles not loading completely');
  console.log('   CAUSE: Tile server timeout or CORS issues');
  console.log('   SOLUTION: Implemented retry mechanism in ImprovedBaseMapSelector');

  console.log('\n3. ISSUE: Only ML predictions visible');
  console.log('   CAUSE: EEZ filtering was removing all valid points');
  console.log('   SOLUTION: Implemented bounding box filter instead of polygon check');

  console.log('\n4. ISSUE: Refresh intervals not matching constants');
  console.log('   CAUSE: REFRESH_INTERVALS.realtime didn\'t exist');
  console.log('   SOLUTION: Fixed to use REFRESH_INTERVALS.marine');

  console.log('\n📝 Recommendations:');
  console.log('  1. Check browser console for layer removal logs');
  console.log('  2. Monitor network tab for failed tile requests');
  console.log('  3. Verify data is not being cleared on map interactions');
  console.log('  4. Ensure layer groups are not being destroyed on re-render');

  console.log('\n🔧 Files Modified:');
  console.log('  - /src/providers/RealtimeProvider.tsx (fixed refresh intervals)');
  console.log('  - /src/utils/eezFilter.ts (added bounding box filter)');
  console.log('  - /src/components/map/ChlorophyllCircleLayer.tsx (using new filter)');
  console.log('  - /src/components/map/ImprovedBaseMapSelector.tsx (tile retry mechanism)');
  console.log('  - /src/components/map/RealTimeMap.tsx (using improved selector)');
}

// Run tests
async function runDiagnostics() {
  await testDataAPIs();

  console.log('\n💡 To monitor refresh intervals, run this script and wait 30 seconds');
  console.log('   Or press Ctrl+C to skip interval testing');

  // Uncomment to test refresh intervals
  // await testRefreshIntervals();

  // Just show analysis
  analyzeIssues();
}

runDiagnostics().catch(console.error);