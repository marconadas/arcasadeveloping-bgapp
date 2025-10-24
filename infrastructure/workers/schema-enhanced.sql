-- Enhanced D1 Database Schema for BGAPP
-- Adds quality metrics and performance optimizations
-- Run this after initial schema.sql to enhance existing tables

-- ========================================
-- Add Quality Columns to Existing Tables
-- ========================================

-- Enhance sst_data table
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS
-- We'll attempt to add columns, errors are expected if they already exist

-- Add quality_score to sst_data (used for visualization priority)
ALTER TABLE sst_data ADD COLUMN quality_score REAL DEFAULT 0.8;

-- Add spatial_resolution_km to sst_data (for adaptive rendering)
ALTER TABLE sst_data ADD COLUMN spatial_resolution_km REAL DEFAULT 5.5;

-- Add quality_score to ocean_color_data
ALTER TABLE ocean_color_data ADD COLUMN quality_score REAL DEFAULT 0.8;

-- Add spatial_resolution_km to ocean_color_data
ALTER TABLE ocean_color_data ADD COLUMN spatial_resolution_km REAL DEFAULT 5.5;

-- Add quality_score to salinity_data
ALTER TABLE salinity_data ADD COLUMN quality_score REAL DEFAULT 0.75;

-- Add spatial_resolution_km to salinity_data
ALTER TABLE salinity_data ADD COLUMN spatial_resolution_km REAL DEFAULT 6.6;

-- ========================================
-- Data Quality Metrics Table
-- ========================================

CREATE TABLE IF NOT EXISTS data_quality_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_type TEXT NOT NULL, -- 'sst', 'ocean_color', 'salinity', 'vessel_lights'
  data_source TEXT NOT NULL, -- 'nasa', 'copernicus', 'gfw'
  point_count INTEGER DEFAULT 0,
  avg_quality REAL DEFAULT 0.5,
  spatial_coverage_percent REAL DEFAULT 0.0,
  temporal_coverage_hours INTEGER DEFAULT 0,
  last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
  bbox TEXT, -- "minLon,minLat,maxLon,maxLat"
  metadata TEXT -- JSON metadata
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_quality_metrics_type_source 
ON data_quality_metrics(data_type, data_source);

CREATE INDEX IF NOT EXISTS idx_quality_metrics_update 
ON data_quality_metrics(last_update);

-- ========================================
-- Data Freshness Tracking Table
-- ========================================

CREATE TABLE IF NOT EXISTS data_freshness (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_type TEXT NOT NULL,
  data_source TEXT NOT NULL,
  last_populated DATETIME DEFAULT CURRENT_TIMESTAMP,
  record_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'stale', 'error'
  error_message TEXT,
  bbox TEXT,
  metadata TEXT
);

-- Index for status checks
CREATE INDEX IF NOT EXISTS idx_freshness_type_source 
ON data_freshness(data_type, data_source);

CREATE INDEX IF NOT EXISTS idx_freshness_populated 
ON data_freshness(last_populated);

-- ========================================
-- Spatial Grid Index Table (for fast lookups)
-- ========================================

CREATE TABLE IF NOT EXISTS spatial_grid_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grid_id TEXT NOT NULL, -- Format: "lat_lon" e.g., "-12.5_13.2"
  data_type TEXT NOT NULL,
  point_count INTEGER DEFAULT 0,
  avg_value REAL,
  min_value REAL,
  max_value REAL,
  quality_avg REAL,
  last_update DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint on grid_id + data_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_spatial_grid_unique 
ON spatial_grid_index(grid_id, data_type);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_spatial_grid_type 
ON spatial_grid_index(data_type, last_update);

-- ========================================
-- Performance Optimization Indexes
-- ========================================

-- Additional indexes for existing tables if not present

-- SST data - optimize for quality and spatial queries
CREATE INDEX IF NOT EXISTS idx_sst_quality_timestamp 
ON sst_data(quality_flag, timestamp);

CREATE INDEX IF NOT EXISTS idx_sst_spatial_quality 
ON sst_data(latitude, longitude, quality_flag);

-- Ocean color - optimize for quality and spatial queries
CREATE INDEX IF NOT EXISTS idx_ocean_quality_timestamp 
ON ocean_color_data(quality_flag, timestamp);

CREATE INDEX IF NOT EXISTS idx_ocean_spatial_quality 
ON ocean_color_data(latitude, longitude, quality_flag);

-- Salinity - optimize for quality and spatial queries
CREATE INDEX IF NOT EXISTS idx_salinity_quality_timestamp 
ON salinity_data(quality_flag, timestamp);

CREATE INDEX IF NOT EXISTS idx_salinity_spatial_quality 
ON salinity_data(latitude, longitude, quality_flag);

-- Vessel lights - optimize for timestamp queries
CREATE INDEX IF NOT EXISTS idx_vessel_lights_timestamp 
ON vessel_lights_data(timestamp);

-- ========================================
-- Views for Quick Analytics
-- ========================================

-- View: Latest high-quality SST data
CREATE VIEW IF NOT EXISTS v_latest_sst_quality AS
SELECT
  latitude, 
  longitude, 
  temperature,
  quality_flag,
  quality_score,
  data_source,
  timestamp
FROM sst_data
WHERE quality_flag >= 1
  AND timestamp > datetime('now', '-48 hours')
ORDER BY quality_flag DESC, timestamp DESC;

-- View: Latest high-quality ocean color data
CREATE VIEW IF NOT EXISTS v_latest_ocean_color_quality AS
SELECT
  latitude,
  longitude,
  chlorophyll_a,
  quality_flag,
  quality_score,
  data_source,
  timestamp
FROM ocean_color_data
WHERE quality_flag >= 1
  AND timestamp > datetime('now', '-48 hours')
  AND chlorophyll_a BETWEEN 0.01 AND 100
ORDER BY quality_flag DESC, timestamp DESC;

-- View: Data quality summary
CREATE VIEW IF NOT EXISTS v_data_quality_summary AS
SELECT 
  'sst' as data_type,
  COUNT(*) as total_points,
  SUM(CASE WHEN quality_flag >= 1 THEN 1 ELSE 0 END) as high_quality_points,
  AVG(quality_score) as avg_quality_score,
  MAX(timestamp) as latest_timestamp
FROM sst_data
WHERE timestamp > datetime('now', '-48 hours')
UNION ALL
SELECT 
  'ocean_color' as data_type,
  COUNT(*) as total_points,
  SUM(CASE WHEN quality_flag >= 1 THEN 1 ELSE 0 END) as high_quality_points,
  AVG(quality_score) as avg_quality_score,
  MAX(timestamp) as latest_timestamp
FROM ocean_color_data
WHERE timestamp > datetime('now', '-48 hours')
UNION ALL
SELECT 
  'salinity' as data_type,
  COUNT(*) as total_points,
  SUM(CASE WHEN quality_flag >= 1 THEN 1 ELSE 0 END) as high_quality_points,
  AVG(quality_score) as avg_quality_score,
  MAX(timestamp) as latest_timestamp
FROM salinity_data
WHERE timestamp > datetime('now', '-48 hours');

-- ========================================
-- Maintenance Functions (via Triggers)
-- ========================================

-- Trigger: Update data_freshness when new SST data is inserted
CREATE TRIGGER IF NOT EXISTS trg_update_freshness_sst
AFTER INSERT ON sst_data
BEGIN
  INSERT OR REPLACE INTO data_freshness (
    data_type, data_source, last_populated, record_count, status
  )
  SELECT 
    'sst',
    NEW.data_source,
    datetime('now'),
    COUNT(*),
    'active'
  FROM sst_data
  WHERE data_source = NEW.data_source;
END;

-- Trigger: Update data_freshness when new ocean color data is inserted
CREATE TRIGGER IF NOT EXISTS trg_update_freshness_ocean_color
AFTER INSERT ON ocean_color_data
BEGIN
  INSERT OR REPLACE INTO data_freshness (
    data_type, data_source, last_populated, record_count, status
  )
  SELECT 
    'ocean_color',
    NEW.data_source,
    datetime('now'),
    COUNT(*),
    'active'
  FROM ocean_color_data
  WHERE data_source = NEW.data_source;
END;

-- ========================================
-- Initial Data Quality Metrics
-- ========================================

-- Insert initial quality metrics (will be updated by population scripts)
INSERT OR IGNORE INTO data_quality_metrics (
  data_type, data_source, point_count, avg_quality, spatial_coverage_percent
) VALUES
  ('sst', 'nasa', 0, 0.0, 0.0),
  ('sst', 'copernicus', 0, 0.0, 0.0),
  ('ocean_color', 'nasa', 0, 0.0, 0.0),
  ('ocean_color', 'copernicus', 0, 0.0, 0.0),
  ('salinity', 'nasa', 0, 0.0, 0.0),
  ('salinity', 'copernicus', 0, 0.0, 0.0),
  ('vessel_lights', 'nasa', 0, 0.0, 0.0);

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
-- Schema enhancements complete!
-- New features:
-- - Quality scoring columns for adaptive rendering
-- - Spatial resolution tracking
-- - Data quality metrics table
-- - Data freshness tracking
-- - Spatial grid index for performance
-- - Optimized indexes for common queries
-- - Views for quick analytics
-- - Triggers for automatic freshness updates
