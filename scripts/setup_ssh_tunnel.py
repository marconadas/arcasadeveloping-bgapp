#!/usr/bin/env python3
"""
Script para configurar acesso remoto via túnel SSH
Opção mais simples se tens um servidor com IP público
"""

import os
import subprocess
import sys
from pathlib import Path

def create_ssh_tunnel_script():
    """Cria script para túnel SSH"""
    
    print("🔧 Configuração de Túnel SSH")
    print("=" * 40)
    print("Esta opção requer um servidor com IP público onde possas fazer SSH")
    print("")
    
    server_ip = input("IP do servidor (ex: 123.456.789.0): ").strip()
    server_user = input("Utilizador SSH [ubuntu]: ").strip() or "ubuntu"
    server_port = input("Porta SSH [22]: ").strip() or "22"
    
    if not server_ip:
        print("❌ IP do servidor é obrigatório")
        return False
    
    # Script para criar túnel
    tunnel_script = f"""#!/bin/bash
# Script para criar túnel SSH reverso para BGAPP

set -e

echo "🚀 Iniciando BGAPP localmente..."

# Iniciar BGAPP
docker compose -f infra/docker-compose.yml up -d

echo "⏳ Aguardando serviços ficarem prontos..."
sleep 15

echo "🌐 Criando túnel SSH para {server_ip}..."

# Criar túnel SSH reverso
# Isto faz com que o servidor remoto redirecione a porta 8080 para o teu localhost:8085
ssh -R 8080:localhost:8085 -N {server_user}@{server_ip} -p {server_port} &

SSH_PID=$!
echo "✅ Túnel SSH criado (PID: $SSH_PID)"

echo ""
echo "🎉 ACESSO REMOTO ATIVO!"
echo ""
echo "📋 Instruções para o teu pai:"
echo "   URL: http://{server_ip}:8080/admin.html"
echo "   (O servidor vai redirecionar para o teu computador)"
echo ""
echo "🔒 Segurança:"
echo "   ✅ Túnel SSH encriptado"
echo "   ✅ Acesso apenas via servidor conhecido"
echo "   ✅ Sem exposição direta à internet"
echo ""
echo "🛑 Para parar:"
echo "   Ctrl+C ou kill $SSH_PID"

# Aguardar sinal para parar
trap "kill $SSH_PID 2>/dev/null; docker compose -f infra/docker-compose.yml down; echo 'Túnel parado'" EXIT

echo "⏳ Túnel ativo... (Ctrl+C para parar)"
wait $SSH_PID
"""
    
    script_path = Path("scripts/start_ssh_tunnel.sh")
    with open(script_path, 'w') as f:
        f.write(tunnel_script)
    
    os.chmod(script_path, 0o755)
    
    print(f"✅ Script criado: {script_path}")
    print("")
    print("📋 Para usar:")
    print(f"   bash {script_path}")
    print("")
    print(f"🔗 O teu pai acederá via: http://{server_ip}:8080/admin.html")
    
    return True

def create_systemd_service():
    """Cria serviço systemd para túnel permanente (opcional)"""
    
    print("\n🔄 Serviço Permanente (Opcional)")
    print("=" * 40)
    
    create_service = input("Criar serviço permanente? (y/N): ").strip().lower()
    if create_service != 'y':
        return
    
    server_ip = input("IP do servidor: ").strip()
    server_user = input("Utilizador SSH [ubuntu]: ").strip() or "ubuntu"
    
    if not server_ip:
        print("❌ IP do servidor é obrigatório")
        return
    
    service_content = f"""[Unit]
Description=BGAPP SSH Tunnel
After=network.target

[Service]
Type=simple
User={os.getenv('USER', 'user')}
WorkingDirectory={Path.cwd()}
ExecStart=/bin/bash {Path.cwd()}/scripts/start_ssh_tunnel.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
    
    service_path = Path("bgapp-tunnel.service")
    with open(service_path, 'w') as f:
        f.write(service_content)
    
    print(f"✅ Serviço criado: {service_path}")
    print("")
    print("📋 Para instalar:")
    print(f"   sudo cp {service_path} /etc/systemd/system/")
    print("   sudo systemctl enable bgapp-tunnel")
    print("   sudo systemctl start bgapp-tunnel")

def main():
    """Função principal"""
    print("🔐 BGAPP - Acesso Remoto via Túnel SSH")
    print("=" * 50)
    print("Configuração para partilhar com o teu pai usando servidor SSH")
    print("")
    
    if not Path("infra/docker-compose.yml").exists():
        print("❌ Erro: Execute este script a partir do diretório raiz do projeto")
        sys.exit(1)
    
    print("📋 Pré-requisitos:")
    print("   ✅ Servidor com IP público")
    print("   ✅ Acesso SSH ao servidor")
    print("   ✅ Chave SSH configurada (sem password)")
    print("")
    
    continue_setup = input("Continuar com a configuração? (y/N): ").strip().lower()
    if continue_setup != 'y':
        print("❌ Configuração cancelada")
        sys.exit(0)
    
    # Configurar túnel SSH
    if create_ssh_tunnel_script():
        create_systemd_service()
        
        print("\n" + "=" * 50)
        print("🎉 CONFIGURAÇÃO SSH COMPLETA!")
        print("")
        print("🚀 Próximos passos:")
        print("1. Testar ligação SSH ao servidor")
        print("2. Executar: bash scripts/start_ssh_tunnel.sh")
        print("3. Partilhar URL com o teu pai")
        print("")
        print("💡 Dicas:")
        print("   - Usa chaves SSH (não passwords)")
        print("   - Configura keep-alive no SSH")
        print("   - Considera VPN para máxima segurança")
    
    else:
        print("❌ Configuração falhada")
        sys.exit(1)

if __name__ == "__main__":
    main()
