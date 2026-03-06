# 🚀 Guia Rápido: Incorporar Logo Neptune

## Método Mais Simples (2 passos)

### 1️⃣ Salvar a Imagem

**Clique com botão direito** na imagem do logo Neptune que você enviou acima e:

1. Escolha "**Salvar Imagem Como...**" ou "**Save Image As...**"
2. Navegue até:
   ```
   /Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp/
   ```
3. Salve com o nome: **`logo.png`**

### 2️⃣ Executar Deploy

Abra o Terminal e execute:

```bash
cd /Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp
./deploy-neptune.sh
```

## ✅ Pronto!

O logo Neptune aparecerá em:
- https://bgapp-frontend.pages.dev (canto superior esquerdo)

---

## Alternativa: Com Script Automático

Se você salvou a imagem como `logo.png` no diretório principal, pode usar:

```bash
cd /Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp
./atualizar-logo-neptune.sh
```

Este script:
- ✅ Faz backup do logo antigo
- ✅ Copia o novo logo
- ✅ Pergunta se quer fazer deploy
- ✅ Deploy automático (se você quiser)

---

## 🎨 Preview do Logo

O logo Neptune contém:
- 🌊 Oceano em camadas (gradiente azul)
- 🚢 Barco de pesquisa
- 🛰️ Satélite
- ⭐ Estrelas
- 🪐 Planetas

Cores Neptune Blue: #4facfe e #00f2fe

---

## Onde o Logo Aparece

```
┌─────────────────────────────────────────┐
│  [LOGO]  NEPTUNE                        │
│          Plataforma de Análise...       │
└─────────────────────────────────────────┘
```

Tamanho: 60x60px no header
Animação: Float suave (3s)

---

## Troubleshooting

**Logo não aparece?**
1. Verifique se o arquivo é `logo.png` (não `logo.jpg` ou outro formato)
2. Verifique se está no diretório correto
3. Execute: `ls -la logo.png` para confirmar

**Quer ver localmente antes do deploy?**
```bash
# Abrir no navegador
open apps/frontend/BGAPP/index-neptune.html
```

---

**Criado por:** MareDatum - Neptune Team  
**Data:** 12 de Novembro de 2025




