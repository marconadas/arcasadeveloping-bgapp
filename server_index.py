#!/usr/bin/env python3
"""
Servidor web personalizado para servir index.html como página principal
Corrige o problema do servidor HTTP Python que serve admin.html por padrão
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path
import urllib.parse

class IndexHTMLHandler(http.server.SimpleHTTPRequestHandler):
    """Handler personalizado que força index.html como página principal"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent / "infra" / "frontend"), **kwargs)
    
    def do_GET(self):
        """Sobrescrever GET para forçar index.html na raiz"""
        # Parse da URL
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # Se é a raiz (/) ou vazio, servir index.html
        if path == '/' or path == '':
            self.path = '/index.html'
            print(f"🔄 Redirecionando raiz para index.html")
        
        # Log da requisição
        print(f"📥 GET {self.path}")
        
        # Chamar o handler padrão
        super().do_GET()
    
    def log_message(self, format, *args):
        """Personalizar log do servidor"""
        print(f"🌐 {format % args}")

def main():
    """Iniciar servidor web personalizado"""
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    
    print(f"🚀 Iniciando servidor BGAPP personalizado na porta {port}")
    print(f"📁 Diretório: {Path(__file__).parent / 'infra' / 'frontend'}")
    print(f"🎯 Página principal: index.html")
    print("="*50)
    
    # Verificar se index.html existe
    frontend_dir = Path(__file__).parent / "infra" / "frontend"
    index_file = frontend_dir / "index.html"
    
    if not index_file.exists():
        print(f"❌ ERRO: index.html não encontrado em {index_file}")
        sys.exit(1)
    
    print(f"✅ index.html encontrado: {index_file}")
    
    try:
        with socketserver.TCPServer(("", port), IndexHTMLHandler) as httpd:
            print(f"🌐 Servidor rodando em http://localhost:{port}")
            print(f"📱 Página principal: http://localhost:{port} → index.html")
            print(f"⚙️ Painel admin: http://localhost:{port}/admin.html")
            print("🛑 Pressione Ctrl+C para parar")
            print("="*50)
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Servidor parado pelo utilizador")
    except Exception as e:
        print(f"\n❌ Erro no servidor: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
