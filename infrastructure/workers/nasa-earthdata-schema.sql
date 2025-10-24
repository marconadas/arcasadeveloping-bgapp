-- NASA Earth Data Schema for BGAPP D1 Database
-- Created for NASA Earthdata API integration with data retention

-- Ocean color measurements table (MODIS/VIIRS data)
CREATE TABLE IF NOT EXISTS nasa_ocean_color (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    measurement_date DATETIME NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    chlorophyll_a REAL,
    turbidity REAL,
    water_leaving_radiance TEXT, -- JSON array of spectral bands
    quality_flags INTEGER,
    dataset_id TEXT NOT NULL,
    granule_id TEXT,
    processing_level TEXT DEFAULT 'L2',
    within_angola_eez BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(measurement_date, latitude, longitude, dataset_id)
);

-- Sea surface temperature measurements (GHRSST data)
CREATE TABLE IF NOT EXISTS nasa_sst (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    measurement_date DATETIME NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    sst_celsius REAL NOT NULL,
    sst_quality INTEGER,
    sst_anomaly REAL,
    wind_speed REAL,
    dataset_id TEXT NOT NULL,
    granule_id TEXT,
    sensor TEXT, -- MODIS, VIIRS, etc.
    processing_level TEXT DEFAULT 'L3',
    within_angola_eez BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(measurement_date, latitude, longitude, sensor)
);

-- Sea surface salinity measurements (SMAP data)
CREATE TABLE IF NOT EXISTS nasa_salinity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    measurement_date DATETIME NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    salinity_psu REAL NOT NULL,
    salinity_uncertainty REAL,
    wind_speed REAL,
    rain_rate REAL,
    dataset_id TEXT NOT NULL,
    granule_id TEXT,
    within_angola_eez BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(measurement_date, latitude, longitude)
);

-- Vessel lights detection (VIIRS Day/Night Band)
CREATE TABLE IF NOT EXISTS nasa_vessel_lights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detection_date DATETIME NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radiance REAL NOT NULL,
    confidence_score REAL,
    vessel_type TEXT,
    estimated_size TEXT,
    dataset_id TEXT NOT NULL,
    granule_id TEXT,
    within_angola_eez BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(detection_date, latitude, longitude)
);

-- NASA data retention metadata
CREATE TABLE IF NOT EXISTS nasa_retention_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_type TEXT NOT NULL, -- 'ocean_color', 'sst', 'salinity', 'vessel_lights'
    retention_days INTEGER DEFAULT 90,
    priority_level INTEGER DEFAULT 1, -- 1-5, higher is more important
    last_cleanup DATETIME,
    total_records INTEGER,
    compressed_records INTEGER,
    compression_ratio REAL,
    ml_processed BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NASA granule tracking (for data management)
CREATE TABLE IF NOT EXISTS nasa_granules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    granule_id TEXT NOT NULL UNIQUE,
    collection_id TEXT NOT NULL,
    data_type TEXT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    bounding_box TEXT, -- JSON: {north, south, east, west}
    file_size_mb REAL,
    download_url TEXT,
    processed BOOLEAN DEFAULT false,
    processed_date DATETIME,
    records_extracted INTEGER,
    angola_eez_coverage REAL, -- percentage
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Aggregated daily statistics for performance
CREATE TABLE IF NOT EXISTS nasa_daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    data_type TEXT NOT NULL,
    avg_chlorophyll REAL,
    avg_sst REAL,
    avg_salinity REAL,
    vessel_detections INTEGER,
    min_lat REAL,
    max_lat REAL,
    min_lon REAL,
    max_lon REAL,
    data_points INTEGER,
    quality_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, data_type)
);

-- Indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_ocean_color_date ON nasa_ocean_color(measurement_date);
CREATE INDEX IF NOT EXISTS idx_ocean_color_location ON nasa_ocean_color(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_sst_date ON nasa_sst(measurement_date);
CREATE INDEX IF NOT EXISTS idx_sst_location ON nasa_sst(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_salinity_date ON nasa_salinity(measurement_date);
CREATE INDEX IF NOT EXISTS idx_salinity_location ON nasa_salinity(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_vessel_lights_date ON nasa_vessel_lights(detection_date);
CREATE INDEX IF NOT EXISTS idx_vessel_lights_location ON nasa_vessel_lights(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_granules_collection ON nasa_granules(collection_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON nasa_daily_stats(date, data_type);

-- Views for common queries
CREATE VIEW IF NOT EXISTS nasa_latest_ocean_color AS
SELECT * FROM nasa_ocean_color
WHERE measurement_date >= datetime('now', '-24 hours')
AND within_angola_eez = true
ORDER BY measurement_date DESC;

CREATE VIEW IF NOT EXISTS nasa_latest_sst AS
SELECT * FROM nasa_sst
WHERE measurement_date >= datetime('now', '-24 hours')
AND within_angola_eez = true
ORDER BY measurement_date DESC;

CREATE VIEW IF NOT EXISTS nasa_vessel_activity AS
SELECT
    DATE(detection_date) as date,
    COUNT(*) as vessel_count,
    AVG(radiance) as avg_radiance,
    MIN(latitude) as min_lat,
    MAX(latitude) as max_lat,
    MIN(longitude) as min_lon,
    MAX(longitude) as max_lon
FROM nasa_vessel_lights
WHERE within_angola_eez = true
GROUP BY DATE(detection_date)
ORDER BY date DESC;

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_ocean_color_timestamp
AFTER UPDATE ON nasa_ocean_color
BEGIN
    UPDATE nasa_ocean_color SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_sst_timestamp
AFTER UPDATE ON nasa_sst
BEGIN
    UPDATE nasa_sst SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_salinity_timestamp
AFTER UPDATE ON nasa_salinity
BEGIN
    UPDATE nasa_salinity SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;