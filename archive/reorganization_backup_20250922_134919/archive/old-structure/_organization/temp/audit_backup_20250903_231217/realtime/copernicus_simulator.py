"""
Simulador de Dados Copernicus Marine em Tempo Real para Angola
Simula dados oceanográficos enquanto a integração real é configurada
"""

import json
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
import random
import time


class CopernicusAngolaSimulator:
    """Simulador de dados Copernicus Marine para Angola"""
    
    def __init__(self):
        # Área de interesse: ZEE Angola (CORRIGIDA!)
        self.bounds = {
            'lat_min': -18.2,  # Sul (Cunene com margem)
            'lat_max': -4.2,   # Norte (Cabinda)
            'lon_min': 8.5,    # CRÍTICO: Zona oceânica oeste (corrigido!)
            'lon_max': 17.5    # Limite oceânico leste ZEE
        }
        
        # Datasets simulados
        self.datasets = {
            'GLOBAL_ANALYSISFORECAST_BGC_001_028': {
                'name': 'Global Ocean Biogeochemistry Analysis and Forecast',
                'variables': ['chl', 'no3', 'po4', 'si', 'o2', 'ph'],
                'resolution': 0.083,  # ~9km
                'update_frequency': 'daily'
            },
            'GLOBAL_ANALYSISFORECAST_PHY_001_024': {
                'name': 'Global Ocean Physics Analysis and Forecast',
                'variables': ['thetao', 'so', 'uo', 'vo', 'zos', 'mlotst'],
                'resolution': 0.083,
                'update_frequency': 'daily'
            }
        }
        
        # Padrões sazonais para Angola
        self.seasonal_patterns = {
            'sst': {
                'base': 24.0,
                'amplitude': 4.0,
                'peak_month': 3  # Março (verão)
            },
            'chlorophyll': {
                'base': 2.5,
                'amplitude': 6.0,
                'peak_month': 8  # Agosto (upwelling)
            },
            'salinity': {
                'base': 35.1,
                'amplitude': 0.8,
                'peak_month': 9  # Setembro (seco)
            }
        }
        
        # Zonas oceanográficas de Angola
        self.zones = {
            'norte': {'lat_range': (-8.0, -4.4), 'characteristics': 'angola_current'},
            'centro': {'lat_range': (-12.0, -8.0), 'characteristics': 'transition'},
            'sul': {'lat_range': (-18.5, -12.0), 'characteristics': 'benguela_current'}
        }
    
    def get_realtime_data(self, 
                         dataset_id: str = 'GLOBAL_ANALYSISFORECAST_BGC_001_028',
                         variables: List[str] = None,
                         timestamp: datetime = None) -> Dict[str, Any]:
        """Simular dados em tempo real do Copernicus"""
        
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        if variables is None:
            variables = ['chl', 'thetao', 'so', 'uo', 'vo']
        
        # Gerar grid de dados para Angola
        lat_points = np.arange(self.bounds['lat_min'], self.bounds['lat_max'], 0.25)
        lon_points = np.arange(self.bounds['lon_min'], self.bounds['lon_max'], 0.25)
        
        grid_data = []
        
        for lat in lat_points:
            for lon in lon_points:
                point_data = {
                    'latitude': float(lat),
                    'longitude': float(lon),
                    'timestamp': timestamp.isoformat(),
                    'dataset_id': dataset_id
                }
                
                # Gerar valores para cada variável
                for var in variables:
                    point_data[var] = self._generate_variable_value(var, lat, lon, timestamp)
                
                grid_data.append(point_data)
        
        return {
            'dataset_id': dataset_id,
            'timestamp': timestamp.isoformat(),
            'total_points': len(grid_data),
            'variables': variables,
            'bounds': self.bounds,
            'data': grid_data[:100],  # Limitar para performance
            'metadata': {
                'source': 'Copernicus Marine Simulator',
                'resolution': '0.25 degrees',
                'coverage': 'Angola EEZ',
                'update_frequency': 'hourly_simulation'
            }
        }
    
    def _generate_variable_value(self, variable: str, lat: float, lon: float, timestamp: datetime) -> float:
        """Gerar valor realístico para uma variável oceanográfica"""
        
        # Determinar zona oceanográfica
        zone = 'centro'
        if lat > -8.0:
            zone = 'norte'
        elif lat < -12.0:
            zone = 'sul'
        
        # Dia do ano para sazonalidade
        day_of_year = timestamp.timetuple().tm_yday
        
        if variable == 'chl':  # Clorofila-a (mg/m³)
            base_value = 1.5 if zone == 'norte' else 4.0  # Mais alta no sul (upwelling)
            seasonal_factor = 1 + 0.8 * np.sin(2 * np.pi * (day_of_year - 200) / 365)  # Pico em agosto
            distance_from_coast = abs(lon - 12.0)  # Aproximação
            coastal_factor = max(0.3, 1 - distance_from_coast * 0.3)  # Maior perto da costa
            noise = np.random.normal(0, 0.3)
            
            return max(0.1, base_value * seasonal_factor * coastal_factor + noise)
        
        elif variable == 'thetao':  # Temperatura (°C)
            base_temp = 26.0 if zone == 'norte' else 20.0  # Norte mais quente
            seasonal_variation = 3.0 * np.sin(2 * np.pi * (day_of_year - 80) / 365)  # Pico em março
            upwelling_effect = -2.0 if zone == 'sul' and 150 < day_of_year < 280 else 0  # Upwelling no inverno
            noise = np.random.normal(0, 0.5)
            
            return base_temp + seasonal_variation + upwelling_effect + noise
        
        elif variable == 'so':  # Salinidade (PSU)
            base_salinity = 35.0
            zone_effect = 0.2 if zone == 'sul' else -0.1  # Sul mais salino
            seasonal_effect = 0.3 * np.sin(2 * np.pi * (day_of_year - 240) / 365)  # Pico em setembro
            noise = np.random.normal(0, 0.1)
            
            return base_salinity + zone_effect + seasonal_effect + noise
        
        elif variable in ['uo', 'vo']:  # Correntes (m/s)
            if variable == 'uo':  # Componente leste-oeste
                base_current = 0.1 if zone == 'norte' else -0.2  # Benguela para oeste
            else:  # Componente norte-sul
                base_current = -0.3 if zone == 'norte' else 0.4  # Angola sul, Benguela norte
            
            seasonal_factor = 1.2 if 150 < day_of_year < 280 else 0.8  # Mais forte no inverno
            noise = np.random.normal(0, 0.1)
            
            return base_current * seasonal_factor + noise
        
        elif variable == 'zos':  # Elevação da superfície (m)
            base_elevation = 0.0
            tidal_effect = 0.5 * np.sin(2 * np.pi * timestamp.hour / 12.42)  # Maré semi-diurna
            seasonal_effect = 0.1 * np.sin(2 * np.pi * day_of_year / 365)
            noise = np.random.normal(0, 0.05)
            
            return base_elevation + tidal_effect + seasonal_effect + noise
        
        else:
            # Variável desconhecida, retornar valor aleatório
            return np.random.uniform(0, 10)
    
    def get_realtime_summary(self) -> Dict[str, Any]:
        """Obter resumo dos dados em tempo real para Angola"""
        
        now = datetime.utcnow()
        
        # Pontos representativos de Angola
        key_locations = [
            {'name': 'Cabinda', 'lat': -5.5, 'lon': 12.2},
            {'name': 'Luanda', 'lat': -8.8, 'lon': 13.2},
            {'name': 'Benguela', 'lat': -12.6, 'lon': 13.4},
            {'name': 'Namibe', 'lat': -15.2, 'lon': 12.1},
            {'name': 'Tombwa', 'lat': -16.8, 'lon': 11.8}
        ]
        
        location_data = []
        
        for loc in key_locations:
            data = {
                'location': loc['name'],
                'latitude': loc['lat'],
                'longitude': loc['lon'],
                'sst': self._generate_variable_value('thetao', loc['lat'], loc['lon'], now),
                'chlorophyll': self._generate_variable_value('chl', loc['lat'], loc['lon'], now),
                'salinity': self._generate_variable_value('so', loc['lat'], loc['lon'], now),
                'current_u': self._generate_variable_value('uo', loc['lat'], loc['lon'], now),
                'current_v': self._generate_variable_value('vo', loc['lat'], loc['lon'], now)
            }
            
            # Calcular magnitude da corrente
            data['current_magnitude'] = np.sqrt(data['current_u']**2 + data['current_v']**2)
            
            # Determinar condições
            if data['chlorophyll'] > 5:
                data['conditions'] = 'High productivity (upwelling active)'
            elif data['sst'] < 20:
                data['conditions'] = 'Cold water (Benguela influence)'
            elif data['sst'] > 26:
                data['conditions'] = 'Warm water (Angola current)'
            else:
                data['conditions'] = 'Normal conditions'
            
            location_data.append(data)
        
        # Estatísticas gerais
        all_sst = [loc['sst'] for loc in location_data]
        all_chl = [loc['chlorophyll'] for loc in location_data]
        
        return {
            'timestamp': now.isoformat(),
            'summary': {
                'avg_sst': round(np.mean(all_sst), 1),
                'max_sst': round(np.max(all_sst), 1),
                'min_sst': round(np.min(all_sst), 1),
                'avg_chlorophyll': round(np.mean(all_chl), 2),
                'max_chlorophyll': round(np.max(all_chl), 2),
                'upwelling_active': any(loc['chlorophyll'] > 5 for loc in location_data)
            },
            'locations': location_data,
            'alerts': self._generate_alerts(location_data),
            'data_quality': {
                'availability': 95.2,
                'last_update': now.isoformat(),
                'source': 'Copernicus Marine (Simulated)',
                'latency_hours': 3.2
            }
        }
    
    def _generate_alerts(self, location_data: List[Dict]) -> List[Dict[str, str]]:
        """Gerar alertas baseados nos dados"""
        alerts = []
        
        for loc in location_data:
            if loc['chlorophyll'] > 8:
                alerts.append({
                    'type': 'info',
                    'location': loc['location'],
                    'message': f'Upwelling intenso detectado - Chl-a: {loc["chlorophyll"]:.1f} mg/m³'
                })
            
            if loc['sst'] < 18:
                alerts.append({
                    'type': 'warning',
                    'location': loc['location'],
                    'message': f'Água muito fria - SST: {loc["sst"]:.1f}°C'
                })
            
            if loc['current_magnitude'] > 0.8:
                alerts.append({
                    'type': 'info',
                    'location': loc['location'],
                    'message': f'Corrente forte - Velocidade: {loc["current_magnitude"]:.2f} m/s'
                })
        
        return alerts
    
    def save_realtime_data(self, output_file: str = 'realtime_copernicus_angola.json'):
        """Salvar dados em tempo real para arquivo"""
        data = self.get_realtime_summary()
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return output_file


def main():
    """Demonstração do simulador"""
    print("🌊 Simulador Copernicus Marine - Angola")
    print("=" * 50)
    
    simulator = CopernicusAngolaSimulator()
    
    # Obter dados em tempo real
    summary = simulator.get_realtime_summary()
    
    print(f"📅 Timestamp: {summary['timestamp']}")
    print(f"🌡️ SST Média: {summary['summary']['avg_sst']}°C")
    print(f"🌱 Clorofila Média: {summary['summary']['avg_chlorophyll']} mg/m³")
    print(f"🌊 Upwelling Ativo: {'Sim' if summary['summary']['upwelling_active'] else 'Não'}")
    
    print("\n📍 Dados por Localização:")
    for loc in summary['locations']:
        print(f"  {loc['location']}: SST={loc['sst']:.1f}°C, Chl={loc['chlorophyll']:.1f}mg/m³")
    
    if summary['alerts']:
        print("\n⚠️ Alertas:")
        for alert in summary['alerts']:
            print(f"  {alert['type'].upper()}: {alert['message']} ({alert['location']})")
    
    # Salvar dados
    output_file = simulator.save_realtime_data()
    print(f"\n💾 Dados salvos em: {output_file}")


if __name__ == "__main__":
    main()
