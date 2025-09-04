"""
Advanced Biomass Calculator for BGAPP
Calculadora avançada de biomassa terrestre e marinha
Integra dados NDVI, Chl-a, SST e modelos oceanográficos
"""

import json
import numpy as np
import xarray as xr
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Union
from pathlib import Path
import logging
from dataclasses import dataclass
from enum import Enum

from ..models.biomass import chl_to_npp_empirical, ndvi_to_biomass_regression, validate_biomass_model
from ..models.angola_oceanography import AngolaOceanographicModel

logger = logging.getLogger(__name__)


class BiomassType(Enum):
    """Tipos de biomassa suportados"""
    TERRESTRIAL = "terrestrial"
    MARINE_PHYTOPLANKTON = "marine_phytoplankton"
    MARINE_FISH = "marine_fish"
    MARINE_TOTAL = "marine_total"
    AGRICULTURAL = "agricultural"
    FOREST = "forest"


@dataclass
class BiomassResult:
    """Resultado de cálculo de biomassa"""
    biomass_type: BiomassType
    total_biomass: float  # toneladas
    biomass_density: float  # kg/m² ou kg/ha
    area_km2: float
    calculation_method: str
    confidence_level: float  # 0-1
    temporal_coverage: Dict[str, str]
    spatial_bounds: Dict[str, float]
    metadata: Dict[str, Any]


@dataclass
class BiomassTimeSeries:
    """Série temporal de biomassa"""
    timestamps: List[str]
    biomass_values: List[float]
    biomass_type: BiomassType
    units: str
    region_name: str
    statistics: Dict[str, float]


class AdvancedBiomassCalculator:
    """
    Calculadora avançada de biomassa para Angola
    Implementa múltiplos métodos e modelos científicos
    """
    
    def __init__(self):
        self.angola_model = AngolaOceanographicModel()
        
        # Parâmetros de conversão baseados em literatura científica
        self.conversion_parameters = {
            'ndvi_to_biomass': {
                'forest': {'slope': 15.2, 'intercept': 2.8, 'r2': 0.78},
                'savanna': {'slope': 8.5, 'intercept': 1.2, 'r2': 0.65},
                'agricultural': {'slope': 12.3, 'intercept': 0.8, 'r2': 0.72},
                'mixed': {'slope': 10.5, 'intercept': 1.5, 'r2': 0.70}
            },
            'chl_to_phytoplankton': {
                'coastal': {'carbon_ratio': 50, 'depth_factor': 0.8},
                'offshore': {'carbon_ratio': 40, 'depth_factor': 1.2},
                'upwelling': {'carbon_ratio': 65, 'depth_factor': 0.6}
            },
            'npp_to_fish': {
                'transfer_efficiency': 0.15,  # 15% da produção primária
                'trophic_levels': {
                    'small_pelagic': 0.25,  # 25% do NPP disponível
                    'large_pelagic': 0.08,  # 8% do NPP disponível
                    'demersal': 0.12        # 12% do NPP disponível
                }
            }
        }
        
        # Zonas ecológicas de Angola
        self.ecological_zones = {
            'cabinda_forests': {
                'bounds': {'lat_min': -6.0, 'lat_max': -4.2, 'lon_min': 12.0, 'lon_max': 14.5},
                'vegetation_type': 'forest',
                'biomass_density_range': [80, 250]  # toneladas/ha
            },
            'northern_savanna': {
                'bounds': {'lat_min': -10.0, 'lat_max': -6.0, 'lon_min': 13.0, 'lon_max': 20.0},
                'vegetation_type': 'savanna',
                'biomass_density_range': [15, 60]
            },
            'central_agricultural': {
                'bounds': {'lat_min': -12.0, 'lat_max': -8.0, 'lon_min': 14.0, 'lon_max': 18.0},
                'vegetation_type': 'agricultural',
                'biomass_density_range': [5, 25]
            },
            'southern_arid': {
                'bounds': {'lat_min': -18.0, 'lat_max': -12.0, 'lon_min': 12.0, 'lon_max': 20.0},
                'vegetation_type': 'mixed',
                'biomass_density_range': [2, 15]
            }
        }
        
        # Zonas marinhas de Angola
        self.marine_zones = {
            'cabinda_coastal': {
                'bounds': {'lat_min': -6.0, 'lat_max': -4.2, 'lon_min': 8.5, 'lon_max': 12.0},
                'zone_type': 'coastal',
                'productivity': 'medium',
                'upwelling_intensity': 0.3
            },
            'luanda_upwelling': {
                'bounds': {'lat_min': -10.0, 'lat_max': -6.0, 'lon_min': 8.5, 'lon_max': 13.0},
                'zone_type': 'upwelling',
                'productivity': 'high',
                'upwelling_intensity': 0.6
            },
            'benguela_system': {
                'bounds': {'lat_min': -18.0, 'lat_max': -10.0, 'lon_min': 8.5, 'lon_max': 14.0},
                'zone_type': 'upwelling',
                'productivity': 'very_high',
                'upwelling_intensity': 0.9
            },
            'offshore_oligotrophic': {
                'bounds': {'lat_min': -18.0, 'lat_max': -4.2, 'lon_min': 14.0, 'lon_max': 17.5},
                'zone_type': 'offshore',
                'productivity': 'low',
                'upwelling_intensity': 0.1
            }
        }
    
    def calculate_terrestrial_biomass(self, 
                                    ndvi_data: Union[np.ndarray, xr.DataArray],
                                    region_bounds: Dict[str, float],
                                    vegetation_type: str = 'mixed',
                                    calculation_date: str = None) -> BiomassResult:
        """
        Calcular biomassa terrestre usando dados NDVI
        """
        if calculation_date is None:
            calculation_date = datetime.now().isoformat()[:10]
        
        # Identificar zona ecológica baseada nos bounds
        ecological_zone = self._identify_ecological_zone(region_bounds)
        
        # Obter parâmetros de conversão
        if vegetation_type in self.conversion_parameters['ndvi_to_biomass']:
            params = self.conversion_parameters['ndvi_to_biomass'][vegetation_type]
        else:
            params = self.conversion_parameters['ndvi_to_biomass']['mixed']
        
        # Converter NDVI para array numpy se necessário
        if isinstance(ndvi_data, xr.DataArray):
            ndvi_values = ndvi_data.values
        else:
            ndvi_values = ndvi_data
        
        # Filtrar valores válidos de NDVI (0.1 - 0.9)
        valid_mask = (ndvi_values >= 0.1) & (ndvi_values <= 0.9) & ~np.isnan(ndvi_values)
        valid_ndvi = ndvi_values[valid_mask]
        
        if len(valid_ndvi) == 0:
            logger.warning("Nenhum valor NDVI válido encontrado")
            return self._create_empty_biomass_result(BiomassType.TERRESTRIAL)
        
        # Aplicar modelo de regressão NDVI -> Biomassa
        # Biomassa (toneladas/ha) = slope * NDVI + intercept
        biomass_density_per_pixel = params['slope'] * valid_ndvi + params['intercept']
        
        # Aplicar correções baseadas na zona ecológica
        if ecological_zone:
            zone_info = self.ecological_zones[ecological_zone]
            density_range = zone_info['biomass_density_range']
            
            # Normalizar valores para o range da zona
            biomass_density_per_pixel = np.clip(
                biomass_density_per_pixel,
                density_range[0] * 0.5,  # Mínimo com margem
                density_range[1] * 1.2   # Máximo com margem
            )
        
        # Calcular área total (assumindo pixels de ~1km²)
        pixel_area_km2 = 1.0  # Simplificação
        total_area_km2 = len(valid_ndvi) * pixel_area_km2
        
        # Calcular biomassa total
        mean_biomass_density = np.mean(biomass_density_per_pixel)  # toneladas/ha
        total_biomass_tons = mean_biomass_density * total_area_km2 * 100  # converter km² para ha
        
        # Calcular nível de confiança baseado no R²
        confidence_level = params['r2']
        
        return BiomassResult(
            biomass_type=BiomassType.TERRESTRIAL,
            total_biomass=float(total_biomass_tons),
            biomass_density=float(mean_biomass_density),
            area_km2=float(total_area_km2),
            calculation_method=f"NDVI_regression_{vegetation_type}",
            confidence_level=float(confidence_level),
            temporal_coverage={'date': calculation_date},
            spatial_bounds=region_bounds,
            metadata={
                'vegetation_type': vegetation_type,
                'ecological_zone': ecological_zone,
                'valid_pixels': int(len(valid_ndvi)),
                'total_pixels': int(ndvi_values.size),
                'data_quality': float(len(valid_ndvi) / ndvi_values.size),
                'ndvi_statistics': {
                    'mean': float(np.mean(valid_ndvi)),
                    'std': float(np.std(valid_ndvi)),
                    'min': float(np.min(valid_ndvi)),
                    'max': float(np.max(valid_ndvi))
                }
            }
        )
    
    def calculate_marine_phytoplankton_biomass(self, 
                                             chl_data: Union[np.ndarray, xr.DataArray],
                                             sst_data: Optional[Union[np.ndarray, xr.DataArray]] = None,
                                             region_bounds: Dict[str, float] = None,
                                             calculation_date: str = None) -> BiomassResult:
        """
        Calcular biomassa de fitoplâncton marinho usando Chl-a
        """
        if calculation_date is None:
            calculation_date = datetime.now().isoformat()[:10]
        
        if region_bounds is None:
            region_bounds = self.angola_model.bounds
        
        # Identificar zona marinha
        marine_zone = self._identify_marine_zone(region_bounds)
        
        # Converter para array numpy se necessário
        if isinstance(chl_data, xr.DataArray):
            chl_values = chl_data.values
        else:
            chl_values = chl_data
        
        # Filtrar valores válidos de Chl-a (0.1 - 50 mg/m³)
        valid_mask = (chl_values >= 0.1) & (chl_values <= 50.0) & ~np.isnan(chl_values)
        valid_chl = chl_values[valid_mask]
        
        if len(valid_chl) == 0:
            logger.warning("Nenhum valor Chl-a válido encontrado")
            return self._create_empty_biomass_result(BiomassType.MARINE_PHYTOPLANKTON)
        
        # Obter parâmetros da zona marinha
        zone_params = self.conversion_parameters['chl_to_phytoplankton']['coastal']
        if marine_zone and marine_zone in self.marine_zones:
            zone_info = self.marine_zones[marine_zone]
            if zone_info['zone_type'] == 'upwelling':
                zone_params = self.conversion_parameters['chl_to_phytoplankton']['upwelling']
            elif zone_info['zone_type'] == 'offshore':
                zone_params = self.conversion_parameters['chl_to_phytoplankton']['offshore']
        
        # Converter Chl-a para biomassa de fitoplâncton
        # Biomassa (mg C/m³) = Chl-a * carbon_ratio
        phytoplankton_carbon = valid_chl * zone_params['carbon_ratio']
        
        # Aplicar correção de profundidade
        phytoplankton_carbon *= zone_params['depth_factor']
        
        # Converter para biomassa úmida (assumindo ~10% carbono em peso seco, ~20% peso seco)
        wet_biomass_mg_m3 = phytoplankton_carbon / 0.1 / 0.2
        
        # Calcular área e volume
        pixel_area_km2 = 1.0  # Simplificação
        total_area_km2 = len(valid_chl) * pixel_area_km2
        
        # Assumir profundidade média da zona eufótica (50m)
        euphotic_depth_m = 50
        total_volume_km3 = total_area_km2 * (euphotic_depth_m / 1000)
        
        # Calcular biomassa total
        mean_biomass_density = np.mean(wet_biomass_mg_m3)  # mg/m³
        total_biomass_tons = (mean_biomass_density / 1e9) * (total_volume_km3 * 1e9)  # converter para toneladas
        
        # Nível de confiança baseado na qualidade dos dados e método
        data_quality = len(valid_chl) / chl_values.size
        confidence_level = 0.7 * data_quality  # Base 70% para método Chl-a
        
        return BiomassResult(
            biomass_type=BiomassType.MARINE_PHYTOPLANKTON,
            total_biomass=float(total_biomass_tons),
            biomass_density=float(mean_biomass_density / 1000),  # kg/m³
            area_km2=float(total_area_km2),
            calculation_method="chlorophyll_carbon_conversion",
            confidence_level=float(confidence_level),
            temporal_coverage={'date': calculation_date},
            spatial_bounds=region_bounds,
            metadata={
                'marine_zone': marine_zone,
                'euphotic_depth_m': euphotic_depth_m,
                'total_volume_km3': float(total_volume_km3),
                'carbon_ratio': zone_params['carbon_ratio'],
                'depth_factor': zone_params['depth_factor'],
                'valid_pixels': int(len(valid_chl)),
                'data_quality': float(data_quality),
                'chl_statistics': {
                    'mean': float(np.mean(valid_chl)),
                    'std': float(np.std(valid_chl)),
                    'min': float(np.min(valid_chl)),
                    'max': float(np.max(valid_chl))
                }
            }
        )
    
    def calculate_marine_fish_biomass(self, 
                                    npp_data: Union[np.ndarray, xr.DataArray],
                                    fish_type: str = 'total',
                                    region_bounds: Dict[str, float] = None,
                                    calculation_date: str = None) -> BiomassResult:
        """
        Calcular biomassa de peixes marinhos baseada na produtividade primária
        """
        if calculation_date is None:
            calculation_date = datetime.now().isoformat()[:10]
        
        if region_bounds is None:
            region_bounds = self.angola_model.bounds
        
        # Converter para array numpy se necessário
        if isinstance(npp_data, xr.DataArray):
            npp_values = npp_data.values
        else:
            npp_values = npp_data
        
        # Filtrar valores válidos de NPP
        valid_mask = (npp_values > 0) & (npp_values < 5000) & ~np.isnan(npp_values)
        valid_npp = npp_values[valid_mask]
        
        if len(valid_npp) == 0:
            logger.warning("Nenhum valor NPP válido encontrado")
            return self._create_empty_biomass_result(BiomassType.MARINE_FISH)
        
        # Obter eficiência de transferência trófica
        transfer_params = self.conversion_parameters['npp_to_fish']
        base_efficiency = transfer_params['transfer_efficiency']
        
        # Aplicar eficiência específica por tipo de peixe
        if fish_type in transfer_params['trophic_levels']:
            fish_efficiency = transfer_params['trophic_levels'][fish_type]
        else:
            fish_efficiency = 0.15  # Eficiência média
        
        # Calcular biomassa de peixes
        # Biomassa peixe = NPP * eficiência_transferência * eficiência_específica
        fish_npp = valid_npp * base_efficiency * fish_efficiency
        
        # Converter NPP (mg C/m²/dia) para biomassa anual de peixes
        # Assumir: 365 dias/ano, 10% carbono em peso seco, 20% peso seco
        annual_npp = fish_npp * 365  # mg C/m²/ano
        fish_biomass_mg_m2 = annual_npp / 0.1 / 0.2  # mg/m²
        
        # Calcular área e biomassa total
        pixel_area_km2 = 1.0
        total_area_km2 = len(valid_npp) * pixel_area_km2
        
        mean_biomass_density = np.mean(fish_biomass_mg_m2)  # mg/m²
        total_biomass_tons = (mean_biomass_density / 1e9) * (total_area_km2 * 1e6)  # converter para toneladas
        
        # Nível de confiança (menor que fitoplâncton devido à complexidade trófica)
        data_quality = len(valid_npp) / npp_values.size
        confidence_level = 0.5 * data_quality  # Base 50% para transferência trófica
        
        return BiomassResult(
            biomass_type=BiomassType.MARINE_FISH,
            total_biomass=float(total_biomass_tons),
            biomass_density=float(mean_biomass_density / 1e6),  # kg/m²
            area_km2=float(total_area_km2),
            calculation_method=f"npp_trophic_transfer_{fish_type}",
            confidence_level=float(confidence_level),
            temporal_coverage={'date': calculation_date},
            spatial_bounds=region_bounds,
            metadata={
                'fish_type': fish_type,
                'transfer_efficiency': base_efficiency,
                'fish_efficiency': fish_efficiency,
                'valid_pixels': int(len(valid_npp)),
                'data_quality': float(data_quality),
                'npp_statistics': {
                    'mean': float(np.mean(valid_npp)),
                    'std': float(np.std(valid_npp)),
                    'min': float(np.min(valid_npp)),
                    'max': float(np.max(valid_npp))
                }
            }
        )
    
    def calculate_biomass_time_series(self, 
                                    data_series: Dict[str, Union[np.ndarray, xr.DataArray]],
                                    biomass_type: BiomassType,
                                    region_bounds: Dict[str, float],
                                    region_name: str = "Angola") -> BiomassTimeSeries:
        """
        Calcular série temporal de biomassa
        """
        timestamps = sorted(data_series.keys())
        biomass_values = []
        
        for timestamp in timestamps:
            data = data_series[timestamp]
            
            if biomass_type == BiomassType.TERRESTRIAL:
                result = self.calculate_terrestrial_biomass(data, region_bounds, calculation_date=timestamp)
            elif biomass_type == BiomassType.MARINE_PHYTOPLANKTON:
                result = self.calculate_marine_phytoplankton_biomass(data, region_bounds=region_bounds, calculation_date=timestamp)
            elif biomass_type == BiomassType.MARINE_FISH:
                result = self.calculate_marine_fish_biomass(data, region_bounds=region_bounds, calculation_date=timestamp)
            else:
                logger.error(f"Tipo de biomassa não suportado: {biomass_type}")
                continue
            
            biomass_values.append(result.total_biomass)
        
        # Calcular estatísticas da série temporal
        if biomass_values:
            statistics = {
                'mean': float(np.mean(biomass_values)),
                'std': float(np.std(biomass_values)),
                'min': float(np.min(biomass_values)),
                'max': float(np.max(biomass_values)),
                'trend': self._calculate_trend(biomass_values),
                'seasonal_pattern': self._detect_seasonality(timestamps, biomass_values)
            }
        else:
            statistics = {}
        
        # Determinar unidades
        if biomass_type in [BiomassType.TERRESTRIAL, BiomassType.AGRICULTURAL, BiomassType.FOREST]:
            units = "toneladas"
        else:
            units = "toneladas"
        
        return BiomassTimeSeries(
            timestamps=timestamps,
            biomass_values=biomass_values,
            biomass_type=biomass_type,
            units=units,
            region_name=region_name,
            statistics=statistics
        )
    
    def compare_biomass_zones(self, 
                            data: Union[np.ndarray, xr.DataArray],
                            zones: List[Dict[str, Any]],
                            biomass_type: BiomassType,
                            calculation_date: str = None) -> List[Dict[str, Any]]:
        """
        Comparar biomassa entre diferentes zonas
        """
        if calculation_date is None:
            calculation_date = datetime.now().isoformat()[:10]
        
        zone_results = []
        
        for zone in zones:
            zone_bounds = zone.get('bounds', {})
            zone_name = zone.get('name', 'Unnamed Zone')
            
            # Extrair dados da zona (simplificação - em produção usar masking espacial)
            # Aqui assumimos que os dados já estão filtrados para a zona
            
            if biomass_type == BiomassType.TERRESTRIAL:
                result = self.calculate_terrestrial_biomass(
                    data, zone_bounds, 
                    vegetation_type=zone.get('vegetation_type', 'mixed'),
                    calculation_date=calculation_date
                )
            elif biomass_type == BiomassType.MARINE_PHYTOPLANKTON:
                result = self.calculate_marine_phytoplankton_biomass(
                    data, region_bounds=zone_bounds, calculation_date=calculation_date
                )
            elif biomass_type == BiomassType.MARINE_FISH:
                result = self.calculate_marine_fish_biomass(
                    data, region_bounds=zone_bounds, calculation_date=calculation_date
                )
            else:
                continue
            
            zone_result = {
                'zone_name': zone_name,
                'zone_properties': zone,
                'biomass_result': result,
                'biomass_per_km2': result.total_biomass / result.area_km2 if result.area_km2 > 0 else 0
            }
            
            zone_results.append(zone_result)
        
        # Ordenar por biomassa total (decrescente)
        zone_results.sort(key=lambda x: x['biomass_result'].total_biomass, reverse=True)
        
        return zone_results
    
    def _identify_ecological_zone(self, bounds: Dict[str, float]) -> Optional[str]:
        """Identificar zona ecológica baseada nos limites espaciais"""
        center_lat = (bounds.get('lat_min', 0) + bounds.get('lat_max', 0)) / 2
        center_lon = (bounds.get('lon_min', 0) + bounds.get('lon_max', 0)) / 2
        
        for zone_name, zone_info in self.ecological_zones.items():
            zone_bounds = zone_info['bounds']
            if (zone_bounds['lat_min'] <= center_lat <= zone_bounds['lat_max'] and
                zone_bounds['lon_min'] <= center_lon <= zone_bounds['lon_max']):
                return zone_name
        
        return None
    
    def _identify_marine_zone(self, bounds: Dict[str, float]) -> Optional[str]:
        """Identificar zona marinha baseada nos limites espaciais"""
        center_lat = (bounds.get('lat_min', 0) + bounds.get('lat_max', 0)) / 2
        center_lon = (bounds.get('lon_min', 0) + bounds.get('lon_max', 0)) / 2
        
        for zone_name, zone_info in self.marine_zones.items():
            zone_bounds = zone_info['bounds']
            if (zone_bounds['lat_min'] <= center_lat <= zone_bounds['lat_max'] and
                zone_bounds['lon_min'] <= center_lon <= zone_bounds['lon_max']):
                return zone_name
        
        return None
    
    def _create_empty_biomass_result(self, biomass_type: BiomassType) -> BiomassResult:
        """Criar resultado vazio para casos de erro"""
        return BiomassResult(
            biomass_type=biomass_type,
            total_biomass=0.0,
            biomass_density=0.0,
            area_km2=0.0,
            calculation_method="error",
            confidence_level=0.0,
            temporal_coverage={},
            spatial_bounds={},
            metadata={'error': 'No valid data found'}
        )
    
    def _calculate_trend(self, values: List[float]) -> Dict[str, Any]:
        """Calcular tendência da série temporal"""
        if len(values) < 3:
            return {'direction': 'insufficient_data', 'slope': 0.0}
        
        x = np.arange(len(values))
        slope, intercept = np.polyfit(x, values, 1)
        
        direction = 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'stable'
        
        # Calcular significância da tendência
        correlation = np.corrcoef(x, values)[0, 1]
        
        return {
            'direction': direction,
            'slope': float(slope),
            'correlation': float(correlation),
            'strength': 'strong' if abs(correlation) > 0.7 else 'moderate' if abs(correlation) > 0.4 else 'weak'
        }
    
    def _detect_seasonality(self, timestamps: List[str], values: List[float]) -> Dict[str, Any]:
        """Detectar padrões sazonais"""
        if len(timestamps) < 12:  # Precisa de pelo menos 1 ano de dados
            return {'seasonal': False, 'pattern': 'insufficient_data'}
        
        # Extrair meses dos timestamps
        try:
            months = [datetime.fromisoformat(ts[:10]).month for ts in timestamps]
            
            # Calcular médias mensais
            monthly_means = {}
            for month, value in zip(months, values):
                if month not in monthly_means:
                    monthly_means[month] = []
                monthly_means[month].append(value)
            
            # Calcular médias por mês
            monthly_averages = {month: np.mean(vals) for month, vals in monthly_means.items()}
            
            # Verificar se há padrão sazonal (variação > 20% da média)
            overall_mean = np.mean(values)
            monthly_variation = max(monthly_averages.values()) - min(monthly_averages.values())
            
            is_seasonal = (monthly_variation / overall_mean) > 0.2
            
            # Identificar pico sazonal
            peak_month = max(monthly_averages, key=monthly_averages.get)
            low_month = min(monthly_averages, key=monthly_averages.get)
            
            return {
                'seasonal': is_seasonal,
                'variation_percent': float(monthly_variation / overall_mean * 100),
                'peak_month': int(peak_month),
                'low_month': int(low_month),
                'monthly_averages': {int(k): float(v) for k, v in monthly_averages.items()}
            }
            
        except Exception as e:
            logger.error(f"Erro na detecção de sazonalidade: {e}")
            return {'seasonal': False, 'pattern': 'error'}
    
    def export_biomass_analysis(self, 
                              results: Union[BiomassResult, List[BiomassResult], BiomassTimeSeries],
                              output_path: str,
                              format: str = 'json') -> bool:
        """
        Exportar resultados de análise de biomassa
        """
        try:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            if format == 'json':
                if isinstance(results, list):
                    data = [self._biomass_result_to_dict(r) for r in results]
                elif isinstance(results, BiomassTimeSeries):
                    data = self._biomass_timeseries_to_dict(results)
                else:
                    data = self._biomass_result_to_dict(results)
                
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
            
            elif format == 'csv' and isinstance(results, BiomassTimeSeries):
                df = pd.DataFrame({
                    'timestamp': results.timestamps,
                    'biomass_tons': results.biomass_values,
                    'biomass_type': str(results.biomass_type.value),
                    'region': results.region_name
                })
                df.to_csv(output_file, index=False)
            
            logger.info(f"Análise de biomassa exportada para: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao exportar análise: {e}")
            return False
    
    def _biomass_result_to_dict(self, result: BiomassResult) -> Dict[str, Any]:
        """Converter BiomassResult para dicionário"""
        return {
            'biomass_type': result.biomass_type.value,
            'total_biomass_tons': result.total_biomass,
            'biomass_density': result.biomass_density,
            'area_km2': result.area_km2,
            'calculation_method': result.calculation_method,
            'confidence_level': result.confidence_level,
            'temporal_coverage': result.temporal_coverage,
            'spatial_bounds': result.spatial_bounds,
            'metadata': result.metadata
        }
    
    def _biomass_timeseries_to_dict(self, timeseries: BiomassTimeSeries) -> Dict[str, Any]:
        """Converter BiomassTimeSeries para dicionário"""
        return {
            'type': 'biomass_time_series',
            'biomass_type': timeseries.biomass_type.value,
            'region_name': timeseries.region_name,
            'units': timeseries.units,
            'data': [
                {'timestamp': ts, 'biomass': val}
                for ts, val in zip(timeseries.timestamps, timeseries.biomass_values)
            ],
            'statistics': timeseries.statistics,
            'metadata': {
                'total_points': len(timeseries.timestamps),
                'date_range': {
                    'start': timeseries.timestamps[0] if timeseries.timestamps else None,
                    'end': timeseries.timestamps[-1] if timeseries.timestamps else None
                }
            }
        }


def create_angola_biomass_assessment(start_date: str = "2020-01-01",
                                    end_date: str = None) -> Dict[str, Any]:
    """
    Função utilitária para avaliação completa de biomassa de Angola
    """
    if end_date is None:
        end_date = datetime.now().strftime('%Y-%m-%d')
    
    calculator = AdvancedBiomassCalculator()
    
    # Simular dados para demonstração
    # Em produção, estes dados viriam dos conectores STAC/Copernicus
    
    # Dados NDVI simulados para diferentes zonas
    terrestrial_zones = [
        {'name': 'Florestas de Cabinda', 'bounds': calculator.ecological_zones['cabinda_forests']['bounds'], 'vegetation_type': 'forest'},
        {'name': 'Savana Norte', 'bounds': calculator.ecological_zones['northern_savanna']['bounds'], 'vegetation_type': 'savanna'},
        {'name': 'Zona Agrícola Central', 'bounds': calculator.ecological_zones['central_agricultural']['bounds'], 'vegetation_type': 'agricultural'}
    ]
    
    # Dados marinhos simulados
    marine_zones = [
        {'name': 'Sistema Benguela', 'bounds': calculator.marine_zones['benguela_system']['bounds']},
        {'name': 'Upwelling Luanda', 'bounds': calculator.marine_zones['luanda_upwelling']['bounds']},
        {'name': 'Costa Cabinda', 'bounds': calculator.marine_zones['cabinda_coastal']['bounds']}
    ]
    
    # Simular dados NDVI (em produção: obter do STAC)
    ndvi_data = np.random.beta(6, 2, (100, 100)) * 0.8 + 0.1  # NDVI realista
    
    # Simular dados Chl-a (em produção: obter do Copernicus)
    chl_data = np.random.lognormal(0.5, 1.2, (100, 100))  # Chl-a realista
    
    # Simular NPP baseado em Chl-a
    npp_data = chl_data * 50 + np.random.normal(0, 10, chl_data.shape)  # NPP simulado
    
    # Calcular biomassa terrestre por zona
    terrestrial_results = calculator.compare_biomass_zones(
        ndvi_data, terrestrial_zones, BiomassType.TERRESTRIAL
    )
    
    # Calcular biomassa marinha por zona
    phytoplankton_results = calculator.compare_biomass_zones(
        chl_data, marine_zones, BiomassType.MARINE_PHYTOPLANKTON
    )
    
    fish_results = calculator.compare_biomass_zones(
        npp_data, marine_zones, BiomassType.MARINE_FISH
    )
    
    # Calcular totais nacionais
    total_terrestrial = sum(r['biomass_result'].total_biomass for r in terrestrial_results)
    total_phytoplankton = sum(r['biomass_result'].total_biomass for r in phytoplankton_results)
    total_fish = sum(r['biomass_result'].total_biomass for r in fish_results)
    
    return {
        'assessment_info': {
            'country': 'Angola',
            'assessment_date': datetime.now().isoformat(),
            'temporal_range': {'start': start_date, 'end': end_date},
            'methodology': 'Remote sensing + oceanographic models'
        },
        'terrestrial_biomass': {
            'total_tons': total_terrestrial,
            'zones': terrestrial_results
        },
        'marine_biomass': {
            'phytoplankton': {
                'total_tons': total_phytoplankton,
                'zones': phytoplankton_results
            },
            'fish': {
                'total_tons': total_fish,
                'zones': fish_results
            }
        },
        'summary': {
            'total_biomass_tons': total_terrestrial + total_phytoplankton + total_fish,
            'terrestrial_percentage': (total_terrestrial / (total_terrestrial + total_phytoplankton + total_fish)) * 100,
            'marine_percentage': ((total_phytoplankton + total_fish) / (total_terrestrial + total_phytoplankton + total_fish)) * 100,
            'key_findings': [
                f"Maior biomassa terrestre: {terrestrial_results[0]['zone_name'] if terrestrial_results else 'N/A'}",
                f"Zona marinha mais produtiva: {phytoplankton_results[0]['zone_name'] if phytoplankton_results else 'N/A'}",
                f"Biomassa total estimada: {total_terrestrial + total_phytoplankton + total_fish:.0f} toneladas"
            ]
        }
    }
