# Layer Data Fetch Fix Plan

**Date**: October 15, 2025
**Issue**: ERR_TOO_MANY_REDIRECTS blocking layer data in RealtimeProvider
**Solution**: Add individual fetch functions for each layer (Temperature pattern)

## Root Cause

**Working Layer (Temperature)**:
- Has its own `fetchTemperatureData()` function in RealTimeMap.tsx (lines 152-170)
- Calls `/api/realtime/data?layer=temperature` directly
- Uses `useEffect` to fetch when layer activated (lines 173-177)
- Falls back to provider data if available (line 139-149)
- **Bypasses RealtimeProvider's parallel fetch completely**

**Failing Layers (Vessels, Salinity, ML, VIIRS)**:
- Rely solely on RealtimeProvider context data
- RealtimeProvider's `Promise.all` fetch encounters ERR_TOO_MANY_REDIRECTS
- No fallback fetch mechanism
- Empty arrays passed to components → nothing renders

## Implementation Plan

### Phase 1: Add Vessel Data Fetch ✅ PRIORITY

Add to RealTimeMap.tsx after line 170:

```typescript
// Fetch vessel data independently
const fetchVesselDataDirect = useCallback(async () => {
  try {
    const response = await fetch('/api/gfw/vessel-presence', {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch vessel data');

    const data = await response.json();
    if (data.vessels && Array.isArray(data.vessels)) {
      setLocalVessels(data.vessels);
    }
  } catch (error) {
    console.error('Error fetching vessel data:', error);
  }
}, []);

// Load vessel data when vessel layer is active
useEffect(() => {
  if (activeLayers.includes('vessels')) {
    fetchVesselDataDirect();
  }
}, [activeLayers, fetchVesselDataDirect]);
```

State addition (after line 90):
```typescript
const [localVessels, setLocalVessels] = useState<VesselData[]>([]);
```

Component usage update (line 423):
```typescript
{/* Vessel Layer - Use local data if available, fallback to props */}
{activeLayers.includes('vessels') && (
  <VesselLayer
    vessels={localVessels.length > 0 ? localVessels : vessels}
    showTooltips={true}
  />
)}
```

### Phase 2: Add Salinity Data Fetch

```typescript
// Fetch salinity data independently
const fetchSalinityDataDirect = useCallback(async () => {
  try {
    const angolaEEZ = '-18.02,8.9,-5.55,13.35';
    const response = await fetch(
      `/api/environmental/salinity?limit=1000&bbox=${angolaEEZ}`,
      {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      }
    );
    if (!response.ok) throw new Error('Failed to fetch salinity data');

    const data = await response.json();
    if (data.salinity && Array.isArray(data.salinity)) {
      setLocalSalinityData(data.salinity);
    }
  } catch (error) {
    console.error('Error fetching salinity data:', error);
  }
}, []);

useEffect(() => {
  if (activeLayers.includes('salinity')) {
    fetchSalinityDataDirect();
  }
}, [activeLayers, fetchSalinityDataDirect]);
```

State:
```typescript
const [localSalinityData, setLocalSalinityData] = useState<any[]>([]);
```

Component update (line 363/370):
```typescript
data={localSalinityData.length > 0 ? localSalinityData : salinityData}
```

### Phase 3: Add ML Predictions Fetch

```typescript
// Fetch ML predictions independently
const fetchMLPredictionsDirect = useCallback(async () => {
  try {
    const response = await fetch('/api/ml/predictions?limit=500', {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to fetch ML predictions');

    const data = await response.json();
    if (data.predictions && Array.isArray(data.predictions)) {
      setLocalMLPredictions(data.predictions);
    }
  } catch (error) {
    console.error('Error fetching ML predictions:', error);
  }
}, []);

useEffect(() => {
  if (activeLayers.includes('ml-predictions')) {
    fetchMLPredictionsDirect();
  }
}, [activeLayers, fetchMLPredictionsDirect]);
```

State:
```typescript
const [localMLPredictions, setLocalMLPredictions] = useState<any[]>([]);
```

Component update (line 321/328):
```typescript
data={localMLPredictions.length > 0 ? localMLPredictions : mlPredictionsData}
```

### Phase 4: Add Chlorophyll Data Fetch

```typescript
// Fetch chlorophyll data independently
const fetchChlorophyllDataDirect = useCallback(async () => {
  try {
    const angolaEEZ = '-18.02,8.9,-5.55,13.35';
    const response = await fetch(
      `/api/environmental/ocean-color?limit=2000&bbox=${angolaEEZ}`,
      {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      }
    );
    if (!response.ok) throw new Error('Failed to fetch ocean color data');

    const data = await response.json();
    if (data.oceanColor && Array.isArray(data.oceanColor)) {
      // Transform to chlorophyll format
      const transformed = data.oceanColor.map((point: any) => ({
        lat: point.latitude,
        lng: point.longitude,
        value: point.chlorophyll_a,
        chlorophyll: point.chlorophyll_a,
        quality: point.quality || 'high',
        timestamp: point.timestamp,
        source: point.data_source
      }));
      setLocalChlorophyllData(transformed);
    }
  } catch (error) {
    console.error('Error fetching chlorophyll data:', error);
  }
}, []);

useEffect(() => {
  if (activeLayers.includes('chloropleth')) {
    fetchChlorophyllDataDirect();
  }
}, [activeLayers, fetchChlorophyllDataDirect]);
```

State:
```typescript
const [localChlorophyllData, setLocalChlorophyllData] = useState<any[]>([]);
```

Component update (line 301/308):
```typescript
data={localChlorophyllData.length > 0 ? localChlorophyllData : chlorophyllData}
```

## Benefits of This Approach

1. **Bypasses RealtimeProvider redirects**: Each layer fetches independently
2. **Follows proven pattern**: Temperature layer already works this way
3. **Maintains fallback**: Still uses provider data if local fetch fails
4. **Independent activation**: Layers only fetch when toggled ON
5. **Better performance**: No unnecessary parallel fetches on page load
6. **Easier debugging**: Individual fetch errors isolated per layer

## Testing Checklist

After implementing each phase:
- [ ] Toggle layer ON in browser
- [ ] Check browser console for fetch success/errors
- [ ] Verify data appears on map
- [ ] Check legend displays correctly
- [ ] Test layer toggle OFF/ON
- [ ] Verify no ERR_TOO_MANY_REDIRECTS for that endpoint

## Implementation Order

1. **Phase 1 (CRITICAL)**: Vessels - Validates fix approach
2. **Phase 2 (HIGH)**: Salinity - Simple endpoint, quick win
3. **Phase 3 (HIGH)**: ML Predictions - Important for demo
4. **Phase 4 (MEDIUM)**: Chlorophyll - Complex transformation, test thoroughly

## Expected Outcome

All 7 layers functional:
- ✅ Temperatura (already working)
- ✅ Embarcações (after Phase 1)
- ✅ Salinidade (after Phase 2)
- ✅ Previsões ML (after Phase 3)
- ✅ Clorofila (after Phase 4)
- ✅ Fronteiras EEZ (already working)
- ⚠️  Luzes VIIRS (NASA proxy - separate issue, use mock data)

## Notes

- VIIRS layer (NASA Vessel Lights) requires NASA proxy worker deployment or mock data
- This fix doesn't address the root cause of ERR_TOO_MANY_REDIRECTS in RealtimeProvider
- Future work: Debug RealtimeProvider redirect issue for optimization
- Current approach prioritizes functionality for December 2025 demo
