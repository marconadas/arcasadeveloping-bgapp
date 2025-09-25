#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🎯 Serviço MCDA (Multi-Criteria Decision Analysis) - BGAPP
=========================================================

Este módulo implementa análises multi-critério avançadas para planeamento
espacial marinho, incluindo AHP (Analytic Hierarchy Process), TOPSIS,
e análises de adequação para diferentes usos do espaço marinho.

Funcionalidades:
- Análise Hierárquica de Processos (AHP)
- TOPSIS para ranking de alternativas
- Análise de adequação de habitat
- Planeamento de aquacultura
- Zoneamento de áreas de pesca
- Identificação de áreas marinhas protegidas
- Análise de sensibilidade

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
from dataclasses import dataclass, field
from enum import Enum
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.cluster import KMeans
import warnings
warnings.filterwarnings('ignore')

# Configuração do logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CriterionType(Enum):
    """Tipos de critérios"""
    BENEFIT = "benefit"      # Quanto maior, melhor
    COST = "cost"           # Quanto menor, melhor
    TARGET = "target"       # Valor alvo específico

class PlanningObjective(Enum):
    """Objetivos de planeamento"""
    AQUACULTURE = "aquaculture"
    FISHING = "fishing"
    CONSERVATION = "conservation"
    TOURISM = "tourism"
    RENEWABLE_ENERGY = "renewable_energy"
    SHIPPING = "shipping"

@dataclass
class Criterion:
    """Critério de decisão"""
    name: str
    description: str
    criterion_type: CriterionType
    weight: float = 0.0
    target_value: Optional[float] = None
    min_threshold: Optional[float] = None
    max_threshold: Optional[float] = None
    unit: str = ""
    
@dataclass
class Alternative:
    """Alternativa de decisão (localização espacial)"""
    id: str
    name: str
    latitude: float
    longitude: float
    criteria_values: Dict[str, float] = field(default_factory=dict)
    scores: Dict[str, float] = field(default_factory=dict)
    final_score: float = 0.0
    rank: int = 0
    
@dataclass
class MCDAResult:
    """Resultado da análise MCDA"""
    objective: PlanningObjective
    method: str
    alternatives: List[Alternative]
    criteria: List[Criterion]
    weights: Dict[str, float]
    consistency_ratio: Optional[float] = None
    sensitivity_analysis: Optional[Dict] = None
    created_at: datetime = field(default_factory=datetime.now)

class MCDAService:
    """
    🎯 Serviço de Análise Multi-Critério
    
    Este serviço implementa métodos avançados de tomada de decisão
    multi-critério para planeamento espacial marinho.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Inicializar o serviço MCDA
        
        Args:
            config_path: Caminho para ficheiro de configuração
        """
        self.config = self._load_config(config_path)
        self.criteria_library: Dict[str, Dict] = {}
        self.results_history: List[MCDAResult] = []
        
        # Diretórios
        self.data_dir = Path(self.config.get('data_dir', 'data/mcda'))
        self.output_dir = Path(self.config.get('output_dir', 'outputs/mcda'))
        
        # Criar diretórios
        for dir_path in [self.data_dir, self.output_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # Carregar biblioteca de critérios pré-definidos
        self._load_criteria_library()
        
        logger.info("🚀 Serviço MCDA inicializado com sucesso")
    
    def _load_config(self, config_path: Optional[str]) -> Dict:
        """Carregar configuração"""
        default_config = {
            'data_dir': 'data/mcda',
            'output_dir': 'outputs/mcda',
            'angola_marine_area': {
                'min_lat': -18.0,
                'max_lat': -4.0,
                'min_lon': 8.0,
                'max_lon': 16.0  # Incluir área oceânica
            },
            'grid_resolution_km': 10,  # Resolução da grelha de análise
            'consistency_threshold': 0.1,  # Threshold para AHP
            'sensitivity_steps': 20  # Passos para análise de sensibilidade
        }
        
        if config_path and Path(config_path).exists():
            with open(config_path, 'r', encoding='utf-8') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        
        return default_config
    
    def _load_criteria_library(self) -> None:
        """Carregar biblioteca de critérios pré-definidos"""
        self.criteria_library = {
            'aquaculture': {
                'depth': {
                    'name': 'Profundidade',
                    'description': 'Profundidade adequada para aquacultura',
                    'type': 'target',
                    'target_value': -30,  # 30m de profundidade
                    'unit': 'm'
                },
                'temperature': {
                    'name': 'Temperatura da Água',
                    'description': 'Temperatura ótima para espécies cultivadas',
                    'type': 'target',
                    'target_value': 24,  # 24°C
                    'unit': '°C'
                },
                'current_speed': {
                    'name': 'Velocidade da Corrente',
                    'description': 'Corrente adequada para renovação da água',
                    'type': 'target',
                    'target_value': 0.3,  # 0.3 m/s
                    'unit': 'm/s'
                },
                'distance_to_coast': {
                    'name': 'Distância à Costa',
                    'description': 'Proximidade para logística',
                    'type': 'cost',
                    'unit': 'km'
                },
                'wave_height': {
                    'name': 'Altura das Ondas',
                    'description': 'Condições calmas para estruturas',
                    'type': 'cost',
                    'unit': 'm'
                }
            },
            'fishing': {
                'chlorophyll': {
                    'name': 'Clorofila-a',
                    'description': 'Produtividade primária',
                    'type': 'benefit',
                    'unit': 'mg/m³'
                },
                'depth': {
                    'name': 'Profundidade',
                    'description': 'Profundidade de pesca',
                    'type': 'target',
                    'target_value': -100,  # 100m
                    'unit': 'm'
                },
                'distance_to_port': {
                    'name': 'Distância ao Porto',
                    'description': 'Custo de deslocação',
                    'type': 'cost',
                    'unit': 'km'
                },
                'fish_abundance': {
                    'name': 'Abundância de Peixe',
                    'description': 'Densidade de espécies comerciais',
                    'type': 'benefit',
                    'unit': 'kg/km²'
                }
            },
            'conservation': {
                'biodiversity': {
                    'name': 'Biodiversidade',
                    'description': 'Riqueza de espécies',
                    'type': 'benefit',
                    'unit': 'índice'
                },
                'habitat_quality': {
                    'name': 'Qualidade do Habitat',
                    'description': 'Estado de conservação',
                    'type': 'benefit',
                    'unit': 'índice'
                },
                'human_pressure': {
                    'name': 'Pressão Humana',
                    'description': 'Impacto antropogénico',
                    'type': 'cost',
                    'unit': 'índice'
                },
                'connectivity': {
                    'name': 'Conectividade',
                    'description': 'Conectividade ecológica',
                    'type': 'benefit',
                    'unit': 'índice'
                }
            }
        }
        
        logger.info(f"✅ Biblioteca de critérios carregada: {len(self.criteria_library)} objetivos")
    
    def create_spatial_grid(
        self, 
        bounds: Optional[Dict] = None,
        resolution_km: Optional[float] = None
    ) -> List[Alternative]:
        """
        🗺️ Criar grelha espacial para análise
        
        Args:
            bounds: Limites da área (opcional)
            resolution_km: Resolução em km (opcional)
            
        Returns:
            Lista de alternativas (pontos da grelha)
        """
        if bounds is None:
            bounds = self.config['angola_marine_area']
        
        if resolution_km is None:
            resolution_km = self.config['grid_resolution_km']
        
        logger.info(f"🗺️ Criando grelha espacial (resolução: {resolution_km}km)")
        
        # Converter resolução para graus (aproximação)
        resolution_deg = resolution_km / 111.0  # ~111 km por grau
        
        # Criar grelha
        lats = np.arange(bounds['min_lat'], bounds['max_lat'], resolution_deg)
        lons = np.arange(bounds['min_lon'], bounds['max_lon'], resolution_deg)
        
        alternatives = []
        alt_id = 1
        
        for lat in lats:
            for lon in lons:
                alternative = Alternative(
                    id=f"GRID_{alt_id:04d}",
                    name=f"Ponto {alt_id}",
                    latitude=lat,
                    longitude=lon
                )
                alternatives.append(alternative)
                alt_id += 1
        
        logger.info(f"✅ Grelha criada com {len(alternatives)} pontos")
        return alternatives
    
    def populate_criteria_values(
        self, 
        alternatives: List[Alternative],
        objective: PlanningObjective
    ) -> List[Alternative]:
        """
        📊 Preencher valores dos critérios para as alternativas
        
        Args:
            alternatives: Lista de alternativas
            objective: Objetivo de planeamento
            
        Returns:
            Alternativas com valores preenchidos
        """
        logger.info(f"📊 Preenchendo valores dos critérios para {objective.value}")
        
        objective_criteria = self.criteria_library.get(objective.value, {})
        
        for alternative in alternatives:
            # Simular valores baseados na localização
            values = self._simulate_environmental_data(
                alternative.latitude, 
                alternative.longitude, 
                objective
            )
            alternative.criteria_values = values
        
        logger.info(f"✅ Valores preenchidos para {len(alternatives)} alternativas")
        return alternatives
    
    def _simulate_environmental_data(
        self, 
        lat: float, 
        lon: float, 
        objective: PlanningObjective
    ) -> Dict[str, float]:
        """Simular dados ambientais baseados na localização"""
        
        # Distância à costa (aproximação)
        coastal_distance = self._calculate_coastal_distance(lat, lon)
        
        # Profundidade (simulada baseada na distância à costa)
        depth = -10 - (coastal_distance * 10) + np.random.normal(0, 20)
        depth = max(-2000, min(-5, depth))  # Limitar entre 5m e 2000m
        
        # Temperatura (baseada na latitude)
        temperature = 26 - (lat + 11) * 0.5 + np.random.normal(0, 1)
        temperature = max(18, min(30, temperature))
        
        # Clorofila-a (maior perto da costa devido ao upwelling)
        chlorophyll = max(0.1, 3.0 - coastal_distance * 0.1 + np.random.normal(0, 0.5))
        
        # Velocidade da corrente
        current_speed = 0.2 + np.random.normal(0, 0.1)
        current_speed = max(0, min(1.0, current_speed))
        
        # Altura das ondas (maior em águas abertas)
        wave_height = 1.0 + coastal_distance * 0.05 + np.random.normal(0, 0.3)
        wave_height = max(0.5, min(4.0, wave_height))
        
        # Distância ao porto (Luanda como referência)
        port_distance = self._calculate_distance_to_luanda(lat, lon)
        
        # Biodiversidade (simulada)
        biodiversity = 0.7 + np.random.normal(0, 0.2)
        biodiversity = max(0, min(1, biodiversity))
        
        # Qualidade do habitat
        habitat_quality = 0.8 - (coastal_distance * 0.01) + np.random.normal(0, 0.1)
        habitat_quality = max(0, min(1, habitat_quality))
        
        # Pressão humana (maior perto da costa)
        human_pressure = max(0, 0.8 - coastal_distance * 0.02 + np.random.normal(0, 0.1))
        human_pressure = max(0, min(1, human_pressure))
        
        # Abundância de peixe (baseada na clorofila e profundidade)
        fish_abundance = chlorophyll * 100 * (1 + abs(depth) / 1000) + np.random.normal(0, 50)
        fish_abundance = max(0, fish_abundance)
        
        # Conectividade (simulada)
        connectivity = 0.6 + np.random.normal(0, 0.2)
        connectivity = max(0, min(1, connectivity))
        
        return {
            'depth': depth,
            'temperature': temperature,
            'current_speed': current_speed,
            'distance_to_coast': coastal_distance,
            'wave_height': wave_height,
            'chlorophyll': chlorophyll,
            'distance_to_port': port_distance,
            'fish_abundance': fish_abundance,
            'biodiversity': biodiversity,
            'habitat_quality': habitat_quality,
            'human_pressure': human_pressure,
            'connectivity': connectivity
        }
    
    def _calculate_coastal_distance(self, lat: float, lon: float) -> float:
        """Calcular distância aproximada à costa"""
        # Coordenadas aproximadas da costa angolana
        coast_points = [
            (-5.55, 12.20),   # Cabinda
            (-8.84, 13.23),   # Luanda
            (-12.58, 13.41),  # Benguela
            (-15.20, 12.15),  # Namibe
        ]
        
        min_distance = float('inf')
        for coast_lat, coast_lon in coast_points:
            distance = ((lat - coast_lat)**2 + (lon - coast_lon)**2)**0.5 * 111  # Converter para km
            min_distance = min(min_distance, distance)
        
        return min_distance
    
    def _calculate_distance_to_luanda(self, lat: float, lon: float) -> float:
        """Calcular distância ao porto de Luanda"""
        luanda_lat, luanda_lon = -8.84, 13.23
        distance = ((lat - luanda_lat)**2 + (lon - luanda_lon)**2)**0.5 * 111
        return distance
    
    def setup_ahp_criteria(
        self, 
        objective: PlanningObjective,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> List[Criterion]:
        """
        🎯 Configurar critérios para AHP
        
        Args:
            objective: Objetivo de planeamento
            custom_weights: Pesos personalizados (opcional)
            
        Returns:
            Lista de critérios configurados
        """
        logger.info(f"🎯 Configurando critérios AHP para {objective.value}")
        
        criteria_config = self.criteria_library.get(objective.value, {})
        criteria = []
        
        # Pesos padrão por objetivo
        default_weights = {
            'aquaculture': {
                'depth': 0.3,
                'temperature': 0.25,
                'current_speed': 0.2,
                'distance_to_coast': 0.15,
                'wave_height': 0.1
            },
            'fishing': {
                'chlorophyll': 0.4,
                'depth': 0.25,
                'distance_to_port': 0.2,
                'fish_abundance': 0.15
            },
            'conservation': {
                'biodiversity': 0.35,
                'habitat_quality': 0.3,
                'human_pressure': 0.2,
                'connectivity': 0.15
            }
        }
        
        weights = custom_weights or default_weights.get(objective.value, {})
        
        for criterion_name, config in criteria_config.items():
            if criterion_name in weights:
                criterion_type = CriterionType(config['type'])
                
                criterion = Criterion(
                    name=config['name'],
                    description=config['description'],
                    criterion_type=criterion_type,
                    weight=weights[criterion_name],
                    target_value=config.get('target_value'),
                    unit=config['unit']
                )
                criteria.append(criterion)
        
        logger.info(f"✅ Configurados {len(criteria)} critérios")
        return criteria
    
    def calculate_ahp_scores(
        self,
        alternatives: List[Alternative],
        criteria: List[Criterion]
    ) -> List[Alternative]:
        """
        🧮 Calcular scores usando AHP
        
        Args:
            alternatives: Lista de alternativas
            criteria: Lista de critérios
            
        Returns:
            Alternativas com scores calculados
        """
        logger.info("🧮 Calculando scores AHP")
        
        # Normalizar valores dos critérios
        scaler = MinMaxScaler()
        
        for criterion in criteria:
            criterion_name = criterion.name.lower().replace(' ', '_')
            
            # Extrair valores para este critério
            values = []
            for alt in alternatives:
                # Mapear nomes dos critérios
                mapped_name = self._map_criterion_name(criterion_name)
                if mapped_name in alt.criteria_values:
                    values.append(alt.criteria_values[mapped_name])
                else:
                    values.append(0)
            
            if not values:
                continue
                
            values = np.array(values).reshape(-1, 1)
            
            # Normalizar baseado no tipo de critério
            if criterion.criterion_type == CriterionType.BENEFIT:
                # Maior é melhor
                normalized = scaler.fit_transform(values).flatten()
            elif criterion.criterion_type == CriterionType.COST:
                # Menor é melhor (inverter)
                normalized = 1 - scaler.fit_transform(values).flatten()
            else:  # TARGET
                # Proximidade ao valor alvo
                if criterion.target_value is not None:
                    distances = np.abs(values.flatten() - criterion.target_value)
                    max_distance = np.max(distances)
                    if max_distance > 0:
                        normalized = 1 - (distances / max_distance)
                    else:
                        normalized = np.ones(len(values))
                else:
                    normalized = scaler.fit_transform(values).flatten()
            
            # Atribuir scores normalizados
            for i, alt in enumerate(alternatives):
                alt.scores[criterion_name] = normalized[i]
        
        # Calcular score final ponderado
        for alt in alternatives:
            final_score = 0
            total_weight = 0
            
            for criterion in criteria:
                criterion_name = criterion.name.lower().replace(' ', '_')
                if criterion_name in alt.scores:
                    final_score += alt.scores[criterion_name] * criterion.weight
                    total_weight += criterion.weight
            
            if total_weight > 0:
                alt.final_score = final_score / total_weight
            else:
                alt.final_score = 0
        
        # Ranking
        alternatives.sort(key=lambda x: x.final_score, reverse=True)
        for i, alt in enumerate(alternatives):
            alt.rank = i + 1
        
        logger.info("✅ Scores AHP calculados")
        return alternatives
    
    def _map_criterion_name(self, criterion_name: str) -> str:
        """Mapear nomes de critérios para nomes dos dados"""
        mapping = {
            'profundidade': 'depth',
            'temperatura_da_água': 'temperature',
            'velocidade_da_corrente': 'current_speed',
            'distância_à_costa': 'distance_to_coast',
            'altura_das_ondas': 'wave_height',
            'clorofila-a': 'chlorophyll',
            'distância_ao_porto': 'distance_to_port',
            'abundância_de_peixe': 'fish_abundance',
            'biodiversidade': 'biodiversity',
            'qualidade_do_habitat': 'habitat_quality',
            'pressão_humana': 'human_pressure',
            'conectividade': 'connectivity'
        }
        return mapping.get(criterion_name, criterion_name)
    
    def perform_topsis_analysis(
        self,
        alternatives: List[Alternative],
        criteria: List[Criterion]
    ) -> List[Alternative]:
        """
        📊 Realizar análise TOPSIS
        
        Args:
            alternatives: Lista de alternativas
            criteria: Lista de critérios
            
        Returns:
            Alternativas ranqueadas por TOPSIS
        """
        logger.info("📊 Realizando análise TOPSIS")
        
        # Criar matriz de decisão
        criterion_names = [c.name.lower().replace(' ', '_') for c in criteria]
        decision_matrix = []
        
        for alt in alternatives:
            row = []
            for criterion in criteria:
                criterion_name = criterion.name.lower().replace(' ', '_')
                mapped_name = self._map_criterion_name(criterion_name)
                value = alt.criteria_values.get(mapped_name, 0)
                row.append(value)
            decision_matrix.append(row)
        
        decision_matrix = np.array(decision_matrix)
        
        # Normalizar matriz
        norm_matrix = decision_matrix / np.sqrt(np.sum(decision_matrix**2, axis=0))
        
        # Aplicar pesos
        weights = np.array([c.weight for c in criteria])
        weighted_matrix = norm_matrix * weights
        
        # Determinar soluções ideais
        ideal_positive = []
        ideal_negative = []
        
        for i, criterion in enumerate(criteria):
            if criterion.criterion_type == CriterionType.BENEFIT:
                ideal_positive.append(np.max(weighted_matrix[:, i]))
                ideal_negative.append(np.min(weighted_matrix[:, i]))
            else:  # COST or TARGET
                ideal_positive.append(np.min(weighted_matrix[:, i]))
                ideal_negative.append(np.max(weighted_matrix[:, i]))
        
        ideal_positive = np.array(ideal_positive)
        ideal_negative = np.array(ideal_negative)
        
        # Calcular distâncias
        distances_positive = np.sqrt(np.sum((weighted_matrix - ideal_positive)**2, axis=1))
        distances_negative = np.sqrt(np.sum((weighted_matrix - ideal_negative)**2, axis=1))
        
        # Calcular scores TOPSIS
        topsis_scores = distances_negative / (distances_positive + distances_negative)
        
        # Atribuir scores às alternativas
        for i, alt in enumerate(alternatives):
            alt.final_score = topsis_scores[i]
            alt.scores['topsis'] = topsis_scores[i]
        
        # Ranking
        alternatives.sort(key=lambda x: x.final_score, reverse=True)
        for i, alt in enumerate(alternatives):
            alt.rank = i + 1
        
        logger.info("✅ Análise TOPSIS concluída")
        return alternatives
    
    def perform_sensitivity_analysis(
        self,
        alternatives: List[Alternative],
        criteria: List[Criterion],
        base_result: MCDAResult
    ) -> Dict[str, Any]:
        """
        📈 Realizar análise de sensibilidade
        
        Args:
            alternatives: Lista de alternativas
            criteria: Lista de critérios
            base_result: Resultado base
            
        Returns:
            Análise de sensibilidade
        """
        logger.info("📈 Realizando análise de sensibilidade")
        
        sensitivity_results = {
            'weight_variations': {},
            'rank_stability': {},
            'critical_weights': {}
        }
        
        # Testar variações de pesos
        steps = self.config['sensitivity_steps']
        
        for criterion in criteria:
            criterion_name = criterion.name.lower().replace(' ', '_')
            original_weight = criterion.weight
            
            weight_variations = np.linspace(0.05, 0.95, steps)
            rank_changes = []
            
            for new_weight in weight_variations:
                # Ajustar pesos (manter soma = 1)
                temp_criteria = criteria.copy()
                remaining_weight = 1.0 - new_weight
                other_criteria = [c for c in temp_criteria if c != criterion]
                
                if other_criteria:
                    weight_factor = remaining_weight / sum(c.weight for c in other_criteria)
                    for c in other_criteria:
                        c.weight *= weight_factor
                
                criterion.weight = new_weight
                
                # Recalcular scores
                temp_alternatives = [alt for alt in alternatives]  # Cópia
                temp_alternatives = self.calculate_ahp_scores(temp_alternatives, temp_criteria)
                
                # Calcular mudança no ranking
                rank_change = self._calculate_rank_change(base_result.alternatives, temp_alternatives)
                rank_changes.append(rank_change)
                
                # Restaurar peso original
                criterion.weight = original_weight
                for c in other_criteria:
                    c.weight /= weight_factor
            
            sensitivity_results['weight_variations'][criterion_name] = {
                'weights': weight_variations.tolist(),
                'rank_changes': rank_changes
            }
        
        logger.info("✅ Análise de sensibilidade concluída")
        return sensitivity_results
    
    def _calculate_rank_change(
        self, 
        original_alternatives: List[Alternative], 
        new_alternatives: List[Alternative]
    ) -> float:
        """Calcular mudança média no ranking"""
        original_ranks = {alt.id: alt.rank for alt in original_alternatives}
        
        total_change = 0
        for alt in new_alternatives:
            if alt.id in original_ranks:
                total_change += abs(alt.rank - original_ranks[alt.id])
        
        return total_change / len(new_alternatives) if new_alternatives else 0
    
    def visualize_mcda_results(
        self,
        result: MCDAResult,
        save_path: Optional[str] = None
    ) -> None:
        """
        📊 Visualizar resultados MCDA
        
        Args:
            result: Resultado da análise
            save_path: Caminho para salvar
        """
        logger.info("📊 Criando visualização dos resultados MCDA")
        
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle(f'Análise MCDA - {result.objective.value.title()}', 
                    fontsize=16, fontweight='bold')
        
        # 1. Mapa de adequação espacial
        ax1 = axes[0, 0]
        self._plot_suitability_map(result.alternatives, ax1)
        ax1.set_title('Adequação Espacial')
        
        # 2. Distribuição de scores
        ax2 = axes[0, 1]
        self._plot_score_distribution(result.alternatives, ax2)
        ax2.set_title('Distribuição de Scores')
        
        # 3. Importância dos critérios
        ax3 = axes[1, 0]
        self._plot_criteria_weights(result.criteria, ax3)
        ax3.set_title('Importância dos Critérios')
        
        # 4. Top alternativas
        ax4 = axes[1, 1]
        self._plot_top_alternatives(result.alternatives[:10], ax4)
        ax4.set_title('Top 10 Alternativas')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"💾 Visualização salva: {save_path}")
        
        plt.show()
    
    def _plot_suitability_map(self, alternatives: List[Alternative], ax):
        """Plotar mapa de adequação"""
        # Extrair coordenadas e scores
        lats = [alt.latitude for alt in alternatives]
        lons = [alt.longitude for alt in alternatives]
        scores = [alt.final_score for alt in alternatives]
        
        # Criar scatter plot
        scatter = ax.scatter(lons, lats, c=scores, cmap='RdYlGn', 
                           s=30, alpha=0.7)
        
        # Configurar mapa
        ax.set_xlabel('Longitude')
        ax.set_ylabel('Latitude')
        ax.grid(True, alpha=0.3)
        
        # Colorbar
        plt.colorbar(scatter, ax=ax, label='Score de Adequação')
        
        # Marcar top 5 alternativas
        top_alternatives = sorted(alternatives, key=lambda x: x.final_score, reverse=True)[:5]
        for i, alt in enumerate(top_alternatives):
            ax.plot(alt.longitude, alt.latitude, 'r*', markersize=15)
            ax.annotate(f'{i+1}', (alt.longitude, alt.latitude), 
                       xytext=(5, 5), textcoords='offset points',
                       fontweight='bold', color='red')
    
    def _plot_score_distribution(self, alternatives: List[Alternative], ax):
        """Plotar distribuição de scores"""
        scores = [alt.final_score for alt in alternatives]
        
        # Histograma
        ax.hist(scores, bins=30, alpha=0.7, color='skyblue', edgecolor='black')
        ax.axvline(np.mean(scores), color='red', linestyle='--', 
                  label=f'Média: {np.mean(scores):.3f}')
        ax.axvline(np.median(scores), color='green', linestyle='--',
                  label=f'Mediana: {np.median(scores):.3f}')
        
        ax.set_xlabel('Score de Adequação')
        ax.set_ylabel('Frequência')
        ax.legend()
        ax.grid(True, alpha=0.3)
    
    def _plot_criteria_weights(self, criteria: List[Criterion], ax):
        """Plotar importância dos critérios"""
        names = [c.name for c in criteria]
        weights = [c.weight for c in criteria]
        
        bars = ax.barh(names, weights, color='lightcoral')
        ax.set_xlabel('Peso')
        ax.set_xlim(0, max(weights) * 1.1)
        
        # Adicionar valores nas barras
        for bar, weight in zip(bars, weights):
            width = bar.get_width()
            ax.text(width + 0.01, bar.get_y() + bar.get_height()/2,
                   f'{weight:.3f}', ha='left', va='center')
    
    def _plot_top_alternatives(self, alternatives: List[Alternative], ax):
        """Plotar top alternativas"""
        names = [f"{alt.name}\n({alt.latitude:.2f}, {alt.longitude:.2f})" 
                for alt in alternatives]
        scores = [alt.final_score for alt in alternatives]
        
        bars = ax.bar(range(len(names)), scores, color='lightgreen')
        ax.set_xticks(range(len(names)))
        ax.set_xticklabels(names, rotation=45, ha='right')
        ax.set_ylabel('Score')
        
        # Adicionar valores nas barras
        for bar, score in zip(bars, scores):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2, height + 0.01,
                   f'{score:.3f}', ha='center', va='bottom')
    
    def export_results(
        self,
        result: MCDAResult,
        format: str = 'geojson',
        filename: Optional[str] = None
    ) -> str:
        """
        💾 Exportar resultados MCDA
        
        Args:
            result: Resultado da análise
            format: Formato ('geojson', 'csv', 'json')
            filename: Nome do ficheiro
            
        Returns:
            Caminho do ficheiro exportado
        """
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"mcda_{result.objective.value}_{timestamp}"
        
        if format.lower() == 'geojson':
            # Criar GeoDataFrame
            data = []
            for alt in result.alternatives:
                data.append({
                    'id': alt.id,
                    'name': alt.name,
                    'final_score': alt.final_score,
                    'rank': alt.rank,
                    'geometry': f"POINT({alt.longitude} {alt.latitude})",
                    **alt.criteria_values,
                    **alt.scores
                })
            
            gdf = gpd.GeoDataFrame(data, crs='EPSG:4326')
            export_path = self.output_dir / f"{filename}.geojson"
            gdf.to_file(export_path, driver='GeoJSON')
            
        elif format.lower() == 'csv':
            # Criar DataFrame
            data = []
            for alt in result.alternatives:
                row = {
                    'id': alt.id,
                    'name': alt.name,
                    'latitude': alt.latitude,
                    'longitude': alt.longitude,
                    'final_score': alt.final_score,
                    'rank': alt.rank
                }
                row.update(alt.criteria_values)
                row.update(alt.scores)
                data.append(row)
            
            df = pd.DataFrame(data)
            export_path = self.output_dir / f"{filename}.csv"
            df.to_csv(export_path, index=False)
            
        elif format.lower() == 'json':
            # Exportar como JSON
            export_data = {
                'objective': result.objective.value,
                'method': result.method,
                'created_at': result.created_at.isoformat(),
                'criteria': [
                    {
                        'name': c.name,
                        'weight': c.weight,
                        'type': c.criterion_type.value,
                        'unit': c.unit
                    } for c in result.criteria
                ],
                'alternatives': [
                    {
                        'id': alt.id,
                        'name': alt.name,
                        'latitude': alt.latitude,
                        'longitude': alt.longitude,
                        'final_score': alt.final_score,
                        'rank': alt.rank,
                        'criteria_values': alt.criteria_values,
                        'scores': alt.scores
                    } for alt in result.alternatives
                ]
            }
            
            export_path = self.output_dir / f"{filename}.json"
            with open(export_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        else:
            raise ValueError(f"❌ Formato {format} não suportado")
        
        logger.info(f"💾 Resultados exportados: {export_path}")
        return str(export_path)

# Exemplo de uso
if __name__ == "__main__":
    def main():
        # Inicializar serviço
        mcda_service = MCDAService()
        
        print("🎯 Iniciando análise MCDA para aquacultura")
        
        try:
            # Definir objetivo
            objective = PlanningObjective.AQUACULTURE
            
            # Criar grelha espacial
            alternatives = mcda_service.create_spatial_grid()
            print(f"✅ Criadas {len(alternatives)} alternativas")
            
            # Preencher valores dos critérios
            alternatives = mcda_service.populate_criteria_values(alternatives, objective)
            
            # Configurar critérios AHP
            criteria = mcda_service.setup_ahp_criteria(objective)
            print(f"✅ Configurados {len(criteria)} critérios")
            
            # Calcular scores AHP
            alternatives = mcda_service.calculate_ahp_scores(alternatives, criteria)
            
            # Criar resultado
            result = MCDAResult(
                objective=objective,
                method='AHP',
                alternatives=alternatives,
                criteria=criteria,
                weights={c.name: c.weight for c in criteria}
            )
            
            # Mostrar top 10 resultados
            print("\n🏆 Top 10 Localizações para Aquacultura:")
            for alt in alternatives[:10]:
                print(f"{alt.rank:2d}. {alt.name} - Score: {alt.final_score:.3f} "
                      f"({alt.latitude:.2f}, {alt.longitude:.2f})")
            
            # Visualizar resultados
            mcda_service.visualize_mcda_results(result)
            
            # Exportar resultados
            export_path = mcda_service.export_results(result, 'geojson')
            print(f"💾 Resultados exportados: {export_path}")
            
        except Exception as e:
            print(f"❌ Erro: {str(e)}")
    
    main()
