"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink, Mail, Slack } from 'lucide-react'

interface GFWDataset {
  name: string
  description: string
  justification: string
  status: 'approved' | 'pending' | 'denied' | 'unknown'
  current_access: string
  priority: 'high' | 'medium' | 'low'
}

interface PermissionsStatus {
  request_submitted: boolean
  submission_date: string | null
  last_updated: string
  datasets: Record<string, {
    status: string
    approved_at?: string
    access_level?: string
    last_updated: string
  }>
  overall_status: 'no_access' | 'partial_access' | 'full_access'
  live_test_results?: Record<string, {
    accessible: boolean
    status_code: number
    error: string | null
    tested_at: string
  }>
}

export function GFWPermissionsDashboard() {
  const [status, setStatus] = useState<PermissionsStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Mock data based on our configuration
  const datasets: Record<string, GFWDataset> = {
    'public-global-vessels:v3.0': {
      name: 'Global Vessels Dataset',
      description: 'Basic vessel information including position, type, and flag',
      justification: 'Core vessel tracking for Angolan waters',
      status: 'pending',
      current_access: 'limited',
      priority: 'high'
    },
    'public-global-vessel-identity:v3.0': {
      name: 'Vessel Identity Dataset',
      description: 'Complete vessel identity with IMO, callsign, and registry data',
      justification: 'Vessel identification and compliance monitoring',
      status: 'pending',
      current_access: 'none',
      priority: 'high'
    },
    'public-global-fishing-effort:v3.0': {
      name: 'Fishing Effort Dataset',
      description: 'Fishing activity and effort data per location',
      justification: 'Monitor fishing pressure in Angolan marine protected areas',
      status: 'pending',
      current_access: 'none',
      priority: 'high'
    },
    'public-global-carrier-vessels:v3.0': {
      name: 'Carrier Vessels Dataset',
      description: 'Transport and supply vessels data',
      justification: 'Track support vessels and supply chains',
      status: 'pending',
      current_access: 'none',
      priority: 'high'
    },
    'public-global-transshipment:v3.0': {
      name: 'Transshipment Dataset',
      description: 'At-sea transfer activities between vessels',
      justification: 'Detect illegal transshipment activities in Angolan waters',
      status: 'pending',
      current_access: 'none',
      priority: 'high'
    }
  }

  const fetchStatus = async () => {
    setLoading(true)
    try {
      // Try to fetch from our webhook worker
      const response = await fetch('https://bgapp-gfw-webhook.majearcasa.workers.dev/api/permissions/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      } else {
        // Fallback to default status
        setStatus({
          request_submitted: false,
          submission_date: null,
          last_updated: new Date().toISOString(),
          datasets: {},
          overall_status: 'no_access'
        })
      }
    } catch (error) {
      console.error('Error fetching permissions status:', error)
      // Set default status on error
      setStatus({
        request_submitted: false,
        submission_date: null,
        last_updated: new Date().toISOString(),
        datasets: {},
        overall_status: 'no_access'
      })
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }

  const testDatasetAccess = async () => {
    setTesting(true)
    try {
      const response = await fetch('https://bgapp-gfw-webhook.majearcasa.workers.dev/api/permissions/test')
      if (response.ok) {
        const data = await response.json()
        setStatus(prev => prev ? { ...prev, live_test_results: data.results } : null)
      }
    } catch (error) {
      console.error('Error testing dataset access:', error)
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'denied': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'denied': return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getOverallStatusMessage = () => {
    if (!status) return ''

    switch (status.overall_status) {
      case 'full_access':
        return 'Acesso completo a todos os datasets solicitados'
      case 'partial_access':
        return 'Acesso parcial - alguns datasets ainda pendentes'
      case 'no_access':
        return 'Acesso limitado - apenas datasets públicos disponíveis'
      default:
        return 'Status desconhecido'
    }
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sortedDatasets = Object.entries(datasets).sort(([, a], [, b]) =>
    priorityOrder[a.priority] - priorityOrder[b.priority]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando status das permissões...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>Status das Permissões GFW</span>
                <Badge variant={status?.overall_status === 'full_access' ? 'default' : 'secondary'}>
                  {status?.overall_status?.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>
                {getOverallStatusMessage()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testDatasetAccess}
                disabled={testing}
              >
                {testing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Testar Acesso
              </Button>
              <Button variant="outline" size="sm" onClick={fetchStatus}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(datasets).filter(d => d.status === 'approved').length}
              </div>
              <div className="text-sm text-muted-foreground">Aprovados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Object.values(datasets).filter(d => d.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(datasets).length}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>

          {status?.submission_date && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Solicitação enviada em: {new Date(status.submission_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          {lastRefresh && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Última atualização: {lastRefresh.toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Status Alert */}
      {!status?.request_submitted && (
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Ainda não foi enviada uma solicitação formal para a GFW.</span>
              <Button size="sm" variant="outline" asChild>
                <a href="mailto:api@globalfishingwatch.org" target="_blank">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Solicitação
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Datasets List */}
      <Card>
        <CardHeader>
          <CardTitle>Datasets Solicitados</CardTitle>
          <CardDescription>
            Status detalhado de cada dataset necessário para o projeto BGAPP Angola
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedDatasets.map(([key, dataset]) => {
            const storedStatus = status?.datasets?.[key]
            const liveTest = status?.live_test_results?.[key]

            return (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{dataset.name}</h4>
                      <Badge
                        variant="outline"
                        className={getStatusColor(dataset.status)}
                      >
                        {getStatusIcon(dataset.status)}
                        <span className="ml-1">{dataset.status}</span>
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Prioridade {dataset.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {dataset.description}
                    </p>
                    <p className="text-xs text-blue-600">
                      <strong>Justificativa:</strong> {dataset.justification}
                    </p>
                  </div>
                </div>

                {/* Live Test Results */}
                {liveTest && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Teste de acesso:</span>
                      {liveTest.accessible ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Acessível
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Bloqueado (HTTP {liveTest.status_code})
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(liveTest.tested_at).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Stored Status Info */}
                {storedStatus && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div>Nível de acesso: {storedStatus.access_level || 'Não especificado'}</div>
                    <div>Última atualização: {new Date(storedStatus.last_updated).toLocaleDateString('pt-BR')}</div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" asChild>
              <a href="/gfw-request-email.txt" target="_blank">
                <Mail className="h-4 w-4 mr-2" />
                Ver Template de Email
              </a>
            </Button>

            <Button variant="outline" asChild>
              <a href="https://globalfishingwatch.org/our-apis/" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentação GFW API
              </a>
            </Button>

            <Button variant="outline" disabled>
              <Slack className="h-4 w-4 mr-2" />
              Notificações Slack
              <span className="ml-2 text-xs">(Configurar webhook)</span>
            </Button>

            <Button variant="outline" asChild>
              <a href="https://github.com/your-org/bgapp-angola/issues" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Acompanhar no GitHub
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}