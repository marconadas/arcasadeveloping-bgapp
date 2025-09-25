/**
 * Dashboard em Tempo Real - Silicon Valley Grade
 * Visualização de dados ao vivo via WebSocket
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  useRealTimeMetrics, 
  useRealTimeAlerts, 
  useRealTimeOceanData,
  useRealTimeBiodiversity 
} from '@/hooks/useRealTimeData';
import {
  Activity,
  AlertTriangle,
  Cpu,
  Database,
  Globe,
  Heart,
  Radio,
  RefreshCw,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Waves,
  Wind,
  Zap,
  Fish,
  MapPin,
  Gauge
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

export default function RealTimeDashboard() {
  // Hooks de dados em tempo real
  const metrics = useRealTimeMetrics();
  const alerts = useRealTimeAlerts();
  const oceanData = useRealTimeOceanData();
  const biodiversity = useRealTimeBiodiversity();

  // Estados locais para histórico
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [oceanHistory, setOceanHistory] = useState<any[]>([]);

  // Atualizar histórico quando receber novos dados
  useEffect(() => {
    if (metrics.data) {
      setMetricsHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString('pt-BR'),
          ...metrics.data
        }].slice(-20); // Manter últimos 20 pontos
        return newHistory;
      });
    }
  }, [metrics.data]);

  useEffect(() => {
    if (oceanData.data) {
      setOceanHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString('pt-BR'),
          ...oceanData.data
        }].slice(-20);
        return newHistory;
      });
    }
  }, [oceanData.data]);

  // Renderizar indicador de conexão
  const ConnectionStatus = ({ isConnected, channel }: { isConnected: boolean; channel: string }) => (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      <span className="text-xs text-gray-500">{channel}</span>
    </div>
  );

  // Renderizar métrica individual
  const MetricCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    trend, 
    color = 'blue' 
  }: { 
    title: string; 
    value: number | string; 
    unit?: string; 
    icon: any; 
    trend?: number;
    color?: string;
  }) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <Icon className={`h-4 w-4 text-${color}-500`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header com status de conexão */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard em Tempo Real</h1>
          <p className="text-gray-600 mt-1">Monitoramento ao vivo do sistema BGAPP</p>
        </div>
        <div className="flex flex-col gap-1">
          <ConnectionStatus isConnected={metrics.isConnected} channel="Métricas" />
          <ConnectionStatus isConnected={oceanData.isConnected} channel="Oceano" />
          <ConnectionStatus isConnected={biodiversity.isConnected} channel="Biodiversidade" />
        </div>
      </div>

      {/* Alertas em tempo real */}
      {alerts.data && (
        <Alert className={`border-${alerts.data.type === 'critical' ? 'red' : alerts.data.type === 'warning' ? 'yellow' : 'blue'}-500`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{alerts.data.title}</AlertTitle>
          <AlertDescription>
            {alerts.data.message}
            <span className="text-xs text-gray-500 ml-2">
              {new Date(alerts.data.timestamp).toLocaleTimeString('pt-BR')}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas do Sistema */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Métricas do Sistema
        </h2>
        
        {metrics.isConnecting ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : metrics.data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard 
              title="CPU" 
              value={metrics.data.cpu} 
              unit="%" 
              icon={Cpu} 
              trend={2.5}
              color="blue"
            />
            <MetricCard 
              title="Memória" 
              value={metrics.data.memory} 
              unit="%" 
              icon={Database} 
              trend={-1.2}
              color="purple"
            />
            <MetricCard 
              title="Requisições" 
              value={metrics.data.requests} 
              unit="/min" 
              icon={Globe} 
              trend={5.8}
              color="green"
            />
            <MetricCard 
              title="Erros" 
              value={metrics.data.errors} 
              unit="" 
              icon={AlertTriangle} 
              trend={-10}
              color="red"
            />
            <MetricCard 
              title="Latência" 
              value={metrics.data.latency} 
              unit="ms" 
              icon={Zap} 
              trend={-3.4}
              color="yellow"
            />
          </div>
        ) : (
          <Alert>
            <Radio className="h-4 w-4" />
            <AlertTitle>Aguardando dados</AlertTitle>
            <AlertDescription>Conectando ao servidor de métricas...</AlertDescription>
          </Alert>
        )}

        {/* Gráfico de histórico de métricas */}
        {metricsHistory.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Histórico de Performance</CardTitle>
              <CardDescription>Últimos 20 pontos de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#3B82F6" 
                    name="CPU (%)" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#8B5CF6" 
                    name="Memória (%)" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="#EAB308" 
                    name="Latência (ms)" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dados Oceanográficos */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Waves className="h-5 w-5" />
          Dados Oceanográficos em Tempo Real
        </h2>

        {oceanData.data ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cards de métricas oceânicas */}
            <div className="grid grid-cols-2 gap-4">
              <MetricCard 
                title="Temperatura" 
                value={oceanData.data.temperature.toFixed(1)} 
                unit="°C" 
                icon={Thermometer}
                color="orange"
              />
              <MetricCard 
                title="Salinidade" 
                value={oceanData.data.salinity.toFixed(2)} 
                unit="PSU" 
                icon={Waves}
                color="cyan"
              />
              <MetricCard 
                title="pH" 
                value={oceanData.data.ph.toFixed(2)} 
                unit="" 
                icon={Activity}
                color="green"
              />
              <MetricCard 
                title="Oxigênio" 
                value={oceanData.data.oxygen.toFixed(1)} 
                unit="mg/L" 
                icon={Wind}
                color="blue"
              />
            </div>

            {/* Gráfico de ondas e correntes */}
            <Card>
              <CardHeader>
                <CardTitle>Condições Marítimas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Altura das Ondas</span>
                      <span>{oceanData.data.wave_height.toFixed(1)} m</span>
                    </div>
                    <Progress value={oceanData.data.wave_height * 20} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Velocidade da Corrente</span>
                      <span>{oceanData.data.current_speed.toFixed(1)} m/s</span>
                    </div>
                    <Progress value={oceanData.data.current_speed * 25} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Profundidade</span>
                      <span>{oceanData.data.depth.toFixed(0)} m</span>
                    </div>
                    <Progress value={oceanData.data.depth / 50} className="h-2" />
                  </div>
                  <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      Coordenadas: {oceanData.data.coordinates.lat.toFixed(4)}°, {oceanData.data.coordinates.lng.toFixed(4)}°
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Waves className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Conectando aos sensores oceânicos...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico temporal de dados oceânicos */}
        {oceanHistory.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Evolução Temporal - Oceano</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={oceanHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#F97316" 
                    fill="#FED7AA"
                    name="Temperatura (°C)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="wave_height" 
                    stroke="#06B6D4" 
                    fill="#A5F3FC"
                    name="Altura Ondas (m)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Biodiversidade */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Fish className="h-5 w-5" />
          Monitoramento de Biodiversidade
        </h2>

        {biodiversity.data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Estatísticas gerais */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total de Espécies</span>
                    <span className="font-bold">{biodiversity.data.total_species}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Índice de Diversidade</span>
                    <span className="font-bold">{biodiversity.data.diversity_index.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nível de Ameaça</span>
                    <Badge 
                      variant={
                        biodiversity.data.threat_level === 'high' ? 'destructive' :
                        biodiversity.data.threat_level === 'medium' ? 'secondary' : 'default'
                      }
                    >
                      {biodiversity.data.threat_level}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Espécies detectadas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Espécies Detectadas Recentemente</CardTitle>
                <CardDescription>Últimas detecções com nível de confiança</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {biodiversity.data.species_detected.slice(0, 5).map((species, idx) => (
                    <div key={species.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Fish className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{species.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(species.timestamp).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{species.count} indivíduos</p>
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {(species.confidence * 100).toFixed(0)}% confiança
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Fish className="h-12 w-12 text-green-500 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Conectando aos sensores de biodiversidade...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rodapé com última atualização */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500 animate-pulse" />
          <span>Sistema operacional e monitorando</span>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span>
            Última atualização: {
              metrics.lastUpdate 
                ? new Date(metrics.lastUpdate).toLocaleTimeString('pt-BR')
                : 'Aguardando...'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
