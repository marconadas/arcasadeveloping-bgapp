-- Weather Data Schema for BGAPP - Open-Meteo Integration
-- Adds meteorological data tables to D1 database
-- Run after schema-enhanced.sql

-- ========================================
-- Current Weather Data Table
-- ========================================

CREATE TABLE IF NOT EXISTS weather_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,

  -- Temperature parameters
  temperature REAL,                -- °C - surface temperature (2m)
  apparent_temperature REAL,       -- °C - "feels like" temperature
  temperature_80m REAL,            -- °C - temperature at 80m altitude
  temperature_120m REAL,           -- °C - temperature at 120m altitude
  temperature_180m REAL,           -- °C - temperature at 180m altitude

  -- Atmospheric conditions
  relative_humidity INTEGER,       -- % - relative humidity
  dew_point REAL,                 -- °C - dew point temperature
  pressure_msl REAL,              -- hPa - mean sea level pressure
  surface_pressure REAL,          -- hPa - surface pressure

  -- Precipitation
  precipitation REAL,             -- mm - total precipitation
  rain REAL,                      -- mm - rain amount
  precipitation_probability INTEGER, -- % - probability of precipitation

  -- Wind parameters (surface level)
  wind_speed_10m REAL,            -- km/h - wind speed at 10m
  wind_direction_10m INTEGER,     -- degrees - wind direction at 10m
  wind_gusts_10m REAL,            -- km/h - wind gusts at 10m

  -- Wind parameters (upper levels) - important for aviation and marine operations
  wind_speed_80m REAL,            -- km/h - wind speed at 80m
  wind_direction_80m INTEGER,     -- degrees - wind direction at 80m
  wind_speed_120m REAL,           -- km/h - wind speed at 120m
  wind_direction_120m INTEGER,    -- degrees - wind direction at 120m
  wind_speed_180m REAL,           -- km/h - wind speed at 180m
  wind_direction_180m INTEGER,    -- degrees - wind direction at 180m

  -- Visibility and cloud cover
  cloud_cover INTEGER,            -- % - total cloud cover
  visibility REAL,                -- meters - visibility distance

  -- Data quality and metadata
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_source TEXT DEFAULT 'open-meteo',
  quality_flag INTEGER DEFAULT 1,  -- 0=low, 1=medium, 2=high
  metadata TEXT                    -- JSON metadata
);

-- Indexes for weather_data
CREATE INDEX IF NOT EXISTS idx_weather_spatial
ON weather_data(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_weather_timestamp
ON weather_data(timestamp);

CREATE INDEX IF NOT EXISTS idx_weather_quality
ON weather_data(quality_flag, timestamp);

-- Composite index for spatial-temporal queries
CREATE INDEX IF NOT EXISTS idx_weather_spatial_temporal
ON weather_data(latitude, longitude, timestamp);

-- ========================================
-- Weather Forecast Data Table
-- ========================================

CREATE TABLE IF NOT EXISTS weather_forecast (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,

  -- Forecast time information
  forecast_date DATE NOT NULL,       -- Date of forecast
  forecast_hour INTEGER,             -- Hour of day (0-23)
  forecast_time DATETIME NOT NULL,   -- Full timestamp
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- When forecast was generated

  -- Temperature forecast
  temperature REAL,                  -- °C - hourly temperature
  temperature_max REAL,              -- °C - daily maximum
  temperature_min REAL,              -- °C - daily minimum
  apparent_temperature REAL,         -- °C - "feels like"

  -- Precipitation forecast
  precipitation_sum REAL,            -- mm - total daily precipitation
  precipitation REAL,                -- mm - hourly precipitation
  precipitation_probability INTEGER, -- % - probability
  rain REAL,                        -- mm - rain amount

  -- Wind forecast
  wind_speed_max REAL,              -- km/h - maximum daily wind speed
  wind_speed REAL,                  -- km/h - hourly wind speed
  wind_direction REAL,              -- degrees - wind direction
  wind_gusts REAL,                  -- km/h - wind gusts

  -- Other conditions
  cloud_cover INTEGER,              -- % - cloud cover
  relative_humidity INTEGER,        -- % - humidity
  pressure_msl REAL,               -- hPa - pressure

  -- Metadata
  data_source TEXT DEFAULT 'open-meteo',
  metadata TEXT                     -- JSON metadata
);

-- Indexes for weather_forecast
CREATE INDEX IF NOT EXISTS idx_forecast_spatial
ON weather_forecast(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_forecast_date
ON weather_forecast(forecast_date);

CREATE INDEX IF NOT EXISTS idx_forecast_time
ON weather_forecast(forecast_time);

CREATE INDEX IF NOT EXISTS idx_forecast_spatial_date
ON weather_forecast(latitude, longitude, forecast_date);

-- ========================================
-- Weather Grid Summary Table
-- For efficient map rendering
-- ========================================

CREATE TABLE IF NOT EXISTS weather_grid_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grid_id TEXT NOT NULL,            -- Format: "lat_lon" (e.g., "-12.5_13.2")

  -- Grid cell boundaries
  center_lat REAL NOT NULL,
  center_lon REAL NOT NULL,

  -- Aggregated weather data
  avg_temperature REAL,
  max_temperature REAL,
  min_temperature REAL,
  avg_wind_speed REAL,
  max_wind_speed REAL,
  dominant_wind_direction INTEGER,  -- Most common wind direction
  total_precipitation REAL,
  avg_cloud_cover INTEGER,
  avg_pressure REAL,

  -- Quality metrics
  data_points INTEGER DEFAULT 0,    -- Number of points in this grid cell
  quality_avg REAL,                 -- Average quality score

  -- Timestamps
  last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_start_time DATETIME,         -- Earliest data point in summary
  data_end_time DATETIME            -- Latest data point in summary
);

-- Unique constraint on grid_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_weather_grid_unique
ON weather_grid_summary(grid_id);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_weather_grid_spatial
ON weather_grid_summary(center_lat, center_lon);

-- Index for temporal queries
CREATE INDEX IF NOT EXISTS idx_weather_grid_update
ON weather_grid_summary(last_update);

-- ========================================
-- Weather Data Freshness Tracking
-- ========================================

CREATE TABLE IF NOT EXISTS weather_freshness (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_type TEXT NOT NULL,          -- 'current', 'forecast', 'grid'
  location_id TEXT,                 -- Grid ID or coordinate string
  last_fetched DATETIME DEFAULT CURRENT_TIMESTAMP,
  next_update DATETIME,             -- When to fetch next
  fetch_status TEXT DEFAULT 'success', -- 'success', 'error', 'pending'
  error_message TEXT,
  fetch_count INTEGER DEFAULT 0,
  metadata TEXT                     -- JSON metadata
);

-- Index for freshness tracking
CREATE INDEX IF NOT EXISTS idx_weather_freshness_type
ON weather_freshness(data_type, fetch_status);

CREATE INDEX IF NOT EXISTS idx_weather_freshness_update
ON weather_freshness(next_update);

-- ========================================
-- Views for Quick Analytics
-- ========================================

-- View: Latest weather conditions in Angola EEZ
CREATE VIEW IF NOT EXISTS v_latest_weather_angola AS
SELECT
  latitude,
  longitude,
  temperature,
  apparent_temperature,
  wind_speed_10m,
  wind_direction_10m,
  precipitation,
  cloud_cover,
  visibility,
  timestamp,
  data_source
FROM weather_data
WHERE latitude BETWEEN -18.02 AND -4.3      -- Angola EEZ bounds (Continental + Cabinda)
  AND longitude BETWEEN 8.3 AND 13.84
  AND timestamp > datetime('now', '-6 hours')  -- Last 6 hours
ORDER BY timestamp DESC;

-- View: Weather quality summary
CREATE VIEW IF NOT EXISTS v_weather_quality_summary AS
SELECT
  'current' as data_type,
  COUNT(*) as total_points,
  SUM(CASE WHEN quality_flag >= 1 THEN 1 ELSE 0 END) as good_quality_points,
  AVG(temperature) as avg_temperature,
  AVG(wind_speed_10m) as avg_wind_speed,
  MAX(timestamp) as latest_timestamp
FROM weather_data
WHERE timestamp > datetime('now', '-6 hours')
UNION ALL
SELECT
  'forecast' as data_type,
  COUNT(*) as total_points,
  COUNT(*) as good_quality_points,  -- Forecasts assumed good quality
  AVG(temperature) as avg_temperature,
  AVG(wind_speed) as avg_wind_speed,
  MAX(created_at) as latest_timestamp
FROM weather_forecast
WHERE created_at > datetime('now', '-24 hours');

-- View: Current weather by grid cell
CREATE VIEW IF NOT EXISTS v_weather_grid_current AS
SELECT
  grid_id,
  center_lat,
  center_lon,
  avg_temperature,
  avg_wind_speed,
  dominant_wind_direction,
  total_precipitation,
  avg_cloud_cover,
  data_points,
  last_update
FROM weather_grid_summary
WHERE last_update > datetime('now', '-6 hours')
ORDER BY last_update DESC;

-- ========================================
-- Triggers for Automatic Grid Updates
-- ========================================

-- Trigger: Update weather_freshness when new data is inserted
CREATE TRIGGER IF NOT EXISTS trg_update_weather_freshness
AFTER INSERT ON weather_data
BEGIN
  INSERT OR REPLACE INTO weather_freshness (
    data_type,
    location_id,
    last_fetched,
    next_update,
    fetch_status,
    fetch_count
  )
  VALUES (
    'current',
    CAST(ROUND(NEW.latitude, 1) AS TEXT) || '_' || CAST(ROUND(NEW.longitude, 1) AS TEXT),
    datetime('now'),
    datetime('now', '+6 hours'),
    'success',
    COALESCE((SELECT fetch_count FROM weather_freshness
              WHERE location_id = CAST(ROUND(NEW.latitude, 1) AS TEXT) || '_' || CAST(ROUND(NEW.longitude, 1) AS TEXT)), 0) + 1
  );
END;

-- ========================================
-- Initial Grid Population
-- ========================================

-- Insert grid cells for Angola EEZ (0.5 degree resolution)
-- Continental Angola: -17.5 to -5.5 lat, 8.5 to 13.5 lon
-- Cabinda: -5.5 to -4.5 lat, 12.0 to 13.5 lon

INSERT OR IGNORE INTO weather_grid_summary (grid_id, center_lat, center_lon, data_points)
WITH RECURSIVE
  lats(lat) AS (
    SELECT -17.5
    UNION ALL
    SELECT lat + 0.5 FROM lats WHERE lat < -4.0
  ),
  lons(lon) AS (
    SELECT 8.5
    UNION ALL
    SELECT lon + 0.5 FROM lons WHERE lon < 14.0
  )
SELECT
  CAST(lat AS TEXT) || '_' || CAST(lon AS TEXT) as grid_id,
  lat as center_lat,
  lon as center_lon,
  0 as data_points
FROM lats, lons
WHERE (
  -- Continental Angola
  (lat BETWEEN -17.5 AND -5.5 AND lon BETWEEN 8.5 AND 13.5)
  OR
  -- Cabinda
  (lat BETWEEN -5.5 AND -4.0 AND lon BETWEEN 12.0 AND 13.5)
);

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
-- Weather schema complete!
-- New features:
-- - Current weather data table with multi-level wind measurements
-- - Weather forecast table for 7-day predictions
-- - Grid summary table for efficient map rendering
-- - Freshness tracking for intelligent cache updates
-- - Views for quick analytics
-- - Triggers for automatic updates
-- - Pre-populated grid cells for Angola EEZ
