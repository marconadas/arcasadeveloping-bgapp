import { chromium } from '@playwright/test';

async function testVesselClustering() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🚀 Testing vessel clustering functionality...');

  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Wait for map to load
  await page.waitForSelector('.leaflet-container', { timeout: 10000 });
  console.log('✅ Map loaded successfully');

  // Wait for vessel markers
  await page.waitForSelector('.vessel-marker-enhanced', { timeout: 10000 });
  const vesselMarkers = await page.locator('.vessel-marker-enhanced').count();
  console.log(`✅ Found ${vesselMarkers} vessel markers`);

  // Check for cluster markers
  const clusterMarkers = await page.locator('.marker-cluster-small, .marker-cluster-medium, .marker-cluster-large').count();
  console.log(`📊 Found ${clusterMarkers} cluster groups`);

  // Test hover functionality
  const firstVessel = page.locator('.vessel-marker-enhanced').first();
  await firstVessel.hover();
  await page.waitForTimeout(500);

  // Check for tooltip
  const tooltip = await page.locator('.vessel-tooltip-enhanced').count();
  console.log(`💡 Tooltip visible on hover: ${tooltip > 0}`);

  // Test zoom in to expand clusters
  console.log('🔍 Testing cluster expansion on zoom...');
  await page.keyboard.press('+');
  await page.waitForTimeout(500);
  await page.keyboard.press('+');
  await page.waitForTimeout(500);

  const vesselMarkersAfterZoom = await page.locator('.vessel-marker-enhanced').count();
  console.log(`📈 Vessels after zoom: ${vesselMarkersAfterZoom}`);

  // Click on a vessel to test popup
  await page.locator('.vessel-marker-enhanced').first().click();
  await page.waitForTimeout(500);

  const popup = await page.locator('.leaflet-popup').count();
  console.log(`📋 Popup visible on click: ${popup > 0}`);

  // Check legend
  const legend = await page.locator('text="Fishing"').count();
  console.log(`🎨 Legend shows vessel types: ${legend > 0}`);

  // Take screenshot
  await page.screenshot({
    path: 'vessel-clustering-test.png',
    fullPage: true
  });
  console.log('📸 Screenshot saved as vessel-clustering-test.png');

  await browser.close();
  console.log('✅ Vessel clustering test complete!');
}

testVesselClustering().catch(console.error);