/**
 * Playwright Test: Diagnose Realtime Angola Map Layers
 */

const { test, expect } = require('@playwright/test');

test.describe('Realtime Angola Map Layers Diagnostic', () => {
  
  test('should load page and analyze map layers', async ({ page }) => {
    console.log('\n🔍 Starting diagnostic...\n');

    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push({ type: msg.type(), text });
      console.log(`[${msg.type().toUpperCase()}] ${text}`);
    });

    // Capture network requests
    const apiCalls = [];
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('oceanographic')) {
        console.log(`\n📡 API Call: ${url}`);
        console.log(`   Status: ${response.status()}`);
        
        try {
          const data = await response.json();
          apiCalls.push({ url, status: response.status(), data });
          
          if (data.metadata?.counts) {
            console.log(`   Counts:`, data.metadata.counts);
          }
          if (data.ocean_color?.length) {
            console.log(`   Ocean Color points: ${data.ocean_color.length}`);
          }
        } catch (e) {
          console.log(`   (Not JSON or failed to parse)`);
        }
      }
    });

    // Load page
    console.log('📍 Loading http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('✅ Page loaded\n');

    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/initial-load.png', fullPage: true });
    console.log('📸 Screenshot: screenshots/initial-load.png\n');

    // Wait for React to hydrate
    await page.waitForTimeout(3000);

    // Check for map container
    console.log('📍 Checking for map container...');
    const mapContainer = page.locator('.leaflet-container, #map, [id*="map"], [class*="Map"]').first();
    const mapExists = await mapContainer.count();
    console.log(`   Map containers found: ${mapExists}\n`);

    if (mapExists > 0) {
      const mapSize = await mapContainer.boundingBox();
      console.log(`   Map size: ${mapSize?.width}x${mapSize?.height}\n`);
    }

    // Check for layer controls
    console.log('📍 Checking for layer controls...');
    const allButtons = await page.locator('button').all();
    console.log(`   Total buttons found: ${allButtons.length}`);
    
    for (const button of allButtons.slice(0, 10)) {
      const text = await button.textContent();
      if (text && text.trim()) {
        console.log(`   - Button: "${text.trim().substring(0, 50)}"`);
      }
    }
    console.log('');

    // Look for layer-related elements
    console.log('📍 Looking for layer-related elements...');
    const layerTexts = await page.evaluate(() => {
      const keywords = ['temperatura', 'clorofila', 'salinidade', 'layer', 'camada', 'ocean', 'sst'];
      const allText = document.body.textContent?.toLowerCase() || '';
      const found = [];
      
      keywords.forEach(keyword => {
        if (allText.includes(keyword)) {
          found.push(keyword);
        }
      });
      
      return found;
    });
    console.log(`   Keywords found: ${layerTexts.join(', ')}\n`);

    // Check RealtimeProvider state
    console.log('📍 Checking React/Provider state...');
    const providerState = await page.evaluate(() => {
      try {
        // Try to access window data
        return {
          pathname: window.location.pathname,
          hasReactRoot: !!document.getElementById('__next'),
          bodyClasses: document.body.className,
          dataAttributes: Array.from(document.body.attributes)
            .filter(attr => attr.name.startsWith('data-'))
            .map(attr => attr.name)
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('   Provider state:', JSON.stringify(providerState, null, 2), '\n');

    // Wait for any async operations
    await page.waitForTimeout(5000);

    // Take final screenshot
    await page.screenshot({ path: 'screenshots/after-wait.png', fullPage: true });
    console.log('📸 Screenshot: screenshots/after-wait.png\n');

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(70));
    
    console.log(`\n🌐 API Calls Made: ${apiCalls.length}`);
    apiCalls.forEach(call => {
      console.log(`   ${call.status} - ${call.url}`);
      if (call.data?.metadata?.counts) {
        console.log(`   → Total points: ${call.data.metadata.counts.total}`);
      }
    });

    console.log(`\n📝 Console Messages: ${consoleLogs.length}`);
    const errors = consoleLogs.filter(l => l.type === 'error');
    const warnings = consoleLogs.filter(l => l.type === 'warning');
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n🔴 Console Errors:');
      errors.forEach(err => {
        console.log(`   - ${err.text}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Console Warnings:');
      warnings.forEach(warn => {
        console.log(`   - ${warn.text}`);
      });
    }

    console.log('\n' + '='.repeat(70));

    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser kept open for manual inspection');
    console.log('   Close browser to continue...\n');
    await page.pause();
  });

});

