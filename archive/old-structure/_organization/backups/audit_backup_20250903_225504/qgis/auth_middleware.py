#!/usr/bin/env python3
"""
Middleware de Autenticação para Endpoints QGIS Sensíveis
Implementa controle de acesso baseado em roles e permissões
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable
from fastapi import HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
from enum import Enum
from dataclasses import dataclass
import redis
import json
from functools import wraps
import asyncio
import hashlib
import secrets
from pathlib import Path

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserRole(Enum):
    """Roles de usuários"""
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"
    API_USER = "api_user"

class Permission(Enum):
    """Permissões específicas"""
    # Visualização
    VIEW_MAPS = "view_maps"
    VIEW_DATA = "view_data"
    VIEW_REPORTS = "view_reports"
    
    # Análise
    RUN_ANALYSIS = "run_analysis"
    EXPORT_DATA = "export_data"
    GENERATE_REPORTS = "generate_reports"
    
    # Administração
    MANAGE_USERS = "manage_users"
    MANAGE_SYSTEM = "manage_system"
    DELETE_DATA = "delete_data"
    
    # APIs avançadas
    ACCESS_RAW_DATA = "access_raw_data"
    BULK_OPERATIONS = "bulk_operations"
    SYSTEM_MONITORING = "system_monitoring"

@dataclass
class User:
    """Modelo de usuário"""
    id: str
    username: str
    email: str
    role: UserRole
    permissions: List[Permission]
    is_active: bool = True
    created_at: datetime = None
    last_login: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()

class AuthConfig:
    """Configuração de autenticação"""
    
    def __init__(self):
        # Chave secreta para JWT (em produção, usar variável de ambiente)
        self.SECRET_KEY = "your-secret-key-change-in-production"
        self.ALGORITHM = "HS256"
        self.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        self.REFRESH_TOKEN_EXPIRE_DAYS = 7
        
        # Rate limiting
        self.MAX_LOGIN_ATTEMPTS = 5
        self.LOCKOUT_DURATION_MINUTES = 15
        
        # Redis para cache de sessões
        try:
            self.redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
            self.redis_client.ping()
            self.redis_available = True
            logger.info("✅ Redis conectado para cache de autenticação")
        except:
            self.redis_client = None
            self.redis_available = False
            logger.warning("⚠️ Redis não disponível para cache de autenticação")

class RolePermissionManager:
    """Gerenciador de roles e permissões"""
    
    def __init__(self):
        # Definir permissões por role
        self.role_permissions = {
            UserRole.ADMIN: [
                Permission.VIEW_MAPS,
                Permission.VIEW_DATA,
                Permission.VIEW_REPORTS,
                Permission.RUN_ANALYSIS,
                Permission.EXPORT_DATA,
                Permission.GENERATE_REPORTS,
                Permission.MANAGE_USERS,
                Permission.MANAGE_SYSTEM,
                Permission.DELETE_DATA,
                Permission.ACCESS_RAW_DATA,
                Permission.BULK_OPERATIONS,
                Permission.SYSTEM_MONITORING
            ],
            UserRole.ANALYST: [
                Permission.VIEW_MAPS,
                Permission.VIEW_DATA,
                Permission.VIEW_REPORTS,
                Permission.RUN_ANALYSIS,
                Permission.EXPORT_DATA,
                Permission.GENERATE_REPORTS,
                Permission.ACCESS_RAW_DATA
            ],
            UserRole.VIEWER: [
                Permission.VIEW_MAPS,
                Permission.VIEW_DATA,
                Permission.VIEW_REPORTS
            ],
            UserRole.API_USER: [
                Permission.VIEW_DATA,
                Permission.RUN_ANALYSIS,
                Permission.EXPORT_DATA
            ]
        }
    
    def get_permissions_for_role(self, role: UserRole) -> List[Permission]:
        """Retorna permissões para um role"""
        return self.role_permissions.get(role, [])
    
    def has_permission(self, user_role: UserRole, required_permission: Permission) -> bool:
        """Verifica se um role tem uma permissão específica"""
        user_permissions = self.get_permissions_for_role(user_role)
        return required_permission in user_permissions

class UserManager:
    """Gerenciador de usuários"""
    
    def __init__(self, config: AuthConfig):
        self.config = config
        self.role_manager = RolePermissionManager()
        
        # Usuários em memória (em produção, usar banco de dados)
        self.users: Dict[str, User] = {}
        self.username_to_id: Dict[str, str] = {}
        
        # Criar usuário admin padrão
        self._create_default_admin()
    
    def _create_default_admin(self):
        """Cria usuário admin padrão"""
        admin_id = "admin_001"
        admin_user = User(
            id=admin_id,
            username="admin",
            email="admin@bgapp.com",
            role=UserRole.ADMIN,
            permissions=self.role_manager.get_permissions_for_role(UserRole.ADMIN)
        )
        
        self.users[admin_id] = admin_user
        self.username_to_id["admin"] = admin_id
        
        # Hash da senha padrão (em produção, forçar mudança)
        default_password = "admin123"
        password_hash = bcrypt.hashpw(default_password.encode('utf-8'), bcrypt.gensalt())
        
        # Salvar hash da senha (em produção, usar banco de dados)
        if self.config.redis_available:
            self.config.redis_client.setex(
                f"password:{admin_id}", 
                86400 * 30,  # 30 dias
                password_hash.decode('utf-8')
            )
        
        logger.info("✅ Usuário admin padrão criado (admin/admin123)")
    
    def create_user(self, username: str, email: str, password: str, role: UserRole) -> User:
        """Cria novo usuário"""
        
        # Verificar se usuário já existe
        if username in self.username_to_id:
            raise ValueError(f"Usuário {username} já existe")
        
        # Gerar ID único
        user_id = f"user_{secrets.token_hex(8)}"
        
        # Criar usuário
        user = User(
            id=user_id,
            username=username,
            email=email,
            role=role,
            permissions=self.role_manager.get_permissions_for_role(role)
        )
        
        # Salvar usuário
        self.users[user_id] = user
        self.username_to_id[username] = user_id
        
        # Hash da senha
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Salvar senha
        if self.config.redis_available:
            self.config.redis_client.setex(
                f"password:{user_id}",
                86400 * 30,  # 30 dias
                password_hash.decode('utf-8')
            )
        
        logger.info(f"✅ Usuário {username} criado com role {role.value}")
        return user
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Autentica usuário"""
        
        # Verificar se usuário existe
        if username not in self.username_to_id:
            return None
        
        user_id = self.username_to_id[username]
        user = self.users.get(user_id)
        
        if not user or not user.is_active:
            return None
        
        # Verificar senha
        if self.config.redis_available:
            stored_hash = self.config.redis_client.get(f"password:{user_id}")
            if stored_hash and bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                # Atualizar último login
                user.last_login = datetime.utcnow()
                return user
        
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Obtém usuário por ID"""
        return self.users.get(user_id)

class TokenManager:
    """Gerenciador de tokens JWT"""
    
    def __init__(self, config: AuthConfig):
        self.config = config
    
    def create_access_token(self, user: User) -> str:
        """Cria token de acesso"""
        
        expire = datetime.utcnow() + timedelta(minutes=self.config.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        payload = {
            "sub": user.id,
            "username": user.username,
            "role": user.role.value,
            "permissions": [p.value for p in user.permissions],
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        token = jwt.encode(payload, self.config.SECRET_KEY, algorithm=self.config.ALGORITHM)
        return token
    
    def create_refresh_token(self, user: User) -> str:
        """Cria token de refresh"""
        
        expire = datetime.utcnow() + timedelta(days=self.config.REFRESH_TOKEN_EXPIRE_DAYS)
        
        payload = {
            "sub": user.id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        
        token = jwt.encode(payload, self.config.SECRET_KEY, algorithm=self.config.ALGORITHM)
        return token
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifica e decodifica token"""
        
        try:
            payload = jwt.decode(token, self.config.SECRET_KEY, algorithms=[self.config.ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expirado")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Token inválido")
            return None

class AuthenticationService:
    """Serviço principal de autenticação"""
    
    def __init__(self):
        self.config = AuthConfig()
        self.user_manager = UserManager(self.config)
        self.token_manager = TokenManager(self.config)
        self.security = HTTPBearer()
        
        # Rate limiting
        self.login_attempts: Dict[str, List[datetime]] = {}
    
    def login(self, username: str, password: str) -> Dict[str, Any]:
        """Faz login do usuário"""
        
        # Verificar rate limiting
        if self._is_rate_limited(username):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Muitas tentativas de login. Tente novamente em 15 minutos."
            )
        
        # Autenticar usuário
        user = self.user_manager.authenticate_user(username, password)
        
        if not user:
            # Registrar tentativa falhada
            self._record_login_attempt(username)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais inválidas"
            )
        
        # Limpar tentativas de login
        if username in self.login_attempts:
            del self.login_attempts[username]
        
        # Criar tokens
        access_token = self.token_manager.create_access_token(user)
        refresh_token = self.token_manager.create_refresh_token(user)
        
        # Salvar sessão no cache
        if self.config.redis_available:
            session_data = {
                "user_id": user.id,
                "username": user.username,
                "role": user.role.value,
                "login_time": datetime.utcnow().isoformat()
            }
            
            self.config.redis_client.setex(
                f"session:{user.id}",
                self.config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                json.dumps(session_data)
            )
        
        logger.info(f"✅ Login realizado: {username}")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role.value,
                "permissions": [p.value for p in user.permissions]
            }
        }
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Renova token de acesso"""
        
        payload = self.token_manager.verify_token(refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de refresh inválido"
            )
        
        user = self.user_manager.get_user_by_id(payload["sub"])
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário não encontrado ou inativo"
            )
        
        # Criar novo token de acesso
        new_access_token = self.token_manager.create_access_token(user)
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": self.config.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    
    def logout(self, user_id: str):
        """Faz logout do usuário"""
        
        # Remover sessão do cache
        if self.config.redis_available:
            self.config.redis_client.delete(f"session:{user_id}")
        
        logger.info(f"✅ Logout realizado: {user_id}")
    
    def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> User:
        """Obtém usuário atual do token"""
        
        payload = self.token_manager.verify_token(credentials.credentials)
        
        if not payload or payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        user = self.user_manager.get_user_by_id(payload["sub"])
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário não encontrado ou inativo"
            )
        
        return user
    
    def _is_rate_limited(self, username: str) -> bool:
        """Verifica se usuário está limitado por rate limiting"""
        
        if username not in self.login_attempts:
            return False
        
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=self.config.LOCKOUT_DURATION_MINUTES)
        
        # Filtrar tentativas recentes
        recent_attempts = [
            attempt for attempt in self.login_attempts[username]
            if attempt > cutoff
        ]
        
        self.login_attempts[username] = recent_attempts
        
        return len(recent_attempts) >= self.config.MAX_LOGIN_ATTEMPTS
    
    def _record_login_attempt(self, username: str):
        """Registra tentativa de login"""
        
        if username not in self.login_attempts:
            self.login_attempts[username] = []
        
        self.login_attempts[username].append(datetime.utcnow())

# Instância global do serviço de autenticação
auth_service = AuthenticationService()

# Dependências para FastAPI
def get_current_user() -> User:
    """Dependência para obter usuário atual"""
    return Depends(auth_service.get_current_user)

def require_permission(permission: Permission):
    """Decorator para exigir permissão específica"""
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Encontrar o usuário nos argumentos
            current_user = None
            for arg in args:
                if isinstance(arg, User):
                    current_user = arg
                    break
            
            if not current_user:
                # Procurar nos kwargs
                current_user = kwargs.get('current_user')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuário não autenticado"
                )
            
            # Verificar permissão
            role_manager = RolePermissionManager()
            if not role_manager.has_permission(current_user.role, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permissão necessária: {permission.value}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    
    return decorator

def require_role(required_role: UserRole):
    """Decorator para exigir role específico"""
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Encontrar o usuário nos argumentos
            current_user = None
            for arg in args:
                if isinstance(arg, User):
                    current_user = arg
                    break
            
            if not current_user:
                current_user = kwargs.get('current_user')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuário não autenticado"
                )
            
            # Verificar role
            if current_user.role != required_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role necessário: {required_role.value}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    
    return decorator

# Middleware de autenticação para FastAPI
class AuthMiddleware:
    """Middleware de autenticação"""
    
    def __init__(self):
        self.auth_service = auth_service
        
        # Endpoints que não requerem autenticação
        self.public_endpoints = [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/auth/login",
            "/auth/refresh",
            "/health",
            "/qgis/status"
        ]
        
        # Endpoints que requerem permissões específicas
        self.protected_endpoints = {
            "/qgis/biomass": Permission.RUN_ANALYSIS,
            "/qgis/spatial": Permission.RUN_ANALYSIS,
            "/qgis/temporal": Permission.RUN_ANALYSIS,
            "/qgis/mcda": Permission.RUN_ANALYSIS,
            "/qgis/reports": Permission.GENERATE_REPORTS,
            "/qgis2web": Permission.EXPORT_DATA,
            "/qgis/health/metrics": Permission.SYSTEM_MONITORING,
            "/admin": Permission.MANAGE_SYSTEM
        }
    
    async def __call__(self, request: Request, call_next):
        """Processa requisição"""
        
        path = request.url.path
        
        # Verificar se endpoint é público
        if any(public_path in path for public_path in self.public_endpoints):
            response = await call_next(request)
            return response
        
        # Verificar autenticação
        authorization = request.headers.get("Authorization")
        
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de acesso necessário",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        token = authorization.split(" ")[1]
        payload = self.auth_service.token_manager.verify_token(token)
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Obter usuário
        user = self.auth_service.user_manager.get_user_by_id(payload["sub"])
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário não encontrado ou inativo"
            )
        
        # Verificar permissões para endpoints protegidos
        for endpoint_pattern, required_permission in self.protected_endpoints.items():
            if endpoint_pattern in path:
                role_manager = RolePermissionManager()
                if not role_manager.has_permission(user.role, required_permission):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Permissão necessária: {required_permission.value}"
                    )
                break
        
        # Adicionar usuário ao contexto da requisição
        request.state.current_user = user
        
        response = await call_next(request)
        return response

# Exemplo de uso
async def main():
    """Exemplo de uso do sistema de autenticação"""
    
    # Criar usuários de exemplo
    print("👤 Criando usuários de exemplo...")
    
    try:
        analyst_user = auth_service.user_manager.create_user(
            username="analyst1",
            email="analyst@bgapp.com", 
            password="analyst123",
            role=UserRole.ANALYST
        )
        print(f"✅ Usuário analista criado: {analyst_user.username}")
        
        viewer_user = auth_service.user_manager.create_user(
            username="viewer1",
            email="viewer@bgapp.com",
            password="viewer123", 
            role=UserRole.VIEWER
        )
        print(f"✅ Usuário visualizador criado: {viewer_user.username}")
        
    except ValueError as e:
        print(f"⚠️ {e}")
    
    # Testar login
    print("\n🔐 Testando autenticação...")
    
    try:
        login_result = auth_service.login("admin", "admin123")
        print(f"✅ Login admin realizado")
        print(f"Token: {login_result['access_token'][:50]}...")
        print(f"Permissões: {login_result['user']['permissions']}")
        
        # Testar token inválido
        try:
            auth_service.login("admin", "senha_errada")
        except HTTPException as e:
            print(f"❌ Login com senha incorreta rejeitado: {e.detail}")
        
    except Exception as e:
        print(f"❌ Erro no teste de autenticação: {e}")
    
    print("\n🎯 Sistema de autenticação configurado!")

if __name__ == "__main__":
    asyncio.run(main())
