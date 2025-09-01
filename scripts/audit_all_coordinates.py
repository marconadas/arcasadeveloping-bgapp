#!/usr/bin/env python3
"""
Auditoria Completa de Coordenadas da ZEE
Verifica todas as páginas e módulos para coordenadas inconsistentes
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Tuple

class CoordinateAuditor:
    """Auditor de coordenadas em todo o sistema"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.issues_found = []
        self.files_checked = []
        
        # Coordenadas corretas da ZEE
        self.correct_bounds = {
            'north': -4.2,
            'south': -18.2,
            'east': 17.5,
            'west': 8.5
        }
        
        # Padrões problemáticos conhecidos
        self.problematic_patterns = [
            r'west.*11\.4',  # Limite oeste antigo
            r'north.*-4\.4', # Norte antigo
            r'south.*-18\.5', # Sul antigo
            r'east.*16\.8',   # Leste antigo
            r'lon_min.*11\.4', # Variações
            r'lat_max.*-4\.4',
            r'lat_min.*-18\.5',
            r'lon_max.*16\.8'
        ]
    
    def check_file(self, file_path: Path) -> List[Dict]:
        """Verificar coordenadas em um arquivo"""
        
        issues = []
        
        try:
            content = file_path.read_text(encoding='utf-8')
            
            for i, line in enumerate(content.split('\n'), 1):
                for pattern in self.problematic_patterns:
                    if re.search(pattern, line):
                        issues.append({
                            'file': str(file_path.relative_to(self.project_root)),
                            'line': i,
                            'content': line.strip(),
                            'pattern': pattern,
                            'severity': self.get_severity(pattern)
                        })
        
        except Exception as e:
            print(f"⚠️ Erro ao ler {file_path}: {e}")
        
        return issues
    
    def get_severity(self, pattern: str) -> str:
        """Determinar severidade do problema"""
        if 'west.*11\.4' in pattern:
            return 'CRÍTICO'  # Perda da zona oceânica
        elif 'east.*16\.8' in pattern:
            return 'ALTO'     # Limite oceânico
        else:
            return 'MÉDIO'    # Ajustes menores
    
    def audit_frontend_files(self):
        """Auditar arquivos do frontend"""
        
        print("🔍 Auditando arquivos do frontend...")
        
        frontend_dir = self.project_root / "infra" / "frontend"
        
        # HTML files
        html_files = list(frontend_dir.glob("*.html"))
        
        # JavaScript files
        js_files = list((frontend_dir / "assets" / "js").glob("*.js"))
        
        all_files = html_files + js_files
        
        for file_path in all_files:
            issues = self.check_file(file_path)
            if issues:
                self.issues_found.extend(issues)
                print(f"   ❌ {file_path.name}: {len(issues)} problemas")
            else:
                print(f"   ✅ {file_path.name}: OK")
            
            self.files_checked.append(str(file_path.relative_to(self.project_root)))
    
    def audit_backend_modules(self):
        """Auditar módulos do backend"""
        
        print("\n🔍 Auditando módulos do backend...")
        
        backend_dirs = [
            self.project_root / "src" / "bgapp" / "ingest",
            self.project_root / "src" / "bgapp" / "models",
            self.project_root / "src" / "bgapp" / "realtime",
            self.project_root / "src" / "api"
        ]
        
        for backend_dir in backend_dirs:
            if not backend_dir.exists():
                continue
                
            py_files = list(backend_dir.glob("*.py"))
            
            for file_path in py_files:
                issues = self.check_file(file_path)
                if issues:
                    self.issues_found.extend(issues)
                    print(f"   ❌ {file_path.name}: {len(issues)} problemas")
                else:
                    print(f"   ✅ {file_path.name}: OK")
                
                self.files_checked.append(str(file_path.relative_to(self.project_root)))
    
    def audit_config_files(self):
        """Auditar arquivos de configuração"""
        
        print("\n🔍 Auditando arquivos de configuração...")
        
        config_files = [
            self.project_root / "configs" / "aoi.geojson",
            self.project_root / "configs" / "variables.yaml",
            self.project_root / "configs" / "admin.yaml"
        ]
        
        for file_path in config_files:
            if file_path.exists():
                issues = self.check_file(file_path)
                if issues:
                    self.issues_found.extend(issues)
                    print(f"   ❌ {file_path.name}: {len(issues)} problemas")
                else:
                    print(f"   ✅ {file_path.name}: OK")
                
                self.files_checked.append(str(file_path.relative_to(self.project_root)))
    
    def check_special_cases(self):
        """Verificar casos especiais que podem não ser detectados pelos padrões"""
        
        print("\n🔍 Verificando casos especiais...")
        
        special_cases = []
        
        # Verificar se há bbox hardcoded em angola_sources.py
        angola_sources = self.project_root / "src" / "bgapp" / "ingest" / "angola_sources.py"
        if angola_sources.exists():
            content = angola_sources.read_text()
            if 'bbox = [11.4, -18.5, 16.8, -4.4]' in content:
                special_cases.append({
                    'file': 'src/bgapp/ingest/angola_sources.py',
                    'issue': 'bbox hardcoded com coordenadas antigas',
                    'severity': 'CRÍTICO',
                    'line_content': 'bbox = [11.4, -18.5, 16.8, -4.4]'
                })
        
        # Verificar zonas pesqueiras em fisheries_angola.py
        fisheries = self.project_root / "src" / "bgapp" / "ingest" / "fisheries_angola.py"
        if fisheries.exists():
            content = fisheries.read_text()
            if "'lon_min': 11.4" in content:
                special_cases.append({
                    'file': 'src/bgapp/ingest/fisheries_angola.py',
                    'issue': 'Zonas pesqueiras com limite oeste antigo',
                    'severity': 'ALTO',
                    'line_content': "'lon_min': 11.4"
                })
        
        # Verificar ERDDAP bbox
        erddap = self.project_root / "src" / "bgapp" / "ingest" / "erddap_sst.py"
        if erddap.exists():
            content = erddap.read_text()
            if 'default=[-10.0, 36.5, -6.0, 42.5]' in content:
                special_cases.append({
                    'file': 'src/bgapp/ingest/erddap_sst.py',
                    'issue': 'ERDDAP bbox não está para Angola',
                    'severity': 'ALTO',
                    'line_content': 'default=[-10.0, 36.5, -6.0, 42.5]'
                })
        
        if special_cases:
            print("   ❌ Casos especiais encontrados:")
            for case in special_cases:
                print(f"      • {case['file']}: {case['issue']}")
                self.issues_found.append(case)
        else:
            print("   ✅ Nenhum caso especial problemático")
    
    def generate_report(self):
        """Gerar relatório da auditoria"""
        
        print("\n" + "="*60)
        print("📊 RELATÓRIO DA AUDITORIA DE COORDENADAS")
        print("="*60)
        
        # Estatísticas gerais
        total_files = len(self.files_checked)
        files_with_issues = len(set(issue['file'] for issue in self.issues_found))
        total_issues = len(self.issues_found)
        
        print(f"📁 Arquivos verificados: {total_files}")
        print(f"❌ Arquivos com problemas: {files_with_issues}")
        print(f"🐛 Total de problemas: {total_issues}")
        
        # Agrupar por severidade
        critical = [i for i in self.issues_found if i.get('severity') == 'CRÍTICO']
        high = [i for i in self.issues_found if i.get('severity') == 'ALTO']
        medium = [i for i in self.issues_found if i.get('severity') == 'MÉDIO']
        
        print(f"\n🚨 Problemas CRÍTICOS: {len(critical)}")
        print(f"⚠️ Problemas ALTOS: {len(high)}")
        print(f"ℹ️ Problemas MÉDIOS: {len(medium)}")
        
        # Detalhar problemas críticos
        if critical:
            print(f"\n🚨 PROBLEMAS CRÍTICOS (REQUEREM CORREÇÃO IMEDIATA):")
            for issue in critical:
                print(f"   📁 {issue['file']}")
                if 'line' in issue:
                    print(f"      Linha {issue['line']}: {issue['content']}")
                else:
                    print(f"      {issue.get('line_content', issue.get('issue', 'Problema detectado'))}")
                print()
        
        # Detalhar problemas altos
        if high:
            print(f"⚠️ PROBLEMAS ALTOS:")
            for issue in high:
                print(f"   📁 {issue['file']}")
                if 'line' in issue:
                    print(f"      Linha {issue['line']}: {issue['content']}")
                else:
                    print(f"      {issue.get('line_content', issue.get('issue', 'Problema detectado'))}")
                print()
        
        return {
            'total_files': total_files,
            'files_with_issues': files_with_issues,
            'total_issues': total_issues,
            'critical': len(critical),
            'high': len(high),
            'medium': len(medium),
            'issues': self.issues_found
        }
    
    def generate_fix_recommendations(self):
        """Gerar recomendações de correção"""
        
        print("🔧 RECOMENDAÇÕES DE CORREÇÃO:")
        print("-" * 40)
        
        recommendations = []
        
        # Agrupar por arquivo
        files_with_issues = {}
        for issue in self.issues_found:
            file = issue['file']
            if file not in files_with_issues:
                files_with_issues[file] = []
            files_with_issues[file].append(issue)
        
        for file, issues in files_with_issues.items():
            critical_issues = [i for i in issues if i.get('severity') == 'CRÍTICO']
            
            if critical_issues:
                print(f"\n🚨 {file} (CRÍTICO):")
                print(f"   📝 Substituir coordenadas antigas pelas corretas:")
                print(f"      west: 11.4 → 8.5")
                print(f"      east: 16.8 → 17.5")
                print(f"      north: -4.4 → -4.2")
                print(f"      south: -18.5 → -18.2")
                
                recommendations.append({
                    'file': file,
                    'priority': 'CRÍTICO',
                    'action': 'Atualizar coordenadas da ZEE',
                    'details': 'Substituir bounds antigos pelos corrigidos'
                })
        
        return recommendations

def main():
    """Executar auditoria completa"""
    
    print("🔍 AUDITORIA COMPLETA DE COORDENADAS DA ZEE")
    print("="*60)
    
    auditor = CoordinateAuditor()
    
    # Executar auditorias
    auditor.audit_frontend_files()
    auditor.audit_backend_modules()
    auditor.audit_config_files()
    auditor.check_special_cases()
    
    # Gerar relatório
    report = auditor.generate_report()
    
    # Gerar recomendações
    recommendations = auditor.generate_fix_recommendations()
    
    # Conclusão
    print("\n" + "="*60)
    print("🎯 CONCLUSÃO")
    print("="*60)
    
    if report['critical'] > 0:
        print("❌ AÇÃO NECESSÁRIA: Problemas críticos encontrados!")
        print("   🌊 Dados do Copernicus podem não cobrir toda a ZEE")
        print("   📡 Animações meteorológicas podem ter dados incompletos")
        print("   🔧 Aplicar correções imediatamente")
    elif report['high'] > 0:
        print("⚠️ ATENÇÃO: Problemas de alta prioridade encontrados")
        print("   🔧 Recomenda-se correção em breve")
    else:
        print("✅ SISTEMA OK: Coordenadas consistentes com a ZEE")
        print("   🌊 Dados do Copernicus cobrem adequadamente a ZEE")
        print("   📡 Animações meteorológicas têm dados completos")
    
    return report['critical'] == 0 and report['high'] == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
