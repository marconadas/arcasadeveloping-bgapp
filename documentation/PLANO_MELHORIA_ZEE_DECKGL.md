# Plano de Melhoria - Delimitações da ZEE no Mapa deck.gl

## 1. Análise dos Problemas Identificados

### 1.1 Problemas Críticos nas Coordenadas da ZEE

**Coordenadas Atuais Incorretas:**
- Limite oeste: 11.4° (incorreto)
- Limite leste: 16.8° (incorreto)
- Limite norte: -4.4° (incorreto)
- Limite sul: -18.5° (incorreto)

**Coordenadas Corretas da ZEE de Angola:**
- Limite oeste: 8.5° (200 milhas náuticas da costa)
- Limite leste: 17.5° (limite oceânico real)
- Limite norte: -4.2° (Cabinda)
- Limite sul: -18.0° (fronteira com Namíbia)

### 1.2 Problemas no Código deck.gl

1. **Método `createZEEOffset` simplificado demais:**
   - Usa aproximação linear (1nm ≈ 0.0167°)
   - Não considera curvatura da Terra
   - Não respeita limites internacionais

2. **Dados EOX Coastline não utilizados corretamente:**
   - Arquivo `eox-angola-coastline.json` existe mas não é carregado
   - Fallback para coordenadas hardcoded incorretas

3. **Falta de validação geográfica:**
   - Não verifica se coordenadas estão dentro dos limites de Angola
   - Não considera tratados internacionais

## 2. Plano de Implementação

### 2.1 Fase 1: Correção das Coordenadas Base

**Tarefas:**
1. Atualizar coordenadas em todos os arquivos de configuração
2. Implementar validação geográfica
3. Criar dados GeoJSON precisos da ZEE

**Arquivos a serem atualizados:**
- `src/bgapp/models/angola_oceanography.py`
- `src/bgapp/cartography/python_maps_engine.py`
- `scripts/coordinate_sanity_check.py`
- `utils/admin_api_*.py`

### 2.2 Fase 2: Melhoria do Algoritmo deck.gl

**Tarefas:**
1. Implementar cálculo preciso de offset de 200nm
2. Usar projeção UTM para cálculos precisos
3. Integrar dados EOX Coastline reais
4. Adicionar validação de limites internacionais

### 2.3 Fase 3: Validação e Testes

**Tarefas:**
1. Validar coordenadas com dados OSM
2. Testar com diferentes projeções
3. Verificar conformidade com UNCLOS
4. Implementar testes automatizados

## 3. Implementação Técnica

### 3.1 Correção das Coordenadas

```javascript
// Coordenadas corretas da ZEE de Angola
const ANGOLA_ZEE_BOUNDS = {
  continental: {
    north: -6.02,     // Após gap RDC
    south: -17.266,   // Rio Cunene
    east: 17.5,       // Limite oceânico
    west: 8.5         // Costa atlântica
  },
  cabinda: {
    north: -4.2,
    south: -6.02,
    east: 13.5,
    west: 11.5
  }
};
```

### 3.2 Algoritmo de Offset Preciso

```javascript
function createPreciseZEEOffset(coastlineCoords, offsetNM) {
  // Usar biblioteca de cálculos geodésicos
  const offsetMeters = offsetNM * 1852; // Converter para metros
  
  return coastlineCoords.map(coord => {
    const [lon, lat] = coord;
    const bearing = calculateBearingToOcean(lon, lat);
    const newPoint = calculateDestinationPoint(lat, lon, bearing, offsetMeters);
    return [newPoint.longitude, newPoint.latitude];
  });
}
```

### 3.3 Integração com Dados EOX

```javascript
async function loadEOXCoastlineData() {
  try {
    const response = await fetch('assets/data/eox-angola-coastline.json');
    const data = await response.json();
    
    // Validar dados EOX
    if (this.validateEOXData(data)) {
      return data;
    }
    
    throw new Error('Dados EOX inválidos');
  } catch (error) {
    console.warn('EOX Coastline indisponível, usando fallback');
    return this.getFallbackCoastlineData();
  }
}
```

## 4. Validação com MCPs

### 4.1 Validação Geográfica

- Usar OpenStreetMap MCP para verificar coordenadas
- Validar limites com dados oficiais
- Verificar conformidade com tratados internacionais

### 4.2 Testes de Precisão

- Comparar com dados de referência
- Validar cálculos de distância
- Verificar projeções cartográficas

## 5. Cronograma de Implementação

**Semana 1:**
- Correção das coordenadas base
- Atualização dos arquivos de configuração

**Semana 2:**
- Implementação do algoritmo preciso
- Integração com dados EOX

**Semana 3:**
- Validação e testes
- Deploy em produção

**Semana 4:**
- Monitoramento e ajustes
- Documentação final

## 6. Critérios de Sucesso

1. **Precisão Geográfica:**
   - Coordenadas dentro de ±0.1° dos limites reais
   - ZEE respeitando 200nm da costa
   - Conformidade com UNCLOS

2. **Performance:**
   - Carregamento do mapa < 3 segundos
   - Renderização suave em 60fps
   - Compatibilidade com dispositivos móveis

3. **Usabilidade:**
   - Interface intuitiva
   - Controles responsivos
   - Informações claras sobre a ZEE

## 7. Riscos e Mitigações

**Risco:** Dados EOX indisponíveis
**Mitigação:** Implementar fallback robusto com dados validados

**Risco:** Performance degradada
**Mitigação:** Otimizar algoritmos e usar Web Workers

**Risco:** Incompatibilidade com navegadores
**Mitigação:** Testes extensivos e polyfills

## 8. Próximos Passos

1. **Imediato:** Iniciar correção das coordenadas base
2. **Curto prazo:** Implementar algoritmo preciso
3. **Médio prazo:** Validação completa e testes
4. **Longo prazo:** Monitoramento e melhorias contínuas
