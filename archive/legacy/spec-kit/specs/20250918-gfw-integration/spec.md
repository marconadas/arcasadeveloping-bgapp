# gfw-integration - Especificação Funcional

## 📋 Visão Geral
**Nome da Feature:** gfw-integration
**Data de Criação:** 2025-09-18
**Autor:** marconadas
**Status:** Em Desenvolvimento

## 🎯 Objetivo
Integrar dados reais do Global Fishing Watch (GFW) API v3 no admin dashboard para monitorização em tempo real das atividades pesqueiras nas águas angolanas. A feature substitui dados simulados por dados reais de embarcações, alertas de pesca ilegal e violações em áreas protegidas.

**Problema Resolvido:** O dashboard atual exibe apenas dados simulados, limitando a capacidade de monitorização real das atividades marítimas. Com esta integração, gestores poderão tomar decisões baseadas em dados reais de atividade pesqueira.

## 👥 Personas e Casos de Uso
### Persona Principal
- **Nome:** Gestor de Recursos Marinhos
- **Descrição:** Oficial governamental responsável pela fiscalização e conservação dos recursos marinhos de Angola
- **Necessidades:**
  - Monitorizar atividades pesqueiras em tempo real
  - Detectar pesca ilegal nas águas territoriais
  - Proteger áreas de conservação marinha
  - Gerar relatórios para autoridades superiores

### Casos de Uso
1. **Monitorização de Embarcações em Tempo Real**
   - **Ator:** Gestor de Recursos Marinhos
   - **Pré-condições:** Token GFW válido e dashboard acessível
   - **Fluxo Principal:**
     1. Aceder ao dashboard GFW
     2. Visualizar estatísticas de embarcações ativas
     3. Filtrar por tipo de embarcação (pesca, transporte, apoio)
     4. Analisar padrões de movimento nas águas angolanas
   - **Pós-condições:** Compreensão atual da atividade pesqueira

2. **Gestão de Alertas de Pesca Ilegal**
   - **Ator:** Gestor de Recursos Marinhos
   - **Pré-condições:** Sistema de alertas configurado
   - **Fluxo Principal:**
     1. Receber notificação de atividade suspeita
     2. Visualizar detalhes do alerta (localização, embarcações envolvidas)
     3. Avaliar severidade (baixa, média, alta)
     4. Tomar ação apropriada (investigação, patrulha)
   - **Pós-condições:** Alerta processado e ação iniciada

## 🔧 Requisitos Funcionais
### RF001 - Integração com GFW API v3
- **Descrição:** Conectar com a API do Global Fishing Watch através do proxy bgapp-gfw-proxy.majearcasa.workers.dev
- **Prioridade:** Alta
- **Critérios de Aceitação:**
  - [ ] Dashboard conecta com proxy GFW sem erros CORS
  - [ ] Autenticação com Bearer token funcional
  - [ ] Dados de embarcações carregam corretamente
  - [ ] Tratamento de erros 403 (permissões) implementado

### RF002 - Monitorização de Embarcações
- **Descrição:** Exibir dados reais de embarcações nas águas angolanas (lat: -18 a -5, lon: 11 a 14)
- **Prioridade:** Alta
- **Critérios de Aceitação:**
  - [ ] Contagem total de embarcações ativas
  - [ ] Filtros por tipo (pesca, transporte, apoio)
  - [ ] Localização geográfica das embarcações
  - [ ] Atualização automática dos dados

### RF003 - Sistema de Alertas
- **Descrição:** Detectar e exibir alertas de atividades suspeitas
- **Prioridade:** Média
- **Critérios de Aceitação:**
  - [ ] Alertas de pesca ilegal
  - [ ] Violações em áreas protegidas
  - [ ] Classificação por severidade (baixa, média, alta)
  - [ ] Detalhes de localização e embarcações envolvidas

### RF004 - Gestão de Áreas Protegidas
- **Descrição:** Monitorizar atividades em zonas de conservação marinha
- **Prioridade:** Média
- **Critérios de Aceitação:**
  - [ ] Definir limites de áreas protegidas
  - [ ] Detectar violações automaticamente
  - [ ] Ativar/desativar monitorização por área
  - [ ] Relatório de violações por área

## 🚫 Requisitos Não Funcionais
### RNF001 - Performance
- **Descrição:** Sistema deve responder rapidamente para monitorização em tempo real
- **Métrica:** Carregamento inicial < 5 segundos, atualizações < 2 segundos

### RNF002 - Disponibilidade
- **Descrição:** Dashboard deve estar disponível 24/7 para monitorização contínua
- **Métrica:** 99.5% uptime

### RNF003 - Segurança
- **Descrição:** Proteger token GFW e dados sensíveis de embarcações
- **Métrica:** Token armazenado de forma segura, logs não expostos

### RNF004 - Rate Limiting
- **Descrição:** Respeitar limites da API GFW para evitar bloqueios
- **Métrica:** Máximo 750/1000 requests diários (75% do limite)

## 🎨 Design e UX
### Wireframes
- [ ] Wireframe de baixa fidelidade
- [ ] Wireframe de alta fidelidade
- [ ] Protótipo interativo

## 🗄️ Modelo de Dados
### Entidades Principais
- **[Entidade 1]**
  - [Campo 1]: [Tipo]
  - [Campo 2]: [Tipo]

## 🔌 APIs e Integrações
### GFW Proxy Endpoints
- `GET /gfw/vessels` - Buscar embarcações nas águas angolanas
- `GET /gfw/4wings/report/ais-vessel-presence` - Relatório de presença de embarcações
- `GET /gfw/vessels/search` - Busca avançada de embarcações com filtros

### Parâmetros Angola
- **Região:** `region=angola`
- **Coordenadas:** `lat: -18 to -5, lon: 11 to 14`
- **Dataset:** `public-global-vessels:v3.0`
- **Flag:** `AO` (bandeira de Angola)

## 🧪 Testes
### Testes Unitários
- [ ] [Teste 1]
- [ ] [Teste 2]

### Testes de Integração
- [ ] [Teste de integração 1]

### Testes E2E
- [ ] [Teste E2E 1]

## ✅ Checklist de Revisão e Aceitação
### Funcionalidade
- [ ] Todos os requisitos funcionais implementados
- [ ] Todos os casos de uso funcionando
- [ ] Interface de usuário conforme especificado

### Qualidade
- [ ] Código revisado e aprovado
- [ ] Testes passando (cobertura > 80%)
- [ ] Documentação atualizada

### Segurança
- [ ] Validação de entrada implementada
- [ ] Autenticação e autorização funcionando
- [ ] Dados sensíveis protegidos

## 📝 Notas e Considerações
- [Nota 1]
- [Nota 2]

## 🔗 Referências
- [Referência 1](URL1)
- [Referência 2](URL2)
