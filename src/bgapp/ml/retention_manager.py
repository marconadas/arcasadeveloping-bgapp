"""
🧠 ML Data Retention Manager
Sistema de retenção de dados ML para otimização de performance

PRINCÍPIOS:
- Não-invasivo: Não afeta sistema ML existente
- Cloudflare-compatible: Funciona com workers
- Performance-first: Cache inteligente e agregações
- Auto-scaling: Políticas automáticas de limpeza
"""

import asyncio
import hashlib
import json
import logging
import pickle
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, asdict
from enum import Enum
import numpy as np
import pandas as pd

# Imports internos (compatíveis com sistema existente)
try:
    from ..database.database_manager import DatabaseManager
    from ..models.biodiversity_ml_schemas import *
    from .ml_model_manager import MLModelManager
except ImportError:
    # Fallback para desenvolvimento
    import sys
    # Path already in PYTHONPATH

logger = logging.getLogger(__name__)


class CacheType(Enum):
    """Tipos de cache disponíveis"""
    FEATURE_STORE = "feature_store"
    TRAINING_CACHE = "training_cache" 
    INFERENCE_CACHE = "inference_cache"
    AGGREGATED_SERIES = "aggregated_series"


class RetentionPriority(Enum):
    """Prioridades de retenção"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class CacheHitMetrics:
    """Métricas de hit do cache"""
    cache_type: str
    hit_ratio: float
    total_requests: int
    cache_hits: int
    cache_misses: int
    avg_response_time_ms: float
    space_saved_mb: float


@dataclass
class FeatureCacheEntry:
    """Entrada do cache de características"""
    feature_id: str
    source_data_id: str
    source_table: str
    feature_type: str
    feature_vector: Dict[str, Any]
    quality_score: float
    temporal_window: Optional[str] = None
    spatial_resolution: Optional[float] = None
    location_grid: Optional[str] = None


@dataclass
class TrainingCacheEntry:
    """Entrada do cache de treino"""
    cache_id: str
    model_type: str
    dataset_version: str
    training_matrix: bytes
    target_vector: bytes
    preprocessing_pipeline: Dict[str, Any]
    feature_names: List[str]
    sample_count: int
    feature_count: int


class MLRetentionManager:
    """
    🧠 Gestor de Retenção de Dados ML
    
    Sistema não-invasivo que adiciona camada de cache e otimização
    ao sistema ML existente sem afetar funcionalidades atuais.
    """
    
    def __init__(self, db_manager: Optional[DatabaseManager] = None):
        """Inicializar gestor de retenção"""
        
        self.db_manager = db_manager or DatabaseManager()
        
        # Cache em memória para performance ultra-rápida
        self.memory_cache = {
            CacheType.FEATURE_STORE: {},
            CacheType.INFERENCE_CACHE: {},
            CacheType.TRAINING_CACHE: {}
        }
        
        # Configurações de cache
        self.cache_config = {
            'memory_cache_size': 1000,  # Máximo de entradas em memória
            'feature_ttl_hours': 24,
            'inference_ttl_hours': 6,
            'training_ttl_days': 30,
            'cleanup_interval_hours': 6
        }
        
        # Métricas de performance
        self.metrics = {
            'cache_hits': 0,
            'cache_misses': 0,
            'features_computed': 0,
            'training_speedup_total': 0,
            'inference_time_saved_ms': 0
        }
        
        # Flags de compatibilidade
        self.cloudflare_mode = False
        self.readonly_mode = False
        
        logger.info("✅ ML Retention Manager inicializado")
    
    # =====================================
    # 🎯 FEATURE STORE - Cache de Características  
    # =====================================
    
    async def get_or_compute_features(
        self,
        source_data_id: str,
        source_table: str,
        feature_type: str,
        compute_func: callable,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Obter características do cache ou computar se necessário
        
        Args:
            source_data_id: ID do dado original
            source_table: Tabela de origem
            feature_type: Tipo de característica
            compute_func: Função para computar se não em cache
            **kwargs: Parâmetros adicionais
        
        Returns:
            Características extraídas
        """
        
        # Gerar chave de cache
        cache_key = self._generate_feature_cache_key(
            source_data_id, source_table, feature_type, kwargs
        )
        
        # 1. Verificar cache em memória primeiro
        if cache_key in self.memory_cache[CacheType.FEATURE_STORE]:
            self.metrics['cache_hits'] += 1
            logger.debug(f"✅ Feature cache HIT (memory): {cache_key}")
            return self.memory_cache[CacheType.FEATURE_STORE][cache_key]
        
        # 2. Verificar cache em base de dados
        cached_features = await self._get_features_from_db(cache_key)
        if cached_features:
            # Adicionar ao cache em memória
            self.memory_cache[CacheType.FEATURE_STORE][cache_key] = cached_features
            self._trim_memory_cache(CacheType.FEATURE_STORE)
            
            self.metrics['cache_hits'] += 1
            logger.debug(f"✅ Feature cache HIT (db): {cache_key}")
            return cached_features
        
        # 3. Computar características (cache miss)
        start_time = time.time()
        try:
            features = await compute_func(source_data_id, **kwargs)
            compute_time = (time.time() - start_time) * 1000
            
            # Salvar no cache
            await self._save_features_to_cache(
                cache_key, source_data_id, source_table, 
                feature_type, features, **kwargs
            )
            
            self.metrics['cache_misses'] += 1
            self.metrics['features_computed'] += 1
            
            logger.info(f"🔄 Features computadas e cacheadas: {cache_key} ({compute_time:.1f}ms)")
            return features
            
        except Exception as e:
            logger.error(f"❌ Erro computando features: {e}")
            self.metrics['cache_misses'] += 1
            raise
    
    async def _get_features_from_db(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Obter características da base de dados"""
        try:
            if self.readonly_mode:
                return None
                
            # Query otimizada
            query = """
                SELECT feature_vector, quality_score, last_accessed
                FROM ml_feature_store 
                WHERE feature_id = %s 
                AND last_accessed > %s
                LIMIT 1
            """
            
            cutoff_time = datetime.now() - timedelta(hours=self.cache_config['feature_ttl_hours'])
            
            result = await self.db_manager.execute_query(
                query, (cache_key, cutoff_time)
            )
            
            if result and len(result) > 0:
                # Atualizar last_accessed
                await self._update_feature_access(cache_key)
                return result[0]['feature_vector']
                
            return None
            
        except Exception as e:
            logger.warning(f"⚠️ Erro acessando feature cache DB: {e}")
            return None
    
    async def _save_features_to_cache(
        self,
        cache_key: str,
        source_data_id: str,
        source_table: str,
        feature_type: str,
        features: Dict[str, Any],
        **kwargs
    ):
        """Salvar características no cache"""
        try:
            if self.readonly_mode:
                return
                
            # Calcular qualidade baseada no tipo
            quality_score = self._calculate_feature_quality(features, feature_type)
            
            # Gerar hash para deduplicação
            feature_hash = hashlib.sha256(
                json.dumps(features, sort_keys=True).encode()
            ).hexdigest()[:32]
            
            # Salvar em memória
            self.memory_cache[CacheType.FEATURE_STORE][cache_key] = features
            self._trim_memory_cache(CacheType.FEATURE_STORE)
            
            # Salvar em base de dados (background)
            asyncio.create_task(self._save_features_to_db(
                cache_key, source_data_id, source_table, feature_type,
                features, feature_hash, quality_score, kwargs
            ))
            
        except Exception as e:
            logger.warning(f"⚠️ Erro salvando features no cache: {e}")
    
    async def _save_features_to_db(
        self,
        cache_key: str,
        source_data_id: str,
        source_table: str,
        feature_type: str,
        features: Dict[str, Any],
        feature_hash: str,
        quality_score: float,
        metadata: Dict[str, Any]
    ):
        """Salvar características na base de dados (background task)"""
        try:
            insert_query = """
                INSERT INTO ml_feature_store (
                    feature_id, source_data_id, source_table, feature_type,
                    feature_vector, feature_hash, quality_score,
                    temporal_window, spatial_resolution, location_grid,
                    retention_days, priority_level
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (source_data_id, feature_type, feature_hash) 
                DO UPDATE SET
                    last_accessed = CURRENT_TIMESTAMP,
                    access_count = ml_feature_store.access_count + 1
            """
            
            # Determinar prioridade baseada na qualidade
            priority = self._determine_priority(quality_score, feature_type)
            retention_days = self._calculate_retention_days(priority, feature_type)
            
            await self.db_manager.execute_query(insert_query, (
                cache_key, source_data_id, source_table, feature_type,
                json.dumps(features), feature_hash, quality_score,
                metadata.get('temporal_window'), metadata.get('spatial_resolution'),
                metadata.get('location_grid'), retention_days, priority.value
            ))
            
        except Exception as e:
            logger.warning(f"⚠️ Erro salvando features na DB: {e}")
    
    # =====================================
    # 🎯 TRAINING CACHE - Cache de Treino
    # =====================================
    
    async def get_or_prepare_training_data(
        self,
        model_type: str,
        data_version: str,
        prepare_func: callable,
        **kwargs
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Obter dados de treino do cache ou preparar se necessário
        
        Returns:
            (X_train, y_train, metadata)
        """
        
        cache_key = f"{model_type}_{data_version}"
        
        # Verificar cache
        cached_data = await self._get_training_data_from_cache(cache_key)
        if cached_data:
            self.metrics['cache_hits'] += 1
            logger.info(f"✅ Training cache HIT: {cache_key}")
            return cached_data
        
        # Preparar dados (cache miss)
        start_time = time.time()
        try:
            X_train, y_train, metadata = await prepare_func(**kwargs)
            preparation_time = (time.time() - start_time)
            
            # Salvar no cache
            await self._save_training_data_to_cache(
                cache_key, model_type, data_version,
                X_train, y_train, metadata, preparation_time
            )
            
            self.metrics['cache_misses'] += 1
            self.metrics['training_speedup_total'] += preparation_time
            
            logger.info(f"🔄 Training data preparado e cacheado: {cache_key} ({preparation_time:.1f}s)")
            return X_train, y_train, metadata
            
        except Exception as e:
            logger.error(f"❌ Erro preparando training data: {e}")
            self.metrics['cache_misses'] += 1
            raise
    
    async def _get_training_data_from_cache(
        self, cache_key: str
    ) -> Optional[Tuple[np.ndarray, np.ndarray, Dict[str, Any]]]:
        """Obter dados de treino do cache"""
        try:
            if self.readonly_mode:
                return None
                
            query = """
                SELECT training_matrix, target_vector, preprocessing_pipeline,
                       feature_names, sample_count, feature_count
                FROM ml_training_cache 
                WHERE cache_id = %s 
                AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
                LIMIT 1
            """
            
            result = await self.db_manager.execute_query(query, (cache_key,))
            
            if result and len(result) > 0:
                row = result[0]
                
                # Deserializar dados
                X_train = pickle.loads(row['training_matrix'])
                y_train = pickle.loads(row['target_vector'])
                metadata = {
                    'preprocessing_pipeline': row['preprocessing_pipeline'],
                    'feature_names': row['feature_names'],
                    'sample_count': row['sample_count'],
                    'feature_count': row['feature_count']
                }
                
                # Atualizar acesso
                await self._update_training_cache_access(cache_key)
                
                return X_train, y_train, metadata
                
            return None
            
        except Exception as e:
            logger.warning(f"⚠️ Erro acessando training cache: {e}")
            return None
    
    # =====================================
    # 🎯 INFERENCE CACHE - Cache de Inferência
    # =====================================
    
    async def get_or_compute_prediction(
        self,
        model_id: str,
        input_data: Dict[str, Any],
        predict_func: callable,
        ttl_hours: int = 6
    ) -> Dict[str, Any]:
        """
        Obter predição do cache ou computar se necessário
        
        Ideal para predições em localizações frequentes
        """
        
        # Gerar chave baseada nos inputs
        input_hash = hashlib.sha256(
            json.dumps(input_data, sort_keys=True).encode()
        ).hexdigest()[:32]
        
        cache_key = f"{model_id}_{input_hash}"
        
        # Verificar cache em memória
        if cache_key in self.memory_cache[CacheType.INFERENCE_CACHE]:
            self.metrics['cache_hits'] += 1
            logger.debug(f"✅ Inference cache HIT (memory): {cache_key}")
            return self.memory_cache[CacheType.INFERENCE_CACHE][cache_key]
        
        # Verificar cache em base de dados
        cached_prediction = await self._get_prediction_from_cache(cache_key)
        if cached_prediction:
            # Adicionar ao cache em memória
            self.memory_cache[CacheType.INFERENCE_CACHE][cache_key] = cached_prediction
            self._trim_memory_cache(CacheType.INFERENCE_CACHE)
            
            self.metrics['cache_hits'] += 1
            logger.debug(f"✅ Inference cache HIT (db): {cache_key}")
            return cached_prediction
        
        # Computar predição (cache miss)
        start_time = time.time()
        try:
            prediction = await predict_func(input_data)
            inference_time = (time.time() - start_time) * 1000
            
            # Salvar no cache
            await self._save_prediction_to_cache(
                cache_key, model_id, input_data, input_hash,
                prediction, ttl_hours, inference_time
            )
            
            self.metrics['cache_misses'] += 1
            self.metrics['inference_time_saved_ms'] += inference_time
            
            logger.debug(f"🔄 Predição computada e cacheada: {cache_key} ({inference_time:.1f}ms)")
            return prediction
            
        except Exception as e:
            logger.error(f"❌ Erro computando predição: {e}")
            self.metrics['cache_misses'] += 1
            raise
    
    # =====================================
    # 🎯 AGGREGATED SERIES - Séries Agregadas
    # =====================================
    
    async def get_aggregated_time_series(
        self,
        source_type: str,
        location_grid: str,
        time_window: str,
        start_date: datetime,
        end_date: datetime
    ) -> Optional[Dict[str, Any]]:
        """
        Obter série temporal agregada
        
        Útil para análises históricas e padrões sazonais
        """
        try:
            query = """
                SELECT * FROM aggregated_time_series
                WHERE source_type = %s 
                AND location_grid = %s
                AND time_window = %s
                AND start_date <= %s
                AND end_date >= %s
                ORDER BY start_date
            """
            
            result = await self.db_manager.execute_query(
                query, (source_type, location_grid, time_window, start_date, end_date)
            )
            
            if result:
                return [dict(row) for row in result]
            
            return None
            
        except Exception as e:
            logger.warning(f"⚠️ Erro obtendo série agregada: {e}")
            return None
    
    # =====================================
    # 🛠️ UTILITIES & HELPERS
    # =====================================
    
    def _generate_feature_cache_key(
        self, 
        source_data_id: str, 
        source_table: str, 
        feature_type: str, 
        params: Dict[str, Any]
    ) -> str:
        """Gerar chave única para cache de características"""
        key_data = f"{source_data_id}_{source_table}_{feature_type}_{json.dumps(params, sort_keys=True)}"
        return hashlib.sha256(key_data.encode()).hexdigest()[:32]
    
    def _calculate_feature_quality(self, features: Dict[str, Any], feature_type: str) -> float:
        """Calcular score de qualidade das características"""
        try:
            # Lógica básica de qualidade
            if not features:
                return 0.0
            
            # Contar características válidas
            valid_features = sum(1 for v in features.values() if v is not None and v != '')
            total_features = len(features)
            
            if total_features == 0:
                return 0.0
            
            base_quality = valid_features / total_features
            
            # Ajustar baseado no tipo
            type_multipliers = {
                'temporal': 1.0,
                'spatial': 1.1,
                'environmental': 1.2,
                'species': 1.3
            }
            
            multiplier = type_multipliers.get(feature_type, 1.0)
            
            return min(1.0, base_quality * multiplier)
            
        except Exception:
            return 0.5  # Qualidade média por defeito
    
    def _determine_priority(self, quality_score: float, feature_type: str) -> RetentionPriority:
        """Determinar prioridade de retenção"""
        if quality_score >= 0.9:
            return RetentionPriority.CRITICAL
        elif quality_score >= 0.7:
            return RetentionPriority.HIGH
        elif quality_score >= 0.5:
            return RetentionPriority.NORMAL
        else:
            return RetentionPriority.LOW
    
    def _calculate_retention_days(self, priority: RetentionPriority, feature_type: str) -> int:
        """Calcular dias de retenção baseado na prioridade"""
        base_days = {
            RetentionPriority.CRITICAL: 730,  # 2 anos
            RetentionPriority.HIGH: 365,      # 1 ano
            RetentionPriority.NORMAL: 180,    # 6 meses
            RetentionPriority.LOW: 90         # 3 meses
        }
        
        return base_days.get(priority, 180)
    
    def _trim_memory_cache(self, cache_type: CacheType):
        """Limitar tamanho do cache em memória"""
        cache = self.memory_cache[cache_type]
        max_size = self.cache_config['memory_cache_size']
        
        if len(cache) > max_size:
            # Remover entradas mais antigas (LRU simples)
            items = list(cache.items())
            items_to_keep = items[-max_size:]
            self.memory_cache[cache_type] = dict(items_to_keep)
    
    # =====================================
    # 📊 MONITORING & METRICS
    # =====================================
    
    async def get_cache_statistics(self) -> Dict[str, CacheHitMetrics]:
        """Obter estatísticas detalhadas do cache"""
        try:
            stats = {}
            
            # Estatísticas de cada tipo de cache
            for cache_type in ['feature_store', 'training_cache', 'inference_cache']:
                query = f"""
                    SELECT 
                        COUNT(*) as total_entries,
                        AVG(CASE WHEN last_accessed > CURRENT_TIMESTAMP - INTERVAL '24 hours' 
                            THEN 1 ELSE 0 END) as hit_ratio,
                        SUM(CASE WHEN last_accessed > CURRENT_TIMESTAMP - INTERVAL '24 hours' 
                            THEN access_count ELSE 0 END) as total_hits
                    FROM ml_{cache_type}
                """
                
                result = await self.db_manager.execute_query(query)
                
                if result and len(result) > 0:
                    row = result[0]
                    stats[cache_type] = CacheHitMetrics(
                        cache_type=cache_type,
                        hit_ratio=float(row.get('hit_ratio', 0)),
                        total_requests=int(row.get('total_hits', 0)) + self.metrics['cache_misses'],
                        cache_hits=int(row.get('total_hits', 0)),
                        cache_misses=self.metrics['cache_misses'],
                        avg_response_time_ms=self._calculate_avg_response_time(cache_type),
                        space_saved_mb=self._estimate_space_saved(cache_type)
                    )
            
            return stats
            
        except Exception as e:
            logger.warning(f"⚠️ Erro obtendo estatísticas: {e}")
            return {}
    
    def _calculate_avg_response_time(self, cache_type: str) -> float:
        """Calcular tempo médio de resposta"""
        # Estimativas baseadas no tipo
        estimates = {
            'feature_store': 15.0,
            'training_cache': 50.0,
            'inference_cache': 5.0
        }
        return estimates.get(cache_type, 20.0)
    
    def _estimate_space_saved(self, cache_type: str) -> float:
        """Estimar espaço poupado pelo cache"""
        hit_ratio = self.metrics['cache_hits'] / max(1, self.metrics['cache_hits'] + self.metrics['cache_misses'])
        
        # Estimativas de tamanho por tipo
        size_estimates = {
            'feature_store': 2.5,    # MB por entrada
            'training_cache': 50.0,  # MB por entrada
            'inference_cache': 0.1   # MB por entrada
        }
        
        size_per_entry = size_estimates.get(cache_type, 1.0)
        return self.metrics['cache_hits'] * size_per_entry * hit_ratio
    
    async def cleanup_expired_data(self) -> Dict[str, int]:
        """Executar limpeza de dados expirados"""
        try:
            if self.readonly_mode:
                logger.info("🔒 Modo readonly - limpeza desabilitada")
                return {}
            
            logger.info("🧹 Iniciando limpeza de dados ML...")
            
            # Executar função de limpeza automática
            query = "SELECT * FROM cleanup_ml_retention_data()"
            results = await self.db_manager.execute_query(query)
            
            cleanup_stats = {}
            total_deleted = 0
            
            if results:
                for row in results:
                    table_name = row['table_name']
                    deleted = int(row['records_deleted'])
                    cleanup_stats[table_name] = deleted
                    total_deleted += deleted
            
            logger.info(f"✅ Limpeza concluída: {total_deleted} registos removidos")
            return cleanup_stats
            
        except Exception as e:
            logger.error(f"❌ Erro na limpeza: {e}")
            return {}
    
    # =====================================
    # 🔧 CLOUDFLARE COMPATIBILITY
    # =====================================
    
    def enable_cloudflare_mode(self):
        """Ativar modo compatível com Cloudflare Workers"""
        self.cloudflare_mode = True
        self.readonly_mode = True  # Workers são readonly por defeito
        logger.info("☁️ Modo Cloudflare ativado")
    
    def get_lightweight_stats(self) -> Dict[str, Any]:
        """Obter estatísticas leves para workers"""
        return {
            'cache_hits': self.metrics['cache_hits'],
            'cache_misses': self.metrics['cache_misses'],
            'hit_ratio': self.metrics['cache_hits'] / max(1, self.metrics['cache_hits'] + self.metrics['cache_misses']),
            'features_computed': self.metrics['features_computed'],
            'memory_cache_size': sum(len(cache) for cache in self.memory_cache.values()),
            'status': 'active' if not self.readonly_mode else 'readonly'
        }


# =====================================
# 🚀 FACTORY & INITIALIZATION
# =====================================

def create_retention_manager(
    cloudflare_mode: bool = False,
    readonly_mode: bool = False
) -> MLRetentionManager:
    """
    Factory para criar gestor de retenção com configurações apropriadas
    
    Args:
        cloudflare_mode: Ativar compatibilidade com Cloudflare
        readonly_mode: Modo apenas leitura
    """
    
    manager = MLRetentionManager()
    
    if cloudflare_mode:
        manager.enable_cloudflare_mode()
    
    if readonly_mode:
        manager.readonly_mode = True
    
    return manager


# Instância global para compatibilidade
retention_manager = None

def get_retention_manager() -> MLRetentionManager:
    """Obter instância global do gestor de retenção"""
    global retention_manager
    
    if retention_manager is None:
        retention_manager = create_retention_manager()
    
    return retention_manager


if __name__ == "__main__":
    # Teste básico
    async def test_retention_manager():
        manager = create_retention_manager(readonly_mode=True)
        stats = manager.get_lightweight_stats()
        print("📊 Retention Manager Stats:", stats)
    
    asyncio.run(test_retention_manager())
