# 🔄 Enhanced Database Schema Migration Guide

## Overview

This guide covers the migration from the legacy database schema to the enhanced schema that better supports all API integrations (Copernicus, GFW, NASA).

## 📋 Migration Steps

### 1. Backup Current Data

```bash
# Backup D1 database
wrangler d1 export bgapp-data --output=backup-$(date +%Y%m%d).sql

# Verify backup
ls -lh backup-*.sql
```

### 2. Run Migration Script

```bash
# Apply migration (creates new tables and migrates data)
wrangler d1 execute bgapp-data --file=infrastructure/workers/migrate-to-enhanced-schema.sql

# Verify migration
wrangler d1 execute bgapp-data --command="SELECT COUNT(*) as count FROM sst_data;"
wrangler d1 execute bgapp-data --command="SELECT COUNT(*) as count FROM vessel_data;"
```

### 3. Verify Data Integrity

```bash
# Check that data was migrated correctly
wrangler d1 execute bgapp-data --command="
  SELECT
    (SELECT COUNT(*) FROM sst_data) as sst_count,
    (SELECT COUNT(*) FROM vessel_data) as vessel_count,
    (SELECT COUNT(*) FROM ocean_color_data) as ocean_color_count;
"

# Verify views are working
wrangler d1 execute bgapp-data --command="SELECT COUNT(*) FROM recent_vessel_activity;"
wrangler d1 execute bgapp-data --command="SELECT COUNT(*) FROM latest_environmental_conditions;"
wrangler d1 execute bgapp-data --command="SELECT COUNT(*) FROM fishing_hotspots;"
```

### 4. Update Worker Configuration

The new schema is already integrated in:
- `infrastructure/workers/db-service.js` - Database operations layer
- `infrastructure/workers/api-endpoints-enhanced.js` - REST API endpoints

To enable the enhanced schema in production:

```bash
# Deploy updated workers
cd infrastructure/workers
wrangler deploy api-worker.js
```

### 5. Test Enhanced API Endpoints

```bash
# Test SST endpoint
curl "https://bgapp-api-worker.majearcasa.workers.dev/api/environmental/sst?limit=10"

# Test vessel endpoint
curl "https://bgapp-api-worker.majearcasa.workers.dev/api/vessels?limit=10"

# Test vessel activity view
curl "https://bgapp-api-worker.majearcasa.workers.dev/api/vessels/activity"

# Test environmental conditions view
curl "https://bgapp-api-worker.majearcasa.workers.dev/api/environmental/latest?limit=100"

# Test fishing hotspots view
curl "https://bgapp-api-worker.majearcasa.workers.dev/api/fishing/hotspots?limit=50"
```

## 🎯 New Database Schema Features

### Environmental Data Tables

#### 1. **sst_data** - Sea Surface Temperature
```sql
INSERT INTO sst_data (latitude, longitude, temperature, timestamp, data_source, bbox)
VALUES (-12.5, 12.0, 28.5, '2025-10-01T12:00:00Z', 'copernicus', '-13,-12,11,13');
```

#### 2. **ocean_color_data** - Chlorophyll & Water Quality
```sql
INSERT INTO ocean_color_data (latitude, longitude, chlorophyll_a, turbidity, timestamp, data_source)
VALUES (-12.5, 12.0, 0.15, 2.3, '2025-10-01T12:00:00Z', 'copernicus');
```

#### 3. **salinity_data** - Ocean Salinity
```sql
INSERT INTO salinity_data (latitude, longitude, salinity, depth, timestamp, data_source)
VALUES (-12.5, 12.0, 35.5, 10, '2025-10-01T12:00:00Z', 'copernicus');
```

#### 4. **current_data** - Ocean Currents
```sql
INSERT INTO current_data (latitude, longitude, u_velocity, v_velocity, speed, direction, timestamp)
VALUES (-12.5, 12.0, 0.5, 0.3, 0.58, 31.0, '2025-10-01T12:00:00Z');
```

#### 5. **wave_data** - Wave Heights
```sql
INSERT INTO wave_data (latitude, longitude, significant_wave_height, mean_wave_period, timestamp)
VALUES (-12.5, 12.0, 2.5, 8.0, '2025-10-01T12:00:00Z');
```

### Vessel Tracking Tables (GFW)

#### 1. **vessel_data** - Enhanced Vessel Tracking
```sql
INSERT INTO vessel_data (vessel_id, mmsi, vessel_name, vessel_type, flag, latitude, longitude, timestamp, speed, heading, fishing_activity_probability, in_eez)
VALUES ('GFW-12345', '123456789', 'Fishing Vessel 1', 'fishing', 'AGO', -12.5, 12.0, '2025-10-01T12:00:00Z', 8.5, 270, 0.85, 'AGO');
```

#### 2. **vessel_presence** - Vessel Density/Heatmaps
```sql
INSERT INTO vessel_presence (grid_cell_id, latitude, longitude, vessel_count, fishing_vessel_count, time_period, timestamp)
VALUES ('H3-8928374', -12.5, 12.0, 15, 8, 'day', '2025-10-01T00:00:00Z');
```

#### 3. **fishing_events** - Fishing Activity Events
```sql
INSERT INTO fishing_events (vessel_id, event_type, start_time, start_latitude, start_longitude, duration_hours, confidence_score, in_eez)
VALUES ('GFW-12345', 'fishing', '2025-10-01T08:00:00Z', -12.5, 12.0, 4.5, 0.92, 'AGO');
```

### NASA Data Tables

#### 1. **vessel_lights_data** - Black Marble/Nightlights
```sql
INSERT INTO vessel_lights_data (latitude, longitude, radiance, timestamp, potential_vessel_activity, bbox)
VALUES (-12.5, 12.0, 45.3, '2025-10-01T22:00:00Z', 0.78, '-13,-12,11,13');
```

### Monitoring Tables

#### 1. **data_freshness** - Track data updates
```sql
-- Automatically updated via db.updateDataFreshness()
SELECT * FROM data_freshness ORDER BY last_update DESC;
```

#### 2. **api_metrics** - API performance tracking
```sql
-- Automatically logged on each API call
SELECT endpoint, AVG(response_time), COUNT(*) as total_calls
FROM api_metrics
WHERE timestamp > datetime('now', '-24 hours')
GROUP BY endpoint;
```

## 📊 Database Views

### 1. recent_vessel_activity
Returns vessels seen in the last 24 hours with summary statistics:
```sql
SELECT * FROM recent_vessel_activity;
```

### 2. latest_environmental_conditions
Combines SST, chlorophyll, and salinity for latest readings:
```sql
SELECT * FROM latest_environmental_conditions LIMIT 100;
```

### 3. fishing_hotspots
Identifies areas with high fishing activity (last 30 days):
```sql
SELECT * FROM fishing_hotspots;
```

## 🔌 New API Endpoints

### Environmental Data

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/environmental/sst` | GET | Get SST data |
| `/api/environmental/sst` | POST | Insert SST data |
| `/api/environmental/ocean-color` | GET | Get ocean color data |
| `/api/environmental/ocean-color` | POST | Insert ocean color data |
| `/api/environmental/salinity` | POST | Insert salinity data |
| `/api/environmental/current` | POST | Insert current data |
| `/api/environmental/wave` | POST | Insert wave data |
| `/api/environmental/latest` | GET | Get latest conditions (view) |

### Vessel Tracking

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vessels` | GET | Get vessel tracking data |
| `/api/vessels` | POST | Insert vessel data |
| `/api/vessels/bulk` | POST | Bulk insert vessels |
| `/api/vessels/activity` | GET | Recent vessel activity (view) |
| `/api/vessels/presence` | GET | Vessel density/heatmap data |
| `/api/vessels/presence` | POST | Insert vessel presence data |

### Fishing Events

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fishing/events` | GET | Get fishing events |
| `/api/fishing/events` | POST | Insert fishing event |
| `/api/fishing/hotspots` | GET | Fishing hotspots (view) |

### NASA Data

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nasa/vessel-lights` | POST | Insert vessel lights data |

### Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/metrics` | GET | API performance metrics |
| `/api/data-freshness` | GET | Data freshness status |

### Maintenance

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/maintenance/cleanup` | POST | Cleanup expired data |

### Batch Processing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/batch/copernicus` | POST | Batch Copernicus data processing |

## 🚀 Frontend Integration Examples

### Fetching SST Data for Map Layer

```javascript
// apps/realtime-angola/src/services/oceanographicService.ts
export async function getSST(bbox, startTime, endTime) {
  const params = new URLSearchParams({
    bbox,
    start_time: startTime,
    end_time: endTime,
    limit: '1000'
  });

  const response = await fetch(
    `${API_BASE}/api/environmental/sst?${params}`
  );

  const data = await response.json();
  return data.data; // Array of SST points
}
```

### Fetching Vessel Activity

```javascript
// apps/realtime-angola/src/services/vesselService.ts
export async function getRecentVesselActivity() {
  const response = await fetch(
    `${API_BASE}/api/vessels/activity`
  );

  const data = await response.json();
  return data.data; // Aggregated vessel activity
}
```

### Fetching Fishing Hotspots

```javascript
// apps/realtime-angola/src/services/fishingService.ts
export async function getFishingHotspots(limit = 100) {
  const response = await fetch(
    `${API_BASE}/api/fishing/hotspots?limit=${limit}`
  );

  const data = await response.json();
  return data.data; // Fishing hotspot grid cells
}
```

### Batch Insert Copernicus Data

```javascript
// apps/admin-dashboard/src/services/dataIngestion.ts
export async function batchIngestCopernicusData(sstData, oceanColorData, salinityData) {
  const response = await fetch(`${API_BASE}/api/batch/copernicus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sst: sstData,
      ocean_color: oceanColorData,
      salinity: salinityData
    })
  });

  const result = await response.json();
  return result.results;
}
```

## 🔍 Query Examples

### Get Latest SST for Angola EEZ

```javascript
const sst = await fetch(
  `${API_BASE}/api/environmental/sst?bbox=-18.02,-5.55,8.9,13.35&start_time=${yesterday}&limit=5000`
);
```

### Get Vessels in Angola EEZ (Last 24h)

```javascript
const vessels = await fetch(
  `${API_BASE}/api/vessels?in_eez=AGO&start_time=${yesterday}&limit=1000`
);
```

### Get Fishing Events in Angola EEZ

```javascript
const events = await fetch(
  `${API_BASE}/api/fishing/events?in_eez=AGO&event_type=fishing&start_time=${lastWeek}`
);
```

### Get Latest Environmental Conditions

```javascript
const conditions = await fetch(
  `${API_BASE}/api/environmental/latest?limit=500`
);

// Returns: { latitude, longitude, sst, chlorophyll_a, salinity, ... }
```

## 📈 Performance Optimizations

### 1. Data Expiration (TTL)
Environmental data automatically expires after 24 hours:
```sql
-- Cleanup expired data
DELETE FROM sst_data WHERE expires_at < datetime('now');
```

### 2. Indexes
All critical queries are indexed:
- Location-based queries (lat/lon)
- Time-based queries (timestamp)
- Spatial queries (bbox)
- Entity lookups (vessel_id, mmsi, eez)

### 3. Views for Common Queries
Pre-computed views for frequently accessed data:
- `recent_vessel_activity` - Last 24h vessel summary
- `latest_environmental_conditions` - Latest multi-source environmental data
- `fishing_hotspots` - High fishing activity areas (last 30 days)

## ⚠️ Important Notes

### Data Retention
- **Environmental data**: 24-hour TTL (refreshed daily)
- **Vessel data**: Permanent (no expiration)
- **API metrics**: Permanent (for analytics)
- **Cache metadata**: Expires based on TTL setting

### Cleanup Maintenance
Run periodic cleanup to remove expired data:
```bash
curl -X POST "https://bgapp-api-worker.majearcasa.workers.dev/api/maintenance/cleanup"
```

### Data Freshness Tracking
Check when data was last updated:
```bash
curl "https://bgapp-api-worker.majearcasa.workers.dev/api/data-freshness"
```

## 🔄 Rollback Plan

If migration issues occur:

```bash
# Restore from backup
wrangler d1 import bgapp-data backup-YYYYMMDD.sql

# Or use backup tables
wrangler d1 execute bgapp-data --command="
  DROP TABLE IF EXISTS marine_data;
  ALTER TABLE _backup_marine_data RENAME TO marine_data;
"
```

## 📝 Next Steps

After successful migration:

1. ✅ Verify all endpoints return data correctly
2. ✅ Update frontend applications to use new endpoints
3. ✅ Configure scheduled cleanup job (Cloudflare Cron Triggers)
4. ✅ Set up monitoring for data freshness
5. ✅ Remove backup tables once stability confirmed

## 🎯 December Mission Alignment

This enhanced schema directly supports December presentation goals:

- **Real-time SST visualization**: Fast queries with spatial indexes
- **Vessel tracking heatmaps**: Pre-aggregated vessel_presence table
- **Fishing activity monitoring**: Dedicated fishing_events table with confidence scores
- **Multi-source integration**: Separate tables for Copernicus, GFW, NASA with data_source tracking
- **Performance monitoring**: Built-in API metrics and data freshness tracking
- **Professional polish**: Views provide clean, aggregated data for UI components

---

**Status**: Ready for production deployment
**Last Updated**: 2025-10-01
**Migration Script**: `infrastructure/workers/migrate-to-enhanced-schema.sql`