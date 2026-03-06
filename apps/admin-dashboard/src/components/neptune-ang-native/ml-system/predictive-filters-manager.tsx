'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BeakerIcon,
  MapIcon,
  EyeIcon,
  ShieldCheckIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { bgappAPI, PredictiveFilter } from '@/lib/bgapp/bgapp-api';
import { useMLData } from '@/lib/bgapp/hooks';

/**
 * 🎯 PREDICTIVE FILTERS MANAGER - Silicon Valley Grade A+
 * Gestor completo dos 7 tipos de filtros preditivos BGAPP
 */

export default function PredictiveFiltersManager() {
  const {
    data: filters,
    isLoading,
    error,
    isUsingFallback,
    refetch
  } = useMLData('predictive-filters', () => bgappAPI.getPredictiveFilters());

  const [activatingFilter, setActivatingFilter] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<PredictiveFilter | null>(null);

  const handleToggleFilter = async (filterId: string, currentStatus: boolean) => {
    try {
      setActivatingFilter(filterId);
      
      if (!currentStatus) {
        await bgappAPI.activatePredictiveFilter(filterId);
      }
      
      // Simular delay e atualizar
      setTimeout(() => {
        refetch();
        setActivatingFilter(null);
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao alterar filtro:', error);
      setActivatingFilter(null);
    }
  };

  const getFilterIcon = (type: string) => {
    switch (type) {
      case 'biodiversity_hotspots': return BeakerIcon;
      case 'species_presence': return EyeIcon;
      case 'habitat_suitability': return MapIcon;
      case 'conservation_priority': return ShieldCheckIcon;
      case 'fishing_zones': return MapIcon;
      case 'monitoring_points': return BoltIcon;
      case 'environmental_risk': return ExclamationTriangleIcon;
      default: return BeakerIcon;
    }
  };

  const getFilterColor = (type: string, isActive: boolean) => {
    if (!isActive) return 'text-gray-400 bg-gray-50';
    
    switch (type) {
      case 'biodiversity_hotspots': return 'text-green-600 bg-green-50';
      case 'species_presence': return 'text-blue-600 bg-blue-50';
      case 'habitat_suitability': return 'text-purple-600 bg-purple-50';
      case 'conservation_priority': return 'text-emerald-600 bg-emerald-50';
      case 'fishing_zones': return 'text-orange-600 bg-orange-50';
      case 'monitoring_points': return 'text-cyan-600 bg-cyan-50';
      case 'environmental_risk': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-blue-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(7)].map((_, i) => (
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
            🎯 Filtros Preditivos BGAPP
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            7 tipos de filtros preditivos com IA - {filters?.filter(f => f.isActive).length || 0} ativos
          </p>
          {isUsingFallback && (
            <div className="flex items-center gap-2 mt-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-600">Usando dados de fallback</span>
            </div>
          )}
        </div>
        <Button onClick={refetch} disabled={isLoading}>
          Atualizar Filtros
        </Button>
      </div>

      {/* Estatísticas dos Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtros Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {filters?.filter(f => f.isActive).length || 0}
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
                <p className="text-sm text-gray-600">Confiança Média</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filters ? `${(filters.reduce((acc, f) => acc + f.confidence, 0) / filters.length).toFixed(1)}%` : '0%'}
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
                <p className="text-sm text-gray-600">Total Filtros</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filters?.length || 0}
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
                <p className="text-sm text-gray-600">Última Atualização</p>
                <p className="text-sm font-medium">
                  {filters?.[0] ? new Date(filters[0].lastUpdated).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <BoltIcon className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Filtros Preditivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filters?.map((filter) => {
          const FilterIcon = getFilterIcon(filter.type);
          const isCurrentlyActivating = activatingFilter === filter.id;

          return (
            <Card 
              key={filter.id}
              className={`hover:shadow-lg transition-all cursor-pointer ${
                filter.isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
              }`}
              onClick={() => setSelectedFilter(filter)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FilterIcon className={`h-5 w-5 ${filter.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="font-medium">{filter.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getFilterColor(filter.type, filter.isActive)}>
                      {filter.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {filter.description}
                  </p>

                  {/* Confiança */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confiança:</span>
                    <span className={`font-bold ${getConfidenceColor(filter.confidence)}`}>
                      {filter.confidence.toFixed(1)}%
                    </span>
                  </div>

                  {/* Última Atualização */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Atualizado:</span>
                    <span className="text-sm font-medium">
                      {new Date(filter.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Controles */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant={filter.isActive ? "destructive" : "default"}
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFilter(filter.id, filter.isActive);
                      }}
                      disabled={isCurrentlyActivating}
                    >
                      {isCurrentlyActivating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : filter.isActive ? (
                        <XCircleIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                      )}
                      {filter.isActive ? 'Desativar' : 'Ativar'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implementar visualização no mapa
                      }}
                    >
                      <MapIcon className="h-4 w-4 mr-1" />
                      Ver no Mapa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detalhes do Filtro Selecionado */}
      {selectedFilter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(getFilterIcon(selectedFilter.type), { className: "h-6 w-6" })}
              Detalhes: {selectedFilter.name}
            </CardTitle>
            <CardDescription>
              Configurações e parâmetros do filtro preditivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações do Filtro */}
              <div>
                <h4 className="font-semibold mb-3">Informações do Filtro</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">{selectedFilter.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${selectedFilter.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedFilter.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confiança:</span>
                    <span className={`font-medium ${getConfidenceColor(selectedFilter.confidence)}`}>
                      {selectedFilter.confidence.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Última Atualização:</span>
                    <span className="font-medium">
                      {new Date(selectedFilter.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parâmetros */}
              <div>
                <h4 className="font-semibold mb-3">Parâmetros de Configuração</h4>
                <div className="space-y-2">
                  {Object.entries(selectedFilter.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium font-mono text-xs">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ações do Filtro */}
            <div className="mt-6 flex gap-3">
              <Button
                variant={selectedFilter.isActive ? "destructive" : "default"}
                onClick={() => handleToggleFilter(selectedFilter.id, selectedFilter.isActive)}
                disabled={activatingFilter === selectedFilter.id}
              >
                {activatingFilter === selectedFilter.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : selectedFilter.isActive ? (
                  'Desativar Filtro'
                ) : (
                  'Ativar Filtro'
                )}
              </Button>

              <Button variant="outline">
                <MapIcon className="h-4 w-4 mr-2" />
                Visualizar no Mapa
              </Button>

              <Button variant="outline">
                <BoltIcon className="h-4 w-4 mr-2" />
                Configurar Parâmetros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guia de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Guia dos Filtros Preditivos</CardTitle>
          <CardDescription>
            Descrição detalhada de cada tipo de filtro disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <BeakerIcon className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Hotspots de Biodiversidade</h4>
                  <p className="text-sm text-gray-600">Identificação automática de áreas com alta diversidade de espécies usando algoritmos de clustering espacial.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <EyeIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Predição de Presença de Espécies</h4>
                  <p className="text-sm text-gray-600">Previsão de locais prováveis para encontrar espécies específicas baseado em condições ambientais.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Adequação de Habitat</h4>
                  <p className="text-sm text-gray-600">Avaliação da adequação de habitats para diferentes espécies usando modelos MaxEnt.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Áreas de Conservação Prioritárias</h4>
                  <p className="text-sm text-gray-600">Identificação de áreas críticas para conservação marinha baseado em critérios científicos.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapIcon className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Zonas de Pesca Otimizadas</h4>
                  <p className="text-sm text-gray-600">Recomendação de zonas de pesca baseada em dados ambientais e padrões históricos.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <BoltIcon className="h-5 w-5 text-cyan-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Pontos de Monitorização Inteligentes</h4>
                  <p className="text-sm text-gray-600">Sugestão de locais ótimos para estações de monitorização ambiental.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Áreas de Risco Ambiental</h4>
                  <p className="text-sm text-gray-600">Identificação de zonas com risco ambiental elevado devido a fatores antropogênicos.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status de Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <span className="text-red-800">
                Erro ao carregar filtros preditivos: {error.message}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
