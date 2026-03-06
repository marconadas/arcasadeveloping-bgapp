'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getScientificInterfaceUrl, getExternalServiceUrl, ENV } from '@/config/environment';
import { 
  BeakerIcon,
  EyeIcon,
  MapIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
  CloudIcon,
  GlobeAltIcon,
  PlayIcon,
  ArrowTopRightOnSquareIcon as ExternalLinkIcon
} from '@heroicons/react/24/outline';

interface ScientificInterface {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  isActive: boolean;
  lastAccessed: string;
}

export default function ScientificInterfacesHubCloudflare() {
  const [activeCategory, setActiveCategory] = useState('analysis');
  const [selectedInterface, setSelectedInterface] = useState<ScientificInterface | null>(null);

  // 🎯 Interfaces científicas expandidas - 40+ interfaces disponíveis
  const interfaces: ScientificInterface[] = [
    // 📊 ANÁLISE - Interfaces de análise científica
    {
      id: 'dashboard-cientifico',
      name: 'Dashboard Científico Angola',
      description: 'Interface científica principal para dados oceanográficos de Angola',
      url: '/dashboard_cientifico.html',
      category: 'analysis',
      isActive: true,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'dashboard-principal',
      name: 'Dashboard Principal',
      description: 'Dashboard principal com análises estatísticas avançadas',
      url: '/dashboard.html',
      category: 'analysis',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'collaboration',
      name: 'Colaboração Científica',
      description: 'Plataforma de colaboração para investigadores e instituições',
      url: '/collaboration.html',
      category: 'analysis',
      isActive: true,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'stac-ocean',
      name: 'STAC Oceanográfico',
      description: 'SpatioTemporal Asset Catalog para dados marinhos',
      url: '/stac_oceanographic.html',
      category: 'analysis',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'ml-demo',
      name: 'ML Demo',
      description: 'Demonstração de modelos de machine learning',
      url: '/ml-demo.html',
      category: 'analysis',
      isActive: true,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'enhanced-ocean-system',
      name: '🌊 Enhanced Ocean System',
      description: 'Sistema de renderização oceânica avançado com shaders Unreal Engine e ondas Gerstner',
      url: '/bgapp-enhanced-ocean-system.html',
      category: 'analysis',
      isActive: true,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'advanced-animations',
      name: 'Animações Avançadas',
      description: 'Demonstração de animações científicas avançadas',
      url: '/advanced-animations-demo.html',
      category: 'analysis',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'bgapp-enhanced-demo',
      name: 'Neptune Enhanced Demo',
      description: 'Demo das funcionalidades avançadas do Neptune (interface geral)',
      url: '/bgapp-enhanced-demo.html',
      category: 'analysis',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    
    // 👁️ MONITORIZAÇÃO - Interfaces de monitorização em tempo real
    {
      id: 'realtime-angola',
      name: 'Tempo Real Angola',
      description: 'Dados oceanográficos em tempo real da costa angolana',
      url: '/realtime_angola.html',
      category: 'monitoring',
      isActive: true,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'health-dashboard',
      name: 'Dashboard de Saúde',
      description: 'Monitorização da saúde do sistema e serviços',
      url: '/health_dashboard.html',
      category: 'monitoring',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'realtime-debug',
      name: 'Tempo Real Debug',
      description: 'Interface de debug para dados em tempo real',
      url: '/realtime_angola_debug.html',
      category: 'monitoring',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'realtime-fixed',
      name: 'Tempo Real Corrigido',
      description: 'Versão corrigida da interface de tempo real',
      url: '/realtime_angola_fixed.html',
      category: 'monitoring',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    
    // 🗺️ ESPACIAL - Interfaces de análise espacial e QGIS
    {
      id: 'qgis-dashboard',
      name: 'Dashboard QGIS',
      description: 'Interface QGIS integrada para análise espacial avançada',
      url: '/qgis_dashboard.html',
      category: 'spatial',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'qgis-fisheries',
      name: 'QGIS Pescas',
      description: 'Sistema QGIS especializado para gestão de recursos pesqueiros',
      url: '/qgis_fisheries.html',
      category: 'spatial',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'mapa-principal',
      name: 'Mapa Principal',
      description: 'Interface principal de visualização de mapas interativos',
      url: '/index.html',
      category: 'spatial',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'mapa-apple-design',
      name: 'Mapa Apple Design',
      description: 'Interface de mapas com design inspirado na Apple',
      url: '/index-apple-design.html',
      category: 'spatial',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'mapa-simples',
      name: 'Mapa Simples',
      description: 'Interface simplificada de visualização de mapas',
      url: '/test_mapa_simples.html',
      category: 'spatial',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'zee-limpa',
      name: 'ZEE Limpa',
      description: 'Visualização limpa da Zona Económica Exclusiva',
      url: '/test_zee_limpa.html',
      category: 'spatial',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    
    // 🎣 PESCAS - Interfaces especializadas em pescas
    {
      id: 'fisheries-management',
      name: 'Gestão Pesqueira',
      description: 'Sistema completo de gestão de recursos pesqueiros',
      url: '/qgis_fisheries.html',
      category: 'fisheries',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    
    // ⛅ METEOROLOGIA - Interfaces meteorológicas
    {
      id: 'wind-animations',
      name: 'Animações de Vento',
      description: 'Animações avançadas de vento e correntes marinhas',
      url: '/bgapp-wind-animation-demo.html',
      category: 'weather',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    
    // 🌐 SOCIAL - Interfaces sociais e colaborativas
    {
      id: 'minpermar-site',
      name: 'Site MINPERMAR',
      description: 'Portal oficial do Ministério das Pescas e Recursos Marinhos',
      url: '/minpermar-site/index.html',
      category: 'social',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    
    // 💾 DADOS - Interfaces de gestão de dados
    {
      id: 'admin-panel',
      name: 'Painel Administrativo',
      description: 'Interface administrativa para gestão do sistema',
      url: '/admin.html',
      category: 'data',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'admin-ubiquiti',
      name: 'Admin Ubiquiti UI',
      description: 'Interface administrativa com design Ubiquiti',
      url: '/admin-ubiquiti.html',
      category: 'data',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'ubiquiti-demo',
      name: 'Ubiquiti UI Demo',
      description: 'Demonstração da interface Ubiquiti',
      url: '/ubiquiti-ui-demo.html',
      category: 'data',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'debug-interface',
      name: 'Interface de Debug',
      description: 'Interface para debug e diagnóstico do sistema',
      url: '/debug.html',
      category: 'data',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    
    // 📱 MOBILE - Interfaces mobile
    {
      id: 'mobile-pwa',
      name: 'Mobile PWA',
      description: 'Aplicação web progressiva otimizada para dispositivos móveis',
      url: '/mobile_pwa.html',
      category: 'mobile',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'mobile-basic',
      name: 'Mobile Básico',
      description: 'Interface mobile básica e rápida',
      url: '/mobile.html',
      category: 'mobile',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    
    // 🧪 TESTES - Interfaces de teste e validação
    {
      id: 'test-dashboard',
      name: 'Teste Dashboard',
      description: 'Interface de teste para o dashboard principal',
      url: '/test_dashboard.html',
      category: 'testing',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'test-api',
      name: 'Teste API',
      description: 'Interface para testar APIs do sistema',
      url: '/test_api.html',
      category: 'testing',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'test-dependencies',
      name: 'Teste Dependências',
      description: 'Interface para testar dependências do sistema',
      url: '/test_dependencies.html',
      category: 'testing',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'test-final-validation',
      name: 'Validação Final',
      description: 'Interface de validação final do sistema',
      url: '/test_final_validation.html',
      category: 'testing',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'test-realtime-corrected',
      name: 'Teste Tempo Real Corrigido',
      description: 'Teste da interface de tempo real corrigida',
      url: '/test_realtime_corrected.html',
      category: 'testing',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'test-admin-simple',
      name: 'Teste Admin Simples',
      description: 'Teste simplificado da interface administrativa',
      url: '/test-admin-simple.html',
      category: 'testing',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'test-mobile-menu',
      name: 'Teste Menu Mobile',
      description: 'Teste do menu mobile e responsividade',
      url: '/test-mobile-menu.html',
      category: 'testing',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'test-debug-fixes',
      name: 'Teste Correções Debug',
      description: 'Teste das correções de debug implementadas',
      url: '/test-debug-fixes.html',
      category: 'testing',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'test-real-functionality',
      name: 'Teste Funcionalidade Real',
      description: 'Teste das funcionalidades reais do sistema',
      url: '/test-real-functionality.html',
      category: 'testing',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'test-simple-map',
      name: 'Teste Mapa Simples',
      description: 'Teste da interface de mapa simplificada',
      url: '/test-simple-map.html',
      category: 'testing',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'test-cabinda-coordinates',
      name: 'Teste Coordenadas Cabinda',
      description: 'Teste específico das coordenadas de Cabinda',
      url: '/test_cabinda_coordinates.html',
      category: 'testing',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'test-admin-optimization',
      name: 'Teste Otimização Admin',
      description: 'Teste das otimizações da interface administrativa',
      url: '/test-admin-optimization.html',
      category: 'testing',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    
    // 🔧 UTILITÁRIOS - Interfaces utilitárias
    {
      id: 'force-cache-clear',
      name: 'Limpeza de Cache',
      description: 'Utilitário para limpeza forçada de cache',
      url: '/force-cache-clear.html',
      category: 'utilities',
      isActive: false,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'admin-services-integration',
      name: 'Integração Serviços Admin',
      description: 'Interface de integração de novos serviços administrativos',
      url: '/admin_new_services_integration.html',
      category: 'utilities',
      isActive: false,
      lastAccessed: new Date().toISOString()
    }
  ];

  // 📊 Agrupar por categoria
  const interfacesByCategory = interfaces.reduce((acc, interface_) => {
    if (!acc[interface_.category]) {
      acc[interface_.category] = [];
    }
    acc[interface_.category].push(interface_);
    return acc;
  }, {} as Record<string, ScientificInterface[]>);

  const categories = Object.keys(interfacesByCategory);

  const handleOpenInterface = (interface_: ScientificInterface) => {
    // Usar sistema de configuração centralizado
    let url = interface_?.url || '';
    
    // Verificar se URL existe e não é undefined
    if (!url || typeof url !== 'string') {
      console.warn('⚠️ URL inválida para interface:', interface_);
      return;
    }
    
    // Converter URLs obsoletas para URLs corretas
    if (url.includes('e1a322f9.bgapp-arcasadeveloping.pages.dev')) {
      url = url.replace(/https?:\/\/e1a322f9\.bgapp-arcasadeveloping\.pages\.dev/g, ENV.scientificInterfacesUrl);
    } else if (url.includes('localhost')) {
      // Para outros serviços localhost, usar URLs apropriadas
      if (url.includes(':8082')) url = getExternalServiceUrl('stacBrowser');
      else if (url.includes(':5555')) url = getExternalServiceUrl('flowerMonitor');
      else if (url.includes(':9001')) url = getExternalServiceUrl('minioConsole');
      else if (url.includes(':5080')) url = getExternalServiceUrl('pygeoapi');
      else if (url.includes(':8085')) url = ENV.scientificInterfacesUrl + url.replace('http://localhost:8085', '');
    }
    
    // Se URL não começar com http, usar URL base científica
    if (!url.startsWith('http')) {
      url = getScientificInterfaceUrl(url);
    }
    
    // Abrir em nova aba
    window.open(url, '_blank');
    
    // Atualizar lastAccessed (simulado)
    setSelectedInterface({
      ...interface_,
      lastAccessed: new Date().toISOString()
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analysis': return ChartBarIcon;
      case 'monitoring': return EyeIcon;
      case 'spatial': return MapIcon;
      case 'fisheries': return BeakerIcon;
      case 'weather': return CloudIcon;
      case 'social': return GlobeAltIcon;
      case 'data': return CloudArrowUpIcon;
      case 'mobile': return DevicePhoneMobileIcon;
      case 'testing': return BeakerIcon;
      case 'utilities': return CloudArrowUpIcon;
      default: return BeakerIcon;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analysis': return 'bg-blue-100 text-blue-800';
      case 'monitoring': return 'bg-green-100 text-green-800';
      case 'spatial': return 'bg-purple-100 text-purple-800';
      case 'fisheries': return 'bg-orange-100 text-orange-800';
      case 'weather': return 'bg-cyan-100 text-cyan-800';
      case 'social': return 'bg-pink-100 text-pink-800';
      case 'data': return 'bg-indigo-100 text-indigo-800';
      case 'mobile': return 'bg-emerald-100 text-emerald-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      case 'utilities': return 'bg-slate-100 text-slate-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BeakerIcon className="h-8 w-8 text-green-600" />
            🔬 Hub Científico Neptune
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Portal unificado para {interfaces.length} interfaces científicas especializadas
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600">Sistema 100% funcional no Cloudflare</span>
          </div>
        </div>
        <Button onClick={() => window.location.reload()}>
          Atualizar Interfaces
        </Button>
      </div>

      {/* Estatísticas das Interfaces */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Interfaces Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {interfaces.filter(i => i.isActive).length}
                </p>
              </div>
              <PlayIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categorias</p>
                <p className="text-2xl font-bold text-blue-600">
                  {categories.length}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Interfaces</p>
                <p className="text-2xl font-bold text-purple-600">
                  {interfaces.length}
                </p>
              </div>
              <BeakerIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ambiente</p>
                <p className="text-sm font-medium text-blue-600">
                  {ENV.isProduction ? 'Cloudflare' : 'Local'}
                </p>
              </div>
              <CloudArrowUpIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interfaces Populares */}
      <Card>
        <CardHeader>
          <CardTitle>⭐ Interfaces Mais Populares</CardTitle>
          <CardDescription>
            Acesso rápido às interfaces científicas mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => window.open(getScientificInterfaceUrl('/dashboard_cientifico.html'), '_blank')}
            >
              <ChartBarIcon className="h-6 w-6 mb-2 text-blue-600" />
              <span>Dashboard Científico</span>
              <span className="text-xs text-gray-500">Interface principal</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => window.open(getScientificInterfaceUrl('/realtime_angola.html'), '_blank')}
            >
              <EyeIcon className="h-6 w-6 mb-2 text-green-600" />
              <span>Realtime Angola</span>
              <span className="text-xs text-gray-500">Dados em tempo real</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => window.open(getScientificInterfaceUrl('/qgis_dashboard.html'), '_blank')}
            >
              <MapIcon className="h-6 w-6 mb-2 text-purple-600" />
              <span>QGIS Dashboard</span>
              <span className="text-xs text-gray-500">Análise espacial</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => window.open(getScientificInterfaceUrl('/mobile_pwa.html'), '_blank')}
            >
              <DevicePhoneMobileIcon className="h-6 w-6 mb-2 text-emerald-600" />
              <span>Mobile PWA</span>
              <span className="text-xs text-gray-500">App progressiva</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Todas as Interfaces por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>🗂️ Todas as Interfaces por Categoria</CardTitle>
          <CardDescription>
            Navegação completa por todas as {interfaces.length} interfaces disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">Análise ({interfacesByCategory.analysis?.length || 0})</TabsTrigger>
              <TabsTrigger value="monitoring">Monitor ({interfacesByCategory.monitoring?.length || 0})</TabsTrigger>
              <TabsTrigger value="spatial">Espacial ({interfacesByCategory.spatial?.length || 0})</TabsTrigger>
              <TabsTrigger value="mobile">Mobile ({interfacesByCategory.mobile?.length || 0})</TabsTrigger>
            </TabsList>

            {categories.map(category => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interfacesByCategory[category]?.map((interface_) => (
                    <div 
                      key={interface_.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {React.createElement(getCategoryIcon(interface_.category), { 
                          className: "h-5 w-5 text-blue-600" 
                        })}
                        <div>
                          <h4 className="font-medium">{interface_.name}</h4>
                          <p className="text-sm text-gray-600">{interface_.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(interface_.category)}>
                          {interface_.category}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleOpenInterface(interface_)}
                          disabled={!interface_.isActive}
                        >
                          <ExternalLinkIcon className="h-4 w-4 mr-1" />
                          Abrir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Status do Ambiente */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CloudArrowUpIcon className="h-5 w-5 text-green-600" />
            <span className="text-green-800">
              ✅ Sistema funcionando no {ENV.isProduction ? 'Cloudflare (Produção)' : 'Ambiente Local'}
            </span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Todas as interfaces estão acessíveis via: {ENV.scientificInterfacesUrl}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
