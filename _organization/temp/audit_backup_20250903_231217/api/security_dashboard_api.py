"""
API Endpoints para Dashboard de Segurança
Fornece dados em tempo real para interface de monitorização
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

try:
    from ..monitoring.security_dashboard import get_security_dashboard, SecurityStatus, AlertLevel
    from ..auth.security import require_admin, User
    DASHBOARD_AVAILABLE = True
except ImportError:
    DASHBOARD_AVAILABLE = False

router = APIRouter(prefix="/security", tags=["security-monitoring"])

class SecurityMetricResponse(BaseModel):
    """Resposta de métrica de segurança"""
    name: str
    value: Any
    status: str
    timestamp: str
    description: str
    threshold: Optional[float] = None
    unit: Optional[str] = None

class SecuritySummaryResponse(BaseModel):
    """Resumo de segurança"""
    overall_score: float
    status: str
    metrics_summary: Dict[str, int]
    active_alerts: int
    critical_alerts: int
    recent_violations: int
    uptime_hours: float
    last_updated: str

class SecurityHealthResponse(BaseModel):
    """Status de saúde da segurança"""
    overall_health: float
    security_score: float
    status: str
    components: Dict[str, bool]
    active_alerts: int
    uptime_hours: float
    last_check: str

class AlertResponse(BaseModel):
    """Resposta de alerta"""
    alert_id: str
    level: str
    title: str
    description: str
    timestamp: str
    source: str
    resolved: bool
    details: Dict[str, Any]

if DASHBOARD_AVAILABLE:
    
    @router.get("/", response_class=HTMLResponse)
    async def security_dashboard_page(current_user: User = Depends(require_admin)):
        """Página do dashboard de segurança"""
        try:
            dashboard_html_path = Path(__file__).parent.parent.parent.parent / "templates" / "security_dashboard.html"
            
            if dashboard_html_path.exists():
                with open(dashboard_html_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                return HTMLResponse(content=html_content)
            else:
                return HTMLResponse(content="""
                    <html><body>
                        <h1>🚨 Dashboard de Segurança</h1>
                        <p>Template não encontrado. Usando versão básica.</p>
                        <script>
                            window.location.href = '/admin-api/security/health';
                        </script>
                    </body></html>
                """)
                
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao carregar dashboard: {str(e)}"
            )
    
    @router.get("/health", response_model=SecurityHealthResponse)
    async def get_security_health(current_user: User = Depends(require_admin)):
        """Obter status de saúde da segurança"""
        try:
            dashboard = get_security_dashboard()
            health_data = dashboard.get_health_status()
            
            return SecurityHealthResponse(**health_data)
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao obter status de saúde: {str(e)}"
            )
    
    @router.get("/summary", response_model=SecuritySummaryResponse)
    async def get_security_summary(current_user: User = Depends(require_admin)):
        """Obter resumo de segurança"""
        try:
            dashboard = get_security_dashboard()
            summary_data = dashboard.get_security_summary()
            
            return SecuritySummaryResponse(**summary_data)
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao obter resumo: {str(e)}"
            )
    
    @router.get("/metrics", response_model=List[SecurityMetricResponse])
    async def get_security_metrics(
        current_user: User = Depends(require_admin),
        category: Optional[str] = Query(None, description="Filtrar por categoria"),
        status: Optional[str] = Query(None, description="Filtrar por status")
    ):
        """Obter métricas de segurança"""
        try:
            dashboard = get_security_dashboard()
            dashboard_data = dashboard.get_dashboard_data()
            
            metrics = dashboard_data['metrics']
            
            # Aplicar filtros
            if category:
                metrics = [m for m in metrics if category.lower() in m['name'].lower()]
            
            if status:
                metrics = [m for m in metrics if m['status'] == status]
            
            return [SecurityMetricResponse(**metric) for metric in metrics]
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao obter métricas: {str(e)}"
            )
    
    @router.get("/alerts", response_model=List[AlertResponse])
    async def get_security_alerts(
        current_user: User = Depends(require_admin),
        level: Optional[str] = Query(None, description="Filtrar por nível"),
        active_only: bool = Query(True, description="Apenas alertas ativos"),
        limit: int = Query(50, description="Limite de alertas", ge=1, le=500)
    ):
        """Obter alertas de segurança"""
        try:
            dashboard = get_security_dashboard()
            
            alerts = dashboard.active_alerts if active_only else \
                    dashboard.active_alerts + list(dashboard.resolved_alerts)
            
            # Aplicar filtros
            if level:
                alerts = [a for a in alerts if a.level.value == level]
            
            # Limitar resultados
            alerts = alerts[-limit:]
            
            return [AlertResponse(**asdict(alert)) for alert in alerts]
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao obter alertas: {str(e)}"
            )
    
    @router.post("/alerts/{alert_id}/resolve")
    async def resolve_alert(
        alert_id: str,
        current_user: User = Depends(require_admin)
    ):
        """Resolver alerta"""
        try:
            dashboard = get_security_dashboard()
            success = dashboard.resolve_alert(alert_id)
            
            if success:
                return {"message": "Alerta resolvido com sucesso", "alert_id": alert_id}
            else:
                raise HTTPException(
                    status_code=404,
                    detail="Alerta não encontrado"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao resolver alerta: {str(e)}"
            )
    
    @router.get("/dashboard")
    async def get_dashboard_data(current_user: User = Depends(require_admin)):
        """Obter dados completos do dashboard"""
        try:
            dashboard = get_security_dashboard()
            return dashboard.get_dashboard_data()
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao obter dados do dashboard: {str(e)}"
            )
    
    @router.get("/export")
    async def export_security_data(
        current_user: User = Depends(require_admin),
        hours: int = Query(24, description="Horas de histórico", ge=1, le=168)
    ):
        """Exportar dados de segurança"""
        try:
            dashboard = get_security_dashboard()
            export_data = dashboard.export_metrics(hours=hours)
            
            return {
                "export_data": export_data,
                "format": "json",
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao exportar dados: {str(e)}"
            )
    
    @router.post("/events")
    async def record_security_event(
        event_type: str,
        severity: str = "info",
        details: Optional[Dict[str, Any]] = None,
        current_user: User = Depends(require_admin)
    ):
        """Registrar evento de segurança manualmente"""
        try:
            dashboard = get_security_dashboard()
            dashboard.record_security_event(event_type, severity, details)
            
            return {
                "message": "Evento registrado com sucesso",
                "event_type": event_type,
                "severity": severity,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao registrar evento: {str(e)}"
            )

else:
    # Endpoints desabilitados se dashboard não disponível
    
    @router.get("/health")
    async def dashboard_not_available():
        raise HTTPException(
            status_code=503,
            detail="Dashboard de segurança não disponível"
        )
    
    @router.get("/summary")
    async def summary_not_available():
        raise HTTPException(
            status_code=503,
            detail="Dashboard de segurança não disponível"
        )

# Função para incluir router na aplicação
def include_security_dashboard_router(app):
    """Incluir router do dashboard na aplicação"""
    app.include_router(router)
    
    if DASHBOARD_AVAILABLE:
        print("✅ Endpoints do dashboard de segurança adicionados")
    else:
        print("⚠️ Endpoints do dashboard desabilitados (sistema não disponível)")

if __name__ == "__main__":
    print("📊 API do Dashboard de Segurança - BGAPP")
    print("Endpoints para monitorização de segurança em tempo real")
    
    if DASHBOARD_AVAILABLE:
        print("✅ Dashboard disponível")
        print("\nEndpoints disponíveis:")
        print("  GET /security/health - Status de saúde")
        print("  GET /security/summary - Resumo de segurança")  
        print("  GET /security/metrics - Métricas detalhadas")
        print("  GET /security/alerts - Alertas de segurança")
        print("  GET /security/dashboard - Dados completos")
        print("  GET /security/export - Exportar histórico")
        print("  POST /security/events - Registrar evento")
    else:
        print("❌ Dashboard não disponível")
