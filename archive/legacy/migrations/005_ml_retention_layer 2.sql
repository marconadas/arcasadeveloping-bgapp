-- 🧠 ML Data Retention Layer Migration
-- Camada de retenção de dados ML para otimização de performance
-- ATENÇÃO: Esta migration é ADITIVA - não afeta tabelas existentes

-- ============================================
-- 🗄️ FEATURE STORE - Armazenamento de Características
-- ============================================

CREATE TABLE IF NOT EXISTS ml_feature_store (
    feature_id VARCHAR(50) PRIMARY KEY,
    source_data_id VARCHAR(50) NOT NULL, -- Referência ao dado original
    source_table VARCHAR(50) NOT NULL,   -- biodiversity_studies, marine_species_data, etc
    feature_type VARCHAR(50) NOT NULL,   -- 'temporal', 'spatial', 'environmental', 'species'
    
    -- Características extraídas (formato otimizado)
    feature_vector JSONB NOT NULL,       -- Características numéricas
    feature_hash VARCHAR(64) NOT NULL,   -- Hash para deduplicação
    
    -- Metadados temporais e espaciais
    temporal_window VARCHAR(20),          -- '1day', '1week', '1month', '1season'
    spatial_resolution DECIMAL(10,8),    -- Resolução em graus
    location_grid VARCHAR(20),           -- Grid de localização (ex: 'lat_-12_lon_18')
    
    -- Qualidade e acesso
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
    computation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    
    -- Políticas de retenção
    retention_days INTEGER DEFAULT 365,
    priority_level VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
    
    -- Índices para performance
    UNIQUE (source_data_id, feature_type, feature_hash)
);

-- Índices otimizados
CREATE INDEX IF NOT EXISTS idx_ml_feature_store_type ON ml_feature_store(feature_type);
CREATE INDEX IF NOT EXISTS idx_ml_feature_store_source ON ml_feature_store(source_table, source_data_id);
CREATE INDEX IF NOT EXISTS idx_ml_feature_store_temporal ON ml_feature_store(temporal_window);
CREATE INDEX IF NOT EXISTS idx_ml_feature_store_spatial ON ml_feature_store(location_grid);
CREATE INDEX IF NOT EXISTS idx_ml_feature_store_access ON ml_feature_store(last_accessed);
CREATE INDEX IF NOT EXISTS idx_ml_feature_store_quality ON ml_feature_store(quality_score DESC);

-- ============================================
-- 🎯 ML TRAINING CACHE - Cache de Datasets de Treino
-- ============================================

CREATE TABLE IF NOT EXISTS ml_training_cache (
    cache_id VARCHAR(50) PRIMARY KEY,
    model_type VARCHAR(50) NOT NULL,
    dataset_version VARCHAR(20) NOT NULL,
    
    -- Dataset pré-processado (formato binário otimizado)
    training_matrix BYTEA,               -- Matriz X pré-processada
    target_vector BYTEA,                 -- Vector y pré-processado
    validation_split JSONB,              -- Índices de validação
    
    -- Pipeline de pré-processamento
    preprocessing_pipeline JSONB NOT NULL, -- Passos aplicados
    feature_names JSONB NOT NULL,          -- Nomes das características
    scaler_params JSONB,                   -- Parâmetros de normalização
    
    -- Metadados do dataset
    sample_count INTEGER NOT NULL,
    feature_count INTEGER NOT NULL,
    class_distribution JSONB,
    
    -- Performance e acesso
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hit_count INTEGER DEFAULT 0,
    training_time_saved_seconds INTEGER DEFAULT 0,
    
    -- Políticas de cache
    expires_at TIMESTAMP,
    auto_refresh BOOLEAN DEFAULT true,
    
    UNIQUE (model_type, dataset_version)
);

-- Índices para cache
CREATE INDEX IF NOT EXISTS idx_ml_training_cache_model ON ml_training_cache(model_type);
CREATE INDEX IF NOT EXISTS idx_ml_training_cache_access ON ml_training_cache(last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_ml_training_cache_expires ON ml_training_cache(expires_at);

-- ============================================
-- 📊 AGGREGATED TIME SERIES - Séries Temporais Agregadas
-- ============================================

CREATE TABLE IF NOT EXISTS aggregated_time_series (
    aggregation_id VARCHAR(50) PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL,    -- 'oceanographic', 'biodiversity', 'fishing'
    
    -- Localização agregada
    location_grid VARCHAR(20) NOT NULL,  -- Grid de agregação
    center_lat DECIMAL(10,8) NOT NULL,
    center_lon DECIMAL(11,8) NOT NULL,
    grid_size_km DECIMAL(8,2) NOT NULL,
    
    -- Janela temporal
    time_window VARCHAR(20) NOT NULL,    -- 'daily', 'weekly', 'monthly', 'seasonal'
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    sample_count INTEGER NOT NULL,
    
    -- Dados agregados oceanográficos
    sst_mean DECIMAL(5,2),
    sst_std DECIMAL(5,2),
    sst_min DECIMAL(5,2),
    sst_max DECIMAL(5,2),
    
    chlorophyll_mean DECIMAL(8,3),
    chlorophyll_std DECIMAL(8,3),
    
    salinity_mean DECIMAL(5,2),
    salinity_std DECIMAL(5,2),
    
    -- Padrões de correntes
    current_patterns JSONB,              -- Estatísticas de correntes
    upwelling_frequency DECIMAL(3,2),    -- Frequência de upwelling
    
    -- Biodiversidade agregada
    species_richness INTEGER,
    biodiversity_indices JSONB,          -- Shannon, Simpson, etc
    dominant_species JSONB,
    
    -- Padrões sazonais
    seasonal_indices JSONB,              -- Índices sazonais calculados
    trend_coefficient DECIMAL(10,6),     -- Coeficiente de tendência
    
    -- Metadados
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_sources JSONB NOT NULL,         -- Fontes dos dados originais
    
    -- Retenção
    retention_days INTEGER DEFAULT 1825, -- 5 anos para dados agregados
    
    UNIQUE (source_type, location_grid, time_window, start_date)
);

-- Índices para agregações
CREATE INDEX IF NOT EXISTS idx_aggregated_ts_source ON aggregated_time_series(source_type);
CREATE INDEX IF NOT EXISTS idx_aggregated_ts_location ON aggregated_time_series(location_grid);
CREATE INDEX IF NOT EXISTS idx_aggregated_ts_time ON aggregated_time_series(time_window, start_date);
CREATE INDEX IF NOT EXISTS idx_aggregated_ts_updated ON aggregated_time_series(last_updated DESC);

-- ============================================
-- ⚡ INFERENCE CACHE - Cache de Inferência Rápida
-- ============================================

CREATE TABLE IF NOT EXISTS ml_inference_cache (
    cache_key VARCHAR(100) PRIMARY KEY,  -- Hash dos parâmetros de entrada
    model_id VARCHAR(50) NOT NULL,
    
    -- Input e output
    input_hash VARCHAR(64) NOT NULL,     -- Hash dos dados de entrada
    input_summary JSONB NOT NULL,       -- Resumo dos parâmetros
    prediction_result JSONB NOT NULL,   -- Resultado da predição
    confidence DECIMAL(5,4) NOT NULL,
    
    -- Localização (para cache espacial)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    spatial_grid VARCHAR(20),           -- Grid espacial para cache
    
    -- Performance
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hit_count INTEGER DEFAULT 0,
    computation_time_ms INTEGER,        -- Tempo poupado
    
    -- TTL e invalidação
    expires_at TIMESTAMP NOT NULL,
    is_valid BOOLEAN DEFAULT true,
    
    FOREIGN KEY (model_id) REFERENCES ml_models(model_id) ON DELETE CASCADE
);

-- Índices para cache de inferência
CREATE INDEX IF NOT EXISTS idx_inference_cache_model ON ml_inference_cache(model_id);
CREATE INDEX IF NOT EXISTS idx_inference_cache_spatial ON ml_inference_cache(spatial_grid);
CREATE INDEX IF NOT EXISTS idx_inference_cache_expires ON ml_inference_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_inference_cache_access ON ml_inference_cache(last_accessed DESC);

-- ============================================
-- 📈 PERFORMANCE METRICS - Métricas de Performance
-- ============================================

CREATE TABLE IF NOT EXISTS ml_performance_metrics (
    metric_id VARCHAR(50) PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL,   -- 'cache_hit', 'training_speedup', 'inference_time'
    
    -- Valores de performance
    value DECIMAL(12,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,          -- 'ms', 'seconds', 'percentage', 'ratio'
    
    -- Contexto
    model_type VARCHAR(50),
    operation_type VARCHAR(50),         -- 'training', 'inference', 'feature_extraction'
    
    -- Timestamp
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadados
    metadata JSONB DEFAULT '{}'
);

-- Índice para métricas
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON ml_performance_metrics(metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_model ON ml_performance_metrics(model_type, recorded_at DESC);

-- ============================================
-- 🔄 RETENTION POLICIES - Políticas de Retenção
-- ============================================

CREATE TABLE IF NOT EXISTS ml_retention_policies (
    policy_id VARCHAR(50) PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    policy_name VARCHAR(100) NOT NULL,
    
    -- Critérios de retenção
    retention_days INTEGER NOT NULL,
    min_access_count INTEGER DEFAULT 0,
    min_quality_score DECIMAL(3,2) DEFAULT 0,
    priority_threshold VARCHAR(10) DEFAULT 'normal',
    
    -- Ação
    action VARCHAR(20) NOT NULL,        -- 'delete', 'archive', 'compress'
    
    -- Schedule
    enabled BOOLEAN DEFAULT true,
    last_executed TIMESTAMP,
    next_execution TIMESTAMP,
    execution_interval_hours INTEGER DEFAULT 24,
    
    -- Estatísticas
    records_processed INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,
    space_freed_mb DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 🎛️ FUNCTIONS & TRIGGERS
-- ============================================

-- Função para atualizar last_accessed automaticamente
CREATE OR REPLACE FUNCTION update_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed = CURRENT_TIMESTAMP;
    IF TG_TABLE_NAME = 'ml_feature_store' THEN
        NEW.access_count = COALESCE(OLD.access_count, 0) + 1;
    ELSIF TG_TABLE_NAME = 'ml_training_cache' THEN
        NEW.hit_count = COALESCE(OLD.hit_count, 0) + 1;
    ELSIF TG_TABLE_NAME = 'ml_inference_cache' THEN
        NEW.hit_count = COALESCE(OLD.hit_count, 0) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualização automática
CREATE TRIGGER update_feature_store_access
    BEFORE UPDATE ON ml_feature_store
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION update_last_accessed();

CREATE TRIGGER update_training_cache_access
    BEFORE UPDATE ON ml_training_cache
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION update_last_accessed();

CREATE TRIGGER update_inference_cache_access
    BEFORE UPDATE ON ml_inference_cache
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION update_last_accessed();

-- Função de limpeza automática
CREATE OR REPLACE FUNCTION cleanup_ml_retention_data()
RETURNS TABLE(
    table_name TEXT,
    records_deleted INTEGER,
    space_freed_mb DECIMAL
) AS $$
DECLARE
    policy RECORD;
    deleted_count INTEGER;
BEGIN
    -- Processar cada política de retenção
    FOR policy IN SELECT * FROM ml_retention_policies WHERE enabled = true LOOP
        
        IF policy.table_name = 'ml_feature_store' THEN
            DELETE FROM ml_feature_store 
            WHERE last_accessed < (CURRENT_TIMESTAMP - (policy.retention_days || ' days')::INTERVAL)
            AND access_count < policy.min_access_count
            AND quality_score < policy.min_quality_score;
            
        ELSIF policy.table_name = 'ml_training_cache' THEN
            DELETE FROM ml_training_cache 
            WHERE last_accessed < (CURRENT_TIMESTAMP - (policy.retention_days || ' days')::INTERVAL)
            AND hit_count < policy.min_access_count;
            
        ELSIF policy.table_name = 'ml_inference_cache' THEN
            DELETE FROM ml_inference_cache 
            WHERE expires_at < CURRENT_TIMESTAMP
            OR last_accessed < (CURRENT_TIMESTAMP - (policy.retention_days || ' days')::INTERVAL);
            
        END IF;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        -- Atualizar estatísticas da política
        UPDATE ml_retention_policies 
        SET records_processed = records_processed + deleted_count,
            records_deleted = records_deleted + deleted_count,
            last_executed = CURRENT_TIMESTAMP,
            next_execution = CURRENT_TIMESTAMP + (execution_interval_hours || ' hours')::INTERVAL
        WHERE policy_id = policy.policy_id;
        
        -- Retornar resultados
        table_name := policy.table_name;
        records_deleted := deleted_count;
        space_freed_mb := deleted_count * 0.001; -- Estimativa
        RETURN NEXT;
        
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 📊 VIEWS ÚTEIS
-- ============================================

-- View para estatísticas de cache
CREATE OR REPLACE VIEW ml_cache_statistics AS
SELECT 
    'feature_store' as cache_type,
    COUNT(*) as total_entries,
    AVG(access_count) as avg_access_count,
    SUM(CASE WHEN last_accessed > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 ELSE 0 END) as active_entries,
    AVG(quality_score) as avg_quality_score
FROM ml_feature_store
UNION ALL
SELECT 
    'training_cache' as cache_type,
    COUNT(*) as total_entries,
    AVG(hit_count) as avg_access_count,
    SUM(CASE WHEN last_accessed > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 ELSE 0 END) as active_entries,
    NULL as avg_quality_score
FROM ml_training_cache
UNION ALL
SELECT 
    'inference_cache' as cache_type,
    COUNT(*) as total_entries,
    AVG(hit_count) as avg_access_count,
    SUM(CASE WHEN expires_at > CURRENT_TIMESTAMP AND is_valid THEN 1 ELSE 0 END) as active_entries,
    AVG(confidence) as avg_quality_score
FROM ml_inference_cache;

-- View para performance geral
CREATE OR REPLACE VIEW ml_retention_performance AS
SELECT 
    DATE_TRUNC('day', recorded_at) as date,
    metric_type,
    AVG(value) as avg_value,
    MAX(value) as max_value,
    MIN(value) as min_value,
    COUNT(*) as sample_count
FROM ml_performance_metrics
WHERE recorded_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', recorded_at), metric_type
ORDER BY date DESC, metric_type;

-- ============================================
-- 🚀 POLÍTICAS DE RETENÇÃO PADRÃO
-- ============================================

-- Inserir políticas padrão
INSERT INTO ml_retention_policies (
    policy_id, table_name, policy_name, retention_days, 
    min_access_count, min_quality_score, action
) VALUES 
-- Feature Store - dados de alta qualidade mantidos por mais tempo
('fs_high_quality', 'ml_feature_store', 'High Quality Features', 730, 5, 0.8, 'delete'),
('fs_medium_quality', 'ml_feature_store', 'Medium Quality Features', 365, 2, 0.6, 'delete'),
('fs_low_quality', 'ml_feature_store', 'Low Quality Features', 90, 1, 0.3, 'delete'),

-- Training Cache - cache mantido baseado em uso
('tc_frequent', 'ml_training_cache', 'Frequent Training Cache', 180, 10, 0, 'delete'),
('tc_occasional', 'ml_training_cache', 'Occasional Training Cache', 90, 3, 0, 'delete'),
('tc_rare', 'ml_training_cache', 'Rare Training Cache', 30, 1, 0, 'delete'),

-- Inference Cache - TTL baseado
('ic_expired', 'ml_inference_cache', 'Expired Inference Cache', 0, 0, 0, 'delete'),
('ic_old_unused', 'ml_inference_cache', 'Old Unused Cache', 7, 0, 0, 'delete')

ON CONFLICT (policy_id) DO NOTHING;

-- ============================================
-- 📝 COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE ml_feature_store IS 'Cache otimizado de características extraídas para ML';
COMMENT ON TABLE ml_training_cache IS 'Cache de datasets pré-processados para treino rápido';
COMMENT ON TABLE aggregated_time_series IS 'Séries temporais agregadas para análises históricas';
COMMENT ON TABLE ml_inference_cache IS 'Cache de resultados de inferência para predições rápidas';
COMMENT ON TABLE ml_performance_metrics IS 'Métricas de performance do sistema ML';
COMMENT ON TABLE ml_retention_policies IS 'Políticas automáticas de retenção de dados';

COMMENT ON VIEW ml_cache_statistics IS 'Estatísticas de uso dos caches ML';
COMMENT ON VIEW ml_retention_performance IS 'Performance histórica do sistema de retenção';

-- Finalizar migration
SELECT 'ML Retention Layer criada com sucesso! 🧠✨' as status;
