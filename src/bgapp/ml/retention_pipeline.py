"""
🔄 ML Retention Pipeline
Pipeline não-invasivo que alimenta automaticamente a base de retenção ML

INTEGRAÇÃO TRANSPARENTE:
- Intercepta operações ML existentes
- Adiciona cache sem modificar APIs
- Funciona em background
- Compatible com Cloudflare Workers
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
import hashlib

# Imports do sistema existente (não-invasivos)
try:
    from .retention_manager import MLRetentionManager, get_retention_manager
    from .ml_model_manager import MLModelManager
    from ..models.biodiversity_ml_schemas import *
    from ..database.database_manager import DatabaseManager
except ImportError:
    # Fallback para desenvolvimento
    import sys
    # Path already in PYTHONPATH

logger = logging.getLogger(__name__)


@dataclass
class PipelineMetrics:
    """Métricas do pipeline de retenção"""
    studies_processed: int = 0
    features_extracted: int = 0
    predictions_cached: int = 0
    aggregations_created: int = 0
    errors_handled: int = 0
    processing_time_total: float = 0.0


class MLRetentionPipeline:
    """
    🔄 Pipeline de Retenção ML
    
    Sistema que intercepta e otimiza operações ML existentes
    através de decorators e hooks não-invasivos.
    """
    
    def __init__(self, retention_manager: Optional[MLRetentionManager] = None):
        """Inicializar pipeline de retenção"""
        
        self.retention_manager = retention_manager or get_retention_manager()
        self.metrics = PipelineMetrics()
        
        # Configurações do pipeline
        self.config = {
            'auto_extract_features': True,
            'cache_predictions': True,
            'create_aggregations': True,
            'background_processing': True,
            'batch_size': 100,
            'processing_interval_minutes': 15
        }
        
        # Hooks para integração com sistema existente
        self.hooks = {
            'before_study_save': [],
            'after_study_save': [],
            'before_prediction': [],
            'after_prediction': [],
            'before_training': [],
            'after_training': []
        }
        
        # Queue de processamento em background
        self.processing_queue = asyncio.Queue()
        self.background_task = None
        
        logger.info("🔄 ML Retention Pipeline inicializado")
    
    # =====================================
    # 🎯 DECORATORS PARA INTEGRAÇÃO NÃO-INVASIVA
    # =====================================
    
    def cache_features(self, feature_type: str, source_table: str = None):
        """
        Decorator para cache automático de características
        
        Usage:
            @pipeline.cache_features('environmental', 'biodiversity_studies')
            async def extract_environmental_features(study_id):
                # Função original não modificada
                return features
        """
        def decorator(func: Callable):
            async def wrapper(*args, **kwargs):
                # Determinar source_data_id dos argumentos
                source_data_id = args[0] if args else kwargs.get('study_id', kwargs.get('data_id'))
                
                if source_data_id and self.config['auto_extract_features']:
                    # Usar cache de retenção
                    return await self.retention_manager.get_or_compute_features(
                        source_data_id=str(source_data_id),
                        source_table=source_table or 'unknown',
                        feature_type=feature_type,
                        compute_func=lambda sid, **kw: func(*args, **kwargs),
                        **kwargs
                    )
                else:
                    # Executar função original
                    return await func(*args, **kwargs)
            
            return wrapper
        return decorator
    
    def cache_predictions(self, model_type: str, ttl_hours: int = 6):
        """
        Decorator para cache automático de predições
        
        Usage:
            @pipeline.cache_predictions('biodiversity_predictor', ttl_hours=12)
            async def predict_biodiversity(model_id, input_data):
                # Função original não modificada
                return prediction
        """
        def decorator(func: Callable):
            async def wrapper(*args, **kwargs):
                model_id = args[0] if args else kwargs.get('model_id')
                input_data = args[1] if len(args) > 1 else kwargs.get('input_data', {})
                
                if model_id and input_data and self.config['cache_predictions']:
                    # Usar cache de inferência
                    return await self.retention_manager.get_or_compute_prediction(
                        model_id=str(model_id),
                        input_data=input_data,
                        predict_func=lambda data: func(*args, **kwargs),
                        ttl_hours=ttl_hours
                    )
                else:
                    # Executar função original
                    return await func(*args, **kwargs)
            
            return wrapper
        return decorator
    
    def cache_training_data(self, model_type: str):
        """
        Decorator para cache automático de dados de treino
        
        Usage:
            @pipeline.cache_training_data('species_classifier')
            async def prepare_training_data(data_version, **params):
                # Função original não modificada
                return X_train, y_train, metadata
        """
        def decorator(func: Callable):
            async def wrapper(*args, **kwargs):
                data_version = args[0] if args else kwargs.get('data_version', 'latest')
                
                if self.config['auto_extract_features']:
                    # Usar cache de treino
                    return await self.retention_manager.get_or_prepare_training_data(
                        model_type=model_type,
                        data_version=str(data_version),
                        prepare_func=lambda **kw: func(*args, **kwargs),
                        **kwargs
                    )
                else:
                    # Executar função original
                    return await func(*args, **kwargs)
            
            return wrapper
        return decorator
    
    # =====================================
    # 🔗 HOOKS PARA SISTEMA EXISTENTE
    # =====================================
    
    def register_hook(self, event: str, callback: Callable):
        """Registar hook para evento específico"""
        if event in self.hooks:
            self.hooks[event].append(callback)
            logger.debug(f"✅ Hook registado: {event}")
    
    async def trigger_hooks(self, event: str, data: Any):
        """Disparar hooks para evento"""
        if event in self.hooks:
            for callback in self.hooks[event]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(data)
                    else:
                        callback(data)
                except Exception as e:
                    logger.warning(f"⚠️ Erro em hook {event}: {e}")
    
    # =====================================
    # 🔄 PROCESSAMENTO AUTOMÁTICO
    # =====================================
    
    async def process_new_study(self, study_data: Dict[str, Any]):
        """
        Processar novo estudo de biodiversidade
        
        Extrai características e cria agregações automaticamente
        """
        try:
            study_id = study_data.get('study_id')
            if not study_id:
                return
            
            # Hook before
            await self.trigger_hooks('before_study_save', study_data)
            
            # Extrair características em background
            if self.config['background_processing']:
                await self.processing_queue.put({
                    'type': 'extract_features',
                    'study_id': study_id,
                    'study_data': study_data,
                    'timestamp': datetime.now()
                })
            else:
                # Processar imediatamente
                await self._extract_study_features(study_id, study_data)
            
            # Hook after
            await self.trigger_hooks('after_study_save', study_data)
            
            self.metrics.studies_processed += 1
            
        except Exception as e:
            logger.error(f"❌ Erro processando estudo {study_data.get('study_id')}: {e}")
            self.metrics.errors_handled += 1
    
    async def _extract_study_features(self, study_id: str, study_data: Dict[str, Any]):
        """Extrair características de um estudo"""
        try:
            # Características temporais
            temporal_features = await self._extract_temporal_features(study_id, study_data)
            if temporal_features:
                await self._save_features_to_cache(
                    study_id, 'biodiversity_studies', 'temporal', temporal_features
                )
            
            # Características espaciais
            spatial_features = await self._extract_spatial_features(study_id, study_data)
            if spatial_features:
                await self._save_features_to_cache(
                    study_id, 'biodiversity_studies', 'spatial', spatial_features
                )
            
            # Características ambientais
            if study_data.get('environmental_parameters'):
                env_features = await self._extract_environmental_features(study_id, study_data)
                if env_features:
                    await self._save_features_to_cache(
                        study_id, 'biodiversity_studies', 'environmental', env_features
                    )
            
            # Características de espécies
            if study_data.get('species_observed'):
                species_features = await self._extract_species_features(study_id, study_data)
                if species_features:
                    await self._save_features_to_cache(
                        study_id, 'biodiversity_studies', 'species', species_features
                    )
            
            self.metrics.features_extracted += 1
            
        except Exception as e:
            logger.error(f"❌ Erro extraindo características do estudo {study_id}: {e}")
    
    async def _extract_temporal_features(self, study_id: str, study_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extrair características temporais"""
        try:
            start_date = study_data.get('start_date')
            end_date = study_data.get('end_date')
            
            if not start_date:
                return {}
            
            # Converter para datetime se necessário
            if isinstance(start_date, str):
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            if isinstance(end_date, str):
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            
            features = {
                'year': start_date.year,
                'month': start_date.month,
                'day_of_year': start_date.timetuple().tm_yday,
                'season': self._get_season(start_date.month),
                'duration_days': (end_date - start_date).days if end_date else 1,
                'is_dry_season': start_date.month in [5, 6, 7, 8, 9, 10],
                'is_wet_season': start_date.month in [11, 12, 1, 2, 3, 4]
            }
            
            return features
            
        except Exception as e:
            logger.warning(f"⚠️ Erro extraindo características temporais: {e}")
            return {}
    
    async def _extract_spatial_features(self, study_id: str, study_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extrair características espaciais"""
        try:
            lat = study_data.get('latitude')
            lon = study_data.get('longitude')
            
            if lat is None or lon is None:
                return {}
            
            features = {
                'latitude': float(lat),
                'longitude': float(lon),
                'depth_min': study_data.get('depth_min', 0),
                'depth_max': study_data.get('depth_max', 0),
                'area_coverage_km2': study_data.get('area_coverage_km2', 0),
                'distance_from_coast': self._calculate_distance_from_coast(lat, lon),
                'oceanographic_zone': self._determine_oceanographic_zone(lat, lon),
                'location_grid': f"lat_{int(lat)}_lon_{int(lon)}",
                'is_coastal': abs(lon - 12.0) < 2.0,  # Aproximação para costa angolana
                'is_deep_water': study_data.get('depth_max', 0) > 200
            }
            
            return features
            
        except Exception as e:
            logger.warning(f"⚠️ Erro extraindo características espaciais: {e}")
            return {}
    
    async def _extract_environmental_features(self, study_id: str, study_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extrair características ambientais"""
        try:
            env_params = study_data.get('environmental_parameters', {})
            
            if not env_params:
                return {}
            
            features = {
                'temperature_mean': env_params.get('temperature_mean'),
                'temperature_range': env_params.get('temperature_max', 0) - env_params.get('temperature_min', 0),
                'salinity_mean': env_params.get('salinity_mean'),
                'chlorophyll_mean': env_params.get('chlorophyll_mean'),
                'oxygen_level': env_params.get('oxygen_level'),
                'ph_level': env_params.get('ph_level'),
                'turbidity': env_params.get('turbidity'),
                'current_speed': env_params.get('current_speed'),
                'upwelling_indicator': env_params.get('temperature_mean', 25) < 20,  # Água fria indica upwelling
                'productivity_level': self._classify_productivity(env_params.get('chlorophyll_mean', 0))
            }
            
            # Remover valores None
            features = {k: v for k, v in features.items() if v is not None}
            
            return features
            
        except Exception as e:
            logger.warning(f"⚠️ Erro extraindo características ambientais: {e}")
            return {}
    
    async def _extract_species_features(self, study_id: str, study_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extrair características de espécies"""
        try:
            species_data = study_data.get('species_observed', [])
            
            if not species_data:
                return {}
            
            features = {
                'species_count': len(species_data),
                'species_richness': len(set(sp.get('species_name', '') for sp in species_data)),
                'endemic_species': sum(1 for sp in species_data if sp.get('is_endemic', False)),
                'threatened_species': sum(1 for sp in species_data if sp.get('conservation_status') in ['EN', 'CR', 'VU']),
                'commercial_species': sum(1 for sp in species_data if sp.get('commercial_value', False)),
                'dominant_species': self._get_dominant_species(species_data),
                'biodiversity_index': self._calculate_shannon_index(species_data),
                'has_rare_species': any(sp.get('rarity_score', 0) > 0.8 for sp in species_data)
            }
            
            return features
            
        except Exception as e:
            logger.warning(f"⚠️ Erro extraindo características de espécies: {e}")
            return {}
    
    # =====================================
    # 🔄 PROCESSAMENTO EM BACKGROUND
    # =====================================
    
    async def start_background_processing(self):
        """Iniciar processamento em background"""
        if self.background_task is None:
            self.background_task = asyncio.create_task(self._background_worker())
            logger.info("🚀 Background processing iniciado")
    
    async def stop_background_processing(self):
        """Parar processamento em background"""
        if self.background_task:
            self.background_task.cancel()
            try:
                await self.background_task
            except asyncio.CancelledError:
                pass
            self.background_task = None
            logger.info("⏹️ Background processing parado")
    
    async def _background_worker(self):
        """Worker de processamento em background"""
        logger.info("🔄 Background worker iniciado")
        
        try:
            while True:
                try:
                    # Processar items da queue
                    task = await asyncio.wait_for(
                        self.processing_queue.get(), 
                        timeout=self.config['processing_interval_minutes'] * 60
                    )
                    
                    await self._process_background_task(task)
                    
                except asyncio.TimeoutError:
                    # Timeout normal - continuar loop
                    continue
                except Exception as e:
                    logger.error(f"❌ Erro no background worker: {e}")
                    await asyncio.sleep(10)  # Aguardar antes de tentar novamente
                    
        except asyncio.CancelledError:
            logger.info("🛑 Background worker cancelado")
            raise
    
    async def _process_background_task(self, task: Dict[str, Any]):
        """Processar tarefa em background"""
        try:
            task_type = task.get('type')
            
            if task_type == 'extract_features':
                await self._extract_study_features(
                    task['study_id'], 
                    task['study_data']
                )
            elif task_type == 'create_aggregation':
                await self._create_aggregation(task)
            elif task_type == 'cleanup_cache':
                await self._cleanup_expired_cache()
            
        except Exception as e:
            logger.error(f"❌ Erro processando tarefa background: {e}")
            self.metrics.errors_handled += 1
    
    # =====================================
    # 🛠️ UTILITIES
    # =====================================
    
    def _get_season(self, month: int) -> str:
        """Determinar estação do ano"""
        if month in [12, 1, 2]:
            return 'summer'
        elif month in [3, 4, 5]:
            return 'autumn'
        elif month in [6, 7, 8]:
            return 'winter'
        else:
            return 'spring'
    
    def _calculate_distance_from_coast(self, lat: float, lon: float) -> float:
        """Calcular distância aproximada da costa"""
        # Aproximação simples para costa angolana
        coast_lon = 12.0  # Longitude média da costa
        distance_deg = abs(lon - coast_lon)
        distance_km = distance_deg * 111.32  # Conversão aproximada
        return distance_km
    
    def _determine_oceanographic_zone(self, lat: float, lon: float) -> str:
        """Determinar zona oceanográfica"""
        if lat < -15:
            return 'Benguela Sul'
        elif lat < -12:
            return 'Benguela Norte'
        elif lat < -8:
            return 'Transição'
        else:
            return 'Angola Norte'
    
    def _classify_productivity(self, chlorophyll: float) -> str:
        """Classificar nível de produtividade"""
        if chlorophyll > 5:
            return 'very_high'
        elif chlorophyll > 2:
            return 'high'
        elif chlorophyll > 1:
            return 'medium'
        else:
            return 'low'
    
    def _get_dominant_species(self, species_data: List[Dict]) -> str:
        """Obter espécie dominante"""
        if not species_data:
            return ''
        
        # Contar ocorrências
        species_count = {}
        for sp in species_data:
            name = sp.get('species_name', 'unknown')
            species_count[name] = species_count.get(name, 0) + 1
        
        # Retornar mais comum
        return max(species_count.items(), key=lambda x: x[1])[0] if species_count else ''
    
    def _calculate_shannon_index(self, species_data: List[Dict]) -> float:
        """Calcular índice de diversidade de Shannon"""
        if not species_data:
            return 0.0
        
        try:
            # Contar espécies
            species_count = {}
            for sp in species_data:
                name = sp.get('species_name', 'unknown')
                species_count[name] = species_count.get(name, 0) + 1
            
            total = sum(species_count.values())
            if total <= 1:
                return 0.0
            
            # Calcular Shannon
            import math
            shannon = 0
            for count in species_count.values():
                p = count / total
                if p > 0:
                    shannon -= p * math.log(p)
            
            return shannon
            
        except Exception:
            return 0.0
    
    async def _save_features_to_cache(
        self, 
        source_data_id: str, 
        source_table: str, 
        feature_type: str, 
        features: Dict[str, Any]
    ):
        """Salvar características no cache (wrapper)"""
        try:
            # Usar o retention manager para salvar
            cache_key = f"{source_data_id}_{feature_type}_{hashlib.sha256(json.dumps(features, sort_keys=True).encode()).hexdigest()[:16]}"
            
            # Salvar através do retention manager
            await self.retention_manager._save_features_to_cache(
                cache_key, source_data_id, source_table, 
                feature_type, features
            )
            
        except Exception as e:
            logger.warning(f"⚠️ Erro salvando features no cache: {e}")
    
    # =====================================
    # 📊 MONITORING
    # =====================================
    
    def get_pipeline_metrics(self) -> Dict[str, Any]:
        """Obter métricas do pipeline"""
        return {
            'studies_processed': self.metrics.studies_processed,
            'features_extracted': self.metrics.features_extracted,
            'predictions_cached': self.metrics.predictions_cached,
            'aggregations_created': self.metrics.aggregations_created,
            'errors_handled': self.metrics.errors_handled,
            'processing_time_total': self.metrics.processing_time_total,
            'queue_size': self.processing_queue.qsize(),
            'background_task_running': self.background_task is not None and not self.background_task.done(),
            'config': self.config
        }


# =====================================
# 🚀 INTEGRATION HELPERS
# =====================================

# Instância global para fácil integração
pipeline = None

def get_retention_pipeline() -> MLRetentionPipeline:
    """Obter instância global do pipeline"""
    global pipeline
    
    if pipeline is None:
        pipeline = MLRetentionPipeline()
    
    return pipeline


def integrate_with_existing_ml_system():
    """
    Integrar pipeline com sistema ML existente
    
    Esta função deve ser chamada na inicialização da aplicação
    para ativar a retenção automática.
    """
    pipeline = get_retention_pipeline()
    
    # Iniciar processamento em background
    asyncio.create_task(pipeline.start_background_processing())
    
    logger.info("🔗 Pipeline de retenção integrado com sistema ML existente")
    
    return pipeline


# Decorators globais para fácil uso
def cache_features(feature_type: str, source_table: str = None):
    """Decorator global para cache de características"""
    return get_retention_pipeline().cache_features(feature_type, source_table)

def cache_predictions(model_type: str, ttl_hours: int = 6):
    """Decorator global para cache de predições"""
    return get_retention_pipeline().cache_predictions(model_type, ttl_hours)

def cache_training_data(model_type: str):
    """Decorator global para cache de dados de treino"""
    return get_retention_pipeline().cache_training_data(model_type)


if __name__ == "__main__":
    # Teste básico
    async def test_pipeline():
        pipeline = MLRetentionPipeline()
        
        # Simular processamento de estudo
        study_data = {
            'study_id': 'test_001',
            'latitude': -12.5,
            'longitude': 18.3,
            'start_date': '2024-08-15',
            'environmental_parameters': {
                'temperature_mean': 22.5,
                'chlorophyll_mean': 3.2
            },
            'species_observed': [
                {'species_name': 'Sardinella aurita', 'count': 15},
                {'species_name': 'Trachurus capensis', 'count': 8}
            ]
        }
        
        await pipeline.process_new_study(study_data)
        metrics = pipeline.get_pipeline_metrics()
        
        print("📊 Pipeline Metrics:", metrics)
    
    asyncio.run(test_pipeline())
