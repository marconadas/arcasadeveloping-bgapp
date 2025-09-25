#!/usr/bin/env node

/**
 * Test script to verify admin dashboard fixes using Playwright
 * Checks if client-side errors are resolved
 */

const { chromium } = require('playwright-core');
const fs = require('fs').promises;
const path = require('path');

const ADMIN_DASHBOARD_URL = 'https://bgapp-admin.pages.dev';
const SCREENSHOT_DIR = '.playwright-mcp';

async function ensureScreenshotDir() {
  try {
    await fs.access(SCREENSHOT_DIR);
  } catch {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  }
}

async function testAdminDashboard() {
  console.log('🧪 Testing Admin Dashboard at:', ADMIN_DASHBOARD_URL);
  console.log('='.repeat(60));

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });

  const page = await context.newPage();

  try {
    console.log('\n1️⃣ Navigating to admin dashboard...');

    // Navigate to the dashboard with timeout
    await page.goto(ADMIN_DASHBOARD_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for initial load
    await page.waitForTimeout(3000);

    console.log('✅ Page loaded successfully');

    // Check for the error message
    console.log('\n2️⃣ Checking for client-side errors...');

    const errorElement = await page.locator('text=Erro de Aplicação Detectado').first();
    const hasError = await errorElement.isVisible().catch(() => false);

    if (hasError) {
      console.log('❌ "Erro de Aplicação Detectado" is still showing');

      // Get error details
      const errorText = await page.locator('.error-container, .error-message, [class*="error"]').allTextContents().catch(() => []);
      if (errorText.length > 0) {
        console.log('Error details:', errorText.join(' | '));
      }
    } else {
      console.log('✅ No "Erro de Aplicação Detectado" error found');
    }

    // Check page title and main content
    console.log('\n3️⃣ Checking page content...');

    const title = await page.title();
    console.log('Page title:', title);

    // Look for main navigation or dashboard elements
    const mainContent = await page.locator('main, .dashboard, .content, .app').first().isVisible().catch(() => false);
    console.log(mainContent ? '✅ Main content area is visible' : '❌ Main content area not found');

    // Check for navigation elements
    const navElements = await page.locator('nav, .nav, .navigation, [role="navigation"]').count();
    console.log(`Navigation elements found: ${navElements}`);

    // Take screenshot of current state
    console.log('\n4️⃣ Taking screenshot...');
    await ensureScreenshotDir();
    const screenshotPath = path.join(SCREENSHOT_DIR, 'admin-dashboard-test-current.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('✅ Screenshot saved to:', screenshotPath);

    // Test navigation to different sections
    console.log('\n5️⃣ Testing navigation...');

    // Look for Global Fishing Watch link
    const gfwLink = await page.locator('text=Global Fishing').first();
    const hasGfwLink = await gfwLink.isVisible().catch(() => false);

    if (hasGfwLink) {
      console.log('✅ Global Fishing Watch link found');
      try {
        await gfwLink.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked Global Fishing Watch - no errors');

        // Take screenshot after navigation
        const gfwScreenshotPath = path.join(SCREENSHOT_DIR, 'admin-dashboard-gfw-section.png');
        await page.screenshot({ path: gfwScreenshotPath, fullPage: true });
        console.log('✅ GFW section screenshot saved');

        // Go back
        await page.goBack();
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log('❌ Error navigating to Global Fishing Watch:', error.message);
      }
    } else {
      console.log('ℹ️ Global Fishing Watch link not found');
    }

    // Look for ML Dashboard link
    const mlLink = await page.locator('text=ML Dashboard').first();
    const hasMlLink = await mlLink.isVisible().catch(() => false);

    if (hasMlLink) {
      console.log('✅ ML Dashboard link found');
      try {
        await mlLink.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked ML Dashboard - no errors');

        // Take screenshot after navigation
        const mlScreenshotPath = path.join(SCREENSHOT_DIR, 'admin-dashboard-ml-section.png');
        await page.screenshot({ path: mlScreenshotPath, fullPage: true });
        console.log('✅ ML section screenshot saved');
      } catch (error) {
        console.log('❌ Error navigating to ML Dashboard:', error.message);
      }
    } else {
      console.log('ℹ️ ML Dashboard link not found');
    }

    // Check for any JavaScript errors in console
    console.log('\n6️⃣ Checking for JavaScript errors...');

    let jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Reload page to capture any console errors
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    if (jsErrors.length > 0) {
      console.log('❌ JavaScript errors found:');
      jsErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No JavaScript errors detected');
    }

    // Final screenshot
    const finalScreenshotPath = path.join(SCREENSHOT_DIR, 'admin-dashboard-final-state.png');
    await page.screenshot({ path: finalScreenshotPath, fullPage: true });
    console.log('✅ Final screenshot saved to:', finalScreenshotPath);

    console.log('\n✅ Testing completed successfully!');

    return {
      hasError,
      title,
      mainContent,
      navElements,
      hasGfwLink,
      hasMlLink,
      jsErrors,
      screenshots: [screenshotPath, finalScreenshotPath]
    };

  } catch (error) {
    console.log('❌ Error during testing:', error.message);

    // Take error screenshot
    try {
      await ensureScreenshotDir();
      const errorScreenshotPath = path.join(SCREENSHOT_DIR, 'admin-dashboard-error.png');
      await page.screenshot({ path: errorScreenshotPath, fullPage: true });
      console.log('📸 Error screenshot saved to:', errorScreenshotPath);
    } catch (screenshotError) {
      console.log('❌ Could not take error screenshot:', screenshotError.message);
    }

    throw error;
  } finally {
    await browser.close();
  }
}

async function runTest() {
  try {
    const results = await testAdminDashboard();

    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(30));
    console.log(`Error Message Present: ${results.hasError ? '❌ YES' : '✅ NO'}`);
    console.log(`Page Title: ${results.title}`);
    console.log(`Main Content Visible: ${results.mainContent ? '✅ YES' : '❌ NO'}`);
    console.log(`Navigation Elements: ${results.navElements}`);
    console.log(`GFW Link Available: ${results.hasGfwLink ? '✅ YES' : 'ℹ️ NO'}`);
    console.log(`ML Link Available: ${results.hasMlLink ? '✅ YES' : 'ℹ️ NO'}`);
    console.log(`JavaScript Errors: ${results.jsErrors.length === 0 ? '✅ NONE' : `❌ ${results.jsErrors.length} FOUND`}`);
    console.log(`Screenshots: ${results.screenshots.length} saved`);

    if (!results.hasError && results.mainContent && results.jsErrors.length === 0) {
      console.log('\n🎉 ADMIN DASHBOARD APPEARS TO BE WORKING CORRECTLY!');
      console.log('✅ No "Erro de Aplicação Detectado" error');
      console.log('✅ Main content is loading');
      console.log('✅ No JavaScript errors detected');
    } else {
      console.log('\n⚠️ ADMIN DASHBOARD MAY STILL HAVE ISSUES');
      if (results.hasError) console.log('❌ Error message is still showing');
      if (!results.mainContent) console.log('❌ Main content is not visible');
      if (results.jsErrors.length > 0) console.log(`❌ ${results.jsErrors.length} JavaScript errors found`);
    }

  } catch (error) {
    console.log('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();