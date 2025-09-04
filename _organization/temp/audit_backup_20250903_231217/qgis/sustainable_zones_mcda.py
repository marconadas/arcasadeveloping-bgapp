"""
Multi-Criteria Decision Analysis (MCDA) for Sustainable Zones
Análise multicritério para identificação de zonas sustentáveis em Angola
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple, Union
from pathlib import Path
import logging
from dataclasses import dataclass
from enum import Enum

from scipy.spatial.distance import cdist
from sklearn.preprocessing import MinMaxScaler
import networkx as nx

logger = logging.getLogger(__name__)


class CriteriaType(Enum):
    """Tipos de critérios para MCDA"""
    BENEFIT = "benefit"  # Maior valor é melhor
    COST = "cost"        # Menor valor é melhor


class MCDAMethod(Enum):
    """Métodos de MCDA disponíveis"""
    WEIGHTED_SUM = "weighted_sum"
    AHP = "ahp"  # Analytic Hierarchy Process
    TOPSIS = "topsis"  # Technique for Order Preference by Similarity
    ELECTRE = "electre"  # ELimination Et Choix Traduisant la REalité
    PROMETHEE = "promethee"  # Preference Ranking Organization METHod


@dataclass
class MCDACriterion:
    """Critério individual para MCDA"""
    name: str
    description: str
    criterion_type: CriteriaType
    weight: float
    data: np.ndarray
    units: str
    normalization_method: str = "min_max"
    metadata: Dict[str, Any] = None


@dataclass
class SustainableZone:
    """Zona sustentável identificada"""
    zone_id: str
    suitability_score: float
    area_km2: float
    centroid_lat: float
    centroid_lon: float
    zone_type: str
    criteria_scores: Dict[str, float]
    recommendations: List[str]
    constraints: List[str]
    metadata: Dict[str, Any]


class SustainableZonesMCDA:
    """
    Sistema de análise multicritério para identificação de zonas sustentáveis
    Implementa múltiplos métodos MCDA para ordenamento espacial marinho
    """
    
    def __init__(self):
        # Configuração da ZEE angolana
        self.angola_bounds = {
            'north': -4.2, 'south': -18.2, 'east': 17.5, 'west': 8.5
        }
        
        # Critérios padrão para zonas sustentáveis
        self.default_criteria_templates = {
            'marine_protected_areas': {
                'biodiversity_index': {
                    'description': 'Índice de biodiversidade marinha',
                    'type': CriteriaType.BENEFIT,
                    'weight': 0.25,
                    'units': 'índice'
                },
                'habitat_quality': {
                    'description': 'Qualidade do habitat marinho',
                    'type': CriteriaType.BENEFIT,
                    'weight': 0.20,
                    'units': 'score'
                },
                'fishing_pressure': {
                    'description': 'Pressão pesqueira',
                    'type': CriteriaType.COST,
                    'weight': 0.15,
                    'units': 'effort/km²'
                },
                'distance_to_coast': {
                    'description': 'Distância à costa',
                    'type': CriteriaType.BENEFIT,
                    'weight': 0.10,
                    'units': 'km'
                },
                'water_depth': {
                    'description': 'Profundidade da água',
                    'type': CriteriaType.BENEFIT,
                    'weight': 0.15,
                    'units': 'm'
                },
                'oceanographic_features': {
                    'description': 'Características oceanográficas',
                    'type': CriteriaType.BENEFIT,
                    'weight': 0.15,
                    'units': 'score'
                }
            },
            'sustainable_fishing_zones': {
                'fish_abundance': {
                    'description': 'Abundância de peixes',
                    'type': CriteriaType.BENEFIT,
                    'weight': 0.30,
                    'units': 'biomass/km²'
                },
                'accessibility': {
                    'description': 'Acessibilidade para pescadores',
                    'type': CriteriaType.BENEFIT,
                    'weight': 0.20,
                    'units': 'score'
                },
                'environmental_impact': {
                    'description': 'Impacto ambiental',
                    'type': CriteriaType.COST,
                    'weight': 0.15,
                    'units': 'impact_score'
                },
                'economic_viability': {
                    'description': 'Viabilidade económica',
                    'type': CriteriaType.BENEFIT,
                    'weight': 0.20,
                    'units': 'EUR/trip'
                },
                'conflict_potential': {
                    'description': 'Potencial de conflito',
                    'type': CriteriaType.COST,
                    'weight': 0.15,
                    'units': 'risk_score'
                }
            },
            'aquaculture_sites': {
                'water_quality': {
                    'description': 'Qualidade da água',
                    'type': CriteriaType.BENEFIT,
                    'weight': 0.25,
                    'units': 'quality_index'
                },
                'wave_exposure': {
                    'description': 'Exposição a ondas',
                    'type': CriteriaType.COST,
                    'weight': 0.20,
                    'units': 'm'
                },
                'current_speed': {
                    'description': 'Velocidade da corrente',
                    'type': CriteriaType.BENEFIT,
                    'weight': 0.15,
                    'units': 'm/s'
                },
                'infrastructure_proximity': {
                    'description': 'Proximidade à infraestrutura',
                    'type': CriteriaType.BENEFIT,
                    'weight': 0.20,
                    'units': 'km'
                },
                'environmental_sensitivity': {
                    'description': 'Sensibilidade ambiental',
                    'type': CriteriaType.COST,
                    'weight': 0.20,
                    'units': 'sensitivity_score'
                }
            }
        }
        
        # Configurações de normalização
        self.normalization_methods = {
            'min_max': self._normalize_min_max,
            'z_score': self._normalize_z_score,
            'rank': self._normalize_rank,
            'sum': self._normalize_sum
        }
        
        # Grid de análise padrão
        self.default_grid_size = 50  # 50x50 células
    
    def create_criteria_from_template(self, 
                                    zone_type: str,
                                    data_sources: Dict[str, np.ndarray],
                                    custom_weights: Optional[Dict[str, float]] = None) -> List[MCDACriterion]:
        """
        Criar critérios baseados em templates predefinidos
        """
        if zone_type not in self.default_criteria_templates:
            raise ValueError(f"Tipo de zona não suportado: {zone_type}")
        
        template = self.default_criteria_templates[zone_type]
        criteria = []
        
        for criterion_name, criterion_config in template.items():
            # Usar dados fornecidos ou simular
            if criterion_name in data_sources:
                data = data_sources[criterion_name]
            else:
                data = self._simulate_criterion_data(criterion_name, criterion_config)
            
            # Usar peso personalizado se fornecido
            weight = custom_weights.get(criterion_name, criterion_config['weight']) if custom_weights else criterion_config['weight']
            
            criterion = MCDACriterion(
                name=criterion_name,
                description=criterion_config['description'],
                criterion_type=criterion_config['type'],
                weight=weight,
                data=data,
                units=criterion_config['units'],
                normalization_method='min_max'
            )
            
            criteria.append(criterion)
        
        # Normalizar pesos para somar 1.0
        total_weight = sum(c.weight for c in criteria)
        if abs(total_weight - 1.0) > 0.01:
            for criterion in criteria:
                criterion.weight = criterion.weight / total_weight
        
        return criteria
    
    def _simulate_criterion_data(self, 
                               criterion_name: str, 
                               criterion_config: Dict[str, Any]) -> np.ndarray:
        """Simular dados de critério para demonstração"""
        
        grid_size = self.default_grid_size
        
        # Semear baseado no nome do critério para reprodutibilidade
        np.random.seed(hash(criterion_name) % 2**32)
        
        if 'biodiversity' in criterion_name.lower():
            # Biodiversidade: maior próximo da costa e upwelling
            base_data = np.random.beta(2, 3, (grid_size, grid_size))
            # Adicionar gradiente coastal
            for i in range(grid_size):
                coastal_factor = 1.0 - (i / grid_size) * 0.5  # Diminui com distância da costa
                base_data[i, :] *= coastal_factor
            return base_data
        
        elif 'depth' in criterion_name.lower() or 'profundidade' in criterion_name.lower():
            # Profundidade: aumenta com distância da costa
            depth_data = np.zeros((grid_size, grid_size))
            for i in range(grid_size):
                for j in range(grid_size):
                    # Distância normalizada da costa (simplificado)
                    coastal_distance = i / grid_size
                    depth_data[i, j] = coastal_distance * 2000 + np.random.normal(0, 100)
            return np.maximum(depth_data, 10)  # Mínimo 10m
        
        elif 'fishing' in criterion_name.lower():
            # Pressão pesqueira: maior próximo da costa e portos
            pressure_data = np.random.exponential(2, (grid_size, grid_size))
            # Adicionar hotspots de pesca
            hotspots = [(10, 15), (25, 30), (40, 20)]  # Posições dos portos principais
            for hot_i, hot_j in hotspots:
                for i in range(grid_size):
                    for j in range(grid_size):
                        distance = np.sqrt((i - hot_i)**2 + (j - hot_j)**2)
                        pressure_data[i, j] += 5 * np.exp(-distance / 10)
            return pressure_data
        
        elif 'quality' in criterion_name.lower() or 'qualidade' in criterion_name.lower():
            # Qualidade: padrão espacial suave
            from scipy.ndimage import gaussian_filter
            base_quality = np.random.uniform(0.3, 0.9, (grid_size, grid_size))
            return gaussian_filter(base_quality, sigma=3)
        
        elif 'accessibility' in criterion_name.lower() or 'acessibilidade' in criterion_name.lower():
            # Acessibilidade: maior próximo da costa e infraestrutura
            access_data = np.zeros((grid_size, grid_size))
            for i in range(grid_size):
                coastal_access = 1.0 - (i / grid_size) * 0.8
                access_data[i, :] = coastal_access + np.random.normal(0, 0.1, grid_size)
            return np.clip(access_data, 0, 1)
        
        elif 'abundance' in criterion_name.lower() or 'abundancia' in criterion_name.lower():
            # Abundância de peixes: relacionada com upwelling e características oceanográficas
            abundance_data = np.random.lognormal(0, 1, (grid_size, grid_size))
            # Simular efeito do upwelling (mais forte no sul)
            for i in range(grid_size):
                upwelling_factor = 1.0 + (i / grid_size) * 2  # Aumenta para sul
                abundance_data[i, :] *= upwelling_factor
            return abundance_data
        
        elif 'current' in criterion_name.lower() or 'corrente' in criterion_name.lower():
            # Velocidade da corrente
            current_data = np.random.gamma(2, 0.2, (grid_size, grid_size))
            return current_data
        
        elif 'wave' in criterion_name.lower() or 'onda' in criterion_name.lower():
            # Exposição a ondas: maior no oceano aberto
            wave_data = np.zeros((grid_size, grid_size))
            for i in range(grid_size):
                for j in range(grid_size):
                    oceanic_exposure = i / grid_size  # Aumenta com distância da costa
                    wave_data[i, j] = oceanic_exposure * 3 + np.random.normal(0, 0.3)
            return np.maximum(wave_data, 0.5)
        
        else:
            # Critério genérico: distribuição normal
            return np.random.normal(0.5, 0.2, (grid_size, grid_size))
    
    def run_mcda_analysis(self, 
                         criteria: List[MCDACriterion],
                         method: MCDAMethod = MCDAMethod.WEIGHTED_SUM,
                         zone_type: str = "sustainable_zones") -> Dict[str, Any]:
        """
        Executar análise MCDA completa
        """
        
        # Normalizar critérios
        normalized_criteria = self._normalize_criteria(criteria)
        
        # Aplicar método MCDA
        if method == MCDAMethod.WEIGHTED_SUM:
            suitability_matrix = self._weighted_sum_method(normalized_criteria)
        elif method == MCDAMethod.TOPSIS:
            suitability_matrix = self._topsis_method(normalized_criteria)
        elif method == MCDAMethod.AHP:
            suitability_matrix = self._ahp_method(normalized_criteria)
        else:
            logger.warning(f"Método {method} não implementado, usando soma ponderada")
            suitability_matrix = self._weighted_sum_method(normalized_criteria)
        
        # Classificar zonas de adequação
        sustainable_zones = self._identify_sustainable_zones(
            suitability_matrix, criteria, zone_type
        )
        
        # Calcular estatísticas
        statistics = self._calculate_mcda_statistics(suitability_matrix, criteria)
        
        # Análise de sensibilidade
        sensitivity_analysis = self._perform_sensitivity_analysis(criteria, method)
        
        return {
            'method': method.value,
            'zone_type': zone_type,
            'suitability_matrix': suitability_matrix.tolist(),
            'sustainable_zones': [self._zone_to_dict(zone) for zone in sustainable_zones],
            'criteria_summary': [self._criterion_to_dict(c) for c in criteria],
            'statistics': statistics,
            'sensitivity_analysis': sensitivity_analysis,
            'analysis_metadata': {
                'grid_size': self.default_grid_size,
                'total_criteria': len(criteria),
                'analysis_date': datetime.now().isoformat(),
                'bounds': self.angola_bounds
            }
        }
    
    def _normalize_criteria(self, criteria: List[MCDACriterion]) -> List[MCDACriterion]:
        """Normalizar dados dos critérios"""
        normalized_criteria = []
        
        for criterion in criteria:
            # Aplicar método de normalização
            if criterion.normalization_method in self.normalization_methods:
                normalize_func = self.normalization_methods[criterion.normalization_method]
                normalized_data = normalize_func(criterion.data, criterion.criterion_type)
            else:
                normalized_data = self._normalize_min_max(criterion.data, criterion.criterion_type)
            
            # Criar critério normalizado
            normalized_criterion = MCDACriterion(
                name=criterion.name,
                description=criterion.description,
                criterion_type=criterion.criterion_type,
                weight=criterion.weight,
                data=normalized_data,
                units="normalized",
                normalization_method=criterion.normalization_method,
                metadata=criterion.metadata
            )
            
            normalized_criteria.append(normalized_criterion)
        
        return normalized_criteria
    
    def _normalize_min_max(self, data: np.ndarray, criterion_type: CriteriaType) -> np.ndarray:
        """Normalização min-max"""
        min_val = np.nanmin(data)
        max_val = np.nanmax(data)
        
        if max_val == min_val:
            return np.ones_like(data) * 0.5
        
        normalized = (data - min_val) / (max_val - min_val)
        
        # Inverter se for critério de custo
        if criterion_type == CriteriaType.COST:
            normalized = 1.0 - normalized
        
        return normalized
    
    def _normalize_z_score(self, data: np.ndarray, criterion_type: CriteriaType) -> np.ndarray:
        """Normalização Z-score"""
        mean_val = np.nanmean(data)
        std_val = np.nanstd(data)
        
        if std_val == 0:
            return np.ones_like(data) * 0.5
        
        z_scores = (data - mean_val) / std_val
        
        # Converter para escala 0-1
        normalized = (z_scores + 3) / 6  # Assumir ±3 sigma
        normalized = np.clip(normalized, 0, 1)
        
        if criterion_type == CriteriaType.COST:
            normalized = 1.0 - normalized
        
        return normalized
    
    def _normalize_rank(self, data: np.ndarray, criterion_type: CriteriaType) -> np.ndarray:
        """Normalização por ranking"""
        flat_data = data.flatten()
        valid_mask = ~np.isnan(flat_data)
        
        if not np.any(valid_mask):
            return np.ones_like(data) * 0.5
        
        ranks = np.zeros_like(flat_data)
        valid_data = flat_data[valid_mask]
        
        if criterion_type == CriteriaType.BENEFIT:
            sorted_indices = np.argsort(valid_data)[::-1]  # Descendente
        else:
            sorted_indices = np.argsort(valid_data)  # Ascendente
        
        for i, idx in enumerate(sorted_indices):
            original_idx = np.where(valid_mask)[0][idx]
            ranks[original_idx] = (i + 1) / len(valid_data)
        
        return ranks.reshape(data.shape)
    
    def _normalize_sum(self, data: np.ndarray, criterion_type: CriteriaType) -> np.ndarray:
        """Normalização pela soma"""
        total_sum = np.nansum(data)
        
        if total_sum == 0:
            return np.ones_like(data) * (1.0 / data.size)
        
        normalized = data / total_sum
        
        if criterion_type == CriteriaType.COST:
            # Para custos, inverter a lógica
            normalized = (1.0 / data) / np.nansum(1.0 / data)
        
        return normalized
    
    def _weighted_sum_method(self, criteria: List[MCDACriterion]) -> np.ndarray:
        """Método da soma ponderada"""
        
        if not criteria:
            raise ValueError("Lista de critérios vazia")
        
        # Inicializar matriz de adequação
        shape = criteria[0].data.shape
        suitability_matrix = np.zeros(shape)
        
        # Somar critérios ponderados
        for criterion in criteria:
            suitability_matrix += criterion.weight * criterion.data
        
        return suitability_matrix
    
    def _topsis_method(self, criteria: List[MCDACriterion]) -> np.ndarray:
        """Método TOPSIS simplificado"""
        
        if not criteria:
            raise ValueError("Lista de critérios vazia")
        
        shape = criteria[0].data.shape
        n_cells = shape[0] * shape[1]
        
        # Criar matriz de decisão (células x critérios)
        decision_matrix = np.zeros((n_cells, len(criteria)))
        weights = np.array([c.weight for c in criteria])
        
        for i, criterion in enumerate(criteria):
            decision_matrix[:, i] = criterion.data.flatten()
        
        # Identificar soluções ideais
        ideal_positive = np.max(decision_matrix, axis=0)
        ideal_negative = np.min(decision_matrix, axis=0)
        
        # Calcular distâncias
        distances_positive = np.sqrt(np.sum(weights * (decision_matrix - ideal_positive)**2, axis=1))
        distances_negative = np.sqrt(np.sum(weights * (decision_matrix - ideal_negative)**2, axis=1))
        
        # Calcular pontuação TOPSIS
        topsis_scores = distances_negative / (distances_positive + distances_negative + 1e-10)
        
        return topsis_scores.reshape(shape)
    
    def _ahp_method(self, criteria: List[MCDACriterion]) -> np.ndarray:
        """Método AHP simplificado (usando apenas pesos)"""
        # Para simplificação, usar soma ponderada com pesos AHP
        # Em implementação completa, calcular matriz de comparação par-a-par
        return self._weighted_sum_method(criteria)
    
    def _identify_sustainable_zones(self, 
                                  suitability_matrix: np.ndarray,
                                  criteria: List[MCDACriterion],
                                  zone_type: str) -> List[SustainableZone]:
        """Identificar zonas sustentáveis baseadas na matriz de adequação"""
        
        zones = []
        grid_size = suitability_matrix.shape[0]
        
        # Definir classes de adequação
        suitability_classes = [
            {'name': 'Muito Alta', 'min': 0.8, 'max': 1.0},
            {'name': 'Alta', 'min': 0.6, 'max': 0.8},
            {'name': 'Média', 'min': 0.4, 'max': 0.6}
        ]
        
        # Calcular coordenadas geográficas
        lat_range = np.linspace(self.angola_bounds['south'], self.angola_bounds['north'], grid_size)
        lon_range = np.linspace(self.angola_bounds['west'], self.angola_bounds['east'], grid_size)
        
        zone_id = 0
        
        for suitability_class in suitability_classes:
            # Identificar células que pertencem a esta classe
            mask = (suitability_matrix >= suitability_class['min']) & \
                   (suitability_matrix < suitability_class['max'])
            
            if not np.any(mask):
                continue
            
            # Agrupar células contíguas em zonas
            zone_clusters = self._find_contiguous_zones(mask)
            
            for cluster in zone_clusters:
                if len(cluster) < 3:  # Ignorar zonas muito pequenas
                    continue
                
                # Calcular centroide
                cluster_i, cluster_j = zip(*cluster)
                centroid_i = int(np.mean(cluster_i))
                centroid_j = int(np.mean(cluster_j))
                
                centroid_lat = lat_range[centroid_i]
                centroid_lon = lon_range[centroid_j]
                
                # Calcular área (aproximada)
                cell_area_km2 = ((self.angola_bounds['east'] - self.angola_bounds['west']) / grid_size) * \
                               ((self.angola_bounds['north'] - self.angola_bounds['south']) / grid_size) * \
                               111 * 111  # Conversão aproximada graus para km
                
                area_km2 = len(cluster) * cell_area_km2
                
                # Calcular pontuação média da zona
                zone_scores = [suitability_matrix[i, j] for i, j in cluster]
                avg_suitability = np.mean(zone_scores)
                
                # Calcular pontuações individuais dos critérios
                criteria_scores = {}
                for criterion in criteria:
                    criterion_values = [criterion.data[i, j] for i, j in cluster]
                    criteria_scores[criterion.name] = np.mean(criterion_values)
                
                # Gerar recomendações baseadas no tipo de zona
                recommendations = self._generate_zone_recommendations(
                    zone_type, suitability_class['name'], criteria_scores
                )
                
                # Identificar restrições
                constraints = self._identify_zone_constraints(
                    zone_type, criteria_scores
                )
                
                zone = SustainableZone(
                    zone_id=f"{zone_type}_{zone_id:03d}",
                    suitability_score=avg_suitability,
                    area_km2=area_km2,
                    centroid_lat=centroid_lat,
                    centroid_lon=centroid_lon,
                    zone_type=zone_type,
                    criteria_scores=criteria_scores,
                    recommendations=recommendations,
                    constraints=constraints,
                    metadata={
                        'suitability_class': suitability_class['name'],
                        'cell_count': len(cluster),
                        'cluster_cells': cluster[:10]  # Primeiras 10 células para referência
                    }
                )
                
                zones.append(zone)
                zone_id += 1
        
        # Ordenar zonas por adequação (decrescente)
        zones.sort(key=lambda z: z.suitability_score, reverse=True)
        
        return zones[:20]  # Retornar top 20 zonas
    
    def _find_contiguous_zones(self, mask: np.ndarray) -> List[List[Tuple[int, int]]]:
        """Encontrar zonas contíguas usando flood fill"""
        visited = np.zeros_like(mask, dtype=bool)
        clusters = []
        
        def flood_fill(start_i, start_j):
            stack = [(start_i, start_j)]
            cluster = []
            
            while stack:
                i, j = stack.pop()
                
                if (i < 0 or i >= mask.shape[0] or j < 0 or j >= mask.shape[1] or
                    visited[i, j] or not mask[i, j]):
                    continue
                
                visited[i, j] = True
                cluster.append((i, j))
                
                # Adicionar vizinhos (4-conectividade)
                stack.extend([(i+1, j), (i-1, j), (i, j+1), (i, j-1)])
            
            return cluster
        
        # Encontrar todos os clusters
        for i in range(mask.shape[0]):
            for j in range(mask.shape[1]):
                if mask[i, j] and not visited[i, j]:
                    cluster = flood_fill(i, j)
                    if cluster:
                        clusters.append(cluster)
        
        return clusters
    
    def _generate_zone_recommendations(self, 
                                     zone_type: str,
                                     suitability_class: str,
                                     criteria_scores: Dict[str, float]) -> List[str]:
        """Gerar recomendações específicas para a zona"""
        
        recommendations = []
        
        if zone_type == "marine_protected_areas":
            if suitability_class == "Muito Alta":
                recommendations.extend([
                    "Estabelecer área marinha protegida integral",
                    "Implementar monitorização contínua da biodiversidade",
                    "Restringir todas as atividades extractivas"
                ])
            elif suitability_class == "Alta":
                recommendations.extend([
                    "Considerar área marinha protegida de uso múltiplo",
                    "Permitir pesca artesanal regulamentada",
                    "Monitorizar impactos das atividades humanas"
                ])
            else:
                recommendations.extend([
                    "Zona tampão para áreas protegidas",
                    "Regulamentar atividades pesqueiras",
                    "Monitorização periódica"
                ])
        
        elif zone_type == "sustainable_fishing_zones":
            if criteria_scores.get('fish_abundance', 0) > 0.7:
                recommendations.append("Zona prioritária para pesca sustentável")
            
            if criteria_scores.get('accessibility', 0) > 0.6:
                recommendations.append("Desenvolver infraestrutura de apoio")
            
            if criteria_scores.get('conflict_potential', 0) > 0.6:
                recommendations.append("Implementar medidas de gestão de conflitos")
        
        elif zone_type == "aquaculture_sites":
            if criteria_scores.get('water_quality', 0) > 0.7:
                recommendations.append("Zona adequada para aquacultura intensiva")
            
            if criteria_scores.get('wave_exposure', 0) < 0.3:
                recommendations.append("Zona protegida, adequada para estruturas flutuantes")
            
            if criteria_scores.get('infrastructure_proximity', 0) > 0.6:
                recommendations.append("Aproveitar infraestrutura existente")
        
        # Recomendações gerais se não há específicas
        if not recommendations:
            recommendations = [
                "Realizar estudos detalhados antes da implementação",
                "Consultar comunidades locais",
                "Monitorizar impactos ambientais"
            ]
        
        return recommendations
    
    def _identify_zone_constraints(self, 
                                 zone_type: str,
                                 criteria_scores: Dict[str, float]) -> List[str]:
        """Identificar restrições para a zona"""
        
        constraints = []
        
        # Restrições baseadas em critérios específicos
        for criterion_name, score in criteria_scores.items():
            if 'fishing_pressure' in criterion_name and score > 0.7:
                constraints.append("Alta pressão pesqueira existente")
            
            elif 'environmental_impact' in criterion_name and score > 0.6:
                constraints.append("Potencial alto impacto ambiental")
            
            elif 'conflict_potential' in criterion_name and score > 0.6:
                constraints.append("Risco de conflitos com outros usos")
            
            elif 'wave_exposure' in criterion_name and score > 0.8:
                constraints.append("Alta exposição a ondas")
            
            elif 'accessibility' in criterion_name and score < 0.3:
                constraints.append("Baixa acessibilidade")
        
        # Restrições gerais
        if zone_type == "marine_protected_areas":
            constraints.append("Requer aprovação governamental")
            constraints.append("Necessita plano de gestão")
        
        elif zone_type == "aquaculture_sites":
            constraints.append("Sujeito a licenciamento ambiental")
            constraints.append("Requer estudos de impacto ambiental")
        
        return constraints
    
    def _calculate_mcda_statistics(self, 
                                 suitability_matrix: np.ndarray,
                                 criteria: List[MCDACriterion]) -> Dict[str, Any]:
        """Calcular estatísticas da análise MCDA"""
        
        valid_cells = ~np.isnan(suitability_matrix)
        valid_suitability = suitability_matrix[valid_cells]
        
        if len(valid_suitability) == 0:
            return {'error': 'No valid suitability values'}
        
        statistics = {
            'suitability_statistics': {
                'mean': float(np.mean(valid_suitability)),
                'std': float(np.std(valid_suitability)),
                'min': float(np.min(valid_suitability)),
                'max': float(np.max(valid_suitability)),
                'median': float(np.median(valid_suitability)),
                'percentiles': {
                    '25': float(np.percentile(valid_suitability, 25)),
                    '75': float(np.percentile(valid_suitability, 75)),
                    '90': float(np.percentile(valid_suitability, 90)),
                    '95': float(np.percentile(valid_suitability, 95))
                }
            },
            'area_statistics': {
                'total_analyzed_km2': float(len(valid_suitability) * 
                    ((self.angola_bounds['east'] - self.angola_bounds['west']) / self.default_grid_size) *
                    ((self.angola_bounds['north'] - self.angola_bounds['south']) / self.default_grid_size) *
                    111 * 111),
                'high_suitability_km2': float(np.sum(valid_suitability > 0.7) * 
                    ((self.angola_bounds['east'] - self.angola_bounds['west']) / self.default_grid_size) *
                    ((self.angola_bounds['north'] - self.angola_bounds['south']) / self.default_grid_size) *
                    111 * 111),
                'medium_suitability_km2': float(np.sum((valid_suitability > 0.4) & (valid_suitability <= 0.7)) * 
                    ((self.angola_bounds['east'] - self.angola_bounds['west']) / self.default_grid_size) *
                    ((self.angola_bounds['north'] - self.angola_bounds['south']) / self.default_grid_size) *
                    111 * 111)
            },
            'criteria_contribution': {}
        }
        
        # Calcular contribuição de cada critério
        for criterion in criteria:
            criterion_contribution = criterion.weight * np.mean(criterion.data[valid_cells])
            statistics['criteria_contribution'][criterion.name] = {
                'weight': float(criterion.weight),
                'mean_normalized_value': float(np.mean(criterion.data[valid_cells])),
                'contribution_to_suitability': float(criterion_contribution)
            }
        
        return statistics
    
    def _perform_sensitivity_analysis(self, 
                                    criteria: List[MCDACriterion],
                                    method: MCDAMethod) -> Dict[str, Any]:
        """Realizar análise de sensibilidade dos pesos"""
        
        sensitivity_results = {
            'weight_variations': [],
            'ranking_stability': {},
            'critical_criteria': []
        }
        
        # Testar variações de ±20% nos pesos
        weight_variations = [0.8, 0.9, 1.0, 1.1, 1.2]
        
        for i, criterion in enumerate(criteria):
            criterion_sensitivity = {
                'criterion_name': criterion.name,
                'original_weight': criterion.weight,
                'suitability_changes': []
            }
            
            for variation in weight_variations:
                # Criar cópia dos critérios com peso modificado
                modified_criteria = []
                for j, c in enumerate(criteria):
                    if i == j:
                        # Modificar peso do critério atual
                        new_weight = c.weight * variation
                    else:
                        # Ajustar outros pesos proporcionalmente
                        adjustment_factor = (1.0 - c.weight * variation) / (1.0 - c.weight) if (1.0 - c.weight) > 0 else 1.0
                        new_weight = c.weight * adjustment_factor
                    
                    modified_criterion = MCDACriterion(
                        name=c.name,
                        description=c.description,
                        criterion_type=c.criterion_type,
                        weight=max(0.01, min(0.99, new_weight)),  # Manter entre 1% e 99%
                        data=c.data,
                        units=c.units,
                        normalization_method=c.normalization_method,
                        metadata=c.metadata
                    )
                    modified_criteria.append(modified_criterion)
                
                # Normalizar pesos
                total_weight = sum(c.weight for c in modified_criteria)
                for c in modified_criteria:
                    c.weight = c.weight / total_weight
                
                # Recalcular adequação
                if method == MCDAMethod.WEIGHTED_SUM:
                    modified_suitability = self._weighted_sum_method(modified_criteria)
                else:
                    modified_suitability = self._weighted_sum_method(modified_criteria)  # Fallback
                
                # Calcular mudança na adequação média
                original_suitability = self._weighted_sum_method(criteria)
                mean_change = np.mean(modified_suitability) - np.mean(original_suitability)
                
                criterion_sensitivity['suitability_changes'].append({
                    'weight_multiplier': variation,
                    'new_weight': modified_criteria[i].weight,
                    'mean_suitability_change': float(mean_change)
                })
            
            # Calcular sensibilidade (variação máxima)
            changes = [abs(sc['mean_suitability_change']) for sc in criterion_sensitivity['suitability_changes']]
            max_sensitivity = max(changes) if changes else 0
            
            criterion_sensitivity['max_sensitivity'] = max_sensitivity
            sensitivity_results['weight_variations'].append(criterion_sensitivity)
            
            # Identificar critérios críticos (alta sensibilidade)
            if max_sensitivity > 0.1:  # Threshold de 10%
                sensitivity_results['critical_criteria'].append({
                    'criterion': criterion.name,
                    'sensitivity': max_sensitivity,
                    'importance': 'high' if max_sensitivity > 0.2 else 'medium'
                })
        
        # Ordenar critérios por sensibilidade
        sensitivity_results['critical_criteria'].sort(
            key=lambda x: x['sensitivity'], reverse=True
        )
        
        return sensitivity_results
    
    def _zone_to_dict(self, zone: SustainableZone) -> Dict[str, Any]:
        """Converter SustainableZone para dicionário"""
        return {
            'zone_id': zone.zone_id,
            'suitability_score': zone.suitability_score,
            'area_km2': zone.area_km2,
            'centroid_lat': zone.centroid_lat,
            'centroid_lon': zone.centroid_lon,
            'zone_type': zone.zone_type,
            'criteria_scores': zone.criteria_scores,
            'recommendations': zone.recommendations,
            'constraints': zone.constraints,
            'metadata': zone.metadata
        }
    
    def _criterion_to_dict(self, criterion: MCDACriterion) -> Dict[str, Any]:
        """Converter MCDACriterion para dicionário"""
        return {
            'name': criterion.name,
            'description': criterion.description,
            'criterion_type': criterion.criterion_type.value,
            'weight': criterion.weight,
            'units': criterion.units,
            'normalization_method': criterion.normalization_method,
            'data_statistics': {
                'mean': float(np.mean(criterion.data)),
                'std': float(np.std(criterion.data)),
                'min': float(np.min(criterion.data)),
                'max': float(np.max(criterion.data))
            }
        }
    
    def export_mcda_results(self, 
                          results: Dict[str, Any],
                          output_path: str,
                          format: str = 'geojson') -> bool:
        """
        Exportar resultados da análise MCDA
        """
        try:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            if format == 'geojson':
                # Criar GeoJSON com zonas sustentáveis
                features = []
                
                for zone_data in results['sustainable_zones']:
                    # Criar polígono aproximado para a zona
                    # Em produção, usar geometrias reais das zonas
                    center_lat = zone_data['centroid_lat']
                    center_lon = zone_data['centroid_lon']
                    area_km2 = zone_data['area_km2']
                    
                    # Aproximar como círculo
                    radius_km = np.sqrt(area_km2 / np.pi)
                    radius_degrees = radius_km / 111  # Aproximação
                    
                    # Criar polígono circular
                    angles = np.linspace(0, 2*np.pi, 20)
                    coords = []
                    for angle in angles:
                        lat = center_lat + radius_degrees * np.sin(angle)
                        lon = center_lon + radius_degrees * np.cos(angle)
                        coords.append([lon, lat])
                    coords.append(coords[0])  # Fechar polígono
                    
                    feature = {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': [coords]
                        },
                        'properties': zone_data
                    }
                    features.append(feature)
                
                geojson_data = {
                    'type': 'FeatureCollection',
                    'features': features,
                    'metadata': {
                        'analysis_method': results['method'],
                        'zone_type': results['zone_type'],
                        'total_zones': len(results['sustainable_zones']),
                        'created': datetime.now().isoformat()
                    }
                }
                
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(geojson_data, f, indent=2, ensure_ascii=False)
            
            elif format == 'json':
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(results, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Resultados MCDA exportados para: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao exportar resultados MCDA: {e}")
            return False


def create_marine_protected_areas_analysis() -> Dict[str, Any]:
    """
    Função utilitária para análise MCDA de áreas marinhas protegidas
    """
    
    mcda_system = SustainableZonesMCDA()
    
    # Simular dados de critérios
    data_sources = {}  # Usar dados simulados dos templates
    
    # Criar critérios para áreas marinhas protegidas
    criteria = mcda_system.create_criteria_from_template(
        'marine_protected_areas',
        data_sources
    )
    
    # Executar análise MCDA
    results = mcda_system.run_mcda_analysis(
        criteria,
        method=MCDAMethod.WEIGHTED_SUM,
        zone_type='marine_protected_areas'
    )
    
    return results


def create_sustainable_fishing_zones_analysis() -> Dict[str, Any]:
    """
    Função utilitária para análise MCDA de zonas de pesca sustentável
    """
    
    mcda_system = SustainableZonesMCDA()
    
    # Pesos personalizados para pesca sustentável
    custom_weights = {
        'fish_abundance': 0.35,  # Aumentar importância da abundância
        'accessibility': 0.25,   # Importante para pescadores artesanais
        'environmental_impact': 0.15,
        'economic_viability': 0.15,
        'conflict_potential': 0.10
    }
    
    # Criar critérios
    criteria = mcda_system.create_criteria_from_template(
        'sustainable_fishing_zones',
        {},
        custom_weights
    )
    
    # Executar análise usando TOPSIS
    results = mcda_system.run_mcda_analysis(
        criteria,
        method=MCDAMethod.TOPSIS,
        zone_type='sustainable_fishing_zones'
    )
    
    return results


def create_aquaculture_sites_analysis() -> Dict[str, Any]:
    """
    Função utilitária para análise MCDA de locais para aquacultura
    """
    
    mcda_system = SustainableZonesMCDA()
    
    # Criar critérios para aquacultura
    criteria = mcda_system.create_criteria_from_template(
        'aquaculture_sites',
        {}
    )
    
    # Executar análise
    results = mcda_system.run_mcda_analysis(
        criteria,
        method=MCDAMethod.WEIGHTED_SUM,
        zone_type='aquaculture_sites'
    )
    
    return results
