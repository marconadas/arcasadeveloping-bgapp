"""
Production-Grade Logging System - Silicon Valley Standard
Sistema de logging inspirado em práticas do Netflix, Uber e Airbnb
"""

import logging
import sys
import json
import traceback
from datetime import datetime
from typing import Any, Dict, Optional, Union
from enum import Enum
from pathlib import Path
import os
from contextlib import contextmanager
import threading
import queue
import atexit

# Configuração de cores para terminal
class Colors:
    """ANSI color codes para output colorido"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    
    # Cores por nível
    DEBUG = '\033[36m'      # Cyan
    INFO = '\033[32m'       # Green
    WARNING = '\033[33m'    # Yellow
    ERROR = '\033[31m'      # Red
    CRITICAL = '\033[35m'   # Magenta
    
    # Cores especiais
    TIMESTAMP = '\033[90m'  # Gray
    CONTEXT = '\033[34m'    # Blue
    SUCCESS = '\033[92m'    # Bright Green


class LogLevel(Enum):
    """Níveis de log customizados"""
    TRACE = 5
    DEBUG = 10
    INFO = 20
    SUCCESS = 25
    WARNING = 30
    ERROR = 40
    CRITICAL = 50
    FATAL = 60


class StructuredFormatter(logging.Formatter):
    """
    Formatter para logs estruturados (JSON)
    Usado em produção para facilitar análise com ELK Stack, Datadog, etc.
    """
    
    def format(self, record):
        log_obj = {
            '@timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'thread': record.thread,
            'thread_name': record.threadName,
            'process': record.process,
        }
        
        # Adicionar contexto extra se disponível
        if hasattr(record, 'context'):
            log_obj['context'] = record.context
        
        # Adicionar stack trace se for erro
        if record.exc_info:
            log_obj['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }
        
        # Adicionar campos customizados
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'created', 'filename', 
                          'funcName', 'levelname', 'levelno', 'lineno', 
                          'module', 'msecs', 'message', 'pathname', 'process',
                          'processName', 'relativeCreated', 'thread', 'threadName',
                          'exc_info', 'exc_text', 'stack_info']:
                log_obj[key] = value
        
        return json.dumps(log_obj, ensure_ascii=False)


class ColoredFormatter(logging.Formatter):
    """
    Formatter colorido para desenvolvimento
    Torna logs mais legíveis no terminal
    """
    
    LEVEL_COLORS = {
        'TRACE': Colors.DEBUG,
        'DEBUG': Colors.DEBUG,
        'INFO': Colors.INFO,
        'SUCCESS': Colors.SUCCESS,
        'WARNING': Colors.WARNING,
        'ERROR': Colors.ERROR,
        'CRITICAL': Colors.CRITICAL,
        'FATAL': Colors.CRITICAL + Colors.BOLD,
    }
    
    def format(self, record):
        # Timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime('%Y-%m-%d %H:%M:%S')
        
        # Level com cor
        level_color = self.LEVEL_COLORS.get(record.levelname, Colors.RESET)
        level = f"{level_color}{record.levelname:8}{Colors.RESET}"
        
        # Logger name
        logger_name = f"{Colors.CONTEXT}[{record.name}]{Colors.RESET}"
        
        # Location
        location = f"{Colors.TIMESTAMP}{record.filename}:{record.lineno}{Colors.RESET}"
        
        # Message
        message = record.getMessage()
        
        # Construir log line
        parts = [
            f"{Colors.TIMESTAMP}{timestamp}{Colors.RESET}",
            level,
            logger_name,
            location,
            message
        ]
        
        formatted = " | ".join(parts)
        
        # Adicionar exception se houver
        if record.exc_info:
            formatted += f"\n{Colors.ERROR}{self.formatException(record.exc_info)}{Colors.RESET}"
        
        return formatted


class AsyncHandler(logging.Handler):
    """
    Handler assíncrono para não bloquear a aplicação com I/O de logs
    Inspirado em práticas do Uber
    """
    
    def __init__(self, handler):
        super().__init__()
        self.handler = handler
        self.queue = queue.Queue(maxsize=10000)
        self.thread = threading.Thread(target=self._worker, daemon=True)
        self.thread.start()
        atexit.register(self.close)
    
    def _worker(self):
        """Worker thread para processar logs"""
        while True:
            try:
                record = self.queue.get(timeout=1)
                if record is None:  # Sinal para parar
                    break
                self.handler.emit(record)
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error in async log handler: {e}", file=sys.stderr)
    
    def emit(self, record):
        """Adiciona log à fila"""
        try:
            self.queue.put_nowait(record)
        except queue.Full:
            # Se a fila estiver cheia, log síncrono como fallback
            self.handler.emit(record)
    
    def close(self):
        """Fecha o handler gracefully"""
        self.queue.put(None)
        self.thread.join(timeout=5)
        self.handler.close()


class BGAPPLogger:
    """
    Logger principal do BGAPP com funcionalidades avançadas
    """
    
    _instances = {}
    _lock = threading.Lock()
    
    def __new__(cls, name: str = "BGAPP"):
        """Singleton por nome de logger"""
        with cls._lock:
            if name not in cls._instances:
                cls._instances[name] = super().__new__(cls)
            return cls._instances[name]
    
    def __init__(self, name: str = "BGAPP"):
        if hasattr(self, '_initialized'):
            return
        
        self.name = name
        self.logger = logging.getLogger(name)
        self.context_stack = []
        self._setup_logger()
        self._initialized = True
    
    def _setup_logger(self):
        """Configura o logger baseado no ambiente"""
        env = os.getenv('ENVIRONMENT', 'development')
        log_level = os.getenv('LOG_LEVEL', 'INFO')
        
        # Limpar handlers existentes
        self.logger.handlers.clear()
        
        # Configurar nível
        self.logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
        
        if env == 'production':
            # Produção: JSON estruturado para arquivo
            self._setup_production_logging()
        else:
            # Desenvolvimento: Colorido no console
            self._setup_development_logging()
        
        # Adicionar handler para erros críticos sempre no stderr
        error_handler = logging.StreamHandler(sys.stderr)
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(error_handler)
    
    def _setup_production_logging(self):
        """Configuração para produção"""
        # Arquivo de log rotativo
        log_dir = Path(os.getenv('LOG_DIR', 'logs'))
        log_dir.mkdir(exist_ok=True)
        
        from logging.handlers import RotatingFileHandler
        
        # Log principal
        main_handler = RotatingFileHandler(
            log_dir / f'{self.name.lower()}.log',
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=10
        )
        main_handler.setFormatter(StructuredFormatter())
        
        # Tornar assíncrono para performance
        async_handler = AsyncHandler(main_handler)
        self.logger.addHandler(async_handler)
        
        # Log de erros separado
        error_handler = RotatingFileHandler(
            log_dir / f'{self.name.lower()}.error.log',
            maxBytes=10 * 1024 * 1024,
            backupCount=10
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(AsyncHandler(error_handler))
    
    def _setup_development_logging(self):
        """Configuração para desenvolvimento"""
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(ColoredFormatter())
        self.logger.addHandler(console_handler)
    
    @contextmanager
    def context(self, **kwargs):
        """
        Context manager para adicionar contexto aos logs
        
        Usage:
            with logger.context(user_id=123, request_id='abc'):
                logger.info("Processing request")
        """
        self.context_stack.append(kwargs)
        try:
            yield
        finally:
            self.context_stack.pop()
    
    def _add_context(self, record):
        """Adiciona contexto ao record"""
        if self.context_stack:
            # Merge todos os contextos
            context = {}
            for ctx in self.context_stack:
                context.update(ctx)
            record.context = context
    
    def trace(self, message: str, **kwargs):
        """Log nível TRACE (mais detalhado que DEBUG)"""
        self._log(LogLevel.TRACE.value, message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        """Log nível DEBUG"""
        self._log(logging.DEBUG, message, **kwargs)
    
    def info(self, message: str, **kwargs):
        """Log nível INFO"""
        self._log(logging.INFO, message, **kwargs)
    
    def success(self, message: str, **kwargs):
        """Log nível SUCCESS (entre INFO e WARNING)"""
        self._log(LogLevel.SUCCESS.value, message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log nível WARNING"""
        self._log(logging.WARNING, message, **kwargs)
    
    def error(self, message: str, exception: Optional[Exception] = None, **kwargs):
        """Log nível ERROR com suporte a exceptions"""
        exc_info = sys.exc_info() if exception else None
        self._log(logging.ERROR, message, exc_info=exc_info, **kwargs)
    
    def critical(self, message: str, exception: Optional[Exception] = None, **kwargs):
        """Log nível CRITICAL"""
        exc_info = sys.exc_info() if exception else None
        self._log(logging.CRITICAL, message, exc_info=exc_info, **kwargs)
    
    def fatal(self, message: str, exception: Optional[Exception] = None, **kwargs):
        """Log nível FATAL (mais crítico que CRITICAL)"""
        exc_info = sys.exc_info() if exception else None
        self._log(LogLevel.FATAL.value, message, exc_info=exc_info, **kwargs)
    
    def _log(self, level: int, message: str, exc_info=None, **kwargs):
        """Método interno para logging"""
        record = self.logger.makeRecord(
            self.logger.name,
            level,
            "(unknown file)",
            0,
            message,
            (),
            exc_info
        )
        
        # Adicionar contexto
        self._add_context(record)
        
        # Adicionar campos extras
        for key, value in kwargs.items():
            setattr(record, key, value)
        
        # Emit
        self.logger.handle(record)
    
    def measure_performance(self, operation: str):
        """
        Decorator para medir performance de funções
        
        Usage:
            @logger.measure_performance("database_query")
            def my_function():
                ...
        """
        def decorator(func):
            def wrapper(*args, **kwargs):
                import time
                start = time.time()
                try:
                    result = func(*args, **kwargs)
                    duration = time.time() - start
                    self.info(f"Performance: {operation}", 
                             duration_ms=duration * 1000,
                             status="success")
                    return result
                except Exception as e:
                    duration = time.time() - start
                    self.error(f"Performance: {operation} failed",
                              exception=e,
                              duration_ms=duration * 1000,
                              status="error")
                    raise
            return wrapper
        return decorator
    
    def audit(self, action: str, user: Optional[str] = None, **details):
        """
        Log de auditoria para ações importantes
        
        Usage:
            logger.audit("user_login", user="john@example.com", ip="192.168.1.1")
        """
        self.info(f"AUDIT: {action}",
                 audit=True,
                 action=action,
                 user=user,
                 **details)


# Instância global padrão
logger = BGAPPLogger("BGAPP")

# Funções de conveniência
def get_logger(name: str) -> BGAPPLogger:
    """Obtém um logger nomeado"""
    return BGAPPLogger(name)

def setup_logging(level: str = "INFO", environment: str = "development"):
    """Setup global do logging"""
    os.environ['LOG_LEVEL'] = level
    os.environ['ENVIRONMENT'] = environment
    
    # Re-setup do logger principal
    global logger
    logger = BGAPPLogger("BGAPP")

# Adicionar níveis customizados ao módulo logging
logging.addLevelName(LogLevel.TRACE.value, "TRACE")
logging.addLevelName(LogLevel.SUCCESS.value, "SUCCESS")
logging.addLevelName(LogLevel.FATAL.value, "FATAL")


if __name__ == "__main__":
    # Demo/Teste
    setup_logging("DEBUG", "development")
    
    logger.trace("This is a trace message")
    logger.debug("Debug message with data", user_id=123, action="test")
    logger.info("Information message")
    logger.success("Operation completed successfully!")
    logger.warning("This is a warning")
    
    with logger.context(request_id="abc-123", user="john@example.com"):
        logger.info("Processing user request")
        logger.audit("data_export", format="csv", records=1000)
    
    try:
        raise ValueError("Test error")
    except Exception as e:
        logger.error("An error occurred", exception=e)
    
    @logger.measure_performance("expensive_operation")
    def slow_function():
        import time
from bgapp.core.logger import logger
        time.sleep(0.1)
        return "done"
    
    result = slow_function()
    logger.info(f"Result: {result}")