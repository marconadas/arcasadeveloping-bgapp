'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { InterfaceCounter } from '@/lib/bgapp/interface-counter'

/**
 * 🚀 SIDEBAR STATIC SILICON VALLEY - VERSÃO ESTÁVEL
 * Sidebar completamente estática sem problemas de hydration
 * Agora com contagem dinâmica de interfaces
 */

interface NavItem {
  id: string
  label: string
  icon: string
  children?: NavItem[]
  badge?: string
  isNew?: boolean
}

const navigationItems: NavItem[] = [
  // 🏠 CORE SYSTEM
  {
    id: 'dashboard',
    label: 'Dashboard Administrativo',
    icon: '📊',
  },
  
  // 🔬 SCIENTIFIC HUB - DESTAQUE (TODAS AS INTERFACES FUNCIONAIS AQUI)
  {
    id: 'scientific-hub',
    label: '🔬 Hub Científico Neptune(ANG)',
    icon: '🔬',
    badge: InterfaceCounter.generateBadge(), // Contagem dinâmica automática
    children: [
      { id: 'scientific-hub', label: `Portal Interfaces (${InterfaceCounter.getTotalCount()})`, icon: '🔬', badge: 'HUB' },
      { id: 'enhanced-ocean-system', label: '🌊 Enhanced Ocean System', icon: '🌊', badge: 'NOVO' },
      // Interfaces individuais funcionam dentro do Hub - não precisam aparecer separadamente
    ]
  },

  // 👁️ TEMPO REAL ANGOLA - MANTIDO POR PEDIDO
  {
    id: 'realtime-angola',
    label: '👁️ Tempo Real Angola',
    icon: '👁️',
    badge: 'LIVE',
  },

  // 🌊 COPERNICUS INTEGRATION
  {
    id: 'copernicus',
    label: '🌊 Copernicus Integration',
    icon: '🛰️',
    badge: 'LIVE',
    children: [
      { id: 'copernicus-monitoring', label: 'Monitoramento API', icon: '📊' },
      { id: 'copernicus-integration', label: 'Configuração', icon: '⚙️' },
    ]
  },

  // 🎣 GLOBAL FISHING WATCH
  {
    id: 'global-fishing-watch',
    label: '🎣 Global Fishing Watch',
    icon: '🎣',
    badge: 'ENHANCED',
  },

  // 🧠 MACHINE LEARNING
  {
    id: 'ml-system',
    label: '🧠 Sistema Machine Learning',
    icon: '🧠',
    badge: 'AI',
    children: [
      { id: 'ml-dashboard', label: 'ML Dashboard', icon: '📊' },
      { id: 'predictive-filters', label: 'Filtros Preditivos (7 tipos)', icon: '🤖', badge: 'AI' },
      { id: 'machine-learning', label: 'Modelos ML (95%+)', icon: '🧠', badge: '95%+' },
      { id: 'ml-retention-system', label: '🧠 Base de Retenção ML', icon: '🗄️', badge: 'PERFORMANCE', isNew: true },
    ]
  },



  // 🔗 SERVICES
  {
    id: 'services-integration',
    label: '🔗 Integração Serviços',
    icon: '🔗',
    badge: 'SILICON VALLEY',
  },

  // 🔬 QGIS ANÁLISE AVANÇADA
  {
    id: 'qgis-advanced',
    label: '🔬 QGIS Análise Avançada',
    icon: '🔬',
    badge: 'ANÁLISE',
    children: [
      { id: 'qgis-spatial-analysis', label: 'Análise Espacial', icon: '🔍' },
      { id: 'qgis-temporal-visualization', label: 'Visualização Temporal', icon: '📈' },
      { id: 'qgis-biomass-calculator', label: 'Calculadora de Biomassa', icon: '🌱' },
      { id: 'mcda-analysis', label: 'Análise MCDA/AHP', icon: '🛡️' },
    ]
  },

  // 📊 ANALYTICS & REPORTS
  {
    id: 'analytics',
    label: '📊 Analytics e Relatórios',
    icon: '📊',
    children: [
      { id: 'advanced-analysis', label: 'Analytics Avançados', icon: '📈' },
      { id: 'reports', label: 'Gestão de Relatórios', icon: '📋' },
      { id: 'realtime-monitoring', label: 'Métricas Tempo Real', icon: '👁️' },
    ]
  },

  // 🖥️ SYSTEM MANAGEMENT
  {
    id: 'system-management',
    label: '🖥️ Gestão do Sistema',
    icon: '🖥️',
    children: [
      { id: 'services-status', label: 'Estado dos Serviços', icon: '🔧' },
      { id: 'system-health', label: 'Saúde do Sistema', icon: '📊' },
      { id: 'performance-monitor', label: 'Monitor Performance', icon: '⚡' },
    ]
  },

  // 🔐 SECURITY & MONITORING
  {
    id: 'security-monitoring',
    label: '🔐 Segurança e Monitorização',
    icon: '🔐',
    children: [
      { id: 'auto-alerts', label: 'Alertas Automáticos', icon: '🔔' },
      { id: 'auth-enterprise', label: 'Autenticação Enterprise', icon: '🔐' },
      { id: 'backup-security', label: 'Backup e Segurança', icon: '🛡️' },
    ]
  },

  // 📱 MOBILE & DEMOS
  {
    id: 'mobile-demos',
    label: '📱 Mobile e Demos',
    icon: '📱',
    children: [
      { id: 'mobile-pwa', label: 'Mobile PWA Avançado', icon: '📱' },
      { id: 'demo-enhanced', label: 'Demo Neptune(ANG) Enhanced', icon: '🚀' },
      { id: 'minpermar', label: 'Site MINPERMAR', icon: '🏛️' },
    ]
  }
]

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  open?: boolean
  onClose?: () => void
}

export function SidebarStaticSiliconValley({ activeSection, onSectionChange, open = false, onClose }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['scientific-hub', 'ml-system', 'qgis-advanced'])
  const router = useRouter()

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSectionClick = (sectionId: string) => {
    // Navegação direta para páginas específicas
    if (sectionId === 'scientific-interfaces' || sectionId === 'portal-interfaces' || sectionId === 'scientific-hub') {
      router.push('/scientific-hub')
    } else {
      // Comportamento padrão para outras seções
      onSectionChange(sectionId)
    }
    
    // Fechar sidebar no mobile após seleção
    if (window.innerWidth < 1024 && onClose) {
      onClose()
    }
  }

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-80 ubiquiti-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo Header */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-700">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-1 flex items-center justify-center">
            <span className="text-2xl">🌊</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Neptune(ANG)</h2>
            <p className="text-sm text-slate-300">Marine Angola</p>
          </div>
          <div className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">
            v2.0.0
          </div>
        </div>

        {/* Status */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            ✅ Sistema deployado e pronto para clientes
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.children) {
                      toggleExpanded(item.id)
                    } else {
                      handleSectionClick(item.id)
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200",
                    activeSection === item.id
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                  
                  {item.badge && (
                    <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                      {item.badge}
                    </span>
                  )}
                  

                  
                  {item.children && (
                    <span className="text-lg shrink-0">
                      {expandedItems.includes(item.id) ? '🔽' : '▶️'}
                    </span>
                  )}
                </button>
                
                {/* Subitems */}
                {item.children && expandedItems.includes(item.id) && (
                  <div className="mt-1 ml-8 space-y-1">
                    {item.children.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleSectionClick(subItem.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200",
                          activeSection === subItem.id
                            ? "bg-blue-500 text-white"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white"
                        )}
                      >
                        <span className="text-sm shrink-0">{subItem.icon}</span>
                        <span className="flex-1 truncate text-sm">{subItem.label}</span>
                        
                        {subItem.badge && (
                          <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs">
                            {subItem.badge}
                          </span>
                        )}
                        

                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 text-center">
            Sistema Completo ✨ Demo 17 Set
          </div>
        </div>
      </div>
    </div>
  )
}
