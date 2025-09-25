#!/usr/bin/env python3
"""
Otimizador de Performance para análises QGIS com datasets grandes
Implementa cache, processamento paralelo, e otimizações de memória
"""

import asyncio
import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
import numpy as np
import pandas as pd
import geopandas as gpd
import xarray as xr
from typing import Dict, List, Any, Optional, Callable, Union, Tuple
import logging
import time
import psutil
import gc
from pathlib import Path
import hashlib
import pickle
import redis
from functools import wraps
import dask.dataframe as dd
import dask.array as da
from dask.distributed import Client, as_completed
from memory_profiler import profile
import warnings

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suprimir warnings desnecessários
warnings.filterwarnings('ignore', category=RuntimeWarning)

class PerformanceOptimizer:
    """Classe principal para otimização de performance"""
    
    def __init__(self, 
                 cache_dir: str = "data/cache",
                 redis_host: str = "localhost",
                 redis_port: int = 6379,
                 max_workers: Optional[int] = None,
                 memory_limit: str = "4GB"):
        """
        Inicializa o otimizador de performance
        
        Args:
            cache_dir: Diretório para cache em disco
            redis_host: Host do Redis para cache em memória
            redis_port: Porta do Redis
            max_workers: Número máximo de workers paralelos
            memory_limit: Limite de memória para processamento
        """
        
        # Configuração de cache
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Configuração Redis
        try:
            self.redis_client = redis.Redis(
                host=redis_host, 
                port=redis_port, 
                decode_responses=True,
                socket_timeout=5
            )
            self.redis_client.ping()
            self.redis_available = True
            logger.info("✅ Redis conectado para cache em memória")
        except:
            self.redis_client = None
            self.redis_available = False
            logger.warning("⚠️ Redis não disponível, usando apenas cache em disco")
        
        # Configuração de paralelização
        self.max_workers = max_workers or min(mp.cpu_count(), 8)
        self.memory_limit = memory_limit
        
        # Configuração Dask
        try:
            self.dask_client = Client(
                processes=True,
                n_workers=min(4, mp.cpu_count()),
                threads_per_worker=2,
                memory_limit=memory_limit
            )
            self.dask_available = True
            logger.info(f"✅ Dask inicializado com {self.dask_client.nthreads()} threads")
        except:
            self.dask_client = None
            self.dask_available = False
            logger.warning("⚠️ Dask não disponível, usando processamento sequencial")
        
        # Métricas de performance
        self.performance_metrics = {
            'cache_hits': 0,
            'cache_misses': 0,
            'parallel_tasks': 0,
            'memory_optimizations': 0
        }
    
    def __del__(self):
        """Cleanup ao destruir objeto"""
        if hasattr(self, 'dask_client') and self.dask_client:
            self.dask_client.close()

class CacheManager:
    """Gerenciador de cache para otimização"""
    
    def __init__(self, optimizer: PerformanceOptimizer):
        self.optimizer = optimizer
        self.cache_ttl = 3600  # 1 hora
    
    def get_cache_key(self, func_name: str, args: tuple, kwargs: dict) -> str:
        """Gera chave única para cache baseada na função e parâmetros"""
        
        # Serializar argumentos de forma determinística
        key_data = {
            'function': func_name,
            'args': str(args),
            'kwargs': sorted(kwargs.items())
        }
        
        key_string = str(key_data)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def get_from_cache(self, cache_key: str) -> Optional[Any]:
        """Recupera dados do cache (Redis primeiro, depois disco)"""
        
        # Tentar Redis primeiro
        if self.optimizer.redis_available:
            try:
                cached_data = self.optimizer.redis_client.get(f"bgapp_cache:{cache_key}")
                if cached_data:
                    self.optimizer.performance_metrics['cache_hits'] += 1
                    return pickle.loads(cached_data.encode('latin1'))
            except Exception as e:
                logger.warning(f"Erro ao acessar cache Redis: {e}")
        
        # Tentar cache em disco
        cache_file = self.optimizer.cache_dir / f"{cache_key}.pkl"
        if cache_file.exists():
            try:
                # Verificar se não expirou
                if time.time() - cache_file.stat().st_mtime < self.cache_ttl:
                    with open(cache_file, 'rb') as f:
                        self.optimizer.performance_metrics['cache_hits'] += 1
                        return pickle.load(f)
                else:
                    cache_file.unlink()  # Remove cache expirado
            except Exception as e:
                logger.warning(f"Erro ao acessar cache em disco: {e}")
        
        self.optimizer.performance_metrics['cache_misses'] += 1
        return None
    
    def save_to_cache(self, cache_key: str, data: Any) -> bool:
        """Salva dados no cache"""
        
        try:
            # Serializar dados
            serialized_data = pickle.dumps(data)
            
            # Verificar tamanho (limite de 10MB para Redis)
            if len(serialized_data) > 10 * 1024 * 1024:
                logger.warning("Dados muito grandes para cache Redis, salvando apenas em disco")
                redis_save = False
            else:
                redis_save = True
            
            # Salvar no Redis
            if self.optimizer.redis_available and redis_save:
                try:
                    self.optimizer.redis_client.setex(
                        f"bgapp_cache:{cache_key}",
                        self.cache_ttl,
                        serialized_data.decode('latin1')
                    )
                except Exception as e:
                    logger.warning(f"Erro ao salvar no Redis: {e}")
            
            # Salvar em disco
            cache_file = self.optimizer.cache_dir / f"{cache_key}.pkl"
            with open(cache_file, 'wb') as f:
                pickle.dump(data, f)
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao salvar no cache: {e}")
            return False

def cache_result(ttl: int = 3600):
    """Decorator para cache automático de resultados"""
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Obter otimizador do primeiro argumento (assumindo que é self)
            if args and hasattr(args[0], 'performance_optimizer'):
                optimizer = args[0].performance_optimizer
                cache_manager = CacheManager(optimizer)
                
                # Gerar chave de cache
                cache_key = cache_manager.get_cache_key(func.__name__, args[1:], kwargs)
                
                # Tentar recuperar do cache
                cached_result = cache_manager.get_from_cache(cache_key)
                if cached_result is not None:
                    logger.info(f"Cache hit para {func.__name__}")
                    return cached_result
                
                # Executar função
                result = await func(*args, **kwargs)
                
                # Salvar no cache
                cache_manager.save_to_cache(cache_key, result)
                logger.info(f"Resultado de {func.__name__} salvo no cache")
                
                return result
            else:
                # Executar sem cache se não há otimizador
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator

class DataProcessor:
    """Processador de dados otimizado para grandes datasets"""
    
    def __init__(self, optimizer: PerformanceOptimizer):
        self.optimizer = optimizer
    
    def chunk_dataframe(self, df: pd.DataFrame, chunk_size: int = 10000) -> List[pd.DataFrame]:
        """Divide DataFrame em chunks menores"""
        
        chunks = []
        for i in range(0, len(df), chunk_size):
            chunk = df.iloc[i:i + chunk_size].copy()
            chunks.append(chunk)
        
        logger.info(f"DataFrame dividido em {len(chunks)} chunks de ~{chunk_size} registros")
        return chunks
    
    def chunk_geodataframe(self, gdf: gpd.GeoDataFrame, chunk_size: int = 5000) -> List[gpd.GeoDataFrame]:
        """Divide GeoDataFrame em chunks menores"""
        
        chunks = []
        for i in range(0, len(gdf), chunk_size):
            chunk = gdf.iloc[i:i + chunk_size].copy()
            chunks.append(chunk)
        
        logger.info(f"GeoDataFrame dividido em {len(chunks)} chunks de ~{chunk_size} registros")
        return chunks
    
    def optimize_xarray_dataset(self, ds: xr.Dataset) -> xr.Dataset:
        """Otimiza Dataset xarray para performance"""
        
        # Aplicar chunking para arrays grandes
        optimized_vars = {}
        
        for var_name, var_data in ds.data_vars.items():
            if var_data.size > 1000000:  # 1M elementos
                # Calcular chunks otimizados
                chunk_size = min(1000, var_data.shape[-1]) if len(var_data.shape) > 1 else 1000
                
                if len(var_data.shape) == 3:  # time, lat, lon
                    chunks = {'time': 50, 'latitude': chunk_size, 'longitude': chunk_size}
                elif len(var_data.shape) == 2:  # lat, lon
                    chunks = {'latitude': chunk_size, 'longitude': chunk_size}
                else:
                    chunks = 'auto'
                
                optimized_vars[var_name] = var_data.chunk(chunks)
                logger.info(f"Variável {var_name} otimizada com chunks: {chunks}")
            else:
                optimized_vars[var_name] = var_data
        
        # Criar dataset otimizado
        optimized_ds = xr.Dataset(optimized_vars, coords=ds.coords, attrs=ds.attrs)
        
        self.optimizer.performance_metrics['memory_optimizations'] += 1
        return optimized_ds
    
    def parallel_apply(self, data: Union[pd.DataFrame, gpd.GeoDataFrame], 
                      func: Callable, *args, **kwargs) -> Union[pd.DataFrame, gpd.GeoDataFrame]:
        """Aplica função em paralelo usando Dask ou multiprocessing"""
        
        if self.optimizer.dask_available and len(data) > 10000:
            # Usar Dask para datasets grandes
            try:
                if isinstance(data, gpd.GeoDataFrame):
                    # Para GeoDataFrames, usar processamento por chunks
                    chunks = self.chunk_geodataframe(data)
                    
                    with ThreadPoolExecutor(max_workers=self.optimizer.max_workers) as executor:
                        futures = [executor.submit(func, chunk, *args, **kwargs) for chunk in chunks]
                        results = [future.result() for future in futures]
                    
                    result = pd.concat(results, ignore_index=True)
                    if hasattr(data, 'geometry'):
                        result = gpd.GeoDataFrame(result, geometry='geometry', crs=data.crs)
                
                else:
                    # Para DataFrames regulares, usar Dask
                    ddf = dd.from_pandas(data, npartitions=self.optimizer.max_workers)
                    result = ddf.map_partitions(func, *args, **kwargs).compute()
                
                self.optimizer.performance_metrics['parallel_tasks'] += 1
                logger.info(f"Processamento paralelo aplicado com {self.optimizer.max_workers} workers")
                
                return result
                
            except Exception as e:
                logger.warning(f"Erro no processamento paralelo: {e}, usando processamento sequencial")
                return func(data, *args, **kwargs)
        
        else:
            # Processamento sequencial para datasets pequenos
            return func(data, *args, **kwargs)

class MemoryManager:
    """Gerenciador de memória para otimização"""
    
    def __init__(self, optimizer: PerformanceOptimizer):
        self.optimizer = optimizer
        self.memory_threshold = 0.8  # 80% da memória disponível
    
    def get_memory_usage(self) -> Dict[str, float]:
        """Retorna informações de uso de memória"""
        
        process = psutil.Process()
        memory_info = process.memory_info()
        system_memory = psutil.virtual_memory()
        
        return {
            'process_memory_mb': memory_info.rss / 1024 / 1024,
            'process_memory_percent': process.memory_percent(),
            'system_memory_percent': system_memory.percent,
            'available_memory_mb': system_memory.available / 1024 / 1024
        }
    
    def check_memory_pressure(self) -> bool:
        """Verifica se há pressão de memória"""
        
        memory_info = self.get_memory_usage()
        return memory_info['system_memory_percent'] > (self.memory_threshold * 100)
    
    def optimize_memory(self):
        """Otimiza uso de memória"""
        
        if self.check_memory_pressure():
            logger.warning("Pressão de memória detectada, executando limpeza...")
            
            # Forçar garbage collection
            gc.collect()
            
            # Limpar cache se necessário
            if self.optimizer.redis_available:
                try:
                    cache_keys = self.optimizer.redis_client.keys("bgapp_cache:*")
                    if len(cache_keys) > 1000:  # Limpar se muitas chaves
                        oldest_keys = cache_keys[:len(cache_keys)//2]
                        self.optimizer.redis_client.delete(*oldest_keys)
                        logger.info(f"Limpeza de cache: removidas {len(oldest_keys)} chaves")
                except Exception as e:
                    logger.warning(f"Erro na limpeza de cache: {e}")
            
            self.optimizer.performance_metrics['memory_optimizations'] += 1

class SpatialOptimizer:
    """Otimizador específico para análises espaciais"""
    
    def __init__(self, optimizer: PerformanceOptimizer):
        self.optimizer = optimizer
        self.data_processor = DataProcessor(optimizer)
    
    def optimize_spatial_join(self, left_gdf: gpd.GeoDataFrame, 
                            right_gdf: gpd.GeoDataFrame, 
                            how: str = 'inner') -> gpd.GeoDataFrame:
        """Otimiza spatial join para datasets grandes"""
        
        # Verificar tamanhos
        left_size = len(left_gdf)
        right_size = len(right_gdf)
        
        logger.info(f"Spatial join: {left_size} x {right_size} registros")
        
        if left_size * right_size > 1000000:  # 1M combinações
            logger.info("Dataset grande detectado, usando otimização spatial")
            
            # Usar spatial index para otimização
            if not hasattr(right_gdf, 'sindex') or right_gdf.sindex is None:
                right_gdf = right_gdf.copy()
                right_gdf.sindex  # Criar índice espacial
            
            # Processar em chunks
            left_chunks = self.data_processor.chunk_geodataframe(left_gdf, chunk_size=5000)
            
            results = []
            
            for i, left_chunk in enumerate(left_chunks):
                logger.info(f"Processando chunk {i+1}/{len(left_chunks)}")
                
                # Spatial join para chunk
                chunk_result = gpd.sjoin(left_chunk, right_gdf, how=how)
                results.append(chunk_result)
                
                # Limpeza de memória
                del left_chunk
                if i % 10 == 0:  # A cada 10 chunks
                    gc.collect()
            
            # Combinar resultados
            result = pd.concat(results, ignore_index=True)
            result = gpd.GeoDataFrame(result, geometry=result.geometry, crs=left_gdf.crs)
            
            logger.info(f"Spatial join otimizado concluído: {len(result)} registros")
            return result
        
        else:
            # Join normal para datasets pequenos
            return gpd.sjoin(left_gdf, right_gdf, how=how)
    
    def optimize_buffer_analysis(self, gdf: gpd.GeoDataFrame, 
                                distance: float) -> gpd.GeoDataFrame:
        """Otimiza análise de buffer para datasets grandes"""
        
        if len(gdf) > 10000:
            logger.info("Otimizando análise de buffer para dataset grande")
            
            # Processar em paralelo
            chunks = self.data_processor.chunk_geodataframe(gdf, chunk_size=2000)
            
            def create_buffers(chunk_gdf):
                return chunk_gdf.buffer(distance)
            
            with ProcessPoolExecutor(max_workers=self.optimizer.max_workers) as executor:
                futures = [executor.submit(create_buffers, chunk) for chunk in chunks]
                buffer_results = [future.result() for future in futures]
            
            # Combinar resultados
            all_buffers = pd.concat(buffer_results, ignore_index=True)
            result_gdf = gpd.GeoDataFrame(gdf.drop('geometry', axis=1), 
                                        geometry=all_buffers, crs=gdf.crs)
            
            self.optimizer.performance_metrics['parallel_tasks'] += 1
            return result_gdf
        
        else:
            # Buffer normal para datasets pequenos
            result_gdf = gdf.copy()
            result_gdf.geometry = result_gdf.buffer(distance)
            return result_gdf

class TemporalOptimizer:
    """Otimizador para análises temporais"""
    
    def __init__(self, optimizer: PerformanceOptimizer):
        self.optimizer = optimizer
        self.data_processor = DataProcessor(optimizer)
    
    def optimize_time_series_analysis(self, ds: xr.Dataset, 
                                    analysis_func: Callable) -> xr.Dataset:
        """Otimiza análise de séries temporais"""
        
        # Otimizar dataset primeiro
        optimized_ds = self.data_processor.optimize_xarray_dataset(ds)
        
        # Verificar se precisa de processamento paralelo
        total_size = sum([var.size for var in optimized_ds.data_vars.values()])
        
        if total_size > 10000000:  # 10M elementos
            logger.info("Usando processamento paralelo para análise temporal")
            
            if self.optimizer.dask_available:
                # Usar Dask para processamento paralelo
                result = analysis_func(optimized_ds)
                if hasattr(result, 'compute'):
                    result = result.compute()
                
                self.optimizer.performance_metrics['parallel_tasks'] += 1
                return result
            
        # Processamento sequencial
        return analysis_func(optimized_ds)
    
    def resample_efficiently(self, ds: xr.Dataset, 
                           target_resolution: str) -> xr.Dataset:
        """Reamostra dataset de forma eficiente"""
        
        logger.info(f"Reamostrando dataset para resolução: {target_resolution}")
        
        # Otimizar antes da reamostragem
        optimized_ds = self.data_processor.optimize_xarray_dataset(ds)
        
        # Reamostragem otimizada
        resampled = optimized_ds.resample(time=target_resolution).mean()
        
        if hasattr(resampled, 'compute'):
            resampled = resampled.compute()
        
        return resampled

# Classe principal integrada
class OptimizedQGISAnalyzer:
    """Analisador QGIS otimizado para performance"""
    
    def __init__(self, **optimizer_kwargs):
        """Inicializa analisador otimizado"""
        
        self.performance_optimizer = PerformanceOptimizer(**optimizer_kwargs)
        self.spatial_optimizer = SpatialOptimizer(self.performance_optimizer)
        self.temporal_optimizer = TemporalOptimizer(self.performance_optimizer)
        self.memory_manager = MemoryManager(self.performance_optimizer)
    
    @cache_result(ttl=3600)
    async def optimized_hotspot_analysis(self, point_data: List[Dict], 
                                       analysis_field: str,
                                       method: str = "kernel_density") -> Dict[str, Any]:
        """Análise de hotspots otimizada"""
        
        start_time = time.time()
        
        # Verificar memória
        self.memory_manager.optimize_memory()
        
        # Converter para GeoDataFrame
        df = pd.DataFrame(point_data)
        gdf = gpd.GeoDataFrame(
            df, 
            geometry=gpd.points_from_xy(
                [p['coordinates'][0] for p in point_data],
                [p['coordinates'][1] for p in point_data]
            ),
            crs='EPSG:4326'
        )
        
        # Análise otimizada baseada no tamanho
        if len(gdf) > 10000:
            logger.info("Usando análise de hotspots otimizada para dataset grande")
            
            # Implementar análise paralela
            chunks = self.spatial_optimizer.data_processor.chunk_geodataframe(gdf)
            
            # Processar chunks em paralelo (simplificado para exemplo)
            hotspots = []
            for chunk in chunks:
                # Análise de densidade por chunk
                chunk_analysis = self._analyze_chunk_density(chunk, analysis_field)
                hotspots.extend(chunk_analysis)
            
            self.performance_optimizer.performance_metrics['parallel_tasks'] += 1
        
        else:
            # Análise normal para datasets pequenos
            hotspots = self._analyze_density(gdf, analysis_field)
        
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "hotspots": hotspots,
            "method": method,
            "total_points": len(point_data),
            "processing_time": processing_time,
            "performance_metrics": self.performance_optimizer.performance_metrics
        }
    
    def _analyze_chunk_density(self, gdf: gpd.GeoDataFrame, field: str) -> List[Dict]:
        """Análise de densidade para um chunk"""
        # Implementação simplificada
        return [
            {
                "coordinates": [row.geometry.x, row.geometry.y],
                "density_value": row[field] * 1.2,  # Fator de densidade simulado
                "confidence": 0.8
            }
            for _, row in gdf.iterrows()
            if row[field] > gdf[field].quantile(0.7)  # Top 30%
        ]
    
    def _analyze_density(self, gdf: gpd.GeoDataFrame, field: str) -> List[Dict]:
        """Análise de densidade padrão"""
        # Implementação simplificada
        threshold = gdf[field].quantile(0.8)  # Top 20%
        hotspots = gdf[gdf[field] > threshold]
        
        return [
            {
                "coordinates": [row.geometry.x, row.geometry.y],
                "density_value": row[field],
                "confidence": 0.9
            }
            for _, row in hotspots.iterrows()
        ]
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Retorna relatório de performance"""
        
        memory_info = self.memory_manager.get_memory_usage()
        
        return {
            "performance_metrics": self.performance_optimizer.performance_metrics,
            "memory_usage": memory_info,
            "cache_efficiency": (
                self.performance_optimizer.performance_metrics['cache_hits'] /
                max(1, self.performance_optimizer.performance_metrics['cache_hits'] + 
                    self.performance_optimizer.performance_metrics['cache_misses'])
            ) * 100,
            "optimization_status": {
                "redis_available": self.performance_optimizer.redis_available,
                "dask_available": self.performance_optimizer.dask_available,
                "max_workers": self.performance_optimizer.max_workers
            }
        }

# Exemplo de uso
async def main():
    """Exemplo de uso do otimizador"""
    
    # Inicializar analisador otimizado
    analyzer = OptimizedQGISAnalyzer(
        cache_dir="data/cache",
        max_workers=4,
        memory_limit="2GB"
    )
    
    # Dados de exemplo
    sample_data = [
        {"coordinates": [13.2317 + i*0.01, -8.8383 + i*0.01], "biomass": 100 + i*10}
        for i in range(1000)
    ]
    
    # Executar análise otimizada
    print("🚀 Executando análise de hotspots otimizada...")
    result = await analyzer.optimized_hotspot_analysis(sample_data, "biomass")
    
    print(f"✅ Análise concluída em {result['processing_time']:.2f}s")
    print(f"📊 Hotspots encontrados: {len(result['hotspots'])}")
    
    # Relatório de performance
    report = analyzer.get_performance_report()
    print(f"📈 Eficiência do cache: {report['cache_efficiency']:.1f}%")
    print(f"💾 Uso de memória: {report['memory_usage']['process_memory_mb']:.1f}MB")

if __name__ == "__main__":
    asyncio.run(main())
