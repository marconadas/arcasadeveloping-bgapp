"""
Integração com Global Fishing Watch (GFW)
"""

import os
import requests
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
from config.settings import get_config

logger = logging.getLogger(__name__)

class GFWIntegration:
    """Classe para integração com Global Fishing Watch"""

    def __init__(self):
        self.config = get_config()
        self.base_url = "https://gateway.api.globalfishingwatch.org"
        self.api_key = self.config.GFW_API_KEY
        self.client_id = self.config.GFW_CLIENT_ID
        self.client_secret = self.config.GFW_CLIENT_SECRET

        self.session = requests.Session()
        self._setup_headers()

    def _setup_headers(self):
        """Configurar headers para as requisições"""
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}' if self.api_key else '',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })

    def get_vessel_data(self, bbox: List[float] = None, days_back: int = 7) -> Optional[Dict]:
        """
        Obter dados de embarcações na área especificada

        Args:
            bbox: [min_lon, min_lat, max_lon, max_lat]
            days_back: Número de dias para buscar dados

        Returns:
            Dict com dados de embarcações
        """
        # Coordenadas de Angola EEZ
        angola_bbox = [11.5, -18.0, 24.0, -4.5]
        if bbox:
            angola_bbox = bbox

        try:
            # Em produção, fazer chamadas reais para a API GFW
            # Por agora, dados de exemplo baseados no arquivo de configuração existente
            sample_vessels = {
                "timestamp": datetime.now().isoformat(),
                "bbox": angola_bbox,
                "vessels": [
                    {
                        "id": "vessel_001",
                        "name": "Atlantic Explorer",
                        "flag": "AGO",
                        "type": "fishing",
                        "lat": -8.8368,
                        "lon": 13.2343,
                        "speed": 2.5,
                        "heading": 180,
                        "status": "fishing",
                        "last_seen": datetime.now().isoformat()
                    },
                    {
                        "id": "vessel_002",
                        "name": "Ocean Harvest",
                        "flag": "PRT",
                        "type": "carrier",
                        "lat": -12.6,
                        "lon": 13.4,
                        "speed": 8.2,
                        "heading": 270,
                        "status": "transiting",
                        "last_seen": datetime.now().isoformat()
                    },
                    {
                        "id": "vessel_003",
                        "name": "Coastal Fisher",
                        "flag": "AGO",
                        "type": "fishing",
                        "lat": -15.2,
                        "lon": 12.1,
                        "speed": 0.5,
                        "heading": 0,
                        "status": "fishing",
                        "last_seen": datetime.now().isoformat()
                    }
                ],
                "summary": {
                    "total_vessels": 3,
                    "fishing_vessels": 2,
                    "carrier_vessels": 1,
                    "suspicious_activity": 0
                }
            }

            logger.info(f"Dados GFW obtidos: {sample_vessels['summary']['total_vessels']} embarcações")
            return sample_vessels

        except Exception as e:
            logger.error(f"Erro ao obter dados GFW: {str(e)}")
            return None

    def get_fishing_effort(self, bbox: List[float] = None, days_back: int = 30) -> Optional[Dict]:
        """
        Obter dados de esforço de pesca

        Args:
            bbox: [min_lon, min_lat, max_lon, max_lat]
            days_back: Número de dias para buscar dados

        Returns:
            Dict com dados de esforço de pesca
        """
        if not bbox:
            bbox = [11.5, -18.0, 24.0, -4.5]

        try:
            # Em produção, usar a API de fishing effort do GFW
            fishing_effort = {
                "timestamp": datetime.now().isoformat(),
                "bbox": bbox,
                "fishing_hours": 1247.5,
                "average_fishing_hours_per_day": 41.6,
                "hotspots": [
                    {
                        "lat": -15.2,
                        "lon": 12.1,
                        "intensity": "high",
                        "hours": 89.2
                    },
                    {
                        "lat": -16.8,
                        "lon": 11.8,
                        "intensity": "very_high",
                        "hours": 156.8
                    }
                ],
                "trend": "increasing"
            }

            return fishing_effort
        except Exception as e:
            logger.error(f"Erro ao obter dados de esforço de pesca: {str(e)}")
            return None

    def get_encounters(self, bbox: List[float] = None, days_back: int = 7) -> Optional[Dict]:
        """
        Obter dados de encontros entre embarcações

        Args:
            bbox: [min_lon, min_lat, max_lon, max_lat]
            days_back: Número de dias para buscar dados

        Returns:
            Dict com dados de encontros
        """
        if not bbox:
            bbox = [11.5, -18.0, 24.0, -4.5]

        try:
            # Em produção, usar a API de encounters do GFW
            encounters = {
                "timestamp": datetime.now().isoformat(),
                "bbox": bbox,
                "encounters": [
                    {
                        "vessel_1": "Atlantic Explorer",
                        "vessel_2": "Ocean Harvest",
                        "lat": -8.8,
                        "lon": 13.2,
                        "distance": 0.5,  # nm
                        "duration": 45,  # minutos
                        "type": "meeting",
                        "timestamp": datetime.now().isoformat()
                    }
                ],
                "total_encounters": 1,
                "suspicious_encounters": 0
            }

            return encounters
        except Exception as e:
            logger.error(f"Erro ao obter dados de encontros: {str(e)}")
            return None

    def get_loitering_events(self, bbox: List[float] = None, days_back: int = 7) -> Optional[Dict]:
        """
        Obter eventos de loitering (embarcações paradas por muito tempo)

        Args:
            bbox: [min_lon, min_lat, max_lon, max_lat]
            days_back: Número de dias para buscar dados

        Returns:
            Dict com dados de loitering
        """
        if not bbox:
            bbox = [11.5, -18.0, 24.0, -4.5]

        try:
            loitering = {
                "timestamp": datetime.now().isoformat(),
                "bbox": bbox,
                "loitering_events": [
                    {
                        "vessel": "Coastal Fisher",
                        "lat": -15.2,
                        "lon": 12.1,
                        "duration": 180,  # minutos
                        "reason": "potential_fishing",
                        "start_time": datetime.now().isoformat()
                    }
                ],
                "total_events": 1,
                "average_duration": 180
            }

            return loitering
        except Exception as e:
            logger.error(f"Erro ao obter dados de loitering: {str(e)}")
            return None

    def to_geodataframe(self, data: Dict) -> Optional[gpd.GeoDataFrame]:
        """Converter dados de embarcações para GeoDataFrame"""
        try:
            if not data or 'vessels' not in data:
                return None

            vessels = []
            for vessel in data['vessels']:
                vessels.append({
                    'id': vessel['id'],
                    'name': vessel['name'],
                    'flag': vessel['flag'],
                    'type': vessel['type'],
                    'speed': vessel.get('speed', 0),
                    'heading': vessel.get('heading', 0),
                    'status': vessel.get('status', 'unknown'),
                    'last_seen': vessel.get('last_seen', ''),
                    'geometry': Point(vessel['lon'], vessel['lat'])
                })

            gdf = gpd.GeoDataFrame(vessels, crs="EPSG:4326")
            return gdf

        except Exception as e:
            logger.error(f"Erro ao converter para GeoDataFrame: {str(e)}")
            return None

    def check_connection(self) -> bool:
        """Verificar se a conexão com GFW está ativa"""
        try:
            # Teste de conectividade com a API
            response = self.session.get(
                f"{self.base_url}/v3/vessels/search",
                params={"limit": 1},
                timeout=10
            )
            return response.status_code == 200
        except:
            return False
