/**
 * 🎯 SIDEBAR SIMPLIFICADA - Versão Otimizada
 * Menu reorganizado e simplificado para melhor UX
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { InterfaceCounter } from '@/lib/bgapp/interface-counter'
import { 
  ChartBarIcon,
  BeakerIcon,
  CpuChipIcon,
  MapIcon,
  ChartPieIcon,
  CogIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  CircleStackIcon as DatabaseIcon
} from '@heroicons/react/24/outline'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<any> | string
  badge?: string
  children?: NavItem[]
  description?: string
}

// 🎯 Estrutura simplificada e organizada
const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: ChartBarIcon,
    description: 'Visão geral do sistema'
  },
  
  {
    id: 'scientific-hub',
    label: 'Hub Científico',
    icon: BeakerIcon,
    badge: InterfaceCounter.generateBadge(),
    description: 'Todas as interfaces científicas',
    children: [
      { id: 'portal-interfaces', label: 'Portal Interfaces (44)', icon: '🔬', badge: 'HUB' },
      { id: 'stac-enhanced', label: 'STAC Avançado', icon: '🛰️', badge: 'NOVO' },
      { id: 'ocean-system', label: 'Enhanced Ocean System', icon: '🌊', badge: 'NOVO' }
    ]
  },
  
  {
    id: 'realtime-angola',
    label: 'Tempo Real Angola',
    icon: EyeIcon,
    badge: 'LIVE',
    description: 'Monitorização em tempo real'
  },
  
  {
    id: 'global-fishing-watch',
    label: 'Global Fishing Watch',
    icon: '🎣',
    badge: 'NOVO',
    description: 'Monitorização de atividades pesqueiras'
  },
  
  {
    id: 'machine-learning',
    label: 'Machine Learning',
    icon: CpuChipIcon,
    children: [
      { id: 'ml-dashboard', label: 'Dashboard ML', icon: '📊' },
      { id: 'predictive-filters', label: 'Filtros Preditivos', icon: '🤖' },
      { id: 'ml-models', label: 'Modelos', icon: '🧠' },
      { id: 'ml-retention', label: 'Base Retenção', icon: '🗄️' }
    ]
  },
  
  {
    id: 'spatial-analysis',
    label: 'Análise Espacial',
    icon: MapIcon,
    children: [
      { id: 'qgis-dashboard', label: 'QGIS Dashboard', icon: '🗺️' },
      { id: 'spatial-analysis', label: 'Análise Espacial', icon: '🔍' },
      { id: 'temporal-viz', label: 'Visualização Temporal', icon: '📈' },
      { id: 'biomass-calc', label: 'Calculadora Biomassa', icon: '🌱' }
    ]
  },
  
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    icon: ChartPieIcon,
    children: [
      { id: 'advanced-analytics', label: 'Analytics Avançado', icon: '📊' },
      { id: 'reports', label: 'Relatórios', icon: '📋' },
      { id: 'metrics', label: 'Métricas', icon: '📈' }
    ]
  },
  
  {
    id: 'system',
    label: 'Sistema',
    icon: CogIcon,
    children: [
      { id: 'services-status', label: 'Estado dos Serviços', icon: '🔧' },
      { id: 'system-health', label: 'Saúde do Sistema', icon: '💚' },
      { id: 'config', label: 'Configurações', icon: '⚙️' }
    ]
  },
  
  {
    id: 'security',
    label: 'Segurança',
    icon: ShieldCheckIcon,
    children: [
      { id: 'auth', label: 'Autenticação', icon: '🔐' },
      { id: 'backup', label: 'Backup', icon: '💾' },
      { id: 'alerts', label: 'Alertas', icon: '🔔' }
    ]
  },
  
  {
    id: 'mobile',
    label: 'Mobile & Demos',
    icon: DevicePhoneMobileIcon,
    children: [
      { id: 'mobile-pwa', label: 'Mobile PWA', icon: '📱' },
      { id: 'demos', label: 'Demos', icon: '🚀' }
    ]
  }
]

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  open?: boolean
  onClose?: () => void
}

export function SidebarSimplified({ 
  activeSection, 
  onSectionChange, 
  open = false, 
  onClose 
}: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }
  
  const handleItemClick = (item: NavItem) => {
    if (item.children) {
      toggleExpanded(item.id)
    } else {
      onSectionChange(item.id)
      
      // Navegação específica para STAC Enhanced
      if (item.id === 'stac-enhanced') {
        window.location.href = '/stac-enhanced'
      }
      
      if (window.innerWidth < 1024 && onClose) {
        onClose()
      }
    }
  }
  
  const renderIcon = (icon: React.ComponentType<any> | string) => {
    if (typeof icon === 'string') {
      return <span className="text-lg">{icon}</span>
    }
    const IconComponent = icon
    return <IconComponent className="h-5 w-5" />
  }
  
  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-800",
      "transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-2xl">🌊</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Neptune(ANG)</h2>
            <p className="text-xs text-slate-400">Marine Angola v2.0</p>
          </div>
        </div>
        
        {/* Status */}
        <div className="px-5 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400">Sistema Operacional</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                    "text-left transition-all duration-200",
                    activeSection === item.id
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  )}
                  title={item.description}
                >
                  {renderIcon(item.icon)}
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      item.badge === 'LIVE' 
                        ? "bg-green-500 text-white animate-pulse"
                        : "bg-blue-500 text-white"
                    )}>
                      {item.badge}
                    </span>
                  )}
                  {item.children && (
                    <span className="text-xs">
                      {expandedItems.includes(item.id) ? '▼' : '▶'}
                    </span>
                  )}
                </button>
                
                {/* Children */}
                {item.children && expandedItems.includes(item.id) && (
                  <div className="mt-1 ml-8 space-y-1">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => {
                          onSectionChange(child.id)
                          
                          // Navegação específica para itens do Hub Científico
                          if (child.id === 'stac-enhanced') {
                            window.location.href = '/stac-enhanced'
                          } else if (child.id === 'portal-interfaces') {
                            window.location.href = '/scientific-hub'
                          }
                          
                          if (window.innerWidth < 1024 && onClose) {
                            onClose()
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
                          "text-left text-sm transition-all duration-200",
                          activeSection === child.id
                            ? "bg-slate-700 text-white"
                            : "text-slate-400 hover:bg-slate-700/30 hover:text-white"
                        )}
                      >
                        <span className="text-xs">{child.icon}</span>
                        <span className="flex-1">{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="text-center">
            <p className="text-xs text-slate-500">
              {InterfaceCounter.getTotalCount()} Interfaces • {InterfaceCounter.getCategoryCount()} Categorias
            </p>
            <p className="text-xs text-slate-600 mt-1">
              © 2025 MareDatum
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SidebarSimplified;
