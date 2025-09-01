"""
Modelos Oceanográficos Regionais para Angola
Sistema de correntes de Benguela e Angola, upwelling costeiro e produtividade primária
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
import json
import math


class AngolaOceanographicModel:
    """Modelo oceanográfico para a costa angolana"""
    
    def __init__(self):
        # Definir limites da ZEE angolana
        self.bounds = {
            'lat_min': -18.2,  # Sul (Cunene com margem)
            'lat_max': -4.2,   # Norte (Cabinda)
            'lon_min': 8.5,    # CRÍTICO: Limite oceânico oeste (era 11.4!)
            'lon_max': 17.5    # Limite oceânico leste ZEE
        }
        
        # Parâmetros das correntes principais
        self.current_systems = {
            'benguela': {
                'name': 'Sistema de Corrente de Benguela',
                'direction': 'northward',  # Para norte
                'lat_range': (-18.5, -12.0),  # Principalmente sul de Angola
                'velocity_range': (0.1, 0.8),  # m/s
                'temperature_effect': -3,  # °C mais fria
                'upwelling_intensity': 'high',
                'peak_season': [6, 7, 8, 9],  # Jun-Set
                'productivity': 'very_high'
            },
            'angola': {
                'name': 'Corrente Quente de Angola',
                'direction': 'southward',  # Para sul
                'lat_range': (-4.4, -12.0),  # Norte e centro de Angola
                'velocity_range': (0.2, 0.6),  # m/s
                'temperature_effect': +2,  # °C mais quente
                'upwelling_intensity': 'low',
                'peak_season': [12, 1, 2, 3],  # Dez-Mar
                'productivity': 'medium'
            },
            'equatorial_counter': {
                'name': 'Contracorrente Equatorial',
                'direction': 'eastward',  # Para leste
                'lat_range': (-8.0, -4.4),  # Norte de Angola
                'velocity_range': (0.1, 0.4),  # m/s
                'temperature_effect': +1,
                'seasonal_variation': 'high'
            }
        }
        
        # Zonas de upwelling conhecidas
        self.upwelling_zones = [
            {'lat': -15.5, 'lon': 12.0, 'name': 'Namibe', 'intensity': 0.9},
            {'lat': -16.8, 'lon': 11.8, 'name': 'Tombwa', 'intensity': 0.8},
            {'lat': -12.8, 'lon': 12.5, 'name': 'Benguela', 'intensity': 0.7},
            {'lat': -8.8, 'lon': 13.2, 'name': 'Luanda', 'intensity': 0.4},
            {'lat': -6.0, 'lon': 12.2, 'name': 'Cabinda', 'intensity': 0.3}
        ]
        
        # Parâmetros sazonais
        self.seasonal_params = {
            'dry_season': {
                'months': [5, 6, 7, 8, 9, 10],
                'upwelling_factor': 1.5,
                'wind_intensity': 1.3,
                'productivity_boost': 2.0
            },
            'wet_season': {
                'months': [11, 12, 1, 2, 3, 4],
                'upwelling_factor': 0.7,
                'wind_intensity': 0.8,
                'river_discharge': 1.8
            }
        }
    
    def calculate_sea_surface_temperature(
        self, 
        lat: float, 
        lon: float, 
        month: int,
        depth: float = 0
    ) -> float:
        """
        Calcular temperatura superficial do mar baseada na localização e época
        
        Args:
            lat: Latitude
            lon: Longitude  
            month: Mês (1-12)
            depth: Profundidade (m)
        
        Returns:
            Temperatura em °C
        """
        # Temperatura base baseada na latitude (gradiente térmico)
        base_temp = 28 - (abs(lat + 4.4) * 0.8)  # Mais quente no norte
        
        # Efeito das correntes
        current_effect = 0
        
        # Corrente de Benguela (sul) - água fria
        if lat < -12.0:
            benguela_influence = min(1.0, (abs(lat + 12.0) / 6.5))
            current_effect -= benguela_influence * 4  # Até 4°C mais frio
            
        # Corrente de Angola (norte) - água quente  
        elif lat > -12.0:
            angola_influence = min(1.0, (abs(lat + 4.4) / 7.6))
            current_effect += angola_influence * 2  # Até 2°C mais quente
        
        # Efeito sazonal
        seasonal_effect = 0
        if month in [6, 7, 8, 9]:  # Estação seca - upwelling
            seasonal_effect -= 2 if lat < -12.0 else -1
        elif month in [12, 1, 2]:  # Estação quente
            seasonal_effect += 1.5
        
        # Efeito da distância da costa (upwelling costeiro)
        coast_distance = abs(lon - 12.0)  # Aproximação da distância da costa
        upwelling_effect = 0
        if coast_distance < 2.0:  # Próximo à costa
            upwelling_effect = -1.5 * (2.0 - coast_distance)
        
        # Efeito da profundidade
        depth_effect = 0
        if depth > 0:
            # Termoclina típica: -0.1°C por metro nos primeiros 100m
            depth_effect = -min(depth * 0.1, 10)
        
        final_temp = base_temp + current_effect + seasonal_effect + upwelling_effect + depth_effect
        
        # Limites realistas para a região
        return max(12, min(30, final_temp))
    
    def calculate_current_velocity(
        self, 
        lat: float, 
        lon: float, 
        month: int
    ) -> Dict[str, float]:
        """
        Calcular velocidade e direção das correntes
        
        Returns:
            Dict com u (leste-oeste), v (norte-sul) em m/s
        """
        u_velocity = 0  # Componente leste-oeste
        v_velocity = 0  # Componente norte-sul
        
        # Corrente de Benguela (para norte, mais forte no sul)
        if lat < -12.0:
            benguela_strength = min(1.0, (abs(lat + 12.0) / 6.5))
            v_velocity += benguela_strength * 0.6  # Para norte
            
            # Componente offshore (para oeste) devido ao upwelling
            u_velocity -= benguela_strength * 0.2
        
        # Corrente de Angola (para sul, mais forte no norte)
        elif lat > -8.0:
            angola_strength = min(1.0, (abs(lat + 4.4) / 3.6))
            v_velocity -= angola_strength * 0.4  # Para sul
            u_velocity += angola_strength * 0.1   # Ligeiramente para leste
        
        # Zona de transição (correntes fracas e variáveis)
        else:
            v_velocity += np.random.normal(0, 0.1)
            u_velocity += np.random.normal(0, 0.1)
        
        # Efeito sazonal
        if month in [6, 7, 8, 9]:  # Estação seca - ventos alísios mais fortes
            v_velocity *= 1.3
            u_velocity *= 1.2
        elif month in [12, 1, 2, 3]:  # Estação húmida - ventos mais fracos
            v_velocity *= 0.8
            u_velocity *= 0.9
        
        # Adicionar variabilidade realística
        u_velocity += np.random.normal(0, 0.05)
        v_velocity += np.random.normal(0, 0.05)
        
        return {
            'u': round(u_velocity, 3),
            'v': round(v_velocity, 3),
            'magnitude': round(np.sqrt(u_velocity**2 + v_velocity**2), 3),
            'direction': round(np.degrees(np.arctan2(v_velocity, u_velocity)), 1)
        }
    
    def calculate_chlorophyll_concentration(
        self, 
        lat: float, 
        lon: float, 
        month: int,
        sst: Optional[float] = None
    ) -> float:
        """
        Estimar concentração de clorofila-a baseada no upwelling e produtividade
        
        Returns:
            Concentração de chl-a em mg/m³
        """
        # Concentração base oceânica
        base_chl = 0.5
        
        # Efeito do upwelling (maior no sul)
        upwelling_effect = 0
        if lat < -12.0:  # Zona de Benguela
            upwelling_intensity = min(1.0, (abs(lat + 12.0) / 6.5))
            upwelling_effect = upwelling_intensity * 8  # Até 8 mg/m³ adicional
        
        # Efeito da distância da costa
        coast_distance = abs(lon - 12.0)
        coastal_effect = 0
        if coast_distance < 3.0:  # Zona costeira produtiva
            coastal_effect = 3 * (3.0 - coast_distance) / 3.0
        
        # Efeito sazonal (upwelling mais forte na estação seca)
        seasonal_effect = 0
        if month in [6, 7, 8, 9]:  # Pico do upwelling
            seasonal_effect = 4
        elif month in [10, 11]:  # Final do upwelling
            seasonal_effect = 2
        elif month in [12, 1, 2]:  # Mínimo
            seasonal_effect = -1
        
        # Efeito da temperatura (águas mais frias = mais produtivas)
        temp_effect = 0
        if sst:
            if sst < 20:  # Águas muito frias (upwelling forte)
                temp_effect = 3
            elif sst < 24:  # Águas moderadamente frias
                temp_effect = 1
            elif sst > 26:  # Águas quentes (menos produtivas)
                temp_effect = -0.5
        
        total_chl = base_chl + upwelling_effect + coastal_effect + seasonal_effect + temp_effect
        
        # Adicionar variabilidade natural
        total_chl *= np.random.uniform(0.8, 1.2)
        
        # Limites realistas para a região
        return max(0.1, min(25.0, total_chl))
    
    def get_upwelling_index(self, lat: float, lon: float, month: int) -> float:
        """
        Calcular índice de upwelling para uma localização e época
        
        Returns:
            Índice de 0 (sem upwelling) a 1 (upwelling máximo)
        """
        # Encontrar zona de upwelling mais próxima
        min_distance = float('inf')
        closest_zone = None
        
        for zone in self.upwelling_zones:
            distance = np.sqrt((lat - zone['lat'])**2 + (lon - zone['lon'])**2)
            if distance < min_distance:
                min_distance = distance
                closest_zone = zone
        
        if not closest_zone or min_distance > 2.0:  # Muito longe de zonas conhecidas
            return 0.1
        
        # Intensidade base da zona
        base_intensity = closest_zone['intensity']
        
        # Decaimento com a distância
        distance_factor = max(0, 1 - (min_distance / 2.0))
        
        # Efeito sazonal
        seasonal_factor = 1.0
        if month in [6, 7, 8, 9]:  # Pico do upwelling
            seasonal_factor = 1.5
        elif month in [4, 5, 10, 11]:  # Transição
            seasonal_factor = 1.2
        elif month in [12, 1, 2, 3]:  # Mínimo
            seasonal_factor = 0.6
        
        upwelling_index = base_intensity * distance_factor * seasonal_factor
        
        return min(1.0, upwelling_index)
    
    def generate_oceanographic_grid(
        self, 
        resolution: float = 0.25,
        months: List[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Gerar grade de dados oceanográficos para a ZEE angolana
        
        Args:
            resolution: Resolução em graus (0.25° ≈ 25km)
            months: Lista de meses para simular (default: ano completo)
        
        Returns:
            Lista de registos com dados oceanográficos
        """
        if months is None:
            months = list(range(1, 13))
        
        grid_data = []
        
        # Gerar pontos da grade
        lats = np.arange(self.bounds['lat_min'], self.bounds['lat_max'], resolution)
        lons = np.arange(self.bounds['lon_min'], self.bounds['lon_max'], resolution)
        
        for lat in lats:
            for lon in lons:
                for month in months:
                    # Calcular parâmetros oceanográficos
                    sst = self.calculate_sea_surface_temperature(lat, lon, month)
                    currents = self.calculate_current_velocity(lat, lon, month)
                    chl_a = self.calculate_chlorophyll_concentration(lat, lon, month, sst)
                    upwelling = self.get_upwelling_index(lat, lon, month)
                    
                    # Determinar zona oceanográfica
                    if lat < -15:
                        zone = 'Benguela Sul'
                    elif lat < -12:
                        zone = 'Benguela Norte'
                    elif lat < -8:
                        zone = 'Transição'
                    else:
                        zone = 'Angola Norte'
                    
                    record = {
                        'latitude': round(lat, 4),
                        'longitude': round(lon, 4),
                        'month': month,
                        'date': f"2024-{month:02d}-15",  # Meio do mês
                        'sea_surface_temperature': round(sst, 2),
                        'chlorophyll_a': round(chl_a, 3),
                        'current_u': currents['u'],
                        'current_v': currents['v'],
                        'current_magnitude': currents['magnitude'],
                        'current_direction': currents['direction'],
                        'upwelling_index': round(upwelling, 3),
                        'oceanographic_zone': zone,
                        'depth': 0,  # Superfície
                        'data_source': 'angola_oceanographic_model',
                        'model_version': '1.0',
                        'generation_date': datetime.now().isoformat()
                    }
                    
                    grid_data.append(record)
        
        return grid_data
    
    def get_seasonal_summary(self) -> Dict[str, Any]:
        """
        Obter resumo das características sazonais
        """
        return {
            'dry_season': {
                'months': ['Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro'],
                'characteristics': [
                    'Upwelling intenso na costa sul',
                    'Corrente de Benguela mais forte',
                    'Águas mais frias (12-20°C)',
                    'Alta produtividade primária',
                    'Ventos alísios de SE intensos'
                ],
                'best_for': [
                    'Pesca pelágica',
                    'Observação de aves marinhas',
                    'Estudos de produtividade'
                ]
            },
            'wet_season': {
                'months': ['Novembro', 'Dezembro', 'Janeiro', 'Fevereiro', 'Março', 'Abril'],
                'characteristics': [
                    'Corrente de Angola dominante',
                    'Águas mais quentes (24-28°C)',
                    'Menor produtividade',
                    'Maior descarga fluvial',
                    'Ventos mais fracos'
                ],
                'best_for': [
                    'Migração de tartarugas',
                    'Reprodução de mamíferos marinhos',
                    'Estudos de conectividade'
                ]
            }
        }


def main():
    """Função principal para demonstração"""
    model = AngolaOceanographicModel()
    
    print("🌊 Modelo Oceanográfico de Angola")
    print("=" * 50)
    
    # Exemplo: ponto na costa de Luanda
    lat, lon = -8.8, 13.2
    month = 8  # Agosto (pico do upwelling)
    
    print(f"📍 Localização: {lat}°S, {lon}°E")
    print(f"📅 Mês: {month} (Agosto)")
    print()
    
    # Calcular parâmetros
    sst = model.calculate_sea_surface_temperature(lat, lon, month)
    currents = model.calculate_current_velocity(lat, lon, month)
    chl_a = model.calculate_chlorophyll_concentration(lat, lon, month, sst)
    upwelling = model.get_upwelling_index(lat, lon, month)
    
    print("🌡️  Parâmetros Oceanográficos:")
    print(f"   Temperatura: {sst:.1f}°C")
    print(f"   Clorofila-a: {chl_a:.2f} mg/m³")
    print(f"   Corrente: {currents['magnitude']:.2f} m/s ({currents['direction']:.0f}°)")
    print(f"   Upwelling: {upwelling:.2f} (0-1)")
    print()
    
    # Resumo sazonal
    seasonal = model.get_seasonal_summary()
    print("📊 Resumo Sazonal:")
    for season, info in seasonal.items():
        print(f"\n{season.replace('_', ' ').title()}:")
        for char in info['characteristics'][:3]:
            print(f"   • {char}")


if __name__ == "__main__":
    main()
