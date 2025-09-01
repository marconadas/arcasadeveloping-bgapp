#!/usr/bin/env python3
"""
Script para criar ícones PWA do BGAPP
Gera todos os tamanhos necessários a partir de um ícone base
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_bgapp_icon(size):
    """Criar ícone BGAPP com tamanho específico"""
    # Criar imagem com fundo azul BGAPP
    img = Image.new('RGBA', (size, size), (0, 102, 204, 255))
    draw = ImageDraw.Draw(img)
    
    # Adicionar círculo branco no centro
    margin = size // 8
    circle_size = size - (margin * 2)
    draw.ellipse([margin, margin, margin + circle_size, margin + circle_size], 
                 fill=(255, 255, 255, 255))
    
    # Adicionar texto "BG" no centro
    try:
        font_size = size // 3
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "BG"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    draw.text((x, y), text, fill=(0, 102, 204, 255), font=font)
    
    return img

def create_favicon():
    """Criar favicon.ico"""
    icon = create_bgapp_icon(32)
    icon.save('favicon.ico', format='ICO', sizes=[(32, 32)])
    print("✅ favicon.ico criado")

def create_pwa_icons():
    """Criar todos os ícones PWA necessários"""
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    for size in sizes:
        icon = create_bgapp_icon(size)
        filename = f'icon-{size}.png'
        icon.save(filename, format='PNG')
        print(f"✅ {filename} criado")

def create_apple_touch_icon():
    """Criar apple-touch-icon"""
    icon = create_bgapp_icon(180)
    icon.save('apple-touch-icon.png', format='PNG')
    print("✅ apple-touch-icon.png criado")

def create_favicon_variants():
    """Criar variantes do favicon"""
    # favicon-32x32.png
    icon32 = create_bgapp_icon(32)
    icon32.save('favicon-32x32.png', format='PNG')
    print("✅ favicon-32x32.png criado")
    
    # favicon-16x16.png
    icon16 = create_bgapp_icon(16)
    icon16.save('favicon-16x16.png', format='PNG')
    print("✅ favicon-16x16.png criado")

if __name__ == "__main__":
    print("🎨 Criando ícones PWA para BGAPP...")
    
    try:
        create_favicon()
        create_pwa_icons()
        create_apple_touch_icon()
        create_favicon_variants()
        
        print("\n🎉 Todos os ícones foram criados com sucesso!")
        print("📁 Arquivos criados:")
        for file in os.listdir('.'):
            if file.endswith(('.ico', '.png')) and ('icon' in file or 'favicon' in file or 'apple' in file):
                print(f"   - {file}")
                
    except ImportError:
        print("❌ PIL/Pillow não encontrado. Instalando...")
        os.system("pip install Pillow")
        print("🔄 Execute o script novamente após a instalação.")
    except Exception as e:
        print(f"❌ Erro: {e}")
