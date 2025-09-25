'use client';

import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAP_LAYERS, DEFAULT_LAYER, LAYER_DESCRIPTIONS, type MapLayerConfig } from '@/lib/map-layers';
import { ChevronDown, ChevronUp, Map } from 'lucide-react';

interface BaseMapSelectorProps {
  onLayerChange?: (layerId: string) => void;
  className?: string;
}

export function BaseMapSelector({ onLayerChange, className = '' }: BaseMapSelectorProps) {
  const map = useMap();
  const [currentLayer, setCurrentLayer] = useState<string>(DEFAULT_LAYER);
  const [isExpanded, setIsExpanded] = useState(false);
  const [layers, setLayers] = useState<Record<string, L.TileLayer | L.TileLayer.WMS>>({});

  // Initialize layers
  useEffect(() => {
    const initializedLayers: Record<string, L.TileLayer | L.TileLayer.WMS> = {};

    Object.entries(MAP_LAYERS).forEach(([id, config]) => {
      try {
        if (config.wms) {
          // Create WMS layer
          initializedLayers[id] = L.tileLayer.wms(config.url, {
            layers: config.layers || '',
            format: config.format || 'image/png',
            transparent: config.transparent || false,
            version: config.version || '1.3.0',
            attribution: config.attribution,
            maxZoom: config.maxZoom,
            opacity: config.opacity || 1
          });
        } else {
          // Create regular tile layer
          initializedLayers[id] = L.tileLayer(config.url, {
            attribution: config.attribution,
            maxZoom: config.maxZoom,
            opacity: config.opacity || 1,
            tileSize: config.tileSize || 256
          });
        }
      } catch (error) {
        console.warn(`Failed to initialize layer ${id}:`, error);
      }
    });

    setLayers(initializedLayers);

    // Add default layer to map
    if (initializedLayers[DEFAULT_LAYER]) {
      initializedLayers[DEFAULT_LAYER].addTo(map);
    }
  }, [map]);

  const switchLayer = (layerId: string) => {
    if (!layers[layerId] || layerId === currentLayer) return;

    // Remove current layer
    if (layers[currentLayer] && map.hasLayer(layers[currentLayer])) {
      map.removeLayer(layers[currentLayer]);
    }

    // Add new layer
    try {
      layers[layerId].addTo(map);
      setCurrentLayer(layerId);
      setIsExpanded(false);

      if (onLayerChange) {
        onLayerChange(layerId);
      }

      console.log(`Switched to layer: ${MAP_LAYERS[layerId].name}`);
    } catch (error) {
      console.error(`Failed to switch to layer ${layerId}:`, error);

      // Fallback to default layer if switch fails
      if (layerId !== DEFAULT_LAYER && layers[DEFAULT_LAYER]) {
        layers[DEFAULT_LAYER].addTo(map);
        setCurrentLayer(DEFAULT_LAYER);
      }
    }
  };

  const currentLayerConfig = MAP_LAYERS[currentLayer];

  return (
    <div className={`absolute top-4 right-4 z-[1000] ${className}`}>
      <div className="bg-white/95 backdrop-blur-lg rounded-lg shadow-lg border border-gray-200/50 min-w-[200px]">
        {/* Current Layer Display */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50/80 rounded-lg transition-colors"
          title={LAYER_DESCRIPTIONS[currentLayer]}
        >
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-800 text-sm">
              {currentLayerConfig?.name || 'Base Map'}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {/* Layer Options */}
        {isExpanded && (
          <div className="border-t border-gray-200/50 py-2">
            <div className="px-2 space-y-1">
              {Object.entries(MAP_LAYERS).map(([id, config]) => (
                <button
                  key={id}
                  onClick={() => switchLayer(id)}
                  className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
                    id === currentLayer
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  title={LAYER_DESCRIPTIONS[id]}
                >
                  {config.name}
                </button>
              ))}
            </div>

            {/* Layer Info */}
            <div className="px-3 py-2 border-t border-gray-200/50 mt-2">
              <p className="text-xs text-gray-500 leading-relaxed">
                {LAYER_DESCRIPTIONS[currentLayer]}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}