#!/usr/bin/env python3
"""
Inicialização das Bases de Dados para Machine Learning
Cria e configura automaticamente todas as tabelas necessárias
"""

import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any
import asyncpg
from pathlib import Path

from ..models.biodiversity_ml_schemas import get_all_schemas
from ..core.secure_config import DatabaseSettings

logger = logging.getLogger(__name__)

class MLDatabaseInitializer:
    """Inicializador das bases de dados de ML"""
    
    def __init__(self, db_settings: DatabaseSettings):
        self.db_settings = db_settings
        self.logger = logging.getLogger(__name__)
    
    async def initialize_all_schemas(self) -> Dict[str, Any]:
        """Inicializa todos os esquemas de ML"""
        try:
            conn = await asyncpg.connect(self.db_settings.postgres_url)
            
            results = {
                "schemas_created": [],
                "schemas_updated": [],
                "errors": [],
                "total_time": 0
            }
            
            start_time = datetime.now()
            
            try:
                # Verificar se PostGIS está habilitado
                await self._ensure_postgis(conn)
                
                # Executar todos os schemas
                schemas = get_all_schemas()
                
                for i, schema_sql in enumerate(schemas):
                    try:
                        self.logger.info(f"📊 Executando schema {i+1}/{len(schemas)}...")
                        await conn.execute(schema_sql)
                        results["schemas_created"].append(f"Schema_{i+1}")
                        
                    except Exception as e:
                        error_msg = f"Erro no schema {i+1}: {str(e)}"
                        self.logger.error(f"❌ {error_msg}")
                        results["errors"].append(error_msg)
                
                # Inserir dados iniciais
                await self._insert_initial_data(conn)
                
                # Verificar integridade
                integrity_results = await self._verify_database_integrity(conn)
                results.update(integrity_results)
                
                results["total_time"] = (datetime.now() - start_time).total_seconds()
                
                self.logger.info(f"✅ Inicialização concluída em {results['total_time']:.2f}s")
                return results
                
            finally:
                await conn.close()
                
        except Exception as e:
            self.logger.error(f"❌ Erro na inicialização: {e}")
            raise
    
    async def _ensure_postgis(self, conn: asyncpg.Connection):
        """Garante que PostGIS está habilitado"""
        try:
            # Verificar se PostGIS está instalado
            result = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'postgis')"
            )
            
            if not result:
                # Tentar instalar PostGIS
                try:
                    await conn.execute("CREATE EXTENSION IF NOT EXISTS postgis")
                    self.logger.info("✅ PostGIS habilitado")
                except Exception as e:
                    self.logger.warning(f"⚠️ Não foi possível habilitar PostGIS: {e}")
            else:
                self.logger.info("✅ PostGIS já está habilitado")
                
        except Exception as e:
            self.logger.warning(f"⚠️ Erro verificando PostGIS: {e}")
    
    async def _insert_initial_data(self, conn: asyncpg.Connection):
        """Insere dados iniciais necessários"""
        try:
            # Inserir modelos padrão se não existirem
            default_models = [
                {
                    "model_id": "biodiversity_predictor_v1",
                    "model_name": "Preditor de Biodiversidade v1.0",
                    "model_type": "biodiversity_predictor",
                    "version": "1.0",
                    "status": "trained",
                    "algorithm": "RandomForestRegressor",
                    "features_used": ["latitude", "longitude", "depth", "temperature", "salinity"],
                    "created_by": "system"
                },
                {
                    "model_id": "species_classifier_v1",
                    "model_name": "Classificador de Espécies v1.0",
                    "model_type": "species_classifier",
                    "version": "1.0",
                    "status": "trained",
                    "algorithm": "RandomForestClassifier",
                    "features_used": ["morphological_features", "environmental_context"],
                    "created_by": "system"
                },
                {
                    "model_id": "habitat_suitability_v1",
                    "model_name": "Adequação de Habitat v1.0",
                    "model_type": "habitat_suitability",
                    "version": "1.0",
                    "status": "trained",
                    "algorithm": "GradientBoostingRegressor",
                    "features_used": ["environmental_variables", "substrate_features"],
                    "created_by": "system"
                }
            ]
            
            for model in default_models:
                await conn.execute("""
                    INSERT INTO ml_models (
                        model_id, model_name, model_type, version, status,
                        algorithm, features_used, created_by, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                    ON CONFLICT (model_id) DO NOTHING
                """,
                model["model_id"], model["model_name"], model["model_type"],
                model["version"], model["status"], model["algorithm"],
                model["features_used"], model["created_by"])
            
            self.logger.info(f"✅ {len(default_models)} modelos padrão inseridos")
            
            # Inserir estudo de exemplo se não existir
            await conn.execute("""
                INSERT INTO biodiversity_studies (
                    study_id, study_name, study_type, description,
                    start_date, latitude, longitude, depth_min, depth_max,
                    species_observed, environmental_parameters, sampling_method, sample_size,
                    data_quality_score, data_source, collector_id, institution,
                    geom, processed_for_ml
                ) VALUES (
                    'example_study_001',
                    'Estudo de Exemplo - Costa de Luanda',
                    'species_survey',
                    'Estudo demonstrativo da funcionalidade do sistema',
                    CURRENT_TIMESTAMP,
                    -8.8383, 13.2344, 5.0, 25.0,
                    '[{"species_name": "Sardinella aurita", "count": 15, "size_avg": 12.5}]'::jsonb,
                    '{"temperature": 24.5, "salinity": 35.2, "ph": 8.1}'::jsonb,
                    'visual_census', 50,
                    0.85, 'research_vessel', 'system_admin', 'Instituto Nacional de Investigação Pesqueira',
                    ST_SetSRID(ST_MakePoint(13.2344, -8.8383), 4326),
                    true
                ) ON CONFLICT (study_id) DO NOTHING
            """)
            
            self.logger.info("✅ Estudo de exemplo inserido")
            
        except Exception as e:
            self.logger.error(f"❌ Erro inserindo dados iniciais: {e}")
            raise
    
    async def _verify_database_integrity(self, conn: asyncpg.Connection) -> Dict[str, Any]:
        """Verifica integridade da base de dados"""
        integrity_results = {
            "tables_verified": [],
            "indexes_verified": [],
            "constraints_verified": [],
            "data_integrity": {}
        }
        
        try:
            # Verificar tabelas principais
            tables_to_check = [
                "biodiversity_studies",
                "ml_training_data", 
                "ml_models",
                "prediction_results"
            ]
            
            for table in tables_to_check:
                count = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
                integrity_results["tables_verified"].append({
                    "table": table,
                    "row_count": count,
                    "status": "ok"
                })
            
            # Verificar índices geoespaciais
            spatial_indexes = await conn.fetch("""
                SELECT schemaname, tablename, indexname 
                FROM pg_indexes 
                WHERE indexname LIKE '%geom%' OR indexname LIKE '%gist%'
            """)
            
            for idx in spatial_indexes:
                integrity_results["indexes_verified"].append({
                    "index": idx['indexname'],
                    "table": idx['tablename'],
                    "status": "ok"
                })
            
            # Verificar constraints de chave estrangeira
            fk_constraints = await conn.fetch("""
                SELECT conname, conrelid::regclass AS table_name
                FROM pg_constraint
                WHERE contype = 'f'
                AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            """)
            
            for constraint in fk_constraints:
                integrity_results["constraints_verified"].append({
                    "constraint": constraint['conname'],
                    "table": str(constraint['table_name']),
                    "status": "ok"
                })
            
            # Verificar integridade dos dados
            # Estudos com geometria válida
            valid_geom_count = await conn.fetchval("""
                SELECT COUNT(*) FROM biodiversity_studies 
                WHERE geom IS NOT NULL AND ST_IsValid(geom)
            """)
            
            total_studies = await conn.fetchval("SELECT COUNT(*) FROM biodiversity_studies")
            
            integrity_results["data_integrity"] = {
                "total_studies": total_studies,
                "valid_geometries": valid_geom_count,
                "geometry_integrity": (valid_geom_count / max(total_studies, 1)) * 100
            }
            
            self.logger.info("✅ Verificação de integridade concluída")
            return integrity_results
            
        except Exception as e:
            self.logger.error(f"❌ Erro verificando integridade: {e}")
            return integrity_results
    
    async def create_sample_data(self, num_studies: int = 10) -> Dict[str, Any]:
        """Cria dados de exemplo para testes"""
        try:
            conn = await asyncpg.connect(self.db_settings.postgres_url)
            
            results = {
                "studies_created": 0,
                "training_data_created": 0,
                "predictions_created": 0
            }
            
            try:
                # Coordenadas da costa de Angola
                angola_coords = [
                    (-8.8383, 13.2344),   # Luanda
                    (-12.2767, 13.5536),  # Benguela
                    (-15.1594, 12.1522),  # Namibe
                    (-5.5550, 12.3514),   # Cabinda
                    (-9.2649, 13.2451),   # Luanda Sul
                ]
                
                species_list = [
                    "Sardinella aurita", "Trachurus capensis", "Merluccius capensis",
                    "Engraulis encrasicolus", "Scomber japonicus", "Dentex angolensis"
                ]
                
                for i in range(num_studies):
                    # Escolher coordenadas aleatórias
                    import random
                    lat, lon = random.choice(angola_coords)
                    lat += random.uniform(-0.5, 0.5)  # Adicionar variação
                    lon += random.uniform(-0.5, 0.5)
                    
                    study_id = f"sample_study_{i+1:03d}"
                    
                    # Criar observações de espécies
                    species_obs = []
                    for _ in range(random.randint(1, 4)):
                        species_obs.append({
                            "species_name": random.choice(species_list),
                            "count": random.randint(1, 50),
                            "size_avg": round(random.uniform(8.0, 25.0), 1),
                            "abundance": random.randint(1, 100)
                        })
                    
                    # Parâmetros ambientais
                    env_params = {
                        "temperature": round(random.uniform(18.0, 28.0), 1),
                        "salinity": round(random.uniform(34.0, 36.0), 1),
                        "ph": round(random.uniform(7.8, 8.3), 1),
                        "depth": round(random.uniform(10.0, 200.0), 1)
                    }
                    
                    # Inserir estudo
                    await conn.execute("""
                        INSERT INTO biodiversity_studies (
                            study_id, study_name, study_type, description,
                            start_date, latitude, longitude, depth_min, depth_max,
                            species_observed, environmental_parameters, sampling_method, sample_size,
                            data_quality_score, data_source, collector_id,
                            geom, processed_for_ml
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                            ST_SetSRID(ST_MakePoint($7, $6), 4326), $17
                        ) ON CONFLICT (study_id) DO NOTHING
                    """,
                    study_id, f"Estudo de Amostra {i+1}", "species_survey",
                    f"Estudo gerado automaticamente para testes - Localização {i+1}",
                    datetime.now(), lat, lon, 5.0, env_params["depth"],
                    species_obs, env_params, "visual_census", len(species_obs) * 10,
                    random.uniform(0.7, 0.95), "research_vessel", "sample_collector",
                    True)
                    
                    results["studies_created"] += 1
                    
                    # Criar dados de treino correspondentes
                    for species_ob in species_obs:
                        training_id = f"training_{study_id}_{species_ob['species_name'].replace(' ', '_')}"
                        
                        features = {
                            "latitude": lat,
                            "longitude": lon,
                            "depth": env_params["depth"],
                            "temperature": env_params["temperature"],
                            "salinity": env_params["salinity"],
                            "ph": env_params["ph"]
                        }
                        
                        await conn.execute("""
                            INSERT INTO ml_training_data (
                                training_data_id, source_study_id, model_type,
                                features, target_variable, target_value, data_quality,
                                is_validated
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            ON CONFLICT (training_data_id) DO NOTHING
                        """,
                        training_id, study_id, "biodiversity_predictor",
                        features, "abundance", species_ob["abundance"],
                        random.uniform(0.7, 0.9), True)
                        
                        results["training_data_created"] += 1
                
                # Criar algumas predições de exemplo
                for i in range(min(num_studies * 2, 20)):
                    lat, lon = random.choice(angola_coords)
                    lat += random.uniform(-0.2, 0.2)
                    lon += random.uniform(-0.2, 0.2)
                    
                    prediction_id = f"pred_sample_{i+1:03d}"
                    
                    await conn.execute("""
                        INSERT INTO prediction_results (
                            prediction_id, model_id, input_data, prediction, confidence,
                            latitude, longitude, area_name, used_for_mapping,
                            geom
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9,
                            ST_SetSRID(ST_MakePoint($7, $6), 4326)
                        ) ON CONFLICT (prediction_id) DO NOTHING
                    """,
                    prediction_id, "biodiversity_predictor_v1",
                    {"temperature": random.uniform(20, 26), "depth": random.uniform(10, 100)},
                    {"species_richness": random.randint(5, 25)},
                    random.uniform(0.6, 0.95), lat, lon, f"Área {i+1}", True)
                    
                    results["predictions_created"] += 1
                
                self.logger.info(f"✅ Dados de exemplo criados: {results}")
                return results
                
            finally:
                await conn.close()
                
        except Exception as e:
            self.logger.error(f"❌ Erro criando dados de exemplo: {e}")
            raise
    
    async def cleanup_old_data(self, days_old: int = 30) -> Dict[str, int]:
        """Remove dados antigos para manutenção"""
        try:
            conn = await asyncpg.connect(self.db_settings.postgres_url)
            
            cleanup_results = {
                "old_predictions_removed": 0,
                "old_training_data_removed": 0,
                "deprecated_models_removed": 0
            }
            
            try:
                cutoff_date = datetime.now() - timedelta(days=days_old)
                
                # Remover predições antigas não usadas para mapeamento
                old_predictions = await conn.execute("""
                    DELETE FROM prediction_results 
                    WHERE prediction_timestamp < $1 
                    AND used_for_mapping = FALSE
                """, cutoff_date)
                cleanup_results["old_predictions_removed"] = int(old_predictions.split()[-1])
                
                # Remover dados de treino não validados antigos
                old_training = await conn.execute("""
                    DELETE FROM ml_training_data 
                    WHERE created_at < $1 
                    AND is_validated = FALSE
                """, cutoff_date)
                cleanup_results["old_training_data_removed"] = int(old_training.split()[-1])
                
                # Marcar modelos antigos como deprecated
                deprecated = await conn.execute("""
                    UPDATE ml_models 
                    SET status = 'deprecated' 
                    WHERE last_updated < $1 
                    AND status NOT IN ('deprecated', 'failed')
                """, cutoff_date)
                cleanup_results["deprecated_models_removed"] = int(deprecated.split()[-1])
                
                self.logger.info(f"✅ Limpeza concluída: {cleanup_results}")
                return cleanup_results
                
            finally:
                await conn.close()
                
        except Exception as e:
            self.logger.error(f"❌ Erro na limpeza: {e}")
            raise

# Função auxiliar para inicialização completa
async def initialize_ml_database(db_settings: DatabaseSettings = None) -> Dict[str, Any]:
    """Inicializa completamente a base de dados de ML"""
    if not db_settings:
        db_settings = DatabaseSettings()
    
    initializer = MLDatabaseInitializer(db_settings)
    
    # Inicializar schemas
    schema_results = await initializer.initialize_all_schemas()
    
    # Criar dados de exemplo se não existirem estudos
    conn = await asyncpg.connect(db_settings.postgres_url)
    try:
        study_count = await conn.fetchval("SELECT COUNT(*) FROM biodiversity_studies")
        if study_count == 0:
            logger.info("📊 Criando dados de exemplo...")
            sample_results = await initializer.create_sample_data(5)
            schema_results["sample_data"] = sample_results
    finally:
        await conn.close()
    
    return schema_results

# Script CLI para execução direta
if __name__ == "__main__":
    async def main():
        logging.basicConfig(level=logging.INFO)
        db_settings = DatabaseSettings()
        
        print("🚀 Inicializando base de dados de Machine Learning...")
        results = await initialize_ml_database(db_settings)
        
        print("\n📊 Resultados da inicialização:")
        for key, value in results.items():
            print(f"  {key}: {value}")
        
        print("\n✅ Inicialização concluída com sucesso!")
    
    asyncio.run(main())
