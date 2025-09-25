#!/usr/bin/env python3
"""
🔍 Analisador de Dependências do Diretório infra/
================================================

Este script analisa as dependências do diretório infra/ para identificar
quais ficheiros podem ser movidos com segurança.

Autor: MareDatum Consultoria e Gestão de Projectos Unipessoal LDA
Data: Janeiro 2025
Versão: 1.0.0
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple
import logging

# Configuração do logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class InfraDependencyAnalyzer:
    """Analisador de dependências do diretório infra/"""
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.infra_path = self.base_path / "infra" / "frontend"
        
        # Padrões de referências
        self.reference_patterns = {
            'html': [
                r'href=["\']([^"\']+)["\']',  # links
                r'src=["\']([^"\']+)["\']',   # scripts, imagens
                r'url\(["\']?([^"\']+)["\']?\)',  # CSS urls
            ],
            'js': [
                r'import\s+["\']([^"\']+)["\']',  # ES6 imports
                r'require\(["\']([^"\']+)["\']',  # CommonJS requires
                r'["\']([^"\']+\.(js|css|html|json))["\']',  # string references
            ],
            'css': [
                r'url\(["\']?([^"\']+)["\']?\)',  # CSS urls
                r'@import\s+["\']([^"\']+)["\']',  # CSS imports
            ],
            'json': [
                r'"([^"]+\.(js|css|html|json|png|jpg|svg))"',  # JSON references
            ]
        }
        
        # Ficheiros críticos que NÃO podem ser movidos
        self.critical_files = {
            "index.html",
            "admin.html",
            "manifest.json",
            "favicon.ico",
            "favicon-16x16.png", 
            "favicon-32x32.png",
            "apple-touch-icon.png",
            "sw.js"  # Service Worker
        }
        
        # Diretórios críticos que NÃO podem ser movidos
        self.critical_dirs = {
            "assets",
            "BGAPP",
            "minpermar"
        }
    
    def find_references(self, file_path: Path) -> List[str]:
        """Encontrar referências em um ficheiro"""
        references = []
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Determinar tipo de ficheiro
            file_ext = file_path.suffix.lower()
            if file_ext in ['.html', '.htm']:
                patterns = self.reference_patterns['html']
            elif file_ext == '.js':
                patterns = self.reference_patterns['js']
            elif file_ext == '.css':
                patterns = self.reference_patterns['css']
            elif file_ext == '.json':
                patterns = self.reference_patterns['json']
            else:
                return references
            
            # Aplicar padrões
            for pattern in patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, tuple):
                        match = match[0]
                    references.append(match)
            
        except Exception as e:
            logger.warning(f"⚠️ Erro ao analisar {file_path}: {e}")
        
        return references
    
    def analyze_file_dependencies(self) -> Dict[str, Dict]:
        """Analisar dependências de todos os ficheiros"""
        logger.info("🔍 Analisando dependências de ficheiros...")
        
        dependencies = {}
        
        for root, dirs, files in os.walk(self.infra_path):
            for file in files:
                file_path = Path(root) / file
                relative_path = file_path.relative_to(self.infra_path)
                
                # Pular ficheiros de sistema
                if file.startswith('.') or file.endswith('.log'):
                    continue
                
                references = self.find_references(file_path)
                dependencies[str(relative_path)] = {
                    'references': references,
                    'size': file_path.stat().st_size,
                    'is_critical': file in self.critical_files,
                    'is_in_critical_dir': any(str(relative_path).startswith(crit_dir) for crit_dir in self.critical_dirs)
                }
        
        logger.info(f"📊 Analisados {len(dependencies)} ficheiros")
        return dependencies
    
    def find_external_references(self) -> Dict[str, List[str]]:
        """Encontrar referências externas ao diretório infra/"""
        logger.info("🌐 Procurando referências externas...")
        
        external_refs = {}
        
        # Procurar em ficheiros de configuração
        config_files = [
            "wrangler.toml",
            "wrangler-pages.toml", 
            "package.json",
            "pyproject.toml"
        ]
        
        for config_file in config_files:
            config_path = self.base_path / config_file
            if config_path.exists():
                refs = self.find_references(config_path)
                if refs:
                    external_refs[str(config_path)] = refs
        
        # Procurar em scripts Python
        for root, dirs, files in os.walk(self.base_path):
            # Pular diretórios desnecessários
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__', 'infra']]
            
            for file in files:
                if file.endswith('.py'):
                    file_path = Path(root) / file
                    refs = self.find_references(file_path)
                    infra_refs = [ref for ref in refs if 'infra/frontend' in ref]
                    if infra_refs:
                        external_refs[str(file_path)] = infra_refs
        
        # Procurar em scripts shell
        for root, dirs, files in os.walk(self.base_path):
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__', 'infra']]
            
            for file in files:
                if file.endswith('.sh'):
                    file_path = Path(root) / file
                    refs = self.find_references(file_path)
                    infra_refs = [ref for ref in refs if 'infra/frontend' in ref]
                    if infra_refs:
                        external_refs[str(file_path)] = infra_refs
        
        logger.info(f"🌐 Encontradas referências em {len(external_refs)} ficheiros externos")
        return external_refs
    
    def categorize_files(self, dependencies: Dict[str, Dict]) -> Dict[str, List[str]]:
        """Categorizar ficheiros por tipo e criticidade"""
        logger.info("📂 Categorizando ficheiros...")
        
        categories = {
            'critical': [],           # Ficheiros críticos que NÃO podem ser movidos
            'referenced': [],         # Ficheiros referenciados por outros
            'standalone': [],         # Ficheiros que podem ser movidos
            'duplicates': [],         # Possíveis duplicados
            'large': [],              # Ficheiros grandes (>10MB)
            'unused': []              # Ficheiros não referenciados
        }
        
        # Analisar cada ficheiro
        for file_path, info in dependencies.items():
            file_name = Path(file_path).name
            
            # Críticos
            if info['is_critical'] or info['is_in_critical_dir']:
                categories['critical'].append(file_path)
                continue
            
            # Grandes
            if info['size'] > 10 * 1024 * 1024:  # >10MB
                categories['large'].append(file_path)
            
            # Duplicados (padrões comuns)
            duplicate_patterns = [
                r'(.+)\s+2\.(\w+)$',  # arquivo 2.ext
                r'(.+)\.backup\.(\d+)$',  # arquivo.backup.123
                r'(.+)\.backup$',  # arquivo.backup
            ]
            
            is_duplicate = False
            for pattern in duplicate_patterns:
                if re.match(pattern, file_name):
                    categories['duplicates'].append(file_path)
                    is_duplicate = True
                    break
            
            if is_duplicate:
                continue
            
            # Referenciados
            if info['references']:
                categories['referenced'].append(file_path)
            else:
                categories['standalone'].append(file_path)
        
        # Identificar ficheiros não utilizados
        all_referenced = set()
        for file_path, info in dependencies.items():
            for ref in info['references']:
                # Normalizar referência
                ref = ref.lstrip('./')
                if ref in dependencies:
                    all_referenced.add(ref)
        
        for file_path in dependencies:
            if file_path not in all_referenced and file_path not in categories['critical']:
                categories['unused'].append(file_path)
        
        logger.info(f"📊 Categorização concluída:")
        for category, files in categories.items():
            logger.info(f"  {category}: {len(files)} ficheiros")
        
        return categories
    
    def generate_analysis_report(self, dependencies: Dict, external_refs: Dict, categories: Dict) -> str:
        """Gerar relatório de análise"""
        
        report = f"""
# 🔍 Relatório de Análise de Dependências - infra/frontend/
## Data: {Path().cwd()}

## 📊 Resumo Executivo
- **Total de ficheiros analisados:** {len(dependencies)}
- **Ficheiros críticos:** {len(categories['critical'])}
- **Ficheiros referenciados:** {len(categories['referenced'])}
- **Ficheiros standalone:** {len(categories['standalone'])}
- **Possíveis duplicados:** {len(categories['duplicates'])}
- **Ficheiros grandes:** {len(categories['large'])}
- **Ficheiros não utilizados:** {len(categories['unused'])}

## ⚠️ FICHEIROS CRÍTICOS (NÃO MOVER)
Estes ficheiros são essenciais e NÃO devem ser movidos:

"""
        
        for file_path in categories['critical']:
            info = dependencies[file_path]
            report += f"- `{file_path}` (Tamanho: {info['size']:,} bytes)\n"
        
        report += f"""
## 🔗 REFERÊNCIAS EXTERNAS
Ficheiros fora do diretório infra/ que referenciam infra/frontend/:

"""
        
        for file_path, refs in external_refs.items():
            report += f"### {file_path}\n"
            for ref in refs:
                report += f"- `{ref}`\n"
            report += "\n"
        
        report += f"""
## 📂 FICHEIROS QUE PODEM SER MOVIDOS

### Ficheiros Standalone ({len(categories['standalone'])})
Estes ficheiros não são referenciados por outros e podem ser movidos:

"""
        
        for file_path in categories['standalone'][:20]:  # Limitar a 20 para relatório
            info = dependencies[file_path]
            report += f"- `{file_path}` (Tamanho: {info['size']:,} bytes)\n"
        
        if len(categories['standalone']) > 20:
            report += f"- ... e mais {len(categories['standalone']) - 20} ficheiros\n"
        
        report += f"""
### Possíveis Duplicados ({len(categories['duplicates'])})
Estes ficheiros podem ser duplicados e candidatos a remoção:

"""
        
        for file_path in categories['duplicates'][:10]:  # Limitar a 10
            info = dependencies[file_path]
            report += f"- `{file_path}` (Tamanho: {info['size']:,} bytes)\n"
        
        if len(categories['duplicates']) > 10:
            report += f"- ... e mais {len(categories['duplicates']) - 10} ficheiros\n"
        
        report += f"""
### Ficheiros Grandes ({len(categories['large'])})
Ficheiros maiores que 10MB:

"""
        
        for file_path in categories['large']:
            info = dependencies[file_path]
            size_mb = info['size'] / (1024 * 1024)
            report += f"- `{file_path}` ({size_mb:.1f} MB)\n"
        
        report += f"""
## 🚨 FICHEIROS NÃO UTILIZADOS ({len(categories['unused'])})
Estes ficheiros não são referenciados e podem ser candidatos a remoção:

"""
        
        for file_path in categories['unused'][:20]:  # Limitar a 20
            info = dependencies[file_path]
            report += f"- `{file_path}` (Tamanho: {info['size']:,} bytes)\n"
        
        if len(categories['unused']) > 20:
            report += f"- ... e mais {len(categories['unused']) - 20} ficheiros\n"
        
        report += f"""
## 📋 RECOMENDAÇÕES

### 1. Ação Imediata (Segura)
- ✅ Mover ficheiros standalone para subdiretórios organizados
- ✅ Remover ficheiros duplicados confirmados
- ✅ Organizar ficheiros grandes em diretório específico

### 2. Ação Cuidadosa (Requer Testes)
- ⚠️ Mover ficheiros referenciados (atualizar referências)
- ⚠️ Remover ficheiros não utilizados (confirmar não são necessários)

### 3. NÃO FAZER
- ❌ Mover ficheiros críticos
- ❌ Mover diretórios críticos (assets, BGAPP, minpermar)
- ❌ Alterar estrutura sem atualizar referências externas

## 🔧 Próximos Passos
1. Revisar ficheiros críticos identificados
2. Confirmar duplicados antes de remover
3. Testar movimentação de ficheiros standalone
4. Atualizar referências externas se necessário
5. Executar reorganização gradual

---
*Relatório gerado automaticamente pelo analisador de dependências BGAPP*
"""
        
        return report
    
    def run_analysis(self) -> bool:
        """Executar análise completa"""
        logger.info("🚀 Iniciando análise de dependências...")
        
        try:
            # 1. Analisar dependências de ficheiros
            dependencies = self.analyze_file_dependencies()
            
            # 2. Encontrar referências externas
            external_refs = self.find_external_references()
            
            # 3. Categorizar ficheiros
            categories = self.categorize_files(dependencies)
            
            # 4. Gerar relatório
            report = self.generate_analysis_report(dependencies, external_refs, categories)
            
            # 5. Salvar relatório
            report_path = self.base_path / "INFRA_DEPENDENCY_ANALYSIS.md"
            with open(report_path, 'w', encoding='utf-8') as f:
                f.write(report)
            
            # 6. Salvar dados JSON para análise posterior
            analysis_data = {
                'dependencies': dependencies,
                'external_references': external_refs,
                'categories': categories,
                'summary': {
                    'total_files': len(dependencies),
                    'critical_files': len(categories['critical']),
                    'referenced_files': len(categories['referenced']),
                    'standalone_files': len(categories['standalone']),
                    'duplicate_files': len(categories['duplicates']),
                    'large_files': len(categories['large']),
                    'unused_files': len(categories['unused'])
                }
            }
            
            json_path = self.base_path / "infra_analysis_data.json"
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(analysis_data, f, indent=2, default=str)
            
            logger.info("✅ Análise concluída com sucesso!")
            logger.info(f"📄 Relatório salvo em: {report_path}")
            logger.info(f"📊 Dados JSON salvos em: {json_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro durante análise: {e}")
            return False

def main():
    """Função principal"""
    print("🔍 BGAPP - Analisador de Dependências do Diretório infra/")
    print("=" * 60)
    
    # Verificar se estamos no diretório correto
    if not Path("infra/frontend").exists():
        print("❌ Erro: Execute este script no diretório raiz do projeto BGAPP")
        return False
    
    # Executar análise
    analyzer = InfraDependencyAnalyzer()
    success = analyzer.run_analysis()
    
    if success:
        print("✅ Análise concluída com sucesso!")
        print("📄 Consulte o relatório: INFRA_DEPENDENCY_ANALYSIS.md")
    else:
        print("❌ Análise falhou. Consulte os logs para detalhes.")
    
    return success

if __name__ == "__main__":
    main()
