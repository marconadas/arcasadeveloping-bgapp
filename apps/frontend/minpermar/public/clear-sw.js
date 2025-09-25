/**
 * Script para limpar Service Workers desnecessários no MinPerMar
 * Executa automaticamente quando o MinPerMar é carregado
 */

(function() {
    'use strict';
    
    console.log('🧹 MinPerMar - Verificando Service Workers para limpeza...');
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            let cleanedCount = 0;
            
            registrations.forEach(function(registration) {
                // Remover qualquer Service Worker que não seja específico do MinPerMar
                const isMinPerMarSW = registration.active?.scriptURL.includes('minpermar') || 
                                      registration.waiting?.scriptURL.includes('minpermar') ||
                                      registration.installing?.scriptURL.includes('minpermar');
                
                const isBGAPPSW = registration.active?.scriptURL.includes('sw-wind-cache') || 
                                  registration.active?.scriptURL.includes('sw-advanced') ||
                                  registration.active?.scriptURL.includes('sw.js') ||
                                  registration.waiting?.scriptURL.includes('sw-wind-cache') ||
                                  registration.waiting?.scriptURL.includes('sw-advanced') ||
                                  registration.waiting?.scriptURL.includes('sw.js') ||
                                  registration.installing?.scriptURL.includes('sw-wind-cache') ||
                                  registration.installing?.scriptURL.includes('sw-advanced') ||
                                  registration.installing?.scriptURL.includes('sw.js');
                
                if (!isMinPerMarSW && isBGAPPSW) {
                    console.log('🗑️ MinPerMar - Removendo Service Worker BGAPP:', registration.scope);
                    registration.unregister().then(function(success) {
                        if (success) {
                            cleanedCount++;
                            console.log('✅ MinPerMar - Service Worker BGAPP removido com sucesso');
                        }
                    });
                }
            });
            
            if (cleanedCount === 0) {
                console.log('✅ MinPerMar - Nenhum Service Worker desnecessário encontrado');
            } else {
                console.log(`🧹 MinPerMar - ${cleanedCount} Service Worker(s) removido(s)`);
            }
        }).catch(function(error) {
            console.error('❌ MinPerMar - Erro ao verificar Service Workers:', error);
        });
    }
})();
