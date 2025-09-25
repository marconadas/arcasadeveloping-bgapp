#!/usr/bin/env python3
"""
Script para criar ícones PWA do BGAPP
Gera todos os tamanhos necessários a partir do logo real
"""

from PIL import Image
import os

def create_bgapp_icon(size):
    """Criar ícone BGAPP redimensionado a partir do logo original"""
    try:
        # Tentar carregar o logo original
        if os.path.exists('logo.png'):
            logo = Image.open('logo.png')
        elif os.path.exists('../../../../logo.png'):
            logo = Image.open('../../../../logo.png')
        else:
            raise FileNotFoundError("Logo não encontrado")
            
        # Converter para RGBA se necessário
        if logo.mode != 'RGBA':
            logo = logo.convert('RGBA')
        
        # Redimensionar mantendo a qualidade
        logo_resized = logo.resize((size, size), Image.Resampling.LANCZOS)
        
        return logo_resized
        
    except Exception as e:
        print(f"⚠️ Erro ao carregar logo original: {e}")
        print("🎨 Criando ícone genérico...")
        
        # Fallback: criar ícone genérico
        img = Image.new('RGBA', (size, size), (0, 102, 204, 255))
        
        # Adicionar círculo branco
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        margin = size // 8
        circle_size = size - (margin * 2)
        draw.ellipse([margin, margin, margin + circle_size, margin + circle_size], 
                     fill=(255, 255, 255, 255))
        
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
