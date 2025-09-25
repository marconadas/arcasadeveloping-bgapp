#!/usr/bin/env python3
"""
BGAPP Scientific Workflow Manager - Gestor de Workflows Científicos
Automatiza análises recorrentes de biodiversidade e oceanografia com
workflows pré-definidos e personalizáveis para investigação marinha de Angola.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import schedule
import time

# Configurar logging
logger = logging.getLogger(__name__)


class WorkflowType(Enum):
    """Tipos de workflows científicos"""
    BIODIVERSITY_ANALYSIS = "analise_biodiversidade"
    OCEANOGRAPHIC_MONITORING = "monitorizacao_oceanografica"
    SPECIES_DISTRIBUTION = "distribuicao_especies"
    FISHERIES_ASSESSMENT = "avaliacao_pescas"
    HABITAT_SUITABILITY = "adequacao_habitat"
    SEASONAL_ANALYSIS = "analise_sazonal"
    ENVIRONMENTAL_IMPACT = "impacto_ambiental"
    CONSERVATION_PLANNING = "planeamento_conservacao"


class WorkflowStatus(Enum):
    """Status dos workflows"""
    CREATED = "criado"
    SCHEDULED = "agendado"
    RUNNING = "executando"
    COMPLETED = "concluido"
    FAILED = "falhado"
    CANCELLED = "cancelado"
    PAUSED = "pausado"


class WorkflowPriority(Enum):
    """Prioridade dos workflows"""
    LOW = "baixa"
    NORMAL = "normal"
    HIGH = "alta"
    URGENT = "urgente"


@dataclass
class WorkflowStep:
    """Passo individual de um workflow"""
    step_id: str
    name: str
    description: str
    function: str
    parameters: Dict[str, Any]
    dependencies: List[str]  # IDs de passos que devem ser completados antes
    estimated_duration: int  # segundos
    retry_count: int = 3
    timeout: int = 3600  # 1 hora
    optional: bool = False


@dataclass
class ScientificWorkflow:
    """Workflow científico completo"""
    id: str
    name: str
    description: str
    workflow_type: WorkflowType
    status: WorkflowStatus
    priority: WorkflowPriority
    created_at: datetime
    created_by: str
    scheduled_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    steps: List[WorkflowStep]
    current_step: Optional[str]
    progress: float  # 0-100
    output_data: Dict[str, Any]
    error_log: List[str]
    metadata: Dict[str, Any]
    recurrence_schedule: Optional[str]  # cron-like schedule
    auto_publish: bool = False


class ScientificWorkflowManager:
    """
    🔬 Gestor de Workflows Científicos BGAPP
    
    Automatiza análises científicas recorrentes para investigação
    da biodiversidade e oceanografia da ZEE de Angola.
    """
    
    def __init__(self):
        """Inicializar gestor de workflows"""
        
        # Registry de workflows
        self.workflows_registry = {}
        self.active_workflows = {}
        self.completed_workflows = {}
        self.scheduled_workflows = {}
        
        # Templates de workflows pré-definidos
        self.workflow_templates = self._initialize_workflow_templates()
        
        # Funções científicas disponíveis
        self.scientific_functions = self._initialize_scientific_functions()
        
        # Scheduler para workflows recorrentes
        self.scheduler_active = False
        
        # Métricas de workflows
        self.workflow_metrics = {
            'total_workflows': 0,
            'successful_workflows': 0,
            'failed_workflows': 0,
            'active_workflows': 0,
            'scheduled_workflows': 0,
            'total_analysis_hours': 0.0,
            'species_analyzed': set(),
            'publications_generated': 0
        }
    
    def _initialize_workflow_templates(self) -> Dict[str, Dict[str, Any]]:
        """Inicializar templates de workflows científicos"""
        
        return {
            'biodiversity_monthly_report': {
                'name': 'Relatório Mensal de Biodiversidade',
                'description': 'Análise mensal completa da biodiversidade marinha da ZEE Angola',
                'type': WorkflowType.BIODIVERSITY_ANALYSIS,
                'recurrence': '0 2 1 * *',  # 1º dia do mês às 02:00
                'estimated_duration': 3600,  # 1 hora
                'steps': [
                    {
                        'step_id': 'collect_obis_data',
                        'name': 'Coletar Dados OBIS',
                        'function': 'collect_biodiversity_data',
                        'parameters': {'source': 'obis', 'period_days': 30},
                        'dependencies': []
                    },
                    {
                        'step_id': 'collect_gbif_data',
                        'name': 'Coletar Dados GBIF',
                        'function': 'collect_biodiversity_data',
                        'parameters': {'source': 'gbif', 'period_days': 30},
                        'dependencies': []
                    },
                    {
                        'step_id': 'calculate_indices',
                        'name': 'Calcular Índices de Biodiversidade',
                        'function': 'calculate_biodiversity_indices',
                        'parameters': {'include_shannon': True, 'include_simpson': True},
                        'dependencies': ['collect_obis_data', 'collect_gbif_data']
                    },
                    {
                        'step_id': 'generate_maps',
                        'name': 'Gerar Mapas de Distribuição',
                        'function': 'generate_species_distribution_maps',
                        'parameters': {'map_type': 'folium', 'include_density': True},
                        'dependencies': ['calculate_indices']
                    },
                    {
                        'step_id': 'create_report',
                        'name': 'Criar Relatório Final',
                        'function': 'generate_scientific_report',
                        'parameters': {'format': 'html', 'include_recommendations': True},
                        'dependencies': ['generate_maps']
                    }
                ]
            },
            'oceanographic_daily_analysis': {
                'name': 'Análise Diária Oceanográfica',
                'description': 'Processamento diário de dados oceanográficos Copernicus',
                'type': WorkflowType.OCEANOGRAPHIC_MONITORING,
                'recurrence': '0 6 * * *',  # Todos os dias às 06:00
                'estimated_duration': 1800,  # 30 minutos
                'steps': [
                    {
                        'step_id': 'fetch_copernicus',
                        'name': 'Obter Dados Copernicus',
                        'function': 'fetch_copernicus_daily_data',
                        'parameters': {'variables': ['sst', 'salinity', 'chlorophyll'], 'zee_angola': True},
                        'dependencies': []
                    },
                    {
                        'step_id': 'quality_control',
                        'name': 'Controle de Qualidade',
                        'function': 'perform_quality_control',
                        'parameters': {'threshold': 0.8, 'remove_outliers': True},
                        'dependencies': ['fetch_copernicus']
                    },
                    {
                        'step_id': 'calculate_statistics',
                        'name': 'Calcular Estatísticas',
                        'function': 'calculate_oceanographic_statistics',
                        'parameters': {'include_trends': True, 'compare_historical': True},
                        'dependencies': ['quality_control']
                    },
                    {
                        'step_id': 'generate_alerts',
                        'name': 'Gerar Alertas Ambientais',
                        'function': 'check_environmental_alerts',
                        'parameters': {'thresholds': 'angola_specific'},
                        'dependencies': ['calculate_statistics']
                    }
                ]
            },
            'fisheries_weekly_assessment': {
                'name': 'Avaliação Semanal de Pescas',
                'description': 'Análise semanal das atividades pesqueiras nas 3 zonas de Angola',
                'type': WorkflowType.FISHERIES_ASSESSMENT,
                'recurrence': '0 8 * * 1',  # Segundas-feiras às 08:00
                'estimated_duration': 2400,  # 40 minutos
                'steps': [
                    {
                        'step_id': 'collect_fishing_data',
                        'name': 'Coletar Dados de Pesca',
                        'function': 'collect_fisheries_statistics',
                        'parameters': {'zones': ['norte', 'centro', 'sul'], 'period_days': 7},
                        'dependencies': []
                    },
                    {
                        'step_id': 'analyze_catch_trends',
                        'name': 'Analisar Tendências de Captura',
                        'function': 'analyze_catch_trends',
                        'parameters': {'include_species_breakdown': True, 'compare_quotas': True},
                        'dependencies': ['collect_fishing_data']
                    },
                    {
                        'step_id': 'assess_sustainability',
                        'name': 'Avaliar Sustentabilidade',
                        'function': 'assess_fishing_sustainability',
                        'parameters': {'use_msy_reference': True, 'include_recommendations': True},
                        'dependencies': ['analyze_catch_trends']
                    },
                    {
                        'step_id': 'generate_fisheries_report',
                        'name': 'Gerar Relatório de Pescas',
                        'function': 'generate_fisheries_report',
                        'parameters': {'format': 'html', 'include_maps': True, 'send_email': True},
                        'dependencies': ['assess_sustainability']
                    }
                ]
            },
            'species_distribution_modeling': {
                'name': 'Modelação de Distribuição de Espécies',
                'description': 'Modelação MaxEnt para espécies marinhas prioritárias',
                'type': WorkflowType.SPECIES_DISTRIBUTION,
                'recurrence': '0 3 1 * *',  # 1º dia do mês às 03:00
                'estimated_duration': 7200,  # 2 horas
                'steps': [
                    {
                        'step_id': 'prepare_occurrence_data',
                        'name': 'Preparar Dados de Ocorrência',
                        'function': 'prepare_species_occurrence_data',
                        'parameters': {'min_occurrences': 20, 'quality_filter': True},
                        'dependencies': []
                    },
                    {
                        'step_id': 'prepare_environmental_layers',
                        'name': 'Preparar Camadas Ambientais',
                        'function': 'prepare_environmental_layers',
                        'parameters': {'variables': ['sst', 'salinity', 'depth', 'chlorophyll'], 'resolution': '0.25deg'},
                        'dependencies': []
                    },
                    {
                        'step_id': 'run_maxent_models',
                        'name': 'Executar Modelos MaxEnt',
                        'function': 'run_maxent_species_models',
                        'parameters': {'cross_validation': True, 'feature_classes': 'auto'},
                        'dependencies': ['prepare_occurrence_data', 'prepare_environmental_layers']
                    },
                    {
                        'step_id': 'validate_models',
                        'name': 'Validar Modelos',
                        'function': 'validate_distribution_models',
                        'parameters': {'auc_threshold': 0.7, 'test_percentage': 25},
                        'dependencies': ['run_maxent_models']
                    },
                    {
                        'step_id': 'generate_predictions',
                        'name': 'Gerar Predições',
                        'function': 'generate_distribution_predictions',
                        'parameters': {'probability_threshold': 0.5, 'create_binary_maps': True},
                        'dependencies': ['validate_models']
                    }
                ]
            },
            'seasonal_upwelling_analysis': {
                'name': 'Análise Sazonal do Upwelling',
                'description': 'Análise trimestral do upwelling de Benguela e impacto na produtividade',
                'type': WorkflowType.SEASONAL_ANALYSIS,
                'recurrence': '0 4 1 */3 *',  # A cada 3 meses no dia 1 às 04:00
                'estimated_duration': 5400,  # 1.5 horas
                'steps': [
                    {
                        'step_id': 'collect_sst_data',
                        'name': 'Coletar Dados de TSM',
                        'function': 'collect_sst_timeseries',
                        'parameters': {'period_months': 3, 'include_anomalies': True},
                        'dependencies': []
                    },
                    {
                        'step_id': 'detect_upwelling_events',
                        'name': 'Detectar Eventos de Upwelling',
                        'function': 'detect_upwelling_events',
                        'parameters': {'temperature_threshold': -2.0, 'duration_threshold': 5},
                        'dependencies': ['collect_sst_data']
                    },
                    {
                        'step_id': 'analyze_productivity_impact',
                        'name': 'Analisar Impacto na Produtividade',
                        'function': 'analyze_upwelling_productivity',
                        'parameters': {'chlorophyll_lag_days': 7, 'fisheries_correlation': True},
                        'dependencies': ['detect_upwelling_events']
                    },
                    {
                        'step_id': 'forecast_next_period',
                        'name': 'Prever Próximo Período',
                        'function': 'forecast_upwelling_patterns',
                        'parameters': {'forecast_months': 3, 'confidence_interval': 0.95},
                        'dependencies': ['analyze_productivity_impact']
                    }
                ]
            }
        }
    
    def _initialize_scientific_functions(self) -> Dict[str, Callable]:
        """Inicializar funções científicas disponíveis"""
        
        return {
            # Funções de coleta de dados
            'collect_biodiversity_data': self._collect_biodiversity_data,
            'fetch_copernicus_daily_data': self._fetch_copernicus_daily_data,
            'collect_fisheries_statistics': self._collect_fisheries_statistics,
            
            # Funções de análise
            'calculate_biodiversity_indices': self._calculate_biodiversity_indices,
            'perform_quality_control': self._perform_quality_control,
            'calculate_oceanographic_statistics': self._calculate_oceanographic_statistics,
            'analyze_catch_trends': self._analyze_catch_trends,
            
            # Funções de modelação
            'run_maxent_species_models': self._run_maxent_species_models,
            'validate_distribution_models': self._validate_distribution_models,
            'generate_distribution_predictions': self._generate_distribution_predictions,
            
            # Funções de análise sazonal
            'collect_sst_timeseries': self._collect_sst_timeseries,
            'detect_upwelling_events': self._detect_upwelling_events,
            'analyze_upwelling_productivity': self._analyze_upwelling_productivity,
            'forecast_upwelling_patterns': self._forecast_upwelling_patterns,
            
            # Funções de relatórios
            'generate_scientific_report': self._generate_scientific_report,
            'generate_fisheries_report': self._generate_fisheries_report,
            'generate_species_distribution_maps': self._generate_species_distribution_maps,
            
            # Funções de avaliação
            'assess_fishing_sustainability': self._assess_fishing_sustainability,
            'check_environmental_alerts': self._check_environmental_alerts,
            'prepare_species_occurrence_data': self._prepare_species_occurrence_data,
            'prepare_environmental_layers': self._prepare_environmental_layers
        }
    
    async def create_workflow_from_template(self, 
                                          template_id: str,
                                          custom_name: Optional[str] = None,
                                          custom_parameters: Optional[Dict[str, Any]] = None,
                                          schedule_time: Optional[datetime] = None,
                                          created_by: str = "admin") -> str:
        """
        📋 Criar workflow baseado em template
        
        Args:
            template_id: ID do template
            custom_name: Nome personalizado
            custom_parameters: Parâmetros customizados
            schedule_time: Hora de agendamento
            created_by: Utilizador que criou
            
        Returns:
            ID do workflow criado
        """
        
        if template_id not in self.workflow_templates:
            raise ValueError(f"Template '{template_id}' não encontrado")
        
        template = self.workflow_templates[template_id]
        workflow_id = str(uuid.uuid4())
        
        # Criar passos do workflow
        workflow_steps = []
        for step_template in template['steps']:
            # Aplicar parâmetros customizados se fornecidos
            step_params = step_template['parameters'].copy()
            if custom_parameters:
                step_params.update(custom_parameters.get(step_template['step_id'], {}))
            
            step = WorkflowStep(
                step_id=step_template['step_id'],
                name=step_template['name'],
                description=step_template.get('description', ''),
                function=step_template['function'],
                parameters=step_params,
                dependencies=step_template.get('dependencies', []),
                estimated_duration=step_template.get('estimated_duration', 300)
            )
            workflow_steps.append(step)
        
        # Criar workflow
        workflow = ScientificWorkflow(
            id=workflow_id,
            name=custom_name or template['name'],
            description=template['description'],
            workflow_type=template['type'],
            status=WorkflowStatus.CREATED,
            priority=WorkflowPriority.NORMAL,
            created_at=datetime.now(),
            created_by=created_by,
            scheduled_at=schedule_time,
            started_at=None,
            completed_at=None,
            steps=workflow_steps,
            current_step=None,
            progress=0.0,
            output_data={},
            error_log=[],
            metadata={
                'template_id': template_id,
                'estimated_total_duration': template['estimated_duration']
            },
            recurrence_schedule=template.get('recurrence'),
            auto_publish=template.get('auto_publish', False)
        )
        
        # Registar workflow
        self.workflows_registry[workflow_id] = workflow
        
        # Agendar se necessário
        if schedule_time:
            workflow.status = WorkflowStatus.SCHEDULED
            self.scheduled_workflows[workflow_id] = workflow
        
        # Atualizar métricas
        self.workflow_metrics['total_workflows'] += 1
        if schedule_time:
            self.workflow_metrics['scheduled_workflows'] += 1
        
        logger.info(f"📋 Workflow criado: {workflow.name} ({workflow_id})")
        
        return workflow_id
    
    async def execute_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """
        ▶️ Executar workflow científico
        
        Args:
            workflow_id: ID do workflow
            
        Returns:
            Resultado da execução
        """
        
        if workflow_id not in self.workflows_registry:
            raise ValueError(f"Workflow '{workflow_id}' não encontrado")
        
        workflow = self.workflows_registry[workflow_id]
        
        if workflow.status == WorkflowStatus.RUNNING:
            raise ValueError(f"Workflow '{workflow_id}' já está em execução")
        
        # Mover para workflows ativos
        workflow.status = WorkflowStatus.RUNNING
        workflow.started_at = datetime.now()
        self.active_workflows[workflow_id] = workflow
        
        # Atualizar métricas
        self.workflow_metrics['active_workflows'] += 1
        
        logger.info(f"▶️ Iniciando execução do workflow: {workflow.name}")
        
        # Executar em background
        asyncio.create_task(self._execute_workflow_steps(workflow))
        
        return {
            'workflow_id': workflow_id,
            'status': 'started',
            'estimated_completion': (datetime.now() + timedelta(seconds=workflow.metadata.get('estimated_total_duration', 3600))).isoformat()
        }
    
    async def _execute_workflow_steps(self, workflow: ScientificWorkflow):
        """Executar passos do workflow"""
        
        try:
            total_steps = len(workflow.steps)
            completed_steps = 0
            
            # Criar grafo de dependências
            steps_by_id = {step.step_id: step for step in workflow.steps}
            completed_step_ids = set()
            
            while completed_steps < total_steps:
                # Encontrar passos prontos para execução
                ready_steps = []
                for step in workflow.steps:
                    if (step.step_id not in completed_step_ids and
                        all(dep_id in completed_step_ids for dep_id in step.dependencies)):
                        ready_steps.append(step)
                
                if not ready_steps:
                    # Deadlock ou erro na configuração de dependências
                    raise Exception("Nenhum passo pronto para execução - possível dependência circular")
                
                # Executar passos prontos em paralelo
                step_tasks = []
                for step in ready_steps:
                    task = asyncio.create_task(self._execute_workflow_step(workflow, step))
                    step_tasks.append((step.step_id, task))
                
                # Aguardar conclusão dos passos
                for step_id, task in step_tasks:
                    try:
                        step_result = await task
                        completed_step_ids.add(step_id)
                        completed_steps += 1
                        
                        # Atualizar progresso
                        workflow.progress = (completed_steps / total_steps) * 100
                        workflow.current_step = f"Concluído: {steps_by_id[step_id].name}"
                        
                        # Armazenar resultado
                        workflow.output_data[step_id] = step_result
                        
                        logger.info(f"✅ Passo concluído: {steps_by_id[step_id].name}")
                        
                    except Exception as e:
                        error_msg = f"Erro no passo {step_id}: {str(e)}"
                        workflow.error_log.append(error_msg)
                        logger.error(f"❌ {error_msg}")
                        
                        # Se passo não é opcional, falhar workflow
                        if not steps_by_id[step_id].optional:
                            raise Exception(error_msg)
            
            # Workflow concluído com sucesso
            workflow.status = WorkflowStatus.COMPLETED
            workflow.completed_at = datetime.now()
            workflow.progress = 100.0
            workflow.current_step = "Concluído"
            
            # Mover para workflows concluídos
            self.completed_workflows[workflow.id] = workflow
            del self.active_workflows[workflow.id]
            
            # Atualizar métricas
            self.workflow_metrics['active_workflows'] -= 1
            self.workflow_metrics['successful_workflows'] += 1
            execution_hours = (workflow.completed_at - workflow.started_at).total_seconds() / 3600
            self.workflow_metrics['total_analysis_hours'] += execution_hours
            
            logger.info(f"✅ Workflow concluído com sucesso: {workflow.name}")
            
        except Exception as e:
            # Workflow falhado
            workflow.status = WorkflowStatus.FAILED
            workflow.completed_at = datetime.now()
            workflow.error_log.append(f"Falha geral do workflow: {str(e)}")
            
            # Mover para workflows concluídos
            self.completed_workflows[workflow.id] = workflow
            if workflow.id in self.active_workflows:
                del self.active_workflows[workflow.id]
            
            # Atualizar métricas
            self.workflow_metrics['active_workflows'] -= 1
            self.workflow_metrics['failed_workflows'] += 1
            
            logger.error(f"❌ Workflow falhado: {workflow.name} - {str(e)}")
    
    async def _execute_workflow_step(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Executar um passo individual do workflow"""
        
        if step.function not in self.scientific_functions:
            raise Exception(f"Função científica '{step.function}' não encontrada")
        
        function = self.scientific_functions[step.function]
        
        try:
            # Executar função com timeout
            result = await asyncio.wait_for(
                function(workflow, step),
                timeout=step.timeout
            )
            
            return {
                'success': True,
                'result': result,
                'execution_time': time.time()
            }
            
        except asyncio.TimeoutError:
            raise Exception(f"Passo '{step.name}' excedeu timeout de {step.timeout} segundos")
        except Exception as e:
            raise Exception(f"Erro na execução: {str(e)}")
    
    # Implementações das funções científicas (simuladas)
    async def _collect_biodiversity_data(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Coletar dados de biodiversidade"""
        source = step.parameters.get('source', 'obis')
        period_days = step.parameters.get('period_days', 30)
        
        # Simular coleta de dados
        await asyncio.sleep(2)
        
        return {
            'source': source,
            'records_collected': 1250,
            'species_count': 45,
            'period_days': period_days,
            'data_quality_score': 0.89
        }
    
    async def _fetch_copernicus_daily_data(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Obter dados diários do Copernicus"""
        variables = step.parameters.get('variables', ['sst'])
        
        await asyncio.sleep(3)
        
        return {
            'variables': variables,
            'data_points': 15678,
            'coverage_percentage': 94.5,
            'last_update': datetime.now().isoformat()
        }
    
    async def _collect_fisheries_statistics(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Coletar estatísticas de pesca"""
        zones = step.parameters.get('zones', ['centro'])
        period_days = step.parameters.get('period_days', 7)
        
        await asyncio.sleep(1.5)
        
        return {
            'zones': zones,
            'total_catch_tons': 234.7,
            'active_vessels': 892,
            'species_diversity': 23,
            'period_days': period_days
        }
    
    async def _calculate_biodiversity_indices(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Calcular índices de biodiversidade"""
        await asyncio.sleep(1)
        
        return {
            'shannon_index': 2.45,
            'simpson_index': 0.83,
            'margalef_richness': 4.12,
            'pielou_evenness': 0.78,
            'species_richness': 45
        }
    
    async def _perform_quality_control(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Realizar controle de qualidade"""
        threshold = step.parameters.get('threshold', 0.8)
        
        await asyncio.sleep(0.5)
        
        return {
            'quality_score': 0.91,
            'outliers_removed': 23,
            'data_completeness': 0.95,
            'threshold_used': threshold
        }
    
    async def _calculate_oceanographic_statistics(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Calcular estatísticas oceanográficas"""
        await asyncio.sleep(2)
        
        return {
            'mean_sst': 24.5,
            'mean_salinity': 35.2,
            'mean_chlorophyll': 0.89,
            'temperature_anomaly': 0.3,
            'trend_analysis': 'stable'
        }
    
    async def _analyze_catch_trends(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Analisar tendências de captura"""
        await asyncio.sleep(1.5)
        
        return {
            'trend_direction': 'increasing',
            'trend_strength': 0.65,
            'seasonal_pattern': 'strong',
            'top_species': ['Sardinha', 'Atum', 'Cavala']
        }
    
    async def _run_maxent_species_models(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Executar modelos MaxEnt"""
        await asyncio.sleep(10)  # Modelação demora mais tempo
        
        return {
            'models_created': 8,
            'average_auc': 0.87,
            'validation_success': True,
            'feature_importance': {'sst': 0.45, 'depth': 0.32, 'salinity': 0.23}
        }
    
    async def _validate_distribution_models(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Validar modelos de distribuição"""
        await asyncio.sleep(2)
        
        return {
            'validation_score': 0.89,
            'cross_validation_auc': 0.85,
            'model_reliability': 'high',
            'recommended_threshold': 0.6
        }
    
    async def _generate_distribution_predictions(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Gerar predições de distribuição"""
        await asyncio.sleep(3)
        
        return {
            'prediction_maps_created': 8,
            'suitable_habitat_km2': 125000,
            'confidence_level': 0.87,
            'binary_maps_created': True
        }
    
    async def _collect_sst_timeseries(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Coletar séries temporais de TSM"""
        await asyncio.sleep(2)
        
        return {
            'data_points': 2190,  # 3 meses diários
            'temporal_resolution': 'daily',
            'spatial_coverage': 0.98,
            'anomalies_detected': 12
        }
    
    async def _detect_upwelling_events(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Detectar eventos de upwelling"""
        await asyncio.sleep(1.5)
        
        return {
            'upwelling_events': 8,
            'average_intensity': -2.8,
            'average_duration_days': 7.5,
            'seasonal_pattern': 'jul-sep peak'
        }
    
    async def _analyze_upwelling_productivity(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Analisar impacto do upwelling na produtividade"""
        await asyncio.sleep(2)
        
        return {
            'productivity_increase': 2.3,
            'chlorophyll_response_lag': 5.2,
            'fisheries_correlation': 0.78,
            'economic_impact_usd': 2500000
        }
    
    async def _forecast_upwelling_patterns(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Prever padrões de upwelling"""
        await asyncio.sleep(3)
        
        return {
            'forecast_confidence': 0.82,
            'predicted_events': 6,
            'intensity_forecast': 'moderate',
            'timing_forecast': 'jun-aug 2025'
        }
    
    async def _generate_scientific_report(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Gerar relatório científico"""
        await asyncio.sleep(2)
        
        return {
            'report_generated': True,
            'pages_count': 25,
            'figures_count': 12,
            'format': step.parameters.get('format', 'html'),
            'file_path': f'/reports/{workflow.id}_scientific_report.html'
        }
    
    async def _generate_fisheries_report(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Gerar relatório de pescas"""
        await asyncio.sleep(1.5)
        
        return {
            'report_generated': True,
            'zones_analyzed': 3,
            'species_assessed': 15,
            'sustainability_score': 0.76,
            'file_path': f'/reports/{workflow.id}_fisheries_report.html'
        }
    
    async def _generate_species_distribution_maps(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Gerar mapas de distribuição de espécies"""
        await asyncio.sleep(4)
        
        return {
            'maps_generated': 8,
            'map_type': step.parameters.get('map_type', 'folium'),
            'include_density': step.parameters.get('include_density', False),
            'output_format': 'html'
        }
    
    async def _assess_fishing_sustainability(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Avaliar sustentabilidade da pesca"""
        await asyncio.sleep(2)
        
        return {
            'sustainability_index': 0.76,
            'overfished_species': 2,
            'sustainable_species': 13,
            'recommendations_count': 8
        }
    
    async def _check_environmental_alerts(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Verificar alertas ambientais"""
        await asyncio.sleep(1)
        
        return {
            'alerts_generated': 3,
            'severity_levels': ['warning', 'info', 'warning'],
            'parameters_checked': ['temperature', 'salinity', 'oxygen'],
            'thresholds_exceeded': 1
        }
    
    async def _prepare_species_occurrence_data(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Preparar dados de ocorrência de espécies"""
        await asyncio.sleep(2)
        
        return {
            'species_processed': 12,
            'occurrences_cleaned': 5678,
            'spatial_resolution': '0.25deg',
            'temporal_range': '2020-2024'
        }
    
    async def _prepare_environmental_layers(self, workflow: ScientificWorkflow, step: WorkflowStep) -> Dict[str, Any]:
        """Preparar camadas ambientais"""
        await asyncio.sleep(3)
        
        return {
            'layers_prepared': 4,
            'variables': step.parameters.get('variables', []),
            'resolution': step.parameters.get('resolution', '1deg'),
            'temporal_alignment': 'monthly'
        }
    
    def generate_workflows_dashboard(self) -> str:
        """
        📊 Gerar dashboard de workflows científicos
        
        Returns:
            Dashboard HTML completo
        """
        
        dashboard_html = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Gestor de Workflows Científicos - MARÍTIMO ANGOLA</title>
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
                .workflows-section {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .workflow-card {{
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    background: #f9fafb;
                }}
                .workflow-running {{ border-left: 5px solid #ea580c; }}
                .workflow-completed {{ border-left: 5px solid #16a34a; }}
                .workflow-failed {{ border-left: 5px solid #dc2626; }}
                .workflow-scheduled {{ border-left: 5px solid #0ea5e9; }}
                .progress-bar {{
                    width: 100%;
                    height: 15px;
                    background: #e5e7eb;
                    border-radius: 8px;
                    overflow: hidden;
                    margin: 10px 0;
                }}
                .progress-fill {{
                    height: 100%;
                    background: linear-gradient(90deg, #16a34a, #22c55e);
                    transition: width 0.3s ease;
                }}
                .templates-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }}
                .template-card {{
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }}
                .template-card:hover {{
                    border-color: #0ea5e9;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }}
                .status-running {{ color: #ea580c; }}
                .status-completed {{ color: #16a34a; }}
                .status-failed {{ color: #dc2626; }}
                .status-scheduled {{ color: #0ea5e9; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔬 MARÍTIMO ANGOLA</h1>
                <h2>Gestor de Workflows Científicos</h2>
                <p>Automatização de Análises - ZEE Angola</p>
            </div>
            
            <!-- Métricas Principais -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">{self.workflow_metrics['total_workflows']}</div>
                    <div class="metric-label">Total de Workflows</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.workflow_metrics['active_workflows']}</div>
                    <div class="metric-label">Em Execução</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.workflow_metrics['successful_workflows']}</div>
                    <div class="metric-label">Concluídos</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.workflow_metrics['scheduled_workflows']}</div>
                    <div class="metric-label">Agendados</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.workflow_metrics['total_analysis_hours']:.1f}h</div>
                    <div class="metric-label">Horas de Análise</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{len(self.workflow_metrics['species_analyzed'])}</div>
                    <div class="metric-label">Espécies Analisadas</div>
                </div>
            </div>
            
            <!-- Workflows Ativos -->
            <div class="workflows-section">
                <h3>⚡ Workflows em Execução</h3>
        """
        
        if self.active_workflows:
            for workflow in self.active_workflows.values():
                dashboard_html += f"""
                <div class="workflow-card workflow-running">
                    <h4>{workflow.name}</h4>
                    <p><strong>Tipo:</strong> {workflow.workflow_type.value}</p>
                    <p><strong>Status:</strong> <span class="status-running">{workflow.current_step or 'Iniciando...'}</span></p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {workflow.progress}%"></div>
                    </div>
                    <p>Progresso: {workflow.progress:.1f}% | Iniciado: {workflow.started_at.strftime('%H:%M:%S') if workflow.started_at else 'N/A'}</p>
                </div>
                """
        else:
            dashboard_html += "<p>Nenhum workflow em execução no momento.</p>"
        
        dashboard_html += "</div>"
        
        # Templates Disponíveis
        dashboard_html += """
            <div class="workflows-section">
                <h3>📋 Templates de Workflows Disponíveis</h3>
                <div class="templates-grid">
        """
        
        for template_id, template in self.workflow_templates.items():
            steps_count = len(template['steps'])
            duration_min = template['estimated_duration'] // 60
            
            dashboard_html += f"""
                <div class="template-card" onclick="alert('Template: {template['name']}')">
                    <h4>{template['name']}</h4>
                    <p>{template['description']}</p>
                    <p><strong>Tipo:</strong> {template['type'].value}</p>
                    <p><strong>Passos:</strong> {steps_count}</p>
                    <p><strong>Duração estimada:</strong> {duration_min} minutos</p>
                    <p><strong>Recorrência:</strong> {template.get('recurrence', 'Manual')}</p>
                </div>
            """
        
        dashboard_html += """
                </div>
            </div>
            
            <!-- Workflows Recentes -->
            <div class="workflows-section">
                <h3>📈 Workflows Concluídos Recentemente</h3>
        """
        
        # Mostrar últimos 5 workflows concluídos
        recent_completed = list(self.completed_workflows.values())[-5:]
        
        if recent_completed:
            for workflow in reversed(recent_completed):
                status_class = f"status-{workflow.status.value}"
                duration = ""
                if workflow.started_at and workflow.completed_at:
                    duration_sec = (workflow.completed_at - workflow.started_at).total_seconds()
                    duration = f"{duration_sec//60:.0f}min {duration_sec%60:.0f}s"
                
                dashboard_html += f"""
                <div class="workflow-card workflow-{workflow.status.value}">
                    <h4>{workflow.name}</h4>
                    <p><strong>Status:</strong> <span class="{status_class}">{workflow.status.value.upper()}</span></p>
                    <p><strong>Concluído:</strong> {workflow.completed_at.strftime('%d/%m/%Y %H:%M') if workflow.completed_at else 'N/A'}</p>
                    <p><strong>Duração:</strong> {duration}</p>
                    <p><strong>Criado por:</strong> {workflow.created_by}</p>
                </div>
                """
        else:
            dashboard_html += "<p>Nenhum workflow concluído ainda.</p>"
        
        dashboard_html += f"""
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; background: white; padding: 20px; border-radius: 10px;">
                <p><em>Workflows científicos atualizados automaticamente</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Automatização da Investigação Marinha</p>
                <p>Sistema ativo desde: {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
            </div>
            
            <script>
                // Auto-refresh a cada 30 segundos
                setTimeout(() => {{
                    window.location.reload();
                }}, 30000);
                
                console.log('🔬 BGAPP Scientific Workflow Manager carregado');
            </script>
        </body>
        </html>
        """
        
        return dashboard_html
    
    def get_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """
        📊 Obter status de um workflow específico
        
        Args:
            workflow_id: ID do workflow
            
        Returns:
            Status detalhado do workflow
        """
        
        # Procurar em todos os registries
        workflow = None
        if workflow_id in self.workflows_registry:
            workflow = self.workflows_registry[workflow_id]
        
        if not workflow:
            return None
        
        return {
            'id': workflow.id,
            'name': workflow.name,
            'description': workflow.description,
            'type': workflow.workflow_type.value,
            'status': workflow.status.value,
            'priority': workflow.priority.value,
            'progress': workflow.progress,
            'current_step': workflow.current_step,
            'created_at': workflow.created_at.isoformat(),
            'started_at': workflow.started_at.isoformat() if workflow.started_at else None,
            'completed_at': workflow.completed_at.isoformat() if workflow.completed_at else None,
            'scheduled_at': workflow.scheduled_at.isoformat() if workflow.scheduled_at else None,
            'created_by': workflow.created_by,
            'steps_count': len(workflow.steps),
            'output_data_keys': list(workflow.output_data.keys()),
            'error_count': len(workflow.error_log),
            'metadata': workflow.metadata
        }
    
    async def cancel_workflow(self, workflow_id: str) -> bool:
        """
        ⏹️ Cancelar workflow
        
        Args:
            workflow_id: ID do workflow
            
        Returns:
            True se cancelado com sucesso
        """
        
        if workflow_id in self.active_workflows:
            workflow = self.active_workflows[workflow_id]
            workflow.status = WorkflowStatus.CANCELLED
            workflow.completed_at = datetime.now()
            
            # Mover para concluídos
            self.completed_workflows[workflow_id] = workflow
            del self.active_workflows[workflow_id]
            
            # Atualizar métricas
            self.workflow_metrics['active_workflows'] -= 1
            
            logger.info(f"⏹️ Workflow cancelado: {workflow.name}")
            return True
        
        elif workflow_id in self.scheduled_workflows:
            workflow = self.scheduled_workflows[workflow_id]
            workflow.status = WorkflowStatus.CANCELLED
            
            del self.scheduled_workflows[workflow_id]
            self.workflow_metrics['scheduled_workflows'] -= 1
            
            logger.info(f"⏹️ Workflow agendado cancelado: {workflow.name}")
            return True
        
        return False
    
    def get_available_templates(self) -> Dict[str, Any]:
        """Obter templates disponíveis"""
        
        templates_info = {}
        
        for template_id, template in self.workflow_templates.items():
            templates_info[template_id] = {
                'name': template['name'],
                'description': template['description'],
                'type': template['type'].value,
                'steps_count': len(template['steps']),
                'estimated_duration_minutes': template['estimated_duration'] // 60,
                'recurrence': template.get('recurrence', 'Manual'),
                'auto_publish': template.get('auto_publish', False)
            }
        
        return templates_info


# Instância global do gestor de workflows
scientific_workflow_manager = ScientificWorkflowManager()
