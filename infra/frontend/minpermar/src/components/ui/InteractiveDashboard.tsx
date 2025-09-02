import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Users, Fish, Globe, Zap, RefreshCw } from 'lucide-react'
import { MetricCard } from './MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { Badge } from './Badge'

interface DashboardData {
  realTimeMetrics: {
    activeUsers: number
    onlineServices: number
    processingRequests: number
    systemHealth: number
  }
  trends: {
    dailyGrowth: number
    weeklyGrowth: number
    monthlyGrowth: number
  }
  activities: Array<{
    id: string
    type: 'license' | 'certification' | 'report' | 'consultation'
    description: string
    timestamp: Date
    status: 'completed' | 'processing' | 'pending'
  }>
}

interface InteractiveDashboardProps {
  data?: DashboardData
  refreshInterval?: number
}

const defaultData: DashboardData = {
  realTimeMetrics: {
    activeUsers: 1247,
    onlineServices: 12,
    processingRequests: 34,
    systemHealth: 99.2
  },
  trends: {
    dailyGrowth: 12.5,
    weeklyGrowth: 8.3,
    monthlyGrowth: 15.7
  },
  activities: [
    {
      id: '1',
      type: 'license',
      description: 'Nova licença de pesca aprovada para Luanda',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'completed'
    },
    {
      id: '2',
      type: 'certification',
      description: 'Certificação de produto aquícola em análise',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      status: 'processing'
    },
    {
      id: '3',
      type: 'report',
      description: 'Relatório de sustentabilidade submetido',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      status: 'completed'
    }
  ]
}

export const InteractiveDashboard: React.FC<InteractiveDashboardProps> = ({
  data = defaultData,
  refreshInterval = 30000
}) => {
  const [currentData, setCurrentData] = useState(data)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  const refreshData = async () => {
    setIsRefreshing(true)
    
    // Simular atualização de dados em tempo real
    setTimeout(() => {
      setCurrentData(prev => ({
        ...prev,
        realTimeMetrics: {
          ...prev.realTimeMetrics,
          activeUsers: prev.realTimeMetrics.activeUsers + Math.floor(Math.random() * 20) - 10,
          processingRequests: prev.realTimeMetrics.processingRequests + Math.floor(Math.random() * 10) - 5,
          systemHealth: Math.max(95, Math.min(100, prev.realTimeMetrics.systemHealth + (Math.random() - 0.5) * 2))
        }
      }))
      setLastUpdate(new Date())
      setIsRefreshing(false)
    }, 1000)
  }

  const getActivityIcon = (type: string) => {
    const icons = {
      license: <Fish className="h-4 w-4" />,
      certification: <BarChart3 className="h-4 w-4" />,
      report: <Globe className="h-4 w-4" />,
      consultation: <Users className="h-4 w-4" />
    }
    return icons[type as keyof typeof icons] || <Zap className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'success',
      processing: 'default',
      pending: 'secondary'
    }
    return colors[status as keyof typeof colors] || 'default'
  }

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((new Date().getTime() - date.getTime()) / 60000)
    if (minutes < 1) return 'agora mesmo'
    if (minutes < 60) return `${minutes}m atrás`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h atrás`
    const days = Math.floor(hours / 24)
    return `${days}d atrás`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-900">
            Dashboard em Tempo Real
          </h2>
          <p className="text-gray-600 mt-1">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-AO')}
          </p>
        </div>
        <Button
          onClick={refreshData}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Utilizadores Ativos"
          value={currentData.realTimeMetrics.activeUsers}
          change={currentData.trends.dailyGrowth}
          changeLabel="hoje"
          icon={<Users className="h-6 w-6" />}
          trend="up"
          color="blue"
          description="Online agora"
        />
        <MetricCard
          title="Serviços Online"
          value={`${currentData.realTimeMetrics.onlineServices}/12`}
          change={0}
          changeLabel="todos operacionais"
          icon={<Globe className="h-6 w-6" />}
          trend="neutral"
          color="green"
          description="Status do sistema"
        />
        <MetricCard
          title="Pedidos em Processamento"
          value={currentData.realTimeMetrics.processingRequests}
          change={-5.2}
          changeLabel="vs. ontem"
          icon={<Zap className="h-6 w-6" />}
          trend="down"
          color="yellow"
          description="Fila de processamento"
        />
        <MetricCard
          title="Saúde do Sistema"
          value={`${currentData.realTimeMetrics.systemHealth.toFixed(1)}%`}
          change={0.3}
          changeLabel="uptime"
          icon={<BarChart3 className="h-6 w-6" />}
          trend="up"
          color="green"
          description="Performance geral"
        />
      </div>

      {/* Growth Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-ocean-blue-600" />
              Tendências de Crescimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Crescimento Diário</span>
                <Badge variant="success">+{currentData.trends.dailyGrowth}%</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Crescimento Semanal</span>
                <Badge variant="default">+{currentData.trends.weeklyGrowth}%</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Crescimento Mensal</span>
                <Badge variant="outline">+{currentData.trends.monthlyGrowth}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-ocean-green-600" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentData.activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 p-2 bg-ocean-blue-100 rounded-lg text-ocean-blue-600">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={getStatusColor(activity.status) as any}
                        size="sm"
                      >
                        {activity.status === 'completed' ? 'Concluído' : 
                         activity.status === 'processing' ? 'Processando' : 'Pendente'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Indicator */}
      <motion.div
        className="fixed bottom-4 right-4 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="bg-white rounded-full shadow-lg border border-gray-200 p-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700">Sistema Online</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
