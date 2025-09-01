#!/usr/bin/env python3
"""
Sistema de Validação Automática da Qualidade dos Dados
Implementa validações abrangentes para dados geoespaciais e ambientais
"""

import asyncio
import numpy as np
import pandas as pd
import geopandas as gpd
import xarray as xr
from typing import Dict, List, Any, Optional, Tuple, Union
import logging
from datetime import datetime, timedelta
import json
from pathlib import Path
import warnings
from cerberus import Validator
from jsonschema import validate, ValidationError as JSONValidationError
import shapely.geometry as geom
from shapely.validation import explain_validity
import scipy.stats as stats
from scipy.spatial.distance import pdist, squareform
import matplotlib.pyplot as plt
import seaborn as sns
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suprimir warnings desnecessários
warnings.filterwarnings('ignore', category=RuntimeWarning)

class ValidationLevel(Enum):
    """Níveis de validação"""
    BASIC = "basic"
    STANDARD = "standard"
    COMPREHENSIVE = "comprehensive"
    STRICT = "strict"

class ValidationStatus(Enum):
    """Status de validação"""
    PASSED = "passed"
    WARNING = "warning"
    FAILED = "failed"
    ERROR = "error"

@dataclass
class ValidationResult:
    """Resultado de validação"""
    rule_name: str
    status: ValidationStatus
    message: str
    details: Optional[Dict[str, Any]] = None
    score: Optional[float] = None
    timestamp: str = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()

@dataclass
class DataQualityReport:
    """Relatório de qualidade dos dados"""
    data_source: str
    validation_level: ValidationLevel
    overall_score: float
    total_rules: int
    passed: int
    warnings: int
    failed: int
    errors: int
    results: List[ValidationResult]
    metadata: Dict[str, Any]
    timestamp: str = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()

class GeospatialValidator:
    """Validador para dados geoespaciais"""
    
    def __init__(self):
        self.angola_bounds = {
            'min_lat': -18.0,
            'max_lat': -5.0,
            'min_lon': 11.0,
            'max_lon': 24.0
        }
    
    def validate_coordinates(self, data: Union[pd.DataFrame, gpd.GeoDataFrame]) -> List[ValidationResult]:
        """Valida coordenadas geográficas"""
        results = []
        
        try:
            # Verificar se existem colunas de coordenadas
            if isinstance(data, gpd.GeoDataFrame):
                coords = data.geometry.apply(lambda geom: (geom.x, geom.y) if hasattr(geom, 'x') else None)
                lons = coords.apply(lambda x: x[0] if x else None)
                lats = coords.apply(lambda x: x[1] if x else None)
            else:
                # Tentar encontrar colunas de coordenadas
                lon_cols = [col for col in data.columns if 'lon' in col.lower() or 'x' in col.lower()]
                lat_cols = [col for col in data.columns if 'lat' in col.lower() or 'y' in col.lower()]
                
                if not lon_cols or not lat_cols:
                    results.append(ValidationResult(
                        rule_name="coordinate_columns",
                        status=ValidationStatus.FAILED,
                        message="Colunas de coordenadas não encontradas"
                    ))
                    return results
                
                lons = data[lon_cols[0]]
                lats = data[lat_cols[0]]
            
            # Validar range de coordenadas
            invalid_lons = ((lons < -180) | (lons > 180)).sum()
            invalid_lats = ((lats < -90) | (lats > 90)).sum()
            
            if invalid_lons > 0 or invalid_lats > 0:
                results.append(ValidationResult(
                    rule_name="coordinate_range",
                    status=ValidationStatus.FAILED,
                    message=f"Coordenadas inválidas: {invalid_lons} longitudes, {invalid_lats} latitudes",
                    details={"invalid_lons": int(invalid_lons), "invalid_lats": int(invalid_lats)}
                ))
            else:
                results.append(ValidationResult(
                    rule_name="coordinate_range",
                    status=ValidationStatus.PASSED,
                    message="Todas as coordenadas estão dentro do range válido"
                ))
            
            # Validar se coordenadas estão dentro dos limites de Angola
            outside_angola = (
                (lons < self.angola_bounds['min_lon']) | 
                (lons > self.angola_bounds['max_lon']) |
                (lats < self.angola_bounds['min_lat']) | 
                (lats > self.angola_bounds['max_lat'])
            ).sum()
            
            angola_coverage = ((len(data) - outside_angola) / len(data)) * 100
            
            if outside_angola > len(data) * 0.1:  # Mais de 10% fora
                results.append(ValidationResult(
                    rule_name="angola_bounds",
                    status=ValidationStatus.WARNING,
                    message=f"{outside_angola} pontos fora dos limites de Angola ({angola_coverage:.1f}% cobertura)",
                    details={"outside_count": int(outside_angola), "coverage_percent": angola_coverage}
                ))
            else:
                results.append(ValidationResult(
                    rule_name="angola_bounds",
                    status=ValidationStatus.PASSED,
                    message=f"Boa cobertura de Angola ({angola_coverage:.1f}%)"
                ))
            
            # Validar coordenadas duplicadas
            if isinstance(data, gpd.GeoDataFrame):
                duplicates = data.geometry.duplicated().sum()
            else:
                duplicates = data[lon_cols + lat_cols].duplicated().sum()
            
            duplicate_percent = (duplicates / len(data)) * 100
            
            if duplicate_percent > 5:  # Mais de 5% duplicadas
                results.append(ValidationResult(
                    rule_name="coordinate_duplicates",
                    status=ValidationStatus.WARNING,
                    message=f"{duplicates} coordenadas duplicadas ({duplicate_percent:.1f}%)",
                    details={"duplicate_count": int(duplicates), "duplicate_percent": duplicate_percent}
                ))
            else:
                results.append(ValidationResult(
                    rule_name="coordinate_duplicates",
                    status=ValidationStatus.PASSED,
                    message=f"Baixo nível de duplicação ({duplicate_percent:.1f}%)"
                ))
                
        except Exception as e:
            results.append(ValidationResult(
                rule_name="coordinate_validation",
                status=ValidationStatus.ERROR,
                message=f"Erro na validação de coordenadas: {str(e)}"
            ))
        
        return results
    
    def validate_geometry(self, gdf: gpd.GeoDataFrame) -> List[ValidationResult]:
        """Valida geometrias"""
        results = []
        
        try:
            # Verificar geometrias válidas
            invalid_geoms = ~gdf.geometry.is_valid
            invalid_count = invalid_geoms.sum()
            
            if invalid_count > 0:
                # Detalhes das geometrias inválidas
                invalid_reasons = []
                for idx in gdf[invalid_geoms].index[:5]:  # Máximo 5 exemplos
                    reason = explain_validity(gdf.loc[idx, 'geometry'])
                    invalid_reasons.append(f"Índice {idx}: {reason}")
                
                results.append(ValidationResult(
                    rule_name="geometry_validity",
                    status=ValidationStatus.FAILED,
                    message=f"{invalid_count} geometrias inválidas encontradas",
                    details={
                        "invalid_count": int(invalid_count),
                        "examples": invalid_reasons
                    }
                ))
            else:
                results.append(ValidationResult(
                    rule_name="geometry_validity",
                    status=ValidationStatus.PASSED,
                    message="Todas as geometrias são válidas"
                ))
            
            # Verificar geometrias vazias
            empty_geoms = gdf.geometry.is_empty.sum()
            
            if empty_geoms > 0:
                results.append(ValidationResult(
                    rule_name="empty_geometries",
                    status=ValidationStatus.WARNING,
                    message=f"{empty_geoms} geometrias vazias encontradas",
                    details={"empty_count": int(empty_geoms)}
                ))
            else:
                results.append(ValidationResult(
                    rule_name="empty_geometries",
                    status=ValidationStatus.PASSED,
                    message="Nenhuma geometria vazia encontrada"
                ))
            
            # Verificar CRS
            if gdf.crs is None:
                results.append(ValidationResult(
                    rule_name="coordinate_reference_system",
                    status=ValidationStatus.WARNING,
                    message="Sistema de coordenadas não definido"
                ))
            elif gdf.crs.to_epsg() != 4326:
                results.append(ValidationResult(
                    rule_name="coordinate_reference_system",
                    status=ValidationStatus.WARNING,
                    message=f"CRS não é WGS84: {gdf.crs}",
                    details={"crs": str(gdf.crs)}
                ))
            else:
                results.append(ValidationResult(
                    rule_name="coordinate_reference_system",
                    status=ValidationStatus.PASSED,
                    message="CRS é WGS84 (EPSG:4326)"
                ))
                
        except Exception as e:
            results.append(ValidationResult(
                rule_name="geometry_validation",
                status=ValidationStatus.ERROR,
                message=f"Erro na validação de geometrias: {str(e)}"
            ))
        
        return results

class TemporalValidator:
    """Validador para dados temporais"""
    
    def validate_temporal_data(self, data: Union[pd.DataFrame, xr.Dataset]) -> List[ValidationResult]:
        """Valida dados temporais"""
        results = []
        
        try:
            # Identificar colunas/dimensões temporais
            if isinstance(data, xr.Dataset):
                time_dims = [dim for dim in data.dims if 'time' in dim.lower()]
                if not time_dims:
                    results.append(ValidationResult(
                        rule_name="temporal_dimension",
                        status=ValidationStatus.FAILED,
                        message="Dimensão temporal não encontrada"
                    ))
                    return results
                
                time_coord = data.coords[time_dims[0]]
                time_values = pd.to_datetime(time_coord.values)
                
            else:  # DataFrame
                time_cols = [col for col in data.columns if 'time' in col.lower() or 'date' in col.lower()]
                if not time_cols:
                    results.append(ValidationResult(
                        rule_name="temporal_column",
                        status=ValidationStatus.FAILED,
                        message="Coluna temporal não encontrada"
                    ))
                    return results
                
                time_values = pd.to_datetime(data[time_cols[0]])
            
            # Validar range temporal
            min_date = time_values.min()
            max_date = time_values.max()
            time_span = max_date - min_date
            
            # Verificar se datas são razoáveis (não muito antigas ou futuras)
            now = datetime.now()
            if min_date < datetime(1900, 1, 1):
                results.append(ValidationResult(
                    rule_name="temporal_range",
                    status=ValidationStatus.WARNING,
                    message=f"Datas muito antigas detectadas: {min_date}",
                    details={"min_date": min_date.isoformat()}
                ))
            elif max_date > now + timedelta(days=365):
                results.append(ValidationResult(
                    rule_name="temporal_range",
                    status=ValidationStatus.WARNING,
                    message=f"Datas futuras detectadas: {max_date}",
                    details={"max_date": max_date.isoformat()}
                ))
            else:
                results.append(ValidationResult(
                    rule_name="temporal_range",
                    status=ValidationStatus.PASSED,
                    message=f"Range temporal válido: {min_date.date()} a {max_date.date()}",
                    details={
                        "min_date": min_date.isoformat(),
                        "max_date": max_date.isoformat(),
                        "time_span_days": time_span.days
                    }
                ))
            
            # Validar continuidade temporal
            time_sorted = time_values.sort_values()
            gaps = time_sorted.diff()
            
            # Identificar gaps grandes (mais de 30 dias)
            large_gaps = gaps[gaps > pd.Timedelta(days=30)]
            
            if len(large_gaps) > 0:
                max_gap = large_gaps.max()
                results.append(ValidationResult(
                    rule_name="temporal_continuity",
                    status=ValidationStatus.WARNING,
                    message=f"{len(large_gaps)} gaps temporais grandes detectados (máximo: {max_gap})",
                    details={
                        "gap_count": len(large_gaps),
                        "max_gap_days": max_gap.days
                    }
                ))
            else:
                results.append(ValidationResult(
                    rule_name="temporal_continuity",
                    status=ValidationStatus.PASSED,
                    message="Boa continuidade temporal"
                ))
            
            # Validar duplicatas temporais
            duplicates = time_values.duplicated().sum()
            duplicate_percent = (duplicates / len(time_values)) * 100
            
            if duplicate_percent > 1:
                results.append(ValidationResult(
                    rule_name="temporal_duplicates",
                    status=ValidationStatus.WARNING,
                    message=f"{duplicates} timestamps duplicados ({duplicate_percent:.1f}%)",
                    details={"duplicate_count": int(duplicates), "duplicate_percent": duplicate_percent}
                ))
            else:
                results.append(ValidationResult(
                    rule_name="temporal_duplicates",
                    status=ValidationStatus.PASSED,
                    message=f"Baixo nível de duplicação temporal ({duplicate_percent:.1f}%)"
                ))
                
        except Exception as e:
            results.append(ValidationResult(
                rule_name="temporal_validation",
                status=ValidationStatus.ERROR,
                message=f"Erro na validação temporal: {str(e)}"
            ))
        
        return results

class EnvironmentalValidator:
    """Validador para dados ambientais"""
    
    def __init__(self):
        # Ranges válidos para variáveis ambientais
        self.valid_ranges = {
            'chlorophyll_a': (0.01, 50.0),      # mg/m³
            'sea_surface_temperature': (-2, 35),  # °C
            'salinity': (0, 50),                 # PSU
            'ph': (6.0, 9.0),                   # pH units
            'dissolved_oxygen': (0, 20),         # mg/L
            'turbidity': (0, 1000),             # NTU
            'depth': (-11000, 0),               # metros (negativo para profundidade)
            'wind_speed': (0, 100),             # m/s
            'wave_height': (0, 30),             # metros
            'precipitation': (0, 500),          # mm/day
            'air_temperature': (-50, 60),       # °C
            'humidity': (0, 100),               # %
            'pressure': (800, 1100),            # hPa
        }
    
    def validate_environmental_data(self, data: Union[pd.DataFrame, xr.Dataset]) -> List[ValidationResult]:
        """Valida dados ambientais"""
        results = []
        
        try:
            if isinstance(data, xr.Dataset):
                variables = list(data.data_vars.keys())
                data_dict = {var: data[var].values.flatten() for var in variables}
            else:
                variables = data.columns.tolist()
                data_dict = {var: data[var].values for var in variables if pd.api.types.is_numeric_dtype(data[var])}
            
            # Validar cada variável ambiental
            for var_name, values in data_dict.items():
                var_results = self._validate_environmental_variable(var_name, values)
                results.extend(var_results)
            
            # Validação de correlações entre variáveis
            if len(data_dict) > 1:
                correlation_results = self._validate_correlations(data_dict)
                results.extend(correlation_results)
            
            # Validação de outliers estatísticos
            outlier_results = self._validate_statistical_outliers(data_dict)
            results.extend(outlier_results)
            
        except Exception as e:
            results.append(ValidationResult(
                rule_name="environmental_validation",
                status=ValidationStatus.ERROR,
                message=f"Erro na validação ambiental: {str(e)}"
            ))
        
        return results
    
    def _validate_environmental_variable(self, var_name: str, values: np.ndarray) -> List[ValidationResult]:
        """Valida uma variável ambiental específica"""
        results = []
        
        # Limpar valores NaN para análise
        clean_values = values[~np.isnan(values)]
        
        if len(clean_values) == 0:
            results.append(ValidationResult(
                rule_name=f"{var_name}_data_availability",
                status=ValidationStatus.FAILED,
                message=f"Variável {var_name}: todos os valores são NaN"
            ))
            return results
        
        # Verificar range válido
        var_key = self._find_variable_key(var_name)
        if var_key and var_key in self.valid_ranges:
            min_valid, max_valid = self.valid_ranges[var_key]
            out_of_range = ((clean_values < min_valid) | (clean_values > max_valid)).sum()
            out_of_range_percent = (out_of_range / len(clean_values)) * 100
            
            if out_of_range_percent > 5:  # Mais de 5% fora do range
                results.append(ValidationResult(
                    rule_name=f"{var_name}_range_validation",
                    status=ValidationStatus.FAILED,
                    message=f"Variável {var_name}: {out_of_range} valores fora do range válido ({out_of_range_percent:.1f}%)",
                    details={
                        "valid_range": self.valid_ranges[var_key],
                        "out_of_range_count": int(out_of_range),
                        "out_of_range_percent": out_of_range_percent,
                        "actual_min": float(clean_values.min()),
                        "actual_max": float(clean_values.max())
                    }
                ))
            else:
                results.append(ValidationResult(
                    rule_name=f"{var_name}_range_validation",
                    status=ValidationStatus.PASSED,
                    message=f"Variável {var_name}: valores dentro do range válido"
                ))
        
        # Validar valores negativos onde não deveria haver
        if var_key in ['chlorophyll_a', 'wind_speed', 'wave_height', 'precipitation', 'humidity']:
            negative_count = (clean_values < 0).sum()
            if negative_count > 0:
                results.append(ValidationResult(
                    rule_name=f"{var_name}_negative_values",
                    status=ValidationStatus.FAILED,
                    message=f"Variável {var_name}: {negative_count} valores negativos inválidos",
                    details={"negative_count": int(negative_count)}
                ))
            else:
                results.append(ValidationResult(
                    rule_name=f"{var_name}_negative_values",
                    status=ValidationStatus.PASSED,
                    message=f"Variável {var_name}: nenhum valor negativo inválido"
                ))
        
        # Validar completude dos dados
        nan_count = np.isnan(values).sum()
        completeness = ((len(values) - nan_count) / len(values)) * 100
        
        if completeness < 70:  # Menos de 70% de dados
            results.append(ValidationResult(
                rule_name=f"{var_name}_completeness",
                status=ValidationStatus.WARNING,
                message=f"Variável {var_name}: baixa completude ({completeness:.1f}%)",
                details={"completeness_percent": completeness, "missing_count": int(nan_count)}
            ))
        else:
            results.append(ValidationResult(
                rule_name=f"{var_name}_completeness",
                status=ValidationStatus.PASSED,
                message=f"Variável {var_name}: boa completude ({completeness:.1f}%)"
            ))
        
        return results
    
    def _validate_correlations(self, data_dict: Dict[str, np.ndarray]) -> List[ValidationResult]:
        """Valida correlações entre variáveis ambientais"""
        results = []
        
        try:
            # Criar DataFrame para análise de correlação
            df = pd.DataFrame({k: v for k, v in data_dict.items()})
            correlation_matrix = df.corr()
            
            # Verificar correlações suspeitas (muito altas entre variáveis independentes)
            suspicious_correlations = []
            
            for i, var1 in enumerate(correlation_matrix.columns):
                for j, var2 in enumerate(correlation_matrix.columns):
                    if i < j:  # Evitar duplicatas
                        corr_value = correlation_matrix.loc[var1, var2]
                        
                        # Correlações muito altas (>0.95) entre variáveis diferentes podem indicar erro
                        if abs(corr_value) > 0.95 and var1 != var2:
                            suspicious_correlations.append((var1, var2, corr_value))
            
            if suspicious_correlations:
                results.append(ValidationResult(
                    rule_name="suspicious_correlations",
                    status=ValidationStatus.WARNING,
                    message=f"{len(suspicious_correlations)} correlações suspeitas detectadas",
                    details={"correlations": [(v1, v2, float(corr)) for v1, v2, corr in suspicious_correlations]}
                ))
            else:
                results.append(ValidationResult(
                    rule_name="suspicious_correlations",
                    status=ValidationStatus.PASSED,
                    message="Nenhuma correlação suspeita detectada"
                ))
            
        except Exception as e:
            results.append(ValidationResult(
                rule_name="correlation_validation",
                status=ValidationStatus.ERROR,
                message=f"Erro na validação de correlações: {str(e)}"
            ))
        
        return results
    
    def _validate_statistical_outliers(self, data_dict: Dict[str, np.ndarray]) -> List[ValidationResult]:
        """Valida outliers estatísticos"""
        results = []
        
        for var_name, values in data_dict.items():
            try:
                clean_values = values[~np.isnan(values)]
                
                if len(clean_values) < 10:  # Poucos dados para análise estatística
                    continue
                
                # Método IQR para detectar outliers
                q1 = np.percentile(clean_values, 25)
                q3 = np.percentile(clean_values, 75)
                iqr = q3 - q1
                
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                
                outliers = ((clean_values < lower_bound) | (clean_values > upper_bound)).sum()
                outlier_percent = (outliers / len(clean_values)) * 100
                
                if outlier_percent > 10:  # Mais de 10% outliers
                    results.append(ValidationResult(
                        rule_name=f"{var_name}_outliers",
                        status=ValidationStatus.WARNING,
                        message=f"Variável {var_name}: {outliers} outliers detectados ({outlier_percent:.1f}%)",
                        details={
                            "outlier_count": int(outliers),
                            "outlier_percent": outlier_percent,
                            "iqr_bounds": [float(lower_bound), float(upper_bound)]
                        }
                    ))
                else:
                    results.append(ValidationResult(
                        rule_name=f"{var_name}_outliers",
                        status=ValidationStatus.PASSED,
                        message=f"Variável {var_name}: poucos outliers ({outlier_percent:.1f}%)"
                    ))
                    
            except Exception as e:
                results.append(ValidationResult(
                    rule_name=f"{var_name}_outlier_validation",
                    status=ValidationStatus.ERROR,
                    message=f"Erro na validação de outliers para {var_name}: {str(e)}"
                ))
        
        return results
    
    def _find_variable_key(self, var_name: str) -> Optional[str]:
        """Encontra a chave da variável nos ranges válidos"""
        var_name_lower = var_name.lower()
        
        for key in self.valid_ranges.keys():
            if key in var_name_lower or any(part in var_name_lower for part in key.split('_')):
                return key
        
        return None

class DataQualityValidator:
    """Validador principal de qualidade de dados"""
    
    def __init__(self):
        self.geospatial_validator = GeospatialValidator()
        self.temporal_validator = TemporalValidator()
        self.environmental_validator = EnvironmentalValidator()
        
        # Schemas de validação
        self.schemas = self._load_validation_schemas()
    
    def _load_validation_schemas(self) -> Dict[str, Dict]:
        """Carrega schemas de validação"""
        
        # Schema básico para dados de pesca
        fishing_schema = {
            'name': {'type': 'string', 'required': True, 'empty': False},
            'type': {'type': 'string', 'allowed': ['porto', 'vila', 'infraestrutura']},
            'population': {'type': 'integer', 'min': 0, 'max': 1000000},
            'capacity': {'type': 'integer', 'min': 0},
            'zone': {'type': 'string', 'allowed': ['Norte', 'Centro', 'Sul']},
            'coordinates': {'type': 'list', 'schema': {'type': 'float'}, 'minlength': 2, 'maxlength': 2}
        }
        
        # Schema para dados ambientais
        environmental_schema = {
            'timestamp': {'type': 'datetime', 'required': True},
            'latitude': {'type': 'float', 'min': -90, 'max': 90, 'required': True},
            'longitude': {'type': 'float', 'min': -180, 'max': 180, 'required': True},
            'chlorophyll_a': {'type': 'float', 'min': 0, 'max': 50, 'nullable': True},
            'sea_surface_temperature': {'type': 'float', 'min': -2, 'max': 35, 'nullable': True},
            'salinity': {'type': 'float', 'min': 0, 'max': 50, 'nullable': True}
        }
        
        return {
            'fishing': fishing_schema,
            'environmental': environmental_schema
        }
    
    async def validate_data(self, 
                           data: Union[pd.DataFrame, gpd.GeoDataFrame, xr.Dataset], 
                           data_type: str = "generic",
                           validation_level: ValidationLevel = ValidationLevel.STANDARD) -> DataQualityReport:
        """Valida qualidade dos dados"""
        
        logger.info(f"Iniciando validação de dados: tipo={data_type}, nível={validation_level.value}")
        
        all_results = []
        metadata = {
            'data_type': data_type,
            'data_shape': str(data.shape) if hasattr(data, 'shape') else 'N/A',
            'data_size': len(data) if hasattr(data, '__len__') else 'N/A',
            'validation_level': validation_level.value
        }
        
        try:
            # Validação básica sempre executada
            basic_results = await self._run_basic_validation(data, data_type)
            all_results.extend(basic_results)
            
            if validation_level in [ValidationLevel.STANDARD, ValidationLevel.COMPREHENSIVE, ValidationLevel.STRICT]:
                # Validação geoespacial
                if isinstance(data, (pd.DataFrame, gpd.GeoDataFrame)):
                    geo_results = self.geospatial_validator.validate_coordinates(data)
                    all_results.extend(geo_results)
                    
                    if isinstance(data, gpd.GeoDataFrame):
                        geom_results = self.geospatial_validator.validate_geometry(data)
                        all_results.extend(geom_results)
                
                # Validação temporal
                temporal_results = self.temporal_validator.validate_temporal_data(data)
                all_results.extend(temporal_results)
                
                # Validação ambiental
                if data_type in ['environmental', 'oceanographic', 'meteorological']:
                    env_results = self.environmental_validator.validate_environmental_data(data)
                    all_results.extend(env_results)
            
            if validation_level in [ValidationLevel.COMPREHENSIVE, ValidationLevel.STRICT]:
                # Validações avançadas
                advanced_results = await self._run_advanced_validation(data, data_type)
                all_results.extend(advanced_results)
            
            if validation_level == ValidationLevel.STRICT:
                # Validações rigorosas
                strict_results = await self._run_strict_validation(data, data_type)
                all_results.extend(strict_results)
            
            # Calcular métricas do relatório
            passed = sum(1 for r in all_results if r.status == ValidationStatus.PASSED)
            warnings = sum(1 for r in all_results if r.status == ValidationStatus.WARNING)
            failed = sum(1 for r in all_results if r.status == ValidationStatus.FAILED)
            errors = sum(1 for r in all_results if r.status == ValidationStatus.ERROR)
            
            # Calcular score geral
            total_rules = len(all_results)
            if total_rules > 0:
                score_weights = {
                    ValidationStatus.PASSED: 1.0,
                    ValidationStatus.WARNING: 0.7,
                    ValidationStatus.FAILED: 0.0,
                    ValidationStatus.ERROR: 0.0
                }
                overall_score = sum(score_weights[r.status] for r in all_results) / total_rules * 100
            else:
                overall_score = 0.0
            
            # Criar relatório
            report = DataQualityReport(
                data_source=data_type,
                validation_level=validation_level,
                overall_score=overall_score,
                total_rules=total_rules,
                passed=passed,
                warnings=warnings,
                failed=failed,
                errors=errors,
                results=all_results,
                metadata=metadata
            )
            
            logger.info(f"✅ Validação concluída: score={overall_score:.1f}%, {passed}/{total_rules} regras aprovadas")
            return report
            
        except Exception as e:
            logger.error(f"Erro na validação de dados: {e}")
            
            # Retornar relatório de erro
            error_result = ValidationResult(
                rule_name="validation_process",
                status=ValidationStatus.ERROR,
                message=f"Erro no processo de validação: {str(e)}"
            )
            
            return DataQualityReport(
                data_source=data_type,
                validation_level=validation_level,
                overall_score=0.0,
                total_rules=1,
                passed=0,
                warnings=0,
                failed=0,
                errors=1,
                results=[error_result],
                metadata=metadata
            )
    
    async def _run_basic_validation(self, data: Any, data_type: str) -> List[ValidationResult]:
        """Executa validações básicas"""
        results = []
        
        try:
            # Verificar se dados não estão vazios
            if hasattr(data, '__len__') and len(data) == 0:
                results.append(ValidationResult(
                    rule_name="data_not_empty",
                    status=ValidationStatus.FAILED,
                    message="Dataset está vazio"
                ))
            else:
                results.append(ValidationResult(
                    rule_name="data_not_empty",
                    status=ValidationStatus.PASSED,
                    message=f"Dataset contém {len(data) if hasattr(data, '__len__') else 'N/A'} registros"
                ))
            
            # Verificar estrutura básica
            if isinstance(data, pd.DataFrame):
                if len(data.columns) == 0:
                    results.append(ValidationResult(
                        rule_name="data_structure",
                        status=ValidationStatus.FAILED,
                        message="DataFrame não possui colunas"
                    ))
                else:
                    results.append(ValidationResult(
                        rule_name="data_structure",
                        status=ValidationStatus.PASSED,
                        message=f"DataFrame com {len(data.columns)} colunas"
                    ))
            
            elif isinstance(data, xr.Dataset):
                if len(data.data_vars) == 0:
                    results.append(ValidationResult(
                        rule_name="data_structure",
                        status=ValidationStatus.FAILED,
                        message="Dataset não possui variáveis"
                    ))
                else:
                    results.append(ValidationResult(
                        rule_name="data_structure",
                        status=ValidationStatus.PASSED,
                        message=f"Dataset com {len(data.data_vars)} variáveis"
                    ))
            
        except Exception as e:
            results.append(ValidationResult(
                rule_name="basic_validation",
                status=ValidationStatus.ERROR,
                message=f"Erro na validação básica: {str(e)}"
            ))
        
        return results
    
    async def _run_advanced_validation(self, data: Any, data_type: str) -> List[ValidationResult]:
        """Executa validações avançadas"""
        results = []
        
        try:
            # Validação de schema se disponível
            if data_type in self.schemas and isinstance(data, pd.DataFrame):
                schema_results = self._validate_schema(data, self.schemas[data_type])
                results.extend(schema_results)
            
            # Validação de consistência de dados
            consistency_results = self._validate_data_consistency(data)
            results.extend(consistency_results)
            
        except Exception as e:
            results.append(ValidationResult(
                rule_name="advanced_validation",
                status=ValidationStatus.ERROR,
                message=f"Erro na validação avançada: {str(e)}"
            ))
        
        return results
    
    async def _run_strict_validation(self, data: Any, data_type: str) -> List[ValidationResult]:
        """Executa validações rigorosas"""
        results = []
        
        try:
            # Validações estatísticas rigorosas
            if isinstance(data, pd.DataFrame):
                numeric_cols = data.select_dtypes(include=[np.number]).columns
                
                for col in numeric_cols:
                    # Teste de normalidade
                    if len(data[col].dropna()) > 8:  # Mínimo para teste
                        _, p_value = stats.shapiro(data[col].dropna().sample(min(5000, len(data[col].dropna()))))
                        
                        if p_value < 0.05:
                            results.append(ValidationResult(
                                rule_name=f"{col}_normality",
                                status=ValidationStatus.WARNING,
                                message=f"Coluna {col}: distribuição não normal (p={p_value:.4f})",
                                details={"p_value": float(p_value)}
                            ))
                        else:
                            results.append(ValidationResult(
                                rule_name=f"{col}_normality",
                                status=ValidationStatus.PASSED,
                                message=f"Coluna {col}: distribuição aproximadamente normal"
                            ))
            
        except Exception as e:
            results.append(ValidationResult(
                rule_name="strict_validation",
                status=ValidationStatus.ERROR,
                message=f"Erro na validação rigorosa: {str(e)}"
            ))
        
        return results
    
    def _validate_schema(self, data: pd.DataFrame, schema: Dict) -> List[ValidationResult]:
        """Valida dados contra schema"""
        results = []
        
        try:
            validator = Validator(schema)
            
            # Validar cada linha (sample para performance)
            sample_size = min(100, len(data))
            sample_data = data.sample(sample_size) if len(data) > sample_size else data
            
            validation_errors = []
            
            for idx, row in sample_data.iterrows():
                row_dict = row.to_dict()
                if not validator.validate(row_dict):
                    validation_errors.extend(list(validator.errors.keys()))
            
            if validation_errors:
                error_counts = pd.Series(validation_errors).value_counts()
                results.append(ValidationResult(
                    rule_name="schema_validation",
                    status=ValidationStatus.FAILED,
                    message=f"Erros de schema encontrados: {dict(error_counts)}",
                    details={"error_counts": error_counts.to_dict()}
                ))
            else:
                results.append(ValidationResult(
                    rule_name="schema_validation",
                    status=ValidationStatus.PASSED,
                    message="Dados conformes ao schema"
                ))
                
        except Exception as e:
            results.append(ValidationResult(
                rule_name="schema_validation",
                status=ValidationStatus.ERROR,
                message=f"Erro na validação de schema: {str(e)}"
            ))
        
        return results
    
    def _validate_data_consistency(self, data: Any) -> List[ValidationResult]:
        """Valida consistência dos dados"""
        results = []
        
        try:
            if isinstance(data, pd.DataFrame):
                # Verificar valores únicos em colunas que deveriam ser únicas
                for col in data.columns:
                    if 'id' in col.lower() or 'name' in col.lower():
                        duplicates = data[col].duplicated().sum()
                        if duplicates > 0:
                            results.append(ValidationResult(
                                rule_name=f"{col}_uniqueness",
                                status=ValidationStatus.WARNING,
                                message=f"Coluna {col}: {duplicates} valores duplicados",
                                details={"duplicate_count": int(duplicates)}
                            ))
                        else:
                            results.append(ValidationResult(
                                rule_name=f"{col}_uniqueness",
                                status=ValidationStatus.PASSED,
                                message=f"Coluna {col}: todos os valores são únicos"
                            ))
            
        except Exception as e:
            results.append(ValidationResult(
                rule_name="consistency_validation",
                status=ValidationStatus.ERROR,
                message=f"Erro na validação de consistência: {str(e)}"
            ))
        
        return results
    
    def export_report(self, report: DataQualityReport, output_path: str = None) -> str:
        """Exporta relatório de qualidade"""
        
        if output_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"reports/data_quality_report_{timestamp}.json"
        
        # Converter para dicionário serializável
        report_dict = asdict(report)
        
        # Converter enums para strings
        report_dict['validation_level'] = report_dict['validation_level'].value
        for result in report_dict['results']:
            result['status'] = result['status'].value
        
        # Salvar relatório
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report_dict, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info(f"✅ Relatório de qualidade exportado: {output_file}")
        return str(output_file)

# Exemplo de uso
async def main():
    """Exemplo de uso do sistema de validação"""
    
    # Criar dados de exemplo
    sample_data = pd.DataFrame({
        'name': ['Porto Luanda', 'Vila Mussulo', 'Porto Benguela'],
        'type': ['porto', 'vila', 'porto'],
        'latitude': [-8.8383, -9.1167, -12.5756],
        'longitude': [13.2317, 13.1833, 13.4049],
        'population': [12000, 3200, 7800],
        'timestamp': pd.date_range('2024-01-01', periods=3, freq='D'),
        'chlorophyll_a': [0.8, 1.2, 0.6],
        'sea_surface_temperature': [25.5, 24.8, 26.2]
    })
    
    # Inicializar validador
    validator = DataQualityValidator()
    
    # Executar validação
    print("🔍 Executando validação de qualidade dos dados...")
    
    report = await validator.validate_data(
        sample_data, 
        data_type="fishing",
        validation_level=ValidationLevel.COMPREHENSIVE
    )
    
    # Exibir resultados
    print(f"\n📊 RELATÓRIO DE QUALIDADE DOS DADOS")
    print(f"{'='*50}")
    print(f"Score Geral: {report.overall_score:.1f}%")
    print(f"Total de Regras: {report.total_rules}")
    print(f"✅ Aprovadas: {report.passed}")
    print(f"⚠️ Avisos: {report.warnings}")
    print(f"❌ Falharam: {report.failed}")
    print(f"🔥 Erros: {report.errors}")
    
    print(f"\n📋 DETALHES DAS VALIDAÇÕES:")
    for result in report.results:
        status_icon = {
            ValidationStatus.PASSED: "✅",
            ValidationStatus.WARNING: "⚠️",
            ValidationStatus.FAILED: "❌",
            ValidationStatus.ERROR: "🔥"
        }[result.status]
        
        print(f"{status_icon} {result.rule_name}: {result.message}")
    
    # Exportar relatório
    report_path = validator.export_report(report)
    print(f"\n💾 Relatório exportado: {report_path}")

if __name__ == "__main__":
    asyncio.run(main())
