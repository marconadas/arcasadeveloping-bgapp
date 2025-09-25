"""
API para dados meteorológicos e oceanográficos
Fornece endpoints para animações de vento, correntes, SST, salinidade e clorofila
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
import numpy as np
import xarray as xr
from datetime import datetime, timedelta
import json
import os
from pathlib import Path

# Importar simuladores existentes
try:
    from ..bgapp.realtime.copernicus_simulator import CopernicusSimulator
    from ..bgapp.ingest.erddap_sst import main as erddap_main
    from ..bgapp.ingest.cds_era5 import main as era5_main
except ImportError:
    # Fallback se importações falharem
    CopernicusSimulator = None


class MetoceanAPI:
    """API para dados meteorológicos e oceanográficos"""
    
    def __init__(self):
        self.app = FastAPI(title="BGAPP Metocean API", version="1.0.0")
        self.simulator = CopernicusSimulator() if CopernicusSimulator else None
        self.setup_routes()
        
        # Área de Angola para filtros
        self.angola_bounds = {
            'north': -4.2,    # Cabinda norte (corrigido)
            'south': -18.2,   # Cunene com margem (corrigido)
            'east': 17.5,     # Limite oceânico ZEE real (corrigido)
            'west': 8.5       # CRÍTICO: Zona oceânica oeste (corrigido!)
        }
    
    def setup_routes(self):
        """Configurar rotas da API"""
        
        @self.app.get("/metocean/velocity")
        async def get_velocity_data(
            var: str = Query("currents", description="Tipo de velocidade: 'currents' ou 'wind'"),
            time: Optional[str] = Query(None, description="Timestamp ISO 8601"),
            resolution: float = Query(0.5, description="Resolução em graus"),
            format: str = Query("leaflet-velocity", description="Formato de saída")
        ):
            """Obter dados de velocidade para animações"""
            
            try:
                # Parse do tempo
                if time:
                    target_time = datetime.fromisoformat(time.replace('Z', '+00:00'))
                else:
                    target_time = datetime.utcnow()
                
                # Obter dados baseado no tipo
                if var == "currents":
                    data = await self.get_currents_data(target_time, resolution)
                elif var == "wind":
                    data = await self.get_wind_data(target_time, resolution)
                else:
                    raise HTTPException(status_code=400, detail=f"Variável não suportada: {var}")
                
                # Formatar para leaflet-velocity
                if format == "leaflet-velocity":
                    formatted_data = self.format_for_leaflet_velocity(data)
                else:
                    formatted_data = data
                
                return JSONResponse(formatted_data)
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao obter dados: {str(e)}")
        
        @self.app.get("/metocean/scalar")
        async def get_scalar_data(
            var: str = Query("sst", description="Variável escalar: 'sst', 'salinity', 'chlorophyll'"),
            time: Optional[str] = Query(None, description="Timestamp ISO 8601"),
            format: str = Query("geojson", description="Formato de saída")
        ):
            """Obter dados escalares para camadas WMS ou raster"""
            
            try:
                if time:
                    target_time = datetime.fromisoformat(time.replace('Z', '+00:00'))
                else:
                    target_time = datetime.utcnow()
                
                if var == "sst":
                    data = await self.get_sst_data(target_time)
                elif var == "salinity":
                    data = await self.get_salinity_data(target_time)
                elif var == "chlorophyll":
                    data = await self.get_chlorophyll_data(target_time)
                else:
                    raise HTTPException(status_code=400, detail=f"Variável não suportada: {var}")
                
                return JSONResponse(data)
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao obter dados: {str(e)}")
        
        @self.app.get("/metocean/status")
        async def get_status():
            """Status dos serviços meteorológicos"""
            return JSONResponse({
                "timestamp": datetime.utcnow().isoformat(),
                "services": {
                    "copernicus_simulator": self.simulator is not None,
                    "erddap_available": True,  # Verificar se necessário
                    "cds_available": True     # Verificar se necessário
                },
                "data_sources": {
                    "currents": "Copernicus Marine (simulado)",
                    "wind": "ERA5 (simulado)", 
                    "sst": "ERDDAP NOAA (simulado)",
                    "salinity": "Copernicus Marine (simulado)",
                    "chlorophyll": "Copernicus Marine BGC (simulado)"
                }
            })
    
    async def get_currents_data(self, time: datetime, resolution: float) -> Dict[str, Any]:
        """Obter dados de correntes marinhas"""
        
        if self.simulator:
            # Usar simulador Copernicus existente
            summary = self.simulator.get_realtime_summary()
            
            # Converter para grid regular
            grid_data = []
            for lat in np.arange(self.angola_bounds['south'], self.angola_bounds['north'], resolution):
                for lon in np.arange(self.angola_bounds['west'], self.angola_bounds['east'], resolution):
                    # Simular correntes baseadas na localização
                    u, v = self.simulate_benguela_current(lat, lon, time)
                    grid_data.append({
                        'lat': float(lat),
                        'lon': float(lon), 
                        'u': float(u),
                        'v': float(v)
                    })
            
            return {
                'variable': 'currents',
                'time': time.isoformat(),
                'units': 'm/s',
                'data': grid_data
            }
        else:
            # Fallback com dados completamente simulados
            return self.generate_simulated_currents(time, resolution)
    
    async def get_wind_data(self, time: datetime, resolution: float) -> Dict[str, Any]:
        """Obter dados de vento"""
        
        # Simular padrões de vento para Angola
        grid_data = []
        for lat in np.arange(self.angola_bounds['south'], self.angola_bounds['north'], resolution):
            for lon in np.arange(self.angola_bounds['west'], self.angola_bounds['east'], resolution):
                u, v = self.simulate_wind_patterns(lat, lon, time)
                grid_data.append({
                    'lat': float(lat),
                    'lon': float(lon),
                    'u': float(u),
                    'v': float(v)
                })
        
        return {
            'variable': 'wind',
            'time': time.isoformat(),
            'units': 'm/s',
            'data': grid_data
        }
    
    async def get_sst_data(self, time: datetime) -> Dict[str, Any]:
        """Obter dados de temperatura superficial"""
        
        if self.simulator:
            summary = self.simulator.get_realtime_summary()
            locations = summary.get('locations', [])
            
            features = []
            for loc in locations:
                features.append({
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [loc['longitude'], loc['latitude']]
                    },
                    'properties': {
                        'sst': loc.get('sst', 25.0),
                        'location': loc.get('location', 'Unknown'),
                        'time': time.isoformat()
                    }
                })
            
            return {
                'type': 'FeatureCollection',
                'features': features,
                'metadata': {
                    'variable': 'sst',
                    'units': 'degrees_celsius',
                    'time': time.isoformat()
                }
            }
        else:
            return self.generate_simulated_sst(time)
    
    async def get_salinity_data(self, time: datetime) -> Dict[str, Any]:
        """Obter dados de salinidade"""
        
        if self.simulator:
            summary = self.simulator.get_realtime_summary()
            locations = summary.get('locations', [])
            
            features = []
            for loc in locations:
                features.append({
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [loc['longitude'], loc['latitude']]
                    },
                    'properties': {
                        'salinity': loc.get('salinity', 35.0),
                        'location': loc.get('location', 'Unknown'),
                        'time': time.isoformat()
                    }
                })
            
            return {
                'type': 'FeatureCollection', 
                'features': features,
                'metadata': {
                    'variable': 'salinity',
                    'units': 'psu',
                    'time': time.isoformat()
                }
            }
        else:
            return self.generate_simulated_salinity(time)
    
    async def get_chlorophyll_data(self, time: datetime) -> Dict[str, Any]:
        """Obter dados de clorofila"""
        
        if self.simulator:
            summary = self.simulator.get_realtime_summary()
            locations = summary.get('locations', [])
            
            features = []
            for loc in locations:
                features.append({
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [loc['longitude'], loc['latitude']]
                    },
                    'properties': {
                        'chlorophyll': loc.get('chlorophyll', 2.0),
                        'location': loc.get('location', 'Unknown'),
                        'time': time.isoformat()
                    }
                })
            
            return {
                'type': 'FeatureCollection',
                'features': features, 
                'metadata': {
                    'variable': 'chlorophyll',
                    'units': 'mg/m3',
                    'time': time.isoformat()
                }
            }
        else:
            return self.generate_simulated_chlorophyll(time)
    
    def simulate_benguela_current(self, lat: float, lon: float, time: datetime) -> tuple:
        """Simular corrente de Benguela"""
        
        # Distância da costa (aproximada)
        coast_distance = abs(lon - 13.0)  # 13°E aproximadamente a costa
        
        # Força da corrente baseada na latitude (mais forte ao sul)
        latitude_factor = max(0, (-lat - 4) / 14)  # Normalizar entre -4° e -18°
        
        # Corrente de Benguela: norte-sul na costa, enfraquece no oceano
        benguela_strength = max(0, 1.5 - coast_distance * 0.3) * latitude_factor
        
        # Componente norte-sul (v) dominante
        v = benguela_strength * 0.8 + np.random.normal(0, 0.1)
        
        # Componente leste-oeste (u) menor
        u = benguela_strength * 0.2 + np.random.normal(0, 0.05)
        
        # Variação sazonal (upwelling mais forte junho-setembro)
        month = time.month
        if 6 <= month <= 9:
            v *= 1.3  # Intensificar durante upwelling
        
        return u, v
    
    def simulate_wind_patterns(self, lat: float, lon: float, time: datetime) -> tuple:
        """Simular padrões de vento para Angola"""
        
        # Ventos alísios predominantes (leste-oeste)
        base_u = -5.0 + np.random.normal(0, 2.0)
        base_v = 2.0 + np.random.normal(0, 1.0)
        
        # Variação sazonal
        month = time.month
        if 12 <= month <= 2:  # Verão - ventos mais fracos
            base_u *= 0.7
            base_v *= 0.8
        elif 6 <= month <= 8:  # Inverno - ventos mais fortes
            base_u *= 1.2
            base_v *= 1.1
        
        # Efeito da topografia costeira
        coast_distance = abs(lon - 13.0)
        if coast_distance < 1.0:  # Próximo à costa
            base_u *= 1.3  # Intensificar componente perpendicular
        
        return base_u, base_v
    
    def format_for_leaflet_velocity(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Formatar dados para leaflet-velocity"""
        
        grid_data = data.get('data', [])
        if not grid_data:
            return {'data': [], 'uMin': 0, 'uMax': 0, 'vMin': 0, 'vMax': 0}
        
        u_values = [point['u'] for point in grid_data]
        v_values = [point['v'] for point in grid_data]
        
        return {
            'data': grid_data,
            'uMin': float(np.min(u_values)),
            'uMax': float(np.max(u_values)),
            'vMin': float(np.min(v_values)),
            'vMax': float(np.max(v_values)),
            'metadata': {
                'variable': data.get('variable', 'unknown'),
                'time': data.get('time'),
                'units': data.get('units', 'm/s')
            }
        }
    
    def generate_simulated_currents(self, time: datetime, resolution: float) -> Dict[str, Any]:
        """Gerar dados simulados de correntes"""
        
        grid_data = []
        for lat in np.arange(self.angola_bounds['south'], self.angola_bounds['north'], resolution):
            for lon in np.arange(self.angola_bounds['west'], self.angola_bounds['east'], resolution):
                u, v = self.simulate_benguela_current(lat, lon, time)
                grid_data.append({
                    'lat': float(lat),
                    'lon': float(lon),
                    'u': float(u),
                    'v': float(v)
                })
        
        return {
            'variable': 'currents',
            'time': time.isoformat(),
            'units': 'm/s',
            'data': grid_data
        }
    
    def generate_simulated_sst(self, time: datetime) -> Dict[str, Any]:
        """Gerar dados simulados de SST"""
        
        features = []
        
        # Pontos de amostragem ao longo da costa angolana
        sample_points = [
            (-5.5, 12.2, "Cabinda"),
            (-8.8, 13.2, "Luanda"),
            (-12.6, 13.4, "Benguela"),
            (-15.2, 12.1, "Namibe"),
            (-16.8, 11.8, "Tombwa")
        ]
        
        for lat, lon, name in sample_points:
            # Simular SST baseada na latitude e época do ano
            base_temp = 28 - abs(lat + 4) * 0.8  # Mais frio ao sul
            
            # Variação sazonal
            month = time.month
            seasonal_var = 3 * np.sin(2 * np.pi * (month - 3) / 12)
            
            sst = base_temp + seasonal_var + np.random.normal(0, 0.5)
            
            features.append({
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lon, lat]
                },
                'properties': {
                    'sst': round(float(sst), 1),
                    'location': name,
                    'time': time.isoformat()
                }
            })
        
        return {
            'type': 'FeatureCollection',
            'features': features,
            'metadata': {
                'variable': 'sst',
                'units': 'degrees_celsius',
                'time': time.isoformat()
            }
        }
    
    def generate_simulated_salinity(self, time: datetime) -> Dict[str, Any]:
        """Gerar dados simulados de salinidade"""
        
        features = []
        sample_points = [
            (-5.5, 12.2, "Cabinda"),
            (-8.8, 13.2, "Luanda"),
            (-12.6, 13.4, "Benguela"),
            (-15.2, 12.1, "Namibe"),
            (-16.8, 11.8, "Tombwa")
        ]
        
        for lat, lon, name in sample_points:
            # Salinidade baseada na localização (upwelling aumenta salinidade)
            base_salinity = 35.0
            if lat < -12:  # Região de upwelling
                base_salinity += 0.3
            
            salinity = base_salinity + np.random.normal(0, 0.1)
            
            features.append({
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lon, lat]
                },
                'properties': {
                    'salinity': round(float(salinity), 1),
                    'location': name,
                    'time': time.isoformat()
                }
            })
        
        return {
            'type': 'FeatureCollection',
            'features': features,
            'metadata': {
                'variable': 'salinity',
                'units': 'psu',
                'time': time.isoformat()
            }
        }
    
    def generate_simulated_chlorophyll(self, time: datetime) -> Dict[str, Any]:
        """Gerar dados simulados de clorofila"""
        
        features = []
        sample_points = [
            (-5.5, 12.2, "Cabinda"),
            (-8.8, 13.2, "Luanda"),
            (-12.6, 13.4, "Benguela"),
            (-15.2, 12.1, "Namibe"),
            (-16.8, 11.8, "Tombwa")
        ]
        
        for lat, lon, name in sample_points:
            # Clorofila baseada no upwelling (mais alta ao sul)
            base_chl = 1.0
            if lat < -10:  # Região de upwelling
                base_chl = 5.0 + abs(lat + 10) * 2
            
            # Variação sazonal (pico durante upwelling junho-setembro)
            month = time.month
            if 6 <= month <= 9:
                base_chl *= 1.5
            
            chlorophyll = base_chl + np.random.normal(0, base_chl * 0.2)
            
            features.append({
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lon, lat]
                },
                'properties': {
                    'chlorophyll': round(float(max(0.1, chlorophyll)), 1),
                    'location': name,
                    'time': time.isoformat()
                }
            })
        
        return {
            'type': 'FeatureCollection',
            'features': features,
            'metadata': {
                'variable': 'chlorophyll',
                'units': 'mg/m3',
                'time': time.isoformat()
            }
        }


# Instância global da API
metocean_api = MetoceanAPI()
app = metocean_api.app

# Para uso direto
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
