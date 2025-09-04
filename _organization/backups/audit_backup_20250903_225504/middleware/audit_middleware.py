"""
Middleware de Auditoria para BGAPP
Integra audit logging automático em todas as requests
"""

import time
import json
from typing import Optional, Dict, Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

try:
    from ..core.audit_logger import get_audit_logger, AuditEventType, AuditSeverity
    AUDIT_AVAILABLE = True
except ImportError:
    AUDIT_AVAILABLE = False

class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware para audit logging automático"""
    
    def __init__(self, app):
        super().__init__(app)
        self.audit_logger = get_audit_logger() if AUDIT_AVAILABLE else None
        
        # Endpoints que devem ser auditados
        self.audit_paths = {
            "/auth/login": AuditEventType.LOGIN_SUCCESS,
            "/auth/logout": AuditEventType.LOGOUT,
            "/auth/refresh": AuditEventType.TOKEN_REFRESH,
            "/admin/": AuditEventType.DATA_ACCESS,
            "/api/users": AuditEventType.DATA_ACCESS,
            "/api/export": AuditEventType.DATA_EXPORT,
            "/api/config": AuditEventType.CONFIG_CHANGE,
        }
        
        # Métodos que devem ser auditados
        self.audit_methods = {"POST", "PUT", "DELETE", "PATCH"}
        
        # Endpoints sensíveis (sempre auditar)
        self.sensitive_paths = {"/admin", "/api/users", "/auth", "/config"}
        
    async def dispatch(self, request: Request, call_next):
        """Processar request com audit logging"""
        
        if not self.audit_logger:
            return await call_next(request)
        
        start_time = time.time()
        path = request.url.path
        method = request.method
        
        # Determinar se deve auditar
        should_audit = self._should_audit_request(request)
        
        # Obter informações do request
        user_id = self._extract_user_id(request)
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")[:200]  # Limitar tamanho
        
        # Processar request
        try:
            response = await call_next(request)
            duration = time.time() - start_time
            
            # Auditar se necessário
            if should_audit:
                await self._audit_request(
                    request, response, user_id, ip_address, user_agent, duration
                )
            
            return response
            
        except Exception as e:
            # Auditar erro
            if should_audit:
                self._audit_error(
                    request, str(e), user_id, ip_address, user_agent
                )
            raise
    
    def _should_audit_request(self, request: Request) -> bool:
        """Determinar se o request deve ser auditado"""
        path = request.url.path
        method = request.method
        
        # Sempre auditar métodos que modificam dados
        if method in self.audit_methods:
            return True
        
        # Sempre auditar paths sensíveis
        for sensitive_path in self.sensitive_paths:
            if path.startswith(sensitive_path):
                return True
        
        # Auditar paths específicos
        for audit_path in self.audit_paths:
            if path.startswith(audit_path):
                return True
        
        return False
    
    def _extract_user_id(self, request: Request) -> Optional[str]:
        """Extrair user ID do request (hash seguro)"""
        try:
            # Tentar obter do JWT token
            auth_header = request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                # TODO: Decodificar JWT e extrair user_id hasheado
                return "user_from_token"
            
            # Tentar obter de session/cookie
            # TODO: Implementar extração de session
            
            return None
            
        except Exception:
            return None
    
    def _get_client_ip(self, request: Request) -> str:
        """Obter IP do cliente (considerando proxies)"""
        # Verificar headers de proxy
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Pegar primeiro IP (cliente real)
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # IP direto
        if request.client:
            return request.client.host
        
        return "unknown"
    
    async def _audit_request(self, 
                           request: Request, 
                           response: Response, 
                           user_id: Optional[str],
                           ip_address: str,
                           user_agent: str,
                           duration: float):
        """Auditar request processado"""
        
        path = request.url.path
        method = request.method
        status_code = response.status_code
        
        # Determinar tipo de evento
        event_type = self._get_event_type(request, response)
        
        # Determinar severidade
        severity = self._get_severity(request, response)
        
        # Preparar detalhes
        details = {
            "method": method,
            "status_code": status_code,
            "duration_ms": round(duration * 1000, 2),
            "user_agent": user_agent[:100],  # Limitar tamanho
            "query_params": dict(request.query_params) if request.query_params else None,
            "content_length": response.headers.get("content-length"),
        }
        
        # Adicionar detalhes específicos por tipo de endpoint
        if path.startswith("/auth/login"):
            if status_code == 200:
                details["login_result"] = "success"
            else:
                details["login_result"] = "failed"
                event_type = AuditEventType.LOGIN_FAILED
                severity = AuditSeverity.WARNING
        
        elif path.startswith("/admin"):
            details["admin_action"] = True
            if status_code == 403:
                event_type = AuditEventType.PERMISSION_DENIED
                severity = AuditSeverity.WARNING
        
        # Registrar evento
        try:
            self.audit_logger.log(
                event_type=event_type,
                severity=severity,
                user_id=user_id,
                ip_address=ip_address,
                resource=path,
                action=method.lower(),
                details=details
            )
        except Exception as e:
            # Não falhar request por erro de auditoria
            print(f"Erro no audit logging: {e}")
    
    def _audit_error(self, 
                    request: Request, 
                    error: str,
                    user_id: Optional[str],
                    ip_address: str,
                    user_agent: str):
        """Auditar erro no processamento"""
        
        try:
            self.audit_logger.log(
                event_type=AuditEventType.API_ERROR,
                severity=AuditSeverity.ERROR,
                user_id=user_id,
                ip_address=ip_address,
                resource=request.url.path,
                action=request.method.lower(),
                details={
                    "error": error[:200],  # Limitar tamanho
                    "user_agent": user_agent[:100],
                    "query_params": dict(request.query_params) if request.query_params else None
                }
            )
        except Exception:
            # Não falhar por erro de auditoria
            pass
    
    def _get_event_type(self, request: Request, response: Response) -> AuditEventType:
        """Determinar tipo de evento baseado no request/response"""
        
        path = request.url.path
        method = request.method
        status_code = response.status_code
        
        # Mapeamento por path
        for audit_path, event_type in self.audit_paths.items():
            if path.startswith(audit_path):
                return event_type
        
        # Mapeamento por método e status
        if method in {"POST", "PUT", "PATCH"}:
            return AuditEventType.DATA_MODIFY
        elif method == "DELETE":
            return AuditEventType.DATA_DELETE
        elif method == "GET" and path.startswith("/api"):
            return AuditEventType.API_ACCESS
        
        # Default
        return AuditEventType.API_ACCESS
    
    def _get_severity(self, request: Request, response: Response) -> AuditSeverity:
        """Determinar severidade baseada no request/response"""
        
        status_code = response.status_code
        path = request.url.path
        
        # Erros críticos
        if status_code >= 500:
            return AuditSeverity.CRITICAL
        
        # Erros de autenticação/autorização
        elif status_code in {401, 403}:
            return AuditSeverity.WARNING
        
        # Erros de cliente
        elif status_code >= 400:
            return AuditSeverity.WARNING
        
        # Ações administrativas sempre importante
        elif path.startswith("/admin"):
            return AuditSeverity.WARNING
        
        # Sucesso normal
        else:
            return AuditSeverity.INFO

def add_audit_middleware(app):
    """Adicionar middleware de auditoria à aplicação"""
    if AUDIT_AVAILABLE:
        app.add_middleware(AuditMiddleware)
        print("✅ Middleware de auditoria adicionado")
    else:
        print("⚠️ Audit logging não disponível - middleware não adicionado")

# Funções convenientes para audit logging manual
def audit_login_success(user_id: str, ip_address: str, details: Dict[str, Any] = None):
    """Auditar login bem-sucedido"""
    if AUDIT_AVAILABLE:
        logger = get_audit_logger()
        logger.log(
            event_type=AuditEventType.LOGIN_SUCCESS,
            severity=AuditSeverity.INFO,
            user_id=user_id,
            ip_address=ip_address,
            resource="/auth/login",
            action="authenticate",
            details=details
        )

def audit_login_failed(ip_address: str, details: Dict[str, Any] = None):
    """Auditar falha de login"""
    if AUDIT_AVAILABLE:
        logger = get_audit_logger()
        logger.log(
            event_type=AuditEventType.LOGIN_FAILED,
            severity=AuditSeverity.WARNING,
            ip_address=ip_address,
            resource="/auth/login",
            action="authenticate",
            details=details
        )

def audit_security_violation(event_type: str, user_id: Optional[str], ip_address: str, details: Dict[str, Any] = None):
    """Auditar violação de segurança"""
    if AUDIT_AVAILABLE:
        logger = get_audit_logger()
        logger.log(
            event_type=AuditEventType.SECURITY_VIOLATION,
            severity=AuditSeverity.ERROR,
            user_id=user_id,
            ip_address=ip_address,
            resource="/security",
            action="violation",
            details={**(details or {}), "violation_type": event_type}
        )

def audit_data_access(user_id: str, resource: str, ip_address: str, details: Dict[str, Any] = None):
    """Auditar acesso a dados"""
    if AUDIT_AVAILABLE:
        logger = get_audit_logger()
        logger.log(
            event_type=AuditEventType.DATA_ACCESS,
            severity=AuditSeverity.INFO,
            user_id=user_id,
            ip_address=ip_address,
            resource=resource,
            action="access",
            details=details
        )

if __name__ == "__main__":
    print("🔍 Middleware de Auditoria - BGAPP")
    print("Middleware para audit logging automático de requests")
    print("Integra com o sistema de audit logging centralizado")
    
    if AUDIT_AVAILABLE:
        print("✅ Audit logging disponível")
    else:
        print("❌ Audit logging não disponível")
