# 🌍 BGAPP - Acesso Remoto via ngrok

## 🎯 Objetivo
Este guia explica como disponibilizar a aplicação BGAPP (Meteorologia Marinha de Angola) publicamente via ngrok, permitindo acesso remoto de qualquer lugar do mundo.

---

## 🚀 Início Rápido

### 1. Executar a Aplicação
```bash
# No diretório raiz do projeto BGAPP
./start_bgapp_public.sh
```

### 2. Resultado
- 🌐 **Servidor local**: http://localhost:8080
- 🔗 **URL pública**: https://xxxxx.ngrok-free.app
- 🔧 **Dashboard ngrok**: http://localhost:4040

---

## 📋 Pré-requisitos

### ✅ Verificar se ngrok está instalado
```bash
which ngrok
```

### 📦 Instalar ngrok (se necessário)
```bash
# Usar script automático
./install_ngrok.sh

# OU instalar manualmente:
# macOS
brew install ngrok/ngrok/ngrok

# Linux/Windows
# Baixar de: https://ngrok.com/download
```

---

## 🎮 Funcionalidades Disponíveis

### 🌊 Mapa Meteorológico Interativo
- ✅ Visualização de Angola e ZEE
- ✅ Dados oceanográficos em tempo real
- ✅ Controles intuitivos e responsivos

### 📊 Dados Disponíveis
- 🌡️ **SST** - Temperatura da Superfície do Mar
- 🧂 **Salinidade** - Concentração salina
- 🌿 **Clorofila** - Indicador de produtividade
- 🌊 **Correntes** - Direção e velocidade
- 💨 **Vento** - Campos vetoriais

### ⚙️ Controles
- 🎬 **Animação temporal** - Visualizar evolução
- 🗑️ **Limpar camadas** - Reset do mapa
- 📱 **Interface responsiva** - Mobile friendly

---

## 🔐 Acesso Administrativo

### Como Aceder
1. Clicar no ⚙️ (canto superior direito do painel)
2. Inserir credenciais:
   - **Utilizador**: `admin`
   - **Password**: `Kianda`

### Funcionalidades Admin
- 🔧 Configurações avançadas
- 📊 Estatísticas de uso
- ⚙️ Gestão de camadas
- 🔄 Controlo de serviços

---

## 🌍 Partilhar Acesso

### URL Pública
A aplicação fica disponível numa URL como:
```
https://abc123.ngrok-free.app
```

### Instruções para Utilizadores
1. **Abrir a URL** no navegador
2. **Aguardar carregamento** (pode demorar alguns segundos)
3. **Explorar o mapa** usando os controlos do painel
4. **Acesso admin** através do ⚙️ (se necessário)

---

## 🔧 Gestão dos Serviços

### Verificar Status
```bash
# Ver processos ativos
ps aux | grep -E "(http.server|ngrok)"

# Testar acesso local
curl http://localhost:8080

# Ver URL pública
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
```

### Parar Serviços
```bash
# Parar com Ctrl+C no terminal do script
# OU forçar paragem:
pkill -f "http.server.*8080"
pkill -f "ngrok.*8080"
```

### Reiniciar
```bash
# Parar primeiro, depois:
./start_bgapp_public.sh
```

---

## ⚠️ Considerações de Segurança

### 🔒 Segurança Ativa
- ✅ **Autenticação admin** protegida por password
- ✅ **HTTPS automático** via ngrok
- ✅ **URL temporária** (não permanente)
- ✅ **Sem dados sensíveis** expostos publicamente

### 🛡️ Recomendações
- 🔐 **Não partilhar** credenciais admin publicamente
- ⏰ **Parar serviços** quando não precisar
- 🔄 **URL muda** a cada reinício (maior segurança)
- 📊 **Monitorizar acesso** via dashboard ngrok

---

## 🆘 Resolução de Problemas

### ❌ Erro: "ngrok not found"
```bash
# Instalar ngrok
./install_ngrok.sh
```

### ❌ Erro: "Port already in use"
```bash
# Parar processos na porta 8080
pkill -f "http.server.*8080"
```

### ❌ Erro: "index.html not found"
```bash
# Verificar se está no diretório correto
ls infra/frontend/index.html
```

### ❌ Túnel ngrok não funciona
```bash
# Verificar dashboard
open http://localhost:4040

# Ou configurar authtoken (opcional)
ngrok config add-authtoken SEU_TOKEN
```

---

## 📱 Teste Mobile

### URLs de Teste
- 📱 **Smartphone**: Usar URL pública
- 💻 **Desktop**: http://localhost:8080
- 🔧 **Debug**: http://localhost:4040

### Funcionalidades Mobile
- ✅ **Interface responsiva** adaptada
- ✅ **Touch controls** otimizados
- ✅ **Performance** adequada
- ✅ **Todos os recursos** disponíveis

---

## 🎉 Sucesso!

Quando tudo estiver funcionando, verás:

```
🎉 BGAPP DISPONÍVEL REMOTAMENTE!
================================
🔗 URL pública: https://xxxxx.ngrok-free.app
📱 Acesso à aplicação: https://xxxxx.ngrok-free.app
💻 Acesso local: http://localhost:8080
🔧 Dashboard ngrok: http://localhost:4040

📋 Funcionalidades disponíveis:
   ✅ Mapa meteorológico interativo de Angola
   ✅ Dados oceanográficos (SST, Salinidade, Clorofila)
   ✅ Campos vetoriais (Correntes, Vento)
   ✅ Controles de animação temporal
   ✅ ZEE de Angola e Cabinda
   ✅ Painel administrativo (⚙️ no canto superior direito)

🔐 Acesso administrativo:
   - Clicar no ⚙️ no painel
   - Utilizador: admin
   - Password: Kianda

🌍 A aplicação está agora acessível globalmente!
```

---

## 📞 Suporte

Para problemas ou dúvidas:
1. 📋 Verificar este README
2. 🔍 Consultar logs do terminal
3. 🌐 Verificar dashboard ngrok
4. 🔄 Tentar reiniciar serviços
