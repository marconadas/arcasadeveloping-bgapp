/**
 * Testes Playwright para Integração Oficial Copernicus
 * Verifica se todas as APIs estão funcionando corretamente
 */

const { test, expect } = require('@playwright/test');

test.describe('Copernicus Official Integration', () => {
  const workerUrl = 'https://bgapp-copernicus-official.majearcasa.workers.dev';
  
  test('OpenSearch API deve retornar dados Sentinel-3 para Angola', async ({ page }) => {
    const response = await page.goto(`${workerUrl}/copernicus/opensearch?collection=Sentinel3&max_records=5`);
    
    expect(response.status()).toBe(200);
    
    const content = await page.textContent('body');
    const data = JSON.parse(content);
    
    expect(data.success).toBe(true);
    expect(data.query_params.collection).toBe('Sentinel3');
    expect(data.angola_eez).toEqual({
      north: -4.2,
      south: -18,
      east: 17.5,
      west: 8.5
    });
    expect(data.products_found).toBeGreaterThanOrEqual(0);
    expect(data.data.type).toBe('FeatureCollection');
  });
  
  test('OpenSearch API deve retornar dados Sentinel-2 para Angola', async ({ page }) => {
    const response = await page.goto(`${workerUrl}/copernicus/opensearch?collection=Sentinel2&max_records=3`);
    
    expect(response.status()).toBe(200);
    
    const content = await page.textContent('body');
    const data = JSON.parse(content);
    
    expect(data.success).toBe(true);
    expect(data.query_params.collection).toBe('Sentinel2');
    expect(data.products_found).toBeGreaterThanOrEqual(0);
  });
  
  test('Endpoint Angola Marine deve agregar dados de múltiplas APIs', async ({ page }) => {
    const response = await page.goto(`${workerUrl}/copernicus/angola-marine`);
    
    expect(response.status()).toBe(200);
    
    const content = await page.textContent('body');
    const data = JSON.parse(content);
    
    expect(data.timestamp).toBeTruthy();
    expect(data.angola_eez).toEqual({
      north: -4.2,
      south: -18,
      east: 17.5,
      west: 8.5
    });
    expect(data.data_sources).toHaveProperty('sentinel3_odata');
    expect(data.data_sources).toHaveProperty('sentinel3_stac');
    expect(data.data_sources).toHaveProperty('sentinel3_opensearch');
    expect(data.summary).toHaveProperty('total_products_found');
    expect(data.summary).toHaveProperty('apis_successful');
    expect(data.summary.coverage_area_km2).toBeGreaterThan(1000000); // Angola EEZ > 1M km²
  });
  
  test('Autenticação deve retornar erro sem credenciais', async ({ page }) => {
    const response = await page.goto(`${workerUrl}/copernicus/auth`);
    
    expect(response.status()).toBe(401);
    
    const content = await page.textContent('body');
    const data = JSON.parse(content);
    
    expect(data.error).toContain('Credenciais não configuradas');
  });
  
  test('Admin Dashboard deve carregar interface Copernicus', async ({ page }) => {
    await page.goto('https://bgapp-admin.pages.dev');
    
    // Verificar se a página carregou
    await expect(page).toHaveTitle(/BGAPP.*Marine Angola/);
    
    // Clicar no botão Copernicus Integration
    await page.getByRole('button', { name: /Copernicus Integration/ }).click();
    
    // Verificar se o submenu apareceu
    await expect(page.getByRole('button', { name: 'Monitoramento API' })).toBeVisible();
    
    // Clicar em Monitoramento API
    await page.getByRole('button', { name: 'Monitoramento API' }).click();
    
    // Verificar se a interface Copernicus carregou
    await expect(page.getByRole('heading', { name: /Copernicus Integration/ })).toBeVisible();
    await expect(page.getByText(/Status API/)).toBeVisible();
    await expect(page.getByText(/Produtos Sentinel/)).toBeVisible();
  });
  
  test('Dados Copernicus devem ter estrutura correta', async ({ page }) => {
    const response = await page.goto(`${workerUrl}/copernicus/opensearch?collection=Sentinel3&max_records=1`);
    
    const content = await page.textContent('body');
    const data = JSON.parse(content);
    
    if (data.data.features && data.data.features.length > 0) {
      const feature = data.data.features[0];
      
      // Verificar estrutura GeoJSON
      expect(feature.type).toBe('Feature');
      expect(feature.id).toBeTruthy();
      expect(feature.geometry).toHaveProperty('type');
      expect(feature.geometry).toHaveProperty('coordinates');
      expect(feature.properties).toBeTruthy();
      
      // Verificar propriedades Copernicus
      expect(feature.properties).toHaveProperty('collection');
      expect(feature.properties).toHaveProperty('platform');
      expect(feature.properties).toHaveProperty('productType');
      expect(feature.properties).toHaveProperty('startDate');
      expect(feature.properties.collection).toBe('SENTINEL-3');
    }
  });
});

test.describe('Performance Tests', () => {
  test('APIs devem responder em menos de 10 segundos', async ({ page }) => {
    const workerUrl = 'https://bgapp-copernicus-official.majearcasa.workers.dev';
    
    const startTime = Date.now();
    const response = await page.goto(`${workerUrl}/copernicus/opensearch?collection=Sentinel3&max_records=5`);
    const endTime = Date.now();
    
    expect(response.status()).toBe(200);
    expect(endTime - startTime).toBeLessThan(10000); // 10 segundos
  });
  
  test('Cache deve funcionar corretamente', async ({ page }) => {
    const workerUrl = 'https://bgapp-copernicus-official.majearcasa.workers.dev';
    
    // Primeira requisição
    const startTime1 = Date.now();
    await page.goto(`${workerUrl}/copernicus/opensearch?collection=Sentinel3&max_records=2`);
    const endTime1 = Date.now();
    const time1 = endTime1 - startTime1;
    
    // Segunda requisição (deve usar cache)
    const startTime2 = Date.now();
    await page.goto(`${workerUrl}/copernicus/opensearch?collection=Sentinel3&max_records=2`);
    const endTime2 = Date.now();
    const time2 = endTime2 - startTime2;
    
    // Segunda requisição deve ser mais rápida (cache)
    expect(time2).toBeLessThan(time1);
  });
});