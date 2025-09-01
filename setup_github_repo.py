#!/usr/bin/env python3
"""
🔗 Setup GitHub Repository para BGAPP
Configura conexão com GitHub e faz push inicial
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Executar comando com feedback"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} - Sucesso!")
            if result.stdout.strip():
                print(f"   {result.stdout.strip()}")
            return True
        else:
            print(f"❌ {description} - Erro!")
            if result.stderr.strip():
                print(f"   Erro: {result.stderr.strip()}")
            return False
    except Exception as e:
        print(f"❌ {description} - Exceção: {str(e)}")
        return False

def main():
    print("🚀 BGAPP GitHub Repository Setup")
    print("=" * 50)
    
    # Solicitar URL do repositório
    print("\n📝 PASSO 1: Cole a URL do seu repositório GitHub")
    print("Exemplo: https://github.com/seu-usuario/bgapp-arcasadeveloping.git")
    
    repo_url = input("\n🔗 URL do repositório: ").strip()
    
    if not repo_url:
        print("❌ URL não fornecida. Encerrando.")
        return 1
    
    if not repo_url.startswith("https://github.com/"):
        print("❌ URL deve começar com https://github.com/")
        return 1
    
    print(f"\n✅ URL configurada: {repo_url}")
    
    # Confirmar
    confirm = input("\n🤔 Confirma que o repositório foi criado no GitHub? (y/n): ").lower()
    if confirm != 'y':
        print("ℹ️  Por favor, crie o repositório no GitHub primeiro e execute novamente.")
        return 1
    
    print("\n🔧 Configurando repositório local...")
    
    # Remover remote anterior se existir
    print("\n🧹 Limpando configurações anteriores...")
    run_command("git remote remove origin", "Removendo remote anterior")
    
    # Adicionar novo remote
    if not run_command(f"git remote add origin {repo_url}", "Adicionando remote GitHub"):
        return 1
    
    # Verificar se há commits
    result = subprocess.run("git log --oneline", shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print("❌ Nenhum commit encontrado. Fazendo commit inicial...")
        if not run_command("git add . && git commit -m 'Deploy inicial BGAPP v2.0.0'", "Fazendo commit inicial"):
            return 1
    
    # Fazer push
    print("\n🚀 Enviando código para GitHub...")
    if not run_command("git push -u origin main", "Push para GitHub"):
        print("\n🔧 Tentando resolver conflitos...")
        
        # Tentar push forçado (cuidado!)
        force_push = input("⚠️  Tentar push forçado? Isso sobrescreverá o repositório remoto (y/n): ").lower()
        if force_push == 'y':
            if not run_command("git push -u origin main --force", "Push forçado para GitHub"):
                return 1
        else:
            print("❌ Push cancelado. Verifique se o repositório está vazio no GitHub.")
            return 1
    
    print("\n" + "=" * 60)
    print("🎉 REPOSITÓRIO GITHUB CONFIGURADO COM SUCESSO!")
    print("=" * 60)
    print(f"📁 Repositório: {repo_url}")
    print("🌐 Código enviado para GitHub")
    print("\n📋 PRÓXIMO PASSO: Configurar Cloudflare Pages")
    print("1. Acesse: https://dash.cloudflare.com")
    print("2. Workers & Pages → Create → Pages")
    print("3. Connect to Git → Escolher seu repositório")
    print("4. Deploy settings: deixar tudo vazio")
    print("5. Save and Deploy")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
