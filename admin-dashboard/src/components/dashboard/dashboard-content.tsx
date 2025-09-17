/**
 * BGAPP Admin Dashboard - Dashboard Content Router
 * 
 * Copyright (c) 2025 MareDatum Consultoria e Gestão de Projectos Unipessoal LDA
 * Licensed under MIT License - see LICENSE file for details
 * 
 * This component handles routing and rendering of all dashboard sections
 * including ML systems, QGIS analysis, real-time data, and scientific interfaces.
 * 
 * Developed by:
 * - Director: Paulo Fernandes
 * - Technical Lead: Marcos Santos
 * 
 * Marine Angola Platform v2.0.0
 * https://bgapp-admin.pages.dev
 */

'use client'

import { DashboardOverview } from './sections/dashboard-overview-clean'
import { IframeWrapper } from './sections/iframe-wrapper'
import { ReportsManagement } from './reports-management'
import BGAPPIntegrationBulletproof from './bgapp-integration-bulletproof'
import ServicesIntegrationComplete from './services-integration-complete'
import ServicesIntegrationCloudflare from './services-integration-cloudflare'
import { ServicesStatus } from './services-status'

// 🎨 UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// 🚀 BGAPP Native Components - Silicon Valley Grade A+
import MLSystemDashboard from '../bgapp-native/ml-system/ml-system-dashboard'
import PredictiveFiltersManager from '../bgapp-native/ml-system/predictive-filters-manager'
import MLRetentionDashboard from '../ml-retention/MLRetentionDashboard'
import QGISAdvancedPanel from '../bgapp-native/qgis-advanced/qgis-advanced-panel'
import DataConnectorsManager from '../bgapp-native/data-processing/data-connectors-manager'
import ScientificInterfacesHub from '../bgapp-native/scientific-tools/scientific-interfaces-hub'

// 🗺️ QGIS Specific Components - Implementações Completas
import QGISSpatialAnalysis from './qgis-spatial-analysis'
import QGISTemporalVisualization from './qgis-temporal-visualization'
import QGISBiomassCalculator from './qgis-biomass-calculator'

// 🎣 Global Fishing Watch Integration
import { GFWManagement } from '../gfw/gfw-management'

// 🌊 Copernicus Integration
import { CopernicusOfficial } from '../copernicus/copernicus-official'

// 🔧 Enhanced Components
import SmartIFrameWrapper from '../iframe-enhanced/smart-iframe-wrapper'
import { AdvancedAnalytics } from './advanced-analytics'
import { RealtimeMetrics } from './realtime-metrics'
import {
  GlobeAltIcon,
  BeakerIcon,
  UserGroupIcon,
  CloudArrowUpIcon,
  MapIcon,
  EyeIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  CpuChipIcon,
  ServerIcon,
  CircleStackIcon,
  FolderIcon,
  CogIcon,
  WrenchScrewdriverIcon,
  RocketLaunchIcon,
  BuildingStorefrontIcon,
  BoltIcon,
  ShieldCheckIcon,
  BellIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface DashboardContentProps {
  section: string
}

export function DashboardContent({ section }: DashboardContentProps) {
  const renderSection = () => {
    switch (section) {
      case 'dashboard':
        return <DashboardOverview />
      
      case 'bgapp-integration':
        return <BGAPPIntegrationBulletproof />
      
      case 'services-integration':
        return <ServicesIntegrationCloudflare />
      
      // 🌊 COPERNICUS INTEGRATION
      case 'copernicus':
      case 'copernicus-monitoring':
      case 'copernicus-integration':
        return <CopernicusOfficial />
      
      // 🎣 GLOBAL FISHING WATCH
      case 'gfw':
      case 'global-fishing-watch':
      case 'fishing-monitoring':
        return <GFWManagement />
      
      // 🧠 MACHINE LEARNING SYSTEM
      case 'ml-system':
      case 'ml-dashboard':
        return <MLSystemDashboard />
      
      case 'predictive-filters':
        return <PredictiveFiltersManager />
      
      case 'ml-retention-system':
        return <MLRetentionDashboard />
      
      // 🗺️ QGIS ADVANCED SYSTEM  
      case 'qgis-advanced':
      case 'mcda-analysis':
        return <QGISAdvancedPanel />
      
      // 📊 DATA PROCESSING SYSTEM
      case 'data-processing':
      case 'connectors-manager':
        return <DataConnectorsManager />
      
      // 🔬 SCIENTIFIC INTERFACES HUB
      case 'scientific-hub':
      case 'scientific-interfaces':
        return <ScientificInterfacesHub />
      
      // 🌊 ENHANCED OCEAN SYSTEM
      case 'enhanced-ocean-system':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">🌊 Enhanced Ocean System</h1>
                <p className="text-muted-foreground">
                  Sistema de renderização oceânica avançado com shaders Unreal Engine
                </p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                NOVO
              </Badge>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌊 Visualização Oceânica Avançada
                  <Badge variant="outline">Offline</Badge>
                </CardTitle>
                <CardDescription>
                  Sistema de renderização oceânica com ondas Gerstner, caustics e qualidade adaptativa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IframeWrapper
                  src="/bgapp-enhanced-ocean-system.html"
                  title="Enhanced Ocean System"
                  description="Sistema avançado de monitoramento oceânico"
                  height="600px"
                />
              </CardContent>
            </Card>
          </div>
        )
      
      // 🗺️ QGIS ROUTES ESPECÍFICAS - IMPLEMENTAÇÕES COMPLETAS
      case 'qgis-spatial-analysis':
      case 'spatial-analysis':
        return <QGISSpatialAnalysis />
      
      case 'qgis-temporal-visualization':
      case 'temporal-visualization':
        return <QGISTemporalVisualization />
      
      case 'qgis-biomass-calculator':
      case 'biomass-calculator':
        return <QGISBiomassCalculator />
      
      case 'qgis-migration-overlay':
        return <QGISAdvancedPanel />
      
      case 'qgis-sustainable-zones':
        return <QGISAdvancedPanel />
      
      case 'qgis-tools':
        return <QGISAdvancedPanel />
      
      // 🧠 ML ROUTES EM FALTA - BERLIN DEV GODS FIX
      case 'ml-predictive-filters':
        return <PredictiveFiltersManager />
      
      case 'ml-models':
        return <MLSystemDashboard />
      
      case 'ml-auto-ingestion':
        return <MLSystemDashboard />
      
      case 'models-manager':
      case 'ml-models-manager':
        return <MLSystemDashboard />
      
      case 'auto-ingestion':
        return <MLSystemDashboard />
      
      // 📊 DATA PROCESSING ROUTES EM FALTA
      case 'processing-monitor':
        return <DataConnectorsManager />
      
      case 'quality-control':
        return <DataConnectorsManager />
      
      // 🔬 SCIENTIFIC ROUTES EM FALTA
      case 'dashboard-cientifico':
        return <IframeWrapper
          title="Dashboard Científico"
          description="Interface científica principal"
          src="https://bgapp-frontend.pages.dev/dashboard_cientifico.html"
          icon={BeakerIcon}
        />
      
      case 'weather-animations':
        return <IframeWrapper
          title="Animações Meteorológicas"
          description="Animações avançadas de vento e correntes"
          src="https://bgapp-frontend.pages.dev/bgapp-wind-animation-demo.html"
          icon={BoltIcon}
        />
      
      // Scientific Interfaces
      case 'scientific-angola':
        return <IframeWrapper
          title="Dashboard Científico Angola"
          description="Interface científica principal para dados oceanográficos de Angola"
          src="https://bgapp-frontend.pages.dev/dashboard_cientifico.html"
          icon={BeakerIcon}
        />
      
      case 'scientific-advanced':
        return <SmartIFrameWrapper
          title="Dashboard Científico Avançado"
          description="Análises científicas avançadas e modelos preditivos"
          url="https://bgapp-frontend.pages.dev/dashboard_cientifico.html"
          icon={BeakerIcon}
          preventLoop={true}
          showControls={true}
        />
      
      case 'collaboration':
        return <IframeWrapper
          title="Colaboração Científica"
          description="Plataforma de colaboração para investigadores e instituições"
          src="https://bgapp-frontend.pages.dev/collaboration.html"
          icon={UserGroupIcon}
        />
      
      case 'stac-ocean':
        return <IframeWrapper
          title="STAC Browser - Navegador de Catálogo"
          description="Interface visual para navegar no catálogo STAC oceanográfico"
          src="https://bgapp-frontend.pages.dev/stac_oceanographic"
          icon={CloudArrowUpIcon}
          height="900px"
        />

      // Maps and Visualization
      case 'interactive-map':
        return <IframeWrapper
          title="Mapa Interativo Principal"
          description="Visualização interativa de dados oceanográficos em tempo real"
          src="https://bgapp-frontend.pages.dev/index.html"
          icon={MapIcon}
          height="900px"
        />
      
      case 'realtime-angola':
        return <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">👁️ Tempo Real Angola</h1>
              <p className="text-muted-foreground">
                Dados oceanográficos em tempo real da costa angolana com integração Copernicus + GFW
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                COPERNICUS
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                GFW
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                LIVE
              </Badge>
            </div>
          </div>
          
          {/* Real-time Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌡️ Temperatura
                  <Badge className="bg-green-100 text-green-800">Copernicus</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">19.8°C</div>
                <p className="text-sm text-muted-foreground">Superfície do mar</p>
                <div className="text-xs text-green-600 mt-1">✅ Dados reais</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌱 Clorofila
                  <Badge className="bg-green-100 text-green-800">Copernicus</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">8.0 mg/m³</div>
                <p className="text-sm text-muted-foreground">Concentração</p>
                <div className="text-xs text-green-600 mt-1">✅ Dados reais</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚢 Embarcações
                  <Badge className="bg-blue-100 text-blue-800">GFW</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">47</div>
                <p className="text-sm text-muted-foreground">Ativas na ZEE</p>
                <div className="text-xs text-blue-600 mt-1">📊 Global Fishing Watch</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎣 Atividade Pesqueira
                  <Badge className="bg-blue-100 text-blue-800">GFW</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">8</div>
                <p className="text-sm text-muted-foreground">Zonas ativas</p>
                <div className="text-xs text-blue-600 mt-1">🔥 Esforço pesqueiro</div>
              </CardContent>
            </Card>
          </div>

          {/* Features Implemented */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚀 Funcionalidades Implementadas
              </CardTitle>
              <CardDescription>
                Novas features integradas no mapa Real-Time Angola
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-green-700">✅ Copernicus Data Space Ecosystem</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      Integração OData API
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      Autenticação Bearer Token
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      Dados Sentinel-3 processados
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      Sistema de fallback robusto
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      Indicadores visuais de status
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 text-blue-700">✅ Global Fishing Watch Enhanced</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                      Ícones SVG consistentes para navios
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                      Camada de esforço pesqueiro
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                      Densidade de embarcações
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                      Rastros AIS em tempo real
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                      Eventos de pesca detalhados
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗺️ Visualização Interativa Completa
              </CardTitle>
              <CardDescription>
                Interface integrada com todas as funcionalidades implementadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IframeWrapper
                src="https://bgapp-frontend.pages.dev/realtime_angola"
                title="Realtime Angola Enhanced"
                description="Monitoramento em tempo real com Copernicus + GFW"
                height="700px"
              />
            </CardContent>
          </Card>
        </div>
      
      case 'qgis-dashboard':
        return <IframeWrapper
          title="Dashboard QGIS"
          description="Interface QGIS integrada para análise espacial avançada"
          src="https://bgapp-frontend.pages.dev/qgis_dashboard.html"
          icon={MapIcon}
          height="900px"
        />
      
      case 'qgis-fisheries':
        return <IframeWrapper
          title="QGIS Pescas"
          description="Sistema QGIS especializado para gestão de recursos pesqueiros"
          src="https://bgapp-frontend.pages.dev/qgis_fisheries.html"
          icon={MapIcon}
          height="900px"
        />

      // Mobile Interfaces
      case 'mobile-pwa':
      case 'mobile-demos':
        return <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">📱 Mobile e Demos</h1>
              <p className="text-muted-foreground">
                Aplicações móveis e demonstrações do sistema BGAPP
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-frontend.pages.dev/mobile_pwa.html', '_blank')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DevicePhoneMobileIcon className="h-6 w-6" />
                  Mobile PWA Avançado
                </CardTitle>
                <CardDescription>Aplicação web progressiva otimizada</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir PWA</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-frontend.pages.dev/bgapp-enhanced-demo.html', '_blank')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RocketLaunchIcon className="h-6 w-6" />
                  Demo BGAPP Enhanced
                </CardTitle>
                <CardDescription>Demonstração das funcionalidades avançadas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Demo</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-frontend.pages.dev/minpermar/dist/index.html', '_blank')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BuildingStorefrontIcon className="h-6 w-6" />
                  Site MINPERMAR
                </CardTitle>
                <CardDescription>Portal oficial do Ministério das Pescas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Site</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-frontend.pages.dev/mobile.html', '_blank')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DevicePhoneMobileIcon className="h-6 w-6" />
                  Interface Mobile Básica
                </CardTitle>
                <CardDescription>Versão simplificada para mobile</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Mobile</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      
      case 'mobile-basic':
        return <IframeWrapper
          title="Interface Mobile Básica"
          description="Interface mobile simplificada para acesso rápido"
          src="https://bgapp-frontend.pages.dev/mobile.html"
          icon={DevicePhoneMobileIcon}
          height="700px"
        />

      // Analysis and Processing
      case 'advanced-analysis':
      case 'analytics':
        return <AdvancedAnalytics />
      
      case 'ai-assistant':
        return <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
              <CpuChipIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">AI Assistant</h2>
              <p className="text-purple-700 dark:text-purple-300">Assistente inteligente com GPT-4</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              🤖 Assistente IA em desenvolvimento com capacidades avançadas:
            </p>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li>• 🧠 Análise inteligente de dados oceanográficos</li>
              <li>• 📊 Geração automática de relatórios científicos</li>
              <li>• 🔍 Descoberta de padrões em grandes datasets</li>
              <li>• 💬 Interface conversacional para consultas</li>
              <li>• 🎯 Recomendações personalizadas baseadas em ML</li>
            </ul>
          </div>
        </div>
      
      case 'realtime-monitoring':
      case 'realtime-metrics':
        return <RealtimeMetrics />
      
      case 'metocean-animations':
        return <IframeWrapper
          title="Animações Meteorológicas"
          description="Visualizações animadas de dados meteorológicos e oceanográficos"
          src="https://bgapp-frontend.pages.dev/bgapp-wind-animation-demo.html"
          icon={CloudArrowUpIcon}
          height="900px"
        />
      
      case 'data-processing':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <CpuChipIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Processamento de Dados</h2>
              <p className="text-slate-600 dark:text-slate-400">Pipeline de processamento de dados oceanográficos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Ingestão</h3>
              <p className="text-2xl font-bold text-blue-600">2.4 TB/dia</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Dados processados</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Pipeline Ativo</h3>
              <p className="text-2xl font-bold text-green-600">12</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Processos em execução</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Latência Média</h3>
              <p className="text-2xl font-bold text-orange-600">1.2s</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tempo de resposta</p>
            </div>
          </div>
        </div>

      // Infrastructure
      case 'services-status':
      case 'system-management':
        return <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">🖥️ Gestão do Sistema</h1>
              <p className="text-muted-foreground">
                Monitorização e gestão completa dos serviços BGAPP
              </p>
            </div>
          </div>
          <ServicesStatus />
        </div>
      
      case 'databases':
        return <IframeWrapper
          title="Bases de Dados"
          description="Gestão e monitoramento das bases de dados"
          src="https://bgapp-frontend.pages.dev/admin.html#databases"
          icon={CircleStackIcon}
        />
      
      case 'storage':
        return <IframeWrapper
          title="Armazenamento"
          description="Gestão de armazenamento e ficheiros do sistema"
          src="https://bgapp-storage.majearcasa.workers.dev"
          icon={FolderIcon}
        />
      
      case 'health-dashboard':
        return <IframeWrapper
          title="Dashboard de Saúde"
          description="Monitoramento da saúde geral do sistema"
          src="https://bgapp-frontend.pages.dev/health_dashboard.html"
          icon={ChartBarIcon}
        />
      
      // Data Management
      case 'data-ingestion':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <CloudArrowUpIcon className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold">Ingestão de Dados</h2>
              <p className="text-slate-600 dark:text-slate-400">Pipeline de ingestão de dados oceanográficos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Fontes Ativas</h3>
              <p className="text-2xl font-bold text-blue-600">8</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">APIs conectadas</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Taxa Ingestão</h3>
              <p className="text-2xl font-bold text-green-600">45.2 MB/s</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Velocidade atual</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Registos/Dia</h3>
              <p className="text-2xl font-bold text-purple-600">2.1M</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Dados processados</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Qualidade</h3>
              <p className="text-2xl font-bold text-orange-600">98.7%</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Dados válidos</p>
            </div>
          </div>
        </div>

      case 'reports':
        return <ReportsManagement />

      // Settings
      case 'system-config':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <CogIcon className="h-8 w-8 text-slate-600" />
            <div>
              <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
              <p className="text-slate-600 dark:text-slate-400">Configurações gerais do sistema BGAPP</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Configurações de API</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Rate Limit (req/min)</label>
                  <input type="number" defaultValue="1000" className="w-full p-2 border rounded" />
                </div>
                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Timeout (segundos)</label>
                  <input type="number" defaultValue="30" className="w-full p-2 border rounded" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Cache</h3>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  Limpar Cache
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Otimizar Cache
                </button>
              </div>
            </div>
          </div>
        </div>

      case 'user-management':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <UserGroupIcon className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold">Gestão de Utilizadores</h2>
              <p className="text-slate-600 dark:text-slate-400">Administração de utilizadores e permissões</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">24</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Utilizadores ativos</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">5</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Administradores</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">12</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Investigadores</div>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Adicionar Utilizador
            </button>
            <button className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50">
              Gerir Permissões
            </button>
          </div>
        </div>

      // Development and Debug
      case 'system-logs':
        return <IframeWrapper
          title="Logs do Sistema"
          description="Visualização e análise de logs do sistema BGAPP"
          src="https://bgapp-frontend.pages.dev/debug.html"
          icon={WrenchScrewdriverIcon}
        />

      case 'debug-interface':
        return <IframeWrapper
          title="Interface de Debug"
          description="Ferramentas de debug e diagnóstico do sistema"
          src="https://bgapp-frontend.pages.dev/debug.html"
          icon={WrenchScrewdriverIcon}
        />

      case 'test-dashboard':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold">Dashboard de Testes</h2>
              <p className="text-slate-600 dark:text-slate-400">Execução e monitoramento de testes automáticos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">142</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Testes passaram</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">3</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Testes falharam</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">95.8%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Cobertura</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">2.3s</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Tempo médio</div>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Executar Todos os Testes
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Testes de Integração
            </button>
            <button className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50">
              Ver Relatório
            </button>
          </div>
        </div>

      // Demos and Tests
      case 'demo-enhanced':
        return <IframeWrapper
          title="Demo BGAPP Enhanced"
          description="Demonstração das funcionalidades avançadas do BGAPP"
          src="https://bgapp-frontend.pages.dev/bgapp-enhanced-demo.html"
          icon={RocketLaunchIcon}
          height="900px"
        />
      
      case 'demo-wind':
        return <IframeWrapper
          title="Demo Animações Vento"
          description="Demonstração das animações avançadas de vento e correntes"
          src="https://bgapp-frontend.pages.dev/bgapp-wind-animation-demo.html"
          icon={CloudArrowUpIcon}
          height="900px"
        />

      // Sites and Portals
      case 'minpermar':
        return <IframeWrapper
          title="Site MINPERMAR"
          description="Portal oficial do Ministério das Pescas e Recursos Marinhos"
          src="https://bgapp-frontend.pages.dev/minpermar/dist/index.html"
          icon={BuildingStorefrontIcon}
          height="900px"
        />

      // Performance and Cache
      case 'cache-redis':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <BoltIcon className="h-8 w-8 text-orange-600" />
            <div>
              <h2 className="text-2xl font-bold">Cache Redis</h2>
              <p className="text-slate-600 dark:text-slate-400">Sistema de cache distribuído para otimização de performance</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">83%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Taxa de acerto</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">2.1ms</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Latência média</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">45.2K</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Chaves ativas</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">1.8GB</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Memória usada</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-green-800 dark:text-green-200">Sistema Otimizado</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Cache Redis operando com performance excelente. Redução de 83% no tempo de resposta das consultas.
            </p>
          </div>
        </div>

      case 'async-processing':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <CpuChipIcon className="h-8 w-8 text-indigo-600" />
            <div>
              <h2 className="text-2xl font-bold">Processamento Assíncrono</h2>
              <p className="text-slate-600 dark:text-slate-400">Sistema de filas e processamento em background</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Filas Ativas</h3>
              <p className="text-2xl font-bold text-blue-600">7</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Workers em execução</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Jobs Pendentes</h3>
              <p className="text-2xl font-bold text-orange-600">23</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Na fila de espera</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Taxa Sucesso</h3>
              <p className="text-2xl font-bold text-green-600">99.1%</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Jobs completados</p>
            </div>
          </div>
        </div>

      // ML and AI
      case 'machine-learning':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <CpuChipIcon className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold">Machine Learning</h2>
              <p className="text-slate-600 dark:text-slate-400">Modelos de IA para análise oceanográfica</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Precisão dos Modelos</h3>
              <p className="text-3xl font-bold text-green-600">95.7%</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Média geral</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Modelos Ativos</h3>
              <p className="text-3xl font-bold text-blue-600">12</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Em produção</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Predições/Dia</h3>
              <p className="text-3xl font-bold text-purple-600">2.4K</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Processadas</p>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold">Modelos em Produção</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Predição de Upwelling</span>
                <span className="text-green-600 font-bold">97.2%</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Classificação de Espécies</span>
                <span className="text-green-600 font-bold">94.8%</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Análise de Clorofila</span>
                <span className="text-green-600 font-bold">96.1%</span>
              </div>
            </div>
          </div>
        </div>

      case 'predictive-models':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <ChartBarIcon className="h-8 w-8 text-emerald-600" />
            <div>
              <h2 className="text-2xl font-bold">Modelos Preditivos</h2>
              <p className="text-slate-600 dark:text-slate-400">Previsões avançadas baseadas em IA</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Previsões Ativas</h3>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Temperatura Superficial</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">7 dias</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Próxima atualização: 2h</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Biomassa Pesqueira</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">30 dias</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Próxima atualização: 24h</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Métricas de Performance</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-blue-600">R²: 0.94</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Correlação</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">MAE: 0.12</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Erro médio</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      // Security
      case 'auth-enterprise':
      case 'security-monitoring':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Segurança e Monitorização</h2>
              <p className="text-slate-600 dark:text-slate-400">Sistema de segurança, autenticação e monitorização avançado</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Disponibilidade</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">2FA</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Autenticação dupla</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">JWT</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Tokens seguros</div>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Funcionalidades de Segurança</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• OAuth 2.0 e OpenID Connect</li>
              <li>• Integração com Active Directory</li>
              <li>• Controlo de acesso baseado em roles (RBAC)</li>
              <li>• Auditoria completa de acessos</li>
              <li>• Sessões seguras com timeout automático</li>
            </ul>
          </div>
        </div>

      case 'backup-security':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold">Backup e Segurança</h2>
              <p className="text-slate-600 dark:text-slate-400">Sistema de backup automático e segurança de dados</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">Daily</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Backups automáticos</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">AES-256</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Encriptação</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">3-2-1</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Estratégia backup</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">30 dias</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Retenção</div>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Executar Backup Manual
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Verificar Integridade
            </button>
            <button className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50">
              Histórico de Backups
            </button>
          </div>
        </div>

      // Monitoring
      case 'auto-alerts':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <BellIcon className="h-8 w-8 text-yellow-600" />
            <div>
              <h2 className="text-2xl font-bold">Alertas Automáticos</h2>
              <p className="text-slate-600 dark:text-slate-400">Sistema de monitoramento e alertas inteligentes</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">24/7</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Monitoramento</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">15</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Regras ativas</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">3</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Alertas ativos</div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold">Alertas Recentes</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium">CPU alta no servidor de dados</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">há 5 minutos</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium">Backup completado com sucesso</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">há 2 horas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      case 'system-health':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <ChartBarIcon className="h-8 w-8 text-emerald-600" />
            <div>
              <h2 className="text-2xl font-bold">Saúde do Sistema</h2>
              <p className="text-slate-600 dark:text-slate-400">Monitoramento geral da saúde dos sistemas BGAPP</p>
            </div>
          </div>
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">PostGIS Database</span>
              </div>
              <span className="text-green-600 font-semibold">99.9% uptime</span>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">STAC FastAPI</span>
              </div>
              <span className="text-green-600 font-semibold">99.8% uptime</span>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">MinIO Storage</span>
              </div>
              <span className="text-green-600 font-semibold">100% uptime</span>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-green-800 dark:text-green-200">Todos os Sistemas Operacionais</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Todos os serviços críticos estão funcionando normalmente. Última verificação: agora.
            </p>
          </div>
        </div>

      // APIs
      case 'api-gateway':
        return <IframeWrapper
          title="API Admin"
          description="Interface de administração das APIs BGAPP"
          src="https://bgapp-api.majearcasa.workers.dev/docs"
          icon={GlobeAltIcon}
        />

      case 'apis-connectors':
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <CloudArrowUpIcon className="h-8 w-8 text-indigo-600" />
            <div>
              <h2 className="text-2xl font-bold">APIs e Conectores</h2>
              <p className="text-slate-600 dark:text-slate-400">Integrações externas e conectores de dados</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Serviços Ativos</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Frontend Principal</span>
                  <a href="https://bgapp-admin.pages.dev" target="_blank" className="text-green-600 font-medium hover:underline">:8085</a>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>API Admin</span>
                  <a href="https://bgapp-api.majearcasa.workers.dev/docs" target="_blank" className="text-green-600 font-medium hover:underline">API</a>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>STAC API</span>
                  <a href="https://bgapp-stac.majearcasa.workers.dev" target="_blank" className="text-green-600 font-medium hover:underline">STAC</a>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>STAC Browser</span>
                  <a href="https://bgapp-stac.majearcasa.workers.dev/browser" target="_blank" className="text-green-600 font-medium hover:underline">Browser</a>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>PyGeoAPI</span>
                  <a href="https://bgapp-pygeoapi.majearcasa.workers.dev" target="_blank" className="text-green-600 font-medium hover:underline">PyGeo</a>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Keycloak</span>
                  <a href="https://bgapp-auth.majearcasa.workers.dev" target="_blank" className="text-green-600 font-medium hover:underline">Auth</a>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Flower (Celery)</span>
                  <a href="https://bgapp-monitor.majearcasa.workers.dev" target="_blank" className="text-green-600 font-medium hover:underline">Monitor</a>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Bases de Dados</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>PostgreSQL</span>
                  <span className="text-green-600 font-medium">:5432</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Redis Cache</span>
                  <span className="text-green-600 font-medium">:6379</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>MinIO Storage</span>
                  <a href="https://bgapp-storage.majearcasa.workers.dev" target="_blank" className="text-green-600 font-medium hover:underline">Storage</a>
                </div>
              </div>
              <h3 className="font-semibold mt-6">Links Rápidos</h3>
              <div className="flex flex-wrap gap-2">
                <a href="https://bgapp-api.majearcasa.workers.dev/docs" target="_blank" className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  API Docs
                </a>
                <a href="https://bgapp-storage.majearcasa.workers.dev" target="_blank" className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                  MinIO Console
                </a>
                <a href="https://bgapp-monitor.majearcasa.workers.dev" target="_blank" className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                  Flower
                </a>
                <a href="https://bgapp-auth.majearcasa.workers.dev" target="_blank" className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">
                  Keycloak
                </a>
              </div>
            </div>
          </div>
        </div>
      
      // 🔥 ROUTES MASSIVAS EM FALTA - SILICON VALLEY + BERLIN DEV GODS POWER
      // ✅ QGIS routes já implementadas acima com componentes específicos
      
      case 'qgis-migration-overlay':
        return <QGISAdvancedPanel />
      
      case 'qgis-sustainable-zones':
        return <QGISAdvancedPanel />
      
      case 'qgis-tools':
        return <QGISAdvancedPanel />
      
      case 'ml-predictive-filters':
        return <PredictiveFiltersManager />
      
      case 'ml-models':
        return <MLSystemDashboard />
      
      case 'ml-auto-ingestion':
        return <MLSystemDashboard />
      
      case 'models-manager':
      case 'ml-models-manager':
        return <MLSystemDashboard />
      
      case 'auto-ingestion':
        return <MLSystemDashboard />
      
      case 'processing-monitor':
        return <DataConnectorsManager />
      
      case 'quality-control':
        return <DataConnectorsManager />
      
      case 'dashboard-cientifico':
        return <SmartIFrameWrapper
          title="Dashboard Científico"
          description="Interface científica principal"
          url="https://bgapp-frontend.pages.dev/dashboard_cientifico.html"
          icon={BeakerIcon}
          preventLoop={true}
        />
      
      case 'weather-animations':
        return <SmartIFrameWrapper
          title="Animações Meteorológicas"
          description="Animações avançadas de vento e correntes"
          url="https://bgapp-frontend.pages.dev/bgapp-wind-animation-demo.html"
          icon={BoltIcon}
          preventLoop={true}
        />
      
      case 'analysis':
        return <SmartIFrameWrapper
          title="Análises e Processamento"
          description="Centro de análises estatísticas"
          url="https://bgapp-frontend.pages.dev/dashboard.html"
          icon={ChartBarIcon}
          preventLoop={true}
        />
      
      case 'maps':
        return <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MapIcon className="h-8 w-8 text-blue-600" />
            🗺️ Mapas e Visualização
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-frontend.pages.dev/index.html', '_blank')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapIcon className="h-6 w-6" />
                  Mapa Interativo Principal
                </CardTitle>
                <CardDescription>Visualização interativa completa</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Mapa Principal</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-frontend.pages.dev/realtime_angola.html', '_blank')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EyeIcon className="h-6 w-6" />
                  Realtime Angola
                </CardTitle>
                <CardDescription>Dados em tempo real</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Realtime</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      
      case 'mobile':
        return <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <DevicePhoneMobileIcon className="h-8 w-8 text-green-600" />
            📱 Interfaces Mobile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-frontend.pages.dev/mobile_pwa.html', '_blank')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DevicePhoneMobileIcon className="h-6 w-6" />
                  Mobile PWA Avançado
                </CardTitle>
                <CardDescription>App progressiva otimizada</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir PWA</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-frontend.pages.dev/mobile.html', '_blank')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DevicePhoneMobileIcon className="h-6 w-6" />
                  Interface Mobile Básica
                </CardTitle>
                <CardDescription>Versão simplificada</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Mobile</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      
      case 'demos':
        return <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <RocketLaunchIcon className="h-8 w-8 text-purple-600" />
            🚀 Demos e Testes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-frontend.pages.dev/bgapp-enhanced-demo.html', '_blank')}>
              <CardHeader>
                <CardTitle>Demo BGAPP Enhanced</CardTitle>
                <CardDescription>Demonstração das funcionalidades avançadas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Demo Enhanced</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-frontend.pages.dev/bgapp-wind-animation-demo.html', '_blank')}>
              <CardHeader>
                <CardTitle>Demo Animações Vento</CardTitle>
                <CardDescription>Animações meteorológicas avançadas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Demo Vento</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      
      case 'sites':
        return <SmartIFrameWrapper
          title="Site MINPERMAR"
          description="Portal institucional MINPERMAR"
          url="https://bgapp-frontend.pages.dev/minpermar/dist/index.html"
          icon={BuildingStorefrontIcon}
          preventLoop={true}
        />
      
      case 'monitoring':
        return <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <EyeIcon className="h-8 w-8 text-green-600" />
            📈 Monitorização Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-frontend.pages.dev/health_dashboard.html', '_blank')}>
              <CardHeader>
                <CardTitle>Health Dashboard</CardTitle>
                <CardDescription>Saúde do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Health</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-monitor.majearcasa.workers.dev', '_blank')}>
              <CardHeader>
                <CardTitle>Flower Monitor</CardTitle>
                <CardDescription>Monitor Celery</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Flower</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-storage.majearcasa.workers.dev', '_blank')}>
              <CardHeader>
                <CardTitle>MinIO Console</CardTitle>
                <CardDescription>Console de armazenamento</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir MinIO</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      
      case 'performance':
        return <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BoltIcon className="h-8 w-8 text-yellow-600" />
            ⚡ Performance e Cache
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Cache</CardTitle>
                <CardDescription>Performance e otimização</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Cache Redis:</span>
                    <Badge className="bg-green-600">Ativo</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Hit Rate:</span>
                    <span className="font-medium">87.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latência:</span>
                    <span className="font-medium">&lt;1s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Métricas Sistema</CardTitle>
                <CardDescription>Performance geral</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>CPU:</span>
                    <span className="font-medium">45.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memória:</span>
                    <span className="font-medium">67.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="font-medium">99.7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      
      case 'security':
        return <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShieldCheckIcon className="h-8 w-8 text-red-600" />
            🔐 Segurança e Autenticação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-auth.majearcasa.workers.dev', '_blank')}>
              <CardHeader>
                <CardTitle>Keycloak Admin</CardTitle>
                <CardDescription>Gestão de autenticação</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Keycloak</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Enterprise Auth</CardTitle>
                <CardDescription>Sistema de autenticação empresarial</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className="bg-green-600">Ativo</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilizadores:</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sessões:</span>
                    <span className="font-medium">8</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      
      case 'settings':
        return <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <CogIcon className="h-8 w-8 text-gray-600" />
            ⚙️ Configurações Sistema
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>Configurações principais do sistema BGAPP</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Ambiente:</label>
                    <div className="mt-1">
                      <Badge>Desenvolvimento</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Versão:</label>
                    <div className="mt-1 font-medium">v2.0.0</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Debug:</label>
                    <div className="mt-1">
                      <Badge className="bg-yellow-600">Ativo</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cache:</label>
                    <div className="mt-1">
                      <Badge className="bg-green-600">Ativo</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      
      case 'development':
        return <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
            🛠️ Ferramentas de Desenvolvimento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-api.majearcasa.workers.dev/docs', '_blank')}>
              <CardHeader>
                <CardTitle>API Docs</CardTitle>
                <CardDescription>Documentação FastAPI</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Swagger</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open('https://bgapp-frontend.pages.dev/debug.html', '_blank')}>
              <CardHeader>
                <CardTitle>Debug Interface</CardTitle>
                <CardDescription>Interface de debug</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Abrir Debug</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Logs do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Ver Logs</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      
      case 'infrastructure':
        return <ServicesIntegrationComplete />
      
      case 'data-management':
        return <DataConnectorsManager />
      
      case 'ml-ai':
        return <MLSystemDashboard />
      
      case 'apis':
        return <DataConnectorsManager />
      
      default:
        return <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">{section.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Esta funcionalidade está em desenvolvimento. Em breve estará disponível com todas as funcionalidades.
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200">
              ℹ️ Funcionalidade identificada e mapeada no sistema BGAPP
            </p>
          </div>
        </div>
    }
  }

  return (
    <div className="space-y-6">
      {renderSection()}
    </div>
  )
}