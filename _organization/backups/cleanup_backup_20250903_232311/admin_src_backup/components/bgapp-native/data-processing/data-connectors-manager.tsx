'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CloudArrowUpIcon,
  GlobeAltIcon,
  MapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  CpuChipIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { bgappAPI, DataConnector } from '@/lib/bgapp/bgapp-api';
import { useDataConnectors } from '@/lib/bgapp/hooks';

/**
 * 📊 DATA CONNECTORS MANAGER - Silicon Valley Grade A+
 * Gestor completo dos 13+ conectores de dados BGAPP
 */

export default function DataConnectorsManager() {
  const {
    data: connectors,
    isLoading,
    error,
    isUsingFallback,
    refetch
  } = useDataConnectors(() => bgappAPI.getDataConnectors());

  const [runningConnector, setRunningConnector] = useState<string | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<DataConnector | null>(null);

  const handleRunConnector = async (connectorId: string) => {
    try {
      setRunningConnector(connectorId);
      await bgappAPI.runDataConnector(connectorId);
      
      setTimeout(() => {
        refetch();
        setRunningConnector(null);
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao executar conector:', error);
      setRunningConnector(null);
    }
  };

  const getConnectorStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConnectorIcon = (source: string) => {
    switch (source) {
      case 'obis':
      case 'gbif': return GlobeAltIcon;
      case 'cmems':
      case 'modis': return CloudArrowUpIcon;
      case 'angola_national': return MapIcon;
      default: return CpuChipIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'international': return 'text-blue-600 bg-blue-50';
      case 'regional': return 'text-green-600 bg-green-50';
      case 'national': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const connectorsByType = {
    international: connectors?.filter(c => c.type === 'international') || [],
    regional: connectors?.filter(c => c.type === 'regional') || [],
    national: connectors?.filter(c => c.type === 'national') || []
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CloudArrowUpIcon className="h-8 w-8 text-blue-600" />
            📊 Gestão de Conectores de Dados
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            13+ conectores internacionais e regionais - {connectors?.filter(c => c.status === 'active').length || 0} ativos
          </p>
          {isUsingFallback && (
            <div className="flex items-center gap-2 mt-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-600">Usando dados de fallback</span>
            </div>
          )}
        </div>
        <Button onClick={refetch} disabled={isLoading}>
          Atualizar Conectores
        </Button>
      </div>

      {/* Estatísticas dos Conectores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conectores Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {connectors?.filter(c => c.status === 'active').length || 0}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Registos Processados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {connectors ? connectors.reduce((acc, c) => acc + c.recordsProcessed, 0).toLocaleString() : '0'}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Conectores</p>
                <p className="text-2xl font-bold text-purple-600">
                  {connectors?.length || 0}
                </p>
              </div>
              <CloudArrowUpIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Erro</p>
                <p className="text-2xl font-bold text-red-600">
                  {connectors ? 
                    ((connectors.reduce((acc, c) => acc + c.errorCount, 0) / 
                      connectors.reduce((acc, c) => acc + c.recordsProcessed, 1)) * 100).toFixed(1)
                    : '0'}%
                </p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs por Tipo de Conector */}
      <Tabs defaultValue="international">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="international">Internacionais ({connectorsByType.international.length})</TabsTrigger>
          <TabsTrigger value="regional">Regionais ({connectorsByType.regional.length})</TabsTrigger>
          <TabsTrigger value="national">Nacionais ({connectorsByType.national.length})</TabsTrigger>
        </TabsList>

        {/* Tab: Conectores Internacionais */}
        <TabsContent value="international" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectorsByType.international.map((connector) => {
              const ConnectorIcon = getConnectorIcon(connector.source);
              const isCurrentlyRunning = runningConnector === connector.id;

              return (
                <Card 
                  key={connector.id}
                  className={`hover:shadow-lg transition-all cursor-pointer ${
                    connector.status === 'active' ? 'border-green-200 bg-green-50/30' : ''
                  }`}
                  onClick={() => setSelectedConnector(connector)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ConnectorIcon className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">{connector.name}</span>
                      </div>
                      <Badge className={getConnectorStatusColor(connector.status)}>
                        {connector.status}
                      </Badge>
                    </div>
                    <Badge className={getTypeColor(connector.type)} variant="outline">
                      {connector.type}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registos:</span>
                        <span className="font-medium">{connector.recordsProcessed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Erros:</span>
                        <span className={`font-medium ${connector.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {connector.errorCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Última Execução:</span>
                        <span className="font-medium">
                          {connector.lastRun ? new Date(connector.lastRun).toLocaleDateString() : 'Nunca'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Próxima:</span>
                        <span className="font-medium">
                          {connector.nextRun ? new Date(connector.nextRun).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-3"
                      variant={connector.status === 'active' ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunConnector(connector.id);
                      }}
                      disabled={isCurrentlyRunning || connector.status === 'running'}
                    >
                      {isCurrentlyRunning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Executando...
                        </>
                      ) : connector.status === 'running' ? (
                        'Em Execução...'
                      ) : (
                        <>
                          <PlayIcon className="h-4 w-4 mr-1" />
                          Executar Agora
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Conectores Regionais */}
        <TabsContent value="regional" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectorsByType.regional.map((connector) => {
              const ConnectorIcon = getConnectorIcon(connector.source);
              const isCurrentlyRunning = runningConnector === connector.id;

              return (
                <Card key={connector.id} className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ConnectorIcon className="h-5 w-5 text-green-600" />
                        <span className="font-medium">{connector.name}</span>
                      </div>
                      <Badge className={getConnectorStatusColor(connector.status)}>
                        {connector.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Mesmo conteúdo dos conectores internacionais */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registos:</span>
                        <span className="font-medium">{connector.recordsProcessed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Erros:</span>
                        <span className={`font-medium ${connector.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {connector.errorCount}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => handleRunConnector(connector.id)}
                      disabled={isCurrentlyRunning}
                    >
                      {isCurrentlyRunning ? 'Executando...' : 'Executar Agora'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Conectores Nacionais */}
        <TabsContent value="national" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectorsByType.national.map((connector) => {
              const ConnectorIcon = getConnectorIcon(connector.source);
              const isCurrentlyRunning = runningConnector === connector.id;

              return (
                <Card key={connector.id} className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ConnectorIcon className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">{connector.name}</span>
                      </div>
                      <Badge className={getConnectorStatusColor(connector.status)}>
                        {connector.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registos:</span>
                        <span className="font-medium">{connector.recordsProcessed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Erros:</span>
                        <span className={`font-medium ${connector.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {connector.errorCount}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => handleRunConnector(connector.id)}
                      disabled={isCurrentlyRunning}
                    >
                      {isCurrentlyRunning ? 'Executando...' : 'Executar Agora'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detalhes do Conector Selecionado */}
      {selectedConnector && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(getConnectorIcon(selectedConnector.source), { className: "h-6 w-6" })}
              Detalhes: {selectedConnector.name}
            </CardTitle>
            <CardDescription>
              Configurações e estatísticas detalhadas do conector
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações do Conector */}
              <div>
                <h4 className="font-semibold mb-3">Informações do Conector</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fonte:</span>
                    <span className="font-medium">{selectedConnector.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <Badge className={getTypeColor(selectedConnector.type)}>
                      {selectedConnector.type}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={getConnectorStatusColor(selectedConnector.status)}>
                      {selectedConnector.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registos Processados:</span>
                    <span className="font-medium">{selectedConnector.recordsProcessed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contagem de Erros:</span>
                    <span className={`font-medium ${selectedConnector.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedConnector.errorCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Configurações */}
              <div>
                <h4 className="font-semibold mb-3">Configurações</h4>
                <div className="space-y-2">
                  {Object.entries(selectedConnector.config).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium font-mono text-xs max-w-48 truncate">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações em Lote */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Ações em Lote</CardTitle>
          <CardDescription>
            Controles para executar múltiplos conectores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-16 flex-col"
              onClick={() => {
                connectorsByType.international.forEach(c => {
                  if (c.status === 'active') handleRunConnector(c.id);
                });
              }}
            >
              <GlobeAltIcon className="h-6 w-6 mb-2" />
              <span>Executar Internacionais</span>
              <span className="text-xs text-gray-500">{connectorsByType.international.length} conectores</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-16 flex-col"
              onClick={() => {
                connectorsByType.regional.forEach(c => {
                  if (c.status === 'active') handleRunConnector(c.id);
                });
              }}
            >
              <CloudArrowUpIcon className="h-6 w-6 mb-2" />
              <span>Executar Regionais</span>
              <span className="text-xs text-gray-500">{connectorsByType.regional.length} conectores</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-16 flex-col"
              onClick={() => {
                connectors?.forEach(c => {
                  if (c.status === 'active') handleRunConnector(c.id);
                });
              }}
            >
              <CpuChipIcon className="h-6 w-6 mb-2" />
              <span>Executar Todos</span>
              <span className="text-xs text-gray-500">{connectors?.length || 0} conectores</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status de Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <span className="text-red-800">
                Erro ao carregar conectores: {error.message}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
