-- ====================================================================
-- BGAPP Marine Species Catalog Schema (FIXED)
-- ====================================================================
-- Purpose: Store comprehensive marine species data from WoRMS API
--          for Angola's Exclusive Economic Zone (EEZ)
-- Data Source: World Register of Marine Species (WoRMS)
-- API: https://www.marinespecies.org/rest/
-- Coverage: Angola EEZ (-17.29° to -4.3° lat, 8.30° to 13.84° lon)
-- ====================================================================

-- Main species catalog table
CREATE TABLE IF NOT EXISTS marine_species (
    -- Primary identifiers
    aphia_id INTEGER PRIMARY KEY,
    scientific_name TEXT NOT NULL,
    authority TEXT,

    -- Taxonomic hierarchy
    kingdom TEXT,
    phylum TEXT,
    class TEXT,
    order_name TEXT,
    family TEXT,
    genus TEXT,
    species TEXT,

    -- Common names (Portuguese priority for Angola)
    common_name_pt TEXT,
    common_name_en TEXT,
    vernacular_names TEXT, -- JSON array of additional names

    -- Habitat and distribution
    is_marine INTEGER DEFAULT 1,
    is_brackish INTEGER DEFAULT 0,
    is_freshwater INTEGER DEFAULT 0,
    is_terrestrial INTEGER DEFAULT 0,
    habitat_description TEXT,

    -- Conservation and ecological status
    status TEXT, -- accepted, unaccepted, uncertain
    taxonomic_status TEXT,
    conservation_status TEXT, -- IUCN Red List status
    ecological_importance TEXT, -- commercial, conservation, indicator

    -- Angola EEZ relevance
    angola_eez_relevance TEXT CHECK(angola_eez_relevance IN ('high', 'medium', 'low')),
    commercial_importance INTEGER DEFAULT 0, -- 0=none, 1=low, 2=medium, 3=high
    fishing_target INTEGER DEFAULT 0, -- 0=no, 1=yes

    -- Geographic distribution
    depth_range_min INTEGER, -- meters
    depth_range_max INTEGER, -- meters
    latitude_min REAL,
    latitude_max REAL,
    longitude_min REAL,
    longitude_max REAL,

    -- WoRMS metadata
    worms_url TEXT,
    lsid TEXT, -- Life Science Identifier
    citation TEXT,

    -- Data quality and freshness
    data_source TEXT DEFAULT 'worms',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified INTEGER DEFAULT 0,
    verification_date TIMESTAMP,
    verified_by TEXT,

    -- Additional metadata
    notes TEXT,
    metadata TEXT -- JSON for additional flexible data
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_marine_species_scientific_name
    ON marine_species(scientific_name);

CREATE INDEX IF NOT EXISTS idx_marine_species_common_name_pt
    ON marine_species(common_name_pt);

CREATE INDEX IF NOT EXISTS idx_marine_species_family
    ON marine_species(family);

CREATE INDEX IF NOT EXISTS idx_marine_species_genus
    ON marine_species(genus);

CREATE INDEX IF NOT EXISTS idx_marine_species_angola_relevance
    ON marine_species(angola_eez_relevance);

CREATE INDEX IF NOT EXISTS idx_marine_species_commercial
    ON marine_species(commercial_importance);

CREATE INDEX IF NOT EXISTS idx_marine_species_habitat
    ON marine_species(is_marine, is_brackish, is_freshwater);

-- Species occurrence records (observations in Angola EEZ)
CREATE TABLE IF NOT EXISTS species_occurrences (
    occurrence_id INTEGER PRIMARY KEY AUTOINCREMENT,
    aphia_id INTEGER NOT NULL,

    -- Location data
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    depth REAL,

    -- Temporal data
    observation_date TIMESTAMP NOT NULL,
    season TEXT CHECK(season IN ('summer', 'winter', 'spring', 'autumn')),

    -- Observation metadata
    data_source TEXT, -- GBIF, OBIS, local surveys
    observer TEXT,
    observation_method TEXT,
    abundance TEXT, -- rare, common, abundant
    life_stage TEXT, -- juvenile, adult, larvae

    -- Environmental context (linked to oceanographic data)
    temperature REAL,
    salinity REAL,
    chlorophyll_a REAL,

    -- Quality
    coordinate_precision REAL,
    identification_confidence TEXT CHECK(identification_confidence IN ('certain', 'probable', 'possible')),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (aphia_id) REFERENCES marine_species(aphia_id)
);

-- Indexes for occurrence queries
CREATE INDEX IF NOT EXISTS idx_occurrences_aphia_id
    ON species_occurrences(aphia_id);

CREATE INDEX IF NOT EXISTS idx_occurrences_location
    ON species_occurrences(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_occurrences_date
    ON species_occurrences(observation_date);

CREATE INDEX IF NOT EXISTS idx_occurrences_season
    ON species_occurrences(season);

-- Species ecological relationships
CREATE TABLE IF NOT EXISTS species_relationships (
    relationship_id INTEGER PRIMARY KEY AUTOINCREMENT,
    aphia_id_1 INTEGER NOT NULL,
    aphia_id_2 INTEGER NOT NULL,
    relationship_type TEXT CHECK(relationship_type IN (
        'predator_prey',
        'symbiotic',
        'competitive',
        'mutualistic',
        'parasitic'
    )),
    relationship_strength TEXT CHECK(relationship_strength IN ('weak', 'moderate', 'strong')),
    notes TEXT,

    FOREIGN KEY (aphia_id_1) REFERENCES marine_species(aphia_id),
    FOREIGN KEY (aphia_id_2) REFERENCES marine_species(aphia_id)
);

-- Angola priority species list (for initial population)
CREATE TABLE IF NOT EXISTS angola_priority_species (
    priority_id INTEGER PRIMARY KEY AUTOINCREMENT,
    scientific_name TEXT NOT NULL,
    aphia_id INTEGER,
    priority_level INTEGER CHECK(priority_level BETWEEN 1 AND 5), -- 1=highest
    reason TEXT,
    populated INTEGER DEFAULT 0,
    population_date TIMESTAMP,

    UNIQUE(scientific_name)
);

-- Insert Angola priority species for initial WoRMS API queries
INSERT OR IGNORE INTO angola_priority_species (scientific_name, priority_level, reason) VALUES
    -- Commercial Fish Species (Priority 1)
    ('Sardinella aurita', 1, 'Major commercial species - Round sardinella'),
    ('Sardinella maderensis', 1, 'Major commercial species - Flat sardinella'),
    ('Trachurus trecae', 1, 'Major commercial species - Cunene horse mackerel'),
    ('Trachurus capensis', 1, 'Commercial species - Cape horse mackerel'),
    ('Merluccius capensis', 1, 'Commercial species - Shallow-water hake'),
    ('Merluccius paradoxus', 1, 'Commercial species - Deep-water hake'),
    ('Dentex angolensis', 1, 'Commercial species - Angolan dentex'),
    ('Dentex macrophthalmus', 1, 'Commercial species - Large-eye dentex'),

    -- Shrimps and Crustaceans (Priority 2)
    ('Penaeus notialis', 2, 'Commercial crustacean - Southern pink shrimp'),
    ('Parapenaeus longirostris', 2, 'Commercial crustacean - Deep-water rose shrimp'),
    ('Aristeus varidens', 2, 'Commercial crustacean - Striped red shrimp'),

    -- Conservation Priority (Priority 2)
    ('Caretta caretta', 2, 'Conservation - Loggerhead sea turtle'),
    ('Chelonia mydas', 2, 'Conservation - Green sea turtle'),
    ('Dermochelys coriacea', 2, 'Conservation - Leatherback sea turtle'),
    ('Sousa teuszii', 2, 'Conservation - Atlantic humpback dolphin'),

    -- Indicator Species (Priority 3)
    ('Engraulis encrasicolus', 3, 'Indicator species - European anchovy'),
    ('Trichiurus lepturus', 3, 'Indicator species - Largehead hairtail'),
    ('Scomber colias', 3, 'Indicator species - Atlantic chub mackerel'),
    ('Caranx crysos', 3, 'Indicator species - Blue runner'),

    -- Pelagic Species (Priority 3)
    ('Thunnus albacares', 3, 'Pelagic - Yellowfin tuna'),
    ('Katsuwonus pelamis', 3, 'Pelagic - Skipjack tuna'),
    ('Sarda sarda', 3, 'Pelagic - Atlantic bonito'),

    -- Demersal Species (Priority 4)
    ('Octopus vulgaris', 4, 'Demersal - Common octopus'),
    ('Sepia officinalis', 4, 'Demersal - Common cuttlefish'),
    ('Loligo vulgaris', 4, 'Demersal - European squid'),
    ('Pagellus bellottii', 4, 'Demersal - Red pandora'),
    ('Sparus aurata', 4, 'Demersal - Gilthead seabream'),

    -- Ecosystem Engineers (Priority 5)
    ('Portunus pelagicus', 5, 'Benthic - Blue swimming crab'),
    ('Callinectes amnicola', 5, 'Benthic - Mangrove crab'),
    ('Penaeus monodon', 5, 'Benthic - Giant tiger prawn');

-- FIXED: Species taxonomy cache with full taxonomy fields
CREATE TABLE IF NOT EXISTS species_taxonomy_cache (
    cache_id INTEGER PRIMARY KEY AUTOINCREMENT,
    aphia_id INTEGER NOT NULL UNIQUE,
    scientific_name TEXT NOT NULL,

    -- Full taxonomic hierarchy
    kingdom TEXT,
    phylum TEXT,
    class TEXT,
    order_name TEXT,
    family TEXT,
    genus TEXT,
    species TEXT,

    -- Full taxonomy path for display
    taxonomy_path TEXT,
    taxonomy_json TEXT, -- JSON object with full taxonomy

    -- Cache metadata
    cache_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cache_expiry TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_taxonomy_cache_aphia_id
    ON species_taxonomy_cache(aphia_id);

CREATE INDEX IF NOT EXISTS idx_taxonomy_cache_scientific_name
    ON species_taxonomy_cache(scientific_name);

CREATE INDEX IF NOT EXISTS idx_taxonomy_cache_family
    ON species_taxonomy_cache(family);

-- Data quality tracking
CREATE TABLE IF NOT EXISTS species_data_quality (
    quality_id INTEGER PRIMARY KEY AUTOINCREMENT,
    aphia_id INTEGER NOT NULL,
    data_completeness REAL, -- 0.0 to 1.0
    taxonomy_verified INTEGER DEFAULT 0,
    habitat_verified INTEGER DEFAULT 0,
    distribution_verified INTEGER DEFAULT 0,
    last_quality_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quality_notes TEXT,

    FOREIGN KEY (aphia_id) REFERENCES marine_species(aphia_id)
);

-- ====================================================================
-- VIEWS FOR COMMON QUERIES
-- ====================================================================

-- View: Commercial species in Angola EEZ
CREATE VIEW IF NOT EXISTS commercial_species AS
SELECT
    ms.aphia_id,
    ms.scientific_name,
    ms.common_name_pt,
    ms.common_name_en,
    ms.family,
    ms.angola_eez_relevance
FROM marine_species ms
WHERE ms.commercial_importance >= 2
ORDER BY ms.commercial_importance DESC, ms.scientific_name;

-- View: Taxonomy summary
CREATE VIEW IF NOT EXISTS taxonomy_summary AS
SELECT
    COUNT(DISTINCT kingdom) as kingdoms,
    COUNT(DISTINCT phylum) as phyla,
    COUNT(DISTINCT class) as classes,
    COUNT(DISTINCT family) as families,
    COUNT(DISTINCT genus) as genera,
    COUNT(*) as total_species
FROM species_taxonomy_cache;

-- View: Species distribution summary
CREATE VIEW IF NOT EXISTS species_distribution AS
SELECT
    family,
    COUNT(*) as species_count,
    GROUP_CONCAT(DISTINCT scientific_name, ', ') as species_list
FROM species_taxonomy_cache
GROUP BY family
ORDER BY species_count DESC;

-- ====================================================================
-- MIGRATION NOTES
-- ====================================================================
-- 1. Run this schema on D1: wrangler d1 execute bgapp-data --file=schema-marine-species-fixed.sql
-- 2. Verify tables created
-- 3. Deploy workers
-- 4. Populate data
-- ====================================================================
