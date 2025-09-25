"""
Middleware de segurança para BGAPP
Rate limiting, validação de requests e proteções de segurança
"""

import time
import hashlib
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import ipaddress

from ..core.secure_config import get_settings
from ..core.logging_config import get_logger

settings = get_settings()
logger = get_logger(__name__)

class RateLimiter:
    """Sistema de rate limiting baseado em sliding window"""
    
    def __init__(self):
        self.requests: Dict[str, deque] = defaultdict(deque)
        self.blocked_ips: Dict[str, datetime] = {}
        self.cleanup_interval = 300  # 5 minutos
        self.last_cleanup = time.time()
    
    def _get_client_id(self, request: Request) -> str:
        """Obter identificador único do cliente"""
        # Usar IP + User-Agent como identificador
        client_ip = self._get_real_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        # Hash para privacidade
        client_data = f"{client_ip}:{user_agent}"
        return hashlib.sha256(client_data.encode()).hexdigest()[:16]
    
    def _get_real_ip(self, request: Request) -> str:
        """Obter IP real do cliente (considerando proxies)"""
        # Verificar headers de proxy
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Primeiro IP na lista
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback para IP direto
        if request.client:
            return request.client.host
        
        return "unknown"
    
    def _is_whitelisted(self, ip: str) -> bool:
        """Verificar se IP está na whitelist"""
        whitelisted_ips = [
            "127.0.0.1",
            "::1",
            "localhost"
        ]
        
        # Adicionar redes privadas em desenvolvimento
        if settings.environment == "development":
            private_networks = [
                "10.0.0.0/8",
                "172.16.0.0/12", 
                "192.168.0.0/16"
            ]
            
            try:
                ip_obj = ipaddress.ip_address(ip)
                for network in private_networks:
                    if ip_obj in ipaddress.ip_network(network):
                        return True
            except:
                pass
        
        return ip in whitelisted_ips
    
    def _cleanup_old_requests(self):
        """Limpar requests antigos"""
        if time.time() - self.last_cleanup < self.cleanup_interval:
            return
        
        current_time = time.time()
        window_size = settings.security.rate_limit_window
        
        for client_id in list(self.requests.keys()):
            # Remover requests antigos
            while (self.requests[client_id] and 
                   current_time - self.requests[client_id][0] > window_size):
                self.requests[client_id].popleft()
            
            # Remover clientes sem requests
            if not self.requests[client_id]:
                del self.requests[client_id]
        
        # Limpar IPs bloqueados expirados
        for ip in list(self.blocked_ips.keys()):
            if datetime.now() - self.blocked_ips[ip] > timedelta(hours=1):
                del self.blocked_ips[ip]
                logger.info("ip_unblocked", ip=ip)
        
        self.last_cleanup = current_time
    
    def is_allowed(self, request: Request) -> Tuple[bool, Optional[str]]:
        """Verificar se request é permitido com rate limiting inteligente"""
        if not settings.security.rate_limit_enabled:
            return True, None
        
        client_ip = self._get_real_ip(request)
        
        # Verificar whitelist
        if self._is_whitelisted(client_ip):
            return True, None
        
        # Verificar se IP está bloqueado
        if client_ip in self.blocked_ips:
            time_left = (self.blocked_ips[client_ip] + timedelta(hours=1) - datetime.now()).seconds
            if time_left <= 0:
                # Remove IP da lista de bloqueados se tempo expirou
                del self.blocked_ips[client_ip]
                return True, None
            return False, f"IP bloqueado. Tente novamente em {time_left//60} minutos"
        
        self._cleanup_old_requests()
        
        client_id = self._get_client_id(request)
        current_time = time.time()
        
        # Rate limiting adaptativo baseado no endpoint
        window_size, max_requests = self._get_adaptive_limits(request)
        
        # Adicionar request atual
        self.requests[client_id].append(current_time)
        
        # Contar requests na janela
        window_start = current_time - window_size
        recent_requests = sum(1 for req_time in self.requests[client_id] 
                            if req_time > window_start)
        
        if recent_requests > max_requests:
            # Bloquear IP por comportamento suspeito
            if recent_requests > max_requests * 2:
                self.blocked_ips[client_ip] = datetime.now()
                logger.warning(
                    f"IP blocked for excessive requests: {client_ip} ({recent_requests} requests)"
                )
            
            return False, f"Rate limit exceeded. {recent_requests}/{max_requests} requests in {window_size}s"
        
        return True, None
    
    def _get_adaptive_limits(self, request: Request) -> Tuple[int, int]:
        """Obter limites adaptativos baseados no endpoint"""
        path = request.url.path.lower()
        
        # Endpoints administrativos - limites mais generosos
        if any(admin_path in path for admin_path in ['/admin', '/health', '/metrics']):
            return 60, 200  # 200 requests por minuto
        
        # Health checks - muito permissivo
        if '/health' in path or '/status' in path:
            return 10, 100  # 100 requests por 10 segundos
        
        # APIs de dados - moderado
        if any(api_path in path for api_path in ['/api', '/data', '/query']):
            return 60, 100  # 100 requests por minuto
        
        # Uploads/downloads - mais restritivo
        if any(upload_path in path for upload_path in ['/upload', '/download', '/file']):
            return 300, 10  # 10 requests por 5 minutos
        
        # Autenticação - restritivo
        if any(auth_path in path for auth_path in ['/auth', '/login', '/register']):
            return 300, 5   # 5 requests por 5 minutos
        
        # Default - balanceado
        return getattr(settings.security, 'rate_limit_window', 60), getattr(settings.security, 'rate_limit_requests', 60)

class SecurityHeaders:
    """Middleware para adicionar headers de segurança"""
    
    @staticmethod
    def add_security_headers(response):
        """Adicionar headers de segurança à resposta"""
        headers = {
            # Prevenir clickjacking
            "X-Frame-Options": "SAMEORIGIN",
            
            # Prevenir MIME sniffing
            "X-Content-Type-Options": "nosniff",
            
            # XSS Protection
            "X-XSS-Protection": "1; mode=block",
            
            # Referrer Policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Content Security Policy
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self'; "
                "connect-src 'self'"
            ),
            
            # HTTPS enforcement (apenas em produção)
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains" if settings.environment == "production" else None,
            
            # Cache control para dados sensíveis
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
        
        for header, value in headers.items():
            if value:
                response.headers[header] = value

class SecurityMiddleware:
    """Middleware principal de segurança"""
    
    def __init__(self, app):
        self.app = app
        self.rate_limiter = RateLimiter()
        self.logger = get_logger("security_middleware")
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Verificar rate limiting
        allowed, message = self.rate_limiter.is_allowed(request)
        if not allowed:
            response = JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"error": "Rate limit exceeded", "message": message}
            )
            await response(scope, receive, send)
            return
        
        # Validar request
        validation_error = self._validate_request(request)
        if validation_error:
            response = JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "Invalid request", "message": validation_error}
            )
            await response(scope, receive, send)
            return
        
        # Processar request
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Adicionar headers de segurança
                SecurityHeaders.add_security_headers(message)
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)
    
    def _validate_request(self, request: Request) -> Optional[str]:
        """Validar request para detectar ataques"""
        
        # Verificar tamanho do path
        if len(request.url.path) > 2048:
            self.logger.security_event(
                "suspicious_long_path",
                path_length=len(request.url.path),
                ip=self.rate_limiter._get_real_ip(request)
            )
            return "Path muito longo"
        
        # Verificar caracteres suspeitos no path
        suspicious_patterns = [
            "../", "..\\", ".env", "passwd", "shadow",
            "<script", "javascript:", "vbscript:",
            "union select", "drop table", "insert into"
        ]
        
        path_lower = request.url.path.lower()
        for pattern in suspicious_patterns:
            if pattern in path_lower:
                self.logger.security_event(
                    "suspicious_path_pattern",
                    pattern=pattern,
                    path=request.url.path,
                    ip=self.rate_limiter._get_real_ip(request)
                )
                return f"Padrão suspeito detectado: {pattern}"
        
        # Verificar User-Agent
        user_agent = request.headers.get("user-agent", "")
        if not user_agent or len(user_agent) > 500:
            self.logger.security_event(
                "suspicious_user_agent",
                user_agent=user_agent[:100],
                ip=self.rate_limiter._get_real_ip(request)
            )
            return "User-Agent inválido"
        
        # Verificar headers suspeitos
        suspicious_headers = ["x-forwarded-host", "x-original-url", "x-rewrite-url"]
        for header in suspicious_headers:
            if header in request.headers:
                self.logger.security_event(
                    "suspicious_header",
                    header=header,
                    value=request.headers[header],
                    ip=self.rate_limiter._get_real_ip(request)
                )
        
        return None

class AuthenticationMiddleware:
    """Middleware para logging de autenticação"""
    
    def __init__(self, app):
        self.app = app
        self.logger = get_logger("auth_middleware")
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Log de tentativas de acesso a endpoints protegidos
        if request.url.path.startswith("/auth/") or "Authorization" in request.headers:
            self.logger.info(
                "auth_request",
                path=request.url.path,
                method=request.method,
                ip=request.client.host if request.client else "unknown",
                user_agent=request.headers.get("user-agent", "")[:100]
            )
        
        await self.app(scope, receive, send)

def create_security_middleware(app):
    """Criar e configurar middleware de segurança"""
    
    # Aplicar middlewares na ordem correta
    app = SecurityMiddleware(app)
    app = AuthenticationMiddleware(app)
    
    logger.info("security_middleware_configured", 
               rate_limiting=settings.security.rate_limit_enabled,
               max_requests=settings.security.rate_limit_requests,
               window_minutes=settings.security.rate_limit_window // 60)
    
    return app
