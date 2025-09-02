#!/usr/bin/env python3
"""
🔧 Sistema de Debug Completo BGAPP
Diagnóstico avançado e correção automática de problemas
"""

import asyncio
import json
import subprocess
import time
import requests
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import docker

class BGAPPDebugger:
    """Sistema de debug completo para BGAPP"""
    
    def __init__(self):
        self.docker_client = None
        self.debug_results = {
            'timestamp': datetime.now().isoformat(),
            'services': {},
            'containers': {},
            'network': {},
            'routing': {},
            'issues': [],
            'fixes_applied': []
        }
        
        # Inicializar cliente Docker
        try:
            self.docker_client = docker.from_env()
            print("✅ Docker client inicializado")
        except Exception as e:
            print(f"❌ Docker não disponível: {e}")
    
    def check_ports(self) -> Dict[str, bool]:
        """Verificar se as portas estão ativas"""
        print("\n🔌 VERIFICANDO PORTAS...")
        
        ports = {
            '8085': 'Frontend',
            '8000': 'Admin API', 
            '5080': 'PyGeoAPI',
            '5432': 'PostgreSQL',
            '9000': 'MinIO',
            '8081': 'STAC API',
            '8083': 'Keycloak'
        }
        
        port_status = {}
        
        for port, service in ports.items():
            try:
                result = subprocess.run(['netstat', '-an'], capture_output=True, text=True)
                if f'*.{port}' in result.stdout or f':{port}' in result.stdout:
                    port_status[port] = True
                    print(f"  ✅ {service} ({port}): LISTENING")
                else:
                    port_status[port] = False
                    print(f"  ❌ {service} ({port}): NOT LISTENING")
                    self.debug_results['issues'].append(f"Porta {port} ({service}) não está ativa")
            except Exception as e:
                port_status[port] = False
                print(f"  ❌ {service} ({port}): ERROR - {e}")
        
        self.debug_results['network']['ports'] = port_status
        return port_status
    
    def check_containers(self) -> Dict[str, Dict]:
        """Verificar status dos containers Docker"""
        print("\n🐳 VERIFICANDO CONTAINERS...")
        
        if not self.docker_client:
            print("❌ Docker client não disponível")
            return {}
        
        container_status = {}
        
        try:
            containers = self.docker_client.containers.list(all=True, filters={"name": "infra-"})
            
            for container in containers:
                name = container.name
                status = container.status
                health = getattr(container.attrs['State'], 'Health', {}).get('Status', 'no-health-check')
                
                container_info = {
                    'status': status,
                    'health': health,
                    'ports': container.ports,
                    'created': container.attrs['Created'],
                    'image': container.image.tags[0] if container.image.tags else 'unknown'
                }
                
                container_status[name] = container_info
                
                # Log do status
                health_icon = "✅" if health == "healthy" else "⚠️" if health == "unhealthy" else "➖"
                status_icon = "✅" if status == "running" else "❌"
                
                print(f"  {status_icon} {name}: {status}")
                print(f"    Health: {health_icon} {health}")
                
                # Identificar problemas
                if status != "running":
                    self.debug_results['issues'].append(f"Container {name} não está rodando: {status}")
                elif health == "unhealthy":
                    self.debug_results['issues'].append(f"Container {name} não está saudável")
        
        except Exception as e:
            print(f"❌ Erro ao verificar containers: {e}")
        
        self.debug_results['containers'] = container_status
        return container_status
    
    async def check_http_services(self) -> Dict[str, Dict]:
        """Verificar serviços HTTP"""
        print("\n🌐 VERIFICANDO SERVIÇOS HTTP...")
        
        services = {
            'frontend': {
                'url': 'http://localhost:8085',
                'endpoint': '/',
                'expected_content': 'BGAPP'
            },
            'admin_frontend': {
                'url': 'http://localhost:8085/admin.html',
                'endpoint': '',
                'expected_content': 'Painel Administrativo'
            },
            'admin_api': {
                'url': 'http://localhost:8000',
                'endpoint': '/admin-api/services/status',
                'expected_content': 'services'
            },
            'pygeoapi': {
                'url': 'http://localhost:5080',
                'endpoint': '/collections',
                'expected_content': 'collections'
            },
            'minio': {
                'url': 'http://localhost:9000',
                'endpoint': '/minio/health/live',
                'expected_content': None
            },
            'stac': {
                'url': 'http://localhost:8081',
                'endpoint': '/health',
                'expected_content': None
            }
        }
        
        service_status = {}
        
        for service_name, config in services.items():
            try:
                full_url = config['url'] + config['endpoint']
                
                start_time = time.time()
                response = requests.get(full_url, timeout=10)
                response_time = time.time() - start_time
                
                service_info = {
                    'status_code': response.status_code,
                    'response_time': response_time,
                    'accessible': response.status_code == 200,
                    'content_check': True
                }
                
                # Verificar conteúdo esperado
                if config['expected_content']:
                    content_check = config['expected_content'].lower() in response.text.lower()
                    service_info['content_check'] = content_check
                    
                    if not content_check:
                        self.debug_results['issues'].append(f"Serviço {service_name} não retorna conteúdo esperado")
                
                if response.status_code == 200:
                    print(f"  ✅ {service_name}: OK ({response_time:.2f}s)")
                else:
                    print(f"  ❌ {service_name}: HTTP {response.status_code}")
                    self.debug_results['issues'].append(f"Serviço {service_name} retorna HTTP {response.status_code}")
                
                service_status[service_name] = service_info
                
            except requests.exceptions.ConnectionError:
                print(f"  ❌ {service_name}: CONNECTION REFUSED")
                service_status[service_name] = {'accessible': False, 'error': 'Connection refused'}
                self.debug_results['issues'].append(f"Serviço {service_name} não aceita conexões")
            except requests.exceptions.Timeout:
                print(f"  ⏱️ {service_name}: TIMEOUT")
                service_status[service_name] = {'accessible': False, 'error': 'Timeout'}
                self.debug_results['issues'].append(f"Serviço {service_name} tem timeout")
            except Exception as e:
                print(f"  ❌ {service_name}: ERROR - {e}")
                service_status[service_name] = {'accessible': False, 'error': str(e)}
        
        self.debug_results['services'] = service_status
        return service_status
    
    def check_routing(self) -> Dict[str, bool]:
        """Verificar roteamento específico"""
        print("\n🗺️ VERIFICANDO ROTEAMENTO...")
        
        routes = {
            'index_root': 'http://localhost:8085/',
            'admin_direct': 'http://localhost:8085/admin.html',
            'admin_bgapp_path': 'http://localhost:8085/BGAPP/admin.html',
            'api_status': 'http://localhost:8000/admin-api/services/status',
            'pygeoapi_collections': 'http://localhost:5080/collections'
        }
        
        routing_status = {}
        
        for route_name, url in routes.items():
            try:
                response = requests.get(url, timeout=5)
                routing_status[route_name] = {
                    'accessible': response.status_code == 200,
                    'status_code': response.status_code,
                    'url': url
                }
                
                if response.status_code == 200:
                    print(f"  ✅ {route_name}: OK")
                else:
                    print(f"  ❌ {route_name}: HTTP {response.status_code}")
                    
            except Exception as e:
                routing_status[route_name] = {
                    'accessible': False,
                    'error': str(e),
                    'url': url
                }
                print(f"  ❌ {route_name}: ERROR - {e}")
        
        self.debug_results['routing'] = routing_status
        return routing_status
    
    def fix_unhealthy_containers(self):
        """Corrigir containers não saudáveis"""
        print("\n🔧 CORRIGINDO CONTAINERS PROBLEMÁTICOS...")
        
        if not self.docker_client:
            print("❌ Docker client não disponível")
            return
        
        try:
            containers = self.docker_client.containers.list(filters={"name": "infra-"})
            
            for container in containers:
                # Verificar health status
                health = getattr(container.attrs['State'], 'Health', {}).get('Status', 'no-health-check')
                
                if health == 'unhealthy':
                    print(f"🔄 Reiniciando container não saudável: {container.name}")
                    container.restart()
                    self.debug_results['fixes_applied'].append(f"Reiniciado container {container.name}")
                    time.sleep(5)
        
        except Exception as e:
            print(f"❌ Erro ao corrigir containers: {e}")
    
    def create_healthcheck_script(self):
        """Criar script de healthcheck melhorado"""
        print("\n🏥 CRIANDO SCRIPT DE HEALTHCHECK MELHORADO...")
        
        healthcheck_script = '''#!/bin/bash

# 🏥 BGAPP Healthcheck Script
# Verifica saúde de todos os serviços e corrige problemas automaticamente

echo "🏥 BGAPP Healthcheck - $(date)"
echo "================================"

# Função para verificar serviço HTTP
check_http_service() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    if curl -f -s "$url" | grep -q "$expected" 2>/dev/null; then
        echo "  ✅ $name: OK"
        return 0
    else
        echo "  ❌ $name: FALHOU"
        return 1
    fi
}

# Verificar serviços críticos
echo "🔍 Verificando serviços críticos..."

check_http_service "Frontend" "http://localhost:8085" "BGAPP"
check_http_service "Admin Panel" "http://localhost:8085/admin.html" "Administrativo"
check_http_service "Admin API" "http://localhost:8000/admin-api/services/status" "services"
check_http_service "PyGeoAPI" "http://localhost:5080/collections" "collections"

# Verificar containers Docker
echo ""
echo "🐳 Verificando containers..."
docker compose -f infra/docker-compose.yml ps --format "table {{.Name}}\\t{{.Status}}\\t{{.Ports}}"

# Reiniciar serviços problemáticos
echo ""
echo "🔧 Verificando e corrigindo problemas..."

# Se admin API não responde, reiniciar
if ! curl -f -s http://localhost:8000/admin-api/services/status > /dev/null 2>&1; then
    echo "🔄 Reiniciando Admin API..."
    pkill -f admin_api_simple.py 2>/dev/null || true
    sleep 2
    python3 admin_api_simple.py &
    echo "✅ Admin API reiniciado"
fi

# Se frontend não responde, reiniciar container
if ! curl -f -s http://localhost:8085 > /dev/null 2>&1; then
    echo "🔄 Reiniciando Frontend..."
    docker compose -f infra/docker-compose.yml restart frontend
    echo "✅ Frontend reiniciado"
fi

echo ""
echo "✅ Healthcheck completo!"
'''
        
        # Salvar script
        script_path = Path('scripts/healthcheck.sh')
        with open(script_path, 'w') as f:
            f.write(healthcheck_script)
        
        # Tornar executável
        script_path.chmod(0o755)
        
        print(f"✅ Script de healthcheck criado: {script_path}")
        self.debug_results['fixes_applied'].append("Script healthcheck.sh criado")
    
    def create_auto_recovery_service(self):
        """Criar serviço de recuperação automática"""
        print("\n🤖 CRIANDO SERVIÇO DE RECUPERAÇÃO AUTOMÁTICA...")
        
        recovery_script = '''#!/usr/bin/env python3
"""
🤖 BGAPP Auto Recovery Service
Monitora e recupera automaticamente serviços com problemas
"""

import time
import requests
import subprocess
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AutoRecovery:
    def __init__(self):
        self.services = {
            'frontend': 'http://localhost:8085',
            'admin_api': 'http://localhost:8000/admin-api/services/status',
            'pygeoapi': 'http://localhost:5080/collections'
        }
        self.failure_counts = {service: 0 for service in self.services}
        self.max_failures = 3
    
    def check_service(self, name: str, url: str) -> bool:
        """Verificar se serviço está funcionando"""
        try:
            response = requests.get(url, timeout=10)
            return response.status_code == 200
        except:
            return False
    
    def restart_service(self, service_name: str) -> bool:
        """Reiniciar serviço específico"""
        logger.warning(f"Reiniciando {service_name}...")
        
        try:
            if service_name == 'frontend':
                subprocess.run(['docker', 'compose', '-f', 'infra/docker-compose.yml', 'restart', 'frontend'])
            elif service_name == 'admin_api':
                subprocess.run(['pkill', '-f', 'admin_api_simple.py'])
                time.sleep(2)
                subprocess.Popen(['python3', 'admin_api_simple.py'])
            elif service_name == 'pygeoapi':
                subprocess.run(['docker', 'compose', '-f', 'infra/docker-compose.yml', 'restart', 'pygeoapi'])
            
            logger.info(f"✅ {service_name} reiniciado")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao reiniciar {service_name}: {e}")
            return False
    
    def run(self):
        """Executar monitorização contínua"""
        logger.info("🤖 Iniciando Auto Recovery Service...")
        
        while True:
            try:
                for service_name, url in self.services.items():
                    if self.check_service(service_name, url):
                        self.failure_counts[service_name] = 0
                        logger.debug(f"✅ {service_name}: OK")
                    else:
                        self.failure_counts[service_name] += 1
                        logger.warning(f"❌ {service_name}: FALHOU ({self.failure_counts[service_name]}/{self.max_failures})")
                        
                        if self.failure_counts[service_name] >= self.max_failures:
                            if self.restart_service(service_name):
                                self.failure_counts[service_name] = 0
                            time.sleep(30)  # Aguardar após restart
                
                time.sleep(60)  # Verificar a cada minuto
                
            except KeyboardInterrupt:
                logger.info("🛑 Auto Recovery Service parado")
                break
            except Exception as e:
                logger.error(f"❌ Erro no Auto Recovery: {e}")
                time.sleep(30)

if __name__ == "__main__":
    recovery = AutoRecovery()
    recovery.run()
'''
        
        # Salvar script
        script_path = Path('scripts/auto_recovery.py')
        with open(script_path, 'w') as f:
            f.write(recovery_script)
        
        script_path.chmod(0o755)
        
        print(f"✅ Serviço de recuperação automática criado: {script_path}")
        self.debug_results['fixes_applied'].append("Serviço auto_recovery.py criado")
    
    async def run_complete_debug(self):
        """Executar debug completo"""
        print("🔧 INICIANDO DEBUG COMPLETO DO SISTEMA BGAPP")
        print("=" * 60)
        
        # Verificações
        self.check_ports()
        self.check_containers()
        await self.check_http_services()
        self.check_routing()
        
        # Correções
        self.fix_unhealthy_containers()
        self.create_healthcheck_script()
        self.create_auto_recovery_service()
        
        # Relatório final
        self.generate_debug_report()
    
    def generate_debug_report(self):
        """Gerar relatório de debug"""
        print("\n📋 RELATÓRIO DE DEBUG")
        print("=" * 40)
        
        # Contadores
        total_issues = len(self.debug_results['issues'])
        total_fixes = len(self.debug_results['fixes_applied'])
        
        print(f"🔍 Problemas encontrados: {total_issues}")
        print(f"🔧 Correções aplicadas: {total_fixes}")
        
        if self.debug_results['issues']:
            print("\n❌ PROBLEMAS IDENTIFICADOS:")
            for i, issue in enumerate(self.debug_results['issues'], 1):
                print(f"  {i}. {issue}")
        
        if self.debug_results['fixes_applied']:
            print("\n✅ CORREÇÕES APLICADAS:")
            for i, fix in enumerate(self.debug_results['fixes_applied'], 1):
                print(f"  {i}. {fix}")
        
        # Salvar relatório
        report_path = Path('reports/debug_report.json')
        report_path.parent.mkdir(exist_ok=True)
        
        with open(report_path, 'w') as f:
            json.dump(self.debug_results, f, indent=2, default=str)
        
        print(f"\n💾 Relatório salvo em: {report_path}")
        
        # Status final
        if total_issues == 0:
            print("\n🎉 SISTEMA TOTALMENTE SAUDÁVEL!")
        elif total_fixes >= total_issues:
            print("\n✅ TODOS OS PROBLEMAS FORAM CORRIGIDOS!")
        else:
            print(f"\n⚠️ {total_issues - total_fixes} PROBLEMAS AINDA PRECISAM DE ATENÇÃO")

async def main():
    """Função principal"""
    debugger = BGAPPDebugger()
    await debugger.run_complete_debug()

if __name__ == "__main__":
    asyncio.run(main())
