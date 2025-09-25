'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClientOnlyWrapper, formatSSRSafeDate } from '../debug/hydration-debugger';

/**
 * 🎯 SSR-SAFE DASHBOARD OVERVIEW
 * Versão cirúrgica sem hydration errors
 */

interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'stable';
}

export default function DashboardOverviewSSRSafe() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Static metrics que não mudam (SSR-safe)
  const staticMetrics: DashboardMetric[] = [
    {
      id: 'zee-area',
      title: 'ZEE Angola',
      value: '518,000',
      description: 'km² de área marítima',
      trend: 'stable'
    },
    {
      id: 'species',
      title: 'Espécies Catalogadas',
      value: '1,247',
      description: 'espécies marinhas',
      trend: 'up'
    },
    {
      id: 'services',
      title: 'Serviços Ativos',
      value: '25',
      description: 'funcionalidades online',
      trend: 'stable'
    },
    {
      id: 'uptime',
      title: 'Uptime',
      value: '99.9%',
      description: 'disponibilidade do sistema',
      trend: 'up'
    }
  ];

  useEffect(() => {
    // Simular carregamento de dados
    const timer = setTimeout(() => {
      setMetrics(staticMetrics);
      setLastUpdate(formatSSRSafeDate(new Date()));
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClientOnlyWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-lg">
          <h1 className="text-3xl font-bold">🌊 BGAPP Dashboard - SSR Safe</h1>
          <p className="text-blue-100 mt-2">
            Plataforma Oceanográfica para ZEE Angola - Versão Silicon Valley
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Badge className="bg-green-500">
              ✅ Sistema Operacional
            </Badge>
            <Badge className="bg-blue-500">
              🚀 Sem Hydration Errors
            </Badge>
            <span className="text-sm ml-auto">
              Última atualização: {lastUpdate}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
                {metric.trend && (
                  <div className="mt-2">
                    {metric.trend === 'up' && <span className="text-green-600 text-xs">↗️ Crescendo</span>}
                    {metric.trend === 'down' && <span className="text-red-600 text-xs">↘️ Diminuindo</span>}
                    {metric.trend === 'stable' && <span className="text-gray-600 text-xs">➡️ Estável</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()} variant="outline">
            🔄 Atualizar Dados
          </Button>
          <Button onClick={() => setIsLoading(true)} variant="outline">
            ⚡ Recarregar
          </Button>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-sm">🔧 Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <div>Componente: DashboardOverviewSSRSafe</div>
                <div>Renderizado: Client-Only</div>
                <div>Métricas: {metrics.length} carregadas</div>
                <div>Timestamp: {new Date().toISOString()}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientOnlyWrapper>
  );
}
