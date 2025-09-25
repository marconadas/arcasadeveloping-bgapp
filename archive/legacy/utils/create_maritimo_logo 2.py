#!/usr/bin/env python3
"""
Script para criar o logo MARÍTIMO ANGOLA baseado na imagem fornecida
Cria um logo circular azul com texto branco e elementos gráficos
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

def create_maritimo_angola_logo(size=512):
    """Criar logo MARÍTIMO ANGOLA baseado na imagem fornecida"""
    
    # Cores baseadas na imagem original
    bg_color = (23, 60, 114)  # Azul escuro da NASA
    text_color = (255, 255, 255)  # Branco
    accent_color = (220, 53, 69)  # Vermelho para elementos de destaque
    
    # Criar imagem circular
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Desenhar círculo de fundo
    margin = 10
    circle_coords = [margin, margin, size - margin, size - margin]
    draw.ellipse(circle_coords, fill=bg_color)
    
    # Tentar carregar fonte, fallback para fonte padrão
    try:
        # Tamanho da fonte baseado no tamanho da imagem
        font_size_large = size // 12
        font_size_small = size // 16
        
        # Usar fonte padrão (pode ser melhorada com fontes específicas)
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Posições do texto
    center_x = size // 2
    center_y = size // 2
    
    # Desenhar texto "MARÍTIMO" na parte superior
    text1 = "MARÍTIMO"
    bbox1 = draw.textbbox((0, 0), text1, font=font_large)
    text1_width = bbox1[2] - bbox1[0]
    text1_height = bbox1[3] - bbox1[1]
    text1_x = center_x - text1_width // 2
    text1_y = center_y - size // 4
    
    draw.text((text1_x, text1_y), text1, fill=text_color, font=font_large)
    
    # Desenhar texto "ANGOLA" na parte inferior
    text2 = "ANGOLA"
    bbox2 = draw.textbbox((0, 0), text2, font=font_large)
    text2_width = bbox2[2] - bbox2[0]
    text2_height = bbox2[3] - bbox2[1]
    text2_x = center_x - text2_width // 2
    text2_y = center_y + size // 6
    
    draw.text((text2_x, text2_y), text2, fill=text_color, font=font_large)
    
    # Desenhar elemento central (representando a baleia/elemento marítimo)
    # Elipse central representando elemento marítimo
    whale_width = size // 3
    whale_height = size // 8
    whale_x1 = center_x - whale_width // 2
    whale_y1 = center_y - whale_height // 2
    whale_x2 = center_x + whale_width // 2
    whale_y2 = center_y + whale_height // 2
    
    draw.ellipse([whale_x1, whale_y1, whale_x2, whale_y2], fill=text_color)
    
    # Adicionar linha vermelha diagonal (elemento estilístico)
    line_start = (size // 6, size - size // 6)
    line_end = (size - size // 6, size // 6)
    draw.line([line_start, line_end], fill=accent_color, width=size // 50)
    
    # Adicionar pontos decorativos (estrelas/elementos espaciais)
    star_positions = [
        (size // 4, size // 4),
        (3 * size // 4, size // 4),
        (size // 4, 3 * size // 4),
        (3 * size // 4, 3 * size // 4),
        (size // 6, center_y),
        (5 * size // 6, center_y),
    ]
    
    for x, y in star_positions:
        star_size = size // 100
        draw.ellipse([x-star_size, y-star_size, x+star_size, y+star_size], fill=text_color)
    
    return img

def main():
    print("🎨 Criando logo MARÍTIMO ANGOLA...")
    
    try:
        # Criar logo principal
        logo = create_maritimo_angola_logo(512)
        logo.save('logo.png', format='PNG')
        print("✅ logo.png criado com sucesso!")
        
        # Também salvar nos diretórios necessários
        directories = [
            'infra/frontend/assets/img/',
            'infra/frontend/static/',
            'infra/frontend/minpermar/public/',
            'infra/frontend/minpermar/dist/'
        ]
        
        for directory in directories:
            if os.path.exists(directory):
                logo.save(os.path.join(directory, 'logo.png'), format='PNG')
                print(f"✅ Logo salvo em {directory}")
        
        print("\n🎯 Logo MARÍTIMO ANGOLA criado com:")
        print("   - Círculo azul escuro (estilo NASA)")
        print("   - Texto 'MARÍTIMO ANGOLA' em branco")
        print("   - Elemento central marítimo")
        print("   - Linha vermelha decorativa")
        print("   - Pontos decorativos (estrelas)")
        
    except ImportError:
        print("❌ PIL/Pillow não encontrado. Instalando...")
        os.system("pip install Pillow")
        print("🔄 Execute o script novamente após a instalação.")
    except Exception as e:
        print(f"❌ Erro ao criar logo: {e}")

if __name__ == "__main__":
    main()
