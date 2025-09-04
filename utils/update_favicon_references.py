#!/usr/bin/env python3
"""
Script para atualizar todas as referências de favicon nas páginas HTML
Atualiza theme-color para combinar com o novo logo MARÍTIMO ANGOLA
"""

import os
import re
import glob

def update_html_file(file_path):
    """Atualizar um arquivo HTML com as novas referências de favicon"""
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Atualizar theme-color para combinar com o logo azul
        old_theme_color = '#0066cc'
        new_theme_color = '#173c72'  # Azul do logo MARÍTIMO ANGOLA
        
        content = re.sub(
            r'<meta name="theme-color" content="[^"]*"',
            f'<meta name="theme-color" content="{new_theme_color}"',
            content
        )
        
        # Verificar se os caminhos dos favicons estão corretos baseado na localização do arquivo
        file_dir = os.path.dirname(file_path)
        relative_to_frontend = os.path.relpath(file_dir, 'infra/frontend')
        
        if relative_to_frontend == '.':
            # Arquivo está em infra/frontend/
            favicon_path = ''
        elif relative_to_frontend.count('/') == 0 and relative_to_frontend != '.':
            # Arquivo está em subdiretório de infra/frontend/
            favicon_path = '../'
        elif relative_to_frontend.count('/') == 1:
            # Arquivo está em subdiretório mais profundo
            favicon_path = '../../'
        else:
            # Arquivo está no raiz ou outro local
            favicon_path = 'infra/frontend/'
        
        # Atualizar caminhos dos favicons se necessário
        favicon_patterns = [
            (r'href="[^"]*favicon\.ico"', f'href="{favicon_path}favicon.ico"'),
            (r'href="[^"]*favicon-32x32\.png"', f'href="{favicon_path}favicon-32x32.png"'),
            (r'href="[^"]*favicon-16x16\.png"', f'href="{favicon_path}favicon-16x16.png"'),
            (r'href="[^"]*apple-touch-icon\.png"', f'href="{favicon_path}apple-touch-icon.png"'),
        ]
        
        for pattern, replacement in favicon_patterns:
            content = re.sub(pattern, replacement, content)
        
        # Salvar apenas se houve mudanças
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
        
    except Exception as e:
        print(f"❌ Erro ao processar {file_path}: {e}")
        return False

def main():
    """Atualizar todas as páginas HTML"""
    
    print("🔄 Atualizando referências de favicon em todas as páginas HTML...")
    
    # Encontrar todos os arquivos HTML
    html_files = []
    
    # Buscar em infra/frontend
    for root, dirs, files in os.walk('infra/frontend'):
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))
    
    # Também buscar arquivos HTML no raiz se existirem
    for file in glob.glob('*.html'):
        html_files.append(file)
    
    updated_count = 0
    total_count = len(html_files)
    
    print(f"📁 Encontrados {total_count} arquivos HTML")
    
    for html_file in html_files:
        if update_html_file(html_file):
            print(f"✅ Atualizado: {html_file}")
            updated_count += 1
        else:
            print(f"⚪ Sem alterações: {html_file}")
    
    print(f"\n🎉 Concluído!")
    print(f"📊 Arquivos processados: {total_count}")
    print(f"📊 Arquivos atualizados: {updated_count}")
    print(f"🎨 Novo theme-color: #173c72 (azul MARÍTIMO ANGOLA)")
    
    # Verificar se os favicons existem nos locais corretos
    print("\n🔍 Verificando arquivos de favicon...")
    favicon_files = [
        'favicon.ico',
        'favicon-32x32.png', 
        'favicon-16x16.png',
        'apple-touch-icon.png'
    ]
    
    locations = [
        '',  # raiz
        'infra/frontend/',  # frontend principal
        'infra/frontend/assets/img/'  # assets
    ]
    
    for location in locations:
        print(f"\n📁 Verificando {location or 'raiz'}:")
        for favicon_file in favicon_files:
            full_path = os.path.join(location, favicon_file)
            if os.path.exists(full_path):
                size = os.path.getsize(full_path)
                print(f"   ✅ {favicon_file} ({size} bytes)")
            else:
                print(f"   ❌ {favicon_file} (não encontrado)")

if __name__ == "__main__":
    main()
