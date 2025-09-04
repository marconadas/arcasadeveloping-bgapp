"""
Spatial Analysis Tools for BGAPP
Ferramentas de análise espacial avançada usando conceitos QGIS
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple, Union
from pathlib import Path
import logging
from dataclasses import dataclass

from shapely.geometry import Point, Polygon, LineString, MultiPolygon
from shapely.ops import unary_union, transform
from shapely import affinity
import geopandas as gpd
from scipy.spatial.distance import cdist
from scipy.ndimage import binary_dilation, binary_erosion
import networkx as nx

logger = logging.getLogger(__name__)


@dataclass
class SpatialRegion:
    """Classe para representar uma região espacial"""
    name: str
    geometry: Union[Polygon, MultiPolygon]
    properties: Dict[str, Any]
    crs: str = "EPSG:4326"


@dataclass
class BufferZone:
    """Classe para representar uma zona buffer"""
    source_geometry: Union[Point, Polygon, LineString]
    buffer_distance: float  # em metros
    buffer_geometry: Polygon
    zone_type: str  # 'exclusion', 'protection', 'monitoring'
    properties: Dict[str, Any]


class SpatialAnalysisTools:
    """
    Ferramentas de análise espacial para ordenamento marinho e terrestre
    Implementa funcionalidades similares às do QGIS
    """
    
    def __init__(self):
        # Configuração da ZEE angolana
        self.angola_bounds = {
            'north': -4.2,    # Cabinda norte
            'south': -18.2,   # Cunene sul
            'east': 17.5,     # Limite oceânico leste
            'west': 8.5       # Limite oceânico oeste
        }
        
        # Sistemas de coordenadas comuns para Angola
        self.crs_systems = {
            'wgs84': 'EPSG:4326',
            'utm33s': 'EPSG:32733',  # UTM Zone 33S (sul de Angola)
            'utm34s': 'EPSG:32734',  # UTM Zone 34S (norte de Angola)
            'angola_tm': 'EPSG:22032'  # Angola TM (sistema nacional)
        }
        
        # Tipos de análise espacial suportados
        self.analysis_types = {
            'buffer': 'Zonas buffer ao redor de features',
            'overlay': 'Sobreposição de camadas',
            'proximity': 'Análise de proximidade',
            'connectivity': 'Análise de conectividade',
            'hotspots': 'Identificação de hotspots',
            'corridors': 'Corredores ecológicos',
            'suitability': 'Análise de adequação',
            'viewshed': 'Análise de visibilidade',
            'watershed': 'Análise de bacias hidrográficas'
        }
    
    def create_buffer_zones(self, 
                           geometries: List[Dict[str, Any]],
                           buffer_distance: float,
                           zone_type: str = 'protection',
                           merge_overlapping: bool = True) -> List[BufferZone]:
        """
        Criar zonas buffer ao redor de geometrias
        Similar ao Buffer tool do QGIS
        """
        buffer_zones = []
        
        for geom_data in geometries:
            try:
                # Converter geometria para Shapely
                if geom_data['type'] == 'Point':
                    geom = Point(geom_data['coordinates'])
                elif geom_data['type'] == 'Polygon':
                    geom = Polygon(geom_data['coordinates'][0])
                elif geom_data['type'] == 'LineString':
                    geom = LineString(geom_data['coordinates'])
                else:
                    logger.warning(f"Tipo de geometria não suportado: {geom_data['type']}")
                    continue
                
                # Criar buffer (aproximado em graus decimais)
                # Em produção, usar projeção adequada (UTM)
                buffer_degrees = buffer_distance / 111000  # Aproximação: 1° ≈ 111km
                buffer_geom = geom.buffer(buffer_degrees)
                
                buffer_zone = BufferZone(
                    source_geometry=geom,
                    buffer_distance=buffer_distance,
                    buffer_geometry=buffer_geom,
                    zone_type=zone_type,
                    properties=geom_data.get('properties', {})
                )
                
                buffer_zones.append(buffer_zone)
                
            except Exception as e:
                logger.error(f"Erro ao criar buffer: {e}")
                continue
        
        # Mesclar buffers sobrepostos se solicitado
        if merge_overlapping and len(buffer_zones) > 1:
            buffer_zones = self._merge_overlapping_buffers(buffer_zones)
        
        return buffer_zones
    
    def _merge_overlapping_buffers(self, buffer_zones: List[BufferZone]) -> List[BufferZone]:
        """Mesclar zonas buffer sobrepostas"""
        if not buffer_zones:
            return []
        
        # Agrupar buffers por tipo
        grouped_buffers = {}
        for buffer in buffer_zones:
            zone_type = buffer.zone_type
            if zone_type not in grouped_buffers:
                grouped_buffers[zone_type] = []
            grouped_buffers[zone_type].append(buffer)
        
        merged_buffers = []
        
        for zone_type, buffers in grouped_buffers.items():
            if len(buffers) == 1:
                merged_buffers.extend(buffers)
                continue
            
            # Mesclar geometrias do mesmo tipo
            geometries = [b.buffer_geometry for b in buffers]
            merged_geom = unary_union(geometries)
            
            # Combinar propriedades
            combined_properties = {}
            for buffer in buffers:
                combined_properties.update(buffer.properties)
            
            # Criar buffer mesclado
            merged_buffer = BufferZone(
                source_geometry=merged_geom,
                buffer_distance=buffers[0].buffer_distance,
                buffer_geometry=merged_geom,
                zone_type=zone_type,
                properties=combined_properties
            )
            
            merged_buffers.append(merged_buffer)
        
        return merged_buffers
    
    def analyze_connectivity(self, 
                           habitats: List[Dict[str, Any]],
                           species_mobility: float,
                           barrier_features: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Análise de conectividade entre habitats
        Similar ao plugin Connectivity Analysis do QGIS
        """
        
        # Converter habitats para geometrias Shapely
        habitat_geometries = []
        for i, habitat in enumerate(habitats):
            try:
                if habitat['geometry']['type'] == 'Polygon':
                    geom = Polygon(habitat['geometry']['coordinates'][0])
                    habitat_geometries.append({
                        'id': i,
                        'geometry': geom,
                        'properties': habitat.get('properties', {})
                    })
            except Exception as e:
                logger.error(f"Erro ao processar habitat {i}: {e}")
                continue
        
        # Criar grafo de conectividade
        connectivity_graph = nx.Graph()
        
        # Adicionar nós (habitats)
        for habitat in habitat_geometries:
            connectivity_graph.add_node(
                habitat['id'],
                geometry=habitat['geometry'],
                properties=habitat['properties']
            )
        
        # Calcular distâncias entre habitats
        centroids = [(h['geometry'].centroid.x, h['geometry'].centroid.y) 
                    for h in habitat_geometries]
        
        if len(centroids) > 1:
            distances = cdist(centroids, centroids)
            
            # Adicionar arestas baseadas na mobilidade da espécie
            mobility_degrees = species_mobility / 111000  # Converter metros para graus
            
            for i in range(len(habitat_geometries)):
                for j in range(i + 1, len(habitat_geometries)):
                    distance = distances[i][j]
                    
                    if distance <= mobility_degrees:
                        # Verificar se há barreiras
                        if not self._has_barriers(centroids[i], centroids[j], barrier_features):
                            connectivity_graph.add_edge(
                                i, j,
                                distance=distance,
                                weight=1.0 / (distance + 0.001)  # Peso inversamente proporcional à distância
                            )
        
        # Análise do grafo de conectividade
        analysis_results = {
            'total_habitats': len(habitat_geometries),
            'connected_components': list(nx.connected_components(connectivity_graph)),
            'connectivity_matrix': nx.adjacency_matrix(connectivity_graph).todense().tolist(),
            'network_metrics': {
                'number_of_components': nx.number_connected_components(connectivity_graph),
                'average_clustering': nx.average_clustering(connectivity_graph),
                'density': nx.density(connectivity_graph)
            },
            'critical_habitats': [],
            'corridors': []
        }
        
        # Identificar habitats críticos (alta centralidade)
        if connectivity_graph.number_of_edges() > 0:
            centrality = nx.betweenness_centrality(connectivity_graph)
            critical_threshold = np.mean(list(centrality.values())) + np.std(list(centrality.values()))
            
            for node_id, centrality_value in centrality.items():
                if centrality_value > critical_threshold:
                    analysis_results['critical_habitats'].append({
                        'habitat_id': node_id,
                        'centrality': centrality_value,
                        'properties': habitat_geometries[node_id]['properties']
                    })
        
        # Identificar corredores importantes
        for edge in connectivity_graph.edges(data=True):
            node1, node2, edge_data = edge
            corridor = {
                'from_habitat': node1,
                'to_habitat': node2,
                'distance_km': edge_data['distance'] * 111,
                'weight': edge_data['weight'],
                'geometry': LineString([
                    centroids[node1],
                    centroids[node2]
                ])
            }
            analysis_results['corridors'].append(corridor)
        
        return analysis_results
    
    def _has_barriers(self, point1: Tuple[float, float], 
                     point2: Tuple[float, float],
                     barrier_features: Optional[List[Dict[str, Any]]]) -> bool:
        """Verificar se há barreiras entre dois pontos"""
        if not barrier_features:
            return False
        
        # Criar linha entre os pontos
        line = LineString([point1, point2])
        
        # Verificar interseção com barreiras
        for barrier in barrier_features:
            try:
                if barrier['geometry']['type'] == 'Polygon':
                    barrier_geom = Polygon(barrier['geometry']['coordinates'][0])
                elif barrier['geometry']['type'] == 'LineString':
                    barrier_geom = LineString(barrier['geometry']['coordinates'])
                else:
                    continue
                
                if line.intersects(barrier_geom):
                    return True
            except Exception:
                continue
        
        return False
    
    def identify_hotspots(self, 
                         point_data: List[Dict[str, Any]],
                         analysis_field: str,
                         method: str = 'kernel_density') -> Dict[str, Any]:
        """
        Identificar hotspots espaciais
        Similar ao Hotspot Analysis (Getis-Ord Gi*) do QGIS
        """
        
        if not point_data:
            return {'hotspots': [], 'method': method}
        
        # Extrair coordenadas e valores
        coordinates = []
        values = []
        
        for point in point_data:
            try:
                coords = point['geometry']['coordinates']
                value = point['properties'].get(analysis_field, 0)
                coordinates.append(coords)
                values.append(value)
            except Exception as e:
                logger.error(f"Erro ao processar ponto: {e}")
                continue
        
        if len(coordinates) < 3:
            return {'hotspots': [], 'method': method, 'error': 'Insufficient data points'}
        
        coordinates = np.array(coordinates)
        values = np.array(values)
        
        if method == 'kernel_density':
            hotspots = self._kernel_density_hotspots(coordinates, values)
        elif method == 'getis_ord':
            hotspots = self._getis_ord_hotspots(coordinates, values)
        else:
            hotspots = self._simple_clustering_hotspots(coordinates, values)
        
        return {
            'hotspots': hotspots,
            'method': method,
            'total_points': len(point_data),
            'analysis_field': analysis_field
        }
    
    def _kernel_density_hotspots(self, coordinates: np.ndarray, values: np.ndarray) -> List[Dict[str, Any]]:
        """Análise de hotspots usando densidade kernel simplificada"""
        hotspots = []
        
        # Criar grid para análise
        lon_min, lat_min = coordinates.min(axis=0)
        lon_max, lat_max = coordinates.max(axis=0)
        
        # Grid com resolução aproximada de 0.1 graus
        lon_grid = np.arange(lon_min, lon_max, 0.1)
        lat_grid = np.arange(lat_min, lat_max, 0.1)
        
        lon_mesh, lat_mesh = np.meshgrid(lon_grid, lat_grid)
        grid_points = np.column_stack([lon_mesh.ravel(), lat_mesh.ravel()])
        
        # Calcular densidade em cada ponto do grid
        bandwidth = 0.2  # Aproximadamente 22km
        densities = []
        
        for grid_point in grid_points:
            distances = np.sqrt(np.sum((coordinates - grid_point) ** 2, axis=1))
            weights = np.exp(-(distances ** 2) / (2 * bandwidth ** 2))
            density = np.sum(weights * values) / np.sum(weights)
            densities.append(density)
        
        densities = np.array(densities)
        
        # Identificar pontos com densidade acima do percentil 90
        threshold = np.percentile(densities, 90)
        hotspot_indices = np.where(densities > threshold)[0]
        
        for idx in hotspot_indices:
            hotspot = {
                'geometry': {
                    'type': 'Point',
                    'coordinates': grid_points[idx].tolist()
                },
                'properties': {
                    'density_value': float(densities[idx]),
                    'hotspot_rank': float(densities[idx] / threshold),
                    'method': 'kernel_density'
                }
            }
            hotspots.append(hotspot)
        
        return hotspots
    
    def _getis_ord_hotspots(self, coordinates: np.ndarray, values: np.ndarray) -> List[Dict[str, Any]]:
        """Análise Getis-Ord Gi* simplificada"""
        hotspots = []
        n = len(coordinates)
        
        if n < 5:
            return hotspots
        
        # Calcular matriz de distâncias
        distances = cdist(coordinates, coordinates)
        
        # Definir vizinhança (distância máxima de 0.5 graus ≈ 55km)
        max_distance = 0.5
        spatial_weights = (distances <= max_distance).astype(float)
        np.fill_diagonal(spatial_weights, 0)  # Remover auto-correlação
        
        # Calcular estatística Gi* para cada ponto
        mean_value = np.mean(values)
        std_value = np.std(values)
        
        for i in range(n):
            neighbors = spatial_weights[i]
            neighbor_sum = np.sum(neighbors)
            
            if neighbor_sum == 0:
                continue
            
            # Gi* statistic
            numerator = np.sum(neighbors * values) - mean_value * neighbor_sum
            denominator = std_value * np.sqrt((n * neighbor_sum - neighbor_sum ** 2) / (n - 1))
            
            if denominator != 0:
                gi_star = numerator / denominator
                
                # Considerar hotspot se Gi* > 1.96 (95% confiança)
                if abs(gi_star) > 1.96:
                    hotspot_type = 'hot' if gi_star > 0 else 'cold'
                    
                    hotspot = {
                        'geometry': {
                            'type': 'Point',
                            'coordinates': coordinates[i].tolist()
                        },
                        'properties': {
                            'gi_star': float(gi_star),
                            'hotspot_type': hotspot_type,
                            'confidence': '95%',
                            'original_value': float(values[i]),
                            'method': 'getis_ord'
                        }
                    }
                    hotspots.append(hotspot)
        
        return hotspots
    
    def _simple_clustering_hotspots(self, coordinates: np.ndarray, values: np.ndarray) -> List[Dict[str, Any]]:
        """Clustering simples baseado em valores altos e proximidade"""
        hotspots = []
        
        # Identificar pontos com valores acima do percentil 75
        high_value_threshold = np.percentile(values, 75)
        high_value_indices = np.where(values > high_value_threshold)[0]
        
        if len(high_value_indices) == 0:
            return hotspots
        
        high_value_coords = coordinates[high_value_indices]
        high_values = values[high_value_indices]
        
        # Agrupar pontos próximos (distância < 0.3 graus ≈ 33km)
        cluster_distance = 0.3
        distances = cdist(high_value_coords, high_value_coords)
        
        visited = set()
        
        for i, coord in enumerate(high_value_coords):
            if i in visited:
                continue
            
            # Encontrar vizinhos próximos
            neighbors = np.where(distances[i] <= cluster_distance)[0]
            cluster_coords = high_value_coords[neighbors]
            cluster_values = high_values[neighbors]
            
            # Marcar como visitados
            visited.update(neighbors)
            
            # Criar hotspot representando o cluster
            centroid = np.mean(cluster_coords, axis=0)
            mean_value = np.mean(cluster_values)
            
            hotspot = {
                'geometry': {
                    'type': 'Point',
                    'coordinates': centroid.tolist()
                },
                'properties': {
                    'cluster_size': len(neighbors),
                    'mean_value': float(mean_value),
                    'max_value': float(np.max(cluster_values)),
                    'method': 'simple_clustering'
                }
            }
            hotspots.append(hotspot)
        
        return hotspots
    
    def create_ecological_corridors(self, 
                                  source_habitats: List[Dict[str, Any]],
                                  target_habitats: List[Dict[str, Any]],
                                  cost_surface: Optional[np.ndarray] = None,
                                  max_corridor_width: float = 5000) -> List[Dict[str, Any]]:
        """
        Criar corredores ecológicos entre habitats
        Similar ao Least Cost Path do QGIS
        """
        corridors = []
        
        # Converter habitats para geometrias
        source_geoms = []
        target_geoms = []
        
        for habitat in source_habitats:
            try:
                geom = Polygon(habitat['geometry']['coordinates'][0])
                source_geoms.append({
                    'geometry': geom,
                    'properties': habitat.get('properties', {}),
                    'centroid': geom.centroid
                })
            except Exception:
                continue
        
        for habitat in target_habitats:
            try:
                geom = Polygon(habitat['geometry']['coordinates'][0])
                target_geoms.append({
                    'geometry': geom,
                    'properties': habitat.get('properties', {}),
                    'centroid': geom.centroid
                })
            except Exception:
                continue
        
        # Criar corredores entre cada par source-target
        for source in source_geoms:
            for target in target_geoms:
                try:
                    corridor = self._create_single_corridor(
                        source, target, cost_surface, max_corridor_width
                    )
                    if corridor:
                        corridors.append(corridor)
                except Exception as e:
                    logger.error(f"Erro ao criar corredor: {e}")
                    continue
        
        return corridors
    
    def _create_single_corridor(self, 
                               source: Dict[str, Any],
                               target: Dict[str, Any],
                               cost_surface: Optional[np.ndarray],
                               max_width: float) -> Optional[Dict[str, Any]]:
        """Criar um corredor individual entre dois habitats"""
        
        # Calcular linha direta entre centroides
        source_point = source['centroid']
        target_point = target['centroid']
        
        # Criar linha base do corredor
        corridor_line = LineString([
            (source_point.x, source_point.y),
            (target_point.x, target_point.y)
        ])
        
        # Converter largura para graus (aproximação)
        width_degrees = max_width / 111000
        
        # Criar buffer ao redor da linha para formar o corredor
        corridor_polygon = corridor_line.buffer(width_degrees / 2)
        
        # Calcular métricas do corredor
        distance_km = corridor_line.length * 111  # Aproximação
        area_km2 = corridor_polygon.area * (111 ** 2)
        
        corridor = {
            'geometry': {
                'type': 'Polygon',
                'coordinates': [list(corridor_polygon.exterior.coords)]
            },
            'properties': {
                'source_habitat': source['properties'],
                'target_habitat': target['properties'],
                'corridor_length_km': round(distance_km, 2),
                'corridor_area_km2': round(area_km2, 2),
                'corridor_width_m': max_width,
                'suitability_score': self._calculate_corridor_suitability(corridor_polygon, cost_surface)
            }
        }
        
        return corridor
    
    def _calculate_corridor_suitability(self, 
                                       corridor_geom: Polygon,
                                       cost_surface: Optional[np.ndarray]) -> float:
        """Calcular adequação do corredor baseado na superfície de custo"""
        
        if cost_surface is None:
            # Sem superfície de custo, usar suitability baseada em comprimento
            # Corredores mais curtos são mais adequados
            length = corridor_geom.length
            return max(0.1, 1.0 - (length / 10.0))  # Normalizado
        
        # Em implementação completa, samplear cost_surface dentro do corredor
        # Por agora, retornar valor simulado
        return np.random.uniform(0.3, 0.9)
    
    def multi_criteria_analysis(self, 
                               criteria_layers: Dict[str, Dict[str, Any]],
                               weights: Dict[str, float],
                               method: str = 'weighted_overlay') -> Dict[str, Any]:
        """
        Análise multicritério (MCDA) para adequação espacial
        Similar ao Multi-Criteria Evaluation do QGIS
        """
        
        if not criteria_layers or not weights:
            raise ValueError("Critérios e pesos são obrigatórios")
        
        # Verificar se os pesos somam 1.0
        total_weight = sum(weights.values())
        if abs(total_weight - 1.0) > 0.01:
            # Normalizar pesos
            weights = {k: v / total_weight for k, v in weights.items()}
        
        # Simular análise MCDA (em produção, usar dados raster reais)
        grid_size = 50  # 50x50 grid para demonstração
        
        # Criar grid de análise
        lon_range = np.linspace(self.angola_bounds['west'], self.angola_bounds['east'], grid_size)
        lat_range = np.linspace(self.angola_bounds['south'], self.angola_bounds['north'], grid_size)
        
        lon_mesh, lat_mesh = np.meshgrid(lon_range, lat_range)
        
        # Inicializar matriz de adequação
        suitability_matrix = np.zeros((grid_size, grid_size))
        
        # Aplicar cada critério
        for criterion_name, weight in weights.items():
            if criterion_name not in criteria_layers:
                continue
            
            criterion_data = criteria_layers[criterion_name]
            criterion_values = self._simulate_criterion_values(
                criterion_name, lon_mesh, lat_mesh, criterion_data
            )
            
            # Normalizar valores do critério (0-1)
            criterion_normalized = self._normalize_values(criterion_values, criterion_data)
            
            # Aplicar peso e adicionar à matriz de adequação
            suitability_matrix += weight * criterion_normalized
        
        # Identificar zonas de adequação
        suitability_zones = self._classify_suitability_zones(
            suitability_matrix, lon_mesh, lat_mesh
        )
        
        return {
            'method': method,
            'criteria_used': list(criteria_layers.keys()),
            'weights': weights,
            'suitability_zones': suitability_zones,
            'grid_resolution': grid_size,
            'analysis_bounds': self.angola_bounds,
            'statistics': {
                'mean_suitability': float(np.mean(suitability_matrix)),
                'max_suitability': float(np.max(suitability_matrix)),
                'min_suitability': float(np.min(suitability_matrix)),
                'std_suitability': float(np.std(suitability_matrix))
            }
        }
    
    def _simulate_criterion_values(self, 
                                  criterion_name: str,
                                  lon_mesh: np.ndarray,
                                  lat_mesh: np.ndarray,
                                  criterion_data: Dict[str, Any]) -> np.ndarray:
        """Simular valores de critério (substituir por dados reais em produção)"""
        
        # Gerar padrões baseados no tipo de critério
        if 'distance' in criterion_name.lower():
            # Critérios de distância: maior adequação longe de features
            center_lon, center_lat = np.mean(lon_mesh), np.mean(lat_mesh)
            distances = np.sqrt((lon_mesh - center_lon)**2 + (lat_mesh - center_lat)**2)
            return distances
            
        elif 'depth' in criterion_name.lower() or 'bathymetry' in criterion_name.lower():
            # Batimetria: adequação baseada na profundidade
            # Simular profundidade aumentando com distância da costa
            coastal_distance = np.sqrt((lon_mesh - self.angola_bounds['east'])**2 + 
                                     (lat_mesh - np.mean([self.angola_bounds['north'], 
                                                        self.angola_bounds['south']]))**2)
            return coastal_distance * 1000  # Simular profundidade em metros
            
        elif 'slope' in criterion_name.lower():
            # Declive: adequação baseada na inclinação
            gradient_x = np.gradient(lat_mesh, axis=1)
            gradient_y = np.gradient(lat_mesh, axis=0)
            slope = np.sqrt(gradient_x**2 + gradient_y**2)
            return slope * 100  # Converter para percentagem
            
        elif 'temperature' in criterion_name.lower() or 'sst' in criterion_name.lower():
            # Temperatura: padrão latitudinal
            return 20 + 8 * (lat_mesh - self.angola_bounds['south']) / (
                self.angola_bounds['north'] - self.angola_bounds['south']
            )
            
        elif 'chlorophyll' in criterion_name.lower() or 'chl' in criterion_name.lower():
            # Clorofila: maior concentração próximo da costa
            coastal_distance = np.abs(lon_mesh - self.angola_bounds['east'])
            return 5.0 * np.exp(-coastal_distance * 3)
            
        else:
            # Critério genérico: valores aleatórios com padrão espacial
            np.random.seed(hash(criterion_name) % 2**32)
            base_pattern = np.random.rand(*lon_mesh.shape)
            # Suavizar para criar padrão espacial
            from scipy.ndimage import gaussian_filter
            return gaussian_filter(base_pattern, sigma=2)
    
    def _normalize_values(self, values: np.ndarray, criterion_data: Dict[str, Any]) -> np.ndarray:
        """Normalizar valores do critério para escala 0-1"""
        
        # Verificar se é critério de benefício (maior = melhor) ou custo (menor = melhor)
        is_benefit = criterion_data.get('type', 'benefit') == 'benefit'
        
        # Normalização min-max
        min_val = np.min(values)
        max_val = np.max(values)
        
        if max_val == min_val:
            return np.ones_like(values) * 0.5
        
        normalized = (values - min_val) / (max_val - min_val)
        
        # Inverter se for critério de custo
        if not is_benefit:
            normalized = 1.0 - normalized
        
        return normalized
    
    def _classify_suitability_zones(self, 
                                   suitability_matrix: np.ndarray,
                                   lon_mesh: np.ndarray,
                                   lat_mesh: np.ndarray) -> List[Dict[str, Any]]:
        """Classificar matriz de adequação em zonas"""
        
        # Definir classes de adequação
        suitability_classes = [
            {'name': 'Muito Alta', 'min': 0.8, 'max': 1.0, 'color': '#006837'},
            {'name': 'Alta', 'min': 0.6, 'max': 0.8, 'color': '#31a354'},
            {'name': 'Média', 'min': 0.4, 'max': 0.6, 'color': '#78c679'},
            {'name': 'Baixa', 'min': 0.2, 'max': 0.4, 'color': '#c2e699'},
            {'name': 'Muito Baixa', 'min': 0.0, 'max': 0.2, 'color': '#f7fcb9'}
        ]
        
        zones = []
        
        for suitability_class in suitability_classes:
            # Identificar células que pertencem a esta classe
            mask = (suitability_matrix >= suitability_class['min']) & \
                   (suitability_matrix < suitability_class['max'])
            
            if not np.any(mask):
                continue
            
            # Calcular estatísticas da classe
            class_values = suitability_matrix[mask]
            class_coords = np.column_stack([lon_mesh[mask], lat_mesh[mask]])
            
            zone = {
                'suitability_class': suitability_class['name'],
                'suitability_range': [suitability_class['min'], suitability_class['max']],
                'color': suitability_class['color'],
                'area_cells': int(np.sum(mask)),
                'area_percentage': float(np.sum(mask) / suitability_matrix.size * 100),
                'statistics': {
                    'mean_suitability': float(np.mean(class_values)),
                    'std_suitability': float(np.std(class_values)),
                    'cell_count': int(len(class_values))
                },
                'representative_points': class_coords[:min(10, len(class_coords))].tolist()
            }
            
            zones.append(zone)
        
        return zones


def create_marine_spatial_planning_analysis(fishing_areas: List[Dict[str, Any]],
                                          protected_areas: List[Dict[str, Any]],
                                          shipping_routes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Função utilitária para análise de ordenamento espacial marinho
    Integra múltiplas camadas de uso do mar
    """
    
    analyzer = SpatialAnalysisTools()
    
    # Criar zonas buffer ao redor de áreas protegidas
    protection_buffers = analyzer.create_buffer_zones(
        protected_areas, 
        buffer_distance=5000,  # 5km
        zone_type='protection'
    )
    
    # Criar zonas buffer ao redor de rotas de navegação
    shipping_buffers = analyzer.create_buffer_zones(
        shipping_routes,
        buffer_distance=2000,  # 2km
        zone_type='exclusion'
    )
    
    # Análise de conectividade entre áreas protegidas
    connectivity_analysis = analyzer.analyze_connectivity(
        protected_areas,
        species_mobility=50000,  # 50km para espécies marinhas
        barrier_features=shipping_routes
    )
    
    # Análise multicritério para identificar zonas adequadas para pesca sustentável
    criteria = {
        'distance_to_protected': {
            'type': 'cost',
            'description': 'Distância a áreas protegidas'
        },
        'distance_to_shipping': {
            'type': 'cost', 
            'description': 'Distância a rotas de navegação'
        },
        'depth': {
            'type': 'benefit',
            'description': 'Profundidade adequada'
        },
        'chlorophyll': {
            'type': 'benefit',
            'description': 'Concentração de clorofila-a'
        }
    }
    
    weights = {
        'distance_to_protected': 0.3,
        'distance_to_shipping': 0.2,
        'depth': 0.25,
        'chlorophyll': 0.25
    }
    
    mcda_analysis = analyzer.multi_criteria_analysis(criteria, weights)
    
    return {
        'protection_buffers': [
            {
                'zone_type': buf.zone_type,
                'buffer_distance': buf.buffer_distance,
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [list(buf.buffer_geometry.exterior.coords)]
                }
            } for buf in protection_buffers
        ],
        'shipping_buffers': [
            {
                'zone_type': buf.zone_type,
                'buffer_distance': buf.buffer_distance,
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [list(buf.buffer_geometry.exterior.coords)]
                }
            } for buf in shipping_buffers
        ],
        'connectivity_analysis': connectivity_analysis,
        'suitability_analysis': mcda_analysis,
        'recommendations': {
            'sustainable_fishing_zones': mcda_analysis['suitability_zones'][:2],  # Top 2 classes
            'critical_corridors': connectivity_analysis['corridors'][:5],  # Top 5 corridors
            'protection_priorities': connectivity_analysis['critical_habitats']
        }
    }
