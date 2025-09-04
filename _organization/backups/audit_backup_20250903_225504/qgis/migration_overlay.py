"""
Migration Trajectory Overlay System for BGAPP
Sistema de sobreposição de trajetórias de migração com zonas de pesca
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Union
from pathlib import Path
import logging
from dataclasses import dataclass
from enum import Enum

from shapely.geometry import Point, LineString, Polygon, MultiLineString
from shapely.ops import unary_union, nearest_points
import geopandas as gpd
from scipy.spatial.distance import cdist
from scipy.interpolate import interp1d

logger = logging.getLogger(__name__)


class MigrationStatus(Enum):
    """Status da migração"""
    BREEDING = "breeding"
    FEEDING = "feeding"
    MIGRATION = "migration"
    RESTING = "resting"
    UNKNOWN = "unknown"


class SpeciesType(Enum):
    """Tipos de espécies"""
    MARINE_MAMMAL = "marine_mammal"
    FISH = "fish"
    SEA_TURTLE = "sea_turtle"
    SEABIRD = "seabird"
    OTHER = "other"


@dataclass
class MigrationPoint:
    """Ponto individual de migração"""
    timestamp: datetime
    latitude: float
    longitude: float
    species: str
    individual_id: str
    status: MigrationStatus
    environmental_data: Dict[str, float]
    metadata: Dict[str, Any]


@dataclass
class MigrationTrajectory:
    """Trajetória completa de migração"""
    species: str
    species_type: SpeciesType
    individual_id: str
    points: List[MigrationPoint]
    start_date: datetime
    end_date: datetime
    total_distance_km: float
    average_speed_kmh: float
    trajectory_geometry: LineString
    metadata: Dict[str, Any]


@dataclass
class FishingZoneInteraction:
    """Interação entre migração e zona de pesca"""
    trajectory_id: str
    fishing_zone_id: str
    intersection_points: List[Point]
    time_in_zone_hours: float
    interaction_type: str  # 'crossing', 'feeding', 'resting'
    risk_level: str  # 'low', 'medium', 'high'
    environmental_conditions: Dict[str, float]


class MigrationOverlaySystem:
    """
    Sistema de sobreposição de trajetórias de migração com zonas de pesca
    Análise espacial e temporal de interações
    """
    
    def __init__(self):
        # Configuração da ZEE angolana
        self.angola_bounds = {
            'north': -4.2, 'south': -18.2, 'east': 17.5, 'west': 8.5
        }
        
        # Espécies migratórias conhecidas em Angola
        self.known_species = {
            'humpback_whale': {
                'scientific_name': 'Megaptera novaeangliae',
                'type': SpeciesType.MARINE_MAMMAL,
                'migration_pattern': 'seasonal_north_south',
                'peak_months': [6, 7, 8, 9],
                'average_speed_kmh': 8.0,
                'diving_depth_m': [0, 200],
                'conservation_status': 'Least Concern'
            },
            'leatherback_turtle': {
                'scientific_name': 'Dermochelys coriacea',
                'type': SpeciesType.SEA_TURTLE,
                'migration_pattern': 'oceanic_foraging',
                'peak_months': [10, 11, 12, 1],
                'average_speed_kmh': 2.5,
                'diving_depth_m': [0, 1000],
                'conservation_status': 'Vulnerable'
            },
            'yellowfin_tuna': {
                'scientific_name': 'Thunnus albacares',
                'type': SpeciesType.FISH,
                'migration_pattern': 'thermal_following',
                'peak_months': [4, 5, 6, 7],
                'average_speed_kmh': 12.0,
                'diving_depth_m': [0, 300],
                'conservation_status': 'Near Threatened'
            },
            'sardine': {
                'scientific_name': 'Sardina pilchardus',
                'type': SpeciesType.FISH,
                'migration_pattern': 'upwelling_following',
                'peak_months': [6, 7, 8, 9, 10],
                'average_speed_kmh': 3.0,
                'diving_depth_m': [0, 80],
                'conservation_status': 'Least Concern'
            },
            'red_footed_booby': {
                'scientific_name': 'Sula sula',
                'type': SpeciesType.SEABIRD,
                'migration_pattern': 'coastal_following',
                'peak_months': [11, 12, 1, 2],
                'average_speed_kmh': 45.0,
                'diving_depth_m': [0, 30],
                'conservation_status': 'Least Concern'
            }
        }
        
        # Tipos de zonas de pesca
        self.fishing_zone_types = {
            'industrial': {
                'vessel_size': 'large',
                'fishing_methods': ['trawling', 'purse_seine'],
                'target_species': ['sardine', 'mackerel', 'hake'],
                'interaction_risk': 'high'
            },
            'artisanal': {
                'vessel_size': 'small',
                'fishing_methods': ['line_fishing', 'nets'],
                'target_species': ['various_coastal'],
                'interaction_risk': 'medium'
            },
            'semi_industrial': {
                'vessel_size': 'medium',
                'fishing_methods': ['long_line', 'gill_nets'],
                'target_species': ['tuna', 'sharks'],
                'interaction_risk': 'medium'
            }
        }
    
    def load_migration_data(self, 
                          data_source: Union[str, Dict, List[Dict]],
                          data_format: str = 'movebank') -> List[MigrationTrajectory]:
        """
        Carregar dados de migração de diferentes fontes
        Suporta Movebank, ARGOS, GPS tracking, etc.
        """
        trajectories = []
        
        if isinstance(data_source, str):
            # Carregar de arquivo
            if data_format == 'movebank':
                trajectories = self._load_movebank_data(data_source)
            elif data_format == 'argos':
                trajectories = self._load_argos_data(data_source)
            elif data_format == 'csv':
                trajectories = self._load_csv_data(data_source)
            else:
                logger.error(f"Formato não suportado: {data_format}")
        
        elif isinstance(data_source, list):
            # Dados já em formato de lista
            trajectories = self._parse_raw_tracking_data(data_source)
        
        elif isinstance(data_source, dict):
            # Dados simulados ou de exemplo
            trajectories = self._generate_simulated_trajectories(data_source)
        
        # Filtrar trajetórias dentro da ZEE angolana
        angola_trajectories = self._filter_trajectories_by_bounds(trajectories)
        
        logger.info(f"Carregadas {len(angola_trajectories)} trajetórias na ZEE angolana")
        return angola_trajectories
    
    def _generate_simulated_trajectories(self, config: Dict[str, Any]) -> List[MigrationTrajectory]:
        """Gerar trajetórias simuladas para demonstração"""
        trajectories = []
        
        species_list = config.get('species', ['humpback_whale', 'yellowfin_tuna'])
        num_individuals = config.get('individuals_per_species', 3)
        time_period_days = config.get('time_period_days', 90)
        
        for species in species_list:
            if species not in self.known_species:
                continue
            
            species_info = self.known_species[species]
            
            for individual_id in range(num_individuals):
                trajectory = self._create_simulated_trajectory(
                    species, species_info, f"{species}_{individual_id:03d}", time_period_days
                )
                trajectories.append(trajectory)
        
        return trajectories
    
    def _create_simulated_trajectory(self, 
                                   species: str, 
                                   species_info: Dict[str, Any],
                                   individual_id: str,
                                   duration_days: int) -> MigrationTrajectory:
        """Criar uma trajetória simulada para uma espécie"""
        
        # Definir pontos inicial e final baseados no padrão migratório
        if species_info['migration_pattern'] == 'seasonal_north_south':
            start_point = (-6.0, 12.0)  # Norte (Cabinda)
            end_point = (-16.0, 11.8)   # Sul (Namibe)
        elif species_info['migration_pattern'] == 'oceanic_foraging':
            start_point = (-12.0, 13.0)  # Costa
            end_point = (-12.0, 15.0)    # Oceânico
        elif species_info['migration_pattern'] == 'thermal_following':
            start_point = (-8.0, 13.5)   # Centro-norte
            end_point = (-14.0, 12.0)    # Centro-sul
        else:
            start_point = (-10.0, 13.0)  # Ponto central
            end_point = (-12.0, 12.0)    # Ponto sul
        
        # Gerar pontos intermediários
        num_points = duration_days // 2  # Um ponto a cada 2 dias
        
        # Interpolação linear com ruído
        lats = np.linspace(start_point[0], end_point[0], num_points)
        lons = np.linspace(start_point[1], end_point[1], num_points)
        
        # Adicionar variação realística
        lat_noise = np.random.normal(0, 0.1, num_points)
        lon_noise = np.random.normal(0, 0.1, num_points)
        
        lats += lat_noise
        lons += lon_noise
        
        # Garantir que os pontos estão dentro da ZEE
        lats = np.clip(lats, self.angola_bounds['south'], self.angola_bounds['north'])
        lons = np.clip(lons, self.angola_bounds['west'], self.angola_bounds['east'])
        
        # Criar pontos de migração
        start_date = datetime.now() - timedelta(days=duration_days)
        points = []
        
        for i, (lat, lon) in enumerate(zip(lats, lons)):
            timestamp = start_date + timedelta(days=i * 2)
            
            # Simular dados ambientais
            env_data = {
                'sst': 20.0 + 5.0 * np.sin(2 * np.pi * i / num_points) + np.random.normal(0, 1),
                'chlorophyll': 2.0 + 1.5 * np.exp(-abs(lon - 13.0)) + np.random.normal(0, 0.3),
                'depth': abs(lon - 13.0) * 500 + np.random.normal(0, 100)
            }
            
            # Determinar status baseado na posição e época
            if i < num_points * 0.2:
                status = MigrationStatus.BREEDING
            elif i > num_points * 0.8:
                status = MigrationStatus.FEEDING
            else:
                status = MigrationStatus.MIGRATION
            
            point = MigrationPoint(
                timestamp=timestamp,
                latitude=lat,
                longitude=lon,
                species=species,
                individual_id=individual_id,
                status=status,
                environmental_data=env_data,
                metadata={'quality': 'simulated'}
            )
            points.append(point)
        
        # Calcular geometria da trajetória
        coords = [(p.longitude, p.latitude) for p in points]
        trajectory_geom = LineString(coords)
        
        # Calcular distância total
        total_distance = 0
        for i in range(len(points) - 1):
            p1 = Point(points[i].longitude, points[i].latitude)
            p2 = Point(points[i + 1].longitude, points[i + 1].latitude)
            # Aproximação: 1 grau ≈ 111 km
            distance = np.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2) * 111
            total_distance += distance
        
        # Calcular velocidade média
        time_diff_hours = (points[-1].timestamp - points[0].timestamp).total_seconds() / 3600
        avg_speed = total_distance / time_diff_hours if time_diff_hours > 0 else 0
        
        return MigrationTrajectory(
            species=species,
            species_type=species_info['type'],
            individual_id=individual_id,
            points=points,
            start_date=points[0].timestamp,
            end_date=points[-1].timestamp,
            total_distance_km=total_distance,
            average_speed_kmh=avg_speed,
            trajectory_geometry=trajectory_geom,
            metadata={
                'data_source': 'simulated',
                'species_info': species_info,
                'num_points': len(points)
            }
        )
    
    def _filter_trajectories_by_bounds(self, trajectories: List[MigrationTrajectory]) -> List[MigrationTrajectory]:
        """Filtrar trajetórias que passam pela ZEE angolana"""
        angola_trajectories = []
        
        for trajectory in trajectories:
            # Verificar se algum ponto está dentro da ZEE angolana
            points_in_angola = []
            for point in trajectory.points:
                if (self.angola_bounds['south'] <= point.latitude <= self.angola_bounds['north'] and
                    self.angola_bounds['west'] <= point.longitude <= self.angola_bounds['east']):
                    points_in_angola.append(point)
            
            if points_in_angola:
                # Criar nova trajetória apenas com pontos em Angola
                angola_trajectory = MigrationTrajectory(
                    species=trajectory.species,
                    species_type=trajectory.species_type,
                    individual_id=trajectory.individual_id,
                    points=points_in_angola,
                    start_date=points_in_angola[0].timestamp,
                    end_date=points_in_angola[-1].timestamp,
                    total_distance_km=trajectory.total_distance_km,
                    average_speed_kmh=trajectory.average_speed_kmh,
                    trajectory_geometry=LineString([(p.longitude, p.latitude) for p in points_in_angola]),
                    metadata={**trajectory.metadata, 'filtered_to_angola': True}
                )
                angola_trajectories.append(angola_trajectory)
        
        return angola_trajectories
    
    def analyze_fishing_zone_interactions(self, 
                                        trajectories: List[MigrationTrajectory],
                                        fishing_zones: List[Dict[str, Any]]) -> List[FishingZoneInteraction]:
        """
        Analisar interações entre trajetórias de migração e zonas de pesca
        """
        interactions = []
        
        # Converter zonas de pesca para geometrias Shapely
        fishing_polygons = []
        for zone in fishing_zones:
            try:
                if zone['geometry']['type'] == 'Polygon':
                    poly = Polygon(zone['geometry']['coordinates'][0])
                    fishing_polygons.append({
                        'geometry': poly,
                        'properties': zone.get('properties', {}),
                        'zone_id': zone.get('id', f"zone_{len(fishing_polygons)}")
                    })
            except Exception as e:
                logger.error(f"Erro ao processar zona de pesca: {e}")
                continue
        
        # Analisar cada trajetória
        for trajectory in trajectories:
            trajectory_line = trajectory.trajectory_geometry
            
            for fishing_zone in fishing_polygons:
                fishing_poly = fishing_zone['geometry']
                zone_id = fishing_zone['zone_id']
                
                # Verificar interseção
                if trajectory_line.intersects(fishing_poly):
                    interaction = self._analyze_single_interaction(
                        trajectory, fishing_zone, fishing_poly
                    )
                    if interaction:
                        interactions.append(interaction)
        
        return interactions
    
    def _analyze_single_interaction(self, 
                                  trajectory: MigrationTrajectory,
                                  fishing_zone: Dict[str, Any],
                                  fishing_poly: Polygon) -> Optional[FishingZoneInteraction]:
        """Analisar uma interação específica"""
        
        # Encontrar pontos da trajetória dentro da zona
        points_in_zone = []
        intersection_points = []
        
        for point in trajectory.points:
            point_geom = Point(point.longitude, point.latitude)
            if fishing_poly.contains(point_geom) or fishing_poly.touches(point_geom):
                points_in_zone.append(point)
                intersection_points.append(point_geom)
        
        if not points_in_zone:
            return None
        
        # Calcular tempo na zona
        if len(points_in_zone) > 1:
            time_in_zone = (points_in_zone[-1].timestamp - points_in_zone[0].timestamp).total_seconds() / 3600
        else:
            time_in_zone = 2.0  # Assumir 2 horas se apenas um ponto
        
        # Determinar tipo de interação
        interaction_type = self._classify_interaction_type(points_in_zone, trajectory)
        
        # Calcular nível de risco
        risk_level = self._calculate_risk_level(
            trajectory.species, fishing_zone['properties'], time_in_zone
        )
        
        # Calcular condições ambientais médias
        env_conditions = {}
        if points_in_zone:
            env_vars = points_in_zone[0].environmental_data.keys()
            for var in env_vars:
                values = [p.environmental_data.get(var, 0) for p in points_in_zone]
                env_conditions[var] = np.mean(values)
        
        return FishingZoneInteraction(
            trajectory_id=trajectory.individual_id,
            fishing_zone_id=fishing_zone['zone_id'],
            intersection_points=intersection_points,
            time_in_zone_hours=time_in_zone,
            interaction_type=interaction_type,
            risk_level=risk_level,
            environmental_conditions=env_conditions
        )
    
    def _classify_interaction_type(self, 
                                 points_in_zone: List[MigrationPoint],
                                 trajectory: MigrationTrajectory) -> str:
        """Classificar o tipo de interação"""
        
        if not points_in_zone:
            return 'none'
        
        # Analisar status dos pontos na zona
        statuses = [p.status for p in points_in_zone]
        
        if MigrationStatus.FEEDING in statuses:
            return 'feeding'
        elif MigrationStatus.RESTING in statuses:
            return 'resting'
        elif len(points_in_zone) == 1:
            return 'crossing'
        elif len(points_in_zone) > 5:  # Muitos pontos = permanência
            return 'extended_stay'
        else:
            return 'crossing'
    
    def _calculate_risk_level(self, 
                            species: str, 
                            fishing_zone_properties: Dict[str, Any],
                            time_in_zone_hours: float) -> str:
        """Calcular nível de risco da interação"""
        
        risk_score = 0
        
        # Fator espécie
        if species in self.known_species:
            species_info = self.known_species[species]
            if species_info['conservation_status'] in ['Vulnerable', 'Endangered']:
                risk_score += 3
            elif species_info['conservation_status'] == 'Near Threatened':
                risk_score += 2
            else:
                risk_score += 1
        
        # Fator tipo de pesca
        fishing_type = fishing_zone_properties.get('fishing_type', 'unknown')
        if fishing_type in self.fishing_zone_types:
            zone_risk = self.fishing_zone_types[fishing_type]['interaction_risk']
            if zone_risk == 'high':
                risk_score += 3
            elif zone_risk == 'medium':
                risk_score += 2
            else:
                risk_score += 1
        
        # Fator tempo na zona
        if time_in_zone_hours > 24:
            risk_score += 2
        elif time_in_zone_hours > 6:
            risk_score += 1
        
        # Classificar risco final
        if risk_score >= 7:
            return 'high'
        elif risk_score >= 4:
            return 'medium'
        else:
            return 'low'
    
    def create_temporal_interaction_analysis(self, 
                                           interactions: List[FishingZoneInteraction],
                                           time_resolution: str = 'monthly') -> Dict[str, Any]:
        """
        Criar análise temporal das interações
        """
        if not interactions:
            return {'error': 'No interactions found'}
        
        # Agrupar interações por período temporal
        temporal_groups = {}
        
        for interaction in interactions:
            # Para simplificação, usar timestamp atual
            # Em produção, usar timestamps reais das trajetórias
            timestamp = datetime.now()
            
            if time_resolution == 'monthly':
                period_key = timestamp.strftime('%Y-%m')
            elif time_resolution == 'weekly':
                period_key = timestamp.strftime('%Y-W%U')
            elif time_resolution == 'daily':
                period_key = timestamp.strftime('%Y-%m-%d')
            else:
                period_key = timestamp.strftime('%Y')
            
            if period_key not in temporal_groups:
                temporal_groups[period_key] = []
            temporal_groups[period_key].append(interaction)
        
        # Calcular estatísticas por período
        temporal_stats = {}
        for period, period_interactions in temporal_groups.items():
            stats = {
                'total_interactions': len(period_interactions),
                'high_risk_interactions': len([i for i in period_interactions if i.risk_level == 'high']),
                'medium_risk_interactions': len([i for i in period_interactions if i.risk_level == 'medium']),
                'low_risk_interactions': len([i for i in period_interactions if i.risk_level == 'low']),
                'average_time_in_zone': np.mean([i.time_in_zone_hours for i in period_interactions]),
                'interaction_types': {}
            }
            
            # Contar tipos de interação
            for interaction in period_interactions:
                interaction_type = interaction.interaction_type
                if interaction_type not in stats['interaction_types']:
                    stats['interaction_types'][interaction_type] = 0
                stats['interaction_types'][interaction_type] += 1
            
            temporal_stats[period] = stats
        
        return {
            'time_resolution': time_resolution,
            'total_periods': len(temporal_groups),
            'temporal_statistics': temporal_stats,
            'overall_summary': {
                'total_interactions': len(interactions),
                'periods_analyzed': list(temporal_groups.keys()),
                'peak_interaction_period': max(temporal_stats.keys(), 
                                             key=lambda k: temporal_stats[k]['total_interactions'])
            }
        }
    
    def generate_conservation_recommendations(self, 
                                            interactions: List[FishingZoneInteraction],
                                            trajectories: List[MigrationTrajectory]) -> Dict[str, Any]:
        """
        Gerar recomendações de conservação baseadas nas interações
        """
        recommendations = {
            'priority_zones': [],
            'temporal_restrictions': [],
            'species_specific_measures': [],
            'monitoring_recommendations': []
        }
        
        # Identificar zonas prioritárias (mais interações de alto risco)
        zone_risk_scores = {}
        for interaction in interactions:
            zone_id = interaction.fishing_zone_id
            if zone_id not in zone_risk_scores:
                zone_risk_scores[zone_id] = {'high': 0, 'medium': 0, 'low': 0}
            zone_risk_scores[zone_id][interaction.risk_level] += 1
        
        # Classificar zonas por prioridade
        for zone_id, risks in zone_risk_scores.items():
            priority_score = risks['high'] * 3 + risks['medium'] * 2 + risks['low']
            if priority_score > 5:  # Threshold para zona prioritária
                recommendations['priority_zones'].append({
                    'zone_id': zone_id,
                    'priority_score': priority_score,
                    'risk_breakdown': risks,
                    'recommended_actions': [
                        'Increased monitoring',
                        'Seasonal fishing restrictions',
                        'Alternative fishing methods'
                    ]
                })
        
        # Recomendações temporais baseadas em padrões migratórios
        species_peak_months = {}
        for trajectory in trajectories:
            species = trajectory.species
            if species in self.known_species:
                peak_months = self.known_species[species]['peak_months']
                if species not in species_peak_months:
                    species_peak_months[species] = set()
                species_peak_months[species].update(peak_months)
        
        for species, months in species_peak_months.items():
            if species in self.known_species:
                conservation_status = self.known_species[species]['conservation_status']
                if conservation_status in ['Vulnerable', 'Endangered']:
                    recommendations['temporal_restrictions'].append({
                        'species': species,
                        'restricted_months': sorted(list(months)),
                        'restriction_type': 'partial_fishing_ban',
                        'justification': f'{species} peak migration period'
                    })
        
        # Recomendações específicas por espécie
        species_interactions = {}
        for interaction in interactions:
            # Assumir que podemos obter espécie da trajetória
            species = 'unknown'  # Em produção, buscar da trajetória
            if species not in species_interactions:
                species_interactions[species] = []
            species_interactions[species].append(interaction)
        
        for species, species_int in species_interactions.items():
            high_risk_count = len([i for i in species_int if i.risk_level == 'high'])
            if high_risk_count > 2:
                recommendations['species_specific_measures'].append({
                    'species': species,
                    'high_risk_interactions': high_risk_count,
                    'measures': [
                        'Species-specific monitoring program',
                        'Habitat protection measures',
                        'Fisheries bycatch reduction'
                    ]
                })
        
        # Recomendações de monitorização
        recommendations['monitoring_recommendations'] = [
            {
                'type': 'satellite_tracking',
                'priority': 'high',
                'description': 'Expand satellite tracking for key species',
                'target_species': list(species_peak_months.keys())
            },
            {
                'type': 'fishing_vessel_monitoring',
                'priority': 'medium',
                'description': 'Implement VMS in priority zones',
                'target_zones': [z['zone_id'] for z in recommendations['priority_zones']]
            },
            {
                'type': 'environmental_monitoring',
                'priority': 'medium',
                'description': 'Monitor oceanographic conditions in interaction zones'
            }
        ]
        
        return recommendations
    
    def export_interaction_analysis(self, 
                                  interactions: List[FishingZoneInteraction],
                                  trajectories: List[MigrationTrajectory],
                                  output_path: str,
                                  format: str = 'geojson') -> bool:
        """
        Exportar análise de interações em formato espacial
        """
        try:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            if format == 'geojson':
                # Criar GeoJSON com interações
                features = []
                
                # Adicionar trajetórias
                for trajectory in trajectories:
                    feature = {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': [[p.longitude, p.latitude] for p in trajectory.points]
                        },
                        'properties': {
                            'type': 'trajectory',
                            'species': trajectory.species,
                            'individual_id': trajectory.individual_id,
                            'start_date': trajectory.start_date.isoformat(),
                            'end_date': trajectory.end_date.isoformat(),
                            'total_distance_km': trajectory.total_distance_km,
                            'average_speed_kmh': trajectory.average_speed_kmh
                        }
                    }
                    features.append(feature)
                
                # Adicionar pontos de interação
                for interaction in interactions:
                    for point in interaction.intersection_points:
                        feature = {
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Point',
                                'coordinates': [point.x, point.y]
                            },
                            'properties': {
                                'type': 'interaction',
                                'trajectory_id': interaction.trajectory_id,
                                'fishing_zone_id': interaction.fishing_zone_id,
                                'interaction_type': interaction.interaction_type,
                                'risk_level': interaction.risk_level,
                                'time_in_zone_hours': interaction.time_in_zone_hours,
                                'environmental_conditions': interaction.environmental_conditions
                            }
                        }
                        features.append(feature)
                
                geojson_data = {
                    'type': 'FeatureCollection',
                    'features': features,
                    'metadata': {
                        'created': datetime.now().isoformat(),
                        'total_trajectories': len(trajectories),
                        'total_interactions': len(interactions),
                        'analysis_region': 'Angola EEZ'
                    }
                }
                
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(geojson_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Análise de interações exportada para: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao exportar análise: {e}")
            return False


def create_migration_fishing_analysis(species_config: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Função utilitária para análise completa de migração vs pesca
    """
    if species_config is None:
        species_config = {
            'species': ['humpback_whale', 'yellowfin_tuna', 'leatherback_turtle'],
            'individuals_per_species': 5,
            'time_period_days': 120
        }
    
    overlay_system = MigrationOverlaySystem()
    
    # Gerar trajetórias simuladas
    trajectories = overlay_system.load_migration_data(species_config, 'simulated')
    
    # Definir zonas de pesca simuladas
    fishing_zones = [
        {
            'id': 'zone_north_industrial',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [12.0, -6.0], [14.0, -6.0], [14.0, -8.0], [12.0, -8.0], [12.0, -6.0]
                ]]
            },
            'properties': {
                'fishing_type': 'industrial',
                'target_species': ['sardine', 'mackerel'],
                'active_months': [6, 7, 8, 9, 10]
            }
        },
        {
            'id': 'zone_central_artisanal',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [12.5, -10.0], [13.5, -10.0], [13.5, -12.0], [12.5, -12.0], [12.5, -10.0]
                ]]
            },
            'properties': {
                'fishing_type': 'artisanal',
                'target_species': ['various_coastal'],
                'active_months': list(range(1, 13))
            }
        },
        {
            'id': 'zone_south_tuna',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [11.0, -14.0], [13.0, -14.0], [13.0, -16.0], [11.0, -16.0], [11.0, -14.0]
                ]]
            },
            'properties': {
                'fishing_type': 'semi_industrial',
                'target_species': ['tuna', 'sharks'],
                'active_months': [4, 5, 6, 7, 8]
            }
        }
    ]
    
    # Analisar interações
    interactions = overlay_system.analyze_fishing_zone_interactions(trajectories, fishing_zones)
    
    # Análise temporal
    temporal_analysis = overlay_system.create_temporal_interaction_analysis(interactions, 'monthly')
    
    # Recomendações de conservação
    conservation_recs = overlay_system.generate_conservation_recommendations(interactions, trajectories)
    
    return {
        'analysis_summary': {
            'total_trajectories': len(trajectories),
            'total_interactions': len(interactions),
            'species_analyzed': list(set(t.species for t in trajectories)),
            'fishing_zones': len(fishing_zones),
            'analysis_date': datetime.now().isoformat()
        },
        'trajectories': [
            {
                'species': t.species,
                'individual_id': t.individual_id,
                'points_count': len(t.points),
                'distance_km': t.total_distance_km,
                'duration_days': (t.end_date - t.start_date).days
            } for t in trajectories
        ],
        'interactions': [
            {
                'trajectory_id': i.trajectory_id,
                'fishing_zone_id': i.fishing_zone_id,
                'interaction_type': i.interaction_type,
                'risk_level': i.risk_level,
                'time_in_zone_hours': i.time_in_zone_hours,
                'intersection_points_count': len(i.intersection_points)
            } for i in interactions
        ],
        'temporal_analysis': temporal_analysis,
        'conservation_recommendations': conservation_recs,
        'risk_assessment': {
            'high_risk_interactions': len([i for i in interactions if i.risk_level == 'high']),
            'medium_risk_interactions': len([i for i in interactions if i.risk_level == 'medium']),
            'low_risk_interactions': len([i for i in interactions if i.risk_level == 'low']),
            'priority_zones': len(conservation_recs['priority_zones']),
            'species_needing_protection': len(conservation_recs['species_specific_measures'])
        }
    }
