-- ====================================================================
-- RESET WoRMS SCHEMA - Remove old tables and create fresh schema
-- ====================================================================

-- Drop old views first (must be done before dropping tables)
DROP VIEW IF EXISTS commercial_species;
DROP VIEW IF EXISTS conservation_priority_species;
DROP VIEW IF EXISTS species_richness_by_family;
DROP VIEW IF EXISTS taxonomy_summary;
DROP VIEW IF EXISTS species_distribution;

-- Drop old tables (order matters due to foreign keys)
DROP TABLE IF EXISTS species_data_quality;
DROP TABLE IF EXISTS species_taxonomy_cache;
DROP TABLE IF EXISTS species_relationships;
DROP TABLE IF EXISTS species_occurrences;
DROP TABLE IF EXISTS angola_priority_species;
DROP TABLE IF EXISTS marine_species;

-- Now create fresh tables with correct schema

-- Main species catalog table
CREATE TABLE marine_species (
    aphia_id INTEGER PRIMARY KEY,
    scientific_name TEXT NOT NULL,
    authority TEXT,
    kingdom TEXT,
    phylum TEXT,
    class TEXT,
    order_name TEXT,
    family TEXT,
    genus TEXT,
    species TEXT,
    common_name_pt TEXT,
    common_name_en TEXT,
    vernacular_names TEXT,
    is_marine INTEGER DEFAULT 1,
    is_brackish INTEGER DEFAULT 0,
    is_freshwater INTEGER DEFAULT 0,
    is_terrestrial INTEGER DEFAULT 0,
    habitat_description TEXT,
    status TEXT,
    taxonomic_status TEXT,
    conservation_status TEXT,
    ecological_importance TEXT,
    angola_eez_relevance TEXT CHECK(angola_eez_relevance IN ('high', 'medium', 'low')),
    commercial_importance INTEGER DEFAULT 0,
    fishing_target INTEGER DEFAULT 0,
    depth_range_min INTEGER,
    depth_range_max INTEGER,
    latitude_min REAL,
    latitude_max REAL,
    longitude_min REAL,
    longitude_max REAL,
    worms_url TEXT,
    lsid TEXT,
    citation TEXT,
    data_source TEXT DEFAULT 'worms',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified INTEGER DEFAULT 0,
    verification_date TIMESTAMP,
    verified_by TEXT,
    notes TEXT,
    metadata TEXT
);

CREATE INDEX idx_marine_species_scientific_name ON marine_species(scientific_name);
CREATE INDEX idx_marine_species_common_name_pt ON marine_species(common_name_pt);
CREATE INDEX idx_marine_species_family ON marine_species(family);
CREATE INDEX idx_marine_species_genus ON marine_species(genus);
CREATE INDEX idx_marine_species_angola_relevance ON marine_species(angola_eez_relevance);
CREATE INDEX idx_marine_species_commercial ON marine_species(commercial_importance);
CREATE INDEX idx_marine_species_habitat ON marine_species(is_marine, is_brackish, is_freshwater);

-- Species occurrence records
CREATE TABLE species_occurrences (
    occurrence_id INTEGER PRIMARY KEY AUTOINCREMENT,
    aphia_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    depth REAL,
    observation_date TIMESTAMP NOT NULL,
    season TEXT CHECK(season IN ('summer', 'winter', 'spring', 'autumn')),
    data_source TEXT,
    observer TEXT,
    observation_method TEXT,
    abundance TEXT,
    life_stage TEXT,
    temperature REAL,
    salinity REAL,
    chlorophyll_a REAL,
    coordinate_precision REAL,
    identification_confidence TEXT CHECK(identification_confidence IN ('certain', 'probable', 'possible')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aphia_id) REFERENCES marine_species(aphia_id)
);

CREATE INDEX idx_occurrences_aphia_id ON species_occurrences(aphia_id);
CREATE INDEX idx_occurrences_location ON species_occurrences(latitude, longitude);
CREATE INDEX idx_occurrences_date ON species_occurrences(observation_date);
CREATE INDEX idx_occurrences_season ON species_occurrences(season);

-- Species ecological relationships
CREATE TABLE species_relationships (
    relationship_id INTEGER PRIMARY KEY AUTOINCREMENT,
    aphia_id_1 INTEGER NOT NULL,
    aphia_id_2 INTEGER NOT NULL,
    relationship_type TEXT CHECK(relationship_type IN ('predator_prey', 'symbiotic', 'competitive', 'mutualistic', 'parasitic')),
    relationship_strength TEXT CHECK(relationship_strength IN ('weak', 'moderate', 'strong')),
    notes TEXT,
    FOREIGN KEY (aphia_id_1) REFERENCES marine_species(aphia_id),
    FOREIGN KEY (aphia_id_2) REFERENCES marine_species(aphia_id)
);

-- Angola priority species list
CREATE TABLE angola_priority_species (
    priority_id INTEGER PRIMARY KEY AUTOINCREMENT,
    scientific_name TEXT NOT NULL,
    aphia_id INTEGER,
    priority_level INTEGER CHECK(priority_level BETWEEN 1 AND 5),
    reason TEXT,
    populated INTEGER DEFAULT 0,
    population_date TIMESTAMP,
    UNIQUE(scientific_name)
);

-- Species taxonomy cache (FIXED with full taxonomy fields)
CREATE TABLE species_taxonomy_cache (
    cache_id INTEGER PRIMARY KEY AUTOINCREMENT,
    aphia_id INTEGER NOT NULL UNIQUE,
    scientific_name TEXT NOT NULL,
    kingdom TEXT,
    phylum TEXT,
    class TEXT,
    order_name TEXT,
    family TEXT,
    genus TEXT,
    species TEXT,
    taxonomy_path TEXT,
    taxonomy_json TEXT,
    cache_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cache_expiry TIMESTAMP
);

CREATE INDEX idx_taxonomy_cache_aphia_id ON species_taxonomy_cache(aphia_id);
CREATE INDEX idx_taxonomy_cache_scientific_name ON species_taxonomy_cache(scientific_name);
CREATE INDEX idx_taxonomy_cache_family ON species_taxonomy_cache(family);

-- Data quality tracking
CREATE TABLE species_data_quality (
    quality_id INTEGER PRIMARY KEY AUTOINCREMENT,
    aphia_id INTEGER NOT NULL,
    data_completeness REAL,
    taxonomy_verified INTEGER DEFAULT 0,
    habitat_verified INTEGER DEFAULT 0,
    distribution_verified INTEGER DEFAULT 0,
    last_quality_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quality_notes TEXT,
    FOREIGN KEY (aphia_id) REFERENCES marine_species(aphia_id)
);

-- Insert 30 priority species
INSERT INTO angola_priority_species (scientific_name, priority_level, reason) VALUES
    ('Sardinella aurita', 1, 'Major commercial species - Round sardinella'),
    ('Sardinella maderensis', 1, 'Major commercial species - Flat sardinella'),
    ('Trachurus trecae', 1, 'Major commercial species - Cunene horse mackerel'),
    ('Trachurus capensis', 1, 'Commercial species - Cape horse mackerel'),
    ('Merluccius capensis', 1, 'Commercial species - Shallow-water hake'),
    ('Merluccius paradoxus', 1, 'Commercial species - Deep-water hake'),
    ('Dentex angolensis', 1, 'Commercial species - Angolan dentex'),
    ('Dentex macrophthalmus', 1, 'Commercial species - Large-eye dentex'),
    ('Penaeus notialis', 2, 'Commercial crustacean - Southern pink shrimp'),
    ('Parapenaeus longirostris', 2, 'Commercial crustacean - Deep-water rose shrimp'),
    ('Aristeus varidens', 2, 'Commercial crustacean - Striped red shrimp'),
    ('Caretta caretta', 2, 'Conservation - Loggerhead sea turtle'),
    ('Chelonia mydas', 2, 'Conservation - Green sea turtle'),
    ('Dermochelys coriacea', 2, 'Conservation - Leatherback sea turtle'),
    ('Sousa teuszii', 2, 'Conservation - Atlantic humpback dolphin'),
    ('Engraulis encrasicolus', 3, 'Indicator species - European anchovy'),
    ('Trichiurus lepturus', 3, 'Indicator species - Largehead hairtail'),
    ('Scomber colias', 3, 'Indicator species - Atlantic chub mackerel'),
    ('Caranx crysos', 3, 'Indicator species - Blue runner'),
    ('Thunnus albacares', 3, 'Pelagic - Yellowfin tuna'),
    ('Katsuwonus pelamis', 3, 'Pelagic - Skipjack tuna'),
    ('Sarda sarda', 3, 'Pelagic - Atlantic bonito'),
    ('Octopus vulgaris', 4, 'Demersal - Common octopus'),
    ('Sepia officinalis', 4, 'Demersal - Common cuttlefish'),
    ('Loligo vulgaris', 4, 'Demersal - European squid'),
    ('Pagellus bellottii', 4, 'Demersal - Red pandora'),
    ('Sparus aurata', 4, 'Demersal - Gilthead seabream'),
    ('Portunus pelagicus', 5, 'Benthic - Blue swimming crab'),
    ('Callinectes amnicola', 5, 'Benthic - Mangrove crab'),
    ('Penaeus monodon', 5, 'Benthic - Giant tiger prawn');

-- Create views
CREATE VIEW commercial_species AS
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

CREATE VIEW taxonomy_summary AS
SELECT
    COUNT(DISTINCT kingdom) as kingdoms,
    COUNT(DISTINCT phylum) as phyla,
    COUNT(DISTINCT class) as classes,
    COUNT(DISTINCT family) as families,
    COUNT(DISTINCT genus) as genera,
    COUNT(*) as total_species
FROM species_taxonomy_cache;

CREATE VIEW species_distribution AS
SELECT
    family,
    COUNT(*) as species_count,
    GROUP_CONCAT(DISTINCT scientific_name, ', ') as species_list
FROM species_taxonomy_cache
GROUP BY family
ORDER BY species_count DESC;
