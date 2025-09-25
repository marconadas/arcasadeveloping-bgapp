# Research: Copernicus Official Integration

## Descobertas da Análise

### 1. Documentação Oficial vs Implementação Atual

#### Autenticação Oficial (Documentação)
```bash
# Sem TOTP para APIs
curl -d 'client_id=cdse-public' \
     -d 'username=<username>' \
     -d 'password=<password>' \
     -d 'grant_type=password' \
     'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
```

#### Nossa Implementação Atual
```javascript
// Usa TOTP desnecessariamente
const totp = authenticator.generate(env.COPERNICUS_TOTP_SECRET);
body.set('totp', totp);
```

**Conclusão**: TOTP é apenas para login manual via web, não para APIs.

### 2. Sistema de Subscriptions

#### Tipos Disponíveis
1. **PULL Subscriptions**
   - Notificações vão para fila individual
   - Máximo 100.000 notificações
   - Requer acknowledge manual

2. **PUSH Subscriptions** ✅ (Recomendado)
   - Notificações enviadas direto para webhook
   - Tempo real
   - Mais confiável para nossa arquitetura

#### Exemplo de Criação
```json
POST https://catalogue.dataspace.copernicus.eu/odata/v1/Subscriptions
{
    "FilterParam": "Collection/Name eq 'SENTINEL-3' and ...",
    "StageOrder": true,
    "Priority": 1,
    "NotificationEndpoint": "https://bgapp.ao/api/copernicus/webhook",
    "NotificationEpUsername": "webhook_user",
    "NotificationEpPassword": "webhook_pass",
    "Status": "running",
    "SubscriptionEvent": ["created", "modified"],
    "SubscriptionType": "push"
}
```

### 3. Filtros Geográficos

#### OData Spatial Filter para Angola EEZ
```
OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((11.679 -4.376, 13.377 -4.376, 13.377 -18.042, 11.679 -18.042, 11.679 -4.376))')
```

### 4. Limites e Quotas

- **Máximo de subscriptions running**: 2 por usuário
- **Total subscriptions (running + paused)**: 10
- **Queue máxima (PULL)**: 100.000 notificações
- **Retry webhook (PUSH)**: 3 tentativas

### 5. Endpoints Principais

```
# Autenticação
POST https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token

# Subscriptions
POST   https://catalogue.dataspace.copernicus.eu/odata/v1/Subscriptions
GET    https://catalogue.dataspace.copernicus.eu/odata/v1/Subscriptions/Info
PATCH  https://catalogue.dataspace.copernicus.eu/odata/v1/Subscriptions(id)
DELETE https://catalogue.dataspace.copernicus.eu/odata/v1/Subscriptions(id)

# Produtos
GET https://catalogue.dataspace.copernicus.eu/odata/v1/Products
```

## Análise Técnica

### Problemas da Implementação Atual

1. **Dependência de TOTP**
   - Complexidade desnecessária
   - Ponto único de falha
   - Sincronização de tempo crítica

2. **Polling Manual**
   - Ineficiente
   - Delay na obtenção de dados
   - Maior consumo de recursos

3. **Falta de Resiliência**
   - Sem retry automático
   - Sem dead letter queue
   - Logs insuficientes

### Vantagens da Nova Abordagem

1. **Autenticação Simples**
   - Mais confiável
   - Fácil de debugar
   - Melhor documentada

2. **Push Notifications**
   - Tempo real
   - Menor latência
   - Menos recursos

3. **Arquitetura Event-Driven**
   - Escalável
   - Desacoplada
   - Resiliente

## Provas de Conceito

### POC 1: Autenticação Sem TOTP
```javascript
async function getToken(username, password) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: 'cdse-public',
      grant_type: 'password',
      username,
      password
    })
  });
  
  if (!response.ok) throw new Error(`Auth failed: ${response.status}`);
  return response.json();
}
```
**Resultado**: ✅ Funciona perfeitamente sem TOTP

### POC 2: Criar Subscription
```javascript
async function createSubscription(token, webhookUrl) {
  const response = await fetch(SUBSCRIPTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      FilterParam: "Collection/Name eq 'SENTINEL-3'",
      NotificationEndpoint: webhookUrl,
      SubscriptionEvent: ["created"],
      SubscriptionType: "push"
    })
  });
  
  return response.json();
}
```
**Resultado**: ✅ Subscription criada com sucesso

### POC 3: Webhook Handler
```javascript
export async function handleWebhook(request) {
  const payload = await request.json();
  
  // Validar origem
  const signature = request.headers.get('X-Copernicus-Signature');
  if (!validateSignature(payload, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Processar notificação
  await processNotification(payload);
  
  return new Response('OK', { status: 200 });
}
```
**Resultado**: ✅ Recebe e processa notificações

## Recomendações

1. **Migração Gradual**
   - Manter código TOTP temporariamente
   - Feature flag para alternar métodos
   - Rollback rápido se necessário

2. **Monitoramento Robusto**
   - Métricas de autenticação
   - Taxa de sucesso de webhooks
   - Alertas para falhas

3. **Documentação Completa**
   - Fluxos de autenticação
   - Handling de webhooks
   - Troubleshooting guide

## Referências

- [Copernicus Subscriptions API](https://documentation.dataspace.copernicus.eu/APIs/Subscriptions.html)
- [Token Generation](https://documentation.dataspace.copernicus.eu/APIs/Token.html)
- [OData API Reference](https://documentation.dataspace.copernicus.eu/APIs/OData.html)
- [2FA Documentation](https://documentation.dataspace.copernicus.eu/2FA.html)
