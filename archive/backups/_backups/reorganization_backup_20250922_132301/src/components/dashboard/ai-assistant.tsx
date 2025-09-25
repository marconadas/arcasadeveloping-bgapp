'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Zap,
  BarChart3,
  Database,
  TrendingUp,
  Users,
  Globe,
  Settings,
  HelpCircle,
  Lightbulb,
  Target,
  Search,
  Download,
  Share,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  MessageSquare,
  Bot,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  data?: any
  isTyping?: boolean
}

interface QuickAction {
  id: string
  label: string
  icon: any
  prompt: string
  category: string
}

interface InsightCard {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  type: 'performance' | 'users' | 'revenue' | 'system'
  action?: string
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Olá! Sou o assistente de IA da BGAPP. Posso ajudá-lo a analisar dados, gerar relatórios e otimizar a performance do sistema. Como posso ajudá-lo hoje?',
      timestamp: new Date(),
      suggestions: [
        'Mostrar resumo de performance',
        'Analisar tendências de usuários',
        'Gerar relatório de biodiversidade',
        'Verificar alertas do sistema'
      ]
    }
  ])
  
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickActions: QuickAction[] = [
    {
      id: 'performance',
      label: 'Análise de Performance',
      icon: BarChart3,
      prompt: 'Analyze system performance metrics and provide recommendations',
      category: 'System'
    },
    {
      id: 'users',
      label: 'Comportamento de Usuários',
      icon: Users,
      prompt: 'Show user behavior patterns and engagement metrics',
      category: 'Analytics'
    },
    {
      id: 'biodiversity',
      label: 'Relatório Biodiversidade',
      icon: Globe,
      prompt: 'Generate biodiversity analysis report for Angola marine data',
      category: 'Science'
    },
    {
      id: 'alerts',
      label: 'Verificar Alertas',
      icon: AlertCircle,
      prompt: 'Check current system alerts and provide resolution steps',
      category: 'System'
    },
    {
      id: 'trends',
      label: 'Tendências de Dados',
      icon: TrendingUp,
      prompt: 'Analyze data trends and predict future patterns',
      category: 'Analytics'
    },
    {
      id: 'optimization',
      label: 'Otimizações',
      icon: Zap,
      prompt: 'Suggest system optimizations based on current metrics',
      category: 'System'
    }
  ]

  const insights: InsightCard[] = [
    {
      id: '1',
      title: 'Alto Uso de CPU Detectado',
      description: 'CPU acima de 80% nas últimas 2 horas. Recomendo verificar processos em background.',
      impact: 'high',
      type: 'performance',
      action: 'Ver detalhes'
    },
    {
      id: '2',
      title: 'Crescimento de Usuários',
      description: 'Aumento de 23% em novos registos esta semana. Considere escalar infraestrutura.',
      impact: 'medium',
      type: 'users',
      action: 'Analisar'
    },
    {
      id: '3',
      title: 'Cache Hit Rate Baixo',
      description: 'Taxa de cache em 65%. Otimizar estratégia de cache pode melhorar performance.',
      impact: 'medium',
      type: 'system',
      action: 'Otimizar'
    }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = getAIResponse(message)
      setIsTyping(false)
      
      responses.forEach((response, index) => {
        setTimeout(() => {
          setMessages(prev => [...prev, response])
        }, index * 1000)
      })
    }, 1500)
  }

  const getAIResponse = (prompt: string): Message[] => {
    const lowerPrompt = prompt.toLowerCase()
    
    if (lowerPrompt.includes('performance') || lowerPrompt.includes('sistema')) {
      return [{
        id: Date.now().toString() + '_ai',
        type: 'assistant',
        content: 'Analisei a performance do sistema. Aqui está um resumo:\n\n• **CPU**: 67% (normal)\n• **Memória**: 45% (ótimo)\n• **Latência API**: <1s (excelente)\n• **Uptime**: 99.97%\n\n**Recomendações:**\n1. Otimizar queries de base de dados mais lentas\n2. Implementar cache para endpoints frequentes\n3. Monitorizar picos de tráfego às 14h',
        timestamp: new Date(),
        suggestions: ['Ver métricas detalhadas', 'Configurar alertas', 'Exportar relatório'],
        data: {
          cpu: 67,
          memory: 45,
          latency: 0.8,
          uptime: 99.97
        }
      }]
    }
    
    if (lowerPrompt.includes('usuário') || lowerPrompt.includes('user')) {
      return [{
        id: Date.now().toString() + '_ai',
        type: 'assistant',
        content: 'Análise de comportamento de usuários:\n\n**Métricas Chave:**\n• **Usuários Ativos**: 1,247 (+12.5%)\n• **Sessão Média**: 12m 34s\n• **Taxa de Retenção**: 78.9%\n• **Páginas por Sessão**: 4.2\n\n**Insights:**\n• Maior atividade entre 14h-16h\n• Cientistas têm maior engajamento (85%)\n• Mobile representa 40% do tráfego\n\n**Recomendações:**\n1. Otimizar experiência mobile\n2. Criar conteúdo para horário de pico\n3. Implementar notificações push',
        timestamp: new Date(),
        suggestions: ['Ver segmentação', 'Análise de cohort', 'Funil de conversão']
      }]
    }
    
    if (lowerPrompt.includes('biodiversidade') || lowerPrompt.includes('marine') || lowerPrompt.includes('angola')) {
      return [{
        id: Date.now().toString() + '_ai',
        type: 'assistant',
        content: '🐟 **Relatório de Biodiversidade Marinha - Angola**\n\n**Dados Coletados:**\n• **Espécies Registadas**: 1,247 (+8.3% este mês)\n• **Observações**: 15,432\n• **Área Coberta**: 518,000 km² (ZEE Angola)\n• **Precisão ML**: 95.7%\n\n**Descobertas Recentes:**\n• 3 novas espécies identificadas\n• Migração de tubarões-martelo mapeada\n• Zonas de alta biodiversidade atualizadas\n\n**Alertas:**\n• Declínio de 12% em corais na região Norte\n• Aumento de poluição plástica detectado\n\nPosso gerar um relatório detalhado?',
        timestamp: new Date(),
        suggestions: ['Gerar relatório PDF', 'Ver mapas de distribuição', 'Analisar tendências', 'Configurar alertas']
      }]
    }

    if (lowerPrompt.includes('alert') || lowerPrompt.includes('problema') || lowerPrompt.includes('erro')) {
      return [{
        id: Date.now().toString() + '_ai',
        type: 'assistant',
        content: '🚨 **Status de Alertas do Sistema**\n\n**Alertas Ativos**: 2\n\n**1. Alto Uso de CPU** (Atenção)\n• Serviço: ML Processing\n• Valor: 84%\n• Duração: 1h 23m\n• **Ação**: Reiniciar worker ML\n\n**2. Latência Elevada** (Baixo)\n• Endpoint: /api/species\n• Latência: 2.3s\n• **Ação**: Otimizar query\n\n**Histórico**: 12 alertas resolvidos hoje\n**Uptime**: 99.97% (excelente)\n\nDevo executar as correções automáticas?',
        timestamp: new Date(),
        suggestions: ['Executar correções', 'Ver histórico completo', 'Configurar novos alertas', 'Dashboard de monitorização']
      }]
    }

    // Default response
    return [{
      id: Date.now().toString() + '_ai',
      type: 'assistant',
      content: 'Entendo que precisa de ajuda. Posso ajudar com:\n\n• **Análise de dados** e métricas\n• **Relatórios** automáticos\n• **Monitorização** do sistema\n• **Otimizações** de performance\n• **Insights** de biodiversidade marinha\n\nEscolha uma das sugestões abaixo ou faça uma pergunta específica.',
      timestamp: new Date(),
      suggestions: ['Mostrar dashboard', 'Analisar performance', 'Gerar relatório', 'Verificar alertas']
    }]
  }

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.prompt)
  }

  const handleSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  const toggleVoiceInput = () => {
    setIsListening(!isListening)
    // Implement voice recognition here
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-200'
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-900 dark:text-slate-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg"
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(139, 92, 246, 0.3)",
                "0 0 30px rgba(139, 92, 246, 0.5)",
                "0 0 20px rgba(139, 92, 246, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Brain className="h-8 w-8" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              AI Assistant
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Assistente inteligente para análise e insights
            </p>
          </div>
        </div>

        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </motion.button>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Ações Rápidas
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950 transition-all duration-200"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <action.icon className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-white text-center">
                {action.label}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {action.category}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <motion.div
          className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col ${
            isExpanded ? 'lg:col-span-3' : 'lg:col-span-2'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="relative">
                <motion.div
                  className="w-3 h-3 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-20" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">
                  BGAPP AI Assistant
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Online • Powered by GPT-4
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                onClick={toggleVoiceInput}
                className={`p-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </motion.button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {message.type === 'assistant' && (
                    <motion.div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Bot className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                  
                  <div className={`max-w-xs lg:max-w-md ${message.type === 'user' ? 'order-first' : ''}`}>
                    <motion.div
                      className={`rounded-2xl p-4 ${
                        message.type === 'user'
                          ? 'bg-purple-600 text-white ml-auto'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      
                      {message.suggestions && (
                        <div className="mt-3 space-y-2">
                          {message.suggestions.map((suggestion, index) => (
                            <motion.button
                              key={index}
                              onClick={() => handleSuggestion(suggestion)}
                              className="block w-full text-left px-3 py-2 text-xs bg-white dark:bg-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ x: 4 }}
                            >
                              {suggestion}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                    
                    <div className={`text-xs text-slate-500 dark:text-slate-400 mt-1 ${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div
                className="flex gap-3 justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-4">
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                placeholder="Faça uma pergunta ou peça uma análise..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <motion.button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isTyping}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* AI Insights */}
        {!isExpanded && (
          <motion.div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Insights de IA
              </h3>
            </div>

            <div className="space-y-4">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {insight.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                      {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Médio' : 'Baixo'}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    {insight.description}
                  </p>
                  
                  {insight.action && (
                    <motion.button
                      className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                      whileHover={{ x: 2 }}
                    >
                      {insight.action} →
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
