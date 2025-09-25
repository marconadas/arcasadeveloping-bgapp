"""
Testes para a aplicação mapa-enterprise
"""

import unittest
import json
import sys
import os
from unittest.mock import Mock, patch

# Adicionar src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from app import app, server
from auth import auth_manager
from integrations.integration_manager import IntegrationManager

class TestMapaEnterprise(unittest.TestCase):
    """Testes da aplicação"""

    def setUp(self):
        """Configuração dos testes"""
        self.client = server.test_client()
        self.client.testing = True

    def test_health_check(self):
        """Teste de health check"""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)

    def test_login_api(self):
        """Teste da API de login"""
        response = self.client.post('/api/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertIn('token', data)
        self.assertEqual(data['username'], 'admin')

    def test_login_api_invalid(self):
        """Teste de login inválido"""
        response = self.client.post('/api/login', json={
            'username': 'admin',
            'password': 'wrong_password'
        })
        self.assertEqual(response.status_code, 401)

    def test_auth_required_api(self):
        """Teste de API que requer autenticação"""
        response = self.client.get('/api/status')
        self.assertEqual(response.status_code, 401)

    @patch('integrations.integration_manager.IntegrationManager.get_status_summary')
    def test_api_status_with_auth(self, mock_status):
        """Teste da API de status com autenticação"""
        # Mock do status
        mock_status.return_value = {
            'timestamp': '2025-01-01T00:00:00',
            'overall_status': 'operational'
        }

        # Login primeiro
        login_response = self.client.post('/api/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        token = json.loads(login_response.data)['token']

        # Testar API com token
        response = self.client.get('/api/status', headers={
            'Authorization': f'Bearer {token}'
        })
        self.assertEqual(response.status_code, 200)

    def test_integration_manager(self):
        """Teste do gerenciador de integrações"""
        manager = IntegrationManager()
        status = manager.get_status_summary()

        self.assertIn('timestamp', status)
        self.assertIn('overall_status', status)
        self.assertIn('integrations', status)

    def test_auth_manager(self):
        """Teste do gerenciador de autenticação"""
        # Teste de autenticação válida
        token = auth_manager.authenticate('admin', 'admin123')
        self.assertIsNotNone(token)

        # Verificar token
        payload = auth_manager.verify_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload['username'], 'admin')

        # Teste de autenticação inválida
        invalid_token = auth_manager.authenticate('admin', 'wrong_password')
        self.assertIsNone(invalid_token)

    def test_user_management(self):
        """Teste de gestão de usuários"""
        # Criar usuário
        success = auth_manager.create_user('test_user', 'test_pass', 'user')
        self.assertTrue(success)

        # Autenticar novo usuário
        token = auth_manager.authenticate('test_user', 'test_pass')
        self.assertIsNotNone(token)

        # Alterar senha
        success = auth_manager.change_password('test_user', 'test_pass', 'new_pass')
        self.assertTrue(success)

        # Autenticar com nova senha
        token = auth_manager.authenticate('test_user', 'new_pass')
        self.assertIsNotNone(token)

        # Falha com senha antiga
        invalid_token = auth_manager.authenticate('test_user', 'test_pass')
        self.assertIsNone(invalid_token)

if __name__ == '__main__':
    unittest.main()
