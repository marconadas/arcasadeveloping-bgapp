# 🔍 DEBUG GUIDE - realtime_angola.html

## 📋 PROBLEMAS IDENTIFICADOS E SOLUÇÕES

### **PROBLEMA PRINCIPAL: Mapa não carrega ou fica em branco**

A página `realtime_angola.html` estava com vários problemas que impediam o funcionamento correto do mapa. Aqui está a análise completa e as soluções implementadas:

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. **Dependências JavaScript Não Verificadas**
**Problema:** Scripts externos carregavam sem verificação de erro
**Sintomas:** 
- Mapa fica em branco
- Console mostra erros de "undefined"
- Funcionalidades não respondem

**Solução Implementada:**
```javascript
// Função para carregar scripts com fallback
function loadScriptSafely(src, fallback) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => {
      if (fallback) fallback();
      resolve(false);
    };
    document.head.appendChild(script);
  });
}
```

### 2. **Inicialização Sem Verificação do Leaflet**
**Problema:** Código tentava usar `L` sem verificar se estava carregado
**Sintomas:**
- Erro: "L is not defined"
- Mapa não inicializa

**Solução Implementada:**
```javascript
if (typeof L === 'undefined') {
  debugLog('ERRO: Leaflet não carregado!', 'error');
  alert('Erro: Biblioteca Leaflet não foi carregada...');
  return;
}
```

### 3. **Scripts Locais com Caminhos Incorretos**
**Problema:** Arquivos JS locais podem não existir
**Sintomas:**
- 404 errors no console
- Funcionalidades avançadas não funcionam

**Solução Implementada:**
- Carregamento assíncrono com verificação
- Fallbacks para dados básicos
- Sistema de debug para identificar scripts ausentes

### 4. **Dados JSON Não Validados**
**Problema:** Fetch de dados sem tratamento de erro adequado
**Sintomas:**
- KPIs ficam vazios
- Dados não atualizam

**Solução Implementada:**
```javascript
fetch('copernicus_authenticated_angola.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .catch(error => {
    debugLog('Erro ao carregar dados: ' + error.message, 'error');
    loadFallbackData();
  });
```

---

## 🛠️ ARQUIVOS CRIADOS PARA DEBUG

### 1. **realtime_angola_debug.html**
Versão com sistema de debug ativo:
- ✅ Painel de debug em tempo real
- ✅ Logs detalhados no console
- ✅ Fallbacks automáticos
- ✅ Verificação de todas as dependências

### 2. **test_dependencies.html**
Sistema de testes automatizados:
- ✅ Testa todas as dependências
- ✅ Valida arquivos JSON
- ✅ Verifica integração Leaflet
- ✅ Exporta relatórios detalhados

---

## 🔧 COMO USAR OS ARQUIVOS DE DEBUG

### **Passo 1: Teste Inicial**
```bash
# Abrir no navegador:
file:///[caminho]/infra/frontend/test_dependencies.html
```
**O que faz:**
- Testa todas as dependências automaticamente
- Mostra quais arquivos estão ausentes
- Identifica problemas de rede
- Gera relatório exportável

### **Passo 2: Debug Interativo**
```bash
# Abrir no navegador:
file:///[caminho]/infra/frontend/realtime_angola_debug.html
```
**O que faz:**
- Mostra logs em tempo real
- Painel de status das dependências
- Fallbacks automáticos
- Interface de debug visual

### **Passo 3: Versão Corrigida**
```bash
# Usar a versão corrigida:
file:///[caminho]/infra/frontend/realtime_angola.html
```
**Melhorias aplicadas:**
- ✅ Carregamento seguro de scripts
- ✅ Verificações de dependências
- ✅ Sistema de debug integrado
- ✅ Fallbacks para todos os dados

---

## 📊 LISTA DE VERIFICAÇÃO PARA DEBUG

### **Antes de Abrir a Página:**
- [ ] Verificar conexão com internet (para CDNs)
- [ ] Confirmar que arquivos JS existem na pasta `assets/js/`
- [ ] Validar que `copernicus_authenticated_angola.json` existe
- [ ] Abrir Console do navegador (F12)

### **Durante o Debug:**
- [ ] Verificar se Leaflet carregou (`typeof L !== 'undefined'`)
- [ ] Confirmar que tile layer básico aparece
- [ ] Observar logs de debug no console
- [ ] Testar botões de controle do mapa
- [ ] Verificar se dados KPI carregam

### **Problemas Comuns e Soluções:**

| Problema | Sintoma | Solução |
|----------|---------|---------|
| Mapa branco | Div #map vazio | Verificar se Leaflet carregou |
| Sem dados | KPIs mostram "--" | Verificar arquivo JSON |
| Sem camadas | Só mapa base | Verificar scripts JS locais |
| Erros 404 | Console mostra erros | Ajustar caminhos dos arquivos |
| Sem debug | Nenhum log aparece | Ativar `app.debug = true` |

---

## 🎯 ARQUIVOS NECESSÁRIOS PARA FUNCIONAMENTO COMPLETO

### **Obrigatórios (críticos):**
```
✅ https://unpkg.com/leaflet@1.9.4/dist/leaflet.css
✅ https://unpkg.com/leaflet@1.9.4/dist/leaflet.js
✅ https://cdn.jsdelivr.net/npm/chart.js
```

### **Opcionais (melhoram funcionalidade):**
```
⚠️ assets/js/aguas_internas.js
⚠️ assets/js/zee_angola_official.js
⚠️ assets/js/coastlines_official.js  
⚠️ assets/js/eox-layers.js
⚠️ copernicus_authenticated_angola.json
```

### **Estrutura de Pastas Esperada:**
```
infra/frontend/
├── realtime_angola.html (corrigida)
├── realtime_angola_debug.html (debug)
├── test_dependencies.html (testes)
├── copernicus_authenticated_angola.json
└── assets/
    └── js/
        ├── aguas_internas.js
        ├── zee_angola_official.js
        ├── coastlines_official.js
        └── eox-layers.js
```

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

### **Imediato (para resolver o problema atual):**
1. **Usar `realtime_angola_debug.html`** para identificar exatamente o que não está funcionando
2. **Executar `test_dependencies.html`** para validar todas as dependências
3. **Verificar console do navegador** para erros específicos

### **Médio prazo (melhorias):**
1. Implementar service worker para cache offline
2. Adicionar testes automatizados
3. Criar sistema de monitoramento de performance
4. Implementar lazy loading para scripts pesados

### **Longo prazo (otimização):**
1. Migrar para build system (webpack/vite)
2. Implementar TypeScript para type safety
3. Adicionar testes unitários
4. Criar CI/CD pipeline

---

## 📞 COMANDOS DE DEBUG ÚTEIS

### **No Console do Navegador:**
```javascript
// Verificar se Leaflet carregou
typeof L !== 'undefined'

// Ver estado da aplicação
console.log(app)

// Forçar carregamento de dados
updateRealTimeData()

// Ativar debug máximo
app.debug = true

// Verificar scripts carregados
console.log(app.scriptsLoaded)

// Testar mapa manualmente
app.map.setView([-12.5, 13.5], 6)
```

### **Para Desenvolvedores:**
```javascript
// Monitorar performance
console.time('map_load')
initializeMap()
console.timeEnd('map_load')

// Debug de memória
console.log(performance.memory)

// Listar todas as camadas
app.map.eachLayer(layer => console.log(layer))
```

---

## ✅ RESUMO DAS CORREÇÕES APLICADAS

1. **✅ Sistema de debug integrado** - Logs detalhados para identificar problemas
2. **✅ Carregamento seguro de scripts** - Fallbacks para arquivos ausentes  
3. **✅ Verificação de dependências** - Validação antes de usar bibliotecas
4. **✅ Tratamento de erros robusto** - Captura e tratamento de todos os erros
5. **✅ Dados fallback** - Sistema continua funcionando mesmo sem dados externos
6. **✅ Interface de debug** - Painel visual para monitorar status
7. **✅ Testes automatizados** - Sistema para validar todas as dependências

**Resultado esperado:** Mapa deve carregar sempre, mesmo que com funcionalidade reduzida, e fornecer informações claras sobre o que não está funcionando.
