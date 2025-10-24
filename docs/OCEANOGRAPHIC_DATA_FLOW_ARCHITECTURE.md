# Oceanographic Data Flow Architecture

## Overview
This document describes the complete data flow architecture for the realtime-angola oceanographic visualization system, from data sources through to frontend visualization.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Sources Layer                        │
├─────────────────────────────────────────────────────────────┤
│  • NASA Earthdata (Ocean Color, SST, Vessel Lights)         │
│  • Copernicus Marine Service (SST, Salinity, Chlorophyll)   │
│  • Global Fishing Watch (Vessel Tracking, AIS Data)         │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Workers Layer                        │
├─────────────────────────────────────────────────────────────┤
│  • bgapp-api-worker.js (Main API)                           │
│  • nasa-earthdata-proxy.js (NASA Integration)              │
│  • gfw-proxy.js (GFW Integration)                          │
│  • copernicus-webhook.js (Copernicus Integration)          │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│               Data Storage Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Cloudflare D1 Database Tables:                             │
│  • sst_data (5,000+ records)                               │
│  • ocean_color_data (5,000+ records)                       │
│  • salinity_data                                           │
│  • vessel_lights_data                                      │
│  • ml_predictions                                          │
│                                                             │
│  Cloudflare KV Cache:                                      │
│  • 24-hour TTL for oceanographic data                      │
│  • Reduces API calls to external sources                   │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│         Next.js API Routes Layer                             │
├─────────────────────────────────────────────────────────────┤
│  /api/realtime/data/route.ts                               │
│  • GET handler with layer parameter                        │
│  • Fetches from bgapp-api-worker                          │
│  • Transforms data for frontend                           │
│  • Returns JSON with metadata                             │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│           Data Transformation Layer                          │
├─────────────────────────────────────────────────────────────┤
│  dataTransformers.ts                                       │
│  • transformSSTData()                                      │
│  • transformChlorophyllData()                              │
│  • transformSalinityData()                                │
│  • transformVesselLightsData()                            │
│  • calculateStatistics()                                  │
│  • filterByQuality()                                      │
│  • filterByRecency()                                      │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│         Frontend Visualization Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Components:                                               │
│  • TemperatureHeatmapLayer.tsx                            │
│  • ChlorophyllHeatmapLayer.tsx                            │
│  • NASAOceanColorLayer.tsx                                │
│  • NASASSTLayer.tsx                                       │
│  • NASAVesselLightsLayer.tsx                              │
│                                                            │
│  Technologies:                                             │
│  • Leaflet.js with leaflet.heat                          │
│  • deck.gl for advanced visualizations                    │
│  • React hooks for state management                       │
└─────────────────────────────────────────────────────────────┘
```

## Data Format Specifications

### 1. Database Storage Format (Cloudflare D1)

#### SST Data Table Schema
```sql
CREATE TABLE sst_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    temperature REAL NOT NULL,
    data_source TEXT NOT NULL,  -- 'nasa' or 'copernicus'
    quality_level TEXT,          -- 'low', 'medium', 'high'
    metadata TEXT,               -- JSON string with additional data
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### Ocean Color Data Table Schema
```sql
CREATE TABLE ocean_color_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    chlorophyll_a REAL NOT NULL,
    data_source TEXT NOT NULL,
    quality_level TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Worker API Response Format

The bgapp-api-worker returns data in this structure:

```typescript
interface OceanographicDataResponse {
  sst: Array<{
    latitude: number;      // e.g., -12.5
    longitude: number;     // e.g., 13.2
    temperature: number;   // Celsius, e.g., 23.5
    data_source: string;   // 'nasa' or 'copernicus'
    quality_level: string; // 'high', 'medium', 'low'
    metadata: string;      // JSON string
    timestamp: string;     // ISO 8601
  }>;
  ocean_color: Array<{
    latitude: number;
    longitude: number;
    chlorophyll_a: number; // mg/m³
    data_source: string;
    quality_level: string;
    metadata: string;
    timestamp: string;
  }>;
  metadata: {
    timestamp: string;
    bounds: {
      minLat: number;  // -18.02
      maxLat: number;  // -5.55
      minLon: number;  // 8.9
      maxLon: number;  // 13.35
    };
    counts: {
      sst: number;
      ocean_color: number;
      total: number;
    };
  };
}
```

### 3. Next.js API Route Response Format

The `/api/realtime/data` endpoint returns:

```typescript
// For temperature layer
{
  temperature: Array<{
    lat: number;         // Latitude
    lon: number;         // Longitude
    temperature: number; // Temperature in Celsius
  }>,
  metadata: {
    minTemp: number;     // e.g., 18.01
    maxTemp: number;     // e.g., 27.94
    avgTemp: number;     // e.g., 22.97
    dataPoints: number;  // e.g., 5000
    coverage: string;    // 'Angola EEZ'
    lastUpdate: string;  // ISO timestamp
    source: string;      // 'bgapp-api-worker'
  },
  timestamp: string,     // ISO timestamp
  layer: string         // 'temperature'
}

// For chlorophyll layer
{
  chloropleth: Array<{
    lat: number;
    lon: number;
    value: number;       // Chlorophyll-a concentration
  }>,
  metadata: {
    min: number;         // e.g., 0.1
    max: number;         // e.g., 2.1
    mean: number;        // e.g., 0.85
    dataPoints: number;
    coverage: string;
    lastUpdate: string;
    source: string;
  },
  timestamp: string,
  layer: string         // 'chlorophyll'
}
```

### 4. Frontend Component Data Format

The visualization components expect:

```typescript
// TemperatureHeatmapLayer expects:
interface TemperatureData {
  lat: number;
  lon: number;
  temperature: number;
}

// ChlorophyllHeatmapLayer expects:
interface ChlorophyllData {
  lat: number;
  lon: number;
  value: number;  // Chlorophyll concentration
}
```

## Data Flow Steps

### Step 1: Data Ingestion
1. External APIs provide oceanographic data
2. Cloudflare Workers fetch and process raw data
3. Data is validated and normalized

### Step 2: Storage
1. Processed data stored in Cloudflare D1 tables
2. Frequently accessed data cached in KV store
3. 24-hour TTL prevents stale data

### Step 3: API Request
1. Frontend calls `/api/realtime/data?layer=temperature`
2. Next.js route handler receives request
3. Handler calls `fetchOceanographicDataWithRetry()`

### Step 4: Worker Processing
1. Request sent to `bgapp-api-worker.majearcasa.workers.dev`
2. Worker queries D1 database with bounds filter
3. Returns up to 5,000 data points

### Step 5: Data Transformation
1. Raw data passes through `transformSSTData()` or `transformChlorophyllData()`
2. Statistics calculated via `calculateStatistics()`
3. Data formatted for frontend consumption

### Step 6: Frontend Rendering
1. Components receive formatted data
2. Leaflet.heat creates heatmap visualization
3. Animation frames update opacity for pulsing effect
4. EEZ boundary filtering applied via turf.js

## Performance Optimizations

### Caching Strategy
- **KV Cache**: 24-hour TTL for oceanographic data
- **Next.js Cache**: 1-hour revalidation for API responses
- **Browser Cache**: Controlled via `_headers` file

### Data Limits
- **Query Limit**: 5,000 points per request
- **Geographic Bounds**: Angola EEZ (-18.02 to -5.55 lat, 8.9 to 13.35 lon)
- **Retry Logic**: 3 attempts with exponential backoff

### Visualization Performance
- **Heatmap Radius**: 60px for optimal coverage
- **Blur Factor**: 40px for smooth transitions
- **Animation FPS**: 24fps for smooth pulsing
- **Temperature Range**: 18°C to 25°C (Angola-specific)

## Error Handling

### API Layer
- Retry logic with exponential backoff (1s, 2s, 3s)
- Graceful fallback to empty arrays
- Error metadata in responses

### Frontend Layer
- SafeChlorophyllHeatLayer wrapper for error boundaries
- Validation of data points before rendering
- Console warnings for invalid data

## Monitoring Points

### Health Checks
1. **API Health**: `https://bgapp-api-worker.majearcasa.workers.dev/health`
2. **Database**: `wrangler d1 execute bgapp-data --command "SELECT COUNT(*) FROM sst_data;"`
3. **Cache**: `wrangler kv:namespace list`

### Performance Metrics
- API Response Time: Target < 200ms
- Data Points Returned: 5,000 per request
- Frontend Render Time: < 100ms
- Animation FPS: Maintain 24fps

## Configuration Files

### Key Configurations
- `/apps/realtime-angola/next.config.mjs`: Next.js settings
- `/infrastructure/workers/wrangler.toml`: Worker deployment
- `/apps/realtime-angola/src/services/oceanographicDataService.ts`: API endpoints
- `/apps/realtime-angola/src/components/map/`: Visualization components

## Deployment Architecture

### Production URLs
- **Frontend**: https://bgapp-realtime.pages.dev
- **API Worker**: https://bgapp-api-worker.majearcasa.workers.dev
- **NASA Proxy**: https://nasa-earthdata-proxy.majearcasa.workers.dev
- **GFW Proxy**: https://gfw-proxy.majearcasa.workers.dev

### Environment Variables
- `GFW_API_TOKEN`: Global Fishing Watch API key
- `NASA_EARTHDATA_TOKEN`: NASA Earthdata credentials
- `COPERNICUS_USERNAME/PASSWORD`: Copernicus credentials

## Future Enhancements

1. **WebSocket Support**: Real-time data streaming
2. **Vector Tiles**: Improved performance for large datasets
3. **ML Predictions**: Integration of predictive models
4. **Offline Mode**: PWA with cached data
5. **Advanced Filtering**: Time-series analysis tools