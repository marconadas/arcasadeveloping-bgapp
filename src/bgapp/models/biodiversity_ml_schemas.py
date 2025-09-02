#!/usr/bin/env python3
"""
Esquemas de Base de Dados para Estudos de Biodiversidade e Machine Learning
Sistema automático de armazenamento e alimentação de modelos preditivos
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass
from pydantic import BaseModel, Field
import json

class StudyType(str, Enum):
    """Tipos de estudos de biodiversidade"""
    SPECIES_SURVEY = "species_survey"
    HABITAT_ASSESSMENT = "habitat_assessment"
    BIOMASS_ESTIMATION = "biomass_estimation"
    MIGRATION_TRACKING = "migration_tracking"
    ECOSYSTEM_HEALTH = "ecosystem_health"
    WATER_QUALITY = "water_quality"
    FISHERIES_ASSESSMENT = "fisheries_assessment"

class DataSource(str, Enum):
    """Fontes de dados"""
    FIELD_COLLECTION = "field_collection"
    SATELLITE_IMAGERY = "satellite_imagery"
    SENSOR_NETWORK = "sensor_network"
    CITIZEN_SCIENCE = "citizen_science"
    RESEARCH_VESSEL = "research_vessel"
    DRONE_SURVEY = "drone_survey"
    ACOUSTIC_MONITORING = "acoustic_monitoring"

class MLModelStatus(str, Enum):
    """Status dos modelos de ML"""
    TRAINING = "training"
    TRAINED = "trained"
    DEPLOYED = "deployed"
    UPDATING = "updating"
    DEPRECATED = "deprecated"
    FAILED = "failed"

@dataclass
class BiodiversityStudySchema:
    """Esquema para estudos de biodiversidade"""
    
    # Campos obrigatórios (sem defaults) - DEVEM VIR PRIMEIRO
    study_id: str
    study_name: str
    study_type: StudyType
    start_date: datetime
    latitude: float
    longitude: float
    sampling_method: str
    sample_size: int
    data_quality_score: float
    data_source: DataSource
    collector_id: str
    
    # Campos opcionais (com defaults) - DEVEM VIR DEPOIS
    description: Optional[str] = None
    end_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    depth_min: Optional[float] = None
    depth_max: Optional[float] = None
    area_coverage_km2: Optional[float] = None
    species_observed: List[Dict[str, Any]] = Field(default_factory=list)
    environmental_parameters: Dict[str, Any] = Field(default_factory=dict)
    validation_status: str = "pending"
    institution: Optional[str] = None
    
    # Dados para ML
    ml_features: Dict[str, Any] = Field(default_factory=dict)
    processed_for_ml: bool = False
    
    # Metadados adicionais
    equipment_used: List[str] = Field(default_factory=list)
    weather_conditions: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

@dataclass
class MLTrainingDataSchema:
    """Esquema para dados de treino de ML"""
    
    # Identificação
    training_data_id: str
    source_study_id: str  # Referência ao estudo original
    model_type: str
    
    # Dados de entrada
    features: Dict[str, Any]
    target_variable: str
    target_value: Any
    
    # Metadados
    created_at: datetime = Field(default_factory=datetime.now)
    data_quality: float = Field(ge=0, le=1)
    preprocessing_applied: List[str] = Field(default_factory=list)
    
    # Validação
    is_validated: bool = False
    validation_method: Optional[str] = None
    cross_validation_fold: Optional[int] = None

@dataclass
class MLModelSchema:
    """Esquema para modelos de ML"""
    
    # Campos obrigatórios (sem defaults) - DEVEM VIR PRIMEIRO
    model_id: str
    model_name: str
    model_type: str
    version: str
    status: MLModelStatus
    algorithm: str
    created_by: str
    
    # Campos opcionais (com defaults) - DEVEM VIR DEPOIS
    created_at: datetime = Field(default_factory=datetime.now)
    last_trained: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    features_used: List[str] = Field(default_factory=list)
    
    # Performance
    training_accuracy: Optional[float] = None
    validation_accuracy: Optional[float] = None
    test_accuracy: Optional[float] = None
    cross_validation_score: Optional[float] = None
    
    # Dados de treino
    training_data_count: int = 0
    training_data_sources: List[str] = Field(default_factory=list)
    last_training_date: Optional[datetime] = None
    
    # Deployment
    is_deployed: bool = False
    endpoint_url: Optional[str] = None
    prediction_count: int = 0
    
    # Metadados opcionais
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

@dataclass
class PredictionResultSchema:
    """Esquema para resultados de predições"""
    
    # Identificação
    prediction_id: str
    model_id: str
    
    # Dados de entrada
    input_data: Dict[str, Any]
    
    # Resultado
    prediction: Any
    confidence: float = Field(ge=0, le=1)
    prediction_timestamp: datetime = Field(default_factory=datetime.now)
    
    # Contexto geográfico
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_name: Optional[str] = None
    
    # Validação posterior
    actual_value: Optional[Any] = None
    validation_date: Optional[datetime] = None
    prediction_error: Optional[float] = None
    
    # Uso para filtros de mapa
    used_for_mapping: bool = False
    map_layer_id: Optional[str] = None

# SQL Schema Definitions
BIODIVERSITY_STUDIES_TABLE = """
CREATE TABLE IF NOT EXISTS biodiversity_studies (
    study_id VARCHAR(50) PRIMARY KEY,
    study_name VARCHAR(200) NOT NULL,
    study_type VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Temporal data
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Geographic data
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    depth_min DECIMAL(8, 2),
    depth_max DECIMAL(8, 2),
    area_coverage_km2 DECIMAL(12, 4),
    geom GEOMETRY(POINT, 4326),
    
    -- Scientific data
    species_observed JSONB DEFAULT '[]',
    environmental_parameters JSONB DEFAULT '{}',
    sampling_method VARCHAR(100) NOT NULL,
    sample_size INTEGER NOT NULL,
    
    -- Quality and validation
    data_quality_score DECIMAL(3, 2) CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
    validation_status VARCHAR(20) DEFAULT 'pending',
    
    -- Source and responsibility
    data_source VARCHAR(50) NOT NULL,
    collector_id VARCHAR(50) NOT NULL,
    institution VARCHAR(200),
    
    -- ML processing
    ml_features JSONB DEFAULT '{}',
    processed_for_ml BOOLEAN DEFAULT FALSE,
    
    -- Additional metadata
    equipment_used JSONB DEFAULT '[]',
    weather_conditions JSONB,
    notes TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_biodiversity_studies_type ON biodiversity_studies(study_type);
CREATE INDEX IF NOT EXISTS idx_biodiversity_studies_date ON biodiversity_studies(start_date);
CREATE INDEX IF NOT EXISTS idx_biodiversity_studies_location ON biodiversity_studies USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_biodiversity_studies_collector ON biodiversity_studies(collector_id);
CREATE INDEX IF NOT EXISTS idx_biodiversity_studies_ml_processed ON biodiversity_studies(processed_for_ml);
"""

ML_TRAINING_DATA_TABLE = """
CREATE TABLE IF NOT EXISTS ml_training_data (
    training_data_id VARCHAR(50) PRIMARY KEY,
    source_study_id VARCHAR(50) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    
    -- Training data
    features JSONB NOT NULL,
    target_variable VARCHAR(100) NOT NULL,
    target_value JSONB NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_quality DECIMAL(3, 2) CHECK (data_quality >= 0 AND data_quality <= 1),
    preprocessing_applied JSONB DEFAULT '[]',
    
    -- Validation
    is_validated BOOLEAN DEFAULT FALSE,
    validation_method VARCHAR(100),
    cross_validation_fold INTEGER,
    
    FOREIGN KEY (source_study_id) REFERENCES biodiversity_studies(study_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ml_training_data_model_type ON ml_training_data(model_type);
CREATE INDEX IF NOT EXISTS idx_ml_training_data_source ON ml_training_data(source_study_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_data_validated ON ml_training_data(is_validated);
"""

ML_MODELS_TABLE = """
CREATE TABLE IF NOT EXISTS ml_models (
    model_id VARCHAR(50) PRIMARY KEY,
    model_name VARCHAR(200) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    
    -- Status and metadata
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_trained TIMESTAMP,
    last_updated TIMESTAMP,
    
    -- Model configuration
    algorithm VARCHAR(100) NOT NULL,
    hyperparameters JSONB DEFAULT '{}',
    features_used JSONB DEFAULT '[]',
    
    -- Performance metrics
    training_accuracy DECIMAL(5, 4),
    validation_accuracy DECIMAL(5, 4),
    test_accuracy DECIMAL(5, 4),
    cross_validation_score DECIMAL(5, 4),
    
    -- Training data info
    training_data_count INTEGER DEFAULT 0,
    training_data_sources JSONB DEFAULT '[]',
    last_training_date TIMESTAMP,
    
    -- Deployment
    is_deployed BOOLEAN DEFAULT FALSE,
    endpoint_url VARCHAR(500),
    prediction_count INTEGER DEFAULT 0,
    
    -- Additional metadata
    description TEXT,
    tags JSONB DEFAULT '[]',
    created_by VARCHAR(100) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ml_models_type ON ml_models(model_type);
CREATE INDEX IF NOT EXISTS idx_ml_models_status ON ml_models(status);
CREATE INDEX IF NOT EXISTS idx_ml_models_deployed ON ml_models(is_deployed);
"""

PREDICTION_RESULTS_TABLE = """
CREATE TABLE IF NOT EXISTS prediction_results (
    prediction_id VARCHAR(50) PRIMARY KEY,
    model_id VARCHAR(50) NOT NULL,
    
    -- Input and output
    input_data JSONB NOT NULL,
    prediction JSONB NOT NULL,
    confidence DECIMAL(5, 4) CHECK (confidence >= 0 AND confidence <= 1),
    prediction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Geographic context
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    area_name VARCHAR(200),
    geom GEOMETRY(POINT, 4326),
    
    -- Validation
    actual_value JSONB,
    validation_date TIMESTAMP,
    prediction_error DECIMAL(10, 6),
    
    -- Map usage
    used_for_mapping BOOLEAN DEFAULT FALSE,
    map_layer_id VARCHAR(100),
    
    FOREIGN KEY (model_id) REFERENCES ml_models(model_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prediction_results_model ON prediction_results(model_id);
CREATE INDEX IF NOT EXISTS idx_prediction_results_timestamp ON prediction_results(prediction_timestamp);
CREATE INDEX IF NOT EXISTS idx_prediction_results_location ON prediction_results USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_prediction_results_mapping ON prediction_results(used_for_mapping);
"""

# Trigger para atualizar automaticamente updated_at
UPDATE_TIMESTAMP_TRIGGER = """
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_biodiversity_studies_updated_at 
    BEFORE UPDATE ON biodiversity_studies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"""

# Views úteis para análises
USEFUL_VIEWS = """
-- View para estatísticas de estudos por tipo
CREATE OR REPLACE VIEW study_type_stats AS
SELECT 
    study_type,
    COUNT(*) as total_studies,
    AVG(data_quality_score) as avg_quality,
    COUNT(CASE WHEN processed_for_ml THEN 1 END) as processed_for_ml_count
FROM biodiversity_studies
GROUP BY study_type;

-- View para performance de modelos
CREATE OR REPLACE VIEW model_performance AS
SELECT 
    model_id,
    model_name,
    model_type,
    training_accuracy,
    validation_accuracy,
    test_accuracy,
    prediction_count,
    (prediction_count::float / EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) * 86400) as predictions_per_day
FROM ml_models
WHERE is_deployed = TRUE;

-- View para dados de treino por modelo
CREATE OR REPLACE VIEW training_data_summary AS
SELECT 
    model_type,
    COUNT(*) as total_training_samples,
    COUNT(CASE WHEN is_validated THEN 1 END) as validated_samples,
    AVG(data_quality) as avg_data_quality
FROM ml_training_data
GROUP BY model_type;
"""

def get_all_schemas() -> List[str]:
    """Retorna todas as definições de schema SQL"""
    return [
        BIODIVERSITY_STUDIES_TABLE,
        ML_TRAINING_DATA_TABLE,
        ML_MODELS_TABLE,
        PREDICTION_RESULTS_TABLE,
        UPDATE_TIMESTAMP_TRIGGER,
        USEFUL_VIEWS
    ]
