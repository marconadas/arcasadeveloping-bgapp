'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getScientificInterfaceUrl, getExternalServiceUrl, ENV } from '@/config/environment';
import { bgappApiCloudflare } from '@/lib/api-cloudflare';
import { 
  BeakerIcon,
  EyeIcon,
  MapIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
  GlobeAltIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon as ExternalLinkIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { bgappAPI, ScientificInterface } from '@/lib/bgapp/bgapp-api';
import { useScientificInterfaces } from '@/lib/bgapp/hooks';

/**
 * 🔬 SCIENTIFIC INTERFACES HUB - Silicon Valley Grade A+
 * Portal unificado para todas as 41 interfaces científicas BGAPP
 */

export default function ScientificInterfacesHub() {
  const {
    data: interfaces,
    isLoading,
    error,
    isUsingFallback,
    refetch
  } = useScientificInterfaces(() => bgappAPI.getScientificInterfaces());

  const [selectedInterface, setSelectedInterface] = useState<ScientificInterface | null>(null);
  const [activeCategory, setActiveCategory] = useState('analysis');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analysis': return ChartBarIcon;
      case 'monitoring': return EyeIcon;
      case 'spatial': return MapIcon;
      case 'fisheries': return BeakerIcon;
      case 'weather': return BoltIcon;
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
      case 'analysis': return 'text-blue-600 bg-blue-50';
      case 'monitoring': return 'text-green-600 bg-green-50';
      case 'spatial': return 'text-purple-600 bg-purple-50';
      case 'fisheries': return 'text-orange-600 bg-orange-50';
      case 'weather': return 'text-cyan-600 bg-cyan-50';
      case 'social': return 'text-pink-600 bg-pink-50';
      case 'data': return 'text-indigo-600 bg-indigo-50';
      case 'mobile': return 'text-emerald-600 bg-emerald-50';
      case 'testing': return 'text-yellow-600 bg-yellow-50';
      case 'utilities': return 'text-slate-600 bg-slate-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const interfacesByCategory = interfaces?.reduce((acc, interface_) => {
    if (!acc[interface_.category]) {
      acc[interface_.category] = [];
    }
    acc[interface_.category].push(interface_);
    return acc;
  }, {} as Record<string, ScientificInterface[]>) || {};

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
      url = url.replace('https://e1a322f9.bgapp-arcasadeveloping.pages.dev', ENV.scientificInterfacesUrl);
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            Portal unificado para {interfaces?.length || 41} interfaces científicas especializadas
          </p>
          {isUsingFallback && (
            <div className="flex items-center gap-2 mt-2">
              <ExternalLinkIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-600">Usando dados de fallback</span>
            </div>
          )}
        </div>
        <Button onClick={refetch} disabled={isLoading}>
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
                  {interfaces?.filter(i => i.isActive).length || 0}
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
                  {interfaces?.length || 41}
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
                <p className="text-sm text-gray-600">Mais Usada</p>
                <p className="text-sm font-medium">
                  Dashboard Científico
                </p>
              </div>
              <EyeIcon className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs por Categoria */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis">Análise ({interfacesByCategory.analysis?.length || 0})</TabsTrigger>
          <TabsTrigger value="monitoring">Monitor ({interfacesByCategory.monitoring?.length || 0})</TabsTrigger>
          <TabsTrigger value="spatial">Espacial ({interfacesByCategory.spatial?.length || 0})</TabsTrigger>
          <TabsTrigger value="mobile">Mobile ({interfacesByCategory.mobile?.length || 0})</TabsTrigger>
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interfacesByCategory[category]?.map((interface_) => {
                const CategoryIcon = getCategoryIcon(interface_.category);

                return (
                  <Card 
                    key={interface_.id}
                    className={`hover:shadow-lg transition-all cursor-pointer ${
                      interface_.isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedInterface(interface_)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon className={`h-5 w-5 ${interface_.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="font-medium">{interface_.name}</span>
                        </div>
                        <Badge className={getCategoryColor(interface_.category)}>
                          {interface_.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          {interface_.description}
                        </p>

                        {/* Features */}
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Features:</p>
                          <div className="flex flex-wrap gap-1">
                            {interface_.features.slice(0, 2).map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {interface_.features.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{interface_.features.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Último Acesso */}
                        {interface_.lastAccessed && (
                          <div className="text-xs text-gray-500">
                            Último acesso: {new Date(interface_.lastAccessed).toLocaleDateString()}
                          </div>
                        )}

                        {/* Botão de Acesso */}
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInterface(interface_);
                          }}
                          disabled={!interface_.isActive}
                        >
                          <ExternalLinkIcon className="h-4 w-4 mr-1" />
                          {interface_.isActive ? 'Abrir Interface' : 'Interface Inativa'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Interface Selecionada - Preview */}
      {selectedInterface && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(getCategoryIcon(selectedInterface.category), { className: "h-6 w-6" })}
              Preview: {selectedInterface.name}
            </CardTitle>
            <CardDescription>
              Pré-visualização da interface científica selecionada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Informações da Interface */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Categoria:</strong> {selectedInterface.category}</div>
                    <div><strong>URL:</strong> <code className="text-xs">{selectedInterface.url}</code></div>
                    <div><strong>Status:</strong> {selectedInterface.isActive ? 'Ativo' : 'Inativo'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Features ({selectedInterface.features.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedInterface.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleOpenInterface(selectedInterface)}
                  disabled={!selectedInterface.isActive}
                >
                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </Button>

                <Button variant="outline">
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Abrir em IFrame
                </Button>

                <Button variant="outline">
                  <BeakerIcon className="h-4 w-4 mr-2" />
                  Adicionar aos Favoritos
                </Button>
              </div>

              {/* IFrame Preview (opcional) */}
              <div className="mt-4 border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Preview: {selectedInterface.name}</span>
                  <Button size="sm" variant="ghost">
                    <ExternalLinkIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-gray-50 p-8 text-center text-gray-500">
                  <BeakerIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Preview da interface científica</p>
                  <p className="text-xs">Clique em "Abrir em IFrame" para visualizar</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            Navegação completa por todas as 41 interfaces disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">Análise</TabsTrigger>
              <TabsTrigger value="monitoring">Monitorização</TabsTrigger>
              <TabsTrigger value="spatial">Espacial</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
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

      {/* Links Externos Importantes */}
      <Card>
        <CardHeader>
          <CardTitle>🌐 Serviços Externos BGAPP</CardTitle>
          <CardDescription>
            Acesso direto aos serviços externos do ecossistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-16 justify-start"
              onClick={() => window.open(getExternalServiceUrl('stacBrowser'), '_blank')}
            >
              <CloudArrowUpIcon className="h-6 w-6 mr-3 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">STAC Browser</div>
                <div className="text-xs text-gray-500">Navegador de catálogo</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-16 justify-start"
              onClick={() => window.open(getExternalServiceUrl('flowerMonitor'), '_blank')}
            >
              <div className="h-6 w-6 mr-3 text-green-600 flex items-center justify-center">🖥️</div>
              <div className="text-left">
                <div className="font-medium">Flower Monitor</div>
                <div className="text-xs text-gray-500">Monitor Celery</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-16 justify-start"
              onClick={() => window.open(getExternalServiceUrl('minioConsole'), '_blank')}
            >
              <CloudArrowUpIcon className="h-6 w-6 mr-3 text-purple-600" />
              <div className="text-left">
                <div className="font-medium">MinIO Console</div>
                <div className="text-xs text-gray-500">Gestão de armazenamento</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status de Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ExternalLinkIcon className="h-5 w-5 text-red-600" />
              <span className="text-red-800">
                Erro ao carregar interfaces científicas: {error.message}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
