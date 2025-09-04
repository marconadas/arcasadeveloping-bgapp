-- 🗺️ CARTO Integration Schema
-- Tabelas para integração entre CARTO e BGAPP

-- Tabela para dados marinhos sincronizados do CARTO
CREATE TABLE IF NOT EXISTS marine_species_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carto_id INTEGER UNIQUE NOT NULL,
    species_name VARCHAR(255),
    scientific_name VARCHAR(255),
    conservation_status VARCHAR(100),
    depth DECIMAL(10,2),
    temperature DECIMAL(5,2),
    salinity DECIMAL(5,2),
    location TEXT,
    geometry JSONB,
    date_observed TIMESTAMP,
    source VARCHAR(50) DEFAULT 'carto',
    last_sync TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_marine_species_carto_id ON marine_species_data(carto_id);
CREATE INDEX IF NOT EXISTS idx_marine_species_species ON marine_species_data(species_name);
CREATE INDEX IF NOT EXISTS idx_marine_species_location ON marine_species_data USING GIN(to_tsvector('english', location));
CREATE INDEX IF NOT EXISTS idx_marine_species_geometry ON marine_species_data USING GIN(geometry);
CREATE INDEX IF NOT EXISTS idx_marine_species_sync ON marine_species_data(last_sync);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_marine_species_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marine_species_updated_at
    BEFORE UPDATE ON marine_species_data
    FOR EACH ROW
    EXECUTE FUNCTION update_marine_species_updated_at();

-- Tabela para logs de sincronização
CREATE TABLE IF NOT EXISTS carto_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(255) NOT NULL,
    sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'manual'
    status VARCHAR(50) NOT NULL, -- 'success', 'error', 'partial'
    records_processed INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    triggered_by VARCHAR(255), -- user ID or 'system'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_carto_sync_logs_table ON carto_sync_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_carto_sync_logs_status ON carto_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_carto_sync_logs_started ON carto_sync_logs(started_at);

-- Tabela para configurações de integração CARTO
CREATE TABLE IF NOT EXISTS carto_integration_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    carto_table VARCHAR(255) NOT NULL,
    sync_query TEXT,
    sync_interval INTEGER DEFAULT 3600, -- segundos
    auto_sync BOOLEAN DEFAULT false,
    field_mappings JSONB, -- mapeamento campos CARTO -> BGAPP
    filters JSONB, -- filtros aplicados na sincronização
    last_sync TIMESTAMP,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger para updated_at config
CREATE TRIGGER carto_config_updated_at
    BEFORE UPDATE ON carto_integration_config
    FOR EACH ROW
    EXECUTE FUNCTION update_marine_species_updated_at();

-- Tabela para mapas integrados com CARTO
ALTER TABLE maps ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'bgapp';
ALTER TABLE maps ADD COLUMN IF NOT EXISTS source_config JSONB;

-- Índice para mapas por fonte
CREATE INDEX IF NOT EXISTS idx_maps_source ON maps(source);

-- View para estatísticas de integração CARTO
CREATE OR REPLACE VIEW carto_integration_stats AS
SELECT 
    'marine_species_data' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT species_name) as unique_species,
    MAX(last_sync) as last_sync,
    MIN(date_observed) as earliest_observation,
    MAX(date_observed) as latest_observation,
    COUNT(*) FILTER (WHERE conservation_status IS NOT NULL) as records_with_status,
    AVG(depth) as avg_depth,
    AVG(temperature) as avg_temperature,
    AVG(salinity) as avg_salinity
FROM marine_species_data
WHERE source = 'carto';

-- View para logs recentes de sincronização
CREATE OR REPLACE VIEW carto_recent_sync_logs AS
SELECT 
    id,
    table_name,
    sync_type,
    status,
    records_processed,
    records_inserted + records_updated as records_synced,
    records_failed,
    error_message,
    started_at,
    completed_at,
    duration_seconds,
    triggered_by
FROM carto_sync_logs
ORDER BY started_at DESC
LIMIT 50;

-- Função para limpeza de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_carto_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM carto_sync_logs 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND status = 'success';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Inserir configuração padrão
INSERT INTO carto_integration_config (
    name, 
    description, 
    carto_table, 
    sync_query,
    sync_interval,
    auto_sync,
    field_mappings
) VALUES (
    'marine_biodiversity_sync',
    'Sincronização automática de dados de biodiversidade marinha',
    'marine_biodiversity',
    'SELECT cartodb_id, ST_AsGeoJSON(the_geom) as geometry, species_name, scientific_name, conservation_status, depth, temperature, salinity, location, date_observed, created_at, updated_at FROM marine_biodiversity WHERE the_geom IS NOT NULL ORDER BY updated_at DESC',
    3600, -- 1 hora
    true,
    '{
        "cartodb_id": "carto_id",
        "species_name": "species_name",
        "scientific_name": "scientific_name",
        "conservation_status": "conservation_status",
        "depth": "depth",
        "temperature": "temperature",
        "salinity": "salinity",
        "location": "location",
        "geometry": "geometry",
        "date_observed": "date_observed"
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE marine_species_data IS 'Dados de espécies marinhas sincronizados do CARTO';
COMMENT ON TABLE carto_sync_logs IS 'Logs de sincronização com CARTO API';
COMMENT ON TABLE carto_integration_config IS 'Configurações de integração CARTO';
COMMENT ON VIEW carto_integration_stats IS 'Estatísticas dos dados integrados do CARTO';
COMMENT ON VIEW carto_recent_sync_logs IS 'Logs recentes de sincronização CARTO';

