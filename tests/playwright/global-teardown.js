/**
 * 🎭 Playwright Global Teardown
 * Post-test cleanup and reporting
 */

import fs from 'fs';
import path from 'path';

async function globalTeardown() {
  console.log('🎭 Starting Playwright Global Teardown...');
  
  try {
    // Calculate test duration
    const startTime = parseInt(process.env.PLAYWRIGHT_TEST_START_TIME || '0');
    const duration = Date.now() - startTime;
    
    console.log(`⏱️  Total test duration: ${duration}ms`);
    
    // Generate test summary
    const summaryPath = path.join('test-results', 'test-summary.json');
    const summary = {
      timestamp: new Date().toISOString(),
      duration: duration,
      environment: {
        node_version: process.version,
        platform: process.platform,
        ci: !!process.env.CI
      },
      endpoints_tested: [
        'https://bgapp-frontend.pages.dev/realtime_angola',
        'https://bgapp-api-worker.majearcasa.workers.dev'
      ]
    };
    
    // Ensure test-results directory exists
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results', { recursive: true });
    }
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📊 Test summary written to: ${summaryPath}`);
    
    // Cleanup temporary files if any
    console.log('🧹 Cleaning up temporary files...');
    
    console.log('✅ Playwright Global Teardown completed');
    
  } catch (error) {
    console.error('❌ Global Teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;
