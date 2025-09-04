'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { 
  ChartBarIcon, 
  ServerIcon, 
  CircleStackIcon,
  CloudArrowUpIcon,
  CpuChipIcon,
  BeakerIcon,

  DevicePhoneMobileIcon,
  BoltIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  BuildingStorefrontIcon,
  FolderIcon,
  CogIcon,
  WrenchScrewdriverIcon,
  RocketLaunchIcon,
  MapIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<any>
  children?: NavItem[]
  badge?: string
  isNew?: boolean
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Administrativo',
    icon: ChartBarIcon,
  },
  {
    id: 'scientific-hub',
    label: '🔬 Hub Científico BGAPP',
    icon: BeakerIcon,
    badge: '46 INTERFACES',
    isNew: true,
    children: [
      { id: 'scientific-interfaces', label: 'Portal Interfaces (46)', icon: BeakerIcon, badge: 'HUB', isNew: true },
      { id: 'dashboard-cientifico', label: 'Dashboard Científico Angola', icon: ChartBarIcon },
      { id: 'realtime-angola', label: 'Tempo Real Angola', icon: EyeIcon },
      { id: 'qgis-tools', label: 'Ferramentas QGIS', icon: MapIcon },
      { id: 'collaboration', label: 'Colaboração Científica', icon: GlobeAltIcon },
      { id: 'stac-ocean', label: 'STAC Oceanográfico', icon: CloudArrowUpIcon },
    ]
  },

  {
    id: 'services-integration',
    label: '🔗 Integração Completa Serviços',
    icon: ServerIcon,
    badge: 'SILICON VALLEY',
    isNew: true,
  },
  {
    id: 'ml-system',
    label: '🧠 Sistema Machine Learning',
    icon: CpuChipIcon,
    badge: 'AI',
    isNew: true,
    children: [
      { id: 'ml-dashboard', label: 'ML Dashboard', icon: ChartBarIcon, isNew: true },
      { id: 'predictive-filters', label: 'Filtros Preditivos (7 tipos)', icon: BeakerIcon, badge: 'AI', isNew: true },
      { id: 'models-manager', label: 'Gestor Modelos ML', icon: CpuChipIcon, isNew: true },
      { id: 'auto-ingestion', label: 'Auto-Ingestão ML', icon: CloudArrowUpIcon, isNew: true },
    ]
  },
  {
    id: 'qgis-advanced',
    label: '🗺️ QGIS Sistema Avançado',
    icon: MapIcon,
    badge: 'NOVO',
    isNew: true,
    children: [
      { id: 'spatial-analysis', label: 'Análise Espacial', icon: MapIcon, isNew: true },
      { id: 'temporal-visualization', label: 'Visualização Temporal', icon: ChartBarIcon, isNew: true },
      { id: 'biomass-calculator', label: 'Calculadora Biomassa', icon: BeakerIcon, isNew: true },
      { id: 'mcda-analysis', label: 'Análise MCDA/AHP', icon: ShieldCheckIcon, isNew: true },
    ]
  },
  {
    id: 'data-processing',
    label: '📊 Processamento de Dados',
    icon: CircleStackIcon,
    badge: 'NOVO',
    isNew: true,
    children: [
      { id: 'connectors-manager', label: 'Gestão Conectores (13+)', icon: CloudArrowUpIcon, isNew: true },
      { id: 'processing-monitor', label: 'Monitor Processamento', icon: CpuChipIcon, isNew: true },
      { id: 'quality-control', label: 'Controle Qualidade', icon: ShieldCheckIcon, isNew: true },
    ]
  },

  {
    id: 'maps',
    label: '🗺️ Mapas e Visualização',
    icon: MapIcon,
    children: [
      { id: 'interactive-map', label: 'Mapa Interativo Principal', icon: MapIcon },
      { id: 'realtime-angola', label: 'Tempo Real Angola', icon: EyeIcon },
      { id: 'qgis-dashboard', label: 'Dashboard QGIS', icon: MapIcon },
      { id: 'qgis-fisheries', label: 'QGIS Pescas', icon: MapIcon },
    ]
  },
  {
    id: 'ml',
    label: '🧠 Machine Learning',
    icon: CpuChipIcon,
    badge: 'NOVO',
    isNew: true,
    children: [
      { id: 'ml-predictive-filters', label: 'Filtros Preditivos', icon: BeakerIcon, badge: 'AI', isNew: true },
      { id: 'ml-models', label: 'Modelos de IA', icon: CpuChipIcon, isNew: true },
      { id: 'ml-auto-ingestion', label: 'Auto-Ingestão ML', icon: CloudArrowUpIcon, isNew: true },
    ]
  },
  {
    id: 'qgis',
    label: '🗺️ QGIS Avançado',
    icon: MapIcon,
    badge: 'NOVO',
    isNew: true,
    children: [
      { id: 'qgis-spatial-analysis', label: 'Análise Espacial', icon: MapIcon, isNew: true },
      { id: 'qgis-temporal-visualization', label: 'Visualização Temporal', icon: ChartBarIcon, isNew: true },
      { id: 'qgis-biomass-calculator', label: 'Calculadora de Biomassa', icon: BeakerIcon, isNew: true },
      { id: 'qgis-migration-overlay', label: 'Migração vs Pesca', icon: EyeIcon, isNew: true },
      { id: 'qgis-sustainable-zones', label: 'Zonas Sustentáveis MCDA', icon: ShieldCheckIcon, isNew: true },
    ]
  },
  {
    id: 'analysis',
    label: '📊 Análises e Processamento',
    icon: ChartBarIcon,
    children: [
      { id: 'advanced-analysis', label: 'Analytics Avançados', icon: ChartBarIcon, isNew: true },
      { id: 'ai-assistant', label: 'AI Assistant', icon: BeakerIcon, badge: 'GPT-4', isNew: true },
      { id: 'realtime-monitoring', label: 'Métricas Tempo Real', icon: EyeIcon, isNew: true },
      { id: 'metocean-animations', label: 'Animações Meteorológicas', icon: CloudArrowUpIcon },
      { id: 'data-processing', label: 'Processamento de Dados', icon: CpuChipIcon },
    ]
  },
  {
    id: 'mobile',
    label: '📱 Interfaces Mobile',
    icon: DevicePhoneMobileIcon,
    children: [
      { id: 'mobile-pwa', label: 'Mobile PWA Avançado', icon: DevicePhoneMobileIcon },
      { id: 'mobile-basic', label: 'Interface Mobile Básica', icon: DevicePhoneMobileIcon },
    ]
  },
  {
    id: 'demos',
    label: '🚀 Demos e Testes',
    icon: RocketLaunchIcon,
    children: [
      { id: 'demo-enhanced', label: 'Demo BGAPP Enhanced', icon: RocketLaunchIcon },
      { id: 'demo-wind', label: 'Demo Animações Vento', icon: CloudArrowUpIcon },
    ]
  },
  {
    id: 'sites',
    label: '🌐 Sites e Portais',
    icon: GlobeAltIcon,
    children: [
      { id: 'minpermar', label: 'Site MINPERMAR', icon: BuildingStorefrontIcon },
    ]
  },
  {
    id: 'performance',
    label: '⚡ Performance e Cache',
    icon: BoltIcon,
    children: [
      { id: 'cache-redis', label: 'Cache Redis (83% ⬆️)', icon: BoltIcon, badge: '83%' },
      { id: 'async-processing', label: 'Processamento Assíncrono', icon: CpuChipIcon },
    ]
  },
  {
    id: 'ml-ai',
    label: '🤖 IA e Machine Learning',
    icon: CpuChipIcon,
    children: [
      { id: 'machine-learning', label: 'Machine Learning (95%+)', icon: CpuChipIcon, badge: '95%+' },
      { id: 'predictive-models', label: 'Modelos Preditivos', icon: CpuChipIcon },
    ]
  },
  {
    id: 'security',
    label: '🔐 Segurança e Autenticação',
    icon: ShieldCheckIcon,
    children: [
      { id: 'auth-enterprise', label: 'Autenticação Enterprise', icon: ShieldCheckIcon },
      { id: 'backup-security', label: 'Backup e Segurança', icon: ShieldCheckIcon },
    ]
  },
  {
    id: 'monitoring',
    label: '🔔 Monitorização e Alertas',
    icon: BellIcon,
    children: [
      { id: 'auto-alerts', label: 'Alertas Automáticos', icon: BellIcon },
      { id: 'realtime-monitoring', label: 'Monitorização Tempo Real', icon: EyeIcon },
      { id: 'system-health', label: 'Saúde do Sistema', icon: ChartBarIcon },
    ]
  },
  {
    id: 'apis',
    label: '🌐 APIs e Conectividade',
    icon: GlobeAltIcon,
    children: [
      { id: 'api-gateway', label: 'API Gateway', icon: GlobeAltIcon },
      { id: 'apis-connectors', label: 'APIs e Conectores', icon: CloudArrowUpIcon },
    ]
  },
  {
    id: 'infrastructure',
    label: '🖥️ Infraestrutura e Serviços',
    icon: ServerIcon,
    children: [
      { id: 'services-status', label: 'Estado dos Serviços', icon: ServerIcon },
      { id: 'databases', label: 'Bases de Dados', icon: CircleStackIcon },
      { id: 'storage', label: 'Armazenamento', icon: CloudArrowUpIcon },
      { id: 'health-dashboard', label: 'Dashboard de Saúde', icon: ChartBarIcon },
    ]
  },
  {
    id: 'data-management',
    label: '📁 Gestão de Dados',
    icon: FolderIcon,
    children: [
      { id: 'data-ingestion', label: 'Ingestão de Dados', icon: CloudArrowUpIcon },
      { id: 'reports', label: 'Relatórios', icon: FolderIcon },
    ]
  },
  {
    id: 'settings',
    label: '⚙️ Configurações',
    icon: CogIcon,
    children: [
      { id: 'system-config', label: 'Configurações Sistema', icon: CogIcon },
      { id: 'user-management', label: 'Gestão Utilizadores', icon: GlobeAltIcon },
    ]
  },
  {
    id: 'development',
    label: '🛠️ Desenvolvimento e Debug',
    icon: WrenchScrewdriverIcon,
    children: [
      { id: 'system-logs', label: 'Logs do Sistema', icon: FolderIcon },
      { id: 'debug-interface', label: 'Interface de Debug', icon: WrenchScrewdriverIcon },
      { id: 'test-dashboard', label: 'Dashboard de Testes', icon: ChartBarIcon },
    ]
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  currentSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ open, onClose, currentSection, onSectionChange }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['scientific-hub', 'maps'])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleItemClick = (itemId: string, hasChildren: boolean) => {
    if (hasChildren) {
      toggleExpanded(itemId)
    } else {
      onSectionChange(itemId)
      if (window.innerWidth < 1024) {
        onClose()
      }
    }
  }

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-80 ubiquiti-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Header with logo */}
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

        {/* Status indicator */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            🔬 Hub Científico com 46 interfaces ativas
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => handleItemClick(item.id, !!item.children)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200",
                    currentSection === item.id
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 truncate text-sm font-medium">
                    {item.label}
                  </span>
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
                  {item.children && (
                    <div className="shrink-0">
                      {expandedItems.includes(item.id) ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </button>
                
                {/* Subitems */}
                {item.children && expandedItems.includes(item.id) && (
                  <div className="mt-1 ml-8 space-y-1">
                    {item.children.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleItemClick(subItem.id, false)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200",
                          currentSection === subItem.id
                            ? "bg-blue-600 text-white shadow-lg"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white"
                        )}
                      >
                        <subItem.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate text-sm">
                          {subItem.label}
                        </span>
                        {subItem.badge && (
                          <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                            {subItem.badge}
                          </span>
                        )}
                        {subItem.isNew && (
                          <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                            NOVO
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
            Sistema Completo ✨
          </div>
        </div>
      </div>
    </div>
  )
}