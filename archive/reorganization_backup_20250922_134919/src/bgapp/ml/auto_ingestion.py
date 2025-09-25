#!/usr/bin/env python3
"""
Sistema de Ingestão Automática para Machine Learning
Alimenta automaticamente a base de dados de ML a cada coleta de dados
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import uuid
import json
import numpy as np
import pandas as pd
from pathlib import Path

import asyncpg
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from ..models.biodiversity_ml_schemas import (
    BiodiversityStudySchema, 
    MLTrainingDataSchema, 
    StudyType, 
    DataSource
)
from ..core.secure_config import DatabaseSettings
from ..core.logging_config import setup_logging

logger = logging.getLogger(__name__)

@dataclass
class IngestionRule:
    """Regra de ingestão automática"""
    rule_id: str
    name: str
    study_types: List[StudyType]
    data_sources: List[DataSource]
    ml_model_types: List[str]
    min_quality_score: float = 0.7
    auto_process: bool = True
    feature_extraction_config: Dict[str, Any] = None

class AutoMLIngestionManager:
    """Gerenciador de ingestão automática para ML"""
    
    def __init__(self, db_settings: DatabaseSettings):
        self.db_settings = db_settings
        self.logger = logging.getLogger(__name__)
        
        # Configurações
        self.batch_size = 100
        self.processing_interval = 300  # 5 minutos
        self.quality_threshold = 0.7
        
        # Regras de ingestão
        self.ingestion_rules = self._load_default_rules()
        
        # Estado interno
        self._running = False
        self._last_processed_timestamp = datetime.now() - timedelta(days=1)
        
    def _load_default_rules(self) -> List[IngestionRule]:
        """Carrega regras padrão de ingestão"""
        return [
            IngestionRule(
                rule_id="biodiversity_predictor",
                name="Preditor de Biodiversidade",
                study_types=[StudyType.SPECIES_SURVEY, StudyType.HABITAT_ASSESSMENT],
                data_sources=[DataSource.FIELD_COLLECTION, DataSource.RESEARCH_VESSEL],
                ml_model_types=["biodiversity_predictor"],
                min_quality_score=0.8,
                feature_extraction_config={
                    "environmental_features": ["temperature", "salinity", "depth", "ph"],
                    "spatial_features": ["latitude", "longitude", "distance_to_coast"],
                    "temporal_features": ["month", "season", "hour_of_day"]
                }
            ),
            IngestionRule(
                rule_id="species_classifier",
                name="Classificador de Espécies",
                study_types=[StudyType.SPECIES_SURVEY],
                data_sources=[DataSource.FIELD_COLLECTION, DataSource.ACOUSTIC_MONITORING],
                ml_model_types=["species_classifier"],
                min_quality_score=0.9,
                feature_extraction_config={
                    "morphological_features": ["length", "weight", "color_pattern"],
                    "acoustic_features": ["frequency", "duration", "amplitude"],
                    "environmental_context": ["depth", "temperature", "habitat_type"]
                }
            ),
            IngestionRule(
                rule_id="habitat_suitability",
                name="Adequação de Habitat",
                study_types=[StudyType.HABITAT_ASSESSMENT, StudyType.ECOSYSTEM_HEALTH],
                data_sources=[DataSource.SATELLITE_IMAGERY, DataSource.SENSOR_NETWORK],
                ml_model_types=["habitat_suitability"],
                min_quality_score=0.75,
                feature_extraction_config={
                    "environmental_variables": ["temperature", "salinity", "chlorophyll", "turbidity"],
                    "substrate_features": ["depth", "slope", "rugosity"],
                    "human_impact": ["distance_to_ports", "fishing_pressure", "pollution_index"]
                }
            )
        ]
    
    async def start_auto_ingestion(self):
        """Inicia o processo de ingestão automática"""
        self._running = True
        self.logger.info("🚀 Iniciando ingestão automática para ML")
        
        while self._running:
            try:
                await self._process_new_studies()
                await asyncio.sleep(self.processing_interval)
            except Exception as e:
                self.logger.error(f"❌ Erro na ingestão automática: {e}")
                await asyncio.sleep(60)  # Aguardar antes de tentar novamente
    
    def stop_auto_ingestion(self):
        """Para o processo de ingestão automática"""
        self._running = False
        self.logger.info("⏹️ Ingestão automática parada")
    
    async def _process_new_studies(self):
        """Processa novos estudos de biodiversidade"""
        try:
            # Conectar à base de dados
            conn = await asyncpg.connect(self.db_settings.postgres_url)
            
            try:
                # Buscar estudos não processados
                new_studies = await self._get_unprocessed_studies(conn)
                
                if not new_studies:
                    return
                
                self.logger.info(f"📊 Processando {len(new_studies)} novos estudos")
                
                # Processar em lotes
                for i in range(0, len(new_studies), self.batch_size):
                    batch = new_studies[i:i + self.batch_size]
                    await self._process_study_batch(conn, batch)
                
                self._last_processed_timestamp = datetime.now()
                
            finally:
                await conn.close()
                
        except Exception as e:
            self.logger.error(f"❌ Erro processando estudos: {e}")
            raise
    
    async def _get_unprocessed_studies(self, conn: asyncpg.Connection) -> List[Dict]:
        """Obtém estudos não processados para ML"""
        query = """
        SELECT * FROM biodiversity_studies 
        WHERE processed_for_ml = FALSE 
        AND data_quality_score >= $1
        AND created_at > $2
        ORDER BY created_at DESC
        LIMIT $3
        """
        
        rows = await conn.fetch(
            query, 
            self.quality_threshold, 
            self._last_processed_timestamp,
            self.batch_size * 5
        )
        
        return [dict(row) for row in rows]
    
    async def _process_study_batch(self, conn: asyncpg.Connection, studies: List[Dict]):
        """Processa um lote de estudos"""
        for study in studies:
            try:
                await self._process_single_study(conn, study)
            except Exception as e:
                self.logger.error(f"❌ Erro processando estudo {study.get('study_id')}: {e}")
                continue
    
    async def _process_single_study(self, conn: asyncpg.Connection, study: Dict):
        """Processa um único estudo"""
        study_id = study['study_id']
        study_type = study['study_type']
        data_source = study['data_source']
        
        # Encontrar regras aplicáveis
        applicable_rules = self._find_applicable_rules(study_type, data_source)
        
        if not applicable_rules:
            self.logger.debug(f"Nenhuma regra aplicável para estudo {study_id}")
            return
        
        for rule in applicable_rules:
            try:
                # Extrair características para ML
                training_data = await self._extract_ml_features(study, rule)
                
                if training_data:
                    # Salvar dados de treino
                    await self._save_training_data(conn, training_data)
                    
                    # Marcar estudo como processado
                    await self._mark_study_processed(conn, study_id)
                    
                    self.logger.info(f"✅ Estudo {study_id} processado para {rule.name}")
                
            except Exception as e:
                self.logger.error(f"❌ Erro aplicando regra {rule.name} ao estudo {study_id}: {e}")
    
    def _find_applicable_rules(self, study_type: str, data_source: str) -> List[IngestionRule]:
        """Encontra regras aplicáveis a um estudo"""
        applicable_rules = []
        
        for rule in self.ingestion_rules:
            if (study_type in [st.value for st in rule.study_types] and 
                data_source in [ds.value for ds in rule.data_sources]):
                applicable_rules.append(rule)
        
        return applicable_rules
    
    async def _extract_ml_features(self, study: Dict, rule: IngestionRule) -> List[MLTrainingDataSchema]:
        """Extrai características para ML de um estudo"""
        training_data = []
        
        try:
            # Dados básicos do estudo
            base_features = {
                "latitude": study["latitude"],
                "longitude": study["longitude"],
                "depth_min": study.get("depth_min"),
                "depth_max": study.get("depth_max"),
                "sample_size": study["sample_size"],
                "data_quality_score": study["data_quality_score"]
            }
            
            # Parâmetros ambientais
            env_params = study.get("environmental_parameters", {})
            if env_params:
                base_features.update(env_params)
            
            # Características temporais
            start_date = study["start_date"]
            if isinstance(start_date, str):
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            
            temporal_features = {
                "month": start_date.month,
                "season": self._get_season(start_date.month),
                "hour": start_date.hour if start_date else 12
            }
            base_features.update(temporal_features)
            
            # Processar observações de espécies
            species_observed = study.get("species_observed", [])
            
            if species_observed and isinstance(species_observed, list):
                for species_obs in species_observed:
                    if isinstance(species_obs, dict):
                        # Criar dados de treino para cada observação
                        features = base_features.copy()
                        features.update(species_obs)
                        
                        # Determinar variável alvo baseada no tipo de modelo
                        target_variable, target_value = self._determine_target(species_obs, rule)
                        
                        if target_variable and target_value is not None:
                            training_data.append(MLTrainingDataSchema(
                                training_data_id=str(uuid.uuid4()),
                                source_study_id=study["study_id"],
                                model_type=rule.ml_model_types[0],  # Usar primeiro tipo
                                features=features,
                                target_variable=target_variable,
                                target_value=target_value,
                                data_quality=study["data_quality_score"]
                            ))
            
            else:
                # Criar dados de treino genéricos se não há observações específicas
                target_variable, target_value = self._determine_generic_target(study, rule)
                
                if target_variable and target_value is not None:
                    training_data.append(MLTrainingDataSchema(
                        training_data_id=str(uuid.uuid4()),
                        source_study_id=study["study_id"],
                        model_type=rule.ml_model_types[0],
                        features=base_features,
                        target_variable=target_variable,
                        target_value=target_value,
                        data_quality=study["data_quality_score"]
                    ))
            
        except Exception as e:
            self.logger.error(f"❌ Erro extraindo características ML: {e}")
            return []
        
        return training_data
    
    def _get_season(self, month: int) -> str:
        """Determina a estação baseada no mês (hemisfério sul)"""
        if month in [12, 1, 2]:
            return "summer"
        elif month in [3, 4, 5]:
            return "autumn"
        elif month in [6, 7, 8]:
            return "winter"
        else:
            return "spring"
    
    def _determine_target(self, species_obs: Dict, rule: IngestionRule) -> Tuple[Optional[str], Optional[Any]]:
        """Determina a variável alvo para treino baseada na observação e regra"""
        
        if "biodiversity_predictor" in rule.ml_model_types:
            # Para predição de biodiversidade, usar abundância ou presença
            if "abundance" in species_obs:
                return "abundance", species_obs["abundance"]
            elif "count" in species_obs:
                return "count", species_obs["count"]
            elif "presence" in species_obs:
                return "presence", 1 if species_obs["presence"] else 0
        
        elif "species_classifier" in rule.ml_model_types:
            # Para classificação de espécies, usar nome da espécie
            if "species_name" in species_obs:
                return "species_name", species_obs["species_name"]
            elif "scientific_name" in species_obs:
                return "scientific_name", species_obs["scientific_name"]
        
        elif "habitat_suitability" in rule.ml_model_types:
            # Para adequação de habitat, usar índice de qualidade
            if "habitat_quality" in species_obs:
                return "habitat_quality", species_obs["habitat_quality"]
            elif "suitability_score" in species_obs:
                return "suitability_score", species_obs["suitability_score"]
        
        return None, None
    
    def _determine_generic_target(self, study: Dict, rule: IngestionRule) -> Tuple[Optional[str], Optional[Any]]:
        """Determina variável alvo genérica baseada no estudo"""
        
        if "biodiversity_predictor" in rule.ml_model_types:
            # Usar número total de espécies observadas
            species_count = len(study.get("species_observed", []))
            return "species_richness", species_count
        
        elif "habitat_suitability" in rule.ml_model_types:
            # Usar score de qualidade dos dados como proxy
            return "habitat_quality", study["data_quality_score"]
        
        return None, None
    
    async def _save_training_data(self, conn: asyncpg.Connection, training_data: List[MLTrainingDataSchema]):
        """Salva dados de treino na base de dados"""
        if not training_data:
            return
        
        query = """
        INSERT INTO ml_training_data (
            training_data_id, source_study_id, model_type, features, 
            target_variable, target_value, data_quality, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (training_data_id) DO NOTHING
        """
        
        for data in training_data:
            await conn.execute(
                query,
                data.training_data_id,
                data.source_study_id,
                data.model_type,
                json.dumps(data.features),
                data.target_variable,
                json.dumps(data.target_value),
                data.data_quality,
                data.created_at
            )
    
    async def _mark_study_processed(self, conn: asyncpg.Connection, study_id: str):
        """Marca um estudo como processado para ML"""
        query = """
        UPDATE biodiversity_studies 
        SET processed_for_ml = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE study_id = $1
        """
        await conn.execute(query, study_id)
    
    async def trigger_model_retraining(self, model_types: Optional[List[str]] = None):
        """Dispara retreino de modelos com novos dados"""
        try:
            conn = await asyncpg.connect(self.db_settings.postgres_url)
            
            try:
                # Determinar quais modelos precisam ser retreinados
                models_to_retrain = await self._get_models_needing_retraining(conn, model_types)
                
                for model_type in models_to_retrain:
                    self.logger.info(f"🧠 Disparando retreino para modelo: {model_type}")
                    
                    # Aqui você integraria com seu sistema de treino (ex: Celery task)
                    # await self._schedule_model_retraining(model_type)
                    
            finally:
                await conn.close()
                
        except Exception as e:
            self.logger.error(f"❌ Erro disparando retreino de modelos: {e}")
            raise
    
    async def _get_models_needing_retraining(self, conn: asyncpg.Connection, model_types: Optional[List[str]] = None) -> List[str]:
        """Identifica modelos que precisam ser retreinados"""
        
        # Query para encontrar modelos com novos dados de treino
        query = """
        SELECT DISTINCT td.model_type
        FROM ml_training_data td
        LEFT JOIN ml_models m ON td.model_type = m.model_type
        WHERE td.created_at > COALESCE(m.last_training_date, '1900-01-01'::timestamp)
        AND td.is_validated = TRUE
        """
        
        if model_types:
            placeholders = ','.join(f'${i+1}' for i in range(len(model_types)))
            query += f" AND td.model_type = ANY(ARRAY[{placeholders}])"
            rows = await conn.fetch(query, *model_types)
        else:
            rows = await conn.fetch(query)
        
        return [row['model_type'] for row in rows]
    
    async def get_ingestion_stats(self) -> Dict[str, Any]:
        """Obtém estatísticas de ingestão"""
        try:
            conn = await asyncpg.connect(self.db_settings.postgres_url)
            
            try:
                # Estatísticas gerais
                stats_query = """
                SELECT 
                    COUNT(*) as total_studies,
                    COUNT(CASE WHEN processed_for_ml THEN 1 END) as processed_studies,
                    AVG(data_quality_score) as avg_quality,
                    MAX(created_at) as latest_study
                FROM biodiversity_studies
                """
                
                general_stats = await conn.fetchrow(stats_query)
                
                # Estatísticas por tipo de modelo
                model_stats_query = """
                SELECT 
                    model_type,
                    COUNT(*) as training_samples,
                    AVG(data_quality) as avg_data_quality,
                    MAX(created_at) as latest_data
                FROM ml_training_data
                GROUP BY model_type
                """
                
                model_stats = await conn.fetch(model_stats_query)
                
                return {
                    "general": dict(general_stats) if general_stats else {},
                    "by_model_type": [dict(row) for row in model_stats],
                    "ingestion_rules": len(self.ingestion_rules),
                    "last_processed": self._last_processed_timestamp.isoformat(),
                    "is_running": self._running
                }
                
            finally:
                await conn.close()
                
        except Exception as e:
            self.logger.error(f"❌ Erro obtendo estatísticas: {e}")
            return {"error": str(e)}

# Função auxiliar para inicializar o sistema
async def initialize_auto_ingestion(db_settings: DatabaseSettings) -> AutoMLIngestionManager:
    """Inicializa o sistema de ingestão automática"""
    manager = AutoMLIngestionManager(db_settings)
    
    # Criar tabelas se não existirem
    from .biodiversity_ml_schemas import get_all_schemas
    
    conn = await asyncpg.connect(db_settings.postgres_url)
    try:
        for schema_sql in get_all_schemas():
            await conn.execute(schema_sql)
        logger.info("✅ Esquemas de BD inicializados com sucesso")
    finally:
        await conn.close()
    
    return manager
