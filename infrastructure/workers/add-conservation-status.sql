-- Add IUCN Conservation Status to marine_species table
-- Migration: add-conservation-status.sql
-- Date: 2025-10-28
-- Purpose: Enable conservation risk assessment and bycatch prediction

-- Add conservation_status column to marine_species table
ALTER TABLE marine_species
ADD COLUMN conservation_status TEXT CHECK (conservation_status IN ('LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD', 'NE')) DEFAULT 'DD';

-- Add conservation metadata columns
ALTER TABLE marine_species
ADD COLUMN conservation_assessment_year INTEGER;

ALTER TABLE marine_species
ADD COLUMN population_trend TEXT CHECK (population_trend IN ('increasing', 'stable', 'decreasing', 'unknown')) DEFAULT 'unknown';

ALTER TABLE marine_species
ADD COLUMN bycatch_vulnerability_score REAL CHECK (bycatch_vulnerability_score >= 0 AND bycatch_vulnerability_score <= 1.0);

-- Add conservation notes
ALTER TABLE marine_species
ADD COLUMN conservation_notes TEXT;

-- Update known conservation statuses for Angola priority species
-- Critical endangered species
UPDATE marine_species
SET conservation_status = 'CR',
    conservation_assessment_year = 2024,
    population_trend = 'decreasing',
    bycatch_vulnerability_score = 0.95,
    conservation_notes = 'Critically endangered sea turtle, high bycatch risk in fishing gear'
WHERE scientific_name = 'Dermochelys coriacea'; -- Leatherback turtle

UPDATE marine_species
SET conservation_status = 'CR',
    conservation_assessment_year = 2024,
    population_trend = 'decreasing',
    bycatch_vulnerability_score = 0.90,
    conservation_notes = 'Critically endangered Atlantic humpback dolphin, endemic to West African coastal waters'
WHERE scientific_name = 'Sousa teuszii'; -- Atlantic humpback dolphin

-- Endangered species
UPDATE marine_species
SET conservation_status = 'EN',
    conservation_assessment_year = 2024,
    population_trend = 'decreasing',
    bycatch_vulnerability_score = 0.80,
    conservation_notes = 'Endangered sea turtle, vulnerable to fishing nets and coastal development'
WHERE scientific_name = 'Chelonia mydas'; -- Green turtle

-- Vulnerable species
UPDATE marine_species
SET conservation_status = 'VU',
    conservation_assessment_year = 2024,
    population_trend = 'decreasing',
    bycatch_vulnerability_score = 0.75,
    conservation_notes = 'Vulnerable sea turtle, common in Angola EEZ, requires monitoring'
WHERE scientific_name = 'Caretta caretta'; -- Loggerhead turtle

-- Least concern commercial species
UPDATE marine_species
SET conservation_status = 'LC',
    conservation_assessment_year = 2024,
    population_trend = 'stable',
    bycatch_vulnerability_score = 0.20,
    conservation_notes = 'Least concern, important commercial species, sustainable stocks'
WHERE scientific_name IN (
    'Sardinella aurita',        -- Round sardinella
    'Trachurus trecae',         -- Cunene horse mackerel
    'Scomber colias',           -- Atlantic chub mackerel
    'Dentex angolensis'         -- Angolan dentex
);

-- Data deficient species (require more research)
UPDATE marine_species
SET conservation_status = 'DD',
    conservation_assessment_year = 2024,
    population_trend = 'unknown',
    bycatch_vulnerability_score = 0.50,
    conservation_notes = 'Data deficient, requires population assessment and monitoring'
WHERE conservation_status IS NULL OR conservation_status = 'DD';

-- Create index for conservation status queries
CREATE INDEX IF NOT EXISTS idx_marine_species_conservation_status
ON marine_species(conservation_status);

CREATE INDEX IF NOT EXISTS idx_marine_species_bycatch_vulnerability
ON marine_species(bycatch_vulnerability_score DESC)
WHERE bycatch_vulnerability_score >= 0.70;

-- Verify migration
SELECT
    conservation_status,
    COUNT(*) as species_count,
    ROUND(AVG(bycatch_vulnerability_score), 2) as avg_bycatch_risk
FROM marine_species
GROUP BY conservation_status
ORDER BY
    CASE conservation_status
        WHEN 'CR' THEN 1
        WHEN 'EN' THEN 2
        WHEN 'VU' THEN 3
        WHEN 'NT' THEN 4
        WHEN 'LC' THEN 5
        WHEN 'DD' THEN 6
        ELSE 7
    END;
