#!/usr/bin/env node

/**
 * Complete navigation test for admin dashboard
 * Tests all available sections and routes
 */

const { chromium } = require('playwright-core');
const fs = require('fs').promises;
const path = require('path');

const ADMIN_DASHBOARD_URL = 'https://bgapp-admin.pages.dev';
const SCREENSHOT_DIR = '.playwright-mcp';

async function testCompleteNavigation() {
  console.log('🧭 Testing Complete Navigation on Admin Dashboard');
  console.log('='.repeat(55));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  try {
    // Navigate to dashboard
    await page.goto(ADMIN_DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('✅ Dashboard loaded');

    // Test different navigation paths
    const testRoutes = [
      { name: 'ML Auto Ingestion', path: '/ml-auto-ingestion' },
      { name: 'ML Models Manager', path: '/ml-models-manager' },
      { name: 'ML Predictive Filters', path: '/ml-predictive-filters' }
    ];

    for (const route of testRoutes) {
      console.log(`\n📍 Testing ${route.name}...`);

      try {
        // Navigate to the route directly
        await page.goto(`${ADMIN_DASHBOARD_URL}${route.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        await page.waitForTimeout(2000);

        // Check if page loads without error
        const hasError = await page.locator('text=Erro de Aplicação Detectado').isVisible().catch(() => false);

        if (hasError) {
          console.log(`❌ ${route.name}: Error message detected`);
        } else {
          console.log(`✅ ${route.name}: No error message`);
        }

        // Check for main content
        const hasMainContent = await page.locator('main, .content, .dashboard, .page').first().isVisible().catch(() => false);
        console.log(`   Content visible: ${hasMainContent ? '✅' : '❌'}`);

        // Take screenshot
        const screenshotName = route.name.toLowerCase().replace(/\s+/g, '-');
        const screenshotPath = path.join(SCREENSHOT_DIR, `admin-dashboard-${screenshotName}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`   Screenshot: ${screenshotPath}`);

      } catch (error) {
        console.log(`❌ ${route.name}: Navigation error - ${error.message}`);
      }
    }

    // Test back to home
    console.log('\n🏠 Testing back to home...');
    await page.goto(ADMIN_DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const backHomeOk = await page.locator('text=Erro de Aplicação Detectado').isVisible().catch(() => false);
    console.log(`Home page: ${!backHomeOk ? '✅ OK' : '❌ Has Error'}`);

    // Final home screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'admin-dashboard-back-home.png'),
      fullPage: true
    });

    console.log('\n🎯 Navigation testing completed');

  } finally {
    await browser.close();
  }
}

testCompleteNavigation().catch(console.error);