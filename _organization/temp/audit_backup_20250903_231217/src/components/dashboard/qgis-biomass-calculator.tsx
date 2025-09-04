'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { bgappApi } from '@/lib/api-complete';

/**
 * 🌱 QGIS Biomass Calculator Component
 * Calculadora Avançada de Biomassa Terrestre e Marinha
 * Mr Silicon Valley Edition - Integração Completa
 */

interface BiomassResult {
  biomass_type: string;
  total_biomass: number; // toneladas
  biomass_density: number; // kg/m² ou kg/ha
  area_km2: number;
  calculation_method: string;
  confidence_level: number; // 0-1
  temporal_coverage: {
    start_date: string;
    end_date: string;
  };
  spatial_bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface BiomassTimeSeries {
  date: string;
  terrestrial_biomass: number;
  marine_phytoplankton: number;
  marine_fish: number;
  total_marine: number;
  ndvi_avg: number;
  chl_a_avg: number;
}

interface ZonalStats {
  zone_name: string;
  zone_type: string;
  area_km2: number;
  terrestrial_biomass_tons: number;
  marine_biomass_tons: number;
  biomass_density_kg_ha: number;
  vegetation_coverage: number;
  productivity_index: number;
}

interface BiomassStats {
  total_terrestrial_tons: number;
  total_marine_tons: number;
  total_combined_tons: number;
  avg_density_kg_ha: number;
  zones_analyzed: number;
  last_calculation: string;
}

const BIOMASS_TYPES = {
  terrestrial: {
    name: '🌿 Biomassa Terrestre',
    description: 'Biomassa vegetal via NDVI',
    icon: '🌿',
    color: 'bg-green-500'
  },
  marine_phytoplankton: {
    name: '🌊 Fitoplâncton Marinho',
    description: 'Biomassa via Chl-a → NPP',
    icon: '🌊',
    color: 'bg-blue-500'
  },
  marine_fish: {
    name: '🐟 Biomassa de Peixes',
    description: 'Transferência trófica marinha',
    icon: '🐟',
    color: 'bg-cyan-500'
  },
  agricultural: {
    name: '🌾 Biomassa Agrícola',
    description: 'Culturas e pastagens',
    icon: '🌾',
    color: 'bg-yellow-500'
  },
  forest: {
    name: '🌳 Biomassa Florestal',
    description: 'Florestas e mangais',
    icon: '🌳',
    color: 'bg-emerald-500'
  }
};

const CALCULATION_METHODS = {
  ndvi_regression: 'Regressão NDVI (Behrenfeld & Falkowski)',
  chl_to_npp: 'Chl-a → NPP → Biomassa',
  trophic_transfer: 'Transferência Trófica Marinha',
  allometric: 'Equações Alométricas',
  remote_sensing: 'Sensoriamento Remoto'
};

const VEGETATION_TYPES = {
  savanna: 'Savana Angolana',
  mangrove: 'Mangal',
  forest: 'Floresta Tropical',
  grassland: 'Pradaria',
  agricultural: 'Zona Agrícola',
  coastal: 'Vegetação Costeira'
};

export default function QGISBiomassCalculator() {
  const [biomassResults, setBiomassResults] = useState<BiomassResult[]>([]);
  const [timeSeries, setTimeSeries] = useState<BiomassTimeSeries[]>([]);
  const [zonalStats, setZonalStats] = useState<ZonalStats[]>([]);
  const [stats, setStats] = useState<BiomassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBiomassType, setSelectedBiomassType] = useState<string>('terrestrial');
  const [calculating, setCalculating] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [mounted, setMounted] = useState(false);

  // Fetch biomass data
  const fetchBiomassData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data - replace with actual bgappApi calls
      const [resultsData, timeSeriesData, zonalData, statsData] = await Promise.all([
        // Biomass Results
        Promise.resolve([
          {
            biomass_type: 'terrestrial',
            total_biomass: 45678900, // tons
            biomass_density: 12.5, // kg/ha
            area_km2: 124700,
            calculation_method: 'ndvi_regression',
            confidence_level: 0.82,
            temporal_coverage: {
              start_date: '2024-01-01',
              end_date: '2024-12-31'
            },
            spatial_bounds: {
              north: -4.2,
              south: -18.2,
              east: 17.5,
              west: 8.5
            }
          },
          {
            biomass_type: 'marine_phytoplankton',
            total_biomass: 8934560, // tons
            biomass_density: 2.8, // kg/m²
            area_km2: 518000,
            calculation_method: 'chl_to_npp',
            confidence_level: 0.78,
            temporal_coverage: {
              start_date: '2024-01-01',
              end_date: '2024-12-31'
            },
            spatial_bounds: {
              north: -4.2,
              south: -18.2,
              east: 17.5,
              west: 8.5
            }
          },
          {
            biomass_type: 'marine_fish',
            total_biomass: 1247890, // tons
            biomass_density: 0.24, // kg/m²
            area_km2: 518000,
            calculation_method: 'trophic_transfer',
            confidence_level: 0.65,
            temporal_coverage: {
              start_date: '2024-01-01',
              end_date: '2024-12-31'
            },
            spatial_bounds: {
              north: -4.2,
              south: -18.2,
              east: 17.5,
              west: 8.5
            }
          }
        ] as BiomassResult[]),

        // Time Series
        Promise.resolve([
          {
            date: '2024-01-01',
            terrestrial_biomass: 45234567,
            marine_phytoplankton: 8756432,
            marine_fish: 1234567,
            total_marine: 9991000,
            ndvi_avg: 0.68,
            chl_a_avg: 2.4
          },
          {
            date: '2024-02-01',
            terrestrial_biomass: 45567890,
            marine_phytoplankton: 8892345,
            marine_fish: 1245678,
            total_marine: 10138023,
            ndvi_avg: 0.71,
            chl_a_avg: 2.6
          },
          {
            date: '2024-03-01',
            terrestrial_biomass: 46123456,
            marine_phytoplankton: 9023456,
            marine_fish: 1256789,
            total_marine: 10280245,
            ndvi_avg: 0.73,
            chl_a_avg: 2.8
          }
        ] as BiomassTimeSeries[]),

        // Zonal Statistics
        Promise.resolve([
          {
            zone_name: 'Província de Luanda',
            zone_type: 'Costeira',
            area_km2: 2418,
            terrestrial_biomass_tons: 1567890,
            marine_biomass_tons: 234567,
            biomass_density_kg_ha: 15.2,
            vegetation_coverage: 0.68,
            productivity_index: 0.74
          },
          {
            zone_name: 'Província de Cabinda',
            zone_type: 'Florestal',
            area_km2: 7283,
            terrestrial_biomass_tons: 4567890,
            marine_biomass_tons: 456789,
            biomass_density_kg_ha: 28.9,
            vegetation_coverage: 0.89,
            productivity_index: 0.92
          },
          {
            zone_name: 'Província de Benguela',
            zone_type: 'Semiárida',
            area_km2: 31788,
            terrestrial_biomass_tons: 2345678,
            marine_biomass_tons: 567890,
            biomass_density_kg_ha: 8.7,
            vegetation_coverage: 0.45,
            productivity_index: 0.58
          },
          {
            zone_name: 'Província do Namibe',
            zone_type: 'Árida',
            area_km2: 57091,
            terrestrial_biomass_tons: 1234567,
            marine_biomass_tons: 345678,
            biomass_density_kg_ha: 4.2,
            vegetation_coverage: 0.23,
            productivity_index: 0.31
          },
          {
            zone_name: 'ZEE Norte',
            zone_type: 'Marinha',
            area_km2: 145000,
            terrestrial_biomass_tons: 0,
            marine_biomass_tons: 3456789,
            biomass_density_kg_ha: 2.4,
            vegetation_coverage: 0,
            productivity_index: 0.67
          },
          {
            zone_name: 'ZEE Sul',
            zone_type: 'Marinha',
            area_km2: 373000,
            terrestrial_biomass_tons: 0,
            marine_biomass_tons: 6789012,
            biomass_density_kg_ha: 1.8,
            vegetation_coverage: 0,
            productivity_index: 0.54
          }
        ] as ZonalStats[]),

        // Stats
        Promise.resolve({
          total_terrestrial_tons: 45678900,
          total_marine_tons: 10182450,
          total_combined_tons: 55861350,
          avg_density_kg_ha: 8.7,
          zones_analyzed: 18,
          last_calculation: '2025-01-10T17:15:00Z'
        } as BiomassStats)
      ]);

      setBiomassResults(resultsData);
      setTimeSeries(timeSeriesData);
      setZonalStats(zonalData);
      setStats(statsData);

    } catch (err) {
      // console.error('Error fetching biomass data:', err);
      setError('Erro ao carregar dados de biomassa');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate new biomass
  const calculateBiomass = async (biomassType: string) => {
    try {
      setCalculating(true);
      // Mock calculation time
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Refresh data after calculation
      await fetchBiomassData();
      
    } catch (err) {
      // console.error('Error calculating biomass:', err);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchBiomassData();
      
      // Auto-refresh every 15 minutes
      const interval = setInterval(fetchBiomassData, 900000);
      return () => clearInterval(interval);
    }
  }, [mounted, fetchBiomassData]);

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
          <CardTitle className="text-red-800">❌ Erro de Cálculo de Biomassa</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchBiomassData} variant="outline" className="text-red-600 border-red-300">
            🔄 Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">🌱 QGIS - Calculadora de Biomassa</h1>
        <p className="text-green-100 mt-2">
          Análise avançada de biomassa terrestre e marinha para Angola
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Badge className="bg-green-500">
            ✅ {(stats?.total_combined_tons || 0).toLocaleString()} tons total
          </Badge>
          <Badge className="bg-blue-500">
            🌿 {(stats?.total_terrestrial_tons || 0).toLocaleString()} tons terrestres
          </Badge>
          <Badge className="bg-cyan-500">
            🌊 {(stats?.total_marine_tons || 0).toLocaleString()} tons marinhas
          </Badge>
          <Badge className="bg-yellow-500">
            📊 {stats?.zones_analyzed} zonas analisadas
          </Badge>
          <Button 
            onClick={fetchBiomassData} 
            size="sm" 
            variant="secondary"
            className="ml-auto"
            disabled={loading}
          >
            🔄 Atualizar
          </Button>
        </div>
      </div>

      {/* Biomass Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(BIOMASS_TYPES).map(([key, type]) => (
          <Button
            key={key}
            variant={selectedBiomassType === key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedBiomassType(key)}
            className="h-auto p-3 flex flex-col items-center gap-2"
          >
            <span className="text-lg">{type.icon}</span>
            <span className="text-xs text-center">{type.name.replace(/🌿|🌊|🐟|🌾|🌳 /, '')}</span>
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Biomassa Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.total_combined_tons || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">toneladas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Terrestre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.total_terrestrial_tons || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">tons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Marinha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.total_marine_tons || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">tons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Densidade Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avg_density_kg_ha.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">kg/ha</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Zonas Analisadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.zones_analyzed}</div>
            <p className="text-xs text-muted-foreground">regiões</p>
          </CardContent>
        </Card>
      </div>

      {/* Biomass Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {biomassResults.map((result) => {
          const biomassType = BIOMASS_TYPES[result.biomass_type as keyof typeof BIOMASS_TYPES];
          
          return (
            <Card key={result.biomass_type} className={`${selectedBiomassType === result.biomass_type ? 'border-green-200 bg-green-50/30' : ''}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{biomassType?.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{biomassType?.name}</CardTitle>
                    <CardDescription>{biomassType?.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Biomassa Total</div>
                    <div className="text-lg font-bold">{result.total_biomass.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">toneladas</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Densidade</div>
                    <div className="text-lg font-bold">{result.biomass_density.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {result.biomass_type.includes('marine') ? 'kg/m²' : 'kg/ha'}
                    </div>
                  </div>
                </div>

                {/* Method & Confidence */}
                <div className="bg-white/50 p-3 rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Método</span>
                    <Badge variant="outline" className="text-xs">
                      {CALCULATION_METHODS[result.calculation_method as keyof typeof CALCULATION_METHODS]}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Confiança</span>
                    <Badge variant={result.confidence_level > 0.8 ? "default" : result.confidence_level > 0.6 ? "secondary" : "destructive"}>
                      {Math.round(result.confidence_level * 100)}%
                    </Badge>
                  </div>
                </div>

                {/* Area & Period */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Área: {result.area_km2.toLocaleString()} km²</div>
                  <div>
                    Período: {result.temporal_coverage.start_date} → {result.temporal_coverage.end_date}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => calculateBiomass(result.biomass_type)}
                    disabled={calculating}
                  >
                    {calculating ? "⏳ Calculando..." : "🔄 Recalcular"}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    🗺️ Ver no Mapa
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Zonal Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Estatísticas por Zona Ecológica</CardTitle>
          <CardDescription>
            Comparação de biomassa entre diferentes regiões de Angola
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zonalStats.map((zone) => (
              <Card key={zone.zone_name} className="border-blue-200 bg-blue-50/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{zone.zone_name}</CardTitle>
                  <CardDescription>{zone.zone_type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Área</div>
                      <div className="font-semibold">{zone.area_km2.toLocaleString()} km²</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Densidade</div>
                      <div className="font-semibold">{zone.biomass_density_kg_ha.toFixed(1)} kg/ha</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Terrestre</div>
                      <div className="font-semibold">{zone.terrestrial_biomass_tons.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">tons</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Marinha</div>
                      <div className="font-semibold">{zone.marine_biomass_tons.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">tons</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Cobertura Vegetal</div>
                      <div className="font-semibold">{Math.round(zone.vegetation_coverage * 100)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Índice Produtividade</div>
                      <div className="font-semibold">{zone.productivity_index.toFixed(2)}</div>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" className="w-full">
                    📈 Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Series Preview */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Série Temporal de Biomassa (Últimos 3 Meses)</CardTitle>
          <CardDescription>
            Evolução temporal da biomassa terrestre e marinha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeSeries.map((entry, index) => (
              <div key={entry.date} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <div>
                  <div className="font-semibold">{new Date(entry.date).toLocaleDateString('pt-PT')}</div>
                  <div className="text-sm text-muted-foreground">
                    NDVI: {entry.ndvi_avg.toFixed(2)} | Chl-a: {entry.chl_a_avg.toFixed(1)} mg/m³
                  </div>
                </div>
                <div className="text-right">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Terrestre</div>
                      <div className="font-semibold">{(entry.terrestrial_biomass / 1000000).toFixed(1)}M tons</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Marinha</div>
                      <div className="font-semibold">{(entry.total_marine / 1000000).toFixed(1)}M tons</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total</div>
                      <div className="font-semibold text-green-600">
                        {((entry.terrestrial_biomass + entry.total_marine) / 1000000).toFixed(1)}M tons
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">🌱 Sistema de Biomassa Ativo</h3>
              <p className="text-green-700 text-sm mt-1">
                Modelos científicos validados para análise de biomassa terrestre e marinha
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-600">Último cálculo</div>
              <div className="font-mono text-sm text-green-800">
                {stats?.last_calculation ? new Date(stats.last_calculation).toLocaleString('pt-PT') : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
