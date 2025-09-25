"""
BGAPP - Sistema de Gestão de Biodiversidade e Oceanografia
"""

__version__ = "1.2.0"
__author__ = "BGAPP Team"

# Importações principais
try:
    from .admin_api import app
    from .async_processing import celery_app
except ImportError:
    # Importações opcionais para evitar erros de dependências
    app = None
    celery_app = None

__all__ = [
    "app",
    "celery_app",
    "__version__",
    "__author__"
]
