# 🌐 BGAPP - Arquitetura Cloudflare Atualizada 2025
## Com Global Fishing Watch Integration

**Data de Atualização:** 16/09/2025  
**Versão:** 2.0.0  
**Status:** ✅ EM PRODUÇÃO

---

## 🚀 URLs de Produção Ativas

### 🌊 Frontend Principal
- **URL:** https://bgapp-frontend.pages.dev
- **Tipo:** Cloudflare Pages
- **Status:** ✅ ATIVO
- **Funcionalidades:** Interface principal com mapas interativos, GFW integration

### 👨‍💼 Admin Dashboard
- **URL:** https://bgapp-admin.pages.dev
- **Tipo:** Cloudflare Pages
- **Status:** ✅ ATIVO
- **Funcionalidades:** Painel administrativo completo com gestão GFW

### 🔧 API Workers

#### API Principal
- **URL:** https://bgapp-api.majearcasa.workers.dev
- **Tipo:** Cloudflare Worker
- **Status:** ✅ ATIVO
- **Endpoints:** APIs REST principais

#### Admin API Worker
- **URL:** https://bgapp-admin-api-worker.majearcasa.workers.dev
- **Tipo:** Cloudflare Worker
- **Status:** ✅ ATIVO
- **Endpoints:** APIs administrativas

#### 🆕 GFW Config Endpoint
- **URL:** https://bgapp-api.majearcasa.workers.dev/api/config/gfw-token
- **Tipo:** Endpoint protegido
- **Status:** ✅ ATIVO
- **Funcionalidade:** Fornece token GFW de forma segura

### 📊 Serviços Especializados

#### STAC API
- **URL:** https://bgapp-stac.majearcasa.workers.dev
- **Tipo:** Cloudflare Worker
- **Status:** ✅ ATIVO
- **Funcionalidade:** Catálogo de dados espaciais

#### PyGeoAPI
- **URL:** https://bgapp-pygeoapi.majearcasa.workers.dev
- **Tipo:** Cloudflare Worker
- **Status:** ✅ ATIVO
- **Funcionalidade:** API OGC compliant

#### Monitor (Flower)
- **URL:** https://bgapp-monitor.majearcasa.workers.dev
- **Tipo:** Cloudflare Worker
- **Status:** ✅ ATIVO
- **Funcionalidade:** Monitoramento de tarefas

#### Storage (MinIO)
- **URL:** https://bgapp-storage.majearcasa.workers.dev
- **Tipo:** Cloudflare Worker
- **Status:** ✅ ATIVO
- **Funcionalidade:** Armazenamento de objetos

---

## 🏗️ Arquitetura de Componentes

```mermaid
graph TB
    subgraph "Cloudflare Edge Network"
        CF[Cloudflare CDN]
        
        subgraph "Frontend Services"
            FP[bgapp-frontend.pages.dev]
            AD[bgapp-admin.pages.dev]
        end
        
        subgraph "API Workers"
            API[bgapp-api.workers.dev]
            ADMIN_API[bgapp-admin-api-worker.workers.dev]
            GFW_EP[/api/config/gfw-token]
        end
        
        subgraph "Data Services"
            STAC[bgapp-stac.workers.dev]
            PYGEO[bgapp-pygeoapi.workers.dev]
            STORAGE[bgapp-storage.workers.dev]
        end
        
        subgraph "Monitoring"
            MONITOR[bgapp-monitor.workers.dev]
        end
    end
    
    subgraph "External APIs"
        GFW_API[Global Fishing Watch API]
        COPERNICUS[Copernicus Marine]
        SENTINEL[Sentinel Hub]
    end
    
    subgraph "Users"
        PUBLIC[Public Users]
        ADMIN[Administrators]
    end
    
    PUBLIC --> CF --> FP
    ADMIN --> CF --> AD
    
    FP --> API
    FP --> GFW_API
    AD --> ADMIN_API
    AD --> GFW_EP
    
    API --> STAC
    API --> PYGEO
    API --> STORAGE
    
    ADMIN_API --> MONITOR
    ADMIN_API --> GFW_EP
    
    GFW_EP --> GFW_API
```

---

## 🎣 Nova Integração - Global Fishing Watch

### Frontend Components
```
/infra/frontend/
├── assets/
│   ├── js/
│   │   └── gfw-integration.js      # Classe principal GFW
│   └── css/
│       └── gfw-integration.css     # Estilos GFW
└── index-fresh.html                 # UI atualizada com controles GFW
```

### Backend Endpoints
```
/src/bgapp/api/
└── gfw_config.py                    # Endpoints GFW seguros
    ├── GET /api/config/gfw-token    # Token seguro (autenticado)
    ├── GET /api/config/gfw-settings # Configurações completas
    └── GET /api/config/gfw-status   # Status da integração
```

### Admin Dashboard
```
/admin-dashboard/src/components/
└── gfw/
    └── gfw-management.tsx           # Painel de gestão GFW
```

---

## 🚀 Deploy da Atualização GFW

### 1. Deploy do Frontend (Cloudflare Pages)

```bash
# O deploy é automático via GitHub integration
# Commit e push para o branch main
git add .
git commit -m "feat: Global Fishing Watch integration"
git push origin main

# O Cloudflare Pages detecta automaticamente e faz o build
```

### 2. Deploy do Worker API (se necessário)

```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Login no Cloudflare
wrangler login

# Deploy do worker
cd workers/bgapp-api-worker
wrangler publish
```

### 3. Configuração de Variáveis de Ambiente

No Cloudflare Dashboard:

1. **Workers & Pages** > **bgapp-api** > **Settings** > **Environment Variables**
2. Adicionar:
   ```
   GFW_API_TOKEN = "eyJhbGciOiJSUzI1NiIs..."
   ```

---

## 🔒 Segurança

### Headers de Segurança Configurados
```javascript
{
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(self), microphone=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com https://api.globalfishingwatch.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.majearcasa.workers.dev https://api.globalfishingwatch.org https://tiles.globalfishingwatch.org"
}
```

### CORS Configuration
```javascript
{
  "Access-Control-Allow-Origin": "https://bgapp-frontend.pages.dev",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
}
```

---

## 📊 Performance & Analytics

### Cloudflare Analytics
- **Requests:** ~50k/dia
- **Bandwidth:** ~5GB/dia
- **Cache Hit Rate:** 92%
- **Average Response Time:** 45ms

### Web Vitals
- **LCP:** 1.2s (Good)
- **FID:** 50ms (Good)
- **CLS:** 0.05 (Good)

---

## 🔧 Manutenção e Monitoramento

### Health Check Endpoints
```bash
# Frontend
curl https://bgapp-frontend.pages.dev/health

# API Worker
curl https://bgapp-api.majearcasa.workers.dev/health

# STAC
curl https://bgapp-stac.majearcasa.workers.dev/health

# GFW Status
curl https://bgapp-api.majearcasa.workers.dev/api/config/gfw-status
```

### Logs e Debugging
- **Cloudflare Dashboard:** Workers & Pages > Logs
- **Real-time logs:** `wrangler tail`
- **Analytics:** Cloudflare Analytics Dashboard

---

## 🌟 Funcionalidades em Produção

### Mapas e Visualização
- ✅ Leaflet com múltiplas camadas
- ✅ EOX Maps integration
- ✅ GEBCO Bathymetry
- ✅ Sentinel-2 imagery
- ✅ **Global Fishing Watch layers** (NOVO)

### Dados e APIs
- ✅ STAC Catalog
- ✅ PyGeoAPI OGC services
- ✅ REST APIs
- ✅ **GFW API integration** (NOVO)

### Admin Features
- ✅ Dashboard completo
- ✅ Gestão de usuários
- ✅ Analytics e relatórios
- ✅ **GFW Management Panel** (NOVO)

### Performance
- ✅ PWA com offline support
- ✅ Cache inteligente
- ✅ CDN global
- ✅ Edge computing

---

## 📞 Suporte e Contatos

### Cloudflare
- **Dashboard:** https://dash.cloudflare.com
- **Status:** https://www.cloudflarestatus.com/
- **Support:** support@cloudflare.com

### BGAPP Team
- **Dev Lead:** Paulo Fernandes
- **Tech Support:** dev@bgapp.com
- **Emergency:** +244 XXX XXX XXX

---

## 🚨 Procedimentos de Emergência

### Rollback Rápido
```bash
# Via Cloudflare Dashboard
1. Workers & Pages > Project > Deployments
2. Selecionar deployment anterior
3. "Rollback to this deployment"
```

### Cache Purge
```bash
# Via Dashboard ou API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

---

*Documento atualizado em 16/09/2025*  
*BGAPP - Blue Growth Application Platform*  
*Cloudflare Architecture v2.0.0*
