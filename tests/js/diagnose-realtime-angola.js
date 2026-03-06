/**
 * Playwright Diagnostic Script for Realtime Angola
 * Analyzes map layers and data loading
 */

const { chromium } = require('playwright');

async function diagnoseRealtimeAngola() {
  console.log('🔍 Starting Realtime Angola Diagnostic...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });

  // Capture network requests
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('oceanographic') || 
        request.url().includes('api/') ||
        request.url().includes('realtime')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
    }
  });

  // Capture network responses
  const networkResponses = [];
  page.on('response', async response => {
    if (response.url().includes('oceanographic') || 
        response.url().includes('api/') ||
        response.url().includes('realtime')) {
      const responseData = {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: new Date().toISOString()
      };
      
      try {
        if (response.headers()['content-type']?.includes('application/json')) {
          const body = await response.json();
          responseData.body = body;
          console.log(`[RESPONSE ${response.status()}] ${response.url()}`);
          console.log('  Data counts:', body.metadata?.counts || 'N/A');
        }
      } catch (e) {
        responseData.error = 'Failed to parse JSON';
      }
      
      networkResponses.push(responseData);
    }
  });

  // Capture errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  try {
    console.log('\n📍 Step 1: Loading page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('✅ Page loaded\n');

    // Wait for map to initialize
    await page.waitForTimeout(3000);

    // Take initial screenshot
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'realtime-angola-initial.png', fullPage: true });
    console.log('✅ Screenshot saved: realtime-angola-initial.png\n');

    // Check if map is visible
    console.log('📍 Step 2: Checking map element...');
    const mapExists = await page.locator('.leaflet-container, #map, [class*="map"]').count();
    console.log(`Map containers found: ${mapExists}`);

    // Check for layer controls
    console.log('\n📍 Step 3: Checking layer controls...');
    const layerControls = await page.locator('button, [role="button"], [class*="layer"], [class*="control"]').count();
    console.log(`Interactive elements found: ${layerControls}`);

    // Try to find and list visible text
    console.log('\n📍 Step 4: Checking visible text...');
    const visibleText = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, [role="button"], h1, h2, h3, label'));
      return elements
        .filter(el => el.offsetParent !== null) // Only visible elements
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          classes: el.className
        }))
        .slice(0, 30);
    });
    console.log('Visible UI elements:', JSON.stringify(visibleText, null, 2));

    // Check for data loading indicators
    console.log('\n📍 Step 5: Checking for loading states...');
    const loadingElements = await page.locator('[class*="loading"], [class*="spinner"], [aria-busy="true"]').count();
    console.log(`Loading indicators: ${loadingElements}`);

    // Check React state (if accessible)
    console.log('\n📍 Step 6: Checking React state...');
    const reactState = await page.evaluate(() => {
      try {
        // Try to access Next.js data
        return {
          hasNextData: typeof window.__NEXT_DATA__ !== 'undefined',
          pathname: window.location.pathname,
          search: window.location.search
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('React/Next state:', reactState);

    // Wait for any API calls to complete
    await page.waitForTimeout(5000);

    // Take final screenshot
    console.log('\n📸 Taking final screenshot...');
    await page.screenshot({ path: 'realtime-angola-loaded.png', fullPage: true });
    console.log('✅ Screenshot saved: realtime-angola-loaded.png\n');

    // Summary Report
    console.log('\n' + '='.repeat(70));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(70));
    console.log(`\n🌐 Network Requests: ${networkRequests.length}`);
    networkRequests.forEach(req => {
      console.log(`  - ${req.method} ${req.url}`);
    });
    
    console.log(`\n📡 Network Responses: ${networkResponses.length}`);
    networkResponses.forEach(res => {
      console.log(`  - ${res.status} ${res.url}`);
      if (res.body?.metadata?.counts) {
        console.log(`    → Counts:`, res.body.metadata.counts);
      }
    });

    console.log(`\n❌ JavaScript Errors: ${errors.length}`);
    errors.forEach(err => {
      console.log(`  - ${err.message}`);
    });

    console.log(`\n📝 Console Logs: ${consoleLogs.length} messages`);
    const errorLogs = consoleLogs.filter(log => log.type === 'error');
    const warningLogs = consoleLogs.filter(log => log.type === 'warning');
    console.log(`  - Errors: ${errorLogs.length}`);
    console.log(`  - Warnings: ${warningLogs.length}`);
    
    if (errorLogs.length > 0) {
      console.log('\n🔴 Console Errors:');
      errorLogs.forEach(log => {
        console.log(`  - ${log.text}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 DIAGNOSIS COMPLETE');
    console.log('='.repeat(70));

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:3000',
      network: {
        requests: networkRequests,
        responses: networkResponses
      },
      errors: errors,
      console: {
        all: consoleLogs,
        errors: errorLogs,
        warnings: warningLogs
      },
      ui: {
        mapContainers: mapExists,
        layerControls: layerControls,
        loadingIndicators: loadingElements,
        visibleElements: visibleText
      }
    };

    const fs = require('fs');
    fs.writeFileSync('realtime-angola-diagnostic-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ Detailed report saved: realtime-angola-diagnostic-report.json');
    console.log('✅ Screenshots saved: realtime-angola-initial.png, realtime-angola-loaded.png');

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

// Run diagnostic
diagnoseRealtimeAngola().catch(console.error);

