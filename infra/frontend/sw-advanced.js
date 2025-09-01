/**
 * BGAPP Advanced Service Worker
 * Service Worker avançado com cache inteligente e offline-first
 */

const CACHE_VERSION = 'bgapp-v1.2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Recursos para cache estático
const STATIC_ASSETS = [
    '/',
    '/admin',
    '/admin.html',
    '/index.html',
    '/assets/css/admin.css',
    '/assets/js/admin.js',
    '/assets/js/intelligent-cache.js',
    '/assets/images/logo.png',
    '/manifest.json'
];

// Estratégias de cache
const CACHE_STRATEGIES = {
    NETWORK_FIRST: 'network_first',
    CACHE_FIRST: 'cache_first',
    STALE_WHILE_REVALIDATE: 'stale_while_revalidate',
    NETWORK_ONLY: 'network_only',
    CACHE_ONLY: 'cache_only'
};

// Configuração de rotas e estratégias
const ROUTE_STRATEGIES = [
    { pattern: /\/api\//, strategy: CACHE_STRATEGIES.NETWORK_FIRST, cacheName: API_CACHE, maxAge: 300000 }, // 5 min
    { pattern: /\.(js|css|png|jpg|jpeg|gif|svg|ico)$/, strategy: CACHE_STRATEGIES.CACHE_FIRST, cacheName: STATIC_CACHE },
    { pattern: /\/admin/, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, cacheName: DYNAMIC_CACHE },
    { pattern: /\/$/, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, cacheName: DYNAMIC_CACHE }
];

// Instalar Service Worker
self.addEventListener('install', event => {
    console.log('🚀 BGAPP SW: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 BGAPP SW: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ BGAPP SW: Static assets cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ BGAPP SW: Error caching static assets:', error);
            })
    );
});

// Ativar Service Worker
self.addEventListener('activate', event => {
    console.log('🔄 BGAPP SW: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== API_CACHE) {
                            console.log('🗑️ BGAPP SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ BGAPP SW: Activated');
                return self.clients.claim();
            })
    );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Ignorar requisições não-HTTP
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Encontrar estratégia para a rota
    const routeConfig = ROUTE_STRATEGIES.find(config => 
        config.pattern.test(url.pathname)
    );
    
    if (routeConfig) {
        event.respondWith(
            handleRequest(request, routeConfig)
        );
    } else {
        // Estratégia padrão: Network First
        event.respondWith(
            handleRequest(request, {
                strategy: CACHE_STRATEGIES.NETWORK_FIRST,
                cacheName: DYNAMIC_CACHE
            })
        );
    }
});

// Handler principal de requisições
async function handleRequest(request, config) {
    const { strategy, cacheName, maxAge } = config;
    
    try {
        switch (strategy) {
            case CACHE_STRATEGIES.NETWORK_FIRST:
                return await networkFirst(request, cacheName, maxAge);
            
            case CACHE_STRATEGIES.CACHE_FIRST:
                return await cacheFirst(request, cacheName);
            
            case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
                return await staleWhileRevalidate(request, cacheName);
            
            case CACHE_STRATEGIES.NETWORK_ONLY:
                return await fetch(request);
            
            case CACHE_STRATEGIES.CACHE_ONLY:
                return await cacheOnly(request, cacheName);
            
            default:
                return await networkFirst(request, cacheName);
        }
    } catch (error) {
        console.error('❌ BGAPP SW: Error handling request:', error);
        return await getOfflineFallback(request);
    }
}

// Estratégia Network First
async function networkFirst(request, cacheName, maxAge) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(cacheName);
            
            try {
                // Adicionar timestamp se maxAge definido
                if (maxAge) {
                    const responseToCache = networkResponse.clone();
                    responseToCache.headers.set('sw-cached-at', Date.now().toString());
                    await cache.put(request, responseToCache);
                } else {
                    await cache.put(request, networkResponse.clone());
                }
            } catch (cacheError) {
                console.warn('⚠️ BGAPP SW: Cache put failed:', cacheError);
            }
        }
        
        return networkResponse;
    } catch (error) {
        console.log('🌐 BGAPP SW: Network failed, trying cache');
        const cachedResponse = await getCachedResponse(request, cacheName, maxAge);
        if (cachedResponse) {
            return cachedResponse;
        }
        // Se não há cache, retornar erro estruturado
        return new Response(JSON.stringify({
            error: 'Network and cache failed',
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Estratégia Cache First
async function cacheFirst(request, cacheName) {
    const cachedResponse = await getCachedResponse(request, cacheName);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.ok) {
            try {
                const cache = await caches.open(cacheName);
                await cache.put(request, networkResponse.clone());
            } catch (cacheError) {
                console.warn('⚠️ BGAPP SW: Cache put failed:', cacheError);
            }
        }
        
        return networkResponse;
    } catch (error) {
        return await getOfflineFallback(request);
    }
}

// Estratégia Stale While Revalidate
async function staleWhileRevalidate(request, cacheName) {
    const cachedResponse = await getCachedResponse(request, cacheName);
    
    // Atualizar cache em background
    const networkUpdate = fetch(request)
        .then(async networkResponse => {
            if (networkResponse && networkResponse.ok) {
                try {
                    const cache = await caches.open(cacheName);
                    await cache.put(request, networkResponse.clone());
                } catch (cacheError) {
                    console.warn('⚠️ BGAPP SW: Cache put failed:', cacheError);
                }
            }
            return networkResponse;
        })
        .catch(error => {
            console.log('🌐 BGAPP SW: Background update failed:', error);
            return null;
        });
    
    // Retornar cache imediatamente se disponível
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Se não há cache, aguardar network
    const result = await networkUpdate;
    if (result) {
        return result;
    }
    
    // Fallback se tudo falhar
    return await getOfflineFallback(request);
}

// Estratégia Cache Only
async function cacheOnly(request, cacheName) {
    const cachedResponse = await getCachedResponse(request, cacheName);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    throw new Error('No cached response available');
}

// Obter resposta do cache
async function getCachedResponse(request, cacheName, maxAge) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (!cachedResponse) {
        return null;
    }
    
    // Verificar se expirou (se maxAge definido)
    if (maxAge) {
        const cachedAt = cachedResponse.headers.get('sw-cached-at');
        if (cachedAt && Date.now() - parseInt(cachedAt) > maxAge) {
            await cache.delete(request);
            return null;
        }
    }
    
    return cachedResponse;
}

// Fallback offline
async function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    // Para páginas HTML, retornar página offline
    if (request.destination === 'document') {
        const cache = await caches.open(STATIC_CACHE);
        return await cache.match('/admin') || 
               await cache.match('/index.html') ||
               new Response('Offline - BGAPP', {
                   status: 200,
                   headers: { 'Content-Type': 'text/html' }
               });
    }
    
    // Para APIs, retornar dados em cache ou erro estruturado
    if (url.pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({
            error: 'Offline',
            message: 'Dados não disponíveis offline',
            offline: true,
            timestamp: new Date().toISOString()
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Para outros recursos, retornar erro
    return new Response('Offline', { status: 503 });
}

// Background Sync para quando voltar online
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('🔄 BGAPP SW: Background sync triggered');
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Limpar cache expirado
        await cleanExpiredCache();
        
        // Pré-carregar recursos importantes
        await preloadCriticalResources();
        
        console.log('✅ BGAPP SW: Background sync completed');
    } catch (error) {
        console.error('❌ BGAPP SW: Background sync failed:', error);
    }
}

// Limpar cache expirado
async function cleanExpiredCache() {
    const cacheNames = [API_CACHE, DYNAMIC_CACHE];
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const key of keys) {
            const response = await cache.match(key);
            const cachedAt = response.headers.get('sw-cached-at');
            
            if (cachedAt && Date.now() - parseInt(cachedAt) > 3600000) { // 1 hora
                await cache.delete(key);
                console.log('🗑️ BGAPP SW: Expired cache entry removed:', key.url);
            }
        }
    }
}

// Pré-carregar recursos críticos
async function preloadCriticalResources() {
    const criticalUrls = [
        '/api/services/status',
        '/api/metrics',
        '/api/collections'
    ];
    
    for (const url of criticalUrls) {
        try {
            await fetch(url);
            console.log('📦 BGAPP SW: Preloaded:', url);
        } catch (error) {
            console.log('❌ BGAPP SW: Failed to preload:', url);
        }
    }
}

// Notificações push
self.addEventListener('push', event => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/assets/images/icon-192.png',
        badge: '/assets/images/badge-72.png',
        vibrate: [100, 50, 100],
        data: data.data,
        actions: [
            {
                action: 'open',
                title: 'Abrir BGAPP',
                icon: '/assets/images/icon-action.png'
            },
            {
                action: 'close',
                title: 'Fechar'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Cliques em notificações
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/admin')
        );
    }
});

console.log('🚀 BGAPP Advanced Service Worker loaded!');
