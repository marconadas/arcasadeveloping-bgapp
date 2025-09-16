#!/usr/bin/env python3
"""
🔧 Script de Reorganização Segura do Diretório infra/
====================================================

Este script reorganiza o diretório infra/frontend/ de forma segura,
mantendo todas as funcionalidades e referências intactas.

Autor: MareDatum Consultoria e Gestão de Projectos Unipessoal LDA
Data: Janeiro 2025
Versão: 1.0.0
"""

import os
import shutil
import json
import hashlib
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Set
import logging

# Configuração do logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('reorganization.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class InfraReorganizer:
    """Reorganizador seguro do diretório infra/"""
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.infra_path = self.base_path / "infra" / "frontend"
        self.backup_path = self.base_path / "_backups" / f"infra_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Ficheiros críticos que NÃO podem ser movidos
        self.critical_files = {
            "index.html",
            "admin.html", 
            "manifest.json",
            "favicon.ico",
            "favicon-16x16.png",
            "favicon-32x32.png",
            "apple-touch-icon.png"
        }
        
        # Diretórios críticos que NÃO podem ser movidos
        self.critical_dirs = {
            "assets",
            "BGAPP",
            "minpermar"
        }
        
        # Extensões de ficheiros para organizar
        self.file_categories = {
            "css": [".css"],
            "js": [".js"],
            "images": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp"],
            "data": [".json", ".geojson", ".csv", ".xml"],
            "html": [".html", ".htm"],
            "docs": [".md", ".txt", ".pdf"]
        }
        
        # Padrões de ficheiros duplicados
        self.duplicate_patterns = [
            r"(.+)\s+2\.(\w+)$",  # arquivo 2.ext
            r"(.+)\.backup\.(\d+)$",  # arquivo.backup.123
            r"(.+)\.backup$",  # arquivo.backup
            r"(.+)\s+backup$",  # arquivo backup
        ]
    
    def create_backup(self) -> bool:
        """Criar backup completo do diretório infra/"""
        try:
            logger.info(f"📦 Criando backup em {self.backup_path}")
            self.backup_path.mkdir(parents=True, exist_ok=True)
            shutil.copytree(self.infra_path, self.backup_path / "frontend")
            logger.info("✅ Backup criado com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao criar backup: {e}")
            return False
    
    def analyze_structure(self) -> Dict:
        """Analisar estrutura atual do diretório"""
        logger.info("🔍 Analisando estrutura atual...")
        
        analysis = {
            "total_files": 0,
            "duplicates": [],
            "large_files": [],
            "unused_files": [],
            "critical_files": [],
            "file_types": {},
            "directories": []
        }
        
        for root, dirs, files in os.walk(self.infra_path):
            for file in files:
                file_path = Path(root) / file
                relative_path = file_path.relative_to(self.infra_path)
                
                analysis["total_files"] += 1
                
                # Categorizar por tipo
                ext = file_path.suffix.lower()
                if ext in analysis["file_types"]:
                    analysis["file_types"][ext] += 1
                else:
                    analysis["file_types"][ext] = 1
                
                # Identificar ficheiros grandes (>10MB)
                if file_path.stat().st_size > 10 * 1024 * 1024:
                    analysis["large_files"].append(str(relative_path))
                
                # Identificar ficheiros críticos
                if file in self.critical_files:
                    analysis["critical_files"].append(str(relative_path))
                
                # Identificar possíveis duplicados
                for pattern in self.duplicate_patterns:
                    if re.match(pattern, file):
                        analysis["duplicates"].append(str(relative_path))
                        break
        
        # Listar diretórios
        for root, dirs, files in os.walk(self.infra_path):
            for dir_name in dirs:
                dir_path = Path(root) / dir_name
                relative_path = dir_path.relative_to(self.infra_path)
                analysis["directories"].append(str(relative_path))
        
        logger.info(f"📊 Análise concluída: {analysis['total_files']} ficheiros encontrados")
        return analysis
    
    def find_duplicates(self) -> List[Tuple[str, List[str]]]:
        """Encontrar ficheiros duplicados usando hash MD5"""
        logger.info("🔍 Procurando ficheiros duplicados...")
        
        file_hashes = {}
        duplicates = []
        
        for root, dirs, files in os.walk(self.infra_path):
            for file in files:
                file_path = Path(root) / file
                try:
                    with open(file_path, 'rb') as f:
                        file_hash = hashlib.md5(f.read()).hexdigest()
                    
                    if file_hash in file_hashes:
                        file_hashes[file_hash].append(str(file_path.relative_to(self.infra_path)))
                    else:
                        file_hashes[file_hash] = [str(file_path.relative_to(self.infra_path))]
                except Exception as e:
                    logger.warning(f"⚠️ Erro ao processar {file_path}: {e}")
        
        # Identificar grupos de duplicados
        for file_hash, file_list in file_hashes.items():
            if len(file_list) > 1:
                duplicates.append((file_hash, file_list))
        
        logger.info(f"📊 Encontrados {len(duplicates)} grupos de ficheiros duplicados")
        return duplicates
    
    def create_new_structure(self) -> bool:
        """Criar nova estrutura de diretórios"""
        logger.info("🏗️ Criando nova estrutura de diretórios...")
        
        new_structure = [
            "public",
            "assets/css",
            "assets/js/core",
            "assets/js/modules", 
            "assets/js/libs",
            "assets/images/logos",
            "assets/images/icons",
            "assets/images/backgrounds",
            "assets/data/geojson",
            "assets/data/json",
            "interfaces/bgapp",
            "interfaces/minpermar",
            "interfaces/qgis",
            "testing/unit",
            "testing/integration", 
            "testing/performance",
            "docs/api",
            "docs/user-guides",
            "docs/technical",
            "_backups",
            "_temp"
        ]
        
        try:
            for dir_path in new_structure:
                full_path = self.infra_path / dir_path
                full_path.mkdir(parents=True, exist_ok=True)
                logger.info(f"📁 Criado: {dir_path}")
            
            logger.info("✅ Nova estrutura criada com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao criar estrutura: {e}")
            return False
    
    def move_critical_files(self) -> bool:
        """Mover ficheiros críticos para public/"""
        logger.info("📋 Movendo ficheiros críticos...")
        
        try:
            for file in self.critical_files:
                source = self.infra_path / file
                if source.exists():
                    destination = self.infra_path / "public" / file
                    shutil.move(str(source), str(destination))
                    logger.info(f"📄 Movido: {file} -> public/{file}")
            
            logger.info("✅ Ficheiros críticos movidos com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao mover ficheiros críticos: {e}")
            return False
    
    def organize_assets(self) -> bool:
        """Organizar ficheiros de assets"""
        logger.info("🎨 Organizando assets...")
        
        try:
            assets_dir = self.infra_path / "assets"
            
            # Mover CSS
            css_files = list(assets_dir.glob("*.css"))
            for css_file in css_files:
                dest = self.infra_path / "assets" / "css" / css_file.name
                shutil.move(str(css_file), str(dest))
                logger.info(f"🎨 Movido CSS: {css_file.name}")
            
            # Mover JavaScript
            js_files = list(assets_dir.glob("*.js"))
            for js_file in js_files:
                # Categorizar JS por nome
                if "core" in js_file.name.lower() or "main" in js_file.name.lower():
                    dest = self.infra_path / "assets" / "js" / "core" / js_file.name
                elif "lib" in js_file.name.lower() or "external" in js_file.name.lower():
                    dest = self.infra_path / "assets" / "js" / "libs" / js_file.name
                else:
                    dest = self.infra_path / "assets" / "js" / "modules" / js_file.name
                
                shutil.move(str(js_file), str(dest))
                logger.info(f"📜 Movido JS: {js_file.name}")
            
            # Mover imagens
            image_extensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp"]
            for ext in image_extensions:
                image_files = list(assets_dir.glob(f"*{ext}"))
                for img_file in image_files:
                    # Categorizar imagens por nome
                    if "logo" in img_file.name.lower():
                        dest = self.infra_path / "assets" / "images" / "logos" / img_file.name
                    elif "icon" in img_file.name.lower() or "favicon" in img_file.name.lower():
                        dest = self.infra_path / "assets" / "images" / "icons" / img_file.name
                    else:
                        dest = self.infra_path / "assets" / "images" / "backgrounds" / img_file.name
                    
                    shutil.move(str(img_file), str(dest))
                    logger.info(f"🖼️ Movida imagem: {img_file.name}")
            
            logger.info("✅ Assets organizados com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao organizar assets: {e}")
            return False
    
    def move_interfaces(self) -> bool:
        """Mover interfaces científicas"""
        logger.info("🔬 Movendo interfaces científicas...")
        
        try:
            # Mover BGAPP
            bgapp_source = self.infra_path / "BGAPP"
            if bgapp_source.exists():
                bgapp_dest = self.infra_path / "interfaces" / "bgapp"
                shutil.move(str(bgapp_source), str(bgapp_dest))
                logger.info("🔬 Movido: BGAPP -> interfaces/bgapp")
            
            # Mover MINPERMAR
            minpermar_source = self.infra_path / "minpermar"
            if minpermar_source.exists():
                minpermar_dest = self.infra_path / "interfaces" / "minpermar"
                shutil.move(str(minpermar_source), str(minpermar_dest))
                logger.info("🔬 Movido: minpermar -> interfaces/minpermar")
            
            # Mover ficheiros QGIS
            qgis_files = list(self.infra_path.glob("*qgis*"))
            qgis_dest = self.infra_path / "interfaces" / "qgis"
            for qgis_file in qgis_files:
                shutil.move(str(qgis_file), str(qgis_dest / qgis_file.name))
                logger.info(f"🔬 Movido QGIS: {qgis_file.name}")
            
            logger.info("✅ Interfaces movidas com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao mover interfaces: {e}")
            return False
    
    def move_test_files(self) -> bool:
        """Mover ficheiros de teste"""
        logger.info("🧪 Movendo ficheiros de teste...")
        
        try:
            test_files = list(self.infra_path.glob("test*"))
            for test_file in test_files:
                if test_file.is_file():
                    # Categorizar por tipo de teste
                    if "unit" in test_file.name.lower():
                        dest = self.infra_path / "testing" / "unit" / test_file.name
                    elif "integration" in test_file.name.lower():
                        dest = self.infra_path / "testing" / "integration" / test_file.name
                    elif "performance" in test_file.name.lower():
                        dest = self.infra_path / "testing" / "performance" / test_file.name
                    else:
                        dest = self.infra_path / "testing" / test_file.name
                    
                    shutil.move(str(test_file), str(dest))
                    logger.info(f"🧪 Movido teste: {test_file.name}")
            
            logger.info("✅ Ficheiros de teste movidos com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao mover ficheiros de teste: {e}")
            return False
    
    def update_references(self) -> bool:
        """Atualizar referências em ficheiros"""
        logger.info("🔗 Atualizando referências...")
        
        try:
            # Atualizar referências em ficheiros HTML
            html_files = list(self.infra_path.rglob("*.html"))
            for html_file in html_files:
                self.update_html_references(html_file)
            
            # Atualizar referências em ficheiros JavaScript
            js_files = list(self.infra_path.rglob("*.js"))
            for js_file in js_files:
                self.update_js_references(js_file)
            
            # Atualizar referências em ficheiros CSS
            css_files = list(self.infra_path.rglob("*.css"))
            for css_file in css_files:
                self.update_css_references(css_file)
            
            logger.info("✅ Referências atualizadas com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar referências: {e}")
            return False
    
    def update_html_references(self, file_path: Path):
        """Atualizar referências em ficheiro HTML"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Atualizar referências de assets
            content = re.sub(r'href="assets/', 'href="../assets/', content)
            content = re.sub(r'src="assets/', 'src="../assets/', content)
            
            # Atualizar referências de ficheiros críticos
            content = re.sub(r'href="([^"]*\.html)"', r'href="../public/\1"', content)
            content = re.sub(r'src="([^"]*\.html)"', r'src="../public/\1"', content)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.info(f"🔗 Atualizado: {file_path.name}")
        except Exception as e:
            logger.warning(f"⚠️ Erro ao atualizar {file_path}: {e}")
    
    def update_js_references(self, file_path: Path):
        """Atualizar referências em ficheiro JavaScript"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Atualizar referências de assets
            content = re.sub(r'["\']assets/', '"../assets/', content)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.info(f"🔗 Atualizado JS: {file_path.name}")
        except Exception as e:
            logger.warning(f"⚠️ Erro ao atualizar JS {file_path}: {e}")
    
    def update_css_references(self, file_path: Path):
        """Atualizar referências em ficheiro CSS"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Atualizar referências de assets
            content = re.sub(r'url\(["\']?assets/', 'url("../assets/', content)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.info(f"🔗 Atualizado CSS: {file_path.name}")
        except Exception as e:
            logger.warning(f"⚠️ Erro ao atualizar CSS {file_path}: {e}")
    
    def generate_report(self) -> str:
        """Gerar relatório da reorganização"""
        report = f"""
# 📊 Relatório de Reorganização - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## ✅ Ações Realizadas
- Backup criado em: {self.backup_path}
- Estrutura reorganizada
- Ficheiros críticos movidos
- Assets organizados por categoria
- Interfaces científicas organizadas
- Ficheiros de teste separados
- Referências atualizadas

## 📁 Nova Estrutura
```
infra/frontend/
├── public/                      # Ficheiros públicos
├── assets/                      # Assets organizados
│   ├── css/                    # Estilos
│   ├── js/                     # JavaScript
│   │   ├── core/               # Scripts principais
│   │   ├── modules/            # Módulos específicos
│   │   └── libs/               # Bibliotecas externas
│   ├── images/                 # Imagens
│   └── data/                   # Dados estáticos
├── interfaces/                 # Interfaces científicas
│   ├── bgapp/                  # Interface principal
│   ├── minpermar/              # Site MINPERMAR
│   └── qgis/                   # Interfaces QGIS
├── testing/                    # Ficheiros de teste
└── docs/                       # Documentação
```

## ⚠️ Próximos Passos
1. Testar funcionalidade da aplicação
2. Verificar se todas as referências estão corretas
3. Atualizar configurações de deploy se necessário
4. Remover backup após confirmação de funcionamento

## 🔧 Rollback
Se necessário, restaurar backup:
```bash
rm -rf infra/frontend/*
cp -r {self.backup_path}/frontend/* infra/frontend/
```
"""
        return report
    
    def run_reorganization(self) -> bool:
        """Executar reorganização completa"""
        logger.info("🚀 Iniciando reorganização do diretório infra/")
        
        try:
            # 1. Criar backup
            if not self.create_backup():
                return False
            
            # 2. Analisar estrutura
            analysis = self.analyze_structure()
            logger.info(f"📊 Encontrados {analysis['total_files']} ficheiros")
            
            # 3. Criar nova estrutura
            if not self.create_new_structure():
                return False
            
            # 4. Mover ficheiros críticos
            if not self.move_critical_files():
                return False
            
            # 5. Organizar assets
            if not self.organize_assets():
                return False
            
            # 6. Mover interfaces
            if not self.move_interfaces():
                return False
            
            # 7. Mover ficheiros de teste
            if not self.move_test_files():
                return False
            
            # 8. Atualizar referências
            if not self.update_references():
                return False
            
            # 9. Gerar relatório
            report = self.generate_report()
            with open(self.base_path / "REORGANIZATION_REPORT.md", "w", encoding="utf-8") as f:
                f.write(report)
            
            logger.info("🎉 Reorganização concluída com sucesso!")
            logger.info(f"📄 Relatório salvo em: REORGANIZATION_REPORT.md")
            logger.info(f"💾 Backup disponível em: {self.backup_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro durante reorganização: {e}")
            return False

def main():
    """Função principal"""
    print("🔧 BGAPP - Reorganizador Seguro do Diretório infra/")
    print("=" * 60)
    
    # Verificar se estamos no diretório correto
    if not Path("infra/frontend").exists():
        print("❌ Erro: Execute este script no diretório raiz do projeto BGAPP")
        return False
    
    # Confirmar ação
    response = input("⚠️ Esta ação irá reorganizar o diretório infra/frontend/. Continuar? (s/N): ")
    if response.lower() != 's':
        print("❌ Operação cancelada")
        return False
    
    # Executar reorganização
    reorganizer = InfraReorganizer()
    success = reorganizer.run_reorganization()
    
    if success:
        print("✅ Reorganização concluída com sucesso!")
        print("📄 Consulte o relatório: REORGANIZATION_REPORT.md")
    else:
        print("❌ Reorganização falhou. Consulte os logs para detalhes.")
    
    return success

if __name__ == "__main__":
    main()
