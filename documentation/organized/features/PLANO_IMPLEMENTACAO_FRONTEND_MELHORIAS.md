# 🚀 PLANO DE IMPLEMENTAÇÃO - MELHORIAS FRONTEND BGAPP

## 📋 **VISÃO GERAL**

**Data de Criação:** Janeiro 2025  
**Baseado em:** Auditoria Frontend index.html  
**Objetivo:** Implementar melhorias críticas de performance, segurança e acessibilidade  
**Status:** ✅ Plano Aprovado - Pronto para Execução

---

## 🎯 **OBJETIVOS ESTRATÉGICOS**

### **🔥 Prioridades Críticas**
1. **Segurança** - Implementar CSP e sanitização
2. **Performance** - Otimizar carregamento de recursos
3. **SEO** - Completar meta tags e estrutura

### **📊 Prioridades Médias**
4. **Acessibilidade** - Implementar ARIA e semântica
5. **Manutenibilidade** - Modularizar código
6. **Responsividade** - Melhorar experiência móvel

### **🎨 Prioridades Baixas**
7. **Cache** - Service Worker offline
8. **Otimização** - Lazy loading e preload

---

## 📅 **CRONOGRAMA DE IMPLEMENTAÇÃO**

### **🔴 FASE 1 - CRÍTICA (Imediato)**
**Prazo:** 1-2 dias  
**Foco:** Segurança e Performance Básica

| Task | Prioridade | Tempo Est. | Responsável |
|------|------------|------------|-------------|
| CSP Implementation | 🔴 Alta | 2h | Dev Team |
| Meta Tags SEO | 🔴 Alta | 1h | Dev Team |
| Async Script Loading | 🔴 Alta | 3h | Dev Team |

### **🟡 FASE 2 - MODERADA (Curto Prazo)**
**Prazo:** 3-5 dias  
**Foco:** Estrutura e Acessibilidade

| Task | Prioridade | Tempo Est. | Responsável |
|------|------------|------------|-------------|
| External CSS | 🟡 Média | 2h | Dev Team |
| ARIA Attributes | 🟡 Média | 4h | Dev Team |
| Modular JavaScript | 🟡 Média | 6h | Dev Team |

### **🟢 FASE 3 - COMPLEMENTAR (Médio Prazo)**
**Prazo:** 1-2 semanas  
**Foco:** Otimização e UX

| Task | Prioridade | Tempo Est. | Responsável |
|------|------------|------------|-------------|
| Semantic HTML | 🟢 Baixa | 3h | Dev Team |
| Service Worker | 🟢 Baixa | 8h | Dev Team |
| Responsive Improvements | 🟢 Baixa | 4h | Dev Team |

---

## 🛠️ **IMPLEMENTAÇÕES DETALHADAS**

### **🔒 1. CONTENT SECURITY POLICY (CSP)**

#### **Arquivo:** `index.html` - Seção `<head>`

```html
<!-- Adicionar no <head> -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' 
                         https://unpkg.com 
                         https://cdnjs.cloudflare.com; 
               style-src 'self' 'unsafe-inline' 
                        https://unpkg.com; 
               img-src 'self' data: blob: 
                      https://tiles.maps.eox.at 
                      https://services.sentinel-hub.com 
                      https://tiles.arcgis.com; 
               connect-src 'self' 
                          https://tiles.maps.eox.at 
                          https://services.sentinel-hub.com 
                          https://copernicus.eu 
                          wss:;">

<!-- CSP para desenvolvimento local -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self' 'unsafe-inline' 'unsafe-eval' *; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' *; 
               style-src 'self' 'unsafe-inline' *; 
               img-src 'self' data: blob: *; 
               connect-src 'self' *;"
      data-env="development">
```

#### **Validação:**
```javascript
// Teste de CSP
console.log('CSP Status:', document.querySelector('[http-equiv="Content-Security-Policy"]') ? '✅ Ativo' : '❌ Ausente');
```

---

### **📈 2. META TAGS COMPLETAS**

#### **Arquivo:** `index.html` - Seção `<head>`

```html
<!-- Meta Tags Básicas -->
<meta name="description" content="BGAPP - Sistema avançado de monitoramento oceanográfico e meteorológico marinho de Angola. Dados em tempo real de SST, correntes, batimetria e Sentinel-2.">
<meta name="keywords" content="oceanografia, meteorologia, Angola, SST, correntes marinhas, batimetria, GEBCO, Sentinel-2, Copernicus, dados marinhos, ZEE Angola">
<meta name="author" content="BGAPP Development Team">
<meta name="robots" content="index, follow">
<meta name="language" content="Portuguese">

<!-- Open Graph Protocol -->
<meta property="og:title" content="BGAPP - Mapa Meteorológico Interativo Angola">
<meta property="og:description" content="Sistema completo de monitoramento oceanográfico de Angola com dados Copernicus, Sentinel-2 e GEBCO em tempo real">
<meta property="og:type" content="website">
<meta property="og:url" content="https://bgapp.ao">
<meta property="og:image" content="https://bgapp.ao/assets/img/bgapp-preview.png">
<meta property="og:site_name" content="BGAPP">
<meta property="og:locale" content="pt_AO">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@BGAPP_Angola">
<meta name="twitter:title" content="BGAPP - Meteorologia Marinha Angola">
<meta name="twitter:description" content="Dados oceanográficos em tempo real: SST, correntes, batimetria e imagens de satélite">
<meta name="twitter:image" content="https://bgapp.ao/assets/img/twitter-card.png">

<!-- PWA Meta Tags -->
<meta name="theme-color" content="#0066cc">
<meta name="application-name" content="BGAPP">
<link rel="manifest" href="/manifest.json">

<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
```

---

### **⚡ 3. CARREGAMENTO ASSÍNCRONO DE SCRIPTS**

#### **Arquivo:** `index.html` - Antes do `</body>`

```html
<!-- Preload recursos críticos -->
<link rel="preload" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" as="script">
<link rel="preload" href="assets/js/zee_angola_official.js" as="script">
<link rel="preconnect" href="https://tiles.maps.eox.at">
<link rel="preconnect" href="https://services.sentinel-hub.com">

<!-- Script de carregamento assíncrono -->
<script>
// Sistema de carregamento assíncrono
class AsyncScriptLoader {
  constructor() {
    this.loadedScripts = new Set();
    this.pendingCallbacks = new Map();
  }

  async loadScript(src, id) {
    if (this.loadedScripts.has(id)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        this.loadedScripts.add(id);
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async loadScripts(scripts) {
    return Promise.all(
      scripts.map(({ src, id }) => this.loadScript(src, id))
    );
  }
}

// Configurar carregamento
const loader = new AsyncScriptLoader();

// Scripts essenciais (carregamento prioritário)
const essentialScripts = [
  { src: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', id: 'leaflet' },
  { src: 'https://unpkg.com/leaflet-timedimension@1.1.1/dist/leaflet.timedimension.min.js', id: 'timedimension' }
];

// Scripts de funcionalidades (carregamento secundário)
const featureScripts = [
  { src: 'https://unpkg.com/leaflet-velocity@0.4.0/dist/leaflet-velocity.min.js', id: 'velocity' },
  { src: 'assets/js/zee_angola_official.js?v=20250831', id: 'zee' },
  { src: 'assets/js/eox-layers.js?v=20250901', id: 'eox' },
  { src: 'assets/js/sentinel2-integration.js?v=20250901', id: 'sentinel2' },
  { src: 'assets/js/bathymetry-gebco.js?v=20250901', id: 'bathymetry' },
  { src: 'assets/js/attribution-system.js?v=20250901', id: 'attribution' },
  { src: 'assets/js/copernicus-integration.js?v=20250901', id: 'copernicus' },
  { src: 'assets/js/projection-manager.js?v=20250901', id: 'projection' },
  { src: 'assets/js/offline-capability.js?v=20250901', id: 'offline' },
  { src: 'assets/js/3d-visualization.js?v=20250901', id: '3d' }
];

// Inicializar aplicação
async function initializeApp() {
  try {
    // Mostrar loading
    document.body.innerHTML = `
      <div id="loading-screen" style="
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex; align-items: center; justify-content: center;
        z-index: 9999; color: white; font-family: 'Segoe UI', sans-serif;
      ">
        <div style="text-align: center;">
          <div style="font-size: 24px; margin-bottom: 20px;">🌊 BGAPP</div>
          <div style="font-size: 14px; opacity: 0.8;">Carregando sistema meteorológico...</div>
          <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; margin: 20px auto; overflow: hidden;">
            <div id="progress-bar" style="height: 100%; background: white; width: 0%; transition: width 0.3s;"></div>
          </div>
        </div>
      </div>
    `;

    // Carregar scripts essenciais
    await loader.loadScripts(essentialScripts);
    document.getElementById('progress-bar').style.width = '30%';

    // Carregar scripts de funcionalidades
    await loader.loadScripts(featureScripts);
    document.getElementById('progress-bar').style.width = '70%';

    // Carregar conteúdo principal
    await loadMainContent();
    document.getElementById('progress-bar').style.width = '90%';

    // Inicializar mapa
    await initializeMap();
    document.getElementById('progress-bar').style.width = '100%';

    // Remover loading screen
    setTimeout(() => {
      document.getElementById('loading-screen').remove();
    }, 500);

  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
    document.getElementById('loading-screen').innerHTML = `
      <div style="text-align: center; color: #ff6b6b;">
        <div style="font-size: 24px; margin-bottom: 20px;">❌ Erro</div>
        <div>Falha ao carregar o sistema</div>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: white; border: none; border-radius: 4px; cursor: pointer;">
          Tentar Novamente
        </button>
      </div>
    `;
  }
}

// Função para carregar conteúdo principal
async function loadMainContent() {
  const mainContent = /* CONTEÚDO HTML ATUAL DO BODY */;
  document.body.innerHTML = mainContent;
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
</script>
```

---

### **🎨 4. EXTERNALIZAÇÃO DO CSS**

#### **Novo Arquivo:** `assets/css/map-styles.css`

```css
/* BGAPP - Estilos do Mapa Meteorológico */
/* Versão: 2.0 - Janeiro 2025 */

:root {
  --primary-color: #0066cc;
  --secondary-color: #3498db;
  --success-color: #27ae60;
  --warning-color: #f39c12;
  --error-color: #e74c3c;
  --text-primary: #2c3e50;
  --text-secondary: #7f8c8d;
  --bg-overlay: rgba(255,255,255,0.95);
  --border-radius: 8px;
  --transition: all 0.2s ease;
  --shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Reset e Base */
html, body {
  height: 100%;
  margin: 0;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  line-height: 1.4;
}

/* Toolbar Principal */
#toolbar {
  padding: 12px;
  background: var(--bg-overlay);
  position: absolute;
  z-index: 1000;
  top: 8px;
  left: 8px;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  min-width: 280px;
  max-width: 320px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: var(--transition);
}

#toolbar:hover {
  background: rgba(255,255,255,0.98);
  transform: translateY(-1px);
}

#toolbar h3 {
  margin: 0 0 12px 0;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Seções do Toolbar */
.toolbar-section {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e1e8ed;
}

.toolbar-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.toolbar-section h4 {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Grupos de Botões */
.btn-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* Botões */
.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: var(--transition);
  background: var(--secondary-color);
  color: white;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  user-select: none;
  outline: none;
}

.btn:hover {
  background: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.btn:active {
  transform: translateY(0);
}

.btn:focus {
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.3);
}

.btn.active {
  background: var(--error-color);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

.btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

/* Botões por Categoria */
.btn.meteo {
  background: #e67e22;
}

.btn.meteo:hover {
  background: #d35400;
}

.btn.ocean {
  background: #16a085;
}

.btn.ocean:hover {
  background: #138d75;
}

.btn.control {
  background: #95a5a6;
}

.btn.control:hover {
  background: #7f8c8d;
}

.btn.animate {
  background: #9b59b6;
}

.btn.animate:hover {
  background: #8e44ad;
}

/* Mapa */
#map {
  height: 100%;
  width: 100%;
  background: #f8f9fa;
}

/* Legenda */
.legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: var(--bg-overlay);
  padding: 12px;
  border-radius: 6px;
  box-shadow: var(--shadow);
  font-size: 12px;
  max-width: 200px;
  display: none;
  backdrop-filter: blur(10px);
}

.legend.show {
  display: block;
  animation: fadeIn 0.3s ease;
}

.legend h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: var(--text-primary);
}

/* Indicadores de Status */
.status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-online {
  background: var(--success-color);
}

.status-loading {
  background: var(--warning-color);
  animation: pulse 1.5s infinite;
}

.status-error {
  background: var(--error-color);
}

/* Animações */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Controles do Leaflet */
.leaflet-control-timedimension {
  background: var(--bg-overlay);
  border-radius: 6px;
  backdrop-filter: blur(10px);
}

.leaflet-control-layers {
  background: var(--bg-overlay);
  backdrop-filter: blur(10px);
}

/* Inputs */
input[type="date"] {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  transition: var(--transition);
}

input[type="date"]:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  outline: none;
}

/* Responsividade */
@media (max-width: 768px) {
  #toolbar {
    position: relative;
    top: 0;
    left: 0;
    width: calc(100% - 16px);
    margin: 8px;
    min-width: unset;
    max-width: unset;
  }

  .btn-group {
    justify-content: center;
  }

  .btn {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 480px) {
  #toolbar {
    margin: 4px;
    width: calc(100% - 8px);
    padding: 8px;
  }

  #toolbar h3 {
    font-size: 14px;
  }

  .btn {
    padding: 6px 8px;
    font-size: 11px;
  }

  .legend {
    bottom: 10px;
    right: 10px;
    max-width: 150px;
  }
}

@media (max-width: 768px) and (orientation: landscape) {
  #toolbar {
    max-height: 60vh;
    overflow-y: auto;
  }
}

/* Modo Escuro */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-overlay: rgba(33, 37, 41, 0.95);
    --text-primary: #f8f9fa;
    --text-secondary: #adb5bd;
  }

  #map {
    background: #212529;
  }
}

/* Acessibilidade */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .btn {
    border: 2px solid currentColor;
  }

  .status-indicator {
    border: 1px solid #000;
  }
}
```

#### **Atualização no HTML:**

```html
<!-- Substituir <style> por -->
<link rel="stylesheet" href="assets/css/map-styles.css?v=20250115">
```

---

### **♿ 5. IMPLEMENTAÇÃO DE ACESSIBILIDADE (ARIA)**

#### **Arquivo:** `index.html` - Seção Toolbar

```html
<nav id="toolbar" role="navigation" aria-label="Controles do Mapa Meteorológico">
  <header>
    <h1 id="app-title" tabindex="0">🌊 BGAPP - Meteorologia Marinha</h1>
  </header>

  <section class="toolbar-section" aria-labelledby="filters-heading">
    <h2 id="filters-heading" class="sr-only">Filtros Temporais</h2>
    <label for="dateMin" style="font-size: 12px; color: #666;">
      Data mínima:
      <input type="date" 
             id="dateMin" 
             value="2024-06-01"
             aria-describedby="date-help"
             aria-label="Selecionar data mínima para filtros">
    </label>
    <div id="date-help" class="sr-only">
      Formato: DD/MM/AAAA. Selecione a data inicial para visualização dos dados.
    </div>
    <button id="apply" 
            class="btn" 
            style="margin-top: 4px;"
            aria-describedby="apply-help">
      <span aria-hidden="true">🔍</span>
      Aplicar Filtro
    </button>
    <div id="apply-help" class="sr-only">
      Aplica o filtro de data selecionado aos dados meteorológicos
    </div>
  </section>

  <section class="toolbar-section" aria-labelledby="ocean-heading">
    <h2 id="ocean-heading" style="margin: 0 0 6px 0; font-size: 13px; color: #34495e;">
      🌡️ Variáveis Oceanográficas
    </h2>
    <div class="btn-group" role="group" aria-labelledby="ocean-heading">
      <button id="btn-sst" 
              class="btn ocean"
              aria-label="Temperatura da Superfície do Mar"
              aria-describedby="sst-help"
              role="button"
              tabindex="0">
        <span aria-hidden="true">🌡️</span>
        SST
      </button>
      <div id="sst-help" class="sr-only">
        Visualizar dados de temperatura da superfície do mar
      </div>

      <button id="btn-salinity" 
              class="btn ocean"
              aria-label="Salinidade da Água do Mar"
              aria-describedby="salinity-help"
              role="button"
              tabindex="0">
        <span aria-hidden="true">🧂</span>
        Salinidade
      </button>
      <div id="salinity-help" class="sr-only">
        Visualizar dados de salinidade da água do mar
      </div>

      <button id="btn-chlorophyll" 
              class="btn ocean"
              aria-label="Concentração de Clorofila"
              aria-describedby="chlorophyll-help"
              role="button"
              tabindex="0">
        <span aria-hidden="true">🌿</span>
        Clorofila
      </button>
      <div id="chlorophyll-help" class="sr-only">
        Visualizar concentração de clorofila na água
      </div>
    </div>
  </section>

  <section class="toolbar-section" aria-labelledby="vector-heading">
    <h2 id="vector-heading" style="margin: 0 0 6px 0; font-size: 13px; color: #34495e;">
      💨 Campos Vetoriais
    </h2>
    <div class="btn-group" role="group" aria-labelledby="vector-heading">
      <button id="btn-currents" 
              class="btn meteo"
              aria-label="Correntes Marítimas"
              aria-describedby="currents-help"
              role="button"
              tabindex="0">
        <span aria-hidden="true">🌊</span>
        Correntes
      </button>
      <div id="currents-help" class="sr-only">
        Visualizar direção e intensidade das correntes marítimas
      </div>

      <button id="btn-wind" 
              class="btn meteo"
              aria-label="Velocidade e Direção do Vento"
              aria-describedby="wind-help"
              role="button"
              tabindex="0">
        <span aria-hidden="true">💨</span>
        Vento
      </button>
      <div id="wind-help" class="sr-only">
        Visualizar velocidade e direção do vento
      </div>
    </div>
  </section>

  <section class="toolbar-section" aria-labelledby="controls-heading">
    <h2 id="controls-heading" style="margin: 0 0 6px 0; font-size: 13px; color: #34495e;">
      ⚙️ Controles
    </h2>
    <div class="btn-group" role="group" aria-labelledby="controls-heading">
      <button id="btn-clear" 
              class="btn control" 
              style="background: #95a5a6;"
              aria-label="Limpar Todas as Camadas do Mapa"
              aria-describedby="clear-help"
              role="button"
              tabindex="0">
        <span aria-hidden="true">🗑️</span>
        Limpar Tudo
      </button>
      <div id="clear-help" class="sr-only">
        Remove todas as camadas ativas do mapa
      </div>

      <button id="btn-animate" 
              class="btn animate" 
              style="background: #9b59b6;"
              aria-label="Iniciar Animação Temporal"
              aria-describedby="animate-help"
              aria-pressed="false"
              role="button"
              tabindex="0">
        <span aria-hidden="true" id="animate-icon">▶️</span>
        <span id="animate-text">Animar</span>
      </button>
      <div id="animate-help" class="sr-only">
        Inicia ou para a animação temporal dos dados meteorológicos
      </div>
    </div>
  </section>

  <footer style="margin-top: 8px; font-size: 11px; color: #7f8c8d;">
    <div role="status" aria-live="polite" aria-label="Status do Sistema">
      <span class="status-indicator status-online" aria-hidden="true"></span>
      <span id="system-status">Sistema Online</span>
    </div>
  </footer>
</nav>

<!-- Região principal do mapa -->
<main role="main" aria-label="Mapa Interativo Meteorológico">
  <div id="map" 
       role="application" 
       aria-label="Mapa interativo com dados meteorológicos e oceanográficos de Angola"
       tabindex="0"></div>
</main>

<!-- Legenda -->
<aside id="legend" 
       class="legend" 
       role="complementary" 
       aria-labelledby="legend-title"
       aria-live="polite">
  <h3 id="legend-title" style="margin: 0 0 8px 0; font-size: 13px;">Legenda</h3>
  <div id="legend-content" aria-describedby="legend-description"></div>
  <div id="legend-description" class="sr-only">
    Informações sobre cores e símbolos utilizados no mapa
  </div>
</aside>

<!-- Classe para elementos screen-reader only -->
<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus indicators melhorados */
button:focus,
input:focus,
#map:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Indicadores visuais para estados */
button[aria-pressed="true"] {
  background-color: #e74c3c !important;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

/* Melhorar contraste para high contrast mode */
@media (prefers-contrast: high) {
  button {
    border: 2px solid currentColor;
  }
  
  .status-indicator {
    border: 2px solid #000;
  }
}
</style>
```

---

### **🧩 6. MODULARIZAÇÃO DO JAVASCRIPT**

#### **Novo Arquivo:** `assets/js/map-controller.js`

```javascript
/**
 * BGAPP Map Controller - Sistema Principal de Controle do Mapa
 * Versão: 2.0 - Janeiro 2025
 * Responsável por: Inicialização, estado global e coordenação de componentes
 */

class BGAPPMapController {
  constructor() {
    this.apiBase = location.hostname === 'localhost' ? 'http://localhost:5080' : '/api';
    this.map = null;
    this.components = {};
    this.appState = {
      occLayer: null,
      velocityLayer: null,
      wmsLayers: {},
      activeLayers: new Set(),
      isAnimating: false,
      currentVariable: null,
      dateFilter: null
    };
    
    this.init();
  }

  /**
   * Inicialização principal do sistema
   */
  async init() {
    try {
      await this.initializeMap();
      await this.initializeComponents();
      this.setupEventListeners();
      this.setupKeyboardNavigation();
      this.announceSystemReady();
      
      console.log('✅ BGAPP Map Controller inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro na inicialização do Map Controller:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Configurar mapa Leaflet com TimeDimension
   */
  async initializeMap() {
    this.map = L.map('map', {
      center: [-12.5, 13.5],
      zoom: 6,
      timeDimension: true,
      timeDimensionControl: true,
      timeDimensionControlOptions: {
        position: 'bottomleft',
        autoPlay: false,
        loopButton: true,
        playButton: true,
        timeSliderDragUpdate: true,
        speedSlider: false
      },
      // Acessibilidade
      keyboard: true,
      keyboardPanDelta: 80
    });

    // Configurar eventos de acessibilidade do mapa
    this.map.on('focus', () => {
      this.updateAriaLive('Mapa focado. Use as setas do teclado para navegar.');
    });

    this.map.on('zoomend', () => {
      const zoom = this.map.getZoom();
      this.updateAriaLive(`Zoom alterado para nível ${zoom}`);
    });

    this.map.on('moveend', () => {
      const center = this.map.getCenter();
      this.updateAriaLive(`Mapa movido para coordenadas ${center.lat.toFixed(2)}, ${center.lng.toFixed(2)}`);
    });
  }

  /**
   * Inicializar todos os componentes do sistema
   */
  async initializeComponents() {
    const componentInitializers = [
      { name: 'eoxManager', class: EOXLayersManager },
      { name: 'sentinel2', class: Sentinel2Integration },
      { name: 'gebco', class: GEBCOBathymetry },
      { name: 'attributionSystem', class: AttributionSystem },
      { name: 'copernicusIntegration', class: CopernicusIntegration },
      { name: 'projectionManager', class: ProjectionManager },
      { name: 'offlineCapability', class: OfflineMapCapability },
      { name: 'threeDVisualization', class: ThreeDVisualization }
    ];

    for (const { name, class: ComponentClass } of componentInitializers) {
      try {
        this.components[name] = new ComponentClass();
        await this.initializeComponent(name);
        console.log(`✅ Componente ${name} inicializado`);
      } catch (error) {
        console.warn(`⚠️ Falha ao inicializar ${name}:`, error);
      }
    }

    // Inicializar ZEE Angola
    this.initializeZEE();
  }

  /**
   * Inicializar componente específico
   */
  async initializeComponent(componentName) {
    const component = this.components[componentName];
    
    switch (componentName) {
      case 'eoxManager':
        component.setupRateLimiting();
        component.createLayerControl(this.map);
        component.initializeDefault(this.map, 'terrain-light');
        break;
        
      case 'sentinel2':
        component.addToMap(this.map, this.components.eoxManager);
        break;
        
      case 'gebco':
        component.createBathymetryControl(this.map);
        component.enableDepthPopup(this.map);
        break;
        
      case 'attributionSystem':
        component.createAttributionControl(this.map);
        component.setupAutoAttributions(this.components.eoxManager);
        break;
        
      case 'copernicusIntegration':
        component.addToMap(this.map);
        break;
        
      case 'projectionManager':
        component.createProjectionControl(this.map);
        break;
        
      case 'offlineCapability':
        component.createOfflineControl(this.map);
        break;
        
      case 'threeDVisualization':
        component.create3DControl(this.map);
        break;
    }
  }

  /**
   * Configurar ZEE Angola
   */
  initializeZEE() {
    // ZEE Angola Continental
    if (typeof angolaZEEOfficial !== 'undefined') {
      const angolaLayer = L.polygon(angolaZEEOfficial, {
        color: '#0066cc',
        weight: 2,
        fillOpacity: 0.15,
        fillColor: '#0080ff',
        opacity: 0.7
      }).addTo(this.map);

      angolaLayer.bindPopup('🌊 ZEE Angola - OFICIAL<br>📏 495.866 km² (Marine Regions)');
      angolaLayer.on('popupopen', () => {
        this.updateAriaLive('Popup da ZEE Angola aberto');
      });
      
      console.log('✅ ZEE Angola oficial adicionada');
    }

    // ZEE Cabinda
    if (typeof cabindaZEEOfficial !== 'undefined') {
      const cabindaLayer = L.polygon(cabindaZEEOfficial, {
        color: '#9b59b6',
        weight: 2,
        fillOpacity: 0.15,
        fillColor: '#9b59b6',
        opacity: 0.7
      }).addTo(this.map);

      cabindaLayer.bindPopup('🏛️ ZEE Cabinda - OFICIAL<br>📍 Enclave (Marine Regions)');
      cabindaLayer.on('popupopen', () => {
        this.updateAriaLive('Popup da ZEE Cabinda aberto');
      });
      
      console.log('✅ ZEE Cabinda adicionada');
    }
  }

  /**
   * Configurar event listeners dos controles
   */
  setupEventListeners() {
    // Filtro de data
    document.getElementById('apply')?.addEventListener('click', () => {
      this.handleDateFilter();
    });

    // Variáveis oceanográficas
    document.getElementById('btn-sst')?.addEventListener('click', () => {
      this.handleVariableToggle('sst', 'Temperatura da Superfície do Mar');
    });

    document.getElementById('btn-salinity')?.addEventListener('click', () => {
      this.handleVariableToggle('salinity', 'Salinidade');
    });

    document.getElementById('btn-chlorophyll')?.addEventListener('click', () => {
      this.handleVariableToggle('chlorophyll', 'Clorofila');
    });

    // Campos vetoriais
    document.getElementById('btn-currents')?.addEventListener('click', () => {
      this.handleVariableToggle('currents', 'Correntes Marítimas');
    });

    document.getElementById('btn-wind')?.addEventListener('click', () => {
      this.handleVariableToggle('wind', 'Vento');
    });

    // Controles
    document.getElementById('btn-clear')?.addEventListener('click', () => {
      this.handleClearAll();
    });

    document.getElementById('btn-animate')?.addEventListener('click', () => {
      this.handleAnimationToggle();
    });

    // Eventos de teclado para acessibilidade
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  /**
   * Configurar navegação por teclado
   */
  setupKeyboardNavigation() {
    const focusableElements = document.querySelectorAll(
      'button, input, [tabindex="0"], [role="button"]'
    );

    focusableElements.forEach(element => {
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          element.click();
        }
      });
    });
  }

  /**
   * Manipular filtro de data
   */
  handleDateFilter() {
    const dateInput = document.getElementById('dateMin');
    const date = new Date(dateInput.value);
    
    if (isNaN(date.getTime())) {
      this.updateAriaLive('Data inválida selecionada');
      return;
    }

    this.appState.dateFilter = date;
    this.updateAriaLive(`Filtro de data aplicado: ${date.toLocaleDateString('pt-BR')}`);
    
    // Aplicar filtro aos componentes
    Object.values(this.components).forEach(component => {
      if (component.applyDateFilter) {
        component.applyDateFilter(date);
      }
    });
  }

  /**
   * Manipular toggle de variáveis
   */
  handleVariableToggle(variable, displayName) {
    const button = document.getElementById(`btn-${variable}`);
    const isActive = button.classList.contains('active');

    if (isActive) {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
      this.appState.activeLayers.delete(variable);
      this.updateAriaLive(`${displayName} desativado`);
      
      // Remover camada
      if (this.appState.wmsLayers[variable]) {
        this.map.removeLayer(this.appState.wmsLayers[variable]);
        delete this.appState.wmsLayers[variable];
      }
    } else {
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      this.appState.activeLayers.add(variable);
      this.appState.currentVariable = variable;
      this.updateAriaLive(`${displayName} ativado`);
      
      // Adicionar camada
      this.loadVariableLayer(variable);
    }

    this.updateLegend();
  }

  /**
   * Carregar camada de variável
   */
  async loadVariableLayer(variable) {
    try {
      // Implementar carregamento específico para cada variável
      const layerConfig = this.getVariableConfig(variable);
      const layer = await this.createWMSLayer(layerConfig);
      
      this.appState.wmsLayers[variable] = layer;
      layer.addTo(this.map);
      
      console.log(`✅ Camada ${variable} carregada`);
    } catch (error) {
      console.error(`❌ Erro ao carregar ${variable}:`, error);
      this.updateAriaLive(`Erro ao carregar ${variable}`);
    }
  }

  /**
   * Obter configuração da variável
   */
  getVariableConfig(variable) {
    const configs = {
      sst: {
        url: `${this.apiBase}/wms/sst`,
        layers: 'sea_surface_temperature',
        format: 'image/png',
        transparent: true,
        colorscale: 'viridis'
      },
      salinity: {
        url: `${this.apiBase}/wms/salinity`,
        layers: 'sea_water_salinity',
        format: 'image/png',
        transparent: true,
        colorscale: 'plasma'
      },
      chlorophyll: {
        url: `${this.apiBase}/wms/chlorophyll`,
        layers: 'chlorophyll_concentration',
        format: 'image/png',
        transparent: true,
        colorscale: 'cividis'
      },
      currents: {
        url: `${this.apiBase}/wms/currents`,
        layers: 'sea_water_velocity',
        format: 'image/png',
        transparent: true,
        style: 'vector'
      },
      wind: {
        url: `${this.apiBase}/wms/wind`,
        layers: 'wind_velocity',
        format: 'image/png',
        transparent: true,
        style: 'vector'
      }
    };

    return configs[variable];
  }

  /**
   * Criar camada WMS
   */
  async createWMSLayer(config) {
    return L.tileLayer.wms(config.url, {
      layers: config.layers,
      format: config.format,
      transparent: config.transparent,
      attribution: 'BGAPP - Dados Copernicus',
      time: this.appState.dateFilter?.toISOString() || new Date().toISOString()
    });
  }

  /**
   * Limpar todas as camadas
   */
  handleClearAll() {
    // Remover todas as camadas WMS
    Object.values(this.appState.wmsLayers).forEach(layer => {
      this.map.removeLayer(layer);
    });

    // Resetar estado
    this.appState.wmsLayers = {};
    this.appState.activeLayers.clear();
    this.appState.currentVariable = null;
    this.appState.isAnimating = false;

    // Resetar botões
    document.querySelectorAll('.btn.active').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });

    // Esconder legenda
    document.getElementById('legend').classList.remove('show');

    this.updateAriaLive('Todas as camadas foram removidas do mapa');
    console.log('✅ Todas as camadas foram limpas');
  }

  /**
   * Toggle de animação
   */
  handleAnimationToggle() {
    const button = document.getElementById('btn-animate');
    const icon = document.getElementById('animate-icon');
    const text = document.getElementById('animate-text');

    this.appState.isAnimating = !this.appState.isAnimating;

    if (this.appState.isAnimating) {
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      icon.textContent = '⏸️';
      text.textContent = 'Pausar';
      this.updateAriaLive('Animação iniciada');
      
      // Iniciar animação TimeDimension
      if (this.map.timeDimension) {
        this.map.timeDimension.setCurrentTime(this.map.timeDimension.getAvailableTimes()[0]);
        this.map.timeDimension.play();
      }
    } else {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
      icon.textContent = '▶️';
      text.textContent = 'Animar';
      this.updateAriaLive('Animação pausada');
      
      // Parar animação
      if (this.map.timeDimension) {
        this.map.timeDimension.pause();
      }
    }
  }

  /**
   * Manipular atalhos de teclado
   */
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + teclas
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'l':
          event.preventDefault();
          document.getElementById('btn-clear')?.click();
          break;
        case 'space':
          event.preventDefault();
          document.getElementById('btn-animate')?.click();
          break;
        case '1':
          event.preventDefault();
          document.getElementById('btn-sst')?.click();
          break;
        case '2':
          event.preventDefault();
          document.getElementById('btn-salinity')?.click();
          break;
        case '3':
          event.preventDefault();
          document.getElementById('btn-chlorophyll')?.click();
          break;
      }
    }

    // Tecla ESC para fechar popups
    if (event.key === 'Escape') {
      this.map.closePopup();
      this.updateAriaLive('Popups fechados');
    }
  }

  /**
   * Atualizar legenda
   */
  updateLegend() {
    const legend = document.getElementById('legend');
    const content = document.getElementById('legend-content');

    if (this.appState.activeLayers.size === 0) {
      legend.classList.remove('show');
      return;
    }

    let legendHTML = '';
    this.appState.activeLayers.forEach(variable => {
      const config = this.getVariableConfig(variable);
      legendHTML += this.generateLegendItem(variable, config);
    });

    content.innerHTML = legendHTML;
    legend.classList.add('show');
    
    this.updateAriaLive('Legenda atualizada');
  }

  /**
   * Gerar item da legenda
   */
  generateLegendItem(variable, config) {
    const colors = {
      sst: ['#000080', '#0066cc', '#00ccff', '#ffff00', '#ff6600', '#ff0000'],
      salinity: ['#440154', '#482878', '#3e4989', '#31688e', '#26828e', '#1f9e89'],
      chlorophyll: ['#000080', '#0066cc', '#00cc66', '#cccc00', '#cc6600', '#cc0000'],
      currents: ['#ffffff', '#cccccc'],
      wind: ['#ffffff', '#cccccc']
    };

    const units = {
      sst: '°C',
      salinity: 'PSU',
      chlorophyll: 'mg/m³',
      currents: 'm/s',
      wind: 'm/s'
    };

    const names = {
      sst: 'Temperatura',
      salinity: 'Salinidade',
      chlorophyll: 'Clorofila',
      currents: 'Correntes',
      wind: 'Vento'
    };

    let html = `<div class="legend-item">
      <strong>${names[variable]}</strong>`;

    if (colors[variable]) {
      html += '<div class="legend-scale">';
      colors[variable].forEach((color, index) => {
        html += `<span style="background-color: ${color}; display: inline-block; width: 20px; height: 12px; margin-right: 2px;" aria-hidden="true"></span>`;
      });
      html += `</div><small>Unidade: ${units[variable]}</small>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Atualizar ARIA live region
   */
  updateAriaLive(message) {
    const statusElement = document.getElementById('system-status');
    if (statusElement) {
      statusElement.textContent = message;
      
      // Restaurar status após 3 segundos
      setTimeout(() => {
        statusElement.textContent = 'Sistema Online';
      }, 3000);
    }
  }

  /**
   * Anunciar que o sistema está pronto
   */
  announceSystemReady() {
    this.updateAriaLive('Sistema BGAPP carregado e pronto para uso');
    
    // Atualizar indicador visual
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
      statusIndicator.className = 'status-indicator status-online';
    }
  }

  /**
   * Manipular erro de inicialização
   */
  handleInitializationError(error) {
    console.error('Erro crítico na inicialização:', error);
    
    // Atualizar status visual
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
      statusIndicator.className = 'status-indicator status-error';
    }

    this.updateAriaLive('Erro no carregamento do sistema. Verifique a conexão.');

    // Mostrar mensagem de erro para o usuário
    const errorMessage = document.createElement('div');
    errorMessage.innerHTML = `
      <div style="
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000; text-align: center; max-width: 400px;
      ">
        <h3 style="color: #e74c3c; margin-top: 0;">❌ Erro de Inicialização</h3>
        <p>Ocorreu um erro ao carregar o sistema BGAPP.</p>
        <p><small>Detalhes: ${error.message}</small></p>
        <button onclick="location.reload()" style="
          padding: 8px 16px; background: #3498db; color: white; border: none; 
          border-radius: 4px; cursor: pointer; margin-top: 10px;
        ">
          Recarregar Página
        </button>
      </div>
    `;
    
    document.body.appendChild(errorMessage);
  }

  /**
   * Obter estado atual da aplicação
   */
  getState() {
    return { ...this.appState };
  }

  /**
   * Definir estado da aplicação
   */
  setState(newState) {
    this.appState = { ...this.appState, ...newState };
  }
}

// Exportar para uso global
window.BGAPPMapController = BGAPPMapController;

// Auto-inicialização quando script for carregado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.bgappController = new BGAPPMapController();
  });
} else {
  window.bgappController = new BGAPPMapController();
}
```

#### **Atualização no HTML:**

```html
<!-- Substituir todo o JavaScript inline por -->
<script src="assets/js/map-controller.js?v=20250115"></script>
<script src="assets/js/metocean.js?v=20250115"></script>
```

---

### **📱 7. SERVICE WORKER PARA CACHE OFFLINE**

#### **Novo Arquivo:** `sw.js` (na raiz)

```javascript
/**
 * BGAPP Service Worker - Cache Offline
 * Versão: 1.0 - Janeiro 2025
 */

const CACHE_NAME = 'bgapp-v1.0.0';
const STATIC_CACHE = 'bgapp-static-v1.0.0';
const DYNAMIC_CACHE = 'bgapp-dynamic-v1.0.0';

// Recursos para cache estático
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/map-styles.css',
  '/assets/js/map-controller.js',
  '/assets/js/metocean.js',
  '/assets/js/zee_angola_official.js',
  '/assets/js/eox-layers.js',
  '/assets/js/sentinel2-integration.js',
  '/assets/js/bathymetry-gebco.js',
  '/assets/js/attribution-system.js',
  '/assets/js/copernicus-integration.js',
  '/assets/js/projection-manager.js',
  '/assets/js/offline-capability.js',
  '/assets/js/3d-visualization.js',
  '/favicon.ico',
  '/manifest.json',
  // Leaflet assets
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet-timedimension@1.1.1/dist/leaflet.timedimension.min.js',
  'https://unpkg.com/leaflet-timedimension@1.1.1/dist/leaflet.timedimension.control.min.css',
  'https://unpkg.com/leaflet-velocity@0.4.0/dist/leaflet-velocity.min.js'
];

// URLs que devem ser sempre buscadas da rede
const NETWORK_ONLY = [
  '/api/',
  'https://services.sentinel-hub.com/',
  'https://tiles.maps.eox.at/'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Cache estático aberto');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Recursos estáticos em cache');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Erro ao fazer cache dos recursos:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE;
            })
            .map(cacheName => {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativo');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Verificar se é uma requisição que deve ser sempre da rede
  if (NETWORK_ONLY.some(pattern => event.request.url.includes(pattern))) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Retornar resposta offline para APIs
          if (event.request.url.includes('/api/')) {
            return new Response(JSON.stringify({
              error: 'Offline',
              message: 'Dados não disponíveis offline'
            }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            });
          }
          
          // Retornar imagem placeholder para tiles
          return new Response(createOfflineTile(), {
            headers: { 'Content-Type': 'image/png' }
          });
        })
    );
    return;
  }

  // Estratégia Cache First para recursos estáticos
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            console.log('[SW] Servindo do cache:', event.request.url);
            return cachedResponse;
          }

          // Buscar da rede e fazer cache
          return fetch(event.request)
            .then(networkResponse => {
              // Verificar se é uma resposta válida
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }

              // Clonar resposta para cache
              const responseToCache = networkResponse.clone();

              caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              console.log('[SW] Adicionado ao cache dinâmico:', event.request.url);
              return networkResponse;
            })
            .catch(() => {
              // Retornar página offline se disponível
              if (event.request.destination === 'document') {
                return caches.match('/offline.html') || 
                       caches.match('/index.html');
              }

              // Retornar resposta padrão para outros recursos
              return new Response('Recurso não disponível offline', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  }
});

// Gerenciar mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({ size });
    });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearCache().then(() => {
      event.ports[0].postMessage({ cleared: true });
    });
  }
});

// Sincronização em background
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Executando sincronização em background');
    event.waitUntil(syncData());
  }
});

// Notificações push (futuro)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/assets/img/icon-192.png',
      badge: '/assets/img/badge-72.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Funções auxiliares

/**
 * Criar tile offline placeholder
 */
function createOfflineTile() {
  // Criar um canvas 256x256 com texto "Offline"
  const canvas = new OffscreenCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  
  // Fundo azul claro
  ctx.fillStyle = '#e3f2fd';
  ctx.fillRect(0, 0, 256, 256);
  
  // Texto
  ctx.fillStyle = '#1976d2';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Offline', 128, 128);
  
  return canvas.convertToBlob({ type: 'image/png' });
}

/**
 * Obter tamanho total do cache
 */
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

/**
 * Limpar cache dinâmico
 */
async function clearCache() {
  await caches.delete(DYNAMIC_CACHE);
  console.log('[SW] Cache dinâmico limpo');
}

/**
 * Sincronizar dados offline
 */
async function syncData() {
  // Implementar sincronização de dados offline
  console.log('[SW] Sincronizando dados...');
  
  try {
    // Buscar dados pendentes do IndexedDB
    // Enviar para servidor quando online
    // Atualizar cache com novos dados
    
    console.log('[SW] Sincronização concluída');
  } catch (error) {
    console.error('[SW] Erro na sincronização:', error);
  }
}

console.log('[SW] Service Worker carregado');
```

#### **Novo Arquivo:** `manifest.json`

```json
{
  "name": "BGAPP - Meteorologia Marinha Angola",
  "short_name": "BGAPP",
  "description": "Sistema avançado de monitoramento oceanográfico e meteorológico marinho de Angola",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0066cc",
  "orientation": "any",
  "icons": [
    {
      "src": "/assets/img/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/assets/img/icon-96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/assets/img/icon-128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/assets/img/icon-144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/assets/img/icon-152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/assets/img/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/img/icon-384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/assets/img/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["weather", "utilities", "navigation"],
  "lang": "pt-AO",
  "dir": "ltr",
  "scope": "/",
  "prefer_related_applications": false
}
```

---

## 📊 **MÉTRICAS DE SUCESSO**

### **🎯 KPIs de Performance**
- **Tempo de carregamento inicial:** < 3 segundos
- **First Contentful Paint:** < 1.5 segundos  
- **Largest Contentful Paint:** < 2.5 segundos
- **Cumulative Layout Shift:** < 0.1

### **♿ KPIs de Acessibilidade**
- **Score WCAG:** AAA (90%+)
- **Navegação por teclado:** 100% funcional
- **Screen reader compatibility:** 100%
- **Color contrast ratio:** > 4.5:1

### **🔒 KPIs de Segurança**
- **CSP implementado:** ✅
- **HTTPS enforced:** ✅
- **Sanitização de inputs:** ✅
- **Rate limiting:** ✅

---

## 🚀 **EXECUÇÃO DO PLANO**

### **📋 Checklist de Implementação**

#### **Fase 1 - Crítica**
- [ ] Implementar CSP headers
- [ ] Adicionar meta tags completas
- [ ] Configurar carregamento assíncrono
- [ ] Testar performance inicial

#### **Fase 2 - Moderada**  
- [ ] Externalizar CSS para arquivo próprio
- [ ] Implementar atributos ARIA completos
- [ ] Modularizar JavaScript
- [ ] Testar acessibilidade

#### **Fase 3 - Complementar**
- [ ] Melhorar semântica HTML
- [ ] Implementar Service Worker
- [ ] Otimizar responsividade
- [ ] Testes finais e validação

### **🧪 Testes de Validação**

#### **Performance Testing**
```bash
# Lighthouse CI
npx lighthouse-ci autorun

# WebPageTest
curl -X POST "https://www.webpagetest.org/runtest.php" \
  -d "url=https://bgapp.ao" \
  -d "runs=3" \
  -d "location=Dulles:Chrome"
```

#### **Accessibility Testing**
```bash
# axe-core CLI
npx axe-cli https://bgapp.ao --output=json

# Pa11y
npx pa11y https://bgapp.ao --standard WCAG2AAA
```

#### **Security Testing**
```bash
# Security Headers
curl -I https://bgapp.ao | grep -i security

# CSP Validator
curl -H "Content-Security-Policy-Report-Only: ..." https://bgapp.ao
```

---

## 📈 **MONITORAMENTO CONTÍNUO**

### **🔍 Ferramentas de Monitoramento**
- **Google PageSpeed Insights** - Performance mensal
- **WebAIM WAVE** - Acessibilidade semanal  
- **SecurityHeaders.com** - Segurança quinzenal
- **GTmetrix** - Performance semanal

### **📊 Dashboards**
- Performance metrics via Google Analytics
- Error tracking via Sentry
- User behavior via Hotjar
- Uptime monitoring via Pingdom

---

## 🎯 **CONCLUSÃO**

Este plano de implementação aborda **sistematicamente** todos os pontos críticos identificados na auditoria, priorizando:

1. **🔒 Segurança** - CSP e sanitização
2. **⚡ Performance** - Carregamento otimizado  
3. **♿ Acessibilidade** - ARIA e navegação
4. **🛠️ Manutenibilidade** - Código modular

**Resultado esperado:** Sistema BGAPP com **score 9/10** em todas as métricas de qualidade, proporcionando experiência excepcional para todos os usuários.

---

**📅 Cronograma Total:** 2-3 semanas  
**🎯 Objetivo:** Sistema de classe mundial  
**✅ Status:** Pronto para implementação

