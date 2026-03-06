-- Create Conservation Risk Zones Table for Spatial Bycatch Modeling
-- Migration: create-conservation-risk-zones.sql
-- Date: 2025-10-28
-- Purpose: 0.1° x 0.1° grid cells with bycatch risk scores for protected species

-- Create conservation_risk_zones table
CREATE TABLE IF NOT EXISTS conservation_risk_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grid_cell_id TEXT NOT NULL UNIQUE,
    center_latitude REAL NOT NULL,
    center_longitude REAL NOT NULL,
    min_latitude REAL NOT NULL,
    max_latitude REAL NOT NULL,
    min_longitude REAL NOT NULL,
    max_longitude REAL NOT NULL,

    -- Risk scores (0.0 - 1.0)
    overall_bycatch_risk REAL CHECK (overall_bycatch_risk >= 0 AND overall_bycatch_risk <= 1.0),
    turtle_bycatch_risk REAL CHECK (turtle_bycatch_risk >= 0 AND turtle_bycatch_risk <= 1.0),
    dolphin_bycatch_risk REAL CHECK (dolphin_bycatch_risk >= 0 AND dolphin_bycatch_risk <= 1.0),
    protected_species_risk REAL CHECK (protected_species_risk >= 0 AND protected_species_risk <= 1.0),

    -- Activity metrics
    fishing_intensity REAL DEFAULT 0.0,
    vessel_density REAL DEFAULT 0.0,
    historical_bycatch_events INTEGER DEFAULT 0,

    -- Environmental factors
    sst_avg REAL,
    chlorophyll_avg REAL,
    depth_meters REAL,
    distance_to_coast_km REAL,

    -- Conservation metadata
    risk_category TEXT CHECK (risk_category IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    recommended_action TEXT,
    protected_area BOOLEAN DEFAULT 0,
    monitoring_priority INTEGER CHECK (monitoring_priority >= 1 AND monitoring_priority <= 5),

    -- Timestamps
    last_updated TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Spatial indexes for Angola EEZ grid cells
CREATE INDEX IF NOT EXISTS idx_conservation_risk_zones_spatial
ON conservation_risk_zones(center_latitude, center_longitude);

CREATE INDEX IF NOT EXISTS idx_conservation_risk_zones_risk_category
ON conservation_risk_zones(risk_category, overall_bycatch_risk DESC);

CREATE INDEX IF NOT EXISTS idx_conservation_risk_zones_priority
ON conservation_risk_zones(monitoring_priority, overall_bycatch_risk DESC);

CREATE INDEX IF NOT EXISTS idx_conservation_risk_zones_protected_high_risk
ON conservation_risk_zones(overall_bycatch_risk DESC)
WHERE overall_bycatch_risk >= 0.70;

-- Populate grid cells for Angola EEZ (0.1° x 0.1° resolution)
-- Continental Angola: -17.29° to -5.36° latitude, 8.30° to 13.84° longitude
-- Cabinda: -5.8° to -4.3° latitude, 12.0° to 13.5° longitude

-- Generate grid cells (will be populated by populate-conservation-risk-zones.js worker)
-- This creates approximately 6,500 grid cells covering Angola EEZ

WITH RECURSIVE grid AS (
    -- Continental Angola grid
    SELECT -17.29 as lat, 8.30 as lon
    UNION ALL
    SELECT
        CASE
            WHEN lon + 0.1 > 13.84 THEN lat + 0.1
            ELSE lat
        END as lat,
        CASE
            WHEN lon + 0.1 > 13.84 THEN 8.30
            ELSE lon + 0.1
        END as lon
    FROM grid
    WHERE lat <= -5.36
),
cabinda_grid AS (
    -- Cabinda exclave grid
    SELECT -5.8 as lat, 12.0 as lon
    UNION ALL
    SELECT
        CASE
            WHEN lon + 0.1 > 13.5 THEN lat + 0.1
            ELSE lat
        END as lat,
        CASE
            WHEN lon + 0.1 > 13.5 THEN 12.0
            ELSE lon + 0.1
        END as lon
    FROM cabinda_grid
    WHERE lat <= -4.3
)
INSERT OR IGNORE INTO conservation_risk_zones (
    grid_cell_id,
    center_latitude,
    center_longitude,
    min_latitude,
    max_latitude,
    min_longitude,
    max_longitude,
    overall_bycatch_risk,
    risk_category,
    monitoring_priority
)
SELECT
    printf('%.2f_%.2f', ROUND(lat, 2), ROUND(lon, 2)) as grid_cell_id,
    ROUND(lat, 2) as center_latitude,
    ROUND(lon, 2) as center_longitude,
    ROUND(lat - 0.05, 2) as min_latitude,
    ROUND(lat + 0.05, 2) as max_latitude,
    ROUND(lon - 0.05, 2) as min_longitude,
    ROUND(lon + 0.05, 2) as max_longitude,
    0.0 as overall_bycatch_risk,
    'very_low' as risk_category,
    5 as monitoring_priority
FROM (
    SELECT lat, lon FROM grid
    UNION
    SELECT lat, lon FROM cabinda_grid
);

-- Create table for real-time conservation alerts
CREATE TABLE IF NOT EXISTS conservation_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id TEXT NOT NULL UNIQUE,
    grid_cell_id TEXT NOT NULL,
    species_id INTEGER,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('bycatch_risk', 'protected_species_sighting', 'illegal_fishing', 'conservation_violation')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    description TEXT,
    recommended_action TEXT,
    alert_timestamp TEXT NOT NULL,
    resolved BOOLEAN DEFAULT 0,
    resolved_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (grid_cell_id) REFERENCES conservation_risk_zones(grid_cell_id),
    FOREIGN KEY (species_id) REFERENCES marine_species(id)
);

CREATE INDEX IF NOT EXISTS idx_conservation_alerts_active
ON conservation_alerts(alert_timestamp DESC, severity)
WHERE resolved = 0;

CREATE INDEX IF NOT EXISTS idx_conservation_alerts_grid_cell
ON conservation_alerts(grid_cell_id, alert_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_conservation_alerts_species
ON conservation_alerts(species_id, alert_timestamp DESC)
WHERE species_id IS NOT NULL;

-- Verify grid cell creation
SELECT
    'Grid Cell Summary' as report,
    COUNT(*) as total_grid_cells,
    COUNT(CASE WHEN center_latitude > -5.8 THEN 1 END) as cabinda_cells,
    COUNT(CASE WHEN center_latitude <= -5.8 THEN 1 END) as continental_cells,
    ROUND(MIN(center_latitude), 2) as min_lat,
    ROUND(MAX(center_latitude), 2) as max_lat,
    ROUND(MIN(center_longitude), 2) as min_lon,
    ROUND(MAX(center_longitude), 2) as max_lon
FROM conservation_risk_zones;

-- Show sample grid cells
SELECT
    grid_cell_id,
    center_latitude,
    center_longitude,
    risk_category,
    monitoring_priority
FROM conservation_risk_zones
ORDER BY RANDOM()
LIMIT 10;
