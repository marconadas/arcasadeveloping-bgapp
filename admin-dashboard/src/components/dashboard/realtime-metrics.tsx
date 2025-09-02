'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import {
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Bell,
  BellRing,
  Cpu,
  Database,
  Server,
  Globe,
  Users,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface RealtimeMetric {
  id: string
  name: string
  value: number
  unit: string
  change: number
  trend: 'up' | 'down' | 'stable'
  status: 'healthy' | 'warning' | 'critical'
  timestamp: Date
}

interface WebSocketStatus {
  connected: boolean
  lastMessage: Date | null
  reconnectAttempts: number
}

interface ChartDataPoint {
  timestamp: Date
  value: number
}

export function RealtimeMetrics() {
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>({
    connected: false,
    lastMessage: null,
    reconnectAttempts: 0
  })
  
  const [metrics, setMetrics] = useState<RealtimeMetric[]>([
    {
      id: 'cpu',
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      change: -2.5,
      trend: 'down',
      status: 'healthy',
      timestamp: new Date()
    },
    {
      id: 'memory',
      name: 'Memory',
      value: 67,
      unit: '%',
      change: 1.2,
      trend: 'up',
      status: 'healthy',
      timestamp: new Date()
    },
    {
      id: 'network',
      name: 'Network I/O',
      value: 234,
      unit: 'MB/s',
      change: 15.3,
      trend: 'up',
      status: 'healthy',
      timestamp: new Date()
    },
    {
      id: 'requests',
      name: 'Requests/sec',
      value: 1247,
      unit: 'req/s',
      change: 8.7,
      trend: 'up',
      status: 'healthy',
      timestamp: new Date()
    },
    {
      id: 'database',
      name: 'DB Connections',
      value: 24,
      unit: 'conn',
      change: 0,
      trend: 'stable',
      status: 'healthy',
      timestamp: new Date()
    },
    {
      id: 'errors',
      name: 'Error Rate',
      value: 0.02,
      unit: '%',
      change: -0.01,
      trend: 'down',
      status: 'healthy',
      timestamp: new Date()
    }
  ])

  const [chartData, setChartData] = useState<Record<string, ChartDataPoint[]>>({
    cpu: [],
    memory: [],
    network: [],
    requests: []
  })

  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    timestamp: Date
  }>>([])

  const wsRef = useRef<WebSocket | null>(null)
  const chartRefs = useRef<Record<string, any>>({})

  // Simulate WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // In a real app, this would be your WebSocket endpoint
        // wsRef.current = new WebSocket('ws://localhost:8000/ws/metrics')
        
        // Simulate connection
        setWsStatus(prev => ({ ...prev, connected: true, reconnectAttempts: 0 }))
        
        // Simulate real-time data updates
        const interval = setInterval(() => {
          setMetrics(prevMetrics => 
            prevMetrics.map(metric => {
              const variation = (Math.random() - 0.5) * 10
              const newValue = Math.max(0, metric.value + variation)
              const change = newValue - metric.value
              
              return {
                ...metric,
                value: parseFloat(newValue.toFixed(2)),
                change: parseFloat(change.toFixed(2)),
                trend: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable',
                status: newValue > 80 ? 'warning' : newValue > 95 ? 'critical' : 'healthy',
                timestamp: new Date()
              }
            })
          )

          setWsStatus(prev => ({ ...prev, lastMessage: new Date() }))
        }, 2000)

        // Update chart data
        const chartInterval = setInterval(() => {
          const now = new Date()
          setChartData(prev => {
            const updated = { ...prev }
            metrics.forEach(metric => {
              if (updated[metric.id]) {
                updated[metric.id] = [
                  ...updated[metric.id].slice(-19), // Keep last 20 points
                  { timestamp: now, value: metric.value }
                ]
              } else {
                updated[metric.id] = [{ timestamp: now, value: metric.value }]
              }
            })
            return updated
          })
        }, 3000)

        return () => {
          clearInterval(interval)
          clearInterval(chartInterval)
        }
      } catch (error) {
        setWsStatus(prev => ({ 
          ...prev, 
          connected: false, 
          reconnectAttempts: prev.reconnectAttempts + 1 
        }))
      }
    }

    const cleanup = connectWebSocket()
    return cleanup
  }, [metrics])

  // Generate random notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const types = ['info', 'success', 'warning', 'error'] as const
        const type = types[Math.floor(Math.random() * types.length)]
        
        const messages = {
          info: { title: 'Sistema Atualizado', message: 'Nova versão do serviço ML implementada' },
          success: { title: 'Backup Concluído', message: 'Backup automático realizado com sucesso' },
          warning: { title: 'Alto Uso de CPU', message: 'CPU acima de 80% nos últimos 5 minutos' },
          error: { title: 'Serviço Indisponível', message: 'Falha na conexão com serviço externo' }
        }

        const newNotification = {
          id: Date.now().toString(),
          type,
          ...messages[type],
          timestamp: new Date()
        }

        setNotifications(prev => [newNotification, ...prev.slice(0, 4)])
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'cpu': return Cpu
      case 'memory': return Server
      case 'network': return Globe
      case 'requests': return Activity
      case 'database': return Database
      case 'errors': return AlertTriangle
      default: return BarChart3
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-500'
      case 'warning': return 'text-amber-500'
      case 'critical': return 'text-red-500'
      default: return 'text-slate-500'
    }
  }

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />
    return <div className="h-4 w-4 rounded-full bg-slate-400" />
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 4,
      },
      line: {
        borderWidth: 2,
        tension: 0.4,
      },
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <motion.div
        className={`flex items-center justify-between p-4 rounded-xl border ${
          wsStatus.connected 
            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
            : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: wsStatus.connected ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {wsStatus.connected ? (
              <Wifi className="h-5 w-5 text-emerald-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
          </motion.div>
          <div>
            <h3 className={`font-semibold ${
              wsStatus.connected ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {wsStatus.connected ? 'Conectado em Tempo Real' : 'Desconectado'}
            </h3>
            <p className={`text-sm ${
              wsStatus.connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {wsStatus.connected 
                ? `Última atualização: ${wsStatus.lastMessage?.toLocaleTimeString() || 'Nunca'}`
                : `Tentativas de reconexão: ${wsStatus.reconnectAttempts}`
              }
            </p>
          </div>
        </div>
        
        <motion.div
          className={`w-3 h-3 rounded-full ${
            wsStatus.connected ? 'bg-emerald-500' : 'bg-red-500'
          }`}
          animate={{ 
            scale: wsStatus.connected ? [1, 1.2, 1] : 1,
            opacity: wsStatus.connected ? [1, 0.7, 1] : 0.5
          }}
          transition={{ 
            duration: 2, 
            repeat: wsStatus.connected ? Infinity : 0 
          }}
        />
      </motion.div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => {
          const Icon = getMetricIcon(metric.id)
          const chartDataForMetric = chartData[metric.id] || []
          
          const lineChartData = {
            labels: chartDataForMetric.map(point => point.timestamp.toLocaleTimeString()),
            datasets: [
              {
                data: chartDataForMetric.map(point => point.value),
                borderColor: metric.status === 'healthy' ? '#10b981' : 
                           metric.status === 'warning' ? '#f59e0b' : '#ef4444',
                backgroundColor: metric.status === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 
                               metric.status === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                fill: true,
              },
            ],
          }

          return (
            <motion.div
              key={metric.id}
              className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-50" />
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`p-2 rounded-lg ${getStatusColor(metric.status)} bg-current/10`}
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Icon className={`h-5 w-5 ${getStatusColor(metric.status)}`} />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {metric.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Atualizado há {Math.floor((Date.now() - metric.timestamp.getTime()) / 1000)}s
                      </p>
                    </div>
                  </div>
                  
                  <motion.div
                    className="flex items-center gap-1"
                    animate={{ x: [0, 2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    {getTrendIcon(metric.trend, metric.change)}
                  </motion.div>
                </div>

                {/* Value */}
                <div className="mb-4">
                  <motion.div
                    className="text-3xl font-bold text-slate-900 dark:text-white"
                    key={metric.value}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {metric.value.toLocaleString()}
                    <span className="text-lg text-slate-500 ml-1">{metric.unit}</span>
                  </motion.div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <motion.span
                      className={`text-sm font-medium ${
                        metric.change > 0 ? 'text-emerald-600' : 
                        metric.change < 0 ? 'text-red-600' : 'text-slate-600'
                      }`}
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                    >
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </motion.span>
                    <span className="text-xs text-slate-500">vs última hora</span>
                  </div>
                </div>

                {/* Mini Chart */}
                {chartDataForMetric.length > 0 && (
                  <div className="h-20 mb-2">
                    <Line
                      ref={el => chartRefs.current[metric.id] = el}
                      data={lineChartData}
                      options={chartOptions}
                    />
                  </div>
                )}

                {/* Status indicator */}
                <div className="flex items-center justify-between">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    metric.status === 'healthy' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                    metric.status === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {metric.status === 'healthy' ? 'Saudável' :
                     metric.status === 'warning' ? 'Atenção' : 'Crítico'}
                  </div>
                  
                  <motion.div
                    className={`w-2 h-2 rounded-full ${
                      metric.status === 'healthy' ? 'bg-emerald-500' :
                      metric.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.6, 1]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity 
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Real-time Notifications */}
      <motion.div
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
          >
            <BellRing className="h-5 w-5" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Notificações em Tempo Real
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Alertas e atualizações do sistema
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div
                className="text-center py-8 text-slate-500 dark:text-slate-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma notificação recente</p>
              </motion.div>
            ) : (
              notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border ${
                    notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800' :
                    notification.type === 'warning' ? 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800' :
                    notification.type === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' :
                    'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                  }`}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  layout
                >
                  <motion.div
                    className={`p-1.5 rounded-lg ${
                      notification.type === 'success' ? 'bg-emerald-500 text-white' :
                      notification.type === 'warning' ? 'bg-amber-500 text-white' :
                      notification.type === 'error' ? 'bg-red-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {notification.type === 'success' && <CheckCircle className="h-4 w-4" />}
                    {notification.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                    {notification.type === 'error' && <AlertTriangle className="h-4 w-4" />}
                    {notification.type === 'info' && <Bell className="h-4 w-4" />}
                  </motion.div>
                  
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      notification.type === 'success' ? 'text-emerald-800 dark:text-emerald-200' :
                      notification.type === 'warning' ? 'text-amber-800 dark:text-amber-200' :
                      notification.type === 'error' ? 'text-red-800 dark:text-red-200' :
                      'text-blue-800 dark:text-blue-200'
                    }`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm ${
                      notification.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' :
                      notification.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                      notification.type === 'error' ? 'text-red-600 dark:text-red-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      {notification.message}
                    </p>
                  </div>
                  
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
