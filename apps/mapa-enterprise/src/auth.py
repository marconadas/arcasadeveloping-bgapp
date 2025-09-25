"""
Sistema de autenticação e autorização
"""

import os
import jwt
import bcrypt
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from functools import wraps
from flask import request, jsonify
from config.settings import get_config

logger = logging.getLogger(__name__)

class AuthManager:
    """Classe para gerenciar autenticação e autorização"""

    def __init__(self):
        self.config = get_config()
        self.secret_key = self.config.JWT_SECRET_KEY
        self.algorithm = self.config.JWT_ALGORITHM
        self.expiration_hours = self.config.JWT_EXPIRATION_HOURS

        # Usuários de exemplo (em produção, usar banco de dados)
        self.users = {
            "admin": {
                "password_hash": self._hash_password("admin123"),
                "role": "admin",
                "permissions": ["read", "write", "admin"]
            },
            "user": {
                "password_hash": self._hash_password("user123"),
                "role": "user",
                "permissions": ["read"]
            }
        }

    def _hash_password(self, password: str) -> str:
        """Hash de senha usando bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verificar senha"""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

    def generate_token(self, username: str) -> str:
        """Gerar token JWT"""
        payload = {
            'username': username,
            'exp': datetime.utcnow() + timedelta(hours=self.expiration_hours),
            'iat': datetime.utcnow()
        }

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> Optional[Dict]:
        """Verificar token JWT"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expirado")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Token inválido")
            return None

    def authenticate(self, username: str, password: str) -> Optional[str]:
        """Autenticar usuário e retornar token"""
        if username not in self.users:
            logger.warning(f"Tentativa de login com usuário inexistente: {username}")
            return None

        user = self.users[username]
        if self.verify_password(password, user['password_hash']):
            token = self.generate_token(username)
            logger.info(f"Usuário {username} autenticado com sucesso")
            return token

        logger.warning(f"Senha incorreta para usuário: {username}")
        return None

    def get_current_user(self) -> Optional[Dict]:
        """Obter usuário atual baseado no token"""
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        payload = self.verify_token(token)

        if payload and payload['username'] in self.users:
            return {
                'username': payload['username'],
                'role': self.users[payload['username']]['role'],
                'permissions': self.users[payload['username']]['permissions']
            }

        return None

    def require_auth(self, func):
        """Decorador para requerer autenticação"""
        @wraps(func)
        def decorated_function(*args, **kwargs):
            current_user = self.get_current_user()
            if not current_user:
                return jsonify({
                    'error': 'Authentication required',
                    'message': 'Token JWT válido necessário'
                }), 401

            return func(current_user, *args, **kwargs)
        return decorated_function

    def require_permission(self, permission: str):
        """Decorador para requerer permissão específica"""
        def decorator(func):
            @wraps(func)
            def decorated_function(*args, **kwargs):
                current_user = self.get_current_user()
                if not current_user:
                    return jsonify({
                        'error': 'Authentication required',
                        'message': 'Token JWT válido necessário'
                    }), 401

                if permission not in current_user['permissions']:
                    return jsonify({
                        'error': 'Insufficient permissions',
                        'message': f'Permissão "{permission}" necessária'
                    }), 403

                return func(current_user, *args, **kwargs)
            return decorated_function
        return decorator

    def create_user(self, username: str, password: str, role: str = 'user') -> bool:
        """Criar novo usuário (apenas para admin)"""
        if username in self.users:
            logger.warning(f"Tentativa de criar usuário existente: {username}")
            return False

        self.users[username] = {
            'password_hash': self._hash_password(password),
            'role': role,
            'permissions': ['read'] if role == 'user' else ['read', 'write', 'admin']
        }

        logger.info(f"Novo usuário criado: {username} com role {role}")
        return True

    def change_password(self, username: str, old_password: str, new_password: str) -> bool:
        """Alterar senha de usuário"""
        if username not in self.users:
            return False

        user = self.users[username]
        if not self.verify_password(old_password, user['password_hash']):
            return False

        user['password_hash'] = self._hash_password(new_password)
        logger.info(f"Senha alterada para usuário: {username}")
        return True

    def get_users_list(self) -> Dict[str, Dict]:
        """Obter lista de usuários (sem senhas)"""
        return {
            username: {
                'role': user['role'],
                'permissions': user['permissions']
            }
            for username, user in self.users.items()
        }

# Instância global
auth_manager = AuthManager()
