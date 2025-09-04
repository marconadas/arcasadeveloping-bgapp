# Site MINPERMAR

Site institucional moderno e responsivo do **Ministério das Pescas e Recursos Marinhos de Angola** (MINPERMAR).

## 🌊 Características

- **Interface Moderna**: Design responsivo e acessível
- **Multilíngue**: Suporte para Português, Inglês e Francês
- **Integração BGAPP**: Conectado aos sistemas BGAPP existentes
- **Serviços Digitais**: Licenciamento, certificação, consultoria e denúncias online
- **Performance**: Otimizado com React 18 + TypeScript + Vite

## 🚀 Como Iniciar

### Opção 1: Script Automático (Recomendado)
```bash
# A partir do diretório raiz do BGAPP
./start_minpermar.sh
```

### Opção 2: Manual
```bash
cd infra/frontend/minpermar
npm install
npm run dev
```

O site estará disponível em: **http://localhost:3001**

## 🔗 Acesso através do Admin BGAPP

1. Abra o painel administrativo: `http://localhost:8001/admin.html`
2. No menu lateral, clique em **"Site MINPERMAR"**
3. O site será aberto numa nova aba

## 📱 Tecnologias Utilizadas

- **React 18** - Framework frontend
- **TypeScript** - Tipagem estática
- **Vite** - Build tool rápido
- **Tailwind CSS** - Framework CSS utilitário
- **Framer Motion** - Animações
- **React Router** - Roteamento
- **React i18next** - Internacionalização
- **Lucide React** - Ícones

## 🏗️ Estrutura do Projeto

```
minpermar/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   └── Layout/         # Header, Footer, Navigation
│   ├── pages/              # Páginas principais
│   │   ├── services/       # Páginas de serviços
│   │   └── legal/          # Páginas legais
│   ├── i18n/               # Traduções
│   │   └── locales/        # PT, EN, FR
│   ├── types/              # Definições TypeScript
│   └── App.tsx             # Componente principal
├── public/                 # Assets estáticos
└── package.json            # Dependências
```

## 🌐 Páginas Implementadas

### Principais
- ✅ **Início** - Homepage com visão geral
- ✅ **Sobre o MINPERMAR** - Missão, visão, valores, liderança
- 🚧 **Pescas e Recursos Marinhos** - Em desenvolvimento
- 🚧 **Aquicultura** - Em desenvolvimento
- 🚧 **Economia Azul** - Em desenvolvimento
- ✅ **Serviços ao Cidadão** - Portal de serviços digitais
- 🚧 **Educação e Capacitação** - Em desenvolvimento
- 🚧 **Estudos e Relatórios** - Em desenvolvimento
- 🚧 **Notícias e Eventos** - Em desenvolvimento
- 🚧 **Transparência** - Em desenvolvimento
- 🚧 **Contacto** - Em desenvolvimento

### Serviços Digitais
- 🚧 **Licenciamento de Pesca** - Em desenvolvimento
- 🚧 **Certificação de Produtos** - Em desenvolvimento
- 🚧 **Consultoria Técnica** - Em desenvolvimento
- 🚧 **Denúncias Online** - Em desenvolvimento

### Páginas Legais
- 🚧 **Política de Privacidade** - Em desenvolvimento
- 🚧 **Termos de Uso** - Em desenvolvimento
- 🚧 **Acessibilidade** - Em desenvolvimento

## 🔧 Sistemas Integrados

O site conecta-se aos seguintes sistemas BGAPP:

- **MRP** (Marine Resource Planning) - `http://localhost:8001/admin`
- **CRM** (Customer Relationship Management) - `http://localhost:8001/admin`
- **SIMS** (Scientific Information Management) - `http://localhost:8082`
- **CMCS** (Compliance Management Control) - `http://localhost:5555`
- **SRM** (Supplier Relationship Management) - `http://localhost:8001/admin`

## 🎨 Design System

### Cores
- **Azul-marinho**: `#1d4ed8` (Principal)
- **Verde oceânico**: `#16a34a` (Secundária)
- **Branco**: `#ffffff` (Base)

### Fontes
- **Display**: Poppins (Títulos)
- **Corpo**: Inter (Texto)

## 🌍 Internacionalização

O site suporta três idiomas:
- 🇦🇴 **Português** (Padrão)
- 🇺🇸 **English**
- 🇫🇷 **Français**

## 📱 Responsividade

- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: < 768px

## 🔒 Acessibilidade

- Conformidade com padrões WCAG 2.1
- Navegação por teclado
- Leitores de ecrã compatíveis
- Alto contraste
- Textos alternativos

## 🚧 Desenvolvimento Futuro

### Próximas Funcionalidades
- [ ] Sistema de autenticação
- [ ] Dashboard do utilizador
- [ ] Formulários interativos
- [ ] Mapa interativo
- [ ] Chatbot inteligente
- [ ] Sistema de notificações
- [ ] Integração com APIs externas
- [ ] PWA (Progressive Web App)

### Melhorias Técnicas
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Monitorização de performance
- [ ] SEO otimizado
- [ ] Cache avançado

## 👨‍💻 Desenvolvimento

### Comandos Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run type-check   # Verificação de tipos
```

### Variáveis de Ambiente

Crie um arquivo `.env` se necessário:

```env
VITE_API_BASE_URL=http://localhost:8001
VITE_STAC_URL=http://localhost:8082
VITE_FLOWER_URL=http://localhost:5555
```

## 📄 Licença

© 2025 MINPERMAR - Ministério das Pescas e Recursos Marinhos de Angola

---

**Desenvolvido com ❤️ para o povo angolano** 🇦🇴
