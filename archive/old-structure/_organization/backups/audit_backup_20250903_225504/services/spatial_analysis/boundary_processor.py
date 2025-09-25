#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🌍 Processador Avançado de Fronteiras Marítimas - BGAPP
=====================================================

Este módulo implementa um sistema robusto para processamento, validação e análise
de fronteiras marítimas, incluindo ZEE (Zonas Económicas Exclusivas), limites
territoriais e linhas costeiras.

Funcionalidades:
- Processamento de fronteiras políticas e marítimas
- Validação automática de geometrias
- Cálculo de áreas e perímetros
- Análise de sobreposições e conflitos
- Integração com Natural Earth Data
- Suporte a múltiplas projeções cartográficas

Autor: Sistema BGAPP
Data: Janeiro 2025
"""

import logging
import numpy as np
import pandas as pd
import geopandas as gpd
from typing import Dict, List, Optional, Tuple, Union, Any
from pathlib import Path
import json
from datetime import datetime
import asyncio
import aiohttp
import requests
from shapely.geometry import Point, Polygon, MultiPolygon, LineString, MultiLineString
from shapely.ops import unary_union, transform
from shapely.validation import make_valid
import pyproj
from pyproj import Transformer
import fiona
import rasterio
from rasterio.features import shapes, rasterize
from rasterio.transform import from_bounds
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.colors import ListedColormap
import seaborn as sns
from dataclasses import dataclass
import warnings
warnings.filterwarnings('ignore')

# Configuração do logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MaritimeBoundary:
    """Classe para armazenar dados de fronteiras marítimas"""
    name: str
    boundary_type: str  # 'territorial', 'eez', 'continental_shelf', 'fishing_zone'
    geometry: Union[Polygon, MultiPolygon]
    country: str
    area_km2: float
    perimeter_km: float
    created_at: datetime
    source: str = "processed"
    confidence: float = 1.0
    
@dataclass
class CoastlineSegment:
    """Classe para segmentos de linha costeira"""
    name: str
    geometry: Union[LineString, MultiLineString]
    country: str
    length_km: float
    coastal_type: str  # 'rocky', 'sandy', 'mangrove', 'delta', 'cliff'
    vulnerability_index: float  # 0-1 (vulnerabilidade à erosão/mudanças climáticas)
    
@dataclass
class BoundaryAnalysis:
    """Resultado de análise de fronteiras"""
    total_area_km2: float
    total_coastline_km: float
    boundary_count: int
    overlaps: List[Dict[str, Any]]
    gaps: List[Dict[str, Any]]
    validation_issues: List[str]
    statistics: Dict[str, float]

class BoundaryProcessor:
    """
    🌍 Processador Avançado de Fronteiras Marítimas
    
    Este serviço processa e analisa fronteiras marítimas com foco especial
    na região de Angola e águas adjacentes.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Inicializar o processador de fronteiras
        
        Args:
            config_path: Caminho para ficheiro de configuração
        """
        self.config = self._load_config(config_path)
        self.boundaries: Dict[str, MaritimeBoundary] = {}
        self.coastlines: Dict[str, CoastlineSegment] = {}
        
        # Sistemas de coordenadas
        self.wgs84 = pyproj.CRS('EPSG:4326')
        self.utm_angola = pyproj.CRS('EPSG:32733')  # UTM Zone 33S para Angola
        self.web_mercator = pyproj.CRS('EPSG:3857')
        
        # Transformadores
        self.to_utm = Transformer.from_crs(self.wgs84, self.utm_angola, always_xy=True)
        self.from_utm = Transformer.from_crs(self.utm_angola, self.wgs84, always_xy=True)
        
        # Diretórios de trabalho
        self.data_dir = Path(self.config.get('data_dir', 'data/boundaries'))
        self.output_dir = Path(self.config.get('output_dir', 'outputs/boundaries'))
        self.cache_dir = Path(self.config.get('cache_dir', 'cache/boundaries'))
        
        # Criar diretórios
        for dir_path in [self.data_dir, self.output_dir, self.cache_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
            
        logger.info("🚀 Processador de Fronteiras inicializado com sucesso")
    
    def _load_config(self, config_path: Optional[str]) -> Dict:
        """Carregar configuração do serviço"""
        default_config = {
            'data_dir': 'data/boundaries',
            'output_dir': 'outputs/boundaries',
            'cache_dir': 'cache/boundaries',
            'natural_earth_url': 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download',
            'marine_regions_url': 'https://www.marineregions.org/rest/getGazetteerRecordsByLatLon.json',
            'angola_bounds': {
                'min_lat': -18.0,
                'max_lat': -4.0,
                'min_lon': 8.0,
                'max_lon': 24.0
            },
            'buffer_distance_nm': 200,  # Milhas náuticas para ZEE
            'simplification_tolerance': 0.001,  # Graus
            'validation_tolerance': 0.0001
        }
        
        if config_path and Path(config_path).exists():
            with open(config_path, 'r', encoding='utf-8') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        
        return default_config
    
    async def download_natural_earth_data(self, scale: str = '50m') -> Dict[str, str]:
        """
        🌍 Descarregar dados do Natural Earth
        
        Args:
            scale: Escala dos dados ('10m', '50m', '110m')
            
        Returns:
            Dicionário com caminhos dos ficheiros descarregados
        """
        logger.info(f"🌍 Descarregando dados Natural Earth (escala: {scale})")
        
        datasets = {
            'countries': f'ne_{scale}_admin_0_countries.zip',
            'coastlines': f'ne_{scale}_coastline.zip',
            'ocean': f'ne_{scale}_ocean.zip',
            'maritime_boundaries': f'ne_{scale}_admin_0_maritime_indicator.zip'
        }
        
        downloaded_files = {}
        base_url = f"{self.config['natural_earth_url']}/{scale}/physical"
        
        async with aiohttp.ClientSession() as session:
            for dataset_name, filename in datasets.items():
                file_path = self.cache_dir / filename
                
                if not file_path.exists():
                    url = f"{base_url}/{filename}"
                    logger.info(f"⬇️ Descarregando {dataset_name}...")
                    
                    try:
                        async with session.get(url) as response:
                            if response.status == 200:
                                with open(file_path, 'wb') as f:
                                    f.write(await response.read())
                                logger.info(f"✅ {dataset_name} descarregado")
                            else:
                                logger.warning(f"⚠️ Erro ao descarregar {dataset_name}: {response.status}")
                    except Exception as e:
                        logger.error(f"❌ Erro ao descarregar {dataset_name}: {str(e)}")
                
                downloaded_files[dataset_name] = str(file_path)
        
        return downloaded_files
    
    def load_angola_boundaries(self) -> gpd.GeoDataFrame:
        """
        🇦🇴 Carregar fronteiras de Angola
        
        Returns:
            GeoDataFrame com fronteiras de Angola
        """
        logger.info("🇦🇴 Carregando fronteiras de Angola")
        
        # Tentar carregar de cache primeiro
        cache_path = self.cache_dir / 'angola_boundaries.geojson'
        
        if cache_path.exists():
            logger.info("📦 Carregando fronteiras do cache")
            gdf = gpd.read_file(cache_path)
        else:
            # Criar fronteiras baseadas nos limites conhecidos
            logger.info("🔧 Criando fronteiras baseadas em coordenadas conhecidas")
            
            # Coordenadas aproximadas da ZEE de Angola (baseadas em dados oficiais)
            angola_zee_coords = [
                (8.0, -4.0),    # Nordeste
                (13.0, -4.0),   # Norte (fronteira com DRC)
                (13.5, -6.0),   # Cabinda
                (12.0, -6.5),   # Costa norte
                (13.2344, -8.8383),  # Luanda
                (13.0, -12.0),  # Costa central
                (12.5, -15.0),  # Costa sul
                (11.5, -18.0),  # Sudoeste (fronteira com Namíbia)
                (8.0, -18.0),   # Sul
                (8.0, -4.0)     # Fechar polígono
            ]
            
            # Criar polígono da ZEE
            zee_polygon = Polygon(angola_zee_coords)
            
            # Linha costeira simplificada
            coastline_coords = [
                (13.5, -6.0),   # Cabinda
                (12.0, -6.5),   # Costa norte
                (13.2344, -8.8383),  # Luanda
                (13.0, -12.0),  # Costa central
                (12.5, -15.0),  # Costa sul
                (11.5, -18.0),  # Namibe
            ]
            
            coastline = LineString(coastline_coords)
            
            # Criar GeoDataFrame
            gdf = gpd.GeoDataFrame({
                'name': ['Angola_ZEE', 'Angola_Coastline'],
                'type': ['eez', 'coastline'],
                'country': ['Angola', 'Angola'],
                'geometry': [zee_polygon, coastline]
            }, crs='EPSG:4326')
            
            # Salvar no cache
            gdf.to_file(cache_path, driver='GeoJSON')
            logger.info("💾 Fronteiras salvas no cache")
        
        return gdf
    
    def calculate_maritime_zones(
        self, 
        coastline: Union[LineString, MultiLineString],
        territorial_limit_nm: float = 12,
        eez_limit_nm: float = 200
    ) -> Dict[str, Polygon]:
        """
        🌊 Calcular zonas marítimas a partir da linha costeira
        
        Args:
            coastline: Linha costeira
            territorial_limit_nm: Limite das águas territoriais (milhas náuticas)
            eez_limit_nm: Limite da ZEE (milhas náuticas)
            
        Returns:
            Dicionário com zonas marítimas
        """
        logger.info("🌊 Calculando zonas marítimas")
        
        # Converter milhas náuticas para graus (aproximação)
        nm_to_degrees = 1.0 / 60.0  # 1 grau = 60 milhas náuticas (aproximadamente)
        
        territorial_buffer_deg = territorial_limit_nm * nm_to_degrees
        eez_buffer_deg = eez_limit_nm * nm_to_degrees
        
        # Criar buffers
        territorial_waters = coastline.buffer(territorial_buffer_deg)
        eez_zone = coastline.buffer(eez_buffer_deg)
        
        # Zona contígua (entre 12 e 24 milhas náuticas)
        contiguous_zone = coastline.buffer(24 * nm_to_degrees).difference(territorial_waters)
        
        # ZEE (entre 12 e 200 milhas náuticas)
        eez_exclusive = eez_zone.difference(territorial_waters)
        
        zones = {
            'territorial_waters': territorial_waters,
            'contiguous_zone': contiguous_zone,
            'eez': eez_zone,
            'eez_exclusive': eez_exclusive
        }
        
        logger.info("✅ Zonas marítimas calculadas")
        return zones
    
    def validate_boundary_geometry(self, geometry: Union[Polygon, MultiPolygon]) -> Dict[str, Any]:
        """
        ✅ Validar geometria de fronteira
        
        Args:
            geometry: Geometria a validar
            
        Returns:
            Relatório de validação
        """
        validation_report = {
            'is_valid': True,
            'issues': [],
            'fixed_geometry': geometry,
            'area_km2': 0,
            'perimeter_km': 0
        }
        
        try:
            # Verificar se é válida
            if not geometry.is_valid:
                validation_report['is_valid'] = False
                validation_report['issues'].append('Geometria inválida')
                
                # Tentar corrigir
                fixed_geom = make_valid(geometry)
                if fixed_geom.is_valid:
                    validation_report['fixed_geometry'] = fixed_geom
                    validation_report['issues'].append('Geometria corrigida automaticamente')
                    geometry = fixed_geom
            
            # Verificar se está vazia
            if geometry.is_empty:
                validation_report['is_valid'] = False
                validation_report['issues'].append('Geometria vazia')
                return validation_report
            
            # Calcular área e perímetro (converter para UTM para cálculos precisos)
            if isinstance(geometry, (Polygon, MultiPolygon)):
                # Transformar para UTM
                geom_utm = transform(self.to_utm.transform, geometry)
                
                # Área em km²
                area_m2 = geom_utm.area
                validation_report['area_km2'] = area_m2 / 1_000_000
                
                # Perímetro em km
                perimeter_m = geom_utm.length
                validation_report['perimeter_km'] = perimeter_m / 1000
            
            # Verificar auto-intersecções
            if hasattr(geometry, 'exterior') and geometry.exterior.is_ring and not geometry.exterior.is_simple:
                validation_report['issues'].append('Auto-intersecções detectadas')
            
            # Verificar buracos
            if isinstance(geometry, Polygon) and len(geometry.interiors) > 0:
                validation_report['issues'].append(f'{len(geometry.interiors)} buracos detectados')
            
            logger.info(f"✅ Validação concluída: {len(validation_report['issues'])} issues encontradas")
            
        except Exception as e:
            validation_report['is_valid'] = False
            validation_report['issues'].append(f'Erro na validação: {str(e)}')
            logger.error(f"❌ Erro na validação: {str(e)}")
        
        return validation_report
    
    def detect_boundary_overlaps(
        self, 
        boundaries: List[MaritimeBoundary],
        tolerance: float = 0.001
    ) -> List[Dict[str, Any]]:
        """
        🔍 Detectar sobreposições entre fronteiras
        
        Args:
            boundaries: Lista de fronteiras
            tolerance: Tolerância para sobreposições (graus)
            
        Returns:
            Lista de sobreposições detectadas
        """
        logger.info("🔍 Detectando sobreposições entre fronteiras")
        
        overlaps = []
        
        for i, boundary1 in enumerate(boundaries):
            for j, boundary2 in enumerate(boundaries[i+1:], i+1):
                try:
                    # Verificar intersecção
                    intersection = boundary1.geometry.intersection(boundary2.geometry)
                    
                    if not intersection.is_empty:
                        # Calcular área de sobreposição
                        if isinstance(intersection, (Polygon, MultiPolygon)):
                            overlap_area_m2 = transform(self.to_utm.transform, intersection).area
                            overlap_area_km2 = overlap_area_m2 / 1_000_000
                            
                            if overlap_area_km2 > tolerance:
                                overlap_info = {
                                    'boundary1': boundary1.name,
                                    'boundary2': boundary2.name,
                                    'overlap_area_km2': overlap_area_km2,
                                    'overlap_percentage_1': (overlap_area_km2 / boundary1.area_km2) * 100,
                                    'overlap_percentage_2': (overlap_area_km2 / boundary2.area_km2) * 100,
                                    'geometry': intersection
                                }
                                overlaps.append(overlap_info)
                                
                except Exception as e:
                    logger.warning(f"⚠️ Erro ao verificar sobreposição: {str(e)}")
        
        logger.info(f"✅ Detectadas {len(overlaps)} sobreposições")
        return overlaps
    
    def analyze_coastline_vulnerability(self, coastline: CoastlineSegment) -> Dict[str, float]:
        """
        🌊 Analisar vulnerabilidade da linha costeira
        
        Args:
            coastline: Segmento de linha costeira
            
        Returns:
            Análise de vulnerabilidade
        """
        logger.info(f"🌊 Analisando vulnerabilidade: {coastline.name}")
        
        # Fatores de vulnerabilidade baseados no tipo costeiro
        vulnerability_factors = {
            'sandy': 0.8,      # Praias arenosas - alta vulnerabilidade
            'mangrove': 0.4,   # Mangais - baixa vulnerabilidade (proteção natural)
            'rocky': 0.2,      # Costa rochosa - muito baixa vulnerabilidade
            'cliff': 0.1,      # Falésias - baixíssima vulnerabilidade
            'delta': 0.9,      # Deltas - muito alta vulnerabilidade
            'unknown': 0.5     # Desconhecido - vulnerabilidade média
        }
        
        base_vulnerability = vulnerability_factors.get(coastline.coastal_type, 0.5)
        
        # Ajustar baseado no comprimento (costas mais longas podem ser mais vulneráveis)
        length_factor = min(1.0, coastline.length_km / 100.0)  # Normalizar por 100km
        
        # Calcular vulnerabilidade final
        final_vulnerability = min(1.0, base_vulnerability + (length_factor * 0.1))
        
        analysis = {
            'base_vulnerability': base_vulnerability,
            'length_factor': length_factor,
            'final_vulnerability': final_vulnerability,
            'risk_level': 'Low' if final_vulnerability < 0.3 else 
                         'Medium' if final_vulnerability < 0.7 else 'High',
            'recommendations': self._generate_vulnerability_recommendations(
                coastline.coastal_type, final_vulnerability
            )
        }
        
        logger.info(f"✅ Vulnerabilidade analisada: {analysis['risk_level']}")
        return analysis
    
    def _generate_vulnerability_recommendations(
        self, 
        coastal_type: str, 
        vulnerability: float
    ) -> List[str]:
        """Gerar recomendações baseadas na vulnerabilidade"""
        recommendations = []
        
        if vulnerability > 0.7:
            recommendations.extend([
                "Implementar sistemas de monitorização costeira",
                "Considerar medidas de proteção costeira",
                "Desenvolver planos de evacuação"
            ])
        
        if coastal_type == 'mangrove':
            recommendations.append("Proteger e restaurar ecossistemas de mangal")
        elif coastal_type == 'sandy':
            recommendations.extend([
                "Monitorizar erosão de praias",
                "Considerar nutrição artificial de praias"
            ])
        elif coastal_type == 'delta':
            recommendations.extend([
                "Monitorizar subsidência do terreno",
                "Gerir caudais fluviais"
            ])
        
        return recommendations
    
    def create_boundary_buffer_zones(
        self, 
        boundary: MaritimeBoundary,
        buffer_distances_km: List[float]
    ) -> Dict[str, Polygon]:
        """
        📏 Criar zonas de buffer em torno de fronteiras
        
        Args:
            boundary: Fronteira base
            buffer_distances_km: Distâncias de buffer em km
            
        Returns:
            Dicionário com zonas de buffer
        """
        logger.info(f"📏 Criando zonas de buffer para {boundary.name}")
        
        buffer_zones = {}
        
        # Converter geometria para UTM para cálculos precisos
        geom_utm = transform(self.to_utm.transform, boundary.geometry)
        
        for distance_km in buffer_distances_km:
            distance_m = distance_km * 1000
            
            # Criar buffer em UTM
            buffer_utm = geom_utm.buffer(distance_m)
            
            # Converter de volta para WGS84
            buffer_wgs84 = transform(self.from_utm.transform, buffer_utm)
            
            buffer_zones[f'buffer_{distance_km}km'] = buffer_wgs84
        
        logger.info(f"✅ Criadas {len(buffer_zones)} zonas de buffer")
        return buffer_zones
    
    def visualize_boundaries(
        self, 
        boundaries: List[MaritimeBoundary],
        coastlines: Optional[List[CoastlineSegment]] = None,
        save_path: Optional[str] = None
    ) -> None:
        """
        📊 Visualizar fronteiras marítimas
        
        Args:
            boundaries: Lista de fronteiras
            coastlines: Lista de linhas costeiras (opcional)
            save_path: Caminho para salvar a visualização
        """
        logger.info("📊 Criando visualização de fronteiras")
        
        fig, ax = plt.subplots(1, 1, figsize=(15, 12))
        
        # Configurar limites para Angola
        bounds = self.config['angola_bounds']
        ax.set_xlim(bounds['min_lon'], bounds['max_lon'])
        ax.set_ylim(bounds['min_lat'], bounds['max_lat'])
        
        # Cores para diferentes tipos de fronteiras
        boundary_colors = {
            'territorial': '#1f77b4',
            'eez': '#ff7f0e',
            'continental_shelf': '#2ca02c',
            'fishing_zone': '#d62728'
        }
        
        # Plotar fronteiras
        for i, boundary in enumerate(boundaries):
            color = boundary_colors.get(boundary.boundary_type, '#7f7f7f')
            
            if isinstance(boundary.geometry, Polygon):
                x, y = boundary.geometry.exterior.xy
                ax.plot(x, y, color=color, linewidth=2, 
                       label=f'{boundary.name} ({boundary.boundary_type})')
                ax.fill(x, y, color=color, alpha=0.3)
            elif isinstance(boundary.geometry, MultiPolygon):
                for polygon in boundary.geometry.geoms:
                    x, y = polygon.exterior.xy
                    ax.plot(x, y, color=color, linewidth=2)
                    ax.fill(x, y, color=color, alpha=0.3)
        
        # Plotar linhas costeiras se fornecidas
        if coastlines:
            for coastline in coastlines:
                if isinstance(coastline.geometry, LineString):
                    x, y = coastline.geometry.xy
                    ax.plot(x, y, color='brown', linewidth=3, 
                           label=f'Coastline: {coastline.name}')
                elif isinstance(coastline.geometry, MultiLineString):
                    for line in coastline.geometry.geoms:
                        x, y = line.xy
                        ax.plot(x, y, color='brown', linewidth=3)
        
        # Configurar mapa
        ax.set_xlabel('Longitude')
        ax.set_ylabel('Latitude')
        ax.set_title('Fronteiras Marítimas - Angola', fontsize=16, fontweight='bold')
        ax.grid(True, alpha=0.3)
        ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        
        # Adicionar pontos de referência
        reference_points = {
            'Luanda': (-8.8383, 13.2344),
            'Benguela': (-12.5763, 13.4055),
            'Namibe': (-15.1961, 12.1522),
            'Cabinda': (-5.5500, 12.2000)
        }
        
        for city, (lat, lon) in reference_points.items():
            ax.plot(lon, lat, 'ro', markersize=8)
            ax.annotate(city, (lon, lat), xytext=(5, 5), 
                       textcoords='offset points', fontsize=10, fontweight='bold')
        
        plt.tight_layout()
        
        # Salvar se especificado
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"💾 Visualização salva em: {save_path}")
        
        plt.show()
    
    def export_boundaries(
        self, 
        boundaries: List[MaritimeBoundary],
        format: str = 'geojson',
        filename: Optional[str] = None
    ) -> str:
        """
        💾 Exportar fronteiras para ficheiro
        
        Args:
            boundaries: Lista de fronteiras
            format: Formato de exportação ('geojson', 'shapefile')
            filename: Nome do ficheiro (opcional)
            
        Returns:
            Caminho do ficheiro exportado
        """
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"maritime_boundaries_{timestamp}"
        
        # Preparar dados para exportação
        data = []
        for boundary in boundaries:
            data.append({
                'name': boundary.name,
                'type': boundary.boundary_type,
                'country': boundary.country,
                'area_km2': boundary.area_km2,
                'perimeter_km': boundary.perimeter_km,
                'source': boundary.source,
                'confidence': boundary.confidence,
                'created_at': boundary.created_at.isoformat(),
                'geometry': boundary.geometry
            })
        
        gdf = gpd.GeoDataFrame(data, crs='EPSG:4326')
        
        if format.lower() == 'geojson':
            export_path = self.output_dir / f"{filename}.geojson"
            gdf.to_file(export_path, driver='GeoJSON')
        elif format.lower() == 'shapefile':
            export_path = self.output_dir / f"{filename}.shp"
            gdf.to_file(export_path, driver='ESRI Shapefile')
        else:
            raise ValueError(f"❌ Formato {format} não suportado")
        
        logger.info(f"💾 Fronteiras exportadas para: {export_path}")
        return str(export_path)

# Exemplo de uso
if __name__ == "__main__":
    async def main():
        # Inicializar processador
        processor = BoundaryProcessor()
        
        print("🌍 Iniciando processamento de fronteiras marítimas")
        
        try:
            # Carregar fronteiras de Angola
            angola_gdf = processor.load_angola_boundaries()
            print(f"✅ Carregadas {len(angola_gdf)} fronteiras de Angola")
            
            # Criar objetos MaritimeBoundary
            boundaries = []
            for idx, row in angola_gdf.iterrows():
                if row['type'] == 'eez':
                    validation = processor.validate_boundary_geometry(row['geometry'])
                    
                    boundary = MaritimeBoundary(
                        name=row['name'],
                        boundary_type='eez',
                        geometry=validation['fixed_geometry'],
                        country=row['country'],
                        area_km2=validation['area_km2'],
                        perimeter_km=validation['perimeter_km'],
                        created_at=datetime.now()
                    )
                    boundaries.append(boundary)
            
            # Visualizar fronteiras
            processor.visualize_boundaries(boundaries)
            
            # Exportar resultados
            export_path = processor.export_boundaries(boundaries)
            print(f"💾 Fronteiras exportadas: {export_path}")
            
        except Exception as e:
            print(f"❌ Erro: {str(e)}")
    
    # Executar exemplo
    asyncio.run(main())
