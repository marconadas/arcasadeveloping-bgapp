# 🔧 Instruções para Debug da Seção "APIs e Conectores"

## 🎯 **Problema Atual**
A seção "APIs e Conectores" continua mostrando "A carregar endpoints..." mesmo após implementação da função `loadAPI()`.

## 🧪 **Passos para Debug**

### **1. Abrir Console do Browser**
1. Abrir: http://localhost:8085/admin.html
2. Pressionar **F12** para abrir DevTools
3. Ir para aba **Console**

### **2. Verificar se JavaScript Carregou**
No console, executar:
```javascript
console.log('SectionLoader existe?', typeof SectionLoader !== 'undefined');
console.log('loadAPI existe?', typeof SectionLoader?.loadAPI === 'function');
```

**Resultado esperado:**
```
SectionLoader existe? true
loadAPI existe? true
```

### **3. Testar Função Manualmente**
No console, executar:
```javascript
// Executar função diretamente
SectionLoader.loadAPI();
```

**Deve aparecer logs como:**
```
🔧 Loading API section...
🔧 SectionLoader.loadAPI() called successfully!
🔧 Looking for api-endpoints element: <div id="api-endpoints">
🔧 Found api-endpoints container, showing loading...
🔧 Getting static endpoints...
🔧 Got endpoints: 10
🔧 Rendering endpoints...
🔧 Rendered HTML length: [número]
🔧 HTML set to container successfully!
```

### **4. Verificar Navegação**
1. Clicar na seção **"APIs e Conectores"** no menu lateral
2. Verificar no console se aparece: `🔧 Loading API section...`
3. Se **NÃO aparecer**, o problema é na navegação

### **5. Forçar Refresh Sem Cache**
1. Pressionar **Ctrl+Shift+R** (Windows/Linux) ou **Cmd+Shift+R** (Mac)
2. Ou abrir em **aba anônima/privada**
3. Tentar novamente

### **6. Verificar Elemento HTML**
No console, executar:
```javascript
document.getElementById('api-endpoints')
```

**Deve retornar:** `<div id="api-endpoints">...</div>`

### **7. Testar Página de Debug**
Abrir: http://localhost:8085/test_api_section.html
- Clicar nos botões de teste
- Verificar resultados

## 🔧 **Soluções Possíveis**

### **Se SectionLoader não existe:**
```bash
# Limpar cache do browser e recarregar
# Ou executar no terminal:
curl -s http://localhost:8085/assets/js/admin.js | grep -c "loadAPI"
# Deve retornar > 0
```

### **Se função não é chamada:**
Verificar se o mapeamento da seção está correto procurando por:
```javascript
case 'api':
    await this.loadAPI();
    break;
```

### **Se elemento não existe:**
Verificar se o HTML tem:
```html
<div id="api-endpoints">
```

## 📊 **Informações de Debug**

### **Arquivos Modificados:**
- `infra/frontend/assets/js/admin.js` - Função implementada
- `infra/frontend/assets/css/admin.css` - Estilos adicionados  
- `infra/nginx/nginx.conf` - Cache desabilitado para JS/CSS
- `infra/frontend/admin.html` - Timestamp atualizado

### **Função Implementada:**
- ✅ `loadAPI()` - Carrega endpoints
- ✅ `getStaticEndpoints()` - Lista de 10 endpoints
- ✅ `renderEndpoints()` - Gera HTML
- ✅ `testEndpoint()` - Testa endpoints

### **Logs de Debug Adicionados:**
```javascript
console.log('🔧 Loading API section...');
console.log('🔧 SectionLoader.loadAPI() called successfully!');
// ... mais logs detalhados
```

## 🚀 **Próximos Passos**

1. **Executar testes no console** seguindo passos acima
2. **Reportar resultados** dos logs que aparecem
3. **Se função não for chamada**: Verificar navegação
4. **Se função falhar**: Verificar erro específico no console
5. **Se tudo funcionar manualmente**: Problema é na navegação automática

## 📞 **Informações para Suporte**

Ao reportar o problema, incluir:
- ✅ Logs que aparecem no console
- ✅ Resultado dos comandos de teste
- ✅ Se função funciona manualmente
- ✅ Versão do browser utilizado
- ✅ Se problema persiste em aba anônima

---

**O objetivo é identificar exatamente onde está falhando para aplicar correção específica.** 🎯
