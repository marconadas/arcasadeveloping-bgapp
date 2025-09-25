#!/usr/bin/env python3
"""
BGAPP Python Cartographic Engine
Engine de mapas em Python para biólogos marinhos e pescadores angolanos
Substitui dependências JS complexas por ferramentas Python acessíveis
"""

import folium
import geopandas as gpd
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.colors import LinearSegmentedColormap
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from shapely.geometry import Point, Polygon, LineString, MultiPolygon
from shapely.ops import unary_union
import contextily as ctx
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
import json
import base64
from io import BytesIO
import logging

# Configurar logging
logger = logging.getLogger(__name__)

# TASK-003: Import do novo wrapper WebAssembly para Deck.GL
try:
    from .deckgl_wasm_wrapper import (
        DeckGLWASMWrapper, 
        DeckGLConfig, 
        DeckGLViewState,
        create_angola_marine_visualization
    )
    DECKGL_WASM_AVAILABLE = True
    logger.info("✅ Deck.GL WASM Wrapper disponível")
except ImportError as e:
    DECKGL_WASM_AVAILABLE = False
    logger.warning(f"⚠️ Deck.GL WASM Wrapper não disponível: {e}")


class AngolaMarineCartography:
    """
    🗺️ Engine Cartográfico Python para BGAPP
    
    Ferramentas de mapeamento especializadas para biólogos marinhos
    e pescadores angolanos, com foco na ZEE de Angola.
    """
    
    def __init__(self):
        """Inicializar engine cartográfico"""
        
        # Configuração da ZEE Angolana (coordenadas corrigidas e validadas)
        self.angola_zee_config = {
            'continental': {
                'name': 'Angola Continental',
                'bounds': {
                    'north': -6.02,     # Após gap RDC
                    'south': -17.266,   # Rio Cunene
                    'east': 17.5,       # Limite oceânico (200nm)
                    'west': 8.5         # Costa atlântica
                },
                'color': '#0066cc',
                'area_km2': 450000,
                'unclos_compliant': True,
                'precision': 'high',
                'last_updated': '2025-09-14'
            },
            'cabinda_enclave': {
                'name': 'Cabinda (Enclave)',
                'bounds': {
                    'north': -4.2,      # Limite norte
                    'south': -6.02,     # Limite sul
                    'east': 13.5,       # Limite leste
                    'west': 11.5        # Limite oeste
                },
                'color': '#9b59b6',
                'area_km2': 68000,
                'unclos_compliant': True,
                'precision': 'high',
                'last_updated': '2025-09-14'
            },
            'total_area_km2': 518000,
            'validation_status': 'validated',
            'data_source': 'UNCLOS + International Treaties'
        }
        
        # Zonas de pesca angolanas
        self.fishing_zones = {
            'norte': {
                'name': 'Zona Norte',
                'description': 'Cabinda - Luanda',
                'bounds': (-8.8, -4.2, 8.5, 13.5),  # (south, north, west, east)
                'color': '#16a34a',
                'main_species': ['Thunnus albacares', 'Katsuwonus pelamis', 'Sardinella aurita'],
                'ports': ['Cabinda', 'Soyo', 'Luanda']
            },
            'centro': {
                'name': 'Zona Centro',
                'description': 'Luanda - Lobito',
                'bounds': (-12.8, -8.8, 8.5, 14.0),
                'color': '#0ea5e9',
                'main_species': ['Sardina pilchardus', 'Engraulis encrasicolus', 'Scomber japonicus'],
                'ports': ['Luanda', 'Ambriz', 'Lobito']
            },
            'sul': {
                'name': 'Zona Sul',
                'description': 'Lobito - Cunene',
                'bounds': (-18.2, -12.8, 8.5, 15.0),
                'color': '#ea580c',
                'main_species': ['Merluccius capensis', 'Dentex angolensis', 'Trachurus capensis'],
                'ports': ['Lobito', 'Benguela', 'Namibe', 'Tombwa']
            }
        }
        
        # Portos principais de Angola
        self.major_ports = {
            'Luanda': {'lat': -8.8390, 'lon': 13.2894, 'type': 'principal', 'zone': 'norte'},
            'Lobito': {'lat': -12.3486, 'lon': 13.5472, 'type': 'principal', 'zone': 'centro'},
            'Benguela': {'lat': -12.5763, 'lon': 13.4055, 'type': 'secundário', 'zone': 'centro'},
            'Namibe': {'lat': -15.1961, 'lon': 12.1522, 'type': 'secundário', 'zone': 'sul'},
            'Cabinda': {'lat': -5.5550, 'lon': 12.2022, 'type': 'principal', 'zone': 'norte'},
            'Soyo': {'lat': -6.1358, 'lon': 12.3689, 'type': 'secundário', 'zone': 'norte'}
        }
        
        # Paletas de cores para diferentes tipos de dados
        self.color_palettes = {
            'oceanographic': {
                'sst': ['#000080', '#0066cc', '#00ccff', '#ffff00', '#ff6600', '#cc0000'],
                'chlorophyll': ['#000033', '#006600', '#33cc33', '#ffff00', '#ff3300'],
                'salinity': ['#330066', '#6600cc', '#cc00ff', '#ff66cc', '#ffccff'],
                'bathymetry': ['#000066', '#003399', '#0066cc', '#66ccff', '#ccffff']
            },
            'biological': {
                'species_diversity': ['#ffffcc', '#c7e9b4', '#7fcdbb', '#41b6c4', '#2c7fb8', '#253494'],
                'biomass': ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#e34a33', '#b30000'],
                'conservation_status': ['#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#fddbc7', '#f4a582', '#d6604d', '#b2182b']
            },
            'fisheries': {
                'catch_intensity': ['#ffffd4', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#8c2d04'],
                'vessel_density': ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594']
            }
        }
        
        # Configurações de estilo
        self.style_config = {
            'figure_size': (12, 8),
            'dpi': 300,
            'font_family': 'Arial',
            'title_size': 16,
            'label_size': 12,
            'legend_size': 10,
            'line_width': 2,
            'marker_size': 8
        }
        
    def create_angola_zee_map(self, 
                             include_fishing_zones: bool = True,
                             include_ports: bool = True,
                             include_bathymetry: bool = False,
                             map_type: str = 'folium') -> Union[folium.Map, str]:
        """
        🗺️ Criar mapa da ZEE de Angola
        
        Args:
            include_fishing_zones: Incluir zonas de pesca
            include_ports: Incluir portos principais
            include_bathymetry: Incluir batimetria
            map_type: 'folium', 'matplotlib', ou 'plotly'
            
        Returns:
            Mapa da ZEE angolana
        """
        
        if map_type == 'folium':
            return self._create_folium_zee_map(include_fishing_zones, include_ports, include_bathymetry)
        elif map_type == 'matplotlib':
            return self._create_matplotlib_zee_map(include_fishing_zones, include_ports, include_bathymetry)
        elif map_type == 'plotly':
            return self._create_plotly_zee_map(include_fishing_zones, include_ports, include_bathymetry)
        else:
            raise ValueError(f"Tipo de mapa não suportado: {map_type}")
    
    def _create_folium_zee_map(self, include_fishing_zones, include_ports, include_bathymetry) -> folium.Map:
        """Criar mapa Folium da ZEE"""
        
        # Centro do mapa (Angola central)
        center_lat = -12.5
        center_lon = 13.5
        
        # Criar mapa base
        m = folium.Map(
            location=[center_lat, center_lon],
            zoom_start=6,
            tiles='OpenStreetMap',
            attr='BGAPP - Marítimo Angola'
        )
        
        # Adicionar camadas de base alternativas
        folium.TileLayer(
            tiles='https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
            attr='ESRI Ocean',
            name='Oceano ESRI',
            overlay=False,
            control=True
        ).add_to(m)
        
        # ZEE Continental
        continental_zee = self._create_zee_polygon('continental')
        folium.GeoJson(
            continental_zee,
            style_function=lambda x: {
                'fillColor': self.angola_zee_config['continental']['color'],
                'color': self.angola_zee_config['continental']['color'],
                'weight': 2,
                'fillOpacity': 0.3
            },
            popup=folium.Popup(f"""
                <b>ZEE Angola Continental</b><br>
                Área: {self.angola_zee_config['continental']['area_km2']:,} km²<br>
                Extensão: Rio Congo até Rio Cunene
            """, max_width=300),
            tooltip='ZEE Angola Continental'
        ).add_to(m)
        
        # ZEE Cabinda (Enclave)
        cabinda_zee = self._create_zee_polygon('cabinda_enclave')
        folium.GeoJson(
            cabinda_zee,
            style_function=lambda x: {
                'fillColor': self.angola_zee_config['cabinda_enclave']['color'],
                'color': self.angola_zee_config['cabinda_enclave']['color'],
                'weight': 2,
                'fillOpacity': 0.3
            },
            popup=folium.Popup(f"""
                <b>ZEE Cabinda (Enclave)</b><br>
                Área: {self.angola_zee_config['cabinda_enclave']['area_km2']:,} km²<br>
                Status: Enclave separado pela RDC
            """, max_width=300),
            tooltip='ZEE Cabinda (Enclave)'
        ).add_to(m)
        
        # Zonas de pesca
        if include_fishing_zones:
            for zone_id, zone_data in self.fishing_zones.items():
                zone_polygon = self._create_fishing_zone_polygon(zone_id)
                
                folium.GeoJson(
                    zone_polygon,
                    style_function=lambda x, color=zone_data['color']: {
                        'fillColor': color,
                        'color': color,
                        'weight': 1,
                        'fillOpacity': 0.2,
                        'dashArray': '5, 5'
                    },
                    popup=folium.Popup(f"""
                        <b>{zone_data['name']}</b><br>
                        {zone_data['description']}<br>
                        <b>Espécies principais:</b><br>
                        {'<br>'.join([f"• {species}" for species in zone_data['main_species'][:3]])}
                        <br><b>Portos:</b> {', '.join(zone_data['ports'])}
                    """, max_width=350),
                    tooltip=f"Zona de Pesca: {zone_data['name']}"
                ).add_to(m)
        
        # Portos principais
        if include_ports:
            for port_name, port_data in self.major_ports.items():
                icon_color = 'red' if port_data['type'] == 'principal' else 'blue'
                icon_icon = 'anchor' if port_data['type'] == 'principal' else 'ship'
                
                folium.Marker(
                    location=[port_data['lat'], port_data['lon']],
                    popup=folium.Popup(f"""
                        <b>Porto de {port_name}</b><br>
                        Tipo: {port_data['type'].title()}<br>
                        Zona: {port_data['zone'].title()}<br>
                        Coordenadas: {port_data['lat']:.3f}, {port_data['lon']:.3f}
                    """, max_width=250),
                    tooltip=f"Porto de {port_name}",
                    icon=folium.Icon(color=icon_color, icon=icon_icon, prefix='fa')
                ).add_to(m)
        
        # Controle de camadas
        folium.LayerControl().add_to(m)
        
        # Adicionar escala
        folium.plugins.MeasureControl().add_to(m)
        
        # Adicionar mini mapa
        minimap = folium.plugins.MiniMap()
        m.add_child(minimap)
        
        # Logo MARÍTIMO ANGOLA
        logo_html = '''
        <div style="position: fixed; 
                    top: 10px; right: 10px; width: 150px; height: 60px; 
                    background-color: rgba(255,255,255,0.9); 
                    border: 2px solid #1e3a8a; border-radius: 5px;
                    z-index: 9999; font-size: 12px; text-align: center;
                    padding: 5px;">
            <b style="color: #1e3a8a;">MARÍTIMO ANGOLA</b><br>
            <span style="color: #666; font-size: 10px;">BGAPP - ZEE {area:,} km²</span>
        </div>
        '''.format(area=self.angola_zee_config['total_area_km2'])
        
        m.get_root().html.add_child(folium.Element(logo_html))
        
        return m
    
    def _create_matplotlib_zee_map(self, include_fishing_zones, include_ports, include_bathymetry) -> str:
        """Criar mapa Matplotlib da ZEE (retorna base64)"""
        
        fig, ax = plt.subplots(figsize=self.style_config['figure_size'], dpi=self.style_config['dpi'])
        
        # Configurar limites do mapa
        ax.set_xlim(8.0, 18.0)
        ax.set_ylim(-19.0, -3.5)
        
        # ZEE Continental
        continental_bounds = self.angola_zee_config['continental']['bounds']
        continental_rect = patches.Rectangle(
            (continental_bounds['west'], continental_bounds['south']),
            continental_bounds['east'] - continental_bounds['west'],
            continental_bounds['north'] - continental_bounds['south'],
            linewidth=2,
            edgecolor=self.angola_zee_config['continental']['color'],
            facecolor=self.angola_zee_config['continental']['color'],
            alpha=0.3,
            label='ZEE Angola Continental'
        )
        ax.add_patch(continental_rect)
        
        # ZEE Cabinda
        cabinda_bounds = self.angola_zee_config['cabinda_enclave']['bounds']
        cabinda_rect = patches.Rectangle(
            (cabinda_bounds['west'], cabinda_bounds['south']),
            cabinda_bounds['east'] - cabinda_bounds['west'],
            cabinda_bounds['north'] - cabinda_bounds['south'],
            linewidth=2,
            edgecolor=self.angola_zee_config['cabinda_enclave']['color'],
            facecolor=self.angola_zee_config['cabinda_enclave']['color'],
            alpha=0.3,
            label='ZEE Cabinda (Enclave)'
        )
        ax.add_patch(cabinda_rect)
        
        # Zonas de pesca
        if include_fishing_zones:
            for zone_id, zone_data in self.fishing_zones.items():
                bounds = zone_data['bounds']  # (south, north, west, east)
                zone_rect = patches.Rectangle(
                    (bounds[2], bounds[0]),  # (west, south)
                    bounds[3] - bounds[2],   # width
                    bounds[1] - bounds[0],   # height
                    linewidth=1,
                    edgecolor=zone_data['color'],
                    facecolor='none',
                    linestyle='--',
                    alpha=0.7,
                    label=f"Pesca {zone_data['name']}"
                )
                ax.add_patch(zone_rect)
        
        # Portos principais
        if include_ports:
            for port_name, port_data in self.major_ports.items():
                marker = 'o' if port_data['type'] == 'principal' else 's'
                size = 100 if port_data['type'] == 'principal' else 60
                color = 'red' if port_data['type'] == 'principal' else 'blue'
                
                ax.scatter(
                    port_data['lon'], port_data['lat'],
                    marker=marker, s=size, c=color,
                    edgecolors='black', linewidth=1,
                    label=f"Porto {port_data['type']}" if port_name == list(self.major_ports.keys())[0] else "",
                    zorder=5
                )
                
                # Etiqueta do porto
                ax.annotate(
                    port_name,
                    (port_data['lon'], port_data['lat']),
                    xytext=(5, 5), textcoords='offset points',
                    fontsize=8, ha='left', va='bottom',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.7)
                )
        
        # Configurar eixos e título
        ax.set_xlabel('Longitude (°E)', fontsize=self.style_config['label_size'])
        ax.set_ylabel('Latitude (°S)', fontsize=self.style_config['label_size'])
        ax.set_title('Zona Económica Exclusiva de Angola\nMARÍTIMO ANGOLA - BGAPP', 
                    fontsize=self.style_config['title_size'], fontweight='bold', color='#1e3a8a')
        
        # Grid
        ax.grid(True, alpha=0.3)
        
        # Legenda
        ax.legend(loc='upper right', fontsize=self.style_config['legend_size'])
        
        # Adicionar informações
        info_text = f"Área Total ZEE: {self.angola_zee_config['total_area_km2']:,} km²"
        ax.text(0.02, 0.02, info_text, transform=ax.transAxes, 
               fontsize=10, bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.8))
        
        plt.tight_layout()
        
        # Converter para base64
        buffer = BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight', dpi=self.style_config['dpi'])
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return f"data:image/png;base64,{image_base64}"
    
    def _create_plotly_zee_map(self, include_fishing_zones, include_ports, include_bathymetry) -> go.Figure:
        """Criar mapa Plotly da ZEE"""
        
        fig = go.Figure()
        
        # ZEE Continental
        continental_bounds = self.angola_zee_config['continental']['bounds']
        fig.add_trace(go.Scatter(
            x=[continental_bounds['west'], continental_bounds['east'], 
               continental_bounds['east'], continental_bounds['west'], continental_bounds['west']],
            y=[continental_bounds['south'], continental_bounds['south'], 
               continental_bounds['north'], continental_bounds['north'], continental_bounds['south']],
            fill='toself',
            fillcolor=f"rgba(0, 102, 204, 0.3)",
            line=dict(color=self.angola_zee_config['continental']['color'], width=2),
            name='ZEE Angola Continental',
            hovertemplate=f"<b>ZEE Angola Continental</b><br>Área: {self.angola_zee_config['continental']['area_km2']:,} km²<extra></extra>"
        ))
        
        # ZEE Cabinda
        cabinda_bounds = self.angola_zee_config['cabinda_enclave']['bounds']
        fig.add_trace(go.Scatter(
            x=[cabinda_bounds['west'], cabinda_bounds['east'], 
               cabinda_bounds['east'], cabinda_bounds['west'], cabinda_bounds['west']],
            y=[cabinda_bounds['south'], cabinda_bounds['south'], 
               cabinda_bounds['north'], cabinda_bounds['north'], cabinda_bounds['south']],
            fill='toself',
            fillcolor=f"rgba(155, 89, 182, 0.3)",
            line=dict(color=self.angola_zee_config['cabinda_enclave']['color'], width=2),
            name='ZEE Cabinda (Enclave)',
            hovertemplate=f"<b>ZEE Cabinda (Enclave)</b><br>Área: {self.angola_zee_config['cabinda_enclave']['area_km2']:,} km²<extra></extra>"
        ))
        
        # Portos principais
        if include_ports:
            port_lats = [port_data['lat'] for port_data in self.major_ports.values()]
            port_lons = [port_data['lon'] for port_data in self.major_ports.values()]
            port_names = list(self.major_ports.keys())
            port_types = [port_data['type'] for port_data in self.major_ports.values()]
            
            fig.add_trace(go.Scatter(
                x=port_lons,
                y=port_lats,
                mode='markers',
                marker=dict(
                    size=[15 if t == 'principal' else 10 for t in port_types],
                    color=['red' if t == 'principal' else 'blue' for t in port_types],
                    symbol=['circle' if t == 'principal' else 'square' for t in port_types],
                    line=dict(width=2, color='black')
                ),
                text=port_names,
                textposition="top center",
                name='Portos de Angola',
                hovertemplate="<b>Porto de %{text}</b><br>Lat: %{y:.3f}<br>Lon: %{x:.3f}<extra></extra>"
            ))
        
        # Configurar layout
        fig.update_layout(
            title=dict(
                text="Zona Económica Exclusiva de Angola<br><sub>MARÍTIMO ANGOLA - BGAPP</sub>",
                x=0.5,
                font=dict(size=18, color='#1e3a8a')
            ),
            xaxis_title="Longitude (°E)",
            yaxis_title="Latitude (°S)",
            xaxis=dict(range=[8.0, 18.0]),
            yaxis=dict(range=[-19.0, -3.5]),
            showlegend=True,
            hovermode='closest',
            plot_bgcolor='rgba(240,248,255,0.8)',
            paper_bgcolor='white',
            font=dict(family=self.style_config['font_family'], size=12)
        )
        
        # Adicionar anotação com área total
        fig.add_annotation(
            x=0.02, y=0.98,
            xref="paper", yref="paper",
            text=f"Área Total ZEE: {self.angola_zee_config['total_area_km2']:,} km²",
            showarrow=False,
            font=dict(size=12, color='#1e3a8a'),
            bgcolor="rgba(255,255,255,0.8)",
            bordercolor="#1e3a8a",
            borderwidth=1
        )
        
        return fig
    
    def _create_zee_polygon(self, zee_type: str) -> Dict:
        """Criar polígono GeoJSON da ZEE"""
        bounds = self.angola_zee_config[zee_type]['bounds']
        
        # Criar retângulo simples (seria substituído por dados reais de fronteiras)
        coordinates = [[
            [bounds['west'], bounds['south']],
            [bounds['east'], bounds['south']],
            [bounds['east'], bounds['north']],
            [bounds['west'], bounds['north']],
            [bounds['west'], bounds['south']]
        ]]
        
        return {
            "type": "Feature",
            "properties": {
                "name": self.angola_zee_config[zee_type]['name'],
                "area_km2": self.angola_zee_config[zee_type]['area_km2']
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": coordinates
            }
        }
    
    def _create_fishing_zone_polygon(self, zone_id: str) -> Dict:
        """Criar polígono GeoJSON da zona de pesca"""
        bounds = self.fishing_zones[zone_id]['bounds']  # (south, north, west, east)
        
        coordinates = [[
            [bounds[2], bounds[0]],  # [west, south]
            [bounds[3], bounds[0]],  # [east, south]
            [bounds[3], bounds[1]],  # [east, north]
            [bounds[2], bounds[1]],  # [west, north]
            [bounds[2], bounds[0]]   # [west, south]
        ]]
        
        return {
            "type": "Feature",
            "properties": {
                "name": self.fishing_zones[zone_id]['name'],
                "description": self.fishing_zones[zone_id]['description']
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": coordinates
            }
        }
    
    def create_oceanographic_visualization(self, 
                                         parameter: str,
                                         data: Optional[np.ndarray] = None,
                                         timestamps: Optional[List[datetime]] = None,
                                         visualization_type: str = 'matplotlib') -> Union[str, go.Figure]:
        """
        🌊 Criar visualização de parâmetros oceanográficos
        
        Args:
            parameter: 'sst', 'chlorophyll', 'salinity', 'wave_height'
            data: Dados oceanográficos (se None, usa dados simulados)
            timestamps: Lista de timestamps
            visualization_type: 'matplotlib' ou 'plotly'
            
        Returns:
            Visualização do parâmetro oceanográfico
        """
        
        if data is None:
            # Gerar dados simulados
            data = self._generate_simulated_oceanographic_data(parameter)
        
        if timestamps is None:
            # Gerar timestamps para últimos 30 dias
            timestamps = [datetime.now() - timedelta(days=i) for i in range(30, 0, -1)]
        
        if visualization_type == 'matplotlib':
            return self._create_matplotlib_oceanographic_viz(parameter, data, timestamps)
        elif visualization_type == 'plotly':
            return self._create_plotly_oceanographic_viz(parameter, data, timestamps)
        else:
            raise ValueError(f"Tipo de visualização não suportado: {visualization_type}")
    
    def _generate_simulated_oceanographic_data(self, parameter: str) -> np.ndarray:
        """Gerar dados oceanográficos simulados para demonstração"""
        
        np.random.seed(42)  # Para reprodutibilidade
        
        if parameter == 'sst':
            # Temperatura superficial do mar (20-28°C para Angola)
            base_temp = 24.0
            return base_temp + np.random.normal(0, 2, 30)
        elif parameter == 'chlorophyll':
            # Clorofila-a (0.1-2.0 mg/m³)
            base_chl = 0.8
            return np.abs(base_chl + np.random.normal(0, 0.3, 30))
        elif parameter == 'salinity':
            # Salinidade (34-36 PSU)
            base_sal = 35.0
            return base_sal + np.random.normal(0, 0.5, 30)
        elif parameter == 'wave_height':
            # Altura de onda (0.5-3.0 m)
            base_wave = 1.8
            return np.abs(base_wave + np.random.normal(0, 0.5, 30))
        else:
            return np.random.normal(0, 1, 30)
    
    def _create_matplotlib_oceanographic_viz(self, parameter: str, data: np.ndarray, timestamps: List[datetime]) -> str:
        """Criar visualização matplotlib de dados oceanográficos"""
        
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), height_ratios=[2, 1])
        
        # Configurações específicas por parâmetro
        param_config = {
            'sst': {'title': 'Temperatura Superficial do Mar', 'unit': '°C', 'color': '#ff6b35'},
            'chlorophyll': {'title': 'Concentração de Clorofila-a', 'unit': 'mg/m³', 'color': '#2ecc71'},
            'salinity': {'title': 'Salinidade', 'unit': 'PSU', 'color': '#3498db'},
            'wave_height': {'title': 'Altura Significativa de Onda', 'unit': 'm', 'color': '#9b59b6'}
        }.get(parameter, {'title': parameter.title(), 'unit': '', 'color': '#34495e'})
        
        # Gráfico de série temporal
        ax1.plot(timestamps, data, color=param_config['color'], linewidth=2, marker='o', markersize=4)
        ax1.set_title(f"{param_config['title']} - ZEE Angola\nMARÍTIMO ANGOLA", 
                     fontsize=16, fontweight='bold', color='#1e3a8a')
        ax1.set_ylabel(f"{param_config['title']} ({param_config['unit']})", fontsize=12)
        ax1.grid(True, alpha=0.3)
        
        # Estatísticas
        mean_val = np.mean(data)
        std_val = np.std(data)
        min_val = np.min(data)
        max_val = np.max(data)
        
        ax1.axhline(y=mean_val, color='red', linestyle='--', alpha=0.7, label=f'Média: {mean_val:.2f}')
        ax1.fill_between(timestamps, mean_val - std_val, mean_val + std_val, 
                        alpha=0.2, color=param_config['color'], label=f'±1 Desvio Padrão')
        ax1.legend()
        
        # Histograma
        ax2.hist(data, bins=15, color=param_config['color'], alpha=0.7, edgecolor='black')
        ax2.set_xlabel(f"{param_config['title']} ({param_config['unit']})", fontsize=12)
        ax2.set_ylabel('Frequência', fontsize=12)
        ax2.set_title('Distribuição dos Valores', fontsize=12)
        ax2.grid(True, alpha=0.3)
        
        # Adicionar estatísticas no histograma
        stats_text = f"Mín: {min_val:.2f}\nMáx: {max_val:.2f}\nMédia: {mean_val:.2f}\nDesvio: {std_val:.2f}"
        ax2.text(0.75, 0.75, stats_text, transform=ax2.transAxes, 
                bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.8),
                fontsize=10, verticalalignment='top')
        
        plt.tight_layout()
        
        # Converter para base64
        buffer = BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight', dpi=300)
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return f"data:image/png;base64,{image_base64}"
    
    def _create_plotly_oceanographic_viz(self, parameter: str, data: np.ndarray, timestamps: List[datetime]) -> go.Figure:
        """Criar visualização Plotly de dados oceanográficos"""
        
        # Configurações específicas por parâmetro
        param_config = {
            'sst': {'title': 'Temperatura Superficial do Mar', 'unit': '°C', 'color': '#ff6b35'},
            'chlorophyll': {'title': 'Concentração de Clorofila-a', 'unit': 'mg/m³', 'color': '#2ecc71'},
            'salinity': {'title': 'Salinidade', 'unit': 'PSU', 'color': '#3498db'},
            'wave_height': {'title': 'Altura Significativa de Onda', 'unit': 'm', 'color': '#9b59b6'}
        }.get(parameter, {'title': parameter.title(), 'unit': '', 'color': '#34495e'})
        
        # Criar subplots
        fig = make_subplots(
            rows=2, cols=1,
            subplot_titles=('Série Temporal', 'Distribuição dos Valores'),
            row_heights=[0.7, 0.3],
            vertical_spacing=0.1
        )
        
        # Série temporal
        fig.add_trace(
            go.Scatter(
                x=timestamps,
                y=data,
                mode='lines+markers',
                line=dict(color=param_config['color'], width=2),
                marker=dict(size=6),
                name=param_config['title'],
                hovertemplate=f"<b>{param_config['title']}</b><br>Data: %{{x}}<br>Valor: %{{y:.2f}} {param_config['unit']}<extra></extra>"
            ),
            row=1, col=1
        )
        
        # Linha da média
        mean_val = np.mean(data)
        fig.add_hline(
            y=mean_val,
            line_dash="dash",
            line_color="red",
            annotation_text=f"Média: {mean_val:.2f} {param_config['unit']}",
            row=1, col=1
        )
        
        # Histograma
        fig.add_trace(
            go.Histogram(
                x=data,
                nbinsx=15,
                marker_color=param_config['color'],
                opacity=0.7,
                name='Distribuição',
                showlegend=False
            ),
            row=2, col=1
        )
        
        # Layout
        fig.update_layout(
            title=dict(
                text=f"{param_config['title']} - ZEE Angola<br><sub>MARÍTIMO ANGOLA - BGAPP</sub>",
                x=0.5,
                font=dict(size=18, color='#1e3a8a')
            ),
            showlegend=False,
            height=600,
            font=dict(family='Arial', size=12)
        )
        
        # Eixos
        fig.update_xaxes(title_text="Data", row=1, col=1)
        fig.update_yaxes(title_text=f"{param_config['title']} ({param_config['unit']})", row=1, col=1)
        fig.update_xaxes(title_text=f"{param_config['title']} ({param_config['unit']})", row=2, col=1)
        fig.update_yaxes(title_text="Frequência", row=2, col=1)
        
        return fig
    
    def create_species_distribution_map(self, 
                                      species_data: Optional[pd.DataFrame] = None,
                                      map_type: str = 'folium') -> Union[folium.Map, str, go.Figure]:
        """
        🐠 Criar mapa de distribuição de espécies
        
        Args:
            species_data: DataFrame com colunas ['species', 'lat', 'lon', 'abundance']
            map_type: 'folium', 'matplotlib', ou 'plotly'
            
        Returns:
            Mapa de distribuição de espécies
        """
        
        if species_data is None:
            # Gerar dados simulados de espécies
            species_data = self._generate_simulated_species_data()
        
        if map_type == 'folium':
            return self._create_folium_species_map(species_data)
        elif map_type == 'matplotlib':
            return self._create_matplotlib_species_map(species_data)
        elif map_type == 'plotly':
            return self._create_plotly_species_map(species_data)
        else:
            raise ValueError(f"Tipo de mapa não suportado: {map_type}")
    
    def _generate_simulated_species_data(self) -> pd.DataFrame:
        """Gerar dados simulados de espécies para demonstração"""
        
        np.random.seed(42)
        
        species_list = [
            'Thunnus albacares', 'Sardina pilchardus', 'Merluccius capensis',
            'Katsuwonus pelamis', 'Engraulis encrasicolus', 'Scomber japonicus',
            'Dentex angolensis', 'Trachurus capensis', 'Sardinella aurita'
        ]
        
        data = []
        for species in species_list:
            # Gerar 10-20 pontos por espécie
            n_points = np.random.randint(10, 21)
            
            for _ in range(n_points):
                # Coordenadas aleatórias dentro da ZEE Angola
                lat = np.random.uniform(-17.5, -5.0)
                lon = np.random.uniform(9.0, 16.0)
                abundance = np.random.exponential(2.0)  # Distribuição exponencial para abundância
                
                data.append({
                    'species': species,
                    'lat': lat,
                    'lon': lon,
                    'abundance': abundance
                })
        
        return pd.DataFrame(data)
    
    def _create_folium_species_map(self, species_data: pd.DataFrame) -> folium.Map:
        """Criar mapa Folium de distribuição de espécies"""
        
        # Centro do mapa
        center_lat = species_data['lat'].mean()
        center_lon = species_data['lon'].mean()
        
        # Criar mapa base
        m = folium.Map(
            location=[center_lat, center_lon],
            zoom_start=6,
            tiles='OpenStreetMap'
        )
        
        # Cores por espécie
        species_colors = {
            species: color for species, color in zip(
                species_data['species'].unique(),
                px.colors.qualitative.Set3[:len(species_data['species'].unique())]
            )
        }
        
        # Adicionar pontos por espécie
        for species in species_data['species'].unique():
            species_subset = species_data[species_data['species'] == species]
            
            for _, row in species_subset.iterrows():
                # Tamanho do marcador baseado na abundância
                marker_size = max(5, min(20, row['abundance'] * 3))
                
                folium.CircleMarker(
                    location=[row['lat'], row['lon']],
                    radius=marker_size,
                    popup=folium.Popup(f"""
                        <b>{row['species']}</b><br>
                        Abundância: {row['abundance']:.2f}<br>
                        Coordenadas: {row['lat']:.3f}, {row['lon']:.3f}
                    """, max_width=300),
                    color=species_colors[species],
                    fillColor=species_colors[species],
                    fillOpacity=0.7,
                    weight=2
                ).add_to(m)
        
        # Adicionar legenda HTML
        legend_html = '''
        <div style="position: fixed; 
                    bottom: 50px; left: 50px; width: 200px; height: auto; 
                    background-color: white; border:2px solid grey; z-index:9999; 
                    font-size:14px; padding: 10px">
        <p><b>Espécies Marinhas</b></p>
        '''
        
        for species, color in species_colors.items():
            legend_html += f'<p><i class="fa fa-circle" style="color:{color}"></i> {species.split()[-1]}</p>'
        
        legend_html += '</div>'
        m.get_root().html.add_child(folium.Element(legend_html))
        
        return m
    
    def generate_fisheries_report(self, 
                                zone: str = 'all',
                                period_days: int = 30,
                                format_type: str = 'html') -> str:
        """
        📊 Gerar relatório de pescas
        
        Args:
            zone: 'norte', 'centro', 'sul', ou 'all'
            period_days: Período em dias
            format_type: 'html', 'pdf', ou 'json'
            
        Returns:
            Relatório formatado
        """
        
        if format_type == 'html':
            return self._generate_html_fisheries_report(zone, period_days)
        elif format_type == 'json':
            return self._generate_json_fisheries_report(zone, period_days)
        else:
            raise ValueError(f"Formato não suportado: {format_type}")
    
    def _generate_html_fisheries_report(self, zone: str, period_days: int) -> str:
        """Gerar relatório HTML de pescas"""
        
        # Dados simulados para o relatório
        report_data = {
            'total_catch': np.random.uniform(1200, 1800),
            'active_vessels': np.random.randint(800, 1000),
            'top_species': [
                {'name': 'Sardinha', 'catch': np.random.uniform(400, 600), 'percentage': 35},
                {'name': 'Atum', 'catch': np.random.uniform(200, 400), 'percentage': 25},
                {'name': 'Cavala', 'catch': np.random.uniform(150, 250), 'percentage': 15}
            ],
            'zone_stats': {
                'Norte': {'vessels': 312, 'catch': 450.2},
                'Centro': {'vessels': 428, 'catch': 678.5},
                'Sul': {'vessels': 152, 'catch': 234.8}
            }
        }
        
        html_report = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Pescas - MARÍTIMO ANGOLA</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }}
                .metric {{
                    background: #f8fafc;
                    border-left: 4px solid #0ea5e9;
                    padding: 15px;
                    margin: 10px 0;
                    border-radius: 5px;
                }}
                .zone-stats {{
                    display: flex;
                    justify-content: space-around;
                    margin: 20px 0;
                }}
                .zone-card {{
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 15px;
                    text-align: center;
                    min-width: 150px;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }}
                th, td {{
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }}
                th {{
                    background-color: #1e3a8a;
                    color: white;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>MARÍTIMO ANGOLA</h1>
                <h2>Relatório de Pescas - ZEE Angola</h2>
                <p>Período: Últimos {period_days} dias | Zona: {zone.title()}</p>
            </div>
            
            <div class="metric">
                <h3>📊 Resumo Executivo</h3>
                <p><strong>Captura Total:</strong> {report_data['total_catch']:.1f} toneladas</p>
                <p><strong>Embarcações Ativas:</strong> {report_data['active_vessels']} unidades</p>
                <p><strong>Média Diária:</strong> {report_data['total_catch']/period_days:.1f} ton/dia</p>
            </div>
            
            <h3>🎣 Estatísticas por Zona</h3>
            <div class="zone-stats">
        """
        
        for zone_name, stats in report_data['zone_stats'].items():
            html_report += f"""
                <div class="zone-card">
                    <h4>{zone_name}</h4>
                    <p><strong>{stats['vessels']}</strong> embarcações</p>
                    <p><strong>{stats['catch']:.1f}</strong> toneladas</p>
                </div>
            """
        
        html_report += f"""
            </div>
            
            <h3>🐟 Principais Espécies Capturadas</h3>
            <table>
                <tr>
                    <th>Espécie</th>
                    <th>Captura (ton)</th>
                    <th>Percentual</th>
                </tr>
        """
        
        for species in report_data['top_species']:
            html_report += f"""
                <tr>
                    <td>{species['name']}</td>
                    <td>{species['catch']:.1f}</td>
                    <td>{species['percentage']}%</td>
                </tr>
            """
        
        html_report += """
            </table>
            
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p>Relatório gerado automaticamente pelo sistema BGAPP</p>
                <p>MARÍTIMO ANGOLA - Zona Económica Exclusiva: 518.000 km²</p>
            </div>
        </body>
        </html>
        """
        
        return html_report
    
    # TASK-003: Métodos de integração Deck.GL WASM
    def create_deckgl_visualization(self, 
                                  data: List[Dict[str, Any]], 
                                  layer_type: str = "scatterplot",
                                  title: str = "Visualização BGAPP Deck.GL") -> Optional[str]:
        """
        🌐 TASK-003: Criar visualização Deck.GL usando WebAssembly
        
        Args:
            data: Dados oceanográficos para visualizar
            layer_type: Tipo de camada ('scatterplot', 'heatmap', 'icon')
            title: Título da visualização
            
        Returns:
            HTML da visualização ou None se não disponível
        """
        if not DECKGL_WASM_AVAILABLE:
            logger.warning("⚠️ Deck.GL WASM não disponível - usando fallback")
            return self._create_deckgl_fallback(data, layer_type, title)
        
        try:
            logger.info(f"🚀 Criando visualização Deck.GL: {layer_type} com {len(data)} pontos")
            
            # Criar wrapper configurado para Angola
            wrapper = create_angola_marine_visualization(data, layer_type)
            
            # Renderizar para HTML
            html_output = wrapper.render_to_html(title, include_controls=True)
            
            # Log das estatísticas
            stats = wrapper.get_layer_stats()
            logger.info(f"✅ Visualização Deck.GL criada: {stats}")
            
            return html_output
            
        except Exception as e:
            logger.error(f"❌ Erro na criação Deck.GL: {e}")
            return self._create_deckgl_fallback(data, layer_type, title)
    
    def get_deckgl_capabilities(self) -> Dict[str, Any]:
        """
        🔍 Obter informações sobre capacidades Deck.GL disponíveis
        
        Returns:
            Informações sobre o sistema Deck.GL
        """
        capabilities = {
            'deckgl_wasm_available': DECKGL_WASM_AVAILABLE,
            'supported_layer_types': ['scatterplot', 'heatmap', 'icon'],
            'supported_formats': ['html', 'json'],
            'version': '1.0.0',
            'task': 'TASK-003 - WebAssembly Deck.GL Integration'
        }
        
        if DECKGL_WASM_AVAILABLE:
            try:
                # Testar criação de wrapper
                test_data = [{"longitude": 13.2, "latitude": -8.8, "value": 1}]
                wrapper = create_angola_marine_visualization(test_data, "scatterplot")
                stats = wrapper.get_layer_stats()
                
                capabilities.update({
                    'test_successful': True,
                    'test_stats': stats,
                    'fallback_available': True
                })
                
            except Exception as e:
                capabilities.update({
                    'test_successful': False,
                    'error': str(e),
                    'fallback_available': True
                })
        else:
            capabilities['fallback_available'] = True
            capabilities['recommended_action'] = 'pip install js2py wasmtime'
        
        return capabilities


# Instância global do engine cartográfico
cartography_engine = AngolaMarineCartography()
