"""
🗺️ CARTO Integration API Endpoints
Endpoints para integração entre CARTO e BGAPP
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import logging

from ..integrations.carto_service import get_carto_service, CARTOIntegrationService
from ..core.auth import get_current_admin_user
from ..core.database import get_database

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/integrations/carto", tags=["CARTO Integration"])

# Modelos Pydantic
class CARTOSyncRequest(BaseModel):
    """Request para sincronização CARTO"""
    table_name: str = Field(default="marine_biodiversity", description="Nome da tabela CARTO")
    limit: int = Field(default=1000, description="Limite de registros")
    force: bool = Field(default=False, description="Forçar sincronização mesmo se recente")

class CARTOMapRequest(BaseModel):
    """Request para criar mapa integrado"""
    name: str = Field(..., description="Nome do mapa")
    description: str = Field(..., description="Descrição do mapa")
    table_name: str = Field(..., description="Tabela CARTO")
    query: Optional[str] = Field(None, description="Query SQL personalizada")
    viz_type: str = Field(default="points", description="Tipo de visualização")
    style: Dict[str, Any] = Field(default_factory=dict, description="Estilo do mapa")
    center: List[float] = Field(default=[-12.5, 18.5], description="Centro do mapa [lat, lng]")
    zoom: int = Field(default=6, description="Zoom inicial")

class CARTOQueryRequest(BaseModel):
    """Request para query SQL personalizada"""
    query: str = Field(..., description="Query SQL")
    format: str = Field(default="json", description="Formato da resposta")

# Endpoints

@router.get("/status")
async def get_integration_status():
    """Status da integração CARTO"""
    try:
        async with await get_carto_service() as carto:
            # Testar conexão
            tables = await carto.get_tables()
            
            return {
                "success": True,
                "status": "connected",
                "carto_username": carto.config.username,
                "available_tables": len(tables),
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except Exception as e:
        logger.error(f"Erro ao verificar status CARTO: {e}")
        return {
            "success": False,
            "status": "error",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@router.get("/tables")
async def list_carto_tables(current_user = Depends(get_current_admin_user)):
    """Listar tabelas disponíveis no CARTO"""
    try:
        async with await get_carto_service() as carto:
            tables = await carto.get_tables()
            
            return {
                "success": True,
                "data": tables,
                "total": len(tables)
            }
            
    except Exception as e:
        logger.error(f"Erro ao listar tabelas CARTO: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tables/{table_name}")
async def get_table_info(
    table_name: str,
    current_user = Depends(get_current_admin_user)
):
    """Obter informações de uma tabela específica"""
    try:
        async with await get_carto_service() as carto:
            info = await carto.get_table_info(table_name)
            
            if not info:
                raise HTTPException(status_code=404, detail="Tabela não encontrada")
            
            return {
                "success": True,
                "data": info
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter info da tabela {table_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sql")
async def execute_sql_query(
    request: CARTOQueryRequest,
    current_user = Depends(get_current_admin_user)
):
    """Executar query SQL personalizada no CARTO"""
    try:
        async with await get_carto_service() as carto:
            result = await carto.execute_sql(request.query, request.format)
            
            return {
                "success": True,
                "data": result,
                "rows_count": len(result.get('rows', [])),
                "executed_at": datetime.utcnow().isoformat()
            }
            
    except Exception as e:
        logger.error(f"Erro ao executar SQL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync")
async def sync_carto_data(
    request: CARTOSyncRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_admin_user)
):
    """Sincronizar dados CARTO → BGAPP"""
    try:
        async with await get_carto_service() as carto:
            # Executar sincronização em background
            result = await carto.sync_to_bgapp(request.table_name)
            
            return {
                "success": result['success'],
                "message": result['message'],
                "synced_records": result['synced_records'],
                "timestamp": result.get('timestamp')
            }
            
    except Exception as e:
        logger.error(f"Erro na sincronização: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/marine-data")
async def get_marine_data(
    limit: int = 100,
    current_user = Depends(get_current_admin_user)
):
    """Obter dados marinhos do CARTO"""
    try:
        async with await get_carto_service() as carto:
            data = await carto.get_marine_data(limit)
            
            return {
                "success": True,
                "data": data,
                "count": len(data),
                "retrieved_at": datetime.utcnow().isoformat()
            }
            
    except Exception as e:
        logger.error(f"Erro ao obter dados marinhos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis/spatial")
async def get_spatial_analysis(
    region: str = "angola",
    current_user = Depends(get_current_admin_user)
):
    """Análise espacial dos dados CARTO"""
    try:
        async with await get_carto_service() as carto:
            analysis = await carto.get_spatial_analysis(region)
            
            return {
                "success": True,
                "data": analysis,
                "region": region,
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
    except Exception as e:
        logger.error(f"Erro na análise espacial: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/maps")
async def create_integrated_map(
    request: CARTOMapRequest,
    current_user = Depends(get_current_admin_user)
):
    """Criar mapa integrado CARTO + BGAPP"""
    try:
        async with await get_carto_service() as carto:
            result = await carto.create_map_integration(request.dict())
            
            if result['success']:
                return {
                    "success": True,
                    "map_id": result['map_id'],
                    "message": result['message'],
                    "created_at": datetime.utcnow().isoformat()
                }
            else:
                raise HTTPException(status_code=400, detail=result['message'])
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar mapa integrado: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/maps")
async def list_integrated_maps(current_user = Depends(get_current_admin_user)):
    """Listar mapas integrados com CARTO"""
    try:
        db = get_database()
        async with db.acquire() as conn:
            maps = await conn.fetch("""
                SELECT id, name, description, category, config, created_at, updated_at
                FROM maps 
                WHERE source = 'carto' 
                ORDER BY created_at DESC
            """)
            
            maps_list = []
            for map_record in maps:
                maps_list.append({
                    "id": map_record['id'],
                    "name": map_record['name'],
                    "description": map_record['description'],
                    "category": map_record['category'],
                    "config": map_record['config'],
                    "created_at": map_record['created_at'].isoformat(),
                    "updated_at": map_record['updated_at'].isoformat() if map_record['updated_at'] else None
                })
            
            return {
                "success": True,
                "data": maps_list,
                "total": len(maps_list)
            }
            
    except Exception as e:
        logger.error(f"Erro ao listar mapas integrados: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/maps/{map_id}")
async def delete_integrated_map(
    map_id: str,
    current_user = Depends(get_current_admin_user)
):
    """Deletar mapa integrado"""
    try:
        db = get_database()
        async with db.acquire() as conn:
            deleted = await conn.fetchval("""
                DELETE FROM maps 
                WHERE id = $1 AND source = 'carto'
                RETURNING id
            """, map_id)
            
            if not deleted:
                raise HTTPException(status_code=404, detail="Mapa não encontrado")
            
            return {
                "success": True,
                "message": "Mapa deletado com sucesso",
                "deleted_id": deleted
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar mapa: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check da integração CARTO"""
    try:
        async with await get_carto_service() as carto:
            # Teste simples de conectividade
            result = await carto.execute_sql("SELECT 1 as test")
            
            return {
                "status": "healthy",
                "carto_connection": "ok",
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except Exception as e:
        return {
            "status": "unhealthy",
            "carto_connection": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

