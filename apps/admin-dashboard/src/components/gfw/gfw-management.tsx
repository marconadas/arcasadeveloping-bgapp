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
  EyeOff,
  WifiOff,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import useGFWData from '@/hooks/useGFWData';
import useVesselFilters from '@/hooks/useVesselFilters';
import { GFWAlert, GFWVessel } from '@/lib/api-gfw';
import VesselDetailModal from './vessel-detail-modal';
import VesselFilters from './vessel-filters';
import VesselList from './vessel-list';
import { GFWPermissionsDashboard } from './gfw-permissions-dashboard';

interface ProtectedArea {
  id: string;
  name: string;
  bounds: number[][];
  active: boolean;
  violations: number;
}

export function GFWManagement() {
  // Settings state
  const [settings, setSettings] = useState({
    alertsEnabled: true,
    autoRefresh: true,
    refreshInterval: 5,
    vesselTypes: ['fishing', 'carrier', 'support'],
    confidenceLevel: 3
  });

  // Use the custom GFW data hook
  const {
    stats,
    alerts,
    vessels,
    loading,
    refreshing,
    error,
    refresh,
    clearError,
    clearCache,
    getCacheStats
  } = useGFWData({
    autoRefresh: settings.autoRefresh,
    refreshInterval: settings.refreshInterval,
    vesselTypes: settings.vesselTypes,
    confidenceLevel: settings.confidenceLevel
  });

  // Protected areas state (kept local as it's not from GFW API)
  const [protectedAreas, setProtectedAreas] = useState<ProtectedArea[]>([]);

  // Vessel detail modal state
  const [selectedVessel, setSelectedVessel] = useState<GFWVessel | null>(null);
  const [vesselModalOpen, setVesselModalOpen] = useState(false);

  // Vessel filtering
  const {
    filters,
    filteredVessels,
    filteredCount,
    totalCount,
    updateFilters,
    resetFilters,
    exportFilteredData
  } = useVesselFilters(vessels);

  // Initialize protected areas (static data for now)
  useEffect(() => {
    // Calculate violations based on real alerts
    const protectedAreaViolations = alerts.filter(a => a.type === 'protected_area').length;

    setProtectedAreas([
      {
        id: 'iona',
        name: 'Parque Nacional da Iona',
        bounds: [[-17.382, 13.269], [-16.154, 15.736]],
        active: true,
        violations: Math.floor(protectedAreaViolations * 0.7) // 70% of violations in Iona
      },
      {
        id: 'kwanza',
        name: 'Reserva do Kwanza',
        bounds: [[-9.866, 12.814], [-9.297, 13.366]],
        active: true,
        violations: Math.floor(protectedAreaViolations * 0.3) // 30% of violations in Kwanza
      }
    ]);
  }, [alerts]);

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await refresh();
      toast({
        title: "Sucesso",
        description: "Dados do Global Fishing Watch atualizados",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar dados",
        variant: "destructive"
      });
    }
  };

  // Handle error display
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro de Conexão",
        description: error,
        variant: "destructive"
      });
    }
  }, [error]);

  // Export functions
  const exportAlerts = () => {
    const data = {
      alerts: alerts,
      exportTime: new Date().toISOString(),
      totalAlerts: alerts.length
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gfw-alerts-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação Concluída",
      description: `${alerts.length} alertas exportados em JSON`
    });
  };

  const exportVessels = () => {
    const data = {
      vessels: vessels,
      stats: stats,
      exportTime: new Date().toISOString(),
      totalVessels: vessels.length
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gfw-vessels-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação Concluída",
      description: `${vessels.length} embarcações exportadas em JSON`
    });
  };

  const exportCSV = () => {
    if (vessels.length === 0) {
      toast({
        title: "Sem Dados",
        description: "Não há embarcações para exportar",
        variant: "destructive"
      });
      return;
    }

    const headers = ['ID', 'Nome', 'Tipo', 'Bandeira', 'IMO', 'Callsign', 'Latitude', 'Longitude', 'Primeira Transmissão', 'Última Transmissão'];
    const csvData = vessels.map(vessel => [
      vessel.vesselId,
      vessel.name || '',
      vessel.vesselType,
      vessel.flag,
      vessel.imo || '',
      vessel.callsign || '',
      vessel.geom?.coordinates[1]?.toFixed(6) || '',
      vessel.geom?.coordinates[0]?.toFixed(6) || '',
      vessel.firstTransmissionDate,
      vessel.lastTransmissionDate
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gfw-vessels-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "CSV Exportado",
      description: `${vessels.length} embarcações exportadas em CSV`
    });
  };

  // Handle vessel selection
  const handleVesselSelect = (vessel: GFWVessel) => {
    setSelectedVessel(vessel);
    setVesselModalOpen(true);
  };

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
        <div className="flex gap-2">
          {error && (
            <Button
              onClick={clearError}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Limpar Erro
            </Button>
          )}
          <Button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading || refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro de Conexão:</strong> {error}
            <Button
              onClick={clearError}
              variant="ghost"
              size="sm"
              className="ml-2"
            >
              Dispensar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      {!error && stats && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>
            <strong>Conectado ao GFW:</strong> Dados atualizados em {new Date(stats.lastUpdate).toLocaleString('pt-BR')}
            <span className="ml-2 text-xs text-muted-foreground">
              ({vessels.length} embarcações carregadas)
            </span>
          </AlertDescription>
        </Alert>
      )}

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
              {vessels.length} carregadas localmente
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
          <TabsTrigger value="vessels">Embarcações ({vessels.length})</TabsTrigger>
          <TabsTrigger value="protected-areas">Áreas Protegidas</TabsTrigger>
          <TabsTrigger value="permissions">Permissões GFW</TabsTrigger>
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

        {/* Vessels Tab */}
        <TabsContent value="vessels" className="space-y-4">
          <VesselFilters
            vessels={vessels}
            filters={filters}
            onFiltersChange={updateFilters}
            onExport={exportFilteredData}
            loading={loading || refreshing}
          />

          <VesselList
            vessels={filteredVessels}
            loading={loading}
            onVesselClick={handleVesselSelect}
            totalCount={totalCount}
            filteredCount={filteredCount}
          />
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

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <GFWPermissionsDashboard />
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

              <div className="pt-4 border-t space-y-2">
                <Button className="w-full" onClick={() => {
                  toast({
                    title: "Configurações Salvas",
                    description: "As configurações foram atualizadas com sucesso"
                  });
                }}>
                  Salvar Configurações
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={clearCache}
                  >
                    Limpar Cache
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const stats = getCacheStats();
                      toast({
                        title: "Estatísticas do Cache",
                        description: `${stats.size} entradas em cache`
                      });
                    }}
                  >
                    Ver Cache
                  </Button>
                </div>
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
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={exportAlerts}
                disabled={alerts.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Alertas ({alerts.length}) - JSON
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={exportVessels}
                disabled={vessels.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Embarcações ({vessels.length}) - JSON
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={exportCSV}
                disabled={vessels.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Embarcações ({vessels.length}) - CSV
              </Button>
              <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded">
                <strong>Formatos disponíveis:</strong><br/>
                • JSON: Dados completos com metadados<br/>
                • CSV: Tabela para Excel/Google Sheets<br/>
                • Alertas incluem localização e severidade
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vessel Detail Modal */}
      <VesselDetailModal
        vessel={selectedVessel}
        isOpen={vesselModalOpen}
        onClose={() => {
          setVesselModalOpen(false);
          setSelectedVessel(null);
        }}
      />
    </div>
  );
}
