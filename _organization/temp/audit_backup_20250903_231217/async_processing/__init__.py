"""
Módulo de Processamento Assíncrono BGAPP
Sistema de tarefas assíncronas usando Celery para processamento paralelo
"""

from .celery_app import celery_app
from .tasks import (
    process_oceanographic_data,
    process_species_data,
    generate_ml_predictions,
    generate_reports,
    backup_critical_data,
    cleanup_old_files,
    process_oceanographic_data_batch,
    generate_ml_predictions_batch,
    generate_daily_reports
)

__all__ = [
    'celery_app',
    'process_oceanographic_data',
    'process_species_data', 
    'generate_ml_predictions',
    'generate_reports',
    'backup_critical_data',
    'cleanup_old_files',
    'process_oceanographic_data_batch',
    'generate_ml_predictions_batch',
    'generate_daily_reports'
]

# Versão do módulo
__version__ = "1.0.0"
