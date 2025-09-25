#!/bin/bash
# Script para upload do BGAPP para arcasadeveloping.org

echo "🚀 Iniciando upload para arcasadeveloping.org..."

# Configurações (ajuste conforme necessário)
DOMAIN="arcasadeveloping.org"
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
