# Mapa Enterprise - Sistema de Mapeamento em Tempo Real para Angola

Aplicação Python para monitoramento em tempo real da costa de Angola com integrações com Copernicus Marine, Global Fishing Watch (GFW), Machine Learning e dados QGIS.

## 🚀 Funcionalidades

- **Mapas Interativos**: Interface baseada em Leaflet com dados em tempo real
- **Integrações Completas**:
  - **Copernicus Marine**: Dados oceanográficos (SST, clorofila, salinidade)
  - **Global Fishing Watch**: Monitoramento de embarcações e atividade de pesca
  - **Machine Learning**: Previsões de atividade de pesca e detecção de anomalias
  - **QGIS**: Camadas geoespaciais e análise de conformidade
- **Autenticação**: Sistema de login com JWT
- **Real-time**: Atualizações automáticas a cada 30 segundos
- **API REST**: Endpoints para integração com outros sistemas
- **Enterprise Ready**: Gestão de tokens, logging, segurança

## 📋 Pré-requisitos

- Python 3.8+
- Docker (opcional, para deployment)
- Contas e tokens das APIs:
  - Copernicus Marine Service
  - Global Fishing Watch
  - OpenWeatherMap (opcional)
  - Google Maps API (opcional)

## 🛠️ Instalação

### 1. Clonar e Configurar

```bash
cd /Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp/apps/mapa-enterprise

# Instalar dependências
pip install -r requirements.txt
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp config_example.env .env

# Editar .env com suas credenciais
nano .env
```

### 3. Configurar Tokens das APIs

Edite o arquivo `.env` com os seguintes tokens:

```env
# Tokens obrigatórios (substitua pelos seus valores)
COPERNICUS_API_KEY=seu_token_copernicus
COPERNICUS_USERNAME=seu_usuario_copernicus
COPERNICUS_PASSWORD=sua_senha_copernicus

GFW_API_KEY=seu_token_gfw
GFW_CLIENT_ID=seu_client_id_gfw
GFW_CLIENT_SECRET=seu_client_secret_gfw

# Tokens opcionais
OPENWEATHER_API_KEY=seu_token_openweather
GOOGLE_MAPS_API_KEY=seu_token_google_maps

# Configurações do sistema
SECRET_KEY=sua_chave_secreta_flask
JWT_SECRET_KEY=sua_chave_secreta_jwt
FLASK_ENV=development
```

### 4. Executar a Aplicação

```bash
# Desenvolvimento
python src/app.py

# Produção com Gunicorn
gunicorn --bind 0.0.0.0:8050 --workers 4 src.app:server
```

A aplicação estará disponível em: `http://localhost:8050`

## 🔐 Autenticação

### Usuários Padrão

- **admin** / **admin123** - Acesso completo
- **user** / **user123** - Acesso de leitura

### API de Autenticação

```bash
# Login via API
curl -X POST http://localhost:8050/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## 📊 Integrações

### Copernicus Marine
- Dados oceanográficos em tempo real
- Temperatura da superfície do mar (SST)
- Concentração de clorofila
- Salinidade
- **Token necessário**: Configure `COPERNICUS_*` no `.env`

### Global Fishing Watch
- Monitoramento de embarcações
- Atividade de pesca
- Encontros entre embarcações
- Eventos de loitering
- **Token necessário**: Configure `GFW_*` no `.env`

### Machine Learning
- Previsões de atividade de pesca
- Detecção de anomalias
- Previsões de upwelling
- Modelos treinados com dados históricos
- **Modelos**: Carregados automaticamente de `/app/data/models/`

### QGIS
- Camadas geoespaciais
- Análise de conformidade
- Zonas de pesca
- Áreas marinhas protegidas
- **Dados**: Shapefiles em `/app/data/qgis/`

## 🗂️ Estrutura do Projeto

```
apps/mapa-enterprise/
├── src/
│   ├── app.py                          # Aplicação principal
│   ├── auth.py                         # Sistema de autenticação
│   └── integrations/
│       ├── __init__.py
│       ├── integration_manager.py      # Gerenciador de integrações
│       ├── copernicus.py               # Integração Copernicus
│       ├── gfw.py                      # Integração GFW
│       ├── machine_learning.py         # Integração ML
│       └── qgis.py                     # Integração QGIS
├── config/
│   ├── settings.py                     # Configurações
│   └── __init__.py
├── data/                               # Dados e modelos
│   ├── models/                        # Modelos de ML
│   └── qgis/                         # Shapefiles QGIS
├── requirements.txt                   # Dependências
├── config_example.env                # Exemplo de configuração
└── README.md                         # Este arquivo
```

## 🚀 Endpoints da API

### Autenticação
- `POST /api/login` - Login
- `GET /api/status` - Status do sistema (autenticado)
- `GET /api/data` - Dados das integrações (autenticado)

### Monitoramento
- Status em tempo real das integrações
- Logs detalhados
- Métricas de performance

## 🔧 Configuração Avançada

### Tokens que Expiram
Alguns tokens podem expirar. Para lidar com isso:

1. **Monitoramento**: O sistema verifica conectividade a cada 30 segundos
2. **Re-autenticação**: Implemente lógica para renovar tokens automaticamente
3. **Fallback**: Dados de exemplo são usados quando APIs não estão disponíveis

### Machine Learning
- Modelos são carregados automaticamente
- Para treinar novos modelos, use o método `train_model()` na classe `MachineLearningIntegration`
- Modelos salvos em `/app/data/models/`

### QGIS
- Shapefiles são criados automaticamente na primeira execução
- Para adicionar novos dados, coloque arquivos `.geojson` em `/app/data/qgis/`
- Camadas são carregadas dinamicamente

## 🐳 Docker

```dockerfile
# Dockerfile para produção
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8050

CMD ["gunicorn", "--bind", "0.0.0.0:8050", "--workers", "4", "src.app:server"]
```

```bash
# Build e execução
docker build -t mapa-enterprise .
docker run -p 8050:8050 -v $(pwd)/data:/app/data mapa-enterprise
```

## 📈 Monitoramento e Logs

- Logs em `/app/logs/mapa_enterprise.log`
- Status das integrações em tempo real
- Métricas de performance
- Alertas de falhas de API

## 🔒 Segurança

- Autenticação JWT
- CORS configurável
- Rate limiting
- Validação de tokens
- Logs de segurança

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

Este projeto é propriedade da MareDatum Consultoria e Gestão de Projectos Unipessoal LDA.

## 🆘 Suporte

Para suporte técnico:
- Email: info@maredatum.pt
- Website: https://maredatum.pt
- Projeto: BGAPP - Biodiversity and Geographic Analysis Platform for Angola

## 🔄 Atualizações

O sistema verifica automaticamente:
- Conectividade com APIs a cada 30 segundos
- Novos dados de monitoramento
- Status dos modelos de ML
- Integridade das camadas QGIS

---

**Desenvolvido por MareDatum Consultoria para o projeto BGAPP Angola** 🌊
