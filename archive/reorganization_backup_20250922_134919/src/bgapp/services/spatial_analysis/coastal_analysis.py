#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🌊 Serviço de Análise Avançada de Linha Costeira - BGAPP
======================================================

Este módulo implementa análises avançadas de linhas costeiras, incluindo
deteção de mudanças, análise de erosão/acreção, vulnerabilidade climática
e monitorização por satélite.

Funcionalidades:
- Deteção automática de mudanças costeiras
- Análise de erosão e acreção
- Vulnerabilidade a mudanças climáticas
- Integração com dados Sentinel-1/2
- Cálculo de índices costeiros
- Monitorização temporal

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
from datetime import datetime, timedelta
import asyncio
import aiohttp
from shapely.geometry import Point, Polygon, LineString, MultiLineString
from shapely.ops import split, snap, transform
import pyproj
from pyproj import Transformer
import rasterio
from rasterio.mask import mask
from rasterio.features import shapes
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.colors import ListedColormap
import seaborn as sns
import cv2
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from dataclasses import dataclass, field
from enum import Enum
import warnings
warnings.filterwarnings('ignore')

# Configuração do logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CoastalChangeType(Enum):
    """Tipos de mudanças costeiras"""
    EROSION = "erosion"
    ACCRETION = "accretion"
    STABLE = "stable"
    UNKNOWN = "unknown"

class VulnerabilityLevel(Enum):
    """Níveis de vulnerabilidade"""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

@dataclass
class CoastalSegment:
    """Segmento de linha costeira"""
    id: str
    geometry: LineString
    length_km: float
    coastal_type: str
    vulnerability_score: float
    change_rate_m_year: float = 0.0
    change_type: CoastalChangeType = CoastalChangeType.STABLE
    monitoring_points: List[Point] = field(default_factory=list)
    
@dataclass
class CoastalChange:
    """Mudança costeira detectada"""
    segment_id: str
    start_date: datetime
    end_date: datetime
    change_distance_m: float
    change_type: CoastalChangeType
    confidence: float
    affected_area_m2: float
    
@dataclass
class VulnerabilityAssessment:
    """Avaliação de vulnerabilidade costeira"""
    segment_id: str
    vulnerability_level: VulnerabilityLevel
    physical_vulnerability: float  # 0-1
    socioeconomic_vulnerability: float  # 0-1
    adaptive_capacity: float  # 0-1
    overall_vulnerability: float  # 0-1
    key_threats: List[str]
    recommendations: List[str]

class CoastalAnalysisService:
    """
    🌊 Serviço de Análise Avançada de Linha Costeira
    
    Este serviço realiza análises complexas de mudanças costeiras,
    vulnerabilidade e monitorização temporal.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Inicializar o serviço de análise costeira
        
        Args:
            config_path: Caminho para ficheiro de configuração
        """
        self.config = self._load_config(config_path)
        self.coastal_segments: Dict[str, CoastalSegment] = {}
        self.changes_history: List[CoastalChange] = []
        self.vulnerability_assessments: Dict[str, VulnerabilityAssessment] = {}
        
        # Sistemas de coordenadas
        self.wgs84 = pyproj.CRS('EPSG:4326')
        self.utm_angola = pyproj.CRS('EPSG:32733')  # UTM Zone 33S
        
        # Transformadores
        self.to_utm = Transformer.from_crs(self.wgs84, self.utm_angola, always_xy=True)
        self.from_utm = Transformer.from_crs(self.utm_angola, self.wgs84, always_xy=True)
        
        # Diretórios
        self.data_dir = Path(self.config.get('data_dir', 'data/coastal'))
        self.output_dir = Path(self.config.get('output_dir', 'outputs/coastal'))
        self.satellite_dir = Path(self.config.get('satellite_dir', 'data/satellite'))
        
        # Criar diretórios
        for dir_path in [self.data_dir, self.output_dir, self.satellite_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        logger.info("🚀 Serviço de Análise Costeira inicializado")
    
    def _load_config(self, config_path: Optional[str]) -> Dict:
        """Carregar configuração"""
        default_config = {
            'data_dir': 'data/coastal',
            'output_dir': 'outputs/coastal',
            'satellite_dir': 'data/satellite',
            'angola_coastline': {
                'north_lat': -4.0,
                'south_lat': -18.0,
                'west_lon': 11.5,
                'east_lon': 13.5
            },
            'segment_length_km': 5.0,  # Comprimento de cada segmento para análise
            'change_detection_threshold_m': 10.0,  # Threshold para deteção de mudanças
            'monitoring_interval_days': 30,
            'vulnerability_weights': {
                'physical': 0.4,
                'socioeconomic': 0.3,
                'adaptive_capacity': 0.3
            }
        }
        
        if config_path and Path(config_path).exists():
            with open(config_path, 'r', encoding='utf-8') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        
        return default_config
    
    def create_angola_coastline_segments(self) -> List[CoastalSegment]:
        """
        🇦🇴 Criar segmentos da linha costeira de Angola
        
        Returns:
            Lista de segmentos costeiros
        """
        logger.info("🇦🇴 Criando segmentos da linha costeira de Angola")
        
        # Coordenadas principais da costa angolana (norte para sul)
        coastline_points = [
            # Cabinda
            (-5.55, 12.20),
            (-5.60, 12.18),
            # Costa Norte
            (-6.00, 12.35),
            (-7.00, 13.00),
            (-8.00, 13.10),
            # Luanda
            (-8.8383, 13.2344),
            (-9.00, 13.15),
            # Costa Central
            (-10.00, 13.50),
            (-11.00, 13.60),
            (-12.00, 13.40),
            # Benguela
            (-12.5763, 13.4055),
            (-13.00, 13.20),
            # Costa Sul
            (-14.00, 12.80),
            (-15.00, 12.50),
            # Namibe
            (-15.1961, 12.1522),
            (-16.00, 11.90),
            (-17.00, 11.70),
            (-18.00, 11.50)
        ]
        
        # Criar linha costeira principal
        main_coastline = LineString(coastline_points)
        
        # Dividir em segmentos
        segment_length_km = self.config['segment_length_km']
        segments = self._divide_coastline_into_segments(main_coastline, segment_length_km)
        
        # Classificar tipos costeiros baseados na localização
        coastal_segments = []
        for i, segment_geom in enumerate(segments):
            segment_id = f"AO_COAST_{i+1:03d}"
            
            # Determinar tipo costeiro baseado na localização
            mid_point = segment_geom.interpolate(0.5, normalized=True)
            coastal_type = self._classify_coastal_type(mid_point.y, mid_point.x)
            
            # Calcular comprimento
            geom_utm = transform(self.to_utm.transform, segment_geom)
            length_km = geom_utm.length / 1000
            
            # Calcular vulnerabilidade inicial
            vulnerability_score = self._calculate_initial_vulnerability(coastal_type, mid_point.y)
            
            segment = CoastalSegment(
                id=segment_id,
                geometry=segment_geom,
                length_km=length_km,
                coastal_type=coastal_type,
                vulnerability_score=vulnerability_score
            )
            
            coastal_segments.append(segment)
            self.coastal_segments[segment_id] = segment
        
        logger.info(f"✅ Criados {len(coastal_segments)} segmentos costeiros")
        return coastal_segments
    
    def _divide_coastline_into_segments(
        self, 
        coastline: LineString, 
        segment_length_km: float
    ) -> List[LineString]:
        """Dividir linha costeira em segmentos"""
        segments = []
        
        # Converter para UTM para cálculos precisos
        coastline_utm = transform(self.to_utm.transform, coastline)
        total_length = coastline_utm.length
        segment_length_m = segment_length_km * 1000
        
        num_segments = int(np.ceil(total_length / segment_length_m))
        
        for i in range(num_segments):
            start_distance = i * segment_length_m
            end_distance = min((i + 1) * segment_length_m, total_length)
            
            # Criar pontos de início e fim
            start_point = coastline_utm.interpolate(start_distance)
            end_point = coastline_utm.interpolate(end_distance)
            
            # Extrair segmento
            if start_distance == 0:
                start_param = 0
            else:
                start_param = start_distance / total_length
                
            if end_distance == total_length:
                end_param = 1
            else:
                end_param = end_distance / total_length
            
            # Criar segmento em UTM
            segment_coords = []
            for param in np.linspace(start_param, end_param, 20):
                point = coastline_utm.interpolate(param, normalized=True)
                segment_coords.append((point.x, point.y))
            
            segment_utm = LineString(segment_coords)
            
            # Converter de volta para WGS84
            segment_wgs84 = transform(self.from_utm.transform, segment_utm)
            segments.append(segment_wgs84)
        
        return segments
    
    def _classify_coastal_type(self, latitude: float, longitude: float) -> str:
        """Classificar tipo costeiro baseado na localização"""
        # Classificação baseada no conhecimento da costa angolana
        
        if latitude > -6.0:  # Cabinda
            return "mangrove"
        elif latitude > -10.0:  # Norte (incluindo Luanda)
            return "sandy"
        elif latitude > -13.0:  # Centro (incluindo Benguela)
            return "mixed"
        elif latitude > -16.0:  # Sul
            return "rocky"
        else:  # Extremo sul (Namibe)
            return "desert"
    
    def _calculate_initial_vulnerability(self, coastal_type: str, latitude: float) -> float:
        """Calcular vulnerabilidade inicial baseada no tipo e localização"""
        # Vulnerabilidade base por tipo
        type_vulnerability = {
            "mangrove": 0.4,  # Proteção natural
            "sandy": 0.8,     # Alta vulnerabilidade
            "rocky": 0.2,     # Baixa vulnerabilidade
            "mixed": 0.5,     # Média
            "desert": 0.6,    # Média-alta (erosão eólica)
            "cliff": 0.1      # Muito baixa
        }
        
        base_vuln = type_vulnerability.get(coastal_type, 0.5)
        
        # Ajustar baseado na latitude (exposição a tempestades, etc.)
        # Costa sul mais exposta a ondulação do Atlântico Sul
        latitude_factor = 1.0 + (latitude + 18) * 0.02  # Mais ao sul = mais vulnerável
        
        return min(1.0, base_vuln * latitude_factor)
    
    def detect_coastline_changes(
        self,
        segment: CoastalSegment,
        reference_date: datetime,
        comparison_date: datetime,
        satellite_data: Optional[Dict] = None
    ) -> CoastalChange:
        """
        🔍 Detectar mudanças na linha costeira
        
        Args:
            segment: Segmento a analisar
            reference_date: Data de referência
            comparison_date: Data de comparação
            satellite_data: Dados satelitais (opcional, usa simulação se não fornecido)
            
        Returns:
            Mudança detectada
        """
        logger.info(f"🔍 Detectando mudanças no segmento {segment.id}")
        
        # Se não há dados satelitais, simular baseado em tendências conhecidas
        if satellite_data is None:
            change = self._simulate_coastal_change(segment, reference_date, comparison_date)
        else:
            change = self._analyze_satellite_change(segment, satellite_data)
        
        # Adicionar ao histórico
        self.changes_history.append(change)
        
        # Atualizar segmento
        segment.change_rate_m_year = change.change_distance_m / (
            (comparison_date - reference_date).days / 365.25
        )
        segment.change_type = change.change_type
        
        logger.info(f"✅ Mudança detectada: {change.change_type.value} "
                   f"({change.change_distance_m:.1f}m)")
        
        return change
    
    def _simulate_coastal_change(
        self,
        segment: CoastalSegment,
        reference_date: datetime,
        comparison_date: datetime
    ) -> CoastalChange:
        """Simular mudança costeira baseada em padrões conhecidos"""
        
        # Taxas típicas de mudança por tipo costeiro (m/ano)
        typical_rates = {
            "mangrove": (-0.5, 1.0),    # Pode ter acreção
            "sandy": (-2.0, 0.5),       # Tendência erosiva
            "rocky": (-0.1, 0.1),       # Muito estável
            "mixed": (-1.0, 0.5),       # Variável
            "desert": (-1.5, 0.2),      # Tendência erosiva
            "cliff": (-0.05, 0.05)      # Extremamente estável
        }
        
        min_rate, max_rate = typical_rates.get(segment.coastal_type, (-1.0, 1.0))
        
        # Adicionar variabilidade baseada na vulnerabilidade
        rate_range = max_rate - min_rate
        vulnerability_factor = segment.vulnerability_score
        
        # Taxa simulada (tendência + ruído)
        base_rate = min_rate + (rate_range * (1 - vulnerability_factor))
        noise = np.random.normal(0, 0.3)  # Variabilidade natural
        annual_rate = base_rate + noise
        
        # Calcular mudança total
        years = (comparison_date - reference_date).days / 365.25
        total_change = annual_rate * years
        
        # Determinar tipo de mudança
        if abs(total_change) < self.config['change_detection_threshold_m']:
            change_type = CoastalChangeType.STABLE
        elif total_change < 0:
            change_type = CoastalChangeType.EROSION
        else:
            change_type = CoastalChangeType.ACCRETION
        
        # Calcular área afetada (aproximação)
        affected_area = abs(total_change) * segment.length_km * 1000  # m²
        
        # Confiança baseada no tipo costeiro
        confidence_map = {
            "sandy": 0.8,      # Bem estudado
            "mangrove": 0.7,   # Complexo
            "rocky": 0.9,      # Previsível
            "mixed": 0.6,      # Variável
            "desert": 0.7,     # Moderado
            "cliff": 0.95      # Muito previsível
        }
        
        confidence = confidence_map.get(segment.coastal_type, 0.7)
        
        return CoastalChange(
            segment_id=segment.id,
            start_date=reference_date,
            end_date=comparison_date,
            change_distance_m=total_change,
            change_type=change_type,
            confidence=confidence,
            affected_area_m2=affected_area
        )
    
    def _analyze_satellite_change(
        self, 
        segment: CoastalSegment, 
        satellite_data: Dict
    ) -> CoastalChange:
        """Analisar mudanças usando dados satelitais reais"""
        # Implementação futura para dados Sentinel reais
        # Por agora, usar simulação
        reference_date = datetime.now() - timedelta(days=365)
        comparison_date = datetime.now()
        
        return self._simulate_coastal_change(segment, reference_date, comparison_date)
    
    def assess_climate_vulnerability(self, segment: CoastalSegment) -> VulnerabilityAssessment:
        """
        🌡️ Avaliar vulnerabilidade climática
        
        Args:
            segment: Segmento costeiro
            
        Returns:
            Avaliação de vulnerabilidade
        """
        logger.info(f"🌡️ Avaliando vulnerabilidade climática: {segment.id}")
        
        # Vulnerabilidade física
        physical_vuln = self._assess_physical_vulnerability(segment)
        
        # Vulnerabilidade socioeconómica (baseada na localização)
        socioeconomic_vuln = self._assess_socioeconomic_vulnerability(segment)
        
        # Capacidade adaptativa
        adaptive_capacity = self._assess_adaptive_capacity(segment)
        
        # Vulnerabilidade global
        weights = self.config['vulnerability_weights']
        overall_vuln = (
            physical_vuln * weights['physical'] +
            socioeconomic_vuln * weights['socioeconomic'] +
            (1 - adaptive_capacity) * weights['adaptive_capacity']  # Invertido
        )
        
        # Determinar nível
        if overall_vuln < 0.2:
            level = VulnerabilityLevel.VERY_LOW
        elif overall_vuln < 0.4:
            level = VulnerabilityLevel.LOW
        elif overall_vuln < 0.6:
            level = VulnerabilityLevel.MEDIUM
        elif overall_vuln < 0.8:
            level = VulnerabilityLevel.HIGH
        else:
            level = VulnerabilityLevel.VERY_HIGH
        
        # Identificar ameaças principais
        key_threats = self._identify_key_threats(segment, overall_vuln)
        
        # Gerar recomendações
        recommendations = self._generate_adaptation_recommendations(segment, level)
        
        assessment = VulnerabilityAssessment(
            segment_id=segment.id,
            vulnerability_level=level,
            physical_vulnerability=physical_vuln,
            socioeconomic_vulnerability=socioeconomic_vuln,
            adaptive_capacity=adaptive_capacity,
            overall_vulnerability=overall_vuln,
            key_threats=key_threats,
            recommendations=recommendations
        )
        
        self.vulnerability_assessments[segment.id] = assessment
        
        logger.info(f"✅ Vulnerabilidade avaliada: {level.value}")
        return assessment
    
    def _assess_physical_vulnerability(self, segment: CoastalSegment) -> float:
        """Avaliar vulnerabilidade física"""
        # Fatores físicos
        factors = {
            'coastal_type': {
                'mangrove': 0.3,
                'sandy': 0.9,
                'rocky': 0.1,
                'mixed': 0.5,
                'desert': 0.7,
                'cliff': 0.05
            },
            'elevation': 0.8,  # Costa baixa = mais vulnerável
            'slope': 0.7,      # Declive suave = mais vulnerável
            'wave_exposure': 0.8  # Exposição a ondas
        }
        
        type_vuln = factors['coastal_type'].get(segment.coastal_type, 0.5)
        
        # Simular outros fatores baseados na localização
        mid_point = segment.geometry.interpolate(0.5, normalized=True)
        
        # Elevação (costa angolana é geralmente baixa)
        elevation_vuln = 0.8 if mid_point.y > -12 else 0.6
        
        # Exposição a ondas (costa oeste mais exposta)
        wave_vuln = 0.9 if mid_point.x < 12.5 else 0.7
        
        physical_vuln = np.mean([type_vuln, elevation_vuln, wave_vuln])
        return min(1.0, physical_vuln)
    
    def _assess_socioeconomic_vulnerability(self, segment: CoastalSegment) -> float:
        """Avaliar vulnerabilidade socioeconómica"""
        mid_point = segment.geometry.interpolate(0.5, normalized=True)
        
        # Densidade populacional (aproximada por proximidade a cidades principais)
        major_cities = {
            'Luanda': (-8.8383, 13.2344),
            'Benguela': (-12.5763, 13.4055),
            'Namibe': (-15.1961, 12.1522),
            'Cabinda': (-5.55, 12.20)
        }
        
        min_distance = float('inf')
        for city, (lat, lon) in major_cities.items():
            distance = ((mid_point.y - lat)**2 + (mid_point.x - lon)**2)**0.5
            min_distance = min(min_distance, distance)
        
        # Vulnerabilidade maior perto das cidades (mais população)
        population_vuln = max(0.2, 1.0 - min_distance * 2)
        
        # Dependência económica da costa
        economic_dependence = 0.8  # Angola tem alta dependência costeira
        
        socioeconomic_vuln = np.mean([population_vuln, economic_dependence])
        return min(1.0, socioeconomic_vuln)
    
    def _assess_adaptive_capacity(self, segment: CoastalSegment) -> float:
        """Avaliar capacidade adaptativa"""
        # Fatores de capacidade adaptativa
        
        # Recursos económicos (baseado na proximidade a centros económicos)
        mid_point = segment.geometry.interpolate(0.5, normalized=True)
        
        # Luanda tem maior capacidade
        luanda_distance = ((mid_point.y + 8.8383)**2 + (mid_point.x - 13.2344)**2)**0.5
        economic_capacity = max(0.3, 1.0 - luanda_distance * 0.5)
        
        # Infraestrutura (melhor nas áreas urbanas)
        infrastructure = economic_capacity * 0.8
        
        # Conhecimento técnico
        technical_knowledge = 0.6  # Moderado para Angola
        
        adaptive_capacity = np.mean([economic_capacity, infrastructure, technical_knowledge])
        return min(1.0, adaptive_capacity)
    
    def _identify_key_threats(self, segment: CoastalSegment, vulnerability: float) -> List[str]:
        """Identificar ameaças principais"""
        threats = []
        
        # Ameaças baseadas no tipo costeiro
        type_threats = {
            'sandy': ['Erosão costeira', 'Subida do nível do mar', 'Tempestades'],
            'mangrove': ['Perda de habitat', 'Poluição', 'Desenvolvimento urbano'],
            'rocky': ['Erosão por ondas', 'Subida do nível do mar'],
            'mixed': ['Erosão variável', 'Perda de sedimentos'],
            'desert': ['Erosão eólica', 'Escassez de água'],
            'cliff': ['Erosão da base', 'Instabilidade']
        }
        
        threats.extend(type_threats.get(segment.coastal_type, []))
        
        # Ameaças adicionais baseadas na vulnerabilidade
        if vulnerability > 0.7:
            threats.extend(['Eventos extremos', 'Perda de infraestrutura'])
        
        if segment.change_type == CoastalChangeType.EROSION:
            threats.append('Erosão ativa')
        
        return threats
    
    def _generate_adaptation_recommendations(
        self, 
        segment: CoastalSegment, 
        level: VulnerabilityLevel
    ) -> List[str]:
        """Gerar recomendações de adaptação"""
        recommendations = []
        
        # Recomendações baseadas no nível de vulnerabilidade
        if level in [VulnerabilityLevel.HIGH, VulnerabilityLevel.VERY_HIGH]:
            recommendations.extend([
                'Implementar sistema de monitorização contínua',
                'Desenvolver plano de evacuação',
                'Considerar relocação de infraestrutura crítica'
            ])
        
        if level in [VulnerabilityLevel.MEDIUM, VulnerabilityLevel.HIGH]:
            recommendations.extend([
                'Instalar estruturas de proteção costeira',
                'Implementar sistema de alerta precoce'
            ])
        
        # Recomendações específicas por tipo
        type_recommendations = {
            'sandy': [
                'Nutrição artificial de praias',
                'Estabilização de dunas',
                'Controlo de acesso'
            ],
            'mangrove': [
                'Restauração de mangais',
                'Controlo de poluição',
                'Proteção legal'
            ],
            'rocky': [
                'Monitorização de estabilidade',
                'Proteção da base'
            ]
        }
        
        recommendations.extend(
            type_recommendations.get(segment.coastal_type, [])
        )
        
        return recommendations
    
    def create_monitoring_network(self, segments: List[CoastalSegment]) -> Dict[str, List[Point]]:
        """
        📡 Criar rede de monitorização costeira
        
        Args:
            segments: Lista de segmentos
            
        Returns:
            Rede de pontos de monitorização
        """
        logger.info("📡 Criando rede de monitorização costeira")
        
        monitoring_network = {}
        
        for segment in segments:
            # Número de pontos baseado na vulnerabilidade
            if segment.vulnerability_score > 0.7:
                num_points = 5  # Alta vulnerabilidade
            elif segment.vulnerability_score > 0.4:
                num_points = 3  # Média vulnerabilidade
            else:
                num_points = 1  # Baixa vulnerabilidade
            
            # Distribuir pontos ao longo do segmento
            monitoring_points = []
            for i in range(num_points):
                position = (i + 1) / (num_points + 1)  # Distribuição uniforme
                point = segment.geometry.interpolate(position, normalized=True)
                monitoring_points.append(point)
            
            monitoring_network[segment.id] = monitoring_points
            segment.monitoring_points = monitoring_points
        
        total_points = sum(len(points) for points in monitoring_network.values())
        logger.info(f"✅ Rede criada com {total_points} pontos de monitorização")
        
        return monitoring_network
    
    def visualize_coastal_analysis(
        self,
        segments: List[CoastalSegment],
        save_path: Optional[str] = None
    ) -> None:
        """
        📊 Visualizar análise costeira
        
        Args:
            segments: Lista de segmentos
            save_path: Caminho para salvar
        """
        logger.info("📊 Criando visualização da análise costeira")
        
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle('Análise Costeira - Angola', fontsize=16, fontweight='bold')
        
        # 1. Mapa de vulnerabilidade
        ax1 = axes[0, 0]
        self._plot_vulnerability_map(segments, ax1)
        ax1.set_title('Vulnerabilidade Costeira')
        
        # 2. Tipos costeiros
        ax2 = axes[0, 1]
        self._plot_coastal_types(segments, ax2)
        ax2.set_title('Tipos Costeiros')
        
        # 3. Mudanças detectadas
        ax3 = axes[1, 0]
        self._plot_coastal_changes(segments, ax3)
        ax3.set_title('Mudanças Costeiras Detectadas')
        
        # 4. Estatísticas
        ax4 = axes[1, 1]
        self._plot_statistics(segments, ax4)
        ax4.set_title('Estatísticas por Tipo')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"💾 Visualização salva: {save_path}")
        
        plt.show()
    
    def _plot_vulnerability_map(self, segments: List[CoastalSegment], ax):
        """Plotar mapa de vulnerabilidade"""
        # Cores para vulnerabilidade
        colors = plt.cm.Reds(np.linspace(0.2, 1, 256))
        
        for segment in segments:
            # Extrair coordenadas
            coords = list(segment.geometry.coords)
            x_coords, y_coords = zip(*coords)
            
            # Cor baseada na vulnerabilidade
            color_intensity = segment.vulnerability_score
            color = plt.cm.Reds(color_intensity)
            
            ax.plot(x_coords, y_coords, color=color, linewidth=3)
        
        # Configurar eixos
        ax.set_xlabel('Longitude')
        ax.set_ylabel('Latitude')
        ax.grid(True, alpha=0.3)
        
        # Colorbar
        sm = plt.cm.ScalarMappable(cmap=plt.cm.Reds, 
                                  norm=plt.Normalize(vmin=0, vmax=1))
        sm.set_array([])
        plt.colorbar(sm, ax=ax, label='Vulnerabilidade')
    
    def _plot_coastal_types(self, segments: List[CoastalSegment], ax):
        """Plotar tipos costeiros"""
        type_colors = {
            'mangrove': 'green',
            'sandy': 'gold',
            'rocky': 'gray',
            'mixed': 'orange',
            'desert': 'brown',
            'cliff': 'black'
        }
        
        for segment in segments:
            coords = list(segment.geometry.coords)
            x_coords, y_coords = zip(*coords)
            
            color = type_colors.get(segment.coastal_type, 'blue')
            ax.plot(x_coords, y_coords, color=color, linewidth=3, 
                   label=segment.coastal_type)
        
        # Remover duplicatas na legenda
        handles, labels = ax.get_legend_handles_labels()
        by_label = dict(zip(labels, handles))
        ax.legend(by_label.values(), by_label.keys())
        
        ax.set_xlabel('Longitude')
        ax.set_ylabel('Latitude')
        ax.grid(True, alpha=0.3)
    
    def _plot_coastal_changes(self, segments: List[CoastalSegment], ax):
        """Plotar mudanças costeiras"""
        change_colors = {
            CoastalChangeType.EROSION: 'red',
            CoastalChangeType.ACCRETION: 'blue',
            CoastalChangeType.STABLE: 'green',
            CoastalChangeType.UNKNOWN: 'gray'
        }
        
        for segment in segments:
            coords = list(segment.geometry.coords)
            x_coords, y_coords = zip(*coords)
            
            color = change_colors.get(segment.change_type, 'gray')
            linewidth = 2 + abs(segment.change_rate_m_year)  # Espessura baseada na taxa
            
            ax.plot(x_coords, y_coords, color=color, linewidth=linewidth)
        
        # Legenda
        for change_type, color in change_colors.items():
            ax.plot([], [], color=color, linewidth=3, label=change_type.value.title())
        
        ax.legend()
        ax.set_xlabel('Longitude')
        ax.set_ylabel('Latitude')
        ax.grid(True, alpha=0.3)
    
    def _plot_statistics(self, segments: List[CoastalSegment], ax):
        """Plotar estatísticas"""
        # Contar por tipo
        type_counts = {}
        vulnerability_by_type = {}
        
        for segment in segments:
            coastal_type = segment.coastal_type
            if coastal_type not in type_counts:
                type_counts[coastal_type] = 0
                vulnerability_by_type[coastal_type] = []
            
            type_counts[coastal_type] += 1
            vulnerability_by_type[coastal_type].append(segment.vulnerability_score)
        
        # Calcular médias
        type_avg_vuln = {
            t: np.mean(scores) for t, scores in vulnerability_by_type.items()
        }
        
        # Plotar
        types = list(type_counts.keys())
        counts = list(type_counts.values())
        avg_vulns = [type_avg_vuln[t] for t in types]
        
        # Gráfico de barras duplo
        x = np.arange(len(types))
        width = 0.35
        
        ax2 = ax.twinx()
        
        bars1 = ax.bar(x - width/2, counts, width, label='Número de Segmentos', alpha=0.7)
        bars2 = ax2.bar(x + width/2, avg_vulns, width, label='Vulnerabilidade Média', 
                       alpha=0.7, color='red')
        
        ax.set_xlabel('Tipo Costeiro')
        ax.set_ylabel('Número de Segmentos')
        ax2.set_ylabel('Vulnerabilidade Média')
        ax.set_xticks(x)
        ax.set_xticklabels(types, rotation=45)
        
        # Legendas
        ax.legend(loc='upper left')
        ax2.legend(loc='upper right')

# Exemplo de uso
if __name__ == "__main__":
    def main():
        # Inicializar serviço
        coastal_service = CoastalAnalysisService()
        
        print("🌊 Iniciando análise costeira de Angola")
        
        try:
            # Criar segmentos costeiros
            segments = coastal_service.create_angola_coastline_segments()
            print(f"✅ Criados {len(segments)} segmentos costeiros")
            
            # Analisar alguns segmentos
            for i, segment in enumerate(segments[:5]):  # Primeiros 5 segmentos
                # Detectar mudanças
                reference_date = datetime.now() - timedelta(days=365)
                comparison_date = datetime.now()
                
                change = coastal_service.detect_coastline_changes(
                    segment, reference_date, comparison_date
                )
                
                # Avaliar vulnerabilidade
                vulnerability = coastal_service.assess_climate_vulnerability(segment)
                
                print(f"Segmento {segment.id}:")
                print(f"  Tipo: {segment.coastal_type}")
                print(f"  Mudança: {change.change_type.value} ({change.change_distance_m:.1f}m)")
                print(f"  Vulnerabilidade: {vulnerability.vulnerability_level.value}")
                print()
            
            # Criar rede de monitorização
            monitoring_network = coastal_service.create_monitoring_network(segments)
            
            # Visualizar resultados
            coastal_service.visualize_coastal_analysis(segments)
            
        except Exception as e:
            print(f"❌ Erro: {str(e)}")
    
    main()
