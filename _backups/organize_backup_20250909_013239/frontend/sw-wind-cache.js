/**
 * BGAPP Wind Cache Service Worker
 * Service Worker para cache offline dos dados meteorológicos
 * Baseado nas melhores práticas para PWA
 */

const CACHE_NAME = 'bgapp-wind-cache-v1';
const STATIC_CACHE_NAME = 'bgapp-wind-static-v1';

// Recursos estáticos para cache
const STATIC_RESOURCES = [
    '/assets/js/wind-animation-core.js',
    '/assets/js/wind-data-loader.js',
    '/assets/js/wind-time-dimension.js',
    '/assets/js/wind-integration.js',
    '/assets/js/wind-testing.js'
];

// URLs de dados meteorológicos para cache dinâmico
const METEOROLOGICAL_APIS = [
    '/api/meteorological/',
    '/api/cache/meteorological/',
    'gfs',
    'copernicus'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('🌪️ BGAPP Wind SW - Instalando Service Worker');
    
    event.waitUntil(
        Promise.all([
            // Cache estático
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                console.log('📦 BGAPP Wind SW - Cacheando recursos estáticos');
                return cache.addAll(STATIC_RESOURCES.map(url => {
                    return new Request(url, { cache: 'reload' });
                })).catch(error => {
                    console.warn('⚠️ BGAPP Wind SW - Alguns recursos não puderam ser cacheados:', error);
                });
            }),
            
            // Cache dinâmico inicial
            caches.open(CACHE_NAME)
        ]).then(() => {
            console.log('✅ BGAPP Wind SW - Instalação concluída');
            // Forçar ativação imediata
            return self.skipWaiting();
        })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('🔄 BGAPP Wind SW - Ativando Service Worker');
    
    event.waitUntil(
        Promise.all([
            // Limpar caches antigos
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => 
                            cacheName.startsWith('bgapp-wind-') && 
                            cacheName !== CACHE_NAME && 
                            cacheName !== STATIC_CACHE_NAME
                        )
                        .map(cacheName => {
                            console.log('🗑️ BGAPP Wind SW - Removendo cache antigo:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            }),
            
            // Assumir controle de todos os clientes
            self.clients.claim()
        ]).then(() => {
            console.log('✅ BGAPP Wind SW - Ativação concluída');
        })
    );
});

// Interceptação de requests
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Ignorar requests não-HTTP
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Estratégia para recursos estáticos (JS/CSS)
    if (isStaticResource(url)) {
        event.respondWith(handleStaticResource(request));
        return;
    }
    
    // Estratégia para dados meteorológicos
    if (isMeteorологicalAPI(url)) {
        event.respondWith(handleMeteorologicalData(request));
        return;
    }
    
    // Estratégia padrão para outros recursos
    event.respondWith(handleDefault(request));
});

/**
 * Verificar se é recurso estático
 */
function isStaticResource(url) {
    return STATIC_RESOURCES.some(resource => url.pathname.includes(resource)) ||
           url.pathname.endsWith('.js') ||
           url.pathname.endsWith('.css');
}

/**
 * Verificar se é API meteorológica
 */
function isMeteorологicalAPI(url) {
    return METEOROLOGICAL_APIS.some(api => url.pathname.includes(api));
}

/**
 * Manipular recursos estáticos - Cache First
 */
async function handleStaticResource(request) {
    try {
        // Tentar cache primeiro
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('📦 BGAPP Wind SW - Servindo do cache:', request.url);
            return cachedResponse;
        }
        
        // Se não estiver em cache, buscar da rede
        console.log('🌐 BGAPP Wind SW - Buscando da rede:', request.url);
        const networkResponse = await fetch(request);
        
        // Cachear resposta se for bem-sucedida
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('❌ BGAPP Wind SW - Erro ao buscar recurso estático:', error);
        
        // Tentar fallback do cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Retornar erro se nada funcionar
        return new Response('Recurso indisponível offline', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Manipular dados meteorológicos - Network First com cache
 */
async function handleMeteorologicalData(request) {
    const cacheKey = generateCacheKey(request);
    
    try {
        // Tentar rede primeiro para dados mais atuais
        console.log('🌐 BGAPP Wind SW - Buscando dados meteorológicos da rede:', request.url);
        
        const networkResponse = await Promise.race([
            fetch(request),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Network timeout')), 10000)
            )
        ]);
        
        if (networkResponse.ok) {
            // Cachear dados meteorológicos com TTL
            const cache = await caches.open(CACHE_NAME);
            const responseToCache = networkResponse.clone();
            
            // Adicionar timestamp para controle de expiração
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-time', Date.now().toString());
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            cache.put(cacheKey, cachedResponse);
            console.log('💾 BGAPP Wind SW - Dados meteorológicos cacheados');
        }
        
        return networkResponse;
        
    } catch (error) {
        console.warn('⚠️ BGAPP Wind SW - Falha na rede, tentando cache:', error.message);
        
        // Tentar cache como fallback
        const cachedResponse = await caches.match(cacheKey);
        if (cachedResponse) {
            // Verificar se dados não expiraram (1 hora)
            const cachedTime = cachedResponse.headers.get('sw-cached-time');
            const age = Date.now() - parseInt(cachedTime || '0');
            
            if (age < 3600000) { // 1 hora
                console.log('📦 BGAPP Wind SW - Servindo dados meteorológicos do cache');
                return cachedResponse;
            } else {
                console.log('⏰ BGAPP Wind SW - Dados em cache expirados');
            }
        }
        
        // Retornar erro se nada funcionar
        return new Response(JSON.stringify({
            error: 'Dados meteorológicos indisponíveis offline',
            timestamp: new Date().toISOString(),
            cached: !!cachedResponse
        }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Manipular outros requests - Network Only
 */
async function handleDefault(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.error('❌ BGAPP Wind SW - Erro na requisição padrão:', error);
        return new Response('Recurso indisponível', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Gerar chave de cache para dados meteorológicos
 */
function generateCacheKey(request) {
    const url = new URL(request.url);
    
    // Normalizar parâmetros de consulta para melhor cache hit
    const params = new URLSearchParams(url.search);
    
    // Arredondar tempo para hora mais próxima para melhor cache
    if (params.has('time')) {
        const time = new Date(params.get('time'));
        time.setMinutes(0, 0, 0);
        params.set('time', time.toISOString());
    }
    
    // Ordenar parâmetros para consistência
    params.sort();
    
    return `${url.origin}${url.pathname}?${params.toString()}`;
}

// Limpeza periódica de cache
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAN_CACHE') {
        console.log('🧹 BGAPP Wind SW - Iniciando limpeza de cache');
        
        event.waitUntil(
            cleanExpiredCache().then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    }
    
    if (event.data && event.data.type === 'GET_CACHE_INFO') {
        event.waitUntil(
            getCacheInfo().then((info) => {
                event.ports[0].postMessage(info);
            })
        );
    }
});

/**
 * Limpar cache expirado
 */
async function cleanExpiredCache() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();
        const now = Date.now();
        let deletedCount = 0;
        
        for (const request of requests) {
            const response = await cache.match(request);
            const cachedTime = response.headers.get('sw-cached-time');
            
            if (cachedTime) {
                const age = now - parseInt(cachedTime);
                // Remover se mais antigo que 2 horas
                if (age > 7200000) {
                    await cache.delete(request);
                    deletedCount++;
                }
            }
        }
        
        console.log(`🧹 BGAPP Wind SW - Cache limpo: ${deletedCount} entradas removidas`);
        return deletedCount;
        
    } catch (error) {
        console.error('❌ BGAPP Wind SW - Erro na limpeza de cache:', error);
        return 0;
    }
}

/**
 * Obter informações do cache
 */
async function getCacheInfo() {
    try {
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        const dynamicCache = await caches.open(CACHE_NAME);
        
        const staticKeys = await staticCache.keys();
        const dynamicKeys = await dynamicCache.keys();
        
        return {
            static: {
                name: STATIC_CACHE_NAME,
                entries: staticKeys.length,
                resources: staticKeys.map(req => req.url)
            },
            dynamic: {
                name: CACHE_NAME,
                entries: dynamicKeys.length,
                resources: dynamicKeys.map(req => req.url)
            },
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ BGAPP Wind SW - Erro ao obter info do cache:', error);
        return { error: error.message };
    }
}

// Log de inicialização
console.log('🌪️ BGAPP Wind Cache Service Worker - Carregado e pronto!');
