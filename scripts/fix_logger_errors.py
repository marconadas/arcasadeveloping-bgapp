#!/usr/bin/env python3
"""
Script para corrigir erros de tipo no logger TypeScript
"""

import re
import sys
from pathlib import Path

def fix_logger_errors(file_path):
    """Corrige erros de tipo no logger"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Padrão para encontrar logger.error/warn com error como segundo parâmetro
    patterns = [
        (r'(logger\.(error|warn|info|debug))\(([^,]+),\s*error\)', r'\1(\3, { error: String(error) })'),
        (r'(logger\.(error|warn|info|debug))\(([^,]+),\s*error\s*as\s*Error\)', r'\1(\3, { error: String(error) })'),
        (r'(logger\.(error|warn|info|debug))\(([^,]+),\s*errorInfo\)', r'\1(\3, { errorInfo: String(errorInfo) })'),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    admin_src = Path('/workspace/admin-dashboard/src')
    
    modified = 0
    for file_path in admin_src.rglob('*.tsx'):
        if fix_logger_errors(file_path):
            print(f"✅ Fixed: {file_path}")
            modified += 1
    
    for file_path in admin_src.rglob('*.ts'):
        if fix_logger_errors(file_path):
            print(f"✅ Fixed: {file_path}")
            modified += 1
    
    print(f"\n📊 Total files fixed: {modified}")

if __name__ == "__main__":
    main()