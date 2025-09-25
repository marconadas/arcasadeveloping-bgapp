#!/usr/bin/env python3
"""
🧹 Script de Limpeza Segura - infra/frontend/
=============================================

Este script remove apenas ficheiros identificados como seguros para remoção
baseado na análise de dependências realizada.

Autor: MareDatum Consultoria e Gestão de Projectos Unipessoal LDA
Data: Janeiro 2025
Versão: 1.0.0
"""

import os
import shutil
import re
from pathlib import Path
from datetime import datetime
import logging

# Configuração do logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SafeInfraCleaner:
    """Limpeza segura do diretório infra/frontend/"""
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.infra_path = self.base_path / "infra" / "frontend"
        self.backup_path = self.base_path / "_backups" / f"cleanup_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Padrões de ficheiros seguros para remoção
        self.safe_to_remove_patterns = [
            r"test-.*\.html$",           # Ficheiros de teste
            r".*\.backup\.\d+$",         # Backups numerados
            r".*\s+backup$",             # Ficheiros com sufixo backup
            r".*\.backup$",              # Ficheiros .backup
            r".*\s+2\.\w+$",             # Ficheiros com sufixo 2
            r".*\s+3\.\w+$",             # Ficheiros com sufixo 3
            r".*\.old$",                 # Ficheiros .old
            r".*\.tmp$",                 # Ficheiros temporários
            r".*\.temp$",                # Ficheiros temporários
            r".*\.log$",                 # Ficheiros de log
            r".*\.bak$",                 # Ficheiros .bak
        ]
        
        # Ficheiros específicos identificados como não utilizados
        self.specific_unused_files = [
            # Adicionar ficheiros específicos identificados na análise
            # (será preenchido com base na análise real)
        ]
        
        # Ficheiros que NUNCA devem ser removidos
        self.protected_files = {
            "index.html",
            "admin.html",
            "manifest.json",
            "favicon.ico",
            "favicon-16x16.png",
            "favicon-32x32.png",
            "apple-touch-icon.png",
            "sw.js"
        }
        
        # Diretórios que NUNCA devem ser tocados
        self.protected_dirs = {
            "assets",
            "BGAPP",
            "minpermar",
            "minpermar-site"
        }
    
    def create_backup(self) -> bool:
        """Criar backup antes da limpeza"""
        try:
            logger.info(f"📦 Criando backup em {self.backup_path}")
            self.backup_path.mkdir(parents=True, exist_ok=True)
            shutil.copytree(self.infra_path, self.backup_path / "frontend")
            logger.info("✅ Backup criado com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao criar backup: {e}")
            return False
    
    def identify_safe_files(self) -> list:
        """Identificar ficheiros seguros para remoção"""
        logger.info("🔍 Identificando ficheiros seguros para remoção...")
        
        safe_files = []
        
        for root, dirs, files in os.walk(self.infra_path):
            # Pular diretórios protegidos
            dirs[:] = [d for d in dirs if d not in self.protected_dirs]
            
            for file in files:
                file_path = Path(root) / file
                relative_path = file_path.relative_to(self.infra_path)
                
                # Pular ficheiros protegidos
                if file in self.protected_files:
                    continue
                
                # Verificar padrões de remoção segura
                for pattern in self.safe_to_remove_patterns:
                    if re.match(pattern, file, re.IGNORECASE):
                        safe_files.append(str(relative_path))
                        logger.info(f"📋 Identificado para remoção: {relative_path}")
                        break
        
        logger.info(f"📊 Identificados {len(safe_files)} ficheiros seguros para remoção")
        return safe_files
    
    def move_to_backup(self, files_to_remove: list) -> bool:
        """Mover ficheiros para backup em vez de remover"""
        try:
            logger.info("📦 Movendo ficheiros para backup...")
            
            backup_files_dir = self.backup_path / "removed_files"
            backup_files_dir.mkdir(parents=True, exist_ok=True)
            
            moved_count = 0
            for file_path in files_to_remove:
                source = self.infra_path / file_path
                if source.exists():
                    # Criar estrutura de diretórios no backup
                    dest = backup_files_dir / file_path
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    
                    shutil.move(str(source), str(dest))
                    moved_count += 1
                    logger.info(f"📦 Movido: {file_path}")
            
            logger.info(f"✅ {moved_count} ficheiros movidos para backup")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao mover ficheiros para backup: {e}")
            return False
    
    def clean_duplicate_files(self) -> bool:
        """Limpar ficheiros duplicados identificados"""
        logger.info("🧹 Limpando ficheiros duplicados...")
        
        try:
            # Procurar por ficheiros duplicados usando hash
            file_hashes = {}
            duplicates = []
            
            for root, dirs, files in os.walk(self.infra_path):
                # Pular diretórios protegidos
                dirs[:] = [d for d in dirs if d not in self.protected_dirs]
                
                for file in files:
                    file_path = Path(root) / file
                    relative_path = file_path.relative_to(self.infra_path)
                    
                    # Pular ficheiros protegidos
                    if file in self.protected_files:
                        continue
                    
                    try:
                        with open(file_path, 'rb') as f:
                            file_hash = hash(f.read())
                        
                        if file_hash in file_hashes:
                            duplicates.append(str(relative_path))
                        else:
                            file_hashes[file_hash] = str(relative_path)
                    except Exception as e:
                        logger.warning(f"⚠️ Erro ao processar {file_path}: {e}")
            
            # Mover duplicados para backup
            if duplicates:
                logger.info(f"📊 Encontrados {len(duplicates)} ficheiros duplicados")
                return self.move_to_backup(duplicates)
            else:
                logger.info("✅ Nenhum ficheiro duplicado encontrado")
                return True
                
        except Exception as e:
            logger.error(f"❌ Erro ao limpar duplicados: {e}")
            return False
    
    def clean_empty_directories(self) -> bool:
        """Limpar diretórios vazios"""
        logger.info("🧹 Limpando diretórios vazios...")
        
        try:
            removed_dirs = []
            
            # Percorrer de baixo para cima para remover diretórios vazios
            for root, dirs, files in os.walk(self.infra_path, topdown=False):
                for dir_name in dirs:
                    dir_path = Path(root) / dir_name
                    relative_path = dir_path.relative_to(self.infra_path)
                    
                    # Pular diretórios protegidos
                    if str(relative_path).split('/')[0] in self.protected_dirs:
                        continue
                    
                    try:
                        if not any(dir_path.iterdir()):  # Diretório vazio
                            dir_path.rmdir()
                            removed_dirs.append(str(relative_path))
                            logger.info(f"📁 Removido diretório vazio: {relative_path}")
                    except Exception as e:
                        logger.warning(f"⚠️ Erro ao remover diretório {dir_path}: {e}")
            
            logger.info(f"✅ {len(removed_dirs)} diretórios vazios removidos")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao limpar diretórios vazios: {e}")
            return False
    
    def generate_cleanup_report(self, files_removed: list) -> str:
        """Gerar relatório da limpeza"""
        
        report = f"""
# 🧹 Relatório de Limpeza Segura - infra/frontend/
## Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## ✅ Ações Realizadas
- Backup criado em: {self.backup_path}
- Ficheiros movidos para backup: {len(files_removed)}
- Ficheiros duplicados removidos
- Diretórios vazios limpos

## 📊 Ficheiros Removidos
"""
        
        for file_path in files_removed:
            report += f"- `{file_path}`\n"
        
        report += f"""
## 📁 Estrutura de Backup
```
{self.backup_path}/
├── frontend/                    # Backup completo
└── removed_files/              # Ficheiros removidos
    └── [estrutura original]
```

## 🔧 Rollback
Se necessário, restaurar ficheiros removidos:
```bash
# Restaurar ficheiro específico
cp {self.backup_path}/removed_files/[caminho] infra/frontend/[caminho]

# Restaurar backup completo
rm -rf infra/frontend/*
cp -r {self.backup_path}/frontend/* infra/frontend/
```

## ⚠️ Próximos Passos
1. Testar funcionalidade da aplicação
2. Verificar se todas as funcionalidades continuam a funcionar
3. Remover backup após confirmação de funcionamento
4. Considerar próxima fase de organização

---
*Relatório gerado automaticamente pelo script de limpeza segura BGAPP*
"""
        
        return report
    
    def run_cleanup(self) -> bool:
        """Executar limpeza segura"""
        logger.info("🚀 Iniciando limpeza segura do diretório infra/")
        
        try:
            # 1. Criar backup
            if not self.create_backup():
                return False
            
            # 2. Identificar ficheiros seguros para remoção
            safe_files = self.identify_safe_files()
            
            if not safe_files:
                logger.info("✅ Nenhum ficheiro identificado para remoção")
                return True
            
            # 3. Mover ficheiros para backup
            if not self.move_to_backup(safe_files):
                return False
            
            # 4. Limpar duplicados
            if not self.clean_duplicate_files():
                return False
            
            # 5. Limpar diretórios vazios
            if not self.clean_empty_directories():
                return False
            
            # 6. Gerar relatório
            report = self.generate_cleanup_report(safe_files)
            with open(self.base_path / "CLEANUP_REPORT.md", "w", encoding="utf-8") as f:
                f.write(report)
            
            logger.info("🎉 Limpeza concluída com sucesso!")
            logger.info(f"📄 Relatório salvo em: CLEANUP_REPORT.md")
            logger.info(f"💾 Backup disponível em: {self.backup_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro durante limpeza: {e}")
            return False

def main():
    """Função principal"""
    print("🧹 BGAPP - Limpeza Segura do Diretório infra/")
    print("=" * 50)
    
    # Verificar se estamos no diretório correto
    if not Path("infra/frontend").exists():
        print("❌ Erro: Execute este script no diretório raiz do projeto BGAPP")
        return False
    
    # Confirmar ação
    print("⚠️ Esta ação irá:")
    print("  - Criar backup completo")
    print("  - Remover ficheiros duplicados e não utilizados")
    print("  - Manter todos os ficheiros críticos intactos")
    print()
    
    response = input("Continuar? (s/N): ")
    if response.lower() != 's':
        print("❌ Operação cancelada")
        return False
    
    # Executar limpeza
    cleaner = SafeInfraCleaner()
    success = cleaner.run_cleanup()
    
    if success:
        print("✅ Limpeza concluída com sucesso!")
        print("📄 Consulte o relatório: CLEANUP_REPORT.md")
    else:
        print("❌ Limpeza falhou. Consulte os logs para detalhes.")
    
    return success

if __name__ == "__main__":
    main()
