#!/usr/bin/env python3
"""
Integração qgis2web para exportar mapas interativos
Gera mapas web usando Folium e templates HTML customizados
"""

import os
import json
import folium
from folium import plugins
import geopandas as gpd
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import branca.colormap as cm
from jinja2 import Template, Environment, FileSystemLoader
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QGIS2WebExporter:
    """Classe principal para exportar mapas interativos estilo qgis2web"""
    
    def __init__(self, output_dir: str = "static/interactive_maps"):
        """Inicializa o exportador"""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Diretório de templates
        self.templates_dir = Path("templates/qgis2web")
        self.templates_dir.mkdir(parents=True, exist_ok=True)
        
        # Configurações padrão Angola
        self.angola_center = [-11.5, 17.5]
        self.angola_bounds = [[-18.0, 11.0], [-5.0, 24.0]]
        
        # Configurações de estilo
        self.default_styles = {
            'fishing_ports': {
                'color': '#2E8B57',
                'fillColor': '#40E0D0',
                'radius': 8,
                'weight': 2,
                'fillOpacity': 0.7
            },
            'fishing_villages': {
                'color': '#228B22',
                'fillColor': '#90EE90',
                'radius': 6,
                'weight': 2,
                'fillOpacity': 0.6
            },
            'marine_areas': {
                'color': '#0066CC',
                'fillColor': '#87CEEB',
                'weight': 2,
                'fillOpacity': 0.3
            },
            'migration_routes': {
                'color': '#FF4500',
                'weight': 3,
                'opacity': 0.8
            }
        }
    
    def create_base_map(self, title: str = "Mapa Interativo BGAPP") -> folium.Map:
        """Cria mapa base com configurações Angola"""
        
        # Criar mapa centrado em Angola
        m = folium.Map(
            location=self.angola_center,
            zoom_start=6,
            tiles=None,
            prefer_canvas=True
        )
        
        # Adicionar múltiplas camadas base
        folium.TileLayer(
            'OpenStreetMap',
            name='OpenStreetMap',
            control=True
        ).add_to(m)
        
        folium.TileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attr='Esri',
            name='Satélite',
            control=True
        ).add_to(m)
        
        folium.TileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}',
            attr='Esri',
            name='Oceano',
            control=True
        ).add_to(m)
        
        # Adicionar título
        title_html = f'''
        <div style="position: fixed; 
                    top: 10px; left: 50px; width: 300px; height: 50px; 
                    background-color: white; border:2px solid grey; z-index:9999; 
                    font-size:16px; font-weight:bold; padding:10px">
            <p>{title}</p>
        </div>
        '''
        m.get_root().html.add_child(folium.Element(title_html))
        
        return m
    
    def add_fishing_infrastructure(self, map_obj: folium.Map, 
                                 data_path: str = "configs/fishing_all_infrastructure_angola.geojson") -> folium.Map:
        """Adiciona infraestruturas pesqueiras ao mapa"""
        
        try:
            if os.path.exists(data_path):
                gdf = gpd.read_file(data_path)
            else:
                # Criar dados de exemplo se não existir
                gdf = self._create_sample_fishing_data()
            
            # Separar por tipo
            ports = gdf[gdf['type'].str.contains('porto|port', case=False, na=False)]
            villages = gdf[gdf['type'].str.contains('vila|village', case=False, na=False)]
            other = gdf[~gdf['type'].str.contains('porto|port|vila|village', case=False, na=False)]
            
            # Adicionar portos
            if not ports.empty:
                ports_group = folium.FeatureGroup(name="🏭 Portos Pesqueiros", show=True)
                
                for idx, row in ports.iterrows():
                    popup_html = self._create_popup_html(row, "porto")
                    
                    folium.CircleMarker(
                        location=[row.geometry.y, row.geometry.x],
                        radius=self.default_styles['fishing_ports']['radius'],
                        popup=folium.Popup(popup_html, max_width=300),
                        tooltip=f"Porto: {row.get('name', 'Sem nome')}",
                        color=self.default_styles['fishing_ports']['color'],
                        fillColor=self.default_styles['fishing_ports']['fillColor'],
                        weight=self.default_styles['fishing_ports']['weight'],
                        fillOpacity=self.default_styles['fishing_ports']['fillOpacity']
                    ).add_to(ports_group)
                
                ports_group.add_to(map_obj)
            
            # Adicionar vilas
            if not villages.empty:
                villages_group = folium.FeatureGroup(name="🏘️ Vilas Pescatórias", show=True)
                
                for idx, row in villages.iterrows():
                    popup_html = self._create_popup_html(row, "vila")
                    
                    folium.CircleMarker(
                        location=[row.geometry.y, row.geometry.x],
                        radius=self.default_styles['fishing_villages']['radius'],
                        popup=folium.Popup(popup_html, max_width=300),
                        tooltip=f"Vila: {row.get('name', 'Sem nome')}",
                        color=self.default_styles['fishing_villages']['color'],
                        fillColor=self.default_styles['fishing_villages']['fillColor'],
                        weight=self.default_styles['fishing_villages']['weight'],
                        fillOpacity=self.default_styles['fishing_villages']['fillOpacity']
                    ).add_to(villages_group)
                
                villages_group.add_to(map_obj)
            
            # Adicionar outras infraestruturas
            if not other.empty:
                other_group = folium.FeatureGroup(name="🏗️ Outras Infraestruturas", show=False)
                
                for idx, row in other.iterrows():
                    popup_html = self._create_popup_html(row, "infraestrutura")
                    
                    folium.Marker(
                        location=[row.geometry.y, row.geometry.x],
                        popup=folium.Popup(popup_html, max_width=300),
                        tooltip=f"{row.get('type', 'Infraestrutura')}: {row.get('name', 'Sem nome')}",
                        icon=folium.Icon(color='red', icon='wrench')
                    ).add_to(other_group)
                
                other_group.add_to(map_obj)
            
            logger.info(f"✅ Adicionadas {len(gdf)} infraestruturas pesqueiras")
            
        except Exception as e:
            logger.error(f"Erro ao adicionar infraestruturas pesqueiras: {e}")
        
        return map_obj
    
    def add_marine_boundaries(self, map_obj: folium.Map,
                            zee_path: str = "configs/zee_angola_official.geojson") -> folium.Map:
        """Adiciona fronteiras marítimas"""
        
        try:
            if os.path.exists(zee_path):
                gdf = gpd.read_file(zee_path)
                
                zee_group = folium.FeatureGroup(name="🌊 Zona Econômica Exclusiva", show=True)
                
                folium.GeoJson(
                    gdf.__geo_interface__,
                    style_function=lambda feature: {
                        'fillColor': self.default_styles['marine_areas']['fillColor'],
                        'color': self.default_styles['marine_areas']['color'],
                        'weight': self.default_styles['marine_areas']['weight'],
                        'fillOpacity': self.default_styles['marine_areas']['fillOpacity']
                    },
                    popup=folium.Popup("Zona Econômica Exclusiva de Angola", max_width=200),
                    tooltip="ZEE Angola"
                ).add_to(zee_group)
                
                zee_group.add_to(map_obj)
                logger.info("✅ Adicionada ZEE de Angola")
            
        except Exception as e:
            logger.error(f"Erro ao adicionar fronteiras marítimas: {e}")
        
        return map_obj
    
    def add_migration_routes(self, map_obj: folium.Map, 
                           tracks_data: pd.DataFrame = None) -> folium.Map:
        """Adiciona rotas de migração animal"""
        
        if tracks_data is None:
            tracks_data = self._create_sample_migration_data()
        
        try:
            migration_group = folium.FeatureGroup(name="🐟 Rotas de Migração", show=False)
            
            # Agrupar por indivíduo
            for individual_id in tracks_data['individual_id'].unique():
                individual_tracks = tracks_data[tracks_data['individual_id'] == individual_id].sort_values('timestamp')
                
                if len(individual_tracks) < 2:
                    continue
                
                # Criar linha de trajetória
                coordinates = [[row['latitude'], row['longitude']] for _, row in individual_tracks.iterrows()]
                
                # Cor baseada na espécie
                species = individual_tracks.iloc[0]['species']
                if 'tuna' in species.lower() or 'atum' in species.lower():
                    color = '#FF4500'  # Laranja
                elif 'whale' in species.lower() or 'baleia' in species.lower():
                    color = '#4169E1'  # Azul royal
                elif 'turtle' in species.lower() or 'tartaruga' in species.lower():
                    color = '#228B22'  # Verde floresta
                else:
                    color = '#800080'  # Roxo
                
                folium.PolyLine(
                    coordinates,
                    color=color,
                    weight=3,
                    opacity=0.8,
                    popup=f"Trajetória: {individual_id}<br>Espécie: {species}",
                    tooltip=f"{individual_id} ({species})"
                ).add_to(migration_group)
                
                # Adicionar marcadores de início e fim
                folium.CircleMarker(
                    coordinates[0],
                    radius=5,
                    color='green',
                    fillColor='lightgreen',
                    popup=f"Início: {individual_id}",
                    tooltip="Início da trajetória"
                ).add_to(migration_group)
                
                folium.CircleMarker(
                    coordinates[-1],
                    radius=5,
                    color='red',
                    fillColor='lightcoral',
                    popup=f"Fim: {individual_id}",
                    tooltip="Fim da trajetória"
                ).add_to(migration_group)
            
            migration_group.add_to(map_obj)
            logger.info(f"✅ Adicionadas {len(tracks_data['individual_id'].unique())} rotas de migração")
            
        except Exception as e:
            logger.error(f"Erro ao adicionar rotas de migração: {e}")
        
        return map_obj
    
    def add_environmental_layers(self, map_obj: folium.Map) -> folium.Map:
        """Adiciona camadas ambientais (clorofila, temperatura)"""
        
        try:
            # Camada de clorofila (simulada)
            chl_group = folium.FeatureGroup(name="🌿 Clorofila-a", show=False)
            
            # Gerar dados de exemplo para demonstração
            lat_range = np.linspace(-18, -5, 20)
            lon_range = np.linspace(11, 24, 20)
            
            for lat in lat_range[::3]:  # Reduzir densidade
                for lon in lon_range[::3]:
                    # Simular concentração de clorofila
                    chl_value = np.random.lognormal(mean=np.log(0.5), sigma=0.8)
                    
                    # Cor baseada na concentração
                    if chl_value < 0.3:
                        color = 'blue'
                        fillColor = 'lightblue'
                    elif chl_value < 1.0:
                        color = 'green'
                        fillColor = 'lightgreen'
                    else:
                        color = 'red'
                        fillColor = 'orange'
                    
                    folium.CircleMarker(
                        location=[lat, lon],
                        radius=4,
                        color=color,
                        fillColor=fillColor,
                        weight=1,
                        fillOpacity=0.6,
                        popup=f"Clorofila-a: {chl_value:.2f} mg/m³",
                        tooltip=f"Chl-a: {chl_value:.2f}"
                    ).add_to(chl_group)
            
            chl_group.add_to(map_obj)
            
            # Adicionar legenda de clorofila
            colormap = cm.LinearColormap(
                colors=['blue', 'green', 'orange', 'red'],
                vmin=0.1, vmax=2.0,
                caption='Clorofila-a (mg/m³)'
            )
            colormap.add_to(map_obj)
            
            logger.info("✅ Adicionadas camadas ambientais")
            
        except Exception as e:
            logger.error(f"Erro ao adicionar camadas ambientais: {e}")
        
        return map_obj
    
    def add_time_slider(self, map_obj: folium.Map, 
                       time_data: Dict[str, Any] = None) -> folium.Map:
        """Adiciona slider temporal para animações"""
        
        try:
            # Para demonstração, criar dados temporais simulados
            if time_data is None:
                time_data = self._create_sample_time_data()
            
            # Usar plugin TimestampedGeoJson para animação temporal
            features = []
            
            for timestamp, data_points in time_data.items():
                for point in data_points:
                    feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [point['longitude'], point['latitude']]
                        },
                        "properties": {
                            "time": timestamp,
                            "popup": f"Data: {timestamp}<br>Valor: {point['value']:.2f}",
                            "style": {
                                "color": point.get('color', 'blue'),
                                "fillOpacity": 0.7
                            }
                        }
                    }
                    features.append(feature)
            
            # Adicionar plugin de animação temporal
            plugins.TimestampedGeoJson(
                {
                    "type": "FeatureCollection",
                    "features": features
                },
                period="P1D",  # Um dia
                add_last_point=True,
                auto_play=False,
                loop=False,
                max_speed=5,
                loop_button=True,
                date_options="YYYY-MM-DD",
                time_slider_drag_update=True
            ).add_to(map_obj)
            
            logger.info("✅ Adicionado slider temporal")
            
        except Exception as e:
            logger.error(f"Erro ao adicionar slider temporal: {e}")
        
        return map_obj
    
    def add_measurement_tools(self, map_obj: folium.Map) -> folium.Map:
        """Adiciona ferramentas de medição"""
        
        try:
            # Plugin de medição de distância
            plugins.MeasureControl(
                primary_length_unit='kilometers',
                secondary_length_unit='miles',
                primary_area_unit='sqkilometers',
                secondary_area_unit='acres'
            ).add_to(map_obj)
            
            # Plugin de desenho
            draw = plugins.Draw(
                export=True,
                filename='bgapp_drawing.geojson',
                position='topleft'
            )
            draw.add_to(map_obj)
            
            # Plugin de localização
            plugins.LocateControl().add_to(map_obj)
            
            logger.info("✅ Adicionadas ferramentas de medição")
            
        except Exception as e:
            logger.error(f"Erro ao adicionar ferramentas: {e}")
        
        return map_obj
    
    def export_interactive_map(self, map_type: str = "comprehensive", 
                             filename: str = None) -> str:
        """Exporta mapa interativo completo"""
        
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"bgapp_interactive_map_{map_type}_{timestamp}.html"
        
        output_path = self.output_dir / filename
        
        try:
            # Criar mapa base
            m = self.create_base_map(f"BGAPP - Mapa Interativo ({map_type.title()})")
            
            if map_type in ["comprehensive", "fishing", "all"]:
                # Adicionar infraestruturas pesqueiras
                m = self.add_fishing_infrastructure(m)
                
                # Adicionar fronteiras marítimas
                m = self.add_marine_boundaries(m)
            
            if map_type in ["comprehensive", "migration", "all"]:
                # Adicionar rotas de migração
                m = self.add_migration_routes(m)
            
            if map_type in ["comprehensive", "environmental", "all"]:
                # Adicionar camadas ambientais
                m = self.add_environmental_layers(m)
            
            if map_type in ["comprehensive", "temporal", "all"]:
                # Adicionar slider temporal
                m = self.add_time_slider(m)
            
            # Sempre adicionar ferramentas
            m = self.add_measurement_tools(m)
            
            # Adicionar controle de camadas
            folium.LayerControl(collapsed=False).add_to(m)
            
            # Adicionar plugin de tela cheia
            plugins.Fullscreen(
                position='topright',
                title='Expandir para tela cheia',
                title_cancel='Sair da tela cheia',
                force_separate_button=True
            ).add_to(m)
            
            # Salvar mapa
            m.save(str(output_path))
            
            logger.info(f"✅ Mapa exportado: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Erro ao exportar mapa: {e}")
            raise
    
    def _create_popup_html(self, row: pd.Series, feature_type: str) -> str:
        """Cria HTML para popup de feature"""
        
        name = row.get('name', 'Sem nome')
        feature_type_pt = {
            'porto': 'Porto Pesqueiro',
            'vila': 'Vila Pescatória', 
            'infraestrutura': 'Infraestrutura'
        }.get(feature_type, 'Feature')
        
        html = f"""
        <div style="font-family: Arial, sans-serif; width: 250px;">
            <h4 style="margin: 0; color: #2E8B57;">{feature_type_pt}</h4>
            <hr style="margin: 5px 0;">
            <p><strong>Nome:</strong> {name}</p>
        """
        
        # Adicionar informações específicas
        if 'population' in row.index and pd.notna(row['population']):
            html += f"<p><strong>População:</strong> {row['population']:,} hab.</p>"
        
        if 'capacity' in row.index and pd.notna(row['capacity']):
            html += f"<p><strong>Capacidade:</strong> {row['capacity']} embarcações</p>"
        
        if 'zone' in row.index and pd.notna(row['zone']):
            html += f"<p><strong>Zona:</strong> {row['zone']}</p>"
        
        if 'type' in row.index and pd.notna(row['type']):
            html += f"<p><strong>Tipo:</strong> {row['type']}</p>"
        
        # Coordenadas
        html += f"""
            <p><strong>Coordenadas:</strong><br>
            Lat: {row.geometry.y:.4f}<br>
            Lon: {row.geometry.x:.4f}</p>
        </div>
        """
        
        return html
    
    def _create_sample_fishing_data(self) -> gpd.GeoDataFrame:
        """Cria dados de exemplo para infraestruturas pesqueiras"""
        
        data = [
            {"name": "Porto de Luanda", "type": "porto_principal", "population": 12000, "capacity": 200, "zone": "Norte", "lat": -8.8383, "lon": 13.2317},
            {"name": "Porto de Benguela", "type": "porto_regional", "population": 7800, "capacity": 160, "zone": "Sul", "lat": -12.5756, "lon": 13.4049},
            {"name": "Vila de Mussulo", "type": "vila_pesqueira", "population": 3200, "capacity": 45, "zone": "Norte", "lat": -9.1167, "lon": 13.1833},
            {"name": "Vila de Baía Azul", "type": "vila_pesqueira", "population": 2800, "capacity": 38, "zone": "Sul", "lat": -13.2167, "lon": 12.9833}
        ]
        
        gdf = gpd.GeoDataFrame(data, geometry=gpd.points_from_xy([d['lon'] for d in data], [d['lat'] for d in data]))
        return gdf
    
    def _create_sample_migration_data(self) -> pd.DataFrame:
        """Cria dados de exemplo para migração"""
        
        dates = pd.date_range('2024-01-01', '2024-03-31', freq='D')
        data = []
        
        # Simular 3 indivíduos
        for individual_id in range(1, 4):
            lat = -10 + np.random.uniform(-3, 3)
            lon = 15 + np.random.uniform(-2, 2)
            
            for date in dates:
                lat += np.random.uniform(-0.1, 0.1)
                lon += np.random.uniform(-0.1, 0.1)
                
                # Manter dentro dos limites de Angola
                lat = np.clip(lat, -18, -5)
                lon = np.clip(lon, 11, 24)
                
                data.append({
                    'individual_id': f'tuna_{individual_id:03d}',
                    'species': 'Thunnus albacares',
                    'timestamp': date,
                    'latitude': lat,
                    'longitude': lon
                })
        
        return pd.DataFrame(data)
    
    def _create_sample_time_data(self) -> Dict[str, List[Dict]]:
        """Cria dados temporais de exemplo"""
        
        dates = pd.date_range('2024-01-01', '2024-01-10', freq='D')
        time_data = {}
        
        for date in dates:
            date_str = date.strftime('%Y-%m-%d')
            points = []
            
            # Gerar pontos aleatórios para cada dia
            for i in range(5):
                lat = np.random.uniform(-15, -8)
                lon = np.random.uniform(12, 20)
                value = np.random.uniform(0.1, 2.0)
                
                points.append({
                    'latitude': lat,
                    'longitude': lon,
                    'value': value,
                    'color': 'blue' if value < 1.0 else 'red'
                })
            
            time_data[date_str] = points
        
        return time_data

# Função de interface para API
def create_interactive_map(map_config: Dict[str, Any]) -> str:
    """Interface para criar mapas interativos via API"""
    
    exporter = QGIS2WebExporter()
    
    map_type = map_config.get('type', 'comprehensive')
    filename = map_config.get('filename')
    
    return exporter.export_interactive_map(map_type, filename)

# Exemplo de uso
if __name__ == "__main__":
    # Criar exportador
    exporter = QGIS2WebExporter()
    
    # Exportar diferentes tipos de mapas
    print("🗺️ Exportando mapas interativos...")
    
    # Mapa abrangente
    comprehensive_map = exporter.export_interactive_map("comprehensive")
    print(f"✅ Mapa abrangente: {comprehensive_map}")
    
    # Mapa focado em pesca
    fishing_map = exporter.export_interactive_map("fishing", "bgapp_fishing_infrastructure.html")
    print(f"✅ Mapa de pesca: {fishing_map}")
    
    # Mapa de migração
    migration_map = exporter.export_interactive_map("migration", "bgapp_animal_migration.html")
    print(f"✅ Mapa de migração: {migration_map}")
    
    print("🎉 Exportação concluída!")
