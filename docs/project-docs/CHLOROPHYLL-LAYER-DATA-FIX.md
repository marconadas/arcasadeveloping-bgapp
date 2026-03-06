# Chlorophyll Layer Data Source Fix

## Problem Description
The chlorophyll layer checkbox was functional but no points were rendering on the map when selected.

## Root Cause
The `RealTimeMap` component was incorrectly sourcing chlorophyll data from `oceanColorData` instead of the `chloroplethData` prop that contains the actual chlorophyll data from the API.

## Fix Applied
Changed the data source in `RealTimeMap.tsx` (lines 108-135):

### Before (INCORRECT):
```typescript
// Transform ocean color data to chlorophyll format
const chlorophyllData = useMemo(() => {
  if (!oceanColorData || oceanColorData.length === 0) return [];

  const transformed = oceanColorData.map(point => ({
    lat: point.latitude,
    lng: point.longitude,
    value: point.chlorophyll_a,
    // ...
  }));

  return transformed;
}, [oceanColorData]);
```

### After (CORRECT):
```typescript
// Transform chloropleth data to chlorophyll format
const chlorophyllData = useMemo(() => {
  if (!chloroplethData || chloroplethData.length === 0) return [];

  // Use the chloroplethData prop that contains actual chlorophyll data from the API
  const transformed = chloroplethData.map(point => ({
    lat: point.lat,
    lng: point.lng || point.lon,
    value: point.value,
    chlorophyll: point.value,
    quality: point.quality || 'high',
    timestamp: point.timestamp,
    source: point.source
  }));

  return transformed;
}, [chloroplethData]);
```

## Data Flow
1. **API Returns**: `/api/realtime/data?layer=chloropleth` returns `{chloropleth: [...]}`
2. **RealtimeProvider**: Fetches and stores in state as `chloroplethData`
3. **page.tsx**: Gets `chloroplethData` from context and passes to RealTimeMap
4. **RealTimeMap**: Now correctly transforms `chloroplethData` prop (not `oceanColorData`)
5. **Layer Components**: Receive properly formatted data and render the points

## Testing
After applying this fix, the chlorophyll layer should:
- ✅ Show checkbox as checked when selected
- ✅ Display chlorophyll points on the map
- ✅ Toggle visibility when checkbox is clicked
- ✅ Show proper color-coded points based on chlorophyll concentration

## Files Modified
- `/apps/realtime-angola/src/components/map/RealTimeMap.tsx` (lines 108-135)

## Date Fixed
2025-10-14