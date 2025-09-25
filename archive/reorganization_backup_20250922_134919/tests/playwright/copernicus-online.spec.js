import { test, expect } from '@playwright/test'

test.describe('Copernicus online status validation', () => {
  test('API should report copernicus_status online', async ({ request }) => {
    const res = await request.get('https://bgapp-api-worker.majearcasa.workers.dev/api/realtime/data')
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data.copernicus_status).toBe('online')
    expect(['copernicus_api', 'fallback', 'copernicus_processed']).toContain(data.source)
  })

  test('Admin dashboard should display Copernicus ONLINE', async ({ page }) => {
    await page.goto('https://bgapp-admin.pages.dev/', { waitUntil: 'domcontentloaded' })

    // Open Copernicus section
    await page.getByRole('button', { name: /Copernicus Integration/i }).click()

    // Wait for header and dynamic fetch to complete
    await expect(page.getByRole('heading', { name: /Copernicus Integration/i })).toBeVisible()

    // Poll until ONLINE shows up (auto-refresh also runs every 30s)
    await expect.poll(async () => {
      const content = await page.content()
      return /Status API\s*ONLINE/i.test(content)
    }, { timeout: 30000, intervals: [1000, 2000, 3000, 5000] }).toBeTruthy()
  })
})


