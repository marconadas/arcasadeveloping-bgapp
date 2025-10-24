// Test script to verify all map layers are receiving and displaying data
const fetch = require('node-fetch');

async function testMapLayers() {
  console.log('🔍 Testing Map Layer Data Flow...\n');

  const BASE_URL = 'http://localhost:3002/api/environmental';
  const ML_URL = 'http://localhost:3002/api/realtime/ml-predictions';

  const tests = [
    {
      name: 'Ocean Color (Chlorophyll)',
      url: `${BASE_URL}/ocean-color?bbox=-18.02,-5.55,8.9,13.35&limit=2000`,
      dataKey: 'data',
      valueField: 'chlorophyll_a'
    },
    {
      name: 'SST (Temperature)',
      url: `${BASE_URL}/sst?bbox=-18.02,-5.55,8.9,13.35&limit=2000`,
      dataKey: 'data',
      valueField: 'temperature'
    },
    {
      name: 'Salinity',
      url: `${BASE_URL}/salinity?bbox=-18.02,-5.55,8.9,13.35&limit=1000`,
      dataKey: 'data',
      valueField: 'salinity'
    },
    {
      name: 'ML Predictions',
      url: ML_URL,
      dataKey: 'predictions',
      valueField: 'prediction_value'
    }
  ];

  const results = {};

  for (const test of tests) {
    try {
      console.log(`📊 Testing ${test.name}...`);
      const response = await fetch(test.url);
      const data = await response.json();

      const records = data[test.dataKey] || [];
      const validRecords = records.filter(r =>
        r.latitude && r.longitude && r[test.valueField] !== undefined
      );

      results[test.name] = {
        total: records.length,
        valid: validRecords.length,
        sample: validRecords.slice(0, 3).map(r => ({
          lat: r.latitude,
          lon: r.longitude,
          value: r[test.valueField],
          timestamp: r.timestamp
        }))
      };

      console.log(`✅ ${test.name}: ${validRecords.length}/${records.length} valid records`);

      if (validRecords.length > 0) {
        console.log(`   Sample point: lat=${validRecords[0].latitude.toFixed(4)}, lon=${validRecords[0].longitude.toFixed(4)}, ${test.valueField}=${validRecords[0][test.valueField]}`);
      }
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error.message);
      results[test.name] = { error: error.message };
    }
    console.log();
  }

  // Summary
  console.log('📈 SUMMARY OF MAP LAYER DATA:');
  console.log('================================');

  for (const [layer, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`❌ ${layer}: ERROR - ${result.error}`);
    } else {
      const status = result.valid > 0 ? '✅' : '⚠️';
      console.log(`${status} ${layer}: ${result.valid} points ready for display`);

      if (result.valid === 0 && result.total > 0) {
        console.log(`   ⚠️  Data exists but may have missing coordinates or values`);
      }
    }
  }

  console.log('\n🎯 EXPECTED BEHAVIOR ON MAP:');
  console.log('================================');
  console.log('If layers are toggled ON but not visible, check:');
  console.log('1. Browser console for [ChlorophyllCircleLayer] logs');
  console.log('2. Layer opacity settings (should be > 0)');
  console.log('3. EEZ boundary filtering (points must be within Angola EEZ)');
  console.log('4. Z-index/stacking order (ML points might be covering other layers)');
  console.log('5. Color scale visibility (some values might render too faint)');

  // Check if only ML is visible as reported by user
  const onlyMLVisible = results['ML Predictions']?.valid > 0 &&
    ['Ocean Color (Chlorophyll)', 'SST (Temperature)', 'Salinity'].every(
      layer => results[layer]?.valid === 0
    );

  if (onlyMLVisible) {
    console.log('\n⚠️  WARNING: Only ML predictions have valid data!');
    console.log('This matches the user-reported issue: "only ML points visible"');
  } else if (Object.values(results).every(r => r.valid > 0)) {
    console.log('\n✅ All layers have valid data! Issue might be rendering-related.');
  }
}

// Add global fetch if not available
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testMapLayers().catch(console.error);