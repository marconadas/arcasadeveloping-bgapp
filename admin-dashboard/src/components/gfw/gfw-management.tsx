"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Fish, 
  AlertTriangle, 
  Activity, 
  Map, 
  Settings, 
  Download,
  RefreshCw,
  Shield,
  Ship,
  TrendingUp,
  Clock,
  MapPin,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface GFWStats {
  totalVessels: number;
  activeAlerts: number;
  protectedAreaViolations: number;
  lastUpdate: string;
  dataUsage: {
    current: number;
    limit: number;
  };
}

interface GFWAlert {
  id: string;
  type: 'illegal_fishing' | 'protected_area' | 'encounters';
  severity: 'low' | 'medium' | 'high';
  location: { lat: number; lon: number };
  timestamp: string;
  vesselCount: number;
  description: string;
}

interface ProtectedArea {
  id: string;
  name: string;
  bounds: number[][];
  active: boolean;
  violations: number;
}

export function GFWManagement() {
  const [stats, setStats] = useState<GFWStats | null>(null);
  const [alerts, setAlerts] = useState<GFWAlert[]>([]);
  const [protectedAreas, setProtectedAreas] = useState<ProtectedArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    alertsEnabled: true,
    autoRefresh: true,
    refreshInterval: 5,
    vesselTypes: ['fishing', 'carrier', 'support'],
    confidenceLevel: 3
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadGFWData();
    const interval = settings.autoRefresh ? setInterval(loadGFWData, settings.refreshInterval * 60 * 1000) : null;
    return () => { if (interval) clearInterval(interval); };
  }, [settings.autoRefresh, settings.refreshInterval]);

  async function loadGFWData() {
    try {
      setLoading(true);
      
      // Simular dados para demonstração
      // Em produção, buscar de endpoints reais
      setStats({
        totalVessels: 847,
        activeAlerts: 12,
        protectedAreaViolations: 3,
        lastUpdate: new Date().toISOString(),
        dataUsage: {
          current: 750,
          limit: 1000
        }
      });

      setAlerts([
        {
          id: '1',
          type: 'protected_area',
          severity: 'high',
          location: { lat: -16.5, lon: 14.2 },
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          vesselCount: 2,
          description: 'Atividade pesqueira detectada no Parque Nacional da Iona'
        },
        {
          id: '2',
          type: 'illegal_fishing',
          severity: 'medium',
          location: { lat: -12.3, lon: 13.8 },
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          vesselCount: 1,
          description: 'Possível pesca ilegal detectada próximo à costa'
        },
        {
          id: '3',
          type: 'encounters',
          severity: 'low',
          location: { lat: -14.2, lon: 12.5 },
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          vesselCount: 3,
          description: 'Encontro de embarcações em alto mar'
        }
      ]);

      setProtectedAreas([
        {
          id: 'iona',
          name: 'Parque Nacional da Iona',
          bounds: [[-17.382, 13.269], [-16.154, 15.736]],
          active: true,
          violations: 3
        },
        {
          id: 'kwanza',
          name: 'Reserva do Kwanza',
          bounds: [[-9.866, 12.814], [-9.297, 13.366]],
          active: true,
          violations: 1
        }
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados GFW:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do Global Fishing Watch",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function getAlertIcon(type: string) {
    switch (type) {
      case 'illegal_fishing':
        return <Fish className="h-4 w-4" />;
      case 'protected_area':
        return <Shield className="h-4 w-4" />;
      case 'encounters':
        return <Ship className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Fish className="h-8 w-8 text-blue-600" />
            Global Fishing Watch
          </h2>
          <p className="text-muted-foreground">
            Monitorização de atividades pesqueiras em tempo real
          </p>
        </div>
        <Button 
          onClick={loadGFWData} 
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Embarcações Ativas
            </CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVessels || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% desde ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas Ativos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.activeAlerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Violações em Áreas Protegidas
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.protectedAreaViolations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Nas últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Uso de Dados API
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.dataUsage.current || 0}/{stats?.dataUsage.limit || 1000}
            </div>
            <Progress 
              value={(stats?.dataUsage.current || 0) / (stats?.dataUsage.limit || 1000) * 100} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="protected-areas">Áreas Protegidas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recentes</CardTitle>
              <CardDescription>
                Monitorização de atividades suspeitas e violações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <Alert key={alert.id} className="flex items-start gap-4">
                    <div className={`rounded-full p-2 ${getSeverityColor(alert.severity)}`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{alert.description}</h4>
                        <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {alert.location.lat.toFixed(2)}, {alert.location.lon.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Ship className="h-3 w-3" />
                          {alert.vesselCount} embarcações
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Ver no Mapa
                        </Button>
                        <Button size="sm" variant="outline">
                          Investigar
                        </Button>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Protected Areas Tab */}
        <TabsContent value="protected-areas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Áreas Protegidas</CardTitle>
              <CardDescription>
                Gestão e monitorização de zonas de conservação marinha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {protectedAreas.map((area) => (
                  <div key={area.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{area.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Limites: [{area.bounds[0].join(', ')}] a [{area.bounds[1].join(', ')}]
                      </p>
                      {area.violations > 0 && (
                        <Badge variant="destructive" className="mt-2">
                          {area.violations} violações detectadas
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`area-${area.id}`}>Monitorização</Label>
                        <Switch
                          id={`area-${area.id}`}
                          checked={area.active}
                          onCheckedChange={(checked) => {
                            setProtectedAreas(areas => 
                              areas.map(a => a.id === area.id ? { ...a, active: checked } : a)
                            );
                          }}
                        />
                      </div>
                      <Button size="sm" variant="outline">
                        <Map className="h-3 w-3 mr-1" />
                        Ver Área
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                Adicionar Nova Área Protegida
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações GFW</CardTitle>
              <CardDescription>
                Ajuste as preferências de monitorização e alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas Automáticos</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações de atividades suspeitas
                  </p>
                </div>
                <Switch
                  checked={settings.alertsEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(s => ({ ...s, alertsEnabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Atualização Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Atualizar dados periodicamente
                  </p>
                </div>
                <Switch
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) => 
                    setSettings(s => ({ ...s, autoRefresh: checked }))
                  }
                />
              </div>

              {settings.autoRefresh && (
                <div className="space-y-2">
                  <Label>Intervalo de Atualização</Label>
                  <Select
                    value={settings.refreshInterval.toString()}
                    onValueChange={(value) => 
                      setSettings(s => ({ ...s, refreshInterval: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minuto</SelectItem>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Nível de Confiança</Label>
                <Select
                  value={settings.confidenceLevel.toString()}
                  onValueChange={(value) => 
                    setSettings(s => ({ ...s, confidenceLevel: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Baixo (mais alertas)</SelectItem>
                    <SelectItem value="2">Médio</SelectItem>
                    <SelectItem value="3">Alto (menos alertas)</SelectItem>
                    <SelectItem value="4">Muito Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipos de Embarcações</Label>
                <div className="space-y-2">
                  {['fishing', 'carrier', 'support', 'passenger'].map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`vessel-${type}`}
                        checked={settings.vesselTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings(s => ({ 
                              ...s, 
                              vesselTypes: [...s.vesselTypes, type] 
                            }));
                          } else {
                            setSettings(s => ({ 
                              ...s, 
                              vesselTypes: s.vesselTypes.filter(t => t !== type) 
                            }));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`vessel-${type}`} className="capitalize">
                        {type === 'fishing' ? 'Pesca' : 
                         type === 'carrier' ? 'Transporte' :
                         type === 'support' ? 'Apoio' : 'Passageiros'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full" onClick={() => {
                  toast({
                    title: "Configurações Salvas",
                    description: "As configurações foram atualizadas com sucesso"
                  });
                }}>
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exportar Dados</CardTitle>
              <CardDescription>
                Baixar relatórios e dados históricos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório de Alertas (CSV)
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados de Embarcações (JSON)
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Exportar Estatísticas Mensais (PDF)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
