"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Map, 
  Wand2, 
  BarChart3, 
  Settings,
  Layers,
  Eye
} from 'lucide-react';
import { MapsManagement } from './maps-management';
import { MapCreatorTools } from './map-creator-tools';

interface MapsHubProps {
  className?: string;
}

export default function MapsHub({ className }: MapsHubProps) {
  const [activeTab, setActiveTab] = useState('management');
  const [refreshKey, setRefreshKey] = useState(0);

  // Callback quando um mapa é criado
  const handleMapCreated = (mapData: any) => {
    // Forçar refresh da lista de mapas
    setRefreshKey(prev => prev + 1);
    // Mudar para aba de gestão para ver o novo mapa
    setActiveTab('management');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header do Hub de Mapas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Map className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Hub de Mapas BGAPP</CardTitle>
                <CardDescription>
                  Sistema completo para gestão e criação de mapas oceanográficos
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Layers className="h-3 w-3 mr-1" />
                Sistema Ativo
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Gestão de Mapas
          </TabsTrigger>
          <TabsTrigger value="creator" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Criar Mapas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Análises
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Gestão de Mapas */}
        <TabsContent value="management">
          <MapsManagement key={refreshKey} />
        </TabsContent>

        {/* Criador de Mapas */}
        <TabsContent value="creator">
          <MapCreatorTools onMapCreated={handleMapCreated} />
        </TabsContent>

        {/* Análises */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análises e Estatísticas
              </CardTitle>
              <CardDescription>
                Métricas de uso e performance dos mapas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Mapas mais utilizados */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Mapas Mais Utilizados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🌊 Realtime Angola</span>
                      <Badge variant="secondary">1,250 views</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🔬 Dashboard Científico</span>
                      <Badge variant="secondary">980 views</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🎣 QGIS Pescas</span>
                      <Badge variant="secondary">750 views</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Distribuição por categoria */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🌊 Oceanográfico</span>
                      <Badge variant="outline">2 mapas</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🎣 Pescas</span>
                      <Badge variant="outline">1 mapa</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🔬 Científico</span>
                      <Badge variant="outline">1 mapa</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Status dos mapas */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Status dos Mapas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Ativos
                      </span>
                      <Badge className="bg-green-100 text-green-800">4</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Manutenção
                      </span>
                      <Badge className="bg-yellow-100 text-yellow-800">0</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Offline
                      </span>
                      <Badge className="bg-red-100 text-red-800">0</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configurações globais para o sistema de mapas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Configurações de performance */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Performance</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Cache de Mapas</div>
                        <div className="text-sm text-gray-500">Ativar cache para melhor performance</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Compressão de Tiles</div>
                        <div className="text-sm text-gray-500">Comprimir tiles para reduzir largura de banda</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    </div>
                  </div>
                </div>

                {/* Configurações de segurança */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Segurança</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Validação de Configurações</div>
                        <div className="text-sm text-gray-500">Validar automaticamente configurações de mapas</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Sandbox para iFrames</div>
                        <div className="text-sm text-gray-500">Executar mapas em ambiente seguro</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    </div>
                  </div>
                </div>

                {/* Configurações de integração */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Integração</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">API Externa</div>
                        <div className="text-sm text-gray-500">Permitir acesso via API REST</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Webhooks</div>
                        <div className="text-sm text-gray-500">Notificações automáticas de eventos</div>
                      </div>
                      <Badge variant="secondary">Inativo</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
