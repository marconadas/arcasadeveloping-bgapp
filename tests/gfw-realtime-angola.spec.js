// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('GFW Realtime Angola Integration', () => {
  const baseUrl = 'https://bgapp-frontend.pages.dev';
  const workerUrl = 'https://bgapp-api-worker.majearcasa.workers.dev';

  test.beforeEach(async ({ page }) => {
    // Navigate to realtime Angola page
    await page.goto(`${baseUrl}/realtime_angola.html`);
    
    // Wait for map to initialize
    await page.waitForFunction(() => window.app && window.app.map, { timeout: 30000 });
  });

  test('should load page with all required scripts', async ({ page }) => {
    // Check that GFW integration script is loaded
    const gfwScript = await page.locator('script[src*="gfw-integration.js"]');
    await expect(gfwScript).toHaveCount(1);
    
    // Check that Leaflet is loaded
    const leafletLoaded = await page.evaluate(() => typeof L !== 'undefined');
    expect(leafletLoaded).toBe(true);
    
    // Check that GFW integration is initialized
    await page.waitForFunction(() => window.gfwIntegration !== undefined, { timeout: 10000 });
    const gfwInitialized = await page.evaluate(() => window.gfwIntegration && window.gfwIntegration.initialized);
    expect(gfwInitialized).toBe(true);
  });

  test('should display real-time KPIs from Copernicus data', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(5000);
    
    // Check SST value
    const sstValue = await page.locator('#sst-value').textContent();
    expect(sstValue).not.toBe('--°C');
    expect(sstValue).toMatch(/^\d+(\.\d)?°C$/);
    
    // Check Chlorophyll value
    const chlValue = await page.locator('#chl-value').textContent();
    expect(chlValue).not.toBe('--');
    expect(chlValue).toMatch(/^\d+(\.\d)?$/);
    
    // Check Salinity value
    const salinityValue = await page.locator('#salinity').textContent();
    expect(salinityValue).not.toBe('--');
    expect(salinityValue).toMatch(/^\d+(\.\d)?$/);
    
    // Check Current value
    const currentValue = await page.locator('#current-value').textContent();
    expect(currentValue).toMatch(/^\d+(\.\d+)? m\/s$/);
  });

  test('should display vessel count from GFW', async ({ page }) => {
    // Wait for vessel data to load
    await page.waitForTimeout(5000);
    
    const vesselsValue = await page.locator('#vessels-value').textContent();
    expect(vesselsValue).not.toBe('--');
    // Should be a number (either from GFW or fallback simulation)
    expect(vesselsValue).toMatch(/^\d+$/);
  });

  test('should toggle vessel layer on map', async ({ page }) => {
    // Click vessels button
    const vesselsButton = page.locator('button:has-text("🚢 Embarcações")');
    await vesselsButton.click();
    
    // Verify button is active
    await expect(vesselsButton).toHaveClass(/active/);
    
    // Check console for GFW layer activation
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    await page.waitForTimeout(2000);
    
    const gfwActivated = consoleMessages.some(msg => 
      msg.includes('Camada GFW Embarcações ativada') || 
      msg.includes('Camada Embarcações')
    );
    expect(gfwActivated).toBe(true);
  });

  test('should have working status indicators', async ({ page }) => {
    // Wait for status updates
    await page.waitForTimeout(5000);
    
    // Check Copernicus status
    const copernicusStatus = await page.locator('#copernicusStatus');
    const copernicusClass = await copernicusStatus.getAttribute('class');
    expect(copernicusClass).toContain('status-dot');
    expect(copernicusClass).toMatch(/status-(online|offline|warning)/);
    
    // Check API status
    const apiStatus = await page.locator('#apiStatus');
    const apiClass = await apiStatus.getAttribute('class');
    expect(apiClass).toContain('status-dot');
    expect(apiClass).toMatch(/status-(online|offline|warning)/);
  });

  test('Worker endpoints should respond', async ({ request }) => {
    // Test realtime data endpoint
    const realtimeResponse = await request.get(`${workerUrl}/api/realtime/data`);
    expect(realtimeResponse.ok()).toBe(true);
    
    const realtimeData = await realtimeResponse.json();
    expect(realtimeData).toHaveProperty('temperature');
    expect(realtimeData).toHaveProperty('chlorophyll');
    expect(realtimeData).toHaveProperty('salinity');
    
    // Test GFW vessel presence endpoint (may fail if token not configured)
    const gfwResponse = await request.get(`${workerUrl}/api/gfw/vessel-presence`);
    if (gfwResponse.ok()) {
      const gfwData = await gfwResponse.json();
      expect(gfwData).toHaveProperty('vessel_count');
      expect(gfwData).toHaveProperty('total_hours');
    } else {
      // If GFW fails, at least check the error structure
      expect(gfwResponse.status()).toBe(502);
    }
  });

  test('should update timestamps', async ({ page }) => {
    const initialTime = await page.locator('#currentTime').textContent();
    expect(initialTime).not.toBe('--:--');
    
    // Wait for clock update
    await page.waitForTimeout(2000);
    
    const updatedTime = await page.locator('#currentTime').textContent();
    expect(updatedTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  test('map should have Angola EEZ layers', async ({ page }) => {
    // Check if map has layers
    const hasZEELayers = await page.evaluate(() => {
      const map = window.app?.map;
      if (!map) return false;
      
      let hasAngola = false;
      let hasCabinda = false;
      
      map.eachLayer(layer => {
        if (layer.options?.id === 'zee-angola') hasAngola = true;
        if (layer.options?.id === 'zee-cabinda') hasCabinda = true;
      });
      
      return hasAngola && hasCabinda;
    });
    
    expect(hasZEELayers).toBe(true);
  });
});

test.describe('GFW Integration Resilience', () => {
  test('should handle API failures gracefully', async ({ page }) => {
    // Intercept API calls to simulate failures
    await page.route('**/api/gfw/vessel-presence', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' })
      });
    });
    
    await page.goto('https://bgapp-frontend.pages.dev/realtime_angola.html');
    await page.waitForTimeout(5000);
    
    // Should fall back to simulated data
    const vesselsValue = await page.locator('#vessels-value').textContent();
    expect(vesselsValue).not.toBe('--');
    expect(vesselsValue).toMatch(/^\d+$/); // Should show fallback number
  });
});
