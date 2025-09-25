/**
 * 🎭 Enhanced Cloudflare Structure - Playwright Tests
 * Comprehensive browser-based testing for MCP-enhanced BGAPP infrastructure
 * Version: 1.0.0 - Production Testing Suite
 */

import { test, expect } from '@playwright/test';

// Test configuration
const CONFIG = {
  baseURL: 'https://bgapp-frontend.pages.dev',
  apiURL: 'https://bgapp-api-worker.majearcasa.workers.dev',
  enhancedApiURL: 'https://bgapp-enhanced-api-worker.majearcasa.workers.dev',
  monitoringURL: 'https://bgapp-mcp-monitoring.majearcasa.workers.dev',
  timeout: 30000,
  retries: 3
};

// Test data
const TEST_DATA = {
  angola: {
    center: { lat: -12.5, lng: 13.5 },
    bounds: {
      north: -4.2,
      south: -18,
      east: 17.5,
      west: -12
    }
  },
  expectedData: {
    temperature: { min: 15, max: 30 },
    chlorophyll: { min: 0, max: 50 },
    salinity: { min: 30, max: 40 },
    vessels: { min: 10, max: 100 }
  }
};

test.describe('Enhanced Cloudflare Structure Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for all tests
    test.setTimeout(CONFIG.timeout);
    
    // Add console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser Error: ${msg.text()}`);
      }
    });
    
    // Handle network errors gracefully
    page.on('requestfailed', request => {
      console.log(`Failed request: ${request.url()}`);
    });
  });

  test.describe('Current API Worker Tests', () => {
    
    test('should have healthy API worker', async ({ page }) => {
      const response = await page.request.get(`${CONFIG.apiURL}/health`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.version).toBeDefined();
      expect(data.environment).toBe('cloudflare-worker');
    });

    test('should return real-time oceanographic data', async ({ page }) => {
      const response = await page.request.get(`${CONFIG.apiURL}/api/realtime/data`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.temperature).toBeDefined();
      expect(data.chlorophyll).toBeDefined();
      expect(data.salinity).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(data.source).toBe('copernicus_authenticated_angola.json');
      
      // Validate data ranges
      if (data.temperature !== null) {
        expect(data.temperature).toBeGreaterThan(TEST_DATA.expectedData.temperature.min);
        expect(data.temperature).toBeLessThan(TEST_DATA.expectedData.temperature.max);
      }
    });

    test('should return GFW vessel presence data', async ({ page }) => {
      const response = await page.request.get(`${CONFIG.apiURL}/api/gfw/vessel-presence`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.vessel_count).toBeDefined();
      expect(data.total_hours).toBeDefined();
      expect(data.window_hours).toBe(24);
      expect(data.data_source).toBeDefined();
      expect(data.updated_at).toBeDefined();
      
      // Validate vessel count is reasonable
      expect(data.vessel_count).toBeGreaterThanOrEqual(TEST_DATA.expectedData.vessels.min);
      expect(data.vessel_count).toBeLessThanOrEqual(TEST_DATA.expectedData.vessels.max);
    });

    test('should return services status', async ({ page }) => {
      const response = await page.request.get(`${CONFIG.apiURL}/services`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.summary).toBeDefined();
      expect(data.services).toBeDefined();
      expect(Array.isArray(data.services)).toBeTruthy();
      expect(data.services.length).toBeGreaterThan(0);
      
      // Check service structure
      data.services.forEach(service => {
        expect(service.name).toBeDefined();
        expect(service.status).toBeDefined();
        expect(['online', 'offline', 'warning']).toContain(service.status);
      });
    });

    test('should return system metrics', async ({ page }) => {
      const response = await page.request.get(`${CONFIG.apiURL}/metrics`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.requests_per_minute).toBeDefined();
      expect(data.active_users).toBeDefined();
      expect(data.cache_hit_rate).toBeDefined();
      expect(data.avg_response_time).toBeDefined();
      expect(data.uptime_percentage).toBeDefined();
      
      // Validate metric ranges
      expect(data.cache_hit_rate).toBeGreaterThanOrEqual(0);
      expect(data.cache_hit_rate).toBeLessThanOrEqual(100);
      expect(data.uptime_percentage).toBeGreaterThan(95);
    });
  });

  test.describe('Frontend Integration Tests', () => {
    
    test('should load BGAPP Real-Time Angola page successfully', async ({ page }) => {
      await page.goto(`${CONFIG.baseURL}/realtime_angola`);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check page title
      await expect(page).toHaveTitle(/BGAPP Real-Time.*Angola/);
      
      // Check main elements are present
      await expect(page.locator('#mainPanel')).toBeVisible();
      await expect(page.locator('#map')).toBeVisible();
      
      // Check status indicators
      await expect(page.locator('#copernicusStatus')).toBeVisible();
      await expect(page.locator('#apiStatus')).toBeVisible();
      await expect(page.locator('#dataStatus')).toBeVisible();
    });

    test('should display real-time data in KPI cards', async ({ page }) => {
      await page.goto(`${CONFIG.baseURL}/realtime_angola`);
      await page.waitForLoadState('networkidle');
      
      // Wait for data to load
      await page.waitForTimeout(5000);
      
      // Check KPI values are populated (not showing loading states)
      const sstValue = await page.locator('#sst-value').textContent();
      const chlValue = await page.locator('#chl-value').textContent();
      const vesselsValue = await page.locator('#vessels-value').textContent();
      
      expect(sstValue).not.toBe('--°C');
      expect(sstValue).toContain('°C');
      
      expect(chlValue).not.toBe('--');
      expect(chlValue).not.toContain('Carregando');
      
      expect(vesselsValue).not.toBe('--');
      expect(vesselsValue).not.toContain('Carregando');
      
      // Check trends are updated
      const trends = await page.locator('.kpi-trend').all();
      for (const trend of trends) {
        const trendText = await trend.textContent();
        expect(trendText).not.toContain('Carregando');
      }
    });

    test('should have functional map controls', async ({ page }) => {
      await page.goto(`${CONFIG.baseURL}/realtime_angola`);
      await page.waitForLoadState('networkidle');
      
      // Wait for map to initialize
      await page.waitForTimeout(3000);
      
      // Check layer control buttons
      const layerButtons = await page.locator('.controls .btn').all();
      expect(layerButtons.length).toBeGreaterThan(0);
      
      // Test SST button toggle
      const sstButton = page.locator('button:has-text("SST")');
      await expect(sstButton).toBeVisible();
      
      // Click and verify state change
      const initialClass = await sstButton.getAttribute('class');
      await sstButton.click();
      await page.waitForTimeout(500);
      const afterClass = await sstButton.getAttribute('class');
      
      // State should change (active/inactive toggle)
      expect(initialClass).not.toBe(afterClass);
    });

    test('should toggle panel functionality', async ({ page }) => {
      await page.goto(`${CONFIG.baseURL}/realtime_angola`);
      await page.waitForLoadState('networkidle');
      
      // Check panel is initially visible
      const panel = page.locator('#mainPanel');
      await expect(panel).toBeVisible();
      await expect(panel).not.toHaveClass(/collapsed/);
      
      // Click toggle button
      const toggleButton = page.locator('.panel-toggle');
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      // Panel should be collapsed
      await expect(panel).toHaveClass(/collapsed/);
      
      // Floating toggle should appear
      const floatingToggle = page.locator('.floating-toggle');
      await expect(floatingToggle).toHaveClass(/visible/);
      
      // Click floating toggle to expand
      await floatingToggle.click();
      await page.waitForTimeout(500);
      
      // Panel should be expanded again
      await expect(panel).not.toHaveClass(/collapsed/);
    });

    test('should handle keyboard shortcuts', async ({ page }) => {
      await page.goto(`${CONFIG.baseURL}/realtime_angola`);
      await page.waitForLoadState('networkidle');
      
      // Test ESC key for panel toggle
      const panel = page.locator('#mainPanel');
      const initialState = await panel.getAttribute('class');
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      const afterEscState = await panel.getAttribute('class');
      expect(initialState).not.toBe(afterEscState);
      
      // Test Space key for map centering (should not throw errors)
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
      
      // Test H key for help (should show help dialog)
      await page.keyboard.press('h');
      await page.waitForTimeout(500);
      
      // Help dialog should appear (or at least not cause errors)
      // This is a basic test to ensure keyboard handlers work
    });
  });

  test.describe('API Performance Tests', () => {
    
    test('should have acceptable response times', async ({ page }) => {
      const endpoints = [
        '/health',
        '/api/realtime/data',
        '/api/gfw/vessel-presence',
        '/services',
        '/metrics'
      ];
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await page.request.get(`${CONFIG.apiURL}${endpoint}`);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        expect(response.ok()).toBeTruthy();
        expect(responseTime).toBeLessThan(5000); // 5 second timeout
        
        console.log(`${endpoint}: ${responseTime}ms`);
      }
    });

    test('should handle concurrent requests', async ({ page }) => {
      const promises = [];
      const concurrentRequests = 5;
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(page.request.get(`${CONFIG.apiURL}/health`));
      }
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
    });

    test('should return proper CORS headers', async ({ page }) => {
      const response = await page.request.get(`${CONFIG.apiURL}/health`);
      const headers = response.headers();
      
      expect(headers['access-control-allow-origin']).toBe('*');
      expect(headers['access-control-allow-methods']).toBeDefined();
      expect(headers['access-control-allow-headers']).toBeDefined();
      expect(headers['content-type']).toBe('application/json');
    });
  });

  test.describe('Error Handling Tests', () => {
    
    test('should handle 404 errors gracefully', async ({ page }) => {
      const response = await page.request.get(`${CONFIG.apiURL}/nonexistent-endpoint`);
      expect(response.status()).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.available_endpoints).toBeDefined();
    });

    test('should handle network errors in frontend', async ({ page }) => {
      // Block API requests to simulate network errors
      await page.route(`${CONFIG.apiURL}/**`, route => route.abort());
      
      await page.goto(`${CONFIG.baseURL}/realtime_angola`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      // Check that fallback values are shown instead of loading states
      const sstValue = await page.locator('#sst-value').textContent();
      const vesselsValue = await page.locator('#vessels-value').textContent();
      
      // Should show fallback values, not loading states
      expect(sstValue).not.toContain('Carregando');
      expect(vesselsValue).not.toContain('Carregando');
      
      // Should show some kind of error indication or fallback data
      expect(sstValue).toBeDefined();
      expect(vesselsValue).toBeDefined();
    });
  });

  test.describe('Data Validation Tests', () => {
    
    test('should validate oceanographic data structure', async ({ page }) => {
      const response = await page.request.get(`${CONFIG.apiURL}/api/realtime/data`);
      const data = await response.json();
      
      // Required fields
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('source');
      expect(data).toHaveProperty('data_points');
      
      // Oceanographic parameters (can be null but should be defined)
      expect(data).toHaveProperty('temperature');
      expect(data).toHaveProperty('chlorophyll');
      expect(data).toHaveProperty('salinity');
      expect(data).toHaveProperty('current_speed');
      
      // Validate timestamp format
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
      
      // Validate data points is a number
      expect(typeof data.data_points).toBe('number');
      expect(data.data_points).toBeGreaterThanOrEqual(0);
    });

    test('should validate GFW data structure', async ({ page }) => {
      const response = await page.request.get(`${CONFIG.apiURL}/api/gfw/vessel-presence`);
      const data = await response.json();
      
      // Required fields
      expect(data).toHaveProperty('vessel_count');
      expect(data).toHaveProperty('total_hours');
      expect(data).toHaveProperty('window_hours');
      expect(data).toHaveProperty('updated_at');
      expect(data).toHaveProperty('data_source');
      
      // Validate types
      expect(typeof data.vessel_count).toBe('number');
      expect(typeof data.total_hours).toBe('number');
      expect(data.window_hours).toBe(24);
      
      // Validate timestamp
      expect(new Date(data.updated_at).toString()).not.toBe('Invalid Date');
      
      // Validate data source
      expect(['gfw_api', 'gfw_cache', 'simulated_realistic', 'fallback']).toContain(data.data_source);
    });

    test('should validate services status structure', async ({ page }) => {
      const response = await page.request.get(`${CONFIG.apiURL}/services`);
      const data = await response.json();
      
      // Check summary structure
      expect(data.summary).toHaveProperty('total');
      expect(data.summary).toHaveProperty('online');
      expect(data.summary).toHaveProperty('offline');
      expect(data.summary).toHaveProperty('health_percentage');
      expect(data.summary).toHaveProperty('last_updated');
      
      // Check services array
      expect(Array.isArray(data.services)).toBeTruthy();
      
      data.services.forEach(service => {
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('response_time');
        expect(service).toHaveProperty('uptime');
        expect(service).toHaveProperty('url');
        
        expect(['online', 'offline', 'warning']).toContain(service.status);
        expect(typeof service.response_time).toBe('number');
        expect(typeof service.uptime).toBe('number');
      });
    });
  });

  test.describe('Integration Tests', () => {
    
    test('should integrate frontend with API data flow', async ({ page }) => {
      // Navigate to page
      await page.goto(`${CONFIG.baseURL}/realtime_angola`);
      await page.waitForLoadState('networkidle');
      
      // Wait for initial data load
      await page.waitForTimeout(5000);
      
      // Check that API data is reflected in UI
      const sstValue = await page.locator('#sst-value').textContent();
      const chlValue = await page.locator('#chl-value').textContent();
      const vesselsValue = await page.locator('#vessels-value').textContent();
      
      // Get actual API data
      const realtimeResponse = await page.request.get(`${CONFIG.apiURL}/api/realtime/data`);
      const realtimeData = await realtimeResponse.json();
      
      const gfwResponse = await page.request.get(`${CONFIG.apiURL}/api/gfw/vessel-presence`);
      const gfwData = await gfwResponse.json();
      
      // Validate UI reflects API data (within reasonable tolerance)
      if (realtimeData.temperature !== null) {
        const uiTemp = parseFloat(sstValue.replace('°C', ''));
        expect(Math.abs(uiTemp - realtimeData.temperature)).toBeLessThan(1);
      }
      
      if (realtimeData.chlorophyll !== null) {
        const uiChl = parseFloat(chlValue);
        expect(Math.abs(uiChl - realtimeData.chlorophyll)).toBeLessThan(1);
      }
      
      const uiVessels = parseInt(vesselsValue);
      expect(uiVessels).toBe(gfwData.vessel_count);
    });

    test('should handle real-time updates', async ({ page }) => {
      await page.goto(`${CONFIG.baseURL}/realtime_angola`);
      await page.waitForLoadState('networkidle');
      
      // Get initial timestamp
      const initialTime = await page.locator('#currentTime').textContent();
      
      // Wait for clock update
      await page.waitForTimeout(2000);
      
      // Check that time has updated
      const updatedTime = await page.locator('#currentTime').textContent();
      expect(updatedTime).not.toBe(initialTime);
      expect(updatedTime).not.toBe('--:--');
    });
  });

  test.describe('Enhanced Worker Tests (if deployed)', () => {
    
    test('should check if enhanced worker is available', async ({ page }) => {
      try {
        const response = await page.request.get(`${CONFIG.enhancedApiURL}/health`);
        
        if (response.ok()) {
          const data = await response.json();
          
          // If enhanced worker is deployed, it should have MCP status
          if (data.mcp_services) {
            expect(data.version).toContain('mcp-enhanced');
            expect(data.mcp_services).toHaveProperty('enabled');
            expect(data.mcp_services).toHaveProperty('online');
            
            console.log('✅ Enhanced worker detected and tested');
          } else {
            console.log('ℹ️  Enhanced worker not yet deployed');
          }
        } else {
          console.log('ℹ️  Enhanced worker not available');
        }
      } catch (error) {
        console.log('ℹ️  Enhanced worker not accessible');
      }
    });

    test('should test MCP status endpoint if available', async ({ page }) => {
      try {
        const response = await page.request.get(`${CONFIG.enhancedApiURL}/api/mcp/status`);
        
        if (response.ok()) {
          const data = await response.json();
          
          expect(data).toHaveProperty('services');
          expect(data).toHaveProperty('capabilities');
          expect(data).toHaveProperty('config');
          
          console.log('✅ MCP status endpoint working');
        }
      } catch (error) {
        console.log('ℹ️  MCP status endpoint not available');
      }
    });
  });
});

// Custom test for monitoring if deployed
test.describe('Monitoring Worker Tests (if deployed)', () => {
  
  test('should check monitoring worker availability', async ({ page }) => {
    try {
      const response = await page.request.get(`${CONFIG.monitoringURL}/health`);
      
      if (response.ok()) {
        const data = await response.json();
        
        expect(data.status).toBe('healthy');
        expect(data.monitoring_system).toBe('mcp-enhanced');
        expect(data).toHaveProperty('services_monitored');
        
        console.log('✅ Monitoring worker detected and tested');
      } else {
        console.log('ℹ️  Monitoring worker not yet deployed');
      }
    } catch (error) {
      console.log('ℹ️  Monitoring worker not accessible');
    }
  });
});

// Performance benchmark test
test.describe('Performance Benchmarks', () => {
  
  test('should meet performance benchmarks', async ({ page }) => {
    const benchmarks = {
      pageLoad: 5000,      // 5 seconds
      apiResponse: 2000,   // 2 seconds
      dataUpdate: 3000     // 3 seconds for data to appear
    };
    
    // Test page load time
    const pageLoadStart = Date.now();
    await page.goto(`${CONFIG.baseURL}/realtime_angola`);
    await page.waitForLoadState('networkidle');
    const pageLoadTime = Date.now() - pageLoadStart;
    
    expect(pageLoadTime).toBeLessThan(benchmarks.pageLoad);
    console.log(`Page load time: ${pageLoadTime}ms`);
    
    // Test API response time
    const apiStart = Date.now();
    const response = await page.request.get(`${CONFIG.apiURL}/health`);
    const apiTime = Date.now() - apiStart;
    
    expect(response.ok()).toBeTruthy();
    expect(apiTime).toBeLessThan(benchmarks.apiResponse);
    console.log(`API response time: ${apiTime}ms`);
    
    // Test data update time
    const dataStart = Date.now();
    await page.waitForTimeout(3000);
    
    const sstValue = await page.locator('#sst-value').textContent();
    const dataTime = Date.now() - dataStart;
    
    expect(sstValue).not.toContain('Carregando');
    expect(dataTime).toBeLessThan(benchmarks.dataUpdate);
    console.log(`Data update time: ${dataTime}ms`);
  });
});
