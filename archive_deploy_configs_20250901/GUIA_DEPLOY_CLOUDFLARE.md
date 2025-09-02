# 🚀 Guia de Deploy BGAPP para arcasadeveloping.org

## 📋 Resumo do Deploy

✅ **Projeto:** BGAPP - Mapa Meteorológico Interativo  
✅ **Domínio:** arcasadeveloping.org  
✅ **Página Principal:** index.html (configurado)  
✅ **Testes:** 4/4 aprovados (100% funcional)  
✅ **Serviços:** 5/6 operacionais (83% disponibilidade)

## 🌐 Opção 1: Deploy via Cloudflare Pages (Recomendado)

### Passo 1: Preparar Repositório Git

```bash
# Criar repositório Git no diretório de deploy
cd deploy_arcasadeveloping
git init
git add .
git commit -m "Initial BGAPP deployment for arcasadeveloping.org"

# Conectar com repositório remoto (GitHub/GitLab)
git remote add origin https://github.com/seu-usuario/arcasadeveloping-bgapp.git
git push -u origin main
```

### Passo 2: Configurar Cloudflare Pages

1. **Acesse o Painel Cloudflare:**
   - Vá para https://dash.cloudflare.com
   - Selecione sua conta

2. **Criar Novo Projeto:**
   - Vá para "Workers & Pages"
   - Clique em "Create application"
   - Selecione "Pages"
   - Conecte seu repositório Git

3. **Configurações de Build:**
   ```
   Framework preset: None
   Build command: (deixar vazio)
   Build output directory: /
   Root directory: /
   ```

4. **Variáveis de Ambiente:**
   ```
   NODE_ENV=production
   DOMAIN=arcasadeveloping.org
   ```

### Passo 3: Configurar Domínio Personalizado

1. **No projeto Cloudflare Pages:**
   - Vá para "Custom domains"
   - Clique "Set up a custom domain"
   - Digite: `arcasadeveloping.org`
   - Siga as instruções de verificação DNS

2. **Configurar DNS:**
   - Tipo: CNAME
   - Nome: @ (ou deixar vazio)
   - Valor: seu-projeto.pages.dev
   - TTL: Auto

### Passo 4: Configurações Avançadas

1. **Redirects e Headers (_redirects file):**
   ```
   # Garantir que index.html seja servido na raiz
   /  /index.html  200
   
   # Headers de segurança
   /*  X-Frame-Options: SAMEORIGIN
   /*  X-Content-Type-Options: nosniff
   /*  X-XSS-Protection: 1; mode=block
   ```

2. **Cache Settings:**
   - HTML: 1 hora
   - CSS/JS: 1 ano
   - Imagens: 1 ano

## 🖥️ Opção 2: Deploy via FTP/SFTP Tradicional

### Configurar Credenciais

1. **Editar upload_to_server.sh:**
   ```bash
   nano upload_to_server.sh
   
   # Alterar as variáveis:
   FTP_USER="seu_usuario_ftp"
   FTP_PASS="sua_senha_ftp"
   REMOTE_DIR="/public_html"  # ou /www, /htdocs
   ```

2. **Executar Upload:**
   ```bash
   ./upload_to_server.sh
   ```

### Configurar .htaccess (Apache)

O arquivo `.htaccess` já está incluído com:
- DirectoryIndex index.html
- Headers de segurança
- Configurações de cache
- Redirecionamento HTTPS
- Compressão GZIP

## 🔧 Verificações Pós-Deploy

### 1. Teste Básico
```bash
curl -I https://arcasadeveloping.org
# Deve retornar 200 OK
```

### 2. Verificar index.html
- Acesse: https://arcasadeveloping.org
- Deve carregar automaticamente a página do BGAPP
- Verificar se o mapa aparece

### 3. Teste de Funcionalidades
- ✅ Painel lateral funcionando
- ✅ Botões de camadas responsivos
- ✅ Mapas carregando (OpenStreetMap, CartoDB, ESRI)
- ⚠️ EOX Maps pode estar indisponível (fallback automático)
- ✅ PWA funcionando (pode ser instalado)

### 4. Teste Mobile
- Abrir em dispositivo móvel
- Verificar responsividade
- Testar gestos de toque

## 🛡️ Configurações de Segurança

### SSL/TLS (Cloudflare)
- Modo: "Full (strict)" recomendado
- "Always Use HTTPS": Ativado
- "Automatic HTTPS Rewrites": Ativado

### Firewall Rules
```
(http.host eq "arcasadeveloping.org" and http.request.method eq "GET") or 
(http.host eq "arcasadeveloping.org" and http.request.method eq "POST" and http.request.uri.path contains "/api/")
```

## 📊 Monitoramento

### Métricas a Acompanhar
- **Tempo de carregamento:** < 3 segundos
- **Disponibilidade:** > 99%
- **Erros 4xx/5xx:** < 1%
- **Core Web Vitals:** Verde no PageSpeed Insights

### Alertas Recomendados
- Site indisponível > 5 minutos
- Tempo de resposta > 5 segundos
- Erros > 10 por minuto

## 🔄 Atualizações Futuras

### Processo de Atualização
1. Fazer alterações no código fonte
2. Executar: `python3 ../deploy_to_arcasadeveloping.py`
3. Commit e push para o repositório
4. Cloudflare Pages fará deploy automático

### Rollback
```bash
# Via Cloudflare Pages
# Ir para "Deployments" e clicar em "Rollback" no deployment anterior
```

## 🆘 Troubleshooting

### Problema: Site não carrega
```bash
# Verificar DNS
nslookup arcasadeveloping.org

# Verificar certificado SSL
openssl s_client -connect arcasadeveloping.org:443 -servername arcasadeveloping.org
```

### Problema: Mapas não aparecem
- Verificar console do navegador (F12)
- Confirmar se serviços externos estão funcionando
- Executar: `python3 ../verify_services_production.py`

### Problema: PWA não instala
- Verificar manifest.json
- Confirmar HTTPS ativo
- Verificar Service Worker

## 📞 Suporte

**Contato Técnico:**
- Email: majearcasa@gmail.com
- Organização: ARCASA DEVELOPING

**Documentação:**
- README.md (neste diretório)
- service_status_report.json (status dos serviços)
- deployment_info.json (informações do deployment)

## ✅ Checklist Final

- [ ] Arquivos copiados para deploy_arcasadeveloping/
- [ ] Testes locais passaram (4/4)
- [ ] Serviços externos verificados (5/6 funcionais)
- [ ] Repositório Git configurado (se usando Cloudflare Pages)
- [ ] Credenciais FTP configuradas (se usando FTP)
- [ ] DNS apontando para Cloudflare
- [ ] SSL/TLS configurado
- [ ] index.html como página principal confirmado
- [ ] Teste final em https://arcasadeveloping.org

---

🎉 **Deploy pronto para produção!** 

O BGAPP está totalmente configurado e testado para funcionar em arcasadeveloping.org com index.html como página principal obrigatória.
