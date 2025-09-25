#!/usr/bin/env python3
"""
BGAPP Configuration Manager - Gestor de Configurações Centralizadas
Criar gestor de configurações centralizadas para todos os serviços BGAPP
com versionamento, rollback automático e interface de gestão.
"""

import json
import yaml
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import copy
import hashlib

# Configurar logging
logger = logging.getLogger(__name__)


class ConfigType(Enum):
    """Tipos de configuração"""
    SYSTEM = "sistema"
    DATABASE = "base_dados"
    API = "api"
    SECURITY = "seguranca"
    MONITORING = "monitorizacao"
    PROCESSING = "processamento"
    COPERNICUS = "copernicus"
    USER_INTERFACE = "interface_utilizador"
    BACKUP = "backup"


class ConfigFormat(Enum):
    """Formatos de configuração"""
    JSON = "json"
    YAML = "yaml"
    ENV = "env"
    PYTHON = "python"


@dataclass
class ConfigVersion:
    """Versão de configuração"""
    version_id: str
    config_id: str
    version_number: int
    created_at: datetime
    created_by: str
    description: str
    config_data: Dict[str, Any]
    config_hash: str
    active: bool
    metadata: Dict[str, Any]


@dataclass
class ConfigurationItem:
    """Item de configuração"""
    config_id: str
    name: str
    description: str
    config_type: ConfigType
    config_format: ConfigFormat
    file_path: Optional[str]
    current_version: int
    versions: List[ConfigVersion]
    last_modified: datetime
    last_modified_by: str
    validation_schema: Optional[Dict[str, Any]]
    requires_restart: bool
    sensitive_data: bool
    metadata: Dict[str, Any]


class ConfigurationManager:
    """
    ⚙️ Gestor de Configurações Centralizadas BGAPP
    
    Sistema completo de gestão de configurações com versionamento,
    rollback automático e validação para todos os serviços BGAPP.
    """
    
    def __init__(self):
        """Inicializar gestor de configurações"""
        
        # Diretório base de configurações
        self.config_base_dir = Path('/app/configs')
        self.config_base_dir.mkdir(parents=True, exist_ok=True)
        
        # Registry de configurações
        self.configurations_registry = {}
        
        # Configurações padrão do sistema BGAPP
        self.default_configurations = self._initialize_default_configs()
        
        # Métricas de configuração
        self.config_metrics = {
            'total_configurations': 0,
            'active_configurations': 0,
            'total_versions': 0,
            'pending_changes': 0,
            'last_backup': None,
            'configurations_requiring_restart': 0
        }
        
        # Inicializar configurações padrão
        self._create_default_configurations()
    
    def _initialize_default_configs(self) -> Dict[str, Dict[str, Any]]:
        """Inicializar configurações padrão do sistema"""
        
        return {
            'bgapp_system': {
                'name': 'Configurações do Sistema BGAPP',
                'type': ConfigType.SYSTEM,
                'format': ConfigFormat.YAML,
                'data': {
                    'system': {
                        'name': 'BGAPP - MARÍTIMO ANGOLA',
                        'version': '2.0.0',
                        'environment': 'production',
                        'debug': False,
                        'timezone': 'Africa/Luanda',
                        'language': 'pt'
                    },
                    'angola_zee': {
                        'area_km2': 518000,
                        'continental_bounds': {
                            'north': -6.02,
                            'south': -17.266,
                            'east': 17.5,
                            'west': 8.5
                        },
                        'cabinda_bounds': {
                            'north': -4.2,
                            'south': -6.02,
                            'east': 13.5,
                            'west': 11.5
                        }
                    },
                    'logging': {
                        'level': 'INFO',
                        'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                        'file_rotation': True,
                        'max_file_size_mb': 100
                    }
                },
                'requires_restart': True
            },
            'database_config': {
                'name': 'Configurações de Base de Dados',
                'type': ConfigType.DATABASE,
                'format': ConfigFormat.YAML,
                'data': {
                    'postgresql': {
                        'host': 'localhost',
                        'port': 5432,
                        'database': 'bgapp',
                        'username': 'bgapp_user',
                        'pool_size': 20,
                        'max_overflow': 30,
                        'pool_timeout': 30,
                        'pool_recycle': 3600
                    },
                    'timescaledb': {
                        'host': 'localhost',
                        'port': 5432,
                        'database': 'timescaledb',
                        'username': 'timescale_user',
                        'compression': True,
                        'retention_policy': '1 year'
                    },
                    'redis': {
                        'host': 'localhost',
                        'port': 6379,
                        'database': 0,
                        'password': None,
                        'max_connections': 100,
                        'socket_timeout': 30
                    }
                },
                'requires_restart': True,
                'sensitive': True
            },
            'copernicus_config': {
                'name': 'Configurações Copernicus CMEMS',
                'type': ConfigType.COPERNICUS,
                'format': ConfigFormat.YAML,
                'data': {
                    'authentication': {
                        'username': 'majearcasa@gmail.com',
                        'service_url': 'https://my.cmems-du.eu/motu-web/Motu',
                        'identity_url': 'https://identity.dataspace.copernicus.eu'
                    },
                    'angola_datasets': {
                        'physics': 'GLOBAL_ANALYSISFORECAST_PHY_001_024',
                        'biogeochemistry': 'GLOBAL_ANALYSISFORECAST_BGC_001_028',
                        'waves': 'GLOBAL_ANALYSISFORECAST_WAV_001_027'
                    },
                    'auto_processing': {
                        'enabled': True,
                        'daily_update_time': '06:00',
                        'variables_priority': ['thetao', 'so', 'chl', 'uo', 'vo'],
                        'retention_days': 30
                    },
                    'spatial_bounds': {
                        'north': -4.2,
                        'south': -18.2,
                        'east': 17.5,
                        'west': 8.5
                    }
                },
                'requires_restart': False,
                'sensitive': True
            },
            'api_config': {
                'name': 'Configurações de APIs',
                'type': ConfigType.API,
                'format': ConfigFormat.YAML,
                'data': {
                    'cors': {
                        'allowed_origins': ['*'],
                        'allowed_methods': ['GET', 'POST', 'PUT', 'DELETE'],
                        'allowed_headers': ['*'],
                        'allow_credentials': True
                    },
                    'rate_limiting': {
                        'enabled': True,
                        'requests_per_minute': 100,
                        'burst_size': 200
                    },
                    'authentication': {
                        'required': True,
                        'token_expiry_hours': 8,
                        'max_failed_attempts': 5
                    },
                    'endpoints': {
                        'admin_dashboard': '/admin-dashboard',
                        'health_check': '/health',
                        'api_docs': '/docs'
                    }
                },
                'requires_restart': True
            },
            'monitoring_config': {
                'name': 'Configurações de Monitorização',
                'type': ConfigType.MONITORING,
                'format': ConfigFormat.YAML,
                'data': {
                    'health_checks': {
                        'enabled': True,
                        'interval_seconds': 60,
                        'timeout_seconds': 30,
                        'retry_count': 3
                    },
                    'alerts': {
                        'enabled': True,
                        'email_notifications': True,
                        'webhook_notifications': False,
                        'alert_thresholds': {
                            'cpu_warning': 80,
                            'cpu_critical': 95,
                            'memory_warning': 85,
                            'memory_critical': 95,
                            'disk_warning': 85,
                            'disk_critical': 95
                        }
                    },
                    'metrics': {
                        'collection_enabled': True,
                        'retention_days': 90,
                        'aggregation_intervals': ['1m', '5m', '1h', '1d']
                    }
                },
                'requires_restart': False
            },
            'user_interface_config': {
                'name': 'Configurações de Interface',
                'type': ConfigType.USER_INTERFACE,
                'format': ConfigFormat.JSON,
                'data': {
                    'branding': {
                        'name': 'MARÍTIMO ANGOLA',
                        'logo_enabled': True,
                        'primary_color': '#1e3a8a',
                        'accent_color': '#dc2626',
                        'theme': 'light'
                    },
                    'dashboard': {
                        'auto_refresh_seconds': 30,
                        'default_language': 'pt',
                        'date_format': 'DD/MM/YYYY',
                        'time_format': '24h'
                    },
                    'maps': {
                        'default_map_type': 'folium',
                        'default_zoom': 6,
                        'center_coordinates': [-12.5, 13.5],
                        'show_zee_boundaries': True,
                        'show_fishing_zones': True,
                        'show_ports': True
                    },
                    'features': {
                        'biologist_interface_enabled': True,
                        'fisherman_interface_enabled': True,
                        'advanced_analytics_enabled': True,
                        'copernicus_integration_enabled': True
                    }
                },
                'requires_restart': False
            }
        }
    
    def _create_default_configurations(self):
        """Criar configurações padrão"""
        
        for config_id, config_data in self.default_configurations.items():
            
            # Calcular hash da configuração
            config_json = json.dumps(config_data['data'], sort_keys=True)
            config_hash = hashlib.sha256(config_json.encode()).hexdigest()
            
            # Criar versão inicial
            initial_version = ConfigVersion(
                version_id=str(uuid.uuid4()),
                config_id=config_id,
                version_number=1,
                created_at=datetime.now(),
                created_by="system",
                description="Configuração inicial do sistema",
                config_data=copy.deepcopy(config_data['data']),
                config_hash=config_hash,
                active=True,
                metadata={'initial_version': True}
            )
            
            # Criar item de configuração
            config_item = ConfigurationItem(
                config_id=config_id,
                name=config_data['name'],
                description=f"Configurações {config_data['type'].value}",
                config_type=config_data['type'],
                config_format=config_data['format'],
                file_path=str(self.config_base_dir / f"{config_id}.{config_data['format'].value}"),
                current_version=1,
                versions=[initial_version],
                last_modified=datetime.now(),
                last_modified_by="system",
                validation_schema=None,
                requires_restart=config_data.get('requires_restart', False),
                sensitive_data=config_data.get('sensitive', False),
                metadata={'auto_generated': True}
            )
            
            # Registar configuração
            self.configurations_registry[config_id] = config_item
            
            # Salvar ficheiro de configuração
            self._save_config_file(config_item, initial_version)
        
        # Atualizar métricas
        self.config_metrics['total_configurations'] = len(self.configurations_registry)
        self.config_metrics['active_configurations'] = len(self.configurations_registry)
        self.config_metrics['total_versions'] = sum(len(config.versions) for config in self.configurations_registry.values())
        
        logger.info(f"⚙️ Configurações padrão criadas: {len(self.configurations_registry)} items")
    
    def _save_config_file(self, config_item: ConfigurationItem, version: ConfigVersion):
        """Salvar ficheiro de configuração"""
        
        file_path = Path(config_item.file_path)
        
        try:
            if config_item.config_format == ConfigFormat.JSON:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(version.config_data, f, indent=2, ensure_ascii=False)
            elif config_item.config_format == ConfigFormat.YAML:
                with open(file_path, 'w', encoding='utf-8') as f:
                    yaml.dump(version.config_data, f, default_flow_style=False, allow_unicode=True)
            elif config_item.config_format == ConfigFormat.ENV:
                with open(file_path, 'w', encoding='utf-8') as f:
                    for key, value in version.config_data.items():
                        f.write(f"{key}={value}\n")
            
            logger.info(f"💾 Configuração salva: {file_path}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao salvar configuração {config_item.config_id}: {e}")
            raise
    
    async def update_configuration(self, 
                                 config_id: str,
                                 new_config_data: Dict[str, Any],
                                 description: str,
                                 updated_by: str) -> str:
        """
        🔄 Atualizar configuração
        
        Args:
            config_id: ID da configuração
            new_config_data: Novos dados de configuração
            description: Descrição da alteração
            updated_by: Quem fez a alteração
            
        Returns:
            ID da nova versão
        """
        
        if config_id not in self.configurations_registry:
            raise ValueError(f"Configuração '{config_id}' não encontrada")
        
        config_item = self.configurations_registry[config_id]
        
        # Validar nova configuração
        await self._validate_configuration(config_id, new_config_data)
        
        # Calcular hash da nova configuração
        config_json = json.dumps(new_config_data, sort_keys=True)
        config_hash = hashlib.sha256(config_json.encode()).hexdigest()
        
        # Verificar se configuração realmente mudou
        current_version = config_item.versions[-1]
        if config_hash == current_version.config_hash:
            logger.info(f"⚠️ Configuração {config_id} não alterada (hash igual)")
            return current_version.version_id
        
        # Desativar versão atual
        current_version.active = False
        
        # Criar nova versão
        new_version_number = config_item.current_version + 1
        new_version = ConfigVersion(
            version_id=str(uuid.uuid4()),
            config_id=config_id,
            version_number=new_version_number,
            created_at=datetime.now(),
            created_by=updated_by,
            description=description,
            config_data=copy.deepcopy(new_config_data),
            config_hash=config_hash,
            active=True,
            metadata={'previous_version': current_version.version_id}
        )
        
        # Atualizar item de configuração
        config_item.versions.append(new_version)
        config_item.current_version = new_version_number
        config_item.last_modified = datetime.now()
        config_item.last_modified_by = updated_by
        
        # Salvar nova configuração
        self._save_config_file(config_item, new_version)
        
        # Atualizar métricas
        self.config_metrics['total_versions'] += 1
        if config_item.requires_restart:
            self.config_metrics['configurations_requiring_restart'] += 1
        
        logger.info(f"🔄 Configuração atualizada: {config_id} v{new_version_number}")
        
        return new_version.version_id
    
    async def _validate_configuration(self, config_id: str, config_data: Dict[str, Any]):
        """Validar configuração"""
        
        config_item = self.configurations_registry[config_id]
        
        # Validações básicas
        if not isinstance(config_data, dict):
            raise ValueError("Dados de configuração devem ser um dicionário")
        
        # Validações específicas por tipo
        if config_item.config_type == ConfigType.DATABASE:
            await self._validate_database_config(config_data)
        elif config_item.config_type == ConfigType.API:
            await self._validate_api_config(config_data)
        elif config_item.config_type == ConfigType.COPERNICUS:
            await self._validate_copernicus_config(config_data)
        
        logger.info(f"✅ Configuração {config_id} validada")
    
    async def _validate_database_config(self, config_data: Dict[str, Any]):
        """Validar configuração de base de dados"""
        
        required_fields = ['postgresql', 'timescaledb', 'redis']
        
        for field in required_fields:
            if field not in config_data:
                raise ValueError(f"Campo obrigatório ausente: {field}")
        
        # Validar configuração PostgreSQL
        pg_config = config_data['postgresql']
        required_pg_fields = ['host', 'port', 'database', 'username']
        
        for field in required_pg_fields:
            if field not in pg_config:
                raise ValueError(f"Campo PostgreSQL obrigatório ausente: {field}")
        
        # Validar porta
        if not isinstance(pg_config['port'], int) or pg_config['port'] <= 0:
            raise ValueError("Porta PostgreSQL deve ser um número positivo")
    
    async def _validate_api_config(self, config_data: Dict[str, Any]):
        """Validar configuração de API"""
        
        required_sections = ['cors', 'rate_limiting', 'authentication']
        
        for section in required_sections:
            if section not in config_data:
                raise ValueError(f"Secção obrigatória ausente: {section}")
    
    async def _validate_copernicus_config(self, config_data: Dict[str, Any]):
        """Validar configuração Copernicus"""
        
        required_sections = ['authentication', 'angola_datasets', 'spatial_bounds']
        
        for section in required_sections:
            if section not in config_data:
                raise ValueError(f"Secção Copernicus obrigatória ausente: {section}")
        
        # Validar limites espaciais
        bounds = config_data['spatial_bounds']
        required_bounds = ['north', 'south', 'east', 'west']
        
        for bound in required_bounds:
            if bound not in bounds:
                raise ValueError(f"Limite espacial obrigatório ausente: {bound}")
    
    async def rollback_configuration(self, config_id: str, target_version: int, rolled_back_by: str) -> bool:
        """
        ↩️ Fazer rollback de configuração
        
        Args:
            config_id: ID da configuração
            target_version: Versão alvo para rollback
            rolled_back_by: Quem fez o rollback
            
        Returns:
            True se rollback bem-sucedido
        """
        
        if config_id not in self.configurations_registry:
            raise ValueError(f"Configuração '{config_id}' não encontrada")
        
        config_item = self.configurations_registry[config_id]
        
        # Encontrar versão alvo
        target_version_obj = None
        for version in config_item.versions:
            if version.version_number == target_version:
                target_version_obj = version
                break
        
        if not target_version_obj:
            raise ValueError(f"Versão {target_version} não encontrada para {config_id}")
        
        # Desativar versão atual
        current_version = config_item.versions[-1]
        current_version.active = False
        
        # Criar nova versão baseada na versão alvo (rollback)
        rollback_version = ConfigVersion(
            version_id=str(uuid.uuid4()),
            config_id=config_id,
            version_number=config_item.current_version + 1,
            created_at=datetime.now(),
            created_by=rolled_back_by,
            description=f"Rollback para versão {target_version}",
            config_data=copy.deepcopy(target_version_obj.config_data),
            config_hash=target_version_obj.config_hash,
            active=True,
            metadata={
                'rollback': True,
                'rollback_from_version': current_version.version_number,
                'rollback_to_version': target_version
            }
        )
        
        # Atualizar configuração
        config_item.versions.append(rollback_version)
        config_item.current_version = rollback_version.version_number
        config_item.last_modified = datetime.now()
        config_item.last_modified_by = rolled_back_by
        
        # Salvar configuração
        self._save_config_file(config_item, rollback_version)
        
        logger.info(f"↩️ Rollback realizado: {config_id} v{current_version.version_number} → v{target_version}")
        
        return True
    
    def generate_configuration_dashboard(self) -> str:
        """
        ⚙️ Gerar dashboard de gestão de configurações
        
        Returns:
            Dashboard HTML completo
        """
        
        # Atualizar métricas
        self._update_config_metrics()
        
        dashboard_html = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Gestão de Configurações - MARÍTIMO ANGOLA</title>
            <style>
                body {{
                    font-family: 'Courier New', monospace;
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
                    position: relative;
                }}
                .header::before {{
                    content: '⚙️';
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    font-size: 3em;
                    opacity: 0.3;
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
                .configs-section {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .config-card {{
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    background: #f9fafb;
                }}
                .config-system {{ border-left: 5px solid #1e3a8a; }}
                .config-base_dados {{ border-left: 5px solid #dc2626; }}
                .config-api {{ border-left: 5px solid #16a34a; }}
                .config-copernicus {{ border-left: 5px solid #0ea5e9; }}
                .config-monitorizacao {{ border-left: 5px solid #ea580c; }}
                .config-interface_utilizador {{ border-left: 5px solid #7c3aed; }}
                .version-history {{
                    background: #f0f9ff;
                    border: 1px solid #0ea5e9;
                    border-radius: 5px;
                    padding: 10px;
                    margin: 10px 0;
                    max-height: 150px;
                    overflow-y: auto;
                }}
                .config-editor {{
                    background: #1e1e1e;
                    color: #f8f8f2;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 10px 0;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    max-height: 200px;
                    overflow-y: auto;
                }}
                .btn-config {{
                    background: #1e3a8a;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                    margin: 2px;
                }}
                .btn-config:hover {{
                    background: #1e40af;
                }}
                .btn-warning {{
                    background: #ea580c;
                    color: white;
                }}
                .btn-danger {{
                    background: #dc2626;
                    color: white;
                }}
                .sensitive-data {{
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 4px;
                    padding: 5px 10px;
                    font-size: 11px;
                    display: inline-block;
                    margin: 5px 0;
                }}
                .restart-required {{
                    background: #fee2e2;
                    border: 1px solid #dc2626;
                    border-radius: 4px;
                    padding: 5px 10px;
                    font-size: 11px;
                    display: inline-block;
                    margin: 5px 0;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>⚙️ MARÍTIMO ANGOLA</h1>
                <h2>Gestão de Configurações BGAPP</h2>
                <p>Configurações Centralizadas com Versionamento</p>
            </div>
            
            <!-- Métricas de Configuração -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">{self.config_metrics['total_configurations']}</div>
                    <div class="metric-label">Configurações Total</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.config_metrics['active_configurations']}</div>
                    <div class="metric-label">Configurações Ativas</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.config_metrics['total_versions']}</div>
                    <div class="metric-label">Versões Total</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.config_metrics['pending_changes']}</div>
                    <div class="metric-label">Alterações Pendentes</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.config_metrics['configurations_requiring_restart']}</div>
                    <div class="metric-label">Requerem Reinício</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{len(ConfigType)}</div>
                    <div class="metric-label">Tipos de Config</div>
                </div>
            </div>
            
            <!-- Configurações do Sistema -->
            <div class="configs-section">
                <h3>📋 Configurações do Sistema</h3>
        """
        
        for config_item in self.configurations_registry.values():
            current_version = config_item.versions[-1]
            type_class = f"config-{config_item.config_type.value}"
            
            dashboard_html += f"""
            <div class="config-card {type_class}">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4>{config_item.name}</h4>
                        <p>{config_item.description}</p>
                        <p><strong>Tipo:</strong> {config_item.config_type.value.replace('_', ' ').title()} | 
                           <strong>Formato:</strong> {config_item.config_format.value.upper()} | 
                           <strong>Versão:</strong> v{config_item.current_version}</p>
                        <p><strong>Última modificação:</strong> {config_item.last_modified.strftime('%d/%m/%Y %H:%M')} por {config_item.last_modified_by}</p>
                        
                        {f'<div class="sensitive-data">🔒 Dados Sensíveis</div>' if config_item.sensitive_data else ''}
                        {f'<div class="restart-required">🔄 Requer Reinício</div>' if config_item.requires_restart else ''}
                        
                        <div class="version-history">
                            <strong>Histórico de Versões:</strong><br>
            """
            
            # Mostrar últimas 3 versões
            recent_versions = config_item.versions[-3:]
            for version in reversed(recent_versions):
                status = "✅ ATIVA" if version.active else "📜 Histórica"
                dashboard_html += f"""
                            v{version.version_number}: {version.description} - {version.created_by} 
                            ({version.created_at.strftime('%d/%m %H:%M')}) {status}<br>
                """
            
            dashboard_html += f"""
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <button class="btn-config" onclick="editConfig('{config_item.config_id}')">
                            ✏️ Editar
                        </button>
                        <button class="btn-config btn-warning" onclick="viewConfig('{config_item.config_id}')">
                            👁️ Ver
                        </button>
                        <button class="btn-config" onclick="showVersionHistory('{config_item.config_id}')">
                            📜 Histórico
                        </button>
                        <br>
                        <button class="btn-config btn-warning" onclick="rollbackConfig('{config_item.config_id}')">
                            ↩️ Rollback
                        </button>
                        <button class="btn-config" onclick="exportConfig('{config_item.config_id}')">
                            📤 Exportar
                        </button>
                    </div>
                </div>
                
                <!-- Preview da configuração -->
                <div class="config-editor">
            """
            
            # Mostrar preview da configuração (primeiras linhas)
            config_preview = json.dumps(current_version.config_data, indent=2)[:500]
            if len(config_preview) >= 500:
                config_preview += "\n... (truncado)"
            
            dashboard_html += config_preview.replace('<', '&lt;').replace('>', '&gt;')
            
            dashboard_html += """
                </div>
            </div>
            """
        
        dashboard_html += f"""
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; background: white; padding: 20px; border-radius: 10px;">
                <p><em>Sistema de gestão de configurações BGAPP</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Configurações Versionadas e Seguras</p>
                <p>Diretório base: {self.config_base_dir}</p>
                <p>Última atualização: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
            </div>
            
            <script>
                function editConfig(configId) {{
                    alert('Editor de configuração: ' + configId + '\\n\\nEm implementação completa, isto abriria editor completo.');
                }}
                
                function viewConfig(configId) {{
                    alert('Visualizar configuração: ' + configId + '\\n\\nEm implementação completa, isto mostraria configuração completa.');
                }}
                
                function showVersionHistory(configId) {{
                    alert('Histórico de versões: ' + configId + '\\n\\nEm implementação completa, isto mostraria histórico completo.');
                }}
                
                function rollbackConfig(configId) {{
                    const version = prompt('Fazer rollback para qual versão?\\n\\nDigite o número da versão:');
                    if (version) {{
                        if (confirm('ATENÇÃO: Fazer rollback da configuração ' + configId + ' para versão ' + version + '?\\n\\nIsto pode afetar o funcionamento do sistema!')) {{
                            alert('Rollback realizado para versão: ' + version);
                        }}
                    }}
                }}
                
                function exportConfig(configId) {{
                    alert('Exportar configuração: ' + configId + '\\n\\nEm implementação completa, isto exportaria a configuração.');
                }}
                
                console.log('⚙️ BGAPP Configuration Manager carregado');
            </script>
        </body>
        </html>
        """
        
        return dashboard_html
    
    def _update_config_metrics(self):
        """Atualizar métricas de configuração"""
        
        # Contar configurações que requerem reinício
        restart_required = sum(
            1 for config in self.configurations_registry.values()
            if config.requires_restart and len(config.versions) > 1
        )
        
        self.config_metrics['configurations_requiring_restart'] = restart_required
    
    def get_configuration(self, config_id: str, version: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        📖 Obter configuração
        
        Args:
            config_id: ID da configuração
            version: Versão específica (None para atual)
            
        Returns:
            Dados da configuração
        """
        
        if config_id not in self.configurations_registry:
            return None
        
        config_item = self.configurations_registry[config_id]
        
        if version is None:
            # Retornar versão atual
            current_version = config_item.versions[-1]
            return current_version.config_data
        else:
            # Retornar versão específica
            for ver in config_item.versions:
                if ver.version_number == version:
                    return ver.config_data
            return None
    
    def export_all_configurations(self) -> str:
        """
        📤 Exportar todas as configurações
        
        Returns:
            JSON com todas as configurações
        """
        
        export_data = {
            'export_timestamp': datetime.now().isoformat(),
            'bgapp_version': '2.0.0',
            'configurations': {}
        }
        
        for config_id, config_item in self.configurations_registry.items():
            current_version = config_item.versions[-1]
            
            export_data['configurations'][config_id] = {
                'name': config_item.name,
                'type': config_item.config_type.value,
                'format': config_item.config_format.value,
                'current_version': config_item.current_version,
                'requires_restart': config_item.requires_restart,
                'sensitive_data': config_item.sensitive_data,
                'config_data': current_version.config_data if not config_item.sensitive_data else {'REDACTED': True},
                'last_modified': config_item.last_modified.isoformat(),
                'versions_count': len(config_item.versions)
            }
        
        return json.dumps(export_data, indent=2, ensure_ascii=False)


# Instância global do gestor de configurações
configuration_manager = ConfigurationManager()
