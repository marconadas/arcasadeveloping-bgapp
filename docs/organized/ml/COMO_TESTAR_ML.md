# 🧪 Como Testar o Sistema de Machine Learning

## 🚀 Método 1: Demonstração Completa (Recomendado)

### Execução Simples - SEM necessidade de aplicação rodando
```bash
# Demonstra todas as funcionalidades implementadas
python demo_ml_system.py
```

Este script:
- ✅ Funciona independentemente (não precisa da aplicação rodando)
- ✅ Demonstra todas as funcionalidades implementadas
- ✅ Cria base de dados de exemplo
- ✅ Simula todo o fluxo de ML
- ✅ Mostra como os endpoints funcionariam
- ✅ Relatório completo de funcionalidades

## 🧪 Método 2: Teste Automático (Se app estiver rodando)

### Execução com Aplicação
```bash
# Executa testes automaticamente (inicia a app se necessário)
python run_ml_tests.py
```

Este script:
- ✅ Verifica se a aplicação está rodando
- ✅ Inicia a aplicação automaticamente se necessário
- ✅ Executa todos os testes
- ✅ Para a aplicação quando termina
- ✅ Mostra relatório completo

---

## 🐳 Método 3: Com Docker (Produção)

### 1. Iniciar Aplicação Completa
```bash
# Iniciar todos os serviços (PostgreSQL, Redis, MinIO, etc.)
./start_bgapp_local.sh
```

### 2. Executar Testes (em outro terminal)
```bash
# Aguardar aplicação estar pronta (30-60 segundos) e então:
python test_ml_system.py
```

### 3. Parar Serviços
```bash
# Para parar todos os serviços
docker compose -f infra/docker-compose.yml down
```

---

## 🐍 Método 4: Python Direto (Desenvolvimento)

### 1. Iniciar Aplicação
```bash
# Terminal 1: Iniciar apenas a API
python start_app_for_tests.py
```

### 2. Executar Testes
```bash
# Terminal 2: Executar testes
python test_ml_system.py
```

### 3. Parar
```bash
# Terminal 1: Ctrl+C para parar a aplicação
```

---

## 📊 O Que os Testes Verificam

### ✅ Funcionalidades Testadas
1. **Health Check** - Aplicação está respondendo
2. **Inicialização BD** - Base de dados de ML criada
3. **Criar Estudo** - Armazenamento automático funciona
4. **Predição ML** - Modelos fazem predições
5. **Criar Filtro** - Filtros preditivos funcionam
6. **Dados do Filtro** - GeoJSON para mapas é gerado
7. **Listar Modelos** - API de modelos funciona
8. **Listar Filtros** - API de filtros funciona  
9. **Estatísticas** - Dashboard de ML funciona

### 📈 Resultado Esperado
```
📊 RESULTADO FINAL: 9/9 testes passaram (100.0%)
🎉 SUCESSO! Sistema de ML funcionando corretamente!
```

---

## 🔧 Resolução de Problemas

### ❌ "Connection refused"
**Problema**: Aplicação não está rodando
**Solução**: 
```bash
# Usar método automático
python run_ml_tests.py

# OU iniciar manualmente
./start_bgapp_local.sh
```

### ❌ "Database connection failed" 
**Problema**: PostgreSQL não está disponível
**Solução**:
```bash
# Usar Docker completo
./start_bgapp_local.sh

# OU verificar se PostgreSQL está rodando
docker compose -f infra/docker-compose.yml up -d postgis
```

### ❌ "Import errors"
**Problema**: Dependências faltando
**Solução**:
```bash
# Instalar dependências
pip install fastapi uvicorn pydantic requests asyncpg

# OU usar requirements
pip install -r requirements.txt
```

### ❌ "Permission denied"
**Problema**: Scripts sem permissão de execução
**Solução**:
```bash
chmod +x run_ml_tests.py test_ml_system.py start_app_for_tests.py
```

---

## 🎯 URLs Importantes

Quando a aplicação estiver rodando:

- 🏠 **API Principal**: http://localhost:8000
- 🧠 **API de ML**: http://localhost:8000/ml  
- 📚 **Documentação**: http://localhost:8000/docs
- 🏥 **Health Check**: http://localhost:8000/health
- 📊 **Dashboard ML**: http://localhost:8000/ml-dashboard
- 🗺️ **Frontend**: http://localhost:8085 (apenas com Docker)

---

## 📝 Logs e Debug

### Ver Logs da Aplicação
```bash
# Se usando Docker
docker compose -f infra/docker-compose.yml logs -f admin-api

# Se usando Python direto
# Os logs aparecem no terminal onde iniciou a app
```

### Testar Endpoints Manualmente
```bash
# Health check
curl http://localhost:8000/health

# Listar modelos disponíveis
curl http://localhost:8000/ml/models

# Estatísticas do sistema
curl http://localhost:8000/ml/stats
```

---

## 🎉 Próximos Passos

Após os testes passarem:

1. **Explorar a API**: http://localhost:8000/docs
2. **Ver Dashboard**: http://localhost:8000/ml-dashboard  
3. **Criar estudos reais** via API
4. **Integrar com frontend** existente
5. **Configurar produção** com Docker

---

## 🆘 Suporte

Se os testes continuarem falhando:

1. Verificar se Docker está rodando: `docker info`
2. Verificar portas livres: `lsof -i :8000`
3. Verificar logs de erro nos scripts
4. Tentar método automático: `python run_ml_tests.py`
