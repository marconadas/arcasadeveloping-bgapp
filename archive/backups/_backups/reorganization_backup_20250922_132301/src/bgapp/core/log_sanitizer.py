"""
Sistema de sanitização de logs para BGAPP
Remove dados sensíveis dos logs para compliance GDPR/RGPD
"""

import re
import json
import hashlib
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
import logging

class LogSanitizer:
    """Sanitizador de logs para remover dados sensíveis"""
    
    def __init__(self):
        # Campos sensíveis que devem ser removidos ou mascarados
        self.sensitive_fields = {
            # Credenciais e autenticação
            'password', 'passwd', 'pwd', 'secret', 'token', 'key', 'api_key',
            'authorization', 'auth', 'credential', 'hashed_password',
            
            # Dados pessoais (GDPR/RGPD)
            'email', 'phone', 'telephone', 'mobile', 'cpf', 'ssn', 'passport',
            'address', 'street', 'city', 'postal_code', 'zip_code',
            
            # Dados bancários
            'credit_card', 'card_number', 'cvv', 'account_number', 'iban',
            'bank_account', 'payment_info',
            
            # Dados técnicos sensíveis
            'database_url', 'connection_string', 'private_key', 'certificate',
            'session_id', 'csrf_token'
        }
        
        # Padrões regex para detectar dados sensíveis
        self.sensitive_patterns = [
            # Email
            (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL_REDACTED]'),
            
            # IPs (parcial - manter apenas primeiros octetos)
            (r'\b(\d{1,3}\.\d{1,3}\.)\d{1,3}\.\d{1,3}\b', r'\1XXX.XXX'),
            
            # Tokens JWT (Bearer tokens)
            (r'Bearer\s+[A-Za-z0-9\-_\.]+', 'Bearer [TOKEN_REDACTED]'),
            
            # Passwords em URLs
            (r'://[^:]+:[^@]+@', '://[USER:PASS_REDACTED]@'),
            
            # Números de cartão de crédito
            (r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', '[CARD_REDACTED]'),
            
            # Chaves hexadecimais longas (provavelmente secrets)
            (r'\b[a-fA-F0-9]{32,}\b', '[HEX_KEY_REDACTED]'),
        ]
        
        # Campos que devem ser totalmente removidos
        self.remove_fields = {
            'password', 'secret', 'private_key', 'hashed_password'
        }
        
        # Campos que devem ser mascarados (mostrar apenas parte)
        self.mask_fields = {
            'username', 'email', 'phone', 'user_id'
        }
    
    def sanitize_dict(self, data: Dict[str, Any], max_depth: int = 10) -> Dict[str, Any]:
        """Sanitizar dicionário recursivamente"""
        if max_depth <= 0:
            return {"error": "max_depth_exceeded"}
        
        if not isinstance(data, dict):
            return data
        
        sanitized = {}
        
        for key, value in data.items():
            key_lower = key.lower()
            
            # Remover campos completamente
            if any(sensitive in key_lower for sensitive in self.remove_fields):
                continue
            
            # Mascarar campos sensíveis
            if any(sensitive in key_lower for sensitive in self.mask_fields):
                sanitized[key] = self._mask_value(value)
            
            # Processar campos sensíveis
            elif any(sensitive in key_lower for sensitive in self.sensitive_fields):
                sanitized[key] = "[REDACTED]"
            
            # Processar recursivamente
            elif isinstance(value, dict):
                sanitized[key] = self.sanitize_dict(value, max_depth - 1)
            
            elif isinstance(value, list):
                sanitized[key] = self._sanitize_list(value, max_depth - 1)
            
            elif isinstance(value, str):
                sanitized[key] = self._sanitize_string(value)
            
            else:
                sanitized[key] = value
        
        return sanitized
    
    def _sanitize_list(self, data: List[Any], max_depth: int) -> List[Any]:
        """Sanitizar lista"""
        if max_depth <= 0:
            return ["max_depth_exceeded"]
        
        sanitized = []
        for item in data:
            if isinstance(item, dict):
                sanitized.append(self.sanitize_dict(item, max_depth - 1))
            elif isinstance(item, list):
                sanitized.append(self._sanitize_list(item, max_depth - 1))
            elif isinstance(item, str):
                sanitized.append(self._sanitize_string(item))
            else:
                sanitized.append(item)
        
        return sanitized
    
    def _sanitize_string(self, text: str) -> str:
        """Sanitizar string aplicando padrões regex"""
        if not isinstance(text, str):
            return text
        
        sanitized = text
        
        # Aplicar padrões regex
        for pattern, replacement in self.sensitive_patterns:
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
        
        return sanitized
    
    def _mask_value(self, value: Any) -> str:
        """Mascarar valor mantendo apenas parte"""
        if not isinstance(value, str):
            return "[REDACTED]"
        
        if len(value) <= 3:
            return "***"
        
        # Para emails, mostrar apenas domínio
        if '@' in value:
            parts = value.split('@')
            if len(parts) == 2:
                return f"***@{parts[1]}"
        
        # Para outros valores, mostrar apenas primeiros e últimos caracteres
        if len(value) > 6:
            return f"{value[:2]}***{value[-2:]}"
        else:
            return f"{value[:1]}***{value[-1:]}"
    
    def sanitize_log_record(self, record: logging.LogRecord) -> logging.LogRecord:
        """Sanitizar LogRecord"""
        # Sanitizar mensagem
        if hasattr(record, 'msg') and isinstance(record.msg, str):
            record.msg = self._sanitize_string(record.msg)
        
        # Sanitizar argumentos
        if hasattr(record, 'args') and record.args:
            sanitized_args = []
            for arg in record.args:
                if isinstance(arg, dict):
                    sanitized_args.append(self.sanitize_dict(arg))
                elif isinstance(arg, str):
                    sanitized_args.append(self._sanitize_string(arg))
                else:
                    sanitized_args.append(arg)
            record.args = tuple(sanitized_args)
        
        # Sanitizar campos extras
        for attr_name in dir(record):
            if not attr_name.startswith('_') and attr_name not in {
                'name', 'msg', 'args', 'levelname', 'levelno', 'pathname',
                'filename', 'module', 'lineno', 'funcName', 'created',
                'msecs', 'relativeCreated', 'thread', 'threadName',
                'processName', 'process', 'getMessage', 'exc_info', 'exc_text',
                'stack_info'
            }:
                attr_value = getattr(record, attr_name)
                if isinstance(attr_value, str):
                    attr_lower = attr_name.lower()
                    if any(sensitive in attr_lower for sensitive in self.sensitive_fields):
                        setattr(record, attr_name, "[REDACTED]")
                    else:
                        setattr(record, attr_name, self._sanitize_string(attr_value))
        
        return record
    
    def create_user_hash(self, username: str) -> str:
        """Criar hash do utilizador para logs (em vez de username real)"""
        if not username:
            return "anonymous"
        
        # Criar hash consistente mas não reversível
        hash_obj = hashlib.sha256(f"bgapp_user_{username}".encode())
        return f"user_{hash_obj.hexdigest()[:8]}"
    
    def sanitize_json_log(self, log_data: Union[str, Dict]) -> Dict:
        """Sanitizar dados de log JSON"""
        if isinstance(log_data, str):
            try:
                log_data = json.loads(log_data)
            except json.JSONDecodeError:
                return {"message": self._sanitize_string(log_data)}
        
        if isinstance(log_data, dict):
            return self.sanitize_dict(log_data)
        
        return {"message": str(log_data)}

class SanitizingFilter(logging.Filter):
    """Filtro de logging que sanitiza dados sensíveis"""
    
    def __init__(self, name: str = ""):
        super().__init__(name)
        self.sanitizer = LogSanitizer()
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Filtrar e sanitizar log record"""
        try:
            # Sanitizar o record
            record = self.sanitizer.sanitize_log_record(record)
            
            # Substituir username por hash se existir
            if hasattr(record, 'username') and record.username:
                record.user_id = self.sanitizer.create_user_hash(record.username)
                delattr(record, 'username')
            
            return True
            
        except Exception as e:
            # Em caso de erro na sanitização, permitir log mas marcar como erro
            record.msg = f"[LOG_SANITIZATION_ERROR] {record.msg}"
            record.sanitization_error = str(e)
            return True

# Instância global
log_sanitizer = LogSanitizer()

def get_log_sanitizer() -> LogSanitizer:
    """Obter instância do sanitizador"""
    return log_sanitizer

def create_sanitizing_filter() -> SanitizingFilter:
    """Criar filtro sanitizador"""
    return SanitizingFilter()

if __name__ == "__main__":
    # Teste do sanitizador
    sanitizer = LogSanitizer()
    
    # Dados de teste com informações sensíveis
    test_data = {
        "username": "admin@bgapp.ao",
        "password": "secret123",
        "email": "user@example.com",
        "ip_address": "192.168.1.100",
        "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "message": "User admin@bgapp.ao logged in from 10.0.0.1",
        "nested": {
            "api_key": "sk_live_123456789abcdef",
            "user_data": {
                "phone": "+351912345678",
                "address": "Rua Principal 123, Lisboa"
            }
        }
    }
    
    print("🧪 Teste do Sanitizador de Logs")
    print("=" * 50)
    
    print("\n📋 Dados originais:")
    print(json.dumps(test_data, indent=2))
    
    print("\n🔒 Dados sanitizados:")
    sanitized = sanitizer.sanitize_dict(test_data)
    print(json.dumps(sanitized, indent=2))
    
    print("\n🔑 Hash de utilizador:")
    print(f"admin@bgapp.ao -> {sanitizer.create_user_hash('admin@bgapp.ao')}")
    
    print("\n✅ Teste concluído!")
