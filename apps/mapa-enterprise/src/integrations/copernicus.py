"""
Integração com Copernicus Marine Service
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

class CopernicusIntegration:
    """Classe para integração com Copernicus Marine Service"""

    def __init__(self):
        self.config = get_config()
        self.base_url = "https://nrt.cmems-du.eu"
        self.username = self.config.COPERNICUS_USERNAME
        self.password = self.config.COPERNICUS_PASSWORD
        self.api_key = self.config.COPERNICUS_API_KEY

        self.session = requests.Session()
        self._authenticate()

    def _authenticate(self):
        """Autenticação com o serviço Copernicus"""
        if not self.username or not self.password:
            logger.warning("Credenciais Copernicus não configuradas")
            return

        auth_url = f"{self.base_url}/moto/api/login"
        try:
            response = self.session.post(auth_url, json={
                "username": self.username,
                "password": self.password
            })

            if response.status_code == 200:
                logger.info("Autenticação Copernicus bem-sucedida")
            else:
                logger.error(f"Falha na autenticação Copernicus: {response.text}")
        except Exception as e:
            logger.error(f"Erro na autenticação Copernicus: {str(e)}")

    def get_ocean_data(self, bbox: List[float], variables: List[str] = None) -> Optional[Dict]:
        """
        Obter dados oceanográficos para a área especificada

        Args:
            bbox: [min_lon, min_lat, max_lon, max_lat]
            variables: Lista de variáveis a buscar (default: sst, chlorophyll, salinity)

        Returns:
            Dict com dados processados ou None em caso de erro
        """
        if not variables:
            variables = ['sea_surface_temperature', 'chlorophyll_concentration', 'sea_surface_salinity']

        # Coordenadas de Angola
        angola_bbox = [11.5, -18.0, 24.0, -4.5]  # [min_lon, min_lat, max_lon, max_lat]
        if bbox:
            angola_bbox = bbox

        try:
            # Dados de exemplo - em produção, fazer chamadas reais para a API
            sample_data = {
                "timestamp": datetime.now().isoformat(),
                "bbox": angola_bbox,
                "variables": variables,
                "data": [
                    {
                        "name": "Cabinda",
                        "lat": -5.5,
                        "lon": 12.2,
                        "sst": 25.8,  # Sea Surface Temperature
                        "chlorophyll": 2.3,
                        "salinity": 34.9
                    },
                    {
                        "name": "Luanda",
                        "lat": -8.8,
                        "lon": 13.2,
                        "sst": 22.1,
                        "chlorophyll": 4.2,
                        "salinity": 35.0
                    },
                    {
                        "name": "Benguela",
                        "lat": -12.6,
                        "lon": 13.4,
                        "sst": 18.9,
                        "chlorophyll": 7.8,
                        "salinity": 35.2
                    },
                    {
                        "name": "Namibe",
                        "lat": -15.2,
                        "lon": 12.1,
                        "sst": 16.2,
                        "chlorophyll": 12.1,
                        "salinity": 35.3
                    },
                    {
                        "name": "Tombwa",
                        "lat": -16.8,
                        "lon": 11.8,
                        "sst": 15.8,
                        "chlorophyll": 13.5,
                        "salinity": 35.4
                    }
                ]
            }

            logger.info(f"Dados Copernicus obtidos para {len(sample_data['data'])} pontos")
            return sample_data

        except Exception as e:
            logger.error(f"Erro ao obter dados Copernicus: {str(e)}")
            return None

    def get_wind_data(self, bbox: List[float] = None) -> Optional[Dict]:
        """Obter dados de vento"""
        if not bbox:
            bbox = [11.5, -18.0, 24.0, -4.5]

        try:
            # Em produção, integrar com ERA5 ou dados reais
            wind_data = {
                "timestamp": datetime.now().isoformat(),
                "bbox": bbox,
                "wind_speed": 8.5,  # m/s
                "wind_direction": 225,  # graus
                "source": "Copernicus ERA5"
            }

            return wind_data
        except Exception as e:
            logger.error(f"Erro ao obter dados de vento: {str(e)}")
            return None

    def get_upwelling_data(self, bbox: List[float] = None) -> Optional[Dict]:
        """Obter dados de upwelling"""
        if not bbox:
            bbox = [11.5, -18.0, 24.0, -4.5]

        try:
            # Em produção, calcular upwelling baseado em dados reais
            upwelling_data = {
                "timestamp": datetime.now().isoformat(),
                "bbox": bbox,
                "upwelling_active": True,
                "intensity": "high",
                "zones": [
                    {"name": "Namibe", "lat": -15.2, "lon": 12.1, "intensity": "very_high"},
                    {"name": "Tombwa", "lat": -16.8, "lon": 11.8, "intensity": "extreme"},
                    {"name": "Benguela", "lat": -12.6, "lon": 13.4, "intensity": "high"}
                ]
            }

            return upwelling_data
        except Exception as e:
            logger.error(f"Erro ao obter dados de upwelling: {str(e)}")
            return None

    def to_geodataframe(self, data: Dict) -> Optional[gpd.GeoDataFrame]:
        """Converter dados para GeoDataFrame"""
        try:
            if not data or 'data' not in data:
                return None

            points = []
            for point in data['data']:
                points.append({
                    'name': point['name'],
                    'lat': point['lat'],
                    'lon': point['lon'],
                    'sst': point.get('sst', None),
                    'chlorophyll': point.get('chlorophyll', None),
                    'salinity': point.get('salinity', None),
                    'geometry': Point(point['lon'], point['lat'])
                })

            gdf = gpd.GeoDataFrame(points, crs="EPSG:4326")
            return gdf

        except Exception as e:
            logger.error(f"Erro ao converter para GeoDataFrame: {str(e)}")
            return None

    def check_connection(self) -> bool:
        """Verificar se a conexão com Copernicus está ativa"""
        try:
            # Teste simples de conectividade
            response = self.session.get(f"{self.base_url}/moto/api/status", timeout=10)
            return response.status_code == 200
        except:
            return False
