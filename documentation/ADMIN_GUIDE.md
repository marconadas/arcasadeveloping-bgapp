# 🔧 Guia do Painel Administrativo BGAPP

Este guia explica como utilizar o painel administrativo completo do BGAPP para gerir todos os aspectos da plataforma.

## 🚀 Início Rápido

### 1. Iniciar o Sistema

```bash
# Opção 1: Script automático
python scripts/start_admin.py

# Opção 2: Docker Compose manual
docker compose -f infra/docker-compose.yml up -d --build
```

### 2. Aceder ao Painel

Abra o navegador em: `http://localhost:8085/admin.html`

## 📋 Funcionalidades Principais

### 🏠 Dashboard
- **Métricas em tempo real** do sistema
- **Estado dos serviços** (online/offline)
- **Alertas** e notificações importantes
- **Tarefas recentes** e atividade do sistema

### 🖥️ Gestão de Serviços
- **PostGIS**: Base de dados espacial
- **MinIO**: Armazenamento de objetos
- **STAC FastAPI**: Catálogo de dados
- **pygeoapi**: APIs OGC
- **Keycloak**: Autenticação
- **Frontend**: Interfaces web

**Ações disponíveis:**
- ✅ Verificar estado
- 🔄 Reiniciar serviços
- 📊 Ver métricas de performance
- 🔗 Acesso direto aos serviços

### 🗄️ Bases de Dados
- **Tabelas PostGIS**: Ver esquemas, registos e tamanhos
- **Coleções STAC**: Gerir catálogos de dados
- **Consultas SQL**: Executar queries personalizadas
- **Backup/Restore**: Gestão de backups

### 💾 Armazenamento
- **Buckets MinIO**: Ver e gerir containers
- **Utilização de espaço**: Gráficos de ocupação
- **Ficheiros**: Upload e download
- **Limpeza**: Remover dados antigos

### 📥 Ingestão de Dados

#### Conectores Disponíveis:
- **OBIS**: Dados de biodiversidade marinha
- **CMEMS**: Oceanografia (clorofila-a, SST)
- **MODIS**: Dados de satélite (NDVI, EVI)
- **ERDDAP**: Dados oceanográficos
- **Fisheries Angola**: Estatísticas de pesca
- **Copernicus Real**: Dados em tempo real

**Funcionalidades:**
- ▶️ Executar conectores manualmente
- 📅 Agendar execuções automáticas
- 📊 Ver histórico de tarefas
- ⚠️ Monitorizar erros

### ⚙️ Processamento
- **Pipelines**: Fluxos de processamento de dados
- **Rasters**: Processamento NetCDF, COG, Zarr
- **Biodiversidade**: Cálculo de índices ecológicos
- **Biomassa**: Estimativas marinha e agrícola

### 🧠 Modelos
- **Modelos treinados**: Ver e gerir modelos ML
- **Treino**: Iniciar novos treinos
- **Predições**: Executar inferências
- **Validação**: Métricas de performance

### 📊 Relatórios
- **Geração automática**: Relatórios PDF/HTML
- **Templates**: Personalizar layouts
- **Agendamento**: Execução periódica
- **Exportação**: Download e partilha

### 🔧 Configurações
- **AOI**: Carregar nova área de interesse
- **Espécies**: Gerir catálogo de espécies
- **Variáveis**: Configurar parâmetros do sistema
- **CRS**: Sistema de coordenadas

### 👥 Utilizadores
- **Gestão de contas**: Criar, editar, remover
- **Papéis**: Administrador, Cientista, Observador
- **Permissões**: Controlo de acesso granular
- **Autenticação**: Integração com Keycloak

### 🔌 APIs
- **Endpoints**: Ver e testar APIs disponíveis
- **Chaves**: Gerir tokens de acesso
- **Limites**: Configurar rate limiting
- **Documentação**: Swagger/OpenAPI

### 📈 Monitorização
- **Tempo real**: CPU, memória, disco, rede
- **Métricas históricas**: Gráficos temporais
- **Alertas**: Configurar thresholds
- **Performance**: Latência e throughput

### 📝 Logs
- **Logs do sistema**: Ver em tempo real
- **Filtros**: Por nível (ERROR, WARNING, INFO)
- **Pesquisa**: Encontrar eventos específicos
- **Export**: Download de logs

### 🛡️ Backup & Segurança
- **Backups automáticos**: Configurar frequência
- **Restore**: Recuperar dados
- **Segurança**: SSL, firewall, autenticação
- **Auditoria**: Log de ações administrativas

## 🔧 Configuração Avançada

### Variáveis de Ambiente

```bash
# Base de dados
POSTGRES_HOST=postgis
POSTGRES_PORT=5432
POSTGRES_DB=geo
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123

# APIs
PYGEOAPI_URL=http://localhost:5080
STAC_URL=http://localhost:8081
ADMIN_API_URL=http://localhost:8000
```

### Ficheiros de Configuração

- `configs/admin.yaml`: Configurações do painel
- `configs/variables.yaml`: Variáveis do sistema
- `configs/species.yaml`: Catálogo de espécies
- `configs/aoi.geojson`: Área de interesse

## 🚨 Resolução de Problemas

### Serviço Offline
1. Verificar logs no painel
2. Reiniciar serviço específico
3. Verificar recursos do sistema
4. Consultar documentação do serviço

### Erro de Ingestão
1. Ver logs da tarefa
2. Verificar conectividade externa
3. Validar credenciais da API
4. Tentar execução manual

### Performance Lenta
1. Verificar utilização de recursos
2. Limpar dados temporários
3. Otimizar consultas SQL
4. Aumentar recursos do sistema

### Backup Falhado
1. Verificar espaço em disco
2. Validar permissões de escrita
3. Testar conectividade com storage
4. Executar backup manual

## 📞 Suporte

Para suporte técnico:
- 📧 Email: admin@bgapp.ao
- 📖 Documentação: `/docs/`
- 🐛 Issues: GitHub repository
- 💬 Chat: Sistema interno

## 🔄 Atualizações

Para atualizar o sistema:

```bash
# Parar serviços
docker compose -f infra/docker-compose.yml down

# Atualizar código
git pull origin main

# Reconstruir e iniciar
docker compose -f infra/docker-compose.yml up -d --build
```

## 📚 Recursos Adicionais

- [Documentação QGIS](docs/QGIS_SETUP.md)
- [Plano Major](MAJOR_PLAN.md)
- [API Documentation](http://localhost:8000/docs)
- [STAC Browser](http://localhost:8082)

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2024  
**Autor**: BGAPP Team
