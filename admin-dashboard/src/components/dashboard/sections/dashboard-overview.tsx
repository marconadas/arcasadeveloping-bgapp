'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChartBarIcon,
  ServerIcon,
  ClockIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
  CloudIcon,
  UserGroupIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  BoltIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  Shield, 
  Cpu, 
  Database, 
  Globe, 
  Brain,
  Rocket,
  Target,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<any>
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  status?: 'success' | 'warning' | 'error' | 'info'
  loading?: boolean
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue, 
  status = 'info',
  loading = false 
}: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const getStatusConfig = () => {
    switch (status) {
      case 'success': 
        return {
          gradient: 'from-emerald-500/10 via-green-500/5 to-teal-500/10',
          border: 'border-emerald-200/50 dark:border-emerald-800/50',
          iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
          iconColor: 'text-white',
          glow: 'shadow-emerald-500/20',
          accent: 'text-emerald-600 dark:text-emerald-400'
        }
      case 'warning': 
        return {
          gradient: 'from-amber-500/10 via-yellow-500/5 to-orange-500/10',
          border: 'border-amber-200/50 dark:border-amber-800/50',
          iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
          iconColor: 'text-white',
          glow: 'shadow-amber-500/20',
          accent: 'text-amber-600 dark:text-amber-400'
        }
      case 'error': 
        return {
          gradient: 'from-red-500/10 via-rose-500/5 to-pink-500/10',
          border: 'border-red-200/50 dark:border-red-800/50',
          iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
          iconColor: 'text-white',
          glow: 'shadow-red-500/20',
          accent: 'text-red-600 dark:text-red-400'
        }
      default: 
        return {
          gradient: 'from-blue-500/10 via-indigo-500/5 to-purple-500/10',
          border: 'border-blue-200/50 dark:border-blue-800/50',
          iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
          iconColor: 'text-white',
          glow: 'shadow-blue-500/20',
          accent: 'text-blue-600 dark:text-blue-400'
        }
    }
  }

  const config = getStatusConfig()

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-emerald-500" />
      case 'down': return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  if (loading) {
    return (
      <motion.div 
        className="relative overflow-hidden rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 w-24 bg-slate-200/50 dark:bg-slate-700/50 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-slate-200/50 dark:bg-slate-700/50 rounded animate-pulse"></div>
            <div className="h-3 w-16 bg-slate-200/50 dark:bg-slate-700/50 rounded animate-pulse"></div>
          </div>
          <div className="h-12 w-12 bg-slate-200/50 dark:bg-slate-700/50 rounded-xl animate-pulse"></div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} backdrop-blur-sm border ${config.border} p-6 transition-all duration-300 hover:shadow-xl hover:${config.glow} hover:scale-[1.02] cursor-pointer group`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2 }}
    >
      {/* Background glow effect */}
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        initial={false}
        animate={{ opacity: isHovered ? 0.1 : 0 }}
      />
      
      {/* Floating particles effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-1 h-1 ${config.iconBg} rounded-full`}
                initial={{ 
                  x: Math.random() * 200, 
                  y: 200,
                  opacity: 0 
                }}
                animate={{ 
                  y: -20, 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <motion.p 
            className="text-sm font-medium text-slate-600 dark:text-slate-400"
            animate={{ opacity: isHovered ? 0.8 : 1 }}
          >
            {title}
          </motion.p>
          
          <div className="flex items-baseline gap-2">
            <motion.p 
              className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {value}
            </motion.p>
            
            {trendValue && (
              <motion.div 
                className="flex items-center gap-1"
                animate={{ x: isHovered ? 2 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {getTrendIcon()}
                <span className={`text-xs font-semibold ${
                  trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 
                  trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                  'text-slate-600 dark:text-slate-400'
                }`}>
                  {trendValue}
                </span>
              </motion.div>
            )}
          </div>
          
          {subtitle && (
            <motion.p 
              className="text-xs text-slate-500 dark:text-slate-400"
              animate={{ opacity: isHovered ? 0.7 : 1 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        
        <motion.div 
          className={`relative p-3 rounded-xl ${config.iconBg} ${config.iconColor} shadow-lg`}
          animate={{ 
            rotate: isHovered ? 360 : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ 
            rotate: { duration: 0.6, ease: "easeInOut" },
            scale: { duration: 0.2 }
          }}
        >
          <Icon className="h-6 w-6 relative z-10" />
          
          {/* Icon glow effect */}
          <motion.div
            className={`absolute inset-0 rounded-xl ${config.iconBg} blur-md opacity-0 group-hover:opacity-50`}
            animate={{ opacity: isHovered ? 0.5 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </div>
      
      {/* Bottom accent line */}
      <motion.div 
        className={`absolute bottom-0 left-0 h-1 ${config.iconBg} rounded-full`}
        initial={{ width: "0%" }}
        animate={{ width: isHovered ? "100%" : "30%" }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}

interface QuickAccessItemProps {
  title: string
  description: string
  icon: React.ComponentType<any>
  onClick: () => void
  badge?: string
  isNew?: boolean
}

function QuickAccessItem({ title, description, icon: Icon, onClick, badge, isNew }: QuickAccessItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.button
      onClick={onClick}
      className="relative overflow-hidden rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-4 text-left group transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300/50 dark:hover:border-blue-700/50"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background gradient on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        animate={{ opacity: isHovered ? 1 : 0 }}
      />
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
        animate={{ x: isHovered ? '100%' : '-100%' }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      />

      <div className="relative flex items-start gap-4 w-full">
        <motion.div 
          className="relative shrink-0 p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"
          animate={{ 
            rotate: isHovered ? [0, -10, 10, 0] : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ 
            rotate: { duration: 0.5 },
            scale: { duration: 0.2 }
          }}
        >
          <Icon className="h-5 w-5 relative z-10" />
          
          {/* Icon glow */}
          <motion.div
            className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 blur-md opacity-0 group-hover:opacity-50"
            animate={{ opacity: isHovered ? 0.5 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <motion.h4 
              className="font-semibold text-sm truncate text-slate-900 dark:text-white"
              animate={{ x: isHovered ? 2 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {title}
            </motion.h4>
            
            <AnimatePresence>
              {badge && (
                <motion.span 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {badge}
                </motion.span>
              )}
              
              {isNew && (
                <motion.span 
                  className="relative bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.span
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 opacity-75 blur-sm"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.75, 0.4, 0.75]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <span className="relative">NOVO</span>
                  <SparklesIcon className="inline h-3 w-3 ml-1" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          <motion.p 
            className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed"
            animate={{ opacity: isHovered ? 0.8 : 1 }}
          >
            {description}
          </motion.p>
        </div>
        
        {/* Arrow indicator */}
        <motion.div
          className="shrink-0 text-slate-400 dark:text-slate-500"
          animate={{ 
            x: isHovered ? 4 : 0,
            opacity: isHovered ? 1 : 0.5
          }}
          transition={{ duration: 0.2 }}
        >
          <ArrowTrendingUpIcon className="h-4 w-4 rotate-45" />
        </motion.div>
      </div>
      
      {/* Bottom progress bar */}
      <motion.div 
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
        initial={{ width: "0%" }}
        animate={{ width: isHovered ? "100%" : "0%" }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  )
}

export function DashboardOverview() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    servicesOnline: 24,
    apiLatency: '<1s',
    mlAccuracy: '95%+',
    uptime: '99.99%',
    activeAlerts: 0,
    asyncTasks: 12,
    connections: 24,
    requestsPerMin: 1247,
    memoryUsage: 67,
    diskUsage: 43
  })

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1500)
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        connections: 20 + Math.floor(Math.random() * 10),
        requestsPerMin: 1200 + Math.floor(Math.random() * 100),
        memoryUsage: 60 + Math.floor(Math.random() * 20),
        diskUsage: 40 + Math.floor(Math.random() * 10),
      }))
    }, 5000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  const quickAccessItems = [
    {
      title: 'Dashboard Científico',
      description: 'Análises avançadas de biodiversidade marinha com IA',
      icon: BarChart3,
      onClick: () => {},
      isNew: false,
    },
    {
      title: 'Tempo Real Angola',
      description: 'Monitorização oceanográfica em tempo real com WebSockets',
      icon: Activity,
      onClick: () => {},
      isNew: true,
    },
    {
      title: 'Mapa Interativo 3D',
      description: 'Visualização geoespacial avançada com WebGL',
      icon: Globe,
      onClick: () => {},
      isNew: true,
    },
    {
      title: 'AI Assistant',
      description: 'Assistente inteligente para análise de dados',
      icon: Brain,
      badge: 'GPT-4',
      onClick: () => {},
      isNew: true,
    },
    {
      title: 'Machine Learning',
      description: 'Modelos preditivos com 95%+ precisão',
      icon: Cpu,
      badge: '95%+',
      onClick: () => {},
      isNew: false,
    },
    {
      title: 'Analytics Avançado',
      description: 'Heatmaps, funnels e análise de cohort',
      icon: PieChart,
      onClick: () => {},
      isNew: true,
    },
    {
      title: 'Mobile PWA',
      description: 'App progressiva com funcionalidades offline',
      icon: DevicePhoneMobileIcon,
      onClick: () => {},
      isNew: false,
    },
    {
      title: 'Automação',
      description: 'Workflows visuais e triggers inteligentes',
      icon: Rocket,
      onClick: () => {},
      isNew: true,
    },
    {
      title: 'Saúde Sistema',
      description: 'Monitorização proativa com alertas automáticos',
      icon: Shield,
      onClick: () => {},
      isNew: false,
    },
  ]

  return (
    <motion.div 
      className="space-y-8 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/20 via-indigo-50/10 to-purple-50/20 dark:from-slate-900/20 dark:via-slate-800/10 dark:to-slate-900/20 pointer-events-none" />
      
      {/* Header with real-time status */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-8 shadow-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              className="p-3 rounded-xl bg-white/10 backdrop-blur-sm"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Rocket className="h-8 w-8" />
            </motion.div>
            
            <div>
              <motion.h1 
                className="text-3xl font-bold mb-2"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                BGAPP Enhanced Dashboard
              </motion.h1>
              <motion.p 
                className="text-blue-100 text-lg"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Plataforma de Biodiversidade Marinha de Angola
              </motion.p>
            </div>
          </div>
          
          <motion.div 
            className="text-right"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="text-sm text-blue-100 mb-1">Status do Sistema</div>
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-3 h-3 bg-green-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-lg font-semibold">Operacional</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main metrics with staggered animation */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {[
          { title: "Serviços Online", value: metrics.servicesOnline, icon: Shield, status: "success" as const },
          { title: "Latência API", value: metrics.apiLatency, subtitle: "83% ⬇️", icon: Zap, status: "success" as const, trend: "down" as const, trendValue: "83%" },
          { title: "Precisão ML", value: metrics.mlAccuracy, icon: Brain, status: "success" as const },
          { title: "Disponibilidade", value: metrics.uptime, icon: Shield, status: "success" as const },
          { title: "Alertas Ativos", value: metrics.activeAlerts, icon: ExclamationTriangleIcon, status: metrics.activeAlerts > 0 ? 'warning' as const : 'success' as const }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          >
            <MetricCard {...metric} loading={loading} />
          </motion.div>
        ))}
      </motion.div>

      {/* Performance metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {[
          { title: "Conexões BD", value: metrics.connections, icon: Database, status: "info" as const },
          { title: "Requests/min", value: metrics.requestsPerMin.toLocaleString(), icon: TrendingUp, status: "info" as const },
          { title: "Uso Memória", value: `${metrics.memoryUsage}%`, icon: Cpu, status: metrics.memoryUsage > 80 ? 'warning' as const : 'success' as const },
          { title: "Uso Disco", value: `${metrics.diskUsage}%`, icon: Database, status: metrics.diskUsage > 80 ? 'warning' as const : 'success' as const }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
          >
            <MetricCard {...metric} loading={loading} />
          </motion.div>
        ))}
      </motion.div>

      {/* Quick access with enhanced styling */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5" />
        
        <div className="relative p-8">
          <motion.div 
            className="flex items-center gap-3 mb-8"
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Interfaces BGAPP Avançadas
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Acesso rápido às funcionalidades de última geração
              </p>
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickAccessItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              >
                <QuickAccessItem
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                  onClick={item.onClick}
                  badge={item.badge}
                  isNew={item.isNew}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Enhanced system status */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-800/50 p-8"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="absolute inset-0 bg-dot-pattern opacity-20" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              className="relative p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(16, 185, 129, 0.3)",
                  "0 0 30px rgba(16, 185, 129, 0.5)",
                  "0 0 20px rgba(16, 185, 129, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Shield className="h-6 w-6" />
              <motion.div
                className="absolute inset-0 rounded-xl bg-emerald-400 opacity-20 blur-md"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            
            <div>
              <motion.h3 
                className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-1"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                Sistema Totalmente Operacional
              </motion.h3>
              <motion.p 
                className="text-emerald-600 dark:text-emerald-400"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                Todos os 24 serviços funcionando com performance otimizada
              </motion.p>
            </div>
          </div>
          
          <motion.div 
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 bg-white rounded-full"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              Verificado há {Math.floor(Math.random() * 60)} segundos
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}