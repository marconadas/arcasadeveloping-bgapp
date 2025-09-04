# 📝 Convenção de Nomenclatura - Documentação BGAPP

## 🎯 Objetivo
Estabelecer padrões consistentes para nomenclatura de documentos, facilitando organização, busca e manutenção da documentação.

---

## 📋 **Formato Padrão**

### **Estrutura Base**
```
[CATEGORIA]_[TIPO]_[DESCRIÇÃO]_[STATUS].md
```

### **Exemplo Completo**
```
ADMIN_IMPLEMENTACAO_DASHBOARD_SILICON_VALLEY_COMPLETO.md
ML_RELATORIO_MODELOS_PREDITIVOS_IMPLEMENTADO.md
QGIS_GUIA_ANALISE_ESPACIAL_RASCUNHO.md
```

---

## 🏷️ **Categorias Principais**

### **ADMIN** - Sistema Administrativo
```
ADMIN_DASHBOARD_*
ADMIN_API_*
ADMIN_INTERFACE_*
ADMIN_AUDITORIA_*
```

### **ML** - Machine Learning
```
ML_MODELO_*
ML_PIPELINE_*
ML_ANALISE_*
ML_IMPLEMENTACAO_*
```

### **QGIS** - Sistema Geoespacial
```
QGIS_ANALISE_*
QGIS_FERRAMENTA_*
QGIS_INTEGRACAO_*
QGIS_LAYER_*
```

### **DEPLOY** - Deployment e Produção
```
DEPLOY_CLOUDFLARE_*
DEPLOY_PIPELINE_*
DEPLOY_CONFIGURACAO_*
DEPLOY_RELATORIO_*
```

### **SECURITY** - Segurança
```
SECURITY_AUDITORIA_*
SECURITY_VULNERABILIDADE_*
SECURITY_POLITICA_*
SECURITY_INCIDENTE_*
```

### **FRONTEND** - Interface de Usuário
```
FRONTEND_INTERFACE_*
FRONTEND_COMPONENTE_*
FRONTEND_HUB_*
FRONTEND_CORRECAO_*
```

### **DEBUG** - Debugging e Troubleshooting
```
DEBUG_ERRO_*
DEBUG_INVESTIGACAO_*
DEBUG_SOLUCAO_*
DEBUG_ANALISE_*
```

### **FEATURE** - Funcionalidades
```
FEATURE_IMPLEMENTACAO_*
FEATURE_PLANO_*
FEATURE_ESPECIFICACAO_*
FEATURE_TESTE_*
```

---

## 📊 **Tipos de Documento**

### **IMPLEMENTACAO** - Documentos de implementação
```
Uso: Documentar implementações completas
Exemplo: ADMIN_IMPLEMENTACAO_NEXTJS_MIGRACAO.md
```

### **RELATORIO** - Relatórios e análises
```
Uso: Relatórios de status, auditorias, análises
Exemplo: ML_RELATORIO_PERFORMANCE_MODELOS_Q4_2024.md
```

### **GUIA** - Guias e tutoriais
```
Uso: Instruções passo-a-passo, manuais
Exemplo: QGIS_GUIA_INSTALACAO_PLUGINS.md
```

### **PLANO** - Planos e roadmaps
```
Uso: Planejamento futuro, estratégias
Exemplo: FEATURE_PLANO_INTEGRACAO_UNREAL_ENGINE_2025.md
```

### **CORRECAO** - Correções e fixes
```
Uso: Documentar correções de bugs, problemas
Exemplo: FRONTEND_CORRECAO_NAVEGACAO_MOBILE.md
```

### **AUDITORIA** - Auditorias e revisões
```
Uso: Auditorias de código, segurança, performance
Exemplo: SECURITY_AUDITORIA_VULNERABILIDADES_Q1_2025.md
```

### **TESTE** - Testes e validações
```
Uso: Documentar testes, validações, QA
Exemplo: ML_TESTE_MODELOS_BIODIVERSIDADE_VALIDACAO.md
```

---

## 🚦 **Status do Documento**

### **RASCUNHO** - Em desenvolvimento
```
Uso: Documento em elaboração
Cor: 🟡 Amarelo
```

### **REVISAO** - Em revisão
```
Uso: Aguardando aprovação
Cor: 🟠 Laranja
```

### **IMPLEMENTADO** - Concluído e ativo
```
Uso: Implementação finalizada
Cor: 🟢 Verde
```

### **OBSOLETO** - Desatualizado
```
Uso: Documento desatualizado
Cor: 🔴 Vermelho
```

### **ARQUIVADO** - Arquivado
```
Uso: Mantido para histórico
Cor: ⚫ Preto
```

---

## 📅 **Convenções de Data**

### **Formato Padrão**
```
YYYY_MM_DD ou YYYY_QX (para trimestres)
Exemplo: 2025_01_15 ou 2025_Q1
```

### **Integração no Nome**
```
ML_RELATORIO_PERFORMANCE_2025_Q1_IMPLEMENTADO.md
SECURITY_AUDITORIA_COMPLETA_2025_01_15_CONCLUIDO.md
```

---

## 🔤 **Regras de Formatação**

### **Caracteres Permitidos**
```
✅ Letras: A-Z (maiúsculas preferencialmente)
✅ Números: 0-9
✅ Separadores: _ (underscore)
✅ Extensão: .md
```

### **Caracteres Proibidos**
```
❌ Espaços
❌ Caracteres especiais: @#$%^&*()
❌ Acentos: ç, ã, õ, etc.
❌ Hífen: - (usar _ no lugar)
```

### **Tamanho do Nome**
```
📏 Máximo: 80 caracteres
📏 Mínimo: 20 caracteres
📏 Recomendado: 40-60 caracteres
```

---

## 🎯 **Exemplos Práticos**

### **Bons Exemplos** ✅
```
ADMIN_IMPLEMENTACAO_DASHBOARD_SILICON_VALLEY_COMPLETO.md
ML_RELATORIO_MODELOS_BIODIVERSIDADE_2025_Q1_IMPLEMENTADO.md
QGIS_GUIA_ANALISE_ESPACIAL_BUFFER_ZONES_REVISAO.md
DEPLOY_CONFIGURACAO_CLOUDFLARE_PAGES_OTIMIZADA_IMPLEMENTADO.md
SECURITY_AUDITORIA_VULNERABILIDADES_CRITICAS_2025_01_CONCLUIDO.md
```

### **Exemplos Ruins** ❌
```
admin dashboard update.md (espaços, minúsculas)
ML-modelo-preditivo.md (hífens)
qgis_análise_espacial.md (acentos, minúsculas)
deploy cloudflare final.md (espaços, vago)
security audit.md (muito curto, vago)
```

---

## 🔄 **Migração de Documentos Existentes**

### **Processo de Renomeação**
1. **Identificar categoria** do documento
2. **Determinar tipo** de conteúdo
3. **Extrair descrição** principal
4. **Definir status** atual
5. **Aplicar nova nomenclatura**

### **Script de Migração**
```bash
# Usar o script de automação
./scripts/organize_docs.sh --rename-existing
```

---

## 📊 **Métricas de Qualidade**

### **Indicadores de Boa Nomenclatura**
- ✅ Categoria clara e consistente
- ✅ Tipo de documento identificável
- ✅ Descrição específica e útil
- ✅ Status atual bem definido
- ✅ Fácil de buscar e filtrar

### **Red Flags**
- ❌ Nomes genéricos (README, DOC, TEMP)
- ❌ Versões não controladas (v1, v2, final, final2)
- ❌ Datas inconsistentes ou ausentes
- ❌ Categorias ambíguas ou inexistentes

---

## 🚀 **Implementação**

### **Ferramentas de Apoio**
- Script de validação de nomenclatura
- Template generator para novos docs
- Linter para verificar padrões
- Auto-complete para categorias

### **Integração com Workflow**
- Pre-commit hooks para validação
- CI/CD checks para nomenclatura
- Automated suggestions para melhorias
- Dashboard de qualidade da documentação

---

## 📚 **Recursos Adicionais**

- 🔧 **Script de Organização**: `scripts/organize_docs.sh`
- 📋 **Template Generator**: `scripts/generate_doc_template.sh`
- ✅ **Validator**: `scripts/validate_naming.sh`
- 📊 **Quality Report**: `scripts/docs_quality_report.sh`

---

*Convenção de Nomenclatura BGAPP - Organização é a Chave do Sucesso 🌊📝*
