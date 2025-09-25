# 🌊 BGAPP API Testing Guide - Interface Visual no Cursor

## ✅ Configuração Completa

### 1. **Extensão Instalada**
- ✅ REST Client instalado no Cursor
- Interface visual para testar APIs diretamente no editor

### 2. **Arquivos Criados**
- `api-endpoints.http` - Collection completa com todos os endpoints
- `api-environments.http` - Configurações de ambiente (dev/prod)

## 🚀 Como Usar

### **Passo 1: Configurar Tokens**
1. Abra `api-endpoints.http`
2. Substitua `YOUR_ADMIN_TOKEN_HERE` pelo seu token real
3. Substitua `YOUR_KEYCLOAK_TOKEN_HERE` pelo token Keycloak

### **Passo 2: Testar Endpoints**
1. Clique em qualquer request no arquivo `.http`
2. Use **Ctrl+Alt+R** (ou **Cmd+Alt+R** no Mac) para executar
3. Veja a resposta diretamente no Cursor

### **Passo 3: Trocar Ambientes**
- **Produção**: Use as variáveis padrão no arquivo
- **Desenvolvimento**: Descomente as linhas de dev no `api-environments.http`

## 📊 Endpoints Organizados

### 🔧 **Dashboard & System**
- Dashboard Statistics
- Health Check
- System Metrics
- Configuration

### 🧠 **Machine Learning**
- ML Models
- Predictions
- Biodiversity Studies
- MaxEnt Models

### 🛰️ **STAC API (Satellite Data)**
- Collections
- Items
- Search

### 🌍 **PyGeoAPI (Features)**
- OGC Collections
- Features
- Processes

### 💾 **Storage & Data**
- MinIO Buckets
- Objects
- Statistics

### 🗺️ **Maps System**
- CRUD Operations
- Templates
- Categories
- Validation

### 📈 **Monitoring**
- Async Tasks
- Workers
- Cache
- Alerts

## 🎯 Funcionalidades Avançadas

### **Interface Visual**
- ✅ Syntax highlighting para HTTP
- ✅ Autocompletion para headers
- ✅ Response viewer integrado
- ✅ History de requests
- ✅ Variables com {{}}

### **Organização**
- 📁 Separado por categorias
- 🏷️ Tags visuais com emojis
- 📝 Documentação inline
- 🔄 Reutilização de variáveis

### **Testing Features**
- ⚡ Execução rápida (Ctrl+Alt+R)
- 📊 Response formatting (JSON, XML, etc)
- 🕒 Request timing
- 📋 Copy/paste responses
- 🔍 Search in responses

## 🛡️ Segurança

### **Tokens**
- Nunca commite tokens reais no git
- Use variáveis de ambiente quando possível
- Rotacione tokens regularmente

### **Environment Variables**
```bash
# Opcional: usar variáveis de sistema
export BGAPP_ADMIN_TOKEN="your-real-token"
export BGAPP_KEYCLOAK_TOKEN="your-keycloak-token"
```

## 📚 Exemplos de Uso

### **Testar Health Check**
```http
GET https://bgapp-api.majearcasa.workers.dev/health
```

### **Fazer Predição ML**
```http
POST https://bgapp-api.majearcasa.workers.dev/ml/predict
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "modelId": "marine-species-prediction",
  "features": {
    "temperature": 25.5,
    "depth": 100,
    "salinity": 35.2
  }
}
```

### **Buscar Dados STAC**
```http
GET https://bgapp-stac.majearcasa.workers.dev/collections
```

## 🔧 Troubleshooting

### **Não consigo ver syntax highlighting**
- Verifique se a extensão REST Client está ativa
- Arquivo deve ter extensão `.http`

### **Variáveis não funcionam**
- Use formato `{{variableName}}`
- Defina variáveis com `@variableName = value`

### **401 Unauthorized**
- Verifique se o token está correto
- Token pode ter expirado

### **CORS Issues**
- Use ambiente de desenvolvimento local
- Ou configure proxy se necessário

## 🎨 Interface Visual

O REST Client no Cursor oferece:
- **Syntax coloring** para HTTP requests
- **Inline responses** com formatting
- **Click-to-run** buttons
- **Variable substitution** preview
- **Request history** sidebar
- **Response time** indicators

## 🚀 Próximos Passos

1. **Configure seus tokens reais**
2. **Teste alguns endpoints básicos**
3. **Explore as diferentes categorias**
4. **Use para desenvolvimento/debugging**
5. **Crie requests personalizados conforme necessário**

---

**🌊 BGAPP Marine Angola - Sistema Completo de APIs**
Interface visual profissional para todos os endpoints da aplicação!
