'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { bgappApi } from '@/lib/api-complete';
import SpatialMapModal from './spatial-map-modal';

/**
 * 🗺️ QGIS Spatial Analysis Component
 * Análise Espacial Avançada para ZEE Angola
 * Mr Silicon Valley Edition - Integração Completa
 */

interface SpatialRegion {
  name: string;
  geometry: any;
  properties: Record<string, any>;
  crs: string;
  area_km2?: number;
  perimeter_km?: number;
}

interface BufferZone {
  source_name: string;
  buffer_distance: number;
  zone_type: string;
  area_km2: number;
  properties: Record<string, any>;
}

interface ConnectivityResult {
  source_habitat: string;
  target_habitat: string;
  connectivity_index: number;
  corridor_length_km: number;
  barrier_count: number;
  quality_score: number;
}

interface HotspotAnalysis {
  hotspot_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  hotspot_type: string;
  intensity_score: number;
  confidence_level: number;
  area_influence_km2: number;
}

interface SpatialStats {
  total_regions: number;
  total_buffer_zones: number;
  hotspots_identified: number;
  corridors_analyzed: number;
  connectivity_index: number;
  last_analysis: string;
}

const ANALYSIS_TYPES = {
  buffer: {
    name: '🔵 Zonas Buffer',
    description: 'Criação de zonas buffer ao redor de features',
    icon: '🔵'
  },
  connectivity: {
    name: '🔗 Conectividade de Habitats',
    description: 'Análise de conectividade entre habitats marinhos',
    icon: '🔗'
  },
  hotspots: {
    name: '🔥 Identificação de Hotspots',
    description: 'Hotspots de biodiversidade (Getis-Ord Gi*)',
    icon: '🔥'
  },
  corridors: {
    name: '🌊 Corredores Ecológicos',
    description: 'Corredores ecológicos least-cost path',
    icon: '🌊'
  },
  mcda: {
    name: '🎯 Análise Multi-Critério',
    description: 'MCDA/AHP para ordenamento espacial',
    icon: '🎯'
  },
  proximity: {
    name: '📍 Análise de Proximidade',
    description: 'Análise de proximidade espacial',
    icon: '📍'
  }
};

const ZONE_TYPES = {
  exclusion: { name: 'Zona de Exclusão', color: 'bg-red-500', icon: '🚫' },
  protection: { name: 'Zona de Proteção', color: 'bg-green-500', icon: '🛡️' },
  monitoring: { name: 'Zona de Monitorização', color: 'bg-blue-500', icon: '👁️' },
  fishing: { name: 'Zona de Pesca', color: 'bg-orange-500', icon: '🎣' },
  conservation: { name: 'Zona de Conservação', color: 'bg-purple-500', icon: '🌿' }
};

const HOTSPOT_TYPES = {
  biodiversity: { name: 'Biodiversidade', color: 'bg-green-600', icon: '🌿' },
  fishing: { name: 'Atividade Pesqueira', color: 'bg-blue-600', icon: '🎣' },
  pollution: { name: 'Poluição', color: 'bg-red-600', icon: '⚠️' },
  migration: { name: 'Migração', color: 'bg-purple-600', icon: '🐋' },
  spawning: { name: 'Desova', color: 'bg-yellow-600', icon: '🥚' }
};

export default function QGISSpatialAnalysis() {
  const [bufferZones, setBufferZones] = useState<BufferZone[]>([]);
  const [connectivity, setConnectivity] = useState<ConnectivityResult[]>([]);
  const [hotspots, setHotspots] = useState<HotspotAnalysis[]>([]);
  const [stats, setStats] = useState<SpatialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<string>('buffer');
  const [processing, setProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mapModal, setMapModal] = useState<{
    isOpen: boolean;
    data?: {
      type: 'buffer' | 'hotspot' | 'connectivity';
      name: string;
      coordinates?: [number, number];
      properties?: Record<string, any>;
    };
  }>({ isOpen: false });

  // Fetch spatial analysis data
  const fetchSpatialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data - replace with actual bgappApi calls
      const [bufferData, connectivityData, hotspotsData, statsData] = await Promise.all([
        // Buffer Zones
        Promise.resolve([
          {
            source_name: 'Área Marinha Protegida Iona',
            buffer_distance: 5000,
            zone_type: 'protection',
            area_km2: 78.5,
            properties: {
              protection_level: 'high',
              established: '2019',
              species_protected: ['Tartaruga marinha', 'Baleia jubarte']
            }
          },
          {
            source_name: 'Porto de Luanda',
            buffer_distance: 10000,
            zone_type: 'exclusion',
            area_km2: 314.2,
            properties: {
              restriction_type: 'navigation',
              vessel_types: ['commercial', 'fishing'],
              active_since: '2020'
            }
          },
          {
            source_name: 'Recife de Coral Cabinda',
            buffer_distance: 3000,
            zone_type: 'conservation',
            area_km2: 28.3,
            properties: {
              coral_coverage: '85%',
              biodiversity_index: 0.92,
              monitoring_frequency: 'monthly'
            }
          }
        ] as BufferZone[]),

        // Connectivity Analysis
        Promise.resolve([
          {
            source_habitat: 'Recifes de Coral Norte',
            target_habitat: 'Recifes de Coral Sul',
            connectivity_index: 0.78,
            corridor_length_km: 245.6,
            barrier_count: 3,
            quality_score: 0.82
          },
          {
            source_habitat: 'Mangal Kwanza',
            target_habitat: 'Mangal Bengo',
            connectivity_index: 0.65,
            corridor_length_km: 89.3,
            barrier_count: 1,
            quality_score: 0.71
          },
          {
            source_habitat: 'Pradaria Marinha Luanda',
            target_habitat: 'Pradaria Marinha Benguela',
            connectivity_index: 0.43,
            corridor_length_km: 456.7,
            barrier_count: 7,
            quality_score: 0.38
          }
        ] as ConnectivityResult[]),

        // Hotspots Analysis
        Promise.resolve([
          {
            hotspot_id: 'hs_001',
            location_name: 'Costa Norte Cabinda',
            latitude: -5.12,
            longitude: 12.34,
            hotspot_type: 'biodiversity',
            intensity_score: 0.89,
            confidence_level: 0.95,
            area_influence_km2: 156.7
          },
          {
            hotspot_id: 'hs_002',
            location_name: 'Banco de Benguela',
            latitude: -12.45,
            longitude: 13.67,
            hotspot_type: 'fishing',
            intensity_score: 0.76,
            confidence_level: 0.88,
            area_influence_km2: 289.4
          },
          {
            hotspot_id: 'hs_003',
            location_name: 'Estuário do Kwanza',
            latitude: -9.23,
            longitude: 13.12,
            hotspot_type: 'spawning',
            intensity_score: 0.83,
            confidence_level: 0.91,
            area_influence_km2: 67.8
          },
          {
            hotspot_id: 'hs_004',
            location_name: 'Corredor Migratório Central',
            latitude: -11.78,
            longitude: 13.89,
            hotspot_type: 'migration',
            intensity_score: 0.72,
            confidence_level: 0.84,
            area_influence_km2: 445.2
          }
        ] as HotspotAnalysis[]),

        // Stats
        Promise.resolve({
          total_regions: 47,
          total_buffer_zones: 23,
          hotspots_identified: 18,
          corridors_analyzed: 12,
          connectivity_index: 0.67,
          last_analysis: '2025-01-10T15:30:00Z'
        } as SpatialStats)
      ]);

      setBufferZones(bufferData);
      setConnectivity(connectivityData);
      setHotspots(hotspotsData);
      setStats(statsData);

    } catch (err) {
      // console.error('Error fetching spatial data:', err);
      setError('Erro ao carregar dados de análise espacial');
    } finally {
      setLoading(false);
    }
  }, []);

  // Run new spatial analysis
  const runAnalysis = async (analysisType: string) => {
    try {
      setProcessing(true);
      // Mock processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refresh data after analysis
      await fetchSpatialData();
      
    } catch (err) {
      // console.error('Error running analysis:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Open map modal with specific data
  const openMapModal = (type: 'buffer' | 'hotspot' | 'connectivity', name: string, properties?: Record<string, any>) => {
    setMapModal({
      isOpen: true,
      data: {
        type,
        name,
        properties
      }
    });
  };

  // Close map modal
  const closeMapModal = () => {
    setMapModal({ isOpen: false });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchSpatialData();
      
      // Auto-refresh every 5 minutes
      const interval = setInterval(fetchSpatialData, 300000);
      return () => clearInterval(interval);
    }
  }, [mounted, fetchSpatialData]);

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
          <CardTitle className="text-red-800">❌ Erro de Análise Espacial</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchSpatialData} variant="outline" className="text-red-600 border-red-300">
            🔄 Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">🗺️ QGIS - Análise Espacial Avançada</h1>
        <p className="text-green-100 mt-2">
          Ferramentas de análise espacial para ordenamento marinho da ZEE Angola
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Badge className="bg-green-500">
            ✅ {stats?.total_regions} Regiões Analisadas
          </Badge>
          <Badge className="bg-blue-500">
            🔵 {stats?.total_buffer_zones} Zonas Buffer
          </Badge>
          <Badge className="bg-yellow-500">
            🔥 {stats?.hotspots_identified} Hotspots
          </Badge>
          <Badge className="bg-purple-500">
            📊 {Math.round((stats?.connectivity_index || 0) * 100)}% Conectividade
          </Badge>
          <Button 
            onClick={fetchSpatialData} 
            size="sm" 
            variant="secondary"
            className="ml-auto"
            disabled={loading}
          >
            🔄 Atualizar
          </Button>
        </div>
      </div>

      {/* Analysis Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(ANALYSIS_TYPES).map(([key, analysis]) => (
          <Button
            key={key}
            variant={activeAnalysis === key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveAnalysis(key)}
            className="h-auto p-3 flex flex-col items-center gap-2"
          >
            <span className="text-lg">{analysis.icon}</span>
            <span className="text-xs text-center">{analysis.name.replace(/🔵|🔗|🔥|🌊|🎯|📍 /, '')}</span>
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Regiões Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_regions}</div>
            <p className="text-xs text-muted-foreground">analisadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Zonas Buffer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_buffer_zones}</div>
            <p className="text-xs text-muted-foreground">ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Hotspots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.hotspots_identified}</div>
            <p className="text-xs text-muted-foreground">identificados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Corredores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.corridors_analyzed}</div>
            <p className="text-xs text-muted-foreground">analisados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Conectividade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round((stats?.connectivity_index || 0) * 100)}%</div>
            <p className="text-xs text-muted-foreground">índice geral</p>
          </CardContent>
        </Card>
      </div>

      {/* Content based on active analysis */}
      {activeAnalysis === 'buffer' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">🔵 Zonas Buffer Ativas</h2>
            <Button
              onClick={() => runAnalysis('buffer')}
              disabled={processing}
              variant="outline"
            >
              {processing ? "⏳ Processando..." : "🔄 Nova Análise"}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {bufferZones.map((zone, index) => {
              const zoneType = ZONE_TYPES[zone.zone_type as keyof typeof ZONE_TYPES];
              
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{zoneType?.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{zone.source_name}</CardTitle>
                        <CardDescription>{zoneType?.name}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Distância Buffer</div>
                        <div className="font-semibold">{(zone.buffer_distance / 1000).toFixed(1)} km</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Área Total</div>
                        <div className="font-semibold">{zone.area_km2.toFixed(1)} km²</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-muted-foreground mb-2">Propriedades</div>
                      {Object.entries(zone.properties).slice(0, 2).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="capitalize">{key.replace('_', ' ')}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => openMapModal('buffer', zone.source_name, zone.properties)}
                    >
                      🗺️ Ver no Mapa
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeAnalysis === 'connectivity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">🔗 Análise de Conectividade</h2>
            <Button
              onClick={() => runAnalysis('connectivity')}
              disabled={processing}
              variant="outline"
            >
              {processing ? "⏳ Processando..." : "🔄 Nova Análise"}
            </Button>
          </div>
          
          <div className="space-y-4">
            {connectivity.map((conn, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{conn.source_habitat} ↔ {conn.target_habitat}</h3>
                      <p className="text-sm text-muted-foreground">
                        Corredor de {conn.corridor_length_km.toFixed(1)} km
                      </p>
                    </div>
                    <Badge variant={conn.connectivity_index > 0.7 ? "default" : conn.connectivity_index > 0.5 ? "secondary" : "destructive"}>
                      {Math.round(conn.connectivity_index * 100)}% Conectividade
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Índice</div>
                      <div className="font-semibold">{conn.connectivity_index.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Qualidade</div>
                      <div className="font-semibold">{Math.round(conn.quality_score * 100)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Barreiras</div>
                      <div className="font-semibold">{conn.barrier_count}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Distância</div>
                      <div className="font-semibold">{conn.corridor_length_km.toFixed(1)} km</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeAnalysis === 'hotspots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">🔥 Hotspots Identificados</h2>
            <Button
              onClick={() => runAnalysis('hotspots')}
              disabled={processing}
              variant="outline"
            >
              {processing ? "⏳ Processando..." : "🔄 Nova Análise"}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {hotspots.map((hotspot) => {
              const hotspotType = HOTSPOT_TYPES[hotspot.hotspot_type as keyof typeof HOTSPOT_TYPES];
              
              return (
                <Card key={hotspot.hotspot_id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{hotspotType?.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{hotspot.location_name}</CardTitle>
                        <CardDescription>{hotspotType?.name}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Intensidade</div>
                        <div className="font-semibold">{Math.round(hotspot.intensity_score * 100)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Confiança</div>
                        <div className="font-semibold">{Math.round(hotspot.confidence_level * 100)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Área Influência</div>
                        <div className="font-semibold">{hotspot.area_influence_km2.toFixed(1)} km²</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Coordenadas</div>
                        <div className="font-mono text-xs">
                          {hotspot.latitude.toFixed(2)}, {hotspot.longitude.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => openMapModal('hotspot', hotspot.location_name, {
                          hotspot_type: hotspot.hotspot_type,
                          intensity_score: hotspot.intensity_score,
                          confidence_level: hotspot.confidence_level,
                          area_influence_km2: hotspot.area_influence_km2,
                          coordinates: [hotspot.latitude, hotspot.longitude]
                        })}
                      >
                        🗺️ Ver no Mapa
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        📊 Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">🗺️ Sistema QGIS Ativo</h3>
              <p className="text-green-700 text-sm mt-1">
                Análises espaciais avançadas para ordenamento marinho da ZEE Angola
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-600">Última análise</div>
              <div className="font-mono text-sm text-green-800">
                {stats?.last_analysis ? new Date(stats.last_analysis).toLocaleString('pt-PT') : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Mapa Interativo */}
      <SpatialMapModal
        isOpen={mapModal.isOpen}
        onClose={closeMapModal}
        data={mapModal.data}
      />
    </div>
  );
}
