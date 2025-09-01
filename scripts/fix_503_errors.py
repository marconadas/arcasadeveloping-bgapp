#!/usr/bin/env python3
"""
Script para diagnosticar e resolver erros 503 na aplicação BGAPP
Detecta automaticamente problemas comuns e aplica correções
"""

import subprocess
import time
import requests
import json
import sys
from pathlib import Path

class BGAPPDiagnostic:
    def __init__(self):
        self.base_path = Path(__file__).parent.parent
        self.infra_path = self.base_path / "infra"
        self.issues_found = []
        self.fixes_applied = []
        
    def log(self, message, level="INFO"):
        """Log com timestamp"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def run_command(self, command, cwd=None):
        """Executar comando shell"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                cwd=cwd or self.infra_path
            )
            return result.returncode == 0, result.stdout, result.stderr
        except Exception as e:
            return False, "", str(e)
    
    def check_containers_status(self):
        """Verificar status dos containers"""
        self.log("Verificando status dos containers...")
        
        success, stdout, stderr = self.run_command("docker compose ps --format json")
        if not success:
            self.issues_found.append("Docker compose não está funcionando")
            return False
        
        try:
            containers = []
            for line in stdout.strip().split('\n'):
                if line.strip():
                    containers.append(json.loads(line))
            
            critical_services = ['frontend', 'admin-api', 'postgis', 'redis']
            down_services = []
            
            for container in containers:
                service = container.get('Service', '')
                state = container.get('State', '')
                
                if service in critical_services and state != 'running':
                    down_services.append(service)
            
            if down_services:
                self.issues_found.append(f"Serviços críticos offline: {', '.join(down_services)}")
                return False
            
            self.log(f"✅ Todos os {len(containers)} containers estão rodando")
            return True
            
        except Exception as e:
            self.issues_found.append(f"Erro ao parsear status dos containers: {e}")
            return False
    
    def check_nginx_rate_limiting(self):
        """Verificar se rate limiting está muito agressivo"""
        self.log("Verificando configuração de rate limiting...")
        
        success, stdout, stderr = self.run_command(
            "docker compose logs frontend --tail=50 | grep 'limiting requests'"
        )
        
        if success and stdout.strip():
            self.issues_found.append("Rate limiting muito agressivo detectado")
            return False
        
        self.log("✅ Rate limiting está OK")
        return True
    
    def check_admin_api_connectivity(self):
        """Verificar conectividade com admin-api"""
        self.log("Testando conectividade com admin-api...")
        
        try:
            # Testar direto na porta 8000
            response = requests.get("http://localhost:8000/health", timeout=10)
            if response.status_code == 200:
                self.log("✅ Admin API respondendo diretamente na porta 8000")
                
                # Testar através do proxy nginx
                try:
                    response = requests.get("http://localhost:8085/admin-api/health", timeout=10)
                    if response.status_code == 200:
                        self.log("✅ Admin API respondendo através do nginx proxy")
                        return True
                    else:
                        self.issues_found.append(f"Nginx proxy retornando {response.status_code}")
                        return False
                except requests.RequestException as e:
                    self.issues_found.append(f"Erro no proxy nginx: {e}")
                    return False
            else:
                self.issues_found.append(f"Admin API retornando {response.status_code}")
                return False
                
        except requests.RequestException as e:
            self.issues_found.append(f"Admin API não está respondendo: {e}")
            return False
    
    def check_frontend_accessibility(self):
        """Verificar se frontend está acessível"""
        self.log("Testando acessibilidade do frontend...")
        
        try:
            response = requests.get("http://localhost:8085/admin.html", timeout=10)
            if response.status_code == 200:
                self.log("✅ Frontend acessível")
                return True
            elif response.status_code == 503:
                self.issues_found.append("Frontend retornando 503 Service Unavailable")
                return False
            else:
                self.issues_found.append(f"Frontend retornando {response.status_code}")
                return False
        except requests.RequestException as e:
            self.issues_found.append(f"Frontend não acessível: {e}")
            return False
    
    def fix_rate_limiting(self):
        """Corrigir rate limiting agressivo"""
        self.log("Aplicando correção para rate limiting...")
        
        nginx_conf = self.infra_path / "nginx" / "nginx.conf"
        
        try:
            # Ler arquivo atual
            with open(nginx_conf, 'r') as f:
                content = f.read()
            
            # Aplicar correções
            fixes = [
                ("rate=5r/m", "rate=60r/m"),
                ("rate=30r/m", "rate=300r/m"),
                ("burst=10 nodelay", "burst=50 nodelay"),
                ("burst=20 nodelay", "burst=100 nodelay")
            ]
            
            modified = False
            for old, new in fixes:
                if old in content:
                    content = content.replace(old, new)
                    modified = True
            
            if modified:
                # Fazer backup
                backup_file = nginx_conf.with_suffix('.conf.backup')
                with open(backup_file, 'w') as f:
                    with open(nginx_conf, 'r') as original:
                        f.write(original.read())
                
                # Escrever nova configuração
                with open(nginx_conf, 'w') as f:
                    f.write(content)
                
                self.fixes_applied.append("Rate limiting configurado para desenvolvimento")
                return True
            
            return False
            
        except Exception as e:
            self.log(f"Erro ao corrigir rate limiting: {e}", "ERROR")
            return False
    
    def restart_frontend(self):
        """Reiniciar container do frontend"""
        self.log("Reiniciando container do frontend...")
        
        success, stdout, stderr = self.run_command("docker compose restart frontend")
        if success:
            self.fixes_applied.append("Container frontend reiniciado")
            time.sleep(5)  # Aguardar container subir
            return True
        else:
            self.log(f"Erro ao reiniciar frontend: {stderr}", "ERROR")
            return False
    
    def restart_admin_api(self):
        """Reiniciar container do admin-api"""
        self.log("Reiniciando container do admin-api...")
        
        success, stdout, stderr = self.run_command("docker compose restart admin-api")
        if success:
            self.fixes_applied.append("Container admin-api reiniciado")
            time.sleep(10)  # Aguardar container subir
            return True
        else:
            self.log(f"Erro ao reiniciar admin-api: {stderr}", "ERROR")
            return False
    
    def run_diagnosis(self):
        """Executar diagnóstico completo"""
        self.log("🔍 Iniciando diagnóstico BGAPP...")
        
        checks = [
            ("Containers Status", self.check_containers_status),
            ("Frontend Accessibility", self.check_frontend_accessibility),
            ("Admin API Connectivity", self.check_admin_api_connectivity),
            ("Nginx Rate Limiting", self.check_nginx_rate_limiting)
        ]
        
        all_good = True
        for check_name, check_func in checks:
            if not check_func():
                all_good = False
        
        return all_good
    
    def apply_fixes(self):
        """Aplicar correções para problemas encontrados"""
        if not self.issues_found:
            self.log("✅ Nenhum problema encontrado!")
            return True
        
        self.log(f"🔧 Aplicando correções para {len(self.issues_found)} problemas...")
        
        # Correção 1: Rate limiting
        if any("rate limiting" in issue.lower() for issue in self.issues_found):
            if self.fix_rate_limiting():
                if not self.restart_frontend():
                    return False
        
        # Correção 2: Admin API não respondendo
        if any("admin api" in issue.lower() for issue in self.issues_found):
            if not self.restart_admin_api():
                return False
        
        # Correção 3: Frontend 503
        if any("503" in issue for issue in self.issues_found):
            if not self.restart_frontend():
                return False
        
        # Aguardar e verificar novamente
        self.log("Aguardando serviços estabilizarem...")
        time.sleep(15)
        
        # Verificar se correções funcionaram
        self.issues_found = []
        if self.run_diagnosis():
            self.log("✅ Todas as correções aplicadas com sucesso!")
            return True
        else:
            self.log("❌ Alguns problemas persistem após correções", "WARNING")
            return False
    
    def generate_report(self):
        """Gerar relatório final"""
        self.log("\n" + "="*60)
        self.log("📋 RELATÓRIO FINAL")
        self.log("="*60)
        
        if self.issues_found:
            self.log("❌ PROBLEMAS ENCONTRADOS:")
            for i, issue in enumerate(self.issues_found, 1):
                self.log(f"   {i}. {issue}")
        
        if self.fixes_applied:
            self.log("\n✅ CORREÇÕES APLICADAS:")
            for i, fix in enumerate(self.fixes_applied, 1):
                self.log(f"   {i}. {fix}")
        
        if not self.issues_found and not self.fixes_applied:
            self.log("✅ Sistema funcionando normalmente!")
        
        self.log("\n🌐 URLs para testar:")
        self.log("   - Frontend: http://localhost:8085/admin.html")
        self.log("   - Admin API: http://localhost:8085/admin-api/health")
        self.log("   - Health Check: http://localhost:8000/health")


def main():
    diagnostic = BGAPPDiagnostic()
    
    # Executar diagnóstico
    all_good = diagnostic.run_diagnosis()
    
    if not all_good:
        # Aplicar correções
        success = diagnostic.apply_fixes()
        if not success:
            diagnostic.log("❌ Algumas correções falharam. Verificação manual necessária.", "ERROR")
            sys.exit(1)
    
    # Gerar relatório
    diagnostic.generate_report()
    
    sys.exit(0 if not diagnostic.issues_found else 1)


if __name__ == "__main__":
    main()
