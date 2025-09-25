#!/usr/bin/env python3
"""
Teste de autenticação Copernicus com as credenciais reais
"""

import requests
import json
import os

def test_copernicus_auth():
    """Testar autenticação com ambas as contas"""
    
    # Credenciais das duas contas
    accounts = [
        {
            'name': 'Conta 1 (msantos14)',
            'username': 'msantos14',
            'password': 'Shoro.1995'
        },
        {
            'name': 'Conta 2 (majearcasa)',
            'username': 'majearcasa@gmail.com', 
            'password': 'ShadowZoro!.1995'
        }
    ]
    
    # URLs de autenticação possíveis
    auth_endpoints = [
        {
            'name': 'Copernicus Data Space (CDSE)',
            'url': 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
            'client_id': 'cdse-public'
        },
        {
            'name': 'Copernicus Marine',
            'url': 'https://marine.copernicus.eu/auth/token',
            'client_id': 'marine-public'
        },
        {
            'name': 'Alternative Marine',
            'url': 'https://data.marine.copernicus.eu/auth/realms/marine/protocol/openid-connect/token',
            'client_id': 'copernicus-marine'
        }
    ]
    
    print("🌊 TESTE DE AUTENTICAÇÃO COPERNICUS")
    print("=" * 60)
    
    successful_auth = None
    
    for account in accounts:
        print(f"\n🔐 Testando {account['name']}")
        print(f"   Username: {account['username']}")
        print(f"   Password: {'*' * len(account['password'])}")
        
        for endpoint in auth_endpoints:
            print(f"\n   📡 {endpoint['name']}")
            
            try:
                auth_data = {
                    'grant_type': 'password',
                    'username': account['username'],
                    'password': account['password'],
                    'client_id': endpoint['client_id']
                }
                
                headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'BGAPP-Angola/1.0'
                }
                
                response = requests.post(
                    endpoint['url'], 
                    data=auth_data, 
                    headers=headers,
                    timeout=20
                )
                
                print(f"      Status: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        token_data = response.json()
                        print("      ✅ AUTENTICAÇÃO BEM-SUCEDIDA!")
                        print(f"      Token Type: {token_data.get('token_type', 'N/A')}")
                        print(f"      Expires In: {token_data.get('expires_in', 'N/A')} segundos")
                        
                        # Salvar credenciais que funcionaram
                        successful_auth = {
                            'account': account,
                            'endpoint': endpoint,
                            'token': token_data
                        }
                        
                        # Testar acesso a dados
                        test_data_access(token_data.get('access_token'), endpoint['name'])
                        
                        break
                        
                    except json.JSONDecodeError:
                        print(f"      ⚠️ Resposta não é JSON: {response.text[:100]}")
                        
                elif response.status_code == 401:
                    print("      ❌ Credenciais inválidas")
                elif response.status_code == 404:
                    print("      ❌ Endpoint não encontrado")
                else:
                    error_text = response.text[:150] if response.text else "Sem resposta"
                    print(f"      ❌ Erro {response.status_code}: {error_text}")
                    
            except requests.exceptions.Timeout:
                print("      ⏰ Timeout - servidor demorou a responder")
            except requests.exceptions.ConnectionError:
                print("      🔌 Erro de conexão")
            except Exception as e:
                print(f"      ❌ Erro inesperado: {str(e)[:50]}")
        
        if successful_auth:
            break
    
    if successful_auth:
        print(f"\n🎉 SUCESSO! Usar {successful_auth['account']['name']} com {successful_auth['endpoint']['name']}")
        
        # Criar arquivo de configuração
        config = {
            'working_credentials': {
                'username': successful_auth['account']['username'],
                'password': successful_auth['account']['password'],
                'endpoint': successful_auth['endpoint']['url'],
                'client_id': successful_auth['endpoint']['client_id']
            },
            'test_date': '2024-08-31',
            'status': 'authenticated'
        }
        
        with open('copernicus_config.json', 'w') as f:
            json.dump(config, f, indent=2)
        
        print("💾 Configuração salva em: copernicus_config.json")
        
    else:
        print("\n❌ NENHUMA AUTENTICAÇÃO FOI BEM-SUCEDIDA")
        print("⚠️ Verificar:")
        print("   - Credenciais estão corretas")
        print("   - Contas estão ativas")
        print("   - Serviços Copernicus estão online")

def test_data_access(access_token, service_name):
    """Testar acesso aos dados com o token"""
    print(f"      🔍 Testando acesso aos dados...")
    
    # URLs de teste para dados
    test_urls = [
        'https://data.marine.copernicus.eu/api/v1/datasets',
        'https://stac.marine.copernicus.eu/collections',
        'https://marine.copernicus.eu/api/v1/products'
    ]
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'User-Agent': 'BGAPP-Angola/1.0'
    }
    
    for url in test_urls:
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                print(f"      ✅ Acesso aos dados confirmado via {url.split('/')[2]}")
                return True
            else:
                print(f"      ⚠️ Dados não acessíveis via {url.split('/')[2]} ({response.status_code})")
        except:
            continue
    
    print(f"      ⚠️ Acesso aos dados limitado, mas autenticação válida")
    return False

if __name__ == "__main__":
    test_copernicus_auth()
