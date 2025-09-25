"""
📋 ML Retention Policies
Sistema de políticas automáticas de retenção de dados ML

CARACTERÍSTICAS:
- Políticas configuráveis por tipo de dados
- Limpeza automática baseada em critérios
- Monitorização de uso e performance
- Compatível com Cloudflare Workers
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import json

# Imports do sistema
try:
    from .retention_manager import MLRetentionManager
    from ..database.database_manager import DatabaseManager
except ImportError:
    # Fallback para desenvolvimento
    import sys
    # Path already in PYTHONPATH

logger = logging.getLogger(__name__)


class PolicyAction(Enum):
    """Ações de retenção disponíveis"""
    DELETE = "delete"
    ARCHIVE = "archive"
    COMPRESS = "compress"
    MIGRATE = "migrate"


class PolicyTrigger(Enum):
    """Triggers para execução de políticas"""
    TIME_BASED = "time_based"
    USAGE_BASED = "usage_based"
    QUALITY_BASED = "quality_based"
    SIZE_BASED = "size_based"


@dataclass
class RetentionPolicy:
    """Definição de uma política de retenção"""
    policy_id: str
    name: str
    description: str
    table_name: str
    
    # Critérios de retenção
    retention_days: int
    min_access_count: int = 0
    min_quality_score: float = 0.0
    max_size_mb: float = 0.0
    priority_threshold: str = 'normal'
    
    # Ação e configuração
    action: PolicyAction = PolicyAction.DELETE
    enabled: bool = True
    
    # Schedule
    execution_interval_hours: int = 24
    next_execution: Optional[datetime] = None
    
    # Filtros adicionais
    custom_filters: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.custom_filters is None:
            self.custom_filters = {}
        if self.next_execution is None:
            self.next_execution = datetime.now() + timedelta(hours=self.execution_interval_hours)


@dataclass
class PolicyExecution:
    """Resultado de execução de política"""
    policy_id: str
    executed_at: datetime
    records_processed: int
    records_affected: int
    space_freed_mb: float
    execution_time_seconds: float
    success: bool
    error_message: Optional[str] = None


class MLRetentionPolicyManager:
    """
    📋 Gestor de Políticas de Retenção ML
    
    Sistema automático que aplica políticas de retenção baseadas
    em critérios configuráveis como tempo, uso, qualidade, etc.
    """
    
    def __init__(self, db_manager: Optional[DatabaseManager] = None):
        """Inicializar gestor de políticas"""
        
        self.db_manager = db_manager or DatabaseManager()
        
        # Políticas ativas
        self.active_policies: Dict[str, RetentionPolicy] = {}
        
        # Histórico de execuções
        self.execution_history: List[PolicyExecution] = []
        
        # Configurações
        self.config = {
            'max_execution_time_minutes': 30,
            'batch_size': 1000,
            'safety_threshold': 0.1,  # Não deletar mais de 10% dos dados de uma vez
            'dry_run_mode': False,
            'notification_enabled': True
        }
        
        # Métricas
        self.metrics = {
            'policies_executed': 0,
            'total_records_cleaned': 0,
            'total_space_freed_mb': 0,
            'last_cleanup': None
        }
        
        # Task de execução automática
        self.scheduler_task = None
        
        logger.info("📋 ML Retention Policy Manager inicializado")
    
    # =====================================
    # 📋 GESTÃO DE POLÍTICAS
    # =====================================
    
    async def load_default_policies(self):
        """Carregar políticas padrão do sistema"""
        
        default_policies = [
            # Feature Store - Qualidade alta mantida por mais tempo
            RetentionPolicy(
                policy_id='fs_high_quality',
                name='High Quality Features',
                description='Manter características de alta qualidade por 2 anos',
                table_name='ml_feature_store',
                retention_days=730,
                min_access_count=5,
                min_quality_score=0.8,
                priority_threshold='high',
                execution_interval_hours=24
            ),
            
            RetentionPolicy(
                policy_id='fs_medium_quality',
                name='Medium Quality Features',
                description='Manter características de qualidade média por 1 ano',
                table_name='ml_feature_store',
                retention_days=365,
                min_access_count=2,
                min_quality_score=0.6,
                priority_threshold='normal',
                execution_interval_hours=24
            ),
            
            RetentionPolicy(
                policy_id='fs_low_quality',
                name='Low Quality Features',
                description='Limpar características de baixa qualidade após 3 meses',
                table_name='ml_feature_store',
                retention_days=90,
                min_access_count=1,
                min_quality_score=0.3,
                priority_threshold='low',
                execution_interval_hours=12
            ),
            
            # Training Cache - Baseado em uso
            RetentionPolicy(
                policy_id='tc_frequent',
                name='Frequent Training Cache',
                description='Cache de treino frequente mantido por 6 meses',
                table_name='ml_training_cache',
                retention_days=180,
                min_access_count=10,
                execution_interval_hours=48
            ),
            
            RetentionPolicy(
                policy_id='tc_occasional',
                name='Occasional Training Cache',
                description='Cache de treino ocasional mantido por 3 meses',
                table_name='ml_training_cache',
                retention_days=90,
                min_access_count=3,
                execution_interval_hours=24
            ),
            
            # Inference Cache - TTL baseado
            RetentionPolicy(
                policy_id='ic_expired',
                name='Expired Inference Cache',
                description='Limpar cache de inferência expirado',
                table_name='ml_inference_cache',
                retention_days=0,  # Imediato se expirado
                min_access_count=0,
                execution_interval_hours=6
            ),
            
            RetentionPolicy(
                policy_id='ic_old_unused',
                name='Old Unused Inference Cache',
                description='Limpar cache não usado há 7 dias',
                table_name='ml_inference_cache',
                retention_days=7,
                min_access_count=0,
                execution_interval_hours=12
            ),
            
            # Aggregated Series - Dados históricos importantes
            RetentionPolicy(
                policy_id='as_seasonal',
                name='Seasonal Aggregations',
                description='Manter agregações sazonais por 5 anos',
                table_name='aggregated_time_series',
                retention_days=1825,
                min_access_count=1,
                custom_filters={'time_window': 'seasonal'},
                execution_interval_hours=168  # Semanal
            ),
            
            # Performance Metrics - Limpeza regular
            RetentionPolicy(
                policy_id='pm_old_metrics',
                name='Old Performance Metrics',
                description='Limpar métricas antigas após 90 dias',
                table_name='ml_performance_metrics',
                retention_days=90,
                execution_interval_hours=24
            )
        ]
        
        # Carregar políticas
        for policy in default_policies:
            self.active_policies[policy.policy_id] = policy
        
        logger.info(f"✅ {len(default_policies)} políticas padrão carregadas")
    
    async def add_custom_policy(self, policy: RetentionPolicy):
        """Adicionar política personalizada"""
        self.active_policies[policy.policy_id] = policy
        logger.info(f"✅ Política personalizada adicionada: {policy.name}")
    
    async def remove_policy(self, policy_id: str):
        """Remover política"""
        if policy_id in self.active_policies:
            del self.active_policies[policy_id]
            logger.info(f"🗑️ Política removida: {policy_id}")
    
    async def update_policy(self, policy_id: str, updates: Dict[str, Any]):
        """Atualizar política existente"""
        if policy_id in self.active_policies:
            policy = self.active_policies[policy_id]
            
            for key, value in updates.items():
                if hasattr(policy, key):
                    setattr(policy, key, value)
            
            logger.info(f"🔄 Política atualizada: {policy_id}")
    
    # =====================================
    # 🚀 EXECUÇÃO DE POLÍTICAS
    # =====================================
    
    async def execute_all_policies(self, dry_run: bool = False) -> List[PolicyExecution]:
        """Executar todas as políticas ativas"""
        
        results = []
        
        for policy_id, policy in self.active_policies.items():
            if not policy.enabled:
                continue
            
            # Verificar se é hora de executar
            if policy.next_execution and datetime.now() < policy.next_execution:
                continue
            
            try:
                result = await self.execute_policy(policy, dry_run=dry_run)
                results.append(result)
                
                # Atualizar próxima execução
                policy.next_execution = datetime.now() + timedelta(hours=policy.execution_interval_hours)
                
            except Exception as e:
                logger.error(f"❌ Erro executando política {policy_id}: {e}")
                results.append(PolicyExecution(
                    policy_id=policy_id,
                    executed_at=datetime.now(),
                    records_processed=0,
                    records_affected=0,
                    space_freed_mb=0,
                    execution_time_seconds=0,
                    success=False,
                    error_message=str(e)
                ))
        
        return results
    
    async def execute_policy(self, policy: RetentionPolicy, dry_run: bool = False) -> PolicyExecution:
        """Executar uma política específica"""
        
        start_time = datetime.now()
        
        try:
            logger.info(f"🚀 Executando política: {policy.name} {'(DRY RUN)' if dry_run else ''}")
            
            # Construir query baseada na política
            query, params = self._build_cleanup_query(policy)
            
            # Contar registos que serão afetados
            count_query = query.replace('DELETE FROM', 'SELECT COUNT(*) FROM', 1)
            count_result = await self.db_manager.execute_query(count_query, params)
            records_to_process = count_result[0]['count'] if count_result else 0
            
            # Verificar safety threshold
            if not self._check_safety_threshold(policy.table_name, records_to_process):
                raise Exception(f"Safety threshold exceeded: {records_to_process} records")
            
            records_affected = 0
            space_freed_mb = 0
            
            if not dry_run and records_to_process > 0:
                # Executar limpeza em batches
                records_affected = await self._execute_cleanup_batches(query, params, policy)
                space_freed_mb = self._estimate_space_freed(policy.table_name, records_affected)
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            # Criar resultado
            result = PolicyExecution(
                policy_id=policy.policy_id,
                executed_at=start_time,
                records_processed=records_to_process,
                records_affected=records_affected,
                space_freed_mb=space_freed_mb,
                execution_time_seconds=execution_time,
                success=True
            )
            
            # Atualizar métricas
            self.metrics['policies_executed'] += 1
            self.metrics['total_records_cleaned'] += records_affected
            self.metrics['total_space_freed_mb'] += space_freed_mb
            self.metrics['last_cleanup'] = datetime.now()
            
            # Adicionar ao histórico
            self.execution_history.append(result)
            
            logger.info(f"✅ Política executada: {policy.name} - {records_affected} registos afetados")
            
            return result
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            
            logger.error(f"❌ Erro executando política {policy.name}: {e}")
            
            return PolicyExecution(
                policy_id=policy.policy_id,
                executed_at=start_time,
                records_processed=0,
                records_affected=0,
                space_freed_mb=0,
                execution_time_seconds=execution_time,
                success=False,
                error_message=str(e)
            )
    
    def _build_cleanup_query(self, policy: RetentionPolicy) -> Tuple[str, List[Any]]:
        """Construir query de limpeza baseada na política"""
        
        table_name = policy.table_name
        conditions = []
        params = []
        
        # Condição de tempo
        if policy.retention_days > 0:
            conditions.append("last_accessed < %s")
            cutoff_date = datetime.now() - timedelta(days=policy.retention_days)
            params.append(cutoff_date)
        
        # Condição de acesso mínimo
        if policy.min_access_count > 0:
            if table_name == 'ml_feature_store':
                conditions.append("access_count < %s")
            elif table_name in ['ml_training_cache', 'ml_inference_cache']:
                conditions.append("hit_count < %s")
            params.append(policy.min_access_count)
        
        # Condição de qualidade
        if policy.min_quality_score > 0 and table_name == 'ml_feature_store':
            conditions.append("quality_score < %s")
            params.append(policy.min_quality_score)
        
        # Condição de prioridade
        if policy.priority_threshold and table_name == 'ml_feature_store':
            priority_values = {
                'low': ['low'],
                'normal': ['low', 'normal'],
                'high': ['low', 'normal', 'high']
            }
            if policy.priority_threshold in priority_values:
                placeholders = ','.join(['%s'] * len(priority_values[policy.priority_threshold]))
                conditions.append(f"priority_level IN ({placeholders})")
                params.extend(priority_values[policy.priority_threshold])
        
        # Condições especiais para inference cache
        if table_name == 'ml_inference_cache':
            conditions.append("(expires_at < CURRENT_TIMESTAMP OR is_valid = false)")
        
        # Filtros personalizados
        for key, value in policy.custom_filters.items():
            conditions.append(f"{key} = %s")
            params.append(value)
        
        # Construir query final
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        query = f"DELETE FROM {table_name} WHERE {where_clause}"
        
        return query, params
    
    def _check_safety_threshold(self, table_name: str, records_to_delete: int) -> bool:
        """Verificar se a operação está dentro do limite de segurança"""
        
        # TODO: Implementar contagem real da tabela
        # Por agora, assumir que é seguro se < 1000 registos
        max_safe_delete = 1000
        
        if records_to_delete > max_safe_delete:
            logger.warning(f"⚠️ Safety check: {records_to_delete} > {max_safe_delete} para {table_name}")
            return False
        
        return True
    
    async def _execute_cleanup_batches(self, query: str, params: List[Any], policy: RetentionPolicy) -> int:
        """Executar limpeza em batches para evitar locks longos"""
        
        total_affected = 0
        batch_size = self.config['batch_size']
        
        # Modificar query para usar LIMIT
        batch_query = f"{query} LIMIT {batch_size}"
        
        while True:
            try:
                result = await self.db_manager.execute_query(batch_query, params)
                
                # Verificar quantos registos foram afetados
                affected_rows = getattr(result, 'rowcount', 0) if result else 0
                
                if affected_rows == 0:
                    break  # Não há mais registos para deletar
                
                total_affected += affected_rows
                
                # Pequena pausa entre batches
                await asyncio.sleep(0.1)
                
                # Limite de tempo de execução
                if total_affected > 10000:  # Limite de segurança
                    logger.warning(f"⚠️ Limite de execução atingido: {total_affected} registos")
                    break
                
            except Exception as e:
                logger.error(f"❌ Erro no batch de limpeza: {e}")
                break
        
        return total_affected
    
    def _estimate_space_freed(self, table_name: str, records_deleted: int) -> float:
        """Estimar espaço liberado"""
        
        # Estimativas de tamanho médio por registo (MB)
        size_estimates = {
            'ml_feature_store': 0.002,      # 2KB por entrada
            'ml_training_cache': 0.1,       # 100KB por entrada  
            'ml_inference_cache': 0.0005,   # 0.5KB por entrada
            'aggregated_time_series': 0.001, # 1KB por entrada
            'ml_performance_metrics': 0.0001 # 0.1KB por entrada
        }
        
        size_per_record = size_estimates.get(table_name, 0.001)
        return records_deleted * size_per_record
    
    # =====================================
    # ⏰ SCHEDULER AUTOMÁTICO
    # =====================================
    
    async def start_scheduler(self):
        """Iniciar scheduler automático de políticas"""
        if self.scheduler_task is None:
            self.scheduler_task = asyncio.create_task(self._scheduler_loop())
            logger.info("⏰ Scheduler de políticas iniciado")
    
    async def stop_scheduler(self):
        """Parar scheduler automático"""
        if self.scheduler_task:
            self.scheduler_task.cancel()
            try:
                await self.scheduler_task
            except asyncio.CancelledError:
                pass
            self.scheduler_task = None
            logger.info("⏹️ Scheduler de políticas parado")
    
    async def _scheduler_loop(self):
        """Loop principal do scheduler"""
        logger.info("⏰ Scheduler loop iniciado")
        
        try:
            while True:
                try:
                    # Executar políticas que estão na hora
                    results = await self.execute_all_policies(dry_run=self.config['dry_run_mode'])
                    
                    if results:
                        executed_count = sum(1 for r in results if r.success)
                        logger.info(f"📊 Scheduler executou {executed_count} políticas")
                    
                    # Aguardar próximo ciclo (1 hora)
                    await asyncio.sleep(3600)
                    
                except Exception as e:
                    logger.error(f"❌ Erro no scheduler loop: {e}")
                    await asyncio.sleep(300)  # Aguardar 5 minutos em caso de erro
                    
        except asyncio.CancelledError:
            logger.info("🛑 Scheduler loop cancelado")
            raise
    
    # =====================================
    # 📊 MONITORING & REPORTING
    # =====================================
    
    def get_policy_status(self) -> Dict[str, Any]:
        """Obter status de todas as políticas"""
        
        policies_status = {}
        
        for policy_id, policy in self.active_policies.items():
            policies_status[policy_id] = {
                'name': policy.name,
                'enabled': policy.enabled,
                'table_name': policy.table_name,
                'retention_days': policy.retention_days,
                'next_execution': policy.next_execution.isoformat() if policy.next_execution else None,
                'execution_interval_hours': policy.execution_interval_hours
            }
        
        return {
            'total_policies': len(self.active_policies),
            'enabled_policies': sum(1 for p in self.active_policies.values() if p.enabled),
            'policies': policies_status,
            'scheduler_running': self.scheduler_task is not None and not self.scheduler_task.done(),
            'metrics': self.metrics
        }
    
    def get_execution_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Obter histórico de execuções"""
        
        recent_executions = self.execution_history[-limit:]
        
        return [
            {
                'policy_id': ex.policy_id,
                'executed_at': ex.executed_at.isoformat(),
                'records_processed': ex.records_processed,
                'records_affected': ex.records_affected,
                'space_freed_mb': ex.space_freed_mb,
                'execution_time_seconds': ex.execution_time_seconds,
                'success': ex.success,
                'error_message': ex.error_message
            }
            for ex in recent_executions
        ]
    
    async def generate_cleanup_report(self) -> Dict[str, Any]:
        """Gerar relatório de limpeza"""
        
        # Estatísticas por tabela
        table_stats = {}
        
        for policy in self.active_policies.values():
            if policy.table_name not in table_stats:
                table_stats[policy.table_name] = {
                    'policies_count': 0,
                    'total_records_cleaned': 0,
                    'total_space_freed_mb': 0
                }
            
            table_stats[policy.table_name]['policies_count'] += 1
        
        # Adicionar dados do histórico
        for execution in self.execution_history:
            policy = self.active_policies.get(execution.policy_id)
            if policy and policy.table_name in table_stats:
                table_stats[policy.table_name]['total_records_cleaned'] += execution.records_affected
                table_stats[policy.table_name]['total_space_freed_mb'] += execution.space_freed_mb
        
        return {
            'report_generated_at': datetime.now().isoformat(),
            'total_policies': len(self.active_policies),
            'total_executions': len(self.execution_history),
            'total_records_cleaned': self.metrics['total_records_cleaned'],
            'total_space_freed_mb': self.metrics['total_space_freed_mb'],
            'last_cleanup': self.metrics['last_cleanup'].isoformat() if self.metrics['last_cleanup'] else None,
            'table_statistics': table_stats,
            'recent_executions': self.get_execution_history(10)
        }


# =====================================
# 🚀 FACTORY & HELPERS
# =====================================

def create_policy_manager(auto_start: bool = True) -> MLRetentionPolicyManager:
    """
    Factory para criar gestor de políticas
    
    Args:
        auto_start: Iniciar scheduler automaticamente
    """
    
    manager = MLRetentionPolicyManager()
    
    # Carregar políticas padrão
    asyncio.create_task(manager.load_default_policies())
    
    if auto_start:
        # Iniciar scheduler
        asyncio.create_task(manager.start_scheduler())
    
    return manager


# Instância global
policy_manager = None

def get_policy_manager() -> MLRetentionPolicyManager:
    """Obter instância global do gestor de políticas"""
    global policy_manager
    
    if policy_manager is None:
        policy_manager = create_policy_manager()
    
    return policy_manager


if __name__ == "__main__":
    # Teste básico
    async def test_policies():
        manager = create_policy_manager(auto_start=False)
        await manager.load_default_policies()
        
        status = manager.get_policy_status()
        print("📋 Policy Status:", json.dumps(status, indent=2, default=str))
        
        # Teste dry run
        results = await manager.execute_all_policies(dry_run=True)
        print(f"🧪 Dry run executou {len(results)} políticas")
    
    asyncio.run(test_policies())
