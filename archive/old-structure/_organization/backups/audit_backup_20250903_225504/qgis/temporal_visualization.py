"""
Temporal Visualization Module for BGAPP
Sistema de visualização temporal com slider para NDVI, Chl-a e migração
"""

import json
import numpy as np
import xarray as xr
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import logging

from ..models.biomass import chl_to_npp_empirical, ndvi_to_biomass_regression
from ..models.angola_oceanography import AngolaOceanographicModel

logger = logging.getLogger(__name__)


class TemporalVisualization:
    """
    Sistema de visualização temporal para dados oceanográficos e terrestres
    Suporta NDVI, Chl-a, SST, migração animal e dados meteorológicos
    """
    
    def __init__(self):
        self.angola_model = AngolaOceanographicModel()
        self.supported_variables = {
            'ndvi': {
                'name': 'NDVI - Vegetação',
                'units': 'índice',
                'color_scheme': 'RdYlGn',
                'data_source': 'MODIS/Sentinel',
                'temporal_resolution': 'monthly'
            },
            'chl_a': {
                'name': 'Clorofila-a',
                'units': 'mg/m³',
                'color_scheme': 'viridis',
                'data_source': 'Copernicus Marine',
                'temporal_resolution': 'daily'
            },
            'sst': {
                'name': 'Temperatura Superficial do Mar',
                'units': '°C',
                'color_scheme': 'coolwarm',
                'data_source': 'Copernicus Marine',
                'temporal_resolution': 'daily'
            },
            'npp': {
                'name': 'Produtividade Primária',
                'units': 'mg C/m²/dia',
                'color_scheme': 'plasma',
                'data_source': 'Calculado via Chl-a',
                'temporal_resolution': 'daily'
            },
            'biomass_marine': {
                'name': 'Biomassa Marinha',
                'units': 'kg/m²',
                'color_scheme': 'Blues',
                'data_source': 'Calculado via NPP',
                'temporal_resolution': 'monthly'
            },
            'biomass_terrestrial': {
                'name': 'Biomassa Terrestre',
                'units': 'kg/ha',
                'color_scheme': 'Greens',
                'data_source': 'Calculado via NDVI',
                'temporal_resolution': 'monthly'
            }
        }
        
        # Configuração temporal padrão
        self.temporal_config = {
            'start_date': '2020-01-01',
            'end_date': datetime.now().strftime('%Y-%m-%d'),
            'default_step': 'monthly',
            'animation_speed': 1000,  # ms entre frames
            'preload_frames': 12  # pré-carregar 12 meses
        }
    
    def create_temporal_slider_config(self, 
                                    variable: str,
                                    start_date: str,
                                    end_date: str,
                                    temporal_step: str = 'monthly') -> Dict[str, Any]:
        """
        Criar configuração do slider temporal para uma variável específica
        """
        if variable not in self.supported_variables:
            raise ValueError(f"Variável {variable} não suportada")
        
        var_config = self.supported_variables[variable]
        
        # Gerar lista de timestamps
        timestamps = self._generate_timestamps(start_date, end_date, temporal_step)
        
        config = {
            'variable': variable,
            'variable_info': var_config,
            'temporal': {
                'start_date': start_date,
                'end_date': end_date,
                'step': temporal_step,
                'timestamps': timestamps,
                'total_frames': len(timestamps)
            },
            'visualization': {
                'color_scheme': var_config['color_scheme'],
                'opacity': 0.8,
                'blend_mode': 'normal',
                'animation_speed': self.temporal_config['animation_speed']
            },
            'controls': {
                'play_pause': True,
                'speed_control': True,
                'frame_navigation': True,
                'loop': True,
                'reverse': True
            },
            'data_urls': self._generate_data_urls(variable, timestamps)
        }
        
        return config
    
    def _generate_timestamps(self, start_date: str, end_date: str, step: str) -> List[str]:
        """Gerar lista de timestamps para o período especificado"""
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        
        timestamps = []
        current = start
        
        if step == 'daily':
            delta = timedelta(days=1)
        elif step == 'weekly':
            delta = timedelta(weeks=1)
        elif step == 'monthly':
            delta = timedelta(days=30)  # Aproximado
        elif step == 'yearly':
            delta = timedelta(days=365)
        else:
            raise ValueError(f"Temporal step '{step}' não suportado")
        
        while current <= end:
            timestamps.append(current.isoformat()[:10])
            current += delta
        
        return timestamps
    
    def _generate_data_urls(self, variable: str, timestamps: List[str]) -> Dict[str, str]:
        """Gerar URLs dos dados para cada timestamp"""
        urls = {}
        
        for timestamp in timestamps:
            # URLs baseadas na API STAC e processamento interno
            if variable in ['ndvi', 'biomass_terrestrial']:
                urls[timestamp] = f"/api/v1/temporal/ndvi/{timestamp}"
            elif variable in ['chl_a', 'npp', 'biomass_marine']:
                urls[timestamp] = f"/api/v1/temporal/marine/{variable}/{timestamp}"
            elif variable == 'sst':
                urls[timestamp] = f"/api/v1/temporal/sst/{timestamp}"
            else:
                urls[timestamp] = f"/api/v1/temporal/generic/{variable}/{timestamp}"
        
        return urls
    
    def create_multi_variable_animation(self, 
                                      variables: List[str],
                                      start_date: str,
                                      end_date: str) -> Dict[str, Any]:
        """
        Criar animação com múltiplas variáveis sobrepostas
        Útil para correlações (ex: Chl-a + SST + ventos)
        """
        if not variables:
            raise ValueError("Lista de variáveis não pode estar vazia")
        
        # Verificar se todas as variáveis são suportadas
        for var in variables:
            if var not in self.supported_variables:
                raise ValueError(f"Variável {var} não suportada")
        
        timestamps = self._generate_timestamps(start_date, end_date, 'monthly')
        
        config = {
            'type': 'multi_variable',
            'variables': variables,
            'primary_variable': variables[0],
            'temporal': {
                'start_date': start_date,
                'end_date': end_date,
                'timestamps': timestamps,
                'total_frames': len(timestamps)
            },
            'layers': []
        }
        
        # Configurar cada variável como uma camada
        for i, var in enumerate(variables):
            var_config = self.supported_variables[var]
            layer_config = {
                'variable': var,
                'name': var_config['name'],
                'opacity': 0.7 if i > 0 else 0.8,  # Primeira camada mais opaca
                'color_scheme': var_config['color_scheme'],
                'blend_mode': 'multiply' if i > 0 else 'normal',
                'z_index': len(variables) - i,  # Primeira variável no topo
                'data_urls': self._generate_data_urls(var, timestamps)
            }
            config['layers'].append(layer_config)
        
        return config
    
    def create_migration_animation(self, 
                                 species: str,
                                 start_date: str,
                                 end_date: str,
                                 tracking_data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Criar animação de migração animal
        Integra dados de tracking GPS/satelital com variáveis ambientais
        """
        
        # Se não há dados de tracking reais, usar padrões migratórios conhecidos
        if not tracking_data:
            tracking_data = self._generate_migration_patterns(species)
        
        timestamps = self._generate_timestamps(start_date, end_date, 'weekly')
        
        config = {
            'type': 'migration_animation',
            'species': species,
            'temporal': {
                'start_date': start_date,
                'end_date': end_date,
                'timestamps': timestamps,
                'total_frames': len(timestamps)
            },
            'migration': {
                'tracking_data': tracking_data,
                'trail_length': 4,  # Mostrar últimas 4 semanas
                'point_style': {
                    'size': 8,
                    'color': '#FF4444',
                    'stroke': '#FFFFFF',
                    'stroke_width': 2
                },
                'trail_style': {
                    'color': '#FF4444',
                    'width': 2,
                    'opacity_gradient': True
                }
            },
            'environmental_layers': [
                {
                    'variable': 'sst',
                    'opacity': 0.5,
                    'color_scheme': 'coolwarm'
                },
                {
                    'variable': 'chl_a',
                    'opacity': 0.3,
                    'color_scheme': 'viridis'
                }
            ]
        }
        
        return config
    
    def _generate_migration_patterns(self, species: str) -> Dict[str, Any]:
        """
        Gerar padrões migratórios baseados em conhecimento científico
        Para diferentes espécies marinhas de Angola
        """
        patterns = {
            'tuna': {
                'name': 'Atum (Thunnus spp.)',
                'seasonal_pattern': 'north_south',
                'peak_months': [6, 7, 8, 9],  # Inverno austral
                'depth_range': [0, 200],
                'temperature_preference': [20, 28],
                'waypoints': [
                    {'lat': -4.5, 'lon': 12.0, 'month': 1},
                    {'lat': -8.0, 'lon': 11.5, 'month': 4},
                    {'lat': -12.0, 'lon': 12.0, 'month': 7},
                    {'lat': -16.0, 'lon': 11.8, 'month': 10}
                ]
            },
            'sardine': {
                'name': 'Sardinha (Sardina pilchardus)',
                'seasonal_pattern': 'upwelling_following',
                'peak_months': [6, 7, 8, 9, 10],
                'depth_range': [0, 50],
                'temperature_preference': [14, 22],
                'waypoints': [
                    {'lat': -16.0, 'lon': 11.8, 'month': 6},
                    {'lat': -14.0, 'lon': 12.2, 'month': 7},
                    {'lat': -12.0, 'lon': 12.5, 'month': 8},
                    {'lat': -10.0, 'lon': 13.0, 'month': 9}
                ]
            },
            'whale': {
                'name': 'Baleia Jubarte (Megaptera novaeangliae)',
                'seasonal_pattern': 'breeding_migration',
                'peak_months': [6, 7, 8],
                'depth_range': [0, 1000],
                'temperature_preference': [18, 25],
                'waypoints': [
                    {'lat': -8.0, 'lon': 10.0, 'month': 6},
                    {'lat': -12.0, 'lon': 9.5, 'month': 7},
                    {'lat': -16.0, 'lon': 10.0, 'month': 8}
                ]
            }
        }
        
        return patterns.get(species, patterns['tuna'])
    
    def generate_temporal_statistics(self, 
                                   variable: str,
                                   start_date: str,
                                   end_date: str,
                                   region: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Gerar estatísticas temporais para uma variável
        Útil para dashboards e relatórios
        """
        timestamps = self._generate_timestamps(start_date, end_date, 'monthly')
        
        # Se não especificada, usar toda a ZEE angolana
        if not region:
            region = {
                'name': 'ZEE Angola',
                'bounds': self.angola_model.bounds
            }
        
        # Simular dados estatísticos (em produção, ler dados reais)
        stats = {
            'variable': variable,
            'region': region['name'],
            'temporal_range': {
                'start': start_date,
                'end': end_date,
                'total_months': len(timestamps)
            },
            'statistics': {
                'mean_values': [],
                'std_values': [],
                'min_values': [],
                'max_values': [],
                'trend': None,
                'seasonality': None
            },
            'timestamps': timestamps
        }
        
        # Gerar valores simulados baseados na variável
        var_config = self.supported_variables.get(variable, {})
        
        for i, timestamp in enumerate(timestamps):
            # Simular sazonalidade
            month = datetime.fromisoformat(timestamp).month
            seasonal_factor = np.sin(2 * np.pi * month / 12)
            
            if variable == 'ndvi':
                base_value = 0.6 + 0.2 * seasonal_factor
                noise = np.random.normal(0, 0.05)
            elif variable == 'chl_a':
                base_value = 2.0 + 1.0 * seasonal_factor
                noise = np.random.normal(0, 0.3)
            elif variable == 'sst':
                base_value = 24.0 + 3.0 * seasonal_factor
                noise = np.random.normal(0, 0.5)
            else:
                base_value = 1.0 + 0.5 * seasonal_factor
                noise = np.random.normal(0, 0.1)
            
            mean_val = base_value + noise
            stats['statistics']['mean_values'].append(round(mean_val, 3))
            stats['statistics']['std_values'].append(round(abs(noise * 2), 3))
            stats['statistics']['min_values'].append(round(mean_val - abs(noise), 3))
            stats['statistics']['max_values'].append(round(mean_val + abs(noise), 3))
        
        # Calcular tendência simples
        values = np.array(stats['statistics']['mean_values'])
        if len(values) > 1:
            trend_slope = np.polyfit(range(len(values)), values, 1)[0]
            stats['statistics']['trend'] = {
                'slope': round(trend_slope, 6),
                'direction': 'increasing' if trend_slope > 0 else 'decreasing',
                'strength': 'strong' if abs(trend_slope) > 0.01 else 'weak'
            }
        
        return stats
    
    def export_animation_config(self, config: Dict[str, Any], output_path: str) -> bool:
        """
        Exportar configuração de animação para arquivo JSON
        Para uso em aplicações frontend ou QGIS
        """
        try:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Configuração de animação exportada para: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao exportar configuração: {e}")
            return False


def create_biomass_temporal_analysis(start_date: str = "2020-01-01", 
                                    end_date: str = None) -> Dict[str, Any]:
    """
    Função utilitária para criar análise temporal de biomassa
    Combina dados terrestres (NDVI) e marinhos (Chl-a)
    """
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    
    viz = TemporalVisualization()
    
    # Configuração para biomassa terrestre e marinha
    terrestrial_config = viz.create_temporal_slider_config(
        'biomass_terrestrial', start_date, end_date, 'monthly'
    )
    
    marine_config = viz.create_temporal_slider_config(
        'biomass_marine', start_date, end_date, 'monthly'
    )
    
    # Análise comparativa
    comparison_config = viz.create_multi_variable_animation(
        ['biomass_terrestrial', 'biomass_marine', 'ndvi', 'chl_a'],
        start_date, end_date
    )
    
    # Estatísticas temporais
    terrestrial_stats = viz.generate_temporal_statistics(
        'biomass_terrestrial', start_date, end_date
    )
    
    marine_stats = viz.generate_temporal_statistics(
        'biomass_marine', start_date, end_date
    )
    
    return {
        'terrestrial': {
            'config': terrestrial_config,
            'statistics': terrestrial_stats
        },
        'marine': {
            'config': marine_config,
            'statistics': marine_stats
        },
        'comparison': comparison_config,
        'metadata': {
            'created': datetime.now().isoformat(),
            'temporal_range': f"{start_date} to {end_date}",
            'analysis_type': 'biomass_temporal_comparison'
        }
    }


def create_migration_environmental_analysis(species: str = 'tuna',
                                          start_date: str = "2023-01-01",
                                          end_date: str = None) -> Dict[str, Any]:
    """
    Função utilitária para análise de migração vs variáveis ambientais
    """
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    
    viz = TemporalVisualization()
    
    # Configuração de migração
    migration_config = viz.create_migration_animation(
        species, start_date, end_date
    )
    
    # Variáveis ambientais correlacionadas
    environmental_config = viz.create_multi_variable_animation(
        ['sst', 'chl_a', 'npp'],
        start_date, end_date
    )
    
    # Estatísticas das variáveis ambientais
    sst_stats = viz.generate_temporal_statistics('sst', start_date, end_date)
    chl_stats = viz.generate_temporal_statistics('chl_a', start_date, end_date)
    
    return {
        'migration': migration_config,
        'environmental': environmental_config,
        'statistics': {
            'sst': sst_stats,
            'chlorophyll': chl_stats
        },
        'metadata': {
            'species': species,
            'created': datetime.now().isoformat(),
            'temporal_range': f"{start_date} to {end_date}",
            'analysis_type': 'migration_environmental_correlation'
        }
    }
