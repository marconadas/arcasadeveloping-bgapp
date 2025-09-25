# 🌳 TAREFAS GIT ORGANIZADAS POR BRANCHES

**Projeto:** BGAPP Marine Angola  
**Data:** Janeiro 2025  
**Branch Principal:** `feature/deckgl-eox-integration`

---

## 📊 ESTRUTURA DE BRANCHES E TAREFAS

```
main
└── feature/deckgl-eox-integration
    ├── fix/critical-security
    ├── fix/typescript-errors
    ├── fix/memory-leaks
    ├── fix/dependencies
    ├── refactor/remove-duplication
    └── chore/cleanup
```

---

## 🔴 BRANCH: `fix/critical-security`
**Prioridade:** CRÍTICA | **Prazo:** 2 dias

### Criar branch:
```bash
git checkout -b fix/critical-security feature/deckgl-eox-integration
```

### Tarefas:
```bash
# Task 1: Remover configurações perigosas de build
git add admin-dashboard/next.config.js
git commit -m "fix(security): remove ignoreBuildErrors from Next.js config"

# Task 2: Remover credenciais hardcoded
git add config/example.env env.example
git commit -m "fix(security): remove hardcoded credentials from env files"

# Task 3: Corrigir CORS em todos os workers
git add workers/*.js
git commit -m "fix(security): implement CORS whitelist in all workers"

# Task 4: Remover console.logs de produção
git add -A
git commit -m "fix(security): remove console.log statements from production"

# Task 5: Adicionar validação de ambiente
git add src/bgapp/core/env_validator.py
git commit -m "feat(security): add environment variables validation"
```

### Merge:
```bash
git checkout feature/deckgl-eox-integration
git merge --no-ff fix/critical-security -m "Merge branch 'fix/critical-security' - Security fixes"
```

---

## 🟡 BRANCH: `fix/typescript-errors`
**Prioridade:** ALTA | **Prazo:** 3 dias

### Criar branch:
```bash
git checkout -b fix/typescript-errors feature/deckgl-eox-integration
```

### Tarefas:
```bash
# Task 1: Criar interfaces para APIs
git add admin-dashboard/src/types/api.ts
git commit -m "feat(types): add API response interfaces"

# Task 2: Substituir any em componentes dashboard
git add admin-dashboard/src/components/dashboard/*.tsx
git commit -m "fix(types): replace any with proper types in dashboard components"

# Task 3: Substituir any em hooks
git add admin-dashboard/src/hooks/*.ts
git add admin-dashboard/src/lib/bgapp/hooks.ts
git commit -m "fix(types): add proper typing to custom hooks"

# Task 4: Tipar props de componentes
git add admin-dashboard/src/components/**/*.tsx
git commit -m "fix(types): add proper prop types to all components"

# Task 5: Adicionar validação runtime
git add admin-dashboard/src/lib/validation.ts
git commit -m "feat(types): add runtime type validation with zod"
```

### Merge:
```bash
git checkout feature/deckgl-eox-integration
git merge --no-ff fix/typescript-errors -m "Merge branch 'fix/typescript-errors' - TypeScript improvements"
```

---

## 🔵 BRANCH: `fix/memory-leaks`
**Prioridade:** ALTA | **Prazo:** 2 dias

### Criar branch:
```bash
git checkout -b fix/memory-leaks feature/deckgl-eox-integration
```

### Tarefas:
```bash
# Task 1: Adicionar cleanup em useEffect - Dashboard
git add admin-dashboard/src/components/dashboard/qgis-spatial-analysis.tsx
git add admin-dashboard/src/components/dashboard/ml-predictive-filters.tsx
git commit -m "fix(memory): add cleanup functions to dashboard useEffect hooks"

# Task 2: Adicionar cleanup em useEffect - Integration
git add admin-dashboard/src/components/dashboard/bgapp-integration-bulletproof.tsx
git add admin-dashboard/src/components/dashboard/bgapp-integration.tsx
git commit -m "fix(memory): add cleanup to integration components"

# Task 3: Implementar AbortController
git add admin-dashboard/src/lib/api.ts
git add admin-dashboard/src/lib/api-complete.ts
git commit -m "fix(memory): implement AbortController for fetch requests"

# Task 4: Limpar timers e intervals
git add admin-dashboard/src/components/dashboard/realtime-metrics.tsx
git add admin-dashboard/src/components/dashboard/qgis-temporal-visualization.tsx
git commit -m "fix(memory): clear all timers on component unmount"

# Task 5: Remover event listeners
git add admin-dashboard/src/components/maps/*.tsx
git commit -m "fix(memory): properly remove event listeners"
```

### Merge:
```bash
git checkout feature/deckgl-eox-integration
git merge --no-ff fix/memory-leaks -m "Merge branch 'fix/memory-leaks' - Memory leak fixes"
```

---

## 🟢 BRANCH: `fix/dependencies`
**Prioridade:** MÉDIA | **Prazo:** 2 dias

### Criar branch:
```bash
git checkout -b fix/dependencies feature/deckgl-eox-integration
```

### Tarefas:
```bash
# Task 1: Unificar versões do React
git add package.json admin-dashboard/package.json
git commit -m "fix(deps): unify React version to 18.2.0"

# Task 2: Unificar versões do TypeScript
git add package.json admin-dashboard/package.json bgapp-workflow/package.json
git commit -m "fix(deps): unify TypeScript version to 5.3.3"

# Task 3: Resolver duplicação Python
git add requirements.txt requirements-admin.txt
git commit -m "fix(deps): resolve pandas duplication in requirements"

# Task 4: Atualizar lock files
git add package-lock.json
git commit -m "fix(deps): update package-lock.json"

# Task 5: Remover dependências não utilizadas
git add package.json requirements.txt
git commit -m "chore(deps): remove unused dependencies"
```

### Merge:
```bash
git checkout feature/deckgl-eox-integration
git merge --no-ff fix/dependencies -m "Merge branch 'fix/dependencies' - Dependency fixes"
```

---

## 🔧 BRANCH: `refactor/remove-duplication`
**Prioridade:** MÉDIA | **Prazo:** 3 dias

### Criar branch:
```bash
git checkout -b refactor/remove-duplication feature/deckgl-eox-integration
```

### Tarefas:
```bash
# Task 1: Extrair algoritmo Douglas-Peucker
mkdir -p src/utils/algorithms
git add src/utils/algorithms/douglas-peucker.py
git commit -m "refactor: extract Douglas-Peucker algorithm to shared utility"

# Task 2: Centralizar funções de fetch
git add admin-dashboard/src/hooks/useApiData.ts
git add admin-dashboard/src/hooks/useAutoRefresh.ts
git commit -m "refactor: centralize fetch logic in custom hooks"

# Task 3: Criar componentes compartilhados
git add admin-dashboard/src/components/shared/LoadingState.tsx
git add admin-dashboard/src/components/shared/ErrorBoundary.tsx
git commit -m "refactor: create shared components"

# Task 4: Extrair configurações comuns
git add src/config/common.py
git add admin-dashboard/src/config/shared.ts
git commit -m "refactor: extract common configurations"

# Task 5: Remover código duplicado Python
git add scripts/utils/common.py
git commit -m "refactor: consolidate duplicate Python utilities"
```

### Merge:
```bash
git checkout feature/deckgl-eox-integration
git merge --no-ff refactor/remove-duplication -m "Merge branch 'refactor/remove-duplication' - Code deduplication"
```

---

## 🧹 BRANCH: `chore/cleanup`
**Prioridade:** BAIXA | **Prazo:** 2 dias

### Criar branch:
```bash
git checkout -b chore/cleanup feature/deckgl-eox-integration
```

### Tarefas:
```bash
# Task 1: Remover arquivos de backup
git rm -r _organization/backups/
git rm -r _organization/temp/
git commit -m "chore: remove old backup files"

# Task 2: Limpar imports não utilizados
git add admin-dashboard/src/**/*.{ts,tsx}
git commit -m "chore: remove unused imports"

# Task 3: Organizar documentação
mkdir -p docs/current
git add docs/
git commit -m "chore: reorganize documentation structure"

# Task 4: Remover scripts duplicados
git rm scripts/*_old.py scripts/*_backup.sh
git commit -m "chore: remove duplicate scripts"

# Task 5: Atualizar .gitignore
git add .gitignore
git commit -m "chore: update gitignore with proper patterns"
```

### Merge:
```bash
git checkout feature/deckgl-eox-integration
git merge --no-ff chore/cleanup -m "Merge branch 'chore/cleanup' - Codebase cleanup"
```

---

## 📋 SCRIPT DE AUTOMAÇÃO

### Criar todas as branches de uma vez:
```bash
#!/bin/bash
# create-all-branches.sh

BRANCHES=(
  "fix/critical-security"
  "fix/typescript-errors"
  "fix/memory-leaks"
  "fix/dependencies"
  "refactor/remove-duplication"
  "chore/cleanup"
)

for branch in "${BRANCHES[@]}"; do
  git checkout -b "$branch" feature/deckgl-eox-integration
  echo "✅ Created branch: $branch"
  git checkout feature/deckgl-eox-integration
done

echo "🎉 All branches created successfully!"
```

---

## 📊 RESUMO DE TAREFAS POR PRIORIDADE

### 🔴 CRÍTICAS (Fazer Imediatamente)
1. **fix/critical-security** - 5 tarefas
   - Remover ignoreBuildErrors
   - Remover credenciais hardcoded
   - Corrigir CORS
   - Remover console.logs
   - Validação de ambiente

### 🟡 ALTAS (Fazer Esta Semana)
2. **fix/typescript-errors** - 5 tarefas
   - Interfaces API
   - Tipos em dashboard
   - Tipos em hooks
   - Props tipadas
   - Validação runtime

3. **fix/memory-leaks** - 5 tarefas
   - Cleanup useEffect
   - Cleanup integration
   - AbortController
   - Clear timers
   - Remove listeners

### 🟢 MÉDIAS (Fazer Próxima Semana)
4. **fix/dependencies** - 5 tarefas
   - Unificar React
   - Unificar TypeScript
   - Resolver Python deps
   - Update lock files
   - Remover não usadas

5. **refactor/remove-duplication** - 5 tarefas
   - Douglas-Peucker
   - Fetch hooks
   - Shared components
   - Common configs
   - Python utils

### ⚪ BAIXAS (Fazer Quando Possível)
6. **chore/cleanup** - 5 tarefas
   - Remove backups
   - Clean imports
   - Organize docs
   - Remove duplicates
   - Update gitignore

---

## 🚀 WORKFLOW COMPLETO

```bash
# 1. Criar branches
./create-all-branches.sh

# 2. Trabalhar em cada branch (ordem de prioridade)
git checkout fix/critical-security
# ... fazer as tarefas ...
git push origin fix/critical-security

# 3. Criar Pull Request
# Via GitHub/GitLab interface

# 4. Após aprovação, merge
git checkout feature/deckgl-eox-integration
git merge --no-ff fix/critical-security

# 5. Push para remoto
git push origin feature/deckgl-eox-integration

# 6. Repetir para próxima branch
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Antes de cada merge:
- [ ] Todos os testes passando
- [ ] Sem erros de build
- [ ] Code review aprovado
- [ ] Documentação atualizada

### Após completar todas as branches:
- [ ] Realizar testes de integração
- [ ] Verificar performance
- [ ] Validar segurança
- [ ] Atualizar CHANGELOG.md
- [ ] Criar tag de versão

```bash
# Criar tag após todas as correções
git tag -a v2.1.0 -m "Security and stability improvements"
git push origin v2.1.0
```

---

**Total de Tarefas:** 30 (5 por branch)  
**Tempo Estimado:** 2-3 semanas  
**Branches:** 6  

---

*Documento gerado para organização de tarefas Git - Janeiro 2025*
