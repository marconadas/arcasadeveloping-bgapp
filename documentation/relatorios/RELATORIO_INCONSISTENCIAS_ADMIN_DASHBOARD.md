# Relatório de Inconsistências - BGAPP Admin Dashboard

## 1. Resumo Executivo

### 1.1. Situação Atual
O admin-dashboard do BGAPP está deployado em https://bgapp-admin.pages.dev/ mas apresenta várias inconsistências que afetam a experiência do usuário e a funcionalidade do sistema.

### 1.2. Principais Problemas Identificados
1. URLs de metadados incorretas (apontando para localhost)
2. Configuração de ambiente não adaptativa
3. Possíveis problemas de hydration do Next.js
4. Arquivos HTML estáticos duplicados

## 2. Análise Detalhada das Inconsistências

### 2.1. URLs de Metadados Incorretas

#### 2.1.1. Problema
As meta tags OpenGraph no HTML gerado estão com URLs absolutas incorretas:
```html
<meta property="og:image" content="http://localhost:3000/logo.png"/>
<meta name="twitter:image" content="http://localhost:3000/logo.png"/>
```

#### 2.1.2. Localização
- Arquivo: `/admin-dashboard/src/app/layout.tsx`
- Linhas: 26-32 (OpenGraph) e 40 (Twitter)

#### 2.1.3. Impacto
- Compartilhamentos em redes sociais não mostram a imagem correta
- SEO prejudicado
- Aparência não profissional

#### 2.1.4. Solução Proposta
Usar URLs relativas ou detectar o ambiente dinamicamente:
```typescript
images: [
  {
    url: '/logo.png', // URL relativa
    width: 800,
    height: 600,
    alt: 'BGAPP Marine Angola Logo',
  },
],
```

### 2.2. Configuração de Ambiente Estática

#### 2.2.1. Problema
O arquivo `src/config/environment.ts` tem valores hardcoded:
```typescript
baseUrl: 'http://localhost:3000',
```

#### 2.2.2. Impacto
- URLs incorretas em produção
- Chamadas de API falham
- IFrames não carregam corretamente

#### 2.2.3. Solução Proposta
Implementar detecção dinâmica de ambiente:
```typescript
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://bgapp-admin.pages.dev';
};
```

### 2.3. Problemas de Build e Export

#### 2.3.1. Configuração Next.js
O arquivo `next.config.js` está configurado para export estático:
```javascript
output: 'export',
trailingSlash: true,
skipTrailingSlashRedirect: true,
```

#### 2.3.2. Problemas Identificados
- TypeScript errors ignorados (`ignoreBuildErrors: true`)
- ESLint desabilitado durante build
- Possível perda de validação de código

### 2.4. Arquivos HTML Duplicados

#### 2.4.1. Arquivos Encontrados
```
/public/bgapp-enhanced-ocean-system.html
/public/bgapp-enhanced-ocean-system 2.html
/public/qgis_dashboard.html
/public/qgis_dashboard 2.html
```

#### 2.4.2. Impacto
- Confusão sobre qual arquivo usar
- Possível versionamento incorreto
- Desperdício de espaço

### 2.5. URLs de Serviços em Produção

#### 2.5.1. Problema
O arquivo `dashboard-content.tsx` tem múltiplas referências a localhost:
```typescript
- localhost:8000 (API Admin)
- localhost:8081 (STAC API)
- localhost:8082 (STAC Browser)
- localhost:5080 (PyGeoAPI)
- localhost:8083 (Keycloak)
- localhost:5555 (Flower)
- localhost:9001 (MinIO)
```

#### 2.5.2. Solução
Usar o sistema de URLs dinâmicas já implementado em `environment-urls.ts`

## 3. Plano de Correção

### 3.1. Prioridade Alta
1. Corrigir URLs de metadados no layout.tsx
2. Implementar detecção dinâmica de ambiente
3. Atualizar todas as referências localhost no dashboard-content.tsx

### 3.2. Prioridade Média
1. Limpar arquivos HTML duplicados
2. Revisar configuração do Next.js
3. Implementar variáveis de ambiente adequadas

### 3.3. Prioridade Baixa
1. Adicionar testes de integração
2. Melhorar logging e monitoramento
3. Documentar processo de deployment

## 4. Comandos de Verificação

### 4.1. Verificar URLs localhost no código
```bash
grep -r "localhost" admin-dashboard/src --include="*.tsx" --include="*.ts"
```

### 4.2. Build local para teste
```bash
cd admin-dashboard
npm run build
npx serve out -p 3000
```

### 4.3. Deploy para Cloudflare
```bash
./quick-deploy.sh
```

## 5. Recomendações Imediatas

### 5.1. Correção Urgente
1. **Atualizar layout.tsx** - Remover referências absolutas a localhost
2. **Usar environment-urls.ts** - Aplicar o sistema já existente em todos os componentes
3. **Testar em produção** - Verificar se as correções resolvem os problemas

### 5.2. Melhorias de Processo
1. Implementar CI/CD com validação de URLs
2. Adicionar testes E2E para verificar links
3. Criar checklist de deployment

## 6. Conclusão

O admin-dashboard tem uma estrutura sólida mas precisa de ajustes importantes nas configurações de ambiente e URLs. As correções são relativamente simples e podem ser implementadas rapidamente seguindo as recomendações deste relatório.

### 6.1. Tempo Estimado
- Correções urgentes: 2-3 horas
- Melhorias completas: 1-2 dias
- Testes e validação: 4 horas

### 6.2. Risco
- **Atual**: Alto (funcionalidades quebradas em produção)
- **Após correções**: Baixo

---

**Documento gerado em**: 12 de Setembro de 2025
**Responsável**: Sistema de Análise Automatizada BGAPP
**Versão**: 1.0
