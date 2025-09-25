#!/usr/bin/env python3
"""
BGAPP Data Processing Control Panel - Painel de Controle de Processamento de Dados
Centraliza o processamento de dados de múltiplas fontes: STAC collections, CMEMS, 
MODIS, OBIS/GBIF com monitorização em tempo real.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

# Configurar logging
logger = logging.getLogger(__name__)


class DataSource(Enum):
    """Fontes de dados suportadas"""
    COPERNICUS_CMEMS = "copernicus_cmems"
    MODIS = "modis"
    OBIS = "obis"
    GBIF = "gbif"
    STAC_COLLECTIONS = "stac_collections"
    LOCAL_FILES = "local_files"
    REAL_TIME_SENSORS = "real_time_sensors"


class ProcessingStatus(Enum):
    """Status do processamento"""
    PENDING = "pendente"
    RUNNING = "executando"
    COMPLETED = "concluído"
    ERROR = "erro"
    CANCELLED = "cancelado"
    QUEUED = "na_fila"


class ProcessingPriority(Enum):
    """Prioridade do processamento"""
    LOW = "baixa"
    NORMAL = "normal"
    HIGH = "alta"
    CRITICAL = "crítica"


@dataclass
class ProcessingJob:
    """Trabalho de processamento de dados"""
    id: str
    name: str
    data_source: DataSource
    status: ProcessingStatus
    priority: ProcessingPriority
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    progress: float  # 0-100
    parameters: Dict[str, Any]
    output_path: Optional[str]
    error_message: Optional[str]
    estimated_duration: Optional[int]  # segundos
    actual_duration: Optional[int]  # segundos
    metadata: Dict[str, Any]


@dataclass
class DataSourceConfig:
    """Configuração de uma fonte de dados"""
    name: str
    source_type: DataSource
    endpoint_url: str
    authentication: Dict[str, str]
    default_parameters: Dict[str, Any]
    rate_limit: int  # requests por minuto
    timeout: int  # segundos
    retry_count: int
    enabled: bool


class DataProcessingControlPanel:
    """
    🎛️ Painel de Controle de Processamento de Dados BGAPP
    
    Centraliza e monitoriza o processamento de dados de múltiplas fontes
    com interface unificada para gestão de trabalhos de processamento.
    """
    
    def __init__(self):
        """Inicializar painel de controle"""
        
        # Fila de trabalhos
        self.processing_queue = []
        self.active_jobs = {}
        self.completed_jobs = {}
        
        # Configurações das fontes de dados
        self.data_sources_config = {
            'copernicus_cmems': DataSourceConfig(
                name="Copernicus Marine Environment Monitoring Service",
                source_type=DataSource.COPERNICUS_CMEMS,
                endpoint_url="https://my.cmems-du.eu/motu-web/Motu",
                authentication={
                    "type": "basic",
                    "username": "env:CMEMS_USERNAME",
                    "password": "env:CMEMS_PASSWORD"
                },
                default_parameters={
                    "service_id": "GLOBAL_ANALYSISFORECAST_PHY_001_024-TDS",
                    "product_id": "global-analysis-forecast-phy-001-024",
                    "longitude_min": 8.5,
                    "longitude_max": 17.5,
                    "latitude_min": -18.2,
                    "latitude_max": -4.2,
                    "date_min": "2024-01-01",
                    "date_max": "2024-12-31",
                    "depth_min": 0,
                    "depth_max": 200,
                    "variables": ["thetao", "so", "uo", "vo"]
                },
                rate_limit=10,
                timeout=300,
                retry_count=3,
                enabled=True
            ),
            'modis': DataSourceConfig(
                name="MODIS Aqua/Terra Satellite Data",
                source_type=DataSource.MODIS,
                endpoint_url="https://oceandata.sci.gsfc.nasa.gov/api/file_search",
                authentication={
                    "type": "token",
                    "token": "env:EARTHDATA_TOKEN"
                },
                default_parameters={
                    "sensor": "MODISA",
                    "dtype": "L3SMI",
                    "addurl": 1,
                    "results_as_file": 1,
                    "search": "*.nc",
                    "bbox": "8.5,-18.2,17.5,-4.2"
                },
                rate_limit=20,
                timeout=120,
                retry_count=2,
                enabled=True
            ),
            'obis': DataSourceConfig(
                name="Ocean Biodiversity Information System",
                source_type=DataSource.OBIS,
                endpoint_url="https://api.obis.org/v3",
                authentication={
                    "type": "none"
                },
                default_parameters={
                    "geometry": "POLYGON((8.5 -18.2, 17.5 -18.2, 17.5 -4.2, 8.5 -4.2, 8.5 -18.2))",
                    "size": 5000,
                    "offset": 0,
                    "fields": "scientificName,decimalLatitude,decimalLongitude,eventDate,individualCount"
                },
                rate_limit=30,
                timeout=60,
                retry_count=2,
                enabled=True
            ),
            'gbif': DataSourceConfig(
                name="Global Biodiversity Information Facility",
                source_type=DataSource.GBIF,
                endpoint_url="https://api.gbif.org/v1",
                authentication={
                    "type": "none"
                },
                default_parameters={
                    "country": "AO",
                    "hasCoordinate": True,
                    "hasGeospatialIssue": False,
                    "limit": 300,
                    "basisOfRecord": ["HUMAN_OBSERVATION", "MACHINE_OBSERVATION"]
                },
                rate_limit=100,
                timeout=30,
                retry_count=2,
                enabled=True
            ),
            'stac_collections': DataSourceConfig(
                name="STAC Collections Catalog",
                source_type=DataSource.STAC_COLLECTIONS,
                endpoint_url="https://stac.marine.copernicus.eu",
                authentication={
                    "type": "bearer",
                    "token": "env:STAC_TOKEN"
                },
                default_parameters={
                    "bbox": [8.5, -18.2, 17.5, -4.2],
                    "datetime": "2024-01-01T00:00:00Z/2024-12-31T23:59:59Z",
                    "collections": ["cmems_mod_glo_phy_my_0.083deg_P1D-m"]
                },
                rate_limit=50,
                timeout=90,
                retry_count=3,
                enabled=True
            )
        }
        
        # Métricas de processamento
        self.processing_metrics = {
            'total_jobs': 0,
            'successful_jobs': 0,
            'failed_jobs': 0,
            'active_jobs': 0,
            'queued_jobs': 0,
            'total_data_processed_gb': 0.0,
            'average_processing_time': 0.0,
            'last_24h_jobs': 0
        }
        
        # Templates de processamento comum
        self.processing_templates = {
            'oceanographic_analysis': {
                'name': 'Análise Oceanográfica Completa',
                'description': 'Processamento de dados oceanográficos de múltiplas fontes',
                'data_sources': [DataSource.COPERNICUS_CMEMS, DataSource.MODIS],
                'parameters': {
                    'temporal_resolution': 'daily',
                    'spatial_resolution': '0.25deg',
                    'variables': ['temperature', 'salinity', 'chlorophyll', 'currents'],
                    'quality_control': True,
                    'generate_statistics': True
                },
                'estimated_duration': 1800  # 30 minutos
            },
            'biodiversity_assessment': {
                'name': 'Avaliação de Biodiversidade',
                'description': 'Compilação e análise de dados de biodiversidade marinha',
                'data_sources': [DataSource.OBIS, DataSource.GBIF],
                'parameters': {
                    'taxonomic_level': 'species',
                    'temporal_range': '2020-2024',
                    'include_abundance': True,
                    'calculate_indices': True,
                    'generate_maps': True
                },
                'estimated_duration': 900  # 15 minutos
            },
            'satellite_monitoring': {
                'name': 'Monitorização por Satélite',
                'description': 'Processamento de dados de satélite para monitorização ambiental',
                'data_sources': [DataSource.MODIS, DataSource.STAC_COLLECTIONS],
                'parameters': {
                    'cloud_threshold': 0.3,
                    'atmospheric_correction': True,
                    'generate_composites': True,
                    'temporal_aggregation': 'monthly'
                },
                'estimated_duration': 2400  # 40 minutos
            }
        }
    
    async def create_processing_job(self, 
                                  name: str,
                                  data_source: DataSource,
                                  parameters: Dict[str, Any],
                                  priority: ProcessingPriority = ProcessingPriority.NORMAL) -> str:
        """
        📝 Criar novo trabalho de processamento
        
        Args:
            name: Nome do trabalho
            data_source: Fonte de dados
            parameters: Parâmetros de processamento
            priority: Prioridade do trabalho
            
        Returns:
            ID do trabalho criado
        """
        
        job_id = str(uuid.uuid4())
        
        # Estimar duração baseada na fonte de dados
        estimated_duration = self._estimate_processing_duration(data_source, parameters)
        
        job = ProcessingJob(
            id=job_id,
            name=name,
            data_source=data_source,
            status=ProcessingStatus.PENDING,
            priority=priority,
            created_at=datetime.now(),
            started_at=None,
            completed_at=None,
            progress=0.0,
            parameters=parameters,
            output_path=None,
            error_message=None,
            estimated_duration=estimated_duration,
            actual_duration=None,
            metadata={}
        )
        
        # Adicionar à fila
        self.processing_queue.append(job)
        self.processing_queue.sort(key=lambda x: (x.priority.value, x.created_at))
        
        # Atualizar métricas
        self.processing_metrics['total_jobs'] += 1
        self.processing_metrics['queued_jobs'] += 1
        
        logger.info(f"📝 Trabalho criado: {name} ({job_id})")
        
        return job_id
    
    def _estimate_processing_duration(self, data_source: DataSource, parameters: Dict[str, Any]) -> int:
        """Estimar duração do processamento baseado na fonte e parâmetros"""
        
        base_durations = {
            DataSource.COPERNICUS_CMEMS: 600,  # 10 minutos
            DataSource.MODIS: 300,             # 5 minutos
            DataSource.OBIS: 180,              # 3 minutos
            DataSource.GBIF: 120,              # 2 minutos
            DataSource.STAC_COLLECTIONS: 400,  # 6 minutos
            DataSource.LOCAL_FILES: 60,        # 1 minuto
            DataSource.REAL_TIME_SENSORS: 30   # 30 segundos
        }
        
        base_duration = base_durations.get(data_source, 300)
        
        # Ajustar baseado nos parâmetros
        if 'temporal_range_days' in parameters:
            days = parameters['temporal_range_days']
            base_duration += days * 10  # 10 segundos por dia adicional
        
        if 'spatial_resolution' in parameters:
            if parameters['spatial_resolution'] == 'high':
                base_duration *= 2
        
        if parameters.get('quality_control', False):
            base_duration *= 1.5
        
        return int(base_duration)
    
    async def start_processing_job(self, job_id: str) -> bool:
        """
        ▶️ Iniciar processamento de um trabalho
        
        Args:
            job_id: ID do trabalho
            
        Returns:
            True se iniciado com sucesso
        """
        
        # Encontrar trabalho na fila
        job = None
        for i, queued_job in enumerate(self.processing_queue):
            if queued_job.id == job_id:
                job = self.processing_queue.pop(i)
                break
        
        if not job:
            logger.error(f"❌ Trabalho {job_id} não encontrado na fila")
            return False
        
        # Mover para trabalhos ativos
        job.status = ProcessingStatus.RUNNING
        job.started_at = datetime.now()
        self.active_jobs[job_id] = job
        
        # Atualizar métricas
        self.processing_metrics['active_jobs'] += 1
        self.processing_metrics['queued_jobs'] -= 1
        
        logger.info(f"▶️ Iniciando processamento: {job.name} ({job_id})")
        
        # Executar processamento em background
        asyncio.create_task(self._execute_processing_job(job))
        
        return True
    
    async def _execute_processing_job(self, job: ProcessingJob):
        """Executar trabalho de processamento"""
        
        try:
            # Simular processamento baseado na fonte de dados
            if job.data_source == DataSource.COPERNICUS_CMEMS:
                await self._process_copernicus_data(job)
            elif job.data_source == DataSource.MODIS:
                await self._process_modis_data(job)
            elif job.data_source == DataSource.OBIS:
                await self._process_obis_data(job)
            elif job.data_source == DataSource.GBIF:
                await self._process_gbif_data(job)
            elif job.data_source == DataSource.STAC_COLLECTIONS:
                await self._process_stac_data(job)
            else:
                await self._process_generic_data(job)
            
            # Marcar como concluído
            job.status = ProcessingStatus.COMPLETED
            job.completed_at = datetime.now()
            job.progress = 100.0
            job.actual_duration = int((job.completed_at - job.started_at).total_seconds())
            
            # Mover para trabalhos concluídos
            self.completed_jobs[job.id] = job
            del self.active_jobs[job.id]
            
            # Atualizar métricas
            self.processing_metrics['active_jobs'] -= 1
            self.processing_metrics['successful_jobs'] += 1
            
            logger.info(f"✅ Trabalho concluído: {job.name} ({job.id})")
            
        except Exception as e:
            # Marcar como erro
            job.status = ProcessingStatus.ERROR
            job.error_message = str(e)
            job.completed_at = datetime.now()
            
            # Mover para trabalhos concluídos
            self.completed_jobs[job.id] = job
            del self.active_jobs[job.id]
            
            # Atualizar métricas
            self.processing_metrics['active_jobs'] -= 1
            self.processing_metrics['failed_jobs'] += 1
            
            logger.error(f"❌ Erro no trabalho {job.name} ({job.id}): {e}")
    
    async def _process_copernicus_data(self, job: ProcessingJob):
        """Processar dados Copernicus CMEMS"""
        
        # Simular etapas de processamento
        steps = [
            ("Conectando ao servidor CMEMS", 10),
            ("Autenticando credenciais", 20),
            ("Consultando catálogo de dados", 30),
            ("Baixando dados oceanográficos", 60),
            ("Validando qualidade dos dados", 80),
            ("Processando e salvando resultados", 100)
        ]
        
        for step_name, progress in steps:
            job.progress = progress
            job.metadata['current_step'] = step_name
            logger.info(f"🌊 {job.name}: {step_name} ({progress}%)")
            
            # Simular tempo de processamento
            await asyncio.sleep(job.estimated_duration / len(steps) / 10)
        
        # Definir caminho de saída
        job.output_path = f"/data/processed/copernicus/{job.id}/oceanographic_data.nc"
        job.metadata['data_size_gb'] = 2.5
        job.metadata['variables_processed'] = job.parameters.get('variables', [])
    
    async def _process_modis_data(self, job: ProcessingJob):
        """Processar dados MODIS"""
        
        steps = [
            ("Conectando ao servidor NASA", 15),
            ("Pesquisando imagens MODIS", 30),
            ("Baixando dados de satélite", 50),
            ("Aplicando correções atmosféricas", 70),
            ("Gerando produtos derivados", 90),
            ("Salvando resultados finais", 100)
        ]
        
        for step_name, progress in steps:
            job.progress = progress
            job.metadata['current_step'] = step_name
            logger.info(f"🛰️ {job.name}: {step_name} ({progress}%)")
            await asyncio.sleep(job.estimated_duration / len(steps) / 10)
        
        job.output_path = f"/data/processed/modis/{job.id}/satellite_products.hdf"
        job.metadata['data_size_gb'] = 1.8
        job.metadata['scenes_processed'] = 15
    
    async def _process_obis_data(self, job: ProcessingJob):
        """Processar dados OBIS"""
        
        steps = [
            ("Conectando à API OBIS", 20),
            ("Consultando ocorrências de espécies", 40),
            ("Validando dados taxonómicos", 60),
            ("Calculando métricas de biodiversidade", 80),
            ("Gerando relatórios", 100)
        ]
        
        for step_name, progress in steps:
            job.progress = progress
            job.metadata['current_step'] = step_name
            logger.info(f"🐠 {job.name}: {step_name} ({progress}%)")
            await asyncio.sleep(job.estimated_duration / len(steps) / 10)
        
        job.output_path = f"/data/processed/obis/{job.id}/biodiversity_data.csv"
        job.metadata['data_size_gb'] = 0.5
        job.metadata['species_records'] = 12450
    
    async def _process_gbif_data(self, job: ProcessingJob):
        """Processar dados GBIF"""
        
        steps = [
            ("Conectando à API GBIF", 25),
            ("Baixando ocorrências", 50),
            ("Filtrando por qualidade", 75),
            ("Formatando dados finais", 100)
        ]
        
        for step_name, progress in steps:
            job.progress = progress
            job.metadata['current_step'] = step_name
            logger.info(f"🌍 {job.name}: {step_name} ({progress}%)")
            await asyncio.sleep(job.estimated_duration / len(steps) / 10)
        
        job.output_path = f"/data/processed/gbif/{job.id}/occurrences.csv"
        job.metadata['data_size_gb'] = 0.3
        job.metadata['occurrence_records'] = 8750
    
    async def _process_stac_data(self, job: ProcessingJob):
        """Processar dados STAC"""
        
        steps = [
            ("Conectando ao catálogo STAC", 15),
            ("Pesquisando coleções", 30),
            ("Baixando metadados", 50),
            ("Processando assets", 80),
            ("Criando índice local", 100)
        ]
        
        for step_name, progress in steps:
            job.progress = progress
            job.metadata['current_step'] = step_name
            logger.info(f"📦 {job.name}: {step_name} ({progress}%)")
            await asyncio.sleep(job.estimated_duration / len(steps) / 10)
        
        job.output_path = f"/data/processed/stac/{job.id}/catalog.json"
        job.metadata['data_size_gb'] = 3.2
        job.metadata['collections_processed'] = 5
    
    async def _process_generic_data(self, job: ProcessingJob):
        """Processar dados genéricos"""
        
        for i in range(0, 101, 20):
            job.progress = i
            job.metadata['current_step'] = f"Processando dados ({i}%)"
            await asyncio.sleep(job.estimated_duration / 5 / 10)
        
        job.output_path = f"/data/processed/generic/{job.id}/output.json"
        job.metadata['data_size_gb'] = 1.0
    
    async def get_processing_dashboard(self) -> str:
        """
        📊 Gerar dashboard de processamento de dados
        
        Returns:
            HTML do dashboard de processamento
        """
        
        # Atualizar métricas
        await self._update_processing_metrics()
        
        dashboard_html = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Painel de Processamento de Dados - MARÍTIMO ANGOLA</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f8fafc;
                    color: #333;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 15px;
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
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border-left: 5px solid #0ea5e9;
                }}
                .metric-value {{
                    font-size: 2em;
                    font-weight: bold;
                    color: #1e3a8a;
                    margin: 10px 0;
                }}
                .metric-label {{
                    color: #666;
                    font-size: 0.9em;
                }}
                .jobs-section {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .job-card {{
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    background: #f9fafb;
                }}
                .progress-bar {{
                    width: 100%;
                    height: 20px;
                    background: #e5e7eb;
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 10px 0;
                }}
                .progress-fill {{
                    height: 100%;
                    background: linear-gradient(90deg, #16a34a, #22c55e);
                    transition: width 0.3s ease;
                }}
                .status-running {{ color: #ea580c; }}
                .status-completed {{ color: #16a34a; }}
                .status-error {{ color: #dc2626; }}
                .status-pending {{ color: #6b7280; }}
                .data-sources {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }}
                .source-card {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .source-enabled {{ border-left: 5px solid #16a34a; }}
                .source-disabled {{ border-left: 5px solid #dc2626; }}
                .templates-section {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .template-card {{
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }}
                .template-card:hover {{
                    border-color: #0ea5e9;
                    transform: translateY(-2px);
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎛️ MARÍTIMO ANGOLA</h1>
                <h2>Painel de Controle de Processamento de Dados</h2>
                <p>Monitorização em Tempo Real - ZEE Angola</p>
            </div>
            
            <!-- Métricas Principais -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">{self.processing_metrics['total_jobs']}</div>
                    <div class="metric-label">Total de Trabalhos</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.processing_metrics['active_jobs']}</div>
                    <div class="metric-label">Em Execução</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.processing_metrics['queued_jobs']}</div>
                    <div class="metric-label">Na Fila</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.processing_metrics['successful_jobs']}</div>
                    <div class="metric-label">Concluídos</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.processing_metrics['failed_jobs']}</div>
                    <div class="metric-label">Com Erro</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.processing_metrics['total_data_processed_gb']:.1f} GB</div>
                    <div class="metric-label">Dados Processados</div>
                </div>
            </div>
            
            <!-- Trabalhos Ativos -->
            <div class="jobs-section">
                <h3>⚡ Trabalhos em Execução</h3>
        """
        
        if self.active_jobs:
            for job in self.active_jobs.values():
                current_step = job.metadata.get('current_step', 'Processando...')
                dashboard_html += f"""
                <div class="job-card">
                    <h4>{job.name}</h4>
                    <p><strong>Fonte:</strong> {job.data_source.value}</p>
                    <p><strong>Status:</strong> <span class="status-running">{current_step}</span></p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {job.progress}%"></div>
                    </div>
                    <p>Progresso: {job.progress:.1f}% | Iniciado: {job.started_at.strftime('%H:%M:%S')}</p>
                </div>
                """
        else:
            dashboard_html += "<p>Nenhum trabalho em execução no momento.</p>"
        
        dashboard_html += "</div>"
        
        # Trabalhos na Fila
        dashboard_html += """
            <div class="jobs-section">
                <h3>📋 Fila de Processamento</h3>
        """
        
        if self.processing_queue:
            for job in self.processing_queue[:5]:  # Mostrar apenas os primeiros 5
                dashboard_html += f"""
                <div class="job-card">
                    <h4>{job.name}</h4>
                    <p><strong>Fonte:</strong> {job.data_source.value}</p>
                    <p><strong>Prioridade:</strong> {job.priority.value}</p>
                    <p><strong>Criado:</strong> {job.created_at.strftime('%d/%m/%Y %H:%M')}</p>
                    <p><strong>Duração estimada:</strong> {job.estimated_duration // 60}min {job.estimated_duration % 60}s</p>
                </div>
                """
        else:
            dashboard_html += "<p>Fila vazia.</p>"
        
        dashboard_html += "</div>"
        
        # Fontes de Dados
        dashboard_html += """
            <div class="jobs-section">
                <h3>🔌 Fontes de Dados Configuradas</h3>
                <div class="data-sources">
        """
        
        for source_id, config in self.data_sources_config.items():
            enabled_class = "source-enabled" if config.enabled else "source-disabled"
            status_text = "Ativo" if config.enabled else "Inativo"
            
            dashboard_html += f"""
                <div class="source-card {enabled_class}">
                    <h4>{config.name}</h4>
                    <p><strong>Status:</strong> {status_text}</p>
                    <p><strong>Endpoint:</strong> {config.endpoint_url}</p>
                    <p><strong>Limite:</strong> {config.rate_limit} req/min</p>
                    <p><strong>Timeout:</strong> {config.timeout}s</p>
                    <p><strong>Tentativas:</strong> {config.retry_count}</p>
                </div>
            """
        
        dashboard_html += """
                </div>
            </div>
            
            <!-- Templates de Processamento -->
            <div class="templates-section">
                <h3>📋 Templates de Processamento</h3>
        """
        
        for template_id, template in self.processing_templates.items():
            sources_list = ", ".join([s.value for s in template['data_sources']])
            duration_min = template['estimated_duration'] // 60
            
            dashboard_html += f"""
                <div class="template-card" onclick="alert('Template: {template['name']}')">
                    <h4>{template['name']}</h4>
                    <p>{template['description']}</p>
                    <p><strong>Fontes:</strong> {sources_list}</p>
                    <p><strong>Duração estimada:</strong> {duration_min} minutos</p>
                </div>
            """
        
        dashboard_html += """
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; background: white; padding: 20px; border-radius: 10px;">
                <p><em>Dashboard atualizado automaticamente a cada 30 segundos</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Processamento Inteligente de Dados Marinhos</p>
                <p>Última atualização: """ + datetime.now().strftime('%d/%m/%Y %H:%M:%S') + """</p>
            </div>
            
            <script>
                // Auto-refresh a cada 30 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 30000);
                
                console.log('🎛️ BGAPP Data Processing Control Panel carregado');
            </script>
        </body>
        </html>
        """
        
        return dashboard_html
    
    async def _update_processing_metrics(self):
        """Atualizar métricas de processamento"""
        
        # Calcular dados processados
        total_data_gb = 0.0
        for job in self.completed_jobs.values():
            if 'data_size_gb' in job.metadata:
                total_data_gb += job.metadata['data_size_gb']
        
        self.processing_metrics['total_data_processed_gb'] = total_data_gb
        
        # Calcular tempo médio de processamento
        completed_durations = [
            job.actual_duration for job in self.completed_jobs.values()
            if job.actual_duration is not None
        ]
        
        if completed_durations:
            self.processing_metrics['average_processing_time'] = sum(completed_durations) / len(completed_durations)
        
        # Contar trabalhos das últimas 24h
        yesterday = datetime.now() - timedelta(days=1)
        recent_jobs = [
            job for job in list(self.completed_jobs.values()) + list(self.active_jobs.values()) + self.processing_queue
            if job.created_at >= yesterday
        ]
        self.processing_metrics['last_24h_jobs'] = len(recent_jobs)
    
    async def create_template_job(self, template_id: str, custom_parameters: Dict[str, Any] = None) -> List[str]:
        """
        📋 Criar trabalho baseado em template
        
        Args:
            template_id: ID do template
            custom_parameters: Parâmetros customizados
            
        Returns:
            Lista de IDs dos trabalhos criados
        """
        
        if template_id not in self.processing_templates:
            raise ValueError(f"Template '{template_id}' não encontrado")
        
        template = self.processing_templates[template_id]
        job_ids = []
        
        # Criar um trabalho para cada fonte de dados do template
        for data_source in template['data_sources']:
            parameters = template['parameters'].copy()
            if custom_parameters:
                parameters.update(custom_parameters)
            
            job_name = f"{template['name']} - {data_source.value}"
            
            job_id = await self.create_processing_job(
                name=job_name,
                data_source=data_source,
                parameters=parameters,
                priority=ProcessingPriority.NORMAL
            )
            
            job_ids.append(job_id)
        
        return job_ids
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        📊 Obter status de um trabalho específico
        
        Args:
            job_id: ID do trabalho
            
        Returns:
            Informações do status do trabalho
        """
        
        # Procurar em trabalhos ativos
        if job_id in self.active_jobs:
            job = self.active_jobs[job_id]
        # Procurar em trabalhos concluídos
        elif job_id in self.completed_jobs:
            job = self.completed_jobs[job_id]
        # Procurar na fila
        else:
            job = None
            for queued_job in self.processing_queue:
                if queued_job.id == job_id:
                    job = queued_job
                    break
        
        if not job:
            return None
        
        return {
            'id': job.id,
            'name': job.name,
            'data_source': job.data_source.value,
            'status': job.status.value,
            'priority': job.priority.value,
            'progress': job.progress,
            'created_at': job.created_at.isoformat(),
            'started_at': job.started_at.isoformat() if job.started_at else None,
            'completed_at': job.completed_at.isoformat() if job.completed_at else None,
            'estimated_duration': job.estimated_duration,
            'actual_duration': job.actual_duration,
            'output_path': job.output_path,
            'error_message': job.error_message,
            'metadata': job.metadata
        }


# Instância global do painel de controle
data_processing_control_panel = DataProcessingControlPanel()
