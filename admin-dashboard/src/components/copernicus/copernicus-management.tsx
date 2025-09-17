/**
 * BGAPP Admin Dashboard - Copernicus Management Component
 * 
 * Copyright (c) 2025 MareDatum Consultoria e Gestão de Projectos Unipessoal LDA
 * Licensed under MIT License - see LICENSE file for details
 * 
 * This component provides comprehensive management and monitoring of Copernicus
 * Data Space Ecosystem integration, including API status, data quality,
 * and oceanographic layers management.
 * 
 * Developed by:
 * - Director: Paulo Fernandes
 * - Technical Lead: Marcos Santos
 * 
 * Marine Angola Platform v2.0.0
 * https://bgapp-admin.pages.dev
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  GlobeAltIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  CpuChipIcon,
  BeakerIcon,
  MapIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface CopernicusStatus {
  api_status: 'online' | 'offline' | 'fallback'
  token_valid: boolean
  last_update: string
  data_points: number
  products_count: number
  source: string
}

interface OceanographicData {
  temperature: number
  salinity: number
  chlorophyll: number
  current_speed: number
  timestamp: string
  data_quality: string
}

export function CopernicusManagement() {
  const [copernicusStatus, setCopernicusStatus] = useState<CopernicusStatus>({
    api_status: 'offline',
    token_valid: false,
    last_update: '',
    data_points: 0,
    products_count: 0,
    source: 'unknown'
  })
  
  const [oceanData, setOceanData] = useState<OceanographicData>({
    temperature: 0,
    salinity: 0,
    chlorophyll: 0,
    current_speed: 0,
    timestamp: '',
    data_quality: 'unknown'
  })
  
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchCopernicusStatus = async () => {
    try {
      setLoading(true)
      
      // Fetch from our official Copernicus worker
      const response = await fetch('https://bgapp-copernicus-official.majearcasa.workers.dev/copernicus/angola-marine')
      
      if (response.ok) {
        const data = await response.json()
        
        // Process new official Copernicus data structure
        const hasData = data.summary && data.summary.total_products_found > 0
        const successfulApis = data.summary ? data.summary.apis_successful : 0
        
        setCopernicusStatus({
          api_status: hasData && successfulApis > 0 ? 'online' : 
                     successfulApis > 0 ? 'fallback' : 'offline',
          token_valid: successfulApis > 0,
          last_update: data.timestamp || new Date().toISOString(),
          data_points: data.summary ? data.summary.total_products_found : 0,
          products_count: data.summary ? data.summary.total_products_found : 0,
          source: successfulApis === 3 ? 'copernicus_official' : 
                  successfulApis > 0 ? 'copernicus_partial' : 'offline'
        })
        
        setOceanData({
          temperature: data.temperature || 0,
          salinity: data.salinity || 0,
          chlorophyll: data.chlorophyll || 0,
          current_speed: data.current_speed || 0,
          timestamp: data.timestamp,
          data_quality: data.copernicus_status === 'online' ? 'high' : 'simulated'
        })
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching Copernicus status:', error)
      setCopernicusStatus(prev => ({ ...prev, api_status: 'offline' }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCopernicusStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCopernicusStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100'
      case 'fallback': return 'text-yellow-600 bg-yellow-100'
      case 'offline': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'fallback': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
      case 'offline': return <XCircleIcon className="h-5 w-5 text-red-600" />
      default: return <ArrowPathIcon className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            🌊 Copernicus Integration
          </h1>
          <p className="text-muted-foreground">
            Monitoramento e gestão da integração com Copernicus Data Space Ecosystem
          </p>
        </div>
        <Button onClick={fetchCopernicusStatus} disabled={loading}>
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status API</CardTitle>
            {getStatusIcon(copernicusStatus.api_status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getStatusColor(copernicusStatus.api_status)}>
                {copernicusStatus.api_status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {copernicusStatus.token_valid ? 'Token válido' : 'Token inválido/ausente'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Sentinel</CardTitle>
            <CloudArrowUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{copernicusStatus.products_count}</div>
            <p className="text-xs text-muted-foreground">
              Últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos de Dados</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{copernicusStatus.data_points}</div>
            <p className="text-xs text-muted-foreground">
              Processados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualidade</CardTitle>
            <BeakerIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={oceanData.data_quality === 'high' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {oceanData.data_quality === 'high' ? 'ALTA' : 'SIMULADA'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Dados oceanográficos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {copernicusStatus.api_status === 'fallback' && (
        <Alert>
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Modo Fallback Ativo:</strong> Usando dados locais. Para ativar a integração completa, 
            configure o token COPERNICUS_TOKEN no Cloudflare Worker.
          </AlertDescription>
        </Alert>
      )}

      {copernicusStatus.api_status === 'online' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Copernicus Online:</strong> Integração ativa com dados reais do Copernicus Data Space Ecosystem.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="data">Dados Oceanográficos</TabsTrigger>
          <TabsTrigger value="layers">Gestão de Camadas</TabsTrigger>
          <TabsTrigger value="api">Configuração API</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Real-time Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌡️ Dados em Tempo Real
                </CardTitle>
                <CardDescription>
                  Dados oceanográficos atuais da costa angolana
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{oceanData.temperature.toFixed(1)}°C</div>
                    <div className="text-xs text-muted-foreground">Temperatura</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-green-600">{oceanData.chlorophyll.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Clorofila mg/m³</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{oceanData.salinity.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Salinidade PSU</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{oceanData.current_speed?.toFixed(2) || '0.00'}</div>
                    <div className="text-xs text-muted-foreground">Corrente m/s</div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Última atualização: {new Date(oceanData.timestamp).toLocaleString('pt-PT')}
                </div>
              </CardContent>
            </Card>

            {/* API Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔌 Status da Integração
                </CardTitle>
                <CardDescription>
                  Estado atual da conexão com Copernicus
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Copernicus:</span>
                    <Badge className={getStatusColor(copernicusStatus.api_status)}>
                      {copernicusStatus.api_status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Token:</span>
                    <Badge className={copernicusStatus.token_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {copernicusStatus.token_valid ? 'Válido' : 'Inválido'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fonte de Dados:</span>
                    <Badge variant="outline">
                      {copernicusStatus.source}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Última Verificação:</span>
                    <span className="text-xs text-muted-foreground">
                      {lastRefresh.toLocaleTimeString('pt-PT')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integration with Realtime Angola */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗺️ Mapa Real-Time Angola
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  INTEGRADO
                </Badge>
              </CardTitle>
              <CardDescription>
                Interface integrada com dados Copernicus e GFW
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-blue-600">10+</div>
                    <div className="text-xs text-muted-foreground">Camadas Ativas</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-green-600">4</div>
                    <div className="text-xs text-muted-foreground">Filtros GFW</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-purple-600">SVG</div>
                    <div className="text-xs text-muted-foreground">Ícones Navios</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => window.open('https://bgapp-frontend.pages.dev/realtime_angola', '_blank')}
                  >
                    <MapIcon className="h-4 w-4 mr-2" />
                    Abrir Mapa
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open('https://bgapp-copernicus-official.majearcasa.workers.dev/copernicus/angola-marine', '_blank')}
                  >
                    <GlobeAltIcon className="h-4 w-4 mr-2" />
                    Ver API Oficial
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open('https://bgapp-copernicus-official.majearcasa.workers.dev/copernicus/odata?collection=SENTINEL-3&max_records=5', '_blank')}
                  >
                    Debug OData
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open('https://bgapp-copernicus-official.majearcasa.workers.dev/copernicus/opensearch?collection=Sentinel3&max_records=3', '_blank')}
                  >
                    OpenSearch
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open('https://bgapp-copernicus-official.majearcasa.workers.dev/copernicus/auth', '_blank')}
                  >
                    Ver Token
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Temperature Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌡️ Temperatura Superficial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">{oceanData.temperature.toFixed(1)}°C</div>
                    <div className="text-sm text-muted-foreground">Média regional</div>
                  </div>
                  <Progress value={((oceanData.temperature - 15) / (30 - 15)) * 100} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>15°C</span>
                    <span>22.5°C</span>
                    <span>30°C</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chlorophyll Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌱 Clorofila-a
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{oceanData.chlorophyll.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">mg/m³</div>
                  </div>
                  <Progress value={(oceanData.chlorophyll / 20) * 100} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>10</span>
                    <span>20+ mg/m³</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salinity Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🧂 Salinidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600">{oceanData.salinity.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">PSU</div>
                  </div>
                  <Progress value={((oceanData.salinity - 34) / (37 - 34)) * 100} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>34 PSU</span>
                    <span>35.5 PSU</span>
                    <span>37 PSU</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Speed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌊 Velocidade Corrente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600">{oceanData.current_speed?.toFixed(2) || '0.00'}</div>
                    <div className="text-sm text-muted-foreground">m/s</div>
                  </div>
                  <Progress value={(oceanData.current_speed || 0) / 2 * 100} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>1</span>
                    <span>2+ m/s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="layers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🗺️ Gestão de Camadas Oceanográficas</CardTitle>
              <CardDescription>
                Controle das camadas implementadas no mapa Real-Time Angola
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Dados Oceanográficos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { name: 'SST (Temperatura)', status: 'ativo', icon: '🌡️' },
                      { name: 'Clorofila-a', status: 'ativo', icon: '🌱' },
                      { name: 'Correntes', status: 'ativo', icon: '🌊' },
                      { name: 'Upwelling', status: 'ativo', icon: '⬆️' },
                      { name: 'Batimetria', status: 'ativo', icon: '🏔️' }
                    ].map((layer) => (
                      <div key={layer.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="flex items-center gap-2">
                          <span>{layer.icon}</span>
                          {layer.name}
                        </span>
                        <Badge className="bg-green-100 text-green-800">
                          {layer.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Global Fishing Watch</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { name: 'Embarcações', status: 'ativo', icon: '🚢' },
                      { name: 'Esforço Pesqueiro', status: 'ativo', icon: '🔥' },
                      { name: 'Densidade', status: 'ativo', icon: '📊' },
                      { name: 'Rastros AIS', status: 'ativo', icon: '📍' },
                      { name: 'Eventos Pesca', status: 'ativo', icon: '🎣' }
                    ].map((layer) => (
                      <div key={layer.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="flex items-center gap-2">
                          <span>{layer.icon}</span>
                          {layer.name}
                        </span>
                        <Badge className="bg-green-100 text-green-800">
                          {layer.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🔧 Configuração da API Copernicus</CardTitle>
              <CardDescription>
                Configurações e endpoints da integração Copernicus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Endpoints Configurados</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">OData API</div>
                        <div className="text-xs text-muted-foreground">catalogue.dataspace.copernicus.eu</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Configurado</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Token Authentication</div>
                        <div className="text-xs text-muted-foreground">Bearer Token JWT</div>
                      </div>
                      <Badge className={copernicusStatus.token_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {copernicusStatus.token_valid ? 'Válido' : 'Inválido'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Geospatial Filter</div>
                        <div className="text-xs text-muted-foreground">Angola EEZ (11.5°E-14.0°E, -18°S--4.5°S)</div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Ativo</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Produtos Sentinel Integrados</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Sentinel-3 OLCI', description: 'Cor do oceano (clorofila)', status: 'ativo' },
                      { name: 'Sentinel-3 SLSTR', description: 'Temperatura superficial', status: 'ativo' },
                      { name: 'Sentinel-3 SYN', description: 'Dados sinérgicos', status: 'planejado' }
                    ].map((product) => (
                      <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">{product.description}</div>
                        </div>
                        <Badge className={product.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {product.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📚 Documentação Técnica</h3>
                  <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                    <div>• <strong>API OData:</strong> Consultas estruturadas de produtos Sentinel</div>
                    <div>• <strong>Autenticação:</strong> OAuth2 com Bearer tokens</div>
                    <div>• <strong>Filtros Geoespaciais:</strong> SRID=4326 para região de Angola</div>
                    <div>• <strong>Processamento:</strong> Conversão automática para dados oceanográficos</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
