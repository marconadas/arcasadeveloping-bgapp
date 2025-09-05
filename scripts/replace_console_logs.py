#!/usr/bin/env python3
"""
Script para substituir console.log por sistema de logging profissional
Silicon Valley Grade - Automatização completa
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Dict
import argparse
import json

class ConsoleLogReplacer:
    """Substitui console.log por logger apropriado"""
    
    # Padrões para detectar console.log
    PATTERNS = {
        'typescript': {
            'console_log': r'console\.(log|warn|error|info|debug)\s*\(',
            'import_check': r'import.*\{.*logger.*\}.*from.*[\'"].*logger[\'"]',
            'logger_import': "import { logger } from '@/lib/logger';\n",
            'extensions': ['.ts', '.tsx', '.js', '.jsx']
        },
        'python': {
            'console_log': r'print\s*\(',
            'import_check': r'from\s+bgapp\.core\.logger\s+import',
            'logger_import': "from bgapp.core.logger import logger\n",
            'extensions': ['.py']
        }
    }
    
    # Mapeamento de console methods para logger methods
    CONSOLE_TO_LOGGER = {
        'log': 'info',
        'warn': 'warn',
        'error': 'error',
        'info': 'info',
        'debug': 'debug'
    }
    
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.stats = {
            'files_processed': 0,
            'files_modified': 0,
            'console_logs_replaced': 0,
            'errors': []
        }
    
    def process_directory(self, directory: Path, language: str = 'typescript'):
        """Processa todos os arquivos em um diretório"""
        patterns = self.PATTERNS[language]
        
        for ext in patterns['extensions']:
            for file_path in directory.rglob(f'*{ext}'):
                # Ignorar node_modules, backups, etc
                if self._should_skip_file(file_path):
                    continue
                
                try:
                    self.process_file(file_path, language)
                except Exception as e:
                    self.stats['errors'].append({
                        'file': str(file_path),
                        'error': str(e)
                    })
    
    def _should_skip_file(self, file_path: Path) -> bool:
        """Verifica se deve pular o arquivo"""
        skip_dirs = ['node_modules', '.git', 'dist', 'build', 'out', '__pycache__', 
                     '.next', 'backup', '.backup']
        
        for skip_dir in skip_dirs:
            if skip_dir in file_path.parts:
                return True
        
        # Pular arquivos de teste e config
        if any(pattern in file_path.name for pattern in ['test', 'spec', 'config', '.min.']):
            return True
        
        return False
    
    def process_file(self, file_path: Path, language: str):
        """Processa um único arquivo"""
        self.stats['files_processed'] += 1
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        patterns = self.PATTERNS[language]
        
        # Verificar se já tem import do logger
        has_logger_import = re.search(patterns['import_check'], content)
        
        # Substituir console.logs
        if language == 'typescript':
            content, count = self._replace_typescript_console(content)
        else:
            content, count = self._replace_python_print(content)
        
        if count > 0:
            self.stats['console_logs_replaced'] += count
            
            # Adicionar import se necessário
            if not has_logger_import and count > 0:
                content = self._add_import(content, patterns['logger_import'], language)
            
            # Salvar arquivo
            if not self.dry_run and content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                self.stats['files_modified'] += 1
                print(f"✅ Modified: {file_path} ({count} replacements)")
            elif self.dry_run:
                print(f"🔍 Would modify: {file_path} ({count} replacements)")
    
    def _replace_typescript_console(self, content: str) -> Tuple[str, int]:
        """Substitui console.log em TypeScript"""
        count = 0
        
        def replace_console(match):
            nonlocal count
            count += 1
            
            full_match = match.group(0)
            method = match.group(1)
            
            # Extrair o conteúdo dentro dos parênteses
            start_pos = match.end()
            paren_count = 1
            end_pos = start_pos
            
            for i, char in enumerate(content[start_pos:], start_pos):
                if char == '(':
                    paren_count += 1
                elif char == ')':
                    paren_count -= 1
                    if paren_count == 0:
                        end_pos = i
                        break
            
            args = content[start_pos:end_pos]
            
            # Mapear para método do logger
            logger_method = self.CONSOLE_TO_LOGGER.get(method, 'info')
            
            # Analisar argumentos para contexto
            if ',' in args:
                # Múltiplos argumentos - primeiro é mensagem, resto é contexto
                parts = self._smart_split(args)
                if len(parts) > 1:
                    message = parts[0]
                    context_parts = parts[1:]
                    
                    # Tentar criar objeto de contexto
                    if all('=' not in p or ':' in p for p in context_parts):
                        # Já são pares chave:valor ou objetos
                        return f"logger.{logger_method}({message}, {{ {', '.join(context_parts)} }})"
                    else:
                        # Valores simples - criar contexto
                        context_items = []
                        for i, part in enumerate(context_parts):
                            context_items.append(f"arg{i+1}: {part}")
                        return f"logger.{logger_method}({message}, {{ {', '.join(context_items)} }})"
                else:
                    return f"logger.{logger_method}({args})"
            else:
                return f"logger.{logger_method}({args})"
        
        # Substituir todos os console.X
        pattern = re.compile(r'console\.(log|warn|error|info|debug)\s*\(')
        
        # Processo iterativo para capturar corretamente
        while True:
            match = pattern.search(content)
            if not match:
                break
            
            # Encontrar o fechamento correto do parêntese
            start = match.start()
            open_paren = match.end() - 1
            paren_count = 1
            end = open_paren + 1
            
            while end < len(content) and paren_count > 0:
                if content[end] == '(':
                    paren_count += 1
                elif content[end] == ')':
                    paren_count -= 1
                end += 1
            
            # Extrair a chamada completa
            full_call = content[start:end]
            method = match.group(1)
            args = content[open_paren + 1:end - 1]
            
            # Criar replacement
            logger_method = self.CONSOLE_TO_LOGGER.get(method, 'info')
            
            # Análise simples de argumentos
            if args.strip():
                replacement = f"logger.{logger_method}({args})"
            else:
                replacement = f"logger.{logger_method}('')"
            
            # Substituir
            content = content[:start] + replacement + content[end:]
            count += 1
        
        return content, count
    
    def _replace_python_print(self, content: str) -> Tuple[str, int]:
        """Substitui print em Python"""
        count = 0
        
        # Padrão mais simples para Python
        def replace_print(match):
            nonlocal count
            count += 1
            
            # Extrair argumentos do print
            args = match.group(1) if match.lastindex >= 1 else ''
            
            # Determinar nível baseado no conteúdo
            if 'error' in args.lower() or 'exception' in args.lower():
                return f"logger.error({args})"
            elif 'warning' in args.lower() or 'warn' in args.lower():
                return f"logger.warning({args})"
            elif 'debug' in args.lower():
                return f"logger.debug({args})"
            else:
                return f"logger.info({args})"
        
        pattern = re.compile(r'print\s*\((.*?)\)', re.DOTALL)
        content = pattern.sub(replace_print, content)
        
        return content, count
    
    def _add_import(self, content: str, import_statement: str, language: str) -> str:
        """Adiciona import do logger no início do arquivo"""
        if language == 'typescript':
            # Encontrar onde adicionar o import
            lines = content.split('\n')
            
            # Procurar após 'use client' ou no início
            insert_index = 0
            for i, line in enumerate(lines):
                if line.strip().startswith("'use client'") or line.strip().startswith('"use client"'):
                    insert_index = i + 1
                    break
                elif line.strip().startswith('import '):
                    insert_index = i
                    break
            
            # Adicionar import
            lines.insert(insert_index, import_statement.strip())
            return '\n'.join(lines)
        
        else:  # Python
            # Adicionar após outros imports ou no início
            lines = content.split('\n')
            
            # Encontrar último import
            last_import = 0
            for i, line in enumerate(lines):
                if line.strip().startswith('import ') or line.strip().startswith('from '):
                    last_import = i
            
            # Adicionar após último import
            lines.insert(last_import + 1, import_statement.strip())
            return '\n'.join(lines)
    
    def _smart_split(self, args: str) -> List[str]:
        """Split inteligente que respeita strings e objetos"""
        parts = []
        current = []
        depth = 0
        in_string = False
        string_char = None
        
        for char in args:
            if char in '"\'`' and not in_string:
                in_string = True
                string_char = char
            elif char == string_char and in_string:
                in_string = False
                string_char = None
            elif char in '({[' and not in_string:
                depth += 1
            elif char in ')}]' and not in_string:
                depth -= 1
            elif char == ',' and depth == 0 and not in_string:
                parts.append(''.join(current).strip())
                current = []
                continue
            
            current.append(char)
        
        if current:
            parts.append(''.join(current).strip())
        
        return parts
    
    def print_stats(self):
        """Imprime estatísticas da execução"""
        print("\n" + "="*60)
        print("📊 ESTATÍSTICAS DE SUBSTITUIÇÃO")
        print("="*60)
        print(f"✅ Arquivos processados: {self.stats['files_processed']}")
        print(f"📝 Arquivos modificados: {self.stats['files_modified']}")
        print(f"🔄 Console.logs substituídos: {self.stats['console_logs_replaced']}")
        
        if self.stats['errors']:
            print(f"\n❌ Erros encontrados: {len(self.stats['errors'])}")
            for error in self.stats['errors'][:5]:  # Mostrar apenas 5 primeiros
                print(f"  - {error['file']}: {error['error']}")
        
        print("="*60)


def main():
    parser = argparse.ArgumentParser(description='Replace console.log with professional logger')
    parser.add_argument('--path', type=str, required=True, help='Path to process')
    parser.add_argument('--language', choices=['typescript', 'python'], default='typescript')
    parser.add_argument('--dry-run', action='store_true', help='Dry run without modifications')
    
    args = parser.parse_args()
    
    replacer = ConsoleLogReplacer(dry_run=args.dry_run)
    
    path = Path(args.path)
    if not path.exists():
        print(f"❌ Path does not exist: {path}")
        sys.exit(1)
    
    print(f"🚀 Processing {path} for {args.language} files...")
    print(f"{'🔍 DRY RUN MODE' if args.dry_run else '⚡ LIVE MODE'}")
    print("="*60)
    
    replacer.process_directory(path, args.language)
    replacer.print_stats()
    
    if args.dry_run:
        print("\n💡 Run without --dry-run to apply changes")


if __name__ == "__main__":
    main()