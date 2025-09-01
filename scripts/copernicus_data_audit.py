#!/usr/bin/env python3
"""
Auditoria de Dados do Copernicus - Real vs Simulado
Analisa toda a aplicação para determinar onde dados são reais vs simulados
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any

class CopernicusDataAudit:
    """Auditor de fontes de dados do Copernicus"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.findings = {
            'real_data_sources': [],
            'simulated_data_sources': [],
            'authentication_methods': [],
            'fallback_mechanisms': [],
            'data_flow_analysis': []
        }
    
    def analyze_authentication(self):
        """Analisar métodos de autenticação"""
        
        print("🔐 ANALISANDO AUTENTICAÇÃO COPERNICUS")
        print("=" * 50)
        
        # Verificar credenciais
        credentials_file = self.project_root / "CREDENTIALS.md"
        if credentials_file.exists():
            content = credentials_file.read_text()
            
            # Extrair credenciais
            usernames = re.findall(r'COPERNICUS.*USER.*=\s*(\S+)', content)
            passwords = re.findall(r'COPERNICUS.*PASSWORD.*=\s*(\S+)', content)
            
            print("📋 Credenciais encontradas:")
            for i, (user, pwd) in enumerate(zip(usernames, passwords), 1):
                print(f"   {i}. Usuário: {user}")
                print(f"      Senha: {'*' * len(pwd)} ({len(pwd)} chars)")
                
                self.findings['authentication_methods'].append({
                    'type': 'stored_credentials',
                    'username': user,
                    'password_length': len(pwd),
                    'status': 'available'
                })
        
        # Verificar módulo de autenticação real
        auth_module = self.project_root / "src/bgapp/ingest/copernicus_real.py"
        if auth_module.exists():
            content = auth_module.read_text()
            
            # Verificar se há autenticação real
            has_real_auth = 'authenticate' in content and 'access_token' in content
            has_real_urls = 'marine.copernicus.eu' in content or 'identity.dataspace.copernicus.eu' in content
            
            print(f"\n🔗 Módulo de autenticação real:")
            print(f"   ✅ Função authenticate(): {'Sim' if has_real_auth else 'Não'}")
            print(f"   ✅ URLs reais Copernicus: {'Sim' if has_real_urls else 'Não'}")
            
            if has_real_auth and has_real_urls:
                self.findings['authentication_methods'].append({
                    'type': 'oauth_real',
                    'module': 'copernicus_real.py',
                    'status': 'implemented',
                    'urls': ['marine.copernicus.eu', 'identity.dataspace.copernicus.eu']
                })
    
    def analyze_data_sources(self):
        """Analisar fontes de dados"""
        
        print("\n📊 ANALISANDO FONTES DE DADOS")
        print("=" * 50)
        
        # Verificar conectores
        modules_to_check = [
            ('copernicus_real.py', 'Real Copernicus Marine'),
            ('copernicus_simulator.py', 'Simulador Copernicus'),
            ('erddap_sst.py', 'ERDDAP NOAA (Real)'),
            ('cmems_chla.py', 'CMEMS Clorofila (Real)'),
            ('cds_era5.py', 'CDS ERA5 (Real)')
        ]
        
        for module_name, description in modules_to_check:
            module_path = self.project_root / "src/bgapp/ingest" / module_name
            
            if not module_path.exists():
                continue
            
            content = module_path.read_text()
            
            # Analisar tipo de dados
            is_simulator = 'simulator' in module_name.lower() or 'simulate' in content
            has_real_api_calls = any(url in content for url in [
                'marine.copernicus.eu', 'erddap', 'cds.climate.copernicus.eu',
                'api.obis.org', 'gbif.org'
            ])
            has_fallback = 'fallback' in content or 'simulate' in content
            
            print(f"\n📁 {module_name}:")
            print(f"   📝 Descrição: {description}")
            print(f"   🎭 É simulador: {'Sim' if is_simulator else 'Não'}")
            print(f"   🌐 APIs reais: {'Sim' if has_real_api_calls else 'Não'}")
            print(f"   🔄 Tem fallback: {'Sim' if has_fallback else 'Não'}")
            
            if is_simulator:
                self.findings['simulated_data_sources'].append({
                    'module': module_name,
                    'description': description,
                    'purpose': 'simulation'
                })
            elif has_real_api_calls:
                self.findings['real_data_sources'].append({
                    'module': module_name,
                    'description': description,
                    'apis': self.extract_api_urls(content)
                })
    
    def extract_api_urls(self, content: str) -> List[str]:
        """Extrair URLs de APIs do conteúdo"""
        
        url_patterns = [
            r'https://[a-zA-Z0-9.-]+\.copernicus\.eu[/\w.-]*',
            r'https://[a-zA-Z0-9.-]+\.noaa\.gov[/\w.-]*',
            r'https://[a-zA-Z0-9.-]+\.obis\.org[/\w.-]*',
            r'https://[a-zA-Z0-9.-]+\.gbif\.org[/\w.-]*'
        ]
        
        urls = []
        for pattern in url_patterns:
            matches = re.findall(pattern, content)
            urls.extend(matches)
        
        return list(set(urls))  # Remover duplicatas
    
    def analyze_frontend_data_flow(self):
        """Analisar fluxo de dados no frontend"""
        
        print("\n🌐 ANALISANDO FLUXO DE DADOS NO FRONTEND")
        print("=" * 50)
        
        frontend_files = [
            'index.html',
            'realtime_angola.html', 
            'dashboard.html',
            'assets/js/metocean.js',
            'assets/js/admin.js'
        ]
        
        for file_name in frontend_files:
            file_path = self.project_root / "infra/frontend" / file_name
            
            if not file_path.exists():
                continue
            
            content = file_path.read_text()
            
            # Verificar chamadas de API
            api_calls = re.findall(r'fetch\([\'"]([^\'"]+)[\'"]', content)
            copernicus_files = re.findall(r'copernicus[_a-zA-Z0-9]*\.json', content)
            
            # Verificar se usa dados simulados
            has_simulated = any(keyword in content.lower() for keyword in [
                'simulat', 'mock', 'fake', 'generaterealistic', 'fallback'
            ])
            
            print(f"\n📄 {file_name}:")
            
            if api_calls:
                print("   🔗 Chamadas de API:")
                for call in api_calls[:5]:  # Limitar a 5
                    call_type = "Real" if any(domain in call for domain in ['copernicus', 'erddap', 'obis']) else "Local"
                    print(f"      • {call} ({call_type})")
            
            if copernicus_files:
                print("   📁 Arquivos Copernicus:")
                for file in copernicus_files:
                    print(f"      • {file}")
            
            print(f"   🎭 Usa simulação: {'Sim' if has_simulated else 'Não'}")
            
            self.findings['data_flow_analysis'].append({
                'file': file_name,
                'api_calls': api_calls,
                'copernicus_files': copernicus_files,
                'uses_simulation': has_simulated
            })
    
    def check_copernicus_json_files(self):
        """Verificar arquivos JSON do Copernicus"""
        
        print("\n📁 VERIFICANDO ARQUIVOS JSON DO COPERNICUS")
        print("=" * 50)
        
        json_files = list(self.project_root.glob("**/copernicus*.json"))
        
        for json_file in json_files:
            print(f"\n📄 {json_file.relative_to(self.project_root)}:")
            
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)
                
                # Analisar estrutura
                if isinstance(data, dict):
                    if 'source' in data:
                        print(f"   🏷️ Fonte: {data['source']}")
                    
                    if 'metadata' in data and 'data_quality' in data['metadata']:
                        quality = data['metadata']['data_quality']
                        print(f"   🎯 Qualidade: {quality}")
                        
                        if 'simulation' in quality:
                            print(f"   🎭 DADOS SIMULADOS detectados")
                        else:
                            print(f"   🌐 Possivelmente dados reais")
                    
                    if 'authentication_status' in data:
                        auth_status = data['authentication_status']
                        print(f"   🔐 Status auth: {auth_status}")
                    
                    if 'real_time_data' in data:
                        locations = data.get('real_time_data', [])
                        print(f"   📍 Localizações: {len(locations)}")
                        
                        # Verificar se dados parecem realísticos
                        if locations:
                            first_loc = locations[0]
                            has_realistic_values = all(key in first_loc for key in ['sst', 'chlorophyll', 'salinity'])
                            print(f"   🔬 Valores realísticos: {'Sim' if has_realistic_values else 'Não'}")
            
            except Exception as e:
                print(f"   ❌ Erro ao ler: {e}")
    
    def analyze_backend_data_strategy(self):
        """Analisar estratégia de dados no backend"""
        
        print("\n🔧 ANALISANDO ESTRATÉGIA DE DADOS NO BACKEND")
        print("=" * 50)
        
        # Verificar admin_api endpoints
        admin_api = self.project_root / "src/bgapp/admin_api.py"
        if admin_api.exists():
            content = admin_api.read_text()
            
            # Verificar endpoints meteorológicos
            has_metocean_endpoints = '/metocean/' in content
            uses_simulator = 'simulator' in content and 'CopernicusSimulator' in content
            has_fallback = 'fallback' in content or 'simulate' in content
            
            print("📡 Admin API:")
            print(f"   🌊 Endpoints meteorológicos: {'Sim' if has_metocean_endpoints else 'Não'}")
            print(f"   🎭 Usa simulador: {'Sim' if uses_simulator else 'Não'}")
            print(f"   🔄 Tem fallback: {'Sim' if has_fallback else 'Não'}")
        
        # Verificar conectores
        connectors = {
            'copernicus_real.py': 'Conector real (com auth)',
            'copernicus_simulator.py': 'Simulador puro',
            'erddap_sst.py': 'ERDDAP real',
            'cmems_chla.py': 'CMEMS real'
        }
        
        print(f"\n🔌 Conectores disponíveis:")
        for connector, description in connectors.items():
            connector_path = self.project_root / "src/bgapp/ingest" / connector
            
            if connector_path.exists():
                content = connector_path.read_text()
                
                # Determinar se é real ou simulado
                is_real = any(indicator in content for indicator in [
                    'requests.get', 'requests.post', 'http://', 'https://', 
                    'authenticate', 'access_token', 'api_key'
                ])
                
                is_simulated = any(indicator in content for indicator in [
                    'np.random', 'random.uniform', 'simulate', '_generate_', 'mock'
                ])
                
                data_type = "Real" if is_real and not is_simulated else "Simulado" if is_simulated else "Indefinido"
                print(f"   📁 {connector}: {description} - {data_type}")
    
    def generate_comprehensive_report(self):
        """Gerar relatório completo"""
        
        print("\n" + "="*60)
        print("📊 RELATÓRIO COMPLETO - DADOS COPERNICUS")
        print("="*60)
        
        # Resumir achados
        total_real = len(self.findings['real_data_sources'])
        total_simulated = len(self.findings['simulated_data_sources'])
        total_auth = len(self.findings['authentication_methods'])
        
        print(f"📊 RESUMO EXECUTIVO:")
        print(f"   🌐 Fontes de dados reais: {total_real}")
        print(f"   🎭 Fontes simuladas: {total_simulated}")
        print(f"   🔐 Métodos de autenticação: {total_auth}")
        
        # Determinar status geral
        if total_real > total_simulated and total_auth > 0:
            overall_status = "PREDOMINANTEMENTE REAL"
            confidence = "Alta"
        elif total_real > 0 and total_auth > 0:
            overall_status = "MISTO (Real + Simulado)"
            confidence = "Média"
        elif total_simulated > 0:
            overall_status = "PREDOMINANTEMENTE SIMULADO"
            confidence = "Baixa para dados reais"
        else:
            overall_status = "INDEFINIDO"
            confidence = "Muito baixa"
        
        print(f"\n🎯 STATUS GERAL: {overall_status}")
        print(f"🎯 Confiança nos dados reais: {confidence}")
        
        # Análise detalhada por componente
        print(f"\n📋 ANÁLISE POR COMPONENTE:")
        
        components = [
            ("Frontend (index.html)", "Usa endpoints locais que podem ser reais ou simulados"),
            ("Frontend (realtime_angola.html)", "Carrega copernicus_authenticated_angola.json"),
            ("API Meteorológica", "Usa simulador como fallback"),
            ("Conector Real", "Tem credenciais e autenticação OAuth"),
            ("Simulador", "Gera dados realísticos para desenvolvimento")
        ]
        
        for component, analysis in components:
            print(f"   🔸 {component}")
            print(f"     {analysis}")
        
        return {
            'overall_status': overall_status,
            'confidence': confidence,
            'real_sources': total_real,
            'simulated_sources': total_simulated,
            'auth_methods': total_auth
        }
    
    def check_production_readiness(self):
        """Verificar se está pronto para dados reais em produção"""
        
        print(f"\n🚀 VERIFICAÇÃO DE PRONTIDÃO PARA PRODUÇÃO")
        print("=" * 50)
        
        checks = []
        
        # 1. Credenciais configuradas
        creds_file = self.project_root / "CREDENTIALS.md"
        has_credentials = creds_file.exists() and 'COPERNICUS' in creds_file.read_text()
        checks.append(("Credenciais configuradas", has_credentials))
        
        # 2. Módulo de autenticação real
        real_module = self.project_root / "src/bgapp/ingest/copernicus_real.py"
        has_real_connector = real_module.exists()
        checks.append(("Conector real implementado", has_real_connector))
        
        # 3. Endpoints de API
        admin_api = self.project_root / "src/bgapp/admin_api.py"
        has_endpoints = admin_api.exists() and '/metocean/' in admin_api.read_text()
        checks.append(("Endpoints meteorológicos", has_endpoints))
        
        # 4. Fallback configurado
        has_fallback = any(
            (self.project_root / "src/bgapp" / dir / "copernicus_simulator.py").exists()
            for dir in ["realtime", "ingest"]
        )
        checks.append(("Sistema de fallback", has_fallback))
        
        # 5. Frontend preparado
        frontend_main = self.project_root / "infra/frontend/index.html"
        frontend_ready = frontend_main.exists() and 'metocean' in frontend_main.read_text()
        checks.append(("Frontend meteorológico", frontend_ready))
        
        print("🔍 Checklist de produção:")
        all_ready = True
        for check_name, status in checks:
            status_icon = "✅" if status else "❌"
            print(f"   {status_icon} {check_name}")
            if not status:
                all_ready = False
        
        readiness = "PRONTO" if all_ready else "REQUER CONFIGURAÇÃO"
        print(f"\n🎯 Status de produção: {readiness}")
        
        return all_ready

def main():
    """Executar auditoria completa"""
    
    print("🌊 AUDITORIA DE DADOS COPERNICUS - REAL vs SIMULADO")
    print("="*70)
    
    auditor = CopernicusDataAudit()
    
    # Executar análises
    auditor.analyze_authentication()
    auditor.analyze_data_sources()
    auditor.analyze_frontend_data_flow()
    auditor.check_copernicus_json_files()
    auditor.analyze_backend_data_strategy()
    
    # Gerar relatório
    report = auditor.generate_comprehensive_report()
    
    # Verificar prontidão para produção
    production_ready = auditor.check_production_readiness()
    
    # Recomendações finais
    print(f"\n🎯 RECOMENDAÇÕES:")
    
    if report['overall_status'] == "PREDOMINANTEMENTE SIMULADO":
        print("   1. 🔧 Configurar autenticação real com Copernicus Marine")
        print("   2. 🧪 Testar conectores reais em ambiente de desenvolvimento")
        print("   3. 📊 Implementar cache local para dados reais")
        print("   4. 🔄 Manter simuladores como fallback")
    
    elif report['overall_status'] == "MISTO (Real + Simulado)":
        print("   1. ✅ Sistema bem configurado com fallbacks")
        print("   2. 🧪 Testar conectividade real periodicamente")
        print("   3. 📊 Monitorizar qualidade dos dados")
        print("   4. 📝 Documentar quando usar real vs simulado")
    
    else:
        print("   1. ✅ Sistema configurado adequadamente")
        print("   2. 📊 Monitorizar performance e disponibilidade")
    
    return report

if __name__ == "__main__":
    main()
