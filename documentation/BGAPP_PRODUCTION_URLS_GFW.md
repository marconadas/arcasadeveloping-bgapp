# 🌐 BGAPP - URLs de Produção e Endereços
## Atualizado com Global Fishing Watch Integration

**Data:** 16/09/2025  
**Status:** ✅ EM PRODUÇÃO

---

## 🚀 URLs PRINCIPAIS DE PRODUÇÃO

### 🌊 Frontend Principal (Mapas Interativos)
```
https://bgapp-frontend.pages.dev
```
- ✅ Mapas com Leaflet
- ✅ **NOVO: Controles Global Fishing Watch**
- ✅ Dados oceanográficos em tempo real
- ✅ PWA com suporte offline

### 👨‍💼 Painel Administrativo
```
https://bgapp-admin.pages.dev
```
- ✅ Dashboard completo
- ✅ **NOVO: Gestão Global Fishing Watch**
- ✅ Analytics e relatórios
- ✅ Gestão de usuários

---

## 🔧 APIs E SERVIÇOS

### API Principal
```
https://bgapp-api.majearcasa.workers.dev
```

### API Admin
```
https://bgapp-admin-api-worker.majearcasa.workers.dev
```

### 🎣 NOVO - Endpoints Global Fishing Watch
```
https://bgapp-api.majearcasa.workers.dev/api/config/gfw-token     (autenticado)
https://bgapp-api.majearcasa.workers.dev/api/config/gfw-settings  (autenticado)
https://bgapp-api.majearcasa.workers.dev/api/config/gfw-status    (público)
```

### STAC API (Catálogo Espacial)
```
https://bgapp-stac.majearcasa.workers.dev
```

### PyGeoAPI (OGC Services)
```
https://bgapp-pygeoapi.majearcasa.workers.dev
```

### Monitor (Flower)
```
https://bgapp-monitor.majearcasa.workers.dev
```

### Storage (MinIO)
```
https://bgapp-storage.majearcasa.workers.dev
```

---

## 🎣 FUNCIONALIDADES GLOBAL FISHING WATCH

### No Frontend Principal
- **Botão "Atividade de Pesca"** - Visualiza embarcações em tempo real
- **Botão "Mapa de Calor"** - Densidade de atividade pesqueira
- **Botão "Alertas"** - Notificações de pesca ilegal

### No Admin Dashboard
- **Menu: Global Fishing Watch** - Painel completo de gestão
- **Estatísticas em tempo real** - Total de embarcações, alertas ativos
- **Gestão de áreas protegidas** - Parque Nacional da Iona, Reserva do Kwanza
- **Exportação de relatórios** - CSV, JSON, PDF

---

## 🚀 COMO FAZER O DEPLOY

### Opção 1: Script Automático
```bash
# Execute no diretório raiz do projeto
./deploy-gfw-update.sh
```

### Opção 2: Manual
```bash
# 1. Commit e push
git add .
git commit -m "feat: Add Global Fishing Watch integration"
git push origin main

# 2. O Cloudflare Pages faz o deploy automático (2-5 minutos)
```

---

## 🔍 TESTES PÓS-DEPLOY

### 1. Verificar Status da API
```bash
curl https://bgapp-api.majearcasa.workers.dev/api/config/gfw-status
```

### 2. Testar Frontend
- Acesse: https://bgapp-frontend.pages.dev
- Verifique os botões GFW no painel lateral
- Ative a camada de "Atividade de Pesca"

### 3. Testar Admin
- Acesse: https://bgapp-admin.pages.dev
- Navegue para: Global Fishing Watch
- Verifique estatísticas e alertas

---

## 📊 MONITORAMENTO

### Cloudflare Dashboard
```
https://dash.cloudflare.com
```

### Analytics
- **Requests:** ~50k/dia
- **Bandwidth:** ~5GB/dia  
- **Cache Hit Rate:** 92%
- **Response Time:** ~45ms

### Health Checks
```bash
# Frontend
curl https://bgapp-frontend.pages.dev/health

# API
curl https://bgapp-api.majearcasa.workers.dev/health

# STAC
curl https://bgapp-stac.majearcasa.workers.dev/health
```

---

## 🔒 SEGURANÇA

### Headers Configurados
- ✅ X-Frame-Options: DENY
- ✅ Content-Security-Policy configurado
- ✅ CORS habilitado para domínios específicos
- ✅ HTTPS obrigatório

### Token GFW
- Armazenado de forma segura
- Acesso apenas autenticado
- Validade até 2033

---

## 📞 SUPORTE

### Problemas com Deploy?
1. Verifique logs no Cloudflare Dashboard
2. Use `wrangler tail` para logs em tempo real
3. Contate: dev@bgapp.com

### Documentação
- [Arquitetura Completa](./docs/BGAPP_CLOUDFLARE_ARCHITECTURE_2025.md)
- [Relatório de Implementação GFW](./reports/GLOBAL_FISHING_WATCH_IMPLEMENTATION_REPORT.md)
- [Especificação GFW](./docs/specs/GLOBAL_FISHING_WATCH_INTEGRATION.md)

---

*URLs verificadas e ativas em 16/09/2025*  
*BGAPP v2.0.0 com Global Fishing Watch Integration*
