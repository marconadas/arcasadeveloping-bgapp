#!/usr/bin/env python3
"""
📁 Script de Organização Interna - infra/frontend/
=================================================

Este script organiza ficheiros dentro de diretórios existentes sem alterar
referências críticas, criando subdiretórios para melhor organização.

Autor: MareDatum Consultoria e Gestão de Projectos Unipessoal LDA
Data: Janeiro 2025
Versão: 1.0.0
"""

import os
import shutil
from pathlib import Path
from datetime import datetime
import logging

# Configuração do logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class InternalInfraOrganizer:
    """Organizador interno do diretório infra/frontend/"""
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.infra_path = self.base_path / "infra" / "frontend"
        self.backup_path = self.base_path / "_backups" / f"organize_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Diretórios a criar dentro de assets/
        self.assets_subdirs = [
            "data/geojson",
            "data/json", 
            "docs",
            "backups"
        ]
        
        # Diretórios a criar na raiz
        self.root_subdirs = [
            "_organization",
            "_temp",
            "_backups"
        ]
    
    def create_backup(self) -> bool:
        """Criar backup antes da organização"""
        try:
            logger.info(f"📦 Criando backup em {self.backup_path}")
            self.backup_path.mkdir(parents=True, exist_ok=True)
            shutil.copytree(self.infra_path, self.backup_path / "frontend")
            logger.info("✅ Backup criado com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao criar backup: {e}")
            return False
    
    def create_subdirectories(self) -> bool:
        """Criar subdiretórios para organização"""
        logger.info("📁 Criando subdiretórios para organização...")
        
        try:
            # Criar subdiretórios em assets/
            assets_dir = self.infra_path / "assets"
            for subdir in self.assets_subdirs:
                full_path = assets_dir / subdir
                full_path.mkdir(parents=True, exist_ok=True)
                logger.info(f"📁 Criado: assets/{subdir}")
            
            # Criar diretórios na raiz
            for subdir in self.root_subdirs:
                full_path = self.infra_path / subdir
                full_path.mkdir(parents=True, exist_ok=True)
                logger.info(f"📁 Criado: {subdir}")
            
            logger.info("✅ Subdiretórios criados com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao criar subdiretórios: {e}")
            return False
    
    def organize_data_files(self) -> bool:
        """Organizar ficheiros de dados"""
        logger.info("📊 Organizando ficheiros de dados...")
        
        try:
            moved_count = 0
            
            # Mover ficheiros GeoJSON
            geojson_files = list(self.infra_path.glob("*.geojson"))
            for file_path in geojson_files:
                dest = self.infra_path / "assets" / "data" / "geojson" / file_path.name
                shutil.move(str(file_path), str(dest))
                moved_count += 1
                logger.info(f"📊 Movido GeoJSON: {file_path.name}")
            
            # Mover ficheiros JSON de dados
            json_files = list(self.infra_path.glob("*.json"))
            for file_path in json_files:
                # Pular manifest.json e outros ficheiros críticos
                if file_path.name in ["manifest.json"]:
                    continue
                
                # Mover para data/json se for ficheiro de dados
                if any(keyword in file_path.name.lower() for keyword in ["data", "config", "stac"]):
                    dest = self.infra_path / "assets" / "data" / "json" / file_path.name
                    shutil.move(str(file_path), str(dest))
                    moved_count += 1
                    logger.info(f"📊 Movido JSON: {file_path.name}")
            
            logger.info(f"✅ {moved_count} ficheiros de dados organizados")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao organizar ficheiros de dados: {e}")
            return False
    
    def organize_documentation(self) -> bool:
        """Organizar ficheiros de documentação"""
        logger.info("📚 Organizando ficheiros de documentação...")
        
        try:
            moved_count = 0
            
            # Mover ficheiros de documentação
            doc_files = list(self.infra_path.glob("*.md"))
            for file_path in doc_files:
                dest = self.infra_path / "assets" / "docs" / file_path.name
                shutil.move(str(file_path), str(dest))
                moved_count += 1
                logger.info(f"📚 Movido doc: {file_path.name}")
            
            # Mover ficheiros de texto
            txt_files = list(self.infra_path.glob("*.txt"))
            for file_path in txt_files:
                dest = self.infra_path / "assets" / "docs" / file_path.name
                shutil.move(str(file_path), str(dest))
                moved_count += 1
                logger.info(f"📚 Movido txt: {file_path.name}")
            
            logger.info(f"✅ {moved_count} ficheiros de documentação organizados")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao organizar documentação: {e}")
            return False
    
    def organize_test_files(self) -> bool:
        """Organizar ficheiros de teste restantes"""
        logger.info("🧪 Organizando ficheiros de teste...")
        
        try:
            moved_count = 0
            
            # Mover ficheiros de teste restantes
            test_files = list(self.infra_path.glob("test*.html"))
            for file_path in test_files:
                dest = self.infra_path / "_organization" / "test_files" / file_path.name
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(file_path), str(dest))
                moved_count += 1
                logger.info(f"🧪 Movido teste: {file_path.name}")
            
            # Mover ficheiros de demonstração
            demo_files = list(self.infra_path.glob("*demo*.html"))
            for file_path in demo_files:
                dest = self.infra_path / "_organization" / "demo_files" / file_path.name
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(file_path), str(dest))
                moved_count += 1
                logger.info(f"🧪 Movido demo: {file_path.name}")
            
            logger.info(f"✅ {moved_count} ficheiros de teste organizados")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao organizar ficheiros de teste: {e}")
            return False
    
    def organize_backup_files(self) -> bool:
        """Organizar ficheiros de backup"""
        logger.info("💾 Organizando ficheiros de backup...")
        
        try:
            moved_count = 0
            
            # Mover ficheiros de backup (excluir diretório _backups)
            backup_files = list(self.infra_path.glob("*backup*"))
            for file_path in backup_files:
                # Pular se for o diretório _backups que criámos
                if file_path.name == "_backups":
                    continue
                dest = self.infra_path / "_backups" / file_path.name
                shutil.move(str(file_path), str(dest))
                moved_count += 1
                logger.info(f"💾 Movido backup: {file_path.name}")
            
            # Mover ficheiros .old
            old_files = list(self.infra_path.glob("*.old"))
            for file_path in old_files:
                dest = self.infra_path / "_backups" / file_path.name
                shutil.move(str(file_path), str(dest))
                moved_count += 1
                logger.info(f"💾 Movido old: {file_path.name}")
            
            logger.info(f"✅ {moved_count} ficheiros de backup organizados")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao organizar ficheiros de backup: {e}")
            return False
    
    def generate_organization_report(self) -> str:
        """Gerar relatório da organização"""
        
        report = f"""
# 📁 Relatório de Organização Interna - infra/frontend/
## Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## ✅ Ações Realizadas
- Backup criado em: {self.backup_path}
- Subdiretórios criados para organização
- Ficheiros de dados organizados
- Documentação organizada
- Ficheiros de teste organizados
- Ficheiros de backup organizados

## 📁 Nova Estrutura Criada
```
infra/frontend/
├── assets/
│   ├── data/
│   │   ├── geojson/          # Dados geoespaciais
│   │   └── json/             # Configurações JSON
│   ├── docs/                 # Documentação
│   └── backups/              # Backups de assets
├── _organization/
│   ├── test_files/           # Ficheiros de teste
│   └── demo_files/           # Ficheiros de demonstração
├── _temp/                    # Ficheiros temporários
└── _backups/                 # Ficheiros de backup
```

## 🔧 Rollback
Se necessário, restaurar backup:
```bash
rm -rf infra/frontend/*
cp -r {self.backup_path}/frontend/* infra/frontend/
```

## ⚠️ Próximos Passos
1. Testar funcionalidade da aplicação
2. Verificar se todas as funcionalidades continuam a funcionar
3. Considerar próxima fase de melhorias
4. Remover backup após confirmação de funcionamento

---
*Relatório gerado automaticamente pelo script de organização interna BGAPP*
"""
        
        return report
    
    def run_organization(self) -> bool:
        """Executar organização interna"""
        logger.info("🚀 Iniciando organização interna do diretório infra/")
        
        try:
            # 1. Criar backup
            if not self.create_backup():
                return False
            
            # 2. Criar subdiretórios
            if not self.create_subdirectories():
                return False
            
            # 3. Organizar ficheiros de dados
            if not self.organize_data_files():
                return False
            
            # 4. Organizar documentação
            if not self.organize_documentation():
                return False
            
            # 5. Organizar ficheiros de teste
            if not self.organize_test_files():
                return False
            
            # 6. Organizar ficheiros de backup
            if not self.organize_backup_files():
                return False
            
            # 7. Gerar relatório
            report = self.generate_organization_report()
            with open(self.base_path / "ORGANIZATION_REPORT.md", "w", encoding="utf-8") as f:
                f.write(report)
            
            logger.info("🎉 Organização interna concluída com sucesso!")
            logger.info(f"📄 Relatório salvo em: ORGANIZATION_REPORT.md")
            logger.info(f"💾 Backup disponível em: {self.backup_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro durante organização: {e}")
            return False

def main():
    """Função principal"""
    print("📁 BGAPP - Organização Interna do Diretório infra/")
    print("=" * 55)
    
    # Verificar se estamos no diretório correto
    if not Path("infra/frontend").exists():
        print("❌ Erro: Execute este script no diretório raiz do projeto BGAPP")
        return False
    
    # Confirmar ação
    print("⚠️ Esta ação irá:")
    print("  - Criar backup completo")
    print("  - Criar subdiretórios para organização")
    print("  - Organizar ficheiros por categoria")
    print("  - Manter todas as funcionalidades intactas")
    print()
    
    response = input("Continuar? (s/N): ")
    if response.lower() != 's':
        print("❌ Operação cancelada")
        return False
    
    # Executar organização
    organizer = InternalInfraOrganizer()
    success = organizer.run_organization()
    
    if success:
        print("✅ Organização interna concluída com sucesso!")
        print("📄 Consulte o relatório: ORGANIZATION_REPORT.md")
    else:
        print("❌ Organização falhou. Consulte os logs para detalhes.")
    
    return success

if __name__ == "__main__":
    main()
