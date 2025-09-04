"""
Middleware CORS seguro para BGAPP
Implementa validação rigorosa de origens e métodos
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import time

from ..core.cors_config import get_cors_config
from ..core.logging_config import get_logger

logger = get_logger(__name__)

class SecureCORSMiddleware(BaseHTTPMiddleware):
    """Middleware CORS seguro com validação rigorosa"""
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.cors_config = get_cors_config()
        logger.info("Middleware CORS seguro inicializado")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Processar request com validação CORS"""
        start_time = time.time()
        
        # Obter origem do request
        origin = request.headers.get("origin")
        method = request.method
        
        # Log do request para auditoria
        logger.info(
            "cors_request",
            method=method,
            origin=origin,
            path=request.url.path,
            user_agent=request.headers.get("user-agent", "unknown")[:100]
        )
        
        # Validar preflight requests (OPTIONS)
        if method == "OPTIONS":
            return await self._handle_preflight(request, origin)
        
        # Validar origem para requests normais
        if origin and not self.cors_config.is_origin_allowed(origin):
            logger.security_event(
                "cors_origin_blocked",
                origin=origin,
                method=method,
                path=request.url.path,
                ip=request.client.host if request.client else "unknown"
            )
            
            return JSONResponse(
                status_code=403,
                content={"error": "Origin não permitida", "code": "CORS_ORIGIN_FORBIDDEN"},
                headers={"X-Request-ID": str(time.time())}
            )
        
        # Processar request normal
        response = await call_next(request)
        
        # Adicionar headers CORS à resposta
        if origin and self.cors_config.is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = str(self.cors_config.allow_credentials()).lower()
            
            # Headers expostos
            exposed_headers = ", ".join(self.cors_config.get_exposed_headers())
            if exposed_headers:
                response.headers["Access-Control-Expose-Headers"] = exposed_headers
        
        # Log da resposta
        duration = time.time() - start_time
        logger.performance_event(
            "cors_request_processed",
            duration=duration,
            status_code=response.status_code,
            origin=origin
        )
        
        return response
    
    async def _handle_preflight(self, request: Request, origin: str) -> Response:
        """Processar preflight request (OPTIONS)"""
        
        # Verificar origem
        if not origin or not self.cors_config.is_origin_allowed(origin):
            logger.security_event(
                "cors_preflight_blocked",
                origin=origin,
                ip=request.client.host if request.client else "unknown"
            )
            
            return Response(status_code=403)
        
        # Verificar método solicitado
        requested_method = request.headers.get("access-control-request-method")
        if requested_method and requested_method not in self.cors_config.get_allowed_methods():
            logger.security_event(
                "cors_method_blocked",
                origin=origin,
                method=requested_method
            )
            
            return Response(status_code=405)
        
        # Verificar headers solicitados
        requested_headers = request.headers.get("access-control-request-headers", "")
        if requested_headers:
            headers_list = [h.strip() for h in requested_headers.split(",")]
            allowed_headers = [h.lower() for h in self.cors_config.get_allowed_headers()]
            
            for header in headers_list:
                if header.lower() not in allowed_headers:
                    logger.security_event(
                        "cors_header_blocked",
                        origin=origin,
                        header=header
                    )
                    
                    return Response(status_code=403)
        
        # Criar resposta preflight
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": ", ".join(self.cors_config.get_allowed_methods()),
            "Access-Control-Allow-Headers": ", ".join(self.cors_config.get_allowed_headers()),
            "Access-Control-Max-Age": str(self.cors_config.get_max_age()),
            "Access-Control-Allow-Credentials": str(self.cors_config.allow_credentials()).lower()
        }
        
        logger.info(
            "cors_preflight_success",
            origin=origin,
            method=requested_method
        )
        
        return Response(status_code=204, headers=headers)

def add_cors_middleware(app: FastAPI) -> None:
    """Adicionar middleware CORS seguro à aplicação"""
    
    # Adicionar middleware customizado
    app.add_middleware(SecureCORSMiddleware)
    
    logger.info("Middleware CORS seguro adicionado à aplicação")

def add_fallback_cors_middleware(app: FastAPI) -> None:
    """Adicionar middleware CORS do FastAPI como fallback (desenvolvimento)"""
    
    cors_config = get_cors_config()
    config = cors_config.get_cors_config()
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config["allow_origins"],
        allow_credentials=config["allow_credentials"],
        allow_methods=config["allow_methods"],
        allow_headers=config["allow_headers"],
        expose_headers=config["expose_headers"],
        max_age=config["max_age"]
    )
    
    logger.info("Middleware CORS fallback adicionado à aplicação")

if __name__ == "__main__":
    # Teste do middleware
    from fastapi import FastAPI
    
    app = FastAPI()
    add_cors_middleware(app)
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "CORS teste"}
    
    print("✅ Middleware CORS configurado para teste")
    print("🌐 Execute: uvicorn __main__:app --reload para testar")
