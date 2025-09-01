# 🚀 BGAPP Admin - Guia de Desenvolvimento

## ❓ **Sua Pergunta: "ngrok atualiza sozinho?"**

**Resposta curta**: Não, mas agora sim! 😄

Criei scripts que fazem o ngrok e servidor atualizarem automaticamente quando você modifica arquivos.

## 🎯 **Opções de Desenvolvimento**

### 1. **Modo Simples** (Manual)
```bash
# Terminal 1: Servidor
cd infra/frontend
python3 -m http.server 8080

# Terminal 2: ngrok
ngrok http 8080
```
❌ **Problema**: Precisa reiniciar manualmente a cada mudança

### 2. **Modo Desenvolvimento** (Semi-automático)
```bash
make admin-dev
# ou
./start_admin_dev.sh
```
✅ **Vantagens**:
- Inicia servidor + ngrok automaticamente
- Cleanup automático ao parar (Ctrl+C)
- Mostra URLs de acesso

### 3. **Modo Watch** (Totalmente Automático) ⭐ **RECOMENDADO**
```bash
make admin-watch
# ou
./watch_and_reload.sh
```
🔥 **Vantagens**:
- **Auto-reload**: Detecta mudanças em `.html`, `.css`, `.js`, `.py`
- **Reinicialização automática** de servidor + ngrok
- **URLs atualizadas** automaticamente
- **Monitoramento em tempo real**

## 📱 **Fluxo de Trabalho Recomendado**

1. **Inicie o modo watch**:
   ```bash
   make admin-watch
   ```

2. **Edite seus arquivos** (admin.html, admin.css, etc.)

3. **Salve** - O sistema detecta automaticamente e:
   - 🔄 Reinicia o servidor
   - 🌐 Atualiza o ngrok
   - 📱 Mostra nova URL

4. **Teste no mobile** usando a URL ngrok mostrada

## 🔧 **O que Acontece Automaticamente**

```
Você salva arquivo → fswatch detecta → Para serviços → 
Inicia servidor → Inicia ngrok → Mostra nova URL → 
Continua monitorando...
```

## 📂 **Arquivos Monitorados**

- `infra/frontend/*.html` - Páginas web
- `infra/frontend/assets/css/*.css` - Estilos
- `infra/frontend/assets/js/*.js` - JavaScript
- `src/bgapp/*.py` - Backend Python

## 🛠️ **Comandos Úteis**

```bash
# Ver URLs ativas do ngrok
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'

# Parar todos os processos
pkill -f "python.*http.server"
pkill -f "ngrok"

# Ver logs do ngrok
curl -s http://localhost:4040/api/tunnels | jq '.'
```

## 📱 **Testando Responsividade**

1. **Desktop**: `http://localhost:8080/admin.html`
2. **Mobile**: Use a URL ngrok no seu celular
3. **DevTools**: F12 → Toggle device toolbar

## ⚠️ **Requisitos**

### macOS:
```bash
brew install fswatch jq
```

### Linux:
```bash
sudo apt install inotify-tools jq
# ou
sudo yum install inotify-tools jq
```

### Python:
```bash
pip install watchdog requests  # Para o script Python
```

## 🔥 **Exemplo de Uso**

```bash
# Inicia modo watch
make admin-watch

# Output:
🎯 BGAPP Admin - Auto-reload com File Watching
==============================================
🚀 Iniciando serviços...
✅ Servidor HTTP: http://localhost:8080/admin.html
🌐 URL Pública: https://abc123.ngrok.io/admin.html
📱 Teste mobile: https://abc123.ngrok.io/admin.html
🔗 Dashboard ngrok: http://localhost:4040

👀 Monitorando mudanças em:
   📂 infra/frontend
   📂 src/bgapp

🔄 Arquivos monitorados: .html, .css, .js, .py
🛑 Pressione Ctrl+C para parar
==============================================

# Quando você edita um arquivo:
🔄 14:30:25 - Mudanças detectadas!
⏳ Reiniciando serviços...
✅ 14:30:28 - Serviços atualizados!
🌐 Nova URL: https://def456.ngrok.io/admin.html
```

## 🎉 **Resultado**

Agora sim! **O ngrok atualiza automaticamente** a cada implementação! 🚀

Você só precisa editar, salvar, e o sistema faz o resto. Perfeito para desenvolvimento mobile responsivo! 📱✨
