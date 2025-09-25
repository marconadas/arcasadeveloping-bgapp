# Correções CORS e Service Worker - BGAPP v1.2.0

## Problemas Identificados

Com base nos logs fornecidos, foram identificados os seguintes problemas críticos:

### 1. Problemas CORS
```
Access to fetch at 'https://bgapp-api-worker.majearcasa.workers.dev/collections' 
from origin 'https://bgapp-arcasadeveloping.pages.dev' has been blocked by CORS policy: 
Request header field x-retry-attempt is not allowed by Access-Control-Allow-Headers in preflight response.
```

### 2. Erros Service Worker
```
sw-advanced.js:1 Uncaught (in promise) TypeError: Failed to convert value to 'Response'.
```

### 3. Conectividade ERR_FAILED
```
GET https://bgapp-api-worker.majearcasa.workers.dev/collections net::ERR_FAILED
```

## Correções Implementadas

### 1. ✅ Correção CORS no Cloudflare Worker

**Arquivo:** `workers/api-worker.js`

```javascript
// ANTES
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

// DEPOIS
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-retry-attempt, x-request-id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };
}
```

**Mudanças:**
- ✅ Adicionado suporte para headers `x-retry-attempt` e `x-request-id`
- ✅ Adicionado `Access-Control-Max-Age` para cache de preflight
- ✅ Headers CORS mais permissivos para desenvolvimento

### 2. ✅ Correção Service Worker Robusto

**Arquivo:** `infra/frontend/sw-advanced.js`

**Problemas corrigidos:**
- ✅ Tratamento de erro "Failed to convert value to 'Response'"
- ✅ Validação de resposta antes de cache
- ✅ Fallback estruturado para falhas de rede
- ✅ Try/catch em operações de cache

**Melhorias implementadas:**

```javascript
// Network First Strategy - Mais robusta
async function networkFirst(request, cacheName, maxAge) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(cacheName);
            
            try {
                // Safe cache operations
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
        // Structured fallback
        const cachedResponse = await getCachedResponse(request, cacheName, maxAge);
        if (cachedResponse) {
            return cachedResponse;
        }
        
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
```

### 3. ✅ Configuração Worker Cloudflare

**Arquivo:** `workers/wrangler.toml`

```toml
name = "bgapp-api-worker"
main = "api-worker.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "bgapp-api-worker"

[env.production.vars]
NODE_ENV = "production"
API_VERSION = "1.2.0"
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "BGAPP_CACHE"
id = "bgapp_cache_worker"
preview_id = "bgapp_cache_worker_preview"

[vars]
ALLOWED_ORIGINS = "https://bgapp-arcasadeveloping.pages.dev,https://arcasadeveloping.org"
RATE_LIMIT_REQUESTS = "1000"
RATE_LIMIT_WINDOW = "3600"
```

### 4. ✅ Script de Deploy Automático

**Arquivo:** `deploy_worker.sh`

```bash
#!/bin/bash
echo "🚀 Iniciando deploy do BGAPP API Worker..."

# Verificações e deploy
wrangler whoami
cd workers/
wrangler deploy --env production

# Testes automáticos
curl -s "https://bgapp-api-worker.majearcasa.workers.dev/health"
curl -s "https://bgapp-api-worker.majearcasa.workers.dev/services/status"
curl -s "https://bgapp-api-worker.majearcasa.workers.dev/collections"
```

## Status dos Serviços Após Correções

### ✅ Serviços Corrigidos
1. **CORS Headers** - Headers permitidos expandidos
2. **Service Worker** - Tratamento robusto de erros
3. **Worker Configuration** - Configuração otimizada
4. **Deploy Pipeline** - Script automatizado

### 🔧 Próximos Passos

1. **Deploy do Worker:**
   ```bash
   ./deploy_worker.sh
   ```

2. **Verificação Frontend:**
   - Recarregar https://bgapp-arcasadeveloping.pages.dev/admin
   - Verificar se serviços aparecem como "Online"
   - Confirmar carregamento de dados

3. **Monitorização:**
   - Verificar logs do Cloudflare Worker
   - Monitorar métricas de performance
   - Confirmar ausência de erros CORS

## Resultado Esperado

Após as correções, o dashboard administrativo deve mostrar:

- ✅ **7/7 Serviços Online** (ao invés de 0/7)
- ✅ **Latência API < 1s** funcionando
- ✅ **Sem erros CORS** no console
- ✅ **Service Worker** funcionando sem erros
- ✅ **Dados carregando** corretamente

## Arquivos Modificados

1. `workers/api-worker.js` - CORS headers expandidos
2. `infra/frontend/sw-advanced.js` - Service Worker robusto
3. `workers/wrangler.toml` - Configuração Worker
4. `deploy_worker.sh` - Script de deploy (novo)

## Teste de Validação

```bash
# Testar endpoints principais
curl -H "Origin: https://bgapp-arcasadeveloping.pages.dev" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: x-retry-attempt" \
     -X OPTIONS \
     https://bgapp-api-worker.majearcasa.workers.dev/collections

# Deve retornar status 200 com headers CORS apropriados
```

---

**Data:** 2025-01-01  
**Versão:** BGAPP v1.2.0  
**Status:** ✅ Correções implementadas, pronto para deploy
