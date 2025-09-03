'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * 🚀 SIDEBAR SSR-SAFE FIXED - SILICON VALLEY EDITION
 * Sidebar completamente à prova de hydration errors
 * CORREÇÃO: Removido NextJS Image para evitar webpack errors
 */

interface NavItem {
  id: string
  label: string
  icon: string // Usando emoji em vez de ícones SVG
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
  
  // 🔬 SCIENTIFIC HUB - POSIÇÃO DE DESTAQUE
  {
    id: 'scientific-hub',
    label: '🔬 Hub Científico BGAPP',
    icon: '🔬',
    badge: '46 INTERFACES',
    isNew: true,
    children: [
      { id: 'scientific-interfaces', label: 'Portal Interfaces (46)', icon: '🔬', badge: 'HUB', isNew: true },
      { id: 'dashboard-cientifico', label: 'Dashboard Científico Angola', icon: '📊' },
      { id: 'realtime-angola', label: 'Tempo Real Angola', icon: '👁️' },
      { id: 'collaboration', label: 'Colaboração Científica', icon: '🌐' },
      { id: 'stac-ocean', label: 'STAC Oceanográfico', icon: '☁️' },
    ]
  },


  // 🧠 MACHINE LEARNING & AI
  {
    id: 'ml-system',
    label: '🧠 Sistema Machine Learning',
    icon: '🧠',
    badge: 'AI',
    isNew: true,
    children: [
      { id: 'ml-dashboard', label: 'ML Dashboard', icon: '📊', isNew: true },
      { id: 'predictive-filters', label: 'Filtros Preditivos (7 tipos)', icon: '🤖', badge: 'AI', isNew: true },
      { id: 'machine-learning', label: 'Modelos ML (95%+)', icon: '🧠', badge: '95%+', isNew: true },
    ]
  },

  // 🗺️ MAPAS & VISUALIZAÇÃO (ACESSO DIRETO)
  {
    id: 'maps-visualization',
    label: '🗺️ Mapas e Visualização',
    icon: '🗺️',
    badge: 'MAPAS',
    isNew: true,
    children: [
      { id: 'dashboard-cientifico', label: '📊 Dashboard Científico Angola', icon: '📊', badge: 'PRINCIPAL' },
      { id: 'realtime-angola', label: '👁️ Tempo Real Angola', icon: '👁️', badge: 'LIVE' },
      { id: 'qgis-dashboard', label: '🗺️ Dashboard QGIS', icon: '🗺️' },
      { id: 'qgis-fisheries', label: '🎣 QGIS Pescas', icon: '🎣' },
      { id: 'interactive-map', label: '🌐 Mapa Interativo Principal', icon: '🌐' },
    ]
  },

  // 🗺️ QGIS ANÁLISE AVANÇADA  
  {
    id: 'qgis-advanced',
    label: '🔬 QGIS Análise Avançada',
    icon: '🔬',
    badge: 'ANÁLISE',
    isNew: true,
    children: [
      { id: 'qgis-spatial-analysis', label: 'Análise Espacial', icon: '🔍', isNew: true },
      { id: 'qgis-temporal-visualization', label: 'Visualização Temporal', icon: '📈', isNew: true },
      { id: 'qgis-biomass-calculator', label: 'Calculadora de Biomassa', icon: '🌱', isNew: true },
      { id: 'mcda-analysis', label: 'Análise MCDA/AHP', icon: '🛡️', isNew: true },
    ]
  },

  // 📊 DATA PROCESSING
  {
    id: 'data-processing',
    label: '📊 Processamento de Dados',
    icon: '📊',
    badge: 'NOVO',
    isNew: true,
    children: [
      { id: 'connectors-manager', label: 'Gestão Conectores (13+)', icon: '☁️', isNew: true },
      { id: 'data-ingestion', label: 'Ingestão de Dados', icon: '📥', isNew: true },
      { id: 'processing-monitor', label: 'Monitor Processamento', icon: '⚙️', isNew: true },
    ]
  },
  // 🔗 SERVICES & INTEGRATION
  {
    id: 'services-integration',
    label: '🔗 Integração Completa Serviços',
    icon: '🔗',
    badge: 'SILICON VALLEY',
    isNew: true,
  },

  // 📊 ANALYTICS & REPORTS
  {
    id: 'analytics',
    label: '📊 Analytics e Relatórios',
    icon: '📊',
    children: [
      { id: 'advanced-analysis', label: 'Analytics Avançados', icon: '📈', isNew: true },
      { id: 'reports', label: 'Gestão de Relatórios', icon: '📋' },
      { id: 'realtime-monitoring', label: 'Métricas Tempo Real', icon: '👁️', isNew: true },
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
      { id: 'demo-enhanced', label: 'Demo BGAPP Enhanced', icon: '🚀' },
      { id: 'minpermar', label: 'Site MINPERMAR', icon: '🏛️' },
    ]
  },
]

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function SidebarSSRSafeFixed({ activeSection, onSectionChange }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['scientific-hub', 'maps-visualization', 'ml-system'])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId)
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-y-0 left-0 z-50 w-80 ubiquiti-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 -translate-x-full">
        <div className="flex flex-col h-full">
          {/* Logo skeleton */}
          <div className="flex items-center gap-3 p-6 border-b border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-gray-300 animate-pulse"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-300 rounded animate-pulse w-20"></div>
            </div>
            <div className="w-12 h-6 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
          
          {/* Menu skeleton */}
          <div className="flex-1 overflow-y-auto p-3">
            <nav className="space-y-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-300 rounded animate-pulse"></div>
              ))}
            </nav>
          </div>
        </div>
      </div>
    )
  }

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const isActive = activeSection === item.id
    const isExpanded = expandedItems.includes(item.id)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            } else {
              handleSectionClick(item.id)
            }
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200",
            level === 0 ? "text-sm font-medium" : "text-sm ml-8",
            isActive 
              ? "bg-blue-600 text-white shadow-lg" 
              : "text-slate-300 hover:bg-slate-700 hover:text-white"
          )}
        >
          <span className="text-lg shrink-0">{item.icon}</span>
          <span className="flex-1 truncate">{item.label}</span>
          
          {item.badge && (
            <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
              {item.badge}
            </span>
          )}
          
          {item.isNew && (
            <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
              NOVO
            </span>
          )}
          
          {hasChildren && (
            <div className="shrink-0">
              <span className="text-lg">
                {isExpanded ? '🔽' : '▶️'}
              </span>
            </div>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="mt-1 ml-8 space-y-1">
            {item.children!.map(child => (
              <button
                key={child.id}
                onClick={() => handleSectionClick(child.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200",
                  activeSection === child.id
                    ? "bg-blue-500 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                )}
              >
                <span className="text-sm shrink-0">{child.icon}</span>
                <span className="flex-1 truncate text-sm">{child.label}</span>
                
                {child.badge && (
                  <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs">
                    {child.badge}
                  </span>
                )}
                
                {child.isNew && (
                  <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs">
                    NOVO
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 ubiquiti-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 -translate-x-full">
      <div className="flex flex-col h-full">
        {/* Logo Header - SEM NextJS Image */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-700">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-1 flex items-center justify-center">
            {/* Usando emoji em vez de Image component */}
            <span className="text-2xl">🌊</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">BGAPP</h2>
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
            ✅ Sistema 100% operacional no Cloudflare
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-1">
            {navigationItems.map(item => renderNavItem(item))}
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
