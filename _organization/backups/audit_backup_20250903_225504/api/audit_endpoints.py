"""
Endpoints para consulta de logs de auditoria
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

try:
    from ..core.audit_logger import get_audit_logger, AuditEventType, AuditSeverity
    from ..auth.security import require_admin, User
    AUDIT_AVAILABLE = True
except ImportError:
    AUDIT_AVAILABLE = False

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditEventResponse(BaseModel):
    """Resposta de evento de auditoria"""
    event_id: str
    timestamp: str
    event_type: str
    severity: str
    user_id: Optional[str]
    ip_address: Optional[str]
    resource: Optional[str]
    action: Optional[str]
    details: Dict[str, Any]

class AuditStatsResponse(BaseModel):
    """Resposta de estatísticas de auditoria"""
    events_logged: int
    events_by_type: Dict[str, int]
    events_by_severity: Dict[str, int]
    uptime_seconds: float
    queue_size: int
    audit_file: str
    file_size: int

if AUDIT_AVAILABLE:
    
    @router.get("/events", response_model=List[AuditEventResponse])
    async def get_audit_events(
        current_user: User = Depends(require_admin),
        event_type: Optional[str] = Query(None, description="Filtrar por tipo de evento"),
        severity: Optional[str] = Query(None, description="Filtrar por severidade"),
        user_id: Optional[str] = Query(None, description="Filtrar por usuário"),
        hours: int = Query(24, description="Últimas N horas", ge=1, le=168),  # Max 1 semana
        limit: int = Query(100, description="Limite de eventos", ge=1, le=1000)
    ):
        """Obter eventos de auditoria"""
        
        try:
            audit_logger = get_audit_logger()
            
            # Calcular período
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=hours)
            
            # Converter strings para enums se fornecidos
            event_type_enum = None
            if event_type:
                try:
                    event_type_enum = AuditEventType(event_type)
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Tipo de evento inválido: {event_type}"
                    )
            
            severity_enum = None
            if severity:
                try:
                    severity_enum = AuditSeverity(severity)
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Severidade inválida: {severity}"
                    )
            
            # Buscar eventos
            events = audit_logger.search_events(
                event_type=event_type_enum,
                severity=severity_enum,
                user_id=user_id,
                start_time=start_time,
                end_time=end_time,
                limit=limit
            )
            
            # Converter para response model
            return [
                AuditEventResponse(
                    event_id=event.get("event_id", ""),
                    timestamp=event.get("timestamp", ""),
                    event_type=event.get("event_type", ""),
                    severity=event.get("severity", ""),
                    user_id=event.get("user_id"),
                    ip_address=event.get("ip_address"),
                    resource=event.get("resource"),
                    action=event.get("action"),
                    details=event.get("details", {})
                )
                for event in events
            ]
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao buscar eventos de auditoria: {str(e)}"
            )
    
    @router.get("/stats", response_model=AuditStatsResponse)
    async def get_audit_stats(current_user: User = Depends(require_admin)):
        """Obter estatísticas de auditoria"""
        
        try:
            audit_logger = get_audit_logger()
            stats = audit_logger.get_stats()
            
            return AuditStatsResponse(
                events_logged=stats.get("events_logged", 0),
                events_by_type=stats.get("events_by_type", {}),
                events_by_severity=stats.get("events_by_severity", {}),
                uptime_seconds=stats.get("uptime_seconds", 0),
                queue_size=stats.get("queue_size", 0),
                audit_file=stats.get("audit_file", ""),
                file_size=stats.get("file_size", 0)
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao obter estatísticas: {str(e)}"
            )
    
    @router.get("/event-types")
    async def get_event_types(current_user: User = Depends(require_admin)):
        """Obter tipos de eventos disponíveis"""
        
        return {
            "event_types": [event_type.value for event_type in AuditEventType],
            "severities": [severity.value for severity in AuditSeverity]
        }
    
    @router.post("/test-event")
    async def create_test_event(
        current_user: User = Depends(require_admin),
        event_type: str = "data.access",
        message: str = "Evento de teste"
    ):
        """Criar evento de teste (apenas para desenvolvimento)"""
        
        try:
            # Verificar se é ambiente de desenvolvimento
            import os
            if os.getenv("ENVIRONMENT", "development") == "production":
                raise HTTPException(
                    status_code=403,
                    detail="Eventos de teste não permitidos em produção"
                )
            
            audit_logger = get_audit_logger()
            
            # Converter string para enum
            try:
                event_type_enum = AuditEventType(event_type)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tipo de evento inválido: {event_type}"
                )
            
            # Criar evento de teste
            audit_logger.log(
                event_type=event_type_enum,
                severity=AuditSeverity.INFO,
                user_id=current_user.id,
                ip_address="127.0.0.1",
                resource="/audit/test",
                action="test",
                details={
                    "message": message,
                    "created_by": current_user.username,
                    "test_event": True
                }
            )
            
            return {"message": "Evento de teste criado com sucesso"}
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao criar evento de teste: {str(e)}"
            )

else:
    # Endpoints desabilitados se audit logging não disponível
    
    @router.get("/events")
    async def audit_not_available():
        raise HTTPException(
            status_code=503,
            detail="Sistema de auditoria não disponível"
        )
    
    @router.get("/stats")
    async def stats_not_available():
        raise HTTPException(
            status_code=503,
            detail="Sistema de auditoria não disponível"
        )
    
    @router.get("/event-types")
    async def types_not_available():
        raise HTTPException(
            status_code=503,
            detail="Sistema de auditoria não disponível"
        )

# Função para incluir router na aplicação
def include_audit_router(app):
    """Incluir router de auditoria na aplicação"""
    app.include_router(router)
    
    if AUDIT_AVAILABLE:
        print("✅ Endpoints de auditoria adicionados")
    else:
        print("⚠️ Endpoints de auditoria desabilitados (sistema não disponível)")
