"""
Performance Optimizer para Conectores BGAPP
Sistema de otimização de performance com cache, pooling e processamento assíncrono
"""

import asyncio
import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Callable
from functools import wraps
from pathlib import Path

import aiohttp
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from urllib3.poolmanager import PoolManager

logger = logging.getLogger(__name__)


class PerformanceOptimizer:
    """Sistema de otimização de performance para conectores"""
    
    def __init__(self, max_workers: int = 10, cache_ttl: int = 300):
        self.max_workers = max_workers
        self.cache_ttl = cache_ttl  # 5 minutos
        self.cache = {}
        self.cache_timestamps = {}
        self.session_pool = {}
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        
        # Métricas de performance
        self.metrics = {
            'requests_count': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'avg_response_time': 0,
            'errors': 0,
            'concurrent_requests': 0
        }
        
        # Connection pooling otimizado
        self.pool_config = {
            'pool_connections': 100,
            'pool_maxsize': 100,
            'max_retries': 3,
            'pool_block': False
        }
    
    def get_optimized_session(self, connector_id: str) -> requests.Session:
        """Obter sessão HTTP otimizada com connection pooling"""
        if connector_id not in self.session_pool:
            session = requests.Session()
            
            # Configurar retry strategy otimizada
            retry_strategy = Retry(
                total=3,
                status_forcelist=[429, 500, 502, 503, 504],
                method_whitelist=["HEAD", "GET", "POST", "OPTIONS"],
                backoff_factor=0.3,  # Mais agressivo
                respect_retry_after_header=True
            )
            
            # Adapter otimizado com connection pooling
            adapter = HTTPAdapter(
                max_retries=retry_strategy,
                pool_connections=self.pool_config['pool_connections'],
                pool_maxsize=self.pool_config['pool_maxsize'],
                pool_block=self.pool_config['pool_block']
            )
            
            session.mount("http://", adapter)
            session.mount("https://", adapter)
            
            # Headers otimizados
            session.headers.update({
                'User-Agent': f'BGAPP-Angola/2.0 {connector_id}-Optimized',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Keep-Alive': 'timeout=30, max=1000'
            })
            
            self.session_pool[connector_id] = session
        
        return self.session_pool[connector_id]
    
    def cache_key(self, func_name: str, *args, **kwargs) -> str:
        """Gerar chave de cache baseada na função e parâmetros"""
        key_parts = [func_name]
        key_parts.extend(str(arg) for arg in args)
        key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
        return "|".join(key_parts)
    
    def is_cache_valid(self, key: str) -> bool:
        """Verificar se item do cache ainda é válido"""
        if key not in self.cache_timestamps:
            return False
        
        age = time.time() - self.cache_timestamps[key]
        return age < self.cache_ttl
    
    def get_from_cache(self, key: str) -> Optional[Any]:
        """Obter item do cache se válido"""
        if key in self.cache and self.is_cache_valid(key):
            self.metrics['cache_hits'] += 1
            logger.debug(f"📋 Cache hit: {key}")
            return self.cache[key]
        
        self.metrics['cache_misses'] += 1
        return None
    
    def set_cache(self, key: str, value: Any) -> None:
        """Armazenar item no cache"""
        self.cache[key] = value
        self.cache_timestamps[key] = time.time()
        logger.debug(f"💾 Cache set: {key}")
    
    def clear_expired_cache(self) -> None:
        """Limpar itens expirados do cache"""
        current_time = time.time()
        expired_keys = [
            key for key, timestamp in self.cache_timestamps.items()
            if current_time - timestamp > self.cache_ttl
        ]
        
        for key in expired_keys:
            del self.cache[key]
            del self.cache_timestamps[key]
        
        if expired_keys:
            logger.info(f"🧹 Limpeza de cache: {len(expired_keys)} itens removidos")
    
    def cached(self, ttl: int = None):
        """Decorator para cache automático de funções"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Usar TTL personalizado se fornecido
                cache_ttl = ttl or self.cache_ttl
                
                # Gerar chave de cache
                cache_key = self.cache_key(func.__name__, *args, **kwargs)
                
                # Tentar obter do cache
                cached_result = self.get_from_cache(cache_key)
                if cached_result is not None:
                    return cached_result
                
                # Executar função e cachear resultado
                start_time = time.time()
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                
                # Atualizar métricas
                self.metrics['requests_count'] += 1
                self.update_avg_response_time(execution_time)
                
                # Cachear resultado
                self.set_cache(cache_key, result)
                
                return result
            return wrapper
        return decorator
    
    def timed(self, func):
        """Decorator para medir tempo de execução"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                self.update_avg_response_time(execution_time)
                logger.debug(f"⏱️ {func.__name__}: {execution_time:.3f}s")
                return result
            except Exception as e:
                self.metrics['errors'] += 1
                logger.error(f"❌ {func.__name__} error: {e}")
                raise
        return wrapper
    
    def update_avg_response_time(self, new_time: float) -> None:
        """Atualizar tempo médio de resposta"""
        current_avg = self.metrics['avg_response_time']
        count = self.metrics['requests_count']
        
        if count == 0:
            self.metrics['avg_response_time'] = new_time
        else:
            # Média móvel
            self.metrics['avg_response_time'] = (current_avg * (count - 1) + new_time) / count
    
    async def async_request(self, session: aiohttp.ClientSession, 
                          method: str, url: str, **kwargs) -> Dict[str, Any]:
        """Fazer requisição HTTP assíncrona"""
        start_time = time.time()
        
        try:
            async with session.request(method, url, **kwargs) as response:
                data = await response.json()
                execution_time = time.time() - start_time
                
                self.metrics['requests_count'] += 1
                self.update_avg_response_time(execution_time)
                
                return {
                    'status': response.status,
                    'data': data,
                    'execution_time': execution_time,
                    'url': str(response.url)
                }
                
        except Exception as e:
            self.metrics['errors'] += 1
            logger.error(f"❌ Async request error: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'execution_time': time.time() - start_time,
                'url': url
            }
    
    async def batch_requests(self, requests_data: List[Dict[str, Any]], 
                           max_concurrent: int = 10) -> List[Dict[str, Any]]:
        """Executar múltiplas requisições em lote de forma assíncrona"""
        connector_timeout = aiohttp.ClientTimeout(total=30, connect=10)
        
        async with aiohttp.ClientSession(
            timeout=connector_timeout,
            connector=aiohttp.TCPConnector(limit=max_concurrent, ttl_dns_cache=300)
        ) as session:
            
            # Criar semáforo para limitar concorrência
            semaphore = asyncio.Semaphore(max_concurrent)
            
            async def bounded_request(req_data):
                async with semaphore:
                    return await self.async_request(session, **req_data)
            
            # Executar todas as requisições
            tasks = [bounded_request(req) for req in requests_data]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Processar resultados
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    processed_results.append({
                        'status': 'error',
                        'error': str(result),
                        'request_index': i
                    })
                else:
                    processed_results.append(result)
            
            return processed_results
    
    def parallel_processing(self, func: Callable, data_list: List[Any], 
                          max_workers: int = None) -> List[Any]:
        """Processar dados em paralelo usando ThreadPoolExecutor"""
        max_workers = max_workers or self.max_workers
        results = []
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submeter todas as tarefas
            future_to_data = {executor.submit(func, data): data for data in data_list}
            
            # Coletar resultados conforme ficam prontos
            for future in as_completed(future_to_data):
                data = future_to_data[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logger.error(f"❌ Parallel processing error for {data}: {e}")
                    results.append({'error': str(e), 'data': data})
        
        return results
    
    def optimize_json_processing(self, json_data: str) -> Dict[str, Any]:
        """Otimizar processamento de JSON grandes"""
        try:
            # Para JSONs muito grandes, usar ujson se disponível
            try:
                import ujson
                return ujson.loads(json_data)
            except ImportError:
                # Fallback para json padrão
                return json.loads(json_data)
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error: {e}")
            return {}
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Obter métricas de performance atuais"""
        cache_hit_rate = 0
        if self.metrics['cache_hits'] + self.metrics['cache_misses'] > 0:
            cache_hit_rate = self.metrics['cache_hits'] / (
                self.metrics['cache_hits'] + self.metrics['cache_misses']
            ) * 100
        
        return {
            'requests_total': self.metrics['requests_count'],
            'cache_hits': self.metrics['cache_hits'],
            'cache_misses': self.metrics['cache_misses'],
            'cache_hit_rate': round(cache_hit_rate, 2),
            'avg_response_time': round(self.metrics['avg_response_time'], 3),
            'errors': self.metrics['errors'],
            'cache_size': len(self.cache),
            'active_sessions': len(self.session_pool),
            'timestamp': datetime.now().isoformat()
        }
    
    def export_metrics(self, output_path: Path = None) -> Path:
        """Exportar métricas para arquivo"""
        if not output_path:
            output_path = Path(f"performance_metrics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        
        metrics_data = {
            'performance_metrics': self.get_performance_metrics(),
            'cache_keys': list(self.cache.keys()),
            'session_pool_connectors': list(self.session_pool.keys()),
            'config': {
                'max_workers': self.max_workers,
                'cache_ttl': self.cache_ttl,
                'pool_config': self.pool_config
            }
        }
        
        with open(output_path, 'w') as f:
            json.dump(metrics_data, f, indent=2)
        
        logger.info(f"📊 Métricas exportadas para: {output_path}")
        return output_path
    
    def reset_metrics(self) -> None:
        """Resetar todas as métricas"""
        self.metrics = {
            'requests_count': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'avg_response_time': 0,
            'errors': 0,
            'concurrent_requests': 0
        }
        logger.info("🔄 Métricas de performance resetadas")
    
    def cleanup(self) -> None:
        """Limpeza de recursos"""
        # Fechar sessões HTTP
        for session in self.session_pool.values():
            session.close()
        
        # Limpar cache
        self.cache.clear()
        self.cache_timestamps.clear()
        
        # Shutdown executor
        self.executor.shutdown(wait=True)
        
        logger.info("🧹 Limpeza de recursos concluída")


# Instância global do otimizador
performance_optimizer = PerformanceOptimizer()


# Decorators para uso fácil
def cached(ttl: int = 300):
    """Decorator para cache com TTL personalizado"""
    return performance_optimizer.cached(ttl=ttl)


def timed(func):
    """Decorator para medir tempo de execução"""
    return performance_optimizer.timed(func)


# Funções de conveniência
def get_optimized_session(connector_id: str) -> requests.Session:
    """Obter sessão otimizada para um conector"""
    return performance_optimizer.get_optimized_session(connector_id)


def get_performance_metrics() -> Dict[str, Any]:
    """Obter métricas atuais de performance"""
    return performance_optimizer.get_performance_metrics()


async def batch_async_requests(requests_data: List[Dict[str, Any]], 
                              max_concurrent: int = 10) -> List[Dict[str, Any]]:
    """Executar requisições assíncronas em lote"""
    return await performance_optimizer.batch_requests(requests_data, max_concurrent)


def parallel_process(func: Callable, data_list: List[Any], 
                    max_workers: int = None) -> List[Any]:
    """Processar dados em paralelo"""
    return performance_optimizer.parallel_processing(func, data_list, max_workers)


def cleanup_performance_optimizer():
    """Limpar recursos do otimizador"""
    performance_optimizer.cleanup()


if __name__ == "__main__":
    # Teste do sistema de otimização
    import asyncio
    
    async def test_performance_optimizer():
        print("🚀 Testando Performance Optimizer...")
        
        # Teste de cache
        @cached(ttl=60)
        def test_function(param):
            time.sleep(0.1)  # Simular processamento
            return f"Result for {param}"
        
        # Primeiro call - cache miss
        start = time.time()
        result1 = test_function("test1")
        time1 = time.time() - start
        print(f"Primeira chamada: {time1:.3f}s - {result1}")
        
        # Segunda call - cache hit
        start = time.time()
        result2 = test_function("test1")
        time2 = time.time() - start
        print(f"Segunda chamada: {time2:.3f}s - {result2}")
        
        # Teste de requisições assíncronas
        requests_data = [
            {'method': 'GET', 'url': 'https://httpbin.org/delay/1'},
            {'method': 'GET', 'url': 'https://httpbin.org/delay/1'},
            {'method': 'GET', 'url': 'https://httpbin.org/delay/1'}
        ]
        
        start = time.time()
        results = await batch_async_requests(requests_data, max_concurrent=3)
        batch_time = time.time() - start
        print(f"Requisições em lote: {batch_time:.3f}s - {len(results)} resultados")
        
        # Mostrar métricas
        metrics = get_performance_metrics()
        print("📊 Métricas de Performance:")
        for key, value in metrics.items():
            print(f"   {key}: {value}")
    
    # Executar teste
    asyncio.run(test_performance_optimizer())
