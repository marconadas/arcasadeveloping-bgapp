-- Create Temporal Indexes for Time-Series Animation Performance
-- Migration: create-timeseries-indexes.sql
-- Date: 2025-10-28
-- Purpose: Optimize temporal queries for weather animations (30-day playback)

-- SST Data (Sea Surface Temperature) - 120 frames (6-hour intervals)
CREATE INDEX IF NOT EXISTS idx_sst_data_timestamp_spatial
ON sst_data(timestamp DESC, latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_sst_data_spatial_timestamp
ON sst_data(latitude, longitude, timestamp DESC)
WHERE latitude BETWEEN -18.02 AND -4.3
  AND longitude BETWEEN 8.30 AND 13.84;

CREATE INDEX IF NOT EXISTS idx_sst_data_recent
ON sst_data(timestamp DESC)
WHERE timestamp >= datetime('now', '-30 days');

-- Ocean Color Data (Chlorophyll-a) - 30 frames (daily intervals)
CREATE INDEX IF NOT EXISTS idx_ocean_color_timestamp_spatial
ON ocean_color_data(timestamp DESC, latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_ocean_color_spatial_timestamp
ON ocean_color_data(latitude, longitude, timestamp DESC)
WHERE latitude BETWEEN -18.02 AND -4.3
  AND longitude BETWEEN 8.30 AND 13.84;

CREATE INDEX IF NOT EXISTS idx_ocean_color_recent
ON ocean_color_data(timestamp DESC)
WHERE timestamp >= datetime('now', '-30 days');

-- Salinity Data - 120 frames (6-hour intervals)
CREATE INDEX IF NOT EXISTS idx_salinity_timestamp_spatial
ON salinity_data(timestamp DESC, latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_salinity_spatial_timestamp
ON salinity_data(latitude, longitude, timestamp DESC)
WHERE latitude BETWEEN -18.02 AND -4.3
  AND longitude BETWEEN 8.30 AND 13.84;

CREATE INDEX IF NOT EXISTS idx_salinity_recent
ON salinity_data(timestamp DESC)
WHERE timestamp >= datetime('now', '-30 days');

-- Vessel Lights Data - Real-time vessel detection
CREATE INDEX IF NOT EXISTS idx_vessel_lights_timestamp_spatial
ON vessel_lights_data(timestamp DESC, latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_vessel_lights_recent_high_radiance
ON vessel_lights_data(timestamp DESC, radiance DESC)
WHERE timestamp >= datetime('now', '-7 days')
  AND radiance >= 5.0;

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

-- Populate frames metadata for last 30 days SST data
INSERT INTO timeseries_frames_metadata (data_type, frame_timestamp, frame_index, data_points, min_value, max_value, avg_value)
SELECT
    'sst' as data_type,
    timestamp as frame_timestamp,
    ROW_NUMBER() OVER (ORDER BY timestamp) as frame_index,
    COUNT(*) as data_points,
    MIN(temperature) as min_value,
    MAX(temperature) as max_value,
    AVG(temperature) as avg_value
FROM sst_data
WHERE timestamp >= datetime('now', '-30 days')
  AND latitude BETWEEN -18.02 AND -4.3
  AND longitude BETWEEN 8.30 AND 13.84
GROUP BY timestamp
ORDER BY timestamp;

-- Populate frames metadata for last 30 days ocean color data
INSERT INTO timeseries_frames_metadata (data_type, frame_timestamp, frame_index, data_points, min_value, max_value, avg_value)
SELECT
    'ocean_color' as data_type,
    timestamp as frame_timestamp,
    ROW_NUMBER() OVER (ORDER BY timestamp) as frame_index,
    COUNT(*) as data_points,
    MIN(chlorophyll_a) as min_value,
    MAX(chlorophyll_a) as max_value,
    AVG(chlorophyll_a) as avg_value
FROM ocean_color_data
WHERE timestamp >= datetime('now', '-30 days')
  AND latitude BETWEEN -18.02 AND -4.3
  AND longitude BETWEEN 8.30 AND 13.84
GROUP BY timestamp
ORDER BY timestamp;

-- Populate frames metadata for last 30 days salinity data
INSERT INTO timeseries_frames_metadata (data_type, frame_timestamp, frame_index, data_points, min_value, max_value, avg_value)
SELECT
    'salinity' as data_type,
    timestamp as frame_timestamp,
    ROW_NUMBER() OVER (ORDER BY timestamp) as frame_index,
    COUNT(*) as data_points,
    MIN(salinity) as min_value,
    MAX(salinity) as max_value,
    AVG(salinity) as avg_value
FROM salinity_data
WHERE timestamp >= datetime('now', '-30 days')
  AND latitude BETWEEN -18.02 AND -4.3
  AND longitude BETWEEN 8.30 AND 13.84
GROUP BY timestamp
ORDER BY timestamp;

-- Verify migration and performance
SELECT
    'Performance Summary' as report,
    (SELECT COUNT(*) FROM sst_data WHERE timestamp >= datetime('now', '-30 days')) as sst_30d_points,
    (SELECT COUNT(*) FROM ocean_color_data WHERE timestamp >= datetime('now', '-30 days')) as ocean_color_30d_points,
    (SELECT COUNT(*) FROM salinity_data WHERE timestamp >= datetime('now', '-30 days')) as salinity_30d_points,
    (SELECT COUNT(DISTINCT timestamp) FROM sst_data WHERE timestamp >= datetime('now', '-30 days')) as sst_frames,
    (SELECT COUNT(DISTINCT timestamp) FROM ocean_color_data WHERE timestamp >= datetime('now', '-30 days')) as ocean_color_frames,
    (SELECT COUNT(DISTINCT timestamp) FROM salinity_data WHERE timestamp >= datetime('now', '-30 days')) as salinity_frames;

-- Show frames metadata summary
SELECT
    data_type,
    COUNT(*) as total_frames,
    MIN(frame_timestamp) as earliest_frame,
    MAX(frame_timestamp) as latest_frame,
    ROUND(AVG(data_points), 0) as avg_points_per_frame,
    ROUND(MIN(min_value), 2) as global_min,
    ROUND(MAX(max_value), 2) as global_max
FROM timeseries_frames_metadata
GROUP BY data_type
ORDER BY data_type;
