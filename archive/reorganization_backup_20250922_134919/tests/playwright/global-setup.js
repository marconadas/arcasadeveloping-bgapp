/**
 * 🎭 Playwright Global Setup
 * Pre-test environment preparation and health checks
 */

import { chromium } from '@playwright/test';

async function globalSetup() {
  console.log('🎭 Starting Playwright Global Setup...');
  
  // Create a browser instance for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Health check endpoints before running tests
    const healthChecks = [
      'https://bgapp-frontend.pages.dev/realtime_angola',
      'https://bgapp-api-worker.majearcasa.workers.dev/health'
    ];
    
    console.log('🔍 Running pre-test health checks...');
    
    for (const endpoint of healthChecks) {
      try {
        const response = await page.request.get(endpoint);
        if (response.ok()) {
          console.log(`✅ ${endpoint} - OK`);
        } else {
          console.log(`⚠️  ${endpoint} - Status: ${response.status()}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.message}`);
      }
    }
    
    // Set up test environment variables
    process.env.PLAYWRIGHT_TEST_START_TIME = Date.now().toString();
    
    console.log('✅ Playwright Global Setup completed');
    
  } catch (error) {
    console.error('❌ Global Setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
