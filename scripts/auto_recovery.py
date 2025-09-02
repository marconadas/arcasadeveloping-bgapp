#!/usr/bin/env python3
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
