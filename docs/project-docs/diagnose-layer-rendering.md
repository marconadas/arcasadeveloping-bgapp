# 🔍 Diagnóstico de Renderização de Camadas do Mapa

## ✅ Status do Backend (CONFIRMADO FUNCIONANDO)

Todos os endpoints estão retornando dados com sucesso:

| Camada | Endpoint | Registros | Status |
|--------|----------|-----------|--------|
| Ocean Color (Chlorophyll) | `/api/environmental/ocean-color` | 2000 | ✅ Funcionando |
| SST (Temperature) | `/api/environmental/sst` | 2000 | ✅ Funcionando |
| Salinity | `/api/environmental/salinity` | 1000 | ✅ Funcionando |
| ML Predictions | `/api/realtime/ml-predictions` | 280 | ✅ Funcionando |

## 🔄 Fluxo de Dados Identificado

```
1. D1 Database (Cloudflare)
   ↓
2. bgapp-api-worker.js (Cloudflare Worker)
   ↓
3. Next.js API Routes (/api/environmental/*)
   ↓
4. RealtimeProvider (React Context)
   ↓
5. RealTimeMap Component
   ↓
6. Individual Layer Components (ChlorophyllCircleLayer, etc.)
```

## 🎯 Problema Identificado

**Relatório do Usuário**: "no mapa so vemos os pontos de ml mesmo quando temos todas as camadas visiveis"

## 📊 Análise do Código

### RealTimeMap.tsx - Transformações de Dados

```typescript
// Linha 103-129: Transformação de Ocean Color → Chlorophyll
const chlorophyllData = useMemo(() => {
  console.log('[RealTimeMap] Ocean Color Data:', {
    hasData: !!oceanColorData,
    length: oceanColorData?.length || 0
  });

  if (!oceanColorData || oceanColorData.length === 0) return [];

  return oceanColorData.map(point => ({
    lat: point.latitude,
    lng: point.longitude,
    value: point.chlorophyll_a,
    chlorophyll: point.chlorophyll_a,
    // ...
  }));
}, [oceanColorData]);

// Linha 132-142: Transformação de SST → Temperature
const sstTemperatureData = useMemo(() => {
  if (!sstData || sstData.length === 0) return temperatureData;

  return sstData.map(point => ({
    lat: point.latitude,
    lon: point.longitude,
    temperature: point.temperature,
    // ...
  }));
}, [sstData, temperatureData]);
```

### Renderização das Camadas (RealTimeMap.tsx)

```typescript
// Linha 287-312: Chlorophyll Layer
{activeLayers.includes('chlorophyll') && (
  <ChlorophyllCircleLayer
    data={chlorophyllData}  // ← Dados transformados
    visible={true}
    opacity={0.8}
    eezBoundary={eezBoundary}
  />
)}

// Linha 335-351: Temperature Layer
{activeLayers.includes('temperature') && (
  <TemperatureHeatmapLayer
    data={sstTemperatureData}  // ← Dados transformados
    visible={true}
    opacity={0.6}
  />
)}

// Linha 357-372: Salinity Layer
{activeLayers.includes('salinity') && (
  <SalinityLayer
    data={salinityData}  // ← Dados direto do contexto
    visible={true}
    opacity={0.7}
  />
)}

// Linha 315-332: ML Predictions Layer
{activeLayers.includes('ml-predictions') && (
  <MLPredictionsLayer
    data={mlPredictionsData}  // ← Props do componente pai
    visible={true}
    opacity={0.8}
  />
)}
```

## 🐛 Possíveis Causas do Problema

1. **Z-Index/Stacking Order**: ML predictions podem estar cobrindo outras camadas
2. **Opacity Settings**: Outras camadas podem ter opacidade muito baixa
3. **Data Transformation**: Dados podem estar sendo filtrados durante transformação
4. **EEZ Boundary Filtering**: Pontos podem estar sendo removidos se fora do EEZ
5. **Layer Toggle State**: `activeLayers` pode não incluir as camadas desejadas

## 🔧 Verificações Necessárias no Browser

Para confirmar o problema, precisamos verificar no console do navegador:

1. **Console Logs do RealTimeMap**:
   - `[RealTimeMap] Ocean Color Data: {hasData: ..., length: ...}`
   - `[RealTimeMap] Transformed Chlorophyll Data: {length: ...}`
   - `[RealTimeMap] Rendering Chlorophyll Layer: {isActive: ..., dataLength: ...}`

2. **Console Logs do ChlorophyllCircleLayer**:
   - `[ChlorophyllCircleLayer] Rendering with: {hasMap: ..., dataLength: ..., visible: ...}`

3. **Verificar no DevTools**:
   - Elementos SVG/Canvas sendo criados para cada camada
   - Estilos CSS aplicados (opacity, z-index)
   - Network tab mostrando requisições bem-sucedidas

## 📝 Próximos Passos

1. **Abrir o navegador manualmente em http://localhost:3002**
2. **Abrir o Console do DevTools (F12)**
3. **Ativar todas as camadas no painel de controle**
4. **Procurar pelos console.log mencionados acima**
5. **Verificar se os dados estão chegando mas não sendo renderizados**

## 🎯 Solução Temporária

Se apenas ML predictions estão visíveis, pode ser necessário:

1. Ajustar z-index das camadas
2. Verificar se `activeLayers` está sendo atualizado corretamente
3. Confirmar que as transformações de dados não estão retornando arrays vazios
4. Verificar se o EEZ boundary está filtrando corretamente

## 📊 Dados de Teste

```bash
# Testar Ocean Color
curl -s "http://localhost:3002/api/environmental/ocean-color?limit=5" | jq '.data | length'
# Esperado: 5

# Testar SST
curl -s "http://localhost:3002/api/environmental/sst?limit=5" | jq '.data | length'
# Esperado: 5

# Testar Salinity
curl -s "http://localhost:3002/api/environmental/salinity?limit=5" | jq '.data | length'
# Esperado: 5

# Testar ML Predictions
curl -s "http://localhost:3002/api/realtime/ml-predictions" | jq '.predictions | length'
# Esperado: > 0
```