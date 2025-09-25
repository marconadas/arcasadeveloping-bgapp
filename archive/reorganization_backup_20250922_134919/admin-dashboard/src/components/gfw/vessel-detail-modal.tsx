"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Ship,
  MapPin,
  Clock,
  Flag,
  Anchor,
  Activity,
  Route,
  AlertTriangle,
  Download,
  ExternalLink,
  Calendar,
  Gauge
} from 'lucide-react';
import { GFWVessel } from '@/lib/api-gfw';

interface VesselDetailModalProps {
  vessel: GFWVessel | null;
  isOpen: boolean;
  onClose: () => void;
}

interface VesselTrack {
  timestamp: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
}

interface VesselAlert {
  id: string;
  type: 'speed_anomaly' | 'location_anomaly' | 'ais_gap';
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  description: string;
}

export function VesselDetailModal({ vessel, isOpen, onClose }: VesselDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [vesselTracks, setVesselTracks] = useState<VesselTrack[]>([]);
  const [vesselAlerts, setVesselAlerts] = useState<VesselAlert[]>([]);

  // Simulate vessel track data when vessel changes
  useEffect(() => {
    if (vessel) {
      generateMockTrackData();
      generateMockAlerts();
    }
  }, [vessel]);

  const generateMockTrackData = () => {
    if (!vessel) return;

    const tracks: VesselTrack[] = [];
    const now = new Date();

    // Generate 24 hours of track points (every 2 hours)
    for (let i = 0; i < 12; i++) {
      const timestamp = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000));

      // Add some randomness to simulate vessel movement
      const baseLat = vessel.geom?.coordinates[1] || -15;
      const baseLon = vessel.geom?.coordinates[0] || 12;

      tracks.push({
        timestamp: timestamp.toISOString(),
        lat: baseLat + (Math.random() - 0.5) * 0.5,
        lon: baseLon + (Math.random() - 0.5) * 0.5,
        speed: 8 + Math.random() * 6, // 8-14 knots
        course: Math.random() * 360
      });
    }

    setVesselTracks(tracks.reverse());
  };

  const generateMockAlerts = () => {
    if (!vessel) return;

    const alerts: VesselAlert[] = [];
    const now = new Date();

    // Generate some sample alerts
    if (Math.random() > 0.7) {
      alerts.push({
        id: `alert-${vessel.id}-1`,
        type: 'speed_anomaly',
        severity: 'medium',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        description: 'Velocidade anormalmente baixa detectada'
      });
    }

    if (Math.random() > 0.8) {
      alerts.push({
        id: `alert-${vessel.id}-2`,
        type: 'location_anomaly',
        severity: 'high',
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        description: 'Embarcação detectada próxima à área protegida'
      });
    }

    setVesselAlerts(alerts);
  };

  const getVesselTypeIcon = (type: string) => {
    switch (type) {
      case 'fishing': return '🎣';
      case 'carrier': return '🚢';
      case 'support': return '⚓';
      case 'passenger': return '🛳️';
      default: return '🚤';
    }
  };

  const getVesselTypeLabel = (type: string) => {
    switch (type) {
      case 'fishing': return 'Pesca';
      case 'carrier': return 'Transporte';
      case 'support': return 'Apoio';
      case 'passenger': return 'Passageiros';
      default: return 'Desconhecido';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const exportVesselData = () => {
    if (!vessel) return;

    const data = {
      vessel: vessel,
      tracks: vesselTracks,
      alerts: vesselAlerts,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vessel-${vessel.vesselId || vessel.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!vessel) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getVesselTypeIcon(vessel.vesselType)}</span>
            <div>
              <div className="flex items-center gap-2">
                {vessel.name || `Embarcação ${vessel.vesselId}`}
                <Badge variant="outline">
                  {getVesselTypeLabel(vessel.vesselType)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                ID: {vessel.vesselId} | IMO: {vessel.imo || 'N/A'}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bandeira:</span>
                  <span className="text-sm font-medium">{vessel.flag}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Callsign:</span>
                  <span className="text-sm font-medium">{vessel.callsign || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <span className="text-sm font-medium">{getVesselTypeLabel(vessel.vesselType)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localização Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {vessel.geom ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Latitude:</span>
                      <span className="text-sm font-medium">
                        {vessel.geom.coordinates[1]?.toFixed(4)}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Longitude:</span>
                      <span className="text-sm font-medium">
                        {vessel.geom.coordinates[0]?.toFixed(4)}°
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => window.open(
                        `https://www.google.com/maps?q=${vessel.geom?.coordinates[1]},${vessel.geom?.coordinates[0]}`,
                        '_blank'
                      )}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver no Mapa
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Localização não disponível</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Atividade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Primeira transmissão:</span>
                  <span className="text-sm font-medium">
                    {new Date(vessel.firstTransmissionDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Última transmissão:</span>
                  <span className="text-sm font-medium">
                    {new Date(vessel.lastTransmissionDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <Badge variant="outline" className="w-full justify-center">
                  <Activity className="h-3 w-3 mr-1" />
                  Ativa
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tabs */}
          <Tabs defaultValue="track" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="track">
                <Route className="h-4 w-4 mr-2" />
                Histórico de Rota
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Alertas ({vesselAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="technical">
                <Anchor className="h-4 w-4 mr-2" />
                Dados Técnicos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="track" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Últimas 24 Horas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {vesselTracks.map((track, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(track.timestamp).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{track.lat.toFixed(4)}°, {track.lon.toFixed(4)}°</span>
                          <div className="flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            {track.speed.toFixed(1)} nós
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              {vesselAlerts.length > 0 ? (
                <div className="space-y-2">
                  {vesselAlerts.map((alert) => (
                    <Card key={alert.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`rounded-full p-2 ${getAlertSeverityColor(alert.severity)}`}>
                            <AlertTriangle className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium">{alert.description}</h4>
                              <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Nenhum Alerta</h3>
                    <p className="text-sm text-muted-foreground">
                      Esta embarcação não possui alertas ativos no momento.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Especificações Técnicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Identificação</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ID da Embarcação:</span>
                          <span>{vessel.vesselId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IMO:</span>
                          <span>{vessel.imo || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sinal de Chamada:</span>
                          <span>{vessel.callsign || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Registro de Atividade</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Período Ativo:</span>
                          <span>
                            {Math.ceil(
                              (new Date(vessel.lastTransmissionDate).getTime() -
                               new Date(vessel.firstTransmissionDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                            )} dias
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="outline">Ativo</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={exportVesselData} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Exportar Dados
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VesselDetailModal;