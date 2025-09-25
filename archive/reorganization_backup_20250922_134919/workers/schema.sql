-- BGAPP D1 Database Schema
-- Real data storage for oceanographic and marine data

-- Marine data cache table
CREATE TABLE IF NOT EXISTS marine_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_bbox TEXT NOT NULL, -- "lat1,lon1,lat2,lon2"
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_source TEXT NOT NULL, -- 'copernicus', 'gfw', 'stac'
  data_type TEXT NOT NULL, -- 'temperature', 'salinity', 'vessel_presence'
  data_value REAL,
  metadata TEXT, -- JSON metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME -- TTL for cache invalidation
);

-- Vessel tracking data
CREATE TABLE IF NOT EXISTS vessel_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vessel_id TEXT NOT NULL,
  vessel_name TEXT,
  vessel_type TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  timestamp DATETIME NOT NULL,
  speed REAL,
  heading REAL,
  data_source TEXT DEFAULT 'gfw',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API health metrics
CREATE TABLE IF NOT EXISTS api_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  response_time INTEGER NOT NULL, -- milliseconds
  status_code INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marine_data_bbox ON marine_data(location_bbox);
CREATE INDEX IF NOT EXISTS idx_marine_data_timestamp ON marine_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_vessel_data_location ON vessel_data(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_vessel_data_timestamp ON vessel_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON api_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_metrics_timestamp ON api_metrics(timestamp);