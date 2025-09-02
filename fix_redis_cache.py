#!/usr/bin/env python3
"""
Script para corrigir problemas do Redis Cache
"""

import asyncio
import os
import sys
from pathlib import Path

# Adicionar src ao path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from bgapp.cache.redis_cache import cache, CacheConfig

async def test_and_fix_redis():
    """Testar e corrigir conexão Redis"""
    print("🔧 Testando e corrigindo conexão Redis...")
    
    # Configurar Redis para localhost durante desenvolvimento
    cache.config = CacheConfig(
        redis_host="localhost",
        redis_port=6379,
        redis_db=0,
        default_ttl=300,
        max_connections=20
    )
    
    try:
        await cache.connect()
        
        # Testar operações básicas
        test_key = "bgapp:test:connection"
        test_value = {"status": "ok", "timestamp": "2025-09-02"}
        
        # Set
        success = await cache.set(test_key, test_value, 60)
        if success:
            print("✅ Cache SET funcionando")
        else:
            print("❌ Cache SET falhou")
            return False
            
        # Get
        result = await cache.get(test_key)
        if result and result["status"] == "ok":
            print("✅ Cache GET funcionando")
        else:
            print("❌ Cache GET falhou")
            return False
            
        # Stats
        stats = await cache.get_stats()
        print(f"📊 Cache Stats: Hit Rate: {stats.hit_rate:.1f}%, Keys: {stats.total_keys}")
        
        # Cleanup
        await cache.delete(test_key)
        print("✅ Redis Cache funcionando corretamente!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no Redis Cache: {e}")
        return False
        
    finally:
        await cache.disconnect()

if __name__ == "__main__":
    result = asyncio.run(test_and_fix_redis())
    if result:
        print("🎉 Redis Cache corrigido com sucesso!")
        sys.exit(0)
    else:
        print("💥 Falha na correção do Redis Cache")
        sys.exit(1)
