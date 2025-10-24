'use client';

import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAP_LAYERS, DEFAULT_LAYER, LAYER_DESCRIPTIONS } from '@/lib/map-layers';
import { ChevronDown, ChevronUp, Map, AlertCircle, RefreshCw } from 'lucide-react';

interface BaseMapSelectorProps {
  onLayerChange?: (layerId: string) => void;
  className?: string;
}

export function ImprovedBaseMapSelector({ onLayerChange, className = '' }: BaseMapSelectorProps) {
  const map = useMap();
  const [currentLayer, setCurrentLayer] = useState<string>(DEFAULT_LAYER);
  const [isExpanded, setIsExpanded] = useState(false);
  const [layers, setLayers] = useState<Record<string, L.TileLayer | L.TileLayer.WMS>>({});
  const [loadingStatus, setLoadingStatus] = useState<Record<string, boolean>>({});
  const [errorTiles, setErrorTiles] = useState<Set<string>>(new Set());
  const retryTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize layers with improved error handling
  useEffect(() => {
    const initializedLayers: Record<string, L.TileLayer | L.TileLayer.WMS> = {};

    Object.entries(MAP_LAYERS).forEach(([id, config]) => {
      try {
        let layer: L.TileLayer | L.TileLayer.WMS;

        if (config.wms) {
          // Create WMS layer with error handling
          layer = L.tileLayer.wms(config.url, {
            layers: config.layers || '',
            format: config.format || 'image/png',
            transparent: config.transparent || false,
            version: config.version || '1.3.0',
            attribution: config.attribution,
            maxZoom: config.maxZoom,
            opacity: config.opacity || 1,
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
          });
        } else {
          // Create regular tile layer with retry mechanism
          layer = L.tileLayer(config.url, {
            attribution: config.attribution,
            maxZoom: config.maxZoom,
            opacity: config.opacity || 1,
            tileSize: config.tileSize || 256,
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            crossOrigin: true
          });
        }

        // Add tile loading event handlers
        layer.on('tileloadstart', () => {
          setLoadingStatus(prev => ({ ...prev, [id]: true }));
        });

        layer.on('tileload', () => {
          setLoadingStatus(prev => ({ ...prev, [id]: false }));
          // Remove from error tiles if it loaded successfully
          setErrorTiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        });

        layer.on('tileerror', (error: any) => {
          console.warn(`Tile loading error for ${id}:`, error);
          setErrorTiles(prev => new Set(prev).add(id));

          // Implement retry logic with exponential backoff
          const retryCount = (layer as any).__retryCount || 0;
          if (retryCount < 3) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);

            if (retryTimeouts.current[id]) {
              clearTimeout(retryTimeouts.current[id]);
            }

            retryTimeouts.current[id] = setTimeout(() => {
              console.log(`Retrying tile load for ${id} (attempt ${retryCount + 1})`);
              (layer as any).__retryCount = retryCount + 1;
              layer.redraw();
            }, delay);
          }
        });

        initializedLayers[id] = layer;
      } catch (error) {
        console.error(`Failed to initialize layer ${id}:`, error);
      }
    });

    setLayers(initializedLayers);

    // Add default layer to map with proper error handling
    if (initializedLayers[DEFAULT_LAYER]) {
      try {
        initializedLayers[DEFAULT_LAYER].addTo(map);
        // Force initial tile load
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      } catch (error) {
        console.error('Failed to add default layer:', error);
      }
    }

    // Cleanup function
    return () => {
      Object.values(retryTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, [map]);

  // Add map event handlers to prevent data loss
  useEffect(() => {
    const handleMoveEnd = () => {
      // Ensure layers are still visible after move
      if (layers[currentLayer] && !map.hasLayer(layers[currentLayer])) {
        console.log('Re-adding layer after map move');
        layers[currentLayer].addTo(map);
      }
    };

    const handleZoomEnd = () => {
      // Force redraw on zoom to ensure tiles load
      if (layers[currentLayer]) {
        layers[currentLayer].redraw();
      }
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, layers, currentLayer]);

  const switchLayer = (layerId: string) => {
    if (!layers[layerId] || layerId === currentLayer) return;

    // Remove current layer
    if (layers[currentLayer] && map.hasLayer(layers[currentLayer])) {
      try {
        map.removeLayer(layers[currentLayer]);
      } catch (error) {
        console.warn('Error removing layer:', error);
      }
    }

    // Add new layer with error recovery
    try {
      layers[layerId].addTo(map);
      setCurrentLayer(layerId);
      setIsExpanded(false);

      // Reset retry count for new layer
      (layers[layerId] as any).__retryCount = 0;

      // Force tile reload
      setTimeout(() => {
        map.invalidateSize();
        layers[layerId].redraw();
      }, 100);

      if (onLayerChange) {
        onLayerChange(layerId);
      }

      console.log(`Switched to layer: ${MAP_LAYERS[layerId].name}`);
    } catch (error) {
      console.error(`Failed to switch to layer ${layerId}:`, error);

      // Fallback to default layer if switch fails
      if (layerId !== DEFAULT_LAYER && layers[DEFAULT_LAYER]) {
        try {
          layers[DEFAULT_LAYER].addTo(map);
          setCurrentLayer(DEFAULT_LAYER);
        } catch (fallbackError) {
          console.error('Failed to fallback to default layer:', fallbackError);
        }
      }
    }
  };

  const retryCurrentLayer = () => {
    if (layers[currentLayer]) {
      console.log('Manually retrying layer:', currentLayer);
      (layers[currentLayer] as any).__retryCount = 0;
      layers[currentLayer].redraw();
      map.invalidateSize();
    }
  };

  const currentLayerConfig = MAP_LAYERS[currentLayer];
  const hasError = errorTiles.has(currentLayer);
  const isLoading = loadingStatus[currentLayer];

  return (
    <div className={`absolute top-4 right-4 z-[1000] ${className}`}>
      <div className="bg-white/95 backdrop-blur-lg rounded-lg shadow-lg border border-gray-200/50 min-w-[220px]">
        {/* Current Layer Display with Status */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50/80 rounded-lg transition-colors"
          title={LAYER_DESCRIPTIONS[currentLayer]}
        >
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {currentLayerConfig?.name || 'Unknown'}
            </span>
            {isLoading && (
              <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
            )}
            {hasError && !isLoading && (
              <AlertCircle className="w-3 h-3 text-orange-500" />
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {/* Error Recovery Button */}
        {hasError && !isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              retryCurrentLayer();
            }}
            className="w-full px-4 py-2 flex items-center justify-center gap-2 text-xs text-orange-600 hover:bg-orange-50 transition-colors border-t border-gray-200"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Loading Tiles
          </button>
        )}

        {/* Layer Options */}
        {isExpanded && (
          <div className="border-t border-gray-200">
            {Object.entries(MAP_LAYERS).map(([id, config]) => (
              <button
                key={id}
                onClick={() => switchLayer(id)}
                className={`w-full px-4 py-2.5 text-left hover:bg-gray-50/80 transition-colors flex items-center justify-between ${
                  id === currentLayer ? 'bg-blue-50/80 text-blue-700' : 'text-gray-700'
                }`}
                title={LAYER_DESCRIPTIONS[id]}
              >
                <span className="text-sm flex items-center gap-2">
                  {config.name}
                  {loadingStatus[id] && (
                    <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                  )}
                  {errorTiles.has(id) && !loadingStatus[id] && (
                    <AlertCircle className="w-3 h-3 text-orange-500" />
                  )}
                </span>
                {id === currentLayer && (
                  <span className="text-xs text-blue-600">Active</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status Information */}
      {(isLoading || hasError) && (
        <div className="mt-2 bg-white/95 backdrop-blur-lg rounded-lg shadow-lg border border-gray-200/50 px-3 py-2">
          {isLoading && (
            <p className="text-xs text-blue-600 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Loading map tiles...
            </p>
          )}
          {hasError && !isLoading && (
            <p className="text-xs text-orange-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Some tiles failed to load
            </p>
          )}
        </div>
      )}
    </div>
  );
}