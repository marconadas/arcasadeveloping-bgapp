"""
Sistema de autenticação e autorização para BGAPP
Implementa JWT tokens e controlo de acesso baseado em roles
"""

import os
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

# Configuração de segurança
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "bgapp-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Context para hash de passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer para extrair tokens
security = HTTPBearer()

# Modelos Pydantic
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None
    scopes: List[str] = []

class User(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool = True
    scopes: List[str] = []

class UserInDB(User):
    hashed_password: str

# Base de dados de utilizadores (em produção usar PostgreSQL)
fake_users_db = {
    "admin": {
        "id": "1",
        "username": "admin",
        "email": "admin@bgapp.ao",
        "full_name": "Administrador BGAPP",
        "role": "admin",
        "hashed_password": pwd_context.hash("bgapp123"),
        "is_active": True,
        "scopes": ["admin", "read", "write", "execute"]
    },
    "scientist": {
        "id": "2", 
        "username": "scientist",
        "email": "scientist@bgapp.ao",
        "full_name": "Cientista BGAPP",
        "role": "scientist",
        "hashed_password": pwd_context.hash("science123"),
        "is_active": True,
        "scopes": ["read", "write"]
    },
    "viewer": {
        "id": "3",
        "username": "viewer", 
        "email": "viewer@bgapp.ao",
        "full_name": "Observador BGAPP",
        "role": "viewer",
        "hashed_password": pwd_context.hash("view123"),
        "is_active": True,
        "scopes": ["read"]
    }
}

class AuthenticationService:
    """Serviço de autenticação"""
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verificar password"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Gerar hash da password"""
        return pwd_context.hash(password)
    
    def get_user(self, username: str) -> Optional[UserInDB]:
        """Obter utilizador da base de dados"""
        if username in fake_users_db:
            user_dict = fake_users_db[username]
            return UserInDB(**user_dict)
        return None
    
    def authenticate_user(self, username: str, password: str) -> Optional[UserInDB]:
        """Autenticar utilizador"""
        user = self.get_user(username)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Criar access token JWT"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def create_refresh_token(self, data: dict) -> str:
        """Criar refresh token JWT"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[TokenData]:
        """Verificar e decodificar token JWT"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            scopes: List[str] = payload.get("scopes", [])
            
            if username is None:
                return None
            
            token_data = TokenData(username=username, scopes=scopes)
            return token_data
            
        except jwt.PyJWTError:
            return None

# Instância global do serviço
auth_service = AuthenticationService()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Dependency para obter utilizador atual"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = auth_service.verify_token(credentials.credentials)
    if token_data is None:
        raise credentials_exception
    
    user = auth_service.get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilizador inativo"
        )
    
    return User(**user.dict())

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency para utilizador ativo"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Utilizador inativo")
    return current_user

def require_scopes(required_scopes: List[str]):
    """Decorator para exigir scopes específicos"""
    def scope_checker(current_user: User = Depends(get_current_user)) -> User:
        if not any(scope in current_user.scopes for scope in required_scopes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permissões insuficientes. Necessário: {required_scopes}"
            )
        return current_user
    return scope_checker

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency para exigir permissões de admin"""
    if "admin" not in current_user.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores"
        )
    return current_user
