-- Create Temporal Indexes for Time-Series Animation Performance (FIXED)
-- Migration: create-timeseries-indexes-fixed.sql
-- Date: 2025-10-28
-- Purpose: Optimize temporal queries for weather animations (30-day playback)
-- Fix: Removed datetime('now') from partial indexes (not allowed in SQLite)

-- SST Data (Sea Surface Temperature) - 120 frames (6-hour intervals)
CREATE INDEX IF NOT EXISTS idx_sst_data_timestamp_spatial
ON sst_data(timestamp DESC, latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_sst_data_spatial_timestamp
ON sst_data(latitude, longitude, timestamp DESC)
WHERE latitude BETWEEN -18.02 AND -4.3
  AND longitude BETWEEN 8.30 AND 13.84;

-- Removed datetime('now') partial index - will use regular index instead
CREATE INDEX IF NOT EXISTS idx_sst_data_recent
ON sst_data(timestamp DESC);

-- Ocean Color Data (Chlorophyll-a) - 30 frames (daily intervals)
CREATE INDEX IF NOT EXISTS idx_ocean_color_timestamp_spatial
ON ocean_color_data(timestamp DESC, latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_ocean_color_spatial_timestamp
ON ocean_color_data(latitude, longitude, timestamp DESC)
WHERE latitude BETWEEN -18.02 AND -4.3
  AND longitude BETWEEN 8.30 AND 13.84;

CREATE INDEX IF NOT EXISTS idx_ocean_color_recent
ON ocean_color_data(timestamp DESC);

-- Salinity Data - 120 frames (6-hour intervals)
CREATE INDEX IF NOT EXISTS idx_salinity_timestamp_spatial
ON salinity_data(timestamp DESC, latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_salinity_spatial_timestamp
ON salinity_data(latitude, longitude, timestamp DESC)
WHERE latitude BETWEEN -18.02 AND -4.3
  AND longitude BETWEEN 8.30 AND 13.84;

CREATE INDEX IF NOT EXISTS idx_salinity_recent
ON salinity_data(timestamp DESC);

-- Vessel Lights Data - Real-time vessel detection
CREATE INDEX IF NOT EXISTS idx_vessel_lights_timestamp_spatial
ON vessel_lights_data(timestamp DESC, latitude, longitude);

-- Removed datetime('now') and radiance filter from partial index
CREATE INDEX IF NOT EXISTS idx_vessel_lights_recent_high_radiance
ON vessel_lights_data(timestamp DESC, radiance DESC);

-- Composite index for animation frame queries
-- Optimizes: "Get all data for timestamp T within Angola EEZ bounds"
CREATE INDEX IF NOT EXISTS idx_sst_animation_frame
ON sst_data(timestamp, latitude, longitude, temperature)
WHERE latitude BETWEEN -18.02 AND -4.3
  AND longitude BETWEEN 8.30 AND 13.84;

CREATE INDEX IF NOT EXISTS idx_ocean_color_animation_frame
ON ocean_color_data(timestamp, latitude, longitude, chlorophyll_a)
WHERE latitude BETWEEN -18.02 AND -4.3
  AND longitude BETWEEN 8.30 AND 13.84;

CREATE INDEX IF NOT EXISTS idx_salinity_animation_frame
ON salinity_data(timestamp, latitude, longitude, salinity)
WHERE latitude BETWEEN -18.02 AND -4.3
  AND longitude BETWEEN 8.30 AND 13.84;

-- Create materialized view for time-series metadata (frame timestamps)
-- This dramatically speeds up timeline UI rendering
CREATE TABLE IF NOT EXISTS timeseries_frames_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_type TEXT NOT NULL CHECK (data_type IN ('sst', 'ocean_color', 'salinity', 'vessel_lights')),
    frame_timestamp TEXT NOT NULL,
    frame_index INTEGER NOT NULL,
    data_points INTEGER NOT NULL,
    coverage_area_km2 REAL,
    min_value REAL,
    max_value REAL,
    avg_value REAL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_timeseries_frames_type_timestamp
ON timeseries_frames_metadata(data_type, frame_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_timeseries_frames_index
ON timeseries_frames_metadata(data_type, frame_index);

-- Note: Frame metadata population will be done by populate-historical-oceanographic.js worker
-- after historical data is populated, to avoid inserting empty frames

-- Verify migration and performance
SELECT
    'Performance Summary' as report,
    (SELECT COUNT(*) FROM sst_data) as sst_total_points,
    (SELECT COUNT(*) FROM ocean_color_data) as ocean_color_total_points,
    (SELECT COUNT(*) FROM salinity_data) as salinity_total_points,
    (SELECT COUNT(DISTINCT timestamp) FROM sst_data) as sst_unique_timestamps,
    (SELECT COUNT(DISTINCT timestamp) FROM ocean_color_data) as ocean_color_unique_timestamps,
    (SELECT COUNT(DISTINCT timestamp) FROM salinity_data) as salinity_unique_timestamps;
