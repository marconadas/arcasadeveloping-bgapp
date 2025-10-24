-- Migration Script: Legacy Schema to Enhanced Schema
-- Safe migration preserving existing data

-- =============================================================================
-- STEP 1: Backup existing data
-- =============================================================================

-- Create backup tables
CREATE TABLE IF NOT EXISTS _backup_marine_data AS SELECT * FROM marine_data;
CREATE TABLE IF NOT EXISTS _backup_vessel_data AS SELECT * FROM vessel_data;
CREATE TABLE IF NOT EXISTS _backup_api_metrics AS SELECT * FROM api_metrics;

-- =============================================================================
-- STEP 2: Create new enhanced tables
-- =============================================================================

-- SST data
CREATE TABLE IF NOT EXISTS sst_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  temperature REAL NOT NULL,
  timestamp DATETIME NOT NULL,
  data_source TEXT NOT NULL,
  quality_flag INTEGER,
  bbox TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

-- Ocean color data
CREATE TABLE IF NOT EXISTS ocean_color_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  chlorophyll_a REAL,
  turbidity REAL,
  kd_490 REAL,
  pic REAL,
  poc REAL,
  timestamp DATETIME NOT NULL,
  data_source TEXT NOT NULL,
  quality_flag INTEGER,
  bbox TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

-- Salinity data
CREATE TABLE IF NOT EXISTS salinity_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  salinity REAL NOT NULL,
  depth REAL,
  timestamp DATETIME NOT NULL,
  data_source TEXT DEFAULT 'copernicus',
  quality_flag INTEGER,
  bbox TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

-- Current data
CREATE TABLE IF NOT EXISTS current_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  u_velocity REAL,
  v_velocity REAL,
  speed REAL,
  direction REAL,
  depth REAL,
  timestamp DATETIME NOT NULL,
  data_source TEXT DEFAULT 'copernicus',
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

-- Wave data
CREATE TABLE IF NOT EXISTS wave_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  significant_wave_height REAL,
  mean_wave_period REAL,
  wave_direction REAL,
  timestamp DATETIME NOT NULL,
  data_source TEXT DEFAULT 'copernicus',
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

-- Enhanced vessel data
-- NOTE: vessel_data table already exists, adding missing columns via ALTER TABLE
-- Existing columns: id, vessel_id, vessel_name, vessel_type, latitude, longitude, timestamp, speed, heading, data_source, created_at
-- Adding: mmsi, flag, fishing_activity_probability, in_eez, distance_from_port, metadata

-- Add missing columns to existing vessel_data table (SQLite doesn't support ADD COLUMN IF NOT EXISTS, so these may fail if columns exist)
-- ALTER TABLE vessel_data ADD COLUMN mmsi TEXT;
-- ALTER TABLE vessel_data ADD COLUMN flag TEXT;
-- ALTER TABLE vessel_data ADD COLUMN fishing_activity_probability REAL;
-- ALTER TABLE vessel_data ADD COLUMN in_eez TEXT;
-- ALTER TABLE vessel_data ADD COLUMN distance_from_port REAL;
-- ALTER TABLE vessel_data ADD COLUMN metadata TEXT;

-- Vessel presence
CREATE TABLE IF NOT EXISTS vessel_presence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grid_cell_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  vessel_count INTEGER NOT NULL,
  fishing_vessel_count INTEGER,
  time_period TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  data_source TEXT DEFAULT 'gfw',
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fishing events
CREATE TABLE IF NOT EXISTS fishing_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vessel_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  start_latitude REAL NOT NULL,
  start_longitude REAL NOT NULL,
  end_latitude REAL,
  end_longitude REAL,
  duration_hours REAL,
  confidence_score REAL,
  in_eez TEXT,
  in_mpa TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vessel lights
CREATE TABLE IF NOT EXISTS vessel_lights_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radiance REAL NOT NULL,
  timestamp DATETIME NOT NULL,
  quality_flag INTEGER,
  potential_vessel_activity REAL,
  bbox TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

-- EEZ boundaries
CREATE TABLE IF NOT EXISTS eez_boundaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  eez_id TEXT UNIQUE NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  geometry TEXT NOT NULL,
  area_km2 REAL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- MPA boundaries
CREATE TABLE IF NOT EXISTS mpa_boundaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mpa_id TEXT UNIQUE NOT NULL,
  mpa_name TEXT NOT NULL,
  protection_level TEXT,
  geometry TEXT NOT NULL,
  area_km2 REAL,
  established_date DATE,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ports
CREATE TABLE IF NOT EXISTS ports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  port_id TEXT UNIQUE NOT NULL,
  port_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  port_type TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced API metrics
CREATE TABLE IF NOT EXISTS api_metrics_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  http_method TEXT NOT NULL,
  response_time INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  request_params TEXT,
  error_message TEXT,
  data_source TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Data freshness
CREATE TABLE IF NOT EXISTS data_freshness (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_type TEXT NOT NULL,
  data_source TEXT NOT NULL,
  last_update DATETIME NOT NULL,
  record_count INTEGER,
  bbox TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cache metadata
CREATE TABLE IF NOT EXISTS cache_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT UNIQUE NOT NULL,
  data_type TEXT NOT NULL,
  bbox TEXT,
  timestamp DATETIME NOT NULL,
  ttl INTEGER NOT NULL,
  size_bytes INTEGER,
  hit_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- ML predictions
CREATE TABLE IF NOT EXISTS ml_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  prediction_type TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  timestamp DATETIME NOT NULL,
  prediction_value REAL,
  confidence REAL,
  input_features TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Anomalies
CREATE TABLE IF NOT EXISTS anomalies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anomaly_type TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  severity REAL NOT NULL,
  timestamp DATETIME NOT NULL,
  data_sources TEXT,
  description TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- STEP 3: Migrate existing data
-- =============================================================================

-- NOTE: marine_data table has schema: location_bbox, data_type, data_value (not latitude/longitude/value)
-- Migration requires parsing bbox or cannot migrate spatial data
-- Skipping marine_data migration - table structure incompatible with enhanced schema
-- Future: Add bbox parsing logic to extract center coordinates from location_bbox

-- NOTE: vessel_data table already exists with data, no migration needed from 'vessels' table
-- The vessel_data table will be enhanced with additional columns when uncommented above
-- Existing vessel data is preserved in the table

-- Migrate API metrics
INSERT INTO api_metrics_new (endpoint, http_method, response_time, status_code, timestamp)
SELECT
  endpoint,
  'GET' AS http_method,
  response_time,
  status_code,
  timestamp
FROM api_metrics;

-- =============================================================================
-- STEP 4: Create indexes
-- =============================================================================

-- SST indexes
CREATE INDEX IF NOT EXISTS idx_sst_location ON sst_data(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_sst_timestamp ON sst_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_sst_bbox ON sst_data(bbox);
CREATE INDEX IF NOT EXISTS idx_sst_source ON sst_data(data_source);

-- Ocean color indexes
CREATE INDEX IF NOT EXISTS idx_ocean_color_location ON ocean_color_data(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_ocean_color_timestamp ON ocean_color_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_ocean_color_bbox ON ocean_color_data(bbox);

-- Salinity indexes
CREATE INDEX IF NOT EXISTS idx_salinity_location ON salinity_data(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_salinity_timestamp ON salinity_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_salinity_bbox ON salinity_data(bbox);

-- Current indexes
CREATE INDEX IF NOT EXISTS idx_current_location ON current_data(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_current_timestamp ON current_data(timestamp);

-- Wave indexes
CREATE INDEX IF NOT EXISTS idx_wave_location ON wave_data(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_wave_timestamp ON wave_data(timestamp);

-- Vessel indexes (only for existing columns - mmsi and in_eez will be indexed after column addition)
CREATE INDEX IF NOT EXISTS idx_vessel_data_id ON vessel_data(vessel_id);
CREATE INDEX IF NOT EXISTS idx_vessel_data_location ON vessel_data(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_vessel_data_timestamp ON vessel_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_vessel_data_type ON vessel_data(vessel_type);

-- Vessel presence indexes
CREATE INDEX IF NOT EXISTS idx_vessel_presence_grid ON vessel_presence(grid_cell_id);
CREATE INDEX IF NOT EXISTS idx_vessel_presence_timestamp ON vessel_presence(timestamp);

-- Fishing events indexes
CREATE INDEX IF NOT EXISTS idx_fishing_events_vessel ON fishing_events(vessel_id);
CREATE INDEX IF NOT EXISTS idx_fishing_events_type ON fishing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_fishing_events_time ON fishing_events(start_time);
CREATE INDEX IF NOT EXISTS idx_fishing_events_eez ON fishing_events(in_eez);

-- Vessel lights indexes
CREATE INDEX IF NOT EXISTS idx_vessel_lights_location ON vessel_lights_data(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_vessel_lights_timestamp ON vessel_lights_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_vessel_lights_bbox ON vessel_lights_data(bbox);

-- Spatial boundaries indexes
CREATE INDEX IF NOT EXISTS idx_eez_country ON eez_boundaries(country_code);
CREATE INDEX IF NOT EXISTS idx_mpa_name ON mpa_boundaries(mpa_name);
CREATE INDEX IF NOT EXISTS idx_ports_country ON ports(country_code);
CREATE INDEX IF NOT EXISTS idx_ports_location ON ports(latitude, longitude);

-- API metrics indexes
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON api_metrics_new(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_metrics_timestamp ON api_metrics_new(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_metrics_status ON api_metrics_new(status_code);
CREATE INDEX IF NOT EXISTS idx_api_metrics_source ON api_metrics_new(data_source);

-- Data freshness indexes
CREATE INDEX IF NOT EXISTS idx_data_freshness_type ON data_freshness(data_type);
CREATE INDEX IF NOT EXISTS idx_data_freshness_source ON data_freshness(data_source);
CREATE INDEX IF NOT EXISTS idx_data_freshness_update ON data_freshness(last_update);

-- Cache indexes
CREATE INDEX IF NOT EXISTS idx_cache_key ON cache_metadata(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_metadata(expires_at);

-- ML indexes
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model ON ml_predictions(model_name);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_location ON ml_predictions(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_timestamp ON ml_predictions(timestamp);

-- Anomaly indexes
CREATE INDEX IF NOT EXISTS idx_anomalies_type ON anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomalies_location ON anomalies(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_anomalies_timestamp ON anomalies(timestamp);

-- =============================================================================
-- STEP 5: Create views
-- =============================================================================

CREATE VIEW IF NOT EXISTS recent_vessel_activity AS
SELECT
  vessel_id,
  vessel_name,
  vessel_type,
  COUNT(*) as position_count,
  MAX(timestamp) as last_seen,
  AVG(latitude) as avg_latitude,
  AVG(longitude) as avg_longitude,
  AVG(speed) as avg_speed,
  in_eez
FROM vessel_data
WHERE timestamp > datetime('now', '-24 hours')
GROUP BY vessel_id, in_eez;

CREATE VIEW IF NOT EXISTS latest_environmental_conditions AS
SELECT
  s.latitude,
  s.longitude,
  s.temperature as sst,
  o.chlorophyll_a,
  sa.salinity,
  s.timestamp as sst_timestamp,
  o.timestamp as ocean_color_timestamp,
  sa.timestamp as salinity_timestamp
FROM sst_data s
LEFT JOIN ocean_color_data o ON
  ABS(s.latitude - o.latitude) < 0.1 AND
  ABS(s.longitude - o.longitude) < 0.1
LEFT JOIN salinity_data sa ON
  ABS(s.latitude - sa.latitude) < 0.1 AND
  ABS(s.longitude - sa.longitude) < 0.1
WHERE s.timestamp > datetime('now', '-7 days');

CREATE VIEW IF NOT EXISTS fishing_hotspots AS
SELECT
  grid_cell_id,
  latitude,
  longitude,
  SUM(fishing_vessel_count) as total_fishing_vessels,
  COUNT(*) as observation_count,
  MAX(timestamp) as last_updated
FROM vessel_presence
WHERE time_period = 'day'
  AND timestamp > datetime('now', '-30 days')
GROUP BY grid_cell_id
HAVING total_fishing_vessels > 5
ORDER BY total_fishing_vessels DESC;

-- =============================================================================
-- STEP 6: Cleanup (OPTIONAL - Run after verification)
-- =============================================================================

-- After verifying migration success, you can drop old tables:
-- DROP TABLE IF EXISTS marine_data;
-- DROP TABLE IF EXISTS vessels;
-- DROP TABLE IF EXISTS gfw_cache;
-- DROP TABLE IF EXISTS api_metrics;
--
-- Rename new api_metrics:
-- DROP TABLE IF EXISTS api_metrics;
-- ALTER TABLE api_metrics_new RENAME TO api_metrics;

-- =============================================================================
-- Migration complete. Verify data integrity before dropping backup tables.
-- =============================================================================