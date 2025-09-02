"""
Sistema de logging estruturado para BGAPP
Configuração centralizada de logs com suporte a diferentes formatos e destinos
"""

import logging
import logging.handlers
import sys
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import structlog
from pythonjsonlogger import jsonlogger

from .secure_config import get_settings

settings = get_settings()

# Importar sanitizador de logs
try:
    from .log_sanitizer import create_sanitizing_filter, get_log_sanitizer
    LOG_SANITIZATION_ENABLED = True
except ImportError:
    LOG_SANITIZATION_ENABLED = False

class SecurityFilter(logging.Filter):
    """Filtro para logs de segurança"""
    
    def filter(self, record):
        # Adicionar contexto de segurança
        if hasattr(record, 'username'):
            record.security_event = True
        return True

class PerformanceFilter(logging.Filter):
    """Filtro para logs de performance"""
    
    def filter(self, record):
        # Marcar logs de performance
        if hasattr(record, 'duration') or hasattr(record, 'response_time'):
            record.performance_event = True
        return True

def configure_structlog():
    """Configurar structlog para logging estruturado"""
    
    def add_logger_name(logger, name, event_dict):
        """Adicionar nome do logger"""
        event_dict["logger"] = name
        return event_dict
    
    def add_timestamp(logger, name, event_dict):
        """Adicionar timestamp ISO"""
        event_dict["timestamp"] = datetime.utcnow().isoformat()
        return event_dict
    
    def add_level(logger, name, event_dict):
        """Adicionar nível de log"""
        event_dict["level"] = event_dict.get("level", "info").upper()
        return event_dict
    
    def add_request_id(logger, name, event_dict):
        """Adicionar request ID se disponível"""
        # TODO: Implementar contexto de request
        return event_dict
    
    # Configurar processadores
    processors = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        add_timestamp,
        add_level,
        add_request_id,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]
    
    # Adicionar processador final baseado no formato
    if settings.logging.log_format == "json":
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())
    
    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

def setup_logging():
    """Configurar sistema de logging"""
    
    # Criar diretório de logs
    if settings.logging.log_file:
        log_path = Path(settings.logging.log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Configurar logging básico
    logging.basicConfig(
        level=getattr(logging, settings.logging.log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[]
    )
    
    # Handler para console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    if settings.logging.log_format == "json":
        json_formatter = jsonlogger.JsonFormatter(
            fmt='%(timestamp)s %(level)s %(name)s %(message)s %(user_id)s %(request_id)s',
            datefmt='%Y-%m-%dT%H:%M:%S'
        )
        console_handler.setFormatter(json_formatter)
    else:
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
    
    # Handler para arquivo (se configurado)
    if settings.logging.log_file:
        file_handler = logging.handlers.TimedRotatingFileHandler(
            settings.logging.log_file,
            when='midnight',
            interval=1,
            backupCount=30,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        
        if settings.logging.log_format == "json":
            file_handler.setFormatter(json_formatter)
        else:
            file_handler.setFormatter(console_formatter)
        
        # Adicionar filtros
        if settings.logging.enable_security_logging:
            file_handler.addFilter(SecurityFilter())
        
        if settings.logging.enable_performance_logging:
            file_handler.addFilter(PerformanceFilter())
        
        # Adicionar filtro de sanitização
        if LOG_SANITIZATION_ENABLED:
            sanitizing_filter = create_sanitizing_filter()
            file_handler.addFilter(sanitizing_filter)
            console_handler.addFilter(sanitizing_filter)
        
        logging.getLogger().addHandler(file_handler)
    
    # Adicionar handler de console
    logging.getLogger().addHandler(console_handler)
    
    # Configurar níveis específicos
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    
    # Configurar structlog
    configure_structlog()

class BGAPPLogger:
    """Logger customizado para BGAPP"""
    
    def __init__(self, name: str):
        self.logger = structlog.get_logger(name)
        self.name = name
    
    def info(self, message: str, **kwargs):
        """Log de informação"""
        self.logger.info(message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log de aviso"""
        self.logger.warning(message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Log de erro"""
        self.logger.error(message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        """Log de debug"""
        self.logger.debug(message, **kwargs)
    
    def critical(self, message: str, **kwargs):
        """Log crítico"""
        self.logger.critical(message, **kwargs)
    
    def security_event(self, event: str, **kwargs):
        """Log de evento de segurança"""
        self.logger.warning(
            f"SECURITY_EVENT: {event}",
            event_type="security",
            **kwargs
        )
    
    def performance_event(self, event: str, duration: float, **kwargs):
        """Log de evento de performance"""
        self.logger.info(
            f"PERFORMANCE: {event}",
            event_type="performance",
            duration=duration,
            **kwargs
        )
    
    def api_request(self, method: str, path: str, status_code: int, 
                   duration: float, username: str = None, **kwargs):
        """Log de request API"""
        # Usar hash do utilizador em vez do username
        user_id = None
        if username and LOG_SANITIZATION_ENABLED:
            sanitizer = get_log_sanitizer()
            user_id = sanitizer.create_user_hash(username)
        
        self.logger.info(
            "API_REQUEST",
            event_type="api_request",
            method=method,
            path=path,
            status_code=status_code,
            duration=duration,
            user_id=user_id,
            **kwargs
        )
    
    def database_query(self, query_type: str, table: str = None, 
                      duration: float = None, username: str = None, **kwargs):
        """Log de query de base de dados"""
        # Usar hash do utilizador em vez do username
        user_id = None
        if username and LOG_SANITIZATION_ENABLED:
            sanitizer = get_log_sanitizer()
            user_id = sanitizer.create_user_hash(username)
        
        self.logger.info(
            "DATABASE_QUERY",
            event_type="database_query",
            query_type=query_type,
            table=table,
            duration=duration,
            user_id=user_id,
            **kwargs
        )

def get_logger(name: str) -> BGAPPLogger:
    """Obter logger para um módulo"""
    return BGAPPLogger(name)

# Configurar logging na importação
setup_logging()

# Logger principal
main_logger = get_logger("bgapp")

def log_startup():
    """Log de inicialização da aplicação"""
    main_logger.info(
        "application_startup",
        version="1.1.0",
        environment=settings.environment,
        debug=settings.debug,
        log_level=settings.logging.log_level
    )

def log_shutdown():
    """Log de encerramento da aplicação"""
    main_logger.info("application_shutdown")

# Middleware para logging de requests
class LoggingMiddleware:
    """Middleware para logging automático de requests"""
    
    def __init__(self, app):
        self.app = app
        self.logger = get_logger("middleware")
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        start_time = datetime.utcnow()
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Log da resposta
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                self.logger.api_request(
                    method=scope["method"],
                    path=scope["path"],
                    status_code=message["status"],
                    duration=duration,
                    client=scope.get("client", ["unknown", 0])[0]
                )
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)

if __name__ == "__main__":
    # Teste do sistema de logging
    logger = get_logger("test")
    
    logger.info("Teste de log básico")
    logger.security_event("login_attempt", username="admin", ip="127.0.0.1")
    logger.performance_event("database_query", duration=0.045, table="users")
    logger.api_request("GET", "/api/test", 200, 0.123, username="admin")
    
    print("✅ Sistema de logging configurado e testado")
