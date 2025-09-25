#!/usr/bin/env python3
"""
🌐 Setup Cloudflare Pages via Terminal
Automatiza configuração do Cloudflare Pages via API
"""

import requests
import json
import sys
import os
from datetime import datetime

class CloudflarePagesSetup:
    def __init__(self):
        self.base_url = "https://api.cloudflare.com/client/v4"
        self.github_repo = "marconadas/bgapp-arcasadeveloping"
        self.project_name = "bgapp-arcasadeveloping"
        
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

    def get_cloudflare_credentials(self):
        """Solicitar credenciais Cloudflare"""
        print("🔐 CONFIGURAÇÃO CLOUDFLARE PAGES")
        print("=" * 50)
        print("\n📝 Você precisa das credenciais da API Cloudflare:")
        print("1. Acesse: https://dash.cloudflare.com/profile/api-tokens")
        print("2. Clique 'Create Token'")
        print("3. Use template 'Custom token' com permissões:")
        print("   - Zone:Zone:Read")
        print("   - Zone:Page Rule:Edit")
        print("   - Account:Cloudflare Pages:Edit")
        print("\nOu use Global API Key (menos seguro):")
        print("1. Acesse: https://dash.cloudflare.com/profile/api-tokens")
        print("2. Copie 'Global API Key'")
        
        print("\n" + "="*50)
        
        # Opção 1: API Token (recomendado)
        use_token = input("🔑 Você tem API Token? (y/n): ").lower() == 'y'
        
        if use_token:
            token = input("🔑 Cole o API Token: ").strip()
            if not token:
                self.log("Token não fornecido", "ERROR")
                return None
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
        else:
            # Opção 2: Global API Key
            email = input("📧 Email da conta Cloudflare: ").strip()
            api_key = input("🔑 Global API Key: ").strip()
            
            if not email or not api_key:
                self.log("Credenciais não fornecidas", "ERROR")
                return None
                
            headers = {
                "X-Auth-Email": email,
                "X-Auth-Key": api_key,
                "Content-Type": "application/json"
            }
        
        return headers

    def test_credentials(self, headers):
        """Testar credenciais"""
        self.log("Testando credenciais Cloudflare...", "INFO")
        
        try:
            response = requests.get(f"{self.base_url}/user", headers=headers, timeout=10)
            
            if response.status_code == 200:
                user_data = response.json()
                if user_data.get("success"):
                    email = user_data["result"]["email"]
                    self.log(f"Credenciais válidas para: {email}", "SUCCESS")
                    return True
                else:
                    self.log("Credenciais inválidas", "ERROR")
                    return False
            else:
                self.log(f"Erro HTTP {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Erro na conexão: {str(e)}", "ERROR")
            return False

    def get_account_id(self, headers):
        """Obter Account ID"""
        self.log("Obtendo Account ID...", "INFO")
        
        try:
            response = requests.get(f"{self.base_url}/accounts", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("result"):
                    account_id = data["result"][0]["id"]
                    account_name = data["result"][0]["name"]
                    self.log(f"Account ID obtido: {account_name}", "SUCCESS")
                    return account_id
                else:
                    self.log("Nenhuma conta encontrada", "ERROR")
                    return None
            else:
                self.log(f"Erro ao obter Account ID: {response.status_code}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"Erro: {str(e)}", "ERROR")
            return None

    def create_pages_project(self, headers, account_id):
        """Criar projeto Cloudflare Pages"""
        self.log("Criando projeto Cloudflare Pages...", "INFO")
        
        project_config = {
            "name": self.project_name,
            "source": {
                "type": "github",
                "config": {
                    "owner": "marconadas",
                    "repo_name": "bgapp-arcasadeveloping",
                    "production_branch": "main",
                    "pr_comments_enabled": True,
                    "deployments_enabled": True
                }
            },
            "build_config": {
                "build_command": "",
                "destination_dir": "",
                "root_dir": "",
                "web_analytics_tag": None,
                "web_analytics_token": None
            },
            "deployment_configs": {
                "production": {
                    "env_vars": {},
                    "kv_namespaces": {},
                    "durable_object_namespaces": {},
                    "d1_databases": {},
                    "r2_buckets": {},
                    "services": {},
                    "compatibility_date": "2023-12-01",
                    "compatibility_flags": []
                }
            }
        }
        
        try:
            url = f"{self.base_url}/accounts/{account_id}/pages/projects"
            response = requests.post(url, headers=headers, json=project_config, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    project_url = data["result"]["subdomain"]
                    self.log(f"Projeto criado com sucesso!", "SUCCESS")
                    self.log(f"URL temporária: https://{project_url}", "INFO")
                    return data["result"]
                else:
                    errors = data.get("errors", [])
                    self.log(f"Erro ao criar projeto: {errors}", "ERROR")
                    return None
            else:
                self.log(f"Erro HTTP {response.status_code}: {response.text}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"Erro: {str(e)}", "ERROR")
            return None

    def show_manual_instructions(self):
        """Mostrar instruções manuais caso API falhe"""
        self.log("Configuração manual do Cloudflare Pages:", "WARNING")
        print("\n📋 PASSOS MANUAIS:")
        print("1. Acesse: https://dash.cloudflare.com")
        print("2. Workers & Pages → Create → Pages")
        print("3. Connect to Git")
        print("4. Escolha: marconadas/bgapp-arcasadeveloping")
        print("5. Build settings:")
        print("   - Framework preset: None")
        print("   - Build command: (vazio)")
        print("   - Build output directory: (vazio)")
        print("6. Save and Deploy")
        print("\n🌐 Após deploy:")
        print("1. Custom domains → Set up custom domain")
        print("2. Digite: arcasadeveloping.org")
        print("3. Configure DNS conforme instruções")

    def run(self):
        """Executar setup completo"""
        try:
            self.log("Iniciando setup Cloudflare Pages", "INFO")
            
            # Obter credenciais
            headers = self.get_cloudflare_credentials()
            if not headers:
                return False
            
            # Testar credenciais
            if not self.test_credentials(headers):
                return False
            
            # Obter Account ID
            account_id = self.get_account_id(headers)
            if not account_id:
                return False
            
            # Criar projeto
            project = self.create_pages_project(headers, account_id)
            if project:
                self.log("Setup Cloudflare Pages concluído!", "SUCCESS")
                self.log("Próximo passo: configurar domínio personalizado", "INFO")
                return True
            else:
                self.log("Falha na criação via API. Usando método manual.", "WARNING")
                self.show_manual_instructions()
                return False
                
        except Exception as e:
            self.log(f"Erro geral: {str(e)}", "ERROR")
            self.show_manual_instructions()
            return False

def main():
    """Função principal"""
    setup = CloudflarePagesSetup()
    
    print("🌐 Cloudflare Pages Setup Automático")
    print("=" * 50)
    print(f"📁 Repositório: {setup.github_repo}")
    print(f"🎯 Projeto: {setup.project_name}")
    print()
    
    # Verificar se usuário quer continuar
    continue_setup = input("🤔 Continuar com setup automático? (y/n): ").lower()
    
    if continue_setup != 'y':
        print("\n📋 Setup manual:")
        setup.show_manual_instructions()
        return 0
    
    success = setup.run()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
