"""
Integração com dados QGIS e shapefiles
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
import geopandas as gpd
import pandas as pd
from shapely.geometry import Polygon, MultiPolygon, Point
import fiona
from config.settings import get_config

logger = logging.getLogger(__name__)

class QGISIntegration:
    """Classe para integração com dados QGIS e shapefiles"""

    def __init__(self):
        self.config = get_config()
        self.data_path = 'data/qgis'  # Path para dados QGIS
        self.angola_eez_path = os.path.join(self.data_path, 'angola_eez.geojson')
        self.marine_protected_areas_path = os.path.join(self.data_path, 'marine_protected_areas.geojson')
        self.fishing_zones_path = os.path.join(self.data_path, 'fishing_zones.geojson')
        self.bathymetry_path = os.path.join(self.data_path, 'bathymetry.geojson')

        self._ensure_data_directory()
        self._load_base_layers()

    def _ensure_data_directory(self):
        """Garantir que o diretório de dados existe"""
        try:
            os.makedirs(self.data_path, exist_ok=True)

            # Se não existem arquivos, criar dados de exemplo
            if not os.path.exists(self.angola_eez_path):
                self._create_sample_angola_eez()

            if not os.path.exists(self.marine_protected_areas_path):
                self._create_sample_marine_protected_areas()

            if not os.path.exists(self.fishing_zones_path):
                self._create_sample_fishing_zones()

        except Exception as e:
            logger.error(f"Erro ao criar diretório de dados QGIS: {str(e)}")

    def _create_sample_angola_eez(self):
        """Criar shapefile de exemplo para EEZ de Angola"""
        try:
            # Coordenadas aproximadas da EEZ de Angola
            angola_eez_coords = [
                (11.5, -4.5), (24.0, -4.5), (24.0, -18.0),
                (11.5, -18.0), (11.5, -4.5)
            ]

            polygon = Polygon(angola_eez_coords)

            data = {
                'name': ['Angola EEZ'],
                'country': ['Angola'],
                'area_km2': [1650000],
                'geometry': [polygon]
            }

            gdf = gpd.GeoDataFrame(data, crs="EPSG:4326")
            gdf.to_file(self.angola_eez_path, driver='GeoJSON')

            logger.info("Shapefile EEZ de Angola criado com sucesso")

        except Exception as e:
            logger.error(f"Erro ao criar EEZ de Angola: {str(e)}")

    def _create_sample_marine_protected_areas(self):
        """Criar shapefile de exemplo para áreas marinhas protegidas"""
        try:
            # Áreas marinhas protegidas de exemplo
            protected_areas = [
                Polygon([(12.0, -8.0), (13.0, -8.0), (13.0, -9.0), (12.0, -9.0)]),
                Polygon([(13.0, -15.0), (14.0, -15.0), (14.0, -16.0), (13.0, -16.0)])
            ]

            data = {
                'name': ['Área Protegida Luanda', 'Área Protegida Namibe'],
                'type': ['marine_reserve', 'no_take_zone'],
                'protection_level': ['high', 'maximum'],
                'geometry': protected_areas
            }

            gdf = gpd.GeoDataFrame(data, crs="EPSG:4326")
            gdf.to_file(self.marine_protected_areas_path, driver='GeoJSON')

            logger.info("Shapefile de áreas marinhas protegidas criado com sucesso")

        except Exception as e:
            logger.error(f"Erro ao criar áreas marinhas protegidas: {str(e)}")

    def _create_sample_fishing_zones(self):
        """Criar shapefile de exemplo para zonas de pesca"""
        try:
            # Zonas de pesca de exemplo
            fishing_zones = [
                Polygon([(11.8, -5.2), (12.8, -5.2), (12.8, -6.2), (11.8, -6.2)]),
                Polygon([(13.2, -12.2), (14.2, -12.2), (14.2, -13.2), (13.2, -13.2)]),
                Polygon([(11.5, -15.5), (12.5, -15.5), (12.5, -16.5), (11.5, -16.5)])
            ]

            data = {
                'name': ['Zona de Pesca Artesanal Norte', 'Zona de Pesca Industrial Centro', 'Zona de Pesca Artesanal Sul'],
                'type': ['artisanal', 'industrial', 'artisanal'],
                'regulation': ['open', 'restricted', 'seasonal'],
                'geometry': fishing_zones
            }

            gdf = gpd.GeoDataFrame(data, crs="EPSG:4326")
            gdf.to_file(self.fishing_zones_path, driver='GeoJSON')

            logger.info("Shapefile de zonas de pesca criado com sucesso")

        except Exception as e:
            logger.error(f"Erro ao criar zonas de pesca: {str(e)}")

    def _load_base_layers(self):
        """Carregar camadas base do QGIS"""
        self.layers = {}

        try:
            # Carregar EEZ de Angola
            if os.path.exists(self.angola_eez_path):
                self.layers['angola_eez'] = gpd.read_file(self.angola_eez_path)
                logger.info("Camada EEZ de Angola carregada")

            # Carregar áreas marinhas protegidas
            if os.path.exists(self.marine_protected_areas_path):
                self.layers['marine_protected_areas'] = gpd.read_file(self.marine_protected_areas_path)
                logger.info("Camada de áreas marinhas protegidas carregada")

            # Carregar zonas de pesca
            if os.path.exists(self.fishing_zones_path):
                self.layers['fishing_zones'] = gpd.read_file(self.fishing_zones_path)
                logger.info("Camada de zonas de pesca carregada")

        except Exception as e:
            logger.error(f"Erro ao carregar camadas QGIS: {str(e)}")

    def get_layer_data(self, layer_name: str) -> Optional[gpd.GeoDataFrame]:
        """
        Obter dados de uma camada específica

        Args:
            layer_name: Nome da camada

        Returns:
            GeoDataFrame com os dados da camada
        """
        return self.layers.get(layer_name)

    def check_vessel_in_eez(self, lat: float, lon: float) -> bool:
        """
        Verificar se uma embarcação está dentro da EEZ de Angola

        Args:
            lat: Latitude
            lon: Longitude

        Returns:
            True se estiver dentro da EEZ
        """
        try:
            point = Point(lon, lat)

            if 'angola_eez' in self.layers:
                eez = self.layers['angola_eez']
                return eez.contains(point).any()

            return False
        except Exception as e:
            logger.error(f"Erro ao verificar EEZ: {str(e)}")
            return False

    def check_vessel_in_protected_area(self, lat: float, lon: float) -> Optional[Dict]:
        """
        Verificar se uma embarcação está em área marinha protegida

        Args:
            lat: Latitude
            lon: Longitude

        Returns:
            Dict com informações da área protegida ou None
        """
        try:
            point = Point(lon, lat)

            if 'marine_protected_areas' in self.layers:
                protected_areas = self.layers['marine_protected_areas']

                for idx, area in protected_areas.iterrows():
                    if area.geometry.contains(point):
                        return {
                            'name': area.get('name', 'Unknown'),
                            'type': area.get('type', 'unknown'),
                            'protection_level': area.get('protection_level', 'unknown'),
                            'violation': True
                        }

            return None
        except Exception as e:
            logger.error(f"Erro ao verificar área protegida: {str(e)}")
            return None

    def check_vessel_in_fishing_zone(self, lat: float, lon: float) -> Optional[Dict]:
        """
        Verificar se uma embarcação está em zona de pesca autorizada

        Args:
            lat: Latitude
            lon: Longitude

        Returns:
            Dict com informações da zona de pesca ou None
        """
        try:
            point = Point(lon, lat)

            if 'fishing_zones' in self.layers:
                fishing_zones = self.layers['fishing_zones']

                for idx, zone in fishing_zones.iterrows():
                    if zone.geometry.contains(point):
                        return {
                            'name': zone.get('name', 'Unknown'),
                            'type': zone.get('type', 'unknown'),
                            'regulation': zone.get('regulation', 'unknown'),
                            'authorized': zone.get('regulation', 'unknown') in ['open', 'seasonal']
                        }

            return None
        except Exception as e:
            logger.error(f"Erro ao verificar zona de pesca: {str(e)}")
            return None

    def get_bathymetry_data(self, lat: float, lon: float) -> Optional[Dict]:
        """
        Obter dados de batimetria para uma localização

        Args:
            lat: Latitude
            lon: Longitude

        Returns:
            Dict com dados de batimetria
        """
        try:
            # Em produção, carregar dados reais de batimetria
            # Por agora, retornar dados de exemplo
            return {
                'latitude': lat,
                'longitude': lon,
                'depth_meters': -150,  # Profundidade aproximada
                'seafloor_type': 'continental_shelf',
                'source': 'GEBCO'
            }
        except Exception as e:
            logger.error(f"Erro ao obter dados de batimetria: {str(e)}")
            return None

    def analyze_vessel_compliance(self, vessel_data: Dict) -> Dict:
        """
        Analisar conformidade de uma embarcação

        Args:
            vessel_data: Dados da embarcação

        Returns:
            Dict com análise de conformidade
        """
        try:
            lat = vessel_data.get('lat', 0)
            lon = vessel_data.get('lon', 0)
            vessel_type = vessel_data.get('type', 'unknown')

            analysis = {
                'vessel': vessel_data.get('name', 'Unknown'),
                'timestamp': vessel_data.get('last_seen', ''),
                'compliance_issues': [],
                'recommendations': []
            }

            # Verificar EEZ
            if not self.check_vessel_in_eez(lat, lon):
                analysis['compliance_issues'].append('Embarcação fora da EEZ de Angola')
                analysis['recommendations'].append('Verificar autorização para pesca em águas internacionais')

            # Verificar áreas protegidas
            protected_area = self.check_vessel_in_protected_area(lat, lon)
            if protected_area:
                analysis['compliance_issues'].append(f'Pesca em área protegida: {protected_area["name"]}')
                analysis['recommendations'].append('Sair imediatamente da área protegida')

            # Verificar zonas de pesca
            fishing_zone = self.check_vessel_in_fishing_zone(lat, lon)
            if fishing_zone and not fishing_zone['authorized']:
                analysis['compliance_issues'].append(f'Pesca em zona restrita: {fishing_zone["name"]}')
                analysis['recommendations'].append('Mover para zona autorizada')

            # Verificar tipo de embarcação vs zona
            if vessel_type == 'industrial' and fishing_zone and fishing_zone['type'] == 'artisanal':
                analysis['compliance_issues'].append('Embarcação industrial em zona artesanal')
                analysis['recommendations'].append('Embarcações industriais devem usar zonas designadas')

            analysis['compliance_status'] = 'compliant' if not analysis['compliance_issues'] else 'non_compliant'
            analysis['risk_level'] = 'high' if len(analysis['compliance_issues']) > 1 else 'medium' if analysis['compliance_issues'] else 'low'

            return analysis

        except Exception as e:
            logger.error(f"Erro ao analisar conformidade: {str(e)}")
            return {
                'vessel': vessel_data.get('name', 'Unknown'),
                'compliance_status': 'unknown',
                'error': str(e)
            }

    def get_fishing_statistics(self, time_period: str = 'month') -> Dict:
        """
        Obter estatísticas de pesca por zona

        Args:
            time_period: Período para estatísticas ('day', 'week', 'month')

        Returns:
            Dict com estatísticas
        """
        try:
            # Em produção, calcular baseado em dados reais
            # Por agora, retornar dados de exemplo
            return {
                'time_period': time_period,
                'zones': [
                    {
                        'name': 'Zona de Pesca Artesanal Norte',
                        'vessels_active': 45,
                        'fishing_hours': 320,
                        'compliance_rate': 0.92,
                        'average_catch': 125
                    },
                    {
                        'name': 'Zona de Pesca Industrial Centro',
                        'vessels_active': 12,
                        'fishing_hours': 180,
                        'compliance_rate': 0.88,
                        'average_catch': 450
                    },
                    {
                        'name': 'Zona de Pesca Artesanal Sul',
                        'vessels_active': 67,
                        'fishing_hours': 410,
                        'compliance_rate': 0.95,
                        'average_catch': 180
                    }
                ],
                'overall_statistics': {
                    'total_vessels': 124,
                    'total_fishing_hours': 910,
                    'average_compliance_rate': 0.91,
                    'total_estimated_catch': 755
                }
            }
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas de pesca: {str(e)}")
            return {}

    def export_layer_to_geojson(self, layer_name: str, output_path: str) -> bool:
        """
        Exportar uma camada para GeoJSON

        Args:
            layer_name: Nome da camada
            output_path: Caminho de saída

        Returns:
            True se exportação foi bem-sucedida
        """
        try:
            if layer_name not in self.layers:
                logger.error(f"Camada {layer_name} não encontrada")
                return False

            layer = self.layers[layer_name]
            layer.to_file(output_path, driver='GeoJSON')
            logger.info(f"Camada {layer_name} exportada para {output_path}")
            return True

        except Exception as e:
            logger.error(f"Erro ao exportar camada {layer_name}: {str(e)}")
            return False

    def get_all_layers_info(self) -> Dict:
        """
        Obter informações de todas as camadas

        Returns:
            Dict com informações das camadas
        """
        layers_info = {}

        for layer_name, layer in self.layers.items():
            layers_info[layer_name] = {
                'name': layer_name,
                'features_count': len(layer),
                'crs': str(layer.crs),
                'bounds': {
                    'minx': float(layer.total_bounds[0]),
                    'miny': float(layer.total_bounds[1]),
                    'maxx': float(layer.total_bounds[2]),
                    'maxy': float(layer.total_bounds[3])
                },
                'attributes': list(layer.columns)
            }

        return layers_info
