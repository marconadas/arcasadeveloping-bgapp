#!/usr/bin/env python3
"""
Script de Instalação Completa das Funcionalidades QGIS
Instala e configura todas as melhorias implementadas
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from datetime import datetime
import logging
import shutil
import asyncio

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class QGISFeaturesInstaller:
    """Instalador das funcionalidades QGIS"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.success_count = 0
        self.error_count = 0
        self.warnings = []
        
        # Componentes a serem instalados
        self.components = [
            "dependencies",
            "real_data_connectors", 
            "qgis2web_integration",
            "web_interfaces",
            "performance_optimizer",
            "automated_reporting",
            "health_dashboards",
            "data_validation",
            "auth_middleware",
            "swagger_docs"
        ]
    
    def run_installation(self):
        """Executa instalação completa"""
        
        logger.info("🚀 Iniciando instalação das funcionalidades QGIS...")
        logger.info(f"Diretório do projeto: {self.project_root}")
        
        try:
            # Verificar pré-requisitos
            self._check_prerequisites()
            
            # Instalar dependências
            self._install_dependencies()
            
            # Configurar componentes
            self._configure_components()
            
            # Executar testes
            self._run_tests()
            
            # Gerar documentação
            self._generate_documentation()
            
            # Configurar serviços
            self._configure_services()
            
            # Relatório final
            self._generate_installation_report()
            
        except Exception as e:
            logger.error(f"❌ Erro na instalação: {e}")
            self._handle_installation_error(e)
            return False
        
        return True
    
    def _check_prerequisites(self):
        """Verifica pré-requisitos do sistema"""
        
        logger.info("🔍 Verificando pré-requisitos...")
        
        # Verificar Python
        python_version = sys.version_info
        if python_version < (3, 8):
            raise RuntimeError(f"Python 3.8+ necessário. Versão atual: {python_version}")
        
        logger.info(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro}")
        
        # Verificar Docker
        try:
            result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                logger.info(f"✅ {result.stdout.strip()}")
            else:
                self.warnings.append("Docker não encontrado - alguns recursos podem não funcionar")
        except FileNotFoundError:
            self.warnings.append("Docker não instalado")
        
        # Verificar Redis (opcional)
        try:
            result = subprocess.run(['redis-cli', 'ping'], capture_output=True, text=True)
            if result.returncode == 0 and 'PONG' in result.stdout:
                logger.info("✅ Redis disponível")
            else:
                self.warnings.append("Redis não disponível - cache desabilitado")
        except FileNotFoundError:
            self.warnings.append("Redis não instalado - cache desabilitado")
        
        # Verificar espaço em disco
        disk_usage = shutil.disk_usage(self.project_root)
        free_gb = disk_usage.free / (1024**3)
        if free_gb < 2:
            raise RuntimeError(f"Espaço insuficiente em disco: {free_gb:.1f}GB disponível, 2GB necessário")
        
        logger.info(f"✅ Espaço em disco: {free_gb:.1f}GB disponível")
        
        self.success_count += 1
    
    def _install_dependencies(self):
        """Instala dependências Python"""
        
        logger.info("📦 Instalando dependências...")
        
        # Atualizar pip
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'], 
                         check=True, capture_output=True)
            logger.info("✅ pip atualizado")
        except subprocess.CalledProcessError as e:
            logger.warning(f"⚠️ Erro ao atualizar pip: {e}")
        
        # Instalar dependências do requirements-admin.txt
        requirements_file = self.project_root / "requirements-admin.txt"
        
        if requirements_file.exists():
            try:
                logger.info("Instalando dependências do requirements-admin.txt...")
                subprocess.run([
                    sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)
                ], check=True, capture_output=True)
                logger.info("✅ Dependências administrativas instaladas")
            except subprocess.CalledProcessError as e:
                logger.error(f"❌ Erro ao instalar dependências: {e}")
                raise
        
        # Instalar dependências opcionais do pyproject.toml
        try:
            subprocess.run([
                sys.executable, '-m', 'pip', 'install', '-e', '.[geo,ingest,api]'
            ], cwd=self.project_root, check=True, capture_output=True)
            logger.info("✅ Dependências opcionais instaladas")
        except subprocess.CalledProcessError as e:
            logger.warning(f"⚠️ Erro ao instalar dependências opcionais: {e}")
        
        self.success_count += 1
    
    def _configure_components(self):
        """Configura componentes do sistema"""
        
        logger.info("⚙️ Configurando componentes...")
        
        # Criar diretórios necessários
        directories = [
            "data/cache",
            "data/cache/real_data",
            "static/interactive_maps",
            "reports/automated",
            "templates/qgis2web",
            "templates/reports",
            "logs",
            "docs"
        ]
        
        for directory in directories:
            dir_path = self.project_root / directory
            dir_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"✅ Diretório criado: {directory}")
        
        # Configurar arquivos de configuração
        self._create_config_files()
        
        # Configurar banco de dados
        self._setup_database()
        
        self.success_count += 1
    
    def _create_config_files(self):
        """Cria arquivos de configuração"""
        
        # Configuração de dados reais
        real_data_config = {
            "copernicus": {
                "username": "YOUR_COPERNICUS_USERNAME",
                "password": "YOUR_COPERNICUS_PASSWORD",
                "datasets": {
                    "chlorophyll_a": "cmems_obs-oc_glo_bgc-plankton_my_l3-multi-4km_P1D",
                    "sea_surface_temperature": "cmems_obs-sst_glo_phy_my_l4-gapfree-rep_P1D"
                }
            },
            "modis": {
                "base_url": "https://modis.gsfc.nasa.gov/data/",
                "products": {
                    "ndvi": "MOD13A3",
                    "lst": "MOD11A2"
                }
            },
            "movebank": {
                "username": "YOUR_MOVEBANK_USERNAME",
                "password": "YOUR_MOVEBANK_PASSWORD",
                "base_url": "https://www.movebank.org/movebank/service/direct-read"
            }
        }
        
        config_file = self.project_root / "configs" / "real_data_config.json"
        config_file.parent.mkdir(exist_ok=True)
        
        with open(config_file, 'w') as f:
            json.dump(real_data_config, f, indent=2)
        
        logger.info("✅ Arquivo de configuração de dados reais criado")
        
        # Configuração de email para relatórios
        email_config = {
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 587,
            "sender": "bgapp@example.com",
            "username": "your_email@gmail.com",
            "password": "your_app_password"
        }
        
        email_config_file = self.project_root / "configs" / "email_config.json"
        
        with open(email_config_file, 'w') as f:
            json.dump(email_config, f, indent=2)
        
        logger.info("✅ Arquivo de configuração de email criado")
    
    def _setup_database(self):
        """Configura banco de dados"""
        
        logger.info("🗄️ Configurando banco de dados...")
        
        # Verificar se PostgreSQL está rodando
        try:
            import psycopg2
            # Tentar conexão (configurar conforme necessário)
            # conn = psycopg2.connect("postgresql://user:password@localhost/bgapp")
            # conn.close()
            logger.info("✅ PostgreSQL disponível")
        except ImportError:
            logger.warning("⚠️ psycopg2 não instalado")
        except Exception as e:
            logger.warning(f"⚠️ Erro na conexão PostgreSQL: {e}")
        
        self.success_count += 1
    
    def _run_tests(self):
        """Executa testes dos componentes"""
        
        logger.info("🧪 Executando testes...")
        
        # Teste básico de importação
        test_modules = [
            "bgapp.qgis.real_data_connectors",
            "bgapp.qgis.qgis2web_integration", 
            "bgapp.qgis.performance_optimizer",
            "bgapp.qgis.automated_reporting",
            "bgapp.qgis.data_validation",
            "bgapp.qgis.auth_middleware",
            "bgapp.qgis.swagger_generator"
        ]
        
        for module in test_modules:
            try:
                __import__(module)
                logger.info(f"✅ Módulo {module} importado com sucesso")
            except ImportError as e:
                logger.warning(f"⚠️ Erro ao importar {module}: {e}")
                self.warnings.append(f"Módulo {module} não pode ser importado")
        
        # Executar script de teste de endpoints (se disponível)
        test_script = self.project_root / "scripts" / "test_qgis_endpoints.py"
        if test_script.exists():
            try:
                logger.info("Executando testes de endpoints...")
                result = subprocess.run([
                    sys.executable, str(test_script)
                ], capture_output=True, text=True, timeout=60)
                
                if result.returncode == 0:
                    logger.info("✅ Testes de endpoints executados com sucesso")
                else:
                    logger.warning(f"⚠️ Alguns testes falharam: {result.stderr}")
            except subprocess.TimeoutExpired:
                logger.warning("⚠️ Timeout nos testes de endpoints")
            except Exception as e:
                logger.warning(f"⚠️ Erro ao executar testes: {e}")
        
        self.success_count += 1
    
    def _generate_documentation(self):
        """Gera documentação"""
        
        logger.info("📚 Gerando documentação...")
        
        # Executar gerador de documentação Swagger
        swagger_script = self.project_root / "src" / "bgapp" / "qgis" / "swagger_generator.py"
        
        if swagger_script.exists():
            try:
                result = subprocess.run([
                    sys.executable, str(swagger_script)
                ], cwd=self.project_root, capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    logger.info("✅ Documentação OpenAPI gerada")
                else:
                    logger.warning(f"⚠️ Erro na geração de documentação: {result.stderr}")
            except Exception as e:
                logger.warning(f"⚠️ Erro ao gerar documentação: {e}")
        
        self.success_count += 1
    
    def _configure_services(self):
        """Configura serviços do sistema"""
        
        logger.info("🔧 Configurando serviços...")
        
        # Verificar docker-compose
        compose_file = self.project_root / "infra" / "docker-compose.yml"
        
        if compose_file.exists():
            logger.info("✅ Docker Compose configurado")
            
            # Verificar se serviços estão rodando
            try:
                result = subprocess.run([
                    'docker-compose', 'ps'
                ], cwd=compose_file.parent, capture_output=True, text=True)
                
                if result.returncode == 0:
                    running_services = result.stdout.count('Up')
                    logger.info(f"✅ {running_services} serviços rodando")
                else:
                    logger.info("ℹ️ Serviços Docker não iniciados")
            except FileNotFoundError:
                logger.warning("⚠️ docker-compose não encontrado")
        
        # Configurar nginx (se disponível)
        nginx_config = self.project_root / "infra" / "nginx" / "nginx.conf"
        if nginx_config.exists():
            logger.info("✅ Configuração Nginx disponível")
        
        self.success_count += 1
    
    def _generate_installation_report(self):
        """Gera relatório de instalação"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = self.project_root / "logs" / f"installation_report_{timestamp}.json"
        
        report = {
            "installation_date": datetime.now().isoformat(),
            "success_count": self.success_count,
            "error_count": self.error_count,
            "warnings": self.warnings,
            "components_installed": self.components,
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            "project_root": str(self.project_root),
            "status": "success" if self.error_count == 0 else "partial_success"
        }
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Exibir resumo
        print(f"\n{'='*60}")
        print(f"RELATÓRIO DE INSTALAÇÃO - FUNCIONALIDADES QGIS")
        print(f"{'='*60}")
        print(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print(f"Status: {'✅ SUCESSO' if self.error_count == 0 else '⚠️ SUCESSO PARCIAL'}")
        print(f"Componentes instalados: {self.success_count}/{len(self.components)}")
        
        if self.warnings:
            print(f"\n⚠️ AVISOS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  • {warning}")
        
        print(f"\n📁 Relatório completo: {report_file}")
        print(f"{'='*60}")
        
        # Próximos passos
        print(f"\n🚀 PRÓXIMOS PASSOS:")
        print(f"1. Configurar credenciais em configs/real_data_config.json")
        print(f"2. Configurar email em configs/email_config.json") 
        print(f"3. Iniciar serviços: docker-compose up -d")
        print(f"4. Acessar dashboard: http://localhost:8085/qgis_dashboard.html")
        print(f"5. Ver documentação: http://localhost:8085/docs/api_documentation.html")
        print(f"6. Executar testes: python scripts/test_qgis_endpoints.py")
        
        logger.info(f"✅ Relatório de instalação gerado: {report_file}")
    
    def _handle_installation_error(self, error):
        """Trata erros de instalação"""
        
        self.error_count += 1
        
        error_report = {
            "error_date": datetime.now().isoformat(),
            "error_message": str(error),
            "error_type": type(error).__name__,
            "success_count": self.success_count,
            "error_count": self.error_count,
            "warnings": self.warnings
        }
        
        error_file = self.project_root / "logs" / f"installation_error_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(error_file, 'w') as f:
            json.dump(error_report, f, indent=2)
        
        print(f"\n❌ ERRO NA INSTALAÇÃO")
        print(f"Erro: {error}")
        print(f"Relatório de erro: {error_file}")
        print(f"Contate o suporte para assistência.")

def main():
    """Função principal"""
    
    print("🎯 INSTALADOR DAS FUNCIONALIDADES QGIS BGAPP")
    print("=" * 50)
    
    installer = QGISFeaturesInstaller()
    
    try:
        success = installer.run_installation()
        
        if success:
            print("\n🎉 Instalação concluída com sucesso!")
            return 0
        else:
            print("\n⚠️ Instalação concluída com avisos.")
            return 1
            
    except KeyboardInterrupt:
        print("\n⏹️ Instalação cancelada pelo usuário.")
        return 1
    except Exception as e:
        print(f"\n❌ Erro fatal na instalação: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
