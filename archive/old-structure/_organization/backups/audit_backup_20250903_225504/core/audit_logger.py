"""
Sistema de Audit Logging Centralizado para BGAPP
Implementa logging de auditoria enterprise com compliance GDPR/RGPD
"""

import json
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Union
from enum import Enum
from pathlib import Path
import logging
import threading
from queue import Queue
import os

from .log_sanitizer import get_log_sanitizer

class AuditEventType(Enum):
    """Tipos de eventos de auditoria"""
    
    # Autenticação e Autorização
    LOGIN_SUCCESS = "auth.login.success"
    LOGIN_FAILED = "auth.login.failed"
    LOGOUT = "auth.logout"
    PASSWORD_CHANGE = "auth.password.change"
    TOKEN_REFRESH = "auth.token.refresh"
    PERMISSION_DENIED = "auth.permission.denied"
    
    # Gestão de Utilizadores
    USER_CREATED = "user.created"
    USER_UPDATED = "user.updated"
    USER_DELETED = "user.deleted"
    USER_ACTIVATED = "user.activated"
    USER_DEACTIVATED = "user.deactivated"
    
    # Gestão de Dados
    DATA_ACCESS = "data.access"
    DATA_EXPORT = "data.export"
    DATA_DELETE = "data.delete"
    DATA_MODIFY = "data.modify"
    DATA_IMPORT = "data.import"
    
    # Sistema e Configuração
    CONFIG_CHANGE = "system.config.change"
    SYSTEM_START = "system.start"
    SYSTEM_STOP = "system.stop"
    BACKUP_CREATED = "system.backup.created"
    BACKUP_RESTORED = "system.backup.restored"
    
    # Segurança
    SECURITY_VIOLATION = "security.violation"
    INTRUSION_ATTEMPT = "security.intrusion"
    CSRF_BLOCKED = "security.csrf.blocked"
    CORS_VIOLATION = "security.cors.violation"
    RATE_LIMIT_EXCEEDED = "security.rate_limit.exceeded"
    
    # API e Integrações
    API_ACCESS = "api.access"
    API_ERROR = "api.error"
    EXTERNAL_INTEGRATION = "integration.external"
    
    # Compliance e Privacidade
    GDPR_REQUEST = "compliance.gdpr.request"
    DATA_RETENTION = "compliance.data.retention"
    PRIVACY_VIOLATION = "compliance.privacy.violation"

class AuditSeverity(Enum):
    """Níveis de severidade de auditoria"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class AuditEvent:
    """Evento de auditoria estruturado"""
    
    def __init__(self, 
                 event_type: AuditEventType,
                 severity: AuditSeverity = AuditSeverity.INFO,
                 user_id: Optional[str] = None,
                 session_id: Optional[str] = None,
                 ip_address: Optional[str] = None,
                 user_agent: Optional[str] = None,
                 resource: Optional[str] = None,
                 action: Optional[str] = None,
                 details: Optional[Dict[str, Any]] = None,
                 correlation_id: Optional[str] = None):
        
        self.event_id = str(uuid.uuid4())
        self.timestamp = datetime.now(timezone.utc)
        self.event_type = event_type
        self.severity = severity
        self.user_id = user_id
        self.session_id = session_id
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.resource = resource
        self.action = action
        self.details = details or {}
        self.correlation_id = correlation_id or str(uuid.uuid4())
        
    def to_dict(self) -> Dict[str, Any]:
        """Converter evento para dicionário"""
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp.isoformat(),
            "event_type": self.event_type.value,
            "severity": self.severity.value,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "resource": self.resource,
            "action": self.action,
            "details": self.details,
            "correlation_id": self.correlation_id,
            "system": "BGAPP",
            "version": "1.2.0"
        }
    
    def to_json(self) -> str:
        """Converter evento para JSON"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=None)

class AuditLogger:
    """Logger de auditoria centralizado"""
    
    def __init__(self, 
                 audit_file: str = "logs/audit.log",
                 max_file_size: int = 100 * 1024 * 1024,  # 100MB
                 backup_count: int = 10,
                 enable_console: bool = False,
                 enable_sanitization: bool = True):
        
        self.audit_file = Path(audit_file)
        self.max_file_size = max_file_size
        self.backup_count = backup_count
        self.enable_console = enable_console
        self.enable_sanitization = enable_sanitization
        
        # Criar diretório se não existir
        self.audit_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Configurar sanitizador
        self.sanitizer = get_log_sanitizer() if enable_sanitization else None
        
        # Configurar logger interno
        self._setup_logger()
        
        # Queue para processamento assíncrono
        self._queue = Queue()
        self._stop_event = threading.Event()
        self._worker_thread = threading.Thread(target=self._worker, daemon=True)
        self._worker_thread.start()
        
        # Estatísticas
        self._stats = {
            "events_logged": 0,
            "events_by_type": {},
            "events_by_severity": {},
            "start_time": datetime.now(timezone.utc)
        }
        
    def _setup_logger(self):
        """Configurar logger interno"""
        self.logger = logging.getLogger("bgapp.audit")
        self.logger.setLevel(logging.INFO)
        
        # Remover handlers existentes
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)
        
        # Handler para arquivo com rotação
        from logging.handlers import RotatingFileHandler
        file_handler = RotatingFileHandler(
            self.audit_file,
            maxBytes=self.max_file_size,
            backupCount=self.backup_count,
            encoding='utf-8'
        )
        
        # Formatter JSON
        formatter = logging.Formatter('%(message)s')
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
        
        # Handler para console (se habilitado)
        if self.enable_console:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            self.logger.addHandler(console_handler)
    
    def _worker(self):
        """Worker thread para processamento assíncrono"""
        while not self._stop_event.is_set():
            try:
                # Aguardar evento na queue (timeout para permitir shutdown)
                event = self._queue.get(timeout=1.0)
                if event is None:  # Sinal de shutdown
                    break
                
                self._write_event(event)
                self._queue.task_done()
                
            except:
                continue  # Timeout ou erro - continuar
    
    def _write_event(self, event: AuditEvent):
        """Escrever evento no log"""
        try:
            # Converter para dicionário
            event_dict = event.to_dict()
            
            # Sanitizar se habilitado
            if self.sanitizer:
                event_dict = self.sanitizer.sanitize_dict(event_dict)
            
            # Escrever no log
            self.logger.info(json.dumps(event_dict, ensure_ascii=False))
            
            # Atualizar estatísticas
            self._update_stats(event)
            
        except Exception as e:
            # Log de erro interno (não deve falhar auditoria)
            self.logger.error(f"Erro ao escrever evento de auditoria: {e}")
    
    def _update_stats(self, event: AuditEvent):
        """Atualizar estatísticas"""
        self._stats["events_logged"] += 1
        
        # Por tipo
        event_type = event.event_type.value
        self._stats["events_by_type"][event_type] = \
            self._stats["events_by_type"].get(event_type, 0) + 1
        
        # Por severidade
        severity = event.severity.value
        self._stats["events_by_severity"][severity] = \
            self._stats["events_by_severity"].get(severity, 0) + 1
    
    def log_event(self, event: AuditEvent):
        """Registrar evento de auditoria"""
        try:
            self._queue.put(event, timeout=1.0)
        except:
            # Se queue estiver cheia, escrever diretamente (não perder evento)
            self._write_event(event)
    
    def log(self, 
            event_type: AuditEventType,
            severity: AuditSeverity = AuditSeverity.INFO,
            user_id: Optional[str] = None,
            session_id: Optional[str] = None,
            ip_address: Optional[str] = None,
            user_agent: Optional[str] = None,
            resource: Optional[str] = None,
            action: Optional[str] = None,
            details: Optional[Dict[str, Any]] = None,
            correlation_id: Optional[str] = None):
        """Registrar evento de auditoria (método conveniente)"""
        
        event = AuditEvent(
            event_type=event_type,
            severity=severity,
            user_id=user_id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            resource=resource,
            action=action,
            details=details,
            correlation_id=correlation_id
        )
        
        self.log_event(event)
    
    def get_stats(self) -> Dict[str, Any]:
        """Obter estatísticas de auditoria"""
        uptime = datetime.now(timezone.utc) - self._stats["start_time"]
        return {
            **self._stats,
            "uptime_seconds": uptime.total_seconds(),
            "queue_size": self._queue.qsize(),
            "audit_file": str(self.audit_file),
            "file_size": self.audit_file.stat().st_size if self.audit_file.exists() else 0
        }
    
    def search_events(self, 
                     event_type: Optional[AuditEventType] = None,
                     severity: Optional[AuditSeverity] = None,
                     user_id: Optional[str] = None,
                     start_time: Optional[datetime] = None,
                     end_time: Optional[datetime] = None,
                     limit: int = 100) -> List[Dict[str, Any]]:
        """Pesquisar eventos de auditoria"""
        
        events = []
        if not self.audit_file.exists():
            return events
        
        try:
            with open(self.audit_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if len(events) >= limit:
                        break
                    
                    try:
                        event_data = json.loads(line.strip())
                        
                        # Filtrar por critérios
                        if event_type and event_data.get("event_type") != event_type.value:
                            continue
                        
                        if severity and event_data.get("severity") != severity.value:
                            continue
                        
                        if user_id and event_data.get("user_id") != user_id:
                            continue
                        
                        if start_time:
                            event_time = datetime.fromisoformat(event_data.get("timestamp"))
                            if event_time < start_time:
                                continue
                        
                        if end_time:
                            event_time = datetime.fromisoformat(event_data.get("timestamp"))
                            if event_time > end_time:
                                continue
                        
                        events.append(event_data)
                        
                    except (json.JSONDecodeError, ValueError):
                        continue
                        
        except Exception as e:
            self.logger.error(f"Erro ao pesquisar eventos: {e}")
        
        return events
    
    def shutdown(self):
        """Shutdown graceful do audit logger"""
        # Parar worker thread
        self._stop_event.set()
        self._queue.put(None)  # Sinal de shutdown
        
        # Aguardar worker terminar
        if self._worker_thread.is_alive():
            self._worker_thread.join(timeout=5.0)
        
        # Processar eventos restantes na queue
        while not self._queue.empty():
            try:
                event = self._queue.get_nowait()
                if event:
                    self._write_event(event)
            except:
                break

# Instância global
_audit_logger = None
_audit_lock = threading.Lock()

def get_audit_logger() -> AuditLogger:
    """Obter instância global do audit logger"""
    global _audit_logger
    
    if _audit_logger is None:
        with _audit_lock:
            if _audit_logger is None:
                _audit_logger = AuditLogger()
    
    return _audit_logger

def audit_log(event_type: AuditEventType, **kwargs):
    """Função conveniente para audit logging"""
    logger = get_audit_logger()
    logger.log(event_type, **kwargs)

# Context manager para correlação de eventos
class AuditContext:
    """Context manager para correlacionar eventos de auditoria"""
    
    def __init__(self, correlation_id: Optional[str] = None):
        self.correlation_id = correlation_id or str(uuid.uuid4())
        self._original_correlation_id = None
    
    def __enter__(self):
        # TODO: Implementar contexto thread-local se necessário
        return self.correlation_id
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # TODO: Restaurar contexto anterior se necessário
        pass

if __name__ == "__main__":
    # Teste do sistema de auditoria
    print("🔍 Teste do Sistema de Audit Logging")
    print("=" * 50)
    
    # Criar audit logger
    audit_logger = AuditLogger(
        audit_file="test_audit.log",
        enable_console=True
    )
    
    # Testar diferentes tipos de eventos
    test_events = [
        (AuditEventType.LOGIN_SUCCESS, AuditSeverity.INFO, "user123", "Login bem-sucedido"),
        (AuditEventType.LOGIN_FAILED, AuditSeverity.WARNING, None, "Tentativa de login falhada"),
        (AuditEventType.SECURITY_VIOLATION, AuditSeverity.ERROR, "user456", "CSRF bloqueado"),
        (AuditEventType.DATA_ACCESS, AuditSeverity.INFO, "user789", "Acesso a dados sensíveis"),
    ]
    
    print("\n📝 Registrando eventos de teste...")
    for event_type, severity, user_id, description in test_events:
        audit_logger.log(
            event_type=event_type,
            severity=severity,
            user_id=user_id,
            ip_address="127.0.0.1",
            resource="/api/test",
            action="test",
            details={"description": description}
        )
    
    # Aguardar processamento
    time.sleep(1)
    
    # Mostrar estatísticas
    print("\n📊 Estatísticas:")
    stats = audit_logger.get_stats()
    print(f"  Eventos registrados: {stats['events_logged']}")
    print(f"  Por severidade: {stats['events_by_severity']}")
    
    # Pesquisar eventos
    print("\n🔍 Pesquisando eventos de login...")
    login_events = audit_logger.search_events(
        event_type=AuditEventType.LOGIN_SUCCESS,
        limit=10
    )
    print(f"  Encontrados: {len(login_events)} eventos")
    
    # Shutdown
    audit_logger.shutdown()
    
    # Cleanup
    import os
    if os.path.exists("test_audit.log"):
        os.remove("test_audit.log")
    
    print("\n✅ Teste concluído!")
