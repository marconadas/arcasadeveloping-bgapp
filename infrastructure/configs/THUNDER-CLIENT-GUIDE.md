# ⚡ Thunder Client - Interface Visual BGAPP

## ✅ Configuração Completa

### **Thunder Client instalado no Cursor** ✅
- Interface visual profissional para APIs
- Organização por collections e folders
- Ambientes configurados (Production/Development)

## 🚀 Como Acessar

### **1. Abrir Thunder Client**
1. No Cursor, clique no ícone do **raio** ⚡ na barra lateral esquerda
2. Ou use `Ctrl+Shift+P` → "Thunder Client: New Request"

### **2. Visualizar Collections**
- Você verá a collection **"🌊 BGAPP Marine Angola API"**
- Organizada em pastas por categoria:
  - 📊 Dashboard & System
  - 🔧 Services Management
  - 🧠 Machine Learning & AI
  - 🛰️ STAC API (Satellite Data)
  - 🌍 PyGeoAPI (OGC Features)
  - 💾 MinIO Storage & Data
  - 🔐 Keycloak Authentication
  - 🗺️ Maps System
  - 📈 Monitoring & Analytics
  - 👥 User Management
  - 🌊 Coastal & Maritime Analysis

## 🔧 Configuração Inicial

### **1. Configurar Tokens**
1. Vá em **Environments** no Thunder Client
2. Selecione **"🌊 BGAPP Production"**
3. Edite as variáveis:
   - `AUTH_TOKEN`: Seu token de admin real
   - `KEYCLOAK_TOKEN`: Seu token Keycloak real

### **2. Testar Conexão**
1. Clique em **"❤️ Health Check"**
2. Clique no botão **"Send"**
3. Deve retornar status 200 com resposta JSON

## 🎯 Funcionalidades

### **Interface Visual**
- ✅ **Tree view** organizada por categorias
- ✅ **Request builder** visual
- ✅ **Response viewer** com syntax highlighting
- ✅ **History** de requests
- ✅ **Variables** reutilizáveis
- ✅ **Collections** organizadas
- ✅ **Environments** (dev/prod)

### **Recursos Avançados**
- 🔄 **Pre/Post request scripts**
- 📊 **Tests** automatizados
- 📋 **Import/Export** collections
- 🔍 **Search** em requests
- 📈 **Response time** tracking
- 💾 **Auto-save** requests

## 📊 Endpoints Principais

### **Dashboard & System** 📊
- Dashboard Statistics
- Health Check  
- System Metrics
- Configuration

### **Machine Learning** 🧠
- Get ML Models
- Make Predictions
- Biodiversity Studies
- MaxEnt Models

### **STAC API** 🛰️
- Collections
- Items
- Search

### **Maps System** 🗺️
- All Maps
- Create Map
- Templates
- Statistics

### **Storage** 💾
- Buckets
- Objects
- Statistics
- Database Tables

## 🌍 Ambientes

### **🌊 BGAPP Production** (Padrão)
```
BASE_URL: https://bgapp-api.majearcasa.workers.dev
STAC_URL: https://bgapp-stac.majearcasa.workers.dev
FRONTEND_URL: https://bgapp-admin.pages.dev
```

### **🔧 BGAPP Development**
```
BASE_URL: http://localhost:8000
STAC_URL: https://bgapp-stac.majearcasa.workers.dev
FRONTEND_URL: http://localhost:3000
```

## 🔒 Segurança

### **Tokens**
- Nunca commite tokens reais
- Use variáveis de ambiente
- Rotacione tokens regularmente

### **HTTPS**
- Todos os endpoints production usam HTTPS
- Certificados válidos Cloudflare

## 🛠️ Troubleshooting

### **Não vejo as collections**
1. Verifique se Thunder Client está ativo
2. Recarregue o Cursor (`Cmd+R`)
3. Verifique arquivos em `thunder-tests/`

### **401 Unauthorized**
1. Verifique se `AUTH_TOKEN` está correto
2. Token pode ter expirado
3. Verifique permissões do usuário

### **CORS Issues**
1. Use ambiente de desenvolvimento local
2. Ou configure proxy se necessário

### **Request Timeout**
1. Verifique conexão internet
2. Alguns endpoints podem demorar mais
3. Aumente timeout nas configurações

## 📈 Próximos Passos

1. **Configure seus tokens reais**
2. **Teste Health Check**
3. **Explore cada categoria**
4. **Crie requests personalizados**
5. **Use para desenvolvimento**

## 💡 Dicas Avançadas

### **Variáveis Dinâmicas**
```json
{
  "collection_id": "{{$randomUUID}}",
  "timestamp": "{{$timestamp}}"
}
```

### **Scripts de Teste**
```javascript
// Test response status
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});

// Test response time
pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

### **Environment Variables**
- Use `{{VARIABLE_NAME}}` em qualquer campo
- Defina variáveis globais vs. por ambiente
- Scripts podem modificar variáveis

---

**⚡ Thunder Client + 🌊 BGAPP = Interface Visual Profissional**

Agora você tem acesso visual completo a todos os endpoints da BGAPP!
