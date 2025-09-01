# 🌐 Guia de Acesso Remoto Seguro - BGAPP Admin

Este guia apresenta **3 opções seguras** para partilhares o painel administrativo BGAPP com o teu pai, sem tornar a aplicação pública.

---

## 🎯 **Opções Disponíveis**

| Opção | Facilidade | Segurança | Custo | Recomendação |
|-------|------------|-----------|--------|--------------|
| **ngrok** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Grátis* | **Recomendado** |
| **Cloudflare Tunnel** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Grátis | Máxima segurança |
| **Túnel SSH** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Servidor | Se tens servidor |

*ngrok grátis tem limitações de tempo

---

## 🚀 **OPÇÃO 1: ngrok (Recomendado)**

### **Vantagens:**
- ✅ **Super fácil** de configurar (5 minutos)
- ✅ **Sem configuração de rede** (funciona atrás de firewalls)
- ✅ **HTTPS automático** 
- ✅ **Autenticação integrada**
- ✅ **URL temporário** (não fica público para sempre)

### **Como configurar:**

```bash
# 1. Instalar ngrok
brew install ngrok/ngrok/ngrok  # macOS
# ou baixar de https://ngrok.com/download

# 2. Configurar (criar conta em ngrok.com)
ngrok config add-authtoken SEU_TOKEN

# 3. Executar script automático
python scripts/setup_ngrok_tunnel.py
```

### **Resultado:**
- 🔗 **URL para partilhar**: `https://abc123.ngrok.io/admin.html`
- 🔑 **Credenciais**: `admin / bgapp123`
- 🔐 **Segurança**: Túnel encriptado + autenticação

---

## 🛡️ **OPÇÃO 2: Cloudflare Tunnel (Máxima Segurança)**

### **Vantagens:**
- ✅ **Segurança enterprise** (proteção DDoS)
- ✅ **Sem limites de tempo**
- ✅ **Zero configuração de rede**
- ✅ **Controlo de acesso avançado**
- ✅ **Analytics e logs**

### **Como configurar:**

```bash
# 1. Configurar ambiente seguro
python scripts/setup_secure_access.py

# 2. Criar conta Cloudflare (grátis)
# Ir para: https://dash.cloudflare.com

# 3. Criar tunnel
# Zero Trust > Access > Tunnels > Create Tunnel

# 4. Copiar token para .env.secure
CLOUDFLARE_TUNNEL_TOKEN=seu_token_aqui

# 5. Iniciar com Cloudflare
docker compose -f infra/docker-compose.secure.yml --profile cloudflare up -d
```

### **Resultado:**
- 🔗 **URL seguro**: `https://bgapp-xyz.trycloudflare.com/admin.html`
- 🔐 **Segurança máxima**: SSL + DDoS protection + Access control

---

## 🖥️ **OPÇÃO 3: Túnel SSH (Se tens servidor)**

### **Vantagens:**
- ✅ **Controlo total** da infraestrutura
- ✅ **Sem dependências externas**
- ✅ **Segurança máxima** (SSH)
- ✅ **Sem custos adicionais**

### **Requisitos:**
- 🖥️ Servidor com IP público
- 🔑 Acesso SSH ao servidor
- 🌐 Porta 8080 disponível no servidor

### **Como configurar:**

```bash
# 1. Configurar túnel SSH
python scripts/setup_ssh_tunnel.py

# 2. Executar túnel
bash scripts/start_ssh_tunnel.sh
```

### **Resultado:**
- 🔗 **URL para partilhar**: `http://SEU_SERVIDOR:8080/admin.html`
- 🔐 **Segurança**: Túnel SSH encriptado

---

## 🔒 **Funcionalidades de Segurança Incluídas**

### **Em Todas as Opções:**
- ✅ **Autenticação HTTP Basic** (utilizador + password)
- ✅ **Rate limiting** (proteção contra spam)
- ✅ **Headers de segurança** (XSS, CSRF protection)
- ✅ **Logs de acesso** detalhados
- ✅ **Serviços internos protegidos** (apenas admin acessível)

### **Opções Avançadas (Cloudflare/SSH):**
- ✅ **SSL/HTTPS obrigatório**
- ✅ **IP whitelisting** (apenas IPs autorizados)
- ✅ **Fail2ban** (bloqueio automático de ataques)
- ✅ **Certificados SSL** válidos

---

## 📋 **Guia Passo-a-Passo (ngrok - Mais Simples)**

### **1. Preparação (5 minutos)**
```bash
# Instalar ngrok
brew install ngrok/ngrok/ngrok

# Criar conta (grátis): https://ngrok.com
# Copiar authtoken de: https://dashboard.ngrok.com/get-started/your-authtoken

# Configurar ngrok
ngrok config add-authtoken SEU_TOKEN
```

### **2. Iniciar Acesso Remoto (1 comando)**
```bash
python scripts/setup_ngrok_tunnel.py
```

### **3. Partilhar com o Teu Pai**
- 🔗 **URL**: O script mostrará algo como `https://abc123.ngrok.io/admin.html`
- 🔑 **Credenciais**: `admin / bgapp123`
- 📱 **Instruções**: "Abre o link e insere as credenciais"

### **4. O Teu Pai Acede:**
1. Abrir o URL partilhado
2. Inserir credenciais quando pedido
3. Aceder ao painel administrativo completo
4. Ver todos os dashboards, mapas e dados

---

## ⚡ **Início Rápido (1 Minuto)**

Se queres começar **AGORA MESMO** com ngrok:

```bash
# 1. Instalar ngrok (se não tiveres)
brew install ngrok/ngrok/ngrok

# 2. Criar conta e obter token
open https://ngrok.com

# 3. Configurar token
ngrok config add-authtoken SEU_TOKEN

# 4. Iniciar tudo automaticamente
python scripts/setup_ngrok_tunnel.py
```

O script fará tudo automaticamente e dará o URL para partilhares! 🎉

---

## 🛡️ **Considerações de Segurança**

### **✅ O Que Está Protegido:**
- Autenticação obrigatória
- Túnel encriptado
- Rate limiting
- Headers de segurança
- Logs de acesso

### **⚠️ Cuidados:**
- **Não partilhes credenciais** por email/WhatsApp não encriptado
- **Muda a password** periodicamente
- **Revoga acesso** quando não precisares
- **Monitora logs** de acesso

### **🔐 Para Máxima Segurança:**
1. Usa **Cloudflare Tunnel** em vez de ngrok
2. Configura **IP whitelisting**
3. Usa **VPN** adicional se possível
4. **Monitora acessos** regularmente

---

## 📞 **Suporte e Troubleshooting**

### **Problemas Comuns:**

**ngrok não funciona:**
- Verifica authtoken
- Testa ligação à internet
- Verifica se BGAPP está a correr localmente

**Túnel SSH falha:**
- Verifica acesso SSH ao servidor
- Confirma que porta 8080 está livre no servidor
- Testa ligação SSH manual

**Cloudflare Tunnel não conecta:**
- Verifica token do tunnel
- Confirma configuração DNS
- Verifica logs do container

### **Comandos Úteis:**

```bash
# Verificar estado dos serviços
docker compose -f infra/docker-compose.yml ps

# Ver logs do ngrok
curl http://localhost:4040/api/tunnels

# Testar painel local
curl http://localhost:8085/admin.html

# Parar tudo
docker compose -f infra/docker-compose.yml down
pkill ngrok
```

---

## 🎯 **Recomendação Final**

Para a tua situação (partilhar com o pai do outro lado do mundo):

1. **🥇 Primeira opção**: **ngrok** - Mais simples e rápido
2. **🥈 Segunda opção**: **Cloudflare Tunnel** - Mais seguro e permanente  
3. **🥉 Terceira opção**: **SSH Tunnel** - Se tens servidor próprio

**Começar com ngrok** é perfeito para testar, depois podes migrar para Cloudflare se quiseres algo mais permanente.

---

**Tempo estimado de configuração**: 5-10 minutos  
**Nível de dificuldade**: Fácil  
**Segurança**: Alta  
**Custo**: Grátis
