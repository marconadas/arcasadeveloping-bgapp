# 🌊 ESTUDO: CORREÇÃO DO ERRO CORS GEBCO - ANÁLISE TÉCNICA COMPLETA

## 📋 ANÁLISE DO PROBLEMA

### 🚨 Erro Atual
```
Access to fetch at 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?...' 
from origin 'http://localhost:8085' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 🔍 Descoberta Importante: EOX Já Integra GEBCO!

Segundo a documentação oficial da [EOX::Maps](https://maps.eox.at/#about), **GEBCO já está integrado** no serviço EOX:

> **GEBCO © GEBCO [Terrain Light]**
> 
> The rendering is © EOX [Terrain Light, Terrain, OpenStreetMap, Overlay]

Isso significa que **não precisamos acessar GEBCO diretamente** - podemos usar a integração já existente no EOX!

## 🎯 SOLUÇÕES IDENTIFICADAS

### 1. 🏆 **SOLUÇÃO RECOMENDADA: Usar EOX Terrain Light com GEBCO Integrado**

**Vantagens:**
- ✅ Zero problemas de CORS (EOX tem headers corretos)
- ✅ Dados GEBCO já processados e otimizados
- ✅ Performance superior (CDN da EOX)
- ✅ Manutenção zero (EOX mantém a integração)
- ✅ Compatível com nossa arquitetura atual

**Como funciona:**
- EOX já processa dados GEBCO em seus servidores
- Disponibiliza via WMS com CORS habilitado
- Camada `Terrain Light` inclui batimetria GEBCO

### 2. 🔧 **ALTERNATIVA: Proxy Server Dedicado**

**Quando usar:**
- Se precisarmos de dados GEBCO específicos não disponíveis via EOX
- Para controle total sobre os dados batimétricos
- Requisitos específicos de processamento

**Implementação:**
```python
# Flask proxy server
from flask import Flask, request, Response
import requests

app = Flask(__name__)

@app.route('/gebco-proxy')
def gebco_proxy():
    gebco_url = 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv'
    
    # Forward request to GEBCO
    response = requests.get(gebco_url, params=request.args)
    
    # Add CORS headers
    headers = dict(response.headers)
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Content-Type'
    
    return Response(
        response.content,
        status=response.status_code,
        headers=headers,
        mimetype=response.headers.get('Content-Type')
    )
```

### 3. 🌐 **ALTERNATIVA: Serverless Function (Vercel/Netlify)**

**Exemplo Vercel:**
```javascript
// api/gebco-proxy.js
export default async function handler(req, res) {
  const { query } = req;
  
  // Build GEBCO URL
  const gebcoUrl = new URL('https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv');
  Object.keys(query).forEach(key => {
    gebcoUrl.searchParams.append(key, query[key]);
  });
  
  try {
    const response = await fetch(gebcoUrl.toString());
    const data = await response.arrayBuffer();
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', response.headers.get('Content-Type'));
    
    res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    res.status(500).json({ error: 'Proxy failed', details: error.message });
  }
}
```

## 📋 TODO LIST DETALHADA

### 🔬 FASE 1: ANÁLISE E PESQUISA
- [x] **Analisar como EOX integra dados GEBCO no Terrain Light** 
  - Descoberto: GEBCO já integrado no Terrain Light da EOX
  - Não há necessidade de acesso direto ao GEBCO
- [ ] **Pesquisar alternativas ao acesso direto GEBCO**
  - Proxy server próprio
  - Serverless functions
  - Mirror/cache local
  - APIs alternativas de batimetria

### 🧪 FASE 2: TESTES E VALIDAÇÃO
- [ ] **Testar integração com dados GEBCO via EOX**
  - Verificar qualidade dos dados batimétricos no Terrain Light
  - Testar resolução e cobertura para águas angolanas
  - Validar performance e estabilidade
- [ ] **Implementar testes A/B**
  - Comparar EOX Terrain Light vs acesso direto GEBCO
  - Medir latência e qualidade visual
  - Avaliar adequação para uso oceanográfico

### 🛠️ FASE 3: IMPLEMENTAÇÃO
- [ ] **Implementar solução EOX Terrain Light** (RECOMENDADO)
  ```javascript
  // Usar camada Terrain Light que já inclui GEBCO
  const terrainLightLayer = L.tileLayer.wms('https://tiles.maps.eox.at/wms', {
    layers: 'terrain-light',
    format: 'image/png',
    transparent: false,
    attribution: 'Terrain Light { Data © OpenStreetMap contributors and others, GEBCO © GEBCO, Rendering © EOX }'
  });
  ```
- [ ] **Implementar proxy server** (SE NECESSÁRIO)
  - Escolher tecnologia (Flask, Express.js, Vercel Functions)
  - Configurar CORS headers corretos
  - Implementar cache para otimização
  - Configurar rate limiting

### 🚀 FASE 4: OTIMIZAÇÃO
- [ ] **Otimizar performance da solução escolhida**
  - Implementar cache local de tiles
  - Configurar CDN se usando proxy próprio
  - Otimizar parâmetros WMS para Angola
- [ ] **Criar sistema de fallback**
  - EOX Terrain Light como primário
  - Proxy GEBCO como secundário
  - OpenStreetMap como terciário

### 🔍 FASE 5: MONITORAMENTO
- [ ] **Implementar monitoramento**
  - Health checks para serviços
  - Métricas de performance
  - Alertas de degradação
- [ ] **Documentar solução**
  - Guia de implementação
  - Troubleshooting
  - Métricas de sucesso

## 🎯 IMPLEMENTAÇÃO RECOMENDADA

### Opção 1: EOX Terrain Light (IMEDIATA) ⭐
```javascript
// Substituir chamadas GEBCO por EOX Terrain Light
const bathymetryLayer = L.tileLayer.wms('https://tiles.maps.eox.at/wms', {
  layers: 'terrain-light',
  format: 'image/png',
  transparent: false,
  opacity: 0.8,
  attribution: 'GEBCO via EOX::Maps © EOX, GEBCO',
  maxZoom: 12
});

// Adicionar overlay para labels se necessário
const overlayLayer = L.tileLayer.wms('https://tiles.maps.eox.at/wms', {
  layers: 'overlay',
  format: 'image/png',
  transparent: true,
  opacity: 0.7
});
```

### Opção 2: Proxy Dedicado (SE NECESSÁRIO)
```python
# requirements.txt
flask==2.3.3
requests==2.31.0
flask-cors==4.0.0

# app.py
from flask import Flask, request, Response
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/gebco/<path:endpoint>')
def gebco_proxy(endpoint):
    base_url = 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service'
    url = f"{base_url}/{endpoint}"
    
    try:
        response = requests.get(url, params=request.args, timeout=30)
        
        return Response(
            response.content,
            status=response.status_code,
            headers={
                'Content-Type': response.headers.get('Content-Type', 'application/octet-stream'),
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600'  # Cache 1 hora
            }
        )
    except requests.RequestException as e:
        return {'error': str(e)}, 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
```

## 📊 COMPARAÇÃO DAS SOLUÇÕES

| Critério | EOX Terrain Light | Proxy Próprio | Serverless |
|----------|-------------------|----------------|------------|
| **Complexidade** | 🟢 Baixa | 🟡 Média | 🟡 Média |
| **Manutenção** | 🟢 Zero | 🔴 Alta | 🟡 Baixa |
| **Performance** | 🟢 Excelente | 🟡 Boa | 🟢 Excelente |
| **Custo** | 🟢 Gratuito | 🟡 Servidor | 🟢 Pay-per-use |
| **Controle** | 🟡 Limitado | 🟢 Total | 🟡 Médio |
| **CORS** | 🟢 Resolvido | 🟢 Resolvido | 🟢 Resolvido |
| **Escalabilidade** | 🟢 EOX CDN | 🟡 Depende | 🟢 Auto-scale |

## 🏆 RECOMENDAÇÃO FINAL

**IMPLEMENTAR EOX TERRAIN LIGHT IMEDIATAMENTE** porque:

1. **Zero CORS Issues** - EOX já resolve isso
2. **GEBCO Integrado** - Dados já processados e otimizados
3. **Performance Superior** - CDN global da EOX
4. **Manutenção Zero** - EOX mantém a integração
5. **Gratuito** - Sem custos adicionais de infraestrutura
6. **Compatível** - Funciona com nossa arquitetura atual

Se no futuro precisarmos de dados GEBCO específicos não disponíveis via EOX, podemos implementar o proxy como solução complementar.

---

**📝 Próximo Passo:** Implementar EOX Terrain Light como substituto direto das chamadas GEBCO problemáticas.

*Estudo baseado na documentação oficial [EOX::Maps](https://maps.eox.at/#about)*
