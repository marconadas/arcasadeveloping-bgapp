#!/usr/bin/env python3
"""
Servidor de teste rápido para relatórios - Silicon Valley Style
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uvicorn
from datetime import datetime

app = FastAPI(title="BGAPP Reports Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "BGAPP Reports Server - Silicon Valley Style 🚀"}

@app.get("/api/reports")
async def get_reports():
    """Listar relatórios reais do sistema"""
    try:
        project_root = Path(__file__).parent
        
        # Padrões de arquivos de relatório
        report_patterns = [
            "RELATORIO_*.md",
            "*REPORT*.md", 
            "AUDITORIA_*.md",
            "IMPLEMENTACAO_*.md",
            "SOLUCAO_*.md",
            "CORRECOES_*.md",
            "MELHORIAS_*.md"
        ]
        
        reports = []
        
        for pattern in report_patterns:
            for file_path in project_root.glob(pattern):
                if file_path.is_file():
                    stat = file_path.stat()
                    size_mb = stat.st_size / (1024 * 1024)
                    
                    filename = file_path.name
                    if "AUDITORIA" in filename:
                        report_type = "auditoria"
                        icon = "🔍"
                    elif "RELATORIO" in filename:
                        report_type = "relatorio"
                        icon = "📊"
                    elif "IMPLEMENTACAO" in filename:
                        report_type = "implementacao"
                        icon = "⚙️"
                    elif "SOLUCAO" in filename:
                        report_type = "solucao"
                        icon = "🔧"
                    else:
                        report_type = "system"
                        icon = "📋"
                    
                    display_name = filename.replace("_", " ").replace(".md", "").title()
                    
                    reports.append({
                        "id": filename.replace(".md", ""),
                        "name": display_name,
                        "filename": filename,
                        "description": f"Relatório técnico do sistema BGAPP",
                        "type": report_type,
                        "icon": icon,
                        "generated_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        "size": f"{size_mb:.1f} KB" if size_mb < 1 else f"{size_mb:.1f} MB",
                        "format": "Markdown",
                        "status": "completed",
                        "path": str(file_path.relative_to(project_root))
                    })
        
        reports.sort(key=lambda x: x["generated_at"], reverse=True)
        
        return {
            "reports": reports,
            "total": len(reports),
            "by_type": {
                "auditoria": len([r for r in reports if r["type"] == "auditoria"]),
                "relatorio": len([r for r in reports if r["type"] == "relatorio"]),
                "implementacao": len([r for r in reports if r["type"] == "implementacao"]),
                "solucao": len([r for r in reports if r["type"] == "solucao"]),
                "system": len([r for r in reports if r["type"] == "system"])
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {"error": str(e), "reports": [], "total": 0}

@app.get("/api/reports/{report_id}")
async def get_report_content(report_id: str):
    """Obter conteúdo de um relatório"""
    try:
        project_root = Path(__file__).parent
        
        # Procurar o arquivo
        possible_files = [
            f"{report_id}.md",
            f"{report_id.upper()}.md",
            f"{report_id.replace('-', '_').upper()}.md"
        ]
        
        report_file = None
        for filename in possible_files:
            file_path = project_root / filename
            if file_path.exists():
                report_file = file_path
                break
        
        if not report_file:
            raise HTTPException(status_code=404, detail=f"Relatório '{report_id}' não encontrado")
        
        content = report_file.read_text(encoding='utf-8')
        file_stat = report_file.stat()
        
        return {
            "id": report_id,
            "filename": report_file.name,
            "content": content,
            "format": "MD",
            "size": f"{file_stat.st_size / 1024:.1f} KB",
            "last_modified": datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
            "path": str(report_file.relative_to(project_root))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao ler relatório: {str(e)}")

@app.get("/reports", response_class=HTMLResponse)
async def get_reports_page():
    """Página de relatórios - Silicon Valley Style"""
    
    html = """
    <!DOCTYPE html>
    <html lang="pt">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatórios BGAPP - MARÍTIMO ANGOLA</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .report-card { transition: all 0.3s ease; border-left: 4px solid #3B82F6; }
            .report-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        </style>
    </head>
    <body class="bg-gray-50">
        <header class="gradient-bg text-white shadow-2xl">
            <div class="container mx-auto px-6 py-6">
                <div class="flex items-center space-x-4">
                    <div class="text-4xl">📊</div>
                    <div>
                        <h1 class="text-3xl font-bold">Relatórios BGAPP</h1>
                        <p class="text-blue-200">Sistema de gestão de relatórios técnicos - Silicon Valley Style 🚀</p>
                    </div>
                </div>
            </div>
        </header>

        <main class="container mx-auto px-6 py-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-blue-600" id="total-reports">-</div>
                    <div class="text-gray-600">Total de Relatórios</div>
                </div>
                <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-green-600" id="auditoria-count">-</div>
                    <div class="text-gray-600">Auditorias</div>
                </div>
                <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-purple-600" id="implementacao-count">-</div>
                    <div class="text-gray-600">Implementações</div>
                </div>
                <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-orange-600" id="solucao-count">-</div>
                    <div class="text-gray-600">Soluções</div>
                </div>
            </div>

            <div id="reports-container" class="space-y-4">
                <div class="text-center py-12">
                    <div class="text-6xl mb-4 animate-pulse">📊</div>
                    <p class="text-gray-600">Carregando relatórios...</p>
                </div>
            </div>
        </main>

        <script>
            async function loadReports() {
                try {
                    const response = await fetch('/api/reports');
                    const data = await response.json();
                    
                    document.getElementById('total-reports').textContent = data.total || 0;
                    document.getElementById('auditoria-count').textContent = data.by_type?.auditoria || 0;
                    document.getElementById('implementacao-count').textContent = data.by_type?.implementacao || 0;
                    document.getElementById('solucao-count').textContent = data.by_type?.solucao || 0;
                    
                    const container = document.getElementById('reports-container');
                    
                    if (data.reports && data.reports.length > 0) {
                        container.innerHTML = data.reports.map(report => `
                            <div class="report-card bg-white rounded-xl shadow-lg p-6">
                                <div class="flex items-start space-x-4">
                                    <div class="text-3xl">${report.icon}</div>
                                    <div class="flex-grow">
                                        <h3 class="text-xl font-bold text-gray-800 mb-2">${report.name}</h3>
                                        <p class="text-gray-600 mb-3">${report.description}</p>
                                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                                            <span><i class="fas fa-calendar mr-1"></i>${new Date(report.generated_at).toLocaleDateString('pt-PT')}</span>
                                            <span><i class="fas fa-file mr-1"></i>${report.format}</span>
                                            <span><i class="fas fa-weight mr-1"></i>${report.size}</span>
                                            <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">${report.type}</span>
                                        </div>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button onclick="viewReport('${report.id}')" 
                                                class="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                                            <i class="fas fa-eye mr-1"></i>Ver
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        container.innerHTML = `
                            <div class="text-center py-12">
                                <div class="text-6xl mb-4">📭</div>
                                <p class="text-gray-600">Nenhum relatório encontrado</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error('Erro:', error);
                    document.getElementById('reports-container').innerHTML = `
                        <div class="text-center py-12 text-red-600">
                            <div class="text-6xl mb-4">❌</div>
                            <p>Erro ao carregar relatórios</p>
                        </div>
                    `;
                }
            }

            function viewReport(reportId) {
                window.open(`/api/reports/${reportId}`, '_blank');
            }

            document.addEventListener('DOMContentLoaded', loadReports);
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html)

if __name__ == "__main__":
    print("🚀 Iniciando BGAPP Reports Server - Silicon Valley Style")
    print("📊 Página de relatórios: http://localhost:8001/reports")
    print("🔍 API de relatórios: http://localhost:8001/api/reports")
    
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
