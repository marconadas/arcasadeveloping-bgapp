# 🎨 Frontend & UX - BGAPP Marine Angola

**Branch**: `feature/frontend-ux`  
**Responsável**: Frontend/UX Developer  
**Supervisor**: Marcos Santos (Tech Lead)

## 🎯 Responsabilidades

### 🖥️ **Frontend Development**
- **Next.js 14** - Admin Dashboard moderno
- **React Components** - Interfaces reutilizáveis
- **TypeScript** - Tipagem forte
- **Tailwind CSS** - Design system
- **Responsive Design** - Mobile-first

### 🎨 **User Experience**
- **Design System** - Componentes consistentes
- **Acessibilidade** - WCAG 2.1 compliance
- **Performance** - Core Web Vitals otimizados
- **Usabilidade** - Testes com utilizadores
- **Mobile PWA** - Aplicação progressiva

### 🌊 **Visualizações Avançadas**
- **deck.gl** - Visualizações WebGL
- **Mapbox GL** - Mapas interativos
- **Three.js** - Renderização 3D
- **D3.js** - Gráficos customizados
- **Unreal Engine** - Shaders oceânicos

---

## 🛠️ **Arquivos Principais**

### 📱 **Admin Dashboard**
```
admin-dashboard/src/app/          ← Páginas Next.js
admin-dashboard/src/components/   ← Componentes React
admin-dashboard/src/lib/          ← Utilitários e APIs
admin-dashboard/src/styles/       ← Estilos globais
```

### 🌐 **Interfaces Científicas**
```
infra/frontend/                   ← Interfaces HTML/JS
infra/frontend/dashboard_cientifico.html ← Dashboard científico
infra/frontend/realtime_angola.html ← Tempo real Angola
infra/frontend/qgis_dashboard.html ← Interface QGIS
```

### 🎨 **Assets & Recursos**
```
infra/frontend/assets/css/        ← Estilos customizados
infra/frontend/assets/js/         ← JavaScript avançado
admin-dashboard/public/           ← Recursos estáticos
```

---

## 🚀 **Setup de Desenvolvimento**

### 1️⃣ **Configuração Inicial**
```bash
git checkout feature/frontend-ux
git pull origin develop

# Instalar dependências
cd admin-dashboard/
npm install

# Configurar environment
cp .env.example .env.local
# [editar variáveis de ambiente]
```

### 2️⃣ **Desenvolvimento Local**
```bash
# Iniciar servidor desenvolvimento
npm run dev          # http://localhost:3000

# Build de produção
npm run build
npm run start

# Deploy para Cloudflare
npm run deploy       # Usar wrangler
```

### 3️⃣ **Testes & Quality**
```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Testes visuais
npm run storybook    # (se configurado)
```

---

## 📋 **Tarefas Prioritárias**

### 🔥 **Sprint Atual**
- [ ] **Melhorar UX** do admin dashboard
- [ ] **Otimizar performance** (Core Web Vitals)
- [ ] **Acessibilidade** WCAG 2.1
- [ ] **Responsive design** mobile
- [ ] **Dark mode** completo

### 🎯 **Próximas Sprints**
- [ ] **Novas visualizações** 3D oceânicas
- [ ] **PWA** otimizada
- [ ] **Micro-interactions** avançadas
- [ ] **Design system** completo
- [ ] **Storybook** para componentes

---

## 🎨 **Design System**

### 🎨 **Cores Principais**
```css
--primary: #00bcd4    /* Cyan oceânico */
--secondary: #2196f3  /* Azul científico */
--accent: #4caf50     /* Verde biodiversidade */
--background: #0c1445 /* Azul profundo */
```

### 🖼️ **Componentes UI**
```typescript
// Componentes Radix UI + Tailwind
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
```

### 📱 **Breakpoints**
```css
sm: 640px   /* Mobile large */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

---

## 🧪 **Como Testar**

### 🖥️ **Admin Dashboard**
```bash
# Desenvolvimento local
cd admin-dashboard/
npm run dev
# Abrir http://localhost:3000

# Testar todas as seções
# ✅ Hub Científico (43 interfaces)
# ✅ Tempo Real Angola
# ✅ Sistema ML
# ✅ QGIS Análises
```

### 🌐 **Interfaces Científicas**
```bash
# Testar frontend principal
cd infra/frontend/
python -m http.server 8085
# Abrir http://localhost:8085

# Testar interfaces específicas
# ✅ dashboard_cientifico.html
# ✅ realtime_angola.html
# ✅ qgis_dashboard.html
```

### 📱 **Mobile Testing**
```bash
# Testar responsividade
npm run dev
# Usar DevTools → Device simulation

# Testar PWA
# Lighthouse audit
# Performance testing
```

---

## 📊 **Métricas de Performance**

### 🎯 **Core Web Vitals Targets**
- **LCP** (Largest Contentful Paint): <2.5s
- **FID** (First Input Delay): <100ms
- **CLS** (Cumulative Layout Shift): <0.1
- **FCP** (First Contentful Paint): <1.8s

### 📈 **Monitorização**
- **Cloudflare Analytics** - Métricas reais
- **Lighthouse CI** - Performance automática
- **Bundle analyzer** - Otimização de tamanho

---

## 🎨 **Bibliotecas & Ferramentas**

### ⚛️ **React Ecosystem**
```json
{
  "next": "14.0.4",
  "react": "18.2.0", 
  "typescript": "5.3.3",
  "tailwindcss": "3.4.0",
  "@radix-ui/react-*": "latest"
}
```

### 🌊 **Visualizações**
```json
{
  "deck.gl": "9.1.14",
  "mapbox-gl": "3.0.0", 
  "three": "0.158.0",
  "d3": "7.0.0",
  "plotly.js": "2.27.0"
}
```

### 🎨 **Styling & Animation**
```json
{
  "framer-motion": "10.18.0",
  "gsap": "3.12.2",
  "aos": "2.3.1",
  "lucide-react": "0.309.0"
}
```

---

## 🔧 **Estrutura de Componentes**

### 🏗️ **Organização**
```
src/components/
├── ui/                    ← Componentes base (Radix)
├── dashboard/             ← Componentes dashboard
├── bgapp-native/          ← Componentes BGAPP específicos
├── layout/                ← Layout e navegação
├── maps/                  ← Componentes de mapas
└── iframe-enhanced/       ← Wrappers para iframes
```

### 🎨 **Naming Convention**
```typescript
// Componentes: PascalCase
export function DashboardContent() {}

// Props: interface com Props suffix
interface DashboardContentProps {}

// Hooks: camelCase com use prefix
function useRealtimeData() {}

// Utilities: camelCase
function formatDate() {}
```

---

## 📱 **Responsividade & Acessibilidade**

### 📱 **Mobile-First Design**
- **Touch targets**: min 44px
- **Viewport meta**: configurado
- **Responsive images**: otimizadas
- **Navigation**: mobile-friendly

### ♿ **Acessibilidade**
- **ARIA labels**: completos
- **Keyboard navigation**: funcional
- **Screen readers**: compatível
- **Color contrast**: WCAG AA
- **Focus indicators**: visíveis

---

## 🚀 **Deploy & Otimização**

### 📦 **Build Optimization**
```bash
# Análise do bundle
npm run build
npx @next/bundle-analyzer

# Otimização de imagens
# Next.js Image Optimization automática

# Code splitting
# Automático via Next.js
```

### 🌐 **Cloudflare Pages**
```bash
# Deploy automático via wrangler
npm run deploy

# Preview branches
# Automático para cada PR

# Production deploy
# Apenas via main branch
```

---

## 📞 **Contacto & Suporte**

### 👨‍💻 **Tech Lead**
- **Marcos Santos** - marcos@maredatum.com
- **Review obrigatório** para todas as PRs
- **Disponível** para dúvidas de arquitetura

### 📚 **Recursos**
- **Design Guidelines**: `/docs/organized/frontend/`
- **Component Library**: Storybook (em desenvolvimento)
- **API Documentation**: `/docs/organized/admin/`

### 🎨 **Design Resources**
- **Figma**: [link para designs]
- **Style Guide**: `/docs/design-system.md`
- **Icons**: Heroicons + Font Awesome
- **Fonts**: Segoe UI system fonts

---

## ✅ **Definition of Done - Frontend**

### 📝 **Para cada componente:**
- [ ] **Implementação** completa
- [ ] **TypeScript** tipado
- [ ] **Responsivo** (mobile + desktop)
- [ ] **Acessível** (WCAG 2.1)
- [ ] **Performante** (Lighthouse >90)
- [ ] **Testado** visualmente

### 🚀 **Para deploy:**
- [ ] **Build** sem warnings
- [ ] **Bundle size** otimizado
- [ ] **Core Web Vitals** ✅
- [ ] **Cross-browser** testado
- [ ] **Mobile** testado

---

## 🎯 **Roadmap Frontend**

### 🏃‍♂️ **Curto Prazo (1-2 sprints)**
- Melhorar UX do admin dashboard
- Otimizar performance mobile
- Implementar dark mode completo

### 🚀 **Médio Prazo (3-4 sprints)**
- Design system completo
- Storybook para componentes
- PWA otimizada

### 🌟 **Longo Prazo (5+ sprints)**
- Micro-frontend architecture
- Advanced 3D visualizations
- AI-powered UX personalization

---

**Bem-vindo à equipa frontend BGAPP! Vamos criar interfaces incríveis para a ciência marinha! 🌊🎨**
