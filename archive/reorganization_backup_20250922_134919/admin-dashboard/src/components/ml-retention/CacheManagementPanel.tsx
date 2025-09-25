/**
 * 🗄️ Cache Management Panel
 * Painel para gestão avançada de cache do sistema de retenção
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Trash2, 
  Settings, 
  Zap, 
  Database, 
  HardDrive,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface CacheInfo {
  cache_type: string;
  hit_ratio: number;
  total_entries: number;
  active_entries: number;
  space_usage_mb: number;
  last_updated: string;
  status: 'healthy' | 'warning' | 'critical';
}

interface CacheManagementPanelProps {
  cacheData: CacheInfo[];
  onRefresh: () => void;
  onOptimize: (cacheType: string) => void;
  onClear: (cacheType: string) => void;
}

const CacheManagementPanel: React.FC<CacheManagementPanelProps> = ({
  cacheData,
  onRefresh,
  onOptimize,
  onClear
}) => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [selectedCache, setSelectedCache] = useState<string | null>(null);

  const handleAction = async (action: string, cacheType: string) => {
    setLoading(prev => ({ ...prev, [cacheType]: true }));
    
    try {
      switch (action) {
        case 'refresh':
          await onRefresh();
          break;
        case 'optimize':
          await onOptimize(cacheType);
          break;
        case 'clear':
          await onClear(cacheType);
          break;
      }
    } finally {
      setLoading(prev => ({ ...prev, [cacheType]: false }));
    }
  };

  const getCacheTypeDisplayName = (type: string) => {
    const names = {
      'feature_store': 'Feature Store',
      'training_cache': 'Training Cache',
      'inference_cache': 'Inference Cache',
      'aggregated_series': 'Aggregated Series'
    };
    return names[type as keyof typeof names] || type;
  };

  const getCacheTypeDescription = (type: string) => {
    const descriptions = {
      'feature_store': 'Cache de características extraídas para ML',
      'training_cache': 'Cache de datasets pré-processados para treino',
      'inference_cache': 'Cache de resultados de predições',
      'aggregated_series': 'Séries temporais agregadas'
    };
    return descriptions[type as keyof typeof descriptions] || 'Cache do sistema';
  };

  const getCacheTypeIcon = (type: string) => {
    switch (type) {
      case 'feature_store':
        return <Database className="h-4 w-4" />;
      case 'training_cache':
        return <Zap className="h-4 w-4" />;
      case 'inference_cache':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string, hitRatio: number) => {
    if (hitRatio >= 0.8) {
      return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    } else if (hitRatio >= 0.6) {
      return <Badge className="bg-yellow-100 text-yellow-800">Bom</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Precisa Otimização</Badge>;
    }
  };

  const totalCacheSize = cacheData.reduce((sum, cache) => sum + cache.space_usage_mb, 0);
  const avgHitRatio = cacheData.length > 0 ? 
    cacheData.reduce((sum, cache) => sum + cache.hit_ratio, 0) / cacheData.length : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hit Ratio Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgHitRatio * 100).toFixed(1)}%</div>
            <Progress value={avgHitRatio * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espaço Total</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalCacheSize / 1024).toFixed(1)}GB</div>
            <p className="text-xs text-muted-foreground mt-1">
              {cacheData.length} caches ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Saudável</div>
            <p className="text-xs text-muted-foreground mt-1">
              Todos os caches operacionais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cache Management Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="management">Gestão</TabsTrigger>
          <TabsTrigger value="optimization">Otimização</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {cacheData.map((cache, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedCache(cache.cache_type)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCacheTypeIcon(cache.cache_type)}
                      <CardTitle className="text-base">
                        {getCacheTypeDisplayName(cache.cache_type)}
                      </CardTitle>
                    </div>
                    {getStatusBadge(cache.status, cache.hit_ratio)}
                  </div>
                  <CardDescription>
                    {getCacheTypeDescription(cache.cache_type)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Hit Ratio */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hit Ratio</span>
                      <span className="font-medium">{(cache.hit_ratio * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={cache.hit_ratio * 100} />
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Entradas Totais</span>
                      <div className="font-medium">{cache.total_entries.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Entradas Ativas</span>
                      <div className="font-medium">{cache.active_entries.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Espaço Usado</span>
                      <div className="font-medium">{cache.space_usage_mb.toFixed(1)} MB</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Eficiência</span>
                      <div className="font-medium">
                        {cache.active_entries > 0 ? 
                          ((cache.active_entries / cache.total_entries) * 100).toFixed(1) + '%' : 
                          '0%'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ações de Cache</CardTitle>
              <CardDescription>
                Gerir caches individuais e executar operações de manutenção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cacheData.map((cache, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getCacheTypeIcon(cache.cache_type)}
                    <div>
                      <div className="font-medium">
                        {getCacheTypeDisplayName(cache.cache_type)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {cache.total_entries.toLocaleString()} entradas • {cache.space_usage_mb.toFixed(1)} MB
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction('refresh', cache.cache_type)}
                      disabled={loading[cache.cache_type]}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${loading[cache.cache_type] ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction('optimize', cache.cache_type)}
                      disabled={loading[cache.cache_type]}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Otimizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction('clear', cache.cache_type)}
                      disabled={loading[cache.cache_type]}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recomendações</CardTitle>
                <CardDescription>Sugestões para otimizar performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {avgHitRatio < 0.6 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Hit ratio baixo detectado. Considere aumentar TTL dos caches.
                    </AlertDescription>
                  </Alert>
                )}
                
                {totalCacheSize > 5120 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Uso de espaço elevado. Execute limpeza de dados antigos.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Cache feature_store com boa performance</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Políticas de retenção ativas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Operações comuns de otimização</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => onRefresh()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Todos os Caches
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Otimização Automática
                </Button>
                
                <Separator />
                
                <Button variant="outline" className="w-full text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpeza Completa
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CacheManagementPanel;
