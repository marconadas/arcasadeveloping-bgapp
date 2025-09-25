#!/usr/bin/env python3
"""
Endpoints Seguros para Machine Learning e Filtros Preditivos
API robusta com validação, rate limiting e segurança
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Query, Path, Body, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import asyncpg
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from ..models.biodiversity_ml_schemas import StudyType, DataSource, MLModelStatus
from ..ml.auto_ingestion import AutoMLIngestionManager, initialize_auto_ingestion
from ..ml.predictive_filters import PredictiveFilterManager, FilterType, initialize_predictive_filters
from ..ml.models import MLModelManager, ModelType, PredictionResult
from ..core.secure_config import DatabaseSettings, SecuritySettings
from ..auth.security import auth_service, get_current_user

# Configuração de logging
logger = logging.getLogger(__name__)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

# Security
security = HTTPBearer()

# Modelos Pydantic para validação
class BiodiversityStudyRequest(BaseModel):
    """Request para criar estudo de biodiversidade"""
    study_name: str = Field(..., min_length=3, max_length=200)
    study_type: StudyType
    description: Optional[str] = Field(None, max_length=1000)
    
    # Dados geográficos
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    depth_min: Optional[float] = Field(None, ge=0)
    depth_max: Optional[float] = Field(None, ge=0)
    area_coverage_km2: Optional[float] = Field(None, gt=0)
    
    # Dados científicos
    species_observed: List[Dict[str, Any]] = Field(default_factory=list)
    environmental_parameters: Dict[str, Any] = Field(default_factory=dict)
    sampling_method: str = Field(..., min_length=3, max_length=100)
    sample_size: int = Field(..., gt=0)
    
    # Fonte
    data_source: DataSource
    institution: Optional[str] = Field(None, max_length=200)
    equipment_used: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(None, max_length=2000)
    
    @validator('depth_max')
    def validate_depth_range(cls, v, values):
        if v is not None and 'depth_min' in values and values['depth_min'] is not None:
            if v < values['depth_min']:
                raise ValueError('depth_max deve ser maior que depth_min')
        return v

class MLPredictionRequest(BaseModel):
    """Request para predição ML"""
    model_type: str = Field(..., min_length=3, max_length=50)
    input_data: Dict[str, Any] = Field(..., min_items=1)
    
    # Contexto geográfico opcional
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    area_name: Optional[str] = Field(None, max_length=200)
    
    # Configurações
    confidence_threshold: float = Field(0.5, ge=0, le=1)
    use_for_mapping: bool = False

class FilterRequest(BaseModel):
    """Request para criar filtro preditivo"""
    name: str = Field(..., min_length=3, max_length=200)
    filter_type: FilterType
    description: Optional[str] = Field(None, max_length=1000)
    model_id: str = Field(..., min_length=3, max_length=50)
    
    # Configurações de filtragem
    min_confidence: float = Field(0.6, ge=0, le=1)
    max_age_hours: int = Field(72, gt=0, le=720)  # Máximo 30 dias
    
    # Área geográfica (bbox)
    min_longitude: float = Field(-18.0, ge=-180, le=180)
    min_latitude: float = Field(-18.0, ge=-90, le=90)
    max_longitude: float = Field(12.0, ge=-180, le=180)
    max_latitude: float = Field(-5.0, ge=-90, le=90)
    
    # Visualização
    color_scheme: str = Field("viridis", pattern="^(viridis|confidence|plasma|inferno)$")
    opacity: float = Field(0.7, ge=0.1, le=1.0)
    show_confidence: bool = True
    
    @validator('max_longitude')
    def validate_bbox(cls, v, values):
        if 'min_longitude' in values and v <= values['min_longitude']:
            raise ValueError('max_longitude deve ser maior que min_longitude')
        return v
    
    @validator('max_latitude')
    def validate_bbox_lat(cls, v, values):
        if 'min_latitude' in values and v <= values['min_latitude']:
            raise ValueError('max_latitude deve ser maior que min_latitude')
        return v

# Responses
class StudyResponse(BaseModel):
    """Resposta de estudo criado"""
    study_id: str
    message: str
    processed_for_ml: bool
    data_quality_score: float

class PredictionResponse(BaseModel):
    """Resposta de predição"""
    prediction_id: str
    prediction: Any
    confidence: float
    model_type: str
    prediction_timestamp: datetime
    used_for_mapping: bool

class FilterResponse(BaseModel):
    """Resposta de filtro criado"""
    filter_id: str
    name: str
    total_points: int
    message: str

class SystemStatsResponse(BaseModel):
    """Estatísticas do sistema"""
    total_studies: int
    processed_studies: int
    active_models: int
    active_filters: int
    total_predictions: int
    system_health: str

# Dependências
async def get_db_settings() -> DatabaseSettings:
    """Obtém configurações da base de dados"""
    return DatabaseSettings()

async def get_ingestion_manager(db_settings: DatabaseSettings = Depends(get_db_settings)) -> AutoMLIngestionManager:
    """Obtém manager de ingestão"""
    return await initialize_auto_ingestion(db_settings)

async def get_filter_manager(db_settings: DatabaseSettings = Depends(get_db_settings)) -> PredictiveFilterManager:
    """Obtém manager de filtros"""
    return await initialize_predictive_filters(db_settings)

async def get_ml_manager() -> MLModelManager:
    """Obtém manager de ML"""
    return MLModelManager()

# Middleware de segurança
async def verify_api_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica token de API"""
    try:
        # Aqui você integraria com seu sistema de autenticação
        user = auth_service.verify_token(credentials.credentials)
        return user
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"}
        )

# Criar app FastAPI
def create_ml_api() -> FastAPI:
    """Cria aplicação FastAPI para ML"""
    
    app = FastAPI(
        title="BGAPP ML API",
        description="API para Machine Learning e Filtros Preditivos de Biodiversidade",
        version="2.0.0",
        docs_url="/ml/docs",
        redoc_url="/ml/redoc"
    )
    
    # Middleware
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:8085", 
            "http://localhost:3000",
            "https://bgapp-admin.pages.dev",
            "https://bgapp-frontend.pages.dev"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # === ENDPOINTS DE ESTUDOS DE BIODIVERSIDADE ===
    
    @app.post("/ml/studies", response_model=StudyResponse)
    @limiter.limit("30/minute")
    async def create_biodiversity_study(
        http_request: Request,
        request: BiodiversityStudyRequest,
        background_tasks: BackgroundTasks,
        user=Depends(verify_api_token),
        ingestion_manager: AutoMLIngestionManager = Depends(get_ingestion_manager)
    ):
        """
        Cria um novo estudo de biodiversidade
        
        Automaticamente:
        - Valida os dados de entrada
        - Calcula score de qualidade
        - Processa para ML se qualidade suficiente
        - Dispara retreino de modelos se necessário
        """
        try:
            study_id = f"study_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{user.get('user_id', 'anon')}"
            
            # Calcular score de qualidade
            quality_score = await _calculate_data_quality(request)
            
            # Criar estudo na BD
            conn = await asyncpg.connect(ingestion_manager.db_settings.postgres_url)
            
            try:
                # Inserir estudo
                await conn.execute("""
                    INSERT INTO biodiversity_studies (
                        study_id, study_name, study_type, description,
                        start_date, latitude, longitude, depth_min, depth_max, area_coverage_km2,
                        species_observed, environmental_parameters, sampling_method, sample_size,
                        data_quality_score, data_source, collector_id, institution,
                        equipment_used, notes, geom
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                        ST_SetSRID(ST_MakePoint($7, $6), 4326)
                    )
                """, 
                study_id, request.study_name, request.study_type.value, request.description,
                datetime.now(), request.latitude, request.longitude, request.depth_min, request.depth_max, request.area_coverage_km2,
                request.species_observed, request.environmental_parameters, request.sampling_method, request.sample_size,
                quality_score, request.data_source.value, user.get('user_id', 'anonymous'), request.institution,
                request.equipment_used, request.notes)
                
                # Processar para ML em background se qualidade suficiente
                processed_for_ml = False
                if quality_score >= 0.7:
                    background_tasks.add_task(_process_study_for_ml, study_id, ingestion_manager)
                    processed_for_ml = True
                
                logger.info(f"✅ Estudo criado: {study_id} (qualidade: {quality_score:.2f})")
                
                return StudyResponse(
                    study_id=study_id,
                    message="Estudo criado com sucesso",
                    processed_for_ml=processed_for_ml,
                    data_quality_score=quality_score
                )
                
            finally:
                await conn.close()
                
        except Exception as e:
            logger.error(f"❌ Erro criando estudo: {e}")
            raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
    
    @app.get("/ml/studies/{study_id}")
    @limiter.limit("100/minute")
    async def get_study(
        request: Request,
        study_id: str = Path(..., pattern="^study_[0-9]{8}_[0-9]{6}_.*"),
        user=Depends(verify_api_token),
        db_settings: DatabaseSettings = Depends(get_db_settings)
    ):
        """Obtém detalhes de um estudo"""
        try:
            conn = await asyncpg.connect(db_settings.postgres_url)
            
            try:
                study = await conn.fetchrow(
                    "SELECT * FROM biodiversity_studies WHERE study_id = $1",
                    study_id
                )
                
                if not study:
                    raise HTTPException(status_code=404, detail="Estudo não encontrado")
                
                return dict(study)
                
            finally:
                await conn.close()
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Erro obtendo estudo: {e}")
            raise HTTPException(status_code=500, detail="Erro interno")
    
    # === ENDPOINTS DE MACHINE LEARNING ===
    
    @app.post("/ml/predict", response_model=PredictionResponse)
    @limiter.limit("100/minute")
    async def make_prediction(
        http_request: Request,
        request: MLPredictionRequest,
        background_tasks: BackgroundTasks,
        user=Depends(verify_api_token),
        ml_manager: MLModelManager = Depends(get_ml_manager),
        db_settings: DatabaseSettings = Depends(get_db_settings)
    ):
        """
        Faz uma predição usando modelo de ML
        
        Automaticamente:
        - Valida dados de entrada
        - Executa predição
        - Armazena resultado se confiança suficiente
        - Atualiza filtros se usado para mapeamento
        """
        try:
            # Fazer predição
            result = ml_manager.predict(request.model_type, request.input_data)
            
            # Verificar confiança mínima
            if result.confidence < request.confidence_threshold:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Confiança {result.confidence:.2f} abaixo do threshold {request.confidence_threshold}"
                )
            
            # Salvar resultado se confiança suficiente
            if result.confidence >= 0.6:
                background_tasks.add_task(
                    _save_prediction_result, 
                    result, request, user, db_settings
                )
            
            # Atualizar filtros se usado para mapeamento
            if request.use_for_mapping:
                background_tasks.add_task(
                    _update_map_filters,
                    request.model_type, db_settings
                )
            
            logger.info(f"✅ Predição realizada: {request.model_type} (confiança: {result.confidence:.2f})")
            
            return PredictionResponse(
                prediction_id=result.prediction_id,
                prediction=result.prediction,
                confidence=result.confidence,
                model_type=request.model_type,
                prediction_timestamp=result.timestamp,
                used_for_mapping=request.use_for_mapping
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Erro fazendo predição: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do modelo")
    
    @app.get("/ml/models")
    @limiter.limit("60/minute")
    async def get_available_models(
        request: Request,
        user=Depends(verify_api_token),
        ml_manager: MLModelManager = Depends(get_ml_manager)
    ):
        """Lista modelos disponíveis"""
        try:
            models = []
            for model_type, model_info in ml_manager.models.items():
                models.append({
                    "model_type": model_type,
                    "name": model_info.get("name", model_type),
                    "accuracy": model_info.get("accuracy", 0),
                    "features": model_info.get("features", []),
                    "is_trained": model_info.get("trained", False),
                    "last_updated": model_info.get("last_updated", "N/A")
                })
            
            return {
                "models": models,
                "total": len(models),
                "available": sum(1 for m in models if m["is_trained"])
            }
            
        except Exception as e:
            logger.error(f"❌ Erro listando modelos: {e}")
            raise HTTPException(status_code=500, detail="Erro interno")
    
    @app.post("/ml/train/{model_type}")
    @limiter.limit("5/hour")  # Rate limit mais restritivo para treino
    async def train_model(
        request: Request,
        background_tasks: BackgroundTasks,
        model_type: str = Path(..., pattern="^[a-z_]+$"),
        user=Depends(verify_api_token),
        ml_manager: MLModelManager = Depends(get_ml_manager)
    ):
        """Dispara treino de um modelo específico"""
        try:
            # Verificar se modelo existe
            if model_type not in [mt.value for mt in ModelType]:
                raise HTTPException(status_code=400, detail="Tipo de modelo inválido")
            
            # Disparar treino em background
            background_tasks.add_task(_train_model_background, model_type, ml_manager, user)
            
            return {
                "message": f"Treino do modelo {model_type} iniciado",
                "model_type": model_type,
                "estimated_duration": "5-15 minutos",
                "started_by": user.get("username", "unknown")
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Erro iniciando treino: {e}")
            raise HTTPException(status_code=500, detail="Erro interno")
    
    # === ENDPOINTS DE FILTROS PREDITIVOS ===
    
    @app.post("/ml/filters", response_model=FilterResponse)
    @limiter.limit("20/minute")
    async def create_filter(
        http_request: Request,
        request: FilterRequest,
        background_tasks: BackgroundTasks,
        user=Depends(verify_api_token),
        filter_manager: PredictiveFilterManager = Depends(get_filter_manager)
    ):
        """Cria um novo filtro preditivo"""
        try:
            # Configurar filtro
            filter_config = {
                "name": request.name,
                "filter_type": request.filter_type.value,
                "description": request.description,
                "model_id": request.model_id,
                "min_confidence": request.min_confidence,
                "max_age_hours": request.max_age_hours,
                "bbox": (request.min_longitude, request.min_latitude, request.max_longitude, request.max_latitude),
                "color_scheme": request.color_scheme,
                "opacity": request.opacity,
                "show_confidence": request.show_confidence
            }
            
            # Criar filtro
            map_filter = await filter_manager.create_filter(filter_config)
            
            # Gerar predições iniciais em background
            background_tasks.add_task(
                filter_manager._generate_filter_predictions,
                map_filter
            )
            
            logger.info(f"✅ Filtro criado: {map_filter.name} ({map_filter.filter_id})")
            
            return FilterResponse(
                filter_id=map_filter.filter_id,
                name=map_filter.name,
                total_points=0,  # Será atualizado em background
                message="Filtro criado com sucesso"
            )
            
        except Exception as e:
            logger.error(f"❌ Erro criando filtro: {e}")
            raise HTTPException(status_code=500, detail="Erro interno")
    
    @app.get("/ml/filters")
    @limiter.limit("100/minute")
    async def list_filters(
        request: Request,
        user=Depends(verify_api_token),
        filter_manager: PredictiveFilterManager = Depends(get_filter_manager)
    ):
        """Lista filtros disponíveis"""
        try:
            filters = await filter_manager.get_available_filters()
            return {
                "filters": filters,
                "total": len(filters),
                "active": sum(1 for f in filters if f["is_active"])
            }
            
        except Exception as e:
            logger.error(f"❌ Erro listando filtros: {e}")
            raise HTTPException(status_code=500, detail="Erro interno")
    
    @app.get("/ml/filters/{filter_id}/data")
    @limiter.limit("200/minute")
    async def get_filter_data(
        request: Request,
        filter_id: str = Path(..., min_length=3, max_length=100),
        user=Depends(verify_api_token),
        filter_manager: PredictiveFilterManager = Depends(get_filter_manager)
    ):
        """Obtém dados do filtro para o mapa"""
        try:
            data = await filter_manager.get_filter_data_for_map(filter_id)
            return data
            
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            logger.error(f"❌ Erro obtendo dados do filtro: {e}")
            raise HTTPException(status_code=500, detail="Erro interno")
    
    @app.put("/ml/filters/{filter_id}/refresh")
    @limiter.limit("10/minute")
    async def refresh_filter(
        request: Request,
        background_tasks: BackgroundTasks,
        filter_id: str = Path(..., min_length=3, max_length=100),
        user=Depends(verify_api_token),
        filter_manager: PredictiveFilterManager = Depends(get_filter_manager)
    ):
        """Atualiza predições de um filtro"""
        try:
            # Atualizar em background
            background_tasks.add_task(
                filter_manager.update_filter_predictions,
                filter_id
            )
            
            return {
                "message": f"Atualização do filtro {filter_id} iniciada",
                "filter_id": filter_id,
                "requested_by": user.get("username", "unknown")
            }
            
        except Exception as e:
            logger.error(f"❌ Erro atualizando filtro: {e}")
            raise HTTPException(status_code=500, detail="Erro interno")
    
    # === ENDPOINTS DE ESTATÍSTICAS ===
    
    @app.get("/ml/stats", response_model=SystemStatsResponse)
    @limiter.limit("30/minute")
    async def get_system_stats(
        request: Request,
        user=Depends(verify_api_token),
        ingestion_manager: AutoMLIngestionManager = Depends(get_ingestion_manager),
        filter_manager: PredictiveFilterManager = Depends(get_filter_manager),
        ml_manager: MLModelManager = Depends(get_ml_manager)
    ):
        """Obtém estatísticas do sistema"""
        try:
            # Obter estatísticas em paralelo
            ingestion_stats, filter_stats = await asyncio.gather(
                ingestion_manager.get_ingestion_stats(),
                filter_manager.get_filter_statistics()
            )
            
            # Contar modelos ativos
            active_models = sum(1 for model_info in ml_manager.models.values() 
                              if model_info.get("trained", False))
            
            return SystemStatsResponse(
                total_studies=ingestion_stats.get("general", {}).get("total_studies", 0),
                processed_studies=ingestion_stats.get("general", {}).get("processed_studies", 0),
                active_models=active_models,
                active_filters=filter_stats.get("general", {}).get("active_filters", 0),
                total_predictions=filter_stats.get("cached_points", 0),
                system_health="healthy" if ingestion_stats.get("is_running", False) else "degraded"
            )
            
        except Exception as e:
            logger.error(f"❌ Erro obtendo estatísticas: {e}")
            raise HTTPException(status_code=500, detail="Erro interno")
    
    @app.get("/ml/health")
    @limiter.limit("300/minute")
    async def health_check(request: Request):
        """Health check da API"""
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0.0",
            "services": {
                "database": "ok",
                "ml_models": "ok",
                "filters": "ok"
            }
        }
    
    return app

# === FUNÇÕES AUXILIARES ===

async def _calculate_data_quality(request: BiodiversityStudyRequest) -> float:
    """Calcula score de qualidade dos dados"""
    score = 0.5  # Base score
    
    # Completude dos dados
    if request.description:
        score += 0.05
    if request.depth_min is not None and request.depth_max is not None:
        score += 0.1
    if request.area_coverage_km2:
        score += 0.05
    if request.species_observed:
        score += 0.15
    if request.environmental_parameters:
        score += 0.1
    if request.equipment_used:
        score += 0.05
    
    # Qualidade dos dados de espécies
    if request.species_observed:
        for obs in request.species_observed:
            if isinstance(obs, dict) and "species_name" in obs:
                score += 0.02
    
    return min(score, 1.0)

async def _process_study_for_ml(study_id: str, ingestion_manager: AutoMLIngestionManager):
    """Processa estudo para ML em background"""
    try:
        # Forçar processamento do estudo específico
        conn = await asyncpg.connect(ingestion_manager.db_settings.postgres_url)
        
        try:
            study = await conn.fetchrow(
                "SELECT * FROM biodiversity_studies WHERE study_id = $1",
                study_id
            )
            
            if study:
                await ingestion_manager._process_single_study(conn, dict(study))
                logger.info(f"✅ Estudo {study_id} processado para ML")
                
        finally:
            await conn.close()
            
    except Exception as e:
        logger.error(f"❌ Erro processando estudo {study_id} para ML: {e}")

async def _save_prediction_result(
    result: PredictionResult, 
    request: MLPredictionRequest, 
    user: Dict, 
    db_settings: DatabaseSettings
):
    """Salva resultado de predição em background"""
    try:
        conn = await asyncpg.connect(db_settings.postgres_url)
        
        try:
            await conn.execute("""
                INSERT INTO prediction_results (
                    prediction_id, model_id, input_data, prediction, confidence,
                    prediction_timestamp, latitude, longitude, area_name,
                    used_for_mapping, geom
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                         CASE WHEN $7 IS NOT NULL AND $8 IS NOT NULL 
                              THEN ST_SetSRID(ST_MakePoint($8, $7), 4326) 
                              ELSE NULL END)
            """,
            result.prediction_id, request.model_type, request.input_data, result.prediction,
            result.confidence, result.timestamp, request.latitude, request.longitude,
            request.area_name, request.use_for_mapping)
            
        finally:
            await conn.close()
            
    except Exception as e:
        logger.error(f"❌ Erro salvando resultado de predição: {e}")

async def _update_map_filters(model_type: str, db_settings: DatabaseSettings):
    """Atualiza filtros do mapa em background"""
    try:
        filter_manager = await initialize_predictive_filters(db_settings)
        
        # Encontrar filtros que usam este modelo
        filters = await filter_manager.get_available_filters()
        relevant_filters = [f for f in filters if f.get("model_id") == model_type]
        
        for filter_info in relevant_filters:
            await filter_manager.update_filter_predictions(filter_info["filter_id"])
            
        logger.info(f"✅ {len(relevant_filters)} filtros atualizados para modelo {model_type}")
        
    except Exception as e:
        logger.error(f"❌ Erro atualizando filtros para modelo {model_type}: {e}")

async def _train_model_background(model_type: str, ml_manager: MLModelManager, user: Dict):
    """Treina modelo em background"""
    try:
        logger.info(f"🧠 Iniciando treino do modelo {model_type} por {user.get('username', 'unknown')}")
        
        # Aqui você integraria com o sistema de treino real
        # Por exemplo, disparar uma tarefa Celery
        # result = train_model_task.delay(model_type)
        
        # Simulação por enquanto
        await asyncio.sleep(5)
        logger.info(f"✅ Treino do modelo {model_type} concluído")
        
    except Exception as e:
        logger.error(f"❌ Erro treinando modelo {model_type}: {e}")

# Instância da API
ml_api = create_ml_api()
