#!/usr/bin/env python3
"""
BGAPP Biologist Interface - Interface Científica para Biólogos Marinhos
Interface especializada e simplificada para biólogos marinhos angolanos
com terminologia científica adequada e workflows naturais.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import json
import base64
from io import BytesIO
import logging
from dataclasses import dataclass
from enum import Enum

# Configurar logging
logger = logging.getLogger(__name__)

# Configurar estilo científico para matplotlib
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")


class ConservationStatus(Enum):
    """Status de conservação segundo IUCN"""
    EXTINCT = "EX"
    EXTINCT_IN_WILD = "EW"
    CRITICALLY_ENDANGERED = "CR"
    ENDANGERED = "EN"
    VULNERABLE = "VU"
    NEAR_THREATENED = "NT"
    LEAST_CONCERN = "LC"
    DATA_DEFICIENT = "DD"
    NOT_EVALUATED = "NE"


class HabitatType(Enum):
    """Tipos de habitat marinho"""
    PELAGIC = "pelágico"
    BENTHIC = "bentónico"
    DEMERSAL = "demersal"
    EPIPELAGIC = "epipelágico"
    MESOPELAGIC = "mesopelágico"
    BATHYPELAGIC = "batipelágico"
    COASTAL = "costeiro"
    ESTUARINE = "estuarino"
    CORAL_REEF = "recife_coral"
    MANGROVE = "mangal"


@dataclass
class MarineSpecies:
    """Classe para representar espécies marinhas"""
    scientific_name: str
    common_name_pt: str
    common_name_en: str
    family: str
    order: str
    conservation_status: ConservationStatus
    habitat_type: HabitatType
    depth_range_m: Tuple[int, int]
    endemic_angola: bool
    commercial_importance: str  # "alta", "média", "baixa"
    spawning_season: List[str]  # meses
    max_length_cm: Optional[float] = None
    max_weight_kg: Optional[float] = None
    trophic_level: Optional[float] = None


class BiologistInterface:
    """
    🔬 Interface Científica para Biólogos Marinhos
    
    Interface especializada com terminologia científica adequada,
    workflows naturais e ferramentas específicas para investigação
    da biodiversidade marinha de Angola.
    """
    
    def __init__(self):
        """Inicializar interface para biólogos"""
        
        # Base de dados de espécies nativas de Angola
        self.angola_marine_species = self._initialize_species_database()
        
        # Configurações científicas
        self.scientific_config = {
            'taxonomic_levels': ['Reino', 'Filo', 'Classe', 'Ordem', 'Família', 'Género', 'Espécie'],
            'ecological_indices': ['Shannon-Weaver', 'Simpson', 'Margalef', 'Pielou'],
            'oceanographic_parameters': {
                'temperatura': {'unit': '°C', 'range': (15, 30), 'optimal': (20, 26)},
                'salinidade': {'unit': 'PSU', 'range': (30, 40), 'optimal': (34, 36)},
                'oxigenio_dissolvido': {'unit': 'mg/L', 'range': (0, 15), 'optimal': (6, 8)},
                'ph': {'unit': '', 'range': (7.5, 8.5), 'optimal': (8.0, 8.2)},
                'clorofila_a': {'unit': 'mg/m³', 'range': (0, 5), 'optimal': (0.5, 2.0)},
                'turbidez': {'unit': 'NTU', 'range': (0, 50), 'optimal': (0, 10)},
                'profundidade': {'unit': 'm', 'range': (0, 6000), 'zones': {
                    'epipelágico': (0, 200),
                    'mesopelágico': (200, 1000),
                    'batipelágico': (1000, 4000),
                    'abissopelágico': (4000, 6000)
                }}
            },
            'sampling_methods': [
                'Arrasto pelágico', 'Arrasto bentónico', 'Rede de emalhar',
                'Palangre', 'Armadilha', 'Mergulho científico', 'ROV/AUV',
                'Amostragem de plâncton', 'Transecto visual', 'Marcação e recaptura'
            ]
        }
        
        # Zonas biogeográficas de Angola
        self.biogeographic_zones = {
            'zona_tropical_norte': {
                'name': 'Zona Tropical Norte',
                'bounds': {'north': -4.2, 'south': -8.0, 'west': 8.5, 'east': 13.5},
                'characteristics': 'Águas quentes, alta diversidade, influência equatorial',
                'dominant_currents': ['Corrente de Angola'],
                'key_species': ['Thunnus albacares', 'Katsuwonus pelamis', 'Coryphaena hippurus']
            },
            'zona_transicao_central': {
                'name': 'Zona de Transição Central',
                'bounds': {'north': -8.0, 'south': -12.0, 'west': 8.5, 'east': 14.0},
                'characteristics': 'Zona de mistura, upwelling ocasional, produtividade moderada',
                'dominant_currents': ['Corrente de Angola', 'Corrente de Benguela (fraca)'],
                'key_species': ['Sardina pilchardus', 'Engraulis encrasicolus', 'Scomber japonicus']
            },
            'zona_benguela_sul': {
                'name': 'Zona de Benguela Sul',
                'bounds': {'north': -12.0, 'south': -18.2, 'west': 8.5, 'east': 15.0},
                'characteristics': 'Upwelling intenso, águas frias, alta produtividade',
                'dominant_currents': ['Corrente de Benguela'],
                'key_species': ['Merluccius capensis', 'Trachurus capensis', 'Sardinops sagax']
            }
        }
        
        # Métricas de biodiversidade
        self.biodiversity_metrics = {
            'riqueza_especifica': 'Número total de espécies numa comunidade',
            'abundancia_relativa': 'Proporção de indivíduos de cada espécie',
            'diversidade_shannon': 'Índice de Shannon-Weaver (H\')',
            'equitabilidade_pielou': 'Índice de equitabilidade de Pielou (J\')',
            'dominancia_simpson': 'Índice de dominância de Simpson (D)',
            'diversidade_margalef': 'Índice de riqueza de Margalef (R₁)',
            'similaridade_jaccard': 'Coeficiente de similaridade de Jaccard',
            'similaridade_bray_curtis': 'Índice de Bray-Curtis'
        }
        
    def _initialize_species_database(self) -> List[MarineSpecies]:
        """Inicializar base de dados de espécies marinhas de Angola"""
        
        species_data = [
            MarineSpecies(
                scientific_name="Thunnus albacares",
                common_name_pt="Atum-amarelo",
                common_name_en="Yellowfin tuna",
                family="Scombridae",
                order="Perciformes",
                conservation_status=ConservationStatus.NEAR_THREATENED,
                habitat_type=HabitatType.EPIPELAGIC,
                depth_range_m=(0, 250),
                endemic_angola=False,
                commercial_importance="alta",
                spawning_season=["Janeiro", "Fevereiro", "Março"],
                max_length_cm=239,
                max_weight_kg=200,
                trophic_level=4.2
            ),
            MarineSpecies(
                scientific_name="Sardina pilchardus",
                common_name_pt="Sardinha",
                common_name_en="European pilchard",
                family="Clupeidae",
                order="Clupeiformes",
                conservation_status=ConservationStatus.LEAST_CONCERN,
                habitat_type=HabitatType.PELAGIC,
                depth_range_m=(0, 100),
                endemic_angola=False,
                commercial_importance="alta",
                spawning_season=["Julho", "Agosto", "Setembro"],
                max_length_cm=25,
                max_weight_kg=0.2,
                trophic_level=2.1
            ),
            MarineSpecies(
                scientific_name="Merluccius capensis",
                common_name_pt="Pescada-do-cabo",
                common_name_en="Cape hake",
                family="Merlucciidae",
                order="Gadiformes",
                conservation_status=ConservationStatus.LEAST_CONCERN,
                habitat_type=HabitatType.DEMERSAL,
                depth_range_m=(50, 400),
                endemic_angola=False,
                commercial_importance="alta",
                spawning_season=["Maio", "Junho", "Julho"],
                max_length_cm=140,
                max_weight_kg=15,
                trophic_level=4.1
            ),
            MarineSpecies(
                scientific_name="Dentex angolensis",
                common_name_pt="Dentão-angolano",
                common_name_en="Angolan dentex",
                family="Sparidae",
                order="Perciformes",
                conservation_status=ConservationStatus.DATA_DEFICIENT,
                habitat_type=HabitatType.DEMERSAL,
                depth_range_m=(20, 200),
                endemic_angola=True,
                commercial_importance="média",
                spawning_season=["Outubro", "Novembro", "Dezembro"],
                max_length_cm=60,
                max_weight_kg=3.5,
                trophic_level=3.8
            ),
            MarineSpecies(
                scientific_name="Katsuwonus pelamis",
                common_name_pt="Gaiado",
                common_name_en="Skipjack tuna",
                family="Scombridae",
                order="Perciformes",
                conservation_status=ConservationStatus.LEAST_CONCERN,
                habitat_type=HabitatType.EPIPELAGIC,
                depth_range_m=(0, 260),
                endemic_angola=False,
                commercial_importance="alta",
                spawning_season=["Dezembro", "Janeiro", "Fevereiro"],
                max_length_cm=108,
                max_weight_kg=34.5,
                trophic_level=4.3
            )
        ]
        
        return species_data
    
    def generate_species_identification_guide(self, 
                                            zone: Optional[str] = None,
                                            habitat: Optional[HabitatType] = None,
                                            commercial_only: bool = False) -> str:
        """
        📚 Gerar guia de identificação de espécies
        
        Args:
            zone: Zona biogeográfica específica
            habitat: Tipo de habitat
            commercial_only: Apenas espécies comerciais
            
        Returns:
            Guia HTML de identificação
        """
        
        # Filtrar espécies
        filtered_species = self.angola_marine_species
        
        if habitat:
            filtered_species = [s for s in filtered_species if s.habitat_type == habitat]
        
        if commercial_only:
            filtered_species = [s for s in filtered_species if s.commercial_importance == "alta"]
        
        # Gerar HTML
        html_guide = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <title>Guia de Identificação - Espécies Marinhas de Angola</title>
            <style>
                body {{
                    font-family: 'Times New Roman', serif;
                    margin: 20px;
                    color: #333;
                    line-height: 1.6;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }}
                .species-card {{
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    margin: 20px 0;
                    padding: 20px;
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .scientific-name {{
                    font-style: italic;
                    font-size: 1.3em;
                    color: #1e3a8a;
                    font-weight: bold;
                }}
                .common-name {{
                    font-size: 1.1em;
                    color: #059669;
                    font-weight: bold;
                }}
                .taxonomy {{
                    background: #f8fafc;
                    padding: 10px;
                    border-left: 4px solid #0ea5e9;
                    margin: 10px 0;
                }}
                .conservation-status {{
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.9em;
                    font-weight: bold;
                    color: white;
                }}
                .endemic-badge {{
                    background: #dc2626;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    font-weight: bold;
                }}
                .habitat-info {{
                    background: #ecfdf5;
                    border: 1px solid #10b981;
                    border-radius: 5px;
                    padding: 10px;
                    margin: 10px 0;
                }}
                .morphometric {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin: 10px 0;
                }}
                .metric {{
                    background: #f3f4f6;
                    padding: 8px;
                    border-radius: 5px;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🐟 MARÍTIMO ANGOLA</h1>
                <h2>Guia de Identificação de Espécies Marinhas</h2>
                <p>Zona Económica Exclusiva de Angola - {len(filtered_species)} espécies</p>
            </div>
        """
        
        for species in filtered_species:
            # Cor do status de conservação
            status_colors = {
                ConservationStatus.CRITICALLY_ENDANGERED: '#dc2626',
                ConservationStatus.ENDANGERED: '#ea580c',
                ConservationStatus.VULNERABLE: '#d97706',
                ConservationStatus.NEAR_THREATENED: '#ca8a04',
                ConservationStatus.LEAST_CONCERN: '#16a34a',
                ConservationStatus.DATA_DEFICIENT: '#6b7280'
            }
            
            status_color = status_colors.get(species.conservation_status, '#6b7280')
            
            html_guide += f"""
            <div class="species-card">
                <div class="scientific-name">{species.scientific_name}</div>
                <div class="common-name">{species.common_name_pt} / {species.common_name_en}</div>
                
                {'<span class="endemic-badge">ENDÉMICA DE ANGOLA</span>' if species.endemic_angola else ''}
                
                <div class="taxonomy">
                    <strong>Taxonomia:</strong><br>
                    Ordem: {species.order}<br>
                    Família: {species.family}
                </div>
                
                <div class="habitat-info">
                    <strong>🏠 Habitat:</strong> {species.habitat_type.value.title()}<br>
                    <strong>📏 Profundidade:</strong> {species.depth_range_m[0]}-{species.depth_range_m[1]} m<br>
                    <strong>🐣 Reprodução:</strong> {', '.join(species.spawning_season)}
                </div>
                
                <div class="morphometric">
                    <div class="metric">
                        <strong>Comprimento Máximo</strong><br>
                        {species.max_length_cm or 'N/D'} cm
                    </div>
                    <div class="metric">
                        <strong>Peso Máximo</strong><br>
                        {species.max_weight_kg or 'N/D'} kg
                    </div>
                    <div class="metric">
                        <strong>Nível Trófico</strong><br>
                        {species.trophic_level or 'N/D'}
                    </div>
                    <div class="metric">
                        <strong>Importância Comercial</strong><br>
                        {species.commercial_importance.title()}
                    </div>
                </div>
                
                <div style="margin-top: 10px;">
                    <span class="conservation-status" style="background-color: {status_color}">
                        Status IUCN: {species.conservation_status.value}
                    </span>
                </div>
            </div>
            """
        
        html_guide += """
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p><em>Guia científico gerado pelo sistema BGAPP</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Biodiversidade da ZEE: 518.000 km²</p>
            </div>
        </body>
        </html>
        """
        
        return html_guide
    
    def calculate_biodiversity_indices(self, 
                                     species_abundance: Dict[str, int],
                                     return_interpretation: bool = True) -> Dict[str, Any]:
        """
        📊 Calcular índices de biodiversidade
        
        Args:
            species_abundance: Dicionário {espécie: abundância}
            return_interpretation: Incluir interpretação dos resultados
            
        Returns:
            Dicionário com índices calculados
        """
        
        # Converter para arrays numpy
        abundances = np.array(list(species_abundance.values()))
        total_individuals = np.sum(abundances)
        species_count = len(abundances)
        
        # Proporções
        proportions = abundances / total_individuals
        
        # Índice de Shannon-Weaver (H')
        shannon_index = -np.sum(proportions * np.log(proportions + 1e-10))
        
        # Índice de Simpson (D)
        simpson_index = np.sum(proportions ** 2)
        
        # Diversidade de Simpson (1-D)
        simpson_diversity = 1 - simpson_index
        
        # Equitabilidade de Pielou (J')
        max_shannon = np.log(species_count)
        pielou_evenness = shannon_index / max_shannon if max_shannon > 0 else 0
        
        # Índice de Margalef (R₁)
        margalef_richness = (species_count - 1) / np.log(total_individuals) if total_individuals > 1 else 0
        
        results = {
            'riqueza_especifica': species_count,
            'abundancia_total': int(total_individuals),
            'shannon_weaver': round(shannon_index, 3),
            'simpson_dominancia': round(simpson_index, 3),
            'simpson_diversidade': round(simpson_diversity, 3),
            'pielou_equitabilidade': round(pielou_evenness, 3),
            'margalef_riqueza': round(margalef_richness, 3),
            'especies_mais_abundantes': sorted(
                species_abundance.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:5]
        }
        
        if return_interpretation:
            results['interpretacao'] = self._interpret_biodiversity_indices(results)
        
        return results
    
    def _interpret_biodiversity_indices(self, indices: Dict[str, Any]) -> Dict[str, str]:
        """Interpretar índices de biodiversidade"""
        
        interpretations = {}
        
        # Shannon-Weaver
        shannon = indices['shannon_weaver']
        if shannon < 1.5:
            interpretations['shannon'] = "Baixa diversidade - comunidade dominada por poucas espécies"
        elif shannon < 3.0:
            interpretations['shannon'] = "Diversidade moderada - comunidade equilibrada"
        else:
            interpretations['shannon'] = "Alta diversidade - comunidade muito diversificada"
        
        # Equitabilidade de Pielou
        pielou = indices['pielou_equitabilidade']
        if pielou < 0.5:
            interpretations['pielou'] = "Baixa equitabilidade - distribuição desigual das espécies"
        elif pielou < 0.8:
            interpretations['pielou'] = "Equitabilidade moderada - algumas espécies dominam"
        else:
            interpretations['pielou'] = "Alta equitabilidade - espécies bem distribuídas"
        
        # Simpson
        simpson_div = indices['simpson_diversidade']
        if simpson_div < 0.5:
            interpretations['simpson'] = "Baixa diversidade - forte dominância de poucas espécies"
        elif simpson_div < 0.8:
            interpretations['simpson'] = "Diversidade moderada - dominância moderada"
        else:
            interpretations['simpson'] = "Alta diversidade - baixa dominância"
        
        return interpretations
    
    def create_biodiversity_dashboard(self, 
                                    species_data: Optional[Dict[str, int]] = None,
                                    zone: str = "ZEE Angola") -> str:
        """
        📈 Criar dashboard de biodiversidade
        
        Args:
            species_data: Dados de abundância das espécies
            zone: Nome da zona de estudo
            
        Returns:
            HTML do dashboard
        """
        
        if species_data is None:
            # Dados simulados para demonstração
            species_data = {
                'Thunnus albacares': 45,
                'Sardina pilchardus': 1250,
                'Merluccius capensis': 320,
                'Katsuwonus pelamis': 78,
                'Dentex angolensis': 156,
                'Engraulis encrasicolus': 890,
                'Scomber japonicus': 445,
                'Trachurus capensis': 267
            }
        
        # Calcular índices
        indices = self.calculate_biodiversity_indices(species_data)
        
        # Criar gráficos
        abundance_chart = self._create_abundance_chart(species_data)
        diversity_radar = self._create_diversity_radar_chart(indices)
        
        # HTML do dashboard
        dashboard_html = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <title>Dashboard de Biodiversidade - MARÍTIMO ANGOLA</title>
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background: #f8fafc;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 20px;
                }}
                .metrics-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }}
                .metric-card {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border-left: 4px solid #0ea5e9;
                }}
                .metric-value {{
                    font-size: 2em;
                    font-weight: bold;
                    color: #1e3a8a;
                }}
                .metric-label {{
                    color: #666;
                    font-size: 0.9em;
                }}
                .interpretation {{
                    background: #ecfdf5;
                    border: 1px solid #10b981;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                }}
                .chart-container {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🐟 MARÍTIMO ANGOLA</h1>
                <h2>Dashboard de Biodiversidade Marinha</h2>
                <p>{zone} - Análise Científica Automatizada</p>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">{indices['riqueza_especifica']}</div>
                    <div class="metric-label">Riqueza Específica<br>(Número de espécies)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{indices['abundancia_total']:,}</div>
                    <div class="metric-label">Abundância Total<br>(Número de indivíduos)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{indices['shannon_weaver']}</div>
                    <div class="metric-label">Índice Shannon-Weaver<br>(H')</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{indices['simpson_diversidade']}</div>
                    <div class="metric-label">Diversidade Simpson<br>(1-D)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{indices['pielou_equitabilidade']}</div>
                    <div class="metric-label">Equitabilidade Pielou<br>(J')</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{indices['margalef_riqueza']}</div>
                    <div class="metric-label">Riqueza Margalef<br>(R₁)</div>
                </div>
            </div>
            
            <div class="interpretation">
                <h3>🔬 Interpretação Científica</h3>
        """
        
        for index_name, interpretation in indices['interpretacao'].items():
            dashboard_html += f"<p><strong>{index_name.title()}:</strong> {interpretation}</p>"
        
        dashboard_html += f"""
            </div>
            
            <div class="chart-container">
                <h3>📊 Abundância por Espécie</h3>
                <div id="abundance-chart"></div>
            </div>
            
            <div class="chart-container">
                <h3>🎯 Radar de Índices de Diversidade</h3>
                <div id="diversity-radar"></div>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p><em>Dashboard científico gerado automaticamente pelo sistema BGAPP</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Investigação da Biodiversidade Marinha</p>
            </div>
            
            <script>
                // Gráfico de abundância
                {abundance_chart}
                
                // Radar de diversidade
                {diversity_radar}
            </script>
        </body>
        </html>
        """
        
        return dashboard_html
    
    def _create_abundance_chart(self, species_data: Dict[str, int]) -> str:
        """Criar gráfico de abundância das espécies"""
        
        species_names = list(species_data.keys())
        abundances = list(species_data.values())
        
        # Nomes científicos em itálico
        formatted_names = [f"<i>{name}</i>" for name in species_names]
        
        chart_code = f"""
        var abundanceData = [{{
            x: {abundances},
            y: {formatted_names},
            type: 'bar',
            orientation: 'h',
            marker: {{
                color: '#0ea5e9',
                line: {{
                    color: '#1e3a8a',
                    width: 1
                }}
            }},
            hovertemplate: '<b>%{{y}}</b><br>Abundância: %{{x}}<extra></extra>'
        }}];
        
        var abundanceLayout = {{
            title: 'Abundância por Espécie',
            xaxis: {{
                title: 'Número de Indivíduos'
            }},
            yaxis: {{
                title: 'Espécies'
            }},
            margin: {{
                l: 200,
                r: 50,
                t: 50,
                b: 50
            }}
        }};
        
        Plotly.newPlot('abundance-chart', abundanceData, abundanceLayout);
        """
        
        return chart_code
    
    def _create_diversity_radar_chart(self, indices: Dict[str, Any]) -> str:
        """Criar gráfico radar dos índices de diversidade"""
        
        # Normalizar valores para escala 0-1
        normalized_values = {
            'Shannon (H\')': min(indices['shannon_weaver'] / 4.0, 1.0),  # Max teórico ~4
            'Simpson (1-D)': indices['simpson_diversidade'],  # Já 0-1
            'Pielou (J\')': indices['pielou_equitabilidade'],  # Já 0-1
            'Margalef (R₁)': min(indices['margalef_riqueza'] / 10.0, 1.0)  # Normalizar por 10
        }
        
        categories = list(normalized_values.keys())
        values = list(normalized_values.values())
        
        chart_code = f"""
        var radarData = [{{
            type: 'scatterpolar',
            r: {values + [values[0]]},  // Fechar o polígono
            theta: {categories + [categories[0]]},
            fill: 'toself',
            fillcolor: 'rgba(14, 165, 233, 0.3)',
            line: {{
                color: '#1e3a8a',
                width: 2
            }},
            marker: {{
                color: '#1e3a8a',
                size: 8
            }},
            name: 'Índices de Diversidade'
        }}];
        
        var radarLayout = {{
            polar: {{
                radialaxis: {{
                    visible: true,
                    range: [0, 1],
                    tickmode: 'linear',
                    tick0: 0,
                    dtick: 0.2
                }}
            }},
            showlegend: false,
            title: 'Perfil de Diversidade'
        }};
        
        Plotly.newPlot('diversity-radar', radarData, radarLayout);
        """
        
        return chart_code
    
    def generate_sampling_protocol(self, 
                                 method: str,
                                 target_species: Optional[List[str]] = None,
                                 depth_range: Optional[Tuple[int, int]] = None) -> str:
        """
        📋 Gerar protocolo de amostragem científica
        
        Args:
            method: Método de amostragem
            target_species: Espécies alvo (opcional)
            depth_range: Faixa de profundidade
            
        Returns:
            Protocolo detalhado em HTML
        """
        
        protocol_html = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <title>Protocolo de Amostragem - MARÍTIMO ANGOLA</title>
            <style>
                body {{
                    font-family: 'Times New Roman', serif;
                    margin: 20px;
                    line-height: 1.6;
                }}
                .header {{
                    background: #1e3a8a;
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }}
                .section {{
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    margin: 20px 0;
                    padding: 20px;
                }}
                .checklist {{
                    background: #f0f9ff;
                    border-left: 4px solid #0ea5e9;
                    padding: 15px;
                    margin: 10px 0;
                }}
                .warning {{
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 15px;
                    margin: 10px 0;
                }}
                ol, ul {{
                    padding-left: 20px;
                }}
                .species-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }}
                .species-table th, .species-table td {{
                    border: 1px solid #d1d5db;
                    padding: 8px;
                    text-align: left;
                }}
                .species-table th {{
                    background: #f3f4f6;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔬 MARÍTIMO ANGOLA</h1>
                <h2>Protocolo de Amostragem Científica</h2>
                <p>Método: {method}</p>
                <p>Data: {datetime.now().strftime('%d/%m/%Y')}</p>
            </div>
            
            <div class="section">
                <h3>1. Objetivo da Amostragem</h3>
                <p>Amostragem científica para avaliação da biodiversidade marinha na Zona Económica Exclusiva de Angola, 
                utilizando o método <strong>{method}</strong>.</p>
                
                {f'<p><strong>Espécies alvo:</strong> {", ".join(target_species)}</p>' if target_species else ''}
                {f'<p><strong>Profundidade:</strong> {depth_range[0]}-{depth_range[1]} metros</p>' if depth_range else ''}
            </div>
            
            <div class="section">
                <h3>2. Material Necessário</h3>
                <div class="checklist">
                    <h4>📋 Lista de Verificação</h4>
                    <ul>
                        <li>☐ Arte de pesca/equipamento de amostragem</li>
                        <li>☐ GPS para georreferenciamento</li>
                        <li>☐ Sonda/ecosonda para profundidade</li>
                        <li>☐ Termómetro para temperatura da água</li>
                        <li>☐ Refractómetro para salinidade</li>
                        <li>☐ Oxímetro para oxigénio dissolvido</li>
                        <li>☐ Câmara fotográfica</li>
                        <li>☐ Balança de precisão</li>
                        <li>☐ Ictiómetro/régua</li>
                        <li>☐ Fichas de campo</li>
                        <li>☐ Recipientes para amostras</li>
                        <li>☐ Formol 4% (se necessário)</li>
                        <li>☐ Etiquetas resistentes à água</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <h3>3. Procedimento de Campo</h3>
                <ol>
                    <li><strong>Preparação:</strong>
                        <ul>
                            <li>Verificar condições meteorológicas</li>
                            <li>Calibrar equipamentos</li>
                            <li>Registar coordenadas GPS</li>
                            <li>Medir parâmetros ambientais</li>
                        </ul>
                    </li>
                    <li><strong>Amostragem:</strong>
                        <ul>
                            <li>Realizar amostragem conforme método escolhido</li>
                            <li>Registar hora de início e fim</li>
                            <li>Documentar esforço de pesca</li>
                            <li>Fotografar exemplares representativos</li>
                        </ul>
                    </li>
                    <li><strong>Processamento:</strong>
                        <ul>
                            <li>Identificar espécies ao nível mais baixo possível</li>
                            <li>Medir comprimento total (CT) e padrão (CP)</li>
                            <li>Pesar indivíduos</li>
                            <li>Registar sexo e maturidade (se aplicável)</li>
                            <li>Preservar amostras se necessário</li>
                        </ul>
                    </li>
                </ol>
            </div>
            
            <div class="section">
                <h3>4. Registo de Dados</h3>
                <p>Os seguintes dados devem ser registados para cada amostra:</p>
                <table class="species-table">
                    <tr>
                        <th>Campo</th>
                        <th>Descrição</th>
                        <th>Unidade</th>
                    </tr>
                    <tr>
                        <td>Data e Hora</td>
                        <td>Momento da captura</td>
                        <td>dd/mm/aaaa hh:mm</td>
                    </tr>
                    <tr>
                        <td>Coordenadas GPS</td>
                        <td>Latitude e Longitude</td>
                        <td>Graus decimais</td>
                    </tr>
                    <tr>
                        <td>Profundidade</td>
                        <td>Profundidade de amostragem</td>
                        <td>metros</td>
                    </tr>
                    <tr>
                        <td>Espécie</td>
                        <td>Nome científico</td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td>Comprimento Total</td>
                        <td>CT - ponta do focinho à ponta da cauda</td>
                        <td>mm</td>
                    </tr>
                    <tr>
                        <td>Peso</td>
                        <td>Peso total do indivíduo</td>
                        <td>gramas</td>
                    </tr>
                    <tr>
                        <td>Sexo</td>
                        <td>M/F/I (indeterminado)</td>
                        <td>-</td>
                    </tr>
                </table>
            </div>
            
            <div class="warning">
                <h4>⚠️ Considerações Importantes</h4>
                <ul>
                    <li>Respeitar regulamentações de pesca locais</li>
                    <li>Minimizar stress e mortalidade dos organismos</li>
                    <li>Devolver espécies não alvo ao mar quando possível</li>
                    <li>Manter cadeia de frio para amostras preservadas</li>
                    <li>Registar condições ambientais anómalas</li>
                </ul>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p><em>Protocolo científico - Sistema BGAPP</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Investigação Marinha Responsável</p>
            </div>
        </body>
        </html>
        """
        
        return protocol_html
    
    def create_ecological_analysis_report(self, 
                                        community_data: Optional[Dict[str, Any]] = None,
                                        environmental_data: Optional[Dict[str, float]] = None) -> str:
        """
        📊 Criar relatório de análise ecológica
        
        Args:
            community_data: Dados da comunidade
            environmental_data: Dados ambientais
            
        Returns:
            Relatório HTML completo
        """
        
        if community_data is None:
            # Dados simulados
            community_data = {
                'species_abundance': {
                    'Thunnus albacares': 45,
                    'Sardina pilchardus': 1250,
                    'Merluccius capensis': 320,
                    'Katsuwonus pelamis': 78,
                    'Dentex angolensis': 156
                },
                'sampling_effort': '10 horas de arrasto',
                'area_sampled': '2.5 km²',
                'date': '2025-01-15'
            }
        
        if environmental_data is None:
            environmental_data = {
                'temperatura': 24.5,
                'salinidade': 35.2,
                'oxigenio_dissolvido': 6.8,
                'ph': 8.1,
                'clorofila_a': 0.9,
                'profundidade_media': 85
            }
        
        # Calcular índices de biodiversidade
        indices = self.calculate_biodiversity_indices(community_data['species_abundance'])
        
        # Análise ambiental
        env_analysis = self._analyze_environmental_conditions(environmental_data)
        
        report_html = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Análise Ecológica - MARÍTIMO ANGOLA</title>
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            <style>
                body {{ font-family: 'Times New Roman', serif; margin: 20px; line-height: 1.6; }}
                .header {{ background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }}
                .section {{ background: white; border: 2px solid #e5e7eb; border-radius: 8px; margin: 20px 0; padding: 20px; }}
                .metrics-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }}
                .metric-card {{ background: #f8fafc; border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; text-align: center; }}
                .env-table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
                .env-table th, .env-table td {{ border: 1px solid #d1d5db; padding: 8px; text-align: center; }}
                .env-table th {{ background: #f3f4f6; }}
                .optimal {{ background-color: #dcfce7; }}
                .suboptimal {{ background-color: #fef3c7; }}
                .critical {{ background-color: #fee2e2; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔬 MARÍTIMO ANGOLA</h1>
                <h2>Relatório de Análise Ecológica</h2>
                <p>Zona Económica Exclusiva de Angola</p>
                <p>Data: {community_data['date']}</p>
            </div>
            
            <div class="section">
                <h3>📊 Resumo da Amostragem</h3>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h4>Esforço de Amostragem</h4>
                        <p>{community_data['sampling_effort']}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Área Amostrada</h4>
                        <p>{community_data['area_sampled']}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Espécies Capturadas</h4>
                        <p>{indices['riqueza_especifica']} espécies</p>
                    </div>
                    <div class="metric-card">
                        <h4>Indivíduos Totais</h4>
                        <p>{indices['abundancia_total']:,}</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3>🌊 Condições Ambientais</h3>
                <table class="env-table">
                    <tr>
                        <th>Parâmetro</th>
                        <th>Valor Medido</th>
                        <th>Unidade</th>
                        <th>Faixa Ótima</th>
                        <th>Status</th>
                    </tr>
        """
        
        for param, value in environmental_data.items():
            param_config = self.scientific_config['oceanographic_parameters'].get(param, {})
            optimal_range = param_config.get('optimal', (0, 0))
            unit = param_config.get('unit', '')
            
            # Determinar status
            if optimal_range[0] <= value <= optimal_range[1]:
                status = "Ótimo"
                css_class = "optimal"
            elif param_config.get('range', (0, 100))[0] <= value <= param_config.get('range', (0, 100))[1]:
                status = "Aceitável"
                css_class = "suboptimal"
            else:
                status = "Crítico"
                css_class = "critical"
            
            report_html += f"""
                    <tr class="{css_class}">
                        <td>{param.replace('_', ' ').title()}</td>
                        <td>{value}</td>
                        <td>{unit}</td>
                        <td>{optimal_range[0]}-{optimal_range[1]}</td>
                        <td>{status}</td>
                    </tr>
            """
        
        report_html += f"""
                </table>
            </div>
            
            <div class="section">
                <h3>📈 Índices de Biodiversidade</h3>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h4>Shannon-Weaver (H')</h4>
                        <p style="font-size: 1.5em; color: #1e3a8a;">{indices['shannon_weaver']}</p>
                        <p style="font-size: 0.9em;">{indices['interpretacao']['shannon']}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Simpson (1-D)</h4>
                        <p style="font-size: 1.5em; color: #1e3a8a;">{indices['simpson_diversidade']}</p>
                        <p style="font-size: 0.9em;">{indices['interpretacao']['simpson']}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Equitabilidade (J')</h4>
                        <p style="font-size: 1.5em; color: #1e3a8a;">{indices['pielou_equitabilidade']}</p>
                        <p style="font-size: 0.9em;">{indices['interpretacao']['pielou']}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Riqueza Margalef</h4>
                        <p style="font-size: 1.5em; color: #1e3a8a;">{indices['margalef_riqueza']}</p>
                        <p style="font-size: 0.9em;">Riqueza específica normalizada</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3>🐟 Composição da Comunidade</h3>
                <h4>Espécies Mais Abundantes:</h4>
                <ol>
        """
        
        for species, abundance in indices['especies_mais_abundantes']:
            percentage = (abundance / indices['abundancia_total']) * 100
            report_html += f"<li><em>{species}</em>: {abundance} indivíduos ({percentage:.1f}%)</li>"
        
        report_html += f"""
                </ol>
            </div>
            
            <div class="section">
                <h3>🔬 Análise Ecológica</h3>
                <h4>Interpretação dos Resultados:</h4>
                <p><strong>Diversidade:</strong> {env_analysis['diversity_assessment']}</p>
                <p><strong>Condições Ambientais:</strong> {env_analysis['environmental_assessment']}</p>
                <p><strong>Estrutura da Comunidade:</strong> {env_analysis['community_structure']}</p>
                
                <h4>Recomendações:</h4>
                <ul>
                    <li>Continuar monitorização regular desta área</li>
                    <li>Avaliar impacto da pesca nas espécies dominantes</li>
                    <li>Investigar fatores ambientais que influenciam a diversidade</li>
                    <li>Comparar com áreas adjacentes para contexto regional</li>
                </ul>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p><em>Relatório científico gerado automaticamente pelo sistema BGAPP</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Investigação da Biodiversidade Marinha</p>
                <p>Este relatório segue protocolos científicos internacionais para análise de comunidades marinhas</p>
            </div>
        </body>
        </html>
        """
        
        return report_html
    
    def _analyze_environmental_conditions(self, env_data: Dict[str, float]) -> Dict[str, str]:
        """Analisar condições ambientais"""
        
        # Análise simplificada
        temp = env_data.get('temperatura', 0)
        sal = env_data.get('salinidade', 0)
        oxy = env_data.get('oxigenio_dissolvido', 0)
        
        diversity_assessment = "A comunidade apresenta diversidade moderada a alta, indicando um ecossistema relativamente saudável."
        
        if 20 <= temp <= 26 and 34 <= sal <= 36 and oxy > 5:
            environmental_assessment = "Condições ambientais ótimas para a vida marinha, favorecendo alta biodiversidade."
        elif 18 <= temp <= 28 and 32 <= sal <= 38 and oxy > 4:
            environmental_assessment = "Condições ambientais aceitáveis, adequadas para a maioria das espécies marinhas."
        else:
            environmental_assessment = "Algumas condições ambientais fora do ideal, podendo limitar certas espécies."
        
        community_structure = "A estrutura da comunidade mostra dominância de espécies pelágicas, típica de águas abertas."
        
        return {
            'diversity_assessment': diversity_assessment,
            'environmental_assessment': environmental_assessment,
            'community_structure': community_structure
        }


# Instância global da interface para biólogos
biologist_interface = BiologistInterface()
