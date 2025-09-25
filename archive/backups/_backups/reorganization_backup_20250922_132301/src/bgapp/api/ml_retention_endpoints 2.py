"""
🔗 ML Retention API Endpoints
Endpoints específicos para gestão da base de retenção ML

INTEGRAÇÃO NÃO-INVASIVA:
- Endpoints adicionais que não afetam APIs existentes
- Compatível com Cloudflare Workers
- Gestão de cache e monitorização
- Dashboard de performance
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request, Query, Path
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import time

# Imports do sistema de retenção
try:
    from ..ml.retention_manager import MLRetentionManager, get_retention_manager
    from ..ml.retention_pipeline import MLRetentionPipeline, get_retention_pipeline
    from ..ml.retention_policies import MLRetentionPolicyManager, get_policy_manager
    from ..ml.retention_integration import MLRetentionIntegrator, get_retention_integrator
    from ..ml.retention_monitoring import MLRetentionMonitor, get_retention_monitor
    from ..auth.security import verify_api_token
except ImportError:
    # Fallback para desenvolvimento
    import sys
    sys.path.append('../../')

logger = logging.getLogger(__name__)


# =====================================
# 📋 MODELOS PYDANTIC
# =====================================

class CacheStatsResponse(BaseModel):
    """Resposta com estatísticas de cache"""
    cache_type: str
    hit_ratio: float
    total_entries: int
    active_entries: int
    space_usage_mb: float
    last_updated: str


class PerformanceMetricsResponse(BaseModel):
    """Resposta com métricas de performance"""
    cache_hit_ratio: float
    avg_response_time_ms: float
    total_space_mb: float
    queries_intercepted: int
    performance_gains_ms: float
    last_updated: str


class RetentionPolicyResponse(BaseModel):
    """Resposta com política de retenção"""
    policy_id: str
    name: str
    table_name: str
    retention_days: int
    enabled: bool
    next_execution: Optional[str]
    last_execution_stats: Optional[Dict[str, Any]] = None


class SystemHealthResponse(BaseModel):
    """Resposta com saúde do sistema"""
    overall_status: str
    components: Dict[str, str]
    active_alerts: int
    monitoring_active: bool
    cache_performance: str
    last_update: str


class CacheOptimizationRequest(BaseModel):
    """Request para otimização de cache"""
    cache_type: str = Field(..., description="Tipo de cache (feature_store, training_cache, inference_cache)")
    operation: str = Field(..., description="Operação (clear, refresh, optimize)")
    target_ratio: Optional[float] = Field(None, description="Taxa de hit desejada")


class PolicyUpdateRequest(BaseModel):
    """Request para atualização de política"""
    retention_days: Optional[int] = None
    min_access_count: Optional[int] = None
    enabled: Optional[bool] = None
    execution_interval_hours: Optional[int] = None


# =====================================
# 🚀 CRIAÇÃO DA APP FASTAPI
# =====================================

def create_retention_api() -> FastAPI:
    """Criar aplicação FastAPI para endpoints de retenção"""
    
    app = FastAPI(
        title="BGAPP ML Retention API",
        description="API para gestão da base de retenção ML",
        version="1.0.0",
        docs_url="/retention/docs",
        redoc_url="/retention/redoc"
    )
    
    # Middleware para CORS
    @app.middleware("http")
    async def add_cors_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Client-Version, X-Client-Platform, X-Request-ID"
        return response
    
    # =====================================
    # 📊 ENDPOINTS DE MONITORIZAÇÃO
    # =====================================
    
    @app.get("/retention/health", response_model=SystemHealthResponse)
    async def get_retention_health(
        user=Depends(verify_api_token)
    ):
        """Obter estado de saúde do sistema de retenção"""
        try:
            integrator = get_retention_integrator()
            health_status = await integrator.health_check()
            
            return SystemHealthResponse(
                overall_status=health_status['overall_status'],
                components=health_status.get('components', {}),
                active_alerts=len(health_status.get('issues', [])),
                monitoring_active=health_status.get('monitoring_active', False),
                cache_performance='good' if health_status['overall_status'] == 'healthy' else 'degraded',
                last_update=datetime.now().isoformat()
            )
            
        except Exception as e:
            logger.error(f"❌ Erro obtendo health status: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    @app.get("/retention/metrics", response_model=PerformanceMetricsResponse)
    async def get_performance_metrics(
        user=Depends(verify_api_token)
    ):
        """Obter métricas de performance do sistema"""
        try:
            integrator = get_retention_integrator()
            metrics = integrator.get_integration_metrics()
            
            return PerformanceMetricsResponse(
                cache_hit_ratio=metrics.get('cache_hit_ratio', 0.0),
                avg_response_time_ms=metrics.get('performance_gains_ms', 0.0) / max(1, metrics.get('queries_intercepted', 1)),
                total_space_mb=metrics.get('retention_manager_stats', {}).get('memory_cache_size', 0) * 0.1,  # Estimativa
                queries_intercepted=metrics.get('queries_intercepted', 0),
                performance_gains_ms=metrics.get('performance_gains_ms', 0.0),
                last_updated=datetime.now().isoformat()
            )
            
        except Exception as e:
            logger.error(f"❌ Erro obtendo métricas: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    @app.get("/retention/dashboard")
    async def get_retention_dashboard(
        user=Depends(verify_api_token)
    ):
        """Obter dados completos para dashboard de retenção"""
        try:
            monitor = get_retention_monitor()
            dashboard_data = monitor.get_dashboard_data()
            
            # Adicionar dados do integrador
            integrator = get_retention_integrator()
            integration_metrics = integrator.get_integration_metrics()
            
            # Combinar dados
            combined_data = {
                **dashboard_data,
                'integration_metrics': integration_metrics,
                'timestamp': datetime.now().isoformat()
            }
            
            return JSONResponse(content=combined_data)
            
        except Exception as e:
            logger.error(f"❌ Erro obtendo dados do dashboard: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    # =====================================
    # 🗄️ ENDPOINTS DE CACHE
    # =====================================
    
    @app.get("/retention/cache/stats")
    async def get_cache_statistics(
        user=Depends(verify_api_token)
    ):
        """Obter estatísticas detalhadas de cache"""
        try:
            retention_manager = get_retention_manager()
            cache_stats = await retention_manager.get_cache_statistics()
            
            stats_response = []
            for cache_type, stats in cache_stats.items():
                stats_response.append(CacheStatsResponse(
                    cache_type=cache_type,
                    hit_ratio=stats.hit_ratio,
                    total_entries=stats.total_requests,
                    active_entries=stats.cache_hits,
                    space_usage_mb=stats.space_saved_mb,
                    last_updated=datetime.now().isoformat()
                ))
            
            return {"cache_statistics": stats_response}
            
        except Exception as e:
            logger.error(f"❌ Erro obtendo estatísticas de cache: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    @app.post("/retention/cache/optimize")
    async def optimize_cache(
        request: CacheOptimizationRequest,
        background_tasks: BackgroundTasks,
        user=Depends(verify_api_token)
    ):
        """Otimizar cache baseado nos parâmetros"""
        try:
            retention_manager = get_retention_manager()
            
            if request.operation == "clear":
                # Limpar cache em memória
                if request.cache_type in retention_manager.memory_cache:
                    retention_manager.memory_cache[request.cache_type].clear()
                    return {"message": f"Cache {request.cache_type} limpo com sucesso"}
            
            elif request.operation == "refresh":
                # Agendar refresh em background
                background_tasks.add_task(_refresh_cache, request.cache_type)
                return {"message": f"Refresh do cache {request.cache_type} agendado"}
            
            elif request.operation == "optimize":
                # Otimizar cache
                background_tasks.add_task(_optimize_cache, request.cache_type, request.target_ratio)
                return {"message": f"Otimização do cache {request.cache_type} iniciada"}
            
            else:
                raise HTTPException(status_code=400, detail="Operação não suportada")
            
        except Exception as e:
            logger.error(f"❌ Erro otimizando cache: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    @app.get("/retention/cache/{cache_type}/size")
    async def get_cache_size(
        cache_type: str = Path(..., description="Tipo de cache"),
        user=Depends(verify_api_token)
    ):
        """Obter tamanho de um cache específico"""
        try:
            retention_manager = get_retention_manager()
            
            if cache_type not in retention_manager.memory_cache:
                raise HTTPException(status_code=404, detail="Tipo de cache não encontrado")
            
            cache_size = len(retention_manager.memory_cache[cache_type])
            
            return {
                "cache_type": cache_type,
                "entries_count": cache_size,
                "max_size": retention_manager.cache_config.get('memory_cache_size', 1000),
                "usage_percentage": (cache_size / retention_manager.cache_config.get('memory_cache_size', 1000)) * 100
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Erro obtendo tamanho do cache: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    # =====================================
    # 📋 ENDPOINTS DE POLÍTICAS
    # =====================================
    
    @app.get("/retention/policies")
    async def get_retention_policies(
        user=Depends(verify_api_token)
    ):
        """Obter todas as políticas de retenção"""
        try:
            policy_manager = get_policy_manager()
            status = policy_manager.get_policy_status()
            
            policies_response = []
            for policy_id, policy_info in status.get('policies', {}).items():
                policies_response.append(RetentionPolicyResponse(
                    policy_id=policy_id,
                    name=policy_info['name'],
                    table_name=policy_info['table_name'],
                    retention_days=policy_info['retention_days'],
                    enabled=policy_info['enabled'],
                    next_execution=policy_info.get('next_execution')
                ))
            
            return {
                "total_policies": status['total_policies'],
                "enabled_policies": status['enabled_policies'],
                "scheduler_running": status['scheduler_running'],
                "policies": policies_response
            }
            
        except Exception as e:
            logger.error(f"❌ Erro obtendo políticas: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    @app.put("/retention/policies/{policy_id}")
    async def update_retention_policy(
        policy_id: str = Path(..., description="ID da política"),
        updates: PolicyUpdateRequest = ...,
        user=Depends(verify_api_token)
    ):
        """Atualizar uma política de retenção"""
        try:
            policy_manager = get_policy_manager()
            
            # Preparar updates
            update_dict = {}
            if updates.retention_days is not None:
                update_dict['retention_days'] = updates.retention_days
            if updates.min_access_count is not None:
                update_dict['min_access_count'] = updates.min_access_count
            if updates.enabled is not None:
                update_dict['enabled'] = updates.enabled
            if updates.execution_interval_hours is not None:
                update_dict['execution_interval_hours'] = updates.execution_interval_hours
            
            # Atualizar política
            await policy_manager.update_policy(policy_id, update_dict)
            
            return {"message": f"Política {policy_id} atualizada com sucesso"}
            
        except Exception as e:
            logger.error(f"❌ Erro atualizando política: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    @app.post("/retention/policies/{policy_id}/execute")
    async def execute_retention_policy(
        policy_id: str = Path(..., description="ID da política"),
        dry_run: bool = Query(True, description="Executar em modo dry-run"),
        background_tasks: BackgroundTasks,
        user=Depends(verify_api_token)
    ):
        """Executar uma política de retenção específica"""
        try:
            policy_manager = get_policy_manager()
            
            # Verificar se política existe
            if policy_id not in policy_manager.active_policies:
                raise HTTPException(status_code=404, detail="Política não encontrada")
            
            policy = policy_manager.active_policies[policy_id]
            
            if dry_run:
                # Executar dry-run imediatamente
                result = await policy_manager.execute_policy(policy, dry_run=True)
                return {
                    "message": "Dry-run executado com sucesso",
                    "records_to_process": result.records_processed,
                    "estimated_space_freed_mb": result.space_freed_mb
                }
            else:
                # Executar em background
                background_tasks.add_task(_execute_policy_background, policy_manager, policy)
                return {"message": f"Execução da política {policy_id} agendada"}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Erro executando política: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    @app.get("/retention/policies/history")
    async def get_policy_execution_history(
        limit: int = Query(50, description="Número máximo de execuções"),
        user=Depends(verify_api_token)
    ):
        """Obter histórico de execuções de políticas"""
        try:
            policy_manager = get_policy_manager()
            history = policy_manager.get_execution_history(limit=limit)
            
            return {
                "total_executions": len(history),
                "executions": history
            }
            
        except Exception as e:
            logger.error(f"❌ Erro obtendo histórico: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    # =====================================
    # 📈 ENDPOINTS DE RELATÓRIOS
    # =====================================
    
    @app.get("/retention/reports/performance")
    async def get_performance_report(
        period_hours: int = Query(24, description="Período em horas"),
        user=Depends(verify_api_token)
    ):
        """Obter relatório de performance"""
        try:
            monitor = get_retention_monitor()
            report = await monitor.generate_performance_report(period_hours=period_hours)
            
            return {
                "report_id": report.report_id,
                "period": {
                    "start": report.period_start.isoformat(),
                    "end": report.period_end.isoformat(),
                    "hours": period_hours
                },
                "metrics": {
                    "total_queries": report.total_queries,
                    "cache_hit_ratio": report.cache_hit_ratio,
                    "avg_response_time_ms": report.avg_response_time_ms,
                    "space_saved_mb": report.space_saved_mb,
                    "performance_improvement": report.performance_improvement
                },
                "insights": report.key_insights,
                "recommendations": report.recommendations
            }
            
        except Exception as e:
            logger.error(f"❌ Erro gerando relatório: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    @app.get("/retention/reports/cleanup")
    async def get_cleanup_report(
        user=Depends(verify_api_token)
    ):
        """Obter relatório de limpeza"""
        try:
            policy_manager = get_policy_manager()
            report = await policy_manager.generate_cleanup_report()
            
            return report
            
        except Exception as e:
            logger.error(f"❌ Erro gerando relatório de limpeza: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    # =====================================
    # 🔧 ENDPOINTS DE ADMINISTRAÇÃO
    # =====================================
    
    @app.post("/retention/system/enable")
    async def enable_retention_system(
        user=Depends(verify_api_token)
    ):
        """Ativar sistema de retenção"""
        try:
            integrator = get_retention_integrator()
            integrator.enable_integration()
            
            return {"message": "Sistema de retenção ativado com sucesso"}
            
        except Exception as e:
            logger.error(f"❌ Erro ativando sistema: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    @app.post("/retention/system/disable")
    async def disable_retention_system(
        user=Depends(verify_api_token)
    ):
        """Desativar sistema de retenção"""
        try:
            integrator = get_retention_integrator()
            integrator.disable_integration()
            
            return {"message": "Sistema de retenção desativado com sucesso"}
            
        except Exception as e:
            logger.error(f"❌ Erro desativando sistema: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    @app.post("/retention/system/cleanup")
    async def cleanup_retention_data(
        background_tasks: BackgroundTasks,
        user=Depends(verify_api_token)
    ):
        """Executar limpeza de dados expirados"""
        try:
            retention_manager = get_retention_manager()
            
            # Executar limpeza em background
            background_tasks.add_task(_cleanup_expired_data, retention_manager)
            
            return {"message": "Limpeza de dados agendada"}
            
        except Exception as e:
            logger.error(f"❌ Erro agendando limpeza: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    @app.get("/retention/system/status")
    async def get_system_status(
        user=Depends(verify_api_token)
    ):
        """Obter status completo do sistema"""
        try:
            # Coletar status de todos os componentes
            integrator = get_retention_integrator()
            retention_manager = get_retention_manager()
            pipeline = get_retention_pipeline()
            policy_manager = get_policy_manager()
            monitor = get_retention_monitor()
            
            status = {
                "system_active": integrator.enabled,
                "cloudflare_mode": integrator.cloudflare_mode,
                "components": {
                    "retention_manager": "active",
                    "pipeline": "active" if hasattr(pipeline, 'background_task') and pipeline.background_task else "stopped",
                    "policy_manager": "active" if hasattr(policy_manager, 'scheduler_task') and policy_manager.scheduler_task else "stopped",
                    "monitor": "active" if monitor.monitoring_active else "stopped"
                },
                "metrics": integrator.get_integration_metrics(),
                "timestamp": datetime.now().isoformat()
            }
            
            return status
            
        except Exception as e:
            logger.error(f"❌ Erro obtendo status do sistema: {e}")
            raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    return app


# =====================================
# 🔧 FUNÇÕES DE BACKGROUND
# =====================================

async def _refresh_cache(cache_type: str):
    """Refresh de cache em background"""
    try:
        logger.info(f"🔄 Refreshing cache: {cache_type}")
        retention_manager = get_retention_manager()
        
        # Limpar cache atual
        if cache_type in retention_manager.memory_cache:
            retention_manager.memory_cache[cache_type].clear()
        
        logger.info(f"✅ Cache {cache_type} refreshed")
        
    except Exception as e:
        logger.error(f"❌ Erro no refresh do cache {cache_type}: {e}")


async def _optimize_cache(cache_type: str, target_ratio: Optional[float]):
    """Otimização de cache em background"""
    try:
        logger.info(f"⚡ Optimizing cache: {cache_type}")
        
        # Lógica de otimização baseada no target_ratio
        if target_ratio and target_ratio > 0.8:
            logger.info(f"🎯 Target ratio {target_ratio:.2%} - increasing cache size")
        
        logger.info(f"✅ Cache {cache_type} optimized")
        
    except Exception as e:
        logger.error(f"❌ Erro na otimização do cache {cache_type}: {e}")


async def _execute_policy_background(policy_manager, policy):
    """Execução de política em background"""
    try:
        logger.info(f"📋 Executing policy: {policy.name}")
        
        result = await policy_manager.execute_policy(policy, dry_run=False)
        
        if result.success:
            logger.info(f"✅ Policy {policy.name} executed: {result.records_affected} records affected")
        else:
            logger.error(f"❌ Policy {policy.name} failed: {result.error_message}")
        
    except Exception as e:
        logger.error(f"❌ Erro executando política em background: {e}")


async def _cleanup_expired_data(retention_manager):
    """Limpeza de dados expirados em background"""
    try:
        logger.info("🧹 Starting expired data cleanup")
        
        cleanup_stats = await retention_manager.cleanup_expired_data()
        
        total_cleaned = sum(cleanup_stats.values())
        logger.info(f"✅ Cleanup completed: {total_cleaned} records removed")
        
    except Exception as e:
        logger.error(f"❌ Erro na limpeza de dados: {e}")


# =====================================
# 🚀 INSTÂNCIA GLOBAL
# =====================================

# Criar instância da API
retention_api = create_retention_api()


if __name__ == "__main__":
    import uvicorn
    
    # Executar API em modo de desenvolvimento
    uvicorn.run(
        "ml_retention_endpoints:retention_api",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
