'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  Download,
  Share,
  Eye,
  MousePointer,
  Clock,
  Target,
  Zap,
  Brain,
  Search,
  Map,
  Layers,
  Activity,
  Globe,
  Database,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react'

// Componente simplificado sem Chart.js para evitar problemas de SSR

interface HeatmapCell {
  x: number
  y: number
  value: number
  label: string
}

interface CohortData {
  cohort: string
  period0: number
  period1: number
  period2: number
  period3: number
  period4: number
  period5: number
}

interface FunnelStep {
  name: string
  users: number
  conversion: number
  dropoff: number
}

interface UserSegment {
  id: string
  name: string
  users: number
  growth: number
  engagement: number
  revenue: number
  color: string
}

export function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('users')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Generate sample heatmap data
  const heatmapData = useMemo(() => {
    const data: HeatmapCell[] = []
    const hours = ['00', '04', '08', '12', '16', '20']
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    
    days.forEach((day, dayIndex) => {
      hours.forEach((hour, hourIndex) => {
        const value = Math.floor(Math.random() * 100) + 10
        data.push({
          x: hourIndex,
          y: dayIndex,
          value,
          label: `${day} ${hour}:00`
        })
      })
    })
    return data
  }, [])

  // Generate cohort analysis data
  const cohortData: CohortData[] = [
    { cohort: 'Jan 2024', period0: 100, period1: 65, period2: 45, period3: 32, period4: 28, period5: 25 },
    { cohort: 'Fev 2024', period0: 100, period1: 72, period2: 51, period3: 38, period4: 31, period5: 0 },
    { cohort: 'Mar 2024', period0: 100, period1: 68, period2: 48, period3: 35, period4: 0, period5: 0 },
    { cohort: 'Abr 2024', period0: 100, period1: 75, period2: 54, period3: 0, period4: 0, period5: 0 },
    { cohort: 'Mai 2024', period0: 100, period1: 78, period2: 0, period3: 0, period4: 0, period5: 0 },
    { cohort: 'Jun 2024', period0: 100, period1: 0, period2: 0, period3: 0, period4: 0, period5: 0 },
  ]

  // Funnel data
  const funnelData: FunnelStep[] = [
    { name: 'Visitantes', users: 10000, conversion: 100, dropoff: 0 },
    { name: 'Cadastros', users: 3200, conversion: 32, dropoff: 68 },
    { name: 'Ativação', users: 2400, conversion: 75, dropoff: 25 },
    { name: 'Primeira Análise', users: 1800, conversion: 75, dropoff: 25 },
    { name: 'Usuários Ativos', users: 1440, conversion: 80, dropoff: 20 },
    { name: 'Pagantes', users: 432, conversion: 30, dropoff: 70 },
  ]

  // User segments
  const userSegments: UserSegment[] = [
    {
      id: 'scientists',
      name: 'Cientistas',
      users: 1247,
      growth: 12.5,
      engagement: 85,
      revenue: 45000,
      color: '#10b981'
    },
    {
      id: 'researchers',
      name: 'Pesquisadores',
      users: 834,
      growth: 8.3,
      engagement: 72,
      revenue: 28000,
      color: '#3b82f6'
    },
    {
      id: 'students',
      name: 'Estudantes',
      users: 2156,
      growth: 23.1,
      engagement: 58,
      revenue: 12000,
      color: '#f59e0b'
    },
    {
      id: 'government',
      name: 'Governo',
      users: 156,
      growth: 5.2,
      engagement: 91,
      revenue: 75000,
      color: '#8b5cf6'
    }
  ]

  // Advanced metrics
  const advancedMetrics = {
    userEngagement: {
      dailyActiveUsers: 1247,
      weeklyActiveUsers: 3421,
      monthlyActiveUsers: 8934,
      sessionDuration: '12m 34s',
      bounceRate: 23.4,
      pageViews: 45678
    },
    performance: {
      avgLoadTime: 1.2,
      errorRate: 0.02,
      uptime: 99.97,
      throughput: 1234,
      p95ResponseTime: 245,
      cacheHitRate: 87.3
    },
    business: {
      conversionRate: 4.3,
      customerLifetimeValue: 2340,
      churnRate: 2.1,
      revenuePerUser: 145,
      retentionRate: 78.9,
      growthRate: 15.6
    }
  }

  const getHeatmapColor = (value: number) => {
    const intensity = value / 100
    if (intensity < 0.2) return '#f1f5f9'
    if (intensity < 0.4) return '#bfdbfe'
    if (intensity < 0.6) return '#60a5fa'
    if (intensity < 0.8) return '#3b82f6'
    return '#1d4ed8'
  }

  const getCohortColor = (value: number) => {
    if (value === 0) return '#f1f5f9'
    const intensity = value / 100
    if (intensity < 0.3) return '#fee2e2'
    if (intensity < 0.5) return '#fecaca'
    if (intensity < 0.7) return '#f87171'
    return '#dc2626'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Analytics Avançados
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Análise profunda de dados e comportamento de usuários
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="1y">Último ano</option>
          </select>
          
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="h-4 w-4" />
            Exportar
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        {[
          { id: 'overview', name: 'Visão Geral', icon: BarChart3 },
          { id: 'heatmap', name: 'Heatmap', icon: Map },
          { id: 'cohort', name: 'Cohort', icon: Users },
          { id: 'funnel', name: 'Funil', icon: Target },
          { id: 'segments', name: 'Segmentos', icon: Layers }
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className="h-4 w-4" />
            {tab.name}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Usuários Ativos Diários',
                  value: advancedMetrics.userEngagement.dailyActiveUsers.toLocaleString(),
                  change: '+12.5%',
                  trend: 'up',
                  icon: Users,
                  color: 'emerald'
                },
                {
                  title: 'Taxa de Conversão',
                  value: `${advancedMetrics.business.conversionRate}%`,
                  change: '+2.1%',
                  trend: 'up',
                  icon: Target,
                  color: 'blue'
                },
                {
                  title: 'Tempo de Sessão',
                  value: advancedMetrics.userEngagement.sessionDuration,
                  change: '+1m 23s',
                  trend: 'up',
                  icon: Clock,
                  color: 'purple'
                },
                {
                  title: 'Taxa de Retenção',
                  value: `${advancedMetrics.business.retentionRate}%`,
                  change: '+5.2%',
                  trend: 'up',
                  icon: RefreshCw,
                  color: 'amber'
                }
              ].map((metric, index) => (
                <motion.div
                  key={metric.title}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg bg-${metric.color}-100 dark:bg-${metric.color}-900`}>
                      <metric.icon className={`h-5 w-5 text-${metric.color}-600 dark:text-${metric.color}-400`} />
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">vs período anterior</div>
                      <div className="text-sm font-semibold text-emerald-600">{metric.change}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {metric.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {metric.title}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Tendência de Usuários
                </h3>
                <div className="h-64 flex items-end justify-around bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  {[1200, 1350, 1100, 1400, 1600, 1247].map((value, index) => (
                    <motion.div
                      key={index}
                      className="bg-blue-500 rounded-t-md flex-1 mx-1"
                      style={{ height: `${(value / 1600) * 100}%` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${(value / 1600) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                    >
                      <div className="text-xs text-white text-center pt-2">
                        {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][index]}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Distribuição por Dispositivo
                </h3>
                <div className="h-64 space-y-4 p-4">
                  {[
                    { name: 'Desktop', value: 45, color: 'bg-blue-500' },
                    { name: 'Mobile', value: 40, color: 'bg-green-500' },
                    { name: 'Tablet', value: 15, color: 'bg-amber-500' }
                  ].map((device, index) => (
                    <div key={device.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-700 dark:text-slate-300">{device.name}</span>
                        <span className="font-semibold">{device.value}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3">
                        <motion.div
                          className={`h-3 rounded-full ${device.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${device.value}%` }}
                          transition={{ delay: index * 0.2, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'heatmap' && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Heatmap de Atividade
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Padrões de uso por dia da semana e hora
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span>Baixa</span>
                <div className="flex gap-1">
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: getHeatmapColor(intensity * 100) }}
                    />
                  ))}
                </div>
                <span>Alta</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-1 min-w-full">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, dayIndex) => (
                  <div key={day} className="space-y-1">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 text-center p-2">
                      {day}
                    </div>
                    {['00', '04', '08', '12', '16', '20'].map((hour, hourIndex) => {
                      const cellData = heatmapData.find(d => d.x === hourIndex && d.y === dayIndex)
                      return (
                        <motion.div
                          key={`${day}-${hour}`}
                          className="relative w-16 h-12 rounded-md cursor-pointer group"
                          style={{ backgroundColor: getHeatmapColor(cellData?.value || 0) }}
                          whileHover={{ scale: 1.1, zIndex: 10 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (dayIndex * 6 + hourIndex) * 0.02 }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {hour}
                            </span>
                          </div>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                            {cellData?.label}: {cellData?.value}% ativo
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'cohort' && (
          <motion.div
            key="cohort"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Análise de Cohort
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Taxa de retenção de usuários por período de cadastro
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                      Cohort
                    </th>
                    {[0, 1, 2, 3, 4, 5].map(period => (
                      <th key={period} className="text-center p-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                        Período {period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohortData.map((cohort, index) => (
                    <motion.tr
                      key={cohort.cohort}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <td className="p-3 font-medium text-slate-900 dark:text-white">
                        {cohort.cohort}
                      </td>
                      {[cohort.period0, cohort.period1, cohort.period2, cohort.period3, cohort.period4, cohort.period5].map((value, periodIndex) => (
                        <td key={periodIndex} className="p-3 text-center">
                          <motion.div
                            className="w-full h-8 rounded-md flex items-center justify-center text-sm font-medium"
                            style={{ backgroundColor: getCohortColor(value) }}
                            whileHover={{ scale: 1.05 }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: (index * 6 + periodIndex) * 0.05 }}
                          >
                            {value > 0 ? `${value}%` : '-'}
                          </motion.div>
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'funnel' && (
          <motion.div
            key="funnel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Análise de Funil
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Conversão de usuários através do processo
              </p>
            </div>

            <div className="space-y-4">
              {funnelData.map((step, index) => (
                <motion.div
                  key={step.name}
                  className="relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-32 text-right">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {step.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {step.users.toLocaleString()} usuários
                      </div>
                    </div>
                    
                    <div className="flex-1 relative">
                      <motion.div
                        className="h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-between px-4 shadow-lg"
                        style={{ width: `${step.conversion}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${step.conversion}%` }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                      >
                        <span className="text-white font-semibold">
                          {step.conversion}%
                        </span>
                        {index < funnelData.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-white" />
                        )}
                      </motion.div>
                      
                      {step.dropoff > 0 && (
                        <motion.div
                          className="absolute top-0 right-0 h-12 bg-gradient-to-r from-red-400 to-red-500 rounded-r-lg flex items-center justify-center opacity-30"
                          style={{ width: `${step.dropoff}%` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${step.dropoff}%` }}
                          transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                        >
                          <span className="text-white text-sm">
                            -{step.dropoff}%
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'segments' && (
          <motion.div
            key="segments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Segmentação de Usuários
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Análise detalhada por tipo de usuário
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {userSegments.map((segment, index) => (
                  <motion.div
                    key={segment.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                    style={{ borderLeftColor: segment.color, borderLeftWidth: '4px' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {segment.name}
                      </h4>
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {segment.users.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Usuários Ativos
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-2xl font-bold text-emerald-600">
                          +{segment.growth}%
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Crescimento
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {segment.engagement}%
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Engajamento
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          €{segment.revenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Receita
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Engajamento</span>
                        <span className="text-slate-900 dark:text-white">{segment.engagement}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <motion.div
                          className="h-2 rounded-full"
                          style={{ backgroundColor: segment.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${segment.engagement}%` }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
