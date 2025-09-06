#!/usr/bin/env python3
"""
Script de Deploy BGAPP para arcasadeveloping.org
Configura deploy completo com index.html como página principal
"""

import os
import shutil
import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

class BGAPPDeployManager:
    def __init__(self):
        self.project_root = Path.cwd()
        self.frontend_dir = self.project_root / "infra" / "frontend"
        self.deploy_dir = self.project_root / "deploy_arcasadeveloping"
        self.domain = "arcasadeveloping.org"
        
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
        self.log("Criando diretório de deploy...")
        
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
        """Criar arquivo .htaccess para configuração do servidor"""
        htaccess_content = """# BGAPP - Configuração para arcasadeveloping.org

# Página principal
DirectoryIndex index.html

# Configurações de segurança
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

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

# Redirecionamento para HTTPS (recomendado)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Configurações para PWA
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
        
        self.log("Arquivo .htaccess criado com configurações de produção")
    
    def update_production_config(self):
        """Atualizar configurações para produção"""
        self.log("Atualizando configurações para produção...")
        
        index_path = self.deploy_dir / "index.html"
        
        # Ler o arquivo index.html
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Substituir localhost por URLs de produção
        content = content.replace(
            "location.hostname === 'localhost' ? 'http://localhost:5080' : '/api'",
            f"'https://{self.domain}/api'"
        )
        
        # Atualizar título para produção
        content = content.replace(
            "<title>BGAPP - Mapa Meteorológico Interativo</title>",
            f"<title>BGAPP - Mapa Meteorológico Interativo | {self.domain}</title>"
        )
        
        # Adicionar meta tag de domínio
        content = content.replace(
            '<meta name="author" content="BGAPP Development Team">',
            f'<meta name="author" content="BGAPP Development Team">\n  <meta name="domain" content="{self.domain}">'
        )
        
        # Escrever arquivo atualizado
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        self.log("Configurações de produção aplicadas")
    
    def create_deployment_info(self):
        """Criar arquivo com informações do deployment"""
        deploy_info = {
            "domain": self.domain,
            "deployed_at": datetime.now().isoformat(),
            "version": "1.0.0",
            "main_page": "index.html",
            "features": [
                "Mapa meteorológico interativo",
                "Dados oceanográficos em tempo real",
                "Visualização 3D",
                "PWA (Progressive Web App)",
                "Responsivo para mobile"
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
                "javascript": "Requerido"
            }
        }
        
        info_path = self.deploy_dir / "deployment_info.json"
        with open(info_path, 'w', encoding='utf-8') as f:
            json.dump(deploy_info, f, indent=2, ensure_ascii=False)
        
        self.log("Informações do deployment criadas")
    
    def create_readme(self):
        """Criar README para o deployment"""
        readme_content = f"""# BGAPP - Deploy para {self.domain}

## 🌊 Sobre o BGAPP

O BGAPP é um sistema avançado de monitoramento oceanográfico e meteorológico marinho de Angola, oferecendo visualização interativa de dados em tempo real.

## 🚀 Deployment

**Domínio:** {self.domain}  
**Página Principal:** index.html  
**Deployed em:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## 📋 Arquivos Principais

- `index.html` - Página principal da aplicação
- `assets/` - Recursos estáticos (CSS, JS, imagens)
- `manifest.json` - Configuração PWA
- `sw.js` - Service Worker
- `.htaccess` - Configurações do servidor

## 🎯 Funcionalidades

- ✅ Mapa meteorológico interativo
- ✅ Dados oceanográficos em tempo real (SST, Salinidade, Clorofila)
- ✅ Campos vetoriais (Correntes, Vento)
- ✅ Visualização 3D (em desenvolvimento)
- ✅ PWA com suporte offline
- ✅ Interface responsiva para mobile
- ✅ Sistema de cache inteligente
- ✅ Notificações e feedback visual

## 🌐 Serviços Externos Integrados

- **EOX Maps** - Camadas de terreno e batimetria
- **OpenStreetMap** - Mapas base
- **GEBCO** - Dados batimétricos
- **CartoDB** - Camadas temáticas
- **ESRI** - Imagens de satélite

## 🔧 Requisitos Técnicos

- ✅ Servidor web com suporte a HTTPS (recomendado)
- ✅ Navegador moderno com suporte a ES6+
- ✅ JavaScript habilitado
- ✅ Conexão à internet para serviços externos

## 📱 Compatibilidade

- **Desktop:** Chrome, Firefox, Safari, Edge (versões recentes)
- **Mobile:** iOS Safari, Android Chrome
- **Tablet:** Suporte completo

## 🔒 Segurança

- Content Security Policy (CSP) configurada
- Headers de segurança aplicados
- Redirecionamento automático para HTTPS
- Proteção contra XSS e clickjacking

## 🚀 Como Usar

1. Acesse https://{self.domain}
2. O sistema carregará automaticamente a página index.html
3. Aguarde a inicialização dos mapas
4. Use os controles do painel lateral para:
   - Filtrar dados por data
   - Ativar/desativar camadas
   - Iniciar animações temporais
   - Limpar visualizações

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Email: majearcasa@gmail.com
- Organização: ARCASA DEVELOPING

## 📄 Licença

© 2025 ARCASA DEVELOPING - Todos os direitos reservados
"""
        
        readme_path = self.deploy_dir / "README.md"
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        self.log("README.md criado")
    
    def create_upload_script(self):
        """Criar script para upload via FTP/SFTP"""
        upload_script = f"""#!/bin/bash
# Script para upload do BGAPP para {self.domain}

echo "🚀 Iniciando upload para {self.domain}..."

# Configurações (ajuste conforme necessário)
DOMAIN="{self.domain}"
FTP_USER="seu_usuario_ftp"
FTP_PASS="sua_senha_ftp"
REMOTE_DIR="/public_html"  # ou /www, /htdocs, etc.

# Verificar se o diretório de deploy existe
if [ ! -d "deploy_arcasadeveloping" ]; then
    echo "❌ Diretório deploy_arcasadeveloping não encontrado!"
    echo "💡 Execute primeiro: python3 deploy_to_arcasadeveloping.py"
    exit 1
fi

echo "📁 Preparando arquivos para upload..."
cd deploy_arcasadeveloping

# Opção 1: Upload via SFTP (recomendado)
echo "🔐 Usando SFTP para upload seguro..."
sftp $FTP_USER@$DOMAIN << EOF
cd $REMOTE_DIR
put -r *
bye
EOF

# Opção 2: Upload via FTP (descomente se necessário)
# echo "📤 Usando FTP para upload..."
# ftp -n $DOMAIN << EOF
# user $FTP_USER $FTP_PASS
# cd $REMOTE_DIR
# binary
# prompt off
# mput *
# mput -r assets
# quit
# EOF

echo "✅ Upload concluído!"
echo "🌐 Verifique em: https://$DOMAIN"
echo ""
echo "📋 Próximos passos:"
echo "1. Acesse https://$DOMAIN para verificar o site"
echo "2. Teste todas as funcionalidades"
echo "3. Verifique se index.html é carregado automaticamente"
echo "4. Configure SSL/HTTPS se ainda não estiver ativo"
"""
        
        script_path = self.deploy_dir / "upload_to_server.sh"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(upload_script)
        
        # Tornar executável
        os.chmod(script_path, 0o755)
        self.log("Script de upload criado: upload_to_server.sh")
    
    def verify_deployment(self):
        """Verificar se o deployment está correto"""
        self.log("Verificando deployment...")
        
        # Verificar arquivos essenciais
        essential_files = [
            "index.html",
            "assets/css/map-styles.css",
            "assets/js/eox-layers.js",
            "manifest.json",
            ".htaccess"
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
        
        self.log("Deployment verificado com sucesso", "SUCCESS")
        return True
    
    def run_deployment(self):
        """Executar todo o processo de deployment"""
        self.log("🚀 Iniciando deployment para arcasadeveloping.org", "SUCCESS")
        
        try:
            # Etapas do deployment
            if not self.verify_project_structure():
                return False
            
            self.create_deploy_directory()
            self.copy_frontend_files()
            self.create_htaccess()
            self.update_production_config()
            self.create_deployment_info()
            self.create_readme()
            self.create_upload_script()
            
            if not self.verify_deployment():
                return False
            
            self.log("🎉 DEPLOYMENT CONCLUÍDO COM SUCESSO!", "SUCCESS")
            self.log(f"📁 Arquivos prontos em: {self.deploy_dir}")
            self.log(f"🌐 Para upload: execute ./upload_to_server.sh")
            self.log(f"🔗 Site será acessível em: https://{self.domain}")
            
            return True
            
        except Exception as e:
            self.log(f"Erro durante o deployment: {str(e)}", "ERROR")
            return False

def main():
    """Função principal"""
    print("🌊 BGAPP - Deploy Manager para arcasadeveloping.org")
    print("=" * 60)
    
    deploy_manager = BGAPPDeployManager()
    
    if deploy_manager.run_deployment():
        print("\n🎉 Deployment preparado com sucesso!")
        print("\n📋 Próximos passos:")
        print("1. Revise os arquivos no diretório 'deploy_arcasadeveloping'")
        print("2. Configure suas credenciais FTP/SFTP no script upload_to_server.sh")
        print("3. Execute o upload: ./deploy_arcasadeveloping/upload_to_server.sh")
        print("4. Acesse https://arcasadeveloping.org para verificar")
        return 0
    else:
        print("\n❌ Falha no deployment. Verifique os logs acima.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
