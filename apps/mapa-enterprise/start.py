#!/usr/bin/env python3
"""
Script de inicialização para Mapa Enterprise
"""

import os
import sys
import argparse
import logging
from pathlib import Path

# Adicionar src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from config.settings import get_config
from app import app, server
from integrations.integration_manager import IntegrationManager

def setup_logging():
    """Configurar logging"""
    config = get_config()

    # Criar diretório de logs
    log_dir = Path(config.LOG_FILE).parent
    log_dir.mkdir(exist_ok=True)

    logging.basicConfig(
        level=getattr(logging, config.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(config.LOG_FILE),
            logging.StreamHandler()
        ]
    )

    return logging.getLogger(__name__)

def check_dependencies():
    """Verificar dependências"""
    logger = logging.getLogger(__name__)

    try:
        import flask
        import dash
        import dash_leaflet
        import geopandas
        import pandas
        import requests
        import jwt
        import bcrypt

        logger.info("✅ Todas as dependências estão instaladas")
        return True

    except ImportError as e:
        logger.error(f"❌ Dependência faltando: {e}")
        logger.info("Instale as dependências com: pip install -r requirements.txt")
        return False

def check_environment():
    """Verificar configuração do ambiente"""
    logger = logging.getLogger(__name__)
    config = get_config()

    # Verificar tokens críticos
    missing_tokens = []
    if not config.COPERNICUS_USERNAME:
        missing_tokens.append("COPERNICUS_USERNAME")
    if not config.COPERNICUS_PASSWORD:
        missing_tokens.append("COPERNICUS_PASSWORD")
    if not config.GFW_API_KEY:
        missing_tokens.append("GFW_API_KEY")

    if missing_tokens:
        logger.warning(f"⚠️  Tokens não configurados: {', '.join(missing_tokens)}")
        logger.info("Configure os tokens no arquivo .env")
        logger.info("Algumas funcionalidades podem não funcionar sem os tokens")

    # Verificar conectividade
    try:
        manager = IntegrationManager()
        status = manager.get_status_summary()
        logger.info(f"✅ Status do sistema: {status['overall_status']}")
    except Exception as e:
        logger.error(f"❌ Erro ao verificar status do sistema: {e}")

def create_directories():
    """Criar diretórios necessários"""
    logger = logging.getLogger(__name__)

    directories = [
        'data',
        'data/models',
        'data/qgis',
        'logs'
    ]

    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        logger.info(f"✅ Diretório criado: {directory}")

def initialize_application():
    """Inicializar aplicação"""
    logger = logging.getLogger(__name__)

    logger.info("🚀 Inicializando Mapa Enterprise...")

    # Verificar dependências
    if not check_dependencies():
        return False

    # Criar diretórios
    create_directories()

    # Verificar ambiente
    check_environment()

    logger.info("✅ Aplicação inicializada com sucesso!")
    return True

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description='Mapa Enterprise - Sistema de Mapeamento')
    parser.add_argument('--host', default='0.0.0.0', help='Host para executar')
    parser.add_argument('--port', type=int, default=8050, help='Porta para executar')
    parser.add_argument('--debug', action='store_true', help='Executar em modo debug')
    parser.add_argument('--init', action='store_true', help='Apenas inicializar, não executar')

    args = parser.parse_args()

    # Configurar logging
    setup_logging()
    logger = logging.getLogger(__name__)

    # Inicializar
    if not initialize_application():
        sys.exit(1)

    if args.init:
        logger.info("✅ Inicialização concluída. Execute sem --init para iniciar o servidor.")
        return

    # Configurar modo debug
    if args.debug:
        os.environ['FLASK_ENV'] = 'development'

    # Executar aplicação
    logger.info(f"🌐 Iniciando servidor em {args.host}:{args.port}")
    logger.info("📱 Interface web disponível em: http://localhost:8050" if args.host == '0.0.0.0' else f"📱 Interface web disponível em: http://{args.host}:{args.port}")

    try:
        app.run(
            debug=args.debug,
            host=args.host,
            port=args.port
        )
    except KeyboardInterrupt:
        logger.info("🛑 Servidor interrompido pelo usuário")
    except Exception as e:
        logger.error(f"❌ Erro ao executar servidor: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
