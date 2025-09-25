# 🔐 Guia de Configuração TOTP - Copernicus CDSE

## ⚠️ **IMPORTANTE: 2FA é obrigatório**

O Copernicus Data Space Ecosystem agora **exige 2FA** para todas as APIs autenticadas (OData, STAC).

## 📱 **1. Ativar 2FA na conta Copernicus**

1. Acede a: https://identity.dataspace.copernicus.eu/auth/realms/CDSE/account/
2. Login com: `majearcasa@gmail.com` / `ShadowZoro!.1995`
3. Vai a **"Account Security"** → **"Two-factor Authentication"**
4. Clica **"Set up Authenticator Application"**
5. **IMPORTANTE**: Guarda o **Base32 Secret** que aparece (ex: `ONGFITRRN44DIMCRHBHHQSDRMZUFMNCP`)

## 📲 **2. Configurar App Authenticator**

- **Google Authenticator**, **Authy**, **Microsoft Authenticator**, etc.
- Escaneia o QR Code OU insere manualmente o Base32 secret
- A app vai gerar códigos de 6 dígitos que mudam a cada 30 segundos

## 🔧 **3. Configurar Worker**

```bash
# Navegar para o diretório do worker
cd copernicus-official/workers

# Configurar secrets (NÃO fazer commit destes valores!)
wrangler secret put COPERNICUS_USERNAME --env production --name bgapp-copernicus-official
# Inserir: majearcasa@gmail.com

wrangler secret put COPERNICUS_PASSWORD --env production --name bgapp-copernicus-official  
# Inserir: ShadowZoro!.1995

wrangler secret put COPERNICUS_TOTP_SECRET --env production --name bgapp-copernicus-official
# Inserir: O Base32 secret da configuração 2FA (ex: ONGFITRRN44DIMCRHBHHQSDRMZUFMNCP)
```

## 🧪 **4. Teste Local**

```bash
# Testar autenticação com cURL (substitui <TOTP> pelo código atual da app)
curl -s -X POST \
  'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=password' \
  --data-urlencode 'client_id=cdse-public' \
  --data-urlencode 'username=majearcasa@gmail.com' \
  --data-urlencode 'password=ShadowZoro!.1995' \
  --data-urlencode 'totp=123456'
```

## ✅ **5. Verificar Funcionamento**

Após configurar o TOTP secret:

```bash
# Deploy do worker
wrangler deploy copernicus-official-worker.js --config wrangler.toml --env production

# Testar endpoints
curl https://bgapp-copernicus-official.majearcasa.workers.dev/copernicus/auth
curl https://bgapp-copernicus-official.majearcasa.workers.dev/copernicus/angola-marine
```

## 🔍 **Troubleshooting**

### Erro "invalid_grant"
- ✅ TOTP correto e dentro da janela de 30s
- ✅ Base32 secret correto (sem espaços)
- ✅ Credenciais corretas

### Erro 403 nas APIs
- ✅ Token válido mas falta permissão "Product Catalogue"
- 📧 Abrir ticket: "Please enable Product Catalogue API (OData/STAC) for my account"

### Timing Issues
- ⏰ Worker usa tempo de servidor (normalmente correto)
- 🔄 Gerar TOTP imediatamente antes do request

## 📋 **Status Esperados**

- **ONLINE**: OData + STAC + OpenSearch funcionam (3/3 APIs)
- **PARTIAL**: Só OpenSearch funciona (1/3 APIs) - normal até ativar Product Catalogue
- **OFFLINE**: Nenhuma API funciona (0/3 APIs)