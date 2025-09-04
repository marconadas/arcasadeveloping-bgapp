'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  Bars3Icon,
  BellIcon,
  ArrowPathIcon,
  ComputerDesktopIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useTheme } from 'next-themes'

interface HeaderProps {
  onMenuClick: () => void
  currentSection: string
}

const sectionTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  'scientific-angola': 'Dashboard Científico Angola',
  'scientific-advanced': 'Dashboard Científico Avançado',
  collaboration: 'Colaboração Científica',
  'stac-ocean': 'STAC Oceanográfico',
  'interactive-map': 'Mapa Interativo Principal',
  'realtime-angola': 'Tempo Real Angola',
  'qgis-dashboard': 'Dashboard QGIS',
  'qgis-fisheries': 'QGIS Pescas',
  'advanced-analysis': 'Análises Avançadas',
  'metocean-animations': 'Animações Meteorológicas',
  'data-processing': 'Processamento de Dados',
  'mobile-pwa': 'Mobile PWA Avançado',
  'mobile-basic': 'Interface Mobile Básica',
  'demo-enhanced': 'Demo BGAPP Enhanced',
  'demo-wind': 'Demo Animações Vento',
  minpermar: 'Site MINPERMAR',
  'cache-redis': 'Cache Redis',
  'async-processing': 'Processamento Assíncrono',
  'machine-learning': 'Machine Learning',
  'predictive-models': 'Modelos Preditivos',
  'auth-enterprise': 'Autenticação Enterprise',
  'backup-security': 'Backup e Segurança',
  'auto-alerts': 'Alertas Automáticos',
  'realtime-monitoring': 'Monitorização Tempo Real',
  'system-health': 'Saúde do Sistema',
  'api-gateway': 'API Gateway',
  'apis-connectors': 'APIs e Conectores',
  'services-status': 'Estado dos Serviços',
  databases: 'Bases de Dados',
  storage: 'Armazenamento',
  'health-dashboard': 'Dashboard de Saúde',
  'data-ingestion': 'Ingestão de Dados',
  reports: 'Relatórios',
  'system-config': 'Configurações Sistema',
  'user-management': 'Gestão Utilizadores',
  'system-logs': 'Logs do Sistema',
  'debug-interface': 'Interface de Debug',
  'test-dashboard': 'Dashboard de Testes',
}

export function Header({ onMenuClick, currentSection }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    setMounted(true)
    // Set initial time only after mounting to prevent hydration mismatch
    setLastUpdate(new Date())
    
    // Simulate system status check
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      // Random status for demo
      const statuses: ('healthy' | 'warning' | 'error')[] = ['healthy', 'healthy', 'healthy', 'warning']
      setSystemStatus(statuses[Math.floor(Math.random() * statuses.length)])
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (systemStatus) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (systemStatus) {
      case 'healthy': return '●'
      case 'warning': return '⚠'
      case 'error': return '●'
      default: return '●'
    }
  }

  const getStatusText = () => {
    switch (systemStatus) {
      case 'healthy': return 'Sistema Operacional'
      case 'warning': return 'Sistema com Avisos'
      case 'error': return 'Sistema com Problemas'
      default: return 'Status Desconhecido'
    }
  }

  return (
    <header className="ubiquiti-header">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Page title */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              {sectionTitles[currentSection] || 'Dashboard'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* System status */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <div className={cn("flex items-center gap-1", getStatusColor())}>
              <span className="animate-pulse">{getStatusIcon()}</span>
              <span className="text-slate-600 dark:text-slate-400">
                {getStatusText()}
              </span>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <BellIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          </button>

          {/* Refresh */}
          <button className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowPathIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <MoonIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              )}
            </button>
          )}

          {/* Display settings */}
          <button className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ComputerDesktopIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>

          {/* User menu */}
          <button className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <UserIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Last update time */}
          {mounted && lastUpdate && (
            <div className="hidden lg:block text-xs text-slate-500 dark:text-slate-400">
              Atualizado {lastUpdate?.toLocaleTimeString('pt-PT')}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}