/**
 * Service Worker para BGAPP
 * Gerencia cache de forma inteligente para evitar problemas com scripts externos
 */

const CACHE_NAME = 'bgapp-v2.1.0-https-fix';
const CACHE_VERSION = '20250903-https-fix';

// URLs que NUNCA devem ser cacheadas (sempre buscar da rede)
const NETWORK_ONLY = [
  'https://unpkg.com/leaflet-timedimension',
  'https://unpkg.com/leaflet@',
  'https://cdnjs.cloudflare.com/',
  'nezasa-polyfill.js'  // Nosso polyfill sempre atualizado
];

// URLs que devem usar Network First (tentar rede primeiro, cache como fallback)
const NETWORK_FIRST = [
  'https://tiles.maps.eox.at/',
  'https://services.sentinel-hub.com/',
  'https://bgapp-stac-oceanographic.majearcasa.workers.dev/',
  'https://planetarycomputer.microsoft.com/',
  'https://earth-search.aws.element84.com/',
  '/api/',
  '/BGAPP/api/',
  '.js?v=fresh',  // Scripts com versão fresh
  '.css?v=fresh'  // Estilos com versão fresh
];

// URLs para Cache First (cache primeiro, rede como fallback)
const CACHE_FIRST = [
  'https://*.tile.openstreetmap.org/',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico'
];

console.log('🔧 Service Worker BGAPP inicializando...');

self.addEventListener('install', (event) => {
  console.log('✅ Service Worker instalado');
  self.skipWaiting(); // Força ativação imediata
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  
  // Limpa caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;
  
  // Log detalhado para debug
  console.log('🔍 Fetch interceptado:', url.substring(0, 100) + '...');
  
  // 🐟 REDIRECIONAR LOCALHOST:5080 PARA ADMIN-API-WORKER (SILICON VALLEY FIX)
  if (url.includes('localhost:5080')) {
    const newUrl = url.replace('http://localhost:5080', 'https://bgapp-admin-api.majearcasa.workers.dev');
    console.log('🔄 Redirecionando localhost:5080 para admin-api-worker:', newUrl);
    event.respondWith(
      fetch(newUrl, {
        method: request.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then(response => {
        console.log('✅ Redirecionamento bem-sucedido:', response.status);
        return response;
      }).catch(error => {
        console.error('❌ Erro no redirecionamento:', error);
        return new Response(JSON.stringify({
          error: 'API temporariamente indisponível',
          fallback: true,
          type: "FeatureCollection",
          features: []
        }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // Ignorar requisições HEAD para evitar problemas de cache
  if (request.method === 'HEAD') {
    console.log('🚫 Ignorando requisição HEAD:', url.substring(0, 50) + '...');
    event.respondWith(fetch(request));
    return;
  }
  
  // NETWORK ONLY - Nunca cachear, sempre buscar da rede
  if (NETWORK_ONLY.some(pattern => url.includes(pattern))) {
    console.log('🌐 Network Only:', url.substring(0, 50) + '...');
    event.respondWith(
      fetch(request).catch(error => {
        console.error('❌ Network Only falhou:', error);
        return new Response('Network Error', { status: 503 });
      })
    );
    return;
  }
  
  // NETWORK FIRST - Tentar rede primeiro, cache como fallback
  if (NETWORK_FIRST.some(pattern => url.includes(pattern))) {
    console.log('🔄 Network First:', url.substring(0, 50) + '...');
    event.respondWith(
      fetch(request)
        .then(response => {
          // Se sucesso, salva no cache (apenas para métodos GET)
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone).catch(error => {
                console.warn('⚠️ Erro ao cachear:', error.message);
              });
            });
          }
          return response;
        })
        .catch(() => {
          // Se falha, tenta cache (apenas para métodos GET)
          if (request.method === 'GET') {
            console.log('⚠️ Network falhou, tentando cache...');
            return caches.match(request);
          }
          // Para outros métodos, retorna erro
          return new Response('Network Error', { status: 503 });
        })
    );
    return;
  }
  
  // CACHE FIRST - Cache primeiro, rede como fallback
  if (CACHE_FIRST.some(pattern => url.includes(pattern))) {
    console.log('💾 Cache First:', url.substring(0, 50) + '...');
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          // Se não está no cache, busca da rede (apenas para métodos GET)
          if (request.method === 'GET') {
            return fetch(request).then(response => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, responseClone).catch(error => {
                    console.warn('⚠️ Erro ao cachear:', error.message);
                  });
                });
              }
              return response;
            });
          } else {
            // Para métodos não-GET, fazer fetch direto
            return fetch(request);
          }
        })
    );
    return;
  }
  
  // DEFAULT - Comportamento padrão do navegador
  console.log('🔧 Default handling:', url.substring(0, 50) + '...');
});

// Listener para mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Limpando cache por solicitação...');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ Cache limpo com sucesso');
      event.ports[0].postMessage({ success: true });
    });
  }
});

console.log('✅ Service Worker BGAPP configurado e pronto');