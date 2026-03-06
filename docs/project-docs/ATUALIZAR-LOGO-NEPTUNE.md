# 🎨 Como Atualizar o Logo Neptune

## Passo 1: Salvar a Imagem do Logo

1. **Salve a imagem que você enviou** (o logo Neptune com barco, satélite e estrelas) como:

```bash
# Caminho principal (para a página local)
/Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp/logo.png

# Caminho BGAPP (para deployment)
/Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp/apps/frontend/BGAPP/logo.png
```

## Passo 2: Executar o Script de Atualização

Depois de salvar a imagem, execute:

```bash
cd /Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp
./atualizar-logo-neptune.sh
```

## Ou Manualmente:

### Opção A: Via Finder (Mais Fácil)

1. Clique com botão direito na imagem do Neptune que você enviou
2. Escolha "Salvar Imagem Como..."
3. Salve como `logo.png` em:
   - `/Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp/`
   - `/Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp/apps/frontend/BGAPP/`

### Opção B: Via Terminal

Se você tem a imagem na pasta de Downloads:

```bash
cd /Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp

# Copiar do Downloads (ajuste o nome se necessário)
cp ~/Downloads/neptune-logo.png logo.png
cp ~/Downloads/neptune-logo.png apps/frontend/BGAPP/logo.png
```

## Passo 3: Fazer Redeploy

```bash
./deploy-neptune.sh
```

## Verificar

Após o deploy, verifique em:
- https://bgapp-frontend.pages.dev

O logo deve aparecer no canto superior esquerdo do header!




