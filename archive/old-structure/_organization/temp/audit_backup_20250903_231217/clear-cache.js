/**
 * Script de limpeza forçada de cache BGAPP
 * Execute no console do navegador
 */

async function clearBGAPPCacheForce() {
  console.log('🧹 Iniciando limpeza forçada de cache BGAPP...');
  
  try {
    // 1. Limpar todos os caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`📦 Encontrados ${cacheNames.length} caches`);
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log(`🗑️ Cache removido: ${cacheName}`);
      }
    }
    
    // 2. Desregistrar Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`🔧 Encontrados ${registrations.length} Service Workers`);
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log(`❌ Service Worker desregistrado: ${registration.scope}`);
      }
    }
    
    // 3. Limpar Storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('💾 Storage limpo');
    
    // 4. Recarregar página
    console.log('✅ Limpeza completa! Recarregando página...');
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  }
}

// Executar automaticamente
clearBGAPPCacheForce();
