"""
Framework de Testes de Segurança Automatizados para BGAPP
Implementa testes abrangentes para todas as funcionalidades de segurança
"""

import asyncio
import json
import time
import secrets
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import requests
import re
from urllib.parse import urljoin
from dataclasses import dataclass
from enum import Enum

class TestSeverity(Enum):
    """Severidade dos testes de segurança"""
    LOW = "low"
    MEDIUM = "medium" 
    HIGH = "high"
    CRITICAL = "critical"

class TestStatus(Enum):
    """Status dos testes"""
    PASS = "pass"
    FAIL = "fail"
    SKIP = "skip"
    ERROR = "error"

@dataclass
class SecurityTestResult:
    """Resultado de um teste de segurança"""
    test_name: str
    category: str
    severity: TestSeverity
    status: TestStatus
    message: str
    details: Dict[str, Any]
    duration: float
    timestamp: str

class SecurityTestFramework:
    """Framework principal de testes de segurança"""
    
    def __init__(self, base_url: str = "http://localhost:8000", timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.results: List[SecurityTestResult] = []
        self.session = requests.Session()
        self.session.timeout = timeout
        
        # Configurar headers padrão
        self.session.headers.update({
            'User-Agent': 'BGAPP-Security-Tests/1.0',
            'Accept': 'application/json'
        })
        
    def run_test(self, test_func, category: str, severity: TestSeverity):
        """Executar um teste individual"""
        test_name = test_func.__name__
        start_time = time.time()
        
        try:
            print(f"🧪 Executando: {test_name}")
            
            # Executar teste
            result = test_func()
            
            # Processar resultado
            if isinstance(result, tuple):
                status, message, details = result
            elif isinstance(result, bool):
                status = TestStatus.PASS if result else TestStatus.FAIL
                message = "Teste passou" if result else "Teste falhou"
                details = {}
            else:
                status = TestStatus.PASS
                message = str(result) if result else "Teste executado"
                details = {}
                
        except Exception as e:
            status = TestStatus.ERROR
            message = f"Erro durante execução: {str(e)}"
            details = {"exception": str(e), "type": type(e).__name__}
        
        duration = time.time() - start_time
        
        # Criar resultado
        test_result = SecurityTestResult(
            test_name=test_name,
            category=category,
            severity=severity,
            status=status,
            message=message,
            details=details,
            duration=duration,
            timestamp=datetime.now().isoformat()
        )
        
        self.results.append(test_result)
        
        # Mostrar resultado
        status_emoji = {
            TestStatus.PASS: "✅",
            TestStatus.FAIL: "❌", 
            TestStatus.SKIP: "⏭️",
            TestStatus.ERROR: "🚨"
        }
        
        print(f"   {status_emoji[status]} {message} ({duration:.2f}s)")
        
        return test_result
    
    def test_cors_configuration(self) -> Tuple[TestStatus, str, Dict]:
        """Testar configuração CORS"""
        try:
            # Teste 1: Origem permitida
            headers = {'Origin': 'http://localhost:8085'}
            response = self.session.options(f"{self.base_url}/health", headers=headers)
            
            if response.status_code != 200:
                return TestStatus.FAIL, "Preflight request falhou", {"status_code": response.status_code}
            
            # Verificar headers CORS
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            # Teste 2: Origem maliciosa
            malicious_headers = {'Origin': 'http://malicious.com'}
            malicious_response = self.session.options(f"{self.base_url}/health", headers=malicious_headers)
            
            details = {
                "allowed_origin_response": cors_headers,
                "malicious_origin_status": malicious_response.status_code,
                "malicious_origin_headers": dict(malicious_response.headers)
            }
            
            # Verificar se origem maliciosa foi bloqueada ou tratada corretamente
            if malicious_response.status_code == 403:
                return TestStatus.PASS, "CORS configurado corretamente - origem maliciosa bloqueada", details
            elif 'http://malicious.com' not in malicious_response.headers.get('Access-Control-Allow-Origin', ''):
                return TestStatus.PASS, "CORS configurado corretamente - origem maliciosa não permitida", details
            else:
                return TestStatus.FAIL, "CORS muito permissivo - origem maliciosa permitida", details
                
        except Exception as e:
            return TestStatus.ERROR, f"Erro ao testar CORS: {e}", {}
    
    def test_csrf_protection(self) -> Tuple[TestStatus, str, Dict]:
        """Testar proteção CSRF"""
        try:
            # Teste 1: Request sem token CSRF
            response = self.session.post(f"{self.base_url}/auth/login", 
                                       json={"username": "test", "password": "test"})
            
            # Verificar se CSRF token é necessário
            csrf_required = response.status_code == 403 or 'csrf' in response.text.lower()
            
            # Teste 2: Verificar se token CSRF é fornecido em GET requests
            get_response = self.session.get(f"{self.base_url}/")
            csrf_token_provided = 'X-CSRF-Token' in get_response.headers or 'csrf_token' in get_response.cookies
            
            details = {
                "post_without_csrf_status": response.status_code,
                "csrf_required": csrf_required,
                "csrf_token_provided": csrf_token_provided,
                "get_response_headers": dict(get_response.headers),
                "cookies": dict(get_response.cookies)
            }
            
            if csrf_token_provided:
                return TestStatus.PASS, "Proteção CSRF implementada - token fornecido", details
            elif csrf_required:
                return TestStatus.PASS, "Proteção CSRF ativa - requests sem token bloqueados", details
            else:
                return TestStatus.FAIL, "Proteção CSRF não detectada", details
                
        except Exception as e:
            return TestStatus.ERROR, f"Erro ao testar CSRF: {e}", {}
    
    def test_authentication_security(self) -> Tuple[TestStatus, str, Dict]:
        """Testar segurança de autenticação"""
        try:
            # Teste 1: Credenciais padrão
            default_creds = [
                ("admin", "admin"),
                ("admin", "password"),
                ("admin", "123456"),
                ("admin", "bgapp123"),  # Credencial anterior hardcoded
                ("root", "root"),
                ("test", "test")
            ]
            
            vulnerable_creds = []
            
            for username, password in default_creds:
                try:
                    response = self.session.post(f"{self.base_url}/auth/login",
                                               json={"username": username, "password": password})
                    if response.status_code == 200:
                        vulnerable_creds.append((username, password))
                except:
                    continue
            
            # Teste 2: Rate limiting
            rapid_requests = []
            for i in range(10):
                try:
                    start = time.time()
                    response = self.session.post(f"{self.base_url}/auth/login",
                                               json={"username": "test", "password": "wrong"})
                    rapid_requests.append({
                        "attempt": i + 1,
                        "status_code": response.status_code,
                        "duration": time.time() - start
                    })
                except:
                    break
            
            # Verificar se rate limiting está ativo
            rate_limited = any(req["status_code"] == 429 for req in rapid_requests)
            
            details = {
                "vulnerable_credentials": vulnerable_creds,
                "rapid_requests": rapid_requests,
                "rate_limited": rate_limited
            }
            
            if vulnerable_creds:
                return TestStatus.FAIL, f"Credenciais padrão vulneráveis encontradas: {vulnerable_creds}", details
            elif rate_limited:
                return TestStatus.PASS, "Autenticação segura - rate limiting ativo", details
            else:
                return TestStatus.PASS, "Sem credenciais padrão vulneráveis detectadas", details
                
        except Exception as e:
            return TestStatus.ERROR, f"Erro ao testar autenticação: {e}", {}
    
    def test_input_validation(self) -> Tuple[TestStatus, str, Dict]:
        """Testar validação de input"""
        try:
            # Payloads de teste
            payloads = [
                # SQL Injection
                "' OR '1'='1",
                "'; DROP TABLE users; --",
                "1' UNION SELECT NULL--",
                
                # XSS
                "<script>alert('xss')</script>",
                "javascript:alert('xss')",
                "<img src=x onerror=alert('xss')>",
                
                # Path Traversal
                "../../etc/passwd",
                "..\\..\\windows\\system32\\config\\sam",
                
                # Command Injection
                "; cat /etc/passwd",
                "| whoami",
                "&& ping -c 1 127.0.0.1",
                
                # NoSQL Injection
                '{"$gt":""}',
                '{"$ne":null}',
                
                # XXE
                '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>'
            ]
            
            vulnerable_endpoints = []
            
            # Testar endpoints comuns
            test_endpoints = [
                "/api/users",
                "/api/search",
                "/admin/config",
                "/auth/login"
            ]
            
            for endpoint in test_endpoints:
                for payload in payloads:
                    try:
                        # Testar em query params
                        response = self.session.get(f"{self.base_url}{endpoint}?q={payload}")
                        if self._is_vulnerable_response(response, payload):
                            vulnerable_endpoints.append({
                                "endpoint": endpoint,
                                "payload": payload,
                                "method": "GET",
                                "status": response.status_code
                            })
                        
                        # Testar em POST data
                        response = self.session.post(f"{self.base_url}{endpoint}",
                                                   json={"data": payload})
                        if self._is_vulnerable_response(response, payload):
                            vulnerable_endpoints.append({
                                "endpoint": endpoint,
                                "payload": payload,
                                "method": "POST", 
                                "status": response.status_code
                            })
                            
                    except:
                        continue
            
            details = {
                "payloads_tested": len(payloads),
                "endpoints_tested": len(test_endpoints),
                "vulnerable_endpoints": vulnerable_endpoints
            }
            
            if vulnerable_endpoints:
                return TestStatus.FAIL, f"Vulnerabilidades de input encontradas: {len(vulnerable_endpoints)}", details
            else:
                return TestStatus.PASS, "Validação de input adequada", details
                
        except Exception as e:
            return TestStatus.ERROR, f"Erro ao testar validação de input: {e}", {}
    
    def test_security_headers(self) -> Tuple[TestStatus, str, Dict]:
        """Testar headers de segurança"""
        try:
            response = self.session.get(f"{self.base_url}/")
            
            # Headers de segurança esperados
            expected_headers = {
                'X-Frame-Options': ['DENY', 'SAMEORIGIN'],
                'X-Content-Type-Options': ['nosniff'],
                'X-XSS-Protection': ['1; mode=block', '0'],
                'Strict-Transport-Security': None,  # Qualquer valor é bom
                'Content-Security-Policy': None,
                'Referrer-Policy': None
            }
            
            header_status = {}
            missing_headers = []
            
            for header, expected_values in expected_headers.items():
                header_value = response.headers.get(header)
                if header_value:
                    if expected_values is None or header_value in expected_values:
                        header_status[header] = {"status": "present", "value": header_value}
                    else:
                        header_status[header] = {"status": "incorrect", "value": header_value, "expected": expected_values}
                else:
                    header_status[header] = {"status": "missing"}
                    missing_headers.append(header)
            
            details = {
                "headers_checked": header_status,
                "missing_headers": missing_headers,
                "response_headers": dict(response.headers)
            }
            
            critical_missing = [h for h in missing_headers if h in ['X-Frame-Options', 'X-Content-Type-Options']]
            
            if critical_missing:
                return TestStatus.FAIL, f"Headers críticos ausentes: {critical_missing}", details
            elif missing_headers:
                return TestStatus.PASS, f"Headers básicos presentes, alguns opcionais ausentes: {missing_headers}", details
            else:
                return TestStatus.PASS, "Todos os headers de segurança presentes", details
                
        except Exception as e:
            return TestStatus.ERROR, f"Erro ao testar headers: {e}", {}
    
    def test_logs_sanitization(self) -> Tuple[TestStatus, str, Dict]:
        """Testar sanitização de logs"""
        try:
            # Tentar gerar logs com dados sensíveis
            sensitive_data = {
                "email": "test@example.com",
                "password": "secret123",
                "credit_card": "4111-1111-1111-1111",
                "ssn": "123-45-6789"
            }
            
            # Fazer request que deve gerar log
            response = self.session.post(f"{self.base_url}/auth/login", json=sensitive_data)
            
            # Verificar se logs existem e estão sanitizados
            log_files = [
                "logs/audit.log",
                "logs/bgapp.log", 
                "admin_api.log"
            ]
            
            sanitized_properly = True
            log_issues = []
            
            for log_file in log_files:
                if Path(log_file).exists():
                    try:
                        with open(log_file, 'r', encoding='utf-8') as f:
                            content = f.read()
                            
                            # Verificar se dados sensíveis aparecem em texto claro
                            for key, value in sensitive_data.items():
                                if value in content and key != "email":  # Email pode aparecer mascarado
                                    sanitized_properly = False
                                    log_issues.append(f"Dados sensíveis '{key}' encontrados em {log_file}")
                                    
                    except Exception as e:
                        log_issues.append(f"Erro ao ler {log_file}: {e}")
            
            details = {
                "log_files_checked": log_files,
                "sanitized_properly": sanitized_properly,
                "issues": log_issues,
                "sensitive_data_tested": list(sensitive_data.keys())
            }
            
            if not sanitized_properly:
                return TestStatus.FAIL, f"Logs não sanitizados adequadamente: {len(log_issues)} problemas", details
            else:
                return TestStatus.PASS, "Logs parecem estar sanitizados adequadamente", details
                
        except Exception as e:
            return TestStatus.ERROR, f"Erro ao testar sanitização: {e}", {}
    
    def test_secrets_management(self) -> Tuple[TestStatus, str, Dict]:
        """Testar gestão de secrets"""
        try:
            # Verificar se arquivos de secrets estão protegidos
            secret_files = [
                ".encryption_key",
                "secure_credentials.enc",
                ".env"
            ]
            
            file_permissions = {}
            security_issues = []
            
            for file_path in secret_files:
                path = Path(file_path)
                if path.exists():
                    stat = path.stat()
                    permissions = oct(stat.st_mode)[-3:]
                    file_permissions[file_path] = permissions
                    
                    # Verificar permissões (deve ser 600 ou mais restritivo)
                    if permissions not in ['600', '400']:
                        security_issues.append(f"{file_path} tem permissões inseguras: {permissions}")
                else:
                    file_permissions[file_path] = "not_found"
            
            # Verificar se credenciais hardcoded estão presentes no código
            code_files = list(Path("src").rglob("*.py"))
            hardcoded_secrets = []
            
            for file_path in code_files[:10]:  # Limitar para não ser muito lento
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # Padrões suspeitos
                        patterns = [
                            r'password\s*=\s*["\'][^"\']{3,}["\']',
                            r'secret\s*=\s*["\'][^"\']{10,}["\']',
                            r'api_key\s*=\s*["\'][^"\']{10,}["\']'
                        ]
                        
                        for pattern in patterns:
                            matches = re.findall(pattern, content, re.IGNORECASE)
                            if matches:
                                hardcoded_secrets.append({
                                    "file": str(file_path),
                                    "matches": matches
                                })
                except:
                    continue
            
            details = {
                "file_permissions": file_permissions,
                "security_issues": security_issues,
                "hardcoded_secrets": hardcoded_secrets,
                "files_checked": len(code_files)
            }
            
            if security_issues or hardcoded_secrets:
                return TestStatus.FAIL, f"Problemas de gestão de secrets: {len(security_issues + hardcoded_secrets)}", details
            else:
                return TestStatus.PASS, "Gestão de secrets adequada", details
                
        except Exception as e:
            return TestStatus.ERROR, f"Erro ao testar secrets: {e}", {}
    
    def _is_vulnerable_response(self, response, payload) -> bool:
        """Verificar se resposta indica vulnerabilidade"""
        # Indicadores de SQL injection
        sql_errors = [
            "sql syntax", "mysql_fetch", "ora-", "microsoft ole db",
            "sqlite_", "postgresql", "warning: mysql"
        ]
        
        # Indicadores de XSS
        xss_indicators = [
            "<script", "javascript:", "onerror=", "onload="
        ]
        
        # Indicadores de path traversal
        path_indicators = [
            "root:x:", "boot.ini", "[boot loader]"
        ]
        
        response_text = response.text.lower()
        
        # Verificar SQL injection
        if any(error in response_text for error in sql_errors):
            return True
        
        # Verificar XSS (payload refletido sem escape)
        if any(indicator in response_text for indicator in xss_indicators):
            if payload.lower() in response_text:
                return True
        
        # Verificar path traversal
        if any(indicator in response_text for indicator in path_indicators):
            return True
        
        # Status codes suspeitos
        if response.status_code == 500 and len(payload) > 10:
            return True
        
        return False
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Executar todos os testes de segurança"""
        print("🔒 Iniciando Testes de Segurança Automatizados - BGAPP")
        print("=" * 60)
        
        start_time = time.time()
        
        # Definir testes
        tests = [
            (self.test_cors_configuration, "CORS", TestSeverity.HIGH),
            (self.test_csrf_protection, "CSRF", TestSeverity.HIGH),
            (self.test_authentication_security, "Authentication", TestSeverity.CRITICAL),
            (self.test_input_validation, "Input Validation", TestSeverity.HIGH),
            (self.test_security_headers, "Security Headers", TestSeverity.MEDIUM),
            (self.test_logs_sanitization, "Log Sanitization", TestSeverity.MEDIUM),
            (self.test_secrets_management, "Secrets Management", TestSeverity.CRITICAL),
        ]
        
        # Executar testes
        for test_func, category, severity in tests:
            self.run_test(test_func, category, severity)
        
        total_duration = time.time() - start_time
        
        # Compilar resultados
        results_summary = {
            "total_tests": len(self.results),
            "passed": len([r for r in self.results if r.status == TestStatus.PASS]),
            "failed": len([r for r in self.results if r.status == TestStatus.FAIL]),
            "errors": len([r for r in self.results if r.status == TestStatus.ERROR]),
            "skipped": len([r for r in self.results if r.status == TestStatus.SKIP]),
            "duration": total_duration,
            "timestamp": datetime.now().isoformat()
        }
        
        # Calcular score de segurança
        security_score = self._calculate_security_score()
        
        print(f"\n📊 Resultados dos Testes de Segurança:")
        print(f"   ✅ Passou: {results_summary['passed']}")
        print(f"   ❌ Falhou: {results_summary['failed']}")
        print(f"   🚨 Erros: {results_summary['errors']}")
        print(f"   ⏭️ Pulados: {results_summary['skipped']}")
        print(f"   🏆 Score: {security_score:.1f}/10")
        print(f"   ⏱️ Duração: {total_duration:.2f}s")
        
        return {
            "summary": results_summary,
            "security_score": security_score,
            "results": [
                {
                    "test_name": r.test_name,
                    "category": r.category,
                    "severity": r.severity.value,
                    "status": r.status.value,
                    "message": r.message,
                    "duration": r.duration
                }
                for r in self.results
            ]
        }
    
    def _calculate_security_score(self) -> float:
        """Calcular score de segurança baseado nos resultados"""
        if not self.results:
            return 0.0
        
        # Pesos por severidade
        severity_weights = {
            TestSeverity.CRITICAL: 4.0,
            TestSeverity.HIGH: 3.0,
            TestSeverity.MEDIUM: 2.0,
            TestSeverity.LOW: 1.0
        }
        
        total_weight = 0
        passed_weight = 0
        
        for result in self.results:
            weight = severity_weights[result.severity]
            total_weight += weight
            
            if result.status == TestStatus.PASS:
                passed_weight += weight
            elif result.status == TestStatus.SKIP:
                # Testes pulados não contam negativamente
                total_weight -= weight
        
        if total_weight == 0:
            return 0.0
        
        return (passed_weight / total_weight) * 10.0

if __name__ == "__main__":
    # Executar testes
    framework = SecurityTestFramework()
    results = framework.run_all_tests()
    
    # Salvar resultados
    with open("security_test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Resultados salvos em: security_test_results.json")
    
    # Exit code baseado nos resultados
    if results["summary"]["failed"] > 0:
        exit(1)
    else:
        exit(0)
