'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getServiceUrl, getEnvironmentInfo } from '@/lib/environment-urls'
import { ExternalLink, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface ServiceStatus {
  name: string
  url: string
  status: 'operational' | 'degraded' | 'down'
  responseTime?: number
  lastChecked: string
}

interface WorkflowStatus {
  success: boolean
  message: string
  environment: string
  services: Array<{
    name: string
    url: string
    status: string
    clientAccess: boolean
  }>
}

export function ServicesStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [workflowInfo, setWorkflowInfo] = useState<WorkflowStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const environmentInfo = getEnvironmentInfo()

  const checkServiceStatus = async (name: string, url: string): Promise<ServiceStatus> => {
    const startTime = Date.now()
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      })
      const responseTime = Date.now() - startTime
      
      return {
        name,
        url,
        status: 'operational',
        responseTime,
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      return {
        name,
        url,
        status: 'down',
        lastChecked: new Date().toISOString()
      }
    }
  }

  const fetchWorkflowInfo = async () => {
    try {
      const response = await fetch(`${getServiceUrl('workflow')}/client-info`)
      const data = await response.json()
      setWorkflowInfo(data)
    } catch (error) {
      console.error('Failed to fetch workflow info:', error)
    }
  }

  const refreshStatus = async () => {
    setLoading(true)
    
    // Check workflow info
    await fetchWorkflowInfo()
    
    // Check individual services
    const serviceChecks = [
      { name: 'Frontend', url: getServiceUrl('frontend') },
      { name: 'Admin API', url: getServiceUrl('adminApi') },
      { name: 'STAC API', url: getServiceUrl('stacApi') },
      { name: 'PyGeoAPI', url: getServiceUrl('pygeoapi') },
      { name: 'STAC Browser', url: getServiceUrl('stacBrowser') },
      { name: 'Authentication', url: getServiceUrl('keycloak') },
      { name: 'Monitoring', url: getServiceUrl('flower') },
      { name: 'Workflow', url: getServiceUrl('workflow') }
    ]

    const statusPromises = serviceChecks.map(service => 
      checkServiceStatus(service.name, service.url)
    )

    const results = await Promise.all(statusPromises)
    setServices(results)
    setLastRefresh(new Date())
    setLoading(false)
  }

  useEffect(() => {
    refreshStatus()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge variant="default" className="bg-green-500">Operacional</Badge>
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-500">Degradado</Badge>
      case 'down':
        return <Badge variant="destructive">Indisponível</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const operationalServices = services.filter(s => s.status === 'operational').length
  const totalServices = services.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Status dos Serviços BGAPP
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Monitoramento em tempo real da infraestrutura
          </p>
        </div>
        <Button 
          onClick={refreshStatus} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌍 Ambiente Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Ambiente</p>
              <Badge variant={environmentInfo.isLocal ? "secondary" : "default"}>
                {environmentInfo.environment === 'development' ? 'Desenvolvimento' : 'Produção'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Serviços Operacionais</p>
              <p className="text-2xl font-bold text-green-600">{operationalServices}/{totalServices}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Última Atualização</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      {workflowInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Informações para Clientes
            </CardTitle>
            <CardDescription>
              {workflowInfo.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Empresa
                </p>
                <p className="text-sm">{workflowInfo.company || 'MareDatum Consultoria e Gestão de Projectos Unipessoal LDA'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Status do Sistema
                </p>
                <Badge variant="default" className="bg-green-500">
                  {workflowInfo.status || 'Online'}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                URLs de Acesso para Clientes
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`${getServiceUrl('workflow')}/client-info`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Informações Completas
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`${getServiceUrl('workflow')}/services`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Status dos Serviços
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.name} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                {getStatusIcon(service.status)}
              </div>
              <CardDescription className="text-xs">
                {service.url}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                  {getStatusBadge(service.status)}
                </div>
                
                {service.responseTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Tempo de Resposta</span>
                    <span className="text-sm font-medium">{service.responseTime}ms</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Última Verificação</span>
                  <span className="text-xs text-slate-500">
                    {new Date(service.lastChecked).toLocaleTimeString()}
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => window.open(service.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Acessar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso direto aos serviços principais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(getServiceUrl('frontend'), '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Frontend
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(getServiceUrl('adminApi'), '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              API Admin
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(getServiceUrl('stacApi'), '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              STAC API
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(getServiceUrl('workflow'), '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Workflow
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
