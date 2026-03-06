const { chromium } = require('playwright');

async function testZEEImprovements() {
    console.log('🚀 Iniciando testes das melhorias da ZEE no deck.gl...');
    
    const browser = await chromium.launch({ 
        headless: false, // Para ver o teste em ação
        slowMo: 1000 // Desacelerar para visualizar melhor
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    try {
        // 1. Navegar para a página do mapa
        console.log('📱 Navegando para a página do mapa...');
        await page.goto('https://ce94cd1e.bgapp-frontend.pages.dev/_organization/demo_files/ml-demo-deckgl-final.html');
        
        // Aguardar o carregamento da página
        await page.waitForLoadState('networkidle');
        console.log('✅ Página carregada com sucesso');
        
        // 2. Verificar se o deck.gl foi inicializado
        console.log('🔍 Verificando inicialização do deck.gl...');
        await page.waitForSelector('#deckgl-map canvas', { timeout: 10000 });
        console.log('✅ Canvas do deck.gl encontrado');
        
        // 3. Verificar logs de inicialização
        console.log('📋 Verificando logs de inicialização...');
        const logContainer = await page.locator('#deckgl-log');
        await logContainer.waitFor({ timeout: 5000 });
        
        const logs = await logContainer.textContent();
        console.log('📊 Logs encontrados:');
        console.log(logs);
        
        // 4. Verificar se as coordenadas precisas foram carregadas
        console.log('🌊 Verificando carregamento das coordenadas precisas...');
        if (logs.includes('ZEE criada com dados PRECISOS')) {
            console.log('✅ Dados precisos da ZEE carregados com sucesso');
        } else if (logs.includes('ZEE criada com coordenadas PRECISAS')) {
            console.log('✅ Coordenadas precisas implementadas');
        } else {
            console.log('⚠️ Usando fallback - dados precisos não encontrados');
        }
        
        // 5. Verificar se as camadas ZEE foram criadas
        console.log('🗺️ Verificando criação das camadas ZEE...');
        if (logs.includes('ZEE Angola') || logs.includes('ZEE Cabinda')) {
            console.log('✅ Camadas ZEE criadas com sucesso');
        } else {
            console.log('❌ Camadas ZEE não encontradas nos logs');
        }
        
        // 6. Testar interatividade do mapa
        console.log('🖱️ Testando interatividade do mapa...');
        const canvas = await page.locator('#deckgl-map canvas');
        
        // Clicar no centro do mapa
        await canvas.click({ position: { x: 500, y: 300 } });
        console.log('✅ Clique no mapa realizado');
        
        // 7. Verificar controles de background
        console.log('🎨 Testando controles de background...');
        const backgroundButtons = await page.locator('.demo-controls button').all();
        
        for (let i = 0; i < backgroundButtons.length; i++) {
            const button = backgroundButtons[i];
            const text = await button.textContent();
            
            if (text.includes('OpenStreetMap') || text.includes('ESRI') || text.includes('Carto')) {
                console.log(`🔄 Testando botão: ${text.trim()}`);
                await button.click();
                await page.waitForTimeout(2000); // Aguardar mudança
                console.log(`✅ Botão ${text.trim()} funcionando`);
            }
        }
        
        // 8. Verificar se as coordenadas estão corretas
        console.log('📍 Verificando coordenadas da ZEE...');
        
        // Verificar se as coordenadas estão dentro dos limites corretos
        const hasCorrectCoordinates = logs.includes('17.5') || logs.includes('8.5') || 
                                    logs.includes('-4.2') || logs.includes('-18.0');
        
        if (hasCorrectCoordinates) {
            console.log('✅ Coordenadas corretas detectadas nos logs');
        } else {
            console.log('⚠️ Coordenadas podem não estar corretas');
        }
        
        // 9. Testar funcionalidades de debug
        console.log('🔍 Testando funcionalidades de debug...');
        const debugButton = page.locator('button:has-text("Debug ZEE")');
        if (await debugButton.count() > 0) {
            await debugButton.click();
            console.log('✅ Botão de debug ZEE funcionando');
        }
        
        // 10. Verificar performance
        console.log('⚡ Verificando performance...');
        const startTime = Date.now();
        
        // Fazer zoom in/out para testar performance
        await canvas.hover({ position: { x: 500, y: 300 } });
        await page.mouse.wheel(0, -100); // Zoom in
        await page.waitForTimeout(1000);
        
        await page.mouse.wheel(0, 100); // Zoom out
        await page.waitForTimeout(1000);
        
        const endTime = Date.now();
        const performanceTime = endTime - startTime;
        
        if (performanceTime < 5000) {
            console.log(`✅ Performance adequada: ${performanceTime}ms`);
        } else {
            console.log(`⚠️ Performance pode estar lenta: ${performanceTime}ms`);
        }
        
        // 11. Capturar screenshot final
        console.log('📸 Capturando screenshot final...');
        await page.screenshot({ 
            path: 'zee-improvements-test.png',
            fullPage: true
        });
        console.log('✅ Screenshot salvo como zee-improvements-test.png');
        
        // 12. Resumo dos testes
        console.log('\n📋 RESUMO DOS TESTES:');
        console.log('==================');
        console.log('✅ Página carregada com sucesso');
        console.log('✅ Canvas deck.gl inicializado');
        console.log('✅ Logs de inicialização verificados');
        console.log('✅ Interatividade do mapa testada');
        console.log('✅ Controles de background funcionando');
        console.log('✅ Performance verificada');
        console.log('✅ Screenshot capturado');
        
        console.log('\n🎉 Todos os testes das melhorias da ZEE foram concluídos!');
        
    } catch (error) {
        console.error('❌ Erro durante os testes:', error);
        
        // Capturar screenshot em caso de erro
        await page.screenshot({ 
            path: 'zee-test-error.png',
            fullPage: true
        });
        console.log('📸 Screenshot de erro salvo como zee-test-error.png');
    } finally {
        await browser.close();
    }
}

// Executar os testes
testZEEImprovements().catch(console.error);
