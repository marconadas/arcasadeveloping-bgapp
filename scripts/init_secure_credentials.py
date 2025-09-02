#!/usr/bin/env python3
"""
Script para inicializar sistema de credenciais seguras da BGAPP
"""

import sys
import os
from pathlib import Path

# Adicionar src ao path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from bgapp.auth.secure_credentials import get_secure_credentials_manager
from bgapp.core.logging_config import get_logger

logger = get_logger(__name__)

def main():
    """Inicializar sistema de credenciais seguras"""
    print("🔐 Inicializando Sistema de Credenciais Seguras - BGAPP")
    print("=" * 60)
    
    try:
        # Criar gestor de credenciais
        manager = get_secure_credentials_manager()
        
        # Verificar se já existem credenciais
        existing_credentials = manager.load_credentials()
        if existing_credentials:
            print("⚠️  AVISO: Já existem credenciais seguras configuradas!")
            response = input("Deseja recriar as credenciais? (y/N): ").strip().lower()
            if response != 'y':
                print("❌ Operação cancelada.")
                return
        
        # Inicializar sistema
        print("\n🔄 Criando credenciais seguras...")
        temp_passwords = manager.initialize_secure_system()
        
        print("\n✅ Sistema inicializado com sucesso!")
        print("\n📋 CREDENCIAIS TEMPORÁRIAS (ALTERAR NO PRIMEIRO LOGIN):")
        print("-" * 50)
        
        for username, password in temp_passwords.items():
            print(f"👤 {username:10} | {password}")
        
        print("-" * 50)
        print("\n⚠️  IMPORTANTE:")
        print("1. Guarde estas passwords em local seguro")
        print("2. Altere as passwords no primeiro login")
        print("3. As passwords expiram em 90 dias")
        print("4. O ficheiro de credenciais está encriptado")
        
        print(f"\n📁 Ficheiros criados:")
        print(f"   - {manager.credentials_file} (credenciais encriptadas)")
        print(f"   - .encryption_key (chave de encriptação)")
        
        print("\n🚀 Sistema pronto para uso!")
        
    except Exception as e:
        logger.error(f"Erro ao inicializar sistema: {e}")
        print(f"❌ Erro: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
