"""
Middleware de proteção CSRF para BGAPP
Implementa Double Submit Cookies e validação de tokens
"""

import secrets
import hmac
import hashlib
import time
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging

from ..core.logging_config import get_logger

logger = get_logger(__name__)

class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """Middleware de proteção CSRF"""
    
    def __init__(self, app, secret_key: str = None, token_lifetime: int = 3600):
        super().__init__(app)
        self.secret_key = secret_key or secrets.token_urlsafe(32)
        self.token_lifetime = token_lifetime  # segundos
        
        # Métodos que requerem proteção CSRF
        self.protected_methods = {"POST", "PUT", "DELETE", "PATCH"}
        
        # Endpoints que não precisam de proteção CSRF
        self.exempt_paths = {
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/login",  # Login inicial não pode ter CSRF
            "/api/public/"  # APIs públicas
        }
        
        # Headers que indicam requests AJAX (mais seguros)
        self.ajax_headers = {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-Token": True,
            "X-API-Key": True
        }
        
        logger.info("Middleware CSRF inicializado")
    
    async def dispatch(self, request: Request, call_next):
        """Processar request com proteção CSRF"""
        
        # Verificar se o endpoint precisa de proteção
        if not self._requires_csrf_protection(request):
            return await call_next(request)
        
        # Para métodos seguros (GET, HEAD, OPTIONS), apenas gerar token
        if request.method not in self.protected_methods:
            response = await call_next(request)
            self._set_csrf_token(response)
            return response
        
        # Para métodos que modificam dados, validar CSRF
        try:
            await self._validate_csrf_token(request)
            response = await call_next(request)
            self._set_csrf_token(response)  # Renovar token
            return response
            
        except HTTPException as e:
            logger.security_event(
                "csrf_validation_failed",
                method=request.method,
                path=request.url.path,
                ip=request.client.host if request.client else "unknown",
                error=str(e.detail)
            )
            
            return JSONResponse(
                status_code=e.status_code,
                content={"error": e.detail, "code": "CSRF_VALIDATION_FAILED"},
                headers={"X-CSRF-Error": "true"}
            )
    
    def _requires_csrf_protection(self, request: Request) -> bool:
        """Verificar se o request precisa de proteção CSRF"""
        
        # Verificar paths isentos
        path = request.url.path
        for exempt_path in self.exempt_paths:
            if path.startswith(exempt_path):
                return False
        
        # Verificar se é request AJAX com headers seguros
        if self._is_safe_ajax_request(request):
            return False
        
        return True
    
    def _is_safe_ajax_request(self, request: Request) -> bool:
        """Verificar se é um request AJAX seguro"""
        
        # Verificar headers AJAX
        for header, expected_value in self.ajax_headers.items():
            if header in request.headers:
                if header == "X-Requested-With" and request.headers[header] == expected_value:
                    return True
                elif header in {"X-CSRF-Token", "X-API-Key"}:
                    return True
        
        # Verificar Content-Type para APIs
        content_type = request.headers.get("content-type", "")
        if content_type.startswith("application/json"):
            # JSON requests são mais seguros contra CSRF básico
            # mas ainda precisamos de validação para ataques sofisticados
            return False
        
        return False
    
    async def _validate_csrf_token(self, request: Request):
        """Validar token CSRF"""
        
        # 1. Obter token do header
        csrf_token = request.headers.get("X-CSRF-Token")
        
        if not csrf_token:
            # 2. Tentar obter do body (form data)
            if request.headers.get("content-type", "").startswith("application/x-www-form-urlencoded"):
                body = await request.body()
                # Parse manual simples para csrf_token
                if b"csrf_token=" in body:
                    csrf_token = body.decode().split("csrf_token=")[1].split("&")[0]
        
        if not csrf_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token CSRF em falta"
            )
        
        # 3. Obter token do cookie
        cookie_token = request.cookies.get("csrf_token")
        
        if not cookie_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cookie CSRF em falta"
            )
        
        # 4. Validar double submit
        if not self._validate_double_submit(csrf_token, cookie_token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token CSRF inválido"
            )
        
        # 5. Validar timestamp (prevenir replay attacks)
        if not self._validate_token_timestamp(csrf_token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token CSRF expirado"
            )
        
        logger.info(
            "csrf_validation_success",
            method=request.method,
            path=request.url.path
        )
    
    def _validate_double_submit(self, header_token: str, cookie_token: str) -> bool:
        """Validar double submit cookies"""
        
        try:
            # Decodificar tokens
            header_data = self._decode_token(header_token)
            cookie_data = self._decode_token(cookie_token)
            
            if not header_data or not cookie_data:
                return False
            
            # Verificar se os valores aleatórios coincidem
            return header_data.get("random") == cookie_data.get("random")
            
        except Exception as e:
            logger.error(f"Erro na validação double submit: {e}")
            return False
    
    def _validate_token_timestamp(self, token: str) -> bool:
        """Validar timestamp do token"""
        
        try:
            token_data = self._decode_token(token)
            if not token_data:
                return False
            
            token_time = token_data.get("timestamp", 0)
            current_time = int(time.time())
            
            # Verificar se o token não expirou
            return (current_time - token_time) <= self.token_lifetime
            
        except Exception as e:
            logger.error(f"Erro na validação timestamp: {e}")
            return False
    
    def _generate_csrf_token(self) -> str:
        """Gerar token CSRF seguro"""
        
        current_time = int(time.time())
        random_value = secrets.token_urlsafe(16)
        
        # Criar payload
        payload = f"{current_time}:{random_value}"
        
        # Criar HMAC
        signature = hmac.new(
            self.secret_key.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Token final: timestamp:random:signature
        token = f"{current_time}:{random_value}:{signature}"
        
        return token
    
    def _decode_token(self, token: str) -> Optional[Dict]:
        """Decodificar e validar token CSRF"""
        
        try:
            parts = token.split(":")
            if len(parts) != 3:
                return None
            
            timestamp, random_value, signature = parts
            
            # Verificar HMAC
            payload = f"{timestamp}:{random_value}"
            expected_signature = hmac.new(
                self.secret_key.encode(),
                payload.encode(),
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature, expected_signature):
                return None
            
            return {
                "timestamp": int(timestamp),
                "random": random_value,
                "signature": signature
            }
            
        except Exception as e:
            logger.error(f"Erro ao decodificar token: {e}")
            return None
    
    def _set_csrf_token(self, response: Response):
        """Definir token CSRF na resposta"""
        
        # Gerar novo token
        csrf_token = self._generate_csrf_token()
        
        # Definir cookie (HttpOnly para segurança)
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            max_age=self.token_lifetime,
            httponly=True,  # Previne acesso via JavaScript
            secure=True,    # Apenas HTTPS (desabilitar em dev se necessário)
            samesite="strict"  # Proteção adicional contra CSRF
        )
        
        # Definir header para JavaScript acessar
        response.headers["X-CSRF-Token"] = csrf_token

class CSRFTokenGenerator:
    """Gerador de tokens CSRF para templates"""
    
    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or secrets.token_urlsafe(32)
    
    def generate_token(self) -> str:
        """Gerar token para uso em templates"""
        current_time = int(time.time())
        random_value = secrets.token_urlsafe(16)
        
        payload = f"{current_time}:{random_value}"
        signature = hmac.new(
            self.secret_key.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return f"{current_time}:{random_value}:{signature}"

def add_csrf_protection(app, secret_key: str = None, token_lifetime: int = 3600):
    """Adicionar proteção CSRF à aplicação"""
    
    middleware = CSRFProtectionMiddleware(
        app,
        secret_key=secret_key,
        token_lifetime=token_lifetime
    )
    
    app.add_middleware(CSRFProtectionMiddleware, 
                      secret_key=secret_key,
                      token_lifetime=token_lifetime)
    
    logger.info("Proteção CSRF adicionada à aplicação")

# Instância global do gerador
csrf_generator = CSRFTokenGenerator()

def get_csrf_token() -> str:
    """Obter token CSRF para uso em templates"""
    return csrf_generator.generate_token()

if __name__ == "__main__":
    # Teste do sistema CSRF
    generator = CSRFTokenGenerator("test-secret-key")
    
    print("🛡️ Teste do Sistema CSRF")
    print("=" * 40)
    
    # Gerar token
    token = generator.generate_token()
    print(f"Token gerado: {token}")
    
    # Simular validação
    middleware = CSRFProtectionMiddleware(None, "test-secret-key")
    token_data = middleware._decode_token(token)
    
    if token_data:
        print(f"✅ Token válido")
        print(f"   Timestamp: {token_data['timestamp']}")
        print(f"   Random: {token_data['random']}")
    else:
        print("❌ Token inválido")
    
    print("\n✅ Teste concluído!")
