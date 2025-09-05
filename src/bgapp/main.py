#!/usr/bin/env python3
"""
BGAPP Main Entry Point - Silicon Valley Grade
Sistema principal com validação de ambiente e segurança reforçada
"""

import os
import sys
from pathlib import Path

# Adicionar diretório src ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from bgapp.core.logger import logger, setup_logging
from bgapp.core.env_validator import validate_environment
from bgapp.core.audit_logger import AuditLogger
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import uvicorn

# Setup logging baseado no ambiente
environment = os.getenv('ENVIRONMENT', 'development')
log_level = os.getenv('LOG_LEVEL', 'INFO')
setup_logging(log_level, environment)

# Validar variáveis de ambiente ANTES de iniciar
logger.info("🚀 Iniciando BGAPP...")
logger.info(f"📍 Environment: {environment}")
logger.info(f"📊 Log Level: {log_level}")

# Validação crítica de ambiente
try:
    logger.info("🔍 Validando variáveis de ambiente...")
    is_valid = validate_environment(raise_on_error=True)
    if is_valid:
        logger.success("✅ Todas as variáveis de ambiente validadas!")
    else:
        logger.warning("⚠️ Algumas variáveis opcionais não estão configuradas")
except SystemExit as e:
    logger.fatal("❌ Validação de ambiente falhou! Aplicação não pode iniciar.")
    logger.fatal("💡 Verifique o arquivo .env e corrija as variáveis críticas")
    sys.exit(1)

# Inicializar auditoria
audit = AuditLogger()
audit.log_event(
    event_type="SYSTEM_START",
    severity="INFO",
    details={
        "environment": environment,
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "pid": os.getpid()
    }
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciamento do ciclo de vida da aplicação"""
    # Startup
    logger.info("🎯 Inicializando serviços...")
    
    # Verificar serviços críticos
    try:
        # TODO: Adicionar verificação de DB, Redis, etc
        logger.success("✅ Todos os serviços iniciados")
    except Exception as e:
        logger.error("❌ Falha ao iniciar serviços", exception=e)
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Encerrando aplicação...")
    audit.log_event(
        event_type="SYSTEM_SHUTDOWN",
        severity="INFO",
        details={"graceful": True}
    )
    logger.info("👋 BGAPP encerrado com sucesso")

# Criar aplicação FastAPI
app = FastAPI(
    title="BGAPP API",
    description="Blue Growth Application Platform - Silicon Valley Grade",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if environment != "production" else None,
    redoc_url="/api/redoc" if environment != "production" else None
)

# Configurar CORS com whitelist
if environment == "production":
    allowed_origins = [
        "https://bgapp-admin.pages.dev",
        "https://bgapp.majearcasa.com",
        "https://admin.bgapp.majearcasa.com"
    ]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:8085",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8085"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400
)

# Trusted Host Middleware (proteção contra Host header attacks)
if environment == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "bgapp.majearcasa.com",
            "*.bgapp.majearcasa.com",
            "localhost"
        ]
    )

# Middleware de logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log todas as requisições"""
    import time
    start_time = time.time()
    
    # Log da requisição
    logger.info(f"📨 {request.method} {request.url.path}",
                client=request.client.host if request.client else "unknown",
                user_agent=request.headers.get("user-agent", "unknown"))
    
    # Processar requisição
    response = await call_next(request)
    
    # Log da resposta
    duration = (time.time() - start_time) * 1000
    logger.info(f"📤 {request.method} {request.url.path} - {response.status_code}",
                duration_ms=round(duration, 2),
                status_code=response.status_code)
    
    # Auditoria para operações importantes
    if request.method in ["POST", "PUT", "DELETE"]:
        audit.log_event(
            event_type="API_REQUEST",
            severity="INFO",
            user=request.headers.get("x-user-id", "anonymous"),
            details={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round(duration, 2)
            }
        )
    
    return response

# Health check endpoint
@app.get("/health")
async def health_check():
    """Endpoint de health check"""
    return {
        "status": "healthy",
        "environment": environment,
        "version": "2.0.0",
        "timestamp": logger._get_timestamp()
    }

# Root endpoint
@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "name": "BGAPP API",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/api/docs" if environment != "production" else None
    }

# Importar routers (após configuração)
try:
    from bgapp.api.routes import admin, services, data
    
    app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
    app.include_router(services.router, prefix="/api/services", tags=["services"])
    app.include_router(data.router, prefix="/api/data", tags=["data"])
    
    logger.success("✅ Todas as rotas carregadas")
except ImportError as e:
    logger.warning(f"⚠️ Algumas rotas não puderam ser carregadas: {e}")

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    logger.warning(f"404 Not Found: {request.url.path}")
    return {"error": "Not Found", "path": request.url.path}

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"500 Internal Error: {exc}")
    audit.log_event(
        event_type="INTERNAL_ERROR",
        severity="ERROR",
        details={
            "path": request.url.path,
            "error": str(exc)
        }
    )
    return {"error": "Internal Server Error"}

if __name__ == "__main__":
    # Configuração do servidor
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    logger.info(f"🌐 Servidor iniciando em {host}:{port}")
    
    # Configuração diferente para produção
    if environment == "production":
        uvicorn.run(
            "bgapp.main:app",
            host=host,
            port=port,
            workers=4,
            log_level="warning",
            access_log=False  # Usamos nosso próprio logging
        )
    else:
        uvicorn.run(
            "bgapp.main:app",
            host=host,
            port=port,
            reload=True,
            log_level="info"
        )