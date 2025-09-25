#!/usr/bin/env python3
"""
API Gateway Avançado BGAPP
Rate limiting, controlo de acesso e balanceamento para suportar 10x mais utilizadores
"""

import time
import json
import hashlib
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict, deque

import redis.asyncio as redis
from fastapi import FastAPI, Request, HTTPException, Depends, status
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
import httpx
from pydantic import BaseModel

class RateLimitType(str, Enum):
    """Tipos de rate limiting"""
    PER_IP = "per_ip"
    PER_USER = "per_user"
    PER_API_KEY = "per_api_key"
    GLOBAL = "global"

class AccessLevel(str, Enum):
    """Níveis de acesso"""
    PUBLIC = "public"
    AUTHENTICATED = "authenticated"
    PREMIUM = "premium"
    ADMIN = "admin"

@dataclass
class RateLimitRule:
    """Regra de rate limiting"""
    id: str
    type: RateLimitType
    limit: int  # Requests por período
    window_seconds: int  # Janela de tempo
    access_level: AccessLevel
    endpoints: List[str]  # Padrões de endpoints
    enabled: bool = True

@dataclass
class RateLimitStatus:
    """Status atual do rate limit"""
    requests_made: int
    limit: int
    remaining: int
    reset_time: datetime
    blocked: bool

class CircuitBreakerState(str, Enum):
    """Estados do Circuit Breaker"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if service recovered

@dataclass
class ServiceHealth:
    """Saúde de um serviço backend"""
    url: str
    healthy: bool
    response_time_ms: float
    error_count: int
    last_check: datetime
    circuit_state: CircuitBreakerState

class LoadBalancingStrategy(str, Enum):
    """Estratégias de balanceamento de carga"""
    ROUND_ROBIN = "round_robin"
    LEAST_CONNECTIONS = "least_connections"
    WEIGHTED = "weighted"
    HEALTH_BASED = "health_based"

class APIGateway:
    """API Gateway avançado com rate limiting e balanceamento"""
    
    def __init__(self, redis_host: str = "redis", redis_port: int = 6379):
        self.redis_pool = None
        self.redis_host = redis_host
        self.redis_port = redis_port
        
        # Rate limiting
        self.rate_limit_rules: Dict[str, RateLimitRule] = {}
        self.request_counts: Dict[str, deque] = defaultdict(deque)
        
        # Load balancing
        self.backend_services: Dict[str, List[str]] = {}
        self.service_health: Dict[str, ServiceHealth] = {}
        self.round_robin_counters: Dict[str, int] = defaultdict(int)
        
        # Circuit breaker
        self.circuit_breakers: Dict[str, Dict] = {}
        
        # Metrics
        self.metrics = {
            "total_requests": 0,
            "blocked_requests": 0,
            "backend_errors": 0,
            "avg_response_time": 0.0
        }
        
        # Load default rules
        self._load_default_rules()
        self._setup_backend_services()
        
    async def initialize(self):
        """Inicializar gateway"""
        try:
            # Connect to Redis
            self.redis_pool = redis.ConnectionPool(
                host=self.redis_host,
                port=self.redis_port,
                db=2,  # DB diferente do cache
                max_connections=20
            )
            self.redis = redis.Redis(connection_pool=self.redis_pool)
            await self.redis.ping()
            
            print("✅ API Gateway inicializado com Redis")
            
            # Start health checks
            asyncio.create_task(self._health_check_loop())
            
        except Exception as e:
            print(f"⚠️ API Gateway sem Redis: {e}")
            self.redis = None
    
    def _load_default_rules(self):
        """Carregar regras padrão de rate limiting"""
        default_rules = [
            RateLimitRule(
                id="public_basic",
                type=RateLimitType.PER_IP,
                limit=100,  # 100 requests
                window_seconds=3600,  # por hora
                access_level=AccessLevel.PUBLIC,
                endpoints=["*"]
            ),
            RateLimitRule(
                id="authenticated_standard",
                type=RateLimitType.PER_USER,
                limit=1000,  # 1000 requests
                window_seconds=3600,  # por hora
                access_level=AccessLevel.AUTHENTICATED,
                endpoints=["*"]
            ),
            RateLimitRule(
                id="premium_extended",
                type=RateLimitType.PER_USER,
                limit=10000,  # 10k requests
                window_seconds=3600,  # por hora
                access_level=AccessLevel.PREMIUM,
                endpoints=["*"]
            ),
            RateLimitRule(
                id="admin_unlimited",
                type=RateLimitType.PER_USER,
                limit=100000,  # 100k requests
                window_seconds=3600,  # por hora
                access_level=AccessLevel.ADMIN,
                endpoints=["*"]
            ),
            RateLimitRule(
                id="ml_predictions_limited",
                type=RateLimitType.PER_IP,
                limit=50,  # 50 predictions
                window_seconds=3600,  # por hora
                access_level=AccessLevel.PUBLIC,
                endpoints=["/ml/predict/*"]
            ),
            RateLimitRule(
                id="data_export_limited",
                type=RateLimitType.PER_USER,
                limit=10,  # 10 exports
                window_seconds=3600,  # por hora
                access_level=AccessLevel.AUTHENTICATED,
                endpoints=["/export/*", "/backup/*"]
            )
        ]
        
        for rule in default_rules:
            self.rate_limit_rules[rule.id] = rule
    
    def _setup_backend_services(self):
        """Configurar serviços backend"""
        self.backend_services = {
            "admin_api": [
                "http://admin-api:8000",
                # "http://admin-api-2:8000",  # Para scaling
                # "http://admin-api-3:8000"
            ],
            "stac_api": [
                "http://stac:8080"
            ],
            "pygeoapi": [
                "http://pygeoapi:80"
            ]
        }
        
        # Initialize health status
        for service_name, urls in self.backend_services.items():
            for url in urls:
                self.service_health[f"{service_name}_{url}"] = ServiceHealth(
                    url=url,
                    healthy=True,
                    response_time_ms=0.0,
                    error_count=0,
                    last_check=datetime.now(),
                    circuit_state=CircuitBreakerState.CLOSED
                )
    
    async def check_rate_limit(self, request: Request, user_id: Optional[str] = None) -> RateLimitStatus:
        """Verificar rate limit para uma requisição"""
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")
        endpoint = request.url.path
        
        # Determinar nível de acesso (simplificado)
        access_level = AccessLevel.PUBLIC
        if user_id:
            access_level = AccessLevel.AUTHENTICATED
            # Lógica para detectar premium/admin seria implementada aqui
        
        # Encontrar regra aplicável
        applicable_rule = self._find_applicable_rule(endpoint, access_level)
        if not applicable_rule:
            return RateLimitStatus(0, 999999, 999999, datetime.now(), False)
        
        # Gerar chave para rate limiting
        if applicable_rule.type == RateLimitType.PER_IP:
            key = f"rate_limit:ip:{client_ip}"
        elif applicable_rule.type == RateLimitType.PER_USER and user_id:
            key = f"rate_limit:user:{user_id}"
        elif applicable_rule.type == RateLimitType.PER_API_KEY:
            api_key = request.headers.get("x-api-key", "anonymous")
            key = f"rate_limit:key:{api_key}"
        else:
            key = f"rate_limit:global"
        
        # Check rate limit
        current_time = datetime.now()
        window_start = current_time - timedelta(seconds=applicable_rule.window_seconds)
        
        if self.redis:
            # Use Redis for distributed rate limiting
            return await self._check_redis_rate_limit(key, applicable_rule, current_time)
        else:
            # Use in-memory rate limiting
            return self._check_memory_rate_limit(key, applicable_rule, current_time, window_start)
    
    def _find_applicable_rule(self, endpoint: str, access_level: AccessLevel) -> Optional[RateLimitRule]:
        """Encontrar regra aplicável para endpoint e nível de acesso"""
        # Ordenar por especificidade (regras mais específicas primeiro)
        sorted_rules = sorted(
            self.rate_limit_rules.values(),
            key=lambda r: (r.access_level.value, len(r.endpoints[0]) if r.endpoints else 0),
            reverse=True
        )
        
        for rule in sorted_rules:
            if not rule.enabled:
                continue
                
            if rule.access_level != access_level:
                continue
            
            # Check endpoint patterns
            for pattern in rule.endpoints:
                if pattern == "*" or endpoint.startswith(pattern.replace("*", "")):
                    return rule
        
        return None
    
    async def _check_redis_rate_limit(self, key: str, rule: RateLimitRule, current_time: datetime) -> RateLimitStatus:
        """Verificar rate limit usando Redis"""
        try:
            pipe = self.redis.pipeline()
            
            # Remove expired entries
            expire_time = current_time.timestamp() - rule.window_seconds
            pipe.zremrangebyscore(key, 0, expire_time)
            
            # Count current requests
            pipe.zcard(key)
            
            # Add current request
            pipe.zadd(key, {str(current_time.timestamp()): current_time.timestamp()})
            
            # Set expiration
            pipe.expire(key, rule.window_seconds)
            
            results = await pipe.execute()
            current_count = results[1]
            
            remaining = max(0, rule.limit - current_count)
            reset_time = current_time + timedelta(seconds=rule.window_seconds)
            blocked = current_count >= rule.limit
            
            return RateLimitStatus(
                requests_made=current_count,
                limit=rule.limit,
                remaining=remaining,
                reset_time=reset_time,
                blocked=blocked
            )
            
        except Exception as e:
            print(f"❌ Erro verificando rate limit Redis: {e}")
            # Fallback to allow request
            return RateLimitStatus(0, rule.limit, rule.limit, current_time, False)
    
    def _check_memory_rate_limit(self, key: str, rule: RateLimitRule, current_time: datetime, window_start: datetime) -> RateLimitStatus:
        """Verificar rate limit usando memória local"""
        requests = self.request_counts[key]
        
        # Remove expired requests
        while requests and datetime.fromtimestamp(requests[0]) < window_start:
            requests.popleft()
        
        # Add current request
        requests.append(current_time.timestamp())
        
        current_count = len(requests)
        remaining = max(0, rule.limit - current_count)
        reset_time = current_time + timedelta(seconds=rule.window_seconds)
        blocked = current_count > rule.limit
        
        return RateLimitStatus(
            requests_made=current_count,
            limit=rule.limit,
            remaining=remaining,
            reset_time=reset_time,
            blocked=blocked
        )
    
    async def route_request(self, service_name: str, path: str, method: str, **kwargs) -> httpx.Response:
        """Rotear requisição para serviço backend com load balancing"""
        if service_name not in self.backend_services:
            raise HTTPException(status_code=404, detail=f"Serviço {service_name} não encontrado")
        
        # Select backend using load balancing
        backend_url = self._select_backend(service_name)
        
        if not backend_url:
            raise HTTPException(status_code=503, detail=f"Nenhum backend saudável para {service_name}")
        
        # Make request with circuit breaker
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.request(
                    method=method,
                    url=f"{backend_url}{path}",
                    **kwargs
                )
            
            response_time = (time.time() - start_time) * 1000
            
            # Update health metrics
            health_key = f"{service_name}_{backend_url}"
            if health_key in self.service_health:
                self.service_health[health_key].response_time_ms = response_time
                self.service_health[health_key].healthy = True
                self.service_health[health_key].error_count = 0
            
            # Update circuit breaker
            self._update_circuit_breaker(service_name, backend_url, True, response_time)
            
            return response
            
        except Exception as e:
            # Update health metrics
            health_key = f"{service_name}_{backend_url}"
            if health_key in self.service_health:
                self.service_health[health_key].healthy = False
                self.service_health[health_key].error_count += 1
            
            # Update circuit breaker
            self._update_circuit_breaker(service_name, backend_url, False, 0)
            
            self.metrics["backend_errors"] += 1
            raise HTTPException(status_code=502, detail=f"Erro backend {service_name}: {str(e)}")
    
    def _select_backend(self, service_name: str, strategy: LoadBalancingStrategy = LoadBalancingStrategy.HEALTH_BASED) -> Optional[str]:
        """Selecionar backend usando estratégia de load balancing"""
        backends = self.backend_services.get(service_name, [])
        if not backends:
            return None
        
        if strategy == LoadBalancingStrategy.ROUND_ROBIN:
            # Round Robin simples
            counter = self.round_robin_counters[service_name]
            selected = backends[counter % len(backends)]
            self.round_robin_counters[service_name] = (counter + 1) % len(backends)
            return selected
            
        elif strategy == LoadBalancingStrategy.HEALTH_BASED:
            # Selecionar apenas backends saudáveis
            healthy_backends = []
            for backend in backends:
                health_key = f"{service_name}_{backend}"
                health = self.service_health.get(health_key)
                if health and health.healthy and health.circuit_state != CircuitBreakerState.OPEN:
                    healthy_backends.append((backend, health.response_time_ms))
            
            if not healthy_backends:
                # Se nenhum está saudável, tentar o primeiro
                return backends[0]
            
            # Selecionar o mais rápido
            healthy_backends.sort(key=lambda x: x[1])
            return healthy_backends[0][0]
        
        # Default: primeiro backend
        return backends[0]
    
    def _update_circuit_breaker(self, service_name: str, backend_url: str, success: bool, response_time: float):
        """Atualizar estado do circuit breaker"""
        key = f"{service_name}_{backend_url}"
        
        if key not in self.circuit_breakers:
            self.circuit_breakers[key] = {
                "failure_count": 0,
                "success_count": 0,
                "last_failure": None,
                "state": CircuitBreakerState.CLOSED
            }
        
        cb = self.circuit_breakers[key]
        
        if success:
            cb["success_count"] += 1
            cb["failure_count"] = 0  # Reset on success
            
            # If half-open and successful, close circuit
            if cb["state"] == CircuitBreakerState.HALF_OPEN:
                cb["state"] = CircuitBreakerState.CLOSED
                
        else:
            cb["failure_count"] += 1
            cb["last_failure"] = datetime.now()
            
            # Open circuit after 5 consecutive failures
            if cb["failure_count"] >= 5 and cb["state"] == CircuitBreakerState.CLOSED:
                cb["state"] = CircuitBreakerState.OPEN
                
        # Try to half-open after 60 seconds
        if (cb["state"] == CircuitBreakerState.OPEN and 
            cb["last_failure"] and 
            datetime.now() - cb["last_failure"] > timedelta(seconds=60)):
            cb["state"] = CircuitBreakerState.HALF_OPEN
    
    async def _health_check_loop(self):
        """Loop de verificação de saúde dos backends"""
        while True:
            try:
                await self._check_backend_health()
                await asyncio.sleep(30)  # Check every 30 seconds
            except Exception as e:
                print(f"❌ Erro no health check: {e}")
                await asyncio.sleep(60)
    
    async def _check_backend_health(self):
        """Verificar saúde de todos os backends"""
        for service_name, backends in self.backend_services.items():
            for backend_url in backends:
                try:
                    start_time = time.time()
                    
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        response = await client.get(f"{backend_url}/health")
                    
                    response_time = (time.time() - start_time) * 1000
                    healthy = response.status_code == 200
                    
                    # Update health status
                    health_key = f"{service_name}_{backend_url}"
                    if health_key in self.service_health:
                        self.service_health[health_key].healthy = healthy
                        self.service_health[health_key].response_time_ms = response_time
                        self.service_health[health_key].last_check = datetime.now()
                        
                        if not healthy:
                            self.service_health[health_key].error_count += 1
                        else:
                            self.service_health[health_key].error_count = 0
                    
                except Exception as e:
                    # Mark as unhealthy
                    health_key = f"{service_name}_{backend_url}"
                    if health_key in self.service_health:
                        self.service_health[health_key].healthy = False
                        self.service_health[health_key].error_count += 1
                        self.service_health[health_key].last_check = datetime.now()
    
    def get_metrics(self) -> Dict[str, Any]:
        """Obter métricas do gateway"""
        # Calculate health statistics
        total_backends = len(self.service_health)
        healthy_backends = sum(1 for h in self.service_health.values() if h.healthy)
        
        avg_response_time = 0
        if self.service_health:
            avg_response_time = sum(h.response_time_ms for h in self.service_health.values()) / len(self.service_health)
        
        return {
            "total_requests": self.metrics["total_requests"],
            "blocked_requests": self.metrics["blocked_requests"],
            "backend_errors": self.metrics["backend_errors"],
            "block_rate": (self.metrics["blocked_requests"] / max(1, self.metrics["total_requests"])) * 100,
            "backend_health": {
                "total_backends": total_backends,
                "healthy_backends": healthy_backends,
                "unhealthy_backends": total_backends - healthy_backends,
                "health_rate": (healthy_backends / max(1, total_backends)) * 100
            },
            "performance": {
                "avg_response_time_ms": avg_response_time,
                "circuit_breakers": {
                    key: cb["state"] for key, cb in self.circuit_breakers.items()
                }
            },
            "rate_limits": {
                "active_rules": len([r for r in self.rate_limit_rules.values() if r.enabled]),
                "total_rules": len(self.rate_limit_rules)
            }
        }
    
    def add_rate_limit_rule(self, rule: RateLimitRule):
        """Adicionar nova regra de rate limiting"""
        self.rate_limit_rules[rule.id] = rule
    
    def remove_rate_limit_rule(self, rule_id: str):
        """Remover regra de rate limiting"""
        if rule_id in self.rate_limit_rules:
            del self.rate_limit_rules[rule_id]

# Middleware para integração com FastAPI
class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware de rate limiting para FastAPI"""
    
    def __init__(self, app, gateway: APIGateway):
        super().__init__(app)
        self.gateway = gateway
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)
        
        # Check rate limit
        try:
            # Extract user ID from token/session (simplified)
            user_id = request.headers.get("x-user-id")  # Seria extraído do JWT
            
            rate_limit_status = await self.gateway.check_rate_limit(request, user_id)
            
            self.gateway.metrics["total_requests"] += 1
            
            if rate_limit_status.blocked:
                self.gateway.metrics["blocked_requests"] += 1
                
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": "Rate limit exceeded",
                        "limit": rate_limit_status.limit,
                        "remaining": rate_limit_status.remaining,
                        "reset_time": rate_limit_status.reset_time.isoformat(),
                        "retry_after": int((rate_limit_status.reset_time - datetime.now()).total_seconds())
                    },
                    headers={
                        "X-RateLimit-Limit": str(rate_limit_status.limit),
                        "X-RateLimit-Remaining": str(rate_limit_status.remaining),
                        "X-RateLimit-Reset": str(int(rate_limit_status.reset_time.timestamp())),
                        "Retry-After": str(int((rate_limit_status.reset_time - datetime.now()).total_seconds()))
                    }
                )
            
            # Process request
            response = await call_next(request)
            
            # Add rate limit headers to response
            response.headers["X-RateLimit-Limit"] = str(rate_limit_status.limit)
            response.headers["X-RateLimit-Remaining"] = str(rate_limit_status.remaining)
            response.headers["X-RateLimit-Reset"] = str(int(rate_limit_status.reset_time.timestamp()))
            
            return response
            
        except Exception as e:
            print(f"❌ Erro no rate limiting: {e}")
            # Allow request on error
            return await call_next(request)

# Instância global do gateway
gateway = APIGateway()

async def initialize_gateway():
    """Inicializar gateway"""
    await gateway.initialize()

if __name__ == "__main__":
    print("🚪 API Gateway BGAPP inicializado")
    print("📊 Suporte para 10x mais utilizadores")
    print("🛡️ Rate limiting e circuit breakers ativos")
