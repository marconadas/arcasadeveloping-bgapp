/**
 * 🧠 ML Retention Dashboard Component
 * Dashboard completo para monitorização da base de retenção ML
 * Integrado com bgapp-admin.pages.dev
 */

import React from 'react';
import { useMLRetentionMetrics } from '@/hooks/useMLRetentionMetrics';
import { Skeleton } from '@/components/ui/skeleton';
import DataRetentionViewer from './DataRetentionViewer';
import RetentionDataStats from './RetentionDataStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  Zap, 
  BarChart3, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Cpu,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface RetentionMetrics {
  cache_hit_ratio: number;
  avg_response_time_ms: number;
  total_space_mb: number;
  queries_intercepted: number;
  performance_gains_ms: number;
  last_updated: string;
}

interface SystemHealth {
  overall_status: string;
  components: Record<string, string>;
  active_alerts: number;
  monitoring_active: boolean;
  cache_performance: string;
  last_update: string;
}

interface CacheStats {
  cache_type: string;
  hit_ratio: number;
  total_entries: number;
  active_entries: number;
  space_usage_mb: number;
}

interface RetentionPolicy {
  policy_id: string;
  name: string;
  table_name: string;
  retention_days: number;
  enabled: boolean;
  next_execution: string | null;
}

const MLRetentionDashboard: React.FC = () => {
  const { 
    metrics, 
    health, 
    cacheStats, 
    loading, 
    error, 
    refresh,
    isConnected 
  } = useMLRetentionMetrics(30000, true);

  // Estados para dados reais da API
  const [policies, setPolicies] = React.useState<RetentionPolicy[]>([]);
  const [performanceHistory, setPerformanceHistory] = React.useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = React.useState(true);
  const [loadingPerformance, setLoadingPerformance] = React.useState(true);

  // Importar serviço de dados
  React.useEffect(() => {
    const loadPolicies = async () => {
      try {
        const mlService = (await import('@/services/data/MLRetentionService')).default;
        const response = await mlService.getPolicies();
        if (response.success && response.data) {
          setPolicies(response.data);
        }
      } catch (error) {
        console.error('Erro ao carregar políticas:', error);
      } finally {
        setLoadingPolicies(false);
      }
    };

    const loadPerformance = async () => {
      try {
        const mlService = (await import('@/services/data/MLRetentionService')).default;
        const response = await mlService.getPerformanceHistory({ interval: 'hour', limit: 24 });
        if (response.success && response.data) {
          setPerformanceHistory(response.data.map((item: any, i: number) => ({
            hour: `${i}:00`,
            cache_hit_ratio: item.cache_hit_ratio,
            response_time: item.response_time_ms,
            space_usage: item.space_usage_gb * 1024 // Converter GB para MB
          })));
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setLoadingPerformance(false);
      }
    };

    loadPolicies();
    loadPerformance();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Carregando dados de retenção ML...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🧠 Sistema de Retenção ML</h1>
          <p className="text-muted-foreground">
            Monitorização e gestão da base de dados de retenção para otimização de performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={health?.overall_status === 'healthy' ? 'default' : 'destructive'}>
            {getStatusIcon(health?.overall_status || 'unknown')}
            <span className="ml-1">{health?.overall_status || 'Desconhecido'}</span>
          </Badge>
          <div className="flex items-center space-x-2">
            {!isConnected && (
              <Badge variant="destructive" className="text-xs">
                Modo Demo
              </Badge>
            )}
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Ratio</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${(metrics.cache_hit_ratio * 100).toFixed(1)}%` : '--'}
            </div>
            <Progress 
              value={metrics ? metrics.cache_hit_ratio * 100 : 0} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics && metrics.cache_hit_ratio > 0.8 ? 'Excelente' : 
               metrics && metrics.cache_hit_ratio > 0.6 ? 'Bom' : 'Precisa otimização'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${metrics.avg_response_time_ms.toFixed(1)}ms` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics && metrics.avg_response_time_ms < 100 ? '🚀 Ultra-rápido' :
               metrics && metrics.avg_response_time_ms < 300 ? '✅ Rápido' : '⚠️ Lento'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso de Espaço</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${(metrics.total_space_mb / 1024).toFixed(1)}GB` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics && metrics.total_space_mb < 1024 ? 'Eficiente' : 'Moderado'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queries Interceptadas</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? metrics.queries_intercepted.toLocaleString() : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics ? `${(metrics.performance_gains_ms / 1000).toFixed(1)}s poupados` : 'Sem dados'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="data-viewer">📊 Dados Retidos</TabsTrigger>
          <TabsTrigger value="data-stats">📈 Estatísticas</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="policies">Políticas</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Data Viewer Tab */}
        <TabsContent value="data-viewer" className="space-y-4">
          <DataRetentionViewer onRefresh={refresh} />
        </TabsContent>

        {/* Data Statistics Tab */}
        <TabsContent value="data-stats" className="space-y-4">
          <RetentionDataStats />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>Saúde do Sistema</CardTitle>
                <CardDescription>Estado dos componentes principais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {health?.components && Object.entries(health.components).map(([component, status]) => (
                  <div key={component} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {component.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status)}
                      <span className={`text-sm ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span>Monitorização Ativa</span>
                    <Badge variant={health?.monitoring_active ? 'default' : 'secondary'}>
                      {health?.monitoring_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Performance (24h)</CardTitle>
                <CardDescription>Cache hit ratio ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <Tooltip 
                      formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Hit Ratio']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cache_hit_ratio" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {health && health.active_alerts > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Existem {health.active_alerts} alertas ativos que requerem atenção.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cacheStats.map((cache, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base capitalize">
                    {cache.cache_type.replace('_', ' ')}
                  </CardTitle>
                  <CardDescription>
                    {cache.total_entries.toLocaleString()} entradas totais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hit Ratio</span>
                      <span>{(cache.hit_ratio * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={cache.hit_ratio * 100} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ativas:</span>
                      <div className="font-medium">{cache.active_entries.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Espaço:</span>
                      <div className="font-medium">{cache.space_usage_mb.toFixed(1)}MB</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Políticas de Retenção</CardTitle>
              <CardDescription>Gestão automática de dados baseada em critérios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {policies.map((policy) => (
                  <div key={policy.policy_id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{policy.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {policy.table_name} • {policy.retention_days} dias
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                        {policy.enabled ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Configurar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tempo de Resposta (24h)</CardTitle>
                <CardDescription>Latência média em milissegundos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}ms`, 'Tempo']} />
                    <Area 
                      type="monotone" 
                      dataKey="response_time" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uso de Espaço (24h)</CardTitle>
                <CardDescription>Crescimento do armazenamento em MB</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}MB`, 'Espaço']} />
                    <Area 
                      type="monotone" 
                      dataKey="space_usage" 
                      stroke="#f59e0b" 
                      fill="#f59e0b" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Insights de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    {metrics && metrics.cache_hit_ratio > 0.8 ? 
                      'Cache funcionando de forma excelente' : 
                      'Cache pode ser otimizado'
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    {policies.filter(p => p.enabled).length} políticas ativas
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MLRetentionDashboard;
