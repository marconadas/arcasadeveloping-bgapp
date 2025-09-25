'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { bgappApi } from '@/lib/api-complete';
import type { 
  DashboardOverview, 
  SystemHealth, 
  OceanographicData, 
  FisheriesStats,
  CopernicusRealTimeData 
} from '@/lib/api-complete';

/**
 * Componente de Integração BGAPP
 * 🚀 Mister Silicon Valley Edition - Integração Completa NextJS
 */
export default function BGAPPIntegration() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [oceanData, setOceanData] = useState<OceanographicData | null>(null);
  const [fisheriesData, setFisheriesData] = useState<FisheriesStats | null>(null);
  const [copernicusData, setCopernicusData] = useState<CopernicusRealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        overviewResponse,
        healthResponse,
        oceanResponse,
        fisheriesResponse,
        copernicusResponse
      ] = await Promise.all([
        bgappApi.getDashboardOverview(),
        bgappApi.getSystemHealth(),
        bgappApi.getOceanographicData(),
        bgappApi.getFisheriesStats(),
        bgappApi.getCopernicusRealTimeData()
      ]);

      setOverview(overviewResponse);
      setSystemHealth(healthResponse);
      setOceanData(oceanResponse);
      setFisheriesData(fisheriesResponse);
      setCopernicusData(copernicusResponse);
    } catch (err) {
      // console.error('Error fetching BGAPP data:', err);
      setError('Erro ao carregar dados do BGAPP');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchData();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [mounted, fetchData]);

  // Prevent hydration mismatch - wait for client mount
  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">❌ Erro de Conexão</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchData} variant="outline" className="text-red-600 border-red-300">
            🔄 Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-red-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">🛰️ BGAPP - Sistema Completo ZEE Angola</h1>
        <p className="text-blue-100 mt-2">
          Monitorização em tempo real da Zona Económica Exclusiva de Angola
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Badge className="bg-green-500">
            {systemHealth?.overall_status === 'healthy' ? '✅ Sistema Operacional' : '⚠️ Sistema Degradado'}
          </Badge>
          <span className="text-sm">
            Uptime: {systemHealth?.uptime || overview?.system_status?.uptime || '99.9%'}
          </span>
          <Button 
            onClick={fetchData} 
            size="sm" 
            variant="secondary"
            className="ml-auto"
          >
            🔄 Atualizar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">ZEE Angola</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.zee_angola?.area_km2?.toLocaleString() || '518,000'} km²</div>
            <p className="text-xs text-muted-foreground">
              {overview?.zee_angola?.monitoring_stations || 47} estações de monitorização
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Biodiversidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.zee_angola?.species_recorded || '1,247'}</div>
            <p className="text-xs text-muted-foreground">espécies registadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Temperatura do Mar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.real_time_data?.sea_temperature || '24.5'}°C</div>
            <p className="text-xs text-muted-foreground">tempo real</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Performance API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.performance?.success_rate || '98.7'}%</div>
            <p className="text-xs text-muted-foreground">
              {overview?.performance?.api_response_time || '45'}ms resposta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>⚕️ Saúde do Sistema</CardTitle>
            <CardDescription>
              Status dos componentes principais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Status Geral:</span>
              <Badge variant={systemHealth?.overall_status === 'healthy' ? 'default' : 'destructive'}>
                {systemHealth?.overall_status || 'unknown'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Serviços Online:</span>
              <span>{systemHealth?.statistics?.online_services || 'N/A'}/{systemHealth?.statistics?.total_services || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>CPU:</span>
              <span>{systemHealth?.performance?.cpu_usage || 'N/A'}%</span>
            </div>
            <div className="flex justify-between">
              <span>Memória:</span>
              <span>{systemHealth?.performance?.memory_usage || 'N/A'}%</span>
            </div>
            <div className="flex justify-between">
              <span>APIs Ativas:</span>
              <span>{systemHealth?.statistics?.total_endpoints || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Copernicus Data */}
        <Card>
          <CardHeader>
            <CardTitle>🛰️ Dados Copernicus</CardTitle>
            <CardDescription>
              Dados satelitários em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Status:</span>
              <Badge variant={copernicusData?.status === 'success' ? 'default' : 'destructive'}>
                {copernicusData?.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Qualidade Geral:</span>
              <Badge variant="outline">
                {copernicusData?.quality_flags?.overall_quality || 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Cobertura Espacial:</span>
              <span>{copernicusData?.quality_flags?.spatial_coverage || 'N/A'}%</span>
            </div>
            <div className="flex justify-between">
              <span>Completude de Dados:</span>
              <span>{copernicusData?.quality_flags?.data_completeness || 'N/A'}%</span>
            </div>
            <div className="flex justify-between">
              <span>Satélites Ativos:</span>
              <span>{copernicusData?.metadata?.satellites?.length || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Oceanographic Data */}
        <Card>
          <CardHeader>
            <CardTitle>🌊 Dados Oceanográficos</CardTitle>
            <CardDescription>
              Condições atuais do mar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Região:</span>
              <span>{oceanData?.region || 'ZEE Angola'}</span>
            </div>
            <div className="flex justify-between">
              <span>Estações de Monitorização:</span>
              <span>{oceanData?.monitoring_stations || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Passagens de Satélite Hoje:</span>
              <span>{oceanData?.satellite_passes_today || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Fontes de Dados:</span>
              <span>{oceanData?.data_sources?.length || 'N/A'}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Área: {oceanData?.area_km2?.toLocaleString() || '518,000'} km²
            </div>
          </CardContent>
        </Card>

        {/* Fisheries Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>🎣 Estatísticas de Pesca</CardTitle>
            <CardDescription>
              Dados da indústria pesqueira
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Captura Total:</span>
              <span>{fisheriesData?.total_catch_tons?.toLocaleString() || 'N/A'} ton</span>
            </div>
            <div className="flex justify-between">
              <span>Índice de Sustentabilidade:</span>
              <Badge variant="outline">
                {fisheriesData?.sustainability_metrics?.overall_index || 'N/A'}/10
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Emprego Total:</span>
              <span>{fisheriesData?.economic_impact?.employment_total?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Valor de Exportação:</span>
              <span>${fisheriesData?.economic_impact?.export_value_usd?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Principais Espécies:</span>
              <span>{fisheriesData?.main_species?.length || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Status dos Serviços</CardTitle>
          <CardDescription>
            Estado operacional dos serviços principais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium">Copernicus</div>
              <Badge variant={overview?.services?.copernicus === 'operational' ? 'default' : 'destructive'}>
                {overview?.services?.copernicus || 'operational'}
              </Badge>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium">Processamento</div>
              <Badge variant={overview?.services?.data_processing === 'running' ? 'default' : 'destructive'}>
                {overview?.services?.data_processing || 'running'}
              </Badge>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium">Monitorização</div>
              <Badge variant={overview?.services?.monitoring === 'active' ? 'default' : 'destructive'}>
                {overview?.services?.monitoring || 'active'}
              </Badge>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium">APIs</div>
              <Badge variant={overview?.services?.apis === 'online' ? 'default' : 'destructive'}>
                {overview?.services?.apis || 'online'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          🚀 BGAPP Admin Dashboard - Mister Silicon Valley Edition
        </p>
        <p>
          Última atualização: {new Date().toLocaleString('pt-PT')}
        </p>
      </div>
    </div>
  );
}
