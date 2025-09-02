#!/usr/bin/env python3
"""
Script de teste completo para todos os endpoints da API administrativa
Testa todos os endpoints que estavam falhando com erro 404
"""

import requests
import json
import sys
from datetime import datetime

def test_endpoint(url, expected_status=200, description=""):
    """Testa um endpoint específico"""
    try:
        print(f"\nTestando {description or url}...")
        response = requests.get(url, timeout=10)
        
        if response.status_code == expected_status:
            print(f"✅ {url} - {response.status_code} OK")
            try:
                data = response.json()
                print(f"   📊 Resposta: {len(str(data))} caracteres")
                if isinstance(data, dict):
                    if 'timestamp' in data:
                        print(f"   🕒 Timestamp: {data['timestamp']}")
                    if 'status' in data:
                        print(f"   📈 Status: {data['status']}")
                elif isinstance(data, list):
                    print(f"   📋 Lista com {len(data)} itens")
            except:
                print(f"   📄 Resposta não-JSON: {response.text[:100]}...")
            return True
        else:
            print(f"❌ {url} - HTTP {response.status_code}")
            print(f"   📄 Resposta: {response.text[:200]}...")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ {url} - Erro de conexão: {e}")
        return False
    except Exception as e:
        print(f"❌ {url} - Erro: {e}")
        return False

def main():
    """Função principal de teste"""
    print("🧪 Teste Completo dos Endpoints da API Administrativa")
    print("=" * 60)
    print(f"🕒 Iniciado em: {datetime.now()}")
    print()
    
    base_url = "http://localhost:8000"
    
    # Lista de endpoints para testar
    endpoints = [
        # Endpoints básicos
        ("/health", 200, "Health check básico"),
        ("/health/detailed", 200, "Health check detalhado"),
        ("/services/status", 200, "Status dos serviços"),
        ("/metrics", 200, "Métricas do sistema"),
        
        # Endpoints que estavam falhando com 404
        ("/monitoring/stats", 200, "Estatísticas de monitorização"),
        ("/monitoring/alerts", 200, "Alertas ativos"),
        ("/connectors", 200, "Lista de conectores"),
        ("/processing/pipelines", 200, "Pipelines de processamento"),
        ("/storage/buckets/test", 200, "Teste de buckets MinIO"),
        
        # Endpoints adicionais
        ("/collections", 200, "Collections STAC"),
        ("/services", 200, "Serviços completos"),
        ("/database/tables/public", 200, "Tabelas da base de dados"),
    ]
    
    # Executar testes
    results = []
    for path, expected_status, description in endpoints:
        url = f"{base_url}{path}"
        success = test_endpoint(url, expected_status, description)
        results.append((path, success))
    
    # Resumo dos resultados
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS TESTES")
    print("=" * 60)
    
    successful = sum(1 for _, success in results if success)
    total = len(results)
    
    print(f"✅ Sucessos: {successful}/{total}")
    print(f"❌ Falhas: {total - successful}/{total}")
    print(f"📈 Taxa de sucesso: {(successful/total)*100:.1f}%")
    
    if successful == total:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        print("   A API administrativa está funcionando corretamente.")
    else:
        print(f"\n⚠️  {total - successful} TESTE(S) FALHARAM:")
        for path, success in results:
            if not success:
                print(f"   - {path}")
    
    print(f"\n🕒 Finalizado em: {datetime.now()}")
    
    # Retornar código de saída apropriado
    return 0 if successful == total else 1

if __name__ == "__main__":
    sys.exit(main())
