#!/usr/bin/env python3
"""
Script para executar testes de segurança da BGAPP
"""

import sys
import os
import time
import subprocess
import json
from pathlib import Path
from typing import Dict, Any

# Adicionar src ao path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

def check_server_running(url: str = "http://localhost:8000") -> bool:
    """Verificar se o servidor está rodando"""
    try:
        import requests
        response = requests.get(f"{url}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def start_test_server() -> subprocess.Popen:
    """Iniciar servidor para testes"""
    print("🚀 Iniciando servidor de teste...")
    
    # Comando para iniciar servidor
    cmd = [
        sys.executable, "-m", "uvicorn",
        "src.bgapp.admin_api:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--log-level", "warning"
    ]
    
    try:
        process = subprocess.Popen(
            cmd, 
            cwd=Path(__file__).parent.parent,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Aguardar servidor iniciar
        for i in range(30):  # 30 segundos max
            if check_server_running():
                print("✅ Servidor iniciado com sucesso")
                return process
            time.sleep(1)
        
        print("❌ Timeout ao iniciar servidor")
        process.terminate()
        return None
        
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        return None

def run_security_tests(base_url: str = "http://localhost:8000") -> Dict[str, Any]:
    """Executar testes de segurança"""
    try:
        from bgapp.security.security_tests import SecurityTestFramework
        
        print("🔒 Executando testes de segurança...")
        framework = SecurityTestFramework(base_url=base_url)
        results = framework.run_all_tests()
        
        return results
        
    except ImportError as e:
        print(f"❌ Erro ao importar framework de testes: {e}")
        return {"error": str(e)}
    except Exception as e:
        print(f"❌ Erro ao executar testes: {e}")
        return {"error": str(e)}

def generate_report(results: Dict[str, Any], output_file: str = "security_report.json"):
    """Gerar relatório de segurança"""
    try:
        # Adicionar informações do sistema
        system_info = {
            "python_version": sys.version,
            "platform": sys.platform,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "working_directory": str(Path.cwd())
        }
        
        results["system_info"] = system_info
        
        # Salvar relatório
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Relatório salvo em: {output_file}")
        
        # Gerar relatório em texto
        text_report = generate_text_report(results)
        text_file = output_file.replace(".json", ".txt")
        
        with open(text_file, "w", encoding="utf-8") as f:
            f.write(text_report)
        
        print(f"📄 Relatório em texto salvo em: {text_file}")
        
    except Exception as e:
        print(f"❌ Erro ao gerar relatório: {e}")

def generate_text_report(results: Dict[str, Any]) -> str:
    """Gerar relatório em formato texto"""
    lines = [
        "🔒 RELATÓRIO DE TESTES DE SEGURANÇA - BGAPP",
        "=" * 60,
        f"Timestamp: {results.get('system_info', {}).get('timestamp', 'N/A')}",
        f"Python: {results.get('system_info', {}).get('python_version', 'N/A').split()[0]}",
        ""
    ]
    
    # Resumo
    summary = results.get("summary", {})
    lines.extend([
        "📊 RESUMO:",
        f"  Total de testes: {summary.get('total_tests', 0)}",
        f"  ✅ Passou: {summary.get('passed', 0)}",
        f"  ❌ Falhou: {summary.get('failed', 0)}",
        f"  🚨 Erros: {summary.get('errors', 0)}",
        f"  ⏭️ Pulados: {summary.get('skipped', 0)}",
        f"  🏆 Score: {results.get('security_score', 0):.1f}/10",
        f"  ⏱️ Duração: {summary.get('duration', 0):.2f}s",
        ""
    ])
    
    # Resultados por categoria
    results_by_category = {}
    for result in results.get("results", []):
        category = result["category"]
        if category not in results_by_category:
            results_by_category[category] = []
        results_by_category[category].append(result)
    
    lines.append("📋 RESULTADOS POR CATEGORIA:")
    
    for category, category_results in results_by_category.items():
        lines.append(f"\n🔸 {category}:")
        
        for result in category_results:
            status_emoji = {
                "pass": "✅",
                "fail": "❌",
                "error": "🚨",
                "skip": "⏭️"
            }
            
            emoji = status_emoji.get(result["status"], "❓")
            lines.append(f"  {emoji} {result['test_name']}")
            lines.append(f"     {result['message']}")
            lines.append(f"     Severidade: {result['severity'].upper()}")
            lines.append(f"     Duração: {result['duration']:.2f}s")
    
    # Recomendações
    failed_tests = [r for r in results.get("results", []) if r["status"] == "fail"]
    
    if failed_tests:
        lines.extend([
            "",
            "⚠️ RECOMENDAÇÕES:",
        ])
        
        for i, test in enumerate(failed_tests, 1):
            lines.append(f"  {i}. {test['test_name']}: {test['message']}")
    
    # Score interpretation
    score = results.get("security_score", 0)
    lines.extend([
        "",
        "🏆 AVALIAÇÃO DE SEGURANÇA:",
    ])
    
    if score >= 9.0:
        lines.append("  🟢 EXCELENTE - Segurança de alto nível")
    elif score >= 7.0:
        lines.append("  🟡 BOM - Algumas melhorias necessárias")
    elif score >= 5.0:
        lines.append("  🟠 MÉDIO - Várias vulnerabilidades encontradas")
    else:
        lines.append("  🔴 CRÍTICO - Vulnerabilidades graves encontradas")
    
    return "\n".join(lines)

def main():
    """Função principal"""
    print("🔒 BGAPP Security Test Runner")
    print("=" * 40)
    
    # Verificar se servidor já está rodando
    server_running = check_server_running()
    server_process = None
    
    if not server_running:
        print("⚠️ Servidor não detectado, tentando iniciar...")
        server_process = start_test_server()
        
        if not server_process:
            print("❌ Não foi possível iniciar servidor para testes")
            return 1
    else:
        print("✅ Servidor já está rodando")
    
    try:
        # Executar testes
        results = run_security_tests()
        
        if "error" in results:
            print(f"❌ Erro nos testes: {results['error']}")
            return 1
        
        # Gerar relatórios
        generate_report(results)
        
        # Mostrar resultado final
        score = results.get("security_score", 0)
        failed = results.get("summary", {}).get("failed", 0)
        
        print(f"\n🏆 Score final: {score:.1f}/10")
        
        if failed > 0:
            print(f"❌ {failed} testes falharam - verificar relatório")
            return 1
        else:
            print("✅ Todos os testes passaram!")
            return 0
    
    finally:
        # Limpar servidor se foi iniciado por nós
        if server_process:
            print("🛑 Parando servidor de teste...")
            server_process.terminate()
            try:
                server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server_process.kill()

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
