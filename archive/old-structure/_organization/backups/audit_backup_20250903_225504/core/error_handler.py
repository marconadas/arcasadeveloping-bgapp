#!/usr/bin/env python3
"""
Sistema robusto de tratamento de erros para BGAPP
Inclui retry automático, fallbacks graceful e circuit breaker pattern
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, Optional, Union
from functools import wraps
import traceback

from fastapi import HTTPException, status
from pydantic import BaseModel


class ErrorSeverity(Enum):
    """Níveis de severidade de erro"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CircuitBreakerState(Enum):
    """Estados do Circuit Breaker"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, requests rejected
    HALF_OPEN = "half_open"  # Testing if service recovered


class ErrorInfo(BaseModel):
    """Informações detalhadas do erro"""
    error_type: str
    message: str
    severity: ErrorSeverity
    timestamp: datetime
    traceback: Optional[str] = None
    context: Dict[str, Any] = {}
    retry_count: int = 0
    max_retries: int = 3


class CircuitBreakerConfig(BaseModel):
    """Configuração do Circuit Breaker"""
    failure_threshold: int = 5
    recovery_timeout: int = 60  # seconds
    expected_exception: type = Exception


class CircuitBreaker:
    """Implementação do Circuit Breaker Pattern"""
    
    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitBreakerState.CLOSED
        
    def can_execute(self) -> bool:
        """Verifica se pode executar a operação"""
        if self.state == CircuitBreakerState.CLOSED:
            return True
            
        if self.state == CircuitBreakerState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitBreakerState.HALF_OPEN
                return True
            return False
            
        # HALF_OPEN state
        return True
    
    def _should_attempt_reset(self) -> bool:
        """Verifica se deve tentar resetar o circuit breaker"""
        if self.last_failure_time is None:
            return True
            
        return (time.time() - self.last_failure_time) >= self.config.recovery_timeout
    
    def record_success(self):
        """Registra sucesso na operação"""
        self.failure_count = 0
        self.state = CircuitBreakerState.CLOSED
        
    def record_failure(self):
        """Registra falha na operação"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.config.failure_threshold:
            self.state = CircuitBreakerState.OPEN


class ErrorHandler:
    """Sistema centralizado de tratamento de erros"""
    
    def __init__(self):
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.error_history: list = []
        self.max_history = 1000
        self.logger = logging.getLogger(__name__)
        
    def get_circuit_breaker(self, service_name: str) -> CircuitBreaker:
        """Obtém ou cria circuit breaker para serviço"""
        if service_name not in self.circuit_breakers:
            config = CircuitBreakerConfig()
            self.circuit_breakers[service_name] = CircuitBreaker(config)
        return self.circuit_breakers[service_name]
    
    def log_error(self, error_info: ErrorInfo):
        """Registra erro no histórico"""
        self.error_history.append(error_info)
        
        # Manter apenas os últimos erros
        if len(self.error_history) > self.max_history:
            self.error_history = self.error_history[-self.max_history:]
            
        # Log baseado na severidade
        if error_info.severity == ErrorSeverity.CRITICAL:
            self.logger.critical(f"CRITICAL ERROR: {error_info.message}")
        elif error_info.severity == ErrorSeverity.HIGH:
            self.logger.error(f"HIGH ERROR: {error_info.message}")
        elif error_info.severity == ErrorSeverity.MEDIUM:
            self.logger.warning(f"MEDIUM ERROR: {error_info.message}")
        else:
            self.logger.info(f"LOW ERROR: {error_info.message}")
    
    async def execute_with_retry(
        self,
        func: Callable,
        service_name: str,
        max_retries: int = 3,
        backoff_factor: float = 1.0,
        fallback_func: Optional[Callable] = None,
        *args,
        **kwargs
    ) -> Any:
        """
        Executa função com retry automático e circuit breaker
        
        Args:
            func: Função a ser executada
            service_name: Nome do serviço (para circuit breaker)
            max_retries: Número máximo de tentativas
            backoff_factor: Fator de backoff exponencial
            fallback_func: Função de fallback em caso de falha
        """
        circuit_breaker = self.get_circuit_breaker(service_name)
        
        # Verificar circuit breaker
        if not circuit_breaker.can_execute():
            error_info = ErrorInfo(
                error_type="CircuitBreakerOpen",
                message=f"Circuit breaker open for service {service_name}",
                severity=ErrorSeverity.HIGH,
                timestamp=datetime.now(),
                context={"service": service_name}
            )
            self.log_error(error_info)
            
            if fallback_func:
                return await self._execute_fallback(fallback_func, *args, **kwargs)
            
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Service {service_name} temporarily unavailable"
            )
        
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                # Executar função
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                
                # Sucesso - resetar circuit breaker
                circuit_breaker.record_success()
                
                if attempt > 0:
                    self.logger.info(f"Success on attempt {attempt + 1} for {service_name}")
                
                return result
                
            except Exception as e:
                last_exception = e
                
                error_info = ErrorInfo(
                    error_type=type(e).__name__,
                    message=str(e),
                    severity=self._determine_severity(e),
                    timestamp=datetime.now(),
                    traceback=traceback.format_exc(),
                    context={
                        "service": service_name,
                        "attempt": attempt + 1,
                        "max_retries": max_retries
                    },
                    retry_count=attempt,
                    max_retries=max_retries
                )
                
                self.log_error(error_info)
                
                # Se é a última tentativa, registrar falha no circuit breaker
                if attempt == max_retries:
                    circuit_breaker.record_failure()
                    break
                
                # Calcular delay para próxima tentativa
                delay = backoff_factor * (2 ** attempt)
                self.logger.info(f"Retrying {service_name} in {delay}s (attempt {attempt + 1}/{max_retries})")
                
                await asyncio.sleep(delay)
        
        # Todas as tentativas falharam
        if fallback_func:
            try:
                return await self._execute_fallback(fallback_func, *args, **kwargs)
            except Exception as fallback_error:
                self.logger.error(f"Fallback also failed for {service_name}: {fallback_error}")
        
        # Lançar última exceção
        if isinstance(last_exception, HTTPException):
            raise last_exception
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Service {service_name} failed after {max_retries} retries: {str(last_exception)}"
        )
    
    async def _execute_fallback(self, fallback_func: Callable, *args, **kwargs) -> Any:
        """Executa função de fallback"""
        if asyncio.iscoroutinefunction(fallback_func):
            return await fallback_func(*args, **kwargs)
        else:
            return fallback_func(*args, **kwargs)
    
    def _determine_severity(self, exception: Exception) -> ErrorSeverity:
        """Determina severidade do erro"""
        if isinstance(exception, HTTPException):
            if exception.status_code >= 500:
                return ErrorSeverity.HIGH
            elif exception.status_code >= 400:
                return ErrorSeverity.MEDIUM
            else:
                return ErrorSeverity.LOW
        
        if isinstance(exception, (ConnectionError, TimeoutError)):
            return ErrorSeverity.HIGH
        
        if isinstance(exception, ValueError):
            return ErrorSeverity.MEDIUM
        
        return ErrorSeverity.MEDIUM
    
    def get_service_health(self) -> Dict[str, Any]:
        """Obtém saúde dos serviços"""
        health = {}
        
        for service_name, circuit_breaker in self.circuit_breakers.items():
            health[service_name] = {
                "state": circuit_breaker.state.value,
                "failure_count": circuit_breaker.failure_count,
                "last_failure": circuit_breaker.last_failure_time,
                "healthy": circuit_breaker.state == CircuitBreakerState.CLOSED
            }
        
        return health
    
    def get_error_statistics(self) -> Dict[str, Any]:
        """Obtém estatísticas de erros"""
        if not self.error_history:
            return {"total_errors": 0}
        
        recent_errors = [
            e for e in self.error_history 
            if (datetime.now() - e.timestamp).total_seconds() < 3600  # última hora
        ]
        
        severity_counts = {}
        for error in recent_errors:
            severity = error.severity.value
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        return {
            "total_errors": len(self.error_history),
            "recent_errors": len(recent_errors),
            "severity_breakdown": severity_counts,
            "most_common_errors": self._get_most_common_errors(recent_errors)
        }
    
    def _get_most_common_errors(self, errors: list) -> Dict[str, int]:
        """Obtém erros mais comuns"""
        error_counts = {}
        for error in errors:
            error_type = error.error_type
            error_counts[error_type] = error_counts.get(error_type, 0) + 1
        
        # Retornar top 5
        sorted_errors = sorted(error_counts.items(), key=lambda x: x[1], reverse=True)
        return dict(sorted_errors[:5])


# Instância global do error handler
error_handler = ErrorHandler()


def with_error_handling(
    service_name: str,
    max_retries: int = 3,
    backoff_factor: float = 1.0,
    fallback_func: Optional[Callable] = None
):
    """
    Decorator para adicionar tratamento de erro automático
    
    Usage:
        @with_error_handling("database", max_retries=3)
        async def get_data():
            # função que pode falhar
            pass
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await error_handler.execute_with_retry(
                func=func,
                service_name=service_name,
                max_retries=max_retries,
                backoff_factor=backoff_factor,
                fallback_func=fallback_func,
                *args,
                **kwargs
            )
        return wrapper
    return decorator


def create_fallback_response(message: str = "Serviço temporariamente indisponível") -> Dict[str, Any]:
    """Cria resposta de fallback padrão"""
    return {
        "error": True,
        "message": message,
        "fallback": True,
        "timestamp": datetime.now().isoformat(),
        "data": None
    }
