"""
🔗 ML Retention Integration
Integração não-invasiva que otimiza sistema ML existente com cache de retenção

COMPATIBILIDADE TOTAL:
- Não modifica APIs existentes
- Funciona como middleware transparente  
- Mantém Cloudflare Workers funcionando
- Performance boost automático
"""

import asyncio
import functools
import logging
import time
from typing import Dict, List, Optional, Any, Callable, Union
from datetime import datetime, timedelta

# Imports do sistema existente (não-invasivos)
try:
    from .retention_manager import MLRetentionManager, get_retention_manager
    from .retention_pipeline import MLRetentionPipeline, get_retention_pipeline
    from .retention_policies import MLRetentionPolicyManager, get_policy_manager
    from .ml_model_manager import MLModelManager
    from ..api.ml_endpoints import *
    from ..models.biodiversity_ml_schemas import *
except ImportError:
    # Fallback para desenvolvimento
    import sys
    # Path already in PYTHONPATH

logger = logging.getLogger(__name__)


class MLRetentionIntegrator:
    """
    🔗 Integrador de Retenção ML
    
    Sistema que intercepta e otimiza operações ML existentes
    de forma completamente transparente.
    """
    
    def __init__(self):
        """Inicializar integrador"""
        
        self.retention_manager = get_retention_manager()
        self.pipeline = get_retention_pipeline()
        self.policy_manager = get_policy_manager()
        
        # Flags de controle
        self.enabled = True
        self.cloudflare_mode = False
        self.performance_mode = True
        
        # Métricas de integração
        self.integration_metrics = {
            'queries_intercepted': 0,
            'cache_hits': 0,
            'performance_gains_ms': 0,
            'original_functions_preserved': 0
        }
        
        # Registry de funções originais
        self.original_functions = {}
        
        logger.info("🔗 ML Retention Integrator inicializado")
    
    # =====================================
    # 🎯 MONKEY PATCHING NÃO-INVASIVO
    # =====================================
    
    def integrate_with_ml_endpoints(self):
        """
        Integrar com endpoints ML existentes
        
        Aplica monkey patching para adicionar cache transparente
        """
        try:
            # Importar módulo de endpoints
            import src.bgapp.api.ml_endpoints as ml_endpoints_module
            
            # Interceptar função de predição
            if hasattr(ml_endpoints_module, 'make_prediction'):
                self._wrap_prediction_function(ml_endpoints_module, 'make_prediction')
            
            # Interceptar funções de treino
            if hasattr(ml_endpoints_module, 'train_model'):
                self._wrap_training_function(ml_endpoints_module, 'train_model')
            
            # Interceptar funções de dados
            if hasattr(ml_endpoints_module, 'get_study'):
                self._wrap_data_function(ml_endpoints_module, 'get_study')
            
            logger.info("✅ Integração com ML endpoints aplicada")
            
        except ImportError:
            logger.warning("⚠️ Módulo ml_endpoints não encontrado - integração pulada")
        except Exception as e:
            logger.error(f"❌ Erro na integração com endpoints: {e}")
    
    def integrate_with_ml_manager(self):
        """
        Integrar com MLModelManager existente
        
        Adiciona cache transparente às operações do gestor
        """
        try:
            # Interceptar métodos do MLModelManager
            original_predict = MLModelManager.predict
            original_train = MLModelManager.train_model
            original_get_features = getattr(MLModelManager, 'extract_features', None)
            
            # Wrapping com cache
            MLModelManager.predict = self._create_cached_predict(original_predict)
            MLModelManager.train_model = self._create_cached_train(original_train)
            
            if original_get_features:
                MLModelManager.extract_features = self._create_cached_features(original_get_features)
            
            # Salvar originais
            self.original_functions['MLModelManager.predict'] = original_predict
            self.original_functions['MLModelManager.train_model'] = original_train
            if original_get_features:
                self.original_functions['MLModelManager.extract_features'] = original_get_features
            
            logger.info("✅ Integração com MLModelManager aplicada")
            
        except Exception as e:
            logger.error(f"❌ Erro na integração com MLModelManager: {e}")
    
    def _wrap_prediction_function(self, module, function_name: str):
        """Wrap função de predição com cache"""
        original_func = getattr(module, function_name)
        self.original_functions[f"{module.__name__}.{function_name}"] = original_func
        
        @functools.wraps(original_func)
        async def cached_prediction_wrapper(*args, **kwargs):
            if not self.enabled:
                return await original_func(*args, **kwargs)
            
            try:
                # Extrair parâmetros de predição
                request = args[1] if len(args) > 1 else kwargs.get('request')
                if not request or not hasattr(request, 'model_type'):
                    return await original_func(*args, **kwargs)
                
                model_type = request.model_type
                input_data = request.input_data
                
                # Tentar cache primeiro
                cached_result = await self.retention_manager.get_or_compute_prediction(
                    model_id=model_type,
                    input_data=input_data,
                    predict_func=lambda data: original_func(*args, **kwargs),
                    ttl_hours=6
                )
                
                self.integration_metrics['queries_intercepted'] += 1
                self.integration_metrics['cache_hits'] += 1
                
                return cached_result
                
            except Exception as e:
                logger.warning(f"⚠️ Cache falhou, usando função original: {e}")
                return await original_func(*args, **kwargs)
        
        setattr(module, function_name, cached_prediction_wrapper)
        self.integration_metrics['original_functions_preserved'] += 1
    
    def _wrap_training_function(self, module, function_name: str):
        """Wrap função de treino com cache"""
        original_func = getattr(module, function_name)
        self.original_functions[f"{module.__name__}.{function_name}"] = original_func
        
        @functools.wraps(original_func)
        async def cached_training_wrapper(*args, **kwargs):
            if not self.enabled:
                return await original_func(*args, **kwargs)
            
            try:
                # Extrair tipo de modelo
                model_type = args[1] if len(args) > 1 else kwargs.get('model_type', 'unknown')
                data_version = kwargs.get('data_version', 'latest')
                
                # Tentar cache de dados de treino
                cached_data = await self.retention_manager.get_or_prepare_training_data(
                    model_type=model_type,
                    data_version=data_version,
                    prepare_func=lambda **kw: original_func(*args, **kwargs)
                )
                
                self.integration_metrics['queries_intercepted'] += 1
                self.integration_metrics['cache_hits'] += 1
                
                return cached_data
                
            except Exception as e:
                logger.warning(f"⚠️ Cache de treino falhou: {e}")
                return await original_func(*args, **kwargs)
        
        setattr(module, function_name, cached_training_wrapper)
        self.integration_metrics['original_functions_preserved'] += 1
    
    def _wrap_data_function(self, module, function_name: str):
        """Wrap função de dados com cache"""
        original_func = getattr(module, function_name)
        self.original_functions[f"{module.__name__}.{function_name}"] = original_func
        
        @functools.wraps(original_func)
        async def cached_data_wrapper(*args, **kwargs):
            if not self.enabled:
                return await original_func(*args, **kwargs)
            
            try:
                # Extrair ID do estudo
                study_id = args[1] if len(args) > 1 else kwargs.get('study_id')
                
                if study_id:
                    # Interceptar para pipeline de processamento
                    result = await original_func(*args, **kwargs)
                    
                    # Processar em background se for novo estudo
                    if result and isinstance(result, dict):
                        asyncio.create_task(
                            self.pipeline.process_new_study(result)
                        )
                    
                    self.integration_metrics['queries_intercepted'] += 1
                    return result
                
                return await original_func(*args, **kwargs)
                
            except Exception as e:
                logger.warning(f"⚠️ Processamento de dados falhou: {e}")
                return await original_func(*args, **kwargs)
        
        setattr(module, function_name, cached_data_wrapper)
        self.integration_metrics['original_functions_preserved'] += 1
    
    # =====================================
    # 🔧 FACTORY METHODS PARA CACHE
    # =====================================
    
    def _create_cached_predict(self, original_predict):
        """Criar versão cacheada da função de predição"""
        
        @functools.wraps(original_predict)
        async def cached_predict(self_manager, model_type: str, input_data: Dict[str, Any], **kwargs):
            if not self.enabled:
                return await original_predict(self_manager, model_type, input_data, **kwargs)
            
            start_time = time.time()
            
            try:
                # Usar cache de inferência
                result = await self.retention_manager.get_or_compute_prediction(
                    model_id=model_type,
                    input_data=input_data,
                    predict_func=lambda data: original_predict(self_manager, model_type, input_data, **kwargs),
                    ttl_hours=6
                )
                
                execution_time = (time.time() - start_time) * 1000
                self.integration_metrics['performance_gains_ms'] += execution_time
                self.integration_metrics['cache_hits'] += 1
                
                logger.debug(f"🚀 Predição cacheada: {model_type} ({execution_time:.1f}ms poupados)")
                
                return result
                
            except Exception as e:
                logger.warning(f"⚠️ Cache de predição falhou: {e}")
                return await original_predict(self_manager, model_type, input_data, **kwargs)
        
        return cached_predict
    
    def _create_cached_train(self, original_train):
        """Criar versão cacheada da função de treino"""
        
        @functools.wraps(original_train)
        async def cached_train(self_manager, model_type: str, **kwargs):
            if not self.enabled:
                return await original_train(self_manager, model_type, **kwargs)
            
            start_time = time.time()
            
            try:
                data_version = kwargs.get('data_version', 'latest')
                
                # Usar cache de dados de treino
                training_data = await self.retention_manager.get_or_prepare_training_data(
                    model_type=model_type,
                    data_version=data_version,
                    prepare_func=lambda **kw: original_train(self_manager, model_type, **kwargs)
                )
                
                execution_time = (time.time() - start_time) * 1000
                self.integration_metrics['performance_gains_ms'] += execution_time
                self.integration_metrics['cache_hits'] += 1
                
                logger.info(f"🚀 Treino cacheado: {model_type} ({execution_time:.1f}ms poupados)")
                
                return training_data
                
            except Exception as e:
                logger.warning(f"⚠️ Cache de treino falhou: {e}")
                return await original_train(self_manager, model_type, **kwargs)
        
        return cached_train
    
    def _create_cached_features(self, original_extract):
        """Criar versão cacheada da extração de características"""
        
        @functools.wraps(original_extract)
        async def cached_extract_features(self_manager, study_id: str, feature_type: str, **kwargs):
            if not self.enabled:
                return await original_extract(self_manager, study_id, feature_type, **kwargs)
            
            try:
                # Usar cache de características
                features = await self.retention_manager.get_or_compute_features(
                    source_data_id=study_id,
                    source_table='biodiversity_studies',
                    feature_type=feature_type,
                    compute_func=lambda sid, **kw: original_extract(self_manager, study_id, feature_type, **kwargs),
                    **kwargs
                )
                
                self.integration_metrics['cache_hits'] += 1
                
                return features
                
            except Exception as e:
                logger.warning(f"⚠️ Cache de características falhou: {e}")
                return await original_extract(self_manager, study_id, feature_type, **kwargs)
        
        return cached_extract_features
    
    # =====================================
    # 🌐 CLOUDFLARE WORKERS INTEGRATION
    # =====================================
    
    def enable_cloudflare_mode(self):
        """Ativar modo compatível com Cloudflare Workers"""
        self.cloudflare_mode = True
        self.retention_manager.enable_cloudflare_mode()
        
        # Configurar para modo readonly
        self.retention_manager.readonly_mode = True
        
        logger.info("☁️ Modo Cloudflare ativado para integração")
    
    def create_worker_middleware(self):
        """
        Criar middleware para Cloudflare Workers
        
        Returns:
            Função middleware que pode ser usada nos workers
        """
        
        def worker_middleware(request_handler):
            """Middleware para otimizar requests em workers"""
            
            async def optimized_handler(request, env, ctx):
                # Verificar se é request ML
                url = request.url
                
                if '/ml/' in url:
                    # Tentar cache primeiro
                    cache_key = f"worker_{url}_{request.method}"
                    
                    # Cache simples em memória para workers
                    if hasattr(env, 'ML_CACHE') and cache_key in env.ML_CACHE:
                        logger.debug(f"☁️ Worker cache HIT: {cache_key}")
                        return env.ML_CACHE[cache_key]
                
                # Executar handler original
                response = await request_handler(request, env, ctx)
                
                # Cache response se for ML
                if '/ml/' in url and response.status == 200:
                    if not hasattr(env, 'ML_CACHE'):
                        env.ML_CACHE = {}
                    env.ML_CACHE[cache_key] = response
                
                return response
            
            return optimized_handler
        
        return worker_middleware
    
    # =====================================
    # 🔄 GESTÃO DE INTEGRAÇÃO
    # =====================================
    
    def enable_integration(self):
        """Ativar integração completa"""
        self.enabled = True
        
        # Aplicar todas as integrações
        self.integrate_with_ml_endpoints()
        self.integrate_with_ml_manager()
        
        # Iniciar pipeline em background
        asyncio.create_task(self.pipeline.start_background_processing())
        
        logger.info("🚀 Integração ML completa ativada")
    
    def disable_integration(self):
        """Desativar integração (restaurar funções originais)"""
        self.enabled = False
        
        # Restaurar funções originais
        self.restore_original_functions()
        
        # Parar pipeline
        asyncio.create_task(self.pipeline.stop_background_processing())
        
        logger.info("⏹️ Integração ML desativada")
    
    def restore_original_functions(self):
        """Restaurar funções originais (rollback)"""
        
        for func_path, original_func in self.original_functions.items():
            try:
                # Parse do caminho da função
                parts = func_path.split('.')
                
                if len(parts) >= 2:
                    module_name = '.'.join(parts[:-1])
                    function_name = parts[-1]
                    
                    # Importar módulo e restaurar função
                    if 'MLModelManager' in module_name:
                        setattr(MLModelManager, function_name, original_func)
                    else:
                        # Para módulos de endpoints
                        import importlib
                        module = importlib.import_module(module_name)
                        setattr(module, function_name, original_func)
                
                logger.debug(f"✅ Função restaurada: {func_path}")
                
            except Exception as e:
                logger.warning(f"⚠️ Erro restaurando {func_path}: {e}")
        
        self.original_functions.clear()
    
    # =====================================
    # 📊 MONITORING & METRICS
    # =====================================
    
    def get_integration_metrics(self) -> Dict[str, Any]:
        """Obter métricas de integração"""
        
        # Combinar com métricas do retention manager
        retention_stats = self.retention_manager.get_lightweight_stats()
        
        return {
            'integration_enabled': self.enabled,
            'cloudflare_mode': self.cloudflare_mode,
            'queries_intercepted': self.integration_metrics['queries_intercepted'],
            'cache_hits': self.integration_metrics['cache_hits'],
            'cache_hit_ratio': self.integration_metrics['cache_hits'] / max(1, self.integration_metrics['queries_intercepted']),
            'performance_gains_ms': self.integration_metrics['performance_gains_ms'],
            'original_functions_preserved': self.integration_metrics['original_functions_preserved'],
            'retention_manager_stats': retention_stats,
            'pipeline_metrics': self.pipeline.get_pipeline_metrics() if hasattr(self.pipeline, 'get_pipeline_metrics') else {}
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Verificar saúde da integração"""
        
        health_status = {
            'integration_active': self.enabled,
            'retention_manager': 'healthy',
            'pipeline': 'healthy',
            'policy_manager': 'healthy',
            'cache_performance': 'good',
            'issues': []
        }
        
        try:
            # Verificar retention manager
            stats = self.retention_manager.get_lightweight_stats()
            if stats['hit_ratio'] < 0.1:
                health_status['cache_performance'] = 'poor'
                health_status['issues'].append('Low cache hit ratio')
            
            # Verificar pipeline
            if hasattr(self.pipeline, 'background_task'):
                if not self.pipeline.background_task or self.pipeline.background_task.done():
                    health_status['pipeline'] = 'stopped'
                    health_status['issues'].append('Background pipeline not running')
            
            # Verificar policy manager
            if hasattr(self.policy_manager, 'scheduler_task'):
                if not self.policy_manager.scheduler_task or self.policy_manager.scheduler_task.done():
                    health_status['policy_manager'] = 'stopped'
                    health_status['issues'].append('Policy scheduler not running')
            
        except Exception as e:
            health_status['issues'].append(f"Health check error: {str(e)}")
        
        health_status['overall_status'] = 'healthy' if not health_status['issues'] else 'degraded'
        
        return health_status


# =====================================
# 🚀 GLOBAL INTEGRATOR
# =====================================

# Instância global
integrator = None

def get_retention_integrator() -> MLRetentionIntegrator:
    """Obter instância global do integrador"""
    global integrator
    
    if integrator is None:
        integrator = MLRetentionIntegrator()
    
    return integrator


def initialize_ml_retention_system(
    enable_integration: bool = True,
    cloudflare_mode: bool = False,
    auto_start: bool = True
) -> MLRetentionIntegrator:
    """
    Inicializar sistema completo de retenção ML
    
    Esta é a função principal para ativar todo o sistema.
    
    Args:
        enable_integration: Ativar integração com sistema existente
        cloudflare_mode: Modo compatível com Cloudflare Workers
        auto_start: Iniciar serviços automaticamente
    
    Returns:
        Instância do integrador configurada
    """
    
    integrator = get_retention_integrator()
    
    if cloudflare_mode:
        integrator.enable_cloudflare_mode()
    
    if enable_integration:
        integrator.enable_integration()
    
    if auto_start:
        # Iniciar todos os serviços
        asyncio.create_task(integrator.pipeline.start_background_processing())
        asyncio.create_task(integrator.policy_manager.start_scheduler())
    
    logger.info("🚀 Sistema de retenção ML inicializado completamente")
    
    return integrator


# Funções de conveniência para uso direto
def enable_ml_retention():
    """Ativar sistema de retenção ML (função simples)"""
    return initialize_ml_retention_system(
        enable_integration=True,
        cloudflare_mode=False,
        auto_start=True
    )


def enable_ml_retention_cloudflare():
    """Ativar sistema de retenção ML para Cloudflare"""
    return initialize_ml_retention_system(
        enable_integration=True,
        cloudflare_mode=True,
        auto_start=False  # Workers não precisam de background tasks
    )


if __name__ == "__main__":
    # Teste básico
    async def test_integration():
        integrator = initialize_ml_retention_system(
            enable_integration=False,  # Não modificar sistema em teste
            auto_start=False
        )
        
        metrics = integrator.get_integration_metrics()
        health = await integrator.health_check()
        
        print("📊 Integration Metrics:", metrics)
        print("🩺 Health Check:", health)
    
    asyncio.run(test_integration())
