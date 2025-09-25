const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Analyzing Temperature Data Quality...\n');

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

    // Monitor console for data and visualization issues
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString()
      });

      if (text.includes('temperature') || text.includes('heat') || text.includes('data')) {
        console.log(`📊 ${msg.type().toUpperCase()}: ${text}`);
      }
    });

    console.log('📍 Navigating to BGAPP Real-Time Angola...');
    await page.goto('http://localhost:3003', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Wait for map to load
    console.log('🗺️ Waiting for map to initialize...');
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({
      path: '.playwright-mcp/temperature-analysis-initial.png',
      fullPage: true
    });

    // Check if layers panel is available
    console.log('🔍 Looking for layers panel...');

    // Try multiple selectors for the layers button
    const layersSelectors = [
      'button:has-text("Camadas")',
      'button:has-text("Layers")',
      '[aria-label="Layers"]',
      '.layers-control',
      '.leaflet-control-layers',
      'button[title*="layer"]',
      'button[title*="camada"]'
    ];

    let layersButton = null;
    for (const selector of layersSelectors) {
      try {
        layersButton = await page.locator(selector).first();
        if (await layersButton.isVisible({ timeout: 1000 })) {
          console.log(`✅ Found layers button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!layersButton || !(await layersButton.isVisible())) {
      console.log('⚠️ Layers button not found, checking for temperature layer directly...');

      // Look for temperature controls in the interface
      const tempControls = await page.locator('*').filter({ hasText: /temperatura|temperature/i }).all();
      console.log(`Found ${tempControls.length} temperature-related controls`);

      // Check if temperature layer is already active
      const canvas = await page.locator('.leaflet-container canvas').all();
      console.log(`Found ${canvas.length} canvas elements in map`);

    } else {
      // Open layers panel
      console.log('📊 Opening layers panel...');
      await layersButton.click();
      await page.waitForTimeout(1000);

      // Look for temperature checkbox
      const tempCheckbox = await page.locator('input[type="checkbox"]').filter({
        has: page.locator('~ span:has-text("Temperatura"), ~ label:has-text("Temperatura")')
      }).first();

      const isChecked = await tempCheckbox.isChecked().catch(() => false);
      console.log(`🌡️ Temperature layer is ${isChecked ? 'enabled' : 'disabled'}`);

      if (!isChecked) {
        await tempCheckbox.click();
        console.log('  ✅ Temperature layer enabled');
        await page.waitForTimeout(3000);
      }
    }

    // Analyze temperature API data
    console.log('\n🔬 Analyzing temperature data API...');

    const apiAnalysis = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/realtime/data?layer=temperature');
        const data = await response.json();

        if (!data.temperature) {
          return { error: 'No temperature data in API response', data };
        }

        const temps = data.temperature;
        const uniqueTemps = [...new Set(temps.map(t => t.temperature))];

        return {
          success: true,
          totalPoints: temps.length,
          uniqueTemperatures: uniqueTemps.length,
          temperatureRange: {
            min: Math.min(...uniqueTemps),
            max: Math.max(...uniqueTemps)
          },
          samplePoints: temps.slice(0, 5),
          uniqueTemps: uniqueTemps.sort((a, b) => a - b),
          metadata: data.metadata
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    if (apiAnalysis.success) {
      console.log('\n📊 Temperature Data Analysis:');
      console.log(`  • Total data points: ${apiAnalysis.totalPoints}`);
      console.log(`  • Unique temperature values: ${apiAnalysis.uniqueTemperatures}`);
      console.log(`  • Temperature range: ${apiAnalysis.temperatureRange.min.toFixed(2)}°C to ${apiAnalysis.temperatureRange.max.toFixed(2)}°C`);
      console.log(`  • Sample temperatures: ${apiAnalysis.uniqueTemps.slice(0, 10).map(t => t.toFixed(2)).join(', ')}°C`);

      // Check if we have good temperature variation
      if (apiAnalysis.uniqueTemperatures < 5) {
        console.log('⚠️ WARNING: Very few unique temperature values - this could cause uniform coloring!');
      }

      if (apiAnalysis.temperatureRange.max - apiAnalysis.temperatureRange.min < 2) {
        console.log('⚠️ WARNING: Very small temperature range - this could cause uniform coloring!');
      }
    } else {
      console.log('❌ Temperature API Error:', apiAnalysis.error);
    }

    // Check heat layer visualization properties
    console.log('\n🎨 Analyzing heat layer visualization...');

    const visualAnalysis = await page.evaluate(() => {
      // Look for heat layer canvas
      const heatCanvas = document.querySelector('.leaflet-heatmap-layer canvas');
      if (!heatCanvas) {
        return { error: 'No heat layer canvas found' };
      }

      const ctx = heatCanvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, heatCanvas.width, heatCanvas.height);
      const pixels = imageData.data;

      // Analyze color distribution
      const colors = new Set();
      const colorCount = {};

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a > 0) { // Only count non-transparent pixels
          const color = `rgb(${r},${g},${b})`;
          colors.add(color);
          colorCount[color] = (colorCount[color] || 0) + 1;
        }
      }

      // Get most common colors
      const sortedColors = Object.entries(colorCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

      return {
        success: true,
        canvasSize: { width: heatCanvas.width, height: heatCanvas.height },
        uniqueColors: colors.size,
        topColors: sortedColors,
        totalNonTransparentPixels: Object.values(colorCount).reduce((sum, count) => sum + count, 0)
      };
    });

    if (visualAnalysis.success) {
      console.log('\n🎨 Heat Layer Visual Analysis:');
      console.log(`  • Canvas size: ${visualAnalysis.canvasSize.width}x${visualAnalysis.canvasSize.height}`);
      console.log(`  • Unique colors rendered: ${visualAnalysis.uniqueColors}`);
      console.log(`  • Non-transparent pixels: ${visualAnalysis.totalNonTransparentPixels}`);
      console.log('  • Top colors used:');
      visualAnalysis.topColors.forEach(([color, count], i) => {
        console.log(`    ${i + 1}. ${color} (${count} pixels)`);
      });

      if (visualAnalysis.uniqueColors < 10) {
        console.log('⚠️ WARNING: Very few colors in visualization - confirms uniform coloring issue!');
      }
    } else {
      console.log('❌ Visual Analysis Error:', visualAnalysis.error);
    }

    // Take detailed screenshots
    console.log('\n📸 Taking analysis screenshots...');

    await page.screenshot({
      path: '.playwright-mcp/temperature-analysis-current.png',
      fullPage: true
    });

    // Zoom in to see detail
    await page.keyboard.press('+');
    await page.waitForTimeout(500);
    await page.keyboard.press('+');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '.playwright-mcp/temperature-analysis-zoomed.png',
      fullPage: true
    });

    // Check normalization function behavior
    console.log('\n🧮 Testing temperature normalization...');

    const normalizationTest = await page.evaluate(() => {
      // Test the normalization function with sample temperatures
      function normalizeTemperature(temp) {
        const minTemp = 18; // Minimum expected temperature in Angola waters
        const maxTemp = 30; // Maximum expected temperature in Angola waters
        return Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));
      }

      const testTemps = [18, 20, 22, 24, 26, 28, 30];
      const normalized = testTemps.map(temp => ({
        original: temp,
        normalized: normalizeTemperature(temp)
      }));

      return { testResults: normalized };
    });

    console.log('🧮 Normalization Test Results:');
    normalizationTest.testResults.forEach(result => {
      console.log(`  ${result.original}°C → ${result.normalized.toFixed(3)} (${(result.normalized * 100).toFixed(1)}%)`);
    });

    // Final diagnosis
    console.log('\n🩺 DIAGNOSIS:');

    if (apiAnalysis.success && visualAnalysis.success) {
      if (apiAnalysis.uniqueTemperatures < 5) {
        console.log('🔴 ISSUE FOUND: Temperature data lacks variation');
        console.log('   → All temperatures are very similar, causing uniform green coloring');
        console.log('   → Need to check temperature data generation or API response');
      } else if (visualAnalysis.uniqueColors < 10) {
        console.log('🔴 ISSUE FOUND: Heat layer rendering problem');
        console.log('   → Temperature data has variation but visualization is uniform');
        console.log('   → Need to check gradient configuration or normalization');
      } else {
        console.log('✅ Data and visualization appear normal');
        console.log('   → Issue might be with gradient colors or opacity settings');
      }
    }

    // Suggest fixes
    console.log('\n💡 SUGGESTED FIXES:');
    console.log('1. Check temperature data generation in API');
    console.log('2. Verify normalization function range (18-30°C)');
    console.log('3. Review gradient color configuration');
    console.log('4. Test with wider temperature range in data');
    console.log('5. Check if all points have same normalized value');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    console.log('\n🧹 Cleaning up...');
    if (page) await page.close();
    if (browser) await browser.close();
    console.log('✅ Analysis completed');
  }
})();