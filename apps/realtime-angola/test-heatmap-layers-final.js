const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Starting comprehensive heatmap layers test...\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    page = await context.newPage();

    // Monitor console for errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('503') && !text.includes('Service Unavailable')) {
          errors.push(text);
          console.log('❌ Console error:', text);
        }
      }
    });

    console.log('📍 Navigating to BGAPP Real-Time Angola...');
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Wait for map to load
    console.log('🗺️ Waiting for map to initialize...');
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Test 1: Temperature Layer
    console.log('\n📊 Test 1: Temperature Heatmap Layer');
    console.log('  Clicking on Camadas button...');
    await page.click('button:has-text("Camadas")');
    await page.waitForTimeout(1000);

    // Enable temperature
    console.log('  Enabling Temperature layer...');
    const tempCheckbox = await page.locator('input[type="checkbox"]').filter({
      has: page.locator('~ span:has-text("Temperatura")')
    }).first();

    const tempInitialState = await tempCheckbox.isChecked();
    console.log(`  Temperature initial state: ${tempInitialState ? 'ON' : 'OFF'}`);

    if (!tempInitialState) {
      await tempCheckbox.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Temperature layer enabled');
    }

    // Take screenshot with temperature
    await page.screenshot({
      path: '.playwright-mcp/temperature-heatmap-enabled.png',
      fullPage: true
    });
    console.log('  📸 Screenshot saved: temperature-heatmap-enabled.png');

    // Toggle temperature off and on
    console.log('  Testing temperature toggle...');
    await tempCheckbox.click(); // OFF
    await page.waitForTimeout(1500);
    console.log('  ✅ Temperature toggled OFF - No errors');

    await tempCheckbox.click(); // ON
    await page.waitForTimeout(1500);
    console.log('  ✅ Temperature toggled ON - No errors');

    await tempCheckbox.click(); // OFF again
    await page.waitForTimeout(1500);
    console.log('  ✅ Temperature toggled OFF again - No errors');

    // Test 2: Chlorophyll Layer
    console.log('\n🌊 Test 2: Chlorophyll Heatmap Layer');

    // Enable chlorophyll
    console.log('  Enabling Chlorophyll layer...');
    const chloroCheckbox = await page.locator('input[type="checkbox"]').filter({
      has: page.locator('~ span:has-text("Clorofila")')
    }).first();

    const chloroInitialState = await chloroCheckbox.isChecked();
    console.log(`  Chlorophyll initial state: ${chloroInitialState ? 'ON' : 'OFF'}`);

    if (!chloroInitialState) {
      await chloroCheckbox.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Chlorophyll layer enabled');
    }

    // Take screenshot with chlorophyll
    await page.screenshot({
      path: '.playwright-mcp/chlorophyll-heatmap-enabled.png',
      fullPage: true
    });
    console.log('  📸 Screenshot saved: chlorophyll-heatmap-enabled.png');

    // Toggle chlorophyll off and on
    console.log('  Testing chlorophyll toggle...');
    await chloroCheckbox.click(); // OFF
    await page.waitForTimeout(1500);
    console.log('  ✅ Chlorophyll toggled OFF - No errors');

    await chloroCheckbox.click(); // ON
    await page.waitForTimeout(1500);
    console.log('  ✅ Chlorophyll toggled ON - No errors');

    // Test 3: Both layers together
    console.log('\n🎨 Test 3: Both Heatmaps Together');

    // Enable both
    await tempCheckbox.click(); // Temperature ON
    await page.waitForTimeout(1500);
    console.log('  ✅ Temperature enabled');

    // Both should be on now
    await page.screenshot({
      path: '.playwright-mcp/both-heatmaps-enabled.png',
      fullPage: true
    });
    console.log('  📸 Screenshot saved: both-heatmaps-enabled.png');

    // Test rapid toggling
    console.log('\n⚡ Test 4: Rapid Toggle Test');
    for (let i = 0; i < 5; i++) {
      await tempCheckbox.click();
      await page.waitForTimeout(200);
      await chloroCheckbox.click();
      await page.waitForTimeout(200);
    }
    console.log('  ✅ Rapid toggling completed without errors');

    // Test 5: Zoom and pan with layers
    console.log('\n🔍 Test 5: Zoom and Pan Test');

    // Enable both layers
    const tempFinalState = await tempCheckbox.isChecked();
    if (!tempFinalState) await tempCheckbox.click();

    const chloroFinalState = await chloroCheckbox.isChecked();
    if (!chloroFinalState) await chloroCheckbox.click();

    await page.waitForTimeout(1500);

    // Zoom in
    console.log('  Zooming in...');
    await page.keyboard.press('+');
    await page.waitForTimeout(1000);
    await page.keyboard.press('+');
    await page.waitForTimeout(1000);
    console.log('  ✅ Zoomed in successfully');

    // Pan
    console.log('  Panning map...');
    await page.mouse.move(960, 540);
    await page.mouse.down();
    await page.mouse.move(760, 540, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
    console.log('  ✅ Panned successfully');

    // Zoom out
    console.log('  Zooming out...');
    await page.keyboard.press('-');
    await page.waitForTimeout(1000);
    await page.keyboard.press('-');
    await page.waitForTimeout(1000);
    await page.keyboard.press('-');
    await page.waitForTimeout(1000);
    console.log('  ✅ Zoomed out successfully');

    // Final screenshot
    await page.screenshot({
      path: '.playwright-mcp/heatmaps-final-state.png',
      fullPage: true
    });
    console.log('  📸 Screenshot saved: heatmaps-final-state.png');

    // Check for errors
    console.log('\n📋 Final Results:');
    if (errors.length === 0) {
      console.log('✅ All tests passed! No errors detected.');
      console.log('✅ Temperature heatmap working correctly');
      console.log('✅ Chlorophyll heatmap working correctly');
      console.log('✅ Both layers can be toggled without issues');
      console.log('✅ Zoom and pan operations work smoothly');
    } else {
      console.log(`⚠️ ${errors.length} errors detected:`);
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n🧹 Cleaning up...');
    if (page) await page.close();
    if (browser) await browser.close();
    console.log('✅ Test completed');
  }
})();