"""
Testes de Penetração Automatizados para BGAPP
Implementa ataques controlados para verificar defesas
"""

import requests
import time
import json
import random
import string
import threading
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional
from urllib.parse import urljoin, quote
from enum import Enum
import base64
import hashlib

class AttackType(Enum):
    """Tipos de ataques testados"""
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    CSRF = "csrf"
    BRUTE_FORCE = "brute_force"
    PATH_TRAVERSAL = "path_traversal"
    COMMAND_INJECTION = "command_injection"
    CORS_BYPASS = "cors_bypass"
    SESSION_HIJACKING = "session_hijacking"

class AttackResult(Enum):
    """Resultados dos ataques"""
    BLOCKED = "blocked"          # Ataque bloqueado (bom)
    SUCCESSFUL = "successful"    # Ataque bem-sucedido (vulnerabilidade)
    DETECTED = "detected"        # Ataque detectado mas não bloqueado
    UNKNOWN = "unknown"          # Resultado inconclusivo

class PenetrationTester:
    """Sistema de testes de penetração"""
    
    def __init__(self, base_url: str = "http://localhost:8000", max_requests: int = 100):
        self.base_url = base_url.rstrip('/')
        self.max_requests = max_requests
        self.session = requests.Session()
        self.session.timeout = 10
        
        # Headers para parecer um browser real
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        })
        
        self.results = []
        self.request_count = 0
        
    def test_sql_injection(self) -> Tuple[AttackResult, str, Dict]:
        """Testar vulnerabilidades de SQL injection"""
        payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT NULL, username, password FROM users --",
            "1' AND (SELECT COUNT(*) FROM users) > 0 --",
            "admin'/**/OR/**/1=1#",
            "' OR 1=1 LIMIT 1 --",
            "1' OR '1'='1' /*",
        ]
        
        endpoints = [
            "/api/users",
            "/auth/login", 
            "/api/search",
            "/admin/config"
        ]
        
        vulnerabilities = []
        
        for endpoint in endpoints:
            for payload in payloads:
                if self.request_count >= self.max_requests:
                    break
                    
                try:
                    # Teste em query parameter
                    response = self.session.get(f"{self.base_url}{endpoint}?id={quote(payload)}")
                    self.request_count += 1
                    
                    if self._is_sql_injection_successful(response):
                        vulnerabilities.append({
                            "endpoint": endpoint,
                            "payload": payload,
                            "method": "GET",
                            "response_code": response.status_code
                        })
                    
                    # Teste em POST data
                    response = self.session.post(f"{self.base_url}{endpoint}", 
                                               json={"query": payload})
                    self.request_count += 1
                    
                    if self._is_sql_injection_successful(response):
                        vulnerabilities.append({
                            "endpoint": endpoint,
                            "payload": payload,
                            "method": "POST",
                            "response_code": response.status_code
                        })
                        
                except requests.exceptions.ConnectionError:
                    return AttackResult.UNKNOWN, "Servidor não disponível", {}
                except Exception:
                    continue
        
        details = {
            "payloads_tested": len(payloads),
            "endpoints_tested": len(endpoints),
            "vulnerabilities": vulnerabilities,
            "requests_made": self.request_count
        }
        
        if vulnerabilities:
            return AttackResult.SUCCESSFUL, f"SQL Injection vulnerável: {len(vulnerabilities)} pontos", details
        else:
            return AttackResult.BLOCKED, "SQL Injection bloqueado adequadamente", details
    
    def test_xss_attacks(self) -> Tuple[AttackResult, str, Dict]:
        """Testar vulnerabilidades XSS"""
        payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "'\"><script>alert('XSS')</script>",
            "<iframe src=javascript:alert('XSS')></iframe>",
            "<body onload=alert('XSS')>"
        ]
        
        endpoints = [
            "/api/search",
            "/api/users",
            "/admin/logs"
        ]
        
        xss_vulnerabilities = []
        
        for endpoint in endpoints:
            for payload in payloads:
                if self.request_count >= self.max_requests:
                    break
                    
                try:
                    # Teste em query parameter
                    response = self.session.get(f"{self.base_url}{endpoint}?q={quote(payload)}")
                    self.request_count += 1
                    
                    if self._is_xss_successful(response, payload):
                        xss_vulnerabilities.append({
                            "endpoint": endpoint,
                            "payload": payload,
                            "method": "GET"
                        })
                        
                except requests.exceptions.ConnectionError:
                    return AttackResult.UNKNOWN, "Servidor não disponível", {}
                except Exception:
                    continue
        
        details = {
            "payloads_tested": len(payloads),
            "xss_vulnerabilities": xss_vulnerabilities
        }
        
        if xss_vulnerabilities:
            return AttackResult.SUCCESSFUL, f"XSS vulnerável: {len(xss_vulnerabilities)} pontos", details
        else:
            return AttackResult.BLOCKED, "XSS adequadamente bloqueado", details
    
    def test_brute_force_protection(self) -> Tuple[AttackResult, str, Dict]:
        """Testar proteção contra brute force"""
        login_endpoint = f"{self.base_url}/auth/login"
        
        # Tentar múltiplos logins rapidamente
        attempts = []
        start_time = time.time()
        
        for i in range(20):  # 20 tentativas rápidas
            if self.request_count >= self.max_requests:
                break
                
            try:
                response = self.session.post(login_endpoint, json={
                    "username": "admin",
                    "password": f"wrong_password_{i}"
                })
                self.request_count += 1
                
                attempts.append({
                    "attempt": i + 1,
                    "status_code": response.status_code,
                    "response_time": time.time() - start_time
                })
                
                # Se retornar 429 (Too Many Requests), rate limiting está ativo
                if response.status_code == 429:
                    break
                    
                # Pequeno delay para não sobrecarregar
                time.sleep(0.1)
                
            except requests.exceptions.ConnectionError:
                return AttackResult.UNKNOWN, "Servidor não disponível", {}
            except Exception:
                continue
        
        total_time = time.time() - start_time
        rate_limited = any(attempt["status_code"] == 429 for attempt in attempts)
        avg_response_time = sum(a["response_time"] for a in attempts) / len(attempts) if attempts else 0
        
        details = {
            "total_attempts": len(attempts),
            "total_time": total_time,
            "rate_limited": rate_limited,
            "avg_response_time": avg_response_time,
            "attempts": attempts
        }
        
        if rate_limited:
            return AttackResult.BLOCKED, "Rate limiting ativo - brute force bloqueado", details
        elif avg_response_time > 1.0:  # Resposta lenta pode indicar proteção
            return AttackResult.DETECTED, "Possível proteção por throttling detectada", details
        else:
            return AttackResult.SUCCESSFUL, "Sem proteção adequada contra brute force", details
    
    def test_cors_bypass(self) -> Tuple[AttackResult, str, Dict]:
        """Testar bypass de CORS"""
        malicious_origins = [
            "http://malicious.com",
            "https://evil.com",
            "http://localhost.evil.com",
            "null",
            "file://",
            "data:text/html,<script>alert('CORS')</script>"
        ]
        
        cors_tests = []
        
        for origin in malicious_origins:
            if self.request_count >= self.max_requests:
                break
                
            try:
                # Preflight request
                response = self.session.options(f"{self.base_url}/api/users", headers={
                    "Origin": origin,
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type"
                })
                self.request_count += 1
                
                cors_allowed = origin in response.headers.get("Access-Control-Allow-Origin", "")
                
                cors_tests.append({
                    "origin": origin,
                    "status_code": response.status_code,
                    "cors_allowed": cors_allowed,
                    "cors_header": response.headers.get("Access-Control-Allow-Origin")
                })
                
            except requests.exceptions.ConnectionError:
                return AttackResult.UNKNOWN, "Servidor não disponível", {}
            except Exception:
                continue
        
        vulnerable_origins = [test for test in cors_tests if test["cors_allowed"]]
        
        details = {
            "origins_tested": malicious_origins,
            "cors_tests": cors_tests,
            "vulnerable_origins": vulnerable_origins
        }
        
        if vulnerable_origins:
            return AttackResult.SUCCESSFUL, f"CORS bypass possível: {len(vulnerable_origins)} origens", details
        else:
            return AttackResult.BLOCKED, "CORS adequadamente restritivo", details
    
    def test_path_traversal(self) -> Tuple[AttackResult, str, Dict]:
        """Testar path traversal"""
        payloads = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "....//....//....//etc/passwd",
            "..%252f..%252f..%252fetc%252fpasswd"
        ]
        
        endpoints = [
            "/api/files",
            "/admin/logs",
            "/api/export"
        ]
        
        traversal_vulnerabilities = []
        
        for endpoint in endpoints:
            for payload in payloads:
                if self.request_count >= self.max_requests:
                    break
                    
                try:
                    response = self.session.get(f"{self.base_url}{endpoint}?file={quote(payload)}")
                    self.request_count += 1
                    
                    if self._is_path_traversal_successful(response):
                        traversal_vulnerabilities.append({
                            "endpoint": endpoint,
                            "payload": payload,
                            "status_code": response.status_code
                        })
                        
                except requests.exceptions.ConnectionError:
                    return AttackResult.UNKNOWN, "Servidor não disponível", {}
                except Exception:
                    continue
        
        details = {
            "payloads_tested": len(payloads),
            "vulnerabilities": traversal_vulnerabilities
        }
        
        if traversal_vulnerabilities:
            return AttackResult.SUCCESSFUL, f"Path traversal vulnerável: {len(traversal_vulnerabilities)}", details
        else:
            return AttackResult.BLOCKED, "Path traversal adequadamente bloqueado", details
    
    def _is_sql_injection_successful(self, response) -> bool:
        """Verificar se SQL injection foi bem-sucedida"""
        # Indicadores de erro SQL
        sql_errors = [
            "sql syntax", "mysql_fetch", "ora-", "microsoft ole db",
            "sqlite_", "postgresql", "warning: mysql", "sql server",
            "syntax error", "mysql_num_rows", "table doesn't exist"
        ]
        
        response_text = response.text.lower()
        return any(error in response_text for error in sql_errors)
    
    def _is_xss_successful(self, response, payload) -> bool:
        """Verificar se XSS foi bem-sucedida"""
        # Verificar se payload foi refletido sem escape
        response_text = response.text.lower()
        payload_lower = payload.lower()
        
        # Se contém script tags ou javascript: sem escape
        if "<script" in payload_lower and "<script" in response_text:
            return True
        
        if "javascript:" in payload_lower and "javascript:" in response_text:
            return True
        
        # Verificar eventos HTML sem escape
        html_events = ["onerror=", "onload=", "onclick="]
        if any(event in payload_lower and event in response_text for event in html_events):
            return True
        
        return False
    
    def _is_path_traversal_successful(self, response) -> bool:
        """Verificar se path traversal foi bem-sucedida"""
        # Indicadores de acesso a arquivos do sistema
        system_indicators = [
            "root:x:", "daemon:x:", "bin:x:",  # /etc/passwd
            "[boot loader]", "boot.ini",       # Windows boot files
            "# /etc/passwd", "# User Database"  # Comentários típicos
        ]
        
        response_text = response.text.lower()
        return any(indicator in response_text for indicator in system_indicators)
    
    def run_penetration_tests(self) -> Dict[str, Any]:
        """Executar todos os testes de penetração"""
        print("🔍 Iniciando Testes de Penetração - BGAPP")
        print("⚠️  AVISO: Testes controlados em ambiente seguro")
        print("=" * 60)
        
        start_time = time.time()
        
        # Definir testes
        tests = [
            (self.test_sql_injection, AttackType.SQL_INJECTION, "SQL Injection"),
            (self.test_xss_attacks, AttackType.XSS, "Cross-Site Scripting"),
            (self.test_brute_force_protection, AttackType.BRUTE_FORCE, "Brute Force"),
            (self.test_cors_bypass, AttackType.CORS_BYPASS, "CORS Bypass"),
            (self.test_path_traversal, AttackType.PATH_TRAVERSAL, "Path Traversal"),
        ]
        
        # Executar testes
        for test_func, attack_type, description in tests:
            if self.request_count >= self.max_requests:
                print(f"⚠️ Limite de requests atingido ({self.max_requests})")
                break
                
            print(f"\n🎯 Testando: {description}")
            
            try:
                result, message, details = test_func()
                
                self.results.append({
                    "attack_type": attack_type.value,
                    "description": description,
                    "result": result.value,
                    "message": message,
                    "details": details,
                    "timestamp": datetime.now().isoformat()
                })
                
                # Mostrar resultado
                result_emoji = {
                    AttackResult.BLOCKED: "✅",
                    AttackResult.SUCCESSFUL: "🚨",
                    AttackResult.DETECTED: "⚠️",
                    AttackResult.UNKNOWN: "❓"
                }
                
                emoji = result_emoji.get(result, "❓")
                print(f"   {emoji} {message}")
                
            except Exception as e:
                print(f"   🚨 Erro no teste: {e}")
                self.results.append({
                    "attack_type": attack_type.value,
                    "description": description,
                    "result": "error",
                    "message": f"Erro: {e}",
                    "details": {},
                    "timestamp": datetime.now().isoformat()
                })
        
        total_duration = time.time() - start_time
        
        # Compilar resultados
        blocked = len([r for r in self.results if r["result"] == "blocked"])
        successful = len([r for r in self.results if r["result"] == "successful"])
        detected = len([r for r in self.results if r["result"] == "detected"])
        unknown = len([r for r in self.results if r["result"] == "unknown"])
        errors = len([r for r in self.results if r["result"] == "error"])
        
        # Calcular score de defesa
        defense_score = self._calculate_defense_score()
        
        summary = {
            "total_tests": len(self.results),
            "blocked": blocked,
            "successful": successful,
            "detected": detected,
            "unknown": unknown,
            "errors": errors,
            "defense_score": defense_score,
            "requests_made": self.request_count,
            "duration": total_duration,
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"\n📊 Resumo dos Testes de Penetração:")
        print(f"   ✅ Bloqueados: {blocked}")
        print(f"   🚨 Bem-sucedidos: {successful}")
        print(f"   ⚠️ Detectados: {detected}")
        print(f"   ❓ Inconclusivos: {unknown}")
        print(f"   🚨 Erros: {errors}")
        print(f"   🛡️ Score de Defesa: {defense_score:.1f}/10")
        print(f"   📡 Requests: {self.request_count}")
        print(f"   ⏱️ Duração: {total_duration:.2f}s")
        
        return {
            "summary": summary,
            "results": self.results
        }
    
    def _calculate_defense_score(self) -> float:
        """Calcular score de defesa baseado nos resultados"""
        if not self.results:
            return 0.0
        
        # Pontuação por resultado
        result_scores = {
            "blocked": 10.0,    # Melhor resultado
            "detected": 6.0,    # Detectado mas não bloqueado
            "successful": 0.0,  # Vulnerabilidade
            "unknown": 5.0,     # Inconclusivo
            "error": 3.0        # Erro no teste
        }
        
        total_score = 0
        for result in self.results:
            total_score += result_scores.get(result["result"], 0)
        
        return total_score / len(self.results)

def run_safe_penetration_tests(base_url: str = "http://localhost:8000") -> Dict[str, Any]:
    """Executar testes de penetração seguros"""
    tester = PenetrationTester(base_url=base_url, max_requests=50)  # Limite baixo para segurança
    return tester.run_penetration_tests()

if __name__ == "__main__":
    # Teste dos testes de penetração
    print("🔍 Teste do Sistema de Penetração")
    print("⚠️  AVISO: Apenas testes controlados e seguros")
    print("=" * 50)
    
    # Executar testes
    results = run_safe_penetration_tests()
    
    # Salvar resultados
    with open("penetration_test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Resultados salvos em: penetration_test_results.json")
    
    # Mostrar avaliação final
    score = results["summary"]["defense_score"]
    successful_attacks = results["summary"]["successful"]
    
    print(f"\n🏆 Avaliação Final:")
    if score >= 9.0 and successful_attacks == 0:
        print("🟢 EXCELENTE - Defesas muito robustas")
    elif score >= 7.0 and successful_attacks <= 1:
        print("🟡 BOM - Defesas adequadas com pequenas melhorias")
    elif score >= 5.0:
        print("🟠 MÉDIO - Algumas vulnerabilidades encontradas")
    else:
        print("🔴 CRÍTICO - Múltiplas vulnerabilidades graves")
    
    if successful_attacks > 0:
        print(f"⚠️ {successful_attacks} ataques bem-sucedidos - revisar defesas")
    
    print("\n✅ Testes de penetração concluídos!")
