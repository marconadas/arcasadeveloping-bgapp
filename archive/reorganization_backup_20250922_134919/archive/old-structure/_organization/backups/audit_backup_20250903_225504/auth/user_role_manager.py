#!/usr/bin/env python3
"""
BGAPP User Role Manager - Gestão de Utilizadores e Perfis
Sistema de gestão de utilizadores com perfis específicos para diferentes
tipos de utilizadores: Admin, Biólogo Marinho, Pescador, Investigador, Técnico.
"""

import hashlib
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import secrets

# Configurar logging
logger = logging.getLogger(__name__)


class UserRole(Enum):
    """Perfis de utilizador do sistema BGAPP"""
    ADMIN = "admin"
    MARINE_BIOLOGIST = "biologo_marinho"
    FISHERMAN = "pescador"
    RESEARCHER = "investigador"
    TECHNICIAN = "tecnico"
    GUEST = "convidado"


class Permission(Enum):
    """Permissões específicas do sistema"""
    # Permissões gerais
    READ_DATA = "ler_dados"
    WRITE_DATA = "escrever_dados"
    DELETE_DATA = "apagar_dados"
    
    # Permissões administrativas
    MANAGE_USERS = "gerir_utilizadores"
    MANAGE_SYSTEM = "gerir_sistema"
    MANAGE_BACKUPS = "gerir_backups"
    VIEW_LOGS = "ver_logs"
    MANAGE_CONFIG = "gerir_configuracao"
    
    # Permissões científicas
    RUN_ANALYSIS = "executar_analises"
    CREATE_WORKFLOWS = "criar_workflows"
    PUBLISH_REPORTS = "publicar_relatorios"
    ACCESS_RAW_DATA = "aceder_dados_brutos"
    MANAGE_SPECIES_DATA = "gerir_dados_especies"
    
    # Permissões de pesca
    VIEW_FISHING_DATA = "ver_dados_pesca"
    SUBMIT_CATCH_DATA = "submeter_dados_captura"
    ACCESS_WEATHER_DATA = "aceder_dados_meteorologicos"
    VIEW_REGULATIONS = "ver_regulamentacoes"
    
    # Permissões técnicas
    MANAGE_APIS = "gerir_apis"
    MONITOR_SYSTEM = "monitorizar_sistema"
    DEBUG_SYSTEM = "debug_sistema"
    MANAGE_PROCESSING = "gerir_processamento"


@dataclass
class UserProfile:
    """Perfil de utilizador"""
    user_id: str
    username: str
    email: str
    full_name: str
    role: UserRole
    permissions: Set[Permission]
    created_at: datetime
    last_login: Optional[datetime]
    active: bool
    organization: Optional[str]
    department: Optional[str]
    phone: Optional[str]
    preferences: Dict[str, Any]
    metadata: Dict[str, Any]
    password_hash: str
    password_salt: str
    failed_login_attempts: int = 0
    account_locked_until: Optional[datetime] = None


@dataclass
class UserSession:
    """Sessão de utilizador"""
    session_id: str
    user_id: str
    created_at: datetime
    last_activity: datetime
    ip_address: str
    user_agent: str
    active: bool
    expires_at: datetime


class UserRoleManager:
    """
    👥 Gestor de Utilizadores e Perfis BGAPP
    
    Sistema completo de gestão de utilizadores com perfis específicos
    para diferentes tipos de utilizadores da plataforma BGAPP.
    """
    
    def __init__(self):
        """Inicializar gestor de utilizadores"""
        
        # Registry de utilizadores
        self.users_registry = {}
        self.active_sessions = {}
        
        # Configuração de perfis e permissões
        self.role_permissions = self._initialize_role_permissions()
        
        # Configurações de segurança
        self.security_config = {
            'password_min_length': 8,
            'password_require_special': True,
            'password_require_numbers': True,
            'max_failed_attempts': 5,
            'account_lockout_minutes': 30,
            'session_timeout_hours': 8,
            'password_expiry_days': 90
        }
        
        # Métricas de utilizadores
        self.user_metrics = {
            'total_users': 0,
            'active_users': 0,
            'users_by_role': {},
            'active_sessions': 0,
            'login_attempts_today': 0,
            'failed_logins_today': 0
        }
        
        # Inicializar utilizador admin padrão
        self._create_default_admin()
    
    def _initialize_role_permissions(self) -> Dict[UserRole, Set[Permission]]:
        """Inicializar permissões por perfil de utilizador"""
        
        return {
            UserRole.ADMIN: {
                # Todas as permissões
                Permission.READ_DATA, Permission.WRITE_DATA, Permission.DELETE_DATA,
                Permission.MANAGE_USERS, Permission.MANAGE_SYSTEM, Permission.MANAGE_BACKUPS,
                Permission.VIEW_LOGS, Permission.MANAGE_CONFIG, Permission.RUN_ANALYSIS,
                Permission.CREATE_WORKFLOWS, Permission.PUBLISH_REPORTS, Permission.ACCESS_RAW_DATA,
                Permission.MANAGE_SPECIES_DATA, Permission.VIEW_FISHING_DATA, Permission.SUBMIT_CATCH_DATA,
                Permission.ACCESS_WEATHER_DATA, Permission.VIEW_REGULATIONS, Permission.MANAGE_APIS,
                Permission.MONITOR_SYSTEM, Permission.DEBUG_SYSTEM, Permission.MANAGE_PROCESSING
            },
            
            UserRole.MARINE_BIOLOGIST: {
                # Permissões científicas completas
                Permission.READ_DATA, Permission.WRITE_DATA, Permission.RUN_ANALYSIS,
                Permission.CREATE_WORKFLOWS, Permission.PUBLISH_REPORTS, Permission.ACCESS_RAW_DATA,
                Permission.MANAGE_SPECIES_DATA, Permission.VIEW_FISHING_DATA, Permission.ACCESS_WEATHER_DATA,
                Permission.VIEW_REGULATIONS
            },
            
            UserRole.RESEARCHER: {
                # Permissões de investigação
                Permission.READ_DATA, Permission.WRITE_DATA, Permission.RUN_ANALYSIS,
                Permission.CREATE_WORKFLOWS, Permission.PUBLISH_REPORTS, Permission.ACCESS_RAW_DATA,
                Permission.VIEW_FISHING_DATA, Permission.ACCESS_WEATHER_DATA
            },
            
            UserRole.FISHERMAN: {
                # Permissões práticas para pescadores
                Permission.READ_DATA, Permission.SUBMIT_CATCH_DATA, Permission.VIEW_FISHING_DATA,
                Permission.ACCESS_WEATHER_DATA, Permission.VIEW_REGULATIONS
            },
            
            UserRole.TECHNICIAN: {
                # Permissões técnicas
                Permission.READ_DATA, Permission.WRITE_DATA, Permission.MANAGE_APIS,
                Permission.MONITOR_SYSTEM, Permission.DEBUG_SYSTEM, Permission.MANAGE_PROCESSING,
                Permission.VIEW_LOGS
            },
            
            UserRole.GUEST: {
                # Permissões básicas de leitura
                Permission.READ_DATA, Permission.VIEW_FISHING_DATA, Permission.ACCESS_WEATHER_DATA,
                Permission.VIEW_REGULATIONS
            }
        }
    
    def _create_default_admin(self):
        """Criar utilizador admin padrão"""
        
        admin_id = "admin_default"
        password = "admin123"  # Senha padrão (deve ser alterada)
        
        salt = secrets.token_hex(32)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        
        admin_user = UserProfile(
            user_id=admin_id,
            username="admin",
            email="admin@maritimo-angola.ao",
            full_name="Administrador BGAPP",
            role=UserRole.ADMIN,
            permissions=self.role_permissions[UserRole.ADMIN],
            created_at=datetime.now(),
            last_login=None,
            active=True,
            organization="MARÍTIMO ANGOLA",
            department="Administração",
            phone=None,
            preferences={
                'language': 'pt',
                'timezone': 'Africa/Luanda',
                'theme': 'light',
                'dashboard_layout': 'default'
            },
            metadata={
                'created_by_system': True,
                'default_admin': True
            },
            password_hash=password_hash,
            password_salt=salt
        )
        
        self.users_registry[admin_id] = admin_user
        self.user_metrics['total_users'] += 1
        self.user_metrics['active_users'] += 1
        
        # Inicializar contadores por perfil
        for role in UserRole:
            self.user_metrics['users_by_role'][role.value] = 0
        self.user_metrics['users_by_role'][UserRole.ADMIN.value] = 1
        
        logger.info("👤 Utilizador admin padrão criado")
    
    async def create_user(self, 
                         username: str,
                         email: str,
                         password: str,
                         full_name: str,
                         role: UserRole,
                         organization: Optional[str] = None,
                         department: Optional[str] = None,
                         phone: Optional[str] = None,
                         created_by: str = "admin") -> str:
        """
        👤 Criar novo utilizador
        
        Args:
            username: Nome de utilizador único
            email: Email do utilizador
            password: Senha
            full_name: Nome completo
            role: Perfil do utilizador
            organization: Organização
            department: Departamento
            phone: Telefone
            created_by: Quem criou o utilizador
            
        Returns:
            ID do utilizador criado
        """
        
        # Validar dados
        await self._validate_user_data(username, email, password)
        
        # Verificar se utilizador já existe
        if any(user.username == username or user.email == email 
               for user in self.users_registry.values()):
            raise ValueError("Utilizador ou email já existe")
        
        # Gerar ID e hash da senha
        user_id = str(uuid.uuid4())
        salt = secrets.token_hex(32)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        
        # Criar perfil de utilizador
        user_profile = UserProfile(
            user_id=user_id,
            username=username,
            email=email,
            full_name=full_name,
            role=role,
            permissions=self.role_permissions[role],
            created_at=datetime.now(),
            last_login=None,
            active=True,
            organization=organization,
            department=department,
            phone=phone,
            preferences={
                'language': 'pt',
                'timezone': 'Africa/Luanda',
                'theme': 'light',
                'dashboard_layout': 'default'
            },
            metadata={
                'created_by': created_by,
                'creation_ip': 'unknown'
            },
            password_hash=password_hash,
            password_salt=salt
        )
        
        # Registar utilizador
        self.users_registry[user_id] = user_profile
        
        # Atualizar métricas
        self.user_metrics['total_users'] += 1
        self.user_metrics['active_users'] += 1
        self.user_metrics['users_by_role'][role.value] += 1
        
        logger.info(f"👤 Utilizador criado: {username} ({role.value})")
        
        return user_id
    
    async def _validate_user_data(self, username: str, email: str, password: str):
        """Validar dados do utilizador"""
        
        # Validar username
        if len(username) < 3:
            raise ValueError("Username deve ter pelo menos 3 caracteres")
        
        # Validar email
        if '@' not in email or '.' not in email:
            raise ValueError("Email inválido")
        
        # Validar senha
        if len(password) < self.security_config['password_min_length']:
            raise ValueError(f"Senha deve ter pelo menos {self.security_config['password_min_length']} caracteres")
        
        if self.security_config['password_require_numbers'] and not any(c.isdigit() for c in password):
            raise ValueError("Senha deve conter pelo menos um número")
        
        if self.security_config['password_require_special'] and not any(c in "!@#$%^&*" for c in password):
            raise ValueError("Senha deve conter pelo menos um carácter especial")
    
    async def authenticate_user(self, 
                              username: str, 
                              password: str,
                              ip_address: str = "unknown",
                              user_agent: str = "unknown") -> Optional[str]:
        """
        🔐 Autenticar utilizador
        
        Args:
            username: Nome de utilizador ou email
            password: Senha
            ip_address: Endereço IP
            user_agent: User agent do browser
            
        Returns:
            ID da sessão se autenticação bem-sucedida, None caso contrário
        """
        
        # Encontrar utilizador
        user = None
        for user_profile in self.users_registry.values():
            if user_profile.username == username or user_profile.email == username:
                user = user_profile
                break
        
        if not user:
            logger.warning(f"🚫 Tentativa de login com utilizador inexistente: {username}")
            self.user_metrics['failed_logins_today'] += 1
            return None
        
        # Verificar se conta está bloqueada
        if (user.account_locked_until and 
            datetime.now() < user.account_locked_until):
            logger.warning(f"🔒 Conta bloqueada: {username}")
            return None
        
        # Verificar senha
        password_hash = hashlib.sha256((password + user.password_salt).encode()).hexdigest()
        
        if password_hash != user.password_hash:
            # Senha incorreta
            user.failed_login_attempts += 1
            
            # Bloquear conta se exceder tentativas
            if user.failed_login_attempts >= self.security_config['max_failed_attempts']:
                lockout_duration = timedelta(minutes=self.security_config['account_lockout_minutes'])
                user.account_locked_until = datetime.now() + lockout_duration
                logger.warning(f"🔒 Conta bloqueada por excesso de tentativas: {username}")
            
            self.user_metrics['failed_logins_today'] += 1
            logger.warning(f"🚫 Senha incorreta para: {username}")
            return None
        
        # Autenticação bem-sucedida
        user.failed_login_attempts = 0
        user.account_locked_until = None
        user.last_login = datetime.now()
        
        # Criar sessão
        session_id = await self._create_user_session(user, ip_address, user_agent)
        
        self.user_metrics['login_attempts_today'] += 1
        
        logger.info(f"✅ Login bem-sucedido: {username} ({user.role.value})")
        
        return session_id
    
    async def _create_user_session(self, 
                                 user: UserProfile, 
                                 ip_address: str, 
                                 user_agent: str) -> str:
        """Criar sessão de utilizador"""
        
        session_id = secrets.token_urlsafe(32)
        session_timeout = timedelta(hours=self.security_config['session_timeout_hours'])
        
        session = UserSession(
            session_id=session_id,
            user_id=user.user_id,
            created_at=datetime.now(),
            last_activity=datetime.now(),
            ip_address=ip_address,
            user_agent=user_agent,
            active=True,
            expires_at=datetime.now() + session_timeout
        )
        
        self.active_sessions[session_id] = session
        self.user_metrics['active_sessions'] += 1
        
        return session_id
    
    async def validate_session(self, session_id: str) -> Optional[UserProfile]:
        """
        🔍 Validar sessão de utilizador
        
        Args:
            session_id: ID da sessão
            
        Returns:
            Perfil do utilizador se sessão válida
        """
        
        if session_id not in self.active_sessions:
            return None
        
        session = self.active_sessions[session_id]
        
        # Verificar se sessão expirou
        if datetime.now() > session.expires_at:
            await self._terminate_session(session_id)
            return None
        
        # Verificar se utilizador ainda está ativo
        user = self.users_registry.get(session.user_id)
        if not user or not user.active:
            await self._terminate_session(session_id)
            return None
        
        # Atualizar atividade da sessão
        session.last_activity = datetime.now()
        
        return user
    
    async def _terminate_session(self, session_id: str):
        """Terminar sessão de utilizador"""
        
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
            self.user_metrics['active_sessions'] -= 1
            logger.info(f"🚪 Sessão terminada: {session_id}")
    
    async def check_permission(self, session_id: str, required_permission: Permission) -> bool:
        """
        🔐 Verificar permissão de utilizador
        
        Args:
            session_id: ID da sessão
            required_permission: Permissão necessária
            
        Returns:
            True se utilizador tem a permissão
        """
        
        user = await self.validate_session(session_id)
        
        if not user:
            return False
        
        return required_permission in user.permissions
    
    def generate_users_dashboard(self) -> str:
        """
        👥 Gerar dashboard de gestão de utilizadores
        
        Returns:
            Dashboard HTML completo
        """
        
        # Atualizar métricas
        self._update_user_metrics()
        
        dashboard_html = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Gestão de Utilizadores - MARÍTIMO ANGOLA</title>
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
                .users-section {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .user-card {{
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    background: #f9fafb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }}
                .role-admin {{ border-left: 5px solid #dc2626; }}
                .role-biologo_marinho {{ border-left: 5px solid #16a34a; }}
                .role-pescador {{ border-left: 5px solid #0ea5e9; }}
                .role-investigador {{ border-left: 5px solid #7c3aed; }}
                .role-tecnico {{ border-left: 5px solid #ea580c; }}
                .role-convidado {{ border-left: 5px solid #6b7280; }}
                .roles-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }}
                .role-card {{
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 20px;
                }}
                .permissions-list {{
                    background: #f0f9ff;
                    border-radius: 5px;
                    padding: 10px;
                    margin: 10px 0;
                    max-height: 150px;
                    overflow-y: auto;
                }}
                .active-user {{ color: #16a34a; font-weight: bold; }}
                .inactive-user {{ color: #6b7280; }}
                .locked-user {{ color: #dc2626; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>👥 MARÍTIMO ANGOLA</h1>
                <h2>Gestão de Utilizadores e Perfis</h2>
                <p>Sistema de Acesso BGAPP - ZEE Angola</p>
            </div>
            
            <!-- Métricas Principais -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">{self.user_metrics['total_users']}</div>
                    <div class="metric-label">Total de Utilizadores</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.user_metrics['active_users']}</div>
                    <div class="metric-label">Utilizadores Ativos</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.user_metrics['active_sessions']}</div>
                    <div class="metric-label">Sessões Ativas</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.user_metrics['login_attempts_today']}</div>
                    <div class="metric-label">Logins Hoje</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{self.user_metrics['failed_logins_today']}</div>
                    <div class="metric-label">Falhas de Login</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{len(UserRole)}</div>
                    <div class="metric-label">Perfis Disponíveis</div>
                </div>
            </div>
            
            <!-- Utilizadores por Perfil -->
            <div class="users-section">
                <h3>👥 Utilizadores por Perfil</h3>
                <div class="roles-grid">
        """
        
        for role in UserRole:
            user_count = self.user_metrics['users_by_role'].get(role.value, 0)
            permissions_count = len(self.role_permissions[role])
            
            role_descriptions = {
                UserRole.ADMIN: "Acesso total ao sistema, gestão de utilizadores e configurações",
                UserRole.MARINE_BIOLOGIST: "Ferramentas científicas completas, análises de biodiversidade",
                UserRole.RESEARCHER: "Acesso a dados e ferramentas de investigação",
                UserRole.FISHERMAN: "Condições do mar, zonas de pesca, regulamentações",
                UserRole.TECHNICIAN: "Gestão técnica, monitorização, debugging",
                UserRole.GUEST: "Acesso básico de leitura aos dados públicos"
            }
            
            dashboard_html += f"""
                <div class="role-card">
                    <h4>{role.value.replace('_', ' ').title()}</h4>
                    <p><strong>Utilizadores:</strong> {user_count}</p>
                    <p><strong>Permissões:</strong> {permissions_count}</p>
                    <p style="font-size: 0.9em; color: #666;">{role_descriptions[role]}</p>
                    
                    <div class="permissions-list">
                        <strong>Principais permissões:</strong><br>
        """
            
            # Mostrar algumas permissões principais
            main_permissions = list(self.role_permissions[role])[:5]
            for perm in main_permissions:
                dashboard_html += f"• {perm.value.replace('_', ' ').title()}<br>"
            
            if len(self.role_permissions[role]) > 5:
                dashboard_html += f"... e mais {len(self.role_permissions[role]) - 5} permissões"
            
            dashboard_html += "</div></div>"
        
        dashboard_html += "</div></div>"
        
        # Lista de Utilizadores
        dashboard_html += """
            <div class="users-section">
                <h3>📋 Lista de Utilizadores</h3>
        """
        
        for user in self.users_registry.values():
            # Determinar status visual
            if user.account_locked_until and datetime.now() < user.account_locked_until:
                status_class = "locked-user"
                status_text = "🔒 BLOQUEADO"
            elif user.active:
                status_class = "active-user"
                status_text = "✅ ATIVO"
            else:
                status_class = "inactive-user"
                status_text = "⭕ INATIVO"
            
            last_login_text = user.last_login.strftime('%d/%m/%Y %H:%M') if user.last_login else 'Nunca'
            
            dashboard_html += f"""
            <div class="user-card role-{user.role.value}">
                <div>
                    <h4>{user.full_name}</h4>
                    <p><strong>Utilizador:</strong> {user.username} | <strong>Email:</strong> {user.email}</p>
                    <p><strong>Perfil:</strong> {user.role.value.replace('_', ' ').title()}</p>
                    <p><strong>Organização:</strong> {user.organization or 'N/A'}</p>
                    <p><strong>Último login:</strong> {last_login_text}</p>
                </div>
                <div>
                    <p class="{status_class}">{status_text}</p>
                    <p style="font-size: 0.8em; color: #666;">
                        Criado: {user.created_at.strftime('%d/%m/%Y')}<br>
                        Tentativas falhadas: {user.failed_login_attempts}
                    </p>
                </div>
            </div>
            """
        
        dashboard_html += f"""
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; background: white; padding: 20px; border-radius: 10px;">
                <p><em>Sistema de gestão de utilizadores BGAPP</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Acesso Seguro e Controlado</p>
                <p>Última atualização: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
            </div>
        </body>
        </html>
        """
        
        return dashboard_html
    
    def _update_user_metrics(self):
        """Atualizar métricas de utilizadores"""
        
        # Contar utilizadores ativos
        active_count = sum(1 for user in self.users_registry.values() if user.active)
        self.user_metrics['active_users'] = active_count
        
        # Contar por perfil
        for role in UserRole:
            count = sum(1 for user in self.users_registry.values() if user.role == role)
            self.user_metrics['users_by_role'][role.value] = count
        
        # Limpar sessões expiradas
        expired_sessions = [
            session_id for session_id, session in self.active_sessions.items()
            if datetime.now() > session.expires_at
        ]
        
        for session_id in expired_sessions:
            del self.active_sessions[session_id]
            self.user_metrics['active_sessions'] -= 1
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        👤 Obter perfil de utilizador
        
        Args:
            user_id: ID do utilizador
            
        Returns:
            Dados do perfil (sem informações sensíveis)
        """
        
        user = self.users_registry.get(user_id)
        
        if not user:
            return None
        
        return {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role.value,
            'permissions': [perm.value for perm in user.permissions],
            'created_at': user.created_at.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'active': user.active,
            'organization': user.organization,
            'department': user.department,
            'phone': user.phone,
            'preferences': user.preferences,
            'failed_login_attempts': user.failed_login_attempts,
            'account_locked': bool(user.account_locked_until and datetime.now() < user.account_locked_until)
        }
    
    async def update_user_role(self, user_id: str, new_role: UserRole, updated_by: str) -> bool:
        """
        🔄 Atualizar perfil de utilizador
        
        Args:
            user_id: ID do utilizador
            new_role: Novo perfil
            updated_by: Quem fez a alteração
            
        Returns:
            True se atualizado com sucesso
        """
        
        user = self.users_registry.get(user_id)
        
        if not user:
            return False
        
        old_role = user.role
        
        # Atualizar perfil e permissões
        user.role = new_role
        user.permissions = self.role_permissions[new_role]
        user.metadata['last_role_change'] = {
            'from': old_role.value,
            'to': new_role.value,
            'changed_by': updated_by,
            'changed_at': datetime.now().isoformat()
        }
        
        # Atualizar métricas
        self.user_metrics['users_by_role'][old_role.value] -= 1
        self.user_metrics['users_by_role'][new_role.value] += 1
        
        logger.info(f"🔄 Perfil atualizado: {user.username} {old_role.value} → {new_role.value}")
        
        return True
    
    async def deactivate_user(self, user_id: str, deactivated_by: str) -> bool:
        """
        ❌ Desativar utilizador
        
        Args:
            user_id: ID do utilizador
            deactivated_by: Quem desativou
            
        Returns:
            True se desativado com sucesso
        """
        
        user = self.users_registry.get(user_id)
        
        if not user:
            return False
        
        user.active = False
        user.metadata['deactivated_by'] = deactivated_by
        user.metadata['deactivated_at'] = datetime.now().isoformat()
        
        # Terminar todas as sessões ativas do utilizador
        sessions_to_terminate = [
            session_id for session_id, session in self.active_sessions.items()
            if session.user_id == user_id
        ]
        
        for session_id in sessions_to_terminate:
            await self._terminate_session(session_id)
        
        self.user_metrics['active_users'] -= 1
        
        logger.info(f"❌ Utilizador desativado: {user.username}")
        
        return True


# Instância global do gestor de utilizadores
user_role_manager = UserRoleManager()
