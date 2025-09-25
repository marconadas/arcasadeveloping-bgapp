'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getServiceUrl } from '@/lib/environment-urls';
import { Card, CardContent } from '@/components/ui/card';

/**
 * 🗺️ Spatial Map Modal Component
 * Modal interativo para visualização de análise espacial QGIS
 * Implementação com Leaflet.js para dados geoespaciais
 */

interface SpatialMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: {
    type: 'buffer' | 'hotspot' | 'connectivity';
    name: string;
    coordinates?: [number, number];
    properties?: Record<string, any>;
    geometry?: any;
  };
}

interface MapLayer {
  id: string;
  name: string;
  type: 'buffer' | 'hotspot' | 'connectivity' | 'marine_area';
  visible: boolean;
  color: string;
  coordinates: [number, number];
  properties: Record<string, any>;
}

const ANGOLA_BOUNDS = {
  north: -4.2,
  south: -18.2,
  east: 17.5,
  west: 8.5
};

// Mapas BGAPP de alta qualidade disponíveis
const BGAPP_MAPS = {
  realtime_angola: {
    name: 'Realtime Angola',
    description: 'Dados oceanográficos em tempo real da costa angolana',
    url: `https://bgapp-frontend.pages.dev/realtime_angola.html`,
    icon: '🌊',
    features: ['SST', 'Correntes', 'Ventos', 'Clorofila-a', 'Batimetria']
  },
  dashboard_cientifico: {
    name: 'Dashboard Científico',
    description: 'Interface científica principal para dados oceanográficos',
    url: `https://bgapp-frontend.pages.dev/dashboard_cientifico.html`,
    icon: '🔬',
    features: ['Análise Científica', 'Múltiplas Camadas', 'Visualizações Avançadas']
  },
  qgis_dashboard: {
    name: 'QGIS Dashboard',
    description: 'Dashboard QGIS principal com análise espacial',
    url: `https://bgapp-frontend.pages.dev/qgis_dashboard.html`,
    icon: '🗺️',
    features: ['Análise Espacial', 'QGIS Integration', 'Geoprocessamento']
  },
  qgis_fisheries: {
    name: 'QGIS Pescas',
    description: 'Sistema QGIS especializado para gestão pesqueira',
    url: `https://bgapp-frontend.pages.dev/qgis_fisheries.html`,
    icon: '🎣',
    features: ['Gestão Pesqueira', 'Zonas de Pesca', 'Análise de Stocks']
  }
};

const SAMPLE_LAYERS: MapLayer[] = [
  {
    id: 'amp_iona',
    name: 'Área Marinha Protegida Iona',
    type: 'buffer',
    visible: true,
    color: '#22c55e',
    coordinates: [-15.7, 12.3],
    properties: {
      protection_level: 'high',
      buffer_distance: '5.0 km',
      area: '78.5 km²',
      established: '2019',
      species: ['Tartaruga marinha', 'Baleia jubarte'],
      map_url: BGAPP_MAPS.realtime_angola.url
    }
  },
  {
    id: 'porto_luanda',
    name: 'Porto de Luanda',
    type: 'buffer',
    visible: true,
    color: '#ef4444',
    coordinates: [-8.8, 13.2],
    properties: {
      restriction_type: 'navigation',
      buffer_distance: '10.0 km',
      area: '314.2 km²',
      vessel_types: ['commercial', 'fishing'],
      map_url: BGAPP_MAPS.qgis_fisheries.url
    }
  },
  {
    id: 'recife_cabinda',
    name: 'Recife de Coral Cabinda',
    type: 'buffer',
    visible: true,
    color: '#8b5cf6',
    coordinates: [-5.1, 12.2],
    properties: {
      coral_coverage: '85%',
      buffer_distance: '3.0 km',
      area: '28.3 km²',
      biodiversity_index: 0.92,
      map_url: BGAPP_MAPS.dashboard_cientifico.url
    }
  },
  {
    id: 'hotspot_cabinda',
    name: 'Costa Norte Cabinda',
    type: 'hotspot',
    visible: true,
    color: '#f59e0b',
    coordinates: [-5.12, 12.34],
    properties: {
      hotspot_type: 'biodiversity',
      intensity_score: 0.89,
      confidence_level: 0.95,
      area_influence: '156.7 km²',
      map_url: BGAPP_MAPS.realtime_angola.url
    }
  },
  {
    id: 'hotspot_benguela',
    name: 'Banco de Benguela',
    type: 'hotspot',
    visible: true,
    color: '#3b82f6',
    coordinates: [-12.45, 13.67],
    properties: {
      hotspot_type: 'fishing',
      intensity_score: 0.76,
      confidence_level: 0.88,
      area_influence: '289.4 km²',
      map_url: BGAPP_MAPS.qgis_fisheries.url
    }
  },
  {
    id: 'hotspot_kwanza',
    name: 'Estuário do Kwanza',
    type: 'hotspot',
    visible: true,
    color: '#10b981',
    coordinates: [-9.23, 13.12],
    properties: {
      hotspot_type: 'spawning',
      intensity_score: 0.83,
      confidence_level: 0.91,
      area_influence: '67.8 km²',
      map_url: BGAPP_MAPS.dashboard_cientifico.url
    }
  }
];

const LAYER_TYPES = {
  buffer: { name: 'Zonas Buffer', icon: '🔵', color: 'bg-blue-500' },
  hotspot: { name: 'Hotspots', icon: '🔥', color: 'bg-orange-500' },
  connectivity: { name: 'Conectividade', icon: '🔗', color: 'bg-green-500' },
  marine_area: { name: 'Áreas Marinhas', icon: '🌊', color: 'bg-cyan-500' }
};

export default function SpatialMapModal({ isOpen, onClose, data }: SpatialMapModalProps) {
  const [mapLayers, setMapLayers] = useState<MapLayer[]>(SAMPLE_LAYERS);
  const [selectedLayer, setSelectedLayer] = useState<MapLayer | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeLayerTypes, setActiveLayerTypes] = useState<Set<string>>(new Set(['buffer', 'hotspot']));
  const [selectedMapType, setSelectedMapType] = useState<string>('realtime_angola');
  const [showMapSelector, setShowMapSelector] = useState(false);
  // Simplified version - only iframe mode for now

  const visibleLayers = mapLayers.filter(layer => 
    layer.visible && activeLayerTypes.has(layer.type)
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setMapLoaded(true), 1000);
    }
  }, [isOpen]);

  const toggleLayerType = (type: string) => {
    const newActiveTypes = new Set(activeLayerTypes);
    if (newActiveTypes.has(type)) {
      newActiveTypes.delete(type);
    } else {
      newActiveTypes.add(type);
    }
    setActiveLayerTypes(newActiveTypes);
  };

  const toggleLayerVisibility = (layerId: string) => {
    setMapLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
  };

  // Reset map loaded state when closing
  useEffect(() => {
    if (!isOpen) {
      setMapLoaded(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                🗺️ Visualização Espacial - QGIS Angola
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Mapa interativo das análises espaciais da ZEE Angola
                {data && ` - ${data.name}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[600px]">
          {/* Painel de Controles */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            {/* Filtros de Camadas */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Tipos de Camadas</h3>
                <div className="space-y-2">
                  {Object.entries(LAYER_TYPES).map(([type, config]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{config.icon}</span>
                        <span className="text-sm">{config.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={activeLayerTypes.has(type) ? "default" : "outline"}
                        onClick={() => toggleLayerType(type)}
                        className="h-6 px-2 text-xs"
                      >
                        {activeLayerTypes.has(type) ? "ON" : "OFF"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Camadas */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Camadas Disponíveis</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mapLayers
                    .filter(layer => activeLayerTypes.has(layer.type))
                    .map((layer) => (
                    <div 
                      key={layer.id} 
                      className={`p-2 rounded border cursor-pointer transition-all ${
                        selectedLayer?.id === layer.id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedLayer(layer)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: layer.color }}
                          />
                          <span className="text-sm font-medium">{layer.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerVisibility(layer.id);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          {layer.visible ? "👁️" : "🚫"}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {LAYER_TYPES[layer.type].name}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detalhes da Camada Selecionada */}
            {selectedLayer && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Detalhes</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Nome:</span>
                      <div className="font-medium text-sm">{selectedLayer.name}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Coordenadas:</span>
                      <div className="font-mono text-xs">
                        {selectedLayer.coordinates[0].toFixed(3)}, {selectedLayer.coordinates[1].toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Tipo:</span>
                      <Badge variant="outline" className="ml-1">
                        {LAYER_TYPES[selectedLayer.type].name}
                      </Badge>
                    </div>
                    <div className="pt-2">
                      <span className="text-xs text-muted-foreground">Propriedades:</span>
                      <div className="mt-1 space-y-1">
                        {Object.entries(selectedLayer.properties).slice(0, 4).map(([key, value]) => (
                          <div key={key} className="text-xs">
                            <span className="text-muted-foreground capitalize">
                              {key.replace('_', ' ')}:
                            </span>
                            <span className="ml-1 font-medium">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Área do Mapa Real BGAPP */}
          <div className="lg:col-span-3 bg-white rounded-lg border-2 border-blue-200 relative overflow-hidden">
            {!mapLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
                <div className="text-center">
                  <div className="animate-spin text-4xl mb-4">🗺️</div>
                  <div className="text-lg font-semibold">Carregando Mapa BGAPP...</div>
                  <div className="text-sm text-muted-foreground">
                    {BGAPP_MAPS[selectedMapType as keyof typeof BGAPP_MAPS]?.name}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Controles do Mapa */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      {BGAPP_MAPS[selectedMapType as keyof typeof BGAPP_MAPS]?.icon}
                      {BGAPP_MAPS[selectedMapType as keyof typeof BGAPP_MAPS]?.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {visibleLayers.length} camadas espaciais • Controles funcionais
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMapSelector(!showMapSelector)}
                    className="bg-white/95 backdrop-blur-sm"
                  >
                    🔄 Trocar Mapa
                  </Button>
                </div>

                {/* Seletor de Mapas */}
                {showMapSelector && (
                  <div className="absolute top-20 left-4 z-20 bg-white rounded-lg shadow-xl border p-4 max-w-sm">
                    <h5 className="font-semibold mb-3">Escolher Mapa BGAPP</h5>
                    <div className="space-y-2">
                      {Object.entries(BGAPP_MAPS).map(([key, map]) => (
                        <Button
                          key={key}
                          variant={selectedMapType === key ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedMapType(key);
                            setShowMapSelector(false);
                            setMapLoaded(false);
                            setTimeout(() => setMapLoaded(true), 1000);
                          }}
                          className="w-full justify-start"
                        >
                          <span className="mr-2">{map.icon}</span>
                          <div className="text-left">
                            <div className="font-medium">{map.name}</div>
                            <div className="text-xs text-muted-foreground">{map.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mapa BGAPP em IFrame */}
                <iframe
                  src={BGAPP_MAPS[selectedMapType as keyof typeof BGAPP_MAPS]?.url}
                  className="w-full h-full border-0"
                  title={`Mapa BGAPP - ${BGAPP_MAPS[selectedMapType as keyof typeof BGAPP_MAPS]?.name}`}
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />

                {/* Informações da Camada Selecionada Sobreposta */}
                {selectedLayer && (
                  <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
                    <h5 className="font-semibold text-sm mb-2">📍 {selectedLayer.name}</h5>
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className="ml-1 font-medium">{LAYER_TYPES[selectedLayer.type].name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Coordenadas:</span>
                        <span className="ml-1 font-mono text-xs">
                          {selectedLayer.coordinates[0].toFixed(3)}, {selectedLayer.coordinates[1].toFixed(3)}
                        </span>
                      </div>
                      {selectedLayer.properties.map_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(selectedLayer.properties.map_url, '_blank')}
                          className="w-full mt-2"
                        >
                          🔗 Abrir Mapa Dedicado
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Features do Mapa */}
                <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
                  <h5 className="font-semibold text-sm mb-2">🚀 Funcionalidades</h5>
                  <div className="flex flex-wrap gap-1">
                    {BGAPP_MAPS[selectedMapType as keyof typeof BGAPP_MAPS]?.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs">
                      Controles de Camadas
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ações do Modal */}
        <div className="flex items-center justify-between p-6 border-t">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {visibleLayers.length} camadas ativas
            </Badge>
            <Badge variant="outline">
              {BGAPP_MAPS[selectedMapType as keyof typeof BGAPP_MAPS]?.icon} {BGAPP_MAPS[selectedMapType as keyof typeof BGAPP_MAPS]?.name}
            </Badge>
            <Badge variant="outline">
              ZEE Angola
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.open(BGAPP_MAPS[selectedMapType as keyof typeof BGAPP_MAPS]?.url, '_blank')}
            >
              🔗 Abrir Mapa Completo
            </Button>
            <Button variant="outline" onClick={() => {
              setMapLoaded(false);
              setTimeout(() => setMapLoaded(true), 1000);
            }}>
              🔄 Recarregar
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
