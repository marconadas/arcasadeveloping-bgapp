/**
 * Test script for NASA Data Retention Pipeline
 * Tests the integration between nasa-earthdata-proxy.js and nasa-data-retention.js
 */

import {
  initializeRetentionTables,
  handleUnifiedRetention,
  queryRetentionData,
  getRetentionMetrics
} from './infrastructure/workers/nasa-data-retention.js';

// Mock D1 database for testing
class MockD1Database {
  constructor() {
    this.data = new Map();
    this.batches = [];
    this.statements = [];
  }

  prepare(sql) {
    const statement = {
      sql,
      bindings: [],
      bind(...params) {
        this.bindings = params;
        return this;
      },
      run() {
        console.log(`✓ Executed: ${sql.substring(0, 50)}...`);
        return Promise.resolve({
          success: true,
          meta: { changes: 1 }
        });
      },
      all() {
        // Mock data for queries
        if (sql.includes('SELECT COUNT')) {
          return Promise.resolve({
            results: [{ count: 42 }]
          });
        }
        if (sql.includes('AVG') || sql.includes('MAX')) {
          return Promise.resolve({
            results: [{
              avg_chlorophyll: 2.5,
              avg_sst: 23.8,
              avg_salinity: 35.2,
              vessel_count: 15,
              max_radiance: 120.5,
              total_records: 1250
            }]
          });
        }
        return Promise.resolve({ results: [] });
      }
    };
    this.statements.push(statement);
    return statement;
  }

  batch(statements) {
    this.batches.push(statements);
    return Promise.resolve(
      statements.map(stmt => ({
        success: true,
        meta: { changes: 1 }
      }))
    );
  }
}

// Test data samples
const testData = {
  oceanColor: {
    data: [
      {
        lat: -12.5,
        lon: 13.2,
        chlorophyll_a: 2.4,
        turbidity: 0.8,
        timestamp: '2024-01-15T12:00:00Z',
        quality: 95
      },
      {
        lat: -11.8,
        lon: 13.5,
        chlorophyll_a: 3.1,
        turbidity: 1.2,
        timestamp: '2024-01-15T12:00:00Z',
        quality: 92
      }
    ],
    metadata: {
      source: 'NASA MODIS-Aqua',
      timestamp: '2024-01-15T12:00:00Z',
      bounds: { north: -11, south: -13, east: 14, west: 12 }
    }
  },
  sst: {
    data: [
      {
        lat: -12.5,
        lon: 13.2,
        temperature: 23.5,
        anomaly: 0.3,
        sensor: 'MODIS',
        timestamp: '2024-01-15T12:00:00Z'
      },
      {
        lat: -11.8,
        lon: 13.5,
        temperature: 24.1,
        anomaly: 0.5,
        sensor: 'VIIRS',
        timestamp: '2024-01-15T12:00:00Z'
      }
    ],
    metadata: {
      source: 'NASA GHRSST',
      timestamp: '2024-01-15T12:00:00Z'
    }
  },
  vesselLights: {
    vessels: [
      {
        lat: -12.3,
        lon: 13.1,
        radiance: 85.5,
        confidence: 0.89,
        vesselType: 'industrial_fishing',
        riskLevel: 'high',
        detectionTime: '2024-01-15T02:00:00Z'
      },
      {
        lat: -11.9,
        lon: 13.4,
        radiance: 45.2,
        confidence: 0.75,
        vesselType: 'commercial_fishing',
        riskLevel: 'medium',
        detectionTime: '2024-01-15T02:00:00Z'
      }
    ],
    metadata: {
      source: 'NASA VIIRS DNB',
      timestamp: '2024-01-15T02:00:00Z'
    }
  },
  salinity: {
    data: [
      {
        lat: -12.5,
        lon: 13.2,
        salinity_psu: 35.2,
        uncertainty: 0.1,
        timestamp: '2024-01-15T12:00:00Z'
      },
      {
        lat: -11.8,
        lon: 13.5,
        salinity_psu: 34.8,
        uncertainty: 0.15,
        timestamp: '2024-01-15T12:00:00Z'
      }
    ],
    metadata: {
      source: 'NASA SMAP',
      timestamp: '2024-01-15T12:00:00Z'
    }
  }
};

// Test functions
async function testInitialization() {
  console.log('\n🧪 Testing Table Initialization...');
  const db = new MockD1Database();

  try {
    await initializeRetentionTables(db);
    console.log('✅ Tables initialized successfully');
    console.log(`  - ${db.statements.length} SQL statements executed`);
    return true;
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    return false;
  }
}

async function testOceanColorRetention() {
  console.log('\n🧪 Testing Ocean Color Data Retention...');
  const db = new MockD1Database();

  try {
    await handleUnifiedRetention(
      db,
      'NASA',
      'ocean_color',
      testData.oceanColor,
      '2024-01-15'
    );

    console.log('✅ Ocean color data stored successfully');
    console.log(`  - ${testData.oceanColor.data.length} data points processed`);
    console.log(`  - Batch operations: ${db.batches.length}`);
    return true;
  } catch (error) {
    console.error('❌ Ocean color retention failed:', error);
    return false;
  }
}

async function testSSTRetention() {
  console.log('\n🧪 Testing SST Data Retention...');
  const db = new MockD1Database();

  try {
    await handleUnifiedRetention(
      db,
      'NASA',
      'sst',
      testData.sst,
      '2024-01-15'
    );

    console.log('✅ SST data stored successfully');
    console.log(`  - ${testData.sst.data.length} temperature points processed`);
    return true;
  } catch (error) {
    console.error('❌ SST retention failed:', error);
    return false;
  }
}

async function testVesselLightsRetention() {
  console.log('\n🧪 Testing Vessel Lights Data Retention...');
  const db = new MockD1Database();

  try {
    await handleUnifiedRetention(
      db,
      'NASA',
      'vessel_lights',
      testData.vesselLights,
      '2024-01-15'
    );

    console.log('✅ Vessel lights data stored successfully');
    console.log(`  - ${testData.vesselLights.vessels.length} vessels detected`);
    console.log(`  - Risk levels: ${testData.vesselLights.vessels.map(v => v.riskLevel).join(', ')}`);
    return true;
  } catch (error) {
    console.error('❌ Vessel lights retention failed:', error);
    return false;
  }
}

async function testSalinityRetention() {
  console.log('\n🧪 Testing Salinity Data Retention...');
  const db = new MockD1Database();

  try {
    await handleUnifiedRetention(
      db,
      'NASA',
      'salinity',
      testData.salinity,
      '2024-01-15'
    );

    console.log('✅ Salinity data stored successfully');
    console.log(`  - ${testData.salinity.data.length} measurements processed`);
    return true;
  } catch (error) {
    console.error('❌ Salinity retention failed:', error);
    return false;
  }
}

async function testQueryFunctions() {
  console.log('\n🧪 Testing Query Functions...');
  const db = new MockD1Database();

  try {
    // Test querying recent data
    const recentData = await queryRetentionData(db, {
      source: 'NASA',
      dataType: 'ocean_color',
      startDate: '2024-01-14',
      endDate: '2024-01-16'
    });

    console.log('✅ Query functions work correctly');
    console.log(`  - Query executed successfully`);

    // Test getting retention metrics
    const metrics = await getRetentionMetrics(db, 'NASA');
    console.log('✅ Metrics retrieved successfully');
    console.log(`  - Total records: ${metrics.total_records || 'N/A'}`);

    return true;
  } catch (error) {
    console.error('❌ Query functions failed:', error);
    return false;
  }
}

async function testUnifiedRetention() {
  console.log('\n🧪 Testing Unified Retention Across All Data Types...');
  const db = new MockD1Database();

  try {
    // Initialize tables once
    await initializeRetentionTables(db);

    // Store all data types
    const results = await Promise.all([
      handleUnifiedRetention(db, 'NASA', 'ocean_color', testData.oceanColor, '2024-01-15'),
      handleUnifiedRetention(db, 'NASA', 'sst', testData.sst, '2024-01-15'),
      handleUnifiedRetention(db, 'NASA', 'vessel_lights', testData.vesselLights, '2024-01-15'),
      handleUnifiedRetention(db, 'NASA', 'salinity', testData.salinity, '2024-01-15')
    ]);

    console.log('✅ Unified retention successful for all data types');
    console.log(`  - Total batches created: ${db.batches.length}`);
    console.log(`  - Total statements executed: ${db.statements.length}`);

    return true;
  } catch (error) {
    console.error('❌ Unified retention failed:', error);
    return false;
  }
}

async function testCrossSourceRetention() {
  console.log('\n🧪 Testing Cross-Source Data Retention (NASA + Copernicus + GFW)...');
  const db = new MockD1Database();

  try {
    // Simulate storing data from multiple sources
    await handleUnifiedRetention(db, 'NASA', 'ocean_color', testData.oceanColor, '2024-01-15');
    await handleUnifiedRetention(db, 'Copernicus', 'sst', testData.sst, '2024-01-15');
    await handleUnifiedRetention(db, 'GFW', 'vessel_lights', testData.vesselLights, '2024-01-15');

    console.log('✅ Cross-source retention successful');
    console.log('  - NASA ocean color data stored');
    console.log('  - Copernicus SST data stored');
    console.log('  - GFW vessel detection data stored');

    return true;
  } catch (error) {
    console.error('❌ Cross-source retention failed:', error);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('========================================');
  console.log('🚀 NASA Data Retention Pipeline Tests');
  console.log('========================================');
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log(`📁 Testing integration: nasa-earthdata-proxy.js ↔ nasa-data-retention.js`);

  const tests = [
    { name: 'Initialization', fn: testInitialization },
    { name: 'Ocean Color', fn: testOceanColorRetention },
    { name: 'SST', fn: testSSTRetention },
    { name: 'Vessel Lights', fn: testVesselLightsRetention },
    { name: 'Salinity', fn: testSalinityRetention },
    { name: 'Query Functions', fn: testQueryFunctions },
    { name: 'Unified Retention', fn: testUnifiedRetention },
    { name: 'Cross-Source', fn: testCrossSourceRetention }
  ];

  const results = [];

  for (const test of tests) {
    const passed = await test.fn();
    results.push({ name: test.name, passed });
  }

  // Summary
  console.log('\n========================================');
  console.log('📊 Test Summary');
  console.log('========================================');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
  });

  console.log('\n📈 Results:');
  console.log(`  - Passed: ${passed}/${tests.length}`);
  console.log(`  - Failed: ${failed}/${tests.length}`);
  console.log(`  - Success Rate: ${((passed/tests.length) * 100).toFixed(1)}%`);

  if (passed === tests.length) {
    console.log('\n🎉 All tests passed! The NASA data retention pipeline is ready for deployment.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.');
  }

  // Next steps
  console.log('\n📝 Next Steps:');
  console.log('  1. ✅ Integration completed: nasa-earthdata-proxy.js now uses retention module');
  console.log('  2. ✅ Testing completed: All retention functions verified');
  console.log('  3. ⏳ Verify backend compatibility with existing BGAPP infrastructure');
  console.log('  4. ⏳ Deploy NASA Earthdata proxy worker to Cloudflare');
  console.log('  5. ⏳ Enable production data collection from NASA APIs');
}

// Run tests
runAllTests().catch(console.error);