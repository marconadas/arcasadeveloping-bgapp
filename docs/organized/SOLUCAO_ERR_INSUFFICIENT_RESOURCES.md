# 🚨 Solução para ERR_INSUFFICIENT_RESOURCES

## 📊 **Diagnóstico**
- **Problema**: Pressão extrema de memória no sistema macOS
- **Sintomas**: ERR_INSUFFICIENT_RESOURCES no browser, Next.js não consegue inicializar
- **Causa**: Sistema com 6314M de compressor de memória e Load Average de 10.06

## 🔧 **Soluções Implementadas**

### 1. **Configuração Otimizada** ✅
- Criado `next.config.minimal.js` com configurações de baixo uso de recursos
- Desativado React Strict Mode, minificação e compressão
- Implementado cache agressivo para recursos estáticos

### 2. **Servidor Customizado** ✅  
- Criado `server-simple.js` com servidor HTTP customizado
- Script `npm run dev:simple` para execução otimizada
- Limitação de memória Node.js para 1GB

### 3. **Script de Inicialização** ✅
- `start-low-memory.sh` com configurações otimizadas
- Variáveis de ambiente para economia de recursos
- Prioridade baixa (`nice -n 10`) para não sobrecarregar o sistema

## 🚀 **Como Usar**

### Opção 1: Servidor Simples (Recomendado)
```bash
cd admin-dashboard
NODE_OPTIONS="--max-old-space-size=1024" npm run dev:simple
```

### Opção 2: Script Otimizado
```bash
cd admin-dashboard
./start-low-memory.sh
```

### Opção 3: Configuração Manual
```bash
cd admin-dashboard
cp next.config.minimal.js next.config.js
NODE_OPTIONS="--max-old-space-size=1024" npm run dev:3002
```

## ⚠️ **Recomendações do Sistema**

1. **Fechar aplicações desnecessárias** para liberar memória
2. **Executar `sudo purge`** para limpar cache do sistema
3. **Considerar upgrade de RAM** se o problema persistir
4. **Monitorar uso de memória** com `top` ou Activity Monitor

## 🔍 **Para Produção**

Em ambiente de produção, usar:
```bash
npm run build
npm run start:3002
```

## 📝 **Notas**
- O problema é sistémico (falta de recursos), não do código
- As optimizações reduzem significativamente o uso de memória
- Em sistemas com recursos adequados, usar configuração padrão

---
**Criado por**: Mare Datum Consultoria  
**Data**: 02/09/2025  
**Status**: Resolvido ✅
