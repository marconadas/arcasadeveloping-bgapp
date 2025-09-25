'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * 🚀 SIDEBAR SSR-SAFE - SILICON VALLEY EDITION
 * Sidebar completamente à prova de hydration errors
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
  {
    id: 'dashboard',
    label: 'Dashboard Administrativo',
    icon: '📊',
  },
  {
    id: 'bgapp-integration',
    label: '🚀 BGAPP Sistema Completo',
    icon: '🚀',
    badge: 'NOVO',
    isNew: true,
  },
  {
    id: 'ml',
    label: '🧠 Machine Learning',
    icon: '🧠',
    badge: 'NOVO',
    isNew: true,
    children: [
      { id: 'ml-predictive-filters', label: 'Filtros Preditivos', icon: '🤖', badge: 'AI', isNew: true },
      { id: 'ml-models', label: 'Modelos de IA', icon: '🧠', isNew: true },
      { id: 'ml-auto-ingestion', label: 'Auto-Ingestão ML', icon: '📥', isNew: true },
    ]
  },
  {
    id: 'qgis',
    label: '🗺️ QGIS Avançado',
    icon: '🗺️',
    badge: 'NOVO',
    isNew: true,
    children: [
      { id: 'qgis-spatial-analysis', label: 'Análise Espacial', icon: '🔍', isNew: true },
      { id: 'qgis-temporal-visualization', label: 'Visualização Temporal', icon: '📈', isNew: true },
      { id: 'qgis-biomass-calculator', label: 'Calculadora de Biomassa', icon: '🌱', isNew: true },
      { id: 'qgis-migration-overlay', label: 'Migração vs Pesca', icon: '🐋', isNew: true },
      { id: 'qgis-sustainable-zones', label: 'Zonas Sustentáveis MCDA', icon: '🎯', isNew: true },
    ]
  },
  {
    id: 'scientific',
    label: '🔬 Interfaces Científicas',
    icon: '🔬',
    children: [
      { id: 'scientific-angola', label: 'Dashboard Científico Angola', icon: '📊' },
      { id: 'scientific-advanced', label: 'Dashboard Científico Avançado', icon: '🔬' },
      { id: 'collaboration', label: 'Colaboração Científica', icon: '🌐' },
      { id: 'stac-ocean', label: 'STAC Oceanográfico', icon: '☁️' },
    ]
  },
  {
    id: 'maps',
    label: '🗺️ Mapas e Visualização',
    icon: '🗺️',
    children: [
      { id: 'interactive-map', label: 'Mapa Interativo Principal', icon: '🗺️' },
      { id: 'realtime-angola', label: 'Tempo Real Angola', icon: '👁️' },
      { id: 'qgis-dashboard', label: 'Dashboard QGIS', icon: '🗺️' },
      { id: 'qgis-fisheries', label: 'QGIS Pescas', icon: '🎣' },
    ]
  },
  {
    id: 'analysis',
    label: '📊 Análises e Processamento',
    icon: '📊',
    children: [
      { id: 'advanced-analysis', label: 'Analytics Avançados', icon: '📈', isNew: true },
      { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖', badge: 'GPT-4', isNew: true },
      { id: 'realtime-monitoring', label: 'Métricas Tempo Real', icon: '👁️', isNew: true },
      { id: 'metocean-animations', label: 'Animações Meteorológicas', icon: '🌊' },
      { id: 'data-processing', label: 'Processamento de Dados', icon: '⚙️' },
    ]
  },
  {
    id: 'mobile',
    label: '📱 Interfaces Mobile',
    icon: '📱',
    children: [
      { id: 'mobile-pwa', label: 'Mobile PWA Avançado', icon: '📱' },
      { id: 'mobile-basic', label: 'Interface Mobile Básica', icon: '📱' },
    ]
  }
]

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function SidebarSSRSafe({ activeSection, onSectionChange }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['scientific', 'maps', 'analysis'])
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
        {/* Logo Header */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-700">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-1">
            <Image
              src="/logo.png"
              alt="BGAPP Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
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
            25 funcionalidades ativas
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
            Sistema Completo ✨
          </div>
        </div>
      </div>
    </div>
  )
}
