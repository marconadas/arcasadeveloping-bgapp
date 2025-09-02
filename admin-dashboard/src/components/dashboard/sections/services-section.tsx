'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatRelativeTime, getStatusColor, getServiceIcon } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Server,
  Play,
  Square,
  RotateCcw,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

export function ServicesSection() {
  const queryClient = useQueryClient()
  const [selectedService, setSelectedService] = useState<string | null>(null)

  // Fetch services status
  const { data: services, isLoading, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: api.getServices,
    refetchInterval: 30000, // 30 seconds
  })

  // Service control mutations
  const startServiceMutation = useMutation({
    mutationFn: api.startService,
    onSuccess: (_, serviceName) => {
      toast.success(`Serviço ${serviceName} iniciado com sucesso`)
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
    onError: (error: any, serviceName) => {
      toast.error(`Erro ao iniciar ${serviceName}: ${error.message}`)
    },
  })

  const stopServiceMutation = useMutation({
    mutationFn: api.stopService,
    onSuccess: (_, serviceName) => {
      toast.success(`Serviço ${serviceName} parado com sucesso`)
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
    onError: (error: any, serviceName) => {
      toast.error(`Erro ao parar ${serviceName}: ${error.message}`)
    },
  })

  const restartServiceMutation = useMutation({
    mutationFn: api.restartService,
    onSuccess: (_, serviceName) => {
      toast.success(`Serviço ${serviceName} reiniciado com sucesso`)
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
    onError: (error: any, serviceName) => {
      toast.error(`Erro ao reiniciar ${serviceName}: ${error.message}`)
    },
  })

  const handleStartService = (serviceName: string) => {
    setSelectedService(serviceName)
    startServiceMutation.mutate(serviceName)
  }

  const handleStopService = (serviceName: string) => {
    setSelectedService(serviceName)
    stopServiceMutation.mutate(serviceName)
  }

  const handleRestartService = (serviceName: string) => {
    setSelectedService(serviceName)
    restartServiceMutation.mutate(serviceName)
  }

  const handleStartAll = () => {
    if (!services) return
    
    const offlineServices = services.filter(s => s.status === 'offline')
    offlineServices.forEach(service => {
      startServiceMutation.mutate(service.name)
    })
    
    toast.success(`Iniciando ${offlineServices.length} serviços...`)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'offline':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <Server className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online':
        return 'success'
      case 'offline':
        return 'destructive'
      case 'warning':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Estado dos Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const onlineServices = services?.filter(s => s.status === 'online').length || 0
  const totalServices = services?.length || 0

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Estado dos Serviços
              </CardTitle>
              <CardDescription>
                {onlineServices}/{totalServices} serviços online
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleStartAll}
                disabled={onlineServices === totalServices}
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Todos
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services?.map((service) => (
          <Card key={service.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {getServiceIcon(service.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {service.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Porta {service.port}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <Badge variant={getStatusBadgeVariant(service.status) as any}>
                    {service.status}
                  </Badge>
                </div>
              </div>

              {/* Service metrics */}
              <div className="space-y-2 mb-4">
                {service.responseTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Latência:</span>
                    <span>{service.responseTime}ms</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Última verificação:</span>
                  <span>{formatRelativeTime(service.lastCheck)}</span>
                </div>

                {service.version && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Versão:</span>
                    <span>{service.version}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {service.status === 'offline' ? (
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => handleStartService(service.name)}
                    disabled={selectedService === service.name && startServiceMutation.isPending}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Iniciar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleStopService(service.name)}
                    disabled={selectedService === service.name && stopServiceMutation.isPending}
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Parar
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRestartService(service.name)}
                  disabled={selectedService === service.name && restartServiceMutation.isPending}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                
                {service.url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(service.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas dos Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {onlineServices}
              </div>
              <div className="text-sm text-green-700 dark:text-green-400">
                Serviços Online
              </div>
            </div>
            
            <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {services?.filter(s => s.status === 'offline').length || 0}
              </div>
              <div className="text-sm text-red-700 dark:text-red-400">
                Serviços Offline
              </div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {services?.filter(s => s.status === 'warning').length || 0}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-400">
                Com Avisos
              </div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(((onlineServices / totalServices) || 0) * 100)}%
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-400">
                Disponibilidade
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
