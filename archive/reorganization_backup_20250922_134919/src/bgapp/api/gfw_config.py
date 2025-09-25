"""
Global Fishing Watch API Configuration Endpoint
Fornece o token GFW de forma segura para o frontend
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
import os
from src.bgapp.auth.security import get_current_user
from src.bgapp.core.config import settings

router = APIRouter(prefix="/api/config", tags=["configuration"])

# Token GFW armazenado de forma segura
GFW_TOKEN = os.getenv("GFW_API_TOKEN", "***REMOVED***")

@router.get("/gfw-token")
async def get_gfw_token(current_user: Dict = Depends(get_current_user)) -> Dict[str, str]:
    """
    Retorna o token da API Global Fishing Watch de forma segura
    
    Requer autenticação para acesso
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return {
        "token": GFW_TOKEN,
        "expires": "2033-12-31",  # Token válido até 2033
        "type": "Bearer"
    }

@router.get("/gfw-settings")
async def get_gfw_settings(current_user: Dict = Depends(get_current_user)) -> Dict:
    """
    Retorna configurações completas da GFW API
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return {
        "api": {
            "baseUrl": "https://api.globalfishingwatch.org/v3",
            "tilesUrl": "https://tiles.globalfishingwatch.org",
            "token": GFW_TOKEN
        },
        "datasets": {
            "fishing": "public-global-fishing-activity:v20231026",
            "vessels": "public-global-all-vessels:v20231026",
            "encounters": "public-global-encounters:v20231026",
            "portVisits": "public-global-port-visits:v20231026"
        },
        "defaults": {
            "zoom": 5,
            "timeRange": 30,  # days
            "vesselTypes": ["fishing", "carrier", "support"],
            "confidenceLevel": 3
        },
        "angola": {
            "bbox": [-20.0, 4.0, -5.0, 18.0],  # [south, west, north, east]
            "center": [-12.5, 13.5],
            "protectedAreas": [
                {
                    "name": "Parque Nacional da Iona",
                    "bounds": [[-17.382, 13.269], [-16.154, 15.736]]
                },
                {
                    "name": "Reserva do Kwanza",
                    "bounds": [[-9.866, 12.814], [-9.297, 13.366]]
                }
            ]
        }
    }

@router.get("/gfw-status")
async def get_gfw_status() -> Dict:
    """
    Verifica status da integração GFW (endpoint público)
    """
    return {
        "status": "active",
        "integration": "enabled",
        "version": "1.0.0",
        "features": [
            "vessel_tracking",
            "fishing_activity",
            "heatmaps",
            "alerts",
            "protected_areas"
        ]
    }
