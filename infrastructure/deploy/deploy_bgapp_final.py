#!/usr/bin/env python3
"""
🚀 BGAPP Deploy Final para arcasadeveloping.org/BGAPP
Versão: 2.0.0
Data: 2025-01-16

Este script realiza o deploy completo da aplicação BGAPP para:
https://arcasadeveloping.org/BGAPP

Suporta múltiplos métodos de deploy:
1. Cloudflare Pages (recomendado)
2. FTP/SFTP tradicional
3. GitHub Pages
4. Netlify
"""

import os
import sys
import shutil
import subprocess
import json
from pathlib import Path
from datetime import datetime

class BGAPPFinalDeploy:
    def __init__(self):
        self.project_root = Path.cwd()
        self.source_dir = self.project_root / "infra" / "frontend"
        self.deploy_dir = self.project_root / "deploy_arcasadeveloping_BGAPP"
        self.domain = "arcasadeveloping.org"
        self.subdirectory = "BGAPP"
        self.full_url = f"https://{self.domain}/{self.subdirectory}"
        
        # Configurações de deploy
        self.deploy_methods = {
            "cloudflare": "Cloudflare Pages (Recomendado)",
            "ftp": "FTP/SFTP Tradicional",
            "github": "GitHub Pages",
            "netlify": "Netlify"
        }

    def log(self, message, level="INFO"):
        """Log com cores"""
        colors = {
            "INFO": "\033[94m",     # Azul
            "SUCCESS": "\033[92m",  # Verde
            "WARNING": "\033[93m",  # Amarelo
            "ERROR": "\033[91m",    # Vermelho
            "RESET": "\033[0m"      # Reset
        }
        
        timestamp = datetime.now().strftime("%H:%M:%S")
        color = colors.get(level, colors["INFO"])
        reset = colors["RESET"]
        print(f"{color}[{timestamp}] {message}{reset}")

    def check_requirements(self):
        """Verificar se todos os requisitos estão atendidos"""
        self.log("🔍 Verificando requisitos do sistema...", "INFO")
        
        requirements = {
            "index.html": self.source_dir / "index.html",
            "assets": self.source_dir / "assets",
            "deploy_dir": self.deploy_dir
        }
        
        missing = []
        for name, path in requirements.items():
            if not path.exists():
                missing.append(f"{name}: {path}")
                
        if missing:
            self.log("❌ Requisitos não atendidos:", "ERROR")
            for item in missing:
                self.log(f"  - {item}", "ERROR")
            return False
            
        self.log("✅ Todos os requisitos atendidos", "SUCCESS")
        return True

    def prepare_files(self):
        """Preparar arquivos para deploy"""
        self.log("📁 Preparando arquivos para deploy...", "INFO")
        
        if self.deploy_dir.exists():
            self.log("🧹 Limpando diretório de deploy anterior...", "WARNING")
            shutil.rmtree(self.deploy_dir)
        
        # Criar diretório de deploy
        self.deploy_dir.mkdir(parents=True, exist_ok=True)
        
        # Copiar index.html
        if (self.source_dir / "index.html").exists():
            shutil.copy2(self.source_dir / "index.html", self.deploy_dir / "index.html")
            self.log("✅ index.html copiado", "SUCCESS")
        
        # Copiar assets
        if (self.source_dir / "assets").exists():
            shutil.copytree(self.source_dir / "assets", self.deploy_dir / "assets", dirs_exist_ok=True)
            self.log("✅ Assets copiados", "SUCCESS")
        
        # Copiar arquivos estáticos
        static_files = ["favicon.ico", "manifest.json", "sw.js"]
        for file in static_files:
            source_path = self.source_dir / file
            if source_path.exists():
                shutil.copy2(source_path, self.deploy_dir / file)
                self.log(f"✅ {file} copiado", "SUCCESS")
        
        self.log("📁 Arquivos preparados com sucesso!", "SUCCESS")

    def update_paths_for_subdirectory(self):
        """Atualizar caminhos para funcionar em subdiretório /BGAPP/"""
        self.log("🔧 Atualizando caminhos para subdiretório...", "INFO")
        
        index_path = self.deploy_dir / "index.html"
        if not index_path.exists():
            self.log("❌ index.html não encontrado", "ERROR")
            return False
        
        # Ler conteúdo
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Atualizações de caminho
        updates = [
            ('href="/manifest.json"', 'href="/BGAPP/manifest.json"'),
            ('href="/favicon.ico"', 'href="/BGAPP/favicon.ico"'),
            ('src="/static/logo.png"', 'src="/BGAPP/assets/img/icon-192.png"'),
            ('href="assets/', 'href="/BGAPP/assets/'),
            ('src="assets/', 'src="/BGAPP/assets/'),
            ("'/sw.js'", "'/BGAPP/sw.js'"),
            ('const apiBase = location.hostname === \'localhost\' ? \'http://localhost:5080\' : \'/api\';',
             'const apiBase = location.hostname === \'localhost\' ? \'http://localhost:5080\' : \'/BGAPP/api\';')
        ]
        
        for old, new in updates:
            if old in content:
                content = content.replace(old, new)
                self.log(f"✅ Atualizado: {old[:50]}...", "SUCCESS")
        
        # Salvar arquivo atualizado
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        self.log("🔧 Caminhos atualizados para subdiretório", "SUCCESS")
        return True

    def create_deployment_configs(self):
        """Criar arquivos de configuração para deploy"""
        self.log("⚙️ Criando configurações de deploy...", "INFO")
        
        # .htaccess para Apache
        htaccess_content = """# BGAPP - Configurações Apache
RewriteEngine On

# Forçar HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Definir index.html como página padrão
DirectoryIndex index.html

# Headers de segurança
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache para assets estáticos
<FilesMatch "\\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, immutable"
</FilesMatch>

# Cache para HTML
<FilesMatch "\\.(html|htm)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 hour"
    Header set Cache-Control "public, must-revalidate"
</FilesMatch>

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
</IfModule>
"""
        
        with open(self.deploy_dir / ".htaccess", 'w', encoding='utf-8') as f:
            f.write(htaccess_content)
        
        # _redirects para Netlify/Cloudflare
        redirects_content = """# BGAPP - Redirects
/BGAPP /BGAPP/index.html 200
/BGAPP/ /BGAPP/index.html 200
/BGAPP/* /BGAPP/:splat 200

# Headers de segurança
/BGAPP/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
"""
        
        with open(self.deploy_dir / "_redirects", 'w', encoding='utf-8') as f:
            f.write(redirects_content)
        
        # netlify.toml
        netlify_config = """[build]
  publish = "."

[[redirects]]
  from = "/BGAPP"
  to = "/BGAPP/index.html"
  status = 200

[[redirects]]
  from = "/BGAPP/*"
  to = "/BGAPP/:splat"
  status = 200

[[headers]]
  for = "/BGAPP/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
"""
        
        with open(self.deploy_dir / "netlify.toml", 'w', encoding='utf-8') as f:
            f.write(netlify_config)
        
        self.log("⚙️ Configurações criadas: .htaccess, _redirects, netlify.toml", "SUCCESS")

    def create_upload_scripts(self):
        """Criar scripts de upload para diferentes métodos"""
        self.log("📜 Criando scripts de upload...", "INFO")
        
        # Script FTP/SFTP
        ftp_script = f"""#!/bin/bash
# BGAPP Deploy via FTP/SFTP para {self.full_url}

echo "🚀 Iniciando deploy para {self.full_url}..."

# Configurações (AJUSTE AS CREDENCIAIS ABAIXO)
DOMAIN="{self.domain}"
FTP_USER="seu_usuario_ftp"
FTP_PASS="sua_senha_ftp"
REMOTE_DIR="/public_html/{self.subdirectory}"

# Verificar arquivos
if [ ! -f "index.html" ]; then
    echo "❌ Arquivos não encontrados! Execute primeiro: python3 ../deploy_bgapp_final.py"
    exit 1
fi

echo "📁 Fazendo upload dos arquivos..."

# Upload via SFTP (mais seguro)
sftp $FTP_USER@$DOMAIN << EOF
mkdir $REMOTE_DIR
cd $REMOTE_DIR
put -r *
bye
EOF

echo "✅ Deploy concluído!"
echo "🌐 Acesse: {self.full_url}"
"""
        
        with open(self.deploy_dir / "upload_ftp.sh", 'w', encoding='utf-8') as f:
            f.write(ftp_script)
        os.chmod(self.deploy_dir / "upload_ftp.sh", 0o755)
        
        # Script GitHub Pages
        github_script = f"""#!/bin/bash
# BGAPP Deploy via GitHub Pages

echo "🚀 Preparando deploy para GitHub Pages..."

# Inicializar repositório Git se não existir
if [ ! -d ".git" ]; then
    git init
    git branch -M main
fi

# Adicionar todos os arquivos
git add .
git commit -m "Deploy BGAPP $(date '+%Y-%m-%d %H:%M:%S')"

# Configurar remote (AJUSTE A URL DO SEU REPOSITÓRIO)
echo "⚠️  Configure o remote do seu repositório GitHub:"
echo "git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git"
echo "git push -u origin main"

# Depois ative GitHub Pages nas configurações do repositório
echo "📋 Próximos passos:"
echo "1. Configure o remote do repositório"
echo "2. Faça push: git push -u origin main"
echo "3. Ative GitHub Pages nas configurações do repo"
echo "4. Configure custom domain: {self.domain}"
"""
        
        with open(self.deploy_dir / "deploy_github.sh", 'w', encoding='utf-8') as f:
            f.write(github_script)
        os.chmod(self.deploy_dir / "deploy_github.sh", 0o755)
        
        self.log("📜 Scripts criados: upload_ftp.sh, deploy_github.sh", "SUCCESS")

    def create_readme(self):
        """Criar README com instruções completas"""
        readme_content = f"""# 🚀 BGAPP Deploy para {self.full_url}

## 📋 Status
- ✅ **Arquivos preparados:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- ✅ **URL de destino:** {self.full_url}
- ✅ **Configurações:** Múltiplos métodos de deploy

## 🎯 Métodos de Deploy Disponíveis

### 1. 🌐 Cloudflare Pages (RECOMENDADO)

**Vantagens:**
- ✅ Deploy automático via Git
- ✅ SSL gratuito
- ✅ CDN global
- ✅ Rollback fácil

**Passos:**
1. Criar repositório Git:
```bash
git init
git add .
git commit -m "BGAPP deploy"
git remote add origin https://github.com/seu-usuario/bgapp.git
git push -u origin main
```

2. Configurar Cloudflare Pages:
   - Acesse: https://dash.cloudflare.com
   - Workers & Pages → Create → Pages
   - Conecte seu repositório
   - Build settings: deixar vazio
   - Deploy!

3. Configurar domínio customizado:
   - Custom domains → Add domain
   - Digite: `{self.domain}`
   - Siga instruções DNS

### 2. 📤 FTP/SFTP Tradicional

**Requisitos:**
- Credenciais FTP/SFTP do servidor
- Acesso ao diretório `/public_html/`

**Passos:**
1. Editar credenciais em `upload_ftp.sh`:
```bash
FTP_USER="seu_usuario_aqui"
FTP_PASS="sua_senha_aqui"
```

2. Executar upload:
```bash
./upload_ftp.sh
```

### 3. 🐙 GitHub Pages

**Passos:**
1. Executar script:
```bash
./deploy_github.sh
```

2. Seguir instruções exibidas

### 4. 🌊 Netlify

**Passos:**
1. Arrastar pasta para https://app.netlify.com/drop
2. Ou conectar repositório Git
3. Configurar domínio customizado

## 🔧 Arquivos Incluídos

- `index.html` - Página principal otimizada
- `assets/` - CSS, JS, imagens
- `.htaccess` - Configurações Apache
- `_redirects` - Configurações Netlify/Cloudflare
- `netlify.toml` - Configurações Netlify
- `manifest.json` - PWA
- `sw.js` - Service Worker

## ✅ Verificação Pós-Deploy

Após o deploy, verifique:

1. **Acesso básico:**
   - Abra: {self.full_url}
   - Deve carregar a página do BGAPP

2. **Funcionalidades:**
   - ✅ Painel lateral funcionando
   - ✅ Botões de camadas responsivos
   - ✅ Mapa carregando
   - ✅ PWA instalável

3. **Mobile:**
   - ✅ Design responsivo
   - ✅ Gestos de toque
   - ✅ Performance adequada

## 🛠️ Troubleshooting

### Problema: Página não carrega
**Solução:** Verificar se index.html está no diretório correto

### Problema: Assets não carregam
**Solução:** Verificar caminhos em index.html (devem começar com `/BGAPP/`)

### Problema: SSL não funciona
**Solução:** Configurar certificado SSL no painel do hosting

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do servidor
2. Testar em modo incógnito
3. Verificar console do navegador
4. Consultar documentação do provider

---
**Deploy gerado em:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Versão BGAPP:** 2.0.0
"""
        
        with open(self.deploy_dir / "README.md", 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        self.log("📝 README.md criado com instruções completas", "SUCCESS")

    def create_deployment_info(self):
        """Criar arquivo com informações técnicas do deploy"""
        info = {
            "project": "BGAPP",
            "version": "2.0.0",
            "deploy_date": datetime.now().isoformat(),
            "target_url": self.full_url,
            "domain": self.domain,
            "subdirectory": self.subdirectory,
            "files_included": [],
            "deploy_methods": self.deploy_methods,
            "requirements": {
                "ssl": True,
                "https_redirect": True,
                "gzip_compression": True,
                "cache_headers": True
            }
        }
        
        # Listar arquivos incluídos
        for item in self.deploy_dir.rglob('*'):
            if item.is_file():
                relative_path = item.relative_to(self.deploy_dir)
                info["files_included"].append(str(relative_path))
        
        with open(self.deploy_dir / "deployment_info.json", 'w', encoding='utf-8') as f:
            json.dump(info, f, indent=2, ensure_ascii=False)
        
        self.log("📊 Informações de deploy salvas em deployment_info.json", "SUCCESS")

    def show_deploy_summary(self):
        """Mostrar resumo do deploy"""
        self.log("=" * 60, "INFO")
        self.log("🎉 DEPLOY BGAPP PREPARADO COM SUCESSO!", "SUCCESS")
        self.log("=" * 60, "INFO")
        self.log(f"📁 Arquivos em: {self.deploy_dir}", "INFO")
        self.log(f"🌐 URL destino: {self.full_url}", "INFO")
        self.log("", "INFO")
        self.log("📋 PRÓXIMOS PASSOS:", "WARNING")
        self.log("", "INFO")
        self.log("1. 🌐 CLOUDFLARE PAGES (Recomendado):", "INFO")
        self.log("   - cd deploy_arcasadeveloping_BGAPP", "INFO")
        self.log("   - git init && git add . && git commit -m 'BGAPP deploy'", "INFO")
        self.log("   - Conectar com Cloudflare Pages", "INFO")
        self.log("", "INFO")
        self.log("2. 📤 FTP/SFTP:", "INFO")
        self.log("   - Editar credenciais em upload_ftp.sh", "INFO")
        self.log("   - ./upload_ftp.sh", "INFO")
        self.log("", "INFO")
        self.log("3. 🐙 GITHUB PAGES:", "INFO")
        self.log("   - ./deploy_github.sh", "INFO")
        self.log("", "INFO")
        self.log("📖 Leia README.md para instruções detalhadas", "WARNING")
        self.log("=" * 60, "INFO")

    def run_deploy(self):
        """Executar todo o processo de deploy"""
        try:
            self.log("🚀 INICIANDO DEPLOY BGAPP", "SUCCESS")
            self.log(f"📍 Destino: {self.full_url}", "INFO")
            
            if not self.check_requirements():
                return False
            
            self.prepare_files()
            self.update_paths_for_subdirectory()
            self.create_deployment_configs()
            self.create_upload_scripts()
            self.create_readme()
            self.create_deployment_info()
            
            self.show_deploy_summary()
            
            return True
            
        except Exception as e:
            self.log(f"❌ ERRO NO DEPLOY: {str(e)}", "ERROR")
            return False

def main():
    """Função principal"""
    print("🚀 BGAPP Deploy Final v2.0.0")
    print("=" * 50)
    
    deploy = BGAPPFinalDeploy()
    success = deploy.run_deploy()
    
    if success:
        print("\n✅ Deploy preparado com sucesso!")
        print(f"📁 Arquivos em: {deploy.deploy_dir}")
        print(f"🌐 URL destino: {deploy.full_url}")
        return 0
    else:
        print("\n❌ Falha no deploy!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
