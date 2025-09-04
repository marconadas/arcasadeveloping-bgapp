#!/usr/bin/env python3
"""
Sistema de Filtros Preditivos para Mapas
Gera automaticamente filtros e pontos nos mapas baseados em modelos de ML
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import json
import numpy as np
import pandas as pd
from pathlib import Path

import asyncpg
from shapely.geometry import Point, Polygon
from shapely.ops import unary_union
import geopandas as gpd

from ..models.biodiversity_ml_schemas import PredictionResultSchema, MLModelStatus
from ..core.secure_config import DatabaseSettings

logger = logging.getLogger(__name__)

class FilterType(str, Enum):
    """Tipos de filtros preditivos"""
    BIODIVERSITY_HOTSPOTS = "biodiversity_hotspots"
    SPECIES_PRESENCE = "species_presence"
    HABITAT_SUITABILITY = "habitat_suitability"
    CONSERVATION_PRIORITY = "conservation_priority"
    FISHING_ZONES = "fishing_zones"
    MONITORING_POINTS = "monitoring_points"
    RISK_AREAS = "risk_areas"

class PredictionConfidence(str, Enum):
    """Níveis de confiança das predições"""
    HIGH = "high"      # > 0.8
    MEDIUM = "medium"  # 0.6 - 0.8
    LOW = "low"        # 0.4 - 0.6
    VERY_LOW = "very_low"  # < 0.4

@dataclass
class MapFilter:
    """Filtro para mapas baseado em predições"""
    filter_id: str
    name: str
    filter_type: FilterType
    description: str
    model_id: str
    
    # Critérios de filtragem
    min_confidence: float = 0.6
    max_age_hours: int = 72  # Máximo 3 dias
    
    # Configuração geográfica
    bbox: Optional[Tuple[float, float, float, float]] = None  # (min_lon, min_lat, max_lon, max_lat)
    grid_resolution: float = 0.01  # Resolução da grade em graus
    
    # Configuração de visualização
    color_scheme: str = "viridis"
    opacity: float = 0.7
    show_confidence: bool = True
    
    # Metadados
    created_at: datetime = None
    last_updated: datetime = None
    is_active: bool = True

@dataclass
class PredictivePoint:
    """Ponto preditivo no mapa"""
    point_id: str
    latitude: float
    longitude: float
    prediction_value: Any
    confidence: float
    model_type: str
    
    # Contexto
    area_name: Optional[str] = None
    habitat_type: Optional[str] = None
    
    # Metadados
    predicted_at: datetime = None
    expires_at: Optional[datetime] = None
    
    # Visualização
    marker_color: str = "#3388ff"
    marker_size: int = 10
    popup_content: Optional[str] = None

class PredictiveFilterManager:
    """Gerenciador de filtros preditivos"""
    
    def __init__(self, db_settings: DatabaseSettings):
        self.db_settings = db_settings
        self.logger = logging.getLogger(__name__)
        
        # Cache de filtros ativos
        self._active_filters: Dict[str, MapFilter] = {}
        self._prediction_cache: Dict[str, List[PredictivePoint]] = {}
        
        # Configurações
        self.default_grid_resolution = 0.01  # ~1km
        self.max_predictions_per_filter = 1000
        self.cache_ttl_hours = 6
        
        # Área de interesse padrão (Angola)
        self.default_bbox = (-18.0, -18.0, 12.0, -5.0)  # (min_lon, min_lat, max_lon, max_lat)
    
    async def create_filter(self, filter_config: Dict[str, Any]) -> MapFilter:
        """Cria um novo filtro preditivo"""
        try:
            map_filter = MapFilter(
                filter_id=filter_config.get("filter_id", f"filter_{datetime.now().strftime('%Y%m%d_%H%M%S')}"),
                name=filter_config["name"],
                filter_type=FilterType(filter_config["filter_type"]),
                description=filter_config.get("description", ""),
                model_id=filter_config["model_id"],
                min_confidence=filter_config.get("min_confidence", 0.6),
                max_age_hours=filter_config.get("max_age_hours", 72),
                bbox=filter_config.get("bbox", self.default_bbox),
                grid_resolution=filter_config.get("grid_resolution", self.default_grid_resolution),
                color_scheme=filter_config.get("color_scheme", "viridis"),
                opacity=filter_config.get("opacity", 0.7),
                show_confidence=filter_config.get("show_confidence", True),
                created_at=datetime.now(),
                last_updated=datetime.now(),
                is_active=True
            )
            
            # Salvar na base de dados
            await self._save_filter_to_db(map_filter)
            
            # Adicionar ao cache
            self._active_filters[map_filter.filter_id] = map_filter
            
            # Gerar predições iniciais
            await self._generate_filter_predictions(map_filter)
            
            self.logger.info(f"✅ Filtro criado: {map_filter.name} ({map_filter.filter_id})")
            return map_filter
            
        except Exception as e:
            self.logger.error(f"❌ Erro criando filtro: {e}")
            raise
    
    async def _save_filter_to_db(self, map_filter: MapFilter):
        """Salva filtro na base de dados"""
        conn = await asyncpg.connect(self.db_settings.postgres_url)
        
        try:
            # Criar tabela se não existir
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS map_filters (
                    filter_id VARCHAR(100) PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    filter_type VARCHAR(50) NOT NULL,
                    description TEXT,
                    model_id VARCHAR(50) NOT NULL,
                    min_confidence DECIMAL(3, 2),
                    max_age_hours INTEGER,
                    bbox JSONB,
                    grid_resolution DECIMAL(8, 6),
                    color_scheme VARCHAR(50),
                    opacity DECIMAL(3, 2),
                    show_confidence BOOLEAN,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE
                )
            """)
            
            # Inserir filtro
            await conn.execute("""
                INSERT INTO map_filters (
                    filter_id, name, filter_type, description, model_id,
                    min_confidence, max_age_hours, bbox, grid_resolution,
                    color_scheme, opacity, show_confidence, created_at, last_updated, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT (filter_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    last_updated = CURRENT_TIMESTAMP
            """, 
            map_filter.filter_id, map_filter.name, map_filter.filter_type.value,
            map_filter.description, map_filter.model_id, map_filter.min_confidence,
            map_filter.max_age_hours, json.dumps(map_filter.bbox), map_filter.grid_resolution,
            map_filter.color_scheme, map_filter.opacity, map_filter.show_confidence,
            map_filter.created_at, map_filter.last_updated, map_filter.is_active)
            
        finally:
            await conn.close()
    
    async def _generate_filter_predictions(self, map_filter: MapFilter):
        """Gera predições para um filtro"""
        try:
            conn = await asyncpg.connect(self.db_settings.postgres_url)
            
            try:
                # Obter predições recentes do modelo
                cutoff_time = datetime.now() - timedelta(hours=map_filter.max_age_hours)
                
                query = """
                SELECT prediction_id, latitude, longitude, prediction, confidence, 
                       prediction_timestamp, area_name
                FROM prediction_results 
                WHERE model_id = $1 
                AND prediction_timestamp > $2
                AND confidence >= $3
                AND latitude BETWEEN $4 AND $5
                AND longitude BETWEEN $6 AND $7
                ORDER BY confidence DESC, prediction_timestamp DESC
                LIMIT $8
                """
                
                bbox = map_filter.bbox
                predictions = await conn.fetch(
                    query,
                    map_filter.model_id,
                    cutoff_time,
                    map_filter.min_confidence,
                    bbox[1], bbox[3],  # min_lat, max_lat
                    bbox[0], bbox[2],  # min_lon, max_lon
                    self.max_predictions_per_filter
                )
                
                # Converter para pontos preditivos
                predictive_points = []
                for pred in predictions:
                    point = PredictivePoint(
                        point_id=pred['prediction_id'],
                        latitude=pred['latitude'],
                        longitude=pred['longitude'],
                        prediction_value=json.loads(pred['prediction']) if isinstance(pred['prediction'], str) else pred['prediction'],
                        confidence=float(pred['confidence']),
                        model_type=map_filter.filter_type.value,
                        area_name=pred.get('area_name'),
                        predicted_at=pred['prediction_timestamp'],
                        expires_at=pred['prediction_timestamp'] + timedelta(hours=map_filter.max_age_hours)
                    )
                    
                    # Configurar visualização
                    point.marker_color = self._get_marker_color(point.confidence, map_filter.color_scheme)
                    point.marker_size = self._get_marker_size(point.confidence)
                    point.popup_content = self._generate_popup_content(point, map_filter)
                    
                    predictive_points.append(point)
                
                # Armazenar no cache
                self._prediction_cache[map_filter.filter_id] = predictive_points
                
                self.logger.info(f"📍 Geradas {len(predictive_points)} predições para filtro {map_filter.name}")
                
            finally:
                await conn.close()
                
        except Exception as e:
            self.logger.error(f"❌ Erro gerando predições para filtro {map_filter.filter_id}: {e}")
            raise
    
    def _get_marker_color(self, confidence: float, color_scheme: str) -> str:
        """Determina cor do marcador baseada na confiança"""
        if color_scheme == "confidence":
            if confidence >= 0.8:
                return "#00ff00"  # Verde para alta confiança
            elif confidence >= 0.6:
                return "#ffff00"  # Amarelo para média confiança
            else:
                return "#ff0000"  # Vermelho para baixa confiança
        
        elif color_scheme == "viridis":
            # Escala viridis simplificada
            if confidence >= 0.8:
                return "#440154"  # Roxo escuro
            elif confidence >= 0.6:
                return "#31688e"  # Azul
            elif confidence >= 0.4:
                return "#35b779"  # Verde
            else:
                return "#fde725"  # Amarelo
        
        else:
            return "#3388ff"  # Azul padrão
    
    def _get_marker_size(self, confidence: float) -> int:
        """Determina tamanho do marcador baseado na confiança"""
        if confidence >= 0.9:
            return 15
        elif confidence >= 0.8:
            return 12
        elif confidence >= 0.6:
            return 10
        else:
            return 8
    
    def _generate_popup_content(self, point: PredictivePoint, map_filter: MapFilter) -> str:
        """Gera conteúdo do popup para um ponto"""
        confidence_pct = point.confidence * 100
        
        content = f"""
        <div class="prediction-popup">
            <h4>{map_filter.name}</h4>
            <p><strong>Predição:</strong> {point.prediction_value}</p>
            <p><strong>Confiança:</strong> {confidence_pct:.1f}%</p>
            <p><strong>Coordenadas:</strong> {point.latitude:.4f}, {point.longitude:.4f}</p>
        """
        
        if point.area_name:
            content += f"<p><strong>Área:</strong> {point.area_name}</p>"
        
        if point.predicted_at:
            content += f"<p><strong>Predito em:</strong> {point.predicted_at.strftime('%d/%m/%Y %H:%M')}</p>"
        
        content += "</div>"
        return content
    
    async def get_filter_data_for_map(self, filter_id: str) -> Dict[str, Any]:
        """Obtém dados do filtro formatados para o mapa"""
        try:
            if filter_id not in self._active_filters:
                await self._load_filter_from_db(filter_id)
            
            if filter_id not in self._active_filters:
                raise ValueError(f"Filtro {filter_id} não encontrado")
            
            map_filter = self._active_filters[filter_id]
            
            # Verificar se as predições estão em cache e são recentes
            if (filter_id not in self._prediction_cache or 
                map_filter.last_updated < datetime.now() - timedelta(hours=self.cache_ttl_hours)):
                await self._generate_filter_predictions(map_filter)
            
            points = self._prediction_cache.get(filter_id, [])
            
            # Converter para formato GeoJSON
            geojson_features = []
            for point in points:
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [point.longitude, point.latitude]
                    },
                    "properties": {
                        "point_id": point.point_id,
                        "prediction": point.prediction_value,
                        "confidence": point.confidence,
                        "model_type": point.model_type,
                        "area_name": point.area_name,
                        "predicted_at": point.predicted_at.isoformat() if point.predicted_at else None,
                        "marker_color": point.marker_color,
                        "marker_size": point.marker_size,
                        "popup_content": point.popup_content
                    }
                }
                geojson_features.append(feature)
            
            return {
                "filter_id": filter_id,
                "name": map_filter.name,
                "type": map_filter.filter_type.value,
                "description": map_filter.description,
                "total_points": len(points),
                "last_updated": map_filter.last_updated.isoformat(),
                "geojson": {
                    "type": "FeatureCollection",
                    "features": geojson_features
                },
                "style": {
                    "color_scheme": map_filter.color_scheme,
                    "opacity": map_filter.opacity,
                    "show_confidence": map_filter.show_confidence
                }
            }
            
        except Exception as e:
            self.logger.error(f"❌ Erro obtendo dados do filtro {filter_id}: {e}")
            raise
    
    async def _load_filter_from_db(self, filter_id: str):
        """Carrega filtro da base de dados"""
        conn = await asyncpg.connect(self.db_settings.postgres_url)
        
        try:
            row = await conn.fetchrow(
                "SELECT * FROM map_filters WHERE filter_id = $1 AND is_active = TRUE",
                filter_id
            )
            
            if row:
                map_filter = MapFilter(
                    filter_id=row['filter_id'],
                    name=row['name'],
                    filter_type=FilterType(row['filter_type']),
                    description=row['description'],
                    model_id=row['model_id'],
                    min_confidence=float(row['min_confidence']),
                    max_age_hours=row['max_age_hours'],
                    bbox=json.loads(row['bbox']) if row['bbox'] else self.default_bbox,
                    grid_resolution=float(row['grid_resolution']),
                    color_scheme=row['color_scheme'],
                    opacity=float(row['opacity']),
                    show_confidence=row['show_confidence'],
                    created_at=row['created_at'],
                    last_updated=row['last_updated'],
                    is_active=row['is_active']
                )
                
                self._active_filters[filter_id] = map_filter
                
        finally:
            await conn.close()
    
    async def update_filter_predictions(self, filter_id: Optional[str] = None):
        """Atualiza predições de um filtro específico ou todos"""
        try:
            if filter_id:
                if filter_id in self._active_filters:
                    await self._generate_filter_predictions(self._active_filters[filter_id])
                else:
                    self.logger.warning(f"Filtro {filter_id} não encontrado")
            else:
                # Atualizar todos os filtros ativos
                for map_filter in self._active_filters.values():
                    await self._generate_filter_predictions(map_filter)
                    
            self.logger.info(f"✅ Predições atualizadas para {'filtro ' + filter_id if filter_id else 'todos os filtros'}")
            
        except Exception as e:
            self.logger.error(f"❌ Erro atualizando predições: {e}")
            raise
    
    async def get_available_filters(self) -> List[Dict[str, Any]]:
        """Obtém lista de filtros disponíveis"""
        try:
            conn = await asyncpg.connect(self.db_settings.postgres_url)
            
            try:
                rows = await conn.fetch("""
                    SELECT filter_id, name, filter_type, description, 
                           last_updated, is_active
                    FROM map_filters 
                    ORDER BY last_updated DESC
                """)
                
                filters = []
                for row in rows:
                    # Contar pontos no cache
                    point_count = len(self._prediction_cache.get(row['filter_id'], []))
                    
                    filters.append({
                        "filter_id": row['filter_id'],
                        "name": row['name'],
                        "type": row['filter_type'],
                        "description": row['description'],
                        "last_updated": row['last_updated'].isoformat(),
                        "is_active": row['is_active'],
                        "point_count": point_count
                    })
                
                return filters
                
            finally:
                await conn.close()
                
        except Exception as e:
            self.logger.error(f"❌ Erro obtendo filtros disponíveis: {e}")
            return []
    
    async def create_default_filters(self):
        """Cria filtros padrão do sistema"""
        default_filters = [
            {
                "filter_id": "biodiversity_hotspots",
                "name": "Hotspots de Biodiversidade",
                "filter_type": "biodiversity_hotspots",
                "description": "Áreas com alta diversidade de espécies prevista",
                "model_id": "biodiversity_predictor",
                "min_confidence": 0.8,
                "color_scheme": "viridis"
            },
            {
                "filter_id": "conservation_priority",
                "name": "Áreas Prioritárias para Conservação",
                "filter_type": "conservation_priority", 
                "description": "Áreas identificadas como prioritárias para conservação",
                "model_id": "habitat_suitability",
                "min_confidence": 0.75,
                "color_scheme": "confidence"
            },
            {
                "filter_id": "monitoring_points",
                "name": "Pontos de Monitorização Recomendados",
                "filter_type": "monitoring_points",
                "description": "Locais recomendados para instalação de equipamentos de monitorização",
                "model_id": "biodiversity_predictor",
                "min_confidence": 0.7,
                "max_age_hours": 168,  # 1 semana
                "color_scheme": "viridis"
            }
        ]
        
        for filter_config in default_filters:
            try:
                await self.create_filter(filter_config)
            except Exception as e:
                self.logger.warning(f"Filtro padrão {filter_config['name']} já existe ou erro: {e}")
    
    async def get_filter_statistics(self) -> Dict[str, Any]:
        """Obtém estatísticas dos filtros"""
        try:
            conn = await asyncpg.connect(self.db_settings.postgres_url)
            
            try:
                # Estatísticas gerais
                stats = await conn.fetchrow("""
                    SELECT 
                        COUNT(*) as total_filters,
                        COUNT(CASE WHEN is_active THEN 1 END) as active_filters,
                        AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_updated))/3600) as avg_hours_since_update
                    FROM map_filters
                """)
                
                # Estatísticas por tipo
                type_stats = await conn.fetch("""
                    SELECT 
                        filter_type,
                        COUNT(*) as count,
                        COUNT(CASE WHEN is_active THEN 1 END) as active_count
                    FROM map_filters
                    GROUP BY filter_type
                """)
                
                # Total de pontos em cache
                total_cached_points = sum(len(points) for points in self._prediction_cache.values())
                
                return {
                    "general": dict(stats) if stats else {},
                    "by_type": [dict(row) for row in type_stats],
                    "cached_points": total_cached_points,
                    "cache_size": len(self._prediction_cache),
                    "active_filters_in_memory": len(self._active_filters)
                }
                
            finally:
                await conn.close()
                
        except Exception as e:
            self.logger.error(f"❌ Erro obtendo estatísticas: {e}")
            return {"error": str(e)}

# Função auxiliar para inicializar o sistema
async def initialize_predictive_filters(db_settings: DatabaseSettings) -> PredictiveFilterManager:
    """Inicializa o sistema de filtros preditivos"""
    manager = PredictiveFilterManager(db_settings)
    
    # Criar filtros padrão
    await manager.create_default_filters()
    
    logger.info("✅ Sistema de filtros preditivos inicializado")
    return manager
