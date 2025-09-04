# 🔍 DIAGNÓSTICO DIRETO NO CONSOLE

**Cole este código no console do browser para diagnóstico imediato:**

```javascript
// DIAGNÓSTICO BGAPP - COLE NO CONSOLE
(async function() {
    console.clear();
    console.log('🔍 DIAGNÓSTICO BGAPP INICIADO...\n');
    
    // 1. Testar Admin API
    console.log('🔧 TESTANDO ADMIN API...');
    
    const endpoints = [
        'http://localhost:8000/admin-api/health',
        'http://localhost:8000/admin-api/collections',
        'http://localhost:8000/admin-api/services/status',
        'http://localhost:8000/admin-api/connectors'
    ];
    
    for (const url of endpoints) {
        try {
            const response = await fetch(url);
            const status = response.ok ? '✅' : '❌';
            console.log(`${status} ${url}: HTTP ${response.status}`);
        } catch (error) {
            console.log(`❌ ${url}: ${error.message}`);
        }
    }
    
    // 2. Verificar scripts
    console.log('\n📦 VERIFICANDO SCRIPTS...');
    const scripts = ['api-resilience.js', 'api-plugin-manager.js', 'api-adapter.js', 'health-checker.js'];
    scripts.forEach(script => {
        const found = document.querySelector(`script[src*="${script}"]`);
        console.log(`${found ? '✅' : '❌'} ${script}`);
    });
    
    // 3. Verificar variáveis globais
    console.log('\n🌐 VERIFICANDO GLOBAIS...');
    const globals = ['API', 'apiResilienceManager', 'apiPluginManager', 'bgappAPIAdapter'];
    globals.forEach(global => {
        const exists = !!window[global];
        console.log(`${exists ? '✅' : '❌'} window.${global}: ${typeof window[global]}`);
    });
    
    // 4. Criar healthCheck se não existir
    if (!window.healthCheck) {
        window.healthCheck = async () => {
            console.log('🏥 Health Check Rápido...');
            const health = await fetch('http://localhost:8000/admin-api/health');
            console.log(`Admin API: ${health.ok ? 'OK' : 'FAIL'}`);
            return health.ok;
        };
        console.log('\n✅ healthCheck() criado temporariamente');
    }
    
    // 5. Testar se admin_api_simple.py está rodando
    try {
        const health = await fetch('http://localhost:8000/admin-api/health');
        if (health.ok) {
            console.log('\n🟢 ADMIN API FUNCIONANDO!');
            const data = await health.json();
            console.log('📊 Status:', data);
        } else {
            console.log('\n🔴 ADMIN API RETORNANDO ERRO!');
        }
    } catch (error) {
        console.log('\n🔴 ADMIN API OFFLINE!');
        console.log('💡 Execute: python admin_api_simple.py');
    }
    
    console.log('\n🎉 DIAGNÓSTICO COMPLETO!');
})();
```

## 🚀 INSTRUÇÕES RÁPIDAS:

### **1. Cole o código acima no console**

### **2. Se aparecer "ADMIN API OFFLINE":**
```bash
# Execute no terminal:
cd /Users/marcossantos/Library/CloudStorage/OneDrive-MareDatumConsultoriaeGestãodeProjectosUnipessoalLDA/Code/BGAPP
python admin_api_simple.py
```

### **3. Depois execute no console:**
```javascript
healthCheck()
```

### **4. Para testar endpoints específicos:**
```javascript
// Testar health
fetch('http://localhost:8000/admin-api/health').then(r => r.json()).then(console.log)

// Testar collections
fetch('http://localhost:8000/admin-api/collections').then(r => r.json()).then(console.log)

// Testar conectores
fetch('http://localhost:8000/admin-api/connectors').then(r => r.json()).then(console.log)
```

### **5. Para forçar inicialização dos plugins:**
```javascript
// Se existirem mas não estiverem inicializados
window.apiResilienceManager?.initialize();
window.apiPluginManager?.initialize();
window.bgappAPIAdapter?.initialize();
```

## 📊 RESULTADOS ESPERADOS:

```
✅ http://localhost:8000/admin-api/health: HTTP 200
✅ http://localhost:8000/admin-api/collections: HTTP 200
✅ http://localhost:8000/admin-api/services/status: HTTP 200
✅ http://localhost:8000/admin-api/connectors: HTTP 200

✅ api-resilience.js
✅ api-plugin-manager.js  
✅ api-adapter.js
✅ health-checker.js

✅ window.API: object
✅ window.apiResilienceManager: object
✅ window.apiPluginManager: object
✅ window.bgappAPIAdapter: object

🟢 ADMIN API FUNCIONANDO!
```

## 🔴 SE AINDA HOUVER PROBLEMAS:

1. **Verificar se admin_api_simple.py está rodando:**
   ```bash
   ps aux | grep admin_api_simple
   ```

2. **Verificar porta 8000:**
   ```bash
   lsof -i :8000
   ```

3. **Reiniciar tudo:**
   ```bash
   pkill -f admin_api_simple
   python admin_api_simple.py
   ```

4. **Recarregar página e executar diagnóstico novamente**
