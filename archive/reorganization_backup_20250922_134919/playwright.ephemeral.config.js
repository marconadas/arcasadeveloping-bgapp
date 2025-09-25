// Minimal Playwright config without importing '@playwright/test'
module.exports = {
  testDir: './tests/playwright',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'https://bgapp-frontend.pages.dev',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: { 'User-Agent': 'BGAPP-Playwright-Tests/ephemeral' }
  },
  timeout: 60000,
  expect: { timeout: 10000 },
  outputDir: 'test-results/',
  testMatch: [ '**/*.spec.js', '**/*.test.js', '**/*.e2e.js' ],
};


