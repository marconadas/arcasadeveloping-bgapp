'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getServiceUrl } from '@/lib/environment-urls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapIcon,
  ChartBarIcon,
  BeakerIcon,
  ShieldCheckIcon,
  EyeIcon,
  BoltIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { bgappAPI, QGISAnalysis } from '@/lib/bgapp/bgapp-api';
import { useQGISData } from '@/lib/bgapp/hooks';

/**
 * 🗺️ QGIS ADVANCED PANEL - Silicon Valley Grade A+
 * Painel completo para ferramentas QGIS avançadas com 25+ endpoints
 */

export default function QGISAdvancedPanel() {
  const {
    data: analyses,
    isLoading: analysesLoading,
    error: analysesError,
    isUsingFallback: analysesUsingFallback,
    refetch: refetchAnalyses
  } = useQGISData('analyses', () => bgappAPI.getQGISAnalyses());

  const {
    data: spatialData,
    isLoading: spatialLoading,
    refetch: refetchSpatial
  } = useQGISData('spatial-analysis', () => bgappAPI.getQGISSpatialAnalysis());

  const {
    data: temporalData,
    isLoading: temporalLoading,
    refetch: refetchTemporal
  } = useQGISData('temporal-visualization', () => bgappAPI.getQGISTemporalVisualization());

  const {
    data: biomassData,
    isLoading: biomassLoading,
    refetch: refetchBiomass
  } = useQGISData('biomass-calculation', () => bgappAPI.getQGISBiomassCalculation());

  const [activeTab, setActiveTab] = useState('spatial');
  const [isCreatingAnalysis, setIsCreatingAnalysis] = useState(false);

  const handleCreateAnalysis = async (type: string, parameters: Record<string, any>) => {
    try {
      setIsCreatingAnalysis(true);
      await bgappAPI.createQGISAnalysis(type, parameters);
      
      setTimeout(() => {
        refetchAnalyses();
        setIsCreatingAnalysis(false);
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao criar análise QGIS:', error);
      setIsCreatingAnalysis(false);
    }
  };

  const getAnalysisStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'buffer': return ShieldCheckIcon;
      case 'connectivity': return BoltIcon;
      case 'hotspots': return BeakerIcon;
      case 'corridors': return MapIcon;
      case 'mcda': return ChartBarIcon;
      default: return MapIcon;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapIcon className="h-8 w-8 text-blue-600" />
            🗺️ QGIS Sistema Avançado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Ferramentas QGIS avançadas com 25+ endpoints - {analyses?.length || 0} análises disponíveis
          </p>
          {analysesUsingFallback && (
            <div className="flex items-center gap-2 mt-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-600">Usando dados de fallback</span>
            </div>
          )}
        </div>
        <Button onClick={refetchAnalyses} disabled={analysesLoading}>
          Atualizar Análises
        </Button>
      </div>

      {/* Estatísticas QGIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Análises Completas</p>
                <p className="text-2xl font-bold text-green-600">
                  {analyses?.filter(a => a.status === 'completed').length || 0}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Zonas Buffer</p>
                <p className="text-2xl font-bold text-blue-600">
                  {spatialData?.buffer_zones?.count || 0}
                </p>
              </div>
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hotspots Identificados</p>
                <p className="text-2xl font-bold text-purple-600">
                  {spatialData?.hotspots_identified || 0}
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
                <p className="text-sm text-gray-600">Corredores Ecológicos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {spatialData?.ecological_corridors || 0}
                </p>
              </div>
              <MapIcon className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs das Ferramentas QGIS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="spatial">Análise Espacial</TabsTrigger>
          <TabsTrigger value="temporal">Visualização Temporal</TabsTrigger>
          <TabsTrigger value="biomass">Calculadora Biomassa</TabsTrigger>
          <TabsTrigger value="analyses">Análises Recentes</TabsTrigger>
        </TabsList>

        {/* Tab: Análise Espacial */}
        <TabsContent value="spatial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="h-6 w-6" />
                Ferramentas de Análise Espacial
              </CardTitle>
              <CardDescription>
                Buffer zones, conectividade, hotspots e corredores ecológicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleCreateAnalysis('buffer', { buffer_distance: 5000 })}
                  disabled={isCreatingAnalysis}
                >
                  <ShieldCheckIcon className="h-6 w-6 mb-2" />
                  <span>Zonas Buffer</span>
                  <span className="text-xs text-gray-500">Criar zonas de proteção</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleCreateAnalysis('connectivity', { max_distance: 10000 })}
                  disabled={isCreatingAnalysis}
                >
                  <BoltIcon className="h-6 w-6 mb-2" />
                  <span>Conectividade</span>
                  <span className="text-xs text-gray-500">Análise de habitats</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleCreateAnalysis('hotspots', { analysis_type: 'getis_ord' })}
                  disabled={isCreatingAnalysis}
                >
                  <BeakerIcon className="h-6 w-6 mb-2" />
                  <span>Hotspots</span>
                  <span className="text-xs text-gray-500">Getis-Ord Gi*</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleCreateAnalysis('corridors', { algorithm: 'least_cost' })}
                  disabled={isCreatingAnalysis}
                >
                  <MapIcon className="h-6 w-6 mb-2" />
                  <span>Corredores</span>
                  <span className="text-xs text-gray-500">Least-cost path</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleCreateAnalysis('mcda', { method: 'ahp' })}
                  disabled={isCreatingAnalysis}
                >
                  <ChartBarIcon className="h-6 w-6 mb-2" />
                  <span>MCDA/AHP</span>
                  <span className="text-xs text-gray-500">Análise multicritério</span>
                </Button>
              </div>

              {/* Resultados da Análise Espacial */}
              {spatialData && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">Resultados da Análise Espacial</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Zonas Buffer:</span>
                      <span className="ml-2 font-medium">{spatialData.buffer_zones?.count || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Área Total:</span>
                      <span className="ml-2 font-medium">{spatialData.buffer_zones?.total_area || 0} km²</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Corredores:</span>
                      <span className="ml-2 font-medium">{spatialData.connectivity_analysis?.corridors || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Índice Conectividade:</span>
                      <span className="ml-2 font-medium">{spatialData.connectivity_analysis?.index || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Visualização Temporal */}
        <TabsContent value="temporal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-6 w-6" />
                Visualização Temporal
              </CardTitle>
              <CardDescription>
                Slider temporal, animações e análise de migração animal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {temporalData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Datasets Disponíveis</h4>
                      <div className="flex flex-wrap gap-2">
                        {temporalData.available_datasets?.map((dataset: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {dataset}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Período Temporal</h4>
                      <div className="text-sm">
                        <div>Início: {temporalData.time_range?.start}</div>
                        <div>Fim: {temporalData.time_range?.end}</div>
                        <div className="mt-2">
                          <Badge className={temporalData.animation_ready ? 'bg-green-600' : 'bg-red-600'}>
                            {temporalData.animation_ready ? 'Animação Pronta' : 'Preparando...'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <ChartBarIcon className="h-6 w-6 mb-2" />
                      <span>Slider NDVI</span>
                      <span className="text-xs text-gray-500">Vegetação temporal</span>
                    </Button>

                    <Button variant="outline" className="h-20 flex-col">
                      <BeakerIcon className="h-6 w-6 mb-2" />
                      <span>Slider Chl-a</span>
                      <span className="text-xs text-gray-500">Clorofila temporal</span>
                    </Button>

                    <Button variant="outline" className="h-20 flex-col">
                      <EyeIcon className="h-6 w-6 mb-2" />
                      <span>Migração Animal</span>
                      <span className="text-xs text-gray-500">Trajetórias GPS</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Calculadora Biomassa */}
        <TabsContent value="biomass" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BeakerIcon className="h-6 w-6" />
                Calculadora de Biomassa
              </CardTitle>
              <CardDescription>
                Biomassa terrestre e marinha com modelos científicos validados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {biomassData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-green-50 rounded-lg text-center">
                      <h4 className="font-semibold text-green-900 mb-2">Biomassa Terrestre</h4>
                      <div className="text-3xl font-bold text-green-600">
                        {biomassData.terrestrial_biomass?.total || 0}
                      </div>
                      <div className="text-sm text-green-700">
                        {biomassData.terrestrial_biomass?.unit || 'tons/km²'}
                      </div>
                    </div>

                    <div className="p-6 bg-blue-50 rounded-lg text-center">
                      <h4 className="font-semibold text-blue-900 mb-2">Biomassa Marinha</h4>
                      <div className="text-3xl font-bold text-blue-600">
                        {biomassData.marine_biomass?.total || 0}
                      </div>
                      <div className="text-sm text-blue-700">
                        {biomassData.marine_biomass?.unit || 'tons/km²'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <BeakerIcon className="h-6 w-6 mb-2" />
                      <span>NDVI → Biomassa</span>
                      <span className="text-xs text-gray-500">Vegetação terrestre</span>
                    </Button>

                    <Button variant="outline" className="h-20 flex-col">
                      <BoltIcon className="h-6 w-6 mb-2" />
                      <span>Chl-a → NPP → Peixes</span>
                      <span className="text-xs text-gray-500">Cadeia trófica marinha</span>
                    </Button>

                    <Button variant="outline" className="h-20 flex-col">
                      <ChartBarIcon className="h-6 w-6 mb-2" />
                      <span>Séries Temporais</span>
                      <span className="text-xs text-gray-500">Tendências biomassa</span>
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    Cálculo atualizado em: {biomassData.calculation_date ? new Date(biomassData.calculation_date).toLocaleString() : 'N/A'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Análises Recentes */}
        <TabsContent value="analyses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📊 Análises QGIS Recentes</CardTitle>
              <CardDescription>
                Histórico e status das análises espaciais executadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyses?.map((analysis) => {
                  const AnalysisIcon = getAnalysisIcon(analysis.type);

                  return (
                    <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AnalysisIcon className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">{analysis.name}</h4>
                          <p className="text-sm text-gray-600">
                            Criado: {new Date(analysis.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={getAnalysisStatusColor(analysis.status)}>
                          {analysis.status}
                        </Badge>
                        
                        {analysis.status === 'completed' && analysis.results && (
                          <div className="text-sm text-gray-600">
                            {Object.keys(analysis.results).length} resultados
                          </div>
                        )}

                        <Button size="sm" variant="outline">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {(!analyses || analyses.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma análise QGIS encontrada. Crie sua primeira análise usando as ferramentas acima.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Links Rápidos para Interfaces QGIS */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Acesso Rápido às Interfaces QGIS</CardTitle>
          <CardDescription>
            Links diretos para as interfaces QGIS especializadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-16 justify-start"
              onClick={() => window.open(`${getServiceUrl('frontend')}/qgis_dashboard.html`, '_blank')}
            >
              <MapIcon className="h-6 w-6 mr-3" />
              <div className="text-left">
                <div className="font-medium">QGIS Dashboard</div>
                <div className="text-xs text-gray-500">Interface principal QGIS</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-16 justify-start"
              onClick={() => window.open(`${getServiceUrl('frontend')}/qgis_fisheries.html`, '_blank')}
            >
              <BeakerIcon className="h-6 w-6 mr-3" />
              <div className="text-left">
                <div className="font-medium">QGIS Pescas</div>
                <div className="text-xs text-gray-500">Gestão recursos pesqueiros</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status de Erro */}
      {analysesError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <span className="text-red-800">
                Erro ao carregar análises QGIS: {analysesError.message}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
