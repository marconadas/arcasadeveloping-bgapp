# BGAPP Admin Dashboard - Next.js

Dashboard administrativo moderno para a plataforma BGAPP Marine Angola, desenvolvido com Next.js, TypeScript e Tailwind CSS.

## 🚀 Funcionalidades

### ✅ Funcionalidades Migradas do HTML Original

- **Dashboard Principal** - Visão geral do sistema com métricas em tempo real
- **Gestão de Serviços** - Controle completo dos 13+ serviços da plataforma
- **Bases de Dados** - Gestão PostGIS, coleções STAC e consultas SQL
- **Armazenamento** - Interface MinIO com estatísticas de utilização
- **Ingestão de Dados** - 13+ conectores para fontes externas
- **Processamento** - Pipelines de dados e processamento assíncrono
- **Machine Learning** - Modelos preditivos com >95% precisão
- **MaxEnt** - Distribuição de espécies com IA avançada
- **MCDA** - Análise multi-critério para planeamento
- **Análise Costeira** - Processamento geoespacial avançado
- **Fronteiras Marítimas** - Gestão de ZEE e águas territoriais
- **Cache Redis** - Sistema otimizado (83% melhoria performance)
- **Alertas Automáticos** - Sistema de monitorização inteligente
- **Backup e Segurança** - Sistema robusto com 99.99% disponibilidade
- **Autenticação Enterprise** - OAuth2, MFA, SSO
- **API Gateway** - Gestão centralizada de APIs
- **Auditoria Completa** - Rastreamento de todas as ações

### 🆕 Melhorias Implementadas

- **Interface Moderna** - Design system baseado em Radix UI
- **Performance Otimizada** - Server-side rendering e lazy loading
- **Responsividade Total** - Funciona perfeitamente em mobile
- **Dark Mode** - Suporte completo a temas
- **TypeScript** - Type safety completo
- **React Query** - Cache inteligente e sincronização de dados
- **Componentes Reutilizáveis** - Arquitetura modular
- **Acessibilidade** - Suporte completo a WCAG 2.1
- **PWA Ready** - Preparado para Progressive Web App

## 🛠️ Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Type safety e melhor DX
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Componentes acessíveis e customizáveis
- **React Query** - Gestão de estado servidor
- **Chart.js** - Gráficos interativos
- **Framer Motion** - Animações fluidas
- **Zustand** - Gestão de estado cliente
- **Axios** - Cliente HTTP com interceptors

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- APIs BGAPP rodando (admin-api, ml-api, etc.)

### Passos

1. **Clone e instale dependências:**
```bash
cd admin-dashboard
npm install
```

2. **Configure variáveis de ambiente:**
```bash
cp .env.example .env.local
```

Edite `.env.local`:
```env
ADMIN_API_URL=http://localhost:8085
ML_API_URL=http://localhost:8000
PYGEOAPI_URL=http://localhost:5080
STAC_API_URL=http://localhost:8081
MINIO_URL=http://localhost:9000
REDIS_URL=redis://localhost:6379
```

3. **Execute em desenvolvimento:**
```bash
npm run dev
```

4. **Acesse o dashboard:**
```
http://localhost:3001
```

## 🏗️ Build para Produção

```bash
# Build otimizado
npm run build

# Executar produção
npm start

# Análise de bundle
npm run analyze
```

## 📁 Estrutura do Projeto

```
admin-dashboard/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Página inicial
│   │   └── globals.css        # Estilos globais
│   ├── components/            # Componentes React
│   │   ├── ui/                # Componentes base (Radix UI)
│   │   ├── layout/            # Layout components
│   │   └── dashboard/         # Componentes específicos
│   ├── lib/                   # Utilitários
│   │   ├── api.ts            # Cliente API
│   │   └── utils.ts          # Funções utilitárias
│   ├── types/                 # Definições TypeScript
│   ├── hooks/                 # Custom hooks
│   └── store/                 # Gestão de estado
├── public/                    # Assets estáticos
├── next.config.js            # Configuração Next.js
├── tailwind.config.js        # Configuração Tailwind
└── tsconfig.json             # Configuração TypeScript
```

## 🔗 APIs Integradas

O dashboard integra com todas as APIs existentes:

### Admin API (Porto 8085)
- `/services/status` - Estado dos serviços
- `/metrics` - Métricas do sistema
- `/connectors` - Gestão de conectores
- `/database/*` - Operações de base de dados
- `/storage/*` - Gestão de armazenamento
- `/cache/*` - Operações de cache
- `/alerts/*` - Sistema de alertas
- `/backup/*` - Gestão de backups
- `/audit/*` - Sistema de auditoria

### ML API (Porto 8000)
- `/ml/models` - Modelos de machine learning
- `/ml/predict` - Predições
- `/ml/train/*` - Treino de modelos
- `/biodiversity-studies/*` - Estudos de biodiversidade
- `/maxent/*` - Modelos MaxEnt

### pygeoapi (Porto 5080)
- `/collections` - Coleções de dados
- `/processes` - Processos geoespaciais

## 🎨 Sistema de Design

### Cores
- **Primary**: Azul oceânico (#2563eb)
- **Marine**: Verde marinho (#14b8a6)
- **Success**: Verde (#10b981)
- **Warning**: Amarelo (#f59e0b)
- **Danger**: Vermelho (#ef4444)

### Componentes
- **MetricCard** - Cards de métricas com ícones
- **QuickAccessGrid** - Grid de acesso rápido
- **SystemPerformanceChart** - Gráficos de performance
- **ServiceCard** - Cards de serviços
- **DataTable** - Tabelas de dados responsivas

## 📊 Monitorização

### Métricas em Tempo Real
- CPU, Memória, Disco
- Latência de APIs
- Status de serviços
- Cache hit rate
- Tarefas assíncronas

### Alertas Automáticos
- Serviços offline
- Performance degradada
- Erros críticos
- Limites excedidos

## 🔒 Segurança

- **Autenticação JWT** - Tokens seguros
- **Rate Limiting** - Proteção contra ataques
- **CORS Configurado** - Acesso controlado
- **Validação de Dados** - Input sanitization
- **Auditoria Completa** - Log de todas as ações

## 📱 Responsividade

- **Mobile First** - Design otimizado para mobile
- **Breakpoints** - sm, md, lg, xl, 2xl
- **Touch Friendly** - Botões e controles otimizados
- **Sidebar Responsiva** - Colapsa em mobile

## 🚀 Performance

### Otimizações Implementadas
- **Code Splitting** - Carregamento lazy
- **Image Optimization** - Next.js Image component
- **Bundle Analysis** - Análise de tamanho
- **Caching Strategy** - React Query + SWR
- **Prefetching** - Links otimizados

### Métricas de Performance
- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Time to Interactive** < 3.0s
- **Cumulative Layout Shift** < 0.1

## 🔧 Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run start        # Executar produção
npm run lint         # Linting
npm run type-check   # Verificação de tipos
npm run format       # Formatação de código
```

### Convenções de Código
- **ESLint** - Linting automático
- **Prettier** - Formatação consistente
- **TypeScript** - Type safety
- **Conventional Commits** - Commits padronizados

## 📈 Roadmap

### Próximas Funcionalidades
- [ ] **PWA Completo** - Service worker e offline
- [ ] **Notificações Push** - Alertas em tempo real
- [ ] **Export de Dados** - PDF, Excel, CSV
- [ ] **Temas Personalizados** - Customização avançada
- [ ] **Multi-idioma** - i18n completo
- [ ] **Dashboard Widgets** - Componentes drag-and-drop

### Melhorias Planejadas
- [ ] **Testes Automatizados** - Jest + Testing Library
- [ ] **Storybook** - Documentação de componentes
- [ ] **CI/CD Pipeline** - Deploy automatizado
- [ ] **Docker Support** - Containerização
- [ ] **Monitoring** - Sentry + Analytics

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Equipe

- **Mare Datum Consultoria** - Desenvolvimento e manutenção
- **BGAPP Marine Angola** - Requisitos e validação

## 📞 Suporte

Para suporte técnico ou questões sobre o dashboard:

- 📧 Email: suporte@bgapp.ao
- 🌐 Website: https://bgapp.ao
- 📱 WhatsApp: +244 XXX XXX XXX

---

**BGAPP Marine Angola** - Plataforma Oceanográfica e Meteorológica
*Desenvolvido com ❤️ em Angola*
