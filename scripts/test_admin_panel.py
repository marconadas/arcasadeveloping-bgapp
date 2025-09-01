#!/usr/bin/env python3
"""
Script para testar o painel administrativo BGAPP
Verifica se todos os ficheiros estão presentes e se a estrutura está correcta
"""

import os
import sys
from pathlib import Path

def test_admin_panel():
    """Testa a integridade do painel administrativo"""
    
    print("🔍 Testando Painel Administrativo BGAPP")
    print("=" * 50)
    
    base_path = Path("infra/frontend")
    errors = []
    warnings = []
    
    # Verificar ficheiros principais
    required_files = {
        "admin.html": "Página principal do painel",
        "assets/css/admin.css": "Estilos principais",
        "assets/css/components.css": "Componentes CSS",
        "assets/js/admin.js": "JavaScript principal"
    }
    
    print("📁 Verificando ficheiros obrigatórios:")
    for file_path, description in required_files.items():
        full_path = base_path / file_path
        if full_path.exists():
            size = full_path.stat().st_size
            print(f"  ✅ {file_path} ({size:,} bytes) - {description}")
        else:
            errors.append(f"❌ {file_path} não encontrado - {description}")
    
    # Verificar páginas existentes
    existing_pages = [
        "dashboard.html",
        "collaboration.html", 
        "realtime_angola.html",
        "mobile.html",
        "index.html"
    ]
    
    print("\n🌐 Verificando páginas existentes:")
    for page in existing_pages:
        page_path = base_path / page
        if page_path.exists():
            print(f"  ✅ {page}")
        else:
            warnings.append(f"⚠️  {page} não encontrado")
    
    # Verificar estrutura HTML
    admin_html = base_path / "admin.html"
    if admin_html.exists():
        print("\n📄 Verificando estrutura HTML:")
        content = admin_html.read_text()
        
        checks = {
            "<!DOCTYPE html>": "DOCTYPE declarado",
            'lang="pt"': "Idioma português definido",
            "assets/css/admin.css": "CSS principal referenciado",
            "assets/js/admin.js": "JavaScript principal referenciado",
            "skip-link": "Link de acessibilidade presente",
            "admin-container": "Container principal presente",
            "sidebar": "Sidebar presente",
            "nav-menu": "Menu de navegação presente"
        }
        
        for check, description in checks.items():
            if check in content:
                print(f"  ✅ {description}")
            else:
                errors.append(f"❌ {description} - '{check}' não encontrado")
    
    # Verificar JavaScript
    js_file = base_path / "assets/js/admin.js"
    if js_file.exists():
        print("\n🔧 Verificando JavaScript:")
        js_content = js_file.read_text()
        
        js_checks = {
            "const CONFIG": "Configuração definida",
            "const AppState": "Estado global definido", 
            "const Utils": "Utilitários definidos",
            "const ApiService": "Serviço de API definido",
            "const Navigation": "Sistema de navegação definido",
            "addEventListener('DOMContentLoaded'": "Inicialização automática"
        }
        
        for check, description in js_checks.items():
            if check in js_content:
                print(f"  ✅ {description}")
            else:
                warnings.append(f"⚠️  {description} - '{check}' não encontrado")
    
    # Verificar CSS
    css_file = base_path / "assets/css/admin.css"
    if css_file.exists():
        print("\n🎨 Verificando CSS:")
        css_content = css_file.read_text()
        
        css_checks = {
            ":root": "Variáveis CSS definidas",
            ".admin-container": "Container principal estilizado",
            ".sidebar": "Sidebar estilizada",
            ".btn": "Botões estilizados",
            "@media": "Media queries para responsividade",
            ".loading": "Estados de carregamento"
        }
        
        for check, description in css_checks.items():
            if check in css_content:
                print(f"  ✅ {description}")
            else:
                warnings.append(f"⚠️  {description} - '{check}' não encontrado")
    
    # Verificar documentação
    docs_path = Path("docs")
    print("\n📚 Verificando documentação:")
    
    doc_files = [
        "ADMIN_GUIDE.md",
        "ADMIN_IMPROVEMENTS.md"
    ]
    
    for doc_file in doc_files:
        doc_path = docs_path / doc_file
        if doc_path.exists():
            print(f"  ✅ {doc_file}")
        else:
            warnings.append(f"⚠️  {doc_file} não encontrado")
    
    # Relatório final
    print("\n" + "=" * 50)
    print("📊 RELATÓRIO FINAL:")
    
    if not errors and not warnings:
        print("🎉 SUCESSO! Painel administrativo está completo e funcional.")
        return True
    
    if errors:
        print(f"\n❌ ERROS ENCONTRADOS ({len(errors)}):")
        for error in errors:
            print(f"  {error}")
    
    if warnings:
        print(f"\n⚠️  AVISOS ({len(warnings)}):")
        for warning in warnings:
            print(f"  {warning}")
    
    if errors:
        print("\n💡 ACÇÃO REQUERIDA: Corrigir erros antes de usar o painel.")
        return False
    else:
        print("\n✅ PAINEL FUNCIONAL: Avisos não impedem o funcionamento.")
        return True

def main():
    """Função principal"""
    if not Path("infra/frontend").exists():
        print("❌ Erro: Execute este script a partir do diretório raiz do projeto BGAPP")
        sys.exit(1)
    
    success = test_admin_panel()
    
    if success:
        print("\n🚀 Para iniciar o painel administrativo:")
        print("   python scripts/start_admin.py")
        print("   ou")
        print("   docker compose -f infra/docker-compose.yml up -d")
        print("\n🌐 Acesso: http://localhost:8085/admin.html")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
