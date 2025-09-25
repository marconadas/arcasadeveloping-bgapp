#!/usr/bin/env python3
"""
Script de Deploy BGAPP para arcasadeveloping.org/BGAPP
Configura deploy para subdiretório específico
"""

import os
import shutil
import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

class BGAPPSubdirDeployManager:
    def __init__(self):
        self.project_root = Path.cwd()
        self.frontend_dir = self.project_root / "infra" / "frontend"
        self.deploy_dir = self.project_root / "deploy_arcasadeveloping_BGAPP"
        self.domain = "arcasadeveloping.org"
        self.subdirectory = "BGAPP"
        self.full_url = f"https://{self.domain}/{self.subdirectory}"
        
    def log(self, message, level="INFO"):
        """Log com timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prefix = {
            "INFO": "✅",
            "WARN": "⚠️",
            "ERROR": "❌",
            "SUCCESS": "🎉"
        }.get(level, "ℹ️")
        print(f"{prefix} [{timestamp}] {message}")
    
    def verify_project_structure(self):
        """Verificar se a estrutura do projeto está correta"""
        self.log("Verificando estrutura do projeto...")
        
        required_files = [
            self.frontend_dir / "index.html",
            self.frontend_dir / "assets",
            self.frontend_dir / "manifest.json",
            self.frontend_dir / "favicon.ico"
        ]
        
        missing_files = []
        for file_path in required_files:
            if not file_path.exists():
                missing_files.append(str(file_path))
        
        if missing_files:
            self.log(f"Arquivos necessários não encontrados: {missing_files}", "ERROR")
            return False
            
        self.log("Estrutura do projeto verificada com sucesso")
        return True
    
    def create_deploy_directory(self):
        """Criar diretório de deploy limpo"""
        self.log("Criando diretório de deploy para subdiretório...")
        
        if self.deploy_dir.exists():
            shutil.rmtree(self.deploy_dir)
        
        self.deploy_dir.mkdir(parents=True, exist_ok=True)
        self.log(f"Diretório de deploy criado: {self.deploy_dir}")
    
    def copy_frontend_files(self):
        """Copiar todos os arquivos do frontend necessários"""
        self.log("Copiando arquivos do frontend...")
        
        # Copiar index.html como arquivo principal
        shutil.copy2(self.frontend_dir / "index.html", self.deploy_dir / "index.html")
        self.log("index.html copiado como página principal")
        
        # Copiar diretório assets completo
        if (self.frontend_dir / "assets").exists():
            shutil.copytree(
                self.frontend_dir / "assets",
                self.deploy_dir / "assets",
                dirs_exist_ok=True
            )
            self.log("Diretório assets copiado")
        
        # Copiar arquivos de configuração PWA
        pwa_files = [
            "manifest.json",
            "sw.js",
            "favicon.ico",
            "apple-touch-icon.png"
        ]
        
        for file_name in pwa_files:
            source = self.frontend_dir / file_name
            if source.exists():
                shutil.copy2(source, self.deploy_dir / file_name)
                self.log(f"Arquivo PWA copiado: {file_name}")
        
        # Copiar ícones
        for icon_file in self.frontend_dir.glob("*icon*.png"):
            shutil.copy2(icon_file, self.deploy_dir / icon_file.name)
        
        for favicon_file in self.frontend_dir.glob("favicon-*.png"):
            shutil.copy2(favicon_file, self.deploy_dir / favicon_file.name)
    
    def create_htaccess(self):
        """Criar arquivo .htaccess para configuração do subdiretório"""
        htaccess_content = f"""# BGAPP - Configuração para {self.domain}/{self.subdirectory}

# Página principal do subdiretório
DirectoryIndex index.html

# Configurações de segurança
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Configurar base path para o subdiretório
RewriteEngine On
RewriteBase /{self.subdirectory}/

# Redirecionar para index.html se acessar apenas o diretório
RewriteRule ^$ index.html [L]

# Configurações de cache
<IfModule mod_expires.c>
    ExpiresActive On
    
    # Cache para assets estáticos (1 ano)
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    
    # Cache curto para HTML (1 hora)
    ExpiresByType text/html "access plus 1 hour"
    
    # Cache para manifests e service workers (1 dia)
    ExpiresByType application/manifest+json "access plus 1 day"
    ExpiresByType application/x-web-app-manifest+json "access plus 1 day"
</IfModule>

# Compressão GZIP
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Configurações CORS para APIs externas
<IfModule mod_headers.c>
    # Permitir CORS para recursos necessários
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept"
</IfModule>

# Configurações para PWA no subdiretório
<Files "manifest.json">
    Header set Content-Type "application/manifest+json"
</Files>

<Files "sw.js">
    Header set Content-Type "application/javascript"
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</Files>

# Bloquear acesso a arquivos sensíveis
<FilesMatch "\\.(env|log|config)$">
    Order allow,deny
    Deny from all
</FilesMatch>
"""
        
        htaccess_path = self.deploy_dir / ".htaccess"
        with open(htaccess_path, 'w', encoding='utf-8') as f:
            f.write(htaccess_content)
        
        self.log("Arquivo .htaccess criado com configurações para subdiretório")
    
    def update_production_config(self):
        """Atualizar configurações para produção no subdiretório"""
        self.log("Atualizando configurações para produção...")
        
        index_path = self.deploy_dir / "index.html"
        
        # Ler o arquivo index.html
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Substituir localhost por URLs de produção
        content = content.replace(
            "location.hostname === 'localhost' ? 'http://localhost:5080' : '/api'",
            f"'https://{self.domain}/{self.subdirectory}/api'"
        )
        
        # Atualizar título para produção
        content = content.replace(
            "<title>BGAPP - Mapa Meteorológico Interativo</title>",
            f"<title>BGAPP - Mapa Meteorológico Interativo | {self.domain}/{self.subdirectory}</title>"
        )
        
        # Adicionar meta tag de domínio e path
        content = content.replace(
            '<meta name="author" content="BGAPP Development Team">',
            f'<meta name="author" content="BGAPP Development Team">\n  <meta name="domain" content="{self.domain}">\n  <meta name="base-path" content="/{self.subdirectory}/">'
        )
        
        # Atualizar PWA manifest para subdiretório
        content = content.replace(
            'href="/manifest.json"',
            f'href="/{self.subdirectory}/manifest.json"'
        )
        
        # Atualizar favicon paths
        content = content.replace(
            'href="/favicon.ico"',
            f'href="/{self.subdirectory}/favicon.ico"'
        )
        
        # Escrever arquivo atualizado
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        self.log("Configurações de produção aplicadas para subdiretório")
    
    def update_manifest_for_subdir(self):
        """Atualizar manifest.json para funcionar no subdiretório"""
        manifest_path = self.deploy_dir / "manifest.json"
        
        if manifest_path.exists():
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            
            # Atualizar URLs para o subdiretório
            manifest["start_url"] = f"/{self.subdirectory}/"
            manifest["scope"] = f"/{self.subdirectory}/"
            
            # Atualizar ícones paths
            if "icons" in manifest:
                for icon in manifest["icons"]:
                    if "src" in icon and not icon["src"].startswith("http"):
                        icon["src"] = f"/{self.subdirectory}/{icon['src'].lstrip('/')}"
            
            with open(manifest_path, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=2, ensure_ascii=False)
            
            self.log("Manifest.json atualizado para subdiretório")
    
    def update_service_worker(self):
        """Atualizar Service Worker para funcionar no subdiretório"""
        sw_path = self.deploy_dir / "sw.js"
        
        if sw_path.exists():
            with open(sw_path, 'r', encoding='utf-8') as f:
                sw_content = f.read()
            
            # Atualizar cache name para incluir subdiretório
            sw_content = sw_content.replace(
                'const CACHE_NAME = ',
                f'const CACHE_NAME = "bgapp-{self.subdirectory.lower()}-" + '
            )
            
            # Atualizar paths para incluir subdiretório
            sw_content = sw_content.replace(
                "'/assets/",
                f"'/{self.subdirectory}/assets/"
            )
            
            sw_content = sw_content.replace(
                "'/',",
                f"'/{self.subdirectory}/',"
            )
            
            with open(sw_path, 'w', encoding='utf-8') as f:
                f.write(sw_content)
            
            self.log("Service Worker atualizado para subdiretório")
    
    def create_deployment_info(self):
        """Criar arquivo com informações do deployment para subdiretório"""
        deploy_info = {
            "domain": self.domain,
            "subdirectory": self.subdirectory,
            "full_url": self.full_url,
            "deployed_at": datetime.now().isoformat(),
            "version": "1.0.0",
            "main_page": "index.html",
            "access_url": f"{self.full_url}/",
            "features": [
                "Mapa meteorológico interativo",
                "Dados oceanográficos em tempo real",
                "Visualização 3D",
                "PWA (Progressive Web App)",
                "Responsivo para mobile",
                "Configurado para subdiretório"
            ],
            "external_services": [
                "EOX Maps",
                "OpenStreetMap",
                "GEBCO Bathymetry",
                "CartoDB",
                "ESRI"
            ],
            "requirements": {
                "https": "Recomendado",
                "modern_browser": "Requerido",
                "javascript": "Requerido",
                "subdirectory_support": "Configurado"
            }
        }
        
        info_path = self.deploy_dir / "deployment_info.json"
        with open(info_path, 'w', encoding='utf-8') as f:
            json.dump(deploy_info, f, indent=2, ensure_ascii=False)
        
        self.log("Informações do deployment criadas")
    
    def create_upload_script(self):
        """Criar script para upload via FTP/SFTP para subdiretório"""
        upload_script = f"""#!/bin/bash
# Script para upload do BGAPP para {self.domain}/{self.subdirectory}

echo "🚀 Iniciando upload para {self.full_url}..."

# Configurações (ajuste conforme necessário)
DOMAIN="{self.domain}"
FTP_USER="seu_usuario_ftp"
FTP_PASS="sua_senha_ftp"
REMOTE_DIR="/public_html/{self.subdirectory}"  # Subdiretório específico
LOCAL_DIR="."

# Verificar se o diretório de deploy existe
if [ ! -f "index.html" ]; then
    echo "❌ Arquivos de deploy não encontrados!"
    echo "💡 Execute primeiro: python3 ../deploy_to_arcasadeveloping_subdir.py"
    exit 1
fi

echo "📁 Preparando arquivos para upload no subdiretório {self.subdirectory}..."

# Criar diretório remoto se não existir
echo "📂 Criando diretório remoto {self.subdirectory}..."

# Opção 1: Upload via SFTP (recomendado)
echo "🔐 Usando SFTP para upload seguro..."
sftp $FTP_USER@$DOMAIN << EOF
mkdir $REMOTE_DIR
cd $REMOTE_DIR
put -r *
bye
EOF

# Opção 2: Upload via FTP (descomente se necessário)
# echo "📤 Usando FTP para upload..."
# ftp -n $DOMAIN << EOF
# user $FTP_USER $FTP_PASS
# mkdir {self.subdirectory}
# cd {self.subdirectory}
# binary
# prompt off
# mput *
# mput -r assets
# quit
# EOF

echo "✅ Upload concluído!"
echo "🌐 Verifique em: {self.full_url}"
echo ""
echo "📋 Próximos passos:"
echo "1. Acesse {self.full_url} para verificar o site"
echo "2. Teste todas as funcionalidades"
echo "3. Verifique se index.html é carregado automaticamente"
echo "4. Configure SSL/HTTPS se ainda não estiver ativo"
echo "5. Teste PWA (instalação como app)"
"""
        
        script_path = self.deploy_dir / "upload_to_server.sh"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(upload_script)
        
        # Tornar executável
        os.chmod(script_path, 0o755)
        self.log("Script de upload criado: upload_to_server.sh")
    
    def create_cloudflare_config(self):
        """Criar configurações específicas para Cloudflare Pages com subdiretório"""
        
        # Criar arquivo _redirects para Cloudflare Pages
        redirects_content = f"""# Redirects para BGAPP subdiretório
/{self.subdirectory}  /{self.subdirectory}/index.html  200
/{self.subdirectory}/*  /{self.subdirectory}/:splat  200

# Headers de segurança
/{self.subdirectory}/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
"""
        
        redirects_path = self.deploy_dir / "_redirects"
        with open(redirects_path, 'w', encoding='utf-8') as f:
            f.write(redirects_content)
        
        # Criar arquivo _headers para Cloudflare Pages
        headers_content = f"""/{self.subdirectory}/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

/{self.subdirectory}/assets/*
  Cache-Control: public, max-age=31536000

/{self.subdirectory}/*.html
  Cache-Control: public, max-age=3600
"""
        
        headers_path = self.deploy_dir / "_headers"
        with open(headers_path, 'w', encoding='utf-8') as f:
            f.write(headers_content)
        
        self.log("Configurações Cloudflare Pages criadas")
    
    def create_readme(self):
        """Criar README para o deployment do subdiretório"""
        readme_content = f"""# BGAPP - Deploy para {self.domain}/{self.subdirectory}

## 🌊 Sobre o BGAPP

O BGAPP é um sistema avançado de monitoramento oceanográfico e meteorológico marinho de Angola, oferecendo visualização interativa de dados em tempo real.

## 🚀 Deployment

**Domínio:** {self.domain}  
**Subdiretório:** {self.subdirectory}  
**URL Completa:** {self.full_url}  
**Página Principal:** index.html  
**Deployed em:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## 📋 Arquivos Principais

- `index.html` - Página principal da aplicação
- `assets/` - Recursos estáticos (CSS, JS, imagens)
- `manifest.json` - Configuração PWA (atualizada para subdiretório)
- `sw.js` - Service Worker (atualizado para subdiretório)
- `.htaccess` - Configurações do servidor para subdiretório
- `_redirects` - Configurações Cloudflare Pages
- `_headers` - Headers Cloudflare Pages

## 🎯 Funcionalidades

- ✅ Mapa meteorológico interativo
- ✅ Dados oceanográficos em tempo real (SST, Salinidade, Clorofila)
- ✅ Campos vetoriais (Correntes, Vento)
- ✅ Visualização 3D (em desenvolvimento)
- ✅ PWA com suporte offline (configurado para subdiretório)
- ✅ Interface responsiva para mobile
- ✅ Sistema de cache inteligente
- ✅ Notificações e feedback visual

## 🌐 Configuração de Subdiretório

Este deployment está especificamente configurado para funcionar em:
- **URL:** `{self.full_url}`
- **Base Path:** `/{self.subdirectory}/`
- **Assets Path:** `/{self.subdirectory}/assets/`
- **PWA Scope:** `/{self.subdirectory}/`

## 🔧 Requisitos Técnicos

- ✅ Servidor web com suporte a subdiretórios
- ✅ HTTPS recomendado para PWA
- ✅ Navegador moderno com suporte a ES6+
- ✅ JavaScript habilitado
- ✅ Conexão à internet para serviços externos

## 📱 Compatibilidade

- **Desktop:** Chrome, Firefox, Safari, Edge (versões recentes)
- **Mobile:** iOS Safari, Android Chrome
- **Tablet:** Suporte completo
- **PWA:** Instalável em todos os dispositivos compatíveis

## 🚀 Como Usar

1. Acesse {self.full_url}
2. O sistema carregará automaticamente a página index.html
3. Aguarde a inicialização dos mapas
4. Use os controles do painel lateral para:
   - Filtrar dados por data
   - Ativar/desativar camadas
   - Iniciar animações temporais
   - Limpar visualizações

## 🔧 Configuração Cloudflare Pages

Para deploy via Cloudflare Pages:

1. **Build Settings:**
   ```
   Build command: (vazio)
   Build output directory: /
   Root directory: /
   ```

2. **Environment Variables:**
   ```
   NODE_ENV=production
   DOMAIN={self.domain}
   SUBDIRECTORY={self.subdirectory}
   ```

3. **Custom Domain:**
   - Configure `{self.domain}` como domínio personalizado
   - O subdiretório será automaticamente servido

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Email: majearcasa@gmail.com
- Organização: ARCASA DEVELOPING
- URL: {self.full_url}

## 📄 Licença

© 2025 ARCASA DEVELOPING - Todos os direitos reservados
"""
        
        readme_path = self.deploy_dir / "README.md"
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        self.log("README.md criado")
    
    def verify_deployment(self):
        """Verificar se o deployment está correto"""
        self.log("Verificando deployment para subdiretório...")
        
        # Verificar arquivos essenciais
        essential_files = [
            "index.html",
            "assets/css/map-styles.css",
            "assets/js/eox-layers.js",
            "manifest.json",
            ".htaccess",
            "_redirects",
            "_headers"
        ]
        
        missing = []
        for file_path in essential_files:
            if not (self.deploy_dir / file_path).exists():
                missing.append(file_path)
        
        if missing:
            self.log(f"Arquivos essenciais não encontrados: {missing}", "ERROR")
            return False
        
        # Verificar se index.html tem conteúdo
        index_path = self.deploy_dir / "index.html"
        if index_path.stat().st_size < 1000:
            self.log("index.html parece estar vazio ou corrompido", "ERROR")
            return False
        
        # Verificar se manifest.json foi atualizado
        manifest_path = self.deploy_dir / "manifest.json"
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
            
        if not manifest.get("start_url", "").startswith(f"/{self.subdirectory}"):
            self.log("Manifest.json não foi atualizado corretamente", "ERROR")
            return False
        
        self.log("Deployment verificado com sucesso", "SUCCESS")
        return True
    
    def run_deployment(self):
        """Executar todo o processo de deployment"""
        self.log(f"🚀 Iniciando deployment para {self.full_url}", "SUCCESS")
        
        try:
            # Etapas do deployment
            if not self.verify_project_structure():
                return False
            
            self.create_deploy_directory()
            self.copy_frontend_files()
            self.create_htaccess()
            self.update_production_config()
            self.update_manifest_for_subdir()
            self.update_service_worker()
            self.create_cloudflare_config()
            self.create_deployment_info()
            self.create_readme()
            self.create_upload_script()
            
            if not self.verify_deployment():
                return False
            
            self.log("🎉 DEPLOYMENT PARA SUBDIRETÓRIO CONCLUÍDO COM SUCESSO!", "SUCCESS")
            self.log(f"📁 Arquivos prontos em: {self.deploy_dir}")
            self.log(f"🌐 Para upload: execute ./upload_to_server.sh")
            self.log(f"🔗 Site será acessível em: {self.full_url}")
            
            return True
            
        except Exception as e:
            self.log(f"Erro durante o deployment: {str(e)}", "ERROR")
            return False

def main():
    """Função principal"""
    print("🌊 BGAPP - Deploy Manager para arcasadeveloping.org/BGAPP")
    print("=" * 65)
    
    deploy_manager = BGAPPSubdirDeployManager()
    
    if deploy_manager.run_deployment():
        print("\n🎉 Deployment preparado com sucesso!")
        print(f"\n📋 Próximos passos:")
        print(f"1. Revise os arquivos no diretório 'deploy_arcasadeveloping_BGAPP'")
        print(f"2. Configure suas credenciais FTP/SFTP no script upload_to_server.sh")
        print(f"3. Execute o upload: ./deploy_arcasadeveloping_BGAPP/upload_to_server.sh")
        print(f"4. Acesse https://arcasadeveloping.org/BGAPP para verificar")
        print(f"\n🔗 URL final: https://arcasadeveloping.org/BGAPP")
        return 0
    else:
        print("\n❌ Falha no deployment. Verifique os logs acima.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
