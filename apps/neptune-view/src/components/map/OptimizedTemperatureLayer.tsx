/**
 * Optimized Temperature Layer Component
 *
 * Enhanced version of TemperatureHeatmapLayer with mobile performance optimizations:
 * - Viewport-based data filtering
 * - Zoom-level data reduction
 * - Debounced rendering
 * - Adaptive quality based on device capabilities
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import chroma from 'chroma-js';
import * as turf from '@turf/turf';
import 'leaflet.heat';
import {
  filterByViewport,
  reduceByZoom,
  useDebounce,
  getPerformanceConfig,
  isMobileDevice,
  useMapPerformance
} from '@/utils/mapPerformance';

// Type definitions for leaflet.heat
declare module 'leaflet' {
  namespace L {
    function heatLayer(latlngs: any[], options?: any): any;
  }
}

interface TemperatureData {
  lat: number;
  lon: number;
  temperature: number;
  timestamp?: string;
  source?: string;
}

interface OptimizedTemperatureLayerProps {
  data: TemperatureData[];
  visible: boolean;
  opacity?: number;
  showContours?: boolean;
  eezBoundary?: GeoJSON.Feature | null;
  showPerformanceMetrics?: boolean;
}

export function OptimizedTemperatureLayer({
  data,
  visible,
  opacity = 0.7,
  showContours = false,
  eezBoundary = null,
  showPerformanceMetrics = false
}: OptimizedTemperatureLayerProps) {
  const map = useMap();
  const [heatLayer, setHeatLayer] = useState<any | null>(null);
  const [viewport, setViewport] = useState(map.getBounds());
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  // Performance configuration and monitoring
  const config = getPerformanceConfig();
  const { fps, renderTime } = useMapPerformance({ current: map });
  const isMobile = isMobileDevice();

  // Debounced viewport for performance
  const debouncedViewport = useDebounce(viewport, config.debounceDelay);

  // Update viewport and zoom on map changes
  useEffect(() => {
    const updateMapState = () => {
      setViewport(map.getBounds());
      setCurrentZoom(map.getZoom());
    };

    map.on('moveend', updateMapState);
    map.on('zoomend', updateMapState);

    return () => {
      map.off('moveend', updateMapState);
      map.off('zoomend', updateMapState);
    };
  }, [map]);

  // Optimize data based on viewport and device
  const optimizedData = useMemo(() => {
    if (!data || data.length === 0 || !visible) return [];

    // Convert data format for filtering functions
    const dataWithLatLon = data.map(point => ({
      ...point,
      latitude: point.lat,
      longitude: point.lon
    }));

    // Step 1: Filter by viewport with padding
    const viewportFiltered = filterByViewport(dataWithLatLon, debouncedViewport, 0.2);

    // Step 2: Reduce based on zoom level
    const maxPoints = isMobile ? config.maxDataPoints / 4 : config.maxDataPoints / 2; // Use fewer points for temperature
    const zoomReduced = reduceByZoom(viewportFiltered, currentZoom, maxPoints);

    // Convert back to original format
    return zoomReduced.map(point => ({
      lat: point.latitude || point.lat,
      lon: point.longitude || point.lon,
      temperature: point.temperature,
      timestamp: point.timestamp,
      source: point.source
    }));
  }, [data, debouncedViewport, currentZoom, visible, isMobile, config.maxDataPoints]);

  // Adaptive quality settings based on device and performance
  const heatmapConfig = useMemo(() => {
    const baseConfig = {
      radius: isMobile ? 40 : 80,
      blur: isMobile ? 30 : 60,
      maxZoom: 18,
      max: 1.0,
      minOpacity: opacity * 0.4,
      gradient: {
        0.0:  '#0D0887',  // Deep purple-blue (viridis coldest)
        0.15: '#4506A9',  // Dark purple
        0.25: '#6A00A8',  // Purple
        0.35: '#900DA4',  // Purple-magenta
        0.45: '#B12A90',  // Magenta
        0.55: '#CC4778',  // Pink-red
        0.65: '#E16462',  // Coral
        0.75: '#F1844B',  // Orange-coral
        0.85: '#FCA636',  // Golden orange
        0.95: '#FCCE25',  // Yellow
        1.0:  '#F0F921'   // Bright yellow (viridis warmest)
      }
    };

    // Adjust based on current performance
    if (fps < 30 && fps > 0) {
      baseConfig.radius = Math.max(20, baseConfig.radius * 0.7);
      baseConfig.blur = Math.max(15, baseConfig.blur * 0.7);
    }

    return baseConfig;
  }, [isMobile, opacity, fps]);

  // Create and update heatmap layer
  useEffect(() => {
    if (!map || optimizedData.length === 0 || !visible) {
      if (heatLayer) {
        heatLayer.remove();
        setHeatLayer(null);
      }
      return;
    }

    // Remove existing layer
    if (heatLayer) {
      heatLayer.remove();
      setHeatLayer(null);
    }

    // Filter data within EEZ boundary if provided
    let filteredData = optimizedData;
    if (eezBoundary && eezBoundary.geometry) {
      filteredData = optimizedData.filter(point => {
        const pointFeature = turf.point([point.lon, point.lat]);
        try {
          return turf.booleanPointInPolygon(pointFeature, eezBoundary as any);
        } catch (e) {
          return false;
        }
      });
    }

    // Calculate temperature range
    const temperatures = filteredData.map(p => p.temperature);
    if (temperatures.length === 0) return;

    const actualMin = Math.min(...temperatures);
    const actualMax = Math.max(...temperatures);
    const rangeMin = Math.min(actualMin, 18.0);
    const rangeMax = Math.max(actualMax, 30.0);

    // Prepare heatmap points with normalization
    const heatPoints: [number, number, number][] = filteredData.map(point => {
      const normalized = Math.max(0.1, Math.min(1.0, (point.temperature - rangeMin) / (rangeMax - rangeMin)));
      return [point.lat, point.lon, normalized];
    });

    // Create new heatmap layer
    try {
      const newHeatLayer = L.heatLayer(heatPoints, heatmapConfig);
      newHeatLayer.addTo(map);
      setHeatLayer(newHeatLayer);
    } catch (error) {
      console.error('Error creating optimized heatmap layer:', error);
    }

    // Cleanup
    return () => {
      if (heatLayer) {
        heatLayer.remove();
      }
    };
  }, [map, optimizedData, visible, eezBoundary, heatmapConfig]);

  // Performance metrics display (development only)
  if (showPerformanceMetrics && process.env.NODE_ENV === 'development') {
    return (
      <div className="absolute top-24 left-4 z-[1000] bg-black/80 text-white p-2 rounded text-xs space-y-1">
        <div className="font-bold text-yellow-400">Temperature Layer</div>
        <div>FPS: <span className={fps < 30 ? 'text-red-400' : 'text-green-400'}>{fps}</span></div>
        <div>Render: {renderTime}ms</div>
        <div>Points: {optimizedData.length}/{data.length}</div>
        <div>Zoom: {currentZoom}</div>
        <div>Device: {isMobile ? 'Mobile' : 'Desktop'}</div>
        <div>Quality: {heatmapConfig.radius}px radius</div>
      </div>
    );
  }

  return null;
}

/**
 * Optimized Temperature Legend Component
 */
interface OptimizedTemperatureLegendProps {
  visible?: boolean;
  minTemp?: number;
  maxTemp?: number;
  currentTemp?: number;
  isMobile?: boolean;
}

export function OptimizedTemperatureLegend({
  visible = true,
  minTemp = 18,
  maxTemp = 30,
  currentTemp,
  isMobile = false
}: OptimizedTemperatureLegendProps) {
  if (!visible) return null;

  const scale = isMobile ? [
    { temp: '18°C', color: '#0D0887' },
    { temp: '22°C', color: '#B12A90' },
    { temp: '26°C', color: '#FCA636' },
    { temp: '30°C', color: '#F0F921' }
  ] : [
    { temp: '18°C', color: '#0D0887' },
    { temp: '20°C', color: '#4506A9' },
    { temp: '22°C', color: '#B12A90' },
    { temp: '24°C', color: '#E16462' },
    { temp: '26°C', color: '#FCA636' },
    { temp: '28°C', color: '#FCCE25' },
    { temp: '30°C', color: '#F0F921' }
  ];

  return (
    <div className={`absolute ${isMobile ? 'bottom-2 right-2' : 'bottom-4 right-4'}
      bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg
      ${isMobile ? 'p-2' : 'p-3'} shadow-lg z-[999]`}>
      <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold mb-2
        text-gray-800 dark:text-gray-200`}>
        SST (°C)
      </h4>

      <div className={`${isMobile ? 'space-y-0.5' : 'space-y-1'}`}>
        {scale.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded
                border border-gray-300 dark:border-gray-600`}
              style={{ backgroundColor: item.color }}
            />
            <span className={`${isMobile ? 'text-[10px]' : 'text-xs'}
              text-gray-700 dark:text-gray-300`}>
              {item.temp}
            </span>
          </div>
        ))}
      </div>

      {currentTemp && (
        <div className={`${isMobile ? 'mt-1 pt-1' : 'mt-2 pt-2'}
          border-t border-gray-200 dark:border-gray-700`}>
          <div className={`${isMobile ? 'text-[10px]' : 'text-xs'}
            text-gray-600 dark:text-gray-400`}>
            Current: <span className="font-semibold">{currentTemp.toFixed(1)}°C</span>
          </div>
        </div>
      )}
    </div>
  );
}