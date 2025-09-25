"""
Aplicação Mapa Enterprise - Sistema de mapeamento em tempo real para Angola
Integrações: Copernicus, GFW, Machine Learning, QGIS
"""

import os
import logging
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import dash
from dash import html, dcc, Input, Output, State
import dash_leaflet as dl
from config.settings import get_config
from auth import auth_manager
from integrations.integration_manager import IntegrationManager

# Configurar logging
logging.basicConfig(
    level=getattr(logging, get_config().LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(get_config().LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Inicializar Flask
server = Flask(__name__)
server.config.from_object(get_config())

# Configurar CORS
CORS(server, origins=server.config['CORS_ORIGINS'])

# Inicializar integrações
integration_manager = IntegrationManager()

# Inicializar Dash
app = dash.Dash(
    __name__,
    server=server,
    url_base_pathname='/',
    external_stylesheets=[
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
    ],
    external_scripts=[
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
    ]
)

# Layout principal
app.layout = html.Div([
    # Cabeçalho com autenticação
    html.Div([
        html.Div([
            html.H1("Mapa Enterprise - Angola", className="text-center"),
            html.P("Sistema de mapeamento em tempo real com integrações Copernicus, GFW e ML",
                   className="text-center text-muted", id="current-user-display")
        ], className="col-md-8"),
        html.Div([
            html.Div(id="auth-status", className="text-end"),
            html.Button([
                html.I(className="fas fa-sign-in-alt me-2"),
                "Login"
            ], id="login-btn", className="btn btn-outline-light me-2", **{"data-bs-toggle": "modal", "data-bs-target": "#loginModal"}),
            html.Button([
                html.I(className="fas fa-refresh me-2"),
                "Atualizar"
            ], id="refresh-btn", className="btn btn-outline-light")
        ], className="col-md-4 text-end align-self-center")
    ], className="container-fluid bg-primary text-white py-3"),

    # Modal de Login
    html.Div([
        html.Div([
            html.Div([
                html.H5("Login", className="modal-title"),
                html.Button([
                    html.Span("×", **{"aria-hidden": "true"})
                ], className="btn-close", **{"data-bs-dismiss": "modal", "aria-label": "Close"})
            ], className="modal-header"),
            html.Div([
                html.Div([
                    html.Label("Usuário:", className="form-label"),
                    dcc.Input(
                        id="username-input",
                        type="text",
                        className="form-control",
                        placeholder="Digite seu usuário"
                    )
                ], className="mb-3"),
                html.Div([
                    html.Label("Senha:", className="form-label"),
                    dcc.Input(
                        id="password-input",
                        type="password",
                        className="form-control",
                        placeholder="Digite sua senha"
                    )
                ], className="mb-3"),
                html.Div(id="login-message", className="alert alert-danger", style={"display": "none"}),
                html.Button(
                    "Entrar",
                    id="login-submit-btn",
                    className="btn btn-primary w-100"
                )
            ], className="modal-body")
        ], className="modal-dialog"),
    ], className="modal fade", id="loginModal", tabIndex="-1"),

    # Mapa principal
    html.Div([
        dl.Map(
            center=[-11.2027, 17.8739],  # Centro de Angola
            zoom=6,
            children=[
                dl.TileLayer(
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                ),
                # Camadas serão adicionadas dinamicamente
            ],
            style={'width': '100%', 'height': '70vh'},
            id='main-map'
        )
    ], className="container-fluid mt-3"),

    # Controles e informações
    html.Div([
        html.Div([
            html.Div([
                html.H4("Controles", className="mb-3"),
                html.Div([
                    html.Button([
                        html.I(className="fas fa-satellite me-2"),
                        "Copernicus"
                    ], id="copernicus-btn", className="btn btn-info me-2"),
                    html.Button([
                        html.I(className="fas fa-ship me-2"),
                        "GFW"
                    ], id="gfw-btn", className="btn btn-success me-2"),
                    html.Button([
                        html.I(className="fas fa-brain me-2"),
                        "Machine Learning"
                    ], id="ml-btn", className="btn btn-warning me-2"),
                    html.Button([
                        html.I(className="fas fa-map me-2"),
                        "QGIS"
                    ], id="qgis-btn", className="btn btn-secondary me-2"),
                ], className="mb-3"),
                html.Div(id="status-display", className="alert alert-info")
            ], className="col-md-8"),
            html.Div([
                html.H4("Informações do Sistema", className="mb-3"),
                html.Div(id="system-info", className="card"),
                html.H4("Status das Integrações", className="mb-3 mt-3"),
                html.Div(id="integration-status", className="card")
            ], className="col-md-4")
        ], className="row")
    ], className="container-fluid mt-3"),

    # Rodapé
    html.Div([
        html.P("© 2025 MareDatum Consultoria - Sistema Mapa Enterprise",
               className="text-center text-muted")
    ], className="container-fluid bg-light py-2 mt-3"),

    # Store para dados
    dcc.Store(id='user-store'),
    dcc.Store(id='data-store'),
    dcc.Interval(id='interval-component', interval=30*1000, n_intervals=0)  # Atualizar a cada 30 segundos
])

# Callbacks
@app.callback(
    [dash.Output('auth-status', 'children'),
     dash.Output('current-user-display', 'children'),
     dash.Output('user-store', 'data')],
    [dash.Input('login-submit-btn', 'n_clicks'),
     dash.Input('interval-component', 'n_intervals')],
    [dash.State('username-input', 'value'),
     dash.State('password-input', 'value'),
     dash.State('user-store', 'data')]
)
def handle_auth(login_clicks, interval, username, password, user_data):
    """Gerenciar autenticação"""
    ctx = dash.callback_context
    triggered_id = ctx.triggered[0]['prop_id'].split('.')[0] if ctx.triggered else None

    if triggered_id == 'login-submit-btn' and username and password:
        token = auth_manager.authenticate(username, password)
        if token:
            user_data = {
                'username': username,
                'token': token,
                'role': auth_manager.users[username]['role']
            }
            return (
                html.Div([
                    html.Span(f"Olá, {username}! ", className="text-light"),
                    html.Button("Logout", id="logout-btn", className="btn btn-sm btn-outline-light ms-2")
                ]),
                f"Sistema de mapeamento em tempo real - Usuário: {username}",
                user_data
            )
        else:
            return (
                html.Div("Falha na autenticação", className="text-warning"),
                "Sistema de mapeamento em tempo real com integrações Copernicus, GFW e ML",
                user_data or {}
            )

    # Verificar token no intervalo
    if user_data and 'token' in user_data:
        payload = auth_manager.verify_token(user_data['token'])
        if payload:
            return (
                html.Div([
                    html.Span(f"Olá, {payload['username']}! ", className="text-light"),
                    html.Button("Logout", id="logout-btn", className="btn btn-sm btn-outline-light ms-2")
                ]),
                f"Sistema de mapeamento em tempo real - Usuário: {payload['username']}",
                user_data
            )

    return (
        html.Div("Não autenticado", className="text-warning"),
        "Sistema de mapeamento em tempo real com integrações Copernicus, GFW e ML",
        user_data or {}
    )

@app.callback(
    dash.Output('login-message', 'children'),
    dash.Output('login-message', 'style'),
    [dash.Input('login-submit-btn', 'n_clicks')],
    [dash.State('username-input', 'value'),
     dash.State('password-input', 'value')]
)
def handle_login_message(login_clicks, username, password):
    """Mostrar mensagem de login"""
    if login_clicks and username and password:
        token = auth_manager.authenticate(username, password)
        if token:
            return "", {'display': 'none'}
        else:
            return "Usuário ou senha incorretos", {'display': 'block'}
    return "", {'display': 'none'}

@app.callback(
    dash.Output('system-info', 'children'),
    [dash.Input('interval-component', 'n_intervals')]
)
def update_system_info(interval):
    """Atualizar informações do sistema"""
    status = integration_manager.get_status_summary()

    return html.Div([
        html.Div([
            html.Strong("Status Geral: "),
            html.Span(status['overall_status'].upper(), className="text-success" if status['overall_status'] == 'operational' else "text-warning")
        ], className="card-body"),
        html.Div([
            html.Strong("Última atualização: "),
            html.Span(status['timestamp'])
        ], className="card-body")
    ], className="card")

@app.callback(
    dash.Output('integration-status', 'children'),
    [dash.Input('interval-component', 'n_intervals')]
)
def update_integration_status(interval):
    """Atualizar status das integrações"""
    status = integration_manager.get_status_summary()

    integration_items = []
    for name, info in status['integrations'].items():
        status_class = "text-success" if info['status'] == 'operational' else "text-danger"
        integration_items.append(
            html.Div([
                html.Strong(f"{name.upper()}: "),
                html.Span(info['status'], className=status_class)
            ], className="card-body")
        )

    return html.Div(integration_items, className="card")

@app.callback(
    dash.Output('data-store', 'data'),
    [dash.Input('copernicus-btn', 'n_clicks'),
     dash.Input('gfw-btn', 'n_clicks'),
     dash.Input('ml-btn', 'n_clicks'),
     dash.Input('qgis-btn', 'n_clicks'),
     dash.Input('interval-component', 'n_intervals')]
)
def update_data(copernicus_clicks, gfw_clicks, ml_clicks, qgis_clicks, interval):
    """Atualizar dados de todas as integrações"""
    ctx = dash.callback_context
    if not ctx.triggered:
        return integration_manager.get_all_data()

    triggered_id = ctx.triggered[0]['prop_id'].split('.')[0]

    # Obter dados baseado no botão clicado
    if triggered_id == 'copernicus-btn':
        return integration_manager.copernicus.get_ocean_data() if integration_manager.copernicus else {}
    elif triggered_id == 'gfw-btn':
        return integration_manager.gfw.get_vessel_data() if integration_manager.gfw else {}
    elif triggered_id == 'ml-btn':
        return integration_manager.ml.predict_fishing_activity(
            {"lat": -11.2027, "lon": 17.8739},
            {"sst": 22.1, "chlorophyll": 4.2, "salinity": 35.0}
        ) if integration_manager.ml else {}
    elif triggered_id == 'qgis-btn':
        return integration_manager.qgis.get_all_layers_info() if integration_manager.qgis else {}
    elif triggered_id == 'interval-component':
        return integration_manager.get_all_data()

    return integration_manager.get_all_data()

@app.callback(
    dash.Output('status-display', 'children'),
    [dash.Input('data-store', 'data')]
)
def update_status_display(data):
    """Atualizar display de status baseado nos dados"""
    if not data:
        return "Nenhum dado disponível"

    if 'prediction' in data:
        return f"Previsão ML: {data['prediction']} (Confiança: {data.get('confidence', 0):.2f})"
    elif 'vessels' in data:
        return f"Dados GFW: {len(data['vessels'])} embarcações detectadas"
    elif 'data' in data:
        return f"Dados Copernicus: {len(data['data'])} pontos de monitoramento"
    elif 'layers_info' in data:
        return f"Dados QGIS: {len(data)} camadas carregadas"

    return "Sistema operacional"

# Rota para API de autenticação
@server.route('/api/login', methods=['POST'])
def api_login():
    """API para login"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    token = auth_manager.authenticate(username, password)
    if token:
        return jsonify({'token': token, 'username': username})
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@server.route('/api/status', methods=['GET'])
@auth_manager.require_auth
def api_status(current_user):
    """API para status do sistema"""
    return jsonify(integration_manager.get_status_summary())

@server.route('/api/data', methods=['GET'])
@auth_manager.require_auth
def api_data(current_user):
    """API para obter dados"""
    return jsonify(integration_manager.get_all_data())

if __name__ == '__main__':
    logger.info("Iniciando aplicação Mapa Enterprise...")
    app.run(
        debug=server.config['DEBUG'],
        host=server.config['HOST'],
        port=server.config['PORT']
    )
