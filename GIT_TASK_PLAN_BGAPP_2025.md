# 📋 PLANO DE TAREFAS GIT - CORREÇÕES BGAPP

**Projeto:** BGAPP Marine Angola  
**Data de Criação:** Janeiro 2025  
**Branch Base:** `feature/deckgl-eox-integration`  
**Estimativa Total:** 4-6 semanas

---

## 🌳 ESTRATÉGIA DE BRANCHES

```
main
├── feature/deckgl-eox-integration (atual)
│   ├── fix/critical-security-issues
│   ├── fix/typescript-build-errors
│   ├── fix/memory-leaks
│   ├── fix/dependency-conflicts
│   ├── refactor/code-duplication
│   └── feature/testing-infrastructure
```

---

## 🚨 FASE 1: CORREÇÕES CRÍTICAS (1-2 dias)

### Branch: `fix/critical-security-issues`

#### Issue #1: Remover Configurações Perigosas de Build
```bash
git checkout -b fix/critical-security-issues
```

**Tarefas:**
- [ ] Remover `ignoreBuildErrors: true` de `admin-dashboard/next.config.js`
- [ ] Remover `ignoreDuringBuilds: true` para ESLint
- [ ] Corrigir todos os erros de TypeScript resultantes
- [ ] Corrigir todos os warnings do ESLint

**Arquivos a Modificar:**
- `admin-dashboard/next.config.js`
- `admin-dashboard/next.config.cloudflare.js`
- `admin-dashboard/tsconfig.json`

**Commit Message:**
```
fix(security): remove dangerous build configurations

- Remove ignoreBuildErrors from Next.js config
- Enable ESLint during builds
- Fix resulting TypeScript errors
- Ensure type safety in production builds

BREAKING CHANGE: Build will now fail on TypeScript/ESLint errors
```

#### Issue #2: Remover Credenciais Hardcoded
**Tarefas:**
- [ ] Remover NGROK_AUTHTOKEN de `config/example.env`
- [ ] Mover todas as senhas para variáveis de ambiente
- [ ] Implementar validação de env vars no startup
- [ ] Criar `.env.example` sem valores reais

**Arquivos a Modificar:**
- `config/example.env`
- `env.example`
- `scripts/generate_secure_env.py`
- Todos os workers com URLs hardcoded

**Commit Message:**
```
fix(security): remove hardcoded credentials

- Remove exposed NGROK token
- Move all passwords to environment variables
- Add env validation on startup
- Create safe .env.example template

Security: Rotate all exposed credentials immediately
```

#### Issue #3: Corrigir CORS em Workers
**Tarefas:**
- [ ] Implementar whitelist de domínios permitidos
- [ ] Usar `cors-security-enhanced.js` em todos workers
- [ ] Adicionar validação de origem
- [ ] Implementar rate limiting

**Arquivos a Modificar:**
- `workers/admin-api-worker.js`
- `workers/api-worker.js`
- Todos os outros workers (9 arquivos)

**Commit Message:**
```
fix(security): implement proper CORS configuration

- Replace wildcard CORS with domain whitelist
- Implement origin validation
- Add rate limiting to all workers
- Use centralized CORS security module

Security: Prevents unauthorized cross-origin requests
```

---

## 🟡 FASE 2: CORREÇÕES DE ALTA PRIORIDADE (3-5 dias)

### Branch: `fix/typescript-build-errors`

#### Issue #4: Substituir Tipos `any`
**Tarefas:**
- [ ] Criar interfaces para todas as respostas da API
- [ ] Substituir 160+ ocorrências de `any`
- [ ] Adicionar tipos para props de componentes
- [ ] Validar tipos em runtime com zod/yup

**Commit Message:**
```
fix(types): replace any types with proper interfaces

- Add interfaces for all API responses
- Replace 160+ any occurrences
- Add component prop types
- Implement runtime type validation
```

### Branch: `fix/memory-leaks`

#### Issue #5: Corrigir Memory Leaks em React
**Tarefas:**
- [ ] Adicionar cleanup em todos useEffect
- [ ] Cancelar todos os timers no unmount
- [ ] Remover event listeners
- [ ] Implementar AbortController para fetches

**Arquivos Principais:**
- `admin-dashboard/src/components/dashboard/qgis-spatial-analysis.tsx`
- `admin-dashboard/src/components/dashboard/ml-predictive-filters.tsx`
- `admin-dashboard/src/components/dashboard/bgapp-integration-bulletproof.tsx`

**Commit Message:**
```
fix(performance): resolve memory leaks in React components

- Add cleanup functions to all useEffect hooks
- Clear intervals and timeouts on unmount
- Remove event listeners properly
- Implement AbortController for fetch requests
```

### Branch: `fix/dependency-conflicts`

#### Issue #6: Resolver Conflitos de Dependências
**Tarefas:**
- [ ] Unificar React para versão 18.2.0
- [ ] Unificar TypeScript para versão 5.3.3
- [ ] Resolver duplicação do pandas
- [ ] Atualizar package-lock.json
- [ ] Testar build completo

**Commit Message:**
```
fix(deps): resolve dependency version conflicts

- Unify React to v18.2.0 across all packages
- Standardize TypeScript to v5.3.3
- Remove duplicate pandas entries
- Update lock files
```

---

## 🟢 FASE 3: REFATORAÇÃO E MELHORIAS (1-2 semanas)

### Branch: `refactor/code-duplication`

#### Issue #7: Eliminar Duplicação de Código
**Tarefas:**
- [ ] Criar `utils/douglas-peucker.ts` compartilhado
- [ ] Centralizar funções de fetch em hooks
- [ ] Criar componentes reutilizáveis
- [ ] Extrair configurações comuns

**Nova Estrutura Proposta:**
```
src/
├── utils/
│   ├── algorithms/
│   │   └── douglas-peucker.ts
│   ├── api/
│   │   └── fetch-utils.ts
│   └── hooks/
│       ├── useApiData.ts
│       └── useAutoRefresh.ts
├── components/
│   └── shared/
│       ├── LoadingState.tsx
│       └── ErrorBoundary.tsx
```

**Commit Message:**
```
refactor: eliminate code duplication

- Extract Douglas-Peucker to shared utility
- Centralize fetch logic in custom hooks
- Create reusable components
- Extract common configurations
```

### Branch: `feature/testing-infrastructure`

#### Issue #8: Implementar Testes
**Tarefas:**
- [ ] Configurar Jest + React Testing Library
- [ ] Configurar pytest para Python
- [ ] Escrever testes unitários para funções críticas
- [ ] Implementar testes de integração
- [ ] Configurar CI/CD com testes

**Estrutura de Testes:**
```
tests/
├── unit/
│   ├── components/
│   ├── utils/
│   └── api/
├── integration/
│   ├── api/
│   └── workers/
└── e2e/
    └── flows/
```

**Commit Message:**
```
feat(tests): implement testing infrastructure

- Setup Jest and React Testing Library
- Configure pytest for Python code
- Add unit tests for critical functions
- Implement integration tests
- Setup CI/CD test pipeline
```

---

## 🔄 FASE 4: MANUTENÇÃO E LIMPEZA (1 semana)

### Branch: `chore/cleanup-and-organize`

#### Issue #9: Organização e Limpeza
**Tarefas:**
- [ ] Remover arquivos de backup antigos
- [ ] Consolidar scripts duplicados
- [ ] Organizar documentação
- [ ] Remover console.logs
- [ ] Limpar imports não utilizados

**Commit Message:**
```
chore: cleanup and organize codebase

- Remove old backup files
- Consolidate duplicate scripts
- Organize documentation structure
- Remove console.log statements
- Clean unused imports
```

#### Issue #10: Melhorar Documentação
**Tarefas:**
- [ ] Atualizar README principal
- [ ] Documentar APIs com OpenAPI
- [ ] Criar guia de contribuição
- [ ] Adicionar JSDoc/TSDoc
- [ ] Criar CHANGELOG.md

**Commit Message:**
```
docs: improve project documentation

- Update main README with current info
- Add OpenAPI documentation
- Create contribution guidelines
- Add JSDoc/TSDoc comments
- Initialize CHANGELOG
```

---

## 📊 MÉTRICAS DE SUCESSO

### Antes das Correções:
- ❌ Build ignora erros
- ❌ 160+ usos de `any`
- ❌ Memory leaks ativos
- ❌ 0% cobertura de testes
- ❌ Credenciais expostas

### Após as Correções:
- ✅ Build falha em erros (como esperado)
- ✅ <10 usos justificados de `any`
- ✅ Sem memory leaks
- ✅ >70% cobertura de testes
- ✅ Credenciais seguras

---

## 🚀 COMANDOS GIT ÚTEIS

### Criar todas as branches de uma vez:
```bash
# Script para criar estrutura de branches
for branch in fix/critical-security-issues fix/typescript-build-errors fix/memory-leaks fix/dependency-conflicts refactor/code-duplication feature/testing-infrastructure chore/cleanup-and-organize; do
    git checkout -b $branch feature/deckgl-eox-integration
    git checkout feature/deckgl-eox-integration
done
```

### Workflow de Merge:
```bash
# Após completar cada branch
git checkout feature/deckgl-eox-integration
git merge --no-ff fix/critical-security-issues
git push origin feature/deckgl-eox-integration
```

### Tags de Versão:
```bash
git tag -a v2.1.0-security -m "Security fixes implemented"
git tag -a v2.2.0-stable -m "All critical issues resolved"
git push --tags
```

---

## 📅 CRONOGRAMA SUGERIDO

| Semana | Segunda | Terça | Quarta | Quinta | Sexta |
|--------|---------|--------|---------|---------|--------|
| **1** | Security Issues | Security Issues | TypeScript Fixes | Memory Leaks | Memory Leaks |
| **2** | Dependencies | Dependencies | Code Duplication | Code Duplication | Testing Setup |
| **3** | Write Tests | Write Tests | Write Tests | Documentation | Documentation |
| **4** | Cleanup | Cleanup | Review | Deploy | Monitor |

---

## ✅ CHECKLIST FINAL

### Antes do Merge para Main:
- [ ] Todos os testes passando
- [ ] Sem erros de TypeScript
- [ ] Sem warnings do ESLint
- [ ] Code review aprovado
- [ ] Documentação atualizada
- [ ] CHANGELOG atualizado
- [ ] Performance testada
- [ ] Segurança validada

### Após o Deploy:
- [ ] Monitorar erros (Sentry)
- [ ] Verificar performance
- [ ] Validar funcionalidades
- [ ] Backup do estado anterior
- [ ] Comunicar mudanças ao time

---

## 🔗 ISSUES DO GITHUB RELACIONADAS

Criar issues para cada item principal:

```markdown
# Template de Issue

## 🐛 Bug: [Título]

### Descrição
[Descrição detalhada do problema]

### Passos para Reproduzir
1. 
2. 
3. 

### Comportamento Esperado
[O que deveria acontecer]

### Comportamento Atual
[O que está acontecendo]

### Screenshots
[Se aplicável]

### Informações Adicionais
- Severidade: [Crítica/Alta/Média/Baixa]
- Componente: [Frontend/Backend/Worker]
- Estimativa: [Horas]
```

---

## 📞 PONTOS DE CONTATO

- **Tech Lead:** Marcos Santos
- **Code Review:** Team Lead
- **Deploy Approval:** DevOps Team
- **Security Review:** Security Team

---

**Documento Gerado:** Janeiro 2025  
**Última Atualização:** Janeiro 2025  
**Próxima Revisão:** Fevereiro 2025

---

*Este plano deve ser revisado e ajustado conforme necessário durante a implementação.*