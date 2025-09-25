"""
Sistema seguro de gestão de credenciais para BGAPP
Implementa rotação automática e geração de credenciais seguras
"""

import os
import secrets
import string
import hashlib
import json
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from pathlib import Path
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import logging

from ..core.logging_config import get_logger

logger = get_logger(__name__)

class SecureCredentialsManager:
    """Gestor seguro de credenciais"""
    
    def __init__(self, credentials_file: str = "secure_credentials.enc"):
        self.credentials_file = Path(credentials_file)
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self._encryption_key = self._get_or_create_encryption_key()
        self._cipher_suite = Fernet(self._encryption_key)
        
    def _get_or_create_encryption_key(self) -> bytes:
        """Obter ou criar chave de encriptação"""
        key_file = Path(".encryption_key")
        
        if key_file.exists():
            with open(key_file, "rb") as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            # Guardar chave com permissões restritas
            with open(key_file, "wb") as f:
                f.write(key)
            os.chmod(key_file, 0o600)  # Apenas owner pode ler/escrever
            logger.security_event("encryption_key_created", file=str(key_file))
            return key
    
    def generate_secure_password(self, length: int = 16) -> str:
        """Gerar password segura"""
        # Garantir pelo menos um carácter de cada tipo
        lowercase = string.ascii_lowercase
        uppercase = string.ascii_uppercase
        digits = string.digits
        special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        # Garantir pelo menos um de cada tipo
        password = [
            secrets.choice(lowercase),
            secrets.choice(uppercase),
            secrets.choice(digits),
            secrets.choice(special)
        ]
        
        # Preencher o resto aleatoriamente
        all_chars = lowercase + uppercase + digits + special
        for _ in range(length - 4):
            password.append(secrets.choice(all_chars))
        
        # Embaralhar
        secrets.SystemRandom().shuffle(password)
        return ''.join(password)
    
    def generate_jwt_secret(self, length: int = 64) -> str:
        """Gerar secret JWT seguro"""
        return secrets.token_urlsafe(length)
    
    def create_default_users(self) -> Dict[str, Dict]:
        """Criar utilizadores padrão com credenciais seguras"""
        users = {
            "admin": {
                "id": "1",
                "username": "admin",
                "email": "admin@bgapp.ao",
                "full_name": "Administrador BGAPP",
                "role": "admin",
                "is_active": True,
                "scopes": ["admin", "read", "write", "execute"],
                "created_at": datetime.utcnow().isoformat(),
                "password_expires_at": (datetime.utcnow() + timedelta(days=90)).isoformat(),
                "force_password_change": True
            },
            "scientist": {
                "id": "2",
                "username": "scientist",
                "email": "scientist@bgapp.ao", 
                "full_name": "Cientista BGAPP",
                "role": "scientist",
                "is_active": True,
                "scopes": ["read", "write"],
                "created_at": datetime.utcnow().isoformat(),
                "password_expires_at": (datetime.utcnow() + timedelta(days=90)).isoformat(),
                "force_password_change": True
            },
            "viewer": {
                "id": "3",
                "username": "viewer",
                "email": "viewer@bgapp.ao",
                "full_name": "Observador BGAPP", 
                "role": "viewer",
                "is_active": True,
                "scopes": ["read"],
                "created_at": datetime.utcnow().isoformat(),
                "password_expires_at": (datetime.utcnow() + timedelta(days=90)).isoformat(),
                "force_password_change": True
            }
        }
        
        # Gerar passwords seguras para cada utilizador
        for username, user_data in users.items():
            secure_password = self.generate_secure_password()
            user_data["hashed_password"] = self.pwd_context.hash(secure_password)
            user_data["temp_password"] = secure_password  # Para primeiro login
            
        return users
    
    def save_credentials(self, credentials: Dict) -> None:
        """Guardar credenciais encriptadas"""
        try:
            # Serializar para JSON
            credentials_json = json.dumps(credentials, indent=2)
            
            # Encriptar
            encrypted_data = self._cipher_suite.encrypt(credentials_json.encode())
            
            # Guardar com permissões restritas
            with open(self.credentials_file, "wb") as f:
                f.write(encrypted_data)
            os.chmod(self.credentials_file, 0o600)
            
            logger.security_event(
                "credentials_saved",
                file=str(self.credentials_file),
                users_count=len(credentials.get("users", {}))
            )
            
        except Exception as e:
            logger.error(f"Erro ao guardar credenciais: {e}")
            raise
    
    def load_credentials(self) -> Optional[Dict]:
        """Carregar credenciais encriptadas"""
        try:
            if not self.credentials_file.exists():
                return None
                
            with open(self.credentials_file, "rb") as f:
                encrypted_data = f.read()
            
            # Desencriptar
            decrypted_data = self._cipher_suite.decrypt(encrypted_data)
            credentials = json.loads(decrypted_data.decode())
            
            logger.info("Credenciais carregadas com sucesso")
            return credentials
            
        except Exception as e:
            logger.error(f"Erro ao carregar credenciais: {e}")
            return None
    
    def rotate_jwt_secret(self) -> str:
        """Rotar secret JWT"""
        new_secret = self.generate_jwt_secret()
        
        credentials = self.load_credentials() or {}
        credentials["jwt_secret"] = new_secret
        credentials["jwt_secret_rotated_at"] = datetime.utcnow().isoformat()
        
        self.save_credentials(credentials)
        
        logger.security_event("jwt_secret_rotated")
        return new_secret
    
    def change_user_password(self, username: str, new_password: str) -> bool:
        """Alterar password de utilizador"""
        try:
            credentials = self.load_credentials()
            if not credentials or "users" not in credentials:
                return False
            
            if username not in credentials["users"]:
                return False
            
            # Hash da nova password
            hashed_password = self.pwd_context.hash(new_password)
            
            # Atualizar dados do utilizador
            credentials["users"][username]["hashed_password"] = hashed_password
            credentials["users"][username]["password_changed_at"] = datetime.utcnow().isoformat()
            credentials["users"][username]["force_password_change"] = False
            credentials["users"][username]["password_expires_at"] = (
                datetime.utcnow() + timedelta(days=90)
            ).isoformat()
            
            # Remover password temporária se existir
            if "temp_password" in credentials["users"][username]:
                del credentials["users"][username]["temp_password"]
            
            self.save_credentials(credentials)
            
            logger.security_event(
                "password_changed",
                username=username,
                changed_at=datetime.utcnow().isoformat()
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao alterar password: {e}")
            return False
    
    def is_password_expired(self, username: str) -> bool:
        """Verificar se password expirou"""
        credentials = self.load_credentials()
        if not credentials or "users" not in credentials:
            return True
        
        if username not in credentials["users"]:
            return True
        
        user_data = credentials["users"][username]
        expires_at_str = user_data.get("password_expires_at")
        
        if not expires_at_str:
            return True
        
        expires_at = datetime.fromisoformat(expires_at_str)
        return datetime.utcnow() > expires_at
    
    def initialize_secure_system(self) -> Dict[str, str]:
        """Inicializar sistema seguro"""
        logger.info("Inicializando sistema de credenciais seguras...")
        
        # Criar utilizadores com credenciais seguras
        users = self.create_default_users()
        
        # Gerar JWT secret
        jwt_secret = self.generate_jwt_secret()
        
        # Preparar credenciais completas
        credentials = {
            "users": users,
            "jwt_secret": jwt_secret,
            "created_at": datetime.utcnow().isoformat(),
            "version": "1.0.0"
        }
        
        # Guardar credenciais encriptadas
        self.save_credentials(credentials)
        
        # Retornar passwords temporárias para primeiro login
        temp_passwords = {}
        for username, user_data in users.items():
            temp_passwords[username] = user_data["temp_password"]
        
        logger.security_event(
            "secure_system_initialized",
            users_count=len(users),
            jwt_secret_length=len(jwt_secret)
        )
        
        return temp_passwords

def get_secure_credentials_manager() -> SecureCredentialsManager:
    """Obter instância do gestor de credenciais"""
    return SecureCredentialsManager()

if __name__ == "__main__":
    # Inicializar sistema seguro
    manager = SecureCredentialsManager()
    temp_passwords = manager.initialize_secure_system()
    
    print("🔐 Sistema de credenciais seguras inicializado!")
    print("\n📋 Passwords temporárias (alterar no primeiro login):")
    for username, password in temp_passwords.items():
        print(f"  {username}: {password}")
    
    print(f"\n✅ Credenciais guardadas em: {manager.credentials_file}")
    print("⚠️  IMPORTANTE: Guarde estas passwords em local seguro e altere no primeiro login!")
