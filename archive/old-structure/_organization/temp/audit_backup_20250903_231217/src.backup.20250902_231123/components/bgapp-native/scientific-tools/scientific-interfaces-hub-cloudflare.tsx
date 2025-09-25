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

  // 🎯 Interfaces científicas com URLs corrigidas
  const interfaces: ScientificInterface[] = [
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
      id: 'realtime-angola',
      name: 'Tempo Real Angola',
      description: 'Dados oceanográficos em tempo real da costa angolana',
      url: '/realtime_angola.html',
      category: 'monitoring',
      isActive: true,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'qgis-dashboard',
      name: 'Dashboard QGIS',
      description: 'Interface QGIS integrada para análise espacial avançada',
      url: '/qgis_dashboard.html',
      category: 'spatial',
      isActive: true,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'qgis-fisheries',
      name: 'QGIS Pescas',
      description: 'Sistema QGIS especializado para gestão de recursos pesqueiros',
      url: '/qgis_fisheries.html',
      category: 'spatial',
      isActive: true,
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
      isActive: true,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'mobile-pwa',
      name: 'Mobile PWA',
      description: 'Aplicação progressiva para dispositivos móveis',
      url: '/mobile_pwa.html',
      category: 'mobile',
      isActive: true,
      lastAccessed: new Date().toISOString()
    },
    {
      id: 'health-dashboard',
      name: 'Dashboard de Saúde',
      description: 'Monitorização da saúde do sistema e serviços',
      url: '/health_dashboard.html',
      category: 'monitoring',
      isActive: true,
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
    // Converter URL localhost para URL Cloudflare dinamicamente
    let url = interface_?.url || '';
    
    // Verificar se URL existe e não é undefined
    if (!url || typeof url !== 'string') {
      console.warn('⚠️ URL inválida para interface:', interface_);
      return;
    }
    
    // Usar URL base do ambiente científico
    const fullUrl = getScientificInterfaceUrl(url);
    
    // Abrir em nova aba
    window.open(fullUrl, '_blank');
    
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
      case 'mobile': return DevicePhoneMobileIcon;
      default: return BeakerIcon;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analysis': return 'bg-blue-100 text-blue-800';
      case 'monitoring': return 'bg-green-100 text-green-800';
      case 'spatial': return 'bg-purple-100 text-purple-800';
      case 'mobile': return 'bg-orange-100 text-orange-800';
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
            🔬 Hub Científico BGAPP
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
