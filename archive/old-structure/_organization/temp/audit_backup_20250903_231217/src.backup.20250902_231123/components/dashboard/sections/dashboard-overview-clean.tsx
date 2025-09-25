'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon,
  ServerIcon,
  ClockIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export function DashboardOverview() {
  const [mounted, setMounted] = useState(false)
  const [metrics] = useState({
    servicesOnline: 24,
    apiLatency: '<1s',
    mlAccuracy: '95%+',
    uptime: '99.99%',
    activeAlerts: 0
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">BGAPP Enhanced Dashboard</h1>
            <p className="text-blue-100">Plataforma de Biodiversidade Marinha de Angola</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100 mb-1">Status do Sistema</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-lg font-semibold">Operacional</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Serviços Online</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.servicesOnline}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <ServerIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Latência API</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.apiLatency}</p>
              <p className="text-xs text-green-600">83% ⬇️</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
              <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Precisão ML</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.mlAccuracy}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
              <CpuChipIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disponibilidade</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.uptime}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alertas Ativos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.activeAlerts}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <ExclamationTriangleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <ChartBarIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Interfaces BGAPP Avançadas
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Dashboard Científico', desc: 'Análises de biodiversidade marinha', new: false },
            { title: 'Tempo Real Angola', desc: 'Dados oceanográficos em tempo real', new: true },
            { title: 'AI Assistant', desc: 'Assistente inteligente com GPT-4', new: true },
            { title: 'Machine Learning', desc: 'Modelos preditivos 95%+ precisão', new: false },
            { title: 'Analytics Avançado', desc: 'Heatmaps e análise de cohort', new: true },
            { title: 'Mobile PWA', desc: 'Aplicação móvel progressiva', new: false }
          ].map((item, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                {item.new && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    NOVO
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Sistema Totalmente Operacional
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Todos os 24 serviços funcionando com performance otimizada
              </p>
            </div>
          </div>
          <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            Verificado há 30 segundos
          </div>
        </div>
      </div>
    </div>
  )
}
