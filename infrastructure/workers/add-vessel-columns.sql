-- Add missing columns to existing vessel_data table
-- This script adds enhanced vessel tracking columns

-- Add MMSI (Maritime Mobile Service Identity)
ALTER TABLE vessel_data ADD COLUMN mmsi TEXT;

-- Add vessel flag/country
ALTER TABLE vessel_data ADD COLUMN flag TEXT;

-- Add fishing activity probability score
ALTER TABLE vessel_data ADD COLUMN fishing_activity_probability REAL;

-- Add EEZ (Exclusive Economic Zone) identifier
ALTER TABLE vessel_data ADD COLUMN in_eez TEXT;

-- Add distance from nearest port
ALTER TABLE vessel_data ADD COLUMN distance_from_port REAL;

-- Add metadata field for additional GFW data
ALTER TABLE vessel_data ADD COLUMN metadata TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_vessel_data_mmsi ON vessel_data(mmsi);
CREATE INDEX IF NOT EXISTS idx_vessel_data_eez ON vessel_data(in_eez);
