'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { bgappApi } from '@/lib/api-complete';

/**
 * 🧠 ML Predictive Filters Component
 * Sistema de Filtros Preditivos baseado em Machine Learning
 * Mr Silicon Valley Edition - Integração Completa
 */

interface PredictiveFilter {
  filter_id: string;
  name: string;
  filter_type: string;
  description: string;
  model_id: string;
  min_confidence: number;
  is_active: boolean;
  created_at: string;
  last_updated: string;
  prediction_count: number;
  avg_confidence: number;
}

interface PredictivePoint {
  point_id: string;
  latitude: number;
  longitude: number;
  prediction_value: any;
  confidence: number;
  model_type: string;
  area_name?: string;
  habitat_type?: string;
  predicted_at: string;
  marker_color: string;
  marker_size: number;
}

interface MLStats {
  total_filters: number;
  active_filters: number;
  total_predictions: number;
  avg_confidence: number;
  models_running: number;
  last_prediction: string;
}

const FILTER_TYPES = {
  biodiversity_hotspots: {
    name: '🌿 Hotspots de Biodiversidade',
    color: 'bg-green-500',
    icon: '🌿'
  },
  species_presence: {
    name: '🐟 Presença de Espécies',
    color: 'bg-blue-500',
    icon: '🐟'
  },
  habitat_suitability: {
    name: '🏞️ Adequação de Habitat',
    color: 'bg-emerald-500',
    icon: '🏞️'
  },
  conservation_priority: {
    name: '🛡️ Áreas de Conservação',
    color: 'bg-purple-500',
    icon: '🛡️'
  },
  fishing_zones: {
    name: '🎣 Zonas de Pesca',
    color: 'bg-orange-500',
    icon: '🎣'
  },
  monitoring_points: {
    name: '📍 Pontos de Monitorização',
    color: 'bg-yellow-500',
    icon: '📍'
  },
  risk_areas: {
    name: '⚠️ Áreas de Risco',
    color: 'bg-red-500',
    icon: '⚠️'
  }
};

export default function MLPredictiveFilters() {
  const [filters, setFilters] = useState<PredictiveFilter[]>([]);
  const [points, setPoints] = useState<PredictivePoint[]>([]);
  const [stats, setStats] = useState<MLStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fetch all ML data
  const fetchMLData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch filters, points and stats in parallel
      const [filtersData, statsData] = await Promise.all([
        // Mock API calls - replace with actual bgappApi calls when endpoints are ready
        Promise.resolve([
          {
            filter_id: 'biodiv_001',
            name: 'Hotspots Biodiversidade ZEE Angola',
            filter_type: 'biodiversity_hotspots',
            description: 'Identificação de áreas com alta diversidade de espécies marinhas',
            model_id: 'maxent_biodiv_v2.1',
            min_confidence: 0.75,
            is_active: true,
            created_at: '2025-01-10T10:00:00Z',
            last_updated: '2025-01-10T14:30:00Z',
            prediction_count: 1247,
            avg_confidence: 0.82
          },
          {
            filter_id: 'species_002',
            name: 'Predição Presença Espécies Endémicas',
            filter_type: 'species_presence',
            description: 'Predição de presença de espécies endémicas angolanas',
            model_id: 'species_presence_v1.8',
            min_confidence: 0.70,
            is_active: true,
            created_at: '2025-01-10T09:15:00Z',
            last_updated: '2025-01-10T14:45:00Z',
            prediction_count: 892,
            avg_confidence: 0.78
          },
          {
            filter_id: 'habitat_003',
            name: 'Adequação Habitat Corais',
            filter_type: 'habitat_suitability',
            description: 'Análise de adequação de habitat para recifes de coral',
            model_id: 'habitat_coral_v1.5',
            min_confidence: 0.65,
            is_active: true,
            created_at: '2025-01-10T08:30:00Z',
            last_updated: '2025-01-10T13:20:00Z',
            prediction_count: 634,
            avg_confidence: 0.71
          },
          {
            filter_id: 'conservation_004',
            name: 'Prioridades de Conservação',
            filter_type: 'conservation_priority',
            description: 'Áreas prioritárias para conservação marinha',
            model_id: 'conservation_mcda_v2.0',
            min_confidence: 0.80,
            is_active: false,
            created_at: '2025-01-09T16:00:00Z',
            last_updated: '2025-01-10T12:00:00Z',
            prediction_count: 445,
            avg_confidence: 0.85
          },
          {
            filter_id: 'fishing_005',
            name: 'Zonas Pesca Sustentável',
            filter_type: 'fishing_zones',
            description: 'Identificação de zonas de pesca sustentável',
            model_id: 'fishing_sustainability_v1.3',
            min_confidence: 0.70,
            is_active: true,
            created_at: '2025-01-10T07:45:00Z',
            last_updated: '2025-01-10T14:15:00Z',
            prediction_count: 1089,
            avg_confidence: 0.76
          },
          {
            filter_id: 'monitoring_006',
            name: 'Pontos Monitorização Inteligente',
            filter_type: 'monitoring_points',
            description: 'Pontos otimizados para monitorização ambiental',
            model_id: 'monitoring_optimization_v1.1',
            min_confidence: 0.75,
            is_active: true,
            created_at: '2025-01-10T11:20:00Z',
            last_updated: '2025-01-10T14:50:00Z',
            prediction_count: 267,
            avg_confidence: 0.81
          },
          {
            filter_id: 'risk_007',
            name: 'Áreas de Risco Ambiental',
            filter_type: 'risk_areas',
            description: 'Identificação de áreas com risco ambiental elevado',
            model_id: 'environmental_risk_v2.2',
            min_confidence: 0.85,
            is_active: true,
            created_at: '2025-01-10T06:30:00Z',
            last_updated: '2025-01-10T13:45:00Z',
            prediction_count: 156,
            avg_confidence: 0.89
          }
        ] as PredictiveFilter[]),
        Promise.resolve({
          total_filters: 7,
          active_filters: 6,
          total_predictions: 4730,
          avg_confidence: 0.79,
          models_running: 6,
          last_prediction: '2025-01-10T14:50:00Z'
        } as MLStats)
      ]);

      setFilters(filtersData);
      setStats(statsData);

    } catch (err) {
      // console.error('Error fetching ML data:', err);
      setError('Erro ao carregar dados de Machine Learning');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh specific filter
  const refreshFilter = async (filterId: string) => {
    try {
      setRefreshing(true);
      // Mock refresh - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update filter data
      setFilters(prev => prev.map(filter => 
        filter.filter_id === filterId 
          ? { ...filter, last_updated: new Date().toISOString() }
          : filter
      ));
      
    } catch (err) {
      // console.error('Error refreshing filter:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Toggle filter active state
  const toggleFilter = async (filterId: string) => {
    try {
      setFilters(prev => prev.map(filter => 
        filter.filter_id === filterId 
          ? { ...filter, is_active: !filter.is_active }
          : filter
      ));
    } catch (err) {
      // console.error('Error toggling filter:', err);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchMLData();
      
      // Auto-refresh every 2 minutes
      const interval = setInterval(fetchMLData, 120000);
      return () => clearInterval(interval);
    }
  }, [mounted, fetchMLData]);

  // Prevent hydration mismatch - wait for client mount
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">❌ Erro de Conexão ML</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchMLData} variant="outline" className="text-red-600 border-red-300">
            🔄 Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">🧠 Machine Learning - Filtros Preditivos</h1>
        <p className="text-purple-100 mt-2">
          Sistema avançado de predições baseado em IA para ZEE Angola
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Badge className="bg-green-500">
            ✅ {stats?.active_filters}/{stats?.total_filters} Filtros Ativos
          </Badge>
          <Badge className="bg-blue-500">
            🎯 {stats?.total_predictions.toLocaleString()} Predições
          </Badge>
          <Badge className="bg-yellow-500">
            📊 {Math.round((stats?.avg_confidence || 0) * 100)}% Confiança Média
          </Badge>
          <Button 
            onClick={fetchMLData} 
            size="sm" 
            variant="secondary"
            className="ml-auto"
            disabled={loading}
          >
            🔄 Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_filters}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_filters} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Predições Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_predictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              em tempo real
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round((stats?.avg_confidence || 0) * 100)}%</div>
            <p className="text-xs text-muted-foreground">
              qualidade alta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Modelos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.models_running}</div>
            <p className="text-xs text-muted-foreground">
              processando
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filters.map((filter) => {
          const filterType = FILTER_TYPES[filter.filter_type as keyof typeof FILTER_TYPES];
          
          return (
            <Card key={filter.filter_id} className={`${filter.is_active ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/30'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{filterType?.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{filter.name}</CardTitle>
                      <CardDescription>{filter.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={filter.is_active ? "default" : "secondary"}>
                      {filter.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Predições</div>
                    <div className="text-lg font-semibold">{filter.prediction_count.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Confiança Média</div>
                    <div className="text-lg font-semibold">{Math.round(filter.avg_confidence * 100)}%</div>
                  </div>
                </div>

                {/* Model Info */}
                <div className="bg-white/50 p-3 rounded border">
                  <div className="text-xs text-muted-foreground">Modelo</div>
                  <div className="font-mono text-sm">{filter.model_id}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Confiança mínima: {Math.round(filter.min_confidence * 100)}%
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={filter.is_active ? "outline" : "default"}
                    onClick={() => toggleFilter(filter.filter_id)}
                  >
                    {filter.is_active ? "🔴 Desativar" : "🟢 Ativar"}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refreshFilter(filter.filter_id)}
                    disabled={refreshing}
                  >
                    {refreshing ? "⏳" : "🔄"} Atualizar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFilter(filter.filter_id)}
                  >
                    🗺️ Ver no Mapa
                  </Button>
                </div>

                {/* Last Updated */}
                <div className="text-xs text-muted-foreground">
                  Última atualização: {new Date(filter.last_updated).toLocaleString('pt-PT')}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">🤖 Sistema de IA Ativo</h3>
              <p className="text-blue-700 text-sm mt-1">
                Modelos de Machine Learning processando dados em tempo real da ZEE Angola
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600">Última predição</div>
              <div className="font-mono text-sm text-blue-800">
                {stats?.last_prediction ? new Date(stats.last_prediction).toLocaleString('pt-PT') : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
