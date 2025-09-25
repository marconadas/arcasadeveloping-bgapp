#!/usr/bin/env python3
"""
Sistema de Connection Pooling para PostgreSQL
Implementa pool de conexões com health checks e recovery automático
"""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
import asyncpg
from asyncpg import Pool, Connection
from asyncpg.pool import PoolConnectionProxy

from .secure_config import get_settings
from .error_handler import error_handler, with_error_handling

settings = get_settings()
logger = logging.getLogger(__name__)


class DatabasePoolManager:
    """Gerenciador de pool de conexões PostgreSQL"""
    
    def __init__(self):
        self.pool: Optional[Pool] = None
        self.health_check_task: Optional[asyncio.Task] = None
        self.stats = {
            'total_connections': 0,
            'active_connections': 0,
            'failed_connections': 0,
            'successful_queries': 0,
            'failed_queries': 0,
            'last_health_check': None,
            'pool_created_at': None
        }
        
    async def initialize(self) -> bool:
        """Inicializar pool de conexões"""
        try:
            # Configurar conexão
            dsn = self._build_dsn()
            
            # Criar pool com configurações otimizadas
            self.pool = await asyncpg.create_pool(
                dsn,
                min_size=5,           # Mínimo de conexões
                max_size=20,          # Máximo de conexões
                max_queries=50000,    # Queries por conexão antes de reciclar
                max_inactive_connection_lifetime=300,  # 5 minutos
                command_timeout=30,   # Timeout para comandos
                server_settings={
                    'jit': 'off',     # Desabilitar JIT para consultas rápidas
                    'application_name': 'bgapp_pool'
                }
            )
            
            # Testar pool
            async with self.pool.acquire() as conn:
                await conn.fetchval('SELECT 1')
            
            self.stats['pool_created_at'] = datetime.now()
            self.stats['total_connections'] = self.pool.get_size()
            
            # Iniciar health check
            self.health_check_task = asyncio.create_task(self._health_check_loop())
            
            logger.info(f"Database pool initialized with {self.pool.get_size()} connections")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            return False
    
    def _build_dsn(self) -> str:
        """Construir DSN de conexão"""
        host = getattr(settings, 'postgres_host', 'localhost')
        port = getattr(settings, 'postgres_port', 5432)
        database = getattr(settings, 'postgres_database', 'geo')
        username = getattr(settings, 'postgres_username', 'postgres')
        password = getattr(settings, 'postgres_password', 'postgres')
        
        return f"postgresql://{username}:{password}@{host}:{port}/{database}"
    
    @asynccontextmanager
    async def get_connection(self):
        """Context manager para obter conexão do pool"""
        if not self.pool:
            raise RuntimeError("Database pool not initialized")
        
        connection = None
        try:
            # Adquirir conexão com timeout
            connection = await asyncio.wait_for(
                self.pool.acquire(),
                timeout=10.0
            )
            
            self.stats['active_connections'] += 1
            yield connection
            
        except asyncio.TimeoutError:
            self.stats['failed_connections'] += 1
            logger.error("Timeout acquiring database connection")
            raise RuntimeError("Database connection timeout")
            
        except Exception as e:
            self.stats['failed_connections'] += 1
            logger.error(f"Error acquiring database connection: {e}")
            raise
            
        finally:
            if connection:
                try:
                    await self.pool.release(connection)
                    self.stats['active_connections'] -= 1
                except Exception as e:
                    logger.error(f"Error releasing connection: {e}")
    
    @with_error_handling("database", max_retries=3)
    async def execute_query(self, query: str, *args, **kwargs) -> Any:
        """Executar query com retry automático"""
        async with self.get_connection() as conn:
            try:
                result = await conn.fetch(query, *args, **kwargs)
                self.stats['successful_queries'] += 1
                return result
            except Exception as e:
                self.stats['failed_queries'] += 1
                logger.error(f"Query failed: {query[:100]}... Error: {e}")
                raise
    
    @with_error_handling("database", max_retries=3)
    async def execute_query_one(self, query: str, *args, **kwargs) -> Any:
        """Executar query que retorna um resultado"""
        async with self.get_connection() as conn:
            try:
                result = await conn.fetchrow(query, *args, **kwargs)
                self.stats['successful_queries'] += 1
                return result
            except Exception as e:
                self.stats['failed_queries'] += 1
                logger.error(f"Query failed: {query[:100]}... Error: {e}")
                raise
    
    @with_error_handling("database", max_retries=3)
    async def execute_query_val(self, query: str, *args, **kwargs) -> Any:
        """Executar query que retorna um valor"""
        async with self.get_connection() as conn:
            try:
                result = await conn.fetchval(query, *args, **kwargs)
                self.stats['successful_queries'] += 1
                return result
            except Exception as e:
                self.stats['failed_queries'] += 1
                logger.error(f"Query failed: {query[:100]}... Error: {e}")
                raise
    
    async def execute_transaction(self, queries: list) -> bool:
        """Executar múltiplas queries em transação"""
        async with self.get_connection() as conn:
            async with conn.transaction():
                try:
                    results = []
                    for query, args in queries:
                        if isinstance(args, (list, tuple)):
                            result = await conn.fetch(query, *args)
                        else:
                            result = await conn.fetch(query, args)
                        results.append(result)
                    
                    self.stats['successful_queries'] += len(queries)
                    return results
                    
                except Exception as e:
                    self.stats['failed_queries'] += len(queries)
                    logger.error(f"Transaction failed: {e}")
                    raise
    
    async def _health_check_loop(self):
        """Loop de health check para o pool"""
        while True:
            try:
                await asyncio.sleep(30)  # Check a cada 30 segundos
                
                if not self.pool:
                    continue
                
                # Test connection
                async with self.get_connection() as conn:
                    await conn.fetchval('SELECT 1')
                
                self.stats['last_health_check'] = datetime.now()
                
                # Log stats periodicamente
                if self.stats['successful_queries'] % 100 == 0:
                    logger.info(f"Pool stats: {self.get_stats()}")
                
            except Exception as e:
                logger.error(f"Health check failed: {e}")
                
                # Tentar recriar pool se muitas falhas
                if self.stats['failed_connections'] > 10:
                    logger.warning("Too many failed connections, recreating pool")
                    await self.recreate_pool()
    
    async def recreate_pool(self):
        """Recriar pool em caso de problemas"""
        try:
            if self.pool:
                await self.pool.close()
                self.pool = None
            
            # Resetar stats de falha
            self.stats['failed_connections'] = 0
            self.stats['failed_queries'] = 0
            
            # Recriar pool
            await self.initialize()
            
        except Exception as e:
            logger.error(f"Failed to recreate pool: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Obter estatísticas do pool"""
        pool_stats = {}
        
        if self.pool:
            pool_stats = {
                'size': self.pool.get_size(),
                'min_size': self.pool.get_min_size(),
                'max_size': self.pool.get_max_size(),
                'idle_connections': self.pool.get_idle_size(),
            }
        
        return {
            **self.stats,
            **pool_stats,
            'healthy': self.is_healthy()
        }
    
    def is_healthy(self) -> bool:
        """Verificar se pool está saudável"""
        if not self.pool:
            return False
        
        # Verificar se último health check foi recente
        if self.stats['last_health_check']:
            time_since_check = datetime.now() - self.stats['last_health_check']
            if time_since_check > timedelta(minutes=2):
                return False
        
        # Verificar taxa de falhas
        total_queries = self.stats['successful_queries'] + self.stats['failed_queries']
        if total_queries > 10:
            failure_rate = self.stats['failed_queries'] / total_queries
            if failure_rate > 0.1:  # Mais de 10% de falhas
                return False
        
        return True
    
    async def close(self):
        """Fechar pool e recursos"""
        if self.health_check_task:
            self.health_check_task.cancel()
            try:
                await self.health_check_task
            except asyncio.CancelledError:
                pass
        
        if self.pool:
            await self.pool.close()
            self.pool = None


# Instância global do pool manager
db_pool = DatabasePoolManager()


async def initialize_database_pool():
    """Inicializar pool de database"""
    return await db_pool.initialize()


async def get_db_connection():
    """Obter conexão do pool (context manager)"""
    return db_pool.get_connection()


async def execute_query(query: str, *args, **kwargs):
    """Executar query usando pool"""
    return await db_pool.execute_query(query, *args, **kwargs)


async def execute_query_one(query: str, *args, **kwargs):
    """Executar query que retorna uma linha"""
    return await db_pool.execute_query_one(query, *args, **kwargs)


async def execute_query_val(query: str, *args, **kwargs):
    """Executar query que retorna um valor"""
    return await db_pool.execute_query_val(query, *args, **kwargs)


def get_database_stats():
    """Obter estatísticas do database pool"""
    return db_pool.get_stats()


def is_database_healthy():
    """Verificar se database está saudável"""
    return db_pool.is_healthy()
