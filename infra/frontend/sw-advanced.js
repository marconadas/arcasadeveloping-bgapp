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
    // NÃO interceptar APIs externas - deixar o browser lidar com CORS
    { pattern: /^https?:\/\/.*:8000\//, strategy: CACHE_STRATEGIES.NETWORK_ONLY }, // Admin API
    { pattern: /^https?:\/\/.*:5080\//, strategy: CACHE_STRATEGIES.NETWORK_ONLY }, // pygeoapi
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
    
    console.log('🔍 Fetch interceptado:', url.href.substring(0, 80) + '...');
    
    // Ignorar requisições não-HTTP
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // NÃO interceptar requisições para localhost:8000 (Admin API)
    if (url.port === '8000') {
        console.log('🔄 Admin API (8000) - deixando passar:', url.href.substring(0, 60));
        return; // Deixar passar sem interceptar
    }
    
    // 🐟 REDIRECIONAR LOCALHOST:5080 PARA ADMIN-API-WORKER (SILICON VALLEY FIX)
    const isPyGeoAPI = url.port === '5080';
    
    if (isPyGeoAPI) {
        console.log('🛡️ PyGeoAPI detectado - redirecionando para admin-api-worker:', url.href.substring(0, 60));
        
        // Redirecionar para admin-api-worker em produção
        const isProduction = !url.hostname.includes('localhost');
        if (isProduction) {
            const newUrl = url.href.replace('localhost:5080', 'bgapp-admin-api.majearcasa.workers.dev');
            console.log('🔄 Redirecionando:', newUrl);
            event.respondWith(fetch(newUrl, {
                method: request.method,
                headers: request.headers,
                body: request.body
            }));
        } else {
            event.respondWith(handleCriticalAPIRequest(request));
        }
        return;
    }
    
    // NÃO interceptar outras requisições cross-origin para APIs externas (CORS)
    const isExternalAPI = url.hostname !== self.location.hostname && 
                         (url.port === '8000' || 
                          url.pathname.startsWith('/services') || 
                          url.pathname.startsWith('/auth'));
    
    if (isExternalAPI) {
        console.log('🌐 Network Only:', url.href.substring(0, 60) + '...');
        return; // Deixar o browser lidar com CORS
    }
    
    // Encontrar estratégia para a rota
    const routeConfig = ROUTE_STRATEGIES.find(config => 
        config.pattern.test(url.href) || config.pattern.test(url.pathname)
    );
    
    if (routeConfig) {
        event.respondWith(
            handleRequest(request, routeConfig)
        );
    } else {
        // Para recursos locais, usar estratégia padrão
        if (url.hostname === self.location.hostname) {
            event.respondWith(
                handleRequest(request, {
                    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
                    cacheName: DYNAMIC_CACHE
                })
            );
        }
        // Caso contrário, não interceptar (deixar browser lidar)
    }
});

// Handler principal de requisições
async function handleRequest(request, config) {
    const { strategy, cacheName, maxAge } = config;
    
    try {
        let response;
        switch (strategy) {
            case CACHE_STRATEGIES.NETWORK_FIRST:
                response = await networkFirst(request, cacheName, maxAge);
                break;
            
            case CACHE_STRATEGIES.CACHE_FIRST:
                response = await cacheFirst(request, cacheName);
                break;
            
            case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
                response = await staleWhileRevalidate(request, cacheName);
                break;
            
            case CACHE_STRATEGIES.NETWORK_ONLY:
                response = await fetch(request);
                break;
            
            case CACHE_STRATEGIES.CACHE_ONLY:
                response = await cacheOnly(request, cacheName);
                break;
            
            default:
                response = await networkFirst(request, cacheName);
                break;
        }
        
        // Validar response antes de retornar
        return validateResponse(response, request);
        
    } catch (error) {
        console.error('❌ BGAPP SW: Error handling request:', error);
        return await getOfflineFallback(request);
    }
}

// Função para validar Response objects
function validateResponse(response, request) {
    try {
        // Verificar se é um Response válido
        if (!response || typeof response !== 'object') {
            console.warn('⚠️ BGAPP SW: Invalid response object for:', request.url);
            return createErrorResponse('Invalid response object', 500);
        }
        
        // Verificar se tem as propriedades necessárias de Response
        if (typeof response.ok !== 'boolean' || typeof response.status !== 'number') {
            console.warn('⚠️ BGAPP SW: Response missing required properties for:', request.url);
            return createErrorResponse('Malformed response', 500);
        }
        
        return response;
    } catch (error) {
        console.error('❌ BGAPP SW: Response validation failed:', error);
        return createErrorResponse('Response validation failed', 500);
    }
}

// Criar response de erro estruturada
function createErrorResponse(message, status = 503) {
    return new Response(JSON.stringify({
        error: true,
        message: message,
        timestamp: new Date().toISOString(),
        serviceWorker: true
    }), {
        status: status,
        statusText: message,
        headers: { 
            'Content-Type': 'application/json',
            'X-Service-Worker': 'BGAPP-v1.2.0'
        }
    });
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
        
        try {
            const cachedResponse = await getCachedResponse(request, cacheName, maxAge);
            if (cachedResponse) {
                return validateResponse(cachedResponse, request);
            }
        } catch (cacheError) {
            console.warn('⚠️ BGAPP SW: Cache access failed:', cacheError);
        }
        
        // Se não há cache, retornar erro estruturado
        return createErrorResponse(`Network and cache failed: ${error.message}`, 503);
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
        
        return validateResponse(networkResponse, request);
    } catch (error) {
        console.warn('⚠️ BGAPP SW: Cache first network fallback failed:', error);
        return createErrorResponse(`Cache first failed: ${error.message}`, 503);
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
        return validateResponse(cachedResponse, request);
    }
    
    // Se não há cache, aguardar network
    try {
        const result = await networkUpdate;
        if (result) {
            return validateResponse(result, request);
        }
    } catch (networkError) {
        console.warn('⚠️ BGAPP SW: Network update failed in staleWhileRevalidate:', networkError);
    }
    
    // Fallback se tudo falhar
    return createErrorResponse('Stale while revalidate failed', 503);
}

// Estratégia Cache Only
async function cacheOnly(request, cacheName) {
    try {
        const cachedResponse = await getCachedResponse(request, cacheName);
        
        if (cachedResponse) {
            return validateResponse(cachedResponse, request);
        }
        
        return createErrorResponse('No cached response available', 404);
    } catch (error) {
        console.error('❌ BGAPP SW: Cache only failed:', error);
        return createErrorResponse(`Cache only failed: ${error.message}`, 503);
    }
}

// Obter resposta do cache
async function getCachedResponse(request, cacheName, maxAge) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (!cachedResponse) {
            return null;
        }
        
        // Verificar se expirou (se maxAge definido)
        if (maxAge) {
            const cachedAt = cachedResponse.headers.get('sw-cached-at');
            if (cachedAt && Date.now() - parseInt(cachedAt) > maxAge) {
                try {
                    await cache.delete(request);
                } catch (deleteError) {
                    console.warn('⚠️ BGAPP SW: Failed to delete expired cache:', deleteError);
                }
                return null;
            }
        }
        
        return cachedResponse;
    } catch (error) {
        console.error('❌ BGAPP SW: Cache access failed:', error);
        return null;
    }
}

// Handler para APIs críticas com resiliência
async function handleCriticalAPIRequest(request) {
    const url = new URL(request.url);
    console.log('🔧 Default handling:', url.href.substring(0, 60) + '...');
    
    try {
        // Tentar serviço primário primeiro
        const primaryResponse = await fetch(request.clone());
        
        if (primaryResponse.ok) {
            // Cache resposta bem-sucedida
            const cache = await caches.open(API_CACHE);
            await cache.put(request, primaryResponse.clone());
            return primaryResponse;
        }
        
        // Se falhar, tentar fallback para admin-api
        if (url.port === '5080') {
            console.log('🔄 Tentando fallback admin-api...');
            const fallbackUrl = buildFallbackUrl(url);
            const fallbackResponse = await fetch(fallbackUrl);
            
            if (fallbackResponse.ok) {
                const cache = await caches.open(API_CACHE);
                await cache.put(request, fallbackResponse.clone());
                return fallbackResponse;
            }
        }
        
        // Tentar cache como último recurso
        const cache = await caches.open(API_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('💾 Cache First:', url.href.substring(0, 60) + '...');
            return cachedResponse;
        }
        
        // Resposta mock se tudo falhar
        return createMockAPIResponse(url);
        
    } catch (error) {
        console.error('❌ Erro em API crítica:', error);
        
        // Tentar cache expirado
        const cache = await caches.open(API_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return createMockAPIResponse(url);
    }
}

// Construir URL de fallback para admin-api
function buildFallbackUrl(originalUrl) {
    const adminApiBase = 'http://localhost:8085/admin-api';
    
    if (originalUrl.pathname.includes('/collections')) {
        return `${adminApiBase}/collections`;
    } else if (originalUrl.pathname.includes('/openapi')) {
        return `${adminApiBase}/openapi`;
    } else {
        return `${adminApiBase}${originalUrl.pathname}`;
    }
}

// Criar resposta mock para APIs
function createMockAPIResponse(url) {
    let mockData;
    
    if (url.pathname.includes('/collections')) {
        mockData = {
            collections: [],
            links: [],
            message: "Dados temporariamente indisponíveis - modo offline"
        };
    } else if (url.pathname.includes('/connectors')) {
        mockData = {
            connectors: {},
            message: "Conectores temporariamente indisponíveis"
        };
    } else {
        mockData = {
            error: true,
            message: "API temporariamente indisponível",
            offline: true,
            timestamp: new Date().toISOString()
        };
    }
    
    console.log('🔄 Resposta mock para:', url.pathname);
    
    return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 
            'Content-Type': 'application/json',
            'X-Mock': 'true',
            'X-Service-Worker': 'BGAPP-v1.2.0'
        }
    });
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
        return createErrorResponse('Dados não disponíveis offline', 503);
    }
    
    // Para outros recursos, retornar erro
    return createErrorResponse('Recurso não disponível offline', 503);
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
